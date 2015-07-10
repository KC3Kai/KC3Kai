(function(){
	"use strict";
	
	var myVersion = chrome.runtime.getManifest().version;
	
	// Document ready
	$(document).on("ready", function(){
		$(".version").text("Version "+myVersion);
		
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
				// Add section header
				sectionBox = $("#factory .section").clone().appendTo("#wrapper .settings");
				$(".title", sectionBox).text( response[sctr].section );
				
				// Learn more button
				if(response[sctr].help!=""){
					$("a", sectionBox).attr("href", response[sctr].help );
				}else{
					$("a", sectionBox).hide();
				}
				
				// Add settings boxes under this section
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