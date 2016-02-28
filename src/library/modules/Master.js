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
			var tmpRecord, i;
			var timeNow = Date.now();
			var beforeCounts = [ Object.size(this._ship), Object.size(this._slotitem) ];
			var newCounts = [0/*ships*/,  0/*items*/];
			
			// Organize master ship into indexes
			for(i in raw.api_mst_ship){
				tmpRecord = raw.api_mst_ship[i];
				if(typeof tmpRecord.api_name != "undefined"){
					if(typeof this._ship[tmpRecord.api_id] == "undefined" && beforeCounts[0]>0){
						this._newShips[tmpRecord.api_id] = timeNow;
						newCounts[0]++;
					}
					this._ship[tmpRecord.api_id] = tmpRecord;
				}
			}
			
			// Get shipgraph filenames and point to their api_ids
			for(i in raw.api_mst_shipgraph){
				tmpRecord = raw.api_mst_shipgraph[i];
				this._graph[tmpRecord.api_filename] = tmpRecord.api_id;
			}
			
			// Organize master slotitem into indexes
			for(i in raw.api_mst_slotitem){
				tmpRecord = raw.api_mst_slotitem[i];
				if(typeof tmpRecord.api_name != "undefined"){
					if(typeof this._slotitem[tmpRecord.api_id] == "undefined" && beforeCounts[1]>0){
						this._newItems[tmpRecord.api_id] = timeNow;
						newCounts[1]++;
					}
					this._slotitem[tmpRecord.api_id] = tmpRecord;
				}
			}
			
			// Organize master stype into indexes
			for(i in raw.api_mst_stype){
				tmpRecord = raw.api_mst_stype[i];
				if(typeof tmpRecord.api_name != "undefined"){
					this._stype[tmpRecord.api_id] = tmpRecord;
				}
			}
			
			this.save();
			this.available = true;
			return newCounts;
		},
		
		/* Data Access
		-------------------------------------*/
		ship :function(id){
			return this._ship[id] || false;
		},
		
		graph :function(filename){
			return this._graph[filename] || false;
		},
		
		graph_id :function(ship_id){
			var self = this;
			return Object.keys(this._graph).filter(function(key){
				return self._graph[key] === ship_id;
			})[0];
			// return this._graph.valueKey(ship_id);
		},
		
		slotitem :function(id){
			return this._slotitem[id] || false;
		},
		
		stype :function(id){
			return this._stype[id] || false;
		},
		
		/* Save to localStorage
		-------------------------------------*/
		save :function(){
			localStorage.master = JSON.stringify({
				ship		: this._ship,
				graph		: this._graph,
				slotitem	: this._slotitem,
				stype		: this._stype,
				newShips		: this._newShips,
				newItems		: this._newItems
			});
		},
		
		/* Load from localStorage
		-------------------------------------*/
		load :function(){
			if(typeof localStorage.master != "undefined"){
				var tmpMaster = JSON.parse(localStorage.master);
				if(tmpMaster.ship[0]!==null){
					this._ship = tmpMaster.ship;
					this._graph = tmpMaster.graph || {};
					this._slotitem = tmpMaster.slotitem;
					this._stype = tmpMaster.stype;
					this._newShips = tmpMaster.newShips || {};
					this._newItems = tmpMaster.newItems || {};
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
			for(ship_id in this._ship) {
				cShip = this._ship[ship_id];
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
			shipAry = Object.keys(this._ship);
			remodList = [];
			modelLv = 1;
			while(shipAry.length) {
				ship_id = parseInt(shipAry.shift());
				cShip = this._ship[ship_id];
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
				cShip.kc3_maxed = false;
				cShip.kc3_model = modelLv++; // 1 stands for base model
				cShip.kc3_bship = cShip.kc3_bship || ship_id;
				if(!!cShip.api_afterlv) {
					shipAry.unshift(cShip.api_aftershipid);
					ccShip = this._ship[cShip.api_aftershipid];
					ccShip.kc3_bship = cShip.kc3_bship;
					cShip.kc3_maxed = !!ccShip.kc3_model;
					continue;
				}
				cShip.kc3_maxed = true;
				modelLv = 1;
			}
		}
		
	};
	
})();
