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
		},
		
		/* Process raw data, fresh from API
		-------------------------------------*/
		processRaw :function(raw){
			var tmpRecord;
			
			// Organize master ship into indexes
			for(i in raw.api_mst_ship){
				tmpRecord = raw.api_mst_ship[i];
				if(typeof tmpRecord.api_name != "undefined"){
					this._ship[tmpRecord.api_id] = tmpRecord;
					this._ship[tmpRecord.api_id].english = DataManager.shipName( tmpRecord );
				}
			}
			
			// Organize master slotitem into indexes
			for(i in raw.api_mst_slotitem){
				tmpRecord = raw.api_mst_slotitem[i];
				if(typeof tmpRecord.api_name != "undefined"){
					this._slotitem[tmpRecord.api_id] = tmpRecord;
					this._slotitem[tmpRecord.api_id].english = DataManager.gearName( tmpRecord );
				}
			}
			
			// Organize master stype into indexes
			for(i in raw.api_mst_stype){
				tmpRecord = raw.api_mst_stype[i];
				if(typeof tmpRecord.api_name != "undefined"){
					this._stype[tmpRecord.api_id] = tmpRecord;
					this._stype[tmpRecord.api_id].code = DataManager.stype( tmpRecord );
				}
			}
			
			this.save();
			this.available = true;
		},
		
		/* Data Access
		-------------------------------------------------------*/
		
		
		/* Save to localStorage
		-------------------------------------*/
		save :function(){
			localStorage.master = JSON.stringify({
				ship		: this.ship,
				slotitem	: this.slotitem,
				stype		: this.stype,
			});
		},
		
		/* Load from localStorage
		-------------------------------------*/
		load :function(){
			if(typeof localStorage.master != "undefined"){
				var tmpMaster = JSON.parse(localStorage.master);
				this.ship = tmpMaster.ship;
				this.slotitem = tmpMaster.slotitem;
				this.stype = tmpMaster.stype;
				this.available = true;
			}else{
				this.available = false;
			}
		}
		
	};
	
})();