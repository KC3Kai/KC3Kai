(function(){
	"use strict";

	KC3StrategyTabs.docking = new KC3StrategyTab("docking");

	KC3StrategyTabs.docking.definition = {
		tabSelf: KC3StrategyTabs.docking,

		shipCache:[],
		options: [],
		sortBy: "repair_docking",
		sortAsc: true,
		isLoading: false,

		/* INIT
		   Prepares all data needed
		   ---------------------------------*/
		init :function(){
		},

		/* EXECUTE
		   Places data onto the interface
		   ---------------------------------*/
		execute :function(){
			PlayerManager.loadFleets();

			// in order to get more up-to-date info
			// we need to refresh the Ship Manager
			KC3ShipManager.load();
			
			var ctr, ThisShip, MasterShip, ThisShipData;
			this.shipCache = [];
			for(ctr in KC3ShipManager.list){
				ThisShip = KC3ShipManager.list[ctr];
				MasterShip = ThisShip.master();
				var RepairTime = ThisShip.repairTime();
				ThisShipData = {
					id : ThisShip.rosterId,
					bid : ThisShip.masterId,
					stype: MasterShip.api_stype,
					english: ThisShip.name(),
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
			this.shipList = $(".tab_docking .ship_list");
			this.showFilters();
		},

		/* FILTERS
		   Ship types, and other toggles
		   ---------------------------------*/
		showFilters :function(){
			var self = this;
			// Column header sorting
			$(".tab_docking .ship_header .ship_field.hover").on("click", function(){
				if($(this).data('type') == self.sortBy){
					self.sortAsc = !self.sortAsc;
				}else{
					self.sortAsc = true;
				}
				self.sortBy = $(this).data('type');
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

			// Clear list
			this.shipList.html("").hide();

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
						console.log("error while processing fleet info");
						console.log(err);
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
							console.log("Error while calculating remaining docking time");
							console.log(err);
						}
					}

					// facility cannot repair chuuha / taiha 'd ships
					if (cShip.damageStatus == "chuuha" ||
						cShip.damageStatus == "taiha") {
						cShip.repairAkashi = Infinity;
					}
				});

				// Sorting
				FilteredShips.sort(function(a,b){
					var returnVal = 0;
					switch(self.sortBy){
					case "id":
						if((a.id-b.id) > 0){ returnVal = 1; }
						else if((a.id-b.id) < 0){ returnVal = -1; }
						break;
					case "name":
						if(a.english < b.english) returnVal = -1;
						else if(a.english > b.english) returnVal = 1;
						break;
					case "type": returnVal = a.stype  - b.stype; break;
					case "lv": returnVal = b.level	- a.level; break;
					case "morale": returnVal = b.morale	 - a.morale; break;
					case "hp": returnVal = b.hp	 - a.hp; break;
					case "status": returnVal = a.hp / a.maxhp  - b.hp / b.maxhp; break;
					case "repair_docking":
						returnVal = b.repairDocking - a.repairDocking; 
						if (returnVal === 0 || (!isFinite(a.repairDocking) && !isFinite(b.repairDocking)))
							returnVal = b.repairAkashi - a.repairAkashi;
						break;
					case "repair_akashi": 
						returnVal = b.repairAkashi - a.repairAkashi;
						if (returnVal === 0 || (!isFinite(a.repairAkashi) && !isFinite(b.repairAkashi)))
							returnVal = b.repairDocking - a.repairDocking;
						break;
					default: returnVal = 0; break;
					}
					if(!self.sortAsc){ returnVal =- returnVal; }
					return returnVal;
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
					$(".ship_name", cElm).text( cShip.english );
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
				console.log("Showing this list took", ((new Date()).getTime() - self.startTime)-100 , "milliseconds");
			},100);
		},

		/* Show single equipment icon
		   --------------------------------------------*/
		equipImg :function(cElm, equipNum, equipSlot, gear_id){
			var element = $(".ship_equip_" + equipNum, cElm);
			if(gear_id > -1){
				var gear = KC3GearManager.get(gear_id);
				if(gear.itemId<=0){ element.hide(); return; }

				var masterGear = KC3Master.slotitem(gear.api_slotitem_id);
				$("img",element)
					.attr("src", "../../assets/img/items/" + gear.master().api_type[3] + ".png")
					.attr("title", gear.name());
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
