(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	var myVersion = chrome.runtime.getManifest().version;
	
	// Document ready
	$(document).on("ready", function(){
		// Show installed version
		$(".verNum").text(myVersion);
		
		// Load previously stored configs
		ConfigManager.load();
		KC3Meta.init("../../data/");
		KC3Translation.execute();
		
		// Set HTML language
		$("html").attr("lang", ConfigManager.language);
		
		// Load and show developer list
		//$.getJSON("../../data/translations/"+ConfigManager.language+"/developers.json", function(response){
		$.getTranslationJSON(ConfigManager.language, 'developers', function(response){
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