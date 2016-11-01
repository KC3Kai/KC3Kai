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
		_tpmult:{},
		_edges:{},
		_gunfit:{},
		_defaultIcon:"",
		
		voiceDiffs: [
			2475,    0,    0, 8691, 7847, 3595, 1767, 3311, 2507,
			9651, 5321, 4473, 7117, 5947, 9489, 2669, 8741, 6149,
			1301, 7297, 2975, 6413, 8391, 9705, 2243, 2091, 4231,
			3107, 9499, 4205, 6013, 3393, 6401, 6985, 3683, 9447,
			3287, 5181, 7587, 9353, 2135, 4947, 5405, 5223, 9457,
			5767, 9265, 8191, 3927, 3061, 2805, 3273, 7331
		],
		workingDiffs: [
			2475, 6547, 1471, 8691, 7847, 3595, 1767, 3311, 2507,
			9651, 5321, 4473, 7117, 5947, 9489, 2669, 8741, 6149,
			1301, 7297, 2975, 6413, 8391, 9705, 2243, 2091, 4231,
			3107, 9499, 4205, 6013, 3393, 6401, 6985, 3683, 9447,
			3287, 5181, 7587, 9353, 2135, 4947, 5405, 5223, 9457,
			5767, 9265, 8191, 3927, 3061, 2805, 3273, 7331
		],
		specialDiffs: {
			"1555": 2, // valentines 2016, hinamatsuri 2015
			"3347": 3, // valentines 2016, hinamatsuri 2015
			"6547": 2, // whiteday 2015
			"1471": 3 // whiteday 2015
		},
		
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
			this._tpmult	= JSON.parse( $.ajax(repo+'tp_mult.json', { async: false }).responseText );
			this._gunfit	= JSON.parse( $.ajax(repo+'gunfit.json', { async: false }).responseText );
			
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
		},
		
		loadQuotes :function(){
			this._quotes = KC3Translation.getQuotes(this.repo);
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
					"甲"    : '_A',
					"乙"    : '_B',
					"丙"    : '_C',
					"丁"    : '_D',
					"改二"  : '_KaiNi',
					"改"    : '_Kai',
					" zwei" : '_Zwei',
					" drei" : '_Drei'
				},
				repRes = null,
				replaced = false;
			// in here, the regular expression will read which one comes first (which mean, to be in the end of the name
			// and then, the bare string will be chopped by how long the pattern match...
			// the matched one, added to the combination stack (FILO)
			// removing from the replacement table in order to prevent infinite loop ^^;
			// if there's no match, it'll instantly stop and return the actual value
			// just translate the items start with '_' in ships.json, and keep the necessary prefix space
			while( !!(repRes = (new RegExp(".+("+(Object.keys(repTab).join("|"))+")$",'gi')).exec(bare)) ){
				bare = bare.substr(0, bare.length-repRes[1].length);
				combin.unshift(this._ship[repTab[repRes[1]]]);
				delete repTab[repRes[1]];
				replaced = true;
			}
			// console.log("Remaining", bare, "with combination", combin.join(" "));
			if(replaced) {
				// console.log("this._ship", this._ship);
				// console.log("this._ship[bare]", this._ship[bare]);
				if(typeof this._ship[bare] !== "undefined"){
				} else {
					if (typeof this._cache[bare] !== "undefined") {
						this._cache[bare] = bare;
					}
				}
				
				this._cache[jp_name] = (this._ship[bare] || this._cache[bare] || bare) +
					(combin.length > 0 ? combin.join("") : "");
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
		
		abyssShipName :function(ship){
			var shipMaster = ship;
			if(!shipMaster.api_name){
				shipMaster = KC3Master.ship(Number(ship));
			}
			return [this.shipName(shipMaster.api_name), this.shipName(shipMaster.api_yomi)]
				.filter(function(x){return !!x&&x!=="-";})
				.join("");
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

		support :function(index){
			return this._battle.support[index] || "";
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
		
		tpObtained : function(kwargs) {
			function addTP(tp) {
				var args = [].slice.call(arguments,1);
				for(var i in args) {
					var data = args[i];
					tp.value += data.value;
					tp.clear = tp.clear && data.clear;
				}
				return tp;
			}
			var tpData = {
				value:0,
				clear:true,
				add:function(){return addTP.apply(null,[this].concat([].slice.call(arguments)));},
				valueOf:function(){return this.clear ? this.value : NaN;},
				toString:function(){return [(this.clear ? this.value : '??'),"TP"].join(" ");}
			};

			var getSType = (function(){
				var tpBase = $.extend({},tpData);
				function getSType(stype) {
					var
						map  = KC3Meta._tpmult.stype,
						data = map[stype],
						tprs = $.extend({},tpBase);
					switch(typeof data) {
						case 'number':
							tprs.value = (tprs.clear = isFinite(data) && !isNaN(data)) ? data : tprs.value;
						break;
						default:
							tprs.clear = false;
					}
					return tprs;
				}
				return getSType;
			}).call(this);
			var getSlot = (function(){
				var tpBase = $.extend({},tpData);
				function getSlot(slot) {
					var
						map  = KC3Meta._tpmult.slots,
						data = map[slot],
						tprs = $.extend({},tpBase);
					switch(typeof data) {
						case 'number':
							tprs.value = (tprs.clear = isFinite(data) && !isNaN(data)) ? data : tprs.value;
						break;
					}
					return tprs;
				}
				return getSlot;
			}).call(this);

			kwargs = $.extend({stype:0,slots:[]},kwargs);
			kwargs.stype = parseInt(kwargs.stype,10);
			if(arguments.length == 1) {
				tpData.add( getSType(kwargs.stype) );
				kwargs.slots.forEach(function(slotID){
					tpData.add( getSlot(slotID) );
				});
			}
			return tpData;
		},

		/*
		Getting voice key by filename
		Source: がか (gakada)
		https://github.com/KC3Kai/KC3Kai/issues/1180#issuecomment-195947346
		*/
		getVoiceDiffByFilename :function(ship_id, filename){
			ship_id = parseInt(ship_id, 10);
			var k = 17 * (ship_id + 7), r = filename - 100000;
			for (var i = 0; i < 1000; ++i) {
				var a = r + i * 99173;
				if (a % k === 0) {
					return a / k;
				}
			}
			return false;
		},
		
		/*
		ENTYPOINT: SUBTITLES
		Get voice line number by filename
		*/
		getVoiceLineByFilename :function(ship_id, filename){
			var computedDiff = this.getVoiceDiffByFilename(ship_id, filename);
			var computedIndex = this.voiceDiffs.indexOf(computedDiff);
			// If computed diff is not in voiceDiffs, return the computedDiff itself so we can lookup quotes via voiceDiff
			return computedIndex > -1 ? computedIndex+1 : computedDiff;
		},
		
		/*
		ENTYPOINT: LIBRARY
		Getting new filename for ship voices
		Source: がか (gakada)
		https://github.com/KC3Kai/KC3Kai/issues/1180#issuecomment-195654746
		*/
		getFilenameByVoiceLine :function(ship_id, lineNum){
			return 100000 + 17 * (ship_id + 7) * (this.workingDiffs[lineNum - 1]) % 99173;
		},
		
		// Subtitle quotes
		quote :function(identifier, voiceNum){
			if (!identifier) return false;

			var quoteTable = this._quotes[identifier];
			if(typeof quoteTable === "undefined") return false;

			function lookupVoice(vNum) {
				if (typeof vNum === "undefined")
					return false;
				var retVal = quoteTable[vNum];
				return typeof retVal !== "undefined" ? retVal : false;
			}

			var voiceLine = lookupVoice(voiceNum);
			if (voiceLine) return voiceLine;

			if (identifier !== "timing" ){
				// no quote for that voice line, check if it's a seasonal line
				var specialVoiceNum = this.specialDiffs[voiceNum];
				// check if default for seasonal line exists
				console.debug("this.specialDiffs["+voiceNum+"] =", specialVoiceNum);
				var specialVoiceLine = lookupVoice(specialVoiceNum);
				if (specialVoiceLine) {
					console.debug("using special default:", specialVoiceLine);
					return specialVoiceLine;
				}
			}
			return false;
		},
		
		gunfit :function(shipMstId, itemMstId){
			if (typeof this._gunfit[shipMstId+""] == "undefined") {
				return false;
			}
			
			if (typeof itemMstId != "undefined") {
				if (typeof this._gunfit[shipMstId+""][itemMstId+""] != "undefined") {
					return this._gunfit[shipMstId+""][itemMstId+""];
				} else {
					return false;
				}
			} else {
				return this._gunfit[shipMstId+""];
			}
		}
	};
	
	window.KC3Meta.shipIcon = KC3Meta.getIcon;
	window.KC3Meta.abyssIcon = KC3Meta.getIcon;

})();
