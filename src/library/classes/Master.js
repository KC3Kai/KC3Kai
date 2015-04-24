KC3.prototype.Master = {
	available: false,
	
	_ship: [],
	_slotitem: [],
	_stype: [],
	
	// Prefill existing data wherever found
	init :function(raw){
		if(typeof raw == "undefined"){
			this.loadLocal();
		}else{
			this.processRaw(raw);
		}
	},
	
	// Process Raw JSON Data
	processRaw :function(raw){
		var tmpRecord;
		
		// Organize master ship into indexes
		for(i in raw.api_mst_ship){
			tmpRecord = raw.api_mst_ship[i];
			if(typeof tmpRecord.api_name != "undefined" && tmpRecord.api_name != "??"){
				this._ship[tmpRecord.api_id] = tmpRecord;
				this._ship[tmpRecord.api_id].english = app.Meta.translate(tmpRecord.api_name, "ship");
			}
		}
		
		// Organize master slotitem into indexes
		for(i in raw.api_mst_slotitem){
			tmpRecord = raw.api_mst_slotitem[i];
			if(typeof tmpRecord.api_name != "undefined" && tmpRecord.api_name != "??"){
				this._slotitem[tmpRecord.api_id] = tmpRecord;
				this._slotitem[tmpRecord.api_id].english = app.Meta.translate(tmpRecord.api_name, "slotitem");
			}
		}
		
		// Organize master stype into indexes
		for(i in raw.api_mst_stype){
			tmpRecord = raw.api_mst_stype[i];
			if(typeof tmpRecord.api_name != "undefined" && tmpRecord.api_name != "??"){
				this._stype[tmpRecord.api_id] = tmpRecord;
				this._stype[tmpRecord.api_id].code = app.Meta.stype(tmpRecord.api_id);
			}
		}
		
		// Save string of master data locally
		this.saveLocal();
		this.available = true;
	},
	
	/* Data Access methods
	-------------------------------------------------------*/
	ship: function(id){
		if(typeof this._ship[id] != "undefined"){ return this._ship[id]; }
		return false;
	},
	
	slotitem: function(id){
		if(typeof this._slotitem[id] != "undefined"){ return this._slotitem[id]; }
		return false;
	},
	
	stype: function(id){
		if(typeof this._stype[id] != "undefined"){ return this._stype[id]; }
		return false;
	},
	
	/* Save/Load Local Storage
	-------------------------------------*/
	loadLocal :function(){
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
	
	saveLocal :function(){
		localStorage.master = JSON.stringify({
			ship		: this._ship,
			slotitem	: this._slotitem,
			stype		: this._stype,
		});
	}
	
};