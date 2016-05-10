(function(){
	"use strict";
	
	KC3StrategyTabs.fleet = new KC3StrategyTab("fleet");
	
	KC3StrategyTabs.fleet.definition = {
		tabSelf: KC3StrategyTabs.fleet,
		
		fleets: [],

		/*
		  "fleets" object format:
		  * an array of "fleet" objects
		  * length is exactly 4, falsy value for non-existing fleet (null is recommended)
		  
		  "fleet" object format:
		  { ships: <an array of "ship" objects>
		  ( length is exactly 6, falsy value for non-existing ship (null is recommended) )
		  , name: <fleet name> (optional)
		  }

		  "ship" object format:
		  { id: <ship master id>
		  , level: <ship level>
		  , luck: <ship luck> (optional)
		  , equipments: <array of equipments, length = 5 (4+1), falsy for non-existing>
		  }
		  
		  "equipment" object format:
		  { id: <equipment master id>
		  , ace: <aircraft proficiency> (optional) (-1 if "ace" is not applicable)
		  , improve: <improvement level> (optional)
		  }
		  
		 */
		
		/* INIT
		   Prepares all data needed
		   ---------------------------------*/
		init :function(){
			PlayerManager.loadFleets();
			
		},
		
		/* EXECUTE
		   Places data onto the interface
		   ---------------------------------*/
		execute :function(){
			var self = this;
			// Empty fleet list
			$(".tab_fleet .fleet_list").html("");
			
			var fleets = this.loadCurrentFleets();

			$.each(fleets, function(ind, fleet) {
				var kcFleet = self.createKCFleetObject( fleet );
				self.showKCFleet( kcFleet );
			});
		},

		/* Show single fleet
		   --------------------------------------------*/
		showKCFleet: function(kcFleet) {
			if (!kcFleet.active) return;
			var self = this;

			// Create fleet box
			var fleetBox = $(".tab_fleet .factory .fleet_box").clone().appendTo(".tab_fleet .fleet_list");
			// fleetBox.attr("id", "fleet_box"+index);
			$(".fleet_name", fleetBox).text( kcFleet.name );

			$.each( [0,1,2,3,4,5], function(_,ind) {
				var kcShip = kcFleet.ship(ind);
				self.showKCShip(fleetBox, kcShip);
			});
			
			// Show fleet info
			$(".detail_level .detail_value", fleetBox).text( kcFleet.totalLevel() );
			$(".detail_los2 .detail_value", fleetBox).text( Math.round( kcFleet.eLos2() * 100) / 100 );
			$(".detail_los3 .detail_value", fleetBox).text( Math.round( kcFleet.eLos3() * 100) / 100 );
			$(".detail_air .detail_value", fleetBox).text( kcFleet.fighterPowerText() );
			$(".detail_speed .detail_value", fleetBox).text( kcFleet.speed() );
		},

		/* Show single ship
		   --------------------------------------------*/
		showKCShip: function(fleetBox, kcShip) {
			if (kcShip.masterId === 0) return;
			
			var self = this;
			var shipBox = $(".tab_fleet .factory .fleet_ship").clone();
			$(".fleet_ships", fleetBox).append( shipBox );

			$(".ship_type", shipBox).text( kcShip.stype() );
			$(".ship_pic img", shipBox).attr("src", KC3Meta.shipIcon( kcShip.masterId ) );
			$(".ship_lv_val", shipBox).text( kcShip.level );
			$(".ship_name", shipBox).text( kcShip.name() );

			$.each([0,1,2,3], function(_,ind) {
				self.showKCGear(
					$(".ship_gear_"+(ind+1), shipBox),
					kcShip.equipment(ind),
					kcShip.slots[ind]);
			});
		},
		
		/* Show single equipment
		   --------------------------------------------*/
		showKCGear: function(gearBox, kcGear, capacity) {
			if (kcGear.masterId === 0) {
				gearBox.hide();
				return;
			}

			var masterData = kcGear.master();
			$("img", gearBox).attr("src", "../../assets/img/items/"+masterData.api_type[3]+".png");
			$(".gear_name", gearBox).text( kcGear.name() );
		},

		createKCFleetObject: function(fleetObj) {
			var fleet = new KC3Fleet();
			fleet.name = fleetObj.name;
			fleet.ships = [1,2,3,4,5,6];
			if (!fleetObj) return;
			fleet.active = true;
			var shipObjArr = [];

			// simulate ShipManager
			fleet.ShipManager = {
				get: function(ind) {
					return shipObjArr[ind-1];
				}
			};

			// fill in instance of Ships
			$.each( fleetObj.ships, function(ind,shipObj) {
				var ship = new KC3Ship();
				shipObjArr.push( ship );
				// falsy value -> done
				if (!shipObj) return;

				var equipmentObjectArr = [];
				var masterData = KC3Master.ship( shipObj.id );
				ship.rosterId = fleet.ships[ind];
				ship.masterId = shipObj.id;
				ship.level = shipObj.level;
				// calculate naked LoS
				ship.ls[0] = ship.estimateNakedLoS() + ship.equipmentTotalLoS();
				ship.lk[0] = shipObj.luck;
				ship.items = [1,2,3,4];
				ship.slots = masterData.api_maxeq;
				ship.ex_item = 5;
				ship.GearManager = {
					get: function(ind) {
						return equipmentObjectArr[ind-1];
					}
				};

				$.each( shipObj.equipments, function(ind,equipment) {
					var gear = new KC3Gear();
					equipmentObjectArr.push( gear );
					if (!equipment) return;
					gear.masterId = equipment.id;
					gear.itemId = ship.items[ind];
					gear.stars = equipment.improve;
					gear.ace = equipment.ace;
				});

			});

			return fleet;
		},

		loadCurrentFleets: function() {
			var fleetsObj = [];

			function convertEquipmentsOf(ship) {
				var equipments = [];
				$.each([0,1,2,3], function(_,ind) {
					equipments.push( ship.equipment(ind) );
				});
				equipments.push( ship.exItem() );

				function convertEquipment(e) {
					if (e.masterId === 0)
						return null;
					return {
						id: e.masterId,
						ace: e.ace,
						improve: e.stars
					};
				}
				return equipments.map( convertEquipment );
			}

			function convertFleet(fleet) {
				if (!fleet || !fleet.active) return null;
				var fleetObjShips = [];
				$.each([0,1,2,3,4,5], function(_,ind) {
					var ship = fleet.ship(ind);
					if (ship.masterId === 0) {
						fleetObjShips.push( null );
						return;
					}
					var shipObj = {
						id: ship.masterId,
						level: ship.level,
						luck: ship.lk[0],
						equipments: convertEquipmentsOf(ship)
					};
					fleetObjShips.push( shipObj );
				});
				var fleetObj = {
					name: fleet.name,
					ships: fleetObjShips
				};
				return fleetObj;
			}

			PlayerManager.loadFleets();
			$.each([0,1,2,3], function(_,ind) {
				fleetsObj.push(convertFleet( PlayerManager.fleets[ind] ));
			});

			return fleetsObj;
		}
	};
	
})();
