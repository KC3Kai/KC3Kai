(function(){
	"use strict";
	_gaq.push(['_trackEvent', "Panel: Plain Theme", 'clicked']);
	
	// Flags
	var currentLayout = "";
	var isRunning = false;
	
	// Interface values
	var selectedFleet = 1;
	var selectedExpedition = 1;
	var plannerIsGreatSuccess = false;

	// a flag used by Fleet & ExpeditionStart to indicate
	// whether a fleet info update is triggered because of
	// sending out fleets.
	var expeditionStarted = false;
	
	// Auto Focus Overriding
	var overrideFocus = false;
	
	// Critical Animation and Sound Effect
	var critAnim = false;
	var critSound = new Audio("../../../../assets/snd/heart.mp3");
	critSound.loop = true;
	
	// Morale Timer
	var moraleClockValue = 100;
	var moraleClockEnd = 0;
	var moraleClockRemain = 0;
	
	// Experience Calculation
	var mapexp = [], maplist = {}, rankFactors = [0, 0.5, 0.7, 0.8, 1, 1, 1.2];

	// make sure localStorage.expedTab is available
	// and is in correct format.
	// returns the configuration for expedTab
	// (previously called localStorage.expedTabLastPick)
	function ExpedTabValidateConfig() {
		// data format for expedTab:
		// data.fleetConf: an object
		// data.fleetConf[fleetNum]:
		// * fleetNum: 1,2,3,4
		// * fleetNum could be either number or string
		//	 they will all be implicitly converted
		//	 to string (for indexing object) anyway
		// data.fleetConf[fleetNum].expedition: a number
		// data.expedConf: an object
		// data.expedConf[expedNum]:
		// * expedNum: 1..40
		// * expedNum is number or string, just like fleetNum
		// data.expedConf[expedNum].greatSuccess: boolean

		var data;
		if (! localStorage.expedTab) {
			data = {};
			data.fleetConf = {};
			var i;
			for (i=1; i<=4; ++i) {
				data.fleetConf[i] = { expedition: 1 };
			}
			data.expedConf = {};
			for (i=1; i<=40; ++i) {
				data.expedConf[i] = { greatSuccess: false };
			}

			localStorage.expedTab = JSON.stringify( data );
		} else {
			data = JSON.parse( localStorage.expedTab );
		}
		return data;
	}

	// selectedExpedition, plannerIsGreatSuccess + selectedFleet => storage
	function ExpedTabUpdateConfig() {
		var conf = ExpedTabValidateConfig();
		conf.fleetConf[ selectedFleet ].expedition = selectedExpedition;
		conf.expedConf[ selectedExpedition ].greatSuccess = plannerIsGreatSuccess;
		localStorage.expedTab = JSON.stringify( conf );
	}

	// apply stored user settings, note that this function
	// is not responsible for updating UI, so UpdateExpeditionPlanner() should be called after
	// this to reflect the change
	// storage + selectedFleet => selectedExpedition, plannerIsGreatSuccess
	function ExpedTabApplyConfig() {
		var conf = ExpedTabValidateConfig();
		selectedExpedition = conf.fleetConf[selectedFleet].expedition;
		plannerIsGreatSuccess = conf.expedConf[ selectedExpedition ].greatSuccess;
	}

	function ExpedTabAutoFleetSwitch(needTabSwith) {
		// set "needTabSwitch" to true
		// for switching to expedition tab when a candidate fleet is found
		var fleets = PlayerManager.fleets;
		var availableFleetInd = -1;

		// if combined fleet is in use, the second fleet is not available
		// so we can skip it

		// start from the 2nd fleet (or 3rd if we have a combined fleet)
		var fleetStartInd = (PlayerManager.combinedFleet !== 0) ? 2 : 1;

		for (var i = fleetStartInd; i < 4; ++i) {
			// find one available fleet
			if (fleets[i].missionOK()) {
				availableFleetInd = i;
				break;
			}
		}

		function switchToFleet(targetFleet) {
			var fleetControls = $(".module.controls .fleet_num").toArray();
			for (var i=0; i<fleetControls.length; ++i) {
				var thisFleet = parseInt( $(fleetControls[i]).text(), 10);
				if (thisFleet === targetFleet) {
					$( fleetControls[i] ).trigger("click");
					break;
				}
			}
		}

		if (availableFleetInd !== -1) {
			selectedFleet = availableFleetInd + 1;
			console.log("Find available fleet: " + String(selectedFleet));

			if (needTabSwith)
				$("#atab_expeditionPlanner").trigger("click");
			
			switchToFleet(availableFleetInd+1);
		} else {
			// knowing fleets are all unavailable
			// we can return focus to the main fleet.
			switchToFleet(1);
			// also return focus to basic tab
			$("#atab_basic").trigger("click");
		}
	}
	
	$(document).on("ready", function(){
		// Check localStorage
		if(!window.localStorage){
			$("#wait").hide();
			$("<div>").css({
				"width" : "450px",
				"padding" : "15px 20px",
				"background" : "#fcc",
				"border-radius" : "10px",
				"margin" : "30px auto 0px",
				"text-align" : "center",
				"font-weight" : "bold",
				"font-size" : "12px",
				"border" : "1px solid #c77"
			}).html( KC3Meta.term("PanelErrorStorage") ).appendTo("body");
			return true;
		}
		
		// Initialize data managers
		ConfigManager.load();
		KC3Master.init();
		RemodelDb.init();
		WhoCallsTheFleetDb.init("../../../../");
		KC3Meta.init("../../../../data/");
		KC3Meta.defaultIcon("../../../../assets/img/ui/empty.png");
		KC3Meta.loadQuotes();
		PlayerManager.init();
		KC3ShipManager.load();
		KC3GearManager.load();
		KC3SortieManager.load();
		KC3Database.init();
		KC3Translation.execute();
		KC3QuestSync.init();
		
		// Live translations
		if(ConfigManager.checkLiveQuests && ConfigManager.language=="en"){
			$.ajax({
				dataType: "JSON",
				url: "https://raw.githubusercontent.com/KC3Kai/kc3-translations/master/data/"+ConfigManager.language+"/quests.json?v="+(Date.now()),
				success: function(newQuestTLs){
					if(JSON.stringify(newQuestTLs) != JSON.stringify(KC3Meta._quests)){
						console.log("new quests detected, updating quest list from live");
						var enQuests = JSON.parse($.ajax({
							url : '../../../../data/lang/data/en/quests.json',
							async: false
						}).responseText);
							
						KC3Meta._quests = $.extend(true, enQuests, newQuestTLs);
						console.log(KC3Meta._quests);
					}else{
						console.log("no new quests...");
					}
				}
			});
		}
		
		// Get map exp rewards
		mapexp = JSON.parse($.ajax({
			url : '../../../../data/exp_map.json',
			async: false
		}).responseText);
		
		$.each(mapexp, function(worldNum, mapNums){
			$.each(mapNums, function(mapNum, mapExp){
				if(mapExp > 0){
					maplist[worldNum+"-"+(mapNum+1)] = mapExp;
				}
			});
		});
		
		// Panel customizations: panel opacity
		$(".wrapper_bg").css("opacity", ConfigManager.pan_opacity/100);
		
		// Panel customizations: bg image
		if(ConfigManager.pan_bg_image === ""){
			$("body").css("background", ConfigManager.pan_bg_color);
		}else{
			$("body").css("background-image", "url("+ConfigManager.pan_bg_image+")");
			$("body").css("background-color", ConfigManager.pan_bg_color);
			$("body").css("background-size", ConfigManager.pan_bg_size);
			$("body").css("background-position", ConfigManager.pan_bg_position);
			$("body").css("background-repeat", "no-repeat");
		}
		
		// Panel customizations: custom css
		if(ConfigManager.pan_custom_css !== ""){
			var customCSS = document.createElement("style");
			customCSS.type = "text/css";
			customCSS.innerHTML = ConfigManager.pan_custom_css;
			$("head").append(customCSS);
		}

		// Close CatBomb modal
		$(".modalBox").on("click", ".closebtn", function(){
			$(this).parent().parent().fadeOut(300);
		});
		
		// HQ name censoring
		$(".admiral_name").on("click", function(){
			if($(this).hasClass("censor")){
				$(this).removeClass("censor");
			}else{
				$(this).addClass("censor");
			}
		});
		
		// HQ Exp Toggle
		$(".admiral_lvnext").on("click",function(){
			ConfigManager.scrollHQExpInfo();
			NatsuiroListeners.HQ();
		});
		
		// Switch Rank Title vs Rank Points Counter
		$(".admiral_rank").on("click",function(){
			// If title, switch to points
			if($(this).data("mode")==1){
				$(this).text(PlayerManager.hq.getRankPoints().toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +KC3Meta.term("HQRankPoints"));
				$(this).data("mode", 0);
				
			// If points, switch to title
			}else{
				$(this).text(PlayerManager.hq.rank);
				$(this).data("mode", 1);
			}
		});
		
		// eLoS Toggle
		$(".summary-eqlos").on("click",function(){
			ConfigManager.scrollElosMode();
			$(".summary-eqlos img").attr("src", "../../../../assets/img/stats/los"+ConfigManager.elosFormula+".png"); 
			$(".summary-eqlos .summary_text").text( Math.qckInt("floor", ((selectedFleet < 5) ? PlayerManager.fleets[selectedFleet-1].eLoS() : PlayerManager.fleets[0].eLoS()+PlayerManager.fleets[1].eLoS()), 1) );
		}).addClass("hover");
		
		// Fighter Power Toggle
		$(".summary-airfp").on("click",function(){
			ConfigManager.scrollFighterPowerMode();
			$(".summary-airfp .summary_text").text( (selectedFleet < 5) ? PlayerManager.fleets[selectedFleet-1].fighterPowerText() : PlayerManager.fleets[0].fighterPowerText() );
		}).addClass("hover");
		
		// Timer Type Toggle
		$(".status_docking,.status_akashi").on("click",function(){
			ConfigManager.scrollTimerType();
			UpdateRepairTimerDisplays();
		}).addClass("hover");
		
		// Screenshot buttons
		$(".module.controls .btn_ss1").on("click", function(){
			$(this).hide();
			
			// Tell service to pass a message to gamescreen on inspected window to get a screenshot
			(new RMsg("service", "screenshot", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				playerName: PlayerManager.hq.name
			}, function(response){
				$(".module.controls .btn_ss1").show();
			})).execute();
		});
		
		// Export button
		$(".module.controls .btn_export").on("click", function(){
			window.open("http://www.kancolle-calc.net/deckbuilder.html?predeck=".concat(encodeURI(
				JSON.stringify(PlayerManager.prepareDeckbuilder())
				)));
		});
		
		/* Morale timers
		- use end time difference not remaining decrements for accuracy against lag
		--------------------------------------------*/
		window.KC3DevtoolsMoraleTimer = setInterval(function(){
			// console.log(moraleClockValue, moraleClockEnd, moraleClockRemain);
			if(moraleClockEnd > 0){
				moraleClockRemain = Math.ceil( (moraleClockEnd - (new Date()).getTime())/1000);
				if(moraleClockRemain > 0){
					$(".module.status .status_morale .status_text").text("~"+(moraleClockRemain+"").toHHMMSS());
					
				}else{
					moraleClockValue = 100;
					moraleClockEnd = 0;
					moraleClockRemain = 0;
					$(".module.status .status_morale .status_text").text(KC3Meta.term("PanelRecoveredMorale"));
					
					// Morale Notification
					if(ConfigManager.alert_morale_notif){
						// Play sound
						if(KC3TimerManager.notifSound){ KC3TimerManager.notifSound.pause(); }
						switch(ConfigManager.alert_type){
							case 1: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/pop.mp3"); break;
							case 2: KC3TimerManager.notifSound = new Audio(ConfigManager.alert_custom); break; 
							case 3: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/ding.mp3"); break; 
							default: KC3TimerManager.notifSound = false; break;
						}
						if(KC3TimerManager.notifSound){
							KC3TimerManager.notifSound.volume = ConfigManager.alert_volume / 100;
							KC3TimerManager.notifSound.play();
						}
						// Desktop notif regardless of settings, we consider Morale Notif as "yes"
						(new RMsg("service", "notify_desktop", {
							notifId: "morale",
							data: {
								type: "basic",
								title: KC3Meta.term("DesktopNotifyMoraleTitle"),
								message: KC3Meta.term("DesktopNotifyMoraleMessage"),
								iconUrl: "../../assets/img/ui/morale.png"
							}
						})).execute();
					}
				}
			}
		}, 1000);
		
		// Fleet selection
		$(".module.controls .fleet_num").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(".module.controls .fleet_rengo").removeClass("active");
			$(this).addClass("active");
			selectedFleet = parseInt( $(this).text(), 10);
			NatsuiroListeners.Fleet();
			ExpedTabApplyConfig();
			NatsuiroListeners.UpdateExpeditionPlanner();
		});
		
		// Combined Fleet button
		$(".module.controls .fleet_rengo").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(this).addClass("active");
			selectedFleet = 5;
			NatsuiroListeners.Fleet();
		});
		
		// Toggle mini-bars under combined fleet ship list
		$(".module.fleet .shiplist_combined").on("click", ".sship .ship_bars", function(){
			if($(this).css("opacity") == "0"){
				$(".module.fleet .sship .ship_bars").css("opacity", "1");
			}else{
				$(".module.fleet .sship .ship_bars").css("opacity", "0");
			}
		});
		
		// Resize window to 800x480
		$(".module.controls .btn_resize").on("click", function(){
			// Send fit-screen request to service to be forwarded to gameplay page
			(new RMsg("service", "fitScreen", {
				tabId: chrome.devtools.inspectedWindow.tabId
			})).execute();
		});
		
		// Mute button
		$(".module.controls .btn_mute").on("click", function(){
			// Send toggle sound request to service to be forwarded to gameplay page
			(new RMsg("service", "toggleSounds", {
				tabId: chrome.devtools.inspectedWindow.tabId
			},function(isMuted){
				if(isMuted){
					$(".module.controls .btn_mute img").attr("src", "img/mute-x.png");
				}else{
					$(".module.controls .btn_mute img").attr("src", "img/mute.png");
				}
			})).execute();
		});
		
		// Trigger initial selected fleet num
		$(".module.controls .fleet_num.active").trigger("click");
		
		// Initialize timer objects with bindings to their UI
		KC3TimerManager.init([
			$(".module.activity .expedition_1"),
			$(".module.activity .expedition_2"),
			$(".module.activity .expedition_3")
		],
		[
			$(".module.activity .repair_1"),
			$(".module.activity .repair_2"),
			$(".module.activity .repair_3"),
			$(".module.activity .repair_4")
		],
		[
			$(".module.activity .build_1"),
			$(".module.activity .build_2"),
			$(".module.activity .build_3"),
			$(".module.activity .build_4")
		]);
		
		// Update Timer UIs
		window.KC3DevtoolsUiTimers = setInterval(function(){
			// Basic Timer Stat
			KC3TimerManager.update();
			
			// Docking ~ Akashi Timer Stat
			var TotalFleet = selectedFleet == 5 ? [0,1] : [selectedFleet-1];
			var data = TotalFleet
				.map(function(x){return PlayerManager.fleets[x].highestRepairTimes(true);})
				.reduce(function(pre,cur){
					var data = {};
					$.extend(pre,data);
					Object.keys(pre).forEach(function(k){
						data[k] = Math.max(pre[k],cur[k]);
					});
					return data;
				});
			UpdateRepairTimerDisplays(data);
			
			// Akashi current
			var baseElement = (TotalFleet.length > 1) ? ['main','escort'] : ['single'];
			baseElement.forEach(function(baseKey,index){
				var baseContainer = $([".shiplist",baseKey].join('_'));
				
				$(".sship,.lship",baseContainer).each(function(index,shipBox){
					var repairBox = $('.ship_repair_data',shipBox);
					
				var
					shipData = KC3ShipManager.get(repairBox.data('sid')),
					hpLost = shipData.hp[1] - shipData.hp[0],
					dockTime = shipData.repair[0],
					repairProgress = PlayerManager.akashiRepair.getProgress(dockTime, hpLost);
					
					$('.ship_repair_tick', shipBox).attr('data-tick', repairProgress.repairedHp);
					$('.ship_repair_timer', shipBox).text(
						(function (t) {
							if (t === 0) {
								return '--:--:--';
							} else if (!t || Number.isNaN(parseInt(t))) {
								return '??:??:??';
							}
							return Math.ceil(t / 1000).toString().toHHMMSS();
						})(repairProgress.timeToNextRepair)
					);
				});
			});
		}, 1000);
		
		// Devbuild: auto-activate dashboard while designing
		//Activate();
		
		// Start Network listener
		KC3Network.addGlobalListener(function(event, data){
			if(isRunning || event == "HomeScreen" || event == "GameStart"){
				if(typeof NatsuiroListeners[event] != "undefined"){
					NatsuiroListeners[event](data);
				}
			}
		});
		KC3Network.listen();
		
		// Get if inspected tab is muted, and update the mute icon
		(new RMsg("service", "isMuted", {
			tabId: chrome.devtools.inspectedWindow.tabId
		}, function(isMuted){
			if(isMuted){
				$(".module.controls .btn_mute img").attr("src", "img/mute-x.png");
			}
		})).execute();
		
		// Attempt to activate game on inspected window
		(new RMsg("service", "activateGame", {
			tabId: chrome.devtools.inspectedWindow.tabId
		})).execute();
		
		// Waiting for actions
		$("<div>").css({
			"width" : "300px",
			"height" : "50px",
			"line-height" : "50px",
			"background" : "#fff",
			"border-radius" : "10px",
			"margin" : "30px auto 0px",
			"text-align" : "center",
			"font-weight" : "bold",
			"font-size" : "14px"
		}).addClass("waitingForActions").html( KC3Meta.term("PanelWaitActions") ).appendTo("body");
		
		// Last minute translations
		$(".module.activity .plane_count.fighter_ally").attr("title", KC3Meta.term("PanelPlanesFighter") );
		$(".module.activity .plane_count.fighter_enemy").attr("title", KC3Meta.term("PanelPlanesFighter") );
		$(".module.activity .plane_count.bomber_ally").attr("title", KC3Meta.term("PanelPlanesBomber") );
		$(".module.activity .plane_count.bomber_enemy").attr("title", KC3Meta.term("PanelPlanesBomber") );
	});
	
	$(window).on("resize", function(){
		Orientation();
	});
	
	function Activate(){
		isRunning = true;
		Orientation();
		$(".waitingForActions").hide();
		$(".wrapper").show();
	}
	
	function Orientation(){
		if(!isRunning){ return false; }
		
		// Wide interface, switch to vertical if not yet
		if( $(window).width() >= 800 && currentLayout != "vertical" ){
			$(".wrapper").removeClass("h").addClass("v");
			
		// Narrow interface, switch to horizontal if not yet
		}else if( $(window).width() < 800 && currentLayout != "horizontal" ){
			$(".wrapper").removeClass("v").addClass("h");
		}
	}
	
	function clearSortieData(){
		$(".module.activity .activity_battle").css("opacity", "0.25");
		$(".module.activity .map_world").text("");
		$(".module.activity .map_gauge_bar").css("width", "0px");
		$(".module.activity .map_hp").text("");
		$(".module.activity .sortie_node").text("");
		$(".module.activity .sortie_node")
			.removeClass("nc_battle")
			.removeClass("nc_resource")
			.removeClass("nc_maelstrom")
			.removeClass("nc_select")
			.removeClass("nc_avoid");
		$(".module.activity .node_types").hide();
		$(".battle_support,.battle_drop",".module.activity").find('img')
			.css("visibility","");
		$(".admiral_lvnext")
			.attr("data-exp-gain","");
	}
	
	function clearBattleData(){
		$(".module.activity .abyss_ship img").attr("src", KC3Meta.abyssIcon(-1));
		$(".module.activity .abyss_ship img").attr("title", "");
		$(".module.activity .abyss_ship").css("opacity", 1);
		$(".module.activity .abyss_ship").hide();
		$(".module.activity .abyss_hp").hide();
		$(".module.activity .battle_eformation img").attr("src", "../../../../assets/img/ui/empty.png");
		$(".module.activity .battle_eformation").attr("title", "");
		$(".module.activity .battle_eformation").css("-webkit-transform", "rotate(0deg)");
		$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support.png");
		$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
		$(".module.activity .battle_rating img").attr("src", "../../../../assets/img/ui/dark_rating.png").css("opacity", "");
		$(".module.activity .battle_drop img").attr("src", "../../../../assets/img/ui/dark_shipdrop.png");
		$(".module.activity .battle_drop").attr("title", "");
		$(".module.activity .battle_cond_value").text("");
		$(".module.activity .plane_text span").text("");
		$(".module.activity .sink_icons .sunk img").hide();
	}
	
	var NatsuiroListeners = {
		GameStart: function(data){ Activate(); },
		HomeScreen: function(data){
			Activate();
			clearSortieData();
			clearBattleData();
			if(!overrideFocus){
				$("#atab_basic").trigger("click");
			}else{
				overrideFocus = false;
			}
		},
		
		CatBomb: function(data){
			$("#catBomb").hide();
			$("#catBomb .title").html( data.title );
			$("#catBomb .description").html( data.message );
			$("#catBomb").fadeIn(300);
		},
		
		GameUpdate: function(data){
			console.log("GameUpdate triggered");
			$("#gameUpdate").hide();
			
			if(data[0] > 0 && data[1]>0){
				$("#gameUpdate .description a").html(KC3Meta.term("GameUpdateBoth").format(data[0], data[1]));
			}else if(data[0] > 0){
				$("#gameUpdate .description a").html(KC3Meta.term("GameUpdateShips").format(data[0]));
			}else{
				$("#gameUpdate .description a").html(KC3Meta.term("GameUpdateEquips").format(data[1]));
			}
			
			$("#gameUpdate").fadeIn(300);
		},
		
		HQ: function(data){
			$(".admiral_name").text( PlayerManager.hq.name );
			$(".admiral_comm").text( PlayerManager.hq.desc );
			$(".admiral_rank").text( PlayerManager.hq.rank );
			if($(".admiral_rank").data("mode")==1){
				$(".admiral_rank").text(PlayerManager.hq.rank);
			}else{
				$(".admiral_rank").text(PlayerManager.hq.getRankPoints().toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })+KC3Meta.term("HQRankPoints"));
			}
			$(".admiral_lvval").text( PlayerManager.hq.level );
			$(".admiral_lvbar").css({width: Math.round(PlayerManager.hq.exp[0]*58)+"px"});
			updateHQEXPGained($(".admiral_lvnext"));
		},
		
		Consumables: function(data){
			$(".count_fcoin").text( PlayerManager.consumables.fcoin );
			$(".count_buckets").text( PlayerManager.consumables.buckets );
			$(".count_screws").text( PlayerManager.consumables.screws );
			$(".count_torch").text( PlayerManager.consumables.torch );
			// $(".count_pike").text( PlayerManager.consumables.pike || "?" );
			// $(".count_saury").text( PlayerManager.consumables.saury || "?" );
		},
		
		ShipSlots: function(data){
			$(".count_ships").text( KC3ShipManager.count() ).each(function(){
				if((KC3ShipManager.max - KC3ShipManager.count()) < 5){
					$(this).addClass("danger");
				}else{
					$(this).removeClass("danger");
				}
			});
			$(".max_ships").text( "/"+ KC3ShipManager.max );
		},
		
		GearSlots: function(data){
			$(".count_gear").text( KC3GearManager.count() ).each(function(){
				if((KC3GearManager.max - KC3GearManager.count()) < 20){
					$(this).addClass("danger");
				}else{
					$(this).removeClass("danger");
				}
			});
			$(".max_gear").text( "/"+ KC3GearManager.max );
		},
		
		Timers: function(data){
			// Expedition numbers
			KC3TimerManager._exped[0].expnum();
			KC3TimerManager._exped[1].expnum();
			KC3TimerManager._exped[2].expnum();
			
			// Repair faces
			KC3TimerManager._repair[0].face();
			KC3TimerManager._repair[1].face();
			KC3TimerManager._repair[2].face();
			KC3TimerManager._repair[3].face();
			
			// Construction faces
			if(ConfigManager.info_face){
				KC3TimerManager._build[0].face();
				KC3TimerManager._build[1].face();
				KC3TimerManager._build[2].face();
				KC3TimerManager._build[3].face();
			}
		},
		
		/* QUESTS
		Triggered when quest list is updated
		---------------------------------------------*/
		Quests: function(data){
			KC3QuestManager.load();
			var questType, questBox;
			var toggleQuestFunc = function(){
				var quest = KC3QuestManager.get($(this).data("id"));
				if(quest.status == 2){
					console.info("Going to complete quest:", quest);
					quest.status = 3;
					KC3QuestManager.save();
					$(this).parent().addClass("complete");
				} else if(quest.status == 3){
					console.info("Going to open quest agin:", quest);
					quest.status = 2;
					KC3QuestManager.save();
					$(this).parent().removeClass("complete");
				} else {
					console.warn("Quest status invalid:", quest);
				}
			};
			$(".module.quests").html("");
			$.each(KC3QuestManager.getActives(), function(index, quest){
				questBox = $("#factory .quest").clone().appendTo(".module.quests");
				if(!quest.tracking){ questBox.addClass("untracked"); }
				$(".quest_color", questBox).css("background", quest.getColor() )
					.addClass("hover")
					.attr("title", KC3Meta.term("PanelToggleQuestComplete") )
					.data("id", quest.id)
					.click(toggleQuestFunc);
				if(quest.isComplete()){
					questBox.addClass("complete");
				}
				if(quest.meta){
					$(".quest_text", questBox).text( quest.meta().name );
					$(".quest_text", questBox).attr("title", "{0} {1}\n{2}".format(quest.meta().code, quest.meta().name, quest.meta().desc) );
					if(!!quest.meta().memo) {
						$(".quest_text", questBox).attr("title", "{0}\n{1}".format($(".quest_text", questBox).attr("title"), quest.meta().memo) );
					}
				}else{
					$(".quest_text", questBox).text( KC3Meta.term("UntranslatedQuest") );
					$(".quest_text", questBox).attr("title", KC3Meta.term("UntranslatedQuest") );
				}
				$(".quest_track", questBox).text( quest.outputShort() );
				$(".quest_track", questBox).attr("title", quest.outputShort(true) );
			});
		},
		
		/* FLEET
		Triggered when fleet data is changed
		---------------------------------------------*/
		Fleet: function(data){
			var FleetSummary, MainRepairs;
			$(".shiplist_single").html("");
			$(".shiplist_single").hide();
			$(".shiplist_combined_fleet").html("");
			$(".shiplist_combined").hide();
			
			// COMBINED
			if(selectedFleet==5){
				var MainFleet = PlayerManager.fleets[0];
				var EscortFleet = PlayerManager.fleets[1];
				
				// Show ships on main fleet
				$.each(MainFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".sship", rosterId))
							.commonElements()
							.defineShort( MainFleet )
							.appendTo(".module.fleet .shiplist_main");
					}
				});
				
				// Show ships on escort fleet
				$.each(EscortFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".sship", rosterId))
							.commonElements()
							.defineShort( EscortFleet )
							.appendTo(".module.fleet .shiplist_escort");
					}
				});
				
				// Show fleet containers on UI
				$(".shiplist_combined").show();
				
				// Calculate Highest Repair Times for status indicators
				MainRepairs = MainFleet.highestRepairTimes(true);
				var EscortRepairs = EscortFleet.highestRepairTimes(true);
				
				// Compile fleet attributes
				FleetSummary = {
					lv: MainFleet.totalLevel() + EscortFleet.totalLevel(),
					elos: Math.qckInt("floor", MainFleet.eLoS()+EscortFleet.eLoS(), 1),
					air: MainFleet.fighterPowerText(),
					speed:
						(MainFleet.fastFleet && EscortFleet.fastFleet)
						? KC3Meta.term("SpeedFast") : KC3Meta.term("SpeedSlow"),
					docking:
						Math.max(MainRepairs.docking,EscortRepairs.docking),
					akashi:
						Math.max(MainRepairs.akashi,EscortRepairs.akashi),
					hasTaiha: MainFleet.hasTaiha() || EscortFleet.hasTaiha(),
					taihaIndexes: MainFleet.getTaihas().concat( EscortFleet.getTaihas() ),
					supplied: MainFleet.isSupplied() && EscortFleet.isSupplied(),
					supplyCost: MainFleet.calcResupplyCost(),
					badState: [
						MainFleet.needsSupply(false)|| EscortFleet.needsSupply(false),
						MainFleet.needsSupply(true) || EscortFleet.needsSupply(true) ,
						MainFleet.ship(0).isTaiha(),
						EscortFleet.ship(0).isStriped()
					],
					lowestMorale:
						(MainFleet.lowestMorale() < EscortFleet.lowestMorale())
						? MainFleet.lowestMorale() : EscortFleet.lowestMorale(),
					supportPower: 0
				};
				var escortSupplyCost = EscortFleet.calcResupplyCost();
				FleetSummary.supplyCost.fuel += escortSupplyCost.fuel;
				FleetSummary.supplyCost.ammo += escortSupplyCost.ammo;
				FleetSummary.supplyCost.bauxite += escortSupplyCost.bauxite;
				
			// SINGLE
			}else{
				var CurrentFleet = PlayerManager.fleets[selectedFleet-1];
				
				// Calculate Highest Repair Times for status indicators
				MainRepairs = CurrentFleet.highestRepairTimes(true);
				
				// Show ships on selected fleet
				$.each(CurrentFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".lship", rosterId))
							.commonElements()
							.defineLong( CurrentFleet )
							.appendTo(".module.fleet .shiplist_single");
					}
				});
				
				// Show fleet containers on UI
				$(".shiplist_single").show();
				
				// Compile fleet attributes
				FleetSummary = {
					lv: CurrentFleet.totalLevel(),
					elos: Math.qckInt("floor", CurrentFleet.eLoS(), 1),
					air: CurrentFleet.fighterPowerText(),
					speed: CurrentFleet.speed(),
					docking: MainRepairs.docking,
					akashi: MainRepairs.akashi,
					hasTaiha: CurrentFleet.hasTaiha(),
					taihaIndexes: CurrentFleet.getTaihas(),
					supplied: CurrentFleet.isSupplied(),
					supplyCost: CurrentFleet.calcResupplyCost(),
					badState: [
						CurrentFleet.needsSupply(false) ||
						(!(KC3SortieManager.isOnSortie() && KC3SortieManager.fleetSent == selectedFleet)
						&& !CurrentFleet.isSupplied() && ConfigManager.alert_supply_exped && selectedFleet > 1 && selectedFleet < 5),//0
						CurrentFleet.needsSupply(true),//1
						CurrentFleet.ship(0).isTaiha(),//2
						false//3
					],
					lowestMorale: CurrentFleet.lowestMorale(),
					supportPower: CurrentFleet.supportPower()
				};
				
			}
			
			console.log(FleetSummary);
			
			// Fleet Summary Stats
			$(".summary-level .summary_text").text( FleetSummary.lv );
			$(".summary-eqlos .summary_text").text( FleetSummary.elos );
			$(".summary-airfp .summary_text").text( FleetSummary.air );
			$(".summary-speed .summary_text").text( FleetSummary.speed );
			
			// Expedition Timer Faces
			if(KC3TimerManager._exped.length > 0){
				KC3TimerManager._exped[0].faceId = PlayerManager.fleets[1].ship(0).masterId;
				KC3TimerManager._exped[1].faceId = PlayerManager.fleets[2].ship(0).masterId;
				KC3TimerManager._exped[2].faceId = PlayerManager.fleets[3].ship(0).masterId;
				KC3TimerManager._exped[0].face();
				KC3TimerManager._exped[1].face();
				KC3TimerManager._exped[2].face();
			}
			
			// Clear status reminder coloring
			$(".module.status .status_text").removeClass("good");
			$(".module.status .status_text").removeClass("bad");
			
			// If fleet status summary is enabled on settings
			if(ConfigManager.info_fleetstat){
				// STATUS: RESUPPLY
				if( (FleetSummary.supplied ||
					(KC3SortieManager.isOnSortie() &&
						KC3SortieManager.isFullySupplied() &&
						(KC3SortieManager.fleetSent == (PlayerManager.combinedFleet ? 1 : selectedFleet)))) &&
					(!FleetSummary.badState[0])
				){
					$(".module.status .status_supply .status_text").text( KC3Meta.term("PanelSupplied") );
					$(".module.status .status_supply img").attr("src", "../../../../assets/img/ui/check.png");
					$(".module.status .status_supply .status_text").addClass("good");
				}else{
					$(".module.status .status_supply .status_text").text(KC3Meta.term(
						FleetSummary.badState[1] ? "PanelEmptySupply" : 
							(FleetSummary.badState[0] ? "PanelUnderSupplied" : "PanelNotSupplied")
						));
					$(".module.status .status_supply img").attr("src", "../../../../assets/img/ui/sunk.png");
					$(".module.status .status_supply .status_text").addClass("bad");
				}
				$(".module.status .status_supply").attr("title",
					FleetSummary.supplied ? "": KC3Meta.term("PanelResupplyCosts").format(
						FleetSummary.supplyCost.fuel, FleetSummary.supplyCost.ammo, FleetSummary.supplyCost.bauxite
					)
				);
				
				// STATUS: MORALE
				if( FleetSummary.lowestMorale > 54 ){
					$(".module.status .status_morale .status_text").text( KC3Meta.term("PanelGreatMorale") );
					$(".module.status .status_morale .status_text").addClass("good");
					moraleClockValue = 100;
					moraleClockEnd = 0;
				}else if( FleetSummary.lowestMorale >= ConfigManager.alert_morale_value ){
					$(".module.status .status_morale .status_text").text( KC3Meta.term("PanelGoodMorale") );
					$(".module.status .status_morale .status_text").addClass("good");
					moraleClockValue = 100;
					moraleClockEnd = 0;
				}else{
					var MissingMorale = ConfigManager.alert_morale_value - FleetSummary.lowestMorale;
					var MoraleTime = (Math.ceil(MissingMorale/3)*3)*60;
					$(".module.status .status_morale .status_text").addClass("bad");
					
					if(FleetSummary.lowestMorale != moraleClockValue){
						// console.log("new morale time", FleetSummary.lowestMorale, MoraleTime);
						moraleClockValue = FleetSummary.lowestMorale;
						moraleClockEnd = (new Date()).getTime() + (MoraleTime*1000);
					}
					
				}
				
				// STATUS: MORALE ICON (independent from notification status)
				if( FleetSummary.lowestMorale > 49 ){
					$(".module.status .status_morale img").attr("src", "../../../../assets/img/client/morale/4.png");
				}else if( FleetSummary.lowestMorale > 39 ){
					$(".module.status .status_morale img").attr("src", "../../../../assets/img/client/morale/3.png");
				}else if( FleetSummary.lowestMorale > 19 ){
					$(".module.status .status_morale img").attr("src", "../../../../assets/img/client/morale/2.png");
				}else{
					$(".module.status .status_morale img").attr("src", "../../../../assets/img/client/morale/1.png");
				}
				
				// STATUS: TAIHA
				if( (FleetSummary.hasTaiha || FleetSummary.badState[2])
					&& !FleetSummary.taihaIndexes.equals([0]) // if not flagship only
					&& !FleetSummary.taihaIndexes.equals([0,0]) // if not flagship only for combined
					&& !KC3SortieManager.isPvP() // if PvP, no taiha alert
				){
					$(".module.status .status_repair .status_text").text( KC3Meta.term(
						(FleetSummary.badState[2] ? "PanelFSTaiha" : "PanelHasTaiha")
					) );
					$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/sunk.png");
					$(".module.status .status_repair .status_text").addClass("bad");
					
				// Escort Chuuha
				}else if (FleetSummary.badState[3]) {
					$(".module.status .status_repair .status_text").text( KC3Meta.term("PanelEscortChuuha") );
					$(".module.status .status_repair .status_text").addClass("bad");
					$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/sunk.png");
				}else{
					$(".module.status .status_repair .status_text").text( KC3Meta.term("PanelNoTaiha") );
					$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/check.png");
					$(".module.status .status_repair .status_text").addClass("good");
				}
				
				// STATUS: COMBINED
				if(selectedFleet==1 || selectedFleet==5){
					switch(Number(PlayerManager.combinedFleet)){
						case 1:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedCarrier") );
							break;
						case 2:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedSurface") );
							break;
						case 3:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedTransport") );
							break;
						default:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedNone") );
							break;
					}
					$(".module.status .status_butai").show();
					$(".module.status .status_support").hide();
				}else{
					$(".module.status .status_butai").hide();
					$(".module.status .status_support").show();
				}
				
				// STATUS: SUPPORT
				$(".module.status .status_support .status_text").text( FleetSummary.supportPower );
				
				// STATUS: REPAIRS
				UpdateRepairTimerDisplays(FleetSummary.docking, FleetSummary.akashi);
				$(".module.status .status_docking").attr("title", KC3Meta.term("PanelHighestDocking") );
				$(".module.status .status_akashi").attr("title", KC3Meta.term("PanelHighestAkashi") );
				$(".module.status .status_support").attr("title", KC3Meta.term("PanelSupportPower") );
			}else{
				$(".module.status").hide();
			}
			
			// TAIHA ALERT CHECK
			if (
				PlayerManager.fleets
					.filter (function(  x,  i) {
						var
							cf = PlayerManager.combinedFleet,
							fs = KC3SortieManager.fleetSent;
						return (cf&&fs===1) ? (i <= 1) : (i == fs-1);
					})
					.map    (function(  fldat) { return fldat.ships; })
					.reduce (function(  x,  y) { return x.concat(y); })
					.filter (function( shipId) { return shipId >= 0; })
					.map    (function( shipId) { return KC3ShipManager.get(shipId); })
					.some   (function( shpDat) {
						return shpDat.isTaiha();
					})
			) {
				if(ConfigManager.alert_taiha){
					$("#critical").show();
					if(critAnim){ clearInterval(critAnim); }
					critAnim = setInterval(function() {
						$("#critical").toggleClass("anim2");
					}, 500);
					critSound.play();
					
					(new RMsg("service", "taihaAlertStart", {
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
				}
			} else {
				if(critAnim){ clearInterval(critAnim); }
				$("#critical").hide();
				critSound.pause();
				
				(new RMsg("service", "taihaAlertStop", {
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
			}
			
			
			// FLEET BUTTONS RESUPPLY STATUSES
			$(".module.controls .fleet_num").each(function(i, element){
				$(element).removeClass("onExped needsSupply hasTaiha");
				if(!$(element).hasClass("active")){
					if(PlayerManager.fleets[i].isOnExped()){
						$(element).addClass("onExped");
					}
					if(!PlayerManager.fleets[i].isSupplied()){
						$(element).addClass("needsSupply");
					}
					if(PlayerManager.fleets[i].hasTaiha()){
						$(element).addClass("hasTaiha");
					}
				}
			});

			// whether this update is triggered because of sending expeditions
			if (expeditionStarted && ConfigManager.info_auto_exped_tab) {
				// clear flag
				expeditionStarted = false;

				// we'll try switching to the next available fleet if any
				ExpedTabAutoFleetSwitch(false);
			}
			NatsuiroListeners.UpdateExpeditionPlanner();
		},
		
		SortieStart: function(data){
			// Clear battle details box
			clearSortieData();
			
			// Show world map and difficulty
			$(".module.activity .map_world").text(
				(KC3SortieManager.map_world>10 ? 'E' : KC3SortieManager.map_world)
				+"-"
				+KC3SortieManager.map_num
				+((KC3SortieManager.map_world>10)
					?["",
					  KC3Meta.term("EventRankEasyAbbr"),
					  KC3Meta.term("EventRankNormalAbbr"),
					  KC3Meta.term("EventRankHardAbbr")]
					[ KC3SortieManager.map_difficulty ]
					:"")
			);
			
			// Map Gauge and status
			var AllMaps = JSON.parse(localStorage.maps);
			var thisMapId = "m"+KC3SortieManager.map_world+""+KC3SortieManager.map_num;
			var thisMap = AllMaps[thisMapId];
			
			if(typeof thisMap != "undefined"){
				if( thisMap.clear == 1){
					$(".module.activity .map_hp").text(KC3Meta.term("BattleMapCleared"));
				}else{
					// If HP-based gauge
					if(typeof thisMap.maxhp != "undefined"){
						$(".module.activity .map_hp").text( thisMap.curhp + " / " + thisMap.maxhp );
						$(".module.activity .map_gauge_bar").css("width", ((thisMap.curhp/thisMap.maxhp)*58)+"px");
						
					// If kill-based gauge
					}else{
						var totalKills = KC3Meta.gauge( thisMapId.replace("m","") );
						console.log("wm", KC3SortieManager.map_world, KC3SortieManager.map_num);
						console.log("thisMapId", thisMapId);
						console.log("KC3Meta", KC3Meta._gauges);
						console.log("totalKills", totalKills);
						var killsLeft = totalKills - thisMap.kills;
						if(totalKills){
							$(".module.activity .map_hp").text( killsLeft+" / "+totalKills+" kills");
							$(".module.activity .map_gauge_bar").css("width", ((killsLeft/totalKills)*58)+"px");
						}else{
							$(".module.activity .map_hp").text(KC3Meta.term("BattleMapNotClear"));
						}
					}
				}
			}else{
				$(".module.activity .map_hp").text(KC3Meta.term("BattleMapNoHpGauge"));
			}
			
			// Switch to battle tab
			$(".module.activity .activity_battle").css("opacity", 1);
			$("#atab_battle").trigger("click");
		},
		
		CompassResult: function(data){
			// Clear battle details box
			clearBattleData();
			
			var numNodes = KC3SortieManager.countNodes();
			var thisNode = KC3SortieManager.currentNode();
			var world = KC3SortieManager.map_world;
			var map = KC3SortieManager.map_num;
			var nodeId = KC3Meta.nodeLetter(world, map, thisNode.id );
			
			$(".module.activity .sortie_node_"+numNodes).text( nodeId );
			$(".module.activity .node_types").hide();
			
			$(".module.activity .abyss_ship").hide();
			$(".module.activity .abyss_hp").hide();
			
			$(".module.activity .node_type_text").removeClass("dud");
			$(".module.activity .node_type_text").removeClass("select");
			$(".module.activity .node_types").hide();
			
			// Swap fish and support icons
			$(".module.activity .battle_fish").hide();
			$(".module.activity .battle_support").show();
			
			console.log("natsuiro process node", thisNode);
			switch(thisNode.type){
				// Battle node
				case "battle":
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_battle");
					$(".module.activity .node_type_battle").show();
					break;
					
				// Resource node
				case "resource":
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_resource");
					$(".module.activity .node_type_resource").removeClass("node_type_maelstrom");
					$(".module.activity .node_type_resource .node_res_icon img").attr("src",
						thisNode.icon("../../../../assets/img/client/"));
					$(".module.activity .node_type_resource .node_res_text").text( thisNode.amount );
					$(".module.activity .node_type_resource").show();
					break;
					
				// Bounty node on 1-6
				case "bounty":
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_resource");
					$(".module.activity .node_type_resource").removeClass("node_type_maelstrom");
					$(".module.activity .node_type_resource .node_res_icon img").attr("src",
						thisNode.icon("../../../../assets/img/client/"));
					$(".module.activity .node_type_resource .node_res_text").text( thisNode.amount );
					$(".module.activity .node_type_resource").show();
					break;
					
				// Maelstrom node
				case "maelstrom":
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_maelstrom");
					$(".module.activity .node_type_resource").addClass("node_type_maelstrom");
					$(".module.activity .node_type_resource .node_res_icon img").attr("src",
						thisNode.icon("../../../../assets/img/client/"));
					$(".module.activity .node_type_resource .node_res_text").text( -thisNode.amount );
					$(".module.activity .node_type_resource").show();
					break;
					
				// Selection node
				case "select":
					console.log("natsuiro should show selection node");
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_select");
					$(".module.activity .node_type_text").text(KC3Meta.term("BattleSelect")+
						KC3Meta.term("BattleSelectNodes").format(thisNode.choices[0], thisNode.choices[1]));
					$(".module.activity .node_type_text").addClass("select");
					$(".module.activity .node_type_text").show();
					break;
					
				// Battle avoided node
				default:
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_avoid");
					$(".module.activity .node_type_text").text(KC3Meta.term("BattleAvoided"));
					$(".module.activity .node_type_text").addClass("dud");
					$(".module.activity .node_type_text").show();
					break;
			}
			
			// If compass setting disabled, hide node letters
			if(!ConfigManager.info_compass){
				$(".module.activity .node_types").hide();
				$(".module.activity .sortie_node").hide();
			}
		},
		
		BattleStart: function(data){
			// Clear battle details box just to make sure
			clearBattleData();
			
			var thisNode = KC3SortieManager.currentNode();
			var battleData = (thisNode.startsFromNight)? thisNode.battleNight : thisNode.battleDay;
			
			// Load enemy icons
			$.each(thisNode.eships, function(index, eshipId){
				var eParam = thisNode.eParam[index];
				
				if(eshipId > -1){
					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("src", KC3Meta.abyssIcon(eshipId));
					
					var tooltip = "{0}: {1}\n".format(eshipId, KC3Meta.abyssShipName(eshipId));
					tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipFire"), eParam[0]);
					tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipTorpedo"), eParam[1]);
					tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipAntiAir"), eParam[2]);
					tooltip += "{0}: {1}".format(KC3Meta.term("ShipArmor"), eParam[3]);
					
					var eSlot = thisNode.eSlot[index];
					if (!!eSlot && eSlot.length > 0) {
						for(var slotIdx=0; slotIdx<Math.min(eSlot.length,4); slotIdx++) {
							if(eSlot[slotIdx] > 0) tooltip += String.fromCharCode(13) + KC3Meta.gearName(KC3Master.slotitem(eSlot[slotIdx]).api_name);
						}
					}
					
					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("title", tooltip);
					$(".module.activity .abyss_ship_"+(index+1)).show();
				}
			});
			
			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent;
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisNode.enemyHP[index].hp;
						if(newEnemyHP < 0){ newEnemyHP = 0; }
						
						if(newEnemyHP === 0){
							$(".module.activity .abyss_ship_"+(index+1)).css("opacity", "0.6");
							$(".module.activity .sunk_"+(index+1)+" img")
								.show()
								.css("-webkit-filter","");
						}
						
						enemyHPPercent = ( newEnemyHP / thisNode.originalHPs[index+7] );
						$(".module.activity .abyss_hp_bar_"+(index+1)).css("width", 28*enemyHPPercent);
						
						if(enemyHPPercent <= 0.25){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FF0000");
						} else if(enemyHPPercent <= 0.50){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FF9900");
						} else if(enemyHPPercent <= 0.75){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FFFF00");
						} else{
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#00FF00");
						}
						
						$(".module.activity .abyss_hp_"+(index+1)).show();
					}
				});
			}
			
			// Enemy formation
			if((typeof thisNode.eformation != "undefined") && (thisNode.eformation > -1)){
				$(".module.activity .battle_eformation img").attr("src", KC3Meta.formationIcon(thisNode.eformation));
				$(".module.activity .battle_eformation").css("-webkit-transform", "rotate(-90deg)");
				$(".module.activity .battle_eformation").attr("title", KC3Meta.formationText(thisNode.eformation));
			}
			
			// Battle conditions
			$(".module.activity .battle_engagement").text( thisNode.engagement[2] );
			var contactSpan = buildContactPlaneSpan(thisNode.fcontactId, thisNode.fcontact, thisNode.econtactId, thisNode.econtact);
			$(".module.activity .battle_contact").html($(contactSpan).html());
			
			// Swap fish and support icons
			$(".module.activity .battle_fish").hide();
			$(".module.activity .battle_support").show();
			
			// Day battle-only environment
			if(!thisNode.startsFromNight){
				// If support expedition is triggered on this battle
				$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support"+["-x",""][thisNode.supportFlag&1]+".png");
				
				// If night battle will be asked after this battle
				$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen"+["-x",""][thisNode.yasenFlag&1]+".png");
				
				// Battle conditions
				$(".module.activity .battle_detection").text( thisNode.detection[0] );
				$(".module.activity .battle_airbattle").text( thisNode.airbattle[0] );
				
				// Fighter phase
				$(".fighter_ally .plane_before").text(thisNode.planeFighters.player[0]);
				$(".fighter_enemy .plane_before").text(thisNode.planeFighters.abyssal[0]);
				
				// Bombing Phase
				$(".bomber_ally .plane_before").text(thisNode.planeBombers.player[0]);
				$(".bomber_enemy .plane_before").text(thisNode.planeBombers.abyssal[0]);
				
				// Plane losses
				if(thisNode.planeFighters.player[1] > 0){
					$(".fighter_ally .plane_after").text("-"+thisNode.planeFighters.player[1]);
				}
				if(thisNode.planeFighters.abyssal[1] > 0){
					$(".fighter_enemy .plane_after").text("-"+thisNode.planeFighters.abyssal[1]);
				}
				if(thisNode.planeBombers.player[1] > 0){
					$(".bomber_ally .plane_after").text("-"+thisNode.planeBombers.player[1]);
				}
				if(thisNode.planeBombers.abyssal[1] > 0){
					$(".bomber_enemy .plane_after").text("-"+thisNode.planeBombers.abyssal[1]);
				}
				
			// Started on night battle
			}else{
				$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support-x.png");
				$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
			}
			
			// Show predicted battle rank
			if(thisNode.predictedRank || thisNode.predictedRankNight){
				$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+(thisNode.predictedRank||thisNode.predictedRankNight)+".png")
				.css("opacity", 0.5);
			}
			
			this.Fleet();
		},
		
		BattleNight: function(data){
			// Enemy HP Predictions
			var thisNode = KC3SortieManager.currentNode();
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent;
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisNode.enemyHP[index].hp;
						if(newEnemyHP < 0){ newEnemyHP = 0; }
						
						if(newEnemyHP === 0){
							$(".module.activity .abyss_ship_"+(index+1)).css("opacity", "0.6");
							$(".module.activity .sunk_"+(index+1)+" img")
								.show()
								.css("-webkit-filter",(data||{safeSunk:false}).safeSunk ? "grayscale(100%)" : "");
						}
						
						enemyHPPercent = ( newEnemyHP / thisNode.originalHPs[index+7] );
						$(".module.activity .abyss_hp_bar_"+(index+1)).css("width", 28*enemyHPPercent);
						
						if(enemyHPPercent <= 0.25){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FF0000");
						} else if(enemyHPPercent <= 0.50){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FF9900");
						} else if(enemyHPPercent <= 0.75){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FFFF00");
						} else{
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#00FF00");
						}
						
						$(".module.activity .abyss_hp_"+(index+1)).show();
					}
				});
			}
			
			var contactSpan = buildContactPlaneSpan(thisNode.fcontactId, thisNode.fcontact, thisNode.econtactId, thisNode.econtact);
			$(".module.activity .battle_contact").html($(contactSpan).html());
			
			if(thisNode.predictedRankNight){
				$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+thisNode.predictedRankNight+".png")
				.css("opacity", 0.5);
			}
			
			this.Fleet();
		},
		
		BattleResult: function(data){
			var thisNode = KC3SortieManager.currentNode();
			
			updateHQEXPGained($(".admiral_lvnext"),KC3SortieManager.hqExpGained);
			
			$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+thisNode.rating+".png")
				.css("opacity", 1);
			
			// If there is any special item drop
			if(typeof data.api_get_useitem != "undefined"){
				$(".module.activity .battle_support").hide();
				$(".module.activity .battle_fish").show();
			}
			
			// If there is a ship drop
			if(thisNode.drop > 0){
				// If drop spoiler is enabled on settings
				if(ConfigManager.info_drop){
					$(".module.activity .battle_drop img").attr("src", KC3Meta.shipIcon(thisNode.drop, undefined, false));
					$(".module.activity .battle_drop").attr("title", KC3Meta.shipName( KC3Master.ship(thisNode.drop).api_name ));
				}
				
				// Update Counts
				this.ShipSlots({});
				this.GearSlots({});
			}else{
				$(".module.activity .battle_drop img").attr("src",
					"../../../../assets/img/ui/dark_shipdrop-x.png");
			}
			
			// Show experience calculation
			if(selectedFleet<5){
				let expJustGained = data.api_get_ship_exp;
				var CurrentFleet = PlayerManager.fleets[selectedFleet-1];
				let newGoals = JSON.parse(localStorage.goals || "{}");
				$.each(CurrentFleet.ships, function(index, rosterId){
					if(typeof newGoals["s"+rosterId] != "undefined"){
						let grindData = newGoals["s"+rosterId];
						if(grindData.length===0){ return true; }
						let ThisShip = KC3ShipManager.get( rosterId );
						// we are at battle result page and old ship exp data has not yet been updated,
						// so here we need to add  "expJustGained" to get the correct exp.
						// also we don't update ship.exp here, as it will be automatically sync-ed
						// once we back to port or continue sortie.
						let expLeft = KC3Meta.expShip(grindData[0])[1] - (ThisShip.exp[0] + expJustGained[index+1]);
						console.debug("Ship", rosterId, "target exp", expLeft);
						if(expLeft < 0){ return true; } // if the ship has reached the goal, skip it
						let expPerSortie = maplist[ grindData[1]+"-"+grindData[2] ];
						if(grindData[6]===1){ expPerSortie = expPerSortie * 2; }
						if(grindData[5]===1){ expPerSortie = expPerSortie * 1.5; }
						expPerSortie = expPerSortie * rankFactors[grindData[4]];
						$("<div />").addClass("expNotice").text( Math.ceil(expLeft / expPerSortie) )
							.appendTo("#ShipBox"+rosterId+" .ship_exp_label")
							.delay( 5000 )
							.fadeOut(1000, function(){ $(this).remove(); } );
					}
				});

			}
		},
		
		CraftGear: function(data){
			// Recall equipment count
			this.GearSlots({});
			
			// If craft spoiler is disabled on settings
			if(!ConfigManager.info_craft){ return true; }
			
			var icon = "../../../../assets/img/client/penguin.png";
			
			// If success crafting
			if (data.itemId !== null) {
				// Get equipment data
				var PlayerItem = KC3GearManager.get( data.itemId );
				var MasterItem = KC3Master.slotitem( data.itemMasterId );
				var countExisting = KC3GearManager.countByMasterId( data.itemMasterId );
				
				icon = "../../../../assets/img/items/"+MasterItem.api_type[3]+".png";
				$(".activity_crafting .equipIcon img").attr("src", icon);
				$(".activity_crafting .equipName").text( PlayerItem.name() );
				
				// Show extra item info
				if(countExisting == 1){
					$(".activity_crafting .equipNote").html(KC3Meta.term("CraftEquipNoteFirst"));
				}else{
					$(".activity_crafting .equipNote").html(KC3Meta.term("CraftEquipNoteExists").format(countExisting));
				}
				
				$(".activity_crafting .equipStats").html("");
				CraftGearStats(MasterItem, "souk", "ar");
				CraftGearStats(MasterItem, "houg", "fp");
				CraftGearStats(MasterItem, "raig", "tp");
				CraftGearStats(MasterItem, "soku", "sp");
				CraftGearStats(MasterItem, "baku", "dv");
				CraftGearStats(MasterItem, "tyku", "aa");
				CraftGearStats(MasterItem, "tais", "as");
				CraftGearStats(MasterItem, "houm", "ht");
				CraftGearStats(MasterItem, "houk", "ev");
				CraftGearStats(MasterItem, "saku", "ls");
				CraftGearStats(MasterItem, "leng", "rn");
				$("<div />").addClass("clear").appendTo(".module.activity .activity_crafting .equipStats");
				
			// If penguin
			} else {
				$(".activity_crafting .equipIcon img").attr("src", icon);
				$(".activity_crafting .equipName").text(KC3Meta.term("CraftEquipNotePenguin"));
				$(".activity_crafting .equipNote").html("");
				$(".activity_crafting .equipStats").html("");
			}
			
			// Show resource used
			console.log(data);
			$(".activity_crafting .used1").text( data.resourceUsed[0] );
			$(".activity_crafting .used2").text( data.resourceUsed[1] );
			$(".activity_crafting .used3").text( data.resourceUsed[2] );
			$(".activity_crafting .used4").text( data.resourceUsed[3] );
			
			// Show the box
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_crafting").fadeIn(500);
		},
		
		CraftShip: function(data){},
		
		Modernize: function(data){
			console.log("MODERNIZE TRIGGER", data);
			
			var ModShip = KC3ShipManager.get(data.rosterId);
			
			$(".activity_modernization .mod_ship_pic img").attr("src", KC3Meta.shipIcon(ModShip.masterId) );
			$(".activity_modernization .mod_ship_name").text( ModShip.name() );
			$(".activity_modernization .mod_ship_level span").text( ModShip.level );
			
			
			$(".activity_modernization .mod_result_tp .mod_result_old").text( data.oldStats[1] );
			$(".activity_modernization .mod_result_aa .mod_result_old").text( data.oldStats[2] );
			$(".activity_modernization .mod_result_ar .mod_result_old").text( data.oldStats[3] );
			$(".activity_modernization .mod_result_lk .mod_result_old").text( data.oldStats[4] );
			
			$.each(["fp","tp","aa","ar","lk"], function(i, statName){
				$(".activity_modernization .mod_result_"+statName+" .mod_result_old").text( data.oldStats[i] );
				
				if(data.increase[i] > 0){
					$(".activity_modernization .mod_result_"+statName+" .mod_result_plus span").text( data.increase[i] );
					$(".activity_modernization .mod_result_"+statName+" .mod_result_plus").css("visibility", "visible");
				}else{
					$(".activity_modernization .mod_result_"+statName+" .mod_result_plus").css("visibility", "hidden");
				}
				
				$(".activity_modernization .mod_result_"+statName+" .mod_result_left span").text( data.left[i] );
			});
			
			// Show the box
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_modernization").fadeIn(500);
		},
		
		ClearedMap: function(data){},
		
		PvPStart: function(data){
			// Clear battle details box just to make sure
			clearBattleData();
			$(".module.activity .map_world").text("PvP");
			
			// Process PvP Battle
			var thisPvP = (new KC3Node(0, 0, Date.now())).defineAsBattle();
			KC3SortieManager.appendNode(thisPvP);
			thisPvP.isPvP = true;
			thisPvP.engage( data.battle,data.fleetSent );
			
			// Hide useless information
			$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support-x.png").css("visibility","hidden");
			$(".module.activity .battle_drop    img").attr("src", "../../../../assets/img/ui/dark_shipdrop-x.png").css("visibility","hidden");
			
			// Swap fish and support icons
			$(".module.activity .battle_fish").hide();
			$(".module.activity .battle_support").show();
			
			// Enemy Formation
			if((typeof thisPvP.eformation != "undefined") && (thisPvP.eformation > -1)){
				$(".module.activity .battle_eformation img").attr("src",
					KC3Meta.formationIcon(thisPvP.eformation));
				$(".module.activity .battle_eformation").css("-webkit-transform", "rotate(-90deg)");
				$(".module.activity .battle_eformation").attr("title",
					KC3Meta.formationText(thisPvP.eformation));
				$(".module.activity .battle_eformation").show();
			} else {
				$(".module.activity .battle_eformation").hide();
			}
			
			// Show opponent ships faces
			console.log(thisPvP.eships);
			$.each(thisPvP.eships, function(index, eshipId){
				var eParam = thisPvP.eParam[index];
				
				if(eshipId > -1){
					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("src", KC3Meta.shipIcon(eshipId));
					var masterShip = KC3Master.ship(eshipId);
					var tooltip = "{0}: {1}\n".format(eshipId, KC3Meta.shipName(masterShip.api_name));
					tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipFire"), eParam[0]);
					tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipTorpedo"), eParam[1]);
					tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipAntiAir"), eParam[2]);
					tooltip += "{0}: {1}".format(KC3Meta.term("ShipArmor"), eParam[3]);
					
					var eSlot = thisPvP.eSlot[index];
					if (!!eSlot && eSlot.length > 0) {
						for(var slotIdx=0; slotIdx<Math.min(eSlot.length,4); slotIdx++) {
							if(eSlot[slotIdx] > 0) tooltip += String.fromCharCode(13) + KC3Meta.gearName(KC3Master.slotitem(eSlot[slotIdx]).api_name);
						}
					}
					
					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("title", tooltip);
					$(".module.activity .abyss_ship_"+(index+1)).show();
				}
			});
			
			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent;
				$.each(thisPvP.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisPvP.enemyHP[index].hp;
						if(newEnemyHP < 0){ newEnemyHP = 0; }
						
						if(newEnemyHP === 0){
							$(".module.activity .abyss_ship_"+(index+1)).css("opacity", "0.6");
							$(".module.activity .sunk_"+(index+1)+" img")
								.show()
								.css("-webkit-filter","grayscale(100%)");
						}
						
						enemyHPPercent = ( newEnemyHP / thisPvP.originalHPs[index+7] );
						$(".module.activity .abyss_hp_bar_"+(index+1)).css("width", 28*enemyHPPercent);
						
						if(enemyHPPercent <= 0.25){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FF0000");
						} else if(enemyHPPercent <= 0.50){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FF9900");
						} else if(enemyHPPercent <= 0.75){
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#FFFF00");
						} else{
							$(".module.activity .abyss_hp_bar_"+(index+1)).css("background", "#00FF00");
						}
						
						$(".module.activity .abyss_hp_"+(index+1)).show();
					}
				});
			}
			
			// If night battle will be asked after this battle
			if(thisPvP.yasenFlag){
				$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
			}else{
				$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen-x.png");
			}
			
			// Show predicted battle rank
			if(thisPvP.predictedRank){
				$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+thisPvP.predictedRank+".png")
				.css("opacity", 0.5);
			}
			
			// Battle conditions
			$(".module.activity .battle_detection").text( thisPvP.detection[0] );
			$(".module.activity .battle_airbattle").text( thisPvP.airbattle[0] );
			$(".module.activity .battle_engagement").text( thisPvP.engagement[2] );
			var contactSpan = buildContactPlaneSpan(thisPvP.fcontactId, thisPvP.fcontact, thisPvP.econtactId, thisPvP.econtact);
			$(".module.activity .battle_contact").html($(contactSpan).html());
			
			// Fighter phase
			$(".fighter_ally .plane_before").text(thisPvP.planeFighters.player[0]);
			$(".fighter_enemy .plane_before").text(thisPvP.planeFighters.abyssal[0]);
			
			// Bombing Phase
			$(".bomber_ally .plane_before").text(thisPvP.planeBombers.player[0]);
			$(".bomber_enemy .plane_before").text(thisPvP.planeBombers.abyssal[0]);
			
			// Plane losses
			if(thisPvP.planeFighters.player[1] > 0){
				$(".fighter_ally .plane_after").text("-"+thisPvP.planeFighters.player[1]);
			}
			if(thisPvP.planeFighters.abyssal[1] > 0){
				$(".fighter_enemy .plane_after").text("-"+thisPvP.planeFighters.abyssal[1]);
			}
			if(thisPvP.planeBombers.player[1] > 0){
				$(".bomber_ally .plane_after").text("-"+thisPvP.planeBombers.player[1]);
			}
			if(thisPvP.planeBombers.abyssal[1] > 0){
				$(".bomber_enemy .plane_after").text("-"+thisPvP.planeBombers.abyssal[1]);
			}
			
			// Switch to battle tab
			$(".module.activity .activity_battle").css("opacity", 1);
			$(".module.activity .node_type_battle").show();
			$("#atab_battle").trigger("click");
			
			// Trigger other listeners
			this.HQ({});
			this.ShipSlots({});
			this.GearSlots({});
			this.Fleet({});
			this.Quests({});
		},
		
		PvPNight: function(data){
			this.BattleNight({safeSunk:true});
		},
		
		PvPEnd: function(data){
			var thisPvP = KC3SortieManager.currentNode();
			
			$(".module.activity .battle_rating img")
				.attr("src", "../../../../assets/img/client/ratings/"+thisPvP.rating+".png")
				.css("opacity", 1);
			updateHQEXPGained($(".admiral_lvnext"), KC3SortieManager.hqExpGained);
		},
		ExpeditionSelection: function (data) {
			if (! ConfigManager.info_auto_exped_tab)
				return;

			// on expedition selection page
			// choose one available fleet if any, setup variables properly
			ExpedTabAutoFleetSwitch(true);
		},
		ExpeditionStart: function (data) {
			if (! ConfigManager.info_auto_exped_tab)
				return;
			// this part is triggered when a fleet is sent to some expedition
			// but at this moment fleet info is not yet updated
			expeditionStarted = true;
		},
		ExpedResult: function(data){
			overrideFocus = true;
			/* Data
			{"api_ship_id":[-1,56,22,2,116,1,4],"api_clear_result":1,"api_get_exp":50,"api_member_lv":88,"api_member_exp":510662,"api_get_ship_exp":[210,140,140,140,140,140],"api_get_exp_lvup":[[272732,275000],[114146,117600],[89228,90300],[59817,63000],[162124,168100],[29155,30000]],"api_maparea_name":"\u5357\u65b9\u6d77\u57df","api_detail":"\u6c34\u96f7\u6226\u968a\u306b\u30c9\u30e9\u30e0\u7f36(\u8f38\u9001\u7528)\u3092\u53ef\u80fd\u306a\u9650\u308a\u6e80\u8f09\u3057\u3001\u5357\u65b9\u9f20\u8f38\u9001\u4f5c\u6226\u3092\u7d9a\u884c\u305b\u3088\uff01","api_quest_name":"\u6771\u4eac\u6025\u884c(\u5f10)","api_quest_level":8,"api_get_material":[420,0,200,0],"api_useitem_flag":[4,0],"api_get_item1":{"api_useitem_id":10,"api_useitem_name":"\u5bb6\u5177\u7bb1\uff08\u5c0f\uff09","api_useitem_count":1}}
			
			useitem --
				00 - nothing
				01 - instant repair
				02 - instant construct
				03 - development item
				
				10 - furniture small
				11 - furniture medium
				12 - furniture large
			*/
			
			if(!data.response.api_clear_result && !data.response.api_get_exp) {
				data.response.api_clear_result = -1;
			}
			
			// Show result status image
			$(".activity_expedition .expres_img img").attr("src",
				"../../../../assets/img/client/exped_"+
				(["fail","fail","success","gs"][data.response.api_clear_result+1])
				+".png"
			);
			
			// Expedition number
			$(".activity_expedition .expres_num").text( KC3Meta.term("Expedition") + " " + data.expedNum );
			
			// Status text
			$(".activity_expedition .expres_status")
				.text( KC3Meta.term("MissionActivity"+(data.response.api_clear_result+1)) )
				.removeClass("exp_status0 exp_status1 exp_status2 exp_status3")
				.addClass("exp_status"+(data.response.api_clear_result+1));
				
			// Resource gains
			if(data.response.api_get_material===-1){ data.response.api_get_material = [0,0,0,0]; }
			$(".activity_expedition .expres_reso").each(function(i,element){
				$(".expres_amt", element).text( data.response.api_get_material[i] );
			});
			
			// Extra item get
			var
				gotItem = false,
				useItemMap = { // guess useitem map
					 1:"bucket",
					 2:"ibuild",
					 3:"devmat",
					10:"box1",
					11:"box2",
					12:"box3",
				}; // for item array
				
			$(".module.activity .activity_expedition .expres_noget").hide();
			$(".activity_expedition .expres_item").each(function(i,element){
				var
					useCons = data.response.api_useitem_flag[i],
					useItem = data.response["api_get_item"+(i+1)];
				if(!!useCons && !!useItem) {
					gotItem |= true;
					$(element).show();
					$("img", element).attr("src", "../../../../assets/img/client/"+useItemMap[useCons === 4 ? useItem.api_useitem_id : useCons]+".png");
					$(".expres_item_text", element).text( useItem.api_useitem_count );
				}else{
					$(element).hide();
				}
			});
			if(!gotItem){ $(".module.activity .activity_expedition .expres_noget").show(); }
			
			// HQ Exp
			$(".activity_expedition .expres_hqexp_amt span").text( data.response.api_get_exp );
			
			// Ship Exp
			$(".activity_expedition .expres_ships .expres_ship").each(function(i,element){
				var shipId = data.response.api_ship_id[i+1];
				if(shipId > 0) {
					var shipData = KC3ShipManager.get(shipId);
					$(".expres_ship_img img", element).attr("src", KC3Meta.shipIcon(shipData.masterId));
					$(".expres_ship_exp span", element).text(data.response.api_get_ship_exp[i]);
					$(element).show();
				} else {
					$(element).hide();
				}
			});
			
			// Show the box
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_expedition").fadeIn(500);

			// after getting the result, we assume user will just resupply & resend to the same expedition
			// it makes sense to update expedition planner with current fleet-expedition relation.
			var expedTabConf = ExpedTabValidateConfig();
			var resultFleetNum = data.params.api_deck_id; // string
			expedTabConf.fleetConf[ resultFleetNum ].expedition = data.expedNum;
			localStorage.expedTab = JSON.stringify( expedTabConf );
		},

		UpdateExpeditionPlanner: function (data) {
			// if combined fleet or LBAS, cancel action
			if(selectedFleet===5 || selectedFleet===6){ return false; }
			
			$( ".module.activity .activity_expeditionPlanner .expres_greatbtn img" )
				.attr("src", "../../../../assets/img/ui/btn-"+(plannerIsGreatSuccess?"":"x")+"gs.png");
			$(".module.activity .activity_expeditionPlanner .dropdown_title")
				.text(KC3Meta.term("ExpedNumLabel")+String(selectedExpedition));

			var
				allShips,
				fleetObj = PlayerManager.fleets[selectedFleet-1];
			
			//fleets' subscripts start from 0 !
			allShips = fleetObj.ships.map(function(rosterId, index) {
				return KC3ShipManager.get(rosterId);
			}).filter(function (rosterData, index){
				return (rosterData.masterId > 0);
			});
			
			var PS = window.PS;
			var KE = PS["KanColle.Expedition"];
			var KER = PS["KanColle.Expedition.Requirement"];
			var KEC = PS["KanColle.Expedition.Cost"];
			var KERO = PS["KanColle.Expedition.RequirementObject"];
			var ST = PS["KanColle.Generated.SType"];

			var allShipsForLib = allShips.map(function(CurrentShip, ind) {
				var shipInst = CurrentShip;
				var shipModel = CurrentShip.master();
				var stypeId = shipModel.api_stype;
				var stype = ST.showSType(ST.fromInt(stypeId));
				var level = shipInst.level;
				var drumCount = CurrentShip.countDrums();
				return {
					ammo : 0,
					morale : 0,
					stype : stype,
					level : level,
					drumCount : drumCount
				};
			});

			var fleet = KER.fromRawFleet(allShipsForLib);
			var availableExpeditions = KE.getAvailableExpeditions( fleet );

			var unsatRequirements = KER.unsatisfiedRequirements(selectedExpedition)(fleet);

			//Don't forget to use KERO.*ToObject to convert raw data to JS friendly objs
			var rawExpdReqPack = KERO.getExpeditionRequirementPack(selectedExpedition);
			
			var ExpdReqPack = KERO.requirementPackToObj(rawExpdReqPack);
			// console.log(JSON.stringify(ExpdReqPack));
			var ExpdCheckerResult = KERO.resultPackToObject(KERO.checkWithRequirementPack(rawExpdReqPack)(fleet));
			// console.log(JSON.stringify(ExpdCheckerResult));
			var ExpdCost = KEC.getExpeditionCost(selectedExpedition);
			var KEIB = PS["KanColle.Expedition.IncomeBase"];
			var ExpdIncome = KEIB.getExpeditionIncomeBase(selectedExpedition);
			var ExpdFleetCost = fleetObj.calcExpeditionCost( selectedExpedition );

			$(".module.activity .activity_expeditionPlanner .estimated_time").text( String( 60*ExpdCost.time ).toHHMMSS() );

			// setup expedition item colors
			$( ".activity_expeditionPlanner .expedition_entry" ).each( function(i,v) {
				var expeditionId = parseInt( $(this).data("expId") );
				if (availableExpeditions.indexOf(expeditionId) !== -1) {
					$(this).addClass("cond_passed").removeClass("cond_failed");
					// this expedition is available
				} else {
					// mark not available
					$(this).addClass("cond_failed").removeClass("cond_passed");
				}
			});

			var resourceRoot = $(".module.activity .activity_expeditionPlanner .expres_resos");
			$.each(["fuel","ammo","steel","bauxite"], function(i,v) {
				var basicIncome = ExpdIncome[v];
				var jqObj = $( "."+v, resourceRoot );
				var resupply;
				if (v === "fuel" || v === "ammo") {
					resupply = ExpdFleetCost[v];
				} else {
					resupply = 0;
				}

				var tooltipText = fleetObj.landingCraftBonusTextAndVal(basicIncome,resupply,plannerIsGreatSuccess);
				jqObj.text( tooltipText.val );
				jqObj.attr( 'title', tooltipText.text );
			});

			var markFailed = function (jq) {
				jq.addClass("expPlanner_text_failed").removeClass("expPlanner_text_passed");
				return jq;
			};
			var markPassed = function (jq) {
				jq.removeClass("expPlanner_text_failed").addClass("expPlanner_text_passed");
				return jq;
			};

			// dataReq: like dataResult
			// dataResult: dataResult of ExpdCheckerResult fields, where
			//		 null: should hide jq obj
			//		 false: check failed
			//		 true: check passed
			//		 <other values>: no effect
			// jq: the jq object
			// postActions: (optional) call postActions(dataReq,dataResult,jq) perform actions after jq object is properly set.
			//				note that postActions is only called if the requirement is not null
			//				the default action is setting the requirement to jq text
			var setupJQObject = function( dataReq, dataResult, jq, postActions ) {
				if (dataReq === null) {
					jq.hide();
				} else {
					jq.show();
					if (dataResult === false) {
						// when this condition is not met
						markFailed( jq );
					} else if (dataResult === true) {
						// when this condition is met
						markPassed( jq );
					}
					var setJQText = function( dataReq, dataResult, jq ) { jq.text( dataReq ); };										
					postActions = postActions || setJQText;
					postActions( dataReq, dataResult, jq );
				}
			};
			
			setupJQObject(
				ExpdReqPack.flagShipLevel,
				ExpdCheckerResult.flagShipLevel,
				$(".module.activity .activity_expeditionPlanner .flagshipLv"));

			
			setupJQObject(
				ExpdReqPack.flagShipTypeOf,
				ExpdCheckerResult.flagShipTypeOf,
				$(".module.activity .activity_expeditionPlanner .flagshipType"));

			setupJQObject(
				ExpdReqPack.shipCount,
				ExpdCheckerResult.shipCount,
				$(".module.activity .activity_expeditionPlanner .shipNum"));

			setupJQObject(
				ExpdReqPack.levelCount,
				ExpdCheckerResult.levelCount,
				$(".module.activity .activity_expeditionPlanner .fleetLv"));
			if (ExpdReqPack.levelCount === null) {
				$(".module.activity .activity_expeditionPlanner .hasTotalLv").hide();
			} else {
				$(".module.activity .activity_expeditionPlanner .hasTotalLv").show();
			}

			setupJQObject(
				ExpdReqPack.fleetSType,
				ExpdCheckerResult.fleetSType,
				$( ".module.activity .activity_expeditionPlanner .expPlanner_req_fleetComposition" ),
				function ( dataReq, dataResult, jq ) {
					jq.html( "" );
					$.each( dataReq, function(index, value){
						var shipReqBox = $("#factory .expPlanner_shipReqBox")
							.clone()
							.appendTo( jq );
						shipReqBox.text(dataReq[index].stypeOneOf.join("/")+":"+dataReq[index].stypeReqCount);
						if (dataResult[index] === false) {
							markFailed( shipReqBox );
						} else if (dataResult[index] === true) {
							markPassed( shipReqBox );
						}
					});
				});

			setupJQObject(
				ExpdReqPack.drumCount,
				ExpdCheckerResult.drumCount,
				$( ".module.activity .activity_expeditionPlanner .canisterNum" ));

			setupJQObject(
				ExpdReqPack.drumCarrierCount,
				ExpdCheckerResult.drumCarrierCount,
				$( ".module.activity .activity_expeditionPlanner .canisterShipNum" ));
			if (ExpdReqPack.drumCount === null &&
				ExpdReqPack.drumCarrierCount === null) {
				$( ".module.activity .activity_expeditionPlanner .canister_criterias" ).hide();
			} else {
				$( ".module.activity .activity_expeditionPlanner .canister_criterias" ).show();
			}
			
			if (fleetObj.isSupplied()) {
				$( ".module.activity .activity_expeditionPlanner .icon.supplyCheck" ).show();
				$( ".module.activity .activity_expeditionPlanner .text.supplyCheck" ).text(KC3Meta.term("PanelSupplied"));

				markPassed( $( ".module.activity .activity_expeditionPlanner .text.supplyCheck") );
			} else {
				$( ".module.activity .activity_expeditionPlanner .icon.supplyCheck" ).hide();
				$( ".module.activity .activity_expeditionPlanner .text.supplyCheck" ).text(KC3Meta.term("PanelUnderSupplied"));
				
				markFailed( $( ".module.activity .activity_expeditionPlanner .text.supplyCheck" ) );
			}

			if (unsatRequirements.length === 0 && fleetObj.isSupplied()) {
				markPassed( $(".module.activity .activity_expeditionPlanner .dropdown_title") );
			} else {
				markFailed( $(".module.activity .activity_expeditionPlanner .dropdown_title") );
			}

			return;

				/*
				 *
				 * Sample result for ExpdReqPack and ExpdCheckerResult on expedition 21#
				 *
				 * {  
					  "flagShipLevel":15,
					  "shipCount":5,
					  "flagShipTypeOf":null,
					  "levelCount":30,
					  "drumCount":null,
					  "drumCarrierCount":3,
					  "fleetSType":[  
					    {  
					      "stypeReqCount":1,
					      "stypeOneOf":[  
					        "CL"
					      ]
					    },
					    {  
					      "stypeReqCount":4,
					      "stypeOneOf":[  
					        "DD"
					      ]
					    }
					  ]
					}
					---------------------
					{  
					  "flagShipLevel":true,
					  "shipCount":false,
					  "flagShipTypeOf":null,
					  "levelCount":true,
					  "drumCount":null,
					  "drumCarrierCount":false,
					  "fleetSType":[  
					    true,
					    false
					  ]
					}					
				 */
				
		},
	};
	
	function updateHQEXPGained(ele,newDelta) {
		var
			maxHQ  = Object.keys(KC3Meta._exp).map(function(a){return parseInt(a);}).reduce(function(a,b){return a>b?a:b;}),
			hqDt = (PlayerManager.hq.level>=maxHQ ? 3 : ConfigManager.hqExpDetail),
			hqt  = KC3Meta.term("HQExpAbbrev" + hqDt);
		return ele
			.attr("data-exp",hqt)
			.attr("data-exp-gain",(function(x){
				if(newDelta !== undefined)
					return newDelta;
				else if ((ele.attr("data-exp-gain")||"").length > 0)
					return KC3SortieManager.hqExpGained;
				else
					return "";
			}()))
			.text( PlayerManager.hq.exp[hqDt].toLocaleString() );
	}
	
	function buildContactPlaneSpan(fcontactId, fcontact, econtactId, econtact) {
		var fContactIcon = null,
			eContactIcon = null,
			contactSpan = $("<span/>");
		if(fcontactId > 0){
			var fcpMaster = KC3Master.slotitem(fcontactId);
			fContactIcon = $("<img />")
				.attr("src", "../../../../assets/img/items/"+fcpMaster.api_type[3]+".png")
				.attr("title", KC3Meta.gearName(fcpMaster.api_name));
		}
		if(econtactId > 0){
			var ecpMaster = KC3Master.slotitem(econtactId);
			eContactIcon = $("<img />")
				.attr("src", "../../../../assets/img/items/"+ecpMaster.api_type[3]+".png")
				.attr("title", KC3Meta.gearName(ecpMaster.api_name));
		}
		$(contactSpan)
			.append(!!fContactIcon ? fContactIcon : fcontact)
			.append(KC3Meta.term("BattleContactVs"))
			.append(!!eContactIcon ? eContactIcon : econtact);
		return contactSpan;
	}

	function CraftGearStats(MasterItem, StatProperty, Code){
		if(parseInt(MasterItem["api_"+StatProperty], 10) !== 0){
			var thisStatBox = $("#factory .equipStat").clone().appendTo(".module.activity .activity_crafting .equipStats");
			
			$("img", thisStatBox).attr("src", "../../../../assets/img/stats/"+Code+".png");
			$(".equipStatText", thisStatBox).text( MasterItem["api_"+StatProperty] );
		}
	}
	
	function UpdateRepairTimerDisplays(docking, akashi){
		var
			akashiTick = [false,false],
			
			context = $(".module.status"),
			dockElm = $(".status_docking .status_text",context),
			koskElm = $(".status_akashi  .status_text",context);
		if(typeof docking==="object") {
			akashi     = docking.akashi;
			akashiTick = docking.akashiCheck;
			docking    = docking.docking;
		}
		if(typeof docking!=="undefined") dockElm.data("value",Math.ceil(docking));
		if(typeof  akashi!=="undefined") koskElm.data("value",Math.ceil( akashi));
		koskElm.data("tick",akashiTick);
		[dockElm,koskElm].forEach(function(elm){
			elm.removeClass("good bad").removeAttr("title");
			switch (ConfigManager.timerDisplayType) {
			case 1:
				elm.text(String(elm.data("value")).toHHMMSS());
				break;
			case 2:
				elm.text(String(elm.data("value") || NaN).plusCurrentTime());
				if((elm.data("value") || 0) > 86400) {
					elm.addClass("bad").attr("title",KC3Meta.term("PanelRepairMoreDays"));
				}
				break;
			}
			if((elm.data("tick") || [false]).every(function(x){return x;})) {
				elm.removeClass('bad').addClass("good").attr("title",KC3Meta.term("PanelRepairing"));
			}
		});
	}
})();
