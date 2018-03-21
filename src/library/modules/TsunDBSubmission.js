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
			enemyComp: {},
			hqLvl: null,
			difficulty: null,
			ship: null,
			count: null
		},
		handlers : {},
		mapInfo : [],
		currentMap: [0,0],
		
		// `state` should take one of the following value:
		// * `null`: if the module awaits nothing
		// * `create_ship`: having "createship" consumed
		//    waiting for "kdock" message
		// * `drop_ship_1`: waiting for the formation & enemies
		// * `drop_ship_2`: waiting for the final piece of data (rank etc, shipId if any)
		state: null,
		
		init: function () {
			this.handlers = {
				'api_get_member/mapinfo': this.processMapInfo,
				
				'api_req_map/select_eventmap_rank': this.processSelectEventMapRank,
				
				
				'api_req_map/start': this.processStart,
				'api_req_map/next': this.processNext,
				
				// battles for formation / etc
				'api_req_sortie/battle': this.processBattle,
				'api_req_sortie/airbattle': this.processBattle,
				'api_req_sortie/night_to_day': this.processBattle,
				'api_req_sortie/ld_airbattle': this.processBattle,

				'api_req_battle_midnight/battle': this.processBattle,
				'api_req_battle_midnight/sp_midnight': this.processBattle,

				'api_req_combined_battle/airbattle': this.processBattle,
				'api_req_combined_battle/battle': this.processBattle,
				'api_req_combined_battle/sp_midnight': this.processBattle,
				'api_req_combined_battle/battle_water': this.processBattle,
				"api_req_combined_battle/ld_airbattle": this.processBattle,
				"api_req_combined_battle/ec_battle": this.processBattle,
				"api_req_combined_battle/each_battle": this.processBattle,
				"api_req_combined_battle/each_airbattle": this.processBattle,
				"api_req_combined_battle/each_sp_midnight": this.processBattle,
				"api_req_combined_battle/each_battle_water": this.processBattle,
				"api_req_combined_battle/ec_midnight_battle": this.processBattle,
				"api_req_combined_battle/ec_night_to_day": this.processBattle,
				"api_req_combined_battle/each_ld_airbattle": this.processBattle,
				
				
				'api_req_sortie/battleresult': this.processDrop,
				'api_req_combined_battle/battleresult': this.processDrop
			};
		},
		
		processMapInfo: function(http) {
			var self = this;
			$.each( http.response.api_data.api_map_info, function(i, entry) {
				if (entry.api_eventmap) {
					self.mapInfo[entry.api_id] = entry.api_eventmap.api_selected_rank;
				}
			});
		},
		
		processSelectEventMapRank: function (http) {
			var params = http.params;
			// I know they are strings, just being 100% sure.
			var mapId = String(params.api_maparea_id) + String(params.api_map_no);
			var rank = parseInt(params.api_rank, 10);
			this.mapInfo[mapId] = rank;
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
			
			this.data.fleetType = null;
			this.data.fleet1 = [];
			this.data.fleet2 = [];
			this.data.los = [];
			this.data.fleetSpeed = 20;
			
			const apiData = http.response.api_data;
			
			//Sets the map id
			const world = Number(apiData.api_maparea_id);
			const map = Number(apiData.api_mapinfo_no);
			this.currentMap = [world, map];
			const mapId = [world, map].join('');
			const mapData = this.mapInfo.find(i => i.api_id == mapId) || {};
			this.data.map = [world, map].join('-');
			
			const mapStorage = KC3SortieManager.getCurrentMapData(world, map);
			
			//Sets all the event related values
			if(apiData.api_eventmap){
				this.data.currentMapHP = apiData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = apiData.api_eventmap.api_max_maphp;
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
			
			this.state = 'drop_ship_1';
			this.sendData(this.data, `routing`);
		},
		
		processBattle: function(http) {
			if (this.state !== 'drop_ship_1') return;
			// if this function ("processBattle") is entered more than once for a single battle
			// the next one will be skipped until the state returns to 1.

			var response = http.response.api_data;
			this.enemyComp = {
				map: this.data.map,
				node: KC3Meta.nodeLetter(KC3SortieManager.map_world, KC3SortieManager.map_num, this.data.edgeID[this.data.edgeID.length-1]),
				hqLvl: this.data.hqLvl,
				difficulty: this.data.difficulty,
				enemies: {},
				formation: null
			};
			// fill in formation and enemy ship info.
			try {
				this.enemyComp.formation = response.api_formation[1];
			} catch (err) {
				console.warn("Error while extracting enemy formation", err, err.stack);
			}
			try {
				this.enemyComp.enemies.fleet1 = response.api_ship_ke;
			} catch (err) {
				console.warn("Error while extracting enemy ship array", err, err.stack);
			}
			if (typeof response.api_ship_ke_combined !== "undefined") {
				// console.log("processBattle: enemy fleet is combined");
				this.enemyComp.enemies.ships2 = response.api_ship_ke_combined;
			}
			
			this.state = 'drop_ship_2';
			this.sendData(this.shipDrop, `enemy-comp`);
		},
		
		processDrop: function(http) {
			if(KC3ShipManager.count() >= KC3ShipManager.max || (KC3GearManager.max - KC3GearManager.count()) <= 3){
				this.cleanup();
				return;
			}
			if (this.state !== 'drop_ship_2') {
				this.cleanup();
				return;
			}
			
			const apiData = http.response.api_data;
			this.shipDrop = {
				map: this.data.map,
				node: KC3Meta.nodeLetter(KC3SortieManager.map_world, KC3SortieManager.map_num, this.data.edgeID[this.data.edgeID.length-1]),
				rank: apiData.api_win_rank,
				enemyComp: this.enemyComp.enemies,
				hqLvl: this.data.hqLvl,
				difficulty: this.data.difficulty,
				ship: apiData.hasOwnProperty(api_get_ship) ? apiData.api_get_ship.api_ship_id : -1,
				count: {}
			};
			
			KC3ShipManager.find(function(ship) { return ship }).forEach(ship => {
				let id = RemodelDb.originOf(ship.masterId);
				count.hasOwnProperty(id) ? count[id] += 1 : count[id] = 1;
			});
			
			this.sendData(this.shipDrop, `drops`);
			this.state = null;
		},
		
		getApiName: function(url) {
			var KcsApiIndex = url.indexOf("/kcsapi/");
			return url.substring( KcsApiIndex+8 );
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
		 * Cleans up the data after each submission for each node.
		 */
		cleanup: function() {
			if (this.state !== null) {
				console.log("Aborting previous data report, internal state was:", this.state);
			}
			this.state = null;
			this.enemyComp = null;
			this.shipDrop = null;
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
