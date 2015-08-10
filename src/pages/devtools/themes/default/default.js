(function(){
	"use strict";
	_gaq.push(['_trackEvent', "Panel: Default Theme", 'clicked']);
	
	/* PANEL INIT SUCCESS
	-----------------------------------*/
	function StartPanel(){
		KC3Panel.horizontal = ThemeDefaultHorizontal;
		KC3Panel.horizontal.start();
		
		KC3Panel.vertical = ThemeDefaultVertical;
		KC3Panel.vertical.start();
		
		KC3Panel.applyCustomizations( $("body") );
		KC3Panel.detectOrientation();
		
		KC3Meta.defaultIcon("../../../../assets/img/ui/empty.png");
		
		// $("#wait").hide();
		// KC3Panel.activateDashboard();
		
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
			$("#catBomb .title").html( data.title );
			$("#catBomb .description").html( data.message );
			$("#catBomb").fadeIn(300);
		});
		
		// Global listener
		KC3Network.addGlobalListener(function(event, data){
			if(KC3Panel.state == "running"){
				KC3Panel.layout().trigger(event, data);
			}
		});
		
		// Start listening to network
		KC3Network.listen();
		
		
		/* INTERACTIONS
		-----------------------------------*/
		// Close CatBomb modal
		$("#catBomb .closebtn").on("click", function(){
			$("#catBomb").fadeOut(300);
		});
		
		// Lastly, attempt to activate game on inspected window
		(new RMsg("service", "activateGame", {
			tabId: chrome.devtools.inspectedWindow.tabId
		})).execute();
		
		// Remove translation when closing devtools
		window.onbeforeunload = function(){
			KC3Network.hasOverlay = false;
			(new RMsg("service", "clearOverlays", {
				tabId: chrome.devtools.inspectedWindow.tabId
			})).execute();
		};
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
	
	// If window is resized, re-check orientation
	$(window).on("resize", function(){
		KC3Panel.detectOrientation();
	});
	
})();