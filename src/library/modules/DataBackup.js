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

				KC3Database.con.transaction("r", KC3Database.con.tables, function(){
					console.info("transaction started");
					KC3Database.con.tables.forEach( //access all tables
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
					var dothing = function(){
						var tableCount = -1;
						console.log("processing tables...");
						KC3Database.con.open();
						var alertwhenfinished = function() {
								setTimeout(function()
								{
									if(tableCount==0)alert("finished!");
									else alertwhenfinished();
								}
						,1000)};
						alertwhenfinished();

						$.each(dbdata_,function(index,tabledata) {
							var table = KC3Database.con[index];
							KC3Database.con.transaction("rw!",table,function(){
								console.log("processing "+index);
								if(tableCount == -1)tableCount=1;
								else tableCount++;
								table.clear();
								tabledata.forEach(function(record)
								{
									var id = record.id;
									delete record.id;
									table.add(record,id);
								});
								//console.log("processed " + index);
							}).then(function(){
								console.log("processed " + index);
							}).catch(alert).finally(function(){tableCount--;});
						});//each
					};//dothinh
				  dothing();

				};//processTables
				if(overwrite)
					processTables(dbdata);

				else processTables(dbdata);
			},//processDB

			processStorage: function(importedDataString){
				var data = JSON.parse(importedDataString);
				$.each(data, function(index,access){
					localStorage[index]=access;
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
										KC3DataBackup.processDB(zipEntry.asText(),overwrite);
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
