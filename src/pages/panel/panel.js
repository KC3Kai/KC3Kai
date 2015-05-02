// Initialize KC3 Application
var app = new KC3();

// Wait for HTML document to get ready
$(document).on("ready", function(){
	// General libraries
	app.Config.init();
	app.Meta.init("../../data/");
	app.Assets.init("../../data/");
	app.Master.init();
	app.Logging.init();
	app.Player.init();
	app.Resources.init();
	app.Docks.init();
	
	app.Gears.load();
	
	// Attempt to activate game screen
	app.Activator.activateGame();
	app.Activator.waitActivation();
	
	// Panel libraries
	app.Listener.init();
	app.Dashboard.init();
	app.Dashboard.Timers.init();
});