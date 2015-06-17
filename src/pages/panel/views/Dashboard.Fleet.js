KC3.prototype.ExpeditionHelper = {
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
            var isDrumEquipped = KC3.prototype.ExpeditionHelper.utils.isDrumEquipped;
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
                && info.flagShip.stypeIsOneOf("CT") // TODO: correct stype?
                && info.queryStype("DD").length >= 2;
        }
    },
    analyzeFleet: function(fleetShipIds) {
        var u = KC3.prototype.ExpeditionHelper.utils;
        var preconds = KC3.prototype.ExpeditionHelper.preconds;
        var validFleetShipIds = $.grep(fleetShipIds, function(v) { return v > 0; });

        if (validFleetShipIds.length) {
            var avaExps = [];
            var fleetInfo = u.collectFleetInfo(validFleetShipIds);
            for (var expNum in preconds) {
                if (preconds.hasOwnProperty(expNum) && u.isInt(expNum)) {
                    if (preconds[expNum](fleetInfo)) {
                        avaExps.push(expNum);
                    }
                }
            }

            var warnings = [];
            // check bullet and fuel
            // might not be necessary, but we'd better ensure it is full.
            var isBulletAndFuelFull = function(ship) {
                var shipInst = ship.inst;
                var shipModel = ship.model;
                return shipInst.api_fuel == shipModel.api_fuel_max
                    && shipInst.api_bull == shipModel.api_bull_max;
            }
            for (var sInd in fleetInfo.ships) {
                if (!isBulletAndFuelFull(fleetInfo.ships[sInd])) {
                    warnings.push( "bullet or fuel is not full" );
                    break;
                }
            } 
            // check morale
            // TODO: this might depend on the expedition task
            // the lower bound is not yet confirmed, but I think >= 39 will be fine
            for (var sInd in fleetInfo.ships) {
                if (fleetInfo.ships[sInd].inst.api_cond <= 39) {
                    warnings.push( "morale of some ships are less than 39" );
                    break;
                }
            }
            return { availableExpedition: avaExps,
                     warnings: warnings
                   };
        } else {
            return "expedition advice not available.";
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
            // TODO: misleading code
            for (var slot in [0,1,2,3]) {
                gear_id = shipInst.api_slot[slot];
                thisItem = app.Gears.get(gear_id);
                if (thisItem) {
                    model = app.Master.slotitem(thisItem.api_slotitem_id);
                    if (model.api_id == 75)
                        return true;
                }
            }
            return false;
        },
        collectFleetInfo: function(validFleetShipIds) {
            var shipLevelCount = 0;
            var ships = validFleetShipIds.map(function(s) {
                var shipInst = app.Ships.get(s);
                var shipModel = app.Master.ship(shipInst.api_ship_id);
                var stypeIsOneOf = function(queryRaw) {
                    var stype = app.Meta.stype(shipModel.api_stype)
                    var alts = queryRaw.split(" ");
                    return $.inArray(stype,alts) > -1;
                };
                shipLevelCount += shipInst.api_lv;
                return { inst: shipInst,
                         model: shipModel,
                         stypeIsOneOf: stypeIsOneOf};
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
                     flagShipLevel: ships[0].inst.api_lv
                   };
        }
    }
};

KC3.prototype.Dashboard.Fleet = {
	selectedFleet: 1,
	currentShipLos: 0,
	
	update :function(animateID){
		// If fleet doesn't exist yet (player has not yet unlocked the fleet)
		if(typeof app.Docks._fleets[this.selectedFleet-1] == "undefined"){ return false; }
		
		// If there's no ship animating
		if(typeof animateID == "undefined"){ animateID = -2; }
		
		// Clear old summary
		app.Fleet.clear();
		
		// Fleet Ships
		var fleetShipIds = app.Docks._fleets[this.selectedFleet-1].api_ship;
		this.ship(0, fleetShipIds[0], animateID);
		this.ship(1, fleetShipIds[1], animateID);
		this.ship(2, fleetShipIds[2], animateID);
		this.ship(3, fleetShipIds[3], animateID);
		this.ship(4, fleetShipIds[4], animateID);
		this.ship(5, fleetShipIds[5], animateID);
		
		// Fleet summary
		if(!app.Fleet.complete){
			$(".fleet-summary .summary-eqlos").addClass("incomplete");
			$(".fleet-summary .summary-airfp").addClass("incomplete");
		}else{
			$(".fleet-summary .summary-eqlos").removeClass("incomplete");
			$(".fleet-summary .summary-airfp").removeClass("incomplete");
		}
		$(".fleet-summary .summary-level .summary-text").text(app.Fleet.level);
		$(".fleet-summary .summary-eqlos .summary-text").text(app.Fleet.getEffectiveLoS());
		$(".fleet-summary .summary-airfp .summary-text").text(app.Fleet.fighter_power);
		$(".fleet-summary .summary-speed .summary-text").text(app.Fleet.speed);
            
                var expeditionAdvice = app.ExpeditionHelper.analyzeFleet(fleetShipIds);
                $(".expedition-estimate").text(JSON.stringify(expeditionAdvice));
	},
	
	ship :function(index, ship_id, animateID){
		var thisShip, masterShip, hpPercent, expPercent;
		var thisElement = ".fleet-ship-"+(index+1);
		if(ship_id > -1){
			if(app.Ships.get(ship_id)===false){ $(thisElement).hide(); return false; }
			thisShip = app.Ships.get(ship_id);
			masterShip = app.Master.ship(thisShip.api_ship_id);
			
			app.Fleet.level += thisShip.api_lv;
			app.Fleet.total_los += thisShip.api_sakuteki[0];
			if(masterShip.api_soku < 10){ app.Fleet.speed = "Slow"; }
			
			$(thisElement+" .ship-img img").attr("src", app.Assets.shipIcon(thisShip.api_ship_id, '../../assets/img/ui/empty.png'));
			$(thisElement+" .ship-name").text(masterShip.english);
			$(thisElement+" .ship-type").text(app.Meta.stype(masterShip.api_stype));
			$(thisElement+" .ship-hp-text").text(thisShip.api_nowhp +" / "+ thisShip.api_maxhp);
			hpPercent = thisShip.api_nowhp / thisShip.api_maxhp;
			$(thisElement+" .ship-hp-val").css("width", (98*hpPercent)+"px");
			$(thisElement+" .ship-hp-nval").css("width", (98*hpPercent)+"px");
			$(thisElement).removeClass("repair-effect");
			$(thisElement).removeClass("danger-effect");
			
			if( app.Docks._repair_ids.indexOf(ship_id) > -1 ){
				$(thisElement).addClass("repair-effect");
			}
			
			if(hpPercent <= 0.25){
				$(thisElement+" .ship-img").css("background", "#FF0000");
				$(thisElement+" .ship-hp-val").css("background", "#FF0000");
				if( app.Docks._repair_ids.indexOf(ship_id) == -1 ){
					$(thisElement).addClass("danger-effect");
				}
			}else if(hpPercent <= 0.50){
				$(thisElement+" .ship-img").css("background", "#FF9900");
				$(thisElement+" .ship-hp-val").css("background", "#FF9900");
			}else if(hpPercent <= 0.75){
				$(thisElement+" .ship-img").css("background", "#555");
				$(thisElement+" .ship-hp-val").css("background", "#FFFF00");
			}else{
				$(thisElement+" .ship-img").css("background", "#555");
				$(thisElement+" .ship-hp-val").css("background", "#00FF00");
			}
			$(thisElement+" .ship-hp-nval").css("background", $(thisElement+" .ship-hp-val").css("background"));
			 
			$(thisElement+" .ship-lvl-txt").text(thisShip.api_lv);
			$(thisElement+" .ship-lvl-next").text("-"+thisShip.api_exp[1]);
			$(thisElement+" .ship-lvl-val").css("width", (56*(thisShip.api_exp[2]/100))+"px");
			$(thisElement+" .ship-morale-box").text(thisShip.api_cond);
			
			$(thisElement+" .ship-morale-box").css("border-color", "#AAA");
			if(thisShip.api_cond>49){
				$(thisElement+" .ship-morale-box").css("background", "#FFFF00");
				$(thisElement+" .ship-morale-box").css("border-color", "#FFCC00");
			}else if(thisShip.api_cond>39){
				$(thisElement+" .ship-morale-box").css("background", "#FFF");
			}else if(thisShip.api_cond>29){
				$(thisElement+" .ship-morale-box").css("background", "#FFCE84");
			}else if(thisShip.api_cond>19){
				$(thisElement+" .ship-morale-box").css("background", "#FF9900");
			}else{
				$(thisElement+" .ship-morale-box").css("background", "#FF0000");
			}
			
			this.currentShipLos = thisShip.api_sakuteki[0];
			// console.log("starting ship: "+this.currentShipLos);
			this.equip($(thisElement+" .ship-gear-1 img"), thisShip.api_slot[0], thisShip.api_onslot[0]);
			this.equip($(thisElement+" .ship-gear-2 img"), thisShip.api_slot[1], thisShip.api_onslot[1]);
			this.equip($(thisElement+" .ship-gear-3 img"), thisShip.api_slot[2], thisShip.api_onslot[2]);
			this.equip($(thisElement+" .ship-gear-4 img"), thisShip.api_slot[3], thisShip.api_onslot[3]);
			// console.log("added to naked los summation: "+this.currentShipLos);
			app.Fleet.naked_los += Math.sqrt(this.currentShipLos);
			// console.log("new naked los summation: "+app.Fleet.naked_los);
			
			if(ship_id == animateID){
				$("div", thisElement).hide();
				$("div", thisElement).fadeIn();
			}
			
			$(thisElement).show();
		}else{
			$(thisElement).hide();
		}
	},
	
	equip :function(imgElement, gear_id, capacity){
		if(gear_id > -1){
			imgElement.show();
			if(app.Gears.get(gear_id) === false){
				imgElement.attr("src", "../../assets/img/items/0.png");
				app.Fleet.complete = false;
				return false;
			}
			
			thisItem = app.Gears.get(gear_id);
			masterItem = app.Master.slotitem(thisItem.api_slotitem_id);
			
			this.currentShipLos -= masterItem.api_saku;
			app.Fleet.includeEquip(thisItem, masterItem, capacity);
			imgElement.attr("src", "../../assets/img/items/"+masterItem.api_type[3]+".png");

			if(masterItem){
				imgElement.attr("title", masterItem.english + "\n" + masterItem.api_name);
			}
		}else{
			imgElement.hide();
		}
	}
	
};
