/**
 * kcs2_injectable.js
 * KC3改 KC Server Phase 2 injectable to access global context.
 *
 * Injected on URLs matching the same pattern with kcs2.js,
 * See kcs2.js and manifest.json
 *
 * Supports for improved usage of 3rd-party HTML5 components.
 */
(function () {
	"use strict";

	const debug = false;
	const maxRetries = 60;
	let checkerTimer = 0;
	let retries = 0;

	/**
	 * Target frame rate passed by kcs2.js.
	 * @type {number} 0 means disabled.
	 */
	const targetFps = (() => {
		const script = document.currentScript;
		const value = script && script.dataset ? parseInt(script.dataset.fps, 10) : 0;
		return value > 0 ? value : 0;
	})();

	/**
	 * Raise the game frame rate and log the measured rate.
	 * @param {object} createjs - Global CreateJS namespace.
	 */
	const hookTicker = (createjs) => {
		const ticker = createjs && createjs.Ticker;
		if (!ticker || !targetFps || ticker.__kc3FpsHooked) return;
		ticker.__kc3FpsHooked = true;

		const originalSetFPS = ticker.setFPS;
		/**
		 * Keep the target rate when the game restores its saved 60 fps value,
		 * and do not exceed the target rate.
		 * @param {number} fps - Requested frame rate.
		 */
		ticker.setFPS = function (fps) {
			const rate = fps === 60 ? targetFps : Math.min(fps, targetFps);
			return originalSetFPS.call(this, rate);
		};
		originalSetFPS.call(ticker, targetFps);

		if (debug) {
			let ticks = 0;
			let lastTime = Date.now();
			ticker.addEventListener("tick", () => {
				ticks += 1;
			});
			/**
			 * Log the measured frame rate.
			 */
			const logFps = () => {
				const now = Date.now();
				const elapsed = now - lastTime;
				const measured = elapsed > 0 ? ticks * 1000 / elapsed : 0;
				ticks = 0;
				lastTime = now;
				console.log("[KC3] Game FPS: " + measured.toFixed(1) + " / target " + ticker.framerate);
			};
			setInterval(logFps, 1000);
		}
	};

	/**
	 * Check for the game's third-party components.
	 * @returns {boolean} True if the components are ready.
	 */
	const checkComponents = () => {
		console.log("Checking 3rd-party components...");
		retries += 1;
		const pixi = window.PIXI;
		const howler = window.Howler;
		const createjs = window.createjs;
		if (!pixi || !howler || (targetFps && !createjs)) {
			if (retries > maxRetries) clearInterval(checkerTimer);
			return false;
		}

		hookTicker(createjs);

		// Register original canvas screenshot message listener?
		//pixi.settings.RENDER_OPTIONS.preserveDrawingBuffer = true;
		/*
		window.addEventListener("message", (event) => {
			if (event.origin !== window.location.origin) return;
			if (!event.data || event.data.action !== "getGameCanvasDataReq") return;
			pixi.settings.RENDER_OPTIONS.preserveDrawingBuffer = true;
			setTimeout(function() {
				pixi.settings.RENDER_OPTIONS.preserveDrawingBuffer = false;
			}, 1000);
			const canvasData = {};
			const gameCanvas = document.querySelector("canvas");
			if (gameCanvas) {
				canvasData.base64img = gameCanvas.toDataURL();
				canvasData.width = gameCanvas.width;
				canvasData.height = gameCanvas.height;
				canvasData.devicePixelRatio = window.devicePixelRatio;
			}
			event.source.postMessage({
				action: "getGameCanvasDataResp",
				canvas: canvasData
			}, event.origin);
		});
		*/

		// Hook and improve pixi.js if necessary?
		/*
		const originalRender = pixi.WebGLRenderer.prototype.render;
		pixi.WebGLRenderer.prototype.render = function() {
			// TODO stub
			return originalRender.apply(this, arguments);
		};
		*/

		// Hook and improve howler.js instance management: unload it on sound playback ended,
		// same sound will reload resource file again, but should hit browser's disk cache.
		// The game has added unload() invoking, but under some environment (some versions of Chromium),
		// although JS heap can be GC, but process memory used by buffer of downloaded files not released by browser.
		/*
		howler._howls._push = howler._howls.push;
		howler._howls.push = function () {
			const thisHowl = arguments[0];
			//thisHowl.on("play", (id) => {
			//	console.debug("Playing", id, thisHowl._src, thisHowl._duration);
			//});
			// To unload voices and SEs except looping BGM
			thisHowl.on("end", (id) => {
				if (thisHowl.state() === "loaded" && !thisHowl._loop) {
					thisHowl.unload();
					//console.debug("Unloaded OnEnd", id);
				}
			});
			// To unload previous BGM looped when new BGM started but old one not ended
			thisHowl.on("stop", (id) => {
				if (thisHowl.state() === "loaded") {
					thisHowl.unload();
					//console.debug("Unloaded OnStop", id);
				}
			});
			// To unload battle BGM faded out only without stop looping
			thisHowl.on("fade", (id) => {
				if (thisHowl.state() === "loaded" && thisHowl._volume <= 0) {
					thisHowl.unload();
					//console.debug("Unloaded OnFade", id);
				}
			});
			howler._howls._push.apply(this, arguments);
		};
		*/

		console.log("Components hooked!");
		if (checkerTimer) clearInterval(checkerTimer);
		return true;
	};

	checkerTimer = setInterval(checkComponents, 1000);

})();
