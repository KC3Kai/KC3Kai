/* Ship.js
KC3改 Ship Object
*/
(function(){
	"use strict";

	var
		deferList = {};

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
		var self = this;
		switch(typeof slot) {
			case 'number':
			case 'string':
				/* Number/String => converted as equipment slot key */
				return self.getGearManager().get( slot>=this.items.length ? this.ex_item : this.items[slot] );
			case 'boolean':
				/* Boolean => return all equipments with ex item if true */
				return slot ? this.equipment().concat(this.exItem())
					: this.equipment();
			case 'undefined':
				/* Undefined => returns whole equipment as equip object */
				return Array.apply(null, this.items)
					.map(Number.call, Number)
					.map(function(i){ return self.equipment(i); });
			case 'function':
				/* Function => iterates over given callback for every equipment */
				return this.equipment().forEach(function(item,index){
					slot.call(null,item.itemId,index,item);
				});
		}
	};
	KC3Ship.prototype.isFast = function(){ return (this.speed || this.master().api_soku) >= 10; };
	KC3Ship.prototype.exItem = function(){ return this.getGearManager().get(this.ex_item); };
	KC3Ship.prototype.isStriped = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.5); };
	KC3Ship.prototype.isTaiha   = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.25) && !this.isRepaired(); };
	KC3Ship.prototype.speedName = function(){ return KC3Meta.shipSpeed(this.speed); };
	KC3Ship.prototype.rangeName = function(){ return KC3Meta.shipRange(this.range); };
	KC3Ship.prototype.getDefer = function(){
		// returns a new defer if possible
		return deferList[this.rosterId] || [];
	};
	KC3Ship.prototype.checkDefer = function() {
		// reset defer if it does not in normal state
		var
			self= this,
			ca  = this.getDefer(), // get defer array
			cd  = ca[0]; // current collection of deferreds
		if(ca && cd && cd.state() == "pending")
			return ca;

		//console.log("replacing",this.rosterId,"cause",!cd ? typeof cd : cd.state());
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
		var shipList = PlayerManager.fleets.map(function(x){return x.ships;}).reduce(function(x,y){return x.concat(y);});
		return Math.qckInt("ceil",(shipList.indexOf(this.rosterId) + 1)/6,0);
	};

	KC3Ship.prototype.isRepaired = function(){
		return PlayerManager.repairShips.indexOf(this.rosterId)>=0;
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
	 * @return false if ship ID belongs to aybssal or nonexistence
	 * @see http://wikiwiki.jp/kancolle/?%A5%B1%A5%C3%A5%B3%A5%F3%A5%AB%A5%C3%A5%B3%A5%AB%A5%EA
	 * @see https://github.com/andanteyk/ElectronicObserver/blob/develop/ElectronicObserver/Other/Information/kcmemo.md#%E3%82%B1%E3%83%83%E3%82%B3%E3%83%B3%E3%82%AB%E3%83%83%E3%82%B3%E3%82%AB%E3%83%AA%E5%BE%8C%E3%81%AE%E8%80%90%E4%B9%85%E5%80%A4
	 */
	KC3Ship.getMaxHp = function(masterId, currentLevel){
		var masterHpArr = KC3Master.isNotRegularShip(masterId) ? [] :
			(KC3Master.ship(masterId) || {"api_taik":[]}).api_taik;
		var masterHp = masterHpArr[0], maxLimitHp = masterHpArr[1];
		var expected = ((currentLevel || 155) < 100 ? masterHp :
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
	 * @return -1 if ship ID belongs to aybssal or nonexistence
	 */
	KC3Ship.getCarrySlots = function(masterId){
		var maxeq = KC3Master.isNotRegularShip(masterId) ? undefined :
			(KC3Master.ship(masterId) || {}).api_maxeq;
		return Array.isArray(maxeq) ? maxeq.reduce(function(acc, v){return acc + v;}, 0) : -1;
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

	/* NAKED LOS
	   LoS without the equipment
	--------------------------------------------------------------*/
	KC3Ship.prototype.nakedLoS = function(){
		var MyNakedLos = this.ls[0];
		MyNakedLos -= this.equipmentTotalLoS();
		return MyNakedLos;
	};

	KC3Ship.prototype.equipmentTotalLoS = function () {
		var sumLoS = 0;
		var self = this;
		$.each(this.equipment(true), function(_,item) {
			if (item.masterId !== 0) {
				sumLoS += item.master().api_saku;
			}
		});
		return sumLoS;
	};

	/* COUNT EQUIPMENT
	Get number of equipments of a specific masterId
	--------------------------------------------------------------*/
	KC3Ship.prototype.countEquipment = function(masterId) {
		var self = this;
		var getEquip = function(item) {
			return (item.masterId === masterId) ? 1 : 0;
		};
		return this.equipment(true).map( getEquip ).reduce(
			function(a,b) { return a + b; }, 0 );
	};

	/* COUNT DRUMS
	Get number of drums held
	--------------------------------------------------------------*/
	KC3Ship.prototype.countDrums = function(){
		return this.countEquipment( 75 );
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
		if (!(this.didFlee || this.isTaiha())) {
			var tp1,tp2,tp3;
			tp1 = String(tp.add(KC3Meta.tpObtained({stype:this.master().api_stype})));
			tp2 = String(tp.add(KC3Meta.tpObtained({slots:this.equipment().map(function(slot){return slot.masterId;})})));
			tp3 = String(tp.add(KC3Meta.tpObtained({slots:[this.exItem().masterId]})));
			// Special case of Kinu Kai 2: Daihatsu embedded :)
			if (this.masterId == 487) {
				tp.add(KC3Meta.tpObtained({slots:[68]}));
			}
			//console.log(this.name(),this.rosterId,tp1,tp2,tp3);
		}
		return tp;
	};

	/* FIGHTER POWER
	Get fighter power of this ship
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterPower = function(){
		if(this.rosterId===0){ return 0; }
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
		if(this.rosterId===0){ return 0; }
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
		if(this.rosterId===0){ return 0; }

		var GearPowers = [
			this.equipment(0).fighterBounds( this.slots[0] ),
			this.equipment(1).fighterBounds( this.slots[1] ),
			this.equipment(2).fighterBounds( this.slots[2] ),
			this.equipment(3).fighterBounds( this.slots[3] )
		];
		//console.log.apply(console,["GearPowers"].concat(GearPowers));
		return [
			GearPowers[0][0]+GearPowers[1][0]+GearPowers[2][0]+GearPowers[3][0],
			GearPowers[0][1]+GearPowers[1][1]+GearPowers[2][1]+GearPowers[3][1],
		];
	};

	/* FIGHTER POWER on Air Defense with INTERCEPTOR FORMULA
	Recon plane gives a modifier to total interception power
	--------------------------------------------------------------*/
	KC3Ship.prototype.interceptionPower = function(){
		if(this.rosterId === 0){ return 0; }
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
	Get support expedition power of this ship
	--------------------------------------------------------------*/
	KC3Ship.prototype.supportPower = function(){
		if(this.rosterId===0){ return 0; }

		var supportPower;
		if(this.master().api_stype==11 || this.master().api_stype==7){
			// console.log( this.name(), "special support calculation for CV(L)" );
			supportPower = 55;
			supportPower += (1.5 * Number(this.fp[0]));
			supportPower += (1.5 * Number(this.tp[0]));
			supportPower += Number(this.equipment(0).supportPower());
			supportPower += Number(this.equipment(1).supportPower());
			supportPower += Number(this.equipment(2).supportPower());
			supportPower += Number(this.equipment(3).supportPower());
			supportPower += Number(this.equipment(4).supportPower());

		}else{
			// console.log( this.name(), "normal firepower for support" );
			supportPower = this.fp[0];
		}
		return supportPower;
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
			return self.level >= 100 ? Math.floor(0.85 * v) : v;
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

	/* Expedition Supply Change Check */
	KC3Ship.prototype.perform = function(command,args) {
		try {
			args = $.extend({noFuel:0,noAmmo:0},args);
			command = command.slice(0,1).toUpperCase() + command.slice(1).toLowerCase();
			this["perform"+command].call(this,args);
		} catch (e) {
			console.error(e);
			return false;
		} finally {
			return true;
		}
	};
	KC3Ship.prototype.performSupply = function(args) {
		consumePending.call(this,0,{0:0,1:1,2:3,c: 1 - ((this.level >= 100) && 0.15),i: 0},[0,1,2],args);
	};
	KC3Ship.prototype.performRepair = function(args) {
		consumePending.call(this,1,{0:0,1:2,2:6,c: 1,i: 0},[0,1,2],args);
	};

	// estimated LoS without equipments based on WhoCallsTheFleetDb
	KC3Ship.prototype.estimateNakedLoS = function() {
		var losInfo = WhoCallsTheFleetDb.getLoSInfo( this.masterId );
		var retVal = WhoCallsTheFleetDb.estimateStat(losInfo, this.level);
		return retVal === false ? 0 : retVal;
	};

	// check if this ship is capable of equipping Daihatsu (landing craft)
	KC3Ship.prototype.canEquipDaihatsu = function() {
		var master = this.master();
		// ship types: DD=2, CL=3, BB=9, AV=16, LHA=17, AO=22
		// so far only ships with types above can equip daihatsu.
		if ([2,3,9,16,17,22].indexOf( master.api_stype ) === -1)
			return false;

		// excluding Akitsushima(445), Hayasui(460), Kamoi(162)
		// (however their remodels are capable of equipping daihatsu
		if ([445, 460, 162].indexOf( this.masterId ) !== -1)
			return false;
		
		// only few DDs, CLs and 1 BB are capable of equipping daihatsu
		// see comments below.
		if ([2 /* DD */,3 /* CL */,9 /* BB */].indexOf( master.api_stype ) !== -1 &&
			[
				// Abukuma K2(200), Kinu K2(487)
				200, 487,
				// Satsuki K2(418), Mutsuki K2(434), Kisaragi K2(435)
				418, 434, 435,
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
		// master Id for Isuzu K2
		if (this.masterId === 141)
			return true;

		// is Taiyou series:
		// tho Kasugamaru not possible to reach high asw for now
		// and base asw stat of Kai and Kai2 already exceed 70
		let isTaiyouSeries = RemodelDb.originOf(this.masterId) === 521;
		let isTaiyouBase = this.masterId === 526;
		let isTaiyouKaiAfter = RemodelDb.remodelGroup(521).indexOf(this.masterId) > 1;

		// lower condition for Escort and Taiyou
		let aswThreshold = this.master().api_stype == 1 ? 60
			: isTaiyouSeries ? 65
			: 100;

		// shortcutting on the stricter condition first
		if (this.as[0] < aswThreshold)
			return false;

		// according test, Taiyou needs T97/Tenzan Torpedo Bomber 931 Air Group
		// see http://wikiwiki.jp/kancolle/?%C2%E7%C2%EB
		function isBomber931AirGroup(masterData) {
			return masterData &&
				masterData.api_id === 82 || masterData.api_id === 83;
		}
		// for Taiyou Kai or Kai2, any equippable aircraft should work
		function isAswAircraft(masterData) {
			/*
			 * - 7: Dive Bomber
			 * - 8: Torpedo Bomber
			 * - 11: Seaplane Bomber (not equippable)
			 * - 25: Autogyro (Kai2 equippable)
			 * - 26: Anti-Sub PBY
			 * - 41: Large Flying Boat (not equippable)
			 */
			return masterData &&
				[7, 8, 11, 25, 26, 41].indexOf(masterData.api_type[2]) > -1;
		}

		// Only Autogyro or PBY equipped will not let CVL anti-sub in day shelling phase,
		// but Taiyou Kai+ can still OASW. only Sonar equipped can do neither.
		if (isTaiyouKaiAfter) {
			return [0,1,2,3,4].some( slot => isAswAircraft( this.equipment(slot).master() ));
		} else if (isTaiyouBase) {
			return [0,1,2,3,4].some( slot => isBomber931AirGroup( this.equipment(slot).master() ));
		}

		function isSonar(masterData) {
			/* checking on equipment type sounds better than
			   letting a list of master Ids
			   should match the following equipments: (id, name)
			   - 46: T93 Passive Sonar
			   - 47: T3 Active Sonar
			   - 132: T0 Passive
			   - 149: T4 Passive
			 */
			return masterData &&
				masterData.api_type[1] === 10;
		}
		let hasSonar = [0,1,2,3,4]
			.some( slot => isSonar( this.equipment(slot).master() ));

		// Escort can OASW without Sonar, but total asw >= 75 and equipped total plus asw >= 4
		// see https://twitter.com/a_t_o_6/status/863445975007805440
		if(this.master().api_stype == 1) {
			if(hasSonar) return true;
			let equipAswSum = [0,1,2,3,4]
				.map(slot => this.equipment(slot).master().api_tais || 0)
				.reduce((ac, p) => ac + p, 0);
			return this.as[0] >= 75 && equipAswSum >= 4;
		}

		return hasSonar;
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


			console.log.apply(console,["Ship",self.rosterId,"Consume",shipConsumption,sid,[iterant,lastN].join('/')].concat(rsc.map(function(x){return -x;})).concat(dat[index]));

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
