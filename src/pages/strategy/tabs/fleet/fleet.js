(function(){
	"use strict";

	KC3StrategyTabs.fleet = new KC3StrategyTab("fleet");

	KC3StrategyTabs.fleet.definition = {
		tabSelf: KC3StrategyTabs.fleet,
		horizontal: false,

		currentFleetsObj: null,
		suggestedName: "",

		/*
		  "fleets" object format:
		  * an array of "fleet" objects
		  * length is exactly 4, falsy value for non-existing fleet (null is recommended)

		  "fleet" object format:
		  { ships: <an array of "ship" objects>
		  ( length is exactly 6, falsy value for non-existing ship (null is recommended) )
		  , name: <fleet name> (optional)
		  }

		  "ship" object format:
		  { id: <ship master id>
		  , level: <ship level>
		  , morale: <ship morale> (optional)
		  , luck: <ship luck> (optional)
		  , ...<other useful stats> (optional)
		  , mod: <ship modernization> (optional)
		  , equipments: <array of equipments, length = 5 (4+1), falsy for non-existing>
		  }

		  "equipment" object format:
		  { id: <equipment master id>
		  , ace: <aircraft proficiency> (optional) (-1 if "ace" is not applicable)
		  , improve: <improvement level> (optional)
		  }

		 */

		fleetsObjToDeckBuilder: function(fleetsObj, isImgBuilder = false) {
			var self = this;
			var dBuilder = {
				version: 4,
				hqlv: PlayerManager.hq.level
			};
			if(isImgBuilder) {
				dBuilder.theme = ConfigManager.sr_theme;
				if(["kr", "jp", "en", "scn", "tcn"].includes(ConfigManager.language)) {
					dBuilder.lang = ConfigManager.language;
				}
			}

			fleetsObj
				.map( self.createKCFleetObject )
				.map( function(x,i) {
					dBuilder["f" + (i+1)] = x.deckbuilder();
				});
			return dBuilder;
		},

		/* INIT
		   Prepares static data needed
		   ---------------------------------*/
		init :function(){
			// ensure localStorage has the part we need.
			if (typeof localStorage.savedFleets === "undefined") {
				localStorage.savedFleets = JSON.stringify( {} );
			}
		},

		/* RELOAD
		Prepares latest fleets data
		---------------------------------*/
		reload :function(){
			// Latest user config (for eLoS & FPow)
			ConfigManager.load();
			// Latest data for current fleet (ships & gears)
			KC3ShipManager.load();
			KC3GearManager.load();
			PlayerManager.loadFleets();
		},

		/* EXECUTE
		   Places data onto the interface
		   ---------------------------------*/
		execute :function(){
			const self = this;

			$(".ship_tooltip .stat_icon img").each((_, img) => {
				$(img).attr("src", KC3Meta.statIcon($(img).parent().data("stat")));
			});

			$("input#hist_query").on("keydown", function(e) {
				if (e.which === 13) {
					$("button#control_view").click();
					e.preventDefault();
				}
			});

			this.setupUIByViewType( "current" );
			$('input[type=radio][name=view_type]').change(function() {
				self.setupUIByViewType( this.value );
			});

			$("button#control_view").on("click", function() {
				var viewType = $("input[type=radio][name=view_type]:checked").val();
				self.executeView(viewType);
			});

			$("button#control_save").on("click", function() {
				var name = prompt("Input a name",self.suggestedName);
				if (!name) return;
				name = $.trim(name);
				var confirmFlg = true;
				if (self.ifFleetsObjExists(name)) {
					confirmFlg = confirm("Overwrite record with name '" + name + "'?");
				}

				if (confirmFlg) {
					self.saveFleetsObj(name);
					self.refreshSavedFleets();
				}
			});

			$("button#control_saved_rename").on("click", function() {
				var oldName = $("#saved_fleet_sel option:selected").val();
				if (!oldName) return;

				var newName = prompt("Renaming '" + oldName + "' to:");
				newName = $.trim(newName);
				if (!newName) return;
				if (oldName === newName) return;

				var confirmFlg = true;
				if (self.ifFleetsObjExists(newName)) {
					confirmFlg = confirm("Overwrite record with name '" + newName + "'?");
				}

				if (confirmFlg) {
					self.renameFleetsObj(oldName,newName);
					self.refreshSavedFleets();
				}
			});

			$("button#control_saved_delete").on("click", function() {
				var name = $("#saved_fleet_sel option:selected").val();
				if (!name) return;
				var confirmFlg = confirm("Confirm Deleting Record '" + name + "'?");
				if (confirmFlg) {
					self.deleteFleetsObj(name);
					self.refreshSavedFleets();
				}
			});

			$("button#control_export_dbuilder").on("click", function() {
				var converted = self.fleetsObjToDeckBuilder( self.currentFleetsObj );
				console.log( "JSON to be exported", JSON.stringify( converted ) );
				window.open("http://www.kancolle-calc.net/deckbuilder.html?predeck="+
							encodeURI( JSON.stringify( converted )));
			});

			$("button#control_export_imgkcbuilder").on("click", function() {
				var converted = self.fleetsObjToDeckBuilder( self.currentFleetsObj, true );
				console.log( "JSON to be exported", JSON.stringify( converted ) );
				window.open("https://www.nishikuma.net/ImgKCbuilder/?predeck="+
							encodeURI( JSON.stringify( converted )));
			});

			const updateHorizontal = () => {
				if(this.horizontal) {
					$(".fleet_ships").addClass("horizontal");
					$(".fleet_ship").addClass("horizontal");
				} else {
					$(".horizontal").removeClass("horizontal");
				}
			};
			$("button#control_switch_view").on("click", function() {
				self.horizontal = !self.horizontal;
				updateHorizontal();
			});
			updateHorizontal();

			this.refreshSavedFleets();
			if(!!KC3StrategyTabs.pageParams[1]){
				this.executeView(KC3StrategyTabs.pageParams[1], KC3StrategyTabs.pageParams[2] || false);
			}else{
				this.executeView("current");
			}
		},

		ifFleetsObjExists: function(name) {
			name = $.trim(name);
			var savedFleets = JSON.parse( localStorage.savedFleets );
			return !! savedFleets[name];
		},

		renameFleetsObj: function(oldName, newName) {
			newName = $.trim(newName);
			var savedFleets = JSON.parse( localStorage.savedFleets );
			var tmp = savedFleets[oldName];
			delete savedFleets[oldName];
			savedFleets[newName] = tmp;
			localStorage.savedFleets = JSON.stringify( savedFleets );
		},

		deleteFleetsObj: function(name) {
			name = $.trim(name);
			var savedFleets = JSON.parse( localStorage.savedFleets );
			delete savedFleets[name];
			localStorage.savedFleets = JSON.stringify( savedFleets );
		},

		saveFleetsObj: function(name) {
			name = $.trim(name);
			if (name === "") {
				$(".fleet_error_msg").text("empty name").show();
				return;
			}
			if (!this.currentFleetsObj) {
				$(".fleet_error_msg").text("cannot find info of current viewing fleets").show();
				return;
			}

			var savedFleets = JSON.parse( localStorage.savedFleets );
			savedFleets[name] = this.currentFleetsObj;
			localStorage.savedFleets = JSON.stringify( savedFleets );
		},

		refreshSavedFleets: function() {
			var savedFleets = JSON.parse( localStorage.savedFleets );
			var keys = Object.keys( savedFleets );
			keys.sort();
			var selectBox = $("#saved_fleet_sel");
			selectBox.empty();

			$.each( keys, function(_,key) {
				selectBox.append( $("<option></option>")
					.attr("value", key)
					.text(key) );
			});
		},

		executeView: function(viewType, viewName) {
			$(".fleet_error_msg").text("").hide();
			if (viewType === "current") {
				this.showCurrentFleets();
			} else if (viewType === "saved") {
				if (viewName !== undefined) {
					if(!$("#saved").prop("checked")) {
						$("#saved").trigger("click");
					}
					$("#saved_fleet_sel").prop("selectedIndex", viewName || 0);
				}
				var name = $("#saved_fleet_sel option:selected").val();
				if (name) {
					this.showSavedFleets(name);
				}
			} else if (viewType === "history") {
				if (viewName !== undefined) {
					if (!$("#history").prop("checked")) {
						$("#history").trigger("click");
					}
					$("input#hist_query").val(viewName);
				}
				var q = $("input#hist_query").val();
				var sortieId = parseInt(q,10);
				if (!sortieId) {
					$(".fleet_error_msg").text("Invalid sortie id: " + q).show();
					return;
				}
				this.showFleetFromSortieId(sortieId);
			} else {
				console.warn("Unknown view type:", viewType);
				this.showCurrentFleets();
			}
		},

		setupUIByViewType: function(viewType) {
			$("select.control_input").prop("disabled", viewType !== "saved");
			$("input#hist_query").prop("disabled", viewType !== "history");
			$("button#control_save").prop("disabled", viewType === "saved");

			$("button#control_saved_rename").prop("disabled", viewType !== "saved");
			$("button#control_saved_delete").prop("disabled", viewType !== "saved");
		},

		showCurrentFleets: function() {
			this.showAllKCFleets( this.loadCurrentFleets() );
			$("#fleet_description").text("Current Fleets");
			this.currentFleetsObj = this.getCurrentFleetsObj();
			this.suggestedName = "Fleets (" + new Date().format("yyyy-mm-dd HH:MM:ss") + ")";
		},

		showSavedFleets: function(name) {
			name = $.trim(name);
			var savedFleets = JSON.parse( localStorage.savedFleets );
			var fleetsObj = savedFleets[name];
			var self = this;

			if (!fleetsObj) {
				$(".fleet_error_msg").text("No record of '" + name + "'").show();
				return;
			}

			var kcFleets = fleetsObj.map( function( fleetObj ) {
				return self.createKCFleetObject(fleetObj);
			});

			self.showAllKCFleets( kcFleets );
			$("#fleet_description").text("Saved Fleets '" + name + "'");
			this.currentFleetsObj = fleetsObj;
			this.suggestedName = name;
		},

		showFleetFromSortieId: function(sortieId) {
			var self = this;
			KC3Database.get_sortie(sortieId, function(sortieData) {
				if (! sortieData) {
					$(".fleet_error_msg")
						.text("Cannot find data with sortie Id " + sortieId)
						.show();
					return;
				}
				var fleetsObj = [];

				function convertShip(shipData) {
					if (!shipData || shipData.mst_id <= 0) return null;
					var shipObj = {};
					var masterData = KC3Master.ship(shipData.mst_id);
					var slotnum = masterData.api_slot_num;
					shipObj.id = shipData.mst_id;
					shipObj.level = shipData.level;
					shipObj.morale = shipData.morale;
					shipObj.mod = shipData.kyouka;
					shipObj.stats = shipData.stats;
					shipObj.equipments = [];

					$.each( shipData.equip, function(i,gearId) {
						if (gearId <= 0) {
							shipObj.equipments.push(null);
							return;
						}
						shipObj.equipments.push( {id: gearId,
							improve: shipData.stars && shipData.stars[i] > 0 ? shipData.stars[i] : 0,
							ace: shipData.ace ? shipData.ace[i] || 0 : 0
						} );
					});
					while (shipObj.equipments.length < Math.max(slotnum + 1, 5))
						shipObj.equipments.push(null);

					return shipObj;
				}

				function convertFleet(fleetData, fleetNum) {
					var fleetObj = {};
					fleetObj.name = "Fleet #" + fleetNum;
					fleetObj.ships = [];
					$.each(fleetData, function(ind, ship) {
						fleetObj.ships.push(convertShip( ship ));
					});
					return fleetObj;
				}

				fleetsObj.push(convertFleet( sortieData.fleet1, 1));
				fleetsObj.push(convertFleet( sortieData.fleet2, 2));
				fleetsObj.push(convertFleet( sortieData.fleet3, 3));
				fleetsObj.push(convertFleet( sortieData.fleet4, 4));

				var kcFleets = fleetsObj.map( function( fleetObj ) {
					return self.createKCFleetObject(fleetObj);
				});
				self.currentFleetsObj = fleetsObj;
				self.suggestedName = "Sortie #" + sortieId;
				self.showAllKCFleets( kcFleets );
				$("#fleet_description").text("Sortie #" + sortieId + " Fleets");
			});
		},

		showAllKCFleets: function(kcFleetArray) {
			var self = this;
			// Empty fleet list
			$(".tab_fleet .fleet_list").hide().html("");
			$.each(kcFleetArray, function(ind, kcFleet) {
				self.showKCFleet( kcFleet, ind + 1 );
			});
			// Show with duration and check if ship name overflow
			$(".tab_fleet .fleet_list").createChildrenTooltips().show(100, () => {
				$(".tab_fleet .fleet_list .ship_name").each(function() {
					if(KC3StrategyTabs.isTextEllipsis(this))
						$(this).attr("title", $(this).text());
				});
			});
		},

		/* Show single fleet
		   --------------------------------------------*/
		showKCFleet: function(kcFleet, fleetNum) {
			if (!kcFleet.active) return;
			const self = this;

			// Create fleet box
			const fleetBox = $(".tab_fleet .factory .fleet_box").clone()
				.appendTo(".tab_fleet .fleet_list");
			fleetBox.attr("data-fleet", fleetNum);
			$(".fleet_name", fleetBox).text( kcFleet.name );

			let maxSlots = 0;
			$.each( kcFleet.ship(), function(ind, kcShip) {
				self.showKCShip(fleetBox, kcShip, (ind + 1));
				maxSlots = Math.max(maxSlots, kcShip.equipmentMaxCount(true));
			});
			$(".fleet_ships", fleetBox).addClass(`max_slot${maxSlots}`);
			if(maxSlots > 6) $(".fleet_ships", fleetBox).addClass("max_slot6");

			// Show fleet info
			const fstats = kcFleet.totalStats(true, false, true);
			const fstatsImp = kcFleet.totalStats(true, "exped", true);
			$(".detail_level .detail_value", fleetBox).text( kcFleet.totalLevel() )
				.attr("title", "{0}: -\u2605\t+\u2605\n{1}: {6}\t{11}\n{2}: {7}\t{12}\n{3}: {8}\t{13}\n{4}: {9}\t{14}\n{5}: {10}\t{15}".format(
					KC3Meta.term("ExpedTotalImp"),
					KC3Meta.term("ExpedTotalFp"),
					KC3Meta.term("ExpedTotalTorp"),
					KC3Meta.term("ExpedTotalAa"),
					KC3Meta.term("ExpedTotalAsw"),
					KC3Meta.term("ExpedTotalLos"),
					fstats.fp, fstats.tp, fstats.aa, fstats.as, fstats.ls,
					Math.qckInt("floor", fstatsImp.fp , 1),
					Math.qckInt("floor", fstatsImp.tp , 1),
					Math.qckInt("floor", fstatsImp.aa , 1),
					Math.qckInt("floor", fstatsImp.as , 1),
					Math.qckInt("floor", fstatsImp.ls , 1)
				));
			$(".detail_los .detail_icon img", fleetBox).attr("src", "/assets/img/stats/los"+ConfigManager.elosFormula+".png" );
			$(".detail_los .detail_value", fleetBox).text( Math.qckInt("floor", kcFleet.eLoS(), 1) );
			if(ConfigManager.elosFormula > 1) {
				const f33CnHq4 = Array.numbers(1, 5).map(cn =>
					Math.qckInt("floor", kcFleet.eLos4(cn), 1).toLocaleString(undefined, KC3Meta.formatDecimalOptions(1, false)
				));
				const f33CnHq3 = Array.numbers(1, 5).map(cn =>
					Math.qckInt("floor", kcFleet.eLos4(cn, 0.35), 1).toLocaleString(undefined, KC3Meta.formatDecimalOptions(1, false)
				));
				const airReconnScore = Math.qckInt("floor", kcFleet.airReconnScore(), 1)
					.toLocaleString(undefined, KC3Meta.formatDecimalOptions(1, false));
				const airReconnResult = kcFleet.estimateAirReconnResult();
				$(".detail_los .detail_value", fleetBox).attr("title",
					"HLv: x0.4\tx0.35\nCn1: {0}\t{5}\nCn2: {1}\t{6}\nCn3: {2}\t{7}\nCn4: {3}\t{8}\nCn5: {4}\t{9}".format(f33CnHq4.concat(f33CnHq3))
					+ "\nW6-3: {0}".format(airReconnScore)
					+ (airReconnScore > 0 ? "\n&emsp;G: {0}\n&emsp;H: {1}".format(airReconnResult.W63G.result, airReconnResult.W63H.result) : "")
				);
			} else {
				$(".detail_los .detail_value").attr("title", "");
			}
			$(".detail_air .detail_value", fleetBox).text( kcFleet.fighterPowerText() )
				.attr("title", KC3Calc.buildFleetsAirstrikePowerText(kcFleet)
					+ KC3Calc.buildFleetsContactChanceText(kcFleet));
			$(".detail_antiair .detail_value", fleetBox).text( kcFleet.adjustedAntiAir(ConfigManager.aaFormation) )
				.attr("title", "{0}: {3}\n{1}: {4}\n{2}: {5}".format(
						KC3Meta.formationText(1), KC3Meta.formationText(2), KC3Meta.formationText(3),
						kcFleet.adjustedAntiAir(1), kcFleet.adjustedAntiAir(2), kcFleet.adjustedAntiAir(3)
					)
				);
			$(".detail_speed .detail_value", fleetBox).text( kcFleet.speed() );
			$(".detail_support .detail_value", fleetBox).text( kcFleet.supportPower() );
			$(".ss_button", fleetBox).on("click", function(e) {
				const thisButton = $(this);
				const thisFleetBox = thisButton.parent(), fleetBoxNative = thisFleetBox.get(0);
				if(fleetBoxNative.scrollIntoViewIfNeeded)
					fleetBoxNative.scrollIntoViewIfNeeded();
				else if(fleetBoxNative.scrollIntoView)
					fleetBoxNative.scrollIntoView();
				thisButton.hide("fast", "linear", self.captureFleetBox.bind(self, thisFleetBox));
			});
		},

		/**
		 * Save fleet box screenshot
		 */
		captureFleetBox: function(fleetBox) {
			const fleetNum = $(fleetBox).data("fleet") || 1;
			const coords = {
				x: $(fleetBox).offset().left,
				y: $(fleetBox).offset().top,
				w: $(fleetBox).width(),
				h: $(fleetBox).height(),
				t: $(document).scrollTop(),
			};
			const dpr = window.devicePixelRatio || 1;
			chrome.tabs.getZoom(undefined, scale => {
				if(scale !== 1 || dpr !== 1) Object.keys(coords).forEach(p => { coords[p] *= scale * dpr; });
				chrome.tabs.captureVisibleTab(undefined, {format: "png"}, (dataUrl) => {
					if(chrome.runtime.lastError) {
						console.log("Failed to screenshot fleet", chrome.runtime.lastError);
						const errMsg = chrome.runtime.lastError.message || "";
						if(errMsg.includes("'activeTab' permission")) {
							alert("Click KC3\u6539 icon on browser toolbar to grant screenshot permission");
						} else {
							alert("Failed to capture fleet screenshot");
						}
						$(".ss_button", fleetBox).show();
						return;
					}
					const canvas = document.createElement("canvas"), img = new Image();
					img.onload = (e) => {
						canvas.width = coords.w;
						canvas.height = coords.h;
						const ctx = canvas.getContext("2d");
						ctx.imageSmoothingEnabled = false;
						ctx.drawImage(img,
							coords.x, coords.y - coords.t, coords.w, coords.h,
							0, 0, coords.w, coords.h);
						new KC3ImageExport(canvas, {
							filename: "{0} #{1} ({2})".format(
								$("#fleet_description").text(),
								fleetNum, dateFormat("yyyy-mm-dd HHMM")
							),
						}).export((error, result) => {
							if(error) {
								console.error("Failed to screenshot fleet", error);
								alert("Failed to generate fleet screenshot");
							} else if(result && result.filename) {
								alert("Saved to {0}".format(result.filename));
							}
							$(".ss_button", fleetBox).show();
						});
					};
					img.src = dataUrl;
				});
			});
		},

		/* Show single ship
		   --------------------------------------------*/
		showKCShip: function(fleetBox, kcShip, index) {
			if (!kcShip || !kcShip.masterId) return;

			var self = this;
			var shipDb = WhoCallsTheFleetDb.getShipStat(kcShip.masterId);
			var shipMst = kcShip.master();
			var shipBox = $(".tab_fleet .factory .fleet_ship").clone();
			$(".fleet_ships", fleetBox).append( shipBox );

			$(".ship_type", shipBox).text( kcShip.stype() );
			$(".ship_pic img", shipBox).attr("src", kcShip.shipIcon() );
			// TODO Link to ship list instead of ship library
			$(".ship_pic img", shipBox).attr("alt", kcShip.masterId );
			$(".ship_pic img", shipBox).click(function(){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			});
			$(".ship_lv_val", shipBox).text( kcShip.level );
			$(".ship_lk_val", shipBox).text( kcShip.lk[0] );
			$(".ship_luck", shipBox).toggle(kcShip.lk[0] !== undefined);
			$(".ship_cond_icon img", shipBox).attr("src",
				"/assets/img/client/morale/" + kcShip.moraleIcon() + ".png"
			);
			$(".ship_cond_val", shipBox).text( kcShip.morale );
			$(".ship_morale", shipBox).toggle(kcShip.morale !== undefined);
			$(".ship_index", shipBox).text( index );
			var nameBox = $(".ship_name", shipBox);
			nameBox.text( kcShip.name() ).lazyInitTooltip();

			// Only available for current fleet as no ship attribute omitted
			var viewType = $("input[type=radio][name=view_type]:checked").val();
			if(viewType === "current"){
				// Show a rich text tool-tip like stats in game
				const tooltipBox = kcShip.htmlTooltip($(".ship_tooltip", shipBox));
				$(".ship_hover", shipBox).tooltip({
					position: { my: "left top", at: "right+10 top" },
					items: "div",
					content: tooltipBox.prop("outerHTML"),
					open: KC3Ship.onShipTooltipOpen,
				});
			}

			$(".ship_gear > div", shipBox).hide();
			kcShip.equipment(true).forEach((gear, index) => {
				self.showKCGear(
					$(".ship_gear_"+(index+1), shipBox),
					gear,
					kcShip.slots[index],
					kcShip,
					index
				);
			});
		},

		/* Show single equipment
		   --------------------------------------------*/
		showKCGear: function(gearBox, kcGear, capacity, kcShip, index) {
			if (!kcGear.masterId || !kcShip.masterId) {
				gearBox.hide();
				return;
			}
			const masterData = kcGear.master();
			// to avoid red slot size 1 when Large Flying Boat equipped
			const slotMaxSize = masterData.api_type[2] === 41 ? 1 : kcShip.master().api_maxeq[index];
			const isExslot = index >= kcShip.slotnum;
			// ex-slot capacity not implemented yet, no aircraft equippable
			$(".slot_capacity", gearBox).text(isExslot ? "-" : capacity)
				.removeClass("empty taiha chuuha shouha unused")
				.addClass((percent => {
					switch(true){
						case !slotMaxSize: return "";
						case percent <= 0.00: return "empty";
						case percent <= 0.25: return "taiha";
						case percent <= 0.50: return "chuuha";
						case percent <= 0.75: return "shouha";
						default: return "";
					}
				})(capacity / (slotMaxSize || 1)));
			if(isExslot || KC3GearManager.carrierBasedAircraftType3Ids.indexOf(masterData.api_type[3]) < 0){
				$(".slot_capacity", gearBox).addClass("unused");
			}
			$(".gear_icon img", gearBox).attr("src", KC3Meta.itemIcon(masterData.api_type[3]))
				.error(function() { $(this).unbind("error").attr("src", "/assets/img/ui/empty.png"); })
				.attr("alt", masterData.api_id)
				.click(function(){
					KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
				});
			$(".gear_name", gearBox).text(kcGear.name()).attr("title",
				kcGear.htmlTooltip(capacity, kcShip)).lazyInitTooltip();
			if(kcGear.stars > 0){
				$(".gear_stars", gearBox).text(
					"\u2605{0}".format(kcGear.stars >= 10 ? "m" : kcGear.stars)
				);
			} else {
				$(".gear_stars", gearBox).hide();
			}
			if(kcGear.ace > 0){
				$(".gear_ace img", gearBox).attr("src",
					"/assets/img/client/achev/" + Math.min(kcGear.ace, 7) + ".png"
				);
			} else {
				$(".gear_ace", gearBox).hide();
			}
			gearBox.toggleClass("ex_slot", isExslot).show();
		},

		createKCFleetObject: function(fleetObj) {
			var fleet = new KC3Fleet();
			if(!fleetObj) return fleet;
			fleet.name = fleetObj.name;
			fleet.ships = [ -1, -1, -1, -1, -1, -1 ];
			if (!fleetObj) return;
			fleet.active = true;
			var shipObjArr = [];

			// simulate ShipManager
			fleet.ShipManager = {
				get: function(ind) {
					return shipObjArr[ind-1] || new KC3Ship();
				}
			};

			// fill in instance of Ships
			$.each( fleetObj.ships, function(ind, shipObj) {
				if (!shipObj) return;
				var ship = new KC3Ship();
				shipObjArr.push( ship );
				fleet.ships[ind] = shipObjArr.length;

				var equipmentObjectArr = [];
				var masterData = KC3Master.ship( shipObj.id );
				var slotnum = masterData.api_slot_num;
				ship.rosterId = shipObj.rid || fleet.ships[ind];
				ship.masterId = shipObj.id;
				ship.level = shipObj.level;
				ship.morale = shipObj.morale;

				ship.items = [-1,-1,-1,-1,-1];
				ship.slots = masterData.api_maxeq;
				ship.ex_item = 0;
				ship.slotnum = slotnum;
				ship.GearManager = {
					get: function(ind) {
						return equipmentObjectArr[ind-1] || new KC3Gear();
					}
				};

				$.each( shipObj.equipments, function(ind,equipment) {
					if (!equipment) return;
					var gear = new KC3Gear();
					equipmentObjectArr.push( gear );
					if(ind >= 4 && ind >= ship.slotnum) {
						ship.ex_item = equipmentObjectArr.length;
						gear.itemId = ship.ex_item;
					} else {
						ship.items[ind] = equipmentObjectArr.length;
						gear.itemId = ship.items[ind];
					}
					gear.masterId = equipment.id;
					gear.stars = Number(equipment.improve) || 0;
					gear.ace = Number(equipment.ace) || 0;
				});

				// estimate ship's stats from known facts as possible as we can
				var mod = shipObj.mod || [];
				var noMasterStats = shipObj.stats || {};
				ship.hp[0] = ship.hp[1] = ship.maxHp() + (mod[5] || 0);

				// read saved values first, then fall back to calculate master + mod + equip total
				ship.fp[0] = shipObj.fp || (masterData.api_houg[0] + (mod[0] || 0) + ship.equipmentTotalStats("houg"));
				ship.tp[0] = shipObj.tp || (masterData.api_raig[0] + (mod[1] || 0) + ship.equipmentTotalStats("raig"));
				ship.aa[0] = shipObj.aa || (masterData.api_tyku[0] + (mod[2] || 0) + ship.equipmentTotalStats("tyku"));
				ship.ar[0] = shipObj.ar || (masterData.api_souk[0] + (mod[3] || 0) + ship.equipmentTotalStats("souk"));
				ship.lk[0] = shipObj.luck || (masterData.api_luck[0] + (mod[4] || 0));

				// no value in master data, fall back to calculated naked + equip total
				ship.ls[0] = shipObj.ls || ((noMasterStats.ls || ship.estimateNakedLoS()) + ship.equipmentTotalLoS());
				ship.ev[0] = shipObj.ev || ((noMasterStats.ev || ship.estimateNakedEvasion()) + ship.equipmentTotalStats("houk"));
				ship.as[0] = shipObj.as || ((noMasterStats.as || ship.estimateNakedAsw()) + ship.equipmentTotalStats("tais") + (mod[6] || 0));

				// just fall back to master data, to avoid recompute ship speed by updating a table about speed up ship classes
				ship.speed = shipObj.sp || noMasterStats.sp || masterData.api_soku;
			});

			return fleet;
		},

		loadCurrentFleets: function() {
			PlayerManager.loadFleets();
			return [0,1,2,3].map( function(ind) {
				return PlayerManager.fleets[ind];
			});
		},

		getCurrentFleetsObj: function() {
			var fleetsObj = [];

			function convertEquipmentsOf(ship) {
				var equipments = ship.equipment(true);

				function convertEquipment(e) {
					if (e.masterId === 0)
						return null;
					return {
						id: e.masterId,
						ace: e.ace,
						improve: e.stars
					};
				}
				return equipments.map( convertEquipment );
			}

			function convertFleet(fleet) {
				if (!fleet || !fleet.active) return null;
				var fleetObjShips = [];
				$.each( fleet.ship(), function(ind, ship) {
					if (ship.masterId === 0) {
						fleetObjShips.push( null );
						return;
					}
					var shipObj = {
						id: ship.masterId,
						rid: ship.rosterId,
						level: ship.level,
						morale: ship.morale,
						luck: ship.lk[0],
						ls: ship.ls[0],
						as: ship.as[0],
						fp: ship.fp[0],
						tp: ship.tp[0],
						sp: ship.speed,
						mod: ship.mod,
						equipments: convertEquipmentsOf(ship)
					};
					fleetObjShips.push( shipObj );
				});
				var fleetObj = {
					name: fleet.name,
					ships: fleetObjShips
				};
				return fleetObj;
			}

			PlayerManager.loadFleets();
			$.each([0,1,2,3], function(_,ind) {
				fleetsObj.push(convertFleet( PlayerManager.fleets[ind] ));
			});

			return fleetsObj;
		}
	};

})();
