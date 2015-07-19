(function(){
	"use strict";
	
	window.ThemeDefaultHorizontal = new KC3Dashboard({
		container: "#h",
		externalHtml: "horizontal/horizontal.html",
		variables: {
			selectedFleet: 1
		},
		ready: function(){
			var self = this;
			
			// Select fleet tab
			$(".fleet-button", this.domElement).on("click", function(){
				self.data.selectedFleet = $(this).data("id");
				$(".fleet-button", self.domElement).removeClass("active");
				$(".fleet-button-"+self.data.selectedFleet, self.domElement).addClass("active");
				self.trigger("Fleet");
			});
			
			// Change eLoS Formula
			$(".eqlos-toggle img", this.domElement).attr("src", "../../../../assets/img/stats/los"+ConfigManager.elosFormula+".png");
			$(".eqlos-toggle", this.domElement).on("click", function(){
				ConfigManager.scrollElosMode();
				KC3Network.trigger("Fleet");
				$(".eqlos-toggle img", self.domElement).attr("src", "../../../../assets/img/stats/los"+ConfigManager.elosFormula+".png");
			});
			
			// Initialize timer objects with bindings to their UI
			KC3TimerManager.init([
				$(".exped-box-1", this.domElement),
				$(".exped-box-2", this.domElement),
				$(".exped-box-3", this.domElement)
			],
			[
				$(".repair-box-1", this.domElement),
				$(".repair-box-2", this.domElement),
				$(".repair-box-3", this.domElement),
				$(".repair-box-4", this.domElement)
			],
			[
				$(".build-box-1", this.domElement),
				$(".build-box-2", this.domElement),
				$(".build-box-3", this.domElement),
				$(".build-box-4", this.domElement)
			]);
			
			// Update Timer UIs
			setInterval(function(){
				KC3TimerManager.update();
			}, 1000);
			
			// Screenshot button
			$(".screenshot-button", this.domElement).on("click", function(){
				$(this).hide();
				
				// Tell service to pass a message to gamescreen on inspected window to get a screenshot
				(new RMsg("service", "screenshot", {
					tabId: chrome.devtools.inspectedWindow.tabId,
					playerName: PlayerManager.hq.name
				}, function(response){
					console.log(response);
					$(".screenshot-button", self.domElement).show();
				})).execute();
			});
			
			// Exit battle mode
			$(".battle .battle_revert", this.domElement).on("click", function(){
				KC3Panel.mode = "normal";
				$(".normal", self.domElement).show();
				$(".battle", self.domElement).hide();
				self.trigger("HQ");
				self.trigger("Fleet");
				self.trigger("ShipSlots");
				self.trigger("GearSlots");
				self.trigger("Consumables");
				self.trigger("Timers");
				self.trigger("Quests");
			});
			
			// Quest reset
			$(".box-quests", this.domElement).on("mouseover", function(){
				$(".box-quest-resets", this.domElement).show();
			});
			$(".box-quests", this.domElement).on("mouseout", function(){
				$(".box-quest-resets", this.domElement).hide();
			});
			$(".box-quest-reset", this.domElement).on("click", function(){
				switch($(this).data("type")){
					case 1: KC3QuestManager.resetDailies(); break;
					case 2: KC3QuestManager.resetWeeklies(); break;
					case 3: KC3QuestManager.resetMonthlies(); break;
					default: KC3QuestManager.clear(); break;
				}
				self.trigger("Quests");
			});
			
			// Hide activity boxes
			$(".activityBox.craftGear").on("click", function(){
				$(this).hide();
			});
		},
		listeners: {
			GameStart: function(container, data, local){
				
			},
			CatBomb: function(container, data, local){
				
			},
			HomeScreen: function(container, data, local){
				/*KC3Panel.mode = "battle";
				$(".normal", container).hide();
				$(".battle", container).show();*/
				KC3Panel.mode = "normal";
				$(".normal", container).show();
				$(".battle", container).hide();
			},
			HQ: function(container, data, local){
				if(KC3Panel.mode=="normal"){
					$(".admiral_name", container).text( PlayerManager.hq.name );
					$(".admiral_comm", container).text( PlayerManager.hq.desc );
					$(".admiral_rank", container).text( PlayerManager.hq.rank );
					$(".level_value", container).text( PlayerManager.hq.level );
					$(".exp_bar", container).css({width: (PlayerManager.hq.exp[0]*90)+"px"});
					$(".exp_text", container).text( PlayerManager.hq.exp[1] );
				}else if(KC3Panel.mode=="battle"){
					$(".battle_admiral", container).text( PlayerManager.hq.name );
					$(".battle_hqlevel_text", container).text( PlayerManager.hq.level );
					$(".battle_hqexpval", container).css({width: (PlayerManager.hq.exp[0]*60)+"px"});
					$(".battle_hqlevel_next", container).text( PlayerManager.hq.exp[1] );
				}
			},
			Consumables: function(container, data, local){
				$(".count_fcoin", container).text( PlayerManager.consumables.fcoin );
				$(".count_buckets", container).text( PlayerManager.consumables.buckets );
				$(".count_screws", container).text( PlayerManager.consumables.screws );
				$(".count_torch", container).text( PlayerManager.consumables.torch );
			},
			ShipSlots: function(container, data, local){
				$(".count_ships", container).text( KC3ShipManager.count() );
				$(".max_ships", container).text( KC3ShipManager.max );
			},
			GearSlots: function(container, data, local){
				$(".count_gear", container).text( KC3GearManager.count() );
				$(".max_gear", container).text( KC3GearManager.max );
			},
			Timers: function(container, data, local){
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
			Quests: function(container, data, local){
				KC3QuestManager.load();
				// Get active quests
				var activeQuests = KC3QuestManager.getActives();
				
				if(KC3Panel.mode=="normal"){
					$(".box-quests .box-quest .color", container).removeClass("type1");
					$(".box-quests .box-quest .color", container).removeClass("type2");
					$(".box-quests .box-quest .color", container).removeClass("type3");
					$(".box-quests .box-quest .color", container).removeClass("type4");
					$(".box-quests .box-quest .color", container).removeClass("type5");
					$(".box-quests .box-quest .color", container).removeClass("type6");
					$(".box-quests .box-quest .color", container).removeClass("type7");
					$(".box-quests .box-quest", container).hide();
					
					// Show each of them on interface
					$.each(activeQuests, function(index, quest){
						var questType = (quest.id+"").substring(0,1);
						$(".box-quests .quest-box-"+(index+1)+" .color", container).addClass( "type"+questType );
						if(quest.meta){
							$(".box-quests .quest-box-"+(index+1)+" .name div", container).text( quest.meta().name );
						}else{
							$(".box-quests .quest-box-"+(index+1)+" .name div", container).text("?");
						}
						$(".box-quests .quest-box-"+(index+1)+" .status", container).text( quest.outputShort() );
						$(".box-quests .quest-box-"+(index+1), container).show();
					});
					
				}else if(KC3Panel.mode=="battle"){
					$(".battle_quests .battle_quest .color", container).removeClass("type1");
					$(".battle_quests .battle_quest .color", container).removeClass("type2");
					$(".battle_quests .battle_quest .color", container).removeClass("type3");
					$(".battle_quests .battle_quest .color", container).removeClass("type4");
					$(".battle_quests .battle_quest .color", container).removeClass("type5");
					$(".battle_quests .battle_quest .color", container).removeClass("type6");
					$(".battle_quests .battle_quest .color", container).removeClass("type7");
					$(".battle_quests .battle_quest", container).hide();
					
					// Show each of them on interface
					$.each(activeQuests, function(index, quest){
						var questType = (quest.id+"").substring(0,1);
						$(".battle_quests .quest-box-"+(index+1)+" .color", container).addClass( "type"+questType );
						if(quest.meta){
							$(".battle_quests .quest-box-"+(index+1)+" .name div", container).text( quest.meta().name );
						}else{
							$(".battle_quests .quest-box-"+(index+1)+" .name div", container).text("?");
						}
						$(".battle_quests .quest-box-"+(index+1)+" .status", container).text( quest.outputShort() );
						$(".battle_quests .quest-box-"+(index+1), container).show();
					});
				}
			},
			Fleet: function(container, data, local){
				var CurrentFleet, FleetContainer;
				if(KC3Panel.mode=="normal"){
					CurrentFleet = PlayerManager.fleets[local.selectedFleet-1];
					
					// Fleet Summary Stats
					$(".summary-level .summary-text", container).text( CurrentFleet.totalLevel() );
					$(".summary-eqlos .summary-text", container).text( Math.round( CurrentFleet.eLoS() * 100) / 100 );
					$(".summary-airfp .summary-text", container).text( CurrentFleet.fighterPower() );
					$(".summary-speed .summary-text", container).text( CurrentFleet.speed() );
					container.css("box-shadow", "none");
					
					// Fleet Ships
					FleetContainer = $(".fleet-ships", container);
					FleetContainer.html("");
					$.each(CurrentFleet.ships, function(index, rosterId){
						if(rosterId > -1){
							var CurrentShip = KC3ShipManager.get( rosterId );
							if(CurrentShip.masterId === 0){ return true; }
							var ShipBox = $(".factory .fleet-ship", container).clone().appendTo(FleetContainer);
							
							$(".ship-img img", ShipBox).attr("src", KC3Meta.shipIcon(CurrentShip.masterId));
							$(".ship-name", ShipBox).text( CurrentShip.name() );
							$(".ship-type", ShipBox).text( CurrentShip.stype() );
							$(".ship-lvl-txt", ShipBox).text(CurrentShip.level);
							$(".ship-lvl-next", ShipBox).text("-"+CurrentShip.exp[1]);
							$(".ship-lvl-val", ShipBox).css("width", (60*(CurrentShip.exp[2]/100))+"px");
							
							FleetHP(container, ShipBox, CurrentShip.hp, rosterId );
							FleetMorale( $(".ship-morale-box", ShipBox), CurrentShip.morale );
							FleetEquipment( $(".ship-gear-1", ShipBox), CurrentShip.equipment(0), CurrentShip.slots[0] );
							FleetEquipment( $(".ship-gear-2", ShipBox), CurrentShip.equipment(1), CurrentShip.slots[1] );
							FleetEquipment( $(".ship-gear-3", ShipBox), CurrentShip.equipment(2), CurrentShip.slots[2] );
							FleetEquipment( $(".ship-gear-4", ShipBox), CurrentShip.equipment(3), CurrentShip.slots[3] );
						}
					});
                                    
                                    
                                    try {
                                        var expeditionAnalyzeResult = ExpeditionHelper.analyzeFleet( CurrentFleet );
                                        if (expeditionAnalyzeResult) {
                                            expeditionAnalyzeResult.e = expeditionAnalyzeResult.e.join(",");
                                            $(".expedition-helper").text(JSON.stringify( expeditionAnalyzeResult ));
                                        } else {
                                            $(".expedition-helper").text( "no result" );
                                        }
                                    } catch (e) 
                                    {
                                        $(".expedition-helper").text("error: " + e);
                                    }

					// Expedition Timer Faces
					KC3TimerManager._exped[0].face( PlayerManager.fleets[1].ship(0).masterId );
					KC3TimerManager._exped[1].face( PlayerManager.fleets[2].ship(0).masterId );
					KC3TimerManager._exped[2].face( PlayerManager.fleets[3].ship(0).masterId );
					
				}else if(KC3Panel.mode=="battle"){
					// Combined Fleet
					if(PlayerManager.combinedFleet){
						var MainFleet = PlayerManager.fleets[0];
						var EscortFleet = PlayerManager.fleets[1];
						
						console.log("MainFleet", MainFleet);
						console.log("EscortFleet", EscortFleet);
						
						$(".battle .battle_singlefleet", container).hide();
						$(".battle .battle_mainfleet", container).show();
						$(".battle .battle_escorts", container).show();
						
					// Single-Fleet Sortie
					}else{
						CurrentFleet = PlayerManager.fleets[ KC3SortieManager.fleetSent-1 ];
						
						// Fleet Summary Stats
						$(".battle-level .summary-text", container).text( CurrentFleet.totalLevel() );
						$(".battle-eqlos .summary-text", container).text( Math.round( CurrentFleet.eLoS() * 100) / 100 );
						$(".battle-airfp .summary-text", container).text( CurrentFleet.fighterPower() );
						$(".battle-speed .summary-text", container).text( CurrentFleet.speed() );
						container.css("box-shadow", "none");
						
						// Fleet Ships
						FleetContainer = $(".battle_singlefleet .battle_fleet_list", container);
						FleetContainer.html("");
						$.each(CurrentFleet.ships, function(index, rosterId){
							if(rosterId > -1){
								var CurrentShip = KC3ShipManager.get( rosterId );
								var ShipBox = $(".factory .battle-ship", container).clone().appendTo(FleetContainer);
								
								$(".ship-img img", ShipBox).attr("src", KC3Meta.shipIcon(CurrentShip.masterId));
								$(".ship-name", ShipBox).text( CurrentShip.name() );
								$(".ship-type", ShipBox).text( CurrentShip.stype() );
								$(".ship-lvl-txt", ShipBox).text(CurrentShip.level);
								$(".ship-lvl-next", ShipBox).text("-"+CurrentShip.exp[1]);
								$(".ship-lvl-val", ShipBox).css("width", (60*(CurrentShip.exp[2]/100))+"px");
								
								FleetHP(container, ShipBox, CurrentShip.hp, rosterId );
								FleetMorale( $(".ship-morale-box", ShipBox), CurrentShip.morale );
								FleetEquipment( $(".ship-gear-1", ShipBox), CurrentShip.equipment(0), CurrentShip.slots[0] );
								FleetEquipment( $(".ship-gear-2", ShipBox), CurrentShip.equipment(1), CurrentShip.slots[1] );
								FleetEquipment( $(".ship-gear-3", ShipBox), CurrentShip.equipment(2), CurrentShip.slots[2] );
								FleetEquipment( $(".ship-gear-4", ShipBox), CurrentShip.equipment(3), CurrentShip.slots[3] );
								
								var FuelPercent = CurrentShip.fuel / CurrentShip.master().api_fuel_max;
								var AmmoPercent = CurrentShip.ammo / CurrentShip.master().api_bull_max;
								$(".supply-fuel .supply-text", ShipBox).text(Math.floor(FuelPercent*100)+"%");
								$(".supply-ammo .supply-text", ShipBox).text(Math.floor(AmmoPercent*100)+"%");
								$(".supply-fuel .supply-bar", ShipBox).css("width", (50*FuelPercent)+"px");
								$(".supply-ammo .supply-bar", ShipBox).css("width", (50*AmmoPercent)+"px");
							}
						});
						
						$(".battle .battle_singlefleet", container).show();
					$(".battle .battle_mainfleet", container).hide();
						$(".battle .battle_escorts", container).hide();
					}
				}
			},
			SortieStart: function(container, data, local){
				KC3Panel.mode = "battle";
				
				// Show world details
				$(".battle .battle_world", container).text("World "+KC3SortieManager.map_world+" - "+KC3SortieManager.map_num);
				
				// Show boss node
				KC3SortieManager.onBossAvailable = function(){
					$.each(KC3SortieManager.boss.ships, function(index, eshipId){
						if(eshipId > -1){
							$(".battle .battle_boss .abyss_"+(index+1)+" img", container).attr("src", KC3Meta.abyssIcon(eshipId));
						}else{
							$(".battle .battle_boss .abyss_"+(index+1), container).hide();
						}
					});
				};
				
				// Trigger other listeners
				this.HQ(container, {}, local);
				this.ShipSlots(container, {}, local);
				this.GearSlots(container, {}, local);
				this.Fleet(container, {}, local);
				this.Quests(container, {}, local);
				
				// Clear previous nodes
				$(".battle .battle_node", container).removeClass("now");
				$(".battle .battle_node", container).removeClass("active");
				$(".battle .battle_node", container).text("");
				$(".battle .battle_nodenum", container).text("");
				
				// Change interface mode
				$(".normal", container).hide();
				$(".battle", container).show();
			},
			CompassResult: function(container, data, local){
				var thisNode = KC3SortieManager.currentNode();
				var numNodes = KC3SortieManager.nodes.length;
				$(".battle .battle_node.active", container).removeClass("now");
				$(".battle .battle_node_"+numNodes, container).addClass( "active" );
				$(".battle .battle_node_"+numNodes, container).addClass( "now" );
				$(".battle .battle_node_"+numNodes, container).text( thisNode.id );
				$(".battle .battle_nodenum", container).text( thisNode.id );
				$(".battle .battle_current", container).text("NEXT NODE");
				$(".battle .battle_formation", container).hide();
				
				switch(thisNode.type){
					// Battle node
					case "battle":
						$(".battle .battle_nodebox", container).hide();
						break;
					
					// Resource node
					case "resource":
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_resource .battle_resicon img", container).attr("src", thisNode.icon("../../../../assets/img/client/"));
						$(".battle .battle_resource .battle_resamt", container).text( thisNode.amount );
						$(".battle .battle_resource", container).fadeIn(500);
						break;
						
					// Bounty node on 1-6
					case "bounty":
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_resource .battle_resicon img", container).attr("src", thisNode.icon("../../../../assets/img/client/"));
						$(".battle .battle_resource .battle_resamt", container).text( thisNode.amount );
						$(".battle .battle_resource", container).fadeIn(500);
						break;
					
					// Maelstrom node
					case "maelstrom":
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_maelstrom .battle_resicon img", container).attr("src", thisNode.icon("../../../../assets/img/client/"));
						$(".battle .battle_maelstrom .battle_resamt", container).text( -thisNode.amount );
						$(".battle .battle_maelstrom", container).fadeIn(500);
						break;
						
					// Battle avoided node
					default:
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_empty", container).fadeIn(500);
						break;
				}
				
				// Hide battle boxes
				$(".battle .battle_conditions", container).hide();
				$(".battle .battle_airbattle", container).hide();
				$(".battle .battle_results", container).hide();
			},
			BattleStart: function(container, data, local){
				if(KC3SortieManager.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
				$(".battle .battle_current", container).text("FIGHTING");
				var thisNode = KC3SortieManager.currentNode();
				var battleData = thisNode.battleDay;
				
				if((typeof thisNode.eformation != "undefined") && (thisNode.eformation > -1)){
					$(".battle .battle_formation img", container).attr("src", KC3Meta.formationIcon(thisNode.eformation));
					$(".battle .battle_formation", container).show();
				} else {
					$(".battle .battle_formation", container).hide();
				}
				
				$(".battle .battle_enemies .battle_abyss img", container).attr("src", KC3Meta.abyssIcon(-1));
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						$(".battle .battle_enemies .abyss_"+(index+1)+" img", container).attr("src", KC3Meta.abyssIcon(eshipId));
						$(".battle .battle_enemies .abyss_"+(index+1), container).show();
					}else{
						$(".battle .battle_enemies .abyss_"+(index+1), container).hide();
					}
				});
				
				// If support expedition is triggered on this battle
				if(thisNode.supportFlag){
					$(".battle .battle_support img", container).attr("src", "../../../../assets/img/ui/support.png");
				}else{
					$(".battle .battle_support img", container).attr("src", "../../../../assets/img/ui/support-x.png");
				}
				
				// If night battle will be asked after this battle
				if(thisNode.yasenFlag){
					$(".battle .battle_yasen img", container).attr("src", "../../../../assets/img/ui/yasen.png");
				}else{
					$(".battle .battle_yasen img", container).attr("src", "../../../../assets/img/ui/yasen-x.png");
				}
				
				// Battle conditions
				$(".battle .battle_cond_text", container).removeClass("good");
				$(".battle .battle_cond_text", container).removeClass("bad");
				
				$(".battle .battle_cond_detect .battle_cond_text", container).text( thisNode.detection[0] );
				$(".battle .battle_cond_detect .battle_cond_text", container).addClass( thisNode.detection[1] );
				
				$(".battle .battle_cond_engage .battle_cond_text", container).text( thisNode.engagement[2] );
				$(".battle .battle_cond_engage .battle_cond_text", container).addClass( thisNode.engagement[1] );
				
				$(".battle .battle_cond_contact .battle_cond_text", container).text(thisNode.fcontact +" vs "+thisNode.econtact);
				$(".battle .battle_cond_airbattle .battle_cond_text", container).text( thisNode.airbattle[0] );
				$(".battle .battle_cond_airbattle .battle_cond_text", container).addClass( thisNode.airbattle[1] );
				
				// Fighter phase
				$(".battle .battle_airfighter .battle_airally .battle_airbefore", container).text(thisNode.planeFighters.player[0]);
				$(".battle .battle_airfighter .battle_airabyss .battle_airbefore", container).text(thisNode.planeFighters.abyssal[0]);
				
				// Bombing Phase
				$(".battle .battle_airbomber", container).show();
				$(".battle .battle_airbomber .battle_airally .battle_airbefore", container).text(thisNode.planeBombers.player[0]);
				$(".battle .battle_airbomber .battle_airabyss .battle_airbefore", container).text(thisNode.planeBombers.abyssal[0]);
				
				// Plane losses
				$(".battle .battle_airafter", container).text("");
				if(thisNode.planeFighters.player[1] > 0){ $(".battle .battle_airfighter .battle_airally .battle_airafter", container).text("-"+thisNode.planeFighters.player[1]); }
				if(thisNode.planeFighters.abyssal[1] > 0){ $(".battle .battle_airfighter .battle_airabyss .battle_airafter", container).text("-"+thisNode.planeFighters.abyssal[1]); }
				if(thisNode.planeBombers.player[1] > 0){ $(".battle .battle_airbomber .battle_airally .battle_airafter", container).text("-"+thisNode.planeBombers.player[1]); }
				if(thisNode.planeBombers.abyssal[1] > 0){ $(".battle .battle_airbomber .battle_airabyss .battle_airafter", container).text("-"+thisNode.planeBombers.abyssal[1]); }
				
				// Revert rating and drop to default icons since we don't know results yet
				$(".battle .battle_rating img").attr("src", "../../../../assets/img/ui/rating.png");
				$(".battle .battle_drop img").attr("src", "../../../../assets/img/ui/shipdrop.png");
				
				// Show/hide battle details boxes
				$(".battle .battle_resource", container).hide();
				$(".battle .battle_enemies", container).show();
				$(".battle .battle_conditions", container).show();
				$(".battle .battle_airbattle", container).show();
				$(".battle .battle_results", container).show();
			},
			BattleNight: function(container, data, local){
				if(KC3SortieManager.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
				$(".battle .battle_current", container).text([
					"DESPERATE? :P",
					"LOL SKRUB",
					"ALL DA BONUSES",
					"KTKM hit le DD!",
					"1 HP toplel",
					"#DontGetYourHopesUp",
					"She had ONE job :(",
					"Sendai... onegai",
					"Do you even teitoku?",
					"Cut-in? Is that tasty?",
					"It's futile mang",
					"Let's all pray~",
					"RNGesus bless him",
					"I bless this run"
				][Math.floor(Math.random()*5)]);
				var thisNode = KC3SortieManager.currentNode();
				
			},
			BattleResult: function(container, data, local){
				if(KC3SortieManager.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
				$(".battle .battle_current", container).text("RESULTS");
				var thisNode = KC3SortieManager.currentNode();
				
				$(".battle .battle_rating img").attr("src", "../../../../assets/img/client/ratings/"+thisNode.rating+".png");
				
				if(thisNode.drop > 0){
					$(".battle .battle_drop img").attr("src", KC3Meta.shipIcon(thisNode.drop));
				}else{
					$(".battle .battle_drop img").attr("src", "../../../../assets/img/ui/shipdrop-x.png");
				}
			},
			CraftGear: function(container, data, local){
				if(!ConfigManager.info_craft){ return true; }
				
				// Hide any other activity box
				$(".activityBox", container).hide();
				
				// Get equipment data
				var PlayerItem = KC3GearManager.get( data.itemId );
				var MasterItem = KC3Master.slotitem( data.itemMasterId );
				
				// Show basic info of the item
				var icon = "../../../../assets/img/items/"+MasterItem.api_type[3]+".png";
				$(".craftGear .equipIcon img", container).attr("src", icon);
				$(".craftGear .equipName", container).text( PlayerItem.name() );
				
				// Show extra item info
				var countExisting = KC3GearManager.countByMasterId( data.itemMasterId );
				if(countExisting == 1){
					$(".craftGear .equipNote").html("This is your <strong>first</strong>!");
				}else{
					$(".craftGear .equipNote").html("You now have <strong>"+countExisting+"</strong> of this item!");
				}
				
				// Show resource used
				$(".craftGear .used1").text( data.resourceUsed[0] );
				$(".craftGear .used2").text( data.resourceUsed[1] );
				$(".craftGear .used3").text( data.resourceUsed[2] );
				$(".craftGear .used4").text( data.resourceUsed[3] );
				
				// Show item stats
				$(".equipStats", container).html("");
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
				CraftGearStats(container, MasterItem, "leng", "rn");
				
				// Show the box
				$(".craftGear", container).fadeIn(500);
			},
			CraftShip: function(container, data, local){
				
			},
			ClearedMap: function(container, data, local){
				
			},
			PvPStart: function(container, data, local){
				KC3Panel.mode = "battle";
				$(".battle .battle_world", container).text("PvP Practice Battle");
				$(".battle .battle_current", container).text("FIGHTING");
				KC3SortieManager.fleetSent = data.fleetSent;
				
				// Trigger other listeners
				this.HQ(container, {}, local);
				this.ShipSlots(container, {}, local);
				this.GearSlots(container, {}, local);
				this.Fleet(container, {}, local);
				this.Quests(container, {}, local);
				
				// Clear previous nodes
				$(".battle .battle_node", container).removeClass("now");
				$(".battle .battle_node", container).removeClass("active");
				$(".battle .battle_node", container).text("");
				$(".battle .battle_nodenum", container).text("");
				
				// Change interface mode
				$(".normal", container).hide();
				$(".battle", container).show();
				
				// Process PvP Battle
				var thisPvP = (new KC3Node()).defineAsBattle();
				thisPvP.engage( data.battle );
				
				// Show opponent ships faces
				$.each(thisPvP.eships, function(index, eshipId){
					if(eshipId > -1){
						$(".battle .battle_enemies .abyss_"+(index+1)+" img", container).attr("src", KC3Meta.shipIcon(eshipId));
						$(".battle .battle_enemies .abyss_"+(index+1)+" img", container).show();
					}else{
						$(".battle .battle_enemies .abyss_"+(index+1)+" img", container).hide();
					}
				});
				
				// If night battle will be asked after this battle
				if(thisPvP.yasenFlag){
					$(".battle .battle_yasen img", container).attr("src", "../../../../assets/img/ui/yasen.png");
				}else{
					$(".battle .battle_yasen img", container).attr("src", "../../../../assets/img/ui/yasen-x.png");
				}
				
				// Battle conditions
				$(".battle .battle_cond_text", container).removeClass("good");
				$(".battle .battle_cond_text", container).removeClass("bad");
				
				$(".battle .battle_cond_detect .battle_cond_text", container).text( thisPvP.detection[0] );
				$(".battle .battle_cond_detect .battle_cond_text", container).addClass( thisPvP.detection[1] );
				
				$(".battle .battle_cond_engage .battle_cond_text", container).text( thisPvP.engagement[2] );
				$(".battle .battle_cond_engage .battle_cond_text", container).addClass( thisPvP.engagement[1] );
				
				$(".battle .battle_cond_contact .battle_cond_text", container).text(thisPvP.fcontact +" vs "+thisPvP.econtact);
				$(".battle .battle_cond_airbattle .battle_cond_text", container).text( thisPvP.airbattle[0] );
				$(".battle .battle_cond_airbattle .battle_cond_text", container).addClass( thisPvP.airbattle[1] );
				
				// Fighter phase
				$(".battle .battle_airfighter .battle_airally .battle_airbefore", container).text(thisPvP.planeFighters.player[0]);
				$(".battle .battle_airfighter .battle_airabyss .battle_airbefore", container).text(thisPvP.planeFighters.abyssal[0]);
				
				// Bombing Phase
				$(".battle .battle_airbomber", container).show();
				$(".battle .battle_airbomber .battle_airally .battle_airbefore", container).text(thisPvP.planeBombers.player[0]);
				$(".battle .battle_airbomber .battle_airabyss .battle_airbefore", container).text(thisPvP.planeBombers.abyssal[0]);
				
				// Plane losses
				$(".battle .battle_airafter", container).text("");
				if(thisPvP.planeFighters.player[1] > 0){ $(".battle .battle_airfighter .battle_airally .battle_airafter", container).text("-"+thisPvP.planeFighters.player[1]); }
				if(thisPvP.planeFighters.abyssal[1] > 0){ $(".battle .battle_airfighter .battle_airabyss .battle_airafter", container).text("-"+thisPvP.planeFighters.abyssal[1]); }
				if(thisPvP.planeBombers.player[1] > 0){ $(".battle .battle_airbomber .battle_airally .battle_airafter", container).text("-"+thisPvP.planeBombers.player[1]); }
				if(thisPvP.planeBombers.abyssal[1] > 0){ $(".battle .battle_airbomber .battle_airabyss .battle_airafter", container).text("-"+thisPvP.planeBombers.abyssal[1]); }
				
				// Revert rating and drop to default icons since we don't know results yet
				$(".battle .battle_rating img").attr("src", "../../../../assets/img/ui/rating.png");
				$(".battle .battle_drop img").attr("src", "../../../../assets/img/ui/shipdrop.png");
				
				// Show/hide battle details boxes
				$(".battle .battle_resource", container).hide();
				$(".battle .battle_enemies", container).show();
				$(".battle .battle_conditions", container).show();
				$(".battle .battle_airbattle", container).show();
				$(".battle .battle_results", container).show();
			},
			PvPNight: function(container, data, local){
				
			},
			PvPEnd: function(container, data, local){
				
			}
		}
	});
	
	function CraftGearStats(container, MasterItem, StatProperty, Code){
		if(parseInt(MasterItem["api_"+StatProperty], 10) !== 0){
			var thisStatBox = $(".factory .equipStat", container).clone().appendTo( $(".equipStats", container) );
			$("img", thisStatBox).attr("src", "../../../../assets/img/stats/"+Code+".png");
			$(".equipStatText", thisStatBox).text( MasterItem["api_"+StatProperty] );
		}
	}
	
	function FleetHP(container, ShipBox, hp, rosterId){
		var hpPercent = hp[0] / hp[1];
		$(".ship-hp-text", ShipBox).text( hp[0] +" / "+ hp[1] );
		$(".ship-hp-val", ShipBox).css("width", (100*hpPercent)+"px");
		
		if( PlayerManager.repairShips.indexOf(rosterId) > -1){
			$(".ship-img", ShipBox).css("background", "#ACE");
			$(".ship-hp-val", ShipBox).css("background", "#ACE");
		}else if(hpPercent <= 0.25){
			$(".ship-img", ShipBox).css("background", "#FF0000");
			$(".ship-hp-val", ShipBox).css("background", "#FF0000");
			ShipBox.css("background", "#FCC");
			if( PlayerManager.repairShips.indexOf(rosterId) == -1 ){
				container.css("box-shadow", "inset 0px 0px 50px rgba(255,0,0,0.6)");
			}
		}else if(hpPercent <= 0.50){
			$(".ship-img", ShipBox).css("background", "#FF9900");
			$(".ship-hp-val", ShipBox).css("background", "#FF9900");
		}else if(hpPercent <= 0.75){
			$(".ship-img", ShipBox).css("background", "#FFFF00");
			$(".ship-hp-val", ShipBox).css("background", "#FFFF00");
		}else{
			$(".ship-img", ShipBox).css("background", "#00FF00");
			$(".ship-hp-val", ShipBox).css("background", "#00FF00");
		}
	}
	
	function FleetMorale(element, morale){
		element.text( morale );
		switch(true){
			case morale>53:
				element.css("border-color", "#00FF00");
				element.css("background", "#FFFF00");
				break;
			case morale>49:
				element.css("border-color", "#D2D200");
				element.css("background", "#FFFF99");
				break;
			case morale>39:
				element.css("border-color", "#CCCCCC");
				element.css("background", "#FFFFFF");
				break;
			case morale>29:
				element.css("border-color", "#FFB871");
				element.css("background", "#FFDDBB");
				break;
			case morale>19:
				element.css("border-color", "#FF9B06");
				element.css("background", "#FFB74A");
				break;
			default:
				element.css("border-color", "#FF5555");
				element.css("background", "#FFA6A6");
				break;
		}
	}
	
	function FleetEquipment(element, item, capacity){
		if(item.itemId > 0){
			var folder = "../../../../../assets/img/items/";
			$("img", element).attr("src", folder + item.master().api_type[3] + ".png");
		}else{
			$("img", element).hide();
		}
		if(capacity > 0){
			$(".ship-equip-capacity", element).text(capacity);
		}else{
		$(".ship-equip-capacity", element).text("");
		}
	}
	
})();
