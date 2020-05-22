/* Kcsapi.js
KanColle Server API

Executes actions based on in-game actions read from the network.
This script is called by Network.js
Previously known as "Reactor"
*/
(function(){
	"use strict";
	
	window.Kcsapi = {
		shipConstruction: { active: false },
		remodelRecipes: {
			cachedRecipes: {},
			currentList: [],
			currentDetail: {}
		},
		serverOffset: 0,
		moraleRefresh: $.extend(new Date(),{
			calibrate: function(t){
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
			
			KC3SortieManager.load();
			// Marks last sortie as catbombed
			if(KC3SortieManager.isOnSortie()) {
				KC3SortieManager.onCat = true;
				var
					si = KC3SortieManager.getSortieId(),
					wm = 'm' + KC3SortieManager.getSortieMap().join(''),
					ma = localStorage.getObject('maps'),
					mp = ma[wm],
					ms = mp.stat;
				// Logs the catbomb to the statistics
				if(mp.stat && si) {
					mp.stat.onError.push(si);
				} else {
					// binary bomb quotes ^~^)v
					console.info("You're lucky that the catbomb is not on the event map!");/*RemoveLogging:skip*/
				}
				localStorage.setObject('maps',ma);
			}
			
			KC3Network.trigger("GameStart");
			
			// if there is either new ship(s) or new item(s)
			if(newCounts[0] > 0 || newCounts[1] > 0){
				console.log("Triggering GameUpdate, newCounts:", newCounts);
				KC3Network.trigger("GameUpdate", newCounts);
			}
		},
		"api_start2/getData":function(params, response, headers){
			this.api_start2(params, response, headers);
		},
		
		/* Consolidated Game Loading Call
		-------------------------------------------------------*/
		"api_get_member/require_info":function(params, response, headers){
			this["api_get_member/slot_item"](params, { api_data: response.api_data.api_slot_item }, headers);
			this["api_get_member/unsetslot"](params, { api_data: response.api_data.api_unsetslot }, headers);
			this["api_get_member/kdock"](params, { api_data: response.api_data.api_kdock }, headers);
			this["api_get_member/useitem"](params, { api_data: response.api_data.api_useitem }, headers);
			//this["api_get_member/furniture"](params, { api_data: response.api_data.api_furniture }, headers);
			PlayerManager.extraSupply = response.api_data.api_extra_supply;
			// ship type filters settings:
			//api_oss_setting: {api_language_type: 0, api_oss_items: [1, 1, 1, 1, 1, 1, 1, 1]}
			// using skin: api_skin_id
			// flagship position: api_position_id
		},
		
		"api_req_member/require_info":function(params, response, headers){
			this["api_get_member/slot_item"](params, { api_data: response.api_data.api_slot_item }, headers);
			this["api_get_member/kdock"](params, { api_data: response.api_data.api_kdock }, headers);
			this["api_get_member/useitem"](params, { api_data: response.api_data.api_useitem }, headers);
		},
		
		/* LogIn Bonus
		-------------------------------------------------------*/
		"api_req_member/get_incentive":function(params, response, headers){
			if(response.api_data && response.api_data.api_item){
				console.info("Login Bonus:", response.api_data);/*RemoveLogging:skip*/
			}
		},
		
		/* Home Port Screen
		-------------------------------------------------------*/
		"api_port/port":function(params, response, headers){
			KC3Network.trigger("HomeScreen");
			
			KC3ShipManager.set(response.api_data.api_ship, true);
			this.serverOffset = this.moraleRefresh.calibrate( headers.Date );
			
			var utcSeconds = Date.toUTCseconds(headers.Date);
			
			PlayerManager.setHQ(utcSeconds, {
				mid: response.api_data.api_basic.api_member_id,
				name: response.api_data.api_basic.api_nickname,
				nameId: response.api_data.api_basic.api_nickname_id,
				desc: response.api_data.api_basic.api_comment,
				rank: response.api_data.api_basic.api_rank,
				level: response.api_data.api_basic.api_level,
				exp: response.api_data.api_basic.api_experience,
				fcoin: response.api_data.api_basic.api_fcoin,
				maxShipSlots: response.api_data.api_basic.api_max_chara,
				maxGearSlots: response.api_data.api_basic.api_max_slotitem,
				fleetCount: response.api_data.api_basic.api_count_deck,
				questCount: response.api_data.api_parallel_quest_count,
				repairSlots: response.api_data.api_basic.api_count_ndock,
				buildSlots: response.api_data.api_basic.api_count_kdock,
			});
			
			PlayerManager.setFleets( response.api_data.api_deck_port );
			PlayerManager.setRepairDocks( response.api_data.api_ndock );
			
			PlayerManager.portRefresh(utcSeconds,
				response.api_data.api_material.slice(0,4).map(x=>x.api_value))
			.setResources(utcSeconds,
				response.api_data.api_material.slice(0,4).map(x=>x.api_value))
			.setConsumables(utcSeconds, {
				torch: response.api_data.api_material[4].api_value,
				buckets: response.api_data.api_material[5].api_value,
				devmats: response.api_data.api_material[6].api_value,
				screws: response.api_data.api_material[7].api_value
			})
			.setStatistics({
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
			})
			.setNewsfeed(response.api_data.api_log, utcSeconds * 1000);
			
			PlayerManager.combinedFleet = response.api_data.api_combined_flag || 0;
			PlayerManager.friendlySettings = response.api_data.api_friendly_setting || {};
			
			KC3SortieManager.endSortie(response.api_data);
			
			PlayerManager.loadBases()
				.setBaseConvertingSlots(response.api_data.api_plane_info);
			
			KC3Network.trigger("HQ");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Timers");
			KC3Network.trigger("Quests");
			KC3Network.trigger("Fleet");
			
			// To detect event boss debuffed sound effect
			if(response.api_data.api_event_object){
				KC3Network.trigger("DebuffNotify", response.api_data.api_event_object);
			}
		},
		
		/*-------------------------------------------------------*/
		/*--------------------[ PLAYER INFO ]--------------------*/
		/*-------------------------------------------------------*/
		
		/* User Basic Information
		 * deprecated by kc devs, included in /port
		-------------------------------------------------------*/
		"api_get_member/basic":function(params, response, headers){
			PlayerManager.setHQ(Date.toUTCseconds(headers.Date), {
				mid: response.api_data.api_member_id,
				name: response.api_data.api_nickname,
				nameId: response.api_data.api_nickname_id,
				desc: response.api_data.api_comment,
				rank: response.api_data.api_rank,
				level: response.api_data.api_level,
				exp: response.api_data.api_experience,
				fcoin: response.api_data.api_fcoin,
				maxShipSlots: response.api_data.api_max_chara,
				maxGearSlots: response.api_data.api_max_slotitem,
				fleetCount: response.api_data.api_count_deck,
				repairSlots: response.api_data.api_count_ndock,
				buildSlots: response.api_data.api_count_kdock,
			});
			
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
			PlayerManager.setHQ(Date.toUTCseconds(headers.Date), {
				mid: response.api_data.api_member_id,
				name: response.api_data.api_nickname,
				nameId: response.api_data.api_nickname_id,
				desc: response.api_data.api_cmt,
				rank: response.api_data.api_rank,
				level: response.api_data.api_level,
				exp: response.api_data.api_experience[0],
				maxShipSlots: response.api_data.api_ship[1],
				maxGearSlots: response.api_data.api_slotitem[1],
				fleetCount: response.api_data.api_deck,
				repairSlots: response.api_data.api_ndoc,
				buildSlots: response.api_data.api_kdoc,
			});
			
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
					rate: response.api_data.api_war.api_rate * 100,
					win: response.api_data.api_war.api_win,
					lose: response.api_data.api_war.api_lose
				}
			});
			
			KC3Network.trigger("HQ");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
		},
		
		"api_get_member/material":function(params, response, headers){
			var utcSeconds = Date.toUTCseconds(headers.Date);
			
			var currentResources = [];
			for(let ctr in response.api_data){
				let thisItem = response.api_data[ctr];
				switch(thisItem.api_id){
					case 1: currentResources[0] = thisItem.api_value; break;
					case 2: currentResources[1] = thisItem.api_value; break;
					case 3: currentResources[2] = thisItem.api_value; break;
					case 4: currentResources[3] = thisItem.api_value; break;
					case 5: PlayerManager.consumables.torch = thisItem.api_value; break;
					case 6: PlayerManager.consumables.buckets = thisItem.api_value; break;
					case 7: PlayerManager.consumables.devmats = thisItem.api_value; break;
					case 8: PlayerManager.consumables.screws = thisItem.api_value; break;
					default: break;
				}
			}
			
			PlayerManager.setResources(utcSeconds, currentResources);
			PlayerManager.setConsumables();
			KC3Network.trigger("Consumables");
		},
		
		"api_get_member/useitem":function(params, response, headers){
			// Clean counters first because items become to 0 will not appear in API array at all
			Object.keys(PlayerManager.consumables).forEach(key => {
				// these things not real 'useitem' (no data in this API result)
				if(["fcoin", "buckets", "devmats", "screws", "torch"].indexOf(key) === -1)
					PlayerManager.consumables[key] = 0;
			});
			for(let idx in response.api_data){
				const thisItem = response.api_data[idx];
				// Recognize some frequently used items, full IDs set in master useitem
				// TODO refactoring structure to save api_id too
				switch(thisItem.api_id){
					// 1:buckets, 2:torch, 3:devmats, 4:screws not found in this API,
					// but counts defined in API /material above
					case 10: PlayerManager.consumables.furniture200 = thisItem.api_count; break;
					case 11: PlayerManager.consumables.furniture400 = thisItem.api_count; break;
					case 12: PlayerManager.consumables.furniture700 = thisItem.api_count; break;
					// 44 not found in this API, as it's not useitem and even not material
					//case 44: PlayerManager.consumables.fcoin = thisItem.api_count; break;
					case 49: PlayerManager.consumables.dockKey = thisItem.api_count; break;
					// 50 and 51 not found in this API, as they are slotitem
					//case 50: PlayerManager.consumables.repairTeam = thisItem.api_count; break;
					//case 51: PlayerManager.consumables.repairGoddess = thisItem.api_count; break;
					case 52: PlayerManager.consumables.furnitureFairy = thisItem.api_count; break;
					// 53 might be Port Expansion? but not listed in inventory like dock key
					//case 53: PlayerManager.consumables.portExpansion = thisItem.api_count; break;
					case 54: PlayerManager.consumables.mamiya = thisItem.api_count; break;
					case 55: PlayerManager.consumables.ring = thisItem.api_count; break;
					case 56: PlayerManager.consumables.chocolate = thisItem.api_count; break;
					case 57: PlayerManager.consumables.medals = thisItem.api_count; break;
					case 58: PlayerManager.consumables.blueprints = thisItem.api_count; break;
					case 59: PlayerManager.consumables.irako = thisItem.api_count; break;
					case 60: PlayerManager.consumables.presents = thisItem.api_count; break;
					case 61: PlayerManager.consumables.firstClassMedals = thisItem.api_count; break;
					case 62: PlayerManager.consumables.hishimochi = thisItem.api_count; break;
					case 63: PlayerManager.consumables.hqPersonnel = thisItem.api_count; break;
					case 64: PlayerManager.consumables.reinforceExpansion = thisItem.api_count; break;
					case 65: PlayerManager.consumables.protoCatapult = thisItem.api_count; break;
					// 66, 67, 69 and 76 not found in this API, as they are slotitem
					//case 66: PlayerManager.consumables.ration = thisItem.api_count; break;
					//case 67: PlayerManager.consumables.resupplier = thisItem.api_count; break;
					//case 69: PlayerManager.consumables.mackerelCan = thisItem.api_count; break;
					//case 76: PlayerManager.consumables.rationSpecial = thisItem.api_count; break;
					case 68: PlayerManager.consumables.mackerel = thisItem.api_count; break;
					case 70: PlayerManager.consumables.skilledCrew = thisItem.api_count; break;
					case 71: PlayerManager.consumables.nEngine = thisItem.api_count; break;
					case 72: PlayerManager.consumables.decoMaterial = thisItem.api_count; break;
					case 73: PlayerManager.consumables.constCorps = thisItem.api_count; break;
					case 74: PlayerManager.consumables.newAircraftBlueprint = thisItem.api_count; break;
					case 75: PlayerManager.consumables.newArtilleryMaterial = thisItem.api_count; break;
					case 77: PlayerManager.consumables.newAviationMaterial = thisItem.api_count; break;
					case 78: PlayerManager.consumables.actionReport = thisItem.api_count; break;
					// 79, 81~84 no medal icon found in itemicons.swf, as they are never in inventory?
					case 79: PlayerManager.consumables.straitMedal = thisItem.api_count; break;
					case 80: PlayerManager.consumables.xmasGiftBox = thisItem.api_count; break;
					case 81: PlayerManager.consumables.shogoMedalHard = thisItem.api_count; break;
					case 82: PlayerManager.consumables.shogoMedalNormal = thisItem.api_count; break;
					case 83: PlayerManager.consumables.shogoMedalEasy = thisItem.api_count; break;
					case 84: PlayerManager.consumables.shogoMedalCasual = thisItem.api_count; break;
					case 85: PlayerManager.consumables.rice = thisItem.api_count; break;
					case 86: PlayerManager.consumables.umeboshi = thisItem.api_count; break;
					case 87: PlayerManager.consumables.nori = thisItem.api_count; break;
					case 88: PlayerManager.consumables.tea = thisItem.api_count; break;
					case 89: PlayerManager.consumables.dinnerTicket = thisItem.api_count; break;
					case 90: PlayerManager.consumables.setsubunBeans = thisItem.api_count; break;
					case 91: PlayerManager.consumables.emergencyRepair = thisItem.api_count; break;
					case 92: PlayerManager.consumables.newRocketDevMaterial = thisItem.api_count; break;
					case 93: PlayerManager.consumables.sardine = thisItem.api_count; break;
					default: break;
				}
			}
			console.log("Refresh useitems", PlayerManager.consumables);
			PlayerManager.setConsumables();
			KC3Network.trigger("Consumables");
		},
		
		/* Set friendly support fleet since 2019-05-31.
		   This settings might disappear after event, so not persistent,
			and default to {}
		-------------------------------------------------------*/
		"api_req_member/set_friendly_request":function(params, response, headers, decodedParams){
			const newSettings = {
				// 1 if request friendly fleet
				api_request_flag: parseInt(decodedParams.api_request_flag, 10),
				// 1 if request stronger fleet by consuming 1~6 torches
				api_request_type: parseInt(decodedParams.api_request_type, 10),
			};
			PlayerManager.friendlySettings = $.extend(PlayerManager.friendlySettings || {}, newSettings);
		},
		
		
		/*-------------------------------------------------------*/
		/*----------------------[ LIBRARY ]----------------------*/
		/*-------------------------------------------------------*/
		
		/* Picture book
		-------------------------------------------------------*/
		"api_get_member/picture_book":function(params, response, headers){
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
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("Timers");
			KC3Network.trigger("Fleet");
		},
		
		"api_get_member/ship3":function(params, response, headers){
			KC3ShipManager.set( response.api_data.api_ship_data );
			PlayerManager.setFleets( response.api_data.api_deck_data );
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("Timers");
			KC3Network.trigger("Fleet");
		},
		
		"api_req_kaisou/open_exslot":function(params, response, headers){
			var rosterId = parseInt(params.api_id, 10),
				shipObj  = KC3ShipManager.get(rosterId);
			// According `main.js#OpenExSlotAPI`,
			// update ship ex-slot here because no /ship3 or /ship2 call followed
			shipObj.ex_item = -1;
			KC3ShipManager.save();
			// assume KC client has already checked 1 item left at least
			PlayerManager.consumables.reinforceExpansion -= 1;
			PlayerManager.setConsumables();
			console.log("Extra Slot unlocked for", rosterId, shipObj.name());
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Fleet");
		},
		
		"api_req_kaisou/marriage":function(params, response, headers){
			var rosterId    = parseInt(params.api_id, 10),
				shipObj     = KC3ShipManager.get(rosterId),
				marriedShip = response.api_data;
			console.log("Perform Marriage with", rosterId, shipObj.name());
			// no longer followed by /ship2 and /useitem since HTML5 mode
			KC3ShipManager.set([marriedShip]);
			PlayerManager.consumables.ring -= 1;
			PlayerManager.setConsumables();
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Fleet");
		},
		
		"api_req_kaisou/remodeling":function(params, response, headers){
			var utcHour  = Date.toUTChours(headers.Date),
				ship     = KC3ShipManager.get(params.api_id),
				master   = ship.master(),
				remodel  = RemodelDb.remodelInfo(master.api_id) || {},
				// Materials: [fuel, ammo, steel, bauxite, torch, bucket, devmat, screw]
				// NOTE: api_afterfuel is steel consumption!
				material = [0, -master.api_afterbull, -master.api_afterfuel, 0,
							-(remodel.torch || 0), 0, -(remodel.devmat || 0), 0];
			
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
							console.warn("Expected array of length 2 on consumption data", pendingData);/*RemoveLogging:skip*/
						break;
					}
				});
			});
			
			KC3Database.Naverall({
				hour: utcHour,
				type: "remodel" + master.api_id,
				data: material
			});
			if(remodel.blueprint > 0){
				PlayerManager.consumables.blueprints -= remodel.blueprint;
			}
			if(remodel.catapult > 0){
				PlayerManager.consumables.protoCatapult -= remodel.catapult;
			}
			if(remodel.report > 0){
				PlayerManager.consumables.actionReport -= remodel.report;
			}
			if(remodel.gunmat > 0){
				PlayerManager.consumables.newArtilleryMaterial -= remodel.gunmat;
			}
			if(remodel.airmat > 0){
				PlayerManager.consumables.newAviationMaterial -= remodel.airmat;
			}
			PlayerManager.setResources(utcHour * 3600, null, material.slice(0, 4));
			PlayerManager.setConsumables(utcHour * 3600, null, material.slice(4, 8));
			KC3Network.trigger("Consumables");
		},
		
		/* Fleet Presets
		-------------------------------------------------------*/
		// List Presets
		"api_get_member/preset_deck":function(params, response, headers){
			console.log("List Presets", response.api_data.api_deck);
		},
		
		// Register preset
		"api_req_hensei/preset_register":function(params, response, headers){
			console.log("Registered Preset", response.api_data.api_preset_no, response.api_data);
		},
		
		// Remove Preset from list
		"api_req_hensei/preset_delete":function(params, response, headers){
			console.log("Deleted Preset", params.api_preset_no);
		},
		
		// Use a Preset
		"api_req_hensei/preset_select":function(params, response, headers){
			var deckId = parseInt(params.api_deck_id, 10);
			PlayerManager.akashiRepair.onPresetSelect(PlayerManager.fleets[deckId-1]);
			PlayerManager.fleets[deckId-1].update( response.api_data );
			PlayerManager.saveFleets();
			KC3Network.trigger("Fleet", { switchTo: deckId });
		},
		
		/* Equipment list
		-------------------------------------------------------*/
		"api_get_member/slot_item":function(params, response, headers){
			KC3GearManager.clear();
			KC3GearManager.set( response.api_data );
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Fleet");
		},
		
		/* Unequipped equipment list by categories
		-------------------------------------------------------*/
		"api_get_member/unsetslot":function(params, response, headers){
			// Data format: `api_slottype${api_type[2]}: [rosterId array]`
			// Equipment unequipped must be updated by updating `items` of ships,
			// so nothing to be handled for this call now, besides caching them.
			KC3GearManager.unsetSlotitemByType2 = {};
			const data = response.api_data;
			const prefix = "api_slottype";
			if(data) {
				Object.keys(data).forEach(key => {
					if(key.slice(0, prefix.length) === prefix && Array.isArray(data[key])) {
						const type2Id = key.slice(prefix.length);
						KC3GearManager.unsetSlotitemByType2[type2Id] = data[key];
					}
				});
			}
			console.log("Refresh unsetslot", KC3GearManager.unsetSlotitemByType2);
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
			var fleetNo = parseInt(params.api_deck_id, 10),
				useFlag = parseInt(params.api_use_type, 10),
				fMamiya = !!(useFlag & 1),
				fIrako  = !!(useFlag & 2);
			PlayerManager.consumables.mamiya -= fMamiya & 1;
			PlayerManager.consumables.irako -= fIrako & 1;
			PlayerManager.setConsumables();
			console.log("Morale item applied to fleet #" + fleetNo, "Mamiya: " + fMamiya, "Irako: " + fIrako);
			KC3Network.trigger("Consumables");
		},
		
		/* Update fleet name
		-------------------------------------------------------*/
		"api_req_member/updatedeckname":function(params, response, headers){
			PlayerManager.fleets[params.api_deck_id-1].name = decodeURIComponent(params.api_name);
			PlayerManager.saveFleets();
		},
		
		/*-------------------------------------------------------*/
		/*-------------------[ CONSTRUCTION ]--------------------*/
		/*-------------------------------------------------------*/
		
		/* Construct a Ship
		-------------------------------------------------------*/
		"api_req_kousyou/createship":function(params, response, headers){
			var utcHour = Date.toUTChours(headers.Date);
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
				hour: utcHour,
				type: "crship"+params.api_kdock_id,
				data: [
					params.api_item1,params.api_item2,params.api_item3,params.api_item4,
					params.api_highspeed * (1 + 9 * params.api_large_flag),0,params.api_item5,0
				].map(function(x){return -x;})
			});
			KC3QuestManager.get(606).increment(); // F2: Daily Construction 1
			KC3QuestManager.get(608).increment(); // F4: Daily Construction 2
			PlayerManager.setResources(utcHour * 3600, null,
				this.shipConstruction.resources.slice(0, 4).map(v => -v));
			PlayerManager.consumables.devmats -= parseInt(this.shipConstruction.resources[4], 10);
			PlayerManager.setConsumables();
			KC3Network.trigger("Quests");
			KC3Network.trigger("Consumables");
		},
		
		/* Construction Docks
		-------------------------------------------------------*/
		"api_get_member/kdock":function(params, response, headers){
			var utcSeconds = Date.toUTCseconds(headers.Date);
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
						time: utcSeconds
					});
				}else{
					KC3Database.Build({
						flag: this.shipConstruction.flagship,
						rsc1: this.shipConstruction.resources[0],
						rsc2: this.shipConstruction.resources[1],
						rsc3: this.shipConstruction.resources[2],
						rsc4: this.shipConstruction.resources[3],
						result: response.api_data[this.shipConstruction.dock_num-1].api_created_ship_id,
						time: utcSeconds
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
				delta = 10;
			}
			PlayerManager.consumables.torch -= delta;
			PlayerManager.setConsumables();
			KC3Database.Naverall({
				data: [0,0,0,0,-delta,0,0,0]
			},"crship"+params.api_kdock_id);
			KC3TimerManager.build(params.api_kdock_id).activate(Date.now());
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
			var fleetNum = parseInt(params.api_id, 10),
				fleetIndex = fleetNum - 1;
			
			// If removing all ships except flagship
			if(typeof response.api_data != "undefined"){
				if(response.api_data.api_change_count > 0){
					PlayerManager.fleets[fleetIndex].clearNonFlagShips();
					PlayerManager.saveFleets();
					KC3Network.trigger("Fleet", { switchTo: fleetNum });
					return true;
				}
			}
			
			// Ship deploying / removing / swapping
			// Target ship index on a fleet to be changed
			var changedIndex = parseInt(params.api_ship_idx, 10);
			// Target ship slot old ship ID, -1 if empty
			var changedShip = PlayerManager.fleets[fleetIndex].ships[changedIndex];
			// Source ship ID to be set, -1 if to be removed, -2 if remove all but flagship
			var changingShip = parseInt(params.api_ship_id, 10);
			// Source fleet index where source ship swapped from, -1 if not on fleet
			var oldFleetIndex = changingShip > 0 ? KC3ShipManager.locateOnFleet(changingShip) : -1;
			// Source ship index on the source fleet, -1 if not on fleet
			var oldShipIndex = oldFleetIndex > -1 ? PlayerManager.fleets[oldFleetIndex].ships.indexOf(changingShip) : -1;
			if(changingShip > 0){ // Deploy or swap ship
				// Deploy ship to target fleet first, to avoid issue when swapping in the same fleet
				PlayerManager.fleets[fleetIndex].ships[changedIndex] = changingShip;
				// Swap ship from source fleet
				if(oldFleetIndex > -1 && oldShipIndex > -1){
					PlayerManager.fleets[oldFleetIndex].ships[oldShipIndex] = changedShip;
					// If target ship slot is empty, apply ship removing on source fleet
					if(changedShip <= 0){
						PlayerManager.fleets[oldFleetIndex].ships.splice(oldShipIndex, 1);
						PlayerManager.fleets[oldFleetIndex].ships.push(-1);
					}
					// If not the same fleet, also recheck akashi repair of source fleet
					if(oldFleetIndex !== fleetIndex){
						PlayerManager.akashiRepair.onChange(PlayerManager.fleets[oldFleetIndex]);
						PlayerManager.fleets[oldFleetIndex].updateAkashiRepairDisplay();
					}
				}
			} else { // Remove ship
				PlayerManager.fleets[fleetIndex].ships.splice(changedIndex, 1);
				PlayerManager.fleets[fleetIndex].ships.push(-1);
			}
			PlayerManager.akashiRepair.onChange(PlayerManager.fleets[fleetIndex]);
			PlayerManager.fleets[fleetIndex].updateAkashiRepairDisplay();
			PlayerManager.saveFleets();
			KC3Network.trigger("Fleet", { switchTo: fleetNum });
		},
		
		/* Lock a ship
		-------------------------------------------------------*/
		"api_req_hensei/lock":function(params, response, headers){
			var shipID    = parseInt(params.api_ship_id,10);
			var lockState = response.api_data.api_locked;
			var shipData  = KC3ShipManager.get(shipID);
			
			if(shipData.lock) {
				console.log("Unlocked", shipData.rosterId, shipData.name());
			} else {
				ConfigManager.loadIfNecessary();
				var lockID = ConfigManager.lock_list.indexOf(shipID);
				if(lockID+1) {
					ConfigManager.lock_list.splice(lockID,1);
					ConfigManager.save();
				} else {
					console.log("Locked", shipData.rosterId, shipData.name());
				}
			}
			
			shipData.lock = lockState;
			KC3ShipManager.save();
			KC3Network.trigger("Fleet");
			KC3Network.trigger("ShipSlots");
		},
		
		/* Lock a equipment
		-------------------------------------------------------*/
		"api_req_kaisou/lock":function(params, response, headers){
			var itemId = parseInt(params.api_slotitem_id, 10);
			var lockState = response.api_data.api_locked;
			var gearObj = KC3GearManager.get(itemId);
			if(gearObj.itemId > 0){
				gearObj.lock = lockState;
				KC3GearManager.save();
				console.log("Item", itemId, gearObj.name(), "lock state", lockState);
			}
			KC3Network.trigger("GearSlots");
		},
		
		/* Change equipment of a ship
		-------------------------------------------------------*/
		"api_req_kaisou/slotset":function(params, response, headers){
			var itemID = parseInt(decodeURIComponent(params.api_item_id), 10);
			var slotIndex = params.api_slot_idx;
			var shipID = parseInt(params.api_id, 10);
			var shipObj = KC3ShipManager.get(shipID);
			var oldItemId = shipObj.items[slotIndex];
			var oldShipObj = new KC3Ship(shipObj, true);
			shipObj.items[slotIndex] = itemID;
			KC3ShipManager.save();
			
			// Bauxite might be refunded by changing regular plane to large flying boat
			const utcHour = Date.toUTChours(headers.Date),
				afterBauxite = response.api_data && response.api_data.api_bauxite;
			if(afterBauxite) {
				const refundedBauxite = afterBauxite - PlayerManager.hq.lastMaterial[3];
				PlayerManager.setResources(utcHour * 3600, null, [0, 0, 0, refundedBauxite]);
				// might add a record for this type of ledger?
				KC3Network.trigger("Consumables");
			}
			
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(shipID);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
			
			// GunFit event now not only represent fit bonus and AACI, can be any effect
			var oldGearObj = KC3GearManager.get(oldItemId);
			var gearObj = KC3GearManager.get(itemID);
			// Will be followed by `api_get_member/ship3`, defer event 1 call
			KC3Network.deferTrigger(1, "GunFit", shipObj.equipmentChangedEffects(gearObj, oldGearObj, oldShipObj));
		},
		
		"api_req_kaisou/slotset_ex":function(params, response, headers){
			var itemID = parseInt(decodeURIComponent(params.api_item_id), 10);
			var shipID = parseInt(params.api_id, 10);
			var shipObj = KC3ShipManager.get(shipID);
			var oldShipObj = new KC3Ship(shipObj, true);
			var oldGearObj = KC3GearManager.get(shipObj.ex_item);
			var gearObj = KC3GearManager.get(itemID);
			shipObj.ex_item = itemID;
			KC3ShipManager.save();
			
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(shipID);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
			// Will be followed by `api_get_member/ship3`, defer event 1 call
			KC3Network.deferTrigger(1, "GunFit", shipObj.equipmentChangedEffects(gearObj, oldGearObj, oldShipObj));
		},
		
		/* Remove all equipment of a ship
		-------------------------------------------------------*/
		"api_req_kaisou/unsetslot_all":function(params, response, headers){
			var shipID = parseInt(params.api_id, 10);
			var shipObj = KC3ShipManager.get(shipID);
			// unnecessary operation here since a `/api_get_member/ship3` call is followed
			shipObj.items = [-1,-1,-1,-1,-1];
			KC3ShipManager.save();
			
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(shipID);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
			
			// Although followed by `/ship3`, but nothing will be effect, so no defer
			KC3Network.trigger("GunFit", shipObj.equipmentChangedEffects());
		},
		
		/* Equipment dragging
		-------------------------------------------------------*/
		"api_req_kaisou/slot_exchange_index":function(params, response, headers){
			// Changed to full ship data since 2019-01-22
			//const updatingShip = KC3ShipManager.get(params.api_id);
			//updatingShip.items = response.api_data.api_slot;
			KC3ShipManager.set([response.api_data.api_ship_data]);
			// Bauxite might be refunded by changing regular plane to large flying boat
			const utcHour = Date.toUTChours(headers.Date),
				afterBauxite = response.api_data.api_bauxite;
			if(afterBauxite) {
				const refundedBauxite = afterBauxite - PlayerManager.hq.lastMaterial[3];
				PlayerManager.setResources(utcHour * 3600, null, [0, 0, 0, refundedBauxite]);
				// might add a record for this type of ledger?
				KC3Network.trigger("Consumables");
			}
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(params.api_id);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
		},
		
		/* Equipment swapping between ships
		-------------------------------------------------------*/
		"api_req_kaisou/slot_deprive":function(params, response, headers){
			// it's not swap in fact, only move item from unset ship to set ship:
			// old slot from unset ship will be empty, and old item from set ship (if any) will be freed
			const setExSlot = params.api_set_slot_kind == 1;
			const setShipRosterId = parseInt(params.api_set_ship, 10);
			const setItemIndex = setExSlot ? -1 : parseInt(params.api_set_idx, 10);
			const newShipData = response.api_data.api_ship_data;
			
			// old status of set ship
			const oldShipObj = KC3ShipManager.get(setShipRosterId);
			const oldShipObjClone = new KC3Ship(oldShipObj, true);
			const oldGearObj = oldShipObj.equipment(setItemIndex);
			// update set item only for equipment change checks
			oldShipObj.items = newShipData.api_set_ship.api_slot;
			if(setExSlot) oldShipObj.ex_item = newShipData.api_set_ship.api_slot_ex;
			
			// renew ship data for both set ship and unset ship
			KC3ShipManager.set([newShipData.api_set_ship, newShipData.api_unset_ship]);
			
			// bauxite might be refunded by changing regular plane to large flying boat
			const utcHour = Date.toUTChours(headers.Date),
				afterBauxite = response.api_data.api_bauxite;
			if(afterBauxite) {
				const refundedBauxite = afterBauxite - PlayerManager.hq.lastMaterial[3];
				PlayerManager.setResources(utcHour * 3600, null, [0, 0, 0, refundedBauxite]);
				// might add a record for this type of ledger?
				KC3Network.trigger("Consumables");
			}
			
			// If ship is in a fleet, switch view to the fleet containing the ship
			const fleetNum = KC3ShipManager.locateOnFleet(params.api_set_ship);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
			
			// get new status of set ship
			const newShipObj = KC3ShipManager.get(setShipRosterId);
			const newGearObj = newShipObj.equipment(setItemIndex);
			// not followed by `api_get_member/ship3`, do not defer event
			KC3Network.trigger("GunFit", oldShipObj.equipmentChangedEffects(newGearObj, oldGearObj, oldShipObjClone));
		},
		
		/* Re-supply a ship
		-------------------------------------------------------*/
		"api_req_hokyu/charge":function(params, response, headers){
			var utcSeconds = Date.toUTCseconds(headers.Date);
			var shipList = response.api_data.api_ship,
				charge   = parseInt(params.api_kind),
				sParam   = {noFuel:!(charge & 1),noAmmo:!(charge & 2)};
			
			KC3QuestManager.get(504).increment(); // E4: Daily Resupplies
			
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
			
			PlayerManager.setResources(utcSeconds, response.api_data.api_material);
			KC3Network.trigger("Consumables");
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
			const world = parseInt(params.api_maparea_id, 10),
				map = parseInt(params.api_map_no, 10),
				apiData = response.api_data;
			const thisMap = KC3SortieManager.getCurrentMapData(world, map);
			const oldRank = thisMap.difficulty;
			thisMap.difficulty = parseInt(params.api_rank, 10);
			if(apiData && apiData.api_max_maphp){
				// if API gives new HP data only for some old event maps
				thisMap.curhp = thisMap.maxhp = parseInt(apiData.api_max_maphp, 10);
				delete thisMap.gaugeNum;
			} else if(apiData && apiData.api_maphp){
				// if API gives all map info,
				// official devs announced since Winter 2018:
				// change to lower difficulty may keep some gauge states or gimmicks, not reset all things
				const mapInfo = apiData.api_maphp;
				thisMap.curhp = parseInt(mapInfo.api_now_maphp, 10);
				thisMap.maxhp = parseInt(mapInfo.api_max_maphp, 10);
				thisMap.gaugeNum = parseInt(mapInfo.api_gauge_num, 10) || 1;
				thisMap.gaugeType = parseInt(mapInfo.api_gauge_type, 10) || 0;
				thisMap.kind = ["", "", "gauge-hp", "gauge-tp"][thisMap.gaugeType] || "gauge-hp";
			} else {
				// nothing given for some event maps, suppose all things reset
				console.log("Event map new rank HP data is not given, leaving 9999 as placeholder");
				thisMap.curhp = thisMap.maxhp = 9999;
				delete thisMap.gaugeNum;
			}
			// clear old progress of this map,
			// to lower difficulty known facts: unlocked map gimmick not reset and
			// current gauge num not reset, but add 25% of lower rank's max maphp to now maphp
			if(apiData && apiData.api_maphp && oldRank && oldRank < thisMap.difficulty){
				// only forget the boss HP of higher difficulty if there is one
				delete thisMap.baseHp;
			} else {
				delete thisMap.kinds;
				delete thisMap.maxhps;
				delete thisMap.baseHp;
				delete thisMap.debuffFlag;
				delete thisMap.debuffSound;
			}
			KC3SortieManager.setCurrentMapData(thisMap, world, map);
		},
		
		/* Start Sortie
		-------------------------------------------------------*/
		"api_req_map/start":function(params, response, headers){
			var utcSeconds = Date.toUTCseconds(headers.Date);
			var mapId = parseInt(response.api_data.api_maparea_id, 10);
			var mapNo = parseInt(response.api_data.api_mapinfo_no, 10);
			var fleetNum = parseInt(params.api_deck_id, 10);
			KC3SortieManager.startSortie(
				mapId, mapNo, fleetNum, utcSeconds,
				response.api_data.api_eventmap
			);
			KC3SortieManager.setBoss(
				response.api_data.api_bosscell_no,
				response.api_data.api_bosscomp
			);
			KC3Master.setCellData(response.api_data);
			
			KC3QuestManager.get(214).increment(0); // Bw1: 1st requirement: Sortie 36 times (index:0)
			
			KC3SortieManager.advanceNode( response.api_data, utcSeconds );
			KC3Network.hasOverlay = true;
			(new RMsg("service", "mapMarkers", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				nextNode: response.api_data,
				startSortie: true
			})).execute();
			
			KC3Network.trigger("SortieStart");
			KC3Network.trigger("CompassResult");
			KC3Network.trigger("Quests");
			if(fleetNum > 0){
				KC3Network.trigger("Fleet", { switchTo: PlayerManager.combinedFleet && fleetNum === 1 ? "combined" : fleetNum });
			} else {
				KC3Network.trigger("Fleet");
			}
		},
		
		/* Start LBAS Sortie
		-------------------------------------------------------*/
		"api_req_map/start_air_base":function(params, response, headers, decodedParams){
			// Target nodes attacked by sortied LB, format string: `edge1,edge2`,
			// 'strike_point_N' refers to the sequence number of land base (`.api_rid`),
			// which means `api_strike_point_1` will be undefined if LB #2 or #3 sortied only.
			// see `main.js#AirUnitGoAPI.prototype._connect`
			const strikePoints = [
				decodedParams.api_strike_point_1,
				decodedParams.api_strike_point_2,
				decodedParams.api_strike_point_3
			].filter(p => !!p);
			const utcHour = Date.toUTChours(headers.Date);
			var consumedFuel = 0, consumedAmmo = 0;
			var sortiedBase = 0;
			$.each(PlayerManager.bases, function(i, base){
				// Land Base of this world, Action: sortie
				if(base.map === KC3SortieManager.map_world && base.action === 1){
					if(strikePoints[sortiedBase]){
						base.strikePoints = JSON.parse(`[${strikePoints[sortiedBase]}]`);
					}
					sortiedBase += 1;
					console.log("Sortied LBAS #" + sortiedBase, base);
					var cost = base.calcSortieCost();
					consumedFuel += cost.fuel;
					consumedAmmo += cost.ammo;
				}
			});
			if(sortiedBase > 0){
				// Assume strikePoints can be kept until next set bases (mapinfo API call)
				KC3SortieManager.updateSortiedLandBases();
				KC3Network.trigger("Lbas");
			}
			// Record hidden fuel & ammo consumption of sortied LBAS
			console.log("Consumed fuel & ammo:", consumedFuel, consumedAmmo);
			if(consumedFuel > 0 || consumedAmmo > 0){
				KC3Database.Naverall({
					hour: utcHour,
					type: "lbas" + KC3SortieManager.map_world,
					data: [-consumedFuel,-consumedAmmo,0,0].concat([0,0,0,0])
				});
				PlayerManager.setResources(utcHour * 3600, null, [-consumedFuel,-consumedAmmo,0,0]);
				KC3Network.trigger("Consumables");
			}
		},
		
		/* Traverse Map
		-------------------------------------------------------*/
		"api_req_map/next":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			KC3SortieManager.discardSunk();
			var nextNode = KC3SortieManager.advanceNode(
				response.api_data, Date.toUTCseconds(headers.Date)
			);
			KC3Network.hasOverlay = true;
			(new RMsg("service", "mapMarkers", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				nextNode: response.api_data
			})).execute();
			KC3Network.trigger("CompassResult");
			KC3Network.trigger("Fleet");
			if(response.api_data.api_m1){
				console.info("Map gimmick flag detected", response.api_data.api_m1);
			}
			if(typeof response.api_data.api_destruction_battle !== "undefined"){
				KC3SortieManager.engageLandBaseAirRaid(
					response.api_data.api_destruction_battle
				);
				KC3Network.trigger("LandBaseAirRaid");
				if(response.api_data.api_destruction_battle.api_m2 > 0){ 
					KC3Network.trigger("DebuffNotify", response.api_data.api_destruction_battle);
				}
			}
		},
		
		/* Emergency Anchorage Repair Confirmed
		-------------------------------------------------------*/
		"api_req_map/anchorage_repair":function(params, response, headers){
			const usedShipMstId = response.api_data.api_used_ship,
				usedShipMst = KC3Master.ship(usedShipMstId),
				updatedShips = response.api_data.api_ship_data;
			console.log("Emergency Anchorage Repair performed by", KC3Meta.shipName(usedShipMst.api_name), updatedShips);
			// Akashi (any form)/Akitsushima Kai in fleet, < Chuuha?
			// Repaired ships < Taiha, gain ceil(30%/25% of max hp) in range of Ship Repair Facilities,
			// Steel should be consumed either, repaired ships also gain 15-20 morale.
			// see https://kancolle.fandom.com/wiki/Emergency_Repair_Material
			// TODO: PlayerManager.lastMaterial[2] -= consumedTotalSteel
			// Consume 1 emergency repair material
			PlayerManager.consumables.emergencyRepair -= 1;
			PlayerManager.setConsumables();
			KC3Network.trigger("Consumables");
			// Since this type repairing supposed to be happened on non-battle node,
			// no `api_get_member/ship_deck` API call beofore next `/next` call,
			// repaired ships data will be updated by result of this call.
			if(Array.isArray(updatedShips)) {
				KC3ShipManager.set(updatedShips);
				KC3Network.trigger("Fleet");
			}
		},
		
		/* NORMAL: BATTLE STARTS
		-------------------------------------------------------*/
		"api_req_sortie/battle":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			response.api_data.api_name = response.api_data.api_name || "battle";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.setBattleEvent(true, "day", response.api_data.api_name);
			KC3Network.trigger("BattleStart");
		},
		"api_req_sortie/airbattle":function(params, response, headers){
			response.api_data.api_name = "airbattle";
			this["api_req_sortie/battle"].apply(this,arguments);
		},
		"api_req_sortie/ld_airbattle":function(params, response, headers){
			response.api_data.api_name = "ld_airbattle";
			this["api_req_sortie/battle"].apply(this,arguments);
		},
		"api_req_sortie/ld_shooting":function(params, response, headers){
			response.api_data.api_name = "ld_shooting";
			this["api_req_sortie/battle"].apply(this,arguments);
		},
		
		/* PLAYER-ONLY COMBINED FLEET: BATTLE STARTS
		-------------------------------------------------------*/
		"api_req_combined_battle/battle":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			response.api_data.api_name = response.api_data.api_name || "fc_battle";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.setBattleEvent(true, "day", response.api_data.api_name);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/airbattle":function(params, response, headers){
			response.api_data.api_name = "fc_airbattle";
			this["api_req_combined_battle/battle"].apply(this,arguments);
		},
		"api_req_combined_battle/battle_water":function(params, response, headers){
			response.api_data.api_name = "fc_battle_water";
			this["api_req_combined_battle/battle"].apply(this,arguments);
		},
		"api_req_combined_battle/ld_airbattle":function(params, response, headers){
			response.api_data.api_name = "fc_ld_airbattle";
			this["api_req_combined_battle/battle"].apply(this,arguments);
		},
		"api_req_combined_battle/ld_shooting":function(params, response, headers){
			response.api_data.api_name = "fc_ld_shooting";
			this["api_req_combined_battle/battle"].apply(this,arguments);
		},
		
		/* NIGHT BATTLES to DAY BATTLES
		-------------------------------------------------------*/
		"api_req_sortie/night_to_day":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			response.api_data.api_name = response.api_data.api_name || "night_to_day";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.setBattleEvent(true, "dawn", response.api_data.api_name);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/ec_night_to_day":function(params, response, headers){
			response.api_data.api_name = "ec_night_to_day";
			this["api_req_sortie/night_to_day"].apply(this,arguments);
		},
		
		/* BATTLE STARTS as NIGHT
		-------------------------------------------------------*/
		"api_req_battle_midnight/sp_midnight":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			response.api_data.api_name = response.api_data.api_name || "sp_midnight";
			KC3SortieManager.engageBattleNight(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.setBattleEvent(true, "night", response.api_data.api_name);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/sp_midnight":function(params, response, headers){
			response.api_data.api_name = "fc_sp_midnight";
			this["api_req_battle_midnight/sp_midnight"].apply(this,arguments);
		},
		"api_req_combined_battle/each_sp_midnight":function(params, response, headers){
			response.api_data.api_name = "each_sp_midnight";
			this["api_req_battle_midnight/sp_midnight"].apply(this,arguments);
		},
		
		/* NIGHT BATTLES as SECOND PART
		-------------------------------------------------------*/
		"api_req_battle_midnight/battle":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			response.api_data.api_name = response.api_data.api_name || "midnight_battle";
			KC3SortieManager.engageNight( response.api_data );
			KC3Network.setBattleEvent(true, "night", response.api_data.api_name);
			KC3Network.trigger("BattleNight");
		},
		"api_req_combined_battle/midnight_battle":function(params, response, headers){
			response.api_data.api_name = "fc_midnight_battle";
			this["api_req_battle_midnight/battle"].apply(this,arguments);
		},
		
		/* ENEMY COMBINED FLEET
		-------------------------------------------------------*/
		"api_req_combined_battle/ec_battle":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			response.api_data.api_name = "ec_battle";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.setBattleEvent(true, "day", response.api_data.api_name);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/ec_midnight_battle":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			response.api_data.api_name = "ec_midnight_battle";
			KC3SortieManager.engageNight(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.setBattleEvent(true, "night", response.api_data.api_name);
			KC3Network.trigger("BattleNight");
		},
		
		/* BOTH COMBINED FLEET
		-------------------------------------------------------*/
		"api_req_combined_battle/each_battle":function(params, response, headers){
			KC3SortieManager.setSlotitemConsumed(undefined, params);
			response.api_data.api_name = response.api_data.api_name || "each_battle";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.setBattleEvent(true, "day", response.api_data.api_name);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/each_airbattle":function(params, response, headers){
			response.api_data.api_name = "each_airbattle";
			this["api_req_combined_battle/each_battle"].apply(this,arguments);
		},
		"api_req_combined_battle/each_battle_water":function(params, response, headers){
			response.api_data.api_name = "each_battle_water";
			this["api_req_combined_battle/each_battle"].apply(this,arguments);
		},
		"api_req_combined_battle/each_ld_airbattle":function(params, response, headers){
			response.api_data.api_name = "each_ld_airbattle";
			this["api_req_combined_battle/each_battle"].apply(this,arguments);
		},
		"api_req_combined_battle/each_ld_shooting":function(params, response, headers){
			// not really existed yet for both side combined fleet in-game
			response.api_data.api_name = "each_ld_shooting";
			this["api_req_combined_battle/each_battle"].apply(this,arguments);
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
			KC3Network.setBattleEvent(false, "result", "battleresult");
			KC3Network.trigger("Fleet");
			KC3Network.trigger("BattleResult", response.api_data);
			KC3Network.trigger("Quests");
			
			KC3Network.delay(1,"Fleet","GearSlots");
			if(response.api_data.api_m2 > 0) {
				KC3Network.trigger("DebuffNotify", response.api_data);
			}
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
			KC3Network.setBattleEvent(false, "result", "cf_battleresult");
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
		"api_req_sortie/goback_port":function(params, response, headers){
			this["api_req_combined_battle/goback_port"].apply(this,arguments);
		},
		
		/*-------------------------------------------------------*/
		/*-----------------------[ LBAS ]------------------------*/
		/*-------------------------------------------------------*/
		
		/* Get bases info. deprecated by devs, see `mapinfo`.
		-------------------------------------------------------*/
		"api_get_member/base_air_corps":function(params, response, headers){
			PlayerManager.setBases(response.api_data);
			KC3Network.trigger("Lbas");
		},
		
		/* Expand air base on construction corps used
		-------------------------------------------------------*/
		"api_req_air_corps/expand_base":function(params, response, headers){
			// only 1 land base data in api data, can not call setBases directly,
			// have to merge it into existed land bases:
			var rawBase = response.api_data[0],
				bases = PlayerManager.bases,
				worldFirstBase = bases.map(b => b.map).indexOf(rawBase.api_area_id);
			// assume 1st base of expanded world always existed
			if(worldFirstBase > -1){
				var pos = worldFirstBase + rawBase.api_rid - 1,
					base = new KC3LandBase(rawBase);
				// replace expanded base position if it is unused
				if(bases[pos] && bases[pos].rid === -1){
					bases[pos] = base;
				} else {
					// it is used, insert before the position
					bases.splice(pos, 0, base);
					var count = bases.length;
					// delete last one if it is unused and more than 4 bases
					if(count > 4 && bases[count - 1].rid === -1){
						bases.splice(count - 1, 1);
					}
				}
				PlayerManager.saveBases();
				KC3Network.trigger("Lbas");
			}
		},
		
		/* Change base name
		-------------------------------------------------------*/
		"api_req_air_corps/change_name":function(params, response, headers){
			$.each(PlayerManager.bases, function(i, base){
				if(base.map == params.api_area_id && base.rid == params.api_base_id){
					base.name = decodeURIComponent(params.api_name);
				}
			});
			PlayerManager.saveBases();
			KC3Network.trigger("Lbas");
		},
		
		/* Set base action
		-------------------------------------------------------*/
		"api_req_air_corps/set_action":function(params, response, headers){
			$.each(PlayerManager.bases, function(i, base){
				if(base.map == params.api_area_id){
					$.each(params.api_base_id.split("%2C"), function(j, baseId){
						if(base.rid == baseId){
							base.action = parseInt(params.api_action_kind.split("%2C")[j], 10);
						}
					});
				}
			});
			PlayerManager.saveBases();
			KC3Network.trigger("Lbas");
		},
		
		/* Get bases info
		-------------------------------------------------------*/
		"api_req_air_corps/set_plane":function(params, response, headers){
			$.each(PlayerManager.bases, function(i, base){
				if(base.map == params.api_area_id && base.rid == params.api_base_id){
					const distance = response.api_data.api_distance;
					if(typeof distance === "object"){
						base.rangeBase = distance.api_base;
						base.rangeBonus = distance.api_bonus;
						base.range = base.rangeBase + base.rangeBonus;
					} else {
						base.range = distance;
					}
					/* not work for swapping planes by drag and drop
					$.each(params.api_squadron_id.split("%2C"), function(j, sid){
						base.planes[sid-1] = response.api_data.api_plane_info[j];
					});
					*/
					$.each(response.api_data.api_plane_info, function(_, p){
						base.planes[p.api_squadron_id-1] = p;
					});
				}
			});
			PlayerManager.saveBases();
			// Record material consuming. Yes, set plane use your bauxite :)
			// Known formula:
			//var landSlot = api_plane_info.api_max_count;
			//    or KC3GearManager.landBaseReconnType2Ids.indexOf(planeMaster.api_type[2])>-1 ?
			//       KC3GearManager.landBaseReconnMaxSlot : KC3GearManager.landBaseOtherMaxSlot;
			//var deployBauxiteCost = planeMaster.api_cost * landSlot;
			// But we use player bauxite - after bauxite for two reasons:
			// not need to compute multi-plane set,
			// not need to handle swap two slots with no cost.
			if(typeof response.api_data.api_after_bauxite !== "undefined"){
				var utcHour = Date.toUTChours(headers.Date);
				var consumedBauxite = PlayerManager.hq.lastMaterial[3] - response.api_data.api_after_bauxite;
				KC3Database.Naverall({
					hour: utcHour,
					type: "lbas" + (params.api_area_id || "0"),
					data: [0,0,0,-consumedBauxite].concat([0,0,0,0])
				});
				PlayerManager.setResources(utcHour * 3600, null, [0,0,0,-consumedBauxite]);
				KC3Network.trigger("Consumables");
			}
			KC3Network.trigger("Lbas");
		},
		
		/* Supply base squadrons
		-------------------------------------------------------*/
		"api_req_air_corps/supply":function(params, response, headers){
			$.each(PlayerManager.bases, function(i, base){
				if(base.map == params.api_area_id && base.rid == params.api_base_id){
					$.each(params.api_squadron_id.split("%2C"), function(j, sid){
						base.planes[sid-1] = response.api_data.api_plane_info[j];
					});
				}
			});
			PlayerManager.saveBases();
			// Record material consuming, using a new type called: lbas
			var utcHour = Date.toUTChours(headers.Date);
			var consumedFuel = PlayerManager.hq.lastMaterial[0] - response.api_data.api_after_fuel,
				consumedBauxite = PlayerManager.hq.lastMaterial[3] - response.api_data.api_after_bauxite;
			KC3Database.Naverall({
				hour: utcHour,
				type: "lbas" + (params.api_area_id || "0"),
				data: [-consumedFuel,0,0,-consumedBauxite].concat([0,0,0,0])
			});
			PlayerManager.setResources(utcHour * 3600, null, [-consumedFuel,0,0,-consumedBauxite]);
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Lbas");
		},
		
		
		/*-------------------------------------------------------*/
		/*----------------------[ QUESTS ]-----------------------*/
		/*-------------------------------------------------------*/
		
		/* Quest List
		-------------------------------------------------------*/
		"api_get_member/questlist":function(params, response, headers){
			KC3QuestManager.load();
			
			// API changed since 2020-03-27, `api_disp_page` removed, all items will be returned based on `api_tab_id`
			// Update quest data for ~this page~ this type of peroid tab
			KC3QuestManager.definePage(
				response.api_data.api_list,
				response.api_data.api_disp_page,
				Number(params.api_tab_id)
			);
			
			// Tell service to pass a message to gamescreen on inspected window to show overlays
			KC3Network.hasOverlay = true;
			(new RMsg("service", "questOverlay", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				questlist: response.api_data.api_list
			})).execute();
			
			// Trigger quest listeners
			KC3Network.trigger("QuestList", response.api_data.api_list);
			KC3Network.trigger("Quests");
		},
		
		"api_req_quest/clearitemget":function(params, response, headers){
			var utcHour  = Date.toUTChours(headers.Date),
				quest    = Number(params.api_quest_id),
				data     = response.api_data,
				material = data.api_material,
				consume  = [0,0,0,0],
				bonuses  = data.api_bounus || [];
			console.log("Quest clear", quest, data);
			
			// Force to mark quest as complete
			KC3QuestManager.get(quest).toggleCompletion(true);
			KC3QuestManager.isOpen( quest, false );
			KC3QuestManager.isActive( quest, false );
			KC3QuestManager.save();
			
			// Compute bonuses for ledger
			bonuses.forEach(function(x){
				if(x.api_type == 1 && x.api_item.api_id >= 5 && x.api_item.api_id <= 8) {
					consume[x.api_item.api_id - 5] += x.api_count;
				}
			});
			material = material.concat(consume);
			KC3Database.Naverall({
				hour: utcHour,
				type: "quest"+quest,
				data: material
			});
			console.log("Quest gained", quest, material);
			
			var deferEventApiCount = 0;
			bonuses.forEach(bonus => {
				const bonusType = bonus.api_type;
				// Known types: 1=Consumable, 2=Unlock a fleet, 3=Furniture box, 4=LSC unlock,
				//   5=LBAS unlock, 6=Exped resupply unlock, 11=Ship, 12=Slotitem, 13=Useitem,
				//   14=Furniture, 15=Equipment conversion, 16=Equipment consumption, 18=Rank points
				if(bonusType === 11){
					const shipId = (bonus.api_item || {}).api_ship_id;
					console.log("Quest gained ship", quest, shipId, bonus);
					// Ships changed, but effective data will not be received until
					// following `api_get_member/ship2` call, so here no need to call:
					/*
					KC3ShipManager.pendingShipNum += count;
					KC3GearManager.pendingGearNum += KC3Meta.defaultEquip(shipId);
					KC3Network.trigger("ShipSlots");
					KC3Network.trigger("GearSlots");
					*/
					deferEventApiCount = 4;
				}
				if([12, 15, 16].includes(bonusType)){
					console.log("Quest gained equipment", quest, bonus);
					// Gears changed, but effective data will not be received until
					// following `api_get_member/slot_item` call.
					deferEventApiCount = 2;
					// For type 16, like quest F36 (61cm Quintuple -> P61cm Sextuple),
					// seems it will replace equipped slot with Sextuple master ID, reusing Quintuple item ID,
					// but no `api_get_member/ship2` call followed,
					// to correct secretary's current equipment, should remove consumed item here.
					// But issue duration will not be long since will be auto fixed on home port.
				}
			});
			if(deferEventApiCount > 0){
				KC3Network.deferTrigger(deferEventApiCount, "GearSlots");
				KC3Network.deferTrigger(deferEventApiCount, "Consumables");
			}
			
			PlayerManager.setResources(utcHour * 3600, null, material.slice(0,4));
			PlayerManager.setConsumables(utcHour * 3600, null, consume);
			KC3Network.trigger("Quests");
			KC3Network.trigger("Consumables");
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
			var utcSeconds = Date.toUTCseconds(headers.Date),
				shipId     = parseInt(params.api_ship_id, 10),
				bucket     = parseInt(params.api_highspeed, 10),
				dockNum    = parseInt(params.api_ndock_id, 10),
				shipData   = KC3ShipManager.get(shipId);
			
			PlayerManager.setResources(utcSeconds, null, [-shipData.repair[1], 0, -shipData.repair[2], 0]);
			if(bucket == 1){
				PlayerManager.consumables.buckets -= 1;
				PlayerManager.setConsumables();
				
				// If ship is still is the list being repaired, mark her repaired
				var herRepairIndex = PlayerManager.repairShips.indexOf(shipId);
				if(herRepairIndex > -1) PlayerManager.repairShips[herRepairIndex] = -1;
				PlayerManager.repairShips[dockNum] = -1;
				
				KC3Database.Naverall({
					data:[0,0,0,0,0,-1,0,0]
				},shipData.lastSortie[0]);
				
				shipData.applyRepair();
				KC3TimerManager.repair(dockNum).deactivate();
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
			PlayerManager.consumables.buckets -= 1;
			PlayerManager.setConsumables();
			
			// If ship is still is the list being repaired, mark her repaired
			var dockNum  = parseInt(params.api_ndock_id, 10),
				shipId   = PlayerManager.repairShips[dockNum],
				shipData = KC3ShipManager.get(shipId);
			PlayerManager.repairShips[dockNum] = -1;
			if(shipData.exists()){
				KC3Database.Naverall({
					data:[0,0,0,0,0,-1,0,0]
				},shipData.lastSortie[0]);
				shipData.perform('repair');
				shipData.applyRepair();
				KC3ShipManager.save();
			}
			
			KC3TimerManager.repair(dockNum).deactivate();
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
			KC3Network.trigger("PvPList", response.api_data);
		},
		
		"api_req_practice/change_matching_kind":function(params, response, headers){
			var selectedKind = parseInt(params.api_selected_kind, 10);
		},
		
		/* PVP Fleet List
		-------------------------------------------------------*/
		"api_req_member/get_practice_enemyinfo":function(params, response, headers){
			var data    = response.api_data,
				enemyId = parseInt(params.api_member_id,10);
			KC3Network.trigger("PvPFleet", data);
		},
		
		/* PVP Start
		-------------------------------------------------------*/
		"api_req_practice/battle":function(params, response, headers){
			var fleetNum = parseInt(params.api_deck_id, 10);
			var utcSeconds = Date.toUTCseconds(headers.Date);
			// Simulate PvP battle as special sortie
			KC3SortieManager.sortieTime = utcSeconds;
			KC3SortieManager.fleetSent  = fleetNum;
			KC3SortieManager.onSortie   = false;
			KC3SortieManager.map_world  = -1;
			KC3SortieManager.map_num    = 0;
			KC3SortieManager.onPvP      = true;
			KC3SortieManager.slotitemConsumed = false;
			KC3SortieManager.clearNodes();
			KC3SortieManager.snapshotFleetState();
			// Create a battle node for the PvP battle
			var pvpNode = (new KC3Node(0, 0, utcSeconds * 1000)).defineAsBattle();
			pvpNode.isPvP = true;
			pvpNode.letter = "PvP";
			KC3SortieManager.appendNode(pvpNode);
			KC3SortieManager.engageBattle(response.api_data);
			KC3Network.setBattleEvent(true, "day", "p_battle");
			KC3Network.trigger("PvPStart", {
				battle: response.api_data,
				fleetSent: params.api_deck_id
			});
			if(fleetNum > 0){
				KC3Network.trigger("Fleet", { switchTo: fleetNum });
			} else {
				KC3Network.trigger("Fleet");
			}
		},
		
		/* PVP Start
		-------------------------------------------------------*/
		"api_req_practice/midnight_battle":function(params, response, headers){
			KC3SortieManager.engageNight(response.api_data);
			KC3Network.setBattleEvent(true, "night", "p_midnight_battle");
			KC3Network.trigger("PvPNight", { battle: response.api_data });
		},
		
		/* PVP Result
		-------------------------------------------------------*/
		"api_req_practice/battle_result":function(params, response, headers){
			resultScreenQuestFulfillment(response.api_data,true);
			KC3SortieManager.resultScreen(response.api_data);
			KC3Network.setBattleEvent(false, "result", "p_battle_result");
			KC3Network.trigger("PvPEnd", { result: response.api_data });
			KC3Network.trigger("Quests");
		},
		
		/*-------------------------------------------------------*/
		/*--------------------[ EXPEDITION ]---------------------*/
		/*-------------------------------------------------------*/

		/* Expedition Selection Screen
		  -------------------------------------------------------*/
		"api_get_member/mission":function(params, response, headers) {
			if(Array.isArray(response.api_data.api_limit_time)) {
				// Actual Monthly Expedition reset time in seconds,
				// might be more in this array for other time periods?
				PlayerManager.hq.monthlyExpedResetTime = response.api_data.api_limit_time[0] || 0;
				PlayerManager.hq.save();
			}
			KC3Network.trigger("ExpeditionSelection");
		},

		/* Expedition Start
		  -------------------------------------------------------*/
		"api_req_mission/start":function(params, response, headers) {
			KC3Network.trigger("ExpeditionStart");
		},
		
		/* Complete Expedition
		-------------------------------------------------------*/
		"api_req_mission/result":function(params, response, headers){
			var utcHour  = Date.toUTChours(headers.Date),
				deck     = parseInt(params.api_deck_id, 10),
				timerRef = KC3TimerManager._exped[ deck-2 ],
				shipList = PlayerManager.fleets[deck - 1].ships.slice(0),
				expedNum = parseInt(timerRef.expedNum, 10);
			
			KC3Network.trigger("ExpedResult",{
				expedNum:expedNum,
				params:params,
				response:response.api_data
			});
			
			console.log("Fleet #" + deck + " has returned from Expedition #", expedNum, "with result", response.api_data);
			
			shipList.forEach(function(rosterId){
				var shipData = KC3ShipManager.get(rosterId);
				if(shipData.exists()) {
					shipData.getDefer()[1].reject();
					shipData.getDefer()[2].reject();
					shipData.pendingConsumption.costnull=[[
						-shipData.fuel,
						-shipData.ammo,
						-shipData.slots.reduce(function(x,y){return x+y;})
					],[0,0,0]];
					//console.debug("Offering a preparation of async to", rosterId, shipData.name());
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
							console.log("Consumption for Exped ship", rosterId, key, kan.pendingConsumption[key]);
							KC3ShipManager.save();
						} else {
							console.log("Ignoring signal for", rosterId, "detected");
						}
					});
				}
			});
			
			if(response.api_data.api_clear_result > 0){
					KC3QuestManager.get(402).increment(); // D2: Daily Expeditions 1
					KC3QuestManager.get(403).increment(); // D3: Daily Expeditions 2
					KC3QuestManager.get(404).increment(); // D4: Weekly Expeditions
					
					switch(Number(expedNum)){
					case 1:
						KC3QuestManager.get(436).increment(0); // D33: Yearly, index 0
						break;
					case 2:
						KC3QuestManager.get(436).increment(1); // D33: Yearly, index 1
						break;
					case 3:
						KC3QuestManager.get(426).increment(0); // D24: Quarterly, index 0
						KC3QuestManager.get(434).increment(0); // D32: Yearly, index 0
						KC3QuestManager.get(436).increment(2); // D33: Yearly, index 2
						break;
					case 4:
						KC3QuestManager.get(426).increment(1); // D24: Quarterly, index 1
						KC3QuestManager.get(428).increment(0); // D26: Quarterly, index 0
						KC3QuestManager.get(436).increment(3); // D33: Yearly, index 3
						KC3QuestManager.get(437).increment(0); // D34: Yearly, index 0
						break;
					case 5:
						KC3QuestManager.get(424).increment();  // D22: Monthly Expeditions
						KC3QuestManager.get(426).increment(2); // D24: Quarterly, index 2
						KC3QuestManager.get(434).increment(1); // D32: Yearly, index 1
						break;
					case 9:
						KC3QuestManager.get(434).increment(4); // D32: Yearly, index 4
						break;
					case 10:
						KC3QuestManager.get(426).increment(3); // D24: Quarterly, index 3
						KC3QuestManager.get(436).increment(4); // D33: Yearly, index 4
						break;
					case 37:
					case 38:
						KC3QuestManager.get(410).increment(); // D9: Weekly Expedition 2
						KC3QuestManager.get(411).increment(); // D11: Weekly Expedition 3
						break;
					case 100: // A1
						KC3QuestManager.get(434).increment(2); // D32: Yearly, index 2
						break;
					case 101: // A2
						KC3QuestManager.get(428).increment(1); // D26: Quarterly, index 1
						KC3QuestManager.get(434).increment(3); // D32: Yearly, index 3
						break;
					case 102: // A3
						KC3QuestManager.get(428).increment(2); // D26: Quarterly, index 2
						break;
					case 104: // A5
						KC3QuestManager.get(437).increment(1); // D34: Yearly, index 1
						break;
					case 105: // A6
						KC3QuestManager.get(437).increment(2); // D34: Yearly, index 2
						break;
					case 110: // B1
						KC3QuestManager.get(437).increment(3); // D34: Yearly, index 3
						break;
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
						csmap = [0,2,1,3,0,0],
						uniqId = "exped" + dbId;
					
					// Record expedition gain
					/*
					 1:"bucket", => 5
					 2:"ibuild", => 4
					 3:"devmat", => 6
					 4:"screws", => 7
					*/
					response.api_data.api_useitem_flag.forEach(function(x,i){
						var useMap = csmap[x],
							useItm = response.api_data["api_get_item"+(i+1)];
						// count for buckets, torches, devmats
						if(!!useMap && !!useItm) {
							csm[useMap - 1] += useItm.api_useitem_count;
						}
						// count for screws
						if(x == 4 && !!useItm && useItm.api_useitem_id == 4) {
							csm[3] += useItm.api_useitem_count;
						}
					});
					
					rsc = rsc.concat(csm);
					
					KC3Database.Naverall({
						hour: utcHour,
						type: uniqId,
						data: rsc
					},null,true);
					
					shipList.forEach(function(rosterId,shipIndex){
						var
							shipData = KC3ShipManager.get(rosterId),
							pendCond = shipData.pendingConsumption,
							dataInd  = Object.keys(pendCond).indexOf('costnull'),
							consDat  = [shipData.fuel,shipData.ammo,shipData.slots.reduce(function(x,y){return x+y;})];
						if(shipData.exists()) {
							// if there's a change in ship supply
							console.debug("Pending consumption for Exped ship", rosterId, dataInd, pendCond.costnull, consDat);
							if(dataInd >= 0) {
								shipData.getDefer()[1].resolve(dbId);
							}
						}
					});
					
					KC3ShipManager.save();
					
					console.log("Exped materials gained", expedNum, rsc);
					PlayerManager.setResources(utcHour * 3600, null, rsc.slice(0,4));
					PlayerManager.setConsumables(utcHour * 3600, null, csm);
					KC3Network.trigger("Consumables");
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
		"api_req_kousyou/createitem":function(params, response, headers, decodedParams){
			const // resources used per item
				resourceUsed = [decodedParams.api_item1, decodedParams.api_item2,
					decodedParams.api_item3, decodedParams.api_item4]
					.map(v => parseInt(v, 10)),
				// will be 1 if multiple crafting (3 times in a row currently) is enabled
				multiFlag    = parseInt(decodedParams.api_multiple_flag, 10) > 0,
				// total flag, will be 1 if any craft gets successful item
				failedFlag   = !response.api_data.api_create_flag,
				itemsCreated = response.api_data.api_get_items,
				materials    = response.api_data.api_material,
				utcSeconds   = Date.toUTCseconds(headers.Date),
				utcHour      = Date.toUTChours(headers.Date);
			var lastSuccessRosterId = null, lastSuccessMasterId = null;
			const devmatsBefore = PlayerManager.consumables.devmats;
			const devmatsAfter = (materials && materials[6]) || devmatsBefore;
			
			if(Array.isArray(itemsCreated)) {
				itemsCreated.forEach(item => {
					const success = item && item.api_slotitem_id > 0;
					
					// Log into development History
					KC3Database.Develop({
						flag: PlayerManager.fleets[0].ship(0).masterId,
						rsc1: resourceUsed[0],
						rsc2: resourceUsed[1],
						rsc3: resourceUsed[2],
						rsc4: resourceUsed[3],
						result: success ? item.api_slotitem_id : -1,
						time: utcSeconds
					});
					
					KC3Database.Naverall({
						hour: utcHour,
						type: "critem",
						data: resourceUsed.concat([0,0,success,0]).map(v => -v)
					});
					
					KC3QuestManager.get(605).increment(); // F1: Daily Development 1
					KC3QuestManager.get(607).increment(); // F3: Daily Development 2
					
					// Checks if the single development went great
					if(success) {
						// Add new equipment to local data
						KC3GearManager.set([{
							api_id: item.api_id,
							api_level: 0,
							api_locked: 0,
							api_slotitem_id: item.api_slotitem_id
						}]);
						// Remember last successful item for compatibility
						lastSuccessRosterId = item.api_id;
						lastSuccessMasterId = item.api_slotitem_id;
					}
				});
			}
			
			if(Array.isArray(materials)) {
				PlayerManager.setResources(utcSeconds, materials.slice(0,4));
				PlayerManager.consumables.devmats = devmatsAfter;
				PlayerManager.setConsumables();
			}
			
			// Trigger panel activity event according result(s)
			KC3Network.trigger("CraftGear", {
				// Keep old properties for compatibility of other panel themes
				itemId: lastSuccessRosterId,
				itemMasterId: lastSuccessMasterId,
				failedFlag: failedFlag,
				multiFlag: multiFlag,
				items: itemsCreated,
				devmats: [devmatsBefore, devmatsAfter],
				resourceUsed: resourceUsed
			});
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Quests");
		},
		
		/* Scrap a Ship
		-------------------------------------------------------*/
		"api_req_kousyou/destroyship":function(params, response, headers){
			var shipIds = params.api_ship_id,
				scrapGearFlag = params.api_slot_dest_flag == 1,
				utcHour = Date.toUTChours(headers.Date);
			var scrapOneShip = function(rosterId) {
				var rsc   = [0,0,0,0,0,0,0,0],
					ship  = KC3ShipManager.get(rosterId),
					scrap = [];
				if(ship.isDummy()){
					console.warn("There is no data in ShipManager, your localStorage.ships may not get synced for ships", rosterId);
					return;
				}
				// Base ship scrap value
				scrap.push(ship.master());
				if(scrapGearFlag){
					// Collect equipment scrap value if needed
					scrap = scrap.concat(
						((ship.items).concat(ship.ex_item)).map(function(gearId){
							return KC3GearManager.get(gearId).master();
						}).filter(function(gearMaster){
							return gearMaster;
						})
					);
				}
				// Sum everything
				scrap.forEach(function(scrapData){
					console.log("Scrapping", scrapData.api_id, scrapData.api_name, scrapData.api_broken);
					scrapData.api_broken.forEach(function(val,ind){
						rsc[ind] += val;
					});
				});
				KC3Database.Naverall({
					hour: utcHour,
					type: "dsship" + ship.masterId,
					data: rsc
				});
				KC3ShipManager.remove(rosterId, !scrapGearFlag);
				// F5: Daily Dismantlement
				KC3QuestManager.get(609).increment();
				PlayerManager.setResources(utcHour * 3600, null, rsc.slice(0,4));
			};
			// Now in-game allow to scrap more ships in a row since 2017-12-11
			$.each(shipIds.split("%2C"), function(index, shipId){
				scrapOneShip(parseInt(shipId, 10));
			});
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Fleet");
			KC3Network.trigger("Quests");
		},
		
		/* Scrap a Gear
		-------------------------------------------------------*/
		"api_req_kousyou/destroyitem2":function(params, response, headers){
			var rsc     = [0,0,0,0,0,0,0,0],
				itemIds = params.api_slotitem_ids,
				utcHour = Date.toUTChours(headers.Date);
			$.each(itemIds.split("%2C"), function(index, itemId){
				var gearMaster = KC3GearManager.get(itemId).master();
				if(!gearMaster){
					console.warn("There is no data in GearManager, your localStorage.gears may not get synced for item", itemId);
				} else {
					console.log("Scrapping", itemId, gearMaster.api_id, gearMaster.api_name, gearMaster.api_broken);
					gearMaster.api_broken.forEach(function(x,i){
						rsc[i] += x;
					});
					// To track scrapping quests
					switch(gearMaster.api_type[2]){
						case 1: // Small Caliber Main Gun
							KC3QuestManager.get(673).increment(); // F65 daily
							break;
						case 2: // Medium Caliber Main Gun
							KC3QuestManager.get(676).increment(0); // F68 weekly index 0
							break;
						case 3: // Large Caliber Main Gun
							KC3QuestManager.get(663).increment(); // F55 quarterly
							KC3QuestManager.get(677).increment(0); // F69 weekly index 0
							break;
						case 4: // Secondary Gun
							KC3QuestManager.get(676).increment(1); // F68 weekly index 1
							break;
						case 5: // Torpedo
						case 32: // Submarine Torpedo
							KC3QuestManager.get(677).increment(2); // F69 weekly index 2
							break;
						case 6: // Fighter
							KC3QuestManager.get(675).increment(0); // F67 quarterly index 0
							KC3QuestManager.get(688).increment(0); // F79 quarterly index 0
							break;
						case 7: // Dive Bomber
							KC3QuestManager.get(688).increment(1); // F79 quarterly index 1
							break;
						case 8: // Torpedo Bomber
							KC3QuestManager.get(688).increment(2); // F79 quarterly index 2
							break;
						case 10: // Recon Seaplane
							KC3QuestManager.get(677).increment(1); // F69 weekly index 1
							KC3QuestManager.get(688).increment(3); // F79 quarterly index 3
							break;
						case 12: // Small Radar
						case 13: // Large Radar
							KC3QuestManager.get(680).increment(1); // F72 quarterly index 1
							break;
						case 21: // Anti-Air Machine Gun
							KC3QuestManager.get(638).increment(); // F34 weekly
							KC3QuestManager.get(674).increment(); // F66 daily
							KC3QuestManager.get(675).increment(1); // F67 quarterly index 1
							KC3QuestManager.get(680).increment(0); // F72 quarterly index 0
							break;
						case 30: // Supply Container
							KC3QuestManager.get(676).increment(2); // F68 weekly index 2
							break;
					}
					switch(gearMaster.api_id){
						case 3: // 10cm Twin High-angle Gun Mount
							KC3QuestManager.get(686).increment(0); // F77 quarterly index 0
							break;
						case 4: // 14cm Single Gun Mount
							KC3QuestManager.get(653).increment(); // F90 quarterly
							break;
						case 19: // Type 96 Fighter
							KC3QuestManager.get(626).increment(1); // F22 monthly index 1
							KC3QuestManager.get(678).increment(0); // F70 quarterly index 0
							break;
						case 20: // Type 0 Fighter Model 21
							KC3QuestManager.get(626).increment(0); // F22 monthly index 0
							KC3QuestManager.get(643).increment(); // F39 quarterly
							KC3QuestManager.get(678).increment(1); // F70 quarterly index 1
							break;
						case 21: // Type 0 Fighter Model 52
							KC3QuestManager.get(628).increment(); // F25 monthly
							break;
						case 121: // Type 94 Anti-Aircraft Fire Director
							KC3QuestManager.get(686).increment(1); // F77 quarterly index 1
							break;
					}
				}
				KC3GearManager.remove(itemId);
			});
			KC3GearManager.save();
			KC3Database.Naverall({
				hour: utcHour,
				type: "dsitem",
				data: rsc
			});
			// F12: Weekly Dismantlement
			KC3QuestManager.get(613).increment();
			PlayerManager.setResources(utcHour * 3600, null, rsc.slice(0,4));
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Quests");
		},
		
		/*-------------------------------------------------------*/
		/*----------------------[ OTHERS ]-----------------------*/
		/*-------------------------------------------------------*/
		
		/* View World Maps
		-------------------------------------------------------*/
		"api_get_member/mapinfo":function(params, response, headers){
			// fix bugged falsy 'null' value
			if(localStorage.maps === "null"){ delete localStorage.maps; }
			
			const raws = response.api_data.api_map_info;
			const maps = KC3SortieManager.getAllMapData();
			
			// Prepare event despair stat ^w^)!
			const etcStat = {};
			const defStat = {
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
			
			// Exclude gauge based maps from being kept every time
			const mapKeys = Object.keys(maps);
			for(const key of mapKeys) {
				if(KC3Meta.gauge(key.substr(1)))
					maps[key].clear = maps[key].kills = false;
			}
			
			// Combine current storage and current available maps data
			for(const idx in raws) {
				const thisMap = raws[idx];
				const key = "m" + thisMap.api_id;
				const oldMap = maps[key] || {};
				
				if(oldMap.curhp !== undefined || oldMap.kind === "gauge-hp")
					etcStat[key] = $.extend(true, {}, defStat, maps[key].stat);
				
				// Create map object
				const localMap = {
					id: thisMap.api_id,
					clear: thisMap.api_cleared,
					kind: "single"
				};
				
				// Check for boss gauge of kills
				if(thisMap.api_gauge_type === 1 || thisMap.api_defeat_count !== undefined) {
					localMap.kind = "multiple";
					if(thisMap.api_defeat_count !== undefined) {
						localMap.kills = thisMap.api_defeat_count;
						if(thisMap.api_required_defeat_count !== undefined) {
							localMap.killsRequired = thisMap.api_required_defeat_count;
						}
					} else {
						localMap.kills = false;
						// to indicate in-game gauge disappeared after cleared
						delete localMap.killsRequired;
					}
					// since 2018-11-16 map 7-2
					if(thisMap.api_gauge_num !== undefined) {
						localMap.gaugeNum = thisMap.api_gauge_num;
					}
				}
				// Max Land-bases allowed to be sortied
				if(thisMap.api_air_base_decks !== undefined) {
					localMap.airBase = thisMap.api_air_base_decks;
				}
				
				// Check for event map info
				if(thisMap.api_eventmap !== undefined) {
					const eventData = thisMap.api_eventmap;
					// still remember values post-clear even removed from api since Winter 2019
					if(eventData.api_max_maphp === undefined && eventData.api_state > 1) {
						localMap.curhp = oldMap.curhp;
						localMap.maxhp = oldMap.maxhp;
					} else {
						localMap.curhp = eventData.api_now_maphp;
						localMap.maxhp = eventData.api_max_maphp;
					}
					localMap.difficulty = eventData.api_selected_rank;
					// moved to parent node as normal maps since Winter 2019
					localMap.gaugeType  = eventData.api_gauge_type || thisMap.api_gauge_type || 0;
					// added since Winter 2018
					localMap.gaugeNum   = eventData.api_gauge_num || thisMap.api_gauge_num || 1;
					
					switch(localMap.gaugeType) {
						case 0:
						case 2:
							localMap.kind = "gauge-hp";
							break;
						case 3:
							localMap.kind = "gauge-tp";
							break;
						default:
							localMap.kind = "gauge-hp";
							console.info("Reported unknown API gauge type", localMap.gaugeType);/*RemoveLogging:skip*/
					}
					
					if(maps[key] !== undefined) {
						if(oldMap.kinds  !== undefined) localMap.kinds = oldMap.kinds;
						if(oldMap.maxhps !== undefined) localMap.maxhps = oldMap.maxhps;
						if(oldMap.baseHp !== undefined) localMap.baseHp = oldMap.baseHp;
						if(oldMap.debuffFlag  !== undefined) localMap.debuffFlag = oldMap.debuffFlag;
						if(oldMap.debuffSound !== undefined) localMap.debuffSound = oldMap.debuffSound;
						// Real different gauge detected
						if(oldMap.gaugeNum !== undefined && oldMap.gaugeNum !== localMap.gaugeNum) {
							// Should be a different BOSS and her HP might be different
							delete localMap.baseHp;
							console.info("New gauge phase detected:", oldMap.gaugeNum + " -> " + localMap.gaugeNum);
						}
						// Different gauge type detected
						if(oldMap.gaugeType !== undefined && oldMap.gaugeType !== localMap.gaugeType) {
							localMap.kinds = localMap.kinds || [oldMap.gaugeType];
							localMap.kinds.push(localMap.gaugeType);
							console.info("New gauge type detected:", oldMap.gaugeType + " -> " + localMap.gaugeType);
						}
						// Different max value detected
						if((oldMap.maxhp || 9999) !== 9999 && oldMap.maxhp !== localMap.maxhp) {
							localMap.maxhps = localMap.maxhps || [oldMap.maxhp];
							localMap.maxhps.push(localMap.maxhp);
							console.info("New max HP detected:", oldMap.maxhp + " -> " + localMap.maxhp);
						}
					}
					localMap.stat = $.extend(true, {}, defStat, etcStat[ key ]);
				}
				
				maps[ key ] = localMap;
			}
			
			KC3SortieManager.setAllMapData(maps);
			
			// If LBAS info updated, trigger updating view
			if(PlayerManager.setBasesOnWorldMap(response.api_data)) {
				KC3Network.trigger("Lbas");
			}
		},
		
		/* Ship Modernize
		-------------------------------------------------------*/
		"api_req_kaisou/powerup":function(params, response, headers){
			const consumedShipIds = params.api_id_items.split("%2C");
			// New flag for in-game button: Remodeling (Post unequip) since 2020-01-14
			const scrapGearFlag = params.api_slot_dest_flag == 1;
			const consumedShips = consumedShipIds.map(id => KC3ShipManager.get(id));
			
			// To trigger panel activity notification, and TsunDB data submission
			const NewShipRaw = response.api_data.api_ship;
			const OldShipObj = KC3ShipManager.get( NewShipRaw.api_id );
			const MasterShip = KC3Master.ship( NewShipRaw.api_ship_id );
			const newShipMod = NewShipRaw.api_kyouka;
			
			KC3Network.trigger("Modernize", {
				rosterId: response.api_data.api_ship.api_id,
				oldStats: [
					MasterShip.api_houg[0] + OldShipObj.mod[0],
					MasterShip.api_raig[0] + OldShipObj.mod[1],
					MasterShip.api_tyku[0] + OldShipObj.mod[2],
					MasterShip.api_souk[0] + OldShipObj.mod[3],
					MasterShip.api_luck[0] + OldShipObj.mod[4],
					OldShipObj.hp[1],
					OldShipObj.nakedAsw()
				],
				increase: [
					newShipMod[0] - OldShipObj.mod[0],
					newShipMod[1] - OldShipObj.mod[1],
					newShipMod[2] - OldShipObj.mod[2],
					newShipMod[3] - OldShipObj.mod[3],
					newShipMod[4] - OldShipObj.mod[4],
					newShipMod[5] - OldShipObj.mod[5],
					newShipMod[6] - OldShipObj.mod[6]
				],
				left: [
					MasterShip.api_houg[1] - (MasterShip.api_houg[0] + newShipMod[0]),
					MasterShip.api_raig[1] - (MasterShip.api_raig[0] + newShipMod[1]),
					MasterShip.api_tyku[1] - (MasterShip.api_tyku[0] + newShipMod[2]),
					MasterShip.api_souk[1] - (MasterShip.api_souk[0] + newShipMod[3]),
					MasterShip.api_luck[1] - (MasterShip.api_luck[0] + newShipMod[4]),
					OldShipObj.maxHp(true) - (OldShipObj.hp[1] - OldShipObj.mod[5] + newShipMod[5]),
					OldShipObj.maxAswMod() - (OldShipObj.nakedAsw() - OldShipObj.mod[6] + newShipMod[6])
				],
				// These properties are used by TsuDBSubmission
				oldMod: OldShipObj.mod,
				newMod: newShipMod,
				consumedMasterIds: consumedShips.map(s => s.masterId),
				consumedMasterLevels: consumedShips.map(s => s.level)
			});
			
			// Remove consumed ships and (optional) their equipment
			$.each(consumedShipIds, function(_, rosterId){
				KC3ShipManager.remove(rosterId, !scrapGearFlag);
				KC3Network.trigger("ShipSlots");
				KC3Network.trigger("GearSlots");
			});
			
			// Check if successful modernization
			if(response.api_data.api_powerup_flag == 1){
				KC3QuestManager.get(702).increment(); // G2: Daily Modernization
				KC3QuestManager.get(703).increment(); // G3: Weekly Modernization
				KC3Network.trigger("Quests");
			}
			
			KC3ShipManager.set([NewShipRaw]);
			KC3ShipManager.save();
			
			KC3Network.trigger("Fleet");
		},
		
		/* Item Consumption
		-------------------------------------------------------*/
		"api_req_member/itemuse":function(params, response, headers){
			var utcHour = Date.toUTChours(headers.Date);
			var itemId = parseInt(params.api_useitem_id, 10),
				forceToUse = parseInt(params.api_force_flag, 10), // 1 = no over cap confirm dialogue
				exchangeType = parseInt(params.api_exchange_type, 10),
				apiData = response.api_data || {}, // may no api data for some cases?
				showConfirmBox = apiData.api_caution_flag, // 1 = over cap confirm dialogue to be shown
				obtainFlag = apiData.api_flag, // meaning uncertain?
				itemAttrName = PlayerManager.getConsumableById(itemId, true);
			// Handle special items to be consumed by client:
			// Known useitem consumptions listed here are only for your reference,
			// since all cases of `api_exchange_type` are not fully verified,
			// exact amounts of useitem depend on following /useitem call.
			switch(exchangeType){
				case 1: // exchange 4 medals with 1 blueprint
					//if(itemId === 57) PlayerManager.consumables.medals -= 4;
				break;
				case 2: // exchange 1 medal with materials [300, 300, 300, 300, 0, 2, 0, 0] (guessed)
				case 3: // exchange 1 medal with 4 screws (guessed)
					//if(itemId === 57) PlayerManager.consumables.medals -= 1;
				break;
				case 11: // exchange 1 present box with resources [550, 550, 0, 0]
				case 12: // exchange 1 present box with materials [0, 0, 3, 1]
				case 13: // exchange 1 present box with 1 irako
					//if(itemId === 60) PlayerManager.consumables.presents -= 1;
				break;
				case 21: // exchange 1 hishimochi with resources [600, 0, 0, 200]
				case 22: // exchange 1 hishimochi with materials [0, 2, 0, 1]
				case 23: // exchange 1 hishimochi with 1 irako
					//if(itemId === 62) PlayerManager.consumables.hishimochi -= 1;
				break;
				case 31: // exchange 3 saury (sashimi) with resources [0, 300, 150, 0]
					//if(itemId === 68) PlayerManager.consumables.mackerel -= 3;
				break;
				case 32: // exchange 5 saury (shioyaki) with materials [0, 0, 3, 1]
					//if(itemId === 68) PlayerManager.consumables.mackerel -= 5;
				break;
				case 33: // exchange 7 saury (kabayaki) with 1 saury can & 3 buckets [0, 3, 0, 0]
					//if(itemId === 68) PlayerManager.consumables.mackerel -= 7;
				break;
				case 41: // exchange all boxes with fcoins
					//if(itemId === 10) PlayerManager.consumables.furniture200 = 0;
					//if(itemId === 11) PlayerManager.consumables.furniture400 = 0;
					//if(itemId === 12) PlayerManager.consumables.furniture700 = 0;
				break;
				case 42: // exchange half boxes with fcoins
					//if(itemId === 10) PlayerManager.consumables.furniture200 = Math.floor(PlayerManager.consumables.furniture200 / 2);
					//if(itemId === 11) PlayerManager.consumables.furniture400 = Math.floor(PlayerManager.consumables.furniture400 / 2);
					//if(itemId === 12) PlayerManager.consumables.furniture700 = Math.floor(PlayerManager.consumables.furniture700 / 2);
				break;
				case 43: // exchange 10 boxes with fcoins
					//if(itemId === 10) PlayerManager.consumables.furniture200 -= 10;
					//if(itemId === 11) PlayerManager.consumables.furniture400 -= 10;
					//if(itemId === 12) PlayerManager.consumables.furniture700 -= 10;
				break;
				case 51: // exchange 1 xmas select gift box with 1 Reppuu (guessed)
				case 52: // exchange 1 xmas select gift box with 1 WG42 (guessed)
				case 53: // exchange 1 xmas select gift box with 4 screws [0, 0, 0, 4]
					//if(itemId === 80) PlayerManager.consumables.xmasGiftBox -= 1;
				break;
				case 61: // exchange 5 rice with 1 origini
					//if(itemId === 85) PlayerManager.consumables.rice -= 5;
				break;
				case 62: // exchange 6 rice & 2 umeboshi & 3 nori with devmats and screws [0, 0, 3, 3]
					/*
					if([85, 86, 87].includes(itemId)) {
						PlayerManager.consumables.rice -= 6;
						PlayerManager.consumables.umeboshi -= 2;
						PlayerManager.consumables.nori -= 3;
					}
					*/
				break;
				case 63: // exchange 8 rice & 3 umeboshi & 3 nori & 4 tea with 2 irako, devmats, buckets and screws [0, 2, 2, 1]
					/*
					if([85, 86, 87, 88].includes(itemId)) {
						PlayerManager.consumables.rice -= 8;
						PlayerManager.consumables.umeboshi -= 3;
						PlayerManager.consumables.nori -= 3;
						PlayerManager.consumables.tea -= 4;
					}
					*/
				break;
				case 64: // exchange 9 rice & 5 umeboshi & 6 nori & 7 tea & 1 canned saury with 1 dinner ticket and 1 mamiya
					/*
					if([85, 86, 87, 88].includes(itemId)) {
						PlayerManager.consumables.rice -= 9;
						PlayerManager.consumables.umeboshi -= 5;
						PlayerManager.consumables.nori -= 6;
						PlayerManager.consumables.tea -= 7;
					}
					*/
					// it consumes 1 canned saury, but no `api_get_member/slot_item` api call followed,
					// have to remove the slotitem (unequipped & unlocked) from GearManager here.
					// see `ItemlistMain.swf#scene.itemlist.views.itemselect.jfood.ItemSelectDialogForJapaneseFood._getMemIDForSanmaNoKandume()`
					// correct method is looking up via `api_unset_slot` by type2 category first, then 1st occurrence of master Id
					const freeSauryCans = KC3GearManager.findFree(g => g.masterId === 150 && !g.lock);
					if(freeSauryCans.length){
						const sauryCanId = freeSauryCans[0].itemId;
						console.log("Consuming 1 Canned Saury", sauryCanId);
						KC3GearManager.remove(sauryCanId);
						KC3GearManager.save();
					}
				break;
				case 71: // exchange 1 dinner ticket with 2 medals
				case 72: // exchange 1 dinner ticket with 9 screws [0, 0, 0, 9]
				case 73: // exchange 1 dinner ticket & 300 torches with 1 prototype catapult
					// this exchange counted in `port.api_c_flag`, so that client can deny more than 3 exchanges
				case 74: // exchange 1 dinner ticket with 3 mamiya
					//if(itemId === 89) PlayerManager.consumables.dinnerTicket -= 1;
				break;
				case 81: // exchange 2 beans with materials [0, 0, 0, 1]
					//if(itemId === 90) PlayerManager.consumables.setsubunBeans -= 2;
				break;
				case 82: // exchange 4 beans with a setsubun furniture in 2019
					// 10 beans with a Action Report in 2020 (once)
					//if(itemId === 90) PlayerManager.consumables.setsubunBeans -= 4;
				break;
				case 83: // exchange 8 beans + 10 devmats with a Type 1 Land-based Attack Aircraft in 2019
					// 7 beans + 18 devmats with a Type 2 Land-based Reconnaissance Aircraft in 2020
					//if(itemId === 90) { PlayerManager.consumables.setsubunBeans -= 8; PlayerManager.consumables.devmats -= 10; }
				break;
				case 84: // exchange 20 beans + 40 devmats with a Ginga (once)
					//if(itemId === 90) { PlayerManager.consumables.setsubunBeans -= 20; PlayerManager.consumables.devmats -= 40; }
				break;
				case 91: // exchange 3 sardine with resources [100, 100, 0, 0]
					//if(itemId === 93) PlayerManager.consumables.sardine -= 3;
				break;
				case 92: // exchange 7 sardine with materials [0, 1, 0, 1]
					//if(itemId === 93) PlayerManager.consumables.sardine -= 7;
				break;
				case 93: // exchange 30 sardine with a Type 2 12cm Mortar Kai and 3 devmats
					//if(itemId === 93) PlayerManager.consumables.sardine -= 30;
				break;
				default:
					if(isNaN(exchangeType)){
						// exchange 1 chocolate with resources [700, 700, 700, 1500]
						//if(itemId === 56) PlayerManager.consumables.chocolate -= 1;
					} else {
						console.info("Unknown exchange type:", exchangeType, itemId, apiData);
					}
			}
			// Do not need to set PlayerManager resources and consumables here,
			// because /useitem, /material, /basic APIs will be called at once.
			
			// On materials obtained:
			if(apiData.api_material){
				const materials = apiData.api_material;
				console.log("Using item obtained materials:", itemId, itemAttrName, exchangeType, materials);
				if(Array.isArray(materials)){
					KC3Database.Naverall({
						hour: utcHour,
						type: "useitem" + itemId,
						data: materials
					});
				}
			}
			// On new item(s) obtained:
			const getitems = apiData.api_getitem;
			// in case of `api_getitem` existing no matter what obtainFlag value is
			if(getitems && (!Array.isArray(getitems) || !getitems.every(v => !v))){
				console.log("Using item obtained item(s):", itemId, itemAttrName, exchangeType, getitems);
				const getitemArr = $.makeArray(getitems);
				getitemArr.forEach(getitem => {
					// result might be `"api_getitem":[null]` if obtainFlag is not 1
					if(!getitem) return;
					// `api_mst_id` will be the useitem ID if `api_usemst` is 5 or 6
					if([5, 6].includes(getitem.api_usemst)){
						const useitemId = getitem.api_mst_id;
						console.log("Obtained useitem:", useitemId, PlayerManager.getConsumableById(useitemId, true));
					}
					// `api_mst_id` will be the slotitem ID if `api_usemst` is 2, and `api_slotitem` will appear
					if(getitem.api_slotitem){
						// since `api_get_member/slot_item` will not be called, have to update GearManager here
						KC3GearManager.set([ getitem.api_slotitem ]);
						console.log("Obtained slotitem:", getitem.api_slotitem);
					}
					// `api_mst_id` will be the furniture ID if `api_usemst` is 1
					if([1].includes(getitem.api_usemst)){
						const furnitureId = getitem.api_mst_id;
						console.log("Obtained furniture:", furnitureId, KC3Master.furniture(furnitureId));
					}
				});
			}
		},
		
		/* Buy Furniture
		-------------------------------------------------------*/
		"api_req_furniture/buy":function(params, response, headers, decodedParams){
			var furnitureNo = parseInt(decodedParams.api_no, 10),
				furnitureType = parseInt(decodedParams.api_type, 10),
				discountFlag = !!decodedParams.api_discount_flag,
				furnitureObj = KC3Master.furniture(undefined, furnitureNo, furnitureType);
			if(furnitureObj){
				// Defined in Core.swf#dto.FurnitureDTO.isNeedSpecialCraftsman()
				const isFurnitureFairyNeeded = (price) => price >= 2000 && price < 20000;
				// Defined in Core.swf#dto.FurnitureDTO.getDiscountPrice()
				const getDiscountedPrice = (price) => Math.max(0, Math.floor((price - 100000) * 0.1));
				var price = furnitureObj.api_price || 0,
					fairyUsed = isFurnitureFairyNeeded(price) || discountFlag;
				if(discountFlag && price >= 100000) price = getDiscountedPrice(price);
				PlayerManager.consumables.fcoin -= price;
				if(fairyUsed) PlayerManager.consumables.furnitureFairy -= 1;
				PlayerManager.setConsumables();
				console.log("You have bought furniture", furnitureObj.api_id, furnitureObj.api_title,
					"with fcoin", price, fairyUsed ? "and furniture fairy" : "");
				KC3Network.trigger("Consumables");
			}
		},
		
		/* Arsenal Improvement Item List
		-------------------------------------------------------*/
		"api_req_kousyou/remodel_slotlist":function(params, response, headers){
			const recipes = this.remodelRecipes;
			recipes.currentList = response.api_data;
			// cache current recipe list
			recipes.currentList.forEach(recipe => {
				const id = recipe.api_id;
				recipes.cachedRecipes[id] = recipe;
			});
			// detect 2nd ship, 0 if no 2nd only Akashi
			recipes.shipId = PlayerManager.fleets[0].ship(1).masterId;
			// get JST date on list shown
			recipes.today = Date.getJstDate();
			KC3Network.trigger("GearRemodelList", recipes);
		},
		/* Arsenal Improvement Item Detail
		-------------------------------------------------------*/
		"api_req_kousyou/remodel_slotlist_detail":function(params, response, headers){
			const recipes = this.remodelRecipes,
				cache = recipes.cachedRecipes,
				recipeId = parseInt(params.api_id);
			// cache current recipe detail data
			recipes.currentDetail = response.api_data;
			//recipes.currentDetail.api_req_useitem_id = 75;
			//recipes.currentDetail.api_req_useitem_num = 1;
			//recipes.currentDetail.api_req_useitem_id2 = 78;
			//recipes.currentDetail.api_req_useitem_num2 = 1;
			// merge detail to cached recipe
			const recipe = cache[recipeId];
			cache[recipeId] = $.extend({}, recipe, recipes.currentDetail);
			// cache ID info of current item to be improved
			recipes.rosterId = parseInt(params.api_slot_id);
			recipes.masterId = recipe.api_slot_id;
			recipes.recipeId = recipeId;
			KC3Network.trigger("GearRemodelDetail", recipes);
		},
		/* Equipment Arsenal Improvement
		-------------------------------------------------------*/
		"api_req_kousyou/remodel_slot":function(params, response, headers){
			const recipes = this.remodelRecipes,
				cache = recipes.cachedRecipes,
				recipeId = parseInt(params.api_id),
				rosterId = parseInt(params.api_slot_id),
				isCertainSuccess = !!parseInt(params.api_certain_flag),
				result = response.api_data;
			const
				reqApiName = (isCertainSuccess && "certain") || "req",
				recipe = cache[recipeId],
				hour = Date.toUTChours(headers.Date),
				materials = Array.apply(null, {length: 8}).map(x => 0),
				gear = KC3GearManager.get(rosterId),
				master = gear.master();
			recipes.currentResult = result;
			recipes.recipeId = recipeId;
			recipes.rosterId = rosterId;
			recipes.isCertain = isCertainSuccess;
			recipes.lastStars = gear.stars;
			// bull = ammo, buildkit = devmat, remodelkit = screw
			['fuel', 'bull', 'steel', 'bauxite', '', '', 'buildkit', 'remodelkit'].forEach((key, idx) => {
				// rejects empty key which reserved for torch and bucket
				if(!key.length) return;
				var apiName = ['api', (idx >= 4) ? reqApiName : 'req', key].join('_');
				materials[idx] = -recipe[apiName];
			});
			console.log("Improvement cost materials", materials);
			// Store to Lodger
			KC3Database.Naverall({
				hour: hour,
				type: "rmditem" + master.api_id,
				data: materials
			});
			// Update equipment or consumables on local data
			console.log("Improvement consumed slot or use item",
				result.api_use_slot_id || "none",
				result.api_use_useitem_id || "none",
				result.api_use_useitem_id2 || "none"
			);
			(result.api_use_slot_id || []).forEach(function(gearId){ KC3GearManager.remove(gearId); });
			if(result.api_after_slot) KC3GearManager.set([ result.api_after_slot ]);
			
			PlayerManager.setResources(hour * 3600, result.api_after_material.slice(0, 4));
			PlayerManager.consumables.devmats = result.api_after_material[6];
			PlayerManager.consumables.screws = result.api_after_material[7];
			PlayerManager.setConsumables();
			KC3QuestManager.get(619).increment();
			
			KC3Network.trigger("GearRemodel", recipes);
			KC3Network.trigger("Consumables");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Quests");
		},
		
		/* List current available musics in Jukebox
		-------------------------------------------------------*/
		"api_req_furniture/music_list":function(params, response, headers){
			// Game client-side will cache this result, so only 1st time of session will make a call
			console.debug("Jukebox available musics", response.api_data);
		},
		/* Play music from a Jukebox
		-------------------------------------------------------*/
		"api_req_furniture/music_play":function(params, response, headers, decodedParams){
			const musicId = decodedParams.api_music_id,
				afterFcoin = parseInt(response.api_data.api_coin, 10);
			if(afterFcoin >= 0){
				PlayerManager.consumables.fcoin = afterFcoin;
				PlayerManager.setConsumables();
				KC3Network.trigger("Consumables");
				// To get music information, have to handle `api_req_furniture/music_list`,
				// and remember its API data array, match `api_music_id` with elements' `api_id`,
				// and found `api_bgm_id` also defined in master.
			}
		},
		/* Set a music as Home Port BGM from a Jukebox
		-------------------------------------------------------*/
		"api_req_furniture/set_portbgm":function(params, response, headers, decodedParams){
			const musicId = decodedParams.api_music_id;
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
				console.log("Quest",r,"progress ["+(q.tracking ? q.tracking : '---')+"], in progress:",q.isSelected());
				return q;
			};
		
		// If victory for "defeat"-type quests
		var rankPt = getRank(data.api_win_rank);
		if(rankPt==5 && KC3SortieManager.currentNode().allyNoDamage) rankPt++;
		if(!isPvP) {
			[ /* Rank Requirement Table */
			  /* Define: [Quest ID, index of tracking, [world, map], isBoss, isCheckCompos, [bossEdges]] */
				[ /* E RANK / It does not matter */
					[216,0,false,false], // Bd2: Defeat the flagship of an enemy fleet
					[210,0,false,false], // Bd3: Attack 10 abyssal fleets
					[214,1,false, true], // Bw1: 2nd requirement: Encounter 24 bosses (index:1)
				],
				[ /* D RANK */ ],
				[ /* C RANK */ ],
				[ /* B RANK */
					[201,0,false,false], // Bd1: Defeat an enemy fleet
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
					[265,0,[1,5], true], // Bm5: Deploy a fleet to [W1-5] and A-rank+ the boss node 10 times
					[854,0,[2,4], true, true], // Bq2: 1st requirement: [W2-4] A-rank+ the boss node
					[854,1,[6,1], true, true], // Bq2: 2nd requirement: [W6-1] A-rank+ the boss node
					[854,2,[6,3], true, true], // Bq2: 3rd requirement: [W6-3] A-rank+ the boss node
					[862,0,[6,3], true, true], // Bq4: Sortie to [W6-3] A-rank+ the boss node 2 times
					[873,0,[3,1], true, true], // Bq5: 1st requirement: [W3-1] A-rank+ the boss node
					[873,1,[3,2], true, true], // Bq5: 2nd requirement: [W3-2] A-rank+ the boss node
					[873,2,[3,3], true, true], // Bq5: 3rd requirement: [W3-3] A-rank+ the boss node
					[905,0,[1,1], true, true], // By2: 1st requirement: [W1-1] A-rank+ the boss node
					[905,1,[1,2], true, true], // By2: 2nd requirement: [W1-2] A-rank+ the boss node
					[905,2,[1,3], true, true], // By2: 3rd requirement: [W1-3] A-rank+ the boss node
					[905,3,[1,5], true, true], // By2: 4th requirement: [W1-5] A-rank+ the boss node
					[912,0,[1,3], true, true], // By3: 1st requirement: [W1-3] A-rank+ the boss node
					[912,1,[2,1], true, true], // By3: 2nd requirement: [W2-1] A-rank+ the boss node
					[912,2,[2,2], true, true], // By3: 3rd requirement: [W2-2] A-rank+ the boss node
					[912,3,[2,3], true, true], // By3: 4th requirement: [W2-3] A-rank+ the boss node
					[914,0,[4,1], true, true], // By4: 1st requirement: [W4-1] A-rank+ the boss node
					[914,1,[4,2], true, true], // By4: 2nd requirement: [W4-2] A-rank+ the boss node
					[914,2,[4,3], true, true], // By4: 3rd requirement: [W4-3] A-rank+ the boss node
					[914,3,[4,4], true, true], // By4: 4th requirement: [W4-4] A-rank+ the boss node
				],
				[ /* S RANK */
					[214,3,false,false], // Bw1: 4th requirement: 6 S ranks (index:3)
					[243,0,[5,2], true], // Bw9: Sortie to [W5-2] and S-rank the boss node 2 times
					[256,0,[6,1], true], // Bm2: Deploy to [W6-1] and obtain an S-rank the boss node 3 times
					[280,0,[1,2], true, true], // Bm8: 1st requirement: [W1-2] S-rank the boss node
					[280,1,[1,3], true, true], // Bm8: 2nd requirement: [W1-3] S-rank the boss node
					[280,2,[1,4], true, true], // Bm8: 3rd requirement: [W1-4] S-rank the boss node
					[280,3,[2,1], true, true], // Bm8: 4th requirement: [W2-1] S-rank the boss node
					[284,0,[1,4], true, true], // Bq11: 1st requirement: [W1-4] S-rank the boss node
					[284,1,[2,1], true, true], // Bq11: 2nd requirement: [W2-1] S-rank the boss node
					[284,2,[2,2], true, true], // Bq11: 3rd requirement: [W2-2] S-rank the boss node
					[284,3,[2,3], true, true], // Bq11: 4th requirement: [W2-3] S-rank the boss node
					[822,0,[2,4], true], // Bq1: Sortie to [W2-4] and S-rank the boss node 2 times
					[845,0,[4,1], true], // Bq12: 1st requirement: [W4-1] S-rank the boss node
					[845,1,[4,2], true], // Bq12: 2nd requirement: [W4-2] S-rank the boss node
					[845,2,[4,3], true], // Bq12: 3rd requirement: [W4-3] S-rank the boss node
					[845,3,[4,4], true], // Bq12: 4th requirement: [W4-4] S-rank the boss node
					[845,4,[4,5], true], // Bq12: 5th requirement: [W4-5] S-rank the boss node
					[854,3,[6,4], true, true], // Bq2: 4th requirement: [W6-4] S-rank the boss node
					[872,0,[7,2], true, true, [15]], // Bq10: 1st requirement: [W7-2-M] S-rank 2nd boss node
					[872,1,[5,5], true, true], // Bq10: 2nd requirement: [W5-5] S-rank the boss node
					[872,2,[6,2], true, true], // Bq10: 3rd requirement: [W6-2] S-rank the boss node
					[872,3,[6,5], true, true], // Bq10: 4th requirement: [W6-5] S-rank the boss node
					[875,0,[5,4], true, true], // Bq6: Sortie to [W5-4] S-rank the boss node
					[888,0,[5,1], true, true], // Bq7: 1st requirement: [W5-1] S-rank the boss node
					[888,1,[5,3], true, true], // Bq7: 2nd requirement: [W5-3] S-rank the boss node
					[888,2,[5,4], true, true], // Bq7: 3rd requirement: [W5-4] S-rank the boss node
					[893,0,[1,5], true], // Bq8: 1st requirement: [W1-5] S-rank the boss node 3 times
					[893,1,[7,1], true], // Bq8: 2nd requirement: [W7-1] S-rank the boss node 3 times
					[893,2,[7,2], true, false, [7] ], // Bq8: 3rd requirement: [W7-2-G] S-rank 1st boss node 3 times
					[893,3,[7,2], true, false, [15]], // Bq8: 4th requirement: [W7-2-M] S-rank 2nd boss node 3 times
					[894,0,[1,3], true, true], // Bq9: 1st requirement: [W1-3] S-rank the boss node
					[894,1,[1,4], true, true], // Bq9: 2nd requirement: [W1-4] S-rank the boss node
					[894,2,[2,1], true, true], // Bq9: 3rd requirement: [W2-1] S-rank the boss node
					[894,3,[2,2], true, true], // Bq9: 4th requirement: [W2-2] S-rank the boss node
					[894,4,[2,3], true, true], // Bq9: 5th requirement: [W2-3] S-rank the boss node
					[903,0,[5,1], true, true], // Bq13: 1st requirement: [W5-1] S-rank the boss node
					[903,1,[5,4], true, true], // Bq13: 2nd requirement: [W5-4] S-rank the boss node
					[903,2,[6,4], true, true], // Bq13: 3rd requirement: [W6-4] S-rank the boss node
					[903,3,[6,5], true, true], // Bq13: 4th requirement: [W6-5] S-rank the boss node
					[904,0,[2,5], true, true], // By1: 1st requirement: [W2-5] S-rank the boss node
					[904,1,[3,4], true, true], // By1: 2nd requirement: [W3-4] S-rank the boss node
					[904,2,[4,5], true, true], // By1: 3rd requirement: [W4-5] S-rank the boss node
					[904,3,[5,3], true, true], // By1: 4th requirement: [W5-3] S-rank the boss node
				],
				[ /* SS RANK */ ]
			].slice(0, rankPt+1)
				.reduce(function(x,y){ return x.concat(y); })
				.filter(function(x){
					return (
						(!x[2] || KC3SortieManager.isSortieAt.apply(KC3SortieManager,x[2])) && /* Is sortie at */
						(!x[3] || KC3SortieManager.currentNode().isBoss())                  && /* Is on boss node */
						(!x[4] || KC3QuestManager.isPrerequisiteFulfilled(x[0]) !== false)  && /* Is fleet composition matched */
						(!x[5] || x[5].includes(KC3SortieManager.currentNode().id))         && /* Is on specified boss node */
						true
					);
				})
				.forEach(function(x){
					qLog(x[0]).increment(x[1]);
				});
		} else {
			KC3QuestManager.get(303).increment(); // C2: Daily Exercises 1
			if(rankPt >= 3) { // B-Rank+
				KC3QuestManager.get(304).increment(); // C3: Daily Exercises 2
				KC3QuestManager.get(302).increment(); // C4: Weekly Exercises
				KC3QuestManager.get(311).increment(); // C8: Monthly Exercises 1
				if(KC3QuestManager.isPrerequisiteFulfilled(318))
					KC3QuestManager.get(318).increment(); // C16: Monthly Exercises 2
				if(KC3QuestManager.isPrerequisiteFulfilled(330))
					KC3QuestManager.get(330).increment(); // C29: Quarterly Exercises 1
			}
			if(rankPt >= 4) { // A-Rank+
				if(KC3QuestManager.isPrerequisiteFulfilled(342))
					KC3QuestManager.get(342).increment(); // C44: Quarterly Exercises 4
			}
			if(rankPt >= 5) { // S-Rank+
				if(KC3QuestManager.isPrerequisiteFulfilled(337))
					KC3QuestManager.get(337).increment(); // C38: Quarterly Exercises 2
				if(KC3QuestManager.isPrerequisiteFulfilled(339))
					KC3QuestManager.get(339).increment(); // C42: Quarterly Exercises 3
			}
		}
	}
	
})();
