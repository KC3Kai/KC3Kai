// Initialize KC3 Application
var app = new KC3();

// Get manifest version
var manifest = chrome.runtime.getManifest();

// Page ready
$(document).on("ready", function(){
	// Get current configs
	app.Config.init();
	
	console.log(app.Config);
	
	$(".about_version span").text(manifest.version);
	
});