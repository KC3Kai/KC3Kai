/* Master.js
KC3改 Master Dataset

Represents master data from api_start2
Indexes significant data for easier access
Saves and loads significant data for future use
*/
(function(){
	"use strict";
	
	window.KC3Master = {
		isAvailable: false,
		_ship: {},
		_slotitem: {},
		_stype: {},
		_graph: {},
		
		_newShips: {},
		_newItems: {},
		
		_raw: {},
		
		init: function( raw ){
			this.load();
			
			if(typeof raw != "undefined"){
				return this.processRaw( raw );
			}
			
			this.updateRemodelTable();
			return false;
		},
		
		/* Process raw data, fresh from API
		-------------------------------------*/
		processRaw :function(raw){
			var beforeCounts = false;
			if( Object.size(this._raw) > 0) {
				beforeCounts = [ Object.size(this._raw.ship), Object.size(this._raw.slotitem) ];
			}
			
			var newCounts = [0, 0];
			var self = this;
			
			// Loops through each api_mst_
			Object.keys(raw).forEach(function(mst_name) {
				var mst_data = raw[mst_name];
				var short_mst_name = mst_name.replace("api_mst_", "");
				
				// If the current master item is an array
				if (Object.prototype.toString.call(mst_data) === '[object Array]') {
					// Add the master item to local raw, as empty object
					self._raw[short_mst_name] = {};
					
					// Store the contents into the new local raw object
					mst_data.map(function(elem, i){
						if (typeof elem.api_id != "undefined") {
							// Add elements to local raw, with their IDs as indexes
							self._raw[short_mst_name][elem.api_id] = elem;
						}else {
							// Elements have no IDs, store them with their original indexes
							self._raw[short_mst_name][i] = elem;
						}
					});
				}
			});
			
			this.updateRemodelTable();
			this.save();
			this.available = true;
			
			// If there was a count before this update, calculate how many new
			if (beforeCounts) {
				return [
					Object.size(this._raw.ship) - beforeCounts[0],
					Object.size(this._raw.slotitem) - beforeCounts[1]
				];
			} else {
				return [0,0];
			}
		},
		
		/* Data Access
		-------------------------------------*/
		ship :function(id){
			console.log(this._raw.ship[id]);
			return this._raw.ship[id] || false;
		},
		
		all_ships :function(){
			return this._raw.ship;
		},
		
		graph :function(id){
			return this._raw.shipgraph[id] || false;
		},
		
		graph_file :function(filename){
			var self = this;
			return Object.keys(this._raw.shipgraph).filter(function(key){
				return self._raw.shipgraph[key] === filename;
			})[0];
		},
		
		slotitem :function(id){
			return this._raw.slotitem[id] || false;
		},
		
		all_slotitems :function(){
			return this._raw.slotitem;
		},
		
		stype :function(id){
			return this._raw.stype[id] || false;
		},
		
		/* Save to localStorage
		-------------------------------------*/
		save :function(){
			localStorage.raw = JSON.stringify(this._raw);
		},
		
		/* Load from localStorage
		-------------------------------------*/
		load :function(){
			if(typeof localStorage.raw != "undefined"){
				var tmpMaster = JSON.parse(localStorage.raw);
				if(tmpMaster.ship[1] !== null){
					this._raw = tmpMaster;
					this.available = true;
				}else{
					this.available = false;
				}
			}else{
				this.available = false;
			}
		},
		
		/* Remodel Table Storage
		-------------------------------------*/
		removeRemodelTable :function(){
			var cShip,ship_id;
			for(ship_id in this._raw.ship) {
				cShip = this._raw.ship[ship_id];
				if(!cShip) { /* invalid API */ continue; }
				if(!cShip.api_buildtime) { /* unbuildable by API */ continue; }
				delete cShip.kc3_maxed;
				delete cShip.kc3_model;
				delete cShip.kc3_bship;
			}
		},
		updateRemodelTable :function(){
			var cShip,ccShip,remodList,ship_id,shipAry,modelLv,bship_id;
			this.removeRemodelTable();
			shipAry = Object.keys(this._raw.ship);
			remodList = [];
			modelLv = 1;
			while(shipAry.length) {
				ship_id = parseInt(shipAry.shift());
				cShip = this._raw.ship[ship_id];
				
				// Pre-checks of the remodel table
				if(!cShip)               { /* invalid API */ continue; }
				if(!cShip.api_buildtime) { /* unbuildable by API */ continue; }
				
				/* proposed variable:
				  kc3 prefix variable -> to prevent overwriting what devs gonna say later on
					maxed flag -> is it the end of the cycle? is it returns to a cyclic model?
					model level -> mark the current model is already marked.
					base id -> base form of the ship
				*/
				cShip.api_aftershipid = Number(cShip.api_aftershipid);
				if(!!cShip.kc3_model)    { /* already checked ship */ modelLv = 1; continue; }
				if(cShip.api_name.indexOf("改") >= 0 && modelLv <= 1) { /* delays enumeration of the remodelled ship in normal state */ continue; }
				
				// Prepare remodel flag
				cShip.kc3_maxed = false;
				cShip.kc3_model = modelLv++; // 1 stands for base model
				cShip.kc3_bship = cShip.kc3_bship || ship_id;
				
				// Prepare salt list for every base ship that is not even a remodel
				// Only for enabled salt check
				if(
					(ConfigManager.info_salt) &&
					(ConfigManager.salt_list.indexOf(cShip.kc3_bship) < 0) &&
					(this._newShips[cShip.kc3_bship])
				){
					ConfigManager.salt_list.push(cShip.kc3_bship);
				}
				
				// Check whether remodel is available and skip further processing
				if(!!cShip.api_afterlv) {
					shipAry.unshift(cShip.api_aftershipid);
					ccShip = this._raw.ship[cShip.api_aftershipid];
					ccShip.kc3_bship = cShip.kc3_bship;
					cShip.kc3_maxed = !!ccShip.kc3_model;
					continue;
				}
				// Finalize model data
				cShip.kc3_maxed = true;
				modelLv = 1;
			}
		}
		
	};
	
})();
