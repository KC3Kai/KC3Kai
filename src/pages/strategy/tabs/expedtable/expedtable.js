(function(){
	"use strict";
	/*
	  (TODO) data format for expedition table:
	  - for income modifier:
	  
	      - standard modifier:

		  { type: "normal",
	        gs: true / false,
			daihatsu: 0 ~ 4 
		  }
			
			  - "gs" indicates whether great success is intended
			  - whoever saves the data is responsible for its consistency
			    if say daihatsu value turns out to be 5, that's not my fault

		  - custom modifier:

          { type: "direct",
		    value: a number, from 1.0 to perhaps 2.0 (meaning 100% ~ 200%)
		  }

		      - great success should be taken into account by custom modifier.
			    which means if user intends to carry 4 daihatsus and ensure GS,
				this value needs to be 1.8 (1.5 * 1.2)
			  - the design decision is made in this way so that if future update
                adds some mechanism that affect GS modifier, we will still be flexible.

	  - for cost:
	      - cost deals with the problem that user might carry extra ships for
            a higher GS rate.

	      - standard:
		  { type: "costmodel",
		  
		    wildcard: "DD" / "SS" / false,
			count: 0 ~ 6 (but make it only possible to select 4~6 from UI)
		  }
		
		  - custom:

		  { type: "custom",
		    fuel: integer (non-negative),
			ammo: integer (non-negative)
		  }
	 */
	function getRandomInt(min,max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	let coinFlip = () => Math.random() > 0.5;

	function genModStandard() {
		return {
			type: "normal",
			gs: coinFlip(),
			daihatsu: getRandomInt(0,4)
		};
	}

	function genModCustom() {
		return {
			type: "direct",
			value: 1.5 + Math.random() * 0.3
		};
	}

	function genCostNormal() {
		return {
			type: "costmodel",
			wildcard: [false,"DD","SS"][getRandomInt(0,2)],
			count: getRandomInt(4,6)
		};
	}

	function genCostCustom() {
		return {
			type: "custom",
			fuel: getRandomInt(10,500),
			ammo: getRandomInt(10,500)
		};
	}

	function generateRandomConfig() {
		let config = {};
		for (let i = 1; i <= 40; ++i) {
			config[i] = {
				modifier: (coinFlip()) ? genModStandard() : genModCustom(),
				cost: (coinFlip()) ? genCostNormal() : genCostCustom()
			};
		}

		return config;
	}

	function mergeExpedCost(arr) {
		return arr.reduce( function(acc, cur) {
			return { ammo: acc.ammo + cur.ammo,
					 fuel: acc.fuel + cur.fuel };
		}, {ammo: 0, fuel: 0});
	}

	/*
	  TODO: UI viewer and sorter.
	  viewer: view by: net income / gross income / basic income, general config / allow normal config
	  sorter: by exped id, fuel, ammo, etc.

	  disabled whenever any of the expeditions are still under editing

	 */

	KC3StrategyTabs.expedtable = new KC3StrategyTab("expedtable");

	// some PureScript librarys, imported locally.
	let ExpedInfo = PS["KanColle.Expedition.New.Info"];
	let ExpedSType = PS["KanColle.Expedition.New.SType"];
	let ExpedCostModel = PS["KanColle.Expedition.New.CostModel"];
	let ExpedMinCompo = PS["KanColle.Expedition.New.MinCompo"];
	let Maybe = PS["Data.Maybe"];
	let PartialUnsafe = PS["Partial.Unsafe"];

	KC3StrategyTabs.expedtable.definition = {
		tabSelf: KC3StrategyTabs.expedtable,

		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
		},

		/* RELOAD: optional
		Loads latest player or game data if needed.
		---------------------------------*/
		reload: function() {
		},

		prepareCostModelSection: function() {
			let contentRoot = $(".tab_expedtable #cost_model_content_root");
			let tableRoot = $("table", contentRoot);

			let calcCostModel = (stypeInstance, num) =>
				ExpedCostModel.normalCostModel(stypeInstance)(num);

			// setup slider controls
			let ticks = Array.from(Array(10 + 1).keys(), x => x * 10);
			let sliderSettings = {
				// ticks = [0,10..100]
				ticks: Array.from(Array(10 + 1).keys(), x => x * 10),
				step: 10,
				// default of both fuel and ammo are 80%
				value: 80,
				tooltip: "hide"
			};
			
			let viewFuelPercent = $(".control_row.fuel .val");
			let viewAmmoPercent = $(".control_row.ammo .val");
			let tableBody = $("tbody",tableRoot);
			function updateCostModelTable( which, newValue ){
				console.assert( which === "fuel" || which === "ammo" );
				(  which === "fuel" ? viewFuelPercent
				   : which === "ammo" ? viewAmmoPercent
				   : undefined ).text( newValue + "%" );

				let actualPercent = (newValue + 0.0) / 100.0;
				$(".cost_cell", tableBody).each( function() {
					let jq = $(this);
					let maxCost = jq.data("max-cost");
					$("." + which, this).text( Math.floor(maxCost[which] * actualPercent) );
				});
			}

			let sliderFuel = $("input#cost_model_fuel")
				.slider(sliderSettings)
				.on("change", function(e) {
					updateCostModelTable( "fuel", e.value.newValue );
				});
			let sliderAmmo = $("input#cost_model_ammo")
				.slider(sliderSettings)
				.on("change", function(e) {
					updateCostModelTable( "ammo", e.value.newValue );
				});

			// setup table
			let stypeTexts = [
				"DD", "CL", "CVLike", "SSLike", 
				"CA", "BBV", "AS", "CT", "AV"];

			stypeTexts.map( function(stype) {
				let tblRow = $("<tr>");
				let stypeHead = $("<th>");

				if (stype === "CVLike") {
					stypeHead
						.text("CV(*)")
						.attr("title", "CV / CVL / AV / CVB");
				} else if (stype === "SSLike") {
					stypeHead
						.text( "SS(*)" )
						.attr("title", "SS / SSV");
				} else {
					stypeHead.text( stype );
				}

				tblRow.append( stypeHead );
				for (let i=1; i<=6; ++i) {
					let stypeInst = ExpedSType[stype].value;
					let costResult = calcCostModel(stypeInst, i);
					let cell;

					if (Maybe.isJust( costResult )) {
						cell = $(".tab_expedtable .factory .cost_cell").clone();
						let costSum = mergeExpedCost( PartialUnsafe.unsafePartial(Maybe.fromJust)(costResult) );
						cell.data( "max-cost", costSum );
					} else {
						cell = $(".tab_expedtable .factory .cost_cell_na").clone();
					}
					tblRow.append( $("<td />").append(cell) );
				}
				
				tableBody.append( tblRow );
			});

			// sync controls with default value
			updateCostModelTable("fuel", sliderFuel.slider("getValue"));
			updateCostModelTable("ammo", sliderAmmo.slider("getValue"));
		},

		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			let self = this;
			// a random-generated configuration for debugging purpose
			var expedConfig = generateRandomConfig();

			var factory = $(".tab_expedtable .factory");
			var expedTableRoot = $("#exped_table_content_root");

			var allExpeds = [];
			var i;
			for (i=1; i<=40; ++i)
				allExpeds.push(i);

			function makeWinItem( jqObj, winItemArr ) {
				var itemId = winItemArr[0];
				var idToItem = {
					1: "bucket",
					2: "ibuild",
					3: "devmat",
					10: "box1",
					11: "box2",
					12: "box3"
				};
				if (itemId !== 0) {
					jqObj
						.append($(
							"<img>",
							{src: "../../assets/img/client/"+idToItem[itemId]+".png"}))
					    .append("x" + winItemArr[1]);
				} else {
					jqObj.text( "-" );
				}
			}

			allExpeds.forEach( function(eId) {
				var expedRow = $(".exped_row", factory).clone();
				expedRow.data( "id", eId );
				var resourceInfo = ExpedInfo.getInformation( eId ).resource;
				var masterInfo = KC3Master._raw.mission[eId];
				var config = expedConfig[eId];

				$(".info_col.id", expedRow).text( eId );
				$(".info_col.time", expedRow).text( String( 60 * masterInfo.api_time ).toHHMMSS() );

				["fuel", "ammo", "steel", "bauxite"].forEach( function(name) {
					$(".info_col." + name, expedRow).text( resourceInfo[name] );
				});

				makeWinItem( $(".info_col.item1", expedRow), masterInfo.api_win_item1 );
				makeWinItem( $(".info_col.item2", expedRow), masterInfo.api_win_item2 );
				
				var modViewByGeneral = config.modifier.type !== "normal";
				$(".modifier .view.view_general", expedRow).toggle( modViewByGeneral );
				$(".modifier .view.view_normal", expedRow).toggle( !modViewByGeneral );

				var costViewByGeneral = config.cost.type !== "costmodel" ||
					(config.cost.type === "costmodel" &&
					 config.cost.wildcard === false);
				$(".cost .view.view_general", expedRow).toggle( costViewByGeneral );
				$(".cost .view.view_normal", expedRow).toggle( !costViewByGeneral );

				var generalModifier = config.modifier.type === "normal"
					? (config.modifier.gs ? 1.5 : 1.0)*(1.0 + config.modifier.daihatsu*0.05)
					: config.modifier.value;

				$(".modifier .view.view_general", expedRow).text(
					"+" + ((generalModifier-1.0)*100).toFixed(2) + "%");

				if (config.modifier.type === "normal") {
					$(".modifier .view.view_normal img.gs", expedRow).attr( 
						"src", config.modifier.gs
							? "../../assets/img/ui/btn-gs.png" 
							: "../../assets/img/ui/btn-xgs.png" );
					$(".modifier .view.view_normal .dht_times", expedRow).text(
						"x" + config.modifier.daihatsu);
				}

				let computedCost;

				if (config.cost.type === "costmodel") {
					let minCompo = ExpedMinCompo.getMinimumComposition(eId);
					let stype =
						/* when wildcard is not used, count must be 0 so
						   we have nothing to fill in, here "DD" is just
						   a placeholder that never got used.
						 */
						config.cost.wildcard === false ? new ExpedSType.DD()
						: config.cost.wildcard === "DD" ? new ExpedSType.DD()
						: config.cost.wildcard === "SS" ? new ExpedSType.SSLike()
					    : "Invalid wildcard in config.cost";

					if (typeof stype === "string")
						throw stype;
					let actualCompo =
						ExpedMinCompo.concretizeComposition(config.cost.count)(stype)(minCompo);
					let info = ExpedInfo.getInformation(eId);
					let costModel = ExpedCostModel.normalCostModel;
					let fleetMaxCost = ExpedCostModel.calcFleetMaxCost(costModel)(actualCompo);
					if (! Maybe.isJust(fleetMaxCost)) {
						throw "CostModel fails to compute a cost for current fleet composition";
					} else {
						fleetMaxCost = PartialUnsafe.unsafePartial(Maybe.fromJust)(fleetMaxCost);
					}
					let fleetActualCost = fleetMaxCost.map( function(x) {
						return {
							fuel: Math.floor( info.fuelCostPercent * x.fuel ),
							ammo: Math.floor( info.ammoCostPercent * x.ammo )
						};
					});
					computedCost = mergeExpedCost( fleetActualCost );
				} else {
					computedCost = {
						fuel: config.cost.fuel,
						ammo: config.cost.ammo };
				}

				$(".cost .view.view_general .fuel", expedRow).text(String(-computedCost.fuel));
				$(".cost .view.view_general .ammo", expedRow).text(String(-computedCost.ammo));

				if (!costViewByGeneral) {
					$(".cost .view.view_normal .limit", expedRow)
						.text("≥" + config.cost.count);
					$(".cost .view.view_normal .wildcard", expedRow)
						.text("(*=" + config.cost.wildcard + ")");
				}

				$(".edit_btn", expedRow).on("click", function() {
					expedRow.toggleClass("active");
					$(this).text( expedRow.hasClass("active") ? "▼" : "◀");
				});

				expedTableRoot.append( expedRow );
			});

			self.prepareCostModelSection();
		},

		/* UPDATE: optional
		Partially update elements of the interface,
			possibly without clearing all contents first.
		Be careful! Do not only update new data,
			but also handle the old states (do cleanup).
		Return `false` if updating all needed,
			EXECUTE will be invoked instead.
		---------------------------------*/
		update: function(pageParams) {
			// Use `pageParams` for latest page hash values,
			// KC3StrategyTabs.pageParams keeps the old values for states tracking

			// Returning `true` means updating has been handled.
			return false;
		}
	};
})();
