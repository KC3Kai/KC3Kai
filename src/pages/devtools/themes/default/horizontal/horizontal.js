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
			
			
		},
		listeners: {
			GameStart: function(container, data, local){
				
			},
			CatBomb: function(container, data, local){
				
			},
			HomeScreen: function(container, data, local){
				console.log("Homescreen", PlayerManager, KC3ShipManager);
			},
			HQ: function(container, data, local){
				$(".admiral_name", container).text( PlayerManager.hq.name );
				$(".admiral_comm", container).text( PlayerManager.hq.desc );
				$(".admiral_rank", container).text( PlayerManager.hq.rank );
				$(".level_value", container).text( PlayerManager.hq.level );
				$(".exp_bar", container).css({width: (PlayerManager.hq.exp[0]*90)+"px"});
				$(".exp_text", container).text( PlayerManager.hq.exp[1] );
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
				
			},
			Quests: function(container, data, local){
				KC3QuestManager.load();
				
				// Get active quests
				var activeQuests = KC3QuestManager.getActives();
				$(".box-quests .box-quest .color").removeClass("type1");
				$(".box-quests .box-quest .color").removeClass("type2");
				$(".box-quests .box-quest .color").removeClass("type3");
				$(".box-quests .box-quest .color").removeClass("type4");
				$(".box-quests .box-quest .color").removeClass("type5");
				$(".box-quests .box-quest .color").removeClass("type6");
				$(".box-quests .box-quest .color").removeClass("type7");
				$(".box-quests .box-quest").hide();
				
				// Show each of them on interface
				$.each(activeQuests, function(index, quest){
					var questType = (quest.id+"").substring(0,1);
					$(".box-quests .quest-box-"+(index+1)+" .color").addClass( "type"+questType );
					if(quest.meta){
						$(".box-quests .quest-box-"+(index+1)+" .name").text( quest.meta().name );
					}else{
						$(".box-quests .quest-box-"+(index+1)+" .name").text("?");
					}
					$(".box-quests .quest-box-"+(index+1)+" .status").text( quest.outputShort() );
					$(".box-quests .quest-box-"+(index+1)).show();
				});
			},
			Fleet: function(container, data, local){
				var CurrentFleet = PlayerManager.fleets[local.selectedFleet-1];
				$(".summary-level .summary-text", container).text( CurrentFleet.totalLevel() );
				$(".summary-eqlos .summary-text", container).text( CurrentFleet.eLoS() );
				$(".summary-airfp .summary-text", container).text( CurrentFleet.fighterPower() );
				// $(".summary-speed .summary-text", container).text( CurrentFleet.speed() );
				$(".summary-speed .summary-text", container).text( CurrentFleet.countDrums() );
				container.css("box-shadow", "none");
				
				console.log("all equipment",KC3GearManager.list);
				
				var FleetContainer = $(".fleet-ships", container);
				FleetContainer.html("");
				$.each(CurrentFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						var CurrentShip = KC3ShipManager.get( rosterId );
						var ShipBox = $(".factory .fleet-ship", container).clone().appendTo(FleetContainer);
						
						$(".ship-img img", ShipBox).attr("src", KC3Meta.shipIcon(CurrentShip.masterId, "../../assets/img/ui/empty.png"));
						$(".ship-name", ShipBox).text( CurrentShip.name() );
						$(".ship-type", ShipBox).text( CurrentShip.stype() );
						$(".ship-lvl-txt", ShipBox).text(CurrentShip.level);
						$(".ship-lvl-next", ShipBox).text("-"+CurrentShip.exp[1]);
						$(".ship-lvl-val", ShipBox).css("width", (60*(CurrentShip.exp[2]/100))+"px");
						
						FleetHP(container, ShipBox, CurrentShip.hp, rosterId );
						FleetMorale( $(".ship-morale-box", ShipBox), CurrentShip.morale );
						FleetEquipment( $(".ship-gear-1 img", ShipBox), CurrentShip.equipment(0) );
						FleetEquipment( $(".ship-gear-2 img", ShipBox), CurrentShip.equipment(1) );
						FleetEquipment( $(".ship-gear-3 img", ShipBox), CurrentShip.equipment(2) );
						FleetEquipment( $(".ship-gear-4 img", ShipBox), CurrentShip.equipment(3) );
					}
				});
			},
			SortieStart: function(container, data, local){
				
			},
			CompassResult: function(container, data, local){
				
			},
			BattleStart: function(container, data, local){
				
			},
			BattleNight: function(container, data, local){
				
			},
			BattleResult: function(container, data, local){
				
			},
			CraftGear: function(container, data, local){
				
			},
			CraftShip: function(container, data, local){
				
			},
			ClearedMap: function(container, data, local){
				
			}
		}
	});
	
	function FleetHP(container, ShipBox, hp, rosterId){
		var hpPercent = hp[0] / hp[1];
		$(".ship-hp-text", ShipBox).text( hp[0] +" / "+ hp[1] );
		$(".ship-hp-val", ShipBox).css("width", (100*hpPercent)+"px");
		
		if(hpPercent <= 0.25){
			$(".ship-img", ShipBox).css("background", "#FF0000");
			$(".ship-hp-val", ShipBox).css("background", "#FF0000");
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
	
	function FleetEquipment(element, item){
		if(item.itemId > 0){
			var folder = "../../../../../assets/img/items/";
			element.attr("src", folder + item.master().api_type[3] + ".png");
		}else{
			element.hide();
		}
	}
	
})();