(function(){
	"use strict";
	
	KC3StrategyTabs.maps = new KC3StrategyTab("maps");
	
	KC3StrategyTabs.maps.definition = {
		tabSelf: KC3StrategyTabs.maps,
		
		maps : {},
		selectedWorld: 0,
		selectedMap: 0,
		itemsPerPage: 20,
		currentSorties: [],
		
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
			
			// On-click pages
			$(".tab_maps .page_list").on("click", ".page_box", function(){
				$(".tab_maps .page_list .page_box").removeClass("active");
				$(this).addClass("active");
				self.pageNum = $(this).data("num");
				self.showPage();
			});
			
			// On-click sortie toggles
			$(".tab_maps .sortie_list").on("click", ".sortie_box .sortie_toggles .sortie_toggle", function(){
				var targetName = $(this).data("target");
				var targetBox = $(this).parent().parent().parent().find("."+targetName);
				
				if( $(this).hasClass("active") ){
					$(this).removeClass("active");
				}else{
					$(this).addClass("active");
				}
				
				/*// Check if target box does not have data yet
				if(!targetBox.data("filled")){
					// If trying to view fleet
					if(targetBox == "sortie_roster"){
						
						
					// If trying to view nodes list
					}else if(targetBox == "sortie_nodes"){
						
						
					}
					
					// Mark as already having data
					targetBox.data("filled", 1);
				}*/
				
				// Show or hide the target box
				targetBox.slideToggle();
			});
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
				KC3Database.count_normal_sorties(function(countSorties){
					self.showPagination(countSorties);
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.count_world(this.selectedWorld, function(countSorties){
						console.log("count_world", countSorties);
						self.showPagination(countSorties);
					});
					
				// Selected specifc map
				}else{
					KC3Database.count_map(this.selectedWorld, this.selectedMap, function(countSorties){
						console.log("count_map", countSorties);
						self.showPagination(countSorties);
					});
				}
			}
		},
		
		/* SHOW PAGINATION
		Show list of clickable page boxes
		---------------------------------*/
		showPagination :function(countSorties){
			var countPages = Math.ceil( countSorties / this.itemsPerPage );
			
			// Remove past pagination
			$(".tab_maps .page_list").html("");
			
			// Clone page boxes
			var pageBox;
			$.each(new Array(countPages), function(index){
				pageBox = $(".tab_maps .factory .page_box").clone().appendTo(".tab_maps .page_list");
				pageBox.html( index+1 );
				pageBox.data("num", index+1);
				if(index===0){ pageBox.addClass("active"); }
			});
			
			// Clear CSS for floats
			$("<div>").addClass("clear").appendTo(".tab_maps .page_list");
			
			// Click first page as initial selected
			$(".tab_maps .page_list .page_box.active").trigger("click");
		},
		
		
		/* SHOW PAGE
		Determines list type and gets data from IndexedDB
		---------------------------------*/
		showPage :function(){
			var self = this;
			
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.get_normal_sorties(this.pageNum, this.itemsPerPage, function( sortieList ){
					self.showList( sortieList );
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.get_world(this.selectedWorld, this.pageNum, this.itemsPerPage, function( sortieList ){
						self.showList( sortieList );
					});
					
				// Selected specifc map
				}else{
					KC3Database.get_map(this.selectedWorld, this.selectedMap, this.pageNum, this.itemsPerPage, function( sortieList ){
						self.showList( sortieList );
					});
				}
			}
		},
		
		/* SHOW LIST
		Shows sorties on interface using list of collected sortie objects
		---------------------------------*/
		showList :function( sortieList ){
			// Remove past list
			$(".tab_maps .sortie_list").html("");
			
			// Show sortie records on list
			var sortieBox, mainFleet, isCombined, rshipBox, nodeBox, thisNode;
			$.each(sortieList, function(id, sortie){
				// Create sortie box
				sortieBox = $(".tab_maps .factory .sortie_box").clone().appendTo(".tab_maps .sortie_list");
				$(".sortie_id", sortieBox).html( sortie.id );
				$(".sortie_date", sortieBox).html( new Date(sortie.time*1000).format("mmm d") );
				$(".sortie_date", sortieBox).attr("title", new Date(sortie.time*1000).format("mmm d, yyyy hh:MM:ss") );
				$(".sortie_map", sortieBox).html( sortie.world + "-" + sortie.mapnum );
				
				// Show main fleet faces
				mainFleet = sortie["fleet"+sortie.fleetnum];
				$(".sortie_ship", sortieBox).hide();
				$.each(mainFleet, function(index, ship){
					// false recorded on older sorties. stop loop when encountered
					if(ship===false){ return false; }
					
					$(".sortie_ship_"+(index+1)+" img", sortieBox).attr("src", KC3Meta.shipIcon(ship.mst_id));
					$(".sortie_ship_"+(index+1), sortieBox).show();
					
					rshipBox = $(".tab_maps .factory .rfleet_ship").clone();
					$(".rfleet_pic img", rshipBox).attr("src", KC3Meta.shipIcon(ship.mst_id) );
					$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
					$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
					$(".rfleet_main .rfleet_body", sortieBox).append( rshipBox );
				});
				$(".rfleet_main .rfleet_body", sortieBox).append( $("<div>").addClass("clear") );
				
				// Check if combined fleet
				isCombined = false; 
				if(typeof sortie.combined !== "undefined"){
					if(sortie.combined > 0){
						isCombined = true;
					}
				}
				
				// Escort Fleet  Expedition
				if(isCombined){
					$.each(sortie.fleet2, function(index, ship){
						rshipBox = $(".tab_maps .factory .rfleet_ship").clone();
						$(".rfleet_pic img", rshipBox).attr("src", KC3Meta.shipIcon(ship.mst_id) );
						$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
						$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
						$(".rfleet_escort .rfleet_body", sortieBox).append( rshipBox );
					});
					$(".rfleet_escort .rfleet_body", sortieBox).append( $("<div>").addClass("clear") );
				}else{
					$(".rfleet_escort", sortieBox).addClass("disabled");
				}
				
				// Preboss Support
				if(sortie.support1 > 0){
					$.each(sortie["fleet"+sortie.support1], function(index, ship){
						rshipBox = $(".tab_maps .factory .rfleet_ship").clone();
						$(".rfleet_pic img", rshipBox).attr("src", KC3Meta.shipIcon(ship.mst_id) );
						$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
						$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
						$(".rfleet_preboss .rfleet_body", sortieBox).append( rshipBox );
					});
					$(".rfleet_preboss .rfleet_body", sortieBox).append( $("<div>").addClass("clear") );
				}else{
					$(".rfleet_preboss", sortieBox).addClass("disabled");
				}
				
				// Boss support Expedition
				if(sortie.support2 > 0){
					$.each(sortie["fleet"+sortie.support2], function(index, ship){
						rshipBox = $(".tab_maps .factory .rfleet_ship").clone();
						$(".rfleet_pic img", rshipBox).attr("src", KC3Meta.shipIcon(ship.mst_id) );
						$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
						$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
						$(".rfleet_boss .rfleet_body", sortieBox).append( rshipBox );
					});
					$(".rfleet_boss .rfleet_body", sortieBox).append( $("<div>").addClass("clear") );
				}else{
					$(".rfleet_boss", sortieBox).addClass("disabled");
				}
				
				// For each battle
				$.each(sortie.battles, function(index, battle){
					var battleData, isDayBattle = true;
					
					// Determine if day or night battle node
					if(typeof battle.data.api_dock_id != "undefined"){
						battleData = battle.data;
					}else if(typeof battle.yasen.api_deck_id != "undefined"){
						battleData = battle.yasen;
						isDayBattle = false;
					}else{
						return true;
					}
					
					// Show on node list
					$(".sortue_edge_"+(index+1), sortieBox).addClass("active");
					$(".sortue_edge_"+(index+1), sortieBox).html( battle.node );
					
					// HTML elements
					nodeBox = $(".tab_maps .factory .sortie_nodeinfo").clone();
					$(".node_id", nodeBox).text( battle.node );
					
					// Result Icons
					$(".node_formation img", nodeBox).attr("src", KC3Meta.formationIcon(battleData.api_formation[0]) );
					$(".node_formation", nodeBox).attr("title", KC3Meta.formationText(battleData.api_formation[0]) );
					$(".node_rating img", nodeBox).attr("src", "../../assets/img/client/ratings/"+battle.rating+".png");
					
					// Kanmusu Drop
					if(battle.drop > 0){
						$(".node_drop img", nodeBox).attr("src", KC3Meta.shipIcon( battle.drop ) );
					}else{
						$(".node_drop img", nodeBox).attr("src", "../../assets/img/ui/shipdrop-x.png");
					}
					
					// Support Exped Triggered
					if(battle.data.api_support_flag > 0){
						$(".node_support img", nodeBox).attr("src", "../../assets/img/ui/support.png");
					}else{
						$(".node_support img", nodeBox).attr("src", "../../assets/img/ui/support-x.png");
					}
					
					// Enemies
					$(".node_eformation img", nodeBox).attr("src", KC3Meta.formationIcon(battleData.api_formation[1]) );
					$(".node_eformation", nodeBox).attr("title", KC3Meta.formationText(battleData.api_formation[1]) );
					$.each(battleData.api_ship_ke, function(index, eship){
						$(".node_eship_"+(index+1)+" img", nodeBox).attr("src", KC3Meta.abyssIcon( eship ) );
						$(".node_eship_"+(index+1), nodeBox).attr("title", KC3Master.ship( eship ).api_name + KC3Master.ship( eship ).api_yomi );
						$(".node_eship_"+(index+1), nodeBox).show();
					});
					
					// Process Battle
					thisNode = (new KC3Node()).defineAsBattle();
					if(typeof battle.data.api_dock_id != "undefined"){
						thisNode.engage( battleData, sortie.fleetnum );
					}else if(typeof battle.yasen.api_deck_id != "undefined"){
						thisNode.engageNight( battleData, sortie.fleetnum );
					}
					
					// Conditions
					$(".node_engage", nodeBox).text( thisNode.engagement[2] );
					$(".node_engage", nodeBox).addClass( thisNode.engagement[1] );
					$(".node_contact", nodeBox).text(thisNode.fcontact +" vs "+thisNode.econtact);
					
					// Day Battle-only data
					if(isDayBattle){
						$(".node_detect", nodeBox).text( thisNode.detection[0] );
						$(".node_detect", nodeBox).addClass( thisNode.detection[1] );
						
						$(".node_airbattle", nodeBox).text( thisNode.airbattle[0] );
						$(".node_airbattle", nodeBox).addClass( thisNode.airbattle[1] );
						
						// Plane total counts
						$(".node_FFT", nodeBox).text(thisNode.planeFighters.player[0]);
						$(".node_FAT", nodeBox).text(thisNode.planeFighters.abyssal[0]);
						$(".node_BFT", nodeBox).text(thisNode.planeBombers.player[0]);
						$(".node_BAT", nodeBox).text(thisNode.planeBombers.abyssal[0]);
						
						// Plane losses
						if(thisNode.planeFighters.player[1] > 0){
							$(".node_FFL", nodeBox).text("-"+thisNode.planeFighters.player[1]);
						}
						if(thisNode.planeFighters.abyssal[1] > 0){
							$(".node_FAL", nodeBox).text("-"+thisNode.planeFighters.abyssal[1]);
						}
						if(thisNode.planeBombers.player[1] > 0){
							$(".node_BFL", nodeBox).text("-"+thisNode.planeBombers.player[1]);
						}
						if(thisNode.planeBombers.abyssal[1] > 0){
							$(".node_BAL", nodeBox).text("-"+thisNode.planeBombers.abyssal[1]);
						}
					}
					
					// Add box to UI
					$(".sortie_nodes", sortieBox).append( nodeBox );
					
				});
				$(".sortie_nodes", sortieBox).append( $("<div>").addClass("clear") );
				
				
				// console.log( sortie );
			});
		}
	};
	
})();