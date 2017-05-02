(function(){
	"use strict";
	
	KC3StrategyTabs.experience = new KC3StrategyTab("experience");
	
	KC3StrategyTabs.experience.definition = new KC3Graphable('experience', {
		name  :["exp", "level"],
		full  :["Experience", "Level"],
		dbkey :["exp", "level"],
		colorhex :["239E9F", "AAFFAA"],
		colorbyte:[" 35,158,159", "  0,153,  0"]
	});
	
})();