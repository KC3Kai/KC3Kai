(function(){
	"use strict";

	let ExpedInfo = PS["KanColle.Expedition.New.Info"];

	let enumFromTo = Expedition.enumFromTo;
	let saturate = Expedition.saturate;

	// - a preset overwrites user choices
	// - recommended: exclude some non-beneficial expeditions
	// - buckets: all expeditions that might yield buckets. (item2 included, without considering GS)
	let recommendedBlacklist = [22,29,30,31,33,34];
	let presets = {
		"all": Expedition.allExpedIds,
		"recommended": Expedition.allExpedIds.filter( x => recommendedBlacklist.indexOf(x) === -1),
		"buckets": [2,4,9,10,11,13,14,18,24,26,36,39,40],
		"none": []
	};

	KC3StrategyTabs.expedscorer = new KC3StrategyTab("expedscorer");

	KC3StrategyTabs.expedscorer.definition = {
		tabSelf: KC3StrategyTabs.expedscorer,

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
		},

		setupControls() {
			let factoryRoot = $(".tab_expedscorer .factory");
			let jqRoot = $(".tab_expedscorer #exped_scorer_control_root");
			let jqControlRow1 = $(".control_row.row1", jqRoot);

			// setup expedition checkboxes
			enumFromTo(1,5).map( world => {
				let jqBox = $(".control_box", factoryRoot).clone();
				jqBox.data("world", world);
				jqBox.addClass("world");

				$(".header",jqBox).text("World " + world);

				enumFromTo(8*world-7, 8*world).map( eId => {
					let jqExpedEntry = $("label.exped_toggle", factoryRoot).clone();
					jqExpedEntry.data("eid", eId);
					$(".name",jqExpedEntry).text( eId );
					let timeText = (ExpedInfo.getInformation(eId).timeInMin*60)
						.toString()
						.toHHMMSS()
						.substring(0,5);
					$(".time",jqExpedEntry).text( timeText );
					jqBox.append( jqExpedEntry );
				});
				jqBox.insertBefore($(">.control_box.preset", jqControlRow1));
			});

			let jqExpeds = $(".control_box.world .exped_toggle", jqRoot);
			// setup preset buttons
			$(".control_box.preset button",jqRoot).click( function() {
				let jq = $(this);
				let preset = presets[ jq.data("name") ];
				console.assert( typeof preset !== "undefined" );
				jqExpeds.each( function() {
					let jq = $(this);
					$("input[type=checkbox]", jq)
						.prop("checked", preset.indexOf(jq.data("eid")) !== -1);
				});
			});

			let jqControlRow2 = $(".control_row.row2", jqRoot);
			let jqResourceControl = $(".control_box.resource .content", jqControlRow2);

			// setup resource priority sliders
			// note that resources are handled in f/s/a/b order
			// to match the in-game resource panel layout
			["fuel","steel","ammo","bauxite"].map( (resourceName, ind) => {
				let jqBox = $(".resource_box", factoryRoot).clone();
				jqBox.addClass(resourceName);
				$("img",jqBox).attr("src", "../../assets/img/client/"+resourceName+".png");
				let jqView = $(".view", jqBox);
				// value initialzation is left undone on purpose,
				// after all things get setup, we will trigger a resource slider reset event
				// which should then initialize every slider and attached view properly.
				let sliderSettings = {
					min: -5, max: 20, step: 1,
					tooltip: "hide"
				};
				let slider = $("input.slider",jqBox)
					.slider(sliderSettings)
					.change(function (e) {
						jqView.text(e.value.newValue);
					});
				jqBox.data("slider",slider);
				jqBox.data("name",resourceName);
				jqBox.insertBefore( $("button.reset", jqResourceControl) );
				if (ind === 1 || ind === 3) {
					$("<div></div>").addClass("clear")
						.insertBefore( $("button.reset", jqResourceControl) );
				}
			});

			$("button.reset", jqResourceControl).click( function() {
				$(".resource_box", jqResourceControl).each( function() {
					let slider = $(this).data("slider");
					slider
						.trigger( $.Event("change", {value: {newValue: 5}}) )
						.slider("setValue", 5);
				});
			});

			$("button.reset").click();

			$(".control_box.calc button.calc").click( () => this.computeResults() );

			// setup default values (TODO: will save changes to localStorage)
			$(".control_box.preset button[data-name=recommended]",jqRoot).click();
			$(".control_box.fleet input[type=radio][name=fleet_count][value=3]",jqRoot)
				.prop("checked",true);
		},

		computeResults() {
			let jqRoot = $(".tab_expedscorer #exped_scorer_control_root");
			let calcBtn = $(".control_box.calc button.calc");
			// prevent running same computation more than once if user has clicked too quick
			calcBtn.prop("disabled", true);

			let resultTable = $(".tab_expedscorer .results tbody");
			resultTable.empty();

			let candidateIds = [];
			$(".control_box.world .exped_toggle",jqRoot)
				.each(function() {
					if ( $("input[type=checkbox]", this).prop("checked") ) {
						candidateIds.push( $(this).data("eid") );
					}
				});

			let resourceWeight = {};
			$(".resource_box", jqRoot).each( function() {
				let jq = $(this);
				let name = jq.data("name");
				let weight = jq.data("slider").slider("getValue");
				resourceWeight[name]=weight;
			});
			console.log( resourceWeight );

			// get afk time, and write back normalized values
			let jqHrs = $(".control_box.afktime input[type=text][name=hrs]",jqRoot);
			let jqMins = $(".control_box.afktime input[type=text][name=mins]",jqRoot);
			let afkHH = parseInt( jqHrs.val() , 10);
			let afkMM = parseInt( jqMins.val(), 10);
			jqHrs.val(afkHH);
			jqMins.val(afkMM);

			let afkTimeInMin = afkHH*60 + afkMM;

			let fleetCount = parseInt( $(".control_box.fleet input[type=radio]:checked", jqRoot).val(), 10);
			console.assert( typeof fleetCount === "number" &&
							fleetCount > 0 && fleetCount <= 3);


			// make sure we reload config every time
			// so user can also have expedtable opened and whatever changes made there
			// gets used immediately here.
			let config = Expedition.loadExpedConfig(true);

			// only compute income table for selected elements
			let infoTable = {};
			candidateIds.map( (eId) => {
				let info = ExpedInfo.getInformation(eId);
				infoTable[eId] = Expedition.computeNetIncome(config[eId],eId);
				infoTable[eId].timeInMin = Math.max(afkTimeInMin, info.timeInMin);
			});

			// mark score on income
			function markScore(income) {
				income.score = ["fuel","ammo","steel","bauxite"]
					.map( resourceName => income[resourceName] * resourceWeight[resourceName] )
					.reduce( (a,b) => (a+b), 0);
				return;
			}

			let results = Expedition
				.chooseN(candidateIds, fleetCount)
				.map( function( expedSet ) {
					let retVal = {
						set: expedSet,
						fuel: 0, ammo: 0, steel: 0, bauxite: 0
					};
					expedSet.map( function (eId) {
						let info = infoTable[eId];
						["fuel","ammo","steel","bauxite"].map( function(resourceName) {
							retVal[resourceName] += info[resourceName] * 60 / info.timeInMin;
						});
					});
					markScore(retVal);
					return retVal;
				})
				.sort( (a,b) => b.score - a.score )
				.slice(0,50); // take only top 50

			results.map( function (curVal) {
				let row = $('<tr></tr>');
				$('<td></td>').text(curVal.set.join(",")).appendTo(row);
				$('<td></td>').text(curVal.fuel.toFixed(2)).appendTo(row);
				$('<td></td>').text(curVal.ammo.toFixed(2)).appendTo(row);
				$('<td></td>').text(curVal.steel.toFixed(2)).appendTo(row);
				$('<td></td>').text(curVal.bauxite.toFixed(2)).appendTo(row);
				$('<td></td>').text(curVal.score.toFixed(2)).appendTo(row);
				resultTable.append( row );
			});

			$(".tab_expedscorer .results").show();

			calcBtn.prop("disabled", false);
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			this.setupControls();
		}
	};

})();
