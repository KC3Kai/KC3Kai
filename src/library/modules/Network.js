/* Network.js
KC3改 Network Listener

Must only be imported on devtools pages!
Listens to network history and triggers callback if game events happen
*/
(function(){
	"use strict";

	window.KC3Network = {
		hasOverlay: false,
		isNextBlockerArmed: false,
		isNextBlockerNetworkFallback: false,
		isNextBlockerLarger: false,
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
			QuestList: [],
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
		battleEvent: {
			entered: false,
			time: undefined,
			identifier: undefined,
			resultRecieved: false,
		},
		submissionModuleNames: ["PoiDBSubmission", "TsunDBSubmission"],
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
							const isToCleanup = !this.submissionConfigs[name] && !!newConfigs[name + configSuffix];
							this.submissionConfigs[name] = newConfigs[name + configSuffix];
							// Clean previous states if config is changed from disabled to enabled,
							// because it is buggy especially on config changed during sortie.
							const submission = window[name],
								cleanMethod = submission && submission.cleanup,
								isAbleToCleanup = isToCleanup && typeof cleanMethod === "function";
							console.log(`${name} enabled changed to ${this.submissionConfigs[name]}${isAbleToCleanup ? ", cleaning previous states..." : ""}`);
							if(isAbleToCleanup) {
								try {
									cleanMethod.call(submission);
								} catch (error) {
									console.warn("Uncaught states cleanup", error);
								}
							}
						}
					});
					// Do not need to reload here, because it has been already listened and updated in theme scripts
					//ConfigManager.load();
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
		Argument HAR see: https://developer.chrome.com/extensions/devtools_network#type-Request
		------------------------------------------*/
		received : function(har){
			const requestUrl = har.request.url;
			// If request is an API Call
			if(requestUrl.indexOf("/kcsapi/") > -1){
				KC3Network.lastUrl = requestUrl;
				
				// Clear overlays before processing this new API call
				KC3Network.clearOverlays();
				
				// Create new request and process it
				// console.debug(request, request.request);
				var thisRequest = new KC3Request(har),
					message = {
						tabId: chrome.devtools.inspectedWindow.tabId,
						message_id: "goodResponses",
						tcp_status: har.response.status,
						api_status: undefined,
						api_result: "他のリクエストが成功！",
					};
				if(thisRequest.validateHeaders()){
					thisRequest.readResponse(har, function(){
						if(thisRequest.validateData()){
							// Invoke remote DB submission modules
							KC3Network.submissionModuleNames.forEach(name => {
								if(KC3Network.submissionConfigs[name]) {
									// Assume module already loaded globally
									KC3Network.asyncSubmit(window[name], thisRequest, name);
								}
							});
							
							// Trigger deferred events before this API call if there are some
							//KC3Network.handleDeferredEvents(thisRequest, "before");
							// Reset battle event before any valided API call
							KC3Network.setBattleEvent(false);
							
							thisRequest.process();
							
							// Trigger deferred events after this API call if there are some
							KC3Network.handleDeferredEvents(thisRequest, "after");
						}
					});
					har.getContent(function(x){
						try {
							var data = JSON.parse(/^[\s\S]*svdata=(.+)$/.exec(x)[1]);
							message.api_status = data.api_result;
							message.api_result = data.api_result_msg;
						} catch (e) {
							// Only prevent the data parsing error
							message.api_status = e.name;
							message.api_result = e.message;
							console.warn("Prevented unhandled", e);
						} finally {
							(new RMsg("service", "gameScreenChg", message)).execute();
						}
					});
				} else {
					message.api_status = false;
					message.api_result = har.response.statusText;
					(new RMsg("service", "gameScreenChg", message)).execute();
				}
				
				// When a sortie begins, assume fallback until we know SE isn't muted
				if(requestUrl.endsWith("/api_req_map/start")){
					KC3Network.isNextBlockerNetworkFallback = true;
				}
			}
			
			// If request is a furniture asset
			if(requestUrl.includes("/img/interior/interior_parts")){
				// Clear overlays upon entering furniture menu,
				// not work everytime since Phase 2 caches assets
				KC3Network.clearOverlays();
			}
			// Node 'sonar ping' sound should always be heard before a battle if SE is on;
			// Will allow us to determine whether SE is muted for the next blocker
			if(requestUrl.includes("/resources/se/252.")) {
				KC3Network.isNextBlockerNetworkFallback = false;
			}
			// If it's switching to NextNode or Yasen screen (might be others?)
			if(requestUrl.includes("/resources/se/217.") && ConfigManager.next_blocker === 1){
				KC3Network.triggerNextBlock(undefined, true);
			}
			// If request is a sound effect of closing shutter animation on battle ended,
			// to activiate and focus on game tab before battle result API call,
			// it only works if in-game SE is not completely off.
			// Also, to trigger when first taiha/chuuha CG cutin occurs, as game may be paused if in background tab
			// battle_cutin_damage requested only once per battle (but not sortie)
			const focusPaths = ["/resources/se/217.", "img/battle/battle_cutin_damage.json"];
			if(ConfigManager.focus_game_tab && KC3Network.battleEvent.entered
				// Only after: daytime? day / night to day? night start?
				// seems no side effect if game tab already focused, so use any time for now
				//&& KC3Network.battleEvent.time === "day"
				&& focusPaths.some(path => requestUrl.includes(path))){
				(new RMsg("service", "focusGameTab", {
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				// console.debug("Battle end SE detected, focus on game tab requested");
			}
			// Try to detect gadget server HTTP 403 error
			if(requestUrl.includes("/203.104.209.7/gadget_html5/js/") && har.response.status == 403){
				console.warn("Gadget server block detected", har.serverIPAddress, har.request, har.response);
				// Ensure panel display activiated from waiting homeport
				KC3Network.trigger("GameStart");
				KC3Network.trigger("CatBomb", {
					title: KC3Meta.term("CatBombRegionalBlockTitle"),
					message: KC3Meta.term("CatBombRegionalBlockMsg"),
				});
			}
			
			// Overlay subtitles
			KC3Network.showSubtitle(har);
		},

		/**
		 * Set some state attributes for tracking events of game battle.
		 */
		setBattleEvent :function(isEntered = false, time = undefined, identifier = undefined, isResultReceived = false){
			this.battleEvent.entered = isEntered;
			this.battleEvent.time = time;
			this.battleEvent.identifier = identifier;
			this.battleEvent.resultRecieved = isResultReceived;
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
		asyncSubmit :function(submission, request, moduleName){
			// turns out "Request.process()" modifies the request, so clone the unmodified instance first.
			var clonedRequest = $.extend(true, new KC3Request(), request);
			// although submission processes should not be slow, still make them parallel async.
			setTimeout(function(){
				try {
					//console.log(`Processing data via ${moduleName}...`);
					submission.processData.call(submission, clonedRequest);
				} catch (error) {
					// suppose all exceptions thrown are caught already, should not reach here.
					console.warn(`Uncaught data submission to ${moduleName}`, error);
				}
			}, 0);
		},

		/**
		 * Send a message to content script (via background script service)
		 * to show subtitles at overlay for supported sound audio files.
		 */
		showSubtitle :function(har){
			// url sample: http://203.104.209.39/kcs/sound/kcdbtrdgatxdpl/178798.mp3?version=5
			//             http://203.104.209.39/kcs2/resources/voice/titlecall_1/050.mp3
			const requestUrl = har.request.url;
			const isV2Voice = requestUrl.includes("/kcs2/resources/voice/");
			if(!(isV2Voice || requestUrl.includes("/kcs/sound/"))) {
				return;
			}
			const soundPaths = requestUrl.split("/");
			const voiceType = soundPaths[isV2Voice ? 6 : 5];
			switch(voiceType) {
			case "titlecall":
				// console.debug("DETECTED titlecall sound");
				(new RMsg("service", "subtitle", {
					voicetype: "titlecall",
					fullurl: requestUrl,
					filename: soundPaths[6],
					voiceNum: soundPaths[7].split(".")[0],
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			case "titlecall_1":
			case "titlecall_2":
				// console.debug("DETECTED kcs2 titlecall sound");
				(new RMsg("service", "subtitle", {
					voicetype: "titlecall",
					fullurl: requestUrl,
					filename: voiceType.split("_")[1],
					voiceNum: soundPaths[7].split(".")[0],
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			case "tutorial":
				// Ignore this for now
				break;
			case "kc9997":
				// console.debug("DETECTED Event special sound", soundPaths);
				(new RMsg("service", "subtitle", {
					voicetype: "event",
					fullurl: requestUrl,
					filename: "",
					voiceNum: soundPaths[6].split(".")[0],
					voiceSize: har.response.content.size || 0,
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			case "kc9998":
				// console.debug("DETECTED Abyssal sound", soundPaths);
				(new RMsg("service", "subtitle", {
					voicetype: "abyssal",
					fullurl: requestUrl,
					filename: "",
					voiceNum: soundPaths[6].split(".")[0],
					voiceSize: har.response.content.size || 0,
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			case "kc9999":
				// console.debug("DETECTED NPC sound", soundPaths);
				(new RMsg("service", "subtitle", {
					voicetype: "npc",
					fullurl: requestUrl,
					filename: "",
					voiceNum: soundPaths[6].split(".")[0],
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
				break;
			default:
				// console.debug("DETECTED shipgirl sound");
				const shipGirl = KC3Master.graph_file(soundPaths[5].substring(2));
				const voiceLine = KC3Meta.getVoiceLineByFilename(shipGirl, soundPaths[6].split(".")[0]);
				const audioFileSize = har.response.content.size || 0;
				(new RMsg("service", "subtitle", {
					voicetype: "shipgirl",
					fullurl: requestUrl,
					shipID: shipGirl,
					voiceNum: voiceLine,
					voiceSize: audioFileSize,
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
			}
		},

		/* NEXT BLOCK TRIGGER
		signals to game tab that next button blocking overlay needs to be shown
		triggered either by network request to results or SE network request
		-------------------------------------------------------*/
		triggerNextBlock: function({ effectiveTaihaFlag, isDameconDecision } = {}, bySE = false) {
			if(typeof effectiveTaihaFlag === "boolean") {
				/* For every time it checks HP predictions.
				 * If any ship predicted to be in Taiha, it arms locker in game page preventing player from advancing into next node.
				 * TODO cases like 1-6, where next node is end node without battle and it is safe to advance.
				 * TODO get FCF info and find a method to delay blocker after denying FCF decision screen.
				 */
				this.isNextBlockerArmed = effectiveTaihaFlag;
			}
			// Cache flagship damecon use decision screen flag, enlarge blocker area to block 2 large buttons on the left if true.
			if(typeof isDameconDecision === "boolean") { this.isNextBlockerLarger = isDameconDecision; }
			let toShowNextBlock = false;
			if (ConfigManager.next_blocker > 0 && this.isNextBlockerArmed) {
				if (bySE) {
					if (this.battleEvent.resultRecieved) {
						toShowNextBlock = true;
					} else {
						// battle result wasn't recieved, it must be yasen switch? do nothing.
					}
				} else {
					if (ConfigManager.next_blocker === 2 || this.isNextBlockerNetworkFallback) {
						// not from SE check or setting selected api check,
						// start showing block from fleets result and drop screen.
						toShowNextBlock = true;
					} else {
						// se/217.mp3 might fire twice. once for yasen and once for next node,
						// this flag prevents blocking until result data actually recieved.
						// if player wants it through sound warnings we must signal that we got result to distinguish it from yasen switch.
						// this flag has been already set by #setBattleEvent, here just a duplication.
						this.battleEvent.resultRecieved = true;
					}
				}
			}
			if (toShowNextBlock) {
				this.hasOverlay = true;
				(new RMsg("service", "showNextBlock", {
					tabId: chrome.devtools.inspectedWindow.tabId,
					fairy: bySE,
					large: this.isNextBlockerLarger,
				})).execute();
			}
		},

		/* Disarms Next Node Blocker */
		disarmNextBlock :function(){
			this.isNextBlockerArmed = false;
			this.isNextBlockerLarger = false;
			this.setBattleEvent(false);
			this.clearOverlays();
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
