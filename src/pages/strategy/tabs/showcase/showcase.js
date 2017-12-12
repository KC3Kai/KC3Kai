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
			var ctr, ThisShip, TempShipList, self=this;
			// Reload data from local storage
			KC3ShipManager.load();
			KC3GearManager.load();
			PlayerManager.hq.load();
			// Clean cache data
			this.shipCache = { bb:[], fbb:[], bbv:[], cv:[], cvl:[], ca:[], cav:[], cl:[], dd:[], ss:[], clt:[], ax:[], ao:[] };
			this.gearCache = {};

			// Convert ship list object into array
			TempShipList = $.map(KC3ShipManager.list, function(value, index) {
				return [value];
			});

			// Order by level
			TempShipList.sort(function(a,b){
				return b.level  - a.level;
			});

			// Add leveled list to ship cache, max 6 per type
			for(ctr in TempShipList){
				ThisShip = TempShipList[ctr];
				switch( ThisShip.master().api_stype ){
					case 9: this.addToStypeList("bb", ThisShip); break;
					case 10: this.addToStypeList("bbv", ThisShip); break;
					case 8: this.addToStypeList("fbb", ThisShip); break;
					case 18: this.addToStypeList("cv", ThisShip); break;
					case 11: this.addToStypeList("cv", ThisShip); break;
					case 7: this.addToStypeList("cvl", ThisShip); break;
					case 5: this.addToStypeList("ca", ThisShip); break;
					case 6: this.addToStypeList("cav", ThisShip); break;
					case 3: this.addToStypeList("cl", ThisShip); break;
					case 2: this.addToStypeList("dd", ThisShip); break;
					case 4: this.addToStypeList("clt", ThisShip); break;
					case 13: this.addToStypeList("ss", ThisShip); break;
					case 14: this.addToStypeList("ss", ThisShip); break;
					case 20: this.addToStypeList("ax", ThisShip); break;
					case 21: this.addToStypeList("ax", ThisShip); break;
					case 17: this.addToStypeList("ax", ThisShip); break;
					case 19: this.addToStypeList("ax", ThisShip); break;
					case 16: this.addToStypeList("ax", ThisShip); break;
					case 22: this.addToStypeList("ax", ThisShip); break;
					default: break;
				}
			}

			// Organize all owned equipment by slotitem_id
			var GearRecords = {};
			$.each(KC3GearManager.list, function(index, element){
				// If slotitem_id does not exist yet
				if(typeof GearRecords["g"+element.masterId] == "undefined"){
					GearRecords["g"+element.masterId] = 0;
				}
				// Increment this gear to the slotitem_id
				GearRecords["g"+element.masterId]++;
			});

			// Organize slotitem_ids into their types
			var GearMaster, GearType;
			$.each(GearRecords, function(index, element){
				GearMaster = KC3Master.slotitem( index.substr(1) );

				GearType = GearMaster.api_type[3];
				// If gear type does not exist yet
				if(typeof self.gearCache["t"+GearType] == "undefined"){
					self.gearCache["t"+GearType] = [];
				}
				// Add this slotitem_id to the gear type
				self.gearCache["t"+GearType].push({
					id: GearMaster.api_id,
					name: KC3Meta.gearName( GearMaster.api_name ),
					count: element,
					fp: GearMaster.api_houg,
					tp: GearMaster.api_raig,
					aa: GearMaster.api_tyku,
					dv: GearMaster.api_baku,
					ls: GearMaster.api_saku,
					as: GearMaster.api_tais,
					ht: GearMaster.api_houm,
					ev: GearMaster.api_houk,
					type: GearType
				});
			});
		},

		getSettings: function() {
			var defSettings = {
				exportMode: "standard",
				output: 2, // new tab
				exportName: false,
				eventLocking: false
			};
			var settings;
			if (typeof localStorage.srShowcase === "undefined") {
				localStorage.srShowcase = JSON.stringify( defSettings );
				settings = defSettings;
			} else {
				settings = JSON.parse( localStorage.srShowcase );
			}
			return settings;
		},

		modifySettings: function(settingModifier) {
			var newSettings = settingModifier(this.getSettings());
			localStorage.srShowcase = JSON.stringify( newSettings );
			return newSettings;
		},

		updateUI: function () {
			var settings = this.getSettings();
			$("#exportOutputMode").val(settings.output);
			$("#exportAddName")[0].checked = settings.exportName;
			$("#exportMode").val(settings.exportMode);
			$("#exportEventLocking")[0].checked = settings.eventLocking;
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
			var shipBox, self=this;

			self.updateUI();

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

			// SHIPS
			$.each(this.shipCache, function(stype, stypeList){

				$.each(stypeList, function(index, shipObj){
					if (shipObj.level == 1) return true;

					shipBox = $(".tab_showcase .factory .show_ship").clone();
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
			var GearTypeBox, GearBox, TopGears, MergedList, GearTypeIcon;
			$.each(this.equipTypes, function(index, element){
				// IS TYPE-SPECIFIC
				if(typeof self.gearCache[index] != "undefined"){
					MergedList = self.gearCache[index];
					GearTypeIcon = index.substr(1);

				// Check if he does have any of this gear type
				}else if(typeof element.types == "undefined"){
					return true;

				// IS TYPE-COLLECTION
				}else{
					// Merge each type on this list
					MergedList = [];
					$.each(element.types, function(typeIndex, gearTypeId){
						MergedList = MergedList.concat( self.gearCache["t"+gearTypeId] );
					});
					GearTypeIcon = 0;
				}

				// If has order-by parameter
				if(typeof element.order != "undefined"){
					MergedList.sort(function(a,b){
						return b[ element.order ]  - a[ element.order ];
					});
				}

				// Get 4 most powerful gear on this type
				TopGears = MergedList.slice(0,4);
				// console.log("TopGears for", element.name, TopGears);

				// Create gear-type box
				GearTypeBox = $(".tab_showcase .factory .gtype_box").clone();
				$(".gtype_title", GearTypeBox).html(element.name);

				// Add gears on this gear-type
				$.each(TopGears, function(gearIndex, ThisTopGear){
					if(typeof ThisTopGear !== "undefined"){
						GearBox = $(".tab_showcase .factory .show_gear").clone();
						if(GearTypeIcon===0){ GearTypeIcon=ThisTopGear.type; }
						$(".gear_icon img", GearBox).attr("src", "../../assets/img/items/"+GearTypeIcon+".png");
						GearTypeIcon = 0;
						$(".gear_name", GearBox).html( ThisTopGear.name );
						$(".gear_name", GearBox).attr("title", ThisTopGear.name );

						if(typeof element.order !== "undefined"){
							$(".gear_stat_icon img", GearBox).attr("src", "../../assets/img/stats/"+element.order+".png");
							$(".gear_stat_val", GearBox).html( ThisTopGear[element.order] );
						}else{
							$(".gear_name", GearBox).css("width", "170px");
							$(".gear_stat_icon", GearBox).hide();
							$(".gear_stat_val", GearBox).hide();
						}

						$(".gear_count", GearBox).html( ThisTopGear.count );

						$(".gtype_contents", GearTypeBox).append(GearBox);
					}
				});

				$(".tab_showcase .gtype_boxes").append(GearTypeBox);
			});
			$(".tab_showcase .gtype_boxes").append( $("<div/>").addClass("clear") );
		},

		checkModStat :function(shipBox, apiStat, statCode, modIndex, shipObj){
			var minStat = shipObj.master()[ apiStat ][0];
			var maxStat = shipObj.master()[ apiStat ][1];
			var modStat = shipObj.mod[ modIndex ];
			if( minStat+modStat === maxStat ){
				$(".ship_mod_"+statCode, shipBox).html("&#10003;");
				$(".ship_mod_"+statCode, shipBox).addClass("max");
			}else{
				$(".ship_mod_"+statCode, shipBox).html( maxStat - (minStat+modStat) );
			}
		}

	};

})();
