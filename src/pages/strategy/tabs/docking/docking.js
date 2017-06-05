(function(){
	"use strict";

	KC3StrategyTabs.docking = new KC3StrategyTab("docking");

	KC3StrategyTabs.docking.definition = {
		tabSelf: KC3StrategyTabs.docking,

		shipCache:[],
		sortBy: "repair_docking",
		sortAsc: true,
		isLoading: false,

		/* INIT
		   Prepares static data needed
		   ---------------------------------*/
		init :function(){
		},

		/* RELOAD
		   Prepares reloadable data
		   ---------------------------------*/
		reload :function(){
			PlayerManager.loadFleets();
			// in order to get more up-to-date info
			// we need to refresh the Ship Manager
			KC3ShipManager.load();

			this.shipCache = [];
			for(let ctr in KC3ShipManager.list){
				let ThisShip = KC3ShipManager.list[ctr];
				let MasterShip = ThisShip.master();
				let RepairTime = ThisShip.repairTime();
				let ThisShipData = {
					id : ThisShip.rosterId,
					bid : ThisShip.masterId,
					stype: MasterShip.api_stype,
					sortno: MasterShip.api_sortno,
					name: ThisShip.name(),
					level: ThisShip.level,
					morale: ThisShip.morale,
					equip: ThisShip.items,
					locked: ThisShip.lock,
					hp: ThisShip.hp[0],
					maxhp: ThisShip.hp[1],
					damageStatus: ThisShip.damageStatus(),
					repairDocking: RepairTime.docking,
					repairAkashi: RepairTime.akashi,
					stripped: ThisShip.isStriped(),
					taiha: ThisShip.isTaiha(),
					slots: ThisShip.slots,
					fleet: ThisShip.onFleet(),
				};
				this.shipCache.push(ThisShipData);
			}
		},

		/* EXECUTE
		   Places data onto the interface
		   ---------------------------------*/
		execute :function(){
			var self = this;
			// Get latest data even clicking on tab
			this.reload();
			this.shipList = $(".tab_docking .ship_list");
			// Column header sorting
			$(".tab_docking .ship_header .ship_field.hover").on("click", function(){
				var sortby = $(this).data("type");
				if(!sortby){ return; }
				if(sortby == self.sortBy){
					self.sortAsc = !self.sortAsc;
				}else{
					self.sortAsc = true;
				}
				self.sortBy = sortby;
				self.refreshTable();
			});
			this.refreshTable();
		},

		// assuming PlayerManager.fleets is up-to-date
		// return akashi coverage. (an array of ship ids)
		getAnchoredShips: function() {
			var results = [];
			$.each( PlayerManager.fleets, function(k,fleet) {
				var fs = KC3ShipManager.get(fleet.ships[0]);
				// check if current fleet's flagship is akashi
				if ([182,187].indexOf( fs.masterId ) === -1)
					return;

				var facCount = fs.items.filter( function(x) {
					return KC3GearManager.get(x).masterId === 86;
				}).length;
				// max num of ships this akashi can repair
				var repairCap = 2+facCount;
				var coveredShipIds = fleet.ships.filter( function(x) {
					return x !== -1; }).slice(0,repairCap);
				results = results.concat( coveredShipIds );
			});
			return results;
		},

		/* REFRESH TABLE
		   Reload ship list based on filters
		   ---------------------------------*/
		refreshTable :function(){
			if(this.isLoading){ return false; }
			this.isLoading = true;

			var self = this;
			this.startTime = (new Date()).getTime();

			var shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};

			// Clear list
			this.shipList.empty().hide();

			// Wait until execute
			setTimeout(function(){
				var shipCtr, cElm, cShip, shipLevel;
				var needsRepair = function(ship,i,a) {
					return ship.hp !== ship.maxhp;
				};
				var FilteredShips = self.shipCache.filter(needsRepair);
				var dockingShips = PlayerManager.getCachedDockingShips();
				var anchoredShips = self.getAnchoredShips();
				var currentFleets = PlayerManager.fleets;
				var expeditionFleets = [];
				$.each(currentFleets, function (i,fleet) {
					try {
						var missionState = fleet.mission[0];
						// this fleet is either on expedition or being forced back
						// thus cannot be repaired for now
						if (missionState == 1 ||
							missionState == 3) {
							expeditionFleets.push( i );
						}
					} catch (err) {
						console.warn("Error while processing fleet info", err);
					}
				});

				// update real-time info
				$.each(FilteredShips, function (i, cShip) {
					// update docking time
					var completeTime = dockingShips["x" + cShip.id.toString()];
					if (typeof completeTime !== "undefined") {
						// if we are repairing the ship, show remaining time instead
						try {
							var completeDate = new Date(completeTime);
							var secToComplete = Math.floor( (new Date(completeTime) - new Date()) / 1000 );
							secToComplete = Math.max(0, secToComplete);
							cShip.repairDocking = secToComplete;
							// for docking ship, facility cannot be used
							cShip.repairAkashi = Infinity;
						} catch (err) {
							console.warn("Error while calculating remaining docking time", err);
						}
					}

					// facility cannot repair chuuha / taiha 'd ships
					if (cShip.damageStatus == "chuuha" ||
						cShip.damageStatus == "taiha") {
						cShip.repairAkashi = Infinity;
					}
				});

				// Sorting
				FilteredShips.sort(function(a, b){
					var r = 0;
					switch(self.sortBy){
					case "id"    : r = a.id - b.id; break;
					case "name"  : r = a.name.localeCompare(b.name); break;
					case "type"  : r = a.stype - b.stype; break;
					case "lv"    : r = b.level - a.level; break;
					case "morale": r = b.morale - a.morale; break;
					case "hp"    : r = b.hp - a.hp; break;
					case "status": r = a.hp / a.maxhp - b.hp / b.maxhp; break;
					case "repair_docking":
						r = b.repairDocking - a.repairDocking;
						if (r === 0 || (!isFinite(a.repairDocking) && !isFinite(b.repairDocking)))
							r = b.repairAkashi - a.repairAkashi;
						break;
					case "repair_akashi":
						r = b.repairAkashi - a.repairAkashi;
						if (r === 0 || (!isFinite(a.repairAkashi) && !isFinite(b.repairAkashi)))
							r = b.repairDocking - a.repairDocking;
						break;
					}
					r = r || a.sortno - b.sortno || a.id - b.id;
					if(!self.sortAsc){ r = -r; }
					return r;
				});

				// Fill up list
				Object.keys(FilteredShips).forEach(function(shipCtr){
					if(shipCtr%10 === 0){
						$("<div>").addClass("ingame_page").html("Page "+Math.ceil((Number(shipCtr)+1)/10)).appendTo(self.shipList);
					}

					cShip = FilteredShips[shipCtr];
					shipLevel = cShip.level + 50 * 0; // marry enforcement (debugging toggle)
					cElm = $(".tab_docking .factory .ship_item").clone().appendTo(self.shipList);
					if(shipCtr%2 === 0){ cElm.addClass("even"); }else{ cElm.addClass("odd"); }

					$(".ship_id", cElm).text( cShip.id );
					$(".ship_img .ship_icon", cElm).attr("src", KC3Meta.shipIcon(cShip.bid));
					$(".ship_img .ship_icon", cElm).attr("alt", cShip.bid);
					$(".ship_img .ship_icon", cElm).click(shipClickFunc);
					$(".ship_name", cElm).text( cShip.name );
					$(".ship_type", cElm).text( KC3Meta.stype(cShip.stype) );
					var shipLevelConv = shipLevel;
					$(".ship_lv", cElm).html( "<span>Lv.</span>" + shipLevelConv);
					$(".ship_morale", cElm).html( cShip.morale );

					var hpStatus = cShip.hp.toString() + " / " + cShip.maxhp.toString();
					$(".ship_status", cElm).text( hpStatus );

					$(".ship_hp_val", cElm).css("width", parseInt(cShip.hp/cShip.maxhp*100, 10)+"px");

					$(".ship_repair_docking", cElm).text( String(cShip.repairDocking).toHHMMSS() );
					var akashiText =
						Number.isFinite(cShip.repairAkashi) ? String(cShip.repairAkashi).toHHMMSS() : "-";
					$(".ship_repair_akashi", cElm).text( akashiText );

					if (cShip.damageStatus == "full" ||
						cShip.damageStatus == "dummy") {
						console.warn("damage status shouldn't be full / dummy in this docking page");
					}

					$(".ship_status", cElm).addClass("ship_" + cShip.damageStatus);
					$(".ship_hp_val", cElm).addClass("ship_" + cShip.damageStatus);

					// mutually exclusive indicators
					var completeTime = dockingShips["x" + cShip.id.toString()];
					if (typeof completeTime !== "undefined") {
						// adding docking indicator
						cElm.addClass("ship_docking");
					} else if (cShip.fleet !== 0 &&
						expeditionFleets.indexOf( cShip.fleet-1 ) !== -1) {
						// adding expedition indicator
						cElm.addClass("ship_expedition");
					} else if (anchoredShips.indexOf(cShip.id) !== -1 &&
							   (cShip.damageStatus === "normal" ||
								cShip.damageStatus === "shouha")) {
						// adding akashi repairing indicator
						cElm.addClass("ship_akashi_repairing");
					}

					[1,2,3,4].forEach(function(x){
						self.equipImg(cElm, x, cShip.slots[x-1], cShip.equip[x-1]);
					});

				});

				self.shipList.show();
				self.isLoading = false;
				console.debug("Showing docking list took", ((new Date()).getTime() - self.startTime)-100 , "milliseconds");
			},100);
		},

		/* Show single equipment icon
		   --------------------------------------------*/
		equipImg :function(cElm, equipNum, equipSlot, gear_id){
			var element = $(".ship_equip_" + equipNum, cElm);
			if(gear_id > -1){
				var gear = KC3GearManager.get(gear_id);
				if(gear.itemId<=0){ element.hide(); return; }
				var gearClickFunc = function(e){
					KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
				};

				$("img",element)
					.attr("src", "../../assets/img/items/" + gear.master().api_type[3] + ".png")
					.attr("title", gear.name())
					.attr("alt", gear.master().api_id);
				$("img",element).click(gearClickFunc);
				$("span",element).css('visibility','hidden');
			} else {
				$("img",element).hide();
				$("span",element).each(function(i,x){
					if(equipSlot > 0)
						$(x).text(equipSlot);
					else
						$(x).css('visibility','hidden');
				});
			}
		}
	};
})();
