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
			var isReloadNeeded = false;
			var filename = "";

			const progressTextSelector = ".tab_databackup .processDisplay .processText";
			const toggleProgressDisplay = (inProg) => {
				$(".tab_databackup .processDisplay").toggle(!!inProg);
				$(".tab_databackup .dataSelect").toggle(!inProg);
				if(!inProg) $(".tab_databackup .warning").hide();
			};
			const toggleFinishedIndicator = (isFinished) => {
				$(".tab_databackup .processDisplay .expedAkatsuki").toggle(!isFinished);
				$(".tab_databackup .processDisplay .expedFinished").toggle(!!isFinished);
				if(!isFinished) isReloadNeeded = false;
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
				if(isReloadNeeded) window.location.reload();
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
						setFinishMessage("Finished! Please reload this page.");
						toggleFinishedIndicator(true);
						alert("Finished!");
						isReloadNeeded = true;
					});
				}
			});

			// Export fullset data v2
			$(".tab_databackup .export_data2").on("click", function(){
				toggleFinishedIndicator(false);
				toggleProgressDisplay(true);
				window.KC3DataBackup.saveDataToFolder(progressTextSelector, (autoBack, lastErr) => {
					if(autoBack) toggleProgressDisplay(false);
					setFinishMessage(lastErr);
					toggleFinishedIndicator(true);
				});
			});

			// Export incremental data v2
			$(".tab_databackup .export_update_data2").on("click", function(){
				toggleFinishedIndicator(false);
				toggleProgressDisplay(true);
				window.KC3DataBackup.saveDataToFolder(progressTextSelector, (autoBack, lastErr) => {
					if(autoBack) toggleProgressDisplay(false);
					setFinishMessage(lastErr);
					toggleFinishedIndicator(true);
				}, true);
			});

			// Import data v2
			$(".tab_databackup .import_data2").on("click", function(){
				toggleFinishedIndicator(false);
				toggleProgressDisplay(true);
				window.KC3DataBackup.loadDataFromFolder(progressTextSelector, (autoBack, lastErr) => {
					if(autoBack) toggleProgressDisplay(false);
					if(!autoBack && !lastErr) isReloadNeeded = true;
					setFinishMessage(lastErr || "Finished! Please reload this page.");
					toggleFinishedIndicator(true);
				});
			});

		}
	};

})();
