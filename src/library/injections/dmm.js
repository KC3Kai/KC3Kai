// Check if we are on KC3改 frame to override DMM style to crop game screen
(new RMsg("service", "dmmFrameInject", {}, function(response){
	// if yes, apply CSS overrides
	if(response.value){
		$("body").css("margin", "0px");
		$("body").css("overflow", "hidden");
		$("#game_frame").css("position", "fixed");
		$("#game_frame").css("left", "-50px");
		$("#game_frame").css("top", "-16px");
		$("#game_frame").css("z-index", "999");
		$("#dmm-ntgnavi-renew").css("display", "none");
	}
})).execute();
