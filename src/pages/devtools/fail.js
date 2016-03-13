(function(){
	"use strict";
	_gaq.push(['_trackEvent', "DevTools Failed", 'clicked']);
	
	// Document ready
	$(document).on("ready", function(){
		$("#CookieSettings").on("click", function(){
			(new RMsg("service", "openCookieSettings")).execute();
		});
	});
})();
