/* cookie.js
KC3改 Cookie Writer

Injected on URLs matching pattern: "*://*.dmm.com/*"
See Manifest File [manifest.json] under "content_scripts"

Waits and listens for trigger to write cookies.
Redirects to KanColle game page after writing
*/
(function(){
	"use strict";
	
	// New Cookie Hack
	function writeCookies(){
		var expireTime = function(){
			var now = new Date();
			now.setFullYear(now.getFullYear() + 1);
			return now.toUTCString();
		}();
		var buildCookie = function(key, value, domain, path){
			return key + "=" + value + ";expires=" + expireTime + ";domain=" + domain + ";path=" + path;
		};
		document.cookie = buildCookie("cklg", "welcome", ".dmm.com", "/");
		document.cookie = buildCookie("cklg", "welcome", ".dmm.com", "/netgame/");
		document.cookie = buildCookie("cklg", "welcome", ".dmm.com", "/netgame_s/");
		document.cookie = buildCookie("cklg", "welcome", ".dmm.com", "/play/");
		document.cookie = buildCookie("ckcy", "1", ".dmm.com", "/");
		document.cookie = buildCookie("ckcy", "1", ".dmm.com", "/netgame/");
		document.cookie = buildCookie("ckcy", "1", ".dmm.com", "/netgame_s/");
		document.cookie = buildCookie("ckcy", "1", ".dmm.com", "/play/");
		document.cookie = buildCookie("ckcy", "1", "www.dmm.com", "/");
		document.cookie = buildCookie("ckcy", "1", "osapi.dmm.com", "/");
		document.cookie = buildCookie("ckcy", "1", "log-netgame.dmm.com", "/");
		console.log("Hacked cookies written!");
	}
	
	// Check if "Force Cookies" enabled
	chrome.runtime.sendMessage({
		identifier: "kc3_service",
		action: "getConfig",
		id: "dmm_forcecookies"
	}, function(response){
		if(response.value){
			writeCookies();
		}else{
			console.log("KC3改 forcing cookies disabled, enjoy error areas.");
		}
	});
	
})();