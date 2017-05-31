// Check if we are on KC3改 frame to override DMM style to apply customizations
(new RMsg("service", "dmmFrameInject", {}, function(response){
	console.debug("DMM site inject response", response);
	switch (response.mode) {
		case 'frame':
			$("body").css("margin", "0px");
			$("body").css("overflow", "hidden");
			$("#game_frame").css("position", "fixed");
			$("#game_frame").css("left", "-50px");
			$("#game_frame").css("top", "-16px");
			$("#game_frame").css("z-index", "999");
			$("#dmm-ntgnavi-renew").css("display", "none");
			$("#game_frame").css("zoom", (response.scale || 100) / 100);
			break;
		case 'inject':
			DMMCustomizations.apply(response);
			break;
	}
})).execute();
