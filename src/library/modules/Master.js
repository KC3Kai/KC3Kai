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
		
		init: function( raw ){
			if(typeof raw != "undefined"){
				this.processRaw( raw );
			}else{
				this.load();
			}
			this.updateRemodelTable();
		},
		
		/* Process raw data, fresh from API
		-------------------------------------*/
		processRaw :function(raw){
			var tmpRecord, i;
			
			// Organize master ship into indexes
			for(i in raw.api_mst_ship){
				tmpRecord = raw.api_mst_ship[i];
				if(typeof tmpRecord.api_name != "undefined"){
					this._ship[tmpRecord.api_id] = tmpRecord;
				}
			}
			
			// Organize master slotitem into indexes
			for(i in raw.api_mst_slotitem){
				tmpRecord = raw.api_mst_slotitem[i];
				if(typeof tmpRecord.api_name != "undefined"){
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
			
			console.log("processed raw",{
				ship		: this._ship,
				slotitem	: this._slotitem,
				stype		: this._stype
			});
			this.save();
			this.available = true;
		},
		
		/* Data Access
		-------------------------------------*/
		ship :function(id){
			return this._ship[id] || false;
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
				slotitem	: this._slotitem,
				stype		: this._stype
			});
		},
		
		/* Load from localStorage
		-------------------------------------*/
		load :function(){
			if(typeof localStorage.master != "undefined"){
				var tmpMaster = JSON.parse(localStorage.master);
				this._ship = tmpMaster.ship;
				this._slotitem = tmpMaster.slotitem;
				this._stype = tmpMaster.stype;
				this.available = true;
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
			}
		},
		updateRemodelTable :function(){
			var cShip,ccShip,remodList,ship_id,shipAry,modelLv;
			this.removeRemodelTable();
			shipAry = Object.keys(this._ship);
			remodList = [];
			modelLv = 1;
			while(shipAry.length) {
				ship_id = shipAry.shift();
				cShip = this._ship[ship_id];
				// Pre-checks of the remodel table
				if(!cShip)               { /* invalid API */ continue; }
				if(!cShip.api_buildtime) { /* unbuildable by API */ continue; }
				/* proposed variable:
				  kc3 prefix variable -> to prevent overwriting what devs gonna say later on
					maxed flag -> is it the end of the cycle? is it returns to a cyclic model?
					model level -> mark the current model is already marked.
				*/
				cShip.api_aftershipid = Number(cShip.api_aftershipid);
				if(!!cShip.kc3_model)    { /* already checked ship */ modelLv = 1; continue; }
				if(cShip.api_name.indexOf("改") >= 0 && modelLv <= 1) { /* delays enumeration of the remodelled ship in normal state */ continue; }
				cShip.kc3_maxed = false;
				cShip.kc3_model = modelLv++; // 1 stands for base model
				if(!!cShip.api_afterlv) {
					shipAry.unshift(cShip.api_aftershipid);
					ccShip = this._ship[cShip.api_aftershipid];
					cShip.kc3_maxed = !!ccShip.kc3_model;
					continue;
				}
				cShip.kc3_maxed = true;
				modelLv = 1;
			}
		}
		
	};
	
})();