(function(){
	"use strict";
	
	KC3StrategyTabs.consumables = new KC3StrategyTab("consumables");
	
	KC3StrategyTabs.consumables.definition = new KC3Graphable(
		KC3Database.get_useitem,
		{
			name  :["bucket", "devmat", "screw", "torch"],
			full  :["Bucket", "DevMat", "Screw", "Torch"],
			dbkey :["bucket", "devmat", "screw", "torch"],
			colorhex :["00CC00", "009999", "CCCCCC", "FFCC66"],
			colorbyte:["  0,204,  0", "  0,153,153", "204,204,204", "255,204,102"]
		}
	);
	
})();