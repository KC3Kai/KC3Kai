/* Ship.js
KC3改 Ship Object
*/
(function(){
	"use strict";

	var deferList = {};

	window.KC3Ship = function( data ){
		// Default object properties included in stringifications
		this.rosterId = 0;
		this.masterId = 0;
		this.level = 0;
		this.exp = [0,0,0];
		this.hp = [0,0];
		this.afterHp = [0,0];
		this.fp = [0,0];
		this.tp = [0,0];
		this.aa = [0,0];
		this.ar = [0,0];
		this.ev = [0,0];
		this.as = [0,0];
		this.ls = [0,0];
		this.lk = [0,0];
		this.range = 0;
		// corresponds to "api_slot" in the API,
		// but devs change it to length == 5 someday,
		// and item of ex slot still not at 5th.
		// extended to 5 slots on 2018-02-16 for Musashi Kai Ni.
		this.items = [-1,-1,-1,-1,-1];
		// corresponds to "api_slot_ex" in the API,
		// which has special meanings on few values:
		// 0: ex slot is not available
		// -1: ex slot is available but nothing is equipped
		this.ex_item = 0;
		// "api_onslot" in API, also changed to length 5 now.
		this.slots = [0,0,0,0,0];
		this.slotnum = 0;
		this.speed = 0;
		// corresponds to "api_kyouka" in the API,
		// represents [fp,tp,aa,ar,lk] in the past.
		// expanded to 7-length array since 2017-09-29
		// last new twos are [hp,as]
		this.mod = [0,0,0,0,0,0,0];
		this.fuel = 0;
		this.ammo = 0;
		this.repair = [0,0,0];
		this.stars = 0;
		this.morale = 0;
		this.lock = 0;
		this.sally = 0;
		this.akashiMark = false;
		this.preExpedCond = [
			/* Data Example
			["exped300",12,20, 0], // fully supplied
			["exped301", 6,10, 0], // not fully supplied
			NOTE: this will be used against comparison of pendingConsumption that hardly to detect expedition activities
			*/
		];
		this.pendingConsumption = {
			/* Data Example
			typeName: type + W {WorldNum} + M {MapNum} + literal underscore + type_id
				type_id can be described as sortie/pvp/expedition id
			valueStructure: typeName int[3][3] of [fuel, ammo, bauxites] and [fuel, steel, buckets] and [steel]
				"sortie3000":[[12,24, 0],[ 0, 0, 0]], // OREL (3 nodes)
				"sortie3001":[[ 8,16, 0],[ 0, 0, 0]], // SPARKLE GO 1-1 (2 nodes)
				"sortie3002":[[ 4,12, 0],[ 0, 0, 0]], // PVP (1 node+yasen)
				"sortie3003":[[ 0, 0, 0],[ 0, 0, 0],[-88]], // 1 node with Jet battle of 36 slot

				Practice and Expedition automatically ignore repair consumption.
				For every action will be recorded before the sortie.
			*/
		};
		this.lastSortie = ['sortie0'];

		// Define properties not included in stringifications
		Object.defineProperties(this,{
			didFlee: {
				value: false,
				enumerable: false,
				configurable: false,
				writable: true
			},
			mvp: {
				value: false,
				enumerable: false,
				configurable: false,
				writable: true
			},
			// useful when making virtual ship objects.
			// requirements:
			// * "GearManager.get( itemId )" should get the intended equipment
			// * "itemId" is taken from either "items" or "ex_item"
			// * "shipId === -1 or 0" should always return a dummy gear
			GearManager: {
				value: null,
				enumerable: false,
				configurable: false,
				writable: true
			}
		});

		// If specified with data, fill this object
		if(typeof data != "undefined"){
			// Initialized with raw data
			if(typeof data.api_id != "undefined"){
				this.rosterId = data.api_id;
				this.masterId = data.api_ship_id;
				this.level = data.api_lv;
				this.exp = data.api_exp;
				this.hp = [data.api_nowhp, data.api_maxhp];
				this.afterHp = [data.api_nowhp, data.api_maxhp];
				this.fp = data.api_karyoku;
				this.tp = data.api_raisou;
				this.aa = data.api_taiku;
				this.ar = data.api_soukou;
				this.ev = data.api_kaihi;
				this.as = data.api_taisen;
				this.ls = data.api_sakuteki;
				this.lk = data.api_lucky;
				this.range = data.api_leng;
				this.items = data.api_slot;
				if(typeof data.api_slot_ex != "undefined"){
					this.ex_item = data.api_slot_ex;
				}
				if(typeof data.api_sally_area != "undefined"){
					this.sally = data.api_sally_area;
				}
				this.slotnum = data.api_slotnum;
				this.slots = data.api_onslot;
				this.speed = data.api_soku;
				this.mod = data.api_kyouka;
				this.fuel = data.api_fuel;
				this.ammo = data.api_bull;
				this.repair = [data.api_ndock_time].concat(data.api_ndock_item);
				this.stars = data.api_srate;
				this.morale = data.api_cond;
				this.lock = data.api_locked;
			// Initialized with formatted data
			}else{
				$.extend(this, data);
			}
			if(this.getDefer().length <= 0)
				this.checkDefer();
		}
	};

	// Define complex properties on prototype
	Object.defineProperties(KC3Ship.prototype,{
		bull: {
			get: function(){return this.ammo;},
			set: function(newAmmo){this.ammo = newAmmo;},
			configurable:false,
			enumerable  :true
		}
	});

	KC3Ship.prototype.getGearManager = function(){ return this.GearManager || KC3GearManager; };
	KC3Ship.prototype.exists = function(){ return this.rosterId > 0 && this.masterId > 0; };
	KC3Ship.prototype.isDummy = function(){ return ! this.exists(); };
	KC3Ship.prototype.master = function(){ return KC3Master.ship( this.masterId ); };
	KC3Ship.prototype.name = function(){ return KC3Meta.shipName( this.master().api_name ); };
	KC3Ship.prototype.stype = function(){ return KC3Meta.stype( this.master().api_stype ); };
	KC3Ship.prototype.equipment = function(slot){
		switch(typeof slot) {
			case 'number':
			case 'string':
				/* Number/String => converted as equipment slot key */
				return this.getGearManager().get( slot < 0 || slot >= this.items.length ? this.ex_item : this.items[slot] );
			case 'boolean':
				/* Boolean => return all equipments with ex item if true */
				return slot ? this.equipment().concat(this.exItem())
					: this.equipment();
			case 'undefined':
				/* Undefined => returns whole equipment as equip object array */
				return this.items
					// cloned and fixed to max 4 slots if 5th or more slots not found
					.slice(0, Math.max(this.slotnum, 4))
					.map(Number.call, Number)
					.map(i => this.equipment(i));
			case 'function':
				/* Function => iterates over given callback for every equipment */
				var equipObjs = this.equipment();
				equipObjs.forEach((item, index) => {
					slot.call(this, item.itemId, index, item);
				});
				// forEach always return undefined, return equipment for chain use
				return equipObjs;
		}
	};
	KC3Ship.prototype.slotSize = function(slotIndex){
		// ex-slot is always assumed to be 0 for now
		return (slotIndex < 0 || slotIndex >= this.slots.length ? 0 : this.slots[slotIndex]) || 0;
	};
	KC3Ship.prototype.slotCapacity = function(slotIndex){
		// no API data defines the capacity for ex-slot
		var maxeq = (this.master() || {}).api_maxeq;
		return (Array.isArray(maxeq) ? maxeq[slotIndex] : 0) || 0;
	};
	KC3Ship.prototype.areAllSlotsFull = function(){
		// to left unfulfilled slots in-game, make bauxite insufficient or use supply button at expedition
		var maxeq = (this.master() || {}).api_maxeq;
		return Array.isArray(maxeq) ?
			maxeq.every((expectedSize, index) => !expectedSize || expectedSize <= this.slotSize(index)) : true;
	};
	KC3Ship.prototype.isFast = function(){ return (this.speed || this.master().api_soku) >= 10; };
	KC3Ship.prototype.getSpeed = function(){ return this.speed || this.master().api_soku; };
	KC3Ship.prototype.exItem = function(){ return this.getGearManager().get(this.ex_item); };
	KC3Ship.prototype.isStriped = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.5); };
	// Current HP < 25% but already in the repair dock not counted
	KC3Ship.prototype.isTaiha = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.25) && !this.isRepairing(); };
	// To indicate the face grey out ship, retreated or sunk (before her data removed from API)
	KC3Ship.prototype.isAbsent = function(){ return (this.didFlee || this.hp[0] <= 0 || this.hp[1] <= 0); };
	KC3Ship.prototype.speedName = function(){ return KC3Meta.shipSpeed(this.speed); };
	KC3Ship.prototype.rangeName = function(){ return KC3Meta.shipRange(this.range); };
	KC3Ship.getMarriedLevel = function(){ return 100; };
	KC3Ship.getMaxLevel = function(){ return 165; };
	// hard-coded at `Core.swf/vo.UserShipData.VHP`
	KC3Ship.getMaxHpModernize = function() { return 2; };
	// hard-coded at `Core.swf/vo.UserShipData.VAS`
	KC3Ship.getMaxAswModernize = function() { return 9; };
	KC3Ship.prototype.isMarried = function(){ return this.level >= KC3Ship.getMarriedLevel(); };
	KC3Ship.prototype.levelClass = function(){
		return this.level === KC3Ship.getMaxLevel() ? "married max" :
			this.level >= KC3Ship.getMarriedLevel() ? "married" :
			this.level >= 80 ? "high" :
			this.level >= 50 ? "medium" :
			"";
	};
	/** @return full url of ship face icon according her hp percent. */
	KC3Ship.prototype.shipIcon = function(){
		return KC3Meta.shipIcon(this.masterId, undefined, true, this.isStriped());
	};
	KC3Ship.shipIcon = function(masterId, mhp = 0, chp = mhp){
		const isStriped = mhp > 0 && (chp / mhp) <= 0.5;
		return KC3Meta.shipIcon(masterId, undefined, true, isStriped);
	};
	/** @return icon file name only without path and extension suffix. */
	KC3Ship.prototype.moraleIcon = function(){
		return KC3Ship.moraleIcon(this.morale);
	};
	KC3Ship.moraleIcon = function(morale){
		return morale > 49 ? "4" : // sparkle
			morale > 29 ? "3" : // normal
			morale > 19 ? "2" : // orange face
			"1"; // red face
	};
	/**
	 * The reason why 53 / 33 is the bound of morale effect being taken:
	 * on entering battle, morale is subtracted -3 (day) or -2 (night) before its value gets in,
	 * so +3 value is used as the indeed morale bound for sparkle or fatigue.
	 *
	 * @param {Array} valuesArray - values to be returned based on morale section.
	 * @param {boolean} onBattle - if already on battle, not need to use the bounds mentioned above.
	 */
	KC3Ship.prototype.moraleEffectLevel = function(valuesArray = [0, 1, 2, 3, 4], onBattle = false){
		return onBattle ? (
			this.morale > 49 ? valuesArray[4] :
			this.morale > 29 ? valuesArray[3] :
			this.morale > 19 ? valuesArray[2] :
			this.morale >= 0 ? valuesArray[1] :
			valuesArray[0]
			) : (
			this.morale > 52 ? valuesArray[4] :
			this.morale > 32 ? valuesArray[3] :
			this.morale > 19 ? valuesArray[2] :
			this.morale >= 0 ? valuesArray[1] :
			valuesArray[0]);
	};
	KC3Ship.prototype.getDefer = function(){
		// returns a new defer if possible
		return deferList[this.rosterId] || [];
	};
	KC3Ship.prototype.checkDefer = function() {
		// reset defer if it does not in normal state
		var
			self= this,
			ca  = this.getDefer(), // get defer array
			cd  = ca[0]; // current collection of deferred
		if(ca && cd && cd.state() == "pending")
			return ca;

		//console.debug("replacing",this.rosterId,"cause",!cd ? typeof cd : cd.state());
		ca = deferList[this.rosterId] = Array.apply(null,{length:2}).map(function(){return $.Deferred();});
		cd = $.when.apply(null,ca);
		ca.unshift(cd);
		return ca;
	};

	/* DAMAGE STATUS
	Get damage status of the ship, return one of the following string:
	  * "dummy" if this is a dummy ship
	  * "taiha" (HP <= 25%)
	  * "chuuha" (25% < HP <= 50%)
	  * "shouha" (50% < HP <= 75%)
	  * "normal" (75% < HP < 100%)
	  * "full" (100% HP)
	--------------------------------------------------------------*/
	KC3Ship.prototype.damageStatus = function() {
		if (this.hp[1] > 0) {
			if (this.hp[0] === this.hp[1]) {
				return "full";
			}
			var hpPercent = this.hp[0] / this.hp[1];
			if (hpPercent <= 0.25) {
				return "taiha";
			} else if (hpPercent <= 0.5) {
				return "chuuha";
			} else if (hpPercent <= 0.75) {
				return "shouha";
			} else {
				return "normal";
			}
		} else {
			return "dummy";
		}
	};

	KC3Ship.prototype.isSupplied = function(){
		if(this.isDummy()){ return true; }
		return this.fuel >= this.master().api_fuel_max
			&& this.ammo >= this.master().api_bull_max;
	};

	KC3Ship.prototype.isNeedSupply = function(isEmpty){
		if(this.isDummy()){ return false; }
		var
			fpc  = function(x,y){return Math.qckInt("round",(x / y) * 10);},
			fuel = fpc(this.fuel,this.master().api_fuel_max),
			ammo = fpc(this.ammo,this.master().api_bull_max);
		return Math.min(fuel,ammo) <= (ConfigManager.alert_supply) * (!isEmpty);
	};

	KC3Ship.prototype.onFleet = function(){
		var fleetNum = 0;
		PlayerManager.fleets.find((fleet, index) => {
			if(fleet.ships.some(rid => rid === this.rosterId)){
				fleetNum = index + 1;
				return true;
			}
		});
		return fleetNum;
	};

	/**
	 * @return a tuple for [position in fleet (0-based), fleet total ship amount].
	 *         return [-1, 0] if this ship is not on any fleet.
	 */
	KC3Ship.prototype.fleetPosition = function(){
		var position = -1,
			total = 0;
		if(this.exists()) {
			const fleetNum = this.onFleet();
			if(fleetNum > 0) {
				var fleet = PlayerManager.fleets[fleetNum - 1];
				position = fleet.ships.indexOf(this.rosterId);
				total = fleet.countShips();
			}
		}
		return [position, total];
	};

	KC3Ship.prototype.isRepairing = function(){
		return PlayerManager.repairShips.indexOf(this.rosterId) >= 0;
	};

	KC3Ship.prototype.isAway = function(){
		return this.onFleet() > 1 /* ensures not in main fleet */
			&& (KC3TimerManager.exped(this.onFleet()) || {active:false}).active; /* if there's a countdown on expedition, means away */
	};

	KC3Ship.prototype.isFree = function(){
		return !(this.isRepairing() || this.isAway());
	};

	KC3Ship.prototype.resetAfterHp = function(){
		this.afterHp[0] = this.hp[0];
		this.afterHp[1] = this.hp[1];
	};

	KC3Ship.prototype.applyRepair = function(){
		this.hp[0] = this.hp[1];
		// also keep afterHp consistent
		this.resetAfterHp();
		this.morale = Math.max(40, this.morale);
		this.repair.fill(0);
	};

	/**
	 * Return max HP of a ship. Static method for library.
	 * Especially after marriage, api_taik[1] is hard to reach in game.
	 * Since 2017-09-29, HP can be modernized, and known max value is within 2.
	 * @return false if ship ID belongs to abyssal or nonexistence
	 * @see http://wikiwiki.jp/kancolle/?%A5%B1%A5%C3%A5%B3%A5%F3%A5%AB%A5%C3%A5%B3%A5%AB%A5%EA
	 * @see https://github.com/andanteyk/ElectronicObserver/blob/develop/ElectronicObserver/Other/Information/kcmemo.md#%E3%82%B1%E3%83%83%E3%82%B3%E3%83%B3%E3%82%AB%E3%83%83%E3%82%B3%E3%82%AB%E3%83%AA%E5%BE%8C%E3%81%AE%E8%80%90%E4%B9%85%E5%80%A4
	 */
	KC3Ship.getMaxHp = function(masterId, currentLevel, isModernized){
		var masterHpArr = KC3Master.isNotRegularShip(masterId) ? [] :
			(KC3Master.ship(masterId) || {"api_taik":[]}).api_taik;
		var masterHp = masterHpArr[0], maxLimitHp = masterHpArr[1];
		var expected = ((currentLevel || KC3Ship.getMaxLevel())
			< KC3Ship.getMarriedLevel() ? masterHp :
			masterHp >  90 ? masterHp + 9 :
			masterHp >= 70 ? masterHp + 8 :
			masterHp >= 50 ? masterHp + 7 :
			masterHp >= 40 ? masterHp + 6 :
			masterHp >= 30 ? masterHp + 5 :
			masterHp >= 8  ? masterHp + 4 :
			masterHp + 3) || false;
		if(isModernized) expected += KC3Ship.getMaxHpModernize();
		return maxLimitHp && expected > maxLimitHp ? maxLimitHp : expected;
	};
	KC3Ship.prototype.maxHp = function(isModernized){
		return KC3Ship.getMaxHp(this.masterId, this.level, isModernized);
	};

	// Since 2017-09-29, asw stat can be modernized, known max value is within 9.
	KC3Ship.prototype.maxAswMod = function(){
		// the condition `Core.swf/vo.UserShipData.hasTaisenAbility()` also used
		var maxAswBeforeMarriage = this.as[1];
		var maxModAsw = this.nakedAsw() + KC3Ship.getMaxAswModernize() - (this.mod[6] || 0);
		return maxAswBeforeMarriage > 0 ? maxModAsw : 0;
	};

	/**
	 * Return total count of aircraft slots of a ship. Static method for library.
	 * @return -1 if ship ID belongs to abyssal or nonexistence
	 */
	KC3Ship.getCarrySlots = function(masterId){
		var maxeq = KC3Master.isNotRegularShip(masterId) ? undefined :
			(KC3Master.ship(masterId) || {}).api_maxeq;
		return Array.isArray(maxeq) ? maxeq.sumValues() : -1;
	};
	KC3Ship.prototype.carrySlots = function(){
		return KC3Ship.getCarrySlots(this.masterId);
	};

	/**
	 * @param isExslotIncluded - if equipment on ex-slot is counted, here true by default
	 * @return current equipped pieces of equipment
	 */
	KC3Ship.prototype.equipmentCount = function(isExslotIncluded = true){
		let amount = (this.items.indexOf(-1) + 1 || (this.items.length + 1)) - 1;
		// 0 means ex-slot not opened, -1 means opened but none equipped
		amount += (isExslotIncluded && this.ex_item > 0) & 1;
		return amount;
	};

	/**
	 * @param isExslotIncluded - if ex-slot is counted, here true by default
	 * @return amount of all equippable slots
	 */
	KC3Ship.prototype.equipmentMaxCount = function(isExslotIncluded = true){
		return this.slotnum + ((isExslotIncluded && (this.ex_item === -1 || this.ex_item > 0)) & 1);
	};

	/**
	 * @param stypeValue - specific a ship type if not refer to this ship
	 * @return true if this (or specific) ship is a SS or SSV
	 */
	KC3Ship.prototype.isSubmarine = function(stypeValue){
		if(this.isDummy()) return false;
		const stype = stypeValue || this.master().api_stype;
		return [13, 14].includes(stype);
	};

	/**
	 * @return true if this ship type is CVL, CV or CVB
	 */
	KC3Ship.prototype.isCarrier = function(){
		if(this.isDummy()) return false;
		const stype = this.master().api_stype;
		return [7, 11, 18].includes(stype);
	};

	/**
	 * @return true if this ship is a CVE, which is Light Carrier and her initial ASW stat > 0
	 */
	KC3Ship.prototype.isEscortLightCarrier = function(){
		if(this.isDummy()) return false;
		const stype = this.master().api_stype;
		// Known implementations: Taiyou series, Gambier Bay series, Zuihou K2B
		const minAsw = (this.master().api_tais || [])[0];
		return stype === 7 && minAsw > 0;
	};

	/* REPAIR TIME
	Get ship's docking and Akashi times
	when optAfterHp is true, return repair time based on afterHp
	--------------------------------------------------------------*/
	KC3Ship.prototype.repairTime = function(optAfterHp){
		var
			HPPercent  = this.hp[0] / this.hp[1],
			RepairTSec = Math.hrdInt('floor',this.repair[0],3,1),
			RepairCalc = PS['KanColle.RepairTime'],

			hpArr = optAfterHp ? this.afterHp : this.hp;

		var result = { akashi: 0 };

		if (HPPercent > 0.5 && HPPercent < 1.00 && this.isFree()) {
			var repairTime = KC3AkashiRepair.calculateRepairTime(this.repair[0]);
			result.akashi = Math.max(
				Math.hrdInt('floor', repairTime,3,1), // convert to seconds
				20 * 60 // should be at least 20 minutes
			);
		}

		if (optAfterHp) {
			result.docking = RepairCalc.dockingInSecJSNum( this.master().api_stype, this.level, hpArr[0], hpArr[1] );
		} else {
			result.docking = this.isRepairing() ?
				Math.ceil(KC3TimerManager.repair(PlayerManager.repairShips.indexOf(this.rosterId)).remainingTime()) / 1000 :
				/* RepairCalc. dockingInSecJSNum( this.master().api_stype, this.level, this.hp[0], this.hp[1] ) */
				RepairTSec;
		}
		return result;
	};

	/* Calculate resupply cost
	   ----------------------------------
	   0 <= fuelPercent <= 1, < 0 use current fuel
	   0 <= ammoPercent <= 1, < 0 use current ammo
	   to calculate bauxite cost: bauxiteNeeded == true
	   to calculate steel cost per battles: steelNeeded == true
	   costs of expeditions simulate rounding by adding roundUpFactor(0.4/0.5?) before flooring
	   returns an object: {fuel: <fuelCost>, ammo: <ammoCost>, steel: <steelCost>, bauxite: <bauxiteCost>}
	 */
	KC3Ship.prototype.calcResupplyCost = function(fuelPercent, ammoPercent, bauxiteNeeded, steelNeeded, roundUpFactor) {
		var self = this;
		var result = {
			fuel: 0, ammo: 0
		};
		if(this.isDummy()) {
			if(bauxiteNeeded) result.bauxite = 0;
			if(steelNeeded) result.steel = 0;
			return result;
		}
		
		var master = this.master();
		var fullFuel = master.api_fuel_max;
		var fullAmmo = master.api_bull_max;
		var mulRounded = function (a, percent) {
			return Math.floor( a * percent + (roundUpFactor || 0) );
		};
		var marriageConserve = function (v) {
			return self.isMarried() ? Math.floor(0.85 * v) : v;
		};
		result.fuel = fuelPercent < 0 ? fullFuel - this.fuel : mulRounded(fullFuel, fuelPercent);
		result.ammo = ammoPercent < 0 ? fullAmmo - this.ammo : mulRounded(fullAmmo, ammoPercent);
		// After testing, 85% is applied to supply cost, not max value
		result.fuel = marriageConserve(result.fuel);
		result.ammo = marriageConserve(result.ammo);
		if(bauxiteNeeded){
			var slotsBauxiteCost = function(current, max) {
				return current < max ? (max-current) * KC3GearManager.carrierSupplyBauxiteCostPerSlot : 0;
			};
			var shipBauxiteCost = function() {
				return slotsBauxiteCost(self.slots[0], master.api_maxeq[0])
					+ slotsBauxiteCost(self.slots[1], master.api_maxeq[1])
					+ slotsBauxiteCost(self.slots[2], master.api_maxeq[2])
					+ slotsBauxiteCost(self.slots[3], master.api_maxeq[3]);
			};
			result.bauxite = shipBauxiteCost();
			// Bauxite cost to fill slots not affected by marriage.
			// via http://kancolle.wikia.com/wiki/Marriage
			//result.bauxite = marriageConserve(result.bauxite);
		}
		if(steelNeeded){
			result.steel = this.calcJetsSteelCost();
		}
		return result;
	};

	/**
	 * Calculate steel cost of jet aircraft for 1 battle based on current slot size.
	 * returns total steel cost for this ship at this time
	 */
	KC3Ship.prototype.calcJetsSteelCost = function(currentSortieId) {
		var totalSteel = 0, consumedSteel = 0;
		if(this.isDummy()) { return totalSteel; }
		this.equipment().forEach((item, i) => {
			// Is Jet aircraft and left slot > 0
			if(item.exists() && this.slots[i] > 0 &&
				KC3GearManager.jetAircraftType2Ids.includes(item.master().api_type[2])) {
				consumedSteel = Math.round(
					this.slots[i]
					* item.master().api_cost
					* KC3GearManager.jetBomberSteelCostRatioPerSlot
				) || 0;
				totalSteel += consumedSteel;
				if(!!currentSortieId) {
					let pc = this.pendingConsumption[currentSortieId];
					if(!Array.isArray(pc)) {
						pc = [[0,0,0],[0,0,0],[0]];
						this.pendingConsumption[currentSortieId] = pc;
					}
					if(!Array.isArray(pc[2])) {
						pc[2] = [0];
					}
					pc[2][0] -= consumedSteel;
				}
			}
		});
		if(!!currentSortieId && totalSteel > 0) {
			KC3ShipManager.save();
		}
		return totalSteel;
	};

	/**
	 * Naked stats of this ship.
	 * @return stats without the equipment but with modernization.
	 */
	KC3Ship.prototype.nakedStats = function(statAttr){
		if(this.isDummy()) { return false; }
		const stats = {
			aa: this.aa[0],
			ar: this.ar[0],
			as: this.as[0],
			ev: this.ev[0],
			fp: this.fp[0],
			// Naked HP maybe mean HP before marriage
			hp: (this.master().api_taik || [])[0] || this.hp[1],
			lk: (this.master().api_luck || [])[0] || this.lk[0],
			ls: this.ls[0],
			tp: this.tp[0],
			// Accuracy not shown in-game, so naked value might be plus-minus 0
			ac: 0
		};
		const statApiNames = {
			"tyku": "aa",
			"souk": "ar",
			"tais": "as",
			"houk": "ev",
			"houg": "fp",
			"saku": "ls",
			"raig": "tp",
			"houm": "ac"
		};
		for(const apiName in statApiNames) {
			const equipStats = this.equipmentTotalStats(apiName);
			stats[statApiNames[apiName]] -= equipStats;
		}
		return !statAttr ? stats : stats[statAttr];
	};

	KC3Ship.prototype.equipmentStatsMap = function(apiName, isExslotIncluded = true){
		return this.equipment(isExslotIncluded).map(equip => {
			if(equip.exists()) {
				return equip.master()["api_" + apiName];
			}
			return undefined;
		});
	};

	KC3Ship.prototype.equipmentTotalStats = function(apiName, isExslotIncluded = true){
		var total = 0;
		var hasSurfaceRadar = false;
		const thisShipClass = this.master().api_ctype;
		// Explicit stats bonuses from equipment on specific ship are added to API result by server-side,
		// To correct the 'naked stats' for these cases, have to simulate them all.
		// A summary table: https://twitter.com/Lambda39/status/990268289866579968
		// In order to handle some complex cases,
		// this definition table includes some functions which can not be moved to JSON file.
		const explicitStatsBonusGears = {
			// 61cm Quadruple (Oxygen) Torpedo Mount
			"15": {
				count: 0,
				byShip: {
					// Kagerou K2
					ids: [566],
					multiple: { "raig": 2 },
					countCap: 2,
				},
			},
			// 61cm Triple (Oxygen) Torpedo Mount Late Model
			// https://wikiwiki.jp/kancolle/61cm%E4%B8%89%E9%80%A3%E8%A3%85%28%E9%85%B8%E7%B4%A0%29%E9%AD%9A%E9%9B%B7%E5%BE%8C%E6%9C%9F%E5%9E%8B
			"285": {
				count: 0,
				byShip: {
					// Here goes ship ID white-list:
					//  Fubuki K2, Murakumo K2,
					//  Ayanami K2, Ushio K2
					//  Akatsuki K2, Bep (Hibiki K2)
					//  Hatsuharu K2, Hatsushimo K2
					ids: [426, 420, 195, 407, 437, 147, 326, 419],
					multiple: { "raig": 2, "houk": 1 },
				},
			},
			// 61cm Quadruple (Oxygen) Torpedo Mount Late Model
			// https://wikiwiki.jp/kancolle/61cm%E5%9B%9B%E9%80%A3%E8%A3%85%28%E9%85%B8%E7%B4%A0%29%E9%AD%9A%E9%9B%B7%E5%BE%8C%E6%9C%9F%E5%9E%8B
			"286": {
				count: 0,
				byClass: {
					// Asashio Class, Kai Nis
					"18": {
						remodel: 2,
						multiple: { "raig": 2, "houk": 1 },
					},
					// Shiratsuyu Class, Kai Nis
					"23": {
						remodel: 2,
						multiple: { "raig": 2, "houk": 1 },
					},
					// Kagerou Class, Kai Nis
					//  Kagerou K2 only if except Isokaze / Hamakaze B Kai, Urakaze D Kai
					"30": {
						remodel: 2,
						excludes: [556, 557, 558],
						multiple: { "raig": 2, "houk": 1 },
					},
					// Yuugumo Class, Kai Nis
					//  Naganami K2 only
					"38": {
						remodel: 2,
						multiple: { "raig": 2, "houk": 1 },
					},
				},
			},
			// 12.7cm Twin Gun Mount Model C Kai Ni
			"266": {
				count: 0,
				byShip: {
					// Kagerou K2
					ids: [566],
					multiple: { "houg": 1 },
					countCap: 2,
					callback: (api, info) => (
						// total +3 instead of +2 if guns >= 2
						// https://wikiwiki.jp/kancolle/%E9%99%BD%E7%82%8E%E6%94%B9%E4%BA%8C
						({"houg": info.count >= 2 ? 1 : 0})[api] || 0
					),
				},
			},
			// 12.7cm Twin Gun Mount Model D Kai Ni
			// http://wikiwiki.jp/kancolle/?12.7cm%CF%A2%C1%F5%CB%A4D%B7%BF%B2%FE%C6%F3
			"267": {
				count: 0,
				byClass: {
					// Shimakaze Class
					"22": {
						multiple: { "houg": 2, "houk": 1 },
					},
					// Kagerou Class
					"30": {
						multiple: { "houg": 1, "houk": 1 },
					},
					// Yuugumo Class
					"38": {
						multiple: { "houg": 2, "houk": 1 },
					},
				},
				byShip: [
					{
						// Naganami K2, total +3 for each gun
						ids: [543],
						multiple: { "houg": 1 },
					},
					{
						// Kagerou K2, total +2 for 1st gun
						ids: [566],
						single: { "houg": 1 },
					},
				],
				synergyCallback: (api, info) => (
					// Synergy with Surface Radar for Naganami Kai Ni and Shimakaze Kai
					hasSurfaceRadar && [543, 229].includes(this.masterId) ? ({
						"houg": 1, "raig": 3, "houk": 2
					})[api] || 0 : 0
				),
			},
			// Arctic Camouflage
			// http://wikiwiki.jp/kancolle/?%CB%CC%CA%FD%CC%C2%BA%CC%28%A1%DC%CB%CC%CA%FD%C1%F5%C8%F7%29
			"268": {
				count: 0,
				byShip: {
					// Tama K / K2, Kiso K / K2
					ids: [146, 216, 217, 547],
					single: { "souk": 2, "houk": 7 },
				},
			},
		};
		// Accumulates displayed stats from equipment, and count for special equipment
		this.equipment(isExslotIncluded).forEach(equip => {
			if(equip.exists()) {
				total += (equip.master()["api_" + apiName] || 0);
				const bonusDefs = explicitStatsBonusGears[equip.masterId];
				if(bonusDefs && bonusDefs.count >= 0) bonusDefs.count += 1;
				if(!hasSurfaceRadar && equip.isHighAccuracyRadar()) hasSurfaceRadar = true;
			}
		});
		// Add explicit stats bonuses (not masked, displayed on ship) from equipment on specific ship
		const addBonusToTotalIfNecessary = (bonusDef, apiName, gearInfo) => {
			if(Array.isArray(bonusDef.ids) && !bonusDef.ids.includes(this.masterId)) { return; }
			if(Array.isArray(bonusDef.exlucdes) && bonusDef.exlucdes.includes(this.masterId)) { return; }
			if(Array.isArray(bonusDef.classes) && !bonusDef.classes.includes(thisShipClass)) { return; }
			if(bonusDef.remodel &&
				RemodelDb.remodelGroup(this.masterId).indexOf(this.masterId) < bonusDef.remodel) { return; }
			if(bonusDef.single) { total += bonusDef.single[apiName] || 0; }
			if(bonusDef.multiple) {
				total += (bonusDef.multiple[apiName] || 0) *
					(bonusDef.countCap ? Math.min(bonusDef.countCap, gearInfo.count) : gearInfo.count);
			}
			if(bonusDef.callback) { total += bonusDef.callback(apiName, gearInfo); }
		};
		Object.keys(explicitStatsBonusGears).forEach(gearId => {
			const gearInfo = explicitStatsBonusGears[gearId];
			if(gearInfo.count > 0) {
				if(gearInfo.byClass) {
					const byClass = gearInfo.byClass[thisShipClass];
					if(byClass) addBonusToTotalIfNecessary(byClass, apiName, gearInfo);
				}
				if(gearInfo.byShip) {
					const byShip = gearInfo.byShip;
					if(Array.isArray(byShip)) {
						byShip.forEach(s => addBonusToTotalIfNecessary(s, apiName, gearInfo));
					} else {
						addBonusToTotalIfNecessary(byShip, apiName, gearInfo);
					}
				}
				if(gearInfo.synergyCallback) {
					total += gearInfo.synergyCallback(apiName, gearInfo);
				}
			}
		});
		return total;
	};

	// faster naked asw stat method since frequently used
	KC3Ship.prototype.nakedAsw = function(){
		var asw = this.as[0];
		var equipAsw = this.equipmentTotalStats("tais");
		return asw - equipAsw;
	};

	KC3Ship.prototype.nakedLoS = function(){
		var los = this.ls[0];
		var equipLos = this.equipmentTotalLoS();
		return los - equipLos;
	};

	KC3Ship.prototype.equipmentTotalLoS = function (){
		return this.equipmentTotalStats("saku");
	};

	KC3Ship.prototype.effectiveEquipmentTotalAsw = function(canAirAttack = false){
		// When calculating asw relevant thing,
		// asw stat from these known types of equipment not taken into account:
		// main gun, recon seaplane, seaplane fighter, radar, large flying boat, LBAA
		const noCountEquipType2Ids = [1, 2, 3, 10, 12, 13, 41, 45, 47, 57];
		// exclude bomber, seaplane bomber, autogyro, as-pby too if not able to air attack
		if(!canAirAttack) {
			noCountEquipType2Ids.push(...[7, 8, 11, 25, 26]);
		}
		const equipmentTotalAsw = this.equipment(true)
			.map(g => g.exists() && g.master().api_tais > 0 &&
				!noCountEquipType2Ids.includes(g.master().api_type[2]) ? g.master().api_tais : 0
			).sumValues();
		return equipmentTotalAsw;
	};

	// estimated LoS without equipments based on WhoCallsTheFleetDb
	KC3Ship.prototype.estimateNakedLoS = function() {
		var losInfo = WhoCallsTheFleetDb.getLoSInfo( this.masterId );
		var retVal = WhoCallsTheFleetDb.estimateStat(losInfo, this.level);
		return retVal === false ? 0 : retVal;
	};

	KC3Ship.prototype.estimateNakedAsw = function() {
		var aswInfo = WhoCallsTheFleetDb.getStatBound(this.masterId, "asw");
		var retVal = WhoCallsTheFleetDb.estimateStat(aswInfo, this.level);
		return retVal === false ? 0 : retVal;
	};

	KC3Ship.prototype.estimateNakedEvasion = function() {
		var evaInfo = WhoCallsTheFleetDb.getStatBound(this.masterId, "evasion");
		var retVal = WhoCallsTheFleetDb.estimateStat(evaInfo, this.level);
		return retVal === false ? 0 : retVal;
	};

	KC3Ship.prototype.equipmentTotalImprovementBonus = function(attackType){
		return this.equipment(true)
			.map(gear => gear.attackPowerImprovementBonus(attackType))
			.sumValues();
	};

	/**
	 * Maxed stats of this ship.
	 * @return stats without the equipment but with modernization at Lv.99,
	 *         stats at Lv.165 can be only estimated by data from known database.
	 */
	KC3Ship.prototype.maxedStats = function(statAttr, isMarried = this.isMarried()){
		if(this.isDummy()) { return false; }
		const stats = {
			aa: this.aa[1],
			ar: this.ar[1],
			as: this.as[1],
			ev: this.ev[1],
			fp: this.fp[1],
			hp: this.hp[1],
			// Maxed Luck includes full modernized + marriage bonus
			lk: this.lk[1],
			ls: this.ls[1],
			tp: this.tp[1]
		};
		if(isMarried){
			stats.hp = KC3Ship.getMaxHp(this.masterId);
			const asBound = WhoCallsTheFleetDb.getStatBound(this.masterId, "asw");
			const asw = WhoCallsTheFleetDb.estimateStat(asBound, KC3Ship.getMaxLevel());
			if(asw !== false) { stats.as = asw; }
			const lsBound = WhoCallsTheFleetDb.getStatBound(this.masterId, "los");
			const los = WhoCallsTheFleetDb.estimateStat(lsBound, KC3Ship.getMaxLevel());
			if(los !== false) { stats.ls = los; }
			const evBound = WhoCallsTheFleetDb.getStatBound(this.masterId, "evasion");
			const evs = WhoCallsTheFleetDb.estimateStat(evBound, KC3Ship.getMaxLevel());
			if(evs !== false) { stats.ev = evs; }
		}
		// Unlike stats fp, tp, ar and aa,
		// increase final maxed asw since modernized asw is not included in both as[1] and db
		if(this.mod[6] > 0) { stats.as += this.mod[6]; }
		return !statAttr ? stats : stats[statAttr];
	};

	/**
	 * Left modernize-able stats of this ship.
	 * @return stats to be maxed modernization
	 */
	KC3Ship.prototype.modernizeLeftStats = function(statAttr){
		if(this.isDummy()) { return false; }
		const shipMst = this.master();
		const stats = {
			fp: shipMst.api_houg[1] - shipMst.api_houg[0] - this.mod[0],
			tp: shipMst.api_raig[1] - shipMst.api_raig[0] - this.mod[1],
			aa: shipMst.api_tyku[1] - shipMst.api_tyku[0] - this.mod[2],
			ar: shipMst.api_souk[1] - shipMst.api_souk[0] - this.mod[3],
			lk: this.lk[1] - this.lk[0],
			// or: shipMst.api_luck[1] - shipMst.api_luck[0] - this.mod[4],
			// current stat (hp[1], as[0]) already includes the modded stat
			hp: this.maxHp(true) - this.hp[1],
			as: this.maxAswMod() - this.nakedAsw()
		};
		return !statAttr ? stats : stats[statAttr];
	};

	/**
	 * Get number of equipments of specific masterId(s).
	 * @param masterId - slotitem master ID to be matched, can be an Array.
	 * @return count of specific equipment.
	 */
	KC3Ship.prototype.countEquipment = function(masterId, isExslotIncluded = true) {
		return this.findEquipmentById(masterId, isExslotIncluded)
			.reduce((acc, v) => acc + (!!v & 1), 0);
	};

	/**
	 * Get number of equipments of specific type(s).
	 * @param typeIndex - the index of `slotitem.api_type[]`, see `equiptype.json` for more.
	 * @param typeValue - the expected type value(s) to be matched, can be an Array.
	 * @return count of specific type(s) of equipment.
	 */
	KC3Ship.prototype.countEquipmentType = function(typeIndex, typeValue, isExslotIncluded = true) {
		return this.findEquipmentByType(typeIndex, typeValue, isExslotIncluded)
			.reduce((acc, v) => acc + (!!v & 1), 0);
	};

	/**
	 * Get number of some equipment (aircraft usually) equipped on non-0 slot.
	 */
	KC3Ship.prototype.countNonZeroSlotEquipment = function(masterId, isExslotIncluded = false) {
		return this.findEquipmentById(masterId, isExslotIncluded)
			.reduce((acc, v, i) => acc + ((!!v && this.slots[i] > 0) & 1), 0);
	};

	/**
	 * Get number of some specific types of equipment (aircraft usually) equipped on non-0 slot.
	 */
	KC3Ship.prototype.countNonZeroSlotEquipmentType = function(typeIndex, typeValue, isExslotIncluded = false) {
		return this.findEquipmentByType(typeIndex, typeValue, isExslotIncluded)
			.reduce((acc, v, i) => acc + ((!!v && this.slots[i] > 0) & 1), 0);
	};

	/**
	 * Get number of drums held by this ship.
	 */
	KC3Ship.prototype.countDrums = function(){
		return this.countEquipment( 75 );
	};

	/**
	 * Indicate if some specific equipment equipped.
	 */
	KC3Ship.prototype.hasEquipment = function(masterId, isExslotIncluded = true) {
		return this.findEquipmentById(masterId, isExslotIncluded).some(v => !!v);
	};

	/**
	 * Indicate if some specific types of equipment equipped.
	 */
	KC3Ship.prototype.hasEquipmentType = function(typeIndex, typeValue, isExslotIncluded = true) {
		return this.findEquipmentByType(typeIndex, typeValue, isExslotIncluded).some(v => !!v);
	};

	/**
	 * Indicate if some specific equipment (aircraft usually) equipped on non-0 slot.
	 */
	KC3Ship.prototype.hasNonZeroSlotEquipment = function(masterId, isExslotIncluded = false) {
		return this.findEquipmentById(masterId, isExslotIncluded)
			.some((v, i) => !!v && this.slots[i] > 0);
	};

	/**
	 * Indicate if some specific types of equipment (aircraft usually) equipped on non-0 slot.
	 */
	KC3Ship.prototype.hasNonZeroSlotEquipmentType = function(typeIndex, typeValue, isExslotIncluded = false) {
		return this.findEquipmentByType(typeIndex, typeValue, isExslotIncluded)
			.some((v, i) => !!v && this.slots[i] > 0);
	};

	/**
	 * Indicate if only specific equipment equipped (empty slot not counted).
	 */
	KC3Ship.prototype.onlyHasEquipment = function(masterId, isExslotIncluded = true) {
		const equipmentCount = this.equipmentCount(isExslotIncluded);
		return equipmentCount > 0 &&
			equipmentCount === this.countEquipment(masterId, isExslotIncluded);
	};

	/**
	 * Indicate if only specific types of equipment equipped (empty slot not counted).
	 */
	KC3Ship.prototype.onlyHasEquipmentType = function(typeIndex, typeValue, isExslotIncluded = true) {
		const equipmentCount = this.equipmentCount(isExslotIncluded);
		return equipmentCount > 0 &&
			equipmentCount === this.countEquipmentType(typeIndex, typeValue, isExslotIncluded);
	};

	/**
	 * Simple method to find equipment by Master ID from current ship's equipment.
	 * @return the mapped Array to indicate equipment found or not at corresponding position,
	 *         max 5-elements including ex-slot.
	 */
	KC3Ship.prototype.findEquipmentById = function(masterId, isExslotIncluded = true) {
		return this.equipment(isExslotIncluded).map(gear =>
			Array.isArray(masterId) ? masterId.includes(gear.masterId) :
			masterId === gear.masterId
		);
	};

	/**
	 * Simple method to find equipment by Type ID from current ship's equipment.
	 * @return the mapped Array to indicate equipment found or not at corresponding position,
	 *         max 5-elements including ex-slot.
	 */
	KC3Ship.prototype.findEquipmentByType = function(typeIndex, typeValue, isExslotIncluded = true) {
		return this.equipment(isExslotIncluded).map(gear =>
			gear.exists() && (
				Array.isArray(typeValue) ? typeValue.includes(gear.master().api_type[typeIndex]) :
				typeValue === gear.master().api_type[typeIndex]
			)
		);
	};

	/* FIND DAMECON
	   Find first available damecon.
	   search order: extra slot -> 1st slot -> 2ns slot -> 3rd slot -> 4th slot -> 5th slot
	   return: {pos: <pos>, code: <code>}
	   pos: 1-5 for normal slots, 0 for extra slot, -1 if not found.
	   code: 0 if not found, 1 for repair team, 2 for goddess
	   ----------------------------------------- */
	KC3Ship.prototype.findDameCon = function() {
		const allItems = [ {pos: 0, item: this.exItem() } ];
		allItems.push(...this.equipment(false).map((g, i) => ({pos: i + 1, item: g}) ));
		const damecon = allItems.filter(x => (
				// 42: repair team
				// 43: repair goddess
				x.item.masterId === 42 || x.item.masterId === 43
			)).map(x => (
				{pos: x.pos,
				code: x.item.masterId === 42 ? 1
					: x.item.masterId === 43 ? 2
					: 0}
			));
		return damecon.length > 0 ? damecon[0] : {pos: -1, code: 0};
	};

	/* CALCULATE TRANSPORT POINT
	Retrieve TP object related to the current ship
	** TP Object Detail --
	   value: known value that were calculated for
	   clear: is the value already clear or not? it's a NaN like.
	**
	--------------------------------------------------------------*/
	KC3Ship.prototype.obtainTP = function() {
		var tp = KC3Meta.tpObtained();
		if (this.isDummy()) { return tp; }
		if (!(this.isAbsent() || this.isTaiha())) {
			var tp1,tp2,tp3;
			tp1 = String(tp.add(KC3Meta.tpObtained({stype:this.master().api_stype})));
			tp2 = String(tp.add(KC3Meta.tpObtained({slots:this.equipment().map(function(slot){return slot.masterId;})})));
			tp3 = String(tp.add(KC3Meta.tpObtained({slots:[this.exItem().masterId]})));
			// Special case of Kinu Kai 2: Daihatsu embedded :)
			if (this.masterId == 487) {
				tp.add(KC3Meta.tpObtained({slots:[68]}));
			}
		}
		return tp;
	};

	/* FIGHTER POWER
	Get fighter power of this ship
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterPower = function(){
		if(this.isDummy()){ return 0; }
		return this.equipment().map((g, i) => g.fighterPower(this.slots[i])).sumValues();
	};

	/* FIGHTER POWER with WHOLE NUMBER BONUS
	Get fighter power of this ship as an array
	with consideration to whole number proficiency bonus
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterVeteran = function(){
		if(this.isDummy()){ return 0; }
		return this.equipment().map((g, i) => g.fighterVeteran(this.slots[i])).sumValues();
	};

	/* FIGHTER POWER with LOWER AND UPPER BOUNDS
	Get fighter power of this ship as an array
	with consideration to min-max bonus
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterBounds = function(forLbas = false){
		if(this.isDummy()){ return [0, 0]; }
		const powerBounds = this.equipment().map((g, i) => g.fighterBounds(this.slots[i], forLbas));
		return [
			powerBounds.map(b => b[0]).sumValues(),
			powerBounds.map(b => b[1]).sumValues()
		];
	};

	/* FIGHTER POWER on Air Defense with INTERCEPTOR FORMULA
	Recon plane gives a modifier to total interception power
	--------------------------------------------------------------*/
	KC3Ship.prototype.interceptionPower = function(){
		if(this.isDummy()){ return 0; }
		var reconModifier = 1;
		this.equipment(function(id, idx, gear){
			if(id === 0){ return; }
			var type2 = gear.master().api_type[2];
			var los = gear.master().api_saku;
			if(KC3GearManager.landBaseReconnType2Ids.includes(type2)){
				// Carrier Recon Aircraft
				if(type2 == 9){
					reconModifier =
						(los <= 7) ? 1.2 :
						(los >= 9) ? 1.3 :
						1; // they say los = 8 not exists
				// Recon Seaplane, Flying Boat, etc
				} else {
					reconModifier =
						(los <= 7) ? 1.1  :
						(los >= 9) ? 1.16 :
						1.13;
				}
			}
		});
		var interceptionPower = this.equipment()
			.map((g, i) => g.interceptionPower(this.slots[i]))
			.sumValues();
		return Math.floor(interceptionPower * reconModifier);
	};

	/* SUPPORT POWER
	 * Get support expedition shelling power of this ship
	 * http://kancolle.wikia.com/wiki/Expedition/Support_Expedition
	 * http://wikiwiki.jp/kancolle/?%BB%D9%B1%E7%B4%CF%C2%E2
	--------------------------------------------------------------*/
	KC3Ship.prototype.supportPower = function(){
		if(this.isDummy()){ return 0; }
		const fixedFP = this.nakedStats("fp") - 1;
		var supportPower = 0;
		// for carrier series: CV, CVL, CVB
		if(this.isCarrier()){
			supportPower = fixedFP;
			supportPower += this.equipmentTotalStats("raig");
			supportPower += Math.floor(1.3 * this.equipmentTotalStats("baku"));
			// will not attack if no dive/torpedo bomber equipped
			if(supportPower === fixedFP){
				supportPower = 0;
			} else {
				supportPower = Math.floor(1.5 * supportPower);
				supportPower += 55;
			}
		} else {
			supportPower = 5 + fixedFP + this.equipmentTotalStats("houg");
		}
		return supportPower;
	};

	/**
	 * Get basic pre-cap shelling fire power of this ship (without pre-cap / post-cap modifiers).
	 *
	 * @param {number} combinedFleetFactor - additional power if ship is on a combined fleet.
	 * @return {number} computed fire power, return 0 if unavailable.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#ua92169d
	 */
	KC3Ship.prototype.shellingFirePower = function(combinedFleetFactor = 0){
		if(this.isDummy()) { return 0; }
		let isCarrierShelling = this.isCarrier();
		if(!isCarrierShelling) {
			// Hayasui Kai gets special when any Torpedo Bomber equipped
			isCarrierShelling = this.masterId === 352 && this.hasEquipmentType(2, 8);
		}
		let shellingPower = this.fp[0];
		if(isCarrierShelling) {
			shellingPower += this.equipmentTotalStats("raig");
			shellingPower += Math.floor(1.3 * this.equipmentTotalStats("baku"));
			shellingPower += combinedFleetFactor;
			shellingPower += this.equipmentTotalImprovementBonus("airattack");
			shellingPower = Math.floor(1.5 * shellingPower);
			shellingPower += 50;
		} else {
			shellingPower += combinedFleetFactor;
			shellingPower += this.equipmentTotalImprovementBonus("fire");
		}
		// 5 is attack power constant also used everywhere
		shellingPower += 5;
		return shellingPower;
	};

	/**
	 * Get pre-cap torpedo power of this ship.
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#n377a90c
	 */
	KC3Ship.prototype.shellingTorpedoPower = function(combinedFleetFactor = 0){
		if(this.isDummy()) { return 0; }
		return 5 + this.tp[0] + combinedFleetFactor +
			this.equipmentTotalImprovementBonus("torpedo");
	};

	/**
	 * Get pre-cap anti-sub power of this ship.
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#AntiSubmarine
	 */
	KC3Ship.prototype.antiSubWarfarePower = function(aswDiff = 0){
		if(this.isDummy()) { return 0; }
		const isSonarEquipped = this.hasEquipmentType(1, 10);
		const isDepthChargeProjectorEquipped = this.equipment(true).some(g => g.isDepthChargeProjector());
		const isNewDepthChargeEquipped = this.equipment(true).some(g => g.isDepthCharge());
		let synergyModifier = 1;
		synergyModifier += isSonarEquipped && isNewDepthChargeEquipped ? 0.15 : 0;
		synergyModifier += isDepthChargeProjectorEquipped && isNewDepthChargeEquipped ? 0.1 : 0;
		synergyModifier *= isSonarEquipped && isDepthChargeProjectorEquipped ? 1.15 : 1;
		// check asw attack type, 1530 is Abyssal Submarine Ka-Class
		const isAirAttack = this.estimateDayAttackType(1530, false)[0] === "AirAttack";
		const attackMethodConst = isAirAttack ? 8 : 13;
		const nakedAsw = this.nakedAsw() + aswDiff;
		// only asw stat from partial types of equipment taken into account
		const equipmentTotalAsw = this.effectiveEquipmentTotalAsw(isAirAttack);
		let aswPower = attackMethodConst;
		aswPower += 2 * Math.sqrt(nakedAsw);
		aswPower += 1.5 * equipmentTotalAsw;
		aswPower += this.equipmentTotalImprovementBonus("asw");
		// should move synergy modifier to pre-cap?
		aswPower *= synergyModifier;
		return aswPower;
	};

	/**
	 * Calculate landing craft precap/postcap bonus depending on installation type
	 * @see http://kancolle.wikia.com/wiki/Partials/Anti-Installation_Weapons
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#antiground
	 */
	KC3Ship.prototype.calcLandingBonus = function(installationType=0){
		if(this.isDummy() || ![2,3,4].includes(installationType)) { return 0; }

		const t2Count = this.countEquipment(167); // Special Type 2 Amphibious Tank
		const t89Count = this.countEquipment(166); // Daihatsu Landing Craft (Type 89 Medium Tank & Landing Force)
		const normalCount = this.countEquipment(68); // Daihatsu Landing Craft
		/* const shikonCount = this.countEquipment(); //Toku Daihatsu Landing Craft + 11th Tank Regiment
		(removed for now until more info) 
		Also, toku bonus missing */
		const landingModifiers = KC3GearManager.landingModifiers[installationType-2] || {};
		const gearArr = [167,166,68];
		const shipObj = this;

		// Arrange equipment in terms of priority
		const landingArray = [t2Count,t89Count,normalCount].map(function(element,idx){
			let improvement = 0;
			shipObj.equipment().forEach((gear, idx) => {
				if(gear.exists())  {
					if (gearArr[idx] === gear.masterId){
						improvement += gear.stars;
					}
				}
			});
			
			// Bonus for two Type 89 Tank
			if (element > 1 && idx === 1){
				return installationType === 4 ? 2.08+0.0416*improvement/element
				 : 3 + 0.06*improvement/element;
			}

			// Match modifier and improvement
			else if (element > 0){
				return landingModifiers.modifier[idx]+landingModifiers.improvement[idx]*improvement/element;
			}

			// Default to 1x if no matching equip
			else { return 1; }
		});

		// T89/normal bonus overlap, so take highest and multiply
		return landingArray[0]*(landingArray[1] > landingArray[2] ? landingArray[1] : landingArray[2]);
	};

	/**
	 * Get anti land installation modifiers of this ship.
	 * @see http://kancolle.wikia.com/wiki/Installation_Type
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#antiground
	 * @see calcLandingBonus
	 * @see getInstallationEnemyType
	 * @return array of [additive damage boost, multiplicative damage boost]
 	 * Two types of bonuses exist, precap and postcap
 	 */
	KC3Ship.prototype.antiLandWarfarePower = function(targetShipMasterId = 0, precap = true){
		if(this.isDummy()) { return [0,1]; }
		if (this.estimateTargetShipType(targetShipMasterId).isLand === false) {return [0,1];} 

		const installationType = this.getInstallationEnemyType(targetShipMasterId,precap);
		const wg42Count = this.countEquipment(126); 
		const hasT3Shell = this.hasEquipment(35);
		let wg42Bonus = 1;
		let t3Bonus = 1;
		const landingBonus = this.calcLandingBonus(installationType);

		/* Installation types
		Type 1 : Soft-skinned
		Type 2: Artillery Imps/Pillbox
		Type 3: Isolated Island Princess
		Type 4: Supply Depot Princess (NEET Hime), postcap
		*/
		
		if (precap){
			// [0,70,110,140,160] additive for each WG42,
			const wg42Additive = wg42Count === 0 ? 0 : 20 + 55*wg42Count - 5*Math.pow(wg42Count,2);
			
			switch(installationType){
				case 1: 
					// Soft-skinned
					// 2.5x multiplicative for at least one T3
					return [wg42Additive, hasT3Shell ? 2.5 : 1];
			
				case 2: 
					// Pillbox
					const seaplaneBonus = this.hasEquipmentType(2,[10,11,39]) ? 1.5 : 1; // Works even if slot is zeroed.
					const lightShipBonus = [2,3].includes(this.master().api_stype) ? 1.4 : 1; // DD/CL bonus
					wg42Bonus = [1,1.6,2.72].find(function(element,index){ // Multiplicative WG42 bonus
						if (index === wg42Count) {return element;}
						else if (wg42Count > 2) {return 2.72;}
					});
					const apShellBonus = this.hasEquipmentType(2,19) ? 1.85 : 1;
					
					// [0,70,110,140,160] addition for each WG42, multiply multiplicative modifiers
					return [wg42Additive,seaplaneBonus*lightShipBonus*wg42Bonus*apShellBonus*landingBonus];
				
				case 3: 
					// Isolated Island Princess
					t3Bonus = hasT3Shell ? 1.75 : 1;
					wg42Bonus = [1,1.4,2.1].find(function(element,index){
						if (index === wg42Count) {return element;}
						else if (wg42Count > 2) {return 2.1;}
					});
					// [0,70,110,140,160] addition for each WG42, multiply multiplicative modifiers
					return [wg42Additive,wg42Bonus*t3Bonus*landingBonus];
			
				default: return [0,1];
			}
		}
		else { 
			// Post-cap
			switch(installationType){
				case 4: 
					// Supply Depot Princess
					wg42Bonus = [1,1.25,1.625].find(function(element,index){
						if (index === wg42Count) return element;
						else if (wg42Count > 2) return 1.625;
						});
					return [0,landingBonus*wg42Bonus];
		
				default: return [0,1];
			}
		}
	};

	/**
	 * Get post-cap airstrike power tuple of this ship.
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#b8c008fa
	 * @see KC3Gear.prototype.airstrikePower
	 */
	KC3Ship.prototype.airstrikePower = function(combinedFleetFactor = 0,
			isJetAssaultPhase = false, contactPlaneId = 0, isCritical = false){
		const totalPower = [0, 0, false];
		if(this.isDummy()) { return totalPower; }
		// no ex-slot by default since no plane can be equipped on ex-slot for now
		this.equipment().forEach((gear, i) => {
			if(this.slots[i] > 0 && gear.isAirstrikeAircraft()) {
				const power = gear.airstrikePower(this.slots[i], combinedFleetFactor, isJetAssaultPhase);
				const isRange = !!power[2];
				const capped = [
					this.applyPowerCap(power[0], "Day", "Aerial").power,
					isRange ? this.applyPowerCap(power[1], "Day", "Aerial").power : 0
				];
				const postCapped = [
					Math.floor(this.applyPostcapModifiers(capped[0], "Aerial", undefined, contactPlaneId, isCritical).power),
					isRange ? Math.floor(this.applyPostcapModifiers(capped[1], "Aerial", undefined, contactPlaneId, isCritical).power) : 0
				];
				totalPower[0] += postCapped[0];
				totalPower[1] += isRange ? postCapped[1] : postCapped[0];
				totalPower[2] = totalPower[2] || isRange;
			}
		});
		return totalPower;
	};

	/**
	 * Get pre-cap night battle power of this ship.
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#b717e35a
	 */
	KC3Ship.prototype.nightBattlePower = function(isNightContacted = false){
		if(this.isDummy()) { return 0; }
		return (isNightContacted ? 5 : 0) + this.fp[0] + this.tp[0]
			+ this.equipmentTotalImprovementBonus("yasen");
	};

	/**
	 * Get pre-cap carrier night aerial attack power of this ship.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#nightAS
	 */
	KC3Ship.prototype.nightAirAttackPower = function(isNightContacted = false){
		if(this.isDummy()) { return 0; }
		const equipTotals = {
			fp: 0, tp: 0, slotBonus: 0, improveBonus: 0
		};
		// Ark Royal (Kai) + Swordfish - NOAP, might use normal formula, but
		// in fact, this formula is the same thing besides slot bonus part.
		const isThisArkRoyal = [515, 393].includes(this.masterId);
		const noNightAvPersonnel = !this.hasEquipment([258, 259]);
		this.equipment().forEach((gear, idx) => {
			if(gear.exists()) {
				const master = gear.master();
				const slot = this.slots[idx];
				const isNightAircraftType = KC3GearManager.nightAircraftType3Ids.includes(master.api_type[3]);
				const isSwordfish = [242, 243, 244].includes(gear.masterId);
				// Type 62 Fighter Bomber Iwai for now
				const isSpecialNightPlane = [154].includes(gear.masterId);
				const isLegacyArkRoyal = isThisArkRoyal && noNightAvPersonnel;
				const isNightPlane = isLegacyArkRoyal ? isSwordfish :
					isNightAircraftType || isSwordfish || isSpecialNightPlane;
				if(isNightPlane && slot > 0) {
					// assume all master stats hold value 0 by default
					equipTotals.fp += master.api_houg;
					equipTotals.tp += master.api_raig;
					if(!isLegacyArkRoyal) {
						equipTotals.slotBonus += slot * (isNightAircraftType ? 3 : 0);
						const ftbaPower = master.api_houg + master.api_raig + master.api_baku + master.api_tais;
						equipTotals.slotBonus += Math.sqrt(slot) * ftbaPower * (isNightAircraftType ? 0.45 : 0.3);
					}
					equipTotals.improveBonus += gear.attackPowerImprovementBonus("yasen");
				}
			}
		});
		let shellingPower = this.nakedStats("fp");
		shellingPower += equipTotals.fp + equipTotals.tp;
		shellingPower += equipTotals.slotBonus;
		shellingPower += equipTotals.improveBonus;
		shellingPower += isNightContacted ? 5 : 0;
		return shellingPower;
	};

	/**
	 * Apply known pre-cap modifiers to attack power.
	 * @return {Object} capped power and applied modifiers.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#beforecap
	 * @see https://twitter.com/Nishisonic/status/893030749913227264
	 */
	KC3Ship.prototype.applyPrecapModifiers = function(basicPower, warfareType = "Shelling",
			engagementId = 1, formationId = ConfigManager.aaFormation, nightSpecialAttackType = [], 
			isNightStart = false, isCombined = false, targetShipMasterId = 0){
		// Engagement modifier
		let engagementModifier = (warfareType === "Aerial" ? [] : [0, 1, 0.8, 1.2, 0.6])[engagementId] || 1;
		// Formation modifier
		let formationModifier = (warfareType === "Antisub" ?
			// ID 1~5: Line Ahead / Double Line / Diamond / Echelon / Line Abreast
			// ID 6: new Vanguard formation since 2017-11-17
			// ID 11~14: 1st anti-sub / 2nd forward / 3rd diamond / 4th battle
			// 0 are placeholders for non-exists ID
			[0, 0.6, 0.8, 1.2, 1, 1.3, 1, 0, 0, 0, 0, 1.3, 1.1, 1, 0.7] :
			warfareType === "Shelling" || warfareType === "Torpedo" ?
			[0, 1, 0.8, 0.7, 0.6, 0.6, 1, 0, 0, 0, 0, 0.8, 1, 0.7, 1.1] :
			// Aerial Opening Airstrike not affected
			[]
		)[formationId] || 1;
		// Modifier of vanguard formation depends on the position in the fleet
		if(formationId === 6) {
			const [shipPos, shipCnt] = this.fleetPosition();
			// Vanguard formation needs 4 ships at least, fake ID make no sense
			if(shipCnt >= 4) {
				// Guardian ships counted from 3rd or 4th ship
				const isGuardian = shipPos >= Math.floor(shipCnt / 2);
				if(warfareType === "Shelling") {
					formationModifier = isGuardian ? 1 : 0.5;
				} else if(warfareType === "Antisub") {
					formationModifier = isGuardian ? 0.6 : 1;
				}
			}
		}
		// Non-empty attack type tuple means this supposed to be night battle
		const isNightBattle = nightSpecialAttackType.length > 0;
		const canNightAntisub = warfareType === "Antisub" && (isNightStart || isCombined);
		// No engagement and formation modifier except night starts / combined ASW attack
		if(isNightBattle && !canNightAntisub) {
			engagementModifier = 1;
			formationModifier = 1;
		}
		// Damage percent modifier
		// http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#m8aa1749
		const damageModifier = (warfareType === "Torpedo" ? {
			// Day time only affect Opening Torpedo in fact, Chuuha cannot Closing at all
			// Night time unmentioned, assume Chuuha 0.8 too?
			"chuuha": 0.8,
			"taiha": 0.0
		} : warfareType === "Shelling" || warfareType === "Antisub" ? {
			"chuuha": 0.7,
			"taiha": 0.4
		} : // Aerial Opening Airstrike not affected
		{})[this.damageStatus()] || 1;
		// Night special attack modifier, should not x2 although some types attack 2 times
		const nightCutinModifier = nightSpecialAttackType[0] === "Cutin" &&
			nightSpecialAttackType[3] > 0 ? nightSpecialAttackType[3] : 1;

		const targetShipType = this.estimateTargetShipType(targetShipMasterId);

		// Anti-installation modifiers
		let landingAdditive = 0;
		let landingModifier = 1;
		if (targetShipType.isLand){
			const landingBonus = this.antiLandWarfarePower(targetShipMasterId,true);
			landingAdditive = landingBonus[0];
			landingModifier = landingBonus[1];
		}
		
		// Apply modifiers, flooring unknown, anti-installation first
		let result = (basicPower * landingModifier + landingAdditive) * engagementModifier * formationModifier * damageModifier * nightCutinModifier;
		
		// Light Cruiser fit gun bonus, should not applied before modifiers
		const stype = this.master().api_stype;
		const ctype = this.master().api_ctype;
		const isThisLightCruiser = [2, 3, 21].includes(stype);
		let lightCruiserBonus = 0;
		if(isThisLightCruiser) {
			// 14cm, 15.2cm
			const singleMountCnt = this.countEquipment([4, 11]);
			const twinMountCnt = this.countEquipment([65, 119, 139]);
			lightCruiserBonus = Math.sqrt(singleMountCnt) + 2 * Math.sqrt(twinMountCnt);
			result += lightCruiserBonus;
		}
		// Italian Heavy Cruiser (Zara class) fit gun bonus
		const isThisZaraClass = ctype === 64;
		let italianHeavyCruiserBonus = 0;
		if(isThisZaraClass) {
			// 203mm/53
			const itaTwinMountCnt = this.countEquipment(162);
			italianHeavyCruiserBonus = Math.sqrt(itaTwinMountCnt);
			result += italianHeavyCruiserBonus;
		}
		
		// Night battle anti-sub regular battle condition forced to no damage
		const aswLimitation = isNightBattle && warfareType === "Antisub" && !canNightAntisub ? 0 : 1;
		result *= aswLimitation;
		
		return {
			power: result,
			engagementModifier,
			formationModifier,
			damageModifier,
			nightCutinModifier,
			lightCruiserBonus,
			italianHeavyCruiserBonus,
			aswLimitation
		};
	};

	/**
	 * Apply cap to attack power according warfare phase.
	 * @param {number} precapPower - pre-cap power, see applyPrecapModifiers
	 * @return {Object} capped power, cap value and is capped flag.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#k5f74647
	 */
	KC3Ship.prototype.applyPowerCap = function(precapPower,
			time = "Day", warfareType = "Shelling"){
		const cap = time === "Night" ? 300 :
			// increased from 150 to 180 since 2017-03-18
			warfareType === "Shelling" ? 180 :
			// increased from 100 to 150 since 2017-11-10
			warfareType === "Antisub" ? 150 :
			150; // default cap for other phases
		const isCapped = precapPower > cap;
		const power = Math.floor(isCapped ? cap + Math.sqrt(precapPower - cap) : precapPower);
		return {
			power,
			cap,
			isCapped
		};
	};

	/**
	 * Apply known post-cap modifiers to capped attack power.
	 * @return {Object} capped power and applied modifiers.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#aftercap
	 */
	KC3Ship.prototype.applyPostcapModifiers = function(cappedPower, warfareType = "Shelling",
			daySpecialAttackType = [], contactPlaneId = 0, isCritical = false, isAirAttack = false, 
			targetShipStype = 0, isDefenderArmorCounted = false, targetShipMasterId = 0){
		// Artillery spotting modifier, should not x2 although some types attack 2 times
		const dayCutinModifier = daySpecialAttackType[0] === "Cutin" && daySpecialAttackType[3] > 0 ?
			daySpecialAttackType[3] : 1;
		let airstrikeConcatModifier = 1;
		// Contact modifier only applied to aerial warfare airstrike power
		if(warfareType === "Aerial" && contactPlaneId > 0) {
			const contactPlaneAcc = KC3Master.slotitem(contactPlaneId).api_houm;
			airstrikeConcatModifier = contactPlaneAcc >= 3 ? 1.2 :
				contactPlaneAcc >= 2 ? 1.17 : 1.12;
		}
		let apshellModifier = 1;
		// AP Shell modifier applied to specific target ship types:
		// CA, CAV, BB, FBB, BBV, CV, CVB and Land installation
		const isTargetShipTypeMatched = [5, 6, 8, 9, 10, 11, 18].includes(targetShipStype);
		if(isTargetShipTypeMatched) {
			const mainGunCnt = this.countEquipmentType(2, [1, 2, 3]);
			const apShellCnt = this.countEquipmentType(2, 19);
			const secondaryCnt = this.countEquipmentType(2, 4);
			const radarCnt = this.countEquipmentType(2, [12, 13]);
			if(mainGunCnt >= 1 && secondaryCnt >= 1 && apShellCnt >= 1)
				apshellModifier = 1.15;
			else if(mainGunCnt >= 1 && apShellCnt >= 1 && radarCnt >= 1)
				apshellModifier = 1.1;
			else if(mainGunCnt >= 1 && apShellCnt >= 1)
				apshellModifier = 1.08;
		}
		// Standard critical modifier
		const criticalModifier = isCritical ? 1.5 : 1;
		// Additional aircraft proficiency critical modifier
		// Applied to open airstrike and shelling air attack including anti-sub
		let proficiencyCriticalModifier = 1;
		if(isCritical && (isAirAttack || warfareType === "Aerial")) {
			if(daySpecialAttackType[0] === "Cutin" && daySpecialAttackType[1] === 7) {
				// special proficiency critical modifier for CVCI
				// http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#FAcutin
				const firstSlotType = (cutinType => {
					switch(cutinType) {
						case "CutinFDBTB": return [6, 7, 8];
						case "CutinDBDBTB":
						case "CutinDBTB": return [7, 8];
						default: return [];
					}
				})(daySpecialAttackType[2]);
				const hasNonZeroSlotCaptainPlane = (type2Ids) => {
					const firstGear = this.equipment(0);
					return this.slots[0] > 0 && firstGear.exists() &&
						type2Ids.includes(firstGear.master().api_type[2]);
				};
				// detail modifier affected by (internal) proficiency under verification
				// might be an average value from participants, simply use max modifier (+0.1 / +0.25) here
				proficiencyCriticalModifier += 0.1;
				proficiencyCriticalModifier += hasNonZeroSlotCaptainPlane(firstSlotType) ? 0.15 : 0;
			} else {
				// http://wikiwiki.jp/kancolle/?%B4%CF%BA%DC%B5%A1%BD%CF%CE%FD%C5%D9#v3f6d8dd
				const expBonus = [0, 1, 2, 3, 4, 5, 7, 10];
				this.equipment().forEach((g, i) => {
					if(g.isAirstrikeAircraft()) {
						const aceLevel = g.ace || 0;
						const internalExpLow = KC3Meta.airPowerInternalExpBounds(aceLevel)[0];
						let mod = Math.floor(Math.sqrt(internalExpLow) + (expBonus[aceLevel] || 0)) / 100;
						if(i > 0) mod /= 2;
						proficiencyCriticalModifier += mod;
					}
				});
			}
		}

		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		
		// PT Imp modifier
		let ptImpModifier = 1;
		if (targetShipType.isPTImp){
			const lightGunBonus = this.countEquipmentType(2,1) >= 2 ? 1.2 : 1;
			const aaGunBonus = this.countEquipmentType(2,21) >= 2 ? 1.1 : 1;
			const secondaryGunBonus = this.countEquipmentType(2,4) >= 2 ? 1.2 : 1;
			const t3Bonus = this.hasEquipment(35) ? 1.3 : 1;
			ptImpModifier = lightGunBonus*aaGunBonus*secondaryGunBonus*t3Bonus;
		}

		// Anti-installation modifier
		let landingModifier = 1;
		if (targetShipType.isLand){
			const landingBonus = this.antiLandWarfarePower(targetShipMasterId,false);
			landingModifier = landingBonus[1];
		}
		
		let result = Math.floor(cappedPower * criticalModifier * proficiencyCriticalModifier)
			* dayCutinModifier * airstrikeConcatModifier * apshellModifier * ptImpModifier * landingModifier;
		
		// New Depth Charge armor penetration, not attack power bonus
		let newDepthChargeBonus = 0;
		if(warfareType === "Antisub") {
			const type95ndcCnt = this.countEquipment(226);
			const type2ndcCnt = this.countEquipment(227);
			if(type95ndcCnt > 0 || type2ndcCnt > 0) {
				const deShipBonus = this.master().api_stype === 1 ? 1 : 0;
				newDepthChargeBonus =
					type95ndcCnt * (Math.sqrt(KC3Master.slotitem(226).api_tais - 2) + deShipBonus) +
					type2ndcCnt * (Math.sqrt(KC3Master.slotitem(227).api_tais - 2) + deShipBonus);
				// Applying this to enemy submarine's armor, result will be capped to at least 1
				if(isDefenderArmorCounted) result += newDepthChargeBonus;
			}
		}
		
		// Remaining ammo percent modifier, applied to final damage, not only attack power
		const ammoPercent = Math.floor(this.ammo / this.master().api_bull_max * 100);
		const remainingAmmoModifier = ammoPercent >= 50 ? 1 : ammoPercent * 2 / 100;
		if(isDefenderArmorCounted) {
			result *= remainingAmmoModifier;
		}
		
		return {
			power: result,
			criticalModifier,
			proficiencyCriticalModifier,
			dayCutinModifier,
			airstrikeConcatModifier,
			apshellModifier,
			newDepthChargeBonus,
			remainingAmmoModifier,
		};
	};

	/**
	 * Collect battle conditions from current battle node if available.
	 * Do not fall-back to default value here if not available, leave it to appliers.
	 * @return {Object} an object contains battle properties we concern at.
	 * @see CalculatorManager.collectBattleConditions
	 */
	KC3Ship.prototype.collectBattleConditions = function(){
		return KC3Calc.collectBattleConditions();
	};

	/**
	 * @return extra power bonus for combined fleet battle.
	 * @see http://wikiwiki.jp/kancolle/?%CF%A2%B9%E7%B4%CF%C2%E2#offense
	 */
	KC3Ship.prototype.combinedFleetPowerBonus = function(playerCombined, enemyCombined,
			warfareType = "Shelling"){
		const powerBonus = {
			main: 0, escort: 0
		};
		switch(warfareType) {
			case "Shelling":
				if(!enemyCombined) {
					// CTF
					if(playerCombined === 1) { powerBonus.main = 2; powerBonus.escort = 10; }
					// STF
					if(playerCombined === 2) { powerBonus.main = 10; powerBonus.escort = -5; }
					// TCF
					if(playerCombined === 3) { powerBonus.main = -5; powerBonus.escort = 10; }
				} else {
					if(playerCombined === 1) { powerBonus.main = 2; powerBonus.escort = -5; }
					if(playerCombined === 2) { powerBonus.main = 2; powerBonus.escort = -5; }
					if(playerCombined === 3) { powerBonus.main = -5; powerBonus.escort = -5; }
					if(!playerCombined) { powerBonus.main = 5; powerBonus.escort = 5; }
				}
				break;
			case "Torpedo":
				if(playerCombined) {
					if(!enemyCombined) {
						powerBonus.main = -5; powerBonus.escort = -5;
					} else {
						powerBonus.main = 10; powerBonus.escort = 10;
					}
				}
				break;
			case "Aerial":
				if(!playerCombined && enemyCombined) {
					// different by target enemy fleet, targeting main:
					powerBonus.main = -10; powerBonus.escort = -10;
					// targeting escort:
					//powerBonus.main = -20; powerBonus.escort = -20;
				}
				break;
		}
		return powerBonus;
	};

	// check if this ship is capable of equipping Daihatsu (landing craft)
	KC3Ship.prototype.canEquipDaihatsu = function() {
		if(this.isDummy()) { return false; }
		var master = this.master();
		// ship types: DD=2, CL=3, BB=9, AV=16, LHA=17, AO=22
		// so far only ships with types above can equip daihatsu.
		if ([2,3,9,16,17,22].indexOf( master.api_stype ) === -1)
			return false;

		// excluding Akitsushima(445), Hayasui(460), Commandant Teste(491), Kamoi(162)
		// (however their remodels are capable of equipping daihatsu
		if ([445, 460, 491, 162].indexOf( this.masterId ) !== -1)
			return false;
		
		// only few DDs, CLs and 1 BB are capable of equipping daihatsu
		// see comments below.
		if ([2 /* DD */,3 /* CL */,9 /* BB */].indexOf( master.api_stype ) !== -1 &&
			[
				// Abukuma K2(200), Tatsuta K2(478), Kinu K2(487), Yura K2(488), Tama K2(547)
				200, 478, 487, 488, 547,
				// Satsuki K2(418), Mutsuki K2(434), Kisaragi K2(435), Fumizuki(548)
				418, 434, 435, 548,
				// Kasumi K2(464), Kasumi K2B(470), Arare K2 (198), Ooshio K2(199), Asashio K2D(468), Michishio K2(489), Arashio K2(490)
				464, 470, 198, 199, 468, 489, 490,
				// Verniy(147), Kawakaze K2(469), Murasame K2(498)
				147, 469, 498,
				// Nagato K2(541)
				541
			].indexOf( this.masterId ) === -1)
			return false;
		return true;
	};

	/**
	 * @return true if this ship is capable of equipping (Striking Force) Fleet Command Facility.
	 */
	KC3Ship.prototype.canEquipFCF = function() {
		if(this.isDummy()) { return false; }
		// Excluding DE, DD, XBB, SS, SSV, AO, AR, which can be found at master.stype.api_equip_type[34]
		const capableStypes = [3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18, 20, 21];
		// These can be found at `RemodelMain.swf/scene.remodel.view.changeEquip._createType3List()`
		// DD Kasumi K2, DD Murasame K2, AO Kamoi Kai-Bo, DD Naganami K2
		const capableShips = [464, 498, 500, 543];
		// CVL Kasugamaru
		const incapableShips = [521];
		const masterId = this.masterId,
			stype = this.master().api_stype;
		return incapableShips.indexOf(masterId) === -1 &&
			(capableShips.includes(masterId) || capableStypes.includes(stype));
	};

	// is this ship able to do OASW unconditionally
	KC3Ship.prototype.isOaswShip = function() {
		// Isuzu K2, Tatsuta K2, Jervis Kai, Samuel B.Roberts Kai
		return [141, 478, 394, 681].includes(this.masterId);
	};
	// test to see if this ship (with equipment) is capable of opening ASW 
	// reference: http://kancolle.wikia.com/wiki/Partials/Opening_ASW as of Feb 3, 2017
	// http://wikiwiki.jp/kancolle/?%C2%D0%C0%F8%C0%E8%C0%A9%C7%FA%CD%EB%B9%B6%B7%E2#o377cad0
	KC3Ship.prototype.canDoOASW = function (aswDiff = 0) {
		if(this.isDummy()) { return false; }
		if (this.isOaswShip()) return true;
		const stype = this.master().api_stype,
			ctype = this.master().api_ctype;

		const isEscort = stype === 1;
		// is CVE (Taiyou series, Gambier Bay series, Zuihou K2B)
		const isEscortLightCarrier = this.isEscortLightCarrier();
		const hasLargeSonar = this.hasEquipmentType(2, 40);
		// Taiyou series:
		// tho Kasugamaru not possible to reach high asw for now
		// and base asw stat of Kai and Kai2 already exceed 70
		//const isTaiyouClass = ctype === 76;
		//const isTaiyouBase = this.masterId === 526;
		const isTaiyouKaiAfter = RemodelDb.remodelGroup(521).indexOf(this.masterId) > 1;

		// lower condition for DE and CVE, even lower if equips Large Sonar
		const aswThreshold = isEscortLightCarrier && hasLargeSonar ? 50
			: isEscort ? 60
			: isEscortLightCarrier ? 65
			: 100;

		// ship stats not updated in time when equipment changed, so take the diff if necessary
		const shipAsw = this.as[0] + aswDiff;
		// shortcut on the stricter condition first
		if (shipAsw < aswThreshold)
			return false;

		// for Taiyou Kai or Kai Ni, any equippable aircraft with asw should work,
		// only Autogyro or PBY equipped will not let CVL anti-sub in day shelling phase,
		// but CVE can still OASW. only Sonar equipped can do neither.
		if (isTaiyouKaiAfter) {
			return this.equipment(true).some(gear => gear.isAswAircraft(false));
		} else if (isEscortLightCarrier) {
			return this.equipment(true).some(gear => gear.isHighAswBomber());
		}

		const hasSonar = this.hasEquipmentType(1, 10);
		// Escort can OASW without Sonar, but total asw >= 75 and equipped total plus asw >= 4
		if(isEscort) {
			if(hasSonar) return true;
			const equipAswSum = this.equipmentTotalStats("tais");
			return shipAsw >= 75 && equipAswSum >= 4;
		}

		return hasSonar;
	};

	/**
	 * @return true if this ship can do ASW attack.
	 */
	KC3Ship.prototype.canDoASW = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		const stype = this.master().api_stype;
		const isHayasuiKaiWithTorpedoBomber = this.masterId === 352 && this.hasEquipmentType(2, 8);
		// CAV, CVL, BBV, AV, LHA, CVL-like Hayasui Kai
		const isAirAntiSubStype = [6, 7, 10, 16, 17].includes(stype) || isHayasuiKaiWithTorpedoBomber;
		if(isAirAntiSubStype) {
			const isCvlLike = stype === 7 || isHayasuiKaiWithTorpedoBomber;
			// false if CVL or CVL-like chuuha
			if(isCvlLike && this.isStriped()) return false;
			// if ASW plane equipped and slot > 0
			return this.equipment().some((g, i) => this.slots[i] > 0 && g.isAswAircraft(isCvlLike));
		}
		// DE, DD, CL, CLT, CT, AO(*)
		// *AO: Hayasui base form and Kamoi Kai-Bo can only depth charge, Kamoi base form cannot asw
		const isAntiSubStype = [1, 2, 3, 4, 21, 22].includes(stype);
		// if max ASW stat before marriage (Lv99) not 0, can do ASW,
		// which also used at `Core.swf/vo.UserShipData.hasTaisenAbility()`
		// if as[1] === 0, naked asw stat should be 0, but as[0] may not.
		return isAntiSubStype && this.as[1] > 0;
	};

	/**
	 * @return true if this ship can do opening torpedo attack.
	 */
	KC3Ship.prototype.canDoOpeningTorpedo = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		const hasKouhyouteki = this.hasEquipment(41);
		const isThisSubmarine = this.isSubmarine();
		return hasKouhyouteki || (isThisSubmarine && this.level >= 10);
	};

	/**
	 * @return {Object} target (enemy) ship category flags defined by us, possible values are:
	 *         `isSurface`, `isSubmarine`, `isLand`, `isPTImp.
	 */
	KC3Ship.prototype.estimateTargetShipType = function(targetShipMasterId = 0) {
		const targetShip = KC3Master.ship(targetShipMasterId);
		// land installation
		const isLand = targetShip && targetShip.api_soku === 0;
		const isSubmarine = targetShip && this.isSubmarine(targetShip.api_stype);
		// regular surface vessel by default
		const isSurface = !isLand && !isSubmarine;
		const isPTImp = targetShip.api_name.includes("PT");
		return {
			isSubmarine,
			isLand,
			isSurface,
			isPTImp
		};
	};

	/**
	 * @return false if this ship (and target ship) can attack at day shelling phase.
	 */
	KC3Ship.prototype.canDoDayShellingAttack = function(targetShipMasterId = 0) {
		if(this.isDummy() || this.isAbsent()) { return false; }
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		const isThisSubmarine = this.isSubmarine();
		const isHayasuiKaiWithTorpedoBomber = this.masterId === 352 && this.hasEquipmentType(2, 8);
		const isThisCarrier = this.isCarrier() || isHayasuiKaiWithTorpedoBomber;
		if(isThisCarrier) {
			if(this.isTaiha()) return false;
			const isNotCvb = this.master().api_stype !== 18;
			if(isNotCvb && this.isStriped()) return false;
			if(targetShipType.isSubmarine) return this.canDoASW();
			// can not attack land installation if dive bomber equipped
			if(targetShipType.isLand && this.hasNonZeroSlotEquipmentType(2, 7)) return false;
			// can not attack if no bomber with slot > 0 equipped
			return this.equipment().some((g, i) => this.slots[i] > 0 && g.isAirstrikeAircraft());
		}
		// submarines can only landing attack against land installation
		if(isThisSubmarine) return this.estimateLandingAttackType(targetShipMasterId) > 0;
		// can attack any enemy ship type by default
		return true;
	};

	/**
	 * @return true if this ship (and target ship) can do closing torpedo attack.
	 */
	KC3Ship.prototype.canDoClosingTorpedo = function(targetShipMasterId = 0) {
		if(this.isDummy() || this.isAbsent()) { return false; }
		if(this.isStriped()) return false;
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		if(targetShipType.isSubmarine || targetShipType.isLand) return false;
		// DD, CL, CLT, CA, CAV, AV, SS, SSV, FBB, BB, BBV, CT
		const isTorpedoStype = [2, 3, 4, 5, 6, 8, 9, 10, 13, 14, 18, 21].includes(this.master().api_stype);
		return isTorpedoStype && this.nakedStats("tp") > 0;
	};

	/**
	 * @return the landing attack kind ID, return 0 if can not attack.
	 */
	KC3Ship.prototype.estimateLandingAttackType = function(targetShipMasterId = 0) {
		const targetShip = KC3Master.ship(targetShipMasterId);
		if(!this.masterId || !targetShip) return 0;
		if(targetShip.api_soku === 0) {
			// most priority: Toku Daihatsu + 11th Tank
			if(this.hasEquipment(230)) return 5;
			// Abyssal hard land installation could be landing attacked
			const isTargetLandable =
				[1668, 1669, 1670, 1671, 1672, // Isolated Island Princess
					1665, 1666, 1667, // Artillery Imp
					1653, 1654, 1655, 1656, 1657, 1658, // Supply Depot Princess
					// Summer Supply Depot Princess not counted?
				].includes(targetShipMasterId);
			const isThisSubmarine = this.isSubmarine();
			// T2 Tank
			if(this.hasEquipment(167)) {
				if(isThisSubmarine) return 4;
				if(isTargetLandable) return 4;
			}
			if(isTargetLandable) {
				// T89 Tank
				if(this.hasEquipment(166)) return 3;
				// Toku Daihatsu
				if(this.hasEquipment(193)) return 2;
				// Daihatsu
				if(this.hasEquipment(68)) return 1;
			}
		}
		return 0;
	};

	/**
	 * Divide installation into KC3-unique types
	 */
	KC3Ship.prototype.getInstallationEnemyType = function(targetShipMasterId = 0, precap = true){
		const targetShip = KC3Master.ship(targetShipMasterId); 
		if(!this.masterId || !targetShip) { return 0; }
		if (this.estimateTargetShipType(targetShipMasterId).isLand === false ) { return 0; } 

		/* Installation types
		Type 1 : Soft-skinned
		Type 2: Artillery Imps/Pillbox
		Type 3: Isolated Island Princess
		Type 4: Supply Depot Princess (NEET Hime), postcap
		*/
		
		// Supply Depot Princess
		if([1653, 1654, 1655, 1656, 1657, 1658].includes(targetShipMasterId)){ 
			// Supply Princess unique case, takes soft-skinned pre-cap but unique post-cap
				return precap ? 1 : 4;
		}
		// Pillbox	
		else if([1665, 1666, 1667].includes(targetShipMasterId)){ 
				return 2;
		}
			
		// Isolated Island Princess
		else if([1668, 1669, 1670, 1671, 1672].includes(targetShipMasterId)){ 
				return 3;
		}

		else { return 1; }
	};

	/**
	 * Estimate day time attack type of this ship.
	 * Only according ship type and equipment, ignoring factors such as ship status, target-able.
	 * @param {number} targetShipMasterId - a Master ID of being attacked ship, used to indicate some
	 *        special attack types. eg: attacking a submarine, landing attack an installation.
	 *        The ID can be just an example to represent this type of target.
	 * @param {boolean} trySpTypeFirst - specify true if want to estimate special attack type.
	 * @param {number} airBattleId - air battle result id, to indicate if special attacks can be triggered,
	 *        special attacks require AS / AS +, default is AS+.
	 * @return {Array} day time attack type constants tuple:
	 *         [name, regular attack id / cutin id / landing id, cutin name, modifier].
	 *         cutin id is from `api_hougeki?.api_at_type` which indicates the special attacks.
	 *         NOTE: Not take 'can not be targeted' into account yet,
	 *         such as: CV/CVB against submarine; submarine against land installation;
	 *         asw aircraft all lost against submarine; torpedo bomber only against land,
	 *         should not pass targetShipMasterId at all for these scenes.
	 * @see https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/kcmemo.md#%E6%94%BB%E6%92%83%E7%A8%AE%E5%88%A5
	 * @see BattleMain.swf#battle.models.attack.AttackData#setOptionsAtHougeki - client side codes of day attack type.
	 * @see BattleMain.swf#battle.phase.hougeki.PhaseHougekiBase - client side hints of special cutin attack type.
	 * @see estimateNightAttackType
	 * @see canDoOpeningTorpedo
	 * @see canDoDayShellingAttack
	 * @see canDoASW
	 * @see canDoClosingTorpedo
	 */
	KC3Ship.prototype.estimateDayAttackType = function(targetShipMasterId = 0, trySpTypeFirst = false,
			airBattleId = 1) {
		if(this.isDummy()) { return []; }
		// if attack target known, will give different attack according target ship
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		const isThisCarrier = this.isCarrier();
		const isThisSubmarine = this.isSubmarine();
		
		const isAirSuperiorityBetter = airBattleId === 1 || airBattleId === 2;
		const hasRecon = this.hasNonZeroSlotEquipmentType(2, [10, 11]);
		if(trySpTypeFirst && hasRecon && isAirSuperiorityBetter) {
			/*
			 * To estimate if can do day time special attacks (aka Artillery Spotting).
			 * In game, special attack types are judged and given by server API result.
			 * By equip compos, multiply types are possible to be selected to trigger, such as
			 * CutinMainMain + Double, CutinMainAPShell + CutinMainRadar + CutinMainSecond.
			 * Here just check by strictness & modifier desc order and return one of them.
			 */
			const mainGunCnt = this.countEquipmentType(2, [1, 2, 3]);
			const apShellCnt = this.countEquipmentType(2, 19);
			if(mainGunCnt >= 2 && apShellCnt >= 1) return ["Cutin", 6, "CutinMainMain", 1.5];
			const secondaryCnt = this.countEquipmentType(2, 4);
			if(mainGunCnt >= 1 && secondaryCnt >= 1 && apShellCnt >= 1)
				return ["Cutin", 5, "CutinMainApshell", 1.3];
			const radarCnt = this.countEquipmentType(2, [12, 13]);
			if(mainGunCnt >= 1 && secondaryCnt >= 1 && radarCnt >= 1)
				return ["Cutin", 4, "CutinMainRadar", 1.2];
			if(mainGunCnt >= 1 && secondaryCnt >= 1) return ["Cutin", 3, "CutinMainSecond", 1.1];
			if(mainGunCnt >= 2) return ["Cutin", 2, "DoubleAttack", 1.2];
			// btw, ["Cutin", 1, "Laser"] no longer exists now
		} else if(trySpTypeFirst && isThisCarrier && isAirSuperiorityBetter) {
			// day time carrier shelling cut-in
			// http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#FAcutin
			// https://twitter.com/_Kotoha07/status/907598964098080768
			// https://twitter.com/arielugame/status/908343848459317249
			const fighterCnt = this.countNonZeroSlotEquipmentType(2, 6);
			const diveBomberCnt = this.countNonZeroSlotEquipmentType(2, 7);
			const torpedoBomberCnt = this.countNonZeroSlotEquipmentType(2, 8);
			if(diveBomberCnt >= 1 && torpedoBomberCnt >= 1 && fighterCnt >= 1)
				return ["Cutin", 7, "CutinFDBTB", 1.25];
			if(diveBomberCnt >= 2 && torpedoBomberCnt >= 1)
				return ["Cutin", 7, "CutinDBDBTB", 1.2];
			if(diveBomberCnt >= 1 && torpedoBomberCnt >= 1) return ["Cutin", 7, "CutinDBTB", 1.15];
		}
		
		// is target a land installation
		if(targetShipType.isLand) {
			const landingAttackType = this.estimateLandingAttackType(targetShipMasterId);
			if(landingAttackType > 0) {
				return ["LandingAttack", landingAttackType];
			}
			const hasRocketLauncher = this.hasEquipmentType(2, 37);
			// no such ID -1, just mean higher priority
			if(hasRocketLauncher) return ["Rocket", -1];
		}
		// is this ship Hayasui Kai
		if(this.masterId === 352) {
			if(targetShipType.isSubmarine) {
				// air attack if asw aircraft equipped
				const aswEquip = this.equipment().find(g => g.isAswAircraft(false));
				return aswEquip ? ["AirAttack", 1] : ["DepthCharge", 2];
			}
			// air attack if torpedo bomber equipped, otherwise fall back to shelling
			if(this.hasEquipmentType(2, 8))
				return ["AirAttack", 1];
			else
				return ["SingleAttack", 0];
		}
		if(isThisCarrier) {
			return ["AirAttack", 1];
		}
		// only torpedo attack possible if this ship is submarine (but not shelling phase)
		if(isThisSubmarine) {
			return ["Torpedo", 3];
		}
		if(targetShipType.isSubmarine) {
			const stype = this.master().api_stype;
			// CAV, BBV, AV, LHA can only air attack against submarine
			return ([6, 10, 16, 17].includes(stype)) ? ["AirAttack", 1] : ["DepthCharge", 2];
		}
		
		// default single shelling fire attack
		return ["SingleAttack", 0];
	};

	/**
	 * @return true if this ship (and target ship) can attack at night.
	 */
	KC3Ship.prototype.canDoNightAttack = function(targetShipMasterId = 0) {
		// no count for escaped ship too
		if(this.isDummy() || this.isAbsent()) { return false; }
		// no ship can night attack on taiha
		if(this.isTaiha()) return false;
		const initYasen = this.master().api_houg[0] + this.master().api_raig[0];
		const isThisCarrier = this.isCarrier();
		// even carrier can do shelling or air attack if her yasen power > 0 (no matter chuuha)
		// currently known ships: Graf / Graf Kai, Saratoga, Taiyou Kai Ni
		if(isThisCarrier && initYasen > 0) return true;
		// carriers without yasen power can do air attack under some conditions:
		if(isThisCarrier) {
			// only CVB can air attack on chuuha (taiha already excluded)
			const isNotCvb = this.master().api_stype !== 18;
			if(isNotCvb && this.isStriped()) return false;
			// Ark Royal (Kai) can air attack without NOAP if Swordfish variants equipped and slot > 0
			if([515, 393].includes(this.masterId)
				&& this.hasNonZeroSlotEquipment([242, 243, 244])) return true;
			// night aircraft + NOAP equipped
			return this.canCarrierNightAirAttack();
		}
		// can not night attack for any ship type if initial FP + TP is 0
		return initYasen > 0;
	};

	/**
	 * @return true if a carrier can do air attack at night thank to night aircraft,
	 *         which should be given via `api_n_mother_list`, not judged by client side.
	 * @see canDoNightAttack - those yasen power carriers not counted in `api_n_mother_list`.
	 * @see http://wikiwiki.jp/kancolle/?%CC%EB%C0%EF#NightCombatByAircrafts
	 */
	KC3Ship.prototype.canCarrierNightAirAttack = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		if(this.isCarrier()) {
			const hasNightAvPersonnel = this.hasEquipment([258, 259]);
			const hasNightAircraft = this.hasEquipmentType(3, KC3GearManager.nightAircraftType3Ids);
			const isThisSaratogaMk2 = this.masterId === 545;
			const isThisArkRoyal = [515, 393].includes(this.masterId);
			const isSwordfishArkRoyal = isThisArkRoyal && this.hasEquipment([242, 243, 244]);
			// if night aircraft + (NOAP equipped / on Saratoga Mk.2),
			// Swordfish variants are counted as night aircraft for Ark Royal + NOAP
			if((hasNightAircraft && (hasNightAvPersonnel || isThisSaratogaMk2))
				|| (hasNightAvPersonnel && isSwordfishArkRoyal))
				return true;
		}
		return false;
	};

	/**
	 * Estimate night battle attack type of this ship.
	 * Also just give possible attack type, no responsibility to check can do attack at night,
	 * or that ship can be targeted or not, etc.
	 * @param {number} targetShipMasterId - a Master ID of being attacked ship.
	 * @param {boolean} trySpTypeFirst - specify true if want to estimate special attack type.
	 * @return {Array} night battle attack type constants tuple: [name, cutin id, cutin name, modifier].
	 *         cutin id is partially from `api_hougeki.api_sp_list` which indicates the special attacks.
	 * @see BattleMain.swf#battle.models.attack.AttackData#setOptionsAtNight - client side codes of night attack type.
	 * @see BattleMain.swf#battle.phase.night.PhaseAttack - client side hints of special cutin attack type.
	 * @see estimateDayAttackType
	 * @see canDoNightAttack
	 */
	KC3Ship.prototype.estimateNightAttackType = function(targetShipMasterId = 0, trySpTypeFirst = false) {
		if(this.isDummy()) { return []; }
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		const isThisCarrier = this.isCarrier();
		const isThisSubmarine = this.isSubmarine();
		const stype = this.master().api_stype;
		const isThisLightCarrier = stype === 7;
		const isThisDestroyer = stype === 2;
		
		const torpedoCnt = this.countEquipmentType(2, [5, 32]);
		// simulate server-side night air attack flag: `api_n_mother_list`
		const isCarrierNightAirAttack = isThisCarrier && this.canCarrierNightAirAttack();
		if(trySpTypeFirst && !targetShipType.isSubmarine) {
			// to estimate night special attacks, which should be given by server API result.
			// will not trigger if this ship is taiha or targeting submarine.
			
			// carrier night cut-in, NOAP or Saratoga Mk.II needed
			if(isCarrierNightAirAttack) {
				// http://wikiwiki.jp/kancolle/?%CC%EB%C0%EF#x397cac6
				// https://twitter.com/Nishisonic/status/911143760544751616
				const nightFighterCnt = this.countNonZeroSlotEquipmentType(3, 45);
				const nightTBomberCnt = this.countNonZeroSlotEquipmentType(3, 46);
				// Fighter Bomber Iwai
				const specialDBomberCnt = this.countNonZeroSlotEquipment([154]);
				// Swordfish variants
				const specialTBomberCnt = this.countNonZeroSlotEquipment([242, 243, 244]);
				if(nightFighterCnt >= 2 && nightTBomberCnt >= 1) return ["Cutin", 6, "CutinNFNFNTB", 1.25];
				if(nightFighterCnt >= 3) return ["Cutin", 6, "CutinNFNFNF", 1.18];
				if(nightFighterCnt >= 2 && specialDBomberCnt >= 1) return ["Cutin", 6, "CutinNFNFFBI", 1.18];
				if(nightFighterCnt >= 2 && specialTBomberCnt >= 1) return ["Cutin", 6, "CutinNFNFSF", 1.18];
				if(nightFighterCnt >= 1 && specialTBomberCnt >= 2) return ["Cutin", 6, "CutinNFSFSF", 1.18];
				if(nightFighterCnt >= 1 && specialDBomberCnt >= 1 && specialTBomberCnt >= 1)
					return ["Cutin", 6, "CutinNFFBISF", 1.18];
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 1 && specialDBomberCnt >= 1)
					return ["Cutin", 6, "CutinNFNTBFBI", 1.18];
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 1 && specialTBomberCnt >= 1)
					return ["Cutin", 6, "CutinNFNTBSF", 1.18];
				// https://twitter.com/imoDer_Tw/status/968294965745893377
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 2) return ["Cutin", 6, "CutinNFNTBNTB", 1.25];
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 1) return ["Cutin", 6, "CutinNFNTB", 1.2];
			} else {
				// special torpedo radar cut-in for destroyers since 2017-10-25
				if(isThisDestroyer && torpedoCnt >= 1) {
					// according tests, any radar with accuracy stat >= 3 capable,
					// even large radars (Kasumi K2 can equip), air radars okay too, see:
					// https://twitter.com/nicolai_2501/status/923172168141123584
					// https://twitter.com/nicolai_2501/status/923175256092581888
					const hasCapableRadar = this.equipment(true).some(gear => gear.isHighAccuracyRadar());
					const hasSkilledLookout = this.hasEquipmentType(2, 39);
					const smallMainGunCnt = this.countEquipmentType(2, 1);
					// http://wikiwiki.jp/kancolle/?%CC%EB%C0%EF#dfcb6e1f
					if(hasCapableRadar && hasSkilledLookout)
						return ["Cutin", 8, "CutinTorpRadarLookout", 1.25];
					if(hasCapableRadar && smallMainGunCnt >= 1) {
						// https://twitter.com/ayanamist_m2/status/944176834551222272
						const has127TwinGunModelD2 = this.hasEquipment(267);
						return ["Cutin", 7, "CutinMainTorpRadar", 1.3 * (has127TwinGunModelD2 ? 1.25 : 1)];
					}
				}
				// special torpedo cut-in for late model submarine torpedo
				const lateTorpedoCnt = this.countEquipment([213, 214]);
				const submarineRadarCnt = this.countEquipmentType(2, 51);
				if(lateTorpedoCnt >= 1 && submarineRadarCnt >= 1) return ["Cutin", 3, "CutinTorpTorpTorp", 1.75];
				if(lateTorpedoCnt >= 2) return ["Cutin", 3, "CutinTorpTorpTorp", 1.6];
				
				if(torpedoCnt >= 2) return ["Cutin", 3, "CutinTorpTorpTorp", 1.5];
				const mainGunCnt = this.countEquipmentType(2, [1, 2, 3, 38]);
				if(mainGunCnt >= 3) return ["Cutin", 5, "CutinMainMainMain", 2.0];
				const secondaryCnt = this.countEquipmentType(2, 4);
				if(mainGunCnt === 2 && secondaryCnt >= 1) return ["Cutin", 4, "CutinMainMainSecond", 1.75];
				if((mainGunCnt === 2 && secondaryCnt === 0 && torpedoCnt === 1) ||
					(mainGunCnt === 1 && torpedoCnt === 1)) return ["Cutin", 2, "CutinTorpTorpMain", 1.3];
				// double attack can be torpedo attack animation if topmost slot is torpedo
				if((mainGunCnt === 2 && secondaryCnt === 0 && torpedoCnt === 0) ||
					(mainGunCnt === 1 && secondaryCnt >= 1) ||
					(secondaryCnt >= 2 && torpedoCnt <= 1)) return ["Cutin", 1, "DoubleAttack", 1.2];
			}
		}
		
		if(targetShipType.isLand) {
			const landingAttackType = this.estimateLandingAttackType(targetShipMasterId);
			if(landingAttackType > 0) {
				return ["LandingAttack", landingAttackType];
			}
			const hasRocketLauncher = this.hasEquipmentType(2, 37);
			if(hasRocketLauncher) return ["Rocket", -1];
		}
		// priority to use server flag, but impossible to test on abyssal below for now
		if(isCarrierNightAirAttack) {
			return ["AirAttack", 1];
		}
		if(targetShipType.isSubmarine && isThisLightCarrier) {
			return ["DepthCharge", 2];
		}
		if(isThisCarrier) {
			// these abyssal ships can only be shelling attacked
			const isSpecialAbyssal = [
				1679, 1680, 1681, 1682, 1683, // Lycoris Princess
				1711, 1712, 1713, // Jellyfish Princess
				].includes[targetShipMasterId];
			const isSpecialCarrier = [
				432, 353, // Graf & Graf Kai
				433 // Saratoga (base form)
				].includes(this.masterId);
			if(isSpecialCarrier || isSpecialAbyssal) return ["SingleAttack", 0];
			// here just indicates 'attack type', not 'can attack or not', see canDoNightAttack
			// Taiyou Kai Ni fell back to shelling attack if no bomber equipped, but ninja changed by devs.
			// now she will air attack against surface ships, but no plane appears if no aircraft equipped.
			return ["AirAttack", 1];
		}
		if(isThisSubmarine) {
			return ["Torpedo", 3];
		}
		if(targetShipType.isSubmarine) {
			// CAV, BBV, AV, LHA
			return ([6, 10, 16, 17].includes(stype)) ? ["AirAttack", 1] : ["DepthCharge", 2];
		}
		
		// torpedo attack if any torpedo equipped at top most, otherwise single shelling fire
		const topGear = this.equipment().find(gear => gear.exists() &&
			[1, 2, 3].includes(gear.master().api_type[1]));
		return topGear && topGear.master().api_type[1] === 3 ? ["Torpedo", 3] : ["SingleAttack", 0];
	};

	/**
	 * Get current shelling attack accuracy related info of this ship.
	 * NOTE: Only attacker accuracy part, not take defender evasion part into account at all, not final hit/critical rate.
	 * @param {number} formationModifier - see #estimateShellingFormationModifier.
	 * @param {boolean} applySpAttackModifiers - if special equipment and attack modifiers should be applied.
	 * @return {Object} accuracy factors of this ship.
	 * @see http://kancolle.wikia.com/wiki/Combat/Accuracy_and_Evasion
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6
	 * @see https://twitter.com/Nishisonic/status/890202416112480256
	 */
	KC3Ship.prototype.shellingAccuracy = function(formationModifier = 1, applySpAttackModifiers = true) {
		if(this.isDummy()) { return {}; }
		const byLevel = 2 * Math.sqrt(this.level - 1);
		// formula from PSVita is sqrt(1.5 * lk) anyway
		const byLuck = 1.5 * Math.sqrt(this.lk[0]);
		const byEquip = -this.nakedStats("ac");
		const byImprove = this.equipment(true)
			.map(g => g.accStatImprovementBonus("fire"))
			.sumValues();
		const byGunfit = this.shellingGunFitAccuracy();
		const battleConds = this.collectBattleConditions();
		const moraleModifier = this.moraleEffectLevel([1, 0.5, 0.8, 1, 1.2], battleConds.isOnBattle);
		const basic = 90 + byLevel + byLuck + byEquip + byImprove;
		const beforeSpModifier = basic * formationModifier * moraleModifier + byGunfit;
		let artillerySpottingModifier = 1;
		// there is trigger chance rate for Artillery Spotting itself
		if(applySpAttackModifiers) {
			artillerySpottingModifier = (type => {
				if(type[0] === "Cutin") {
					// ID from `api_hougeki.api_at_type`, see #estimateDayAttackType:
					// [regular attack, Laser, DA, Main Second, Main Radar, Main Second AP, Main Main AP, CVCI]
					// modifier for CVCI still unknown
					return [0, 0, 1.1, 1.3, 1.5, 1.3, 1.2, 1][type[1]] || 1;
				}
				return 1;
			})(this.estimateDayAttackType(undefined, true, battleConds.airBattleId));
		}
		const apShellModifier = (() => {
			// AP Shell combined with Large cal. main gun only mainly for battleships
			const hasApShellAndMainGun = this.hasEquipmentType(2, 19) && this.hasEquipmentType(2, 3);
			if(hasApShellAndMainGun) {
				const hasSecondaryGun = this.hasEquipmentType(2, 4);
				const hasRadar = this.hasEquipmentType(2, [12, 13]);
				if(hasRadar && hasSecondaryGun) return 1.3;
				if(hasRadar) return 1.25;
				if(hasSecondaryGun) return 1.2;
				return 1.1;
			}
			return 1;
		})();
		// penalty for combined fleets under verification
		const accuracy = Math.floor(beforeSpModifier * artillerySpottingModifier * apShellModifier);
		return {
			accuracy,
			basicAccuracy: basic,
			preSpAttackAccuracy: beforeSpModifier,
			equipmentStats: byEquip,
			equipImprovement: byImprove,
			equipGunFit: byGunfit,
			moraleModifier,
			formationModifier,
			artillerySpottingModifier,
			apShellModifier
		};
	};

	/**
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6#hitterm1
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6#avoidterm1
	 */
	KC3Ship.prototype.estimateShellingFormationModifier = function(
			playerFormationId = ConfigManager.aaFormation,
			enemyFormationId = 0,
			type = "accuracy") {
		let modifier = 1;
		switch(type) {
			case "accuracy":
				// Default is no bonus for regular fleet
				// Still unknown for combined fleet formation
				// Line Ahead, Diamond:
				modifier = 1;
				switch(playerFormationId) {
					case 2: // Double Line, cancelled by Line Abreast
						modifier = enemyFormationId === 5 ? 1.0 : 1.2;
						break;
					case 4: // Echelon, cancelled by Line Ahead
						modifier = enemyFormationId === 1 ? 1.0 : 1.2;
						break;
					case 5: // Line Abreast, cancelled by Echelon
						modifier = enemyFormationId === 4 ? 1.0 : 1.2;
						break;
					case 6:{// Vanguard, depends on fleet position
						const [shipPos, shipCnt] = this.fleetPosition(),
							isGuardian = shipCnt >= 4 && shipPos >= Math.floor(shipCnt / 2);
						modifier = isGuardian ? 1.2 : 0.8;
						break;
					}
				}
				break;
			case "evasion":
				// Line Ahead, Double Line:
				modifier = 1;
				switch(playerFormationId) {
					case 3: // Diamond
						modifier = 1.1;
						break;
					case 4: // Echelon, enhanced by Double Line / Echelon unknown
						modifier = 1.2;
						break;
					case 5: // Line Abreast, enhanced by Echelon / Line Abreast unknown
						modifier = 1.3;
						break;
					case 6:{// Vanguard, depends on fleet position and ship type
						const [shipPos, shipCnt] = this.fleetPosition(),
							isGuardian = shipCnt >= 4 && shipPos >= (Math.floor(shipCnt / 2) + 1),
							isThisDestroyer = this.master().api_stype === 2;
						modifier = isThisDestroyer ?
							(isGuardian ? 1.4 : 1.2) :
							(isGuardian ? 1.2 : 1.05);
						break;
					}
				}
				break;
			default:
				console.warn("Unknown modifier type:", type);
		}
		return modifier;
	};

	/**
	 * Get current shelling accuracy bonus (or penalty) from equipped guns.
	 * @see http://kancolle.wikia.com/wiki/Combat/Overweight_Penalty_and_Fit_Gun_Bonus
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6#fitarms
	 */
	KC3Ship.prototype.shellingGunFitAccuracy = function(time = "day") {
		if(this.isDummy()) { return 0; }
		var result = 0;
		// Fit bonus or overweight penalty for ship types:
		const stype = this.master().api_stype;
		const ctype = this.master().api_ctype;
		switch(stype) {
			case 2: // for Destroyers
				// fit bonus under verification since 2017-06-23
				const singleHighAngleMountCnt = this.countEquipment(229);
				// for Satsuki K2
				result += (this.masterId === 418 ? 5 : 0) * Math.sqrt(singleHighAngleMountCnt);
				// for Mutsuki class, Kamikaze class still unknown
				break;
			case 3:
			case 4:
			case 21: // for Light Cruisers
				// overhaul implemented in-game since 2017-06-23, still under verification
				const singleMountIds = [4, 11];
				const twinMountIds = [65, 119, 139];
				const tripleMainMountIds = [5, 235];
				const singleHighAngleMountId = 229;
				const isAganoClass = ctype === 41;
				const isOoyodoClass = ctype === 52;
				result = -2; // only fit bonus, but -2 fixed
				// for all CLs
				result += 4 * Math.sqrt(this.countEquipment(singleMountIds));
				// for twin mount on Agano class / Ooyodo class / general CLs
				result += (isAganoClass ? 8 : isOoyodoClass ? 5 : 3) *
					Math.sqrt(this.countEquipment(twinMountIds));
				// for 15.5cm triple main mount on Ooyodo class
				result += (isOoyodoClass ? 7 : 0) *
					Math.sqrt(this.countEquipment(tripleMainMountIds));
				// for 12.7cm single HA late model on Yura K2
				result += (this.masterId === 488 ? 10 : 0) *
					Math.sqrt(this.countEquipment(singleHighAngleMountId));
				break;
			case 5:
			case 6: // for Heavy Cruisers
				// fit bonus at night battle for 20.3cm variants
				if(time === "night") {
					const has203TwinGun = this.hasEquipment(6);
					const has203No3TwinGun = this.hasEquipment(50);
					const has203No2TwinGun = this.hasEquipment(90);
					// 20.3cm priority to No.3, No.2 might also
					result += has203TwinGun ? 10 : has203No2TwinGun ? 10 : has203No3TwinGun ? 15 : 0;
				}
				// for 15.5cm triple main mount on Mogami class
				const isMogamiClass = ctype === 9;
				if(isMogamiClass) {
					const count155TripleMainGun = this.countEquipment(5);
					const count155TripleMainGunKai = this.countEquipment(235);
					result += 2 * Math.sqrt(count155TripleMainGun) +
						5 * Math.sqrt(count155TripleMainGunKai);
				}
				// for 203mm/53 twin mount on Zara class
				const isZaraClass = ctype === 64;
				if(isZaraClass) {
					result += 1 * Math.sqrt(this.countEquipment(162));
				}
				break;
			case 8:
			case 9:
			case 10: // for Battleships
				// Large cal. main gun gives accuracy bonus if it's fit,
				// and accuracy penalty if it's overweight.
				const gunCountFitMap = {};
				this.equipment(true).forEach(g => {
					if(g.itemId && g.masterId && g.master().api_type[2] === 3) {
						const fitInfo = KC3Meta.gunfit(this.masterId, g.masterId);
						if(fitInfo && !fitInfo.unknown) {
							const gunCount = (gunCountFitMap[fitInfo.weight] || [0])[0];
							gunCountFitMap[fitInfo.weight] = [gunCount + 1, fitInfo];
						}
					}
				});
				$.each(gunCountFitMap, (_, fit) => {
					const count = fit[0];
					let value = fit[1][time] || 0;
					if(this.isMarried()) value *= fit[1].married || 1;
					result += value * Math.sqrt(count);
				});
				break;
			default:
				// not found for other ships
		}
		return result;
	};

	/**
	 * Get current shelling attack evasion related info of this ship.
	 * @param {number} formationModifier - see #estimateShellingFormationModifier
	 * @return {Object} evasion factors of this ship.
	 * @see http://kancolle.wikia.com/wiki/Combat/Accuracy_and_Evasion
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6
	 */
	KC3Ship.prototype.shellingEvasion = function(formationModifier = 1) {
		if(this.isDummy()) { return {}; }
		// already naked ev + equipment total ev stats
		const byStats = this.ev[0];
		const byEquip = this.equipmentTotalStats("houk");
		const byLuck = Math.sqrt(2 * this.lk[0]);
		const preCap = Math.floor((byStats + byLuck) * formationModifier);
		const postCap = preCap >= 65 ? Math.floor(55 + 2 * Math.sqrt(preCap - 65)) :
			preCap >= 40 ? Math.floor(40 + 3 * Math.sqrt(preCap - 40)) :
			preCap;
		const byImprove = this.equipment(true)
			.map(g => g.evaStatImprovementBonus("fire"))
			.sumValues();
		// under verification
		const stypeBonus = 0;
		const searchlightModifier = this.hasEquipmentType(1, 18) ? 0.2 : 1;
		const postCapForYasen = Math.floor(postCap + stypeBonus) * searchlightModifier;
		const fuelPercent = Math.floor(this.fuel / this.master().api_fuel_max * 100);
		const fuelPenalty = fuelPercent < 75 ? 75 - fuelPercent : 0;
		// final hit % = ucap(floor(lcap(attackerAccuracy - defenderEvasion) * defenderMoraleModifier)) + aircraftProficiencyBonus
		// capping limits its lower / upper bounds to [10, 96] + 1%, +1 since random number is 0-based, ranged in [0, 99]
		// ship morale modifier not applied here since 'evasion' may be looked reduced when sparkle
		const battleConds = this.collectBattleConditions();
		const moraleModifier = this.moraleEffectLevel([1, 1.4, 1.2, 1, 0.7], battleConds.isOnBattle);
		const evasion = Math.floor(postCap + byImprove - fuelPenalty);
		const evasionForYasen = Math.floor(postCapForYasen + byImprove - fuelPenalty);
		return {
			evasion,
			evasionForYasen,
			preCap,
			postCap,
			postCapForYasen,
			equipmentStats: byEquip,
			equipImprovement: byImprove,
			fuelPenalty,
			moraleModifier,
			formationModifier
		};
	};

	KC3Ship.prototype.equipmentAntiAir = function(forFleet) {
		return AntiAir.shipEquipmentAntiAir(this, forFleet);
	};

	KC3Ship.prototype.adjustedAntiAir = function() {
		const floor = AntiAir.specialFloor(this);
		return floor(AntiAir.shipAdjustedAntiAir(this));
	};

	KC3Ship.prototype.proportionalShotdownRate = function() {
		return AntiAir.shipProportionalShotdownRate(this);
	};

	KC3Ship.prototype.proportionalShotdown = function(n) {
		return AntiAir.shipProportionalShotdown(this, n);
	};

	// note:
	// - fixed shotdown makes no sense if the current ship is not in a fleet.
	// - formationId takes one of the following:
	//   - 1/4/5 (for line ahead / echelon / line abreast)
	//   - 2 (for double line)
	//   - 3 (for diamond)
	//   - 6 (for vanguard)
	// - all possible AACIs are considered and the largest AACI modifier
	//   is used for calculation the maximum number of fixed shotdown
	KC3Ship.prototype.fixedShotdownRange = function(formationId) {
		if(!this.onFleet()) return false;
		const fleetObj = PlayerManager.fleets[ this.onFleet() - 1 ];
		return AntiAir.shipFixedShotdownRangeWithAACI(this, fleetObj,
			AntiAir.getFormationModifiers(formationId || 1) );
	};

	KC3Ship.prototype.maxAaciShotdownBonuses = function() {
		return AntiAir.shipMaxShotdownAllBonuses( this );
	};

	/**
	 * Anti-air Equipment Attack Effect implemented since 2018-02-05 in-game.
	 * @return a tuple indicates the effect type ID and its term key.
	 */
	KC3Ship.prototype.estimateAntiAirEffectType = function() {
		const aaEquipType = (() => {
			// Escaped or sunk ship cannot anti-air
			if(this.isDummy() || this.isAbsent()) return -1;
			const stype = this.master().api_stype;
			// CAV, BBV, CV/CVL/CVB, AV can use Rocket Launcher K2
			const isStypeForRockeLaunK2 = [6, 7, 10, 11, 16, 18].includes(stype);
			// Type 3 Shell
			if(this.hasEquipmentType(2, 18)) {
				if(isStypeForRockeLaunK2 && this.hasEquipment(274)) return 5;
				return 4;
			}
			// 12cm 30tube Rocket Launcher Kai Ni
			if(isStypeForRockeLaunK2 && this.hasEquipment(274)) return 3;
			// 12cm 30tube Rocket Launcher
			if(this.hasEquipment(51)) return 2;
			// Any HA Mount
			if(this.hasEquipmentType(3, 16)) return 1;
			// Any AA Machine Gun
			if(this.hasEquipmentType(2, 21)) return 0;
			// Any Radar plus any Seaplane bomber with AA stat
			if(this.hasEquipmentType(3, 11) && this.equipment().some(
				g => g.masterId > 0 && g.master().api_type[2] === 11 && g.master().api_tyku > 0
			)) return 0;
			return -1;
		})();
		switch(aaEquipType) {
			case -1: return [-1, "None"];
			case 0: return [0, "Normal"];
			case 1: return [1, "HighAngleMount"];
			case 2: return [2, "RocketLauncher"];
			case 3: return [3, "RocketLauncherK2"];
			case 4: return [4, "Type3Shell"];
			case 5: return [5, "Type3ShellRockeLaunK2"];
			default: return [NaN, "Unknown"];
		}
	};

	/**
	 * To calculate 12cm 30tube Rocket Launcher Kai Ni (Rosa K2) trigger chance (for now),
	 * we need adjusted AA of ship, number of Rosa K2, ctype and luck stat.
	 * @see https://twitter.com/kankenRJ/status/979524073934893056 - current formula
	 * @see http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:2471 - old formula verifying thread
	 */
	KC3Ship.prototype.calcAntiAirEffectChance = function() {
		if(this.isDummy() || this.isAbsent()) return 0;
		// Number of 12cm 30tube Rocket Launcher Kai Ni
		let rosaCount = this.countEquipment(274);
		if(rosaCount === 0) return 0;
		// Not tested yet on more than 3 Rosa K2, capped to 3 just in case of exceptions
		rosaCount = rosaCount > 3 ? 3 : rosaCount;
		const rosaAdjustedAntiAir = 48;
		// 70 for Ise-class, 0 otherwise
		const classBonus = this.master().api_ctype === 2 ? 70 : 0;
		// Rounding to x%
		return Math.qckInt("floor",
			(this.adjustedAntiAir() + this.lk[0]) /
				(400 - (rosaAdjustedAntiAir + 30 + 40 * rosaCount + classBonus)) * 100,
			0);
	};

	/**
	 * Check known possible effects on equipment changed.
	 * @param {Object} newGearObj - the equipment just equipped, pseudo empty object if unequipped.
	 * @param {Object} oldGearObj - the equipment before changed, pseudo empty object if there was empty.
	 */
	KC3Ship.prototype.equipmentChangedEffects = function(newGearObj = {}, oldGearObj = {}) {
		if(!this.masterId) return {isShow: false};
		const gunFit = newGearObj.masterId ? KC3Meta.gunfit(this.masterId, newGearObj.masterId) : false;
		let isShow = gunFit !== false;
		const shipAacis = AntiAir.sortedPossibleAaciList(AntiAir.shipPossibleAACIs(this));
		isShow = isShow || shipAacis.length > 0;
		const oldEquipAsw = oldGearObj.masterId > 0 ? oldGearObj.master().api_tais : 0;
		const newEquipAsw = newGearObj.masterId > 0 ? newGearObj.master().api_tais : 0;
		const aswDiff = newEquipAsw - oldEquipAsw;
		const oaswPower = this.canDoOASW(aswDiff) ? this.antiSubWarfarePower(aswDiff) : false;
		isShow = isShow || (oaswPower !== false);
		// Possible TODO:
		// can opening torpedo
		// can cut-in (fire / air)
		// can night attack for CV
		// can night cut-in
		return {
			isShow,
			shipObj: this,
			gearObj: newGearObj.masterId ? newGearObj : false,
			gunFit,
			shipAacis,
			oaswPower,
		};
	};

	/* Expedition Supply Change Check */
	KC3Ship.prototype.perform = function(command,args) {
		try {
			args = $.extend({noFuel:0,noAmmo:0},args);
			command = command.slice(0,1).toUpperCase() + command.slice(1).toLowerCase();
			this["perform"+command].call(this,args);
		} catch (e) {
			console.error("Failed when perform" + command, e);
			return false;
		} finally {
			return true;
		}
	};
	KC3Ship.prototype.performSupply = function(args) {
		consumePending.call(this,0,{0:0,1:1,2:3,c: 1 - (this.isMarried() && 0.15),i: 0},[0,1,2],args);
	};
	KC3Ship.prototype.performRepair = function(args) {
		consumePending.call(this,1,{0:0,1:2,2:6,c: 1,i: 0},[0,1,2],args);
	};

	function consumePending(index,mapping,clear,args) {
		/*jshint validthis: true */
		if(!(this instanceof KC3Ship)) {
			throw new Error("Cannot modify non-KC3Ship instance!");
		}

		var
			self  = this,
			mult  = mapping.c,
			lastN = Object.keys(this.pendingConsumption).length - mapping.i;
		delete mapping.c;
		delete mapping.i;
		if(args.noFuel) delete mapping['0'];
		if(args.noAmmo) delete mapping['1'];

		/* clear pending consumption, by iterating each keys */
		var
			rmd = [0,0,0,0,0,0,0,0],
			lsFirst = this.lastSortie[0];

		Object.keys(this.pendingConsumption).forEach(function(shipConsumption,iterant){
			var
				dat = self.pendingConsumption[shipConsumption],
				rsc = [0,0,0,0,0,0,0,0],
				sid = self.lastSortie.indexOf(shipConsumption);
			// Iterate supplied ship part
			Object.keys(mapping).forEach(function(key){
				var val = dat[index][key] * (mapping[key]===3 ? 5 : mult);

				// Calibrate for rounding towards zero
				rmd[mapping[key]] += val % 1;
				rsc[mapping[key]] += Math.ceil(val) + parseInt(rmd[mapping[key]]);
				rmd[mapping[key]] %= 1;
				// Checks whether current iteration is last N pending item
				if((iterant < lastN) && (clear.indexOf(parseInt(key))>=0))
					dat[index][key] = 0;
			});

			console.log("Ship " + self.rosterId + " consumed", shipConsumption, sid,
				[iterant, lastN].join('/'), rsc.map(x => -x), dat[index]);

			// Store supplied resource count to database by updating the source
			KC3Database.Naverall({
				data: rsc
			},shipConsumption);

			if(dat.every(function(consumptionData){
				return consumptionData.every(function(resource){ return !resource; });
			})) {
				delete self.pendingConsumption[shipConsumption];
			}
			/* Comment Stopper */
		});

		var
			lsi = 1,
			lsk = "";
		while(lsi < this.lastSortie.length && this.lastSortie[lsi] != 'sortie0') {
			lsk = this.lastSortie[lsi];
			if(this.pendingConsumption[ lsk ]){
				lsi++;
			}else{
				this.lastSortie.splice(lsi,1);
			}
		}

		if(this.lastSortie.indexOf(lsFirst) < 0) {
			this.lastSortie.unshift(lsFirst);
		}

		KC3ShipManager.save();
	}

	/**
	 * Fill data of this Ship into predefined tooltip HTML elements. Used by Panel/Strategy Room.
	 * @param tooltipBox - the object of predefined tooltip HTML jq element
	 * @return return back the jq element of param `tooltipBox`
	 */
	KC3Ship.prototype.htmlTooltip = function(tooltipBox) {
		return KC3Ship.buildShipTooltip(this, tooltipBox);
	};
	KC3Ship.buildShipTooltip = function(shipObj, tooltipBox) {
		//const shipDb = WhoCallsTheFleetDb.getShipStat(shipObj.masterId);
		const nakedStats = shipObj.nakedStats(),
			  maxedStats = shipObj.maxedStats(),
			  maxDiffStats = {},
			  equipDiffStats = {},
			  modLeftStats = shipObj.modernizeLeftStats();
		Object.keys(maxedStats).map(s => {maxDiffStats[s] = maxedStats[s] - nakedStats[s];});
		Object.keys(nakedStats).map(s => {equipDiffStats[s] = nakedStats[s] - (shipObj[s]||[])[0];});
		const signedNumber = n => (n > 0 ? '+' : n === 0 ? '\u00b1' : '') + n;
		const replaceFilename = (file, newName) => file.slice(0, file.lastIndexOf("/") + 1) + newName;
		$(".ship_full_name .ship_masterId", tooltipBox).text("[{0}]".format(shipObj.masterId));
		$(".ship_full_name span.value", tooltipBox).text(shipObj.name());
		$(".ship_full_name .ship_yomi", tooltipBox).text(ConfigManager.info_ship_class_name ?
			KC3Meta.ctypeName(shipObj.master().api_ctype) :
			KC3Meta.shipReadingName(shipObj.master().api_yomi)
		);
		$(".ship_rosterId span", tooltipBox).text(shipObj.rosterId);
		$(".ship_stype", tooltipBox).text(shipObj.stype());
		$(".ship_level span.value", tooltipBox).text(shipObj.level);
		//$(".ship_level span.value", tooltipBox).addClass(shipObj.levelClass());
		$(".ship_hp span.hp", tooltipBox).text(shipObj.hp[0]);
		$(".ship_hp span.mhp", tooltipBox).text(shipObj.hp[1]);
		$(".ship_morale img", tooltipBox).attr("src",
			replaceFilename($(".ship_morale img", tooltipBox).attr("src"), shipObj.moraleIcon() + ".png")
		);
		$(".ship_morale span.value", tooltipBox).text(shipObj.morale);
		$(".ship_exp_next span.value", tooltipBox).text(shipObj.exp[1]);
		$(".stat_hp .current", tooltipBox).text(shipObj.hp[1]);
		$(".stat_hp .mod", tooltipBox).text(signedNumber(modLeftStats.hp))
			.toggle(!!modLeftStats.hp);
		$(".stat_fp .current", tooltipBox).text(shipObj.fp[0]);
		$(".stat_fp .mod", tooltipBox).text(signedNumber(modLeftStats.fp))
			.toggle(!!modLeftStats.fp);
		$(".stat_fp .equip", tooltipBox).text("({0})".format(nakedStats.fp))
			.toggle(!!equipDiffStats.fp);
		$(".stat_ar .current", tooltipBox).text(shipObj.ar[0]);
		$(".stat_ar .mod", tooltipBox).text(signedNumber(modLeftStats.ar))
			.toggle(!!modLeftStats.ar);
		$(".stat_ar .equip", tooltipBox).text("({0})".format(nakedStats.ar))
			.toggle(!!equipDiffStats.ar);
		$(".stat_tp .current", tooltipBox).text(shipObj.tp[0]);
		$(".stat_tp .mod", tooltipBox).text(signedNumber(modLeftStats.tp))
			.toggle(!!modLeftStats.tp);
		$(".stat_tp .equip", tooltipBox).text("({0})".format(nakedStats.tp))
			.toggle(!!equipDiffStats.tp);
		$(".stat_ev .current", tooltipBox).text(shipObj.ev[0]);
		$(".stat_ev .level", tooltipBox).text(signedNumber(maxDiffStats.ev))
			.toggle(!!maxDiffStats.ev);
		$(".stat_ev .equip", tooltipBox).text("({0})".format(nakedStats.ev))
			.toggle(!!equipDiffStats.ev);
		$(".stat_aa .current", tooltipBox).text(shipObj.aa[0]);
		$(".stat_aa .mod", tooltipBox).text(signedNumber(modLeftStats.aa))
			.toggle(!!modLeftStats.aa);
		$(".stat_aa .equip", tooltipBox).text("({0})".format(nakedStats.aa))
			.toggle(!!equipDiffStats.aa);
		$(".stat_ac .current", tooltipBox).text(shipObj.carrySlots());
		const canOasw = shipObj.canDoOASW();
		$(".stat_as .current", tooltipBox).text(shipObj.as[0])
			.toggleClass("oasw", canOasw);
		$(".stat_as .level", tooltipBox).text(signedNumber(maxDiffStats.as))
			.toggle(!!maxDiffStats.as);
		$(".stat_as .equip", tooltipBox).text("({0})".format(nakedStats.as))
			.toggle(!!equipDiffStats.as);
		$(".stat_as .mod", tooltipBox).text(signedNumber(modLeftStats.as))
			.toggle(!!modLeftStats.as);
		$(".stat_sp", tooltipBox).text(shipObj.speedName())
			.addClass(KC3Meta.shipSpeed(shipObj.speed, true));
		$(".stat_ls .current", tooltipBox).text(shipObj.ls[0]);
		$(".stat_ls .level", tooltipBox).text(signedNumber(maxDiffStats.ls))
			.toggle(!!maxDiffStats.ls);
		$(".stat_ls .equip", tooltipBox).text("({0})".format(nakedStats.ls))
			.toggle(!!equipDiffStats.ls);
		$(".stat_rn", tooltipBox).text(shipObj.rangeName())
			.toggleClass("RangeChanged", shipObj.range != shipObj.master().api_leng);
		$(".stat_lk .current", tooltipBox).text(shipObj.lk[0]);
		$(".stat_lk .luck", tooltipBox).text(signedNumber(modLeftStats.lk));
		$(".stat_lk .equip", tooltipBox).text("({0})".format(nakedStats.lk))
			.toggle(!!equipDiffStats.lk);
		if(!(ConfigManager.info_stats_diff & 1)){
			$(".equip", tooltipBox).hide();
		}
		if(!(ConfigManager.info_stats_diff & 2)){
			$(".mod,.level,.luck", tooltipBox).hide();
		}
		// Fill more stats need complex calculations
		KC3Ship.fillShipTooltipWideStats(shipObj, tooltipBox, canOasw);
		return tooltipBox;
	};
	KC3Ship.fillShipTooltipWideStats = function(shipObj, tooltipBox, canOasw = false) {
		const signedNumber = n => (n > 0 ? '+' : n === 0 ? '\u00b1' : '') + n;
		const optionalModifier = (m, showX1) => (showX1 || m !== 1 ? 'x' + m : "");
		// show possible critical power and mark capped power with different color
		const joinPowerAndCritical = (p, cp, cap) => (cap ? '<span class="power_capped">{0}</span>' : "{0}")
			.format(String(Math.qckInt("floor", p, 0))) + (!cp ? "" :
				(cap ? '(<span class="power_capped">{0}</span>)' : "({0})")
					.format(Math.qckInt("floor", cp, 0))
			);
		const onFleetNum = shipObj.onFleet();
		const battleConds = shipObj.collectBattleConditions();
		const attackTypeDay = shipObj.estimateDayAttackType();
		const warfareTypeDay = {
			"Torpedo"       : "Torpedo",
			"DepthCharge"   : "Antisub",
			"LandingAttack" : "AntiLand",
			"Rocket"        : "AntiLand"
			}[attackTypeDay[0]] || "Shelling";
		const isAswPowerShown = (canOasw && !shipObj.isOaswShip())
			|| (shipObj.canDoASW() && shipObj.onlyHasEquipmentType(1, [10, 15, 16, 32]));
		// Show ASW power if Opening ASW conditions met, or only ASW equipment equipped
		if(isAswPowerShown){
			let power = shipObj.antiSubWarfarePower();
			let criticalPower = false;
			let isCapped = false;
			const canShellingAttack = shipObj.canDoDayShellingAttack();
			const canOpeningTorp = shipObj.canDoOpeningTorpedo();
			const canClosingTorp = shipObj.canDoClosingTorpedo();
			if(ConfigManager.powerCapApplyLevel >= 1) {
				({power} = shipObj.applyPrecapModifiers(power, "Antisub",
					battleConds.engagementId, battleConds.formationId || 5));
			}
			if(ConfigManager.powerCapApplyLevel >= 2) {
				({power, isCapped} = shipObj.applyPowerCap(power, "Day", "Antisub"));
			}
			if(ConfigManager.powerCapApplyLevel >= 3) {
				if(ConfigManager.powerCritical) {
					criticalPower = shipObj.applyPostcapModifiers(
						power, "Antisub", undefined, undefined,
						true, attackTypeDay[0] === "AirAttack").power;
				}
				({power} = shipObj.applyPostcapModifiers(power, "Antisub"));
			}
			let attackTypeIndicators = !canShellingAttack ?
				KC3Meta.term("ShipAttackTypeNone") :
				KC3Meta.term("ShipAttackType" + attackTypeDay[0]);
			if(canOpeningTorp) attackTypeIndicators += ", {0}"
				.format(KC3Meta.term("ShipExtraPhaseOpeningTorpedo"));
			if(canClosingTorp) attackTypeIndicators += ", {0}"
				.format(KC3Meta.term("ShipExtraPhaseClosingTorpedo"));
			$(".dayAttack", tooltipBox).html(
				KC3Meta.term("ShipDayAttack").format(
					KC3Meta.term("ShipWarfareAntisub"),
					joinPowerAndCritical(power, criticalPower, isCapped),
					attackTypeIndicators
				)
			);
		} else {
			let combinedFleetBonus = 0;
			if(onFleetNum) {
				const powerBonus = shipObj.combinedFleetPowerBonus(
					battleConds.playerCombinedFleetType, battleConds.isEnemyCombined, warfareTypeDay
				);
				combinedFleetBonus = onFleetNum === 1 ? powerBonus.main :
					onFleetNum === 2 ? powerBonus.escort : 0;
			}
			let power = warfareTypeDay === "Torpedo" ?
				shipObj.shellingTorpedoPower(combinedFleetBonus) :
				shipObj.shellingFirePower(combinedFleetBonus);
			let criticalPower = false;
			let isCapped = false;
			const canShellingAttack = warfareTypeDay === "Torpedo" ||
				shipObj.canDoDayShellingAttack();
			const canOpeningTorp = shipObj.canDoOpeningTorpedo();
			const canClosingTorp = shipObj.canDoClosingTorpedo();
			const spAttackType = shipObj.estimateDayAttackType(undefined, true, battleConds.airBattleId);
			// Apply power cap by configured level
			if(ConfigManager.powerCapApplyLevel >= 1) {
				({power} = shipObj.applyPrecapModifiers(power, warfareTypeDay,
					battleConds.engagementId, battleConds.formationId));
			}
			if(ConfigManager.powerCapApplyLevel >= 2) {
				({power, isCapped} = shipObj.applyPowerCap(power, "Day", warfareTypeDay));
			}
			if(ConfigManager.powerCapApplyLevel >= 3) {
				if(ConfigManager.powerCritical) {
					criticalPower = shipObj.applyPostcapModifiers(
						power, warfareTypeDay, spAttackType, undefined,
						true, attackTypeDay[0] === "AirAttack").power;
				}
				({power} = shipObj.applyPostcapModifiers(power, warfareTypeDay,
					spAttackType));
			}
			let attackTypeIndicators = !canShellingAttack ? KC3Meta.term("ShipAttackTypeNone") :
				spAttackType[0] === "Cutin" ?
					KC3Meta.cutinTypeDay(spAttackType[1]) :
					KC3Meta.term("ShipAttackType" + attackTypeDay[0]);
			if(canOpeningTorp) attackTypeIndicators += ", {0}"
				.format(KC3Meta.term("ShipExtraPhaseOpeningTorpedo"));
			if(canClosingTorp) attackTypeIndicators += ", {0}"
				.format(KC3Meta.term("ShipExtraPhaseClosingTorpedo"));
			$(".dayAttack", tooltipBox).html(
				KC3Meta.term("ShipDayAttack").format(
					KC3Meta.term("ShipWarfare" + warfareTypeDay),
					joinPowerAndCritical(power, criticalPower, isCapped),
					attackTypeIndicators
				)
			);
		}
		const attackTypeNight = shipObj.estimateNightAttackType();
		const canNightAttack = shipObj.canDoNightAttack();
		const warfareTypeNight = {
			"Torpedo"       : "Torpedo",
			"DepthCharge"   : "Antisub",
			"LandingAttack" : "AntiLand",
			"Rocket"        : "AntiLand"
			}[attackTypeNight[0]] || "Shelling";
		if(attackTypeNight[0] === "AirAttack" && canNightAttack){
			let power = shipObj.nightAirAttackPower(battleConds.contactPlaneId == 102);
			let criticalPower = false;
			let isCapped = false;
			const spAttackType = shipObj.estimateNightAttackType(undefined, true);
			if(ConfigManager.powerCapApplyLevel >= 1) {
				({power} = shipObj.applyPrecapModifiers(power, "Shelling",
					battleConds.engagementId, battleConds.formationId, spAttackType,
					battleConds.isStartFromNight, battleConds.playerCombinedFleetType > 0));
			}
			if(ConfigManager.powerCapApplyLevel >= 2) {
				({power, isCapped} = shipObj.applyPowerCap(power, "Night", "Shelling"));
			}
			if(ConfigManager.powerCapApplyLevel >= 3) {
				if(ConfigManager.powerCritical) {
					criticalPower = shipObj.applyPostcapModifiers(
						power, "Shelling", undefined, undefined, true, true).power;
				}
				({power} = shipObj.applyPostcapModifiers(power, "Shelling"));
			}
			$(".nightAttack", tooltipBox).html(
				KC3Meta.term("ShipNightAttack").format(
					KC3Meta.term("ShipWarfareShelling"),
					joinPowerAndCritical(power, criticalPower, isCapped),
					spAttackType[0] === "Cutin" ?
						KC3Meta.cutinTypeNight(spAttackType[1]) :
						KC3Meta.term("ShipAttackType" + spAttackType[0])
				)
			);
		} else {
			let power = shipObj.nightBattlePower(battleConds.contactPlaneId == 102);
			let criticalPower = false;
			let isCapped = false;
			const spAttackType = shipObj.estimateNightAttackType(undefined, true);
			// Apply power cap by configured level
			if(ConfigManager.powerCapApplyLevel >= 1) {
				({power} = shipObj.applyPrecapModifiers(power, warfareTypeNight,
					battleConds.engagementId, battleConds.formationId, spAttackType,
					battleConds.isStartFromNight, battleConds.playerCombinedFleetType > 0));
			}
			if(ConfigManager.powerCapApplyLevel >= 2) {
				({power, isCapped} = shipObj.applyPowerCap(power, "Night", warfareTypeNight));
			}
			if(ConfigManager.powerCapApplyLevel >= 3) {
				if(ConfigManager.powerCritical) {
					criticalPower = shipObj.applyPostcapModifiers(
						power, warfareTypeNight, undefined, undefined, true).power;
				}
				({power} = shipObj.applyPostcapModifiers(power, warfareTypeNight));
			}
			let attackTypeIndicators = !canNightAttack ? KC3Meta.term("ShipAttackTypeNone") :
				spAttackType[0] === "Cutin" ?
					KC3Meta.cutinTypeNight(spAttackType[1]) :
					KC3Meta.term("ShipAttackType" + spAttackType[0]);
			$(".nightAttack", tooltipBox).html(
				KC3Meta.term("ShipNightAttack").format(
					KC3Meta.term("ShipWarfare" + warfareTypeNight),
					joinPowerAndCritical(power, criticalPower, isCapped),
					attackTypeIndicators
				)
			);
		}
		// TODO implement other types of accuracy
		const shellingAccuracy = shipObj.shellingAccuracy(
			shipObj.estimateShellingFormationModifier(battleConds.formationId, battleConds.enemyFormationId),
			true
		);
		$(".shellingAccuracy", tooltipBox).text(
			KC3Meta.term("ShipAccShelling").format(
				Math.qckInt("floor", shellingAccuracy.accuracy, 1),
				signedNumber(shellingAccuracy.equipmentStats),
				signedNumber(Math.qckInt("floor", shellingAccuracy.equipImprovement, 1)),
				signedNumber(Math.qckInt("floor", shellingAccuracy.equipGunFit, 1)),
				optionalModifier(shellingAccuracy.moraleModifier, true),
				optionalModifier(shellingAccuracy.artillerySpottingModifier),
				optionalModifier(shellingAccuracy.apShellModifier)
			)
		);
		const shellingEvasion = shipObj.shellingEvasion(
			shipObj.estimateShellingFormationModifier(battleConds.formationId, battleConds.enemyFormationId, "evasion")
		);
		$(".shellingEvasion", tooltipBox).text(
			KC3Meta.term("ShipEvaShelling").format(
				Math.qckInt("floor", shellingEvasion.evasion, 1),
				signedNumber(shellingEvasion.equipmentStats),
				signedNumber(Math.qckInt("floor", shellingEvasion.equipImprovement, 1)),
				signedNumber(-shellingEvasion.fuelPenalty),
				optionalModifier(shellingEvasion.moraleModifier, true)
			)
		);
		const [aaEffectTypeId, aaEffectTypeTerm] = shipObj.estimateAntiAirEffectType();
		$(".adjustedAntiAir", tooltipBox).text(
			KC3Meta.term("ShipAAAdjusted").format(
				"{0}{1}".format(
					shipObj.adjustedAntiAir(),
					/* Here indicates the type of AA ability, not the real attack animation in-game,
					 * only special AA effect types will show a banner text in-game,
					 * like the T3 Shell shoots or Rockets shoots,
					 * regular AA gun animation triggered by equipping AA gun, Radar+SPB or HA mount.
					 * btw1, 12cm Rocket Launcher non-Kai belongs to AA guns, no irregular attack effect.
					 * btw2, flagship will fall-back to the effect user if none has any attack effect.
					 */
					aaEffectTypeId > -1 ?
						" ({0})".format(
							aaEffectTypeId === 3 ?
								// Show a trigger chance for RosaK2 Defense, still unknown if with Type3 Shell
								"{0}:{1}%".format(KC3Meta.term("ShipAAEffect" + aaEffectTypeTerm), shipObj.calcAntiAirEffectChance()) :
								KC3Meta.term("ShipAAEffect" + aaEffectTypeTerm)
						) : ""
				)
			)
		);
		$(".propShotdownRate", tooltipBox).text(
				KC3Meta.term("ShipAAShotdownRate").format(
					Math.qckInt("floor", shipObj.proportionalShotdownRate() * 100, 1)
				)
			);
		const maxAaciParams = shipObj.maxAaciShotdownBonuses();
		if(maxAaciParams[0] > 0){
			$(".aaciMaxBonus", tooltipBox).text(
				KC3Meta.term("ShipAACIMaxBonus").format(
					"+{0} (x{1})".format(maxAaciParams[1], maxAaciParams[2])
				)
			);
		} else {
			$(".aaciMaxBonus", tooltipBox).text(
				KC3Meta.term("ShipAACIMaxBonus").format(KC3Meta.term("None"))
			);
		}
		// Not able to get following anti-air things if not on a fleet
		if(onFleetNum){
			const fixedShotdownRange = shipObj.fixedShotdownRange(ConfigManager.aaFormation);
			const fleetPossibleAaci = fixedShotdownRange[2];
			if(fleetPossibleAaci > 0){
				$(".fixedShotdown", tooltipBox).text(
					KC3Meta.term("ShipAAFixedShotdown").format(
						"{0}~{1} (x{2})".format(fixedShotdownRange[0], fixedShotdownRange[1],
							AntiAir.AACITable[fleetPossibleAaci].modifier)
					)
				);
			} else {
				$(".fixedShotdown", tooltipBox).text(
					KC3Meta.term("ShipAAFixedShotdown").format(fixedShotdownRange[0])
				);
			}
			const propShotdown = shipObj.proportionalShotdown(ConfigManager.imaginaryEnemySlot);
			const aaciFixedShotdown = fleetPossibleAaci > 0 ? AntiAir.AACITable[fleetPossibleAaci].fixed : 0;
			$.each($(".sd_title .aa_col", tooltipBox), function(idx, col){
				$(col).text(KC3Meta.term("ShipAAShotdownTitles").split("/")[idx] || "");
			});
			$(".bomberSlot span", tooltipBox).text(ConfigManager.imaginaryEnemySlot);
			$(".sd_both span", tooltipBox).text(
				// Both succeeded
				propShotdown + fixedShotdownRange[1] + aaciFixedShotdown + 1
			);
			$(".sd_prop span", tooltipBox).text(
				// Proportional succeeded only
				propShotdown + aaciFixedShotdown + 1
			);
			$(".sd_fixed span", tooltipBox).text(
				// Fixed succeeded only
				fixedShotdownRange[1] + aaciFixedShotdown + 1
			);
			$(".sd_fail span", tooltipBox).text(
				// Both failed
				aaciFixedShotdown + 1
			);
		} else {
			$(".fixedShotdown", tooltipBox).text(
				KC3Meta.term("ShipAAFixedShotdown").format("-"));
			$.each($(".sd_title .aa_col", tooltipBox), function(idx, col){
				$(col).text(KC3Meta.term("ShipAAShotdownTitles").split("/")[idx] || "");
			});
		}
		return tooltipBox;
	};
	KC3Ship.onShipTooltipOpen = function(event, ui) {
		const setStyleVar = (name, value) => {
			const shipTooltipStyle = $(ui.tooltip).children().children().get(0).style;
			shipTooltipStyle.removeProperty(name);
			shipTooltipStyle.setProperty(name, value);
		};
		// find which width of wide rows overflow, add slide animation to them
		// but animation might cost 10% more or less CPU even accelerated with GPU
		let maxOverflow = 0;
		$(".stat_wide div", ui.tooltip).each(function() {
			// scroll width only works if element is visible
			const sw = $(this).prop('scrollWidth'),
				w = $(this).width(),
				over = w - sw;
			maxOverflow = Math.min(maxOverflow, over);
			// allow overflow some pixels
			if(over < -8) { $(this).addClass("use-gpu slide"); }
		});
		setStyleVar("--maxOverflow", maxOverflow + "px");
		return true;
	};

	KC3Ship.prototype.deckbuilder = function() {
		var itemsInfo = {};
		var result = {
			id: this.masterId,
			lv: this.level,
			luck: this.lk[0],
			items: itemsInfo
		};

		var gearInfo;
		for(var i=0; i<5; ++i) {
			gearInfo = this.equipment(i).deckbuilder();
			if (gearInfo)
				itemsInfo["i".concat(i+1)] = gearInfo;
			else 
				break;
		}
		gearInfo = this.exItem().deckbuilder();
		if (gearInfo) {
			// #1726 Deckbuilder: if max slot not reach 5, `ix` will not be used,
			// which means i? > ship.api_slot_num will be considered as the ex-slot.
			var usedSlot = Object.keys(itemsInfo).length;
			if(usedSlot < 5) {
				itemsInfo["i".concat(usedSlot+1)] = gearInfo;
			} else {
				itemsInfo.ix = gearInfo;
			}
		}
		
		return result;
	};

})();
