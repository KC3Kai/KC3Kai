
// Redirect to DMM play page when activated
function ActivateGame(){
	waiting = false;
	window.location = "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/";
}

$(document).on("ready", function(){
	
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
				ActivateGame();
				break;
			
			default: response({success:false, message:"Unknown action"}); break;
		}
	}
});