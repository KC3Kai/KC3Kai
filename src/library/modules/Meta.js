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
		_shipAffix:{},
		_defeq:{},
		_slotitem:{},
		_useitems:{},
		_equiptype:[],
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
		_nodes:{},
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
		specialShipVoices: {
			// Graf Zeppelin (Kai):
			//   17:Yasen(2) is replaced with 917. might map to 17, but not for now;
			//   18 still used at day as random Attack, 918 used at night opening
			432: {917: 917, 918: 918},
			353: {917: 917, 918: 918}
		},
		
		abyssKaiShipIds: [
			1565, 1566, 1567, 1616, 1617, 1618, 1714, 1715, 1734, 1735
		],
		abyssNonBossIds: [
			1541, 1542, 1543, 1549, 1550, 1551, 1552, 1553, 1554, 1555,
			1558, 1559, 1560, 1561, 1562, 1563, 1564, 1570, 1571, 1572,
			1575, 1576, 1577, 1578, 1579, 1580, 1591, 1592, 1593, 1594,
			1595, 1614, 1615, 1621, 1622, 1623, 1624, 1637, 1638, 1639,
			1640, 1665, 1666, 1667
		],
		
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
			this._nodes		= JSON.parse( $.ajax(repo+'nodes.json', { async: false }).responseText );
			this._tpmult	= JSON.parse( $.ajax(repo+'tp_mult.json', { async: false }).responseText );
			this._gunfit	= JSON.parse( $.ajax(repo+'gunfit.json', { async: false }).responseText );
			
			// Load Translations
			this._ship 		= KC3Translation.getJSON(repo, 'ships', true);
			this._shipAffix	= KC3Translation.getJSON(repo, 'ship_affix', true);
			this._slotitem	= KC3Translation.getJSON(repo, 'items', true);
			this._useitems	= KC3Translation.getJSON(repo, 'useitems', true);
			this._equiptype	= KC3Translation.getJSON(repo, 'equiptype', true);
			this._quests	= KC3Translation.getJSON(repo, 'quests', true);
			this._ranks		= KC3Translation.getJSON(repo, 'ranks', true);
			this._stype		= KC3Translation.getJSON(repo, 'stype', true);
			this._servers	= KC3Translation.getJSON(repo, 'servers', true);
			this._battle	= KC3Translation.getJSON(repo, 'battle', true);
			// troll language always loaded
			this._terms.troll		= JSON.parse( $.ajax(repo+'lang/data/troll/terms.json', { async: false }).responseText );
			// other language loaded here
			this._terms.lang		= KC3Translation.getJSON(repo, 'terms', true);
			return this;
		},
		
		loadQuotes :function(){
			this._quotes = KC3Translation.getQuotes(this.repo);
			return this;
		},
		
		reloadQuests :function(){
			this._quests = KC3Translation.getJSON(this.repo, "quests", true);
			return this;
		},
		
		/* Data Access
		-------------------------------------------------------*/
		defaultIcon :function(iconSrc){
			this._defaultIcon = iconSrc;
			return this;
		},
		getIcon: function(id, empty) {
			id = Number(id);
			if(this._icons.indexOf(id) > -1){
				var path = KC3Master.isAbyssalShip(id) ? "abyss/" : "ships/";
				// Devs bump 1000 for master ID of abyssal ships from 2017-04-05
				// To prevent mess file renaming for images, patch it here.
				id = path === "abyss/" ? id - 1000 : id;
				return "chrome-extension://"+chrome.runtime.id+"/assets/img/"+path+id+".png";
			}
			if(typeof empty === "undefined"){
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
		
		shipNameAffix :function(affix){
			// Just translate the prefixes and suffixes in `ship_affix.json`
			// And keep the necessary space after or before the affixes
			return this._shipAffix[affix] || {};
		},
		
		shipName :function(jpName){
			// No translation needed for empty ship.json like JP
			if(Object.keys(this._ship).length === 0){ return jpName; }
			// If translation and combination done once, use the cache instantly
			if(typeof this._cache[jpName] !== "undefined"){ return this._cache[jpName]; }
			// If full string matched, no combination needed
			if(typeof this._ship[jpName] !== "undefined"){
				this._cache[jpName] = this._ship[jpName];
				return this._cache[jpName];
			}
			var root = jpName,
				combinedPrefixes = [],
				prefixesList = Object.keys(this.shipNameAffix("prefixes")),
				combinedSuffixes = [],
				suffixesList = Object.keys(this.shipNameAffix("suffixes")),
				occurs = [],
				replaced = false;
			/**********************************************
			// To combine the translations of root name and prefix/suffix,
			// the regular expression will read which one comes first,
			// which mean the prefixes and suffixes in the ship name.
			// and then, the root string will be chopped to remove the affixes,
			// the matched one, added to the combination stack (FILO)
			// removing from the replacement table in order to prevent infinite loop.
			// if there's no match, it'll instantly stop and return the actual value.
			***********************************************/
			if(prefixesList.length > 0){
				while( !!(occurs = (new RegExp("^("+prefixesList.join("|")+").+$","i")).exec(root)) ){
					root = root.replace(new RegExp("^"+occurs[1],"i"), "");
					combinedPrefixes.unshift(this.shipNameAffix("prefixes")[occurs[1]]);
					prefixesList.splice(prefixesList.indexOf(occurs[1]), 1);
					replaced = true;
				}
			}
			if(suffixesList.length > 0){
				while( !!(occurs = (new RegExp(".+("+suffixesList.join("|")+")$","i")).exec(root)) ){
					root = root.replace(new RegExp(occurs[1]+"$","i"), "");
					combinedSuffixes.unshift(this.shipNameAffix("suffixes")[occurs[1]]);
					suffixesList.splice(suffixesList.indexOf(occurs[1]), 1);
					replaced = true;
				}
			}
			if(replaced){
				// Put combined name into cache
				this._cache[jpName] = [
					(combinedPrefixes.length > 0 ? combinedPrefixes.join("") : "") ,
					(this._ship[root] || root) ,
					(combinedSuffixes.length > 0 ? combinedSuffixes.join("") : "")
				].join("");
				return this._cache[jpName];
			}
			return root;
		},
		
		shipReadingName :function(jpYomi){
			// Translate api_yomi, might be just Romaji. Priorly use yomi in affix
			return this.shipNameAffix("yomi")[jpYomi] || this.shipName(jpYomi);
		},
		
		gearName :function(jpName){
			if(typeof this._slotitem[jpName] !== "undefined"){
				return this._slotitem[jpName];
			}
			return jpName;
		},
		
		gearTypeName :function(categoryType, categoryId){
			if(typeof categoryType === "undefined"){
				return this._equiptype || [[],[],[],[],[]];
			}
			if(typeof categoryId === "undefined"){
				return this._equiptype[categoryType] || [];
			}
			return this._equiptype[categoryType][categoryId] || "";
		},
		
		useItemName :function(id){
			return this._useitems[id] || (KC3Master.useitem(id) || {}).api_name || "";
		},
		
		abyssShipName :function(ship){
			var shipMaster = ship;
			if(!shipMaster.api_name){
				shipMaster = KC3Master.ship(Number(ship));
			}
			return [this.shipName(shipMaster.api_name), this.shipReadingName(shipMaster.api_yomi)]
				.filter(function(x){return !!x&&x!=="-";})
				.join("");
		},
		
		abyssShipBorderClass :function(ship){
			var shipMaster = ship;
			// No ship specified, return all possible class names
			if(!ship){
				return ["boss", "kai", "flagship", "elite"];
			}
			if(typeof shipMaster !== "object"){
				shipMaster = KC3Master.ship(Number(ship));
			}
			// Abyssal Kai
			if(this.abyssKaiShipIds.indexOf(shipMaster.api_id) > -1){
				return "kai";
			}
			// Princesses and demons, using black-list
			// To reduce updating work, consider new abyssal ships as boss by default
			if(shipMaster.api_id > (KC3Master.abyssalShipIdFrom + 38) &&
				this.abyssNonBossIds.indexOf(shipMaster.api_id) < 0){
				return "boss";
			}
			return KC3Master.isAbyssalShip(shipMaster.api_id) ? shipMaster.api_yomi.replace("-", "") : "";
		},
		
		shipSpeed :function(apiSoku, returnTerm){
			var speedTermsMap = {"0":"SpeedLand", "5":"SpeedSlow", "10":"SpeedFast", "15":"SpeedFaster", "20":"SpeedFastest"};
			var term = speedTermsMap[apiSoku] || "Unknown";
			return !returnTerm ? this.term(term) : term;
		},
		
		shipRange :function(apiLeng, returnTerm){
			var rangeTermsMap = {"1":"RangeShort", "2":"RangeMedium", "3":"RangeLong", "4":"RangeVeryLong"};
			var term = rangeTermsMap[apiLeng] || "Unknown";
			return !returnTerm ? this.term(term) : term;
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
			var eq = WhoCallsTheFleetDb.getEquippedSlotCount(id);
			// Just return 0 if wanna remove _defeq json
			return eq !== false ? eq : (this._defeq["s" + id] || 0);
		},
		
		battleSeverityClass :function(battleArray){
			return (Array.isArray(battleArray) && battleArray[0].length >= 2) ?
				battleArray.map(function(e){if(!!e[1]) return e[1];})
					.reduce(function(p, c){if(!!c && p.indexOf(c) < 0) p.push(c);
						return p;}, []).join(" ")
				: "";
		},
		
		support :function(index){
			return (typeof index === "undefined") ? this._battle.support :
				this._battle.support[index] || "";
		},
		
		detection :function(index){
			return (typeof index === "undefined") ? this._battle.detection :
				this._battle.detection[index] || ["","",""];
		},
		
		airbattle :function(index){
			return (typeof index === "undefined") ? this._battle.airbattle :
				this._battle.airbattle[index] || ["","","Unknown"];
		},
		
		airraiddamage :function(index){
			return (typeof index === "undefined") ? this._battle.airraiddamage :
				this._battle.airraiddamage[index] || "";
		},
		
		engagement :function(index){
			return (typeof index === "undefined") ? this._battle.engagement :
				this._battle.engagement[index] || ["","",""];
		},
		
		aacitype :function(index){
			return (typeof index === "undefined") ? this._battle.aacitype :
				this._battle.aacitype[index] || [];
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
		
		nodeLetters : function(worldId, mapId) {
			var map = this._nodes["World " + worldId + "-" + mapId];
			if (typeof map !== "undefined" && !!map.letters) {
				return map.letters;
			}
			return {};
		},
		
		nodeMarkers : function(worldId, mapId) {
			var map = this._nodes["World " + worldId + "-" + mapId];
			if (typeof map !== "undefined" && !!map.markers) {
				return map.markers;
			}
			return [];
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
			// Some ships use special voice line filenames
			var specialMap = this.specialShipVoices[ship_id];
			if(specialMap && specialMap[filename]){
				return specialMap[filename];
			}
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
		Latest workingDiffs('vcKey') and algorithm can be found at decompiled swf:
		  Core.swf/common.util.SoundUtil.createFileName
		*/
		getFilenameByVoiceLine :function(ship_id, lineNum){
			return lineNum <= 53 ? 100000 + 17 * (ship_id + 7) * (this.workingDiffs[lineNum - 1]) % 99173 : lineNum;
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
				//console.debug("Quote this.specialDiffs["+voiceNum+"] =", specialVoiceNum);
				var specialVoiceLine = lookupVoice(specialVoiceNum);
				if (specialVoiceLine) {
					//console.debug("Quote using special default:", specialVoiceLine);
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
