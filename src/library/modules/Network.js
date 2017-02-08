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
			APIError: [],
			Bomb201: [],
			GameUpdate: [],
			HomeScreen: [],
			HQ: [],
			Consumables: [],
			ShipSlots: [],
			GearSlots: [],
			Timers: [],
			Quests: [],
			Fleet: [],
			Lbas: [],
			SortieStart: [],
			CompassResult: [],
			LandBaseAirRaid: [],
			BattleStart: [],
			BattleNight: [],
			BattleResult: [],
			CraftGear: [],
			CraftShip: [],
			Modernize: [],
			ClearedMap: [],
			PvPList: [],
			PvPFleet: [],
			PvPStart: [],
			PvPNight: [],
			PvPEnd: [],
			ExpeditionSelection: [],
			ExpeditionStart: [],
			ExpedResult: [],
			GunFit: [],
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
				console.log("Prevented call to", eventName);
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
							// -- Poi DB Submission
							// turns out "Request.process()" modifies the request,
							// so we handle the process before that is invoked.
							if (ConfigManager.PoiDBSubmission_enabled) {
								PoiDBSubmission.processData( thisRequest );
							}

							thisRequest.process();
							//---Kancolle DB Submission
							if (ConfigManager.DBSubmission_enabled && DBSubmission.checkIfDataNeeded(request.request.url)){
								request.getContent(function(content, encoding){
									DBSubmission.submitData(request.request.url,request.request.postData, content);
								});
							}
						}
					});
					request.getContent(function(x){
						try {
							var data = JSON.parse(/svdata=(.+)$/.exec(x)[1]);
							message.api_status = data.api_result;
							message.api_result = data.api_result_msg;
						} catch (e) {
							// Only prevent the data parsing error
							message.api_status = e.name;
							message.api_result = e.message;
							console.error("Prevented ",e.name,e.message,e.stack);/*RemoveLogging:skip*/
						} finally {
							(new RMsg("service", "gameScreenChg", message)).execute();
						}
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
			
			// Overlay subtitles
			// http://203.104.209.39/kcs/sound/kcdbtrdgatxdpl/178798.mp3?version=5
			if(request.request.url.indexOf("/kcs/sound/") > -1){
				var soundPaths = request.request.url.split("/");
				if(soundPaths[5]=="titlecall"){
					console.log("DETECTED titlecall sound");
					(new RMsg("service", "subtitle", {
						voicetype: "titlecall",
						filename: soundPaths[6],
						voiceNum: soundPaths[7].split(".")[0],
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
				}else if(soundPaths[5]=="kc9999"){
					console.log("DETECTED NPC sound", soundPaths);
					(new RMsg("service", "subtitle", {
						voicetype: "npc",
						filename: "",
						voiceNum: soundPaths[6].split(".")[0],
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
				}else{
					console.log("DETECTED shipgirl sound");
					var shipGirl = KC3Master.graph_file(soundPaths[5].substring(2));
					var voiceLine = KC3Meta.getVoiceLineByFilename(shipGirl, soundPaths[6].split(".")[0]);
					(new RMsg("service", "subtitle", {
						voicetype: "shipgirl",
						shipID: shipGirl,
						voiceNum: voiceLine,
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
				}
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
