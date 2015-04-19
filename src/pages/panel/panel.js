// Initializr KC3 Application
var app = new KC3();

// Wait for HTML document to get ready
$(document).on("ready", function(){
	
	app.Config.init();
	app.Meta.init("../../data/");
	app.Assets.init("../../data/");
	
	app.Master.init();
	app.Logging.init();
	app.Player.init();
	
	// Attempt to activate game screen
	app.Activator.activateGame();
	app.Activator.waitActivation();
	
	app.Listener.init();
	app.Dashboard.init();
	app.Dashboard.Timers.init();
	
});