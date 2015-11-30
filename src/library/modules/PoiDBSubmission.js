/* Poidbsubmission.js

  KC3Kai poi-statistics data submission library

 */
(function(){
    "use strict";
    window.PoiDBSubmission = {
	// `state` should take one of the following value:
	// * `null` if the module awaits nothing
	// * `create_ship`: having "createship" consumed
	//   waiting for "kdock" message
	// * `drop_ship_1`: having "start" or "next" consumed
	//   waiting for formation info ("battle")
	// * `drop_ship_2`: waiting for the final piece of data (rank etc, shipId if any)
	state: null,
	createShipData: null,
	dropShipData: null,


	// api handler
	handlers: {},
	// <map id> => <event rank>
	mapInfo: {},

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
		// start or next
		'api_req_map/start': this.processStartNext,
		'api_req_map/next': this.processStartNext,
		// detect formation
		'api_req_sortie/battle': this.processBattle,
		'api_req_sortie/airbattle': this.processBattle,
		'api_req_sortie/night_to_day': this.processBattle,
		// 'api_req_battle_midnight/battle': this.processBattle,
		'api_req_battle_midnight/sp_midnight': this.processBattle,
		'api_req_combined_battle/airbattle': this.processBattle,
		'api_req_combined_battle/battle': this.processBattle,
		'api_req_combined_battle/sp_midnight': this.processBattle,
		'api_req_combined_battle/battle_water': this.processBattle,
		// detect ship id
		'api_req_sortie/battleresult': this.processBattleResult,
		'api_req_combined_battle/battleresult': this.processBattleResult,
	    };

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
		isBoss: ( response.api_event_id === 5)
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
	    var response = requestObj.response.api_data;
	    var dropShipData = this.dropShipData;

	    try {
		dropShipData.enemyFormation = response.api_formation[1];
	    } catch (err) {
		console.warn("error while extracting enemy formation");
		console.warn(err);
		// when there's something wrong extracting enemy formation
		// 0 is returned respecting poi's behavior
		// see: https://github.com/poooi/poi/blob/53e5ac3a992f72b3d2f4a7db9feb094879a12851/views/battle-env.coffee#L24
		dropShipData.enemyFormation = 0;
	    }

	    this.state = 'drop_ship_2';
	},
	processMapInfo: function( requestObj ) {
	    $.each( requestObj.response.api_data, function(i, entry) {
		if (entry.api_eventmap) {
		    this.mapInfo[entry.api_id] = entry.api_eventmap.api_selected_rank;
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
	    dropShipData.enemyShips = response.api_ship_id.slice(1);

	    // console.log( "[dropship] prepared: " + JSON.stringify( dropShipData ) );
	    this.sendData( "drop_ship", dropShipData );
	    this.state = null;
	},
	getApiName: function(url) {
	    var KcsApiIndex = url.indexOf("/kcsapi/");
	    return url.substring( KcsApiIndex+8 );
	},
	// get data handler based on URL given
	// `null` is returned if no handler is found
	processData: function( requestObj ) {
	    var apiName = this.getApiName( requestObj.url );
	    var handler = this.handlers[apiName];
	    if ( handler ) {
		// bind module to "this"
		handler.call(this, requestObj);
		return true;
	    }
	    return false;
	},
	cleanup: function() {
	    if (this.state !== null) {
		console.log( "aborting previous data report" );
		console.log( "interal state was: " + this.state );
	    }

	    this.state = null;
	    this.createShipData = null;
	    this.dropShipData = null;
	},
	sendData: function(target, payload) {
	    var server = "http://poi.0u0.moe" ;
	    var url = server + "/api/report/v2/" + target;
	    var myVersion = chrome.runtime.getManifest().version;
	    var client = "KC3Kai " + myVersion;
	    payload.origin = client;
	    // console.log( JSON.stringify( payload ) );
	    $.ajax({
		url: url,
		method: "POST",
		data: {
		    'data': JSON.stringify( payload )
		},
	    }).done( function() {
		console.log( "Poi DB Submission done." );
	    }).fail( function(jqXHR,textStatus,errorThrown) {
		console.warn( "Poi DB Submission failed." );
		console.warn( textStatus );
		console.warn( errorThrown );
		console.warn( jqXHR.status );
	    });
	    return;
	}
    };
    window.PoiDBSubmission._initialize();
})();

/*

TODO:

* event-related stuff is yet to be verified

* reports for

  "http://#{SERVER_HOSTNAME}/api/report/v2/select_rank"
  "http://#{SERVER_HOSTNAME}/api/report/v2/pass_event"

*/
