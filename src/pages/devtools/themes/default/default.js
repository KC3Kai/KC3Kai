(function(){
	"use strict";
	
	$(document).on("ready", function(){
		
		// Initialize the panel
		KC3Panel.init({
			// Define horizontal dashboard and its listeners
			horizontal: new KC3Dashboard( $("#h"), {
				HQ: function(container, data){
					console.log("horizontal HQ");
				}
			}),
			
			// Define vertical dashboard and its listeners
			vertical: new KC3Dashboard( $("#v"), {
				HQ: function(container, data){
					console.log("vertical HQ");
				}
			})
		});
		
		// Detect initial orientation
		KC3Panel.detectOrientation();
		
		// If window is resized, re-check orientation
		$(window).on("resize", function(){
			KC3Panel.detectOrientation();
		});
		
		// GameStart on api_start2
		KC3Network.addListener("GameStart", function(event, data){
			$("#wait").hide();
			KC3Panel.activateDashboard();
		});
		
		// CatBomb error modal
		KC3Network.addListener("CatBomb", function(event, data){
			$("#catBomb").hide();
			$("#catBomb .title").text( event.title );
			$("#catBomb .description").text( event.message );
			$("#catBomb").fadeIn(300);
		});
		
		// Global listener
		KC3Network.addGlobalListener(function(event, data){
			KC3Panel.layout().trigger( event, data );
		});
		
		// Start listening to network
		KC3Network.listen();
		
		// Attempt to activate game on inspected window
		(new RMsg("service", "activateGame", {
			tabId: chrome.devtools.inspectedWindow.tabId
		})).execute();
		
	});
	
})();