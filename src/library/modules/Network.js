/* Network.js
KC3改 Network Listener

Must only be imported on devtools pages!
Listens to network history and triggers callback if game events happen
*/
(function(){
	"use strict";
	
	window.KC3Network = {
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
			NextNode: [],
			BattleStart: [],
			BattleNight: [],
			BattleResult: [],
			CraftGear: [],
			CraftShip: [],
			ClearedMap: [],
			PvPStart: [],
			PvPNight: [],
			PvPEnd: []
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
		------------------------------------------*/
		received :function( request ){
			// If request is an API Call
			if(request.request.url.indexOf("/kcsapi/") > -1){
				// Create new request and process it
				var thisRequest = new KC3Request( request );
				if(thisRequest.validateHeaders()){
					thisRequest.readResponse(request, function(){
						if(thisRequest.validateData()){
							thisRequest.process();
						}
					});
				}
				
				// Ask background service to clear overlays on inspected window
				(new RMsg("service", "clearOverlays", {
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				return true;
			}
			
			// If going to furniture rooom
			if(request.request.url.indexOf("/kcs/resources/image/furniture/") >= -1){
				// Ask background service to clear overlays on inspected window
				/*(new RMsg("service", "clearOverlays", {
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();*/
				return true;
			}
		}
		
	};
	
})();