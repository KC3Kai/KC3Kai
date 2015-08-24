(function(){
	"use strict";
	_gaq.push(['_trackEvent', "Panel: Natsuiro Theme", 'clicked']);
	
	// Flags
	var currentLayout = "";
	var isRunning = false;
	
	// Interface values
	var selectedFleet = 1;
	
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
		}).addClass("hover");
		
		// eLoS Toggle
		$(".summary-eqlos").on("click",function(){
			ConfigManager.scrollElosMode();
			$(".summary-eqlos .summary_icon img").attr("src", "../../../../assets/img/stats/"+(ConfigManager.elosFormula == 1) ? "lst" : (ConfigManager.elosFormula == 2) ? "lse" : "ls"+".png");
			$(".summary-eqlos .summary_text").text( Math.round(((selectedFleet < 5) ? PlayerManager.fleets[selectedFleet-1].eLoS() : PlayerManager.fleets[0].eLoS()+PlayerManager.fleets[1].eLoS() * 100) / 100 );
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
		
		// Switching Activity Tabs
		$(".module.activity .activity_tab").on("click", function(){
			if($(this).data("target")===""){ return false; }
			$(".module.activity .activity_tab").removeClass("active");
			$(this).addClass("active");
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_"+$(this).data("target")).show();
		});
		$(".module.activity .activity_tab.active").trigger("click");
		
		$(".module.activity .activity_dismissable").on("click", function(){
			// $("#atab_basic").trigger("click");
		});
		
		
		// Fleet selection
		$(".module.controls .fleet_num").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(".module.controls .fleet_rengo").removeClass("active");
			$(this).addClass("active");
			selectedFleet = parseInt( $(this).text(), 10);
			NatsuiroListeners.Fleet();
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
			$("#atab_basic").trigger("click");
		},
		
		CatBomb: function(data){
			$("#catBomb").hide();
			$("#catBomb .title").html( data.title );
			$("#catBomb .description").html( data.message );
			$("#catBomb").fadeIn(300);
		},
		
		HQ: function(data){
			var
				maxHQ  = Object.keys(KC3Meta._exp).map(function(a){return parseInt(a);}).reduce(function(a,b){return a>b?a:b;}),
				hqDt   = (PlayerManager.hq.level>=maxHQ ? 3 : ConfigManager.hqExpDetail),
				hqt    = KC3Meta.term("HQExpAbbrev" + hqDt),
				hqexpd = Math.abs($(".admiral_lvnext").attr("data-exp-gain"));
			$(".admiral_name").text( PlayerManager.hq.name );
			$(".admiral_comm").text( PlayerManager.hq.desc );
			$(".admiral_rank").text( PlayerManager.hq.rank );
			$(".admiral_lvval").text( PlayerManager.hq.level );
			$(".admiral_lvbar").css({width: Math.round(PlayerManager.hq.exp[0]*58)+"px"});
			$(".admiral_lvnext")
				.attr("data-exp",hqt)
				.attr("data-exp-gain",((($(".admiral_lvnext").attr("data-exp-gain")||"").length > 0) ? (KC3SortieManager.hqExpGained * (hqDt == 1 ? -1 : 1)) : ""))
				.text( PlayerManager.hq.exp[hqDt] * (hqDt == 1 ? -1 : 1) );
		},
		
		Consumables: function(data){
			$(".count_fcoin").text( PlayerManager.consumables.fcoin );
			$(".count_buckets").text( PlayerManager.consumables.buckets );
			$(".count_screws").text( PlayerManager.consumables.screws );
			$(".count_torch").text( PlayerManager.consumables.torch );
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
					elos: Math.round( (MainFleet.eLoS()+EscortFleet.eLoS()) * 100) / 100,
					air: Math.round( (MainFleet.fighterPower() + EscortFleet.fighterPower())* 100) / 100,
					speed:
						(MainFleet.fastFleet && EscortFleet.fastFleet)
						? KC3Meta.term("SpeedFast") : KC3Meta.term("SpeedSlow"),
					docking:
						(MainRepairs.docking > EscortRepairs.docking)
						? MainRepairs.docking : EscortRepairs.docking,
					akashi:
						(MainRepairs.akashi > EscortRepairs.akashi)
						? MainRepairs.akashi : EscortRepairs.akashi,
					hasTaiha: MainFleet.hasTaiha() || EscortFleet.hasTaiha(),
					supplied: MainFleet.isSupplied() && EscortFleet.isSupplied(),
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
					air: CurrentFleet.fighterPower(),
					speed: CurrentFleet.speed(),
					docking: MainRepairs.docking,
					akashi: MainRepairs.akashi,
					hasTaiha: CurrentFleet.hasTaiha(),
					supplied: CurrentFleet.isSupplied(),
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
			
			// STATUS: RESUPPLY
			if( FleetSummary.supplied ){
				$(".module.status .status_supply .status_text").text( KC3Meta.term("PanelSupplied") );
				$(".module.status .status_supply img").attr("src", "../../../../assets/img/ui/check.png");
				$(".module.status .status_supply .status_text").addClass("good");
			}else{
				$(".module.status .status_supply .status_text").text( KC3Meta.term("PanelNotSupplied") );
				$(".module.status .status_supply img").attr("src", "../../../../assets/img/ui/sunk.png");
				$(".module.status .status_supply .status_text").addClass("bad");
			}
			
			// STATUS: MORALE
			if( FleetSummary.lowestMorale > 54 ){
				$(".module.status .status_morale .status_text").text( KC3Meta.term("PanelGreatMorale") );
				$(".module.status .status_morale img").attr("src", "../../../../assets/img/ui/check.png");
				$(".module.status .status_morale .status_text").addClass("good");
			}else if( FleetSummary.lowestMorale >= ConfigManager.alert_morale_value ){
				$(".module.status .status_morale .status_text").text( KC3Meta.term("PanelGoodMorale") );
				$(".module.status .status_morale img").attr("src", "../../../../assets/img/ui/check.png");
				$(".module.status .status_morale .status_text").addClass("good");
			}else{
				var MissingMorale = ConfigManager.alert_morale_value - FleetSummary.lowestMorale;
				var MoraleTime = (Math.ceil(MissingMorale/3)*3)*60;
				$(".module.status .status_morale .status_text").text(String(MoraleTime).toHHMMSS());
				$(".module.status .status_morale img").attr("src", "../../../../assets/img/ui/sunk.png");
				$(".module.status .status_morale .status_text").addClass("bad");
			}
			
			// STATUS: TAIHA
			if( FleetSummary.hasTaiha ){
				$(".module.status .status_repair .status_text").text( KC3Meta.term("PanelHasTaiha") );
				$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/sunk.png");
				$(".module.status .status_repair .status_text").addClass("bad");
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
			$(".module.status .status_docking .status_text").text(String(FleetSummary.docking).toHHMMSS());
			$(".module.status .status_akashi .status_text").text(String(FleetSummary.akashi).toHHMMSS());
			$(".module.status .status_docking").attr("title", KC3Meta.term("PanelHighestDocking") );
			$(".module.status .status_akashi").attr("title", KC3Meta.term("PanelHighestAkashi") );
			$(".module.status .status_support").attr("title", KC3Meta.term("PanelSupportPower") );
		},
		
		SortieStart: function(data){
			// Clear battle details box
			clearSortieData();
			
			// Show world map and difficulty
			$(".module.activity .map_world").text(
				KC3SortieManager.map_world
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
			
			// Day battle-only environment
			if(!thisNode.startNight){
				// If support expedition is triggered on this battle
				if(thisNode.supportFlag){
					$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support.png");
				}else{
					$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support-x.png");
				}
				
				// If night battle will be asked after this battle
				if(thisNode.yasenFlag){
					$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
				}else{
					$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen-x.png");
				}
				
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
			
			$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+thisNode.rating+".png");
			
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
			thisPvP.engage( data.battle,data.fleetSent );
			
			// Enemy Formation
			if((typeof thisPvP.eformation != "undefined") && (thisPvP.eformation > -1)){
				$(".module.activity .battle_eformation img").attr("src",
					KC3Meta.formationIcon(thisPvP.eformation));
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
		}
	};
	
	function CraftGearStats(MasterItem, StatProperty, Code){
		if(parseInt(MasterItem["api_"+StatProperty], 10) !== 0){
			var thisStatBox = $("#factory .equipStat").clone().appendTo(".module.activity .activity_crafting .equipStats");
			
			$("img", thisStatBox).attr("src", "../../../../assets/img/stats/"+Code+".png");
			$(".equipStatText", thisStatBox).text( MasterItem["api_"+StatProperty] );
		}
	}
	
})();
