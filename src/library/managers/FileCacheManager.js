/* FileCacheManager.js
KC3改 Files Manager

Saves and loads some assets/data files to db when they are updated on github but not locally

Does: intercept jquery source changes
Does not: edit already-existing src tags in HTML 

assetsVersion versionning:
	Versionning constists of 3 seperately incrementing integers;
		first one is for event-related changes like edges
		second one is for general maintenence changes like akashi, changed ships, etc
		third one is for ship quotes/seasonals
	Each number increments independently of the others;
		example version history could be:
		1.1.1 -> 1.2.2 -> 1.2.3 -> 2.3.4 -> 3.4.5
	Only file groups with changed version get downloaded from master cdn.
	See #loadMeta for which specific files are in which.
*/
(function(){
	"use strict";
	
	window.KC3FileCacheManager = {
		errorImage : "/assets/img/ui/empty.png",
		cdn : "https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/",
		tlcdn : "https://raw.githubusercontent.com/KC3Kai/kc3-translations/master/",

		initImageHandler :function() {
			var self = this;
			var originalAttr = jQuery.fn.attr;

			jQuery.fn.attr = function() {
				var arg = arguments;
				var jqElem = this;

				if(arg.length > 1 && arg[0] === "src") {
					var url = arg[1].replace(/(\.\.\/)+/g, "").replace(chrome.extension.getURL("/"), "");  // Remove '../' or 'chrome-extension://...'
					if(!url.startsWith("/"))
						url = "/" + url;
					if(url.startsWith("/assets/img/")) {
						arg[1] = chrome.extension.getURL(url); // normalize url

						if(url === jqElem.attr("osrc")) 
							// stops reloading of images that don't change (for dev panel, prevents "flashing")
							return jqElem;

						return originalAttr.apply(this, arg).error(function() {
							// console.log(url);
							if(ConfigManager.checkLiveDataUpdates) {
								KC3Database.getCache(url, function( dataURL ) {
									jqElem.unbind("error");
									jqElem.unbind("load");
									if (dataURL.length === 0) {
										originalAttr.apply(jqElem, ["src", self.cdn + url + "?v=" + (Date.now())]).error(function() {
											jqElem.unbind("error");
											jqElem.unbind("load");
											originalAttr.apply(jqElem, ["osrc", url]);
											if(arg.length > 2)
												jqElem.attr("src", arg[2]);
											else
												jqElem.attr("src", self.errorImage);
										}).load(function() {
											var canvas = document.createElement('CANVAS');
											var ctx = canvas.getContext('2d');
											var dataURL;
											canvas.height = this.naturalHeight;
											canvas.width = this.naturalWidth;
											ctx.drawImage(this, 0, 0);
											dataURL = canvas.toDataURL();
											KC3Database.addCache({
												id: url,
												data: dataURL
											});
										});
									} else {
										originalAttr.apply(jqElem, ["src", dataURL[0].data]);
										originalAttr.apply(jqElem, ["osrc", url]);
									}
								});
							} else {
								if(arg.length > 2)
									jqElem.attr("src", arg[2]);
								else
									jqElem.attr("src", self.errorImage);
							}
						});
					}
				} 
				return originalAttr.apply(this, arguments);
			};
		},

		loadSubMeta :function (meta, location, datalocation, dontparsejson) {
			var self = this;
			var url = self.cdn + "data/" + datalocation;
			if(datalocation.startsWith("lang/"))
				url = self.tlcdn + datalocation.substring("lang/".length);
			url += "?v=" + (Date.now());

			KC3Database.getCache(datalocation, function( foundData ) {
				if (foundData.length === 0) {
					$.ajax({
						url: url,
						success: function(response) {
							var toPutInMeta = response;
							var toStore = response;
							if(!dontparsejson) {
								toPutInMeta = JSON.parse(response);
								toStore = JSON.stringify(toPutInMeta);
							}
							meta[location] = toPutInMeta;
							KC3Database.addCache({
								id: datalocation,
								data: toStore
							});
							self.additionalActions(datalocation);
						}
					});
				} else {
					if(dontparsejson)
						meta[location] = foundData[0].data;
					else
						meta[location] = JSON.parse(foundData[0].data);
					self.additionalActions(datalocation);
				}
			});
		},

		langCounter : 0,
		shipDbCounter : 0,
		additionalActions :function (datalocation) {
			var self = this;
			if(datalocation.startsWith("lang/")) {
				self.langCounter += 1;
				if(self.langCounter == 2)  // Once both en & normal language are loaded; reload quotes
					KC3Meta.loadQuotes();
			}
			if(datalocation === "fud_weekly.json") {
				delete KC3Meta._mapExpMap;
				KC3Meta.updateAircraftTypeIds();
			}
			if(datalocation === "WhoCallsTheFleet_items.nedb" || datalocation === "WhoCallsTheFleet_ships.nedb") {
				self.shipDbCounter += 1;
				if(self.shipDbCounter == 2)  // Once both ship and items are loaded; reload db
					WhoCallsTheFleetDb.init("/");
			}
			if(datalocation === "akashi.json" && window.KC3StrategyTabs !== undefined) {
				self.reloadTab(KC3StrategyTabs.akashi);
			}
			if(datalocation === "ship_quests.json" && window.KC3StrategyTabs !== undefined) {
				self.reloadTab(KC3StrategyTabs.shipquests);
			}
		},

		reloadTab( tab ){
			if(tab.initDone) {
				tab.definition.init();
				tab.definition.reload();
				tab.definition.execute();
			}
		},

		init :function ( initListener, initImageHandler, loadMeta ){
			var self = this;

			if(initImageHandler) 
				self.initImageHandler();

			if(!ConfigManager.checkLiveDataUpdates)
				return;

			if(loadMeta) 
				self.loadMeta();

			if(initListener) {
				var previousVersion = localStorage.assetsVersion;

				window.addEventListener("storage", function({key, timeStamp, url}){
					if(key === "assetsVersion" && localStorage.assetsVersion !== previousVersion) {
						previousVersion = localStorage.assetsVersion;
						self.loadMeta();
					}
				});
			}
		},

		loadMeta :function () {
			var self = this;
			var localVersion = JSON.parse($.ajax(chrome.extension.getURL('/data/version.json'), { async: false }).responseText).version;
			if(localStorage.assetsVersion === undefined || localVersion === localStorage.assetsVersion)
				return;

			console.log("Loading remote data; local v" + localVersion + " vs remote v" + localStorage.assetsVersion);
			if(localVersion.split(".")[0] !== localStorage.assetsVersion.split(".")[0]) { // Event related changes
				self.loadSubMeta(KC3Master, "_abyssalShips", "abyssal_stats.json");
				self.loadSubMeta(KC3Meta, "_eventColle", "fud_quarterly.json");
				self.loadSubMeta(KC3Meta, "_edges", "edges.json");
			}
			if(localVersion.split(".")[1] !== localStorage.assetsVersion.split(".")[1]) { // General maintenece related changes
				self.shipDbCounter = 0;
				self.loadSubMeta(KC3Master, "_seasonalShips", "seasonal_mstship.json");
				self.loadSubMeta(KC3Meta, "_dataColle", "fud_weekly.json");
				self.loadSubMeta(KC3Meta, "_icons", "icons.json");
				self.loadSubMeta(KC3Meta, "_gunfit", "gunfit.json");
				self.loadSubMeta(self, "_akashi", "akashi.json");
				self.loadSubMeta(self, "_shipquests", "ship_quests.json");
				self.loadSubMeta(self, "_i", "WhoCallsTheFleet_items.nedb", true);
				self.loadSubMeta(self, "_s", "WhoCallsTheFleet_ships.nedb", true);
			}
			if(localVersion.split(".")[2] !== localStorage.assetsVersion.split(".")[2]) { // Quotes
				self.langCounter = 0;
				self.loadSubMeta(KC3Meta, "_quotesSize", "quotes_size.json");
				self.loadSubMeta(KC3Translation, "_enQuotes", "lang/data/en/quotes.json");
				if(ConfigManager.language !== "en")
					self.loadSubMeta(KC3Translation, "_" + ConfigManager.language + "Quotes", "lang/data/" + ConfigManager.language + "/quotes.json");
				else
					self.langCounter += 1;
			}
		},

		checkForUpdate :function( assetsVersion ){
			var self = this;

			if(!ConfigManager.checkLiveDataUpdates)
				return;

			if((localStorage.assetsVersion || "0.0.0") === assetsVersion) 
				return;

			console.log("Clearing file cache in favour of v" + assetsVersion);
			KC3Database.con.filecaches.clear();
			localStorage.assetsVersion = assetsVersion;
		}
	};
})();
