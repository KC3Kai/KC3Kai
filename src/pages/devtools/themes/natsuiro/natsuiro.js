(function(){
	"use strict";
	_gaq.push(['_trackEvent', "Panel: Natsuiro Theme", 'clicked']);

	// Mathematical Constants
	var LOG3 = Math.log10(3);

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
	var isActiveTabInvoked = false;
	var overrideFocus = false;
	
	// a flag used by Fleet & ExpeditionStart to indicate
	// whether a fleet info update is triggered because of
	// sending out fleets.
	var expeditionStarted = false;
	
	// Critical Animation and Sound Effect
	var critAnim = false;
	var critSound = new Audio("../../../../assets/snd/heart.mp3");
	critSound.loop = true;

	// The URL prefix of current player's KC server
	var myKcServerHost = "";

	// Morale Timer
	var moraleTimerHandler = 0;
	var moraleTimerLastUpdated = 0;
	var moraleClockValue = 100;
	var moraleClockEnd = 0;
	var moraleClockRemain = 0;

	// UI Updating Timer
	var uiTimerHandler = 0;
	var uiTimerLastUpdated = 0;

	// Panel Reload Reminder Timer
	var reloadReminderHandler = 0;

	// QuestList api result cache
	var questCacheResult = [];

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
		// * expedNum: 1..45, 100..105, 110..114, 131..132, 141
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
			fillExpedConfDefaultGreatSuccess(...Array.numbers(1, 45));
			fillExpedConfDefaultGreatSuccess(...Array.numbers(100, 105));
			fillExpedConfDefaultGreatSuccess(...Array.numbers(110, 114));
			fillExpedConfDefaultGreatSuccess(131, 132, 141);
			localStorage.expedTab = JSON.stringify( data );
		} else {
			data = JSON.parse( localStorage.expedTab );
			// add default GS config for new added expeditions
			// * extended since 2017-10-18: 100~102 display name A1~A3 for World 1
			// * extended since 2017-10-25: 110~111 B1~B2 for World 2
			// * extended since 2019-07-18: A4, B3, B4 and World 7. Monthly.
			// * extended since 2020-02-07: 45, D1, D2
			// * extended since 2020-03-27: B5, E1 for World 5
			// * extended since 2020-05-20: A5, A6
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
		plannerIsGreatSuccess = (conf.expedConf[selectedExpedition] || {}).greatSuccess || false;
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

				// Morale desktop notification if not on sortie/PvP,
				if(ConfigManager.alert_morale_notif &&
					!(KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP())
				){
					// Play sound if alert sound setting is not none
					if(KC3TimerManager.notifSound){ KC3TimerManager.notifSound.pause(); }
					switch(ConfigManager.alert_type){
						case 1: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/pop.mp3"); break;
						case 2: KC3TimerManager.notifSound = new Audio(ConfigManager.alert_custom); break;
						case 3: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/ding.mp3"); break;
						case 4: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/dong.mp3"); break;
						case 5: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/bell.mp3"); break;
						default: KC3TimerManager.notifSound = false; break;
					}
					if(KC3TimerManager.notifSound){
						KC3TimerManager.notifSound.volume = ConfigManager.alert_volume / 100;
						KC3TimerManager.notifSound.play();
					}
					// Send desktop notification
					(new RMsg("service", "notify_desktop", {
						notifId: "morale",
						data: {
							type: "basic",
							title: KC3Meta.term("DesktopNotifyMoraleTitle"),
							message: KC3Meta.term("DesktopNotifyMoraleMessage"),
							iconUrl: "../../assets/img/ui/morale.png"
						},
						tabId: chrome.devtools.inspectedWindow.tabId
					})).execute();
					// Focus game tab if settings enabled
					if(ConfigManager.alert_focustab){
						(new RMsg("service", "focusGameTab", {
							tabId: chrome.devtools.inspectedWindow.tabId
						})).execute();
					}
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
		PlayerManager.loadConsumables();
		KC3ShipManager.load();
		KC3GearManager.load();
		KC3SortieManager.load();
		KC3Database.init();
		KC3Translation.execute();
		KC3QuestSync.init();

		myKcServerHost = myKcServerHost || (() => {
			let host = (new KC3Server()).setNum(PlayerManager.hq.server).ip;
			return host ? `http://${host}` : "";
		})();

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

		// Panel customizations: panel opacity
		$(".wrapper_bg").css("opacity", ConfigManager.pan_opacity / 100);
		$(".module.activity .activity_tab").css("background", ConfigManager.pan_box_bcolor);
		$(".module.activity .activity_body").css("background", ConfigManager.pan_box_bcolor);
		$(".module.fleet").css("background", ConfigManager.pan_shiplist_bg);
		$(".ship_img,.timer-img img").css("background", ConfigManager.pan_ship_icon_bg);
		$(".ship_img,.timer-img img").css("border", "1px solid "+ ConfigManager.pan_ship_icon_border);

		// Some text or other elements aren't desirable to drop a shadow from, so these were selected manually.
		const shadowDirStr = (
			  "-1px -1px 1px "+ConfigManager.pan_drop_shadow
			+", 0px -1px 1px "+ConfigManager.pan_drop_shadow
			+", 1px -1px 1px "+ConfigManager.pan_drop_shadow
			+", -1px 0px 1px "+ConfigManager.pan_drop_shadow
			+", 1px 0px 1px "+ConfigManager.pan_drop_shadow
			+", -1px 1px 1px "+ConfigManager.pan_drop_shadow
			+", 0px 1px 1px "+ConfigManager.pan_drop_shadow
			+", 1px 1px 1px "+ConfigManager.pan_drop_shadow
		);
		$(".module.activity,.airbase,.base_plane_col,.module.admiral,.status_text,.summary_box,.quest,.ship_name,.ship_type"
			+",.lship .ship_level,.sship .ship_level,.ship_hp_text,.ship_exp_label,.lship .ship_exp_next,.sship .ship_exp_next,.ship_gear_slot")
			.css("text-shadow", shadowDirStr);
		$(".quest_color,.ship_exp_bar,.ship_gear_icon")
			.css("box-shadow", shadowDirStr);
		// Either share moonlight config key for HP bar metrics
		$(".ship_hp_box .ship_hp_bar_metrics").toggle(ConfigManager.pan_moon_bar_style !== "flats" && ConfigManager.pan_moon_bar_style !== "natsuiro");

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
		var customCSS = document.createElement("style");
		customCSS.type = "text/css";
		customCSS.id = "pan_custom_css";
		customCSS.innerHTML = ConfigManager.pan_custom_css;
		$("head").append(customCSS);

		const updateShipTooltipStatsIconset = () => {
			$(".ship_face_tooltip .stat_icon img").each((_, img) => {
				$(img).attr("src", KC3Meta.statIcon(
					$(img).parent().data("stat"), ConfigManager.info_stats_iconset
				));
			});
			$(".ship_face_tooltip").data("statsIconset", ConfigManager.info_stats_iconset);
		};
		updateShipTooltipStatsIconset();

		// Listen config key changed
		window.addEventListener("storage", function({key, timeStamp, url}){
			if(key === ConfigManager.keyName()) {
				ConfigManager.load();
				console.debug("Reload ConfigManager caused by", (url || "").match(/\/\/[^\/]+\/([^\?]+)/)[1]);

				if($("#pan_custom_css").html() !== ConfigManager.pan_custom_css){
					$("#pan_custom_css").html(ConfigManager.pan_custom_css);
				}
				if($(".ship_face_tooltip").data("statsIconset") != ConfigManager.info_stats_iconset){
					updateShipTooltipStatsIconset();
				}
				$(".module.controls .btn_alert_toggle").toggleClass("disabled",
					!ConfigManager.alert_taiha || !ConfigManager.alert_taiha_sound);
				$(".ship_hp_box .ship_hp_bar_metrics").toggle(
					ConfigManager.pan_moon_bar_style !== "flats" && ConfigManager.pan_moon_bar_style !== "natsuiro"
				);
				updateQuestActivityTab();
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

			const tabId = chrome.devtools.inspectedWindow.tabId;
			const doScreenshot = function() {
				// Tell service to pass a message to gamescreen on inspected window to get a screenshot
				(new RMsg("service", "screenshot", {
					tabId: tabId,
					playerName: PlayerManager.hq.name
				}, function(response){
					$(".module.controls .btn_ss1").removeClass("active");
					isTakingScreenshot = false;
				})).execute();
			};
			// Check if permission has been granted first
			if(!isActiveTabInvoked){
				(new RMsg("service", "checkPermission", {
					tabId: tabId
				}, function(response){
					if(response && response.value){
						isActiveTabInvoked = true;
						doScreenshot();
					} else {
						NatsuiroListeners.ModalBox({
							title: KC3Meta.term("PanelPermissionTitle"),
							message: KC3Meta.term("PanelPermissionMessage"),
						});
						isActiveTabInvoked = false;
						$(".module.controls .btn_ss1").removeClass("active");
						isTakingScreenshot = false;
					}
				})).execute();
			} else {
				doScreenshot();
			}
		});

		// Export button
		$(".module.controls .btn_export").on("click", function(){
			window.open("http://www.kancolle-calc.net/deckbuilder.html?predeck=".concat(encodeURI(
				JSON.stringify(PlayerManager.prepareDeckbuilder())
				)));
		});

		const prepareBattleLogsData = function(){
			// Don't pop up if a battle has not started yet
			if( !(KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP())
				|| KC3SortieManager.countNodes() < 1) { return false; }
			const node = KC3SortieManager.currentNode();
			if(node.type !== "battle"
				|| !(node.battleDay || node.battleNight)) { return false; }
			const isPvP = node.isPvP;
			const sortie = {
				id: KC3SortieManager.isOnSavedSortie() && KC3SortieManager.onSortie || (isPvP ? "TBD" : "???"),
				diff: KC3SortieManager.map_difficulty,
				world: isPvP ? 0 : KC3SortieManager.map_world,
				mapnum: KC3SortieManager.map_num,
				fleetnum: KC3SortieManager.fleetSent,
				combined: PlayerManager.combinedFleet,
				fleet1: PlayerManager.fleets[0].sortieJson(),
				fleet2: PlayerManager.fleets[1].sortieJson(),
				fleet3: PlayerManager.fleets[2].sortieJson(),
				fleet4: PlayerManager.fleets[3].sortieJson(),
				support1: isPvP ? 0 : KC3SortieManager.getSupportingFleet(false),
				support2: isPvP ? 0 : KC3SortieManager.getSupportingFleet(true),
				lbas: isPvP ? [] : KC3SortieManager.getWorldLandBases(KC3SortieManager.map_world, KC3SortieManager.map_num),
				battles: [node.buildBattleDBData()]
			};
			return sortie;
		};
		const openBattleLogsWindow = function(data, isPopup){
			try {
				const url = "https://kc3kai.github.io/kancolle-replay/battleText.html#" + JSON.stringify(data);
				const ref = window.open(url, "battle", (!isPopup ? undefined : "width=640,height=480,resizeable,scrollbars"));
				if(ref && !ref.closed){
					// Update hash with latest battle data even if window already opened
					// this might not work for all browser versions as a vulnerability to bypass CORS
					ref.location.replace(url);
					// Switch focus to the window if possible
					if(ref.focus) ref.focus();
				}
			} catch (e) {
				console.warn("Failed to open battle logs", e);
			}
		};
		// Open text-based battle replayer in new tab or popup window
		$(".module.activity .map_world").addClass("hover").on("click", function(e){
			const data = prepareBattleLogsData();
			if(data) openBattleLogsWindow(data, e.altKey);
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
			plannerIsGreatSuccess = (conf.expedConf[selectedExpedition] || {}).greatSuccess || false;
			ExpedTabUpdateConfig();
			NatsuiroListeners.Fleet();
			NatsuiroListeners.UpdateExpeditionPlanner();
		});

		// Fleet selection
		$(".module.controls .fleet_num").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(".module.controls .fleet_rengo").removeClass("active");
			$(".module.controls .fleet_lbas").removeClass("active");
			$(this).addClass("active");
			selectedFleet = parseInt( $(this).text(), 10);
			ExpedTabApplyConfig();
			NatsuiroListeners.Fleet();
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

		// Scrollable control buttons
		$(".module.controls .scroll_btn").on("click", function(){
			var buttonCount = $(".module.controls .control_btn").length;
			var buttonSize = $(".module.controls .control_btn").outerWidth(true);
			var containerSize = $(".module.controls .scrollable").outerWidth(true);
			var maxLeft = buttonSize * (buttonCount - Math.floor(containerSize / buttonSize));
			var currentLeft = $(".module.controls .scrollable").scrollLeft();
			var goLeft = $(this).hasClass("scroll_left");
			var newLeft = goLeft ?
				Math.max(currentLeft - buttonSize, 0) :
				Math.min(currentLeft + buttonSize, maxLeft);
			$(".module.controls .scrollable").scrollLeft(newLeft);
			$(".module.controls .scroll_left").toggleClass("disabled", newLeft <= 0);
			$(".module.controls .scroll_right").toggleClass("disabled", newLeft >= maxLeft);
		});

		// Resize window to 1200x720
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
					.attr("src", "../../../../assets/img/ui/mute{0}.png".format(isMuted ? "-x" : ""));
			})).execute();
		});

		// Taiha Alert toggle button
		$(".module.controls .btn_alert_toggle").on("click", function (){
			if(critSound.paused) {
				if($(this).hasClass("disabled")) return;
				NatsuiroListeners.Fleet();
			} else {
				critSound.pause();
			}
		}).toggleClass("disabled", !ConfigManager.alert_taiha || !ConfigManager.alert_taiha_sound);

		// Reload subtitle quotes
		$(".module.controls .btn_reload_quotes").on("click", function(){
			// TODO request latest quotes.json for current lang from remote repo
			// Tell game screen tab use latest meta
			(new RMsg("service", "reloadMeta", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				type: "Quotes"
			})).execute();
			// TODO add UI response to show reloading status
		});

		// Reload meta of quests
		$(".module.controls .btn_reload_quests").on("click", function(){
			// TODO request latest quests.json for both EN and current lang from remote repo
			KC3Meta.reloadQuests();
			// Tell game screen tab use latest meta
			(new RMsg("service", "reloadMeta", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				type: "Quests"
			})).execute();
			// TODO add UI response to show reloading status
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

		// Restore build docks timer if panel reopened, not from game start
		PlayerManager.setBuildDocksByCache();
		// Update Timer UIs
		checkAndRestartUiTimer();

		// Devbuild: auto-activate dashboard while designing
		// Activate();

		// Start Network listener
		KC3Network.initConfigs();
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
					$(".module.controls .btn_mute img").attr("src", "../../../../assets/img/ui/mute-x.png");
				} else if(ConfigManager.mute_game_tab) {
					(new RMsg("service", "toggleSounds", {
						tabId: chrome.devtools.inspectedWindow.tabId
					}, function(isMuted){
						$(".module.controls .btn_mute img")
							.attr("src", "../../../../assets/img/ui/mute{0}.png".format(isMuted ? "-x" : ""));
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
		$(".module.controls .scrollable").scrollLeft(0);
		$(".module.controls .scroll_left").addClass("disabled");
		$(".module.controls .scroll_right").removeClass("disabled");
	}

	function clearSortieData(){
		$(".module.activity .activity_box").hideChildrenTooltips();
		$(".module.activity .activity_battle").css("opacity", "0.25");
		$(".module.activity .map_world").text("").attr("title", "").removeClass("debuffed");
		$(".module.activity .map_info").removeClass("map_finisher");
		$(".module.activity .map_gauge *:not(.clear)").css("width", "0%");
		$(".module.activity .map_hp").text("");
		$(".module.activity .sortie_nodes .extra_node").remove();
		$(".module.activity .sortie_nodes").removeAttr("style");
		$(".module.activity .sortie_node").text("").removeAttr("title")
			.removeClass("nc_battle nc_resource nc_maelstrom nc_select nc_avoid long_name")
			.removeClass("special_cutin")
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
		$(".module.activity .abyss_ship").removeClass("sunk");
		$(".module.activity .abyss_ship").removeData("masterId").off("dblclick");
		$(".module.activity .abyss_combined").hide();
		$(".module.activity .abyss_single").show();
		$(".module.activity .abyss_ship").hide();
		$(".module.activity .abyss_hp").hide().removeClass("sunk");
		$(".module.activity .sink_icons .sunk").removeClass("shown safe");
		$(".module.activity .battle_eformation img").attr("src", "../../../../assets/img/ui/empty.png");
		$(".module.activity .battle_eformation").attr("title", "").lazyInitTooltip();
		$(".module.activity .battle_eformation").css("-webkit-transform", "rotate(0deg)");
		$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support.png");
		$(".module.activity .battle_support").attr("titlealt", KC3Meta.term("BattleSupportExped")).lazyInitTooltip();
		$(".module.activity .battle_support .support_lbas").hide();
		$(".module.activity .battle_support .support_exped").hide();
		$(".module.activity .battle_fish img").attr("src", "../../../../assets/img/ui/map_drop.png").removeClass("rounded");
		$(".module.activity .battle_fish").attr("title", KC3Meta.term("BattleItemDrop")).lazyInitTooltip();
		$(".module.activity .battle_aaci img").attr("src", "../../../../assets/img/ui/dark_aaci.png");
		$(".module.activity .battle_aaci").attr("title", KC3Meta.term("BattleAntiAirCutIn")).lazyInitTooltip();
		$(".module.activity .battle_night img").removeClass("hover").off("dblclick");
		$(".module.activity .battle_night img").attr("src", "../../../../assets/img/ui/dark_yasen.png");
		$(".module.activity .battle_night").attr("title", KC3Meta.term("BattleNightNeeded")).lazyInitTooltip();
		$(".module.activity .battle_rating img").attr("src", "../../../../assets/img/ui/dark_rating.png").css("opacity", "");
		$(".module.activity .battle_rating").attr("title", KC3Meta.term("BattleRating")).lazyInitTooltip();
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
		$(".module.activity .battle_planes .fighter_ally .plane_icon img").attr("src", KC3Meta.itemIcon(6));
		$(".module.activity .battle_planes .fighter_enemy .plane_icon img").attr("src", KC3Meta.itemIcon(6));
		$(".module.activity .battle_planes .bomber_ally .plane_icon img").attr("src", KC3Meta.itemIcon(7));
		$(".module.activity .battle_planes .bomber_enemy .plane_icon img").attr("src", KC3Meta.itemIcon(7));
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
			updateQuestActivityTab(true);

			checkAndRestartMoraleTimer();
			checkAndRestartUiTimer();

			if(!KC3Master.available){
				window.location.href = "../../nomaster.html";
				return false;
			}

			if(ConfigManager.backupReminder > 0) {
				const lastBackup = Number(localStorage.lastBackupTime) || 0;
				const lastReminder = Number(localStorage.lastBackupReminder) || 0;
				const currentTime = Date.now();
				if(currentTime > lastReminder + ConfigManager.backupReminder) {
					const days = !lastBackup ? "???" :
						Math.floor((currentTime - lastBackup) / (1000 * 60 * 60 * 24));
					this.ModalBox({
						title: KC3Meta.term("BackupReminderTitle"),
						message: KC3Meta.term("BackupReminderMessage").format(days),
						link: KC3Meta.term("BackupReminderLink"),
						onClick: function(e){
							(new RMsg("service", "strategyRoomPage", {
								tabPath: "databackup"
							})).execute();
							return false;
						}
					});
					localStorage.lastBackupReminder = currentTime;
				}
			}

			if(ConfigManager.pan_reloadreminder_start > 0) {
				if(!reloadReminderHandler) {
					const timeScale = 1000 * 60;
					const showReminder = () => {
						this.ModalBox({
							title: KC3Meta.term("PanelReloadReminderTitle"),
							message: KC3Meta.term("PanelReloadReminderMessage"),
							link: KC3Meta.term("PanelReloadReminderLink"),
							onClick: function(e){
								(new RMsg("service", "openExtensionPage", {
									path: "pages/settings/settings.html#panel"
								})).execute();
								return false;
							}
						});
					};
					console.log("Panel reload reminder enabled", ConfigManager.pan_reloadreminder_start);
					reloadReminderHandler = setTimeout(() => {
						showReminder();
						if(ConfigManager.pan_reloadreminder_repeat > 0) {
							console.log("Panel reload reminder will repeat every", ConfigManager.pan_reloadreminder_repeat);
							reloadReminderHandler = setInterval(() => {
								if(ConfigManager.pan_reloadreminder_repeat > 0) {
									showReminder();
								} else {
									clearInterval(reloadReminderHandler);
								}
							}, ConfigManager.pan_reloadreminder_repeat * timeScale);
						}
					}, ConfigManager.pan_reloadreminder_start * timeScale);
				}
			} else {
				if(!!reloadReminderHandler) {
					clearTimeout(reloadReminderHandler);
					clearInterval(reloadReminderHandler);
					reloadReminderHandler = 0;
				}
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
			// since Event Summer 2019,
			// api_m2 is set on `/api_battleresult` or `/api_destruction_battle`,
			// to indicate Armor Broken debuff activated for E-3 BOSS.
			// at this timing, SE file 258.mp3 is played, actually, it's a voice line of abyssal boss.
			if (data.api_m2) {
				this.ModalBox({
					title: KC3Meta.term("BossDebuffedTitle"),
					message: KC3Meta.term("BossDebuffedMessage").format(
						KC3Meta.term("BossDebuffedYes")
					)
				});
			// since Event Summer 2016,
			// devs set api_m_flag2 to 1 on port, to play the debuff SE.
			} else if(data.api_m_flag2 === undefined){
				lastApiFlag2 = false;
			} else if(data.api_m_flag2 > 0){
				// so the flag does not indicate state of the debuff,
				// it only indicates: time to play a SE.
				// we cannot detect: is the debuff reset?
				//let isDebuffed = data.api_m_flag2 == 1;

				// since Event Spring 2019 onwards, the home port SE (215.mp3) is played,
				// whenever any step for unlocking a gimmick is completed.
				// and secretary's Equip(3) line (voicenum 26) played instead of regular Return line.
				// see `main.js#InitializeTask.prototype._playVoice`
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
			const homePortTimeTips = "{0}: {1}".format(
				KC3Meta.term("PanelLastHomePort"),
				!PlayerManager.hq.lastPortTime ? "?" :
					new Date(PlayerManager.hq.lastPortTime * 1000).format("mm-dd HH:MM:ss")
			);
			const remainingTime = KC3Calc.remainingTimeUntilNextResets(undefined,
				PlayerManager.hq.monthlyExpedResetTime * 1000);
			const resetTimeTips = "{0}: {1}\n{2}: {3}\n{4}: {5}\n{6}: {7}".format(
				KC3Meta.term("MenuPvPReset"), remainingTime.pvp,
				KC3Meta.term("MenuQuestReset"), remainingTime.quest,
				KC3Meta.term("MenuQuarterlyReset"), remainingTime.quarterly,
				KC3Meta.term("MenuMonthlyExpedReset"), remainingTime.exped
			);
			if(ConfigManager.rankPtsMode === 2){
				$(".admiral_rank").text(PlayerManager.hq.getRankPoints()
					.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
					+ KC3Meta.term("HQRankPoints")
				).attr("title", [KC3Meta.term("HQRankPointsTip")
					.format(!PlayerManager.hq.rankPtLastTimestamp ? "?"
						: new Date(PlayerManager.hq.rankPtLastTimestamp).format("mm-dd HH:MM:ss")) + "\n",
					homePortTimeTips,
					"{0}: {1}".format(KC3Meta.term("MenuRankPtsCutoff"), remainingTime.rank),
					resetTimeTips].join("\n")
				);
			} else {
				$(".admiral_rank").text(PlayerManager.hq.rank).attr("title",
					[homePortTimeTips, resetTimeTips].join("\n"));
			}
			$(".admiral_lvval").text( PlayerManager.hq.level );
			$(".admiral_lvbar").css({width: Math.round(PlayerManager.hq.exp[0]*58)+"px"});
			updateHQEXPGained($(".admiral_lvnext"));
		},

		Consumables: function(data){
			$(".activity_basic .consumables").hideChildrenTooltips();
			const getWarnRscCap = max => Math.floor(max * (ConfigManager.alert_rsc_cap / 100)) || Infinity;
			const fc200 = PlayerManager.consumables.furniture200 || 0,
				fc400 = PlayerManager.consumables.furniture400 || 0,
				fc700 = PlayerManager.consumables.furniture700 || 0,
				fcboxestot = fc200 * 200 + fc400 * 400 + fc700 * 700;
			$(".count_fcoin")
				.text( KC3Meta.formatNumber(PlayerManager.consumables.fcoin || 0) )
				.toggleClass("hardCap", PlayerManager.consumables.fcoin >= getWarnRscCap(PlayerManager.maxCoin))
				.attr("title", KC3Meta.term("ConsumablesFCoinBoxes").format(...[fc200, fc200 * 200, fc400, fc400 * 400, fc700, fc700 * 700,
					fcboxestot, fcboxestot + (PlayerManager.consumables.fcoin || 0)].map((n) => KC3Meta.formatNumber(n)))).lazyInitTooltip();
			$(".count_buckets")
				.text( KC3Meta.formatNumber(PlayerManager.consumables.buckets || 0) )
				.toggleClass("hardCap", PlayerManager.consumables.buckets >= getWarnRscCap(PlayerManager.maxConsumable));
			$(".count_screws")
				.text( KC3Meta.formatNumber(PlayerManager.consumables.screws || 0) )
				.toggleClass("hardCap", PlayerManager.consumables.screws >= getWarnRscCap(PlayerManager.maxConsumable));
			$(".count_torch")
				.text( KC3Meta.formatNumber(PlayerManager.consumables.torch || 0) )
				.toggleClass("hardCap", PlayerManager.consumables.torch >= getWarnRscCap(PlayerManager.maxConsumable));
			$(".count_devmats")
				.text( KC3Meta.formatNumber(PlayerManager.consumables.devmats || 0) )
				.toggleClass("hardCap", PlayerManager.consumables.devmats >= getWarnRscCap(PlayerManager.maxConsumable));
			if(Array.isArray(PlayerManager.hq.lastMaterial)){
				// Regen for fuel, ammo, steel: +3 every 3 minutes. bauxite +1 / 3mins
				const roundUpTo3Mins = m => String(60 * (m + (m % 3 ? 3 - m % 3 : 0)));
				const regenCap = PlayerManager.hq.getRegenCap();
				const fuel = PlayerManager.hq.lastMaterial[0],
					ammo = PlayerManager.hq.lastMaterial[1],
					steel = PlayerManager.hq.lastMaterial[2],
					bauxite = PlayerManager.hq.lastMaterial[3];
				$(".count_fuel")
					.text( KC3Meta.formatNumber(fuel) )
					.toggleClass("regenCap", fuel >= regenCap)
					.toggleClass("hardCap", fuel >= getWarnRscCap(PlayerManager.maxResource))
					.attr("title", fuel >= regenCap ? "\u27A4" + KC3Meta.formatNumber(regenCap) :
						"{0} \u27A4{1}".format(roundUpTo3Mins(regenCap - fuel).toHHMMSS(), KC3Meta.formatNumber(regenCap)))
					.lazyInitTooltip();
				$(".count_steel")
					.text( KC3Meta.formatNumber(steel) )
					.toggleClass("regenCap", steel >= regenCap)
					.toggleClass("hardCap", steel >= getWarnRscCap(PlayerManager.maxResource))
					.attr("title", steel >= regenCap ? "\u27A4" + KC3Meta.formatNumber(regenCap) :
						"{0} \u27A4{1}".format(roundUpTo3Mins(regenCap - steel).toHHMMSS(), KC3Meta.formatNumber(regenCap)))
					.lazyInitTooltip();
				$(".count_ammo")
					.text( KC3Meta.formatNumber(ammo) )
					.toggleClass("regenCap", ammo >= regenCap)
					.toggleClass("hardCap", ammo >= getWarnRscCap(PlayerManager.maxResource))
					.attr("title", ammo >= regenCap ? "\u27A4" + KC3Meta.formatNumber(regenCap) :
						"{0} \u27A4{1}".format(roundUpTo3Mins(regenCap - ammo).toHHMMSS(), KC3Meta.formatNumber(regenCap)))
					.lazyInitTooltip();
				$(".count_bauxite")
					.text( KC3Meta.formatNumber(bauxite) )
					.toggleClass("regenCap", bauxite >= regenCap)
					.toggleClass("hardCap", bauxite >= getWarnRscCap(PlayerManager.maxResource))
					.attr("title", bauxite >= regenCap ? "\u27A4" + KC3Meta.formatNumber(regenCap) :
						"{0} \u27A4{1}".format(String(180 * (regenCap - bauxite)).toHHMMSS(), KC3Meta.formatNumber(regenCap)))
					.lazyInitTooltip();
			}
			// More pages could be added, see `api_get_member/useitem` in Kcsapi.js, or `PlayerManager.getConsumableById()`
			const firstItemId = PlayerManager.consumables.mackerel ? 68 :
				PlayerManager.consumables.sardine ? 93 :
				PlayerManager.consumables.setsubunBeans ? 90 :
				PlayerManager.consumables.hishimochi ? 62 : 60;
			$(".count_eventItemOrPresent").text(PlayerManager.getConsumableById(firstItemId) || 0)
				.prev().attr("title", KC3Meta.useItemName(firstItemId))
				.children("img").attr("src", `/assets/img/useitems/${firstItemId}.png`);
			// Count all consumable slotitems via GearManager
			const consumableSlotitemMap = {
				"50": { "slotitem":  42 }, // repairTeam
				"51": { "slotitem":  43 }, // repairGoddess
				"66": { "slotitem": 145 }, // ration
				"67": { "slotitem": 146 }, // resupplier
				"69": { "slotitem": 150 }, // mackerelCan
				"76": { "slotitem": 241 }, // rationSpecial
			};
			Object.keys(consumableSlotitemMap).forEach(useitemId => {
				const item = consumableSlotitemMap[useitemId];
				item.attrName = PlayerManager.getConsumableById(useitemId, true);
				item.amount = KC3GearManager.count(g => g.masterId === item.slotitem) || 0;
			});
			// Update simple amount of single useitem (or slotitem) by ID and name (matching with CSS class: `count_` + name)
			const updateCountByUseitemId = (useitemId) => {
				const attrName = PlayerManager.getConsumableById(useitemId, true);
				let amount = PlayerManager.getConsumableById(useitemId) || 0;
				const slotitem = consumableSlotitemMap[useitemId];
				if(slotitem) amount = slotitem.amount;
				$(`.count_${attrName}`).text(amount).prev().attr("title", KC3Meta.useItemName(useitemId));
			};
			// Total items of 1 page should be 3 x 3 for current page layout and styles
			[52, 57, 58, 61, 64, 65, 70, 71, 74, 75, 77, 78, 91, 92].forEach(updateCountByUseitemId);
			// Update amounts of combined counting
			$(".count_repair").text(consumableSlotitemMap[50].amount + consumableSlotitemMap[51].amount)
				.parent().attr("title", "x{0} {1} +\nx{2} {3}".format(
					consumableSlotitemMap[50].amount, KC3Meta.useItemName(50),
					consumableSlotitemMap[51].amount, KC3Meta.useItemName(51)
				));
			$(".count_supply").text([66, 67, 69, 76].map(id => consumableSlotitemMap[id].amount).sumValues())
				.parent().attr("title", "x{0} {1} +\nx{2} {3} +\nx{4} {5} +\nx{6} {7}".format(
					consumableSlotitemMap[67].amount, KC3Meta.useItemName(67),
					consumableSlotitemMap[66].amount, KC3Meta.useItemName(66),
					consumableSlotitemMap[76].amount, KC3Meta.useItemName(76),
					consumableSlotitemMap[69].amount, KC3Meta.useItemName(69)
				));
			$(".count_morale").text((PlayerManager.consumables.mamiya || 0) + (PlayerManager.consumables.irako || 0))
				.parent().attr("title", "x{0} {1} +\nx{2} {3}".format(
					PlayerManager.consumables.mamiya || 0, KC3Meta.useItemName(54),
					PlayerManager.consumables.irako || 0, KC3Meta.useItemName(59)
				));
			// Update 1 more page for food(or any item?) collecting event
			if(KC3Meta.isDuringFoodEvent()){
				[85, 86, 87, 88, 89, 68, 93, 90, 62].forEach(updateCountByUseitemId);
			} else if(ConfigManager.hqInfoPage > ConfigManager.getMaxHqInfoPage()){
				ConfigManager.scrollHqInfoPage();
			}
			$(".consumables").hideChildrenTooltips();
			$(".consumables .consumable").hide();
			$(`.consumables .consumable.page${ConfigManager.hqInfoPage || 1}`).show();
			$(".consumables").createChildrenTooltips();
		},

		ShipSlots: function(data){
			$(".activity_basic .consumables").hideChildrenTooltips();
			const shipCount = KC3ShipManager.count(),
				lockedShipCount = KC3ShipManager.count(s => !!s.lock);

			$(".count_ships")
				.text( shipCount )
				.toggleClass( "danger", (KC3ShipManager.max - shipCount) < 5)
				.toggleClass( "fulled", (KC3ShipManager.max - shipCount) <= 0)
				.attr("title", "\u2764 " + lockedShipCount)
				.lazyInitTooltip();

			$(".max_ships").text( "/"+ KC3ShipManager.max );
		},

		GearSlots: function(data){
			$(".activity_basic .consumables").hideChildrenTooltips();
			const gearCount = KC3GearManager.count(),
				lockedGearCount = KC3GearManager.count(g => !!g.lock);

			$(".count_gear")
				.text( gearCount )
				.toggleClass("danger", (KC3GearManager.max - gearCount) < 20)
				.toggleClass("fulled", (KC3GearManager.max - gearCount) <= 3)
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

		// Trigger when enter quest screen
		QuestList: function (data) {
			$('.quest_filter_button').off('click');
			updateQuestActivityTab();
			if (!ConfigManager.info_quest_activity) {
				return;
			}
			$("#atab_quest").trigger("click");

			$('.quest_filter_button').click(function (ev) {
				const target = $(ev.target);
				const isActive = target.hasClass('active');
				$('.quest_filter_button').removeClass('active');
				if (!isActive) {
					target.addClass('active');
				}
				exec();
			});

			questCacheResult.length = 0;
			if (data && data.length) {
				questCacheResult.push(...data);
			}

			exec();

			function exec() {
				const activeFilter = getActiveFilter();
				const allowCategories = getAllowCategories(activeFilter);
				const quests = getFilterQuests(allowCategories);
				loadQuests(quests);
			}

			function getActiveFilter() {
				return Number($('.quest_filter_button.active').attr('filter')) || -1;
			}

			function getAllowCategories(filter) {
				switch (filter) {
					case 1: return [2, 8, 9];
					case 2: return [3];
					case 3: return [4];
					case 4: return [6];
					case 5: return [1, 5, 7];
				}
				return [];
			}

			function getFilterQuests(categories) {
				if (!categories.length) {
					return questCacheResult;
				}
				return questCacheResult.filter(v => categories.includes(v.api_category));
			}

			function loadQuests(quests) {
				const questList = $(".activity_quest .quest_list");
				questList.empty();
				questList.scrollTop();

				quests.forEach((apiQuest, index) => {
					const quest = KC3QuestManager.get(apiQuest.api_no);
					if (!quest) { return; }

					if (index % 5 === 0) {
						$('<div>')
							.addClass('quest_page')
							.text(Math.floor(index / 5) + 1)
							.appendTo(questList);
					}

					const questListItem = $("#factory .quest")
						.clone()
						.toggleClass('activated', quest.status === 2)
						.toggleClass('completed', quest.status === 3)
						.toggleClass('percent50', quest.progress === 1)
						.toggleClass('percent80', quest.progress === 2)
						.appendTo(questList);

					// Quest color box
					$(".quest_color", questListItem)
						.css("background", quest.getColor())
						.data("id", quest.id);

					// Quest title
					if (quest.meta) {
						$(".quest_text", questListItem)
							.text(quest.meta().name)
							.attr("titlealt", KC3QuestManager.buildHtmlTooltip(quest.id, quest.meta(), false, false))
							.lazyInitTooltip();
					} else {
						$(".quest_text", questListItem)
							.text(KC3Meta.term("UntranslatedQuest"))
							.attr("titlealt", KC3Meta.term("UntranslatedQuest"))
							.lazyInitTooltip();
					}

					// Quest track
					$(".quest_track", questListItem).remove();
				});
			}

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
				$(".quest_track", questBox).text(quest.outputShort(false, true))
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

			// TAIHA ALERT CONDITIONS CHECK
				// is Taiha alert setting enabled?
			const isTaihaToBeAlerted = ConfigManager.alert_taiha
				// not PvP?
				&& !KC3SortieManager.isPvP()
				// check states of fleet members
				&& PlayerManager.fleets.filter((obj, i) => {
						const cf = PlayerManager.combinedFleet,   // Marks combined flag
							fs = KC3SortieManager.fleetSent,      // Which fleet that requires to focus out
							so = KC3SortieManager.isOnSortie();   // Is it on sortie or not? if not, focus all fleets.
						return !so || ((cf && fs === 1) ? i <= 1 : i == fs - 1);
					})
					.map((fleetObj) => fleetObj.ships.slice(1))  // Convert to non-flagship ID arrays
					.reduce((acc, arr) => acc.concat(arr))       // Join IDs into an array
					.filter((shipId) => shipId > 0)              // Remove ID -1
					.map((shipId) => KC3ShipManager.get(shipId)) // Convert to Ship instance
					.some((shipObj) => {
						// if any ship is Taiha, but not flee / no damecon found / locked?
						return !shipObj.isAbsent()
							&& shipObj.isTaiha()
							&& (!ConfigManager.alert_taiha_damecon || shipObj.findDameCon().pos < 0)
							&& (!ConfigManager.alert_taiha_unlock || !!shipObj.lock);
					})
				// not disabled at Home Port?
				&& (KC3SortieManager.isOnSortie() || !ConfigManager.alert_taiha_homeport);

			if(isTaihaToBeAlerted){
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

				if(ConfigManager.alert_taiha_sound) {
					const critSoundSrc = ConfigManager.alert_taiha_sound_src.trim();
					const isSoundCustomized = !!critSoundSrc;
					if(isSoundCustomized && critSound.paused) {
						critSound.pause();
						critSound = new Audio(critSoundSrc);
						critSound.loop = true;
						critSound.play();
					} else if(!isSoundCustomized) {
						// To restore default heartbeat sound?
						if(!critSound.src.includes("/assets/snd/heart.mp3")) {
							critSound.pause();
							critSound = new Audio("/assets/snd/heart.mp3");
							critSound.loop = true;
						}
						critSound.play();
					}
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

			var isSentOut = KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP();
			var thisNode = isSentOut ? KC3SortieManager.currentNode() : {};
			var flarePos = thisNode.flarePos || 0;
			var sortieSpecialCutins = (ConfigManager.info_compass && ConfigManager.info_battle) ? thisNode.sortieSpecialCutins || [] : [];

			// COMBINED
			if(selectedFleet == 5){
				const MainFleet = PlayerManager.fleets[0],
					EscortFleet = PlayerManager.fleets[1];

				// Show ships on main fleet
				$.each(MainFleet.ships, function(index, rosterId){
					if(rosterId > 0){
						let dameConConsumed = false,
							starShellUsed = false,
							noAirBombingDamage = false,
							spCutinUsed = false;
						if(KC3SortieManager.isOnSortie() && KC3SortieManager.fleetSent == 1){
							dameConConsumed = (thisNode.dameConConsumed || [])[index];
						}
						if(isSentOut){
							starShellUsed = (flarePos === index + 1) &&
								!PlayerManager.combinedFleet && KC3SortieManager.fleetSent == 1;
							noAirBombingDamage = KC3SortieManager.fleetSent == 1 &&
								KC3SortieManager.isPlayerNotTakenAirBombingDamage(thisNode, index);
							spCutinUsed = !!sortieSpecialCutins[index] && KC3SortieManager.fleetSent == 1;
						}
						(new KC3NatsuiroShipbox(".sship", rosterId, index, showCombinedFleetBars, dameConConsumed, starShellUsed, noAirBombingDamage))
							.commonElements()
							.defineShort(MainFleet)
							.toggleClass("special_cutin", spCutinUsed)
							.appendTo(".module.fleet .shiplist_main");
					}
				});

				// Show ships on escort fleet
				$.each(EscortFleet.ships, function(index, rosterId){
					if(rosterId > 0){
						let dameConConsumed = false,
							starShellUsed = false,
							noAirBombingDamage = false,
							spCutinUsed = false;
						if(KC3SortieManager.isOnSortie()){
							if(KC3SortieManager.isCombinedSortie()){
								// Send combined fleet, get escort info
								dameConConsumed = (thisNode.dameConConsumedEscort || [])[index];
							} else if(!PlayerManager.combinedFleet && KC3SortieManager.fleetSent == 2){
								// Not combined, but send fleet #2, get regular info
								dameConConsumed = (thisNode.dameConConsumed || [])[index];
							}
						}
						if(isSentOut){
							const is2ndFleetUsed = KC3SortieManager.isCombinedSortie() ||
								(!PlayerManager.combinedFleet && KC3SortieManager.fleetSent == 2);
							starShellUsed = is2ndFleetUsed && (flarePos === index + 1);
							noAirBombingDamage = is2ndFleetUsed &&
								KC3SortieManager.isPlayerNotTakenAirBombingDamage(thisNode, index, KC3SortieManager.isCombinedSortie());
							spCutinUsed = !!sortieSpecialCutins[index] && KC3SortieManager.fleetSent == 2;
						}
						(new KC3NatsuiroShipbox(".sship", rosterId, index, showCombinedFleetBars, dameConConsumed, starShellUsed, noAirBombingDamage))
							.commonElements(true)
							.defineShort(EscortFleet)
							.toggleClass("special_cutin", spCutinUsed)
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
					repairCost: Object.sumValuesByKey(
							MainFleet.calcRepairCost(),
							EscortFleet.calcRepairCost()
						),
					badState: [
						MainFleet.needsSupply(false)|| EscortFleet.needsSupply(false),
						MainFleet.needsSupply(true) || EscortFleet.needsSupply(true) ,
						MainFleet.ship(0).isTaiha() || EscortFleet.ship(0).isTaiha(),
						MainFleet.ship(0).isStriped() || EscortFleet.ship(0).isStriped(),
						MainFleet.needsPlaneSupply() || EscortFleet.needsPlaneSupply(),
					],
					lowestMorale:
						(MainFleet.lowestMorale() < EscortFleet.lowestMorale())
						? MainFleet.lowestMorale() : EscortFleet.lowestMorale(),
					supportPower: 0,
					supportCost: {},
					tpValueSum: MainFleet.calcTpObtain(MainFleet, EscortFleet)
				};

			// SINGLE
			} else {
				const CurrentFleet = PlayerManager.fleets[selectedFleet-1];
				$(".module.controls .fleet_num.active").attr("title", CurrentFleet.name || "");

				// Calculate Highest Repair Times for status indicators
				MainRepairs = CurrentFleet.highestRepairTimes(true);

				// Show ships on selected fleet
				const isSelectedSortiedFleet = (selectedFleet == KC3SortieManager.fleetSent);
				const isSelected2ndFleetOnCombined = (selectedFleet == 2 && KC3SortieManager.isCombinedSortie());
				$.each(CurrentFleet.ships, function(index, rosterId){
					if(rosterId > 0){
						let dameConConsumed = false,
							starShellUsed = false,
							noAirBombingDamage = false,
							spCutinUsed = false;
						if(KC3SortieManager.isOnSortie()){
							if(isSelectedSortiedFleet){
								dameConConsumed = (thisNode.dameConConsumed || [])[index];
							} else if(isSelected2ndFleetOnCombined){
								// Send combined fleet, select and get escort info
								dameConConsumed = (thisNode.dameConConsumedEscort || [])[index];
							}
						}
						if(isSentOut){
							starShellUsed = (flarePos === index + 1) &&
								(isSelectedSortiedFleet || isSelected2ndFleetOnCombined);
							noAirBombingDamage = isSelectedSortiedFleet && KC3SortieManager.isPlayerNotTakenAirBombingDamage(thisNode, index) ||
								isSelected2ndFleetOnCombined && KC3SortieManager.isPlayerNotTakenAirBombingDamage(thisNode, index, true);
							spCutinUsed = !!sortieSpecialCutins[index] && isSelectedSortiedFleet;
						}
						(new KC3NatsuiroShipbox(".lship", rosterId, index, showCombinedFleetBars, dameConConsumed, starShellUsed, noAirBombingDamage))
							.commonElements()
							.defineLong(CurrentFleet)
							.toggleClass("seven", CurrentFleet.countShips() >= 7)
							.toggleClass("special_cutin", spCutinUsed)
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
					repairCost: CurrentFleet.calcRepairCost(),
					badState: [
						CurrentFleet.needsSupply(false) ||
						(
							ConfigManager.alert_supply_exped &&
							!(KC3SortieManager.isOnSortie() && KC3SortieManager.fleetSent == selectedFleet) &&
							!CurrentFleet.isSupplied() &&
							selectedFleet > (1+(!!PlayerManager.combinedFleet)) && selectedFleet < 5
						), // [0]: need fuel/ammo resupply for expedition?
						CurrentFleet.needsSupply(true), // [1]: is fuel/ammo empty?
						CurrentFleet.ship(0).isTaiha(), // [2]: is some ship Taiha?
						false, // [3]: is combined fleet HP bad conditions?
						CurrentFleet.needsPlaneSupply(), // [4]: is any aircraft slot not full?
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
			$(".summary-level .summary_text").text(FleetSummary.lv)
				.attr("title", (fleetNum => {
					let tips = fleetNum > 1 ? "" :
						KC3Meta.term("FirstFleetLevelTip").format(FleetSummary.baseExp.base, FleetSummary.baseExp.s);
					if (fleetNum >= 1 && fleetNum <= 4) {
						const fstats = PlayerManager.fleets[fleetNum - 1].totalStats(true, false, selectedExpedition);
						const fstatsImp = PlayerManager.fleets[fleetNum - 1].totalStats(true, "exped", selectedExpedition);
						// Align with special space char 0xa0 and force to monospaced font
						const formatStatTip = (term, rawStat, impStat) => (
							term.padEnd(5, '\u00a0') +
							String(rawStat).padStart(6, '\u00a0') +
							String(Math.qckInt("floor", impStat, 0)).padStart(6, '\u00a0')
						);
						tips += (!tips ? "" : "\n") + '<span class="monofont">';
						tips += "{0}\u00a0\u00a0\u00a0\u00a0\u00a0-\u2605\u00a0\u00a0\u00a0+\u2605\n".format(KC3Meta.term("ExpedTotalImp"));
						tips += [
							formatStatTip(KC3Meta.term("ExpedTotalFp"), fstats.fp, fstatsImp.fp),
							formatStatTip(KC3Meta.term("ExpedTotalTorp"), fstats.tp, fstatsImp.tp),
							formatStatTip(KC3Meta.term("ExpedTotalAa"), fstats.aa, fstatsImp.aa),
							formatStatTip(KC3Meta.term("ExpedTotalAsw"), fstats.as, fstatsImp.as),
							formatStatTip(KC3Meta.term("ExpedTotalLos"), fstats.ls, fstatsImp.ls)
						].join('\n');
					}
					return tips + "</span>";
				})(selectedFleet)).lazyInitTooltip();
			$(".summary-eqlos .summary_icon img").attr("src",
				"../../../../assets/img/stats/los" + ConfigManager.elosFormula + ".png");
			$(".summary-eqlos .summary_text").text(FleetSummary.elos);
			const isCombinedAirView = selectedFleet === 5 && ConfigManager.air_combined;
			$(".summary-airfp .summary_sub").toggle(isCombinedAirView);
			$(".summary-airfp .summary_text").text(FleetSummary.air)
				.attr("titlealt", KC3Calc.buildFleetsAirstrikePowerText(
					PlayerManager.fleets[selectedFleet-1], undefined, selectedFleet === 5
				) + KC3Calc.buildFleetsContactChanceText(
					PlayerManager.fleets[selectedFleet-1], undefined, selectedFleet === 5,
					isCombinedAirView ? 6 : 4
				)).lazyInitTooltip();
			$(".summary-antiair .summary_icon img")
				.attr("src", KC3Meta.formationIcon(ConfigManager.aaFormation))
				.parent().attr("title", KC3Meta.formationText(ConfigManager.aaFormation) + KC3Meta.term("PanelFormationTip"))
				.lazyInitTooltip();
			$(".summary-antiair .summary_text").text(FleetSummary.antiAir)
				.attr("title", KC3Meta.term("PanelFleetAATip"))
				.lazyInitTooltip();
			$(".summary-speed .summary_text").text(FleetSummary.speed);
			if(ConfigManager.elosFormula > 1){
				// F33 different factors for Phase 1: 6-2(F,H)/6-3(H):x3, 3-5(G)/6-1(E,F):x4
				if(selectedFleet < 5){
					const f33Cn = Array.numbers(1, 4)
						.map(cn => Math.qckInt("floor", PlayerManager.fleets[selectedFleet-1].eLos4(cn), 1));
					$(".summary-eqlos").attr("title",
						"x1={0}\nx2={1}\nx3={2}\nx4={3}"
						.format(f33Cn)
					).lazyInitTooltip();
				// No reference values for combined fleet yet, only show computed values
				} else if(selectedFleet === 5){
					const mainFleet = PlayerManager.fleets[0],
						escortFleet = PlayerManager.fleets[1],
						f33Cn = Array.numbers(1, 5)
							.map(cn => Math.qckInt("floor", mainFleet.eLos4(cn) + escortFleet.eLos4(cn), 1));
					$(".summary-eqlos").attr("title",
						"x1={0}\nx2={1}\nx3={2}\nx4={3}\nx5={4}".format(f33Cn)
					).lazyInitTooltip();
				}
			} else {
				$(".summary-eqlos").attr("title", "");
			}

			// Clear status reminder coloring
			$(".module.status .status_text").removeClass("good bad slotsWarn");
			$(".module.status").hideChildrenTooltips();

			// If fleet status summary is enabled on settings
			if(ConfigManager.info_fleetstat){
				const isSortieFleetsSelected = (KC3SortieManager.isCombinedSortie() ? [1,2,5] :
					KC3SortieManager.fleetSent <= 2 ? [KC3SortieManager.fleetSent, 5] :
					[KC3SortieManager.fleetSent]).includes(selectedFleet);
				// STATUS: RESUPPLY
				if( (FleetSummary.supplied ||
						(KC3SortieManager.isOnSortie() &&
						 isSortieFleetsSelected &&
						 KC3SortieManager.isFullySupplied()
						)
					) &&
					(!FleetSummary.badState[0])
				){
					$(".module.status .status_supply .status_text").text( KC3Meta.term("PanelSupplied") );
					$(".module.status .status_supply img").attr("src", "../../../../assets/img/ui/check.png");
					$(".module.status .status_supply .status_text").addClass("good");
					// If selected fleet view not on sortie, and some aircraft slots not full
					if(FleetSummary.badState[4] &&
						!(KC3SortieManager.isOnSortie() && isSortieFleetsSelected)){
						$(".module.status .status_supply .status_text").removeClass("good").addClass("slotsWarn");
					}
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
						FleetSummary.battleCost.airRaidFuel, FleetSummary.battleCost.airRaidAmmo,
						FleetSummary.battleCost.nightStartFuel, FleetSummary.battleCost.nightStartAmmo,
						FleetSummary.battleCost.aswFuel, FleetSummary.battleCost.aswAmmo,
						FleetSummary.battleCost.ambushFuel, FleetSummary.battleCost.ambushAmmo
					)) + (!FleetSummary.supplyCost.steel ? "" :
						"\n" + KC3Meta.term("PanelConsumedSteel").format(FleetSummary.supplyCost.steel
					)) + (!(FleetSummary.repairCost.fuel || FleetSummary.repairCost.steel) ? "" :
						"\n" + KC3Meta.term("PanelRepairCost").format(FleetSummary.repairCost.fuel, FleetSummary.repairCost.steel))
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
					$(".module.status .status_repair .status_icon").removeClass("enclose");
					$(".module.status .status_repair img").attr("src", "/assets/img/ui/" +
						(FleetSummary.badState[2] ? "estat_bossheavy.png" : "sunk.png")
					);
					$(".module.status .status_repair .status_text")
						.attr("titlealt", "").addClass("bad");
					const fcfInfo = KC3SortieManager.getCurrentFCF();
					// Show some strategy hints if FCF retreating is possible
					if(!FleetSummary.badState[2] && fcfInfo.isAvailable){
						const fcfTips = $("<div/>"),
							iconStyles = {
							"width":"15px", "height":"15px",
							"margin-top":"-3px", "margin-right":"3px"
						};
						$("<img/>").css(iconStyles).css("image-rendering", "auto")
							.attr("src", fcfInfo.shipToRetreat.shipIcon())
							.appendTo(fcfTips);
						fcfTips.append("{0} Lv {1} {2}\n".format(
							fcfInfo.shipToRetreat.name(),
							fcfInfo.shipToRetreat.level,
							KC3Meta.term("PanelFCFTipTaihaShip")
						));
						if(fcfInfo.isCombined) {
							$("<img/>").css(iconStyles).css("image-rendering", "auto")
								.attr("src", fcfInfo.shipToEscort.shipIcon())
								.appendTo(fcfTips);
							fcfTips.append("{0}\n".format(KC3Meta.term("PanelFCFTipEscortShip")));
							fcfInfo.sortiedFleets[0].setEscapeShip(...fcfInfo.shipIdsToBeAbsent);
							fcfInfo.sortiedFleets[1].setEscapeShip(...fcfInfo.shipIdsToBeAbsent);
							$("<img/>").css(iconStyles)
								.attr("src", "/assets/img/stats/los"+ConfigManager.elosFormula+".png")
								.appendTo(fcfTips);
							fcfTips.append("{0} \u2192 {1} \t".format(
								FleetSummary.elos,
								selectedFleet == 5 ?
									Math.qckInt("floor", fcfInfo.sortiedFleets[0].eLoS() + fcfInfo.sortiedFleets[1].eLoS(), 1) :
									Math.qckInt("floor", fcfInfo.sortiedFleets[(selectedFleet-1) % 2].eLoS(), 1)
							));
							$("<img/>").css(iconStyles)
								.attr("src", "/assets/img/stats/ac.png")
								.appendTo(fcfTips);
							fcfTips.append("{0} \u2192 {1}\t".format(
								FleetSummary.air,
								selectedFleet == 5 ?
									KC3Calc.getFleetsFighterPowerText(fcfInfo.sortiedFleets[0], fcfInfo.sortiedFleets[1], true) :
									KC3Calc.getFleetsFighterPowerText(fcfInfo.sortiedFleets[(selectedFleet-1) % 2])
							));
						} else {
							fcfTips.append("{0}\n".format(KC3Meta.term("PanelFCFTipStrikingForce")));
							fcfInfo.sortiedFleets[0].setEscapeShip(...fcfInfo.shipIdsToBeAbsent);
							$("<img/>").css(iconStyles)
								.attr("src", "/assets/img/stats/los"+ConfigManager.elosFormula+".png")
								.appendTo(fcfTips);
							fcfTips.append("{0} \u2192 {1}\t".format(
								FleetSummary.elos,
								Math.qckInt("floor", fcfInfo.sortiedFleets[0].eLoS(), 1)
							));
							$("<img/>").css(iconStyles)
								.attr("src", "/assets/img/stats/ac.png")
								.appendTo(fcfTips);
							fcfTips.append("{0} \u2192 {1}\t".format(
								FleetSummary.air,
								KC3Calc.getFleetsFighterPowerText(fcfInfo.sortiedFleets[0])
							));
						}
						fcfInfo.sortiedFleets.forEach(f => f.setEscapeShip());
						$(".module.status .status_repair .status_icon").addClass("enclose");
						$(".module.status .status_repair img").attr("src", KC3Meta.itemIcon(28));
						$(".module.status .status_repair .status_text")
							.text(KC3Meta.term("PanelFCFPossible"))
							.attr("titlealt", fcfTips.html()).lazyInitTooltip();
					}
				// Flagship Chuuha or worse for Combined Fleet only
				}else if (FleetSummary.badState[3]) {
					$(".module.status .status_repair .status_text")
						.text( KC3Meta.term("PanelCombinedFSChuuha") )
						.attr("titlealt", KC3Meta.term("PanelCombinedFSChuuhaTip"))
						.lazyInitTooltip()
						.addClass("bad");
					$(".module.status .status_repair img").attr("src", "/assets/img/ui/" +
						(FleetSummary.badState[2] ? "estat_bossheavy.png" : "estat_bossmodrt.png")
					);
				// Condition Green
				}else{
					$(".module.status .status_repair .status_text")
						.text( KC3Meta.term("PanelNoTaiha") )
						.attr("titlealt", "")
						.addClass("good");
					$(".module.status .status_repair img").attr("src", "/assets/img/ui/check.png");
				}

				// STATUS: COMBINED
				if(selectedFleet==1 || selectedFleet==5){
					$(".module.status .status_butai .status_text").attr("title", "");
					switch(Number(PlayerManager.combinedFleet)){
						case 1:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedCarrier") );
							$(".module.status .status_butai .status_icon img").attr("src", "/assets/img/ui/fleet_combined_carrier.png");
							$(".module.controls .fleet_rengo img").attr("src", "/assets/img/ui/rengo_carrier.png");
							break;
						case 2:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedSurface") );
							$(".module.status .status_butai .status_icon img").attr("src", "/assets/img/ui/fleet_combined_surface.png");
							$(".module.controls .fleet_rengo img").attr("src", "/assets/img/ui/rengo_surface.png");
							break;
						case 3:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedTransport") );
							$(".module.status .status_butai .status_icon img").attr("src", "/assets/img/ui/fleet_combined_transport.png");
							$(".module.controls .fleet_rengo img").attr("src", "/assets/img/ui/rengo_transport.png");
							break;
						default:
							$(".module.status .status_butai .status_text").text( KC3Meta.term("CombinedNone") );
							$(".module.status .status_butai .status_icon img").attr("src", "/assets/img/ui/fleet_single.png");
							$(".module.controls .fleet_rengo img").attr("src", "/assets/img/ui/rengo_none.png");
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
				
				const togglePlaneName = function(e){
					$(".module.fleet .airbase_list .base_plane_name").toggle();
					$(".module.fleet .airbase_list .name_toggle_group").toggle();
				};
				// Land-bases ordered by world ID desc, base ID asc
				const sortedBases = PlayerManager.bases.sort(
					(lb1, lb2) => lb2.map - lb1.map || lb1.rid - lb2.rid
				);
				$.each(sortedBases, function(i, baseInfo){
					if (baseInfo.rid != -1) {
						console.debug("LandBase", i, baseInfo);
						const baseBox = $("#factory .airbase").clone();
						$(".base_map", baseBox).text(baseInfo.map);
						$(".base_name", baseBox).text(baseInfo.name);
						$(".base_range .base_stat_value", baseBox).text(baseInfo.range);
						$(".base_range", baseBox).attr("title",
							"{0} + {1}".format(baseInfo.rangeBase, baseInfo.rangeBonus)
						).lazyInitTooltip();
						const actionTerm = baseInfo.getActionTerm();
						$(".base_action", baseBox).text(KC3Meta.term("LandBaseAction" + actionTerm));
						if (actionTerm === "Sortie") {
							// Show a tooltip for supporting target nodes
							if (KC3SortieManager.isOnSortie() && Array.isArray(baseInfo.strikePoints)) {
								$(".base_action", baseBox).attr("title", "\u21db {0}".format(
									baseInfo.strikePoints.map(edge => KC3Meta.nodeLetter(
										KC3SortieManager.map_world, KC3SortieManager.map_num, edge
									)).join(", ")
								)).lazyInitTooltip();
							}
						} else if (actionTerm === "Defend") {
							// Show a tooltip for shotdown ratios given to enemy slots
							const shotdownRatios = baseInfo.shotdownRatio().formattedSlots;
							$(".base_action", baseBox).attr("title",
								KC3Meta.term("LandBaseDefenseShotdown").format(shotdownRatios)
							).lazyInitTooltip();
						}
						
						const shipObj = baseInfo.toShipObject();
						
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
						if (!!ifp) {
							const haifp = Math.floor(ifp * KC3Calc.getLandBaseHighAltitudeModifier(baseInfo.map));
							$(".base_ifp .base_stat_value", baseBox).attr("title",
								KC3Meta.term("LandBaseTipHighAltitudeAirDefensePower").format(haifp)
							).lazyInitTooltip();
						}
						
						$(".airbase_infos", baseBox).on("click", togglePlaneName);

						let planeNames = "";
						$.each(baseInfo.planes, function(i, planeInfo){
							const planeBox = $("#factory .airbase_plane").clone();
							
							if (planeInfo.api_state !== 0) {
								//console.debug("PLANE", i, planeInfo);
								
								const itemObj = KC3GearManager.get(planeInfo.api_slotid);
								if(itemObj.isDummy()) {
									$("div", planeBox).remove();
									return;
								}
								
								$(".base_plane_name", planeBox).text(itemObj.name())
									.attr("title", itemObj.name()).lazyInitTooltip();
								planeNames += itemObj.name() + "\n";

								const paddedId = (itemObj.masterId<10?"00":itemObj.masterId<100?"0":"") + itemObj.masterId;
								let eqImgSrc = "/assets/img/planes/" + paddedId + ".png";
								// show local plane image first
								$(".base_plane_img img", planeBox).attr("alt", itemObj.masterId)
									.attr("src", eqImgSrc).error(function() {
										// fall-back to fetch image from online kcs resources
										eqImgSrc = myKcServerHost + "/kcs2/resources"
											+ KC3Master.png_file($(this).attr("alt"), "item_up", "slot");
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
								
								const eqIconSrc = KC3Meta.itemIcon(itemObj.master().api_type[3]);
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
						$(".base_name", baseBox).attr("title", planeNames
						).lazyInitTooltip();
						
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
				(KC3Meta.isEventWorld(KC3SortieManager.map_world) ? 'E' : KC3SortieManager.map_world)
				+ "-" + KC3SortieManager.map_num
				+ ((KC3SortieManager.map_world >= 41)
					? [ "",
					  KC3Meta.term("EventRankCasualAbbr"),
					  KC3Meta.term("EventRankEasyAbbr"),
					  KC3Meta.term("EventRankNormalAbbr"),
					  KC3Meta.term("EventRankHardAbbr") ]
					[ KC3SortieManager.map_difficulty ]
					: KC3Meta.isEventWorld(KC3SortieManager.map_world)
					? [ "",
					  KC3Meta.term("EventRankEasyAbbr"),
					  KC3Meta.term("EventRankNormalAbbr"),
					  KC3Meta.term("EventRankHardAbbr") ]
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
			var nodeId = KC3Meta.nodeLetter(world, map, thisNode.id);
			var longNodeLetter = String(nodeId).length > 2;

			if(numNodes > 9) {
				const emptyNodeDiv = `<div class="sortie_node extra_node sortie_node_${numNodes}"></div>`;
				$(".module.activity .sortie_nodes").css("left", -20 * (numNodes - 9))
					.append($(emptyNodeDiv));
			}
			$(".module.activity .sortie_node_"+numNodes).text(nodeId)
				.toggleClass("long_name", longNodeLetter);

			$(".module.activity .node_types").hide();

			$(".module.activity .abyss_ship").hide();
			$(".module.activity .abyss_hp").hide();

			$(".module.activity .node_type_text").removeClass("dud");
			$(".module.activity .node_type_text").removeClass("select");
			$(".module.activity .node_type_text").removeAttr("title");

			// Swap fish and support icons
			$(".module.activity .battle_fish").hide();
			$(".module.activity .battle_support").show();

			//console.debug("Next node", thisNode);
			if(thisNode.isBoss()){
				$(".module.activity .sortie_nodes .boss_node .boss_circle").text(nodeId)
					.toggleClass("long_name", longNodeLetter);
				$(".module.activity .sortie_nodes .boss_node").css("left", 20 * (numNodes - 1));
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
					$(".module.activity .node_type_prev_encounters .prev_encounter_label")
						.addClass("hover")
						.off("click").on("click", function(e){
							(new RMsg("service", "strategyRoomPage", {
								tabPath: "encounters-{0}-{1}-{2}".format(world, map, diff)
							})).execute();
						});
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
						const sortedList = thisNodeEncounterList.sort(
							(a, b) => (b.count || 1) - (a.count || 1)
						);
						$.each(sortedList, function(_, encounter){
							const shipList = JSON.parse(encounter.ke || null);
							let badEntry = ! (Array.isArray(shipList) && encounter.form > 0);
							// Don't show 'broken' encounters with incorrect data
							if(badEntry) return;
							const edata = {
								formation: encounter.form,
								main: shipList.slice(0, 6),
								escort: shipList.slice(6, 12)
							};
							const encBox = $("#factory .encounter_record").clone();
							$(".encounter_formation img", encBox)
								.attr("src", KC3Meta.formationIcon(encounter.form))
								.addClass("hover")
								.on("dblclick", function(e) {
									const simData = KC3SortieManager.prepareSimData(edata);
									if(simData) openSimulatorWindow(simData, e.altKey);
								});
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
							if(encounter.exp){
								tooltip += "\n{0}: {1}".format(KC3Meta.term("PvpBaseExp"), encounter.exp);
							}
							const ap = KC3Calc.enemyFighterPower(shipList)[0];
							if(ap){
								tooltip += "\n" + KC3Meta.term("InferredFighterPower")
									.format(KC3Calc.fighterPowerIntervals(ap));
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
					$(".module.activity .node_type_resource .node_res_icon img")
						.attr("src", KC3Meta.itemIcon(25));
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
					$(".module.activity .node_type_text")
						.text(KC3Meta.term(!!thisNode.isEmergencyRepairNode ? "BattleAnchorage" : "BattleAvoided"))
						.attr("title", thisNode.dudMessage || "")
						.lazyInitTooltip();
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
				$(".module.activity .node_type_text").hide();
				$(".module.activity .node_type_resource").hide();
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
					.attr("title", thisNode.buildAirPowerMessage(true))
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
						if (thisNode.enemyHP[index] && thisNode.enemyHP[index].hp !== undefined) {
							newEnemyHP = Math.max(0, thisNode.enemyHP[index].hp);
							
							if(index === 0 && ['multiple', 'gauge-hp'].includes(KC3SortieManager.getCurrentMapData().kind)) {
								updateMapGauge(KC3SortieManager.currentNode().gaugeDamage, !newEnemyHP);
							}
							
							$(enemyFleetBoxSelector+" .abyss_ship_"+(index+1)).toggleClass("sunk", newEnemyHP === 0);
							$(enemyFleetBoxSelector+" .sunk_"+(index+1)).toggleClass("shown", newEnemyHP === 0)
								.removeClass("safe");
							
							enemyHPPercent = ( newEnemyHP / thisNode.maxHPs.enemy[index] );
							if (enemyFleetBox === "combined") {
								$(".module.activity .abyss_combined .abyss_hp_bar_"+(index+1))
									.css("height", 15*enemyHPPercent)
									.css("width", "2px");
								enemyBarHeight = $(".module.activity .abyss_combined .abyss_hp_bar_"+(index+1)).height();
								$(".module.activity .abyss_combined .abyss_hp_bar_"+(index+1))
									.css("margin-top", 15-enemyBarHeight);
								updateEnemyHpBarStyles(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1), enemyHPPercent);
							} else {
								updateEnemyHpBarStyles(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1), enemyHPPercent, 28);
							}
						} else {
							updateEnemyHpBarStyles(enemyFleetBoxSelector+" .abyss_hp_bar_"+(index+1));
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

				if (thisNode.nightSupportInfo || (!thisNode.startsFromNight && thisNode.supportInfo)) {
					const supportInfo = thisNode.supportInfo || thisNode.nightSupportInfo;
					const fleetId =
						(supportInfo.api_support_airatack || {}).api_deck_id ||
						(supportInfo.api_support_hourai || {}).api_deck_id ||
						"?";
					$(".module.activity .battle_support .support_exped").text(fleetId);
					$(".module.activity .battle_support .support_exped").show();
				}

				$(".module.activity .battle_support").attr("titlealt",
					thisNode.buildSupportAttackMessage(undefined, true, true)
						|| KC3Meta.term("BattleSupportExped")
				).lazyInitTooltip();
			} else {
				$(".module.activity .battle_support img").attr(
					"src",
					"../../../../assets/img/ui/dark_support-x.png"
				);
			}
			$(".module.activity .battle_support .support_lbas").toggle(thisNode.lbasFlag);

			// Day only / Night to day battle environment
			if(!thisNode.startsFromNight || thisNode.isNightToDay){
				// If anti-air CI fire is triggered
				$(".module.activity .battle_aaci img").attr("src",
					"../../../../assets/img/ui/dark_aaci"+["-x",""][(!!thisNode.antiAirFire)&1]+".png");
				$(".module.activity .battle_aaci").attr("title",
					thisNode.buildAntiAirCutinMessage() || KC3Meta.term("BattleAntiAirCutIn") )
					.lazyInitTooltip();

				// If night battle will be asked after this battle
				$(".module.activity .battle_night img").attr("src", "/assets/img/ui/dark_yasen"+["-x",""][thisNode.yasenFlag&1]+".png");

				// Add option to simulate night battle
				if (thisNode.yasenFlag) {
					const edata = {
						main: thisNode.eshipsMain || thisNode.eships,
						escort: thisNode.eshipsEscort
					};
					$(".module.activity .battle_night img")
						.addClass("hover").off("dblclick")
						.on("dblclick", function (e) {
							const simData = KC3SortieManager.prepareSimData(edata, thisNode.predictedFleetsDay, true);
							if(simData) openSimulatorWindow(simData, e.altKey);
						});
				}
				
				// Indicate night to day battle, and if battle is kept to dawn (day time)
				if(thisNode.isNightToDay){
					$(".module.activity .battle_night img").attr("src", "/assets/img/ui/dark_day"+["-x",""][thisNode.toDawnFlag&1]+".png");
					$(".module.activity .battle_night").attr("title", KC3Meta.term("BattleDayNeeded"));
					// Indicate potential friendly fleet support for night to day battle
					if(thisNode.friendlySupportFlag){
						$(".module.activity .battle_night img").attr("src", "/assets/img/ui/dark_friendly.png");
						$(".module.activity .battle_night").attr("title", thisNode.buildFriendlyBattleMessage(thisNode.battleDay));
					}
				}

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
					$(".fighter_ally .plane_icon img").attr("src", KC3Meta.itemIcon(40));
					fightersBefore = thisNode.planeFighters.player[0] + thisNode.planeJetFighters.player[1] + thisNode.planeJetBombers.player[1];
					$(".fighter_ally .plane_before").text(fightersBefore);
					fightersAfter = thisNode.planeFighters.player[1] + thisNode.planeJetFighters.player[1];
					if(fightersAfter > 0){
						$(".fighter_ally .plane_after").text("-"+fightersAfter);
					}
				}
				if(!!thisNode.planeJetFighters && thisNode.planeJetFighters.abyssal[0] > 0){
					$(".fighter_enemy .plane_icon img").attr("src", KC3Meta.itemIcon(40));
					fightersBefore = thisNode.planeFighters.abyssal[0] + thisNode.planeJetFighters.abyssal[1] + thisNode.planeJetBombers.abyssal[1];
					$(".fighter_enemy .plane_before").text(fightersBefore);
					fightersAfter = thisNode.planeFighters.abyssal[1] + thisNode.planeJetFighters.abyssal[1];
					if(fightersAfter > 0){
						$(".fighter_enemy .plane_after").text("-"+fightersAfter);
					}
				}
				if(!!thisNode.planeJetBombers && thisNode.planeJetBombers.player[0] > 0){
					$(".bomber_ally .plane_icon img").attr("src", KC3Meta.itemIcon(39));
					bombersBefore = thisNode.planeBombers.player[0] + thisNode.planeJetBombers.player[1];
					$(".bomber_ally .plane_before").text(bombersBefore);
					bombersAfter = thisNode.planeBombers.player[1] + thisNode.planeJetBombers.player[1];
					if(bombersAfter > 0){
						$(".bomber_ally .plane_after").text("-"+bombersAfter);
					}
				}
				if(!!thisNode.planeJetBombers && thisNode.planeJetBombers.abyssal[0] > 0){
					$(".bomber_enemy .plane_icon img").attr("src", KC3Meta.itemIcon(39));
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
				if(thisNode.friendlySupportFlag){
					$(".module.activity .battle_night img").attr("src", "/assets/img/ui/dark_friendly.png");
					$(".module.activity .battle_night").attr("title", thisNode.buildFriendlyBattleMessage());
				}
			}

			// Show predicted battle rank
			if(thisNode.predictedRank || thisNode.predictedRankNight){
				const rankLetter = thisNode.predictedRank || thisNode.predictedRankNight;
				$(".module.activity .battle_rating img").css("opacity", 0.5)
					.attr("src", `/assets/img/client/ratings/${rankLetter}.png`);
				const dmgGauge = thisNode.predictedDamageGauge || thisNode.predictedDamageGaugeNight || {};
				$(".module.activity .battle_rating").attr("title", "{0}\n{1}\n{2}".format(
					KC3Meta.term("BattleRating"),
					KC3Meta.term("BattleDamageGauges").format(
						dmgGauge.enemy  === undefined ? "?" : dmgGauge.enemy,
						dmgGauge.player === undefined ? "?" : dmgGauge.player
					),
					thisNode.buildUnexpectedDamageMessage()
				)).lazyInitTooltip();
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
						
						if(index === 0 && ['multiple', 'gauge-hp'].includes(KC3SortieManager.getCurrentMapData().kind)){
							updateMapGauge(KC3SortieManager.currentNode().gaugeDamage, !newEnemyHP);
						}
						
						$(".module.activity .abyss_single .abyss_ship_"+(index+1)).toggleClass("sunk", newEnemyHP === 0);
						$(".module.activity .abyss_single .sunk_"+(index+1)).toggleClass("shown", newEnemyHP === 0)
							.toggleClass("safe", !!(data || {}).safeSunk);
						
						enemyHPPercent = ( newEnemyHP / thisNode.maxHPs.enemy[index] );
						updateEnemyHpBarStyles(".module.activity .abyss_single .abyss_hp_bar_"+(index+1), enemyHPPercent, 28);
						$(".module.activity .abyss_single .abyss_hp_"+(index+1)).show();
					}
				});
				
				$(".module.activity .abyss_single").show();
				$(".module.activity .abyss_combined").hide();
			}

			var contactSpan = buildContactPlaneSpan(thisNode.fcontactId, thisNode.fcontact, thisNode.econtactId, thisNode.econtact);
			$(".module.activity .battle_contact").html(contactSpan.html()).lazyInitTooltip();

			if(thisNode.friendlySupportFlag){
				$(".module.activity .battle_night img").attr("src", "/assets/img/ui/dark_friendly.png");
				$(".module.activity .battle_night").attr("title", thisNode.buildFriendlyBattleMessage());
			}

			if(thisNode.predictedRankNight){
				$(".module.activity .battle_rating img").css("opacity", 0.5)
					.attr("src", `/assets/img/client/ratings/${thisNode.predictedRankNight}.png`);
				const dmgGauge = thisNode.predictedDamageGaugeNight || {};
				$(".module.activity .battle_rating").attr("title", "{0}\n{1}\n{2}".format(
					KC3Meta.term("BattleRating"),
					KC3Meta.term("BattleDamageGauges").format(
						dmgGauge.enemy  === undefined ? "?" : dmgGauge.enemy,
						dmgGauge.player === undefined ? "?" : dmgGauge.player
					),
					thisNode.buildUnexpectedDamageMessage()
				)).lazyInitTooltip();
			}

			this.Fleet();
		},

		BattleResult: function(data){
			const thisNode = KC3SortieManager.currentNode();

			updateHQEXPGained($(".admiral_lvnext"), KC3SortieManager.hqExpGained);

			// Show real battle rank
			$(".module.activity .battle_rating img")
				.attr("src", `/assets/img/client/ratings/${thisNode.rating}.png`)
				.css("opacity", 1);

			// If there is any useitem drop
			if(thisNode.dropUseitem > 0) {
				// Keep old style icon shown if drop spoiler is disabled
				if(ConfigManager.info_drop) {
					$(".module.activity .battle_fish img")
						.attr("src", `/assets/img/useitems/${thisNode.dropUseitem}.png`).addClass("rounded")
						.error(function() {
							$(this).off("error").removeClass("rounded")
								.attr("src", "/assets/img/ui/map_drop.png");
						});
				} else {
					$(".module.activity .battle_fish img")
						.attr("src", "/assets/img/ui/map_drop.png").removeClass("rounded");
				}
				const currentAmount = PlayerManager.getConsumableById(thisNode.dropUseitem) || 0;
				const useitemAttr = PlayerManager.getConsumableById(thisNode.dropUseitem, true);
				// Confirmed that food items are capped at 99, and if amount reaches its cap,
				// will be no drop flag in API result at all, just like ship.
				$(".module.activity .battle_fish").attr("title", KC3Meta.term("BattleItemDrop")
					+ (useitemAttr && ConfigManager.info_drop ? "\n{0}: {1} +1".format(
						KC3Meta.useItemName(thisNode.dropUseitem) ||
							(KC3Master.useitem(thisNode.dropUseitem) || {}).api_name ||
							KC3Meta.term("Unknown"),
						currentAmount
					) : "")
				);
				$(".module.activity .battle_support").hide();
				$(".module.activity .battle_fish").show();
				// Update counts
				if(useitemAttr) {
					PlayerManager.consumables[useitemAttr] = currentAmount + 1;
					PlayerManager.setConsumables();
					this.Consumables({});
				}
			}

			// If there is a ship drop
			if(thisNode.drop > 0) {
				// If drop spoiler is enabled on settings
				if(ConfigManager.info_drop) {
					$(".module.activity .battle_drop img")
						.attr("src", KC3Meta.shipIcon(thisNode.drop, undefined, false));
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
				// Update counts
				this.ShipSlots({});
				this.GearSlots({});
			} else {
				$(".module.activity .battle_drop img")
					.attr("src", ConfigManager.info_troll ?
						"/assets/img/ui/jervaited.png" :
						"/assets/img/ui/dark_shipdrop-x.png");
			}

			// Show TP deduction
			if(KC3SortieManager.getCurrentMapData().kind === 'gauge-tp') {
				updateMapGauge(
					-thisNode.gaugeDamage,
					true /* does not matter flagship status */
				);
			}

			// Show experience calculation if leveling global found in sent fleet
			if(selectedFleet <= (PlayerManager.combinedFleet ? 2 : 4) &&
				KC3SortieManager.fleetSent == (PlayerManager.combinedFleet ? 1 : selectedFleet)) {
				const expJustGained = data.api_get_ship_exp;
				const currentFleet = PlayerManager.fleets[selectedFleet-1];
				const levelingGoals = localStorage.getObject("goals") || {};
				currentFleet.ship(function(rosterId, index, shipData) {
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

			// Add glow to node letter if one-time special cut-in per sortie was used
			if(ConfigManager.info_compass && Array.isArray(thisNode.sortieSpecialCutins)) {
				const numNodes = KC3SortieManager.countNodes();
				$(".module.activity .sortie_node_" + numNodes)
					.toggleClass("special_cutin", thisNode.sortieSpecialCutins.some(v => !!v));
			}
		},

		CraftGear: function(data){
			// Recall equipment count
			this.GearSlots({});

			// If craft spoiler is disabled on settings
			if(!ConfigManager.info_craft){ return true; }
			console.debug("Crafted Gear", data);

			const penguinIcon = "/assets/img/client/penguin.png";
			// If crafting success
			if(!data.failedFlag && Array.isArray(data.items)){
				// Treat first equipItem div as factory template here
				const firstItemDiv = $(".activity_crafting .equipItems .equipItem.first").clone();
				$(".activity_crafting .equipItems").empty().append(firstItemDiv);
				data.items.forEach((item, idx) => {
					const itemDiv = idx === 0 ? firstItemDiv : firstItemDiv.clone()
						.removeClass("first").appendTo(".activity_crafting .equipItems");
					// api_slotitem_id will be -1 if failed
					const masterId = item.api_slotitem_id;
					if(masterId > 0) {
						// Show equipment data
						const playerItem = KC3GearManager.get(item.api_id);
						const masterItem = KC3Master.slotitem(masterId);
						const icon = KC3Meta.itemIcon(masterItem.api_type[3]);
						$(".equipIcon img", itemDiv).attr("src", icon);
						$(".equipName", itemDiv).text(playerItem.name());
						// Show extra item info
						const existedCount = KC3GearManager.countByMasterId(masterId);
						$(".equipNote", itemDiv).html(
							existedCount === 1 ? KC3Meta.term("CraftEquipNoteFirst") :
								KC3Meta.term("CraftEquipNoteExists").format(existedCount)
						);
						const CraftGearStats = (itemMst, statProperty, code) => {
							if(parseInt(itemMst["api_"+statProperty], 10) !== 0){
								const thisStatBox = $("#factory .equipStat").clone()
									.appendTo($(".equipStats", itemDiv));
								$("img", thisStatBox).attr("src", KC3Meta.statIcon(code));
								$(".equipStatText", thisStatBox).text( itemMst["api_"+statProperty] );
							}
						};
						// Hide equipment stats if multiple crafting for limited spaces
						$(".equipStats", itemDiv).empty().toggle(!data.multiFlag);
						CraftGearStats(masterItem, "souk", "ar");
						CraftGearStats(masterItem, "houg", "fp");
						CraftGearStats(masterItem, "raig", "tp");
						CraftGearStats(masterItem, "soku", "sp");
						CraftGearStats(masterItem, "baku", "dv");
						CraftGearStats(masterItem, "tyku", "aa");
						CraftGearStats(masterItem, "tais", "as");
						CraftGearStats(masterItem, "houm", "ht");
						CraftGearStats(masterItem, "houk", "ev");
						CraftGearStats(masterItem, "saku", "ls");
						CraftGearStats(masterItem, "leng", "rn");
						$("<div />").addClass("clear").appendTo($(".equipStats", itemDiv));
					} else {
						$(".equipIcon img", itemDiv).attr("src", penguinIcon);
						$(".equipName", itemDiv).text(KC3Meta.term("CraftEquipNotePenguin"));
						$(".equipNote", itemDiv).empty();
						$(".equipStats", itemDiv).empty();
					}
				});
			
			// If all penguin
			} else {
				const firstItemDiv = $(".activity_crafting .equipItems .equipItem.first").clone();
				$(".activity_crafting .equipItems").empty().append(firstItemDiv);
				$(".activity_crafting .equipIcon img").attr("src", penguinIcon);
				$(".activity_crafting .equipName").text(KC3Meta.term("CraftEquipNotePenguin"));
				$(".activity_crafting .equipNote").empty();
				$(".activity_crafting .equipStats").empty();
			}

			// Show resource used (per item)
			$(".activity_crafting .equipResources .used1").text(data.resourceUsed[0]);
			$(".activity_crafting .equipResources .used2").text(data.resourceUsed[1]);
			$(".activity_crafting .equipResources .used3").text(data.resourceUsed[2]);
			$(".activity_crafting .equipResources .used4").text(data.resourceUsed[3]);
			// Show multiple crafting amount
			$(".activity_crafting .equipFooter .multiCount").html(
				data.multiFlag && data.items ? `x${data.items.length || 1}&emsp;` : ""
			);
			// Show devmats change
			$(".activity_crafting .equipFooter .devmatsBefore").text(data.devmats[0]);
			$(".activity_crafting .equipFooter .devmatsAfter").text(data.devmats[1]);

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
				$(".activity_modernization .mod_result_"+statName+" .mod_result_icon img")
					.attr("src", KC3Meta.statIcon("mod_" + statName));
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
			const jpRankArr = ["","\u5143\u5e25","\u5927\u5c06","\u4e2d\u5c06","\u5c11\u5c06","\u5927\u4f50","\u4e2d\u4f50","\u65b0\u7c73\u4e2d\u4f50","\u5c11\u4f50","\u4e2d\u5805\u5c11\u4f50","\u65b0\u7c73\u5c11\u4f50"];
			const lines2Array = (s) => (s || "").split(/[\r\n]/).filter(l => !!l);
			const pvpFriends = lines2Array(ConfigManager.pan_pvp_friends);
			const pvpFriendToggleFunc = function(e) {
				const enemyBox = $(this).parent();
				const pvpFriends = lines2Array(ConfigManager.pan_pvp_friends),
					name = $(".pvp_enemy_name", enemyBox).text(),
					namePos = pvpFriends.indexOf(name);
				if(namePos >= 0) {
					pvpFriends.splice(namePos, 1);
				} else {
					pvpFriends.push(name);
				}
				// to indicate if there are other same names existed in list after removing
				enemyBox.toggleClass("friend", pvpFriends.includes(name));
				ConfigManager.pan_pvp_friends = pvpFriends.join("\n");
				ConfigManager.save();
			};
			$(".activity_pvp .pvp_header .pvp_create_kind").text(
				KC3Meta.term("PvpListCreateType{0}".format(data.api_create_kind))
			);
			$(".activity_pvp .pvp_list").empty();
			$.each(data.api_list, function(idx, enemy){
				const enemyBox = $("#factory .pvpEnemyInfo").clone().appendTo(".activity_pvp .pvp_list");
				enemyBox.toggleClass("friend", pvpFriends.includes(enemy.api_enemy_name));
				$(".pvp_enemy_pic img", enemyBox).attr("src", KC3Meta.shipIcon(enemy.api_enemy_flag_ship));
				$(".pvp_enemy_pic", enemyBox)
					.attr("title", KC3Meta.shipName(KC3Master.ship(enemy.api_enemy_flag_ship).api_name))
					.lazyInitTooltip()
					.click(pvpFriendToggleFunc);
				$(".pvp_enemy_name", enemyBox)
					.text(enemy.api_enemy_name)
					.attr("title", enemy.api_enemy_name)
					.lazyInitTooltip()
					.click(pvpFriendToggleFunc);
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
						"../../../../assets/img/client/ratings/{0}.png"
							.format(["","E","D","C","B","A","S"][enemy.api_state] || "")
					);
				} else {
					$(".pvp_enemy_state", enemyBox).hide();
				}
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
			const self = this;
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
			const self = this;
			var thisPvP = KC3SortieManager.currentNode();

			// Clear battle details box just to make sure
			clearBattleData();
			$(".module.activity .map_world").text( KC3Meta.term("BattleMapWorldPvP") )
				.attr("title", "").removeClass("debuffed");
			$(".module.activity .map_hp").text( KC3Meta.term("BattleMapNoHpGauge") );

			// PvP enemy never combined
			$(".module.activity .abyss_single").show();
			$(".module.activity .abyss_combined").hide();

			// Hide useless information
			$(".module.activity .battle_support img").attr("src", "../../../../assets/img/ui/dark_support-x.png").css("visibility","hidden");
			$(".module.activity .battle_drop    img").attr("src", "../../../../assets/img/ui/dark_shipdrop-x.png").css("visibility","hidden");

			// Swap fish and support icons
			$(".module.activity .battle_fish").hide();
			$(".module.activity .battle_support").attr("titlealt", "").show();

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
						newEnemyHP = Math.max(0, thisPvP.enemyHP[index].hp);

						if(ConfigManager.info_chuuha_icon){
							$(".module.activity .abyss_single .abyss_ship_"+(index+1)+" img")
								.attr("src", KC3Ship.shipIcon(eshipId, thisPvP.maxHPs.enemy[index], newEnemyHP));
						}

						$(".module.activity .abyss_single .abyss_ship_"+(index+1)).toggleClass("sunk", newEnemyHP === 0);
						$(".module.activity .abyss_single .sunk_"+(index+1)).toggleClass("shown", newEnemyHP === 0)
							.addClass("safe");

						enemyHPPercent = ( newEnemyHP / thisPvP.maxHPs.enemy[index] );
						updateEnemyHpBarStyles(".module.activity .abyss_single .abyss_hp_bar_"+(index+1), enemyHPPercent, 28);
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
				$(".module.activity .battle_rating img").css("opacity", 0.5)
					.attr("src", `/assets/img/client/ratings/${thisPvP.predictedRank}.png`);
				const dmgGauge = thisPvP.predictedDamageGauge || {};
				$(".module.activity .battle_rating").attr("title", "{0}\n{1}".format(
					KC3Meta.term("BattleRating"),
					KC3Meta.term("BattleDamageGauges").format(
						dmgGauge.enemy  === undefined ? "?" : dmgGauge.enemy,
						dmgGauge.player === undefined ? "?" : dmgGauge.player
					)
				)).lazyInitTooltip();
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
				$(".fighter_ally .plane_icon img").attr("src", KC3Meta.itemIcon(40));
				fightersBefore = thisPvP.planeFighters.player[0] + thisPvP.planeJetFighters.player[1] + thisPvP.planeJetBombers.player[1];
				$(".fighter_ally .plane_before").text(fightersBefore);
				fightersAfter = thisPvP.planeFighters.player[1] + thisPvP.planeJetFighters.player[1];
				if(fightersAfter > 0){
					$(".fighter_ally .plane_after").text("-"+fightersAfter);
				}
			}
			if(!!thisPvP.planeJetFighters && thisPvP.planeJetFighters.abyssal[0] > 0){
				$(".fighter_enemy .plane_icon img").attr("src", KC3Meta.itemIcon(40));
				fightersBefore = thisPvP.planeFighters.abyssal[0] + thisPvP.planeJetFighters.abyssal[1] + thisPvP.planeJetBombers.abyssal[1];
				$(".fighter_enemy .plane_before").text(fightersBefore);
				fightersAfter = thisPvP.planeFighters.abyssal[1] + thisPvP.planeJetFighters.abyssal[1];
				if(fightersAfter > 0){
					$(".fighter_enemy .plane_after").text("-"+fightersAfter);
				}
			}
			if(!!thisPvP.planeJetBombers && thisPvP.planeJetBombers.player[0] > 0){
				$(".bomber_ally .plane_icon img").attr("src", KC3Meta.itemIcon(39));
				bombersBefore = thisPvP.planeBombers.player[0] + thisPvP.planeJetBombers.player[1];
				$(".bomber_ally .plane_before").text(bombersBefore);
				bombersAfter = thisPvP.planeBombers.player[1] + thisPvP.planeJetBombers.player[1];
				if(bombersAfter > 0){
					$(".bomber_ally .plane_after").text("-"+bombersAfter);
				}
			}
			if(!!thisPvP.planeJetBombers && thisPvP.planeJetBombers.abyssal[0] > 0){
				$(".bomber_enemy .plane_icon img").attr("src", KC3Meta.itemIcon(39));
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
				.attr("src", `/assets/img/client/ratings/${thisPvP.rating}.png`)
				.css("opacity", 1);
			updateHQEXPGained($(".admiral_lvnext"), KC3SortieManager.hqExpGained);
			this.Fleet();
		},

		GearRemodelList: function(data){
			//console.debug("Remodel list", data);
			const remodelListBox = $(".activity_remodel .remodelList");
			const weekdayName = data.today.toLocaleDateString(KC3Translation.getLocale(), { weekday: "long" });
			const shipId = data.shipId || PlayerManager.fleets[0].ship(0).masterId;
			$(".remodel_header .recipe_title", remodelListBox).html(
				KC3Meta.term("RemodelItemListTitle").format(weekdayName)
			);
			$(".remodel_header .assistant_ship img", remodelListBox)
				.attr("src", KC3Meta.shipIcon(shipId, undefined, false))
				.attr("title", KC3Meta.shipName(KC3Master.ship(shipId).api_name));
			$(".remodel_header", remodelListBox).addClass("hover").off("click")
				.on("click", function(e) {
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "akashi"
					})).execute();
				});
			$(".remodel_footer .owned_devmats span", remodelListBox).text(PlayerManager.consumables.devmats);
			$(".remodel_footer .owned_screws span", remodelListBox).text(PlayerManager.consumables.screws);
			$(".remodel_slotlist", remodelListBox).empty();
			$.each(data.currentList, (idx, recipe) => {
				const itemBox = $("#factory .remodelSlotItem").clone();
				fillRemodelSlotItemBox(this, itemBox, recipe)
					.appendTo($(".remodel_slotlist", remodelListBox));
			});
			$(".module.activity .activity_remodel").createChildrenTooltips();
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_remodel .remodelList").show();
			$(".module.activity .activity_remodel .remodelDetail").hide();
			$(".module.activity .activity_remodel .remodelResult").hide();
			$(".module.activity .activity_remodel").fadeIn(500);
		},

		GearRemodelDetail: function(data){
			//console.debug("Remodel detail", data);
			const remodelDetailBox = $(".activity_remodel .remodelDetail");
			const shipId = data.shipId || PlayerManager.fleets[0].ship(0).masterId;
			$(".remodel_header .assistant_ship img", remodelDetailBox)
				.attr("src", KC3Meta.shipIcon(shipId, undefined, false))
				.attr("title", KC3Meta.shipName(KC3Master.ship(shipId).api_name));
			$(".remodel_header", remodelDetailBox).addClass("hover").off("click")
				.on("click", function(e) {
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "akashi"
					})).execute();
				});
			$(".remodel_footer .owned_devmats span", remodelDetailBox).text(PlayerManager.consumables.devmats);
			$(".remodel_footer .owned_screws span", remodelDetailBox).text(PlayerManager.consumables.screws);
			const recipeDetail = data.cachedRecipes[data.recipeId];
			const improveItemBox = $("#factory .remodelSlotItem").clone();
			fillRemodelSlotItemBox(this, improveItemBox, recipeDetail, data.rosterId);
			$(".remodel_to_improve", remodelDetailBox).empty().append(improveItemBox);
			
			if(recipeDetail.api_req_slot_id || recipeDetail.api_req_useitem_id) {
				const consumeList = $(".remodel_consume_items", remodelDetailBox);
				$(".remodel_consume_item.useitem", consumeList).remove();
				$(".owned_use_items:not(.first)", remodelDetailBox).remove();
				// If consumes another equipment
				if(recipeDetail.api_req_slot_id && recipeDetail.api_req_slot_num) {
					const masterId = recipeDetail.api_req_slot_id;
					const consumeGear = KC3Master.slotitem(masterId);
					const consumeGearBox = $(".remodel_consume_item", consumeList);
					$(".remodel_slot_icon img", consumeGearBox)
						.attr("src", KC3Meta.itemIcon(consumeGear.api_type[3]))
						.data("masterId", masterId)
						.on("dblclick", this.gearDoubleClickFunction);
					$(".remodel_slot_name", consumeGearBox)
						.text(KC3Meta.gearName(consumeGear.api_name))
						.attr("title", KC3Meta.gearName(consumeGear.api_name));
					$(".remodel_consume_amount", consumeGearBox)
						.text("x{0}".format(recipeDetail.api_req_slot_num));
					consumeGearBox.show();
					const gearToRemodel = KC3GearManager.get(data.rosterId);
					const isToConsumeSameGear = gearToRemodel.masterId === recipeDetail.api_slot_id
						&& !gearToRemodel.lock && !gearToRemodel.stars;
					const totalAmount = KC3GearManager.countByMasterId(masterId, false, true)
						- (isToConsumeSameGear & 1);
					$(".owned_star0_item .value", remodelDetailBox)
						.text("x{0}".format(totalAmount))
						.toggleClass("red", totalAmount < recipeDetail.api_req_slot_num);
					$(".owned_star0_item", remodelDetailBox).show();
					const freeAmount = KC3GearManager.countFree(masterId, true, true)
						- (isToConsumeSameGear & 1);
					$(".owned_free_item .value", remodelDetailBox)
						.text("x{0}".format(freeAmount))
						.toggleClass("red", freeAmount < recipeDetail.api_req_slot_num);
					$(".owned_free_item", remodelDetailBox).show();
				} else {
					$(".remodel_consume_item", consumeList).hide();
					$(".owned_star0_item", remodelDetailBox).hide();
					$(".owned_free_item", remodelDetailBox).hide();
				}
				const addConsumeUseItem = (useitemId, useitemNum) => {
					const consumeUseItemBox = $(".remodel_consume_item:not(.useitem)", consumeList).clone();
					consumeUseItemBox.addClass("useitem").show().appendTo(consumeList);
					$(".remodel_slot_icon img", consumeUseItemBox)
						.attr("src", `/assets/img/useitems/${useitemId}.png`);
					$(".remodel_slot_name", consumeUseItemBox)
						.text(KC3Meta.useItemName(useitemId))
						.attr("title", KC3Meta.useItemName(useitemId));
					$(".remodel_consume_amount", consumeUseItemBox)
						.text("x{0}".format(useitemNum));
					const useitemAmount = PlayerManager.getConsumableById(useitemId) || 0;
					const ownedUseitemBox = $(".owned_use_items.first", remodelDetailBox).clone()
						.removeClass("first")
						.appendTo($(".remodel_consumptions", remodelDetailBox));
					$("img", ownedUseitemBox).attr("src", `/assets/img/useitems/${useitemId}.png`);
					$(".value", ownedUseitemBox)
						.text("x{0}".format(useitemAmount))
						.toggleClass("red", useitemAmount < useitemNum);
					ownedUseitemBox.show();
				};
				// If consumes some useitems
				if(recipeDetail.api_req_useitem_id && recipeDetail.api_req_useitem_num) {
					addConsumeUseItem(recipeDetail.api_req_useitem_id, recipeDetail.api_req_useitem_num);
				}
				// For now, only appears for upgrading from C gun to D gun
				if(recipeDetail.api_req_useitem_id2 && recipeDetail.api_req_useitem_num2) {
					addConsumeUseItem(recipeDetail.api_req_useitem_id2, recipeDetail.api_req_useitem_num2);
				}
				$(".remodel_consumptions", remodelDetailBox).show();
			} else {
				$(".remodel_consumptions", remodelDetailBox).hide();
			}
			
			if(recipeDetail.api_change_flag) {
				// Can only get info from DB since no detail from API when equipment can be upgraded
				const impDb = WhoCallsTheFleetDb.getItemImprovement(recipeDetail.api_slot_id);
				const upgradeInfo = (impDb || []).find(i => i.req
					.some(r => r[0][data.today.getDay()] && (!r[1] || r[1].includes(data.shipId)))
				);
				if(upgradeInfo && upgradeInfo.upgrade) {
					const [upgradeMasterId, upgradeStars] = upgradeInfo.upgrade;
					const upgradeItemBox = $("#factory .remodelSlotItem").clone();
					fillRemodelSlotItemBox(this, upgradeItemBox, {
						api_slot_id: upgradeMasterId, noReqs: true
					}, undefined, upgradeStars > 0 ? upgradeStars : undefined);
					$(".remodel_upgrade_title", remodelDetailBox).show();
					$(".remodel_upgrade_to", remodelDetailBox).empty().append(upgradeItemBox).show();
				} else {
					// Upgraded item info not found
					$(".remodel_upgrade_title", remodelDetailBox).show();
					$(".remodel_upgrade_to", remodelDetailBox).empty().append("???").show();
				}
			} else {
				$(".remodel_upgrade_title", remodelDetailBox).hide();
				$(".remodel_upgrade_to", remodelDetailBox).hide();
			}
			
			$(".module.activity .activity_remodel").createChildrenTooltips();
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_remodel .remodelList").hide();
			$(".module.activity .activity_remodel .remodelDetail").show();
			$(".module.activity .activity_remodel .remodelResult").hide();
			$(".module.activity .activity_remodel").fadeIn(500);
		},

		GearRemodel: function(data){
			//console.debug("Remodel result", data);
			const remodelResultBox = $(".activity_remodel .remodelResult");
			const result = data.currentResult;
			const shipId = data.shipId || PlayerManager.fleets[0].ship(0).masterId;
			$(".remodel_header .result_title", remodelResultBox).html(KC3Meta.term(
				!result.api_remodel_flag ? "RemodelItemResultFailure" : "RemodelItemResultSuccess"
			)).toggleClass("failure", !result.api_remodel_flag);
			$(".remodel_header .assistant_ship img", remodelResultBox)
				.attr("src", KC3Meta.shipIcon(shipId, undefined, false))
				.attr("title", KC3Meta.shipName(KC3Master.ship(shipId).api_name));
			$(".remodel_header", remodelResultBox).addClass("hover").off("click")
				.on("click", function(e) {
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "akashi"
					})).execute();
				});
			$(".remodel_footer .owned_devmats span", remodelResultBox).text(PlayerManager.consumables.devmats);
			$(".remodel_footer .owned_screws span", remodelResultBox).text(PlayerManager.consumables.screws);
			const recipeDetail = data.cachedRecipes[data.recipeId];
			const improveItemBox = $("#factory .remodelSlotItem").clone();
			fillRemodelSlotItemBox(this, improveItemBox, recipeDetail, undefined,
				// Here shows old stars of equipment before improving
				data.lastStars > 0 ? data.lastStars : undefined);
			$(".remodel_improved", remodelResultBox).empty().append(improveItemBox);
			if(result.api_remodel_flag) {
				const afterRemodelIds = result.api_remodel_id;
				const afterRemodelSlot = result.api_after_slot;
				// Indicates equipment is upgraded if 2 master IDs are different
				//const isUpgraded = afterRemodelIds[0] !== afterRemodelIds[1];
				// But no matter upgraded or not, new stars of equipment will be shown anyway
				if(afterRemodelSlot) {
					const upgradeItemBox = $("#factory .remodelSlotItem").clone();
					fillRemodelSlotItemBox(this, upgradeItemBox, {
						// Will show new equipment after being upgraded
						api_slot_id: afterRemodelIds[1], noReqs: true
					}, undefined, afterRemodelSlot.api_level > 0 ? afterRemodelSlot.api_level : undefined);
					$(".remodel_upgrade_title", remodelResultBox).show();
					$(".remodel_upgrade_to", remodelResultBox).empty().append(upgradeItemBox).show();
				} else {
					$(".remodel_upgrade_title", remodelResultBox).hide();
					$(".remodel_upgrade_to", remodelResultBox).hide();
				}
			} else {
				$(".remodel_upgrade_title", remodelResultBox).hide();
				$(".remodel_upgrade_to", remodelResultBox).hide();
			}
			$(".module.activity .activity_remodel").createChildrenTooltips();
			$(".module.activity .activity_tab").removeClass("active");
			$("#atab_activity").addClass("active");
			$(".module.activity .activity_box").hideChildrenTooltips();
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_remodel .remodelList").hide();
			$(".module.activity .activity_remodel .remodelDetail").hide();
			$(".module.activity .activity_remodel .remodelResult").show();
			$(".module.activity .activity_remodel").fadeIn(500);
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
					 4:"screws",
					 5:"coin",
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

			var expedMaster = KC3Master.mission(selectedExpedition);
			$( ".module.activity .activity_expeditionPlanner .expres_greatbtn img" )
				.attr("src", "../../../../assets/img/ui/btn-"+(plannerIsGreatSuccess?"":"x")+"gs.png");
			$(".module.activity .activity_expeditionPlanner .dropdown_title").text(
				KC3Meta.term("ExpedNumLabel") + KC3Master.missionDispNo(selectedExpedition)
				 // Monthly or unknown period
				+ (expedMaster.api_reset_type == 1 ? " (M)" : expedMaster.api_reset_type > 0 ? "(?)" : "")
				+ (expedMaster.api_damage_type > 0 ? " (C)" : "") // Combat
				+ (!expedMaster.api_return_flag ? " (S)" : "")    // Support
			);

			var allShips,
				fleetObj = PlayerManager.fleets[selectedFleet-1];

			// fleets' subscripts start from 0 !
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

			var allShipsForLib = allShips.map(function(ship, idx) {
				var shipMst = ship.master();
				var stypeId = shipMst.api_stype;
				var stype = ST.showSType(ST.fromInt(stypeId));
				var level = ship.level;
				var drumCount = ship.countDrums();
				// Total stats from all ships in fleet, see also `Fleet.js#totalStats`
				// Improvement bonuses should be counted for all expeds, but modifiers are different with sortie's
				var includeImprove = selectedExpedition > 40;
				var los = ship.ls[0],
					aa = ship.aa[0],
					fp = ship.fp[0],
					tp = ship.tp[0];
				// TODO asw stats from aircraft seem be quite different for expeditions
				// https://docs.google.com/spreadsheets/d/1X0ouomAJ02OwHMN7tQRRbMrISkF3RVf4RfZ1Kalhprg/htmlview
				var asw = /*[101, 102, 110].includes(selectedExpedition) ?
					ship.nakedAsw() + ship.effectiveEquipmentTotalAsw(ship.isAswAirAttack(), false, true) :*/
					ship.as[0];
				if (includeImprove) {
					// Should be floored after summing up all ships' stats
					// https://twitter.com/CainRavenK/status/1157636860933337089
					los += ship.equipment(true).map(g => g.losStatImprovementBonus("exped")).sumValues();
					aa += ship.equipment(true).map(g => g.aaStatImprovementBonus("exped")).sumValues();
					fp += ship.equipment(true).map(g => g.attackPowerImprovementBonus("exped")).sumValues();
					tp += ship.equipment(true).map(g => g.attackPowerImprovementBonus("torpedo")).sumValues();
					asw += ship.equipment(true).map(g => g.aswStatImprovementBonus("exped")).sumValues();
				}
				return {
					ammo : 0,
					morale : 0,
					stype : stype,
					isCve : ship.isEscortLightCarrier(),
					level : level,
					drumCount : drumCount,
					asw : asw,
					los : los,
					aa : aa,
					fp : fp,
					tp : tp
				};
			});

			var fleet = KER.fromRawFleet(allShipsForLib);
			var availableExpeditions = KE.getAvailableExpeditions( fleet );

			var unsatRequirements = KER.unsatisfiedRequirements(selectedExpedition)(fleet);
			var condCheckWithoutResupply = unsatRequirements.length === 0;

			// Don't forget to use KERO.*ToObject to convert raw data to JS friendly objs
			var rawExpdReqPack = KERO.getExpeditionRequirementPack(selectedExpedition);

			var ExpdReqPack = KERO.requirementPackToObj(rawExpdReqPack);
			//console.debug(`Exped #${selectedExpedition} needs`, JSON.stringify(ExpdReqPack));
			var ExpdCheckerResult = KERO.resultPackToObject(KERO.checkWithRequirementPack(rawExpdReqPack)(fleet));
			//console.debug(`Exped #${selectedExpedition} checks`, JSON.stringify(ExpdCheckerResult));
			var ExpdCost = KEC.getExpeditionCost(selectedExpedition);
			var KEIB = PS["KanColle.Expedition.IncomeBase"];
			var ExpdIncome = KEIB.getExpeditionIncomeBase(selectedExpedition);
			var ExpdFleetCost = fleetObj.calcExpeditionCost(selectedExpedition);

			$(".module.activity .activity_expeditionPlanner").hideChildrenTooltips();
			var expedTime = ExpdCost.time || expedMaster.api_time;
			$(".module.activity .activity_expeditionPlanner .estimated_time")
				.text(String(60 * expedTime).toHHMMSS())
				.attr("title", String(60 * expedTime).plusCurrentTime(true))
				.lazyInitTooltip();
			if(expedMaster.api_reset_type > 0) {
				const resetTimeTips = [
					$(".module.activity .activity_expeditionPlanner .estimated_time").attr("title")
				];
				if(expedMaster.api_reset_type == 1 && !!PlayerManager.hq.monthlyExpedResetTime) {
					const monthlyResetPoint = String(Math.ceil(
						(PlayerManager.hq.monthlyExpedResetTime * 1000 - Date.now()) / 1000
					)).plusCurrentTime(true);
					resetTimeTips.push("{0}: {1}".format(
						KC3Meta.term("MenuMonthlyExpedReset"), monthlyResetPoint
					));
				}
				$(".module.activity .activity_expeditionPlanner .estimated_time")
					.attr("title", resetTimeTips.join("\n"));
			}

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

			var shipFlagshipLevel = fleetObj.ship(0).level || 1;
			var sparkledCount = fleetObj.ship().filter(s => s.morale >= 50).length;
			var fleetShipCount = fleetObj.countShips();
			var fleetDrumCount = fleetObj.countDrums();
			// reference: https://wikiwiki.jp/kancolle/%E9%81%A0%E5%BE%81#success
			// https://kancolle.fandom.com/wiki/Great_Success
			var gsDrumCountTable = {
				21: 3+1,
				37: 4+1,
				38: 8+2,
				24: 0+4,
				40: 0+4,
				44: 6+2,
			};
			var gsDrumCount = gsDrumCountTable[selectedExpedition];

			var condIsDrumExpedition = !!gsDrumCount;
			var condIsUnsparkledShip = fleetShipCount > sparkledCount;
			var condIsOverdrum = fleetDrumCount >= gsDrumCount;
			var condIsGsWithoutSparkle = [
				// almost all new added expeds, except 42, A1(100), B1(110), B2(111)
				32, 41, 43, 45, 101, 102, 103, 104, 105, 112, 113, 114, 131, 132, 141
			].includes(selectedExpedition);
			var condIsFlagshipLevel = [
				// related to sparkle ships and flagship level: 41, A2(101), A3(102) confirmed, others are to be verified
				// https://twitter.com/jo_swaf/status/1261241711952445440
				41, 101, 102, 43, 45, 103, 104, 105, 112, 113, 114, 131, 132, 141
			].includes(selectedExpedition);

			var estSuccessRate = -1;
			// can GS if:
			// - expedition requirements are satisfied
			// - either drum expedition, or regular expedition with all ships sparkled
			// - or new added flagship level expeditions such as: A2, 41
			if (condCheckWithoutResupply) {
				if (!condIsUnsparkledShip || condIsDrumExpedition) {
					// based on the decompiled vita formula,
					// see https://github.com/KC3Kai/KC3Kai/issues/1951#issuecomment-292883907
					estSuccessRate = 21 + 15 * sparkledCount;
					if (condIsDrumExpedition) {
						estSuccessRate += condIsOverdrum ? 20 : -15;
					}
				} else if (condIsGsWithoutSparkle) {
					if (condIsFlagshipLevel) {
						// https://twitter.com/jo_swaf/status/1145297004995596288
						// https://tonahazana.com/blog-entry-577.html
						estSuccessRate = 16 + 15 * sparkledCount
							+ Math.floor(Math.sqrt(shipFlagshipLevel) + shipFlagshipLevel / 10);
					} else {
						// keep -1 for unknown
					}
				} else {
					estSuccessRate = 0;
				}
			} else {
				estSuccessRate = 0;
			}

			// "???" instead of "?" to make it more noticeable.
			jqGSRate.text(
				(function (rate) {
					if (rate < 0) { return "???%"; }
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
				if (condIsUnsparkledShip && !condIsDrumExpedition && !condIsGsWithoutSparkle) {
					return KC3Meta.term('ExpedGSRateExplainMissingSparkle');
				}
				if (condIsDrumExpedition && !condIsOverdrum) {
					return KC3Meta.term('ExpedGSRateExplainNoOverdrum').format(fleetDrumCount, gsDrumCount);
				}
				if (condIsFlagshipLevel) {
					return KC3Meta.term('ExpedGSRateExplainSparkleAndFlagship').format(sparkledCount, shipFlagshipLevel);
				}
				return KC3Meta.term('ExpedGSRateExplainSparkle').format(sparkledCount);
			})();
			
			jqGSRate.attr("title", tooltipText).lazyInitTooltip();

			// hide GS rate if user does not intend doing so.
			$(".module.activity .activity_expeditionPlanner .row_gsrate")
				.toggle(plannerIsGreatSuccess);

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
			// dataActual: like dataResult, actual fleet value
			// jq: the jq object
			// postActions: (optional) call postActions(dataReq,dataResult,jq, dataActual)
			//				perform actions after jq object is properly set.
			//				note that postActions is only called if the requirement is not null.
			var setupJQObject = function(dataReq, dataResult, dataActual, jq, postActions) {
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
					jq.text(dataReq).attr("title", dataActual).lazyInitTooltip();
					if (typeof(postActions) === "function")
						postActions(dataReq, dataResult, jq, dataActual);
				}
			};

			setupJQObject(
				ExpdReqPack.flagShipLevel,
				ExpdCheckerResult.flagShipLevel,
				fleet[0] && fleet[0].level,
				$(".module.activity .activity_expeditionPlanner .flagshipLv"));


			setupJQObject(
				ExpdReqPack.flagShipTypeOf,
				ExpdCheckerResult.flagShipTypeOf,
				null,
				$(".module.activity .activity_expeditionPlanner .flagshipType"));

			setupJQObject(
				ExpdReqPack.shipCount === 1 ? expedMaster.api_deck_num : ExpdReqPack.shipCount,
				ExpdCheckerResult.shipCount,
				fleet.length,
				$(".module.activity .activity_expeditionPlanner .shipNum")
			);
			if (Array.isArray(expedMaster.api_sample_fleet)) {
				$(".module.activity .activity_expeditionPlanner .shipNum").parent().attr("title",
				"{0}: {1}".format(KC3Meta.term("ExpedSampleFleet"),
					expedMaster.api_sample_fleet.filter(t => !!t).map(t => KC3Meta.stype(t)).join(", ")
				)).lazyInitTooltip();
			}

			setupJQObject(
				ExpdReqPack.levelCount,
				ExpdCheckerResult.levelCount,
				fleet.map(f => f.level).sumValues(),
				$(".module.activity .activity_expeditionPlanner .fleetLv")
			);
			$(".module.activity .activity_expeditionPlanner .hasTotalLv")
				.toggle(ExpdReqPack.levelCount !== null);

			setupJQObject(
				ExpdReqPack.totalAsw,
				ExpdCheckerResult.totalAsw,
				Math.floor(fleet.map(f => f.asw).sumValues()),
				$(".module.activity .activity_expeditionPlanner .totalAsw")
			);
			$(".module.activity .activity_expeditionPlanner .hasTotalAsw")
				.toggle(ExpdReqPack.totalAsw !== null);

			setupJQObject(
				ExpdReqPack.totalAa,
				ExpdCheckerResult.totalAa,
				Math.floor(fleet.map(f => f.aa).sumValues()),
				$(".module.activity .activity_expeditionPlanner .totalAa")
			);
			$(".module.activity .activity_expeditionPlanner .hasTotalAa")
				.toggle(ExpdReqPack.totalAa !== null);

			setupJQObject(
				ExpdReqPack.totalLos,
				ExpdCheckerResult.totalLos,
				Math.floor(fleet.map(f => f.los).sumValues()),
				$(".module.activity .activity_expeditionPlanner .totalLos")
			);
			$(".module.activity .activity_expeditionPlanner .hasTotalLos")
				.toggle(ExpdReqPack.totalLos !== null);

			setupJQObject(
				ExpdReqPack.totalFp,
				ExpdCheckerResult.totalFp,
				Math.floor(fleet.map(f => f.fp).sumValues()),
				$(".module.activity .activity_expeditionPlanner .totalFp")
			);
			$(".module.activity .activity_expeditionPlanner .hasTotalFp")
				.toggle(ExpdReqPack.totalFp !== null);

			setupJQObject(
				ExpdReqPack.totalTorp,
				ExpdCheckerResult.totalTorp,
				Math.floor(fleet.map(f => f.tp).sumValues()),
				$(".module.activity .activity_expeditionPlanner .totalTorp")
			);
			$(".module.activity .activity_expeditionPlanner .hasTotalTorp")
				.toggle(ExpdReqPack.totalTorp !== null);

			setupJQObject(
				ExpdReqPack.fleetSType,
				ExpdCheckerResult.fleetSType,
				null,
				$(".module.activity .activity_expeditionPlanner .expPlanner_req_fleetComposition"),
				function (dataReq, dataResult, jq) {
					jq.empty().removeAttr("title");
					$.each(dataReq, function(index, value) {
						var shipReqBox = $("#factory .expPlanner_shipReqBox")
							.clone().appendTo(jq);
						shipReqBox.text("{0}:{1}"
							.format(dataReq[index].stypeOneOf.join("/"), dataReq[index].stypeReqCount));
						// alternative DE/CVE/CT patterns for exped 4, 5, 9, 42, A3, A4, A5, A6:
						// https://wikiwiki.jp/kancolle/%E9%81%A0%E5%BE%81#escortninmu
						if([4, 5, 9, 42, 102, 103, 104, 105].includes(selectedExpedition)) {
							shipReqBox.attr("title",
								"(CT:1 + DE:2) / (DD:1 + DE:3) / (CVE:1 + DD:2/DE:2) + ??\n" +
								KC3Meta.term("ExpedEscortTip")
							).lazyInitTooltip();
						}
						// alternative compo with CVL + CL for exped 43
						else if([43].includes(selectedExpedition)) {
							shipReqBox.attr("title",
								"(CVE:1 + DD:2/DE:2) / (CVL:1 + CL/CT/DD:1 + DD/DE:2~4) + ??\n" +
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
				fleet.map(f => f.drumCount).sumValues(),
				$(".module.activity .activity_expeditionPlanner .canisterNum")
			);

			setupJQObject(
				ExpdReqPack.drumCarrierCount,
				ExpdCheckerResult.drumCarrierCount,
				fleet.map(f => f.drumCount > 0 & 1).sumValues(),
				$(".module.activity .activity_expeditionPlanner .canisterShipNum")
			);
			$(".module.activity .activity_expeditionPlanner .canister_criterias")
				.toggle(ExpdReqPack.drumCount !== null ||
					ExpdReqPack.drumCarrierCount !== null);

			if (fleetObj.isSupplied()) {
				$(".module.activity .activity_expeditionPlanner .icon.supplyCheck").show();
				$(".module.activity .activity_expeditionPlanner .text.supplyCheck").text(KC3Meta.term("PanelSupplied"));
				markPassed($(".module.activity .activity_expeditionPlanner .text.supplyCheck"));
			} else {
				$(".module.activity .activity_expeditionPlanner .icon.supplyCheck").hide();
				$(".module.activity .activity_expeditionPlanner .text.supplyCheck").text(KC3Meta.term("PanelUnderSupplied"));
				markFailed($(".module.activity .activity_expeditionPlanner .text.supplyCheck"));
			}

			if (condCheckWithoutResupply && fleetObj.isSupplied()) {
				markPassed($(".module.activity .activity_expeditionPlanner .dropdown_title"));
			} else {
				markFailed($(".module.activity .activity_expeditionPlanner .dropdown_title"));
			}
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
					KC3Meta.itemIcon(data.gearObj.master().api_type[3]));
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
							.attr("src", KC3Meta.shipIcon(aaciObj.icons[0], undefined, false) )
							.attr("title", KC3Meta.aacitype(aaciObj.id)[0] || "")
							.lazyInitTooltip();
					} else {
						$(".shipIcon img", aaciBox).hide();
					}
					if(aaciObj.icons.length > 1) {
						for(let i = 1; i < aaciObj.icons.length; i++) {
							const equipIcon = String(aaciObj.icons[i]).split(/[+-]/);
							$("<img/>")
								.attr("src", KC3Meta.itemIcon(equipIcon[0], 1))
								.attr("title", KC3Meta.aacitype(aaciObj.id)[i] || "")
								.lazyInitTooltip()
								.appendTo($(".equipIcons", aaciBox));
							if(equipIcon.length>1) {
								$('<img/>')
									.attr("src", KC3Meta.itemIcon(equipIcon[1], 1))
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

			if (data.equipBonus && data.equipBonus.isShow) {
				$(".activity_gunfit .equip").empty();
				const newShipObj = KC3ShipManager.get(data.shipObj.rosterId);
				const equipBonus = newShipObj.equipmentBonusGearAndStats();
				$.each(equipBonus.bonusGears, (idx, gear) => {
					const equipBox = $("#factory .equipInfo").clone()
						.appendTo(".activity_gunfit .equip");
					const equipIcon = gear.icon;
					for (let i = 0; i < gear.count; i++) {
						if (i > 0) { $("<span></span>").text("+").appendTo($(".equipIcons", equipBox)); }
						$("<img/>").appendTo($(".equipIcons", equipBox))
							.attr("src", KC3Meta.itemIcon(equipIcon))
							.attr("title", gear.name)
							.lazyInitTooltip();
					}
					gear.synergyIcons.forEach((icon, i) => {
						const synergyName = gear.synergyNames[i];
						$("<span></span>").text("+").appendTo($(".equipIcons", equipBox));
						$("<img/>").appendTo($(".equipIcons", equipBox))
							.attr("src", KC3Meta.itemIcon(icon))
							.attr("title", synergyName)
							.lazyInitTooltip();
					});
					equipBox.appendTo(".activity_gunfit .equipList");
				});
				const stats = equipBonus.stats;
				const statsBox = $("<div></div>").addClass("statsBox");
				const statsTermKeyMap = {
					"fp": "ShipFire",
					"tp": "ShipTorpedo",
					"aa": "ShipAntiAir",
					"ar": "ShipArmor",
					"ev": "ShipEvasion",
					"as": "ShipAsw",
					"ls": "ShipLos",
				};
				for (const key in stats) {
					if (stats[key] !== 0) {
						$("<div></div>").appendTo(statsBox)
							.append($("<img/>").attr("src", KC3Meta.statIcon(key)))
							.append($("<span></span>")
								.text("{0}{1}".format(stats[key] >= 0 ? "+" : "", stats[key])))
							.attr("title", KC3Meta.term(statsTermKeyMap[key]) || key)
							.lazyInitTooltip();
					}
				}
				statsBox.appendTo(".activity_gunfit .equip");
				$(".activity_gunfit .equip").show();
			} else {
				$(".activity_gunfit .equip").hide();
			}

			// Show anti-installation powers
			if (data.antiLandPowers) {
				$(".activity_gunfit .landingList").empty();
				// recompute powers after ship stats updated
				const newShipObj = KC3ShipManager.get(data.shipObj.rosterId);
				$.each(newShipObj.shipPossibleAntiLandPowers(), function(idx, info) {
					if(info.enemy > 0) {
						const enemyBox = $("#factory .landingInfo").clone()
							.appendTo(".activity_gunfit .landingList");
						$(".shipIcon img", enemyBox)
							.attr("src", KC3Meta.abyssIcon(info.enemy))
							.attr("alt", info.enemy)
							.attr("title", KC3Meta.abyssShipName(info.enemy))
							.lazyInitTooltip();
						$(".dayPower .value", enemyBox).text(info.dayPower);
						$(".nightPower .value", enemyBox).text(info.nightPower);
						const tooltip = KC3Meta.term("PanelAntiLandPowerTip").format(
							Math.qckInt("floor", info.modifiers.antiLandModifier, 3),
							info.modifiers.antiLandAdditive,
							Math.qckInt("floor", info.modifiers.postCapAntiLandModifier, 3),
							info.modifiers.postCapAntiLandAdditive,
							info.damagedPowers[0],
							info.damagedPowers[1]);
						$(".modifiers", enemyBox).attr("title", tooltip).lazyInitTooltip();
					}
				});
				$(".activity_gunfit .landing").show();
			} else {
				$(".activity_gunfit .landing").hide();
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

	function openSimulatorWindow(hashData, isPopup) {
		try {
			const url = "https://kc3kai.github.io/kancolle-replay/simulator.html#" + JSON.stringify(hashData);
			const ref = window.open(url, "simulator", (!isPopup ? undefined : "width=640,height=480,resizeable,scrollbars"));
			if(ref && !ref.closed){
				// Update hash with latest battle data even if window already opened
				// this might not work for all browser versions as a vulnerability to bypass CORS
				ref.location.replace(url);
				// Switch focus to the window if possible
				if(ref.focus) ref.focus();
			}
		} catch (e) {
			console.warn("Failed to open battle simulator", e);
		}
	}

	function updateQuestActivityTab(isGoHome) {
		if (ConfigManager.info_quest_activity) {
			$(".activity_tabs .activity_tab").addClass("tab_count_5");
			$("#atab_quest").show();
			if (!!isGoHome && $("#atab_quest").hasClass("active")) {
				$("#atab_basic").trigger("click");
			}
		} else {
			$(".activity_tabs .activity_tab").removeClass("tab_count_5");
			$("#atab_quest").hide();
			if ($("#atab_quest").hasClass("active")) {
				$("#atab_basic").trigger("click");
			}
		}
	}

	function updateEnemyHpBarStyles(hpBarSelector, hpPercent, maxWidth) {
		if(maxWidth > 0) {
			$(hpBarSelector).css("width", maxWidth * hpPercent);
		}
		if(hpPercent === undefined || isNaN(hpPercent)) {
			$(hpBarSelector).css("background", "#999999");
		} else if(hpPercent <= 0.25) {
			$(hpBarSelector).css("background", "#FF0000");
		} else if(hpPercent <= 0.50) {
			$(hpBarSelector).css("background", "#FF9900");
		} else if(hpPercent <= 0.75) {
			$(hpBarSelector).css("background", "#FFFF00");
		} else {
			$(hpBarSelector).css("background", "#00FF00");
		}
		$(hpBarSelector).parent().toggleClass("sunk", hpPercent <= 0);
	}

	function fillRemodelSlotItemBox(self, itemBox, recipe, rosterId, stars) {
		if(!recipe.api_slot_id) return itemBox;
		const gearMst = KC3Master.slotitem(recipe.api_slot_id);
		const gearPng = KC3Master.png_file(gearMst.api_id, "item_on", "slot");
		if(!recipe.noReqs) {
			$(".remodel_slot_itemon img", itemBox)
				.attr("src", `${myKcServerHost}/kcs2/resources${gearPng}`)
				.attr("alt", "[{0}]".format(gearMst.api_id))
				.error(function() { $(this).off("error").attr("src", "/assets/img/ui/empty.png"); })
				.attr("title", gearMst.api_info || "")
				.data("masterId", gearMst.api_id)
				.on("click", self.gearDoubleClickFunction);
		} else {
			itemBox.addClass("noReqs");
		}
		$(".remodel_slot_icon img", itemBox)
			.attr("src", KC3Meta.itemIcon(gearMst.api_type[3]))
			.attr("title", (recipe.api_id ? "{0}" : "[{0}]")
				.format(recipe.api_id || gearMst.api_id))
			.data("masterId", gearMst.api_id)
			.on("dblclick", self.gearDoubleClickFunction);
		$(".remodel_slot_name", itemBox)
			.text(KC3Meta.gearName(gearMst.api_name))
			.attr("title", KC3Meta.gearName(gearMst.api_name));
		if(rosterId > 0) {
			stars = KC3GearManager.get(rosterId).stars;
		}
		if(stars !== undefined) {
			$(".remodel_slot_star span", itemBox).text(stars);
			$(".remodel_slot_star", itemBox).show();
			itemBox.addClass("withStar");
		}
		if(!recipe.noReqs) {
			["fuel", "ammo", "steel", "bauxite", "devmats", "screws"].forEach((key, i) => {
				const isKit = ["devmats", "screws"].includes(key);
				$(".remodel_slot_reqs .remodel_req_{0} span{1}"
					.format(key, isKit ? ".req" : ""), itemBox).text(
					(isKit ? "x" : "") +
					(recipe["api_req_" + ({
						"ammo": "bull",
						"devmats": "buildkit",
						"screws": "remodelkit"
					}[key] || key)] || 0)
				);
				if(isKit) {
					const certainValue = recipe["api_certain_" + ({
							"devmats": "buildkit",
							"screws": "remodelkit"
						}[key] || key)] || 0;
					$(`.remodel_slot_reqs .remodel_req_${key} span.certain`, itemBox)
						.text(`(${certainValue})`).css("display", certainValue > 0 ? "inline" : "none");
				}
			});
		}
		return itemBox;
	}

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
			.text( KC3Meta.formatNumber(PlayerManager.hq.exp[hqDt]) );
	}

	function buildContactPlaneSpan(fcontactId, fcontact, econtactId, econtact) {
		var fContactIcon = null,
			eContactIcon = null,
			contactSpan = $("<span/>");
		if(fcontactId > 0){
			var fcpMaster = KC3Master.slotitem(fcontactId);
			fContactIcon = $("<img />")
				.attr("src", KC3Meta.itemIcon(fcpMaster.api_type[3]))
				.attr("title", KC3Meta.gearName(fcpMaster.api_name));
		}
		if(econtactId > 0){
			var ecpMaster = KC3Master.slotitem(econtactId);
			eContactIcon = $("<img />")
				.attr("src", KC3Meta.itemIcon(ecpMaster.api_type[3]))
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
			onBoss    = KC3SortieManager.currentNode().isValidBoss(),
			depleteOK = onBoss || !!noBoss;

		// Normalize Parameters
		fsKill = !!fsKill;
		gaugeDmg = (gaugeDmg || 0) * (depleteOK);

		if(Object.keys(thisMap).length > 0){
			$(".module.activity .map_info").removeClass("map_finisher");
			$(".module.activity .map_hp").removeAttr("title");
			if( thisMap.clear && !thisMap.killsRequired ){
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
					$(".module.activity .map_hp")
						.text( thisMap.curhp + " / " + thisMap.maxhp );
					$(".module.activity .map_gauge")
						.find('.nowhp').css("width", (rate[0])+"%").end()
						.find('.curhp').css("width", (rate[1])+"%").end();

					requireFinisher = thisMap.curhp > 0 && thisMap.curhp <= thisMap.baseHp;
				// If kill-based gauge
				}else{
					var totalKills = thisMap.killsRequired || KC3Meta.gauge( thisMapId );
					console.debug("Map " + thisMapId + " total kills:", totalKills);
					var
						killsLeft  = totalKills - thisMap.kills + (!onBoss && !!noBoss),
						postBounty = killsLeft - (depleteOK && fsKill);
					if(totalKills){
						$(".module.activity .map_hp")
							.text( killsLeft + " / " + totalKills + KC3Meta.term("BattleMapKills"));
						$(".module.activity .map_gauge")
							.find('.curhp').css("width", ((postBounty/totalKills)*100)+"%").end()
							.find('.nowhp').css("width", ( (killsLeft/totalKills)*100)+"%").end();

						requireFinisher = killsLeft > 0 && killsLeft <= 1;
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
						$(".module.activity .map_hp")
							.attr("title", $(".module.activity .map_hp").text())
							.text(KC3Meta.term("StrategyEvents1HP"))
							.lazyInitTooltip();
					})();
				}
			}
		}else{
			$(".module.activity .map_hp").removeAttr("title")
				.text( KC3Meta.term("BattleMapNoHpGauge") );
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
