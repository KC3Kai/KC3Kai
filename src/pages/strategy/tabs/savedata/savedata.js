(function(){
	"use strict";
	
	KC3StrategyTabs.savedata = new KC3StrategyTab("savedata");
	
	KC3StrategyTabs.savedata.definition = {
		tabSelf: KC3StrategyTabs.savedata,
	  tableCollection:"tmp",//tmp data to write
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){

		},
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
		    $(".tab_savedata .page_padding .datapanel").show();
		    
		   
        $(".tab_savedata .page_padding .datapanel").append("Whole DB : <br />");
        
        window.KC3Database.con.tables.forEach(
          function(table){
                      table.toArray(function(all) {
                                    $(".tab_savedata .page_padding .datapanel")
                                      .append(JSON.stringify(all));
                                });
                          }
        );
          
		},

    
		
	};
	
})();
