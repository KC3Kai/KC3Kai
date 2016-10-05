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
		this.akashi_tick = 0;

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
							console.error(e.stack);/*RemoveLogging:skip*/
							return false;
						}
					}
				};
			
			shipState.set('pre');
			
			this.active = true;
			this.name = data.api_name;
			this.ships = data.api_ship;
			this.mission = data.api_mission;
			
			shipState.set('post');
			
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
			
			if(!shipState.cmp('pre','post')) {
				this.akashi_tick = 0;
			}
			this.checkAkashi();
		}
	};
	
	KC3Fleet.prototype.defineFormatted = function( data ){
		this.active = data.active;
		this.name = data.name;
		this.ships = data.ships;
		this.mission = data.mission;
		this.akashi_tick = data.akashi_tick;
		return this;
	};
	
	
	/*--------------------------------------------------------*/
	/*----------------------[ GETTERS ]-----------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.ship = function( slot ){
		var self = this;
		switch(typeof slot) {
			case 'number':
			case 'string':
				/* Number/String => converted as fleet slot key */
				return self.getShipManager().get( this.ships[slot] );
			case 'undefined':
				/* Undefined => returns whole fleet as ship object */
				return Array.apply(null, {length: this.countShips()})
					.map(Number.call, Number)
					.map(function(i){ return self.ship(i); });
			case 'function':
				/* Function => iterates over given callback for every ships */
				this.ship().forEach(function(ship,index){
					slot.call(null,ship.rosterId,index,ship);
				});
		}
	};
	
	KC3Fleet.prototype.getDameConCodes = function() {
		var i;
		var result = [];
		for (i=0;i<6;++i) {
			result.push( this.ship(i).findDameCon().code );
		}
		return result;
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
		this.ship(function(x,i,s){s.akashiMark = false;});
		this.ships.fill(-1,1,6);
		this.checkAkashi();
	};
	
	KC3Fleet.prototype.checkAkashi = function(forceReset){
		forceReset = !!forceReset;
		
		var flagship = this.ship(0);
		if(
			flagship.master().api_stype == 19 &&
			!(flagship.isStriped() || !flagship.isFree())
		) {
			// only applies to AR that is spending her time in port
			// but neither striped or even bathing.
			var
				prevTick = !forceReset && this.akashi_tick,
				nextTick = Date.now(),
				shftTick = prevTick && Math.hrdInt('floor',(nextTick - prevTick)/1.2,6)*1.2;
			this.akashi_tick = (prevTick + shftTick) || nextTick;
			
			var akashiRange = flagship.countEquipment(86) + 1;
			
			this.ship(function(roster,index,ship){
				ship.akashiMark = (index <= akashiRange) && ship.isFree() && !ship.isStriped();
			});
			return true;
		} else {
			this.akashi_tick = 0;
			this.ship(function(roster,index,ship){
				ship.akashiMark = false;
			});
			return false;
		}
	};
	
	KC3Fleet.prototype.checkAkashiValid = function() {
		return !!this.akashi_tick;
	};
	
	KC3Fleet.prototype.checkAkashiExpire = function() {
		return !!this.checkAkashiTick();
	};
	
	KC3Fleet.prototype.checkAkashiTick = function() {
		return Math.hrdInt('floor',(Date.now() - this.akashi_tick)/1.2,6,1);
	};
	
	/*--------------------------------------------------------*/
	/*------------------[ FLEET ATTRIBUTES ]------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.countShips = function(){
		return (this.ships.indexOf(-1)+1 || 7)-1;
		//return $.grep(this.ships, function(shipId){ return shipId>-1; }).length;
	};
	
	KC3Fleet.prototype.totalLevel = function(){
		return this.ship().map(function(x){return x.level;})
			.reduce(function(x,y){return x+y;},0);
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
	// formula taken from http://kancolle.wikia.com/wiki/Expedition as of Oct 4,2016
	KC3Fleet.prototype.calcLandingCraftBonus = function() {
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
				}
			});
		});

		// without cap
		var basicBonus = normalCount*0.05 + t89Count*0.02 + t2Count*0.01;
		// cap at 20%
		var cappedBasicBonus = Math.min(0.2, basicBonus);
		var landingCraftCount = normalCount + t89Count + t2Count;
		var improveBonus = landingCraftCount > 0
			? 0.01 * improveCount * cappedBasicBonus / landingCraftCount
			: 0.0;
		return cappedBasicBonus + improveBonus;
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
	
	KC3Fleet.prototype.fighterVeteran = function(){
		var self = this;
		return Math.round(Array.apply(null, {length: 6})
			.map(Number.call, Number)
			.map(function(x){return self.ship(x).fighterVeteran();})
			.reduce(function(x,y){return x+y;}) * 100)/100;
	};
	
	KC3Fleet.prototype.fighterBounds = function(){
		var self = this;
		var TotalPower = [0,0];
		
		var ShipPower;
		for(var ShipCtr in this.ships){
			if(this.ships[ShipCtr] > -1){
				ShipPower = this.ship(ShipCtr).fighterBounds();
				if(typeof ShipPower == "object"){
					TotalPower[0] += Math.floor(ShipPower[0]);
					TotalPower[1] += Math.floor(ShipPower[1]);
					// floor it just in case
				}
			}
		}
		
		return TotalPower;
	};
	
	KC3Fleet.prototype.fighterPowerText = function(){
		switch(ConfigManager.air_formula){
			case 2: return "~"+this.fighterVeteran();
			case 3:
				var fighterBounds = this.fighterBounds();
				return fighterBounds[0]+"~"+fighterBounds[1];
			default:
				return this.fighterPower();
		}
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
			if (shipId !== -1) {
				var shipObj = self.ship(i);
				var cost = shipObj.calcResupplyCost( costPercent.fuel, costPercent.ammo );
				totalFuel += cost.fuel;
				totalAmmo += cost.ammo;
			}
		});
		return {fuel: totalFuel, ammo: totalAmmo};
	};

	KC3Fleet.prototype.calcResupplyCost = function() {
		var self = this;
		var totalFuel = 0;
		var totalAmmo = 0;
		var totalBauxite = 0;
		$.each( this.ships, function(i, shipId) {
			if (shipId > -1) {
				var shipObj = self.ship(i);
				var cost = shipObj.calcResupplyCost(-1, -1, true);
				totalFuel += cost.fuel;
				totalAmmo += cost.ammo;
				totalBauxite += cost.bauxite;
			}
		});
		return {fuel: totalFuel, ammo: totalAmmo, bauxite:totalBauxite};
	};

	/*--------------------------------------------------------*/
	/*-----------------[ STATUS INDICATORS ]------------------*/
	/*--------------------------------------------------------*/
	
	KC3Fleet.prototype.hasTaiha = function(){
		return this.ship().some(function(ship){
			return ship.isTaiha() && !ship.didFlee;
		});
	};
	
	KC3Fleet.prototype.getTaihas = function(){
		var taihaIndexes = [];
		for(var sctr in this.ships){
			var ship = this.ship(sctr);
			if(ship.isTaiha() && !ship.didFlee){
				taihaIndexes.push(sctr);
			}
		}
		return taihaIndexes;
	};
	
	KC3Fleet.prototype.isSupplied = function(){
		return this.ship().every(function(ship){
			return !ship.didFlee && ship.isSupplied();
		});
	};
	
	KC3Fleet.prototype.needsSupply = function(isEmpty){
		return this.ship().some(function(ship){
			return !ship.didFlee && ship.isNeedSupply(isEmpty);
		});
	};
	
	KC3Fleet.prototype.missionOK = function(){
		return this.countShips() >= 2 && this.mission[0] === 0;
	};
	
	KC3Fleet.prototype.lowestMorale = function(){
		return this.ship().reduce(function(moralePre,shipData,moraleInd){
			return Math.min(moralePre,shipData.didFlee ? 100 : shipData.morale);
		},100);
	};
	
	KC3Fleet.prototype.highestRepairTimes = function(akashiReduce){
		var
			self  = this,
			highestDocking = 0,
			highestAkashi = 0,
			ctime = Date.now();
		
		this.ship(function(rosterId,index,shipData){
			if(shipData.didFlee) { return false; }
			var myRepairTime = shipData.repairTime();
			myRepairTime.akashi -= Math.max(
				0,
				(!!akashiReduce &&
					self.akashi_tick && shipData.akashiMark && myRepairTime.akashi && 
					Math.hrdInt('floor',(ctime - self.akashi_tick),3,1)
				)
			);
			
			if(myRepairTime.docking > highestDocking){ highestDocking = myRepairTime.docking; }
			if(myRepairTime.akashi > highestAkashi){ highestAkashi = myRepairTime.akashi; }
		});
		
		return {
			docking: highestDocking,
			akashi: highestAkashi,
			akashiCheck: [this.checkAkashiValid(),this.checkAkashiExpire()]
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
	 *  LoS : "Formula 33"
	 *  http://kancolle.wikia.com/wiki/Line_of_Sight
	 *  http://ja.kancolle.wikia.com/wiki/%E3%83%9E%E3%83%83%E3%83%97%E7%B4%A2%E6%95%B5
	 *  ID refer to start2 API, api_mst_slotitem_equiptype
	 * @returns {number}
	 */
	KC3Fleet.prototype.eLos4 = function(){
		var multipliers = {
			6: 0.6, // Carrier-Based Fighter
			7: 0.6, // Carrier-Based Dive Bomber
			8: 0.8, // Carrier-Based Torpedo Bomber
			9: 1, // Carrier-Based Reconnaissance Aircraft
			10: 1.2, // Reconnaissance Seaplane
			11: 1.1, // Seaplane Bomber
			12: 0.6, // Small Radar
			13: 0.6, // Large Radar
			26: 0.6, // ASW Patrol Aircraft
			29: 0.6, // Searchlight Small / Large
			34: 0.6, // Fleet Command Facility
			35: 0.6, // SCAMP
			39: 0.6, // Skilled Lookouts
			40: 0.6, // Sonar
			41: 0.6, // Large Flying Boat
			45: 0.6,  // Seaplane Fighter
			94: 1 // Carrier-Based Reconnaissance Aircraft
		};

		var total = 0;
		var emptyShipSlot = 0;

		// iterate ships
		for (var i = 0; i < 6; i++) {
			var shipData = this.ship(i);

			// if empty slot or ship flee ?
			if(shipData.rosterId === 0 || shipData.didFlee) {
				emptyShipSlot++;
				continue;
			}

			// ship's naked los
			total += Math.sqrt(shipData.nakedLoS());

			// iterate ship's equipment
			for (var j = 0; j < 4; j++) {
				if (shipData.items[j] > -1) {
					var itemData = shipData.equipment(j);
					if (itemData.itemId !== 0) {
						var itemType = itemData.master().api_type[2];
						var multiplier = multipliers[itemType];
						if (multiplier) {
							var equipment_bonus = Math.sqrt(itemData.stars);

							if (itemType === 12 ||
								itemType === 13) {
								// radar bonus
								equipment_bonus *= 1.25;
							} else if (itemType === 10) {
								// Reconnaissance Seaplane bonus
								equipment_bonus *= 1.2;
							} else {
								// all other equipment with no bonus
								equipment_bonus = 0;
							}

							// multiple * (raw equipment los + equipment bonus)
							total += multiplier * (itemData.master().api_saku + equipment_bonus);
						}
					}
				}
			}

		}

		// player hq level adjustment
		total -= Math.ceil(0.4 * PlayerManager.hq.level);

		// empty ship slot adjustment
		total += 2 * emptyShipSlot;

		return total;
	};
	
	/* DISCARD SHIP
	------------------------------------*/
	KC3Fleet.prototype.discard = function(shipId) {
		var pos = this.ships.indexOf(Number(shipId));
		if(pos>=0){
			this.ships.splice(pos,1);
			this.ships.push(-1);
		}
		this.checkAkashi(true);
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
					var ship = self.ship(index);
					ReturnObj.push({
						mst_id: ship.masterId,
						level: ship.level,
						kyouka: ship.mod,
						morale: ship.morale,
						equip: [
							ship.equipment(0).masterId,
							ship.equipment(1).masterId,
							ship.equipment(2).masterId,
							ship.equipment(3).masterId,
							ship.exItem().masterId
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
