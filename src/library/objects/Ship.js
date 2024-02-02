/* Ship.js
KC3改 Ship Object
*/
(function(){
	"use strict";

	var deferList = {};

	window.KC3Ship = function( data, toClone ){
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
		// fp/tp/ar/ev powerup added by ribbon item since 2023-07-07
		this.spitems = [];
		this.fuel = 0;
		this.ammo = 0;
		this.repair = [0,0,0];
		this.stars = 0;
		this.morale = 0;
		this.cond = 0;
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
			statsCache: {
				value: null,
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
				if(Array.isArray(data.api_sp_effect_items)){
					this.spitems = data.api_sp_effect_items.map(item => ({
						type: item.api_kind,
						fp: item.api_houg,
						tp: item.api_raig,
						ar: item.api_souk,
						ev: item.api_kaih,
					}));
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
				this.cond = data.api_cond;
				this.lock = data.api_locked;
			// Initialized with formatted data, deep clone if demanded
			} else {
				if(!!toClone)
					$.extend(true, this, data);
				else
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
	KC3Ship.prototype.name = function(){ return KC3Meta.shipNameById( this.masterId ); };
	KC3Ship.prototype.stype = function(){
		var stype = this.master().api_stype;
		var useAlt = ConfigManager.info_stype_cve && stype === 7 && this.isEscortLightCarrier();
		return KC3Meta.shipTypeNameSp(this.masterId, stype, useAlt);
	};
	KC3Ship.prototype.ctype = function(){ return KC3Meta.ctypeName(this.master().api_ctype); };
	KC3Ship.prototype.nation = function(){ return KC3Meta.countryNameByCtype(this.master().api_ctype); };
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
		// to leave unfulfilled slots in-game, make bauxite insufficient or use supply button at expedition
		var maxeq = (this.master() || {}).api_maxeq;
		return Array.isArray(maxeq) ?
			maxeq.every((expectedSize, index) => !expectedSize || expectedSize <= this.slotSize(index)) : true;
	};
	KC3Ship.prototype.isFast = function(){ return (this.speed || this.master().api_soku) >= 10; };
	KC3Ship.prototype.getSpeed = function(){ return this.speed || this.master().api_soku; };
	KC3Ship.prototype.exItem = function(){ return this.getGearManager().get(this.ex_item); };
	KC3Ship.prototype.isShouha = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.75); };
	KC3Ship.prototype.isStriped = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.5); };
	// Current HP < 25% but already in the repair dock not counted
	KC3Ship.prototype.isTaiha = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.25) && !this.isRepairing(); };
	// To indicate the face grey out ship, retreated or sunk (before her data removed from API)
	KC3Ship.prototype.isAbsent = function(){ return (this.didFlee || this.hp[0] <= 0 || this.hp[1] <= 0); };
	KC3Ship.prototype.speedName = function(){ return KC3Meta.shipSpeed(this.speed); };
	KC3Ship.prototype.rangeName = function(){ return KC3Meta.shipRange(this.range); };
	// marriage implemented since 2014-02-14
	KC3Ship.getMarriedLevel = function(){ return 100; };
	// 2015-12-08: 150->155
	// 2017-07-31: 155->165
	// 2018-08-17: 165->175
	// 2023-05-26: 175->180
	KC3Ship.getMaxLevel = function(){ return 180; };
	// hard-coded at `Core.swf/vo.UserShipData.VHP` / `main.js#ShipModel.prototype.VHP`
	KC3Ship.getMaxHpModernize = function() { return 2; };
	// hard-coded at `Core.swf/vo.UserShipData.VAS` / `main.js#ShipModel.prototype.VAS`
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
			this.morale > 22 ? valuesArray[2] :
			this.morale >= 0 ? valuesArray[1] :
			valuesArray[0]);
	};
	KC3Ship.prototype.ribbonType = function() {
		if(this.spitems && this.spitems.length > 0){
			return this.spitems.map(i => i.type).sort((a, b) => a - b).pop();
		}
		return false;
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
	 * @return a tuple for [position in fleet (0-based), fleet total ship amount, fleet number (1-based)].
	 *         return [-1, 0, 0] if this ship is not on any fleet.
	 */
	KC3Ship.prototype.fleetPosition = function(){
		var position = -1,
			total = 0,
			fleetNum = 0;
		if(this.exists()) {
			fleetNum = this.onFleet();
			if(fleetNum > 0) {
				var fleet = PlayerManager.fleets[fleetNum - 1];
				position = fleet.ships.indexOf(this.rosterId);
				total = fleet.countShips();
			}
		}
		return [position, total, fleetNum];
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
		this.cond = this.morale;
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
		// Known implementations: Taiyou-class series, Gambier Bay series, Zuihou K2B, Ryuuhou K2E+, Langley series
		const minAsw = (this.master().api_tais || [])[0];
		return stype === 7 && minAsw > 0;
	};

	/**
	 * @return true if this ship type is using air attack method when against submarine
	 * @see #estimateDayAttackType, #estimateNightAttackType - CVL 7 is not introduced there since they always air attack
	 */
	KC3Ship.prototype.isAirAntiSubStype = function(){
		if(this.isDummy()) return false;
		const stype = this.master().api_stype;
		return [6, 7, 10, 16, 17].includes(stype);
	};

	/**
	 * @return true if this ship is 2nd Class Transporter class (as is No.101 Transport Ship)
	 */
	 KC3Ship.prototype.is2ndClassTransporter = function(){
		if(this.isDummy()) return false;
		const ctype = this.master().api_ctype;
		return ctype === 120;
	};

	/**
	 * @return true if this ship is Hayasui Kai with any (Jet) Torpedo Bomber equipped
	 */
	KC3Ship.prototype.isHayasuiKaiWithTorpedoBomber = function(){
		if(this.isDummy()) return false;
		return this.masterId === 352 && this.hasEquipmentType(2, [8, 58]);
	};

	/**
	 * @return true if this ship is Yamashiomaru with any Dive/Torpedo Bomber equipped
	 * @see main.js#PhaseHougeki.prototype._getNormalAttackType - the same place for Hayasui and ASW below
	 */
	 KC3Ship.prototype.isYamashiomaruWithBomber = function(){
		if(this.isDummy()) return false;
		return [900, 717].includes(this.masterId) && this.hasEquipmentType(2, [7, 8]);
	};

	/**
	 * @return true if this ship is Yamashiomaru with ASW possible aircraft equipped
	 */
	 KC3Ship.prototype.isYamashiomaruWithAircraft = function(){
		if(this.isDummy()) return false;
		return [900, 717].includes(this.masterId) && this.hasEquipmentType(2, [7, 8, 25, 26]);
	};

	/* REPAIR TIME
	Get ship's docking and Akashi times
	when optAfterHp is true, return repair time based on afterHp
	--------------------------------------------------------------*/
	KC3Ship.prototype.repairTime = function(optAfterHp){
		var hpArr = optAfterHp ? this.afterHp : this.hp,
			HPPercent  = hpArr[0] / hpArr[1],
			RepairCalc = PS['KanColle.RepairTime'];
		var result = { akashi: 0 };

		if (HPPercent > 0.5 && HPPercent < 1.00 && this.isFree()) {
			var dockTimeMillis = optAfterHp ?
				RepairCalc.dockingInSecJSNum(this.master().api_stype, this.level, hpArr[0], hpArr[1]) * 1000 :
				this.repair[0];
			var fleetNo = this.onFleet(),
				repairTimeMod = fleetNo > 0 ? PlayerManager.fleets[fleetNo - 1].repairTimeMod : undefined;
			var repairTime = KC3AkashiRepair.calculateRepairTime(dockTimeMillis, repairTimeMod);
			result.akashi = Math.max(
				Math.hrdInt('floor', repairTime, 3, 1), // convert to seconds
				20 * 60 // should be at least 20 minutes
			);
		}

		if (optAfterHp) {
			result.docking = RepairCalc.dockingInSecJSNum(this.master().api_stype, this.level, hpArr[0], hpArr[1]);
		} else {
			result.docking = this.isRepairing() ?
				Math.ceil(KC3TimerManager.repair(PlayerManager.repairShips.indexOf(this.rosterId)).remainingTime()) / 1000 :
				/* RepairCalc. dockingInSecJSNum( this.master().api_stype, this.level, this.hp[0], this.hp[1] ) */
				Math.hrdInt('floor', this.repair[0], 3, 1);
		}
		return result;
	};

	/* Calculate resupply cost
	   ----------------------------------
	   0 <= fuelPercent <= 1, < 0 use current fuel
	   0 <= ammoPercent <= 1, < 0 use current ammo
	   to calculate bauxite cost: bauxiteNeeded == true
	   to calculate steel cost per battle: steelNeeded == true
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
			return self.isMarried() && v > 1 ? Math.floor(0.85 * v) : v;
		};
		result.fuel = fuelPercent < 0 ? fullFuel - this.fuel : mulRounded(fullFuel, fuelPercent);
		result.ammo = ammoPercent < 0 ? fullAmmo - this.ammo : mulRounded(fullAmmo, ammoPercent);
		// After testing, 85% is applied to resupply value, not max value. and cannot be less than 1
		result.fuel = marriageConserve(result.fuel);
		result.ammo = marriageConserve(result.ammo);
		if(bauxiteNeeded){
			var slotsBauxiteCost = (current, max) => (
				current < max ? (max - current) * KC3GearManager.carrierSupplyBauxiteCostPerSlot : 0
			);
			result.bauxite = self.equipment()
				.map((g, i) => slotsBauxiteCost(self.slots[i], master.api_maxeq[i]))
				.sumValues();
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
	 * Get or calculate repair cost of this ship.
	 * @param currentHp - assumed current HP value if this ship is not damaged effectively.
	 * @return an object: {fuel: <fuelCost>, steel: <steelCost>}
	 */
	KC3Ship.prototype.calcRepairCost = function(currentHp){
		const result = {
			fuel: 0, steel: 0
		};
		if(this.isDummy()) { return result; }
		if(currentHp > 0 && currentHp <= this.hp[1]) {
			// formula see http://kancolle.wikia.com/wiki/Docking
			const fullFuel = this.master().api_fuel_max;
			const hpLost = this.hp[1] - currentHp;
			result.fuel = Math.floor(fullFuel * hpLost * 0.032);
			result.steel = Math.floor(fullFuel * hpLost * 0.06);
		} else {
			result.fuel = this.repair[1];
			result.steel = this.repair[2];
		}
		return result;
	};

	/**
	 * Naked stats of this ship.
	 * @return stats without the equipment but with modernization.
	 */
	KC3Ship.prototype.nakedStats = function(statAttr, withIndBonus){
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
			rn: this.master().api_leng,
			sp: this.master().api_soku,
			// Accuracy not shown in-game, so naked value might be plus-minus 0
			ht: 0
		};
		// Limited to currently used stats only,
		// all implemented see `KC3Meta.js#statApiNameMap`
		const statApiNames = {
			"tyku": "aa",
			"souk": "ar",
			"tais": "as",
			"houk": "ev",
			"houg": "fp",
			"saku": "ls",
			"raig": "tp",
			"houm": "ht", // will be negative (0 - accuracy from gears)
			"leng": "rn",
			"soku": "sp",
		};
		const statsEquip = {}, statsBonus = {};
		for(const apiName in statApiNames) {
			// get both values of total and bonus in 1-call (without `statsBonusOnShip` again),
			// to save execution time on explicit bonus complex summing
			const equipStats = this.equipmentTotalStats(apiName, true, true, withIndBonus ? "both" : false);
			const statsTotal = withIndBonus ? equipStats[0] : equipStats;
			if(withIndBonus) {
				statsEquip[statApiNames[apiName]] = statsTotal;
				statsBonus[statApiNames[apiName]] = equipStats[1];
			}
			// known issue: since stats value cannot be negative (lower cap at 0, except unknown accuracy),
			// will get incorrect stats in cases like actual naked 0 with negative stats from equip.
			// master values do not need to be adjusted by equip
			if(!["leng", "soku"].includes(apiName)) stats[statApiNames[apiName]] -= statsTotal;
		}
		if(withIndBonus) {
			// cache stats for faster later uses
			this.statsCache = Object.assign(this.statsCache || {}, {
				items: this.items.slice(0),
				shipNaked: stats,
				gearTotal: statsEquip,
				gearBonus: statsBonus,
				gearAsw: statsEquip.as,
				gearLos: statsEquip.ls,
			});
			return [stats, statsBonus];
		}
		return !statAttr ? stats : stats[statAttr];
	};

	KC3Ship.prototype.statsSp = function(statAttr){
		if(this.isDummy()) { return false; }
		if(!this.statsCache) this.statsCache = {};
		if(!this.statsCache.spEffects
			|| (this.spitems || []).length !== (this.statsCache.spEffects.type || []).length) {
			const sp = this.statsCache.spEffects = {};
			(this.spitems || []).forEach(item => {
				Object.keys(item).forEach(attr => {
					if(item[attr] !== undefined) {
						if(attr === "type") {
							(sp[attr] = sp[attr] || []).push(item[attr]);
						} else {
							sp[attr] = (sp[attr] || 0) + (item[attr] || 0);
						}
					}
				});
			});
		}
		return !statAttr ? this.statsCache.spEffects : this.statsCache.spEffects[statAttr] || 0;
	};

	KC3Ship.prototype.statsBonusOnShip = function(statAttr){
		if(this.isDummy()) { return false; }
		const stats = {};
		const statApiNames = {
			"houg": "fp",
			"souk": "ar",
			"raig": "tp",
			"houk": "ev",
			"tyku": "aa",
			"tais": "as",
			"saku": "ls",
			"houm": "ht",
			"leng": "rn",
			"soku": "sp",
		};
		for(const apiName in statApiNames) {
			stats[statApiNames[apiName]] = this.equipmentTotalStats(apiName, true, true, true);
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

	/**
	 * Sum and return total value of specified stat given by equipment.
	 */
	KC3Ship.prototype.equipmentTotalStats = function(apiName, isExslotIncluded = true,
		isOnShipBonusIncluded = true, isOnShipBonusOnly = false,
		includeEquipTypes = null, includeEquipIds = null,
		excludeEquipTypes = null, excludeEquipIds = null){
		var total = 0;
		const bonusDefs = isOnShipBonusIncluded || isOnShipBonusOnly ? KC3Gear.explicitStatsBonusGears() : false;
		// Accumulates displayed stats from equipment, and count for special equipment
		this.equipment(isExslotIncluded).forEach(equip => {
			if(equip.exists()) {
				const gearMst = equip.master(),
					mstId = gearMst.api_id,
					type2 = gearMst.api_type[2];
				if(Array.isArray(includeEquipTypes) &&
					!includeEquipTypes.includes(type2) ||
					Array.isArray(includeEquipIds) &&
					!includeEquipIds.includes(mstId) ||
					Array.isArray(excludeEquipTypes) &&
					excludeEquipTypes.includes(type2) ||
					Array.isArray(excludeEquipIds) &&
					excludeEquipIds.includes(mstId)
				) { return; }
				total += gearMst["api_" + apiName] || 0;
				if(bonusDefs) KC3Gear.accumulateShipBonusGear(bonusDefs, equip);
			}
		});
		// Add explicit stats bonuses (not masked, displayed on ship) from equipment on specific ship
		if(bonusDefs) {
			const onShipBonus = KC3Gear.equipmentTotalStatsOnShipBonus(bonusDefs, this, apiName);
			if(isOnShipBonusOnly === "both") return [total + onShipBonus, onShipBonus];
			total = isOnShipBonusOnly ? onShipBonus : total + onShipBonus;
		}
		// if apiName is speed `soku`, supposed to cap total at 20 (Fastest)? onShipBonus = 20 - master speed?
		// if apiName is range `leng`, 5 may not be the upper cap?
		return total;
	};

	/**
	 * Check all possible visible bonuses from current equipment and newly equipped one.
	 * @return {Object} a summary data about visible bonus stats and value.
	 * @see when modifying this part, please also update visible bonus part of mstship.js
	 */
	KC3Ship.prototype.equipmentBonusGearAndStats = function(newGearObj){
		const newGearMstId = (newGearObj || {}).masterId;
		let gearFlag = false;
		let synergyFlag = false;

		const bonusDefs = KC3Gear.explicitStatsBonusGears();
		const synergyGears = bonusDefs.synergyGears;
		const allGears = this.equipment(true);
		allGears.forEach(g => g.exists() && KC3Gear.accumulateShipBonusGear(bonusDefs, g));
		const masterIdList = allGears.map(g => g.masterId)
			.filter((value, index, self) => value > 0 && self.indexOf(value) === index);
		let bonusGears = masterIdList.map(mstId => bonusDefs[mstId])
			.concat(masterIdList.map(mstId => {
				const typeDefs = bonusDefs[`t2_${KC3Master.slotitem(mstId).api_type[2]}`];
				if (!typeDefs) return; else return $.extend(true, {}, typeDefs);
			}));
		masterIdList.push(...masterIdList);
		// Check if each gear works on the equipped ship
		const shipId = this.masterId;
		const originId = RemodelDb.originOf(shipId);
		const ctype = this.master().api_ctype;
		const stype = this.master().api_stype;
		const checkByShip = (byShip, shipId, originId, stype, ctype) =>
			(byShip.ids || []).includes(shipId) ||
			(byShip.origins || []).includes(originId) ||
			(byShip.stypes || []).includes(stype) ||
			(byShip.classes || []).includes(ctype) ||
			(!byShip.ids && !byShip.origins && !byShip.stypes && !byShip.classes);

		// Check if ship is eligible for equip bonus and add synergy/id flags
		bonusGears = bonusGears.filter((gear, idx) => {
			if (!gear) { return false; }
			const synergyFlags = [];
			const synergyIds = [];
			const matchGearByMstId = (g) => g.masterId === masterIdList[idx];
			let flag = false;
			for (const type in gear) {
				if (type === "byClass") {
					for (const key in gear[type]) {
						if (key == ctype) {
							if (Array.isArray(gear[type][key])) {
								for (let i = 0; i < gear[type][key].length; i++) {
									gear.path = gear.path || [];
									gear.path.push(gear[type][key][i]);
								}
							} else {
								gear.path = gear[type][key];
							}
						}
					}
				}
				else if (type === "byNation") {
					for (const key in gear[type]) {
						if (KC3Meta.ctypesByCountryName(key).includes(ctype)) {
							if (Array.isArray(gear[type][key])) {
								for (let i = 0; i < gear[type][key].length; i++) {
									gear.path = gear.path || [];
									gear.path.push(gear[type][key][i]);
								}
							} else {
								gear.path = gear[type][key];
							}
						}
					}
				}
				else if (type === "byShip") {
					if (Array.isArray(gear[type])) {
						for (let i = 0; i < gear[type].length; i++) {
							if (checkByShip(gear[type][i], shipId, originId, stype, ctype)) {
								gear.path = gear.path || [];
								gear.path.push(gear[type][i]);
							}
						}
					} else if (checkByShip(gear[type], shipId, originId, stype, ctype)) {
						gear.path = gear[type];
					}
				}
				if (gear.path) {
					if (type === "byNation" && typeof gear.path === "number") { gear.path = gear.byClass[gear.path]; }
					else if (typeof gear.path !== "object") { gear.path = gear[type][gear.path]; }
					if (!Array.isArray(gear.path)) { gear.path = [gear.path]; }

					const count = gear.count;
					for (let pathIdx = 0; pathIdx < gear.path.length; pathIdx++) {
						const check = gear.path[pathIdx];
						if (check.excludes && check.excludes.includes(shipId)) { continue; }
						if (check.excludeOrigins && check.excludeOrigins.includes(originId)) { continue; }
						if (check.excludeClasses && check.excludeClasses.includes(ctype)) { continue; }
						if (check.excludeStypes && check.excludeStypes.includes(stype)) { continue; }
						if (check.remodel && RemodelDb.remodelGroup(shipId).indexOf(shipId) < check.remodel) { continue; }
						if (check.remodelCap && RemodelDb.remodelGroup(shipId).indexOf(shipId) > check.remodelCap) { continue; }
						if (check.origins && !check.origins.includes(originId)) { continue; }
						if (check.stypes && !check.stypes.includes(stype)) { continue; }
						if (check.classes && !check.classes.includes(ctype)) { continue; }
						// Known issue: exact corresponding stars will not be found since identical equipment merged
						if (check.minStars && allGears.find(matchGearByMstId).stars < check.minStars) { continue; }
						if (check.single) { gear.count = 1; flag = true; }
						if (check.multiple) { gear.count = count; flag = true; }
						// countCap/minCount take priority
						if (check.countCap) { gear.count = Math.min(check.countCap, count); }
						if (check.minCount) { gear.count = count; }

						// Synergy check
						if (check.synergy) {
							let synergyCheck = check.synergy;
							if (!Array.isArray(synergyCheck)) { synergyCheck = [synergyCheck]; }
							for (let checkIdx = 0; checkIdx < synergyCheck.length; checkIdx++) {
								const flagList = synergyCheck[checkIdx].flags;
								for (let flagIdx = 0; flagIdx < flagList.length; flagIdx++) {
									const equipFlag = flagList[flagIdx];
									if (equipFlag.endsWith("Nonexist")) {
										if (!synergyGears[equipFlag]) { break; }
									} else if (synergyGears[equipFlag] > 0) {
										const synergyGearIds = synergyGears[equipFlag + "Ids"] || [];
										if (synergyGearIds.includes(newGearMstId)) { synergyFlag = true; }
										synergyFlags.push(equipFlag);
										const synergyGearId = masterIdList.find(id => synergyGearIds.includes(id));
										if (!synergyGearId) {
											console.warn("No matched gear ID found for synergy flag: " + equipFlag, synergyGearIds, masterIdList);
										} else {
											synergyIds.push(synergyGearId);
										}
									}
								}
							}
							flag |= synergyFlags.length > 0;
						}
					}
				}
			}
			gear.synergyFlags = synergyFlags;
			gear.synergyIds = synergyIds;
			gear.byType = idx >= Math.floor(masterIdList.length / 2);
			gear.id = masterIdList[idx];
			return !!flag;
		});
		if (!bonusGears.length) { return false; }

		// Trim bonus gear object and add icon ids
		const byIdGears = bonusGears.filter(g => !g.byType).map(g => g.id);
		const result = bonusGears.filter(g => !g.byType || !byIdGears.includes(g.id)).map(gear => {
			const obj = {};
			obj.count = gear.count;
			const g = allGears.find(eq => eq.masterId === gear.id);
			obj.name = g.name();
			if (g.masterId === newGearMstId) { gearFlag = true; }
			obj.icon = g.master().api_type[3];
			obj.synergyFlags = gear.synergyFlags.filter((value, index, self) => self.indexOf(value) === index && !!value);
			obj.synergyNames = gear.synergyIds.map(id => allGears.find(eq => eq.masterId === id).name());
			obj.synergyIcons = obj.synergyFlags.map(flag => {
				if (flag.includes("Radar")) { return 11; }
				else if (flag.includes("Torpedo")) { return 5; }
				else if (flag.includes("YellowSecGunMount")) { return 4; }
				else if (flag.includes("LargeGunMount")) { return 3; }
				else if (flag.includes("MediumGunMount")) { return 2; }
				else if (flag.includes("SmallGunMount")) { return 1; }
				else if (flag.includes("MachineGun")) { return 15; }
				else if (flag.includes("HighAngleGunMount")) { return 16; }
				else if (flag.includes("GreenSecGunMount")) { return 16; }
				else if (flag.includes("skilledLookouts")) { return 32; }
				else if (flag.includes("searchlight")) { return 24; }
				else if (flag.includes("rotorcraft") || flag.includes("helicopter")) { return 21; }
				else if (flag.includes("Sonar")) { return 18; }
				else if (flag.includes("Boiler") || flag.includes("Turbine")) { return 19; }
				return 0; // Unknown synergy type
			});
			return obj;
		});
		const stats = this.statsBonusOnShip();
		return {
			isShow: gearFlag || synergyFlag,
			bonusGears: result,
			stats: stats,
		};
	};

	// faster naked asw stat method since frequently used
	KC3Ship.prototype.nakedAsw = function(){
		var asw = this.as[0];
		var equipAsw;
		// use cached value as long as equip unchanged
		if(this.statsCache && this.statsCache.gearAsw !== undefined
			&& this.items.equals(this.statsCache.items)) {
			equipAsw = this.statsCache.gearAsw;
		} else {
			equipAsw = this.equipmentTotalStats("tais");
		}
		var naked = asw - equipAsw;
		this.statsCache = Object.assign(this.statsCache || {}, {
			items: this.items.slice(0),
			gearAsw: equipAsw,
		});
		return naked;
	};

	// faster naked los stat method since frequently used
	KC3Ship.prototype.nakedLoS = function(){
		var los = this.ls[0];
		var equipLos;
		// use cached value as long as equip unchanged
		if(this.statsCache && this.statsCache.gearLos !== undefined
			&& this.items.equals(this.statsCache.items)) {
			equipLos = this.statsCache.gearLos;
		} else {
			equipLos = this.equipmentTotalStats("saku");
		}
		var naked = los - equipLos;
		this.statsCache = Object.assign(this.statsCache || {}, {
			items: this.items.slice(0),
			gearLos: equipLos,
		});
		return naked;
	};

	KC3Ship.prototype.effectiveEquipmentTotalAsw = function(canAirAttack = false){
		var equipmentTotalAsw = 0;
		// When calculating asw warefare relevant thing,
		// asw stat from these known types of equipment not taken into account:
		// main gun, recon seaplane, seaplane/carrier fighter, radar, large flying boat, LBAA
		// KC Vita counts only carrier bomber, seaplane bomber, sonar (both), depth charges, rotorcraft and as-pby.
		// ~~All visible bonuses from equipment not counted towards asw attacks.~~
		const noCountEquipType2Ids = [1, 2, 3, 6, 10, 12, 13, 41, 45, 47];
		if(!canAirAttack) {
			const stype = this.master().api_stype;
			// CAV, CVL, BBV, AV, LHA, CVL-like Hayasui Kai, Yamashiomaru
			const isAirAntiSubStype = this.isAirAntiSubStype() || this.isHayasuiKaiWithTorpedoBomber() || this.isYamashiomaruWithAircraft();
			if(isAirAntiSubStype) {
				// exclude carrier bomber, seaplane bomber, rotorcraft, as-pby too if not able to air attack
				noCountEquipType2Ids.push(...[7, 8, 11, 25, 26, 57, 58]);
			}
		}
		equipmentTotalAsw = this.equipment(true)
			.map(g => g.exists() && !!g.master().api_tais &&
				noCountEquipType2Ids.includes(g.master().api_type[2]) ? 0 : g.master().api_tais
			).sumValues();
		// ASW visible bonus counted towards equipment since 2021-09-28,
		// under verification if there are some exceptions for specified equipment.
		equipmentTotalAsw += this.equipmentTotalStats("tais", true, true, true);
		return equipmentTotalAsw;
	};

	KC3Ship.prototype.expedEquipmentTotalStats = function(apiName, isExslotIncluded = true, isOnShipBonusIncluded = true){
		// For expeditions, stats like asw from aircraft affected by proficiency and equipped slot size:
		// https://wikiwiki.jp/kancolle/%E9%81%A0%E5%BE%81#about_stat
		// https://wikiwiki.jp/kancolle/%E7%B7%B4%E7%BF%92%E3%83%9A%E3%83%BC%E3%82%B8/35
		// https://docs.google.com/spreadsheets/d/1o-_-I8GXuJDkSGH0Dhjo7mVYx9Kpay2N2h9H3HMyO_E/htmlview
		var total = this.equipment(isExslotIncluded).map((g, i) => {
			if(!g.exists()) return 0;
			const mstGear = g.master(), mstValue = mstGear["api_" + apiName] || 0;
			// non-aircraft counts its actual stats value, land base plane cannot be used by expedition anyway
			return !KC3GearManager.carrierBasedAircraftType3Ids.includes(mstGear.api_type[3]) ? mstValue :
				// aircraft in 0-size slot take no effect, and
				// current formula for 0 proficiency aircraft only,
				// max level may give additional stats up to +2
				// under verifications for improvement bonus and proficiency: https://twitter.com/myteaGuard/status/1459541432050466816
				(!this.slotSize(i) ? 0 : Math.floor(mstValue * (0.65 + 0.1 * Math.sqrt(Math.max(0, this.slotSize(i) - 2)))));
		}).sumValues();
		if(isOnShipBonusIncluded){
			// unconfirmed: visible bonuses from all equipment types counted?
			total += this.equipmentTotalStats(apiName, true, true, true);
		}
		return total;
	};

	// estimated basic stats without equipments based on master data and modernization
	KC3Ship.prototype.estimateNakedStats = function(statAttr) {
		if(this.isDummy()) { return false; }
		const shipMst = this.master();
		if(!shipMst) { return false; }
		const stats = {
			fp: shipMst.api_houg[0] + this.mod[0],
			tp: shipMst.api_raig[0] + this.mod[1],
			aa: shipMst.api_tyku[0] + this.mod[2],
			ar: shipMst.api_souk[0] + this.mod[3],
			lk: shipMst.api_luck[0] + this.mod[4],
			hp: this.maxHp(false) + (this.mod[5] || 0),
		};
		// shortcuts for following funcs
		if(statAttr === "ls") return this.estimateNakedLoS();
		if(statAttr === "as") return this.estimateNakedAsw() + (this.mod[6] || 0);
		if(statAttr === "ev") return this.estimateNakedEvasion();
		return !statAttr ? stats : stats[statAttr];
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

	// estimated the base value (on lv1) of the 3-stats (evasion, asw, los) missing in master data,
	// based on current naked stats and max value (on lv99),
	// in case whoever wanna submit this in order to collect ship's exact stats quickly.
	// NOTE: naked stats needed, so should ensure no equipment equipped or at least no on ship bonus.
	// btw, exact evasion and asw values can be found at in-game picture book api data, but los missing still.
	KC3Ship.prototype.estimateBaseMasterStats = function() {
		if(this.isDummy()) { return false; }
		const info = {
			// evasion for ship should be `api_kaih`, here uses gear one instead
			houk: [0, this.ev[1], this.ev[0]],
			tais: [0, this.as[1], this.as[0]],
			saku: [0, this.ls[1], this.ls[0]],
		};
		const level = this.level;
		Object.keys(info).forEach(apiName => {
			const lv99Stat = info[apiName][1];
			const nakedStat = info[apiName][2] - this.equipmentTotalStats(apiName);
			info[apiName][3] = nakedStat;
			if(level && level > 99) {
				info[apiName][0] = false;
			} else {
				info[apiName][0] = WhoCallsTheFleetDb.estimateStatBase(nakedStat, lv99Stat, level);
				// try to get stats on maxed married level too
				info[apiName][4] = WhoCallsTheFleetDb.estimateStat({base: info[apiName][0], max: lv99Stat}, KC3Ship.getMaxLevel());
			}
		});
		info.level = level;
		info.mstId = this.masterId;
		info.equip = this.equipment(true).map(g => g.masterId);
		return info;
	};

	KC3Ship.prototype.equipmentTotalImprovementBonus = function(attackType){
		return this.equipment(true)
			.map(gear => gear.attackPowerImprovementBonus(attackType))
			.sumValues();
	};

	/**
	 * Maxed stats of this ship.
	 * @return stats without the equipment but with modernization at Lv.99,
	 *         stats at Lv.180 can be only estimated by data from known database.
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
	 * Indicate if some specific equipment (aircraft usually) equipped on non-0 slot.
	 */
	KC3Ship.prototype.hasNonZeroSlotEquipmentFunc = function(filterFunc, isExslotIncluded = false) {
		console.assert(typeof filterFunc === "function", "filter function must be defined");
		return this.equipment(isExslotIncluded).map(filterFunc)
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
	 *         max 6-elements including ex-slot.
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
	 *         max 6-elements including ex-slot.
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

	/**
	 * Static method of the same logic to find available damecon to be used first.
	 * @param equipArray - the master ID array of ship's all equipment including ex-slot at the last.
	 *        for 5-slot ship, array supposed to be 6 elements; otherwise should be always 5 elements.
	 * @see KC3Ship.prototype.findDameCon
	 * @see main.js#ShipModelReplica.prototype.useRepairItem - the repair items using order and the type codes
	 */
	KC3Ship.findDamecon = function(equipArray = []) {
		// push last item from ex-slot to 1st
		const sortedMstIds = equipArray.slice(-1);
		sortedMstIds.push(...equipArray.slice(0, -1));
		const dameconId = sortedMstIds.find(id => id === 42 || id === 43);
		// code 1 for repair team, 2 for repair goddess
		return dameconId === 42 ? 1 : dameconId === 43 ? 2 : 0;
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
	KC3Ship.prototype.fighterPower = function(forLbas = false){
		if(this.isDummy()){ return 0; }
		return this.equipment().map((g, i) => g.fighterPower(this.slots[i], forLbas)).sumValues();
	};

	/* FIGHTER POWER with WHOLE NUMBER BONUS
	Get fighter power of this ship as an array
	with consideration to whole number proficiency bonus
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterVeteran = function(forLbas = false){
		if(this.isDummy()){ return 0; }
		return this.equipment().map((g, i) => g.fighterVeteran(this.slots[i], forLbas)).sumValues();
	};

	/* FIGHTER POWER with LOWER AND UPPER BOUNDS
	Get fighter power of this ship as an array
	with consideration to min-max bonus
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterBounds = function(forLbas = false){
		if(this.isDummy()){ return [0, 0]; }
		const powerBounds = this.equipment().map((g, i) => g.fighterBounds(this.slots[i], forLbas));
		const reconModifier = this.fighterPowerReconModifier(forLbas);
		return [
			Math.floor(powerBounds.map(b => b[0]).sumValues() * reconModifier),
			Math.floor(powerBounds.map(b => b[1]).sumValues() * reconModifier)
		];
	};

	/**
	 * @return value of LB Recon modifier to LBAS sortie fighter power.
	 */
	KC3Ship.prototype.fighterPowerReconModifier = function(forLbas = false){
		var reconModifier = 1;
		this.equipment(function(id, idx, gear){
			if(!id || gear.isDummy()){ return; }
			const type2 = gear.master().api_type[2];
			// LB Recon Aircraft
			if(forLbas && type2 === 49){
				const los = gear.master().api_saku;
				reconModifier = Math.max(reconModifier,
					los >= 9 ? 1.18 : 1.15
				);
			}
		});
		return reconModifier;
	};

	/* FIGHTER POWER on Air Defense with INTERCEPTOR FORMULA
	Recon plane gives a modifier to total interception power
	--------------------------------------------------------------*/
	KC3Ship.prototype.interceptionPower = function(){
		if(this.isDummy()){ return 0; }
		var reconModifier = 1;
		this.equipment(function(id, idx, gear){
			if(!id || gear.isDummy()){ return; }
			const type2 = gear.master().api_type[2];
			if(KC3GearManager.landBaseReconnType2Ids.includes(type2)){
				const los = gear.master().api_saku;
				// Carrier Recon Aircraft
				if(type2 === 9){
					reconModifier = Math.max(reconModifier,
						(los <= 7) ? 1.2 :
						(los >= 9) ? 1.3 :
						1.2 // unknown
					);
				// LB Recon Aircraft
				} else if(type2 === 49){
					reconModifier = Math.max(reconModifier,
						(los <= 7) ? 1.18 : // unknown
						(los >= 9) ? 1.23 :
						1.18
					);
				// Recon Seaplane, Flying Boat, etc
				} else {
					reconModifier = Math.max(reconModifier,
						(los <= 7) ? 1.1  :
						(los >= 9) ? 1.16 :
						1.13
					);
				}
			}
		});
		var interceptionPower = this.equipment()
			.map((g, i) => g.interceptionPower(this.slots[i]))
			.sumValues();
		return Math.floor(interceptionPower * reconModifier);
	};

	/* SUPPORT POWER
	 * Get basic pre-cap support expedition shelling power of this ship.
	 * http://kancolle.wikia.com/wiki/Expedition/Support_Expedition
	 * http://wikiwiki.jp/kancolle/?%BB%D9%B1%E7%B4%CF%C2%E2
	--------------------------------------------------------------*/
	KC3Ship.prototype.supportShellingPower = function(){
		if(this.isDummy()){ return 0; }
		const fixedFP = this.estimateNakedStats("fp") + this.statsSp("fp") - 1;
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
			// Explicit fire power bonus from equipment on specific ship taken into account:
			// http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:2354#13
			// so better to use current fp value from `api_karyoku` (including naked fp + all equipment fp),
			// to avoid the case that fp bonus not accurately updated in time.
			supportPower = 5 + this.fp[0] + this.statsSp("fp") - 1;
			// should be the same value with above if `equipmentTotalStats` works properly
			//supportPower = 5 + fixedFP + this.equipmentTotalStats("houg");
		}
		return supportPower;
	};

	/**
	 * Get support expedition airstrike power of this ship (with cap and post-cap modifiers).
	 * @see KC3Gear.prototype.airstrikePower
	 * @see https://wikiwiki.jp/kancolle/%E6%94%AF%E6%8F%B4%E8%89%A6%E9%9A%8A#kfb57034
	 */
	KC3Ship.prototype.supportAirstrikePower = function(isCritical = false){
		const totalPower = [0, 0, false];
		if(this.isDummy()) { return totalPower; }
		// no ex-slot by default since no plane can be equipped on ex-slot for now
		this.equipment().forEach((gear, i) => {
			if(this.slots[i] > 0 && gear.isAirstrikeAircraft()) {
				const power = gear.airstrikePower(this.slots[i], 0, false, true);
				const isRange = !!power[2];
				const capped = [
					this.applyPowerCap(power[0], "Day", "Support").power,
					isRange ? this.applyPowerCap(power[1], "Day", "Support").power : 0
				];
				const postCapped = [
					Math.floor(this.applyPostcapModifiers(capped[0], "SupportAerial", undefined, 0, isCritical).power),
					isRange ? Math.floor(this.applyPostcapModifiers(capped[1], "SupportAerial", undefined, 0, isCritical).power) : 0
				];
				totalPower[0] += postCapped[0];
				totalPower[1] += isRange ? postCapped[1] : postCapped[0];
				totalPower[2] = totalPower[2] || isRange;
			}
		});
		return totalPower;
	};

	/**
	 * Get support expedition aerial anti-sub power of this ship (with cap and post-cap modifiers).
	 * @see https://wikiwiki.jp/kancolle/%E6%94%AF%E6%8F%B4%E8%89%A6%E9%9A%8A#i0093bc7
	 */
	KC3Ship.prototype.supportAntisubPower = function(isCritical = false){
		var randomPower = [0, 0, 0];
		if(this.isDummy()) { return aswPower; }
		var aswPower = 0;
		// no ex-slot by default since no plane can be equipped on ex-slot for now
		this.equipment().forEach((gear, i) => {
			if(this.slots[i] > 0 && gear.isAswAircraft(false, true)) {
				const asw = gear.master().api_tais || 0;
				const power = 3 + Math.floor(Math.floor(asw * 0.6) * Math.sqrt(this.slots[i]));
				const capped = this.applyPowerCap(power, "Day", "Support").power;
				aswPower += this.applyPostcapModifiers(capped, "SupportAntisub", undefined, 0, isCritical).power;
			}
		});
		// 3 random post-cap modifiers, rates: [40%, 10%, 50%]
		[1.2, 1.5, 2.0].map(mod => Math.floor(aswPower * mod)).forEach((v, i) => {
			randomPower[i] += v;
		});
		return randomPower;
	};

	/**
	 * Get basic pre-cap shelling fire power of this ship (without pre-cap / post-cap modifiers).
	 *
	 * @param {number} combinedFleetFactor - additional power if ship is on a combined fleet.
	 * @param {boolean} isTargetLand - if the power is applied to a land-installation target.
	 * @return {number} computed fire power, return 0 if unavailable.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#ua92169d
	 */
	KC3Ship.prototype.shellingFirePower = function(combinedFleetFactor = 0, isTargetLand = false){
		if(this.isDummy()) { return 0; }
		let isCarrierShelling = this.isCarrier();
		if(!isCarrierShelling) {
			// Hayasui Kai gets special when any Torpedo Bomber equipped
			if(this.isHayasuiKaiWithTorpedoBomber()) isCarrierShelling = true;
			// Yamashiomaru gets special if any Dive/Torpedo Bomber equipped
			if(this.isYamashiomaruWithBomber()) isCarrierShelling = true;
		}
		let shellingPower = this.fp[0] + this.statsSp("fp");
		if(isCarrierShelling) {
			if(isTargetLand) {
				// https://wikiwiki.jp/kancolle/%E6%88%A6%E9%97%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6#od036af3
				// https://wikiwiki.jp/kancolle/%E5%AF%BE%E5%9C%B0%E6%94%BB%E6%92%83#AGCalcCV
				// TP from all Torpedo Bombers not taken into account, DV power counted,
				//   current TB with DV power: TBM-3W+3S
				// Regular Dive Bombers make carrier cannot attack against land-installation,
				//   with some exceptions, see #antiLandDiveBomberIds
				// DV power from Skilled Deck Personnel counted?
				// DV power from items other than previous ones should not be counted
				const eqBaku = this.equipmentTotalStats("baku", true, false, false, [8, 58, 35]);
				const dbBaku = this.equipmentTotalStats("baku", true, false, false, [7, 57],
					KC3GearManager.antiLandDiveBomberIds);
				shellingPower += Math.floor(1.3 * (eqBaku + dbBaku));
			} else {
				// Should limit to TP from equippable aircraft?
				// ~~TP visible bonus from Torpedo Bombers no effect.~~ Added since 2021-08-04
				// but calculation is strange for 2 or more bonus planes: https://twitter.com/myteaGuard/status/1423010128349913092
				shellingPower += this.equipmentTotalStats("raig", true, true);
				// ~~DV visible bonus not implemented yet~~ found from non-aircraft since 2022-08-26:
				// [478] Skilled Deck Personnel + Aviation Maintenance Hands
				// DV power from antisub patrol aircraft counted against surface as expected:
				//   https://twitter.com/twillwave1024/status/1620737825963646976
				shellingPower += Math.floor(1.3 * this.equipmentTotalStats("baku", true, true));
			}
			shellingPower += combinedFleetFactor;
			shellingPower += this.equipmentTotalImprovementBonus("airattack");
			shellingPower = Math.floor(1.5 * shellingPower);
			shellingPower += 50;
		} else {
			shellingPower += combinedFleetFactor;
			shellingPower += this.equipmentTotalImprovementBonus("fire");
		}
		// 5 is attack power constant also used everywhere for day time
		shellingPower += 5;
		return shellingPower;
	};

	/**
	 * Get pre-cap torpedo power of this ship.
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#n377a90c
	 */
	KC3Ship.prototype.shellingTorpedoPower = function(combinedFleetFactor = 0){
		if(this.isDummy()) { return 0; }
		return 5 + this.tp[0] + this.statsSp("tp") + combinedFleetFactor +
			this.equipmentTotalImprovementBonus("torpedo");
	};

	/**
	 * Get pre-cap night battle power of this ship.
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#b717e35a
	 */
	KC3Ship.prototype.nightBattlePower = function(nightContactPlaneId = 0){
		if(this.isDummy()) { return 0; }
		// Night contact power bonus based on recon accuracy value: 1: 5, 2: 7, >=3: 9
		// ~~but currently only Type 98 Night Recon implemented (acc: 1), so always +5~~
		// new night recon (acc: 2) implemented since 2022-06-30
		const nightContact = KC3Gear.isNightContactAircraft(nightContactPlaneId, true);
		return nightContact.powerBonus + this.fp[0] + this.tp[0]
			+ this.statsSp("fp") + this.statsSp("tp")
			+ this.equipmentTotalImprovementBonus("yasen");
	};

	/**
	 * Get pre-cap carrier night aerial attack power of this ship.
	 * This formula is the same with the one above besides slot bonus part and filtered equipment stats.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see https://wikiwiki.jp/kancolle/%E6%88%A6%E9%97%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6#nightAS
	 * @see https://wikiwiki.jp/kancolle/%E5%AF%BE%E5%9C%B0%E6%94%BB%E6%92%83#AGCalcCVN
	 */
	KC3Ship.prototype.nightAirAttackPower = function(nightContactPlaneId = 0, isTargetLand = false){
		if(this.isDummy()) { return 0; }
		const equipTotals = {
			fp: 0, tp: 0, dv: 0, slotBonus: 0, improveBonus: 0
		};
		// Generally, power from only night capable aircraft will be taken into account.
		// For Ark Royal (Kai) + Swordfish - Night Aircraft (despite of NOAP), only Swordfish counted.
		const isThisArkRoyal = [515, 393].includes(this.masterId);
		const isLegacyArkRoyal = isThisArkRoyal && !this.canCarrierNightAirAttack();
		// Skilled Deck Personnel + Aviation Maintenance Hands
		const nightPlaneMstIds = [478];
		this.equipment().forEach((gear, idx) => {
			if(gear.exists()) {
				const master = gear.master();
				const type2 = master.api_type[2];
				const type3 = master.api_type[3];
				const slot = this.slots[idx];
				const isNightAircraftType = KC3GearManager.nightAircraftType3Ids.includes(type3);
				// Swordfish variants as special torpedo bombers
				const isSwordfish = [242, 243, 244].includes(gear.masterId);
				// Zero Fighter Model 62 (Fighter-bomber Iwai Squadron)
				// Suisei Model 12 (Type 31 Photoelectric Fuze Bombs)
				const isSpecialNightPlane = [154, 320].includes(gear.masterId);
				const isNightPlane = isLegacyArkRoyal ? isSwordfish :
					isNightAircraftType || isSwordfish || isSpecialNightPlane;
				if(isNightPlane && slot > 0) {
					nightPlaneMstIds.push(master.api_id);
					equipTotals.fp += master.api_houg || 0;
					if(!isTargetLand) equipTotals.tp += master.api_raig || 0;
					if([7, 57].includes(type2)) equipTotals.dv += master.api_baku || 0;
					if(!isLegacyArkRoyal) {
						// Bonus from night aircraft slot which also takes bombing and asw stats into account
						equipTotals.slotBonus += slot * (isNightAircraftType ? 3 : 0);
						const ftbaPower = master.api_houg + master.api_raig + master.api_baku + master.api_tais;
						equipTotals.slotBonus += Math.sqrt(slot) * ftbaPower * (isNightAircraftType ? 0.45 : 0.3);
					}
					equipTotals.improveBonus += gear.attackPowerImprovementBonus("yasen");
				}
			}
		});
		let shellingPower = this.estimateNakedStats("fp");
		shellingPower += equipTotals.fp + equipTotals.tp + equipTotals.dv;
		// No effect for visible FP bonus
		// TP bonus added since 2021-08-04, not affect slotBonus part, weird multi-planes calc unimplemented
		if(!isTargetLand) shellingPower += this.equipmentTotalStats("raig", true, true, true, [8, 58, 35], nightPlaneMstIds);
		// DV bonus counted since SDPAMH? and special improvement bonus from SDPAMH?
		// https://twitter.com/yukicacoon/status/1566320330544521216
		// FIXME: but should be applied post night cutin modifier instead of base power here?
		// https://twitter.com/yukicacoon/status/1566425711065174016
		shellingPower += this.equipmentTotalStats("baku", true, true, true, [7, 57, 35], nightPlaneMstIds);
		if(this.hasEquipment(478)) equipTotals.improveBonus += this.equipment(true)
			.reduce((b, g) => b + (g.masterId === 478 ? 0.7 * Math.sqrt(g.stars || 0) : 0), 0);
		shellingPower += equipTotals.slotBonus;
		shellingPower += equipTotals.improveBonus;
		shellingPower += KC3Gear.isNightContactAircraft(nightContactPlaneId, true).powerBonus;
		return shellingPower;
	};

	KC3Ship.prototype.isAswAirAttack = function(){
		// check asw attack type, 1530 is Abyssal Submarine Ka-Class
		return this.estimateDayAttackType(1530, false)[0] === "AirAttack";
	};

	/**
	 * Get pre-cap anti-sub power of this ship.
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#AntiSubmarine
	 */
	KC3Ship.prototype.antiSubWarfarePower = function(aswDiff = 0){
		if(this.isDummy()) { return 0; }
		const isAirAttack = this.isAswAirAttack();
		const attackMethodConst = isAirAttack ? 8 : 13;
		const nakedAsw = this.nakedAsw() + aswDiff;
		// only asw stat from partial types of equipment taken into account
		const equipmentTotalAsw = this.effectiveEquipmentTotalAsw(isAirAttack);
		let aswPower = attackMethodConst;
		aswPower += 2 * Math.sqrt(nakedAsw);
		aswPower += 1.5 * equipmentTotalAsw;
		aswPower += this.equipmentTotalImprovementBonus("asw");
		// should move synergy modifier to pre-cap?
		let synergyModifier = 1;
		// DC + DCP synergy (x1.1 / x1.25)
		const isDepthChargeEquipped = this.equipment(true).some(g => g.isDepthCharge());
		const isDepthChargeProjectorEquipped = this.equipment(true).some(g => g.isDepthChargeProjector());
		if(isDepthChargeEquipped && isDepthChargeProjectorEquipped) {
			// Large Sonar, like T0 Sonar, not counted here
			const isSonarEquipped = this.hasEquipmentType(2, 14);
			synergyModifier = isSonarEquipped ? 1.25 : 1.1;
		}
		// legacy all types of sonar + all DC(P) synergy (x1.15)
		synergyModifier *= this.hasEquipmentType(3, 18) && this.hasEquipmentType(3, 17) ? 1.15 : 1;
		aswPower *= synergyModifier;
		return aswPower;
	};

	/**
	 * Get anti-installation power against all possible types of installations.
	 * Will choose meaningful installation types based on current equipment.
	 * Special attacks and battle conditions are not taken into consideration.
	 * @return {array} with element {Object} that has attributes:
	 *  * enemy: Enemy ID to get icon
	 *  * dayPower: Day attack power of ship
	 *  * nightPower: Night attack power of ship
	 *  * modifiers: Known anti-installation modifiers
	 *  * damagedPowers: Day & night attack power tuple on Chuuha ship
	 * @see estimateInstallationEnemyType for kc3-unique installation types
	 */
	KC3Ship.prototype.shipPossibleAntiLandPowers = function(){
		if(this.isDummy()) { return []; }
		let possibleTypes = [];
		const hasAntiLandRocket = this.hasEquipment([126, 346, 347, 348, 349]);
		const hasT3Shell = this.hasEquipmentType(2, 18);
		const hasLandingCraft = this.hasEquipmentType(2, [24, 46]);
		// WG42 variants/landing craft-type eligible for all
		if (hasAntiLandRocket || hasLandingCraft){
			possibleTypes = [1, 2, 3, 4, 5];
		}
		// T3 Shell eligible for all except Pillbox
		else if(hasT3Shell){
			possibleTypes = [1, 3, 4, 5];
		}
		// Return empty if no anti-installation weapon found
		else {
			return [];
		}
		// Dummy target enemy IDs, also used for abyssal icons
		// 1573: Harbor Princess, 1665: Artillery Imp, 1668: Isolated Island Princess
		// 1656: Supply Depot Princess - Damaged, 1699: Summer Harbor Princess
		const dummyEnemyList = [1573, 1665, 1668, 1656, 1699];
		const basicPower = this.shellingFirePower(0, true);
		const basicPowerNight = this.nightBattlePower() - this.tp[0] - this.statsSp("tp");
		const resultList = [];
		// Fill damage lists for each enemy type
		possibleTypes.forEach(installationType => {
			const obj = {};
			const dummyEnemy = dummyEnemyList[installationType - 1];
			// Modifiers from special attacks, battle conditions are not counted for now
			const fixedDayPreConds = ["Shelling", 1, undefined, undefined, false, false, dummyEnemy],
				fixedNightPreConds = ["Shelling", 1, undefined, ["SingleAttack", 0], false, false, dummyEnemy],
				fixedDayPostConds = ["Shelling", undefined, 0, false, false, 0, false, dummyEnemy],
				fixedNightPostConds = ["Shelling", [], 0, false, false, 0, false, dummyEnemy];
			const {power: precap, antiLandModifier, antiLandAdditive} = this.applyPrecapModifiers(basicPower, ...fixedDayPreConds);
			let {power} = this.applyPowerCap(precap, "Day", "Shelling");
			const postcapInfo = this.applyPostcapModifiers(power, ...fixedDayPostConds);
			power = postcapInfo.power;
			
			obj.enemy = dummyEnemy;
			obj.modifiers = {
				antiLandModifier,
				antiLandAdditive,
				postCapAntiLandModifier: postcapInfo.antiLandModifier,
				postCapAntiLandAdditive: postcapInfo.antiLandAdditive
			};
			obj.dayPower = Math.floor(power);
			
			({power} = this.applyPrecapModifiers(basicPowerNight, ...fixedNightPreConds));
			({power} = this.applyPowerCap(power, "Night", "Shelling"));
			({power} = this.applyPostcapModifiers(power, ...fixedNightPostConds));
			obj.nightPower = Math.floor(power);
			
			// Get Chuuha day attack power (in case of nuke setups)
			fixedDayPreConds.push("chuuha");
			({power} = this.applyPrecapModifiers(basicPower, ...fixedDayPreConds));
			({power} = this.applyPowerCap(power, "Day", "Shelling"));
			({power} = this.applyPostcapModifiers(power, ...fixedDayPostConds));
			obj.damagedPowers = [Math.floor(power)];
			
			// Get Chuuha night power
			fixedNightPreConds.push("chuuha");
			({power} = this.applyPrecapModifiers(basicPowerNight, ...fixedNightPreConds));
			({power} = this.applyPowerCap(power, "Night", "Shelling"));
			({power} = this.applyPostcapModifiers(power, ...fixedNightPostConds));
			obj.damagedPowers.push(Math.floor(power));
			
			resultList.push(obj);
		});
		return resultList;
	};

	/**
	 * Calculate landing craft pre-cap/post-cap bonus depending on installation type.
	 * @param installationType - kc3-unique installation types
	 * @param isNight - is something special for night battle
	 * @return {number} multiplier of landing craft
	 * @see estimateInstallationEnemyType
	 * @see http://kancolle.wikia.com/wiki/Partials/Anti-Installation_Weapons
	 * @see https://wikiwiki.jp/kancolle/%E5%AF%BE%E5%9C%B0%E6%94%BB%E6%92%83
	 */
	KC3Ship.prototype.calcLandingCraftBonus = function(installationType = 0, isNight = false){
		if(this.isDummy() || ![1, 2, 3, 4, 5].includes(installationType)) { return 0; }
		// 8 types of (14 gears) Daihatsu Landing Craft with known bonus:
		//  * 0: [167] Special Type 2 Amphibious Tank, exactly this one is in different type named 'Tank'
		//  * 1: [166,449,494,495,482,514] Daihatsu Landing Craft (Type 89 Medium Tank & Landing Force), Toku Daihatsu Landing Craft + Type 1 Gun Tank, Toku Daihatsu Landing Craft + Chi-Ha (conditional, Kai either), Panzer III
		//  * 2: [68] Daihatsu Landing Craft
		//  * 3: [230] Toku Daihatsu Landing Craft + 11th Tank Regiment
		//  * 4: [193,482,514] Toku Daihatsu Landing Craft, Toku Daihatsu Landing Craft + Panzer III (North African Specification), Toku Daihatsu Landing Craft + Panzer III Ausf. J?
		//  * 5: [355,495,514] M4A1 DD, Toku Daihatsu Landing Craft + Chi-Ha Kai, Panzer III Ausf. J?
		//  * 6: [408,409] Soukoutei (Armored Boat Class), Armed Daihatsu
		//  * 7: [436] Daihatsu Landing Craft (Panzer II / North African Specification)
		const landingCraftIds = [167, [166, 449, 482, 514], 68, 230, [193, 482, 514], [355, 495, 514], [408, 409], 436];
		const landingCraftCounts = landingCraftIds.map(id => this.countEquipment(id));
		const landingModifiers = KC3GearManager.landingCraftModifiers[installationType - 1] || {};
		const getModifier = (type, modName = "base") => (
			(landingModifiers[modName] || [])[type] || 1
		);
		const forSdpPostcap = installationType === 4;
		let sdpPostcapImpPow = 1;
		let landingBaseBonus = 1, oneGearBonus = 1, moreGearBonus = 1;
		let improvementBonus = 1;
		let landingGroupStars = 0, tankGroupStars = 0;
		let landingGroupCount = 0, tankGroupCount = 0;
		landingCraftCounts.forEach((count, type) => {
			if(count > 0) {
				if(type > 0) {
					landingBaseBonus = Math.max(landingBaseBonus, getModifier(type));
					landingGroupCount += count;
				} else {
					// T2 Tank base bonus fixed to 1.0
					landingBaseBonus = Math.max(landingBaseBonus, 1);
					tankGroupCount += count;
				}
				this.equipment().forEach((g, i) => {
					const ids = landingCraftIds[type], mstId = g.masterId;
					if(g.exists() && (Array.isArray(ids) ? ids.includes(mstId) : ids === mstId)) {
						if(type > 0) {
							landingGroupStars += g.stars;
						} else {
							tankGroupStars += g.stars;
						}
					}
				});
				if((!forSdpPostcap && type === 6 && isNight)) {
					// no precap bonus except the base one on yasen for type 6
					oneGearBonus *= 1;
				} else {
					oneGearBonus *= getModifier(type, "count1");
					if(count > 1) { moreGearBonus *= getModifier(type, "count2"); }
					// only get count2 bonus when chiha with t89
					else if(type === 1) {
						const t89Count = this.countEquipment(166),
							chihaCount = this.countEquipment([494, 495]);
						if(t89Count > 0 && chihaCount > 0) { moreGearBonus *= getModifier(type, "count2"); }
					}
				}
			}
		});
		if(forSdpPostcap) {
			const hasType89LandingForce = this.hasEquipment([166, 494, 495]);
			const hasHoni1 = this.hasEquipment(449);
			const hasPanzer2 = this.hasEquipment(436);
			const hasPanzer3 = this.hasEquipment([482, 514]);
			// When T89Tank/Honi1/Panzer2/Panzer3 equipped, Supply Depot Princess's postcap improvement bonus ^(1+n)
			sdpPostcapImpPow = 1 + ((hasType89LandingForce || hasHoni1 || hasPanzer3) & 1) + ((hasType89LandingForce && hasPanzer2) & 1);
		}
		if(landingGroupCount > 0) improvementBonus *= Math.pow(
			landingGroupStars / landingGroupCount / 50 + 1,
			forSdpPostcap ? sdpPostcapImpPow : 1
		);
		if(tankGroupCount > 0) improvementBonus *= tankGroupStars / tankGroupCount / 30 + 1;
		// Multiply modifiers
		return landingBaseBonus * oneGearBonus * moreGearBonus * improvementBonus;
	};

	/**
	 * Get anti land installation power bonus & multiplier of this ship.
	 * @param targetShipMasterId - target land installation master ID.
	 * @param precap - type of bonus, false for post-cap, pre-cap by default.
	 * @param warfareType - to indicate if use different modifiers for phases other than day shelling.
	 * @param isNight - to indicate if use different modifiers for night battle.
	 * @see https://kancolle.fandom.com/wiki/Combat/Installation_Type
	 * @see https://wikiwiki.jp/kancolle/%E5%AF%BE%E5%9C%B0%E6%94%BB%E6%92%83#AGBonus
	 * @see https://twitter.com/T3_1206/status/994258061081505792
	 * @see https://twitter.com/KennethWWKK/status/1045315639127109634
	 * @see https://yy406myon.hatenablog.jp/entry/2018/09/14/213114
	 * @see https://cdn.discordapp.com/attachments/425302689887289344/614879250419417132/ECrra66VUAAzYMc.jpg_orig.jpg
	 * @see https://bbs.nga.cn/read.php?tid=16936146
	 * @see https://github.com/Nishisonic/UnexpectedDamage/blob/master/UnexpectedDamage.js
	 * @see estimateInstallationEnemyType
	 * @see calcLandingCraftBonus
	 * @return {Object} of {
	 * 		modifiers: {
	 * 			general bonus (precap/postcap),
	 * 			precap stype (dd/cl),
	 * 			precap special (toku) daihatsu + (shikon/gun) tank,
	 * 			precap m4a1dd,
	 * 			precap gun tank,
	 * 			precap chiha tank,
	 * 			precap chiha tank kai,
	 * 			precap daihatsu synergy,
	 * 		},
	 * 		additives: {
	 * 			general bonus (precap/postcap),
	 * 			precap stype (ss/ssv),
	 * 			precap special (toku) daihatsu + tank,
	 * 			precap m4a1dd,
	 * 			precap gun tank,
	 * 			precap chiha tank,
	 * 			precap chiha tank kai,
	 * 			precap daihatsu synergy,
	* 		}
	 * }
	 */
	KC3Ship.prototype.antiLandWarfarePowerMods = function(targetShipMasterId = 0, precap = true, warfareType = "Shelling", isNight = false){
		if(this.isDummy()) { return { modifiers: {}, additives: {} }; }
		const installationType = this.estimateInstallationEnemyType(targetShipMasterId, precap);
		if(!installationType) { return { modifiers: {}, additives: {} }; }
		let generalAdditive = 0, generalModifier = 1,
			stypeAdditive = 0, stypeModifier = 1,
			spTankAdditive = 0, spTankModifier = 1,
			m4a1ddAdditive = 0, m4a1ddModifier = 1,
			gunTankAdditive = 0, gunTankModifier = 1,
			chihaTankAdditive = 0, chihaTankModifier = 1,
			chihaTankKaiAdditive = 0, chihaTankKaiModifier = 1,
			synergyAdditive = 0, synergyModifier = 1;
		
		let wg42Bonus = 1;
		let type4RocketBonus = 1;
		let mortarBonus = 1;
		let t3Bonus = 1;
		let apShellBonus = 1;
		let seaplaneBonus = 1;
		let diveBomberBonus = 1;
		let airstrikeBomberBonus = 1;
		const landingBonus = this.calcLandingCraftBonus(installationType, isNight);
		
		const wg42Count = this.countEquipment(126);
		const mortarCount = this.countEquipment(346);
		const mortarCdCount = this.countEquipment(347);
		const type4RocketCount = this.countEquipment(348);
		const type4RocketCdCount = this.countEquipment(349);
		const hasT3Shell = this.hasEquipmentType(2, 18);
		const hasSeaplane = this.hasEquipmentType(2, [11, 45]);
		const diveBomberCount = this.countEquipmentType(2, [7, 57]);
		
		if(precap) {
			const shikonCount = this.countEquipment(230);
			const m4a1ddCount = this.countEquipment(355);
			const honi1Count = this.countEquipment(449);
			const panzer3Count = this.countEquipment(482);
			const chihaCount = this.countEquipment(494);
			const chihaKaiCount = this.countEquipment(495);
			const submarineBonus = this.isSubmarine() ? 30 : 0;
			
			// [0, 70, 110, 140, 160] additive for each WG42 from PSVita KCKai
			const wg42Additive = !wg42Count ? 0 : [0, 75, 110, 140, 160][wg42Count] || 160;
			// Known 5 rockets still 190: https://twitter.com/hedgehog_hasira/status/1579111963925225472
			const type4RocketAdditive = !type4RocketCount ? 0 : [0, 55, 115, 160, 190][type4RocketCount] || 190;
			const type4RocketCdAdditive = !type4RocketCdCount ? 0 : [0, 80, 170, 230][type4RocketCdCount] || 230;
			const mortarAdditive = !mortarCount ? 0 : [0, 30, 55, 75, 90][mortarCount] || 90;
			const mortarCdAdditive = !mortarCdCount ? 0 : [0, 60, 110, 150, 180][mortarCdCount] || 180;
			const rocketsAdditive = wg42Additive + type4RocketAdditive + type4RocketCdAdditive + mortarAdditive + mortarCdAdditive;
			
			// Following synergy bonuses from Armored Boat and Armed Daihatsu:
			//   https://twitter.com/oxke_admiral/status/1642326265364615168
			//   https://twitter.com/hedgehog_hasira/status/1641121541378260996
			//   https://twitter.com/yukicacoon/status/1383313261089542152
			//   https://twitter.com/yukicacoon/status/1368513654111408137
			const abCount = this.countEquipment(408);
			const armedCount = this.countEquipment(409);
			// Normal, T89, Toku, Panzer2, Honi1
			const dlcGroup1Count = this.countEquipment([68, 166, 193, 436, 449]);
			// T2 tank, T11 shikon, Panzer3, Chiha &Kai
			const dlcGroup2Count = this.countEquipment([167, 230, 482, 514, 494, 495]);
			// strange fact: if 2 Armed Daihatsu (0 AB boat) equipped, multiplicative and additive is 0, suspected to be a bug using `==1`
			const singleSynergyFlag = abCount === 1 || armedCount === 1;
			const doubleSynergyFlag = abCount >= 1 && armedCount >= 1;
			const dlcGroupLevel1Flag = dlcGroup1Count + dlcGroup2Count >= 1;
			const dlcGroupLevel2Flag = dlcGroup1Count + dlcGroup2Count >= 2;
			const singleSynergyModifier = singleSynergyFlag && dlcGroupLevel1Flag ? 0.2 : 0;
			const doubleSynergyModifier = doubleSynergyFlag && dlcGroupLevel2Flag ? 0.3 :
				doubleSynergyFlag && dlcGroup2Count >= 1 ? 0.2 :
				doubleSynergyFlag && dlcGroup1Count >= 1 ? 0.1 : 0;
			const singleSynergyAdditive = singleSynergyFlag && dlcGroupLevel1Flag ? 10 : 0;
			const doubleSynergyAdditive = doubleSynergyFlag && dlcGroupLevel2Flag ? 15 :
				doubleSynergyFlag && dlcGroup2Count >= 1 ? 10 :
				doubleSynergyFlag && dlcGroup1Count >= 1 ? 5 : 0;
			const abdSynergyModifier = 1 + singleSynergyModifier + doubleSynergyModifier;
			const abdSynergyAdditive = singleSynergyAdditive + doubleSynergyAdditive;
			
			// Cumulative extra bonus set from tank embedded daihtsu: Shikon, DDTank, Honi1, Panzer3, Chiha
			// although here using word 'tank', but they are in landing craft cateory unlike T2 tank
			// Different for uncategorized surface installation types, eg: Anchorage Water Demon Vacation Mode x1.1 for shikon only, Dock Princess x1.4 +0 for 3 sptanks
			spTankModifier = shikonCount + honi1Count + panzer3Count ? 1.8 : 1;
			spTankAdditive = shikonCount + honi1Count + panzer3Count ? 25 : 0;
			m4a1ddModifier = m4a1ddCount ? 1.4 : 1;
			m4a1ddAdditive = m4a1ddCount ? 35 : 0;
			gunTankModifier = honi1Count ? 1.3 : 1;
			gunTankAdditive = honi1Count ? 42 : 0;
			// https://twitter.com/Camellia_bb/status/1641254420246839301
			chihaTankModifier = chihaCount ? 1.4 : 1;
			chihaTankAdditive = chihaCount ? 28 : 0;
			chihaTankKaiModifier = chihaKaiCount ? 1.5 : 1;
			chihaTankKaiAdditive = chihaKaiCount ? 33 : 0;
			
			switch(installationType) {
				case 1: // Soft-skinned, general type of land installation
					t3Bonus = hasT3Shell ? 2.5 : 1;
					seaplaneBonus = hasSeaplane ? 1.2 : 1;
					wg42Bonus = [1, 1.3, 1.3 * 1.4][wg42Count] || 1.82;
					type4RocketBonus = [1, 1.25, 1.25 * 1.5][type4RocketCount + type4RocketCdCount] || 1.875;
					mortarBonus = [1, 1.2, 1.2 * 1.3][mortarCount + mortarCdCount] || 1.56;
					
					// Set additive modifier, multiply multiplicative modifiers
					generalAdditive += rocketsAdditive;
					generalModifier *= landingBonus;
					generalModifier *= t3Bonus * seaplaneBonus;
					generalModifier *= wg42Bonus * type4RocketBonus * mortarBonus;
					stypeAdditive += submarineBonus;
					synergyModifier *= abdSynergyModifier;
					synergyAdditive += abdSynergyAdditive;
					break;
				
				case 2: // Pillbox, Artillery Imp
					apShellBonus = this.hasEquipmentType(2, 19) ? 1.85 : 1;
					// Works even if slot is zeroed
					seaplaneBonus = hasSeaplane ? 1.5 : 1;
					diveBomberBonus = [1, 1.5, 1.5 * 2.0][diveBomberCount] || 3;
					// DD/CL bonus
					const lightShipBonus = [2, 3].includes(this.master().api_stype) ? 1.4 : 1;
					wg42Bonus = [1, 1.6, 1.6 * 1.7][wg42Count] || 2.72;
					type4RocketBonus = [1, 1.5, 1.5 * 1.8][type4RocketCount + type4RocketCdCount] || 2.7;
					mortarBonus = [1, 1.3, 1.3 * 1.5][mortarCount + mortarCdCount] || 1.95;
					
					// Set additive modifier, multiply multiplicative modifiers
					generalAdditive += rocketsAdditive;
					generalModifier *= landingBonus;
					generalModifier *= apShellBonus * seaplaneBonus * diveBomberBonus;
					generalModifier *= wg42Bonus * type4RocketBonus * mortarBonus;
					stypeAdditive += submarineBonus;
					stypeModifier *= lightShipBonus;
					synergyModifier *= abdSynergyModifier;
					synergyAdditive += abdSynergyAdditive;
					break;
				
				case 3: // Isolated Island Princess
					diveBomberBonus = [1, 1.4, 1.4 * 1.75][diveBomberCount] || 2.45;
					t3Bonus = hasT3Shell ? 1.75 : 1;
					wg42Bonus = [1, 1.4, 1.4 * 1.5][wg42Count] || 2.1;
					type4RocketBonus = [1, 1.3, 1.3 * 1.65][type4RocketCount + type4RocketCdCount] || 2.145;
					mortarBonus = [1, 1.2, 1.2 * 1.4][mortarCount + mortarCdCount] || 1.68;
					
					// Set additive modifier, multiply multiplicative modifiers
					generalAdditive += rocketsAdditive;
					generalModifier *= landingBonus;
					generalModifier *= t3Bonus * diveBomberBonus;
					generalModifier *= wg42Bonus * type4RocketBonus * mortarBonus;
					stypeAdditive += submarineBonus;
					synergyModifier *= abdSynergyModifier;
					synergyAdditive += abdSynergyAdditive;
					break;
				
				case 5: // Summer Harbor Princess
					seaplaneBonus = hasSeaplane ? 1.3 : 1;
					diveBomberBonus = [1, 1.3, 1.3 * 1.2][diveBomberCount] || 1.56;
					wg42Bonus = [1, 1.4, 1.4 * 1.2][wg42Count] || 1.68;
					t3Bonus = hasT3Shell ? 1.75 : 1;
					type4RocketBonus = [1, 1.25, 1.25 * 1.4][type4RocketCount + type4RocketCdCount] || 1.75;
					mortarBonus = [1, 1.1, 1.1 * 1.15][mortarCount + mortarCdCount] || 1.265;
					apShellBonus = this.hasEquipmentType(2, 19) ? 1.3 : 1;
					
					// Set additive modifier, multiply multiplicative modifiers
					generalAdditive += rocketsAdditive;
					generalModifier *= landingBonus;
					generalModifier *= t3Bonus * apShellBonus * seaplaneBonus * diveBomberBonus;
					generalModifier *= wg42Bonus * type4RocketBonus * mortarBonus;
					stypeAdditive += submarineBonus;
					synergyModifier *= abdSynergyModifier;
					synergyAdditive += abdSynergyAdditive;
					break;
			}
		} else { // Post-cap types
			switch(installationType) {
				case 1: // Soft-skinned, general type of land installation except SDP case 4
					break;
				
				case 2: // Pillbox, Artillery Imp
					// Dive Bomber, Seaplane Bomber, LBAA, Jet Dive Bomber on airstrike phase
					airstrikeBomberBonus = warfareType === "Aerial" &&
						this.hasEquipmentType(2, [7, 11, 47, 57]) ? 1.55 : 1;
					generalModifier *= airstrikeBomberBonus;
					break;
				
				case 3: // Isolated Island Princess
					airstrikeBomberBonus = warfareType === "Aerial" &&
						this.hasEquipmentType(2, [7, 11, 47, 57]) ? 1.7 : 1;
					generalModifier *= airstrikeBomberBonus;
					break;
				
				case 4: // Supply Depot Princess
					wg42Bonus = [1, 1.25, 1.25 * 1.3][wg42Count] || 1.625;
					type4RocketBonus = [1, 1.2, 1.2 * 1.4][type4RocketCount + type4RocketCdCount] || 1.68;
					mortarBonus = [1, 1.15, 1.15 * 1.2][mortarCount + mortarCdCount] || 1.38;
					generalModifier *= landingBonus;
					generalModifier *= wg42Bonus * type4RocketBonus * mortarBonus;
					break;
			}
		}
		return {
			modifiers: {
				generalModifier,
				stypeModifier,
				spTankModifier,
				m4a1ddModifier,
				gunTankModifier,
				chihaTankModifier,
				chihaTankKaiModifier,
				synergyModifier,
			},
			additives: {
				generalAdditive,
				stypeAdditive,
				spTankAdditive,
				m4a1ddAdditive,
				gunTankAdditive,
				chihaTankAdditive,
				chihaTankKaiAdditive,
				synergyAdditive,
			}
		};
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
				// TP bonus added since 2021-08-04, even counted from seaplane bombers, so many weird facts:
				// https://twitter.com/myteaGuard/status/1423010128349913092
				// https://twitter.com/yukicacoon/status/1423133193096503296
				// FIXME: not implemented those yet, all slots with the same plane will benefit for now
				const visibleBonus = this.equipmentTotalStats((isRange ? "raig" : "baku"), true, true, true, null, [gear.masterId]);
				if(visibleBonus > 0 && !isJetAssaultPhase) {
					const capaSqrt = Math.sqrt(this.slots[i]);
					const typeFactor = isRange ? [0.8, 1.5] : [1, 1];
					power[0] += visibleBonus * capaSqrt * typeFactor[0];
					power[1] += visibleBonus * capaSqrt * typeFactor[1];
				}
				// TB and DB bonus from Skilled Deck Personnel + AMH since 2022-08-26
				// https://twitter.com/panmodoki10/status/1563773326073511940
				// https://twitter.com/yukicacoon/status/1566320330544521216
				// FIXME: unknown how to simulate ingame calc
				if(this.hasEquipment(478)) {
					const personnelBonus = this.equipmentTotalStats((isRange ? "raig" : "baku"), true, true, true, null, [478]);
					if(personnelBonus > 0 && !isJetAssaultPhase) {
						const capaSqrt = Math.sqrt(this.slots[i]);
						const typeFactor = isRange ? [0.8, 1.5] : [1, 1];
						power[0] += personnelBonus * capaSqrt * typeFactor[0];
						power[1] += personnelBonus * capaSqrt * typeFactor[1];
					}
				}
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
	 * Apply known pre-cap modifiers to attack power.
	 * @return {Object} capped power and applied modifiers.
	 * @see http://kancolle.wikia.com/wiki/Damage_Calculation
	 * @see https://en.kancollewiki.net/Damage_Calculations#Pre-cap_Modifiers
	 * @see http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#beforecap
	 */
	KC3Ship.prototype.applyPrecapModifiers = function(basicPower, warfareType = "Shelling",
			engagementId = 1, formationId = ConfigManager.aaFormation, nightSpecialAttackType = [],
			isNightStart = false, isCombined = false, targetShipMasterId = 0,
			damageStatus = this.damageStatus()){
		// Non-empty attack type tuple means this supposed to be night battle
		const isNightBattle = nightSpecialAttackType.length > 0;
		// Engagement modifier
		let engagementModifier = (warfareType === "Aerial" ? [] : [0, 1, 0.8, 1.2, 0.6])[engagementId] || 1;
		// Formation modifier, about formation IDs:
		// ID 1~5: Line Ahead / Double Line / Diamond / Echelon / Line Abreast
		// ID 6: new Vanguard formation since 2017-11-17
		// ID 11~14: 1st anti-sub / 2nd forward / 3rd diamond / 4th battle
		// 0 are placeholders for non-exists ID
		let formationModifier = (
			warfareType === "Antisub" ?
			[0, 0.6, 0.8, 1.2, 1.1 , 1.3, 1, 0, 0, 0, 0, 1.3, 1.1, 1.0, 0.7] :
			warfareType === "Shelling" ?
			[0, 1.0, 0.8, 0.7, 0.75, 0.6, 1, 0, 0, 0, 0, 0.8, 1.0, 0.7, 1.1] :
			warfareType === "Torpedo" ?
			[0, 1.0, 0.8, 0.7, 0.6 , 0.6, 1, 0, 0, 0, 0, 0.8, 1.0, 0.7, 1.1] :
			warfareType === "SupportShelling" ?
			[0, 1.0, 0.8, 0.7, 0.6 , 0.6, 1, 0, 0, 0, 0, 1.0, 1.0, 1.0, 1.0] :
			// other warefare types like Aerial Opening Airstrike not affected
			[]
		)[formationId] || 1;
		// Echelon (any side) vs Combined Fleet OR support on battle node starting from night
		if(formationId === 4) {
			const battleConds = this.collectBattleConditions();
			if((warfareType === "SupportShelling" && battleConds.eventIdKind[1] === 2)
				|| battleConds.isEnemyCombined) {
				formationModifier = 0.6;
			}
		}
		// Modifier of vanguard formation depends on the position in the fleet
		if(formationId === 6) {
			const [shipPos, shipCnt] = this.fleetPosition();
			// Vanguard formation needs 4 ships at least, fake ID make no sense
			if(shipCnt >= 4) {
				// Guardian ships counted from 3rd or 4th ship
				const isGuardian = shipPos >= Math.floor(shipCnt / 2);
				if(warfareType === "Shelling" || isNightBattle) {
					formationModifier = isGuardian ? 1.0 : 0.5;
				} else if(warfareType === "Antisub") {
					formationModifier = isGuardian ? 0.6 : 1.0;
				}
			}
			// All ships get 0.5 for Expedition Support Shelling (but 1.0 when vs Combined Fleet)
			if(warfareType === "SupportShelling") {
				formationModifier = this.collectBattleConditions().isEnemyCombined ? 1.0 : 0.5;
			}
		}
		const canNightAntisub = warfareType === "Antisub" && (isNightStart || isCombined);
		// No engagement and formation modifier except night starts / combined ASW attack
		// Vanguard still applies for night battle
		if(isNightBattle && !canNightAntisub) {
			engagementModifier = 1;
			formationModifier = formationId !== 6 ? 1 : formationModifier;
		}
		// Damage percent modifier
		// http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#m8aa1749
		const damageModifier = (!isNightBattle && warfareType === "Torpedo" ? {
			// Day time only affect Opening Torpedo in fact, Chuuha cannot Closing at all
			// Night time unmentioned, assume to be the same with shelling
			"chuuha": 0.8,
			"taiha": 0.0
		} : (isNightBattle && warfareType === "Torpedo") || warfareType === "Shelling" || warfareType === "Antisub" ? {
			"chuuha": 0.7,
			"taiha": 0.4
		} : // Aerial Opening Airstrike not affected
		// Expedition Support Shelling unknown
		{})[damageStatus] || 1;
		// Night special attack modifier, should not x2 although some types attack 2 times
		const nightCutinModifier = nightSpecialAttackType[0] === "Cutin" &&
			nightSpecialAttackType[3] > 0 ? nightSpecialAttackType[3] : 1;
		
		// Anti-installation modifiers
		const isTargetInstallation = !!this.estimateInstallationEnemyType(targetShipMasterId, true);
		// Summary in total
		let antiLandAdditive = 0, antiLandModifier = 1;
		// Breakdown details
		const antiLandMods = { modifiers: {}, additives: {} };
		const mulBonus = (name) => (antiLandMods.modifiers[name] || 1);
		const addBonus = (name) => (antiLandMods.additives[name] || 0);
		if(isTargetInstallation) {
			Object.assign(antiLandMods, this.antiLandWarfarePowerMods(targetShipMasterId, true, warfareType, isNightBattle));
			antiLandModifier = Object.keys(antiLandMods.modifiers).map(k => mulBonus(k)).reduce((v, p) => p * v, 1);
			antiLandAdditive = Object.keys(antiLandMods.additives).map(k => addBonus(k)).sumValues();
		}
		
		// Apply modifiers, flooring unknown, anti-land modifiers get in first
		let result = (((((((((basicPower
			* mulBonus("stypeModifier")   + addBonus("stypeAdditive"))
			* mulBonus("generalModifier"))
			* mulBonus("spTankModifier")  + addBonus("spTankAdditive"))
			* mulBonus("m4a1ddModifier")  + addBonus("m4a1ddAdditive"))
			* mulBonus("gunTankModifier") + addBonus("gunTankAdditive"))
			* mulBonus("chihaTankModifier")    + addBonus("chihaTankAdditive"))
			* mulBonus("chihaTankKaiModifier") + addBonus("chihaTankKaiAdditive"))
			* mulBonus("synergyModifier") + addBonus("synergyAdditive"))
			+ addBonus("generalAdditive"))
			* engagementModifier * formationModifier * damageModifier * nightCutinModifier;
		
		// Light Cruiser fit gun bonus, should not applied before modifiers
		const stype = this.master().api_stype;
		const ctype = this.master().api_ctype;
		const isThisLightCruiser = [2, 3, 21].includes(stype);
		let lightCruiserBonus = 0;
		if(isThisLightCruiser && warfareType !== "Antisub") {
			// 14cm, 15.2cm single/twin and foreign guns: https://twitter.com/KanColle_STAFF/status/1377090899151216640
			// no bonus: triple main guns, secondary guns, 5inch, 155mm/55
			// [518] 14cm Twin Kai2 forgotten: https://twitter.com/yukicacoon/status/1729696346179813382
			const singleMountCnt = this.countEquipment([4, 11]);
			const twinMountCnt = this.countEquipment([65, 119, 139, 303, 310, 359, 360, 361, 407]);
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
			antiLandBonusInfo: antiLandMods,
			antiLandModifier,
			antiLandAdditive,
			lightCruiserBonus,
			italianHeavyCruiserBonus,
			aswLimitation,
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
			// increased from 300 to 360 since 2021-03-01
		const cap = time === "Night" ? 360 :
			// increased from 150 to 180 since 2017-03-18
			// increased from 180 to 220 since 2021-03-01
			warfareType === "Shelling" ? 220 :
			// increased from 150 to 180 since 2021-03-01
			warfareType === "Torpedo" ? 180 :
			// increased from 100 to 150 since 2017-11-10
			// increased from 150 to 170 since 2021-03-01
			170; // default cap for other phases: Antisub, Aerial, Support, ...
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
	 * @see https://github.com/Nishisonic/UnexpectedDamage/blob/master/UnexpectedDamage.js
	 */
	KC3Ship.prototype.applyPostcapModifiers = function(cappedPower, warfareType = "Shelling",
			daySpecialAttackType = ["SingleAttack", 0], contactPlaneId = 0, isCritical = false,
			isAirAttack = false, targetShipStype = 0, isDefenderArmorCounted = false,
			targetShipMasterId = 0, isOaswPhase = false){
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
		const isNightBattle = daySpecialAttackType.length === 0;
		let apshellModifier = 1;
		// AP Shell modifier applied to specific target ship types:
		// CA, CAV, BB, FBB, BBV, CV, CVB and Land installation
		targetShipStype = targetShipStype || (targetShipMasterId > 0 ? KC3Master.ship(targetShipMasterId).api_stype || 0 : 0);
		const isTargetShipTypeMatched = [5, 6, 8, 9, 10, 11, 18].includes(targetShipStype);
		const isApshellApplied = isTargetShipTypeMatched && !isNightBattle;
		if(isApshellApplied) {
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
				// same modifier with regualr air attack for CVNCI
				const allowedSlotType = (cutinType => {
					// uncertain: jets counted? not counted since #estimateDayAttackType neither
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
				// actual modifier affected by (internal) proficiency and bonus under verification,
				// https://docs.google.com/spreadsheets/d/1DCSQpzGeStmkkDpHAfEfUHdsUlULmg2IGrNLpwFfW34/html
				// might be an average value from participants internal proficiency experience
				const getAverageProficiencyCriticalModifier = (type2Ids) => {
					const expBonus = [0, 0, 0, 0, -3, -2, 2, 10, 10.25];
					let modSum = 0, modCnt = 0;
					this.equipment().forEach((g, i) => {
						if(this.slots[i] > 0 && g.exists() && type2Ids.includes(g.master().api_type[2])) {
							const aceLevel = g.ace || 0;
							const internalExpHigh = KC3Meta.airPowerInternalExpBounds(aceLevel)[1];
							const mod = aceLevel < 4 ? 0 : Math.floor(Math.sqrt(internalExpHigh) + (expBonus[aceLevel] || 0)) / 200;
							modSum += mod;
							modCnt += 1;
						}
					});
					return modCnt > 0 ? modSum / modCnt : 0;
				};
				proficiencyCriticalModifier += getAverageProficiencyCriticalModifier(allowedSlotType);
				proficiencyCriticalModifier += hasNonZeroSlotCaptainPlane(allowedSlotType) ? 0.15 : 0;
			} else {
				// No proficiency critical modifier for both power and accuracy on OASW
				// https://twitter.com/myteaGuard/status/1502574092226281474
				// https://twitter.com/Camellia_bb/status/1514976505910415365 
				// CV(B), AO antisub gets no proficiency critical modifier
				// https://twitter.com/myteaGuard/status/1358823102419927049
				if( !(warfareType === "Antisub" && (isOaswPhase || [11, 18, 22].includes(this.master().api_stype))) ) {
					this.equipment().forEach((g, i) => {
						if(g.isAirstrikeAircraft()) {
							// http://wikiwiki.jp/kancolle/?%B4%CF%BA%DC%B5%A1%BD%CF%CE%FD%C5%D9#v3f6d8dd
							// Type 1 Fighter Hayabusa Model II Kai bonus not fully tested, all -4 for now:
							// https://twitter.com/yukicacoon/status/1625831965055410176
							const expBonus = [489, 491].includes(g.masterId)
								? [0, 0, 0, 0, 0, 1, 3, 6]
								: [0, 1, 2, 3, 4, 5, 7, 10];
							const aceLevel = g.ace || 0;
							const internalExpHigh = KC3Meta.airPowerInternalExpBounds(aceLevel)[1];
							let mod = Math.floor(Math.sqrt(internalExpHigh) + (expBonus[aceLevel] || 0)) / 100;
							if(i > 0) mod /= 2;
							proficiencyCriticalModifier += mod;
						}
					});
				}
			}
		}
		
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		const isTargetPtImp = targetShipType.isPtImp;
		const isTargetInstallation = !!this.estimateInstallationEnemyType(targetShipMasterId, false);
		// Anti-installation modifier
		let antiLandAdditive = 0, antiLandModifier = 1;
		if(isTargetInstallation) {
			const postcapAntiLandMods = this.antiLandWarfarePowerMods(targetShipMasterId, false, warfareType, isNightBattle);
			antiLandAdditive = postcapAntiLandMods.additives.generalAdditive || 0;
			antiLandModifier = postcapAntiLandMods.modifiers.generalModifier || 1;
		} else if(isTargetPtImp) {
		// Against PT Imp fixed modifier constants, put into antiLand part in formula
			antiLandModifier = 0.35;
			antiLandAdditive = 15;
		}
		// Against PT Imp modifier from equipment
		let antiPtImpModifier = 1;
		if(isTargetPtImp) {
			const smallGunCount = this.countEquipmentType(2, 1);
			const smallGunBonus = smallGunCount > 0 ? 1.5 * (smallGunCount > 1 ? 1.4 : 1) : 1;
			antiPtImpModifier *= smallGunBonus;
			const aaGunCount = this.countEquipmentType(2, 21);
			const aaGunBonus = aaGunCount > 0 ? 1.2 * (aaGunCount > 1 ? 1.2 : 1) : 1;
			antiPtImpModifier *= aaGunBonus;
			const secondaryGunBonus = this.hasEquipmentType(2, 4) ? 1.3 : 1;
			antiPtImpModifier *= secondaryGunBonus;
			const diveBomberCount = this.countEquipmentType(2, 7),
				jetDiveBomberCount = this.countEquipmentType(2, 57);
			const diveBomberBonus = diveBomberCount + jetDiveBomberCount > 0 ?
				1.4 * (diveBomberCount > 1 || jetDiveBomberCount > 1 ? 1.3 : 1) : 1;
			antiPtImpModifier *= diveBomberBonus;
			const seaplaneBonus = this.hasEquipmentType(2, [11, 45]) ? 1.2 : 1;
			antiPtImpModifier *= seaplaneBonus;
			const skilledLookoutBonus = this.hasEquipmentType(2, 39) ? 1.1 : 1;
			antiPtImpModifier *= skilledLookoutBonus;
			// Type 3 Shell bonus disappeared?
			//const t3Bonus = this.hasEquipmentType(2, 18) ? 1.3 : 1;
			// https://twitter.com/yukicacoon/status/1381987133766836225
			const abDaihatsuCount = this.countEquipment([408, 409]);
			const abDaihatsuBonus = abDaihatsuCount > 0 ? 1.2 * (abDaihatsuCount > 1 ? 1.1 : 1) : 1;
			antiPtImpModifier *= abDaihatsuBonus;
		}
		// Barrage Balloon day shelling / opening airstrike modifier for whole fleet
		let balloonModifier = 1;
		if(!isNightBattle && (warfareType === "Shelling" || warfareType === "Aerial")) {
			const battleConds = this.collectBattleConditions();
			if(battleConds.isBalloonNode) {
				balloonModifier += this.findFleetBalloonShips() / 50;
				// Power, accuracy, shootdown on LBAS and antiair from enemy balloons found either
				if(warfareType === "Aerial")
					balloonModifier *= (1 - KC3Calc.countEnemyFleetBalloonShips(battleConds.nodeData.eSlot) / 20);
			}
		}
		// Fixed modifier for aerial type exped support
		const aerialSupportModifier = warfareType === "SupportAerial" ? 1.35 : 1;
		// Fixed modifier for antisub type exped support
		const antisubSupportModifier = warfareType === "SupportAntisub" ? 1.75 : 1;
		
		// About rounding and position of anti-land modifiers:
		// http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:925#33
		// Different rounding and modifiers ordering on different targets:
		// https://twitter.com/hedgehog_hasira/status/1569717081016520704
		// Supposed to use 64bit precision of floating number on flooring:
		// https://hedgehog-cp.github.io/verifyDamageFormula/floating-point-number.html
		let result = cappedPower;
		if(isTargetInstallation || isTargetPtImp) {
			result = Math.floor(Math.fixed(cappedPower * antiLandModifier + antiLandAdditive, 15)) * dayCutinModifier;
			if(isApshellApplied) result = Math.floor(Math.fixed(result * apshellModifier));
			// Specific ships for maps/event postcap bonuses applied here
			result *= antiPtImpModifier;
			if(isCritical) result = Math.floor(Math.fixed(result * proficiencyCriticalModifier * criticalModifier, 15));
		} else {
			if(isApshellApplied) result = Math.floor(Math.fixed(result * apshellModifier, 15));
			// Specific ships for maps/event postcap bonuses applied here
			if(isCritical) result = Math.floor(Math.fixed(result * proficiencyCriticalModifier * criticalModifier, 15));
			result *= dayCutinModifier;
		}
		// Uncertain rounding and ordering for other modifiers
		result *= balloonModifier * airstrikeConcatModifier * aerialSupportModifier * antisubSupportModifier;
		
		// New Depth Charge armor penetration, not attack power bonus
		let newDepthChargeBonus = 0;
		if(warfareType === "Antisub") {
			const deShipBonus = this.master().api_stype === 1 ? 1 : 0;
			// Hedgehog (Initial Model) and other 3 gears added since 2022-08-04
			// https://twitter.com/hedgehog_hasira/status/1555167740150681600
			// https://twitter.com/yukicacoon/status/1555380069706584064
			newDepthChargeBonus = KC3GearManager.aswArmorPenetrationIds.reduce((sum, id) => (sum
				+ this.countEquipment(id)
					* (Math.sqrt(KC3Master.slotitem(id).api_tais - 2) + deShipBonus)
			), 0);
			// Applying this to enemy submarine's armor, result will be capped to at least 1
			if(isDefenderArmorCounted) result += newDepthChargeBonus;
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
			balloonModifier,
			airstrikeConcatModifier,
			apshellModifier,
			antiPtImpModifier,
			antiLandAdditive,
			antiLandModifier,
			newDepthChargeBonus,
			remainingAmmoModifier,
		};
	};

	/**
	 * Look for Barrage Balloon equipped among (combined) fleet(s) on where this ship is.
	 * @return the amount up to cap (3) of ships equipping balloon type.
	 */
	KC3Ship.prototype.findFleetBalloonShips = function(maxCap){
		const fleetNum = this.onFleet();
		const locatedFleet = PlayerManager.fleets[fleetNum - 1];
		// not on any fleet, just return balloon of her own
		if(!locatedFleet) return this.hasEquipmentType(3, 55) & 1;
		return KC3Calc.countFleetBalloonShips(fleetNum, maxCap);
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
		warfareType = "Shelling", isTargetEscort = false){
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
					// differentiated by target enemy fleet
					if(isTargetEscort) {
						powerBonus.main = -20; powerBonus.escort = -20;
					} else {
						powerBonus.main = -10; powerBonus.escort = -10;
					}
				}
				break;
		}
		return powerBonus;
	};

	// check if specified equipment (or equip type) can be equipped on this ship.
	// equipment defined by ID in master data (like 8cm HA gun in exslot) cannot be hit by type.
	KC3Ship.prototype.canEquip = function(gearType2, gearMstId, gearStars) {
		return KC3Master.equip_on_ship(this.masterId, gearMstId, gearType2, gearStars);
	};

	// check if this ship is capable of equipping Amphibious Tank (Ka-Mi tank only for now, no landing craft variants)
	KC3Ship.prototype.canEquipTank = function() {
		if(this.isDummy()) { return false; }
		return KC3Master.equip_type(this.master().api_stype, this.masterId).includes(46);
	};

	// check if this ship is capable of equipping Daihatsu (landing craft variants, amphibious tank not counted)
	KC3Ship.prototype.canEquipDaihatsu = function() {
		if(this.isDummy()) { return false; }
		const master = this.master();
		// Phase2 method: lookup Daihatsu type2 ID 24 in her master equip types
		return KC3Master.equip_type(master.api_stype, this.masterId).includes(24);
		// Phase1 method:
		/*
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
		if ([2, 3, 9].indexOf( master.api_stype ) !== -1 &&
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
		*/
	};

	/**
	 * @return true if this ship is capable of equipping (Striking Force) Fleet Command Facility.
	 */
	KC3Ship.prototype.canEquipFCF = function() {
		if(this.isDummy()) { return false; }
		const masterId = this.masterId,
			stype = this.master().api_stype;
		// Phase2 method: lookup FCF type2 ID 34 in her master equip types
		return KC3Master.equip_type(stype, masterId).includes(34);
		// Phase1 method:
		/*
		// Excluding DE, DD, XBB, SS, SSV, AO, AR, which can be found at master.stype.api_equip_type[34]
		const capableStypes = [3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18, 20, 21];
		// These can be found at `RemodelMain.swf/scene.remodel.view.changeEquip._createType3List()`
		// DD Kasumi K2, DD Shiratsuyu K2, DD Murasame K2, AO Kamoi Kai-Bo, DD Yuugumo K2, DD Naganami K2, DD Shiranui K2
		const capableShips = [464, 497, 498, 500, 542, 543, 567];
		// CVL Kasugamaru
		const incapableShips = [521];
		return incapableShips.indexOf(masterId) === -1 &&
			(capableShips.includes(masterId) || capableStypes.includes(stype));
		*/
	};

	/**
	 * @return true if this ship able to do OASW unconditionally.
	 */
	KC3Ship.prototype.isOaswShip = function() {
		return [
				141, // Isuzu Kai Ni
				478, // Tatsuta Kai Ni
				394, // Jervis Kai
				893, // Janus Kai
				906, // Javelin Kai
				681, 920, // Samuel B.Roberts Kai and Mk.II
				562, 689, 596, 692, 628, 629, 726, // all remodels of Fletcher-class (except Heywood base)
				624, // Yuubari Kai Ni D
			].includes(this.masterId);
	};

	/**
	 * @return true if this ship (with equipment) is capable of opening ASW.
	 * @see https://kancolle.fandom.com/wiki/Partials/Opening_ASW
	 * @see https://wikiwiki.jp/kancolle/%E5%AF%BE%E6%BD%9C%E6%94%BB%E6%92%83#oasw
	 */
	KC3Ship.prototype.canDoOASW = function (aswDiff = 0) {
		if(this.isDummy()) { return false; }
		if(this.isOaswShip()) { return true; }

		const stype = this.master().api_stype;
		const isEscort = stype === 1;
		const isLightCarrier = stype === 7;
		// is CVE? such as Taiyou-class series
		const isEscortLightCarrier = this.isEscortLightCarrier();
		// is regular ASW method not supposed to depth charge attack? (CAV, BBV, AV, LHA)
		//   AO uses the same conditions with depth charge types, but Hyasui Kai unconfirmed
		const isAirAntiSubStype = this.isAirAntiSubStype();
		// is Sonar equipped? also counted large one: Type 0 Sonar
		const hasSonar = this.hasEquipmentType(1, 10);
		const isHyuugaKaiNi = this.masterId === 554;
		const isFusouClassKaiNi = [411, 412].includes(this.masterId);
		const isKagaK2Go = this.masterId === 646;

		// lower condition for DE and CVL, even lower if equips Sonar
		const aswThreshold = isLightCarrier && hasSonar ? 50
			: isEscort ? 60
			// May apply to CVL, but only CVE can reach 65 for now (Zuihou K2 modded asw +9 +13x4 = 61)
			: isEscortLightCarrier ? 65
			// Kaga Kai Ni Go asw starts from 82 on Lv84, let her pass just like Hyuuga K2
			: isKagaK2Go ? 80
			// Hyuuga Kai Ni can OASW even asw < 100, but lower threshold unknown,
			// guessed from her Lv90 naked asw 79 + 12 (1x helicopter, without bonus and mod)
			: isHyuugaKaiNi ? 90
			: 100;

		// ship stats not updated in time when equipment changed, so take the diff if necessary,
		// and explicit asw bonus from Sonars taken into account confirmed.
		const shipAsw = this.as[0] + aswDiff;
		// Visible asw bonus from Fighters, Dive Bombers and Torpedo Bombers still not counted,
		//   confirmed since 2019-06-29: https://twitter.com/trollkin_ball/status/1144714377024532480
		//   2019-08-08: https://wikiwiki.jp/kancolle/%E5%AF%BE%E6%BD%9C%E6%94%BB%E6%92%83#trigger_conditions
		//   but bonus from other aircraft like Rotorcraft not (able to be) confirmed,
		//   perhaps a similar logic to exclude some types of equipment, see #effectiveEquipmentTotalAsw.
		//   reconfirmed since 2021-02-29, not counted towards asw 50/65 threshold.
		//   reconfirmed since 2021-09-28, counted towards 65: https://twitter.com/myteaGuard/status/1442842481696014346
		// Green (any small?) gun (DE +1 asw from 12cm Single High-angle Gun Mount Model E) not counted,
		//   confirmed since 2020-06-19: https://twitter.com/99_999999999/status/1273937773225893888
		//   reconfirmed since 2021-09-28, counted towards 60/75:
		//     https://twitter.com/agosdufovj/status/1443674443218227237
		//     https://twitter.com/agosdufovj/status/1442827344142483456
		//	- this.equipmentTotalStats("tais", true, true, true, [1, 6, 7, 8]);

		// shortcut on the stricter condition first
		if (shipAsw < aswThreshold)
			return false;

		// For CVE like Taiyou-class, initial asw stat is high enough to reach 50 / 65,
		//   but for Kasugamaru, since not possible to reach high asw for now, tests are not done.
		// For Taiyou-class Kai/Kai Ni, any equippable aircraft with asw should work.
		//   only Autogyro or PBY equipped will not let CVL anti-sub in day shelling phase,
		//   but OASW still can be performed. only Sonar equipped can do neither.
		// For other CVL possible but hard to reach 50 asw and do OASW with Sonar and high ASW aircraft.
		// For CV Kaga K2Go, can perform OASW with any asw aircraft like Taiyou-class Kai+:
		//   https://twitter.com/noobcyan/status/1299886834919510017
		// For Houshou K2S, ASW aircraft in 0-size slot only can't enable OASW and shelling ASW:
		//   https://twitter.com/myteaGuard/status/1600867450429485056
		//   but can do OASW even in 0-size slot with another ASW aircraft together:
		//   https://twitter.com/bobcat18/status/1600909312033193984
		if(isLightCarrier || isKagaK2Go) {
			const isTaiyouKaiAfter = RemodelDb.remodelGroup(521).indexOf(this.masterId) > 1
				|| RemodelDb.remodelGroup(522).indexOf(this.masterId) > 1
				|| RemodelDb.remodelGroup(534).indexOf(this.masterId) > 0;
			const hasAswAircraft = this.hasNonZeroSlotEquipmentFunc(g => g.isAswAircraft(false));
			if( hasAswAircraft && ( (isTaiyouKaiAfter || isKagaK2Go)        // ship visible asw irrelevant
				|| this.equipment().some(g => g.isHighAswBomber(false)) )   // mainly asw 50/65, dive bomber not work
			) return true;
			// Visible bonus from Torpedo Bombers confirmed counted towards asw 100 threshold since 2021-02-09:
			// https://twitter.com/panmodoki10/status/1359036399618412545
			// perhaps only asw 100 threshold is using ship visible asw value
			//const aswAircraftBonus = this.equipmentTotalStats("tais", true, true, true, [6, 7, 8]);
			return shipAsw >= 100 && hasSonar && hasAswAircraft; // almost impossible for pre-marriage
		}

		// DE can OASW without Sonar, needs displayed asw >= 75 and total asw from equipment >= 4
		// but visible bonus not counted towards 4: https://twitter.com/agosdufovj/status/1443178825987227652
		if(isEscort) {
			if(hasSonar) return true;
			const equipAswSum = this.equipmentTotalStats("tais", true, false);
			return shipAsw >= 75 && equipAswSum >= 4;
		}

		// Fusou-class Kai Ni can OASW with at least 1 Helicopter + Sonar and asw >= 100.
		//   https://twitter.com/cat_lost/status/1146075888636710912
		// Fusou-class Kai Ni can equip Depth Charge since 2022-12-31, can OASW with DC+Sonar and asw >= 100.
		// Shinshumaru can OASW with at least 1 slot of Autogyro/Seaplane Bomber + Sonar and asw >= 100.
		//   https://kc3kai.github.io/kancolle-replay/battleplayer.html?fromImg=https://cdn.discordapp.com/attachments/684474161199841296/876011287493111808/cravinghobo_25786.png
		// Yamato Kai Ni Juu (BBV) can OASW with at least 1 asw aircraft + Sonar and asw >= 100
		if(isAirAntiSubStype) {
			// Hyuuga Kai Ni can OASW with 2 Autogyro or 1 Helicopter, without Sonar,
			//   but not OASW with Sonar + ASW aircraft even asw >= 100 like others.
			if(isHyuugaKaiNi) {
				return this.countEquipmentType(1, 15) >= 2 || this.countEquipmentType(1, 44) >= 1;
			}
			// To be consistent with ASW attack condition, any ASW capable aircraft might be supported.
			const hasAswAircraft = this.hasNonZeroSlotEquipmentFunc(gear => gear.isAswAircraft(false));
			return hasSonar && (hasAswAircraft || isFusouClassKaiNi);
		}

		// for other ship types who can do ASW with Depth Charge
		return hasSonar;
	};

	/**
	 * @return true if this ship can do ASW attack.
	 */
	KC3Ship.prototype.canDoASW = function(time = "Day") {
		if(this.isDummy() || this.isAbsent()) { return false; }
		const stype = this.master().api_stype;
		const isHayasuiKaiWithTorpedoBomber = this.isHayasuiKaiWithTorpedoBomber();
		const isKagaK2Go = this.masterId === 646;
		const isFusouClassKaiNi = [411, 412].includes(this.masterId);
		// CAV, CVL, BBV, AV, LHA, CVL-like Hayasui Kai, Kaga Kai Ni Go, Yamashiomaru
		const isAirAntiSubStype = this.isAirAntiSubStype() || isHayasuiKaiWithTorpedoBomber || isKagaK2Go || this.isYamashiomaruWithAircraft();
		if(isAirAntiSubStype) {
			// CV Kaga Kai Ni Go implemented since 2020-08-27, can do ASW under uncertain conditions (using CVL's currently),
			// but any CV form (converted back from K2Go) may ASW either if her asw modded > 0, fixed on the next day
			// see https://twitter.com/Synobicort_SC/status/1298998245893394432
			const isCvlLike = stype === 7 || isHayasuiKaiWithTorpedoBomber || isKagaK2Go;
			// At night, most ship types cannot do ASW,
			// only CVL can ASW with depth charge if naked asw is not 0 and not taiha,
			// even no plane equipped or survived, such as Taiyou Kai Ni, Hayasui Kai.
			// but CVE will attack surface target first if NCVCI met.
			//  * Kaga K2Go/Fusou-class K2 do ASW with depth charge animation even asw aircraft equiped.
			//  * 2nd Class Transporter do ASW with depth charge equipped.
			//  * Some Abyssal AV/BBV can do ASW with air attack at night.
			if(time === "Night") {
				if(this.is2ndClassTransporter()) return this.hasEquipmentType(2, 15);
				return isCvlLike && !this.isTaiha() && this.as[1] > 0;
			}
			// For day time, false if CVL or CVL-like chuuha
			// Yamashiomaru can air attack even taiha, but power calc seems fall back to depth charge?
			// https://twitter.com/yukicacoon/status/1505719117260550147
			// If 0 asw stat dive bomber equipped, even no depth charge used
			// https://twitter.com/CC_jabberwock/status/1650452631398256640
			if(isCvlLike && this.isStriped()) return false;
			// and if ASW plane equipped and its slot > 0
			// or if Fusou-class K2/2nd Class Transporter equipped Depth Charge
			return this.hasNonZeroSlotEquipmentFunc(g => g.isAswAircraft(isCvlLike))
				|| ((isFusouClassKaiNi || this.is2ndClassTransporter()) && this.hasEquipmentType(2, 15));
		}
		// Known stype: DE, DD, CL, CLT, CT, AO(*), FBB(*)
		// *AO: Hayasui base form and Kamoi Kai-Bo can only depth charge, Kamoi base form cannot asw,
		//      Yamashiomaru uses depth charge if not air attack or no gear equppied.
		// *FBB: if Yamato K2 inherits K2 Juu's asw mod, she can depth charge without any equip.
		// https://twitter.com/yukicacoon/status/1554821784104419329
		// it's more likely no stype limited ingame, the asw stat of ship was the only condition?
		// but CV Kaga K2 with asw mod has been fixed to no asw ability, so:
		//const isAntiSubStype = [1, 2, 3, 4, 8, 21, 22].includes(stype);
		const incapableStype = [11].includes(stype);
		// if max ASW stat before marriage (Lv99) not 0, can do ASW,
		// which also used at `Core.swf/vo.UserShipData.hasTaisenAbility()`
		// if as[1] === 0, naked asw stat should be 0, but as[0] may not.
		return !incapableStype && this.as[1] + (this.mod[6] || 0) > 0;
	};

	/**
	 * @return true if this ship can do opening torpedo attack.
	 */
	KC3Ship.prototype.canDoOpeningTorpedo = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		const hasKouhyouteki = this.hasEquipmentType(2, 22);
		const isThisSubmarine = this.isSubmarine();
		return hasKouhyouteki || (isThisSubmarine && this.level >= 10);
	};

	/**
	 * @return {Object} target (enemy) ship category flags defined by us, possible values are:
	 *         `isSurface`, `isSubmarine`, `isLand`, `isPtImp`.
	 */
	KC3Ship.prototype.estimateTargetShipType = function(targetShipMasterId = 0) {
		const targetShip = KC3Master.ship(targetShipMasterId);
		// land installation
		const isLand = targetShip && targetShip.api_soku === 0;
		const isSubmarine = targetShip && this.isSubmarine(targetShip.api_stype);
		// regular surface vessel by default
		const isSurface = !isLand && !isSubmarine;
		// known PT Imp Packs (also belong to surface)
		const isPtImp = KC3Meta.specialPtImpPackNames.includes(targetShip.api_name);
		return {
			isSubmarine,
			isLand,
			isSurface,
			isPtImp,
		};
	};

	/**
	 * Divide Abyssal land installation into KC3-unique types:
	 *   Type 0: Not land installation
	 *   Type 1: Soft-skinned, eg: Harbor Princess
	 *   Type 2: Artillery Imp, aka. Pillbox
	 *   Type 3: Isolated Island Princess
	 *   Type 4: Supply Depot Princess
	 *   Type 5: Summer Harbor Princess
	 * @param precap - specify true if going to calculate pre-cap modifiers
	 * @return the numeric type identifier
	 * @see KC3Meta.specialLandInstallationNames - SPECIAL_ENTRY defined by game client, 'installation' not equaled to land type (speed 0)
	 * @see https://en.kancollewiki.net/Combat/Anti-Installation
	 * @see http://kancolle.wikia.com/wiki/Installation_Type
	 */
	KC3Ship.prototype.estimateInstallationEnemyType = function(targetShipMasterId = 0, precap = true){
		const targetShip = KC3Master.ship(targetShipMasterId);
		if(!this.masterId || !targetShip) { return 0; }
		const isLand = this.estimateTargetShipType(targetShipMasterId).isLand;
		const shipJapName = targetShip.api_name || "";
		// Supply Depot Princess, no bonus for Summer SDP (集積地夏姫): https://wikiwiki.jp/kancolle/%E5%AF%BE%E5%9C%B0%E6%94%BB%E6%92%83#AGBonusSupply
		// SDP III Vacation mode (集積地棲姫III バカンスmode) postcap bonus only, but not land (speed=5)
		if(shipJapName.startsWith("集積地棲姫")) {
			// Unique case: takes soft-skinned pre-cap (if land),  but unique post-cap
			return precap ? (isLand ? 1 : 0) : 4;
		}
		const abyssalNameTypeMap = {
			// Uncategorized event-only land installation:
			//"北端上陸姫": 5, // Northernmost Landing Princess
			"港湾夏姫": 5, // Summer Harbor Princess
			"離島棲姫": 3, // Isolated Island Princess
			"砲台小鬼": 2, // Artillery Imp
			"トーチカ要塞棲姫": 2, // Fortified Pillbox Princess
			"トーチカ小鬼": 2, // Pillbox Imp
			"対空小鬼": 2, // AA Guns Imp
		};
		const foundPrefix = Object.keys(abyssalNameTypeMap).find(s => shipJapName.startsWith(s));
		if(foundPrefix) return abyssalNameTypeMap[foundPrefix];
		if(!precap) {
			// Uncategorized postcap-only event surface installations:
			// Anchorage Water Demon Vacation Mode, Dock Princess
			//if(shipJapName.startsWith("泊地水鬼 バカンスmode")) return 6?;
			//if(shipJapName.startsWith("船渠棲姫")) return 7?;
		}
		// Other soft-skin installations
		return isLand ? 1 : 0;
	};

	/**
	 * @return false if this ship (and target ship) can attack at day shelling phase.
	 */
	KC3Ship.prototype.canDoDayShellingAttack = function(targetShipMasterId = 0) {
		if(this.isDummy() || this.isAbsent()) { return false; }
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		const isThisSubmarine = this.isSubmarine();
		const isThisCarrier = this.isCarrier() || this.isHayasuiKaiWithTorpedoBomber() || this.isYamashiomaruWithBomber();
		if(isThisCarrier) {
			if(this.isTaiha()) return false;
			const isNotCvb = this.master().api_stype !== 18;
			if(isNotCvb && this.isStriped()) return false;
			if(targetShipType.isSubmarine) return this.canDoASW();
			// can not attack land installation if dive bomber equipped, except some exceptions
			if(targetShipType.isLand && this.equipment().some((g, i) => this.slots[i] > 0 &&
				g.master().api_type[2] === 7 &&
				!KC3GearManager.antiLandDiveBomberIds.includes(g.masterId)
			)) return false;
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
		// DD, CL, CLT, CA, CAV, FBB, BB, BBV, SS, SSV, AV, CT
		const isTorpedoStype = [2, 3, 4, 5, 6, 8, 9, 10, 13, 14, 16, 21].includes(this.master().api_stype);
		return isTorpedoStype && this.estimateNakedStats("tp") > 0;
	};

	/**
	 * Conditions under verification, known for now:
	 * Flagship is healthy Nelson-class, Double Line (forward) formation selected.
	 * Minimum 6 surface ships fleet needed, main fleet only for Combined Fleet.
	 * 3rd, 5th ship not carrier or submarine.
	 * No AS/AS+ air battle needed like regular Artillery Spotting.
	 *
	 * No PvP sample found for now.
	 * Can be triggered in 1 battle per sortie, max 3 chances to roll (if yasen).
	 *
	 * @return true if this ship (Nelson) can do Nelson Touch cut-in attack.
	 * @see http://kancolle.wikia.com/wiki/Nelson
	 * @see https://wikiwiki.jp/kancolle/Nelson
	 */
	KC3Ship.prototype.canDoNelsonTouch = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		// is this ship Nelson-class and not even Chuuha
		// still okay even 3th and 5th ship are Taiha
		if(KC3Meta.nelsonTouchShips.includes(this.masterId) && !this.isStriped()) {
			const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
			// Nelson is flagship of a fleet, which min 6 surface ships needed
			// https://twitter.com/kurosg/status/1401491454732607492
			if(fleetNum > 0 && shipPos === 0 && shipCnt >= 6
				// not in any escort fleet of Combined Fleet
				&& (!PlayerManager.combinedFleet || fleetNum !== 2)) {
				// Double Line variants selected
				const isDoubleLine = [2, 12].includes(
					this.collectBattleConditions().formationId || ConfigManager.aaFormation
				);
				const fleetObj = PlayerManager.fleets[fleetNum - 1],
					// 3th and 5th ship are not carrier/submarine or absent?
					invalidCombinedShips = [fleetObj.ship(2), fleetObj.ship(4)]
						.some(s => s.isAbsent() || s.isCarrier() || s.isSubmarine()),
					// no surface ship(s) sunk or retreated in mid-sortie?
					hasSixSurfaceShips = fleetObj.shipsUnescaped().filter(s => !s.isSubmarine()).length >= 6;
				return isDoubleLine && !invalidCombinedShips && hasSixSurfaceShips;
			}
		}
		return false;
	};

	/**
	 * Most conditions are the same with Nelson Touch, except:
	 * Flagship is healthy Nagato/Mutsu Kai Ni, Echelon (forward) formation selected.
	 * 2nd ship is a battleship, Chuuha ok, Taiha no good.
	 *
	 * Additional ammo consumption for Nagato/Mutsu & 2nd battleship:
	 *   + Math.floor(or ceil?)(total ammo cost of this battle (yasen may included) / 2)
	 *
	 * @return true if this ship (Nagato/Mutsu Kai Ni) can do special cut-in attack.
	 * @see https://en.kancollewiki.net/Nagato
	 * @see https://wikiwiki.jp/kancolle/%E9%95%B7%E9%96%80%E6%94%B9%E4%BA%8C
	 * @see http://kancolle.wikia.com/wiki/Mutsu
	 * @see https://wikiwiki.jp/kancolle/%E9%99%B8%E5%A5%A5%E6%94%B9%E4%BA%8C
	 */
	KC3Ship.prototype.canDoNagatoClassCutin = function(flagShipIds = KC3Meta.nagatoClassCutinShips) {
		if(this.isDummy() || this.isAbsent()) { return false; }
		if(flagShipIds.includes(this.masterId) && !this.isStriped()) {
			const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
			if(fleetNum > 0 && shipPos === 0 && shipCnt >= 6
				&& (!PlayerManager.combinedFleet || fleetNum !== 2)) {
				const isEchelon = [4, 12].includes(
					this.collectBattleConditions().formationId || ConfigManager.aaFormation
				);
				const fleetObj = PlayerManager.fleets[fleetNum - 1],
					// 2nd ship not battle ship?
					invalidCombinedShips = [fleetObj.ship(1)].some(ship =>
						ship.isAbsent() || ship.isTaiha() ||
						![8, 9, 10].includes(ship.master().api_stype)),
					// no surface ship(s) sunk or retreated in mid-sortie?
					hasSixSurfaceShips = fleetObj.shipsUnescaped().filter(s => !s.isSubmarine()).length >= 6;
				return isEchelon && !invalidCombinedShips && hasSixSurfaceShips;
			}
		}
		return false;
	};

	/**
	 * Nelson + Rodney together modifiers variant.
	 * @param forShipPos - to indicate the returned modifier is used for flagship or 3nd/5th ship.
	 * @return the modifier, 1 by default for unknown conditions.
	 * @see https://twitter.com/hojo_rennka/status/1697963510800801842
	 */
	KC3Ship.prototype.estimateNelsonTouchModifier = function(forShipPos = 0) {
		const locatedFleet = PlayerManager.fleets[this.onFleet() - 1];
		if(!locatedFleet) return 1;
		const flagshipMstId = locatedFleet.ship(0).masterId;
		if(!KC3Meta.nelsonTouchShips.includes(flagshipMstId)) return 1;
		const posModifier = [1, 0, 1, 0, 1];
		[2, 4].forEach(pos => {
			const shipMstId = locatedFleet.ship(pos).masterId;
			if(KC3Meta.nelsonTouchShips.includes(shipMstId)) {
				posModifier[0] = 1.15;
				posModifier[pos] = 1.2;
			}
		});
		const isRedT = this.collectBattleConditions().engagementId === 4;
		const baseModifier = isRedT ? 2.5 : 2.0;
		return baseModifier * (posModifier[forShipPos] || 1);
	};

	/**
	 * Nagato/Mutsu Kai Ni special cut-in attack modifiers are variant depending on the fleet 2nd ship.
	 * And there are different modifiers for 2nd ship's 3rd attack.
	 * @param forShipPos - to indicate the returned modifier is used for flagship or 2nd ship.
	 * @return the modifier, 1 by default for unknown conditions.
	 * @see https://wikiwiki.jp/kancolle/%E9%95%B7%E9%96%80%E6%94%B9%E4%BA%8C
	 */
	KC3Ship.prototype.estimateNagatoClassCutinModifier = function(forShipPos = 0) {
		const locatedFleet = PlayerManager.fleets[this.onFleet() - 1];
		if(!locatedFleet) return 1;
		const flagshipMstId = locatedFleet.ship(0).masterId;
		if(!KC3Meta.nagatoClassCutinShips.includes(flagshipMstId)) return 1;
		const ship2ndMstId = locatedFleet.ship(1).masterId;
		// Nelson base form not counted: https://twitter.com/CC_jabberwock/status/1538234446024847360
		// Rodney Kai not counted too: https://twitter.com/ych0701/status/1703333186598826214
		const partnerModifierMap = KC3Meta.nagatoCutinShips.includes(flagshipMstId) ?
			(forShipPos > 0 ? {
				"573": 1.4,               // Mutsu Kai Ni
				"276": 1.35,              // Mutsu Kai
				"576": 1.25,              // Nelson Kai
			} : {
				"573": 1.2,               // Mutsu Kai Ni
				"276": 1.15,              // Mutsu Kai
				"576": 1.1,               // Nelson Kai
			}) :
			KC3Meta.mutsuCutinShips.includes(flagshipMstId) ?
			(forShipPos > 0 ? {
				"541": 1.4,               // Nagato Kai Ni
				"275": 1.35,              // Nagato Kai
			} : {
				"541": 1.2,               // Nagato Kai Ni
				"275": 1.15,              // Nagato Kai
			}) : {};
		const baseModifier = forShipPos > 0 ? 1.2 : 1.4;
		const partnerModifier = partnerModifierMap[ship2ndMstId] || 1;
		const apShellModifier = this.hasEquipmentType(2, 19) ? 1.35 : 1;
		const surfaceRadarModifier = this.equipment(true).some(gear => gear.isSurfaceRadar()) ? 1.15 : 1;
		return baseModifier * partnerModifier * apShellModifier * surfaceRadarModifier;
	};

	/**
	 * Most conditions are the same with Nelson Touch, except:
	 * Flagship is healthy Colorado-class any remodel, Echelon (forward) formation selected.
	 * 2nd and 3rd ships are healthy battleship, not Taiha ~~nor Chuuha~~,
	 *   Chuuha allowed since 2021-10-15.
	 *   Maryland implemented since 2022-06-18.
	 *
	 * The same additional ammo consumption like Nagato/Mutsu cutin for top 3 battleships.
	 *
	 * 4 types of smoke animation effects will be used according corresponding position of partner ships,
	 * see `main.js#CutinColoradoAttack.prototype._getSmoke`.
	 *
	 * @return true if this ship can do Colorado special cut-in attack.
	 * @see http://kancolle.wikia.com/wiki/Colorado
	 * @see https://wikiwiki.jp/kancolle/Colorado
	 */
	KC3Ship.prototype.canDoColoradoCutin = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		// is this ship Colorado-class and not even Chuuha
		if(KC3Meta.coloradoCutinShips.includes(this.masterId) && !this.isStriped()) {
			const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
			if(fleetNum > 0 && shipPos === 0 && shipCnt >= 6
				&& (!PlayerManager.combinedFleet || fleetNum !== 2)) {
				const isEchelon = [4, 12].includes(
					this.collectBattleConditions().formationId || ConfigManager.aaFormation
				);
				const fleetObj = PlayerManager.fleets[fleetNum - 1],
					// 2nd and 3rd ship are (F)BB(V) only, not Taiha?
					validCombinedShips = [fleetObj.ship(1), fleetObj.ship(2)]
						.every(ship => !ship.isAbsent() && !ship.isTaiha()
							&& [8, 9, 10].includes(ship.master().api_stype)),
					// no surface ship(s) sunk or retreated in mid-sortie?
					hasSixSurfaceShips = fleetObj.shipsUnescaped().filter(s => !s.isSubmarine()).length >= 6;
				return isEchelon && validCombinedShips && hasSixSurfaceShips;
			}
		}
		return false;
	};

	/**
	 * Colorado special cut-in attack modifiers are variant,
	 * depending on equipment and 2nd and 3rd ship in the fleet.
	 * @see https://twitter.com/syoukuretin/status/1132763536222969856
	 * @see https://twitter.com/CC_jabberwock/status/1538198001520283649 - buffed since 2022-06-17
	 * @see https://twitter.com/CC_jabberwock/status/1538235861178802176 - base remodel no Big7 modifier
	 */
	KC3Ship.prototype.estimateColoradoCutinModifier = function(forShipPos = 0) {
		const locatedFleet = PlayerManager.fleets[this.onFleet() - 1];
		if(!locatedFleet) return 1;
		const flagshipMstId = locatedFleet.ship(0).masterId;
		if(!KC3Meta.coloradoCutinShips.includes(flagshipMstId)) return 1;

		const combinedModifierMaps = [
			// No extra mod for flagship
			{},
			// x1.15 for Big-7 2nd ship
			{
				"275": 1.15, "541": 1.15,             // Nagato Kai+
				"276": 1.15, "573": 1.15,             // Mutsu Kai+
				"576": 1.15,                          // Nelson Kai
				"601": 1.15, "1496": 1.15,            // Colorado
				"913": 1.15, "918": 1.15,             // Maryland
			},
			// x1.17 for Big-7 3rd ship
			{
				"275": 1.17, "541": 1.17,
				"276": 1.17, "573": 1.17,
				"576": 1.17,
				"601": 1.17, "1496": 1.17,
				"913": 1.17, "918": 1.17,
			},
		];

		forShipPos = (forShipPos || 0) % 3;
		const baseModifier = [1.5, 1.3, 1.3][forShipPos];
		const targetShip = locatedFleet.ship(forShipPos),
			targetShipMstId = targetShip.masterId,
			targetShipModifier = combinedModifierMaps[forShipPos][targetShipMstId] || 1;
		// Bug 'mods of 2nd ship's apshell/radar and on-5th-slot-empty-exslot spread to 3rd ship' not applied here, fixed since 2021-10-15
		const apShellModifier = targetShip.hasEquipmentType(2, 19) ? 1.35 : 1;
		const surfaceRadarModifier = targetShip.equipment(true).some(gear => gear.isSurfaceRadar()) ? 1.15 : 1;
		const sgRadarLateModelModifier = targetShip.hasEquipment([456]) ? 1.15 : 1;

		return baseModifier * targetShipModifier
			* apShellModifier * surfaceRadarModifier * sgRadarLateModelModifier;
	};

	/**
	 * Most conditions are the same with Nelson Touch, except:
	 * Flagship is healthy Kongou-class Kai Ni C, Line Ahead (battle) / Echelon (forward) formation selected, night battle only. (Echelon added since 2021-08-20)
	 * 2nd ship is healthy one of the following:
	 *   * Kongou K2C flagship: Hiei K2C / Haruna K2+ (extended) / Warspite
	 *   * Hiei K2C flagship: Kongou K2C / Kirishima K2 / Haruna K2B/C (extended)
	 *   * Haruna K2B/C flagship: Kongou K2C / Hiei K2C (added since 2023-05-01)
	 * Surface ships in fleet >= 5 (that means 1 submarine is okay for single fleet, 2 for SF)
	 *
	 * Since it's a night battle only cutin, have to be escort fleet of any Combined Fleet.
	 * ~~And it's impossible to be triggered after any other daytime Big-7 special cutin,
	 * because all ship-combined spcutins only trigger 1-time per sortie?~~
	 * It's possible to be triggered after other daytime special cutins since 2021-08-04 update,
	 * and it's allowed to be triggered twice per sortie, unlike other ones only once.
	 * Triggering counters & conditions of this one are separated from other cutins.
	 *
	 * The additional 30% ammo consumption, see:
	 *   * https://twitter.com/myteaGuard/status/1254040809365618690
	 *   * https://twitter.com/myteaGuard/status/1254048759559778305
	 * Ammo consumption reduced to 20% since 2021-08-04:
	 *   * https://twitter.com/yukicacoon/status/1422899332219502596
	 * Power modifier increased since 2022-06-08
	 *
	 * @return true if this ship (Kongou-class K2C) can do special cut-in attack.
	 * @see https://kancolle.fandom.com/wiki/Kongou/Special_Cut-In
	 * @see https://wikiwiki.jp/kancolle/%E6%AF%94%E5%8F%A1%E6%94%B9%E4%BA%8C%E4%B8%99
	 */
	KC3Ship.prototype.canDoKongouCutin = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		// is this ship Kongou-class K2C(K2B) and not even Chuuha
		if(KC3Meta.kongouCutinShips.includes(this.masterId) && !this.isStriped()) {
			const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
			if(fleetNum > 0 && shipPos === 0 && shipCnt >= 5
				&& (!PlayerManager.combinedFleet || fleetNum !== 1)) {
				const isFormationAllowed = [1, 4, 12, 14].includes(
					this.collectBattleConditions().formationId || ConfigManager.aaFormation
				);
				const fleetObj = PlayerManager.fleets[fleetNum - 1],
					// 2nd ship is valid partner and not even Chuuha
					validCombinedShips = ({
						// Kongou K2C: Hiei K2C, Haruna K2+, Warspite
						"591": [592, 151, 593, 954, 439, 364],
						// Hiei K2C: Kongou K2C, Kirishima K2, Haruna K2B/C
						"592": [591, 152, 593, 954],
						// Haruna K2B: Kongou K2C, Hiei K2C
						"593": [591, 592],
						// Haruna K2C: Kongou K2C, Hiei K2C
						"954": [591, 592],
					}[this.masterId] || []).includes(fleetObj.ship(1).masterId)
						&& !fleetObj.ship(1).isStriped(),
					// no surface ship(s) sunk or retreated in mid-sortie?
					hasFiveSurfaceShips = fleetObj.shipsUnescaped().filter(s => !s.isSubmarine()).length >= 5;
				return isFormationAllowed && validCombinedShips && hasFiveSurfaceShips;
			}
		}
		return false;
	};

	/**
	 * Most conditions are the same with Nelson Touch, except:
	 * Flagship is Submarine Tender without Taiha, Echelon / Line Abreast formation selected.
	 * Level >= 30 (https://twitter.com/kobabu2424/status/1429028664016920579)
	 * 2nd, 3rd ship is healthy SS(V) for type 300.
	 * 3nd, 4th ship is healthy SS(V) for type 301. 2nd ship is Chuuha/Taiha SS(V).
	 * 2nd, 4th ship is healthy SS(V) for type 302. 3rd ship is SS(V).
	 * Trigger-able in Striking Force, not in Combined Fleet? (too few samples to certain)
	 *
	 * @return API ID (300~302) if this ship can do special cut-in attack, otherwise false.
	 */
	KC3Ship.prototype.canDoSubFleetCutin = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		// is this ship Lv30+ Taigei/Jingei-class and not Taiha
		if(KC3Meta.subFleetCutinShips.includes(this.masterId) && !this.isTaiha() && this.level >= 30) {
			const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
			if(fleetNum > 0 && shipPos === 0 && shipCnt >= 3) {
				const isEchelonOrLineAbreast = [4, 5, 11, 12].includes(
					this.collectBattleConditions().formationId || ConfigManager.aaFormation
				);
				const fleetObj = PlayerManager.fleets[fleetNum - 1],
					ship2nd = fleetObj.ship(1), ship3rd = fleetObj.ship(2),
					// 2nd and 3rd ship are SS(V) at least
					validMinCombinedShips = [ship2nd, ship3rd].every(ship => !ship.isAbsent() && ship.isSubmarine()),
					// have useitem Submarine Supply Materials remaining
					hasSubSupply = PlayerManager.consumables.submarineSupplyMaterial > 0;
				if(isEchelonOrLineAbreast && validMinCombinedShips && hasSubSupply) {
					const valid4thShip = [fleetObj.ship(3)].every(s => !s.isAbsent() && !s.isStriped() && s.isSubmarine());
					// 4th ship is healthy SS(V) and 2nd is healthy (3rd no matter state)
					if(valid4thShip && !ship2nd.isStriped()) return 302;
					// 3rd and 4th ship is healthy SS(V) and 2nd is chuuha or worse
					if(valid4thShip && !ship3rd.isStriped() && ship2nd.isStriped()) return 301;
					// 2nd and 3rd ship is healthy (4th no matter state, even stype)
					if(!ship2nd.isStriped() && !ship3rd.isStriped()) return 300;
				}
			}
		}
		return false;
	};

	/**
	 * Most conditions are the same with Nelson Touch, except:
	 * Flagship is healthy Yamato Kai Ni+ or Musashi Kai Ni, Echelon (battle) formation selected.
	 * 2nd ship can be Yamato K2+ only if flagship is Musashi;
	 * if flagship is Yamato K2+, and 2nd ship is one of Musashi K2, Bismark drei, Iowa Kai, Richelieu Kai,
	 *   2-ship cutin will be performed;
	 * if flagship is Yamato K2+, and 2nd, 3rd is specific combination, 3-ship cutin triggered,
	 *   known 2nd/3rd ship pairs are: Nagato K2+Mutsu K2, Ise K2+Hyuuga K2, Fusou K2+Yamashiro K2,
	 *     Nelson K+Warspite K, Kongou K2C+Hiei K2C/Haruna K2B+, SouthDakota K+Washington K, Italia+Roma K, Colorado K+Maryland K
	 * 2nd, 3rd ship must be healthy either (not even Chuuha).
	 *
	 * The same additional ammo consumptions: 16% for 400, 12% for 401
	 *
	 * @return API ID (400~401) if this ship can do special cut-in attack, otherwise false.
	 * @see https://docs.google.com/spreadsheets/d/1WgZcBjw8Q58or9Mtjq-nzC-bJeu_2OvZfICfTs2iAfA/htmlview
	 */
	KC3Ship.prototype.canDoYamatoClassCutin = function() {
		if(this.isDummy() || this.isAbsent()) { return false; }
		// is this ship healthy Musashi K2
		if(KC3Meta.musashiCutinShips.includes(this.masterId) && !this.isStriped()) {
			const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
			if(fleetNum > 0 && shipPos === 0 && shipCnt >= 6
				&& (!PlayerManager.combinedFleet || fleetNum !== 2)) {
				const isEchelon = [4, 14].includes(
					this.collectBattleConditions().formationId || ConfigManager.aaFormation
				);
				const fleetObj = PlayerManager.fleets[fleetNum - 1],
					// 2nd ship is healthy Yamato K2+ only?
					validCombinedShips = [fleetObj.ship(1)]
						.every(ship => !ship.isAbsent() && !ship.isStriped()
							&& KC3Meta.yamatoCutinShips.includes(ship.masterId)),
					// no surface ship(s) sunk or retreated in mid-sortie?
					hasSixSurfaceShips = fleetObj.shipsUnescaped().filter(s => !s.isSubmarine()).length >= 6;
				if(isEchelon && validCombinedShips && hasSixSurfaceShips) return 401;
			}
		// is this ship healthy Yamato K2+
		} else if(KC3Meta.yamatoCutinShips.includes(this.masterId) && !this.isStriped()) {
			const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
			if(fleetNum > 0 && shipPos === 0 && shipCnt >= 6
				&& (!PlayerManager.combinedFleet || fleetNum !== 2)) {
				const isEchelon = [4, 14].includes(
					this.collectBattleConditions().formationId || ConfigManager.aaFormation
				);
				const fleetObj = PlayerManager.fleets[fleetNum - 1],
					// 2nd (3rd) ship healthy specific BB?
					validMinCombinedShips = [fleetObj.ship(1)]
						.every(ship => !ship.isAbsent() && !ship.isStriped()
							&& [8, 9, 10].includes(ship.master().api_stype)),
					// no surface ship(s) sunk or retreated in mid-sortie?
					hasSixSurfaceShips = fleetObj.shipsUnescaped().filter(s => !s.isSubmarine()).length >= 6;
				if(isEchelon && validMinCombinedShips && hasSixSurfaceShips) {
					// 3-ship cases:
					const valid3rdShip = [fleetObj.ship(2)].every(s => !s.isAbsent() && !s.isStriped() && KC3Meta.yamatoCutinPartner2.includes(s.masterId));
					if(valid3rdShip) {
						// Determine valid combination of 3 ships to return 400
						const allowedCombinations = [
							{ p1: [546], p2: [541, 573] }, // Musashi + Nagato-class, not swappable
							{ p1: [541], p2: [573] },      // Nagato + Mutsu
							{ p1: [553], p2: [554] },      // Ise + Hyuuga
							{ p1: [411], p2: [412] },      // Fusou + Yamashiro
							{ p1: [576], p2: [364] },      // Nelson + Warspite
							{ p1: [591], p2: [592] },      // Kongou + Hiei
							{ p1: [591], p2: [593] },      // Kongou + Haruna K2B (Haruna added since 2023-05-01)
							{ p1: [591], p2: [954] },      // Kongou + Haruna K2C
							{ p1: [697], p2: [659] },      // South Dakota + Washington
							{ p1: [446], p2: [447] },      // Italia + Roma
							{ p1: [1496], p2: [918] },     // Colorado + Maryland
						];
						const validPartners = allowedCombinations.find(pair => {
							const p1Id = fleetObj.ship(1).masterId,
								p2Id = fleetObj.ship(2).masterId;
							if(pair.p1.includes(p1Id) && pair.p2.includes(p2Id)) return true;
							if(!pair.p1.includes(546) && pair.p1.includes(p2Id) && pair.p2.includes(p1Id)) return true;
							return false;
						});
						if(validPartners) return 400;
					}
					// 2-ship cases:
					if(KC3Meta.yamatoCutinPartner1.includes(fleetObj.ship(1).masterId)) return 401;
				}
			}
		}
		return false;
	};

	/**
	 * Yamato-class special cut-in attack modifiers are variant,
	 * depending on equipment and 2nd and 3rd ship in the fleet.
	 * @see https://twitter.com/CC_jabberwock/status/1535008448580005888
	 */
	KC3Ship.prototype.estimateYamatoClassCutinModifier = function(forShipPos = 0, apiId = 400) {
		const locatedFleet = PlayerManager.fleets[this.onFleet() - 1];
		if(!locatedFleet) return 1;
		const flagshipMstId = locatedFleet.ship(0).masterId;
		if(!KC3Meta.yamatoCutinShips.includes(flagshipMstId)
			&& !KC3Meta.musashiCutinShips.includes(flagshipMstId)) return 1;

		forShipPos = (forShipPos || 0) % 3;
		const baseModifier = (apiId === 400 ? [1.5, 1.5, 1.65] : [1.4, 1.55, 1])[forShipPos];
		const secondShipMstId = locatedFleet.ship(1).masterId,
			shipModifiersBy2ndPos = (
				// for Yamato K2J
				916 === secondShipMstId ? [1.1, 1.25, 1]
				// for Yamato K2/Musashi K2
				: [911, 546].includes(secondShipMstId) ? [1.1, 1.2, 1]
				// for Nagato-class
				: [541, 573].includes(secondShipMstId) ? [1.1, 1.1, 1]
				// for Ise-class
				: [553, 554].includes(secondShipMstId) ? [1.05, 1.05, 1]
				: [1, 1, 1]
			),
			partnerShipModifier = shipModifiersBy2ndPos[forShipPos];
		const targetShip = locatedFleet.ship(forShipPos);
		const apShellModifier = targetShip.hasEquipmentType(2, 19) ? 1.35 : 1;
		const surfaceRadarModifier = targetShip.equipment(true).some(gear => gear.isSurfaceRadar()) ? 1.15 : 1;
		// no this mod for 3rd ship: https://twitter.com/CC_jabberwock/status/1534982170065833985
		const rangefinderRadarModifier = forShipPos < 2 && targetShip.hasEquipment([142, 460]) ? 1.1 : 1;

		return baseModifier * partnerShipModifier
			* apShellModifier * surfaceRadarModifier * rangefinderRadarModifier;
	};

	/**
	 * Night Zuiun night cut-in attack modifiers are variant depending on equipment.
	 * Suspected to be multi-rolls since random modifier and higher rate for bonus gears.
	 * @see https://twitter.com/yukicacoon/status/1625854945777025025
	 */
	KC3Ship.prototype.estimateNightZuiunCutinModifier = function() {
		const baseModifier = 1.24;
		const nightZuiunCount = this.countNonZeroSlotEquipment(490);
		const nightZuiunBonus = nightZuiunCount >= 2 ? 0.08 : 0;
		const surfaceRadarBonus = this.equipment(true).some(gear => gear.isSurfaceRadar()) ? 0.04 : 0;
		return baseModifier + nightZuiunBonus + surfaceRadarBonus;
	};

	/**
	 * @return the landing attack effect (animation) kind ID, return 0 if can not attack.
	 *  Since Phase 2, defined by `getDaihatsuEffectType` at `PhaseHougekiOpening, PhaseHougeki, PhaseHougekiBase`,
	 *  all the ID 1 are replaced by 3, ID 2 except the one at `PhaseHougekiOpening` replaced by 3.
	 *  new effect for 2nd Class Transporter implemented since March 2023 defined by `getKakuzaEffectType`
	 */
	KC3Ship.prototype.estimateLandingAttackType = function(targetShipMasterId = 0) {
		const targetShip = KC3Master.ship(targetShipMasterId);
		if(!this.masterId || !targetShip) return 0;
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		// to differentiate Kakuza kind ID, added 100 to final result
		if(targetShipType.isLand && this.is2ndClassTransporter()) {
			const armyUnit1Cnt = this.countEquipment(496), // Infantry
				armyUnit2Cnt = this.countEquipment(497),   // Chiha
				armyUnit3Cnt = this.countEquipment(498),   // Chiha Kai
				armyUnit4Cnt = this.countEquipment(499);   // Infantry + Chiha Kai
			if((armyUnit3Cnt + armyUnit4Cnt) >= 2) return 106;
			if(armyUnit2Cnt >= 1 && (armyUnit3Cnt + armyUnit4Cnt) === 1) return 105;
			if(armyUnit2Cnt >= 2) return 104;
			if((armyUnit3Cnt + armyUnit4Cnt) === 1) return 103;
			if(armyUnit2Cnt === 1) return 102;
			if(armyUnit1Cnt === 1) return 101;
		}
		if(targetShipType.isPtImp) {
			// Soukoutei (Armored Boat Class)
			if(this.hasEquipment(408)) return 7;
			// Armed Daihatsu
			if(this.hasEquipment(409)) return 8;
		}
		if(targetShipType.isLand) {
			// Toku Daihatsu + Chi-Ha and Kai
			if(this.hasEquipment([494, 495])) return 10;
			// M4A1 DD
			if(this.hasEquipment(355)) return 6;
			// Toku Daihatsu + T1 Gun Tank
			if(this.hasEquipment(449)) return 10;
			// Toku Daihatsu + 11th Tank
			if(this.hasEquipment(230)) return 5;
			// Soukoutei (Armored Boat Class)
			if(this.hasEquipment(408)) return 7;
			// Armed Daihatsu
			if(this.hasEquipment(409)) return 8;
		}
		// Abyssal land attack target, like Supply Depot Princess, see SPECIAL_ENTRY.
		const isTargetLandable = KC3Meta.specialLandInstallationNames.includes(targetShip.api_name);
		// M4A1 DD
		if(this.hasEquipment(355) && isTargetLandable) return 6;
		// T2 Tank
		if(this.hasEquipment(167)) {
			const isThisSubmarine = this.isSubmarine();
			if(isThisSubmarine && targetShipType.isLand) return 4;
			if(isTargetLandable) return 4;
			return 0;
		}
		if(isTargetLandable) {
			// Armored Boat (AB Class)
			if(this.hasEquipment(408)) return 7;
			// Armed Daihatsu
			if(this.hasEquipment(409)) return 8;
			// Panzer III
			if(this.hasEquipment([482, 514])) return 11;
			// Panzer II
			if(this.hasEquipment(436)) return 9;
			// T89 Tank
			if(this.hasEquipment(166)) return 3;
			// Toku Daihatsu
			if(this.hasEquipment(193)) return 3;
			// Daihatsu
			if(this.hasEquipment(68)) return 3;
		}
		return 0;
	};

	/**
	 * @param atType - id from `api_hougeki?.api_at_type` which indicates the special attack.
	 * @param altCutinTerm - different term string for cutin has different variant, like CVCI.
	 * @param altModifier - different power modifier for cutin has different variant, like CVCI.
	 * @return known special attack (aka Cut-In) types definition tuple.
	 *         will return an object mapped all IDs and tuples if atType is omitted.
	 *         will return `["SingleAttack", 0]` if no matched ID found.
	 * @see estimateDayAttackType
	 */
	KC3Ship.specialAttackTypeDay = function(atType, altCutinTerm, altModifier){
		const knownDayAttackTypes = {
			1: ["Cutin", 1, "Laser"], // no longer exists now
			2: ["Cutin", 2, "DoubleAttack", 1.2],
			3: ["Cutin", 3, "CutinMainSecond", 1.1],
			4: ["Cutin", 4, "CutinMainRadar", 1.2],
			5: ["Cutin", 5, "CutinMainApshell", 1.3],
			6: ["Cutin", 6, "CutinMainMain", 1.5],
			7: ["Cutin", 7, "CutinCVCI", 1.25],
			100: ["Cutin", 100, "CutinNelsonTouch", 2.0],
			101: ["Cutin", 101, "CutinNagatoSpecial", 2.61],
			102: ["Cutin", 102, "CutinMutsuSpecial", 2.61],
			103: ["Cutin", 103, "CutinColoradoSpecial", 2.68],
			200: ["Cutin", 200, "CutinZuiunMultiAngle", 1.35],
			201: ["Cutin", 201, "CutinAirSeaMultiAngle", 1.3],
			300: ["Cutin", 300, "CutinSubFleetSpecial1", 1.2],
			301: ["Cutin", 301, "CutinSubFleetSpecial2", 1.2],
			302: ["Cutin", 302, "CutinSubFleetSpecial3", 1.2],
			400: ["Cutin", 400, "CutinYamatoSpecial3ship", 2.82],
			401: ["Cutin", 401, "CutinYamatoSpecial2ship", 2.63],
		};
		if(atType === undefined) return knownDayAttackTypes;
		const matched = knownDayAttackTypes[atType] || ["SingleAttack", 0];
		if(matched[0] === "Cutin") {
			if(altCutinTerm) matched[2] = altCutinTerm;
			if(altModifier) matched[3] = altModifier;
		}
		return matched;
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
	 * @param {boolean} returnFirstOnly - specify false if want all possible attack types instead of most possible.
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
	 * @see main.js#PhaseHougeki.prototype._getNormalAttackType - since Phase 2
	 * @see specialAttackTypeDay
	 * @see estimateNightAttackType
	 * @see canDoOpeningTorpedo
	 * @see canDoDayShellingAttack
	 * @see canDoASW
	 * @see canDoClosingTorpedo
	 */
	KC3Ship.prototype.estimateDayAttackType = function(targetShipMasterId = 0, trySpTypeFirst = false,
			airBattleId = 1, returnFirstOnly = true) {
		const results = [];
		if(this.isDummy()) { return results; }
		// if attack target known, will give different attack according target ship
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		const isThisCarrier = this.isCarrier();
		const isThisSubmarine = this.isSubmarine();
		
		// Special cutins do not need isAirSuperiorityBetter
		if(trySpTypeFirst) {
			// Nelson Touch since 2018-09-15
			// Rodney extended since 2023-08-28
			if(this.canDoNelsonTouch()) {
				results.push(KC3Ship.specialAttackTypeDay(100, null, this.estimateNelsonTouchModifier()));
			}
			// Nagato cutin since 2018-11-16
			if(this.canDoNagatoClassCutin(KC3Meta.nagatoCutinShips)) {
				// To clarify: here only indicates the modifier of flagship's first 2 attacks
				results.push(KC3Ship.specialAttackTypeDay(101, null, this.estimateNagatoClassCutinModifier()));
			}
			// Mutsu cutin since 2019-02-27
			if(this.canDoNagatoClassCutin(KC3Meta.mutsuCutinShips)) {
				results.push(KC3Ship.specialAttackTypeDay(102, null, this.estimateNagatoClassCutinModifier()));
			}
			// Colorado cutin since 2019-05-25
			if(this.canDoColoradoCutin()) {
				results.push(KC3Ship.specialAttackTypeDay(103, null, this.estimateColoradoCutinModifier()));
			}
			// Sub Fleet cutin since 2021-05-08
			if(this.canDoSubFleetCutin()) {
				// Damage calculation is quite different:
				// based on torpedo attack, not affected by formation/engagement, affected by level of SS attacker
				results.push(KC3Ship.specialAttackTypeDay(this.canDoSubFleetCutin()));
			}
			// Yamato-class Cutin since 2022-06-08
			const yamatoCutinId = this.canDoYamatoClassCutin();
			if(yamatoCutinId) {
				results.push(KC3Ship.specialAttackTypeDay(yamatoCutinId, null, this.estimateYamatoClassCutinModifier(0, yamatoCutinId)));
			}
		}
		const isAirSuperiorityBetter = airBattleId === 1 || airBattleId === 2;
		// Special Multi-Angle cutins do not need recon plane and probably higher priority
		if(trySpTypeFirst && isAirSuperiorityBetter) {
			const isThisIseClassK2 = [553, 554].includes(this.masterId);
			const mainGunCnt = this.countEquipmentType(2, [1, 2, 3, 38]);
			if(isThisIseClassK2 && mainGunCnt > 0 && !this.isTaiha()) {
				// Ise-class Kai Ni Zuiun Multi-Angle Attack since 2019-03-27
				const spZuiunCnt = this.countNonZeroSlotEquipment(
					// All seaplane bombers named Zuiun capable?
					[26, 79, 80, 81, 207, 237, 322, 323, 490]
				);
				// Zuiun priority to Air/Sea Attack when they are both equipped
				if(spZuiunCnt > 1) results.push(KC3Ship.specialAttackTypeDay(200));
				// Ise-class Kai Ni Air/Sea Multi-Angle Attack since 2019-03-27
				const spSuiseiCnt = this.countNonZeroSlotEquipment(
					// Only Suisei named 634th Air Group capable?
					[291, 292, 319]
				);
				if(spSuiseiCnt > 1) results.push(KC3Ship.specialAttackTypeDay(201));
			}
		}
		// ~Rotorcraft and ASW Patrol can trigger Artillery Spotting too~ since 2023-02-14?
		// unable to reproduce (on Ise-class) for now, was probably misunderstanding tests
		const hasRecon = this.hasNonZeroSlotEquipmentType(2, [10, 11/*, 25, 26*/]);
		if(trySpTypeFirst && hasRecon && isAirSuperiorityBetter) {
			/*
			 * To estimate if can do day time special attacks (aka Artillery Spotting).
			 * In game, special attack types are judged and given by server API result.
			 * By equip compos, multiply types are possible to be selected to trigger, such as
			 * CutinMainMain + Double, CutinMainAPShell + CutinMainRadar + CutinMainSecond.
			 * Here just check by strictness & modifier desc order and return one of them by default.
			 */
			const mainGunCnt = this.countEquipmentType(2, [1, 2, 3, 38]);
			const apShellCnt = this.countEquipmentType(2, 19);
			if(mainGunCnt >= 2 && apShellCnt >= 1) results.push(KC3Ship.specialAttackTypeDay(6));
			const secondaryCnt = this.countEquipmentType(2, 4);
			if(mainGunCnt >= 1 && secondaryCnt >= 1 && apShellCnt >= 1)
				results.push(KC3Ship.specialAttackTypeDay(5));
			const radarCnt = this.countEquipmentType(2, [12, 13]);
			if(mainGunCnt >= 1 && secondaryCnt >= 1 && radarCnt >= 1)
				results.push(KC3Ship.specialAttackTypeDay(4));
			if(mainGunCnt >= 1 && secondaryCnt >= 1) results.push(KC3Ship.specialAttackTypeDay(3));
			if(mainGunCnt >= 2) results.push(KC3Ship.specialAttackTypeDay(2));
		} else if(trySpTypeFirst && isThisCarrier && isAirSuperiorityBetter) {
			// day time carrier shelling cut-in
			// http://wikiwiki.jp/kancolle/?%C0%EF%C6%AE%A4%CB%A4%C4%A4%A4%A4%C6#FAcutin
			// https://twitter.com/_Kotoha07/status/907598964098080768
			// https://twitter.com/arielugame/status/908343848459317249
			const fighterCnt = this.countNonZeroSlotEquipmentType(2, 6);
			const diveBomberCnt = this.countNonZeroSlotEquipmentType(2, 7);
			const torpedoBomberCnt = this.countNonZeroSlotEquipmentType(2, 8);
			if(diveBomberCnt >= 1 && torpedoBomberCnt >= 1 && fighterCnt >= 1)
				results.push(KC3Ship.specialAttackTypeDay(7, "CutinFDBTB", 1.25));
			if(diveBomberCnt >= 2 && torpedoBomberCnt >= 1)
				results.push(KC3Ship.specialAttackTypeDay(7, "CutinDBDBTB", 1.2));
			if(diveBomberCnt >= 1 && torpedoBomberCnt >= 1)
				results.push(KC3Ship.specialAttackTypeDay(7, "CutinDBTB", 1.15));
		}
		
		// is target a land installation
		let landingAttackType = 0, hasRocketLauncher = false;
		if(targetShipType.isLand) {
			landingAttackType = this.estimateLandingAttackType(targetShipMasterId);
			hasRocketLauncher = this.hasEquipmentType(2, 37) || this.hasEquipment([346, 347]);
			// Landing craft anti-installation animation has now become an optional effect of other base attack methods even Rocket,
			// day time only CVCI of special attacks can be coupling with landing effects,
			// see `PhaseAttackBase.prototype.setOptionalEffects`, and eg:
			//   Gambier Bay Mk.II doing air attack + DLC landing at the same time https://twitter.com/noobcyan/status/1415679788983873537
			// here we still count it as priority exclusive base attack method
			// 2nd Class Transporter's Kakuza attack only happen when normal attack type is 0, so lower priority
			if(landingAttackType > 0 && landingAttackType < 100) results.push(["LandingEffect", landingAttackType]);
		}
		const pushRocketAttackIfNecessary = (normalAttack) => {
			// is target installation, Rocket equipped and base not AirAttack,
			// see `main.js#PhaseHougeki.prototype._hasRocketEffect`
			if(targetShipType.isLand && hasRocketLauncher && normalAttack[1] !== 1) {
				// no such ID -1, just mean higher priority
				results.push(["RocketAttack", -1]);
			// is target installation, army gears equppiped and base is SingleAttack,
			// see `main.js#PhaseHougeki.prototype._normal`
			} else if(targetShipType.isLand && landingAttackType > 100 && normalAttack[1] === 0) {
				results.push(["AshoreAttack", landingAttackType]);
			} else {
				results.push(normalAttack);
			}
		};
		// is this ship Hayasui Kai
		if(this.masterId === 352) {
			if(targetShipType.isSubmarine) {
				// air attack if asw aircraft equipped
				const aswEquip = this.hasNonZeroSlotEquipmentFunc(g => g.isAswAircraft(false));
				results.push(aswEquip ? ["AirAttack", 1] : ["DepthCharge", 2]);
			} else
			// air attack if torpedo bomber equipped, otherwise fall back to shelling
			if(this.hasEquipmentType(2, 8))
				results.push(["AirAttack", 1]);
			else
				pushRocketAttackIfNecessary(["SingleAttack", 0]);
		}
		// is this ship Yamashiomaru
		else if([900, 717].includes(this.masterId)) {
			if(targetShipType.isSubmarine) {
				// air attack if asw aircraft equipped
				const aswEquip = this.hasNonZeroSlotEquipmentFunc(g => g.isAswAircraft(false));
				results.push(aswEquip ? ["AirAttack", 1] : ["DepthCharge", 2]);
			} else
			// air attack if carrier bomber equipped, otherwise fall back to shelling
			if(this.hasEquipmentType(2, [7, 8]))
				results.push(["AirAttack", 1]);
			else
				pushRocketAttackIfNecessary(["SingleAttack", 0]);
		}
		// is this ship Fusou-class Kai Ni
		else if([411, 412].includes(this.masterId)) {
			if(targetShipType.isSubmarine) {
				const aswAircraft = this.hasNonZeroSlotEquipmentFunc(g => g.isAswAircraft(false));
				const depthCharge = this.hasEquipmentType(2, 15);
				if(aswAircraft) results.push(["AirAttack", 1]);
				else if(depthCharge) results.push(["DepthCharge", 2]);
				// BBV default to air attack against submarine
				else results.push(["AirAttack", 1]);
			} else {
				// default for other targets
				pushRocketAttackIfNecessary(["SingleAttack", 0]);
			}
		// 2nd Class Transporter against submarine
		} else if(targetShipType.isSubmarine && this.is2ndClassTransporter()) {
			results.push(["DepthCharge", 2]);
		} else if(isThisCarrier) {
			results.push(["AirAttack", 1]);
		}
		// only torpedo attack possible if this ship is submarine (but not shelling phase)
		else if(isThisSubmarine) {
			pushRocketAttackIfNecessary(["Torpedo", 3]);
		} else if(targetShipType.isSubmarine) {
			const stype = this.master().api_stype;
			// CAV, BBV, AV, LHA can only air attack against submarine
			results.push( ([6, 10, 16, 17].includes(stype)) ? ["AirAttack", 1] : ["DepthCharge", 2] );
		} else {
			// default single shelling fire attack
			pushRocketAttackIfNecessary(["SingleAttack", 0]);
		}
		return returnFirstOnly ? results[0] : results;
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
		// currently known ships: Graf / Graf Kai, Saratoga, Taiyou Class Kai Ni, Kaga Kai Ni Go
		// exceptions: Gambier Bay Mk.II don't move if NOAP flag not met although fp is 3
		//             Langley and Kai fp > 0, but seems don't attack either
		if(isThisCarrier && initYasen > 0 && ![707, 925, 930].includes(this.masterId)) return true;
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
			const hasNightAircraft = this.hasEquipmentType(3, KC3GearManager.nightAircraftType3Ids);
			const hasNightAvPersonnel = this.hasEquipment([258, 259]);
			// night battle capable carriers: Saratoga Mk.II, Akagi Kai Ni E/Kaga Kai Ni E, Ryuuhou Kai Ni E
			const isThisNightCarrier = [545, 599, 610, 883].includes(this.masterId);
			// ~~Swordfish variants are counted as night aircraft for Ark Royal + NOAP~~
			// Ark Royal + Swordfish variants + NOAP - night aircraft will not get `api_n_mother_list: 1`
			//const isThisArkRoyal = [515, 393].includes(this.masterId);
			//const isSwordfishArkRoyal = isThisArkRoyal && this.hasEquipment([242, 243, 244]);
			// if night aircraft + (NOAP equipped / on Saratoga Mk.2/Akagi K2E/Kaga K2E/Ryuuhou K2E)
			return hasNightAircraft && (hasNightAvPersonnel || isThisNightCarrier);
		}
		return false;
	};

	/**
	 * @param spType - id from `api_hougeki.api_sp_list` which indicates the special attack.
	 * @param altCutinTerm - different term string for cutin has different variant, like SS TCI, CVNCI, DDCI.
	 * @param altModifier - different power modifier for cutin has different variant, like SS TCI, CVNCI, DDCI.
	 * @return known special attack (aka Cut-In) types definition tuple.
	 *         will return an object mapped all IDs and tuples if atType is omitted.
	 *         will return `["SingleAttack", 0]` if no matched ID found.
	 * @see estimateNightAttackType
	 */
	KC3Ship.specialAttackTypeNight = function(spType, altCutinTerm, altModifier){
		const knownNightAttackTypes = {
			1: ["Cutin", 1, "DoubleAttack", 1.2],
			2: ["Cutin", 2, "CutinTorpTorpMain", 1.3],
			3: ["Cutin", 3, "CutinTorpTorpTorp", 1.5],
			4: ["Cutin", 4, "CutinMainMainSecond", 1.75],
			5: ["Cutin", 5, "CutinMainMainMain", 2.0],
			6: ["Cutin", 6, "CutinCVNCI", 1.25],
			7: ["Cutin", 7, "CutinMainTorpRadar", 1.3],
			8: ["Cutin", 8, "CutinTorpRadarLookout", 1.2],
			9: ["Cutin", 9, "CutinTorpLookoutTorp", 1.5],
			10: ["Cutin", 10, "CutinTorpLookoutDrum", 1.3],
			11: ["Cutin", 11, "CutinMainTorpRadarDouble", 1.3],
			12: ["Cutin", 12, "CutinTorpRadarLookoutDouble", 1.2],
			13: ["Cutin", 13, "CutinTorpLookoutTorpDouble", 1.5],
			14: ["Cutin", 14, "CutinTorpLookoutDrumDouble", 1.3],
			100: ["Cutin", 100, "CutinNelsonTouch", 2.0],
			101: ["Cutin", 101, "CutinNagatoSpecial", 2.61],
			102: ["Cutin", 102, "CutinMutsuSpecial", 2.61],
			103: ["Cutin", 103, "CutinColoradoSpecial", 2.68],
			104: ["Cutin", 104, "CutinKongouSpecial", 2.2],
			200: ["Cutin", 200, "CutinNightZuiunNight", 1.28],
			300: ["Cutin", 300, "CutinSubFleetSpecial1", 1.2],
			301: ["Cutin", 301, "CutinSubFleetSpecial2", 1.2],
			302: ["Cutin", 302, "CutinSubFleetSpecial3", 1.2],
			400: ["Cutin", 400, "CutinYamatoSpecial3ship", 2.82],
			401: ["Cutin", 401, "CutinYamatoSpecial2ship", 2.63],
		};
		if(spType === undefined) return knownNightAttackTypes;
		const matched = knownNightAttackTypes[spType] || ["SingleAttack", 0];
		if(matched[0] === "Cutin") {
			if(altCutinTerm) matched[2] = altCutinTerm;
			if(altModifier) matched[3] = altModifier;
		}
		return matched;
	};

	/**
	 * @return special cutin attack extended info, such as damage dealer index, modifier callback.
	 * @see KC3BattlePrediction.battle.phases.hougeki.parseSpecialCutin - similar settings coded.
	 */
	KC3Ship.specialAttackExtendInfo = function(attackType){
		const knownAttackTypes = {
			100: { posIndex: [0, 2, 4], partIndex: [2, 4], modFunc: "estimateNelsonTouchModifier", },
			101: { posIndex: [0, 0, 1], partIndex: [1], modFunc: "estimateNagatoClassCutinModifier", },
			102: { posIndex: [0, 0, 1], partIndex: [1], modFunc: "estimateNagatoClassCutinModifier", },
			103: { posIndex: [0, 1, 2], partIndex: [1, 2], modFunc: "estimateColoradoCutinModifier", },
			104: { posIndex: [0, 1], partIndex: [1], nightOnly: true, },
			// Power mods irrelevant to ship position, not necessary yet
			//200: { posIndex: [], partIndex: [], nightOnly: true, },
			300: { posIndex: [1, 2], posIndex2: [1, 1, 2, 2], partIndex: [0, 1, 2], },
			301: { posIndex: [2, 3], posIndex2: [2, 2, 3, 3], partIndex: [0, 2, 3], },
			302: { posIndex: [1, 3], posIndex2: [1, 1, 3, 3], partIndex: [0, 1, 3], },
			400: { posIndex: [0, 1, 2], partIndex: [1, 2], modFunc: "estimateYamatoClassCutinModifier", },
			401: { posIndex: [0, 0, 1], partIndex: [1], modFunc: "estimateYamatoClassCutinModifier", },
		};
		return attackType ? knownAttackTypes[attackType] || {} : knownAttackTypes;
	};

	/**
	 * Estimate night battle attack type of this ship.
	 * Also just give possible attack type, no responsibility to check can do attack at night,
	 * or that ship can be targeted or not, etc.
	 * @param {number} targetShipMasterId - a Master ID of being attacked ship.
	 * @param {boolean} trySpTypeFirst - specify true if want to estimate special attack type.
	 * @param {boolean} returnFirstOnly - specify false if want all possible attack types instead of most possible.
	 * @return {Array} night battle attack type constants tuple: [name, cutin id, cutin name, modifier].
	 *         cutin id is partially from `api_hougeki.api_sp_list` which indicates the special attacks.
	 * @see BattleMain.swf#battle.models.attack.AttackData#setOptionsAtNight - client side codes of night attack type.
	 * @see BattleMain.swf#battle.phase.night.PhaseAttack - client side hints of special cutin attack type.
	 * @see main.js#PhaseHougekiBase.prototype._getNormalAttackType - since Phase 2
	 * @see specialAttackTypeNight
	 * @see estimateDayAttackType
	 * @see canDoNightAttack
	 */
	KC3Ship.prototype.estimateNightAttackType = function(targetShipMasterId = 0, trySpTypeFirst = false,
			returnFirstOnly = true) {
		const results = [];
		if(this.isDummy()) { return results; }
		const targetShipType = this.estimateTargetShipType(targetShipMasterId);
		const isThisCarrier = this.isCarrier();
		const isThisSubmarine = this.isSubmarine();
		const stype = this.master().api_stype;
		const isThisLightCarrier = stype === 7;
		const isThisDestroyer = stype === 2;
		const isThisKagaK2Go = this.masterId === 646;
		const isFusouClassKaiNi = [411, 412].includes(this.masterId);
		
		const torpedoCnt = this.countEquipmentType(2, [5, 32]);
		// simulate server-side night air attack flag: `api_n_mother_list`
		const isCarrierNightAirAttack = isThisCarrier && this.canCarrierNightAirAttack();
		if(trySpTypeFirst && !targetShipType.isSubmarine) {
			// to estimate night special attacks, which should be given by server API result.
			// will not trigger if this ship is taiha or targeting submarine.
			
			// carrier night cut-in, NOAP or Saratoga Mk.II/Akagi K2E/Kaga K2E/Ryuuhou K2E needed
			if(isCarrierNightAirAttack) {
				// https://kancolle.fandom.com/wiki/Combat#Setups_and_Attack_Types
				// https://en.kancollewiki.net/Combat/Night_Battle
				// http://wikiwiki.jp/kancolle/?%CC%EB%C0%EF#x397cac6
				const nightFighterCnt = this.countNonZeroSlotEquipmentType(3, 45);
				const nightTBomberCnt = this.countNonZeroSlotEquipmentType(3, 46);
				// Zero Fighter Model 62 (Fighter-bomber Iwai Squadron)
				const iwaiDBomberCnt = this.countNonZeroSlotEquipment(154);
				// Swordfish variants
				const swordfishTBomberCnt = this.countNonZeroSlotEquipment([242, 243, 244]);
				// new patterns for Suisei Model 12 (Type 31 Photoelectric Fuze Bombs) since 2019-04-30,
				// it more likely acts as yet unimplemented Night Dive Bomber type
				const photoDBomberCnt = this.countNonZeroSlotEquipment(320);
				const nightPlaneCnt = nightFighterCnt + nightTBomberCnt + photoDBomberCnt + iwaiDBomberCnt + swordfishTBomberCnt;
				// first place thank to its highest priority and power mod 1.25
				if(nightFighterCnt >= 2 && nightTBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNFNTB", 1.25));
				// 2 planes mod 1.2, proc rate might be higher and photo one might roll once more
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNTB", 1.2));
				if((nightFighterCnt >= 1 || nightTBomberCnt >= 1) && photoDBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNDB", 1.2));
				// 3 planes mod 1.18, get rid of the mod 1.25 pattern
				if(nightFighterCnt >= 1 && nightPlaneCnt >= 3
					&& !(nightFighterCnt === 2 && nightTBomberCnt === 1 && nightPlaneCnt === 3))
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNPx3", 1.18));
				// old codes for all known patterns of 3 planes
				/*
				if(nightFighterCnt >= 3)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNFNF", ncvciModifier));
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 2)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNTBNTB", ncvciModifier));
				if(nightFighterCnt >= 2 && iwaiDBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNFFBI", ncvciModifier));
				if(nightFighterCnt >= 2 && swordfishTBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNFSF", ncvciModifier));
				if(nightFighterCnt >= 1 && iwaiDBomberCnt >= 2)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFFBIFBI", ncvciModifier));
				if(nightFighterCnt >= 1 && swordfishTBomberCnt >= 2)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFSFSF", ncvciModifier));
				if(nightFighterCnt >= 1 && iwaiDBomberCnt >= 1 && swordfishTBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFFBISF", ncvciModifier));
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 1 && iwaiDBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNTBFBI", ncvciModifier));
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 1 && swordfishTBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNTBSF", ncvciModifier));
				if(nightFighterCnt >= 2 && photoDBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNFNDB", ncvciModifier));
				if(nightFighterCnt >= 1 && photoDBomberCnt >= 2)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNDBNDB", ncvciModifier));
				if(nightFighterCnt >= 1 && nightTBomberCnt >= 1 && photoDBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNTBNDB", ncvciModifier));
				if(nightFighterCnt >= 1 && photoDBomberCnt >= 1 && iwaiDBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNDBFBI", ncvciModifier));
				if(nightFighterCnt >= 1 && photoDBomberCnt >= 1 && swordfishTBomberCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(6, "CutinNFNDBSF", ncvciModifier));
				*/
			} else {
				// special Nelson Touch since 2018-09-15
				if(this.canDoNelsonTouch()) {
					const isRedT = this.collectBattleConditions().engagementId === 4;
					results.push(KC3Ship.specialAttackTypeNight(100, null, isRedT ? 2.5 : 2.0));
				}
				// special Nagato Cutin since 2018-11-16
				if(this.canDoNagatoClassCutin(KC3Meta.nagatoCutinShips)) {
					results.push(KC3Ship.specialAttackTypeNight(101, null, this.estimateNagatoClassCutinModifier()));
				}
				// special Mutsu Cutin since 2019-02-27
				if(this.canDoNagatoClassCutin(KC3Meta.mutsuCutinShips)) {
					results.push(KC3Ship.specialAttackTypeNight(102, null, this.estimateNagatoClassCutinModifier()));
				}
				// special Colorado Cutin since 2019-05-25
				if(this.canDoColoradoCutin()) {
					results.push(KC3Ship.specialAttackTypeNight(103, null, this.estimateColoradoCutinModifier()));
				}
				// special Kongou-class K2C Cutin since 2020-04-23
				if(this.canDoKongouCutin()) {
					// Basic precap modifier is 1.9: https://twitter.com/CC_jabberwock/status/1253677320629399552
					// Modifier buffed to 2.2 since 2022-06-08: https://twitter.com/hedgehog_hasira/status/1534589935868465154
					// Buffed again to 2.4 since 2023-05-01: https://twitter.com/hedgehog_hasira/status/1653066005852360704
					const engagementMod = [1, 1, 1, 1.25, 0.8][this.collectBattleConditions().engagementId] || 1.0;
					results.push(KC3Ship.specialAttackTypeNight(104, null, 2.4 * engagementMod));
				}
				// special Sub Fleet Cutin since 2021-05-08
				if(this.canDoSubFleetCutin()) {
					results.push(KC3Ship.specialAttackTypeNight(this.canDoSubFleetCutin()));
				}
				// special Yamato-class Cutin since 2022-06-08
				const yamatoCutinId = this.canDoYamatoClassCutin();
				if(yamatoCutinId) {
					results.push(KC3Ship.specialAttackTypeNight(yamatoCutinId, null, this.estimateYamatoClassCutinModifier(0, yamatoCutinId)));
				}
				// special [490] Night Zuiun Cutin since 2023-02-14, sharing ID 200 with daytime Zuiun Multi-Angle Attack, behaves more like single ship cutins below, except multiple enemy targets
				// basic conditions: capable stypes CL, CAV, BBV, AV; Night Zuiun equpped; main guns >= 2, not even chuuha
				if([3, 6, 10, 16].includes(stype)
					&& this.hasNonZeroSlotEquipment(490) && this.countEquipmentType(1, 1) >= 2
					&& !this.isStriped()) {
					results.push(KC3Ship.specialAttackTypeNight(200, null, this.estimateNightZuiunCutinModifier()));
				}
				// special torpedo related cut-in for destroyers since 2017-10-25,
				// these types can be rolled for every setup requirements met, beofore regular cutins below
				// http://wikiwiki.jp/kancolle/?%CC%EB%C0%EF#dfcb6e1f
				// see also `PhaseHougeki.prototype._kuchiku_special`
				if(isThisDestroyer && torpedoCnt >= 1) {
					// according tests, only surface radar capable
					const hasCapableRadar = this.equipment(true).some(gear => gear.isSurfaceRadar());
					// general ship personnel
					const hasSkilledLookouts = this.hasEquipmentType(2, 39);
					const smallMainGunCnt = this.countEquipmentType(2, 1);
					// specific ship personnel: torpedo squadron skilled lookouts
					const hasTsSkilledLookouts = this.hasEquipment(412);
					const hasDrumCanister = this.hasEquipmentType(2, 30);
					// extra power bonus if small main gun is 12.7cm Twin Gun Mount Model D Kai Ni/3
					// https://twitter.com/ayanamist_m2/status/944176834551222272
					// https://docs.google.com/spreadsheets/d/1_e0M6asJUbu9EEW4PrGCu9hOxZnY7OQEDHH2DUAzjN8/htmlview
					const modelDK2SmallGunCnt = this.countEquipment(267),
					      modelDK3SmallGunCnt = this.countEquipment(366);
					// possible to equip 2 D guns for 4 slots Tashkent,
					// or surface radar in ex-slot ships since 2023-06-14
					// https://twitter.com/Xe_UCH/status/1011398540654809088
					// https://twitter.com/grapefox_zuizui/status/1664695317625819145
					const modelDSmallGunModifier =
						([1, 1.25, 1.4][modelDK2SmallGunCnt + modelDK3SmallGunCnt] || 1.4)
							* (1 + modelDK3SmallGunCnt * 0.05);
					const addDestroyerSpAttacksToId = (diff) => {
						if(hasCapableRadar && smallMainGunCnt >= 1)
							results.push(KC3Ship.specialAttackTypeNight(7 + diff, null, 1.3 * modelDSmallGunModifier));
						if(hasCapableRadar && hasSkilledLookouts && (!targetShipType.isLand || smallMainGunCnt >= 1))
							results.push(KC3Ship.specialAttackTypeNight(8 + diff, null, 1.2 * modelDSmallGunModifier));
						// special cutins for Torpedo Squadron SLO since 2021-04-30
						// no D gun modifier: https://twitter.com/yukicacoon/status/1388100262938562563
						if(torpedoCnt >= 2 && hasTsSkilledLookouts && (!targetShipType.isLand || smallMainGunCnt >= 1))
							results.push(KC3Ship.specialAttackTypeNight(9 + diff));
						if(hasDrumCanister && hasTsSkilledLookouts && (!targetShipType.isLand || smallMainGunCnt >= 1))
							results.push(KC3Ship.specialAttackTypeNight(10 + diff));
					};
					// since 2021-05-08, all 4 types get indiviual ID, and get double hits version
					// https://twitter.com/CC_jabberwock/status/1391058345990127618
					// setups of double-hit ID (+4) are the same, but threshold seems be level 80
					// https://twitter.com/CC_jabberwock/status/1392587817524502529
					if(this.level >= 80) addDestroyerSpAttacksToId(4);
					addDestroyerSpAttacksToId(0);
				}
				// [457] bow 4 tubes had been not counted: https://twitter.com/yukicacoon/status/1530850901388587013
				// [458] even sub radar not counted: https://twitter.com/shiro_sh39/status/1530861026941448193
				// fixed since 2022-05-30: https://twitter.com/KanColle_STAFF/status/1531162152010395649
				// [512] 4 tubes not counted again: https://twitter.com/nagasisoumen22/status/1690298363546349568
				// fixed since 2023-11-03
				const lateTorpedoCnt = this.countEquipment([213, 214, 383, 441, 443, 457, 461, 512]);
				const submarineRadarCnt = this.countEquipmentType(2, 51);
				const mainGunCnt = this.countEquipmentType(2, [1, 2, 3, 38]);
				const secondaryCnt = this.countEquipmentType(2, 4);
				// KC Vita rolls order: MainMainMain(/140) -> MainMainSecond(/130) -> TorpTorp(/122) -> TorpMain(/115) -> Renzoku(/110)
				// KC Vita power/accuracy modifiers: 1.75/1.5, 1.5/1.65, 1.3/1.5, 1.2/1.1, 2.0/2.0
				// KC Browser confirmed that only 1 setup in this ordrer will be picked up and roll once,
				//            lower priority setups also met will not be rolled at all, unlike vita.
				if(mainGunCnt >= 3) results.push(KC3Ship.specialAttackTypeNight(5));
				else if(mainGunCnt >= 2 && secondaryCnt >= 1)
					results.push(KC3Ship.specialAttackTypeNight(4));
				// special torpedo cut-in for late model submarine torpedo
				else if(lateTorpedoCnt >= 1 && submarineRadarCnt >= 1 && !targetShipType.isLand)
					results.push(KC3Ship.specialAttackTypeNight(3, "CutinLateTorpRadar", 1.75));
				else if(lateTorpedoCnt >= 2 && !targetShipType.isLand)
					results.push(KC3Ship.specialAttackTypeNight(3, "CutinLateTorpTorp", 1.6));
				else if(torpedoCnt >= 2 && !targetShipType.isLand)
					results.push(KC3Ship.specialAttackTypeNight(3));
				else if(mainGunCnt >= 1 && torpedoCnt >= 1 && !targetShipType.isLand)
					results.push(KC3Ship.specialAttackTypeNight(2));
				// double attack can be torpedo attack animation if a slot in `api_si_list` is torpedo
				//   see `PhaseAttackDouble.prototype._completePreload`
				// KC Vita 'Renzoku' condition different: main+sec+torp >= 2
				else if(mainGunCnt + secondaryCnt >= 2)
					results.push(KC3Ship.specialAttackTypeNight(1));
			}
		}
		
		let landingAttackType = 0, hasRocketLauncher = false;
		if(targetShipType.isLand) {
			landingAttackType = this.estimateLandingAttackType(targetShipMasterId);
			hasRocketLauncher = this.hasEquipmentType(2, 37) || this.hasEquipment([346, 347]);
			// the same with day shelling, landing craft animation now optional effects added to other attack methods
			if(landingAttackType > 0 && landingAttackType < 100) results.push(["LandingEffect", landingAttackType]);
		}
		const pushRocketAttackIfNecessary = (normalAttack) => {
			// see `main.js#PhaseHougekiBase.prototype._hasRocketEffect`
			if(targetShipType.isLand && hasRocketLauncher && normalAttack[1] !== 1) {
				results.push(["Rocket", -1]);
			// see `main.js#PhaseHougeki.prototype._normal`
			} else if(targetShipType.isLand && landingAttackType > 100 && normalAttack[1] === 0) {
				results.push(["AshoreAttack", landingAttackType]);
			} else {
				results.push(normalAttack);
			}
		};
		// priority to use server flag
		if(isCarrierNightAirAttack) {
			results.push(["AirAttack", 1, true]);
		} else if(targetShipType.isSubmarine && (isThisLightCarrier || isThisKagaK2Go || isFusouClassKaiNi)) {
			results.push(["DepthCharge", 2]);
		} else if(targetShipType.isSubmarine && this.is2ndClassTransporter()) {
			results.push(["DepthCharge", 2]);
		} else if(isThisCarrier) {
			// these abyssal ships can only be shelling attacked,
			// see `main.js#PhaseHougekiBase.prototype._getNormalAttackType`
			const isSpecialAbyssal = [
				1679, 1680, 1681, 1682, 1683, // Lycoris Princess
				1711, 1712, 1713, // Jellyfish Princess
				].includes[targetShipMasterId];
			const isSpecialCarrier = [
				432, 353, // Graf & Graf Kai
				433 // Saratoga (base form)
				].includes(this.masterId);
			if(isSpecialCarrier || isSpecialAbyssal) pushRocketAttackIfNecessary(["SingleAttack", 0]);
			// here just indicates 'attack type', not 'can attack or not', see #canDoNightAttack
			// Taiyou Kai Ni fell back to shelling attack if no bomber equipped, but ninja changed by devs.
			// now she will air attack against surface ships, but no plane appears if no aircraft equipped.
			else results.push(["AirAttack", 1]);
		} else if(isThisSubmarine) {
			pushRocketAttackIfNecessary(["Torpedo", 3]);
		} else if(targetShipType.isSubmarine) {
			// CAV, BBV, AV, LHA
			results.push( ([6, 10, 16, 17].includes(stype)) ? ["AirAttack", 1] : ["DepthCharge", 2] );
		} else {
			// torpedo attack if any torpedo equipped at top most, otherwise single shelling fire
			const topGear = this.equipment().find(gear => gear.exists() &&
				[1, 2, 3].includes(gear.master().api_type[1]));
			pushRocketAttackIfNecessary( topGear && topGear.master().api_type[1] === 3 ? ["Torpedo", 3] : ["SingleAttack", 0] );
		}
		return returnFirstOnly ? results[0] : results;
	};

	/**
	 * Calculates base value used in day battle artillery spotting process chance.
	 * Likely to be revamped as formula comes from PSVita and does not include CVCI,
	 * uncertain about Combined Fleet interaction.
	 * @see https://kancolle.wikia.com/wiki/User_blog:Shadow27X/Artillery_Spotting_Rate_Formula
	 * @see https://en.kancollewiki.net/Combat/Artillery_Spotting#Trigger_Rates
	 * @see KC3Fleet.prototype.artillerySpottingLineOfSight
	 */
	KC3Ship.prototype.daySpAttackBaseRate = function() {
		if (this.isDummy() || !this.onFleet()) { return {}; }
		const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
		const fleet = PlayerManager.fleets[fleetNum - 1];
		const fleetLoS = fleet.artillerySpottingLineOfSight();
		const adjFleetLoS = Math.floor(Math.sqrt(fleetLoS) + fleetLoS / 10);
		const adjLuck = Math.floor(Math.sqrt(this.lk[0]) + 10);
		// exclude equipment on ship LoS visible bonus for now
		const equipLoS = this.equipmentTotalStats("saku", true, false);
		const battleConds = this.collectBattleConditions();
		// assume to best condition AS+ by default (for non-battle)
		const airBattleId = battleConds.airBattleId == undefined ? 1 : battleConds.airBattleId;
		const baseValue = airBattleId === 1 ? adjLuck + 0.7 * (adjFleetLoS + 1.6 * equipLoS) + 10 :
			airBattleId === 2 ? adjLuck + 0.6 * (adjFleetLoS + 1.2 * equipLoS) : 0;
		return {
			baseValue,
			isFlagship: shipPos === 0,
			equipLoS,
			fleetLoS,
			dispSeiku: airBattleId
		};
	};

	/**
	 * Calculates base value used in night battle cut-in process chance.
	 * @param {number} spType - based on api_sp_list value of night special attack type.
	 * @param {number} currentHp - used by simulating from battle prediction or getting different HP value.
	 * @see https://kancolle.wikia.com/wiki/Combat/Night_Battle#Night_Cut-In_Chance
	 * @see https://en.kancollewiki.net/Combat/Night_Battle#Trigger_Rates
	 * @see https://wikiwiki.jp/kancolle/%E5%A4%9C%E6%88%A6#nightcutin1
	 * @see KC3Fleet.prototype.estimateUsableSearchlight
	 */
	KC3Ship.prototype.nightSpAttackBaseRate = function(spType = 0, currentHp = this.hp[0]) {
		if (this.isDummy()) { return {}; }
		let baseValue = 0;
		// Cap luck on 50
		if (this.lk[0] < 50) {
			baseValue += 15 + this.lk[0];
		} else {
			// Probably rounded down: https://twitter.com/CC_jabberwock/status/1743132570261631237
			baseValue += 15 + 50 + Math.floor(Math.sqrt(this.lk[0] - 50));
		}
		let levelModifier = this.lk[0] < 50 ? 0.75 : 0.8;
		baseValue += levelModifier * Math.sqrt(this.level);
		const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
		const stype = this.master().api_stype;
		// Flagship bonus
		const isFlagship = shipPos === 0;
		if (isFlagship) { baseValue += 15; }
		// Chuuha bonus
		const isChuuhaOrWorse = (currentHp || this.hp[0]) <= (this.hp[1] / 2);
		if (isChuuhaOrWorse) { baseValue += 18; }
		let gearBonus = 0;
		// Ship Personnel bonus simulator:
		// Torpedo Squadron Skilled Lookouts +8 in total if equipped by DD/CL/CLT
		// https://twitter.com/Divinity_123/status/1680201622356389892
		// +0 if equipped by other ship types
		// https://twitter.com/Divinity__123/status/1479343022974324739
		const skilledLookoutsCount = this.countEquipment(129),
			torpedoSquadronSloCount = this.countEquipment(412);
		if (torpedoSquadronSloCount > 0 && [2, 3, 4].includes(stype)) { gearBonus += 8; }
		if (skilledLookoutsCount > 0) { gearBonus += 5; }
		// Searchlight bonus, either small or large
		const fleetSearchlight = fleetNum > 0 && PlayerManager.fleets[fleetNum - 1].estimateUsableSearchlight();
		if (!!fleetSearchlight) { gearBonus += 7; }
		// Enemy searchlight -5, not implemented, rarely used by abyssal
		// Starshell bonus/penalty
		const battleConds = this.collectBattleConditions();
		const playerStarshell = battleConds.playerFlarePos > 0;
		const enemyStarshell = battleConds.enemyFlarePos > 0;
		if (playerStarshell) { gearBonus += 4; }
		if (enemyStarshell) { gearBonus += -10; }
		// Bonuses from equipment overridden for Night Zuiun cutin like enemy gears penalty?
		// https://twitter.com/yukicacoon/status/1635930780735266816
		// https://twitter.com/Divinity_123/status/1680215402020741120
		if (spType === 200) {
			// TSSLO +0 for any ship type, SLO +8 finally
			if (torpedoSquadronSloCount > 0 && [2, 3, 4].includes(stype)) { gearBonus -= 8; }
			if (skilledLookoutsCount > 0) { gearBonus += 3; }
			// searchlight finally -10? or -5?
			if (!!fleetSearchlight) { gearBonus -= (10 + 7); }
			if (playerStarshell) { gearBonus -= (10 + 4); }
		}
		baseValue += gearBonus;
		return {
			baseValue,
			levelModifier,
			isFlagship,
			isChuuhaOrWorse,
			gearBonus,
			fleetSearchlight,
			playerStarshell,
			enemyStarshell
		};
	};

	/**
	 * Calculate Nelson Touch process rate, currently only known in day
	 * @param {boolean} isNight - Nelson Touch has lower modifier at night?
	 * @return {number} special attack rate
	 * @see https://twitter.com/Xe_UCH/status/1181509685863518209
	 */
	KC3Ship.prototype.nelsonTouchRate = function(isNight) {
		if (this.isDummy() || isNight) { return false; }
		const [shipPos, shipCnt, fleetNum] = this.fleetPosition();
		// Nelson Touch prerequisite should be fulfilled before calling this, see also #canDoNelsonTouch
		// here only to ensure fleetObj and combinedShips below not undefined if this invoked unexpectedly
		if (shipPos !== 0 || shipCnt < 6 || !fleetNum) { return false; }
		const fleetObj = PlayerManager.fleets[fleetNum - 1];
		const combinedShips = [2, 4].map(pos => fleetObj.ship(pos));
		const totalRootedLevel = Math.sqrt(this.level) + combinedShips.map(ship => Math.sqrt(ship.level)).sumValues();
		// Cap luck on 50 to avoid misleading people luckmod too much XD
		// Luck from combined ships may get in, but modifier unknown
		const cappedLuck = this.lk[0] < 50 ? this.lk[0] : 50 + Math.sqrt(this.lk[0] - 50);
		return (1.1 * totalRootedLevel + 2.6 * Math.sqrt(cappedLuck) + 16) / 100;
		// old version: https://twitter.com/Xe_UCH/status/1180283907284979713
		//return (0.08 * this.level + 0.04 * combinedShips.map(ship => ship.level).sumValues() + 0.24 * this.lk[0] + 36) / 100;
		// new version: https://twitter.com/Xe_UCH/status/1398930917184270337
		// return (2 * Math.sqrt(this.level) + Math.sqrt(this.lk[0])
		//	+ combinedShips.map(ship => Math.sqrt(ship.level)).sumValues()
		//	+ combinedShips.map(ship => 0.5 * Math.sqrt(ship.lk[0])).sumValues() + 12) / 100;
	};

	/**
	 * Calculate ship day time artillery spotting process rate based on known type factors.
	 * @param {number} atType - based on api_at_type value of artillery spotting type.
	 * @param {string} cutinSubType - sub type of cut-in like CVCI.
	 * @return {number} artillery spotting percentage, false if unable to arty spot or unknown special attack.
	 * @see daySpAttackBaseRate
	 * @see estimateDayAttackType
	 * @see Type factors: https://wikiwiki.jp/kancolle/%E6%88%A6%E9%97%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6#Observation
	 * @see Type factors for multi-angle cutin: https://wikiwiki.jp/kancolle/%E4%BC%8A%E5%8B%A2%E6%94%B9%E4%BA%8C
	 */
	KC3Ship.prototype.artillerySpottingRate = function(atType = 0, cutinSubType = "") {
		// type 1 laser attack has gone forever, ship not on fleet cannot be evaluated
		if (atType < 2 || this.isDummy() || !this.onFleet()) { return false; }
		const formatPercent = num => Math.floor(num * 1000) / 10;
		// Nelson Touch
		if (atType === 100) {
			return formatPercent(this.nelsonTouchRate(false));
		}
		const typeFactor = {
			2: 150,
			3: 120,
			4: 130,
			5: 130,
			6: 140,
			7: ({
				"CutinFDBTB" : 125,
				"CutinDBDBTB": 140,
				"CutinDBTB"  : 155,
			   })[cutinSubType],
			// 100~103 might use different formula, see #nelsonTouchRate
			200: 120,
			201: 130,
			// 300~302, 400~401 unknown
		}[atType];
		if (!typeFactor) { return false; }
		const {baseValue, isFlagship} = this.daySpAttackBaseRate();
		return formatPercent(((Math.floor(baseValue) + (isFlagship ? 15 : 0)) / typeFactor) || 0);
	};

	/**
	 * Calculate ship night battle special attack (cut-in and double attack) process rate based on known type factors.
	 * @param {number} spType - based on api_sp_list value of night special attack type.
	 * @param {string} cutinSubType - sub type of cut-in like CVNCI, submarine cut-in.
	 * @return {number} special attack percentage, false if unable to perform or unknown special attack.
	 * @see nightSpAttackBaseRate
	 * @see estimateNightAttackType
	 * @see Type factors: https://wikiwiki.jp/kancolle/%E5%A4%9C%E6%88%A6#nightcutin1
	 */
	KC3Ship.prototype.nightCutinRate = function(spType = 0, cutinSubType = "") {
		if (spType < 1 || this.isDummy()) { return false; }
		// not sure: DA success rate almost 99%
		if (spType === 1) { return 99; }
		const typeFactor = {
			2: 115,
			3: ({ // submarine late torp cutin
				"CutinLateTorpRadar": 105,
				"CutinLateTorpTorp": 110,
			   })[cutinSubType] || 122, // default CutinTorpTorpTorp
			4: 130,
			5: 140,
			6: ({ // CVNCI factors https://twitter.com/Divinity__123/status/1481091340876369921
				"CutinNFNFNTB": 105,  // 3 planes for mod 1.25
				"CutinNFNTB" : 120,   // 2 planes for mod 1.2
				"CutinNFNDB" : 120,   // 110 or 115?
				"CutinNPx3"  : 130,   // 125?, 3 planes for mod 1.18
			   })[cutinSubType],
			// These DD cutins can be rolled before regular cutin, more chance to be processed
			7: 115,
			8: 140,
			// 125 vs 126 https://twitter.com/CC_jabberwock/status/1752399982169329727
			9: 126,
			10: 122,
			// Doubled hits versions
			11: 115,
			12: 140,
			13: 126,
			14: 122,
			// 100~104 might be different, even with day one
			// same factor for all setups with bonus gears and multi-roll for more chance?
			// https://twitter.com/yukicacoon/status/1628701453677363202
			// https://twitter.com/yukicacoon/status/1630145015644311554
			200: 135,
			// 300~302, 400~401 unknown
		}[spType];
		if (!typeFactor) { return false; }
		const {baseValue} = this.nightSpAttackBaseRate(spType);
		const formatPercent = num => Math.floor(num * 1000) / 10;
		return formatPercent((Math.floor(baseValue) / typeFactor) || 0);
	};

	/**
	 * Calculate ship's Taiha rate when taken an overkill damage.
	 * This is related to the '4n+3 is better than 4n' theory,
	 * '4n+x' only refer to the rounded Taiha HP threshold, rate is also affected by current HP in fact.
	 * @param {number} currentHp - expected current hp value, use ship's real current hp by default.
	 * @param {number} maxHp - expected full hp value, use ship's real max hp by default.
	 * @return {number} Taiha percentage, 100% for already Taiha or red morale or dummy ship.
	 * @see https://wikiwiki.jp/kancolle/%E6%88%A6%E9%97%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6#eb18c7e5
	 */
	KC3Ship.prototype.overkillTaihaRate = function(currentHp = this.hp[0], maxHp = this.hp[1]) {
		if (this.isDummy()) { return 100; }
		const taihaHp = Math.max(1, Math.floor(0.25 * maxHp));
		const battleConds = this.collectBattleConditions();
		// already taiha (should get rid of fasly or negative hp value)
		// or red morale (hit red morale hp will be left fixed 1)
		if (currentHp <= taihaHp || this.moraleEffectLevel([1, 1, 0, 0, 0], battleConds.isOnBattle)) {
			return 100;
		}
		// sum all random cases of taiha
		const taihaCases = Array.numbers(0, currentHp - 1).map(rndint => (
			(currentHp - Math.floor(currentHp * 0.5 + rndint * 0.3)) <= taihaHp ? 1 : 0
		)).sumValues();
		// percentage with 2 decimals
		return Math.round(taihaCases / currentHp * 10000) / 100;
	};

	/**
	 * Get current day shelling attack accuracy related info of this ship.
	 * NOTE: Only attacker accuracy part, not take defender evasion part into account at all, not final hit/critical rate.
	 * @param {number} formationModifier - see #estimateShellingFormationModifier.
	 * @param {boolean} applySpAttackModifiers - if special equipment and attack modifiers should be applied.
	 * @param {number} playerCombinedFleetType - 0=single, 1=CTF, 2=STF, 3=TCF.
	 * @param {boolean} isPlayerMainFleet - if attacker ship is in CF main fleet or escort.
	 * @param {boolean} isEnemyCombined - if defender side is combined fleet.
	 * @param {boolean} isAirAttack - if bonus applied from aircraft proficiency.
	 * @return {Object} accuracy factors of this ship.
	 * @see http://kancolle.wikia.com/wiki/Combat/Accuracy_and_Evasion
	 * @see https://en.kancollewiki.net/Accuracy,_Evasion_and_Criticals
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6
	 * @see https://twitter.com/Nishisonic/status/890202416112480256
	 */
	KC3Ship.prototype.shellingAccuracy = function(formationModifier = 1, applySpAttackModifiers = true,
		playerCombinedFleetType = 0, isPlayerMainFleet = true, isEnemyCombined = false,
		isAirAttack = false) {
		if(this.isDummy()) { return {}; }
		
		const byLevel = 2 * Math.sqrt(this.level);
		// formula from PSVita is sqrt(1.5 * lk) anyway,
		// but verifications have proved this one gets more accurate
		// http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:450#68
		const byLuck = 1.5 * Math.sqrt(this.lk[0]);
		// already taken visible accuracy bonus into account
		// https://twitter.com/noratako5/status/1252194958456483840
		const byEquip = -this.nakedStats("ht");
		const byImprove = this.equipment(true)
			.map(g => g.accStatImprovementBonus("fire"))
			.sumValues();
		const byGunfit = this.shellingGunFitAccuracy();
		const battleConds = this.collectBattleConditions();
		const moraleModifier = this.moraleEffectLevel([1, 0.5, 0.8, 1, 1.2], battleConds.isOnBattle);
		
		// Base accuracy value by fleet types of player & enemy
		// https://docs.google.com/spreadsheets/d/1sABE9Cc-QXTWaiqIdpYt19dFTWKUi0SDAtaWSWyyAXg/htmlview
		const byFleetType = (({
			"0" : [90, 80], // single
			"1M": [78, 78], // CTF floor(90*0.875)
			"1E": [45, 67], // CTF 90*0.5, 90*0.75
			"2M": [45, 78], // STF
			"2E": [67, 67], // STF 90*0.75
			"3M": [54, 54], // TCF 90*0.6
			"3E": [45, 67], // TCF
		})[playerCombinedFleetType > 0 ? [playerCombinedFleetType, (isPlayerMainFleet ? "M" : "E")].join("") : 0] || [])
			[isEnemyCombined & 1] || 90;
		const combinedFleetPenalty = 90 - byFleetType;
		// penalty for stype: DE, https://twitter.com/Xe_UCH/status/1452576231115743232
		const byStype = [1].includes(this.master().api_stype) ? -13 : 0;
		
		const basic = byFleetType + byStype + byLevel + byLuck + byEquip + byImprove;
		const beforeSpModifier = basic * formationModifier * moraleModifier + byGunfit;
		
		let artillerySpottingModifier = 1;
		// there is trigger chance rate for Artillery Spotting itself, see #artillerySpottingRate
		if(applySpAttackModifiers) {
			artillerySpottingModifier = (type => {
				if(type[0] === "Cutin") {
					return ({
						// IDs from `api_hougeki.api_at_type`, see #specialAttackTypeDay
						"2": 1.1, "3": 1.3, "4": 1.5, "5": 1.3, "6": 1.2,
						// modifier for 7 (CVCI) unknown, roughly ranged in 1.2~1.3
						"7": 1.2,
						// modifiers for [100, 401] (special cutins) still unknown
						"200": 1.2, "201": 1.2,
					})[type[1]] || 1;
				}
				return 1;
			})(this.estimateDayAttackType(undefined, true, battleConds.airBattleId));
		}
		
		// Accuracy postcap (96) bonus from aircraft proficiency (also used by critical rate), from Vita `BattleLogicBase,cs#setCliticalAlv`
		// see also: https://wikiwiki.jp/kancolle/%E5%91%BD%E4%B8%AD%E3%81%A8%E5%9B%9E%E9%81%BF%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6#airSkill
		const aircraftProficiencyBonus = (() => {
			if(isAirAttack) {
				const getAverageProficiencyAccuracyBonus = (allowedSlotType) => {
					let profBonus = 0, expSum = 0, expCnt = 0;
					let criticalBonus = 0;
					this.equipment().forEach((g, i) => {
						if(this.slots[i] > 0 && g.exists()
							&& allowedSlotType.includes(g.master().api_type[2])) {
							const aceLevel = g.ace || 0;
							const internalExpHigh = KC3Meta.airPowerInternalExpBounds(aceLevel)[1];
							expSum += internalExpHigh;
							expCnt += 1;
							criticalBonus += (internalExpHigh >= 70 ? 8 : 10) * (i > 0 ? 0.6 : 0.8);
						}
					});
					const avgExp = expCnt > 0 ? Math.floor(expSum / expCnt) : 0;
					if(avgExp >= 10) profBonus += Math.floor(Math.sqrt(avgExp * 0.1));
					if(avgExp >= 25) profBonus += 1;
					if(avgExp >= 40) profBonus += 1;
					if(avgExp >= 55) profBonus += 1;
					if(avgExp >= 70) profBonus += 1;
					if(avgExp >= 80) profBonus += 2;
					if(avgExp >= 100) profBonus += 3;
					// critical bonus only used by critical rolling?
					return [profBonus, Math.floor(criticalBonus)];
				};
				return getAverageProficiencyAccuracyBonus([7, 8, 11, 41])[0];
			}
			return 0;
		})();
		
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
		
		const accuracy = Math.floor(beforeSpModifier * artillerySpottingModifier * apShellModifier);
		return {
			accuracy,
			basicAccuracy: basic,
			preSpAttackAccuracy: beforeSpModifier,
			equipmentStats: byEquip,
			equipImprovement: byImprove,
			equipGunFit: byGunfit,
			combinedFleetPenalty,
			moraleModifier,
			formationModifier,
			artillerySpottingModifier,
			aircraftProficiencyBonus,
			apShellModifier
		};
	};

	KC3Ship.prototype.antiSubWarfareAccuracy = function(formationModifier = 1, isPvP = false) {
		if(this.isDummy()) { return {}; }
		const byLevel = 2 * Math.sqrt(this.level);
		const byLuck = 1.5 * Math.sqrt(this.lk[0]);
		// only counted from small sonar's asw, acc not used
		const byEquip = 2 * this.equipmentTotalStats("tais", true, true, false, [14]);
		const byImprove = this.equipment(true)
			.map(g => g.accStatImprovementBonus("asw"))
			.sumValues();
		const battleConds = this.collectBattleConditions();
		const moraleModifier = this.moraleEffectLevel([1, 0.5, 0.8, 1, 1.2], battleConds.isOnBattle);
		const pvpModifier = isPvP ? 1.5 : 1;
		const byFleetType = 80;
		const basic = byFleetType + byLevel + byLuck + byEquip + byImprove;
		const accuracy = Math.floor(basic * formationModifier * moraleModifier * pvpModifier);
		return {
			accuracy,
			basicAccuracy: basic,
			equipmentStats: byEquip,
			equipImprovement: byImprove,
			moraleModifier,
			formationModifier,
			pvpModifier
		};
	};

	/**
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6#hitterm1
	 * @see http://wikiwiki.jp/kancolle/?%CC%BF%C3%E6%A4%C8%B2%F3%C8%F2%A4%CB%A4%C4%A4%A4%A4%C6#avoidterm1
	 */
	KC3Ship.prototype.estimateShellingFormationModifier = function(
			playerFormationId = ConfigManager.aaFormation,
			enemyFormationId = 0,
			type = "accuracy",
			isAntisubWarfare = false) {
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
						modifier = isGuardian ?
							(isAntisubWarfare ? 1.1 : 1.2) :
							(isAntisubWarfare ? 1.0 : 0.8);
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
					case 4: // Echelon
						// enhanced by Double Line / Echelon?
						// mods: https://twitter.com/Xe_UCH/status/1304783506275409920
						modifier = enemyFormationId === 2 ? 1.45 : 1.4;
						break;
					case 5: // Line Abreast, enhanced by Echelon / Line Abreast unknown
						modifier = 1.3;
						break;
					case 6: // Vanguard, depends on fleet position and ship type
						// but it seems be postcap bonus of hit rate instead of a multiplier, see #shellingEvasion
						modifier = 1.0;
						break;
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
	KC3Ship.prototype.shellingGunFitAccuracy = function(time = "Day") {
		if(this.isDummy()) { return 0; }
		var result = 0;
		// Fit bonus or overweight penalty for ship types:
		const stype = this.master().api_stype;
		const ctype = this.master().api_ctype;
		switch(stype) {
			case 2: // for Destroyers
				// fit bonus under verification since 2017-06-23
				// for Kamikaze class devs mentioned still unknown
				// by ship class
				switch(ctype) {
					case 28: // Mutsuki class
						// 12.7cm Single High-angle Gun Mount (Late Model)
						// 12cm Single Gun Mount Kai Ni
						result += 5 * Math.sqrt(this.countEquipment([229, 293]));
						break;
					// Guns for USN ships, sonars for RN ships:
					// https://twitter.com/Divinity__123/status/1529359629574189057
					case 81: // Tashkent class
						// 130mm B-13 Twin Gun Mount
						result += 5 * Math.sqrt(this.countEquipment(282));
						break;
					case 87: // John C.Butler class
						// 5inch Single Gun Mount Mk.30 Kai+
						result += 4 * Math.sqrt(this.countEquipment([308, 313]));
						break;
					case 91: // Fletcher class
						// 5inch Single Gun Mount Mk.30 variants
						result += 4 * Math.sqrt(this.countEquipment([284, 308, 313]));
						result += this.countEquipment(284) >= 2 ? 4 : 0;
						break;
					case 82: // J class
						// Type1NN ASDIC variants
						result += 3 * Math.sqrt(this.countEquipment([260, 261, 262]));
						// QF 4.7inch Gun Mk.XII Kai
						result += 3 * Math.sqrt(this.countEquipment(280));
						break;
				}
				// for Verniy, the same with Tashkent
				if(this.masterId === 147) {
					result += 5 * Math.sqrt(this.countEquipment(282));
				}
				break;
			case 3:
			case 4:
			case 21: // for Light Cruisers
				// overhaul implemented in-game since 2017-06-23, not fully verified
				// https://twitter.com/Divinity__123/status/1530469810450190336
				
				// 14cm, 15.2cm single/twin/triple
				const singleMountIds = [4, 11];
				const twinMountIds = [65, 119, 139];
				// these gun added to firepower bonus, but not sure if got accuracy either
				const twinMountIds2 = [303, 310, 359, 360, 361, 407];
				const tripleMainMountIds = [5, 235];
				const singleHighAngleMountId = 229;
				const isAganoClass = ctype === 41;
				const isOoyodoClass = ctype === 52;
				result = 0; // only fit bonus part (fixed -2 disappeared?)
				// for all CLs
				result += 4 * Math.sqrt(this.countEquipment(singleMountIds));
				// for twin mount on Agano class / Ooyodo class / general CLs
				result += (isAganoClass ? 8 : isOoyodoClass ? 5 : 3) *
					Math.sqrt(this.countEquipment(twinMountIds));
				// insufficient data for later twin mount,
				// 15.2cm K2 on Agano class for now
				// https://twitter.com/skm_00/status/1388479099094536197
				result += (isAganoClass ? 7 : 0) *
					Math.sqrt(this.countEquipment(twinMountIds2));
				// for 15.5cm triple main mount on Ooyodo class
				result += (isOoyodoClass ? 7 : 0) *
					Math.sqrt(this.countEquipment(tripleMainMountIds));
				// for 12.7cm single HA late model on Yura K2
				result += (this.masterId === 488 ? 10 : 0) *
					Math.sqrt(this.countEquipment(singleHighAngleMountId));
				// to be confirmed for penalties:
				// https://twitter.com/yukicacoon/status/1388489455292485632
				// for 8inch triple gun mount Mk.9 variants on Agano-class, -25/2?
				//   on Yuubari/CLT, -10? / -20/2?
				// for 203mm/53 twin gun mount on CL, -3*n?
				//   on Agano-class -4*n?
				// for 152mm/55 triple rapid fire on CL, -2*n?
				break;
			case 5:
			case 6: // for Heavy Cruisers
				// fit bonus at night battle for 20.3cm variants
				if(time === "Night") {
					const has203TwinGun = this.hasEquipment(6);
					const has203No3TwinGun = this.hasEquipment(50);
					const has203No2TwinGun = this.hasEquipment(90);
					// 20.3cm priority to No.3, No.2 might also
					result += has203TwinGun ? 10 : has203No2TwinGun ? 15 : has203No3TwinGun ? 15 : 0;
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
					let value = fit[1][time.toCamelCase()] || 0;
					if(this.isMarried()) value *= fit[1].married || 1;
					result += value * Math.sqrt(count);
				});
				// Yet another tests and formulas here, feel free to implement this version
				// https://twitter.com/Divinity_123/status/1637255766166863873
				break;
			case 16: // for Seaplane Tender
				// Medium cal. main guns penalties on Nisshin, Commandant Teste, Kamoi Kai
				// https://docs.google.com/spreadsheets/d/1HR1sZdWCFEWXD5bJ851dsIwvEt1mHcAvn21VwdTBLdQ/htmlview
				// Secondary guns no penalty
				const isTargetAv = [581, 690, 586, 491, 372, 499].includes(this.masterId);
				if(isTargetAv) {
					// Can't clarify all guns belong to which category exactly via tweets and spreadsheets,
					// and newly implemented guns may not verified
					// eg: [303] Bofors 15.2cm, [407] 15.2cm Twin Kai2, [518] 14cm Twin Kai2
					const count14cm15cmMainGunVars = this.countEquipment([4, 119, 310, 11, 65, 139, 247]);
					result -= 6 * count14cm15cmMainGunVars;
					// also includes: Italian 203mm/53, 152mm/55 rapid fire
					const count203MainGunVars = this.countEquipment([6, 50, 90, 162, 340, 341]);
					result -= 10 * count203MainGunVars;
					if(count203MainGunVars) {
						// two categories not mixed, extra -8
						result -= count14cm15cmMainGunVars ? 0 : 8;
					}
				}
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
		const stype = this.master().api_stype,
			isThisDestroyer = stype === 2;
		// Heavy Cruiser class bonus
		const stypeBonus = [5, 6].includes(stype) ? 5 : 0;
		// SLO+Radar on destroyers bonus
		const skilledLookoutBonus = (isThisDestroyer && this.hasEquipmentType(2, 39) && this.hasEquipmentType(2, [12, 13])) ? 10 : 0;
		const searchlightModifier = this.hasEquipmentType(1, 18) ? 0.2 : 1;
		const postCapForYasen = Math.floor(postCap + stypeBonus + skilledLookoutBonus) * searchlightModifier;
		const fuelPercent = Math.floor(this.fuel / this.master().api_fuel_max * 100);
		const fuelPenalty = fuelPercent < 75 ? 75 - fuelPercent : 0;
		// final hit % = ucap(floor(lcap(attackerAccuracy - defenderEvasion) * defenderMoraleModifier)) + aircraftProficiencyBonus
		// capping limits its lower / upper bounds to [10, 96] + 1%, +1 since random number is 0-based, ranged in [0, 99]
		// ship morale modifier not applied here since 'evasion' may be looked reduced when sparkle
		const battleConds = this.collectBattleConditions();
		const moraleModifier = this.moraleEffectLevel([1, 1.4, 1.2, 1, 0.7], battleConds.isOnBattle);
		const playerFormationId = battleConds.formationId || ConfigManager.aaFormation;
		// Vanguard formation final hit rate bonus https://wikiwiki.jp/kancolle/%E5%91%BD%E4%B8%AD%E3%81%A8%E5%9B%9E%E9%81%BF%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6#vigilance
		// But another tests think it's still modifier, applied before accuracy formation modifier: https://twitter.com/Divinity_123/status/1566375782703931394
		const vanguardBonus = (() => {
			if(playerFormationId === 6) {
				const [shipPos, shipCnt] = this.fleetPosition();
				const bonusByPos = isThisDestroyer ?
					[7, 7, 20, 20, 35, 40, 40] :
					[7, 7, 7,  7,  15, 20, 20];
				return bonusByPos[shipPos] || 0;
			}
			return 0;
		})();
		const evasion = Math.floor(postCap + byImprove + vanguardBonus - fuelPenalty);
		const evasionForYasen = Math.floor(postCapForYasen + byImprove + vanguardBonus - fuelPenalty);
		return {
			evasion,
			evasionForYasen,
			preCap,
			postCap,
			postCapForYasen,
			equipmentStats: byEquip,
			equipImprovement: byImprove,
			vanguardBonus,
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
	 *   NOTE: type ID shifted to 1-based since Phase 2, but internal values here unchanged.
	 * @see `TaskAircraftFlightBase.prototype._getAntiAircraftAbility`
	 * @see `TaskAirWarAntiAircraft._type` - AA attack animation types
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
			case -1: return [0, "None"];
			case 0: return [1, "Normal"];
			case 1: return [2, "HighAngleMount"];
			case 2: return [3, "RocketLauncher"];
			case 3: return [4, "RocketLauncherK2"];
			case 4: return [5, "Type3Shell"];
			case 5: return [6, "Type3ShellRockeLaunK2"];
			default: return [NaN, "Unknown"];
		}
	};

	/**
	 * To calculate 12cm 30tube Rocket Launcher Kai Ni (Rosa K2) trigger chance (for now),
	 * we need adjusted AA of ship, number of Rosa K2, ctype and luck stat.
	 * @see https://twitter.com/noratako5/status/1062027534026428416 - luck modifier
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
		// 48, irrelevant to improvement stars
		const rosaAdjustedAntiAir = KC3Gear.aaDefense(KC3Master.slotitem(274), 0, false);
		// 70 for Ise-class, 0 otherwise
		const classBonus = this.master().api_ctype === 2 ? 70 : 0;
		// Rounding to x%
		return Math.qckInt("floor",
			(this.adjustedAntiAir() + this.lk[0] * 0.9) /
				(400 - (rosaAdjustedAntiAir + 30 + 40 * rosaCount + classBonus)) * 100,
			0);
	};

	/**
	 * Check known possible effects on equipment changed.
	 * @param {Object} newGearObj - the equipment just equipped, pseudo empty object if unequipped.
	 * @param {Object} oldGearObj - the equipment before changed, pseudo empty object if there was empty.
	 * @param {Object} oldShipObj - the cloned old ship instance with stats and item IDs before equipment changed.
	 * @param {Object} recheckNewShip - flag to notify later event: latest ship object needs to be retrieved and reinvoked this.
	 */
	KC3Ship.prototype.equipmentChangedEffects = function(newGearObj = {}, oldGearObj = {}, oldShipObj = this, recheckNewShip = false) {
		if(!this.masterId) return {isShow: false};
		const gunFit = newGearObj.masterId ? KC3Meta.gunfit(this.masterId, newGearObj.masterId) : false;
		let isShow = gunFit !== false;
		const shipAacis = AntiAir.sortedPossibleAaciList(AntiAir.shipPossibleAACIs(this));
		isShow = isShow || shipAacis.length > 0;
		// NOTE: shipObj here to be returned will be the 'old' ship instance,
		// whose stats, like fp, tp, asw, are the values before equipment change.
		// but its items array (including ex item) are post-change values.
		// When `recheckNewShip` is a ship object, it means shipObj is already the latest rechecked one.
		const shipObj = this;
		// To get the 'latest' ship stats, should defer `GunFit` event after `api_get_member/ship3` call,
		// and retrieve latest ship instance via KC3ShipManager.get method like this:
		//   const newShipObj = KC3ShipManager.get(data.shipObj.rosterId);
		// It can not be latest ship at the timing of this equipmentChangedEffects invoked,
		// because the api call above not executed, KC3ShipManager data not updated yet.
		// Pass true to `recheckNewShip` will tell event handler to do so later.
		// Or you can compute the simple stat difference manually like this:
		const oldEquipAsw = oldGearObj.masterId > 0 ? oldGearObj.master().api_tais : 0;
		const newEquipAsw = newGearObj.masterId > 0 ? newGearObj.master().api_tais : 0;
		const aswDiff = recheckNewShip === shipObj ? 0 :
			newEquipAsw - oldEquipAsw
			// explicit asw bonus from new equipment
			+ shipObj.equipmentTotalStats("tais", true, true, true)
			// explicit asw bonus from old equipment
			- oldShipObj.equipmentTotalStats("tais", true, true, true);
		const oaswPower = shipObj.canDoOASW(aswDiff) ? shipObj.antiSubWarfarePower(aswDiff) : false;
		isShow = isShow || (oaswPower !== false);
		const antiLandPowers = shipObj.shipPossibleAntiLandPowers();
		isShow = isShow || antiLandPowers.length > 0;
		const equipBonus = shipObj.equipmentBonusGearAndStats(newGearObj);
		isShow = isShow || (equipBonus !== false && equipBonus.isShow);
		// Possible TODO:
		// can opening torpedo
		// can cut-in (fire / air)
		// can night attack for CV
		// can night cut-in
		return {
			isShow,
			shipObj,
			shipOld: oldShipObj,
			isShipObjInvalid: recheckNewShip,
			gearObj: newGearObj.masterId ? newGearObj : false,
			oldGearObj,
			gunFit,
			shipAacis,
			oaswPower,
			aswDiff,
			antiLandPowers: antiLandPowers.length > 0,
			equipBonus,
		};
	};

	/* Expedition Supply Change Check */
	KC3Ship.prototype.perform = function(command,args) {
		try {
			args = $.extend({noFuel:0,noAmmo:0},args);
			command = command.slice(0,1).toUpperCase() + command.slice(1).toLowerCase();
			this["perform"+command].call(this,args);
			return true;
		} catch (e) {
			console.error("Failed when perform" + command, e);
			return false;
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
		if(!shipObj || shipObj.isDummy()) return tooltipBox;
		//const shipDb = WhoCallsTheFleetDb.getShipStat(shipObj.masterId);
		const [nakedStats, bonusStats] = shipObj.nakedStats(undefined, true),
			  maxedStats = shipObj.maxedStats(),
			  maxDiffStats = {},
			  equipDiffStats = {},
			  modLeftStats = shipObj.modernizeLeftStats();
		Object.keys(maxedStats).map(s => {maxDiffStats[s] = maxedStats[s] - nakedStats[s];});
		Object.keys(nakedStats).map(s => {equipDiffStats[s] = nakedStats[s] - (shipObj[s]||[0])[0];});
		const spEffectStats = shipObj.statsSp();
		const signedNumber = n => (n > 0 ? '+' : n === 0 ? '\u00b1' : '') + n;
		const optionalNumber = (n, pre = '\u21d1', show0 = false) => !n && (!show0 || n !== 0) ? '' : pre + n;
		const replaceFilename = (file, newName) => file.slice(0, file.lastIndexOf("/") + 1) + newName;
		$(".stat_value span", tooltipBox).css("display", "inline");
		$(".ship_full_name .ship_masterId", tooltipBox).text("[{0}]".format(shipObj.masterId));
		$(".ship_full_name span.value", tooltipBox).text(shipObj.name());
		$(".ship_full_name .ship_yomi", tooltipBox).text(ConfigManager.info_ship_class_name ?
			shipObj.ctype() :
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
		$(".stat_fp .equip", tooltipBox)
			.text("({0}{1})".format(nakedStats.fp, optionalNumber(bonusStats.fp)))
			.toggle(!!equipDiffStats.fp || !!bonusStats.fp);
		$(".stat_fp .sp", tooltipBox).text(signedNumber(spEffectStats.fp))
			.toggle(!!spEffectStats.fp);
		$(".stat_ar .current", tooltipBox).text(shipObj.ar[0]);
		$(".stat_ar .mod", tooltipBox).text(signedNumber(modLeftStats.ar))
			.toggle(!!modLeftStats.ar);
		$(".stat_ar .equip", tooltipBox)
			.text("({0}{1})".format(nakedStats.ar, optionalNumber(bonusStats.ar)))
			.toggle(!!equipDiffStats.ar || !!bonusStats.ar);
		$(".stat_ar .sp", tooltipBox).text(signedNumber(spEffectStats.ar))
			.toggle(!!spEffectStats.ar);
		$(".stat_tp .current", tooltipBox).text(shipObj.tp[0]);
		$(".stat_tp .mod", tooltipBox).text(signedNumber(modLeftStats.tp))
			.toggle(!!modLeftStats.tp);
		$(".stat_tp .equip", tooltipBox)
			.text("({0}{1})".format(nakedStats.tp, optionalNumber(bonusStats.tp)))
			.toggle(!!equipDiffStats.tp || !!bonusStats.tp);
		$(".stat_tp .sp", tooltipBox).text(signedNumber(spEffectStats.tp))
			.toggle(!!spEffectStats.tp);
		$(".stat_ev .current", tooltipBox).text(shipObj.ev[0]);
		$(".stat_ev .level", tooltipBox).text(signedNumber(maxDiffStats.ev))
			.toggle(!!maxDiffStats.ev);
		$(".stat_ev .equip", tooltipBox)
			.text("({0}{1})".format(nakedStats.ev, optionalNumber(bonusStats.ev)))
			.toggle(!!equipDiffStats.ev || !!bonusStats.ev);
		$(".stat_ev .sp", tooltipBox).text(signedNumber(spEffectStats.ev))
			.toggle(!!spEffectStats.ev);
		$(".stat_aa .current", tooltipBox).text(shipObj.aa[0]);
		$(".stat_aa .mod", tooltipBox).text(signedNumber(modLeftStats.aa))
			.toggle(!!modLeftStats.aa);
		$(".stat_aa .equip", tooltipBox)
			.text("({0}{1})".format(nakedStats.aa, optionalNumber(bonusStats.aa)))
			.toggle(!!equipDiffStats.aa || !!bonusStats.aa);
		$(".stat_ac .current", tooltipBox).text(shipObj.carrySlots());
		const canOasw = shipObj.canDoOASW();
		$(".stat_as .current", tooltipBox).text(shipObj.as[0])
			.toggleClass("oasw", canOasw);
		$(".stat_as .level", tooltipBox).text(signedNumber(maxDiffStats.as))
			.toggle(!!maxDiffStats.as);
		$(".stat_as .equip", tooltipBox)
			.text("({0}{1})".format(nakedStats.as, optionalNumber(bonusStats.as)))
			.toggle(!!equipDiffStats.as || !!bonusStats.as);
		$(".stat_as .mod", tooltipBox).text(signedNumber(modLeftStats.as))
			.toggle(!!modLeftStats.as);
		$(".stat_sp", tooltipBox).text(shipObj.speedName())
			.addClass(KC3Meta.shipSpeed(shipObj.speed, true));
		$(".stat_ls .current", tooltipBox).text(shipObj.ls[0]);
		$(".stat_ls .level", tooltipBox).text(signedNumber(maxDiffStats.ls))
			.toggle(!!maxDiffStats.ls);
		$(".stat_ls .equip", tooltipBox)
			.text("({0}{1})".format(nakedStats.ls, optionalNumber(bonusStats.ls)))
			.toggle(!!equipDiffStats.ls || !!bonusStats.ls);
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
		const optionalModifier = (m, showX1) => (showX1 || m !== 1 ? 'x' + m : '');
		const floorToDecimal = (v, d) => (Math.qckInt("floor", v, d));
		// show possible critical power and mark capped power with different color
		const joinPowerAndCritical = (p, cp, cap) => (cap ? '<span class="power_capped">{0}</span>' : "{0}")
			.format(String(floorToDecimal(p, 0))) + (!cp ? "" :
				(cap ? '(<span class="power_capped">{0}</span>)' : "({0})")
					.format(floorToDecimal(cp, 0))
			);
		const shipMst = shipObj.master();
		const onFleetNum = shipObj.onFleet();
		const battleConds = shipObj.collectBattleConditions();
		const attackTypeDay = shipObj.estimateDayAttackType();
		const warfareTypeDay = {
			"Torpedo"       : "Torpedo",
			"DepthCharge"   : "Antisub",
			"LandingAttack" : "AntiLand",
			"Rocket"        : "AntiLand"
			}[attackTypeDay[0]] || "Shelling";
		const isAirAttackDay = attackTypeDay[0] === "AirAttack";
		const canAsw = shipObj.canDoASW();
		if(canAsw){
			const aswAttackType = shipObj.estimateDayAttackType(1530, false);
			let power = shipObj.antiSubWarfarePower();
			let criticalPower = false;
			let isCapped = false;
			const canShellingAttack = shipObj.canDoDayShellingAttack();
			const canOpeningTorp = shipObj.canDoOpeningTorpedo();
			const canClosingTorp = shipObj.canDoClosingTorpedo();
			if(ConfigManager.powerCapApplyLevel >= 1) {
				({power} = shipObj.applyPrecapModifiers(power, "Antisub",
					battleConds.engagementId, battleConds.formationId || ConfigManager.aaFormation));
			}
			if(ConfigManager.powerCapApplyLevel >= 2) {
				({power, isCapped} = shipObj.applyPowerCap(power, "Day", "Antisub"));
			}
			if(ConfigManager.powerCapApplyLevel >= 3) {
				if(ConfigManager.powerCritical) {
					criticalPower = shipObj.applyPostcapModifiers(
						power, "Antisub", undefined, undefined,
						true, aswAttackType[0] === "AirAttack",
						// To show critical power without proficiency modifier if OASW:
						//13, false, 0, canOasw
						13, false, 0, false
					).power;
				}
				({power} = shipObj.applyPostcapModifiers(power, "Antisub"));
			}
			let attackTypeIndicators = !canShellingAttack || !canAsw ?
				KC3Meta.term("ShipAttackTypeNone") :
				KC3Meta.term("ShipAttackType" + aswAttackType[0]);
			if(canOpeningTorp) attackTypeIndicators += ", {0}"
				.format(KC3Meta.term("ShipExtraPhaseOpeningTorpedo"));
			if(canClosingTorp) attackTypeIndicators += ", {0}"
				.format(KC3Meta.term("ShipExtraPhaseClosingTorpedo"));
			$(".dayAswPower", tooltipBox).html(
				KC3Meta.term("ShipDayAttack").format(
					KC3Meta.term("ShipWarfareAntisub"),
					joinPowerAndCritical(power, criticalPower, isCapped),
					attackTypeIndicators
				)
			);
		} else {
			$(".dayAswPower", tooltipBox).html("-");
		}
		const isAswPowerShown = canAsw && (canOasw && !shipObj.isOaswShip()
			|| shipObj.onlyHasEquipmentType(1, [10, 15, 16, 32], false));
		// Show ASW power if Opening ASW conditions met, or only ASW equipment equipped (ignoring exslot)
		if(isAswPowerShown){
			$(".dayAttack", tooltipBox).parent().parent().hide();
		} else {
			$(".dayAswPower", tooltipBox).parent().parent().hide();
		}
		
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
		const dayCutinRate = shipObj.artillerySpottingRate(spAttackType[1], spAttackType[2]);
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
				KC3Meta.cutinTypeDay(spAttackType[1])
					+ (spAttackType[3] > 1 ? " x{0}".format(floorToDecimal(spAttackType[3], 2)) : "")
					+ (dayCutinRate ? " {0}%".format(dayCutinRate) : "") :
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
		
		const attackTypeNight = shipObj.estimateNightAttackType();
		const canNightAttack = shipObj.canDoNightAttack();
		// See functions in previous 2 lines, ships whose night attack is AirAttack,
		// but power formula seems be shelling: Taiyou Kai Ni, Unyou Kai Ni, Shinyou Kai Ni
		const hasYasenPower = (shipMst.api_houg || [])[0] + (shipMst.api_raig || [])[0] > 0;
		const hasNightFlag = attackTypeNight[0] === "AirAttack" && attackTypeNight[2] === true;
		const warfareTypeNight = {
			"Torpedo"       : "Torpedo",
			"DepthCharge"   : "Antisub",
			"LandingAttack" : "AntiLand",
			"Rocket"        : "AntiLand"
			}[attackTypeNight[0]] || "Shelling";
		if(attackTypeNight[0] === "AirAttack" && canNightAttack && (hasNightFlag || !hasYasenPower)){
			let power = shipObj.nightAirAttackPower(battleConds.contactPlaneId);
			let criticalPower = false;
			let isCapped = false;
			const spAttackType = shipObj.estimateNightAttackType(undefined, true);
			const nightCutinRate = shipObj.nightCutinRate(spAttackType[1], spAttackType[2]);
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
						KC3Meta.cutinTypeNight(spAttackType[1])
							+ (spAttackType[3] > 1 ? " x{0}".format(floorToDecimal(spAttackType[3], 2)) : "")
							+ (nightCutinRate ? " {0}%".format(nightCutinRate) : "") :
						KC3Meta.term("ShipAttackType" + spAttackType[0])
				)
			);
		} else {
			let power = shipObj.nightBattlePower(battleConds.contactPlaneId);
			let criticalPower = false;
			let isCapped = false;
			const spAttackType = shipObj.estimateNightAttackType(undefined, true);
			const nightCutinRate = shipObj.nightCutinRate(spAttackType[1], spAttackType[2]);
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
						power, warfareTypeNight, [], undefined, true).power;
				}
				({power} = shipObj.applyPostcapModifiers(power, warfareTypeNight, []));
			}
			const originCutinType = KC3Ship.specialAttackTypeNight(spAttackType[1]);
			let attackTypeIndicators = !canNightAttack ? KC3Meta.term("ShipAttackTypeNone") :
				spAttackType[0] === "Cutin" ?
					KC3Meta.cutinTypeNight(spAttackType[1])
						+ (spAttackType[2] !== originCutinType[2] ? " /{0}".format(KC3Meta.term(spAttackType[2])) : "")
						+ (spAttackType[3] > 1 ? " x{0}".format(floorToDecimal(spAttackType[3], 2)) : "")
						+ (nightCutinRate ? " {0}%".format(nightCutinRate) : "")
					: KC3Meta.term("ShipAttackType" + spAttackType[0]);
			$(".nightAttack", tooltipBox).html(
				KC3Meta.term("ShipNightAttack").format(
					KC3Meta.term("ShipWarfare" + warfareTypeNight),
					joinPowerAndCritical(power, criticalPower, isCapped),
					attackTypeIndicators
				)
			);
		}
		// Only day shelling part here
		const accuracyInfo = shipObj.shellingAccuracy(
			shipObj.estimateShellingFormationModifier(battleConds.formationId, battleConds.enemyFormationId, "accuracy", false),
			true,
			onFleetNum <= 2 ? battleConds.playerCombinedFleetType : 0,
			onFleetNum === 1,
			battleConds.isEnemyCombined,
			isAirAttackDay
		);
		// Append other types of accuracy
		if(canAsw) {
			accuracyInfo.asw = shipObj.antiSubWarfareAccuracy(
				shipObj.estimateShellingFormationModifier(battleConds.formationId, battleConds.enemyFormationId, "accuracy", true),
				KC3SortieManager.isPvP()
			);
		}
		$(".shellingAccuracy", tooltipBox).text([
			KC3Meta.term("ShipAccShelling").format(
				floorToDecimal(accuracyInfo.accuracy, 1),
				signedNumber(accuracyInfo.equipmentStats),
				signedNumber(floorToDecimal(accuracyInfo.equipImprovement, 1)),
				signedNumber(floorToDecimal(accuracyInfo.equipGunFit, 1)),
				optionalModifier(accuracyInfo.moraleModifier, true),
				optionalModifier(accuracyInfo.artillerySpottingModifier),
				optionalModifier(accuracyInfo.apShellModifier),
				(isAirAttackDay ? signedNumber(accuracyInfo.aircraftProficiencyBonus) : "")
			),
			!canAsw ? "" : KC3Meta.term("ShipAccAntisub").format(
				floorToDecimal(accuracyInfo.asw.accuracy, 1)
			)
		].filter(v => !!v).join(" / "));
		const shellingEvasion = shipObj.shellingEvasion(
			shipObj.estimateShellingFormationModifier(battleConds.formationId, battleConds.enemyFormationId, "evasion", false)
		);
		$(".shellingEvasion", tooltipBox).text(
			KC3Meta.term("ShipEvaShelling").format(
				floorToDecimal(shellingEvasion.evasion, 1),
				signedNumber(shellingEvasion.equipmentStats),
				signedNumber(floorToDecimal(shellingEvasion.equipImprovement, 1)),
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
					aaEffectTypeId > 0 ?
						" ({0})".format(
							[4, 6].includes(aaEffectTypeId) ?
								// Show a trigger chance for RosaK2 AA Rocket Barrage, extra effect still unknown if with Type3 Shell
								"{0}:{1}%".format(KC3Meta.term("ShipAAEffect" + aaEffectTypeTerm), shipObj.calcAntiAirEffectChance()) :
								KC3Meta.term("ShipAAEffect" + aaEffectTypeTerm)
						) : ""
				)
			)
		);
		$(".propShotdownRate", tooltipBox).text(
				KC3Meta.term("ShipAAShotdownRate").format(
					floorToDecimal(shipObj.proportionalShotdownRate() * 100, 1)
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
		// show day shelling power instead of ASW power (if any) on holding Alt key
		if(event.altKey && $(".dayAswPower", ui.tooltip).is(":visible")) {
			$(".dayAswPower", ui.tooltip).parent().parent().hide();
			$(".dayAttack", ui.tooltip).parent().parent().show();
		}
		// show day ASW power instead of shelling power if can ASW on holding Ctrl/Meta key
		if((event.ctrlKey || event.metaKey) && !$(".dayAswPower", ui.tooltip).is(":visible")
			&& $(".dayAswPower", ui.tooltip).text() !== "-") {
			$(".dayAswPower", ui.tooltip).parent().parent().show();
			$(".dayAttack", ui.tooltip).parent().parent().hide();
		}
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

	KC3Ship.prototype.deckbuilder = function(forImgBuilder) {
		var itemsInfo = {};
		var result = {
			id: this.masterId,
			lv: this.level,
			luck: this.lk[0],
			hp: this.hp[0],
			asw : this.nakedAsw(),
			items: itemsInfo
		};
		if(!!forImgBuilder) {
			result.fp = this.fp[0];
			result.tp = this.tp[0];
			result.aa = this.aa[0];
			result.ar = this.ar[0];
			result.asw = this.as[0];
			result.ev = this.ev[0];
			result.los = this.ls[0];
			// unused yet
			result.spd = this.speed;
			result.len = this.range;
			result.effect = this.statsSp();
		}

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
			var usedSlot = Object.size(itemsInfo);
			if(usedSlot < 5) {
				itemsInfo["i".concat(usedSlot+1)] = gearInfo;
			} else {
				itemsInfo.ix = gearInfo;
			}
		}
		
		return result;
	};

})();
