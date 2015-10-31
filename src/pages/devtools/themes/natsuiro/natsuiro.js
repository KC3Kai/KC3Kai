(function(){
	"use strict";
	_gaq.push(['_trackEvent', "Panel: Natsuiro Theme", 'clicked']);
	
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

	// make sure localStorage.expedTabLastPick is available
	// and is in correct format
	function TouchExpeditionTabConfig() {
		var data;
		if (! localStorage.expedTabLastPick) {
			data = {
				1: { selectedExpedition: 1, isGreatSuccess: false },
				2: { selectedExpedition: 1, isGreatSuccess: false },
				3: { selectedExpedition: 1, isGreatSuccess: false },
				4: { selectedExpedition: 1, isGreatSuccess: false },
			};
			localStorage.expedTabLastPick = JSON.stringify( data );
		} else {
			data = JSON.parse( localStorage.expedTabLastPick );
		}
		return data;
	}
	
	function UpdateExpeditionTabConfig() {
		// update user last pick
		var userConf = TouchExpeditionTabConfig();
		userConf[selectedFleet].selectedExpedition = selectedExpedition;
		userConf[selectedFleet].isGreatSuccess = plannerIsGreatSuccess;
		localStorage.expedTabLastPick = JSON.stringify( userConf );
	}

	// apply stored user settings, note that this function
	// is not responsible for updating UI, so UpdateExpeditionPlanner() should be called after
	// this to reflect the change
	function ApplyExpeditionTabConfig() {
		var expedTabLastPick = TouchExpeditionTabConfig()[selectedFleet];
		selectedExpedition = expedTabLastPick.selectedExpedition;
		plannerIsGreatSuccess = expedTabLastPick.isGreatSuccess;
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
		KC3Meta.init("../../../../data/");
		KC3Meta.defaultIcon("../../../../assets/img/ui/empty.png");
		KC3Master.init();
		PlayerManager.init();
		KC3ShipManager.load();
		KC3GearManager.load();
		KC3Database.init();
		KC3Translation.execute();
		
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
		
		// Close CatBomb modal
		$("#catBomb .closebtn").on("click", function(){
			$("#catBomb").fadeOut(300);
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
				$(this).text(PlayerManager.hq.getRankPoints()+" pts");
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
			$(".summary-eqlos img", self.domElement).attr("src", "../../../../assets/img/stats/los"+ConfigManager.elosFormula+".png"); 
			$(".summary-eqlos .summary_text").text( Math.round(((selectedFleet < 5) ? PlayerManager.fleets[selectedFleet-1].eLoS() : PlayerManager.fleets[0].eLoS()+PlayerManager.fleets[1].eLoS()) * 100) / 100 );
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
					JSON.stringify({
						"version":3,
						"f1":generate_fleet_JSON(PlayerManager.fleets[0]),
						"f2":generate_fleet_JSON(PlayerManager.fleets[1]),
						"f3":generate_fleet_JSON(PlayerManager.fleets[2]),
						"f4":generate_fleet_JSON(PlayerManager.fleets[3]),
						})
				)));
		});

		/* Expedition Planner
		--------------------------------------------*/

		$( ".module.activity .activity_expeditionPlanner .expres_greatbtn" )
			.on("click",function() {
				plannerIsGreatSuccess = !plannerIsGreatSuccess;
				
				UpdateExpeditionTabConfig();
				NatsuiroListeners.UpdateExpeditionPlanner();
			} );


		
		/* Morale timers
		- use end time difference not remaining decrements for accuracy against lag
		--------------------------------------------*/
		setInterval(function(){
			// console.log(moraleClockValue, moraleClockEnd, moraleClockRemain);
			if(moraleClockEnd > 0){
				moraleClockRemain = Math.ceil( (moraleClockEnd - (new Date()).getTime())/1000);
				if(moraleClockRemain > 0){
					$(".module.status .status_morale .status_text").text("~"+(moraleClockRemain+"").toHHMMSS());
					
				}else{
					moraleClockValue = 100;
					moraleClockEnd = 0;
					moraleClockRemain = 0;
					$(".module.status .status_morale .status_text").text("Recovered");
					
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
								title: "Fleet Morale Recovered!",
								message: "Everyone on the \"currently selected fleet\" has recovered from fatigue.",
								iconUrl: "../../assets/img/ui/morale.png"
							}
						})).execute();
					}
				}
			}
		}, 1000);
		
		
		/* Code for generating deckbuilder style JSON data.
		--------------------------------------------*/
		function generate_fleet_JSON(fleet) {
			var result = {};
			for(var i = 0; i < fleet.ships.length; i++) {
				if(fleet.ships[i] > -1){
					result["s".concat(i+1)] = generate_ship_JSON(fleet.ships[i]);
				}
			}
			return result;
		}
		
		function generate_ship_JSON (ship_ID) {
			var result = {};
			var ship = KC3ShipManager.get(ship_ID);
			result.id = ship.masterId;
			result.lv = ship.level;
			result.luck = ship.lk[0];
			result.items = generate_equipment_JSON(ship);
			return result;
		}
		
		function generate_equipment_JSON (shipObj) {
			var result = {};
			for(var i = 0; i < 4; i++) {
				if(shipObj.items[i]> -1){
					result["i".concat(i+1)] ={
							"id":KC3GearManager.get(shipObj.items[i]).masterId,
							"rf":KC3GearManager.get(shipObj.items[i]).stars
					};
				} else {break;}
			}
			return result;
		}
		
		
		// Switching Activity Tabs
		$(".module.activity .activity_tab").on("click", function(){
			// if($(this).data("target")===""){ return false; }
			$(".module.activity .activity_tab").removeClass("active");
			$(this).addClass("active");
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_"+$(this).data("target")).show();
		});
		$(".module.activity .activity_tab.active").trigger("click");
		
		
		$(".module.activity .activity_dismissable").on("click", function(){
			$("#atab_basic").trigger("click");
		});
		
		// Expedition Planner
		$(".expedition_entry").on("click",function(){
			selectedExpedition = parseInt( $(this).data("expId") );
			//console.log("selected Exped "+selectedExpedition);
			UpdateExpeditionTabConfig();
			NatsuiroListeners.UpdateExpeditionPlanner();
		});
		
		// Fleet selection
		$(".module.controls .fleet_num").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(".module.controls .fleet_rengo").removeClass("active");
			$(this).addClass("active");
			console.log($(this).text());
			selectedFleet = parseInt( $(this).text(), 10);
			console.log(selectedFleet);
			NatsuiroListeners.Fleet();
			ApplyExpeditionTabConfig();
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
		setInterval(function(){
			KC3TimerManager.update();
			var TotalFleet = selectedFleet == 5 ? [0,1] : [selectedFleet-1];
			var data = TotalFleet.map(function(x){return PlayerManager.fleets[x].highestRepairTimes();})
				.reduce(function(pre,cur){
					var data = {};
					$.extend(pre,data);
					Object.keys(pre).forEach(function(k){
						data[k] = Math.max(pre[k],cur[k]);
					});
					return data;
				});
			UpdateRepairTimerDisplays(data);
		}, 1000);
		
		// Devbuild: auto-activate dashboard while designing
		// Activate();
		
		// Start Network listener
		KC3Network.addGlobalListener(function(event, data){
			if(isRunning || event == "HomeScreen" || event == "GameStart"){
				if(typeof NatsuiroListeners[event] != "undefined"){
					NatsuiroListeners[event](data);
				}
			}
		});
		KC3Network.listen();
		
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
		// $(".module.activity .battle_fish img").attr("src", "../../../../assets/img/client/pike-x.png");
		$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
		$(".module.activity .battle_rating img").attr("src", "../../../../assets/img/ui/dark_rating.png");
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
		
		HQ: function(data){
			$(".admiral_name").text( PlayerManager.hq.name );
			$(".admiral_comm").text( PlayerManager.hq.desc );
			$(".admiral_rank").text( PlayerManager.hq.rank );
			if($(".admiral_rank").data("mode")==1){
				$(".admiral_rank").text(PlayerManager.hq.rank);
			}else{
				$(".admiral_rank").text(PlayerManager.hq.getRankPoints()+" pts");
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
			$(".module.quests").html("");
			$.each(KC3QuestManager.getActives(), function(index, quest){
				questBox = $("#factory .quest").clone().appendTo(".module.quests");
				if(!quest.tracking){ questBox.addClass("untracked"); }
				$(".quest_color", questBox).css("background", quest.getColor() );
				if(quest.isComplete()){
					questBox.addClass("complete");
					// $(".quest_color", questBox).html("&#x2714;");
				}
				if(quest.meta){
					$(".quest_text", questBox).text( quest.meta().name );
					$(".quest_text", questBox).attr("title", quest.meta().desc );
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
				MainRepairs = MainFleet.highestRepairTimes();
				var EscortRepairs = EscortFleet.highestRepairTimes();
				
				// Compile fleet attributes
				FleetSummary = {
					lv: MainFleet.totalLevel() + EscortFleet.totalLevel(),
					elos: Math.qckInt(null,MainFleet.eLoS()+EscortFleet.eLoS(),2),
					air: Math.qckInt(null,MainFleet.fighterPower() + EscortFleet.fighterPower(),2),
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
				
				
			// SINGLE
			}else{
				var CurrentFleet = PlayerManager.fleets[selectedFleet-1];
				
				// Calculate Highest Repair Times for status indicators
				MainRepairs = CurrentFleet.highestRepairTimes();
				
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
					elos: Math.round( CurrentFleet.eLoS() * 100) / 100,
					air: CurrentFleet.fighterPowerText(),
					speed: CurrentFleet.speed(),
					docking: MainRepairs.docking,
					akashi: MainRepairs.akashi,
					hasTaiha: CurrentFleet.hasTaiha(),
					taihaIndexes: CurrentFleet.getTaihas(),
					supplied: CurrentFleet.isSupplied(),
					badState: [
						CurrentFleet.needsSupply(false) ||
						(!(KC3SortieManager.onSortie && KC3SortieManager.fleetSent == selectedFleet)
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
					(KC3SortieManager.onSortie &&
						KC3SortieManager.fullSupplyMode &&
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
				if( (FleetSummary.hasTaiha || FleetSummary.badState[2] || FleetSummary.badState[3])
					&& !FleetSummary.taihaIndexes.equals([0]) // if not flagship only
					&& !FleetSummary.taihaIndexes.equals([0,0]) // if not flagship only for combined
					&& ((KC3SortieManager.onSortie>0)?!KC3SortieManager.currentNode().isPvP:true) // if PvP, no taiha alert
				){
					$(".module.status .status_repair .status_text").text( KC3Meta.term(
						(FleetSummary.badState[2] ? "PanelFSTaiha" : (FleetSummary.badState[3] ? "PanelEscortChuuha" : "PanelHasTaiha"))
					) );
					$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/sunk.png");
					$(".module.status .status_repair .status_text").addClass("bad");
					
					// Annoying Critical alert
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
					
				}else{
					$(".module.status .status_repair .status_text").text( KC3Meta.term("PanelNoTaiha") );
					$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/check.png");
					$(".module.status .status_repair .status_text").addClass("good");
					
					if(critAnim){ clearInterval(critAnim); }
					$("#critical").hide();
					critSound.pause();
					
					(new RMsg("service", "taihaAlertStop", {
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
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
			
			// FLEET BUTTONS RESUPPLY STATUSES
			$(".module.controls .fleet_num").each(function(i, element){
				$(element).removeClass("needsSupply");
				$(element).removeClass("hasTaiha");
				if(!$(element).hasClass("active")){
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

				// TODO: duplication (with ExpeditionSelection)
				// we'll try switching to the next available fleet if any
				var fleets = PlayerManager.fleets;
				var availableFleetInd = -1;
				// start from the 2nd fleet
				for (var i = 1; i < 4; ++i) {
					// find one available fleet
					if (fleets[i].mission[0] === 0) {
						availableFleetInd = i;
						break;
					}
				}
				console.log( "one fleet is sent, try to find next available fleet" );
				if (availableFleetInd !== -1) {
					selectedFleet = availableFleetInd + 1;
					console.log("Find available fleet: " + String(selectedFleet));
					// this time we don't have to switch tab
					// $("#atab_expeditionPlanner").trigger("click");
					$(".module.controls .fleet_num").each( function(i,v) {
						var thisFleet = parseInt( $(this).text(), 10);
						if (thisFleet === availableFleetInd + 1) {
							$(this).trigger("click");
						}
					});
				} else {
                    // knowing fleet #2, #3 and #4 are all unavailable,
                    // we can return focus to the main fleet.
				    $(".module.controls .fleet_num").each( function(i,v) {
					    var thisFleet = parseInt( $(this).text(), 10);
					    if (thisFleet === 1) {
						    $(this).trigger("click");
						}
					});
					// also return focus to basic tab
					$("#atab_basic").trigger("click");
                } 
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
					?["","E","N","H"][ KC3SortieManager.map_difficulty ]
					:"")
			);
			
			// Map Gauge and status
			var AllMaps = JSON.parse(localStorage.maps);
			var thisMapId = "m"+KC3SortieManager.map_world+""+KC3SortieManager.map_num;
			var thisMap = AllMaps[thisMapId];
			
			if(typeof thisMap != "undefined"){
				if( thisMap.clear == 1){
					$(".module.activity .map_hp").text("Cleared");
				}else{
					// If HP-based gauge
					if(typeof thisMap.maxhp != "undefined"){
						$(".module.activity .map_hp").text( thisMap.curhp + " / " + thisMap.maxhp );
						$(".module.activity .map_gauge_bar").css("width", ((thisMap.curhp/thisMap.maxhp)*58)+"px");
						
					// If kill-based gauge
					}else{
						var totalKills = KC3Meta.gauge( thisMapId );
						console.log("wm", KC3SortieManager.map_world, KC3SortieManager.map_num);
						console.log("thisMapId", thisMapId);
						console.log("KC3Meta", KC3Meta._gauges);
						console.log("totalKills", totalKills);
						var killsLeft = totalKills - thisMap.kills;
						if(totalKills){
							$(".module.activity .map_hp").text( killsLeft+" / "+totalKills+" kills");
							$(".module.activity .map_gauge_bar").css("width", ((killsLeft/totalKills)*58)+"px");
						}else{
							$(".module.activity .map_hp").text("Not cleared");
						}
					}
				}
			}else{
				$(".module.activity .map_hp").text("No gauge");
			}
			
			// Switch to battle tab
			$(".module.activity .activity_battle").css("opacity", 1);
			$("#atab_battle").trigger("click");
		},
		
		CompassResult: function(data){
			// Clear battle details box
			clearBattleData();
			
			var thisNode = KC3SortieManager.currentNode();
			var numNodes = KC3SortieManager.nodes.length;
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
			// $(".module.activity .battle_fish").hide();
			// $(".module.activity .battle_support").show();
			
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
					$(".module.activity .node_type_text").text("Select: "+
						thisNode.choices[0]+" or "+thisNode.choices[1]);
					$(".module.activity .node_type_text").addClass("select");
					$(".module.activity .node_type_text").show();
					break;
					
				// Battle avoided node
				default:
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_avoid");
					$(".module.activity .node_type_text").text("~Battle Avoided~");
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
			var battleData = (thisNode.startNight)? thisNode.battleNight : thisNode.battleDay;
			
			// Load enemy icons
			$.each(thisNode.eships, function(index, eshipId){
				var eParam = thisNode.eParam[index];
				
				if(eshipId > -1){
					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("src", KC3Meta.abyssIcon(eshipId));
					
					var tooltip = "FP: " + eParam[0] + String.fromCharCode(13);
					tooltip += "Torp: " + eParam[1] + String.fromCharCode(13);
					tooltip += "AA: " + eParam[2] + String.fromCharCode(13);
					tooltip += "Armor: " + eParam[3];
					
					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("title", tooltip);
					$(".module.activity .abyss_ship_"+(index+1)).show();
				}
			});
			
			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent;
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisNode.enemyHP[index].currentHp;
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
			$(".module.activity .battle_contact").text(thisNode.fcontact +" vs "+thisNode.econtact);
			
			// Swap fish and support icons
			// $(".module.activity .battle_fish").hide();
			// $(".module.activity .battle_support").show();
			
			// Day battle-only environment
			if(!thisNode.startNight){
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
			
			this.Fleet();
		},
		
		BattleNight: function(data){
			// Enemy HP Predictions
			var thisNode = KC3SortieManager.currentNode();
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent;
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisNode.enemyHP[index].currentHp;
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
			
			$(".module.activity .battle_contact").text(thisNode.fcontact +" vs "+thisNode.econtact);
			
			this.Fleet();
		},
		
		BattleResult: function(data){
			var thisNode = KC3SortieManager.currentNode();
			
			updateHQEXPGained($(".admiral_lvnext"),KC3SortieManager.hqExpGained);
			
			$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+thisNode.rating+".png");
			
			// If there is a FISH drop
			/*$(".module.activity .battle_support").hide();
			if(typeof data.api_get_useitem != "undefined"){
				if(data.api_get_useitem.api_useitem_id == 68){
					$(".module.activity .battle_fish img").attr("src", "../../../../assets/img/client/pike.png");
				}
			}
			$(".module.activity .battle_fish").show();*/
			
			// If there is a ship drop
			if(thisNode.drop > 0){
				// If drop spoiler is enabled on settings
				if(ConfigManager.info_drop){
					$(".module.activity .battle_drop img").attr("src", KC3Meta.shipIcon(thisNode.drop));
					$(".module.activity .battle_drop").attr("title", KC3Meta.shipName( KC3Master.ship(thisNode.drop).api_name ));
				}
				
				// Update Counts
				this.ShipSlots({});
				this.GearSlots({});
			}else{
				$(".module.activity .battle_drop img").attr("src",
					"../../../../assets/img/ui/dark_shipdrop-x.png");
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
					$(".activity_crafting .equipNote").html("This is your <strong>first</strong>!");
				}else{
					$(".activity_crafting .equipNote").html("You now have <strong>"+countExisting+"</strong> of this item!");
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
				$(".activity_crafting .equipName").text( "Equipment crafting failed" );
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
		
		ClearedMap: function(data){},
		
		PvPStart: function(data){
			// Clear battle details box just to make sure
			clearBattleData();
			$(".module.activity .map_world").text("PvP");
			
			// Process PvP Battle
			KC3SortieManager.endSortie();
			KC3SortieManager.fleetSent = data.fleetSent;
			
			var thisPvP;
			KC3SortieManager.nodes.push(thisPvP = (new KC3Node()).defineAsBattle());
			thisPvP.isPvP = true;
			thisPvP.engage( data.battle,data.fleetSent );
			
			// Hide useless information
			$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support-x.png").css("visibility","hidden");
			$(".module.activity .battle_drop    img").attr("src", "../../../../assets/img/ui/dark_shipdrop-x.png").css("visibility","hidden");
			
			// Swap fish and support icons
			// $(".module.activity .battle_fish").hide();
			// $(".module.activity .battle_support").show();
			
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
					var tooltip = "FP: " + eParam[0] + String.fromCharCode(13);
					tooltip += "Torp: " + eParam[1] + String.fromCharCode(13);
					tooltip += "AA: " + eParam[2] + String.fromCharCode(13);
					tooltip += "Armor: " + eParam[3];

					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("title", tooltip);
					$(".module.activity .abyss_ship_"+(index+1)).show();
				}
			});
			
			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent;
				$.each(thisPvP.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisPvP.enemyHP[index].currentHp;
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
			
			// Battle conditions
			$(".module.activity .battle_detection").text( thisPvP.detection[0] );
			$(".module.activity .battle_airbattle").text( thisPvP.airbattle[0] );
			$(".module.activity .battle_engagement").text( thisPvP.engagement[2] );
			$(".module.activity .battle_contact").text(thisPvP.fcontact +" vs "+thisPvP.econtact);
			
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
			$(".module.activity .battle_rating img").attr("src", "../../../../assets/img/client/ratings/"+data.result.api_win_rank+".png");
			updateHQEXPGained($(".admiral_lvnext"),data.result.api_get_exp);
		},
		ExpeditionSelection: function (data) {
			if (! ConfigManager.info_auto_exped_tab)
				return;

			// on expedition selection page
			// choose one available fleet if any, setup variables properly
			var fleets = PlayerManager.fleets;
			var availableFleetInd = -1;
			// start from the 2nd fleet
			for (var i = 1; i < 4; ++i) {
				// find one available fleet
				if (fleets[i].mission[0] === 0) {
					availableFleetInd = i;
					break;
				}
			}

			if (availableFleetInd !== -1) {
				selectedFleet = availableFleetInd + 1;
				console.log("Find available fleet: " + String(selectedFleet));

				$("#atab_expeditionPlanner").trigger("click");
				$(".module.controls .fleet_num").each( function(i,v) {
					var thisFleet = parseInt( $(this).text(), 10);
					if (thisFleet === availableFleetInd + 1) {
						$(this).trigger("click");
					}
				});
			} else {
                // knowing fleet #2, #3 and #4 are all unavailable,
                // we can return focus to the main fleet.
				$(".module.controls .fleet_num").each( function(i,v) {
					var thisFleet = parseInt( $(this).text(), 10);
					if (thisFleet === 1) {
						$(this).trigger("click");
					}
				});
				// also return focus to basic tab
				$("#atab_basic").trigger("click");
            }
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
		},

		UpdateExpeditionPlanner: function (data) {

		    $( ".module.activity .activity_expeditionPlanner .expres_greatbtn img" )
                .attr("src", "../../../../assets/img/ui/btn-"+(plannerIsGreatSuccess?"":"x")+"gs.png");
			$(".dropdown_title").text("Expedition #"+String(selectedExpedition));

			var allShips = [];
			var fleetObj = PlayerManager.fleets[selectedFleet-1];
			//fleets' subsripts start from 0 !
			$.each(PlayerManager.fleets[selectedFleet-1].ships, function(index, rosterId) {
				if (rosterId > -1) {
					var CurrentShip = KC3ShipManager.get(rosterId);
					if (CurrentShip.masterId > 0) {
						allShips.push(CurrentShip);

					}
				}
			});
			if (allShips.length <= 0)
				return;

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

			var numLandingCrafts = fleetObj.countLandingCrafts();
			if (numLandingCrafts > 4)
				numLandingCrafts = 4;
			var landingCraftFactor = 0.05*numLandingCrafts + 1;
			var greatSuccessFactor = plannerIsGreatSuccess ? 1.5 : 1;

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
				var incomeVal = Math.floor( ExpdIncome[v] * landingCraftFactor * greatSuccessFactor );
				var jqObj = $( "."+v, resourceRoot );
				var netResourceIncome = incomeVal;
				if (v === "fuel" || v === "ammo") {
					netResourceIncome -= ExpdFleetCost[v];
				}

				var tooltipText = String(ExpdIncome[v]);
				if (landingCraftFactor > 1)
					tooltipText += "*" + String(landingCraftFactor);
				if (greatSuccessFactor > 1)
					tooltipText += "*" + String(greatSuccessFactor);
				if (v === "fuel" || v === "ammo") {
					tooltipText += "-" + String(ExpdFleetCost[v]);
				}

				jqObj.text( netResourceIncome );
				jqObj.attr( 'title', tooltipText );
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
						shipReqBox.text(dataReq[index].stypeOneOf+":"+dataReq[index].stypeReqCount);
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

			if (unsatRequirements.length === 0) {
				// all requirements are satisfied
				$( ".module.activity .activity_expeditionPlanner .icon.allReq" ).show();

				markPassed( $(".module.activity .activity_expeditionPlanner .text.allReq") );
			} else {
				$( ".module.activity .activity_expeditionPlanner .icon.allReq" ).hide();
				markFailed( $(".module.activity .activity_expeditionPlanner .text.allReq") );
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
			.text( PlayerManager.hq.exp[hqDt] );
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
			context = $(".module.status"),
			dockElm = $(".status_docking .status_text",context),
			koskElm = $(".status_akashi  .status_text",context); // kousaka-kan
		if(typeof docking==="object") {
			akashi  = docking.akashi;
			docking = docking.docking;
		}
		if(typeof docking!=="undefined") dockElm.data("value",Math.ceil(docking));
		if(typeof  akashi!=="undefined") koskElm.data("value",Math.ceil( akashi));
		[dockElm,koskElm].forEach(function(elm){
			elm.removeClass("bad").removeAttr("title");
			switch (ConfigManager.timerDisplayType) {
			case 1:
				elm.text(String(elm.data("value")).toHHMMSS());
				break;
			case 2:
				elm.text(String(elm.data("value") || NaN).plusCurrentTime());
				if((elm.data("value") || 0) > 86400) {
					elm.addClass("bad").attr("title","More than 24 hours");
				}
				break;
			}
		});
	}
})();
