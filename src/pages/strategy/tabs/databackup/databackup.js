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
			var isExportedFirst = false;
			var filename = "";

			const progressTextSelector = ".tab_databackup .processDisplay .processText";
			const toggleProgressDisplay = (inProg) => {
				$(".tab_databackup .processDisplay").toggle(!!inProg);
				$(".tab_databackup .dataSelect").toggle(!inProg);
			};
			const toggleFinishedIndicator = (isFinished) => {
				$(".tab_databackup .processDisplay .expedAkatsuki").toggle(!isFinished);
				$(".tab_databackup .processDisplay .expedFinished").toggle(!!isFinished);
			};
			const setFinishMessage = (msg) => {
				$(".tab_databackup .processDisplay .errorMessage").text(msg || "Finished!");
			};

			toggleProgressDisplay(false);
			toggleFinishedIndicator(false);
			setFinishMessage();

			$(".tab_databackup .warningbtn").on("click", function(e){
				$(".warning", $(e.target).parent()).toggle();
			});

			$(".tab_databackup .gobackbtn").on("click", function(){
				toggleProgressDisplay(false);
			});

			// Export data v1
			$(".tab_databackup .export_data").on("click", function(){
				if(confirm("Are you sure you want to export your data?")){
					toggleFinishedIndicator(false);
					toggleProgressDisplay(true);
					window.KC3DataBackup.saveData(progressTextSelector, () => {
						isExportedFirst = true;
						localStorage.lastBackupTime = Date.now();
						setFinishMessage();
						toggleFinishedIndicator(true);
						alert("Finished!");
						toggleProgressDisplay(false);
					});
				}
			});

			$(".tab_databackup .import_file").on("change", function(event){
				filename = event.target.files[0];
			});

			// Merge data v1 (not implemented)
			$(".tab_databackup .merge_data").on("click", function(){
				if(filename == ""){
					alert("No file selected");
					return;
				}
				if(confirm("Are you sure?"))
					window.KC3DataBackup.loadData(filename,false);
			});

			// Impot data v1 (overwrite)
			$(".tab_databackup .overwrite_data").on("click", function(){
				if(filename==="") {
					alert("No file selected");
					return;
				}
				if(confirm("Please close all currently opened Kancolle or KC3 tabs, panels and pages before proceeding."))
				if(confirm("This will overwrite all of your KC3 data! Are you sure?"))
				if(isExportedFirst || confirm("If you haven't backed up your old data, it will be lost! Are you sure?")){
					toggleFinishedIndicator(false);
					toggleProgressDisplay(true);
					window.KC3DataBackup.loadData(filename, true, progressTextSelector, () => {
						setFinishMessage();
						toggleFinishedIndicator(true);
						alert("Finished! Will reload this page.");
						toggleProgressDisplay(false);
						window.location.reload();
					});
				}
			});

			// Export fullset data v2
			$(".tab_databackup .export_data2").on("click", function(){
				if(confirm("Are you sure you want to export your data?")){
					toggleFinishedIndicator(false);
					toggleProgressDisplay(true);
					window.KC3DataBackup.saveDataToFolder(progressTextSelector, (autoReturn, lastErr) => {
						if(autoReturn) toggleProgressDisplay(false);
						setFinishMessage(lastErr);
						toggleFinishedIndicator(true);
					});
				}
			});

			// Export incremental data v2
			$(".tab_databackup .export_update_data2").on("click", function(){
				if(confirm("Are you sure you want to export your data?")){
					toggleFinishedIndicator(false);
					toggleProgressDisplay(true);
					window.KC3DataBackup.saveDataToFolder(progressTextSelector, (autoReturn, lastErr) => {
						if(autoReturn) toggleProgressDisplay(false);
						setFinishMessage(lastErr);
						toggleFinishedIndicator(true);
					}, true);
				}
			});

			// Import data v2
			$(".tab_databackup .import_data2").on("click", function(){
				if(confirm("Please close all currently opened Kancolle or KC3 tabs, panels and pages before proceeding."))
				if(confirm("This will overwrite all of your KC3 data! Are you sure?")){
					toggleFinishedIndicator(false);
					toggleProgressDisplay(true);
					window.KC3DataBackup.loadDataFromFolder(progressTextSelector, (autoReturn, lastErr) => {
						if(autoReturn) toggleProgressDisplay(false);
						setFinishMessage(lastErr || "Finished! Please reload this page.");
						toggleFinishedIndicator(true);
					});
				}
			});

		}
	};

})();
