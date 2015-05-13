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
	
	// Load player data
	app.Player.load();
	
	// Check if basic player data is available
	if(app.Player.id==0){
		// Error page, cannot continue
		app.Strategy.showError("No player data available!");
	}else{
		// Execute strategy page
		app.Strategy.ready();
	}
});