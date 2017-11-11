(function(){
	"use strict";
	
	KC3StrategyTabs.encounters = new KC3StrategyTab("encounters");
	
	KC3StrategyTabs.encounters.definition = {
		tabSelf: KC3StrategyTabs.encounters,
		
		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
		},
		
		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			this.world = 0;
			this.map = 0;
			this.diff = 0;
			this.loadMapsFromStorage();
			$(".loading").hide();
			$(".map_switcher .world_list").on("change", e => {
				this.world = Number($(e.target).prop("value"));
				this.loadMapsFromStorage(this.world);
			});
			$(".map_switcher .map_list").on("change", e => {
				this.map = Number($(e.target).prop("value"));
				this.showMapEncounters(this.world, this.map, this.diff);
			});
			$(".map_switcher .difficulty").on("change", e => {
				this.diff = Number($(e.target).prop("value"));
				this.showMapEncounters(this.world, this.map, this.diff);
			});
		},
		
		/**
		 * Alternatively load map info from IndexedDB encounters table,
		 * to indicate indeeded maps player has encountered.
		 */
		loadMapsFromStorage: function(worldId) {
			const maps = localStorage.getObject("maps") || {};
			const isMap = worldId !== undefined;
			const listElem = isMap ? $(".map_switcher .map_list") : $(".map_switcher .world_list");
			listElem.html(
				$("<option />").attr("value", 0).text("Select a {0}...".format(isMap ? "map" : "world"))
			);
			$(".map_switcher .difficulty").toggle(isMap && this.isEventWorld(worldId));
			$.each(maps, (_, map) => {
				const mapId = map.id;
				if(isMap) {
					if(worldId == String(mapId).slice(0, -1)) {
						this.updateMapSwitcher(mapId, isMap, listElem);
					}
				} else {
					this.updateMapSwitcher(mapId, isMap, listElem);
				}
			});
		},
		
		updateMapSwitcher: function(mapId, isMap, list) {
			const world = String(mapId).slice(0, -1);
			const map = String(mapId).slice(-1);
			const value = isMap ? map : world;
			const descFunc = isMap ? this.mapToDesc : this.worldToDesc;
			if($(`option[value=${value}]`, list).length === 0) {
				list.append(
					$("<option />").attr("value", value).text(descFunc.call(this, world, map))
				);
			}
		},
		
		isEventWorld: function(worldId) {
			return worldId >= 10;
		},
		
		worldToDesc: function(world) {
			world = Number(world);
			if(this.isEventWorld(world)) {
				const eventMapDefs = {
					seasons : ["Winter", "Spring", "Summer", "Fall"],
					fromId : 21,
					fromYear : 2013
				}, period = eventMapDefs.seasons.length,
				worldIndex = world - eventMapDefs.fromId,
				season = eventMapDefs.seasons[worldIndex % period],
				year = eventMapDefs.fromYear + Math.floor(worldIndex / period);
				return KC3Meta.term("MapNameEventWorld").format(
					KC3Meta.term("MapNameEventSeason" + season), year);
			} else {
				return KC3Meta.term("MapNameWorld" + world);
			}
		},
		
		mapToDesc: function(world, map) {
			return this.isEventWorld(world) ? "E-" + map : [world, map].join("-");
		},
		
		showMapEncounters: function(world, map, diff) {
			const self = this;
			const shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const diffStrs = ["", "E", "N", "H"];

			$(".encounter_list").empty();
			$(".loading").show();
			KC3Database.con.encounters.filter(node =>
				node.world === world && node.map === map
				&& (world < 10 || !diff || node.diff === diff)
			).toArray(function(encounters){
				$.each(encounters, function(index, encounter){
					if(encounter.world < 1) return true;
					let curBox, shipBox, shipList;
					const diffStr = diffStrs[encounter.diff || 0] || "";
					// Check map box
					if( $("#encounter-"+encounter.world+"-"+encounter.map+diffStr).length === 0){
						curBox = $(".tab_encounters .factory .encounter_map").clone();
						curBox.attr("id", "encounter-"+encounter.world+"-"+encounter.map+diffStr);
						$(".encounter_world_head", curBox).text("World "+encounter.world+"-"+encounter.map+diffStr);
						curBox.appendTo(".encounter_list");
					}
					// Check node box
					const nodeLetter = KC3Meta.nodeLetter(encounter.world, encounter.map, encounter.node);
					const nodeName = encounter.name || "";
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
					const curNodeBody = $("#encounter-"+encounter.world+"-"+encounter.map+diffStr+" .node-"+nodeLetter+" .encounter_node_body");
					const keSafe = encounter.ke.replace(/[\[\]\"\'\{\}]/g,"").replace(/[,:]/g,"_");
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
					tooltip += "\n{0}".format(KC3Meta.formationText(encounter.form));
					const ap = KC3Calc.enemyFighterPower(shipList)[0];
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
