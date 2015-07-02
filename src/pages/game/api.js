// If awaiting activation
var waiting = false;

// If trusted exit, for exit confirmation
var trustedExit = false;

// Show game screens
function ActivateGame(){
	waiting = false;
	$(".box-wrap").css("background", "#fff");
	$(".box-wait").hide();
	$(".box-game .game-swf").attr("src", localStorage.absoluteswf);
	$(".box-game").show();
}

$(document).on("ready", function(){

	// Initialize data managers
	ConfigManager.load();
	KC3Meta.init("../../../../data/");
	KC3QuestManager.load();
	
	// Apply interface configs
	$(".box-wrap").css("margin-top", ConfigManager.api_margin+"px");
	if(ConfigManager.api_bg_image == ""){
		$("body").css("background", ConfigManager.api_bg_color);
	}else{
		$("body").css("background-image", "url("+ConfigManager.api_bg_image+")");
		$("body").css("background-color", ConfigManager.api_bg_color);
		$("body").css("background-size", ConfigManager.api_bg_size);
		$("body").css("background-position", ConfigManager.api_bg_position);
		$("body").css("background-repeat", "no-repeat");
	}
	
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
	
	// Exit confirmation
	window.onbeforeunload = function(){
		ConfigManager.load();
		if(ConfigManager.api_askExit==1 && !trustedExit){
			trustedExit = true;
			setTimeout(function(){ trustedExit = false; }, 100);
			return "Ahh! you are closing the game!";
		}
	};
	
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
		KC3QuestManager.load();
		// console.log(KC3QuestManager.list);
		$.each(request.questlist, function( index, QuestRaw ){
			// console.log("showing quest",QuestRaw);
			if( QuestRaw !=- 1 ){
				var QuestBox = $("#factory .ol_quest_exist").clone().appendTo(".overlay_quests");
				
				// Get quest data
				var QuestData = KC3QuestManager.get( QuestRaw.api_no );
				// console.log("QuestData", QuestData);
				
				// Show meta, title and description
				if( QuestData.meta ){
					$(".name", QuestBox).text( QuestData.meta().name );
					$(".desc", QuestBox).text( QuestData.meta().desc );
					
					$(".tracking", QuestBox).html( QuestData.outputHtml() );
					
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
		if(typeof interactions[request.action] != "undefined"){
			// Execute the action
			interactions[request.action](request, sender, response);
			return true;
		}
	}
});