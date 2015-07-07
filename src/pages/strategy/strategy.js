(function(){
	"use strict";
	
	$(document).on("ready", function(){
		// Initialize data managers
		ConfigManager.load();
		KC3Meta.init("../../data/");
		KC3Master.init();
		PlayerManager.init();
		KC3ShipManager.load();
		KC3GearManager.load();
		
		// Click a menu item
		$("#menu .submenu ul.menulist li").on("click", function(){
			// If loading another page, stop
			if($(this).hasClass("disabled")){ return false; }
			if(KC3StrategyTabs.loading){ return false; }
			KC3StrategyTabs.loading = $(this).data("id");
			
			// Interface
			$("#menu .submenu ul.menulist li").removeClass("active");
			$(this).addClass("active");
			$("#contentHtml").hide();
			$("#contentHtml").html("");
			
			// Tab definition execution
			var thisTab = KC3StrategyTabs[ KC3StrategyTabs.loading ];
			if(typeof thisTab != "undefined"){
				// Execute Tab with callback
				thisTab.apply();
			}else{
				KC3StrategyTabs.loading = false;
				console.log("Clicked "+$(this).data("id")+" menu with no bound actions");
			}
		});
		
		// If there is a hash tag on URL, set it as initial selected
		if(window.location.hash != ""){
			$("#menu .submenu ul.menulist li").removeClass("active");
			$("#menu .submenu ul.menulist li[data-id="+window.location.hash.substring(1)+"]").addClass("active");
		}
		
		// Load initially selected
		$("#menu .submenu ul.menulist li.active").click();
		
	});
	
})();