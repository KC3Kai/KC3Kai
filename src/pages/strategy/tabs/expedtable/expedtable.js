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
				var resourceInfo = ExpedInfo.getInformation( eId ).resource;
				var masterInfo = KC3Master._raw.mission[eId];

				$(".info_col.id", expedRow).text( eId );
				$(".info_col.time", expedRow).text( String( 60 * masterInfo.api_time ).toHHMMSS() );

				["fuel", "ammo", "steel", "bauxite"].forEach( function(name) {
					$(".info_col." + name, expedRow).text( resourceInfo[name] );
				});

				makeWinItem( $(".info_col.item1", expedRow), masterInfo.api_win_item1 );
				makeWinItem( $(".info_col.item2", expedRow), masterInfo.api_win_item2 );
				
				$(".modifier .view.view_general", expedRow).hide();
				$(".modifier .view.view_normal", expedRow).show();
				$(".cost .view.view_general", expedRow).show();
				$(".cost .view.view_normal", expedRow).hide();
				
				$(".modifier .view.view_general", expedRow).text("+50.00%");

				$(".modifier .view.view_normal img.gs", expedRow).attr( "src", "../../assets/img/ui/btn-gs.png" );
				$(".modifier .view.view_normal .dht_times", expedRow).text("x4");

				expedTableRoot.append( expedRow );
			});
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
