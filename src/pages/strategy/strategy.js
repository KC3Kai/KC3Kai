(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	var activeTab;
	
	Object.defineProperties(window,{
		activeTab:{
			get:function(){return activeTab;},
			set:function(newTab){
				if(newTab instanceof KC3StrategyTab){ activeTab = newTab; }
			}
		},
		activeSelf: {
			get:function(){return activeTab.definition;}
		}
	});
	
	$(document).on("ready", function(){
		// Initialize data managers
		ConfigManager.load();
		KC3Master.init();
		KC3Meta.init("../../data/");
		KC3Meta.defaultIcon("../../assets/img/ui/empty.png");
		PlayerManager.init();
		KC3ShipManager.load();
		KC3GearManager.load();
		KC3Database.init( PlayerManager.hq.id );
		RemodelDb.init();
		KC3Translation.execute();
		WhoCallsTheFleetDb.init("../../");
		
		if(!KC3Master.available){
			$("#error").text("Unable to load Strategy Room. Please open the game first so we can get data. Also make sure when you play, that you open the F12 devtools panel first before the Game Start button.");
			$("#error").show();
			$("#menu .submenu").hide();
			return false;
		}
		
		// show dev-only pages conditionally
		if ( ConfigManager.devOnlyPages ) {
			$("#menu .submenu.dev-only").show();
		}

		// Click a menu item
		$("#menu .submenu ul.menulist li").on("click", function(){
			// If loading another page, stop
			if($(this).hasClass("disabled")){ return false; }
			if(KC3StrategyTabs.loading){ return false; }
			KC3StrategyTabs.loading = $(this).data("id");
			
			// Google Analytics
			_gaq.push(['_trackEvent', "Strategy Room: "+KC3StrategyTabs.loading, 'clicked']);
			
			// Interface
			$("#menu .submenu ul.menulist li").removeClass("active");
			$(this).addClass("active");
			$("#contentHtml").hide();
			$("#contentHtml").html("");
			window.location.hash = KC3StrategyTabs.loading;
			
			// Tab definition execution
			var thisTab = KC3StrategyTabs[ KC3StrategyTabs.loading ];
			if(typeof thisTab != "undefined"){
				// Execute Tab with callback
				window.activeTab = thisTab;
				thisTab.apply();
				window.scrollTo(0,0);
			}else{
				KC3StrategyTabs.loading = false;
				console.log("Clicked "+$(this).data("id")+" menu with no bound actions");
			}
		});
		
		$("#contentHtml").on("click", ".page_help_btn", function(){
			if( $(".page_help").is(":visible") ){
				$(".page_help").fadeOut();
			}else{
				$(".page_help").fadeIn();
			}
		});
		
		// If there is a hash tag on URL, set it as initial selected
		KC3StrategyTabs.pageParams = window.location.hash.substring(1).split("-");
		if(KC3StrategyTabs.pageParams[0] !== ""){
			$("#menu .submenu ul.menulist li").removeClass("active");
			$("#menu .submenu ul.menulist li[data-id="+KC3StrategyTabs.pageParams[0]+"]").addClass("active");
		}
		
		// Load initially selected
		$("#menu .submenu ul.menulist li.active").click();
		
	});
	
})();
