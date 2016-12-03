function specialDMMMode(){
	(new RMsg("service", "dmmGetCustomizations", {}, applyDMMCustomizations)).execute();
}

function applyDMMCustomizations(response){
	console.log(response);
	
	// Apply interface configs
	$("#area-game").css("margin-top", response.config.api_margin+"px");
	if(response.config.api_bg_image === ""){
		$("body").css("background", response.config.api_bg_color);
	}else{
		$("body").css("background-image", "url("+response.config.api_bg_image+")");
		$("body").css("background-color", response.config.api_bg_color);
		$("body").css("background-size", response.config.api_bg_size);
		$("body").css("background-position", response.config.api_bg_position);
		$("body").css("background-repeat", "no-repeat");
	}
	
	
}