(function(){
	"use strict";
	
	window.KC3Translation = {
		/* EXECUTE
		Triggers translations into current page
		-----------------------------------------*/
		execute :function(){
			this.applyWords();
			this.applyHTML();
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
			// Specialized fonts
			var fontFamily = false;
			switch(ConfigManager.language){
				
				case "scn": fontFamily = '"HelveticaNeue-Light","Helvetica Neue Light","Helvetica Neue",Helvetica,"Nimbus Sans L",Arial,"Lucida Grande","Liberation Sans","Microsoft YaHei UI","Microsoft YaHei","Hiragino Sans GB","Wenquanyi Micro Hei","WenQuanYi Zen Hei","ST Heiti",SimHei,"WenQuanYi Zen Hei Sharp",sans-serif'; break;
				
				case "tcn": fontFamily = '"Helvetica Neue", Helvetica, "Microsoft JhengHei", "Microsoft JhengHei UI", Arial,"Heiti TC", sans-serif'; break;
				
				case "jp": fontFamily = '"Helvetica Neue", "Tahoma", Helvetica, Arial, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, "メイリオ", "Meiryo", "Yu Gothic UI Semibold", "ＭＳ Ｐゴシック", "MS PGothic", sans-serif'; break;
				
				default: break;
			}
			
			if(fontFamily){ $("body").css("font-family", fontFamily); }
			
			// Apply HTML language code
			$("html").attr("lang", ConfigManager.language);
		},

		/*
		  Recursively changing any non-object value "v" into "{val: v, tag: <tag>}".
		 */
		addTags: function(obj, tag) {
			function track(obj) {
				if (typeof obj === "object") {
					$.each( obj, function(k,v) {
						// should work for both arrays and objects
						obj[k] = track(v);
					});
				} else {
					return {val: obj, tag: tag};
				}
				return obj;
			}

			console.assert(
				typeof obj === "object",
				"addTags should only be applied on objects");
			return track(obj);
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

		getJSONWithOptions: function(
			repo, filename, extendEnglish, language,
			info_force_ship_lang, info_eng_stype, track_source,
			shouldAsync, callback
		) {
			this.translationBase = {};
			this.enJSON = {};
			this.localJSON = {};
			
			// default values of params
			shouldAsync = typeof shouldAsync == "undefined" ? false : shouldAsync;
			extendEnglish = typeof extendEnglish == "undefined" ? false : extendEnglish;
			track_source = typeof track_source == "undefined" ? false : track_source;

			// if quotes.json is desired, use specialized function
			if (filename === "quotes") {
				console.log("warning: using KC3Translation.getQuotes to get quotes");
				return this.getQuotes(repo);
			}

			// Japanese special case where ships and items sources are already in JP
			if(
				(["jp", "tcn"].indexOf(language) > -1)
				&& (filename == "ships" || filename == "items")
			){
				extendEnglish = false;
			}
			
			// make ships.json and items.json an option to be always in specified one
			if (!!info_force_ship_lang
				&& (filename==="ships" || filename==="items"))
			{
				extendEnglish = false;
				language = info_force_ship_lang;
			}
			
			// make "stype.json" an option:
			if (filename === "stype" && info_eng_stype){
				language = "en";
			}
			
			var tlfile = new KC3TranslationFile();
			
			if(extendEnglish && language!=="en"){
				tlfile.loadEnglish(function(){
					if (track_source) {
						tlfile.addTags("en");
					}
					if (filename === "quests") {
						tlfile.unoverrideAttr("memo");
					}
					tlfile.loadLanguage(function(){
						tlfile.process();
					});
				});
			} else {
				tlfile.loadLanguage(function(){
					tlfile.process();
				});
			}
		},
		
		loadDataENBase: function(callback){
			self.loadData(
				repo+'lang/data/en/' + filename + '.json',
				shouldAsync,
				function(data){
					enJSON = data;
					
					
					
					// Make is as the translation base
					translationBase = enJSON;
					
					callback();
				}
			);
		},
		
		loadDataLocal: function(callback){
			self.loadData(
				repo+'lang/data/' +language+ '/' + filename + '.json',
				shouldAsync,
				function(data, err){
					if (typeof err == "undefined") {
						translation = data;
						
						if (track_source) {
							self.addTags(translation, language);
						}
						
						callback($.extend(true, translationBase, translation));
						
					} else {
						// As EN can be used, fail-safe for other JSON syntax error
						if (e instanceof SyntaxError && extendEnglish && language!=="en"){
							console.warn(e.stack);/*RemoveLogging:skip*/
							translation = null;
							// Show error message for Strategy Room
							if($("#error").length>0){
								$("#error").append(
									$("<p>Syntax error on {0} TL data of {1}: {2}</p>".format(filename, language, e.message))
								);
								$("#error").show();
							}
						}
						
						callback({}, e);
					}
				}
			);
		},
		
		loadData: function(targetUrl, doAsync, callback){
			try {
				if (doAsync) {
					$.ajax({
						url : targetUrl,
						dataType: 'JSON',
						sucess: function(response){
							callback(JSON.parse(response));
						}
					});
				} else {
					var data = JSON.parse($.ajax({
						url : targetUrl,
						dataType: 'JSON',
						async: false
					}).responseText);
					callback(data);
				}
			} catch (e) {
				callback({}, e);
			}
		},

		getShipVoiceFlag: function (shipMasterId) {
			var shipData = KC3Master.ship(shipMasterId);
			return shipData ? shipData.api_voicef : 0;
		},

		// check if a ship has idle voice
		shipHasIdleVoice: function (shipMasterId) {
			return (1 & this.getShipVoiceFlag(shipMasterId)) !== 0;
		},

		// check if a ship has hourly voices
		shipHasHourlyVoices: function (shipMasterId) {
			return (2 & this.getShipVoiceFlag(shipMasterId)) !== 0;
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
			"Repair" : 6,

			"H0000":30, "H0100":31, "H0200":32, "H0300":33,
			"H0400":34, "H0500":35, "H0600":36, "H0700":37,
			"H0800":38, "H0900":39, "H1000":40, "H1100":41,
			"H1200":42, "H1300":43, "H1400":44, "H1500":45,
			"H1600":46, "H1700":47, "H1800":48, "H1900":49,
			"H2000":50, "H2100":51, "H2200":52, "H2300":53
		},
		// see initialization code below.
		_idToDesc: null,

		// descriptive voice key to numeric one
		voiceDescToNum: function(k) {
			return this._descToId[k];
		},

		// numeric voice key to descriptive one
		voiceNumToDesc: function(k) {
			return this._idToDesc[k];
		},

		// get available ship voice numbers by checking 
		// voice flag of a ship.
		// the result is sorted.
		getShipVoiceNums: function(masterId,includeHourlies,includeRepair) {
			if (typeof includeHourlies === "undefined")
				includeHourlies = true;
			if (typeof includeRepair === "undefined")
				includeRepair = false;
			var sortedVoiceNums =  [
				1,25,2,3,4,28,24,8,13,9,10,26,27,11,
				12,5,7,14,15,16,18,17,23,19,20,21,22,
			];
			var hourlyNums = [
				30,31,32,33,34,35,36,37,38,39,40,41,
				42,43,44,45,46,47,48,49,50,51,52,53
			];

			// add idle voice key
			if (this.shipHasIdleVoice(masterId))
				sortedVoiceNums.push(29);

			// add repair key
			if (includeRepair)
				sortedVoiceNums.push(6);

			if (includeHourlies && this.shipHasHourlyVoices(masterId))
				sortedVoiceNums = sortedVoiceNums.concat(hourlyNums);

			return sortedVoiceNums;
		},

		// insert quote id as key if descriptive key is used.
		transformQuotes: function(quotes, language, checkKey) {
			var self = this;
			function isIntStr(s) {
				return parseInt(s,10).toString() === s;
			}

			$.each( quotes, function(k,v) {
				if (! isIntStr(k) )
					return;
				// transforming "v" object

				// get an immutable list of keys for further operation
				var subKeys = Object.keys(v);
				$.each(subKeys, function(i,subKey) {
					var subId = self.voiceDescToNum(subKey);
					if (subId) {
						// force overwriting regardless of original content
						// empty content not replaced
						if (v[subKey] && v[subKey].length) {
							v[subId] = v[subKey];

							// temporary hack for scn quotes
							// as we don't use special key for seasonal lines
							// and en will always has priority on that.
							if (["scn", "kr"].indexOf(language) > -1) {
								if (subId === 2) {
									v[6547] = v[subKey];
								}
								if (subId === 3) {
									v[1471] = v[subKey];
								}
							}
						}
					} else {
						if (!!checkKey && ! isIntStr(subKey) ) {
							// neither a descriptive key nor a normal number
							console.debug( "Not transformed subtitle key:", subKey,
								"(masterId=", k, ")");
						}
					}
				});
				
			});
			return quotes;
		},

		getQuotes: function(repo, track, language, checkKey) {
			var self = this;
			if (typeof track === "undefined")
				track = false;

			// we always use English version quotes as the base,
			// assuming all quotes are complete so there
			// is no need to extend the table by considering pre-remodel ship quotes.
			var enJSON = {};
			language = language || ConfigManager.language;
			try {
				enJSON = JSON.parse($.ajax({
					url : repo+'lang/data/en/quotes.json',
					async: false
				}).responseText);
				if (track) {
					self.addTags(enJSON,"en");
				}
			} catch(e) {
				if (e instanceof SyntaxError){
					console.warn(e.stack);/*RemoveLogging:skip*/
					translation = null;
				} else {
					throw e;
				}
			}

			var langJSON;
			if (language === "en") {
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
						console.warn(e.stack);/*RemoveLogging:skip*/
						console.warn("Failed to load",language,"quotes, falling back to en version");
						// Show unduplicated error message for Strategy Room
						if($("#error").length>0 && $("#error").text().indexOf("quotes.json")<0){
							$("#error").append(
								$("<p>Syntax error on {0} quotes.json: {1}</p>".format(language, e.message))
							);
							$("#error").show();
						}
						langJSON = enJSON;
						language = "en";
					} else {
						console.error(e.stack);/*RemoveLogging:skip*/
						throw e;
					}
				}
			}

			// 1st pass: interpret descriptive keys as keys
			this.transformQuotes(langJSON, language, checkKey);
			if (track && language !== "en") {
				self.addTags(langJSON, language);
			}

			// extend quotes by reusing ship's pre-remodels
			// 2nd pass: extend langJSON by considering pre-models
			if (typeof RemodelDb !== "undefined" && !!RemodelDb._db && !!RemodelDb._db.remodelGroups) {
				$.each(RemodelDb._db.remodelGroups, function(orgShipIdStr,groupInfo) {
					// a group of ship ids that consider as "same ship"
					// sorted by remodels
					var group = groupInfo.group;
					var i,curShipId;
					// accumulate quotes
					var curQuotes = {};
					var q;

					$.each(group, function(i,curShipId) {
						// implicit casting index from num to str
						q = langJSON[curShipId] || {};
						if (track) {
							$.each(q,function(k,v) {
								q[k].tag = curShipId;
							});
						}
						// accumulate to curQuotes
						curQuotes = $.extend(true, {}, curQuotes, q);
						// note that curQuotes now refers to a different obj
						// and we haven't done any modification on curQuotes
						// so it's safe to be assigned to a table
						langJSON[curShipId] = curQuotes;
					});
				});
			} else {
				console.warn("Translation: failed to load RemodelDb, " +
							 "please make sure it's been initialized properly");/*RemoveLogging:skip*/
			}

			// 3rd pass: extend langJSON using enJSON to fill in any missing parts
			if (language !== "en") {
				langJSON = $.extend(true, {}, enJSON, langJSON);
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
		
		loadOnlineTranslations :function(filename, extendEnglish, language, info_force_ship_lang, info_eng_stype, track_source){
			this.getJSONWithOptions(
				"https://raw.githubusercontent.com/KC3Kai/kc3-translations/master/data",
				filename,
				extendEnglish,
				language,
				info_force_ship_lang,
				info_eng_stype,
				track_source,
				true // async
			);
		}
		
	};

	KC3Translation._idToDesc = {};
	$.each(KC3Translation._descToId, function(k,v) {
		KC3Translation._idToDesc[v] = k;
	});
})();
