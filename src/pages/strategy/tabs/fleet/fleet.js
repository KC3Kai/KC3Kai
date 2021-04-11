(function(){
	"use strict";

	KC3StrategyTabs.fleet = new KC3StrategyTab("fleet");

	KC3StrategyTabs.fleet.definition = {
		tabSelf: KC3StrategyTabs.fleet,
		horizontal: false,

		viewType: "",
		currentFleetsObj: null,
		suggestedName: "",
		sortiedMap: "",

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
			var dBuilderData = KC3ImageBuilder.createDeckBuilderHeader(isImgBuilder);
			fleetsObj
				.map(KC3ImageBuilder.createKC3FleetObject)
				.map( function(x,i) {
					dBuilderData["f" + (i+1)] = x.deckbuilder(isImgBuilder);
				});
			return dBuilderData;
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
			PlayerManager.loadBases();
		},

		/* EXECUTE
		   Places data onto the interface
		   ---------------------------------*/
		execute :function(){
			const self = this;

			$(".ship_tooltip .stat_icon img").each((_, img) => {
				$(img).attr("src", KC3Meta.statIcon($(img).parent().data("stat")));
			});

			$("input#hist_query,input#exped_query").on("keydown", function(e) {
				if (e.which === 13) {
					$("button#control_view").click();
					e.preventDefault();
				}
			});

			this.setupUIByViewType( "current" );
			$('input[type=radio][name=view_type]').change(function() {
				self.setupUIByViewType( this.value );
			});

			$("button#control_view").on("click", function () {
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
				if (self.viewType === "current") {
					KC3ImageBuilder.exportCurrentFleets();
				} else {
					var converted = self.fleetsObjToDeckBuilder(self.currentFleetsObj, true);
					KC3ImageBuilder.openWebsite(converted);
				}
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
			if (!!KC3StrategyTabs.pageParams[1]) {
				this.executeView(KC3StrategyTabs.pageParams[1], KC3StrategyTabs.pageParams[2] || false);
			} else {
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
			this.viewType = viewType;
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
				const val = $("input#hist_query").val();
				const sortieId = parseInt(val, 10);
				if (!sortieId) {
					$(".fleet_error_msg").text("Invalid sortie Id: " + val).show();
					return;
				}
				this.showFleetFromSortieId(sortieId);
			} else if (viewType === "exped") {
				if (viewName !== undefined) {
					if (!$("#exped").prop("checked")) {
						$("#exped").trigger("click");
					}
					$("input#exped_query").val(viewName);
				}
				const val = $("input#exped_query").val();
				const expedId = parseInt(val, 10);
				if (!expedId) {
					$(".fleet_error_msg").text("Invalid exped Id: " + val).show();
					return;
				}
				this.showFleetFromExpedId(expedId);
			} else {
				console.warn("Unknown view type:", viewType);
				this.showCurrentFleets();
			}
		},

		setupUIByViewType: function(viewType) {
			$("select.control_input").prop("disabled", viewType !== "saved");
			$("input#hist_query").prop("disabled", viewType !== "history");
			$("input#exped_query").prop("disabled", viewType !== "exped");
			$("button#control_save").prop("disabled", viewType === "saved");

			$("button#control_saved_rename").prop("disabled", viewType !== "saved");
			$("button#control_saved_delete").prop("disabled", viewType !== "saved");
		},

		showCurrentFleets: function() {
			this.showAllKCFleets( this.loadCurrentFleets() );
			$("#fleet_description").text("Current Fleets");
			this.currentFleetsObj = this.getCurrentFleetsObj();
			this.suggestedName = "Fleets (" + new Date().format("yyyy-mm-dd HH:MM:ss") + ")";
			this.sortiedMap = "";
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
				return KC3ImageBuilder.createKC3FleetObject(fleetObj);
			});

			self.showAllKCFleets( kcFleets );
			$("#fleet_description").text("Saved Fleets '" + name + "'");
			this.currentFleetsObj = fleetsObj;
			this.suggestedName = name;
			this.sortiedMap = "";
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
				fleetsObj.push(KC3ImageBuilder.convertSortiedFleet(sortieData.fleet1, 1));
				fleetsObj.push(KC3ImageBuilder.convertSortiedFleet(sortieData.fleet2, 2));
				fleetsObj.push(KC3ImageBuilder.convertSortiedFleet(sortieData.fleet3, 3));
				fleetsObj.push(KC3ImageBuilder.convertSortiedFleet(sortieData.fleet4, 4));
				var kcFleets = fleetsObj.map(function (fleetObj) {
					return KC3ImageBuilder.createKC3FleetObject(fleetObj);
				});

				self.currentFleetsObj = fleetsObj;
				self.sortiedMap = [sortieData.world, sortieData.mapnum].join("");
				self.suggestedName = "Sortie #{0} {1}{2}-{3}".format(
					sortieId, KC3Meta.isEventWorld(sortieData.world) ? "E" : "W", sortieData.world, sortieData.mapnum
				);
				self.showAllKCFleets( kcFleets );
				$("#fleet_description").text("{0}{1} Fleets".format(
					self.suggestedName, sortieData.combined ? " Combined" : ""
				));
			});
		},

		showFleetFromExpedId: function(expedId) {
			var self = this;
			KC3Database.get_exped(expedId, function(expedData) {
				if (! expedData) {
					$(".fleet_error_msg")
						.text("Cannot find data with expedition Id " + expedId)
						.show();
					return;
				}
				var fleetsObj = [];
				fleetsObj.push(KC3ImageBuilder.convertSortiedFleet(expedData.fleet, expedData.fleetN));
				var kcFleets = fleetsObj.map(function (fleetObj) {
					return KC3ImageBuilder.createKC3FleetObject(fleetObj);
				});
				self.currentFleetsObj = fleetsObj;
				self.sortiedMap = "";
				self.suggestedName = "Exped #{0} ({1} {2})".format(
					expedId,
					KC3Master.missionDispNo(expedData.mission),
					KC3Meta.term("MissionActivity{0}".format(expedData.data.api_clear_result + 1))
				);
				self.showAllKCFleets( kcFleets );
				$("#fleet_description").text("{0} Fleet".format(self.suggestedName));
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
				.attr("title", KC3Calc.buildFleetsTotalStatsText(kcFleet));
			$(".detail_los .detail_icon img", fleetBox).attr("src", "/assets/img/stats/los"+ConfigManager.elosFormula+".png" );
			$(".detail_los .detail_value", fleetBox).text( Math.qckInt("floor", kcFleet.eLoS(), 1) )
				.attr("title", KC3Calc.buildFleetsElosText(kcFleet, 5));
			$(".detail_air .detail_value", fleetBox).text( kcFleet.fighterPowerText() )
				.attr("title", KC3Calc.buildFleetsAirstrikePowerText(kcFleet)
					+ KC3Calc.buildFleetsContactChanceText(kcFleet));
			$(".detail_antiair .detail_value", fleetBox).text( kcFleet.adjustedAntiAir(ConfigManager.aaFormation) )
				.attr("title", KC3Meta.formationText(ConfigManager.aaFormation)
					+ "\n" + KC3Calc.buildFleetsAdjustedAntiAirText(kcFleet));
			$(".detail_speed .detail_value", fleetBox).text( kcFleet.speed() )
				.attr("title", KC3Calc.buildFleetsSpeedText(kcFleet));
			$(".detail_support .detail_value", fleetBox).text( kcFleet.supportPower() )
				.attr("title", KC3Calc.buildFleetExpedSupportText(kcFleet));
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
