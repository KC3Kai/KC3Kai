KC3.prototype.Docks  = {
	
	init :function(){
		this._fleets = [];
		this._fleetCount = 1;
		this._repair = [];
		this._repairCount = 2;
		this._repair_ids = [];
		this._build = [];
		this._buildCount = 2;
		this._combined = 0;
	},
	
	setFleets :function(data){
		this._fleets = data;
		localStorage.player_fleets = JSON.stringify(this._fleets);
	},
	
	setRepair :function(data){
		this._repair = data;
		this._repairCount = 0;
		this._repair_ids = [];
		var ctr;
		for(ctr in this._repair){
			if( this._repair[ctr].api_state > -1 ){ this._repairCount++; }
			this._repair_ids.push( this._repair[ctr].api_ship_id );
		}
	},
	
	setBuild :function(data){
		this._build = data;
		this._buildCount = 0;
		var ctr;
		for(ctr in this._build){
			if( this._build[ctr].api_state > -1 ){
				this._buildCount++;
			}
		}
	}
	
};