(function(){
	"use strict";

	KC3StrategyTabs.shipdrop = new KC3StrategyTab("shipdrop");

	KC3StrategyTabs.shipdrop.definition = {
		tabSelf: KC3StrategyTabs.shipdrop,

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
			let contentRoot = $(".tab_shipdrop .content_root");
			let factory = $(".tab_shipdrop .factory");
			let hq = PlayerManager.hq.id;
			let world = 37;
			let subMap = 3;
			let sorties37_1 = KC3Database.con.sortie.where("world").equals(world).and( data => data.mapnum === subMap && data.hq === hq);
			let dropTable = {};
			let pList = [];

			sorties37_1.each( function(sortie) {
				let p = KC3Database.con.battle.where("sortie_id").equals(sortie.id).each( function(battle) {
					if (typeof dropTable[battle.node] === "undefined")
						dropTable[battle.node] = {};
					let tbl = dropTable[battle.node];
					if (typeof tbl[battle.drop] === "undefined") {
						tbl[battle.drop] = 0;
					}
					++ tbl[battle.drop];
				});
				pList.push(p);
			}).then( function() {
				Promise.all(pList).then( function() {
					$.each( dropTable, function(nodeNum, dropInfo) {
						let nodeDrop = $(".node_drop", factory).clone();
						$(".node_name", nodeDrop).text( "Node: " + KC3Meta.nodeLetter(world,subMap,nodeNum));
						let keys = Object.keys( dropInfo );
						keys.sort( (ka,kb) => dropInfo[kb] - dropInfo[ka] );
						$.each( keys, function(ind,mstId) {
							let count = dropInfo[mstId];
							let shipPanel = $(".ship", factory).clone();
							let name = KC3Master.ship(mstId).api_name || "<nothing>";
							if (mstId !== "0") {
								console.log( mstId );
								$("img", shipPanel).attr("src", KC3Meta.getIcon( mstId ));
							} else {
								$("img", shipPanel).attr("src", "../../assets/img/ui/dark_shipdrop-x.png");
							}
							$(".drop_times", shipPanel).text( "x" + count );
							shipPanel.appendTo( nodeDrop );
						});
						nodeDrop.append( $('<div class="clear"></div>') );
						nodeDrop.appendTo( contentRoot );

					});
				});
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
