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
					if( $("#encounter-"+encounter.world+"-"+encounter.map+diffStr+" .node-"+nodeLetter).length === 0){
						curBox = $(".tab_encounters .factory .encounter_node").clone();
						curBox.addClass("node-"+nodeLetter);
						$(".encounter_node_head", curBox).text("Node "+nodeLetter);
						curBox.appendTo("#encounter-"+encounter.world+"-"+encounter.map+diffStr+" .encounter_world_body");
					}
					// Clone record box
					var curNodeBody = $("#encounter-"+encounter.world+"-"+encounter.map+diffStr+" .node-"+nodeLetter+" .encounter_node_body");
					var keSafe = encounter.ke.replace(/[\[\]\"\'\{\}]/g,"").replace(/[,:]/g,"_");
					curBox = $(".formke-"+encounter.form+keSafe, curNodeBody);
					if( curBox.length === 0 ){
						curBox = $(".tab_encounters .factory .encounter_record").clone();
						curBox.addClass("formke-"+encounter.form+keSafe);
						curBox.data("count", encounter.count || 1);
						curBox.appendTo(curNodeBody);
						$(".encounter_formation img", curBox).attr("src", KC3Meta.formationIcon(encounter.form));
						$(".encounter_formation", curBox).attr("title", curBox.data("count"));
						shipList = JSON.parse(encounter.ke);
						$.each(shipList, function(shipIndex, shipId){
							if(shipId > 0){
								shipBox = $(".tab_encounters .factory .encounter_ship").clone();
								$(".encounter_icon img", shipBox).attr("src", KC3Meta.abyssIcon(shipId));
								$(".encounter_icon img", shipBox).attr("alt", shipId);
								$(".encounter_icon img", shipBox).click(shipClickFunc);
								$(".encounter_id", shipBox).text(shipId);
								shipBox.appendTo($(".encounter_ships", curBox));
							}
						});
					} else {
						curBox.data("count", (encounter.count || 1) + curBox.data("count") );
						$(".encounter_formation", curBox).attr("title", curBox.data("count"));
					}
					
				});
				
				//console.log(self.list);
			});
		}
		
	};
	
})();
