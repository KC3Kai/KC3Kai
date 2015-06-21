(function(){
	"use strict";
	
	// Document ready
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
		
		var sectionBox;
		
		// Add configurable settings
		$.getJSON("../../data/translations/en/settings.json", function(response){
			for(var sctr in response){
				sectionBox = $("#factory .section").clone().appendTo("#wrapper .settings");
				$(".title", sectionBox).text( response[sctr].section );
				$("a", sectionBox).attr("href", response[sctr].help );
				for(var cctr in response[sctr].contents){
					new SettingsBox( response[sctr].contents[cctr] );
				}
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
	
})();