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
		// * `remodel_slotdetail`: viewing Akashi improvement recipe details
		//	 waiting for confirming
		state: null,
		createShipData: null,
		dropShipData: null,
		remodelRecipeList: null,
		remodelRecipeData: null,
		remodelKnownRecipes: [],
		remodelKnownRecipesLastUpdated: 0,

		// api handler
		handlers: {},
		// <map id> => <event rank>
		mapInfo: {},
		reportServer: "http://poi.0u0.moe",
		reportApiBaseUrl: "/api/report/v2/",
		reportOrigin: "KC3Kai",

		// *INTERNAL USE ONLY*
		// because when building this dictionary
		// fields are not yet available
		// so we initialize handler table
		// after object's creation
		_initialize: function () {
			this.handlers = {
				'api_get_member/mapinfo': this.processMapInfo,
				'api_req_map/select_eventmap_rank': this.processSelectEventMapRank,
				'api_req_kousyou/createship': this.processCreateShip,
				'api_get_member/kdock': this.processKDock,
				'api_req_kousyou/createitem': this.processCreateItem,

				// collect recipe details, comment them out if data enough for poi-db
				'api_req_kousyou/remodel_slotlist': this.processRemodelRecipeList,
				'api_req_kousyou/remodel_slotlist_detail': this.processRemodelRecipeDetail,
				'api_req_kousyou/remodel_slot': this.processRemodelSlot,

				// start or next
				'api_req_map/start': this.processStartNext,
				'api_req_map/next': this.processStartNext,
				// detect formation
				'api_req_sortie/battle': this.processBattle,
				'api_req_sortie/airbattle': this.processBattle,
				// the following are commented out
				// as poi "plugin-report" doesn't seem to support them.
				// (might have been deprecated)
				// 'api_req_sortie/night_to_day': this.processBattle,
				// 'api_req_battle_midnight/battle': this.processBattle,
				// "api_req_combined_battle/each_airbattle": this.processBattle,
				// "api_req_combined_battle/each_ld_airbattle": this.processBattle,
				// "api_req_combined_battle/each_sp_midnight": this.processBattle,
				// "api_req_combined_battle/ec_midnight_battle": this.processBattle,

				"api_req_sortie/ld_airbattle": this.processBattle,
				'api_req_battle_midnight/sp_midnight': this.processBattle,
				'api_req_combined_battle/airbattle': this.processBattle,
				'api_req_combined_battle/battle': this.processBattle,
				'api_req_combined_battle/sp_midnight': this.processBattle,
				'api_req_combined_battle/battle_water': this.processBattle,
				"api_req_combined_battle/ld_airbattle": this.processBattle,

				"api_req_combined_battle/ec_battle": this.processBattle,
				"api_req_combined_battle/each_battle": this.processBattle,
				"api_req_combined_battle/each_battle_water": this.processBattle,
				"api_req_combined_battle/ec_night_to_day": this.processBattle,

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
		processCreateItem: function(http) {
			const postBody = http.params;
			const body = http.response.api_data;
			body.api_get_items.forEach(e => {
				this.sendData('create_item', {
					items: [
						parseInt(postBody.api_item1),
						parseInt(postBody.api_item2),
						parseInt(postBody.api_item3),
						parseInt(postBody.api_item4),
					],
					itemId: e.api_slotitem_id,
					teitokuLv: PlayerManager.hq.level,
					secretary: PlayerManager.fleets[0].ship(0).masterId,
					successful: e.api_slotitem_id !== -1,
				});
			});
		},
		processRemodelRecipeList: function( requestObj ) {
			// To avoid state warning log if previous details viewed and canceled
			if (this.state === 'remodel_slotdetail') this.state = null;
			this.cleanup();
			this.remodelRecipeList = requestObj.response.api_data;
			this.lazyInitKnownRecipes();
		},
		processRemodelRecipeDetail: function( requestObj ) {
			// Player may just click cancel after viewing details, no state to be checked
			if (!Array.isArray(this.remodelRecipeList)) {
				this.cleanup();
				return;
			}
			var params = requestObj.params;
			var response = requestObj.response.api_data;
			var recipeId = parseInt(params.api_id);
			var recipe = this.remodelRecipeList.find(r => r.api_id === recipeId);
			if (!recipe) {
				// not supposed to occur if recipe list not empty
				console.warn("Selected remodel recipe not found in previous list", recipeId, this.remodelRecipeList);
				return;
			}
			var rosterId = parseInt(params.api_slot_id);
			// Have to get current stars of the item to be improved,
			// otherwise should not reference state-ful KC3GearManager at all.
			var gearObj = KC3GearManager.get(rosterId);
			var currentLevel = gearObj.stars || 0;
			var stage = response.api_change_flag ? 2 :
				currentLevel >= 10 ? 2 :
				currentLevel >= 6 ? 1 : 0;
			this.remodelRecipeData = {
				recipeId: recipeId,
				itemId: recipe.api_slot_id,
				stage: stage,
				day: Date.getJstDate().getDay(),
				fuel: recipe.api_req_fuel || 0,
				ammo: recipe.api_req_bull || 0,
				steel: recipe.api_req_steel || 0,
				bauxite: recipe.api_req_bauxite || 0,
				reqItemId: response.api_req_slot_id || -1,
				reqItemCount: response.api_req_slot_num || 0,
				//reqUseitemId: response.api_req_useitem_id || -1,
				//reqUseitemCount: response.api_req_useitem_num || 0,
				buildkit: response.api_req_buildkit || 0,
				remodelkit: response.api_req_remodelkit || 0,
				certainBuildkit: response.api_certain_buildkit || 0,
				certainRemodelkit: response.api_certain_remodelkit || 0
			};
			this.state = "remodel_slotdetail";
		},
		processRemodelSlot: function( requestObj ) {
			if (this.state !== 'remodel_slotdetail' || !this.remodelRecipeData) {
				this.cleanup();
				return;
			}
			var params = requestObj.params;
			var response = requestObj.response.api_data;
			var data = this.remodelRecipeData;
			var recipeId = parseInt(params.api_id);
			// Verify if recipe ID matches with previous detail used
			if (recipeId !== data.recipeId) {
				console.warn("Used remodel recipe not match with previous detail", recipeId, this.remodelRecipeData);
				return;
			}
			var isCertainSuccess = !!parseInt(params.api_certain_flag);
			var isSuccess = !!response.api_remodel_flag;
			// It's 2nd ship anyway, secretary is always Akashi
			data.secretary = response.api_voice_ship_id || -1;
			var afterRemodelIds = response.api_remodel_id;
			var afterRemodelSlot = response.api_after_slot;
			data.upgradeToItemId = -1;
			data.upgradeToItemLevel = -1;
			if (isSuccess && afterRemodelSlot) {
				if (afterRemodelIds[0] !== afterRemodelIds[1]) {
					data.upgradeToItemId = afterRemodelSlot.api_slotitem_id;
					data.upgradeToItemLevel = afterRemodelSlot.api_level;
					// fix stage if necessary
					if (data.stage !== 2) data.stage = 2;
				} else {
					// try to fix stage if getting level before improvement from KC3Gear fails
					var previousLevel = afterRemodelSlot.api_level - 1;
					if (!data.stage) data.stage = previousLevel >= 6 ? 1 : 0;
				}
			}
			data.key = `r${data.recipeId}-i${data.itemId}-s${data.stage}-d${data.day}-s${data.secretary}`;

			// Besides well-known recipes,
			// failed or duplicated improvement seems be noisy for recipe recording
			// see https://github.com/poooi/plugin-report/blob/master/reporters/remodel-recipe.es#L113
			if (!isSuccess || !this.remodelKnownRecipes.length
				|| this.remodelKnownRecipes.includes(data.key)
				|| [101, 201, 301].includes(data.recipeId)) {
				console.log("Ignored to report remodel recipe for failed or duplicated improvement", data);
			} else {
				this.remodelKnownRecipes.push(data.key);
				this.sendData("remodel_recipe", data);
			}

			// Go back to improvement list like it does in-game, not clean all up
			this.state = null;
			this.remodelRecipeData = null;
		},
		lazyInitKnownRecipes: function() {
			// Update known recipes if not initialized or data older than 30 mins
			if (!this.remodelKnownRecipes.length
				|| (Date.now() - this.remodelKnownRecipesLastUpdated) > 30 * 60 * 1000) {
				$.ajax({
					url: this.reportServer + this.reportApiBaseUrl + "known_recipes",
					method: "GET",
					dataType: "json",
					success: (json) => {
						if (Array.isArray(json.recipes)) {
							this.remodelKnownRecipes = json.recipes;
							this.remodelKnownRecipesLastUpdated = Date.now();
						}
					}
				});
			}
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
			// if any info is missing/error occurred, default to undefined
			dropShipData.enemyFormation = response.api_formation && response.api_formation[1];

			// build up enemy ship array, updated as of https://github.com/poooi/plugin-report/commit/843702876444435134d5f8d93c2c0f59ff0b5bd6
			// enemyShips1 contains enemy main fleet, enemyShips2 contains enemy escort fleet (if any)
			dropShipData.enemyShips1 = response.api_ship_ke || [];
			dropShipData.enemyShips2 = response.api_ship_ke_combined || [];
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
			// Remind: KC3SortieManager and current node are not updated about battle result yet
			var currentNode = KC3SortieManager.currentNode();
			var currentMapId = KC3SortieManager.map_world*10 + KC3SortieManager.map_num;
			if (dropShipData.cellId !== currentNode.id || dropShipData.mapId !== currentMapId) {
				console.warn(`Incorrect cell/map for ${currentMapId} edge ${currentNode.id}`, dropShipData);
				this.cleanup();
				return;
			}

			dropShipData.shipId = response.api_get_ship ? response.api_get_ship.api_ship_id : -1;
			dropShipData.quest = response.api_quest_name;
			dropShipData.enemy = response.api_enemy_info.api_deck_name;
			dropShipData.mapLv = this.mapInfo[dropShipData.mapId] || 0;
			dropShipData.rank = response.api_win_rank;
			dropShipData.baseExp = response.api_get_base_exp;
			dropShipData.teitokuLv = PlayerManager.hq.level;

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
		// SPI: process entry
		// get data handler based on URL given
		// `null` is returned if no handler is found
		processData: function( requestObj ) {
			try {
				var handler = this.handlers[requestObj.call];
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
		// SPI: clean all previous states up
		cleanup: function() {
			if (this.state !== null) {
				console.log( "Aborting previous data report, interal state was:", this.state );
			}

			this.state = null;
			this.createShipData = null;
			this.dropShipData = null;
			this.remodelRecipeList = null;
			this.remodelRecipeData = null;
		},
		sendData: function(target, payload) {
			var url = this.reportServer + this.reportApiBaseUrl + target;
			payload.origin = this.reportOrigin;
			// console.debug( "Endpoint: " + target + ", data: " + JSON.stringify( payload ) );
			$.ajax({
				url: url,
				method: "POST",
				data: {
					'data': JSON.stringify( payload )
				},
			}).done( function() {
				console.log(`Poi DB Submission to ${target} done.`);
			}).fail( function(jqXHR, textStatus, errorThrown) {
				console.warn(`Poi DB Submission to ${target} ${textStatus}`, errorThrown);
			});
			return;
		}
	};
	window.PoiDBSubmission._initialize();
})();
