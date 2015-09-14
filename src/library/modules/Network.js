/* Network.js
KC3改 Network Listener

Must only be imported on devtools pages!
Listens to network history and triggers callback if game events happen
*/
(function(){
	"use strict";
	
	window.KC3Network = {
		hasOverlay: false,
		lastUrl: "",
		eventTypes : {
			GameStart: [],
			CatBomb: [],
			HomeScreen: [],
			HQ: [],
			Consumables: [],
			ShipSlots: [],
			GearSlots: [],
			Timers: [],
			Quests: [],
			Fleet: [],
			SortieStart: [],
			CompassResult: [],
			BattleStart: [],
			BattleNight: [],
			BattleResult: [],
			CraftGear: [],
			CraftShip: [],
			ClearedMap: [],
			PvPStart: [],
			PvPNight: [],
			PvPEnd: [],
			ExpedResult: [],
		},
		
		/* ADD LISTENER
		All callback to an event
		------------------------------------------*/
		addListener : function( eventName, callback ){
			this.eventTypes[eventName].push(callback);
		},
		
		/* ADD GLOBAL LISTENER
		All callback to all events
		------------------------------------------*/
		addGlobalListener : function( callback ){
			$.each(this.eventTypes, function( eventType, eventCallbacks ){
				eventCallbacks.push( callback );
			});
		},
		
		/* TRIGGER
		Execute subscribed callbacks to an event
		------------------------------------------*/
		trigger : function( eventName, data ){
			$.each(this.eventTypes[eventName], function( index, callback ){
				callback( eventName, data||{});
			});
		},
		
		/* LISTEN
		Start listening and define callback
		------------------------------------------*/
		listen :function(){
			// Call Chrome API to start listening
			chrome.devtools.network.onRequestFinished.addListener(this.received);
		},
		
		/* RECEIVED
		Fired when we receive network entry
		Inside, use "KC3Network" instead of "this"
		It's a callback so "this" is in the context of the chrome listener
		------------------------------------------*/
		received :function( request ){
			// If request is an API Call
			if(request.request.url.indexOf("/kcsapi/") > -1){
				KC3Network.lastUrl = request.request.url;
				
				// Clear overlays before processing this new API call
				KC3Network.clearOverlays();
				
				// Create new request and process it
				var thisRequest = new KC3Request( request );
				if(thisRequest.validateHeaders()){
					thisRequest.readResponse(request, function(){
						if(thisRequest.validateData()){
							thisRequest.process();
						}
					});
				}
			}
			
			// Overlay subtitles
			// http://125.6.189.247/kcs/sound/kckavryopoywwx/4.mp3?version=2
			
			if(request.request.url.indexOf("/kcs/sound/") > -1){
				// request.getContent(function( responseBody ){
				// 	console.log("kcssound", responseBody);
				// });
				
				console.log(request);
				var soundPaths = request.request.url.split("/");
				
				// Game Start Voices
				if(soundPaths[5]=="titlecall"){
					console.log("DETECTED titlecall sound");
					(new RMsg("service", "subtitle", {
						voicetype: "titlecall",
						filename: soundPaths[6],
						voiceNum: soundPaths[7].split(".")[0],
						url: request.request.url,
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
					
				// NPC Voices
				}else if(soundPaths[5]=="kc9999"){
					console.log("DETECTED NPC sound");
					(new RMsg("service", "subtitle", {
						voicetype: "npc",
						filename: soundPaths[6],
						voiceNum: soundPaths[7].split(".")[0],
						url: request.request.url,
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
					
				// Shipgirl Voices
				}else{
					console.log("DETECTED shipgirl sound");
					(new RMsg("service", "subtitle", {
						voicetype: "shipgirl",
						filename: soundPaths[5].substring(2),
						voiceNum: soundPaths[6].split(".")[0],
						url: request.request.url,
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
				}
			}
			
			// If request is a furniture asset
			if(request.request.url.indexOf("resources/image/furniture") > -1){
				// Clear overlays upon entering furniture menu
				KC3Network.clearOverlays();
			}
		},
		
		/* CLEAR OVERLAYS
		Ask background page to forward a message to play screen.
		Requests to remove existing HTML on-screen overlays
		------------------------------------------*/
		clearOverlays :function(){
			if(this.hasOverlay) {
				this.hasOverlay = false;
				(new RMsg("service", "clearOverlays", {
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
			}
		}
		
	};
	
})();
