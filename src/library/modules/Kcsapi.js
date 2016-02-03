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
		
		/* Home Port Screen
		-------------------------------------------------------*/
		"api_port/port":function(params, response, headers){	
			KC3Network.trigger("HomeScreen");
			
			//KC3ShipManager.clear();
			KC3ShipManager.set(response.api_data.api_ship,true);
			this.serverOffset = this.moraleRefresh.calibrate( headers.Date );
			
			KC3SortieManager.endSortie(response);
			
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
			
			var UTCtime = Math.floor((new Date(headers.Date)).getTime()/1000);
			
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
			var UTCtime = Math.floor((new Date(headers.Date)).getTime()/1000);
			
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
			var UTCtime = Math.floor((new Date(headers.Date)).getTime()/1000);
			
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
				ctime    = (new Date(headers.Date)).getTime(),
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
							console.error("Expected array of length 2 on",pendingData,"consumption data");
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
			localStorage.presets = JSON.stringify(response.api_data.api_deck);
			console.log("LIST PRESETS", response.api_data.api_deck, localStorage.presets);
		},
		
		// Register preset
		"api_req_hensei/preset_register":function(params, response, headers){
			var MyPresets = JSON.parse(localStorage.presets);
			MyPresets[response.api_data.api_preset_no] = response.api_data;
			localStorage.presets = JSON.stringify(MyPresets);
			console.log("REGISTERED PRESET", MyPresets, localStorage.presets);
		},
		
		// Remove Preset from list
		"api_req_hensei/preset_delete":function(params, response, headers){
			var MyPresets = JSON.parse(localStorage.presets);
			delete MyPresets[params.api_preset_no];
			localStorage.presets = JSON.stringify(MyPresets);
			console.log("DELETED PRESET", MyPresets, localStorage.presets);
		},
		
		// Use a Preset
		"api_req_hensei/preset_select":function(params, response, headers){
			var deckId = parseInt(params.api_deck_id, 10);
			PlayerManager.fleets[deckId-1].update( response.api_data );
			localStorage.fleets = JSON.stringify(PlayerManager.fleets);
			KC3Network.trigger("Fleet");
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
			KC3Network.trigger("Fleet");
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
		
		/*-------------------------------------------------------*/
		/*-------------------[ CONSTRUCTION ]--------------------*/
		/*-------------------------------------------------------*/
		
		/* Construct a Ship
		-------------------------------------------------------*/
		"api_req_kousyou/createship":function(params, response, headers){
			var 
				ctime    = (new Date(headers.Date)).getTime();
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
			var UTCtime = Math.hrdInt("floor",(new Date(headers.Date)).getTime(),3,1);
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
					KC3Network.trigger("Fleet");
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
			KC3Network.trigger("Fleet");
		},
		
		/* Change equipment of a ship
		-------------------------------------------------------*/
		"api_req_kaisou/slotset":function(params, response, headers){
			// Set params on variables for future understandability
			var itemID = params.api_item_id;
			var slotIndex = params.api_slot_idx;
			var shipID = params.api_id;
			KC3ShipManager.get(shipID).items[slotIndex] = itemID;
			KC3Network.trigger("Fleet");
		},
		
		/* Remove all equipment of a ship
		-------------------------------------------------------*/
		"api_req_kaisou/unsetslot_all":function(params, response, headers){
			KC3ShipManager.get( params.api_id ).items = [-1,-1,-1,-1];
			KC3Network.trigger("Fleet");
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
			KC3Network.trigger("Fleet");
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
			var UTCTime = Math.floor((new Date(headers.Date)).getTime()/1000);
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

				if (thisMap.curhp === 9999) {
					thisMap.curhp = response.api_data.api_eventmap.api_now_maphp;
					thisMap.maxhp = response.api_data.api_eventmap.api_max_maphp;
					localStorage.maps = JSON.stringify(AllMaps);
				}
			}

			KC3SortieManager.advanceNode( response.api_data, UTCTime );
			
			KC3Network.trigger("SortieStart");
			KC3Network.trigger("CompassResult");
			KC3Network.trigger("Quests");
		},
		
		/* Traverse Map
		-------------------------------------------------------*/
		"api_req_map/next":function(params, response, headers){
			var UTCTime = Math.floor((new Date(headers.Date)).getTime()/1000);
			KC3SortieManager.discardSunk();
			KC3SortieManager.advanceNode( response.api_data, UTCTime );
			KC3Network.trigger("CompassResult");
		},
		
		/* NORMAL: BATTLE STARTS
		-------------------------------------------------------*/
		"api_req_sortie/battle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_sortie/airbattle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_sortie/ld_airbattle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		
		/* COMBINED FLEET: BATTLE STARTS
		-------------------------------------------------------*/
		"api_req_combined_battle/battle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/airbattle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/battle_water":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/ld_airbattle":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		
		/* BATTLE STARTS as NIGHT
		-------------------------------------------------------*/
		"api_req_battle_midnight/sp_midnight":function(params, response, headers){
			KC3SortieManager.engageBattleNight(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		"api_req_combined_battle/sp_midnight":function(params, response, headers){
			KC3SortieManager.engageBattleNight(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
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
			KC3Network.trigger("Fleet");
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
				ctime    = (new Date(headers.Date)).getTime(),
				quest    = params.api_quest_id,
				data     = response.api_data,
				material = data.api_material,
				consume  = [0,0,0,0],
				bonuses  = data.api_bounus;
			
			console.log(quest,data);
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
		},
		
		/* Stop Quest
		-------------------------------------------------------*/
		"api_req_quest/stop":function(params, response, headers){
			
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
			KC3SortieManager.sortieTime = Math.hrdInt('floor',(new Date(headers.Date)).getTime(),3,1);
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
			var thisPvP = KC3SortieManager.currentNode();
			if(thisPvP.allyNoDamage && response.api_data.api_win_rank == "S")
				response.api_data.api_win_rank = "SS";
			
			resultScreenQuestFulfillment(response.api_data,true);
			
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
				ctime    = (new Date(headers.Date)).getTime(),
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
				ctime        = Math.hrdInt("floor",(new Date(headers.Date)).getTime(),3,1);
			
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
				ctime = (new Date(headers.Date)).getTime();
			
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
				ctime = (new Date(headers.Date)).getTime();
			$.each(params.api_slotitem_ids.split("%2C"), function(index, itemId){
				KC3GearManager.get(itemId).master().api_broken.forEach(function(x,i){
					rsc[i] += x;
				});
				KC3GearManager.remove( itemId );
			});
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
			for(ctr in response.api_data){
				thisMap = response.api_data[ctr];
				var key = "m"+thisMap.api_id;
				
				if(typeof (maps[key]||{}).curhp !== 'undefined')
					etcStat[key] = $.extend(true,{},defStat,maps[key].stat);
				
				// Create map object
				localMap = maps[ key ] = {
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
					localMap.stat       = $.extend(true,{},defStat,etcStat[ key ]);
					switch(eventData.api_gauge_type || 0) {
						case 0:
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
				if(typeof maps[key].dkind === 'undefined') {
					maps[key].dkind = maps[key].kind;
				}
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
				ctime  = (new Date(headers.Date)).getTime(),
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
				ct = (new Date(headers.Date)).getTime(),
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
			KC3GearManager.set([ response.api_data.api_after_slot ]);
			(response.api_data.api_use_slot_id || []).forEach(function(gearId){ KC3GearManager.remove(gearId); });
			
			PlayerManager.consumables.buckets = response.api_data.api_after_material[5];
			PlayerManager.consumables.devmats = response.api_data.api_after_material[6];
			PlayerManager.consumables.screws = response.api_data.api_after_material[7];
			PlayerManager.consumables.torch = response.api_data.api_after_material[4];
			KC3QuestManager.get(619).increment();
			KC3Network.trigger("Consumables");
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
				console.log("Quest ",r," progress ["+(q.tracking ? q.tracking[0] + '/' + q.tracking[1] : '-----')+"] ",q.status == 2);
				return q;
			};
		
		// If victory for "defeat"-type quests
		var rankPt = getRank(data.api_win_rank);
		if(rankPt==5 && KC3SortieManager.currentNode().allyNoDamage) rankPt++;
		if(!isPvP) {
			while(rankPt>=3) {
				switch(rankPt) {
					case 6: // PERFECT S
					case 5: // S
						KC3QuestManager.get(214).increment(3); // Bw1: 4th requirement: 6 S ranks (index:3)
						
						if(KC3SortieManager.currentNode().isBoss()) {
							switch(true) {
								case KC3SortieManager.isSortieAt(5,2):
									KC3QuestManager.get(243).increment(); // Bw9: Sortie to [W5-2] and S-rank the boss node 2 times
									break;
								case KC3SortieManager.isSortieAt(6,1):
									KC3QuestManager.get(256).increment(); // Bm2: Deploy to [W6-1] and obtain an S-rank the boss node 3 times
									break;
							}
						}
						break;
					case 4: // A
						if( KC3SortieManager.isSortieAt(1,5) && KC3SortieManager.currentNode().isBoss() ){
							KC3QuestManager.get(261).increment(); // Bw10: Sortie to [W1-5] and A-rank+ the boss node 3 times
							KC3QuestManager.get(265).increment(); // Bm5: Deploy a fleet to [W1-5] and A-rank+ the boss node 10 times
						}
						break;
					case 3: // B
						qLog(201).increment(); // Bd1: Defeat an enemy fleet
						KC3QuestManager.get(210).increment(); // Bd3: Defeat 10 abyssal fleets (B rank+)

						// Note: please make sure to place "isSortieAt(x,y)" earlier than any "isSortieAt(x)"
						// otherwise when "isSortieAt(x)" is satisfied, "isSortieAt(x,y)" will be shortcut-ed.
						if(KC3SortieManager.currentNode().isBoss()) {
							switch(true) {
								case KC3SortieManager.isSortieAt( 2 ):
									KC3QuestManager.get(226).increment(); // Bd7: Defeat 5 bosses in World 2
									break;
								case KC3SortieManager.isSortieAt(3,3):
								case KC3SortieManager.isSortieAt(3,4):
								case KC3SortieManager.isSortieAt(3,5):
									KC3QuestManager.get(241).increment(); // Bw7: Defeat 5 bosses in Worlds [W3-3], [W3-4] or [W3-5]
									break;
								case(KC3SortieManager.isSortieAt(4,4)):
									KC3QuestManager.get(242).increment(); // Bw8: Defeat a boss in World [W4-4]
									break;
								case KC3SortieManager.isSortieAt( 4 ):
									KC3QuestManager.get(229).increment(); // Bw6: Defeat 12 bosses in horned nodes in World 4
									break;
							}
							KC3QuestManager.get(214).increment(2); // Bw1: 3rd requirement: Win vs 12 bosses (index:2)
						}
						break;
					default: // DEFEAT
						break;
				}
				rankPt--;
			}
			// Vague quest that clears with no rank requirement
			qLog(216).increment(); // Bd2: Defeat the flagship of an enemy fleet
			
			// If node is a boss
			if( KC3SortieManager.currentNode().isBoss() ){
				qLog(214).increment(1); // Bw1: 2nd requirement: Encounter 24 bosses (index:1)
			}
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
