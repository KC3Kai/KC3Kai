/* osapi.js
KC3改 API Link Extractor

Injected on URLs matching pattern: "*://osapi.dmm.com/gadgets/*aid=854854*"
See Manifest File [manifest.json] under "content_scripts"

Starts a timer every half-second which checks if kancolle game client is present on the DMM webpage
If detected, passes the API link to background service for saving.

[clearInterval] moved out of the messaging callback to ensure one-time sending only.
When it was inside the callback, it was executed multiple times if response takes awhile.
Bad side, if it saving on background service failed, no fallback plans but to refresh API link again.
*/
(function(){
	"use strict";
	
	// Initialize global variables
	var intervalChecker;

	// Looks for API link
	function checkAgain(){
		console.log("Checking API link...");
		// If API link is found
		if(document.getElementById("htmlWrap")){
			console.log( document.getElementById("htmlWrap").getAttribute("src") );
			// Send it to background script
			(new RMsg(
				"service",
				"set_api_link",
				{ swfsrc: document.getElementById("htmlWrap").getAttribute("src") }
			)).execute();
			
			// Stop interval
			clearInterval(intervalChecker);
		} else if(document.getElementById("externalswf")){
			console.log( document.getElementById("externalswf").getAttribute("src") );
			(new RMsg(
				"service",
				"set_api_link",
				{ swfsrc: document.getElementById("externalswf").getAttribute("src") }
			)).execute();
			clearInterval(intervalChecker);
		}
	}
	
	// Start timer to check if API link exists every half-second
	intervalChecker = setInterval(checkAgain, 500);
	
	(new RMsg("service", "getConfig", {
		id: ["api_gameScale", "dmm_customize"],
		attr: ["dmmplay", "extract_api"]
	}, function(response){
		if(response.value && response.storage){
			// Change osapi whole page zoom based on configured scale
			if( // if dmm site play mode and customize enabled
				(response.value[1] && response.storage[0] == "true")
				// if dmm frame or api link play mode
				|| response.storage[0] == "false" || response.storage[1] == "true"
			){
				console.log("Setting zoom to scale", response.value[0] + "%");
				var scale = (response.value[0] || 100) / 100;
				document.body.style.transform = "scale(" + scale + ")";
				setTimeout(function(){
					var playerOffset = $("#flashWrap").offset();
					$("#flashWrap").css("margin-left", -playerOffset.left / scale);
					$("#flashWrap").css("margin-top", -playerOffset.top);
				}, 3000);
			}
			// For dmm site play mode
			if(response.value[1] && response.storage[0] == "true"){
				// Hide spacing top
				document.getElementById("spacing_top").style = "height:0px;display:none;";
				// Prevent Tab key scrolling
				$(document).on("keydown", function(e){
					if(e.which === 9) {
						$(document).scrollTop(0);
						e.stopPropagation();
						e.preventDefault();
					}
				});
			}
		}
	})).execute();
	
})();