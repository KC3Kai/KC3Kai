(function(){
	"use strict";

	window.KC3DataBackup = {
			saveData : function(){//Save All Data to file
				var fullDBData={};
				var locked=false;
				var fullStorageData={};
				var zip = new JSZip();

				for(var i=0;i<localStorage.length;i++)
				{
					var name = localStorage.key(i);
					fullStorageData[name] = localStorage.getItem(name);
				}

				window.KC3Database.con.transaction("r", window.KC3Database.con.tables, function(){
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
				}).then(function(){//for transaction
					console.info("end of transaction");
					zip.file("db.json",JSON.stringify(fullDBData));
					zip.file("storage.json",JSON.stringify(fullStorageData));
					console.info("data all on zip class");

					var objurl= URL.createObjectURL(zip.generate({type:"blob"}));

					console.info("downloading file to "+ConfigManager.ss_directory+'/Backup/');

					chrome.downloads.download({
						url: objurl,
						filename: ConfigManager.ss_directory+'/Backup/'+
						"["+PlayerManager.hq.name+"] "+
						dateFormat("yyyy-mm-dd")+".kc3data",
						conflictAction: "uniquify"
					}, function(downloadId){
					});
				});//transaction

			},//savedata


			processDB : function(dbstring,overwrite){

				var dbdata = JSON.parse(dbstring);

				var processTables = function(dbdata_){
							console.log("processing tables...");
							$.each(dbdata_,function(index,tabledata) {
								console.log("processing "+index);
								var table = window.KC3Database.con[index];
								if(overwrite)
									{
										table.add(tabledata).catch(e)(console.log(e));
										console.log("processed " + index);
										console.log(tabledata);
									}
								else{
									switch(index)
									{
										case "account": case "newsfeed": case "navaloverall":
											break;
										default:
											table.add(tabledata);
											console.log("processed " + index);
									}
								}
							});//each
							console.log("processed tables");
				};//processTables
				if(overwrite)
				window.KC3Database.con.delete().then(function(){
					processTables(dbdata);
				});//delete callback
				else processTables(dbdata);
			},//processDB

			processStorage: function(importedDataString){
				var data = JSON.parse(importedDataString);
				$.each(data, function(index,access){
					localStorage[index]=JSON.stringify(access);
				});
				console.info("done processing storage");
			},//processStorage

			loadData : function(file_,overwrite){
				var zip;
				var reader = new FileReader();
				reader.onload = (function(e) {
							// read the content of the file with JSZip
							zip = new JSZip(e.target.result);
							$.each(zip.files, function (index, zipEntry) {
								switch (zipEntry.name) {
									case "db.json":
										console.info("db.json detected.");
										window.KC3DataBackup.processDB(zipEntry.asText(),overwrite);
										break;
									case "storage.json":
										console.info("storage.json detected.");
										if(overwrite)
												setTimeout(function()
												{window.KC3DataBackup.processStorage(zipEntry.asText());}
												,10);
										break;
									default:
										alert("could be wrong file");

									}//swich: zip name
								});//file acces foreach
				});//reader.onload
				reader.readAsArrayBuffer(file_);
			}//loadData
	};
})();
