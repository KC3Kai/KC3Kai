(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	ConfigManager.load();
	KC3Meta.init("../../data/");
	KC3Translation.execute();
	
	var myVersion = chrome.runtime.getManifest().version;
	
	// Document ready
	$(document).on("ready", function(){
		$("#restartNow").on("click", function(){
			chrome.runtime.reload();
		});
		
		$("#restartLater").on("click", function(){
			$("#updateReady").hide();
		});
		
		$("#versionList").on("click", ".versionPR", function(){
			$("#versionText .title").html($(this).data("title"));
			$("#versionText .link a").text($(this).data("link"));
			$("#versionText .link a").attr("href", $(this).data("link"));
			$("#versionText .link").show();
			$("#versionText .desc").html(markdown.toHTML( $(this).data("desc") ));
		});
		
		// Check if an available update is pending
		if (typeof localStorage.updateAvailable != "undefined" && localStorage.updateAvailable != myVersion) {
			$("#updateReady .updateReadyTitle span.num").text(localStorage.updateAvailable);
			$("#updateReady").show();
		}
		
		// Get all release pull request
		$.ajax({
			url: "https://api.github.com/repos/KC3Kai/KC3Kai/pulls?state=all&base=webstore",
			dataType: "JSON",
			success: function(response){
				var releaseBox;
				var foundInstalled = false;
				
				$.each(response, function(i, rel){
					if (i > 10) return false;
					
					// Create new entry on list
					releaseBox = $("#factory .versionPR").clone();
					$(".versionName", releaseBox).text(rel.title);
					releaseBox.data("title", rel.title);
					releaseBox.data("link", rel.html_url);
					releaseBox.data("desc", rel.body);
					
					if (rel.title.indexOf(myVersion) > -1) {
						releaseBox.addClass("installed");
						foundInstalled = true;
					}
					
					if (foundInstalled) {
						$(".versionStatus", releaseBox).css({background:"#7c7"});
					} else {
						$(".versionStatus", releaseBox).css({background:"#f99"});
					}
					
					if (rel.merged_at) {
						$(".versionIcon img", releaseBox).attr("src", "../../assets/img/social/ws.png");
						$(".versionDate", releaseBox).text(new Date(rel.merged_at).format("mmm dd, yyyy - hh:MM:ss TT"));
					} else {
						releaseBox.addClass("pending");
						$(".versionIcon img", releaseBox).attr("src", "../../assets/img/social/gh.png");
						$(".versionDate", releaseBox).text("In development");
					}
					
					releaseBox.appendTo("#versionList");
				});
				
				$(".versionPR.installed").trigger("click");
			}
		});
		
		
	});
	
})();