_gaq.push(['_trackPageview']);

// If awaiting activation
var waiting = false;

// If trusted exit, for exit confirmation
var trustedExit = false;

// If user is holding down tab key
var tabHeld = false;

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
}

$(document).on("ready", function(){
	// Initialize data managers
	ConfigManager.load();
	KC3Meta.init("../../../../data/");
	KC3QuestManager.load();
	KC3Database.init();
	
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
			case("01"):
				$(".game-swf").attr("src","about:blank").attr("src",localStorage.absoluteswf);
				$(this).text("05");
				break;
			default:
				$(this).text("0" + ($(this).text()-1));
				break;
		}
	});
	// Enable Refresh Toggle
	if(ConfigManager.api_directRefresh) {
		$(".game-refresh").css("display","flex");
	}
	
	// Exit confirmation
	window.onbeforeunload = function(){
		ConfigManager.load();
		// added waiting condition should be ignored
		if(ConfigManager.api_askExit==1 && !trustedExit && !waiting){
			trustedExit = true;
			setTimeout(function(){ trustedExit = false; }, 100);
			return KC3Meta.term("UnwantedExit");
		}
	};
	
	setInterval(function(){
		window.focus();
	}, 100);
	trustedExit = true;
	ActivateGame();
});

$(document).on("keydown", function(event){
	// Cancel other keypress actions if tab is being held
	if(tabHeld){
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	
	// F9: Screenshot
    if(event.keyCode == 120){
		(new KCScreenshot()).start("Auto", $(".box-wrap"));
		event.preventDefault();
		event.stopPropagation();
		return false;
    }
	
	// F10: Clear overlays
	if(event.keyCode == 121){
		interactions.clearOverlays({}, {}, function(){});
		event.preventDefault();
		event.stopPropagation();
		return false;
    }
	
	// Home Key: Social Features
	if(event.keyCode == 36){
		if($(".overlay_social").is(":visible")){
			$(".overlay_social").hide();
		}else{
			$(".overlay_social").show();
		}
		event.preventDefault();
		event.stopPropagation();
		return false;
    }
	
	// Tab Key: Social Features
	if(event.keyCode == 9){
		$(".overlay_social").show();
		tabHeld = true;
		event.preventDefault();
		event.stopPropagation();
		return false;
    }
});

$(document).on("keyup", function(event){
	// Home Key: Social Features
	if(event.keyCode == 9){
		$(".overlay_social").hide();
		tabHeld = false;
		event.preventDefault();
		event.stopPropagation();
		return false;
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
