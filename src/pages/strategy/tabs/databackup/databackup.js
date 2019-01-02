(function(){
	"use strict";

	KC3StrategyTabs.databackup = new KC3StrategyTab("databackup");

	KC3StrategyTabs.databackup.definition = {
		tabSelf: KC3StrategyTabs.databackup,
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){

		},


		/* EXECUTE
		Places data onto the interface
		---------------------------------*/

		execute :function(){
			var sav = false;
			$(".tab_databackup .processDisplay").hide();

			$(".tab_databackup .export_data").on("click", function(){ //export data
				sav = true;
				if(confirm("Are you sure you want to export your data?")){
					$(".tab_databackup .dataselect").hide();
					$(".tab_databackup .processDisplay").show();
					window.KC3DataBackup.saveData(".tab_databackup .processDisplay .processText",function(){
							localStorage.lastBackupTime = Date.now();
							alert("finished!");
							$(".tab_databackup .dataselect").show();
							$(".tab_databackup .processDisplay").hide();
					});
				}
			});

			$(".tab_databackup .merge_data").on("click", function(){ //merge_data
				if(filename===""){
					alert("No file selected");
					return;
				}
				if(confirm("Are you sure?"))
					window.KC3DataBackup.loadData(filename,false);
			});

			$(".tab_databackup .warningbtn").on("click", function(){ //warning_btn
				$(".tab_databackup .warning").toggle();
			});

			$(".tab_databackup .overwrite_data").on("click", function(){ //overwrite_data
				if(confirm("Please close all currently opened Kancolle or KC3 tabs, panels and pages before proceeding."))
				if(confirm("This will overwrite all of your KC3 data! Are you sure?")){
					if(filename==="")
						alert("No file selected");
					else
						if(sav||confirm("If you haven't backed up your old data, it will be lost! Are you sure?")){
							$(".tab_databackup .dataselect").hide();
							$(".tab_databackup .processDisplay").show();
							window.KC3DataBackup.loadData(filename,true,".tab_databackup .processDisplay .processText",function(){
								alert("Finished! Will reload this page.");
								$(".tab_databackup .dataselect").show();
								$(".tab_databackup .processDisplay").hide();
								window.location.reload();
							});
						}
				}
			});

			var filename="";
			//window.KC3DataBackup.loadData(event.target.files[0]);
			$(".tab_databackup .import_file").on("change", function(event){
				filename = event.target.files[0];
			});
		}
	};

})();
