(function(){
	"use strict";

	KC3StrategyTabs.fleet = new KC3StrategyTab("fleet");

	KC3StrategyTabs.fleet.definition = {
		tabSelf: KC3StrategyTabs.fleet,

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
		  , luck: <ship luck> (optional)
		  , equipments: <array of equipments, length = 5 (4+1), falsy for non-existing>
		  }

		  "equipment" object format:
		  { id: <equipment master id>
		  , ace: <aircraft proficiency> (optional) (-1 if "ace" is not applicable)
		  , improve: <improvement level> (optional)
		  }

		 */

		fleetsObjToDeckBuilder: function(fleetsObj) {
			var self = this;
			var dBuilder = {
				version: 4
			};

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
			var self = this;

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
				console.log( JSON.stringify( converted ) );
				window.open("http://www.kancolle-calc.net/deckbuilder.html?predeck="+
							encodeURI( JSON.stringify( converted )));

			});

			this.refreshSavedFleets();
			this.executeView("current");
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

		executeView: function(viewType) {
			$(".fleet_error_msg").text("").hide();
			if (viewType === "current") {
				this.showCurrentFleets();
			} else if (viewType === "saved") {
				var name = $("#saved_fleet_sel option:selected").val();
				if (name) {
					this.showSavedFleets(name);
				}
			} else if (viewType === "history") {
				var q = $("input#hist_query").val();
				var sortieId = parseInt(q,10);
				if (!sortieId) {
					$(".fleet_error_msg").text("Invalid sortie id: " + q).show();
					return;
				}
				this.showFleetFromSortieId(sortieId);
			} else {
				console.error("unknown view type: " + viewType);
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
					shipObj.id = shipData.mst_id;
					shipObj.level = shipData.level;
					shipObj.luck = masterData.api_luck[0];
					shipObj.equipments = [];

					$.each( shipData.equip, function(i,gearId) {
						if (gearId <= 0) {
							shipObj.equipments.push(null);
							return;
						}
						shipObj.equipments.push( {id: gearId,
							improve: shipData.stars ? shipData.stars[i] : 0,
							ace: shipData.ace ? shipData.ace[i] : 0
						} );
					});

					while (shipObj.equipments.length !== 5)
						shipObj.equipments.push(null);

					return shipObj;
				}

				function convertFleet(fleetData, fleetNum) {
					var fleetObj = {};
					fleetObj.name = "Fleet #" + fleetNum;
					fleetObj.ships = [];
					$.each([0,1,2,3,4,5], function(_,ind) {
						fleetObj.ships.push(convertShip( fleetData[ind] ));
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
			$(".tab_fleet .fleet_list").html("");
			$.each(kcFleetArray, function(ind, kcFleet) {
				self.showKCFleet( kcFleet );
			});
		},

		/* Show single fleet
		   --------------------------------------------*/
		showKCFleet: function(kcFleet) {
			if (!kcFleet.active) return;
			var self = this;

			// Create fleet box
			var fleetBox = $(".tab_fleet .factory .fleet_box").clone()
				.appendTo(".tab_fleet .fleet_list");
			// fleetBox.attr("id", "fleet_box"+index);
			$(".fleet_name", fleetBox).text( kcFleet.name );

			$.each( [0,1,2,3,4,5], function(_,ind) {
				var kcShip = kcFleet.ship(ind);
				self.showKCShip(fleetBox, kcShip);
			});

			// Show fleet info
			$(".detail_level .detail_value", fleetBox).text( kcFleet.totalLevel() );
			$(".detail_los .detail_icon img", fleetBox).attr("src", "../../../../assets/img/stats/los"+ConfigManager.elosFormula+".png" );
			$(".detail_los .detail_value", fleetBox).text( Math.round( kcFleet.eLoS() * 100) / 100 );
			$(".detail_air .detail_value", fleetBox).text( kcFleet.fighterPowerText() );
			$(".detail_antiair .detail_value", fleetBox).text( kcFleet.adjustedAntiAir(1) )
				.attr("title", "Double-line: {0}\nDiamond: {1}"
					.format(kcFleet.adjustedAntiAir(2), kcFleet.adjustedAntiAir(3)) );
			$(".detail_speed .detail_value", fleetBox).text( kcFleet.speed() );
			$(".detail_support .detail_value", fleetBox).text( kcFleet.supportPower() );
		},

		/* Show single ship
		   --------------------------------------------*/
		showKCShip: function(fleetBox, kcShip) {
			if (!kcShip || kcShip.masterId === 0) return;

			var self = this;
			var shipBox = $(".tab_fleet .factory .fleet_ship").clone();
			$(".fleet_ships", fleetBox).append( shipBox );

			$(".ship_type", shipBox).text( kcShip.stype() );
			$(".ship_pic img", shipBox).attr("src", KC3Meta.shipIcon( kcShip.masterId ) );
			// TODO Link to ship list instead of ship library
			$(".ship_pic img", shipBox).attr("title", kcShip.rosterId );
			$(".ship_pic img", shipBox).attr("alt", kcShip.masterId );
			$(".ship_pic img", shipBox).click(function(){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			});
			$(".ship_lv_val", shipBox).text( kcShip.level );
			var nameBox = $(".ship_name", shipBox);
			nameBox.text( kcShip.name() );
			if (KC3StrategyTabs.isTextEllipsis(nameBox))
				nameBox.attr("title", nameBox.text());

			$.each([0,1,2,3,4], function(_,ind) {
				self.showKCGear(
					$(".ship_gear_"+(ind+1), shipBox),
					ind === 4 ? kcShip.exItem() : kcShip.equipment(ind),
					kcShip.slots[ind]);
			});
		},

		/* Show single equipment
		   --------------------------------------------*/
		showKCGear: function(gearBox, kcGear, capacity) {
			if (kcGear.masterId === 0) {
				gearBox.hide();
				return;
			}
			var masterData = kcGear.master();
			$("img", gearBox).attr("src", "../../assets/img/items/"+masterData.api_type[3]+".png");
			$("img", gearBox).attr("alt", masterData.api_id);
			$("img", gearBox).click(function(){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			});
			$(".gear_name .name", gearBox).text(kcGear.name());
			if(kcGear.stars>0){
				$(".gear_name .stars", gearBox).text( " +{0}".format(kcGear.stars) );
			}
			if(kcGear.ace>0){
				$(".gear_name .ace", gearBox).text( " \u00bb{0}".format(kcGear.ace) );
			}
			if(KC3GearManager.carrierBasedAircraftType3Ids.indexOf(masterData.api_type[3])>-1){
				$(".gear_name .slot", gearBox).text( " x{0}".format(capacity) );
			}
			$(".gear_name", gearBox).attr("title", $(".gear_name", gearBox).text() );
		},

		createKCFleetObject: function(fleetObj) {
			var fleet = new KC3Fleet();
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
			$.each( fleetObj.ships, function(ind,shipObj) {
				if (!shipObj) return;
				var ship = new KC3Ship();
				shipObjArr.push( ship );
				fleet.ships[ind] = shipObjArr.length;

				var equipmentObjectArr = [];
				var masterData = KC3Master.ship( shipObj.id );
				ship.rosterId = shipObj.rid || fleet.ships[ind];
				ship.masterId = shipObj.id;
				ship.level = shipObj.level;
				// calculate naked LoS
				ship.ls[0] = shipObj.ls || (ship.estimateNakedLoS() + ship.equipmentTotalLoS());
				ship.lk[0] = shipObj.luck;
				ship.fp[0] = shipObj.fp || 0;
				ship.tp[0] = shipObj.tp || 0;
				ship.items = [1,2,3,4];
				ship.slots = masterData.api_maxeq;
				ship.ex_item = 5;
				ship.GearManager = {
					get: function(ind) {
						return equipmentObjectArr[ind-1];
					}
				};

				$.each( shipObj.equipments, function(ind,equipment) {
					var gear = new KC3Gear();
					equipmentObjectArr.push( gear );
					if (!equipment) return;
					gear.masterId = equipment.id;
					gear.itemId = ship.items[ind];
					gear.stars = equipment.improve ? equipment.improve : 0;
					gear.ace = equipment.ace ? equipment.ace : 0;
				});

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
				var equipments = [];
				$.each([0,1,2,3], function(_,ind) {
					equipments.push( ship.equipment(ind) );
				});
				equipments.push( ship.exItem() );

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
				$.each([0,1,2,3,4,5], function(_,ind) {
					var ship = fleet.ship(ind);
					if (ship.masterId === 0) {
						fleetObjShips.push( null );
						return;
					}
					var shipObj = {
						id: ship.masterId,
						rid: ship.rosterId,
						level: ship.level,
						luck: ship.lk[0],
						ls: ship.ls[0],
						fp: ship.fp[0],
						tp: ship.tp[0],
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
