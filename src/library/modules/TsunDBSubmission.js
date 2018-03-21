/**
 * TsunDBSubmission.js
 *
 * KC3Kai routing, enemies and drops data submission module.
 */
(function(){
	"use strict";
	
	window.TsunDBSubmission = {
		data : {
			map: null,
			mapNodes: [],
			cleared: null,
			hqLvl: null,
			fleetType: 0,
			edgeID: [],
			nodeType: null,
			eventId: null,
			eventKind: null,
			nextRoute: null,
			fleetSent: 1,
			fleetSpeed: null,
			fleet1: [],
			fleet2: [],
			los: [],
			currentMapHP: null,
			maxMapHP: null,
			difficulty: null,
			gaugeNum: null,
			gaugeType: null,
			debuffSound: null
		},
		enemyComp: {
			map: null,
			node: null,
			hqLvl: null,
			difficulty: null,
			enemies: null
		},
		shipDrop : {
			map: null,
			node: null,
			rank: null,
			enemyComp: null,
			hqLvl: null,
			difficulty: null,
			ship: null,
			counts: null
		},
		handlers : {},
		mapInfo : [],
		currentMap : [0, 0],
		
		init: function () {
			this.handlers = {
				'api_get_member/mapinfo': this.processMapInfo,
				'api_req_map/select_eventmap_rank': this.processSelectEventMapRank,
				
				'api_req_map/start': this.processStart,
				'api_req_map/next': this.processNext,
				
				'api_req_sortie/battle': this.processEnemy,
				'api_req_sortie/airbattle': this.processEnemy,
				'api_req_sortie/night_to_day': this.processEnemy,
				'api_req_sortie/ld_airbattle': this.processEnemy,
				'api_req_battle_midnight/sp_midnight': this.processEnemy,
				'api_req_combined_battle/airbattle': this.processEnemy,
				'api_req_combined_battle/battle': this.processEnemy,
				'api_req_combined_battle/sp_midnight': this.processEnemy,
				'api_req_combined_battle/battle_water': this.processEnemy,
				'api_req_combined_battle/ld_airbattle': this.processEnemy,
				'api_req_combined_battle/ec_battle': this.processEnemy,
				'api_req_combined_battle/each_battle': this.processEnemy,
				'api_req_combined_battle/each_airbattle': this.processEnemy,
				'api_req_combined_battle/each_sp_midnight': this.processEnemy,
				'api_req_combined_battle/each_battle_water': this.processEnemy,
				'api_req_combined_battle/ec_night_to_day': this.processEnemy,
				'api_req_combined_battle/each_ld_airbattle': this.processEnemy,
				// PvP battles and regular night battles are excluded intentionally
				
				'api_req_sortie/battleresult': this.processDrop,
				'api_req_combined_battle/battleresult': this.processDrop,
				// PvP battle_result excluded intentionally
			};
		},
		
		processMapInfo: function(http) {
			this.mapInfo = $.extend(true, [], http.response.api_data.api_map_info);
		},
		
		processEventSelect: function(http) {
			const mapId = [http.params.api_maparea_id, http.params.api_map_no].join('');
			const eventMapInfo = this.mapInfo[mapId].api_eventmap;
			if(eventMapInfo) {
				eventMapInfo.api_selected_rank = Number(http.params.api_rank);
				const apiData = http.response.api_data;
				if(apiData && apiData.api_maphp) {
					eventMapInfo.api_gauge_num = Number(apiData.api_maphp.api_gauge_num);
					eventMapInfo.api_gauge_type = Number(apiData.api_maphp.api_gauge_type);
				}
			}
		},
		
		processStart: function(http) {
			this.cleanOnStart();
			const apiData = http.response.api_data;
			this.data.mapNodes = apiData.api_cell_data;
			this.data.fleetSent = Number(http.params.api_deck_id);
			this.data.fleetType = PlayerManager.combinedFleet;
			this.processNext(http);
			
			// Statistics of owned ships by base form ID
			KC3ShipManager.find(ship => {
				const baseFormId = RemodelDb.originOf(ship.masterId);
				this.shipDrop.counts[baseFormId] = 1 + (this.shipDrop.counts[baseFormId] || 0);
			});
		},
		
		processNext: function(http) {
			this.cleanOnNext();
			const apiData = http.response.api_data;
			
			// Sets the map id
			const world = Number(apiData.api_maparea_id);
			const map = Number(apiData.api_mapinfo_no);
			this.currentMap = [world, map];
			const mapId = this.currentMap.join('');
			const mapData = this.mapInfo.find(i => i.api_id == mapId) || {};
			this.data.map = this.currentMap.join('-');
			
			// Sets all the event related values
			if(apiData.api_eventmap) {
				const mapStorage = KC3SortieManager.getCurrentMapData(world, map);
				
				this.data.currentMapHP = apiData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = apiData.api_eventmap.api_max_maphp;
				this.data.difficulty = mapData.api_eventmap.api_selected_rank;
				this.data.gaugeNum = mapData.api_eventmap.api_gauge_num;
				this.data.gaugeType = mapData.api_eventmap.api_gauge_type;
				this.data.debuffSound = mapStorage.debuffSound;
			}
			
			// Sets whether the map is cleared or not
			this.data.cleared = mapData.api_cleared;
			
			// Sets player's HQ level
			this.data.hqLvl = PlayerManager.hq.level;
			
			// Charts the route array using edge ids as values
			this.data.edgeID.push(apiData.api_no);
			
			// All values related to node types
			this.data.nodeType = apiData.api_color_no;
			this.data.eventId = apiData.api_event_id;
			this.data.eventKind = apiData.api_event_kind;
			
			// Checks whether the fleet has hit a dead end or not
			this.data.nextRoute = apiData.api_next;
			
			this.data.fleet1 = this.handleFleet(PlayerManager.fleets[this.data.fleetSent - 1]);
			if(this.data.fleetType > 0 && this.data.fleetSent == 1) {
				this.data.fleet2 = this.handleFleet(PlayerManager.fleets[1]);
			}
			
			this.sendData(this.data, 'routing');
			
			// Send Land-base Air Raid enemy compos
			if(apiData.api_destruction_battle) {
				this.processEnemy(http, apiData.api_destruction_battle);
			}
		},
		
		processEnemy: function(http, airRaidData) {
			if(!this.currentMap[0] || !this.currentMap[1]) { return; }
			const apiData = airRaidData || http.response.api_data;
			this.enemyComp = {};
			
			this.enemyComp.map = this.data.map;
			this.enemyComp.node = KC3Meta.nodeLetter(this.currentMap[0], this.currentMap[1],
				this.data.edgeID.slice(-1).pop());
			this.enemyComp.hqLvl = this.data.hqLvl;
			this.enemyComp.difficulty = this.data.difficulty;
			this.enemyComp.enemies = {
				formation: apiData.api_formation[1],
				ship: apiData.api_ship_ke,
				lvl: apiData.api_ship_lv,
				hp: apiData.api_e_maxhps,
				// No api_eParam for LB air raid
				stats: apiData.api_eParam || [],
				equip: apiData.api_eSlot
			};
			if(apiData.api_ship_ke_combined) {
				this.enemyComp.enemies.shipEscort = apiData.api_ship_ke_combined;
				this.enemyComp.enemies.lvlEscort = apiData.api_ship_lv_combined;
				this.enemyComp.enemies.hpEscort = apiData.api_e_maxhps_combined;
				this.enemyComp.enemies.statsEscort = apiData.api_eParam_combined;
				this.enemyComp.enemies.equipEscort = apiData.api_eSlot_combined;
			}
			if(airRaidData) {
				this.enemyComp.enemies.isAirRaid = true;
			}
			
			this.sendData(this.enemyComp, 'enemy-comp');
		},
		
		processDrop: function(http) {
			if(!this.currentMap[0] || !this.currentMap[1]) { return; }
			const apiData = http.response.api_data;
			const lastShipCounts = this.shipDrop.counts || {};
			this.shipDrop = {};
			
			this.shipDrop.map = this.data.map;
			this.shipDrop.node = KC3Meta.nodeLetter(this.currentMap[0], this.currentMap[1],
				this.data.edgeID.slice(-1).pop());
			this.shipDrop.rank = apiData.api_win_rank;
			// Enemy comp name only existed in result API data
			if(this.enemyComp.enemies && !this.enemyComp.enemies.isAirRaid) {
				this.enemyComp.enemies.mapName = apiData.api_quest_name;
				this.enemyComp.enemies.compName = apiData.api_enemy_info.api_deck_name;
				this.shipDrop.enemyComp = this.enemyComp.enemies;
			}
			this.shipDrop.hqLvl = this.data.hqLvl;
			this.shipDrop.difficulty = this.data.difficulty;
			this.shipDrop.counts = lastShipCounts;
			this.shipDrop.ship = apiData.api_get_ship ? apiData.api_get_ship.api_ship_id : -1;
			
			// Effectively prevents a submission from happening,
			// if it turns out a no drop happened due to max slots or equipment
			if(this.shipDrop.ship === -1
				&& (KC3ShipManager.count() >= KC3ShipManager.max
				 || KC3GearManager.count() >= KC3GearManager.max - 3)
			) { return; }
			this.sendData(this.shipDrop, 'drops');
			
			// To avoid iterating all ships every time,
			// and KC3ShipManager may not be updated until next `api_get_member/ship_deck` call.
			if(this.shipDrop.ship > 0){
				// Basically not need this converting, but once a time KC devs made a Fusou Kai Ni drop bug
				const baseFormId = RemodelDb.originOf(this.shipDrop.ship);
				this.shipDrop.counts[baseFormId] = 1 + (this.shipDrop.counts[baseFormId] || 0);
			}
		},
		
		handleFleet: function(fleet) {
			// Update fleet minimal speed
			fleet.speed();
			// Slow fleet wins over fast
			this.data.fleetSpeed = Math.min(this.data.fleetSpeed, fleet.minSpeed);
			// F33 Cn 1,2,3 & 4
			[1,2,3,4].forEach(i => { this.data.los[i - 1] += fleet.eLos4(i); });
			return fleet.ship().map(ship => ({
				id : ship.master().api_id,
				name: ship.master().api_name,
				shiplock: ship.sally,
				level: ship.level,
				type: ship.master().api_stype,
				speed: ship.speed,
				flee: ship.didFlee,
				slots: ship.api_slot_num,
				equip: ship.equipment(false).map(gear => gear.masterId || -1),
				exslot: ship.exItem().masterId || -1
			}));
		},
		
		/**
		 * Cleans up the data for each time start to sortie.
		 */
		cleanOnStart: function() {
			this.currentMap = [0, 0];
			this.data.edgeID = [];
			this.shipDrop.counts = {};
		},
		
		/**
		 * Cleans up the data after each submission for each node.
		 */
		cleanOnNext: function() {
			// states of fleets might be changed every nodes
			this.data.los = [0, 0, 0, 0];
			this.data.fleet1 = [];
			this.data.fleet2 = [];
			this.data.fleetSpeed = 20;
			// optional properties for event only
			this.data.difficulty = 0;
			this.data.currentMapHP = 0;
			this.data.maxMapHP = 0;
			this.data.gaugeNum = 0;
			this.data.gaugeType = 0;
		},
		
		processData: function(requestObj) {
			try {
				// get data handler based on URL given
				// `null` is returned if no handler is found
				var handler = this.handlers[requestObj.call];
				if (handler) {
					handler.call(this, requestObj);
				}
			} catch (e) {
				console.warn("TsunDB submission error", e);
				// Its not Mongo, but Mango =D
				var reportParams = $.extend({}, requestObj.params);
				delete reportParams.api_token;
				KC3Network.trigger("APIError", {
					title: KC3Meta.term("APIErrorNoticeTitle"),
					message: KC3Meta.term("APIErrorNoticeMessage").format("TsunDBSubmission"),
					stack: e.stack || String(e),
					request: {
						url: requestObj.url,
						headers: requestObj.headers,
						statusCode: requestObj.statusCode
					},
					params: reportParams,
					response: requestObj.response,
					serverUtc: Date.safeToUtcTime(requestObj.headers.Date)
				});
			}
		},
		
		sendData: function(payload, type) {
			//console.debug(JSON.stringify(payload));
			payload.validation = "Michishio is cute!";
			$.ajax({
				url: `https://tsundb.kc3.moe/api/${type}`,
				method: 'POST',
				headers: {'content-type': 'application/json'},
				data: JSON.stringify(payload)
			}).done( function() {
				console.log("Tsun DB Submission done.");
			}).fail( function(jqXHR, textStatus, errorThrown) {
				console.warn("Tsun DB Submission " + textStatus, errorThrown);
			});
			return;
		}
	};
	window.TsunDBSubmission.init();
})();
