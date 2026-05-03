(function() {
	'use strict';

	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		if (message.target !== 'kc3_offscreen_ping') return false;
		sendResponse({ ready: true });
		return false;
	});

	chrome.runtime.sendMessage({
		target: 'kc3_offscreen_ready'
	});
})();
