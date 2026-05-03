(function() {
	'use strict';

	window.KC3OffscreenBridge = true;

	const eventListeners = {
		'cookies.onChanged': new Set(),
		'notifications.onButtonClicked': new Set(),
		'notifications.onClicked': new Set(),
		'notifications.onClosed': new Set(),
		'runtime.onUpdateAvailable': new Set(),
		'storage.onChanged': new Set()
	};
	let lastRuntimeError = null;
	let manifestCache = null;

	function defineLastError() {
		try {
			Object.defineProperty(chrome.runtime, 'lastError', {
				configurable: true,
				get: function() {
					return lastRuntimeError;
				}
			});
		} catch (error) {}
	}

	function invokeCallback(callback, response) {
		lastRuntimeError = response && response.error ? { message: response.error } : null;
		try {
			callback(response ? response.result : undefined);
		} finally {
			lastRuntimeError = null;
		}
	}

	function sendWorkerApi(method, args, callback) {
		chrome.runtime.sendMessage({
			target: 'kc3_worker_api',
			method: method,
			args: args || []
		}, function(response) {
			if (typeof callback === 'function') {
				invokeCallback(callback, response || {});
			}
		});
	}

	function createEvent(name) {
		return {
			addListener: function(listener) {
				eventListeners[name].add(listener);
			},
			removeListener: function(listener) {
				eventListeners[name].delete(listener);
			},
			hasListener: function(listener) {
				return eventListeners[name].has(listener);
			}
		};
	}

	function callbackMethod(method) {
		return function() {
			const args = Array.prototype.slice.call(arguments);
			const callback = typeof args[args.length - 1] === 'function' ? args.pop() : undefined;
			sendWorkerApi(method, args, callback);
		};
	}

	function noCallbackMethod(method) {
		return function() {
			sendWorkerApi(method, Array.prototype.slice.call(arguments));
		};
	}

	defineLastError();

	if (typeof chrome.runtime.getURL !== 'function') {
		chrome.runtime.getURL = function(path) {
			return new URL(path || '', window.location.href).href;
		};
	}

	if (!chrome.runtime.id) {
		chrome.runtime.id = new URL(chrome.runtime.getURL('')).host;
	}

	if (typeof chrome.runtime.getManifest !== 'function') {
		chrome.runtime.getManifest = function() {
			if (!manifestCache) {
				const request = new XMLHttpRequest();
				request.open('GET', chrome.runtime.getURL('manifest.json'), false);
				request.send(null);
				manifestCache = JSON.parse(request.responseText);
			}
			return manifestCache;
		};
	}

	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		if (message.target !== 'kc3_offscreen_event') return false;
		(eventListeners[message.event] || []).forEach(function(listener) {
			listener.apply(null, message.args || []);
		});
		sendResponse({ ok: true });
		return false;
	});

	chrome.tabs = chrome.tabs || {};
	chrome.tabs.captureVisibleTab = callbackMethod('tabs.captureVisibleTab');
	chrome.tabs.create = callbackMethod('tabs.create');
	chrome.tabs.get = callbackMethod('tabs.get');
	chrome.tabs.getZoom = callbackMethod('tabs.getZoom');
	chrome.tabs.query = callbackMethod('tabs.query');
	chrome.tabs.remove = callbackMethod('tabs.remove');
	chrome.tabs.sendMessage = callbackMethod('tabs.sendMessage');
	chrome.tabs.update = callbackMethod('tabs.update');

	chrome.windows = chrome.windows || {};
	chrome.windows.getCurrent = callbackMethod('windows.getCurrent');
	chrome.windows.update = callbackMethod('windows.update');

	chrome.notifications = chrome.notifications || {};
	chrome.notifications.clear = callbackMethod('notifications.clear');
	chrome.notifications.create = callbackMethod('notifications.create');
	chrome.notifications.onButtonClicked = createEvent('notifications.onButtonClicked');
	chrome.notifications.onClicked = createEvent('notifications.onClicked');
	chrome.notifications.onClosed = createEvent('notifications.onClosed');

	chrome.cookies = chrome.cookies || {};
	chrome.cookies.set = callbackMethod('cookies.set');
	chrome.cookies.onChanged = createEvent('cookies.onChanged');

	chrome.downloads = chrome.downloads || {};
	chrome.downloads.download = callbackMethod('downloads.download');
	chrome.downloads.setShelfEnabled = noCallbackMethod('downloads.setShelfEnabled');
	chrome.downloads.onDeterminingFilename = {
		addListener: function() {},
		removeListener: function() {},
		hasListener: function() { return false; }
	};

	chrome.storage = chrome.storage || {};
	chrome.storage.local = chrome.storage.local || {};
	chrome.storage.local.clear = callbackMethod('storage.local.clear');
	chrome.storage.local.get = callbackMethod('storage.local.get');
	chrome.storage.local.remove = callbackMethod('storage.local.remove');
	chrome.storage.local.set = callbackMethod('storage.local.set');
	chrome.storage.sync = chrome.storage.sync || {};
	chrome.storage.sync.QUOTA_BYTES = chrome.storage.sync.QUOTA_BYTES || 102400;
	chrome.storage.sync.QUOTA_BYTES_PER_ITEM = chrome.storage.sync.QUOTA_BYTES_PER_ITEM || 8192;
	chrome.storage.sync.clear = callbackMethod('storage.sync.clear');
	chrome.storage.sync.get = callbackMethod('storage.sync.get');
	chrome.storage.sync.remove = callbackMethod('storage.sync.remove');
	chrome.storage.sync.set = callbackMethod('storage.sync.set');
	chrome.storage.onChanged = createEvent('storage.onChanged');

	chrome.webRequest = chrome.webRequest || {};
	chrome.webRequest.onBeforeRequest = chrome.webRequest.onBeforeRequest || {
		addListener: function() {},
		removeListener: function() {},
		hasListener: function() { return false; }
	};

	chrome.runtime.reload = noCallbackMethod('runtime.reload');
	chrome.runtime.onUpdateAvailable = createEvent('runtime.onUpdateAvailable');

	window.open = function(url) {
		const absoluteUrl = new URL(url, window.location.href).href;
		sendWorkerApi('worker.openWindow', [absoluteUrl]);
		return null;
	};
})();
