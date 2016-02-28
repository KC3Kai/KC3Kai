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
				var tablecnt=0, tableprocessed=0;
				$.each(dbdata, function (index, tabledata)
					{tablecnt++;})
				$.each(dbdata, function (index, tabledata) {
					//alert(index+"="+JSON.stringify(tabledata));
					var table = window.KC3Database.con.table(index);
					window.KC3Database.con.transaction("rw!", table ,function(){
						tableprocessed+=1;
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
						});//transaction
						console.info("processing "+table.name + " " + tableprocessed + "/" + tablecnt );
				});//each
			},//processDB

			processStorage: function(importedDataString){
				var data = JSON.parse(importedDataString);
				$.each(data, function(index,access){
					console.log("local "+index+JSON.stringify(access));
					localStorage[index]=JSON.stringify(access);
				});
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
										if(overwrite)
												window.KC3DataBackup.processStorage(zipEntry.asText());
										break;
									default:
										alert("could be wrong file");

									}//swich: zip name
								});//file acces foreach
								alert("finished!");
				});//reader.onload
				reader.readAsArrayBuffer(file_);
			}//loadData
	};
})();
