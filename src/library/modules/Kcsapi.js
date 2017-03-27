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
			// Not sure why, but always shown +3 at client side. see #1860
			KC3GearManager.max = 3 + response.api_data.api_basic.api_max_slotitem;
			
			PlayerManager.setFleets( response.api_data.api_deck_port );
			PlayerManager.setRepairDocks( response.api_data.api_ndock );
			PlayerManager.buildSlots = response.api_data.api_basic.api_count_kdock;
			
			var utcSeconds = Date.toUTCseconds(headers.Date);
			
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
			
			KC3SortieManager.endSortie(response);
			
			PlayerManager.loadBases()
				.setBaseConvertingSlots(response.api_data.api_plane_info);
			
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
			KC3GearManager.max = 3 + response.api_data.api_max_slotitem;
			
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
			
			PlayerManager.fleetCount = response.api_data.api_deck;
			PlayerManager.repairSlots = response.api_data.api_ndoc;
			PlayerManager.buildSlots = response.api_data.api_kdoc;
			KC3ShipManager.max = response.api_data.api_ship[1];
			KC3GearManager.max = 3 + response.api_data.api_slotitem[1];
			
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
			for(let ctr in response.api_data){
				let thisItem = response.api_data[ctr];
				// Recognize some frequently used items, full IDs set in master useitem
				switch(thisItem.api_id){
					case 10: PlayerManager.consumables.furniture200 = thisItem.api_count; break;
					case 11: PlayerManager.consumables.furniture400 = thisItem.api_count; break;
					case 12: PlayerManager.consumables.furniture700 = thisItem.api_count; break;
					// 50 and 51 not found in this API, as they are slotitem
					//case 50: PlayerManager.consumables.repairTeam = thisItem.api_count; break;
					//case 51: PlayerManager.consumables.repairGoddess = thisItem.api_count; break;
					case 52: PlayerManager.consumables.furnitureFairy = thisItem.api_count; break;
					case 54: PlayerManager.consumables.mamiya = thisItem.api_count; break;
					case 56: PlayerManager.consumables.chocolate = thisItem.api_count; break;
					case 57: PlayerManager.consumables.medals = thisItem.api_count; break;
					case 58: PlayerManager.consumables.blueprints = thisItem.api_count; break;
					case 59: PlayerManager.consumables.irako = thisItem.api_count; break;
					case 60: PlayerManager.consumables.presents = thisItem.api_count; break;
					case 61: PlayerManager.consumables.firstClassMedals = thisItem.api_count; break;
					case 62: PlayerManager.consumables.hishimochi = thisItem.api_count; break;
					case 64: PlayerManager.consumables.reinforceExpansion = thisItem.api_count; break;
					case 65: PlayerManager.consumables.protoCatapult = thisItem.api_count; break;
					// 66 and 67 not found in this API, as they are slotitem
					//case 66: PlayerManager.consumables.ration = thisItem.api_count; break;
					//case 67: PlayerManager.consumables.resupplier = thisItem.api_count; break;
					case 68: PlayerManager.consumables.mackerel = thisItem.api_count; break;
					case 69: PlayerManager.consumables.mackerelCan = thisItem.api_count; break;
					case 70: PlayerManager.consumables.skilledCrew = thisItem.api_count; break;
					case 71: PlayerManager.consumables.nEngine = thisItem.api_count; break;
					case 72: PlayerManager.consumables.decoMaterial = thisItem.api_count; break;
					case 73: PlayerManager.consumables.constCorps = thisItem.api_count; break;
					case 74: PlayerManager.consumables.newAircraftBlueprint = thisItem.api_count; break;
					default: break;
				}
			}
			console.log("useitems", PlayerManager.consumables);
			PlayerManager.setConsumables();
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
		},
		
		"api_req_kaisou/open_exslot":function(params, response, headers){
			var sid  = parseInt(params.api_id,10),
				ship = KC3ShipManager.get(sid),
				mast = ship.master();
			// Assume KC client already checked 1 item left at least
			PlayerManager.consumables.reinforceExpansion -= 1;
			PlayerManager.setConsumables();
			console.log("Extra Slot unlocked for", sid, ship.name());
			KC3Network.trigger("Consumables");
		},
		
		"api_req_kaisou/marriage":function(params, response, headers){
			var
				sid      = parseInt(params.api_id,10),
				ship     = KC3ShipManager.get(sid),
				mast     = ship.master(),
				ship_obj = response.api_data;
			console.log("Perform Marriage", sid, ship.name());
		},
		
		"api_req_kaisou/remodeling":function(params, response, headers){
			var utcHour  = Date.toUTChours(headers.Date),
				ship     = KC3ShipManager.get(params.api_id),
				master   = ship.master(),
				// NOTE: api_afterfuel is steel consumption!
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
				hour: utcHour,
				type: "remodel" + master.api_id,
				data: material
			});
			PlayerManager.setResources(utcHour * 3600, null, material.slice(0, 4));
			KC3Network.trigger("Consumables");
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
			PlayerManager.saveFleets();
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
			var setExSlot = params.api_set_slot_kind == 1;
			var unsetExSlot = params.api_unset_slot_kind == 1;
			ShipFrom.items = response.api_data.api_ship_data.api_unset_ship.api_slot;
			if(unsetExSlot) ShipFrom.ex_item = response.api_data.api_ship_data.api_unset_ship.api_slot_ex;
			ShipTo.items = response.api_data.api_ship_data.api_set_ship.api_slot;
			if(setExSlot) ShipTo.ex_item = response.api_data.api_ship_data.api_set_ship.api_slot_ex;
			KC3ShipManager.save();
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(params.api_set_ship);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
			
			var shipObj = ShipTo;
			var gearObj = KC3GearManager.get(setExSlot ? shipObj.ex_item : shipObj.items[params.api_set_idx]);
			var gunfit = KC3Meta.gunfit(shipObj.masterId, gearObj.masterId);
			var aaciTypes = AntiAir.sortedPossibleAaciList(AntiAir.shipPossibleAACIs(shipObj));
			KC3Network.trigger("GunFit", {
				isShow: (gunfit !== false || aaciTypes.length > 0),
				shipObj: shipObj,
				gearObj: gearObj,
				thisFit: gunfit,
				shipFits: KC3Meta.gunfit(shipObj.masterId),
				shipAacis: aaciTypes
			});
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
				this.shipConstruction.resources.slice(0, 4).map(v=>-v));
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
			var fleetIndex = parseInt(params.api_id, 10);
			
			// If removing all ships except flagship
			if(typeof response.api_data != "undefined"){
				if(typeof response.api_data.api_change_count != "undefined"){
					PlayerManager.fleets[ fleetIndex-1 ].clearNonFlagShips();
					KC3Network.trigger("Fleet", { switchTo: fleetIndex });
					return true;
				}
			}
			
			// Ship deploying / removing / swapping
			// Concat all ship IDs in all fleets into an array
			var flatShips  = PlayerManager.fleets
				.map(function(x){ return x.ships; })
				.reduce(function(x,y){ return x.concat(y); });
			// Target ship index in a fleet
			var changedIndex = parseInt(params.api_ship_idx, 10);
			// Target ship ID, -1 if removed
			var changingShip = parseInt(params.api_ship_id,10);
			// Swap from source ship index in flat array
			var oldSwaperSlot = flatShips.indexOf(changingShip);
			// Swap from source ship ID, -1 if empty
			var oldSwapeeSlot = flatShips[ (fleetIndex-1) * 6 + changedIndex ];
			// Swap from source fleet index
			var oldFleet = Math.floor(oldSwaperSlot / 6);
			if(changingShip > -1){ // Deploy or swap ship
				// Deploy ship to target fleet first, to avoid issue when swapping in the same fleet
				PlayerManager.fleets[fleetIndex-1].ships[changedIndex] = changingShip;
				// Swap ship from source fleet
				if(oldSwaperSlot > -1){
					PlayerManager.fleets[oldFleet].ships[oldSwaperSlot % 6] = oldSwapeeSlot;
					// If source ship slot is empty, apply ship removing on source fleet
					if(oldSwapeeSlot <= 0){
						PlayerManager.fleets[oldFleet].ships.splice(oldSwaperSlot % 6, 1);
						PlayerManager.fleets[oldFleet].ships.push(-1);
					}
					// If not the same fleet, also recheck akashi repair of source fleet
					if(oldFleet !== fleetIndex-1){
						PlayerManager.fleets[oldFleet].checkAkashi(true);
					}
				}
			} else { // Remove ship
				PlayerManager.fleets[fleetIndex-1].ships.splice(changedIndex, 1);
				PlayerManager.fleets[fleetIndex-1].ships.push(-1);
			}
			PlayerManager.fleets[fleetIndex-1].checkAkashi(true);
			PlayerManager.saveFleets();
			KC3Network.trigger("Fleet", { switchTo: fleetIndex });
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
				ConfigManager.loadIfNecessary();
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
		
		/* Lock a equipment
		-------------------------------------------------------*/
		"api_req_kaisou/lock":function(params, response, headers){
			var itemId = parseInt(params.api_slotitem_id, 10);
			var lockState = response.api_data.api_locked;
			var gearObj = KC3GearManager.get(itemId);
			if(gearObj.itemId > 0){
				gearObj.lock = lockState;
				KC3GearManager.save();
			}
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
			
			// Gun fit bonus / penalty OR possible AACI patterns
			var gearObj = KC3GearManager.get(itemID);
			var gunfit = KC3Meta.gunfit(shipObj.masterId, gearObj.masterId);
			var aaciTypes = AntiAir.sortedPossibleAaciList(AntiAir.shipPossibleAACIs(shipObj));
			KC3Network.trigger("GunFit", {
				isShow: (gunfit !== false || aaciTypes.length > 0),
				shipObj: shipObj,
				gearObj: gearObj,
				thisFit: gunfit,
				shipFits: KC3Meta.gunfit(shipObj.masterId), // different from above
				shipAacis: aaciTypes
			});
		},
		
		"api_req_kaisou/slotset_ex":function(params, response, headers){
			var itemID = parseInt(params.api_item_id, 10);
			var shipID = parseInt(params.api_id, 10);
			var shipObj = KC3ShipManager.get(shipID);
			var gearObj = KC3GearManager.get(itemID);
			shipObj.ex_item = itemID;
			// If ship is in a fleet, switch view to the fleet containing the ship
			var fleetNum = KC3ShipManager.locateOnFleet(shipID);
			if (fleetNum > -1) {
				KC3Network.trigger("Fleet", { switchTo: fleetNum+1 });
			} else {
				KC3Network.trigger("Fleet");
			}
			// Possible AACI patterns
			var aaciTypes = AntiAir.sortedPossibleAaciList(AntiAir.shipPossibleAACIs(shipObj));
			KC3Network.trigger("GunFit", {
				isShow: aaciTypes.length > 0,
				shipObj: shipObj,
				gearObj: gearObj,
				thisFit: false,
				shipAacis: aaciTypes
			});
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
			var utcSeconds = Date.toUTCseconds(headers.Date);
			var fleetNum = parseInt(params.api_deck_id, 10);
			KC3SortieManager.startSortie(
				response.api_data.api_maparea_id,
				response.api_data.api_mapinfo_no,
				params.api_deck_id,
				utcSeconds,
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
		"api_req_map/start_air_base":function(params, response, headers){
			var strikePoint1 = params.api_strike_point_1,
				strikePoint2 = params.api_strike_point_2,
				strikePoint3 = params.api_strike_point_3;
			var utcHour = Date.toUTChours(headers.Date);
			var consumedFuel = 0, consumedAmmo = 0;
			$.each(PlayerManager.bases, function(i, base){
				// Land Base of this world, Action: sortie
				if(base.map === KC3SortieManager.map_world && base.action === 1){
					console.log("Sortied LBAS:", base);
					$.each(base.planes, function(j, plane){
						// Plane is set, not moving
						if(plane.api_slotid > 0 && plane.api_state === 1){
							var planeType2 = KC3GearManager.get(plane.api_slotid).master().api_type[2];
							var fuelCostPerSlot = KC3GearManager.landBaseReconnType2Ids.indexOf(planeType2) > -1 ?
								KC3GearManager.landBaseReconnSortieFuelCostPerSlot : planeType2 === 47 ?
								KC3GearManager.landBaseBomberSortieFuelCostPerSlot :
								KC3GearManager.landBaseOtherSortieFuelCostPerSlot;
							var ammoCostPerSlot = KC3GearManager.landBaseReconnType2Ids.indexOf(planeType2) > -1 ?
								KC3GearManager.landBaseReconnSortieAmmoCostPerSlot : planeType2 === 47 ?
								KC3GearManager.landBaseBomberSortieAmmoCostPerSlot :
								KC3GearManager.landBaseOtherSortieAmmoCostPerSlot;
							// After testing, should use api_count, not api_max_count
							// but the accuray depend on costPerSlot series constants
							consumedFuel += Math.round(plane.api_count * fuelCostPerSlot);
							consumedAmmo += Math.round(plane.api_count * ammoCostPerSlot);
						}
					});
				}
			});
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
			// TODO Show indicator of sortied LBAS at panel (also show striked nodes name?)
		},
		
		/* Traverse Map
		-------------------------------------------------------*/
		"api_req_map/next":function(params, response, headers){
			KC3SortieManager.discardSunk();
			KC3SortieManager.advanceNode( response.api_data, Date.toUTCseconds(headers.Date) );
			KC3Network.hasOverlay = true;
			(new RMsg("service", "mapMarkers", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				nextNode: response.api_data
			})).execute();
			KC3Network.trigger("CompassResult");
			if(typeof response.api_data.api_destruction_battle !== "undefined"){
				KC3SortieManager.engageLandBaseAirRaid(
					response.api_data.api_destruction_battle
				);
				KC3Network.trigger("LandBaseAirRaid");
			}
		},
		
		/* NORMAL: BATTLE STARTS
		-------------------------------------------------------*/
		"api_req_sortie/battle":function(params, response, headers){
			response.api_data.api_name = response.api_data.api_name || "battle";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
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
		
		/* PLAYER-ONLY COMBINED FLEET: BATTLE STARTS
		-------------------------------------------------------*/
		"api_req_combined_battle/battle":function(params, response, headers){
			response.api_data.api_name = response.api_data.api_name || "fc_battle";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
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
		
		/* BATTLE STARTS as NIGHT
		-------------------------------------------------------*/
		"api_req_battle_midnight/sp_midnight":function(params, response, headers){
			response.api_data.api_name = response.api_data.api_name || "sp_midnight";
			KC3SortieManager.engageBattleNight(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
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
			response.api_data.api_name = "midnight_battle";
			KC3SortieManager.engageNight( response.api_data );
			KC3Network.trigger("BattleNight");
		},
		"api_req_combined_battle/midnight_battle":function(params, response, headers){
			response.api_data.api_name = "fc_midnight_battle";
			KC3SortieManager.engageNight( response.api_data );
			KC3Network.trigger("BattleNight");
		},
		
		/* ENEMY COMBINED FLEET
		-------------------------------------------------------*/
		"api_req_combined_battle/ec_battle":function(params, response, headers){
			response.api_data.api_name = "ec_battle";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/ec_midnight_battle":function(params, response, headers){
			response.api_data.api_name = "ec_midnight_battle";
			KC3SortieManager.engageNight(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
			KC3Network.trigger("BattleNight");
		},
		
		/* BOTH COMBINED FLEET
		-------------------------------------------------------*/
		"api_req_combined_battle/each_battle":function(params, response, headers){
			response.api_data.api_name = response.api_data.api_name || "each_battle";
			KC3SortieManager.engageBattle(
				response.api_data,
				Date.toUTCseconds(headers.Date)
			);
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
		
		/* Get bases info. deprecated by devs, see `mapinfo`.
		-------------------------------------------------------*/
		"api_get_member/base_air_corps":function(params, response, headers){
			PlayerManager.setBases(response.api_data);
			KC3Network.trigger("Lbas");
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
							base.action = params.api_action_kind.split("%2C")[j];
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
					base.range = response.api_data.api_distance;
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
			//var landSlot = KC3GearManager.landBaseReconnType2Ids.indexOf(planeMaster.api_type[2])>-1 ?
			//KC3GearManager.landBaseReconnMaxSlot : KC3GearManager.landBaseOtherMaxSlot;
			//var deployBauxiteCost = planeMaster.api_cost * landSlot;
			if(typeof response.api_data.api_after_bauxite !== "undefined"){
				var utcHour = Date.toUTChours(headers.Date);
				var consumedBauxite = response.api_data.api_after_bauxite - PlayerManager.hq.lastMaterial[3];
				KC3Database.Naverall({
					hour: utcHour,
					type: "lbas" + (params.api_area_id || "0"),
					data: [0,0,0,consumedBauxite].concat([0,0,0,0])
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
			var consumedFuel = response.api_data.api_after_fuel - PlayerManager.hq.lastMaterial[0],
				consumedBauxite = response.api_data.api_after_bauxite - PlayerManager.hq.lastMaterial[3];
			KC3Database.Naverall({
				hour: utcHour,
				type: "lbas" + (params.api_area_id || "0"),
				data: [consumedFuel,0,0,consumedBauxite].concat([0,0,0,0])
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
			var utcHour  = Date.toUTChours(headers.Date),
				quest    = Number(params.api_quest_id),
				data     = response.api_data,
				material = data.api_material,
				consume  = [0,0,0,0],
				bonuses  = data.api_bounus;
			console.log(quest,data);
			
			// Force to mark quest as complete
			KC3QuestManager.get(quest).toggleCompletion(true);
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
				hour: utcHour,
				type: "quest"+quest,
				data: material
			});
			console.log("Quest Item",material);
			
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
				shipId     = parseInt( params.api_ship_id , 10),
				bucket     = parseInt( params.api_highspeed , 10),
				nDockNum   = parseInt( params.api_ndock_id , 10),
				shipData   = KC3ShipManager.get( shipId );
			
			PlayerManager.setResources(utcSeconds, null, [-shipData.repair[1],0,-shipData.repair[2],0]);
			if(bucket == 1){
				PlayerManager.consumables.buckets -= 1;
				PlayerManager.setConsumables();
				
				// If ship is still is the list being repaired, remove Her
				var herRepairIndex = PlayerManager.repairShips.indexOf( shipId );
				if(herRepairIndex  > -1){
					PlayerManager.repairShips.splice(herRepairIndex, 1);
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
			PlayerManager.consumables.buckets -= 1;
			PlayerManager.setConsumables();
			
			// If ship is still is the list being repaired, remove Her
			var
				shipId   = PlayerManager.repairShips[ params.api_ndock_id ],
				shipData = KC3ShipManager.get(shipId);
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
			KC3SortieManager.sortieTime = Date.toUTCseconds(headers.Date);
			KC3SortieManager.map_world  = -1;
			KC3SortieManager.snapshotFleetState();
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
			KC3Network.trigger("ExpeditionSelection");
		},

		/* Expedition Start
		  -------------------------------------------------------*/
		"api_req_mission/start": function(params, response, headers) {
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
		"api_req_kousyou/createitem":function(params, response, headers){
			var
				resourceUsed = [ params.api_item1, params.api_item2, params.api_item3, params.api_item4 ],
				failed       = (typeof response.api_data.api_slot_item == "undefined"),
				utcSeconds   = Date.toUTCseconds(headers.Date),
				utcHour      = Date.toUTChours(headers.Date);
			
			// Log into development History
			KC3Database.Develop({
				flag: PlayerManager.fleets[0].ship(0).masterId,
				rsc1: resourceUsed[0],
				rsc2: resourceUsed[1],
				rsc3: resourceUsed[2],
				rsc4: resourceUsed[3],
				result: (!failed)?response.api_data.api_slot_item.api_slotitem_id:-1,
				time: utcSeconds
			});
			
			KC3Database.Naverall({
				hour: utcHour,
				type: "critem",
				data: resourceUsed.concat([0,0,!failed,0]).map(function(x){return -x;})
			});
			
			if(Array.isArray(response.api_data.api_material)){
				PlayerManager.setResources(utcSeconds, response.api_data.api_material.slice(0,4));
				PlayerManager.consumables.devmats = response.api_data.api_material[6];
				PlayerManager.setConsumables();
			}
			
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
			
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Quests");
		},
		
		/* Scrap a Ship
		-------------------------------------------------------*/
		"api_req_kousyou/destroyship":function(params, response, headers){
			var
				rsc   = [0,0,0,0,0,0,0,0],
				ship  = KC3ShipManager.get(params.api_ship_id),
				scrap = [],
				utcHour = Date.toUTChours(headers.Date);
			
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
				hour: utcHour,
				type: "dsship" + ship.masterId,
				data: rsc
			});
			KC3ShipManager.remove( params.api_ship_id );
			KC3QuestManager.get(609).increment(); // F5: Daily Dismantlement
			PlayerManager.setResources(utcHour * 3600, null, rsc.slice(0,4));
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Fleet");
			KC3Network.trigger("Quests");
		},
		
		/* Scrap a Gear
		-------------------------------------------------------*/
		"api_req_kousyou/destroyitem2":function(params, response, headers){
			var
				rsc   = [0,0,0,0,0,0,0,0],
				utcHour = Date.toUTChours(headers.Date);
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
				hour: utcHour,
				type: "dsitem",
				data: rsc
			});
			KC3QuestManager.get(613).increment(); // F12: Weekly Dismantlement
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
			
			// If LBAS info updated, trigger updating view
			if(PlayerManager.setBasesOnWorldMap(response.api_data)) {
				KC3Network.trigger("Lbas");
			}
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
			var utcHour = Date.toUTChours(headers.Date);
			var itemId = parseInt(params.api_useitem_id,10),
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
						hour: utcHour,
						type: "useitem" + itemId,
						data: dMatr
					});
					// Not needed because /useitem, /material, /basic APIs will be called following this
					/*
					PlayerManager.setResources(utcHour * 3600, null, dMatr.slice(0,4));
					PlayerManager.setConsumables(utcHour * 3600, null, dMatr.slice(4,8));
					KC3Network.trigger("Consumables");
					*/
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
				hr = Date.toUTChours(headers.Date),
				mt = Array.apply(null,{length:8}).map(function(){return 0;}),
				ms = KC3GearManager.get(parseInt(params.api_slot_id)).master();
			['fuel','bull','steel','bauxite','','','buildkit','remodelkit'].forEach(function(dk,id){
				// rejects empty key
				if(!dk.length) return;
				
				var sk = ['api',(id >= 4) ? ky : 'req',dk].join('_');
				mt[id] = -cu[sk];
			});
			console.info("Remodel Cost", mt);
			// Store to Lodger
			KC3Database.Naverall({
				hour: hr,
				type: "rmditem" + ms.api_id,
				data: mt
			});
			// Update equipment on local data
			(response.api_data.api_use_slot_id || []).forEach(function(gearId){ KC3GearManager.remove(gearId); });
			KC3GearManager.set([ response.api_data.api_after_slot ]);
			
			PlayerManager.setResources(hr * 3600, response.api_data.api_after_material.slice(0, 4));
			PlayerManager.consumables.devmats = response.api_data.api_after_material[6];
			PlayerManager.consumables.screws = response.api_data.api_after_material[7];
			PlayerManager.setConsumables();
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
				console.log("Quest",r,"progress ["+(q.tracking ? q.tracking : '-----')+"], in progress:",q.isSelected());
				return q;
			};
		
		// If victory for "defeat"-type quests
		var rankPt = getRank(data.api_win_rank);
		if(rankPt==5 && KC3SortieManager.currentNode().allyNoDamage) rankPt++;
		if(!isPvP) {
			[ /* Rank Requirement Table */
				 /* [Quest ID, index of tracking, [world, map], isBoss] */
				[ /* E RANK / It does not matter */
					[216,0,false,false], // Bd2: Defeat the flagship of an enemy fleet
					[210,0,false,false], // Bd3: Attack 10 abyssal fleets
					[214,1,false, true]  // Bw1: 2nd requirement: Encounter 24 bosses (index:1)
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
					[265,0,[1,5], true]  // Bm5: Deploy a fleet to [W1-5] and A-rank+ the boss node 10 times
				],
				[ /* S RANK */
					[214,3,false,false], // Bw1: 4th requirement: 6 S ranks (index:3)
					[243,0,[5,2], true], // Bw9: Sortie to [W5-2] and S-rank the boss node 2 times
					[256,0,[6,1], true], // Bm2: Deploy to [W6-1] and obtain an S-rank the boss node 3 times
					[822,0,[2,4], true]  // Bq1: Sortie to [W2-4] and S-rank the boss node 2 times
				],
				[ /* SS RANK Kanzen shohri */ ]
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
