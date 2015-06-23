(function(){
	"use strict";
	
	$(document).on("ready", function(){
		// Initialize the panel
		KC3Panel.init({
			// Define horizontal dashboard and its listeners
			horizontal: new KC3Dashboard( $("#h"), {
				
			}),
			
			// Define vertical dashboard and its listeners
			vertical: new KC3Dashboard( $("#v"), {
				
			}),
			
			// Define additional game start sequence
			gameStart: function(){
				$("#wait").hide();
			}
		});
		
		// Detect initial orientation
		KC3Panel.detectOrientation();
		
		// If window is resized, re-check orientation
		$(window).on("resize", function(){
			KC3Panel.detectOrientation();
		});
		
		// Listen to network and define callback for significant events
		KC3Network.listen(function( event ){
			console.log("event triggered", event);
			// Trigger corresponding event on the current Dashboard
			KC3Panel.layout().trigger( event );
		});
		
		// Attempt to activate game on inspected window
		(new RMsg("service", "activateGame", {
			tabId: chrome.devtools.inspectedWindow.tabId
		})).execute();
		
	});
	
})();