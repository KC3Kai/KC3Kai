/* Meta.js
KC3改 Meta Data

Provides access to data on built-in JSON files
*/
(function(){
	"use strict";
	
	$.getTranslationJSON = function(language, filename, callback){
		var enJSON = {}, localJSON;
		
		$.ajax('/data/translations/en/' + filename + '.json', {
			dataType:	'json',
			success:	function(response){
				enJSON = response;
			},
			complete:	function(){
				if( language == 'en' ){
					console.log(enJSON);
					callback(enJSON);
				}else{
					$.ajax('/data/translations/' +language+ '/' + filename + '.json', {
						dataType:	'json',
						success:	function(data){
							localJSON = $.extend(true, enJSON, data);
						},
						complete:	function(){
							localJSON = localJSON || enJSON;
							console.log(localJSON);
							callback(localJSON);
						}
					});
				}
			}
		});
	};
	
	window.KC3Meta = {
		_cache:{},
		_icons:{},
		_exp:{},
		_gauges:{},
		_ship:{},
		_slotitem:{},
		_quests:{},
		_ranks:{},
		_stype:{},
		_servers:{},
		_battle:{},
		_record:{},
		_terms:{},
		_defaultIcon:"",
		
		/* Initialization
		-------------------------------------------------------*/
		init :function( repo ){
			var self = this;
			
			// Load Common Meta
			$.getJSON(repo+"icons.json", function(response){ self._icons = response; });
			$.getJSON(repo+"experience.json", function(response){ self._exp = response; });
			$.getJSON(repo+"gauges.json", function(response){ self._gauges = response; });
			
			// Load Translations
			var lang = ConfigManager.language || "en";
			/*
			$.getJSON(repo+"translations/"+lang+"/ships.json", function(response){ self._ship = response; });
			$.getJSON(repo+"translations/"+lang+"/items.json", function(response){ self._slotitem = response; });
			$.getJSON(repo+"translations/"+lang+"/quests.json", function(response){ self._quests = response; });
			$.getJSON(repo+"translations/"+lang+"/ranks.json", function(response){ self._ranks = response; });
			$.getJSON(repo+"translations/"+lang+"/stype.json", function(response){ self._stype = response; });
			$.getJSON(repo+"translations/"+lang+"/servers.json", function(response){ self._servers = response; });
			$.getJSON(repo+"translations/"+lang+"/battle.json", function(response){ self._battle = response; });
			$.getJSON(repo+"translations/"+lang+"/record.json", function(response){ self._record = response; });
			$.getJSON(repo+"translations/"+lang+"/terms.json", function(response){ self._terms = response; });
			*/
			$.getTranslationJSON(lang, 'ships', function(response){ self._ship = response; });
			$.getTranslationJSON(lang, 'items', function(response){ self._slotitem = response; });
			$.getTranslationJSON(lang, 'quests', function(response){ self._quests = response; });
			$.getTranslationJSON(lang, 'ranks', function(response){ self._ranks = response; });
			$.getTranslationJSON(lang, 'stype', function(response){ self._stype = response; });
			$.getTranslationJSON(lang, 'servers', function(response){ self._servers = response; });
			$.getTranslationJSON(lang, 'battle', function(response){ self._battle = response; });
			$.getTranslationJSON(lang, 'record', function(response){ self._record = response; });
			$.getTranslationJSON(lang, 'terms', function(response){ self._terms = response; });
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
			return "../../../../assets/img/formation/" + formationId + ".jpg";
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
					this._cache[jp_name] = this._ship[bare1]+" Kai";
					return this._cache[jp_name];
				}
			}
			if( jp_name.substr(jp_name.length-2, 2) == "改二" ){
				var bare2 = jp_name.substr(0, jp_name.length-2);
				if(typeof this._ship[bare2] !== "undefined"){
					this._cache[jp_name] = this._ship[bare2]+" Kai Ni";
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
		
		detection :function(index){
			return this._battle.detection[index] || ["",""];
		},
		
		airbattle :function(index){
			return this._battle.airbattle[index] || ["",""];
		},
		
		engagement :function(index){
			return this._battle.engagement[index] || ["",""];
		},
		
		record: function(key) {
			return this._record[key] || key;
		},
		
		term: function(key) {
			return this._terms[key] || key;
		}
	};
	
})();