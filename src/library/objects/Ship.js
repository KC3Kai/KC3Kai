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
		this.items = [-1,-1,-1,-1];
		// corresponds to "api_slot_ex" in the API,
		// which has special meanings on few values:
		// 0: ex slot is not available
		// -1: ex slot is available but nothing is equipped
		this.ex_item = 0;
		// "api_onslot" in API, also changed to length 5,
		// not sure it represent size of ex slot or not
		this.slots = [0,0,0,0,0];
		this.slotnum = 0;
		this.speed = 0;
		this.mod = [0,0,0,0,0];
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
				// git rid of unused 5th, guarantee equipment(4) is exItem
				this.items = data.api_slot.slice(0, 4);
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
	KC3Ship.prototype.master = function(){ return KC3Master.ship( this.masterId ); };
	KC3Ship.prototype.name = function(){ return KC3Meta.shipName( this.master().api_name ); };
	KC3Ship.prototype.stype = function(){ return KC3Meta.stype( this.master().api_stype ); };
	KC3Ship.prototype.equipment = function(slot){
		switch(typeof slot) {
			case 'number':
			case 'string':
				/* Number/String => converted as equipment slot key */
				return this.getGearManager().get( slot >= this.items.length ? this.ex_item : this.items[slot] );
			case 'boolean':
				/* Boolean => return all equipments with ex item if true */
				return slot ? this.equipment().concat(this.exItem())
					: this.equipment();
			case 'undefined':
				/* Undefined => returns whole equipment as equip object */
				return Array.apply(null, this.items)
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
	KC3Ship.prototype.isFast = function(){ return (this.speed || this.master().api_soku) >= 10; };
	KC3Ship.prototype.exItem = function(){ return this.getGearManager().get(this.ex_item); };
	KC3Ship.prototype.isStriped = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.5); };
	KC3Ship.prototype.isTaiha   = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.25) && !this.isRepaired(); };
	KC3Ship.prototype.speedName = function(){ return KC3Meta.shipSpeed(this.speed); };
	KC3Ship.prototype.rangeName = function(){ return KC3Meta.shipRange(this.range); };
	KC3Ship.getMarriedLevel = function(){ return 100; };
	KC3Ship.getMaxLevel = function(){ return 165; };
	KC3Ship.prototype.isMarried = function(){ return this.level >= KC3Ship.getMarriedLevel(); };
	KC3Ship.prototype.levelClass = function(){
		return this.level === KC3Ship.getMaxLevel() ? "married max" :
			this.level >= KC3Ship.getMarriedLevel() ? "married" :
			this.level >= 80  ? "high" :
			this.level >= 50  ? "medium" :
			"";
	};
	KC3Ship.prototype.moraleIcon = function(){
		return KC3Ship.moraleIcon(this.morale);
	};
	KC3Ship.moraleIcon = function(morale){
		return morale > 49 ? "4" : // sparkle
			morale > 29 ? "3" : // normal
			morale > 19 ? "2" : // orange face
			"1"; // red face
	};
	KC3Ship.prototype.moraleEffectLevel = function(valuesArray = [0, 1, 2, 3, 4]){
		return this.morale > 52 ? valuesArray[4] :
			this.morale > 32 ? valuesArray[3] :
			this.morale > 19 ? valuesArray[2] :
			this.morale >= 0 ? valuesArray[1] :
			valuesArray[0];
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
		if(this.rosterId===0){ return true; }
		return this.fuel >= this.master().api_fuel_max
			&& this.ammo >= this.master().api_bull_max;
	};

	KC3Ship.prototype.isNeedSupply = function(isEmpty){
		if(this.rosterId===0){ return false; }
		var
			fpc  = function(x,y){return Math.qckInt("round",(x / y) * 10);},
			fuel = fpc(this.fuel,this.master().api_fuel_max),
			ammo = fpc(this.ammo,this.master().api_bull_max);
		return Math.min(fuel,ammo) <= (ConfigManager.alert_supply) * (!isEmpty);
	};

	KC3Ship.prototype.onFleet = function(){
		var shipList = PlayerManager.fleets
			.map(fleet => fleet.ships)
			.reduce((acc, ships) => acc.concat(ships), []);
		return Math.qckInt("ceil", (shipList.indexOf(this.rosterId) + 1) / 6, 0);
	};

	KC3Ship.prototype.isRepaired = function(){
		return PlayerManager.repairShips.indexOf(this.rosterId) >= 0;
	};

	KC3Ship.prototype.isAway = function(){
		return this.onFleet() > 1 /* ensures not in main fleet */
			&& (KC3TimerManager.exped(this.onFleet()) || {active:false}).active; /* if there's a countdown on expedition, means away */
	};

	KC3Ship.prototype.isFree = function(){
		return !(this.isRepaired() || this.isAway());
	};

	KC3Ship.prototype.resetAfterHp = function(){
		this.afterHp[0] = this.hp[0];
		this.afterHp[1] = this.hp[1];
	};

	KC3Ship.prototype.applyRepair = function(){
		this.hp[0]  = this.hp[1];
		// also keep afterHp consistent
		this.resetAfterHp();
		this.morale = Math.max(40, this.morale);
		this.repair.fill(0);
	};

	/**
	 * Return max HP of a ship. Static method for library.
	 * Especially after marriage, api_taik[1] is hard to reach in game.
	 * @return false if ship ID belongs to abyssal or nonexistence
	 * @see http://wikiwiki.jp/kancolle/?%A5%B1%A5%C3%A5%B3%A5%F3%A5%AB%A5%C3%A5%B3%A5%AB%A5%EA
	 * @see https://github.com/andanteyk/ElectronicObserver/blob/develop/ElectronicObserver/Other/Information/kcmemo.md#%E3%82%B1%E3%83%83%E3%82%B3%E3%83%B3%E3%82%AB%E3%83%83%E3%82%B3%E3%82%AB%E3%83%AA%E5%BE%8C%E3%81%AE%E8%80%90%E4%B9%85%E5%80%A4
	 */
	KC3Ship.getMaxHp = function(masterId, currentLevel){
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
		return maxLimitHp && expected > maxLimitHp ? maxLimitHp : expected;
	};
	KC3Ship.prototype.maxHp = function(){
		return KC3Ship.getMaxHp(this.masterId, this.level);
	};

	/**
	 * Return total count of aircraft slots of a ship. Static method for library.
	 * @return -1 if ship ID belongs to abyssal or nonexistence
	 */
	KC3Ship.getCarrySlots = function(masterId){
		var maxeq = KC3Master.isNotRegularShip(masterId) ? undefined :
			(KC3Master.ship(masterId) || {}).api_maxeq;
		return Array.isArray(maxeq) ? maxeq.reduce((acc, v) => acc + v, 0) : -1;
	};
	KC3Ship.prototype.carrySlots = function(){
		return KC3Ship.getCarrySlots(this.masterId);
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
			result.docking = this.isRepaired() ?
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
	   returns an object: {fuel: <fuelCost>, ammo: <ammoCost>, steel: <steelCost>, bauxite: <bauxiteCost>}
	 */
	KC3Ship.prototype.calcResupplyCost = function(fuelPercent, ammoPercent, bauxiteNeeded, steelNeeded) {
		var self = this;
		var master = this.master();
		var fullFuel = master.api_fuel_max;
		var fullAmmo = master.api_bull_max;

		var mulRounded = function (a, percent) {
			return Math.floor( a * percent );
		};
		var marriageConserve = function (v) {
			return self.isMarried() ? Math.floor(0.85 * v) : v;
		};
		var result = {
			fuel: fuelPercent < 0 ? fullFuel - this.fuel : mulRounded(fullFuel, fuelPercent),
			ammo: ammoPercent < 0 ? fullAmmo - this.ammo : mulRounded(fullAmmo, ammoPercent)
		};
		// After testing, 85% is applied to supply cost, not max value
		result.fuel = marriageConserve(result.fuel);
		result.ammo = marriageConserve(result.ammo);
		if(!!bauxiteNeeded){
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
		if(!!steelNeeded){
			result.steel = this.calcJetsSteelCost();
		}
		return result;
	};

	/**
	 * Calculate steel cost of jet aircraft for 1 battle based on current slot size.
	 * returns total steel cost for this ship at this time
	 */
	KC3Ship.prototype.calcJetsSteelCost = function(currentSortieId) {
		var i, item, pc, self = this;
		var totalSteel = 0, consumedSteel = 0;
		for(i = 0; i < self.items.length; i++) {
			item = self.equipment(i);
			// Is Jet aircraft and left slot > 0
			if(item.masterId > 0 && item.master().api_type[2] == 57 && self.slots[i] > 0) {
				consumedSteel = Math.round(
					self.slots[i]
					* item.master().api_cost
					* KC3GearManager.jetBomberSteelCostRatioPerSlot
				) || 0;
				totalSteel += consumedSteel;
				if(!!currentSortieId) {
					pc = self.pendingConsumption[currentSortieId];
					if(!pc) {
						pc = [[0,0,0],[0,0,0],[0]];
						self.pendingConsumption[currentSortieId] = pc;
					}
					pc[2][0] -= consumedSteel;
				}
			}
		}
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
		if(!this.masterId) { return false; }
		const stats = {
			aa: this.aa[0],
			ar: this.ar[0],
			as: this.as[0],
			ev: this.ev[0],
			fp: this.fp[0],
			// Naked HP maybe mean HP before marriage
			hp: this.master().api_taik[0],
			// Luck can be only added by modernization
			lk: this.master().api_luck[0],
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
			if(equip.masterId > 0) {
				return equip.master()["api_" + apiName];
			}
			return undefined;
		});
	};

	KC3Ship.prototype.equipmentTotalStats = function(apiName, isExslotIncluded = true){
		var total = 0;
		this.equipment(isExslotIncluded).forEach(equip => {
			if(equip.masterId > 0) {
				total += (equip.master()["api_" + apiName] || 0);
			}
		});
		return total;
	};

	KC3Ship.prototype.nakedLoS = function(){
		return this.nakedStats("ls");
	};

	KC3Ship.prototype.equipmentTotalLoS = function (){
		return this.equipmentTotalStats("saku");
	};

	// estimated LoS without equipments based on WhoCallsTheFleetDb
	KC3Ship.prototype.estimateNakedLoS = function() {
		var losInfo = WhoCallsTheFleetDb.getLoSInfo( this.masterId );
		var retVal = WhoCallsTheFleetDb.estimateStat(losInfo, this.level);
		return retVal === false ? 0 : retVal;
	};

	KC3Ship.prototype.equipmentTotalImprovementBonus = function(attackType){
		return this.equipment(true)
			.map(gear => gear.attackPowerImprovementBonus(attackType))
			.reduce((acc, v) => acc + (v || 0), 0);
	};

	/**
	 * Maxed stats of this ship.
	 * @return stats without the equipment but with modernization at Lv.99,
	 *         stats at Lv.165 can be only estimated by data from known database.
	 */
	KC3Ship.prototype.maxedStats = function(statAttr, isMarried = this.isMarried()){
		if(!this.masterId) { return false; }
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
		return !statAttr ? stats : stats[statAttr];
	};

	/**
	 * Left modernize-able stats of this ship.
	 * @return stats to be maxed modernization
	 */
	KC3Ship.prototype.modernizeLeftStats = function(statAttr){
		if(!this.masterId) { return false; }
		const shipMst = this.master();
		const stats = {
			fp: shipMst.api_houg[1] - shipMst.api_houg[0] - this.mod[0],
			tp: shipMst.api_raig[1] - shipMst.api_raig[0] - this.mod[1],
			aa: shipMst.api_tyku[1] - shipMst.api_tyku[0] - this.mod[2],
			ar: shipMst.api_souk[1] - shipMst.api_souk[0] - this.mod[3],
			lk: this.lk[1] - this.lk[0]
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
	 * Simple method to find equipment by Master ID from current ship's equipment.
	 * @return the mapped Array to indicate equipment found or not at corresponding position,
	 *         max 5-elements including ex-slot.
	 */
	KC3Ship.prototype.findEquipmentById = function(masterId, isExslotIncluded = true) {
		return this.equipment(isExslotIncluded).map(gear =>
			Array.isArray(masterId) ? masterId.indexOf(gear.masterId) > -1 :
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
			gear.masterId > 0 && (
				Array.isArray(typeValue) ? typeValue.indexOf(gear.master().api_type[typeIndex]) > -1 :
				typeValue === gear.master().api_type[typeIndex]
			)
		);
	};

	/* FIND DAMECON
	   Find first available damecon.
	   search order: extra slot -> 1st slot -> 2ns slot -> 3rd slot -> 4th slot
	   return: {pos: <pos>, code: <code>}
	   pos: 0-3 for normal slots, 4 for extra slot, -1 if not found.
	   code: 0 if not found, 1 for repair team, 2 for goddess
	   ----------------------------------------- */
	KC3Ship.prototype.findDameCon = function() {
		var items =
			[ {pos: 4, item: this.exItem() },
			  {pos: 0, item: this.equipment(0) },
			  {pos: 1, item: this.equipment(1) },
			  {pos: 2, item: this.equipment(2) },
			  {pos: 3, item: this.equipment(3) } ];
		items = items
			.filter( function(x) {
				// 42: repair team
				// 43: repair goddess
				return x.item.masterId === 42 || x.item.masterId === 43;
			}).map(function(x) {
				return {pos: x.pos,
						code: x.item.masterId === 42 ? 1
							: x.item.masterId === 43 ? 2
							: 0};
			});
		return items.length > 0 ? items[0] : {pos: -1, code: 0};
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
		if(!this.rosterId || !this.masterId) { return tp; }
		if (!(this.didFlee || this.isTaiha())) {
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
		if(!this.rosterId){ return 0; }
		return this.equipment(0).fighterPower( this.slots[0] )
			+ this.equipment(1).fighterPower( this.slots[1] )
			+ this.equipment(2).fighterPower( this.slots[2] )
			+ this.equipment(3).fighterPower( this.slots[3] );
	};

	/* FIGHTER POWER with WHOLE NUMBER BONUS
	Get fighter power of this ship as an array
	with consideration to whole number proficiency bonus
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterVeteran = function(){
		if(!this.rosterId){ return 0; }
		return this.equipment(0).fighterVeteran( this.slots[0] )
			+ this.equipment(1).fighterVeteran( this.slots[1] )
			+ this.equipment(2).fighterVeteran( this.slots[2] )
			+ this.equipment(3).fighterVeteran( this.slots[3] );
	};

	/* FIGHTER POWER with LOWER AND UPPER BOUNDS
	Get fighter power of this ship as an array
	with consideration to min-max bonus
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterBounds = function(){
		if(!this.rosterId){ return 0; }
		var GearPowers = [
			this.equipment(0).fighterBounds( this.slots[0] ),
			this.equipment(1).fighterBounds( this.slots[1] ),
			this.equipment(2).fighterBounds( this.slots[2] ),
			this.equipment(3).fighterBounds( this.slots[3] )
		];
		return [
			GearPowers[0][0]+GearPowers[1][0]+GearPowers[2][0]+GearPowers[3][0],
			GearPowers[0][1]+GearPowers[1][1]+GearPowers[2][1]+GearPowers[3][1],
		];
	};

	/* FIGHTER POWER on Air Defense with INTERCEPTOR FORMULA
	Recon plane gives a modifier to total interception power
	--------------------------------------------------------------*/
	KC3Ship.prototype.interceptionPower = function(){
		if(!this.rosterId){ return 0; }
		var reconModifier = 1;
		this.equipment(function(id, idx, gear){
			if(id === 0){ return; }
			var type2 = gear.master().api_type[2];
			var los = gear.master().api_saku;
			if(KC3GearManager.landBaseReconnType2Ids.indexOf(type2)>-1){
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
		var interceptionPower =
			  this.equipment(0).interceptionPower(this.slots[0])
			+ this.equipment(1).interceptionPower(this.slots[1])
			+ this.equipment(2).interceptionPower(this.slots[2])
			+ this.equipment(3).interceptionPower(this.slots[3]);
		return Math.floor(interceptionPower * reconModifier);
	};

	/* SUPPORT POWER
	 * Get support expedition shelling power of this ship
	 * http://kancolle.wikia.com/wiki/Expedition/Support_Expedition
	 * http://wikiwiki.jp/kancolle/?%BB%D9%B1%E7%B4%CF%C2%E2
	--------------------------------------------------------------*/
	KC3Ship.prototype.supportPower = function(){
		if(!this.rosterId || !this.masterId){ return 0; }
		const fixedFP = this.nakedStats("fp") - 1;
		var supportPower = 0;
		// for carrier series: CV, CVL, CVB
		if([7, 11, 18].indexOf(this.master().api_stype) > -1){
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
	 * Get basic pre-cap shelling fire power of this ship (without pre-cap / post-cap modifier).
	 *
	 * @param {number} combinedFleetFactor - additional power if ship is on a combined fleet.
	 * @return {number} computed fire power, return 0 if unavailable.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#ua92169d
	 */
	KC3Ship.prototype.shellingFirePower = function(combinedFleetFactor = 0){
		if(!this.rosterId || !this.masterId) { return 0; }
		const stype = this.master().api_stype;
		const carrierStypes = [7, 11, 18];
		let isCarrierShelling = carrierStypes.indexOf(stype) > -1;
		if(!isCarrierShelling) {
			// Hayasui Kai gets special when any Torpedo Bomber equipped
			isCarrierShelling = this.masterId === 352 && this.hasEquipmentType(2, 8);
		}
		let shellingPower = this.fp[0];
		if(isCarrierShelling) {
			shellingPower += this.equipmentTotalStats("raig");
			shellingPower += Math.floor(1.3 * this.equipmentTotalStats("baku"));
			shellingPower += combinedFleetFactor;
			shellingPower += this.equipmentTotalImprovementBonus("fire");
			shellingPower = Math.floor(1.5 * shellingPower);
			shellingPower += 55;
		} else {
			shellingPower += combinedFleetFactor;
			shellingPower += this.equipmentTotalImprovementBonus("fire");
			shellingPower += 5;
		}
		return shellingPower;
	};

	/**
	 * Get pre-cap shelling torpedo power of this ship.
	 */
	KC3Ship.prototype.shellingTorpedoPower = function(combinedFleetFactor = 0){
		if(!this.rosterId || !this.masterId) { return 0; }
		return 5 + this.tp[0] + combinedFleetFactor +
			this.equipmentTotalImprovementBonus("torpedo");
	};

	/**
	 * Get pre-cap anti-sub power of this ship.
	 */
	KC3Ship.prototype.antiSubWarfarePower = function(){
		if(!this.rosterId || !this.masterId) { return 0; }
		const isSonarEquipped = this.hasEquipmentType(1, 10);
		const isDepthChargeProjectorEquipped = this.hasEquipment([44, 45]);
		const isNewDepthChargeEquipped = this.hasEquipment([226, 227]);
		let synergyModifier = 1;
		synergyModifier += isSonarEquipped && isNewDepthChargeEquipped ? 0.15 : 0;
		synergyModifier += isDepthChargeProjectorEquipped && isNewDepthChargeEquipped ? 0.1 : 0;
		synergyModifier *= isSonarEquipped && isDepthChargeProjectorEquipped ? 1.15 : 1;
		// check asw attack type, 1530 is Abyssal Submarine Ka-Class
		const isAirAttack = this.estimateDayAttackType(1530, false)[0] === 7;
		const attackMethodConst = isAirAttack ? 8 : 13;
		const nakedAsw = this.nakedStats("as");
		// FIXME asw stat from some types of equipment not applied to as[0]?
		// assume these equipment can not be equipped by this ship in-game
		const equipmentTotalAsw = this.as[0] - nakedAsw;
		let aswPower = attackMethodConst;
		aswPower += 2 * Math.sqrt(nakedAsw);
		aswPower += 1.5 * equipmentTotalAsw;
		aswPower += this.equipmentTotalImprovementBonus("asw");
		aswPower *= synergyModifier;
		return aswPower;
	};

	/**
	 * Get pre-cap night battle power of this ship.
	 */
	KC3Ship.prototype.nightBattlePower = function(isNightContacted = false){
		if(!this.rosterId || !this.masterId) { return 0; }
		return (isNightContacted & 5) + this.fp[0] + this.tp[0]
			+ this.equipmentTotalImprovementBonus("yasen");
	};

	// check if this ship is capable of equipping Daihatsu (landing craft)
	KC3Ship.prototype.canEquipDaihatsu = function() {
		if(!this.rosterId || !this.masterId) { return false; }
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
				// Abukuma K2(200), Kinu K2(487), Yura K2(488)
				200, 487, 488,
				// Satsuki K2(418), Mutsuki K2(434), Kisaragi K2(435), Fumizuki(548)
				418, 434, 435, 548,
				// Kasumi K2(464), Kasumi K2B(470), Ooshio K2(199), Asashio K2D(468), Arashio K2(490)
				464, 470, 199, 468, 490,
				// Verniy(147), Kawakaze K2(469)
				147, 469,
				// Nagato K2(541)
				541
			].indexOf( this.masterId ) === -1)
			return false;
		return true;
	};

	// test to see if this ship is capable of opening ASW
	// reference: http://kancolle.wikia.com/wiki/Partials/Opening_ASW as of Feb 3, 2017
	// there are two requirements:
	// - sonar should be equipped
	// - ASW stat >= 100
	// also Isuzu K2 can do OASW unconditionally
	// also ship type Escort and CVL Taiyou are special cases
	KC3Ship.prototype.canDoOASW = function () {
		if(!this.rosterId || !this.masterId) { return false; }
		// master Id for Isuzu K2
		if (this.masterId === 141)
			return true;

		// is Taiyou series:
		// tho Kasugamaru not possible to reach high asw for now
		// and base asw stat of Kai and Kai2 already exceed 70
		const isTaiyouSeries = RemodelDb.originOf(this.masterId) === 521;
		const isTaiyouBase = this.masterId === 526;
		const isTaiyouKaiAfter = RemodelDb.remodelGroup(521).indexOf(this.masterId) > 1;

		// lower condition for Escort and Taiyou
		const aswThreshold = this.master().api_stype == 1 ? 60
			: isTaiyouSeries ? 65
			: 100;

		// shortcut on the stricter condition first
		if (this.as[0] < aswThreshold)
			return false;

		// according test, Taiyou needs a Torpedo Bomber with asw stat >= 7,
		// current implemented: T97 / Tenzan (931 Air Group), Swordfish Mk.III (Skilled)
		// see http://wikiwiki.jp/kancolle/?%C2%E7%C2%EB
		const isHighAswTorpedoBomber = (masterData) => {
			return masterData &&
				masterData.api_type[2] === 8 &&
				masterData.api_tais >= 7;
		};
		// for Taiyou Kai or Kai Ni, any equippable aircraft with asw should work,
		// only Autogyro or PBY equipped will not let CVL anti-sub in day shelling phase,
		// but Taiyou Kai+ can still OASW. only Sonar equipped can do neither.
		if (isTaiyouKaiAfter) {
			return [0,1,2,3,4].some( slot => this.equipment(slot).isAswAircraft() );
		} else if (isTaiyouBase) {
			return [0,1,2,3,4].some( slot => isHighAswTorpedoBomber( this.equipment(slot).master() ));
		}

		const hasSonar = this.hasEquipmentType(1, 10);
		// Escort can OASW without Sonar, but total asw >= 75 and equipped total plus asw >= 4
		// see https://twitter.com/a_t_o_6/status/863445975007805440
		if(this.master().api_stype == 1) {
			if(hasSonar) return true;
			const equipAswSum = this.equipmentTotalStats("tais");
			return this.as[0] >= 75 && equipAswSum >= 4;
		}

		return hasSonar;
	};

	KC3Ship.prototype.estimateLandingAttackType = function(targetShipMasterId) {
		const targetShip = KC3Master.ship(targetShipMasterId);
		if(!this.masterId || !targetShip) return 0;
		if(targetShip.api_soku === 0) {
			// most priority: Toku Daihatsu + 11th Tank
			if(this.hasEquipment(230)) return 5;
			// Abyssal installation could be landing attacked
			const isTargetLandable =
				[1668, 1669, 1670, 1671, 1672, // Isolated Island Princess
					1665, 1666, 1667, // Artillery Imp
					1653, 1654, 1655, 1656, 1657, 1658, // Supply Depot Princess
					1753, 1754, // Summer Supply Depot Princess
				].includes(targetShipMasterId);
			const isThisSubmarine = [13, 14].includes(this.master().api_stype);
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
	 * Estimate day time attack type of this ship.
	 * Only according ship type and equipment, ignoring factors such as ship status, target-able.
	 * @param {number} targetShipMasterId - a Master ID of being attacked ship, used to indicate some
	 *        special attack types. eg: attacking a submarine, landing attack an installation.
	 *        The ID can be just an example to represent this type of target.
	 * @param {boolean} trySpTypeFirst - specify true if want to estimate special attack type.
	 * @return {Array} day time attack type constants tuple: [id, name, landing attack id].
	 *         id is partially from `api_hougeki?.api_at_type` which indicates the special attacks.
	 *         NOTE: Not take 'can not be targeted' into account yet,
	 *         such as: CV/CVB against submarine; submarine against land installation;
	 *         asw aircraft all lost against submarine; torpedo bomber only against land,
	 *         should not pass targetShipMasterId at all for these scenes.
	 * @see https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/kcmemo.md#%E6%94%BB%E6%92%83%E7%A8%AE%E5%88%A5
	 */
	KC3Ship.prototype.estimateDayAttackType = function(targetShipMasterId = 0, trySpTypeFirst = false) {
		if(!this.rosterId || !this.masterId) { return []; }
		// if attack target known, will give different attack according target ship
		const targetShip = KC3Master.ship(targetShipMasterId);
		const isTargetSubmarine = targetShip && [13, 14].includes(targetShip.api_stype);
		const stype = this.master().api_stype;
		const isThisCarrier = [7, 11, 18].includes(stype);
		const isThisSubmarine = [13, 14].includes(stype);
		
		const hasRecon = this.hasEquipmentType(2, [10, 11]);
		if(trySpTypeFirst && hasRecon) {
			// to estimate if can do day time special attacks (aka Artillery Spotting)
			// in game, special attack types are judged and given by server API result.
			const mainGunCnt = this.countEquipmentType(2, [1, 2, 3]);
			const apShellCnt = this.countEquipmentType(2, 19);
			if(mainGunCnt === 2 && apShellCnt === 1) return [6, "CutinMainMain"];
			const secondaryCnt = this.countEquipmentType(2, 4);
			if(mainGunCnt === 1 && secondaryCnt === 1 && apShellCnt === 1) return [5, "CutinMainApshell"];
			const radarCnt = this.countEquipmentType(2, [12, 13]);
			if(mainGunCnt === 1 && secondaryCnt === 1 && radarCnt === 1) return [4, "CutinMainRadar"];
			if(mainGunCnt >= 1 && secondaryCnt >= 1) return [3, "CutinMainSecond"];
			if(mainGunCnt >= 2) return [2, "DoubleAttack"];
		}
		
		if(targetShip && targetShip.api_soku === 0) {
			const landingAttackType = this.estimateLandingAttackType(targetShipMasterId);
			if(landingAttackType > 0) {
				return [-1, "LandingAttack", landingAttackType];
			}
			const hasRocketLauncher = this.hasEquipmentType(2, 37);
			// no kind number for rocket attack and landing craft attack
			if(hasRocketLauncher) return [-1, "Rocket"];
		}
		// is this ship Hayasui Kai
		if(this.masterId === 352) {
			if(isTargetSubmarine) {
				// air attack if asw aircraft equipped
				const aswEquip = this.equipment(true).find(equip => equip.isAswAircraft());
				return aswEquip ? [7, "AirAttack"] : [8, "DepthCharge"];
			}
			// air attack if torpedo bomber equipped, otherwise fall back to shelling
			if(this.hasEquipmentType(2, 8))
				return [7, "AirAttack"];
			else
				return [0, "SingleAttack"];
		}
		if(isThisCarrier) {
			return [7, "AirAttack"];
		}
		// only torpedo attack possible if this ship is submarine (but not shelling phase)
		if(isThisSubmarine) {
			return [9, "Torpedo"];
		}
		if(isTargetSubmarine) {
			// CAV, BBV, AV, LHA can only air attack against submarine
			return ([6, 10, 16, 17].includes(stype)) ? [7, "AirAttack"] : [8, "DepthCharge"];
		}
		
		// default single shelling fire attack. btw, [1, "Laser"] no longer exists.
		return [0, "SingleAttack"];
	};

	/**
	 * Estimate night battle attack type of this ship.
	 * Also just give possible attack type, no responsibility to check can do attack at night,
	 * or that ship can be targeted or not, etc.
	 * @param {number} targetShipMasterId - a Master ID of being attacked ship.
	 * @param {boolean} trySpTypeFirst - specify true if want to estimate special attack type.
	 * @return {Array} night battle attack type constants tuple: [id, name, TCI type].
	 *         id is partially from `api_hougeki.api_sp_list` which indicates the special attacks.
	 * @see estimateDayAttackType
	 */
	KC3Ship.prototype.estimateNightAttackType = function(targetShipMasterId, trySpTypeFirst = false) {
		if(!this.rosterId || !this.masterId) { return []; }
		const targetShip = KC3Master.ship(targetShipMasterId);
		const isTargetSubmarine = targetShip && [13, 14].includes(targetShip.api_stype);
		const stype = this.master().api_stype;
		const isThisLightCarrier = stype === 7;
		const isThisCarrier = [7, 11, 18].includes(stype);
		const isThisSubmarine = [13, 14].includes(stype);
		
		const torpedoCnt = this.countEquipmentType(2, [5, 32]);
		if(trySpTypeFirst) {
			// to estimate night special attacks, which should be given by server API result.
			const lateTorpedoCnt = this.countEquipment([213, 214]);
			const ssRadarCnt = this.countEquipmentType(2, 51);
			// special torpedo cut-in for late model submarine torpedo
			// 3rd element is cut-in type, pre-cap modifiers: 0: 1.5, 1: 1.75, 2: 1.6
			if(lateTorpedoCnt >= 1 && ssRadarCnt >= 1) return [3, "CutinTorpTorp", 1];
			if(lateTorpedoCnt >= 2) return [3, "CutinTorpTorp", 2];
			if(torpedoCnt >= 2) return [3, "CutinTorpTorp", 0];
			const mainGunCnt = this.countEquipmentType(2, [1, 2, 3, 38]);
			if(mainGunCnt >= 3) return [5, "CutinMainMainMain"];
			const secondaryCnt = this.countEquipmentType(2, 4);
			if(mainGunCnt === 2 && secondaryCnt >= 1) return [4, "CutinMainMainSecond"];
			if((mainGunCnt === 2 && secondaryCnt === 0 && torpedoCnt === 1) ||
				(mainGunCnt === 1 && torpedoCnt === 1)) return [2, "CutinMainTorp"];
			if((mainGunCnt === 2 && secondaryCnt === 0 && torpedoCnt === 0) ||
				(mainGunCnt === 1 && secondaryCnt >= 1) ||
				(secondaryCnt >= 2 && torpedoCnt <= 1)) return [1, "DoubleAttack"];
		}
		
		if(targetShip && targetShip.api_soku === 0) {
			const landingAttackType = this.estimateLandingAttackType(targetShipMasterId);
			if(landingAttackType > 0) {
				return [-1, "LandingAttack", landingAttackType];
			}
			const hasRocketLauncher = this.hasEquipmentType(2, 37);
			if(hasRocketLauncher) return [-1, "Rocket"];
		}
		if(isTargetSubmarine && isThisLightCarrier) {
			return [8, "DepthCharge"];
		}
		if(isThisCarrier) {
			// these carriers can only do shelling attack
			const isSpecialCarrier = [432, 353, // Graf & Graf Kai
				433 // Saratoga (base form)
				].includes(this.masterId);
			if(isSpecialCarrier) return [0, "SingleAttack"];
			// these abyssal ships can only be shelling attacked
			const isSpecialAbyssal = [
				1679, 1680, 1681, 1682, 1683, // Lycoris Princess
				1711, 1712, 1713, // Jellyfish Princess
				].includes[targetShipMasterId];
			if(isSpecialAbyssal) return [0, "SingleAttack"];
			// Taiyou Kai Ni fall-back to shelling attack if no bomber equipped
			if(this.masterId === 529 &&
				!this.hasEquipmentType(2, [7, 8])) return [0, "SingleAttack"];
			// Ark Royal (Kai) can air attack if and only if Swordfish series equipped,
			// but here just indicates 'attack type', not 'can attack or not', so:
			//if([515, 393].includes(this.masterId) && this.hasEquipment([242, 243, 244]))
			return [7, "AirAttack"];
		}
		if(isThisSubmarine) {
			return [9, "Torpedo"];
		}
		if(isTargetSubmarine) {
			// CAV, BBV, AV, LHA
			return ([6, 10, 16, 17].includes(stype)) ? [7, "AirAttack"] : [8, "DepthCharge"];
		}
		
		// default torpedo attack if any torpedo equipped
		return torpedoCnt > 0 ? [9, "Torpedo"] : [0, "SingleAttack"];
	};

	/**
	 * Get current shelling attack accuracy related info of this ship.
	 * NOTE: Not take target evasion part into account at all.
	 * @param {number} formationModifier
	 * @return {Object} accuracy factors of this ship.
	 * @see http://kancolle.wikia.com/wiki/Combat/Accuracy_and_Evasion
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6
	 */
	KC3Ship.prototype.shellingAccuracy = function(formationModifier = 1) {
		if(!this.rosterId || !this.masterId) { return {}; }
		const onLevel = 2 * Math.sqrt(this.level - 1);
		const onLuck = 1.5 * Math.sqrt(this.lk[0]);
		const onEquip = -this.nakedStats("ac");
		// http://kancolle.wikia.com/wiki/Improvements
		const onImprove = this.equipment(true).map(
			// Main/Secondary/AP shell/Sonar/Radar/AAFD
			e => e.itemId > 0 && [1,2,8,10,24,25].indexOf(e.master().api_type[1]) > -1
				&& e.stars
		).reduce((acc, v) => acc + Math.sqrt(v), 0);
		const moraleModifier = this.moraleEffectLevel([1, 0.5, 0.8, 1, 1.2]);
		// TODO To be implemented
		const gunfit = 0;
		const base = 3 + gunfit +
			Math.qckInt("floor", Math.floor(90 + onLevel + onLuck + onEquip + onImprove) *
				formationModifier * moraleModifier, 1);
		return {
			accuracy: base,
			equipmentStats: onEquip,
			equipImprovement: onImprove,
			moraleModifier: moraleModifier,
			formationModifier: formationModifier
		};
	};

	KC3Ship.prototype.equipmentAntiAir = function(forFleet) {
		return AntiAir.shipEquipmentAntiAir(this, forFleet);
	};

	KC3Ship.prototype.adjustedAntiAir = function() {
		var floor = AntiAir.specialFloor(this);
		return floor(AntiAir.shipAdjustedAntiAir(this));
	};

	KC3Ship.prototype.proportionalShotdownRate = function() {
		return AntiAir.shipProportionalShotdownRate(this);
	};

	KC3Ship.prototype.proportionalShotdown = function(n) {
		return AntiAir.shipProportionalShotdown(this,n);
	};

	// note:
	// - fixed shotdown makes no sense if the current ship is not in a fleet.
	// - formationId takes one of the following:
	//   - 1/4/5 (for line ahead / echelon / line abreast)
	//   - 2 (for double line)
	//   - 3 (for diamond)
	// - all possible AACIs are considered and the largest AACI modifier
	//   is used for calculation the maximum number of fixed shotdown
	KC3Ship.prototype.fixedShotdownRange = function(formationId) {
		var fleetObj = PlayerManager.fleets[ this.onFleet() - 1 ];
		return AntiAir.shipFixedShotdownRangeWithAACI(this, fleetObj,
			AntiAir. getFormationModifiers(formationId || 1) );
	};

	KC3Ship.prototype.maxAaciShotdownBonuses = function() {
		return AntiAir.shipMaxShotdownAllBonuses( this );
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
		$(".ship_full_name .ship_yomi", tooltipBox).text(KC3Meta.shipReadingName(shipObj.master().api_yomi));
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
		$(".stat_hp", tooltipBox).text(shipObj.hp[1]);
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
		$(".stat_as .current", tooltipBox).text(shipObj.as[0])
			.toggleClass("oasw", shipObj.canDoOASW());
		$(".stat_as .level", tooltipBox).text(signedNumber(maxDiffStats.as))
			.toggle(!!maxDiffStats.as);
		$(".stat_as .equip", tooltipBox).text("({0})".format(nakedStats.as))
			.toggle(!!equipDiffStats.as);
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
		const shellingAccuracy = shipObj.shellingAccuracy();
		$(".shellingAccuracy", tooltipBox).text(
			KC3Meta.term("ShipAccShelling").format(
				shellingAccuracy.accuracy,
				signedNumber(shellingAccuracy.equipmentStats),
				signedNumber(Math.qckInt("floor", shellingAccuracy.equipImprovement, 1))
			)
		);
		$(".adjustedAntiAir", tooltipBox).text(
			KC3Meta.term("ShipAAAdjusted").format(shipObj.adjustedAntiAir())
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
		if(shipObj.onFleet()){
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

	KC3Ship.prototype.deckbuilder = function() {
		var itemsInfo = {};
		var result = {
			id: this.masterId,
			lv: this.level,
			luck: this.lk[0],
			items: itemsInfo
		};

		var gearInfo;
		for(var i=0; i<4; ++i) {
			gearInfo = this.equipment(i).deckbuilder();
			if (gearInfo)
				itemsInfo["i".concat(i+1)] = gearInfo;
			else 
				break;
		}
		gearInfo = this.exItem().deckbuilder();
		if (gearInfo) {
			// #1726 Deckbuilder: if max slot not reach 4, `ix` will not be used
			var usedSlot = Object.keys(itemsInfo).length;
			if(usedSlot < 4) {
				itemsInfo["i".concat(usedSlot+1)] = gearInfo;
			} else {
				itemsInfo.ix = gearInfo;
			}
		}
		
		return result;
	};

})();
