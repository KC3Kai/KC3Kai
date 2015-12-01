(function(){
	"use strict";
	
	var iconData = ["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","screw"];
	
	KC3StrategyTabs.overlodger = new KC3StrategyTab("overlodger");
	
	KC3StrategyTabs.overlodger.definition = {
		tabSelf: KC3StrategyTabs.overlodger,
		
		timeRange: {
			/*
				0 - whole
				1 - day
				2 - week
				4 - month
				8 - year
			*/
			/*jshint esnext: true */
			duration: 0b0010,
			/*
				true  - looks 1 time scale behind
				false - looks around current time scale
			*/
			scope: false,
			rate: 1,
		},
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
		},
		
		refreshList :function(){
			var self = this;
		}
		
	};
	
})();
