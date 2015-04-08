// If awaiting activation
var waiting = false;

// Show game screens
function ActivateGame(){
	waiting = false;
	$("#wait-box").hide();
	$("#game-box").show();
	$("#game-swf").attr("src", localStorage["absoluteswf"]);
}

$(document).on("ready", function(){
	
	// API link determines which screen to show
	var absoluteSwf = localStorage["absoluteswf"];
	if(absoluteSwf){
		$(".api_txt textarea").text(localStorage["absoluteswf"])
		$("#wait-box").show();
		waiting = true;
	}else{
		$("#no-api").show();
	}
	
	// Update API Link
	$(".api_submit").on('click', function(){
		localStorage["absoluteswf"] = $(".api_text").val();
		window.location.reload();
	});
	
	// Forget API Link
	$(".forget_btn").on('click', function(){
		localStorage["absoluteswf"] = "";
		window.location.reload();
	});
	
	// Quick Play
	$(".play_btn").on('click', function(){
		ActivateGame();
	});
	
	// API link select all textarea
	$(".api_txt textarea").on("focus", function() {
		var $this = $(this);
		$this.select();
		$this.mouseup(function() {
			$this.unbind("mouseup");
			return false;
		});
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