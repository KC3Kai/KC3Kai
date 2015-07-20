(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	// Redirect to DMM play page when activated
	function ActivateGame(){
		window.location = "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/";
	}
	
	$(document).on("ready", function(){
		
		// Quick Play
		$(".play_btn").on('click', function(){
			ActivateGame();
		});
		
	});
	
	// Extension Interaction
	chrome.runtime.onMessage.addListener(function(request, sender, response) {
		if(request.identifier == "kc3_gamescreen"){
			if(request.action == "activateGame"){
				ActivateGame();
			}
		}
	});
	
})();