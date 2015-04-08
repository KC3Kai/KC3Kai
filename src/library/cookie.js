// Wait and listen for cookie activation
chrome.runtime.onMessage.addListener(function(request, sender, response) {
	
	// Check if we are being called by the menu
    if(request.game==="kancolle" && request.type==="content"){
		switch(request.action){
			
			// Write the cookies
			case "activateCookies":
				document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=osapi.dmm.com;path=/";
				document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=203.104.209.7;path=/";
				document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=www.dmm.com;path=/netgame/";
				document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=log-netgame.dmm.com;path=/";
				window.location = "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/";
				break;
				
			// u w0t m8?
			default:
				break;
		}
	}
	
});