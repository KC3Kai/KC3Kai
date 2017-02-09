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
		
		// Check if there is an opener event flag
		if (window.location.hash.substring(1) == "installed") {
			$("#installed").show();
		} else if (window.location.hash.substring(1) == "updated") {
			$("#updated").show();
		}
		
		// Check if an available update is pending
		if (typeof localStorage.updateAvailable != "undefined" && localStorage.updateAvailable != myVersion) {
			$("#updateReady .updateReadyTitle span.num").text(localStorage.updateAvailable);
			$("#updateReady").show();
		}
		
		// Get all release pull request
		$(".loading").show();
		$.ajax({
			url: "https://api.github.com/repos/KC3Kai/KC3Kai/pulls?state=all&base=webstore",
			dataType: "JSON",
			complete: function(xhr, status){
				$(".loading").hide();
			},
			error: function(xhr, status, err){
				$("#versionList").text(err);
			},
			success: function(response){
				var releaseBox;
				var foundInstalled = false;
				// Only show recent 10 releases of page1 (30/p),
				// Order by `merged_at desc, created_at desc` as API not support
				var orderedReleases = response.slice(0, 10).sort(function(a, b){
					// let null (not released) on top
					return (b.merged_at === null) - (a.merged_at === null) ||
					new Date(b.merged_at).getTime() - new Date(a.merged_at).getTime() ||
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
				});
				$.each(orderedReleases, function(i, rel){
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
						$(".versionDate", releaseBox).text(new Date(rel.merged_at).format("UTC:yyyy-mm-dd HH:MM:ss Z"));
					} else {
						releaseBox.addClass("pending");
						$(".versionIcon img", releaseBox).attr("src", "../../assets/img/social/gh.png");
						$(".versionDate", releaseBox).text(KC3Meta.term("PageUpdateInDevelop"));
					}
					
					releaseBox.appendTo("#versionList");
				});
				
				$(".versionPR.installed").trigger("click");
			}
		});
		
		
	});
	
})();