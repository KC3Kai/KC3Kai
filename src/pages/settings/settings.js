(function(){
	"use strict";
	
	$(document).on("ready", function(){
		// Load previously stored configs
		ConfigManager.load();
		
		// Load and show developer list
		$.getJSON("../../data/translations/en/developers.json", function(response){
			for(var ctr in response){
				addDeveloper( response[ctr] );
			}
			$("#factory .helpOut").clone().appendTo("#wrapper .developers");
			$("<div>").appendTo("#wrapper .developers").addClass("clear");
		});
		
		// Add configurable settings
		$.getJSON("../../data/translations/en/settings.json", function(response){
			for(var ctr in response){
				addSettings( response[ctr] );
			}
		});
		
	});
	
	// Show one of the developers
	function addDeveloper( info ){
		var devBox = $("#factory .devBox").clone().appendTo("#wrapper .developers");
		$(".devAvatar img", devBox).attr("src", info.avatar);
		$(".devName", devBox).text( info.name );
		$(".devDesc", devBox).text( info.desc );
		
		var linkBox;
		for(var code in info.links){
			linkBox = $("#factory .devLink").clone();
			$("a", linkBox).attr("href", info.links[code] );
			$("img", linkBox).attr("src", "../../assets/img/social/"+code+".png");
			$(".devLinks", devBox).append(linkBox);
		}
	}
	
	// Show one row of the settings
	function addSettings( info ){
		var settingBox = $("#factory .settingBox").clone().appendTo("#wrapper .settings");
		settingBox.data("config", info.id);
		$(".category", settingBox).text( info.category );
		$(".title", settingBox).text( info.name );
		if(info.help != ""){
			$(".help", settingBox).attr("href", info.help );
		}else{
			$(".help", settingBox).hide();
		}
	}
	
})();