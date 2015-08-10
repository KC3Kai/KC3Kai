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
		//$.getJSON("+ConfigManager.language+"/developers.json", function(response){
		$.getJSON("../../data/developers.json", function(response){
			var sectionBox;
			for(var devTypeCode in response){
				// Add section header
				sectionBox = $("#factory .section").clone().appendTo("#wrapper .developers");
				$(".title", sectionBox).text( KC3Meta.term( devTypeCode ) );
				
				// Add settings boxes under this section
				for(var devCtr in response[devTypeCode]){
					addDeveloper( response[devTypeCode][devCtr] );
				}
				
				$("<div>").appendTo("#wrapper .developers").addClass("clear");
			}
			
			$("<div>").appendTo("#wrapper .developers").addClass("clear");
		});
		
	});
	
	
	
	// Show one of the developers
	function addDeveloper( info ){
		var devBox = $("#factory .devBox").clone().appendTo("#wrapper .developers");
		$(".devAvatar img", devBox).attr("src", info.avatar);
		$(".devName", devBox).text( info.name );
		if(typeof info.desc == "object"){
			var myRoles = [];
			$.each(info.desc, function(i,desc){
				myRoles.push( KC3Meta.term( desc ) );
				
			});
			$(".devDesc", devBox).append( myRoles.join(",") );
		}else{
			$(".devDesc", devBox).text( KC3Meta.term( info.desc ) );
		}
		
		
		var linkBox;
		for(var code in info.links){
			linkBox = $("#factory .devLink").clone();
			$("a", linkBox).attr("href", info.links[code] );
			$("img", linkBox).attr("src", "../../assets/img/social/"+code+".png");
			$(".devLinks", devBox).append(linkBox);
		}
	}
	
})();