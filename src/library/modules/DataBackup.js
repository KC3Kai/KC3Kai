(function(){
	"use strict";

	window.KC3DataBackup = {
			saveData : function(){//Save All Data to file
				var fullDBData={};
				var locked=false;
				var fullStorageData="";
				var zip = new JSZip();
				var trzfinished=false;


				window.KC3Database.con.transaction("r", window.KC3Database.con.tables
				,function(){
					console.info("transaction started");
					window.KC3Database.con.tables.forEach( //access all tables
						function(table){
							table.toArray(function(tablearray) { //add table data tmptext
									while(locked){}
									locked = true;
									fullDBData[table.name] = tablearray;
									locked = false;
							});
					});//foreach
				}).then(function(){
					trzfinished = true;
				});//transaction


				console.info("with");
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
						console.info("you");
						while(!trzfinished){
							window.KC3DataBackup.sleep(100);
							count++;
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
				console.info("EOF");
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
