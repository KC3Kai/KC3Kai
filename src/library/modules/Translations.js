(function(){
	"use strict";
	
	window.KC3Translation = {
		/* EXECUTE
		Triggers translations into current page
		-----------------------------------------*/
		execute :function(){
			this.applyWords();
			this.applyCustomFont();
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
		
		/* APPLY CUSTOM FONT
		For languages read best in other fonts
		-----------------------------------------*/
		applyCustomFont: function(){
			// Specialized fonts
			var fontFamily = false;
			// ConfigManager.language
			// KC3Meta._langcustom.
		},
		
		/* APPLY HTML
		Specialized Language HTML adjustments
		-----------------------------------------*/
		applyHTML :function(){
			if(fontFamily){ $("body").css("font-family", fontFamily); }
			
			// Apply HTML language code
			$("html").attr("lang", ConfigManager.language);
		},
		
		
		load: function(){
			
		}
	};

	//---------------- PRIVATE FUNCTIONS ----------------//

	function loadSync(targetUrl, callback){
		var data = JSON.parse($.ajax({
			url : targetUrl,
			dataType: 'JSON',
			async: false
		}).responseText);
		callback(data);
	}

})();