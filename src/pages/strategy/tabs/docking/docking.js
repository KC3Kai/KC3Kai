(function(){
	"use strict";

	class KC3DockingDefinition extends KC3ShipListGrid {
		constructor() {
			super("docking");
		}

		/* INIT
		Prepares initial static data needed.
		---------------------------------*/
		init() {
			this.defineSorters();
			this.sorters = [{name:"repair_docking", reverse:false}];
			this.showListRowCallback = this.showShipDockingStatus;
			this.pageNo = true;
		}

		/* RELOAD
		Loads latest player or game data if needed.
		---------------------------------*/
		reload() {
			ConfigManager.load();
			// Load latest states of ships and repair docks
			PlayerManager.loadFleets();
			KC3ShipManager.load();
			this.cachedDockingShips = PlayerManager.getCachedDockingShips();
			
			// Prepare damaged ship list
			this.prepareShipList(true, this.mapShipDockingStatus,
				(shipObj) => shipObj.hp[0] !== shipObj.hp[1]);
			
			// For detecting ships in expedition fleets
			this.expeditionFleets = [];
			$.each(PlayerManager.fleets, (index, fleet) => {
				const missionState = fleet.mission[0];
				// this fleet is either on expedition or being forced back
				// thus cannot be repaired for now
				if (missionState == 1 ||
					missionState == 3) {
					this.expeditionFleets.push(index);
				}
			});
			// For detecting ships covered by Akashi repairing
			this.anchoredShips = this.getAnchoredShips();
		}

		/* EXECUTE
		Places data onto the interface from scratch.
		---------------------------------*/
		execute() {
			// Get latest data even clicking on tab
			this.reload();
			this.shipListDiv = $(".tab_docking .ship_list");
			this.shipRowTemplateDiv = $(".tab_docking .factory .ship_item");
			this.registerShipListHeaderEvent(
				$(".tab_docking .ship_header .ship_field.hover")
			);
			this.showListGrid();
		}

		mapShipDockingStatus(shipObj) {
			const mappedObj = this.defaultShipDataMapping(shipObj);
			const repairTime = shipObj.repairTime();
			$.extend(mappedObj, {
				hp: shipObj.hp[0],
				maxhp: shipObj.hp[1],
				damageStatus: shipObj.damageStatus(),
				repairDocking: repairTime.docking,
				repairAkashi: repairTime.akashi
			});
			// Update docking time
			const completeTime = this.cachedDockingShips["x" + mappedObj.id];
			if (typeof completeTime !== "undefined") {
				// if we are repairing the ship, show remaining time instead
				try {
					const completeDate = new Date(completeTime);
					let secToComplete = Math.floor( (new Date(completeTime) - new Date()) / 1000 );
					secToComplete = Math.max(0, secToComplete);
					mappedObj.repairDocking = secToComplete;
					// for docking ship, facility cannot be used
					mappedObj.repairAkashi = Infinity;
				} catch (err) {
					console.warn("Error while calculating remaining docking time", err);
				}
			}
			// facility cannot repair chuuha / taiha 'd ships
			if (mappedObj.damageStatus === "chuuha" ||
				mappedObj.damageStatus === "taiha") {
				mappedObj.repairAkashi = Infinity;
			}
			return mappedObj;
		}

		// assuming PlayerManager.fleets is up-to-date
		// return akashi coverage. (an array of ship ids)
		getAnchoredShips() {
			let results = [];
			$.each( PlayerManager.fleets, function(_, fleet) {
				const fs = KC3ShipManager.get(fleet.ships[0]);
				// check if current fleet's flagship is Akashi (or Kai)
				if ([182, 187].indexOf( fs.masterId ) === -1) {
					return;
				}
				// count of equipped Repair Facility
				const facCount = fs.items.filter(
					id => KC3GearManager.get(id).masterId === 86
				).length;
				// max num of ships this Akashi can repair
				const repairCap = 2 + facCount;
				const coveredShipIds = fleet.ships.filter(id => id !== -1)
					.slice(0, repairCap);
				results = results.concat( coveredShipIds );
			});
			return results;
		}

		defineSorters() {
			this.defaultSorterDefinitions();
			const define = this.defineSimpleSorter.bind(this);
			define("hp", "CurrentHp", ship => -ship.hp);
			define("status", "LeftHpPercent", ship => ship.hp / ship.maxhp);
			this.defineSorter("repair_docking", "DockingTime", (a, b) => {
				let c = b.repairDocking - a.repairDocking;
				if (c === 0 || (!isFinite(a.repairDocking) && !isFinite(b.repairDocking)))
					c = b.repairAkashi - a.repairAkashi;
				return c;
			});
			this.defineSorter("repair_akashi", "AkashiTime", (a, b) => {
				let c = b.repairAkashi - a.repairAkashi;
				if (c === 0 || (!isFinite(a.repairAkashi) && !isFinite(b.repairAkashi)))
					c = b.repairDocking - a.repairDocking;
				return c;
			});
		}

		showShipDockingStatus(ship, shipRow) {
			if(ConfigManager.info_chuuha_icon)
				$(".ship_img .ship_icon", shipRow)
					.attr("src", KC3Ship.shipIcon(ship.masterId, ship.maxhp, ship.hp));
			$(".ship_status", shipRow).text("{0} / {1}".format(ship.hp, ship.maxhp));
			$(".ship_hp_val", shipRow).css("width", parseInt(ship.hp / ship.maxhp * 100, 10)+"px");
			$(".ship_repair_docking", shipRow).text( String(ship.repairDocking).toHHMMSS() );
			$(".ship_repair_akashi", shipRow).text(
				Number.isFinite(ship.repairAkashi) ?
				String(ship.repairAkashi).toHHMMSS() : "-"
			);
			if (ship.damageStatus === "full" ||
				ship.damageStatus === "dummy") {
				console.warn("Damage status shouldn't be full or dummy in this docking page", ship);
			}
			$(".ship_status", shipRow).addClass("ship_" + ship.damageStatus);
			$(".ship_hp_val", shipRow).addClass("ship_" + ship.damageStatus);

			// Mutually exclusive indicators
			const completeTime = this.cachedDockingShips["x" + ship.id];
			if (typeof completeTime !== "undefined") {
				// adding docking indicator
				shipRow.addClass("ship_docking");
			} else if (ship.fleet > 0 &&
				this.expeditionFleets.indexOf(ship.fleet - 1) !== -1) {
				// adding expedition indicator
				shipRow.addClass("ship_expedition");
			} else if (this.anchoredShips.indexOf(ship.id) !== -1 &&
						(ship.damageStatus === "normal" ||
						ship.damageStatus === "shouha")) {
				// adding akashi repairing indicator
				shipRow.addClass("ship_akashi_repairing");
			}

			// List up equipment 4 slots (ex-slot not included)
			[1, 2, 3, 4].forEach(num => {
				this.showEquipIcon(shipRow, num, ship.slots[num - 1], ship.equip[num - 1]);
			});
		}

		showEquipIcon(shipRow, equipNum, slotSize, gearId) {
			const equipDiv = $(".ship_equip_" + equipNum, shipRow);
			if(gearId > -1){
				const gear = KC3GearManager.get(gearId);
				if(gear.isDummy()) {
					equipDiv.hide();
					return;
				}
				$("img", equipDiv)
					.attr("src", "../../assets/img/items/" + gear.master().api_type[3] + ".png")
					.attr("title", gear.htmlTooltip(slotSize))
					.attr("alt", gear.master().api_id)
					.click(this.gearClickFunc)
					.error(function() {
						$(this).unbind("error").attr("src", "../../assets/img/ui/empty.png");
					});
				$("span", equipDiv).css("visibility", "hidden");
			} else {
				// nothing equipped, show slot capacity instead if possible
				$("img", equipDiv).hide();
				$("span", equipDiv).each(function(_, span) {
					if(slotSize > 0) {
						$(span).text(slotSize);
					} else {
						$(span).css("visibility", "hidden");
					}
				});
			}
		}

	}

	KC3StrategyTabs.docking = new KC3StrategyTab("docking");
	KC3StrategyTabs.docking.definition = new KC3DockingDefinition();

})();
