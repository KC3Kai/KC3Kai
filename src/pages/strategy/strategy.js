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

		if(ConfigManager.sr_custom_css !== ""){
			var customCSS = document.createElement("style");
			customCSS.type = "text/css";
			customCSS.innerHTML = ConfigManager.sr_custom_css;
			$("head").append(customCSS);
		}
		
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
		
		// Add listener to react on config key changed
		/* Strategy Room not needs it yet, as it can be reloaded at any time
		window.addEventListener("storage", function({key, timeStamp, url}){
			if(key === ConfigManager.keyName()) {
				ConfigManager.load();
				console.debug("Reload ConfigManager caused by", (url || "").match(/\/\/[^\/]+\/([^\?]+)/)[1]);
			}
		});
		*/
		
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
			console.warn("Clicked ", KC3StrategyTabs.loading, "menu with no bound actions");
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
		// NOTE: this method more flexible but low performance caused by DOM appending & removing
		/*
		var $c = $(element).clone()
			.css({display: 'inline', width: 'auto', visibility: 'hidden'})
			.appendTo('body');
		var cWidth = $c.width();
		$c.remove();
		return cWidth > $(element).width();
		*/
		// NOTE: this method requires element.is(":visible") already, otherwise `scrollWidth` will be 0
		return $(element).prop('scrollWidth') > $(element).width();
	};

	// A jquery-ui tooltip options like native one
	KC3StrategyTabs.nativeTooltipOptions = {
		position: { my: "left top", at: "left+25 bottom", collision: "flipfit" },
		items: "[title],[titlealt]",
		content: function(){
			// Default escaping not used, keep html, simulate native one
			return ($(this).attr("title") || $(this).attr("titlealt") || "")
				.replace(/\n/g, "<br/>")
				.replace(/\t/g, "&emsp;&emsp;");
		}
	};
	(function($) {
		// AOP around the dispatcher for any exception thrown from event handlers
		var originalEventDispatch = $.event.dispatch;
		$.event.dispatch = function() {
			try {
				originalEventDispatch.apply(this, arguments);
			} catch(error) {
				// simply log it first, hooked by DB logger by default
				console.error("Uncaught event", error, this);
				// still throw it out, will be caught by window.onerror and logged to console by default
				throw error;
			}
		};
		/*
		// For global error debugging
		window.onerror = function(messageOrEvent, source, lineno, colno, error) {
			console.debug(messageOrEvent, error);
		};
		*/
		// A lazy initializing method, prevent duplicate tooltip instance
		$.fn.lazyInitTooltip = function(opts) {
			if(typeof this.tooltip("instance") === "undefined") {
				this.tooltip($.extend(true, {}, KC3StrategyTabs.nativeTooltipOptions, opts));
			}
			return this;
		};
		// Actively close tooltips of element and its children
		$.fn.hideChildrenTooltips = function() {
			$.each($("[title]:not([disabled]),[titlealt]:not([disabled])", this), function(_, el){
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
	
	/**
	 * Simulate throttle/debounce func like the ones in lodash
	 * docs see: https://github.com/cowboy/jquery-throttle-debounce
	 * note: not actually depend on jQuery, just bind them to $
	 */
	(function($) {
		var jq_throttle = function(delay, no_trailing, callback, this_obj, debounce_mode) {
			var timeout_id, last_exec = 0;
			if ( typeof no_trailing !== 'boolean' ) {
				debounce_mode = callback;
				callback = no_trailing;
				no_trailing = undefined;
			}
			function wrapper() {
				/* jshint validthis:true */
				var self = this || this_obj, args = arguments;
				var elapsed = Date.now() - last_exec;
				function exec() {
					last_exec = Date.now();
					callback.apply( self, args );
				}
				function clear() {
					timeout_id = undefined;
				}
				if ( debounce_mode && !timeout_id ) {
					exec();
				}
				if ( timeout_id ) {
					clearTimeout( timeout_id );
				}
				if ( debounce_mode === undefined && elapsed > delay ) {
					exec();
				} else if ( no_trailing !== true ) {
					timeout_id = setTimeout( debounce_mode ? clear : exec, debounce_mode === undefined ? delay - elapsed : delay );
				}
			}
			if ( $.guid ) {
				wrapper.guid = callback.guid = callback.guid || $.guid++;
			}
			return wrapper;
		};
		$.throttle = jq_throttle;
		$.debounce = function(delay, at_begin, callback, this_obj) {
			return callback === undefined
				? jq_throttle( delay, at_begin, false )
				: jq_throttle( delay, callback, at_begin !== false, this_obj );
		};
	}(jQuery));

})();
