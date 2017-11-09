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
			ModalBox: [],
			GameUpdate: [],
			DebuffNotify: [],
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
				this.delayedUpdate[eventName] -= 1;
				console.log("Prevented call to [" + eventName + "],",
					"delay", this.delayedUpdate[eventName], "left");
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
				// console.debug(request, request.request);
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
							if (ConfigManager.PoiDBSubmission_enabled) {
								KC3Network.asyncSubmit(PoiDBSubmission, thisRequest);
							}
							// -- OpenDB Submission
							if (ConfigManager.OpenDBSubmission_enabled) {
								KC3Network.asyncSubmit(OpenDBSubmission, thisRequest);
							}
							// -- TsunDB Submission
							if (ConfigManager.TsunDBSubmission_enabled) {
								KC3Network.asyncSubmit(TsunDBSubmission, thisRequest);
							}
							
							thisRequest.process();
							
							// -- Kancolle DB Submission, post-process
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
							console.error("Prevented " + e.name, e.message, e);
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
			KC3Network.showSubtitle(request);
		},

		/**
		 * Asynchronously invoke a remote DB submission module to submit KCSAPI request data.
		 */
		asyncSubmit :function(submission, request){
			// turns out "Request.process()" modifies the request, so clone the unmodified instance first.
			var clonedRequest = $.extend(true, new KC3Request(), request);
			// although submission processes should not be slow, still make them parallel async.
			setTimeout(function(){
				try {
					submission.processData.call(submission, clonedRequest);
				} catch (error) {
					// suppose all exceptions thrown are caught already, should not reach here.
					console.warn("Uncaught data submission", error);
				}
			});
		},

		/**
		 * Send a message to content script (via background script service)
		 * to show subtitles at overlay for supported sound audio files.
		 */
		showSubtitle :function(http){
			// url sample: http://203.104.209.39/kcs/sound/kcdbtrdgatxdpl/178798.mp3?version=5
			if(http.request.url.indexOf("/kcs/sound/") === -1) {
				return;
			}
			const soundPaths = http.request.url.split("/");
			const voiceType = soundPaths[5];
			if(voiceType === "titlecall") {
				// console.debug("DETECTED titlecall sound");
				(new RMsg("service", "subtitle", {
					voicetype: "titlecall",
					fullurl: http.request.url,
					filename: soundPaths[6],
					voiceNum: soundPaths[7].split(".")[0],
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
			} else if(voiceType === "kc9998") {
				// console.debug("DETECTED Abyssal sound", soundPaths);
				(new RMsg("service", "subtitle", {
					voicetype: "abyssal",
					fullurl: http.request.url,
					filename: "",
					voiceNum: soundPaths[6].split(".")[0],
					voiceSize: http.response.content.size || 0,
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
			} else if(voiceType === "kc9999") {
				// console.debug("DETECTED NPC sound", soundPaths);
				(new RMsg("service", "subtitle", {
					voicetype: "npc",
					fullurl: http.request.url,
					filename: "",
					voiceNum: soundPaths[6].split(".")[0],
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
			} else {
				// console.debug("DETECTED shipgirl sound");
				const shipGirl = KC3Master.graph_file(soundPaths[5].substring(2));
				const voiceLine = KC3Meta.getVoiceLineByFilename(shipGirl, soundPaths[6].split(".")[0]);
				const audioFileSize = http.response.content.size || 0;
				(new RMsg("service", "subtitle", {
					voicetype: "shipgirl",
					fullurl: http.request.url,
					shipID: shipGirl,
					voiceNum: voiceLine,
					voiceSize: audioFileSize,
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
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
