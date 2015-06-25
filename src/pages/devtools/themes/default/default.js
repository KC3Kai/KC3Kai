(function(){
	"use strict";
	
	/* PANEL INIT SUCCESS
	-----------------------------------*/
	function StartPanel(){
		// Declare elements
		KC3Panel.applyCustomizations( $("body") );
		KC3Panel.horizontal = new KC3Dashboard( $("#h"), {}, {}, "horizontal.html");
		KC3Panel.vertical = new KC3Dashboard( $("#v"), {}, {}, "vertical.html");
		
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
	}
	
	/* PAGE READY
	-----------------------------------*/
	$(document).on("ready", function(){
		// Validate storage and initialize data managers
		KC3Panel.init(function(success, message){
			if(success){
				// Successful initialization
				StartPanel();
			}else{
				// Failed. Show an error box
				$("#wait").hide();
				$("<div>").css({
					"width" : "450px",
					"padding" : "15px 20px",
					"background" : "#fcc",
					"border-radius" : "10px",
					"margin" : "30px auto 0px",
					"text-align" : "center",
					"font-weight" : "bold",
					"font-size" : "12px",
					"border" : "1px solid #c77"
				}).html(message).appendTo("body");
			}
		});
		
	});
	
})();