(function(){
	"use strict";
	
	KC3StrategyTabs.locking = new KC3StrategyTab("locking");
	
	KC3StrategyTabs.locking.definition = {
		tabSelf: KC3StrategyTabs.locking,
		
		// array of ship rosterIds planned earlier saved on localStorage
		lock_plan: [[],[],[],[],[]],
		// array of ship objects based on lock_plan
		boxContents: [[],[],[],[],[],[]],
		listReserved: [],
		loading: false,
		clearAllFlag: false,
		
		/* INIT
		Prepares initial static data needed
		---------------------------------*/
		init :function(){
		},
		
		/* RELOAD
		Loads latest player or game data if needed.
		---------------------------------*/
		reload :function() {
			this.boxContents = [[],[],[],[],[],[]];
			// Shiplock Plan
			if(typeof localStorage.lock_plan != "undefined"){
				this.lock_plan = JSON.parse(localStorage.lock_plan);
			}
			
			KC3ShipManager.load();
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
			this.listReserved = [];
			
			$.each(this.boxContents, function(boxIndex, ShipList){
				$.each(ShipList, function(shipIndex, ThiShip){
					// If a normal colored box
					if(boxIndex < 5){
						self.addShipToBox(boxIndex, ThiShip);
						
					// If current boxIndex is the reserved list
					}else{
						self.listReserved.push( ThiShip );
					}
				});
			});
			
			this.refreshReserved();
			
			var droppedOnBoxId, draggedRosterId, draggedCurrentPlan;
			$(".drop_area").droppable({
				accept: ".rship",
				addClasses: false,
				drop: function(event, ui){
					droppedOnBoxId = Number( $(this).attr("data-boxId") );
					draggedRosterId = Number( ui.draggable.attr("data-rosterId") );
					ui.draggable.remove();
					
					// Remove dragged ship from reserved list
					$.each(self.listReserved, function(index, element){
						if(element.rosterId == draggedRosterId){
							self.listReserved.splice(index, 1 );
							return false;
						}
					});
					
					// Save new plan data to storage
					self.lock_plan[ droppedOnBoxId ].push( draggedRosterId );
					localStorage.lock_plan = JSON.stringify(self.lock_plan);
					
					// Add icon to the colored list
					self.addShipToBox( droppedOnBoxId, KC3ShipManager.get(draggedRosterId) );
				}
			});
			
			var removingRoster, removingFromBox, removingShip, removingIndex;
			$(".tab_locking .ships_area").on("click", ".lship", function(event){
				if(self.loading && !self.clearAllFlag){ console.debug("nope"); return false; }
				
				// Get details of clicked ship
				removingRoster = Number( $(this).attr("data-rosterId") );
				removingFromBox = Number( $(this).attr("data-boxColorId") );
				removingShip = KC3ShipManager.get( removingRoster );
				
				// If not yet game locked
				if(!removingShip.isGameSallied()){
					// Remove icon and from data plan
					$(this).remove();
					removingIndex = self.lock_plan[ removingFromBox ].indexOf(removingRoster);
					self.lock_plan[ removingFromBox ].splice( removingIndex, 1 );
					localStorage.lock_plan = JSON.stringify(self.lock_plan);
					
					// Re-add ship to reserved list
					self.listReserved.push( KC3ShipManager.get(removingRoster) );
					
					if(!self.clearAllFlag){
						self.refreshReserved();
					}
				}
			});
			
			$(".clearAllPlans").on("click", function(){
				self.clearAllFlag = true;
				$(".lship").trigger("click");
				self.clearAllFlag = false;
				self.refreshReserved();
			});
			
		},
		
		addShipToBox :function(boxIndex, ThiShip){
			var shipBox = $(".tab_locking .factory .lship").clone().appendTo(".tab_locking .lock_mode_"+(boxIndex+1)+" .ships_area");
			$("img", shipBox).attr("src", KC3Meta.shipIcon(ThiShip.masterId));
			shipBox.attr("data-rosterId", ThiShip.rosterId );
			shipBox.attr("data-boxColorId", boxIndex);
			shipBox.attr("title", ThiShip.name()+" Lv."+ThiShip.level+" ("+ThiShip.stype()+")" );
			
			// If ship is already lcoked in-game
			if(ThiShip.isGameSallied()){
				shipBox.addClass("gamelocked");
			}
		},
		
		refreshReserved :function(){
			var self = this;
			
			$(".tab_locking .reserved_list").hide();
			$(".tab_locking .reserved_list").html("");
			
			this.loading = true;
			setTimeout(function(){
				self.loading = false;
				self.listReserved.sort(function(a,b){
					return a.level - b.level;
				});
				
				$.each(self.listReserved, function(index, element){
					self.addShipToReserved( element );
				});
				
				$("#reservedClear").remove();
				$("<div>").addClass("clear").attr("id", "reservedClear").appendTo(".tab_locking .reserved_list");
				$(".tab_locking .reserved_list").show();
			}, 100);
			
		},
		
		addShipToReserved :function( ThiShip ){
			var shipBox = $(".tab_locking .factory .rship").clone().prependTo(".tab_locking .reserved_list");
			$(".ship_img img", shipBox).attr("src", KC3Meta.shipIcon(ThiShip.masterId));
			$(".ship_type", shipBox).text( ThiShip.stype() );
			$(".ship_lv", shipBox).text("Lv."+ ThiShip.level );
			shipBox.attr("data-rosterId", ThiShip.rosterId );
			shipBox.attr("title", ThiShip.name() );
			shipBox.draggable({
				revert: "invalid",
				containment: '.planner_area',
				addClasses: false,
				cancel: null
			});
		},
		
		findShipOnBoxes :function( rosterId ){
			rosterId = Number(rosterId);
			for(var ctr in this.lock_plan){
				if(this.lock_plan[ctr].indexOf( rosterId ) > -1){
					return ctr;
				}
			}
			return 5;
		}
	};
	
})();