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

			loadData : function(file_){
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
										//asnyc db sync function.
										//table.clear()
										//db.table.add({name: "Josephine", age: 21});
										//db.table(storeName)
										break;
									case "storage.json":
										alert("storage detected!");
										break;
									default:
										alert("could be wrong file");

									}//swich for zip name
								});//file acces foreach
							// end of the magic

				});//reader.onload
				try{
					reader.readAsArrayBuffer(file_);
				}catch(e){alert(e);}
			}//loaddata


	};

})();
