(function(){
	"use strict";
	
	window.KC3Translation = {
		/* EXECUTE
		Triggers translations into current page
		-----------------------------------------*/
		execute :function(){
			this.lazyInitDateNames();
			this.applyWords();
			this.applyHTML();
		},

		/**
		 * Initialize localized global weekday and month names via Date.prototype.toLocaleString
		 */
		lazyInitDateNames :function(lang){
			if(dateFormat && dateFormat.l10n && !dateFormat.l10n.locale) {
				const msPerMin = 60 * 1000, msPerDay = 24 * 60 * msPerMin;
				const timezoneOffsetMs = new Date().getTimezoneOffset() * msPerMin;
				const locale = this.getLocale(lang);
				// The 4th day (1970-1-4 Sun) is chosen as the first Sunday sample
				Array.numbers(3, 9).forEach((day, idx) => {
					const dateObj = new Date(day * msPerDay + timezoneOffsetMs);
					const weekdayShort = dateObj.toLocaleString(locale, {weekday: "short"}),
						weekdayLong = dateObj.toLocaleString(locale, {weekday: "long"});
					dateFormat.l10n.dayNames[idx] = weekdayShort || dateFormat.i18n.dayNames[idx];
					dateFormat.l10n.dayNames[idx + 7] = weekdayLong || dateFormat.i18n.dayNames[idx + 7];
				});
				Array.numbers(1, 12).forEach((month, idx) => {
					const dateObj = new Date(3 * msPerDay);
					dateObj.setMonth(month - 1);
					const monthShort = dateObj.toLocaleString(locale, {month: "short"}),
						monthLong = dateObj.toLocaleString(locale, {month: "long"});
					dateFormat.l10n.monthNames[idx] = monthShort || dateFormat.i18n.monthNames[idx];
					dateFormat.l10n.monthNames[idx + 12] = monthLong || dateFormat.i18n.monthNames[idx + 12];
				});
				dateFormat.l10n.locale = locale;
			}
		},

		/* APPLY WORDS
		Change words inside visible DOM elements
		-----------------------------------------*/
		applyWords :function(){
			// Interchange element contents with translations
			$(".i18n").each(function(){
				$(this).html( KC3Meta.term( $(this).text() ) );
				$(this).css("visibility", "visible");
			});
			// Update title attribute with translations
			$(".i18n_title").each(function(){
				$(this).attr("title", KC3Meta.term( $(this).attr("title") ) );
			});
		},

		/* APPLY HTML
		Specialized Language HTML adjustments
		-----------------------------------------*/
		applyHTML :function(){
			// Apply specialized global fonts
			var fontFamily = false;
			switch(ConfigManager.language){
				case "scn": fontFamily = '"HelveticaNeue-Light","Helvetica Neue Light","Helvetica Neue",Helvetica,"Nimbus Sans L",Arial,"Lucida Grande","Liberation Sans","Microsoft YaHei UI","Microsoft YaHei","Hiragino Sans GB","Wenquanyi Micro Hei","WenQuanYi Zen Hei","ST Heiti",SimHei,"WenQuanYi Zen Hei Sharp",sans-serif'; break;
				case "tcn": fontFamily = '"Helvetica Neue", Helvetica, Arial, "Microsoft JhengHei", "Microsoft JhengHei UI", "Heiti TC", sans-serif'; break;
				case "tcn-yue": fontFamily = '"Microsoft JhengHei", "Helvetica Neue", Helvetica, Arial, "Microsoft JhengHei UI", "Heiti TC", sans-serif'; break;
				case "jp": fontFamily = '"Helvetica Neue", "Tahoma", Helvetica, Arial, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, "メイリオ", "Meiryo", "Yu Gothic UI Semibold", "ＭＳ Ｐゴシック", "MS PGothic", sans-serif'; break;
				case "kr": fontFamily = '"Helvetica Neue", Helvetica, Arial, "AppleGothic", "Malgun Gothic", "GulimChe", "Dotum", "UnDotum", sans-serif'; break;
				default: break;
			}
			if(fontFamily){
				$("body").css("font-family", fontFamily);
			}
			
			// Apply HTML language code, here needs ISO 639-1 abbr code
			$("html").attr("lang", this.getLocale(ConfigManager.language));
		},

		/*
		  Recursively changing any non-object value "v" into "{val: v, tag: <tag>}".
		 */
		addTags: function(obj, tag, maxdepth = 2) {
			function track(obj, depth) {
				if (typeof obj === "object" && depth) {
					$.each( obj, function(k,v) {
						// should work for both arrays and objects
						obj[k] = track(v, depth - 1);
					});
				} else {
					return {val: obj, tag: tag};
				}
				return obj;
			}

			console.assert(
				typeof obj === "object",
				"addTags should only be applied on objects");
			return track(obj, maxdepth);
		},

		/** Clear specified attribute key from specified JSON object. */
		unoverrideAttr: function(obj, key) {
			console.assert(
				typeof obj === "object",
				"unoverrideAttr should only be applied on objects");
			$.each(obj, function(k, v) {
				if (typeof v[key] !== "undefined") {
					delete obj[k][key];
				}
			});
			return obj;
		},

		getJSONWithOptions: function(repo, filename, extendEnglish,
									 language, info_force_ship_lang, info_eng_stype,
									 track_source = false) {
			if (filename === "quotes") {
				console.info("Warning: using KC3Translation.getQuotes to get quotes");
				return this.getQuotes(repo);
			}

			// Check if desired to extend English files
			extendEnglish = extendEnglish || false;

			// Japanese special case where ships and items sources are already in JP
			if(
				(["jp", "tcn", "tcn-yue"].indexOf(language) > -1)
				&& (["ships", "items", "useitems", "ship_affix"].indexOf(filename) > -1)
			){
				extendEnglish = false;
			}
			// make ships and items related an option to be always in specified one
			if (!!info_force_ship_lang
				&& (["ships", "items", "useitems", "ship_affix"].indexOf(filename) > -1)){
				extendEnglish = false;
				language = info_force_ship_lang;
			}
			// make "stype.json" an option:
			if (filename === "stype" && info_eng_stype){
				language = "en";
			}

			var translationBase = {}, enJSON;
			if(extendEnglish && language!=="en"){
				// Load english file
				try {
					enJSON = JSON.parse($.ajax({
						url : repo+'lang/data/en/' + filename + '.json',
						async: false
					}).responseText);

					if (track_source) {
						this.addTags(enJSON, "en");
					}
					if (filename === "quests") {
						this.unoverrideAttr(enJSON, "memo");
					}
				} catch (e) {
					console.error("Loading translation failed", filename, e);
					let errMsg = $(("<p>Fatal error when loading {0} en TL data: {1}</p>" +
						"<p>Contact developers plz! &gt;_&lt;</p>").format(filename, e));
					if($("#error").length>0){
						$("#error").append(errMsg);
						$("#error").show();
					} else {
						$(document.body).append(errMsg);
					}
					throw e;
				}

				// Make is as the translation base
				translationBase = enJSON;
			}

			// if we can't fetch this file, the English
			// version will be used instead
			var translation;
			try {
				translation = JSON.parse($.ajax({
					url : repo+'lang/data/' +language+ '/' + filename + '.json',
					async: false
				}).responseText);

				if (track_source) {
					this.addTags(translation, language);
				}
			} catch (e) {
				// As EN can be used, fail-safe for other JSON syntax error
				if (e instanceof SyntaxError && extendEnglish && language!=="en"){
					console.warn("Loading translation failed", filename, language, e);/*RemoveLogging:skip*/
					translation = null;
					// Show error message for Strategy Room
					if($("#error").length>0){
						$("#error").append(
							$("<p>Syntax error on {0} TL data of {1}: {2}</p>".format(filename, language, e.message))
						);
						$("#error").show();
					}
				} else {
					// Unknown error still needs to be handled asap
					console.error("Loading translation failed", filename, language, e);
					let errMsg = $(("<p>Fatal error when loading {0} TL data of {1}: {2}</p>" +
						"<p>Contact developers plz! &gt;_&lt;</p>").format(filename, language, e));
					if($("#error").length>0){
						$("#error").append(errMsg);
						$("#error").show();
					} else {
						$(document.body).append(errMsg);
					}
					throw e;
				}
			}
			return $.extend(true, translationBase, translation);
		},

		// descriptive keys to numeric keys
		_descToId: {
			"Intro" : 1,
			"Library" : 25,
			"Poke(1)" : 2,
			"Poke(2)" : 3,
			"Poke(3)" : 4,
			"Married" : 28,
			"Wedding" : 24,
			"Ranking" : 8,
			"Join" : 13,
			"Equip(1)" : 9,
			"Equip(2)" : 10,
			"Equip(3)" : 26,
			"Supply" : 27,
			"Docking(1)" : 11,
			"Docking(2)" : 12,
			"Construction" : 5,
			"Return" : 7,
			"Sortie" : 14,
			"Battle" : 15,
			"Attack" : 16,
			"Yasen(1)" : 18,
			"Yasen(2)" : 17,
			"MVP" : 23,
			"Damaged(1)" : 19,
			"Damaged(2)" : 20,
			"Damaged(3)" : 21,
			"Sunk" : 22,
			"Idle" : 29,
			"Idle(2)" : 129,
			"Repair" : 6,
			"Yasen(3)" : 917,
			"Yasen(4)" : 918,
			"SpCutin" : 900,
			"SpCCutin(1)" : 901,
			"SpCCutin(2)" : 902,
			"SpCCutin(3)" : 903,
			"Friend41(1)" : 141,
			"Friend41(2)" : 241,
			"Friend42(1)" : 142,
			"Friend42(2)" : 242,
			"Friend42(3)" : 342,
			"Friend43(1)" : 143,
			"Friend43(2)" : 243,
			"Friend43(3)" : 343,
			"Friend44(1)" : 144,
			"Friend44(2)" : 244,
			"Friend44(3)" : 344,
			"Friend45(1)" : 145,
			"Friend45(2)" : 245,
			"Friend46(1)" : 146,
			"Friend46(2)" : 246,
			"Friend47(1)" : 147,
			"Friend47(2)" : 247,

			"H0000":30, "H0100":31, "H0200":32, "H0300":33,
			"H0400":34, "H0500":35, "H0600":36, "H0700":37,
			"H0800":38, "H0900":39, "H1000":40, "H1100":41,
			"H1200":42, "H1300":43, "H1400":44, "H1500":45,
			"H1600":46, "H1700":47, "H1800":48, "H1900":49,
			"H2000":50, "H2100":51, "H2200":52, "H2300":53
		},
		// see initialization code below.
		_idToDesc: undefined,

		// descriptive voice key to numeric one
		voiceDescToNum: function(k) {
			return this._descToId[k];
		},

		// numeric voice key to descriptive one
		voiceNumToDesc: function(k) {
			if(!this._idToDesc) {
				this._idToDesc = Object.swapMapKeyValue(this._descToId);
			}
			return this._idToDesc[k] || "";
		},

		// get available ship voice numbers by checking
		// voice flag of a ship.
		// the result is sorted.
		getShipVoiceNums: function(masterId, includeHourlies = true, includeRepair = true, includeFriend = false) {
			var sortedVoiceNums = [
				1,25,2,3,4,28,24,8,13,9,10,26,27,11,
				12,5,7,14,15,16,18,17,23,19,20,21,22,
			];
			var hourlyNums = [
				30,31,32,33,34,35,36,37,38,39,40,41,
				42,43,44,45,46,47,48,49,50,51,52,53
			];

			// add idle voice key
			if (KC3Meta.shipHasIdleVoice(masterId))
				sortedVoiceNums.push(29);
			// add another special idle voice key, when morale >= 50 (sparkle cond)
			if (KC3Meta.shipHasSpIdleVoice(masterId))
				sortedVoiceNums.push(129);

			// add repair key
			if (includeRepair && KC3Meta.specialReairVoiceShips.indexOf(masterId) > -1)
				sortedVoiceNums.push(6);

			// add special cut-in (Nelson Touch, Nagato/Mutsu/Colorado/Kongou Cutin) key
			if (KC3Meta.specialCutinIds.indexOf(masterId) > -1)
				sortedVoiceNums.push(900);
			// add special cut-in voice keys for Nagato class combination
			// when Nagato cutin, 902 for combined with Kai Ni, 901 for base remodel and Kai, 903 for Nelson
			if (KC3Meta.nagatoCutinShips.indexOf(masterId) > -1)
				sortedVoiceNums.push(901, 902, 903);
			// when Mutsu cutin,  902 for combined with Kai Ni, 901 for base remodel and Kai, no 903
			if (KC3Meta.mutsuCutinShips.indexOf(masterId) > -1)
				sortedVoiceNums.push(901, 902);

			if (includeHourlies && KC3Meta.shipHasHourlyVoices(masterId))
				sortedVoiceNums = sortedVoiceNums.concat(hourlyNums);

			// add special keys (Graf Zeppelin)
			if (KC3Meta.specialShipVoices[masterId]){
				sortedVoiceNums = sortedVoiceNums.concat(Object.keys(KC3Meta.specialShipVoices[masterId]));
			}

			// add known friend support keys (last 2 digits seem be event world id)
			if (includeFriend)
				sortedVoiceNums.push(...[141, 241, 142, 242, 342, 143, 243, 343, 144, 244, 344, 145, 245, 146, 246, 147, 247]);

			return sortedVoiceNums;
		},

		// insert quote id as key if descriptive key is used.
		transformQuotes: function(quotes, language, checkKey = false, removeSeasonals = false) {
			var self = this;
			function isIntStr(s) {
				return parseInt(s,10).toString() === s;
			}

			$.each( quotes, function(k, v) {
				if (! isIntStr(k) )
					return;
				// transforming "v" object

				// get an immutable list of keys for further operation
				var subKeys = Object.keys(v);
				$.each(subKeys, function(i, subKey) {
					var subId = self.voiceDescToNum(subKey);
					var isSeasonalKey = subKey.indexOf("@") > -1;
					if (subId) {
						// force overwriting regardless of original content
						// empty content not replaced
						if (v[subKey]) {
							v[subId] = v[subKey];

							// temporary hack for scn quotes
							// as we don't use special key for seasonal lines
							// and en will always has priority on that.
							/*
							if (["scn", "kr"].indexOf(language) > -1) {
								if (subId === 2) {
									v[6547] = v[subKey];
								}
								if (subId === 3) {
									v[1471] = v[subKey];
								}
							}
							*/
						}
					} else {
						if (isSeasonalKey) {
							if (!!removeSeasonals) {
								delete v[subKey];
							}
						} else if (!!checkKey && !isIntStr(subKey) ) {
							// neither a descriptive key nor a normal number
							console.debug(`Not transformed subtitle key "${subKey}" for ship ${k}`);
						}
					}
				});
				
			});
			return quotes;
		},

		getQuotes: function(repo, track = false, language = ConfigManager.language,
			checkKey = false, extendEnglish = true) {

			const deepMergePartially = function(...objs) {
				const merged = {};
				const merge = obj => {
					for(const prop in obj) {
						if(obj.hasOwnProperty(prop)) {
							if($.type(obj[prop]) === "object"
								// workaround for PR #2299:
								// prevent recursively merging for objects start with key "0",
								// which are used by timing-split quote lines.
								&& Object.keys(obj[prop])[0] !== "0") {
								merged[prop] = deepMergePartially(merged[prop], obj[prop]);
							} else {
								merged[prop] = obj[prop];
							}
						}
					}
				};
				objs.forEach(obj => merge(obj));
				return merged;
			};
			var remodelGroups = {};
			if (typeof RemodelDb !== "undefined" && !!RemodelDb._db && !!RemodelDb._db.remodelGroups) {
				remodelGroups = RemodelDb._db.remodelGroups;
			} else {
				console.warn("Translation: failed to load RemodelDb, " +
					"please make sure it's been initialized properly");/*RemoveLogging:skip*/
			}
			const extendQuotesFromRemodelGroups = (langJson, track = false) => {
				$.each(remodelGroups, function(orgShipIdStr, groupInfo) {
					// a group of ship ids that consider as "same ship"
					// sorted by remodels
					var group = groupInfo.group;
					// accumulate quotes
					var curQuotes = {};
					$.each(group, function(i, curShipId) {
						// implicit casting index from num to str
						var quotes = langJson[curShipId] || {};
						if (track) {
							$.each(quotes, function(k, v) {
								quotes[k].tag = curShipId;
							});
						}
						// accumulate to curQuotes
						curQuotes = deepMergePartially(curQuotes, quotes);
						//curQuotes = $.extend(true, {}, curQuotes, quotes);
						// note that curQuotes now refers to a different obj
						// and we haven't done any modification on curQuotes
						// so it's safe to be assigned to a table
						langJson[curShipId] = curQuotes;
					});
				});
			};

			// Use English version quotes as the base by default,
			// assuming all quotes are complete so there
			// is no need to extend the table by considering pre-remodel ship quotes.
			var enJSON = {};
			const isGetEnglish = language === "en";
			if(isGetEnglish || extendEnglish) {
				try {
					enJSON = JSON.parse($.ajax({
						url : repo+'lang/data/en/quotes.json',
						async: false
					}).responseText);
					this.transformQuotes(enJSON, "en", checkKey && isGetEnglish,
						// remove seasonal extending for these languages
						["jp", "scn", "kr"].indexOf(language) > -1);
					if (track) {
						this.addTags(enJSON, "en");
					}
					extendQuotesFromRemodelGroups(enJSON, track && isGetEnglish);
				} catch(e) {
					if (e instanceof SyntaxError){
						console.warn("Loading quotes failed", e);/*RemoveLogging:skip*/
						enJSON = {};
					} else {
						throw e;
					}
				}
			}

			var langJSON;
			if (isGetEnglish) {
				// if it's already English the we are done.
				langJSON = enJSON;
			} else {
				// load language specific quotes.json
				try {
					langJSON = JSON.parse($.ajax({
						url : repo+'lang/data/' +language+ '/quotes.json',
						async: false
					}).responseText);
				} catch (e) {
					if (e instanceof SyntaxError){
						console.warn("Loading quotes failed", language, e);/*RemoveLogging:skip*/
						console.info("Failed to load " + language + " quotes, falling back to en version");
						// Show repeatedly error message for Strategy Room
						if($("#error").length>0 && $("#error").text().indexOf("quotes.json")<0){
							$("#error").append(
								$("<p>Syntax error on {0} quotes.json: {1}</p>".format(language, e.message))
							);
							$("#error").show();
						}
						langJSON = enJSON;
						language = "en";
					} else {
						console.error("Loading quotes failed", language, e);
						throw e;
					}
				}
				// if still non-English JSON pending to be processed
				if(language !== "en") {
					// 1st pass: interpret descriptive keys as keys
					this.transformQuotes(langJSON, language, checkKey);
					if (track) {
						this.addTags(langJSON, language);
					}
					// extend quotes by reusing ship's pre-remodels
					// 2nd pass: extend langJSON by considering pre-models
					extendQuotesFromRemodelGroups(langJSON, track);
					// 3rd pass: extend langJSON using enJSON to fill in any missing parts
					langJSON = deepMergePartially(enJSON, langJSON);
					// jQuery.extend cannot control deep merging exclusions
					//langJSON = $.extend(true, {}, enJSON, langJSON);
				}
			}

			return langJSON;
		},

		/* GET JSON
		Used by KC3Meta.js to load json files
		-----------------------------------------*/
		getJSON :function(repo, filename, extendEnglish){
			return this.getJSONWithOptions(
				repo,
				filename,
				extendEnglish,
				ConfigManager.language,
				ConfigManager.info_force_ship_lang,
				ConfigManager.info_eng_stype);
		},
		
		/**
		 * @return the IANA standard (ISO-639) locale tag according our language code.
		 * @see ConfigManager#detectBrowserLanguage - for all language codes we supported.
		 * @see kc3-translation repo all subfolders in `data`.
		 */
		getLocale :function(languageCode = ConfigManager.language){
			// Since some of our language codes are not standard such as JP, KR, SCN, TCN.
			// All available locale tags see also:
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation
			// https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
			return {
				"jp": "ja",
				"kr": "ko",
				"scn": "zh-Hans-CN", // Mainland Simplified Chinese
				"tcn": "zh-Hant", // might include TW, HK, MO
				"tcn-yue": "zh-Hant-HK", // Cantonese dialect for HK, MO
				"ua": "uk",
				"troll": "en"
			}[languageCode.toLowerCase()] || languageCode;
		}
		
	};

})();
