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

			$(".tab_savedata .export_data").on("click", function(){
				window.KC3DataBackup.saveData();
			});


			$(".tab_savedata .import_file").on("change", function(event){
				if( event.target.files.length > 0 ){
				 if(window.File && window.FileReader && window.FileList && window.Blob){
					 window.KC3DataBackup.loadData(event.target.files[0]);
				 }else{
					 alert("Unfortunately, file reading is not available on your browser.");
				 }
			 }
			});


		}



	};

})();
