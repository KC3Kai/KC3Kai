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
				$(this).text( KC3Meta.term( $(this).text() ) );
				$(this).css("visibility", "visible");
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
				
				case "jp": fontFamily = "\"ヒラギノ角ゴ Pro W3\", \"Hiragino Kaku Gothic Pro\",Osaka, \"メイリオ\", Meiryo, \"ＭＳ Ｐゴシック\", \"MS PGothic\", sans-serif"; break;
				
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
			
			// Japanese special case where ships and items sources are already in JP
			if(ConfigManager.language=="jp" && (filename=="ships" || filename=="items")){ extendEnglish=false; }
			
			// console.log(filename, "extendEnglish", extendEnglish);
			
			var translationBase = {}, enJSON;
			if(extendEnglish){
				// Load english file
				enJSON = JSON.parse($.ajax({
					url : repo+'translations/en/' + filename + '.json',
					async: false
				}).responseText);
				
				// Make is as the translation base
				translationBase = enJSON;
			}
			
			return $.extend(true, translationBase, JSON.parse($.ajax({
				url : repo+'translations/' +ConfigManager.language+ '/' + filename + '.json',
				async: false
			}).responseText));
		}
		
	};
	
})();