(function(){
	"use strict";
	
	$(document).on("ready", function(){
		
		// Define horizontal dashboard and its listeners
		KC3Panel.horizontal = new KC3Dashboard( $("#h") );
		
		// Define vertical dashboard and its listeners
		KC3Panel.vertical = new KC3Dashboard( $("#v") );
		
		// Detect initial orientation
		KC3Panel.detectOrientation();
		
		// If window is resized, re-check orientation
		$(window).on("resize", function(){
			KC3Panel.detectOrientation();
		});
		
		// Listen to network and define callback for significant events
		KCNetwork.listen(function( event ){
			// Trigger corresponding event on the current Dashboard
			KC3Panel.layout().trigger( event );
		});
		
		// Attempt to activate game on inspected window
		(new RMsg("service", "activateGame", {
			tabId: chrome.devtools.inspectedWindow.tabId
		})).execute();
		
	});
	
})();