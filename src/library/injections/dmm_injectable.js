/* dmm_injectable.js
KC3改 reloadDialog override

Injected on URLs matching pattern: "*://osapi.dmm.com/gadgets/*aid=854854*"
See osapi.js

Overrides DMM reload dialog, making it only show once per session.
*/
(function(){
	"use strict";
	var sendDMMReloadAttempt = true;

	// Override DMM's reload dialog
	window.DMM.netgame.reloadDialog = function() {
		console.error("[DMM] Unable to update security token. Please refresh game when you can.");
		if(sendDMMReloadAttempt) {
			sendDMMReloadAttempt = false;
			alert("Unable to update security token.\n" + 
				"This can happen when you log somewhere else in, when you clear your cookies or when DMM is under maintenence.\n" +
				"You might be unable to use some DMM specific features like the DMM point shop unless you refresh.");
		}
	};

})();