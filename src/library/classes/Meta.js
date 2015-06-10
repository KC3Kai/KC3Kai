KC3.prototype.Meta = {
	_cache: [],
	_hqexp: [],
	_quests: [],
	_ranks: [],
	_stype: [],
	_ship: [],
	_slotitem: [],
	_servers: [],
	_gauges: {},
	_battle: {},
	_terms: {},
	_record: {},
	
	/* Initialize Translation Data
	-------------------------------------------------------*/
	init: function(repo){
		var self = this;
		
		// Get language chosen
		var lang = app.Config.language || "en";
		
		// Load Game Metadata
		$.getJSON(repo+"experience.json", function(response){ self._hqexp = response; });
		$.getJSON(repo+"gauges.json", function(response){ self._gauges = response; });
		
		// Load Translations
		$.getJSON(repo+"translations/"+lang+"/ships.json", function(response){ self._ship = response; });
		$.getJSON(repo+"translations/"+lang+"/items.json", function(response){ self._slotitem = response; });
		$.getJSON(repo+"translations/"+lang+"/terms.json", function(response){ self._terms = response; });
		$.getJSON(repo+"translations/"+lang+"/quests.json", function(response){ self._quests = response; });
		$.getJSON(repo+"translations/"+lang+"/ranks.json", function(response){ self._ranks = response; });
		$.getJSON(repo+"translations/"+lang+"/stype.json", function(response){ self._stype = response; });
		$.getJSON(repo+"translations/"+lang+"/servers.json", function(response){ self._servers = response; });
		$.getJSON(repo+"translations/"+lang+"/battle.json", function(response){ self._battle = response; });
		$.getJSON(repo+"translations/"+lang+"/record.json", function(response){ self._record = response; });
	},
	
	
	/* Retrive common items
	-------------------------------------------------------*/
	exp :function(level){
		if(typeof this._hqexp[level] != "undefined"){ return this._hqexp[level]; }
		return [0,0];
	},
	
	quest :function(id){
		if(typeof this._quests[id] != "undefined"){ return this._quests[id]; }
		return false;
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
	
	serverByNum :function(num){
		var ctr;
		for(ctr in this._servers){
			if(this._servers[ctr].num==num){
				return this._servers[ctr];
			}
		}
		return {name:"Unknown Server", num:num, ip:"0.0.0.0" };
	},
	
	gauge :function(map_id){
		if(typeof this._gauges["m"+map_id] != "undefined"){ return this._gauges["m"+map_id]; }
		return 4;
	},
	
	detection :function(index){
		if(typeof this._battle.detection[index] != "undefined"){ return this._battle.detection[index]; }
		return ["",""];
	},
	
	airbattle :function(index){
		if(typeof this._battle.airbattle[index] != "undefined"){ return this._battle.airbattle[index]; }
		return ["",""];
	},
	
	engagement :function(index){
		if(typeof this._battle.engagement[index] != "undefined"){ return this._battle.engagement[index]; }
		return ["",""];
	},
	
	term :function( rootWord ){
		if(typeof this._terms[rootWord] != "undefined"){ return this._terms[rootWord]; }
		return rootWord;
	},

	record: function(key) {
		return this._record[key] || key;
	},
	
	
	/* Translate Gateway
	-------------------------------------------------------*/
	translate: function(jp_name, dtype){
		switch(dtype){
			case "ship": return this.ship(jp_name);
			default: return this.generic(jp_name);
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
	
};