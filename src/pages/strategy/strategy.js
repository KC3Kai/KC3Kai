(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	const HASH_PARAM_DELIM = "-";
	const WINDOW_TITLE = "KC3改 Strategy Room";
	var activeTab;
	var themeName;
	
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
		KC3Master.loadAbyssalShips("../../data/");
		KC3Master.loadSeasonalShips("../../data/");
		KC3Meta.defaultIcon("../../assets/img/ui/empty.png");
		PlayerManager.init();
		KC3ShipManager.load();
		KC3GearManager.load();
		KC3Database.init( PlayerManager.hq.id );
		RemodelDb.init();
		KC3Translation.execute();
		WhoCallsTheFleetDb.init("../../");
		
		themeName = ConfigManager.sr_theme || "dark";
		var themeCSS = document.createElement("link");
		themeCSS.rel = "stylesheet";
		themeCSS.type = "text/css";
		themeCSS.href = "./themes/"+themeName+".css";
		$("head").append(themeCSS);
		
		if(!KC3Master.available){
			$("#error").text("Strategy Room is not ready. Please open the game once so we can get data. Also make sure following the instructions, that open the F12 devtools panel first before the Game Player shown.");
			$("#error").show();
		}
		
		// show dev-only pages conditionally
		if ( ConfigManager.devOnlyPages ) {
			$("#menu .submenu.dev-only").show();
		}
		
		// Click a menu item
		$("#menu .submenu ul.menulist li").on("click", function(){
			// Google Analytics just for click event
			var gaEvent = "Strategy Room: " + $(this).data("id");
			_gaq.push(['_trackEvent', gaEvent, 'clicked']);
			
			KC3StrategyTabs.reloadTab(this);
		});
		
		// Refresh current tab and force data reloading
		$(".logo").on("click", function(){
			console.debug("Reloading current tab [", KC3StrategyTabs.pageParams[0], "] on demand");
			KC3StrategyTabs.reloadTab(undefined, true);
		});
		
		$("#contentHtml").on("click", ".page_help_btn", function(){
			if( $(".page_help").is(":visible") ){
				$(".page_help").fadeOut();
			}else{
				$(".page_help").fadeIn();
			}
		});
		
		// Add back to top and reload float button
		$(window).scroll(function(){
			if($(this).scrollTop() > 90){
				$('.float_toolbar').fadeIn();
			} else {
				$('.float_toolbar').fadeOut();
			}
		});
		$(".float_toolbar .back_to_top").on("click", function(){
			$("html, body").animate({scrollTop: 0}, 300);
		});
		$(".float_toolbar .reload").on("click", function(){
			$(".logo").trigger("click");
		});
		
		$("#error").on("click", function(){
			$(this).empty().hide();
		});
		
		// Add listener to react on URL hash changed
		window.addEventListener('popstate', KC3StrategyTabs.onpopstate);
		
		// If there is a hash tag on URL, set it as initial selected
		KC3StrategyTabs.pageParams = window.location.hash.substring(1).split(HASH_PARAM_DELIM);
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
			newHash += HASH_PARAM_DELIM + params.join(HASH_PARAM_DELIM);
		}
		window.location.hash = newHash;
	};

	KC3StrategyTabs.reloadTab = function(tab, reloadData) {
		var tabElement = typeof tab;
		KC3StrategyTabs.pageParams = (tabElement=="string" ? tab : window.location.hash).substring(1).split(HASH_PARAM_DELIM);
		if(tabElement != "object") {
			var tabId = KC3StrategyTabs.pageParams[0] || "profile";
			tab = $("#menu .submenu ul.menulist li[data-id="+tabId+"]");
		}
		// If loading another page, stop
		if($(tab).hasClass("disabled")){ return false; }
		if(KC3StrategyTabs.loading){ return false; }
		KC3StrategyTabs.loading = $(tab).data("id");

		// Interface
		$("#menu .submenu ul.menulist li").removeClass("active");
		$(tab).addClass("active");
		$("#contentHtml").hide().empty();
		window.document.title = "{0} - {1}".format(WINDOW_TITLE, $(tab).text());
		if(KC3StrategyTabs.loading != KC3StrategyTabs.pageParams[0]) {
			window.location.hash = KC3StrategyTabs.loading;
			KC3StrategyTabs.pageParams = [KC3StrategyTabs.loading];
		}

		// Tab definition execution
		var thisTab = KC3StrategyTabs[ KC3StrategyTabs.loading ];
		if(typeof thisTab != "undefined"){
			// Execute Tab with callback
			window.activeTab = thisTab;
			thisTab.apply(reloadData);
			window.scrollTo(0,0);
		}else{
			console.info("Clicked ", KC3StrategyTabs.loading, "menu with no bound actions");
			KC3StrategyTabs.loading = false;
		}
	};

	KC3StrategyTabs.onpopstate = function(event){
		var newHash = window.location.hash.substring(1);
		var oldHash = KC3StrategyTabs.pageParams.join(HASH_PARAM_DELIM);
		if(!!newHash && !KC3StrategyTabs.loading && newHash !== oldHash){
			var newParams = newHash.split(HASH_PARAM_DELIM);
			if(newParams[0] === KC3StrategyTabs.pageParams[0] && !!window.activeSelf.update){
				// Pass new hash parameters to callback, keep old params in KC3StrategyTabs
				if(!!window.activeSelf.update(newParams)){
					// Update `KC3StrategyTabs.pageParams` if `reloadTab` skipped
					KC3StrategyTabs.pageParams = window.location.hash.substring(1).split(HASH_PARAM_DELIM);
					return;
				}
			}
			console.debug("Auto reloading from [", oldHash, "] to [", newHash, "]");
			KC3StrategyTabs.reloadTab();
		}
	};

	KC3StrategyTabs.isTextEllipsis = function(element){
		var $c = $(element).clone()
			.css({display: 'inline', width: 'auto', visibility: 'hidden'})
			.appendTo('body');
		var cWidth = $c.width();
		$c.remove();
		return cWidth > $(element).width();
	};

	// A jquery-ui tooltip options like native one
	KC3StrategyTabs.nativeTooltipOptions = {
		position: { my: "left top", at: "left+25 bottom", collision: "flipfit" },
		content: function(){
			// Default escaping not used, keep html, simulate native one
			return $(this).attr("title")
				.replace(/\n/g, "<br/>")
				.replace(/\t/g, "&emsp;&emsp;");
		}
	};
	(function($) {
		// A lazy initialzing method, prevent duplicate tooltip instance
		$.fn.lazyInitTooltip = function(opts) {
			if(typeof this.tooltip("instance") === "undefined") {
				this.tooltip(opts || KC3StrategyTabs.nativeTooltipOptions);
			}
			return this;
		};
		// Actively close tooltips of element and its children
		$.fn.hideChildrenTooltips = function() {
			$.each($("[title]:not([disabled])", this), function(_, el){
				if(typeof $(el).tooltip("instance") !== "undefined")
					$(el).tooltip("close");
			});
			return this;
		};
		// Create native-like tooltips of element and its children
		$.fn.createChildrenTooltips = function() {
			$.each($("[title]:not([disabled])", this), function(_, el){
				$(el).lazyInitTooltip();
			});
			return this;
		};
	}(jQuery));

})();
