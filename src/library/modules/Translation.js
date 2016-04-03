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
				
				case "jp": fontFamily = '"Helvetica Neue", "Tahoma", Helvetica, Arial, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, "メイリオ", "Meiryo", "Yu Gothic UI Semibold", "ＭＳ Ｐゴシック", "MS PGothic", sans-serif'; break;
				
				default: break;
			}
			
			if(fontFamily){ $("body").css("font-family", fontFamily); }
			
			// Apply HTML language code
			$("html").attr("lang", ConfigManager.language);
		},
		
		/* GET JSON
		Used by KC3Meta.js to load json files
		-----------------------------------------*/
		getJSON :function(repo, filename, extendEnglish){
			if (filename === "quotes") {
				console.log("warning: using KC3Translation.getQuotes to get quotes");
				return this.getQuotes(repo);
			}

			// Check if desired to extend english files
			if(typeof extendEnglish=="undefined"){ extendEnglish=false; }
			
			var language = ConfigManager.language;
			// Japanese special case where ships and items sources are already in JP
			if(
				(["jp", "tcn"].indexOf(language) > -1)
				&& (filename==="ships" || filename==="items")
			){
				extendEnglish = false;
			}
			// make ships.json and items.json an option to be always in specified one
			if (!!ConfigManager.info_force_ship_lang
				&& (filename==="ships" || filename==="items")){
				extendEnglish = false;
				language = ConfigManager.info_force_ship_lang;
			}
			// make "stype.json" an option:
			if (filename === "stype" && ConfigManager.info_eng_stype){
				language = "en";
			}
			
			var translationBase = {}, enJSON;
			if(extendEnglish && language!="en"){
				// Load english file
				enJSON = JSON.parse($.ajax({
					url : repo+'lang/data/en/' + filename + '.json',
					async: false
				}).responseText);
				
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
			} catch (e) {
				if (e instanceof SyntaxError && extendEnglish && language!="en"){
					console.warn(e.stack);
					translation = null;
				} else {
					throw e;
				}
			}
			return $.extend(true, translationBase, translation);
		},

		getQuotes: function(repo) {
			// we always use English version quotes as the base,
			// assuming all quotes are complete so there
			// is no need to extend the table by considering pre-remodel ship quotes.
			var	enJSON = {};
			var language = ConfigManager.language;
			try {
				enJSON = JSON.parse($.ajax({
					url : repo+'lang/data/en/quotes.json',
					async: false
				}).responseText);
			} catch(e) {
				if (e instanceof SyntaxError){
					console.warn(e.stack);
					translation = null;
				} else {
					throw e;
				}
			}

			// if it's already English the we are done.
			if (language === "en") return enJSON;
			
			// load language specific quotes.json
			var langJSON;
			try {
				langJSON = JSON.parse($.ajax({
					url : repo+'lang/data/' +language+ '/quotes.json',
					async: false
				}).responseText);
			} catch (e) {
				console.warn("failed to retrieve language specific quotes.");
				if (e instanceof SyntaxError){
					console.warn(e.stack);
					console.log("falling back to eng version");
					return enJSON;
				} else {
					throw e;
				}
			}

			// extend quotes by reusing ship's pre-remodels
			// 1st pass: extend langJSON by considering pre-models
            if (typeof RemodelDb !== "undefined" && typeof RemodelDb._db !== "undefined") {
			    $.each(RemodelDb._db.remodelGroups, function(orgShipIdStr,groupInfo) {
				    // a group of ship ids that consider as "same ship"
				    // sorted by remodels
				    var group = groupInfo.group;

				    var i,curShipId;
				    // accumulate quotes
				    var curQuotes = {};
                    var q;
				    for (i=0; i<group.length; ++i) {
					    curShipId = group[i];
					    // implicit casting index from num to str
					    q = langJSON[curShipId] || {};
					    // accumulate to curQuotes
					    curQuotes = $.extend(true, {}, curQuotes, q);
					    // note that curQuotes now refers to a different obj
					    // and we haven't done any modification on curQuotes
					    // so it's safe to be assigned to a table
					    langJSON[curShipId] = curQuotes;
				    }
			    });
            } else {
                console.warn("Translation: failed to load RemodelDb, " +
                             "please make sureit's been initialized properly");
            }

			// 2nd pass: extend langJSON using enJSON to fill in any missing parts
			langJSON = $.extend(true, {}, enJSON, langJSON);

			return langJSON;
		}
		
	};
	
})();
