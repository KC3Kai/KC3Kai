(function(){
	"use strict";
	
	KC3StrategyTabs.savedata = new KC3StrategyTab("savedata");
	
	KC3StrategyTabs.savedata.definition = {
		tabSelf: KC3StrategyTabs.savedata,
		
		var : db,
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
		    db = window.KC3Database.con;

		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
		    $(".tab_savedata .page_padding .datapanel").show();
        db.account.each(function(data){append(data);});
		},

    append :function(a){
        $(".tab_savedata .page_padding .datapanel").text.append(a);
    }
		
	};
	
})();
