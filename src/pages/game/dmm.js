_gaq.push(['_trackPageview']);

// If awaiting activation
var waiting = true;

// If trusted exit, for exit confirmation
var trustedExit = false;

// Used to fade out subtitles after calculated duration
var subtitleTimer = false;
var subtitleVanishBaseMillis;
var subtitleVanishExtraMillisPerChar;
var subtitleHourlyTimer = false;
var subtitleHourlyShip = 0;

// Holder object for audio files to test mp3 duration
var subtitleMp3;

// If auto-focus on window to capture key events or not
var autoFocus = 0;

// Critical Animation
var critAnim = false;
var taihaStatus = false;

// Screenshot status
var isTakingScreenshot = false;
var suspendedTaiha = false;

// Overlay avoids cursor
var subtitlePosition = "bottom";

// Overlay for map markers
var markersOverlayTimer = false;

// Idle time check
/*
  variables explanation:
  longestIdleTime - high score of idle time
  idleTimer       - timer ID for interval function of idleFunction
  idleTimeout     - timer ID for unsafe idle time marker
  idleFunction    - function that indicates the way of the idle counter
*/
localStorage.longestIdleTime = Math.max(localStorage.longestIdleTime || 0,1800000);
var
	lastRequestMark = Date.now(),
	idleTimer,
	idleTimeout,
	idleFunction;

// Show game screens
function ActivateGame(){
	waiting = false;
	var scale = (ConfigManager.api_gameScale || 100) / 100;
	$(".box-wrap").css("background", "#fff");
	$(".box-wait").hide();
	$(".game-swf").remove();
	$(".box-game")
		.prepend("<iframe class=game-swf frameborder=0></iframe>")
		.find(".game-swf")
		.attr("src", "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/")
		.end()
		.show();
	$(".box-wrap").css({
		"background": "#fff",
		"width": 1200,
		"zoom": scale,
		"margin-top": ConfigManager.api_margin
	});
	idleTimer = setInterval(idleFunction,1000);
	if(ConfigManager.alert_idle_counter) {
		$(".game-idle-timer").trigger("refresh-tick");
	}
}

$(document).on("ready", function(){
	// Initialize data managers
	ConfigManager.load();
	KC3Master.init();
	RemodelDb.init();
	KC3Meta.init("../../../../data/");
	KC3Meta.loadQuotes();
	KC3QuestManager.load();
	KC3Database.init();
	KC3Translation.execute();
	
	// User css customizations
	if(ConfigManager.dmm_custom_css !== ""){
		var customCSS = document.createElement("style");
		customCSS.type = "text/css";
		customCSS.id = "dmm_custom_css";
		customCSS.innerHTML = ConfigManager.dmm_custom_css;
		$("head").append(customCSS);
	}
	
	// Apply interface configs
	if(ConfigManager.api_bg_image === ""){
		$("body").css("background", ConfigManager.api_bg_color);
	}else{
		$("body").css("background-image", "url("+ConfigManager.api_bg_image+")");
		$("body").css("background-color", ConfigManager.api_bg_color);
		$("body").css("background-size", ConfigManager.api_bg_size);
		$("body").css("background-position", ConfigManager.api_bg_position);
		$("body").css("background-repeat", "no-repeat");
	}
	
	if(ConfigManager.api_subtitles){
		$(".overlay_subtitles").css("font-family", ConfigManager.subtitle_font);
		$(".overlay_subtitles").css("font-size", ConfigManager.subtitle_size);
		if(ConfigManager.subtitle_bold){
			$(".overlay_subtitles").css("font-weight", "bold");
		}
		
		const scale = (ConfigManager.api_gameScale || 100) / 100;
		switch (ConfigManager.subtitle_display) {
			case "bottom":
				$(".overlay_subtitles span").css("pointer-events", "none");
				break;
			case "below":
				$(".overlay_subtitles").prependTo(".out-of-box");
				$(".overlay_subtitles").css({
					position: "relative",
					margin: "5px auto 0px",
					left: "auto",
					top: "auto",
					bottom: "auto",
					right: "auto",
					width: $(".box-game").width(),
					zoom: scale
				});
				break;
			case "stick":
				$(".overlay_subtitles").prependTo(".out-of-box");
				$(".overlay_subtitles").css({
					position: "fixed",
					left: "50%",
					top: "auto",
					bottom: ConfigManager.alert_idle_counter > 1 ? "40px" : "3px",
					right: "auto",
					margin: "0px 0px 0px "+(-($(".box-game").width()/2))+"px",
					width: $(".box-game").width(),
					zoom: scale
				});
				break;
			default: break;
		}
	}
	
	$(".box-wait").show();
	
	
	// Quick Play
	$(".play_btn").on('click', function(){
		ActivateGame();
	});
	
	// Disable Quick Play (must panel)
	if(ConfigManager.api_mustPanel) {
		$(".play_btn")
			.off('click')
			.attr("disabled", "disabled")
			.text(KC3Meta.term("APIWaitToggle"))
			.css("color", "#777")
			.css('width', "40%");
	}
	
	// Configure Refresh Toggle (using $(".game-refresh").trigger("click") is possible)
	$(".game-refresh").on("click",function(){
		switch($(this).text()) {
			case("01"):
				$(".game-swf").attr("src","about:blank").attr("src",localStorage.absoluteswf);
				$(this).text("05");
				break;
			default:
				$(this).text(($(this).text()-1).toDigits(2));
				break;
		}
	});
	
	// Listen ConfigManager changed
	window.addEventListener("storage", function({key, timeStamp, url}){
		if(key === ConfigManager.keyName()) {
			ConfigManager.load();
			if($("#dmm_custom_css").html() !== ConfigManager.dmm_custom_css){
				$("#dmm_custom_css").html(ConfigManager.dmm_custom_css);
			}
		}
	});
	
	// Untranslated quest copy-able text form
	$(".overlay_quests").on("click", ".no_tl", function(){
		chrome.tabs.create({
			url: "https://translate.google.com/#ja/"+ConfigManager.language+"/"
				+encodeURIComponent($(this).data("qtitle"))
				+"%0A%0A"
				+encodeURIComponent($(this).data("qdesc"))
		});
	});
	
	// Overlay avoids cursor
	$(".overlay_subtitles span").on("mouseover", function(){
		switch (ConfigManager.subtitle_display) {
			case "evade":
				if (subtitlePosition == "bottom") {
					$(".overlay_subtitles").css("bottom", "");
					$(".overlay_subtitles").css("top", "5px");
					subtitlePosition = "top";
				} else {
					$(".overlay_subtitles").css("top", "");
					$(".overlay_subtitles").css("bottom", "5px");
					subtitlePosition = "bottom";
				}
				break;
			case "ghost":
				$(".overlay_subtitles").addClass("ghost");
				break;
			default: break;
		}
	});
	
	// Configure Idle Timer
	/*
	  unsafe-tick  : remove the safe marker of API idle time
	  refresh-tick : reset the timer and set the idle time as safe zone
	*/
	$(".game-idle-timer").on("unsafe-tick",function(){
		$(".game-idle-timer").removeClass("safe-timer");
	}).on("refresh-tick",function(){
		clearTimeout(idleTimeout);
		$(".game-idle-timer").addClass("safe-timer");
		idleTimeout = setTimeout(function(){
			$(".game-idle-timer").trigger("unsafe-tick");
		},localStorage.longestIdleTime);
	});
	idleFunction = function(){
		if(ConfigManager.alert_idle_counter) {
			$(".game-idle-timer").text(String(Math.floor((Date.now() - lastRequestMark) / 1000)).toHHMMSS());
			// Show Idle Counter
			if(ConfigManager.alert_idle_counter > 1) {
				$(".game-idle-timer").show();
			} else {
				$(".game-idle-timer").hide();
			}
		} else {
			$(".game-idle-timer").text(String(NaN).toHHMMSS());
			$(".game-idle-timer").hide();
			clearInterval(idleTimer);
		}
	};
	
	// Enable Refresh Toggle
	if(ConfigManager.api_directRefresh) {
		$(".game-refresh").css("display","flex");
	}
	
	// Exit confirmation
	window.onbeforeunload = function(){
		// added waiting condition should be ignored
		if(ConfigManager.api_askExit==1 && !trustedExit && !waiting){
			trustedExit = true;
			setTimeout(function(){ trustedExit = false; }, 100);
			// Not support custom message any more, see:
			// https://bugs.chromium.org/p/chromium/issues/detail?id=587940
			return KC3Meta.term("UnwantedExitDMM");
		}
	};
	
	setInterval(function(){
		if(autoFocus===0){
			window.focus();
			$(".focus_regain").hide();
		}else{
			$(".focus_regain").show();
			$(".focus_val").css("width", (800*(autoFocus/20))+"px");
			autoFocus--;
		}
	}, 1000);
	
});

$(document).on("keydown", function(event){
	switch(event.keyCode) {
		// F7: Toggle keyboard focus
		case(118):
			autoFocus = 20;
			return false;
			
		// F9: Screenshot
		case(120):
			interactions.screenshot({playerName: "Auto"}, {}, function(){});
			return false;
		
		// F10: Clear overlays
		case(121):
			interactions.clearOverlays({}, {}, function(){});
			return false;
		
		// Other else
		default:
		break;
	}
});

/* Invoke-able actions
-----------------------------------*/
var interactions = {
	
	// Panel is opened, activate the game
	activateGame :function(request, sender, response){
		if(waiting){
			ActivateGame();
			response({success:true});
		}else{
			response({success:false});
		}
	},
	
	// Cat Bomb Detection -> Enforced
	catBomb :function(request, sender, response){
		try{
			switch(ConfigManager.api_directRefresh) {
				case 0:
					throw new Error("");
				case 1:
					$(".game-refresh").text((0).toDigits(2)).css('right','0px');
					break;
				default:
					// TODO : Forced API Link Refresh
					$(".game-refresh").text((0).toDigits(2)).trigger('bomb-exploded');
					break;
			}
			response({success:true});
		}catch(e){
			console.error("CatBomb exception", e);
		}finally{
			response({success:false});
		}
	},
	
	// Request OK Marker
	goodResponses :function(request, sender, response){
		if(request.tcp_status === 200 && request.api_status === 1) {
			localStorage.longestIdleTime = Math.max(localStorage.longestIdleTime,Date.now() - lastRequestMark);
			lastRequestMark = Date.now();
			$(".game-idle-timer").trigger("refresh-tick");
			clearInterval(idleTimer);
			idleTimer = setInterval(idleFunction,1000);
			idleFunction();
		} else {
			clearInterval(idleTimer);
			clearTimeout(idleTimeout);
			$(".game-idle-timer").trigger("unsafe-tick");
			console.error("API Link cease to functioning anymore after",String(Math.floor((Date.now() - lastRequestMark)/1000)).toHHMMSS(),"idle time");
		}
	},
	
	// Quest page is opened, show overlays
	questOverlay :function(request, sender, response){
		//Only skip overlay generation if neither of the overlay features is enabled.
		if(!ConfigManager.api_translation && !ConfigManager.api_tracking){ response({success:false}); return true; }
		
		KC3QuestManager.load();
		$.each(request.questlist, function( index, QuestRaw ){
			// console.log("showing quest",QuestRaw);
			if( QuestRaw !=- 1 && index < 5 ){
				var QuestBox = $("#factory .ol_quest_exist").clone().appendTo(".overlay_quests");
				
				// Get quest data
				var QuestData = KC3QuestManager.get( QuestRaw.api_no );
				
				// Show meta, title and description
				if( typeof QuestData.meta().available != "undefined" ){
					
					if (ConfigManager.api_translation){
						$(".name", QuestBox).text( QuestData.meta().name );
						$(".desc", QuestBox).text( QuestData.meta().desc );
					}else{
						$(".content", QuestBox).css({opacity: 0});
					}
					
					if(ConfigManager.api_tracking){
						$(".tracking", QuestBox).html( QuestData.outputHtml() );
						if(QuestData.tracking && QuestData.tracking.length > 1){
							$(".tracking", QuestBox).addClass("small");
						}
					}else{
						$(".tracking", QuestBox).hide();
					}
				}else{
					if(ConfigManager.google_translate) {
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
	},
	
	// Quest Progress Notification
	questProgress :function(request, sender, response){
		
		response({success:true});
	},
	
	// In-game record screen translation
	recordOverlay :function(request, sender, response){
		// app.Dom.applyRecordOverlay(request.record);
		response({success:true});
	},
	
	// Show map markers for old worlds (node letters & icons)
	markersOverlay :function(request, sender, response){
		if(!ConfigManager.map_markers && !ConfigManager.map_letters){
			response({success:false}); return true;
		}
		var sortieStartDelayMillis = 2800;
		var markersShowMillis = 5000;
		var compassLeastShowMillis = 3500;
		if(markersOverlayTimer){
			// Keep showing if last ones not disappear yet
			clearTimeout(markersOverlayTimer);
			$(".overlay_markers").show();
		} else {
			var letters = KC3Meta.nodeLetters(request.worldId, request.mapId);
			var lettersFound = (!!letters && Object.keys(letters).length > 0);
			var icons = KC3Meta.nodeMarkers(request.worldId, request.mapId);
			var iconsFound = (!!icons.length && icons.length > 0);
			$(".overlay_markers").hide().empty();
			if(lettersFound && ConfigManager.map_letters){
				// Show node letters
				for(let l in letters){
					var letterDiv = $('<div class="letter"></div>').text(l)
						.css("left", letters[l][0] + "px")
						.css("top", letters[l][1] + "px");
					if(l.length > 1) letterDiv.css("font-size", 34 - 6 * l.length);
					$(".overlay_markers").append(letterDiv);
				}
			}
			if(iconsFound && ConfigManager.map_markers){
				// Show some icon style markers
				for(let i in icons){
					var obj = icons[i];
					var iconImg = $('<img />')
						.attr("src", chrome.runtime.getURL("assets/img/" + obj.img))
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
			markersOverlayTimer = true;
		}
		if(markersOverlayTimer){
			markersOverlayTimer = setTimeout(function(){
				$(".overlay_markers").fadeOut(2000);
				markersOverlayTimer = false;
			}, markersShowMillis
				+ (request.compassShow ? compassLeastShowMillis : 0)
				+ (request.needsDelay ? sortieStartDelayMillis : 0)
			);
		}
		response({success:true});
	},
	
	// Remove HTML overlays
	clearOverlays :function(request, sender, response){
		// console.log("clearing overlays");
		// app.Dom.clearOverlays();
		$(".overlay_quests").empty();
		$(".overlay_markers").empty();
		$(".overlay_record").hide();
		response({success:true});
	},
	
	// Screenshot triggered, capture the visible tab
	screenshot :function(request, sender, response){
		if (isTakingScreenshot) return;
		isTakingScreenshot = true;
		(new KCScreenshot())
			.setCallback(function(){
				response({success:true});
				isTakingScreenshot = false;
			})
			.start(request.playerName, $(".box-wrap"));
		return true;
	},
	
	// Fit screen
	fitScreen :function(request, sender, response){
		var gameScale = (ConfigManager.api_gameScale || 100) / 100;
		var topMargin = Math.ceil((ConfigManager.api_margin || 0) * gameScale);
		
		// Get browser zoon level for the page
		chrome.tabs.getZoom(null, function(zoomFactor){
			// Resize the window
			chrome.windows.getCurrent(function(wind){
				chrome.windows.update(wind.id, {
					width: Math.ceil(1200 * gameScale * zoomFactor) + (wind.width  - Math.ceil($(window).width()  * zoomFactor)),
					height: Math.ceil(720 * gameScale * zoomFactor) + (wind.height - Math.ceil($(window).height() * zoomFactor)) + topMargin
				});
			});
		});
	},
	
	// Taiha Alert Start
	taihaAlertStart :function(request, sender, response, callback){
		taihaStatus = true;
		
		if(ConfigManager.alert_taiha_blur) {
			$(".box-wrap").addClass("critical");
		}
		
		if(ConfigManager.alert_taiha_blood) {
			if(critAnim){ clearInterval(critAnim); }
			if(!ConfigManager.alert_taiha_noanim){
				critAnim = setInterval(function() {
					$(".taiha_red").toggleClass("anim2");
				}, 500);
			}
			$(".taiha_blood").show(0, function(){
				$(".taiha_red").show(0, function(){
					(callback || function(){})();
				});
			});
		}
	},
	
	// Taiha Alert Stop
	taihaAlertStop :function(request, sender, response, callback){
		taihaStatus = false;
		$(".box-wrap").removeClass("critical");
		if(critAnim){ clearInterval(critAnim); }
		$(".taiha_blood").hide(0, function(){
			$(".taiha_red").hide(0, function(){
				(callback || function(){})();
			});
		});
	},
	
	// Suspend Taiha Alert for taking screenshot
	suspendTaiha :function(callback){
		var self = this;
		
		if (!taihaStatus && !suspendedTaiha) {
			(callback || function(){})();
			return false;
		}
		
		if (suspendedTaiha) {
			clearTimeout(suspendedTaiha);
			(callback || function(){})();
		} else {
			this.taihaAlertStop({}, {}, {}, function(){
				setTimeout(function(){
					(callback || function(){})();
				}, 10);
			});
		}
		
		suspendedTaiha = setTimeout(function(){
			self.taihaAlertStart({}, {}, {});
			suspendedTaiha = false;
		}, 2000);
	},
	
	// Show subtitles
	subtitle :function(request, sender, response){
		if(!ConfigManager.api_subtitles) return true;
		
		//console.debug("subtitle", request);
		
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
				if(ConfigManager.subtitle_speaker){
					const abyssalId = KC3Meta.getAbyssalIdByFilename(quoteVoiceNum);
					quoteSpeaker = KC3Meta.abyssShipName(abyssalId);
				}
				break;
			default:
				quoteIdentifier = request.shipID;
				if(ConfigManager.subtitle_speaker){
					quoteSpeaker = KC3Meta.shipName(KC3Master.ship(quoteIdentifier).api_name);
				}
				break;
		}
		subtitleText = KC3Meta.quote( quoteIdentifier, quoteVoiceNum, quoteVoiceSize );
		
		// Lazy init timing parameters
		if(!subtitleVanishBaseMillis){
			subtitleVanishBaseMillis = Number(KC3Meta.quote("timing", "baseMillisVoiceLine")) || 2000;
		}
		if(!subtitleVanishExtraMillisPerChar){
			subtitleVanishExtraMillisPerChar = Number(KC3Meta.quote("timing", "extraMillisPerChar")) || 50;
		}
		
		const hideSubtitle = () => {
			// hide first to fading will stop
			$(".overlay_subtitles").stop(true, true);
			$(".overlay_subtitles").hide();
			// If subtitle removal timer is ongoing, reset
			if(subtitleTimer){
				if(Array.isArray(subtitleTimer))
					subtitleTimer.forEach(clearTimeout);
				else
					clearTimeout(subtitleTimer);
			}
		};
		
		// Display subtitle and set its removal timer
		const showSubtitle = (subtitleText, quoteIdentifier) => {
			if($.type(subtitleText) === "string") {
				showSubtitleLine(subtitleText, quoteIdentifier);
				const millis = quoteVoiceDuration || (subtitleVanishBaseMillis +
					subtitleVanishExtraMillisPerChar * $(".overlay_subtitles").text().length);
				subtitleTimer = setTimeout(fadeSubtitlesOut, millis);
				return;
			}
			subtitleTimer = [];
			let lastLineOutMillis = 0;
			$.each(subtitleText, (delay, text) => {
				const delays = String(delay).split(',');
				const millis = Number(delays[0]);
				lastLineOutMillis = delays.length > 1 ? Number(delays[1]) :
					(millis + subtitleVanishBaseMillis + subtitleVanishExtraMillisPerChar * text.length);
				subtitleTimer.push(setTimeout(() => {
					showSubtitleLine(text, quoteIdentifier);
				}, millis));
			});
			subtitleTimer.push(setTimeout(fadeSubtitlesOut, lastLineOutMillis));
		};
		
		const fadeSubtitlesOut = () => {
			subtitleTimer = false;
			$(".overlay_subtitles").fadeOut(1000, function(){
				switch (ConfigManager.subtitle_display) {
					case "evade":
						$(".overlay_subtitles").css("top", "");
						$(".overlay_subtitles").css("bottom", "5px");
						subtitlePosition = "bottom";
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
			if(subtitleHourlyTimer) clearTimeout(subtitleHourlyTimer);
			subtitleHourlyTimer = false;
			subtitleHourlyShip = 0;
		};
		
		const bookHourlyLine = (text, shipId) => {
			cancelHourlyLine();
			const nextHour = new Date().shiftHour(1).resetTime(["Minutes", "Seconds", "Milliseconds"]).getTime();
			const diffMillis = nextHour - Date.now();
			// Do not book on unexpected diff time: passed or > 59 minutes
			if(diffMillis <= 0 || diffMillis > 59 * 60000) {
				showSubtitle(text, shipId);
			} else {
				subtitleHourlyShip = shipId;
				subtitleHourlyTimer = setTimeout(function(){
					// Should cancel booked hourly line for some conditions
					if(subtitleHourlyShip == shipId
						// if Chrome delays timer execution > 3 seconds
						&& Math.abs(Date.now() - nextHour) < 3000
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
			hideSubtitle();
			// Book for a future display if it's a ship's hourly voice,
			// because game preload voice file in advance (about > 5 mins).
			if(!isNaN(Number(quoteIdentifier)) && KC3Meta.isHourlyVoiceNum(quoteVoiceNum)){
				if(ConfigManager.subtitle_hourly){
					bookHourlyLine(subtitleText, quoteIdentifier);
				}
			} else {
				showSubtitle(subtitleText, quoteIdentifier);
			}
		}
	},
	
	// Live reloading meta data
	reloadMeta :function(request, sender, response){
		if(request.metaType === "Quotes") {
			KC3Meta.loadQuotes();
		} else if(request.metaType === "Quests") {
			KC3Meta.reloadQuests();
		}
		console.info(request.metaType, "reloaded");
	},
	
	// Dummy action
	dummy :function(request, sender, response){
		
	}
};

/* Listen to messaging triggers
-----------------------------------*/
chrome.runtime.onMessage.addListener(function(request, sender, response){
	// If request is for this script
	if((request.identifier||"") == "kc3_gamescreen"){
		// If action requested is supported
		if(typeof interactions[request.action] !== "undefined"){
			// Execute the action
			interactions[request.action](request, sender, response);
			return true;
		}
	}
});