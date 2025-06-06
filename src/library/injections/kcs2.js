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

	var intervalChecker;
	function checkAgain(){
		console.log("Checking game canvas...");
		const gameCanvas = document.querySelector("canvas");
		if (gameCanvas) {
			// Set width for canvas so that zoom will affect both its size and pointer zone
			gameCanvas.style.width = "100%";
			clearInterval(intervalChecker);
		}
	}
	// Start timer to check if canvas element ready every half-second
	intervalChecker = setInterval(checkAgain, 500);

	(new RMsg("service", "getConfig", {
		id: ["api_gameScale", "dmm_customize", "fix_game_code"],
		attr: ["dmmplay", "extract_api"]
	}, function (response) {
		if (Array.isArray(response.value) && Array.isArray(response.storage)) {
			if ( // if dmm site play mode and customize enabled
				response.value[1]
				// if dmm frame or api link play mode
				|| response.storage[0] != "true" || response.storage[1] == "true"
			) {
				//console.debug("Setting zoom to scale", response.value[0] + "%");
				const scale = (response.value[0] || 100) / 100;
				// There should be one jQuery $ injected into this context
				const editArea = $("#r_editarea");
				// Scale edit box to right position too, no longer needed for chrome 128~
				if (!Promise.try) editArea.css("zoom", scale);
				$("body").css("overflow", "hidden");
				// Prevent Tab key scrolling, and F7 mode
				$(document).on("keydown", function(e){
					if(e.which === 9 || e.which === 118) {
						$(document).scrollTop(0);
						e.stopPropagation();
						e.preventDefault();
					}
				});
			}
		}
		// Experimental function: improve 3rd-party components used by game
		if (Array.isArray(response.value) && !!response.value[2]) {
			const body = $("body")[0];
			const script = document.createElement("script");
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", chrome.runtime.getURL("library/injections/kcs2_injectable.js"));
			body.appendChild(script);
		}
		// Register original canvas screenshot message handler
		chrome.runtime.onMessage.addListener(function(request, sender, response) {
			if (request.action != "getGameCanvasData") return true;
			const gameCanvas = document.querySelector("canvas");
			if (!gameCanvas) {
				response({});
			} else {
				window.requestAnimationFrame(() => {
					response({
						base64img: gameCanvas.toDataURL(),
						width: gameCanvas.width,
						height: gameCanvas.height,
						devicePixelRatio: window.devicePixelRatio
					});
				});
			}
			return true;
		});
	})).execute();

})();