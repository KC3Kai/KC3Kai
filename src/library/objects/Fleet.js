/* Fleet.js
KC3改 Fleet Object

Contains summary information about a fleet and its ships
*/
(function(){
	"use strict";
	
	window.KC3Fleet = function( data ){
		this.active = false;
		this.fastFleet = false;
		this.minSpeed = 5;
		this.fleetId = 0;
		this.name = "";
		// might be 7-length for 3rd fleet since 2017-11-17
		this.ships = [ -1, -1, -1, -1, -1, -1 ];
		this.mission = [ 0, 0, 0, 0 ];

		// Define properties not included in stringifications
		Object.defineProperties(this,{
			// useful when making virtual fleet objects.
			// requirements:
			// * "ShipManager.get( shipId )" should get the intended ship
			// * "shipId" is taken from "this.ships"
			// * "shipId === -1" should always return a dummy ship
			ShipManager: {
				value: null,
				enumerable: false,
				configurable: false,
				writable: true
			}
		});

		if(!!data) {
			$.extend(this,data);
		}
	};
	
	KC3Fleet.prototype.getShipManager = function() {
		return this.ShipManager || KC3ShipManager;
	};

	KC3Fleet.prototype.update = function( data ){
		if(typeof data.api_member_id != "undefined"){
			var
				self      = this,
				shipState = {
					pre : {},
					post: {},
					set : function(shipKey){
						// Set the shipKey of the shipState object with the current state of the fleet
						var cObj = this[shipKey];
						if(typeof cObj == 'object'){
							cObj.dataShip = self.ships.slice(0);
							cObj.dataItem = self.ship().map(function(shipData){return shipData.items;});
						}
					},
					cmp : function(key1,key2){
						// Compares two key of shipState object, checks for array equality
						try {
							var
								stateRef = this,
								cmpTable = [key1,key2].map(function(keyName){ return stateRef[keyName]; }),
								designatedKey = ['dataShip','dataItem'];
							return true /*travis-kun playground*/ &&
								// Check if the compared data is object data type
								cmpTable.every(function(cmpData){ return typeof cmpData == 'object'; }) &&
								// Check if the compared object have required key
								cmpTable.every(function(cmpData){ return designatedKey.every(function(reqKey){
										return reqKey in cmpData;
									});
								}) && 
								// Equality Check
								designatedKey.every(function(reqKey){
									return cmpTable.map(function(cmpData){return cmpData[reqKey];})
										.reduce(function(lhs,rhs){
											return lhs.equals(rhs);
										});
								});
						} catch (e) {
							console.error("Updating fleet unexpected error", e);
							return false;
						}
					}
				};
			
			shipState.set('pre');
			
			this.active = true;
			this.fleetId = data.api_id;
			this.name = data.api_name;
			this.ships = data.api_ship;
			this.mission = data.api_mission;
			
			shipState.set('post');
			
			if(this.fleetId > 1){
				if(this.mission[0] > 0){
					KC3TimerManager.exped( this.fleetId ).activate(
						this.mission[2],
						this.ship(0).masterId,
						this.mission[1]
					);
				}else{
					KC3TimerManager.exped( this.fleetId ).deactivate();
				}
			}

			this.updateAkashiRepairDisplay();
		}
	};
	
	KC3Fleet.prototype.defineFormatted = function( data ){
		this.active = data.active;
		this.fleetId = data.fleetId;
		this.name = data.name;
		this.ships = data.ships;
		this.mission = data.mission;
		return this;
	};
	
	
	/*--------------------------------------------------------*/
	/*----------------------[ GETTERS ]-----------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.ship = function( slot ){
		switch(typeof slot) {
			case 'number':
			case 'string':
				/* Number/String => converted as fleet slot key */
				return this.getShipManager().get( this.ships[slot] );
			case 'undefined':
				/* Undefined => returns whole fleet as ship object */
				return Array.apply(null, {length: this.countShips()})
					.map(Number.call, Number)
					.map(i => this.ship(i));
			case 'function':
				/* Function => iterates over given callback for every ships */
				var shipObjs = this.ship();
				shipObjs.forEach((ship, index) => {
					slot.call(this, ship.rosterId, index, ship);
				});
				// forEach always return undefined, return ships for chain use
				// NOTE: forEach unstoppable, use other functions to do condition testing
				return shipObjs;
		}
	};
	
	// @return filtered ship object list not contain escaped (didFlee) ships.
	// use this to reduce a `ship.didFlee` condition if ship position not concerned.
	KC3Fleet.prototype.shipsUnescaped = function(){
		return this.ship().filter(ship => !ship.didFlee);
	};
	
	/*--------------------------------------------------------*/
	/*-------------------[ FLEET ACTIONS ]--------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.resetAfterHp = function(){
		for(var i = 0; i < this.countShips(); i++) {
			this.ship(i).resetAfterHp();
		}
	};
	
	KC3Fleet.prototype.clearNonFlagShips = function(){
		this.ships.fill(-1, 1);
		this.updateAkashiRepairDisplay();
	};
	
	KC3Fleet.prototype.discard = function(shipId) {
		var pos = this.ships.indexOf(Number(shipId));
		if(pos >= 0){
			this.ships.splice(pos, 1);
			this.ships.push(-1);
		}
	};
	
	/*--------------------------------------------------------*/
	/*-------------------[ AKASHI REPAIR ]--------------------*/
	/*--------------------------------------------------------*/

	// Mark the fleet's ships as being repaired (or not)
	// Called when the fleet changes, or their equipment does
	KC3Fleet.prototype.updateAkashiRepairDisplay = function () {
		var repairSlots = this._getRepairSlots();
		this.ship(this._updateRepairStatus(repairSlots));
	};

	KC3Fleet.prototype._canDoRepair = function (flagship) {
		return this._isAkashi(flagship) && !flagship.isStriped() && flagship.isFree();
	};

	KC3Fleet.prototype._isAkashi = function (ship) {
		return ship.master().api_stype === 19;
	};

	// Return the number of ships that will be targeted by an Akashi repair
	KC3Fleet.prototype._getRepairSlots = function () {
		var flagship = this.ship(0);
		if (!this._canDoRepair(flagship)) {
			return 0;
		}
		var cranesEquipped = flagship.countEquipment(86);
		return cranesEquipped + 2;
	};

	// Return a function to pass to this.ship() that will update the ships' repair status 
	KC3Fleet.prototype._updateRepairStatus = function (repairSlotCount) {
		return function (rosterId, position, ship) {
			var inRange = position < repairSlotCount;
			ship.akashiMark = inRange && !ship.isStriped() && ship.isFree();
		};
	};

	/*--------------------------------------------------------*/
	/*------------------[ FLEET ATTRIBUTES ]------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.countShips = function(){
		return (this.ships.indexOf(-1) + 1 || (this.ships.length + 1)) - 1;
	};
	
	KC3Fleet.prototype.totalLevel = function(){
		return this.ship().map(function(x){return x.level;})
			.reduce(function(x,y){return x+y;},0);
	};
	
	KC3Fleet.prototype.totalStats = function(includeEquip = true, includeImproveType = false){
		const stats = {
			level: 0, morale: 0, hp: 0,
			fp: 0, tp: 0, aa: 0, ar: 0,
			ev: 0, as: 0, ls: 0, lk: 0,
			ac: 0
		};
		this.ship((rid, idx, ship) =>{
			// always includes modded/marriage bonus values
			const ss = includeEquip ? {
				hp: ship.hp[1],
				fp: ship.fp[0], tp: ship.tp[0], aa: ship.aa[0], ar: ship.ar[0],
				ev: ship.ev[0], as: ship.as[0], ls: ship.ls[0], lk: ship.lk[0],
				ac: ship.equipmentTotalStats("houm")
			} : ship.nakedStats();
			if(!includeEquip) {
				// no accuracy if excludes equipment
				ss.ac = 0;
				// still includes modded/married luck
				ss.lk = ship.lk[0];
			} else {
				// asw with equipment is a special case
				ss.as = ship.nakedAsw() + ship.effectiveEquipmentTotalAsw();
			}
			ss.level = ship.level;
			ss.morale = ship.morale;
			if(includeImproveType) {
				// TODO use accurate types
				ship.equipment(true).forEach(gear => {
					ss.fp += gear.attackPowerImprovementBonus("fire");
					ss.tp += gear.attackPowerImprovementBonus("torpedo");
					ss.aa += gear.aaStatImprovementBonus();
					//ss.ar += gear.armorStatImprovementBonus();
					ss.ev += gear.evaStatImprovementBonus(includeImproveType);
					ss.as += gear.attackPowerImprovementBonus("asw");
					ss.ls += gear.losStatImprovementBonus();
					ss.ac += gear.accStatImprovementBonus(includeImproveType);
				});
			}
			Object.keys(stats).forEach(stat => {
				stats[stat] += ss[stat] || 0;
			});
		});
		return stats;
	};
	
	KC3Fleet.prototype.countDrums = function(){
		return this.ship().map(function(x){return x.countDrums();})
			.reduce(function(x,y){return x+y;},0);
	};

	KC3Fleet.prototype.countShipsWithDrums = function(){
		return this.ship().map(function(x){return x.countDrums() > 0;})
			.reduce(function(x,y){return x+y;},0);
	};

	// calculate accurate landing craft bonus
	// formula taken from 
	// http://kancolle.wikia.com/wiki/Expedition/Introduction#Extra_bonuses_to_expedition_incomes
	// as of Dec 23th, 2016
	KC3Fleet.prototype.calcLandingCraftInfo = function() {
		var self = this;
		// use addImprove() to update this value instead of modifying it directly
		var improveCount = 0;
		function addImprove(stars) {
			if (!stars || stars <= 0)
				return;
			improveCount += stars;
		}

		var normalCount = 0;
		var t89Count = 0;
		var t2Count = 0;
		var tokuCount = 0;
		this.ship( function( shipRid, shipInd, shipObj ) {
			shipObj.equipment( function(itemId,eInd,eObj ) {
				if (itemId <= 0)
					return;
				if (eObj.masterId === 68) {
					// normal landing craft
					normalCount += 1;
					addImprove( eObj.stars );
				} else if (eObj.masterId === 166) {
					// T89
					t89Count += 1;
					addImprove( eObj.stars );
				} else if (eObj.masterId === 167) {
					// T2
					t2Count += 1;
					addImprove( eObj.stars );
				} else if (eObj.masterId === 193) {
					// toku landing craft (230: +11th tank no count)
					tokuCount += 1;
					addImprove( eObj.stars );
				}
			});
		});
		// count number of bonus ships 
		var bonusShipCount = 0;
		this.ship( function(rosterId, ind, shipObj) {
			// for now this can only be applied to Kinu Kai Ni (master id 487)
			if (shipObj.masterId === 487)
				bonusShipCount += 1;
		});

		// without cap
		var basicBonus = (normalCount+tokuCount+bonusShipCount)*0.05 + t89Count*0.02 + t2Count*0.01;
		// cap at 20%
		// "B1" in the formula (see comment link of this function)
		var cappedBasicBonus = Math.min(0.2, basicBonus);
		// "B2" in the formula
		// 5% for <= 3 toku and 5.4% for > 3 toku
		var tokuCap = tokuCount <= 3 ? 0.05 : 0.054;
		var tokuBonus = Math.min(tokuCap, 0.02*tokuCount);
		var landingCraftCount = normalCount + t89Count + t2Count + tokuCount;
		// "B3" in the formula
		var improveBonus = landingCraftCount > 0
			? 0.01 * improveCount * cappedBasicBonus / landingCraftCount
			: 0.0;

		// note that this formula is a bit inaccurate because
		// the floor is taken *after* summing these factors up.
		// however, because this function is meant to calculate a factor
		// that can be applied to a base resource,
		// we can do no better than this without rewriting some other parts of the code.

		return {
			basicBonus: cappedBasicBonus + improveBonus,
			tokuBonus: tokuBonus,
			dhCount: landingCraftCount,
			dhStarCount: improveCount
		};
	};

	KC3Fleet.prototype.landingCraftBonusTextAndVal = function(
		base /* basic resource income */,
		resupply /* must be a non-negative number */, 
		greatSuccess /* must be boolean */) {
		if (typeof greatSuccess !== "boolean") {
			console.warn("greatSuccess must be boolean", greatSuccess);
			return;
		}
		if (typeof resupply !== "number") {
			console.warn("resupply must be number", resupply);
			return;
		}

		var info = this.calcLandingCraftInfo();
		var outputs = [];
		function o(text) {
			outputs.push(text);
		}

		// keep at most 5 digits after decimal point
		// but if a shorter representation is possible, it will be used instead
		function formatFloat(v) {
			if (typeof v !== "number") {
				console.warn("formatFloat argument must be number", v);
			}
			var fixed = v.toFixed(5);
			var converted = "" + v;
			return (fixed.length <= converted.length) ? fixed : converted;
		}

		// "+percent% (actual)"
		// p = 100*percent
		function bonusText(p, actual) {
			return "+" + formatFloat(100*p) + "% (" + formatFloat(actual) + ")";
		}
		
		// "a: b"
		function pairText(a,b) {
			return a + ": " + b;
		}

		var actualBase = Math.floor( greatSuccess ? 1.5 * base : base );
		var total = actualBase;
		var totalText = "" + actualBase;
		if (greatSuccess) {
			o( pairText(KC3Meta.term("ExpedBaseGreat"), actualBase + " = " + base + "x150%" ));
		} else {
			o( pairText(KC3Meta.term("ExpedBaseNormal"), actualBase) );
		}
		if (info.dhCount > 0 && info.dhStarCount > 0) {
			o( pairText(KC3Meta.term("ExpedAveStars"),
						formatFloat(info.dhStarCount/info.dhCount) + " = " + 
						info.dhStarCount + "/" + info.dhCount ) );
		}

		var bonus1 = Math.floor( actualBase * info.basicBonus );
		if (info.basicBonus > 0) {
			o( pairText(KC3Meta.term("ExpedBonus"), bonusText(info.basicBonus, bonus1)) );
			total += bonus1;
			totalText += "+" + bonus1;
		}

		var bonus2 = Math.floor( actualBase * info.tokuBonus );
		if (info.tokuBonus > 0) {
			o( pairText(KC3Meta.term("ExpedBonusToku"), bonusText(info.tokuBonus, bonus2)) );
			total += bonus2;
			totalText += "+" + bonus2;
		}

		var totalNoSup = total;
		if (resupply > 0) {
			o( pairText(KC3Meta.term("ExpedResupply") , "-" + formatFloat( resupply )));
			total -= resupply;
			totalText += "-" + resupply;
		}
		
		totalText = "" + total + " = " + totalText;
		if (resupply > 0) {
			totalText += " = " + totalNoSup + "-" + resupply;
		}

		o( pairText(KC3Meta.term("ExpedTotalIncome"), totalText ) );
		// "outputs" is always non-empty at this point, safe to reduce.
		return { text: outputs.reduce( function(acc,i) { return acc + "\n" + i; } ),
				 val: total };
	};
	
	KC3Fleet.prototype.averageLevel = function(){
		return this.totalLevel() / this.countShips();
	};
	
	KC3Fleet.prototype.fighterPower = function(){
		return this.shipsUnescaped().map(ship => ship.fighterPower())
			.reduce((acc, v) => acc + v, 0);
	};
	
	KC3Fleet.prototype.fighterVeteran = function(){
		return this.shipsUnescaped().map(ship => ship.fighterVeteran())
			.reduce((acc, v) => acc + v, 0);
	};
	
	KC3Fleet.prototype.fighterBounds = function(){
		var totalPower = [0, 0];
		this.shipsUnescaped().forEach(ship => {
			let fighterPower = ship.fighterBounds();
			if(Array.isArray(fighterPower)){
				totalPower[0] += Math.floor(fighterPower[0]);
				totalPower[1] += Math.floor(fighterPower[1]);
			}
		});
		return totalPower;
	};
	
	KC3Fleet.prototype.fighterPowerText = function(){
		switch(ConfigManager.air_formula){
			case 2: return "\u2248"+this.fighterVeteran();
			case 3:
				var fighterBounds = this.fighterBounds();
				return fighterBounds[0]+"~"+fighterBounds[1];
			default:
				return this.fighterPower();
		}
	};

	/**
	 * @param dispSeiku - from `api_disp_seiku`, default is 1 AS+.
	 * @return air contact chance related info object.
	 * @see contactTriggerRate
	 * @see contactSelectionInfo
	 */
	KC3Fleet.prototype.contactChanceInfo = function(dispSeiku = 1){
		const triggerRate = this.contactTriggerRate(dispSeiku);
		const [selectionFailureRate, planeList] = this.contactSelectionInfo(dispSeiku);
		const successRate = Math.min(triggerRate, 1.0) * (1.0 - selectionFailureRate);
		return {
			success: successRate,
			trigger: triggerRate,
			cancelled: selectionFailureRate,
			planes: planeList
		};
	};

	/**
	 * @param dispSeiku - from `api_disp_seiku`, default is 1 AS+.
	 * @return contact start chance at trigger phase.
	 */
	KC3Fleet.prototype.contactTriggerRate = function(dispSeiku = 1){
		const airControlModifiers = [0, 1, 0.6, 0.55 /* guessed, unknown value */, 0];
		var rate = 0;
		this.shipsUnescaped().forEach(ship => {
			rate += [0, 1, 2, 3].map(idx => {
				const gear = ship.equipment(idx);
				return gear.isContactAircraft(false) ?
					(0.04 * gear.master().api_saku * Math.sqrt(ship.slots[idx])) : 0;
			}).reduce((acc, v) => acc + v, 0);
		});
		return rate * (airControlModifiers[dispSeiku] || 0);
	};

	/**
	 * @return contact selection info tuple: [failure chance, contact plane list]
	 * @see contactSelectionChanceTable
	 */
	KC3Fleet.prototype.contactSelectionInfo = function(dispSeiku){
		const contactPlanes = this.contactSelectionChanceTable(dispSeiku);
		return [contactPlanes.map(p => p.rate).reduce((acc, v) => acc * (1 - v), 1), contactPlanes];
	};

	/**
	 * @param dispSeiku - from `api_disp_seiku`, default is 1 AS+.
	 * @return contact selection table of every possible aircraft.
	 * @see http://wikiwiki.jp/kancolle/?%B9%D2%B6%F5%C0%EF#s1d9a838
	 */
	KC3Fleet.prototype.contactSelectionChanceTable = function(dispSeiku = 1){
		const airControlModifiers = [0, 0.07, 0.06, 0.055, 0];
		const contactPlaneList = [];
		this.shipsUnescaped().forEach((ship, shipIdx) => {
			ship.equipment((itemId, gearIdx, gear) => {
				if(gear.isContactAircraft(true)) {
					const gearMaster = gear.master();
					contactPlaneList.push({
						itemId: itemId,
						masterId: gear.masterId,
						icon: gearMaster.api_type[3],
						stars: gear.stars || 0,
						accurcy: gearMaster.api_houm || 0,
						shipOrder: shipIdx,
						shipMasterId: ship.masterId,
						// LoS improvement taken into account, but any other modifier unknown
						rate: (gearMaster.api_saku + gear.losStatImprovementBonus())
							* (airControlModifiers[dispSeiku] || 0)
					});
				}
			});
		});
		if(contactPlaneList.length > 0) {
			// Selection priority order by: accuracy desc, ship position asc
			contactPlaneList.sort((a, b) => b.accurcy - a.accurcy || a.shipOrder - b.shipOrder);
		}
		return contactPlaneList;
	};

	/**
	 * Night recon contact chance, under verifying, not usable.
	 * @see http://wikiwiki.jp/kancolle/?%B6%E5%C8%AC%BC%B0%BF%E5%BE%E5%C4%E5%BB%A1%B5%A1%28%CC%EB%C4%E5%29
	 */
	KC3Fleet.prototype.nightContactSelectionChanceTable = function(){
		const contactPlaneList = [];
		this.shipsUnescaped().forEach((ship, shipIdx) => {
			ship.equipment((itemId, gearIdx, gear) => {
				if(gear.itemId && gear.masterId === 102) {
					const gearMaster = gear.master();
					contactPlaneList.push({
						itemId: itemId,
						masterId: gear.masterId,
						icon: gearMaster.api_type[3],
						stars: gear.stars || 0,
						slotSize: ship.slots[gearIdx] || 0,
						shipOrder: shipIdx,
						shipMasterId: ship.masterId,
						shipLevel: ship.level,
						// no info about how slot size multiply, just know 0 will not trigger
						rate: (Math.sqrt(50 * ship.level) - 3) * Math.sqrt(ship.slots[gearIdx] || 0) / 100
					});
				}
			});
		});
		return contactPlaneList;
	};

	/**
	 * @return total open airstrike power from all ships in fleet.
	 * @see KC3Ship.prototype.airstrikePower
	 * @see KC3Gear.prototype.airstrikePower
	 */
	KC3Fleet.prototype.airstrikePower = function(combinedFleetFactor = 0,
			isJetAssaultPhase = false, contactPlaneId = 0, isCritical = false){
		const totalPower = [0, 0, false];
		this.shipsUnescaped().forEach((ship, index) => {
			const shipPower = ship.airstrikePower(combinedFleetFactor, isJetAssaultPhase,
				contactPlaneId, isCritical);
			totalPower[0] += shipPower[0];
			totalPower[1] += shipPower[1];
			totalPower[2] = totalPower[2] || shipPower[2];
		});
		return totalPower;
	};

	KC3Fleet.prototype.supportPower = function(){
		return this.ship(0).supportPower()
			+this.ship(1).supportPower()
			+this.ship(2).supportPower()
			+this.ship(3).supportPower()
			+this.ship(4).supportPower()
			+this.ship(5).supportPower();
	};
	
	KC3Fleet.prototype.speed = function(){
		this.minSpeed = Math.min(...this.shipsUnescaped().map(ship => ship.getSpeed()));
		this.fastFleet = this.minSpeed >= 10;
		return KC3Meta.shipSpeed(this.minSpeed);
	};

	KC3Fleet.prototype.adjustedAntiAir = function(formationId){
		return Math.floor(
			AntiAir.fleetAdjustedAntiAir(this, AntiAir.getFormationModifiers(formationId || 1))
		);
	};

	/* Calculate expedition cost of a fleet
	   -------------------------------------
	   1 <= expeditionId <= 40
	 */ 
	KC3Fleet.prototype.calcExpeditionCost = function(expeditionId) {
		var KEC = PS["KanColle.Expedition.Cost"];
		var costPercent = KEC.getExpeditionCost( expeditionId );
		var totalFuel = 0;
		var totalAmmo = 0;
		var self = this;
		$.each( this.ships, function(i, shipId) {
			if (shipId > 0) {
				var shipObj = self.ship(i);
				var cost = shipObj.calcResupplyCost( costPercent.fuel, costPercent.ammo );
				totalFuel += cost.fuel;
				totalAmmo += cost.ammo;
			}
		});
		return {fuel: totalFuel, ammo: totalAmmo};
	};

	KC3Fleet.prototype.calcSupportExpeditionCost = function() {
		const totalCost = {
			fuel: 0,
			ammo: 0,
			supportFlag: 0
		};
		totalCost.supportFlag = this.estimateSupportType();
		if(totalCost.supportFlag > 0) {
			const costPercent = {
				fuel: [0, 0.5, 0.5, 0.5][totalCost.supportFlag] || 0,
				ammo: [0, 0.4, 0.8, 0.8][totalCost.supportFlag] || 0
			};
			$.each(this.ships, (i, shipId) => {
				if (shipId > 0) {
					const shipObj = this.ship(i);
					const cost = shipObj.calcResupplyCost(costPercent.fuel, costPercent.ammo);
					totalCost.fuel += cost.fuel;
					totalCost.ammo += cost.ammo;
				}
			});
		}
		return totalCost;
	};

	KC3Fleet.prototype.calcResupplyCost = function() {
		const totalCost = {
			fuel: 0,
			ammo: 0,
			steel: 0,
			bauxite: 0,
			hasMarried: false
		};
		$.each(this.ships, (i, shipId) => {
			if (shipId > 0) {
				const shipObj = this.ship(i);
				const cost = shipObj.calcResupplyCost(-1, -1, true, true);
				totalCost.fuel += cost.fuel;
				totalCost.ammo += cost.ammo;
				totalCost.steel += cost.steel;
				totalCost.bauxite += cost.bauxite;
				totalCost.hasMarried = totalCost.hasMarried || shipObj.isMarried();
			}
		});
		return totalCost;
	};

	KC3Fleet.prototype.calcJetsSteelCost = function(currentSortieId) {
		var i, ship;
		var totalSteel = 0;
		for(i = 0; i < this.countShips(); i++) {
			ship = this.ship(i);
			totalSteel += ship.calcJetsSteelCost(currentSortieId);
		}
		return totalSteel;
	};

	KC3Fleet.prototype.calcBattleCost = function() {
		const totalCost = {
			fuel: 0,
			dayOnlyAmmo: 0,
			nightBattleAmmo: 0,
			airRaidFuel: 0,
			airRaidAmmo: 0
		};
		for(let i = 0; i < this.countShips(); i++) {
			const ship = this.ship(i);
			const maxFuel = ship.master().api_fuel_max,
			      maxAmmo = ship.master().api_bull_max;
			totalCost.fuel += Math.ceil(maxFuel * 0.2);
			totalCost.dayOnlyAmmo += Math.ceil(maxAmmo * 0.2);
			totalCost.nightBattleAmmo += Math.ceil(maxAmmo * 0.3);
			totalCost.airRaidFuel += Math.floor(maxFuel * 0.08) || 1;
			totalCost.airRaidAmmo += Math.floor(maxAmmo * 0.04) || 1;
		}
		return totalCost;
	};

	KC3Fleet.prototype.calcTpObtain = function(...fleetArr) {
		if(fleetArr.length > 1) {
			return Math.floor(fleetArr.map(fleet => fleet.ship()
				.map(ship => ship.obtainTP())
				.reduce((pre, cur) => pre.add(cur), KC3Meta.tpObtained())
			).reduce((pre, cur) => pre.add(cur), KC3Meta.tpObtained()).value);
		}
		const fleet = fleetArr[0] || this;
		return Math.floor(fleet.ship()
			.map(ship => ship.obtainTP())
			.reduce((pre, cur) => pre.add(cur), KC3Meta.tpObtained())
			.value);
	};

	/*--------------------------------------------------------*/
	/*-----------------[ STATUS INDICATORS ]------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.hasShip = function(expected, pos, isExcludeEscaped = false){
		return this.ship().some((ship, index) => {
			if(isExcludeEscaped && ship.didFlee) {
				return false;
			}
			if(pos === undefined || pos === index) {
				if(typeof expected === "number"
					|| typeof expected === "string") {
					return RemodelDb.originOf(expected)
						=== RemodelDb.originOf(ship.masterId);
				} else if(Array.isArray(expected)) {
					return expected.indexOf(ship.masterId) > -1;
				} else if(expected instanceof KC3Ship) {
					return expected.masterId === ship.masterId;
				}
			}
			return false;
		});
	};
	
	KC3Fleet.prototype.countShip = function(expected, isExclude = false, isExcludeEscaped = false){
		const ships = isExcludeEscaped ? this.shipsUnescaped() : this.ship();
		return ships.reduce((count, ship) => {
			if(Array.isArray(expected)) {
				return count + (1 & (isExclude !==
					(expected.indexOf(ship.masterId) > -1)));
			}
			return count + (1 & (isExclude !==
				(RemodelDb.originOf(expected) === RemodelDb.originOf(ship.masterId))));
		}, 0);
	};
	
	KC3Fleet.prototype.hasShipType = function(expected, pos, isExcludeEscaped = false){
		return this.ship().some((ship, index) => {
			if(isExcludeEscaped && ship.didFlee) {
				return false;
			}
			if(pos === undefined || pos === index) {
				if(typeof expected === "number"
					|| typeof expected === "string") {
					return expected == ship.master().api_stype;
				} else if(Array.isArray(expected)) {
					return expected.indexOf(ship.master().api_stype) > -1;
				}
			}
			return false;
		});
	};
	
	KC3Fleet.prototype.countShipType = function(expected, isExclude = false, isExcludeEscaped = false){
		const ships = isExcludeEscaped ? this.shipsUnescaped() : this.ship();
		return ships.reduce((count, ship) => {
			if(Array.isArray(expected)) {
				return count + (1 & (isExclude !==
					(expected.indexOf(ship.master().api_stype) > -1)));
			}
			return count + (1 & (isExclude !==
				(expected == ship.master().api_stype)));
		}, 0);
	};
	
	KC3Fleet.prototype.hasTaiha = function(){
		return this.shipsUnescaped().some(ship => ship.isTaiha());
	};
	
	KC3Fleet.prototype.getTaihas = function(){
		var taihaIndexes = [];
		for(var index in this.ships){
			var ship = this.ship(index);
			if(ship.isTaiha() && !ship.didFlee){
				taihaIndexes.push(index);
			}
		}
		return taihaIndexes;
	};
	
	KC3Fleet.prototype.getDameConCodes = function(){
		var result = [];
		for(var index in this.ships) {
			result.push(this.ship(index).findDameCon().code);
		}
		return result;
	};
	
	KC3Fleet.prototype.isSupplied = function(){
		return this.shipsUnescaped().every(ship => ship.isSupplied());
	};
	
	KC3Fleet.prototype.needsSupply = function(isEmpty){
		return this.shipsUnescaped().some(ship => ship.isNeedSupply(isEmpty));
	};
	
	KC3Fleet.prototype.missionOK = function(){
		return this.countShips() >= 2 && this.mission[0] === 0;
	};
	
	KC3Fleet.prototype.lowestMorale = function(){
		return this.shipsUnescaped().reduce(
			(moralePre, ship) => Math.min(moralePre, ship.morale), 100);
	};
	
	KC3Fleet.prototype.isOnExped = function(){
		return this.fleetId > 1 && !!this.mission && this.mission[0] > 0;
	};
	
	KC3Fleet.prototype.highestRepairTimes = function(akashiReduce){
		var highestDocking = 0,
			highestAkashi = 0;
		
		this.shipsUnescaped().forEach(shipData => {
			var myRepairTime = shipData.repairTime();
			if(akashiReduce && shipData.akashiMark){
				myRepairTime.akashi -=
					Math.hrdInt('floor', PlayerManager.akashiRepair.getElapsed(),3,1) ||
					0;
			}
			if(myRepairTime.docking > highestDocking){ highestDocking = myRepairTime.docking; }
			if(myRepairTime.akashi > highestAkashi){ highestAkashi = myRepairTime.akashi; }
		});
		
		return {
			docking: highestDocking,
			akashi: highestAkashi,
			akashiCheck: [
				PlayerManager.akashiRepair.isRunning(),
				PlayerManager.akashiRepair.canDoRepair(),
				KC3AkashiRepair.hasRepairFlagship(this)
			],
		};
	};
	
	
	/*--------------------------------------------------------*/
	/*-------------------[ ELOS FUNCTIONS ]-------------------*/
	/*--------------------------------------------------------*/
	
	/* eLoS
	Get eLoS based on config
	------------------------------------*/
	KC3Fleet.prototype.eLoS = function(){
		switch(ConfigManager.elosFormula){
			case 1: return this.eLos1();
			case 2: return this.eLos2();
			case 4: return this.eLos4();
			default: return this.eLos3();
		}
	};
	
	/* LoS : Fitted
	Sum of all Ship LoS in the fleet WITH their equipment
	------------------------------------*/
	KC3Fleet.prototype.eLos1 = function(){
		var self = this;
		return Array.apply(null, {length: 6})
			.map(Number.call, Number)
			.map(function(x){
				return (!self.ship(x).didFlee)? self.ship(x).ls[0] : 0;
			})
			.reduce(function(x,y){return x+y;});
	};
	
	/* LoS : "Old Formula"
	= Recon LoS×2 + Radar LoS + v(Fleet total LoS - Recon LoS - Radar LoS)
	------------------------------------*/
	KC3Fleet.prototype.eLos2 = function(){
		var PlaneLoS = 0;
		var RadarLoS = 0;
		
		function ConsiderShip(shipData){
			if(shipData.rosterId === 0) return false;
			if(shipData.didFlee) return false;
			Array.apply(null, {length: 4})
				.map(Number.call, Number)
				.forEach(function(x){ if(shipData.items[x]>-1) { ConsiderEquipment(shipData.equipment(x)); }});
		}
		
		function ConsiderEquipment(itemData){
			if(itemData.itemId === 0) return false;
			if( itemData.master().api_type[1] == 7){ PlaneLoS += itemData.master().api_saku; }
			if( itemData.master().api_type[1] == 8){ RadarLoS += itemData.master().api_saku; }
		}
		
		var self = this;
		Array.apply(null, {length: 6})
			.map(Number.call, Number)
			.forEach(function(x){ConsiderShip(self.ship(x));});
		
		return (PlaneLoS*2) + RadarLoS + Math.sqrt( this.eLos1() -  PlaneLoS - RadarLoS );
	};
	
	/* LoS : "New Formula"
	= Dive Bomber LoS x (1.04) + Torpedo Bomber LoS x (1.37) + Carrier-based Recon Plane LoS x (1.66) + Recon Seaplane LoS x (2.00) + Seaplane Bomber LoS x (1.78) + Small Radar LoS x (1.00) + Large Radar LoS x (0.99) + Searchlight LoS x (0.91) + v(base LoS of each ship) x (1.69) + (HQ Lv. rounded up to the next multiple of 5) x (-0.61)
	------------------------------------*/
	KC3Fleet.prototype.eLos3 = function(){
		var dive = 0, torp = 0, cbrp = 0, rspl = 0, splb = 0, smrd = 0, lgrd = 0, srch = 0;
		var nakedLos = 0;
		
		function ConsiderShip(shipData){
			if(shipData.rosterId === 0) return false;
			if(shipData.didFlee) return false;
			nakedLos += Math.sqrt( shipData.nakedLoS() );
			Array.apply(null, {length: 4})
				.map(Number.call, Number)
				.forEach(function(x){ if(shipData.items[x]>-1) { ConsiderEquipment(shipData.equipment(x)); }});
		}
		
		function ConsiderEquipment(itemData){
			if(itemData.itemId === 0 || itemData.masterId === 0) return false;
			switch( itemData.master().api_type[2] ){
				case  7: dive += itemData.master().api_saku; break;
				case  8: torp += itemData.master().api_saku; break;
				case  9: cbrp += itemData.master().api_saku; break;
				case 10: rspl += itemData.master().api_saku; break;
				case 11: splb += itemData.master().api_saku; break;
				case 12: smrd += itemData.master().api_saku; break;
				case 13: lgrd += itemData.master().api_saku; break;
				case 29: srch += itemData.master().api_saku; break;
				default: break;
			}
		}
		
		var self = this;
		Array.apply(null, {length: 6})
			.map(Number.call, Number)
			.forEach(function(x){
				ConsiderShip(self.ship(x));});
		
		var total = ( dive * 1.0376255 )
			+ ( torp * 1.3677954 )
			+ ( cbrp * 1.6592780 )
			+ ( rspl * 2.0000000 )
			+ ( splb * 1.7787282 )
			+ ( smrd * 1.0045358 )
			+ ( lgrd * 0.9906638 )
			+ ( srch * 0.9067950 )
			+ ( nakedLos * 1.6841056 )
			+ ( (Math.floor(( PlayerManager.hq.level + 4) / 5) * 5) * -0.6142467 );
		return total;
	};

	/**
	 * Implementation of effective LoS : "Formula 33".
	 * @see http://kancolle.wikia.com/wiki/Line_of_Sight
	 * @see http://ja.kancolle.wikia.com/wiki/%E3%83%9E%E3%83%83%E3%83%97%E7%B4%A2%E6%95%B5
	 * @param {number} nodeDivaricatedFactor - the weight of the equipment sum part, 1 by default.
	 *        For now: 2-5(H,I):x1, 6-2(F,H)/6-3(H):x3, 3-5(G)/6-1(E,F):x4
	 * @return {number} F33 eLoS value of this fleet.
	 */
	KC3Fleet.prototype.eLos4 = function(nodeDivaricatedFactor = 1){
		// Known verified special multipliers applied to these types of equipment,
		// ID refer to KCSAPI: start2/api_mst_slotitem_equiptype, slotitem.api_type[2]
		const multipliers = {
			8 : 0.8, // Carrier-Based Torpedo Bomber
			9 : 1.0, // Carrier-Based Reconnaissance Aircraft
			10: 1.2, // Reconnaissance Seaplane
			11: 1.1, // Seaplane Bomber
			58: 0.8, // Jet Torpedo Bomber (reserved)
			59: 1.0, // Jet Reconnaissance Aircraft (reserved)
			94: 1.0  // Carrier-Based Reconnaissance Aircraft (II) (reserved)
		};
		// without verified data, assume other items with LoS stat are using this:
		const defaultMultiplier = 0.6;

		var total = 0;
		var emptyShipSlot = 0;

		// iterate all ship slots, even some are empty
		this.ships.map((rid, i) => this.ship(i)).forEach(shipObj => {
			// count for empty slots or ships retreated
			if(shipObj.isDummy() || shipObj.didFlee) {
				emptyShipSlot += 1;
			} else {
				// sum ship's naked los
				total += Math.sqrt(shipObj.nakedLoS());

				// iterate ship's equipment including ex-slot
				let equipTotal = 0;
				shipObj.equipment(true).forEach(gearObj => {
					if (gearObj.exists()) {
						const itemType = gearObj.master().api_type[2];
						const itemLos = gearObj.master().api_saku;
						const multiplier = multipliers[itemType] || defaultMultiplier;
						// only item with los stat > 0 will be summed
						// although some items are not equippable by ship, eg: LBAA
						if (itemLos > 0) {
							equipTotal += multiplier * (itemLos + gearObj.losStatImprovementBonus());
						}
					}
				});
				total += nodeDivaricatedFactor * equipTotal;
			}
		});

		// player hq level adjustment
		total -= Math.ceil(0.4 * PlayerManager.hq.level);
		// empty ship slot adjustment
		total += 2 * emptyShipSlot;

		return total;
	};
	
	/*--------------------------------------------------------*/
	/*--------------[ OTHER MECHANISM INFERENCE ]-------------*/
	/*--------------------------------------------------------*/
	
	/**
	 * Look up for Katori Class Exp Bonus from current Fleet.
	 * @return exp bonus modifier, default is 1.0
	 * @see http://wikiwiki.jp/kancolle/?%B1%E9%BD%AC#v657609b
	 */
	KC3Fleet.prototype.lookupKatoriClassBonus = function() {
		var ctBonusTable = [
			// ~9,  ~29,  ~59,  ~99, ~165?
			[ 1.0,  1.0,  1.0,  1.0,  1.0], // No CT
			[1.05, 1.08, 1.12, 1.15, 1.20], // CT x 1 as flagship
			[1.03, 1.05, 1.07, 1.10, 1.15], // CT x 1
			[1.10, 1.13, 1.16, 1.20, 1.25], // CT x 2, 1 flagship
			[1.04, 1.06, 1.08, 1.12, 1.175] // CT x 2
		];
		var fsCtLevel = 0, maxCtLevel = 0, katoriIndex = 0;
		this.ship(function(rid, idx, ship){
			if(ship.master().api_stype == 21){
				if(ship.level > maxCtLevel) maxCtLevel = ship.level;
				if(idx === 0){
					katoriIndex = 1;
					fsCtLevel = ship.level;
				} else {
					katoriIndex = katoriIndex < 3 ?
						katoriIndex + 2 : katoriIndex;
				}
			}
		});
		if(katoriIndex === 3) maxCtLevel = fsCtLevel;
		var levelIndex =
			(maxCtLevel < 10)  ? 0 :
			(maxCtLevel < 30)  ? 1 :
			(maxCtLevel < 60)  ? 2 :
			(maxCtLevel < 100) ? 3 :
			4;
		return ctBonusTable[katoriIndex][levelIndex] || 1;
	};

	/**
	 * Estimate base XP gained in PvP battle.
	 * @param levels of first two ships - if omitted, use the ones of this fleet
	 * @param ctBonus - exp multiplier of CT (Katori-class) bonus, default is 1
	 * @return variant exp values by battle ranks
	 * @see http://wikiwiki.jp/kancolle/?%B1%E9%BD%AC#v657609b
	 */
	KC3Fleet.prototype.estimatePvpBaseExp = function(
		firstShipLevel = this.ship(0).level,
		secondShipLevel = this.ship(1).level,
		ctBonus = 1
	) {
		var baseExp = 3 + Math.floor(
			KC3Meta.expShip(firstShipLevel)[1] / 100 +
			KC3Meta.expShip(secondShipLevel)[1] / 300
		);
		if(baseExp > 500){
			baseExp = Math.floor(500 + Math.sqrt(baseExp - 500));
		}
		const baseExpWoCT = Math.floor(baseExp * 1.2),
			baseExpS  = Math.floor(Math.floor(baseExp * 1.2) * ctBonus),
			baseExpAB = Math.floor(Math.floor(baseExp * 1.0) * ctBonus),
			baseExpC  = Math.floor(Math.floor(baseExp * 0.64) * ctBonus),
			baseExpD  = Math.floor(Math.floor(Math.floor(baseExp * 0.56) * 0.8) * ctBonus),
			// rank E is not verified by sufficient sample data
			baseExpE  = Math.floor(Math.floor(baseExp * 0.401) * ctBonus);
		return {
			levelFlagship: firstShipLevel,
			level2ndship: secondShipLevel,
			ctBonus: ctBonus,
			base: baseExp,
			sIngame: baseExpWoCT,
			s: baseExpS,
			a: baseExpAB,
			b: baseExpAB,
			c: baseExpC,
			d: baseExpD,
			e: baseExpE
		};
	};

	/**
	 * Predicts PvP opponent's battle formation.
	 * @param opponentFleetShips - master ID array of opponent fleet, no -1 placeholders
	 * @return predicted formation ID
	 * @see http://wikiwiki.jp/kancolle/?%B1%E9%BD%AC#m478a4e5
	 */
	KC3Fleet.prototype.predictOpponentFormation = function(opponentFleetShips) {
		// Convert fleet ships to master IDs, remove -1 elements
		var playerFleetShips = this.ships
			.filter(function(v){return v > 0;})
			.map(function(v){return KC3ShipManager.get(v).masterId;});
		var playerFlagshipMst = KC3Master.ship(playerFleetShips[0]);
		var opponentFlagshipMst = KC3Master.ship(opponentFleetShips[0]);
		var playerSubmarineCount = playerFleetShips.reduce(function(acc, v){
			return acc + ([13,14].indexOf(KC3Master.ship(v).api_stype) > -1 & 1);
		}, 0);
		// 1st priority: flagship is SS/SSV and SS/SSV > 1 in our fleet, ships >= 4 of enemy fleet
		if(opponentFleetShips.length >= 4
			&& [13, 14].indexOf(playerFlagshipMst.api_stype) > -1
			&& playerSubmarineCount > 1){
			return 5; // Line Abreast
		}
		// flagship is SS/SSV and ships >= 4 in enemy fleet
		if(opponentFleetShips.length >= 4
			&& [13, 14].indexOf(opponentFlagshipMst.api_stype) > -1){
			return 4; // Echelon
		}
		// flagship is CV/CVL/AV/CVB and ships >= 5 in enemy fleet
		if(opponentFleetShips.length >= 5
			&& [7, 11, 16, 18].indexOf(opponentFlagshipMst.api_stype) > -1){
			return 3; // Diamond
		}
		return 1; // Line Ahead
	};

	/**
	 * Estimate possible type of support expedition from current composition.
	 * @return the same value defined by `api_support_flag`,
	 *         1=Aerial Support, 2=Support Shelling, 3=Long Range Torpedo Attack, 4=Anti-Sub Support
	 *         0=Unmet expedition prerequisite
	 * @see http://kancolle.wikia.com/wiki/Expedition/Support_Expedition
	 */
	KC3Fleet.prototype.estimateSupportType = function() {
		// Support expedition needs 2 DD at least
		if(this.countShipType(2) < 2) {
			return 0;
		}
		// Check for Torpedo Support
		// No BB/CA/CV(L/B) and BBV/CAV/AV/LHA/AO count less than 2
		if(this.countShipType([5, 8, 9, 7, 11, 18]) === 0 && this.countShipType([6, 10, 16, 17, 22]) < 2) {
			return 3;
		}
		// Check for Support Shelling
		// If BB/CA is present and less than 2 CV(L/B)/LHA/AV
		// Decide if its shelling or torp support based on BB(V)/CA(V) count
		if(this.countShipType([5, 8, 9]) > 0 && this.countShipType([7, 11, 18, 16, 17]) < 2) {
			if(this.countShipType([8, 9, 10]) >= 2 || this.countShipType([5, 6, 8, 9, 10]) >= 4) {
				return 2;
			}
			else {
				return 3;
			}
		}
		// If no criteria is met, remaining should be Aerial Support
		return 1;
	};

	/**
	 * Estimate possibly activated searchlight from current fleet ships.
	 * Night battle only 1 searchlight of current fleet can be activated,
	 * the rules and priorities are following:
	 * @see http://wikiwiki.jp/kancolle/?%C1%F5%C8%F7%B9%CD%BB%A1#c3e3dd4e
	 *      - priority: Large > Small, look up from flagship to escorts.
	 * @see https://twitter.com/KanColle_STAFF/status/438561513339498496
	 *      - ship HP < 2 does not use searchlight.
	 * @return a tuple: [ship index, equipment index], both starts from 0.
	 *         return false if no searchlight can be used.
	 */
	KC3Fleet.prototype.estimateUsableSearchlight = function() {
		const searchLightType1Id = 18,
			smallSlType2Id = 29, largeSlType2Id = 42;
		// for now only 1 item implemented for each type
		const normalSlMstId = 74, type96LargeSlMstId = 140;
		const result = [-1, -1];
		const lookupSearchlight = type2Id => {
			this.ship().find((ship, shipIndex) => {
				if(ship.hp[0] > 1 && !ship.didFlee) {
					const equipMap = ship.findEquipmentByType(2, type2Id);
					const equipIndex = equipMap.indexOf(true);
					if(equipIndex >= 0) {
						result[0] = shipIndex;
						result[1] = equipIndex;
						// stop on first occurring
						return true;
					}
				}
				return false;
			});
			// return true if no any found
			return result.every(v => v === -1);
		};
		// Lookup Large Searchlight first
		if(lookupSearchlight(largeSlType2Id)) {
			// then lookup Small Searchlight
			lookupSearchlight(smallSlType2Id);
		}
		return result.every(v => v === -1) ? false : result;
	};

	/*--------------------------------------------------------*/
	/*----------------------[ DATA EXPORT ]-------------------*/
	/*--------------------------------------------------------*/

	/* SORTIE JSON
	Used for recording sorties on indexedDB
	Generate fleet summary object without referential data (all masterId)
	Data must be recorded on the state of sortie execution, thus no reference
	Stats not recorded here can be computed by master stats + kyouka (mod)
	------------------------------------*/
	KC3Fleet.prototype.sortieJson = function(){
		if(this.active){
			var ReturnObj = [];
			var self = this;
			$.each(this.ships, function(index, rosterId){
				if(rosterId > 0){
					var ship = self.ship(index);
					var nakedStats = ship.nakedStats();
					ReturnObj.push({
						mst_id: ship.masterId,
						level: ship.level,
						morale: ship.morale,
						stats: {
							ev: nakedStats.ev,
							ls: nakedStats.ls,
							as: nakedStats.as
						},
						kyouka: ship.mod,
						equip: [
							ship.equipment(0).masterId,
							ship.equipment(1).masterId,
							ship.equipment(2).masterId,
							ship.equipment(3).masterId,
							ship.exItem().masterId
						],
						stars: [
							ship.equipment(0).stars,
							ship.equipment(1).stars,
							ship.equipment(2).stars,
							ship.equipment(3).stars,
							ship.exItem().stars
						],
						ace: [
							ship.equipment(0).ace,
							ship.equipment(1).ace,
							ship.equipment(2).ace,
							ship.equipment(3).ace,
							ship.exItem().ace
						]
					});
				}
			});
			return ReturnObj;
		}else{
			return {};
		}
	};

	KC3Fleet.prototype.deckbuilder = function() {
		var result = {};
		this.ship().map( function(x,i) {
			result["s".concat(i+1)] = x.deckbuilder();
		});
		return result;
	};

})();
