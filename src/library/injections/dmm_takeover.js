(function(){
	'use strict';
	var config = {};
	var master = {};
	var meta = {};
	var quests = {};

	window.DMMCustomizations = {
		apply: function(response){
			console.log('Applying DMM customizations...');

			config = $.extend(true, ConfigManager, response.config);
			master = $.extend(true, KC3Master, response.master);
			meta   = $.extend(true, KC3Meta, response.meta);
			quests = $.extend(true, KC3QuestManager, response.quests);
			$.extend(true, RemodelDb, response.remodel);

			this.windowFocus();
			this.attachHTML();
			this.layout();
			this.backgrounds();
			this.subtitleSpace();
			this.clearOverlayHotKey();
			this.exitConfirmation();
			this.screenshotHotkey();

			chrome.runtime.onMessage.addListener(this.subtitlesOverlay());
			chrome.runtime.onMessage.addListener(this.clearOverlays());
			chrome.runtime.onMessage.addListener(this.questOverlay());
			chrome.runtime.onMessage.addListener(this.mapMarkersOverlay());
			chrome.runtime.onMessage.addListener(this.getWindowSize());
			chrome.runtime.onMessage.addListener(this.getGamescreenOffset());
			chrome.runtime.onMessage.addListener(this.idleTimer());
		},

		/* WINDOW KEEP FOCUS, NOT FLASH
		So we can detect keydown for hotkeys
		--------------------------------------*/
		nonFocusSeconds: 0,
		windowFocus: function(){
			var self = this;

			// Timer to keep auto-focusing on window every second
			setInterval(function(){
				if(self.nonFocusSeconds === 0){
					window.focus();
				}else{
					self.nonFocusSeconds--;
				}
			}, 1000);

			// Press F7 to stop focusing on window to get time to focus on flash
			$(document).on("keydown", function(event){
				if (event.which === 118) {
					self.nonFocusSeconds = 20;
				}
				// Press Tab to show special HUD
				if (event.which === 9) {
					// reserved for implementation
					event.stopPropagation();
					event.preventDefault();
				}
			});
		},

		/* CUSTOM HTML TAGS
		For tags not in DMM but needed by our UI
		Looking at ReactJS for KC3KaiNi
		--------------------------------------*/
		attachHTML: function(){
			// Overlay screens
			var overlays = $("<div>").addClass("overlays").appendTo("#area-game");

			var overlay_quests = $("<div>").addClass("overlay_box overlay_quests");
			overlays.append(overlay_quests);

			var overlay_markers = $("<div>").addClass("overlay_box overlay_markers");
			overlays.append(overlay_markers);

			var overlay_subtitles = $("<div>").addClass("overlay_box overlay_subtitles")
				.append($("<span>"));
			overlays.append(overlay_subtitles);

			var overlay_idle = $("<div>").addClass("overlay_box overlay_idle")
				.append($("<span>"));
			overlays.append(overlay_idle);

			// Clonable Factory
			var factory = $("<div>").attr("id", "factory").appendTo("body");

			var ol_quest = $("<div>").addClass("overlay ol_quest ol_quest_exist")
				.append($("<div>").addClass("icon with_tl"))
				.append($("<div>").addClass("content with_tl")
					.append($("<div>").addClass("name"))
					.append($("<div>").addClass("desc"))
				)
				.append($("<div>").addClass("tracking with_tl"))
				.append($("<div>").addClass("no_tl hover").text("?"))
				.appendTo("#factory");

			var ol_quest_empty = $("<div>").addClass("overlay ol_quest ol_quest_empty")
				.appendTo("#factory");
		},

		/* DMM PAGE LAYOUT
		Override layout to only show game frame
		--------------------------------------*/
		resizeTimer: 0,
		gameZoomScale: 1,
		layout: function(){
			this.gameZoomScale = (config.api_gameScale || 100) / 100;
			$("body").addClass("kc3");
			$("body").css({ margin:0, padding:0, 'min-width':0, 'min-height':0 });
			$("#main-ntg").css({ position: 'static' });
			$("#area-game").css({
				'margin-left': 'auto',
				'margin-right': 'auto',
				padding: 0,
				width: 800,
				height: 480,
				position: 'relative',
				zoom: this.gameZoomScale
			});
			$("#game_frame").css({
				width: 800,
				height: 480
			});
			$(".dmm-ntgnavi").hide();
			$(".area-naviapp").hide();
			$("#ntg-recommend").hide();
			$("#foot").hide();
			$("#foot").next().hide();
			$("#w, #main-ntg, #page").css({
				margin:0,
				padding:0,
				width: '100%',
				height: 0
			});
			$(document).on("ready", this.resizeGameFrameFinal);
			$(window).on("load", this.resizeGameFrameFinal);

			var self = this;
			this.resizeTimer = setInterval(function(){
				if ($("#game_frame").width() != 800 || $("#game_frame").height() != 480) {
					self.resizeGameFrame();
				}
			}, 10000);
		},
		// Resize game frame to 800x480
		resizeGameFrame: function(){
			console.log("Resizing game frame to 800x480");
			$("#game_frame").css({
				width: 800,
				height: 480
			});
		},
		// Final process on document ready
		resizeGameFrameFinal: function(){
			// Do not clear resize timer for now, because
			// there may be many other facts affecting document loading and sizing.
			// As it's tiny footprint, let it keep running at larger interval
			/*
			if(window.DMMCustomizations.resizeTimer){
				clearInterval(window.DMMCustomizations.resizeTimer);
			}
			*/
			window.DMMCustomizations.resizeGameFrame();
		},

		/* BACKGROUND CUSTOMIZATIONS
		Let users customize background via settings
		--------------------------------------*/
		backgrounds: function(){
			var self = this;
			// Top Margin from game frame to window
			$("#area-game").css("margin-top", config.api_margin+"px");

			// Keep background image size fitting to window, see issue #1824
			var autoFitWindowHeight = function(){
				// Only suppose for narrow window (such as horizontal panel),
				// as viewport height will be larger than game player, but computed body height is 0
				// For wide window, the height may not fit viewport height,
				// especially when it's smaller than game player, and scrollbar appears
				var visibleHeight = $(window).height() - self.gameZoomScale
					* (($("#area-game").offset() || {}).top || 0);
				$("body").css("min-height", visibleHeight);
				// Prevent scrollbar shown if computed height not accurate but larger than game player
				$("body").css("overflow-y", !$("#alert").is(":visible")
					&& visibleHeight > self.gameZoomScale * 480 ? "hidden" : "auto");
			};
			// Background
			if(!config.api_bg_image){
				// Solid color
				$("body").css("background", config.api_bg_color);
			}else{
				// Image URL
				$("body").css("background-image", "url("+config.api_bg_image+")");
				$("body").css("background-color", config.api_bg_color);
				$("body").css("background-size", config.api_bg_size);
				$("body").css("background-position", config.api_bg_position);
				$("body").css("background-repeat", "no-repeat");
				autoFitWindowHeight();
				$(window).resize(autoFitWindowHeight);
			}

			// User css customizations
			if(config.dmm_custom_css !== ""){
				var customCSS = document.createElement("style");
				customCSS.type = "text/css";
				customCSS.innerHTML = config.dmm_custom_css;
				$("head").append(customCSS);
			}
		},

		/* SUBTITLE BOX
		Only prepares the container box for subtitles
		--------------------------------------*/
		subtitlePosition: "bottom",
		subtitleSpace: function(){
			var self = this;

			if(config.api_subtitles){
				// Subtitle font customizations
				$(".overlay_subtitles").css("font-family", config.subtitle_font);
				$(".overlay_subtitles").css("font-size", config.subtitle_size);
				if(config.subtitle_bold){
					$(".overlay_subtitles").css("font-weight", "bold");
				}

				// Subtitle display modes
				switch (config.subtitle_display) {
					case "bottom":
						$(".overlay_subtitles span").css("pointer-events", "none");
						break;
					case "below":
						$("#area-game").css({ overflow:'', height:'' });
						$(".overlay_subtitles").appendTo("#area-game");
						$(".overlay_subtitles").css({
							position: "relative",
							margin: "5px auto 0px",
							left: "auto",
							top: "auto",
							bottom: "auto",
							right: "auto",
							width: $("#area-game").width()
						});
						break;
					case "stick":
						$(".overlay_subtitles").appendTo("body");
						$(".overlay_subtitles").css({
							position: "fixed",
							left: "50%",
							top: "auto",
							bottom: "3px",
							right: "auto",
							margin: "0px 0px 0px "+(-($("#area-game").width()/2))+"px",
							width: $("#area-game").width()
						});
						break;
					default: break;
				}

				// Overlay avoids cursor
				$(".overlay_subtitles span").on("mouseover", function(){
					switch (config.subtitle_display) {
						case "evade":
							if (self.subtitlePosition == "bottom") {
								$(".overlay_subtitles").css("bottom", "");
								$(".overlay_subtitles").css("top", "5px");
								self.subtitlePosition = "top";
							} else {
								$(".overlay_subtitles").css("top", "");
								$(".overlay_subtitles").css("bottom", "5px");
								self.subtitlePosition = "bottom";
							}
							break;
						case "ghost":
							$(".overlay_subtitles").addClass("ghost");
							break;
						default: break;
					}
				});
			}
		},

		/* SUBTITLES OVERLAY
		Displays subtitles on voice audio file requested
		--------------------------------------*/
		subtitleTimer: null,
		subtitleVanishBaseMillis: null,
		subtitleVanishExtraMillisPerChar: null,
		subtitleHourlyTimer: null,
		subtitleHourlyShip: 0,
		subtitlesOverlay: function(){
			var self = this;
			return function(request, sender, response){
				if(request.action != "subtitle") return true;
				config = $.extend(true, ConfigManager, request.ConfigManager);
				if(!config.api_subtitles) return true;

				// Get subtitle text
				var subtitleText = false;
				var quoteIdentifier = "";
				var quoteVoiceNum = request.voiceNum;
				var quoteVoiceSize = request.voiceSize;
				var quoteVoiceDuration = request.duration;
				var quoteSpeaker = "";
				switch(request.voicetype){
					case "titlecall":
						quoteIdentifier = "titlecall_"+request.filename;
						break;
					case "npc":
						quoteIdentifier = "npc";
						break;
					case "event":
						quoteIdentifier = "event";
						break;
					case "abyssal":
						quoteIdentifier = "abyssal";
						if(config.subtitle_speaker){
							const abyssalId = KC3Meta.getAbyssalIdByFilename(quoteVoiceNum);
							quoteSpeaker = KC3Meta.abyssShipName(abyssalId);
						}
						break;
					default:
						quoteIdentifier = request.shipID;
						if(config.subtitle_speaker){
							quoteSpeaker = meta.shipName(master.ship(quoteIdentifier).api_name);
						}
						break;
				}
				subtitleText = meta.quote( quoteIdentifier, quoteVoiceNum, quoteVoiceSize );

				// Lazy init timing parameters
				if(!self.subtitleVanishBaseMillis){
					self.subtitleVanishBaseMillis = Number(meta.quote("timing", "baseMillisVoiceLine")) || 2000;
				}
				if(!self.subtitleVanishExtraMillisPerChar){
					self.subtitleVanishExtraMillisPerChar = Number(meta.quote("timing", "extraMillisPerChar")) || 50;
				}

				const hideSubtitle = () => {
					// hide first to fading will stop
					$(".overlay_subtitles").stop(true, true);
					$(".overlay_subtitles").hide();
					// If subtitle removal timer is ongoing, reset
					if(self.subtitleTimer){
						if(Array.isArray(self.subtitleTimer))
							self.subtitleTimer.forEach(clearTimeout);
						else
							clearTimeout(self.subtitleTimer);
					}
				};
				hideSubtitle();

				// Display subtitle and set its removal timer
				const showSubtitle = (subtitleText, quoteIdentifier) => {
					// Simple one line quote
					if($.type(subtitleText) === "string") {
						showSubtitleLine(subtitleText, quoteIdentifier);
						const millis = quoteVoiceDuration || (self.subtitleVanishBaseMillis +
							self.subtitleVanishExtraMillisPerChar * $(".overlay_subtitles").text().length);
						self.subtitleTimer = setTimeout(fadeSubtitlesOut, millis);
						return;
					}
					// Quotes of multi-lines with customized delay times
					self.subtitleTimer = [];
					let lastLineOutMillis = 0;
					$.each(subtitleText, (delay, text) => {
						const delays = String(delay).split(',');
						const millis = Number(delays[0]);
						lastLineOutMillis = delays.length > 1 ? Number(delays[1]) :
							(millis + self.subtitleVanishBaseMillis +
							// Length will be inaccurate if text includes html chars
							(self.subtitleVanishExtraMillisPerChar * text.length));
						self.subtitleTimer.push(setTimeout(() => {
							showSubtitleLine(text, quoteIdentifier);
						}, millis));
					});
					self.subtitleTimer.push(setTimeout(fadeSubtitlesOut, lastLineOutMillis));
				};

				const fadeSubtitlesOut = () => {
					self.subtitleTimer = false;
					$(".overlay_subtitles").fadeOut(1000, function(){
						switch (config.subtitle_display) {
							case "evade":
								$(".overlay_subtitles").css("top", "");
								$(".overlay_subtitles").css("bottom", "5px");
								self.subtitlePosition = "bottom";
								break;
							case "ghost":
								$(".overlay_subtitles").removeClass("ghost");
								break;
							default: break;
						}
					});
				};

				const showSubtitleLine = (subtitleText, quoteIdentifier) => {
					$(".overlay_subtitles span").html(subtitleText);
					if(!!quoteSpeaker){
						$(".overlay_subtitles span").html("{0}: {1}".format(quoteSpeaker, subtitleText));
					}
					$(".overlay_subtitles").toggleClass("abyssal", quoteIdentifier === "abyssal");
					$(".overlay_subtitles").show();
				};

				const cancelHourlyLine = () => {
					if(self.subtitleHourlyTimer) clearTimeout(self.subtitleHourlyTimer);
					self.subtitleHourlyTimer = false;
					self.subtitleHourlyShip = 0;
				};

				const bookHourlyLine = (text, shipId) => {
					cancelHourlyLine();
					const nextHour = new Date().shiftHour(1).resetTime(["Minutes", "Seconds", "Milliseconds"]).getTime();
					const diffMillis = nextHour - Date.now();
					// Do not book on unexpected diff time: passed or > 59 minutes
					if(diffMillis <= 0 || diffMillis > 59 * 60000) {
						showSubtitle(text, shipId);
					} else {
						self.subtitleHourlyShip = shipId;
						self.subtitleHourlyTimer = setTimeout(function(){
							// Should cancel booked hourly line for some conditions
							if(self.subtitleHourlyShip == shipId
								// if Chrome delays timer execution > 3 seconds
								&& Math.abs(Date.now() - nextHour) < 3000
								// TODO && at home port && secretary unchanged
							){
								hideSubtitle();
								showSubtitle(text, shipId);
							}
							cancelHourlyLine();
						}, diffMillis);
					}
				};

				// If subtitles available for the voice
				if(subtitleText){
					// Book for a future display if it's a ship's hourly voice,
					// because game preload voice file in advance (about > 5 mins).
					if(!isNaN(Number(quoteIdentifier)) && KC3Meta.isHourlyVoiceNum(quoteVoiceNum)){
						if(config.subtitle_hourly){
							bookHourlyLine(subtitleText, quoteIdentifier);
						}
					} else {
						showSubtitle(subtitleText, quoteIdentifier);
					}
				}

			};
		},

		/* QUEST OVERLAYS
		On-screen translation on quest page
		--------------------------------------*/
		questOverlay: function(){
			var self = this;

			// untranslated quest clickable google translate
			$(".overlay_quests").on("click", ".no_tl", function(){
				window.open("https://translate.google.com/#ja/"+config.language+"/"
					+encodeURIComponent($(this).data("qtitle"))
					+"%0A%0A"
					+encodeURIComponent($(this).data("qdesc")), "_blank");
			});

			// runtime listener
			return function(request, sender, response){
				if(request.action != "questOverlay") return true;
				config = $.extend(true, ConfigManager, request.ConfigManager);
				if(!config.api_translation && !config.api_tracking) return true;

				quests = $.extend(true, KC3QuestManager, request.KC3QuestManager);
				$(".overlay_quests").empty();

				$.each(request.questlist, function( index, QuestRaw ){
					if( QuestRaw !=- 1 && index < 5 ){
						const QuestBox = $("#factory .ol_quest_exist").clone();
						QuestBox.appendTo(".overlay_quests");

						// Get quest data from manager and
						// rebuild KC3Quest instance because serialized data only keep owned properties
						const QuestData = new KC3Quest();
						QuestData.define(quests.get( QuestRaw.api_no ));

						// Show meta, title and description
						if( QuestData.meta().available ){

							if (config.api_translation){
								$(".name", QuestBox).text( QuestData.meta().name );
								$(".desc", QuestBox).text( QuestData.meta().desc );
							}else{
								$(".content", QuestBox).css({opacity: 0});
							}

							if(config.api_tracking){
								$(".tracking", QuestBox).html( QuestData.outputHtml() );
								// Special cases multiple requirements, such as Bw1, Bq2
								if(QuestData.tracking && QuestData.tracking.length > 1){
									$(".tracking", QuestBox).addClass("small");
								}
							}else{
								$(".tracking", QuestBox).hide();
							}

						}else{
							if(config.google_translate) {
								$(".with_tl", QuestBox).css({ visibility: "hidden" });
								$(".no_tl", QuestBox).data("qid", QuestRaw.api_no);
								$(".no_tl", QuestBox).data("qtitle", QuestRaw.api_title);
								$(".no_tl", QuestBox).data("qdesc", QuestRaw.api_detail);
								$(".no_tl", QuestBox).show();
							} else {
								QuestBox.css({ visibility: "hidden" });
							}
						}
					}
				});
				response({success:true});
			};
		},

		/* CLEAR OVERLAYS
		Empties or hides current shown or filled overlays
		--------------------------------------*/
		clearOverlayHotKey: function(){
			var self = this;
			$(document).on("keydown", function(event){
				// F10: Clear overlays
				if (event.which === 121) {
					self.clearOverlays()({action:'clearOverlays'}, {}, function(){});
				}
			});
		},
		clearOverlays: function(){
			var self = this;
			return function(request, sender, response){
				if(request.action != "clearOverlays") return true;
				$(".overlay_quests").empty();
				$(".overlay_markers").empty();
				$(".overlay_subtitles span").empty();
				response({success:true});
			};
		},

		/* EXIT CONFIRMATION
		Attach onUnload listener to stop accidental exit
		--------------------------------------*/
		exitConfirmation: function(){
			if (!config.api_askExit) return false;
			window.onbeforeunload = function(){
				// Not support custom message any more, see:
				// https://bugs.chromium.org/p/chromium/issues/detail?id=587940
				return meta.term("UnwantedExitDMM");
			};
		},

		/* GET WINDOW SIZE
		Used for "Fit Screen" function
		FitScreen itself is executed in background service
		Content Scripts like this don't have access to needed chrome.* API
		--------------------------------------*/
		getWindowSize: function(){
			return function(request, sender, response){
				if(request.action != "getWindowSize") return true;
				response({
					width: $(window).width(),
					height: $(window).height(),
					game_zoom: $("#area-game").css("zoom"),
					margin_top: parseInt($("#area-game").css("margin-top"))
				});
			};
		},

		/* SCREENSHOT HOTKEY
		Ask background service to take my selfie
		--------------------------------------*/
		screenshotHotkey: function(){
			var self = this;
			$(document).on("keydown", function(event){
				// F9: Screenshot
				if (event.which === 120) {
					(new RMsg("service", "screenshot", {})).execute();
				}
			});
		},

		/* GET GAMESCREEN OFFSET
		Used for taking screenshots
		FitScreen itself is executed in background service
		Content Scripts like this don't have access to needed chrome.* API
		--------------------------------------*/
		getGamescreenOffset: function(){
			return function(request, sender, response){
				if(request.action != "getGamescreenOffset") return true;
				response({
					top: $("#area-game").offset().top,
					left: $("#area-game").offset().left
				});
			};
		},

		/* MAP MARKERS OVERLAY
		Node markers on screen during sortie
		--------------------------------------*/
		markersOverlayTimer: false,
		mapMarkersOverlay: function(){
			var self = this;
			return function(request, sender, response){
				if(request.action != "markersOverlay") return true;
				if(!(request.ConfigManager || config).map_markers) {
					response({success:false}); return true;
				}

				var sortieStartDelayMillis = 2800;
				var markersShowMillis = 5000;
				var compassLeastShowMillis = 3500;
				if(self.markersOverlayTimer){
					// Keep showing if last ones not disappear yet
					clearTimeout(self.markersOverlayTimer);
					$(".overlay_markers").show();
				} else {
					var letters = meta.nodeLetters(request.worldId, request.mapId);
					var lettersFound = (!!letters && Object.keys(letters).length > 0);
					var icons = meta.nodeMarkers(request.worldId, request.mapId);
					var iconsFound =  (!!icons.length && icons.length > 0);
					$(".overlay_markers").hide().empty();
					if(lettersFound){
						// Show node letters
						var l;
						for(l in letters){
							var letterDiv = $('<div class="letter"></div>').text(l)
								.css("left", letters[l][0] + "px")
								.css("top", letters[l][1] + "px");
							$(".overlay_markers").append(letterDiv);
						}
					}
					if(iconsFound){
						// Show some icon style markers
						var i;
						for(i in icons){
							var obj = icons[i];
							var iconImg = $('<img />')
								.attr("src", chrome.extension.getURL("assets/img/"+ obj.img))
								.attr("width", obj.size[0])
								.attr("height", obj.size[1]);
							var iconDiv = $('<div class="icon"></div>')
								.css("left", obj.pos[0] + "px")
								.css("top", obj.pos[1] + "px")
								.append(iconImg);
							$(".overlay_markers").append(iconDiv);
						}
					}
					if(request.needsDelay){
						// Delay to show on start of sortie
						setTimeout(function(){
							$(".overlay_markers").fadeIn(1000);
						}, sortieStartDelayMillis);
					} else {
						$(".overlay_markers").fadeIn(1000);
					}
					self.markersOverlayTimer = true;
				}
				if(self.markersOverlayTimer){
					self.markersOverlayTimer = setTimeout(function(){
						$(".overlay_markers").fadeOut(2000);
						self.markersOverlayTimer = false;
					}, markersShowMillis
						+ (request.compassShow ? compassLeastShowMillis : 0)
						+ (request.needsDelay ? sortieStartDelayMillis : 0)
					);
				}
				response({success:true});
			};
		},

		/* IDLE TIMER
		Ask background service to take my selfie
		--------------------------------------*/
		idleTimerHandler: false,
		idleTimer: function(){
			let lastNetworkTime = (new Date()).getTime();
			let hideIdleScreen = false;
			let maxIdleScreenOpacity = 0.8;

			// idle time unit is second
			let timeIdleStartSec = config.alert_idle_start;
			let timeIdleStart = Math.floor(timeIdleStartSec * 1000);
			let timeIdleMax = timeIdleStart + 100000;

			// Timer that checks idle time and show UI
			this.idleTimerHandler = setInterval(function(){
				let idleMillis = (new Date()).getTime() - lastNetworkTime;
				// If idle for more than setting seconds, start to show UI
				if (idleMillis > timeIdleStart && !!timeIdleStart && !hideIdleScreen) {
					$(".overlay_idle").show();
					$(".overlay_idle").css({ opacity:1 });
					$(".overlay_idle").text(String(Math.floor(idleMillis/1000)).toHHMMSS());
					let opacity = (idleMillis - timeIdleStart) / (timeIdleMax - timeIdleStart);
					opacity = Math.round(opacity * 100) / 100;
					if (opacity > maxIdleScreenOpacity) opacity = maxIdleScreenOpacity;
					if (opacity < 0) opacity = 0;
					$(".overlay_idle").css({
						background: "radial-gradient(ellipse at center, rgba(0,0,0,"+(opacity/2)+") 0%, rgba(0,0,0,"+opacity+") 100%)"
					});
				}
			}, 1000);

			// Hide on mouse click
			$(".overlay_idle").on("click", function(){
				hideIdleScreen = true;
				$(this).hide();
			});

			// Receives and remembers the time when a network request was last made
			return function(request, sender, response){
				if (!config.alert_idle_start // to exclude falsy values like NaN and 0
					|| config.alert_idle_start <= 0)
					return true;
				if(request.action != "goodResponses") return true;
				lastNetworkTime = (new Date()).getTime();
				hideIdleScreen = false;
				$(".overlay_idle").hide();
			};
		}
	};

})();
