(function(){
	"use strict";
	_gaq.push(['_trackEvent', "Panel: Natsuiro Theme", 'clicked']);

	// Mathematical Constants
	var LOG3  = Math.log10(3);

	// Flags
	var currentLayout = "";
	var isRunning = false;
	var lastApiError = false;
	var lastApiFlag2 = false;

	// Interface values
	var selectedFleet = 1;
	var selectedExpedition = 1;
	var plannerIsGreatSuccess = false;
	var showCombinedFleetBars = true;
	var isTakingScreenshot = false;
	var overrideFocus = false;
	
	// a flag used by Fleet & ExpeditionStart to indicate
	// whether a fleet info update is triggered because of
	// sending out fleets.
	var expeditionStarted = false;
	
	// Critical Animation and Sound Effect
	var critAnim = false;
	var critSound = new Audio("../../../../assets/snd/heart.mp3");
	critSound.loop = true;

	// Morale Timer
	var moraleTimerHandler = 0;
	var moraleTimerLastUpdated = 0;
	var moraleClockValue = 100;
	var moraleClockEnd = 0;
	var moraleClockRemain = 0;

	// UI Updating Timer
	var uiTimerHandler = 0;
	var uiTimerLastUpdated = 0;

	// A jquery-ui tooltip options like native one
	var nativeTooltipOptions = {
		position: { my: "left top", at: "left+25 bottom", collision: "flipfit" },
		items: "[title],[titlealt]",
		content: function(){
			// Default escaping not used, keep html, simulate native one
			return ($(this).attr("title") || $(this).attr("titlealt") || "")
				.replace(/\n/g, "<br/>")
				.replace(/\t/g, "&emsp;&emsp;");
		}
	};
	(function($) {
		// AOP around the dispatcher for any exception thrown from event handlers
		var originalEventDispatch = $.event.dispatch;
		$.event.dispatch = function() {
			try {
				originalEventDispatch.apply(this, arguments);
			} catch(error) {
				console.error("Uncaught event", error, this);
				throw error;
			}
		};
		// A lazy initializing method, prevent duplicate tooltip instance
		$.fn.lazyInitTooltip = function(opts) {
			if(typeof this.tooltip("instance") === "undefined") {
				this.tooltip($.extend(true, {}, nativeTooltipOptions, opts));
			}
			return this;
		};
		// Actively close tooltips of element and its children
		$.fn.hideChildrenTooltips = function() {
			$.each($("[title]:not([disabled]),[titlealt]:not([disabled])", this), function(_, el){
				if(typeof $(el).tooltip("instance") !== "undefined")
					$(el).tooltip("close");
			});
			return this;
		};
		// Create native-like tooltips of element and its children
		$.fn.createChildrenTooltips = function() {
			$.each($("[title]:not([disabled])", this), function(_, el){
				$(el).lazyInitTooltip();
			});
			return this;
		};
	}(jQuery));

	// Reusable contents of Error Report
	var errorReport = {
		title: "",
		message: "",
		stack: "",
		request: "",
		params: "",
		response: "",
		serverUtc: 0,
		kc3Version: [chrome.runtime.getManifest().name, chrome.runtime.getManifest().version].join(" "),
		dmmPlay: "",
		gameTabUrl: "",
		userAgent: "",
		utc: 0
	};

	// make sure localStorage.expedTab is available
	// and is in correct format.
	// returns the configuration for expedTab
	// (previously called localStorage.expedTabLastPick)
	function ExpedTabValidateConfig(idToValid) {
		// data format for expedTab:
		// data.fleetConf: an object
		// data.fleetConf[fleetNum]:
		// * fleetNum: 1,2,3,4
		// * fleetNum could be either number or string
		//	 they will all be implicitly converted
		//	 to string (for indexing object) anyway
		// data.fleetConf[fleetNum].expedition: a number
		// data.expedConf: an object
		// data.expedConf[expedNum]:
		// * expedNum: 1..40, 100..102, 110
		// * expedNum is number or string, just like fleetNum
		// data.expedConf[expedNum].greatSuccess: boolean

		var data;
		const fillExpedConfDefaultGreatSuccess = (...ids) => {
			ids.forEach(i => {
				data.expedConf[i] = { greatSuccess: false };
			});
		};
		if (! localStorage.expedTab) {
			data = {};
			data.fleetConf = {};
			var i;
			for (i=1; i<=4; ++i) {
				data.fleetConf[i] = { expedition: 1 };
			}
			data.expedConf = {};
			fillExpedConfDefaultGreatSuccess(...Array.numbers(1, 40));
			fillExpedConfDefaultGreatSuccess(100, 101, 102, 110);
			localStorage.expedTab = JSON.stringify( data );
		} else {
			data = JSON.parse( localStorage.expedTab );
			// add default GS config for new added expeditions
			// * extended since 2017-10-18: 100~102 display name A1~A3 for World 1
			// * extended since 2017-10-25: 110 B1 for World 2
			if(idToValid > 0 && data.expedConf[idToValid] === undefined) {
				fillExpedConfDefaultGreatSuccess(idToValid);
			}
		}
		return data;
	}

	// selectedExpedition, plannerIsGreatSuccess + selectedFleet => storage
	function ExpedTabUpdateConfig() {
		const conf = ExpedTabValidateConfig(selectedExpedition);
		if(selectedFleet > 4) return;
		conf.fleetConf[ selectedFleet ].expedition = selectedExpedition;
		conf.expedConf[ selectedExpedition ].greatSuccess = plannerIsGreatSuccess;
		localStorage.expedTab = JSON.stringify( conf );
	}

	// apply stored user settings, note that this function
	// is not responsible for updating UI, so UpdateExpeditionPlanner() should be called after
	// this to reflect the change
	// storage + selectedFleet => selectedExpedition, plannerIsGreatSuccess
	function ExpedTabApplyConfig() {
		if(selectedFleet > 4) return;
		let conf = ExpedTabValidateConfig(selectedExpedition);
		selectedExpedition = conf.fleetConf[ selectedFleet ].expedition;
		// re-validate config in case that fleet has just returned from a new exped
		conf = ExpedTabValidateConfig(selectedExpedition);
		plannerIsGreatSuccess = conf.expedConf[ selectedExpedition ].greatSuccess;
	}

	function ExpedTabAutoFleetSwitch(needTabSwith) {
		// set "needTabSwitch" to true
		// for switching to expedition tab when a candidate fleet is found
		var fleets = PlayerManager.fleets;
		var availableFleetInd = -1;

		// if combined fleet is in use, the second fleet is not available
		// so we can skip it

		// start from the 2nd fleet (or 3rd if we have a combined fleet)
		var fleetStartInd = (PlayerManager.combinedFleet !== 0) ? 2 : 1;

		for (var i = fleetStartInd; i < 4; ++i) {
			// find one available fleet
			if (fleets[i].missionOK()) {
				availableFleetInd = i;
				break;
			}
		}

		if (availableFleetInd !== -1) {
			selectedFleet = availableFleetInd + 1;
			console.debug("Find available fleet:", selectedFleet);
			switchToFleet(selectedFleet);
			if (needTabSwith)
				$("#atab_expeditionPlanner").trigger("click");
		} else {
			// knowing fleets are all unavailable
			// we can return focus to the main fleet.
			// or if combined fleet is in used, we go to combined fleet tab
			switchToFleet(PlayerManager.combinedFleet !== 0 ? "combined" : 1);
			// also return focus to basic tab
			$("#atab_basic").trigger("click");
		}
	}

	function switchToFleet(targetFleet) {
		if (targetFleet === "combined") {
			$(".module.controls .fleet_rengo").trigger("click");
		} else if (targetFleet === "lbas") {
			$(".module.controls .fleet_lbas").trigger("click");
		} else {
			var fleetControls = $(".module.controls .fleet_num").toArray();
			for (var i=0; i<fleetControls.length; ++i) {
				var thisFleet = parseInt( $(fleetControls[i]).text(), 10);
				if (thisFleet === targetFleet) {
					$( fleetControls[i] ).trigger("click");
					break;
				}
			}
		}
	}

	function attemptToSwitchFleet(targetFleet) {
		// Won't switch when option is disabled at Settings
		if (!ConfigManager.info_auto_fleet_view) {
			return false;
		}
		// Won't switch if current selected is combined and target will be 1 or 2
		if (selectedFleet == 5 && (targetFleet == 1 ||
			targetFleet == 2 || targetFleet === "combined")) {
			return false;
		}
		// Won't switch if current selected is LBAS
		if (selectedFleet == 6 && targetFleet === "lbas") {
			return false;
		}
		// Won't switch if target fleet is current
		if (selectedFleet == targetFleet) {
			return false;
		}
		switchToFleet(targetFleet);
		return true;
	}
	
	/* Morale timers
	- use end time difference not remaining decrements for accuracy against lag
	--------------------------------------------*/
	function runUpdatingMoraleTimer() {
		moraleTimerLastUpdated = Date.now();
		// console.log(moraleClockValue, moraleClockEnd, moraleClockRemain);
		if(moraleClockEnd > 0){
			moraleClockRemain = Math.ceil( (moraleClockEnd - Date.now())/1000);
			if(moraleClockRemain > 0){
				$(".module.status .status_morale .status_text").text("~"+(moraleClockRemain+"").toHHMMSS());

			}else{
				moraleClockValue = 100;
				moraleClockEnd = 0;
				moraleClockRemain = 0;
				$(".module.status .status_morale .status_text").text( KC3Meta.term("PanelRecoveredMorale") );

				// Morale Notification
				if(ConfigManager.alert_morale_notif){
					// Play sound
					if(KC3TimerManager.notifSound){ KC3TimerManager.notifSound.pause(); }
					switch(ConfigManager.alert_type){
						case 1: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/pop.mp3"); break;
						case 2: KC3TimerManager.notifSound = new Audio(ConfigManager.alert_custom); break;
						case 3: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/ding.mp3"); break;
						default: KC3TimerManager.notifSound = false; break;
					}
					if(KC3TimerManager.notifSound){
						KC3TimerManager.notifSound.volume = ConfigManager.alert_volume / 100;
						KC3TimerManager.notifSound.play();
					}
					// Desktop notif regardless of settings, we consider Morale Notif as "yes"
					(new RMsg("service", "notify_desktop", {
						notifId: "morale",
						data: {
							type: "basic",
							title: KC3Meta.term("DesktopNotifyMoraleTitle"),
							message: KC3Meta.term("DesktopNotifyMoraleMessage"),
							iconUrl: "../../assets/img/ui/morale.png"
						}
					})).execute();
				}
			}
		}
	}

	function checkAndRestartMoraleTimer() {
		if(!moraleTimerHandler || Date.now() - moraleTimerLastUpdated >= 2000){
			if(!!moraleTimerHandler){
				console.debug("Old morale timer abandoned:", moraleTimerHandler);
				clearInterval(moraleTimerHandler);
			}
			moraleTimerHandler = setInterval(runUpdatingMoraleTimer, 1000);
		}
	}

	function runUpdatingUiTimer() {
		uiTimerLastUpdated = Date.now();
		// Basic Timer Stat
		KC3TimerManager.update();

		// Docking ~ Akashi Timer Stat
		let scopedFleetIds = [];
		if(selectedFleet == 6) {
			// No docking or Akashi timer for LBAS,
			// TODO show timer for all (max) moving LBAS planes ETA
		} else {
			scopedFleetIds = selectedFleet >= 5 ? [0, 1] : [selectedFleet - 1];
			const data = scopedFleetIds
				.map(id => PlayerManager.fleets[id].highestRepairTimes(true))
				.reduce((acc, cur) => {
					Object.keys(cur).forEach(k => {
						if(typeof cur[k] === "number") {
							acc[k] = Math.max(acc[k] || 0, cur[k]);
						} else if(Array.isArray(cur[k])) {
							if(acc[k] === undefined || cur[k].every(v => !!v)) acc[k] = cur[k];
						} else {
							acc[k] = cur[k];
						}
					});
					return acc;
				}, {});
			UpdateRepairTimerDisplays(data);
		}
		
		// Akashi current timer for Ship Box list
		const baseElement = scopedFleetIds.length ?
			scopedFleetIds.length > 1 ? ['main','escort'] : ['single']
			: [];
		baseElement.forEach(function(baseKey, index){
			const baseContainer = $([".shiplist",baseKey].join('_'));

			$(".sship,.lship", baseContainer).each(function(index, shipBox){
				const repairBox = $('.ship_repair_data',shipBox);
				const shipData = KC3ShipManager.get(repairBox.data('sid')),
					hpLost = shipData.hp[1] - shipData.hp[0],
					dockTime = shipData.repair[0],
					repairProgress = PlayerManager.akashiRepair.getProgress(dockTime, hpLost);

				$('.ship_repair_tick', shipBox).attr('data-tick',
					Number.isInteger(repairProgress.repairedHp) ? repairProgress.repairedHp : '?');
				$('.ship_repair_timer', shipBox).text(
					(function (t) {
						if (t === 0) {
							return '--:--:--';
						} else if (!t || Number.isNaN(parseInt(t))) {
							return '??:??:??';
						}
						return Math.ceil(t / 1000).toString().toHHMMSS();
					})(repairProgress.timeToNextRepair)
				);
			});
		});
	}

	function checkAndRestartUiTimer() {
		if(!uiTimerHandler || Date.now() - uiTimerLastUpdated >= 2000){
			if(!!uiTimerHandler){
				console.debug("Old UI timer abandoned:", uiTimerHandler);
				clearInterval(uiTimerHandler);
			}
			uiTimerHandler = setInterval(runUpdatingUiTimer, 1000);
		}
	}

	$(document).on("ready", function(){
		// Check localStorage
		if(!window.localStorage){
			$("#wait").hide();
			$("<div>").css({
				"width" : "450px",
				"padding" : "15px 20px",
				"background" : "#fcc",
				"border-radius" : "10px",
				"margin" : "30px auto 0px",
				"text-align" : "center",
				"font-weight" : "bold",
				"font-size" : "12px",
				"border" : "1px solid #c77"
			}).html( KC3Meta.term("PanelErrorStorage") ).appendTo("body");
			return true;
		}

		// Initialize data managers
		ConfigManager.load();
		KC3Master.init();
		RemodelDb.init();
		WhoCallsTheFleetDb.init("../../../../");
		KC3Meta.init("../../../../data/");
		KC3Master.loadAbyssalShips("../../../../data/");
		KC3Meta.defaultIcon("../../../../assets/img/ui/empty.png");
		KC3Meta.loadQuotes();
		PlayerManager.init();
		KC3ShipManager.load();
		KC3GearManager.load();
		KC3SortieManager.load();
		KC3Database.init();
		KC3Translation.execute();
		KC3QuestSync.init();

		// Live translations of Quests, only work for EN
		if(ConfigManager.checkLiveQuests && ConfigManager.language=="en"){
			$.ajax({
				async: true,
				dataType: "JSON",
				url: "https://raw.githubusercontent.com/KC3Kai/kc3-translations/master/data/"+ConfigManager.language+"/quests.json?v="+(Date.now()),
				success: function(newQuestTLs){
					if(JSON.stringify(newQuestTLs) !== JSON.stringify(KC3Meta._quests)){
						var enQuests = JSON.parse($.ajax({
							url : '../../../../data/lang/data/en/quests.json',
							async: false
						}).responseText);
						KC3Meta._quests = $.extend(true, enQuests, newQuestTLs);
						//console.debug(KC3Meta._quests);
						console.info("New quests detected, live updated");/*RemoveLogging:skip*/
					}else{
						console.info("Quests is up to date");
					}
				}
			});
		}

		// Live updating from github repo
		// TODO the option may be changed to other term, or another new option
		if(ConfigManager.checkLiveQuests){
			$.ajax({
				async: true,
				dataType: "JSON",
				url: "https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/data/tp_mult.json?v="+(Date.now()),
				success: function(newTPData){
					if(JSON.stringify(newTPData) !== JSON.stringify(KC3Meta._tpmult)) {
						$.extend(true, KC3Meta._tpmult, newTPData);
						console.info("TP value multiplier live updated");/*RemoveLogging:skip*/
					}
				}
			});
		}

		// Panel customizations: panel opacity
		$(".wrapper_bg").css("opacity", ConfigManager.pan_opacity/100);
		$(".module.activity .activity_tab").css("background", ConfigManager.pan_box_bcolor);
		$(".module.activity .activity_body").css("background", ConfigManager.pan_box_bcolor);

		// Panel customizations: bg image
		if(ConfigManager.pan_bg_image === ""){
			$("body").css("background", ConfigManager.pan_bg_color);
		}else{
			$("body").css("background-image", "url("+ConfigManager.pan_bg_image+")");
			$("body").css("background-color", ConfigManager.pan_bg_color);
			$("body").css("background-size", ConfigManager.pan_bg_size);
			$("body").css("background-position", ConfigManager.pan_bg_position);
			$("body").css("background-repeat", "no-repeat");
		}

		// Panel customizations: custom css
		if(ConfigManager.pan_custom_css !== ""){
			var customCSS = document.createElement("style");
			customCSS.type = "text/css";
			customCSS.innerHTML = ConfigManager.pan_custom_css;
			$("head").append(customCSS);
		}

		// Listen config key changed
		window.addEventListener("storage", function({key, timeStamp, url}){
			if(key === ConfigManager.keyName()) {
				ConfigManager.load();
				console.debug("Reload ConfigManager caused by", (url || "").match(/\/\/[^\/]+\/([^\?]+)/)[1]);
			}
		});

		// Disable Tab key to prevent it scrolling any window
		$(document).on("keydown", function(e){
			if(e.which === 9) {
				e.stopPropagation();
				e.preventDefault();
			}
		});

		// Close CatBomb modal
		$(".modalBox").on("click", ".closebtn", function(){
			$(this).parent().parent().fadeOut(300);
		});
		
		// Download error report
		$("#catBomb .download").on("click", function(){
			var blob = new Blob([JSON.stringify(errorReport)], {type: "application/json;charset=utf-8"});
			saveAs(blob, 'KC3-Error-'+Math.floor((new Date()).getTime()/1000)+".json");
		});

		// HQ name censoring
		$(".admiral_name").on("click", function(){
			if($(this).hasClass("censor")){
				$(this).removeClass("censor");
			}else{
				$(this).addClass("censor");
			}
		});

		// HQ Exp Toggle
		$(".admiral_lvnext").on("click",function(){
			ConfigManager.scrollHQExpInfo();
			NatsuiroListeners.HQ();
		});

		// Switch Rank Title vs Rank Points Counter
		$(".admiral_rank").on("click",function(){
			ConfigManager.scrollRankPtsMode();
			NatsuiroListeners.HQ();
		});

		// HQ Info Toggle
		$(".consumables").on("click",function(){
			ConfigManager.scrollHqInfoPage();
			NatsuiroListeners.Consumables();
		});

		// eLoS Toggle
		$(".summary-eqlos").on("click",function(){
			if(selectedFleet === 6) return;
			ConfigManager.scrollElosMode();
			NatsuiroListeners.Fleet();
		}).addClass("hover");

		// Fighter Power Toggle
		$(".summary-airfp .summary_icon").on("click",function(){
			if(selectedFleet !== 5) return;
			ConfigManager.loadIfNecessary();
			ConfigManager.air_combined = !ConfigManager.air_combined;
			ConfigManager.save();
			NatsuiroListeners.Fleet();
		}).addClass("hover");
		$(".summary-airfp .summary_text").on("click",function(){
			if(selectedFleet === 6) return;
			ConfigManager.scrollFighterPowerMode();
			NatsuiroListeners.Fleet();
		}).addClass("hover");

		// AntiAir Formation Toggle
		$(".summary-antiair").on("click",function(){
			if(selectedFleet === 6) return;
			ConfigManager.scrollAntiAirFormation(selectedFleet === 5);
			NatsuiroListeners.Fleet();
		}).addClass("hover");

		// Timer Type Toggle
		$(".status_docking,.status_akashi").on("click",function(){
			if(selectedFleet === 6) return;
			ConfigManager.scrollTimerType();
			UpdateRepairTimerDisplays();
		}).addClass("hover");

		// Screenshot buttons
		$(".module.controls .btn_ss1").on("click", function(){
			if (isTakingScreenshot) return;
			isTakingScreenshot = true;
			
			$(this).addClass("active");

			// Tell service to pass a message to gamescreen on inspected window to get a screenshot
			(new RMsg("service", "screenshot", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				playerName: PlayerManager.hq.name
			}, function(response){
				$(".module.controls .btn_ss1").removeClass("active");
				isTakingScreenshot = false;
			})).execute();
		});

		// Export button
		$(".module.controls .btn_export").on("click", function(){
			window.open("http://www.kancolle-calc.net/deckbuilder.html?predeck=".concat(encodeURI(
				JSON.stringify(PlayerManager.prepareDeckbuilder())
				)));
		});

		/* Expedition Planner
		--------------------------------------------*/

		$( ".module.activity .activity_expeditionPlanner .expres_greatbtn" )
			.on("click",function() {
				plannerIsGreatSuccess = !plannerIsGreatSuccess;
				ExpedTabUpdateConfig();
				NatsuiroListeners.UpdateExpeditionPlanner();
			} );


		/* Morale timers, and clickable to restart timer manually.
		--------------------------------------------*/
		checkAndRestartMoraleTimer();
		$( ".module.status .status_morale" ).on("click",function() {
			checkAndRestartMoraleTimer();
			checkAndRestartUiTimer();
		});

		// Switching Activity Tabs
		$(".module.activity .activity_tab").on("click", function(){
			var target = $(this).data("target");
			$(".module.activity .activity_tab").removeClass("active");
			$(this).addClass("active");
			$(".module.activity .activity_box").hide();
			if(target === "expeditionPlanner"){
				NatsuiroListeners.UpdateExpeditionPlanner();
			}
			$(".module.activity .activity_" + target).show();
		});
		$(".module.activity .activity_tab.active").trigger("click");

		$(".module.activity .activity_dismissable").on("click", function(){
			$("#atab_basic").trigger("click");
		});

		// Expedition Planner
		$(".expedition_entry").on("click",function(){
			selectedExpedition = parseInt( $(this).data("expId") );
			var conf = ExpedTabValidateConfig(selectedExpedition);
			plannerIsGreatSuccess = conf.expedConf[ selectedExpedition ].greatSuccess;
			ExpedTabUpdateConfig();
			NatsuiroListeners.UpdateExpeditionPlanner();
		});

		// Fleet selection
		$(".module.controls .fleet_num").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(".module.controls .fleet_rengo").removeClass("active");
			$(".module.controls .fleet_lbas").removeClass("active");
			$(this).addClass("active");
			selectedFleet = parseInt( $(this).text(), 10);
			NatsuiroListeners.Fleet();
			ExpedTabApplyConfig();
			NatsuiroListeners.UpdateExpeditionPlanner();
		});

		// Combined Fleet button
		$(".module.controls .fleet_rengo").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(".module.controls .fleet_lbas").removeClass("active");
			$(this).addClass("active");
			selectedFleet = 5;
			NatsuiroListeners.Fleet();
		});
		
		// LBAS button
		$(".module.controls .fleet_lbas").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(".module.controls .fleet_rengo").removeClass("active");
			$(this).addClass("active");
			selectedFleet = 6;
			NatsuiroListeners.Lbas();
		});

		// Toggle mini-bars under combined fleet ship list
		$(".module.fleet .shiplist_combined").on("click", ".sship .ship_bars", function(){
			if($(this).css("opacity") == "0"){
				showCombinedFleetBars = true;
				$(".module.fleet .sship .ship_bars").css("opacity", "1");
			}else{
				showCombinedFleetBars = false;
				$(".module.fleet .sship .ship_bars").css("opacity", "0");
			}
		});

		// Resize window to 800x480
		$(".module.controls .btn_resize").on("click", function(){
			// Send fit-screen request to service to be forwarded to gameplay page
			(new RMsg("service", "fitScreen", {
				tabId: chrome.devtools.inspectedWindow.tabId
			})).execute();
		});

		// Mute button
		$(".module.controls .btn_mute").on("click", function(){
			// Send toggle sound request to service to be forwarded to gameplay page
			(new RMsg("service", "toggleSounds", {
				tabId: chrome.devtools.inspectedWindow.tabId
			},function(isMuted){
				$(".module.controls .btn_mute img")
					.attr("src", "img/mute{0}.png".format(isMuted ? "-x" : ""));
			})).execute();
		});

		// Trigger initial selected fleet num
		$(".module.controls .fleet_num.active").trigger("click");

		// Initialize timer objects with bindings to their UI
		KC3TimerManager.init([
			$(".module.activity .expedition_1"),
			$(".module.activity .expedition_2"),
			$(".module.activity .expedition_3")
		],
		[
			$(".module.activity .repair_1"),
			$(".module.activity .repair_2"),
			$(".module.activity .repair_3"),
			$(".module.activity .repair_4")
		],
		[
			$(".module.activity .build_1"),
			$(".module.activity .build_2"),
			$(".module.activity .build_3"),
			$(".module.activity .build_4")
		]);

		// Update Timer UIs
		checkAndRestartUiTimer();

		// Devbuild: auto-activate dashboard while designing
		// Activate();

		// Start Network listener
		KC3Network.addGlobalListener(function(event, data){
			if(isRunning || (["GameStart","HomeScreen","CatBomb"].indexOf(event)+1)){
				if(typeof NatsuiroListeners[event] != "undefined"){
					NatsuiroListeners[event](data);
				} else {
					console.warn("No event found for keyword", event);
				}
			}
		});
		KC3Network.listen();

		// Get info of the inspected tab
		(new RMsg("service", "getTabInfo", {
			tabId: chrome.devtools.inspectedWindow.tabId
		}, function(tabInfo){
			errorReport.gameTabUrl = tabInfo.url;
			// if inspected tab is muted, update the mute icon
			try {
				if(tabInfo.mutedInfo.muted){
					$(".module.controls .btn_mute img").attr("src", "img/mute-x.png");
				} else if(ConfigManager.mute_game_tab) {
					(new RMsg("service", "toggleSounds", {
						tabId: chrome.devtools.inspectedWindow.tabId
					}, function(isMuted){
						$(".module.controls .btn_mute img")
							.attr("src", "img/mute{0}.png".format(isMuted ? "-x" : ""));
					})).execute();
				}
			} catch(e) {}
		})).execute();
		
		// Attempt to activate game on inspected window
		(new RMsg("service", "activateGame", {
			tabId: chrome.devtools.inspectedWindow.tabId
		})).execute();

		// Waiting for actions
		$("<div>").css({
			"width" : "300px",
			"height" : "50px",
			"line-height" : "50px",
			"background" : "#fff",
			"border-radius" : "10px",
			"margin" : "30px auto 0px",
			"text-align" : "center",
			"font-weight" : "bold",
			"font-size" : "14px"
		}).addClass("waitingForActions").html( KC3Meta.term("PanelWaitActions") ).appendTo("body");
	});

	$(window).on("resize", function(){
		Orientation();
	});

	function Activate(){
		if(isRunning === true){ return true; }
		isRunning = true;
		Orientation();
		$(".waitingForActions").hide();
		$(".wrapper").show();
	}

	function Orientation(){
		if(!isRunning){ return false; }
		var scrollBarWidth = (window.innerWidth - $(window).width()) || 0;
		var expectedVerticalWidth = 800 - scrollBarWidth;
		// Wide interface, switch to vertical if not yet
		if($(window).width() >= expectedVerticalWidth && currentLayout != "vertical"){
			$(".wrapper").removeClass("h").addClass("v");
			currentLayout = "vertical";
		// Narrow interface, switch to horizontal if not yet
		} else if($(window).width() < expectedVerticalWidth && currentLayout != "horizontal"){
			$(".wrapper").removeClass("v").addClass("h");
			currentLayout = "horizontal";
		}
	}

	function clearSortieData(){
		$(".module.activity .activity_box").hideChildrenTooltips();
		$(".module.activity .activity_battle").css("opacity", "0.25");
		$(".module.activity .map_world").text("");
		$(".module.activity .map_info").removeClass("map_finisher");
		$(".module.activity .map_gauge *:not(.clear)").css("width", "0%");
		$(".module.activity .map_hp").text("");
		$(".module.activity .sortie_node").text("").removeAttr("title")
			.removeClass("nc_battle nc_resource nc_maelstrom nc_select nc_avoid")
			.removeClass(KC3Node.knownNodeExtraClasses().join(" "));
		$(".module.activity .sortie_nodes .boss_node").removeAttr("style");
		$(".module.activity .sortie_nodes .boss_node").hide();
		$(".module.activity .node_types").hide();
		$(".battle_support,.battle_drop",".module.activity").find('img')
			.css("visibility","");
		$(".admiral_lvnext")
			.attr("data-exp-gain","");
	}

	function clearBattleData(){
		$(".module.activity .activity_box").hideChildrenTooltips();
		$(".module.activity .abyss_ship img").attr("src", KC3Meta.abyssIcon(-1));
		$(".module.activity .abyss_ship img").attr("titlealt", "").lazyInitTooltip();
		$(".module.activity .abyss_ship").removeClass(KC3Meta.abyssShipBorderClass().join(" "));
		$(".module.activity .abyss_ship").removeData("masterId").off("dblclick");
		$(".module.activity .abyss_ship").css("opacity", 1);
		$(".module.activity .abyss_combined").hide();
		$(".module.activity .abyss_single").show();
		$(".module.activity .abyss_ship").hide();
		$(".module.activity .abyss_hp").hide();
		$(".module.activity .battle_eformation img").attr("src", "../../../../assets/img/ui/empty.png");
		$(".module.activity .battle_eformation").attr("title", "").lazyInitTooltip();
		$(".module.activity .battle_eformation").css("-webkit-transform", "rotate(0deg)");
		$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support.png");
		$(".module.activity .battle_support").attr("title", KC3Meta.term("BattleSupportExped")).lazyInitTooltip();
		$(".module.activity .battle_support .support_lbas").hide();
		$(".module.activity .battle_support .support_exped").hide();
		$(".module.activity .battle_fish").lazyInitTooltip();
		$(".module.activity .battle_aaci img").attr("src", "../../../../assets/img/ui/dark_aaci.png");
		$(".module.activity .battle_aaci").attr("title", KC3Meta.term("BattleAntiAirCutIn")).lazyInitTooltip();
		$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
		$(".module.activity .battle_night").lazyInitTooltip();
		$(".module.activity .battle_rating img").attr("src", "../../../../assets/img/ui/dark_rating.png").css("opacity", "");
		$(".module.activity .battle_rating").lazyInitTooltip();
		$(".module.activity .battle_drop img").attr("src", "../../../../assets/img/ui/dark_shipdrop.png");
		$(".module.activity .battle_drop").removeData("masterId").off("dblclick").removeClass("new_ship");
		$(".module.activity .battle_drop").attr("title", "").lazyInitTooltip();
		$(".module.activity .battle_cond_value").text("");
		$(".module.activity .battle_engagement").prev().text(KC3Meta.term("BattleEngangement"));
		$(".module.activity .battle_engagement").removeClass(KC3Meta.battleSeverityClass(KC3Meta.engagement()));
		$(".module.activity .battle_engagement").attr("title", "").lazyInitTooltip();
		$(".module.activity .battle_detection").prev().text(KC3Meta.term("BattleDetection"));
		$(".module.activity .battle_detection").removeClass(KC3Meta.battleSeverityClass(KC3Meta.detection()));
		$(".module.activity .battle_detection").attr("title", "").lazyInitTooltip();
		$(".module.activity .battle_airbattle").removeClass(KC3Meta.battleSeverityClass(KC3Meta.airbattle()));
		$(".module.activity .battle_airbattle").attr("title", "").lazyInitTooltip();
		$(".module.activity .plane_text span").text("");
		$(".module.activity .sink_icons .sunk img").hide();
		$(".module.activity .battle_planes .fighter_ally .plane_icon img").attr("src", "../../../../assets/img/items/6.png");
		$(".module.activity .battle_planes .fighter_enemy .plane_icon img").attr("src", "../../../../assets/img/items/6.png");
		$(".module.activity .battle_planes .bomber_ally .plane_icon img").attr("src", "../../../../assets/img/items/7.png");
		$(".module.activity .battle_planes .bomber_enemy .plane_icon img").attr("src", "../../../../assets/img/items/7.png");
	}

	var NatsuiroListeners = {
		GameStart: function(data){ Activate(); },
		HomeScreen: function(data){
			ConfigManager.loadIfNecessary();
			Activate();
			clearSortieData();
			clearBattleData();
			if(!overrideFocus){
				$("#atab_basic").trigger("click");
			}else{
				overrideFocus = false;
			}

			checkAndRestartMoraleTimer();
			checkAndRestartUiTimer();

			if(!KC3Master.available){
				window.location.href = "../../nomaster.html";
				return false;
			}
		},

		CatBomb: function(data){
			$("#catBomb").hide();
			
			if (!ConfigManager.showCatBombs) return false;
			
			$("#catBomb .title").html( data.title );
			$("#catBomb .description").html( data.message );
			$("#catBomb .download").hide();
			$("#catBomb .content").removeClass("withDownload");
			$("#catBomb").fadeIn(300);
		},
		
		APIError: function(data){
			$("#catBomb").hide();
			
			if (!ConfigManager.showApiError
				|| (!ConfigManager.repeatApiError
					&& !!lastApiError && lastApiError.stack === data.stack
					)
				) {
				return false;
			}
			lastApiError = data;
			$("#catBomb .title").html( data.title );
			$("#catBomb .description").html( data.message );
			$("#catBomb").fadeIn(300);
			
			if (ConfigManager.detailedApiError) {
				$("#catBomb .download").show();
				$("#catBomb .content").addClass("withDownload");
				errorReport.title = data.title;
				errorReport.message = data.message;
				errorReport.stack = data.stack;
				errorReport.request = JSON.stringify(data.request);
				errorReport.params = JSON.stringify(data.params);
				errorReport.response = data.response;
				errorReport.serverUtc = data.serverUtc;
				errorReport.dmmPlay = localStorage.dmmplay;
				errorReport.userAgent = navigator.userAgent;
				errorReport.utc = Date.now();
			} else {
				$("#catBomb .download").hide();
				$("#catBomb .content").removeClass("withDownload");
			}
		},
		
		Bomb201: function(data){
			$("#catBomb").hide();
			
			if (!ConfigManager.showCatBombs) return false;
			
			$("#catBomb .title").html( data.title );
			$("#catBomb .description").html( data.message );
			$("#catBomb .download").hide();
			$("#catBomb .content").removeClass("withDownload");
			$("#catBomb").fadeIn(300);
		},

		// General green modal message box, reusing #gameUpdate div elements
		ModalBox: function(data){
			$("#gameUpdate").hide();
			$("#gameUpdate .title").html(data.title);
			if(data.message){
				$("#gameUpdate .description .message").html(data.message);
				$("#gameUpdate .description .message").show();
			} else {
				$("#gameUpdate .description .message").hide();
			}
			if(data.link){
				$("#gameUpdate .description a").html(data.link);
				$("#gameUpdate .description a").off("click");
				if(typeof data.onClick === "function"){
					$("#gameUpdate .description a").on("click", data.onClick);
				}
				$("#gameUpdate .description a").show();
			} else {
				$("#gameUpdate .description a").hide();
			}
			$("#gameUpdate").fadeIn(300);
		},

		GameUpdate: function(data){
			let msg = "";
			if(data[0] > 0 && data[1] > 0){
				msg = KC3Meta.term("GameUpdateBoth").format(data[0], data[1]);
			}else if(data[0] > 0){
				msg = KC3Meta.term("GameUpdateShips").format(data[0]);
			}else{
				msg = KC3Meta.term("GameUpdateEquips").format(data[1]);
			}
			this.ModalBox({
				title: KC3Meta.term("GameUpdateDetected"),
				message: msg,
				link: KC3Meta.term("GameUpdateLink"),
				onClick: function(e){
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "mstupdate"
					})).execute();
					return false;
				}
			});
		},

		DebuffNotify: function(data){
			// From Event Summer 2016,
			// devs set api_m_flag2 to 1 on port, to play the debuff SE.
			if(data.api_m_flag2 === undefined){
				lastApiFlag2 = false;
			} else if(data.api_m_flag2 > 0){
				// so the flag does not indicate state of the debuff,
				// it only indicates: time to play a SE.
				// we cannot detect: is the debuff reset?
				//let isDebuffed = data.api_m_flag2 == 1;
				this.ModalBox({
					title: KC3Meta.term("BossDebuffedTitle"),
					message: KC3Meta.term("BossDebuffedMessage").format(
						//KC3Meta.term(isDebuffed ? "BossDebuffedYes" : "BossDebuffedNo")
						KC3Meta.term("BossDebuffedYes")
					)
				});
				// this cached flag not used for now,
				// as api_m_flag2 will be always reset to 0 if playing SE not required
				lastApiFlag2 = data.api_m_flag2;
			}
		},

		HQ: function(data){
			$(".module.admiral").hideChildrenTooltips();
			$(".admiral_name").text( PlayerManager.hq.name );
			$(".admiral_comm").text( PlayerManager.hq.desc );
			$(".admiral_rank").lazyInitTooltip();
			if(ConfigManager.rankPtsMode === 2){
				$(".admiral_rank").text(PlayerManager.hq.getRankPoints()
					.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
					+ KC3Meta.term("HQRankPoints")
				).attr("title", KC3Meta.term("HQRankPointsTip")
					.format(!PlayerManager.hq.rankPtLastTimestamp ? "?"
						: new Date(PlayerManager.hq.rankPtLastTimestamp).format("yyyy-mm-dd HH:MM:ss"))
				);
			} else {
				$(".admiral_rank").text(PlayerManager.hq.rank).attr("title", "");
			}
			$(".admiral_lvval").text( PlayerManager.hq.level );
			$(".admiral_lvbar").css({width: Math.round(PlayerManager.hq.exp[0]*58)+"px"});
			updateHQEXPGained($(".admiral_lvnext"));
		},

		Consumables: function(data){
			$(".activity_basic .consumables").hideChildrenTooltips();
			let getWarnRscCap = max => Math.floor(max * (ConfigManager.alert_rsc_cap / 100)) || Infinity;
			$(".count_fcoin")
				.text( PlayerManager.consumables.fcoin || 0 )
				.toggleClass("hardCap", PlayerManager.consumables.fcoin >= getWarnRscCap(PlayerManager.maxCoin));
			$(".count_buckets")
				.text( PlayerManager.consumables.buckets || 0 )
				.toggleClass("hardCap", PlayerManager.consumables.buckets >= getWarnRscCap(PlayerManager.maxConsumable));
			$(".count_screws")
				.text( PlayerManager.consumables.screws || 0 )
				.toggleClass("hardCap", PlayerManager.consumables.screws >= getWarnRscCap(PlayerManager.maxConsumable));
			$(".count_torch")
				.text( PlayerManager.consumables.torch || 0 )
				.toggleClass("hardCap", PlayerManager.consumables.torch >= getWarnRscCap(PlayerManager.maxConsumable));
			$(".count_devmats")
				.text( PlayerManager.consumables.devmats || 0 )
				.toggleClass("hardCap", PlayerManager.consumables.devmats >= getWarnRscCap(PlayerManager.maxConsumable));
			if(Array.isArray(PlayerManager.hq.lastMaterial)){
				// Regen for fuel, ammo, steel: +3 every 3 minutes. bauxite +1 / 3mins
				let roundUpTo3Mins = m => String(60 * (m + (m % 3 ? 3 - m % 3 : 0)));
				let regenCap = PlayerManager.hq.getRegenCap();
				let fuel = PlayerManager.hq.lastMaterial[0],
					ammo = PlayerManager.hq.lastMaterial[1],
					steel = PlayerManager.hq.lastMaterial[2],
					bauxite = PlayerManager.hq.lastMaterial[3];
				$(".count_fuel")
					.text( fuel )
					.toggleClass("regenCap", fuel >= regenCap)
					.toggleClass("hardCap", fuel >= getWarnRscCap(PlayerManager.maxResource))
					.attr("title", fuel >= regenCap ? "\u27A4" + regenCap :
						"{0} \u27A4{1}".format(roundUpTo3Mins(regenCap - fuel).toHHMMSS(), regenCap))
					.lazyInitTooltip();
				$(".count_steel")
					.text( steel )
					.toggleClass("regenCap", steel >= regenCap)
					.toggleClass("hardCap", steel >= getWarnRscCap(PlayerManager.maxResource))
					.attr("title", steel >= regenCap ? "\u27A4" + regenCap :
						"{0} \u27A4{1}".format(roundUpTo3Mins(regenCap - steel).toHHMMSS(), regenCap))
					.lazyInitTooltip();
				$(".count_ammo")
					.text( ammo )
					.toggleClass("regenCap", ammo >= regenCap)
					.toggleClass("hardCap", ammo >= getWarnRscCap(PlayerManager.maxResource))
					.attr("title", ammo >= regenCap ? "\u27A4" + regenCap :
						"{0} \u27A4{1}".format(roundUpTo3Mins(regenCap - ammo).toHHMMSS(), regenCap))
					.lazyInitTooltip();
				$(".count_bauxite")
					.text( bauxite )
					.toggleClass("regenCap", bauxite >= regenCap)
					.toggleClass("hardCap", bauxite >= getWarnRscCap(PlayerManager.maxResource))
					.attr("title", bauxite >= regenCap ? "\u27A4" + regenCap :
						"{0} \u27A4{1}".format(String(180 * (regenCap - bauxite)).toHHMMSS(), regenCap))
					.lazyInitTooltip();
			}
			// More pages could be added, see `api_get_member/useitem` in Kcsapi.js
			$(".count_1classMedals_or_mackerel").text( PlayerManager.consumables.mackerel || PlayerManager.consumables.firstClassMedals || 0 )
				.prev().attr("title", KC3Meta.useItemName(PlayerManager.consumables.mackerel ? 68 : 61) )
				.children("img").attr("src", "/assets/img/useitems/" + (PlayerManager.consumables.mackerel ? 68 : 61) + ".png");
			$(".count_medals").text( PlayerManager.consumables.medals || 0 )
				.prev().attr("title", KC3Meta.useItemName(57) );
			$(".count_reinforcement").text( PlayerManager.consumables.reinforceExpansion || 0 )
				.prev().attr("title", KC3Meta.useItemName(64) );
			$(".count_blueprints").text( PlayerManager.consumables.blueprints || 0 )
				.prev().attr("title", KC3Meta.useItemName(58) );
			$(".count_fairy").text( PlayerManager.consumables.furnitureFairy || 0 )
				.prev().attr("title", KC3Meta.useItemName(52) );
			$(".count_morale").text( (PlayerManager.consumables.mamiya || 0)
				+ (PlayerManager.consumables.irako || 0) )
				.prev().attr("title", "{0}x {1} + {2}x {3}"
					.format(PlayerManager.consumables.mamiya || 0, KC3Meta.useItemName(54), 
						PlayerManager.consumables.irako || 0, KC3Meta.useItemName(59)) );
			$(".consumables .consumable").hide();
			$(".consumables .consumable.page{0}".format(ConfigManager.hqInfoPage||1)).show();
		},

		ShipSlots: function(data){
			$(".activity_basic .consumables").hideChildrenTooltips();
			var shipCount = KC3ShipManager.count();
			var lockedShipCount = KC3ShipManager.count( function() {
				return this.lock;
			});

			$(".count_ships")
				.text( shipCount )
				.toggleClass( "danger", (KC3ShipManager.max - shipCount) < 5)
				.attr("title", "\u2764 " + lockedShipCount)
				.lazyInitTooltip();

			$(".max_ships").text( "/"+ KC3ShipManager.max );
		},

		GearSlots: function(data){
			$(".activity_basic .consumables").hideChildrenTooltips();
			var gearCount = KC3GearManager.count();
			var lockedGearCount = KC3GearManager.count( function() {
				return this.lock;
			});

			$(".count_gear")
				.text( gearCount )
				.toggleClass("danger", (KC3GearManager.max - gearCount) < 20)
				.attr("title", "\u2764 " + lockedGearCount)
				.lazyInitTooltip();

			$(".max_gear").text( "/"+ KC3GearManager.max );
		},

		Timers: function(data){
			$(".activity_basic .expeditions").hideChildrenTooltips();
			$(".activity_basic .timers").hideChildrenTooltips();

			// Expedition numbers
			KC3TimerManager._exped[0].expnum();
			KC3TimerManager._exped[1].expnum();
			KC3TimerManager._exped[2].expnum();

			// Repair faces
			KC3TimerManager._repair[0].face();
			KC3TimerManager._repair[1].face();
			KC3TimerManager._repair[2].face(undefined, PlayerManager.repairSlots < 3);
			KC3TimerManager._repair[3].face(undefined, PlayerManager.repairSlots < 4);

			// Construction faces
			if(ConfigManager.info_face){
				KC3TimerManager._build[0].face();
				KC3TimerManager._build[1].face();
				KC3TimerManager._build[2].face(undefined, PlayerManager.buildSlots < 3);
				KC3TimerManager._build[3].face(undefined, PlayerManager.buildSlots < 4);
			}

			$(".activity_basic .expeditions").createChildrenTooltips();
			$(".activity_basic .timers").createChildrenTooltips();
		},

		/* QUESTS
		Triggered when quest list is updated
		---------------------------------------------*/
		Quests: function(data){
			KC3QuestManager.load();
			var questType, questBox;
			var toggleQuestFunc = function(){
				var quest = KC3QuestManager.get($(this).data("id"));
				if(quest.isSelected()){
					quest.toggleCompletion();
					$(this).parent().addClass("complete");
				} else if(quest.isCompleted()){
					quest.toggleCompletion();
					$(this).parent().removeClass("complete");
				}
			};
			$(".module.quests").empty();
			$.each(KC3QuestManager.getActives(), function(index, quest){
				questBox = $("#factory .quest").clone().appendTo(".module.quests");
				if(!quest.tracking){ questBox.addClass("untracked"); }
				$(".quest_color", questBox).css("background", quest.getColor() )
					.addClass("hover")
					.attr("title", KC3Meta.term("PanelToggleQuestComplete") )
					.data("id", quest.id)
					.click(toggleQuestFunc);
				if(quest.isComplete()){
					questBox.addClass("complete");
				}
				if(quest.meta){
					$(".quest_text", questBox).text(quest.meta().name)
						.attr("titlealt", KC3QuestManager
							.buildHtmlTooltip(quest.id, quest.meta(), false, false))
						.lazyInitTooltip();
				} else {
					$(".quest_text", questBox).text(KC3Meta.term("UntranslatedQuest"))
						.attr("titlealt", KC3Meta.term("UntranslatedQuest"))
						.lazyInitTooltip();
				}
				$(".quest_track", questBox).text(quest.outputShort())
					.attr("title", quest.outputShort(true))
					.lazyInitTooltip();
			});
		},

		/* FLEET
		Triggered when fleet data is changed
		---------------------------------------------*/
		Fleet: function(data){
			// Auto-Switch Fleet View
			if (typeof data != "undefined") {
				if (typeof data.switchTo != "undefined") {
					if(attemptToSwitchFleet(data.switchTo)) {
						return false;
					}
				}
			}

			// Expedition Timer Faces
			if(KC3TimerManager._exped.length > 0){
				$(".activity_basic .expeditions").hideChildrenTooltips();
				KC3TimerManager._exped[0].faceId = PlayerManager.fleets[1].ship(0).masterId;
				KC3TimerManager._exped[1].faceId = PlayerManager.fleets[2].ship(0).masterId;
				KC3TimerManager._exped[2].faceId = PlayerManager.fleets[3].ship(0).masterId;
				KC3TimerManager._exped[0].face(undefined, PlayerManager.fleetCount < 2);
				KC3TimerManager._exped[1].face(undefined, PlayerManager.fleetCount < 3);
				KC3TimerManager._exped[2].face(undefined, PlayerManager.fleetCount < 4);
				$(".activity_basic .expeditions").createChildrenTooltips();
			}

			// TAIHA ALERT CHECK
			// if not PvP and Taiha alert setting is enabled
			if(ConfigManager.alert_taiha && !KC3SortieManager.isPvP() &&
				PlayerManager.fleets.filter((obj, i) => {
						const cf = PlayerManager.combinedFleet,   // Marks combined flag
							fs = KC3SortieManager.fleetSent,      // Which fleet that requires to focus out
							so = KC3SortieManager.isOnSortie();   // Is it on sortie or not? if not, focus all fleets.
						return !so || ((cf && fs === 1) ? i <= 1 : i == fs - 1);
					})
					.map    ((fleetObj) => fleetObj.ships.slice(1))    // Convert to non-flagship ID arrays
					.reduce ((acc, arr) => acc.concat(arr))            // Join IDs into an array
					.filter ((shipId)   => shipId > 0)                 // Remove ID -1
					.map    ((shipId)   => KC3ShipManager.get(shipId)) // Convert to Ship instance
					.some   ((shipObj)  => { // Check if any ship is Taiha, not flee, no damecon found
						return !shipObj.didFlee && shipObj.isTaiha()
							&& (!ConfigManager.alert_taiha_damecon || shipObj.findDameCon().pos < 0);
					})
				// if not disabled at Home Port
				&& (KC3SortieManager.isOnSortie() || !ConfigManager.alert_taiha_homeport)
			) {
				if(ConfigManager.alert_taiha_panel){
					$("#critical").show();
					if(critAnim){ clearInterval(critAnim); }
					if(!ConfigManager.alert_taiha_noanim){
						critAnim = setInterval(function() {
							$("#critical").toggleClass("anim2");
						}, 500);
					} else {
						$("#critical").addClass("anim2");
					}
				}

				if(ConfigManager.alert_taiha_sound){
					critSound.play();
				}

				(new RMsg("service", "taihaAlertStart", {
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
			} else {
				if(critAnim){ clearInterval(critAnim); }
				$("#critical").hide();
				critSound.pause();

				(new RMsg("service", "taihaAlertStop", {
					tabId: chrome.devtools.inspectedWindow.tabId
				})).execute();
			}

			// Close opened tooltips to avoid buggy double popup
			$(".module.status").hideChildrenTooltips();

			// FLEET BUTTONS RESUPPLY STATUSES
			$(".module.controls .fleet_num").each(function(i, element){
				$(element).removeClass("onExped needsSupply hasTaiha");
				if(!$(element).hasClass("active")){
					if(PlayerManager.fleets[i].isOnExped()){
						$(element).addClass("onExped");
					}
					if(!PlayerManager.fleets[i].isSupplied()){
						$(element).addClass("needsSupply");
					}
					if(PlayerManager.fleets[i].hasTaiha()){
						$(element).addClass("hasTaiha");
					}
				}
			});

			// LBAS button resupply indicator and statuses
			this.LbasStatus();

			// whether this update is triggered because of sending expeditions
			if (expeditionStarted && ConfigManager.info_auto_exped_tab) {
				// clear flag
				expeditionStarted = false;

				// we'll try switching to the next available fleet if any
				ExpedTabAutoFleetSwitch(false);
			}

			// If LBAS is selected, do not respond to rest fleet update
			if (selectedFleet == 6){
				return false;
			}

			NatsuiroListeners.UpdateExpeditionPlanner();
			var FleetSummary, MainRepairs;
			$(".shiplist_single").empty();
			$(".shiplist_single").hide();
			$(".shiplist_combined_fleet").empty();
			$(".shiplist_combined").hide();
			$(".airbase_list").empty();
			$(".airbase_list").hide();

			var thisNode = KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP() ?
				KC3SortieManager.currentNode() : {};
			var dameConConsumed = false;
			var flarePos = thisNode.flarePos || 0;

			// COMBINED
			if(selectedFleet == 5){
				var MainFleet = PlayerManager.fleets[0];
				var EscortFleet = PlayerManager.fleets[1];

				// Show ships on main fleet
				$.each(MainFleet.ships, function(index, rosterId){
					if(rosterId > 0){
						if(KC3SortieManager.isOnSortie() && KC3SortieManager.fleetSent == 1){
							dameConConsumed = (thisNode.dameConConsumed || [])[index];
						}
						var starShellUsed = (flarePos == index+1) &&
							!PlayerManager.combinedFleet && KC3SortieManager.fleetSent == 1;
						(new KC3NatsuiroShipbox(".sship", rosterId, showCombinedFleetBars, dameConConsumed, starShellUsed))
							.commonElements()
							.defineShort( MainFleet )
							.appendTo(".module.fleet .shiplist_main");
					}
				});

				// Show ships on escort fleet
				$.each(EscortFleet.ships, function(index, rosterId){
					if(rosterId > 0){
						if(KC3SortieManager.isOnSortie()){
							if(!!PlayerManager.combinedFleet && KC3SortieManager.fleetSent == 1){
								// Send combined fleet, get escort info
								dameConConsumed = (thisNode.dameConConsumedEscort || [])[index];
							} else if(!PlayerManager.combinedFleet && KC3SortieManager.fleetSent == 2){
								// Not combined, but send fleet #2, get regular info
								dameConConsumed = (thisNode.dameConConsumed || [])[index];
							}
						}
						var starShellUsed = (flarePos == index+1) &&
							((!!PlayerManager.combinedFleet && KC3SortieManager.fleetSent == 1) ||
							(!PlayerManager.combinedFleet && KC3SortieManager.fleetSent == 2));
						(new KC3NatsuiroShipbox(".sship", rosterId, showCombinedFleetBars, dameConConsumed, starShellUsed))
							.commonElements(true)
							.defineShort( EscortFleet )
							.appendTo(".module.fleet .shiplist_escort");
					}
				});

				// Show fleet containers on UI
				$(".shiplist_combined").show();

				// Calculate Highest Repair Times for status indicators
				MainRepairs = MainFleet.highestRepairTimes(true);
				var EscortRepairs = EscortFleet.highestRepairTimes(true);

				// Update "fastFleet" marker
				MainFleet.speed();
				EscortFleet.speed();

				// Compile fleet attributes
				FleetSummary = {
					lv: MainFleet.totalLevel() + EscortFleet.totalLevel(),
					elos: Math.qckInt("floor", MainFleet.eLoS()+EscortFleet.eLoS(), 1),
					air: KC3Calc.getFleetsFighterPowerText(MainFleet, EscortFleet, true),
					antiAir: Math.floor(AntiAir.fleetCombinedAdjustedAntiAir(
						MainFleet, EscortFleet,
						AntiAir.getFormationModifiers(ConfigManager.aaFormation))),
					speed:
						KC3Meta.shipSpeed(Math.min(MainFleet.minSpeed, EscortFleet.minSpeed)),
					docking:
						Math.max(MainRepairs.docking,EscortRepairs.docking),
					akashi:
						Math.max(MainRepairs.akashi,EscortRepairs.akashi),
					hasTaiha: MainFleet.hasTaiha() || EscortFleet.hasTaiha(),
					taihaIndexes: MainFleet.getTaihas().concat( EscortFleet.getTaihas() ),
					supplied: MainFleet.isSupplied() && EscortFleet.isSupplied(),
					supplyCost: Object.sumValuesByKey(
							MainFleet.calcResupplyCost(),
							EscortFleet.calcResupplyCost()
						),
					battleCost: Object.sumValuesByKey(
							MainFleet.calcBattleCost(),
							EscortFleet.calcBattleCost()
						),
					badState: [
						MainFleet.needsSupply(false)|| EscortFleet.needsSupply(false),
						MainFleet.needsSupply(true) || EscortFleet.needsSupply(true) ,
						MainFleet.ship(0).isTaiha() || EscortFleet.ship(0).isTaiha(),
						MainFleet.ship(0).isStriped() || EscortFleet.ship(0).isStriped()
					],
					lowestMorale:
						(MainFleet.lowestMorale() < EscortFleet.lowestMorale())
						? MainFleet.lowestMorale() : EscortFleet.lowestMorale(),
					supportPower: 0,
					supportCost: {},
					tpValueSum: MainFleet.calcTpObtain(MainFleet, EscortFleet)
				};

			// SINGLE
			}else{
				var CurrentFleet = PlayerManager.fleets[selectedFleet-1];
				$(".module.controls .fleet_num.active").attr("title", CurrentFleet.name || "");

				// Calculate Highest Repair Times for status indicators
				MainRepairs = CurrentFleet.highestRepairTimes(true);

				// Show ships on selected fleet
				let isSelectedSortiedFleet = (selectedFleet == KC3SortieManager.fleetSent);
				let isSelected2ndFleetOnCombined = (selectedFleet == 2 && KC3SortieManager.fleetSent == 1 && !!PlayerManager.combinedFleet);
				$.each(CurrentFleet.ships, function(index, rosterId){
					if(rosterId > 0){
						if(KC3SortieManager.isOnSortie()){
							if(isSelectedSortiedFleet){
								dameConConsumed = (thisNode.dameConConsumed || [])[index];
							} else if(isSelected2ndFleetOnCombined){
								// Send combined fleet, select and get escort info
								dameConConsumed = (thisNode.dameConConsumedEscort || [])[index];
							}
						}
						var starShellUsed = (flarePos == index+1) &&
							(isSelectedSortiedFleet || isSelected2ndFleetOnCombined);
						(new KC3NatsuiroShipbox(".lship", rosterId, showCombinedFleetBars, dameConConsumed, starShellUsed))
							.commonElements()
							.defineLong( CurrentFleet )
							.toggleClass("seven", CurrentFleet.countShips() >= 7)
							.appendTo(".module.fleet .shiplist_single");
					}
				});

				// Show fleet containers on UI
				$(".shiplist_single").show();
				
				// Compile fleet attributes
				FleetSummary = {
					lv: CurrentFleet.totalLevel(),
					baseExp: CurrentFleet.estimatePvpBaseExp(),
					elos: Math.qckInt("floor", CurrentFleet.eLoS(), 1),
					air: KC3Calc.getFleetsFighterPowerText(CurrentFleet),
					antiAir: CurrentFleet.adjustedAntiAir(ConfigManager.aaFormation),
					speed: CurrentFleet.speed(),
					docking: MainRepairs.docking,
					akashi: MainRepairs.akashi,
					hasTaiha: CurrentFleet.hasTaiha(),
					taihaIndexes: CurrentFleet.getTaihas(),
					supplied: CurrentFleet.isSupplied(),
					supplyCost: CurrentFleet.calcResupplyCost(),
					battleCost: CurrentFleet.calcBattleCost(),
					badState: [
						CurrentFleet.needsSupply(false) ||
						(
							!(KC3SortieManager.isOnSortie() && KC3SortieManager.fleetSent == selectedFleet) &&
							!CurrentFleet.isSupplied() &&
							ConfigManager.alert_supply_exped &&
							selectedFleet > (1+(!!PlayerManager.combinedFleet)) && selectedFleet < 5
						),//0
						CurrentFleet.needsSupply(true),//1
						CurrentFleet.ship(0).isTaiha(),//2
						false//3
					],
					lowestMorale: CurrentFleet.lowestMorale(),
					supportPower: CurrentFleet.supportPower(),
					supportCost: CurrentFleet.calcSupportExpeditionCost(),
					tpValueSum: CurrentFleet.calcTpObtain()
				};

			}

			console.debug("Current fleet summary", FleetSummary);
			// Fleet Summary Stats
			$(".module.summary").hideChildrenTooltips();
			$(".summary-level .summary_text").text( FleetSummary.lv )
				.attr("title", (fleetNum => {
					switch(fleetNum) {
						case 1: return KC3Meta.term("FirstFleetLevelTip")
							.format(FleetSummary.baseExp.base, FleetSummary.baseExp.s);
						case 2:
						case 3:
						case 4:
							const fstats = PlayerManager.fleets[fleetNum - 1].totalStats(true);
							return "{0}: {3}\n{1}: {4}\n{2}: {5}".format(
								KC3Meta.term("ExpedTotalAa"),
								KC3Meta.term("ExpedTotalAsw"),
								KC3Meta.term("ExpedTotalLos"),
								fstats.aa, fstats.as, fstats.ls
							);
						default: return "";
					}
				})(selectedFleet)).lazyInitTooltip();
			$(".summary-eqlos .summary_icon img").attr("src",
				"../../../../assets/img/stats/los" + ConfigManager.elosFormula + ".png");
			$(".summary-eqlos .summary_text").text( FleetSummary.elos );
			const isCombinedAirView = selectedFleet === 5 && ConfigManager.air_combined;
			$(".summary-airfp .summary_sub").toggle( isCombinedAirView );
			$(".summary-airfp .summary_text").text( FleetSummary.air )
				.attr("titlealt", KC3Calc.buildFleetsAirstrikePowerText(
					PlayerManager.fleets[selectedFleet-1], undefined, selectedFleet === 5
				) + KC3Calc.buildFleetsContactChanceText(
					PlayerManager.fleets[selectedFleet-1], undefined, selectedFleet === 5,
					isCombinedAirView ? 6 : 4
				)).lazyInitTooltip();
			$(".summary-antiair .summary_icon img")
				.attr("src", KC3Meta.formationIcon(ConfigManager.aaFormation));
			$(".summary-antiair .summary_text").text( FleetSummary.antiAir )
				.parent().attr("title", KC3Meta.formationText(ConfigManager.aaFormation) )
				.lazyInitTooltip();
			$(".summary-speed .summary_text").text( FleetSummary.speed );
			if(ConfigManager.elosFormula === 4){
				// F33 different factors for now: 6-2(F,H)/6-3(H):x3, 3-5(G)/6-1(E,F):x4
				if(selectedFleet < 5){
					let f33x3 = Math.qckInt("floor", PlayerManager.fleets[selectedFleet-1].eLos4(3), 1);
					let f33x4 = Math.qckInt("floor", PlayerManager.fleets[selectedFleet-1].eLos4(4), 1);
					$(".summary-eqlos").attr("title",
						"x4={0} \t3-5(G>28), 6-1(E>16, F>36)\nx3={1} \t6-2(F<43/F>50, H>40), 6-3(H>38)"
						.format(f33x4, f33x3)
					).lazyInitTooltip();
				// No reference values for combined fleet yet, only show computed values
				} else if(selectedFleet === 5){
					let mainFleet = PlayerManager.fleets[0];
					let escortFleet = PlayerManager.fleets[1];
					let f33Cn = [
						Math.qckInt("floor", mainFleet.eLos4(2) + escortFleet.eLos4(2), 1),
						Math.qckInt("floor", mainFleet.eLos4(3) + escortFleet.eLos4(3), 1),
						Math.qckInt("floor", mainFleet.eLos4(4) + escortFleet.eLos4(4), 1),
						Math.qckInt("floor", mainFleet.eLos4(5) + escortFleet.eLos4(5), 1)
					];
					$(".summary-eqlos").attr("title",
						"x2={0}\nx3={1}\nx4={2}\nx5={3}".format(f33Cn)
					).lazyInitTooltip();
				}
			} else {
				$(".summary-eqlos").attr("title", "");
			}

			// Clear status reminder coloring
			$(".module.status .status_text").removeClass("good bad");
			$(".module.status").hideChildrenTooltips();

			// If fleet status summary is enabled on settings
			if(ConfigManager.info_fleetstat){
				// STATUS: RESUPPLY
				if( (FleetSummary.supplied ||
					(KC3SortieManager.isOnSortie() &&
						KC3SortieManager.isFullySupplied() &&
						(KC3SortieManager.fleetSent == (PlayerManager.combinedFleet ? 1 : selectedFleet)))) &&
					(!FleetSummary.badState[0])
				){
					$(".module.status .status_supply .status_text").text( KC3Meta.term("PanelSupplied") );
					$(".module.status .status_supply img").attr("src", "../../../../assets/img/ui/check.png");
					$(".module.status .status_supply .status_text").addClass("good");
				}else{
					$(".module.status .status_supply .status_text").text(KC3Meta.term(
						FleetSummary.badState[1] ? "PanelEmptySupply" :
							(FleetSummary.badState[0] ? "PanelUnderSupplied" : "PanelNotSupplied")
						));
					$(".module.status .status_supply img").attr("src", "../../../../assets/img/ui/sunk.png");
					$(".module.status .status_supply .status_text").addClass("bad");
				}
				$(".module.status .status_supply").attr("title",
					KC3Meta.term("PanelResupplyCosts").format(
						FleetSummary.supplyCost.fuel, FleetSummary.supplyCost.ammo, FleetSummary.supplyCost.bauxite,
						FleetSummary.supplyCost.hasMarried ? KC3Meta.term("PanelResupplyMarriedHint") : ""
					) + ("\n" + KC3Meta.term("PanelBattleConsumes").format(
						FleetSummary.battleCost.fuel, FleetSummary.battleCost.dayOnlyAmmo, FleetSummary.battleCost.nightBattleAmmo,
						FleetSummary.battleCost.airRaidFuel, FleetSummary.battleCost.airRaidAmmo
					)) + (!FleetSummary.supplyCost.steel ? "" :
						"\n" + KC3Meta.term("PanelConsumedSteel").format(FleetSummary.supplyCost.steel))
				).lazyInitTooltip();

				// STATUS: MORALE
				if( FleetSummary.lowestMorale > 52 ){
					$(".module.status .status_morale .status_text").text( KC3Meta.term("PanelGreatMorale") );
					$(".module.status .status_morale .status_text").addClass("good");
					moraleClockValue = 100;
					moraleClockEnd = 0;
				}else if( FleetSummary.lowestMorale >= ConfigManager.alert_morale_value ){
					$(".module.status .status_morale .status_text").text( KC3Meta.term("PanelGoodMorale") );
					$(".module.status .status_morale .status_text").addClass("good");
					moraleClockValue = 100;
					moraleClockEnd = 0;
				}else{
					var MissingMorale = ConfigManager.alert_morale_value - FleetSummary.lowestMorale;
					var MoraleTime = Math.hrdInt('ceil',MissingMorale,LOG3)*60;
					$(".module.status .status_morale .status_text").addClass("bad");

					if(FleetSummary.lowestMorale != moraleClockValue){
						// console.debug("New morale time", FleetSummary.lowestMorale, MoraleTime);
						moraleClockValue = FleetSummary.lowestMorale;
						moraleClockEnd = Math.round(Math.hrdInt('floor',Kcsapi.moraleRefresh/180,3)*180) + (MoraleTime*1000) + (30000 - Kcsapi.serverOffset);

						moraleClockEnd = (moraleClockEnd >= Date.now()) && moraleClockEnd;
					}

				}

				// STATUS: MORALE ICON (independent from notification status)
				$(".module.status .status_morale img").attr("src", "../../../../assets/img/client/morale/" +
					KC3Ship.moraleIcon(FleetSummary.lowestMorale) + ".png");

				// STATUS: TAIHA
				if( (FleetSummary.hasTaiha || FleetSummary.badState[2])
					&& !(selectedFleet==5 && 
						(FleetSummary.taihaIndexes.equals([0]) || 
						 FleetSummary.taihaIndexes.equals([0,0]))
					) // if not flagship only for combined fleet
					&& !KC3SortieManager.isPvP() // if PvP, no taiha alert
				){
					$(".module.status .status_repair .status_text").text( KC3Meta.term(
						(FleetSummary.badState[2] ? "PanelFSTaiha" : "PanelHasTaiha")
					) );
					$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/" +
						(FleetSummary.badState[2] ? "estat_bossheavy.png" : "sunk.png")
					);
					$(".module.status .status_repair .status_text").attr("title", "");
					$(".module.status .status_repair .status_text").addClass("bad");
				// Flagship Chuuha or worse for Combined Fleet only
				}else if (FleetSummary.badState[3]) {
					$(".module.status .status_repair .status_text").text( KC3Meta.term("PanelCombinedFSChuuha") );
					$(".module.status .status_repair .status_text").attr("title", KC3Meta.term("PanelCombinedFSChuuhaTip"));
					$(".module.status .status_repair .status_text").addClass("bad");
					$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/" +
						(FleetSummary.badState[2] ? "estat_bossheavy.png" : "estat_bossmodrt.png")
					);
				// Condition Green
				}else{
					$(".module.status .status_repair .status_text").text( KC3Meta.term("PanelNoTaiha") );
					$(".module.status .status_repair img").attr("src", "../../../../assets/img/ui/check.png");
					$(".module.status .status_repair .status_text").attr("title", "");
					$(".module.status .status_repair .status_text").addClass("good");
				}

				// STATUS: COMBINED
				if(selectedFleet==1 || selectedFleet==5){
					$(".module.status .status_butai .status_text").attr("title", "");
					switch(Number(PlayerManager.combinedFleet)){
						case 1:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedCarrier") );
							break;
						case 2:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedSurface") );
							break;
						case 3:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedTransport") );
							break;
						default:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedNone") );
							break;
					}
					$(".module.status .status_butai .status_text").attr("title",
						KC3Meta.term("PanelTransportPoints").format(
							isNaN(FleetSummary.tpValueSum)? "?" : Math.floor(0.7 * FleetSummary.tpValueSum),
							isNaN(FleetSummary.tpValueSum)? "?" : FleetSummary.tpValueSum
						)
					).lazyInitTooltip();
					$(".module.status .status_butai").show();
					$(".module.status .status_support").hide();
				}else{
					// STATUS: SUPPORT
					$(".module.status .status_support .status_text").text( FleetSummary.supportPower );
					$(".module.status .status_support .status_text").attr("title",
						KC3Meta.term("PanelTransportPoints").format(
							isNaN(FleetSummary.tpValueSum)? "?" : Math.floor(0.7 * FleetSummary.tpValueSum),
							isNaN(FleetSummary.tpValueSum)? "?" : FleetSummary.tpValueSum
						)
						+ "\n" +
						KC3Meta.term("PanelSupportExpCosts").format(
							KC3Meta.support(FleetSummary.supportCost.supportFlag) || KC3Meta.term("None"),
							FleetSummary.supportCost.fuel || "?",
							FleetSummary.supportCost.ammo || "?"
						)
					).lazyInitTooltip();
					$(".module.status .status_butai").hide();
					$(".module.status .status_support").show();
				}

				// STATUS: REPAIRS
				UpdateRepairTimerDisplays(FleetSummary.docking, FleetSummary.akashi);
				$(".module.status .status_docking .status_icon").attr("title", KC3Meta.term("PanelHighestDocking") );
				$(".module.status .status_akashi .status_icon").attr("title", KC3Meta.term("PanelHighestAkashi") );
				$(".module.status .status_support .status_icon").attr("title", KC3Meta.term("PanelSupportPower") );
			}else{
				$(".module.status").hide();
			}

		},
		
		Lbas: function(){
			const self = this;
			this.LbasStatus();
			if (selectedFleet == 6) {
				$(".shiplist_single").empty();
				$(".shiplist_single").hide();
				$(".shiplist_combined_fleet").empty();
				$(".shiplist_combined").hide();
				$(".airbase_list").empty();
				$(".airbase_list").show();
				
				var baseBox, planeBox, itemObj, myServerHost;
				const togglePlaneName = function(e){
					$(".module.fleet .airbase_list .base_plane_name").toggle();
					$(".module.fleet .airbase_list .name_toggle_group").toggle();
				};
				
				$.each(PlayerManager.bases, function(i, baseInfo){
					if (baseInfo.rid != -1) {
						console.debug("LandBase", i, baseInfo);
						baseBox = $("#factory .airbase").clone();
						$(".base_map", baseBox).text(baseInfo.map);
						$(".base_name", baseBox).text(baseInfo.name);
						$(".base_range .base_stat_value", baseBox).text(baseInfo.range);
						$(".base_action", baseBox).html([
							KC3Meta.term("LandBaseActionWaiting"),
							KC3Meta.term("LandBaseActionSortie"),
							KC3Meta.term("LandBaseActionDefend"),
							KC3Meta.term("LandBaseActionRetreat"),
							KC3Meta.term("LandBaseActionRest")
						][baseInfo.action]);
						
						const shipObj = new KC3Ship();
						// simulate 1 land-base as a carrier, ensure it's not a dummy ship
						shipObj.rosterId = 1;
						shipObj.masterId = 83;
						shipObj.items = baseInfo.planes.map(function(planeInfo){
							return planeInfo.api_state == 1 ? planeInfo.api_slotid : -1;
						});
						shipObj.slots = baseInfo.planes.map(function(planeInfo){
							return planeInfo.api_state == 1 ? planeInfo.api_count : 0;
						});
						
						// Regular fighter power on sortie, LBAS counts recon planes too
						const [afpLower, afpHigher] = shipObj.fighterBounds(true);
						$(".base_afp .base_stat_value", baseBox).text(
							!!afpLower ? afpLower + "~" + afpHigher : KC3Meta.term("None")
						);
						// Land-base interception power on air defense, ofc recon planes in
						const ifp = shipObj.interceptionPower();
						$(".base_ifp .base_stat_value", baseBox).text(
							!!ifp ? "\u2248" + ifp : KC3Meta.term("None")
						);
						
						$(".airbase_infos", baseBox).on("click", togglePlaneName);
						
						$.each(baseInfo.planes, function(i, planeInfo){
							planeBox = $("#factory .airbase_plane").clone();
							
							if (planeInfo.api_state !== 0) {
								//console.debug("PLANE", i, planeInfo);
								
								itemObj = KC3GearManager.get(planeInfo.api_slotid);
								if(itemObj.isDummy()) {
									$("div", planeBox).remove();
									return;
								}
								
								$(".base_plane_name", planeBox).text(itemObj.name())
									.attr("title", itemObj.name()).lazyInitTooltip();
								
								const paddedId = (itemObj.masterId<10?"00":itemObj.masterId<100?"0":"") + itemObj.masterId;
								let eqImgSrc = "/assets/img/planes/" + paddedId + ".png";
								// show local plane image first
								$(".base_plane_img img", planeBox).attr("alt", paddedId)
									.attr("src", eqImgSrc).error(function() {
										if(!myServerHost) { // reuse host after lazy initialized
											myServerHost = (new KC3Server()).setNum(PlayerManager.hq.server).ip;
											myServerHost = myServerHost ? "http://" + myServerHost : "..";
										}
										// fall-back to fetch image from online kcs resources
										eqImgSrc = myServerHost + "/kcs/resources/image/slotitem/item_up/"
											+ $(this).attr("alt") + ".png";
										$(this).off("error").attr("src", eqImgSrc)
											// fail-safe to show a placeholder icon
											.error(function() {
												eqImgSrc = "/assets/img/ui/empty.png";
												$(this).off("error").attr("src", eqImgSrc);
											});
									});
								$(".base_plane_img", planeBox)
									.attr("title", itemObj.name())
									.lazyInitTooltip()
									.data("masterId", itemObj.masterId)
									.on("dblclick", self.gearDoubleClickFunction);
								
								const eqIconSrc = "/assets/img/items/"+itemObj.master().api_type[3]+".png";
								$(".base_plane_icon img", planeBox).attr("src", eqIconSrc)
									.error(function() { $(this).off("error").attr("src", "/assets/img/ui/empty.png"); });
								$(".base_plane_icon", planeBox)
									.attr("titlealt", itemObj.htmlTooltip(planeInfo.api_count, baseInfo))
									.lazyInitTooltip()
									.data("masterId", itemObj.masterId)
									.on("dblclick", self.gearDoubleClickFunction);
								
								if (itemObj.stars > 0) {
									$(".base_plane_star", planeBox).text(itemObj.stars);
									$(".base_plane_star", planeBox).show();
								}
								
								if (itemObj.ace > -1) {
									const eqChevSrc = "/assets/img/client/achev/"+itemObj.ace+".png";
									$(".base_plane_chevs img", planeBox).attr("src", eqChevSrc);
								} else {
									$(".base_plane_chevs img", planeBox).remove();
								}
								
								if (planeInfo.api_state == 1) {
									// Plane on standby, no detail morale value in API, only condition [1, 3]
									const eqMorale = ["","3","2","1"][planeInfo.api_cond] || "3";
									const eqCondSrc = "/assets/img/client/morale/"+eqMorale+".png";
									$(".base_plane_count", planeBox).text(planeInfo.api_count+" / "+planeInfo.api_max_count);
									$(".base_plane_cond img", planeBox).attr("src", eqCondSrc);
									
									if (planeInfo.api_count < planeInfo.api_max_count) {
										let cost = baseInfo.calcResupplyCost();
										$(".base_plane_count", planeBox).addClass("unsupplied");
										$(".base_plane_count", planeBox).attr("title",
											KC3Meta.term("PanelResupplyCosts").format(
												cost.fuel, cost.ammo, cost.bauxite, ""
											)
										).lazyInitTooltip();
									} else {
										$(".base_plane_count", planeBox).removeClass("unsupplied");
										$(".base_plane_count", planeBox).attr("title", "");
									}
									
								} else if (planeInfo.api_state == 2) {
									// Plane moving
									planeBox.addClass("moving");
									$(".base_plane_count", planeBox).text("");
									$(".base_plane_cond img", planeBox).remove();
								}
							} else {
								// No plane on slot
								$("div", planeBox).remove();
							}
							
							$(".base_planes", baseBox).append(planeBox);
						});
						
						$(".module.fleet .airbase_list").append(baseBox);
					}
				});
			}
		},

		LbasStatus: function(){
			const lbasIsSupplied = KC3Calc.isLandBasesSupplied(),
				lbasWorstCond = KC3Calc.getLandBasesWorstCond(),
				lbasCondBad = lbasWorstCond > 1;
			// Update LBAS button for resupply/morale indicator
			const lbasViewButton = $(".module.controls .fleet_lbas");
			lbasViewButton.removeClass("needsSupply badMorale");
			if (!lbasViewButton.hasClass("active")) {
				lbasViewButton.toggleClass("badMorale", lbasCondBad);
				lbasViewButton.toggleClass("needsSupply", !lbasIsSupplied);
			}
			if (selectedFleet == 6) {
				// Update statuses about resupply and condition
				$(".module.status").hideChildrenTooltips();
				$(".module.status .status_supply .status_text").text(KC3Meta.term(
					lbasIsSupplied ? "PanelSupplied" : "PanelNotSupplied"
				)).toggleClass("good", lbasIsSupplied).toggleClass("bad", !lbasIsSupplied);
				$(".module.status .status_supply img").attr("src",
					"/assets/img/ui/" + (lbasIsSupplied ? "check.png" : "sunk.png"));
				const lbasSupplyCost = KC3Calc.getLandBasesResupplyCost();
				const lbasSortieCost = KC3Calc.getLandBasesSortieCost();
				$(".module.status .status_supply").attr("title",
					KC3Meta.term("PanelResupplyCosts").format(
						lbasSupplyCost.fuel, lbasSupplyCost.ammo, lbasSupplyCost.bauxite, ""
					) + "\n" +
					KC3Meta.term("PanelLbasSortieCosts").format(
						lbasSortieCost.fuel, lbasSortieCost.ammo
					) + (!lbasSortieCost.steel ? "" :
						"\n" + KC3Meta.term("PanelConsumedSteel").format(lbasSortieCost.steel))
				).lazyInitTooltip();
				$(".module.status .status_morale img").attr("src",
					"/assets/img/client/morale/" + (["","3","2","1"][lbasWorstCond]) + ".png");
				$(".module.status .status_morale .status_text")
					.text(KC3Meta.term(lbasCondBad ? "PanelLbasCondBad" : "PanelGoodMorale"))
					.toggleClass("bad", lbasCondBad).toggleClass("good", !lbasCondBad);
				// no morale timer
				moraleClockValue = 100;
				moraleClockEnd = 0;
				// clean repair status and timer, might show plane moving timer
				$(".module.status .status_repair img").attr("src", "/assets/img/ui/check.png");
				$(".module.status .status_repair .status_text")
					.text( KC3Meta.term("Placeholder") )
					.attr("title", "")
					.removeClass("bad").addClass("good");
				UpdateRepairTimerDisplays(0, 0);
				// show 'combined fleet' type as 'LBAS'
				$(".module.status .status_butai .status_text")
					.text( KC3Meta.term("CombinedLbas") )
					.attr("title", "");
				$(".module.status .status_butai").show();
				$(".module.status .status_support").hide();
				// hide unused summary line
				$(".module.summary").hideChildrenTooltips();
				$(".module.summary").addClass("disabled");
			} else {
				$(".module.summary").removeClass("disabled");
			}
		},

		SortieStart: function(data){
			// Clear battle details box
			clearSortieData();

			// Show world map and difficulty
			$(".module.activity .map_world").text(
				(KC3SortieManager.map_world >= 10 ? 'E' : KC3SortieManager.map_world)
				+ "-" + KC3SortieManager.map_num
				+ ((KC3SortieManager.map_world >= 10)
					?["",
					  KC3Meta.term("EventRankEasyAbbr"),
					  KC3Meta.term("EventRankNormalAbbr"),
					  KC3Meta.term("EventRankHardAbbr")]
					[ KC3SortieManager.map_difficulty ]
					: "")
			);

			// Map Gauge and status
			updateMapGauge(null);

			// Switch to battle tab
			$(".module.activity .activity_battle").css("opacity", 1);
			$("#atab_battle").trigger("click");
		},

		CompassResult: function(data){
			var self = this;
			// Clear battle details box
			clearBattleData();

			// Exception unhandled if nodes are empty and current node is undefined for some reasons,
			// eg: panel reopened during sortie
			var numNodes = KC3SortieManager.countNodes();
			var thisNode = KC3SortieManager.currentNode();
			var world = KC3SortieManager.map_world;
			var map = KC3SortieManager.map_num;
			var diff = KC3SortieManager.map_difficulty;
			var nodeId = KC3Meta.nodeLetter(world, map, thisNode.id );

			$(".module.activity .sortie_node_"+numNodes).text( nodeId );

			$(".module.activity .node_types").hide();

			$(".module.activity .abyss_ship").hide();
			$(".module.activity .abyss_hp").hide();

			$(".module.activity .node_type_text").removeClass("dud");
			$(".module.activity .node_type_text").removeClass("select");

			// Swap fish and support icons
			$(".module.activity .battle_fish").hide();
			$(".module.activity .battle_support").show();

			//console.debug("Next node", thisNode);
			if(thisNode.isBoss()){
				$(".module.activity .sortie_nodes .boss_node .boss_circle").text(nodeId);
				$(".module.activity .sortie_nodes .boss_node").css("left", 20 * (numNodes-1));
				$(".module.activity .sortie_nodes .boss_node").show();
			}
			switch(thisNode.type){
				// Battle node
				case "battle":
					$(".module.activity .sortie_node_"+numNodes)
						.addClass("nc_battle")
						.addClass(thisNode.nodeExtraClass || "")
						.attr("title", thisNode.nodeDesc || "")
						.lazyInitTooltip();
					// Skip not only encounters disabled, but also all battle activity hidden
					if(!ConfigManager.info_prevencounters || !ConfigManager.info_compass)
						break;
					$(".module.activity .node_type_battle").hide();
					$(".module.activity .node_type_prev_encounters").show();
					const nodeEncBox = $(".module.activity .node_type_prev_encounters .encounters");
					nodeEncBox.text("...");
					KC3Database.con.encounters.filter(node =>
						node.world === world && node.map === map
						// Known issue: this edge ID filtering only gives encounters of edge's own,
						// if more than one edge leads to a same node,
						// encounters (both patterns & count) will be inaccurate for this node.
						&& node.node === thisNode.id && node.diff === diff
					).toArray(function(thisNodeEncounterList){
						if($(".module.activity .node_type_prev_encounters").is(":hidden"))
							return;
						nodeEncBox.empty();
						const sortedList = thisNodeEncounterList.sort((a, b) => b.count - a.count);
						$.each(sortedList, function(_, encounter){
							const shipList = JSON.parse(encounter.ke || null);
							let badEntry = ! (Array.isArray(shipList) && encounter.form > 0);
							// Don't show 'broken' encounters with incorrect data
							if(badEntry) return;
							const encBox = $("#factory .encounter_record").clone();
							$(".encounter_formation img", encBox).attr("src",
								KC3Meta.formationIcon(encounter.form));
							$.each(shipList, function(_, shipId){
								if(shipId > 0){
									if(!KC3Master.isAbyssalShip(shipId)){
										badEntry = true;
										return;
									}
									const shipBox = $("#factory .encounter_ship").clone();
									$(shipBox).removeClass(KC3Meta.abyssShipBorderClass());
									$(shipBox).addClass(KC3Meta.abyssShipBorderClass(shipId));
									$("img", shipBox).attr("src", KC3Meta.abyssIcon(shipId));
									$("img", shipBox).attr("alt", shipId);
									$("img", shipBox).data("masterId", shipId)
										.on("dblclick", self.shipDoubleClickFunction);
									$(shipBox).attr("title", "{0}: {1}"
										.format(shipId, KC3Meta.abyssShipName(shipId))
									).lazyInitTooltip();
									$(".encounter_ships", encBox).append(shipBox);
								}
							});
							// Don't show 'broken' encounters from pre-abyssal ID shift update
							if(badEntry) return;
							if(shipList.length > 6){
								$(".encounter_ships", encBox).addClass("combined");
							}
							let tooltip = "{0} x{1}".format(encounter.name || "???", encounter.count || 1);
							tooltip += "\n{0}".format(KC3Meta.formationText(encounter.form));
							const ap = KC3Calc.enemyFighterPower(shipList)[0];
							if(ap){
								tooltip += "\n" + KC3Meta.term("InferredFighterPower")
									.format(ap, Math.round(ap / 3), Math.round(2 * ap / 3),
										Math.round(3 * ap / 2), 3 * ap);
							}
							$(".encounter_formation", encBox).attr("title", tooltip).lazyInitTooltip();
							encBox.appendTo(nodeEncBox);
						});
					}).catch(err => {
						console.error("Loading node encounters failed", err);
						// Keep 3 dots as unknown
						nodeEncBox.text("...");
					});
					break;

				// Resource node
				case "resource":
					$(".module.activity .sortie_node_"+numNodes)
						.addClass("nc_resource")
						.addClass(thisNode.nodeExtraClass || "")
						.attr("title", thisNode.nodeDesc || "")
						.lazyInitTooltip();
					var resBoxDiv = $(".module.activity .node_type_resource");
					resBoxDiv.removeClass("node_type_maelstrom");
					$(".clone", resBoxDiv).remove();
					resBoxDiv.children().hide();
					$.each(thisNode.icon, function(i, icon){
						var iconDiv = $('<div class="node_res_icon clone"><img/></div>');
						var textDiv = $('<div class="node_res_text clone"></div>');
						resBoxDiv.append(iconDiv).append(textDiv);
						$("img", iconDiv).attr("src", icon("../../../../assets/img/client/"));
						textDiv.text( thisNode.amount[i] );
					});
					resBoxDiv.append($('<div class="clear clone"></div>'));
					resBoxDiv.show();
					break;

				// Bounty node on 1-6
				case "bounty":
					$(".module.activity .sortie_node_"+numNodes)
						.addClass("nc_resource")
						.addClass(thisNode.nodeExtraClass || "")
						.attr("title", thisNode.nodeDesc || "")
						.lazyInitTooltip();
					$(".module.activity .node_type_resource").removeClass("node_type_maelstrom");
					$(".module.activity .node_type_resource .clone").remove();
					$(".module.activity .node_type_resource .node_res_icon img").attr("src",
						thisNode.icon("../../../../assets/img/client/"));
					$(".module.activity .node_type_resource .node_res_text").text( thisNode.amount );
					$(".module.activity .node_type_resource").show().children().show();

					if(KC3SortieManager.getCurrentMapData().kind=='multiple') {
						updateMapGauge(true,true,true);
					}
					break;

				// Maelstrom node
				case "maelstrom":
					$(".module.activity .sortie_node_"+numNodes)
						.addClass("nc_maelstrom")
						.addClass(thisNode.nodeExtraClass || "")
						.attr("title", thisNode.nodeDesc || "")
						.lazyInitTooltip();
					$(".module.activity .node_type_resource").addClass("node_type_maelstrom");
					$(".module.activity .node_type_resource .clone").remove();
					$(".module.activity .node_type_resource .node_res_icon img").attr("src",
						thisNode.icon("../../../../assets/img/client/"));
					$(".module.activity .node_type_resource .node_res_text").text( -thisNode.amount );
					$(".module.activity .node_type_resource").show().children().show();
					break;

				// Selection node
				case "select":
					$(".module.activity .sortie_node_"+numNodes)
						.addClass("nc_select")
						.addClass(thisNode.nodeExtraClass || "")
						.attr("title", thisNode.nodeDesc || "")
						.lazyInitTooltip();
					$(".module.activity .node_type_text").text( KC3Meta.term("BattleSelect") +
						KC3Meta.term("BattleSelectNodes").format(thisNode.choices[0], thisNode.choices[1]));
					$(".module.activity .node_type_text").addClass("select");
					$(".module.activity .node_type_text").show();
					break;

				// Transport node
				case "transport":
					$(".module.activity .sortie_node_"+numNodes)
						.addClass("nc_resource")
						.addClass(thisNode.nodeExtraClass || "")
						.attr("title", thisNode.nodeDesc || "")
						.lazyInitTooltip();
					$(".module.activity .node_type_resource").removeClass("node_type_maelstrom");
					$(".module.activity .node_type_resource .clone").remove();
					$(".module.activity .node_type_resource .node_res_icon img").attr("src",
						"../../../../assets/img/items/25.png");
					var lowTPGain = isNaN(thisNode.amount) ? "?" : Math.floor(0.7 * thisNode.amount);
					var highTPGain = isNaN(thisNode.amount) ? "?" : thisNode.amount;
					$(".module.activity .node_type_resource .node_res_text").text( "{0} ~ {1} TP".format(lowTPGain, highTPGain) );
					$(".module.activity .node_type_resource").show().children().show();
					break;

				// Battle avoided node
				default:
					$(".module.activity .sortie_node_"+numNodes)
						.addClass("nc_avoid")
						.addClass(thisNode.nodeExtraClass || "")
						.attr("title", thisNode.nodeDesc || "")
						.lazyInitTooltip();
					$(".module.activity .node_type_text").text( KC3Meta.term("BattleAvoided") );
					$(".module.activity .node_type_text").addClass("dud");
					$(".module.activity .node_type_text").show();
					break;
			}

			// If compass setting disabled, hide node letters and all battle activities
			if(!ConfigManager.info_compass){
				$(".module.activity .node_types").hide();
				$(".module.activity .sortie_nodes .boss_node").hide();
				$(".module.activity .sortie_nodes .sortie_node").hide();
			} else {
				$(".module.activity .sortie_nodes .sortie_node").show();
			}
		},

		LandBaseAirRaid: function(data){
			var thisNode = KC3SortieManager.currentNode();
			var battleData = thisNode.battleDestruction;
			var self = this;
			if(!battleData) { return false; }
			var updateBattleActivityFunc = function(){
				clearBattleData();
				$(".module.activity .abyss_single").show();
				$(".module.activity .abyss_combined").hide();
				$(".module.activity .node_type_prev_encounters").hide();
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > 0 && $(".module.activity .abyss_single .abyss_ship_"+(index+1)).length > 0){
						$(".module.activity .abyss_single .abyss_ship_"+(index+1)).addClass(KC3Meta.abyssShipBorderClass(eshipId));
						$(".module.activity .abyss_single .abyss_ship_"+(index+1)+" img").attr("src", KC3Meta.abyssIcon(eshipId));
						$(".module.activity .abyss_single .abyss_ship_"+(index+1)+" img")
							.attr("titlealt", thisNode.buildEnemyStatsMessage(index, eshipId,
								thisNode.elevels[index],
								thisNode.beginHPs.enemy[index], thisNode.maxHPs.enemy[index],
								null, thisNode.eSlot[index], false))
							.lazyInitTooltip();
						$(".module.activity .abyss_single .abyss_ship_"+(index+1))
							.data("masterId", eshipId)
							.on("dblclick", self.shipDoubleClickFunction)
							.show();
					}
				});
				if((typeof thisNode.eformation != "undefined") && (thisNode.eformation > -1)){
					$(".module.activity .battle_eformation img").attr("src", KC3Meta.formationIcon(thisNode.eformation));
					$(".module.activity .battle_eformation").css("-webkit-transform", "rotate(-90deg)");
					$(".module.activity .battle_eformation").attr("title", KC3Meta.formationText(thisNode.eformation));
				}
				$(".module.activity .battle_detection").prev().text(KC3Meta.term("BattleAirDefend"));
				var airDefender = (!thisNode.fplaneFrom || thisNode.fplaneFrom[0] === -1) ?
					KC3Meta.term("BattleAirDefendNo") :
					KC3Meta.term("BattleAirDefendYes").format(thisNode.fplaneFrom.join(","));
				$(".module.activity .battle_detection").text(airDefender);
				$(".module.activity .battle_detection").attr("title", airDefender);
				$(".module.activity .battle_engagement").prev().text(KC3Meta.term("BattleAirBaseLoss"));
				$(".module.activity .battle_engagement").text(KC3Meta.airraiddamage(thisNode.lostKind));
				if(thisNode.lostKind == 4){
					$(".module.activity .battle_engagement").removeClass("bad");
					$(".module.activity .battle_engagement").attr("title", "");
				} else {
					$(".module.activity .battle_engagement").addClass("bad");
					// http://wikiwiki.jp/kancolle/?%B4%F0%C3%CF%B9%D2%B6%F5%C2%E2#airraid
					$(".module.activity .battle_engagement").attr("title", KC3Meta.term("BattleAirBaseLossTip")
						.format( thisNode.baseDamage, Math.round(thisNode.baseDamage * 0.9 + 0.1) )
					);
				}
				var contactSpan = buildContactPlaneSpan(thisNode.fcontactId, thisNode.fcontact, thisNode.econtactId, thisNode.econtact);
				$(".module.activity .battle_contact").html(contactSpan.html()).lazyInitTooltip();
				$(".module.activity .battle_airbattle").text( thisNode.airbattle[0] );
				$(".module.activity .battle_airbattle").addClass( thisNode.airbattle[1] );
				$(".module.activity .battle_airbattle")
					.attr("title", thisNode.buildAirPowerMessage())
					.lazyInitTooltip();
				$(".fighter_ally .plane_before").text(thisNode.planeFighters.player[0]);
				$(".fighter_enemy .plane_before").text(thisNode.planeFighters.abyssal[0]);
				$(".bomber_ally .plane_before").text(thisNode.planeBombers.player[0]);
				$(".bomber_enemy .plane_before").text(thisNode.planeBombers.abyssal[0]);
				if(thisNode.planeFighters.player[1] > 0){
					$(".fighter_ally .plane_after").text("-"+thisNode.planeFighters.player[1]);
				}
				if(thisNode.planeFighters.abyssal[1] > 0){
					$(".fighter_enemy .plane_after").text("-"+thisNode.planeFighters.abyssal[1]);
				}
				if(thisNode.planeBombers.player[1] > 0){
					$(".bomber_ally .plane_after").text("-"+thisNode.planeBombers.player[1]);
				}
				if(thisNode.planeBombers.abyssal[1] > 0){
					$(".bomber_enemy .plane_after").text("-"+thisNode.planeBombers.abyssal[1]);
				}
				$(".module.activity .battle_support").show();
				$(".module.activity .battle_fish").hide();
				$(".module.activity .node_type_battle").show();
			};
			// `info_compass` including 'Battle Data', so no activity if it's off
			if(ConfigManager.info_compass){
				// Have to wait seconds for game animate and see compass results
				setTimeout(updateBattleActivityFunc, 6500);
			}
		},

		BattleStart: function(data){
			var self = this;
			// Clear battle details box just to make sure
			clearBattleData();

			var thisNode = KC3SortieManager.currentNode();
			var battleData = (thisNode.startsFromNight)? thisNode.battleNight : thisNode.battleDay;
			var enemyFleetBox = thisNode.enemyCombined ? "combined" : "single";
			var enemyFleetBoxSelector = ".module.activity .abyss_" + enemyFleetBox;
			if (enemyFleetBox == "combined") {
				$(".module.activity .abyss_single").hide();
				$(".module.activity .abyss_combined").show();
			} else {
				$(".module.activity .abyss_single").show();
				$(".module.activity .abyss_combined").hide();
			}
			$(".module.activity .node_type_prev_encounters").hide();
			
			if (thisNode.debuffed) {
				$(".module.activity .map_world")
					.addClass("debuffed")
					.attr("title", KC3Meta.term("Debuffed"))
					.lazyInitTooltip();
			} else {
				$(".module.activity .map_world")
					.removeClass("debuffed")
					.attr("title", "");
			}
			
			// Load enemy icons
			$.each(thisNode.eships, function(index, eshipId){
				if(eshipId > 0){
					if ($(enemyFleetBoxSelector+" .abyss_ship_"+(index+1)).length > 0) {
						$(enemyFleetBoxSelector+" .abyss_ship_"+(index+1)).addClass(KC3Meta.abyssShipBorderClass(eshipId));
						$(enemyFleetBoxSelector+" .abyss_ship_"+(index+1)+" img")
							.attr("src", KC3Meta.abyssIcon(eshipId))
							.attr("titlealt", thisNode.buildEnemyStatsMessage(index))
							.lazyInitTooltip();
						$(enemyFleetBoxSelector+" .abyss_ship_"+(index+1))
							.data("masterId", eshipId)
							.on("dblclick", self.shipDoubleClickFunction)
							.show();
					}
				}
			});

			// Enemy HP Predictions. `info_battle` should be considered as `hp_prediction`
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent, enemyBarHeight;
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > -1){
						if (thisNode.enemyHP[index] && thisNode.enemyHP[index].hp !== undefined){
							newEnemyHP = Math.max(0, thisNode.enemyHP[index].hp);
	
							if(!index &&
								['multiple','gauge-hp'].indexOf(KC3SortieManager.getCurrentMapData().kind)>=0 /* Flagship */
							)
								updateMapGauge(KC3SortieManager.currentNode().gaugeDamage,!newEnemyHP);
	
							if(newEnemyHP === 0){
								$(enemyFleetBoxSelector+" .abyss_ship_"+(index+1)).css("opacity", "0.6");
								$(enemyFleetBoxSelector+" .sunk_"+(index+1)+" img")
									.show()
									.css("-webkit-filter","");
							}
							
							enemyHPPercent = ( newEnemyHP / thisNode.maxHPs.enemy[index] );
							if (enemyFleetBox === "combined") {
								$(".module.activity .abyss_combined .abyss_hp_bar_"+(index+1))
									.css("height", 15*enemyHPPercent)
									.css("width", "2px");
								enemyBarHeight = $(".module.activity .abyss_combined .abyss_hp_bar_"+(index+1)).height();
								$(".module.activity .abyss_combined .abyss_hp_bar_"+(index+1))
									.css("margin-top", 15-enemyBarHeight);
							} else {
								$(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1))
									.css("width", 28*enemyHPPercent);
							}
							
							if(enemyHPPercent <= 0.25){
								$(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1)).css("background", "#FF0000");
							} else if(enemyHPPercent <= 0.50){
								$(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1)).css("background", "#FF9900");
							} else if(enemyHPPercent <= 0.75){
								$(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1)).css("background", "#FFFF00");
							} else{
								$(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1)).css("background", "#00FF00");
							}
							
						} else {
							$(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1)).css("background", "#999999");
						}
						
						$(enemyFleetBoxSelector+" .abyss_hp_"+(index+1)).show();
					}
				});
			}

			// Enemy formation
			if((typeof thisNode.eformation != "undefined") && (thisNode.eformation > -1)){
				$(".module.activity .battle_eformation img").attr("src", KC3Meta.formationIcon(thisNode.eformation));
				$(".module.activity .battle_eformation").css("-webkit-transform", "rotate(-90deg)");
				$(".module.activity .battle_eformation").attr("title", KC3Meta.formationText(thisNode.eformation));
			}

			// Battle conditions
			$(".module.activity .battle_engagement").text( thisNode.engagement[2] || thisNode.engagement[0] );
			$(".module.activity .battle_engagement").addClass( thisNode.engagement[1] );
			$(".module.activity .battle_engagement").attr("title", thisNode.engagement[3] || "" );
			var contactSpan = buildContactPlaneSpan(thisNode.fcontactId, thisNode.fcontact, thisNode.econtactId, thisNode.econtact);
			$(".module.activity .battle_contact").html(contactSpan.html()).lazyInitTooltip();

			// Swap fish and support icons
			$(".module.activity .battle_fish").hide();
			$(".module.activity .battle_support").show();

			// If support expedition or LBAS is triggered on this battle
			if (thisNode.supportFlag || thisNode.nightSupportFlag || thisNode.lbasFlag) {
				$(".module.activity .battle_support img").attr(
					"src",
					"../../../../assets/img/ui/dark_support.png"
				);

				if (this.nightSupportInfo || (!thisNode.startsFromNight && thisNode.supportInfo)) {
					const supportInfo = thisNode.supportInfo || thisNode.nightSupportInfo;
					const fleetId =
						(supportInfo.api_support_airatack || {}).api_deck_id ||
						(supportInfo.api_support_hourai || {}).api_deck_id ||
						"?";
					$(".module.activity .battle_support .support_exped").text(fleetId);
					$(".module.activity .battle_support .support_exped").show();
				}

				$(".module.activity .battle_support")
					.attr("title", thisNode.buildSupportAttackMessage() || KC3Meta.term("BattleSupportExped"))
					.lazyInitTooltip();
			} else {
				$(".module.activity .battle_support img").attr(
					"src",
					"../../../../assets/img/ui/dark_support-x.png"
				);
			}
			$(".module.activity .battle_support .support_lbas").toggle(thisNode.lbasFlag);

			// Day battle-only environment
			if(!thisNode.startsFromNight){
				// If anti-air CI fire is triggered
				$(".module.activity .battle_aaci img").attr("src",
					"../../../../assets/img/ui/dark_aaci"+["-x",""][(!!thisNode.antiAirFire)&1]+".png");
				$(".module.activity .battle_aaci").attr("title",
					thisNode.buildAntiAirCutinMessage() || KC3Meta.term("BattleAntiAirCutIn") )
					.lazyInitTooltip();

				// If night battle will be asked after this battle
				$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen"+["-x",""][thisNode.yasenFlag&1]+".png");

				// Battle conditions
				$(".module.activity .battle_detection").text( thisNode.detection[0] );
				$(".module.activity .battle_detection").addClass( thisNode.detection[1] );
				$(".module.activity .battle_detection").attr("title", thisNode.detection[2] || "" );
				$(".module.activity .battle_airbattle").text( thisNode.airbattle[0] );
				$(".module.activity .battle_airbattle").addClass( thisNode.airbattle[1] );
				$(".module.activity .battle_airbattle").attr("title",
					thisNode.buildAirPowerMessage()
				).lazyInitTooltip();

				// Fighter phase
				$(".fighter_ally .plane_before").text(thisNode.planeFighters.player[0]);
				$(".fighter_enemy .plane_before").text(thisNode.planeFighters.abyssal[0]);
				// Bombing Phase
				$(".bomber_ally .plane_before").text(thisNode.planeBombers.player[0]);
				$(".bomber_enemy .plane_before").text(thisNode.planeBombers.abyssal[0]);
				// Plane losses
				if(thisNode.planeFighters.player[1] > 0){
					$(".fighter_ally .plane_after").text("-"+thisNode.planeFighters.player[1]);
				}
				if(thisNode.planeFighters.abyssal[1] > 0){
					$(".fighter_enemy .plane_after").text("-"+thisNode.planeFighters.abyssal[1]);
				}
				if(thisNode.planeBombers.player[1] > 0){
					$(".bomber_ally .plane_after").text("-"+thisNode.planeBombers.player[1]);
				}
				if(thisNode.planeBombers.abyssal[1] > 0){
					$(".bomber_enemy .plane_after").text("-"+thisNode.planeBombers.abyssal[1]);
				}

				// if jet plane phase found
				var fightersBefore, fightersAfter, bombersBefore, bombersAfter;
				if(!!thisNode.planeJetFighters && thisNode.planeJetFighters.player[0] > 0){
					$(".fighter_ally .plane_icon img").attr("src", "../../../../assets/img/items/40.png");
					fightersBefore = thisNode.planeFighters.player[0] + thisNode.planeJetFighters.player[1] + thisNode.planeJetBombers.player[1];
					$(".fighter_ally .plane_before").text(fightersBefore);
					fightersAfter = thisNode.planeFighters.player[1] + thisNode.planeJetFighters.player[1];
					if(fightersAfter > 0){
						$(".fighter_ally .plane_after").text("-"+fightersAfter);
					}
				}
				if(!!thisNode.planeJetFighters && thisNode.planeJetFighters.abyssal[0] > 0){
					$(".fighter_enemy .plane_icon img").attr("src", "../../../../assets/img/items/40.png");
					fightersBefore = thisNode.planeFighters.abyssal[0] + thisNode.planeJetFighters.abyssal[1] + thisNode.planeJetBombers.abyssal[1];
					$(".fighter_enemy .plane_before").text(fightersBefore);
					fightersAfter = thisNode.planeFighters.abyssal[1] + thisNode.planeJetFighters.abyssal[1];
					if(fightersAfter > 0){
						$(".fighter_enemy .plane_after").text("-"+fightersAfter);
					}
				}
				if(!!thisNode.planeJetBombers && thisNode.planeJetBombers.player[0] > 0){
					$(".bomber_ally .plane_icon img").attr("src", "../../../../assets/img/items/39.png");
					bombersBefore = thisNode.planeBombers.player[0] + thisNode.planeJetBombers.player[1];
					$(".bomber_ally .plane_before").text(bombersBefore);
					bombersAfter = thisNode.planeBombers.player[1] + thisNode.planeJetBombers.player[1];
					if(bombersAfter > 0){
						$(".bomber_ally .plane_after").text("-"+bombersAfter);
					}
				}
				if(!!thisNode.planeJetBombers && thisNode.planeJetBombers.abyssal[0] > 0){
					$(".bomber_enemy .plane_icon img").attr("src", "../../../../assets/img/items/39.png");
					bombersBefore = thisNode.planeBombers.abyssal[0] + thisNode.planeJetBombers.abyssal[1];
					$(".bomber_enemy .plane_before").text(bombersBefore);
					bombersAfter = thisNode.planeBombers.abyssal[1] + thisNode.planeJetBombers.abyssal[1];
					if(bombersAfter > 0){
						$(".bomber_enemy .plane_after").text("-"+bombersAfter);
					}
				}

			// Started on night battle
			}else{
				$(".module.activity .battle_aaci img").attr("src", "../../../../assets/img/ui/dark_aaci-x.png");
				$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
			}

			// Show predicted battle rank
			if(thisNode.predictedRank || thisNode.predictedRankNight){
				$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+(thisNode.predictedRank||thisNode.predictedRankNight)+".png")
				.css("opacity", 0.5);
			}

			// Show battle activity if `info_compass` enabled, `info_battle` only affects enemy HP prediction
			if(ConfigManager.info_compass){
				$(".module.activity .node_type_battle").show();
			}
			this.Fleet();
		},

		BattleNight: function(data){
			var self = this;
			var thisNode = KC3SortieManager.currentNode();

			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent, enemyBarHeight;
				
				$.each(thisNode.eships, function(index, eshipId){
					if(eshipId > 0 && thisNode.enemyHP[index].hp !== undefined){
						newEnemyHP = Math.max(0, thisNode.enemyHP[index].hp);
						if ($(".module.activity .abyss_single .abyss_ship_"+(index+1)).length > 0) {
							$(".module.activity .abyss_single .abyss_ship_"+(index+1)+" img")
								.attr("src", thisNode.isPvP ? KC3Meta.shipIcon(eshipId) : KC3Meta.abyssIcon(eshipId))
								.attr("titlealt", thisNode.buildEnemyStatsMessage(index))
								.lazyInitTooltip();
							$(".module.activity .abyss_single .abyss_ship_"+(index+1))
								.data("masterId", eshipId)
								.on("dblclick", self.shipDoubleClickFunction)
								.show();
							if(ConfigManager.info_chuuha_icon && thisNode.isPvP){
								$(".module.activity .abyss_single .abyss_ship_"+(index+1)+" img")
									.attr("src", KC3Ship.shipIcon(eshipId, thisNode.maxHPs.enemy[index], newEnemyHP));
							}
						}
						
						if(!index &&
							['multiple','gauge-hp'].indexOf(KC3SortieManager.getCurrentMapData().kind)>=0 /* Flagship */
						){
							updateMapGauge(KC3SortieManager.currentNode().gaugeDamage,!newEnemyHP);
						}
						
						if(newEnemyHP === 0){
							$(".module.activity .abyss_single .abyss_ship_"+(index+1)).css("opacity", "0.6");
							$(".module.activity .abyss_single .sunk_"+(index+1)+" img")
								.show()
								.css("-webkit-filter",(data||{safeSunk:false}).safeSunk ? "grayscale(100%)" : "");
						}
						
						enemyHPPercent = ( newEnemyHP / thisNode.maxHPs.enemy[index] );
						
						$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1))
							.css("width", 28*enemyHPPercent);
						
						if(enemyHPPercent <= 0.25){
							$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("background", "#FF0000");
						} else if(enemyHPPercent <= 0.50){
							$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("background", "#FF9900");
						} else if(enemyHPPercent <= 0.75){
							$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("background", "#FFFF00");
						} else{
							$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("background", "#00FF00");
						}
						
						$(".module.activity .abyss_single .abyss_hp_"+(index+1)).show();
					}
				});
				
				$(".module.activity .abyss_single").show();
				$(".module.activity .abyss_combined").hide();
			}

			var contactSpan = buildContactPlaneSpan(thisNode.fcontactId, thisNode.fcontact, thisNode.econtactId, thisNode.econtact);
			$(".module.activity .battle_contact").html(contactSpan.html()).lazyInitTooltip();

			if(thisNode.predictedRankNight){
				$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+thisNode.predictedRankNight+".png")
				.css("opacity", 0.5);
			}

			this.Fleet();
		},

		BattleResult: function(data){
			var thisNode = KC3SortieManager.currentNode();

			updateHQEXPGained($(".admiral_lvnext"),KC3SortieManager.hqExpGained);

			// Show real battle rank
			$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+thisNode.rating+".png")
				.css("opacity", 1);

			// If there is any special item drop
			if(typeof data.api_get_useitem != "undefined"){
				$(".module.activity .battle_support").hide();
				$(".module.activity .battle_fish").show();
			}

			// If there is a ship drop
			if(thisNode.drop > 0){
				// If drop spoiler is enabled on settings
				if(ConfigManager.info_drop){
					$(".module.activity .battle_drop img").attr("src", KC3Meta.shipIcon(thisNode.drop, undefined, false));
					$(".module.activity .battle_drop")
						.data("masterId", thisNode.drop)
						.on("dblclick", this.shipDoubleClickFunction)
						.attr("title", KC3Meta.shipName( KC3Master.ship(thisNode.drop).api_name ))
						.toggleClass("new_ship", ConfigManager.info_dex_owned_ship ?
							// Not own this shipgirl of any remodel form, judged by picture book history or current ships
							! PictureBook.isEverOwnedShip(thisNode.drop) :
							! KC3ShipManager.masterExists(thisNode.drop)
						).lazyInitTooltip();
				}

				// Update Counts
				this.ShipSlots({});
				this.GearSlots({});
			}else{
				$(".module.activity .battle_drop img").attr("src",
					"../../../../assets/img/ui/dark_shipdrop-x.png");
			}

			// Show TP deduction
			if(KC3SortieManager.getCurrentMapData().kind=='gauge-tp') {
				updateMapGauge(
					-thisNode.gaugeDamage,
					true /* does not matter flagship status */
				);
			}

			// Show experience calculation if leveling global found in sent fleet
			if(selectedFleet <= (PlayerManager.combinedFleet ? 2 : 4) &&
				KC3SortieManager.fleetSent == (PlayerManager.combinedFleet ? 1 : selectedFleet)){
				const expJustGained = data.api_get_ship_exp;
				const currentFleet = PlayerManager.fleets[selectedFleet-1];
				const levelingGoals = localStorage.getObject("goals") || {};
				currentFleet.ship(function(rosterId, index, shipData){
					const grindGoal = KC3Calc.getShipLevelingGoal(shipData, undefined, levelingGoals, expJustGained[index + 1]);
					// if no goal defined or the ship has reached the goal, skip it
					if(grindGoal.targetLevel === undefined || grindGoal.expLeft < 0) return;
					console.log("Ship exp goal", shipData.name(), grindGoal);
					$("<div />").addClass("expNotice").text( grindGoal.battlesLeft )
						.appendTo("#ShipBox" + rosterId + " .ship_exp_label")
						.delay( 5000 )
						.fadeOut(1000, function(){ $(this).remove(); } );
				});
			}
		},

		CraftGear: function(data){
			// Recall equipment count
			this.GearSlots({});

			// If craft spoiler is disabled on settings
			if(!ConfigManager.info_craft){ return true; }

			var icon = "../../../../assets/img/client/penguin.png";
			console.debug("Crafted Gear", data);

			// If success crafting
			if (data.itemId !== null) {
				// Get equipment data
				var PlayerItem = KC3GearManager.get( data.itemId );
				var MasterItem = KC3Master.slotitem( data.itemMasterId );
				var countExisting = KC3GearManager.countByMasterId( data.itemMasterId );

				icon = "../../../../assets/img/items/"+MasterItem.api_type[3]+".png";
				$(".activity_crafting .equipIcon img").attr("src", icon);
				$(".activity_crafting .equipName").text( PlayerItem.name() );

				// Show extra item info
				if(countExisting == 1){
					$(".activity_crafting .equipNote").html( KC3Meta.term("CraftEquipNoteFirst") );
				}else{
					$(".activity_crafting .equipNote").html( KC3Meta.term("CraftEquipNoteExists").format(countExisting) );
				}

				$(".activity_crafting .equipStats").empty();
				CraftGearStats(MasterItem, "souk", "ar");
				CraftGearStats(MasterItem, "houg", "fp");
				CraftGearStats(MasterItem, "raig", "tp");
				CraftGearStats(MasterItem, "soku", "sp");
				CraftGearStats(MasterItem, "baku", "dv");
				CraftGearStats(MasterItem, "tyku", "aa");
				CraftGearStats(MasterItem, "tais", "as");
				CraftGearStats(MasterItem, "houm", "ht");
				CraftGearStats(MasterItem, "houk", "ev");
				CraftGearStats(MasterItem, "saku", "ls");
				CraftGearStats(MasterItem, "leng", "rn");
				$("<div />").addClass("clear").appendTo(".module.activity .activity_crafting .equipStats");

			// If penguin
			} else {
				$(".activity_crafting .equipIcon img").attr("src", icon);
				$(".activity_crafting .equipName").text( KC3Meta.term("CraftEquipNotePenguin") );
				$(".activity_crafting .equipNote").empty();
				$(".activity_crafting .equipStats").empty();
			}

			// Show resource used
			$(".activity_crafting .used1").text( data.resourceUsed[0] );
			$(".activity_crafting .used2").text( data.resourceUsed[1] );
			$(".activity_crafting .used3").text( data.resourceUsed[2] );
			$(".activity_crafting .used4").text( data.resourceUsed[3] );

			// Show the box
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_crafting").fadeIn(500);
		},

		CraftShip: function(data){},

		Modernize: function(data){
			console.debug("Modernized Ship", data);

			var ModShip = KC3ShipManager.get(data.rosterId);

			$(".activity_modernization .mod_ship_pic img").attr("src", KC3Meta.shipIcon(ModShip.masterId) );
			$(".activity_modernization .mod_ship_name").text( ModShip.name() );
			$(".activity_modernization .mod_ship_level span.value").text( ModShip.level );


			$(".activity_modernization .mod_result_tp .mod_result_old").text( data.oldStats[1] );
			$(".activity_modernization .mod_result_aa .mod_result_old").text( data.oldStats[2] );
			$(".activity_modernization .mod_result_ar .mod_result_old").text( data.oldStats[3] );
			$(".activity_modernization .mod_result_lk .mod_result_old").text( data.oldStats[4] );

			$.each(["fp","tp","aa","ar","lk","hp","as"], function(i, statName){
				$(".activity_modernization .mod_result_"+statName+" .mod_result_old").text( data.oldStats[i] );

				if(data.increase[i] > 0){
					$(".activity_modernization .mod_result_"+statName+" .mod_result_plus span").text( data.increase[i] );
					$(".activity_modernization .mod_result_"+statName+" .mod_result_plus").css("visibility", "visible");
				}else{
					$(".activity_modernization .mod_result_"+statName+" .mod_result_plus").css("visibility", "hidden");
				}

				$(".activity_modernization .mod_result_"+statName+" .mod_result_left span").text( KC3Meta.term("ModernizationResultLeft").format(data.left[i]) );
			});

			// Show the box
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_modernization").fadeIn(500);
		},

		ClearedMap: function(data){},

		PvPList: function(data){
			if(!ConfigManager.info_pvp_info)
				return;
			console.debug("PvP Enemy List", data);
			var jpRankArr = ["","\u5143\u5e25","\u5927\u5c06","\u4e2d\u5c06","\u5c11\u5c06","\u5927\u4f50","\u4e2d\u4f50","\u65b0\u7c73\u4e2d\u4f50","\u5c11\u4f50","\u4e2d\u5805\u5c11\u4f50","\u65b0\u7c73\u5c11\u4f50"];
			$(".activity_pvp .pvp_header .pvp_create_kind").text(
				KC3Meta.term("PvpListCreateType{0}".format(data.api_create_kind))
			);
			$(".activity_pvp .pvp_list").empty();
			$.each(data.api_list, function(idx, enemy){
				var enemyBox = $("#factory .pvpEnemyInfo").clone();
				$(".pvp_enemy_pic img", enemyBox).attr("src", KC3Meta.shipIcon(enemy.api_enemy_flag_ship));
				$(".pvp_enemy_pic", enemyBox)
					.attr("title", KC3Meta.shipName(KC3Master.ship(enemy.api_enemy_flag_ship).api_name))
					.lazyInitTooltip();
				$(".pvp_enemy_name", enemyBox).text(enemy.api_enemy_name);
				$(".pvp_enemy_name", enemyBox).attr("title", enemy.api_enemy_name).lazyInitTooltip();
				$(".pvp_enemy_level", enemyBox).text(enemy.api_enemy_level);
				// api_enemy_rank is not int ID of rank, fml
				var rankId = jpRankArr.indexOf(enemy.api_enemy_rank);
				$(".pvp_enemy_rank", enemyBox).text(KC3Meta.rank(rankId));
				$(".pvp_enemy_rank", enemyBox).attr("title", KC3Meta.rank(rankId)).lazyInitTooltip();
				$(".pvp_enemy_comment", enemyBox).text(enemy.api_enemy_comment);
				$(".pvp_enemy_comment", enemyBox).attr("title", enemy.api_enemy_comment).lazyInitTooltip();
				if(enemy.api_medals > 0){
					$(".pvp_enemy_medals span", enemyBox).text(enemy.api_medals);
				} else {
					$(".pvp_enemy_medals", enemyBox).hide();
				}
				if(enemy.api_state > 0){
					$(".pvp_enemy_state img", enemyBox).attr("src",
						"../../../../assets/img/client/ratings/{0}.png".format(["","E","D","C","B","A","S"][enemy.api_state])
					);
				} else {
					$(".pvp_enemy_state", enemyBox).hide();
				}
				enemyBox.appendTo(".activity_pvp .pvp_list");
			});
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_pvp .pvpList").show();
			$(".module.activity .activity_pvp .pvpFleet").hide();
			$(".module.activity .activity_pvp").fadeIn(500);
		},

		PvPFleet: function(data){
			var self = this;
			if(!ConfigManager.info_pvp_info)
				return;
			console.debug("PvP Enemy Fleet", data);
			$(".activity_pvp .pvp_admiral .pvp_admiral_name .value").text(data.api_nickname)
				.attr("title", data.api_nickname).lazyInitTooltip();
			$(".activity_pvp .pvp_admiral .pvp_admiral_level .value").text(data.api_level);
			// why is this rank int ID, fml
			$(".activity_pvp .pvp_admiral .pvp_admiral_rank").text(KC3Meta.rank(data.api_rank))
				.attr("title", KC3Meta.rank(data.api_rank)).lazyInitTooltip();
			// guess nobody is interest in api_experience[1]?
			$(".activity_pvp .pvp_admiral .pvp_admiral_exp").text(data.api_experience[0]);
			$(".activity_pvp .pvp_admiral .pvp_admiral_comment").text(data.api_cmt);
			$(".activity_pvp .pvp_admiral .pvp_admiral_ships").text("{0} /{1}".format(data.api_ship));
			$(".activity_pvp .pvp_admiral .pvp_admiral_gears").text("{0} /{1}".format(
				data.api_slotitem[0],
				// 3 fixed item space for everyone? fml
				3 + data.api_slotitem[1]
			));
			$(".activity_pvp .pvp_admiral .pvp_admiral_furniture").text(data.api_furniture);
			// This is not shown in game
			$(".activity_pvp .pvp_fleet_name").text(data.api_deckname);
			$(".activity_pvp .pvp_fleet_list").empty();
			var levelFlagship = 0, level2ndShip = 0;
			$.each(data.api_deck.api_ships, function(idx, ship){
				if(ship.api_id > 0){
					var shipMaster = KC3Master.ship(ship.api_ship_id);
					var shipName = KC3Meta.shipName(shipMaster.api_name);
					if(idx === 0) levelFlagship = ship.api_level;
					if(idx === 1) level2ndShip = ship.api_level;
					var shipBox = $("#factory .pvpFleetShip").clone();
					$(".pvp_fleet_ship_icon img", shipBox).attr("src", KC3Meta.shipIcon(ship.api_ship_id))
						.data("masterId", ship.api_ship_id)
						.on("dblclick", self.shipDoubleClickFunction)
						.attr("title", KC3Meta.stype(shipMaster.api_stype)).lazyInitTooltip();
					$(".pvp_fleet_ship_name", shipBox).text(shipName).attr("title", shipName).lazyInitTooltip();
					$(".pvp_fleet_ship_level .value", shipBox).text(ship.api_level);
					$(".pvp_fleet_ship_star .value", shipBox).text(1 + ship.api_star);
					shipBox.appendTo(".activity_pvp .pvp_fleet_list");
				}
			});
			// Check CT bonus in current selected fleet
			var playerFleet = PlayerManager.fleets[selectedFleet > 4 ? 0 : selectedFleet - 1];
			var ctBonus = playerFleet.lookupKatoriClassBonus();
			// Base EXP only affected by first two ships of opponent's fleet
			var baseExp = playerFleet.estimatePvpBaseExp(levelFlagship, level2ndShip, ctBonus);
			$(".activity_pvp .pvp_base_exp .value").text(baseExp.s);
			$(".activity_pvp .pvp_base_exp").attr("title",
				("{0}: {1}\nSS/S: {2}\nA/B: {3}\nC: {4}\nD: {5}"
				 + (ctBonus > 1 ? "\n{6}: {7}" : ""))
					.format(KC3Meta.term("PvpBaseExp"),
						baseExp.base, baseExp.s, baseExp.a, baseExp.c, baseExp.d,
						KC3Meta.term("PvpDispBaseExpWoCT").format(ctBonus), baseExp.sIngame)
			).lazyInitTooltip();
			var predictedFormation = playerFleet.predictOpponentFormation(
				// Normalize opponent's fleet: convert Object to Array, remove -1 elements
				data.api_deck.api_ships
					.map(function(v){return v.api_id > 0 ? v.api_ship_id : -1;})
					.filter(function(v){return v > 0;})
			);
			var formationText = KC3Meta.formationText(predictedFormation);
			$(".activity_pvp .pvp_formation img")
				.attr("src", KC3Meta.formationIcon(predictedFormation))
				.attr("title", formationText)
				.lazyInitTooltip();
			console.log("Predicted PvP formation and exp", formationText, baseExp);
			
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_pvp .pvpList").hide();
			$(".module.activity .activity_pvp .pvpFleet").show();
			$(".module.activity .activity_pvp").fadeIn(500);
		},

		PvPStart: function(data){
			var self = this;
			// Clear battle details box just to make sure
			clearBattleData();
			$(".module.activity .map_world").text( KC3Meta.term("BattleMapWorldPvP") );
			$(".module.activity .map_hp").text( KC3Meta.term("BattleMapNoHpGauge") );
			
			// PvP enemy never combined
			$(".module.activity .abyss_single").show();
			$(".module.activity .abyss_combined").hide();
			
			// Create a battle node for PvP battle
			var thisPvP = (new KC3Node(0, 0, Date.now())).defineAsBattle();
			KC3SortieManager.appendNode(thisPvP);
			thisPvP.isPvP = true;
			thisPvP.engage( data.battle, parseInt(data.fleetSent) );

			// Hide useless information
			$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support-x.png").css("visibility","hidden");
			$(".module.activity .battle_drop    img").attr("src", "../../../../assets/img/ui/dark_shipdrop-x.png").css("visibility","hidden");

			// Swap fish and support icons
			$(".module.activity .battle_fish").hide();
			$(".module.activity .battle_support").attr("title", "").show();

			// Enemy Formation
			if((typeof thisPvP.eformation != "undefined") && (thisPvP.eformation > -1)){
				$(".module.activity .battle_eformation img").attr("src",
					KC3Meta.formationIcon(thisPvP.eformation));
				$(".module.activity .battle_eformation").css("-webkit-transform", "rotate(-90deg)");
				$(".module.activity .battle_eformation").attr("title",
					KC3Meta.formationText(thisPvP.eformation));
				$(".module.activity .battle_eformation").show();
			} else {
				$(".module.activity .battle_eformation").hide();
			}

			// Show opponent ships faces
			$.each(thisPvP.eships, function(index, eshipId){
				if(eshipId > 0){
					$(".module.activity .abyss_single .abyss_ship_"+(index+1)+" img")
						.attr("src", KC3Meta.shipIcon(eshipId))
						.attr("titlealt", thisPvP.buildEnemyStatsMessage(index))
						.lazyInitTooltip();
					$(".module.activity .abyss_single .abyss_ship_"+(index+1))
						.data("masterId", eshipId)
						.on("dblclick", self.shipDoubleClickFunction)
						.show();
				}
			});

			// Enemy HP Predictions
			if(ConfigManager.info_battle){
				var newEnemyHP, enemyHPPercent;
				$.each(thisPvP.eships, function(index, eshipId){
					if(eshipId > 0 && thisPvP.enemyHP[index].hp !== undefined){
						newEnemyHP = thisPvP.enemyHP[index].hp;
						if(newEnemyHP < 0){ newEnemyHP = 0; }

						if(ConfigManager.info_chuuha_icon){
							$(".module.activity .abyss_single .abyss_ship_"+(index+1)+" img")
								.attr("src", KC3Ship.shipIcon(eshipId, thisPvP.maxHPs.enemy[index], newEnemyHP));
						}

						if(newEnemyHP === 0){
							$(".module.activity .abyss_single .abyss_ship_"+(index+1)).css("opacity", "0.6");
							$(".module.activity .abyss_single .sunk_"+(index+1)+" img")
								.show()
								.css("-webkit-filter","grayscale(100%)");
						}

						enemyHPPercent = ( newEnemyHP / thisPvP.maxHPs.enemy[index] );
						$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("width", 28*enemyHPPercent);

						if(enemyHPPercent <= 0.25){
							$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("background", "#FF0000");
						} else if(enemyHPPercent <= 0.50){
							$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("background", "#FF9900");
						} else if(enemyHPPercent <= 0.75){
							$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("background", "#FFFF00");
						} else{
							$(".module.activity .abyss_single .abyss_hp_bar_"+(index+1)).css("background", "#00FF00");
						}

						$(".module.activity .abyss_single .abyss_hp_"+(index+1)).show();
					}
				});
			}

			// If anti-air CI fire is triggered
			$(".module.activity .battle_aaci img").attr("src",
				"../../../../assets/img/ui/dark_aaci"+["-x",""][(!!thisPvP.antiAirFire)&1]+".png");
			$(".module.activity .battle_aaci").attr("title",
				thisPvP.buildAntiAirCutinMessage() || KC3Meta.term("BattleAntiAirCutIn") )
				.lazyInitTooltip();

			// If night battle will be asked after this battle
			$(".module.activity .battle_night img").attr("src",
				"../../../../assets/img/ui/dark_yasen"+["-x",""][thisPvP.yasenFlag&1]+".png");

			// Show predicted battle rank
			if(thisPvP.predictedRank){
				$(".module.activity .battle_rating img").attr("src",
				"../../../../assets/img/client/ratings/"+thisPvP.predictedRank+".png")
				.css("opacity", 0.5);
			}

			// Battle conditions
			$(".module.activity .battle_detection").text( thisPvP.detection[0] );
			$(".module.activity .battle_detection").addClass( thisPvP.detection[1] );
			$(".module.activity .battle_detection").attr("title", thisPvP.detection[2] || "" );
			$(".module.activity .battle_airbattle").text( thisPvP.airbattle[0] );
			$(".module.activity .battle_airbattle").addClass( thisPvP.airbattle[1] );
			$(".module.activity .battle_airbattle").attr("title",
				thisPvP.buildAirPowerMessage()
			).lazyInitTooltip();
			$(".module.activity .battle_engagement").text( thisPvP.engagement[2] || thisPvP.engagement[0] );
			$(".module.activity .battle_engagement").addClass( thisPvP.engagement[1] );
			$(".module.activity .battle_engagement").attr("title", thisPvP.engagement[3] || "");
			var contactSpan = buildContactPlaneSpan(thisPvP.fcontactId, thisPvP.fcontact, thisPvP.econtactId, thisPvP.econtact);
			$(".module.activity .battle_contact").html(contactSpan.html()).lazyInitTooltip();

			// Fighter phase
			$(".fighter_ally .plane_before").text(thisPvP.planeFighters.player[0]);
			$(".fighter_enemy .plane_before").text(thisPvP.planeFighters.abyssal[0]);
			// Bombing Phase
			$(".bomber_ally .plane_before").text(thisPvP.planeBombers.player[0]);
			$(".bomber_enemy .plane_before").text(thisPvP.planeBombers.abyssal[0]);
			// Plane losses
			if(thisPvP.planeFighters.player[1] > 0){
				$(".fighter_ally .plane_after").text("-"+thisPvP.planeFighters.player[1]);
			}
			if(thisPvP.planeFighters.abyssal[1] > 0){
				$(".fighter_enemy .plane_after").text("-"+thisPvP.planeFighters.abyssal[1]);
			}
			if(thisPvP.planeBombers.player[1] > 0){
				$(".bomber_ally .plane_after").text("-"+thisPvP.planeBombers.player[1]);
			}
			if(thisPvP.planeBombers.abyssal[1] > 0){
				$(".bomber_enemy .plane_after").text("-"+thisPvP.planeBombers.abyssal[1]);
			}

			// if jet plane phase found
			var fightersBefore, fightersAfter, bombersBefore, bombersAfter;
			if(!!thisPvP.planeJetFighters && thisPvP.planeJetFighters.player[0] > 0){
				$(".fighter_ally .plane_icon img").attr("src", "../../../../assets/img/items/40.png");
				fightersBefore = thisPvP.planeFighters.player[0] + thisPvP.planeJetFighters.player[1] + thisPvP.planeJetBombers.player[1];
				$(".fighter_ally .plane_before").text(fightersBefore);
				fightersAfter = thisPvP.planeFighters.player[1] + thisPvP.planeJetFighters.player[1];
				if(fightersAfter > 0){
					$(".fighter_ally .plane_after").text("-"+fightersAfter);
				}
			}
			if(!!thisPvP.planeJetFighters && thisPvP.planeJetFighters.abyssal[0] > 0){
				$(".fighter_enemy .plane_icon img").attr("src", "../../../../assets/img/items/40.png");
				fightersBefore = thisPvP.planeFighters.abyssal[0] + thisPvP.planeJetFighters.abyssal[1] + thisPvP.planeJetBombers.abyssal[1];
				$(".fighter_enemy .plane_before").text(fightersBefore);
				fightersAfter = thisPvP.planeFighters.abyssal[1] + thisPvP.planeJetFighters.abyssal[1];
				if(fightersAfter > 0){
					$(".fighter_enemy .plane_after").text("-"+fightersAfter);
				}
			}
			if(!!thisPvP.planeJetBombers && thisPvP.planeJetBombers.player[0] > 0){
				$(".bomber_ally .plane_icon img").attr("src", "../../../../assets/img/items/39.png");
				bombersBefore = thisPvP.planeBombers.player[0] + thisPvP.planeJetBombers.player[1];
				$(".bomber_ally .plane_before").text(bombersBefore);
				bombersAfter = thisPvP.planeBombers.player[1] + thisPvP.planeJetBombers.player[1];
				if(bombersAfter > 0){
					$(".bomber_ally .plane_after").text("-"+bombersAfter);
				}
			}
			if(!!thisPvP.planeJetBombers && thisPvP.planeJetBombers.abyssal[0] > 0){
				$(".bomber_enemy .plane_icon img").attr("src", "../../../../assets/img/items/39.png");
				bombersBefore = thisPvP.planeBombers.abyssal[0] + thisPvP.planeJetBombers.abyssal[1];
				$(".bomber_enemy .plane_before").text(bombersBefore);
				bombersAfter = thisPvP.planeBombers.abyssal[1] + thisPvP.planeJetBombers.abyssal[1];
				if(bombersAfter > 0){
					$(".bomber_enemy .plane_after").text("-"+bombersAfter);
				}
			}

			// Switch to battle tab
			$(".module.activity .activity_battle").css("opacity", 1);
			$(".module.activity .node_types").hide();
			if(ConfigManager.info_compass){
				$(".module.activity .sortie_nodes .sortie_node").show();
				$(".module.activity .node_type_battle").show();
			} else {
				// PvP battle activities info should be hidden when `info_compass` turned off,
				// Here left it unfixed to keep option function identical with history.
				$(".module.activity .sortie_nodes .sortie_node").show();
				$(".module.activity .node_type_battle").show();
			}
			$("#atab_battle").trigger("click");

			// Trigger other listeners
			this.HQ({});
			this.ShipSlots({});
			this.GearSlots({});
			this.Fleet({});
			this.Quests({});
		},

		PvPNight: function(data){
			this.BattleNight({safeSunk:true});
		},

		PvPEnd: function(data){
			var thisPvP = KC3SortieManager.currentNode();
			$(".module.activity .battle_rating img")
				.attr("src", "../../../../assets/img/client/ratings/"+thisPvP.rating+".png")
				.css("opacity", 1);
			updateHQEXPGained($(".admiral_lvnext"), KC3SortieManager.hqExpGained);
			this.Fleet();
		},

		ExpeditionSelection: function (data) {
			if (! ConfigManager.info_auto_exped_tab)
				return;

			// on expedition selection page
			// choose one available fleet if any, setup variables properly
			ExpedTabAutoFleetSwitch(true);
		},
		ExpeditionStart: function (data) {
			if (! ConfigManager.info_auto_exped_tab)
				return;
			// this part is triggered when a fleet is sent to some expedition
			// but at this moment fleet info is not yet updated
			expeditionStarted = true;
		},
		ExpedResult: function(data){
			overrideFocus = true;

			if(!data.response.api_clear_result && !data.response.api_get_exp) {
				data.response.api_clear_result = -1;
			}

			// Show result status image
			$(".activity_expedition .expres_img img").attr("src",
				"../../../../assets/img/client/exped_"+
				(["fail","fail","success","gs"][data.response.api_clear_result+1])
				+".png"
			);

			// Show Expedition API defined display number instead
			$(".activity_expedition .expres_num").text(
				"{0} {1}".format(KC3Meta.term("Expedition"), KC3Master.missionDispNo(data.expedNum))
			);

			// Status text
			$(".activity_expedition .expres_status")
				.text( KC3Meta.term("MissionActivity"+(data.response.api_clear_result+1)) )
				.removeClass("exp_status0 exp_status1 exp_status2 exp_status3")
				.addClass("exp_status"+(data.response.api_clear_result+1));

			// Resource gains
			if(data.response.api_get_material===-1){ data.response.api_get_material = [0,0,0,0]; }
			$(".activity_expedition .expres_reso").each(function(i,element){
				$(".expres_amt", element).text( data.response.api_get_material[i] );
			});

			// Extra item get
			var
				gotItem = false,
				useItemMap = { // guess useitem map
					 1:"bucket",
					 2:"ibuild",
					 3:"devmat",
					10:"box1",
					11:"box2",
					12:"box3",
				}; // for item array

			$(".module.activity .activity_expedition .expres_noget").hide();
			$(".activity_expedition .expres_item").each(function(i,element){
				var
					useCons = data.response.api_useitem_flag[i],
					useItem = data.response["api_get_item"+(i+1)];
				if(!!useCons && !!useItem) {
					gotItem |= true;
					$(element).show();
					$("img", element).attr("src", "../../../../assets/img/client/"+useItemMap[useCons === 4 ? useItem.api_useitem_id : useCons]+".png");
					$(".expres_item_text", element).text( useItem.api_useitem_count );
				}else{
					$(element).hide();
				}
			});
			if(!gotItem){ $(".module.activity .activity_expedition .expres_noget").show(); }

			// HQ Exp
			$(".activity_expedition .expres_hqexp_amt span.value").text( data.response.api_get_exp );

			// Ship Exp
			$(".activity_expedition .expres_ships .expres_ship").each(function(i,element){
				var shipId = data.response.api_ship_id[i+1];
				if(shipId > 0) {
					var shipData = KC3ShipManager.get(shipId);
					$(".expres_ship_img img", element).attr("src", KC3Meta.shipIcon(shipData.masterId));
					$(".expres_ship_exp span.value", element).text(data.response.api_get_ship_exp[i]);
					$(element).show();
				} else {
					$(element).hide();
				}
			});

			// Show the box
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_expedition").fadeIn(500);

			// after getting the result, we assume user will just resupply & resend to the same expedition
			// it makes sense to update expedition planner with current fleet-expedition relation.
			var expedTabConf = ExpedTabValidateConfig();
			var resultFleetNum = data.params.api_deck_id; // string
			expedTabConf.fleetConf[ resultFleetNum ].expedition = data.expedNum;
			localStorage.expedTab = JSON.stringify( expedTabConf );
		},

		UpdateExpeditionPlanner: function (data) {
			// if combined fleet or LBAS, cancel action
			if(selectedFleet > 4) {
				$(".module.activity .activity_expeditionPlanner").addClass("disabled");
				return false;
			} else {
				$(".module.activity .activity_expeditionPlanner").removeClass("disabled");
			}
			// if expedition planner not activated, no update required
			if (!$("#atab_expeditionPlanner").hasClass("active")) { return false; }

			$( ".module.activity .activity_expeditionPlanner .expres_greatbtn img" )
				.attr("src", "../../../../assets/img/ui/btn-"+(plannerIsGreatSuccess?"":"x")+"gs.png");
			$(".module.activity .activity_expeditionPlanner .dropdown_title")
				.text(KC3Meta.term("ExpedNumLabel") + KC3Master.missionDispNo(selectedExpedition));

			var allShips,
				fleetObj = PlayerManager.fleets[selectedFleet-1];

			//fleets' subscripts start from 0 !
			allShips = fleetObj.ships.map(function(rosterId, index) {
				return KC3ShipManager.get(rosterId);
			}).filter(function (rosterData, index) {
				return (rosterData.masterId > 0);
			});

			var PS = window.PS;
			var KE = PS["KanColle.Expedition"];
			var KER = PS["KanColle.Expedition.Requirement"];
			var KEC = PS["KanColle.Expedition.Cost"];
			var KERO = PS["KanColle.Expedition.RequirementObject"];
			var ST = PS["KanColle.Generated.SType"];

			var allShipsForLib = allShips.map(function(CurrentShip, ind) {
				var shipInst = CurrentShip;
				var shipModel = CurrentShip.master();
				var stypeId = shipModel.api_stype;
				var stype = ST.showSType(ST.fromInt(stypeId));
				var level = shipInst.level;
				var drumCount = CurrentShip.countDrums();
				var los = shipInst.ls[0], aa = shipInst.aa[0];
				var asw = shipInst.nakedAsw() + shipInst.effectiveEquipmentTotalAsw();
				return {
					ammo : 0,
					morale : 0,
					stype : stype,
					level : level,
					drumCount : drumCount,
					asw : asw,
					los : los,
					aa : aa
				};
			});

			var fleet = KER.fromRawFleet(allShipsForLib);
			var availableExpeditions = KE.getAvailableExpeditions( fleet );

			var unsatRequirements = KER.unsatisfiedRequirements(selectedExpedition)(fleet);
			var condCheckWithoutResupply = unsatRequirements.length === 0;

			//Don't forget to use KERO.*ToObject to convert raw data to JS friendly objs
			var rawExpdReqPack = KERO.getExpeditionRequirementPack(selectedExpedition);

			var ExpdReqPack = KERO.requirementPackToObj(rawExpdReqPack);
			//console.debug(`Exped #${selectedExpedition} needs`, JSON.stringify(ExpdReqPack));
			var ExpdCheckerResult = KERO.resultPackToObject(KERO.checkWithRequirementPack(rawExpdReqPack)(fleet));
			//console.debug(`Exped #${selectedExpedition} checks`, JSON.stringify(ExpdCheckerResult));
			var ExpdCost = KEC.getExpeditionCost(selectedExpedition);
			var KEIB = PS["KanColle.Expedition.IncomeBase"];
			var ExpdIncome = KEIB.getExpeditionIncomeBase(selectedExpedition);
			var ExpdFleetCost = fleetObj.calcExpeditionCost(selectedExpedition);

			$(".module.activity .activity_expeditionPlanner .estimated_time").text( String( 60*ExpdCost.time ).toHHMMSS() );
			$(".module.activity .activity_expeditionPlanner").hideChildrenTooltips();

			// setup expedition item colors
			$( ".activity_expeditionPlanner .expedition_entry" ).each( function(i,v) {
				var expeditionId = parseInt( $(this).data("expId") );
				if (availableExpeditions.indexOf(expeditionId) !== -1) {
					$(this).addClass("cond_passed").removeClass("cond_failed");
					// this expedition is available
				} else {
					// mark not available
					$(this).addClass("cond_failed").removeClass("cond_passed");
				}
			});

			var resourceRoot = $(".module.activity .activity_expeditionPlanner .expres_resos");
			$.each(["fuel","ammo","steel","bauxite"], function(i,v) {
				var basicIncome = ExpdIncome[v];
				var jqObj = $( "."+v, resourceRoot );
				var resupply;
				if (v === "fuel" || v === "ammo") {
					resupply = ExpdFleetCost[v];
				} else {
					resupply = 0;
				}

				var tooltipText = fleetObj.landingCraftBonusTextAndVal(basicIncome,resupply,plannerIsGreatSuccess);
				jqObj.text( tooltipText.val );
				jqObj.attr( 'title', tooltipText.text ).lazyInitTooltip();
			});

			var jqGSRate = $(".module.activity .activity_expeditionPlanner .row_gsrate .gsrate_content");

			// "???" instead of "?" to make it more noticeable.
			var sparkledCount = fleetObj.ship().filter( s => s.morale >= 50 ).length;
			var fleetShipCount = fleetObj.countShips();
			var fleetDrumCount = fleetObj.countDrums();
			// reference: http://wikiwiki.jp/kancolle/?%B1%F3%C0%AC
			var gsDrumCountTable = {
				21: 3+1,
				37: 4+1,
				38: 8+2,
				24: 0+4,
				40: 0+4 };
			var gsDrumCount = gsDrumCountTable[selectedExpedition];

			var condIsDrumExpedition = !!gsDrumCount;
			var condIsUnsparkledShip = fleetShipCount > sparkledCount;
			var condIsOverdrum = fleetDrumCount >= gsDrumCount;

			var estSuccessRate = 0;
			// can GS if:
			// - expedition requirements are satisfied
			// - either drum expedition, or regular expedition with all ships sparkled
			if (condCheckWithoutResupply && !(condIsUnsparkledShip && !condIsDrumExpedition)) {
				// based on the datamined vita formula,
				// see https://github.com/KC3Kai/KC3Kai/issues/1951#issuecomment-292883907
				estSuccessRate = 21 + 15 * sparkledCount;
				if (condIsDrumExpedition) {
					estSuccessRate += condIsOverdrum ? 20 : -15;
				}
			}

			jqGSRate.text(
				(function (rate) {
					if (rate === 0) { return "0%"; }
					if (rate >= 100) { return "100%"; }
					return "~" + rate + "%";
				})(estSuccessRate)
			);

			// colour GS text based on GS chance
			jqGSRate.attr('data-gsState', function (rate) {
				if (rate <= 0) { return "impossible"; }
				if (condIsDrumExpedition && !condIsOverdrum) { return "no-overdrum"; }
				if (rate < 80) { return ""; } // no colour
				if (rate < 100 ) { return "likely"; }
				if (rate >= 100) { return "guaranteed"; }
			}(estSuccessRate));


			var tooltipText = (function () {
				if (!condCheckWithoutResupply) { return KC3Meta.term('ExpedGSRateExplainCondUnmet'); }
				if (condIsUnsparkledShip && !condIsDrumExpedition) {
					return KC3Meta.term('ExpedGSRateExplainMissingSparkle');
				}
				if (condIsDrumExpedition && !condIsOverdrum) {
					return KC3Meta.term('ExpedGSRateExplainNoOverdrum').format(fleetDrumCount, gsDrumCount);
				}
				return KC3Meta.term('ExpedGSRateExplainSparkle').format(sparkledCount);
			})();
			
			jqGSRate.attr("title", tooltipText).lazyInitTooltip();

			// hide GS rate if user does not intend doing so.
			$(".module.activity .activity_expeditionPlanner .row_gsrate")
				.toggle( plannerIsGreatSuccess );

			var markFailed = function (jq) {
				jq.addClass("expPlanner_text_failed").removeClass("expPlanner_text_passed");
				return jq;
			};
			var markPassed = function (jq) {
				jq.removeClass("expPlanner_text_failed").addClass("expPlanner_text_passed");
				return jq;
			};

			// dataReq: like dataResult
			// dataResult: dataResult of ExpdCheckerResult fields, where
			//		 null: should hide jq obj
			//		 false: check failed
			//		 true: check passed
			//		 <other values>: no effect
			// jq: the jq object
			// postActions: (optional) call postActions(dataReq,dataResult,jq) perform actions after jq object is properly set.
			//				note that postActions is only called if the requirement is not null
			//				the default action is setting the requirement to jq text
			var setupJQObject = function( dataReq, dataResult, jq, postActions ) {
				if (dataReq === null) {
					jq.hide();
				} else {
					jq.show();
					if (dataResult === false) {
						// when this condition is not met
						markFailed( jq );
					} else if (dataResult === true) {
						// when this condition is met
						markPassed( jq );
					}
					var setJQText = function( dataReq, dataResult, jq ) { jq.text( dataReq ); };
					postActions = postActions || setJQText;
					postActions( dataReq, dataResult, jq );
				}
			};

			setupJQObject(
				ExpdReqPack.flagShipLevel,
				ExpdCheckerResult.flagShipLevel,
				$(".module.activity .activity_expeditionPlanner .flagshipLv"));


			setupJQObject(
				ExpdReqPack.flagShipTypeOf,
				ExpdCheckerResult.flagShipTypeOf,
				$(".module.activity .activity_expeditionPlanner .flagshipType"));

			setupJQObject(
				ExpdReqPack.shipCount,
				ExpdCheckerResult.shipCount,
				$(".module.activity .activity_expeditionPlanner .shipNum"));

			setupJQObject(
				ExpdReqPack.levelCount,
				ExpdCheckerResult.levelCount,
				$(".module.activity .activity_expeditionPlanner .fleetLv")
			);
			if (ExpdReqPack.levelCount === null) {
				$(".module.activity .activity_expeditionPlanner .hasTotalLv").hide();
			} else {
				$(".module.activity .activity_expeditionPlanner .hasTotalLv").show();
			}

			setupJQObject(
				ExpdReqPack.totalAsw,
				ExpdCheckerResult.totalAsw,
				$(".module.activity .activity_expeditionPlanner .totalAsw")
			);
			if (ExpdReqPack.totalAsw === null) {
				$(".module.activity .activity_expeditionPlanner .hasTotalAsw").hide();
			} else {
				$(".module.activity .activity_expeditionPlanner .hasTotalAsw").show();
			}
			setupJQObject(
				ExpdReqPack.totalAa,
				ExpdCheckerResult.totalAa,
				$(".module.activity .activity_expeditionPlanner .totalAa")
			);
			if (ExpdReqPack.totalAa === null) {
				$(".module.activity .activity_expeditionPlanner .hasTotalAa").hide();
			} else {
				$(".module.activity .activity_expeditionPlanner .hasTotalAa").show();
			}
			setupJQObject(
				ExpdReqPack.totalLos,
				ExpdCheckerResult.totalLos,
				$(".module.activity .activity_expeditionPlanner .totalLos")
			);
			if (ExpdReqPack.totalLos === null) {
				$(".module.activity .activity_expeditionPlanner .hasTotalLos").hide();
			} else {
				$(".module.activity .activity_expeditionPlanner .hasTotalLos").show();
			}

			setupJQObject(
				ExpdReqPack.fleetSType,
				ExpdCheckerResult.fleetSType,
				$( ".module.activity .activity_expeditionPlanner .expPlanner_req_fleetComposition" ),
				function ( dataReq, dataResult, jq ) {
					jq.empty();
					$.each( dataReq, function(index, value){
						var shipReqBox = $("#factory .expPlanner_shipReqBox")
							.clone()
							.appendTo( jq );
						shipReqBox.text("{0}:{1}"
							.format(dataReq[index].stypeOneOf.join("/"), dataReq[index].stypeReqCount));
						if((selectedExpedition <= 40 || selectedExpedition === 102) &&
							dataReq[index].stypeOneOf.includes("DE")) {
							shipReqBox.attr("title",
								// alternative DE/CVE patterns for exped 4, 5, 9 and A3:
								"CL/CT:1 DD/DE:2 / DD:1 DE:3 / CVE:1 DD/DE:2 + ??\n" +
								KC3Meta.term("ExpedEscortTip")
							).lazyInitTooltip();
						}
						if (dataResult[index] === false) {
							markFailed( shipReqBox );
						} else if (dataResult[index] === true) {
							markPassed( shipReqBox );
						}
					});
				});

			setupJQObject(
				ExpdReqPack.drumCount,
				ExpdCheckerResult.drumCount,
				$( ".module.activity .activity_expeditionPlanner .canisterNum" ));

			setupJQObject(
				ExpdReqPack.drumCarrierCount,
				ExpdCheckerResult.drumCarrierCount,
				$( ".module.activity .activity_expeditionPlanner .canisterShipNum" )
			);
			if (ExpdReqPack.drumCount === null &&
				ExpdReqPack.drumCarrierCount === null) {
				$( ".module.activity .activity_expeditionPlanner .canister_criterias" ).hide();
			} else {
				$( ".module.activity .activity_expeditionPlanner .canister_criterias" ).show();
			}

			if (fleetObj.isSupplied()) {
				$( ".module.activity .activity_expeditionPlanner .icon.supplyCheck" ).show();
				$( ".module.activity .activity_expeditionPlanner .text.supplyCheck" ).text(KC3Meta.term("PanelSupplied"));

				markPassed( $( ".module.activity .activity_expeditionPlanner .text.supplyCheck") );
			} else {
				$( ".module.activity .activity_expeditionPlanner .icon.supplyCheck" ).hide();
				$( ".module.activity .activity_expeditionPlanner .text.supplyCheck" ).text(KC3Meta.term("PanelUnderSupplied"));

				markFailed( $( ".module.activity .activity_expeditionPlanner .text.supplyCheck" ) );
			}

			if (condCheckWithoutResupply && fleetObj.isSupplied()) {
				markPassed( $(".module.activity .activity_expeditionPlanner .dropdown_title") );
			} else {
				markFailed( $(".module.activity .activity_expeditionPlanner .dropdown_title") );
			}

			return;

				/*
				 *
				 * Sample result for ExpdReqPack and ExpdCheckerResult on expedition 21#
				 *
				 * {
						"flagShipLevel":15,
						"shipCount":5,
						"flagShipTypeOf":null,
						"levelCount":30,
						"drumCount":null,
						"drumCarrierCount":3,
						"fleetSType":[
							{
								"stypeReqCount":1,
								"stypeOneOf":[
									"CL"
								]
							},
							{
								"stypeReqCount":4,
								"stypeOneOf":[
									"DD"
								]
							}
						]
					}
					---------------------
					{
						"flagShipLevel":true,
						"shipCount":false,
						"flagShipTypeOf":null,
						"levelCount":true,
						"drumCount":null,
						"drumCarrierCount":false,
						"fleetSType":[
							true,
							false
						]
					}
				 */

		},
		
		GunFit: function(data) {
			// if expedition planner is activated,
			// user are probably configuring exped fleets and
			// in that case we prevent gunfit or AACI info from popping up
			if ($("#atab_expeditionPlanner").hasClass("active")) {
				return;
			}
			// GunFit event now will show all kinds of effects triggered by equipment changed,
			// not only the fit weight bonus / over weight penalty, AACI things.
			// FIXME refactoring to rename all `gunfit` identifiers and names.
			console.debug("Equipment special effects", data);
			if(!data.isShow){
				if($("#atab_activity").hasClass("active")) $("#atab_basic").trigger("click");
				return;
			}
			
			$(".activity_gunfit .fit_ship_pic img").attr("src", KC3Meta.shipIcon(data.shipObj.masterId) );
			$(".activity_gunfit .fit_ship_name").text( data.shipObj.name() );
			$(".activity_gunfit .fit_ship_level span.value").text( data.shipObj.level );
			
			if(data.gearObj && data.gearObj.exists()){
				$(".activity_gunfit .fit_gear_pic img").attr("src",
					"/assets/img/items/" + data.gearObj.master().api_type[3] + ".png");
				$(".activity_gunfit .fit_gear_name").text(data.gearObj.name())
					.attr("title", data.gearObj.name()).lazyInitTooltip();
				if (data.gearObj.stars > 0) {
					$(".activity_gunfit .fit_gear_level span").text(data.gearObj.stars);
					$(".activity_gunfit .fit_gear_level").show();
				} else {
					$(".activity_gunfit .fit_gear_level").hide();
				}
			} else {
				$(".activity_gunfit .fit_gear_pic img").attr("src", "/assets/img/ui/empty.png");
				$(".activity_gunfit .fit_gear_name").text("");
				$(".activity_gunfit .fit_gear_level").hide();
			}
			
			const gunfitBox = $(".activity_gunfit .fit_value");
			if (data.gunFit !== false) {
				const signedNumber = n => (n > 0 ? '+' : n === 0 ? '\u00b1' : '') + n;
				$(".fit_current span", gunfitBox).removeClass("fit_bonus fit_penalty");
				if(data.gunFit.unknown === true) {
					$(".fit_current .fit_unknown", gunfitBox).show();
					$(".fit_current .fit_day,.fit_current .fit_night", gunfitBox).hide();
				} else {
					const fitDay = data.gunFit.day,
						fitNight = data.gunFit.night;
					$(".fit_current .fit_day span", gunfitBox)
						.text(signedNumber(fitDay))
						.addClass(fitDay < 0 ? "fit_penalty" : fitDay > 0 ? "fit_bonus" : "");
					$(".fit_current .fit_night span", gunfitBox)
						.text(signedNumber(fitNight))
						.addClass(fitNight < 0 ? "fit_penalty" : fitNight > 0 ? "fit_bonus" : "");
					$(".fit_current .fit_day,.fit_current .fit_night", gunfitBox).show();
					$(".fit_current .fit_unknown", gunfitBox).hide();
				}
				const totalFit = data.shipObj.shellingGunFitAccuracy();
				$(".fit_total .value", gunfitBox)
					.text(signedNumber(Math.qckInt("floor", totalFit, 1)));
				gunfitBox.off("click").on("click", function(e){
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "mstship-{0}-gunfit".format(data.shipObj.masterId)
					})).execute();
					e.stopPropagation();
				});
				gunfitBox.show();
			} else {
				gunfitBox.hide();
			}
			
			// only show OASW if gun fit not available
			if (data.oaswPower !== false && data.gunFit === false) {
				$(".activity_gunfit .oasw .oasw_power .value")
					.text(Math.qckInt("floor", data.oaswPower, 1));
				$(".activity_gunfit .oasw").show();
			} else {
				$(".activity_gunfit .oasw").hide();
			}
			
			if (data.shipAacis.length > 0) {
				$(".activity_gunfit .aaciList").empty();
				$.each(data.shipAacis, function(idx, aaciObj) {
					const aaciBox = $("#factory .aaciPattern").clone();
					$(".apiId", aaciBox).text(aaciObj.id);
					if(aaciObj.icons[0] > 0) {
						$(".shipIcon img", aaciBox)
							.attr("src", KC3Meta.shipIcon(aaciObj.icons[0]) )
							.attr("title", KC3Meta.aacitype(aaciObj.id)[0] || "")
							.lazyInitTooltip();
					} else {
						$(".shipIcon img", aaciBox).hide();
					}
					if(aaciObj.icons.length > 1) {
						for(let i = 1; i < aaciObj.icons.length; i++) {
							const equipIcon = String(aaciObj.icons[i]).split(/[+-]/);
							$("<img/>")
								.attr("src", "/assets/img/items/" + equipIcon[0] + ".png")
								.attr("title", KC3Meta.aacitype(aaciObj.id)[i] || "")
								.lazyInitTooltip()
								.appendTo($(".equipIcons", aaciBox));
							if(equipIcon.length>1) {
								$('<img/>')
									.attr("src", "/assets/img/items/" + equipIcon[1] + ".png")
									.addClass(aaciObj.icons[i].indexOf("-")>-1 ? "minusIcon" : "plusIcon")
									.appendTo($(".equipIcons", aaciBox));
							}
						}
					}
					$(".fixed", aaciBox).text("+{0}".format(aaciObj.fixed));
					$(".modifier", aaciBox).text("x{0}".format(aaciObj.modifier));
					if(idx === 0) aaciBox.addClass("triggerable");
					aaciBox.appendTo(".activity_gunfit .aaciList");
				});
				$(".activity_gunfit .aaciList").off("click").on("click", function(e){
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "mstship-{0}-aaci".format(data.shipObj.masterId)
					})).execute();
					e.stopPropagation();
				});
				$(".activity_gunfit .aaci").show();
			} else {
				$(".activity_gunfit .aaci").hide();
			}
			
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_gunfit").fadeIn(500);
		},
		
		shipDoubleClickFunction: function(e) {
			var id = $(this).data("masterId");
			if(id > 0){
				(new RMsg("service", "strategyRoomPage", {
					tabPath: "mstship-{0}".format(id)
				})).execute();
			}
			return false;
		},
		
		gearDoubleClickFunction: function(e) {
			var id = $(this).data("masterId");
			if(id > 0){
				(new RMsg("service", "strategyRoomPage", {
					tabPath: "mstgear-{0}".format(id)
				})).execute();
			}
			return false;
		}
	};

	function updateHQEXPGained(ele,newDelta) {
		var
			maxHQ  = Object.keys(KC3Meta._exp).map(function(a){return parseInt(a);}).reduce(function(a,b){return a>b?a:b;}),
			hqDt = (PlayerManager.hq.level>=maxHQ ? 3 : ConfigManager.hqExpDetail),
			hqt  = KC3Meta.term("HQExpAbbrev" + hqDt);
		return ele
			.attr("data-exp",hqt)
			.attr("data-exp-gain",(function(x){
				if(newDelta !== undefined)
					return newDelta;
				else if ((ele.attr("data-exp-gain")||"").length > 0)
					return KC3SortieManager.hqExpGained;
				else
					return "";
			}()))
			.text( PlayerManager.hq.exp[hqDt].toLocaleString() );
	}

	function CraftGearStats(MasterItem, StatProperty, Code){
		if(parseInt(MasterItem["api_"+StatProperty], 10) !== 0){
			var thisStatBox = $("#factory .equipStat").clone().appendTo(".module.activity .activity_crafting .equipStats");

			$("img", thisStatBox).attr("src", "../../../../assets/img/stats/"+Code+".png");
			$(".equipStatText", thisStatBox).text( MasterItem["api_"+StatProperty] );
		}
	}

	function buildContactPlaneSpan(fcontactId, fcontact, econtactId, econtact) {
		var fContactIcon = null,
			eContactIcon = null,
			contactSpan = $("<span/>");
		if(fcontactId > 0){
			var fcpMaster = KC3Master.slotitem(fcontactId);
			fContactIcon = $("<img />")
				.attr("src", "../../../../assets/img/items/"+fcpMaster.api_type[3]+".png")
				.attr("title", KC3Meta.gearName(fcpMaster.api_name));
		}
		if(econtactId > 0){
			var ecpMaster = KC3Master.slotitem(econtactId);
			eContactIcon = $("<img />")
				.attr("src", "../../../../assets/img/items/"+ecpMaster.api_type[3]+".png")
				.attr("title", KC3Meta.gearName(ecpMaster.api_name));
		}
		contactSpan
			.append(!!fContactIcon ? fContactIcon : fcontact)
			.append(KC3Meta.term("BattleContactVs"))
			.append(!!eContactIcon ? eContactIcon : econtact);
		return contactSpan;
	}

	function updateMapGauge(gaugeDmg, fsKill, noBoss) {
		// Map Gauge and status
		var thisMapId = KC3SortieManager.getSortieMap().join(''),
			thisMap   = KC3SortieManager.getCurrentMapData(),
			mapHP     = 0,
			onBoss    = KC3SortieManager.currentNode().isBoss(),
			depleteOK = onBoss || !!noBoss;

		// Normalize Parameters
		fsKill = !!fsKill;
		gaugeDmg = (gaugeDmg || 0) * (depleteOK);

		if(Object.keys(thisMap).length > 0){
			$(".module.activity .map_info").removeClass("map_finisher");
			if( thisMap.clear ){
				$(".module.activity .map_hp").text( KC3Meta.term("BattleMapCleared") );
				$(".module.activity .map_gauge .curhp").css('width','0%');
			}else{
				var requireFinisher = false;

				// If HP-based gauge
				if(typeof thisMap.maxhp != "undefined"){
					// Reduce current map HP with known gauge damage given
					mapHP = thisMap.curhp - gaugeDmg;
					// Normalize the gauge until flagship sinking flag
					mapHP = Math.max(mapHP,!fsKill);

					var rate = [mapHP,thisMap.curhp].sort(function(a,b){
						return b-a;
					}).map(function(x){
						return (x/thisMap.maxhp)*100;
					});

					console.debug("Map HP:",thisMap.curhp,thisMap.baseHp,rate[0],rate[1]);
					$(".module.activity .map_hp").text( thisMap.curhp + " / " + thisMap.maxhp );
					$(".module.activity .map_gauge")
						.find('.nowhp').css("width", (rate[0])+"%").end()
						.find('.curhp').css("width", (rate[1])+"%").end();

					requireFinisher = (thisMap.curhp <= thisMap.baseHp);
				// If kill-based gauge
				}else{
					var totalKills = KC3Meta.gauge( thisMapId );
					console.debug("Map " + thisMapId + " total kills:", totalKills);
					var
						killsLeft  = totalKills - thisMap.kills + (!onBoss && !!noBoss),
						postBounty = killsLeft - (depleteOK && fsKill);
					if(totalKills){
						$(".module.activity .map_hp").text( killsLeft + " / " + totalKills + KC3Meta.term("BattleMapKills"));
						$(".module.activity .map_gauge")
							.find('.curhp').css("width", ((postBounty/totalKills)*100)+"%").end()
							.find('.nowhp').css("width", ( (killsLeft/totalKills)*100)+"%").end();

						requireFinisher = (killsLeft <= 1);
					}else{
						$(".module.activity .map_hp").text( KC3Meta.term("BattleMapNotClear") );
					}
				}

				if(requireFinisher){
					(function(){
						var infoElm = $(".module.activity .map_info");
						infoElm.addClass("map_finisher");
						if(!ConfigManager.info_blink_gauge)
							infoElm.addClass("noBlink").removeClass("use-gpu");
						else
							infoElm.addClass("use-gpu").removeClass("noBlink");
						$(".module.activity .map_hp").text(KC3Meta.term("StrategyEvents1HP"));
					})();
				}
			}
		}else{
			$(".module.activity .map_hp").text( KC3Meta.term("BattleMapNoHpGauge") );
		}
	}

	function UpdateRepairTimerDisplays(docking, akashi){
		var
			akashiTick = [false, false, false],
			dockElm = $(".module.status .status_docking .status_text"),
			koskElm = $(".module.status .status_akashi .status_text");
		if(typeof docking === "object") {
			akashi     = docking.akashi;
			akashiTick = docking.akashiCheck;
			docking    = docking.docking;
		}
		if(typeof docking !== "undefined") dockElm.data("value", Math.ceil(docking));
		if(typeof  akashi !== "undefined") koskElm.data("value", Math.ceil( akashi));
		koskElm.data("tick", akashiTick);
		[dockElm, koskElm].forEach(function(elm){
			var title = "";
			elm.removeClass("good bad");
			switch (ConfigManager.timerDisplayType) {
			case 1:
				elm.text(String(elm.data("value")).toHHMMSS());
				break;
			case 2:
				elm.text(String(elm.data("value") || NaN).plusCurrentTime());
				if((elm.data("value") || 0) > 86400) {
					elm.addClass("bad");
					title = KC3Meta.term("PanelRepairMoreDays");
				}
				break;
			}
			if((elm.data("tick") || [false]).every(x => x)) {
				elm.removeClass('bad').addClass("good");
				title = KC3Meta.term("PanelRepairing");
			}
			if(elm === koskElm && !title) {
				title = String(
					Math.hrdInt("floor", PlayerManager.akashiRepair.getElapsed() || 0, 3, 1)
				).toHHMMSS();
			}
			elm.attr("titlealt", title).lazyInitTooltip();
		});
	}
})();
