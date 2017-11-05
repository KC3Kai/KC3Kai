/* Tsundbsubmission.js
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
			edgeID: null,
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
				'api_req_map/start': this.processStartNext,
				'api_req_map/next': this.processStartNext
			};
		},
		
		processMapInfo: function( requestObj ) {
			this.mapInfo = requestObj.response.api_data.api_map_info;
		},

		processStartNext: function(requestObj) {
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
			this.data.los = PlayerManager.fleets[0].eLoS(4);
			this.data.fleetSpeed = PlayerManager.fleets[0].speed();
			this.data.fleetType = PlayerManager.combinedFleet;
			this.data.edgeID = response.api_no;
			this.data.nodeType = response.api_color_no;
			if(mapData.hasOwnProperty('api_eventmap')){
				this.data.currentMapHP = mapData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = mapData.api_eventmap.api_max_maphp;
				this.data.difficulty = mapData.api_eventmap.api_selected_rank;
				this.data.gaugeType = mapData.api_eventmap.api_gauge_type;
			}
			else{
				this.data.currentMapHP = 0;
				this.data.maxMapHP = 0;
				this.data.difficulty = 0;
				this.data.gaugeType = 0;
			}
			for(let i=0; i < PlayerManager.fleets[0].ship().length; i++) {
				let ship = PlayerManager.fleets[0].ship()[i];
				if(ship.didFlee) {
					this.data.fleet1.push(-1);
				}
				else{
					let equipment = [];
					for(let j=0; j < ship.items.length; j++) {
						equipment.push(KC3GearManager.get(ship.items[j]).masterId);
					}
					this.data.fleet1.push({
						id: ship.masterId,
						type: KC3ShipManager.get(ship.rosterId).stype(),
						speed: ship.speed,
						equip: equipment
					});
				}
			}
			if(this.data.fleetType > 0){
				this.data.los += PlayerManager.fleets[1].eLoS(4);
				this.data.fleetSpeed = PlayerManager.fleets[1].speed();
				for(let i=0; i < PlayerManager.fleets[1].ship().length; i++) {
					let ship = PlayerManager.fleets[1].ship()[i];
					if(ship.didFlee) {
						this.data.fleet2.push(-1);
					}
					else{
						let equipment = [];
						for(let j=0; j < ship.items.length; j++) {
							equipment.push(KC3GearManager.get(ship.items[j]).masterId);
						}
						this.data.fleet2.push({
							id: ship.masterId,
							type: KC3ShipManager.get(ship.rosterId).stype(),
							speed: ship.speed,
							equip: equipment
						});
					}
				}
			}
			this.sendData(this.data);
		},
		
		/*
		Cleans up the data after each submission.
		*/
		clean: function() {
			this.data.map = null;
			this.data.los = null;
			this.data.fleet1 = [];
			this.data.fleet2 = [];
			this.data.fleetSpeed = null;
			this.data.currentMapHP = null;
			this.data.maxMapHP = null;
			this.data.difficulty = null;
			this.data.gaugeType = null;
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
