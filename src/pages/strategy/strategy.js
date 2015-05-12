// Initialize KC3 Application
var app = new KC3();

// Page ready
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
	
	// Execute strategy page
	app.Strategy.ready();
});