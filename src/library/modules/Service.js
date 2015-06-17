/* Service.js
KC3改 Background Service.

It is always running, from Chrome startup until the browser is closed or explicitly terminated.
This will serve as a central script that lets devtools and content scripts communicate.
Sometimes, the scripts on different parts of the extension cannot communicate with each other, thus this can relay messages and events for them.
Sometimes, specific scripts do not have access to Chrome APIs. Those scripts can then request it to be done by this service.
*/
(function(){
	"use strict";
	
	console.log("Starting KC3改 Background Service...");
	
	window.KC3Service = {
		
		/* [set_api_link]
		API Link extracted, save and open
		------------------------------------------*/
		"set_api_link" :function(request, sender, callback){
			// Set api link on internal storage
			localStorage.absoluteswf = request.swfsrc;
			
			// If refreshing API link, close source tabs and re-open game frame
			if(localStorage.extract_api==="true"){
				localStorage.extract_api = false;
				// If not playing via DMM frame
				if(sender.tab.url.indexOf("/pages/game/dmm.html") == -1){
					chrome.tabs.remove([sender.tab.id], function(){});
					window.open("../pages/game/api.html", "kc3kai_game");
				}
			}
			
			callback({success:true});
		},
		
		
		/* [notify_desktop]
		Check if tab is a KC3改 frame and tell to override styles or not
		------------------------------------------*/
		"notify_desktop" :function(request, sender, callback){
			// Clear old notification first
			chrome.notifications.clear("kc3kai_"+request.notifId, function(){
				// Add notification
				chrome.notifications.create("kc3kai_"+request.notifId, request.data);
			});
		},
		
		/* [activate_game]
		Try to activate game inside inspected tab
		------------------------------------------*/
		"activate_game" :function(request, sender, response){
			chrome.tabs.sendMessage(request.tabId, {
				game:"kancolle",
				type:"game",
				action:"activate"
			}, response);
			return true; // dual-async response
		},
		
		/* [screenshot]
		Ask the game container to take a screenshot
		------------------------------------------*/
		"screenshot" :function(request, sender, response){
			chrome.tabs.sendMessage(request.tabId, {
				game:"kancolle",
				type:"game",
				action:"screenshot",
				playerIndex:request.playerIndex
			});
		}
		
	};
	
	/* Runtime Message Listener
	https://developer.chrome.com/extensions/messaging#simple
	This script will wait for messages from other parts of the extension
	and execute what they want if applicable
	*/
	chrome.runtime.onMessage.addListener(function(request, sender, callback){
		// Log message contents and sender for debugging
		console.log("Received message", request, "from", sender);
		
		// Check if message is intended for this script
		if( (request.identifier || false) == "kc3_service"){
			
			// Check requested action is supported
			if(typeof window.KC3Service[ request.action ] != "undefined"){
				// Execute and pass callback to function
				window.KC3Service[ request.action ](request, sender, callback);
				return true; // dual-async response
			}else{
				// Unknown action
				response({ success: false });
			}
		
		}
	});
	
	console.log("Synchronous initialization complete.");
	
})();