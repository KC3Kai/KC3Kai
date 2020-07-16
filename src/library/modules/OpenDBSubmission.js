/**
 * OpenDBSubmission.js
 *
 * Submits equip dev, ship constructions, ship drops and equipment improvements to OpenDB:
 * http://opendb.swaytwig.com/
 *
 * @deprecated since 2020-04-03 - https://github.com/KC3Kai/KC3Kai/issues/2973
 * @see PoiDBSubmission.js - copied and edited from
 */
(function(){
	"use strict";

	window.OpenDBSubmission = {
		// `state` should take one of the following value:
		// * `null`: if the module awaits nothing
		// * `create_ship`: having "createship" consumed
		//    waiting for "kdock" message
		// * `drop_ship_1`: waiting for the formation & enemies
		// * `drop_ship_2`: waiting for the final piece of data (rank etc, shipId if any)
		state: null,
		createShipData: null,
		dropShipData: null,

		// api handler
		handlers: {},
		// <map id> => <event rank>
		mapInfo: {},

		init: function (){
			this.handlers = {
				'api_get_member/mapinfo': this.processMapInfo,
				'api_req_kousyou/createship': this.processCreateShip,
				'api_get_member/kdock': this.processKDock,
				'api_req_kousyou/createitem': this.processCreateItem,
				'api_req_kousyou/remodel_slot': this.processRemodelItem,
				'api_req_map/select_eventmap_rank': this.processSelectEventMapRank,

				// start or next
				'api_req_map/start': this.processStartNext,
				'api_req_map/next': this.processStartNext,

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


				// detect ship id
				'api_req_sortie/battleresult': this.processBattleResult,
				'api_req_combined_battle/battleresult': this.processBattleResult
			};
		},
		processSelectEventMapRank: function (requestObj) {
			var params = requestObj.params;
			// I know they are strings, just being 100% sure.
			var mapId = String(params.api_maparea_id) + String(params.api_map_no);
			var rank = parseInt(params.api_rank, 10);
			this.mapInfo[mapId] = rank;
		},
		processCreateShip: function ( requestObj ) {
			this.cleanup();
			var params = requestObj.params;
			var createShipData = {
				apiver: 2,
				flagship: PlayerManager.fleets[0].ship(0).masterId,
				fuel: parseInt(params.api_item1),
				ammo: parseInt(params.api_item2),
				steel: parseInt(params.api_item3),
				bauxite: parseInt(params.api_item4),
				material: parseInt(params.api_item5),
				kdockId: parseInt(params.api_kdock_id) - 1
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
			createShipData.result =
				requestObj.response.api_data[createShipData.kdockId].api_created_ship_id;
			delete createShipData.kdockId;

			// console.debug( "[createship] prepared: " + JSON.stringify( createShipData ) );
			this.submitData("ship_build.php", createShipData);
			this.state = null;
		},
		processCreateItem: function(http) {
			const postBody = http.params;
			const body = http.response.api_data;
			body.api_get_items.forEach(e => {
				this.submitData('equip_build.php', {
					apiver: 3,
					flagship: PlayerManager.fleets[0].ship(0).masterId,
					fuel: postBody.api_item1,
					ammo: postBody.api_item2,
					steel: postBody.api_item3,
					bauxite: postBody.api_item4,
					result: e.api_slotitem_id === -1 ? 0 : e.api_slotitem_id,
				});
			});
		},
		processStartNext: function( requestObj ) {
			this.cleanup();
			if(KC3ShipManager.count() >= KC3ShipManager.max || (KC3GearManager.max - KC3GearManager.count()) <= 3)
				return;
			var response = requestObj.response.api_data;

			var dropShipData = {
				apiver: 5,
				world: response.api_maparea_id,
				map: response.api_mapinfo_no,
				node: response.api_no
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

			let enemies = {};
			// fill in formation and enemy ship info.
			try {
				enemies.formation = response.api_formation[1];
			} catch (err) {
				console.warn("Error while extracting enemy formation", err, err.stack);
				enemies.formation = 0;
			}

			// build up enemy ship array
			const handleEnemies = (enemies) => {
				// For OpenDB, empty slots = 0, not -1
				while(enemies.length < 6) enemies.push(0);
				return enemies;
			};
			try {
				enemies.ships = handleEnemies(response.api_ship_ke);
			} catch (err) {
				console.warn("Error while extracting enemy ship array", err, err.stack);
				console.info("Using an empty ship array as placeholder");
				enemies.ships = [0, 0, 0, 0, 0, 0];
			}
			if (typeof response.api_ship_ke_combined !== "undefined") {
				// console.log("processBattle: enemy fleet is combined");
				enemies.ships2 = handleEnemies(response.api_ship_ke_combined);
			}
			dropShipData.enemy = JSON.stringify(enemies);
			
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

			dropShipData.result = response.api_get_ship ? response.api_get_ship.api_ship_id : 0;
			dropShipData.rank = response.api_win_rank;
			dropShipData.maprank = this.mapInfo[dropShipData.world * 10 + dropShipData.map] || 0;
			dropShipData.inventory = response.api_get_ship ? KC3ShipManager.count(ship => RemodelDb.originOf(ship.masterId) === RemodelDb.originOf(dropShipData.result)) : 0;

			this.submitData("ship_drop.php", dropShipData);
			this.state = null;
		},
		processRemodelItem: function ( requestObj ) {
			this.cleanup();
			var params = requestObj.params;
			var response = requestObj.response.api_data;
			//console.debug( "[createitem] received: " + JSON.stringify( response ));
			if(params.api_certain_flag === 1)
				return;
			var currentItem = KC3GearManager.get(parseInt(params.api_slot_id));
			var remodelData = {
				apiver: 2,
				flagship: PlayerManager.fleets[0].ship(0).masterId,
				assistant: PlayerManager.fleets[0].ship(1).masterId || 0,
				item: currentItem.masterId,
				level: currentItem.stars,
				result: response.api_remodel_flag
			};

			this.submitData("equip_remodel.php", remodelData);
			this.state = null;
		},
		getApiName: function(url) {
			var KcsApiIndex = url.indexOf("/kcsapi/");
			return url.substring( KcsApiIndex+8 );
		},
		// SPI: process entry
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
				console.warn("Open DB Submission Error", e);
				// Pop up APIError on unexpected runtime exception
				var reportParams = $.extend({}, requestObj.params);
				delete reportParams.api_token;
				KC3Network.trigger("APIError", {
					title: KC3Meta.term("APIErrorNoticeTitle"),
					message: KC3Meta.term("APIErrorNoticeMessage").format("OpenDBSubmission"),
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
		// SPI: clean all previous states up
		cleanup: function() {
			if (this.state !== null) {
				console.log("Aborting previous data report, interal state was:", this.state);
			}
			this.state = null;
			this.createShipData = null;
			this.dropShipData = null;
		},
		submitData: function (endpoint, payload){
			/*
			console.debug("Sending to /" + endpoint + ", data: " + JSON.stringify(payload));
			if(true) return;
			*/
			var post = $.ajax({
				url: "http://opendb.swaytwig.com/report/" + endpoint,
				method: "POST",
				data: payload,
			}).done( function() {
				console.log(`OpenDB Submission to /${endpoint} done.`);
			}).fail( function(jqXHR, textStatus, errorThrown) {
				console.warn(`OpenDB Submission to /${endpoint} ${textStatus}`, errorThrown);
			});
		}
	};

	window.OpenDBSubmission.init();
})();
