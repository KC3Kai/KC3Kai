(function(){
	"use strict";
	
	KC3StrategyTabs.maps = new KC3StrategyTab("maps");
	
	KC3StrategyTabs.maps.definition = {
		tabSelf: KC3StrategyTabs.maps,
		
		maps : {},
		selectedWorld: 0,
		selectedMap: 0,
		
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			this.maps = JSON.parse( localStorage.maps );
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			// On-click world menus
			$(".tab_maps .world_box").on("click", function(){
				self.selectedWorld = $(this).data("world_num");
				$(".tab_maps .world_box").removeClass("active");
				$(this).addClass("active");
				
				$(".tab_maps .map_list").html("");
				
				if(self.selectedWorld !== 0){
					// Add all maps in this world selection
					var mapBox;
					mapBox = $(".tab_maps .factory .map_box").clone().appendTo(".tab_maps .map_list");
					mapBox.data("map_num", 0);
					mapBox.addClass("empty");
					mapBox.addClass("active");
					$(".map_title", mapBox).text("All W"+self.selectedWorld);
					
					// Check player's map list
					$.each(self.maps, function(index, element){
						var cWorld = (""+element.id).substr(0, (""+element.id).length-1);
						var cMap = (""+element.id).substr((""+element.id).length-1);
						
						// If this map is part of selected world
						if(cWorld == self.selectedWorld){
							mapBox = $(".tab_maps .factory .map_box").clone().appendTo(".tab_maps .map_list");
							mapBox.data("map_num", cMap);
							$(".map_title", mapBox).text("W"+cWorld+" - "+cMap);
							
							// If this map is already cleared
							if(element.clear == 1){
								$(".map_hp_txt", mapBox).text("Cleared!");
								mapBox.addClass("cleared");
							}else{
								mapBox.addClass("notcleared");
								var totalKills = KC3Meta.gauge(element.id);
								var killsLeft = totalKills - element.kills;
								if(totalKills){
									$(".map_hp_txt", mapBox).text( killsLeft+" / "+totalKills+" kills left");
									$(".map_bar", mapBox).css("width", ((killsLeft/totalKills)*80)+"px");
								}else{
									mapBox.addClass("noclearnogauge");
									$(".map_hp_txt", mapBox).text("Not cleared");
								}
							}
						}
					});
					
					$("<div>").addClass("clear").appendTo(".tab_maps .map_list");
					$(".tab_maps .map_list .map_box.active").trigger("click");
				}else{
					self.showMap();
				}
			});
			
			// On-click map menus
			$(".tab_maps .map_list").on("click", ".map_box", function(){
				self.selectedMap = parseInt( $(this).data("map_num"), 10);
				$(".tab_maps .map_box").removeClass("active");
				$(this).addClass("active");
				self.showMap();
			});
			
			// Select default opened world
			$(".tab_maps .world_box.active").trigger("click");
		},
		
		/* SHOW MAP
		A map has been selected
		---------------------------------*/
		showMap :function(){
			var self = this;
			this.pageNum = 1;
			
			$(".tab_maps .sortie_list").html("");
			
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.count_normal_sorties(function(countPages){
					self.showPagination(countPages);
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.count_world(this.selectedWorld, function(countPages){
						self.showPagination(countPages);
					});
					
				// Selected specifc map
				}else{
					KC3Database.count_map(this.selectedWorld, this.selectedMap, function(countPages){
						self.showPagination(countPages);
					});
				}
			}
			
			this.showPage();
		},
		
		/* SHOW PAGINATION
		Show list of clickable page boxes
		---------------------------------*/
		showPagination :function(countPages){
			// $(".factory .page_box")
					// page_list
		},
		
		/* SHOW PAGE
		Determines list type and gets data from IndexedDB
		---------------------------------*/
		showPage :function(){
			// this.pageNum
			// this.selectedWorld
			// this.selectedMap
			console.log("showing list", this.selectedWorld, this.selectedMap, this.pageNum );
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.count_normal_sorties(function(countPages){
					self.showPagination(countPages);
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.count_world(this.selectedWorld, function(countPages){
						self.showPagination(countPages);
					});
					
				// Selected specifc map
				}else{
					KC3Database.count_map(this.selectedWorld, this.selectedMap, function(countPages){
						self.showPagination(countPages);
					});
				}
			}
		},
		
		/* SHOW LIST
		Shows sorties on interface using list of collected sortie objects
		---------------------------------*/
		showList :function( sortieList ){
			
		}
	};
	
})();