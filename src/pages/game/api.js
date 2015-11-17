_gaq.push(['_trackPageview']);

// If awaiting activation
var waiting = false;

// If trusted exit, for exit confirmation
var trustedExit = false;

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
localStorage.longestIdleTime = Math.max(localStorage.longestIdleTime || 0,1800000);
var
	lastRequestMark,
	idleTimer,
	idleTimeout,
	idleFunction;

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
		.trigger('initialize-idle')
		.show();
	$(".box-wrap").css("zoom", ((ConfigManager.api_gameScale || 100) / 100));
}

$(document).on("ready", function(){
	// Initialize data managers
	ConfigManager.load();
	KC3Meta.init("../../../../data/");
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
			location.reload();
	});
	
	$(".box-game").on('initialize-idle',function(){
		lastRequestMark = Date.now();
		idleTimer = setInterval(idleFunction,1000);
		if(ConfigManager.alert_idle_counter) {
			$(".game-idle-timer").trigger("refresh-tick");
		}
	});
	
	// API link determines which screen to show
	if(localStorage.absoluteswf){
		$(".api_txt textarea").text(localStorage.absoluteswf);
		$(".box-wait").show();
		waiting = true;
	}else{
		$(".box-nolink").show();
	}
	
	// Update API Link
	$(".api_submit").on('click', function(){
		if($(".api_text").val().indexOf("mainD2.swf") > -1){
			localStorage.absoluteswf = $(".api_text").val();
			trustedExit = true;
			window.location.reload();
		}
	});
	
	// Forget API Link
	$(".forget_btn").on('click', function(){
		localStorage.absoluteswf = "";
		trustedExit = true;
		window.location.reload();
	});
	
	// Quick Play
	$(".play_btn").on('click', function(){
		ActivateGame();
		// ResetIdleStat();
	});
	
	// Disable Quick Play (must panel)
	if(ConfigManager.api_mustPanel) {
		$(".play_btn")
			.off('click')
			.text(KC3Meta.term("APIWaitToggle"))
			.css('color','#f00')
			.css('width','40%');
	}
	
	// Configure Refresh Toggle (using $(".game-refresh").trigger("click") is possible)
	$(".game-refresh").on("click",function(){
		switch($(this).text()) {
			case("00"):
			case("01"):
				// TODO: BOMB EXPLODED
				// $(".game-swf").attr("src","about:blank").attr("src",localStorage.absoluteswf);
				$(".box-game").trigger('initialize-idle');
				$(this).trigger('bomb-exploded');
				$(this).text("05");
				break;
			default:
				$(this).text(Math.max(0,$(this).text()-1).toDigits(2));
				break;
		}
	}).on("bomb-exploded",function(){
		console.error("TODO: dragonjet help me >_<)/");
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
		} else {
			$(".game-idle-timer").text(String(NaN).toHHMMSS());
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
		if(ConfigManager.api_askExit==1 && !trustedExit && !waiting && !localStorage.getObject("extract_api")){
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

/* Invokable actions
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
			return true;
		}catch(e){
			console.error(e);
		}finally{
			return false;
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
			$(".game-idle-timer").trigger("unsafe-tick").html([
				String(Math.floor((Date.now() - lastRequestMark)/1000)).toHHMMSS(),
				[request.tcp_status,request.api_status,request.api_result].filter(function(x){return !!x;}).join('/')
			].join('<br>')).css("height","40px").css("width","480px");
			interactions.catBomb(request,sender,response);
			interactions.goodResponses = function(){};
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
		console.log("clearing overlays");
		// app.Dom.clearOverlays();
		$(".overlay_quests").html("");
		$(".overlay_record").hide();
		response({success:true});
	},
	
	// Screenshot triggered, capture the visible tab
	screenshot :function(request, sender, response){
		// ~Please rewrite the screenshot script
		(new KCScreenshot()).start(request.playerName, $(".box-wrap"), request.ssdata);
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
