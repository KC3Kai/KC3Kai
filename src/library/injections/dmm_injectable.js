/* dmm_injectable.js
KC3改 reloadDialog override

Injected on URLs matching the same pattern with dmm_takeover.js, like: *.dmm.com
See dmm_takeover.js and manifest.json

Overrides DMM force reloading dialog, making it only show once per session.
*/
(function(){
	"use strict";
	var sendDMMReloadAttempt = true;

	// Original DMM reloadDialog shows an alert box, then force page reloaded
	if(window.DMM && window.DMM.netgame) {
		window.DMM.netgame.reloadDialog = function() {
			console.warn("[DMM] Unable to update security token. Please refresh game when you can.");
			if(sendDMMReloadAttempt) {
				sendDMMReloadAttempt = false;
				alert("Unable to update security token.\n" +
					"This can happen when you log somewhere else in, when you clear your cookies or when DMM is under maintenence.\n" +
					"You might be unable to use some DMM specific features like the DMM point shop unless you refresh.");
			}
		};
	}

})();