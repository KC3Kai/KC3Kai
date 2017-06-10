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

	/*
		data format for localStorage.srExpedscorer:

		{ candidates: [list of expedition ids, sorted]
		, priority: [4 elements for fuel, ammo, steel, bauxite, in this order]
		, afkTime: integer, in minutes
		, fleetCount: 1/2/3
		}

	 */
	function loadUserSelections() {
		if (typeof localStorage.srExpedscorer !== "undefined") {
			return JSON.parse( localStorage.srExpedscorer );
		}

		return {
			candidates: enumFromTo(1,40),
			priority: [5,5,5,5],
			afkTime: 0,
			fleetCount: 3
		};
	}

	KC3StrategyTabs.expedscorer = new KC3StrategyTab("expedscorer");

	KC3StrategyTabs.expedscorer.definition = {
		tabSelf: KC3StrategyTabs.expedscorer,

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
		},

		resetResourcePriority(newPriority) {
			let jqResourceControl = $(".tab_expedscorer .control_box.resource .content");

			$(".resource_box", jqResourceControl).each( function() {
				let jq = $(this);
				let slider = jq.data("slider");
				let newPri = newPriority[jq.data("name")];
				slider
					.trigger( $.Event("change", {value: {newValue: newPri}}) )
					.slider("setValue", newPri);
			});

		},

		setupControls() {
			let self = this;
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
				self.invalidateResult();
			});

			$("input[type=checkbox]", jqExpeds)
				.change( () => self.invalidateResult() );

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
						self.invalidateResult();
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
				self.resetResourcePriority( { fuel: 5, ammo: 5, steel: 5, bauxite: 5 } );
			});

			$("button.balanced", jqResourceControl).click( function() {
				let currentResources;
				try {
					if (PlayerManager.hq.lastMaterial === null)
						throw "hq.lastMaterial is empty";
					currentResources = PlayerManager.hq.lastMaterial;
				} catch (e) {
					console.warn("Error while getting hq resources", e);
					currentResources = [0,0,0,0];
				}
				// * +10 for making every value non-zero
				// * use (300000 + 10) so that there are fewer significant digits
				//   in floating parts
				let currentResourcesWeighted = currentResources
					.map( x => 300010 /(x + 10) );
				let maxVal = Math.max.apply(undefined, currentResourcesWeighted);
				let scaledRate = currentResourcesWeighted.map( x => saturate(Math.round( x*20/maxVal ),0,20) );

				self.resetResourcePriority({
					fuel: scaledRate[0],
					ammo: scaledRate[1],
					steel: scaledRate[2],
					bauxite: scaledRate[3]
				});
			});

			$(".control_box.fleet input[type=radio][name=fleet_count]")
				.change( () => self.invalidateResult() );

			$(".control_box.afktime input[type=text]")
				.change( () => self.invalidateResult() );

			$(".control_box.calc button.calc").click( () => this.computeResults() );

			// setup default values
			let userSelections = loadUserSelections();

			jqExpeds.each( function() {
				let jq = $(this);
				let eId = jq.data("eid");
				$("input[type=checkbox]", jq)
					.prop("checked", userSelections.candidates.indexOf(eId) !== -1);
			});

			let userPri = userSelections.priority;
			self.resetResourcePriority({
				fuel: userPri[0],
				ammo: userPri[1],
				steel: userPri[2],
				bauxite: userPri[3]});

			let afkHH = Math.floor( userSelections.afkTime / 60 );
			let afkMM = userSelections.afkTime - afkHH*60;
			console.debug("afkHH, afkMM", afkHH, afkMM);
			$(".control_box.afktime input[type=text][name=hrs]",jqRoot).val(afkHH);
			$(".control_box.afktime input[type=text][name=mins]",jqRoot).val(afkMM);

			$(".control_box.fleet input[type=radio][name=fleet_count][value="
			  + userSelections.fleetCount + "]",jqRoot)
				.prop("checked",true);
		},

		// adds a out-of-sync mark if the result table is visible
		invalidateResult() {
			if ($(".control_box.calc").hasClass("out_of_sync"))
				return;

			if ($(".tab_expedscorer .results").is(":visible") ) {
				$(".control_box.calc").addClass("out_of_sync");
				$(".control_box.calc button.calc")
					.attr("title","Settings may have been changed, please re-calculate");
			}
		},

		computeResults() {
			let jqRoot = $(".tab_expedscorer #exped_scorer_control_root");
			$(".control_box.calc")
				.removeClass("out_of_sync");
			$(".control_box.calc button.calc").removeAttr("title");

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

			// now save user selections
			localStorage.srExpedscorer = JSON.stringify( {
				candidates: candidateIds,
				priority: [resourceWeight.fuel,
						   resourceWeight.ammo,
						   resourceWeight.steel,
						   resourceWeight.bauxite],
				afkTime: afkTimeInMin,
				fleetCount });

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
