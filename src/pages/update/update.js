(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	ConfigManager.load();
	KC3Meta.init("../../data/");
	KC3Translation.execute();
	
	var newInstall = window.location.hash.substring(1) == "installed";
	
	var myVersion = chrome.runtime.getManifest().version;
	
	// Document ready
	$(document).on("ready", function(){
		// Show installed version
		$(".verNum").text(myVersion);
		
		if (newInstall) {
			$("title").text(KC3Meta.term("InstalledTitle"));
			$(".versionNotes").html(KC3Meta.term("InstallText"));
			$(".viewLogs").hide();
		} else {
			$("title").text(KC3Meta.term("UpdatedTitle"));
			$(".versionNotes").html(KC3Meta.term("UpdateText"));
			$(".viewWiki").hide();
		}
		
		// Set HTML language
		$("html").attr("lang", ConfigManager.language);
		
	});
	
})();