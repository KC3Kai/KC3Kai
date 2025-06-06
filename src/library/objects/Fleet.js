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
		this.repairTimeMod = 1;

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
			},
			shipsToEscape: {
				value: [],
				enumerable: false,
				configurable: false,
				writable: true
			},
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
		this.fastFleet = data.fastFleet;
		this.minSpeed = data.minSpeed;
		this.repairTimeMod = data.repairTimeMod;
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
	
	/**
	 * Use this to reduce a `ship.didFlee` condition if ship position not concerned.
	 * @return filtered ship object list not contain escaped (didFlee, or even sunk) ships.
	 */
	KC3Fleet.prototype.shipsUnescaped = function(){
		if(this.shipsToEscape.length) {
			return this.ship().filter(ship =>
				! (ship.isAbsent() || this.shipsToEscape.includes(ship.rosterId))
			);
		}
		return this.ship().filter(ship => !ship.isAbsent());
	};
	
	/**
	 * Set ship rosterId to assume her retreating for some reasons,
	 * so all ship iterations via `shipUnescaped` will not count her.
	 * Don't forget to reset this list to empty after some calculations.
	 * @param rosterId - 1 or more ship ID(s) to be omitted
	 */
	KC3Fleet.prototype.setEscapeShip = function(...rosterIds){
		this.shipsToEscape.length = 0;
		this.shipsToEscape.push(...rosterIds);
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

	/** Mark the fleet's ships as being repaired (or not)
	 *  Called when the fleet changes, or their equipment does
	 */
	KC3Fleet.prototype.updateAkashiRepairDisplay = function () {
		var repairSlots = this._getRepairSlots();
		this.ship(this._updateRepairStatus(repairSlots));
	};

	/** @return true if fleet flagship can start homeport anchorage repair */
	KC3Fleet.prototype._canDoRepair = function (flagship) {
		return this._isRepairShip(flagship) && !flagship.isStriped() && flagship.isFree();
	};

	/** @return true if ship is Akashi-class or other AR (Asahi Kai) with atleast one crane */
	KC3Fleet.prototype._isRepairShip = function (ship) {
		return ship.master().api_stype === 19
			&& (this._isAkashi(ship) || this._hasRepairFacility(ship));
	};
	KC3Fleet.prototype._isAkashi = function (ship) {
		return ship.master().api_ctype === 49;
	};
	KC3Fleet.prototype._isAsahiKai = function (ship) {
		return ship.masterId === 958;
	};
	KC3Fleet.prototype._hasRepairFacility = function (ship) {
		return ship.hasEquipmentType(2, 31);
	};

	/**
	 * Asahi Kai can be combined with Akashi in first 2 slots, and only Akashi-class has 2 embedded cranes.
	 * https://twitter.com/Schmeichel20/status/1703728038700278122
	 * @return the number of ships that will be targeted by Akashi/AsahiKai repair
	 */
	KC3Fleet.prototype._getRepairSlots = function () {
		var flagship = this.ship(0), ship2nd = this.ship(1);
		if (!this._canDoRepair(flagship)) {
			return 0;
		}
		var cranesEquipped = 0;
		[flagship, ship2nd].forEach(ship => {
			if(this._canDoRepair(ship)) {
				cranesEquipped += ship.countEquipmentType(2, 31);
				cranesEquipped += (this._isAkashi(ship) & 1) * 2;
			}
		});
		return cranesEquipped;
	};

	/** @return a function to pass to this.ship() that will update the ships' repair status */
	KC3Fleet.prototype._updateRepairStatus = function (repairSlotCount) {
		return function (rosterId, position, ship) {
			var inRange = position < repairSlotCount;
			ship.akashiMark = inRange && !ship.isStriped() && ship.isFree();
		};
	};

	/*--------------------------------------------------------*/
	/*------------------[ FLEET ATTRIBUTES ]------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.countShips = function(excludeEscaped = false){
		return excludeEscaped ? this.shipsUnescaped().length :
			(this.ships.indexOf(-1) + 1 || (this.ships.length + 1)) - 1;
	};
	
	KC3Fleet.prototype.isStrikingForce = function(){
		// currently Striking Force can be only indicated by 7th ship, and only fleet #3 implemented in-game.
		return this.countShips(false) > 6;
	};
	
	KC3Fleet.prototype.isStrikingForceOpened = function(){
		// if Striking Force is enabled by fleet #3, `api_ship` will be a 7-elements array.
		return this.ships.length > 6;
	};
	
	KC3Fleet.prototype.totalLevel = function(){
		return this.ship().map(function(x){return x.level;})
			.reduce(function(x,y){return x+y;},0);
	};
	
	KC3Fleet.prototype.totalStats = function(includeEquip = true, includeImproveType = false, forExped = false, forRadarchart = false, includeRibbon = true){
		const stats = {
			level: 0, morale: 0, hp: 0,
			fp: 0, tp: 0, aa: 0, ar: 0,
			ev: 0, as: 0, ls: 0, lk: 0,
			ht: 0
		};
		this.ship((rid, idx, ship) => {
			// always includes modded/marriage bonus values
			const ss = includeEquip && !forExped ? {
				hp: ship.hp[1],
				fp: ship.fp[0], tp: ship.tp[0], aa: ship.aa[0], ar: ship.ar[0],
				ev: ship.ev[0], as: ship.as[0], ls: ship.ls[0], lk: ship.lk[0],
				ht: ship.equipmentTotalStats("houm")
			} : ship.nakedStats();
			if (!ss || ship.isDummy()) return;
			if (includeRibbon) {
				// special stats from ribbons since 2023-07-07
				const sp = ship.statsSp();
				Object.keys(sp).forEach(stat => {
					if (sp !== "type") ss[stat] += sp[stat];
				});
			}
			if (!includeEquip) {
				// no accuracy if excludes equipment
				ss.ht = 0;
				// still includes modded/married hp & luck
				ss.hp = ship.hp[1];
				ss.lk = ship.lk[0];
			} else if (!!forExped) {
				// expeds with aircraft count partial stats, details see:
				ss.fp += ship.expedEquipmentTotalStats("houg");
				ss.tp += ship.expedEquipmentTotalStats("raig");
				ss.aa += ship.expedEquipmentTotalStats("tyku");
				ss.ar += ship.expedEquipmentTotalStats("souk");
				ss.ev += ship.expedEquipmentTotalStats("houk");
				ss.as += ship.expedEquipmentTotalStats("tais");
				ss.ls += ship.expedEquipmentTotalStats("saku");
				ss.hp = ship.hp[1];
				ss.lk = ship.lk[0];
			}
			ss.level = ship.level;
			ss.morale = ship.morale;
			if (includeImproveType) {
				ship.equipment(true).filter(g => g.exists()).forEach(gear => {
					const bonus = {
						fp: gear.attackPowerImprovementBonus(includeImproveType === "exped" ? "exped" : "fire"),
						tp: includeImproveType === "exped" ? 0 : gear.attackPowerImprovementBonus("torpedo"),
						aa: gear.aaStatImprovementBonus(includeImproveType),
						as: gear.aswStatImprovementBonus(includeImproveType),
						ev: gear.evaStatImprovementBonus(includeImproveType),
						ls: gear.losStatImprovementBonus(includeImproveType),
						ht: gear.accStatImprovementBonus(includeImproveType),
					};
					Object.keys(bonus).forEach(key => ss[key] += bonus[key]);
				});
			}
			Object.keys(stats).forEach(stat => {
				stats[stat] += ss[stat] || 0;
			});
		});
		if (!!forRadarchart) {
			// see main.js#Rader._model.prototype._getParam
			const ingameGetParam = function (statsTotal, shipAmount) {
				if (shipAmount <= 0) return 0;
				var avg1 = Math.round(statsTotal / shipAmount);
				if (1 == shipAmount) return avg1;
				var avg2 = Math.sqrt(shipAmount - 1);
				return avg2 *= avg1, avg1 + Math.round(avg2);
			};
			const shipAmount = this.countShips();
			Object.keys(stats).forEach(stat => {
				stats[stat] = ingameGetParam(stats[stat], shipAmount);
			});
		}
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
	// https://wikiwiki.jp/kancolle/%E8%A3%85%E5%82%99%E6%9C%80%E5%A4%A7%E5%80%A4/%E5%A4%A7%E7%99%BA%E7%B3%BB%E8%A3%85%E5%82%99%E6%97%A9%E8%A6%8B%E8%A1%A8/%E3%83%86%E3%83%BC%E3%83%96%E3%83%AB
	// as of Dec 23th, 2016
	KC3Fleet.prototype.calcLandingCraftInfo = function() {
		const self = this;
		// use addImprove() to update this value instead of modifying it directly
		var improveCount = 0;
		function addImprove(stars) {
			if (!stars || stars <= 0)
				return;
			improveCount += stars;
		}

		// amount of bonus equipment
		var normalCount = 0;
		var t89Count = 0;
		var t2Count = 0;
		var t4baseCount = 0, t4kaiCount = 0;
		var tokuCount = 0;
		var abCount = 0;
		var armedCount = 0;
		var panzerCount = 0;
		var tokuHoni1Count = 0;
		// amount of bonus ships 
		var bonusShipCount = 0;
		this.ship((shipRid, shipIdx, shipObj) => {
			if (shipObj.isDummy()) return;
			// for now this can only be applied to Kinu Kai Ni (master id 487)
			if (shipObj.masterId === 487) bonusShipCount += 1;
			// AB daihatsu on ex-slot counted either
			shipObj.equipment(true).forEach(gearObj => {
				if (gearObj.isDummy()) return;
				switch (gearObj.masterId) {
					case 68: // normal landing craft
						normalCount += 1;
						addImprove(gearObj.stars);
					break;
					case 166: // T89 force
						t89Count += 1;
						addImprove(gearObj.stars);
					break;
					case 167: // T2 tank
						t2Count += 1;
						addImprove(gearObj.stars);
					break;
					case 525: // T4 tank
						t4baseCount += 1;
						addImprove(gearObj.stars);
					break;
					case 526: // T4 tank kai
						t4kaiCount += 1;
						addImprove(gearObj.stars);
					break;
					case 193: // Toku landing craft
						tokuCount += 1;
						addImprove(gearObj.stars);
					break;
					// [230] Toku +11th tank not counted
					// [355] M4A1 DD not counted
					case 408: // Soukoutei (Armored Boat Class)
						abCount += 1;
						addImprove(gearObj.stars);
					break;
					case 409: // Armed Daihatsu
						armedCount += 1;
						addImprove(gearObj.stars);
					break;
					case 436: // Panzer II/North African Spec
					// [482] Panzer III/North African Spec not counted
					// [514] Panzer III Ausf.J not counted
						panzerCount += 1;
						addImprove(gearObj.stars);
					break;
					case 449: // Toku DLC + Type 1 Gun Tank
						tokuHoni1Count += 1;
						addImprove(gearObj.stars);
					// [494] Toku DLC + Chi-Ha not counted
					// [495] Toku DLC + Chi-Ha Kai not counted?
					break;
				}
			});
		});
		// without cap
		const basicBonus= 0.05 * (normalCount + tokuCount + t4kaiCount + bonusShipCount)
						+ 0.02 * (t89Count + abCount + panzerCount + tokuHoni1Count)
						+ 0.03 * armedCount
						+ 0.04 * t4baseCount
						+ 0.01 * t2Count;
		// cap at 20%
		// "B1" in the formula (see comment link of this function)
		const cappedBasicBonus = Math.min(0.2, basicBonus);
		// "B2" in the formula, newer data on toku cap and synergy with normal
		// https://wikiwiki.jp/kancolle/%E7%89%B9%E5%A4%A7%E7%99%BA%E5%8B%95%E8%89%87
		const tokuCap = tokuCount > 3 ?
			[0.054, 0.056, 0.058, 0.059][normalCount] || 0.06 :
			[0.050, 0.050, 0.052, 0.054][normalCount] || 0.054;
		const tokuBonus = Math.min(tokuCap, 0.02 * tokuCount);
		const landingCraftCount = [normalCount, t89Count, t2Count, t4baseCount, t4kaiCount, tokuCount,
			abCount, armedCount, panzerCount, tokuHoni1Count].sumValues();
		// "Bstar" in the formula
		const improveBonus = landingCraftCount > 0
			? 0.01 * improveCount * cappedBasicBonus / landingCraftCount
			: 0.0;

		// note that result might be inaccurate if the floor is taken *after* summing these factors up.
		// flooring should be taken before summing, on each part:
		//   Math.floor(baseRsc * GSmod) + Math.floor(baseRsc * GSmod * basicBonus) + Math.floor(baseRsc * GSmod * tokuBonus)
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
		return this.shipsUnescaped().map(ship => ship.fighterPower()).sumValues();
	};
	
	KC3Fleet.prototype.fighterVeteran = function(){
		return this.shipsUnescaped().map(ship => ship.fighterVeteran()).sumValues();
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
	 * @see https://wikiwiki.jp/kancolle/%E8%88%AA%E7%A9%BA%E6%88%A6#s1d9a838
	 */
	KC3Fleet.prototype.contactTriggerRate = function(dispSeiku = 1){
		// slightly different values with wiki inferred from KCKai algorithm: 1/(70 - (4-dispSeiku) * 15)/0.04
		const airControlModifiers = [0, 1, 25/40, 25/55, 0];
		var rate = 0;
		this.shipsUnescaped().forEach(ship => {
			rate += ship.equipment().map(
				(gear, idx) => gear.isContactAircraft(false) ?
					(0.04 * (gear.master().api_saku || 0) * Math.sqrt(ship.slotSize(idx))) : 0
			).sumValues();
		});
		// Always has '1 chance' to start contact, irrelevant to LoS and slotsize, because `0 < 0` is false (true to start) for `adjustedLos < randInt(rateBySeiku)` condition in KCKai, see: `Server_Controllers.BattleLogic/Exec_AirBattle.cs#getSyokusetuInfo#L308`
		// In fact, only Torpedo Bomber equipped about 4% chance to contact, for LBAS either:
		// https://twitter.com/noratako5/status/845572079952941056
		// https://twitter.com/wowakayotareso/status/882276107063513088
		return (rate || 0.04) * (airControlModifiers[dispSeiku] || 0);
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
	 * @see https://wikiwiki.jp/kancolle/%E8%88%AA%E7%A9%BA%E6%88%A6#s1d9a838
	 */
	KC3Fleet.prototype.contactSelectionChanceTable = function(dispSeiku = 1){
		// slightly different values with wiki inferred from KCKai algorithm: 1/(20 - (4-dispSeiku) * 2)
		const airControlModifiers = [0, 1/14, 1/16, 1/18, 0];
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
						slotSize: ship.slotSize(gearIdx),
						// KCKai only adds planes in a non-zero slot to selection list
						// LoS improvement taken into account, but any other modifier unknown for browser
						rate: ship.slotSize(gearIdx) > 0 ? (
							((gearMaster.api_saku || 0) + gear.losStatImprovementBonus("contact"))
							* (airControlModifiers[dispSeiku] || 0)
						) : 0
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
	 * Rolls for every night recon planes equipped by all ships in fleet, get final success rate by total failure rate.
	 * @param dispSeiku - from `api_disp_seiku`, default is 1 AS+.
	 * @return final night contact change for this fleet, regardless of CF main fleet. undefined for fleet without any night recon.
	 */
	KC3Fleet.prototype.nightContactSuccessChance = function(dispSeiku = 1){
		// dispSeiku not affect rate value, but for AP and AI day start battle, cannot be triggered at all, the same with day contact.
		// it can be triggered for night start battle. it can be triggered under AP for PvP battle.
		const airControlModifiers = [(KC3SortieManager.isPvP() ? 1 : 0), 1, 1, 1, 0];
		const nightContactPlanes = this.nightContactSelectionChanceTable();
		if(nightContactPlanes.length) {
			const failRate = nightContactPlanes.map(p => p.rate * (airControlModifiers[dispSeiku] || 0))
				.reduce((acc, v) => acc * (1 - v), 1);
			return 1 - failRate;
		} else return;
	};

	/**
	 * Night recon contact chance for every night recon planes in this fleet.
	 * @see https://wikiwiki.jp/kancolle/%E4%B9%9D%E5%85%AB%E5%BC%8F%E6%B0%B4%E4%B8%8A%E5%81%B5%E5%AF%9F%E6%A9%9F%28%E5%A4%9C%E5%81%B5%29#u4bb049a
	 */
	KC3Fleet.prototype.nightContactSelectionChanceTable = function(){
		const contactPlaneList = [];
		// Tests confirmed: escaped ships still can be rolled on CF escort fleet, sunk ships unknown, but PvP sunk can
		this.ship().forEach((ship, shipIdx) => {
			ship.equipment((itemId, gearIdx, gear) => {
				if(gear.isNightContactAircraft()) {
					const gearMaster = gear.master();
					contactPlaneList.push({
						itemId: itemId,
						masterId: gear.masterId,
						icon: gearMaster.api_type[3],
						stars: gear.stars || 0,
						accurcy: gearMaster.api_houm || 0,
						shipOrder: shipIdx,
						shipMasterId: ship.masterId,
						shipLevel: ship.level,
						slotSize: ship.slotSize(gearIdx),
						// No effect from LoS proficiency/improvement/visible bonus found,
						// and this PSVita KCKai formula slightly different with wiki's.
						rate: ship.slotSize(gearIdx) > 0 ? Math.floor(Math.sqrt(gearMaster.api_saku || 0) * Math.sqrt(ship.level)) / 25 : 0
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

	KC3Fleet.prototype.supportPower = function(isCritical = false){
		const battleConds = KC3Calc.collectBattleConditions();
		return this.ship().map(ship => {
			let power = ship.supportShellingPower();
			if(ConfigManager.powerCapApplyLevel >= 1) {
				({power} = ship.applyPrecapModifiers(power, "SupportShelling",
					battleConds.engagementId, battleConds.formationId));
			}
			if(ConfigManager.powerCapApplyLevel >= 2) {
				({power} = ship.applyPowerCap(power, "Day", "Support"));
			}
			if(ConfigManager.powerCapApplyLevel >= 3) {
				({power} = ship.applyPostcapModifiers(power, "SupportShelling",
					undefined, 0, isCritical));
			}
			return Math.floor(power);
		}).sumValues();
	};

	KC3Fleet.prototype.supportAirstrikePower = function(isCritical = false){
		const totalPower = [0, 0, false];
		this.ship().forEach(ship => {
			const shipPower = ship.supportAirstrikePower(isCritical);
			totalPower[0] += shipPower[0];
			totalPower[1] += shipPower[1];
			totalPower[2] = totalPower[2] || shipPower[2];
		});
		return totalPower;
	};

	KC3Fleet.prototype.supportAntisubPower = function(isCritical = false){
		const totalPower = [0, 0, 0];
		this.ship().forEach(ship => {
			const shipPower = ship.supportAntisubPower(isCritical);
			totalPower.forEach((v, i) => {
				totalPower[i] = v + (shipPower[i] || 0);
			});
		});
		return totalPower;
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

	/**
	 * Calculate expedition cost of this fleet.
	 */ 
	KC3Fleet.prototype.calcExpeditionCost = function(expeditionId) {
		var KEC = PS["KanColle.Expedition.Cost"];
		var costPercent = KEC.getExpeditionCost(expeditionId);
		var expedMaster = KC3Master.mission(expeditionId);
		costPercent.fuel = costPercent.fuel || expedMaster.api_use_fuel;
		costPercent.ammo = costPercent.ammo || expedMaster.api_use_bull;
		var totalFuel = 0;
		var totalAmmo = 0;
		var self = this;
		$.each( this.ships, function(i, shipId) {
			if (shipId > 0) {
				var shipObj = self.ship(i);
				var cost = shipObj.calcResupplyCost( costPercent.fuel, costPercent.ammo, false, false, 0.4 );
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
			steel: 0,
			supportFlag: 0
		};
		totalCost.supportFlag = this.estimateSupportType();
		if(totalCost.supportFlag > 0) {
			const costPercent = {
				fuel: [0, 0.5, 0.5, 0.5, 0.5][totalCost.supportFlag] || 0,
				ammo: [0, 0.4, 0.8, 0.8, 0.4][totalCost.supportFlag] || 0
			};
			// for Aerial Support 0.4 ammo, a bug behaivor: old condition still used (CV/CVL/AV >= 3),
			// so if those ship types < 3 and CVB added for Aerial Support, ammo consumption will be 0.8
			$.each(this.ships, (i, shipId) => {
				if (shipId > 0) {
					const shipObj = this.ship(i);
					const cost = shipObj.calcResupplyCost(costPercent.fuel, costPercent.ammo, false, true, 0.5);
					totalCost.fuel += cost.fuel;
					totalCost.ammo += cost.ammo;
					totalCost.steel += cost.steel;
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
				const cost = shipObj.calcResupplyCost(-1, -1, true, true, 0);
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
			nightStartFuel: 0,
			nightStartAmmo: 0,
			aswFuel: 0,
			aswAmmo: 0,
			airRaidFuel: 0,
			airRaidAmmo: 0,
			ambushFuel: 0,
			ambushAmmo: 0,
			aswAirFuel: 0,
			aswAirAmmo: 0,
		};
		for(let i = 0; i < this.countShips(); i++) {
			const ship = this.ship(i);
			const maxFuel = ship.master().api_fuel_max,
			      maxAmmo = ship.master().api_bull_max;
			totalCost.fuel += Math.ceil(maxFuel * 0.2);
			totalCost.dayOnlyAmmo += Math.ceil(maxAmmo * 0.2);
			totalCost.nightBattleAmmo += Math.ceil(maxAmmo * 0.3);
			// 10% since Fall 2017 event
			totalCost.nightStartFuel += Math.floor(maxFuel * 0.1) || 1;
			totalCost.nightStartAmmo += Math.floor(maxAmmo * 0.1) || 1;
			// 8% fuel, no ammo since Fall 2017 event, 5%~10% for some normal world nodes
			totalCost.aswFuel += Math.floor(maxFuel * 0.08) || 1;
			totalCost.aswAmmo += 0;
			// 8% fuel -> 6% since Fall 2017 event, but 4% fuel, 8% ammo for World 6 since phase 2
			totalCost.airRaidFuel += Math.floor(maxFuel * 0.06) || 1;
			totalCost.airRaidAmmo += Math.floor(maxAmmo * 0.04) || 1;
			// 4% fuel, no ammo for radar ambush, 8% for PT imps since Winter 2019 event
			totalCost.ambushFuel += Math.floor(maxFuel * 0.04) || 1;
			totalCost.ambushAmmo += Math.floor(maxAmmo * 0.08) || 1;
			// 12% fuel, 6% ammo for anti sub & air support node since Spring 2023 event
			totalCost.aswAirFuel += Math.floor(maxFuel * 0.12) || 1;
			totalCost.aswAirAmmo += Math.floor(maxAmmo * 0.06) || 1;
		}
		return totalCost;
	};

	KC3Fleet.prototype.calcTpObtain = function(tankType, ...fleetArr) {
		const result = KC3Meta.tpObtained();
		const fleets = fleetArr.length < 1 ? [this] : fleetArr;
		fleets.forEach(fleet => {
			fleet.ship().forEach(ship => ship.obtainTP(result, tankType));
			result.floor();
		});
		if(result.embedded) result.add(KC3Meta.tpObtained({embedded:true}));
		return result;
	};

	KC3Fleet.prototype.calcRepairCost = function() {
		const totalCost = {
			fuel: 0,
			steel: 0,
		};
		for(let i = 0; i < this.countShips(); i++) {
			const ship = this.ship(i);
			const repairCost = ship.calcRepairCost();
			totalCost.fuel += repairCost.fuel;
			totalCost.steel += repairCost.steel;
		}
		return totalCost;
	};

	/*--------------------------------------------------------*/
	/*-----------------[ STATUS INDICATORS ]------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.hasShip = function(expected, pos, isExcludeEscaped = true){
		return this.ship().some((ship, index) => {
			if(isExcludeEscaped && ship.isAbsent()) {
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
	
	KC3Fleet.prototype.countShip = function(expected, isExclude = false, isExcludeEscaped = true){
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
	
	KC3Fleet.prototype.hasShipType = function(expected, pos, isExcludeEscaped = true){
		return this.ship().some((ship, index) => {
			if(isExcludeEscaped && ship.isAbsent()) {
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
	
	KC3Fleet.prototype.countShipType = function(expected, isExclude = false, isExcludeEscaped = true){
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
	
	KC3Fleet.prototype.hasShipClass = function(expected, pos, isExcludeEscaped = true){
		return this.ship().some((ship, index) => {
			if(isExcludeEscaped && ship.isAbsent()) {
				return false;
			}
			if(pos === undefined || pos === index) {
				if(typeof expected === "number"
					|| typeof expected === "string") {
					return expected == ship.master().api_ctype;
				} else if(Array.isArray(expected)) {
					return expected.indexOf(ship.master().api_ctype) > -1;
				}
			}
			return false;
		});
	};
	
	KC3Fleet.prototype.countShipClass = function(expected, isExclude = false, isExcludeEscaped = true){
		const ships = isExcludeEscaped ? this.shipsUnescaped() : this.ship();
		return ships.reduce((count, ship) => {
			if(Array.isArray(expected)) {
				return count + (1 & (isExclude !==
					(expected.indexOf(ship.master().api_ctype) > -1)));
			}
			return count + (1 & (isExclude !==
				(expected == ship.master().api_ctype)));
		}, 0);
	};
	
	KC3Fleet.prototype.hasTaiha = function(){
		return this.shipsUnescaped().some(ship => ship.isTaiha());
	};
	
	KC3Fleet.prototype.getTaihas = function(){
		var taihaIndexes = [];
		for(var index in this.ships){
			var ship = this.ship(index);
			if(ship.isTaiha() && !ship.isAbsent()){
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
	
	KC3Fleet.prototype.needsPlaneSupply = function(){
		return this.shipsUnescaped().some(ship => !ship.areAllSlotsFull());
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
			case 0: return this.eLos1();
			case 2: return this.eLos4(2);
			case 3: return this.eLos4(3);
			case 4: return this.eLos4(4);
			default: return this.eLos4();
		}
	};
	
	/**
	 * LoS simple sum
	 * @return sum of all ship displayed LoS in the fleet.
	 * @see #totalStats - sum LoS either
	 */
	KC3Fleet.prototype.eLos1 = function(){
		return this.shipsUnescaped().map(ship => ship.ls[0]).sumValues();
	};
	
	// Old formulas out of date, these function names reserved for researching.
	/**
	 * @return sum of sqrt(ship naked LoS)
	 */
	KC3Fleet.prototype.eLos2 = function(){
		return this.shipsUnescaped().map(ship => Math.sqrt(ship.nakedLoS())).sumValues();
	};
	
	/**
	 * @return sum of all ships equipment eLoS, so u can multiply any Cn
	 */
	KC3Fleet.prototype.eLos3 = function(){
		return this.shipsUnescaped().map(ship => KC3Fleet.sumShipEquipmentElos(ship)).sumValues();
	};
	
	KC3Fleet.sumShipEquipmentElos = function(shipObj){
		// Known verified special multipliers applied to these types of equipment,
		// ID refer to KCSAPI: start2/api_mst_slotitem_equiptype, slotitem.api_type[2]
		const multipliers = {
			8 : 0.8, // Carrier-Based Torpedo Bomber
			9 : 1.0, // Carrier-Based Reconnaissance Aircraft
			10: 1.2, // Reconnaissance Seaplane
			11: 1.1, // Seaplane Bomber
			49: 1.0, // Land-Based Reconnaissance Aircraft
			58: 0.8, // Jet Torpedo Bomber (reserved)
			59: 1.0, // Jet Reconnaissance Aircraft (reserved)
			94: 1.0, // Carrier-Based Reconnaissance Aircraft (II) (reserved)
		};
		// without verified data, assume other items with LoS stat are using this:
		const defaultMultiplier = 0.6;
		let equipTotal = 0;
		if(!shipObj || shipObj.isDummy() || shipObj.isAbsent())
			return equipTotal;
		// iterate ship's equipment including ex-slot
		shipObj.equipment(true).forEach(gearObj => {
			if (gearObj.exists()) {
				const itemType = gearObj.master().api_type[2];
				const itemLos = gearObj.master().api_saku;
				const multiplier = multipliers[itemType] || defaultMultiplier;
				// only item with los stat > 0 will be summed
				// although some items are not equippable by ship, eg: LBAA
				// and no explicit bonus on ship affect this part
				if (itemLos > 0) {
					equipTotal += multiplier * (itemLos + gearObj.losStatImprovementBonus());
				}
			}
		});
		return equipTotal;
	};
	
	/**
	 * The weight modifier by maps should be applied to equipment eLoS since game phase 2.
	 * @return 1 by default, just like it used by 2-5.
	 * @see https://wikiwiki.jp/kancolle/%E3%83%AB%E3%83%BC%E3%83%88%E5%88%86%E5%B2%90#coefficient_node
	 */
	KC3Fleet.nodeDivaricatedFactorByMap = function(world, map){
		return KC3Meta.eLosNodeFactor([world, map].join("")) || 1;
	};
	
	/**
	 * (UNUSED) The modifier by maps should be applied to HQ level adjustment since game phase 2.
	 * @return 0.4 by default. Other values are still investigating, missing summarized data.
	 * @see #nodeDivaricatedFactorByMap
	 * @see https://docs.google.com/spreadsheets/d/1KC-hAbxkExKy2RJ1uf32BCJI8hNyNc3Cz4QidGkZ4TQ
	 */
	KC3Fleet.hqModifierByMap = function(world, map){
		const mapKey = map === undefined ? String(world) : [world, map].join("");
		return ({
			"35": 0.35,
			"52": 0.35,
			"63": 0.35,
			"75": 0.35,
		})[mapKey] || 0.4;
	};
	
	/**
	 * Implementation of effective LoS : "Formula 33".
	 * @see http://kancolle.wikia.com/wiki/Line_of_Sight
	 * @see http://ja.kancolle.wikia.com/wiki/%E3%83%9E%E3%83%83%E3%83%97%E7%B4%A2%E6%95%B5
	 * @param {number} nodeDivaricatedFactor - the weight of the equipment sum part, 1 by default. en wiki names it with `Cn` (Coefficient node)
	 * @see #nodeDivaricatedFactorByMap - Known:
	 *    For phase 1: 2-5(H,I):x1, 6-2(F,H)/6-3(H):x3, 3-5(G)/6-1(E,F):x4
	 *    For phase 2: see definitions in `fud_weekly.json`
	 * @param {number} hqModifier - the weight applied to HQ level adjustment, 0.4 by default.
	 * @see #hqModifierByMap - Known exception is 0.35 used by 3-5, 5-2, 6-3.
	 * @param {number} hqLevel - the expected level of player HQ to compute old history value,
	 *        current player level by default.
	 * @return {number} F33 eLoS value of this fleet.
	 */
	KC3Fleet.prototype.eLos4 = function(nodeDivaricatedFactor = 1, hqModifier = 0.4, hqLevel = PlayerManager.hq.level){
		const fullShipSlots = 6,
			// empty slots and retreated ships already filtered
			availableShips = this.shipsUnescaped(),
			// count for empty slots or ships retreated,
			// according tests https://twitter.com/CC_jabberwock/status/975369274804940801
			// for 7 ships Striking Force fleet during event, it will be -1, which make finally elos -2.
			emptyShipSlot = fullShipSlots - availableShips.length;
		let total = 0;
		availableShips.forEach(ship => {
			// According tests, visible LoS bonus from equipment should be added to ship part,
			// ~except these pieces for now: SG Radar (Initial Model)~
			//   fixed since 2022-04-28 with Late Model implementation: https://twitter.com/KanColle_STAFF/status/1519633389015670784
			// https://wikiwiki.jp/kancolle/%E3%83%AB%E3%83%BC%E3%83%88%E5%88%86%E5%B2%90#equipment_bonus
			const losOnShipBonus = ship.equipmentTotalStats("saku", true, true, true) || 0;
			// sum ship's naked LoS
			total += Math.sqrt(ship.nakedLoS() + losOnShipBonus);
			// sum equipment's eLoS
			const equipTotal = KC3Fleet.sumShipEquipmentElos(ship);
			total += nodeDivaricatedFactor * equipTotal;
		});
		// player hq level adjustment
		total -= Math.ceil(hqLevel * hqModifier);
		// empty ship slot adjustment
		total += 2 * emptyShipSlot;
		return total;
	};
	
	/**
	 * Calculate LoS score of Air Reconnaissance (aka Aviation Detection) for World 6-3 Node G and H.
	 * @return {number} current score of this fleet. Detection success judgements:
	 *         Node G: 12 <= success < 12*1.6 <= random < 12*2.2 <= great success
	 *         Node H: 16 <- success < 16*1.6 <= random < 16*2.2 <= great success
	 * @see https://wikiwiki.jp/kancolle/%E4%B8%AD%E9%83%A8%E6%B5%B7%E5%9F%9F#area3
	 */
	KC3Fleet.prototype.airReconnScore = function(){
		return this.shipsUnescaped().reduce((totalScore, ship) => {
			// no aircraft and slot size on ex-slot for now
			return totalScore + ship.equipment(false).reduce((total, gear, idx) => {
				let value = 0;
				const mst = gear.exists() && gear.master();
				// Seaplane Reconn/Bomber
				if(mst && [10, 11].includes(mst.api_type[2])) {
					// no any visible/improvement bonus confirmed
					value = mst.api_saku * Math.sqrt(Math.sqrt(ship.slotSize(idx)));
				// Large Flying Boat
				} else if(mst && [41].includes(mst.api_type[2])) {
					value = mst.api_saku * Math.sqrt(ship.slotSize(idx));
				}
				return total + value;
			}, 0);
		}, 0);
	};
	
	/**
	 * Try to check: for implemented aviation detection nodes, will current score result a success or great success?
	 * @see #airReconnScore
	 */
	KC3Fleet.prototype.estimateAirReconnResult = function(score = this.airReconnScore()){
		// Data from KC Kai, https://kancolle.fandom.com/ja/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:1899
		const airReconnNodes = {
			"W63G": { "world": 6, "map": 3, "node": "G", "edges": [7], "reqS": 12 },
			"W63H": { "world": 6, "map": 3, "node": "H", "edges": [8, 12], "reqS": 16 },
		};
		Object.entries(airReconnNodes).forEach(([key, node]) => {
			node.score = score;
			node.reqGS = node.reqS * 1.6;
			node.reqGGS = node.reqS * 2.2;
			node.result = (
				score >= node.reqGGS ? "GreatSuccess" :
				node.reqGS <= score && score < node.reqGGS ? "RandomSorGS" :
				node.reqS  <= score && score < node.reqGS ? "Success" :
				"Failure"
			);
		});
		return airReconnNodes;
	};
	
	/*--------------------------------------------------------*/
	/*--------------[ OTHER MECHANISM INFERENCE ]-------------*/
	/*--------------------------------------------------------*/
	
	/**
	 * Look up for Katori Class (and other CTs) Exp Bonus from current fleet.
	 * @return {exp bonus modifiers}, default is 1.0
	 * @see http://wikiwiki.jp/kancolle/?%B1%E9%BD%AC#v657609b
	 * @see https://docs.google.com/document/d/1iiQpAyVQvnhVG-j-zx-Am41RPiZRISaL6FdHTKhYZaU/view
	 */
	KC3Fleet.prototype.lookupKatoriClassBonus = function() {
		const ctBonusTable = [
			// ~9,  ~29,  ~59,  ~99, Married
			[ 1.0,  1.0,  1.0,  1.0,  1.0], // No CT
			[1.05, 1.08, 1.12, 1.15, 1.20], // CT x 1 as flagship
			[1.03, 1.05, 1.07, 1.10, 1.15], // CT x 1
			[1.10, 1.13, 1.16, 1.20, 1.25], // CT x 2, 1 flagship
			[1.04, 1.06, 1.08, 1.12, 1.175] // CT x 2
		];
		const ctAsahiMstId = 953;
		var fsCtLevel = 0, maxCtLevel = 0, katoriIndex = 0;
		this.ship(function(rid, idx, ship){
			// Exclude CT Asahi base remodel, since given different mechanism
			if(!ship.isDummy() && ship.master().api_stype == 21 && ship.masterId !== ctAsahiMstId){
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
		const levelToIndex = (level) => (
			(level < 10)  ? 0 :
			(level < 30)  ? 1 :
			(level < 60)  ? 2 :
			(level < 100) ? 3 :
			4
		);
		const katoriModifier = ctBonusTable[katoriIndex][levelToIndex(maxCtLevel)] || 1;
		var ctBonus = katoriModifier, ctBonusBase = katoriModifier, ctBonusSub = 1;
		// asahi modifiers: https://twitter.com/yukicacoon/status/1700319740391236090
		var asahiModifier = 1, asahiModifierForSS = 1;
		if(this.hasShip([ctAsahiMstId])){
			const isAsahiFlagship = this.hasShip([ctAsahiMstId], 0);
			// assumed the 1st asahi in fleet, ofc only 1 possible for now
			const asahi = this.ship().find((ship) => ship.masterId === ctAsahiMstId);
			// asahi flagship, or together with Katori-class and one of them is flagship
			if(isAsahiFlagship || katoriIndex === 1 || katoriIndex === 3){
				asahiModifier = 0.6;
				asahiModifierForSS = 1.3;
				// take asahi flagship as CT and use its base bonus
				if(isAsahiFlagship){
					ctBonusBase = ctBonusTable[katoriIndex === 4 ? 3 : 1][levelToIndex(asahi.level)];
				}
				if(katoriIndex > 0){
					asahiModifier += 0.45;
					asahiModifierForSS += 0.15;
					// only one CT flagship used as base bonus even 2 Katori-class there
					if(katoriIndex === 3){
						ctBonusBase = ctBonusTable[1][levelToIndex(fsCtLevel)];
					}
				}
				ctBonus = Math.fixed(ctBonusBase * asahiModifier, 4);
				ctBonusSub = Math.fixed(ctBonusBase * asahiModifierForSS, 4);
			}
		}
		return {
			ctBonus,
			ctBonusBase,
			ctBonusSub,
			katoriModifier,
			asahiModifier,
			asahiModifierForSS,
		};
	};

	/**
	 * Estimate base XP gained in PvP battle.
	 * @param levels of first two ships - if omitted, use the ones of this fleet
	 * @param ctBonus - exp multiplier of CT (Katori-class & Asahi base) bonus, default is 1
	 * @param asahiBonusSS - exp multiplier of Asahi base remodel for submarine, if any
	 * @param rank - expected battle rank letter: SABCDE for test purpose, default is S
	 * @return variant exp values by battle ranks
	 * @see http://wikiwiki.jp/kancolle/?%B1%E9%BD%AC#v657609b
	 */
	KC3Fleet.prototype.estimatePvpBaseExp = function(
		firstShipLevel = this.ship(0).level,
		secondShipLevel = this.ship(1).level,
		ctBonus = 1,
		asahiBonusSS = 1,
		rank = "S"
	) {
		const exps1 = KC3Meta.expShip(firstShipLevel),
			exps2 = KC3Meta.expShip(secondShipLevel);
		let baseExpMin = Math.floor(exps1[1] / 100 + exps2[1] / 300),
			// random 0~3 additional, max used
			baseExp = 3 + baseExpMin;
		// return undefined and NaN if exp unknown, level 0 for 2nd empty slot acceptable
		if(exps1.every(v => !v) || (secondShipLevel > 0 && exps2.every(v => !v))){
			baseExpMin = undefined;
			baseExp = undefined;
		}
		const capExp = (exp) => (
			exp > 500 ? Math.floor(500 + Math.sqrt(exp - 500)) : exp
		);
		baseExpMin = capExp(baseExpMin);
		baseExp = capExp(baseExp);
		const rankSingameMin = Math.floor(baseExpMin * 1.2);
		const baseExpWoCT = {
			 S: Math.floor(baseExp * 1.20),
			 A: Math.floor(baseExp * 1.00),
			 B: Math.floor(baseExp * 1.00),
			 C: Math.floor(baseExp * 0.64),
			 D: Math.floor(baseExp * 0.56),
			 E: Math.floor(baseExp * 0.40),
		};
		const expectedRank = String(rank).toUpperCase();
		const getRankBaseExp = (r) => (baseExpWoCT[r] || baseExpWoCT.S);
		const baseExpS = Math.floor(getRankBaseExp("S") * ctBonus),
			baseExpAB  = Math.floor(getRankBaseExp("A") * ctBonus),
			baseExpC   = Math.floor(getRankBaseExp("C") * ctBonus),
			baseExpD   = Math.floor(getRankBaseExp("D") * ctBonus),
			baseExpE   = Math.floor(getRankBaseExp("E") * ctBonus);
		// different from vita's int post ctBonus applied then mvp applied
		const fsExpRank = Math.floor(getRankBaseExp(expectedRank) * ctBonus * 1.5),
			mvpExpRank  = Math.floor(getRankBaseExp(expectedRank) * ctBonus * 2),
			bothExpRank = Math.floor(getRankBaseExp(expectedRank) * ctBonus * 1.5 * 2),
			ssExpRank   = Math.floor(getRankBaseExp(expectedRank) * asahiBonusSS);
		return {
			levelFlagship: firstShipLevel,
			level2ndship: secondShipLevel,
			ctBonus: ctBonus,
			ctBonusSub: asahiBonusSS,
			base: baseExp,
			baseMin: baseExpMin,
			rank: expectedRank,
			rankSingame: baseExpWoCT.S,
			rankSingameMin: rankSingameMin,
			rankS: baseExpS,
			rankA: baseExpAB,
			rankB: baseExpAB,
			rankC: baseExpC,
			rankD: baseExpD,
			rankE: baseExpE,
			expectedIngame: getRankBaseExp(expectedRank),
			expectedFs: fsExpRank,
			expectedMvp: mvpExpRank,
			expectedFsMvp: bothExpRank,
			expectedSub: ssExpRank,
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
	 * @see http://wikiwiki.jp/kancolle/?%BB%D9%B1%E7%B4%CF%C2%E2
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
		// Check for Anti-sub Support
		const countAirAswShipType = (...shipTypes) => {
			return this.ship().reduce((count, ship) => {
				return count + (1 & (
					// Match with specific ship types
					shipTypes.includes(ship.master().api_stype) &&
					// Equip aircraft can ASW with air attack (TB/DB/Autogyro/PBY/SPB/SPR/LFB)
					// on any non zero slot
					ship.equipment().some(
						(g, i) => ship.slotSize(i) > 0 && g.isAswAircraft(false, true)
					)
				));
			}, 0);
		};
		// If 1 Anti-sub CVL + any 1 Anti-sub (with air attack) CVL/AV/AO/LHA/CL or 2 DE present
		// Will fall back to Aerial Support if there is no submarine in enemy fleet
		const antiSubCvl = countAirAswShipType(7);
		if(antiSubCvl >= 1 && (antiSubCvl >= 2 ||
			countAirAswShipType(3, 16, 17, 22) >= 1 ||
			this.countShipType(1) >= 2)) {
			return 4;
		}
		// If no criteria is met, remaining should be Aerial Support
		return 1;
	};

	/**
	 * Estimate expedition support fleet trigger change.
	 * @return percentage of support fleet show rate.
	 * @see https://wikiwiki.jp/kancolle/%E6%94%AF%E6%8F%B4%E8%89%A6%E9%9A%8A#ldf45a21
	 */
	KC3Fleet.prototype.estimateSupportShowRate = function(isBossSupport = false) {
		const isFlagshipSparkle = this.ship(0).morale >= 50;
		const sparkledEscortCount = this.ship().map((s, i) => i > 0 && s.exists() && s.morale >= 50 ? 1 : 0).sumValues();
		return 1 + 50 + (isBossSupport ? 35 : 0) + (isFlagshipSparkle ? 15 : 0) + sparkledEscortCount * 5;
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
				if(!ship.isAbsent() && ship.hp[0] > 1) {
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

	/**
	 * Estimate final trigger chance of Smoke Generator(s) in fleet.
	 * Possibly multi-rolling for more than 1 smoke. Either for smoke level rolling.
	 * @see inferred formula: https://twitter.com/CC_jabberwock/status/1739241607659151846
	 */
	KC3Fleet.prototype.estimateSmokeGeneratingRate = function() {
		const flagshipLuck = this.ship(0).lk[0];
		// for 1 smoke equipped only, lookup the smoke and get its stars.
		const smokeStars = 0;
		return 0.2 * Math.max(0, Math.qckInt("ceil", Math.sqrt(flagshipLuck) - 6 + 0.3 * smokeStars));
		// for more and level
		// https://twitter.com/yukicacoon/status/1739480992090632669
		// https://twitter.com/Xe_UCH/status/1767407602554855730
	};

	/**
	 * Get fleet LoS for determining artillery spotting rate.
	 * @see KC3Ship.prototype.daySpAttackBaseRate
	 */
	KC3Fleet.prototype.artillerySpottingLineOfSight = function() {
		let value = 0;
		this.shipsUnescaped().forEach(ship => {
			value += ship.nakedLoS();
			ship.equipment().forEach((equip, index) => {
				const master = equip.master();
				if (master && [10, 11].includes(master.api_type[2])) {
					// LoS visible bonus on ship not counted
					// https://twitter.com/Matsu_class_DD/status/1245457218956226560
					value += Math.floor(Math.sqrt(ship.slots[index] || 0)) * (master.api_saku || 0);
				}
			});
		});
		return value;
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
		const self = this;
		const shipsArray = [];
		if(this.active){
			$.each(this.ships, function(index, rosterId){
				if(rosterId > 0){
					const ship = self.ship(index);
					const nakedStats = ship.nakedStats();
					shipsArray.push({
						mst_id: ship.masterId,
						level: ship.level,
						morale: ship.morale,
						stats: {
							ev: nakedStats.ev,
							ls: nakedStats.ls,
							as: nakedStats.as,
							sp: ship.speed
						},
						kyouka: ship.mod,
						effect: ship.statsSp(),
						equip: ship.equipment(true).map(g => g.masterId),
						stars: ship.equipment(true).map(g => g.stars),
						ace: ship.equipment(true).map(g => g.ace)
					});
				}
			});
		}
		return shipsArray;
	};

	KC3Fleet.prototype.deckbuilder = function(forImgBuilder) {
		const result = {};
		// seems gkcoi will be buggy for some fleet names
		//if(forImgBuilder) result.name = this.name;
		this.ship().forEach((ship, index) => {
			result[`s${index + 1}`] = ship.deckbuilder(forImgBuilder);
		});
		return result;
	};

})();
