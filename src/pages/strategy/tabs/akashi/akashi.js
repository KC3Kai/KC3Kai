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
		heldGearRosterIds: [],
		instances: {},
		hideNotImprovable: false,
		
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
			PlayerManager.loadBases();
			KC3ShipManager.load();
			KC3GearManager.load();
			
			this.ships = [];
			this.gears = [];
			this.instances = {};
			
			// Get API IDs of all player ships, remember all roster IDs of gears they hold
			$.each(KC3ShipManager.list, function(index, ThisShip){
				if(self.ships.indexOf(ThisShip.masterId) === -1){
					self.ships.push(ThisShip.masterId);
					// Doesn't matter to hold some -1 in array
					[].push.apply(self.heldGearRosterIds, ThisShip.items);
				}
			});
			
			// Get all roster IDs of planes held in LBAS
			$.each(PlayerManager.bases, function(index, LandBase){
				for(var squad in LandBase.planes){
					self.heldGearRosterIds.push(LandBase.planes[squad].api_slotid);
				}
			});
			$.each(PlayerManager.baseConvertingSlots, function(index, rosterId){
				self.heldGearRosterIds.push(rosterId);
			});
			
			// Get API IDs of all player gear
			$.each(KC3GearManager.list, function(index, ThisGear){
				if(self.gears.indexOf(ThisGear.masterId) === -1){
					self.gears.push(ThisGear.masterId);
				}
				
				if(typeof self.instances[ThisGear.masterId] == "undefined"){
					self.instances[ThisGear.masterId] = {
						total:0,star0_5:0,star6_9:0,starmax:0,free:0
					};
				}
				self.instances[ThisGear.masterId].id = ThisGear.masterId;
				self.instances[ThisGear.masterId].total += 1;
				self.instances[ThisGear.masterId].star0_5 += (!ThisGear.stars || ThisGear.stars < 6) & 1;
				self.instances[ThisGear.masterId].star6_9 += (ThisGear.stars >= 6 && ThisGear.stars < 10) & 1;
				self.instances[ThisGear.masterId].starmax += (ThisGear.stars == 10) & 1;
				self.instances[ThisGear.masterId].free += 1 & ( ThisGear.lock === 0 
					&& self.heldGearRosterIds.indexOf(ThisGear.itemId) === -1 );
			});
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			self.hideNotImprovable = false;
			
			$(".tab_akashi .weekday").on("click", function(){
				KC3StrategyTabs.gotoTab(null, $(this).data("value"));
			});
			
			$("#disabled_toggle").on("click", function(){
				self.hideNotImprovable = !self.hideNotImprovable;
				$(".equipment.disabled").toggle(!self.hideNotImprovable);
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
			var dayIdx = {"sun":0,"mon":1,"tue":2,"wed":3,"thu":4,"fri":5,"sat":6}[dayName];
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
			var ResBox, improveList;
			var consumedItem, upgradedItem;
			
			var shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			var gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			var toAmountStr = function(v){
				return typeof v === "undefined" || v < 0  ? "?" : String(v);
			};
			var toSlotOrUseItem = function(v){
				return typeof v === "string" && v.startsWith("consumable")
					? [Number(v.match(/_(\d+)$/)[1]), KC3Meta.useItemName(v.match(/_(\d+)$/)[1])]
					: KC3Master.slotitem(v);
			};
			var showDevScrew = function(stars, devmats, devmatsGS, screws, screwsGS){
				$(".eq_res_value.devmats.plus{0} .val".format(stars), ResBox)
					.text( toAmountStr(devmats) );
				$(".eq_res_value.devmats.plus{0} .cnt".format(stars), ResBox)
					.text( "({0})".format(toAmountStr(devmatsGS)) );
				$(".eq_res_value.screws.plus{0} .val".format(stars), ResBox)
					.text( toAmountStr(screws) );
				$(".eq_res_value.screws.plus{0} .cnt".format(stars), ResBox)
					.text( "({0})".format(toAmountStr(screwsGS)) );
			};
			var showConsumedItem = function(stars, consumedItem, amount){
				if(!consumedItem){
					$(".eq_res_icon.consumed_icon.plus{0}".format(stars), ResBox).hide();
					$(".eq_res_value.consumed_name.plus{0}".format(stars), ResBox).hide();
					return;
				}
				// Array represents the id and name of useitem (not slotitem)
				if(Array.isArray(consumedItem)){
					$(".eq_res_icon.consumed_icon.plus{0} img".format(stars), ResBox).hide();
					$(".eq_res_value.consumed_name.plus{0} .val".format(stars), ResBox)
						.text( consumedItem[1] );
					$(".eq_res_value.consumed_name.plus{0} .val".format(stars), ResBox)
						.attr("title", "[{0}] {1}".format(consumedItem[0], consumedItem[1]) );
					$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), ResBox)
						.text( "x{0}".format(toAmountStr(amount)) );
					return;
				}
				$(".eq_res_icon.consumed_icon.plus{0} img".format(stars), ResBox)
					.attr("src", "../../assets/img/items/"+consumedItem.api_type[3]+".png");
				$(".eq_res_icon.consumed_icon.plus{0}".format(stars), ResBox)
					.attr("alt", consumedItem.api_id);
				$(".eq_res_icon.consumed_icon.plus{0}".format(stars), ResBox)
					.click(gearClickFunc);
				$(".eq_res_value.consumed_name.plus{0} .val".format(stars), ResBox)
					.text( KC3Meta.gearName(consumedItem.api_name) );
				$(".eq_res_value.consumed_name.plus{0} .val".format(stars), ResBox)
					.attr("title", "[{0}] {1}".format(consumedItem.api_id, KC3Meta.gearName(consumedItem.api_name)) );
				$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), ResBox)
					.text( "x{0}".format(toAmountStr(amount)) );
			};
			var checkDevScrew = function(stars, itemId, devmats, screws){
				if(!hasGear || !hasShip) return;
				var redLine = false;
				if((PlayerManager.consumables.devmats || 0) < devmats){
					redLine = true;
					$(".eq_res_value.devmats.plus{0} .val".format(stars), ResBox).addClass("insufficient");
				}
				if((PlayerManager.consumables.screws || 0) < screws){
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
			var checkConsumedItem = function(stars, consumedItem, amount){
				if(!hasGear || !hasShip) return;
				// Check useitem instead of slotitem
				if(Array.isArray(consumedItem)){
					let isNotEnoughUseItem = function(id, amount){
						switch(id){
						case 71: return (PlayerManager.consumables.nEngine || 0) < amount;
						case 75: return (PlayerManager.consumables.newGunMountMaterial || 0) < amount;
						}
						return false;
					};
					if(isNotEnoughUseItem(consumedItem[0], amount)){
						$(".eq_res_line.plus{0}".format(stars), ResBox).addClass("insufficient");
						$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), ResBox).addClass("insufficient");
					}
					return;
				}
				if(!self.instances[consumedItem.api_id]
					|| self.instances[consumedItem.api_id].total < amount){
					$(".eq_res_line.plus{0}".format(stars), ResBox).addClass("insufficient");
					$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), ResBox).addClass("insufficient");
				} else if(!!self.instances[consumedItem.api_id]
					&& self.instances[consumedItem.api_id].free < amount){
					$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), ResBox).addClass("locked");
				}
			};
			
			$.each(this.todaySortedIds, function(_, itemId){
				var shipList = self.today[itemId];
				MasterItem = KC3Master.slotitem(itemId);
				ItemName = KC3Meta.gearName( MasterItem.api_name );
				
				ThisBox = $(".tab_akashi .factory .equipment").clone().appendTo(".equipment_list");
				
				$(".eq_icon img", ThisBox).attr("src", "../../assets/img/items/"+MasterItem.api_type[3]+".png");
				$(".eq_icon img", ThisBox).attr("alt", MasterItem.api_id);
				$(".eq_icon img", ThisBox).click(gearClickFunc);
				
				$(".eq_name", ThisBox).text( ItemName );
				$(".eq_name", ThisBox).attr("title", "[{0}] {1}".format(itemId, ItemName) );
				
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
					$(".eq_ship_name", ShipBox).attr("title", "[{0}] {1}".format(ShipId, KC3Meta.shipName( KC3Master.ship(ShipId).api_name )) );
					$(".eq_ships", ThisBox).append(ShipBox);
				}
				
				// If doesn't have either ship or gear
				if(!hasGear || !hasShip){
					ThisBox.addClass("disabled");
				}
				
				var imps = WhoCallsTheFleetDb.getItemImprovement(MasterItem.api_id);
				if(Array.isArray(imps) && imps.length > 0){
					improveList = [];
					$.each(imps, function(_, imp){
						var dowReq = false;
						imp.req.forEach(function(reqArr){
							// DOW check
							dowReq |= !Array.isArray(reqArr[0]) || reqArr[0][dayIdx];
							// Yet another has ship check on reqArr[1]
						});
						if(dowReq) improveList.push(imp);
					});
					$.each(improveList, function(_, imp){
						ResBox = $(".tab_akashi .factory .eq_res").clone();
						var resArr = imp.resource || [[]];
						
						// Add some precondition ship icons as not check them yet
						if(improveList.length > 1){
							var shipIcons = $(".eq_res_label.material", ResBox).empty();
							imp.req.forEach(function(reqArr){
								if(reqArr[0][dayIdx] && reqArr[1]){
									reqArr[1].forEach(function(reqShipId){
										var remodel = WhoCallsTheFleetDb.getShipRemodel(reqShipId);
										if(!remodel || !remodel.prev
											|| reqArr[1].indexOf(remodel.prev) < 0){
											shipIcons.append(
												$("<img/>").attr("src", KC3Meta.shipIcon(reqShipId))
												.width("16px").height("16px")
											);
										}
									});
								}
							});
						}
						
						$(".eq_res_value.fuel", ResBox).text(toAmountStr(resArr[0][0]));
						$(".eq_res_value.ammo", ResBox).text(toAmountStr(resArr[0][1]));
						$(".eq_res_value.steel", ResBox).text(toAmountStr(resArr[0][2]));
						$(".eq_res_value.bauxite", ResBox).text(toAmountStr(resArr[0][3]));
						if(PlayerManager.hq.lastMaterial[0] < resArr[0][0]
							|| PlayerManager.hq.lastMaterial[1] < resArr[0][1]
							|| PlayerManager.hq.lastMaterial[2] < resArr[0][2]
							|| PlayerManager.hq.lastMaterial[3] < resArr[0][3]){
							$(".eq_res_line.material", ResBox).addClass("insufficient");
						}
						
						showDevScrew("0_5", resArr[1][0], resArr[1][1], resArr[1][2], resArr[1][3]);
						checkDevScrew("0_5", itemId, resArr[1][1], resArr[1][3]);
						if(resArr[1][4] > 0 || typeof resArr[1][4] === "string"){
							consumedItem = toSlotOrUseItem(resArr[1][4]);
							showConsumedItem("0_5", consumedItem, resArr[1][5]);
							checkConsumedItem("0_5", consumedItem, resArr[1][5]);
						} else {
							showConsumedItem("0_5", null);
						}
						
						showDevScrew("6_9", resArr[2][0], resArr[2][1], resArr[2][2], resArr[2][3]);
						checkDevScrew("6_9", itemId, resArr[2][1], resArr[2][3]);
						if(resArr[2][4] > 0 || typeof resArr[2][4] === "string"){
							consumedItem = toSlotOrUseItem(resArr[2][4]);
							showConsumedItem("6_9", consumedItem, resArr[2][5]);
							checkConsumedItem("6_9", consumedItem, resArr[2][5]);
						} else {
							showConsumedItem("6_9", null);
						}
						if(imp.upgrade && imp.upgrade[0] > 0){
							showDevScrew("max", resArr[3][0], resArr[3][1], resArr[3][2], resArr[3][3]);
							checkDevScrew("max", itemId, resArr[3][1], resArr[3][3]);
							if(resArr[3][4] > 0 || typeof resArr[3][4] === "string"){
								consumedItem = toSlotOrUseItem(resArr[3][4]);
								showConsumedItem("max", consumedItem, resArr[3][5]);
								checkConsumedItem("max", consumedItem, resArr[3][5]);
							} else {
								showConsumedItem("max", null);
							}
							upgradedItem = KC3Master.slotitem(imp.upgrade[0]);
							$(".eq_next .eq_res_icon img", ResBox).attr("src", "../../assets/img/items/"+upgradedItem.api_type[3]+".png");
							$(".eq_next .eq_res_icon", ResBox).attr("alt", upgradedItem.api_id);
							$(".eq_next .eq_res_icon", ResBox).click(gearClickFunc);
							$(".eq_next .eq_res_name .name_val", ResBox).text( KC3Meta.gearName(upgradedItem.api_name) );
							if(imp.upgrade[1]){
								$(".eq_next .eq_res_name .stars_val", ResBox).text(
									imp.upgrade[1] >= 10 ? "max" : "+"+imp.upgrade[1]
								);
							} else {
								$(".eq_next .eq_res_name .stars", ResBox).hide();
							}
							$(".eq_next .eq_res_name", ResBox).attr("title",
								"[{0}] {1}".format(upgradedItem.api_id, KC3Meta.gearName(upgradedItem.api_name))
							);
						} else {
							$(".eq_res_line.plusmax", ResBox).hide();
							$(".eq_next", ResBox).hide();
						}
						$(".eq_resources", ThisBox).append(ResBox);
					});
				} else {
					$(".eq_resources", ThisBox).hide();
				}
				
			});
			
		}
		
	};
	
})();
