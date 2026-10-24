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

	const windowOrigin = window.origin || "*";

	/**
	 * Config keys relayed to the injected document scripts
	 */
	const relayedConfigs = [
		'rv_enabled',
		'apiretry_enhancer',
	];

	/**
	 * Hotkey bindings, kept in sync with the extension config
	 */
	let hotkeyBindings = {};

	/**
	 * Get the physical key code of a keyboard event.
	 * jQuery 2.2.4 does not copy the native `code` property onto its wrapper.
	 * @param {KeyboardEvent|jQuery.Event} e - keyboard event
	 * @returns {string} key code, or an empty string
	 */
	const eventCode = (e) => {
		return e.code || (e.originalEvent && e.originalEvent.code) || "";
	};

	const isHotkeyBound = (e) => {
		const code = eventCode(e);
		return Object.keys(hotkeyBindings).some((key) => {
			const binding = hotkeyBindings[key];
			return !!binding && !!binding.code
				&& binding.code === code
				&& Boolean(binding.mod) === Boolean(e.ctrlKey || e.metaKey)
				&& Boolean(binding.alt) === Boolean(e.altKey)
				&& Boolean(binding.shift) === Boolean(e.shiftKey);
		});
	};

	const updateHotkeyBindings = (config) => {
		if (!config) return;
		hotkeyBindings = Object.keys(config).reduce((bindings, key) => {
			if (key.indexOf("hotkey_") === 0) bindings[key] = config[key];
			return bindings;
		}, {});
	};

	function loadScript(src, attrs) {
		const script = document.createElement("script");
		script.setAttribute("type", "text/javascript");
		script.setAttribute("src", src);
		if (attrs) {
			Object.keys(attrs).forEach((key) => script.setAttribute(key, attrs[key]));
		}
		document.body.appendChild(script);
	}

	function doReloadIframe(text, ask) {
		if (!ask || confirm(text || "Reload the subframe of game page?")) {
			window.location.reload();
		}
	}

	// Swallow bound keys, and forward all key events to the devtools panel
	$(document).on("keydown", function (e) {
		if (isHotkeyBound(e)) {
			e.stopPropagation();
			e.preventDefault();
		}
		(new RMsg("devtools", "hotkey", {
			code: eventCode(e),
			ctrlKey: e.ctrlKey,
			altKey: e.altKey,
			shiftKey: e.shiftKey,
			metaKey: e.metaKey,
		})).execute();
	});

	// Read the hotkey bindings. A content script cannot read extension storage.
	(new RMsg("service", "getConfig", {}, (response) => {
		updateHotkeyBindings(response && response.value);
	})).execute();

	var intervalChecker;
	function checkAgain() {
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
		id: ["api_gameScale", "dmm_customize", "fix_game_code", "game_fps"],
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
				// Prevent Tab key scrolling
				$(document).on("keydown", function (e) {
					if (eventCode(e) === "Tab") {
						$(document).scrollTop(0);
						e.stopPropagation();
						e.preventDefault();
					}
				});
			}
		}

		// Experimental function: improve 3rd-party components used by the game
		if (Array.isArray(response.value)) {
			const gameFps = response.value[3];
			const unlockFps = gameFps && gameFps !== 60;
			if (response.value[2] || unlockFps) {
				loadScript(
					chrome.runtime.getURL("library/injections/kcs2_injectable.js"),
					unlockFps ? { "data-fps": String(gameFps) } : null
				);
			}
		}

		// For blocking unexpected game request by verifications on fleets and states against configured conditions
		loadScript(chrome.runtime.getURL("library/injections/axios_injectable.js"));

		// Register message handler for original canvas screenshot and iframe reloading
		RMsg.addListener(function (request, sender, response) {
			if (request.identifier !== "kc3_gamescreen") {
				return true;
			}
			switch (request.action) {
				case "getGameCanvasData":
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
					break;
				case "reloadIframe":
					doReloadIframe(request.text, request.ask);
					break;
			}
			return true;
		});

	})).execute();

	// Adaptor between window messages and runtime messages for injected document scripts
	window.addEventListener('message', (event) => {
		const data = event.data;
		if (!data || !data.type) {
			return;
		}
		switch (data.type) {
			case 'KCS_REQ_VERIFY:REQ':
				// console.debug(data.type, data);
				(new RMsg('kcsRequestVerifier', data.type, data, (response) => {
					// console.debug(response.type, response);
					window.postMessage(response, windowOrigin);
				})).execute();
				return;
			case 'AXIOS_INT_CONFIG:GET':
				// console.debug(data.type, data);
				(new RMsg('service', 'getConfig', { id: relayedConfigs }, (response) => {
					const newConfig = relayedConfigs.reduce((obj, key, i) => {
						if (response && Array.isArray(response.value)) {
							obj[key] = response.value[i];
						}
						return obj;
					}, {});
					window.postMessage({
						type: 'AXIOS_INT_CONFIG:DATA',
						config: newConfig,
					}, windowOrigin);
				})).execute();
				return;
			default:
				// all other data types not handled will be dropped here
				// console.debug('window message event', event);
				return;
		}
	});

	// Notify injected document scripts on config changed
	RMsg.addListener((request, sender, response) => {
		if (request.identifier === 'kc3_gamescreen' && request.action === 'configManagerChanged') {
			// only expose properties about cared by injected document scripts for security
			const config = request.config || {};
			updateHotkeyBindings(config);
			const newConfig = relayedConfigs.reduce((obj, key) => {
				obj[key] = config[key];
				return obj;
			}, {});
			window.postMessage({
				type: 'AXIOS_INT_CONFIG:CHANGE',
				config: newConfig,
			}, windowOrigin);
			// no response needed by config manager
		}
		return true;
	});

})();
