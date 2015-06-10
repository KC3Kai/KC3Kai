// Initialize KC3 Application
var app = new KC3();

// Wait for HTML document to get ready
$(document).on("ready", function(){
	// Check if production mode
	if(chrome.runtime.id=="hkgmldnainaglpjngpajnnjfhpdjkohh"){
		$(".devBox").hide();
	}
	
	// General libraries
	app.Config.init();
	app.Meta.init("../../data/");
	app.Assets.init("../../data/");
	app.Master.init();
	app.Logging.init();
	app.Player.init();
	app.Resources.init();
	app.Docks.init();
	app.Quests.init();
	
	app.Gears.load();
	
	// Attempt to activate game screen
	app.Activator.activateGame();
	app.Activator.waitActivation();
	
	// Panel libraries
	app.Listener.init();
	app.Dashboard.init();
	app.Dashboard.Timers.init();
	
	// Apply interface configs
	if(app.Config.background_panel.substring(0,1) == "#"){
		$("body").css("background", app.Config.background_panel);
	}else{
		$("body").css("background-size", "cover");
		$("body").css("background-repeat", "no-repeat");
		$("body").css("background-image", "url("+app.Config.background_panel+")");
		$("body").css("background-position", app.Config.background_align_h+" "+app.Config.background_align_v);
	}
});