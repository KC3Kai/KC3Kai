(function(){
	"use strict";

	window.KC3DataBackup = {
			saveData : function(){//Save All Data to blob
				var fullDBData={};
				var fullStorageData="";
				var zip = new JSZip();
				var trz;
				window.KC3Database.con.transaction("r!", window.KC3Database.con.tables ,function(){
					trz = Dexie.currentTransaction;
					alert("Saving data...this might take few seconds to finish.");
					window.KC3Database.con.tables.forEach( //access all tables
						function(table){
							table.toArray(function(tablearray) { //add table data tmptext
									console.info("loading "+table.name);
									fullDBData[table.name] = tablearray;
									console.info("done loading "+table.name);
							});
					});//foreach
				}).then(function(){
					//alert(JSON.stringify(fullDBData));
				});//transaction
				fullStorageData = JSON.stringify({
					config: JSON.parse(localStorage.config || "{}"),
					fleets: JSON.parse(localStorage.fleets || "{}"),
					gears: JSON.parse(localStorage.gears || "{}"),
					//maps: JSON.parse(localStorage.maps || "{}"),
					player: JSON.parse(localStorage.player || "{}"),
					//quests: JSON.parse(localStorage.quests || "{}"),
					ships: JSON.parse(localStorage.ships || "{}"),
					//statistics: JSON.parse(localStorage.statistics || "{}")
				});//fullStorageData

				setTimeout(function() {
						var count=0;
						while(trz.active){
							count++;
							window.KC3DataBackup.sleep(100);
						}
						console.info((count/10.0)+" sec. to finish data transaction");
						console.info("fulldbdata to string to zip");
						zip.file("db.json",JSON.stringify(fullDBData));
						console.info("fulldbdata to string to zip");
						zip.file("storage.json",fullStorageData);
					  var href= "data:application/zip;base64," + zip.generate({type:"base64"});
						chrome.downloads.download({
							url: href,
							filename: ConfigManager.ss_directory+'/Backup/'+
							"["+PlayerManager.hq.name+"] "+
							dateFormat("yyyy-mm-dd")+".kc3data",
							conflictAction: "uniquify"
						}, function(downloadId){
						});

				}, 1);//setTimeout

			},//savedata
			processDB : function(dbstring,overwrite){
				var dbdata = JSON.parse(dbstring);
				$.each(dbdata, function (index, tabledata) {
					//alert(index+"="+JSON.stringify(tabledata));
					var table = window.KC3Database.con.table(index);
					window.KC3Database.con.transaction("r!", table ,function(){
						//asnyc db sync function.
						if(overwrite)
							{
								table.clear();
								table.add(tabledata);
							}
						else
							switch(index)
							{
								case "account":
								case "newsfeed":
								case "navaloverall":
									break;
								default:
									table.add(tabledata);
							}
						}).then(function(){
							table.orderBy("hour");
						});//transaction, finally
				});

			},//processDB
			processStorage(importedDataString){
				var importedData = JSON.parse(importedDataString);
				localStorage.config = JSON.stringify(importedData.config);
				localStorage.fleets = JSON.stringify(importedData.fleets);
				localStorage.gears = JSON.stringify(importedData.gears);
				localStorage.player = JSON.stringify(importedData.player);
				localStorage.ships = JSON.stringify(importedData.ships);
			},

			loadData : function(file_,overwrite){
				var zip;
				var reader = new FileReader();

				// Closure to capture the file information.
				reader.onload = (function(e) {
							// read the content of the file with JSZip
							zip = new JSZip(e.target.result);
							alert(zip);
							$.each(zip.files, function (index, zipEntry) {
								switch (zipEntry.name) {
									case "db.json":
										window.KC3DataBackup.processDB(zipEntry.asText(),overwrite);
										break;
									case "storage.json":
										if(overwrite)
											window.KC3DataBackup.processStorage(zipEntry.asText());
										break;
									default:
										alert("could be wrong file");

									}//swich: zip name
								});//file acces foreach
							// end of the magic

				});//reader.onload
				reader.readAsArrayBuffer(file_);
			},//loaddata
				sleep : function(milliseconds) {
					var start = new Date().getTime();
				  for (var i = 0; i < 1e7; i++) {
				    if ((new Date().getTime() - start) > milliseconds){
				      break;
				    }
				  }
			}


	}

})();
