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
			$(".module.activity .activity_tab").removeClass("active");
			$(this).addClass("active");
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_"+$(this).data("target")).show();
		});
		$(".module.activity .activity_tab.active").trigger("click");
		
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
			.removeClass("nc_avoid");
		$(".module.activity .node_types").hide();
	}
	
	function clearBattleData(){
		$(".module.activity .abyss_ship img").attr("src", KC3Meta.abyssIcon(-1));
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
			$(".admiral_name").text( PlayerManager.hq.name );
			$(".admiral_comm").text( PlayerManager.hq.desc );
			$(".admiral_rank").text( PlayerManager.hq.rank );
			$(".admiral_lvval").text( PlayerManager.hq.level );
			$(".admiral_lvbar").css({width: Math.round(PlayerManager.hq.exp[0]*58)+"px"});
			$(".admiral_lvnext").text( "-"+PlayerManager.hq.exp[1] );
		},
		
		Consumables: function(data){
			$(".count_fcoin").text( PlayerManager.consumables.fcoin );
			$(".count_buckets").text( PlayerManager.consumables.buckets );
			$(".count_screws").text( PlayerManager.consumables.screws );
			$(".count_torch").text( PlayerManager.consumables.torch );
		},
		
		ShipSlots: function(data){
			$(".count_ships").text( KC3ShipManager.count() ).each(function(){
				if((KC3ShipManager.max - KC3ShipManager.count()) <= 5){
					$(this).addClass("danger");
				}else{
					$(this).removeClass("danger");
				}
			});
			$(".max_ships").text( "/"+ KC3ShipManager.max );
		},
		
		GearSlots: function(data){
			$(".count_gear").text( KC3GearManager.count() ).each(function(){
				if((KC3GearManager.max - KC3GearManager.count()) <= 20){
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
		
		Fleet: function(data){
			var FleetSummary;
			$(".shiplist_single").html("");
			$(".shiplist_single").hide();
			$(".shiplist_combined_fleet").html("");
			$(".shiplist_combined").hide();
			
			// COMBINED
			if(selectedFleet==5){
				var MainFleet = PlayerManager.fleets[0];
				var EscortFleet = PlayerManager.fleets[1];
				FleetSummary = {
					lv: MainFleet.totalLevel() + EscortFleet.totalLevel(),
					elos: Math.round( (MainFleet.eLoS()+EscortFleet.eLoS()) * 100) / 100,
					air: MainFleet.fighterPower() + EscortFleet.fighterPower(),
					speed:
						(MainFleet.fastFleet && EscortFleet.fastFleet)
						? KC3Meta.term("SpeedFast") : KC3Meta.term("SpeedSlow")
				};
				$.each(MainFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".sship", rosterId))
							.commonElements()
							.defineShort()
							.appendTo(".module.fleet .shiplist_main");
					}
				});
				$.each(EscortFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".sship", rosterId))
							.commonElements()
							.defineShort()
							.appendTo(".module.fleet .shiplist_escort");
					}
				});
				$(".shiplist_combined").show();
				
			// SINGLE
			}else{
				var CurrentFleet = PlayerManager.fleets[selectedFleet-1];
				FleetSummary = {
					lv: CurrentFleet.totalLevel(),
					elos: Math.round( CurrentFleet.eLoS() * 100) / 100,
					air: CurrentFleet.fighterPower(),
					speed: CurrentFleet.speed()
				};
				$.each(CurrentFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".lship", rosterId))
							.commonElements()
							.defineLong()
							.appendTo(".module.fleet .shiplist_single");
					}
				});
				$(".shiplist_single").show();
			}
			
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
		},
		
		SortieStart: function(data){
			// Clear battle details box
			clearSortieData();
			
			// Show world map and difficulty
			$(".module.activity .map_world").text(
				KC3SortieManager.map_world
				+"-"
				+KC3SortieManager.map_num
				+["","E","N","H"][ KC3SortieManager.map_difficulty ]
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
			
			switch(thisNode.type){
				// Battle node
				case "battle":
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_battle");
					$(".module.activity .node_type_battle").show();
					break;
				
				// Resource node
				case "resource":
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_resource");
					$(".module.activity .node_type_resource .node_res_icon").attr("src",
						thisNode.icon("../../../../assets/img/client/"));
					$(".module.activity .node_type_resource .node_res_text").text( thisNode.amount );
					$(".module.activity .node_type_resource").show();
					break;
					
				// Bounty node on 1-6
				case "bounty":
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_resource");
					$(".module.activity .node_type_resource .node_res_icon").attr("src",
						thisNode.icon("../../../../assets/img/client/"));
					$(".module.activity .node_type_resource .node_res_text").text( thisNode.amount );
					$(".module.activity .node_type_resource").show();
					break;
				
				// Maelstrom <node></node>
				case "maelstrom":
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_maelstrom");
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_resource");
					$(".module.activity .node_type_resource .node_res_icon").attr("src",
						thisNode.icon("../../../../assets/img/client/"));
					$(".module.activity .node_type_resource .node_res_text").text( -thisNode.amount );
					$(".module.activity .node_type_resource").show();
					break;
					
				// Battle avoided node
				default:
					$(".module.activity .sortie_node_"+numNodes).addClass("nc_avoid");
					$(".module.activity .node_type_text").text("~Battle Avoided~");
					$(".module.activity .node_type_text").show();
					break;
			}
		},
		
		BattleStart: function(data){
			// Clear battle details box just to make sure
			clearBattleData();
			
			var thisNode = KC3SortieManager.currentNode();
			var battleData = (thisNode.startNight)? thisNode.battleNight : thisNode.battleDay;
			
			// Load enemy icons
			$.each(thisNode.eships, function(index, eshipId){
				if(eshipId > -1){
					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("src", KC3Meta.abyssIcon(eshipId));
					$(".module.activity .abyss_ship_"+(index+1)).show();
				}
			});
			
			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP;
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisNode.enemyHP[index].currentHp;
						if(newEnemyHP < 0){ newEnemyHP = 0; }
						
						if(newEnemyHP === 0){
							$(".module.activity .abyss_ship_"+(index+1)).css("opacity", "0.6");
						}
						
						$(".module.activity .abyss_hp_bar_"+(index+1)).css("width",
							28*( newEnemyHP / thisNode.originalHPs[index+7] ));
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
				$(".module.activity .battle_support img", container).attr("src", "../../../../assets/img/ui/dark_support-x.png");
				$(".module.activity .battle_night img", container).attr("src", "../../../../assets/img/ui/dark_yasen.png");
			}
			
			this.Fleet();
		},
		
		BattleNight: function(data){
			this.Fleet();
			
			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP;
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisNode.enemyHP[index].currentHp;
						if(newEnemyHP < 0){ newEnemyHP = 0; }
						
						if(newEnemyHP === 0){
							$(".module.activity .abyss_ship_"+(index+1)).css("opacity", "0.6");
						}
						
						$(".module.activity .abyss_hp_bar_"+(index+1)).css("width",
							28*( newEnemyHP / thisNode.originalHPs[index+7] ));
						$(".module.activity .abyss_hp_"+(index+1)).show();
					}
				});
			}
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
			if (data.itemId !== null) {
				// Get equipment data
				var PlayerItem = KC3GearManager.get( data.itemId );
				var MasterItem = KC3Master.slotitem( data.itemMasterId );
				
				// Show basic info of the item
				icon = "../../../../assets/img/items/"+MasterItem.api_type[3]+".png";
				// $(".craftGear .equipIcon img", container).attr("src", icon);
				// $(".craftGear .equipName", container).text( PlayerItem.name() );
				
				// Show extra item info
				var countExisting = KC3GearManager.countByMasterId( data.itemMasterId );
				if(countExisting == 1){
					// $(".craftGear .equipNote", container).html("This is your <strong>first</strong>!");
				}else{
					// $(".craftGear .equipNote", container).html("You now have <strong>"+countExisting+"</strong> of this item!");
				}
				
				// Show item stats
				/*$(".equipStats", container).html("");
				CraftGearStats(container, MasterItem, "souk", "ar");
				CraftGearStats(container, MasterItem, "houg", "fp");
				CraftGearStats(container, MasterItem, "raig", "tp");
				CraftGearStats(container, MasterItem, "soku", "sp");
				CraftGearStats(container, MasterItem, "baku", "dv");
				CraftGearStats(container, MasterItem, "tyku", "aa");
				CraftGearStats(container, MasterItem, "tais", "as");
				CraftGearStats(container, MasterItem, "houm", "ht");
				CraftGearStats(container, MasterItem, "houk", "ev");
				CraftGearStats(container, MasterItem, "saku", "ls");
				CraftGearStats(container, MasterItem, "leng", "rn");*/
			} else {
				// $(".craftGear .equipIcon img", container).attr("src", icon);
				// $(".craftGear .equipName", container).text( "Equipment crafting failed" );
				// $(".craftGear .equipNote",container).html("");
				// $(".equipStats", container).html("");
			}
			
			// Show resource used
			$(".craftGear .used1").text( data.resourceUsed[0] );
			$(".craftGear .used2").text( data.resourceUsed[1] );
			$(".craftGear .used3").text( data.resourceUsed[2] );
			$(".craftGear .used4").text( data.resourceUsed[3] );

			// Show the box
			$(".craftGear", container).fadeIn(500);
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
				if(eshipId > -1){
					$(".module.activity .abyss_ship_"+(index+1)+" img").attr("src", KC3Meta.shipIcon(eshipId));
					$(".module.activity .abyss_ship_"+(index+1)).show();
				}
			});
			
			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP;
				$.each(thisPvP.eships, function(index, eshipId){
					if(eshipId > -1){
						newEnemyHP = thisPvP.enemyHP[index].currentHp;
						if(newEnemyHP < 0){ newEnemyHP = 0; }
						
						if(newEnemyHP === 0){
							$(".module.activity .abyss_ship_"+(index+1)).css("opacity", "0.6");
						}
						
						$(".module.activity .abyss_hp_bar_"+(index+1)).css("width",
							28*( newEnemyHP / thisPvP.originalHPs[index+7] ));
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
			this.Fleet();
		},
		
		PvPEnd: function(data){
			$(".module.activity .battle_rating img").attr("src", "../../../../assets/img/client/ratings/"+data.result.api_win_rank+".png");
		}
	};
	
})();
