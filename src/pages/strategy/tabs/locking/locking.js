(function(){
	"use strict";
	
	KC3StrategyTabs.locking = new KC3StrategyTab("locking");
	
	KC3StrategyTabs.locking.definition = {
		tabSelf: KC3StrategyTabs.locking,
		
		lock_plan: [[],[],[],[],[]], // array of ship rosterIds planned earlier saved on localStorage
		boxContents: [[],[],[],[],[],[]], // array of ship objects based on lock_plan
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Shiplock Plan
			if(typeof localStorage.lock_plan != "undefined"){
				this.lock_plan = JSON.parse(localStorage.lock_plan);
			}
			
			// Cache ship info
			var ctr, ThisShip, containingBox;
			for(ctr in KC3ShipManager.list){
				ThisShip = KC3ShipManager.list[ctr];
				
				// If already locked in-game
				if(ThisShip.sally > 0){
					this.boxContents[ ThisShip.sally-1 ].push( ThisShip );
					ThisShip.isGameSallied = function(){ return true; };
					
				// If not locked in-game, check for lock_plans
				}else{
					ThisShip.isGameSallied = function(){ return false; };
					
					// Find where this ship is planned to go, defaults to index=5 if reserved list
					containingBox = this.findShipOnBoxes( ThisShip.rosterId );
					this.boxContents[ containingBox ].push( ThisShip );
				}
			}
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			var shipBox;
			$.each(this.boxContents, function(boxIndex, ShipList){
				$.each(ShipList, function(shipIndex, ThiShip){
					// If a normal colored box
					if(boxIndex < 5){
						shipBox = $(".tab_locking .factory .lship").clone().appendTo(".tab_locking .lock_mode_"+(boxIndex+1)+" .ships_area");
						$("img", shipBox).attr("src", KC3Meta.shipIcon(ThiShip.masterId));
						
						// If ship is already lcoked in-game
						if(ThiShip.isGameSallied()){
							shipBox.addClass("gamelocked");
						}
						
						
					// If the reserved list
					}else{
						shipBox = $(".tab_locking .factory .rship").clone().appendTo(".tab_locking .reserved_list");
						$(".ship_img img", shipBox).attr("src", KC3Meta.shipIcon(ThiShip.masterId));
						$(".ship_type", shipBox).text( ThiShip.stype() );
						$(".ship_lv", shipBox).text("Lv."+ ThiShip.level );
						shipBox.data("rosterId", ThiShip.rosterId );
						shipBox.attr("title", ThiShip.name() );
					}
				});
				$("<div>").addClass("clear").appendTo(".tab_locking .lock_mode_"+(boxIndex+1));
			});
			$("<div>").addClass("clear").appendTo(".tab_locking .reserved_list");
			
			$(".rship").draggable({
				revert: "invalid",
				containment: '.planner_area',
				addClasses: false
			});
			
			var droppedOnBoxId, draggedRosterId, draggedCurrentPlan;
			$(".drop_area").droppable({
				accept: ".rship",
				addClasses: false,
				drop: function(event, ui){
					droppedOnBoxId = Number($(this).attr("data-boxId"));
					draggedRosterId = Number(ui.draggable.data("rosterId"));
					ui.draggable.remove();
					
					draggedCurrentPlan = self.findShipOnBoxes( draggedRosterId );
					
					// ship was previously on reseved list
					if(draggedCurrentPlan == 5){
						self.lock_plan[ droppedOnBoxId ].push( draggedRosterId );
						shipBox = $(".tab_locking .factory .lship").clone().appendTo(".tab_locking .lock_mode_"+(droppedOnBoxId+1)+" .ships_area");
						$("img", shipBox).attr("src", KC3Meta.shipIcon( KC3ShipManager.get(draggedRosterId).masterId) );
						
						localStorage.lock_plan = JSON.stringify(self.lock_plan);
						
					}else{
						
					}
				}
			});
			
		},
		
		findShipOnBoxes :function( rosterId ){
			for(var ctr in this.lock_plan){
				if(this.lock_plan[ctr].indexOf( rosterId ) > -1){
					return ctr;
				}
			}
			return 5;
		}
	};
	
})();