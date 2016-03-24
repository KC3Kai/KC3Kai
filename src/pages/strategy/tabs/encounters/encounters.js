(function(){
	"use strict";
	
	KC3StrategyTabs.encounters = new KC3StrategyTab("encounters");
	
	KC3StrategyTabs.encounters.definition = {
		tabSelf: KC3StrategyTabs.encounters,
		
		list: [],
		
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
			
			KC3Database.con.encounters.toArray(function(response){
				self.list = response;
				
				$.each(self.list, function(index, encounter){
					if(encounter.world < 1) return true;
					
					// Check map box
					if( $("#encounter-"+encounter.world+"-"+encounter.map).length === 0){
						curBox = $(".tab_encounters .factory .encounter_map").clone();
						curBox.attr("id", "encounter-"+encounter.world+"-"+encounter.map);
						$(".encounter_world_head", curBox).text("World "+encounter.world+"-"+encounter.map);
						curBox.appendTo(".encounter_list");
					}
					// Check node box
					if( $("#encounter-"+encounter.world+"-"+encounter.map+" .node-"+encounter.node).length === 0){
						curBox = $(".tab_encounters .factory .encounter_node").clone();
						curBox.addClass("node-"+encounter.node);
						$(".encounter_node_head", curBox).text("Node "+KC3Meta.nodeLetter(encounter.world, encounter.map, encounter.node));
						curBox.appendTo("#encounter-"+encounter.world+"-"+encounter.map+" .encounter_world_body");
					}
					// Clone record box
					curBox = $(".tab_encounters .factory .encounter_record").clone();
					curBox.appendTo("#encounter-"+encounter.world+"-"+encounter.map+" .node-"+encounter.node+" .encounter_node_body");
					$(".encounter_formation img", curBox).attr("src", KC3Meta.formationIcon(encounter.form));
					
					shipList = JSON.parse(encounter.ke);
					$.each(shipList, function(shipIndex, shipId){
						if(shipId > -1){
							shipBox = $(".tab_encounters .factory .encounter_ship").clone();
							$(".encounter_icon img", shipBox).attr("src", KC3Meta.abyssIcon(shipId));
							$(".encounter_id", shipBox).text(shipId);
							shipBox.appendTo($(".encounter_ships", curBox));
						}
					});
					
				});
				
				//console.log(self.list);
			});
		}
		
	};
	
})();
