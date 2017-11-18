(function(){
	"use strict";

	KC3StrategyTabs.shipdrop = new KC3StrategyTab("shipdrop");
	KC3StrategyTabs.shipdrop.definition = {
		tabSelf: KC3StrategyTabs.shipdrop,

		dropTable : {},
		selectedWorld : 0,
		selectedMap : 0,
		maps : {},
		rankNames : ["SS", "S", "A", "B"],
		ship_filter_checkbox : {},
		rank_filter_checkbox : {},
		rankValue : 0,
		rankOp : ["SAB", "SA", "S", "A", "B"],
		diff_filter_checkbox : {
			"0" : true, // for normal maps
			"1" : true, // event easy
			"2" : true, // event normal
			"3" : true  // event hard
		},
		diffOp : ["hard", "normal", "easy"],
		diffValues : {
			"0" : true,
			"1" : true,
			"2" : true
		},

		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
		},
		
		/* RELOAD: optional
		Loads latest player or game data if needed.
		---------------------------------*/
		reload: function() {
			this.loadMapsFromStorage();
		},

		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			this.updateMapSelectors();
			this.updateFilters();
		},

		reloadMapShipDrop: function(world, map) {
			const self = this;
			world = Number(world);
			map = Number(map);
			const hqId = PlayerManager.hq.id;
			this.dropTable = {};
			const allPromises = [];
			$(".loading").show();
			KC3Database.con.sortie.where("world").equals(world).and(
				data => data.mapnum === map && data.hq === hqId
			).each(sortie => {
				this.dropTable[sortie.diff] = this.dropTable[sortie.diff] || {};
				allPromises.push(KC3Database.con.battle.where("sortie_id").equals(sortie.id).each(battle => {
					this.dropTable[sortie.diff][battle.rating] = this.dropTable[sortie.diff][battle.rating] || {};
					const drop = this.dropTable[sortie.diff][battle.rating][battle.node] =
						this.dropTable[sortie.diff][battle.rating][battle.node] || {};
					drop[battle.drop] = (drop[battle.drop] || 0) + 1;
					if(battle.boss) drop.boss = true;
				}).catch(e => {throw e;}));
			}).then(() => {
				Promise.all(allPromises).then(this.filterShipDrop.bind(this)).catch(e => {
					console.error("Loading battle data failed", e);
					$(".loading").hide();
				});
			}).catch(e => {
				console.error("Loading sortie data failed", e);
				$(".loading").hide();
			});
		},

		filterShipDrop: function() {
			const self = this;
			$(".loading").hide();
			const contentRoot = $(".tab_shipdrop .content_root");
			contentRoot.empty();
			const factory = $(".tab_shipdrop .factory");
			const shipClickFunc = function(e) {
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const rating = this.rankNames;
			const allNodes = {};
			const recountNodes = (edgeId, dropInfo) => {
				const node = KC3Meta.nodeLetter(this.selectedWorld, this.selectedMap, edgeId);
				allNodes[node] = allNodes[node] || {};
				const shipIds = Object.keys(dropInfo).filter(id => id !== "boss");
				if(dropInfo.boss) allNodes[node].boss = true;
				if(edgeId === node) allNodes[node].unknown = true;
				shipIds.forEach(mstId => {
					const count = dropInfo[mstId];
					if(Number(mstId) > 0 && KC3Master.ship(mstId)) {
						allNodes[node][mstId] = (allNodes[node][mstId] || 0) + count;
					} else {
						allNodes[node][0] = (allNodes[node][0] || 0) + count;
					}
					allNodes[node].total = (allNodes[node].total || 0) + count;
				});
			};
			for(let rank = 0; rank <= 5; rank++)
			for(let diff = 0; diff <= 3; diff++) {
				if(this.rank_filter_checkbox[rating[rank]] === false) continue;
				if(this.diff_filter_checkbox[diff] === false) continue;
				if(this.dropTable[diff]) {
					if(!this.dropTable[diff][rating[rank]]) continue;
					$.each(this.dropTable[diff][rating[rank]], recountNodes);
				}
			}
			const nodeLetters = Object.keys(allNodes);
			nodeLetters.sort((a, b) => a.localeCompare(b));
			$.each(nodeLetters, (_, node) => {
				const nodeDrop = $(".node_drop", factory).clone();
				const isBossNode = !!allNodes[node].boss;
				$(".node_name", nodeDrop)
					.text("Node " + node + (isBossNode ? " (Boss)" : ""))
					.toggleClass("boss", isBossNode)
					.toggleClass("unknown", !!allNodes[node].unknown);
				const shipIds = Object.keys(allNodes[node])
					.filter(id => ! ["total", "boss", "unknown"].includes(id));
				// order by drop counts desc, id asc (no drop always first)
				shipIds.sort((a, b) => a == "0" || b == "0" ? -Infinity :
					allNodes[node][b] - allNodes[node][a] || Number(a) - Number(b));
				let isToBeShown = false;
				const totalBattle = allNodes[node].total;
				$.each(shipIds, (_, shipId) => {
					shipId = Number(shipId);
					const shipMst = KC3Master.ship(shipId);
					const isNoDrop = !shipId || !shipMst;
					const stype = isNoDrop ? 0 : shipMst.api_stype;
					if(this.ship_filter_checkbox[stype]) {
						isToBeShown = true;
						const shipBox = $(".ship", factory).clone();
						if(isNoDrop) {
							$("img", shipBox).attr("src", "/assets/img/ui/dark_shipdrop-x.png");
						} else {
							$("img", shipBox).attr("src", KC3Meta.getIcon(shipId, undefined, false))
								.attr("alt", shipId).addClass("hover").click(shipClickFunc)
								.attr("title", KC3Meta.shipName(shipMst.api_name));
						}
						const dropCount = allNodes[node][shipId];
						$(".drop_times", shipBox).text("x{0}".format(dropCount))
							.attr("title", "{0} /{1} = {2}%".format(dropCount, totalBattle,
								Math.qckInt("round", dropCount / totalBattle * 100, 3)));
						shipBox.appendTo($(".ships", nodeDrop));
					}
				});
				if(isToBeShown) {
					nodeDrop.append($('<div class="clear"></div>'));
					nodeDrop.appendTo(contentRoot);
				}
			});
			contentRoot.createChildrenTooltips();
		},
		
		updateMapSelectors: function() {
			this.selectedWorld = Number(KC3StrategyTabs.pageParams[1] || 0);
			this.selectedMap = Number(KC3StrategyTabs.pageParams[2] || 0);
			this.updateMapSwitcher();
			$(".control_panel .world_list").on("change", e => {
				const value = $(e.target).val();
				if(value) this.selectedWorld = Number(value);
				this.updateMapSwitcher(this.selectedWorld);
			}).val(this.selectedWorld).trigger("change");
			$(".control_panel .map_list").on("change", e => {
				const value = $(e.target).val();
				if(value) this.selectedMap = Number(value);
				KC3StrategyTabs.gotoTab(null, this.selectedWorld, this.selectedMap);
			}).val(this.selectedMap);
			if(this.selectedWorld > 0 && this.selectedMap > 0) {
				this.reloadMapShipDrop(this.selectedWorld, this.selectedMap);
			}
		},

		updateMapSwitcher: function(worldId) {
			const isMap = worldId !== undefined;
			const listElem = isMap ? $(".control_panel .map_list") : $(".control_panel .world_list");
			listElem.html(
				$("<option />").attr("value", 0).text("Select a {0}...".format(isMap ? "map" : "world"))
			);
			$(".filters .massSelect #eventSelected").toggle(this.isEventWorld(worldId));
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

		loadMapsFromStorage: function() {
			this.maps = localStorage.getObject("maps") || {};
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

		updateFilters : function() {
			const self = this;

			const stypeHandler = (stype, element, stypeValues) => {
				stypeValues[stype] = ! stypeValues[stype];
				$(".filter_box .filter_check" , element).toggle(stypeValues[stype]);
				this.filterShipDrop();
			};
			const stypes = KC3Meta.sortedStypes();
			// make stype ID 0 as "No Drop", put it at last
			const type0 = stypes.shift();
			type0.order = 998;
			stypes.push(type0);
			for(const stypeObj of stypes) {
				if(stypeObj.order === 999) continue;
				const stype = stypeObj.id;
				const elem = $(".factory .ship_filter_type").clone()
					.appendTo(".filters .ship_types");
				elem.data("id", stype);
				$(".filter_name", elem).text(stype === 0 ? "No Drop" : KC3Meta.stype(stype));
				this.ship_filter_checkbox[stype] = true;
				elem.on("click", stypeHandler.bind(this, stype, elem, this.ship_filter_checkbox));
			}

			const updateRankFilterValue = () => {
				this.rankNames.map(rank => {
					this.rank_filter_checkbox[rank] = false;
				});
				for(let i = 0; i < this.rankOp[this.rankValue].length; i++) {
					this.rank_filter_checkbox[this.rankOp[this.rankValue][i]] = true;
				}
				if(this.rankOp[this.rankValue][0] === "S")
					this.rank_filter_checkbox.SS = true;
			};
			const rankFilterHandler = (index , element) => {
				$(".filters .massSelect .rank").removeClass("on");
				this.rankValue = index;
				element.addClass("on");
				updateRankFilterValue();
				this.filterShipDrop();
			};
			updateRankFilterValue();
			this.rankOp.forEach((rank , index) => {
				const elem = $(".filters .massSelect .rank." + rank.toLowerCase());
				if(index === this.rankValue) { elem.addClass("on"); }
				elem.on("click", rankFilterHandler.bind(this, index, elem));
			});

			const diffFilterHandler = (index, element) => {
				this.diffValues[index] = ! this.diffValues[index];
				element.toggleClass("on", this.diffValues[index]);
				// difficulties reversed order: easy -> normal -> hard
				this.diff_filter_checkbox[3 - index] = this.diffValues[index];
				this.filterShipDrop();
			};
			this.diffOp.forEach((diff, index) => {
				const elem = $(".filters .massSelect .diff." + diff);
				elem.toggleClass("on", this.diffValues[index]);
				elem.on("click", diffFilterHandler.bind(this, index, elem));
			});

		}

	};
})();
