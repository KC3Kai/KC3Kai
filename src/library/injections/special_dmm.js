(function(){
	'use strict';
	var config = {};
	var master = {};
	var meta = {};
	var quests = {};
	
	var DMMCustomizations = {
		apply: function(response){
			console.log("DMMCustomizations", response);
			config = response.config;
			master = $.extend(true, KC3Master, response.master);
			meta = $.extend(true, KC3Meta, response.meta);
			quests = $.extend(true, KC3QuestManager, response.quests);
			
			this.windowFocus();
			this.attachHTML();
			this.backgrounds();
			this.subtitleSpace();
			
			chrome.runtime.onMessage.addListener(this.subtitlesOverlay());
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
				if (event.keyCode == 118) {
					self.nonFocusSeconds = 20;
				}
			});
		},
		
		/* CUSTOM HTML TAGS
		For tags not in DMM but needed by our UI
		Looking at ReactJS for KC3KaiNi
		--------------------------------------*/
		attachHTML: function(){
			var overlays = $("<div>").addClass("overlays").appendTo("#area-game");
			
			var overlay_quests = $("<div>").addClass("overlay_box overlay_quests");
			overlays.append(overlay_quests);
			
			var overlay_markers = $("<div>").addClass("overlay_box overlay_markers");
			overlays.append(overlay_markers);
			
			var overlay_subtitles = $("<div>").addClass("overlay_box overlay_subtitles")
				.append($("<span>"));
			overlays.append(overlay_subtitles);
		},
		
		/* BACKGROUND CUSTOMIZATIONS
		Let users customize background via settings
		--------------------------------------*/
		backgrounds: function(){
			// Top Margin from game frame to window
			$("#area-game").css("margin-top", config.api_margin+"px");
			
			// Background
			if(config.api_bg_image === ""){
				// Solid color
				$("body").css("background", config.api_bg_color);
			}else{
				// Image URL
				$("body").css("background-image", "url("+config.api_bg_image+")");
				$("body").css("background-color", config.api_bg_color);
				$("body").css("background-size", config.api_bg_size);
				$("body").css("background-position", config.api_bg_position);
				$("body").css("background-repeat", "no-repeat");
			}
		},
		
		/* SUBTITLE BOX
		Only prepares the container box for subtitles
		--------------------------------------*/
		subtitleSpace: function(){
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
						$(".overlay_subtitles").appendTo("body");
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
			}
		},
		
		/* SUBTITLES OVERLAY
		Only prepares the container box for subtitles
		--------------------------------------*/
		subtitleVanishTimer: null,
		subtitleVanishBaseMillis: null,
		subtitleVanishExtraMillisPerChar: null,
		subtitlesOverlay: function(){
			var self = this;
			return function(request, sender, response){
				console.log("RUNTIME MESSAGE", request);
				if(request.action == "subtitle"){
					if(!config.api_subtitles) return true;
					
					// Get subtitle text
					var subtitleText = false;
					var quoteIdentifier = "";
					var quoteVoiceNum = request.voiceNum;
					var quoteSpeaker = "";
					console.log("voicetype", request.voicetype);
					switch(request.voicetype){
						case "titlecall":
							quoteIdentifier = "titlecall_"+request.filename;
							break;
						case "npc":
							quoteIdentifier = "npc";
							break;
						default:
							quoteIdentifier = request.shipID;
							console.log('quoteIdentifier', quoteIdentifier);
							if(config.subtitle_speaker){
								quoteSpeaker = meta.shipName(master.ship(quoteIdentifier).api_name);
							}
							console.log('quoteSpeaker', quoteSpeaker);
							break;
					}
					console.log('quoteVoiceNum', quoteVoiceNum);
					subtitleText = meta.quote( quoteIdentifier, quoteVoiceNum );
					console.log("subtitleText", subtitleText);
					// hide first to fading will stop
					$(".overlay_subtitles").stop(true, true);
					$(".overlay_subtitles").hide();
					
					// If subtitle removal timer is ongoing, reset
					if(self.subtitleVanishTimer){
						clearTimeout(self.subtitleVanishTimer);
					}
					// Lazy init timing parameters
					if(!self.subtitleVanishBaseMillis){
						self.subtitleVanishBaseMillis = Number(meta.quote("timing", "baseMillisVoiceLine")) || 2000;
					}
					if(!self.subtitleVanishExtraMillisPerChar){
						self.subtitleVanishExtraMillisPerChar = Number(meta.quote("timing", "extraMillisPerChar")) || 50;
					}
					
					// If subtitles available for the voice
					if(subtitleText){
						$(".overlay_subtitles span").html(subtitleText);
						$(".overlay_subtitles").show();
						var millis = self.subtitleVanishBaseMillis +
							(self.subtitleVanishExtraMillisPerChar * $(".overlay_subtitles").text().length);
						self.subtitleVanishTimer = setTimeout(function(){
							self.subtitleVanishTimer = false;
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
		},
		
		/* SUBTITLE BOX
		Only prepares the container box for subtitles
		--------------------------------------*/
		questOverlay: function(){
			
			
		},
		
	};
	
	window.specialDMMMode = function (){
		(new RMsg("service", "dmmGetCustomizations", {}, function(response){
			DMMCustomizations.apply(response);
		})).execute();
	};
	
})();