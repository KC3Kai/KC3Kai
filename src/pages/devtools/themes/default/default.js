(function(){
	"use strict";
	
	$(document).on("ready", function(){
		ConfigManager.load();
		MasterManager.init();
		
		/* PANEL INITIALIZATION
		-----------------------------------*/
		// Initialize the panel
		KC3Panel.init({
			// Define horizontal dashboard and its listeners
			horizontal: new KC3Dashboard( $("#h"), {
				HQ: function(container, data){
					$(".admiral_name", container).text("HORIZ");
				}
			}, {}, "horizontal.html"),
			
			// Define vertical dashboard and its listeners
			vertical: new KC3Dashboard( $("#v"), {
				HQ: function(container, data){
					
				}
			}, {}, "vertical.html"),
			
			// Element to be initialized with background customizations
			backgroundElement: $("body")
		});
		
		// Detect initial orientation
		KC3Panel.detectOrientation();
		
		// If window is resized, re-check orientation
		$(window).on("resize", function(){
			KC3Panel.detectOrientation();
		});
		
		
		/* NETWORK
		-----------------------------------*/
		// GameStart on api_start2
		KC3Network.addListener("GameStart", function(event, data){
			$("#wait").hide();
			KC3Panel.activateDashboard();
		});
		
		// Enter home port screen
		KC3Network.addListener("HomeScreen", function(event, data){
			$("#wait").hide();
			KC3Panel.activateDashboard();
		});
		
		// CatBomb error modal
		KC3Network.addListener("CatBomb", function(event, data){
			$("#catBomb").hide();
			$("#catBomb .title").text( data.title );
			$("#catBomb .description").text( data.message );
			$("#catBomb").fadeIn(300);
		});
		
		// Global listener
		KC3Network.addGlobalListener(function(event, data){
			KC3Panel.layout().trigger(event, data);
		});
		
		// Start listening to network
		KC3Network.listen();
		
		
		/* INTERACTIONS
		-----------------------------------*/
		// Close CatBomb modal
		$("#catBomb .closebtn").on("click", function(){
			$("#catBomb").fadeOut(300);
		});
		
		// Attempt to activate game on inspected window
		(new RMsg("service", "activateGame", {
			tabId: chrome.devtools.inspectedWindow.tabId
		})).execute();
	});
	
})();