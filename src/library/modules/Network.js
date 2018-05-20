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
			GearRemodelList: [],
			GearRemodelDetail: [],
			GearRemodel: [],
		},
		delayedUpdate: {},
		deferredEvents: [],
		submissionModuleNames: ["PoiDBSubmission", "OpenDBSubmission", "TsunDBSubmission"],
		submissionConfigs: {},

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
					callback( eventName, data || {});
				});
				this.delayedUpdate[eventName] = 0;
			} else {
				this.delayedUpdate[eventName] -= 1;
				console.log(`Prevented to call [${eventName}], delay ${this.delayedUpdate[eventName]} left`);
			}
		},

		/* DEFER TRIGGER
		Defers event performing after specified amount of API calls
		------------------------------------------*/
		deferTrigger : function(count, eventName, data){
			// Only allow `after` API call advice for now,
			// `before` and `around` seem not useful yet.
			const advice = "after";
			// +1 if not before since it will be handled at once after current API call
			const amount = count + (advice !== "before" ? 1 : 0);
			this.deferredEvents.push({
				advice: advice,
				amount: amount,
				name: eventName,
				data: data
			});
			//console.log(`Deferred to call [${eventName}] after ${count} time(s)`);
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

		/* INIT CONFIGS
		Store and listen to the changes of used config values
		------------------------------------------*/
		initConfigs :function(){
			ConfigManager.loadIfNecessary();
			// Initial config values
			const configSuffix = "_enabled";
			this.submissionModuleNames.forEach(name => {
				this.submissionConfigs[name] = ConfigManager[name + configSuffix];
			});
			const configChangedListener = ({key, timeStamp, url}) => {
				if(key === ConfigManager.keyName()) {
					const newConfigs = localStorage.getObject(ConfigManager.keyName());
					this.submissionModuleNames.forEach(name => {
						if(this.submissionConfigs[name] !== newConfigs[name + configSuffix]) {
							this.submissionConfigs[name] = newConfigs[name + configSuffix];
							// Clean previous states if config is changed from disabled to enabled,
							// because it is buggy especially on config changed during sortie.
							const submission = window[name], cleanMethod = submission && submission.cleanup;
							console.log(`${name} enabled changed to ${this.submissionConfigs[name]}${cleanMethod ? ", cleaning previous states..." : ""}`);
							if(cleanMethod) {
								try {
									cleanMethod.call(submission);
								} catch (error) {
									console.warn("Uncaught states cleanup", error);
								}
							}
						}
					});
				}
			};
			// Do not try to call this multiple times, otherwise this is needed:
			//window.removeEventListener("storage", configChangeListener);
			// Listen to the changes of local storage configs
			window.addEventListener("storage", configChangedListener);
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
							// Invoke remote DB submission modules
							KC3Network.submissionModuleNames.forEach(name => {
								if(KC3Network.submissionConfigs[name]) {
									// Assume module already loaded globally
									KC3Network.asyncSubmit(window[name], thisRequest);
								}
							});
							
							// Trigger deferred events before this API call if there are some
							//KC3Network.handleDeferredEvents(thisRequest, "before");
							
							thisRequest.process();
							
							// Trigger deferred events after this API call if there are some
							KC3Network.handleDeferredEvents(thisRequest, "after");
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
				} else {
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
		 * Call those events deferred by specified API call amount on specified advice.
		 */
		handleDeferredEvents :function(request, advice){
			if(!this.deferredEvents.length) { return false; }
			// Check the event queue if advice is matched
			const eventsToHandle = this.deferredEvents
				.filter(e => (e.advice === advice || e.advice === "around") && e.amount > 0);
			let eventTriggered = 0;
			eventsToHandle.forEach(e => {
				// Avoid to reduce API call count duplicatedly if advice is around
				if(e.advice !== "around" || (e.advice === "around" && advice === "before")) {
					e.amount -= 1;
				}
				if(e.amount <= 0) {
					// Remove the event already triggered from queue
					const index = this.deferredEvents.indexOf(e);
					if(index >= 0) { this.deferredEvents.splice(index, 1); }
					// Only trigger the event on first time countdown reaches
					if(e.amount === 0) {
						this.trigger(e.name, e.data);
						console.log(`Deferred event [${e.name}] called on [${request.call}]`, e);
						eventTriggered += 1;
					}
				} else {
					console.log(`Deferred event [${e.name}], ${e.amount} left on [${request.call}]`);
				}
			});
			// Indicate if there is an event triggered at least
			return eventTriggered > 0;
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
			switch(voiceType) {
			case "titlecall":
				// console.debug("DETECTED titlecall sound");
				(new RMsg("service", "subtitle", {
					voicetype: "titlecall",
					fullurl: http.request.url,
					filename: soundPaths[6],
					voiceNum: soundPaths[7].split(".")[0],
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			case "kc9997":
				// console.debug("DETECTED Event special sound", soundPaths);
				(new RMsg("service", "subtitle", {
					voicetype: "event",
					fullurl: http.request.url,
					filename: "",
					voiceNum: soundPaths[6].split(".")[0],
					voiceSize: http.response.content.size || 0,
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			case "kc9998":
				// console.debug("DETECTED Abyssal sound", soundPaths);
				(new RMsg("service", "subtitle", {
					voicetype: "abyssal",
					fullurl: http.request.url,
					filename: "",
					voiceNum: soundPaths[6].split(".")[0],
					voiceSize: http.response.content.size || 0,
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			case "kc9999":
				// console.debug("DETECTED NPC sound", soundPaths);
				(new RMsg("service", "subtitle", {
					voicetype: "npc",
					fullurl: http.request.url,
					filename: "",
					voiceNum: soundPaths[6].split(".")[0],
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			default:
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
