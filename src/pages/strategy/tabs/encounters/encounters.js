(function(){
	"use strict";
	
	KC3StrategyTabs.encounters = new KC3StrategyTab("encounters");
	
	KC3StrategyTabs.encounters.definition = {
		tabSelf: KC3StrategyTabs.encounters,
		maps: {},
		useDb: false,
		
		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
		},
		
		/* RELOAD: optional
		Loads latest player or game data if needed.
		---------------------------------*/
		reload: function() {
			if(this.useDb) {
				this.loadMapsFromDatabase().then(() => {
					this.updateMapSwitcher.call(this);
					$(".map_switcher .world_list").val(this.world).trigger("change");
					$(".map_switcher .map_list").val(this.map);
					$(".map_switcher .difficulty").val(this.diff);
				});
			} else {
				this.loadMapsFromStorage();
			}
		},
		
		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			this.world = Number(KC3StrategyTabs.pageParams[1] || 0);
			this.map = Number(KC3StrategyTabs.pageParams[2] || 0);
			this.diff = Number(KC3StrategyTabs.pageParams[3] || 0);
			
			this.updateMapSwitcher();
			$(".map_switcher .world_list").on("change", e => {
				const value = $(e.target).val();
				if(value) this.world = Number(value);
				this.updateMapSwitcher(this.world);
			}).val(this.world).trigger("change");
			$(".map_switcher .map_list").on("change", e => {
				const value = $(e.target).val();
				if(value) this.map = Number(value);
				KC3StrategyTabs.gotoTab(null, this.world, this.map, this.diff);
			}).val(this.map);
			$(".map_switcher .difficulty").on("change", e => {
				this.diff = Number($(e.target).val()) || 0;
				KC3StrategyTabs.gotoTab(null, this.world, this.map, this.diff);
			}).val(this.diff);
			
			this.showMapEncounters(this.world, this.map, this.diff);
		},
		
		updateMapSwitcher: function(worldId) {
			const isMap = worldId !== undefined;
			const listElem = isMap ? $(".map_switcher .map_list") : $(".map_switcher .world_list");
			listElem.html(
				$("<option />").attr("value", 0).text("Select a {0}...".format(isMap ? "map" : "world"))
			);
			$(".map_switcher .difficulty").toggle(isMap && this.isEventWorld(worldId));
			$.each(this.maps, (_, map) => {
				const mapId = map.id;
				if(isMap) {
					if(worldId == String(mapId).slice(0, -1)) {
						this.addMapSwitcherOption(mapId, isMap, listElem);
					}
				} else {
					this.addMapSwitcherOption(mapId, isMap, listElem);
				}
			});
		},
		
		addMapSwitcherOption: function(mapId, isMap, list) {
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
		
		/**
		 * Load map info from localStorage as usual.
		 */
		loadMapsFromStorage: function() {
			this.maps = localStorage.getObject("maps") || {};
		},
		
		/**
		 * Alternatively load map info from IndexedDB encounters table,
		 * to indicate indeed maps player has encountered.
		 * @return Promise on DB operation done
		 */
		loadMapsFromDatabase: function() {
			this.maps = {};
			return KC3Database.con.encounters.orderBy("world").each(e => {
				const mapId = [e.world, e.map].join(''),
					key = 'm' + mapId;
				if(this.maps[key] === undefined) this.maps[key] = {id: mapId};
			});
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
			const shipClickFunc = function(e) {
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const diffStrs = ["", "E", "N", "H"];

			$(".encounter_list").empty().hide();
			$(".loading").show();
			KC3Database.con.encounters.filter(node =>
				node.world === world && node.map === map
				&& (world < 10 || !diff || node.diff === diff)
			).toArray(function(encounters) {
				$.each(encounters, function(index, encounter) {
					// Data before enemy ship ID 1000 shifting not counted as bad
					// Data without `count`, `name` are first-time records, not counted as bad
					if(!Array.isArray(JSON.parse(encounter.ke || null)) || !encounter.form) {
						console.debug("Bad encounter entry detected:", encounter);
						return;
					}
					let curBox, shipBox, shipList;
					const diffStr = diffStrs[encounter.diff || 0] || "";
					const mapName = `${encounter.world}-${encounter.map}${diffStr}`;
					// Check map box
					if(!$("#encounter-" + mapName).length) {
						curBox = $(".tab_encounters .factory .encounter_map").clone();
						curBox.attr("id", "encounter-" + mapName);
						$(".encounter_world_head", curBox).text("World " + mapName);
						curBox.appendTo(".encounter_list");
					}
					// Check node box
					const nodeLetter = KC3Meta.nodeLetter(encounter.world, encounter.map, encounter.node);
					const nodeName = encounter.name || "";
					curBox = $("#encounter-" + mapName + " .node-" + nodeLetter);
					if(!curBox.length) {
						curBox = $(".tab_encounters .factory .encounter_node").clone();
						curBox.addClass("node-" + nodeLetter);
						$(".encounter_node_head", curBox).text("Node {0} {1}".format(nodeLetter, nodeName));
						curBox.appendTo("#encounter-" + mapName + " .encounter_world_body");
					} else if(!!nodeName) {
						// Update node name only if node duplicated by multi edges
						$(".encounter_node_head", curBox).text("Node {0} {1}".format(nodeLetter, nodeName));
					}
					// Check formation and ships box
					const curNodeBody = $("#encounter-" + mapName + " .node-" + nodeLetter + " .encounter_node_body");
					const keSafe = encounter.ke.replace(/[\[\]\"\'\{\}]/g,"").replace(/[,:]/g,"_");
					curBox = $(".formke-" + encounter.form + keSafe, curNodeBody);
					if(!curBox.length) {
						// Clone record box
						curBox = $(".tab_encounters .factory .encounter_record").clone();
						curBox.addClass("formke-" + encounter.form + keSafe);
						curBox.data("count", encounter.count || 1);
						curBox.data("nodeName", nodeName);
						curBox.appendTo(curNodeBody);
						$(".encounter_formation img", curBox).attr("src", KC3Meta.formationIcon(encounter.form));
						shipList = JSON.parse(encounter.ke || "[]");
						$.each(shipList, function(shipIndex, shipId) {
							if(shipId > 0) {
								shipBox = $(".tab_encounters .factory .encounter_ship").clone();
								$(".encounter_icon", shipBox)
									.removeClass(KC3Meta.abyssShipBorderClass())
									.addClass(KC3Meta.abyssShipBorderClass(shipId));
								$(".encounter_icon img", shipBox)
									.attr("src", KC3Meta.abyssIcon(shipId))
									.attr("alt", shipId)
									.click(shipClickFunc);
								$(".encounter_id", shipBox).text(shipId);
								$(shipBox).attr("title", KC3Meta.abyssShipName(shipId));
								shipBox.appendTo($(".encounter_ships", curBox));
							}
						});
						if(shipList.length > 6) {
							$(".encounter_ships", curBox).addClass("combined");
						}
					} else {
						// Still parse ship IDs for air power calculation
						shipList = JSON.parse(encounter.ke || "[]");
						// Update count only if more edges lead to the same node
						curBox.data("count", (encounter.count || 1) + curBox.data("count"));
						if(!!nodeName && curBox.data("nodeName") !== nodeName) {
							curBox.data("nodeName", "{0}/{1}".format(curBox.data("nodeName"), nodeName));
						}
					}
					let tooltip = "{0} x{1}".format(curBox.data("nodeName"), curBox.data("count"));
					tooltip += "\n{0}".format(KC3Meta.formationText(encounter.form));
					const ap = KC3Calc.enemyFighterPower(shipList)[0];
					if(ap) {
						tooltip += "\n" + KC3Meta.term("InferredFighterPower")
							.format(ap, Math.round(ap / 3), Math.round(2 * ap / 3),
								Math.round(3 * ap / 2), 3 * ap);
					}
					$(".encounter_formation", curBox).attr("title", tooltip);
				});
				
				$(".loading").hide();
				$(".encounter_list").createChildrenTooltips().show();
			}).catch(error => {
				$(".loading").hide();
				$(".encounter_list").show();
				console.error("Loading encounters failed", [world, map, diff], error);
			});
		}
		
	};
	
})();
