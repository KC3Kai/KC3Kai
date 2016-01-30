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
			loadData : function(data){
				
			}//loaddata


	}


})();