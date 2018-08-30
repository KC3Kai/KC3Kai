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
		var expireTime = "Sun, 09 Feb 2019 09:00:09 GMT";
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