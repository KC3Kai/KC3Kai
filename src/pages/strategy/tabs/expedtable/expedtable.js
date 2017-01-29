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

          { type: "custom",
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

	// some PureScript librarys, imported locally.
	let ExpedInfo = PS["KanColle.Expedition.New.Info"];
	let ExpedSType = PS["KanColle.Expedition.New.SType"];
	let ExpedCostModel = PS["KanColle.Expedition.New.CostModel"];
	let ExpedMinCompo = PS["KanColle.Expedition.New.MinCompo"];
	let Maybe = PS["Data.Maybe"];
	let PartialUnsafe = PS["Partial.Unsafe"];

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
			type: "custom",
			value: 1.0 + Math.random() * 0.8
		};
	}

	function genCostNormal() {
		let retVal = {
			type: "costmodel",
			wildcard: [false,"DD","SS"][getRandomInt(0,2)],
			count: getRandomInt(4,6)
		};
		if (retVal.wildcard === false)
			retVal.count = 0;
		return retVal;
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

	function enumFromTo(from,to,step=1) {
		var arr = [];
		for (let i=from; i<=to; i+=step)
			arr.push(i);
		return arr;
	}

	function normalModifierToNumber(modConfig) {
		console.assert( modConfig.type === "normal" );
		return (modConfig.gs ? 1.5 : 1.0)*(1.0+0.05*modConfig.daihatsu);
	}

	function prettyFloat(n,precision=2) {
		let fixed = n.toFixed(precision);
		let str = String(n);
		return (str.length <= fixed.length) ? str : fixed;
	}

	function saturate(v,min,max) {
		return Math.max(Math.min(v,max),min);
	}

	function costConfigToActualCost(costConfig,eId) {
		console.assert( costConfig.type === "costmodel" ||
						costConfig.type === "custom" );
		if (costConfig.type === "costmodel") {
			let minCompo = ExpedMinCompo.getMinimumComposition(eId);
			let stype =
				/* when wildcard is not used, count must be 0 so
				   we have nothing to fill in, here "DD" is just
				   a placeholder that never got used.
				*/
				costConfig.wildcard === false ? new ExpedSType.DD()
				: costConfig.wildcard === "DD" ? new ExpedSType.DD()
				: costConfig.wildcard === "SS" ? new ExpedSType.SSLike()
				: "Invalid wildcard in costConfig";

			if (typeof stype === "string")
				throw stype;
			let actualCompo =
				ExpedMinCompo.concretizeComposition(costConfig.count)(stype)(minCompo);
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
			return mergeExpedCost( fleetActualCost );
		} else {
			return {
				fuel: costConfig.fuel,
				ammo: costConfig.ammo };
		}
	}

	function generateCostGrouping() {
		let allExpeds = enumFromTo(1,40).map( function(x) {
			let info = ExpedInfo.getInformation(x);
			return { ammo: Math.round( info.ammoCostPercent * 100),
					 ammoP: info.ammoCostPercent,
					 fuel: Math.round( info.fuelCostPercent * 100),
					 fuelP: info.fuelCostPercent,
					 id: x };
		});
		allExpeds.sort( function(a,b) {
			// key 1: group by total consumption
			let aTotal = a.ammo + a.fuel;
			let bTotal = b.ammo + b.fuel;
			if (aTotal != bTotal)
				return aTotal - bTotal;

			// key 2: group by either (begin with fuel because all expeds
			// is sure to spend some)
			if (a.fuel != b.fuel)
				return a.fuel - b.fuel;
			if (a.ammo != b.ammo)
				return a.ammo - b.ammo;

			// finally tie break by exped id
			return a.id - b.id;
		});
		
		let currentGrp = false;
		let grouped = [];

		function eq(a,b) {
			return (a.fuel == b.fuel) && (a.ammo == b.ammo);
		}

		while (allExpeds.length > 0) {
			let curExped = allExpeds.shift();
			if (currentGrp === false) {
				currentGrp = [curExped];
			} else if (eq(currentGrp[0], curExped)) {
				currentGrp.push( curExped );
			} else {
				grouped.push( currentGrp );
				currentGrp = [curExped];
			}
		}

		if (currentGrp !== false) {
			grouped.push( currentGrp );
			currentGrp = false;
		}

		grouped = grouped.map( function(x) {
			return { ammo: x[0].ammo,
					 fuel: x[0].fuel,
					 expeds: x.map( y => y.id ) };
		});

		grouped.sort( function(a,b) {
			if (b.expeds.length !== a.expeds.length)
				return b.expeds.length- a.expeds.length;

			let aTotal = a.ammo + a.fuel;
			let bTotal = b.ammo + b.fuel;
			return bTotal - aTotal;
		});
		console.log(JSON.stringify(grouped));
	}

	// generated from generateCostGrouping()
	let expedCostGrouping = [
		{ammo:0,fuel:50,expeds:[2,4,5,7,9,11,12,14,31]},
		{ammo:80,fuel:80,expeds:[23,26,27,28,35,36,37,38]},
		{ammo:40,fuel:50,expeds:[13,15,16,19,20]},
		{ammo:70,fuel:80,expeds:[21,22,40]},
		{ammo:80,fuel:50,expeds:[25,33,34]},
		{ammo:20,fuel:50,expeds:[8,18]},{ammo:20,fuel:30,expeds:[3,6]},
		{ammo:0,fuel:30,expeds:[1,10]},{ammo:90,fuel:90,expeds:[39]},
		{ammo:70,fuel:90,expeds:[30]},{ammo:60,fuel:90,expeds:[24]},
		{ammo:40,fuel:90,expeds:[29]},{ammo:30,fuel:90,expeds:[32]},
		{ammo:40,fuel:30,expeds:[17]}];

	/*
	  TODO: UI viewer and sorter.
	  viewer: view by: net income / gross income / basic income, general config / allow normal config
	  sorter: by exped id, time, fuel, ammo, etc.

	  disabled whenever any of the expeditions are still under editing

	  - hotzone coloring (based on number of completed expedtion)
	  - error message on config save.

	 */

	KC3StrategyTabs.expedtable = new KC3StrategyTab("expedtable");

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
			let jqPreset = $("select.cost_preset", contentRoot);
			let presetFlag = false;

			let calcCostModel = (stypeInstance, num) =>
				ExpedCostModel.normalCostModel(stypeInstance)(num);

			// setup slider controls
			let sliderSettings = {
				ticks: enumFromTo(0,100,10),
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
					let maxCostArr = jq.data("max-cost-arr");
					let actualCost = maxCostArr
						.map( x => Math.floor( x[which] * actualPercent ) )
						.reduce( (x,y) => x+y, 0);
					$("." + which, this).text( actualCost );
				});
			}

			let sliderFuel = $("input#cost_model_fuel")
				.slider(sliderSettings)
				.on("change", function(e) {
					updateCostModelTable( "fuel", e.value.newValue );
					if (!presetFlag)
						jqPreset.val("title");
				});
			let sliderAmmo = $("input#cost_model_ammo")
				.slider(sliderSettings)
				.on("change", function(e) {
					updateCostModelTable( "ammo", e.value.newValue );
					if (!presetFlag)
						jqPreset.val("title");
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
						let costArr = PartialUnsafe.unsafePartial(Maybe.fromJust)(costResult);
						cell.data( "max-cost-arr", costArr );
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

			expedCostGrouping.map( function(x,i) {
				let desc = "" + x.fuel + "% Fuel, " + x.ammo + "% Ammo,";
				desc += " " +
					(x.expeds.length > 1 ? "Expeditions" : "Expedition")+ ": " +
					x.expeds.join(",");
				jqPreset.append( $("<option />", {value: i}).text(desc) );
			});

			jqPreset.change( function() {
				if (this.value === "title")
					return;
				presetFlag = true;
				let cost = expedCostGrouping[this.value];
				sliderFuel.slider("setValue", cost.fuel);
				sliderAmmo.slider("setValue", cost.ammo);
				updateCostModelTable("fuel", cost.fuel);
				updateCostModelTable("ammo", cost.ammo);
				presetFlag = false;
			});
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
			let allExpeds = enumFromTo(1,40);

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
					? normalModifierToNumber(config.modifier)
					: config.modifier.value;

				$(".modifier .view.view_general", expedRow).text(
					"+" + prettyFloat((generalModifier-1.0)*100) + "%");

				if (config.modifier.type === "normal") {
					$(".modifier .view.view_normal img.gs", expedRow).attr(
						"src", config.modifier.gs
							? "../../assets/img/ui/btn-gs.png"
							: "../../assets/img/ui/btn-xgs.png" );
					$(".modifier .view.view_normal .dht_times", expedRow).text(
						"x" + config.modifier.daihatsu);
				}

				let computedCost = costConfigToActualCost(config.cost,eId);
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

				// setup Income Modifier
				let jqIMRoot = $(".exped_config .modifier .content", expedRow);
				$("input[type=radio]", jqIMRoot)
					.change( function() {
						let isModNormal = this.value === "normal";
						$(".group.mod_normal *", jqIMRoot)
							.filter(":input").prop("disabled", !isModNormal);
						$(".group.mod_custom *", jqIMRoot)
							.filter(":input").prop("disabled", isModNormal);
					})
					.each( function() {
						$(this).attr("name",  "modifier-" + eId );
					});

				$("input[type=radio]", jqIMRoot).filter("[value=" + config.modifier.type + "]")
					.prop("checked", true).change();

				// we try to fill in as much as info as we can for the other option.
				if (config.modifier.type === "normal") {
					// normal
					$("input[type=checkbox][name=gs]",jqIMRoot)
						.prop("checked", config.modifier.gs);
					$("select.dht",jqIMRoot).val(config.modifier.daihatsu);
					
					$("input.custom_val[type=text]",jqIMRoot)
						.val( prettyFloat(normalModifierToNumber(config.modifier)) );
				} else {
					// custom
					$("input.custom_val[type=text]",jqIMRoot)
						.val( config.modifier.value );

					// now let's guess what could be the corresponding setting for normal config
					let guessedGS = config.modifier.value >= 1.5;
					let valBeforeGS = guessedGS 
						? config.modifier.value / 1.5 
						: config.modifier.value;
					let guessedDHT = Math.floor((valBeforeGS - 1)/0.05);
					guessedDHT = saturate(guessedDHT,0,4);
					$("input[type=checkbox][name=gs]",jqIMRoot)
						.prop("checked", guessedGS);
					$("select.dht",jqIMRoot).val(guessedDHT);
				}

				// setup Resupply Cost
				let jqCRoot = $(".exped_config .cost .content", expedRow);
				$("input[type=radio]", jqCRoot)
					.change( function() {
						let isCostNormal = this.value === "normal";
						$(".group.cost_normal *", jqCRoot)
							.filter(":input").prop("disabled", !isCostNormal);
						$(".group.cost_custom *", jqCRoot)
							.filter(":input").prop("disabled", isCostNormal);
					})
					.each( function() {
						$(this).attr("name",  "cost-" + eId );
					});
				
				$("input[type=radio]", jqCRoot).filter(
					"[value=" + (config.cost.type === "costmodel" 
								 ? "normal" : "custom") + "]")
					.prop("checked", true).change();

				if (config.cost.type === "costmodel") {
					// normal
					$("select.wildcard",jqCRoot).val(
						config.cost.wildcard === false 
							? "None" : config.cost.wildcard);
					$("select.count",jqCRoot).val( config.cost.count );

					let actualCost = costConfigToActualCost( config.cost, eId );
					$("input[type=text][name=fuel]", jqCRoot).val( actualCost.fuel );
					$("input[type=text][name=ammo]", jqCRoot).val( actualCost.ammo );
				} else {
					// custom
					$("input[type=text][name=fuel]", jqCRoot).val( config.cost.fuel );
					$("input[type=text][name=ammo]", jqCRoot).val( config.cost.ammo );
					// it's hard to guess info from cost.
					// so let's just set everything to default:
					// - if user requires great success, we set wildcard to DD with 6 ships.
					// - otherwise, None with no ship.
					let guessedGS = (config.modifier.type === "normal" 
									 ? config.modifier.gs
									 : config.modifier.value >= 1.5);
					let guessedWildcard = guessedGS ? "DD" : "None";
					let guessedCount = guessedGS ? 6 : 0;
					$("select.wildcard",jqCRoot).val( guessedWildcard );
					$("select.count",jqCRoot).val( guessedCount );
				}
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
