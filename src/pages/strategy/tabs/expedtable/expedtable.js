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
			count: 0 ~ 6
		  }
		
		  - custom:

		  { type: "custom",
		    fuel: integer (non-negative),
			ammo: integer (non-negative)
		  }
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

		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			var ExpedInfo = PS["KanColle.Expedition.New.Info"];
			var ExpedSType = PS["KanColle.Expedition.New.SType"];
			var factory = $(".tab_expedtable .factory");
			var expedTableRoot = $("#exped_table_content_root");
			var ExpedCostModel = PS["KanColle.Expedition.New.CostModel"];
			var Maybe = PS["Data.Maybe"];
			var PartialUnsafe = PS["Partial.Unsafe"];
			function calcCostModel(stypeInstance, num) {
				return ExpedCostModel.normalCostModel(stypeInstance)(num);
			}

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
				var resourceInfo = ExpedInfo.getInformation( eId ).resource;
				var masterInfo = KC3Master._raw.mission[eId];

				$(".info_col.id", expedRow).text( eId );
				$(".info_col.time", expedRow).text( String( 60 * masterInfo.api_time ).toHHMMSS() );

				["fuel", "ammo", "steel", "bauxite"].forEach( function(name) {
					$(".info_col." + name, expedRow).text( resourceInfo[name] );
				});

				makeWinItem( $(".info_col.item1", expedRow), masterInfo.api_win_item1 );
				makeWinItem( $(".info_col.item2", expedRow), masterInfo.api_win_item2 );
				
				var mkFlg = () => Math.random() > 0.5;
				
				var flg = mkFlg();
				$(".modifier .view.view_general", expedRow).toggle( flg );
				$(".modifier .view.view_normal", expedRow).toggle( !flg );

				var flg2 = mkFlg();
				$(".cost .view.view_general", expedRow).toggle( flg2 );
				$(".cost .view.view_normal", expedRow).toggle( !flg2 );
				
				$(".modifier .view.view_general", expedRow).text("+50.00%");

				$(".modifier .view.view_normal img.gs", expedRow).attr( 
					"src", mkFlg() 
						? "../../assets/img/ui/btn-gs.png" 
						: "../../assets/img/ui/btn-xgs.png" );
				$(".modifier .view.view_normal .dht_times", expedRow).text("x4");

				$(".cost .view.view_general .fuel", expedRow).text("-100");
				$(".cost .view.view_general .ammo", expedRow).text("-100");

				expedTableRoot.append( expedRow );
			});

			// setup cost model
			let contentRoot = $(".tab_expedtable #cost_model_content_root");
			let tableRoot = $("table", contentRoot);

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

			$("input#cost_model_fuel").slider(sliderSettings).on("change", function(e) {
				updateCostModelTable( "fuel", e.value.newValue );
			});
			$("input#cost_model_ammo").slider(sliderSettings).on("change", function(e) {
				updateCostModelTable( "ammo", e.value.newValue );
			});

			// setup table
			let stypeTexts = [
				"DD", "CL", "CVLike", "SSLike", 
				"CA", "BBV", "AS", "CT", "AV"];

			stypeTexts.map( function(stype) {
				let tblRow = $("<tr>");
				tblRow.append( $("<th>").text( stype ) );
				for (let i=1; i<=6; ++i) {

					let stypeInst = ExpedSType[stype].value;
					let costResult = calcCostModel(stypeInst, i);
					let cell;

					if (Maybe.isJust( costResult )) {
						cell = $(".tab_expedtable .factory .cost_cell").clone();
						let costSum = PartialUnsafe.unsafePartial(Maybe.fromJust)
							(costResult).reduce( function(acc, cur) {
							return { ammo: acc.ammo + cur.ammo,
									 fuel: acc.fuel + cur.fuel };
						}, {ammo: 0, fuel: 0});

						cell.data( "max-cost", costSum );
					} else {
						cell = $(".tab_expedtable .factory .cost_cell_na").clone();
					}
					tblRow.append( $("<td />").append(cell) );
				}
				
				tableBody.append( tblRow );
			});

			updateCostModelTable("fuel", 80);
			updateCostModelTable("ammo", 80);
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
