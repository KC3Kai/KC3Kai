(function(){
	"use strict";

	KC3StrategyTabs.gunfits = new KC3StrategyTab("gunfits");

	KC3StrategyTabs.gunfits.definition = {
		tabSelf: KC3StrategyTabs.gunfits,
		tests: [],

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			let self = this;

			TsunDBSubmission.updateGunfitsIfNeeded((e) => {
				self.tests = e;
				self.execute();
			});

			if(localStorage.tsundb_gunfits != undefined) {
				let gf = JSON.parse(localStorage.tsundb_gunfits);
				self.tests = gf.tests;
				return;
			}
		},

		/* RELOAD
		Prepares latest ships data
		---------------------------------*/
		reload :function(){
			KC3ShipManager.load();
			KC3GearManager.load();
			PlayerManager.loadFleets();
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			let self = this;
			
			let shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			let gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			let rangeText = function(range){
				if(range[0] == range[1])
					return range[0];
				return range.join(" ~ ");
			};
			let generateTestItem = function(test, testItem) {
				// Generate ship info
				let shipId = test.shipId;
				let shipName = KC3Meta.shipName(KC3Master.ship(shipId).api_name);
				let ownedShips = KC3ShipManager.find((a) => a.masterId == shipId);

				$(".shipinfo .generalship .ship_icon img", testItem)
					.attr("src", KC3Meta.shipIcon(shipId))
					.attr("alt", shipId )
					.click(shipClickFunc)
					.attr("title", `${shipName} [${shipId}]`);
				$(".shipinfo .generalship .name", testItem).text(shipName);

				$(".shipinfo .lvl .requested", testItem).text(rangeText(test.lvlRange));
				if(ownedShips.length > 0) {
					$(".shipinfo .lvl .lvl_status", testItem).text(ownedShips.map((a) => a.level).join(", "));

					// check if owned are within requested level range
					if(ownedShips.filter((a) => a.level >= test.lvlRange[0] && a.level <= test.lvlRange[1]).length > 0) {
						$(".shipinfo .ship_status", testItem).text("Good to go!");
					} else {
						$(".shipinfo .ship_status", testItem).text("You own this remodel, but not correct level");
						testItem.addClass("testingImpossible");
					}
				} else {
					$(".shipinfo .lvl .lvl_status", testItem).text("/");
					if(KC3ShipManager.find((a) => RemodelDb.originOf(a.masterId) == RemodelDb.originOf(shipId)).length > 0)
						$(".shipinfo .ship_status", testItem).text("You own this ship, but not this remodel");
					else
						$(".shipinfo .ship_status", testItem).text("You don't own this ship");
					testItem.addClass("testingImpossible");
				}

				// Generate equipment info
				$(".ship_gears .gear_status", testItem).text("Good to go!");
				$.each(test.equipment, function(i, gearId) {
					let ship_gear = $(".tab_gunfits .factory .ship_gear").clone();
					let masterGear = KC3Master.slotitem(gearId);
					let gearName = KC3Meta.gearName(masterGear.api_name);
					let ownedGear = KC3GearManager.find((a) => a.masterId == gearId);

					$(".gear_icon img", ship_gear)
						.attr("src", KC3Meta.itemIcon(masterGear.api_type[3]))
						.attr("title", `${gearName} [${gearId}]`)
						.attr("alt", gearId)
						.click(gearClickFunc);
					$(".gear_name", ship_gear).text(gearName);
					$(".owned", ship_gear).text(`Owned: x${ownedGear.length}`);
					if(ownedGear.length == 0) {
						// TODO support multiple same equip
						$(".ship_gears .gear_status", testItem).text("Missing some equipment");
						testItem.addClass("testingImpossible");
					}
					ship_gear.appendTo($(".ship_gears .gearsbox", testItem));
				});
				
				// Generate morale info
				$(".morale_range", testItem).text(`Morale: ${rangeText(test.moraleRange)}`);

				// Current fleet status
				let fleetStatus = Math.max(...PlayerManager.fleets[0].ship().map((ship) => TsunDBSubmission.checkGunFitTestRequirements(ship, test)));
				if(fleetStatus == -1) {
					$(".curr_fleet_status", testItem).text(`In fleet but wrong morale`);
					testItem.addClass("testingWrongMorale");
				} else if(fleetStatus == 0) {
					$(".curr_fleet_status", testItem).text(`First fleet ready!`);
					testItem.addClass("testingActive");
				}
			};

			$.each( self.tests, function(i,test) {
				let testItem = $(".tab_gunfits .factory .testitem").clone();
				generateTestItem(test, testItem);
				testItem.appendTo(".section_currenttests .box_tests");
			});
		}
	};
})();
