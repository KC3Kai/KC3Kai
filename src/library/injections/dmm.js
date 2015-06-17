// Check if we are on KC3改 frame to override DMM style to crop game screen
chrome.runtime.sendMessage({
	game:"kancolle",
	type:"background",
	action:"override_style"
}, function(response) {
	
	// if yes, apply CSS overrides
	if(response.value){
		$("body").css("margin", "0px");
		$("body").css("overflow", "hidden");
		$("#game_frame").css("position", "fixed");
		$("#game_frame").css("left", "-50px");
		$("#game_frame").css("top", "-16px");
		$("#game_frame").css("z-index", "1");
	}
	
});