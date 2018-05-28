/**
 * TsunDBSubmission.js
 *
 * KC3Kai routing, enemies, drops, AACI kinds and developments data submission module.
 */
(function(){
	"use strict";
	
	window.TsunDBSubmission = {
		celldata : {
			map: null,
			data: []
		},
		data : {
			map: null,
			hqLvl: null,
			cleared: null,
			fleetType: 0,
			fleet1: [],
			fleet2: [],
			sortiedFleet: 1,
			fleetSpeed: null,
			edgeID: [],
			los: [],
			nodeType: null,
			eventId: null,
			eventKind: null,
			nextRoute: null,
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
			enemyComp: null
		},
		shipDrop : {
			map: null,
			node: null,
			rank: null,
			cleared: null,
			enemyComp: null,
			hqLvl: null,
			difficulty: null,
			ship: null,
			counts: null
		},
		aaci : {
			shipPossibleAACI: null,
			triggeredAACI: null,
			badAACI: null,
			ship: {
				id: null,
				lvl: null,
				damage: null,
				aa: null,
				luck: null
			},
			shipPosition: null,
			equips: null,
			improvements: null,
			kc3version: null
		},
		development : {
			hqLvl: null,
			flagship: {},
			resources: {},
			result: null,
			success: null
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
				
				'api_req_sortie/battle': [this.processEnemy, this.processAACI],
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
				
				// Development related
				'api_req_kousyou/createitem': this.processDevelopment
			};
			this.manifest = chrome.runtime.getManifest() || {};
		},
		
		processMapInfo: function(http) {
			this.mapInfo = $.extend(true, [], http.response.api_data.api_map_info);
		},
		
		processSelectEventMapRank: function(http) {
			const mapId = [http.params.api_maparea_id, http.params.api_map_no].join('');
			const eventMapInfo = (this.mapInfo[mapId] || {}).api_eventmap;
			if(eventMapInfo) {
				eventMapInfo.api_selected_rank = Number(http.params.api_rank);
				const apiData = http.response.api_data;
				if(apiData && apiData.api_maphp) {
					eventMapInfo.api_gauge_num = Number(apiData.api_maphp.api_gauge_num);
					eventMapInfo.api_gauge_type = Number(apiData.api_maphp.api_gauge_type);
				}
			}
		},
		
		processCellData: function(http){
			const apiData = http.response.api_data;
			
			this.celldata.map = this.data.map;
			this.celldata.data = apiData.api_cell_data;
			
			//this.sendData(this.celldata, '???');
		},
		
		processStart: function(http) {
			this.cleanOnStart();
			const apiData = http.response.api_data;
			this.data.sortiedFleet = Number(http.params.api_deck_id);
			this.data.fleetType = PlayerManager.combinedFleet;

			// Sets the map value
			const world = Number(apiData.api_maparea_id);
			const map = Number(apiData.api_mapinfo_no);
			this.currentMap = [world, map];
			this.data.map = this.currentMap.join('-');
			
			this.processCellData(http);
			this.processNext(http);
			
			// Statistics of owned ships by base form ID
			KC3ShipManager.find(ship => {
				const baseFormId = RemodelDb.originOf(ship.masterId);
				this.shipDrop.counts[baseFormId] = 1 + (this.shipDrop.counts[baseFormId] || 0);
				return false; // no ship wanted to find
			});
		},
		
		processNext: function(http) {
			if(!this.currentMap[0] || !this.currentMap[1]) { return; }
			this.cleanOnNext();
			const apiData = http.response.api_data;
			
			// Sets player's HQ level
			this.data.hqLvl = PlayerManager.hq.level;
			
			// Sets the map id
			const mapId = this.currentMap.join('');
			const mapData = this.mapInfo.find(i => i.api_id == mapId) || {};
			
			// Sets whether the map is cleared or not
			this.data.cleared = mapData.api_cleared;
			
			// Charts the route array using edge ids as values
			this.data.edgeID.push(apiData.api_no);
			
			// All values related to node types
			this.data.nodeType = apiData.api_color_no;
			this.data.eventId = apiData.api_event_id;
			this.data.eventKind = apiData.api_event_kind;
			
			// Checks whether the fleet has hit a dead end or not
			this.data.nextRoute = apiData.api_next;
			
			this.data.fleet1 = this.handleFleet(PlayerManager.fleets[this.data.sortiedFleet - 1]);
			if(this.data.fleetType > 0 && this.data.sortiedFleet === 1) {
				this.data.fleet2 = this.handleFleet(PlayerManager.fleets[1]);
			}
			
			// Sets all the event related values
			if(apiData.api_eventmap) {
				const mapStorage = KC3SortieManager.getCurrentMapData(this.currentMap[0], this.currentMap[1]);
				
				this.data.currentMapHP = apiData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = apiData.api_eventmap.api_max_maphp;
				this.data.difficulty = mapData.api_eventmap.api_selected_rank;
				this.data.gaugeNum = mapData.api_eventmap.api_gauge_num;
				this.data.gaugeType = mapData.api_eventmap.api_gauge_type;
				this.data.debuffSound = mapStorage.debuffSound;
				
				this.sendData(this.data, 'event/routing');
			}
			else{
				this.sendData(this.data, 'routing');
			}
			
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
			this.enemyComp.node = this.data.edgeID[this.data.edgeID.length - 1];
			this.enemyComp.hqLvl = this.data.hqLvl;
			this.enemyComp.difficulty = this.data.difficulty;
			this.enemyComp.enemyComp = {
				ship: apiData.api_ship_ke,
				lvl: apiData.api_ship_lv,
				hp: apiData.api_e_maxhps,
				// No api_eParam for LB air raid
				stats: apiData.api_eParam || [],
				equip: apiData.api_eSlot,
				formation: apiData.api_formation[1]
			};
			if(apiData.api_ship_ke_combined) {
				this.enemyComp.enemyComp.shipEscort = apiData.api_ship_ke_combined;
				this.enemyComp.enemyComp.lvlEscort = apiData.api_ship_lv_combined;
				this.enemyComp.enemyComp.hpEscort = apiData.api_e_maxhps_combined;
				this.enemyComp.enemyComp.statsEscort = apiData.api_eParam_combined;
				this.enemyComp.enemyComp.equipEscort = apiData.api_eSlot_combined;
			}
			if(airRaidData) {
				this.enemyComp.enemyComp.isAirRaid = true;
			}
			
			this.sendData(this.enemyComp, 'enemy-comp');
		},
		
		processDrop: function(http) {
			if(!this.currentMap[0] || !this.currentMap[1]) { return; }
			const apiData = http.response.api_data;
			const lastShipCounts = this.shipDrop.counts || {};
			this.shipDrop = {};
			
			this.shipDrop.map = this.data.map;
			this.shipDrop.node = this.data.edgeID[this.data.edgeID.length - 1];
			this.shipDrop.rank = apiData.api_win_rank;
			this.shipDrop.cleared = this.data.cleared;
			// Enemy comp name only existed in result API data
			if(this.enemyComp.enemyComp && !this.enemyComp.enemyComp.isAirRaid) {
				this.enemyComp.enemyComp.mapName = apiData.api_quest_name;
				this.enemyComp.enemyComp.compName = apiData.api_enemy_info.api_deck_name;
				this.shipDrop.enemyComp = this.enemyComp.enemyComp;
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

		processAACI: function(http) {
			const apiData = http.response.api_data;
			this.aaci = {};

			const sortiedFleet = Number(apiData.api_deck_id);
			const fleetType = PlayerManager.combinedFleet;

			if(fleetType > 0 && sortiedFleet === 1) {
				// Ignore combined fleets (for now)
				return;
			}

			if(!apiData.api_kouku || !apiData.api_kouku.api_stage2 || !apiData.api_kouku.api_stage2.api_e_count) {
				// No enemy planes in phase 2, no AACI possible
				return;
			}

			const fleet = PlayerManager.fleets[sortiedFleet - 1];

			const possibleAACIs = fleet.ship().map(ship => !ship.isAbsent() && AntiAir.shipPossibleAACIs(ship).map(id => Number(id)));
			//console.log("[TsunDB AACI] Possible AACI", possibleAACIs);
			const aaciCount = possibleAACIs.filter(arr => arr.length).length;
			if(aaciCount > 1) {
				// Don't log multiple AACI ships
				return;
			}

			this.aaci.shipPosition = possibleAACIs.findIndex(arr => arr.length);

			// api_kouku2 is ignored
			const apiAir = apiData.api_kouku.api_stage2.api_air_fire;
			if(apiAir) {
				// Triggered
				const idx = apiAir.api_idx;
				this.aaci.triggeredAACI = apiAir.api_kind;

				if(idx != this.aaci.shipPosition) {
					console.warn(`[TsunDB AACI] Wrong ship position ${idx}, expected ${this.aaci.shipPosition}! Unknown AACI?`);
					this.aaci.shipPosition = idx;
				}
			} else {
				// Not triggered
				this.aaci.triggeredAACI = -1;
			}

			if(aaciCount == 0 && this.aaci.triggeredAACI <= 0) {
				// Keep logging when none expected but one triggered
				return;
			}

			this.aaci.shipPossibleAACI = possibleAACIs[this.aaci.shipPosition];
			this.aaci.badAACI = this.aaci.triggeredAACI > 0 && !this.aaci.shipPossibleAACI.includes(this.aaci.triggeredAACI);

			const triggeredShip = fleet.ship()[this.aaci.shipPosition];
			this.aaci.ship = {
				id: triggeredShip.masterId,
				lvl: triggeredShip.level,
				damage: Math.ceil(triggeredShip.hp[0] / triggeredShip.hp[1] * 4),
				aa: triggeredShip.nakedStats("aa"),
				luck: triggeredShip.lk[0]
			};

			this.aaci.equips = triggeredShip.equipment(true).map(g => g.masterId || -1);
			this.aaci.improvements = triggeredShip.equipment(true).map(g => g.stars || -1);
			this.aaci.kc3version = this.manifest.version + ("update_url" in this.manifest ? "" : "d");

			this.sendData(this.aaci, 'aaci');
		},
		
		processDevelopment: function(http){
			this.cleanNonCombat();
			const request = http.params;
			const response = http.response.api_data;
			
			this.development.hqLvl = PlayerManager.hq.level;
			this.development.flagship = {
				id: PlayerManager.fleets[0].ship(0).masterId,
				type: PlayerManager.fleets[0].ship(0).master().api_stype,
				lvl: PlayerManager.fleets[0].ship(0).level
			};
			this.development.resources = {
				fuel: request.api_item1,
				ammo: request.api_item2,
				steel: request.api_item3,
				bauxite: request.api_item4
			};
			this.development.result = response.api_create_flag ?
				response.api_slot_item.api_slotitem_id :
				Number(response.api_fdata.split(',')[1]);
			this.development.success = response.api_create_flag;
			//console.debug(this.development);
			this.sendData(this.development, 'development');
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
			this.celldata = {};
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
		
		/**
		 * Cleans up the data of non-combat related things.
		 */
		cleanNonCombat: function(){
			this.development = {};
		},
		
		/**
		 * SPI: clean all previous states up.
		 */
		cleanup: function(){
			this.cleanOnStart();
			this.cleanOnNext();
			this.cleanNonCombat();
		},
		
		/**
		 * SPI: process entry.
		 */
		processData: function(requestObj) {
			try {
				// get data handler based on URL given
				// `null` is returned if no handler is found
				var handler = this.handlers[requestObj.call];
				if (handler) {
					if (Array.isArray(handler))
						handler.forEach(h => h.call(this, requestObj));
					else
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
			$.ajax({
				url: `https://tsundb.kc3.moe/api/${type}`,
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'tsun-ver': 'Michishio Kai'
				},
				data: JSON.stringify(payload)
			}).done( function() {
				console.log(`Tsun DB Submission to /${type} done.`);
			}).fail( function(jqXHR, textStatus, error) {
				console.warn(`Tsun DB Submission to /${type} ${textStatus}`, jqXHR.status, error);
			});
			return;
		}
	};
	window.TsunDBSubmission.init();
})();
