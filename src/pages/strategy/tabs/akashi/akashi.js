(function(){
	"use strict";
	
	KC3StrategyTabs.akashi = new KC3StrategyTab("akashi");
	
	KC3StrategyTabs.akashi.definition = {
		tabSelf: KC3StrategyTabs.akashi,
		upgrades: {},
		today: {},
		ships: [],
		gears: [],
		instances: {},
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			// Get upgrade data
			var akashiData = $.ajax('../../data/akashi.json', { async: false }).responseText;
			this.upgrades = JSON.parse(akashiData);
			//console.log(this.upgrades);
		},

		/* RELOAD
		Prepares latest player data
		---------------------------------*/
		reload :function(){
			var self = this;
			KC3ShipManager.load();
			KC3GearManager.load();
			
			this.ships = [];
			this.gears = [];
			this.instances = {};
			
			// Get API IDs of all player ships
			$.each(KC3ShipManager.list, function(index, ThisShip){
				if(self.ships.indexOf(ThisShip.masterId) === -1){
					self.ships.push(ThisShip.masterId);
				}
			});
			
			// Get API IDs of all player gear
			$.each(KC3GearManager.list, function(index, ThisGear){
				if(self.gears.indexOf(ThisGear.masterId) === -1){
					self.gears.push(ThisGear.masterId);
				}
				
				if(typeof self.instances[ThisGear.masterId] == "undefined"){
					self.instances[ThisGear.masterId] = [];
				}
				self.instances[ThisGear.masterId].push(ThisGear);
			});
			
			//console.log(this.ships);
			//console.log(this.gears);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			$(".tab_akashi .weekday").on("click", function(){
				KC3StrategyTabs.gotoTab(null, $(this).data("value"));
			});
			
			// Link to weekday specified by hash parameter
			if(!!KC3StrategyTabs.pageParams[1]){
				this.showDay(KC3StrategyTabs.pageParams[1]);
			}else{
				// Select today
				this.showDay();
			}
		},
		
		showDay :function(dayName){
			var self = this;
			var todayDow = Date.getJstDate().getDay();
			dayName = (dayName || $("#weekday-{0}".format(todayDow)).data("value")).toLowerCase();
			$(".weekdays .weekday").removeClass("active");
			$(".weekdays .weekday[data-value={0}]".format(dayName)).addClass("active");
			
			this.today = this.upgrades[ dayName ];
			
			$(".equipment_list").empty();
			
			var ThisBox, MasterItem, ItemName;
			var hasShip, hasGear, ctr;
			var ShipBox, ShipId;
			var shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			var gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			
			$.each(this.today, function(itemId, shipList){
				MasterItem = KC3Master.slotitem(itemId);
				ItemName = KC3Meta.gearName( MasterItem.api_name );
				
				ThisBox = $(".tab_akashi .factory .equipment").clone().appendTo(".equipment_list");
				
				$(".eq_icon img", ThisBox).attr("src", "../../assets/img/items/"+MasterItem.api_type[3]+".png");
				$(".eq_icon img", ThisBox).attr("alt", MasterItem.api_id);
				$(".eq_icon img", ThisBox).click(gearClickFunc);
				
				$(".eq_icon", ThisBox).attr("title", ItemName );
				$(".eq_name", ThisBox).text( ItemName );
				ThisBox.attr("title", ItemName );
				
				hasShip = false;
				for(ctr in shipList){
					ShipId = shipList[ctr];
					
					// If player has any of needed ships, check for marking
					if(self.ships.indexOf( ShipId ) > -1){
						hasShip = true;
					}
					
					// Add to ship list
					ShipBox = $(".tab_akashi .factory .eq_ship").clone();
					$(".eq_ship_icon img", ShipBox).attr("src", KC3Meta.shipIcon(ShipId) );
					$(".eq_ship_icon img", ShipBox).attr("alt", ShipId );
					$(".eq_ship_icon img", ShipBox).click(shipClickFunc);
					$(".eq_ship_name", ShipBox).text( KC3Meta.shipName( KC3Master.ship(ShipId).api_name ) );
					$(".eq_ships", ThisBox).append(ShipBox);
				}
				
				// If shipList not empty means all ships can upgrade this item
				if(shipList.length === 0){
					hasShip = true;
				}
				
				// If player has this item, check for marking
				hasGear = false;
				if(self.gears.indexOf(parseInt(itemId,10)) > -1){
					hasGear = true;
					
					// Show all instances of this equipment from player inventory
					for(ctr in self.instances[itemId]){
						
					}
				}
				
				// If doesn't have either ship or gear, and 
				if(!hasGear || !hasShip){
					ThisBox.addClass("disabled");
				}
			});
			
			
		}
		
	};
	
})();
