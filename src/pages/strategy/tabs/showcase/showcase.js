(function(){
	"use strict";

	KC3StrategyTabs.showcase = new KC3StrategyTab("showcase");

	KC3StrategyTabs.showcase.definition = {
		tabSelf: KC3StrategyTabs.showcase,

		shipCache: {},
		gearCache: {},
		equipTypes: {
			"t2": {
				name: "Medium Guns",
				order: "fp"
			},
			"t3": {
				name: "Heavy Guns",
				order: "fp"
			},
			"t4": {
				name: "Secondary Guns",
				order: "fp"
			},
			"t16": {
				name: "High-Angles",
				order: "fp"
			},
			"t5": {
				name: "Torpedos",
				order: "tp"
			},
			"t6": {
				name: "Fighters",
				order: "aa"
			},
			"t7": {
				name: "Dive Bombers",
				order: "dv"
			},
			"t8": {
				name: "Torpedo Bombers",
				order: "tp",
			},
			"t9": {
				name: "Recon Planes",
				order: "ls"
			},
			"t11": {
				name: "Radars",
				order: "ht"
			},
			"t10": {
				name: "Seaplanes",
				order: "ls",
				types: [ 10, 43 ]
			},
			"t19": {
				name: "Turbines",
				order: "ev"
			},
			"t_x1": {
				name: "Anti-Submarine",
				order: "as",
				types: [ 17, 18 ]
			},
			"t_x2": {
				name: "Shells",
				types: [ 12, 13 ]
			},
			"t_x3": {
				name: "Night Gear",
				types: [ 24, 27, 32 ]
			},
			"t_x4": {
				name: "Other",
				types: [ 26, 28, 29, 23 ]
			},
			"t_x5": {
				name: "Other",
				types: [ 30, 31 ]
			},
			"t_x6": {
				name: "Other",
				types: [ 20, 21, 22, 33 ]
			}
		},

		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
		},

		/* RELOAD
		Prepares latest fleets data
		---------------------------------*/
		reload :function(){
			const self = this;
			// Reload data from local storage
			KC3ShipManager.load();
			KC3GearManager.load();
			PlayerManager.hq.load();
			// Clean cache data
			this.shipCache = { bb:[], fbb:[], bbv:[], cv:[], cvl:[], ca:[], cav:[], cl:[], dd:[], ss:[], clt:[], ax:[], ao:[] };
			this.gearCache = {};

			// Convert ship list object into array
			const tempShipList = $.map(KC3ShipManager.list, function(value, index) {
				return [value];
			});

			// Order by level
			tempShipList.sort(function(a,b){
				return b.level - a.level;
			});

			// Add leveled list to ship cache, max 6 per type
			for(const ctr in tempShipList){
				const thisShip = tempShipList[ctr];
				switch( thisShip.master().api_stype ){
					case 9: this.addToStypeList("bb", thisShip); break;
					case 10: this.addToStypeList("bbv", thisShip); break;
					case 8: this.addToStypeList("fbb", thisShip); break;
					case 18: this.addToStypeList("cv", thisShip); break;
					case 11: this.addToStypeList("cv", thisShip); break;
					case 7: this.addToStypeList("cvl", thisShip); break;
					case 5: this.addToStypeList("ca", thisShip); break;
					case 6: this.addToStypeList("cav", thisShip); break;
					case 3: this.addToStypeList("cl", thisShip); break;
					case 2: this.addToStypeList("dd", thisShip); break;
					case 4: this.addToStypeList("clt", thisShip); break;
					case 13: this.addToStypeList("ss", thisShip); break;
					case 14: this.addToStypeList("ss", thisShip); break;
					case 20: this.addToStypeList("ax", thisShip); break;
					case 21: this.addToStypeList("ax", thisShip); break;
					case 17: this.addToStypeList("ax", thisShip); break;
					case 19: this.addToStypeList("ax", thisShip); break;
					case 16: this.addToStypeList("ax", thisShip); break;
					case 22: this.addToStypeList("ax", thisShip); break;
					default: break;
				}
			}

			// Organize all owned equipment by slotitem_id
			const gearRecords = {};
			$.each(KC3GearManager.list, function(index, element){
				const key = "g" + element.masterId;
				// If slotitem_id does not exist yet
				gearRecords[key] = gearRecords[key] || 0;
				// Increment this gear to the slotitem_id
				gearRecords[key] += 1;
			});

			// Organize slotitem_ids into their types
			$.each(gearRecords, function(index, element){
				const gearMaster = KC3Master.slotitem( index.substr(1) );
				if(!gearMaster) return;
				const gearType = gearMaster.api_type[3];
				const key = "t" + gearType;
				// If gear type does not exist yet
				self.gearCache[key] = self.gearCache[key] || [];
				// Add this slotitem_id to the gear type
				self.gearCache[key].push({
					id: gearMaster.api_id,
					name: KC3Meta.gearName( gearMaster.api_name ),
					count: element,
					fp: gearMaster.api_houg,
					tp: gearMaster.api_raig,
					aa: gearMaster.api_tyku,
					dv: gearMaster.api_baku,
					ls: gearMaster.api_saku,
					as: gearMaster.api_tais,
					ht: gearMaster.api_houm,
					ev: gearMaster.api_houk,
					type: gearType
				});
			});
		},

		getSettings: function() {
			const defSettings = {
				exportMode: "standard",
				output: 2, // new tab
				exportName: false,
				eventLocking: false,
				groupShipsByClass: false,
			};
			var settings;
			if (!localStorage.srShowcase) {
				localStorage.srShowcase = JSON.stringify( defSettings );
				settings = defSettings;
			} else {
				settings = JSON.parse( localStorage.srShowcase );
			}
			return settings;
		},

		modifySettings: function(settingModifier) {
			const newSettings = settingModifier(this.getSettings());
			localStorage.srShowcase = JSON.stringify( newSettings );
			return newSettings;
		},

		updateUI: function () {
			const settings = this.getSettings();
			$("#exportOutputMode").val(settings.output);
			$("#exportAddName").prop("checked", settings.exportName);
			$("#exportMode").val(settings.exportMode);
			$("#exportEventLocking").prop("checked", settings.eventLocking);
			$("#groupShipsByClass").prop("checked", settings.groupShipsByClass);
		},

		addToStypeList :function(stype, shipObj){
			if(this.shipCache[stype].length < 6){
				this.shipCache[stype].push(shipObj);
			}
		},

		displayExportResult: function (result) {
			if (!!result.url) {
				$(".exportResults").append(
					$("<div></div>").html("Uploaded to ").append(
						$("<a></a>")
							.html("Imgur")
							.attr("target", "_blank")
							.attr("href", result.url)
					)
				);
			} else if (!!result.downloadId) {
				$(".exportResults").append(
					$("<div></div>").html("Saved to ").append(
						$("<a></a>")
							.html(result.filename)
							.attr("title","Show in folder")
							.click(function () {
								chrome.downloads.show(result.downloadId);
								return false;
							})
					)
				);
			}
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;

			this.updateUI();

			// BUTTONS
			function setupExporter(button, exporterClass = window.ShowcaseExporter){
				if ($(button).hasClass("disabled"))
					return null;
				$(button).addClass("disabled");
				var exporter = new exporterClass();
				exporter.buildSettings = self.getSettings();
				exporter.complete = function (data) {
					self.displayExportResult(data);
					$(button).removeClass("disabled");
				};
				return exporter;
			}

			$("#exportShips").on("click", function(){
				var exporter = setupExporter(this);
				if (exporter !== null)
					exporter.exportShips();
			});

			$("#exportEquipment").on("click", function (){
				var exporter = setupExporter(this);
				if (exporter !== null)
					exporter.exportEquip();
			});

			$("#eventShipList").on("click", function (){
				var exporter = setupExporter(this, window.ShowcaseEventList);
				if (exporter !== null)
					exporter.exportList();
			});


			$("#exportOutputMode").change(function(){
				var val = this.value;
				self.modifySettings(function(settings){
					settings.output = val;
					return settings;
				});
			});

			$("#exportAddName").change(function(){
				var checked = this.checked;
				self.modifySettings(function(settings){
					settings.exportName = checked;
					return settings;
				});
			});

			$("#exportEventLocking").change(function(){
				var checked = this.checked;
				self.modifySettings(function(settings){
					settings.eventLocking = checked;
					return settings;
				});
			});

			$("#exportMode").change(function(){
				var val = this.value;
				self.modifySettings(function(settings){
					settings.exportMode = val;
					return settings;
				});
			});

			$("#groupShipsByClass").change(function(){
				var checked = this.checked;
				self.modifySettings(function(settings){
					settings.groupShipsByClass = checked;
					return settings;
				});
			});

			// SHIPS
			$.each(this.shipCache, function(stype, stypeList){

				$.each(stypeList, function(index, shipObj){
					if (shipObj.level <= 1) return true;

					const shipBox = $(".tab_showcase .factory .show_ship").clone();
					$(".ship_pic img", shipBox).attr("src", KC3Meta.shipIcon( shipObj.masterId ) );
					$(".ship_name", shipBox).html( shipObj.name() );
					$(".ship_level", shipBox).html( KC3Meta.term("LevelShort")+" "+ shipObj.level );
					self.checkModStat(shipBox, "api_houg", "fp", 0, shipObj);
					self.checkModStat(shipBox, "api_raig", "tp", 1, shipObj);
					self.checkModStat(shipBox, "api_tyku", "aa", 2, shipObj);
					self.checkModStat(shipBox, "api_souk", "ar", 3, shipObj);
					// self.checkModStat(shipBox, "api_luck", "lk", 4, shipObj);

					$(".ship_mod_lk", shipBox).html( shipObj.lk[0] );
					$(".ship_mod_lk", shipBox).addClass("max");

					$(".tab_showcase .stype_"+stype).append(shipBox);
				});

			});

			// GEARS
			$.each(this.equipTypes, function(index, element){
				let mergedList = [], gearTypeIcon = 0;
				// IS TYPE-SPECIFIC
				if(self.gearCache[index] !== undefined){
					mergedList = self.gearCache[index];
					gearTypeIcon = Number(index.substr(1));

				// Check if he does have any of this gear type
				}else if(element.types === undefined){
					return true;

				// IS TYPE-COLLECTION
				}else{
					// Merge each type on this list
					$.each(element.types, function(typeIndex, gearTypeId){
						mergedList = mergedList.concat( self.gearCache["t" + gearTypeId] );
					});
				}

				// If has order-by parameter
				if(element.order !== undefined){
					mergedList.sort(function(a,b){
						return b[ element.order ] - a[ element.order ];
					});
				}

				// Get 4 most powerful gear on this type
				const topGearList = mergedList.slice(0,4);
				// console.log("TopGears for", element.name, TopGears);

				// Create gear-type box
				const gearTypeBox = $(".tab_showcase .factory .gtype_box").clone();
				$(".gtype_title", gearTypeBox).text(element.name);

				// Add gears on this gear-type
				$.each(topGearList, function(gearIndex, thisTopGear){
					if(thisTopGear){
						const gearBox = $(".tab_showcase .factory .show_gear").clone();
						$(".gear_icon img", gearBox).attr("src",
							KC3Meta.itemIcon(gearTypeIcon || thisTopGear.type));
						$(".gear_name", gearBox).text( thisTopGear.name );
						$(".gear_name", gearBox).attr("title", thisTopGear.name );

						if(element.order){
							$(".gear_stat_icon img", gearBox).attr("src", KC3Meta.statIcon(element.order));
							$(".gear_stat_val", gearBox).text( thisTopGear[element.order] );
						}else{
							$(".gear_name", gearBox).css("width", "170px");
							$(".gear_stat_icon", gearBox).hide();
							$(".gear_stat_val", gearBox).hide();
						}

						$(".gear_count", gearBox).text( thisTopGear.count );

						$(".gtype_contents", gearTypeBox).append(gearBox);
					}
				});

				$(".tab_showcase .gtype_boxes").append(gearTypeBox);
			});
			$(".tab_showcase .gtype_boxes").append( $("<div/>").addClass("clear") );
		},

		checkModStat :function(shipBox, apiStat, statCode, modIndex, shipObj){
			var minStat = shipObj.master()[ apiStat ][0];
			var maxStat = shipObj.master()[ apiStat ][1];
			var modStat = shipObj.mod[ modIndex ];
			if( minStat + modStat === maxStat ){
				$(".ship_mod_"+statCode, shipBox).html("&#10003;");
				$(".ship_mod_"+statCode, shipBox).addClass("max");
			}else{
				$(".ship_mod_"+statCode, shipBox).html( maxStat - (minStat+modStat) );
			}
		}

	};

})();
