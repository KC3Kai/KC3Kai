/* Meta.js
KC3改 Meta Data

Provides access to data on built-in JSON files
*/
(function(){
	"use strict";
	
	window.KC3Meta = {
		repo: "",
		
		_cache:{},
		_icons:[],
		_seasonal:[],
		_exp:{},
		_expShip:{},
		_ship:{},
		_shipAffix:{},
		_slotitem:{},
		_useitems:[],
		_equiptype:[],
		_quests:{},
		_ranks:[],
		_stype:[],
		_ctype:[],
		_servers:{},
		_battle:{},
		_quotes:{},
		_quotesSize:{},
		_terms:{
			troll:{},
			lang:{},
		},
		_dataColle:{},
		_eventColle:{},
		_edges:{},
		_edgesOld:{},
		_nodes:{},
		_gunfit:{},
		_defaultIcon:"",
		
		// Following constants nearly unchanged if no furthermore research (decompile) done
		resourceKeys: [
			6657, 5699, 3371, 8909, 7719, 6229, 5449, 8561, 2987, 5501,
			3127, 9319, 4365, 9811, 9927, 2423, 3439, 1865, 5925, 4409,
			5509, 1517, 9695, 9255, 5325, 3691, 5519, 6949, 5607, 9539,
			4133, 7795, 5465, 2659, 6381, 6875, 4019, 9195, 5645, 2887,
			1213, 1815, 8671, 3015, 3147, 2991, 7977, 7045, 1619, 7909,
			4451, 6573, 4545, 8251, 5983, 2849, 7249, 7449, 9477, 5963,
			2711, 9019, 7375, 2201, 5631, 4893, 7653, 3719, 8819, 5839,
			1853, 9843, 9119, 7023, 5681, 2345, 9873, 6349, 9315, 3795,
			9737, 4633, 4173, 7549, 7171, 6147, 4723, 5039, 2723, 7815,
			6201, 5999, 5339, 4431, 2911, 4435, 3611, 4423, 9517, 3243
		],
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
		// raw vcKey: [604825, 607300, 613847, 615318, 624009, 631856, 635451, 637218, 640529, 643036, 652687, 658008, 662481, 669598, 675545, 685034, 687703, 696444, 702593, 703894, 711191, 714166, 720579, 728970, 738675, 740918, 743009, 747240, 750347, 759846, 764051, 770064, 773457, 779858, 786843, 790526, 799973, 803260, 808441, 816028, 825381, 827516, 832463, 837868, 843091, 852548, 858315, 867580, 875771, 879698, 882759, 885564, 888837, 896168]
		specialDiffs: {
			"1555": 2, // valentines 2016, hinamatsuri 2015
			"3347": 3, // valentines 2016, hinamatsuri 2015
			"6547": 2, // whiteday 2015
			"1471": 3, // whiteday 2015
		},
		specialShipVoices: {
			// Graf Zeppelin (Kai):
			//   17:Yasen(2) is replaced with 917. might map to 17, but not for now;
			//   18 still used at day as random Attack, 918 used at night opening
			432: {917: 917, 918: 918},
			353: {917: 917, 918: 918},
		},
		specialReairVoiceShips: [
			// These ships got special (unused?) voice line (6, aka. Repair) implemented,
			// tested by trying and succeeding to http fetch mp3 from kc server
			56, 160, 224,  // Naka
			65, 194, 268,  // Haguro
			114, 200, 290, // Abukuma
			123, 142, 295, // Kinukasa
			126, 398,      // I-168
			127, 399,      // I-58
			135, 304,      // Naganami
			136,           // Yamato Kai
			418,           // Satsuki Kai Ni
			496,           // Zara due
		],
		specialAbyssalIdVoicePrefixes: {
			// Why do devs make wrong voice filename matching even for last event?
			// `Prefix of actual voice filename`: `Correctly matched abyssal ID`
			"4171793": 1799, // Abyssal Crane Princess
			"4171796": 1802, // Abyssal Crane Princess - Damaged
		},
		// key: slotitem ID, value: special type2 ID. from:
		//   Phase1: `Core.swf/vo.MasterSlotItemData.getSlotItemEquipTypeSp()`
		//   Phase2: `main.js/SlotitemMstModel.prototype.equipTypeSp`
		specialEquipTypeMap: {
			128: 38,
			142: 93,
			151: 94,
			281: 38,
		},
		// ships with special remodeling animation, ordered by implementated time,
		// from `main.js/RemodelUtil.isSpKaizo`. btw `full_2x` is used for this case
		specialRemodelFromIds: [
			149, // Kongou K2 -> K2C
			150, // Hiei K2 -> K2C
			277, // Akagi Kai -> K2
			594, // Akagi K2 -> K2E
			350, // Umikaze Kai -> K2
			293, // Yuubari Kai -> K2
			579, // Gotland Kai -> andra
			628, // Fletcher Kai Mod.2 -> Mk.II
		],
		// all ships for special cut-in attacks
		specialCutinIds: [541, 571, 573, 576, 591, 592, 601, 1496],
		nelsonTouchShips: [571, 576],
		nagatoClassCutinShips: [541, 573],
		nagatoCutinShips: [541],
		mutsuCutinShips: [573],
		coloradoCutinShips: [601, 1496],
		kongouCutinShips: [591, 592],
		// from `main.js/ITEMUP_REPLACE`
		abyssalItemupReplace: {
			516: 516, 517: 517, 518: 518, 519: 516, 520: 517,
			521: 518, 522: 516, 523: 516, 524: 517, 525: 518,
			526: 518, 546: 518, 547: 547, 548: 548, 549: 549,
			550: 3,   551: 128, 552: 76,  553: 3,   554: 554,
			555: 555, 556: 556, 557: 557, 558: 558, 561: 561,
			562: 562, 563: 162, 564: 549, 565: 79,  566: 547,
			567: 13,  568: 161, 569: 562, 570: 15,  571: 571,
			572: 572, 573: 573, 574: 574, 575: 574, 576: 231,
			577: 245, 578: 190, 579: 7,   580: 58,  581: 581,
			582: 582, 583: 583, 584: 7,   585: 161, 586: 574,
			587: 298, 588: 266, 589: 310, 590: 309, 591: 284,
			592: 332, 593: 314, 594: 594, 595: 595, 596: 340,
			597: 597, 598: 598, 599: 280, 600: 50,  601: 356,
			602: 362, 603: 278, 604: 294, 605: 384, 606: 379,
			607: 380,
		},
		
		/* Initialization
		-------------------------------------------------------*/
		init :function( repo ){
			this.repo = repo;
			/* to remove deprecated warning
				http://stackoverflow.com/questions/22090764/alternative-to-async-false-ajax
			*/
			
			// Load Common Meta
			this._icons      = JSON.parse( $.ajax(repo+'icons.json', { async: false }).responseText );
			this._seasonal   = JSON.parse( $.ajax(repo+'seasonal_icons.json', { async: false }).responseText );
			this._exp        = JSON.parse( $.ajax(repo+'exp_hq.json', { async: false }).responseText );
			this._expShip    = JSON.parse( $.ajax(repo+'exp_ship.json', { async: false }).responseText );
			this._edges      = JSON.parse( $.ajax(repo+'edges.json', { async: false }).responseText );
			this._edgesOld   = JSON.parse( $.ajax(repo+'edges_p1.json', { async: false }).responseText );
			this._nodes      = JSON.parse( $.ajax(repo+'nodes.json', { async: false }).responseText );
			this._gunfit     = JSON.parse( $.ajax(repo+'gunfit.json', { async: false }).responseText );
			// fud: Frequently updated data. rarely & randomly updated on maintenance weekly in fact
			this._dataColle  = JSON.parse( $.ajax(repo+'fud_weekly.json', { async: false }).responseText );
			this._eventColle = JSON.parse( $.ajax(repo+'fud_quarterly.json', { async: false }).responseText );
			
			// Load Translations
			this._ship      = KC3Translation.getJSON(repo, 'ships', true);
			this._shipAffix = KC3Translation.getJSON(repo, 'ship_affix', true);
			this._slotitem  = KC3Translation.getJSON(repo, 'items', true);
			this._useitems  = KC3Translation.getJSON(repo, 'useitems', true);
			this._equiptype = KC3Translation.getJSON(repo, 'equiptype', true);
			this._quests    = KC3Translation.getJSON(repo, 'quests', true);
			this._ranks     = KC3Translation.getJSON(repo, 'ranks', true);
			this._stype     = KC3Translation.getJSON(repo, 'stype', true);
			this._ctype     = KC3Translation.getJSON(repo, 'ctype', true);
			this._servers   = KC3Translation.getJSON(repo, 'servers', true);
			this._battle    = KC3Translation.getJSON(repo, 'battle', true);
			// troll language always loaded
			this._terms.troll = JSON.parse( $.ajax(repo+'lang/data/troll/terms.json', { async: false }).responseText );
			// other language loaded here
			this._terms.lang = KC3Translation.getJSON(repo, 'terms', true);
			
			this.updateAircraftTypeIds();
			return this;
		},
		
		loadQuotes :function(){
			this._quotes = KC3Translation.getQuotes(this.repo);
			this._quotesSize = JSON.parse($.ajax(this.repo + "quotes_size.json", { async: false }).responseText);
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
		getIcon: function(id, empty, useSeasonal = true, isDamaged = false) {
			id = Number(id);
			if(this._icons.indexOf(id) > -1){
				const isAbyssal = KC3Master.isAbyssalShip(id);
				let path = isAbyssal ? "abyss/" : "ships/";
				// Devs bump 1000 for master ID of abyssal ships from 2017-04-05
				// To prevent mess image files renaming, patch it here
				id = isAbyssal ? id - 1000 : id;
				// Show seasonal icon if demanded, config enabled and found in meta
				if(!isAbyssal && useSeasonal && ConfigManager.info_seasonal_icon
					&& this._seasonal.length && this._seasonal.indexOf(id) > -1){
					path = "shipseasonal/";
				}
				// Show damaged (chuuha) icon if demanded and config enabled
				if(!isAbyssal && isDamaged && ConfigManager.info_chuuha_icon){
					id = String(id) + "_d";
				}
				if(this.isAF() && [this.getAF(4), String(this.getAF(4)) + "_d"].includes(id))
					return this.getAF(3).format(id);
				// Here assume image file must be existed already (even for '_d.png')
				return chrome.extension.getURL("/assets/img/" + path + id + ".png");
			}
			if(empty === undefined){
				return this._defaultIcon;
			}
			return empty;
		},
		knownEnemy :function(id){
			return this._icons.indexOf(id) > -1;
		},
		
		formationIcon :function(formationId){
			return "/assets/img/formation2/" + formationId + ".png";
		},
		
		formationText :function(formationId){
			return this._battle.formation[formationId] || "";
		},
		
		itemIcon :function(type3Id, iconSetId = ConfigManager.info_items_iconset){
			// current auto using phase 2
			const path = "items" + (["_p2", "", "_p2"][iconSetId || 0] || "");
			return chrome.extension.getURL(`/assets/img/${path}/${type3Id}.png`);
		},
		
		statIcon :function(statName, iconSetId = ConfigManager.info_stats_iconset){
			// current auto using phase 1
			const path = "stats" + (["", "", "_p2"][iconSetId || 0] || "");
			return chrome.extension.getURL(`/assets/img/${path}/${statName}.png`);
		},
		
		statApiNameMap :function(){
			return ({
				"taik": "hp",
				"houg": "fp",
				"raig": "tp",
				"baku": "dv",
				"souk": "ar",
				"tyku": "aa",
				"tais": "as",
				"houm": "ht",
				"houk": "ev",
				"saku": "ls",
				"luck": "lk",
				"soku": "sp",
				"leng": "rn",
				"cost": "kk",
				"distance": "or",
			});
		},
		statIconByApi :function(apiName, iconSetId = ConfigManager.info_stats_iconset){
			return this.statIcon(this.statApiNameMap()[apiName], iconSetId);
		},
		
		statNameTerm :function(name, isApiName = false, returnTerm = false){
			const statNameTermMap = {
				"hp": "ShipHp",
				"fp": "ShipFire",
				"tp": "ShipTorpedo",
				"dv": "ShipBombing",
				"ar": "ShipArmor",
				"aa": "ShipAntiAir",
				"as": "ShipAsw",
				"ht": "ShipAccuracy",
				"ev": "ShipEvasion",
				"ib": "ShipAccAntiBomber",
				"if": "ShipEvaInterception",
				"ls": "ShipLos",
				"lk": "ShipLuck",
				"sp": "ShipSpeed",
				"rn": "ShipLength",
				"or": "ShipRadius",
				"kk": "ShipDeployCost",
			};
			const term = statNameTermMap[isApiName ? this.statApiNameMap()[name] : name] || "";
			return !returnTerm ? this.term(term) : term;
		},
		
		itemIconsByType2 :function(type2Id){
			if(!this._type2IconMap){
				// Build type2 id to icon type3 id map from master data
				const iconMap = {};
				$.each(KC3Master.all_slotitems(), (_, g) => {
					if(KC3Master.isAbyssalGear(g.api_id)) return false;
					// some items are belonged to XXX (II) type (38, 93, 94)
					const t2Id = KC3Master.equip_type_sp(g.api_id, g.api_type[2]);
					const iconId = g.api_type[3];
					iconMap[t2Id] = iconMap[t2Id] || [];
					if(!iconMap[t2Id].includes(iconId)) iconMap[t2Id].push(iconId);
				});
				this._type2IconMap = iconMap;
			}
			return this._type2IconMap[type2Id] || [];
		},
		
		itemTypesByType3 :function(type3Id){
			if(!this._type3TypeMap){
				// Build type3 id to type2 id map from master data
				const typeMap = {};
				$.each(KC3Master.all_slotitems(), (_, g) => {
					if(KC3Master.isAbyssalGear(g.api_id)) return false;
					// some items are belonged to XXX (II) type (38, 93, 94)
					const t2Id = KC3Master.equip_type_sp(g.api_id, g.api_type[2]);
					const iconId = g.api_type[3];
					typeMap[iconId] = typeMap[iconId] || [];
					if(!typeMap[iconId].includes(t2Id)) typeMap[iconId].push(t2Id);
				});
				this._type3TypeMap = typeMap;
			}
			return this._type3TypeMap[type3Id] || [];
		},
		
		shipNameAffix :function(affix){
			// Just translate the prefixes and suffixes in `ship_affix.json`
			// And keep the necessary space after or before the affixes
			return this._shipAffix[affix] || {};
		},
		
		shipName :function(jpName, suffixKey = "suffixes", prefixKey = "prefixes"){
			if(this.isAF() && jpName === this.getAF(5)) jpName = this.getAF(6);
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
				prefixesMap = this.shipNameAffix(prefixKey),
				prefixesList = Object.keys(prefixesMap),
				combinedSuffixes = [],
				suffixesMap = this.shipNameAffix(suffixKey),
				suffixesList = Object.keys(suffixesMap),
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
				while( !!(occurs = (new RegExp(`^(?:${prefixesList.join("|")})`, "i")).exec(root)) ){
					const firstOccur = occurs[0];
					root = root.replace(new RegExp(`^${firstOccur}`, "i"), "");
					if(prefixesMap[occurs[0]].slice(-1) === "$"){
						combinedSuffixes.unshift(prefixesMap[firstOccur].slice(0, -1));
					} else {
						combinedPrefixes.unshift(prefixesMap[firstOccur]);
					}
					prefixesList.splice(prefixesList.indexOf(firstOccur), 1);
					replaced = true;
				}
			}
			if(suffixesList.length > 0){
				while( !!(occurs = (new RegExp(`(?:${suffixesList.join("|")})$`,"i")).exec(root)) ){
					const firstOccur = occurs[0];
					root = root.replace(new RegExp(`${firstOccur}$`, "i"), "");
					if(suffixesMap[firstOccur].slice(0, 1) === "^"){
						combinedPrefixes.unshift(suffixesMap[firstOccur].slice(1));
					} else {
						combinedSuffixes.unshift(suffixesMap[firstOccur]);
					}
					suffixesList.splice(suffixesList.indexOf(firstOccur), 1);
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
			// Translate api_yomi, might be just Romaji. Priority using yomi in affix
			return this.shipNameAffix("yomi")[jpYomi] || this.shipName(jpYomi);
		},
		
		distinctNameDelimiter :function(combinedName = ""){
			const result = [];
			// To avoid frequently used bracket `()`, current tag: `{...}?`
			const re = /\{(.*?)\}\?/g;
			let match, occur = 0, lastIndex = 0;
			while((match = re.exec(combinedName)) !== null){
				occur += 1;
				if(occur === 1){
					result.push(combinedName.slice(0, match.index));
					result.push(match[1]);
				} else {
					result.push(combinedName.slice(lastIndex, match.index));
				}
				lastIndex = re.lastIndex;
			}
			if(occur === 0){
				return combinedName;
			} else {
				result.push(combinedName.slice(lastIndex));
			}
			return result.join("");
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
			if(!shipMaster){ return ""; }
			if(!shipMaster.api_name){
				shipMaster = KC3Master.ship(Number(ship));
			}
			return this.distinctNameDelimiter(
				[this.shipName(shipMaster.api_name), this.shipReadingName(shipMaster.api_yomi)]
					.filter(x => !!x && x !== "-")
					.joinIfNeeded()
			);
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
			if((this._eventColle.abyssKaiShipIds || []).indexOf(shipMaster.api_id) > -1){
				return "kai";
			}
			// Princesses and demons, using black-list
			// To reduce updating work, consider new abyssal ships as boss by default
			if(shipMaster.api_id > (KC3Master.abyssalShipIdFrom + 38) &&
				(this._eventColle.abyssNonBossIds || []).indexOf(shipMaster.api_id) < 0){
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
		
		gearRange :function(apiLeng, returnTerm){
			var rangeTermsMap = {"1":"RangeShortAbbr", "2":"RangeMediumAbbr", "3":"RangeLongAbbr", "4":"RangeVeryLongAbbr", "5":"RangeExtremeLongAbbr"};
			var term = rangeTermsMap[apiLeng];
			// return the api value itself if new name term not decided yet
			return !returnTerm ? this.term(term || apiLeng) : term || "Unknown";
		},
		
		exp :function(level){
			return this._exp[level] || [0,0];
		},
		
		expShip :function(level){
			return this._expShip[level] || [0,0];
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
		
		allStypes :function(){
			return $.extend(true, {}, this._stype);
		},
		
		sortedStypes :function(){
			const presetOrder = {
				0: -1, // n/a
				1: 10, // DE
				2: 20, // DD
				3: 30, 4: 30, // CL, CLT
				5: 40, 6: 40, // CA, CAV
				13: 50, 14: 50, // SS, SSV
				8: 61, 9: 60, 10: 61, // FBB, BB, BBV
				7: 72, 11: 70, 18: 71, // CVL, CV, CVB
				16: 80, 20: 81, 22: 82, 17: 83, 19: 84, 21: 85, // AV, AS, AO, LHA, AR, CT
			};
			const stypeList = [], stypes = this.allStypes();
			for(let i in stypes){
				stypeList.push({
					id: parseInt(i, 10),
					name: stypes[i],
					// unused ship type (12:XBB, 15:AP) will be 999
					order: presetOrder[i] || 999
				});
			}
			return stypeList.sort((a, b) => a.order - b.order || a.id - b.id);
		},
		
		predefinedStypeGroup :function(){
			return {
				"DD": [2],
				"CL": [3, 4],
				"CA": [5, 6],
				"BB": [8, 9, 10],
				"CV": [7, 11, 18],
				"SS": [13, 14],
				"TorpedoSquard": [2, 3, 4],
				"AntiSub": [1, 2, 3, 4, 6, 7, 10, 16, 17, 21, 22],
				"Auxiliary": [16, 17, 19, 20, 21, 22]
			};
		},
		
		// ship category defined by in-game client, see `main.js#ShipCategory`
		shipCategory :function(stype){
			return ((t) => {
				switch(t) {
					case 1: return "DE";
					case 2: return "DD";
					case 3: // CL + CLT
					case 4: return "CL";
					case 5: // CA + CAV
					case 6: return "CA";
					case 7: // CVL
					case 11: // CV + CVB
					case 18: return "CV_CVL";
					case 8: // BC = FBB
					case 9: // BB
					case 12: // unused XBB
						return "BB_BC";
					case 10: return "BBV";
					case 13: // SS + SSV
					case 14: return "SS";
					case 15: // unused AP
					case 16: // AV
					case 17: // LHA
					case 19: // AR
					case 20: // AS
					case 22: // AO
						return "AV_AO_AS";
					case 21: return "CLT"; // should be CT
					default: return "Unsupport type";
				}
			})(stype);
		},
		
		ctype :function(id){
			return this._ctype[id] || "??";
		},
		
		ctypeName :function(id){
			return this.shipName(this.ctype(id), "ctype");
		},
		
		server :function(ip){
			return this._servers[ip] || {name:"Unknown Server", num:0, ip:ip };
		},
		
		serverByNum :function(num){
			for(var ctr in this._servers){
				if(this._servers[ctr].num==num){
					return this._servers[ctr];
				}
			}
			return {name:"Unknown Server", num:num, ip:"0.0.0.0" };
		},
		
		gauge :function(map_id){
			return (this._dataColle.gauges || {})["m" + map_id] || false;
		},
		
		eventGauge :function(mapId, gaugeNum){
			var mapInfo = (this._eventColle.eventMapGauges || {})[mapId] || false;
			return mapInfo ? (gaugeNum ? mapInfo[gaugeNum] || false : mapInfo) : false;
		},
		
		allMapsExp :function(){
			return this._mapExpMap || ((rawExpMap) => {
				this._mapExpMap = {};
				if(rawExpMap){
					$.each(rawExpMap, (world, expArr) => {
						$.each(expArr, (map, exp) => {
							this._mapExpMap[[world, map + 1].join('-')] = exp;
						});
					});
				}
				return this._mapExpMap;
			})(this._dataColle.mapExps);
		},
		
		mapExp :function(world, map){
			return this.allMapsExp()[[world, map].join('-')] || 0;
		},
		
		airPowerAverageBonus :function(ace){
			// Use default known simple bonus constants if json data lost
			var bonuses = this._dataColle.airPowerAverageBonuses || [0, 1, 1, 2, 2, 2, 3, 3];
			return bonuses[ace] || 0;
		},
		
		airPowerTypeBonus :function(type2, ace){
			var bonuses = this._dataColle.airPowerTypeBonuses || {};
			return (bonuses[type2] || [])[ace] || 0;
		},
		
		airPowerInternalExpBounds :function(ace){
			// Use default known xp table constants if json data lost
			var exp = this._dataColle.airPowerInternalProficiency
				|| [0, 10, 25, 40, 55, 70, 85, 100, 121];
			return [exp[ace] || 0, (exp[ace + 1] || 1) - 1];
		},
		
		updateAircraftTypeIds :function(){
			// Do nothing if KC3GearManager not global yet
			if(typeof KC3GearManager === "undefined"){ return; }
			// alias for short
			const d = this._dataColle;
			// current map table
			const vo = {
				carrierBasedAircraftType3Ids: d.carrierBasedAircraftType3Ids,
				landBasedAircraftType3Ids: d.landBasedAircraftType3Ids,
				antiAirFighterType2Ids: d.antiAirFighterType2Ids,
				airStrikeBomberType2Ids: d.airStrikeBomberType2Ids,
				antiLandDiveBomberIds: d.antiLandDiveBomberIds,
				evadeAntiAirFireIds: d.evadeAntiAirFireIds,
				highAltitudeInterceptorIds: d.highAltitudeInterceptorIds,
				aswAircraftType2Ids: d.aswAircraftType2Ids,
				nightAircraftType3Ids: d.nightAircraftType3Ids,
				interceptorsType3Ids: d.interceptorsType3Ids,
				jetAircraftType2Ids: d.jetAircraftType2Ids,
				landBaseReconnType2Ids: d.landBaseReconnType2Ids,
			};
			// clean keys with invalid value to avoid being overwritten
			Object.keys(vo).filter(k => !Array.isArray(vo[k])).forEach(k => {
				delete vo[k];
			});
			// assign effective values
			Object.assign(KC3GearManager, vo);
		},
		
		defaultEquip :function(id){
			var eq = WhoCallsTheFleetDb.getEquippedSlotCount(id);
			return eq !== false ? eq : 0;
		},
		
		battleSeverityClass :function(battleArray){
			return (Array.isArray(battleArray) && battleArray[0].length >= 2) ?
				battleArray.map(function(e){if(!!e[1]) return e[1];})
					.reduce(function(p, c){if(!!c && p.indexOf(c) < 0) p.push(c);
						return p;}, []).join(" ")
				: "";
		},
		
		eventLockingTagColors :function(theme = "dark"){
			return (this._eventColle.lockingTagColors || {})[theme] || [];
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
		
		cutinTypeDay :function(index){
			return (typeof index === "undefined") ? this._battle.cutinDay :
				// move Nelson Touch/Nagato-class/Colorado Cutin index 100 to 20
				// move AirSea/Zuiun Multi-Angle Cutin index 200 to 30
				this._battle.cutinDay[index >= 200 ? index - 170 : index >= 100 ? index - 80 : index] || "";
		},
		
		cutinTypeNight :function(index){
			return (typeof index === "undefined") ? this._battle.cutinNight :
				// move Nelson Touch/Nagato-class/Colorado/Kongou Cutin index 100 to 20
				this._battle.cutinNight[index >= 100 ? index - 80 : index] || "";
		},
		
		aacitype :function(index){
			return (typeof index === "undefined") ? this._battle.aacitype :
				this._battle.aacitype[index] || [];
		},
		
		term :function(key) {
			return (ConfigManager.info_troll && this._terms.troll[key]) || this._terms.lang[key] || key;
		},
		
		/** @return a fake edge ID/name used to indicate and save as land-base air raid encounter */
		getAirBaseFakeEdge :function(returnFakeName = false) {
			return returnFakeName ? "AB" : -99;
		},
		
		nodeLetter :function(worldId, mapId, edgeId, timestamp) {
			// return a string constant to indicate fake 'land base' node
			if (edgeId === this.getAirBaseFakeEdge())
				return this.getAirBaseFakeEdge(true);
			const dataSource = this.isEventWorld(worldId) || this.isPhase2Started(timestamp) ?
				this._edges : this._edgesOld;
			const map = dataSource["World " + worldId + "-" + mapId];
			if (typeof map !== "undefined") {
				var edge = map[edgeId];
				if (typeof edge !== "undefined") {
					// return destination
					return edge[1];
				}
			}
			return edgeId;
		},
		
		nodes :function(worldId, mapId) {
			return this._nodes["World " + worldId + "-" + mapId] || {};
		},
		
		nodeLetters :function(worldId, mapId) {
			var map = this._nodes["World " + worldId + "-" + mapId];
			if (typeof map !== "undefined" && !!map.letters) {
				return map.letters;
			}
			return {};
		},
		
		nodeMarkers :function(worldId, mapId) {
			var map = this._nodes["World " + worldId + "-" + mapId];
			if (typeof map !== "undefined" && !!map.markers) {
				return map.markers;
			}
			return [];
		},
		
		tpObtained :function(kwargs) {
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
				var tpBase = $.extend({}, tpData);
				function getSType(stype) {
					var tpmult = KC3Meta._eventColle.tpMultipliers || {},
						stypes = tpmult.stype || {},
						data   = stypes[stype],
						tprs   = $.extend({}, tpBase);
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
				var tpBase = $.extend({}, tpData);
				function getSlot(slot) {
					var tpmult = KC3Meta._eventColle.tpMultipliers || {},
						slots  = tpmult.slots || {},
						data   = slots[slot],
						tprs   = $.extend({}, tpBase);
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
			var f = parseInt(filename, 10);
			var k = 17 * (ship_id + 7), r = f - 100000;
			if(f > 53 && r < 0) {
				return f;
			} else if(!isNaN(f)) {
				for (var i = 0; i < 2600; ++i) {
					var a = r + i * 99173;
					if (a % k === 0) {
						return a / k;
					}
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
		
		// Extract ship ID of abyssal from voice file name
		// https://github.com/KC3Kai/KC3Kai/pull/2181
		getAbyssalIdByFilename :function(filename){
			var id, map = parseInt(filename.substr(0, 2), 10);
			const prefix = Object.keys(this.specialAbyssalIdVoicePrefixes).find(p => filename.indexOf(p) === 0);
			if(prefix) return this.specialAbyssalIdVoicePrefixes[prefix];
			switch(filename.length){
				case 7:
					id = map === 64 ? filename.substr(2, 3) : filename.substr(3, 3);
					break;
				case 8:
					id = map <= 31 ? filename.substr(4, 3) : filename.substr(3, 3);
					break;
				case 9:
					id = filename.substr(3, 4);
					break;
				default:
					console.debug("Unknown abyssal voice file name", filename);
					id = "";
			}
			id = parseInt(id, 10);
			return isNaN(id) ? false : id <= 1500 ? id + 1000 : id;
		},
		
		getShipVoiceFlag :function(masterId){
			var shipData = KC3Master.ship(masterId);
			return shipData ? shipData.api_voicef : 0;
		},

		// check if a ship has idle voice
		shipHasIdleVoice :function(masterId){
			return (1 & this.getShipVoiceFlag(masterId)) !== 0;
		},

		// check if a ship has hourly voices
		shipHasHourlyVoices :function(masterId){
			return (2 & this.getShipVoiceFlag(masterId)) !== 0;
		},

		// check if a ship has special idle voice
		shipHasSpIdleVoice :function(masterId){
			return (4 & this.getShipVoiceFlag(masterId)) !== 0;
		},

		isHourlyVoiceNum :function(voiceNum){
			return voiceNum >= 30 && voiceNum <= 53;
		},
		
		isHomePortVoiceNum :function(voiceNum){
			// Poke 1~3, Idle, Sp Idle
			return [2, 3, 4, 29, 129, 1471, 6547].indexOf(Number(voiceNum)) > -1;
		},
		
		// Subtitle quotes
		quote :function(identifier, voiceNum, voiceSize = 0){
			if (!identifier) return false;

			var quoteTable = this._quotes[identifier];
			if(typeof quoteTable === "undefined") return false;

			var lookupVoice = (vNum) => {
				if (typeof vNum === "undefined")
					return false;
				var retVal = quoteTable[vNum];
				return typeof retVal !== "undefined" ? retVal : false;
			};

			var lookupSpecialSeasonalKey = (shipId, vNum, fileSize) => {
				// this table only contains base form IDs
				const spFileSizeTable = (this._dataColle.specialQuotesSizes || {})[
					RemodelDb.originOf(shipId) || shipId
				];
				if(spFileSizeTable && fileSize){
					const knownVoiceSizes = spFileSizeTable[vNum];
					const seasonalKeyConf = (knownVoiceSizes || {})[fileSize];
					if(knownVoiceSizes && seasonalKeyConf){
						const seasonalKeys = Object.keys(seasonalKeyConf);
						for(let i in seasonalKeys){
							const key = seasonalKeys[i];
							const keyCond = seasonalKeyConf[key];
							if(Array.isArray(keyCond) // match key by current month
								&& keyCond.indexOf(new Date().getMonth() + 1) > -1){
								return key;
							}
						}
					}
				}
				return false;
			};

			var lookupByFileSize = (shipId, vNum, fileSize) => {
				var seasonalKey = lookupSpecialSeasonalKey(shipId, vNum, fileSize);
				const fileSizeTable = this._quotesSize[shipId];
				if(!seasonalKey && fileSizeTable && fileSize){
					const knownVoiceSizes = fileSizeTable[vNum];
					seasonalKey = (knownVoiceSizes || {})[fileSize];
					// try to match among lines of Poke(1,2,3) because devs reuse them around
					if(seasonalKey === undefined && vNum >= 2 && vNum <= 4){
						for(let vn = 2; vn <= 4; vn++){
							if(vn !== vNum &&
								fileSizeTable[vn] && fileSizeTable[vn][fileSize]){
								seasonalKey = fileSizeTable[vn][fileSize];
								vNum = vn;
								break;
							}
						}
					}
				}
				//console.debug(`Quote known size[${vNum}]["${fileSize}"] = "${seasonalKey}"`);
				if(seasonalKey){
					return lookupVoice(vNum + "@" + seasonalKey);
				}
				return false;
			};

			var voiceLine = lookupVoice(voiceNum);
			if(voiceLine) {
				// check if seasonal lines found
				return lookupByFileSize(identifier, voiceNum, voiceSize) || voiceLine;
			} else if(identifier !== "timing"){
				// no quote for that voice line, check if it's a seasonal line
				var specialVoiceNum = this.specialDiffs[voiceNum];
				// check if default for seasonal line exists
				//console.debug(`Quote this.specialDiffs["${voiceNum}"] = ${specialVoiceNum}`);
				voiceLine = lookupVoice(specialVoiceNum);
				// try to check seasonal line by voice file size
				var specialVoiceLine = lookupByFileSize(identifier, specialVoiceNum, voiceSize) || voiceLine;
				if(specialVoiceLine){
					if(specialVoiceLine !== voiceLine){
						//console.debug(`Quote using special "${specialVoiceLine}" instead of "${voiceLine}"`);
					}
					return specialVoiceLine;
				}
			}
			return false;
		},
		
		gunfit :function(shipMstId, itemMstId){
			let fitInfo = this._gunfit[shipMstId];
			// redirect to the same class ship, no loop redirection
			if(typeof fitInfo === "number") {
				fitInfo = this._gunfit[fitInfo];
			}
			if(fitInfo === undefined) {
				return false;
			}
			if(itemMstId !== undefined) {
				const weightClassDef = fitInfo.weightClass;
				if(weightClassDef === undefined) {
					return false;
				}
				const gunId = parseInt(itemMstId, 10);
				const weightClass = Object.keys(weightClassDef)
					.find(weight => weightClassDef[weight].indexOf(gunId) > -1);
				if(weightClass === undefined) {
					return false;
				}
				const weightAccuracy = (fitInfo.accuracy || {})[weightClass];
				if(weightAccuracy) {
					// clone and bind weight class name and id to result
					return Object.assign({}, weightAccuracy, {
						weight: weightClass,
						id: gunId
					});
				} else {
					// no accuracy found means gun exists but bonus/penalty unverified
					return {
						weight: weightClass,
						id: gunId,
						unknown: true
					};
				}
			} else {
				return fitInfo;
			}
		},
		
		sortedGunfits :function(shipMstId){
			const gunfits = this.gunfit(shipMstId);
			if(gunfits !== false) {
				const names = gunfits.weightClass;
				const gearIds = [];
				Object.keys(names).forEach(name => {
					gearIds.push(...names[name]);
				});
				const gearInfo = gearIds.map(id => this.gunfit(shipMstId, id));
				const sortedGearInfo = gearInfo.sort((a, b) =>
					// Unknown by ID asc
					a.unknown === true && b.unknown === true ? a.id - b.id :
					// Unknown always go last
					a.unknown === true ? Infinity :
					b.unknown === true ? -Infinity :
					// By day bonus desc
					b.day - a.day
					// Fallback to weight and ID asc
					|| a.weight.localeCompare(b.weight)
					|| a.id - b.id
				);
				return sortedGearInfo;
			}
			return false;
		},
		
		formatNumber :function(number, locale, options){
			return !ConfigManager.info_format_numbers || $.type(number) !== "number" ?
				number : number.toLocaleString(locale, options);
		},
		
		formatDecimalOptions :function(fraction = 0, grouping = true){
			return { useGrouping: grouping, minimumFractionDigits: fraction, maximumFractionDigits: fraction };
		},
		
		isEventWorld :function(worldId) {
			return Number(worldId) >= 10;
		},
		
		worldToDesc :function(worldId, mapId, returnTerm) {
			worldId = Number(worldId);
			var worldTerm = "Unknown";
			if(this.isEventWorld(worldId)) {
				const eventMapDefs = {
						seasons : ["Winter", "Spring", "Summer", "Fall"],
						fromId : 21,
						fromYear : 2013,
						skippedSeasons : [[42, 2], [48, 3]],
					},
					period = eventMapDefs.seasons.length,
					worldIndex = eventMapDefs.skippedSeasons.reduce((index, [skipFrom, skipAccumulated]) => (
						worldId >= skipFrom ?
						worldId - eventMapDefs.fromId + skipAccumulated :
						(index < 0 ? worldId - eventMapDefs.fromId : index)
					), -1),
					season = eventMapDefs.seasons[worldIndex % period] || "BeforeBigBang",
					year = eventMapDefs.fromYear + Math.floor(worldIndex / period);
					worldTerm = ["MapNameEventWorld", "MapNameEventSeason" + season, year];
				return !returnTerm ? KC3Meta.term(worldTerm[0])
					.format(KC3Meta.term(worldTerm[1]), worldTerm[2]) : worldTerm;
			} else {
				worldTerm = "MapNameWorld" + worldId;
				return !returnTerm ? KC3Meta.term(worldTerm) : worldTerm;
			}
		},
		
		mapToDesc :function(worldId, mapId) {
			return this.isEventWorld(worldId) ? "E-" + mapId : [worldId, mapId].join("-");
		},
		
		isPhase2Started :function(datetime) {
			const timestamp = datetime instanceof Date ? datetime.getTime() : Number(datetime);
			// using 2018-08-17 00:00:00 as threshold, since maintenance started from 8-15, ended on 8-17
			return !timestamp || timestamp >= 1534435200000;
		},
		
		/**
		 * @return indicate if game is during Spring 2018 mini event.
		 * Should disable this after event manually. Seems no reliable flag found,
		 * perhaps `api_c_flag` will not disappear if Dinner Ticket not.
		 */
		isDuringFoodEvent :function(){
			return false;
		},
		
		isAF :function(){
			return this.getAF(0) === undefined ?
				this.getAF(1) < Date.now() && Date.now() < this.getAF(2) : this.getAF(0);
		},
		
		getAF :function(index){
			const v = [
				false, 1522508400000, 1522638000000,
				"https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/assets/img/shipseasonal/Lkb/{0}.png",
				546, "\u6B66\u8535\u6539\u4E8C", "\u6E05\u971C\u6539\u4E8C"
			];
			return v[index] === undefined ? v : v[index];
		}
	};
	
	window.KC3Meta.shipIcon = KC3Meta.getIcon;
	window.KC3Meta.abyssIcon = KC3Meta.getIcon;

})();
