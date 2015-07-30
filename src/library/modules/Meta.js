/* Meta.js
KC3改 Meta Data

Provides access to data on built-in JSON files
*/
(function(){
	"use strict";
	
	window.KC3Meta = {
		_cache:{},
		_icons:{},
		_exp:{},
		_gauges:{},
		_ship:{},
		_defeq:{},
		_slotitem:{},
		_quests:{},
		_ranks:{},
		_stype:{},
		_servers:{},
		_battle:{},
		_terms:{},
		_defaultIcon:"",
		
		/* Initialization
		-------------------------------------------------------*/
		init :function( repo ){
			// Load Common Meta
			this._icons		= JSON.parse( $.ajax(repo+'icons.json', { async: false }).responseText );
			this._exp		= JSON.parse( $.ajax(repo+'experience.json', { async: false }).responseText );
			this._gauges	= JSON.parse( $.ajax(repo+'gauges.json', { async: false }).responseText );
			this._defeq		= JSON.parse( $.ajax(repo+'defeq.json', { async: false }).responseText );
			
			// Load Translations
			this._ship 		= KC3Translation.getJSON(repo, 'ships', true);
			this._slotitem	= KC3Translation.getJSON(repo, 'items', true);
			this._quests	= KC3Translation.getJSON(repo, 'quests', true);
			this._ranks		= KC3Translation.getJSON(repo, 'ranks', true);
			this._stype		= KC3Translation.getJSON(repo, 'stype', true);
			this._servers	= KC3Translation.getJSON(repo, 'servers', true);
			this._battle	= KC3Translation.getJSON(repo, 'battle', true);
			this._terms		= KC3Translation.getJSON(repo, 'terms');
		},
		
		/* Data Access
		-------------------------------------------------------*/
		defaultIcon :function(iconSrc){
			this._defaultIcon = iconSrc;
		},
		
		shipIcon :function(id, empty){
			if(typeof this._icons[id] !== "undefined"){
				return "http://i708.photobucket.com/albums/ww87/dragonjet25/KC3%20Ship%20Icons/"+this._icons[id];
			}
			if(typeof empty == "undefined"){
				return this._defaultIcon;
			}
			return empty;
		},
		
		abyssIcon :function(id, empty){
			if(typeof this._icons[id] !== "undefined"){
				return "http://i708.photobucket.com/albums/ww87/dragonjet25/KC3%20Abyss%20Icons/"+this._icons[id];
			}
			if(typeof empty == "undefined"){
				return this._defaultIcon;
			}
			return empty;
		},
		
		formationIcon :function(formationId){
			return "../../../../assets/img/formation2/" + formationId + ".png";
		},
		
		formationText :function(formationId){
			return [
				"",
				"Line Ahead",
				"Double Line",
				"Diamond",
				"Echelon",
				"Line Abreast"
			][formationId];
		},
		
		shipName :function( jp_name ){
			if(typeof this._cache[jp_name] !== "undefined"){ return this._cache[jp_name]; }
			if(typeof this._ship[jp_name] !== "undefined"){
				this._cache[jp_name] = this._ship[jp_name];
				return this._cache[jp_name];
			}
			if( jp_name.substr(jp_name.length-1, 1) == "改" ){
				var bare1 = jp_name.substr(0, jp_name.length-1);
				if(typeof this._ship[bare1] !== "undefined"){
					this._cache[jp_name] = this._ship[bare1] + " " + this._ship._Kai;
					return this._cache[jp_name];
				}
			}
			if( jp_name.substr(jp_name.length-2, 2) == "改二" ){
				var bare2 = jp_name.substr(0, jp_name.length-2);
				if(typeof this._ship[bare2] !== "undefined"){
					this._cache[jp_name] = this._ship[bare2] + " " + this._ship._KaiNi;
					return this._cache[jp_name];
				}
			}
			return jp_name;
		},
		
		gearName :function( jp_name ){
			if(typeof this._slotitem[ jp_name ] !== "undefined"){
				return this._slotitem[ jp_name ];
			}
			return jp_name;
		},
		
		exp :function(level){
			return this._exp[level] || [0,0];
		},
		
		quest :function(id){
			return this._quests[id] || false;
		},
		
		rank :function(id){
			return this._ranks[id] || "Unknown Rank";
		},
		
		stype :function(id){
			return this._stype[id] || "??";
		},
		
		server :function(ip){
			return this._servers[ip] || {name:"Unknown Server", num:0, ip:ip };
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
			return this._gauges["m"+map_id] || false;
		},
		
		defaultEquip :function(id){
			if (typeof this._defeq["s" + id] == "undefined") {
				console.log("No ship has master id " + id + " in defeq.json");
			}
			return this._defeq["s" + id] || 0;
		},

		detection :function(index){
			return this._battle.detection[index] || ["",""];
		},
		
		airbattle :function(index){
			return this._battle.airbattle[index] || ["",""];
		},
		
		engagement :function(index){
			return this._battle.engagement[index] || ["",""];
		},
		
		term: function(key) {
			return this._terms[key] || key;
		}
	};
	
})();