(function(){
	"use strict";
	
	window.KC3Translation = {
		execute :function(){
			this.areTermsAvailable();
		},
		
		areTermsAvailable :function(){
			var self = this;
			if(typeof KC3Meta._terms.available === "undefined"){
				setTimeout(function(){ self.areTermsAvailable(); }, 100);
			}else{
				this.apply();
			}
		},
		
		apply :function(){
			$(".i18n").each(function(){
				$(this).text( KC3Meta.term( $(this).text() ) );
				$(this).css("visibility", "visible");
			});
		}
	};
	
})();