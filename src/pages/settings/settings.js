(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	// Document ready
	$(document).on("ready", function(){
		// Load previously stored configs
		ConfigManager.load();
		KC3Meta.init("../../data/");
		KC3Translation.execute();
		
		// Set HTML language
		$("html").attr("lang", ConfigManager.language);
		
		var sectionBox;
		
		// Add configurable settings
		//$.getJSON("../../data/translations/"+ConfigManager.language+"/settings.json", function(response){
		$.getTranslationJSON(ConfigManager.language, 'settings', function(response){
			for(var sctr in response){
				// Add section header
				sectionBox = $("#factory .section").clone().appendTo("#wrapper .settings");
				$(".title", sectionBox).text( response[sctr].section );
				
				// Learn more button
				if(response[sctr].help!==""){
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