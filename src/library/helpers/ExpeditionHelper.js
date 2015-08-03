(function(){
	"use strict";
	window.ExpeditionHelper = {
		analyzeFleet: function(CurrentFleet) {
			var u = ExpeditionHelper.utils;

			// get a list of all ships currently in this fleet
			var allShips = [];
			$.each(CurrentFleet.ships, function(index, rosterId){
					if (rosterId > -1) {
							var CurrentShip = KC3ShipManager.get( rosterId );
							if (CurrentShip.masterId > 0) {
									allShips.push( CurrentShip );
									
							}
					}
			});

			if (allShips.length > 0) {
					// convert ships to required objects
					// required fields:
					// ammo, morale (not used for now)
					// stype: string
					// level: int
					// drumCount: int
					var allShipsForLib = allShips.map( function(CurrentShip, ind) {
						var shipInst = CurrentShip;
						var shipModel = CurrentShip.master();
						
						var stype = KC3Meta.stype(shipModel.api_stype);
						var level = shipInst.level;
						var drumCount = 0;
						$.each(shipInst.items, function(ind,gear_id) {
							var thisItem = KC3GearManager.get(gear_id);
							if (thisItem) {
								var model = KC3Master.slotitem(thisItem.masterId);
								if (model.api_id == 75)
									++ drumCount;
							}
						});
						
						return {
							ammo: 0,
							morale: 0, 
							stype: stype, 
							level: level, 
							drumCount: drumCount
						};
					});
					
					var PS = window.PS;
					var KE = PS["KanColle.Expedition"];
					var KER = PS["KanColle.Expedition.Requirement"];
					var fleet = KER.fromRawFleet( allShipsForLib );
					var availableExpeditions = KE.getAvailableExpeditions( fleet );
				
					// var demoResult = 
					//    KER.explainRequirements( KER.unsatisfiedRequirements(38)(fleet) );
					
					// alert( JSON.stringify( demoResult ) );
					
					var warnings = [];
					// check bullet and fuel
					// might not be necessary, but we'd better ensure it is full.
					var isBulletAndFuelFull = function(CurrentShip) {
						var shipInst = CurrentShip;
						var shipModel = CurrentShip.master();
						return shipInst.fuel == shipModel.api_fuel_max
						&& shipInst.ammo == shipModel.api_bull_max;
					};
					
					var sInd;
					
					for (sInd in allShips) {
						if (!isBulletAndFuelFull(allShips[sInd])) {
							warnings.push( "resupply" );
							break;
						}
					}
					
					// check morale
					// TODO: this might depend on the expedition task
					// the lower bound is not yet confirmed, but I think >= 39 will be fine
					for (sInd in allShips) {
						if (allShips[sInd].morale <= 39) {
							warnings.push( "morale" );
							break;
						}
					}
					return {w: warnings, e: availableExpeditions};
			} else {
				return "No ship";
			}
		}
	};
})();
