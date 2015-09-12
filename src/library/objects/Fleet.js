/* Fleet.js
KC3改 Fleet Object

Contains summary information about a fleet and its 6 ships
*/
(function(){
	"use strict";
	
	window.KC3Fleet = function( data ){
		this.active = false;
		this.fastFleet = true;
		this.name = "";
		this.ships = [ -1, -1, -1, -1, -1, -1 ];
		this.mission = [ 0, 0, 0, 0 ];
		this.akashi_tick = 0; // TODO: if not lazy _(:3
	};
	
	KC3Fleet.prototype.update = function( data ){
		if(typeof data.api_member_id != "undefined"){
			this.active = true;
			this.name = data.api_name;
			this.ships = data.api_ship;
			this.mission = data.api_mission;
			
			if(data.api_id > 1){
				if(this.mission[0] > 0){
					KC3TimerManager.exped( data.api_id ).activate(
						this.mission[2],
						this.ship(0).masterId,
						this.mission[1]
					);
				}else{
					KC3TimerManager.exped( data.api_id ).deactivate();
				}
			}
		}
	};
	
	KC3Fleet.prototype.defineFormatted = function( data ){
		this.active = data.active;
		this.name = data.name;
		this.ships = data.ships;
		this.mission = data.mission;
		return this;
	};
	
	
	/*--------------------------------------------------------*/
	/*----------------------[ GETTERS ]-----------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.ship = function( slot ){
		return KC3ShipManager.get( this.ships[slot] );
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
		this.ships[1] = this.ships[2] = this.ships[3] = this.ships[4] = this.ships[5] = -1;
	};
	
	
	/*--------------------------------------------------------*/
	/*------------------[ FLEET ATTRIBUTES ]------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.countShips = function(){
		return $.grep(this.ships, function(shipId){ return shipId>-1; }).length;
	};
	
	KC3Fleet.prototype.totalLevel = function(){
		var self = this;
		return Array.apply(null, {length: 6})
			.map(Number.call, Number)
			.map(function(x){return self.ship(x).level;})
			.reduce(function(x,y){return x+y;});
	};
	
	KC3Fleet.prototype.countDrums = function(){
		var self = this;
		return Array.apply(null, {length: 6})
			.map(Number.call, Number)
			.map(function(x){return self.ship(x).countDrums();})
			.reduce(function(x,y){return x+y;});
	};
	
	KC3Fleet.prototype.countShipsWithDrums = function(){
		var self = this;
		return Array.apply(null, {length: 6})
			.map(Number.call, Number)
			.map(function(x){return self.ship(x).countDrums()>0;})
			.reduce(function(x,y){return x+y;});
	};
	
	KC3Fleet.prototype.averageLevel = function(){
		return this.totalLevel() / this.countShips();
	};
	
	KC3Fleet.prototype.fighterPower = function(){
		var self = this;
		return Math.round(Array.apply(null, {length: 6})
			.map(Number.call, Number)
			.map(function(x){return self.ship(x).fighterPower();})
			.reduce(function(x,y){return x+y;}) * 100)/100;
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
		this.fastFleet = true;
		var i = 0;
		while(this.fastFleet && i < 6) {
			if(this.ships[i] > -1) {
				this.fastFleet = this.fastFleet && this.ship(i).isFast();
			}
			i++;
		}
		return (this.fastFleet) ? KC3Meta.term("SpeedFast") : KC3Meta.term("SpeedSlow");
	};
	
	
	/*--------------------------------------------------------*/
	/*-----------------[ STATUS INDICATORS ]------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.hasTaiha = function(){
		return this.ship(0).isTaiha()
			|| this.ship(1).isTaiha()
			|| this.ship(2).isTaiha()
			|| this.ship(3).isTaiha()
			|| this.ship(4).isTaiha()
			|| this.ship(5).isTaiha();
	};
	
	KC3Fleet.prototype.isSupplied = function(){
		return this.ship(0).isSupplied()
			&& this.ship(1).isSupplied()
			&& this.ship(2).isSupplied()
			&& this.ship(3).isSupplied()
			&& this.ship(4).isSupplied()
			&& this.ship(5).isSupplied();
	};
	
	KC3Fleet.prototype.needsSupply = function(isEmpty){
		var self = this;
		return Array.apply(null, this.ships)
			.map(Number.call, Number)
			.map(function(x){return self.ship(x).isNeedSupply(isEmpty);})
			.reduce(function(x,y){return x||y;});
	};
	
	KC3Fleet.prototype.lowestMorale = function(){
		var lowestMorale = 101;
		if(this.ship(0).morale < lowestMorale && this.ship(0).rosterId>0){ lowestMorale = this.ship(0).morale; }
		if(this.ship(1).morale < lowestMorale && this.ship(1).rosterId>0){ lowestMorale = this.ship(1).morale; }
		if(this.ship(2).morale < lowestMorale && this.ship(2).rosterId>0){ lowestMorale = this.ship(2).morale; }
		if(this.ship(3).morale < lowestMorale && this.ship(3).rosterId>0){ lowestMorale = this.ship(3).morale; }
		if(this.ship(4).morale < lowestMorale && this.ship(4).rosterId>0){ lowestMorale = this.ship(4).morale; }
		if(this.ship(5).morale < lowestMorale && this.ship(5).rosterId>0){ lowestMorale = this.ship(5).morale; }
		return lowestMorale;
	};
	
	KC3Fleet.prototype.highestRepairTimes = function(){
		var highestDocking = 0;
		var highestAkashi = 0;
		var self = this;
		
		function checkShip(shipIndex){
			if(self.ship(shipIndex).masterId===0){ return false; }
			var myReapirTime = self.ship(shipIndex).repairTime();
			if(myReapirTime.docking > highestDocking){ highestDocking = myReapirTime.docking; }
			if(myReapirTime.akashi > highestAkashi){ highestAkashi = myReapirTime.akashi; }
		}
		
		checkShip(0);
		checkShip(1);
		checkShip(2);
		checkShip(3);
		checkShip(4);
		checkShip(5);
		
		return {
			docking: highestDocking,
			akashi: highestAkashi
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
			if(itemData.itemId === 0) return false;
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
			.forEach(function(x){ConsiderShip(self.ship(x));});
		
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
	
	/* DISCARD SHIP
	------------------------------------*/
	KC3Fleet.prototype.discard = function(shipId) {
		var pos = this.ships.indexOf(shipId);
		if(pos>=0){
			this.ships.splice(pos,1);
			this.ships.push(-1);
		}
	};
	
	/* SORTIE JSON
	Used for recording sorties on indexedDB
	Generate fleet summary object without referential data (all masterId)
	Data must be recorded on the state of sortie execution, thus no reference
	------------------------------------*/
	KC3Fleet.prototype.sortieJson = function(){
		if(this.active){
			var ReturnObj = [];
			var self = this;
			$.each(this.ships, function(index, rosterId){
				if(rosterId > -1){
					ReturnObj.push({
						mst_id: self.ship(index).masterId,
						level: self.ship(index).level,
						kyouka: self.ship(index).mod,
						morale: self.ship(index).morale,
						equip: [
							self.ship(index).equipment(0).masterId,
							self.ship(index).equipment(1).masterId,
							self.ship(index).equipment(2).masterId,
							self.ship(index).equipment(3).masterId
						],
					});
				}
			});
			return ReturnObj;
		}else{
			return {};
		}
	};
	
})();