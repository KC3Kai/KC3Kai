KC3.prototype.Dashboard.Timers = {
	
	fillTimers :function(){
		// console.log("app.Player._repairCount: "+app.Player._repairCount);
		// console.log("app.Player._buildCount: "+app.Player._buildCount);
		
		var tmpClass = "box-timers-"+app.Player._repairCount;
		if( !$("#box-repairs").hasClass(tmpClass) ){
			$("#box-repairs").removeClass("box-timers-2");
			$("#box-repairs").removeClass("box-timers-3");
			$("#box-repairs").removeClass("box-timers-4");
			$("#box-repairs").addClass(tmpClass);
		}
		
		tmpClass = "box-timers-"+app.Player._buildCount;
		if( !$("#box-constructions").hasClass(tmpClass) ){
			$("#box-constructions").removeClass("box-timers-2");
			$("#box-constructions").removeClass("box-timers-3");
			$("#box-constructions").removeClass("box-timers-4");
			$("#box-constructions").addClass(tmpClass);
		}
		
		app.FleetTimer.expedition( $("#exped-box-1"), 1 );
		app.FleetTimer.expedition( $("#exped-box-2"), 2 );
		app.FleetTimer.expedition( $("#exped-box-3"), 3 );
		
		app.FleetTimer.repair( $("#repair-box-1"), 0 );
		app.FleetTimer.repair( $("#repair-box-2"), 1 );
		app.FleetTimer.repair( $("#repair-box-3"), 2 );
		app.FleetTimer.repair( $("#repair-box-4"), 3 );
		
		app.FleetTimer.build( $("#build-box-1"), 0 );
		app.FleetTimer.build( $("#build-box-2"), 1 );
		app.FleetTimer.build( $("#build-box-3"), 2 );
		app.FleetTimer.build( $("#build-box-4"), 3 );
	},
	
};