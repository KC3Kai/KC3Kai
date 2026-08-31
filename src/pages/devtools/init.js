(function() {
	"use strict";
	_gaq.push(['_trackEvent', "DevTools Opened", 'clicked']);
	
	// Document ready
	$(document).on("ready", function() {
		// Load previously stored configs
		try {
			// Attempt to load config from localStorage
			ConfigManager.load();
			
			// Check if theme exists
			$.ajax({
				type: "HEAD",
				url: "themes/" + ConfigManager.pan_theme + "/" + ConfigManager.pan_theme + ".html",
				success: function(){
					createPanel( ConfigManager.pan_theme );
				},
				error: function(){
					createFailPanel();
				}
			});
			
			if (ConfigManager.apiRecorder) {
				createApiRecorderPanel();
			}
			
		} catch (e) {
			// Catch any exceptions in the attempt
			createFailPanel();
			console.error("DevTools panel initializing", e);
		}
	});
	
	function panelCreateCallback(extensionPanel) {
		console.debug("DevTools panel creating promised", extensionPanel);
	}
	
	function panelCreateException(name, error) {
		console.error("DevTools panel creating " + name, error);
	}
	
	// Execute Chrome API to add panels to devtools
	function createPanel( theme ) {
		const p = chrome.devtools.panels.create("DevKC3Kai",
			"../../assets/img/logo/16.png",
			"pages/devtools/themes/" + theme + "/" + theme + ".html"
		);
		if(p) p.then(panelCreateCallback).catch(panelCreateException.bind(undefined, theme));
	}
	
	function createFailPanel() {
		const p = chrome.devtools.panels.create("DevKC3Kai",
			"../../assets/img/logo/16.png",
			"pages/devtools/fail.html"
		);
		if(p) p.then(panelCreateCallback).catch(panelCreateException.bind(undefined, "fail"));
	}
	
	function createApiRecorderPanel() {
		const p = chrome.devtools.panels.create("KCSAPI",
			"../../assets/img/logo/16.png",
			"pages/devtools/recorder/recorder.html"
		);
		if(p) p.then(panelCreateCallback).catch(panelCreateException.bind(undefined, "recorder"));
	}
	
})();
