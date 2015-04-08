KC3.prototype.Meta = {
	_cache: [],
	_hqexp: [],
	_quests: [],
	_ranks: [],
	_stype: [],
	_ship: [],
	_slotitem: [],
	_servers: [],
	
	/* Initialize Translation Data
	-------------------------------------------------------*/
	init: function(repo){
		var self = this;
		
		// Load Game Metadata
		$.getJSON(repo+"experience.json", function(response){ self._hqexp = response; });
		$.getJSON(repo+"quests.json", function(response){ self._quests = response; });
		$.getJSON(repo+"ranks.json", function(response){ self._ranks = response; });
		$.getJSON(repo+"stype.json", function(response){ self._stype = response; });
		$.getJSON(repo+"servers.json", function(response){ self._servers = response; });
		
		// Load Translations
		$.getJSON(repo+"translations/ships.json", function(response){ self._ship = response; });
		$.getJSON(repo+"translations/items.json", function(response){ self._slotitem = response; });
	},
	
	
	/* Retrive common items
	-------------------------------------------------------*/
	exp :function(level){
		if(typeof this._hqexp[level] != "undefined"){ return this._hqexp[level]; }
		return [0,0];
	},
	
	quest :function(id){
		if(typeof this._quests[id] != "undefined"){ return this._quests[id]; }
		return { name: "Unknown Quest", desc: "" };
	},
	
	rank :function(id){
		if(typeof this._ranks[id] != "undefined"){ return this._ranks[id]; }
		return "Unknown Rank";
	},
	
	stype :function(id){
		if(typeof this._stype[id] != "undefined"){ return this._stype[id]; }
		return "??";
	},
	
	server :function(ip){
		if(typeof this._servers[ip] != "undefined"){ return this._servers[ip]; }
		return {name:"Unknown Server", num:0, ip:ip };
	},
	
	
	/* Translate Gateway
	-------------------------------------------------------*/
	translate: function(jp_name, dtype){
		switch(dtype){
			case "ship": return this.ship(jp_name); break;
			default: return this.generic(jp_name); break;
		}
	},
	
	generic :function(jp_name){
		if(this._ship !== false){
			if(typeof this._ship[jp_name] !== "undefined"){
				return this._ship[jp_name];
			}
		}
		if(this._slotitem !== false){
			if(typeof this._slotitem[jp_name] !== "undefined"){
				return this._slotitem[jp_name];
			}
		}
	},
	
	ship :function(jp_name){
		// Check on cache
		if(typeof this._cache[jp_name] !== "undefined"){ return this._cache[jp_name]; }
		
		// Check if source data exists
		if(this._ship === false){ return jp_name; }
		
		// Bare translation
		if(typeof this._ship[jp_name] !== "undefined"){
			this._cache[jp_name] = this._ship[jp_name];
			return this._cache[jp_name];
		}
		
		// Check if KAI
		if( jp_name.substr(jp_name.length-1, 1) == "改" ){
			var bare1 = jp_name.substr(0, jp_name.length-1);
			if(typeof this._ship[bare1] !== "undefined"){
				this._cache[jp_name] = this._ship[bare1]+" Kai";
				return this._cache[jp_name];
			}
		}
		
		// Check if KAI NI
		if( jp_name.substr(jp_name.length-2, 2) == "改二" ){
			var bare2 = jp_name.substr(0, jp_name.length-2);
			if(typeof this._ship[bare2] !== "undefined"){
				this._cache[jp_name] = this._ship[bare2]+" Kai2";
				return this._cache[jp_name];
			}
		}
		
		// Nothing works, return japanese name
		this._cache[jp_name] = jp_name;
		
		return this._cache[jp_name];
	}
	
}