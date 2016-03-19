/* ShipManager.js
KC3改 Ship Manager

Managesship roster and does indexing for data access.
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
		
		// Count number of ships
		count :function(){
			return Object.size(this.list) + this.pendingShipNum;
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
				
				// check ship master in lock_prep before lock request it
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
					hour: Math.hrdInt('floor', Date.now()/3.6 ,6,1),
					type: 'akashi' + sp.masterId,
					data: rs
				});
				// Reduce Consumption Counter
				// df (delta)      = [0,5,20]
				df.shift(); df.push(0);
				console.info("Akashi repaired",cShip.name(),cShip.hp.reduceRight(function(hi,lo){return hi-lo;}),
					df,df.map(function(rsc){ return Math.floor(rsc * plt); })
				);
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
		
		// Remove ship from the list, scrapped, mod-fodded, or sunk
		remove :function( rosterId ){
			console.log("removing ship", rosterId);
			var thisShip = this.list["x"+rosterId];
			if(thisShip != "undefined"){
				// initializing for fleet sanitizing of zombie ships
				var
					flatShips  = PlayerManager.fleets
						.map(function(x){ return x.ships; })
						.reduce(function(x,y){ return x.concat(y); }),
					shipTargetOnFleet = flatShips.indexOf(Number(rosterId)), // check from which fleet
					shipTargetFleetID = Math.floor(shipTargetOnFleet/6);
				// check whether the designated ship is on fleet or not
				if(shipTargetOnFleet >= 0){
					PlayerManager.fleets[shipTargetFleetID].discard(rosterId);
				}
				// remove any equipments from her
				for(var gctr in thisShip.items){
					if(thisShip.items[gctr] > -1){
						KC3GearManager.remove( thisShip.items[gctr] );
					}
				}
				
				delete this.list["x"+rosterId];
				this.save();
				KC3GearManager.save();
			}
		},
		
		// Show JSON string of the list for debugging purposes
		json: function(){
			console.log(JSON.stringify(this.list));
		},
		
		// Save ship list onto local storage
		clear: function(){
			this.list = {};
		},
		
		// Save ship list onto local storage
		save: function(){
			localStorage.ships = JSON.stringify(this.list);
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