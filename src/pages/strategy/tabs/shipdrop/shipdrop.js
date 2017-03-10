(function(){
	"use strict";

	KC3StrategyTabs.shipdrop = new KC3StrategyTab("shipdrop");

	var exexe = {
		show_all : false ,
		world  :  0 ,
		subMap :  0 ,
		exe : function(){
				console.log("exexe" , this.world , this.subMap);
				let contentRoot = $(".tab_shipdrop .content_root");
				let factory = $(".tab_shipdrop .factory");
				let hq = PlayerManager.hq.id;
				let sorties37_1 = KC3Database.con.sortie.where("world").equals(this.world).and( data => data.mapnum === this.subMap && data.hq === hq);
				let dropTable = {};
				let pList = [];
				var self = this;
				sorties37_1.each( function(sortie) {
					let p = KC3Database.con.battle.where("sortie_id").equals(sortie.id).each( function(battle) {
						if (typeof dropTable[battle.node] === "undefined"){
							dropTable[battle.node] = {};
						}
						let tbl = dropTable[battle.node];
						if (typeof tbl[battle.drop] === "undefined") {
							tbl[battle.drop] = 0;
						}
						++ tbl[battle.drop];
					});
					pList.push(p);
				}).then( function() {
					Promise.all(pList).then( function() {
					let node_tot = {};
					$.each( dropTable, function(nodeNum, dropInfo) {
						let node = KC3Meta.nodeLetter(self.world,self.subMap,nodeNum);
						if(typeof node_tot[node] === "undefined") node_tot[node] = {};

						let keys = Object.keys( dropInfo );
						keys.sort( (ka,kb) => dropInfo[kb] - dropInfo[ka] );
						//handle the drop info
						$.each( keys, function(ind,mstId) {
							let count = dropInfo[mstId];
							let shipPanel = $(".ship", factory).clone();
							let name = KC3Master.ship(mstId).api_name || "<nothing>";
							if(mstId !== "0" && name != "<nothing>") {
								if(typeof node_tot[node][mstId] == "undefined") node_tot[node][mstId] = 0;
								node_tot[node][mstId] += count;
							}
							else {
								if(typeof node_tot[node][0] === "undefined") node_tot[node][0] = 0;
								node_tot[node][0] += count;
							}
						});
					});

					let keys_node = Object.keys( node_tot );
					keys_node.sort( (ka,kb) => ka - kb );
					$.each(keys_node , function(i , node) {
						var shipClickFunc = function(e){
							KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
						};
						console.log("Node: " + node);
						let nodeDrop = $(".node_drop", factory).clone();
						$(".node_name", nodeDrop).text( "Node: " + node);
						let keys_ship = Object.keys( node_tot[node] );
						keys_ship.sort( (ka,kb) => ka - kb );
						$.each(keys_ship , function(i , ship_id){
							console.log( ship_id , node_tot[node][ship_id]);
							let shipPanel = $(".ship", factory).clone();
							if (ship_id !== "0") {
								$("img", shipPanel).attr("src", KC3Meta.getIcon( ship_id ));
								$("img", shipPanel).attr("alt", ship_id);
								$("img", shipPanel).addClass("hover");
								$("img", shipPanel).click(shipClickFunc);

							} else {
								$("img", shipPanel).attr("src", "../../assets/img/ui/dark_shipdrop-x.png");
							}
							$(".drop_times", shipPanel).text( "x" + node_tot[node][ship_id] );
							shipPanel.appendTo( nodeDrop );
						});
						nodeDrop.append( $('<div class="clear"></div>') );
						nodeDrop.appendTo( contentRoot );
					});
				});
			});
		}
	};

	
	//KC3StrategyTabs.shipdrop.definition = new KC3SortieLogs("shipdrop" , exexe);
})();
