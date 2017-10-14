/**
 * PoiDBSubmission.js
 *
 * KC3Kai poi-statistics data submission module.
 *
 */
(function(){
	"use strict";

	window.PoiDBSubmission = {
		// `state` should take one of the following value:
		// * `null` if the module awaits nothing
		// * `create_ship`: having "createship" consumed
		//	 waiting for "kdock" message
		// * `drop_ship_1`: having "start" or "next" consumed
		//	 waiting for formation info ("battle")
		// * `drop_ship_2`: waiting for the final piece of data (rank etc, shipId if any)
		state: null,
		createShipData: null,
		dropShipData: null,

		// api handler
		handlers: {},
		// <map id> => <event rank>
		mapInfo: {},
		reportOrigin: "KC3Kai",

		// *INTERNAL USE ONLY*
		// because when building this dictionary
		// fields are not yet available
		// so we initialize handler table
		// after object's creation
		_initialize: function () {
			this.handlers = {
				'api_get_member/mapinfo': this.processMapInfo,
				'api_req_kousyou/createship': this.processCreateShip,
				'api_get_member/kdock': this.processKDock,
				'api_req_kousyou/createitem': this.processCreateItem,
				'api_req_map/select_eventmap_rank': this.processSelectEventMapRank,
				// start or next
				'api_req_map/start': this.processStartNext,
				'api_req_map/next': this.processStartNext,
				// detect formation
				'api_req_sortie/battle': this.processBattle,
				'api_req_sortie/airbattle': this.processBattle,
				// the following two are commented out 
				// as poi "plugin-report" doesn't seem to support them.
				// (might have been deprecated)
				// 'api_req_sortie/night_to_day': this.processBattle,
				// 'api_req_battle_midnight/battle': this.processBattle,

				"api_req_sortie/ld_airbattle": this.processBattle,
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
				"api_req_combined_battle/each_ld_airbattle": this.processBattle,

				// detect ship id
				'api_req_sortie/battleresult': this.processBattleResult,
				'api_req_combined_battle/battleresult': this.processBattleResult,
			};

			this.reportOrigin = "KC3Kai " + chrome.runtime.getManifest().version;
		},
		processSelectEventMapRank: function (requestObj) {
			var params = requestObj.params;
			// I know they are strings, just being 100% sure.
			var mapId = String(params.api_maparea_id) + String(params.api_map_no);
			var rank = parseInt(params.api_rank, 10);
			this.mapInfo[mapId] = rank;
			var selectRankData = {
				teitokuLv: PlayerManager.hq.level,
				teitokuId: PlayerManager.hq.nameId,
				mapareaId: mapId,
				rank: rank 
			};
			this.sendData("select_rank", selectRankData);
		},
		processCreateShip: function ( requestObj ) {
			this.cleanup();
			var params = requestObj.params;
			var createShipData = {
				items: [
					parseInt(params.api_item1),
					parseInt(params.api_item2),
					parseInt(params.api_item3),
					parseInt(params.api_item4),
					parseInt(params.api_item5)],
				kdockId: parseInt(params.api_kdock_id) - 1,
				secretary: PlayerManager.fleets[0].ship(0).masterId,
				teitokuLv: PlayerManager.hq.level,
				largeFlag: (parseInt(params.api_large_flag) === 0) ? false : true,
				highspeed: parseInt(params.api_highspeed)
			};
			this.createShipData = createShipData;
			this.state = "create_ship";
		},
		processKDock: function( requestObj ) {
			if (this.state !== 'create_ship') {
				this.cleanup();
				return;
			}
			var createShipData = this.createShipData;
			createShipData.shipId =
				requestObj.response.api_data[createShipData.kdockId].api_created_ship_id;

			// console.log( "[createship] prepared: " + JSON.stringify( createShipData ) );
			this.sendData("create_ship", createShipData);
			this.state = null;
		},
		processCreateItem: function( requestObj ) {
			this.cleanup();
			var params = requestObj.params;
			var response = requestObj.response.api_data;
			var createItemData = {
				items: [
					parseInt(params.api_item1),
					parseInt(params.api_item2),
					parseInt(params.api_item3),
					parseInt(params.api_item4)],
				secretary: PlayerManager.fleets[0].ship(0).masterId,
				teitokuLv: PlayerManager.hq.level
			};

			createItemData.successful = (response.api_create_flag === 1);
			if (createItemData.successful) {
				createItemData.itemId = response.api_slot_item.api_slotitem_id;
			} else {
				createItemData.itemId = parseInt( response.api_fdata.split(',')[1] );
			}
			// console.log( "[createitem] prepared: " + JSON.stringify( createItemData ));
			this.sendData("create_item", createItemData);
		},
		processStartNext: function( requestObj ) {
			this.cleanup();
			var response = requestObj.response.api_data;

			var dropShipData = {
				mapId: response.api_maparea_id*10 + response.api_mapinfo_no,
				cellId: response.api_no,
				isBoss: (response.api_event_id === 5)
			};

			this.dropShipData = dropShipData;
			this.state = 'drop_ship_1';
		},
		processBattle: function( requestObj ) {
			if (this.state !== 'drop_ship_1' &&
				// could have night battles, in which case "processBattle"
				// is entered more than once
				this.state !== 'drop_ship_2') {
				this.cleanup();
				return;
			}
			// if this function ("processBattle") is entered more than once for a single battle
			// (which usually happens when the user starts with day battle and decide to go for night one)
			// the latest formation takes priority.

			var response = requestObj.response.api_data;
			var dropShipData = this.dropShipData;

			// fill in formation and enemy ship info.
			try {
				dropShipData.enemyFormation = response.api_formation[1];
			} catch (err) {
				console.warn("Error while extracting enemy formation", err, err.stack);
				// when there's something wrong extracting enemy formation
				// 0 is returned respecting poi's behavior
				// see: https://github.com/poooi/poi/blob/53e5ac3a992f72b3d2f4a7db9feb094879a12851/views/battle-env.coffee#L24
				dropShipData.enemyFormation = 0;
			}

			// build up enemy ship array
			var enemyShips;
			try {
				enemyShips = response.api_ship_ke.slice(1,7);
			} catch (err) {
				console.warn("Error while extracting enemy ship array", err, err.stack);
				console.info("Using an empty ship array as placeholder");
				enemyShips = [-1,-1,-1,-1,-1,-1];
			}
			if (enemyShips.length !== 6) {
				console.warn("ProcessBattle: incorrect enemy ship arr length expect 6 but got " 
							 + enemyShips.length );
			}
			if (typeof response.api_ship_ke_combined !== "undefined") {
				// console.log("processBattle: enemy fleet is combined");
				enemyShips = enemyShips.concat( response.api_ship_ke_combined.slice(1,7) );
				if (enemyShips.length !== 12) {
					console.warn("ProcessBattle: incorrect enemy ship arr length expect 12 but got " 
								 + enemyShips.length );
				}
			}
			dropShipData.enemyShips = enemyShips;
			this.state = 'drop_ship_2';
		},
		processMapInfo: function( requestObj ) {
			var self = this;
			$.each( requestObj.response.api_data.api_map_info, function(i, entry) {
				if (entry.api_eventmap) {
					self.mapInfo[entry.api_id] = entry.api_eventmap.api_selected_rank;
				}
			});
		},
		processBattleResult: function( requestObj ) {
			if (this.state !== 'drop_ship_2') {
				this.cleanup();
				return;
			}

			var response = requestObj.response.api_data;
			var dropShipData = this.dropShipData;

			dropShipData.shipId = response.api_get_ship ? response.api_get_ship.api_ship_id : -1;
			dropShipData.quest = response.api_quest_name;
			dropShipData.enemy = response.api_enemy_info.api_deck_name;
			dropShipData.mapLv = this.mapInfo[dropShipData.mapId] || 0;
			dropShipData.rank = response.api_win_rank;
			dropShipData.teitokuLv = PlayerManager.hq.level;

			if (typeof dropShipData.enemyShips === "undefined") {
				console.info("[dropship] missing enemy ship info during battle, info from battleresult is used instead.");
				dropShipData.enemyShips = response.api_ship_id.slice(1);
			}

			dropShipData.itemId = (typeof response.api_get_useitem === "undefined")
				? -1
				: response.api_get_useitem.api_useitem_id;

			console.debug("[dropship] prepared dropShipData", JSON.stringify( dropShipData ));
			this.sendData( "drop_ship", dropShipData );
			this.state = null;

			if (response.api_get_eventitem) {
				// having this field means the player has completed this event map.
				var passEventData = {
					teitokuId: PlayerManager.hq.nameId,
					teitokuLv: PlayerManager.hq.level,
					teitoku: PlayerManager.hq.name,
					mapId: dropShipData.mapId,
					mapLv: dropShipData.mapLv
				};
				console.debug("Passing an event map, raw data", JSON.stringify( passEventData ));
				this.sendData("pass_event", passEventData);
			}
		},
		getApiName: function(url) {
			var KcsApiIndex = url.indexOf("/kcsapi/");
			return url.substring( KcsApiIndex+8 );
		},
		// get data handler based on URL given
		// `null` is returned if no handler is found
		processData: function( requestObj ) {
			try {
				var apiName = this.getApiName( requestObj.url );
				var handler = this.handlers[apiName];
				if ( handler ) {
					// bind module to "this"
					handler.call(this, requestObj);
					return true;
				}
				return false;
			} catch (e) {
				console.warn("Poi DB Submission Error", e);
				// Pop up APIError on unexpected runtime exception
				var reportParams = $.extend({}, requestObj.params);
				delete reportParams.api_token;
				KC3Network.trigger("APIError", {
					title: KC3Meta.term("APIErrorNoticeTitle"),
					message: KC3Meta.term("APIErrorNoticeMessage").format("PoiDBSubmission"),
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
		cleanup: function() {
			if (this.state !== null) {
				console.log( "Aborting previous data report, interal state was:", this.state );
			}

			this.state = null;
			this.createShipData = null;
			this.dropShipData = null;
		},
		sendData: function(target, payload) {
			var server = "http://poi.0u0.moe";
			var url = server + "/api/report/v2/" + target;
			payload.origin = this.reportOrigin;
			// console.debug( "Endpoint: " + target + ", data: " + JSON.stringify( payload ) );
			$.ajax({
				url: url,
				method: "POST",
				data: {
					'data': JSON.stringify( payload )
				},
			}).done( function() {
				console.log( "Poi DB Submission done." );
			}).fail( function(jqXHR, textStatus, errorThrown) {
				console.warn( "Poi DB Submission failed:", textStatus, errorThrown);
			});
			return;
		}
	};
	window.PoiDBSubmission._initialize();
})();
