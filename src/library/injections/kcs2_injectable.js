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

	const maxRetries = 60;
	let checkerTimer = 0, retries = 0;

	const checkComponents = function () {
		console.log("Checking 3rd-party components...");
		retries += 1;
		const pixi = window.PIXI;
		const howler = window.Howler;
		if (!pixi || !howler) {
			if (retries > maxRetries) clearInterval(checkerTimer);
			return false;
		}

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
		howler._howls._push = howler._howls.push;
		howler._howls.push = function () {
			const thisHowl = arguments[0];
			/*
			thisHowl.on("play", (id) => {
				console.debug("Playing", id, thisHowl._src, thisHowl._duration);
			});
			*/
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
			howler._howls._push.apply(this, arguments);
		};

		console.log("Components hooked!");
		if (checkerTimer) clearInterval(checkerTimer);
		return true;
	};
	checkerTimer = setInterval(checkComponents, 1000);

})();