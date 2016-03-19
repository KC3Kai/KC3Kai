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
			KC3StrategyTabs.reloadTab(this);
		});

		$(".logo img").on("click", function(){
			KC3StrategyTabs.reloadTab();
		});
		
		$("#contentHtml").on("click", ".page_help_btn", function(){
			if( $(".page_help").is(":visible") ){
				$(".page_help").fadeOut();
			}else{
				$(".page_help").fadeIn();
			}
		});
		
		// Add listener to react on URL hash changed
		window.addEventListener('popstate', KC3StrategyTabs.onpopstate);

		// If there is a hash tag on URL, set it as initial selected
		KC3StrategyTabs.pageParams = window.location.hash.substring(1).split("-");
		if(KC3StrategyTabs.pageParams[0] !== ""){
			$("#menu .submenu ul.menulist li").removeClass("active");
			$("#menu .submenu ul.menulist li[data-id="+KC3StrategyTabs.pageParams[0]+"]").addClass("active");
		}
		
		// Load initially selected
		$("#menu .submenu ul.menulist li.active").click();
		
	});
	
	KC3StrategyTabs.gotoTab = function(tab, hashParams) {
		var newHash = (tab || KC3StrategyTabs.pageParams[0]);
		if(!!hashParams) {
			var params = hashParams;
			if(arguments.length > 2 && hashParams.constructor !== Array) {
				params = $.makeArray(arguments).slice(1);
			}
			if (params.constructor !== Array) {
				params = [ params ];
			}
			// encodeURIComponent may be needed
			newHash += "-"+params.join("-");
		}
		window.location.hash = newHash;
	}

	KC3StrategyTabs.reloadTab = function(tab) {
		var tabElement = typeof tab;
		KC3StrategyTabs.pageParams = (tabElement=="string" ? tab : window.location.hash).substring(1).split("-");
		if(tabElement != "object") {
			var tabId = KC3StrategyTabs.pageParams[0] || "profile";
			tab = $("#menu .submenu ul.menulist li[data-id="+tabId+"]");
		}
		// If loading another page, stop
		if($(tab).hasClass("disabled")){ return false; }
		if(KC3StrategyTabs.loading){ return false; }
		KC3StrategyTabs.loading = $(tab).data("id");

		// Google Analytics
		_gaq.push(['_trackEvent', "Strategy Room: "+KC3StrategyTabs.loading, 'clicked']);

		// Interface
		$("#menu .submenu ul.menulist li").removeClass("active");
		$(tab).addClass("active");
		$("#contentHtml").hide();
		$("#contentHtml").html("");
		if(KC3StrategyTabs.loading != KC3StrategyTabs.pageParams[0]) {
			window.location.hash = KC3StrategyTabs.loading;
			KC3StrategyTabs.pageParams = [KC3StrategyTabs.loading];
		}

		// Tab definition execution
		var thisTab = KC3StrategyTabs[ KC3StrategyTabs.loading ];
		if(typeof thisTab != "undefined"){
			// Execute Tab with callback
			window.activeTab = thisTab;
			thisTab.apply();
			window.scrollTo(0,0);
		}else{
			console.info("Clicked ", KC3StrategyTabs.loading, "menu with no bound actions");
			KC3StrategyTabs.loading = false;
		}
	};

	KC3StrategyTabs.onpopstate = function(event){
		var newHash = window.location.hash.substring(1);
		var oldHash = KC3StrategyTabs.pageParams.join("-");
		if(!!newHash && !KC3StrategyTabs.loading && newHash !== oldHash){
			console.debug("Auto reloading from [", oldHash, "] to [", newHash, "]");
			KC3StrategyTabs.reloadTab();
		}
	};

})();
