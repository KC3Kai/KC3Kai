var app = new KC3();

// If awaiting activation
var waiting = true;

// Show game screens
function ActivateGame(){
	waiting = false;
	$(".box-wrap").css("background", "#fff");
	$(".box-wait").hide();
	$(".box-game .game-swf").attr("src", "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/");
	$(".box-game").show();
}

$(document).on("ready", function(){
	
	// Apply initial configuration
	app.Config.init();
	$(".box-wrap").css("margin-top", app.Config.gambox_margin);
	if(app.Config.background.substring(0,1) == "#"){
		$("body").css("background", app.Config.background);
	}else{
		$("body").css("background-size", "cover");
		$("body").css("background-repeat", "no-repeat");
		$("body").css("background-image", "url("+app.Config.background+")");
	}
	
	// Quick Play
	$(".play_btn").on('click', function(){
		ActivateGame();
	});
	
});

// Extension Interaction
chrome.runtime.onMessage.addListener(function(request, sender, response) {
	if(request.game==="kancolle" && request.type==="game"){
		switch(request.action){
		
			// Admiral Dashboard opened, activate game
			case "activate":
				if(waiting){
					ActivateGame();
					response({success:true});
				}else{
					response({success:false});
				}
				break;
			
			
			default: response({success:false, message:"Unknown action"}); break;
		}
	}
});