/**
 * TsunDBSubmission.js
 *
 * KC3Kai routing data submission module.
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
			gaugeType: null,
			debuffSound: null
		},
		enemyComp: {
			map: null,
			node: null,
			hqLvl: null,
			difficulty: null,
			enemyComp: {},
			formation: null
		},
		shipDrop : {
			map: null,
			node: null,
			rank: null,
			enemyComp: [],
			enemyDeck: null,
			hqLvl: null,
			difficulty: null,
			ship: null,
			count: null
		},
		handlers : {},
		mapInfo : [],
		
		init: function () {
			this.handlers = {
				'api_get_member/mapinfo': this.processMapInfo,
				'api_req_map/start': this.processStart,
				'api_req_map/next': this.processNext,
				'api_req_sortie/battle': this.processEnemy,
				'api_req_sortie/battleresult': this.processDrop
			};
		},
		
		processMapInfo: function(http) {
			this.mapInfo = http.response.api_data.api_map_info;
		},
		
		processStart: function(http) {
			const apiData = http.response.api_data;
			this.data.mapNodes = apiData.api_cell_data;
			this.data.edgeID = [];
			this.data.fleetSent = Number(http.params.api_deck_id);
			this.data.fleetType = PlayerManager.combinedFleet;
			this.processNext(http);
		},
		
		processNext: function(http) {
			this.clean();
			const apiData = http.response.api_data;
			
			//Sets the map id
			const world = Number(apiData.api_maparea_id);
			const map = Number(apiData.api_mapinfo_no);
			const mapId = [world, map].join('');
			const mapData = this.mapInfo.find(i => i.api_id == mapId) || {};
			this.data.map = [world, map].join('-');
			
			const mapStorage = KC3SortieManager.getCurrentMapData(world, map);
			
			//Sets all the event related values
			if(apiData.api_eventmap){
				this.data.currentMapHP = apiData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = apiData.api_eventmap.api_max_maphp;
				this.data.difficulty = KC3SortieManager.map_difficulty;
				this.data.gaugeType = mapData.api_eventmap.api_gauge_type;
				this.data.debuffSound = mapStorage.debuffSound;
			}
			
			//Sets whether the map is cleared or not
			this.data.cleared = mapData.api_cleared;
			
			//Sets player's HQ level
			this.data.hqLvl = PlayerManager.hq.level;
			
			//Charts the route array using edge ids as values
			this.data.edgeID.push(apiData.api_no);
			
			//All values related to node types
			this.data.nodeType = apiData.api_color_no;
			this.data.eventId = apiData.api_event_id;
			this.data.eventKind = apiData.api_event_kind;
			
			//Checks whether the fleet has hit a dead end or not
			this.data.nextRoute = apiData.api_next;
			
			
			this.data.fleet1 = this.handleFleet(PlayerManager.fleets[this.data.fleetSent - 1]);
			if(this.data.fleetType > 0 && this.data.fleetSent == 1) {
				this.data.fleet2 = this.handleFleet(PlayerManager.fleets[1]);
			}
			
			this.sendData(this.data, `routing`);
		},
		
		processEnemy: function(http) {
			const apiData = http.response.api_data;
			this.enemyComp = {};
			
			this.enemyComp.map = this.data.map;
			this.enemyComp.node = KC3SortieManager.currentNode().letter;
			this.enemyComp.hqLvl = this.data.hqLvl;
			this.enemyComp.difficulty = this.data.difficulty;
			this.enemyComp.enemyComp = {
				ship: apiData.api_ship_ke,
				lvl: apiData.api_ship_lv,
				hp: apiData.api_e_maxhps,
				stats: apiData.api_eParam,
				equip: apiData.api_eSlot
			};
			this.enemyComp.formation = apiData.api_formation[1];
			
			this.sendData(this.enemyComp, `enemy-comp`);
		},
		
		processDrop: function(http) {
			const apiData = http.response.api_data;
			this.shipDrop = {};
			
			this.shipDrop.map = this.data.map;
			this.shipDrop.node = KC3SortieManager.currentNode().letter;
			this.shipDrop.rank = apiData.api_win_rank;
			this.shipDrop.enemyComp = apiData.api_ship_id;
			this.shipDrop.enemyDeck = api_enemy_info.api_deck_name;
			this.shipDrop.hqLvl = this.data.hqLvl;
			this.shipDrop.difficulty = this.data.difficulty;
			this.shipDrop.ship = apiData.api_get_ship.api_ship_id;
			
			this.shipDrop.count = {};
			KC3ShipManager.find(function(ship) { return ship }).forEach(ship => {
				let id = RemodelDb.originOf(ship.masterId);
				count.hasOwnProperty(id) ? count[id] += 1 : count[id] = 1;
			});
			
			this.sendData(this.shipDrop, `drops`);
		},
		
		handleFleet: function(fleet) {
			// Update fleet minimal speed
			fleet.speed();
			// Slow fleet wins over fast
			this.data.fleetSpeed = Math.min(this.data.fleetSpeed, fleet.minSpeed);
			// F33 Cn 1,2,3 & 4
			[1,2,3,4].forEach(i => { this.data.los[i - 1] += fleet.eLos4(i); });
			return fleet.ship().map(ship => {
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
			});
		},
		
		/**
		 * Cleans up the data after each submission for each node.
		 */
		clean: function() {
			// states of fleets might be changed every nodes
			this.data.los = [0, 0, 0, 0];
			this.data.fleet1 = [];
			this.data.fleet2 = [];
			this.data.fleetSpeed = 20;
			// optional properties for event only
			this.data.currentMapHP = 0;
			this.data.maxMapHP = 0;
			this.data.difficulty = 0;
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
				method: "POST",
				headers: {"content-type": "application/json"},
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
