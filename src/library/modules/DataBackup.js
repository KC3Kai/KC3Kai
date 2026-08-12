(function(){
	"use strict";

	const DBExportBatchSize = 5000;
	const DBImportBatchSize = 2000;

	const requiresFullTableExport = tableName => ["enemy", "encounters"].includes(tableName);
	const chunkArray = (arr, size) => {
		const chunks = [];
		for (let i = 0; i < arr.length; i += size) {
			chunks.push(arr.slice(i, i + size));
		}
		return chunks;
	};

	window.KC3DataBackup = {
		saveData : function(elementkey,callback){//Save All Data to file, elementkey can be null
			var fullDBData={};
			var locked=false;
			var fullStorageData={};
			var zip = new JSZip();
			var ekex = ((typeof elementkey)==="string");//true if elementkey exists, false if not

			if(ekex) $(elementkey).html("<div>-Exporting Data Started-</div>");
			for(var i=0;i<localStorage.length;i++)
			{
				var name = localStorage.key(i);
				fullStorageData[name] = localStorage.getItem(name);
			}

			KC3Database.con.transaction("r", KC3Database.con.tables, function(){
				if(ekex)$(elementkey).append("<div>Loading Data to array...(1/4)</div>");
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
				if(ekex)$(elementkey).append("<div>Loading Data to zip...(2/4)</div>");
				zip.file("db.json",JSON.stringify(fullDBData));
				zip.file("storage.json",JSON.stringify(fullStorageData));

				if(ekex)$(elementkey).append("<div>Compressing zip....(3/4)</div>");
				var objurl= URL.createObjectURL(zip.generate({type:"blob", compression: "DEFLATE"}));

				if(ekex)$(elementkey).append("<div>Downloading zip....(4/4)</div>");
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
			if(ekex)$(elementkey).html("");
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

		/**
		 * Import database tables from JSON string using chunked bulkAdd.
		 * Faster alternative to `processDB` for large datasets.
		 *
		 * @param {string} dbstring - JSON string of table data (keyed by table name)
		 * @param {boolean} overwrite - if true, clear IndexedDB before import
		 * @param {string|jQuery} elementkey - progress display selector or jQuery object, null to skip
		 * @param {function} callback - called when all tables are processed
		 */
		processDB_2: function (dbstring, overwrite, elementkey, callback) {
			console.time("processDB:total");
			const ekex = (typeof elementkey === "string");
			const dbdata = JSON.parse(dbstring);
			if (ekex) $(elementkey).html("");

			const processTables = (dbdata_, overwrite) => {
				const init = overwrite
					? new Dexie.Promise(resolve => {
						KC3Database.con.close();
						KC3Database.clear(() => {
							console.log("Cleaned up old database...");
							resolve();
						});
					})
					: Dexie.Promise.resolve();

				init
					.then(() => {
						console.log("Processing tables...");
						KC3Database.init();
						KC3Database.con.open();
						if (ekex) $(elementkey).append("<div class=\"datatransaction\">-DB Transaction Started-</div>");

						for (const index of Object.keys(dbdata_)) {
							const tabledata = dbdata_[index];
							if (ekex) $(elementkey).append("<div class=\"" + index + "\">Table queued : " + index + " 『size : " + tabledata.length + "』</div>");
						}

						if (ekex) $(elementkey + " .datatransaction").text("=DB transaction all queued=");

						return Object.keys(dbdata_).reduce(
							(prev, tableName) => prev.then(() => {
								const tabledata = dbdata_[tableName];
								const table = KC3Database.con[tableName];
								if (!table) {
									console.warn("Table not found in schema, skipping:", tableName);
									return Dexie.Promise.resolve();
								}

								console.log("Processing " + tableName, "size:", tabledata.length);
								if (ekex) $(elementkey + " ." + tableName).text("Processing " + tableName + " 『size : " + tabledata.length + "』");

								console.time("processDB:table:" + tableName + ":map+chunk");
								const records = tabledata.map(record => {
									const clean = Object.assign({}, record);
									if (["enemy", "encounters"].indexOf(tableName) === -1) {
										delete clean.id;
									}
									return clean;
								});
								const chunks = chunkArray(records, DBImportBatchSize);
								console.timeEnd("processDB:table:" + tableName + ":map+chunk");

								console.time("processDB:table:" + tableName + ":bulkAdd");
								return chunks
									.reduce(
										(p, chunk, i) => p.then(() => table.bulkAdd(chunk).then(res => {
											console.debug(`[${tableName}]`, 'bulkAdd', chunk.length, (i * DBImportBatchSize) + chunk.length);
											return res;
										})),
										Dexie.Promise.resolve()
									)
									.then(() => {
										console.timeEnd("processDB:table:" + tableName + ":bulkAdd");
										if (ekex) $(elementkey + " ." + tableName).text("Processed " + tableName);
									});
							}),
							Dexie.Promise.resolve()
						);
					})
					.then(() => {
						console.timeEnd("processDB:total");
						callback();
					})
					.catch((error) => {
						console.error(error.message);
						alert(error.message);
					});
			};

			processTables(dbdata, !!overwrite);
		},

		processStorage: function(importedDataString, overwrite){
			console.time('processStorage');
			if(!!overwrite){
				localStorage.clear();
			}
			var data = JSON.parse(importedDataString);
			$.each(data, function(index,access){
				localStorage[index]=access;
			});
			console.timeEnd('processStorage');
			console.info("Done processing storage");
		},//processStorage

		loadData : function(file_, overwrite, elementkey, callback, version = 1) {
			const ekex = ((typeof elementkey) === "string");
			const processDB = version >= 2
				? KC3DataBackup.processDB_2
				: KC3DataBackup.processDB;
			let zip;
			const reader = new FileReader();
			reader.onload = (function (e) {
				// read the content of the file with JSZip
				zip = new JSZip(e.target.result);
				$.each(zip.files, function (index, zipEntry) {
					switch (zipEntry.name) {
						case "db.json":
							console.info("db.json detected.");
							setTimeout(function () {
								processDB(zipEntry.asText(), overwrite, elementkey, callback);
							}, 0);
							break;
						case "storage.json":
							console.info("storage.json detected.");
							if (overwrite)
								setTimeout(function () {
									if (ekex) $(elementkey).append("<div class =\"localstorageprocess\">-storage processing-</div>");
									window.KC3DataBackup.processStorage(zipEntry.asText(), overwrite);
									if (ekex) $(elementkey + " .localstorageprocess").text("=storage processed=");
								}, 10);
							break;
						default:
							alert("Could be wrong file");

					}//swich: zip name
				});//file acces foreach
			});//reader.onload
			reader.readAsArrayBuffer(file_);
		},//loadData

		// Backup v2 functions
		saveDataToFolder: function (elementkey, callback, incremental = false) {
			if (!window.showDirectoryPicker || navigator.chromeVersion < 86) {
				alert("This feature is only supported by Chrome 86 and later");
				callback(true);
				return;
			}

			// true if elementkey exists, false if not
			const ekex = $(elementkey).length > 0;
			if (ekex) $(elementkey).html(`<div>== Export Progress ==</div>`);

			const startTime = Date.now();
			const progress = {};
			let finished = false;
			let lastErrMsg = "";
			let writableOptions = {};

			const errorHandler = (err) => {
				finished = "error";
				// Do not log and alert on:
				// picker window aborted by user, or permission refused
				if (err && !["AbortError", "NotAllowedError"].includes(err.name)) {
					// for 'must handle user gesture to show a file picker'
					if ("SecurityError" === err.name) {
						alert(err + "\nJust try again.");
					} else {
						console.error("Export unexpectedly rejected", err);
						lastErrMsg = "Backup " + err;
						alert(lastErrMsg);
					}
				}
			};

			// Fill progress lines, and poll finished state to callback
			const updateProgress = () => {
				if (!ekex) return;
				for (let name in progress) {
					const prog = progress[name];
					$(`${elementkey} #${name}`).text(`${name} : 『${prog[0]}/${prog[1]}』`);
					if (prog[0] >= prog[1]) $(`${elementkey} #${name}`).addClass("complete");
				}
				$(`${elementkey} #_timer`).text(
					`Elapsed time : ${String((Date.now() - startTime) / 1000).toHHMMSS()}`
				);
			};
			const alertWhenFinished = () => {
				setTimeout(() => {
					updateProgress();
					if (finished) {
						if (finished === true) localStorage.lastBackupTime = Date.now();
						callback(!lastErrMsg && finished === "error", lastErrMsg);
					} else alertWhenFinished();
				}, 1000);
			};
			alertWhenFinished();

			const countsPromise = Promise.all(KC3Database.con.tables.map(table =>
				table.count()
					.then(count => {
						progress[table.name] = [0, count];
						if (ekex) $(elementkey).append(`<div id="${table.name}">${table.name} : 『0/${count}』</div>`);
					})
			))
				.then(() => {
					if (ekex) $(elementkey).append(`<div id="_timer">Elapsed time : 00:00:00</div>`);
				});

			console.time("saveData:total");
			// Let user pick folder to dump DB data into
			window.showDirectoryPicker()
				.then(dhandle => {
					dhandle.requestPermission({ readwrite: true });

					// Read existing offsets for incremental mode
					const offsetPromise = incremental
						? dhandle.getFileHandle('database.kc3data')
							.then(fhandle => fhandle.getFile())
							.then(file => file.text())
							.then(text => {
								const tableOffset = JSON.parse(text);
								for (let index in tableOffset) {
									progress[index][0] = requiresFullTableExport(index) ? 0 : tableOffset[index];
								}
							})
						: Dexie.Promise.resolve();

					// localStorage data handler
					const storagePromise = dhandle.getFileHandle(`storage.kc3data`, { create: true })
						.then(fhandle => fhandle.createWritable())
						.then(stream => {
							const fullStorageData = {};
							for (let i = 0; i < localStorage.length; i++) {
								const name = localStorage.key(i);
								fullStorageData[name] = localStorage.getItem(name);
							}
							return stream.write(JSON.stringify(fullStorageData))
								.then(() => {
									if (ekex) $(elementkey).append(`<div class="complete">localStorage complete</div>`);
									return stream.close();
								});
						});

					// Open json file keeping entry offset
					if (incremental) {
						writableOptions = { keepExistingData: true };
					}

					// 1. Keep file setup outside the database transaction
					return Promise.all([countsPromise, offsetPromise])
						.then(() => {
							// Map over tables outside the transaction
							return Promise.all(KC3Database.con.tables.map(_table => {
								const tableName = _table.name;
								console.time("saveData:table:" + tableName + ":total");

								// Set up your files first
								return dhandle.getFileHandle(`${tableName}.kc3data`, { create: true })
									.then(fhandle => Promise.all([
										fhandle,
										fhandle.createWritable(
											incremental && requiresFullTableExport(tableName) ? {} : writableOptions
										)
									]))
									.then(([fhandle, stream]) => {
										const setupPromise = (incremental && !requiresFullTableExport(tableName))
											? fhandle.getFile().then(file => stream.seek(file.size))
											: Promise.resolve();

										const initialOffset = progress[tableName][0];
										const lastEntry = progress[tableName][1];

										// The looping function
										const iterateTable = (offset) => {
											if (offset >= lastEntry) {
												return Promise.resolve();
											}

											// 2. Open a fresh, short-lived transaction ONLY for reading data
											return KC3Database.con.transaction("r", _table, () => {
												return KC3Database.con.table(tableName)
													.offset(offset)
													.limit(DBExportBatchSize)
													.toArray();
											})
												.then(arr => {
													// 3. Write to the stream OUTSIDE the transaction
													return Promise.all(
														arr.map(entry => stream.write(JSON.stringify(entry) + "\n")
															.then(() => { progress[tableName][0] += 1; })
														)
													);
												})
												// Move to the next batch
												.then(() => iterateTable(offset + DBExportBatchSize))
												.catch((err) => {
													console.warn("Error processing batch:", err.message);
													throw err;
												});
										};

										return setupPromise
											.then(() => iterateTable(initialOffset))
											.then(() => stream.close())
											.then(() => {
												console.timeEnd("saveData:table:" + tableName + ":total");
											});
									});
							}));
						})
						.then(() => storagePromise)
						.then(() => dhandle.getFileHandle('database.kc3data', { create: true }))
						.then(fhandle => fhandle.createWritable())
						.then(stream => {
							const offset = {};
							for (let index in progress) {
								offset[index] = progress[index][0];
							}
							return stream.write(JSON.stringify(offset))
								.then(() => stream.close());
						})
						.then(() => {
							finished = true;
							console.timeEnd("saveData:total");
							console.info(`Backup v2 exporting done (${incremental ? "incremental" : "full"})`);
						});
				})
				.catch(errorHandler);
		},

		loadDataFromFolder: function(elementkey, callback) {
			if (!window.showDirectoryPicker || navigator.chromeVersion < 86) {
				alert("This feature is only supported by Chrome 86 and later");
				callback(true);
				return;
			}

			const ekex = $(elementkey).length > 0;
			if (ekex) $(elementkey).html(`<div>== Import Progress ==</div>`);
			const startTime = Date.now();
			let finished = false;
			let lastErrMsg = "";
			const progress = {};
			const errorHandler = (err) => {
				finished = "error";
				// Do not log and alert on:
				// picker window aborted by user, or permission refused
				if (err && !["AbortError", "NotAllowedError"].includes(err.name)) {
					// for 'must handle user gesture to show a file picker'
					if ("SecurityError" === err.name) {
						alert(err + "\nJust try again.");
					} else {
						console.error("Import unexpectedly rejected", err);
						lastErrMsg = "Restore " + err;
						alert(lastErrMsg);
					}
				}
			};

			// Fill progress lines, and poll finished state to callback
			const updateProgress = () => {
				if (!ekex) return;
				for (let name in progress) {
					const prog = progress[name];
					if (prog[1] > -1) {
						progress[name][2].textContent = `${name} : 『${prog[0]}/${prog[1]}』`;
						if (prog[0] >= prog[1]) progress[name][2].classList.add("complete");
					}
				}
				$(`${elementkey} #_timer`).text(
					`Elapsed time : ${String((Date.now() - startTime) / 1000).toHHMMSS()}`
				);
			};
			const alertWhenFinished = () => {
				setTimeout(function() {
					updateProgress();
					if (finished) callback(!lastErrMsg && finished === "error", lastErrMsg);
					else alertWhenFinished();
				}, 1000);
			};
			alertWhenFinished();
			// Files of current known tables in IndexedDB: 17 + 2 extra meta files
			const files = KC3Database.con.tables.map(table => `${table.name}.kc3data`);
			files.push("storage.kc3data");
			files.push("database.kc3data");
			KC3Database.con.tables.forEach(table => {
				progress[table.name] = [0, -1];
				if (ekex) {
					$(elementkey).append(
						`<div id="${table.name}">${table.name} : Loading data </div>`
					);
					progress[table.name][2] = $(`${elementkey} #${table.name}`).get(0);
				}
			});
			if (ekex) $(elementkey).append(`<div id="_timer">Elapsed time : 00:00:00</div>`);

			window.showDirectoryPicker().then(dhandle => {
				dhandle.requestPermission({ read: true });
				// Check if all files are present in dir
				Promise.all(files.map(filename => dhandle.getFileHandle(filename))).then(() => {
					console.log("Processing localStorage...");
					dhandle.getFileHandle("storage.kc3data").then(fh =>
						fh.getFile().then(file =>
							file.text().then(text => {
								window.KC3DataBackup.processStorage(text);
								if(ekex) $(elementkey).append(`<div class="complete">localStorage complete</div>`);
							})
						)
					);
					// Clean and re-init DB
					KC3Database.con.close();
					KC3Database.clear(function(){
						console.log("Cleaned up old database...");
					});
					console.log("Processing DB tables...");
					KC3Database.init();
					KC3Database.con.open();

					dhandle.getFileHandle("database.kc3data").then(fh =>
						fh.getFile().then(file =>
							file.text().then(text => {
								const totalEntries = JSON.parse(text);
								for (let index in totalEntries) {
									progress[index][1] = totalEntries[index];
								}
							})
						)
					);

					return Promise.all(KC3Database.con.tables.map(table =>
						KC3Database.con.transaction("rw!", table, function(){
							const tableName = table.name;
							return dhandle.getFileHandle(`${tableName}.kc3data`).then(fhandle =>
								fhandle.getFile().then((file) => {
									const utf8Decoder = new window.TextDecoder("utf-8");
									let reader = file.stream().getReader();
									let re = /\r\n|\n|\r/gm;
									let remainder = "";
									let startIndex = 0;
									/**
									 * File streaming process:
									 *
									 *  1) Read a chunk of bytes from the file
									 *  2) Decode and add the bytes into a buffer
									 *  3) Check if a new line delimiter exists in the buffer
									 *  4) If the delimiter exists, slice the buffer
									 *  5) If the buffer slice is not empty, add the slice into the DB
									 *  6) If the slice is empty, we have reached the end-of-file and can exit
									 *  7) If no delimiter exists, exit if there is no remaining bytes in the file to be read
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
											if (line.length > 0) {
												try {
													let record = JSON.parse(line);
													if (!requiresFullTableExport(tableName)){
														// Remove inbound auto-sequenced primary key
														delete record.id;
													}
													currentBatch.push(table.add(record).then(() => progress[tableName][0] += 1 ));
												}
												catch (error) {
													console.warn(`Table ${tableName} parsing line failed`, line, error);
													// Add error handling here
													return false;
												}
											// If the line is empty, we have reached the end of file
											} else {
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
							);
						})
					)).then(() =>  {
						finished = true;
						console.info(`Backup v2 importing done`);
					}).catch(errorHandler);
				}).catch(errorHandler);
			}).catch(errorHandler);
		}, // loadDataFromFolder end

		/**
		 * Import DB and localStorage from a folder using the File System Access API.
		 * Uses chunked bulkAdd for faster table inserts compared to `loadDataFromFolder`.
		 * Mirrors the processDB_2 pattern.
		 *
		 * @param {string|jQuery} elementkey - progress display selector or jQuery object, null to skip
		 * @param {function} callback - called with (isError, errorMessage) when import completes
		 */
		loadDataFromFolder_2: function (elementkey, callback) {
			if (!window.showDirectoryPicker || navigator.chromeVersion < 86) {
				alert("This feature is only supported by Chrome 86 and later");
				callback(true);
				return;
			}

			const ekex = $(elementkey).length > 0;
			if (ekex) $(elementkey).html(`<div>== Import Progress ==</div>`);
			const startTime = Date.now();
			let finished = false;
			let lastErrMsg = "";
			const progress = {};
			const errorHandler = (err) => {
				finished = "error";
				// Do not log and alert on:
				// picker window aborted by user, or permission refused
				if (err && !["AbortError", "NotAllowedError"].includes(err.name)) {
					// for 'must handle user gesture to show a file picker'
					if ("SecurityError" === err.name) {
						alert(err + "\nJust try again.");
					} else {
						console.error("Import unexpectedly rejected", err);
						lastErrMsg = "Restore " + err;
						alert(lastErrMsg);
					}
				}
			};

			// Fill progress lines, and poll finished state to callback
			const updateProgress = () => {
				if (!ekex) return;
				for (let name in progress) {
					const prog = progress[name];
					if (prog[1] > -1) {
						progress[name][2].textContent = `${name} : 『${prog[0]}/${prog[1]}』`;
						if (prog[0] >= prog[1]) progress[name][2].classList.add("complete");
					}
				}
				$(`${elementkey} #_timer`).text(
					`Elapsed time : ${String((Date.now() - startTime) / 1000).toHHMMSS()}`
				);
			};
			const alertWhenFinished = () => {
				setTimeout(() => {
					updateProgress();
					if (finished) callback(!lastErrMsg && finished === "error", lastErrMsg);
					else alertWhenFinished();
				}, 1000);
			};
			alertWhenFinished();

			// Files of current known tables in IndexedDB: 17 + 2 extra meta files
			const files = KC3Database.con.tables.map(table => `${table.name}.kc3data`);
			files.push("storage.kc3data");
			files.push("database.kc3data");
			KC3Database.con.tables.forEach(table => {
				progress[table.name] = [0, -1];
				if (ekex) {
					$(elementkey).append(
						`<div id="${table.name}">${table.name} : Loading data </div>`
					);
					progress[table.name][2] = $(`${elementkey} #${table.name}`).get(0);
				}
			});
			if (ekex) $(elementkey).append(`<div id="_timer">Elapsed time : 00:00:00</div>`);

			console.time("loadData:total");
			window.showDirectoryPicker()
				.then(dhandle => {
					dhandle.requestPermission({ read: true });
					// Check if all files are present in dir
					return Promise.all(files.map(filename => dhandle.getFileHandle(filename)))
						.then(() => {
							console.log("Processing localStorage...");
							dhandle.getFileHandle("storage.kc3data")
								.then(fh => fh.getFile())
								.then(file => file.text())
								.then(text => {
									window.KC3DataBackup.processStorage(text);
									if (ekex) $(elementkey).append(`<div class="complete">localStorage complete</div>`);
								});

							// Clean and re-init DB
							KC3Database.con.close();
							KC3Database.clear(() => {
								console.log("Cleaned up old database...");
							});
							console.log("Processing DB tables...");
							KC3Database.init();
							KC3Database.con.open();

							dhandle.getFileHandle("database.kc3data")
								.then(fh => fh.getFile())
								.then(file => file.text())
								.then(text => {
									const totalEntries = JSON.parse(text);
									for (let index in totalEntries) {
										progress[index][1] = totalEntries[index];
									}
								});

							return Promise.all(KC3Database.con.tables.map(table => {
								const tableName = table.name;
								return dhandle.getFileHandle(`${tableName}.kc3data`)
									.then(fhandle => fhandle.getFile())
									.then((file) => {
										const logTableStart = () => {
											console.time("loadData:table:" + tableName + ":total");
										};
										const logTableEnd = () => {
											console.timeEnd("loadData:table:" + tableName + ":total");
										};

										logTableStart(); 

										const accumulator = [];
										let bulkChain = Dexie.Promise.resolve();

										const flushBatch = () => {
											if (accumulator.length === 0) {
												return bulkChain;
											}
											const batch = accumulator.splice(0, accumulator.length);
											bulkChain = bulkChain
												.then(() => table.bulkAdd(batch))
												.then(() => {
													progress[tableName][0] += batch.length;
													console.debug(`[${tableName}]`, 'bulkAdd', batch.length, progress[tableName][0]);
												});
											return bulkChain;
										};

										const utf8Decoder = new window.TextDecoder("utf-8");
										const reader = file.stream().getReader();
										const re = /\r\n|\n|\r/gm;
										let remainder = "";
										let startIndex = 0;

										/**
										 * File streaming process:
										 *
										 *  1) Read a chunk of bytes from the file
										 *  2) Decode and add the bytes into a buffer
										 *  3) Check if a new line delimiter exists in the buffer
										 *  4) If the delimiter exists, slice the buffer
										 *  5) If the buffer slice is not empty, add the record to accumulator
										 *  6) If accumulator reaches DBImportBatchSize, flush via bulkAdd
										 *  7) If the slice is empty, we have reached the end-of-file and exit
										 *  8) Goto 1
										 */
										const f = (chunk, done) => {
											// Add new data from file into buffer
											remainder = remainder.substr(startIndex);
											chunk = chunk ? utf8Decoder.decode(chunk, { stream: true }) : "";
											remainder += chunk;
											// Search buffer for the newline delimiter
											let result = re.exec(remainder);

											// If there is no current match, we reset the starting index
											if (!result) {
												startIndex = re.lastIndex = 0;
												// If there is no current match and we are done with file reading, exit
												if (done) {
													flushBatch();
													return bulkChain.then(logTableEnd);
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
												if (line.length > 0) {
													try {
														const record = JSON.parse(line);
														if (!requiresFullTableExport(tableName)) {
															// Remove inbound auto-sequenced primary key
															delete record.id;
														}
														accumulator.push(record);
														if (accumulator.length >= DBImportBatchSize) {
															flushBatch();
														}
													}
													catch (error) {
														console.error(`Table ${tableName} parsing line failed`, line, error);
														throw error;
													}
												} else {
													flushBatch();
													return bulkChain.then(logTableEnd);
												}

												result = re.exec(remainder);
											}

											return flushBatch()
												.then(() => reader.read())
												.then(({ value, done }) => f(value, done));
										};

										return Promise.resolve()
											.then(() => reader.read())
											.then(({ value, done }) => f(value, done));
									});
							}));
						});
				})
				.then(() => {
					finished = true;
					console.timeEnd("loadData:total");
					console.info(`Backup v2 importing done`);
				})
				.catch(errorHandler);
		},

	};
})();
