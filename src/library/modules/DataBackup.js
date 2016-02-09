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
									fullDBData[table.name] = tablearray;
							});
					});//foreach
				}).then(function(){
					//alert(JSON.stringify(fullDBData));
				});//transaction
				fullStorageData = JSON.stringify({
					absoluteswf: localStorage.absoluteswf,
					config: JSON.parse(localStorage.config),
					fleets: JSON.parse(localStorage.fleets),
					gears: JSON.parse(localStorage.gears),
					lastResource:localStorage.lastResource,
					lastUseitem: localStorage.lastUseitem,
					maps: JSON.parse(localStorage.maps),
					player: JSON.parse(localStorage.player),
					quests: JSON.parse(localStorage.quests),
					ships: JSON.parse(localStorage.ships),
					statistics: JSON.parse(localStorage.statistics)
				});//fullStorageData

				setTimeout(function() {
						while(trz.active){}
						zip.file("db.json",JSON.stringify(fullDBData));
						zip.file("storage.json",fullStorageData);
						saveAs(
								zip.generate({type:"blob"}),
								"["+PlayerManager.hq.name+"] "+
								dateFormat("yyyy-mm-dd")+".kc3data"
							);//saveas
				}, 3000);//setTimeout

			},//savedata
			processDB : function(dbstring,overwrite){
				var dbdata = JSON.parse(dbstring);
				$.each(dbdata, function (index, tabledata) {
					//alert(index+"="+JSON.stringify(tabledata));
					var table = window.KC3Database.con.(index);
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
								"account":
								"newsfeed":
								"navaloverall":
									break;
								default:
									table.add(tabledata);
							}
						}).finally{
							table.orderBy("hour");
						};//transaction, finally
				});

			},//processDB
			processStorage(importedDataString){
				var importedData = JSON.parse(importedDataString);
				localStorage.absoluteswf = importedData.absoluteswf;
				localStorage.config = JSON.stringify(importedData.config);
				localStorage.fleets = JSON.stringify(importedData.fleets);
				localStorage.gears = JSON.stringify(importedData.gears);
				localStorage.lastResource = importedData.lastResource;
				localStorage.lastUseitem = importedData.lastUseitem;
				localStorage.maps = JSON.stringify(importedData.maps);
				localStorage.player = JSON.stringify(importedData.player);
				localStorage.quests = JSON.stringify(importedData.quests);
				localStorage.ships = JSON.stringify(importedData.ships);
				localStorage.statistics = JSON.stringify(importedData.statistics);
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
											processStorage(zipEntry.asText());
										break;
									default:
										alert("could be wrong file");

									}//swich: zip name
								});//file acces foreach
							// end of the magic

				});//reader.onload
				reader.readAsArrayBuffer(file_);
			}//loaddata


	};

})();
