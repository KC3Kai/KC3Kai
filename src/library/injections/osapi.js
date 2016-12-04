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
	
	// Check if we are on KC3改 frame to override DMM style to crop game screen
	(new RMsg("service", "osapiCssInject", {}, function(response){
		// if yes, apply CSS overrides
		if (response.value) {
			$("#spacing_top").hide();
		}
	})).execute();

	
})();