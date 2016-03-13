_gaq.push(['_trackPageview']);

// If awaiting activation
var waiting = false;

// If trusted exit, for exit confirmation
var trustedExit = false;

// Used to fade out subtitles after calculated duration
var subtitleVanishTimer = false;

// Holder object for audio files to test mp3 duration
var subtitleMp3;

// If auto-focus on window to capture key events or not
var autoFocus = 0;

// Critical Animation
var critAnim = false;

// Idle time check
/*
  variables explanation:
  longestIdleTime - high score of idle time
  idleTimer       - timer ID for interval function of idleFunction
  idleTimeout     - timer ID for unsafe idle time marker
  idleFunction    - function that indicates the way of the idle counter
*/
localStorage.longestIdleTime = Math.max(parseInt(localStorage.longestIdleTime) || 0,1800000);
var
	lastRequestMark,
	refreshTimeout,  // refresh cancellation time
	idleTimer,
	idleTimeout,
	idleFunction,
	expiryFunction,
	refreshFunction;
// Show game screens
function ActivateGame(){
	if(!localStorage.getObject('apiUsage')) {
		alert("APIExpiredAlert");
		return false;
	}
	waiting = false;
	$(".box-wrap").css("background", "#fff");
	$(".box-wait").hide();
	$(".game-swf").remove();
	$(".box-game")
		.prepend("<iframe class=game-swf frameborder=0></iframe>")
		.find(".game-swf")
		.attr("src", localStorage.absoluteswf)
		.end()
		.trigger('initialize-idle')
		.show();
	$(".box-wrap").css("zoom", (ConfigManager.api_gameScale || 100) + "%");
	return true;
}

$(document).on("ready", function(){
	// Initialize data managers
	ConfigManager.load();
	KC3Master.init();
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
	
	$(".box-wait .api_txt").attr("title",KC3Meta.term("APIConcealExpl")).on('change','textarea',function(){
		if(($(this).val().length > 0) || confirm("APIDataManualClear")) {
			localStorage.absoluteswf = $(this).val();
		} else {
			$(this).val(localStorage.absoluteswf);
		}
		if(localStorage.absoluteswf.length <= 0)
			$(document).trigger('state-check');
	});
	
	$(".box-game").on('initialize-idle',function(){
		lastRequestMark = Date.now();
		clearInterval(idleTimer);
		idleTimer = setInterval(idleFunction,1000);
		if(ConfigManager.alert_idle_counter) {
			$(".game-idle-timer").trigger("refresh-tick");
		}
	});
	
	// Update API Link
	$(".api_submit").on('click', function(){
		if($(".api_text").val().indexOf("mainD2.swf") > -1){
			localStorage.absoluteswf = $(".api_text").val();
			$(document).trigger('state-check');
		}
	});
	
	// Forget API Link
	$(".forget_btn").on('click', function(){
		localStorage.absoluteswf = "";
		$(document).trigger('state-check');
	});
	
	// Quick Play
	$(".play_btn").on('click', function(){
		if($(this).data('play'))
			ActivateGame();
		// ResetIdleStat();
	});
	
	$(".play_btn").data('play',!ConfigManager.api_mustPanel);
	
	// Configure Refresh Toggle (using $(".game-refresh").trigger("click") is possible)
	$(".game-refresh").on("click",function(){
		switch(Math.sign($(this).text()-1)) {
			case(-1):
			case( 0):
				// TODO: BOMB EXPLODED
				// $(".game-swf").attr("src","about:blank").attr("src",localStorage.absoluteswf);
				$(this).trigger('bomb-exploded');
				$(this).text(99);
				break;
			default:
				$(this).text(Math.max(0,$(this).text()-1).toDigits(2));
				break;
		}
	}).on("bomb-exploded",function(){
		$(this).css('right','');
		localStorage.extract_api = true;
		$(document).trigger('state-check');
		console.warn("Refresh warning");
		localStorage.apiUsage = null;
	});
	
	$(".api_refresh").on('click',function(){
		$(".game-refresh").trigger('bomb-exploded');
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
		$(".game-idle-timer").css('bottom','');
		if(ConfigManager.alert_idle_counter) {
			$(".game-idle-timer").text(String(Math.floor((Date.now() - lastRequestMark) / 1000)).toHHMMSS());
		} else {
			$(".game-idle-timer").text(String(NaN).toHHMMSS());
			clearInterval(idleTimer);
		}
	};
	
	expiryFunction = function(){
		var timeLeft = Math.floor(((localStorage.getObject('apiUsage') || Date.now()) - Date.now()) / 1000);
		$(".game-idle-timer").css('bottom',0);
		if(timeLeft > 0) {
			$(".game-idle-timer").text(String(timeLeft).toHHMMSS());
		} else {
			localStorage.apiUsage = null;
			$(document).trigger('api-invalid');
			clearInterval(idleTimer);
		}
	};
	
	refreshFunction = function(){
		var timeLeft = Math.floor((refreshTimeout - Date.now()) / 1000);
		$(".game-idle-timer").css('bottom',0);
		if(timeLeft > 0) {
			$(".game-idle-timer").text(String(timeLeft).toHHMMSS());
		} else {
			$(document).trigger('api-invalid');
			clearInterval(idleTimer);
		}
	};
	
	// Enable Refresh Toggle
	if(ConfigManager.api_directRefresh) {
		$(".game-refresh").css("display","flex");
	}
	// Show Idle Counter
	if(ConfigManager.alert_idle_counter > 1) {
		$(".game-idle-timer").show();
	}
	
	// Exit confirmation
	window.onbeforeunload = function(){
		ConfigManager.load();
		// added waiting condition should be ignored
		if(
			ConfigManager.api_askExit==1 &&
			!trustedExit &&
			!waiting &&
			$(".box-game").is(":visible") &&
			$(".game-refresh").text() > 0
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
	
	// Automatically check current API state
	$(this).data('playCount',0);
	$(this).trigger('state-check');
});

$(document).on("keydown", function(event){
	switch(event.keyCode) {
		// F7: Toggle keyboard focus
		case(118):
			autoFocus = 20;
			return false;
			
		// F9: Screenshot
		case(120):
			(new KCScreenshot()).start("Auto", $(".box-wrap"));
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

$(document).on("api-refresh",function(){
	// Initialize Visiblity (Refresh API)
	$(".box-nolink").hide();
		$(".box-noapi").hide();
		$(".box-expired").hide();
	$(".box-wait").show();
		$(".box-refresh").show();
		$(".box-ready").hide();
	
	// Initialize State
	localStorage.extract_api = true;
	refreshTimeout = Date.now() + 60000;
	clearInterval(idleTimer);
	idleTimer = setInterval(refreshFunction,1000);
	
	$(".box-wrap").css("background", "");
	$(".game-swf").remove();
	$(".refresh-box").remove();
	$(".box-refresh")
		.prepend("<iframe class=refresh-box frameborder=0></iframe>")
		.find('.refresh-box')
		.on('error',function(e){
			$(document).trigger('api-invalid');
		})
		.attr('src','http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/');
});

$(document).on("api-valid",function(){
	// Initialize Visiblity (Valid API)
	$(".box-nolink").hide();
		$(".box-noapi").hide();
		$(".box-expired").hide();
	$(".box-wait").show();
		$(".box-refresh").hide();
		$(".box-ready").show();
	
	// Initialize State
	$(".api_txt textarea").text(localStorage.absoluteswf);
	waiting = true;
	
	// Reset Styles
	$(".game-idle-timer").css("height","").css("width","");
	$(".game-refresh").css('right','').text((5 + Math.ceil(Math.random() * ($(this).data('playCount') + 1))).toDigits(2));
	$(".play_btn").data('play',$(".play_btn").data('play') || $(this).data('playCount'));
	
	
	// Set expiry API time
	if(localStorage.getObject('apiUsage')) {
		var timeOut = localStorage.getObject('apiUsage') - Date.now();
		console.warn("Existing API will expire in",timeOut,'milliseconds');
		
		clearInterval(idleTimer);
		idleTimer = setInterval(expiryFunction,1000);
	}
	
	// Check panel requirement
	if($(".play_btn").data('play')) {
		$(".play_btn")
			.text(KC3Meta.term("GameStartNowBtn"))
			.css('color','')
			.css('width','');
	} else {
		// Disable Quick Play (must panel)
		$(".play_btn")
			.text(KC3Meta.term("APIWaitToggle"))
			.css('color','#f00')
			.css('width','40%');
	}
	
	$(this).data('playCount',$(this).data('playCount')+1);
});

$(document).on("api-invalid",function(){
	// Initialize Visiblity (Invalid API)
	$(".box-nolink").show();
		$(".box-noapi").hide();
		$(".box-expired").show();
	$(".box-wait").hide();
		$(".box-refresh").hide();
		$(".box-ready").hide();
	
});

$(document).on("api-inexists",function(){
	// Initialize Visiblity (No API)
	$(".box-nolink").show();
		$(".box-noapi").show();
		$(".box-expired").hide();
	$(".box-wait").hide();
		$(".box-refresh").hide();
		$(".box-ready").hide();
	
});

$(document).on("state-check",function(){
	var
		eventName = "",
		nowDate   = Date.now();
	if(JSON.parse(localStorage.extract_api))
		// Extract API Flag
		eventName = "api-refresh";
	else
		if(!localStorage.absoluteswf)
			// No API Detected
			eventName = "api-inexists";
		else if(nowDate < (localStorage.getObject('apiUsage') || nowDate))
			// Valid API
			eventName = "api-valid";
		else
			// Invalid API
			eventName = "api-invalid";
	
	$(".box-game").hide();
	
	if(eventName) {
		console.info("Call state",eventName);
		$(this).trigger(eventName);
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
	
	// Request OK Marker
	goodResponses :function(request, sender, response){
		if(request.tcp_status === 200 && request.api_status === 1 && Math.sign($('.game-refresh').text())>0) {
			localStorage.longestIdleTime = Math.max(Number(localStorage.longestIdleTime) || 0,Date.now() - lastRequestMark);
			lastRequestMark = Date.now();
			$(".game-idle-timer").trigger("refresh-tick");
			clearInterval(idleTimer);
			idleTimer = setInterval(idleFunction,1000);
			idleFunction();
		} else {
			clearInterval(idleTimer);
			clearTimeout(idleTimeout);
			
			$(".game-idle-timer").trigger("unsafe-tick").html([
				String(Math.floor((Date.now() - lastRequestMark)/1000)).toHHMMSS(),
				[request.tcp_status,request.api_status,request.api_result].filter(function(x){return !!x;}).join('/')
			].join('<br>')).css("height","40px").css("width","480px");
			interactions.catBomb(request,sender,response);
		}
	},
	
	// Quest page is opened, show overlays
	questOverlay :function(request, sender, response){
		//Only skip overlay generation if neither of the overlay features is enabled.
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
					QuestBox.css({ visibility: "hidden" });
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
	
	// Remove HTML overlays
	clearOverlays :function(request, sender, response){
		// console.log("clearing overlays");
		// app.Dom.clearOverlays();
		$(".overlay_quests").html("");
		$(".overlay_record").hide();
		response({success:true});
	},
	
	// Screenshot triggered, capture the visible tab
	screenshot :function(request, sender, response){
		// ~Please rewrite the screenshot script
		(new KCScreenshot()).start(request.playerName, $(".box-wrap"));
		response({success:true});
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
	taihaAlertStart :function(request, sender, response){
		$(".box-wrap").addClass("critical");
		
		if(critAnim){ clearInterval(critAnim); }
		critAnim = setInterval(function() {
			$(".taiha_red").toggleClass("anim2");
		}, 500);
		
		$(".taiha_blood").show();
		$(".taiha_red").show();
	},
	
	// Taiha Alert Stop
	taihaAlertStop :function(request, sender, response){
		$(".box-wrap").removeClass("critical");
		if(critAnim){ clearInterval(critAnim); }
		$(".taiha_blood").hide();
		$(".taiha_red").hide();
	},
	
	api_refresh :function(request, sender, response){
		console.log("Refresh Call");
		localStorage.extract_api = false;
		$('.refresh-box').remove();
		$(document).trigger('state-check');
	},
	
	// Show subtitles
	subtitle :function(request, sender, response){
		console.log("subtitle", request);
		
		// Get subtitle text
		var subtitleText = false;
		var quoteIdentifier = "";
		var quoteVoiceNum = request.voiceNum;
		switch(request.voicetype){
			case "titlecall":
				quoteIdentifier = "titlecall_"+request.filename;
				break;
			case "npc":
				quoteIdentifier = "npc";
				break;
			default:
				quoteIdentifier = KC3Master.graph( request.filename );
				break;
		}
		subtitleText = KC3Meta.quote( quoteIdentifier, quoteVoiceNum );

		// If subtitle removal timer is ongoing, reset
		if(subtitleVanishTimer && subtitleText){
			clearTimeout(subtitleVanishTimer);
		}
		
		// If subtitles available for the voice
		if(subtitleText){
			$(".overlay_subtitles").html(subtitleText);
			$(".overlay_subtitles").show();
			
			/*subtitleMp3 = new Audio();
			subtitleMp3.canplaythrough = function() { 
				console.log("DURATION: "+subtitleMp3.duration);
			};
			subtitleMp3.src = request.url;*/
			
			/*subtitleMp3 = document.createElement("audio");
			subtitleMp3.addEventListener('canplaythrough', function() { 
				console.log("DURATION: "+subtitleMp3.duration);
			}, false);
			subtitleMp3.src = request.url;*/
			
			subtitleVanishTimer = setTimeout(function(){
				subtitleVanishTimer = false;
				$(".overlay_subtitles").fadeOut(500);
			}, (2000+ ($(".overlay_subtitles").text().length*50)) );
		} else {
			$(".overlay_subtitles").html("Missing quote #" + quoteIdentifier + "-" + quoteVoiceNum);
			$(".overlay_subtitles").show();
			subtitleVanishTimer = setTimeout(function(){
				subtitleVanishTimer = false;
				$(".overlay_subtitles").fadeOut(500);
			}, (2000+ ($(".overlay_subtitles").text().length*50)) );
		}
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
