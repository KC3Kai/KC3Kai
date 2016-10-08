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
	
	
	if (typeof localStorage.kc3version == "undefined"){
		window.open("../../pages/update/update.html#installed", "kc3kai_updates");
		
	} else {
		if (localStorage.kc3version != chrome.runtime.getManifest().version) {
			window.open("../../pages/update/update.html#updated", "kc3kai_updates");
		}
	}
	
	localStorage.kc3version = chrome.runtime.getManifest().version;
	
	window.KC3Service = {
		
		/* SET API LINK
		From osapi content script, the API Link has been extracted
		Save the link onto localStorage and disable extracing API further
		If came from menu "Extract API Link", so open "Play via API" and close DMM source
		------------------------------------------*/
		"set_api_link" :function(request, sender, callback){
			// Set api link on internal storage
			localStorage.absoluteswf = request.swfsrc;
			
			// If refreshing API link, close source tabs and re-open game frame
			if(JSON.parse(localStorage.extract_api)){ // localStorage has problems with native boolean
				localStorage.extract_api = false;
				window.open("../pages/game/api.html", "kc3kai_game");
				chrome.tabs.remove([sender.tab.id], function(){});
			}
		},
		
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
			(new TMsg(request.tabId, "gamescreen", "screenshot", {
				playerName: request.playerName
			}, response)).execute();
			return true;
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
		A specific game screen manipulation. Such as idle timer, catbombing, and others. That marks
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
			(new TMsg(request.tabId, "gamescreen", "questOverlay", {
				questlist: request.questlist
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
		
		/* GET CONFIG
		For content scripts who doesnt have access to localStorage
		Mainly used at the moment for DMM cookie injection
		------------------------------------------*/
		"getConfig" :function(request, sender, response){
			ConfigManager.load();
			response({value: ConfigManager[request.id]});
		},
		
		/* FIT SCREEN
		Auto-resize browser window to fit the game screen
		------------------------------------------*/
		"fitScreen" :function(request, sender, response){
			(new TMsg(request.tabId, "gamescreen", "fitScreen")).execute();
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
		
		/* DMM FRMAE INJECTION
		Responds if content script should inject DMM Frame customizations
		------------------------------------------*/
		"dmmFrameInject" :function(request, sender, response){
			if(sender.tab.url.indexOf("/pages/game/dmm.html") > -1){
				response({value:true});
			}else{
				response({value:false});
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
			console.debug("subtitle", request);
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
