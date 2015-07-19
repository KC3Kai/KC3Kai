(function(){
    "use strict";
    window.ExpeditionHelper = {
	preconds: {
	    1: function(info) {
		return info.shipCount >= 2
		    && info.flagShipLevel >= 1;
	    },
	    2: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 2;
	    },
	    3: function(info) {
		return info.shipCount >= 3
		    && info.flagShipLevel >= 3;
	    },
	    4: function(info) {
		return info.shipCount >= 3
		    && info.flagShipLevel >= 3
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 2;
	    },
	    5: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 3
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 2;
	    },
	    6: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 4;
	    },
	    7: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 5;
	    },
	    8: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 6;
	    },
	    9: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 3
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 2;
	    },
	    10: function(info) {
		return info.shipCount >= 3
		    && info.flagShipLevel >= 3
		    && info.queryStype("CL").length >= 2;
	    },
	    11: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 6
		    && info.queryStype("DD").length >= 2;
	    },
	    12: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 4
		    && info.queryStype("DD").length >= 2;
	    },
	    13: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 5
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 4;
	    },
	    14: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 6
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 3;
	    },
	    15: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 9
		    && info.queryStype("CV CVL AV").length >= 2
		    && info.queryStype("DD").length >= 2;
	    },
	    16: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 11
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 2;
	    },
	    17: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 20
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 3;
	    },
	    18: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 15
		    && info.queryStype("CV CVL AV").length >= 3
		    && info.queryStype("DD").length >= 2;
	    },
	    19: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 20
		    && info.queryStype("BBV").length >= 2
		    && info.queryStype("DD").length >= 2;
	    },
	    20: function(info) {
		return info.shipCount >= 2
		    && info.flagShipLevel >= 1
		    && info.queryStype("SS SSV").length >= 1
		    && info.queryStype("CL").length >= 1;
	    },
	    21: function(info) {
		var isDrumEquipped = ExpeditionHelper.utils.isDrumEquipped;
		return $.grep(info.ships, isDrumEquipped).length >= 3
		    && info.shipCount >= 5
		    && info.flagShipLevel >= 15
		    && info.shipLevelCount >= 30
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 4;
	    },
	    22: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 30
		    && info.shipLevelCount >= 45
		    && info.queryStype("CA").length >= 1
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 2;
	    },
	    23: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 50
		    && info.shipLevelCount >= 200
		    && info.queryStype("BBV").length >= 2
		    && info.queryStype("DD").length >= 2;
	    },
	    24: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 50
		    && info.shipLevelCount >= 200
		    && info.flagShip.stypeIsOneOf("CL")
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 4;
	    },
	    25: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 25
		    && info.queryStype("CA").length >= 2
		    && info.queryStype("DD").length >= 2;
	    },
	    26: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 30
		    && info.queryStype("CV CVL AV").length >= 1
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 2;
	    },
	    27: function(info) {
		return info.shipCount >= 2
		    && info.flagShipLevel >= 1
		    && info.queryStype("SS SSV").length >= 2;
	    },
	    28: function(info) {
		return info.shipCount >= 3
		    && info.flagShipLevel >= 30
		    && info.queryStype("SS SSV").length >= 3;
	    },
	    29: function(info) {
		return info.shipCount >= 3
		    && info.flagShipLevel >= 50
		    && info.queryStype("SS SSV").length >= 3;
	    },
	    30: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 55
		    && info.queryStype("SS SSV").length >= 4;
	    },
	    31: function(info) {
		return info.shipCount >= 4
		    && info.flagShipLevel >= 60
		    && info.shipLevelCount >= 200
		    && info.queryStype("SS SSV").length >= 4;
	    },
	    32: function(info) {
		return info.shipCount >= 3
		    && info.flagShipLevel >= 5
		    && info.flagShip.stypeIsOneOf("CT")
		    && info.queryStype("DD").length >= 2;
	    },
	    35: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 40
		    && info.queryStype("CV CVL AV").length >= 2
		    && info.queryStype("CA").length >= 1
		    && info.queryStype("DD").length >= 1;
	    },
	    36: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 30
		    && info.queryStype("AV").length >= 2
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 1;
	    },
	    37: function(info) {
		var isDrumEquipped = ExpeditionHelper.utils.isDrumEquipped;
		return $.grep(info.ships, isDrumEquipped).length >= 4
		    && info.shipCount >= 6
		    && info.flagShipLevel >= 50
		    && info.shipLevelCount >= 200
		    && info.queryStype("CL").length >= 1
		    && info.queryStype("DD").length >= 5;
	    },
	    38: function(info) {
		var isDrumEquipped = ExpeditionHelper.utils.isDrumEquipped;
		var countDrumEquipped = ExpeditionHelper.utils.countDrumEquipped;
                
		var drumCount = 0;
		$.each( info.ships, function(sInd, s) {
		    drumCount += countDrumEquipped(s);
		});
		return $.grep(info.ships, isDrumEquipped).length >= 4
		    && drumCount >= 8
		    && info.shipCount >= 6
		    && info.flagShipLevel >= 65
		    && info.shipLevelCount >= 240
		    && info.queryStype("DD").length >= 5;
	    },
	    39: function(info) {
		return info.shipCount >= 5
		    && info.flagShipLevel >= 3
		    && info.shipLevelCount >= 180
		    && info.queryStype("AS").length >= 1
		    && info.queryStype("SS SSV").length >= 4;
	    },
	    40: function(info) {
		return info.shipCount >= 6
		    && info.flagShipLevel >= 25
		    && info.shipLevelCount >= 150
		    && info.flagShip.stypeIsOneOf("CL") 
		    && info.queryStype("AV").length >= 2
		    && info.queryStype("DD").length >= 2;
	    }
	},
		analyzeFleet: function(CurrentFleet) {
		    var u = ExpeditionHelper.utils;
		    var preconds = ExpeditionHelper.preconds;

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
                        // check available expeditions
			var availableExpeditions = [];

			var fleetInfo = u.collectFleetInfo(allShips);

			for (var expNum in preconds) {
			    if (preconds.hasOwnProperty(expNum) && u.isInt(expNum)) {
                                try {
				    if (preconds[expNum](fleetInfo)) {
				        availableExpeditions.push(expNum);
				    }
                                } catch (e) {
                                    availableExpeditions.push("error: " + e);
                                }
			    }
			}

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
		},
	    utils: {
		isInt: function(v) {
		    return !isNaN(v) 
			&&  parseInt(Number(v)) == v
			&& !isNaN(parseInt(v, 10));
		},
		isDrumEquipped: function(ship) {
		    var shipInst = ship.inst;
		    for (var slotInd in shipInst.items) {
			var gear_id = shipInst.items[slotInd];
			var thisItem = KC3GearManager.get(gear_id);

			if (thisItem) {
			    var model = KC3Master.slotitem(thisItem.masterId);
			    if (model.api_id == 75) {
				return true;
                            }
			}
		    }
		    return false;
		},
		countDrumEquipped: function(ship) {
		    var shipInst = ship.inst;
		    var count = 0;
		    $.each(shipInst.items, function(ind,gear_id) {
			var thisItem = KC3GearManager.get(gear_id);
			if (thisItem) {
                            var model = KC3Master.slotitem(thisItem.masterId);
			    if (model.api_id == 75)
				++ count;
			}
		    });
		    return count;
		},
		collectFleetInfo: function(allShips) {
		    var shipLevelCount = 0;
		    var ships = allShips.map(function(CurrentShip,index) {
			var shipInst = CurrentShip;
			var shipModel = CurrentShip.master();

			var stypeIsOneOf = function(queryRaw) {
			    var stype = KC3Meta.stype(shipModel.api_stype);
			    var alts = queryRaw.split(" ");
			    return $.inArray(stype,alts) > -1;
			};

			shipLevelCount += shipInst.level;
			return { inst: shipInst,
				 model: shipModel,
				 stypeIsOneOf: stypeIsOneOf };
		    });

		    return { ships: ships,
			     shipCount: ships.length,
			     shipLevelCount: shipLevelCount,
			     queryStype: function(query) {
				 return $.grep(ships, function(s) {
				     return s.stypeIsOneOf(query);
				 });
			     },
			     flagShip: ships[0],
			     flagShipLevel: ships[0].inst.level
			   };
		}
	    }
	};
})();
