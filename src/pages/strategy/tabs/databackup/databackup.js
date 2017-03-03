(function(){
	"use strict";

	KC3StrategyTabs.databackup = new KC3StrategyTab("databackup");

	KC3StrategyTabs.databackup.definition = {
		tabSelf: KC3StrategyTabs.databackup,

		Dropbox: {},

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){

		},


		/* EXECUTE
		Places data onto the interface
		---------------------------------*/

		execute :function(){
			//inits
			var self=this;
			var sav=false;
			$(".tab_databackup .processDisplay").hide();

			$(".tab_databackup .export_data").on("click", function(){ //export data
				sav = true;
				if(confirm("Are you sure you want to export data?")){
					self.processShow();
					window.KC3DataBackup.saveData(".tab_databackup .processDisplay .processText",function(){
							alert("finished!");
							self.processHide();
					});
				}
			});

			$(".tab_databackup .merge_data").on("click", function(){ //merge_data
				if(filename===""){
					alert("No file selected");
					return;
				}
				if(confirm("Are you sure?"))
					window.KC3DataBackup.loadData(filename,false);
			});

			$(".tab_databackup .warningbtn").on("click", function(){//warningbtn
				$(".tab_databackup .warning").toggle();
			});

			$(".tab_databackup .overwrite_data").on("click", function(){//overwrite_data
				if(confirm("Please close all your currently opened KC3 panels and pages (including devtools) first."))
				if(confirm("Will overwrite all your KC3 data! Are you sure?")){
					if(filename==="")
						alert("No file selected");
					else
						if(sav||confirm("If you haven't backup your old data, will be lost! Are you sure?")){
							self.processShow();
							window.KC3DataBackup.loadData(filename,true,".tab_databackup .processDisplay .processText",function(){
								alert("Finished! Will reload this page.");
								self.processHide();
								window.location.reload();
							});
						}
				}
			});

			var filename="";
			//window.KC3DataBackup.loadData(event.target.files[0]);
			$(".tab_databackup .import_file").on("change", function(event){
				filename = event.target.files[0];
			});

			// External backup to Dropbox
			var box = $(".tab_databackup .export_parts .export_field");

			if (typeof localStorage.backupDropbox == "undefined") {
				localStorage.backupDropbox = "{}";
			}

			self.Dropbox = JSON.parse(localStorage.backupDropbox);

			if (typeof self.Dropbox.enabled != "undefined") {
				$(".export_check input", box).attr("checked", self.Dropbox.enabled);
			}

			if (typeof self.Dropbox.token != "undefined") {
				$(".export_value input", box).val(self.Dropbox.token);
			}

			$(".export_check input", box).on("click", function() {
				self.Dropbox.enabled = $(".export_check input", box).is(":checked");
				localStorage.backupDropbox = JSON.stringify(self.Dropbox);
			});

			$(".export_value input", box).on("change", function() {
				self.Dropbox.token = $(this).val();
				localStorage.backupDropbox = JSON.stringify(self.Dropbox);
			});

			if (self.Dropbox.enabled && self.Dropbox.token !== "") {
				var dropboxClient = new self.dropboxClient(self.Dropbox.token);

				dropboxClient.list(function(data) {
					var entry;
					var bElm = $(".tab_databackup .dropbox");

					if (data.entries.length > 0) {
						$(".tab_databackup .delimiter").show();

						data.entries.forEach(function(entry) {
							var cElm = $(".tab_databackup .factory .export_field").clone().appendTo(bElm);
							var date = new Date(entry.client_modified).format("yyyy-mm-dd HH:MM");

							$(".export_name", cElm).text(date);
							$(".export_value .export_data", cElm).text(entry.name);
							$(".export_value .export_data", cElm).click(function() {
								if (confirm("Are you sure you want to download data from Dropbox?")) {
									self.processShow();
									self.processText("Downloading File...");
									dropboxClient.download(entry.name, function(data) {
										var objurl = URL.createObjectURL(data);
										chrome.downloads.download({
											url: objurl,
											filename: ConfigManager.ss_directory + "/Backup/" + entry.name,
											conflictAction: "uniquify"
										});
										alert("Finished!");
										self.processHide();
									});
								}
							});

							$(".export_check .export_data", cElm).click(function() {
								if (confirm("Are you sure you want to delete data from Dropbox?")) {
									self.processShow();
									self.processText("Deleting File...");
									dropboxClient.delete(entry.name, function() {
										alert("Finished! Will reload this page.");
										self.processHide();
										window.location.reload();
									});
								}
							});
						});
					}
				});

				$(".tab_databackup .export_file_dropbox").on("change", function(event) {
					if (confirm("Are you sure you want to upload data to Dropbox?")) {
						self.processShow();
						self.processText("Uploading File...");
						dropboxClient.upload(event.target.files[0], function() {
							alert("Finished! Will reload this page.");
							self.processHide();
							window.location.reload();
						});
					}
				});
			}
		},

		processShow: function() {
			$(".tab_databackup .dataselect").hide();
			$(".tab_databackup .processDisplay").show();
		},

		processHide: function() {
			$(".tab_databackup .dataselect").show();
			$(".tab_databackup .processDisplay").hide();
		},

		processText: function(text) {
			$(".tab_databackup .processDisplay .processText").empty().append("<div>" + text + "<div/>");
		},

		dropboxClient: function(token) {
			this.list = function(callback) {
				var args = {
					path: ""
				};
				var data = JSON.stringify(args);
				var headers = {
					"Authorization": "Bearer " + token,
					"Content-Type": "application/json"
				};
				var type = "POST";
				var responseType = "text";
				var url = "https://api.dropboxapi.com/2/files/list_folder";

				this.request(data, headers, type, responseType, url, callback);
			};

			this.delete = function(filename, callback) {
				var args = {
					path: "/" + filename
				};
				var data = JSON.stringify(args);
				var headers = {
					"Authorization": "Bearer " + token,
					"Content-Type": "application/json"
				};
				var type = "POST";
				var responseType = "text";
				var url = "https://api.dropboxapi.com/2/files/delete";

				this.request(data, headers, type, responseType, url, callback);
			};

			this.download = function(filename, callback) {
				var args = {
					path: "/" + filename
				};
				var data = JSON.stringify();
				var headers = {
					"Authorization": "Bearer " + token,
					"Dropbox-API-Arg": JSON.stringify(args)
				};
				var type = "GET";
				var responseType = "blob";
				var url = "https://content.dropboxapi.com/2/files/download";

				this.request(data, headers, type, responseType, url, callback);
			};

			this.upload = function(file, callback) {
				var args = {
					path: "/" + file.name,
					mode: "overwrite"
				};
				var headers = {
					"Authorization": "Bearer " + token,
					"Content-Type": "application/octet-stream",
					"Dropbox-API-Arg": JSON.stringify(args)
				};
				var type = "POST";
				var responseType = "text";
				var url = "https://content.dropboxapi.com/2/files/upload";

				this.request(file, headers, type, responseType, url, callback);
			};

			this.request = function(data, headers, type, responseType, url, callback) {
				$.ajax({
					data: data,
					headers: headers,
					processData: false,
					type: type,
					url: url,

					xhrFields: {
						responseType: responseType
					},

					success: function(data, textStatus, jqXHR) {
						callback(data);
					},

					error: function(jqXHR, textStatus, errorThrown) {
						console.log("Oops! " + errorThrown);
						alert("Oops! " + errorThrown);
					}
				});
			};
		}
	};
})();
