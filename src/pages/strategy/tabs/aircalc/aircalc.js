(function(){
	"use strict";
	
	KC3StrategyTabs.aircalc = new KC3StrategyTab("aircalc");
	
	KC3StrategyTabs.aircalc.definition = {
		tabSelf: KC3StrategyTabs.aircalc,
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Check for player statstics
			if(typeof localStorage.player != "undefined"){
				this.player = JSON.parse(localStorage.player);
			}else{
				// this.tabSelf.showError("Player information not available");
				// return false;
			}
			
			// Check for player statstics
			if(typeof localStorage.statistics != "undefined"){
				this.statistics = JSON.parse(localStorage.statistics);
			}else{
				// this.tabSelf.showError("Player statistics not available");
				// return false;
			}
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			
		}
	};
	
})();
