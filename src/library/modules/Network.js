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
			GameUpdate: [],
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
			Modernize: [],
			ClearedMap: [],
			PvPStart: [],
			PvPNight: [],
			PvPEnd: [],
			ExpeditionSelection: [],
			ExpeditionStart: [],
			ExpedResult: [],
		},
		delayedUpdate: {},

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
			if((this.delayedUpdate[eventName] || 0) <= 0) {
				$.each(this.eventTypes[eventName], function( index, callback ){
					callback( eventName, data||{});
				});
				this.delayedUpdate[eventName] = 0;
			} else {
				console.log("Prevented call to ",eventName);
				this.delayedUpdate[eventName] -= 1;
			}
		},

		/* DELAY
		Prevents event performing
		------------------------------------------*/
		delay : function(){
			var self = this;
			var amount = Array.prototype.shift.apply(arguments);
			$.each(arguments, function( i,eventName ){
				self.delayedUpdate[eventName] = amount;
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
		received : function( request ){
			// If request is an API Call
			if(request.request.url.indexOf("/kcsapi/") > -1){
				KC3Network.lastUrl = request.request.url;

				// Clear overlays before processing this new API call
				KC3Network.clearOverlays();

				// Create new request and process it
				// console.log(request);
				// console.log(request.request);
				var
					thisRequest = new KC3Request( request ),
					message = {
						tabId: chrome.devtools.inspectedWindow.tabId,
						message_id: "goodResponses",
						tcp_status: request.response.status,
						api_status: undefined,
						api_result: "他のリクエストが成功！",
					};
				if(thisRequest.validateHeaders()){
					thisRequest.readResponse(request, function(){
						if(thisRequest.validateData()){
							thisRequest.process();
							//---Kancolle DB Submission
							if (ConfigManager.DBSubmission_enabled && DBSubmission.checkIfDataNeeded(request.request.url)){
								request.getContent(function(content, encoding){
									DBSubmission.submitData(request.request.url,request.request.postData, content);
								});
							}
							//---

							// -- Poi DB Submission
							if (ConfigManager.PoiDBSubmission_enabled) {
								PoiDBSubmission.processData( thisRequest );
							}

						}
					});
					request.getContent(function(x){
						var data = JSON.parse(/svdata=(.+)$/.exec(x)[1]);
						message.api_status = data.api_result;
						message.api_result = data.api_result_msg;
						(new RMsg("service", "gameScreenChg", message)).execute();
					});
				}else{
					message.api_status = false;
					message.api_result = request.response.statusText;
					(new RMsg("service", "gameScreenChg", message)).execute();
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
