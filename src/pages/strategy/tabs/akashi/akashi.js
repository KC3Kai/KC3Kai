(function(){
	"use strict";
	
	KC3StrategyTabs.akashi = new KC3StrategyTab("akashi");
	
	KC3StrategyTabs.akashi.definition = {
		tabSelf: KC3StrategyTabs.akashi,
		upgrades: {},
		today: {},
		todaySortedIds: [],
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
			PlayerManager.hq.load();
			PlayerManager.loadConsumables();
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
					self.instances[ThisGear.masterId] = {
						total:0,star0_5:0,star6_9:0,starmax:0,unlocked:0
					};
				}
				self.instances[ThisGear.masterId].id = ThisGear.masterId;
				self.instances[ThisGear.masterId].total += 1;
				self.instances[ThisGear.masterId].star0_5 += (!ThisGear.stars || ThisGear.stars < 6) & 1;
				self.instances[ThisGear.masterId].star6_9 += (ThisGear.stars >= 6 && ThisGear.stars < 10) & 1;
				self.instances[ThisGear.masterId].starmax += (ThisGear.stars == 10) & 1;
				self.instances[ThisGear.masterId].unlocked += (ThisGear.lock === 0) & 1;
			});
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
			// Sort gears order by category ID asc, master ID asc
			this.todaySortedIds = Object.keys(this.today).sort(function(a, b){
				return KC3Master.slotitem(a).api_type[2] - KC3Master.slotitem(b).api_type[2]
					|| Number(a) - Number(b);
			});
			
			$(".equipment_list").empty();
			
			var ThisBox, MasterItem, ItemName;
			var hasShip, hasGear, ctr;
			var ShipBox, ShipId;
			var ResBox;
			var shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			var gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			var toAmount = function(v){
				return typeof v === "undefined" || v < 0  ? "?" : String(v);
			};
			var checkDevScrew = function(stars, itemId, devmats, screws){
				if(!hasGear || !hasShip) return;
				var redLine = false;
				if(PlayerManager.consumables.devmats < devmats){
					redLine = true;
					$(".eq_res_value.devmats.plus{0} .val".format(stars), ResBox).addClass("insufficient");
				}
				if(PlayerManager.consumables.screws < screws){
					redLine = true;
					$(".eq_res_value.screws.plus{0} .val".format(stars), ResBox).addClass("insufficient");
				}
				if(!!self.instances[itemId] && self.instances[itemId]["star"+stars] === 0){
					redLine = true;
					$(".eq_res_label.plus{0}".format(stars), ResBox).addClass("insufficient");
				}
				if(redLine){
					$(".eq_res_line.plus{0}".format(stars), ResBox).addClass("insufficient");
				}
			};
			var checkConsumedItem = function(stars, consumedItem, unlocked){
				if(!hasGear || !hasShip) return;
				if(!self.instances[consumedItem.api_id]
					|| self.instances[consumedItem.api_id].total < unlocked){
					$(".eq_res_line.plus{0}".format(stars), ResBox).addClass("insufficient");
					$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), ResBox).addClass("insufficient");
				} else if(!!self.instances[consumedItem.api_id]
					&& self.instances[consumedItem.api_id].unlocked < unlocked){
					$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), ResBox).addClass("locked");
				}
			};
			
			$.each(this.todaySortedIds, function(idx, itemId){
				var shipList = self.today[itemId];
				MasterItem = KC3Master.slotitem(itemId);
				ItemName = KC3Meta.gearName( MasterItem.api_name );
				
				ThisBox = $(".tab_akashi .factory .equipment").clone().appendTo(".equipment_list");
				
				$(".eq_icon img", ThisBox).attr("src", "../../assets/img/items/"+MasterItem.api_type[3]+".png");
				$(".eq_icon img", ThisBox).attr("alt", MasterItem.api_id);
				$(".eq_icon img", ThisBox).click(gearClickFunc);
				
				$(".eq_name", ThisBox).text( ItemName );
				$(".eq_name", ThisBox).attr("title", "[{0}] {1}".format(itemId, ItemName) );
				//ThisBox.attr("title", ItemName );
				
				hasShip = false;
				// If shipList not empty means all ships can upgrade this item
				if(shipList.length === 0){
					hasShip = true;
				}
				
				// If player has this item, check for marking
				hasGear = false;
				if(self.gears.indexOf(parseInt(itemId,10)) > -1){
					hasGear = true;
				}
				
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
					$(".eq_ship_name", ShipBox).attr("title", KC3Meta.shipName( KC3Master.ship(ShipId).api_name ) );
					$(".eq_ships", ThisBox).append(ShipBox);
				}
				
				var imps = WhoCallsTheFleetDb.getItemImprovement(MasterItem.api_id);
				var consumedItem, upgradedItem;
				if(Array.isArray(imps) && imps.length > 0){
					$.each(imps, function(_, imp){
						ResBox = $(".tab_akashi .factory .eq_res").clone();
						var resArr = imp.resource;
						$(".eq_res_value.fuel", ResBox).text(resArr[0][0]);
						$(".eq_res_value.ammo", ResBox).text(resArr[0][1]);
						$(".eq_res_value.steel", ResBox).text(resArr[0][2]);
						$(".eq_res_value.bauxite", ResBox).text(resArr[0][3]);
						if(PlayerManager.hq.lastMaterial[0] < resArr[0][0]
							|| PlayerManager.hq.lastMaterial[1] < resArr[0][1]
							|| PlayerManager.hq.lastMaterial[2] < resArr[0][2]
							|| PlayerManager.hq.lastMaterial[3] < resArr[0][3]){
							$(".eq_res_line.material", ResBox).addClass("insufficient");
						}
						
						$(".eq_res_value.devmats.plus0_5 .val", ResBox).text( toAmount(resArr[1][0]) );
						$(".eq_res_value.devmats.plus0_5 .cnt", ResBox).text( "({0})".format(toAmount(resArr[1][1])) );
						$(".eq_res_value.screws.plus0_5 .val", ResBox).text( toAmount(resArr[1][2]));
						$(".eq_res_value.screws.plus0_5 .cnt", ResBox).text( "({0})".format(toAmount(resArr[1][3])) );
						checkDevScrew("0_5", itemId, resArr[1][1], resArr[1][3]);
						if(resArr[1][4] > 0){
							consumedItem = KC3Master.slotitem(resArr[1][4]);
							$(".eq_res_icon.consumed_icon.plus0_5 img", ResBox).attr("src", "../../assets/img/items/"+consumedItem.api_type[3]+".png");
							$(".eq_res_icon.consumed_icon.plus0_5", ResBox).attr("alt", consumedItem.api_id);
							$(".eq_res_icon.consumed_icon.plus0_5", ResBox).click(gearClickFunc);
							$(".eq_res_value.consumed_name.plus0_5 .val", ResBox).text( KC3Meta.gearName(consumedItem.api_name) );
							$(".eq_res_value.consumed_name.plus0_5 .val", ResBox).attr("title", KC3Meta.gearName(consumedItem.api_name) );
							$(".eq_res_value.consumed_name.plus0_5 .cnt", ResBox).text( "x{0}".format(toAmount(resArr[1][5])) );
							checkConsumedItem("0_5", consumedItem, resArr[1][5]);
						} else {
							$(".eq_res_icon.consumed_icon.plus0_5", ResBox).hide();
							$(".eq_res_value.consumed_name.plus0_5", ResBox).hide();
						}
						
						$(".eq_res_value.devmats.plus6_9 .val", ResBox).text( toAmount(resArr[2][0]) );
						$(".eq_res_value.devmats.plus6_9 .cnt", ResBox).text( "({0})".format(toAmount(resArr[2][1])) );
						$(".eq_res_value.screws.plus6_9 .val", ResBox).text( toAmount(resArr[2][2]) );
						$(".eq_res_value.screws.plus6_9 .cnt", ResBox).text( "({0})".format(toAmount(resArr[2][3])) );
						checkDevScrew("6_9", itemId, resArr[2][1], resArr[2][3]);
						if(resArr[2][4] > 0){
							consumedItem = KC3Master.slotitem(resArr[2][4]);
							$(".eq_res_icon.consumed_icon.plus6_9 img", ResBox).attr("src", "../../assets/img/items/"+consumedItem.api_type[3]+".png");
							$(".eq_res_icon.consumed_icon.plus6_9", ResBox).attr("alt", consumedItem.api_id);
							$(".eq_res_icon.consumed_icon.plus6_9", ResBox).click(gearClickFunc);
							$(".eq_res_value.consumed_name.plus6_9 .val", ResBox).text( KC3Meta.gearName(consumedItem.api_name) );
							$(".eq_res_value.consumed_name.plus6_9 .val", ResBox).attr("title", KC3Meta.gearName(consumedItem.api_name) );
							$(".eq_res_value.consumed_name.plus6_9 .cnt", ResBox).text( "x{0}".format(toAmount(resArr[2][5])) );
							checkConsumedItem("6_9", consumedItem, resArr[2][5]);
						} else {
							$(".eq_res_icon.consumed_icon.plus6_9", ResBox).hide();
							$(".eq_res_value.consumed_name.plus6_9", ResBox).hide();
						}
						if(imp.upgrade && imp.upgrade[0] > 0){
							$(".eq_res_value.devmats.plusmax .val", ResBox).text( toAmount(resArr[3][0]) );
							$(".eq_res_value.devmats.plusmax .cnt", ResBox).text( "({0})".format(toAmount(resArr[3][1])) );
							$(".eq_res_value.screws.plusmax .val", ResBox).text( toAmount(resArr[3][2]) );
							$(".eq_res_value.screws.plusmax .cnt", ResBox).text( "({0})".format(toAmount(resArr[3][3])) );
							checkDevScrew("max", itemId, resArr[3][1], resArr[3][3]);
							if(resArr[3][4] > 0){
								consumedItem = KC3Master.slotitem(resArr[3][4]);
								$(".eq_res_icon.consumed_icon.plusmax img", ResBox).attr("src", "../../assets/img/items/"+consumedItem.api_type[3]+".png");
								$(".eq_res_icon.consumed_icon.plusmax", ResBox).attr("alt", consumedItem.api_id);
								$(".eq_res_icon.consumed_icon.plusmax", ResBox).click(gearClickFunc);
								$(".eq_res_value.consumed_name.plusmax .val", ResBox).text( KC3Meta.gearName(consumedItem.api_name) );
								$(".eq_res_value.consumed_name.plusmax .val", ResBox).attr("title", KC3Meta.gearName(consumedItem.api_name) );
								$(".eq_res_value.consumed_name.plusmax .cnt", ResBox).text( "x{0}".format(toAmount(resArr[3][5])) );
								checkConsumedItem("max", consumedItem, resArr[3][5]);
							} else {
								$(".eq_res_icon.consumed_icon.plusmax", ResBox).hide();
								$(".eq_res_value.consumed_name.plusmax", ResBox).hide();
							}
							upgradedItem = KC3Master.slotitem(imp.upgrade[0]);
							$(".eq_next .eq_res_icon img", ResBox).attr("src", "../../assets/img/items/"+upgradedItem.api_type[3]+".png");
							$(".eq_next .eq_res_icon", ResBox).attr("alt", upgradedItem.api_id);
							$(".eq_next .eq_res_icon", ResBox).click(gearClickFunc);
							$(".eq_next .eq_res_name", ResBox).text( KC3Meta.gearName(upgradedItem.api_name) );
							$(".eq_next .eq_res_name", ResBox).attr("title", KC3Meta.gearName(upgradedItem.api_name) );
						} else {
							$(".eq_res_line.plusmax", ResBox).hide();
							$(".eq_next", ResBox).hide();
						}
						$(".eq_resources", ThisBox).append(ResBox);
					});
				} else {
					$(".eq_resources", ThisBox).hide();
				}
				
				// If doesn't have either ship or gear, and 
				if(!hasGear || !hasShip){
					ThisBox.addClass("disabled");
				}
			});
			
			
		}
		
	};
	
})();
