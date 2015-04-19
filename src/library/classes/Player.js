KC3.prototype.Player  = {
	id: 0,
	name: "",
	desc: "",
	rank: "",
	level: 0,
	exp: [ 0, 0 ],
	fcoin: 0,
	
	torch: 0,
	buckets: 0,
	devmats: 0,
	screws: 0,
	
	resources: [0,0,0,0],
	
	_ships: [],
	_shipSlot: [0,0],
	
	_gears: [],
	_gearSlot: [0,0],
	
	_fleets: [],
	_fleetCount: 1,
	
	_repair: [],
	_repairCount: 2,
	_repair_ids: [],
	
	_build: [],
	_buildCount: 2,
	
	init :function(){
		this.loadLocal();
	},
	
	/* First login
	-------------------------------------*/
	login :function(){
		app.Logging.index = app.Server.ip + "." + this.id;
		app.Logging.Player({
			server: app.Server.name,
			mid: this.id,
			name: this.name
		});
	},
	
	/* Set new data
	-------------------------------------*/
	setBasic :function(data){
		if(this.id == 0){
			this.id =  data.mid;
			this.name =  data.name;
			this.login();
		}else{
			if(this.id != data.mid){
				localStorage.removeItem("player");
				app.Dashboard.state = "reload_panel";
				app.Dashboard.messageBox("changeuser");
				return false;
			}
		}
		
		this.desc = data.desc;
		this.rank = app.Meta.rank(data.rank);
		this.level = data.level;
		this.fcoin = data.fcoin;
		
		var ExpCurrLevel = app.Meta.exp( this.level )[1];
		var ExpNextLevel = app.Meta.exp( this.level+1 )[1];
		var exp_percent = (data.exp - ExpCurrLevel) / (ExpNextLevel - ExpCurrLevel);
		var exp_next = ExpNextLevel - data.exp;
		this.exp = [ exp_percent, exp_next ];
	},
	
	setShips :function(shipList){
		var ctr;
		this._ships = [];
		for(ctr in shipList){
			if(!!shipList[ctr]){
				this._ships[shipList[ctr].api_id] = shipList[ctr];
			}
		}
		this._shipSlot[0] = this._ships.length;
	},
	
	setShipsSafe :function(shipList){
		var ctr;
		for(ctr in shipList){
			this._ships[shipList[ctr].api_id] = shipList[ctr];
		}
	},
	
	setGears :function(gearList){
		var ctr;
		this._gears = [];
		this._gearSlot[0] = 0;
		for(ctr in gearList){
			this._gearSlot[0]++;
			if(!!gearList[ctr]){
				this._gears[gearList[ctr].api_id] = gearList[ctr];
			}
		}
	},
	
	setGearsSafe :function(gearList){
		var ctr;
		for(ctr in gearList){
			this._gearSlot[0]++;
			this._gears[gearList[ctr].api_id] = gearList[ctr];
		}
		this._gearSlot[0] = this._gears.length;
	},
	
	setResource :function(data){
		this.resources = data;
		app.Logging.Resource(data);
	},
	
	setUseitem :function(data){
		this.torch = data.torch;
		this.buckets = data.buckets;
		this.devmats = data.devmats;
		this.screws = data.screws;
		app.Logging.Useitem(data);
	},
	
	setFleets :function(data){
		this._fleets = data;
	},
	
	setRepairDocks :function(data){
		this._repair = data;
		
		this._repairCount = 0;
		this._repair_ids = [];
		var ctr;
		for(ctr in this._repair){
			if( this._repair[ctr].api_state > -1 ){ this._repairCount++; }
			this._repair_ids.push( this._repair[ctr].api_ship_id );
		}
		console.log("this._repair");
		console.log(this._repair);
	},
	
	setBuildDocks :function(data){
		this._build = data;
		
		this._buildCount = 0;
		var ctr;
		for(ctr in this._build){
			if( this._build[ctr].api_state > -1 ){
				this._buildCount++;
			}
		}
		
		console.log("this._build");
		console.log(this._build);
	},
	
	/* Save/Load Local Storage
	-------------------------------------*/
	loadLocal :function(){
		if(typeof localStorage["player"] !== "undefined"){
			var tmpData = JSON.parse(localStorage["player"]);
			this.id 		= tmpData.id;
			this.name 		= tmpData.name;
			this.setShips(tmpData.ships);
			this.setGears(tmpData.gears);
		}
	},
	
	saveLocal :function(){
		localStorage["player"] = JSON.stringify({
			id		: this.id,
			name	: this.name,
			ships	: this._ships,
			gears	: this._gears,
		});
	}
};