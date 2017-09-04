(function(){
	"use strict";
	
	KC3StrategyTabs.encounters = new KC3StrategyTab("encounters");
	
	KC3StrategyTabs.encounters.definition = {
		tabSelf: KC3StrategyTabs.encounters,
		
		list: [],
		diffStrs: ["", "E", "N", "H"],
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			var curBox;
			var shipBox;
			var shipList = [];
			var shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			
			$(".loading").show();
			KC3Database.con.encounters.toArray(function(response){
				self.list = response;
				
				$.each(self.list, function(index, encounter){
					if(encounter.world < 1) return true;
					
					var diffStr = self.diffStrs[encounter.diff || 0] || "";
					// Check map box
					if( $("#encounter-"+encounter.world+"-"+encounter.map+diffStr).length === 0){
						curBox = $(".tab_encounters .factory .encounter_map").clone();
						curBox.attr("id", "encounter-"+encounter.world+"-"+encounter.map+diffStr);
						$(".encounter_world_head", curBox).text("World "+encounter.world+"-"+encounter.map+diffStr);
						curBox.appendTo(".encounter_list");
					}
					// Check node box
					var nodeLetter = KC3Meta.nodeLetter(encounter.world, encounter.map, encounter.node);
					var nodeName = encounter.name || "";
					curBox = $("#encounter-"+encounter.world+"-"+encounter.map+diffStr+" .node-"+nodeLetter);
					if( curBox.length === 0){
						curBox = $(".tab_encounters .factory .encounter_node").clone();
						curBox.addClass("node-"+nodeLetter);
						$(".encounter_node_head", curBox).text("Node {0} {1}".format(nodeLetter, nodeName));
						curBox.appendTo("#encounter-"+encounter.world+"-"+encounter.map+diffStr+" .encounter_world_body");
					} else if(!!nodeName){
						$(".encounter_node_head", curBox).text("Node {0} {1}".format(nodeLetter, nodeName));
					}
					// Check formation and ships box
					var curNodeBody = $("#encounter-"+encounter.world+"-"+encounter.map+diffStr+" .node-"+nodeLetter+" .encounter_node_body");
					var keSafe = encounter.ke.replace(/[\[\]\"\'\{\}]/g,"").replace(/[,:]/g,"_");
					curBox = $(".formke-"+encounter.form+keSafe, curNodeBody);
					if( curBox.length === 0 ){
						// Clone record box
						curBox = $(".tab_encounters .factory .encounter_record").clone();
						curBox.addClass("formke-"+encounter.form+keSafe);
						curBox.data("count", encounter.count || 1);
						curBox.data("nodeName", nodeName);
						curBox.appendTo(curNodeBody);
						$(".encounter_formation img", curBox).attr("src", KC3Meta.formationIcon(encounter.form));
						shipList = JSON.parse(encounter.ke);
						$.each(shipList, function(shipIndex, shipId){
							if(shipId > 0){
								shipBox = $(".tab_encounters .factory .encounter_ship").clone();
								$(".encounter_icon", shipBox).removeClass(KC3Meta.abyssShipBorderClass());
								$(".encounter_icon", shipBox).addClass(KC3Meta.abyssShipBorderClass(shipId));
								$(".encounter_icon img", shipBox).attr("src", KC3Meta.abyssIcon(shipId));
								$(".encounter_icon img", shipBox).attr("alt", shipId);
								$(".encounter_icon img", shipBox).click(shipClickFunc);
								$(".encounter_id", shipBox).text(shipId);
								$(shipBox).attr("title", KC3Meta.abyssShipName(shipId));
								shipBox.appendTo($(".encounter_ships", curBox));
							}
						});
						if(shipList.length > 6){
							$(".encounter_ships", curBox).addClass("combined");
						}
					} else {
						// Update count
						curBox.data("count", (encounter.count || 1) + curBox.data("count") );
						if(!!nodeName && curBox.data("nodeName")!==nodeName){
							curBox.data("nodeName", "{0}/{1}".format(curBox.data("nodeName"), nodeName) );
						}
					}
					let tooltip = "{0} x{1}".format(curBox.data("nodeName"), curBox.data("count"));
					let ap = KC3SortieManager.enemyFighterPower(shipList)[0];
					if(ap){
						tooltip += "\n" + KC3Meta.term("InferredFighterPower")
							.format(ap, Math.round(ap / 3), Math.round(2 * ap / 3),
								Math.round(3 * ap / 2), 3 * ap);
					}
					$(".encounter_formation", curBox).attr("title", tooltip);
				});
				
				$(".encounter_list").createChildrenTooltips();
				$(".loading").hide();
			});
		}
		
	};
	
})();
