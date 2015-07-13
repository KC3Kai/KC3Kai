(function(){
	"use strict";
	
	var myVersion = chrome.runtime.getManifest().version;
	
	// Document ready
	$(document).on("ready", function(){
		$(".version").text("Version "+myVersion);
		
		// Load previously stored configs
		ConfigManager.load();
		
		// Load and show developer list
		console.log(ConfigManager.language);
		$.getJSON("../../data/translations/"+ConfigManager.language+"/developers.json", function(response){
			for(var ctr in response){
				addDeveloper( response[ctr] );
			}
			$("#factory .helpOut").clone().appendTo("#wrapper .developers");
			$("<div>").appendTo("#wrapper .developers").addClass("clear");
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