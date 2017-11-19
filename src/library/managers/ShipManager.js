/* ShipManager.js
KC3改 Ship Manager

Manages ship roster and does indexing for data access.
Saves and loads list to and from localStorage
*/
(function(){
	"use strict";
	
	/* this variable will keep the kc3-specific variables */
	var
		defaults = (new KC3Ship()),
		devVariables = {
			capture: ['didFlee','pendingConsumption','lastSortie','repair','akashiMark'],
			norepl : ['repair']
		};
	
	window.KC3ShipManager = {
		list: {},
		max: 100,
		pendingShipNum: 0,

		// Get a specific ship by ID
		get :function( rosterId ){
			// console.log("getting ship", rosterId, this.list["x"+rosterId]);
			return this.list["x"+rosterId] || (new KC3Ship());
		},
		
		// Count number of ships satisfying some precondition.
		// when precondition is not explicitly given, it counts all ships
		// including pending ships.
		// but pending ships are not counted when a precondition is given.
		count: function( cond ){
			if (typeof cond === "undefined") {
				return Object.size(this.list) + this.pendingShipNum;
			}
			var n = 0;
			var x;
			for (var ind in this.list) {
				x = this.list[ind];
				if (cond.call(x, x))
					n += 1;
			}
			return n;
		},
		
		// Add or replace a ship on the list
		add :function(data){
			var
				self     = this,
				tempData = {},
				cky      = "",
				newData  = false,
				cShip;
			if(typeof data.api_id != "undefined"){
				cky = "x"+data.api_id;
			}else if(typeof data.rosterId != "undefined"){
				cky = "x"+data.rosterId;
			}else{
				return false;
			}
			
			newData = !self.list[cky];
			
			devVariables.capture.forEach(function(key){
				var
					val = (self.list[cky] || defaults)[key];
				tempData[key] = (typeof val === 'object' &&
					(val instanceof Array ? [].slice.apply(val) : $.extend({},val))
				) || val;
			});
			
			// i smell this one is an example for keeping dev variable
			//if (typeof this.list[cky] !== "undefined") {
			//	didFlee = this.list[cky].didFlee;
			//}
			cShip = this.list[cky] = new KC3Ship(data);
			//this.list[cky].didFlee = didFlee;
			
			// prevent the fresh data always overwrites the current loaded state
			if(!newData) {
				devVariables.capture.forEach(function(key){
					if(devVariables.norepl.indexOf(key)<0)
						cShip[key] = tempData[key];
				});
				
				// enforce fresh sortie0 placeholder
				(function(){
					var szs = 'sortie0';
					var ls  = cShip.lastSortie;
					var cnt = 0;
					var szi;
					for(szi=0;szi<ls.length;szi++)
						cnt += ls[szi]==szs;
					while(cnt) {
						for(szi=0;ls[szi]!=szs;szi++){}
						ls.splice(szi,1);
						cnt--;
					}
					ls.push(szs);
				}).call(this);
			} else {
				// check ship master in lock_prep before lock request it
				ConfigManager.loadIfNecessary();
				if(ConfigManager.lock_prep[0] == cShip.rosterId) {
					ConfigManager.lock_prep.shift();
					if(!cShip.lock)
						ConfigManager.lock_list.push(cShip.rosterId);
					
					ConfigManager.save();
				}
			}
			
			// Check previous repair state
			// If there's a change detected (without applying applyRepair proc)
			// It'll be treated as akashi effect
			
			cShip.akashiMark &= !!cShip.onFleet();
			if(tempData.repair[0] > cShip.repair[0] && cShip.akashiMark) {
				/* Disabling this --
					the problem is, pending consumption variable stacks up for expedition, */
				// Calculate Difference
				var
					sp  = cShip,
					pc  = sp.pendingConsumption,
					rs  = Array.apply(null,{length:8}).map(function(){return 0;}),
					df  = tempData.repair.map(function(x,i){return x - sp.repair[i];}),
					plt = ((cShip.hp[1] - cShip.hp[0]) > 0 ? 0.075 : 0.000 );
				
				rs[0] = -df[1];
				rs[2] = -df[2];
				// Store Difference to Database
				KC3Database.Naverall({
					hour: Date.toUTChours(),
					type: 'akashi' + sp.masterId,
					data: rs
				});
				// Reduce Consumption Counter
				// df (delta)      = [0,5,20]
				df.shift(); df.push(0);
				console.log("Akashi repaired", cShip.rosterId, cShip.name(),
					cShip.hp.reduceRight((hi, lo) => hi - lo),
					df, df.map(rsc => Math.floor(rsc * plt)) );
				Object.keys(pc).reverse().forEach(function(d){
					// if the difference is not all-zero, keep going
					if(df.every(function(x){return !x;}))
						return;
					var
						rp = pc[d][1],
						dt = rp.map(function(x,i){return Math.max(x,-df[i]);});
					// if the delta is not all-zero, keep going
					if(dt.every(function(x){return !x;}))
						return;
					rp.forEach(function(x,i){
						rp[i] -= dt[i]; // Reduce the source of supply reduction
						df[i] += dt[i]; // Reduce the required supply to repair
					});
				});
				/* COMMENT STOPPER */
			}
			
			// if there's still pending exped condition on queue
			// don't remove async wait false, after that, remove port load wait
			if(!cShip.pendingConsumption.costnull) {
				cShip.getDefer()[1].resolve(null); // removes async wait
			}
			cShip.getDefer()[2].resolve(cShip.fuel,cShip.bull,cShip.slots.reduce(function(x,y){return x+y;})); // mark resolve wait for port
			
			// update picture book base form info
			if(PictureBook) {
				PictureBook.updateBaseShip(cShip.masterId);
			}
		},
		
		// Mass set multiple ships
		// [repl] -> replace flag (replace whole list, replacing clear functionality)
		set :function(data,repl){
			var ctr,cky,rem,kid,slf;
			slf = this;
			rem = Object.keys(this.list);
			// console.log.apply(console,["Current list"].concat(rem.map(function(x){return x.slice(1);})));
			for(ctr in data){
				if(!!data[ctr]){
					cky = 'x' + data[ctr].api_id;
					kid = rem.indexOf(cky);
					this.add(data[ctr]);
					if(kid>=0)
						rem.splice(kid,1);
				}
			}
			if(!repl)
				rem.splice(0);
			// console.log.apply(console,["Removed ship"].concat(rem.map(function(x){return x.slice(1);})));
			rem.forEach(function(rosterId){
				slf.remove(parseInt(rosterId.slice(1)));
			});
			this.save();
		},
		
		// Remove ship from the list, scrapped, mod-fodder, or sunk
		remove :function( rosterId ){
			console.log("Removing ship", rosterId);
			var thisShip = this.list["x"+rosterId];
			if(typeof thisShip != "undefined"){
				// initializing for fleet sanitizing of zombie ships
				var shipTargetFleetID = this.locateOnFleet(parseInt(rosterId, 10));
				// check whether the designated ship is on fleet or not
				if(shipTargetFleetID >= 0){
					PlayerManager.fleets[shipTargetFleetID].discard(rosterId);
				}
				// remove any equipments from her
				var items = thisShip.equipment(true);
				for(var gctr in items){
					if(items[gctr].itemId > 0){
						KC3GearManager.remove( items[gctr].itemId );
					}
				}
				
				delete this.list["x"+rosterId];
				this.save();
				KC3GearManager.save();
			}
		},
		
		// Look for ships by specified conditions
		find :function( cond ){
			var result = [];
			var x;
			for(var i in this.list) {
				x = this.list[i];
				if(cond.call(x, x)) {
					result.push(x);
				}
			}
			return result;
		},
		
		// Locate which fleet the ship is in, return -1 if not in any fleet
		// similar with Ship.onFleet, but return 0-based index not 1-based sequence
		locateOnFleet: function( rosterId ){
			var fleetId = -1;
			PlayerManager.fleets.find((fleet, index) => {
				if(fleet.ships.find(rid => rid == rosterId)){
					fleetId = index;
					return true;
				}
			});
			return fleetId;
		},
		
		masterExists: function( masterId, matchBaseForm = true ){
			var idToFind = matchBaseForm ? RemodelDb.originOf(masterId) || masterId : masterId;
			return this.find(ship => idToFind === (matchBaseForm ? RemodelDb.originOf(ship.masterId) : ship.masterId)).length > 0;
		},
		
		// Save ship list onto local storage
		clear: function(){
			this.list = {};
		},

		encoded: function() {
			return JSON.stringify(this.list);
		},
		
		// Save ship list onto local storage
		save: function(){
			localStorage.ships = this.encoded();
		},
		
		// Load from storage and add each one to manager list
		load: function(){
			if(typeof localStorage.ships != "undefined"){
				this.clear();
				var ShipList = JSON.parse(localStorage.ships);
				for(var ctr in ShipList){
					this.add( ShipList[ctr] );
				}
				return true;
			}
			return false;
		}
		
	};
	
})();
