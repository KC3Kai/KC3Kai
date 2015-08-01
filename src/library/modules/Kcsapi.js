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
		
		/* Master Data
		-------------------------------------------------------*/
		"api_start2":function(params, response, headers){
			KC3Master.init( response.api_data );
			KC3Network.trigger("GameStart");
		},
		
		/* Home Port Screen
		-------------------------------------------------------*/
		"api_port/port":function(params, response, headers){	
			KC3Network.trigger("HomeScreen");
			
			KC3SortieManager.endSortie();
			
			PlayerManager.setHQ({
				mid: response.api_data.api_basic.api_member_id,
				name: response.api_data.api_basic.api_nickname,
				desc: response.api_data.api_basic.api_comment,
				rank: response.api_data.api_basic.api_rank,
				level: response.api_data.api_basic.api_level,
				exp: response.api_data.api_basic.api_experience
			});
			
			PlayerManager.consumables.fcoin = response.api_data.api_basic.api_fcoin;
			
			KC3ShipManager.clear();
			KC3ShipManager.set(response.api_data.api_ship);
			
			KC3GearManager.max = response.api_data.api_basic.api_max_slotitem;
			
			PlayerManager.setFleets( response.api_data.api_deck_port );
			PlayerManager.setRepairDocks( response.api_data.api_ndock );
			PlayerManager.buildSlots = response.api_data.api_basic.api_count_kdock;
			
			var UTCtime = Math.floor((new Date(headers.Date)).getTime()/1000);
			
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
			
			PlayerManager.combinedFleet = response.api_data.api_combined_flag;
			
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
					rate: response.api_data.api_war.api_rate,
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
		
		
		/*-------------------------------------------------------*/
		/*----------------------[ LIBRARY ]----------------------*/
		/*-------------------------------------------------------*/
		
		/* Ship lists
		-------------------------------------------------------*/
		"api_get_member/ship_deck":function(params, response, headers){
			KC3ShipManager.set(response.api_data.api_ship_data);
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
		
		/* Equipment list
		-------------------------------------------------------*/
		"api_get_member/slot_item": function(params, response, headers){
			KC3GearManager.clear();
			KC3GearManager.set( response.api_data );
		},
		
		/* Fleet list
		-------------------------------------------------------*/
		"api_get_member/deck":function(params, response, headers){
			PlayerManager.setFleets( response.api_data );
			KC3Network.trigger("Timers");
			KC3Network.trigger("Fleet");
		},
		
		/*-------------------------------------------------------*/
		/*-------------------[ CONSTRUCTION ]--------------------*/
		/*-------------------------------------------------------*/
		
		/* Construct a Ship
		-------------------------------------------------------*/
		"api_req_kousyou/createship":function(params, response, headers){
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
			KC3QuestManager.get(606).increment(); // F2: Daily Construction 1
			KC3QuestManager.get(608).increment(); // F4: Daily Construction 2
			KC3Network.trigger("Quests");
		},
		
		/* Construction Docks
		-------------------------------------------------------*/
		"api_get_member/kdock":function(params, response, headers){
			if(this.shipConstruction.active){
				var UTCtime = Math.floor((new Date(headers.Date)).getTime()/1000);
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
			if( KC3TimerManager.build( params.api_kdock_id ).lsc ){
				PlayerManager.consumables.torch-=10;
			}else{
				PlayerManager.consumables.torch--;
			}
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
			var ChangedIndex = parseInt(params.api_ship_idx);
			var ChangingShip = parseInt(params.api_ship_id);
			var OldSwaperSlot = flatShips.indexOf(ChangingShip); // move to slot
			var OldSwapeeSlot = flatShips[ (FleetIndex-1) * 6 + ChangedIndex ]; // swap from slot
			if(ChangingShip > -1){
				// If swapping on same fleet
				if(OldSwaperSlot >= 0){
					PlayerManager.fleets[Math.floor(OldSwaperSlot / 6)].ships[OldSwaperSlot % 6] = OldSwapeeSlot;
				}
				PlayerManager.fleets[FleetIndex-1].ships[ChangedIndex] = ChangingShip;
			}else{
				PlayerManager.fleets[FleetIndex-1].ships.splice(ChangedIndex, 1);
				PlayerManager.fleets[FleetIndex-1].ships.push(-1);
			}
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
			var shipList = response.api_data.api_ship;
			
			$.each(shipList, function( index, ship ) {
				var shipId = ship.api_id;
				var shipToSupply = KC3ShipManager.get(shipId);
				
				shipToSupply.fuel = ship.api_fuel;
				shipToSupply.ammo = ship.api_bull;
				shipToSupply.slots = ship.api_onslot;
			});
			
			KC3ShipManager.save();
			
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
		
		/* Start Sortie
		-------------------------------------------------------*/
		"api_req_map/start":function(params, response, headers){
			var UTCTime = Math.floor((new Date(headers.Date)).getTime()/1000);
			KC3SortieManager.startSortie(
				response.api_data.api_maparea_id,
				response.api_data.api_mapinfo_no,
				params.api_deck_id,
				UTCTime
			);
			
			KC3SortieManager.setBoss(
				response.api_data.api_bosscell_no,
				response.api_data.api_bosscomp
			);
			
			KC3QuestManager.get(214).increment(0); // Bw1: 1st requirement: Sortie 36 times (index:0)
			
			KC3SortieManager.advanceNode( response.api_data, UTCTime );
			
			KC3Network.trigger("SortieStart");
			KC3Network.trigger("CompassResult");
			KC3Network.trigger("Quests");
		},
		
		/* Traverse Map
		-------------------------------------------------------*/
		"api_req_map/next":function(params, response, headers){
			var UTCTime = Math.floor((new Date(headers.Date)).getTime()/1000);
			KC3SortieManager.advanceNode( response.api_data, UTCTime );
			KC3Network.trigger("CompassResult");
		},
		
		/* Battle Starts
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
		
		"api_req_combined_battle/battle_water":function(params, response, headers){
			KC3SortieManager.engageBattle(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		
		"api_req_battle_midnight/sp_midnight":function(params, response, headers){
			KC3SortieManager.engageBattleNight(
				response.api_data,
				Math.floor((new Date(headers.Date)).getTime()/1000)
			);
			KC3Network.trigger("BattleStart");
		},
		
		/* Yasen as second part of node battle
		-------------------------------------------------------*/
		"api_req_battle_midnight/battle":function(params, response, headers){
			KC3SortieManager.engageNight( response.api_data );
			KC3Network.trigger("BattleNight");
		},
		
		/* Battle Results
		-------------------------------------------------------*/
		"api_req_sortie/battleresult":function(params, response, headers){
			var
				getRank = function(r){ return ['E','D','C','B','A','S','SS'].indexOf(r); };
			
			// Vague quest that clears with no rank requirement
			if(response.api_data.api_destsf)
				KC3QuestManager.get(216).increment(); // Bd2: Defeat the flagship of an enemy fleet
			
			// If victory for "defeat"-type quests
			var rankPt = getRank(response.api_data.api_win_rank);
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
						KC3QuestManager.get(201).increment(); // Bd1: Defeat an enemy fleet
						KC3QuestManager.get(210).increment(); // Bd3: Defeat 10 abyssal fleets (B rank+)
						
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
								case KC3SortieManager.isSortieAt( 4 ):
									KC3QuestManager.get(229).increment(); // Bw6: Defeat 12 bosses in horned nodes in World 4
									break;
								case(KC3SortieManager.isSortieAt(4,4)):
									KC3QuestManager.get(242).increment(); // Bw8: Defeat a boss in World [W4-4]
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
			
			
			// If node is a boss
			if( KC3SortieManager.currentNode().isBoss() ){
				KC3QuestManager.get(214).increment(1); // Bw1: 2nd requirement: Encounter 24 bosses (index:1)
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
			
			KC3SortieManager.resultScreen( response.api_data );
			if(!ConfigManager.info_delta)
				KC3Network.trigger("HQ");
			KC3Network.trigger("BattleResult");
			KC3Network.trigger("Quests");
		},
		
		/* Combined Fleet Battle Results
		-------------------------------------------------------*/
		"api_req_combined_battle/battleresult":function(params, response, headers){
			KC3SortieManager.resultScreen( response.api_data );
			if(!ConfigManager.info_delta)
				KC3Network.trigger("HQ");
			KC3Network.trigger("BattleResult");
			KC3Network.trigger("Quests");
		},
		
		/*-------------------------------------------------------*/
		/*----------------------[ QUESTS ]-----------------------*/
		/*-------------------------------------------------------*/
		
		/* Quest List
		-------------------------------------------------------*/
		"api_get_member/questlist":function(params, response, headers){
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
			var ship_id = parseInt( params.api_ship_id , 10);
			var bucket = parseInt( params.api_highspeed , 10);
			var nDockNum = parseInt( params.api_ndock_id , 10);
			
			if(bucket==1){
				PlayerManager.consumables.buckets--;
				
				// If ship is still is the list being repaired, remove Her
				var HerRepairIndex = PlayerManager.repairShips.indexOf( ship_id );
				if(HerRepairIndex  > -1){
					PlayerManager.repairShips.splice(HerRepairIndex, 1);
				}
				KC3ShipManager.get( ship_id ).hp[0] = KC3ShipManager.get( ship_id ).hp[1];
				KC3TimerManager.repair( nDockNum ).deactivate();
			}
			
			KC3QuestManager.get(503).increment(); // E3: Daily Repairs
			KC3Network.trigger("Quests");
			KC3Network.trigger("Fleet");
		},
		
		/* Use bucket
		-------------------------------------------------------*/
		"api_req_nyukyo/speedchange":function(params, response, headers){
			PlayerManager.consumables.buckets--;
			KC3Network.trigger("Consumables");
			KC3Network.trigger("Timers");
		},
		
		/*-------------------------------------------------------*/
		/*-----------------------[ PVP ]-------------------------*/
		/*-------------------------------------------------------*/
		
		/* PVP Start
		-------------------------------------------------------*/
		"api_req_practice/battle":function(params, response, headers){
			KC3Network.trigger("PvPStart", {
				battle: response.api_data,
				fleetSent: params.api_deck_id
			});
		},
		
		/* PVP Start
		-------------------------------------------------------*/
		"api_req_practice/midnight_battle":function(params, response, headers){
			KC3Network.trigger("PvPNight", { battle: response.api_data });
		},
		
		/* PVP Result
		-------------------------------------------------------*/
		"api_req_practice/battle_result":function(params, response, headers){
			KC3QuestManager.get(303).increment(); // C2: Daily Exercises 1
			
			// If victory
			if(["A","B","S","SS"].indexOf(response.api_data.api_win_rank) > -1){
				KC3QuestManager.get(304).increment(); // C3: Daily Exercises 2
				KC3QuestManager.get(302).increment(); // C4: Weekly Exercises
			}
			
			KC3Network.trigger("PvPEnd", { result: response.api_data });
			KC3Network.trigger("Quests");
		},
		
		/*-------------------------------------------------------*/
		/*--------------------[ EXPEDITION ]---------------------*/
		/*-------------------------------------------------------*/
		
		/* Complete Expedition
		-------------------------------------------------------*/
		"api_req_mission/result":function(params, response, headers){
			// If success or great success
			if(response.api_data.api_clear_result > 0){
				KC3QuestManager.get(402).increment(); // D2: Daily Expeditions 1
				KC3QuestManager.get(403).increment(); // D3: Daily Expeditions 2
				KC3QuestManager.get(404).increment(); // D4: Weekly Expeditions
				
				// If expedition 37 or 38
				var expedNum = KC3TimerManager._exped[ parseInt(params.api_deck_id, 10)-2 ].expedNum;
				expedNum = parseInt(expedNum, 10);
				if(expedNum==37 || expedNum==38){
					KC3QuestManager.get(410).increment(); // D9: Weekly Expedition 2
					KC3QuestManager.get(411).increment(); // D11: Weekly Expedition 3
				}
				KC3Network.trigger("Quests");
			}
		},
		
		/*-------------------------------------------------------*/
		/*---------------------[ ARSENAL ]-----------------------*/
		/*-------------------------------------------------------*/
		
		/* Craft Equipment
		-------------------------------------------------------*/
		"api_req_kousyou/createitem":function(params, response, headers){
			var resourceUsed = [ params.api_item1, params.api_item2, params.api_item3, params.api_item4 ];
			var failed = (typeof response.api_data.api_slot_item == "undefined");
			
			// Log into development History
			KC3Database.Develop({
				flag: PlayerManager.fleets[0].ship(0).masterId,
				rsc1: resourceUsed[0],
				rsc2: resourceUsed[1],
				rsc3: resourceUsed[2],
				rsc4: resourceUsed[3],
				result: (!failed)?response.api_data.api_slot_item.api_slotitem_id:-1,
				time: Math.floor((new Date(headers.Date)).getTime()/1000)
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
			}
			
			KC3Network.trigger("Quests");
		},
		
		/* Scrap a Ship
		-------------------------------------------------------*/
		"api_req_kousyou/destroyship":function(params, response, headers){
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
			$.each(params.api_slotitem_ids.split("%2C"), function(index, itemId){
				KC3GearManager.remove( itemId );
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
			var maps = {};
			var ctr, thisMap;
			for(ctr in response.api_data){
				thisMap = response.api_data[ctr];
				
				// Create map object
				maps[ "m"+thisMap.api_id ] = {
					id: thisMap.api_id,
					clear: thisMap.api_cleared
				};
				
				// Check for boss gauge kills
				if(typeof thisMap.api_defeat_count != "undefined"){
					maps[ "m"+thisMap.api_id ].kills = thisMap.api_defeat_count;
				}
				
				// Check for event map info
				if(typeof thisMap.api_eventmap != "undefined"){
					maps[ "m"+thisMap.api_id ].curhp = thisMap.api_eventmap.api_now_maphp;
					maps[ "m"+thisMap.api_id ].maxhp = thisMap.api_eventmap.api_max_maphp;
					maps[ "m"+thisMap.api_id ].difficulty = thisMap.api_eventmap.api_selected_rank;
				}
			}
			localStorage.maps = JSON.stringify(maps);
		},
		
		/* Ship Modernize
		-------------------------------------------------------*/
		"api_req_kaisou/powerup":function(params, response, headers){
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
			KC3Network.trigger("Fleet");
		},
		
		/* Equipment Modernize
		-------------------------------------------------------*/
		"api_req_kousyou/remodel_slot":function(params, response, headers){
			// Update equipment on local data
			KC3GearManager.set([ response.api_data.api_after_slot ]);
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
	
})();