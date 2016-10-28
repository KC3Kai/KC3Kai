(function(){
	"use strict";
	_gaq.push(['_trackEvent', "DevTools Opened", 'clicked']);
	
	// Document ready
	$(document).on("ready", function(){
		// Load previously stored configs
		try {
			// Attempt to load config from localStorage
			ConfigManager.load();
			
			// Check if theme exists
			$.ajax({
				type: "HEAD",
				url: "themes/"+ConfigManager.pan_theme+"/"+ConfigManager.pan_theme+".html",
				success: function(){
					createPanel( ConfigManager.pan_theme );
				},
				error: function(){
					createPanel( "default" );
				}
			});
			
			if (ConfigManager.apiRecorder) {
				chrome.devtools.panels.create("KCSAPI",
					"../../assets/img/logo/16.png",
					"pages/devtools/recorder/recorder.html",
					function(panel){}
				);
			}
			
		} catch (e) {
			// Catch any exceptions in the attempt
			chrome.devtools.panels.create("DevKC3Kai",
				"../../assets/img/logo/16.png",
				"pages/devtools/fail.html",
				function(panel){}
			);
		}
	});
	
	// Execute Chrome API to add panels to devtools
	function createPanel( theme ){
		chrome.devtools.panels.create("DevKC3Kai",
			"../../assets/img/logo/16.png",
			"pages/devtools/themes/"+theme+"/"+theme+".html",
			function(panel){}
		);
	}
	
})();
