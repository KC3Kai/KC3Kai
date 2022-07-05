(function(){
	"use strict";

	const DBExportBatchSize = 5000;

	window.KC3DataBackup = {
			saveData : function(elementkey,callback){//Save All Data to file, elementkey can be null
				var fullDBData={};
				var locked=false;
				var fullStorageData={};
				var zip = new JSZip();
				var ekex = ((typeof elementkey)==="string");//true if elementkey exists, false if not

				if(ekex)$(elementkey).append("Exporting Data...(0/3)");
				for(var i=0;i<localStorage.length;i++)
				{
					var name = localStorage.key(i);
					fullStorageData[name] = localStorage.getItem(name);
				}

				KC3Database.con.transaction("r", KC3Database.con.tables, function(){
					if(ekex)$(elementkey).append("<div>Loading Data to array...(1/4)<div/>");
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
					if(ekex)$(elementkey).append("<div>Loading Data to zip...(2/4)<div/>");
					zip.file("db.json",JSON.stringify(fullDBData));
					zip.file("storage.json",JSON.stringify(fullStorageData));

					if(ekex)$(elementkey).append("<div>Compressing zip....(3/4)<div/>");
					var objurl= URL.createObjectURL(zip.generate({type:"blob", compression: "DEFLATE"}));

					if(ekex)$(elementkey).append("<div>Downloading zip....(4/4)<div/>");
					console.info("Downloading file to", ConfigManager.ss_directory + "/Backup/");

					const zipFilename = (
						ConfigManager.ss_directory.toSafeFilename(undefined, true) +
						'/Backup/' +
						("[" + PlayerManager.hq.name + "] " +
							dateFormat("yyyy-mm-dd")).toSafeFilename() +
						".kc3data"
					);
					// Since Chromium version m72, expected filename must be suggested on later phase,
					// Since Chromium version m78, extention name is forced by MIME type, `.kc3data` will be ingored.
					var downloadItemId = null;
					const onetimeFilenameSuggester = function(item, suggest) {
						if(item.byExtensionId === chrome.runtime.id && item.id === downloadItemId) {
							suggest({filename: zipFilename, conflictAction: "uniquify"});
							chrome.downloads.onDeterminingFilename.removeListener(onetimeFilenameSuggester);
						}
					};
					chrome.downloads.onDeterminingFilename.removeListener(onetimeFilenameSuggester);
					chrome.downloads.onDeterminingFilename.addListener(onetimeFilenameSuggester);
					chrome.downloads.download({
						url: objurl,
						filename: zipFilename,
						conflictAction: "uniquify"
					}, function(downloadId){
						downloadItemId = downloadId;
					});
					callback();
				});//transaction

			},//savedata


			processDB : function(dbstring,overwrite,elementkey,callback){//load data from DB string, elementkey can be null
				var ekex = ((typeof elementkey)==="string");
				var dbdata = JSON.parse(dbstring);
				if(ekex)$(elementkey).text("");
				var processTables = function(dbdata_, overwrite){
					var dothing = function(){
						var tableCount = -1;
						if(!!overwrite){
							KC3Database.con.close();
							KC3Database.clear(function(){
								console.log("Cleaned up old database...");
							});
						}
						console.log("Processing tables...");
						KC3Database.init();
						KC3Database.con.open();
						if(ekex)$(elementkey).append("<div class =\"datatransaction\">-DB Transaction Started-</div>");
						var alertwhenfinished = function() {
								setTimeout(function() {
									if(tableCount===0)  callback();
									else alertwhenfinished();
								},1000);
							};
						alertwhenfinished();

						$.each(dbdata_,function(index,tabledata) {
							if(ekex)$(elementkey).append("<div class = \""+index+"\">Table queued : "+index+" 『size : "+tabledata.length+"』</div>");
						});
						var arrEach = function(tableobj){
							var index = Object.keys(tableobj)[0];
							var tabledata = tableobj[index];
							var table = KC3Database.con[index];
							KC3Database.con.transaction("rw!",table,function(){
								console.log("Processing "+index, table, "size:", tabledata.length);
								if(ekex)$(elementkey+" ."+index).text("Processing "+index+" 『size : "+tabledata.length+"』");

								if(tableCount == -1)tableCount=1;
								else tableCount++;

								//table.clear();
								tabledata.forEach(function(record)
								{
									var id = record.id;
									if(["enemy", "encounters"].indexOf(index) == -1){
										delete record.id;
									}
									table.add(record);
								});

							}).then(function(){
								if(ekex)$(elementkey+" ."+index).text("Processed "+index);
							}).catch(console.error).finally(function(){tableCount--;delete tableobj[index];arrEach(tableobj);});
						};//arreach
						arrEach(dbdata_);
						if(ekex)$(elementkey+" .datatransaction").text("=DB transaction all queued=");
					};//dothinh
				  dothing();

				};//processTables
				processTables(dbdata, !!overwrite);
			},//processDB

			processStorage: function(importedDataString, overwrite){
				if(!!overwrite){
					localStorage.clear();
				}
				var data = JSON.parse(importedDataString);
				$.each(data, function(index,access){
					localStorage[index]=access;
				});
				console.info("Done processing storage");
			},//processStorage

			loadData : function(file_,overwrite,elementkey,callback){
				var ekex = ((typeof elementkey)==="string");
				var zip;
				var reader = new FileReader();
				reader.onload = (function(e) {
							// read the content of the file with JSZip
							zip = new JSZip(e.target.result);
							$.each(zip.files, function (index, zipEntry) {
								switch (zipEntry.name) {
									case "db.json":
										console.info("db.json detected.");
										setTimeout(function(){
											KC3DataBackup.processDB(zipEntry.asText(),overwrite,elementkey,callback);
										},0);
										break;
									case "storage.json":
										console.info("storage.json detected.");
										if(overwrite)
												setTimeout(function() {
													if(ekex)$(elementkey).append("<div class =\"localstorageprocess\">-storage processing-</div>");
													window.KC3DataBackup.processStorage(zipEntry.asText(),overwrite);
													if(ekex)$(elementkey+" .localstorageprocess").text("=storage processed=");
												},10);
										break;
									default:
										alert("Could be wrong file");

									}//swich: zip name
								});//file acces foreach
				});//reader.onload
				reader.readAsArrayBuffer(file_);
			},//loadData

			saveDataToFolder : function(elementkey, callback, incremental=false) {

				if (navigator.chromeVersion < 86) {
					alert("This feature is only supported on Chrome v86 and later");
					return;
				}

				var ekex = ((typeof elementkey)==="string");//true if elementkey exists, false if not
				const progress = {};
				let finished = false;
				const initialPromises = [];
				let writableOptions = {};

				// Fill progress bar for ekex
				initialPromises.push(Promise.all(KC3Database.con.tables.map(table =>
					table.count().then(count =>
						progress[table.name] = [0, count]))
					).then(() => {
						if(ekex){
							for (let index in progress) {
								const prog = progress[index];
								$(elementkey).append(
									`<div class = \"${index}\">${index}}] queued : 『0/${prog[1]}』</div>`);
							}

							var alertwhenfinished = function() {

								for (let index in progress) {
									const prog = progress[index];
									if(ekex)$(elementkey+" ."+index).text(`${index} : 『${prog[0]}/${prog[1]}』`);
								}
			
								setTimeout(function() {
									if(finished)  callback();
									else alertwhenfinished();
								},1000);
							};
							alertwhenfinished();
						}
					}));

				// Start readonly transaction
				KC3Database.con.transaction("r", KC3Database.con.tables, () => 
					// Let user pick folder to dump DB data
					window.showDirectoryPicker().then(dhandle => {
						dhandle.requestPermission({ readwrite: true });

						// Open json file keeping entry offset
						if (incremental) {
							writableOptions = { keepExistingData: true };
							initialPromises.push(dhandle.getFileHandle('database.json')
							.then(fhandle => fhandle.getFile()
							.then(file => file.text()
							.then(text => {
								const tableOffset = JSON.parse(text);
								for (let index in tableOffset) {
									// Update existing backup entry count
									progress[index][0] = tableOffset[index];
								}
							}))));
						}

						// Localstorage data handler
						const storagePromise = dhandle.getFileHandle(`storage.json`, { create: true }).then(fhandle =>
							fhandle.createWritable().then(stream => {
								const fullStorageData = {};
								for(var i=0;i<localStorage.length;i++)
								{
									var name = localStorage.key(i);
									fullStorageData[name] = localStorage.getItem(name);
								}
								return stream.write(JSON.stringify(fullStorageData)).then(() => {
									if(ekex)$(elementkey).append("<div class =\"localstorageprocess\">LS complete</div>");
									return stream.close();
								});
							})
						);

						// Map each DB table to start iteration/export
						return Promise.all(initialPromises).then(() => Promise.all(KC3Database.con.tables.map((table) => {

							// Create/Append file stream for each table
							return dhandle.getFileHandle(`${table.name}.kc3data`, { create: true }).then(fhandle => 
								fhandle.createWritable(writableOptions)
								.then(stream => {

									// Move writestream to EOF if needed
									let setup = 1;
									if (incremental) {
										setup = fhandle.getFile().then(file => stream.seek(file.size));
									}
									const initialOffset = progress[table.name][0];
									const lastEntry = progress[table.name][1];

									// Iterate over DB in batches to save memory
									// TODO: Determine a good number for the batch size count
									const f = offset => {
										if (offset >= lastEntry) {
											return true;
										}

										return table.offset(offset).limit(DBExportBatchSize).toArray(arr =>
											// Write each entry into stream
											Promise.all(arr.map(entry => stream.write(JSON.stringify(entry) + "\n")
												.then(() => progress[table.name][0] += 1))))
											.then(() => f(offset + DBExportBatchSize));
									};
									// Resolve all DB search and write operations, then close stream
									return Promise.resolve(setup)
										.then(() => Promise.resolve(f(initialOffset))
										.then(() => stream.close()));
								})
							);
						}))).then(() => {
							// Resolve localstorage dump promise
							storagePromise
							.then(() =>
								// Write exported entry count per table
								dhandle.getFileHandle('database.json', { create: true })
								.then(fhandle => fhandle.createWritable()
								.then(stream => {
									const offset = {};
									for (let index in progress) {
										offset[index] = progress[index][0];
									}
									return stream.write(JSON.stringify(offset))
									.then(() => stream.close().then(() => finished = true));
								}))
							);
						}, () => {
							alert("Export failed");
						});
					})
				);
			},//saveDataToFolder

			loadDataFromFolder: function(elementkey, callback) {

				if (navigator.chromeVersion < 86) {
					alert("This feature is only supported on Chrome v86 and later");
					return;
				}

				var ekex = ((typeof elementkey)==="string");
				const files = KC3Database.con.tables.map(table => `${table.name}.kc3data`);
				files.push("storage.json");
				let finished = false;
				const progress = {};
				const utf8Decoder = new TextDecoder("utf-8");

				// Write progress messages and callback
				if(ekex) {
					$(elementkey).append("<div class =\"datatransaction\">-DB Transaction Started-</div>");
					KC3Database.con.tables.forEach(table => {
						progress[table.name] = [0, 0];
						$(elementkey).append(`<div class = \"${table.name}\">${table.name} : Loading data </div>`);
					});

					var alertwhenfinished = function() {

						for (let index in progress) {
							const prog = progress[index];
							if(ekex)$(elementkey+" ."+index).text(`${index} : 『${prog[0]}/${prog[1]}』`);
						}
						
						setTimeout(function() {
							if(finished) callback();
							else alertwhenfinished();
						},1000);
					};
					alertwhenfinished();
				}

				window.showDirectoryPicker().then(dhandle => {
					dhandle.requestPermission({ read: true });
					// Check if all files are present in dir
					Promise.all(files.map(filename => dhandle.getFileHandle(filename))).then(
						() => {
							dhandle.getFileHandle("storage.json").then(fh =>
								fh.getFile().then(file =>
									file.text().then(text => {
										window.KC3DataBackup.processStorage(text);
										if(ekex)$(elementkey).append("<div>LS Transfer Complete<div/>");
									}
									)
								)
							);
							// Clean and re-init DB
							KC3Database.con.close();
							KC3Database.clear(function(){
								console.log("Cleaned up old database...");
							});
							console.log("Processing tables...");
							KC3Database.init();
							KC3Database.con.open();


							return Promise.all(KC3Database.con.tables.map(table => 
								KC3Database.con.transaction("rw!",table,function(){
									return dhandle.getFileHandle(`${table.name}.kc3data`).then(fhandle =>
										fhandle.getFile().then((file) => {
											
											let reader = file.stream().getReader();
											let re = /\r\n|\n|\r/gm;
											let remainder = "";
											let startIndex = 0;
											
											/** File streaming process
											 * 
											 * 	1) Read a chunk of bytes from the file
											 * 	2) Decode and add the bytes into a buffer
											 * 	3) Check if a new line delimiter exists in the buffer
											 * 	4) If the delimiter exists, slice the buffer
											 *  5) If the buffer slice is not empty, add the slice into the DB
											 * 	6) If the slice is empty, we have reached the end-of-file and can exit
											 * 	7) If no delimiter exists, exit if there is no remaining bytes in the file to be read
											 *  8) Goto 1
											 */

											const f = (chunk, done) => {

												// Promise array for adding entries for current chunk
												const currentBatch = [];

												// Add new data from file into buffer
												remainder = remainder.substr(startIndex);
												chunk = chunk ? utf8Decoder.decode(chunk, {stream: true}) : "";
												remainder += chunk;
												// Search buffer for the newline delimiter
												let result = re.exec(remainder);

												
												// If there is no current match, we reset the starting index
												if (!result) {
													startIndex = re.lastIndex = 0;

													// If there is no current match and we are done with file reading, exit
													if (done) {
														return true;
													}
												}
												
												// Process the line if there is a matched newline
												// Usually there is multiple lines pulled in one go, so process all of them at once
												while (!!result) {
													
													// Substring line from current buffer
													const line = remainder.substr(startIndex, result.index);
													
													// Advance buffer position
													startIndex = re.lastIndex;
													remainder = remainder.substr(startIndex);
													startIndex = re.lastIndex = 0;

													// Parse the buffer into an object and add it into the DB
													if (line != "") {
														progress[table.name][1] += 1;
														try {
															let record = JSON.parse(line);
															if(["enemy", "encounters"].indexOf(table.name) == -1){
																delete record.id;
															}
															currentBatch.push(table.add(record).then(() => progress[table.name][0] += 1 ));
														}
														catch (error) {
															console.error(error);
															// Add error handling here
															return false;
														}

													// If the line is empty, we have reached the end of file
													} else if (line == "") { // EOF
														return true;
													}

													result = re.exec(remainder);
												}

												// If there are still lines in the buffer or data in the file, continue
												// Resolve current batch of entries before reading next batch of file data
												return Promise.all(currentBatch).then(() => reader.read().then(({value, done}) => f(value, done)));
												
											};
											return reader.read().then(({value, done}) => f(value, done));
										})
									)
								})
							))
						},
						() => alert("Missing files, aborting import")
					).then(() => finished = true)

					
				});								
			}//loadDataFromFolder
			
	};
})();
