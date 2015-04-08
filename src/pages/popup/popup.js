$(document).on("ready", function(){
	
	// Play via API Link
	$("#play_cc").on('click', function(){
		window.open("../game/game.html", "kc4_game");
	});
	
	// Refresh API Link
	$("#get_api").on('click', function(){
		localStorage["extract_api"] = true;
		window.open("http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/", "kc4_game");
	});
	
	// Play direct DMM
	$("#play_dmm").on('click', function(){
		localStorage["extract_api"] = false;
		window.open("http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/", "kc4_game");
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
	
});