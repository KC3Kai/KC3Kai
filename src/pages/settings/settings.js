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
		$.ajax({
			dataType: 'json',
			url: "../../data/settings.json",
			success: function(response){
				for(var sctr in response){
					// Add section header
					sectionBox = $("#factory .section").clone().appendTo("#wrapper .settings");
					$(".title", sectionBox).text( KC3Meta.term( response[sctr].section ) );
					
					// Learn more button
					if(response[sctr].help!==""){
						$("a", sectionBox).attr("href", response[sctr].help );
					}else{
						$("a", sectionBox).hide();
					}
					
					// Add settings boxes under this section
					for(var cctr in response[sctr].contents){
						if ((parseInt(response[sctr].contents[cctr].hide) || 0) === 0) // hide "private/deprecated" settings
						  new SettingsBox( response[sctr].contents[cctr] );
					}
				}
			}
		});
		
	});
	
})();