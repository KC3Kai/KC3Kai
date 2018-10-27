(function(){
	"use strict";

	// some PureScript library, imported locally.
	let ExpedInfo = PS["KanColle.Expedition.New.Info"];
	let ExpedSType = PS["KanColle.Expedition.New.SType"];
	let ExpedCostModel = PS["KanColle.Expedition.New.CostModel"];
	let Maybe = PS["Data.Maybe"];
	let PartialUnsafe = PS["Partial.Unsafe"];
	let fromJust = PartialUnsafe.unsafePartial(Maybe.fromJust);

	function enumFromTo(from,to,step=1) {
		var arr = [];
		for (let i=from; i<=to; i+=step)
			arr.push(i);
		return arr;
	}

	let allExpedIds = Expedition.allExpedIds;
	let modifierToNumber = Expedition.modifierToNumber;
	let computeActualCost = Expedition.computeActualCost;

	let eqConfig = Expedition.eqConfig;
	let loadExpedConfig = Expedition.loadExpedConfig;
	let saveExpedConfig = Expedition.saveExpedConfig;

	function prettyFloat(n,precision=2,positiveSign=false) {
		let fixed = n.toFixed(precision);
		let str = String(n);
		// we want "0" to be "+0"
		let pre = (positiveSign && n >= 0) ? "+" : "";
		return pre + ((str.length <= fixed.length) ? str : fixed);
	}

	function saturate(v,min,max) {
		return Math.max(Math.min(v,max),min);
	}

	function generateCostGrouping() {
		let allExpeds = allExpedIds.map( function(x) {
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
		console.debug(JSON.stringify(grouped));
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

		setupCostModelSection: function() {
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
				( which === "fuel" ? viewFuelPercent
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
						let costArr = fromJust(costResult);
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
			let expedConfig = loadExpedConfig();
			if (expedConfig === false) {
				$(".tab_expedtable .section_body.exped_table .alert.first_time").show();
				$(".tab_expedtable .section_body.exped_table .exped_control_row").hide();
			} else {
				// view controls need to be set up before any exped rows
				this.setupViewControls();
				this.setupAllExpedRows();
				this.setupSorters();
			}

			this.setupCostModelSection();
			this.setupResetConfigSection();
		},

		setupResetConfigSection: function() {
			let self = this;
			let contentRoot = $(".tab_expedtable .section_body.reset");
			$("button.reset", contentRoot).click( function() {
				// only require confirmation when it overwrites an existing config
				if (loadExpedConfig() !== false) {
					let c = confirm("Please confirm resetting, the change cannot be reverted!");
					if (c !== true)
						return;
				}

				let resetMode =
					$("input[type=radio][name=reset_mode]:checked", contentRoot).val();
				console.assert(["recommended","normal"].indexOf(resetMode) !== -1);
				let guess =
					$("input.reset_guess[type=checkbox]", contentRoot).prop("checked");

				let baseConfig = resetMode === "recommended"
					? Expedition.generateRecommendedConfig()
					: Expedition.generateNormalConfig();

				function onCompletion() {
					// show success message
					$(".alert.config_gen_success", contentRoot).show();
					// reload
					$(".logo").click();
				}

				if (guess) {
					Expedition.asyncGenerateConfigFromHistory( function(config) {
						saveExpedConfig( config );
						onCompletion();
					}, baseConfig);
				} else {
					saveExpedConfig( baseConfig );
					onCompletion();
				}
			});
		},

		setupAllExpedRows: function() {
			let self = this;
			let expedConfig = loadExpedConfig();
			console.assert(expedConfig !== false);
			var factory = $(".tab_expedtable .factory");
			var expedTableRoot = $("#exped_table_content_root");
			let allExpeds = allExpedIds;

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

				// store some basic info for later calculation.
				expedRow.data(
					"info",
					$.extend( {}, resourceInfo, { time: masterInfo.api_time }));

				$(".info_col.id", expedRow).text( eId );
				let timeText = String( 60 * masterInfo.api_time ).toHHMMSS();
				// total expedition time always ends with ":00" in HH:MM:SS representation,
				// so we can cut that out as we've done in exped scorer
				timeText =  /(.*):00$/.exec( timeText )[1];
				$(".info_col.time", expedRow).text( timeText );

				makeWinItem( $(".info_col.item1", expedRow), masterInfo.api_win_item1 );
				makeWinItem( $(".info_col.item2", expedRow), masterInfo.api_win_item2 );

				self.setupExpedView(expedRow, config, eId);
				// a local to this UI setup function, used as an internal state
				// to indicate whether we need to re-update config part of UI.
				let configSynced = false;

				$(".edit_btn", expedRow).on("click", function() {
					expedRow.toggleClass("active");
					let expanding = expedRow.hasClass("active");
					let configRoot = $(".exped_config", expedRow);
					$(this).html( expanding ? "&#9660;" : "&#9664;");
					if (expanding) {
						// when expanding, we need to put configs on UI.

						// we prevent resetting UI every time
						// if nothing has been changed,
						// local variable "configSynced" is used as an indicator
						// to tell whether we need to update the config part of UI

						// intentionally shadowing "config",
						// and now we have the latest "config".
						let config = expedConfig[eId];
						if (configSynced) {
							// console.log( "config UI is already synced, skipping UI update" );
						} else {
							self.setupExpedConfig(configRoot, config, eId);
							configSynced = true;
						}

						// disable all view / sort controls when start editing
						$(".exped_control_row button", expedTableRoot).prop("disabled", true);
					} else {
						// collapsing
						// construct new config from UI.
						let newConfig = self.getExpedConfig(configRoot, eId);
						if (eqConfig(expedConfig[eId], newConfig)) {
							// console.log( "config is not changed, skipping UI update." );
						} else {
							expedConfig[eId] = newConfig;
							saveExpedConfig( expedConfig );
							self.setupExpedView(expedRow, newConfig, eId);

							// deselect some sorters because a modifier config might affect
							// sorting result of them.
							self.deselectResourceSorters();

							configSynced = false;
						}

						// enable all view / sort controls
						// if none of the rows are still under editing.
						if ($(".exped_row.active", expedTableRoot).length === 0) {
							$(".exped_control_row button", expedTableRoot).prop("disabled", false);
						}
					}
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

				expedTableRoot.append( expedRow );
			});

		},

		setupSorters: function() {
			// Sorter behavior:
			// - mutually exclusive, with expedition id being default
			// - any config change invalidates sorting method,
			//   so we will clear all sorter active states, unless the already
			//   selected one is "sort by id" or "sort by time"
			// - won't redo sorting after user has changed some config,
			//   by doing so we keep every exped row in its before-editing place
			//   so it can be conveniently edited again.
			let self = this;
			let expedTableRoot = $("#exped_table_content_root");

			// arrayTransformer :: [<jqObj of exped row>] -> [<jqObj of exped row>]
			function rearrangeExpedRows(arrayTransformer) {
				var expedRows = $(".exped_row", expedTableRoot).toArray();
				expedRows.map( (x) => $(x).detach() );
				var transformed = arrayTransformer(expedRows);
				transformed.map( (x) => expedTableRoot.append(x) );
			}

			let jqSorters = $(".sort_control .sort_methods button", expedTableRoot);
			// sort by exped id by default.
			$(".sort_control .sort_methods button", expedTableRoot)
				.filter("[data-sort-by=id]").each( function() {
					$(this).addClass("active");
					$(".ord",this).html("&#9660;");
					$(".ord",this).data("order", "desc");
				});

			jqSorters.click( function() {
				let thisMethod = $(this).data("sortBy");
				// before toggling active statuses, take a note about old sorting method.
				let oldMethod = self.getActiveSortMethod();
				jqSorters.each( function() {
					let thatMethod = $(this).data("sortBy");
					$(this).toggleClass("active", thisMethod === thatMethod);
					if (thisMethod !== thatMethod) {
						$(".ord",this).empty();
						$(".ord",this).data("order", "");
					}
				});

				// intentionally not doing "already-active" check,
				// as view change might also affect sort result.

				if (oldMethod !== null && oldMethod.method === thisMethod) {
					// reverse current list instead of actual sorting
					let nowAscending = ! oldMethod.ascending;
					$(".ord",this).html(nowAscending ? "&#9650;" : "&#9660;");
					$(".ord",this).data("order", nowAscending ? "asc" : "desc");
					rearrangeExpedRows( x => x.reverse() );
				} else {
					// sortBy :: Ord x => (a -> x) -> [a] -> [a]
					// "getter" extracts a value from element for comparison
					let sortBy = (getter) => (xs) => xs.sort( function (a,b) {
						let retVal = getter(a) - getter(b);
						// tie break by id for an idempotent result.
						return retVal === 0 ? $(a).data("id") - $(b).data("id") : retVal;
					});
					console.assert(
						["id","time","fuel","ammo","steel","bauxite"].indexOf(thisMethod) !== -1);
					let getter;
					if (thisMethod === "id") {
						getter = x => $(x).data("id");
						$(".ord",this).html("&#9660;");
					} else if (thisMethod === "time") {
						getter = x => $(x).data("info").time;
						$(".ord",this).html("&#9660;");
					} else {
						/* must be one of the resources, descending order. */
						getter = x => - $(x).data("actual")[thisMethod];
						$(".ord",this).html("&#9660;");
					}
					rearrangeExpedRows( sortBy( getter ) );
				}
			});
		},

		// returns a sorting method ( data("sortBy"), and whether it is ascending or descending. )
		// returns "null", if none is active.
		getActiveSortMethod: function() {
			let expedTableRoot = $("#exped_table_content_root");
			let activeSorters = $(".sort_control .sort_methods button.active", expedTableRoot);
			console.assert(activeSorters.length <= 1, "should only be at most one active sorter at any time");
			if (activeSorters.length === 0)
				return null;
			let sorter = activeSorters.first();
			let ordText = $(".ord", sorter).html();
			let order = $(".ord", sorter).data("order");
			let ascending;
			// instead of having another state to maintain, let's just track sorting order
			// by testing the text carried by ".ord", and require that active sorter
			// must have it set to either "⬆" or "⬇".
			console.debug("Order text", ordText);
			ascending = order === "asc";
			/*if (order === "asc") {
				ascending = true;
			} else if (order === "desc") {
				ascending = false;
			} else {
				throw "active sorter found without ordering info";
			}*/
			return {
				method: sorter.data("sortBy"),
				ascending
			};
		},

		deselectResourceSorters: function() {
			let expedTableRoot = $("#exped_table_content_root");
			$(".sort_control .sort_methods button.resource", expedTableRoot).each( function() {
				$(this).removeClass("active");
				$(".ord",this).empty();
			});
		},

		setupViewControls: function() {
			let self = this;
			let expedTableRoot = $("#exped_table_content_root");

			$(".view_control .force_general", expedTableRoot).click( function() {
				$(this).toggleClass("active");
				self.refreshAllExpedRows();
			});

			let jqDenomControls = $(".view_control .denom_control button", expedTableRoot);
			jqDenomControls.click( function() {
				let thisMode = $(this).data("mode");
				let alreadyActive = $(this).hasClass("active");
				jqDenomControls.each( function() {
					let thatMode = $(this).data("mode");
					$(this).toggleClass("active", thisMode === thatMode );
				});
				if (alreadyActive)
					return;

				// deselect some sorters because a view change might affect
				// sorting result of them.
				self.deselectResourceSorters();

				self.refreshAllExpedRows();
			});
			let jqIncomeControls = $(".view_control .income_control button", expedTableRoot);
			jqIncomeControls.click( function() {
				let thisMode = $(this).data("mode");
				let alreadyActive = $(this).hasClass("active");
				jqIncomeControls.each( function() {
					let thatMode = $(this).data("mode");
					$(this).toggleClass("active", thisMode === thatMode );
				});
				if (alreadyActive)
					return;

				// deselect some sorters because a view change might affect
				// sorting result of them.
				self.deselectResourceSorters();

				self.refreshAllExpedRows();
			});
			// setup view strategy: total, basic income.
			// we don't have to save state internally, one just need to find the active
			// button from page itself.
			jqDenomControls.filter("[data-mode=total]").click();
			jqIncomeControls.filter("[data-mode=basic]").click();
		},

		refreshAllExpedRows: function() {
			let self = this;
			let expedTableRoot = $("#exped_table_content_root");
			let expedConfig = loadExpedConfig();
			$(".exped_row", expedTableRoot).each( function() {
				let jq = $(this);
				let eId = parseInt(jq.data("id"), 10);
				let config = expedConfig[eId];
				self.setupExpedView.call(self, jq, config, eId);
			});
		},

		// the "setup" does not include UI initialization, just those that can be changed due to
		// the change of a config.
		setupExpedView: function(jqViewRoot, config, eId) {
			let expedTableRoot = $("#exped_table_content_root");

			let forceGeneral =
				$(".view_control .force_general", expedTableRoot).hasClass("active");
			let modViewByGeneral = forceGeneral ||
				config.modifier.type !== "normal";
			$(".modifier .view.view_general", jqViewRoot).toggle( modViewByGeneral );
			$(".modifier .view.view_normal", jqViewRoot).toggle( !modViewByGeneral );

			let costViewByGeneral = forceGeneral ||
				config.cost.type !== "costmodel" ||
				(config.cost.type === "costmodel" &&
				 config.cost.wildcard === false);
			$(".cost .view.view_general", jqViewRoot).toggle( costViewByGeneral );
			$(".cost .view.view_normal", jqViewRoot).toggle( !costViewByGeneral );

			let generalModifier = Expedition.modifierToNumber( config.modifier );

			let gainPercent = (generalModifier-1.0)*100;
			$(".modifier .view.view_general", jqViewRoot).text(
				prettyFloat(gainPercent,2,true) + "%");

			if (config.modifier.type === "normal") {
				$(".modifier .view.view_normal img.gs", jqViewRoot).attr(
					"src", config.modifier.gs
						? "../../assets/img/ui/btn-gs.png"
						: "../../assets/img/ui/btn-xgs.png" );
				$(".modifier .view.view_normal .dht_times", jqViewRoot).text(
					"x" + config.modifier.daihatsu);
			}

			let computedCost = computeActualCost(config.cost,eId);
			$(".cost .view.view_general .fuel", jqViewRoot).text(String(-computedCost.fuel));
			$(".cost .view.view_general .ammo", jqViewRoot).text(String(-computedCost.ammo));
			if (!costViewByGeneral) {
				$(".cost .view.view_normal .limit", jqViewRoot)
					.text("≥" + config.cost.count);
				$(".cost .view.view_normal .wildcard", jqViewRoot)
					.text("(*=" + config.cost.wildcard + ")");
			}

			// work out resource info to show last,
			// because by now we have "computedCost" and "generalModifier" available.
			let denomMode =
				$(".view_control .denom_control button.active",expedTableRoot).data("mode");
			let incomeMode =
				$(".view_control .income_control button.active",expedTableRoot).data("mode");
			console.assert( ["total","hourly"].indexOf( denomMode ) !== -1);
			console.assert( ["gross","net","basic"].indexOf( incomeMode ) !== -1);

			let expedInfo = jqViewRoot.data("info");
			function processResource(basicValue, resourceName) {
				let grossValue = Math.floor(basicValue * generalModifier);
				let netValue = typeof computedCost[resourceName] !== "undefined"
					? grossValue - computedCost[resourceName]
					: grossValue;
				let subTotal = incomeMode === "basic" ? basicValue
					: incomeMode === "gross" ? grossValue : netValue;
				return denomMode === "total" ? subTotal
					: (subTotal * 60.0) / expedInfo.time;
			}
			// for recording final resource value
			let actual = {};
			["fuel", "ammo", "steel", "bauxite"].forEach( function(name) {
				actual[name] = processResource(expedInfo[name], name);
				let resourceText = denomMode === "total" ? String(actual[name])
					: prettyFloat(actual[name]);
				$(".info_col." + name, jqViewRoot).text( resourceText );
			});
			jqViewRoot.data("actual", actual);

		},

		// the "setup" does not include UI initialization, just those that can be changed due to
		// the change of a config.
		setupExpedConfig: function(jqConfigRoot, config, eId) {
			let jqIMRoot = $(".modifier .content", jqConfigRoot);

			$("input[type=radio]", jqIMRoot).filter("[value=" + config.modifier.type + "]")
				.prop("checked", true).change();

			// we try to fill in as much as info as we can for the other option.
			if (config.modifier.type === "normal") {
				// normal
				$("input[type=checkbox][name=gs]",jqIMRoot)
					.prop("checked", config.modifier.gs);
				$("select.dht",jqIMRoot).val(config.modifier.daihatsu);

				$("input.custom_val[type=text]",jqIMRoot)
					.val( prettyFloat(modifierToNumber(config.modifier)) );
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
			let jqCRoot = $(".cost .content", jqConfigRoot);

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

				let actualCost = computeActualCost( config.cost, eId );
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
		},

		getExpedConfig: function(jqConfigRoot, eId) {
			let modifier = {};
			let jqIMRoot = $(".modifier .content", jqConfigRoot);

			modifier.type = $("input[type=radio]:checked", jqIMRoot).val();
			console.assert( modifier.type === "normal" ||
							modifier.type === "custom" );

			if (modifier.type === "normal") {
				modifier.gs = $("input[type=checkbox][name=gs]",jqIMRoot).prop("checked");
				modifier.daihatsu = parseInt(
					$("select.dht",jqIMRoot).val(), 10);
			} else {
				modifier.value = $("input.custom_val[type=text]",jqIMRoot).val();
				// parse value, and then limit its range to 0.5 ~ 4.0.
				// a more practical range would be 1.0 ~ 1.95(=1.5*1.30)
				// but let's assume user knows what he is done and be more permissive.
				modifier.value = saturate(parseFloat( modifier.value ) || 1.0,
										  0.5, 4.0);

				// update user input to prevent UI out-of-sync due to normalization
				$("input.custom_val[type=text]",jqIMRoot).val( modifier.value );
			}

			let cost = {};
			let jqCRoot = $(".cost .content", jqConfigRoot);

			cost.type = $("input[type=radio]:checked", jqCRoot).val();
			console.assert( cost.type === "normal" ||
							cost.type === "custom" );
			if (cost.type === "normal") {
				cost.type = "costmodel";
				cost.wildcard = $("select.wildcard",jqCRoot).val();
				console.assert( ["None", "SS", "DD"].indexOf(cost.wildcard) !== -1);
				if (cost.wildcard === "None") {
					cost.wildcard = false;
					// force count to be 0, no matter what user sets.
					cost.count = 0;
				} else {
					cost.count = $("select.count",jqCRoot).val();
					cost.count = parseInt(cost.count, 10);
					console.assert( typeof cost.count === "number" &&
									cost.count >= 0 && cost.count <= 6);
				}
			} else {
				// custom
				let normalize = (raw) => {
					raw = parseInt(raw,10) || 0;
					// in case user decides to put down a negative value
					raw = Math.abs(raw);
					// limit cost range to 0~1000, sounds like a permissive range
					return saturate(raw,0,1000);
				};

				cost.fuel = $("input[type=text][name=fuel]", jqCRoot).val();
				cost.fuel = normalize(cost.fuel);

				cost.ammo = $("input[type=text][name=ammo]", jqCRoot).val();
				cost.ammo = normalize(cost.ammo);

				// update user input to prevent UI out-of-sync due to normalization
				$("input[type=text][name=fuel]", jqCRoot).val( cost.fuel );
				$("input[type=text][name=ammo]", jqCRoot).val( cost.ammo );
			}

			return {modifier, cost};
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
