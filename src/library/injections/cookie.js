/* cookie.js
KC3改 Cookie Writer

Injected on URLs matching pattern: "*://*.dmm.com/*"
See Manifest File [manifest.json] under "content_scripts"

Waits and listens for trigger to write cookies.
Redirects to KanColle game page after writing
*/
(function(){
	"use strict";
	
	document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=osapi.dmm.com;path=/";
	document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=203.104.209.7;path=/";
	document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=log-netgame.dmm.com;path=/";
	
	document.cookie = "cklg=welcome;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/";
	document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/";
	document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame/";
	document.cookie = "ckcy=1;expires=Sun, 09 Feb 2019 09:00:09 GMT;domain=.dmm.com;path=/netgame_s/";
	
})();