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
			var sav=false;
			$(".tab_savedata .export_data").on("click", function(){
				sav = true;
				window.KC3DataBackup.saveData();
			});

			$(".tab_savedata .overwrite_data").on("click", function(){
				if(confirm("You will overwrite all your kc3 data! are you sure?"))
					if(sav|confirm("You didn't backup your data! are you sure?"))
						window.KC3DataBackup.saveData();
			});
			$(".tab_savedata .merge_data").on("click", function(){
				if(confirm("You will overwrite all your kc3 data! are you sure?"))
					if(sav|confirm("You didn't backup your data! are you sure?"))
						window.KC3DataBackup.saveData();
			});

			var filename;
			//window.KC3DataBackup.loadData(event.target.files[0]);
			$(".tab_savedata .import_file").on("change", function(event){
				filename = event.target.files[0];
			});
		}
	};

})();
