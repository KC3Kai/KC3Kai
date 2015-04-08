// Initializr KC3 Application
var app = new KC3();

// Wait for HTML document to get ready
$(document).on("ready", function(){
	
	// Initialize Game Meta Data and Translations
	app.Meta.init("../../data/");
	
	// Initialize Game Master Data
	app.Master.init();
	
	// Logging mechanism
	app.Logging.init();
	
	// Initialize player account
	app.Player.init();
	
	// Attempt to activate game screen
	app.Activator.activateGame();
	app.Activator.waitActivation();
	
	// Listed to Chrome Network Logs
	app.Listener.init();
	
	// Initialize KC3 Settings
	app.Config.init();
	
	// Call UI ready function
	app.Dashboard.ready();
	
	$(".idfreset").on("click", function(){
		app.Logging.reset();
	});
	
});