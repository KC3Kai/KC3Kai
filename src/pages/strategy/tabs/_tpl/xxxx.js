(function(){
	"use strict";

	KC3StrategyTabs.sample = new KC3StrategyTab("sample");

	KC3StrategyTabs.sample.definition = {
		tabSelf: KC3StrategyTabs.sample,

		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
			// TODO codes stub, remove this if nothing to do
		},

		/* RELOAD: optional
		Loads latest player or game data if needed.
		---------------------------------*/
		reload: function() {
			// TODO codes stub, remove this if nothing to do
		},

		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			// TODO codes stub, remove this if nothing to do
		},

		/* UPDATE: optional
		Partially update elements of the interface,
			possibly without clearing all contents first.
		Be careful! Do not only update new data,
			but also handle the old states (do cleanup).
		Return `false` if updating all needed,
			EXECUTE will be invoked instead.
		---------------------------------*/
		update: function(pageParams) {
			// Use `pageParams` for latest page hash values,
			// KC3StrategyTabs.pageParams keeps the old values for states tracking
			
			// TODO codes stub, remove this if nothing to do

			// Returning `true` means updating has been handled.
			return false;
		}
	};

})();
