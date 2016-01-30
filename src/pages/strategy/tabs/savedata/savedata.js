(function(){
	"use strict";
	
	KC3StrategyTabs.savedata = new KC3StrategyTab("savedata");
	
	KC3StrategyTabs.savedata.definition = {
		tabSelf: KC3StrategyTabs.savedata,
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){

		},
		
	
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
		
		$(".tab_savedata .export_data").on("click", function(){//the data will be saved here
				  //saveDataToDisk();
			window.KC3DataBackup.saveData();
				//saveAs(blob, "["+PlayerManager.hq.name+"] "+((new Date()).format("yyyy-mm-dd"))+".kc3db");
			});


		$(".tab_savedata .import_file").on("change", function(event){
		   
		});
	   
		  
		}

	
		
	};
	
})();
