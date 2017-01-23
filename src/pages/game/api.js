_gaq.push(['_trackPageview']);

// If awaiting activation
var waiting = true;

// If trusted exit, for exit confirmation
var trustedExit = false;

// Used to fade out subtitles after calculated duration
var subtitleVanishTimer = false;
var subtitleVanishBaseMillis;
var subtitleVanishExtraMillisPerChar;

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

// Show game screens
function ActivateGame(){
	waiting = false;
	$(".box-wrap").css("background", "#fff");
	$(".box-wait").hide();
	$(".game-swf").remove();
	$(".box-game")
		.prepend("<iframe class=game-swf frameborder=0></iframe>")
		.find(".game-swf")
		.attr("src", localStorage.absoluteswf)
		.end()
		.show();
	$(".box-wrap").css("zoom", ((ConfigManager.api_gameScale || 100) / 100));
	return true;
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
	
	// Apply interface configs
	$(".box-wrap").css("margin-top", ConfigManager.api_margin+"px");
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
		
		switch (ConfigManager.subtitle_display) {
			case "bottom":
				$(".overlay_subtitles span").css("pointer-events", "none");
				break;
			case "below":
				$(".overlay_subtitles").appendTo("body");
				$(".overlay_subtitles").css({
					position: "relative",
					margin: "5px auto 0px",
					left: "auto",
					top: "auto",
					bottom: "auto",
					right: "auto",
					width: $(".box-game").width(),
					zoom: ((ConfigManager.api_gameScale || 100) / 100)
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
					margin: "0px 0px 0px "+(-($(".box-game").width()/2))+"px",
					width: $(".box-game").width()
				});
				break;
			default: break;
		}
	}
	
	if(!(localStorage.absoluteswf || false)) {
		$(".box-nolink").show();
	}else{
		$(".box-wait .api_txt textarea").val(localStorage.absoluteswf);
		$(".box-wait").show();
	}
	
	$(".box-wait .api_txt").attr("title",KC3Meta.term("APIConcealExpl"));
	
	$(".box-wait .api_txt").on('change', 'textarea', function(){
		if(($(this).val().length > 0) || confirm("APIDataManualClear")) {
			localStorage.absoluteswf = $(this).val();
		} else {
			$(this).val(localStorage.absoluteswf);
		}
	});
	
	// Update API Link
	$(".api_submit").on('click', function(){
		if($(".api_text").val().indexOf("mainD2.swf") > -1){
			localStorage.absoluteswf = $(".api_text").val();
			window.location.reload();
		}
	});
	
	// Forget API Link
	$(".forget_btn").on('click', function(){
		localStorage.absoluteswf = "";
		window.location.reload();
	});
	
	// Quick Play
	$(".play_btn").on('click', function(){
		ActivateGame();
	});
	
	// Disable Quick Play (must panel)
	if(ConfigManager.api_mustPanel) {
		$(".play_btn")
			.off("click")
			.attr("disabled", "disabled")
			.text(KC3Meta.term("APIWaitToggle"))
			.css("color", "#777")
			.css('width', "40%");
	}
	
	// I've read the Chrome 54 API Link notice
	$("#chrome54flash .api_notice_close").on('click', function(){
		localStorage.read_api_notice = 1;
		$("#chrome54flash").hide();
	});
	
	// I've read the Chrome 55 API Link notice
	$("#chrome55network .api_notice_close").on('click', function(){
		localStorage.read_api_notice_55 = 1;
		$("#chrome55network").hide();
	});
	
	// untranslated quest copiable text form
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
	
	// Exit confirmation
	window.onbeforeunload = function(){
		ConfigManager.loadIfNecessary();
		// added waiting condition should be ignored
		if(
			ConfigManager.api_askExit==1 &&
			!trustedExit &&
			!waiting
		){
			trustedExit = true;
			setTimeout(function(){ trustedExit = false; }, 100);
			return KC3Meta.term("UnwantedExit");
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
			if (isTakingScreenshot) return;
			isTakingScreenshot = true;
			
			(new KCScreenshot())
				.setCallback(function(){
					isTakingScreenshot = false;
				})
				.start("Auto", $(".box-wrap"));
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


/* Invokable actions
-----------------------------------*/
var interactions = {
	
	// Panel is opened, activate the game
	activateGame :function(request, sender, response){
		if(waiting){
			response({success:ActivateGame()});
		}else{
			response({success:false});
		}
	},
	
	// Cat Bomb Detection -> Enforced
	catBomb :function(request, sender, response){
		try{
			switch(Number(ConfigManager.api_directRefresh)) {
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
			return true;
		}catch(e){
			console.error(e);
		}finally{
			return false;
		}
	},
	
	// Quest page is opened, show overlays
	questOverlay :function(request, sender, response){
		// Only skip overlay generation if neither of the overlay features is enabled.
		if(!ConfigManager.api_translation && !ConfigManager.api_tracking){ response({success:false}); return true; }
		
		KC3QuestManager.load();
		$.each(request.questlist, function( index, QuestRaw ){
			// console.log("showing quest",QuestRaw);
			if( QuestRaw !=- 1 ){
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
					}else{
						$(".tracking", QuestBox).hide();
					}
					
					// Special Bw1 case multiple requirements
					if( QuestRaw.api_no == 214 ){
						$(".tracking", QuestBox).addClass("small");
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
		if(!ConfigManager.map_markers) { response({success:false}); return true; }
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
						.attr("src", "../../assets/img/" + obj.img)
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
		
		// ~Please rewrite the screenshot script
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
		var GameScale = ((ConfigManager.api_gameScale || 100) / 100);
		
		// Get browser zoon level for the page
		chrome.tabs.getZoom(null, function(ZoomFactor){
			// Resize the window
			chrome.windows.getCurrent(function(wind){
				chrome.windows.update(wind.id, {
					width: Math.ceil(800*GameScale*ZoomFactor) + (wind.width- Math.ceil($(window).width()*ZoomFactor) ),
					height: Math.ceil(480*GameScale*ZoomFactor) + (wind.height- Math.ceil($(window).height()*ZoomFactor) )
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
			critAnim = setInterval(function() {
				$(".taiha_red").toggleClass("anim2");
			}, 500);
			
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
		
		// Get subtitle text
		var subtitleText = false;
		var quoteIdentifier = "";
		var quoteVoiceNum = request.voiceNum;
		var quoteSpeaker = "";
		switch(request.voicetype){
			case "titlecall":
				quoteIdentifier = "titlecall_"+request.filename;
				break;
			case "npc":
				quoteIdentifier = "npc";
				break;
			default:
				quoteIdentifier = request.shipID;
				if(ConfigManager.subtitle_speaker){
					quoteSpeaker = KC3Meta.shipName(KC3Master.ship(quoteIdentifier).api_name);
				}
				break;
		}
		//console.debug("looking up quote:", quoteIdentifier, quoteVoiceNum);
		subtitleText = KC3Meta.quote( quoteIdentifier, quoteVoiceNum );
		
		// hide first to fading will stop
		$(".overlay_subtitles").stop(true, true);
		$(".overlay_subtitles").hide();
		
		// If subtitle removal timer is ongoing, reset
		if(subtitleVanishTimer){
			clearTimeout(subtitleVanishTimer);
		}
		// Lazy init timing parameters
		if(!subtitleVanishBaseMillis){
			subtitleVanishBaseMillis = Number(KC3Meta.quote("timing", "baseMillisVoiceLine")) || 2000;
		}
		if(!subtitleVanishExtraMillisPerChar){
			subtitleVanishExtraMillisPerChar = Number(KC3Meta.quote("timing", "extraMillisPerChar")) || 50;
		}
		
		// If subtitles available for the voice
		if(subtitleText){
			$(".overlay_subtitles span").html(subtitleText);
			$(".overlay_subtitles").show();
			var millis = subtitleVanishBaseMillis +
				(subtitleVanishExtraMillisPerChar * $(".overlay_subtitles").text().length);
			//console.debug("vanish after", millis, "ms");
			subtitleVanishTimer = setTimeout(function(){
				subtitleVanishTimer = false;
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
			}, millis);
			if(!!quoteSpeaker){
				$(".overlay_subtitles span").html("{0}: {1}".format(quoteSpeaker, subtitleText));
			}
		}
	}
	
};

/* Listen to messaging triggers
-----------------------------------*/
chrome.runtime.onMessage.addListener(function(request, sender, response){
	// If request is for this script
	if((request.identifier||"") == "kc3_gamescreen"){
		// If action requested is supported
		if(typeof interactions[request.action] !== "undefined"){
			ConfigManager.loadIfNecessary();
			// Execute the action
			interactions[request.action](request, sender, response);
			return true;
		}
	}
});