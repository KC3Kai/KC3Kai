$(document).on("ready", function(){
	
	// Play DMM Frame
	$("#play_dmm").on('click', function(){
		localStorage.extract_api = false;
		localStorage.dmmplay = true;
		window.open("../game/dmm.html", "kc3kai_game");
	});
	
	// Play via API Link
	$("#play_cc").on('click', function(){
		localStorage.extract_api = false;
		localStorage.dmmplay = false;
		window.open("../game/api.html", "kc3kai_game");
	});
	
	// Refresh API Link
	$("#get_api").on('click', function(){
		localStorage.extract_api = true;
		localStorage.dmmplay = false;
		window.open("http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/", "kc3kai_game");
	});
	
	// Activate Cookies
	$("#cookies").on('click', function(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {
				game: "kancolle",
				type: "content",
				action: "activateCookies"
			}, function(response) {
				window.close();
			});
		});
	});
	
	// Strategy Room
	$("#strategy").on('click', function(){
		window.open("../strategy/strategy.html", "kc4_strategy");
	});
	
	// Settings
	$("#settings").on('click', function(){
		window.open("../settings/settings.html", "kc4_settings");
	});
	
});