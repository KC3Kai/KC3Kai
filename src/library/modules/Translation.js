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
			// Check if desired to extend english files
			if(typeof extendEnglish=="undefined"){ extendEnglish=false; }
			
			var language = ConfigManager.language;
			// Japanese special case where ships and items sources are already in JP
			if(
				(["jp", "tcn"].indexOf(language) > -1)
				&& (filename==="ships" || filename==="items")
			){
				extendEnglish=false;
			}
			// make ships.json and items.json an option to be always in Japanese
			if (ConfigManager.info_jp_ship_item
				&& (filename==="ships" || filename==="items")){
				extendEnglish=false;
				language = "jp";
			}
			// make "stype.json" an option:
			if (filename === "stype" && ConfigManager.info_eng_stype){
				language = "en";
			}
			
			var translationBase = {}, enJSON;
			if(extendEnglish && ConfigManager.language!="en"){
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
				if (e instanceof SyntaxError && filename === "stype")
					translation = null;
				else
					throw e;
			}
			return $.extend(true, translationBase, translation);
		}
		
	};
	
})();
