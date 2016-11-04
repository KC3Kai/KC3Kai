/* Kcsapi.js
KanColle Server API

Executes actions based on in-game actions read from the network.
This script is called by Network.js
Previously known as "Reactor"
*/
(function(){
	"use strict";
	
	window.Kcsapi = {
		shipConstruction:{ active: false },
		remodelSlot:{
			slotList:{},
			slotCur :{},
			slotId  :0
		},
		serverOffset: 0,
		moraleRefresh: $.extend(new Date(),{
			calibrate:function(t){
				t = Date.parse(t);
				this.setTime(t);
				return Math.hrdInt('floor',Date.now() - t,3,0,1);
			}
		}),
		
		/* Master Data
		-------------------------------------------------------*/
		"api_start2":function(params, response, headers){
			var newCounts = KC3Master.init( response.api_data );
			RemodelDb.init( response.api_data );
			
			if(ConfigManager.KC3DBSubmission_enabled) {
				KC3DBSubmission.sendMaster( JSON.stringify(response) );
			}
			
			KC3SortieManager.load();
			// Marks last sortie as catbombed
			if(KC3SortieManager.onSortie) {
				KC3SortieManager.onCat = true;
				var
					si = KC3SortieManager.onSortie,
					wm = 'm' + [KC3SortieManager.map_world,KC3SortieManager.map_num].join(''),
					ma = localStorage.getObject('maps'),
					mp = ma[wm],
					ms = mp.stat;
				// Logs the catbomb to the statistics
				if(mp.stat && si) {
					mp.stat.onError.push(si);
				} else {
					// binary bomb quotes ^~^)v
					console.warn("You're lucky that the catbomb is not on the event map!");
				}
				localStorage.setObject('maps',ma);
			}
			
			KC3Network.trigger("GameStart");
			
			// if there is either new ship(s) or new item(s)
			console.log("api_start2 newCounts", newCounts);
			if(newCounts[0]>0 || newCounts[1]>0){
				console.log("triggering GameUpdate");
				KC3Network.trigger("GameUpdate", newCounts);
			}
			
			localStorage.apiUsage = null;
		},
		
		/* Consolidated Game Loading Call
		-------------------------------------------------------*/
		"api_get_member/require_info":function(params, response, headers){
			this["api_get_member/slot_item"](params, { api_data: response.api_data.api_slot_item }, headers);
			this["api_get_member/kdock"](params, { api_data: response.api_data.api_kdock }, headers);
			this["api_get_member/useitem"](params, { api_data: response.api_data.api_useitem }, headers);
		},
		
		"api_req_member/require_info":function(params, response, headers){
			this["api_get_member/slot_item"](params, { api_data: response.api_data.api_slot_item }, headers);
			this["api_get_member/kdock"](params, { api_data: response.api_data.api_kdock }, headers);
			this["api_get_member/useitem"](params, { api_data: response.api_data.api_useitem }, headers);
		},
		
		/* Home Port Screen
		-------------------------------------------------------*/
		"api_port/port":function(params, response, headers){	
			KC3Network.trigger("HomeScreen");
			
			//KC3ShipManager.clear();
			KC3ShipManager.set(response.api_data.api_ship,true);
			this.serverOffset = this.moraleRefresh.calibrate( headers.Date );
			
			PlayerManager.setHQ({
				mid: response.api_data.api_basic.api_member_id,
				name: response.api_data.api_basic.api_nickname,
				nameId: response.api_data.api_basic.api_nickname_id,
				desc: response.api_data.api_basic.api_comment,
				rank: response.api_data.api_basic.api_rank,
				level: response.api_data.api_basic.api_level,
				exp: response.api_data.api_basic.api_experience
			});
			
			PlayerManager.consumables.fcoin = response.api_data.api_basic.api_fcoin;
			
			KC3ShipManager.max = response.api_data.api_basic.api_max_chara;
			KC3GearManager.max = response.api_data.api_basic.api_max_slotitem;
			
			PlayerManager.setFleets( response.api_data.api_deck_port );
			PlayerManager.setRepairDocks( response.api_data.api_ndock );
			PlayerManager.buildSlots = response.api_data.api_basic.api_count_kdock;
			
			var UTCtime = Date.toUTCseconds(headers.Date);
			
			PlayerManager.portRefresh({
				time: UTCtime * 1000,
				matAbs: response.api_data.api_material.slice(0,4).map(function(x){return x.api_value;}),
			});
			
			PlayerManager.setResources([
				response.api_data.api_material[0].api_value,
				response.api_data.api_material[1].api_value,
				response.api_data.api_material[2].api_value,
				response.api_data.api_material[3].api_value
			], UTCtime);
			
			PlayerManager.setConsumables({
				torch: response.api_data.api_material[4].api_value,
				buckets: response.api_data.api_material[5].api_value,
				devmats: response.api_data.api_material[6].api_value,
				screws: response.api_data.api_material[7].api_value
			}, UTCtime);
			
			PlayerManager.setStatistics({
				exped: {
					total: response.api_data.api_basic.api_ms_count,
					success: response.api_data.api_basic.api_ms_success
				},
				pvp: {
					win: response.api_data.api_basic.api_pt_win,
					lose: response.api_data.api_basic.api_pt_lose,
					attacked: response.api_data.api_basic.api_pt_challenged,
					attacked_win: response.api_data.api_basic.api_pt_challenged_win
				},
				sortie: {
					win: response.api_data.api_basic.api_st_win,
					lose: response.api_data.api_basic.api_st_lose
				}
			});
			
			PlayerManager.setNewsfeed(response.api_data.api_log, UTCtime );
			
			PlayerManager.combinedFleet = response.api_data.api_combined_flag || 0;
			
			KC3SortieManager.endSortie(response);
			
			PlayerManager.loadBases();
			
			KC3Network.trigger("HQ");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Timers");
			KC3Network.trigger("Quests");
			KC3Network.trigger("Fleet");
		},
		
		/*-------------------------------------------------------*/
		/*--------------------[ PLAYER INFO ]--------------------*/
		/*-------------------------------------------------------*/
		
		/* User Basic Information
		-------------------------------------------------------*/
		"api_get_member/basic":function(params, response, headers){
			PlayerManager.setHQ({
				mid: response.api_data.api_member_id,
				name: response.api_data.api_nickname,
				nameId: response.api_data.api_nickname_id,
				desc: response.api_data.api_comment,
				rank: response.api_data.api_rank,
				level: response.api_data.api_level,
				exp: response.api_data.api_experience
			});
			
			PlayerManager.consumables.fcoin = response.api_data.api_fcoin;
			PlayerManager.fleetCount = response.api_data.api_count_deck;
			PlayerManager.repairSlots = response.api_data.api_count_ndock;
			PlayerManager.buildSlots = response.api_data.api_count_kdock;
			KC3ShipManager.max = response.api_data.api_max_chara;
			KC3GearManager.max = response.api_data.api_max_slotitem;
			
			PlayerManager.setStatistics({
				exped: {
					total: response.api_data.api_ms_count,
					success: response.api_data.api_ms_success
				},
				pvp: {
					win: response.api_data.api_pt_win,
					lose: response.api_data.api_pt_lose,
					attacked: response.api_data.api_pt_challenged,
					attacked_win: response.api_data.api_pt_challenged_win
				},
				sortie: {
					win: response.api_data.api_st_win,
					lose: response.api_data.api_st_lose
				}
			});
			
			KC3Network.trigger("HQ");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
		},
		
		/* HQ Record Screen
		-------------------------------------------------------*/
		"api_get_member/record":function(params, response, headers){
			PlayerManager.setHQ({
				mid: response.api_data.api_member_id,
				name: response.api_data.api_nickname,
				nameId: response.api_data.api_nickname_id,
				desc: response.api_data.api_cmt,
				rank: response.api_data.api_rank,
				level: response.api_data.api_level,
				exp: response.api_data.api_experience[0]
			});
			
			PlayerManager.consumables.fcoin = response.api_data.api_fcoin;
			PlayerManager.fleetCount = response.api_data.api_deck;
			PlayerManager.repairSlots = response.api_data.api_ndoc;
			PlayerManager.buildSlots = response.api_data.api_kdoc;
			KC3ShipManager.max = response.api_data.api_ship[1];
			KC3GearManager.max = response.api_data.api_slotitem[1];
			
			PlayerManager.setStatistics({
				exped: {
					rate: response.api_data.api_mission.api_rate,
					total: response.api_data.api_mission.api_count,
					success: response.api_data.api_mission.api_success
				},
				pvp: {
					rate: response.api_data.api_practice.api_rate,
					win: response.api_data.api_practice.api_win,
					lose: response.api_data.api_practice.api_lose,
				},
				sortie: {
					rate: response.api_data.api_war.api_rate*100,
					win: response.api_data.api_war.api_win,
					lose: response.api_data.api_war.api_lose
				}
			});
			
			KC3Network.trigger("HQ");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");

			/*chrome.runtime.sendMessage({
				game:"kancolle",
				type:"game",
				action:"record_overlay",
				record: response.api_data
			}, function(response){});*/
		},
		
		"api_get_member/material":function(params, response, headers){
			var UTCtime = Date.toUTCseconds(headers.Date);
			
			var thisItem, myResources=[];
			for(var ctr in response.api_data){
				thisItem = response.api_data[ctr];
				switch(thisItem.api_id){
					case 1: myResources[0] = thisItem.api_value; break;
					case 2: myResources[1] = thisItem.api_value; break;
					case 3: myResources[2] = thisItem.api_value; break;
					case 4: myResources[3] = thisItem.api_value; break;
					case 5: PlayerManager.consumables.torch = thisItem.api_value; break;
					case 6: PlayerManager.consumables.buckets = thisItem.api_value; break;
					case 7: PlayerManager.consumables.devmats = thisItem.api_value; break;
					case 8: PlayerManager.consumables.screws = thisItem.api_value; break;
					default: break;
				}
			}
			
			PlayerManager.setResources(myResources, UTCtime);
			KC3Network.trigger("Consumables");
		},
		
		"api_get_member/useitem":function(params, response, headers){
			var UTCtime = Date.toUTCseconds(headers.Date);
			
			var thisItem;
			for(var ctr in response.api_data){
				thisItem = response.api_data[ctr];
				switch(thisItem.api_id){
					case 68: PlayerManager.consumables.pike = thisItem.api_count; break;
					case 69: PlayerManager.consumables.saury = thisItem.api_count; break;
					default: break;
				}
			}
			console.log("useitems", PlayerManager.consumables);
			KC3Network.trigger("Consumables");
		},
		
		
		/*-------------------------------------------------------*/
		/*----------------------[ LIBRARY ]----------------------*/
		/*-------------------------------------------------------*/
	
		/* Picture book
		-------------------------------------------------------*/
		"api_get_member/picture_book": function(params, response, headers){
			PictureBook.record(params, response);
		},
		
		/* Ship lists
		-------------------------------------------------------*/
		"api_get_member/ship_deck":function(params, response, headers){
			this.serverOffset = this.moraleRefresh.calibrate( headers.Date );
			
			KC3ShipManager.set(response.api_data.api_ship_data);
			KC3Network.delay(0, "Fleet");
			KC3Network.trigger("Fleet");
		},
		
		"api_get_member/ship2":function(params, response, headers){
			KC3ShipManager.set( response.api_data );
			PlayerManager.setFleets( response.api_data_deck );
			KC3Network.trigger("Timers");
			KC3Network.trigger("Fleet");
		},
		
		"api_get_member/ship3":function(params, response, headers){
			KC3ShipManager.set( response.api_data.api_ship_data );
			PlayerManager.setFleets( response.api_data.api_deck_data );
			KC3Network.trigger("Timers");
			KC3Network.trigger("Fleet");
			/*
				"api_data":{
					"api_ship_data":[
						{"api_id":130,"api_sortno":150,"api_ship_id":150,"api_lv":75,"api_exp":[319098,11902,0],"api_nowhp":83,"api_maxhp":83,"api_leng":3,"api_slot":[6032,6033,6034,-1,-1],"api_onslot":[3,3,3,3,0],"api_slot_ex":0,"api_kyouka":[7,0,16,7,0],"api_backs":7,"api_fuel":100,"api_bull":125,"api_slotnum":4,"api_ndock_time":0,"api_ndock_item":[0,0],"api_srate":1,"api_cond":40,"api_karyoku":[103,98],"api_raisou":[0,0],"api_taiku":[59,82],"api_soukou":[79,95],"api_kaihi":[63,72],"api_taisen":[0,0],"api_sakuteki":[45,49],"api_lucky":[13,79],"api_locked":1,"api_locked_equip":0}
					],
					"api_deck_data":[
						{"api_member_id":16015130,"api_id":1,"api_name":"\u30e1\u30a4\u30f3\u8266\u968a","api_name_id":"123990924","api_mission":[0,0,0,0],"api_flagship":"0","api_ship":[130,403,223,1723,141,3349]},
						{"api_member_id":16015130,"api_id":2,"api_name":"\u5bfe\u6f5c\u8266\u968a","api_name_id":"129857413","api_mission":[1,38,1454999143020,0],"api_flagship":"0","api_ship":[1,2,22,2112,1122,249]},
						{"api_member_id":16015130,"api_id":3,"api_name":"\u99c6\u9010\u8266\u968a","api_name_id":"129857436","api_mission":[1,37,1454998550795,0],"api_flagship":"0","api_ship":[232,1439,247,1119,9,28]},
						{"api_member_id":16015130,"api_id":4,"api_name":"\u7b2c4\u8266\u968a","api_name_id":"","api_mission":[1,6,1454993446222,0],"api_flagship":"0","api_ship":[137,807,2576,2564,-1,-1]}
					],
					"api_slot_data":{
							"api_slottype1":[120,1635,1639,1982,2002,3741,2177,2032,5030,4206,4291],
							"api_slottype2":[205,443,2509,2833,323,602,3848,57,161,163,165,303,428,491,848,1127,4326,4595,5273,524,810,1032,5954,4407,5068],
							"api_slottype3":[559,619,663,678,826,5275,103,390,448,474,475,691,2508,2832,3099,3102,4123],
							"api_slottype4":[75,142,407,915,1011,73,186,207,532,620,629,900,1058,2466,3040,3383,449,692,3983,3997,2464,3122,3896,3849],"api_slottype5":[26,82,119,146,174,179,232,290,298,388,519,958,1469,3049,3733,3782,917,1013,2131,1870],"api_slottype6":[1159,1192,1196,1530,1573,2780,3277,3298,3601,3749,5943,3251,3305],"api_slottype7":[487,646,1574,2195,3240,3246,3252,3264,3268,3308,3687,3750,5829,1572,1610],"api_slottype8":[3226,3244,3269,3303,3310,3356,1158,3217,3243,3245,3249,3302,3602,1531,3241,3304,2498,3023],"api_slottype9":[3399],"api_slottype10":[43,1156,1935,2510,2837,2840,3278,3684,3688,3697,3850,3944,4058,4287,4341,4459],"api_slottype11":[1316,2280,2779,3239,3263,3267,3307,3991,4057],"api_slottype12":[5608],"api_slottype13":[916,1033,1871,2132,5205,6013],"api_slottype14":[683,4241,4286,3904,5387],"api_slottype15":[391,705,744,825,1066,1097,1721,1724,3887,4409,5071,5656,395,3893,4221],"api_slottype16":-1,"api_slottype17":-1,"api_slottype18":[3045,3046,3459],"api_slottype19":[162],"api_slottype20":-1,"api_slottype21":[2440,2674,2966,3090,3895,741,922,2967,3036,3088,3203,3460,4047,4108,5830,2118],"api_slottype22":[189,2283],"api_slottype23":[1,2,215,1108,1613,2041,2499,3025,5564,5602,5613,4371,5048],"api_slottype24":-1,"api_slottype25":-1,"api_slottype26":-1,"api_slottype27":-1,"api_slottype28":[3024],"api_slottype29":[5069],"api_slottype30":[1792,2473,2788,5039,5293,5295,5614,5805],"api_slottype31":-1,"api_slottype32":-1,"api_slottype33":-1,"api_slottype34":[5607],"api_slottype35":-1,"api_slottype36":[2106,4142,5363],"api_slottype37":[2568],"api_slottype38":-1,"api_slottype39":[5366],"api_slottype40":-1,"api_slottype41":-1,"api_slottype42":-1,"api_slottype43":[3371,3372,3373,4372,4373,4871,5072,5910],"api_slottype44":-1
						}
					}
			*/
		},
		
		"api_req_kaisou/open_exslot":function(params, response, headers){
			var
				sid  = parseInt(params.api_id,10),
				ship = KC3ShipManager.get(sid),
				mast = ship.master();
			
			console.log("Extra Slot Unlock for",sid,ship.name());
		},
		
		"api_req_kaisou/marriage":function(params, response, headers){
			var
				sid      = parseInt(params.api_id,10),
				ship     = KC3ShipManager.get(sid),
				mast     = ship.master(),
				
				ship_obj = response.api_data;
			
			console.log("Perform Marriage ",sid,ship.name());
		},
		
		"api_req_kaisou/remodeling":function(params, response, headers){
			var
				ctime    = Date.safeToUtcTime(headers.Date),
				ship     = KC3ShipManager.get(params.api_id),
				master   = ship.master(),
				material = [0,-master.api_afterbull,-master.api_afterfuel,0,0,0,0,0];
			
			// For every pending supply and repair, it'll be counted towards this
			/*
			var
				hk = (function(is,ms){ // hokyuu -- repair
					return ['fuel','bull'].map(function(rsc){
						return ms[['api',rsc,'max'].join('_')] - is[rsc];
					}).concat([0,0]);
				})(ship,master),
				nd = [ship.repair[1],0,ship.repair[2],0];
			
			[hk,nd].forEach(function(pending){
				pending.forEach(function(matr,indx){
					material[indx] += matr;
				});
			});
			*/
			
			Object.keys(ship.pendingConsumption).forEach(function(pendingData){
				ship.pendingConsumption[pendingData].forEach(function(arrayData,consumeIndex){
					switch(consumeIndex) {
						case 0:
							arrayData.fill(0,0,2);
						break;
						case 1:
							arrayData.fill(0,0,3);
						break;
						default:
							console.error("Expected array of length 2 on",pendingData,"consumption data");/*RemoveLogging:skip*/
						break;
					}
				});
			});
			
			KC3Database.Naverall({
				hour: Math.hrdInt("floor",ctime/3.6,6,1),
				type: "remodel" + master.api_id,
				data: material
			});
		},
		
		/* Fleet Presets
		-------------------------------------------------------*/
		// List Presets
		"api_get_member/preset_deck":function(params, response, headers){
			console.log("LIST PRESETS", response.api_data.api_deck);
		},
		
		// Register preset
		"api_req_hensei/preset_register":function(params, response, headers){
			console.log("REGISTERED PRESET", response.api_data.api_preset_no, response.api_data);
		},
		
		// Remove Preset from list
		"api_req_hensei/preset_delete":function(params, response, headers){
			console.log("DELETED PRESET", params.api_preset_no);
		},
		
		// Use a Preset
		"api_req_hensei/preset_select":function(params, response, headers){
			var deckId = parseInt(params.api_deck_id, 10);
			PlayerManager.fleets[deckId-1].update( response.api_data );
			localStorage.fleets = JSON.stringify(PlayerManager.fleets);
			KC3Network.trigger("Fleet", { switchTo: deckId });
		},
		
		/* Equipment list
		-------------------------------------------------------*/
		"api_get_member/slot_item": function(params, response, headers){
			KC3GearManager.clear();
			KC3GearManager.set( response.api_data );
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Fleet");
		},
		
		// Equipment dragging
		"api_req_kaisou/slot_exchange_index": function(params, response, headers){
			var UpdatingShip = KC3ShipManager.get(params.api_id);
			UpdatingShip.items = response.api_data.api_slot;
			KC3ShipManager.save();
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(params.api_id);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
		},
		
		// Equipment swap
		"api_req_kaisou/slot_deprive": function(params, response, headers){
			var ShipFrom = KC3ShipManager.get(params.api_unset_ship);
			var ShipTo = KC3ShipManager.get(params.api_set_ship);
			ShipFrom.items = response.api_data.api_ship_data.api_unset_ship.api_slot;
			ShipTo.items = response.api_data.api_ship_data.api_set_ship.api_slot;
			KC3ShipManager.save();
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(params.api_set_ship);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
		},
		
		/* Fleet list
		-------------------------------------------------------*/
		"api_get_member/deck":function(params, response, headers){
			PlayerManager.setFleets( response.api_data );
			KC3Network.trigger("Timers");
			KC3Network.trigger("Fleet");
		},
		
		/* Mamiya
		-------------------------------------------------------*/
		"api_req_member/itemuse_cond":function(params, response, headers){
			var
				fleetId = parseInt(params.api_deck_id,10)-1,
				useFlag = parseInt(params.api_use_type,10),
				fMamiya = !!(useFlag & 1),
				fIrako  = !!(useFlag & 2);
			
			// there's nothing to do, for now
			// feel free to check out this listener if you want.
		},
		
		/* Update fleet name
		-------------------------------------------------------*/
		"api_req_member/updatedeckname":function(params, response, headers){
			PlayerManager.fleets[params.api_deck_id-1].name = decodeURIComponent(params.api_name);
			localStorage.fleets = JSON.stringify(PlayerManager.fleets);
		},
		
		/*-------------------------------------------------------*/
		/*-------------------[ CONSTRUCTION ]--------------------*/
		/*-------------------------------------------------------*/
		
		/* Construct a Ship
		-------------------------------------------------------*/
		"api_req_kousyou/createship":function(params, response, headers){
			var 
				ctime    = Date.safeToUtcTime(headers.Date);
			this.shipConstruction = {
				active: true,
				dock_num: params.api_kdock_id,
				flagship: PlayerManager.fleets[0].ship(0).masterId,
				lsc: params.api_large_flag,
				torched: params.api_highspeed,
				resources: [
					params.api_item1,
					params.api_item2,
					params.api_item3,
					params.api_item4,
					params.api_item5
				]
			};
			KC3Database.Naverall({
				hour: Math.hrdInt("floor",ctime/3.6,6,1),
				type: "crship"+params.api_kdock_id,
				data: [
					params.api_item1,params.api_item2,params.api_item3,params.api_item4,
					params.api_highspeed * (1 + 9 * params.api_large_flag),0,params.api_item5,0
				].map(function(x){return -x;})
			});
			KC3QuestManager.get(606).increment(); // F2: Daily Construction 1
			KC3QuestManager.get(608).increment(); // F4: Daily Construction 2
			KC3Network.trigger("Quests");
		},
		
		/* Construction Docks
		-------------------------------------------------------*/
		"api_get_member/kdock":function(params, response, headers){
			var UTCtime = Math.hrdInt("floor",Date.safeToUtcTime(headers.Date),3,1);
			if(this.shipConstruction.active){
				if(this.shipConstruction.lsc == 1){
					KC3Database.LSC({
						flag: this.shipConstruction.flagship,
						rsc1: this.shipConstruction.resources[0],
						rsc2: this.shipConstruction.resources[1],
						rsc3: this.shipConstruction.resources[2],
						rsc4: this.shipConstruction.resources[3],
						devmat: this.shipConstruction.resources[4],
						result: response.api_data[this.shipConstruction.dock_num-1].api_created_ship_id,
						time: UTCtime
					});
				}else{
					KC3Database.Build({
						flag: this.shipConstruction.flagship,
						rsc1: this.shipConstruction.resources[0],
						rsc2: this.shipConstruction.resources[1],
						rsc3: this.shipConstruction.resources[2],
						rsc4: this.shipConstruction.resources[3],
						result: response.api_data[this.shipConstruction.dock_num-1].api_created_ship_id,
						time: UTCtime
					});
				}
				
				this.shipConstruction = { active: false };
			}
			
			PlayerManager.setBuildDocks(response.api_data);
			KC3Network.trigger("Timers");
		},
		
		/* Instant-Torch a construction
		-------------------------------------------------------*/
		"api_req_kousyou/createship_speedchange":function(params, response, headers){
			var delta = 1;
			if( KC3TimerManager.build( params.api_kdock_id ).lsc ){
				delta=10;
			}
			PlayerManager.consumables.torch -= delta;
			KC3Database.Naverall({
				data: [0,0,0,0,-delta,0,0,0]
			},"crship"+params.api_kdock_id);
			KC3TimerManager.build(params.api_kdock_id).activate(
				Date.now());
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Timers");
		},
		
		/* Get a completed construction
		-------------------------------------------------------*/
		"api_req_kousyou/getship":function(params, response, headers){
			PlayerManager.setBuildDocks( response.api_data.api_kdock );
			KC3ShipManager.set([response.api_data.api_ship]);
			KC3GearManager.set(response.api_data.api_slotitem);
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Timers");
		},
		
		/*-------------------------------------------------------*/
		/*-------------------[ FLEET MANAGEMENT ]----------------*/
		/*-------------------------------------------------------*/
		
		/* Change fleet member
		-------------------------------------------------------*/
		"api_req_hensei/change":function(params, response, headers){
			var FleetIndex = parseInt(params.api_id, 10);
			
			// If removing all ships except flagship
			if(typeof response.api_data != "undefined"){
				if(typeof response.api_data.api_change_count != "undefined"){
					PlayerManager.fleets[ FleetIndex-1 ].clearNonFlagShips();
					KC3Network.trigger("Fleet", { switchTo: FleetIndex });
					return true;
				}
			}
			
			// Ship swapping
			var flatShips  = PlayerManager.fleets
				.map(function(x){ return x.ships; })
				.reduce(function(x,y){ return x.concat(y); });
			var ChangedIndex = parseInt(params.api_ship_idx,10);
			var ChangingShip = parseInt(params.api_ship_id,10);
			var OldSwaperSlot = flatShips.indexOf(ChangingShip); // move to slot
			var OldSwapeeSlot = flatShips[ (FleetIndex-1) * 6 + ChangedIndex ]; // swap from slot
			var oldFleet = Math.floor(OldSwaperSlot / 6);
			if(ChangingShip > -1){
				// If swapping on same fleet
				if(OldSwaperSlot >= 0){
					PlayerManager.fleets[oldFleet].ships[OldSwaperSlot % 6] = OldSwapeeSlot;
					PlayerManager.fleets[oldFleet].checkAkashi(true);
				}
				PlayerManager.fleets[FleetIndex-1].ships[ChangedIndex] = ChangingShip;
			}else{
				PlayerManager.fleets[FleetIndex-1].ships.splice(ChangedIndex, 1);
				PlayerManager.fleets[FleetIndex-1].ships.push(-1);
			}
			PlayerManager.fleets[FleetIndex-1].checkAkashi(true);
			KC3Network.trigger("Fleet", { switchTo: FleetIndex });
		},
		
		/* Lock a ship
		-------------------------------------------------------*/
		"api_req_hensei/lock":function(params, response, headers){
			var shipID    = parseInt(params.api_ship_id,10);
			var lockState = response.api_data.api_locked;
			var shipData  = KC3ShipManager.get(shipID);
			
			if(shipData.lock) {
				console.warn("Unlocked",shipData.rosterId,shipData.name());
			} else {
				var lockID = ConfigManager.lock_list.indexOf(shipID);
				if(lockID+1) {
					ConfigManager.lock_list.splice(lockID,1);
					ConfigManager.save();
				} else {
					console.info("Locked (~)",shipData.rosterId,shipData.name());
				}
			}
			
			shipData.lock = lockState;
			KC3ShipManager.save();
			KC3Network.trigger("Fleet");
		},
		
		/* Change equipment of a ship
		-------------------------------------------------------*/
		"api_req_kaisou/slotset":function(params, response, headers){
			// Set params on variables for future understandability
			var itemID = parseInt(params.api_item_id, 10);
			var slotIndex = params.api_slot_idx;
			var shipID = parseInt(params.api_id, 10);
			var shipObj = KC3ShipManager.get(shipID);
			shipObj.items[slotIndex] = itemID;
			
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(shipID);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
			
			// Gun fit bonus / penalty
			var gearObj = KC3GearManager.get(itemID);
			var gunfit = KC3Meta.gunfit(shipObj.masterId, gearObj.masterId);
			if (gunfit) {
				KC3Network.trigger("GunFit", {
					shipObj: shipObj,
					gearObj: gearObj,
					thisFit: gunfit,
					shipFits: KC3Meta.gunfit(shipObj.masterId) // different from above
				});
			}
		},
		
		/* Remove all equipment of a ship
		-------------------------------------------------------*/
		"api_req_kaisou/unsetslot_all":function(params, response, headers){
			KC3ShipManager.get( params.api_id ).items = [-1,-1,-1,-1];
			
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(params.api_id);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
		},
		
		/* Re-supply a ship
		-------------------------------------------------------*/
		"api_req_hokyu/charge":function(params, response, headers){
			KC3QuestManager.get(504).increment(); // E4: Daily Resupplies
			var
				ctime    = Math.hrdInt('floor',(new Date(headers.Date)).getTime(),3,1),
				shipList = response.api_data.api_ship,
				charge   = parseInt(params.api_kind),
				sParam   = {noFuel:!(charge & 1),noAmmo:!(charge & 2)};
			
			$.each(shipList, function( index, ship ) {
				var
					shipId = ship.api_id,
					shipToSupply = KC3ShipManager.get(shipId),
					shipDf = shipToSupply.getDefer()[0] || $.when({}),
					shipFn = function(){
						KC3ShipManager.get(shipId).perform('supply',sParam);
					};
				
				shipToSupply.fuel  = ship.api_fuel;
				shipToSupply.ammo  = ship.api_bull;
				shipToSupply.slots = ship.api_onslot;
				
				shipDf.then(shipFn);
			});
			
			KC3ShipManager.save();
			
			PlayerManager.setResources( response.api_data.api_material , ctime);
			
			KC3Network.trigger("Quests");
			KC3Network.trigger("Fleet");
		},
		
		/* Combine/Uncombine Fleets
		-------------------------------------------------------*/
		"api_req_hensei/combined":function(params, response, headers){
			PlayerManager.combinedFleet = parseInt( params.api_combined_type, 10 );
			KC3Network.trigger("Fleet",
				PlayerManager.combinedFleet > 0 ? { switchTo: "combined" } : undefined);
		},
		
		/*-------------------------------------------------------*/
		/*----------------------[ BATTLES ]----------------------*/
		/*-------------------------------------------------------*/
		
		/* Select difficulty
		-------------------------------------------------------*/
		"api_req_map/select_eventmap_rank":function(params, response, headers){
			var
				allMaps = JSON.parse(localStorage.maps),
				mkey    = "m" + params.api_maparea_id + params.api_map_no;
			allMaps[mkey].difficulty = parseInt(params.api_rank);
			try{
				allMaps[mkey].curhp = allMaps[mkey].maxhp = parseInt(response.api_data.api_max_maphp,10);
			}catch(e){
				console.warn("Map HP data is not given, leaving 9999HP as placeholder");
				allMaps[mkey].curhp = allMaps[mkey].maxhp = 9999;
			}
			allMaps[mkey].kind  = allMaps[mkey].dkind; // reset the current map gauge kind
			
			localStorage.maps = JSON.stringify(allMaps);
		},
		
		/* Start Sortie
		-------------------------------------------------------*/
		"api_req_map/start":function(params, response, headers){
			var UTCTime = Date.toUTCseconds(headers.Date);
			KC3SortieManager.startSortie(
				response.api_data.api_maparea_id,
				response.api_data.api_mapinfo_no,
				params.api_deck_id,
				UTCTime,
				response.api_data.api_eventmap
			);
			
			KC3SortieManager.setBoss(
				response.api_data.api_bosscell_no,
				response.api_data.api_bosscomp
			);
			
			KC3QuestManager.get(214).increment(0); // Bw1: 1st requirement: Sortie 36 times (index:0)
			
			if (typeof response.api_data.api_eventmap !== "undefined") {
				var AllMaps = JSON.parse(localStorage.maps);
				var thisMapId = "m"+response.api_data.api_maparea_id+""+response.api_data.api_mapinfo_no;
				var thisMap = AllMaps[thisMapId];

				if (thisMap.curhp || 9999 === 9999) {
					thisMap.curhp = response.api_data.api_eventmap.api_now_maphp;
					thisMap.maxhp = response.api_data.api_eventmap.api_max_maphp;
					localStorage.maps = JSON.stringify(AllMaps);
				}
			}

			KC3SortieManager.advanceNode( response.api_data, UTCTime );
			
			KC3Network.trigger("SortieStart");
			KC3Network.trigger("CompassResult");
			KC3Network.trigger("Quests");
			KC3Network.trigger("Fleet");
		},
		
		/* Traverse Map
		-------------------------------------------------------*/
		"api_req_map/next":function(params, response, headers){
			var UTCTime = Date.toUTCseconds(headers.Date);
			KC3SortieManager.discardSunk();
			KC3SortieManager.advanceNode( response.api_data, UTCTime );
			KC3Network.trigger("CompassResult");
		},
		
		/* NORMAL: BATTLE STARTS
		-------------------------------------------------------*/
		"api_req_sortie/battle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_sortie/airbattle":function(params, response, headers){
			this["api_req_sortie/battle"].apply(this,arguments);
		},
		"api_req_sortie/ld_airbattle":function(params, response, headers){
			this["api_req_sortie/battle"].apply(this,arguments);
		},
		
		/* COMBINED FLEET: BATTLE STARTS
		-------------------------------------------------------*/
		"api_req_combined_battle/battle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/airbattle":function(params, response, headers){
			this["api_req_combined_battle/battle"].apply(this,arguments);
		},
		"api_req_combined_battle/battle_water":function(params, response, headers){
			this["api_req_combined_battle/battle"].apply(this,arguments);
		},
		"api_req_combined_battle/ld_airbattle":function(params, response, headers){
			this["api_req_combined_battle/battle"].apply(this,arguments);
		},
		
		/* BATTLE STARTS as NIGHT
		-------------------------------------------------------*/
		"api_req_battle_midnight/sp_midnight":function(params, response, headers){
			KC3SortieManager.engageBattleNight(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/sp_midnight":function(params, response, headers){
			KC3SortieManager.engageBattleNight(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.trigger("BattleStart");
		},
		
		/* NIGHT BATTLES as SECOND PART
		-------------------------------------------------------*/
		"api_req_battle_midnight/battle":function(params, response, headers){
			KC3SortieManager.engageNight( response.api_data );
			KC3Network.trigger("BattleNight");
		},
		"api_req_combined_battle/midnight_battle":function(params, response, headers){
			KC3SortieManager.engageNight( response.api_data );
			KC3Network.trigger("BattleNight");
		},
		
		/* ENEMY COMBINED FLEET
		-------------------------------------------------------*/
		"api_req_combined_battle/ec_battle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/ec_midnight_battle":function(params, response, headers){
			KC3SortieManager.engageNight(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.trigger("BattleNight");
		},
		
		/* BATTLE RESULT SCREENS
		-------------------------------------------------------*/
		"api_req_sortie/battleresult":function(params, response, headers){
			resultScreenQuestFulfillment(response.api_data);
			
			KC3SortieManager.resultScreen( response.api_data );
			
			if(!ConfigManager.info_delta)
				KC3Network.trigger("HQ");
			
			PlayerManager.fleets.forEach(function(fleet){
				fleet.ship(function(rosterId,slotId,shipData){
					shipData.hp[0] = shipData.afterHp[0];
				});
			});
			KC3Network.trigger("Fleet");
			KC3Network.trigger("BattleResult", response.api_data);
			KC3Network.trigger("Quests");
			
			KC3Network.delay(1,"Fleet","GearSlots");
		},
		"api_req_combined_battle/battleresult":function(params, response, headers){
			resultScreenQuestFulfillment(response.api_data);
			
			KC3SortieManager.resultScreen( response.api_data );
			
			if(!ConfigManager.info_delta)
				KC3Network.trigger("HQ");
			
			PlayerManager.fleets.forEach(function(fleet){
				fleet.ship(function(rosterId,slotId,shipData){
					shipData.hp[0] = shipData.afterHp[0];
				});
			});
			KC3Network.trigger("Fleet");
			KC3Network.trigger("BattleResult", response.api_data);
			KC3Network.trigger("Quests");
			
			KC3Network.delay(1,"Fleet","GearSlots");
		},
		
		/* FCF TRIGGER
		-------------------------------------------------------*/
		"api_req_combined_battle/goback_port":function(params, response, headers){
			KC3SortieManager.sendFCFHome();
			KC3Network.delay(0, "Fleet");
			KC3Network.trigger("Fleet");
		},
		
		/*-------------------------------------------------------*/
		/*-----------------------[ LBAS ]------------------------*/
		/*-------------------------------------------------------*/
		
		/* Get bases info
		-------------------------------------------------------*/
		"api_get_member/base_air_corps":function(params, response, headers){
			PlayerManager.setBases(response.api_data);
			KC3Network.trigger("Lbas");
		},
		
		/* Change base name
		-------------------------------------------------------*/
		"api_req_air_corps/change_name":function(params, response, headers){
			PlayerManager.bases[params.api_base_id-1].name = decodeURIComponent(params.api_name);
			localStorage.bases = JSON.stringify(PlayerManager.bases);
			KC3Network.trigger("Lbas");
		},
		
		/* Set base action
		-------------------------------------------------------*/
		"api_req_air_corps/set_action":function(params, response, headers){
			PlayerManager.bases[params.api_base_id-1].action = params.api_action_kind;
			localStorage.bases = JSON.stringify(PlayerManager.bases);
			KC3Network.trigger("Lbas");
		},
		
		/* Get bases info
		-------------------------------------------------------*/
		"api_req_air_corps/set_plane":function(params, response, headers){
			PlayerManager.bases[params.api_base_id-1].range = response.api_data.api_distance;
			PlayerManager
				.bases[params.api_base_id-1]
				.planes[params.api_squadron_id-1] = response.api_data.api_plane_info[0];
			localStorage.bases = JSON.stringify(PlayerManager.bases);
			KC3Network.trigger("Lbas");
		},
		
		
		/*-------------------------------------------------------*/
		/*----------------------[ QUESTS ]-----------------------*/
		/*-------------------------------------------------------*/
		
		/* Quest List
		-------------------------------------------------------*/
		"api_get_member/questlist":function(params, response, headers){
			KC3QuestManager.load();
			
			// Update quest data for this page
			KC3QuestManager.definePage(
				response.api_data.api_list,
				response.api_data.api_disp_page
			);
			
			// Tell service to pass a message to gamescreen on inspected window to show overlays
			KC3Network.hasOverlay = true;
			(new RMsg("service", "questOverlay", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				questlist: response.api_data.api_list
			})).execute();
			
			// Trigger quest listeners
			KC3Network.trigger("Quests");
		},
		
		"api_req_quest/clearitemget": function(params, response, headers){
			var 
				ctime    = Date.safeToUtcTime(headers.Date),
				quest    = Number(params.api_quest_id),
				data     = response.api_data,
				material = data.api_material,
				consume  = [0,0,0,0],
				bonuses  = data.api_bounus;
			console.log(quest,data);
			
			// Force to mark quest as complete
			KC3QuestManager.isOpen( quest, false );
			KC3QuestManager.isActive( quest, false );
			KC3QuestManager.save();
			
			// Compute bonuses for ledger
			bonuses.forEach(function(x){
				if(x.api_type == 1 && x.api_item.api_id >= 5) {
					consume[x.api_item.api_id - 5] += x.api_count;
				}
			});
			material = material.concat(consume);
			KC3Database.Naverall({
				hour: Math.hrdInt("floor",ctime/3.6,6,1),
				type: "quest"+quest,
				data: material
			});
			console.log("Quest Item",material);
			
			// Trigger quest listeners
			KC3Network.trigger("Quests");
		},
		
		/* Stop Quest
		-------------------------------------------------------*/
		"api_req_quest/stop":function(params, response, headers){
			var quest = Number(params.api_quest_id);
			// Restore to Open but Not Active
			KC3QuestManager.get(quest).status = 1;
			KC3QuestManager.save();
			// Trigger quest listeners
			KC3Network.trigger("Quests");
		},
		
		/*-------------------------------------------------------*/
		/*--------------------[ REPAIR DOCKS ]-------------------*/
		/*-------------------------------------------------------*/
		
		/* Repair Docks
		-------------------------------------------------------*/
		"api_get_member/ndock":function(params, response, headers){
			PlayerManager.setRepairDocks( response.api_data );
			KC3Network.trigger("Timers");
			KC3Network.trigger("Fleet");
		},
		
		/* Start repair
		-------------------------------------------------------*/
		"api_req_nyukyo/start":function(params, response, headers){
			var
				ship_id    = parseInt( params.api_ship_id , 10),
				bucket     = parseInt( params.api_highspeed , 10),
				nDockNum   = parseInt( params.api_ndock_id , 10),
				shipData   = KC3ShipManager.get( ship_id );
			
			if(bucket==1){
				PlayerManager.consumables.buckets--;
				
				// If ship is still is the list being repaired, remove Her
				var HerRepairIndex = PlayerManager.repairShips.indexOf( ship_id );
				if(HerRepairIndex  > -1){
					PlayerManager.repairShips.splice(HerRepairIndex, 1);
				}
				
				KC3Database.Naverall({
					data:[0,0,0,0,0,-1,0,0]
				},shipData.lastSortie[0]);
				
				shipData.applyRepair();
				shipData.resetAfterHp();
				KC3TimerManager.repair( nDockNum ).deactivate();
			}
			
			shipData.perform('repair');
			KC3ShipManager.save();
			
			KC3QuestManager.get(503).increment(); // E3: Daily Repairs
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Quests");
			KC3Network.trigger("Fleet");
		},
		
		/* Use bucket
		-------------------------------------------------------*/
		"api_req_nyukyo/speedchange":function(params, response, headers){
			PlayerManager.consumables.buckets--;
			// If ship is still is the list being repaired, remove Her
			var
				ship_id  = PlayerManager.repairShips[ params.api_ndock_id ],
				shipData = KC3ShipManager.get(ship_id);
			PlayerManager.repairShips.splice(params.api_ndock_id, 1);
			
			KC3Database.Naverall({
				data:[0,0,0,0,0,-1,0,0]
			},shipData.lastSortie[0]);
			shipData.perform('repair');
			shipData.applyRepair();
			shipData.resetAfterHp();
			KC3ShipManager.save();
			
			KC3TimerManager.repair( params.api_ndock_id ).deactivate();
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Timers");
			KC3Network.trigger("Fleet");
		},
		
		/*-------------------------------------------------------*/
		/*-----------------------[ PVP ]-------------------------*/
		/*-------------------------------------------------------*/
		
		/* PVP Enemy List
		-------------------------------------------------------*/
		"api_get_member/practice":function(params, response, headers){
			/* 
				{
					"api_member_id":16015130,
					"api_id":1,
					"api_enemy_id":16131426,
					"api_enemy_name":"\u3057\u304a\u3093",
					"api_enemy_name_id":"135471996",
					"api_enemy_level":100,
					"api_enemy_rank":"\u5143\u5e25",
					"api_enemy_flag":3,
					"api_enemy_flag_ship":401,
					"api_enemy_comment":"\u7d50\u5c40\u521d\u96ea\u306f\u53ef\u611b\u3059\u304e\u308b\uff01",
					"api_enemy_comment_id":"146585663",
					"api_state":0,
					"api_medals":0
				},
			*/
			var
				data = response.api_data;
		},
		
		/* PVP Fleet List
		-------------------------------------------------------*/
		"api_req_member/get_practice_enemyinfo":function(params, response, headers){
			/*
				{
					"api_member_id":16131426,
					"api_nickname":"\u3057\u304a\u3093",
					"api_nickname_id":"135471996",
					"api_cmt":"\u7d50\u5c40\u521d\u96ea\u306f\u53ef\u611b\u3059\u304e\u308b\uff01",
					"api_cmt_id":"146585663",
					"api_level":100,
					"api_rank":1,
					"api_experience":[1322118,1600000],
					"api_friend":0,
					"api_ship":[100,100],
					"api_slotitem":[394,497],
					"api_furniture":46,
					"api_deckname":"\u306d\u3048\u4eca\u3069\u3093\u306a\u6c17\u6301\u3061\uff1f",
					"api_deckname_id":"143652014",
					"api_deck":{
						"api_ships":[
							{"api_id":402539759,"api_ship_id":401,"api_level":85,"api_star":4},
							{"api_id":287256299,"api_ship_id":398,"api_level":63,"api_star":4},
							{"api_id":416504460,"api_ship_id":399,"api_level":74,"api_star":4},
							{"api_id":302286234,"api_ship_id":400,"api_level":77,"api_star":4},
							{"api_id":-1},
							{"api_id":-1}
						]
					}
				}
			*/
			var
				data    = response.api_data,
				enemyId = parseInt(params.api_member_id,10);
		},
		
		/* PVP Start
		-------------------------------------------------------*/
		"api_req_practice/battle":function(params, response, headers){
			KC3SortieManager.sortieTime = Math.hrdInt('floor',Date.safeToUtcTime(headers.Date),3,1);
			KC3SortieManager.map_world  = -1;
			KC3SortieManager.snapshotFleetState();
			KC3Network.trigger("PvPStart", {
				battle: response.api_data,
				fleetSent: params.api_deck_id
			});
		},
		
		/* PVP Start
		-------------------------------------------------------*/
		"api_req_practice/midnight_battle":function(params, response, headers){
			KC3SortieManager.engageNight( response.api_data );
			KC3Network.trigger("PvPNight", { battle: response.api_data });
		},
		
		/* PVP Result
		-------------------------------------------------------*/
		"api_req_practice/battle_result":function(params, response, headers){
			resultScreenQuestFulfillment(response.api_data,true);
			KC3SortieManager.resultScreen(response.api_data);
			KC3Network.trigger("PvPEnd", { result: response.api_data });
			KC3Network.trigger("Quests");
		},
		
		/*-------------------------------------------------------*/
		/*--------------------[ EXPEDITION ]---------------------*/
		/*-------------------------------------------------------*/

		/* Expedition Selection Screen
		  -------------------------------------------------------*/
		"api_get_member/mission": function(params, response, headers) {
			KC3Network.trigger( "ExpeditionSelection" );
		},

		/* Expedition Start
		  -------------------------------------------------------*/
		"api_req_mission/start": function(params, response, headers) {
			KC3Network.trigger( "ExpeditionStart" );
		},
		
		/* Complete Expedition
		-------------------------------------------------------*/
		"api_req_mission/result":function(params, response, headers){
			var
				ctime    = Date.safeToUtcTime(headers.Date),
				deck     = parseInt(params.api_deck_id, 10),
				timerRef = KC3TimerManager._exped[ deck-2 ],
				shipList = PlayerManager.fleets[deck - 1].ships.slice(0),
				expedNum = timerRef.expedNum;
			expedNum = parseInt(expedNum, 10);
			
			KC3Network.trigger("ExpedResult",{
				expedNum:expedNum,
				params:params,
				response:response.api_data
			});
			
			console.log("Fleet #",deck,"has returned from Expedition #",expedNum,"with result",response.api_data);
			
			shipList.forEach(function(rosterId){
				var shipData = KC3ShipManager.get(rosterId);
				if(shipData.masterId > 0) {
					shipData.getDefer()[1].reject();
					shipData.getDefer()[2].reject();
					shipData.pendingConsumption.costnull=[[
						-shipData.fuel,
						-shipData.ammo,
						-shipData.slots.reduce(function(x,y){return x+y;})
					],[0,0,0]];
					console.log.apply(console,["Offering a preparation of async to",shipData.name()]);
					var df = shipData.checkDefer();
					df[0].then(function(expedId,supplyData){
						if(typeof expedId !== 'undefined' && expedId !== null) {
							var
								kan = KC3ShipManager.get(rosterId), // retrieve latest ship data
								key = ["exped",expedId].join('');
							kan.pendingConsumption[key] = kan.pendingConsumption.costnull.map(function(rscdat,rscind){
								return rscind===0 ? rscdat.map(function(rscval,datind){
									return rscval + supplyData[datind];
								}) : rscdat;
							});
							delete kan.pendingConsumption.costnull;
							console.info.apply(console,["",rosterId].concat(key && kan.pendingConsumption[key]));
							KC3ShipManager.save();
						} else {
							console.info("Ignoring Signal for",rosterId,"detected");
						}
					});
				}
			});
			
			if(response.api_data.api_clear_result > 0){
					KC3QuestManager.get(402).increment(); // D2: Daily Expeditions 1
					KC3QuestManager.get(403).increment(); // D3: Daily Expeditions 2
					KC3QuestManager.get(404).increment(); // D4: Weekly Expeditions
					
					// If expedition 37 or 38
					if(expedNum==37 || expedNum==38){
						KC3QuestManager.get(410).increment(); // D9: Weekly Expedition 2
						KC3QuestManager.get(411).increment(); // D11: Weekly Expedition 3
					}
					KC3Network.trigger("Quests");
					
			}
			
			KC3ShipManager.save();
			
			KC3Database.Expedition({
				data     :response.api_data,
				mission  :expedNum,
				fleet    :PlayerManager.fleets[deck - 1].sortieJson(),
				fleetN   :deck, /* tricks dj >w< */
				shipXP   :response.api_data.api_get_ship_exp,
				admiralXP:response.api_data.api_get_exp,
				items    :[1,2].map(function(x){return response.api_data["api_get_item"+x] || null;}),
				time     :Math.floor((new Date(timerRef.completion)).getTime()/1000)
			},function(dbId){
				// If success or great success
				if(response.api_data.api_clear_result > 0){
					var
						rsc = response.api_data.api_get_material,
						csm = [0,0,0,0],
						csmap = [0,2,1,3],
						uniqId = "exped" + dbId;
					
					// Record expedition gain
					/*
					 1:"bucket", => 5
					 2:"ibuild", => 4
					 3:"devmat", => 6
					*/
					response.api_data.api_useitem_flag.forEach(function(x,i){
						var
							useMap = csmap[x],
							useItm = response.api_data["api_get_item"+(i+1)];
						if(!!useMap && !!useItm) {
							csm[useMap - 1] += useItm.api_useitem_count;
						}
					});
					
					rsc = rsc.concat(csm);
					
					KC3Database.Naverall({
						hour: Math.hrdInt("floor",ctime/3.6,6,1),
						type: uniqId,
						data: rsc
					},null,true);
					
					shipList.forEach(function(rosterId,shipIndex){
						var
							shipData = KC3ShipManager.get(rosterId),
							pendCond = shipData.pendingConsumption,
							dataInd  = Object.keys(pendCond).indexOf('costnull'),
							consDat  = [shipData.fuel,shipData.ammo,shipData.slots.reduce(function(x,y){return x+y;})];
						if(shipData.masterId > 0) {
							// if there's a change in ship supply
							console.log(shipData.name(),dataInd,pendCond.costnull,consDat);
							if(dataInd >= 0) {
								shipData.getDefer()[1].resolve(dbId);
							}
						}
					});
					
					KC3ShipManager.save();
					
					console.log("Materials",rsc);
				}
			});
		},
		
		"api_req_mission/return_instruction":function(params, response, headers){
			KC3TimerManager._exped[parseInt(params.api_deck_id)-2].completion = response.api_data.api_mission[2];
		},
		
		/*-------------------------------------------------------*/
		/*---------------------[ ARSENAL ]-----------------------*/
		/*-------------------------------------------------------*/
		
		/* Craft Equipment
		-------------------------------------------------------*/
		"api_req_kousyou/createitem":function(params, response, headers){
			var
				resourceUsed = [ params.api_item1, params.api_item2, params.api_item3, params.api_item4 ],
				failed       = (typeof response.api_data.api_slot_item == "undefined"),
				ctime        = Math.hrdInt("floor",Date.safeToUtcTime(headers.Date),3,1);
			
			// Log into development History
			KC3Database.Develop({
				flag: PlayerManager.fleets[0].ship(0).masterId,
				rsc1: resourceUsed[0],
				rsc2: resourceUsed[1],
				rsc3: resourceUsed[2],
				rsc4: resourceUsed[3],
				result: (!failed)?response.api_data.api_slot_item.api_slotitem_id:-1,
				time: ctime
			});
			
			KC3Database.Naverall({
				hour: Math.hrdInt("floor",ctime/3.6,3,1),
				type: "critem",
				data: resourceUsed.concat([0,0,!failed,0]).map(function(x){return -x;})
			});
			
			KC3QuestManager.get(605).increment(); // F1: Daily Development 1
			KC3QuestManager.get(607).increment(); // F3: Daily Development 2
			
			// Checks if the development went great
			if(!failed){
				// Add new equipment to local data
				KC3GearManager.set([{
					api_id: response.api_data.api_slot_item.api_id,
					api_level: 0,
					api_locked: 0,
					api_slotitem_id: response.api_data.api_slot_item.api_slotitem_id
				}]);
				
				// Trigger listeners passing crafted IDs
				KC3Network.trigger("CraftGear", {
					itemId: response.api_data.api_slot_item.api_id,
					itemMasterId: response.api_data.api_slot_item.api_slotitem_id,
					resourceUsed: resourceUsed
				});
			} else {
				KC3Network.trigger("CraftGear", {
					itemId: null,
					itemMasterId: null,
					resourceUsed: resourceUsed
				});
			}
			
			KC3Network.trigger("Quests");
		},
		
		/* Scrap a Ship
		-------------------------------------------------------*/
		"api_req_kousyou/destroyship":function(params, response, headers){
			var
				rsc   = [0,0,0,0,0,0,0,0],
				ship  = KC3ShipManager.get(params.api_ship_id),
				scrap = [],
				ctime = Date.safeToUtcTime(headers.Date);
			
			// Base ship scrap value
			scrap.push(ship.master());
			// Collect equipment scrap value
			scrap = scrap.concat(
				((ship.items).concat(ship.ex_item)).map(function(gearId){
					return KC3GearManager.get(gearId).master();
				}).filter(function(gearMaster){
					return gearMaster;
				})
			);
			// Sum everything
			scrap.forEach(function(scrapData){
				console.log.apply(console,[scrapData.api_name].concat(scrapData.api_broken));
				scrapData.api_broken.forEach(function(val,ind){
					rsc[ind] += val;
				});
			});
			KC3Database.Naverall({
				hour: Math.hrdInt("floor",ctime/3.6,6,1),
				type: "dsship" + ship.masterId,
				data: rsc
			});
			KC3ShipManager.remove( params.api_ship_id );
			KC3QuestManager.get(609).increment(); // F5: Daily Dismantlement
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Fleet");
			KC3Network.trigger("Quests");
		},
		
		/* Scrap a Gear
		-------------------------------------------------------*/
		"api_req_kousyou/destroyitem2":function(params, response, headers){
			var
				rsc   = [0,0,0,0,0,0,0,0],
				ctime = Date.safeToUtcTime(headers.Date);
			$.each(params.api_slotitem_ids.split("%2C"), function(index, itemId){
				var gearMaster = KC3GearManager.get(itemId).master();
				gearMaster.api_broken.forEach(function(x,i){
					rsc[i] += x;
				});
				// F34: Weekly Scrap Anti-Air Guns
				if([21].indexOf(gearMaster.api_type[2]) >-1){
					KC3QuestManager.get(638).increment();
				}
				KC3GearManager.remove( itemId );
			});
			KC3GearManager.save();
			KC3Database.Naverall({
				hour: Math.hrdInt("floor",ctime/3.6,6,1),
				type: "dsitem",
				data: rsc
			});
			KC3QuestManager.get(613).increment(); // F12: Weekly Dismantlement
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Quests");
		},
		
		/*-------------------------------------------------------*/
		/*----------------------[ OTHERS ]-----------------------*/
		/*-------------------------------------------------------*/
		
		/* View World Maps
		-------------------------------------------------------*/
		"api_get_member/mapinfo":function(params, response, headers){
			if(localStorage.maps=="null"){ localStorage.maps = ""; }
			
			var maps = JSON.parse(localStorage.maps || "{}");
			var ctr, thisMap, localMap, etcStat, defStat;
			
			// Prepare event despair stat ^w^)!
			etcStat = {};
			defStat = {
				onClear: null,
				onError: [],
				onBoss : {
					fresh: [], /* 100%   No hit taken */
					graze: [], /*  75% ~ Does not really hit them */
					light: [], /*  50% ~ Lightly damaged */
					modrt: [], /*  25% ~ Moderately damaged */
					heavy: [], /*    9 ~ Heavily damaged */
					despe: [], /*    1 ~ Desperate of Single-Digit */
					endur: [], /*    1   Desperate of Single-HP */
					destr: [], /*    0   Sunk */
					hpdat: {}  /* sortieId:[remainingHP,maximumHP]*/
				}
			};
			
			// Exclude gauge based map from being kept every time
			for(ctr in KC3Meta._gauges) {
				if(Object.keys(maps).indexOf(ctr)>=0)
					maps[ctr].clear = maps[ctr].kills = false;
			}
			
			// Combine current storage and current available maps data
			for(ctr in response.api_data.api_map_info){
				thisMap = response.api_data.api_map_info[ctr];
				var key = "m"+thisMap.api_id;
				
				if(typeof (maps[key]||{}).curhp !== 'undefined')
					etcStat[key] = $.extend(true,{},defStat,maps[key].stat);
				
				// Create map object
				localMap = {
					id: thisMap.api_id,
					clear: thisMap.api_cleared,
					kind: 'single'
				};
				
				// Check for boss gauge kills
				if(typeof thisMap.api_defeat_count != "undefined"){
					localMap.kills = thisMap.api_defeat_count;
					localMap.kind  = 'multiple';
				}
				
				// Check for event map info
				if(typeof thisMap.api_eventmap != "undefined"){
					var eventData = thisMap.api_eventmap;
					localMap.curhp      = eventData.api_now_maphp;
					localMap.maxhp      = eventData.api_max_maphp;
					localMap.difficulty = eventData.api_selected_rank;
					
					if(typeof (maps[key]||{}).baseHp !== 'undefined')
						localMap.baseHp     = maps[key].baseHp;
					localMap.stat       = $.extend(true,{},defStat,etcStat[ key ]);
					switch(eventData.api_gauge_type || 0) {
						case 2:
							localMap.kind   = 'gauge-hp';
							break;
						case 3:
							localMap.kind   = 'gauge-tp';
							break;
						default:
							localMap.kind   = 'gauge-hp';
							console.info('Reported new API Gauge Type',eventData.api_gauge_type);
					}
				}
				
				// Check default gauge info
				if(typeof maps[key] !== 'undefined'
					&& typeof maps[key].dkind === 'undefined') {
					maps[key].dkind = maps[key].kind;
				}
				
				maps[ key ] = localMap;
			}
			localStorage.maps = JSON.stringify(maps);
		},
		
		/* Ship Modernize
		-------------------------------------------------------*/
		"api_req_kaisou/powerup":function(params, response, headers){
			// Remove consumed ships and their equipment
			var consumed_ids = params.api_id_items;
			$.each(consumed_ids.split("%2C"), function(index, element){
				KC3ShipManager.remove(element);
				KC3Network.trigger("ShipSlots");
				KC3Network.trigger("GearSlots");
			});
			
			// Check if successful modernization
			if(response.api_data.api_powerup_flag==1){
				KC3QuestManager.get(702).increment(); // G2: Daily Modernization
				KC3QuestManager.get(703).increment(); // G3: Weekly Modernization
				KC3Network.trigger("Quests");
			}
			
			// Activity Notification
			var NewShipRaw = response.api_data.api_ship;
			var OldShipObj = KC3ShipManager.get( NewShipRaw.api_id );
			var MasterShip = KC3Master.ship( NewShipRaw.api_ship_id );
			
			KC3Network.trigger("Modernize", {
				rosterId: response.api_data.api_ship.api_id,
				oldStats: [
					MasterShip.api_houg[0] + OldShipObj.mod[0],
					MasterShip.api_raig[0] + OldShipObj.mod[1],
					MasterShip.api_tyku[0] + OldShipObj.mod[2],
					MasterShip.api_souk[0] + OldShipObj.mod[3],
					MasterShip.api_luck[0] + OldShipObj.mod[4]
				],
				increase: [
					NewShipRaw.api_kyouka[0] - OldShipObj.mod[0],
					NewShipRaw.api_kyouka[1] - OldShipObj.mod[1],
					NewShipRaw.api_kyouka[2] - OldShipObj.mod[2],
					NewShipRaw.api_kyouka[3] - OldShipObj.mod[3],
					NewShipRaw.api_kyouka[4] - OldShipObj.mod[4]
				],
				left: [
					MasterShip.api_houg[1] - (MasterShip.api_houg[0] + NewShipRaw.api_kyouka[0]),
					MasterShip.api_raig[1] - (MasterShip.api_raig[0] + NewShipRaw.api_kyouka[1]),
					MasterShip.api_tyku[1] - (MasterShip.api_tyku[0] + NewShipRaw.api_kyouka[2]),
					MasterShip.api_souk[1] - (MasterShip.api_souk[0] + NewShipRaw.api_kyouka[3]),
					MasterShip.api_luck[1] - (MasterShip.api_luck[0] + NewShipRaw.api_kyouka[4])
				]
			});
			
			KC3ShipManager.set([NewShipRaw]);
			KC3ShipManager.save();
			
			KC3Network.trigger("Fleet");
		},
		
		/* Item Consumption
		-------------------------------------------------------*/
		"api_req_member/itemuse":function(params, response, headers){
			var
				ctime  = Date.safeToUtcTime(headers.Date),
				itemId = parseInt(params.api_useitem_id,10),
				fForce = parseInt(params.api_force_flag,10),
				fExchg = parseInt(params.api_exchange_type,10), // pops out from present box
				aData  = response.api_data,
				fChuui = aData.api_caution_flag,
				flags  = aData.api_flag;
			
			switch(flags){
				case 1:
					// Obtained Item
					var dItem  = aData.api_getitem; // Use Master, Master ID, Get Count "api_getitem":{"api_usemst":5,"api_mst_id":44,"api_getcount":5000} (from furni box)
					break;
				case 2:
					// Obtained Material
					var dMatr  = aData.api_material;
					KC3Database.Naverall({
						hour: Math.hrdInt("floor",ctime/3.6,6,1),
						type: "useitem" + itemId,
						data: dMatr
					});
					break;
			}
		},
		
		/* Arsenal Item List
		-------------------------------------------------------*/
		"api_req_kousyou/remodel_slotlist":function(params, response, headers){
			var
				self = this,
				rm = self.remodelSlot,
				li = rm.slotList,
				cu = rm.slotCur;
			// clear current buffer
			[li,cu].forEach(function(d){Object.keys(d).forEach(function(x){delete d[x];});});
			// add every possible equip modernization
			response.api_data.forEach(function(rmd){
				var k = rmd.api_id;
				delete rmd.api_id;
				li[k] = rmd;
			});
		},
		/* Arsenal Item Detail
		-------------------------------------------------------*/
		"api_req_kousyou/remodel_slotlist_detail":function(params, response, headers){
			var
				self = this,
				rm = self.remodelSlot,
				li = rm.slotList,
				cu = rm.slotCur;
			rm.slotId = parseInt(params.api_id);
			// clear current slot buffer
			[cu].forEach(function(d){Object.keys(d).forEach(function(x){delete d[x];});});
			// copy list buffer and merge for corresponding item
			$.extend(cu,li[rm.slotId],response.api_data);
		},
		/* Equipment Modernize
		-------------------------------------------------------*/
		"api_req_kousyou/remodel_slot":function(params, response, headers){
			// Check consumption
			var
				self = this,
				rm = self.remodelSlot,
				ky = (parseInt(params.api_certain_flag) && "certain") || "req",
				cu = rm.slotCur,
				ct = Date.safeToUtcTime(headers.Date),
				mt = Array.apply(null,{length:8}).map(function(){return 0;}),
				ms = KC3GearManager.get(parseInt(params.api_slot_id)).master();
			['fuel','bull','steel','bauxite','','','buildkit','remodelkit'].forEach(function(dk,id){
				// rejects empty key
				if(!dk.length) return;
				
				var sk = ['api',(id >= 4) ? ky : 'req',dk].join('_');
				mt[id] = -cu[sk];
			});
			console.info.apply(console,["Remodel Cost"].concat(mt));
			// Store to Lodger
			KC3Database.Naverall({
				hour: Math.hrdInt("floor",ct/3.6,6,1),
				type: "rmditem" + ms.api_id,
				data: mt
			});
			// Update equipment on local data
			(response.api_data.api_use_slot_id || []).forEach(function(gearId){ KC3GearManager.remove(gearId); });
			KC3GearManager.set([ response.api_data.api_after_slot ]);
			
			PlayerManager.consumables.buckets = response.api_data.api_after_material[5];
			PlayerManager.consumables.devmats = response.api_data.api_after_material[6];
			PlayerManager.consumables.screws = response.api_data.api_after_material[7];
			PlayerManager.consumables.torch = response.api_data.api_after_material[4];
			KC3QuestManager.get(619).increment();
			KC3Network.trigger("Consumables");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Quests");
		},
		
		/* Dummy
		-------------------------------------------------------*/
		"dummy":function(params, response, headers){
			
		}
		
	};
	
	
	/* RESULT SCREEN QUEST FULFILLMENT
	On a result screen, increment tracked quests that progressed
	-------------------------------------------------------*/
	function resultScreenQuestFulfillment(data,isPvP){
		var
			getRank = function(r){ return ['E','D','C','B','A','S','SS'].indexOf(r); },
			qLog = function(r){ // this one is used to track things
				var q = KC3QuestManager.get(r);
				console.log("Quest",r,"progress ["+(q.tracking ? q.tracking : '-----')+"], in progress:",q.status == 2);
				return q;
			};
		
		// If victory for "defeat"-type quests
		var rankPt = getRank(data.api_win_rank);
		if(rankPt==5 && KC3SortieManager.currentNode().allyNoDamage) rankPt++;
		if(!isPvP) {
			[ /* Rank Requirement Table */
				[ /* E RANK / It does not matter */
					[216,0,false,false], // Bd2: Defeat the flagship of an enemy fleet
					[214,1,false, true]  // Bw1: 2nd requirement: Encounter 24 bosses (index:1)
				],
				[ /* D RANK */ ],
				[ /* C RANK */ ],
				[ /* B RANK */
					[201,0,false,false], // Bd1: Defeat an enemy fleet
					[210,0,false,false], // Bd3: Defeat 10 abyssal fleets (B rank+)
					[226,0,[ 2 ], true], // Bd7: Defeat 5 bosses in World 2
					[241,0,[3,3], true], // Bw7: Defeat 5 bosses in W3-3,3-4,3-5
					[241,0,[3,4], true],
					[241,0,[3,5], true],
					[229,0,[ 4 ], true], // Bw6: Defeat 12 bosses in horned nodes in World 4
					[242,0,[4,4], true], // Bw8: Defeat a boss in World [W4-4]
					[214,2,false, true], // Bw1: 3rd requirement: Win vs 12 bosses (index:2)
				],
				[ /* A RANK */
					[261,0,[1,5], true], // Bw10: Sortie to [W1-5] and A-rank+ the boss node 3 times
					[265,0,[1,5], true]  // Bm5: Deploy a fleet to [W1-5] and A-rank+ the boss node 10 times
				],
				[ /* S RANK */
					[214,3,false,false], // Bw1: 4th requirement: 6 S ranks (index:3)
					[243,0,[5,2], true], // Bw9: Sortie to [W5-2] and S-rank the boss node 2 times
					[256,0,[6,1], true]  // Bm2: Deploy to [W6-1] and obtain an S-rank the boss node 3 times
				],
				[ /* SS RANK Kanzen shohri */ ],
			].slice(0, rankPt+1)
				.reduce(function(x,y){ return x.concat(y); })
				.filter(function(x){
					return (
						(!x[2] || KC3SortieManager.isSortieAt.apply(KC3SortieManager,x[2])) && /* Is sortie at */
						(!x[3] || KC3SortieManager.currentNode().isBoss())                  && /* Is on boss node */
						true
					);
				})
				.forEach(function(x){
					qLog(x[0]).increment(x[1]);
				});
		} else {
			KC3QuestManager.get(303).increment(); // C2: Daily Exercises 1
			if(rankPt >= 3) {
				KC3QuestManager.get(304).increment(); // C3: Daily Exercises 2
				KC3QuestManager.get(302).increment(); // C4: Weekly Exercises
				KC3QuestManager.get(311).increment(); // C8: Elite Fleet Practice
			}
		}
		
		// hunt quests - requires "battle prediction" to know which enemies sunk
		// KC3QuestManager.get(211).increment(); // Bd4: Sink 3 abyssal CV(L)
		// KC3QuestManager.get(218).increment(); // Bd5: Sink 3 abyssal transport ships
		// KC3QuestManager.get(212).increment(); // Bd6: Sink 5 abyssal transport ships
		// KC3QuestManager.get(230).increment(); // Bd8: Sink 6 abyssal submarines
		// KC3QuestManager.get(220).increment(); // Bw2: Sink 20 abyssal CV(L)
		// KC3QuestManager.get(213).increment(); // Bw3: Sink 20 transport ships
		// KC3QuestManager.get(221).increment(); // Bw4: Sink 50 transport ships
		// KC3QuestManager.get(228).increment(); // Bw5: Sink 15 submarines
	}
	
})();
