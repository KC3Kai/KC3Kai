/**
 * kcs2.js
 * KC3改 KC Server Phase 2 content scripts.
 *
 * Injected on URLs matching pattern: "*://KC server IPs/kcs2/*api_root=/kcsapi*"
 * See Manifest File [manifest.json] under "content_scripts"
 *
 * Supports for screenshot capturing, zoom scaling, etc.
 */
(function () {
	"use strict";

	(new RMsg("service", "getConfig", {
		id: ["api_gameScale", "dmm_customize", "fix_game_code"],
		attr: ["dmmplay", "extract_api"]
	}, function (response) {
		if (response.value && response.storage) {
			if ( // if dmm site play mode and customize enabled
				(response.value[1] && response.storage[0] == "true")
				// if dmm frame or api link play mode
				|| response.storage[0] == "false" || response.storage[1] == "true"
			) {
				//console.debug("Setting zoom to scale", response.value[0] + "%");
				const scale = (response.value[0] || 100) / 100;
				// There should be one jQuery $ injected into this context
				const gameCanvas = $("canvas"), editArea = $("#r_editarea");
				// Set width for canvas so that zoom will affect both its size and pointer zone
				gameCanvas.css("width", "100%");
				// Scale edit box to right position too
				editArea.css("zoom", scale);
				$("body").css("overflow", "hidden");
			}
		}
		// Experimental function: improve 3rd-party components used by game
		if (response.value && response.value[2]) {
			const body = $("body")[0];
			const script = document.createElement("script");
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", chrome.extension.getURL("library/injections/kcs2_injectable.js"));
			body.appendChild(script);
		}
	})).execute();

})();