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
		this.items = [-1,-1,-1,-1];
        // ex_item correponses to "api_slot_ex" in the API,
        // which has special meanings on few values:
        // 0: ex slot is not available
        // -1: ex slot is available but nothing is equipped
		this.ex_item = 0;
		this.slots = [0,0,0,0];
		this.slotnum = 0;
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
			valueStructure: typeName int[2][3] of [fuel, ammo, bauxites] and [fuel, steel, buckets]
				"sortie3000":[[12,24, 0],[ 0, 0, 0]], // OREL (3 nodes)
				"sortie3001":[[ 8,16, 0],[ 0, 0, 0]], // SPARKLE GO 1-1 (2 nodes)
				"sortie3002":[[ 4,12, 0],[ 0, 0, 0]], // PVP (1 node+yasen)

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
				return self.getGearManager().get( this.items[slot] );
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
	KC3Ship.prototype.isFast = function(){ return this.master().api_soku>=10; };
	KC3Ship.prototype.exItem = function(){ return this.getGearManager().get(this.ex_item); };
	KC3Ship.prototype.isStriped = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.5); };
	KC3Ship.prototype.isTaiha   = function(){ return (this.hp[1]>0) && (this.hp[0]/this.hp[1] <= 0.25) && !this.isRepaired(); };
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
		this.morale = Math.max(40,this.morale);
		this.repair.fill(0);
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

		var result = {};

		result.akashi = ( HPPercent > 0.50 && HPPercent < 1.00 && this.isFree()) ?
			/* RepairCalc.facilityInSecJSNum( this.master().api_stype, this.level, this.hp[0], this.hp[1] ) */
			Math.max(Math.min((1200 * (this.hp[1] - this.hp[0])),RepairTSec),1200) : 0;

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
		$.each([0,1,2,3], function(_,ind) {
			var item = self.equipment(ind);
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
		var getEquip = function(slotInd) {
			var eId = self.equipment(slotInd);
			return (eId.masterId === masterId) ? 1 : 0;
		};
		return [0,1,2,3].map( getEquip ).reduce(
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

	/* FIGHTER POWER with INTERCEPTOR FORMULA
	Normal planes get usual fighter power formula
	Interceptor planes get special formula
	--------------------------------------------------------------*/
	KC3Ship.prototype.interceptionPower = function(type){
		if(this.rosterId===0){ return 0; }
		if (typeof type == "undefined") { type = "aa"; }
		return this.equipment(0).interceptionPower( type, this.slots[0] )
			+ this.equipment(1).interceptionPower( type, this.slots[1] )
			+ this.equipment(2).interceptionPower( type, this.slots[2] )
			+ this.equipment(3).interceptionPower( type, this.slots[3] );
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
	   returns an object: {fuel: <fuelCost>, ammo: <ammoCost>, bauxite: <bauxiteCost>}
	 */
	KC3Ship.prototype.calcResupplyCost = function(fuelPercent, ammoPercent, bauxiteNeeded) {
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
			var equipBauxiteCost = function() {
				return self.equipment(0).bauxiteCost(self.slots[0], master.api_maxeq[0])
					+ self.equipment(1).bauxiteCost(self.slots[1], master.api_maxeq[1])
					+ self.equipment(2).bauxiteCost(self.slots[2], master.api_maxeq[2])
					+ self.equipment(3).bauxiteCost(self.slots[3], master.api_maxeq[3]);
			};
			result.bauxite = equipBauxiteCost();
			// Bauxite cost to replace planes shot down does not change by marriage.
			// via http://kancolle.wikia.com/wiki/Marriage
			//result.bauxite = marriageConserve(result.bauxite);
		}
		return result;
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
		// ship types: DD=2, CL=3, AV=16, LHA=17, AO=22
		// so far only ships with types above can equip daihatsu.
		if ([2,3,16,17,22].indexOf( master.api_stype ) === -1)
			return false;

		// excluding Akitsushima(445) and Hayasui(352)
		// (however their remodels are capable of equipping daihatsu
		if (this.masterId === 445 || this.masterId === 460)
			return false;
		
		// only few DDs and CLs are capable of equipping daihatsu
		// including:
		// Abukuma K2(200), Verniy(147), Ooshio K2(199),
		// Satsuki K2(418), Mutsuki K2(434), Kisaragi K2(435),
		// Kasumi K2(464), Kasumi K2B(470),
		// Asashio K2D(468), Kawakaze K2(469)
		if ([2,3].indexOf( master.api_stype ) !== -1 &&
			[147,199,200,418,434,435,464,470,468,469].indexOf( this.masterId ) === -1)
			return false;
		return true;
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
})();
