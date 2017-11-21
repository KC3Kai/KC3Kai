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
			bossEdge: [],
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
		handlers : {},
		mapInfo : [],
		
		init: function () {
			this.handlers = {
				/* More detailed info regarding a map.
					response.api_data:
					api_map_info : Array of all the maps as objects
						api_id: Map ID
						api_cleared : Map is cleared.
						api_eventmap : If this is an event map...
							api_now_maphp : Current HP of the map.
							api_max_maphp : Max HP of the map.
							api_selected_rank : Difficulty set. 0=Not set, 1=丙, 2=乙, 3=甲
							api_gauge_type : 2 = HP gauge, 3 = TP gauge
				*/
				'api_get_member/mapinfo': this.processMapInfo,
				
				/* Triggered when you start a sortie.
					response.api_data:
					api_no : Edge ID
				*/
				'api_req_map/start': this.processStart,
				'api_req_map/next': this.processNext
			};
		},
		
		processMapInfo: function(http) {
			this.mapInfo = http.response.api_data.api_map_info;
		},
		
		processStart: function(http) {
			const apiData = http.response.api_data;
			this.data.mapNodes = apiData.api_cell_data;
			this.data.edgeID = [];
			this.data.bossEdge = [apiData.api_bosscell_no];
			// NOTE: because this is pre-process, when `api_req_map/start` called,
			// `KC3SortieManager.startSortie` is not executed yet
			this.data.fleetSent = Number(http.params.api_deck_id);
			this.processNext(http);
		},
		
		processNext: function(http) {
			this.clean();
			const apiData = http.response.api_data;
			const world = Number(apiData.api_maparea_id);
			const map = Number(apiData.api_mapinfo_no);
			const mapId = [world, map].join('');
			const mapData = this.mapInfo.find(i => i.api_id == mapId) || {};
			const mapStorage = KC3SortieManager.getCurrentMapData(world, map);
			
			if(mapData.api_eventmap) {
				this.data.currentMapHP = mapData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = mapData.api_eventmap.api_max_maphp;
				this.data.difficulty = mapData.api_eventmap.api_selected_rank;
				this.data.gaugeType = mapData.api_eventmap.api_gauge_type;
			}
			
			this.data.map = [world, map].join('-');
			this.data.debuffSound = mapStorage.debuffSound;
			this.data.cleared = mapData.api_cleared;
			this.data.hqLvl = PlayerManager.hq.level;
			this.data.fleetType = PlayerManager.combinedFleet;
			
			this.data.edgeID.push(apiData.api_no);
			this.data.bossEdge.push(apiData.api_bosscell_no);
			this.data.nodeType = apiData.api_color_no;
			this.data.eventId = apiData.api_event_id;
			this.data.eventKind = apiData.api_event_kind;
			this.data.nextRoute = apiData.api_next;
			
			this.data.fleet1 = this.handleFleet(PlayerManager.fleets[this.data.fleetSent - 1]);
			if(this.data.fleetType > 0 && this.data.fleetSent == 1) {
				this.data.fleet2 = this.handleFleet(PlayerManager.fleets[1]);
			}
			
			this.sendData(this.data);
		},
		
		handleFleet: function(fleet) {
			// Update fleet minimal speed
			fleet.speed();
			// Slow fleet wins over fast
			this.data.fleetSpeed = Math.min(this.data.fleetSpeed, fleet.minSpeed);
			// F33 Cn 1,2,3 & 4
			[1,2,3,4].forEach(i => { this.data.los[i - 1] += fleet.eLos4(i); });
			return fleet.ship().map(ship => (ship.isDummy() || ship.didFlee || ship.hp[0] <= 0) ? -1 : {
				name: ship.master().api_name,
				type: ship.master().api_stype,
				speed: ship.speed,
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
		
		sendData: function(payload) {
			//console.debug(JSON.stringify(payload));
			$.ajax({
				url: "http://kckai.cybersnets.com/api/routing",
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
