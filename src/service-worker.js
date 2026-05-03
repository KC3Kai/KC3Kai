const OFFSCREEN_PATH = 'pages/background/offscreen.html';
let offscreenDocumentCreating = null;
let offscreenReady = false;
let offscreenReadyWaiter = null;

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function createOffscreenReadyWaiter() {
	if (!offscreenReadyWaiter) {
		let resolveReady;
		let rejectReady;
		const promise = new Promise((resolve, reject) => {
			resolveReady = resolve;
			rejectReady = reject;
		});
		offscreenReadyWaiter = { promise, resolveReady, rejectReady };
	}
	return offscreenReadyWaiter;
}

function markOffscreenReady() {
	offscreenReady = true;
	const waiter = createOffscreenReadyWaiter();
	waiter.resolveReady();
}

function resetOffscreenReady() {
	offscreenReady = false;
	offscreenReadyWaiter = null;
}

function serializeSender(sender) {
	return {
		frameId: sender.frameId,
		id: sender.id,
		url: sender.url,
		tab: sender.tab ? {
			active: sender.tab.active,
			id: sender.tab.id,
			index: sender.tab.index,
			mutedInfo: sender.tab.mutedInfo,
			pinned: sender.tab.pinned,
			status: sender.tab.status,
			title: sender.tab.title,
			url: sender.tab.url,
			windowId: sender.tab.windowId
		} : undefined
	};
}

async function hasOffscreenDocument() {
	const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_PATH);
	if (chrome.runtime.getContexts) {
		const contexts = await chrome.runtime.getContexts({
			contextTypes: ['OFFSCREEN_DOCUMENT'],
			documentUrls: [offscreenUrl]
		});
		return contexts.length > 0;
	}
	const matchedClients = await clients.matchAll();
	return matchedClients.some((client) => client.url === offscreenUrl);
}

async function ensureOffscreenDocument() {
	if (await hasOffscreenDocument()) return;
	if (!offscreenDocumentCreating) {
		resetOffscreenReady();
		offscreenDocumentCreating = chrome.offscreen.createDocument({
			url: OFFSCREEN_PATH,
			reasons: ['LOCAL_STORAGE', 'BLOBS', 'WORKERS'],
			justification: 'Run the legacy background page logic in an MV3-compatible DOM context.'
		}).finally(() => {
			offscreenDocumentCreating = null;
		});
	}
	await offscreenDocumentCreating;
}

async function pingOffscreenReady() {
	try {
		const response = await chrome.runtime.sendMessage({
			target: 'kc3_offscreen_ping'
		});
		if (response && response.ready) {
			markOffscreenReady();
			return true;
		}
	} catch (error) {}
	return false;
}

async function ensureOffscreenReady() {
	await ensureOffscreenDocument();
	if (offscreenReady) return;
	if (await pingOffscreenReady()) return;
	const waiter = createOffscreenReadyWaiter();
	for (let attempt = 0; attempt < 50; attempt++) {
		if (offscreenReady) return;
		if (await pingOffscreenReady()) return;
		await delay(100);
	}
	await Promise.race([
		waiter.promise,
		new Promise((resolve, reject) => {
			setTimeout(() => reject(new Error('Offscreen document did not become ready in time.')), 1000);
		})
	]);
}

function callChromeApi(fn, args, useCallback) {
	return new Promise((resolve, reject) => {
		try {
			if (!useCallback) {
				resolve(fn(...args));
				return;
			}
			fn(...args, (result) => {
				const lastError = chrome.runtime.lastError;
				if (lastError) {
					reject(new Error(lastError.message));
				} else {
					resolve(result);
				}
			});
		} catch (error) {
			reject(error);
		}
	});
}

async function handleWorkerApi(method, args) {
	switch (method) {
		case 'tabs.captureVisibleTab':
			return callChromeApi(chrome.tabs.captureVisibleTab, args, true);
		case 'tabs.create':
			return callChromeApi(chrome.tabs.create, args, true);
		case 'tabs.get':
			return callChromeApi(chrome.tabs.get, args, true);
		case 'tabs.getZoom':
			return callChromeApi(chrome.tabs.getZoom, args, true);
		case 'tabs.query':
			return callChromeApi(chrome.tabs.query, args, true);
		case 'tabs.remove':
			return callChromeApi(chrome.tabs.remove, args, true);
		case 'tabs.sendMessage':
			return callChromeApi(chrome.tabs.sendMessage, args, true);
		case 'tabs.update':
			return callChromeApi(chrome.tabs.update, args, true);
		case 'windows.getCurrent':
			return callChromeApi(chrome.windows.getCurrent, args, true);
		case 'windows.update':
			return callChromeApi(chrome.windows.update, args, true);
		case 'notifications.clear':
			return callChromeApi(chrome.notifications.clear, args, true);
		case 'notifications.create':
			return callChromeApi(chrome.notifications.create, args, true);
		case 'cookies.set':
			return callChromeApi(chrome.cookies.set, args, true);
		case 'downloads.download':
			return callChromeApi(chrome.downloads.download, args, true);
		case 'downloads.setShelfEnabled':
			if (typeof chrome.downloads.setShelfEnabled === 'function') {
				return callChromeApi(chrome.downloads.setShelfEnabled, args, false);
			}
			return undefined;
		case 'runtime.reload':
			chrome.runtime.reload();
			return undefined;
		case 'storage.local.clear':
			return callChromeApi(chrome.storage.local.clear, args, true);
		case 'storage.local.get':
			return callChromeApi(chrome.storage.local.get, args, true);
		case 'storage.local.remove':
			return callChromeApi(chrome.storage.local.remove, args, true);
		case 'storage.local.set':
			return callChromeApi(chrome.storage.local.set, args, true);
		case 'storage.sync.clear':
			return callChromeApi(chrome.storage.sync.clear, args, true);
		case 'storage.sync.get':
			return callChromeApi(chrome.storage.sync.get, args, true);
		case 'storage.sync.remove':
			return callChromeApi(chrome.storage.sync.remove, args, true);
		case 'storage.sync.set':
			return callChromeApi(chrome.storage.sync.set, args, true);
		case 'worker.openWindow':
			return callChromeApi(chrome.tabs.create, [{ url: args[0] }], true);
		default:
			throw new Error(`Unsupported worker API method: ${method}`);
	}
}

async function forwardEventToOffscreen(event, args) {
	try {
		await ensureOffscreenReady();
		await chrome.runtime.sendMessage({
			target: 'kc3_offscreen_event',
			event,
			args
		});
	} catch (error) {
		// Ignore when offscreen page is not ready yet.
		console.debug('Skipped offscreen event', event, error && error.message);
	}
}

chrome.runtime.onInstalled.addListener(() => {
	ensureOffscreenReady();
});

chrome.runtime.onStartup.addListener(() => {
	ensureOffscreenReady();
});

chrome.cookies.onChanged.addListener((changeInfo) => {
	forwardEventToOffscreen('cookies.onChanged', [changeInfo]);
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
	forwardEventToOffscreen('notifications.onButtonClicked', [notificationId, buttonIndex]);
});

chrome.notifications.onClicked.addListener((notificationId) => {
	forwardEventToOffscreen('notifications.onClicked', [notificationId]);
});

chrome.notifications.onClosed.addListener((notificationId, byUser) => {
	forwardEventToOffscreen('notifications.onClosed', [notificationId, byUser]);
});

chrome.runtime.onUpdateAvailable.addListener((details) => {
	forwardEventToOffscreen('runtime.onUpdateAvailable', [details]);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
	forwardEventToOffscreen('storage.onChanged', [changes, namespace]);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.target === 'kc3_offscreen_ready') {
		markOffscreenReady();
		sendResponse({ ok: true });
		return false;
	}
	if (request.target === 'kc3_worker_api') {
		handleWorkerApi(request.method, request.args || [])
			.then((result) => sendResponse({ result }))
			.catch((error) => sendResponse({ error: error.message }));
		return true;
	}
	if (request.identifier === 'kc3_service' && !request.__viaWorker) {
		ensureOffscreenReady()
			.then(() => chrome.runtime.sendMessage({
				...request,
				__viaWorker: true,
				__kc3Sender: serializeSender(sender)
			}))
			.then((result) => sendResponse(result))
			.catch((error) => sendResponse({ error: error.message }));
		return true;
	}
	return false;
});
