(function(){
	"use strict";
	
	window.ThemeDefaultVertical = new KC3Dashboard({
		container: "#v",
		externalHtml: "vertical/vertical.html",
		variables: {
			selectedFleet: 1,
			isSunkable: false // damecon user overrides this
		},
		ready: function(){
			var self = this;
			
			// Set size of the panel
			$("#v").removeClass("panel-size-300px");
			$("#v").removeClass("panel-size-420px");
			var classToAdd = "panel-size-" + ((ConfigManager.pan_size === "small") ? "300px" : "420px"); 
			$("#v").addClass(classToAdd);
			$(".layout-button").removeClass("active");
			if (ConfigManager.pan_size === "small") {
				$(".layout-button.small-layout").addClass("active");
			} else {
				$(".layout-button.big-layout").addClass("active");
			}
			$(".layout-button").on("click", function(){
				console.log("Clicked");
				$(".layout-button").removeClass("active");
				$(this).addClass("active");
				if ($(this).hasClass("small-layout")){
					ConfigManager.pan_size = "small";
				} else {
					ConfigManager.pan_size = "big";
				}
				console.log(ConfigManager.pan_size);
				$("#v").removeClass("panel-size-300px");
				$("#v").removeClass("panel-size-420px");
				var classToAdd = "panel-size-" + ((ConfigManager.pan_size === "small") ? "300px" : "420px"); 
				$("#v").addClass(classToAdd);
				ConfigManager.save();
				self.trigger("Fleet");
			});
			
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
			
			// Change HQ EXP Information
			$(".exp_text, .battle_hqlevel_next",this.domElement).on("click",function(){
				ConfigManager.scrollHQExpInfo();
				KC3Network.trigger("HQ",{resetGain:false});
			}).addClass("hover");
			
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
			
			$(".screenshot-battle-button", this.domElement).on("click", function(){
				$(this).hide();
				
				// Tell service to pass a message to gamescreen on inspected window to get a screenshot
				(new RMsg("service", "screenshot", {
					tabId: chrome.devtools.inspectedWindow.tabId,
					playerName: PlayerManager.hq.name
				}, function(response){
					console.log(response);
					$(".screenshot-battle-button", self.domElement).show();
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
			
			// Switch fleet type button
			if (PlayerManager.combinedFleet) {
				$(".battle .switch_fleet_type_button", this.domElement).text("Combined");
				$(".battle .switch-ship-attribute-buttons", this.domElement).show();
			} else {
				$(".battle .screenshot-battle-button", this.domElement).text("Screenshot");
				$(".battle .switch_fleet_type_button", this.domElement).text("Single");
				$(".battle .switch-ship-attribute-buttons", this.domElement).hide();
			}
			$(".battle .switch_fleet_type_button", this.domElement).on("click", function(){
				if (PlayerManager.combinedFleet) {
					PlayerManager.combinedFleet = false;
					$(".battle .switch-ship-attribute-buttons", self.domElement).hide();
					$(this).text("Single");
				} else {
					PlayerManager.combinedFleet = true;
					$(".battle .switch-ship-attribute-buttons", self.domElement).show();
					$(this).text("Combined");
				}
				self.trigger("Fleet");
			});
			
			// Switch ship attribute button
			$(".battle-mship .ship-morale", this.domElement).hide();
			$(".battle-mship .ship-equip", this.domElement).hide();
			$(".battle-mship .ship-supply", this.domElement).hide();
			$(".battle-eship .ship-morale", this.domElement).hide();
			$(".battle-eship .ship-equip", this.domElement).hide();
			$(".battle-eship .ship-supply", this.domElement).hide();
			$(".battle .switch-ship-attribute-button ", this.domElement).on("click", function(){
				console.log("switch button clicked!");
				
				$(".battle .switch-ship-attribute-button ", self.domElement).removeClass("active");
				$(this).addClass("active");
				
				$(".battle-mship .ship-level", self.domElement).hide();
				$(".battle-mship .ship-morale", self.domElement).hide();
				$(".battle-mship .ship-equip", self.domElement).hide();
				$(".battle-mship .ship-supply", self.domElement).hide();
				$(".battle-eship .ship-level", self.domElement).hide();
				$(".battle-eship .ship-morale", self.domElement).hide();
				$(".battle-eship .ship-equip", self.domElement).hide();
				$(".battle-eship .ship-supply", self.domElement).hide();
				
				if ($(this).hasClass("switch-exp-button")) {
					$(".battle-mship .ship-level", self.domElement).show();
					$(".battle-eship .ship-level", self.domElement).show();
				}
				if ($(this).hasClass("switch-morale-button")) {
					$(".battle-mship .ship-morale", self.domElement).show();
					$(".battle-eship .ship-morale", self.domElement).show();
				}
				if ($(this).hasClass("switch-equip-button")) {
					$(".battle-mship .ship-equip", self.domElement).show();
					$(".battle-eship .ship-equip", self.domElement).show();
				}
				if ($(this).hasClass("switch-supply-button")) {
					$(".battle-mship .ship-supply", self.domElement).show();
					$(".battle-eship .ship-supply", self.domElement).show();
				}
				
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
			
			$(".activityBox.craftGear").on("click", function(){
				$(this).hide();
			});
			
			// HQ name censor
			$(".battle_admiral").on("click", function(){
				$(".battle .name_censor").show();
			});
			
			$(".battle .name_censor").on("click", function(){
				$(this).hide();
			});
			
			$(".admiral_name").on("click", function(){
				$(".normal .name_censor").show();
			});
			
			$(".normal .name_censor").on("click", function(){
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
				$(".battle_hqlevel_next_gain", container).text( "" );
			},
			HQ: function(container, data, local){
				var
					maxHQ=Object.keys(KC3Meta._exp).map(function(a){return parseInt(a);}).reduce(function(a,b){return a>b?a:b;}),
					hqt = KC3Meta.term("HQExpAbbrev" + (PlayerManager.hq.level>=maxHQ ? 3 : ConfigManager.hqExpDetail)) + " ",
					hqexpd = Math.abs($(".battle_hqlevel_next_gain", container).text());
				switch(KC3Panel.mode){
					case "normal":
						$(".admiral_name", container).text( PlayerManager.hq.name );
						$(".admiral_comm", container).text( PlayerManager.hq.desc );
						$(".admiral_rank", container).text( PlayerManager.hq.rank );
						$(".level_value", container).text( PlayerManager.hq.level );
						$(".exp_bar", container).css({width: Math.round(PlayerManager.hq.exp[0]*88)+"px"});
						$(".exp_text", container).text( hqt + PlayerManager.hq.exp[ConfigManager.hqExpDetail] );
					break;
					case "battle":
						$(".battle_admiral", container).text( PlayerManager.hq.name );
						$(".battle_hqlevel_text", container).text( PlayerManager.hq.level );
						$(".battle_hqexpval", container).css({width: Math.round(PlayerManager.hq.exp[0]*60)+"px"});
						if((data || {resetGain:true}).resetGain)
							$(".battle_hqexpgain", container).css({width: Math.round(PlayerManager.hq.exp[0]*60)+"px"});
						$(".battle_hqlevel_next", container)
							.text( PlayerManager.hq.exp[ConfigManager.hqExpDetail] )
							.attr("title",hqt);
						if(hqexpd.length>0)
							$(".battle_hqlevel_next_gain", container).text(hqexpd);
					break;
				}
			},
			Consumables: function(container, data, local){
				$(".count_fcoin", container).text( PlayerManager.consumables.fcoin );
				$(".count_buckets", container).text( PlayerManager.consumables.buckets );
				$(".count_screws", container).text( PlayerManager.consumables.screws );
				$(".count_torch", container).text( PlayerManager.consumables.torch );
			},
			ShipSlots: function(container, data, local){
				$(".count_ships", container).text( KC3ShipManager.count() ).each(function(){
					if((KC3ShipManager.max - KC3ShipManager.count()) <= 5){
						$(this).addClass("material_limit");
					}else{
						$(this).removeClass("material_limit");
					}
				});
				$(".max_ships", container).text( KC3ShipManager.max );
			},
			GearSlots: function(container, data, local){
				$(".count_gear", container).text( KC3GearManager.count() ).each(function(){
					if((KC3GearManager.max - KC3GearManager.count()) <= 20){
						$(this).addClass("material_limit");
					}else{
						$(this).removeClass("material_limit");
					}
				});
				$(".max_gear", container).text( KC3GearManager.max );
			},
			Timers: function(container, data, local){
				// Expedition numbers
				KC3TimerManager._exped[0].expnum();
				KC3TimerManager._exped[1].expnum();
				KC3TimerManager._exped[2].expnum();
				
				// Expedition faces
				KC3TimerManager._exped[0].face();
				KC3TimerManager._exped[1].face();
				KC3TimerManager._exped[2].face();
				
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
							$(".box-quests .quest-box-"+(index+1)+" .name", container).text( quest.meta().name );
							$(".box-quests .quest-box-"+(index+1)+" .name", container).attr("title", quest.meta().desc );
						}else{
							$(".box-quests .quest-box-"+(index+1)+" .name", container).text("?");
						}
						$(".box-quests .quest-box-"+(index+1)+" .status", container).text( quest.outputShort() );
						$(".box-quests .quest-box-"+(index+1)+" .status", container).attr("title", quest.outputShort(true) );
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
							$(".battle_quests .quest-box-"+(index+1)+" .name", container).text( quest.meta().name );
							$(".battle_quests .quest-box-"+(index+1)+" .name", container).attr("title", quest.meta().desc );
						}else{
							$(".battle_quests .quest-box-"+(index+1)+" .name", container).text("?");
						}
						$(".battle_quests .quest-box-"+(index+1)+" .status", container).text( quest.outputShort() );
						$(".battle_quests .quest-box-"+(index+1)+" .status", container).attr("title", quest.outputShort(true) );
						$(".battle_quests .quest-box-"+(index+1), container).show();
					});
				}
			},
			Fleet: function(container, data, local){
				var CurrentFleet, FleetContainer;
				if(KC3Panel.mode=="normal"){
					CurrentFleet = PlayerManager.fleets[local.selectedFleet-1];
					
					// Fleet Summary Stats
					$(".normal .summary-level .summary-text", container).text( CurrentFleet.totalLevel() );
					$(".normal .summary-eqlos .summary-text", container).text( Math.round( CurrentFleet.eLoS() * 100) / 100 );
					$(".normal .summary-airfp .summary-text", container).text( CurrentFleet.fighterPower() );
					$(".normal .summary-speed .summary-text", container).text( CurrentFleet.speed() );
					container.css("box-shadow", "none");
					
					// Fleet Ships
					FleetContainer = $(".fleet-ships", container);
					FleetContainer.html("");
					$.each(CurrentFleet.ships, function(index, rosterId){
						if(rosterId > -1){
							var CurrentShip = KC3ShipManager.get( rosterId );
							if(CurrentShip.masterId === 0){ return true; }
							var ShipBox = $(".factory .fleet-ship", container).clone().appendTo(FleetContainer);
							
							$(".ship-img img", ShipBox).attr("src", KC3Meta.shipIcon(CurrentShip.masterId, "../../../../assets/img/ui/empty.png"));
							$(".ship-name", ShipBox).text( CurrentShip.name() );
							$(".ship-type", ShipBox).text( CurrentShip.stype() );
							$(".ship-lvl-txt", ShipBox).text(CurrentShip.level);
							$(".ship-lvl-next", ShipBox).text("-"+CurrentShip.exp[1]);
							$(".ship-lvl-val", ShipBox).css("width", (60*(CurrentShip.exp[2]/100))+"px");
							
							FleetHP(container, ShipBox, CurrentShip.hp, null, rosterId );
							FleetMorale( $(".ship-morale-box", ShipBox), CurrentShip.morale );
							
							for(var i = 1; i <= 4; i++) {
								var gearBox = $(".ship-gear-" + i, ShipBox);
								if (i <= CurrentShip.slotnum) {
									FleetEquipment( gearBox, CurrentShip.equipment(i-1), CurrentShip.slots[i-1] );
									if (CurrentShip.equipment(i-1).itemId > 0) {
										$(".ship-equip-capacity", gearBox).hide();
									}
								} else {
									FleetEquipment( gearBox, null, null );
								}
							}
							/*FleetEquipment( $(".ship-gear-1", ShipBox), CurrentShip.equipment(0), CurrentShip.slots[0] );
							FleetEquipment( $(".ship-gear-2", ShipBox), CurrentShip.equipment(1), CurrentShip.slots[1] );
							FleetEquipment( $(".ship-gear-3", ShipBox), CurrentShip.equipment(2), CurrentShip.slots[2] );
							FleetEquipment( $(".ship-gear-4", ShipBox), CurrentShip.equipment(3), CurrentShip.slots[3] );
							*/
							var FuelPercent = CurrentShip.fuel / CurrentShip.master().api_fuel_max;
							var AmmoPercent = CurrentShip.ammo / CurrentShip.master().api_bull_max;
							$(".supply-fuel .supply-text", ShipBox).text(Math.floor(FuelPercent*100)+"%");
							$(".supply-ammo .supply-text", ShipBox).text(Math.floor(AmmoPercent*100)+"%");
							
							var SupplyBarMaxWidth = $(".supply-fuel", ShipBox).css("width");
							SupplyBarMaxWidth = Number(SupplyBarMaxWidth.substring(0, SupplyBarMaxWidth.length-2));
							$(".supply-fuel .supply-bar", ShipBox).css("width", (SupplyBarMaxWidth*Math.min(FuelPercent,1))+"px");
							$(".supply-ammo .supply-bar", ShipBox).css("width", (SupplyBarMaxWidth*Math.min(AmmoPercent,1))+"px");
						}
					});
					
					// Expedition Helper
					try {
						var expeditionAnalyzeResult = ExpeditionHelper.analyzeFleet( CurrentFleet );
						console.log(expeditionAnalyzeResult);
						
						if(expeditionAnalyzeResult){
							$(".activityBox.expedHelp .expedNotes", container).html("");
							$.each(expeditionAnalyzeResult.w, function(index, fleetNote){
								$(".activityBox.expedHelp .expedNotes", container).append(
									$("<div/>").addClass("expedNote").html(fleetNote)
								);
							});
							$(".activityBox.expedHelp .expedNotes", container).append($("<div/>").addClass("clear"));
							
							$(".activityBox.expedHelp .expedIdList", container).html("");
							$.each(expeditionAnalyzeResult.e, function(index, expedId){
								$(".activityBox.expedHelp .expedIdList", container).append(
									$("<div/>").addClass("expedId").html(expedId)
								);
							});
							$(".activityBox.expedHelp .expedIdList", container).append($("<div/>").addClass("clear"));
							
							$(".activityBox", container).hide();
							$(".activityBox.expedHelp", container).fadeIn();
						}else{
							$(".activityBox.expedHelp", container).text( "no result" );
						}
					}catch(e){}
					
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
						
						//var CurrentFleet = PlayerManager.fleets[ KC3SortieManager.fleetSent-1 ];
						
						// Load Main Fleet
						// Fleet Summary Stats
						$(".battle_mainfleet .battle-level .summary-text", container).text( MainFleet.totalLevel() );
						$(".battle_mainfleet .battle-eqlos .summary-text", container).text( Math.round( MainFleet.eLoS() * 100) / 100 );
						$(".battle_mainfleet .battle-airfp .summary-text", container).text( MainFleet.fighterPower() );
						$(".battle_mainfleet .battle-speed .summary-text", container).text( MainFleet.speed() );
						container.css("box-shadow", "none");
						
						// Fleet Ships
						FleetContainer = $(".battle_mainfleet .battle_fleet_list", container);
						FleetContainer.html("");
						$.each(MainFleet.ships, function(index, rosterId){
							if(rosterId > -1){
								var CurrentShip = KC3ShipManager.get( rosterId );
								var ShipBox = $(".factory .battle-mship", container).clone().appendTo(FleetContainer);
								
								$(".ship-img img", ShipBox).attr("src", KC3Meta.shipIcon(CurrentShip.masterId));
								$(".ship-name", ShipBox).text( CurrentShip.name() );
								$(".ship-type", ShipBox).text( CurrentShip.stype() );
								$(".ship-lvl-txt", ShipBox).text(CurrentShip.level);
								$(".ship-lvl-next", ShipBox).text("-"+CurrentShip.exp[1]);
								$(".ship-lvl-val", ShipBox).css("width", (60*(CurrentShip.exp[2]/100))+"px");
								
								FleetHP(container, ShipBox, CurrentShip.hp, CurrentShip.afterHp, rosterId );
								FleetMorale( $(".ship-morale-box", ShipBox), CurrentShip.morale );
								
								for(var i = 1; i <= 4; i++) {
									var gearBox = $(".ship-gear-" + i, ShipBox);
									if (i <= CurrentShip.slotnum) {
										FleetEquipment( gearBox, CurrentShip.equipment(i-1), CurrentShip.slots[i-1] );
									} else {
										FleetEquipment( gearBox, null, null );
									}
								}
								/*FleetEquipment( $(".ship-gear-1", ShipBox), CurrentShip.equipment(0), CurrentShip.slots[0] );
								FleetEquipment( $(".ship-gear-2", ShipBox), CurrentShip.equipment(1), CurrentShip.slots[1] );
								FleetEquipment( $(".ship-gear-3", ShipBox), CurrentShip.equipment(2), CurrentShip.slots[2] );
								FleetEquipment( $(".ship-gear-4", ShipBox), CurrentShip.equipment(3), CurrentShip.slots[3] );
								*/
								var FuelPercent = CurrentShip.fuel / CurrentShip.master().api_fuel_max;
								var AmmoPercent = CurrentShip.ammo / CurrentShip.master().api_bull_max;
								$(".supply-fuel .supply-text", ShipBox).text(Math.floor(FuelPercent*100)+"%");
								$(".supply-ammo .supply-text", ShipBox).text(Math.floor(AmmoPercent*100)+"%");
								
								var SupplyBarMaxWidth = $(".supply-fuel", ShipBox).css("width");
								SupplyBarMaxWidth = Number(SupplyBarMaxWidth.substring(0, SupplyBarMaxWidth.length-2));
								$(".supply-fuel .supply-bar", ShipBox).css("width", (SupplyBarMaxWidth*FuelPercent)+"px");
								$(".supply-ammo .supply-bar", ShipBox).css("width", (SupplyBarMaxWidth*AmmoPercent)+"px");
							}
						});
						
						// Load Escort Fleet
						// Fleet Summary Stats
						$(".battle_escorts .battle-level .summary-text", container).text( EscortFleet.totalLevel() );
						$(".battle_escorts .battle-eqlos .summary-text", container).text( Math.round( EscortFleet.eLoS() * 100) / 100 );
						$(".battle_escorts .battle-airfp .summary-text", container).text( EscortFleet.fighterPower() );
						$(".battle_escorts .battle-speed .summary-text", container).text( EscortFleet.speed() );
						container.css("box-shadow", "none");
						
						// Fleet Ships
						FleetContainer = $(".battle_escorts .battle_fleet_list", container);
						FleetContainer.html("");
						$.each(EscortFleet.ships, function(index, rosterId){
							if(rosterId > -1){
								var CurrentShip = KC3ShipManager.get( rosterId );
								var ShipBox = $(".factory .battle-eship", container).clone().appendTo(FleetContainer);
								
								$(".ship-img img", ShipBox).attr("src", KC3Meta.shipIcon(CurrentShip.masterId));
								$(".ship-name", ShipBox).text( CurrentShip.name() );
								$(".ship-type", ShipBox).text( CurrentShip.stype() );
								$(".ship-lvl-txt", ShipBox).text(CurrentShip.level);
								$(".ship-lvl-next", ShipBox).text("-"+CurrentShip.exp[1]);
								$(".ship-lvl-val", ShipBox).css("width", (60*(CurrentShip.exp[2]/100))+"px");
								
								FleetHP(container, ShipBox, CurrentShip.hp, CurrentShip.afterHp, rosterId );
								FleetMorale( $(".ship-morale-box", ShipBox), CurrentShip.morale );
								for(var i = 1; i <= 4; i++) {
									var gearBox = $(".ship-gear-" + i, ShipBox);
									if (i <= CurrentShip.slotnum) {
										FleetEquipment( gearBox, CurrentShip.equipment(i-1), CurrentShip.slots[i-1] );
									} else {
										FleetEquipment( gearBox, null, null );
									}
								}
								/*FleetEquipment( $(".ship-gear-1", ShipBox), CurrentShip.equipment(0), CurrentShip.slots[0] );
								FleetEquipment( $(".ship-gear-2", ShipBox), CurrentShip.equipment(1), CurrentShip.slots[1] );
								FleetEquipment( $(".ship-gear-3", ShipBox), CurrentShip.equipment(2), CurrentShip.slots[2] );
								FleetEquipment( $(".ship-gear-4", ShipBox), CurrentShip.equipment(3), CurrentShip.slots[3] );
								*/
								var FuelPercent = CurrentShip.fuel / CurrentShip.master().api_fuel_max;
								var AmmoPercent = CurrentShip.ammo / CurrentShip.master().api_bull_max;
								$(".supply-fuel .supply-text", ShipBox).text(Math.floor(FuelPercent*100)+"%");
								$(".supply-ammo .supply-text", ShipBox).text(Math.floor(AmmoPercent*100)+"%");
								
								var SupplyBarMaxWidth = $(".supply-fuel", ShipBox).css("width");
								SupplyBarMaxWidth = Number(SupplyBarMaxWidth.substring(0, SupplyBarMaxWidth.length-2));
								$(".supply-fuel .supply-bar", ShipBox).css("width", (SupplyBarMaxWidth*FuelPercent)+"px");
								$(".supply-ammo .supply-bar", ShipBox).css("width", (SupplyBarMaxWidth*AmmoPercent)+"px");
							}
						});
						
						$(".battle .battle_singlefleet", container).hide();
						$(".battle .battle_mainfleet", container).show();
						$(".battle .battle_escorts", container).show();
						
					// Single-Fleet Sortie
					}else{
						CurrentFleet = PlayerManager.fleets[ KC3SortieManager.fleetSent-1 ];
						
						// Fleet Summary Stats
						$(".battle_singlefleet .battle-level .summary-text", container).text( CurrentFleet.totalLevel() );
						$(".battle_singlefleet .battle-eqlos .summary-text", container).text( Math.round( CurrentFleet.eLoS() * 100) / 100 );
						$(".battle_singlefleet .battle-airfp .summary-text", container).text( CurrentFleet.fighterPower() );
						$(".battle_singlefleet .battle-speed .summary-text", container).text( CurrentFleet.speed() );
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
								
								FleetHP(container, ShipBox, CurrentShip.hp, CurrentShip.afterHp, rosterId );
								FleetMorale( $(".ship-morale-box", ShipBox), CurrentShip.morale );
								
								for(var i = 1; i <= 4; i++) {
									var gearBox = $(".ship-gear-" + i, ShipBox);
									if (i <= CurrentShip.slotnum) {
										FleetEquipment( gearBox, CurrentShip.equipment(i-1), CurrentShip.slots[i-1] );
									} else {
										FleetEquipment( gearBox, null, null );
									}
								}
								/*FleetEquipment( $(".ship-gear-1", ShipBox), CurrentShip.equipment(0), CurrentShip.slots[0] );
								FleetEquipment( $(".ship-gear-2", ShipBox), CurrentShip.equipment(1), CurrentShip.slots[1] );
								FleetEquipment( $(".ship-gear-3", ShipBox), CurrentShip.equipment(2), CurrentShip.slots[2] );
								FleetEquipment( $(".ship-gear-4", ShipBox), CurrentShip.equipment(3), CurrentShip.slots[3] );
								*/
								var FuelPercent = CurrentShip.fuel / CurrentShip.master().api_fuel_max;
								var AmmoPercent = CurrentShip.ammo / CurrentShip.master().api_bull_max;
								$(".supply-fuel .supply-text", ShipBox).text(Math.floor(FuelPercent*100)+"%");
								$(".supply-ammo .supply-text", ShipBox).text(Math.floor(AmmoPercent*100)+"%");
								
								var SupplyBarMaxWidth = $(".supply-fuel", ShipBox).css("width");
								SupplyBarMaxWidth = Number(SupplyBarMaxWidth.substring(0, SupplyBarMaxWidth.length-2));
								$(".supply-fuel .supply-bar", ShipBox).css("width", (SupplyBarMaxWidth*FuelPercent)+"px");
								$(".supply-ammo .supply-bar", ShipBox).css("width", (SupplyBarMaxWidth*AmmoPercent)+"px");
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
				KC3Panel.layout().data.isSunkable = true;
				
				// Show world details
				$(".battle .battle_world", container).text("World "+KC3SortieManager.map_world+" - "+KC3SortieManager.map_num+(function(d){
					switch(d) {
						case 1: case 2: case 3:
							return " " + ["Easy","Normal","Hard"][d-1];
						default: // 0 -- no difficulty (print nothing)
							return "";
					}
				})(KC3SortieManager.map_difficulty));
				
				// Show boss node
				KC3SortieManager.onBossAvailable = function(){
					$.each(KC3SortieManager.boss.ships, function(index, eshipId){
						if(eshipId > -1){
							$(".battle .battle_boss .abyss_"+(index+1)+" img", container).attr("src", KC3Meta.abyssIcon(eshipId));
						}else{
							$(".battle .battle_boss .abyss_"+(index+1), container).hide();
						}
					});
					if(ConfigManager.info_boss)
						$(".battle .battle_boss", container).show();
					else
						$(".battle .battle_boss", container).hide();
				};
				
				// Trigger other listeners
				this.HQ(container, {resetGain:true}, local);
				this.ShipSlots(container, {}, local);
				this.GearSlots(container, {}, local);
				this.Fleet(container, {}, local);
				this.Quests(container, {}, local);
				
				// Clear battle node
				$(".battle .battle_node", container)
					.removeClass("battle_color")
					.removeClass("resource_color")
					.removeClass("battle_avoided_color")
					.removeClass("maelstrom_color")
					.removeClass("now")
					.text("");
				$(".battle .battle_drop", container).show();
				
				// Change interface mode
				$(".normal", container).hide();
				$(".battle", container).show();
			},
			CompassResult: function(container, data, local){
				var thisNode = KC3SortieManager.currentNode();
				var numNodes = KC3SortieManager.nodes.length;
				var world = KC3SortieManager.map_world;
				var map = KC3SortieManager.map_num;
				var nodeId = KC3Meta.nodeLetter(world, map, thisNode.id );
				
				$(".battle .battle_node.now", container).removeClass("now");
				//$(".battle .battle_node_"+numNodes, container).addClass( "active" );
				$(".battle .battle_node_"+numNodes, container).addClass( "now" );
				$(".battle .battle_node_"+numNodes, container).text( nodeId );
				
				$(".battle .battle_nodenum", container)
					.removeClass("battle_color")
					.removeClass("resource_color")
					.removeClass("battle_avoided_color")
					.removeClass("maelstrom_color")
					.text( nodeId );
				
				$(".battle .battle_current", container).text("NEXT NODE");
				
				switch(thisNode.type){
					// Battle node
					case "battle":
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_node_"+numNodes, container).addClass( "battle_color" );
						$(".battle .battle_nodenum", container).addClass( "battle_color" );
						break;
					
					// Resource node
					case "resource":
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_node_"+numNodes, container).addClass( "resource_color" );
						$(".battle .battle_nodenum", container).addClass( "resource_color" );
						$(".battle .battle_resource .battle_resicon img", container).attr("src", thisNode.icon("../../../../assets/img/client/"));
						$(".battle .battle_resource .battle_resamt", container).text( thisNode.amount );
						$(".battle .battle_resource", container).fadeIn(500);
						break;
						
					// Bounty node on 1-6
					case "bounty":
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_node_"+numNodes, container).addClass( "resource_color" );
						$(".battle .battle_nodenum", container).addClass( "resource_color" );
						$(".battle .battle_resource .battle_resicon img", container).attr("src", thisNode.icon("../../../../assets/img/client/"));
						$(".battle .battle_resource .battle_resamt", container).text( thisNode.amount );
						$(".battle .battle_resource", container).fadeIn(500);
						break;
					
					// Maelstrom node
					case "maelstrom":
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_node_"+numNodes, container).addClass( "maelstrom_color" );
						$(".battle .battle_nodenum", container).addClass( "maelstrom_color" );
						$(".battle .battle_maelstrom .battle_resicon img", container).attr("src", thisNode.icon("../../../../assets/img/client/"));
						$(".battle .battle_maelstrom .battle_resamt", container).text( -thisNode.amount );
						$(".battle .battle_maelstrom", container).fadeIn(500);
						break;
						
					// Battle avoided node
					default:
						$(".battle .battle_nodebox", container).hide();
						$(".battle .battle_node_"+numNodes, container).addClass( "battle_avoided_color" );
						$(".battle .battle_nodenum", container).addClass( "battle_avoided_color" );
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
				
				var thisNode = KC3SortieManager.currentNode();
				var battleData = (thisNode.startsFromNight)? thisNode.battleNight : thisNode.battleDay;
				
				var enemies = thisNode.eships.filter(function(x){return x>=0;});
				if(ConfigManager.info_troll) {
					if(enemies.every(function(x){return KC3Master.ship(x).api_stype==13 && KC3Master.ship(x).api_yomi.length>1;})) {
						$(".battle .battle_current",container).text(
							(thisNode.eformation < 3) ? ((enemies.length == 1) ? "MORNING SNIPER!!!!!" : "TROLL NODE") : "SUB NODE"
						);
					}
				}
				
				if((typeof thisNode.eformation != "undefined") && (thisNode.eformation > -1)){
					$(".battle .battle_formation img", container).attr("src", KC3Meta.formationIcon(thisNode.eformation));
					$(".battle .battle_formation", container).attr("title", KC3Meta.formationText(thisNode.eformation));
					$(".battle .battle_formation", container).show();
				} else {
					$(".battle .battle_formation", container).hide();
				}
				
				// Load enemy icons
				$(".battle .battle_enemies .battle_abyss .face-container img", container).attr("src", KC3Meta.abyssIcon(-1));
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						var eParam = thisNode.eParam[index];
						$(".battle .battle_enemies .abyss_"+(index+1)+" .face-container img", container).attr("src", KC3Meta.abyssIcon(eshipId));
						var tooltip = "FP: " + eParam[0] + String.fromCharCode(13);
						tooltip += "Torp: " + eParam[1] + String.fromCharCode(13);
						tooltip += "AA: " + eParam[2] + String.fromCharCode(13);
						tooltip += "Armor: " + eParam[3];
						$(".battle .battle_enemies .abyss_"+(index+1)+" .face-container img", container).attr("title", tooltip);
						$(".battle .battle_enemies .abyss_"+(index+1), container).show();

						if ((thisNode.enemySunk[index]) && (ConfigManager.info_battle)) {
							$(".battle .battle_enemies .abyss_"+(index+1)+" .sunk-container", container).show();
						} else {
							$(".battle .battle_enemies .abyss_"+(index+1)+" .sunk-container", container).hide();
						}
					}else{
						$(".battle .battle_enemies .abyss_"+(index+1), container).hide();
					}
				});

				// Load after-battle HP
				this.Fleet(container, {}, local);

				// Battle conditions
				$(".battle .battle_cond_text", container).removeClass( "good" );
				$(".battle .battle_cond_text", container).removeClass( "bad" );
				$(".battle .battle_cond_engage .battle_cond_text", container).text( thisNode.engagement[2] );
				$(".battle .battle_cond_engage .battle_cond_text", container).addClass( thisNode.engagement[1] );
				$(".battle .battle_cond_contact .battle_cond_text", container).text(thisNode.fcontact +" vs "+thisNode.econtact);
				
				$(".battle .battle_support",container).show();
				// Day battle-only environment
				if(!thisNode.startsFromNight){
					$(".battle .battle_current", container).text("DAY BATTLE");

					// If support expedition is triggered on this battle
					if(thisNode.supportFlag || thisNode.nightSupportFlag){
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
				
					$(".battle .battle_cond_detect .battle_cond_text", container).text( thisNode.detection[0] );
					$(".battle .battle_cond_detect .battle_cond_text", container).addClass( thisNode.detection[1] );
					
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
					if(thisNode.planeFighters.player[1] > 0){
						$(".battle .battle_airfighter .battle_airally .battle_airafter", container).text("-"+thisNode.planeFighters.player[1]);
					}
					if(thisNode.planeFighters.abyssal[1] > 0){
						$(".battle .battle_airfighter .battle_airabyss .battle_airafter", container).text("-"+thisNode.planeFighters.abyssal[1]);
					}
					if(thisNode.planeBombers.player[1] > 0){
						$(".battle .battle_airbomber .battle_airally .battle_airafter", container).text("-"+thisNode.planeBombers.player[1]);
					}
					if(thisNode.planeBombers.abyssal[1] > 0){
						$(".battle .battle_airbomber .battle_airabyss .battle_airafter", container).text("-"+thisNode.planeBombers.abyssal[1]);
					}
				}else{
					// Started on night battle
					$(".battle .battle_current", container).text("NIGHT BATTLE");
					
					if(thisNode.nightSupportFlag){
						$(".battle .battle_support img", container).attr("src", "../../../../assets/img/ui/support.png");
					}else{
						$(".battle .battle_support img", container).attr("src", "../../../../assets/img/ui/support-x.png");
					}
					$(".battle .battle_yasen img", container).attr("src", "../../../../assets/img/ui/yasen.png");
				}
				
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
				
				var desperateText = [
					"NIGHT BATTLE",
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
					"I bless this run",
					"drops but no slot"
				];
				if(ConfigManager.info_troll){
					$(".battle .battle_current", container).text(
						desperateText[Math.floor(Math.random()*desperateText.length)]
					);
				}else{
					$(".battle .battle_current", container).text("NIGHT BATTLE");
				}
				
				var thisNode = KC3SortieManager.currentNode();

				// Load after-battle HP
				KC3Network.trigger("Fleet");

				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						if ((thisNode.enemySunk[index]) && (ConfigManager.info_battle)) {
							$(".battle .battle_enemies .abyss_"+(index+1)+" .sunk-container", container).show();
						} else {
							$(".battle .battle_enemies .abyss_"+(index+1)+" .sunk-container", container).hide();
						}
					} else {
						$(".battle .battle_enemies .abyss_"+(index+1)+" .sunk-container", container).hide();
					}
				});
			},
			BattleResult: function(container, data, local){
				if(KC3SortieManager.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
				$(".battle .battle_current", container).text("RESULTS");
				var thisNode = KC3SortieManager.currentNode();

				if(ConfigManager.info_delta) {
					// If EXP left exceeded by gained EXP on sortie
					var maxHQ=Object.keys(KC3Meta._exp).map(function(a){return parseInt(a);}).reduce(function(a,b){return a>b?a:b;});
					while(KC3SortieManager.hqExpGained >= PlayerManager.hq.exp[1] && PlayerManager.hq.level < maxHQ) {
						KC3SortieManager.hqExpGained -= PlayerManager.hq.exp[1];
						PlayerManager.hq.exp = [0,KC3Meta.exp(++PlayerManager.hq.level)[0],0];
						this.HQ(container, {}, local);
					}
					$(".battle_hqexpgain", container).css({width: Math.round((function(){
						return (PlayerManager.hq.exp[2] + Math.min(PlayerManager.hq.exp[1],KC3SortieManager.hqExpGained)) / KC3Meta.exp(PlayerManager.hq.level)[0];
					})()*60)+"px"});
				}
				$(".battle_hqlevel_next_gain", container).text(KC3SortieManager.hqExpGained);
				
				$(".battle .battle_rating img").attr("src", "../../../../assets/img/client/ratings/"+thisNode.rating+".png");
				
				if(thisNode.drop > 0){
					if(ConfigManager.info_drop){
						$(".battle .battle_drop img").attr("src", KC3Meta.shipIcon(thisNode.drop));
					}
					
					//let the other implements this :P
					this.ShipSlots(container, {}, local);
					this.GearSlots(container, {}, local);
				}else{
					$(".battle .battle_drop img").attr("src", "../../../../assets/img/ui/shipdrop-x.png");
				}
			},
			CraftGear: function(container, data, local){
				// Recall equipment count
				this.GearSlots(container, {}, local);
				
				if(!ConfigManager.info_craft){ return true; }
				
				// Hide any other activity box
				$(".activityBox", container).hide();
				
				var icon = "../../../../assets/img/client/penguin.png";
				if (data.itemId !== null) {
					// Get equipment data
					var PlayerItem = KC3GearManager.get( data.itemId );
					var MasterItem = KC3Master.slotitem( data.itemMasterId );
					
					// Show basic info of the item
					icon = "../../../../assets/img/items/"+MasterItem.api_type[3]+".png";
					$(".craftGear .equipIcon img", container).attr("src", icon);
					$(".craftGear .equipName", container).text( PlayerItem.name() );
					
					// Show extra item info
					var countExisting = KC3GearManager.countByMasterId( data.itemMasterId );
					if(countExisting == 1){
						$(".craftGear .equipNote", container).html("This is your <strong>first</strong>!");
					}else{
						$(".craftGear .equipNote", container).html("You now have <strong>"+countExisting+"</strong> of this item!");
					}
					
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
				} else {
					$(".craftGear .equipIcon img", container).attr("src", icon);
					$(".craftGear .equipName", container).text( "Equipment crafting failed" );
					$(".craftGear .equipNote",container).html("");
					$(".equipStats", container).html("");
				}
				
				// Show resource used
				$(".craftGear .used1").text( data.resourceUsed[0] );
				$(".craftGear .used2").text( data.resourceUsed[1] );
				$(".craftGear .used3").text( data.resourceUsed[2] );
				$(".craftGear .used4").text( data.resourceUsed[3] );

				// Show the box
				$(".craftGear", container).fadeIn(500);
			},
			CraftShip: function(container, data, local){
				
			},
			ClearedMap: function(container, data, local){
				KC3Panel.layout().data.isSunkable = false;
				
			},
			PvPStart: function(container, data, local){
				KC3Panel.mode = "battle";
				KC3Panel.layout().data.isSunkable = false;
				
				// Process PvP Battle
				KC3SortieManager.endSortie();

				$(".battle .battle_world", container).text("PvP Practice Battle");
				$(".battle .battle_current", container).text("FIGHTING");
				KC3SortieManager.fleetSent = data.fleetSent;
				
				// Trigger other listeners
				this.HQ(container, {resetGain:true}, local);
				this.ShipSlots(container, {}, local);
				this.GearSlots(container, {}, local);
				this.Fleet(container, {}, local);
				this.Quests(container, {}, local);
				
				// Clear battle node
				$(".battle .battle_node", container).removeClass("battle_color");
				$(".battle .battle_node", container).removeClass("resource_color");
				$(".battle .battle_node", container).removeClass("battle_avoided_color");
				$(".battle .battle_node", container).removeClass("maelstrom_color");
				$(".battle .battle_node", container).removeClass("now");
				$(".battle .battle_node", container).text("");
				$(".battle .battle_nodenum", container).text("");
				
				// Hide useless information
				$(".battle .battle_boss", container).hide();
				$(".battle .battle_support",container).hide();
				$(".battle .battle_drop", container).hide();
				
				// Change interface mode
				$(".normal", container).hide();
				$(".battle", container).show();
				
				var thisPvP;
				KC3SortieManager.nodes.push(thisPvP = (new KC3Node()).defineAsBattle());
				thisPvP.engage( data.battle, data.fleetSent );
				
				// Formation
				if((typeof thisPvP.eformation != "undefined") && (thisPvP.eformation > -1)){
					$(".battle .battle_formation img", container).attr("src", KC3Meta.formationIcon(thisPvP.eformation));
					$(".battle .battle_formation", container).attr("title", KC3Meta.formationText(thisPvP.eformation));
					$(".battle .battle_formation", container).show();
				} else {
					$(".battle .battle_formation", container).hide();
				}
				
				// Show opponent ships faces
				$.each(thisPvP.eships, function(index, eshipId){
					if(eshipId > -1){
						var eParam = thisPvP.eParam[index];
						$(".battle .battle_enemies .abyss_"+(index+1)+" .face-container img", container).attr("src", KC3Meta.shipIcon(eshipId));
						var tooltip = "FP: " + eParam[0] + String.fromCharCode(13);
						tooltip += "Torp: " + eParam[1] + String.fromCharCode(13);
						tooltip += "AA: " + eParam[2] + String.fromCharCode(13);
						tooltip += "Armor: " + eParam[3];
						$(".battle .battle_enemies .abyss_"+(index+1)+" .face-container img", container).attr("tooltip", tooltip);
						$(".battle .battle_enemies .abyss_"+(index+1), container).show();

						if ((thisPvP.enemySunk[index]) && (ConfigManager.info_battle)) {
							$(".battle .battle_enemies .abyss_"+(index+1)+" .sunk-container", container).show();
						} else {
							$(".battle .battle_enemies .abyss_"+(index+1)+" .sunk-container", container).hide();
						}
					}else{
						$(".battle .battle_enemies .abyss_"+(index+1), container).hide();
					}
				});
				
				// Load after-battle HP
				this.Fleet(container, {}, local);
				
				// If night battle will be asked after this battle
				if(thisPvP.yasenFlag){
					$(".battle .battle_yasen img", container).attr("src", "../../../../assets/img/ui/yasen.png");
				}else{
					$(".battle .battle_yasen img", container).attr("src", "../../../../assets/img/ui/yasen-x.png");
				}
				
				// Battle conditions
				$(".battle .battle_cond_text", container).removeClass( "good" );
				$(".battle .battle_cond_text", container).removeClass( "bad" );
				
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
				this.Fleet(container, {}, local);
			},
			PvPEnd: function(container, data, local){
				var expGained = data.result.api_get_exp;
				if(ConfigManager.info_delta) {
					// If EXP left exceeded by gained EXP on sortie
					var maxHQ=Object.keys(KC3Meta._exp).map(function(a){return parseInt(a);}).reduce(function(a,b){return a>b?a:b;});
					while(expGained >= PlayerManager.hq.exp[1] && PlayerManager.hq.level < maxHQ) {
						expGained -= PlayerManager.hq.exp[1];
						PlayerManager.hq.exp = [0,KC3Meta.exp(++PlayerManager.hq.level)[0],0];
						this.HQ(container, {}, local);
					}
					$(".battle_hqexpgain", container).css({width: Math.floor((function(){
						return (PlayerManager.hq.exp[2] + Math.min(PlayerManager.hq.exp[1],expGained)) / KC3Meta.exp(PlayerManager.hq.level)[0];
					})()*60)+"px"});
				}
				$(".battle_hqlevel_next_gain", container).text(expGained);
				// giles bhunder
				$(".battle .battle_rating img").attr("src", "../../../../assets/img/client/ratings/"+data.result.api_win_rank+".png");
			},
			ExpedResult: function(container, data, local){
			},
		}
	});
	
	function CraftGearStats(container, MasterItem, StatProperty, Code){
		if(parseInt(MasterItem["api_"+StatProperty], 10) !== 0){
			var thisStatBox = $(".factory .equipStat", container).clone().appendTo( $(".equipStats", container) );
			$("img", thisStatBox).attr("src", "../../../../assets/img/stats/"+Code+".png");
			$(".equipStatText", thisStatBox).text( MasterItem["api_"+StatProperty] );
		}
	}
	
	function FleetHP(container, ShipBox, hp, afterHp, rosterId){
		if (!ConfigManager.info_battle) {
			afterHp = null;
		}
		afterHp = afterHp || hp;
		var hpPercent = hp[0] / hp[1];
		var afterHpPercent = afterHp[0] / afterHp[1];

		$(".ship-hp-text", ShipBox).text( hp[0] +" / "+ hp[1] );
		
		var maxHpBarWidth = $(".ship-hp-bar", ShipBox).css("width");
		maxHpBarWidth = Number(maxHpBarWidth.substring(0, maxHpBarWidth.length-2));
		$(".ship-hp-val", ShipBox).css("width", (maxHpBarWidth*hpPercent)+"px");
		$(".ship-hp-after-val", ShipBox).css("width", (maxHpBarWidth*afterHpPercent)+"px");

		if( PlayerManager.repairShips.indexOf(rosterId) > -1){
			$(".ship-img", ShipBox).css("background", "#ACE");
			$(".ship-hp-val", ShipBox).css("background", "#ACE");
			$(".ship-hp-after-val", ShipBox).css("background", "#ACE");

		}else {
			if(hpPercent <= 0.25){
				$(".ship-img", ShipBox).css("background", "#FF0000");
				$(".ship-hp-val", ShipBox).css("background", "#FF0000");
				ShipBox.css("background", "#FCC");
				if( PlayerManager.repairShips.indexOf(rosterId) == -1 ){
					// #68 no more red-glowing ship. interface is now hightlighted with red on the sides
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

			if(afterHpPercent <= 0.00 && ConfigManager.info_btstamp) { // Sunk or Knocked out
				$(ShipBox).addClass("ship-cond-stamp");
				$(ShipBox).attr("title",KC3Meta.term("PredictionStamp"+(KC3Panel.layout().data.isSunkable ? "Sortie" : "PvP")));
			} else if(afterHpPercent <= 0.25){
				$(".ship-hp-after-val", ShipBox).css("background", "#FF0000");
			} else if(afterHpPercent <= 0.50){
				$(".ship-hp-after-val", ShipBox).css("background", "#FF9900");
			} else if(afterHpPercent <= 0.75){
				$(".ship-hp-after-val", ShipBox).css("background", "#FFFF00");
			} else{
				$(".ship-hp-after-val", ShipBox).css("background", "#00FF00");
			}
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
		if (item === null) {
			$("img", element).hide();
			$(".ship-equip-capacity", element).hide();
		} else {
			var folder = "../../../../../assets/img/items/";
			if(item.itemId > 0){
				$("img", element).attr("src", folder + item.master().api_type[3] + ".png");
				$(element).attr("title", item.name());
			}else{
				$("img", element).attr("src", folder + "empty.png");
			}

			var gearHolderColor;
			var equipCapacityColor;
			switch (ConfigManager.pan_gear_holder) {
				case "black" :
					gearHolderColor = "rgba(0, 0, 0, 1)";
					equipCapacityColor = "#fff";
					break;
				case "white" :
					gearHolderColor = "rgba(255, 255, 255, 1)";
					equipCapacityColor = "#000";
					break;
				default:
					gearHolderColor = "rgba(255, 255, 255, 0)";
					equipCapacityColor = "#000";
			}
			$("img", element).css("background", gearHolderColor);

			// Gear Holder toggle
			$("img", element).on("click", function(){
				switch (ConfigManager.pan_gear_holder) {
					case "black" :
						ConfigManager.pan_gear_holder = "white";
						gearHolderColor = "rgba(255, 255, 255, 1)";
						equipCapacityColor = "#000";
						break;
					case "white" :
						ConfigManager.pan_gear_holder = "none";
						gearHolderColor = "rgba(255, 255, 255, 0)";
						equipCapacityColor = "#000";
						break;
					default:
						ConfigManager.pan_gear_holder = "black";
						gearHolderColor = "rgba(0, 0, 0, 1)";
						equipCapacityColor = "#fff";
				}
				$(".ship-gear img").css("background", gearHolderColor);
				$(".fleet-ships .ship-equip-capacity").css("color", equipCapacityColor);
				ConfigManager.save();
			});

			if(capacity > 0){
				$(".ship-equip-capacity", element).text(capacity);
				$(".ship-equip-capacity", element).attr("title", "Plane Capacity");
			}else{
				$(".ship-equip-capacity", element).text("");
			}
			$(".fleet-ships .ship-equip-capacity").css("color", equipCapacityColor);
		}
	}
	
})();
