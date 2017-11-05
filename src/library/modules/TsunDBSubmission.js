/* TsunDBSubmission.js
	KC3Kai routing related submission library.
	Copied and edited from PoiDBSubmission.js
*/
(function(){
	"use strict";
	
	window.TsunDBSubmission = {
		data : {
			map: null,
			hqLvl: null,
			fleetType: null,
			fleetSpeed: null,
			fleet1: [],
			fleet2: [],
			los: null,
			edgeID: [],
			nodeType: null,
			cleared: null,
			difficulty: null,
			currentMapHP: null,
			maxMapHP: null,
			gaugeType: null
		},
		// api handler
		handlers : {},
		// <map id> => <event rank>
		mapInfo : [],
		
		init: function (){
			this.handlers = {
				/*More detailed info regarding a map.
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
				
				/*Triggered when you start a sortie.
				  response.api_data:
					api_no : Edge ID
				*/
				'api_req_map/start': this.processStart,
				'api_req_map/next': this.processNext
			};
		},
		
		processMapInfo: function( requestObj ) {
			this.mapInfo = requestObj.response.api_data.api_map_info;
		},
		
		processStart: function(requestObj){
			this.data.edgeID = [];
			this.processNext(requestObj);
		},

		processNext: function(requestObj) {
			this.clean();
			let response = requestObj.response.api_data;
			let mapData = {};
			for(let i = 0;i < this.mapInfo.length;i++){
				if(this.mapInfo[i].api_id == parseInt(String(response.api_maparea_id)+String(response.api_mapinfo_no))){
					mapData = this.mapInfo[i];
					break;
				}
			}
			this.data.cleared = mapData.api_cleared;
			this.data.map = String(response.api_maparea_id) + "-" + String(response.api_mapinfo_no);
			this.data.difficulty = KC3SortieManager.map_difficulty;
			this.data.hqLvl = PlayerManager.hq.level;
			this.data.fleetType = PlayerManager.combinedFleet;
			this.data.edgeID.push(response.api_no);
			this.data.nodeType = response.api_color_no;
			if(mapData.hasOwnProperty('api_eventmap')){
				this.data.currentMapHP = mapData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = mapData.api_eventmap.api_max_maphp;
				this.data.difficulty = mapData.api_eventmap.api_selected_rank;
				this.data.gaugeType = mapData.api_eventmap.api_gauge_type;
			}
			this.data.fleet1 = this.handleFleet(PlayerManager.fleets[KC3SortieManager.fleetSent - 1]);
			if(this.data.fleetType > 0){
				this.data.fleet2 = this.handleFleet(PlayerManager.fleets[1]);
			}
			this.sendData(this.data);
		},

		handleFleet: function(fleet) {
			fleet.speed(); // Update fastFleet
			this.data.fleetSpeed = Math.min(this.data.fleetSpeed, fleet.fastFleet); // Slow fleet (0) wins over fast
			[1,2,3,4].forEach((i) => this.data.los[i - 1] += fleet.eLoS(i)); // Cn 1,2,3 & 4
			return fleet.ship().map(function(ship){
				return (ship.didFlee || ship.hp[0] < 1) ? -1 : {
					id: ship.masterId,
					type: KC3ShipManager.get(ship.rosterId).stype(),
					speed: ship.speed,
					equip: ship.items.map((equipid) => KC3GearManager.get(equipid).masterId)
				};
			});
		},
		
		/*
		Cleans up the data after each submission.
		*/
		clean: function() {
			this.data.map = null;
			this.data.los = [0, 0, 0, 0];
			this.data.fleet1 = [];
			this.data.fleet2 = [];
			this.data.fleetSpeed = 20;
			this.data.currentMapHP = 0;
			this.data.maxMapHP = 0;
			this.data.difficulty = 0;
			this.data.gaugeType = 0;
		},
		
		getApiName: function(url) {
			var KcsApiIndex = url.indexOf("/kcsapi/");
			return url.substring( KcsApiIndex+8 );
		},
		
		// get data handler based on URL given
		// `null` is returned if no handler is found
		processData: function(requestObj) {
			try {
				var apiName = this.getApiName(requestObj.url);
				var handler = this.handlers[apiName];
				if (handler) {
					// bind module to "this"
					handler.call(this, requestObj);
				}
			} catch (e) {
				console.warn("MangoDB submission error", e);
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
			var server = "http://kckai.cybersnets.com";
			var url = server;
			// console.debug( JSON.stringify( payload ) );
			$.ajax({
				url: url,
				method: "POST",
				data: {
					'data': JSON.stringify( payload )
				},
			}).done( function() {
				console.log( "Tsun DB Submission done." );
			}).fail( function(jqXHR, textStatus, errorThrown) {
				console.warn( "Tsun DB Submission failed:", textStatus, errorThrown);
			});
			return;
		}
	};
	window.TsunDBSubmission.init();
})();
