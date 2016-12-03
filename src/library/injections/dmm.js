// Check if we are on KC3改 frame to override DMM style to crop game screen
(new RMsg("service", "dmmFrameInject", {}, function(response){
	// if yes, apply CSS overrides
	if (response.value) {
		if (response.type == 'frame') {
			// FRAME ONLY
			$("body").css("margin", "0px");
			$("body").css("overflow", "hidden");
			$("#game_frame").css("position", "fixed");
			$("#game_frame").css("left", "-50px");
			$("#game_frame").css("top", "-16px");
			$("#game_frame").css("z-index", "999");
			$("#dmm-ntgnavi-renew").css("display", "none");
			
		} else {
			// DMM CROP
			$("body").css({ margin:0, padding:0, 'min-width':0 });
			$("#main-ntg").css({ position: 'static' });
			$("#area-game").css({
				margin: '0px auto',
				padding: 0,
				width: 800,
				height: 480,
				background: '#000'
			});
			$(".dmm-ntgnavi").hide();
			$(".area-naviapp").hide();
			$("#ntg-recommend").hide();
			$("#foot").hide();
			$("#w, #main-ntg, #page").css({
				margin:0,
				padding:0,
				width: '100%',
				height: 0
			});
			$(document).ready(function(){
				$("#game_frame").css({
					width: 800,
					height: 480
				});
				
				$("body").css("background-image", "url(https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-342351.jpg)");
				$("body").css("background-repeat", "no-repeat");
			});
		}
	}
})).execute();
