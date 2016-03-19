/* osapi.js
KC3改 API Link Extractor

Injected on URLs matching pattern: "*://osapi.dmm.com/gadgets/*aid=854854*"
See Manifest File [manifest.json] under "content_scripts"

Starts a timer every half-second which checks if kancolle game client is present on the DMM webpage
If detected, passes the API link to background service for saving.

[clearInterval] moved out of the messaging callback to ensure one-time sending only.
When it was inside the callback, it was executed multiple times if response takes awile.
Bad side, if it saving on background service failed, no fallback plans but to refresh API link again.
*/
(function(){
	"use strict";
	
	// Initialize global variables
	var intervalChecker;

	// Looks for API link
	function checkAgain(){
		console.log("checking...");
		// If API link is found
		if(document.getElementById("externalswf")){
			console.log( document.getElementById("externalswf").getAttribute("src") );
			// Send it to background script
			(new RMsg(
				"service",
				"set_api_link",
				{ swfsrc: document.getElementById("externalswf").getAttribute("src") }
			)).execute();
			
			// Stop interval
			clearInterval(intervalChecker);
		}
	}
	
	// Start timer to check if API link exists every half-second
	intervalChecker = setInterval(checkAgain, 500);
	
})();