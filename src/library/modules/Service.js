/* Service.js
KC3改 Background Service.

It is always running, from Chrome startup until the browser is closed or explicitly terminated.
This will serve as a central script that lets devtools and content scripts communicate.
Sometimes, the scripts on different parts of the extension cannot communicate with each other, thus this can relay messages and events for them.
Sometimes, specific scripts do not have access to Chrome APIs. Those scripts can then request it to be done by this service.

Ultimately, this script handles data management on aspects that are best centralized such as:
> [Countdown Timers]
To have a consistent timer unaffected by lags on devtools and Chrome tabs
> [Quest Management]
To ensure all components are synced in real-time without relying on localStorage

The above aspects are imported into the background service, and not necessarily on this file.
See Manifest File [manifest.json] under "background" > "scripts"
*/
(function(){
	"use strict";
	
	console.info("KC3改 Background Service loaded");
	
	ConfigManager.load();
	KC3Meta.init("../../data/");
	
	switch (ConfigManager.updateNotification) {
		case 2: // Open update status page
			if (typeof localStorage.kc3version == "undefined"){
				window.open("../../pages/update/update.html#installed", "kc3_update_page");
			} else {
				if (localStorage.kc3version != chrome.runtime.getManifest().version) {
					window.open("../../pages/update/update.html#updated", "kc3_update_page");
				}
			}
			break;
		case 3: // Just desktop notification
			if (typeof localStorage.kc3version == "undefined"){
				chrome.notifications.clear("kc3kai_update");
				chrome.notifications.create("kc3kai_update", {
					type: "basic",
					iconUrl: chrome.extension.getURL("assets/img/logo/128.png"),
					title: KC3Meta.term("InstalledTitle"),
					message: KC3Meta.term("InstalledText"),
				});
			} else {
				if (localStorage.kc3version != chrome.runtime.getManifest().version) {
					chrome.notifications.clear("kc3kai_update");
					chrome.notifications.create("kc3kai_update", {
						type: "basic",
						iconUrl: chrome.extension.getURL("assets/img/logo/128.png"),
						title: KC3Meta.term("UpdatedTitle"),
						message: KC3Meta.term("UpdatedText"),
					});
				}
			}
			break;
	}
	
	localStorage.kc3version = chrome.runtime.getManifest().version;
	
	window.KC3Service = {
		
		/* SET API LINK
		From osapi content script, the API Link has been extracted
		Save the link onto localStorage and disable extracting API further
		~~If came from menu "Extract API Link", so open "Play via API" and close DMM source~~
		------------------------------------------*/
		"set_api_link" :function(request, sender, callback){
			// Set api link on internal storage
			localStorage.absoluteswf = request.swfsrc || "";
			// Remember version string of current game main.js
			const gameVerStr = (localStorage.absoluteswf.match(/&version=[\d\.]+\b/) || [])[0];
			localStorage.gameVersion = (gameVerStr || "").split("=")[1] || "";
			
			// If refreshing API link, close source tabs and re-open game frame
			if(JSON.parse(localStorage.extract_api)){ // localStorage has problems with native boolean
				localStorage.extract_api = false;
				chrome.tabs.remove([sender.tab.id], function(){});
				// To avoid cross-domain warning of chrome
				//window.open("../pages/game/api.html", "kc3kai_game");
				chrome.tabs.create({ url: chrome.extension.getURL("../pages/game/api.html") });
			}
		},
		
		/* NOTIFY DESKTOP
		Devtools do not have access to chrome.notifications API
		Panel can request this background service to do notifications
		------------------------------------------*/
		"notify_desktop" :function(request, sender, callback){
			// Clear old notification first
			chrome.notifications.clear("kc3kai_" + request.notifId, function(){
				// Add notification
				chrome.notifications.create("kc3kai_" + request.notifId, request.data, function(createdId){
					// Handler on notification box clicked
					var clickHandler = function(clickedId){
						if(clickedId === createdId){
							chrome.notifications.clear(clickedId);
							var gameTabId = request.tabId;
							if(gameTabId){
								chrome.tabs.get(gameTabId, function(tab){
									chrome.windows.update(tab.windowId, { focused: true });
									chrome.tabs.update(gameTabId, { active: true });
								});
							}
						}
					};
					// Handler to clean one-time listeners on notification closed,
					// since life cycle of listeners not the same with notifications.
					var cleanListenersHandler = function(notificationId, byUser){
						if(notificationId === createdId){
							chrome.notifications.onClicked.removeListener(clickHandler);
							chrome.notifications.onClosed.removeListener(cleanListenersHandler);
						}
					};
					chrome.notifications.onClicked.addListener(clickHandler);
					chrome.notifications.onClosed.addListener(cleanListenersHandler);
				});
			});
			// Sending Mobile Push notification if enabled
			if(ConfigManager.PushAlerts_enabled) {
				$.ajax({
					async: true,
					crossDomain: true,
					url: "https://api.pushbullet.com/v2/pushes",
					method: "POST",
					headers: {
						"content-type": "application/json",
						"access-token": ConfigManager.PushAlerts_key,
					},
					"data": JSON.stringify({
						  "type": "note",
						  "title": request.data.title,
						  "body": request.data.message
					})
				});
			}
		},
		
		/* SCREENSHOT
		Ask the game container to take a screenshot
		------------------------------------------*/
		"screenshot" :function(request, sender, response){
			var senderUrl = sender.url || sender.tab.url || "";
			// If devtools, a tab ID should be in the request param
			if (isDevtools(senderUrl)) {
				// Get tab information to get URL of requester
				chrome.tabs.get(request.tabId, function(tabDetails){
					if( isDMMFrame(tabDetails.url) || isAPIFrame(tabDetails.url)){
						// If API or DMM Frame, use traditional screenshot call
						(new TMsg(request.tabId, "gamescreen", "screenshot", {
							playerName: request.playerName
						}, response)).execute();
						return true;
						
					} else {
						// If not API or DMM Frame, must be special mode
						screenshotSpecialMode(request.tabId, response);
						return true;
					}
				});
			} else if (sender.tab && sender.tab.id){
				screenshotSpecialMode(sender.tab.id, response);
			} else {
				response({ value: false });
			}
			return true;
		},
		
		/* CHECK PERMISSION
		Check if permission `activeTab` is granted
		------------------------------------------*/
		"checkPermission" :function(request, sender, response){
			var senderUrl = sender.url || sender.tab.url || "";
			function checkActiveTabEffect(tabId, response) {
				chrome.tabs.get(tabId, function(tabDetails){
					// should use another faster method to check activeTab?
					chrome.tabs.captureVisibleTab(tabDetails.windowId, {}, function(imgData) {
						if(chrome.runtime.lastError) {
							var errorMsg = chrome.runtime.lastError.message || "";
							if(errorMsg.indexOf("'activeTab' permission") > -1) {
								response({ value: false });
							} else {
								console.warn("Unchecked runtime.lastError:", errorMsg);
								response({ value: true });
							}
						} else {
							response({ value: true });
						}
					});
				});
			}
			if (isDevtools(senderUrl)) {
				checkActiveTabEffect(request.tabId, response);
			} else if (sender.tab && sender.tab.id) {
				checkActiveTabEffect(sender.tab.id, response);
			} else {
				response({ value: false });
			}
			return true;
		},
		
		/* FOCUS ON GAME TAB
		Force browser to switch and focus on current game tab.
		------------------------------------------*/
		"focusGameTab" :function(request, sender, callback){
			var gameTabId = request.tabId;
			if(gameTabId){
				chrome.tabs.get(gameTabId, function(tab){
					chrome.windows.update(tab.windowId, { focused: true });
					chrome.tabs.update(gameTabId, { active: true });
				});
			}
		},
		
		/* ACTIVATE GAME
		Request from devTools to activate game on its inspected window
		DevTools does not have access to chrome.tabs API thus cannot send this message on its own
		Must go through here to be able to send runtime message to that specific window
		We don't want global runtime message that will activate games on all windows
		------------------------------------------*/
		"activateGame" :function(request, sender, response){
			(new TMsg(request.tabId, "gamescreen", "activateGame", {})).execute();
		},
		
		/* Game Screen Change
		A specific game screen manipulation. Such as idle timer, catbomb, and others. That marks
		the guy who make this function is lazier than making another key for such purpose XD
		(PS: self-insulting)
		------------------------------------------*/
		"gameScreenChg" :function(request, sender, response){
			(new TMsg(request.tabId, "gamescreen", request.message_id || "goodResponses", {
				tcp_status: request.tcp_status,
				api_status: request.api_status,
				api_result: request.api_result,
			})).execute();
		},
		
		/* QUEST OVERLAYS
		Request from devTools to show quest overlays on its inspected window
		DevTools does not have access to chrome.tabs API thus cannot send this message on its own
		Must go through here to be able to send runtime message to that specific window
		We don't want global runtime message that will show overlays on all windows
		------------------------------------------*/
		"questOverlay" :function(request, sender, response){
			KC3QuestManager.load();
			(new TMsg(request.tabId, "gamescreen", "questOverlay", {
				KC3QuestManager: KC3QuestManager,
				questlist: request.questlist,
				ConfigManager: ConfigManager
			})).execute();
		},
		
		/* CLEAR OVERLAYS
		Request from devTools to clear overlays on its inspected window
		DevTools does not have access to chrome.tabs API thus cannot send this message on its own
		Must go through here to be able to send runtime message to that specific window
		We don't want global runtime message that will clear overlays on all windows
		------------------------------------------*/
		"clearOverlays" :function(request, sender, response){
			(new TMsg(request.tabId, "gamescreen", "clearOverlays", {})).execute();
		},
		
		/* MAP MARKERS
		When sortie to a world map, show node markers
		------------------------------------------*/
		"mapMarkers" :function(request, sender, response){
			(new TMsg(request.tabId, "gamescreen", "markersOverlay", {
				worldId: request.nextNode.api_maparea_id,
				mapId: request.nextNode.api_mapinfo_no,
				compassShow: !!request.nextNode.api_rashin_flg,
				needsDelay: !!request.startSortie,
				apiData: request.nextNode,
				ConfigManager: ConfigManager
			})).execute();
		},
		
		/* GET CONFIG
		For content scripts who doesn't have access to localStorage
		Mainly used at the moment for DMM/OSAPI/cookie injection
		------------------------------------------*/
		"getConfig" :function(request, sender, response){
			var resultObj = {};
			ConfigManager.load();
			// return all configs
			if(!request.id){
				resultObj.value = ConfigManager;
			// return multi keys of configs
			} else if(Array.isArray(request.id)) {
				resultObj.value = request.id.map(function(a){ return ConfigManager[a]; });
			// return one key
			} else {
				resultObj.value = ConfigManager[request.id];
			}
			if(typeof request.attr !== "undefined"){
				// return all localStorage, caution: may include privacy
				if(!request.attr){
					resultObj.storage = localStorage;
				// return multi attributes of localStorage
				} else if(Array.isArray(request.attr)) {
					resultObj.storage = request.attr.map(function(a){ return localStorage[a]; });
				// return one attribute
				} else {
					resultObj.storage = localStorage[request.attr];
				}
			}
			response(resultObj);
		},
		
		/* FIT SCREEN
		Auto-resize browser window to fit the game screen
		------------------------------------------*/
		"fitScreen" :function(request, sender, response){
			// Get tab information to get URL of requester
			chrome.tabs.get(request.tabId, function(tabDetails){
				if( isDMMFrame(tabDetails.url) || isAPIFrame(tabDetails.url)){
					// If API or DMM Frame, use traditional screenshot call
					(new TMsg(request.tabId, "gamescreen", "fitScreen")).execute();
					return true;
					
				} else {
					// If not API or DMM Frame, must be special mode
					chrome.tabs.getZoom(request.tabId, function(ZoomFactor){
						// Resize the window
						chrome.windows.getCurrent(function(wind){
							(new TMsg(request.tabId, "gamescreen", "getWindowSize", {}, function(size){
								chrome.windows.update(wind.id, {
									width: Math.ceil(1200*ZoomFactor*size.game_zoom)
										+ (wind.width- Math.ceil(size.width*ZoomFactor) ),
									height: Math.ceil((720+size.margin_top)*size.game_zoom*ZoomFactor)
										+ (wind.height- Math.ceil(size.height*ZoomFactor) )
								});
							})).execute();
						});
					});
					return true;
				}
			});
			return true;
		},
		
		/* GET TAB INFO
		Return all info of the tab inspected by devtools panel
		------------------------------------------*/
		"getTabInfo" :function(request, sender, response){
			chrome.tabs.get(request.tabId, function(tabInfo){
				response(tabInfo);
			});
		},
		
		/* IS MUTED
		Returns boolean if the tab is muted or not
		------------------------------------------*/
		"isMuted" :function(request, sender, response){
			chrome.tabs.get(request.tabId, function(tabInfo){
				try {
					response(tabInfo.mutedInfo.muted);
				}catch(e){
					response(false);
				}
			});
			return true;
		},
		
		/* TOGGLE SOUNDS
		Mute or unmute the tab
		------------------------------------------*/
		"toggleSounds" :function(request, sender, response){
			chrome.tabs.get(request.tabId, function(tabInfo){
				try {
					chrome.tabs.update(request.tabId, {
						muted: tabInfo.mutedInfo.muted?false:true,
					});
					response(!tabInfo.mutedInfo.muted);
				}catch(e){
					response(false);
				}
				return true;
			});
			return true;
		},
		
		/* OPEN COOKIE SETTINGS
		DevTools can't use chrome.tabs by itself, so service will open the page for them
		------------------------------------------*/
		"openCookieSettings" :function(request, sender, response){
			chrome.tabs.create({
				url:'chrome://settings/content'
			});
		},
		
		/* OPEN CHROME EXTENSION PAGE
		DevTools open about:blank page when trying to open new tab by itself
		------------------------------------------*/
		"openExtensionPage" :function(request, sender, response){
			chrome.tabs.create({
				url: chrome.extension.getURL(request.path)
			});
		},
		
		/* OPEN OR UPDATE STRATEGY ROOM PAGE
		Similar with `openExtensionPage`, to reuse Strategy Room existed page
		@param request.tabPath -
			different with `request.path`, no prefix of Strategy Room path needed
		------------------------------------------*/
		"strategyRoomPage" :function(request, sender, response){
			var sroomUrlPrefix = "pages/strategy/strategy.html";
			var tabId = 0;
			// Find first existed SRoom page tab
			chrome.tabs.query({
				url: chrome.extension.getURL(sroomUrlPrefix)
			}, function(tabs){
				if(!!tabs[0]){
					tabId = tabs[0].id;
					// Found existed tab, update url and activate it
					chrome.tabs.update(tabId, {
						url: chrome.extension.getURL(sroomUrlPrefix + "#" + request.tabPath),
						active: true
					}, function(tab) {
						tabId = tab.id;
					});
				} else {
					// No existed tab, create new
					chrome.tabs.create({
						url: chrome.extension.getURL(sroomUrlPrefix + "#" + request.tabPath)
					}, function(tab){
						tabId = tab.id;
					});
				}
					
			});
		},
		
		/* DMM FRAME INJECTION
		Responds if content script should inject DMM Frame customizations
		------------------------------------------*/
		"dmmFrameInject" :function(request, sender, response){
			var senderUrl = (sender.tab)?sender.tab.url:false || sender.url  || "";
			
			if( isDMMFrame(senderUrl) && localStorage.dmmplay == "false"){
				// DMM FRAME
				response({ mode: 'frame', scale: ConfigManager.api_gameScale});
			} else if(ConfigManager.dmm_customize && localStorage.extract_api != "true") {
				var props = {
					highlighted: true,
					muted: !!ConfigManager.mute_game_tab
				};
				// Prevent Chrome auto discard the game tab
				// autoDiscardable since Chrome 54
				if(parseChromeVersion() >= 54) {
					props.autoDiscardable = false;
				}
				// DMM CUSTOMIZATION
				chrome.tabs.update(sender.tab.id, props, function(){
					ConfigManager.load();
					KC3Master.init();
					RemodelDb.init();
					KC3Meta.init("../../data/");
					KC3Meta.loadQuotes();
					KC3QuestManager.load();
					response({
						mode: 'inject',
						config: ConfigManager,
						master: KC3Master,
						meta: KC3Meta,
						remodel: RemodelDb,
						quest: KC3QuestManager,
					});
				});
				return true;
				
			} else {
				// NO DMM EXECUTIONS
				response({ mode: false });
			}
		},
		
		/* TAIHA ALERT START
		Start bloody taiha indicator on-screen
		------------------------------------------*/
		"taihaAlertStart" :function(request, sender, response){
			(new TMsg(request.tabId, "gamescreen", "taihaAlertStart")).execute();
		},
		
		/* TAIHA ALERT STOP
		Stop bloody taiha indicator on-screen
		------------------------------------------*/
		"taihaAlertStop" :function(request, sender, response){
			(new TMsg(request.tabId, "gamescreen", "taihaAlertStop")).execute();
		},
		
		/* SUBTITLES
		When a ship speaks, show subtitles
		------------------------------------------*/
		"subtitle" :function(request, sender, response){
			//console.debug("subtitle", request);
			let duration = 0;
			const sendSubtitleToGameScreen = () => {
				(new TMsg(request.tabId, "gamescreen", "subtitle", {
					voicetype: request.voicetype,
					fullurl: request.fullurl,
					filename: request.filename || false,
					shipID: request.shipID || false,
					voiceNum: request.voiceNum,
					voiceSize: request.voiceSize,
					duration: duration,
					url: request.url,
					ConfigManager: ConfigManager
				})).execute();
			};
			if(ConfigManager.subtitle_duration){
				const readBlobAudioDuration = (blob) => {
					const objectUrl = URL.createObjectURL(blob);
					const audio = new Audio(objectUrl);
					audio.onloadedmetadata = () => {
						// Audio duration is float in seconds, to milliseconds
						duration = (audio.duration || 0) * 1000;
						// ensure Audio and Blob can be GCed
						audio.pause();
						URL.revokeObjectURL(objectUrl);
						sendSubtitleToGameScreen();
					};
				};
				const fetchVoiceFile = (soundUrl) => {
					// Send request with jQuery to customize headers,
					// ensure no header `Range` so that cache will be used
					$.ajax({
						url: soundUrl,
						method: "GET",
						/*
						headers: {
							// Referer not allowed to be set by browser
							"X-Requested-With": "ShockwaveFlash/" + detectFlashVersionString()
						},
						*/
						async: true,
						cache: true,
						processData: false,
						xhrFields: { responseType: "blob" },
						success: readBlobAudioDuration,
						error: (xhr, status, error) => {
							console.warn("Determine sound file duration " + status, error, soundUrl);
							sendSubtitleToGameScreen();
						}
					});
				};
				// might link this with promise
				fetchVoiceFile(request.fullurl);
			} else {
				sendSubtitleToGameScreen();
			}
		},
		
		/* LIVE RELOAD META DATA
		Such as Quotes, Quotes of subtitles
		------------------------------------------*/
		"reloadMeta" :function(request, sender, response){
			var metaType = request.type;
			if(localStorage.dmmplay == "true" && ConfigManager.dmm_customize) {
				// Reload meta at background for DMM takeover
				if(metaType === "Quotes") {
					KC3Meta.loadQuotes();
				} else if(metaType === "Quests") {
					KC3Meta.reloadQuests();
				}
			}
			(new TMsg(request.tabId, "gamescreen", "reloadMeta", {
				metaType: metaType,
				meta: KC3Meta
			})).execute();
		},
		
		/* GET VERSIONS
		Return platform related manifest and versions
		------------------------------------------*/
		"getVersion" :function(request, sender, response){
			// May be more, such as OS arch, version
			response({
				chrome: parseChromeVersion(),
				manifest: chrome.runtime.getManifest(),
				kc3version: chrome.runtime.getManifest().version
			});
		},
		
		/* QUEST SYNC
		Facilitate remote invocation of background methods
		------------------------------------------*/
		"questSync" :function({ method, args, isAsync }, sender, response){
			if (isAsync) {
				KC3QuestSync[method](...args)
					.then((result) => { response({ success: result }); })
					.catch((error) => { response({ error }); });
			} else {
				try {
					response({ success: KC3QuestSync[method](...args) });
				} catch (error) {
					response({ error });
				}
			}
		},
	};
	
	/* Runtime Message Listener
	https://developer.chrome.com/extensions/messaging#simple
	This script will wait for messages from other parts of the extension
	and execute what they want if applicable
	------------------------------------------*/
	chrome.runtime.onMessage.addListener(function(request, sender, callback){
		// Check if message is intended for this script
		if( (request.identifier || false) == "kc3_service"){
			// Log message contents and sender for debugging
			//console.debug(request.action, { "Request": request, "Sender": sender });
			
			// Check requested action is supported
			if(typeof window.KC3Service[ request.action ] != "undefined"){
				// Execute and pass callback to function
				window.KC3Service[ request.action ](request, sender, callback);
				return true; // dual-async response
			}else{
				// Unknown action
				callback({ success: false });
			}
		
		}
	});
	
	/* New cookie hack
	Listen to change in cookies on the DMM website
	Revert DMM cookies to ckcy=1 and cklg=welcome if changed
	------------------------------------------*/
	chrome.cookies.onChanged.addListener(function(changeInfo){
		if(changeInfo.cookie.domain == ".dmm.com" && changeInfo.cause == "expired_overwrite"){
			
			// Check if forcing cookies is enabled, for efficiency, only do this for the two variables
			if( changeInfo.cookie.name == "ckcy" || changeInfo.cookie.name == "cklg" ){
				// Reload config, do always. If not, cookie settings will only take affect after browser restart
				ConfigManager.load();
				// Cancel all further actions if disabled
				if(!ConfigManager.dmm_forcecookies){ return true; }
			}
			
			var nextYear = new Date();
			nextYear.setFullYear(nextYear.getFullYear() + 1);
			// CKCY force 1
			if( changeInfo.cookie.name == "ckcy" ){
				// console.log("CKCY=", changeInfo.cookie.value, changeInfo);
				chrome.cookies.set({
					url: "http://www.dmm.com",
					name: "ckcy",
					value: "1",
					domain: ".dmm.com",
					expirationDate: Math.ceil(nextYear.getTime()/1000),
					path: changeInfo.cookie.path,
				}, function(cookie){
					// console.log("ckcy cookie re-hacked", cookie);
				});
			}
			
			// CKLG force welcome
			if( changeInfo.cookie.name == "cklg" ){
				// console.log("CKLG=", changeInfo.cookie.value, changeInfo);
				chrome.cookies.set({
					url: "http://www.dmm.com",
					name: "cklg",
					value: "welcome",
					domain: ".dmm.com",
					expirationDate: Math.ceil(nextYear.getTime()/1000),
					path: changeInfo.cookie.path,
				}, function(cookie){
					// console.log("cklg cookie re-hacked", cookie);
				});
				
			}
		}
	});
	
	/* On Web Storage (localStorage here) Changed
	Reload our ConfigManager as soon as possible on the key `config` changed,
	Instead of explicitly invoking `load` method everywhere.
	------------------------------------------*/
	window.addEventListener("storage", function({type, key, timeStamp, url}) {
		//console.debug("storageEvent", {type, key, timeStamp, url});
		if(key === ConfigManager.keyName()) {
			ConfigManager.load();
			console.debug("Reload ConfigManager caused by", (url || "").match(/\/\/[^\/]+\/([^\?]+)/)[1]);
		}
	});
	
	/* On Update Available
	This will avoid auto-restart when webstore update is available
	Officially handle the moment update is release and user is playing
	------------------------------------------*/
	delete localStorage.updateAvailable;
	chrome.runtime.onUpdateAvailable.addListener(function(details){
		localStorage.updateAvailable = details.version;
		
		ConfigManager.load();
		switch (ConfigManager.updateNotification) {
			case 2: // Open update status page
				chrome.windows.getCurrent(null, function(cwindow){
					chrome.tabs.create({
						windowId: cwindow.id,
						url: chrome.extension.getURL("pages/update/update.html"),
						active: false
					});
				});
				break;
			case 3: // Just desktop notification
				chrome.notifications.clear("kc3kai_update");
				chrome.notifications.create("kc3kai_update", {
					type: "basic",
					iconUrl: chrome.extension.getURL("assets/img/logo/128.png"),
					title: KC3Meta.term("UpdateNotifTitle").format(details.version),
					message: KC3Meta.term("UpdateNotifText"),
					buttons: [
						{ title: KC3Meta.term("PageUpdateRestartNow") },
						{ title: KC3Meta.term("PageUpdateRestartLater") }
					],
					requireInteraction: true
				});
				break;
		}
	});
	
	// Chrome Desktop Notifications: Box Click
	chrome.notifications.onClicked.addListener(function(notificationId){
		if (notificationId == "kc3kai_update") {
			window.open("../../pages/update/update.html", "kc3_update_page");
			chrome.notifications.clear("kc3kai_update");
		}
	});
	
	// Chrome Desktop Notifications: Button Click
	chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex){
		if (notificationId == "kc3kai_update") {
			if (buttonIndex === 0) {
				reloadApp();
			} else {
				chrome.notifications.clear("kc3kai_update");
			}
		}
	});
	
	function reloadApp(){ chrome.runtime.reload(); }
	
	function isDMMFrame(url){
		return url.indexOf("/pages/game/dmm.html") > -1;
	}
	
	function isAPIFrame(url){
		return url.indexOf("/pages/game/api.html") > -1;
	}
	
	function isDevtools(url){
		return url.indexOf("/pages/devtools/themes/") > -1;
	}
	
	function screenshotSpecialMode(tabId, response){
		if(ConfigManager.dmm_customize) {
			(new TMsg(tabId, "gamescreen", "getGamescreenOffset", {}, function(offset){
				(new KCScreenshot())
					.setCallback(response)
					.remoteStart(tabId, offset);
			})).execute();
		}
	}
	
	function parseChromeVersion() {
		var raw = navigator.appVersion.match(/Chrom(e|ium)\/([0-9]+)\./);
		return raw ? parseInt(raw[2], 10) : 0;
	}
	
	function detectFlashVersionString() {
		var plugin = navigator.plugins["Shockwave Flash"];
		var major = (plugin && plugin.description.split(" ")[2]) || "1";
		return major + ".0";
	}
	
})();
