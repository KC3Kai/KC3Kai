(function(){
	"use strict";

	KC3StrategyTabs.expedscorer = new KC3StrategyTab("expedscorer");

	KC3StrategyTabs.expedscorer.definition = {
		tabSelf: KC3StrategyTabs.expedscorer,

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){

		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){

			// Add all expedition numbers on the list
			var KE = PS["KanColle.Expedition"];
			$('.tab_expedscorer .expedNumbers').html("");
			KE.allExpeditions.forEach( function(curVal, ind) {
				var row = $('.tab_expedscorer .factory .expedNum').clone();
				$(".expedCheck input", row).attr("value", curVal.id.toString());
				$(".expedText", row).text( curVal.id.toString() );
				$(".expedTime", row).text( (curVal.cost.time*60).toString().toHHMMSS().substring(0,5) );

				var boxNum = Math.ceil((ind+1)/8);
				$(".tab_expedscorer .expedNumBox_"+boxNum).append( row );
			});

			// Add world toggle
			$(".tab_expedscorer .expedNumBox")
				.filter(function(i,x){return $(x).hasClass("expedNumBox_"+(i+1));})
				.each(function(i,x){
					var
						row = $('.tab_expedscorer .factory .expedNum').clone().addClass("expedWhole").removeClass("expedNum"),
						val = true;
					$("input",".expedNumBox_"+(i+1)).each(function(id,elm){
						val&= $(elm).prop("checked");
					});
					$(row)
						.find(".expedCheck input")
							.attr("value", i+1)
							.prop("checked", val)
						.end()
						.find(".expedText")
							.text( "World " + (i+1) )
						.end()
						.find(".expedTime")
							.remove()
						.end();

					$(x).prepend(row);
				}).on("click", '.expedNum input', function(){
					var
						worldNum     = Math.qckInt("ceil",($(this).attr("value")) / 8),
						context      = ".tab_expedscorer .expedNumBox_"+worldNum,
						parentCheck  = true;
					self.exped_filters = [];
					$(".expedNum   input",context).each(function(i,x){ parentCheck &= $(x).prop("checked"); });
					$(".expedWhole input",context).prop("checked",parentCheck);
				}).on("click", ".expedWhole input", function() {
					var
						worldNum = $(this).val(),
						state    = $(this).prop("checked"),
						expeds   = $(".tab_expedscorer .expedNumBox_"+worldNum+" .expedNum input");
					expeds.each(function(i,x){
						var
							elmState = $(x).prop("checked"),
							expedNum = parseInt($(x).val());
						if(elmState ^ state) { // check different state
							$(x).prop("checked",state);
						}
					});
				});

			// Calculate
			var resultTable = $('.tab_expedscorer .results tbody');
			$('.tab_expedscorer .calculate_btn').click(function(){
				var fP = parseInt($(".tab_expedscorer .priorityFuel").val(), 10);
				var aP = parseInt($(".tab_expedscorer .priorityAmmo").val(), 10);
				var sP = parseInt($(".tab_expedscorer .prioritySteel").val(), 10);
				var bP = parseInt($(".tab_expedscorer .priorityBaux").val(), 10);
				var afkHH = parseInt($(".tab_expedscorer .afkH").val(), 10);
				var afkMM = parseInt($(".tab_expedscorer .afkM").val(), 10);
				var afkTime = afkHH*60 + afkMM;
				var fleetCount = parseInt( $(".tab_expedscorer .fleetCounts input:checked").val(), 10);

				let ExpedInfo = PS["KanColle.Expedition.New.Info"];
				var selectedItemsQ = $('.tab_expedscorer .expedNumBox .expedNum input:checked');
				var selectedItems = [];
				selectedItemsQ.each( function() {
					selectedItems.push( parseInt( $(this).attr("value"),10) );
				});

				// make sure we reload config every time
				// so user can also have expedtable opened and whatever changes made there
				// gets used immediately here.
				let config = Expedition.loadExpedConfig(true);

				// only compute income table for selected elements
				let infoTable = {};
				selectedItems.map( (eId) => {
					let info = ExpedInfo.getInformation(eId);
					infoTable[eId] = Expedition.computeNetIncome(config[eId],eId);
					infoTable[eId].timeInMin = Math.max(afkTime, info.timeInMin);
				});

				// mark score on income
				function markScore(income) {
					income.score = income.fuel*fP + income.ammo*aP + income.steel*sP + income.bauxite*bP;
					return income.score;
				}

				let results = Expedition
					.chooseN(selectedItems, fleetCount)
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

				resultTable.empty();

				for (let i = 0; i < results.length && i < 50; ++i) {
					let curVal = results[i];
					let row = $('<tr></tr>');
					$('<td></td>').text(curVal.set.join(",")).appendTo(row);
					$('<td></td>').text(curVal.fuel.toFixed(2)).appendTo(row);
					$('<td></td>').text(curVal.ammo.toFixed(2)).appendTo(row);
					$('<td></td>').text(curVal.steel.toFixed(2)).appendTo(row);
					$('<td></td>').text(curVal.bauxite.toFixed(2)).appendTo(row);
					$('<td></td>').text(curVal.score.toFixed(2)).appendTo(row);
					resultTable.append( row );
				}
			});
		}

	};

})();
