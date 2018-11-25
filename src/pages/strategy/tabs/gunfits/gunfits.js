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
			if(localStorage.tsundb_gunfits !== undefined) {
				const gf = JSON.parse(localStorage.tsundb_gunfits);
				this.tests = gf.tests;
			}
		},

		/* RELOAD
		Prepares latest ships data
		---------------------------------*/
		reload :function(){
			KC3ShipManager.load();
			KC3GearManager.load();
			PlayerManager.loadFleets();
			TsunDBSubmission.updateGunfitsIfNeeded(data => {
				this.tests = data;
				console.debug("Latest gunfits tests updated", data);
			});
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;
			
			$(".setting_disabled").toggle(!(
				ConfigManager.TsunDBSubmissionExtra_enabled && ConfigManager.TsunDBSubmission_enabled
			));

			const shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const rangeText = (rangeArr) => (rangeArr[0] === rangeArr[1] ? String(rangeArr[0]) : rangeArr.join(" ~ "));
			const itemNameTip = (id, name) => (`[${id}] ${name}`);

			const generateTestItem = (test, testItem) => {
				// Generate ship info
				const shipId = test.shipId;
				const shipName = KC3Meta.shipName(KC3Master.ship(shipId).api_name);
				const ownedShips = KC3ShipManager.find((a) => a.masterId == shipId);

				$(".shipinfo .generalship .ship_icon img", testItem)
					.attr("src", KC3Meta.shipIcon(shipId))
					.attr("alt", shipId )
					.click(shipClickFunc)
					.attr("title", itemNameTip(shipId, shipName));
				$(".shipinfo .generalship .name", testItem).text(shipName);

				$(".shipinfo .lvl .requested", testItem).text(rangeText(test.lvlRange));
				if(ownedShips.length > 0) {
					$(".shipinfo .lvl .lvl_status", testItem).text(ownedShips.map((a) => a.level).join(", "));

					// check if owned are within requested level range
					if(ownedShips.filter(
						ship => ship.level >= test.lvlRange[0] && ship.level <= test.lvlRange[1]
					).length > 0) {
						$(".shipinfo .ship_status", testItem).text("Good to go!");
					} else {
						$(".shipinfo .ship_status", testItem).text("You own this remodel, but not correct level");
						testItem.addClass("testingImpossible");
					}
				} else {
					$(".shipinfo .lvl .lvl_status", testItem).text("/");
					if(KC3ShipManager.find(
						ship => RemodelDb.originOf(ship.masterId) == RemodelDb.originOf(shipId)
					).length > 0)
						$(".shipinfo .ship_status", testItem).text("You own this ship, but not this remodel");
					else
						$(".shipinfo .ship_status", testItem).text("You don't own this ship");
					testItem.addClass("testingImpossible");
				}

				// Generate equipment info
				const requiredCount = {};
				$(".ship_gears .gear_status", testItem).text("Good to go!");
				$.each(test.equipment, (i, gearId) => {
					const shipGear = $(".tab_gunfits .factory .ship_gear").clone()
						.appendTo($(".ship_gears .gearsbox", testItem));
					const masterGear = KC3Master.slotitem(gearId);
					const gearName = KC3Meta.gearName(masterGear.api_name);
					const ownedGear = KC3GearManager.find((a) => a.masterId == gearId);

					$(".gear_icon img", shipGear)
						.attr("src", KC3Meta.itemIcon(masterGear.api_type[3]))
						.attr("title", itemNameTip(gearId, gearName))
						.attr("alt", gearId)
						.click(gearClickFunc);
					$(".gear_name", shipGear).text(gearName);
					$(".owned", shipGear).text(`Owned: x${ownedGear.length}`);
					requiredCount[gearId] = (requiredCount[gearId] || 0) + 1;
					if(ownedGear.length < requiredCount[gearId]) {
						$(".ship_gears .gear_status", testItem).text("Missing some equipment");
						testItem.addClass("testingImpossible");
					}
				});
				// Generate morale info
				$(".morale_range", testItem).text(`Morale: ${rangeText(test.moraleRange)}`);

				// Current fleet status, assuming 1st fleet will be sortied to test
				const fleetStatus = Math.max(...PlayerManager.fleets[0].ship().map(
					ship => TsunDBSubmission.checkGunFitTestRequirements(ship, test)
				));
				if(fleetStatus === -1) {
					$(".curr_fleet_status", testItem).text(`In fleet but wrong morale`);
					testItem.addClass("testingWrongMorale");
				} else if(fleetStatus === 0) {
					$(".curr_fleet_status", testItem).text(`First fleet ready!`);
					testItem.addClass("testingActive");
				}
			};

			const testsBox = $(".section_currenttests .box_tests").empty();
			$.each(self.tests.filter((test) => test.active), (i, test) => {
				const testItem = $(".tab_gunfits .factory .testitem").clone().appendTo(testsBox);
				generateTestItem(test, testItem);
			});
			testsBox.createChildrenTooltips();
		}
	};
})();
