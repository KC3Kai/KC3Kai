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
					alert("Acessing db...this might take few seconds.");
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

			loadData : function(file){
				var reader = new FileReader();

				// Closure to capture the file information.
				reader.onload = (function(theFile) {
					return function(e) {
						try {
							// read the content of the file with JSZip
							var zip = new JSZip(e.target.result);
							// that, or a good ol' for(var entryName in zip.files)
							zip.files.foreach(function (zipEntry) {
								switch (zipEntry.name) {
									case "db.json":
										alert("db detected!");
										break;
									case "storage.json":
										alert("storage detected!");
										break;
									default:
										alert("could be wrong file");
								}
								// the content is here : zipEntry.asText()
							});
							// end of the magic !
						} catch(e) {
							alert(JSON.stringify({
								"class" : "alert alert-danger",
								text : "Error reading " + theFile.name + " : " + e.message
							})
							);//alert
					 	}//try/catch
						$result.append($fileContent);
					}
				});//reader.onload

			}//loaddata


	};

})();
