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
		showEquippedLocked: false,
		
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
			this.heldGearRosterIds = [];
			this.instances = {};
			this.priorities = this.getPriorities();
			
			// Get API IDs of all player ships, remember all roster IDs of gears they hold
			$.each(KC3ShipManager.list, function(index, ThisShip){
				if(self.ships.indexOf(ThisShip.masterId) === -1){
					self.ships.push(ThisShip.masterId);
					// Doesn't matter to hold some -1 in array
					self.heldGearRosterIds.push(...ThisShip.items);
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
						total:0, star0:0, star0_5:0, star6_9:0, starmax:0,
						unequipped:0, free:0, freestar0:0
					};
				}
				self.instances[ThisGear.masterId].id = ThisGear.masterId;
				self.instances[ThisGear.masterId].total += 1;
				self.instances[ThisGear.masterId].star0 += (!ThisGear.stars) & 1;
				self.instances[ThisGear.masterId].star0_5 += (!ThisGear.stars || ThisGear.stars < 6) & 1;
				self.instances[ThisGear.masterId].star6_9 += (ThisGear.stars >= 6 && ThisGear.stars < 10) & 1;
				self.instances[ThisGear.masterId].starmax += (ThisGear.stars == 10) & 1;
				self.instances[ThisGear.masterId].unequipped += 1 & (self.heldGearRosterIds.indexOf(ThisGear.itemId) === -1);
				self.instances[ThisGear.masterId].free += 1 & (!ThisGear.lock &&
					self.heldGearRosterIds.indexOf(ThisGear.itemId) === -1);
				self.instances[ThisGear.masterId].freestar0 += 1 & (!ThisGear.stars && !ThisGear.lock &&
					self.heldGearRosterIds.indexOf(ThisGear.itemId) === -1);
			});
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;
			self.hideNotImprovable = false;
			this.reload();
			
			$(".tab_akashi .weekday").each(function(){
				$(this).text(Date.getDayName($(this).prop("id").substr(8)).toUpperCase());
			});
			$(".tab_akashi .weekday").on("click", function(){
				KC3StrategyTabs.gotoTab(null, $(this).data("value"));
			});
			
			$("#disabled_toggle").on("click", function(){
				self.hideNotImprovable = !self.hideNotImprovable;
				var equipList = $(".equipment_list");
				if(self.hideNotImprovable){
					$(".equipment.disabled," +
					  (self.showEquippedLocked ? "" : ".equipment.equipped,") +
					  ".equipment.insufficient",
						equipList).slideUp(300);
				} else {
					$(".equipment.disabled," +
					  (self.showEquippedLocked ? "" : ".equipment.equipped,") +
					  ".equipment.insufficient",
						equipList).slideDown();
				}
			});
			
			$("#equipped_checkbox").on("change", function(){
				self.showEquippedLocked = this.checked;
				$(".equipment.disabled," +
					".equipment.equipped," +
					".equipment.insufficient",
					$(".equipment_list")).slideDown(400);
				// To recheck consumable items if locked
				setTimeout(function(){
					KC3StrategyTabs.reloadTab(undefined, false);
				}, 400);
			}).prop("checked", this.showEquippedLocked);
			
			// Link to weekday specified by hash parameter
			if(!!KC3StrategyTabs.pageParams[1]){
				this.showDay(KC3StrategyTabs.pageParams[1]);
			}else{
				// Select today
				this.showDay();
			}

			$(".eq_priority--toggle").on("click", function () {
				const ThisBox = $(this).closest(".equipment");
				const itemId = ThisBox.data("item_id");
				if (self.priorities.indexOf(itemId) !== -1) {
					self.priorities = self.priorities.filter((id) => id !== itemId);
				} else {
					self.priorities.push(itemId);
				}
				self.savePriorities();
				$(this).toggleClass("on");
				$(".eq_priority--up, .eq_priority--down", ThisBox).toggleClass("off");
			});

			$(".eq_priority--up").on("click", function () {
				if ($(this).hasClass("off")) return;
				const ThisBox = $(this).closest(".equipment");
				const prev = ThisBox.prev();
				// if previous element exists and it's not favorite
				if (prev.length > 0 && prev.find(".eq_priority--toggle.on").length === 0){
					//just reload akashi list
					return self.execute();
				}
				//otherwise move item in priority list
				const itemId = ThisBox.data("item_id");
				if (self.priorities.indexOf(itemId) === 0) return;
				const index = self.priorities.indexOf(itemId);
				const newIndex = self.priorities.indexOf(prev.data("item_id"));
				self.priorities.splice(index, 1);
				self.priorities.splice(newIndex, 0, itemId);
				self.savePriorities();
				prev.before(ThisBox);
			});

			$(".eq_priority--down").on("click", function () {
				if ($(this).hasClass("off")) return;
				const ThisBox = $(this).closest(".equipment");
				const next = ThisBox.next();
				// if previous element exists and it's not favorite
				if (next.length > 0 && next.find(".eq_priority--toggle.on").length === 0){
					//just reload akashi list
					return self.execute();
				}
				//otherwise move item in priority list
				const itemId = ThisBox.data("item_id");
				if (self.priorities.indexOf(itemId) === self.priorities.length - 1) return;
				const index = self.priorities.indexOf(itemId);
				const newIndex = self.priorities.indexOf(next.data("item_id"));
				self.priorities.splice(index, 1);
				self.priorities.splice(newIndex, 0, itemId);
				self.savePriorities();
				next.after(ThisBox);
			});
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
				if(self.priorities.indexOf(a)!==-1 || self.priorities.indexOf(b)!==-1){
					if(self.priorities.indexOf(a)===-1) return 1;
					if(self.priorities.indexOf(b)===-1) return -1;
					return self.priorities.indexOf(a) - self.priorities.indexOf(b);
				}
				return KC3Master.slotitem(a).api_type[2] - KC3Master.slotitem(b).api_type[2]
					|| Number(a) - Number(b);
			});
			
			$(".equipment_list").html("");
			
			var ThisBox, MasterItem, ItemName;
			var hasShip, hasGear, ctr;
			var ShipBox, shipId;
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
			var destructConsumeResource = function(res4, res5){
				var [itemName, itemCount] = Array.isArray(res4) ? res4[0] : [res4, res5];
				itemName = typeof itemName === "string" || itemName > 0 ? itemName : null;
				return [itemName, itemCount];
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
			var showConsumedItem = function(stars, consumedItem, amount, container = ResBox){
				if(!consumedItem){
					$(".eq_res_icon.consumed_icon.plus{0}".format(stars), container).hide();
					$(".eq_res_value.consumed_name.plus{0}".format(stars), container).hide();
					return;
				}
				// Array represents the id and name of useitem (not slotitem)
				if(Array.isArray(consumedItem)){
					$(".eq_res_icon.consumed_icon.plus{0} img".format(stars), container).hide();
					$(".eq_res_value.consumed_name.plus{0} .val".format(stars), container)
						.text( consumedItem[1] );
					$(".eq_res_value.consumed_name.plus{0} .val".format(stars), container)
						.attr("title", "[{0}] {1}".format(consumedItem[0], consumedItem[1]) );
					$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), container)
						.text( "x{0}".format(toAmountStr(amount)) );
					return;
				}
				$(".eq_res_icon.consumed_icon.plus{0} img".format(stars), container)
					.attr("src", KC3Meta.itemIcon(consumedItem.api_type[3]));
				$(".eq_res_icon.consumed_icon.plus{0}".format(stars), container)
					.attr("alt", consumedItem.api_id);
				$(".eq_res_icon.consumed_icon.plus{0}".format(stars), container)
					.click(gearClickFunc);
				$(".eq_res_value.consumed_name.plus{0} .val".format(stars), container)
					.text( KC3Meta.gearName(consumedItem.api_name) );
				$(".eq_res_value.consumed_name.plus{0} .val".format(stars), container)
					.attr("title", "[{0}] {1}".format(consumedItem.api_id, KC3Meta.gearName(consumedItem.api_name)) );
				$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), container)
					.text( "x{0}".format(toAmountStr(amount)) );
			};
			var showConsumedItemList = function(stars, resArrElm4, resArrElm5, container = ResBox){
				var consumedResArr = Array.isArray(resArrElm4) ? resArrElm4 : [[resArrElm4, resArrElm5]];
				consumedResArr.forEach((res, i) => {
					let [itemName, itemCount] = destructConsumeResource(res[0], res[1]);
					if(i === 0){
						if(itemName !== null){
							let consumedItem = toSlotOrUseItem(itemName);
							showConsumedItem(stars, consumedItem, itemCount, container);
							checkConsumedItem(stars, consumedItem, itemCount, container);
						} else {
							showConsumedItem(stars, null, container);
						}
					} else if(itemName !== null){
						let extraBox = $(".extra_consumed.template.plus{0}".format(stars), container)
							.clone().removeClass("template")
							.appendTo($(".eq_res_line.plus{0}".format(stars), container));
						let consumedItem = toSlotOrUseItem(itemName);
						showConsumedItem(stars, consumedItem, itemCount, extraBox);
						checkConsumedItem(stars, consumedItem, itemCount, extraBox);
						extraBox.show();
					}
				});
			};
			var checkDevScrew = function(stars, itemId, devmats, screws){
				var redLine = false;
				if((PlayerManager.consumables.devmats || 0) < devmats){
					redLine = true;
					$(".eq_res_value.devmats.plus{0} .val".format(stars), ResBox).addClass("insufficient");
				}
				if((PlayerManager.consumables.screws || 0) < screws){
					redLine = true;
					$(".eq_res_value.screws.plus{0} .val".format(stars), ResBox).addClass("insufficient");
				}
				$(".eq_res_label.plus{0}".format(stars), ResBox).attr("title",
					(self.instances[itemId]||{})["star"+stars] || 0);
				if(!self.instances[itemId] || !self.instances[itemId]["star"+stars]){
					redLine = true;
					$(".eq_res_label.plus{0}".format(stars), ResBox).addClass("insufficient");
				}
				if(redLine){
					$(".eq_res_line.plus{0}".format(stars), ResBox).addClass("insufficient");
				}
			};
			var checkConsumedItem = function(stars, consumedItem, amount, container = ResBox){
				$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), container)
					.removeClass("insufficient locked")
					.removeAttr("title");
				// Check useitem instead of slotitem
				if(Array.isArray(consumedItem)){
					let isNotEnoughUseItem = function(id, amount){
						switch(id){
						case 70: return (PlayerManager.consumables.skilledCrew || 0) < amount;
						case 71: return (PlayerManager.consumables.nEngine || 0) < amount;
						case 75: return (PlayerManager.consumables.newArtilleryMaterial || 0) < amount;
						}
						return false;
					};
					if(isNotEnoughUseItem(consumedItem[0], amount)){
						$(".eq_res_line.plus{0}".format(stars), container).addClass("insufficient");
						$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), container).addClass("insufficient");
					}
					return;
				}
				$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), container).attr("title",
					"{0} (\u2605+0 /total: {1} /{2})".format(
						(self.instances[consumedItem.api_id]||{}).freestar0 || 0,
						(self.instances[consumedItem.api_id]||{}).star0 || 0,
						(self.instances[consumedItem.api_id]||{}).total || 0
					)
				);
				if(!self.instances[consumedItem.api_id]
					|| self.instances[consumedItem.api_id].star0 < amount){
					$(".eq_res_line.plus{0}".format(stars), container).addClass("insufficient");
					$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), container).addClass("insufficient");
				} else if(!!self.instances[consumedItem.api_id]
					&& self.instances[consumedItem.api_id].freestar0 < amount){
					$(".eq_res_line.plus{0}".format(stars), container).addClass(self.showEquippedLocked ? "locked" : "insufficient");
					$(".eq_res_value.consumed_name.plus{0} .cnt".format(stars), container).addClass("locked");
				}
			};
			
			$.each(this.todaySortedIds, function(_, itemId){
				var shipList = self.today[itemId];
				MasterItem = KC3Master.slotitem(itemId);
				ItemName = KC3Meta.gearName( MasterItem.api_name );
				
				ThisBox = $(".tab_akashi .factory .equipment").clone().appendTo(".equipment_list");
				ThisBox.data("item_id",itemId);
				$(".eq_priority--toggle", ThisBox).toggleClass("on", self.priorities.indexOf(itemId) !== -1);
				$(".eq_priority--up,.eq_priority--down", ThisBox).toggleClass("off", self.priorities.indexOf(itemId) === -1);

				$(".eq_icon img", ThisBox).attr("src", KC3Meta.itemIcon(MasterItem.api_type[3]));
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
				hasGear = self.gears.indexOf(parseInt(itemId, 10)) > -1;
				
				for(ctr in shipList){
					shipId = shipList[ctr];
					
					// If player has any of needed ships, check for marking
					if(self.ships.indexOf( shipId ) > -1){
						hasShip = true;
					}
					
					// Add to ship list
					ShipBox = $(".tab_akashi .factory .eq_ship").clone();
					$(".eq_ship_icon img", ShipBox).attr("src", KC3Meta.shipIcon(shipId, undefined, false) );
					$(".eq_ship_icon img", ShipBox).attr("alt", shipId );
					$(".eq_ship_icon img", ShipBox).click(shipClickFunc);
					$(".eq_ship_name", ShipBox).text( KC3Meta.shipName( KC3Master.ship(shipId).api_name ) );
					$(".eq_ship_name", ShipBox).attr("title", "[{0}] {1}".format(shipId, KC3Meta.shipName( KC3Master.ship(shipId).api_name )) );
					$(".eq_ships", ThisBox).append(ShipBox);
				}
				
				// If doesn't have either ship or gear, show disabled red box
				ThisBox.toggleClass("disabled", !hasGear || !hasShip)
				// If all gear equipped, show yellow box
					.toggleClass("equipped", hasGear && hasShip && !self.instances[itemId].unequipped);
				
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
							var shipIcons = $(".eq_res_label.material", ResBox);
							imp.req.forEach(function(reqArr){
								if(reqArr[0][dayIdx] && reqArr[1] && reqArr[1].length){
									shipIcons.empty();
									reqArr[1].forEach(function(reqShipId){
										var remodel = WhoCallsTheFleetDb.getShipRemodel(reqShipId);
										if(!remodel || !remodel.prev
											|| reqArr[1].indexOf(remodel.prev) < 0){
											shipIcons.append(
												$("<img/>").attr("src", KC3Meta.shipIcon(reqShipId, undefined, false))
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
						checkDevScrew("0_5", itemId, resArr[1][1], resArr[1][2]);
						showConsumedItemList("0_5", resArr[1][4], resArr[1][5]);
						
						showDevScrew("6_9", resArr[2][0], resArr[2][1], resArr[2][2], resArr[2][3]);
						checkDevScrew("6_9", itemId, resArr[2][1], resArr[2][2]);
						showConsumedItemList("6_9", resArr[2][4], resArr[2][5]);
						if(imp.upgrade && imp.upgrade[0] > 0){
							showDevScrew("max", resArr[3][0], resArr[3][1], resArr[3][2], resArr[3][3]);
							checkDevScrew("max", itemId, resArr[3][1], resArr[3][2]);
							showConsumedItemList("max", resArr[3][4], resArr[3][5]);
							upgradedItem = KC3Master.slotitem(imp.upgrade[0]);
							$(".eq_next .eq_res_icon img", ResBox).attr("src", KC3Meta.itemIcon(upgradedItem.api_type[3]));
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
							$(".eq_res_line.plusmax", ResBox).addClass("insufficient").hide();
							$(".eq_next", ResBox).hide();
						}
						$(".eq_resources", ThisBox).append(ResBox);
						// If materials or all consumables insufficient, add a class to hide this item
						ThisBox.toggleClass("insufficient",
							hasGear && hasShip && (
							$(".eq_res_line.material", ResBox).hasClass("insufficient") ||
							$(".eq_res_line.insufficient", ResBox).length >=
								$(".eq_res_line", ResBox).length - 1
							)
						);
					});
				} else {
					$(".eq_resources", ThisBox).hide();
				}
			});
			
		},
		
		getPriorities: function() {
			var priorities = [];
			if (!localStorage.srAkashiPriorities) {
				localStorage.srAkashiPriorities = JSON.stringify( priorities );
			} else {
				priorities = JSON.parse( localStorage.srAkashiPriorities );
			}
			return priorities;
		},
		
		setPriorities: function(priorityList) {
			localStorage.srAkashiPriorities = JSON.stringify( priorityList );
		},
		
		savePriorities: function () {
			this.setPriorities(this.priorities);
		}
	};
	
})();
