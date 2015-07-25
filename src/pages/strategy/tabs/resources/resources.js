(function(){
	"use strict";
	
	KC3StrategyTabs.resources = new KC3StrategyTab("resources");
	
	KC3StrategyTabs.resources.definition = new KC3Graphable(
		KC3Database.get_resource,
		{
			name  :["fuel","ammo","steel","baux"],
			full  :["Fuel","Ammo","Steel","Bauxite"],
			dbkey :["rsc1","rsc2","rsc3","rsc4"],
			colorhex :["AAFFAA","999900","999999","FF9933"],
			colorbyte:["  0,153,  0","153,153,  0","153,153,153","255,153, 51"]
		}
	);
	
})();