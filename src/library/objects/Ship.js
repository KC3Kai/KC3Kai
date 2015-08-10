/* Ship.js
KC3改 Ship Object
*/
(function(){
	"use strict";
	
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
		this.slots = [0,0,0,0];
		this.slotnum = 0;
		this.mod = [0,0,0,0,0];
		this.fuel = 0;
		this.ammo = 0;
		this.stars = 0;
		this.morale = 0;
		this.lock = 0;
		this.didFlee = false;
		
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
				this.slotnum = data.api_slotnum;
				this.slots = data.api_onslot;
				this.mod = data.api_kyouka;
				this.fuel = data.api_fuel;
				this.ammo = data.api_bull;
				this.stars = data.api_srate;
				this.morale = data.api_cond;
				this.lock = data.api_locked;
			// Initialized with formatted data
			}else{
				$.extend(this, data);
			}
		}
		
	};
	
	KC3Ship.prototype.master = function(){ return KC3Master.ship( this.masterId ); };
	KC3Ship.prototype.name = function(){ return KC3Meta.shipName( this.master().api_name ); };
	KC3Ship.prototype.stype = function(){ return KC3Meta.stype( this.master().api_stype ); };
	KC3Ship.prototype.equipment = function(slot){ return KC3GearManager.get( this.items[slot] ); };
	KC3Ship.prototype.isFast = function(){ return this.master().api_soku>=10; };
	KC3Ship.prototype.resetAfterHp = function(){
		this.afterHp[0] = this.hp[0];
		this.afterHp[1] = this.hp[1];
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
	
	/* COUNT DRUMS
	Get number of drums held
	--------------------------------------------------------------*/
	KC3Ship.prototype.countDrums = function(){
		var DrumCount = 0;
		DrumCount += (this.equipment(0).masterId == 75)?1:0;
		DrumCount += (this.equipment(1).masterId == 75)?1:0;
		DrumCount += (this.equipment(2).masterId == 75)?1:0;
		DrumCount += (this.equipment(3).masterId == 75)?1:0;
		return DrumCount;
	};
	
	/* FIGHTER POWER
	Get fighter power of this ship
	--------------------------------------------------------------*/
	KC3Ship.prototype.fighterPower = function(){
		var thisShipFighter = this.equipment(0).fighterPower( this.slots[0] )
			+ this.equipment(1).fighterPower( this.slots[1] )
			+ this.equipment(2).fighterPower( this.slots[2] )
			+ this.equipment(3).fighterPower( this.slots[3] );
		return thisShipFighter;
	};
	
	/*
	.removeEquip( slotIndex )
	*/
	
})();