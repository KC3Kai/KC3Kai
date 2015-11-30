/* Ship.js
KC3改 Ship Object
*/
(function(){
	"use strict";
	
	var
		deferList = {};
	
	window.KC3Ship = function( data ){
		// Default object properties incuded in stringifications
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
		this.didFlee = false;
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
	
	Object.defineProperties(KC3Ship.prototype,{
		bull: {
			get: function(){return this.ammo;},
			set: function(newAmmo){this.ammo = newAmmo;},
			configurable:false,
			enumerable  :true
		}
	});
	
	KC3Ship.prototype.master = function(){ return KC3Master.ship( this.masterId ); };
	KC3Ship.prototype.name = function(){ return KC3Meta.shipName( this.master().api_name ); };
	KC3Ship.prototype.stype = function(){ return KC3Meta.stype( this.master().api_stype ); };
	KC3Ship.prototype.equipment = function(slot){ return KC3GearManager.get( this.items[slot] ); };
	KC3Ship.prototype.isFast = function(){ return this.master().api_soku>=10; };
	KC3Ship.prototype.exItem = function(){ return KC3GearManager.get(this.ex_item); };
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
			ca  = this.getDefer(),
			cd  = ca[0];
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
	--------------------------------------------------------------*/
	KC3Ship.prototype.repairTime = function(){
		var
			RepairCalc = PS['KanColle.RepairTime'];
		return {
			docking:
				this.isRepaired() ?
				Math.ceil(KC3TimerManager.repair(PlayerManager.repairShips.indexOf(this.rosterId)).remainingTime()) / 1000 :
				RepairCalc.dockingInSecJSNum( this.master().api_stype, this.level, this.hp[0], this.hp[1] ),
			akashi:
				( this.hp[0] / this.hp[1] > 0.50 && this.isFree()) ?
				RepairCalc.facilityInSecJSNum( this.master().api_stype, this.level, this.hp[0], this.hp[1] ) : 0
		};
	};
	
	
	/* NAKED LOS
	LoS without the equipment
	--------------------------------------------------------------*/
	KC3Ship.prototype.nakedLoS = function(){
		var MyNakedLos = this.ls[0];
		if(this.items[0] > -1){ MyNakedLos -= this.equipment(0).master().api_saku; }
		if(this.items[1] > -1){ MyNakedLos -= this.equipment(1).master().api_saku; }
		if(this.items[2] > -1){ MyNakedLos -= this.equipment(2).master().api_saku; }
		if(this.items[3] > -1){ MyNakedLos -= this.equipment(3).master().api_saku; }
		return MyNakedLos;
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

	/* COUNT LANDING CRAFT
	   Get number of landing crafts held
	   ----------------------------------------- */
	KC3Ship.prototype.countLandingCrafts = function(){
		return this.countEquipment( 68 );
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
		console.log.apply(console,["GearPowers"].concat(GearPowers));
		return [
			GearPowers[0][0]+GearPowers[1][0]+GearPowers[2][0]+GearPowers[3][0],
			GearPowers[0][1]+GearPowers[1][1]+GearPowers[2][1]+GearPowers[3][1],
		];
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
	   0 <= fuelPercent <= 1
	   0 <= ammoPercent <= 1
	   returns an object: {fuel: <fuelCost>, ammo: <ammoCost>}
	 */
	KC3Ship.prototype.calcResupplyCost = function(fuelPercent, ammoPercent) {
		var master = this.master();
		var fullFuel = master.api_fuel_max;
		var fullAmmo = master.api_bull_max;

		// TODO: to be verified
		if (this.level >= 100) {
			fullFuel = Math.ceil(fullFuel * 0.85);
			fullAmmo = Math.ceil(fullAmmo * 0.85);
		}

		var mulRounded = function (a, percent) {
			return Math.floor( a * percent );
		};
		return { fuel: mulRounded( fullFuel, fuelPercent ),
				 ammo: mulRounded( fullAmmo, ammoPercent ) };
	};
	/*
	.removeEquip( slotIndex )
	*/
	
	/* Expedition Supply Change Check */
	KC3Ship.prototype.expedConsume = function(){
		var pushLater = [];
		while(this.preExpedCond[0]) {
			var
				ary = this.preExpedCond,
				con = this.pendingConsumption,
				key = ary.shift(),
				sup = ary.splice(0,3),
				nxt = ary.slice(1,4);
			// never accept costnull
			if(key === 'costnull') {
				Array.prototype.push.apply(pushLater,[key].concat(sup));
				break;
			} else {
				if(nxt.length < 3)
					nxt = [this.fuel,this.ammo,this.slots.reduce(function(x,y){return x+y;})];
				for(var dataIndex in nxt) {
					sup[dataIndex] = sup[dataIndex] - nxt[dataIndex];
				}
				con[key] = con[key] || [[0,0,0],[0,0,0]];
				con[key][0] = sup;
			}
		}
		Array.prototype.push.apply(this.preExpedCond,pushLater);
	};
	KC3Ship.prototype.perform = function(command,args) {
		try {
			args = $({noFuel:0,noAmmo:0},args);
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
		consumePending.call(this,0,{0:0,1:1,2:3,c:-1,i: 0},[0,1,2],args);
	};
	KC3Ship.prototype.performRepair = function(args) {
		consumePending.call(this,1,{0:0,1:2,2:6,c: 1,i: 1},[0,1],args);
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
		Object.keys(this.pendingConsumption).forEach(function(shipConsumption,iterant){
			var
				dat = self.pendingConsumption[shipConsumption],
				rsc = [0,0,0,0,0,0,0,0];
			// Iterate supplied ship part
			Object.keys(mapping).forEach(function(key){
				rsc[mapping[key]] += dat[index][key] * mult * (1 + (mapping[key]===3 && 4));
				// Checks whether current iteration is last N pending item
				if(iterant < lastN)
					dat[index][key] = 0;
			});
			console.log.apply(console,["Ship",self.rosterId,"Material"].concat(rsc.map(function(x){return -x;})));
			
			// Store supplied resource count to database by updating the source
			KC3Database.Naverall({
				data: rsc
			},shipConsumption);
			
			if(dat.every(function(consumptionData){
				return consumptionData.every(function(resource){
					return !resource;
				});
			})) {
				delete self.pendingConsumption[shipConsumption];
			}
			/* Comment Stopper */
		});
	}
})();
