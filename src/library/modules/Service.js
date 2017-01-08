/* Service.js
KC3改 Background Service.

It is always running, from Chrome startup until the browser is closed or explicitly terminated.
This will serve as a central script that lets devtools and content scripts communicate.

Sometimes, the scripts on different parts of the extension cannot communicate with each other,
thus this can relay messages and events for them.

Sometimes, specific scripts do not have access to Chrome APIs.
Those scripts can then request it to be done by this service.

The above aspects are imported into the background service, and not necessarily on this file.
See Manifest File [manifest.json] under "background" > "scripts"
*/
(function(){
	"use strict";
	
	console.info("KC3改 Background Service loaded");
	
	if (typeof localStorage.kc3version == "undefined"){
		window.open("../../pages/update/update.html#installed", "kc3kai_updates");
		
	} else {
		if (localStorage.kc3version != chrome.runtime.getManifest().version) {
			window.open("../../pages/update/update.html#updated", "kc3kai_updates");
		}
	}
	
	localStorage.kc3version = chrome.runtime.getManifest().version;
	
	window.KC3Service = {
		
		/* NOTIFY DESKTOP
		Devtools do not have access to chrome.notifications API
		Panel can request this background service to do notifications
		------------------------------------------*/
		"notify_desktop" :function(request, sender, callback){
			// Clear old notification first
			chrome.notifications.clear("kc3kai_"+request.notifId, function(){
				// Add notification
				chrome.notifications.create("kc3kai_"+request.notifId, request.data);
			});
		},
		
		/* SCREENSHOT
		Ask the game container to take a screenshot
		------------------------------------------*/
		"screenshot" :function(request, sender, response){
			var tabId = sender.tab.id || request.tabId || false;
			if (tabId) {
				(new TMsg(tabId, "gamescreen", "getGamescreenOffset", {}, function(offset){
					(new KCScreenshot())
						.onComplete(response)
						.start(tabId, offset);
				})).execute();
			} else {
				response({ value: false });
			}
			return true;
		},
		
		/* ACTIVATE GAME
		Request from devTools to activate game on its inspected window
		DevTools does not have access to chrome.tabs API thus cannot send this message on its own
		Must go through here to be able to send runtime message to that specific window
		We don't want global runtime message that will activate games on all windows
		------------------------------------------*/
		"activateGame" :function(request, sender, response){
			(new TMsg( request.tabId, "gamescreen", "activateGame", {})).execute();
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
				questlist: request.questlist
			}, response)).execute();
			return true;
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
				apiData: request.nextNode
			})).execute();
		},
		
		/* FIT SCREEN
		Auto-resize browser window to fit the game screen
		------------------------------------------*/
		"fitScreen" :function(request, sender, response){
			var tabId = sender.tab.id || request.tabId || false;
			if (tabId) {
				// Get browser zoon level for the page
				chrome.tabs.getZoom(tabId, function(ZoomFactor){
					// Resize the window
					chrome.windows.getCurrent(function(wind){
						(new TMsg(tabId, "gamescreen", "getWindowSize", {}, function(size){
							chrome.windows.update(wind.id, {
								width: Math.ceil(800*ZoomFactor)
									+ (wind.width- Math.ceil(size.width*ZoomFactor) ),
								height: Math.ceil(480*ZoomFactor)
									+ (wind.height- Math.ceil(size.height*ZoomFactor) )
							});
						})).execute();
					});
				});
			} else {
				response({ value: false });
			}
			return true;
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
		
		/* DMM FRAME INJECTION
		Responds if content script should inject DMM Frame customizations
		------------------------------------------*/
		"willInjectDMM" :function(request, sender, response){
			chrome.tabs.update(sender.tab.id, {
				autoDiscardable: false,
				highlighted: true
			}, function(){
				ConfigManager.load();
				if (ConfigManager.dmm_customize){
					KC3Master.init();
					RemodelDb.init();
					KC3Meta.init("../../data/");
					KC3Meta.loadQuotes();
					KC3QuestManager.load();
					response({
						value: true,
						config: ConfigManager,
						master: KC3Master,
						meta: KC3Meta,
						quest: KC3QuestManager,
					});
				} else {
					response({ value:false });
				}
			});
			return true;
		},
		
		/* OSAPI FRAME INJECTION
		------------------------------------------*/
		"willInjectOSAPI" :function(request, sender, response){
			ConfigManager.load();
			response({ value: ConfigManager.dmm_customize });
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
			(new TMsg(request.tabId, "gamescreen", "subtitle", {
				voicetype: request.voicetype,
				filename: request.filename || false,
				shipID: request.shipID || false,
				voiceNum: request.voiceNum,
				url: request.url
			})).execute();
		}
		
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
			console.log(request.action, { "Request": request, "Sender": sender });
			
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
			
			// CKCY force 1
			if( changeInfo.cookie.name == "ckcy" ){
				// console.log("CKCY=", changeInfo.cookie.value, changeInfo);
				chrome.cookies.set({
					url: "http://www.dmm.com",
					name: "ckcy",
					value: "1",
					domain: ".dmm.com",
					expirationDate: Math.ceil((new Date("Sun, 09 Feb 2019 09:00:09 GMT")).getTime()/1000),
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
					expirationDate: Math.ceil((new Date("Sun, 09 Feb 2019 09:00:09 GMT")).getTime()/1000),
					path: changeInfo.cookie.path,
				}, function(cookie){
					// console.log("cklg cookie re-hacked", cookie);
				});
				
			}
		}
	});
	
})();
