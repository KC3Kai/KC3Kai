(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	ConfigManager.load();
	KC3Meta.init("../../data/");
	KC3Translation.execute();
	
	var myVersion = chrome.runtime.getManifest().version;
	
	// Document ready
	$(document).on("ready", function(){
		// Get all release pull request
		/*$.ajax({
			url: "https://api.github.com/repos/KC3Kai/KC3Kai/pulls?state=all&base=webstore",
			dataType: "JSON",
			success: function(response){
				console.log(response);
			}
		});*/
		
		if (typeof localStorage.updateAvailable != "undefined" && localStorage.updateAvailable != myVersion) {
			$("#updateReady .updateReadyTitle span.num").text(localStorage.updateAvailable);
			$("#updateReady").show();
		}
		
		$("#restartNow").on("click", function(){
			chrome.runtime.reload();
		});
		
		$("#restartLater").on("click", function(){
			$("#updateReady").hide();
		});
	});
	
})();