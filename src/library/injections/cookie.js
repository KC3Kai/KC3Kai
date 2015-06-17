/* cookie.js
KC3改 Cookie Writer

Injected on URLs matching pattern: "*://*.dmm.com/*"
See Manifest File [manifest.json] under "content_scripts"

Waits and listens for trigger to write cookies.
Redirects to KanColle game page after writing
*/
(function(){
	"use strict";
	
	// Write cookies
	function writeCookies(){
		document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=osapi.dmm.com;path=/";
		document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=203.104.209.7;path=/";
		document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=www.dmm.com;path=/netgame/";
		document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=log-netgame.dmm.com;path=/";
	}
	
	// Wait and listen for cookie activation
	chrome.runtime.onMessage.addListener(function(request, sender, response) {
		// Check if we are being called by the menu
		if((request.identifier || false) == "kc3_cookie"){
			writeCookies();
			window.location = "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/";
		}
	});
	
})();