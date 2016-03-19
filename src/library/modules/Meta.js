/* Meta.js
KC3改 Meta Data

Provides access to data on built-in JSON files
*/
(function(){
	"use strict";
	
	window.KC3Meta = {
		repo: "",
		
		_cache:{},
		_icons:{},
		_exp:{},
		_exp_ship:{},
		_gauges:{},
		_ship:{},
		_defeq:{},
		_slotitem:{},
		_quests:{},
		_ranks:{},
		_stype:{},
		_servers:{},
		_battle:{},
		_quotes:{},
		_terms:{
			troll:{},
			lang:{},
		},
		_edges:{},
		_defaultIcon:"",
		
		voiceKeys: [
			604825, 607300, 613847, 615318, 624009, 631856, 635451, 637218, 640529,
			643036, 652687, 658008, 662481, 669598, 675545, 685034, 687703, 696444,
			702593, 703894, 711191, 714166, 720579, 728970, 738675, 740918, 743009,
			747240, 750347, 759846, 764051, 770064, 773457, 779858, 786843, 790526,
			799973, 803260, 808441, 816028, 825381, 827516, 832463, 837868, 843091,
			852548, 858315, 867580, 875771, 879698, 882759, 885564, 888837, 896168
		],
		voiceMapping: [],
		
		/* Initialization
		-------------------------------------------------------*/
		init :function( repo ){
			this.repo = repo;
			/* to remove deprecated warning
				http://stackoverflow.com/questions/22090764/alternative-to-async-false-ajax
			*/
			
			// Load Common Meta
			this._icons		= JSON.parse( $.ajax(repo+'icons.json', { async: false }).responseText );
			this._exp		= JSON.parse( $.ajax(repo+'exp_hq.json', { async: false }).responseText );
			this._exp_ship	= JSON.parse( $.ajax(repo+'exp_ship.json', { async: false }).responseText );
			this._gauges	= JSON.parse( $.ajax(repo+'gauges.json', { async: false }).responseText );
			this._defeq		= JSON.parse( $.ajax(repo+'defeq.json', { async: false }).responseText );
			this._edges		= JSON.parse( $.ajax(repo+'edges.json', { async: false }).responseText );
			
			// Load Translations
			this._ship 		= KC3Translation.getJSON(repo, 'ships', true);
			this._slotitem	= KC3Translation.getJSON(repo, 'items', true);
			this._quests	= KC3Translation.getJSON(repo, 'quests', true);
			this._ranks		= KC3Translation.getJSON(repo, 'ranks', true);
			this._stype		= KC3Translation.getJSON(repo, 'stype', true);
			this._servers	= KC3Translation.getJSON(repo, 'servers', true);
			this._battle	= KC3Translation.getJSON(repo, 'battle', true);
			// troll language always loaded
			this._terms.troll		= JSON.parse( $.ajax(repo+'lang/data/troll/terms.json', { async: false }).responseText );
			// other language loaded here
			this._terms.lang		= KC3Translation.getJSON(repo, 'terms', true);
			
			var i, j, voiceFilename;
			for(i=0; i < 500; i++){
				for(j=0; j < 53; j++){
					voiceFilename = this.getFilenameByVoiceLine (i, j);
					this.voiceMapping[voiceFilename] = j;
				}
			}
		},
		
		loadQuotes :function(){
			this._quotes = KC3Translation.getJSON(this.repo, 'quotes', true);
		},
		
		/* Data Access
		-------------------------------------------------------*/
		defaultIcon :function(iconSrc){
			this._defaultIcon = iconSrc;
		},
		getIcon: function(id, empty) {
			if(this._icons.indexOf(id) > -1){
				var path = id >= 500 ? "abyss/" : "ships/";
				return "chrome-extension://"+chrome.runtime.id+"/assets/img/"+path+id+".png";
			}
			if(typeof empty == "undefined"){
				return this._defaultIcon;
			}
			return empty;
		},
		knownEnemy :function(id){
			return this._icons.indexOf(id) > -1;
		},
		
		formationIcon :function(formationId){
			return "../../../../assets/img/formation2/" + formationId + ".png";
		},
		
		formationText :function(formationId){
			return this._battle.formation[formationId] || "";
			// Moved to battle.json, 'formation' array.
			/*
			return [
				"",
				"Line Ahead",
				"Double Line",
				"Diamond",
				"Echelon",
				"Line Abreast",
				"","","","","",
				"Cruising Formation 1 (anti-sub)",
				"Cruising Formation 2 (forward)",
				"Cruising Formation 3 (anti-air)",
				"Cruising Formation 4 (full-power)",
				"","","","","","",
				"Cruising Formation 1 (anti-sub)",
				"Cruising Formation 2 (forward)",
				"Cruising Formation 3 (anti-air)",
				"Cruising Formation 4 (full-power)"
			][formationId];
			*/
		},
		
		shipName :function( jp_name ){
			// console.log( "---------request to TL---------", jp_name );
			//if(typeof jp_name == "undefined"){ return "Unknown ship"; }
			if(typeof this._cache[jp_name] !== "undefined"){ return this._cache[jp_name]; }
			if(typeof this._ship[jp_name] !== "undefined"){
				this._cache[jp_name] = this._ship[jp_name];
				return this._cache[jp_name];
			}
			if(Object.keys(this._ship).length === 0){
				return jp_name;
			}
			var
				bare = jp_name,
				combin = [],
				repTab = {
					"甲"   : '_A',
					"改二" : '_KaiNi',
					"改"   : '_Kai',
				},
				repRes = null,
				replaced = false;
			// in here, the regular expression will read which one comes first (which mean, to be in the end of the name
			// and then, the bare string will be chopped by how long the pattern match...
			// the matched one, added to the combination stack (FILO)
			// removing from the replacement table in order to prevent infinite loop ^^;
			// if there's no match, it'll instantly stop and return the actual value
			while( !!(repRes = (new RegExp(".+("+(Object.keys(repTab).join("|"))+")$",'gi')).exec(bare)) ){
				bare = bare.substr(0, bare.length-repRes[1].length);
				combin.unshift(this._ship[repTab[repRes[1]]]);
				delete repTab[repRes[1]];
				replaced = true;
			}
			// console.log("Remaining", bare, "with combination", combin.join(" "));
			if(replaced) {
				combin.unshift("");
				// console.log("this._ship", this._ship);
				// console.log("this._ship[bare]", this._ship[bare]);
				if(typeof this._ship[bare] !== "undefined"){
				} else {
					if (typeof this._cache[bare] !== "undefined") {
						this._cache[bare] = bare;
					}
				}
				
				this._cache[jp_name] = (this._ship[bare] || this._cache[bare] || bare) +
					(combin.length > 0 ? combin.join(" ") : "");
				return this._cache[jp_name] ;
				// console.log("this._cache[jp_name]", this._cache[jp_name]);
				// return this._cache[jp_name]; // being here means the jp_name is not cached. there's already a cache checker at the start of this function
			}
			// console.log("returning original:", jp_name);
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
		
		expShip :function(level){
			return this._exp_ship[level] || [0,0];
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
			return this._battle.detection[index] || ["","",""];
		},
		
		airbattle :function(index){
			return this._battle.airbattle[index] || ["","","Unknown"];
		},
		
		engagement :function(index){
			return this._battle.engagement[index] || ["","",""];
		},
		
		term: function(key) {
			return (ConfigManager.info_troll && this._terms.troll[key]) || this._terms.lang[key] || key;
		},

		nodeLetter : function(worldId, mapId, edgeId) {
			var map = this._edges["World " + worldId + "-" + mapId];
			if (typeof map !== "undefined") {
				var edge = map[edgeId];
				if (typeof edge !== "undefined") {
					return edge[1];	// return destination
				}
			}
			return edgeId;
		},
		
		/*
		Getting voice key by filename
		Source: がか (gakada)
		https://github.com/KC3Kai/KC3Kai/issues/1180#issuecomment-195947346
		*/
		getVoiceKeyByFilename :function(ship_id, filename){
			var k = 17 * (ship_id + 7), r = filename - 100000;
			for (var i = 0; i < 1000; ++i) { // 17 * (500 + 7) * 10000 / 99173 = 869
				var a = r + i * 99173;
				if (a % k === 0) {
					return a / k;
				}
			}
			return false; // log ship_id, filename somewhere
		},
		
		/*
		Get voice line number by filename
		Mapping idea from `poi-plugin-subtitle` by kcwikizh
		https://github.com/kcwikizh/poi-plugin-subtitle
		*/
		getVoiceLineByFilename :function(ship_id, filename){
			return this.voiceMapping[filename];
		},
		
		/*
		Getting new filename for ship voices
		Source: がか (gakada)
		http://kancolle.wikia.com/wiki/Thread:388946#30
		*/
		getFilenameByVoiceLine :function(ship_id, lineNum){
			return 100000 + 17 * (ship_id + 7) * (this.voiceKeys[lineNum] - this.voiceKeys[lineNum - 1]) % 99173;
		},
		
		// Subtitle quotes
		quote :function(identifier, voiceNum){
			if(identifier){
				if(typeof this._quotes[identifier] != "undefined"){
					if(typeof this._quotes[identifier][voiceNum] != "undefined"){
						return this._quotes[identifier][voiceNum];
					}else{
						return false;
					}
				}else{
					return false;
				}
			}else{
				return false;
			}
		}
	};
	
	window.KC3Meta.shipIcon = KC3Meta.getIcon;
	window.KC3Meta.abyssIcon = KC3Meta.getIcon;

})();
