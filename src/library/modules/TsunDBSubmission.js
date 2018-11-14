/**
 * TsunDBSubmission.js
 *
 * KC3Kai routing, enemies, drops, AACI kinds and developments data submission module.
 */
(function(){
	"use strict";
	
	window.TsunDBSubmission = {
		celldata : {
			map: null,
			difficulty: null,
			amountOfNodes: null,
			cleared: null,
			celldata: []
		},
		eventreward : {
			map: null,
			difficulty: null,
			rewards: []
		},
		data : {
			map: null,
			hqLvl: null,
			cleared: null,
			fleetType: 0,
			fleet1: [],
			fleet2: [],
			sortiedFleet: 1,
			fleetSpeed: null,
			edgeID: [],
			los: [],
			nodeInfo: {
				nodeType: null,
				eventId: null,
				eventKind: null,
				nodeColor: null,
				amountOfNodes: null,
				itemGet: []
			},
			nextRoute: null,
			currentMapHP: null,
			maxMapHP: null,
			difficulty: null,
			gaugeNum: null,
			gaugeType: null,
			debuffSound: null
		},
		enemyComp: {
			map: null,
			node: null,
			hqLvl: null,
			difficulty: null,
			enemyComp: null,
			airBattle: null,
		},
		friendlyFleet: {
			map: null,
			node: null,
			difficulty: null,
			gaugeNum: null,
			variation: null,
			fleet: null,
			uniquekey: null
		},
		shipDrop : {
			map: null,
			node: null,
			rank: null,
			cleared: null,
			enemyComp: null,
			hqLvl: null,
			difficulty: null,
			ship: null,
			counts: null
		},
		aaci : {
			shipPossibleAACI: null,
			triggeredAACI: null,
			badAACI: null,
			ship: {
				id: null,
				lvl: null,
				damage: null,
				aa: null,
				luck: null
			},
			shipPosition: null,
			equips: null,
			improvements: null,
			kc3version: null
		},
		unexpectedDamage : {
			map: null,
			edgeID: null,
			difficulty: null,
			debuffed: null,
			cleared: null,
			engagement: null,
			damageInstance: {
				actualDamage: null,
				expectedDamage: null,
				isCritical: null,
			},
			ship: {
				id: null, 
				damageStatus: null,
				equip: null,
				improvements: null,
				proficiency: null,
				slots: null,
				stats: null,
				position: null,
				formation: null,
				isMainFleet: null,
				combinedFleet: null,
				rAmmoMod: null,
				spAttackType: null,
				cutinEquips: null,
				shellingPower: null,
				armorReduction: null,
				precapPower: null,
				postcapPower: null,
				time: null,
			},
			enemy: {
				id: null,
				equip: null,
				formation: null,
				position: null,
				armor: null,
				isMainFleet: null,
			},
			kc3version: null,
		},
		gunfit: {
			misc: {
				username: null,
				id: null,
				map: null,
				edge: null,
				kc3version: null,
				formation: null,
				eformation: null,
			},
			ship: {
				id: null,
				lv: null,
				position: null,
				morale: null,
				luck: null,
				equips: null,
				improvements: null,
			},
			accVal: null,
			api_cl: null,
			enemy: null,
			spAttackType: null,
			time: null,
		},
		development : {
			hqLvl: null,
			flagship: {},
			resources: {},
			result: null,
			success: null
		},
		handlers : {},
		mapInfo : [],
		currentMap : [0, 0],
		
		init: function () {
			this.handlers = {
				'api_get_member/mapinfo': this.processMapInfo,
				'api_req_map/select_eventmap_rank': this.processSelectEventMapRank,
				
				'api_req_map/start': this.processStart,
				'api_req_map/next': this.processNext,
				
				'api_req_sortie/battle': [this.processEnemy, this.processAACI, this.processGunfit],
				'api_req_sortie/airbattle': this.processEnemy,
				'api_req_sortie/night_to_day': [this.processEnemy, this.processFriendlyFleet],
				'api_req_sortie/ld_airbattle': this.processEnemy,
				// Night only: `sp_midnight`, Night starts as 1st part then day part: `night_to_day`
				'api_req_battle_midnight/sp_midnight': [this.processEnemy, this.processFriendlyFleet],
				'api_req_combined_battle/airbattle': this.processEnemy,
				'api_req_combined_battle/battle': this.processEnemy,
				'api_req_combined_battle/sp_midnight': [this.processEnemy, this.processFriendlyFleet],
				'api_req_combined_battle/battle_water': this.processEnemy,
				'api_req_combined_battle/ld_airbattle': this.processEnemy,
				'api_req_combined_battle/ec_battle': this.processEnemy,
				'api_req_combined_battle/each_battle': this.processEnemy,
				'api_req_combined_battle/each_airbattle': this.processEnemy,
				'api_req_combined_battle/each_sp_midnight': [this.processEnemy, this.processFriendlyFleet],
				'api_req_combined_battle/each_battle_water': this.processEnemy,
				'api_req_combined_battle/ec_night_to_day': [this.processEnemy, this.processFriendlyFleet],
				'api_req_combined_battle/each_ld_airbattle': this.processEnemy,
				// Night battles as 2nd part following day part:
				'api_req_battle_midnight/battle': [this.processFriendlyFleet, this.processGunfit],
				'api_req_combined_battle/midnight_battle': this.processFriendlyFleet,
				'api_req_combined_battle/ec_midnight_battle': this.processFriendlyFleet,
				// PvP battles are excluded intentionally
				
				'api_req_sortie/battleresult': [this.processDrop, this.processUnexpected],
				'api_req_combined_battle/battleresult': [this.processDrop, this.processUnexpected],
				// PvP battle_result excluded intentionally
				
				// Development related
				'api_req_kousyou/createitem': this.processDevelopment
			};
			this.manifest = chrome.runtime.getManifest() || {};
			this.updateGunfitsIfNeeded();
		},
		
		processMapInfo: function(http) {
			this.mapInfo = $.extend(true, [], http.response.api_data.api_map_info);
		},
		
		processSelectEventMapRank: function(http) {
			const apiData = http.response.api_data;
			const mapId = [http.params.api_maparea_id, http.params.api_map_no].join('');
			const eventMapInfo = (this.mapInfo.find(i => i.api_id == mapId) || {}).api_eventmap;
			if(eventMapInfo) {
				eventMapInfo.api_selected_rank = Number(http.params.api_rank);
				if(apiData && apiData.api_maphp) {
					eventMapInfo.api_max_maphp = Number(apiData.api_maphp.api_max_maphp);
					eventMapInfo.api_now_maphp = Number(apiData.api_maphp.api_now_maphp);
					eventMapInfo.api_gauge_num = Number(apiData.api_maphp.api_gauge_num);
					eventMapInfo.api_gauge_type = Number(apiData.api_maphp.api_gauge_type);
				}
			}
		},
		
		processCellData: function(http){
			const apiData = http.response.api_data;
			this.celldata.amountOfNodes = apiData.api_cell_data.length;
			this.celldata.celldata = apiData.api_cell_data;
			
			// Processed values from processStart and processMapInfo
			this.celldata.map = this.data.map;
			const mapData = this.mapInfo.find(i => i.api_id == this.currentMap.join('')) || {};
			this.celldata.cleared = mapData.api_cleared;
			if(mapData.api_eventmap) {
				this.celldata.difficulty = mapData.api_eventmap.api_selected_rank;
			}
			
			this.sendData(this.celldata, 'celldata');
		},
		
		processStart: function(http) {
			this.cleanOnStart();
			const apiData = http.response.api_data;
			this.data.sortiedFleet = Number(http.params.api_deck_id);
			this.data.fleetType = PlayerManager.combinedFleet;
			
			// Sets amount of nodes value in NodeInfo
			this.data.nodeInfo.amountOfNodes = apiData.api_cell_data.length;
			
			// Sets the map value
			const world = Number(apiData.api_maparea_id);
			const map = Number(apiData.api_mapinfo_no);
			this.currentMap = [world, map];
			this.data.map = this.currentMap.join('-');
			
			this.processCellData(http);
			this.processNext(http);
			
			// Statistics of owned ships by base form ID
			KC3ShipManager.find(ship => {
				const baseFormId = RemodelDb.originOf(ship.masterId);
				this.shipDrop.counts[baseFormId] = 1 + (this.shipDrop.counts[baseFormId] || 0);
				return false; // no ship wanted to find
			});
		},
		
		processNext: function(http) {
			if(!this.currentMap[0] || !this.currentMap[1]) { return; }
			this.cleanOnNext();
			const apiData = http.response.api_data;
			
			// Sets player's HQ level
			this.data.hqLvl = PlayerManager.hq.level;
			
			// Sets the map id
			const mapId = this.currentMap.join('');
			const mapData = this.mapInfo.find(i => i.api_id == mapId) || {};
			
			// Sets whether the map is cleared or not
			this.data.cleared = mapData.api_cleared;
			
			// Charts the route array using edge ids as values
			this.data.edgeID.push(apiData.api_no);
			
			// All values related to node types
			this.data.nodeInfo.nodeType = apiData.api_color_no;
			this.data.nodeInfo.eventId = apiData.api_event_id;
			this.data.nodeInfo.eventKind = apiData.api_event_kind;
			this.data.nodeInfo.nodeColor = apiData.api_color_no;
			this.data.nodeInfo.itemGet = apiData.api_itemget || [];
			
			// Checks whether the fleet has hit a dead end or not
			this.data.nextRoute = apiData.api_next;
			
			this.data.fleet1 = this.handleFleet(PlayerManager.fleets[this.data.sortiedFleet - 1]);
			if(this.data.fleetType > 0 && this.data.sortiedFleet === 1) {
				this.data.fleet2 = this.handleFleet(PlayerManager.fleets[1]);
			}
			
			// Sets all the event related values
			if(apiData.api_eventmap) {
				const mapStorage = KC3SortieManager.getCurrentMapData(this.currentMap[0], this.currentMap[1]);
				
				this.data.currentMapHP = apiData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = apiData.api_eventmap.api_max_maphp;
				this.data.difficulty = mapData.api_eventmap.api_selected_rank;
				this.data.gaugeNum = mapData.api_eventmap.api_gauge_num || 1;
				this.data.gaugeType = mapData.api_eventmap.api_gauge_type;
				this.data.debuffSound = mapStorage.debuffSound;
				
				this.sendData(this.data, 'eventrouting');
			} else {
				// This is made to support the old schema for the routing. This will be deprecated in the future.
				const oldFormatData = $.extend(true, {}, this.data);
				delete oldFormatData.nodeInfo;
				oldFormatData.nodeType = this.data.nodeInfo.nodeType;
				oldFormatData.eventId = this.data.nodeInfo.eventId;
				oldFormatData.eventKind = this.data.nodeInfo.eventKind;
				
				this.sendData(oldFormatData, 'routing');
			}
			
			// Send Land-base Air Raid enemy compos
			if(apiData.api_destruction_battle) {
				this.processEnemy(http, apiData.api_destruction_battle);
			}
		},
		
		processFriendlyFleet: function(http){
			const apiData = http.response.api_data;
			const friendlyInfo = apiData.api_friendly_info;

			if(!friendlyInfo || !this.currentMap[0] || !this.currentMap[1]) { return; }
			this.friendlyFleet = {};
			
			this.friendlyFleet.map = this.data.map;
			this.friendlyFleet.node = this.data.edgeID[this.data.edgeID.length - 1];
			this.friendlyFleet.difficulty = this.data.difficulty;
			this.friendlyFleet.gaugeNum = this.data.gaugeNum;
			this.friendlyFleet.variation = friendlyInfo.api_production_type;
			this.friendlyFleet.fleet = {
				ship: friendlyInfo.api_ship_id,
				lvl: friendlyInfo.api_ship_lv,
				hp: friendlyInfo.api_maxhps,
				nowhp: friendlyInfo.api_nowhps,
				stats: friendlyInfo.api_Param,
				equip: friendlyInfo.api_Slot
			};
			let uniqueSerialKey = "";
			for(const i in this.friendlyFleet.fleet.ship) {
				let accumulated = this.friendlyFleet.fleet.ship[i]
					+ this.friendlyFleet.fleet.lvl[i]
					+ this.friendlyFleet.fleet.nowhp[i];
				for(const v of this.friendlyFleet.fleet.stats[i]) {
					accumulated += v;
				}
				for(const v of this.friendlyFleet.fleet.equip[i]) {
					accumulated += v;
				}
				uniqueSerialKey += String(accumulated);
			}
			this.friendlyFleet.uniquekey = uniqueSerialKey;
			this.sendData(this.friendlyFleet, 'friendlyfleet');
		},
		
		processEnemy: function(http, airRaidData) {
			if(!this.currentMap[0] || !this.currentMap[1]) { return; }
			const apiData = airRaidData || http.response.api_data;
			this.enemyComp = {};
			
			this.enemyComp.map = this.data.map;
			this.enemyComp.node = this.data.edgeID[this.data.edgeID.length - 1];
			this.enemyComp.hqLvl = this.data.hqLvl;
			this.enemyComp.difficulty = this.data.difficulty;
			this.enemyComp.enemyComp = {
				ship: apiData.api_ship_ke,
				lvl: apiData.api_ship_lv,
				hp: apiData.api_e_maxhps,
				// No api_eParam for LB air raid
				stats: apiData.api_eParam || [],
				equip: apiData.api_eSlot,
				formation: apiData.api_formation[1]
			};
			if(apiData.api_ship_ke_combined) {
				this.enemyComp.enemyComp.shipEscort = apiData.api_ship_ke_combined;
				this.enemyComp.enemyComp.lvlEscort = apiData.api_ship_lv_combined;
				this.enemyComp.enemyComp.hpEscort = apiData.api_e_maxhps_combined;
				this.enemyComp.enemyComp.statsEscort = apiData.api_eParam_combined;
				this.enemyComp.enemyComp.equipEscort = apiData.api_eSlot_combined;
			}
			if(airRaidData) {
				this.enemyComp.enemyComp.isAirRaid = true;
			}
			
			this.enemyComp.airBattle = null;
			// Process airbattle (if any)
			if(apiData.api_kouku || apiData.api_air_base_attack) {
				const isLandBase = !!apiData.api_air_base_attack;
				const buildAirBattleData = (koukuApi) => {
					const obj = {
						total: koukuApi.api_stage1.api_e_count,
						lost: koukuApi.api_stage1.api_e_lostcount,
						state: koukuApi.api_stage1.api_disp_seiku,
					};
					// api_stage2 can be null, bomber count can also be 0 during air_base_attack
					if(koukuApi.api_stage2) {
						obj.bomber = koukuApi.api_stage2.api_e_count;
					}
					return obj;
				};
				const buildShipFromBase = (baseInfo, squadronPlanes) => {
					const obj = new KC3Ship();
					// Simulate 1 land-base as a carrier, ensure it's not a dummy ship
					obj.rosterId = 1;
					obj.masterId = 83;
					obj.items = baseInfo.planes.map(planeInfo => planeInfo.api_state === 1 ? planeInfo.api_slotid : -1);
					// Get latest exact count from API instead of land-base setup
					obj.slots = squadronPlanes.map(plane => plane.api_count || 0);
					return obj;
				};
				
				const koukuApi = !isLandBase ? apiData.api_kouku : !airRaidData ? apiData.api_air_base_attack[0] : airRaidData.api_air_base_attack;
				const airBattle = buildAirBattleData(koukuApi);
				airBattle.landBase = isLandBase;
				airBattle.jetPhase = !!(apiData.api_air_base_injection || apiData.api_injection_kouku);
				
				let fp = 0;
				const bases = PlayerManager.bases.filter(b => b.map === this.currentMap[0]);
				
				// Get interception power of all land-bases involved in air raid
				if(airRaidData) {
					airBattle.planes = [];
					airBattle.slots = [];
					airBattle.proficiency = [];
					(koukuApi.api_plane_from[0] || []).forEach(baseId => {
						const baseInfo = bases[baseId - 1];
						const squadronPlanes = koukuApi.api_map_squadron_plane[baseId] || [];
						const shipObj = buildShipFromBase(baseInfo, squadronPlanes);
						const planes = squadronPlanes.map(plane => plane.api_mst_id || -1);
						const proficiency = shipObj.equipment().map(g => g.ace);
						airBattle.planes.push(planes);
						airBattle.slots.push(shipObj.slots);
						airBattle.proficiency.push(proficiency);
						fp += shipObj.interceptionPower();
						
						if(koukuApi.api_stage3) {
							airBattle.bakFlag = koukuApi.api_stage3.api_fbak_flag || [];
							airBattle.raiFlag = koukuApi.api_stage3.api_frai_flag || [];
							airBattle.fclFlag = koukuApi.api_stage3.api_fcl_flag || [];
							airBattle.damage = koukuApi.api_stage3.api_fdam;
						}
					});
				}
				
				// Get sortie power of the land-base involved in the first wave
				else if(isLandBase && !airRaidData) {
					const baseInfo = bases[koukuApi.api_base_id - 1];
					const squadronPlanes = koukuApi.api_squadron_plane || [];
					const shipObj = buildShipFromBase(baseInfo, squadronPlanes);
					// fp will be an Array[2]
					fp = shipObj.fighterBounds(true);
				}
				
				// Get fighter power of sortied fleet(s)
				else {
					// fp will be an Array[2]
					fp = PlayerManager.fleets[this.data.sortiedFleet - 1].fighterBounds();
					// Sum fighter power from escort fleet if abyssal combined too
					if(apiData.api_ship_ke_combined && this.data.fleetType > 0 && this.data.sortiedFleet === 1) {
						const escortFp = PlayerManager.fleets[1].fighterBounds();
						fp.forEach((val, idx) => { fp[idx] = val + escortFp[idx]; });
					}
				}
				
				airBattle.fighterPower = fp;
				this.enemyComp.airBattle = airBattle;
			}
			
			this.sendData(this.enemyComp, 'enemy-comp');
		},
		
		processEventReward: function(http){
			const apiData = http.response.api_data;
			
			this.eventreward.map = this.data.map;
			this.eventreward.difficulty = this.data.difficulty;
			this.eventreward.rewards = apiData.api_get_eventitem;
			
			this.sendData(this.eventreward, 'eventreward');
		},
		
		processDrop: function(http) {
			if(!this.currentMap[0] || !this.currentMap[1]) { return; }
			const apiData = http.response.api_data;
			if(apiData.api_get_eventitem !== undefined) {
				this.processEventReward(http);
			}
			const lastShipCounts = this.shipDrop.counts || {};
			this.shipDrop = {};
			
			this.shipDrop.map = this.data.map;
			this.shipDrop.node = this.data.edgeID[this.data.edgeID.length - 1];
			this.shipDrop.rank = apiData.api_win_rank;
			this.shipDrop.cleared = this.data.cleared;
			// Enemy comp name and exp only existed in result API data
			if(this.enemyComp.enemyComp && !this.enemyComp.enemyComp.isAirRaid) {
				this.enemyComp.enemyComp.mapName = apiData.api_quest_name;
				this.enemyComp.enemyComp.compName = apiData.api_enemy_info.api_deck_name;
				this.enemyComp.enemyComp.baseExp = apiData.api_get_base_exp;
				this.shipDrop.enemyComp = this.enemyComp.enemyComp;
			}
			this.shipDrop.hqLvl = this.data.hqLvl;
			this.shipDrop.difficulty = this.data.difficulty;
			this.shipDrop.counts = lastShipCounts;
			this.shipDrop.ship = apiData.api_get_ship ? apiData.api_get_ship.api_ship_id : -1;
			
			// Effectively prevents a submission from happening,
			// if it turns out a no drop happened due to max slots or equipment
			if(this.shipDrop.ship === -1
				&& (KC3ShipManager.count() >= KC3ShipManager.max
				 || KC3GearManager.count() >= KC3GearManager.max - 3)
			) { return; }
			this.sendData(this.shipDrop, 'drops');
			
			// To avoid iterating all ships every time,
			// and KC3ShipManager may not be updated until next `api_get_member/ship_deck` call.
			if(this.shipDrop.ship > 0){
				// Basically not need this converting, but once a time KC devs made a Fusou Kai Ni drop bug
				const baseFormId = RemodelDb.originOf(this.shipDrop.ship);
				this.shipDrop.counts[baseFormId] = 1 + (this.shipDrop.counts[baseFormId] || 0);
			}
		},

		processAACI: function(http) {
			const apiData = http.response.api_data;
			this.aaci = {};

			const sortiedFleet = Number(apiData.api_deck_id);
			const fleetType = PlayerManager.combinedFleet;

			if(fleetType > 0 && sortiedFleet === 1) {
				// Ignore combined fleets (for now)
				return;
			}

			if(!apiData.api_kouku || !apiData.api_kouku.api_stage2 || !apiData.api_kouku.api_stage2.api_e_count) {
				// No enemy planes in phase 2, no AACI possible
				return;
			}

			const fleet = PlayerManager.fleets[sortiedFleet - 1];

			const possibleAACIs = fleet.ship().map(ship => !ship.isAbsent() && AntiAir.shipPossibleAACIs(ship).map(id => Number(id)));
			//console.log("[TsunDB AACI] Possible AACI", possibleAACIs);
			const aaciCount = possibleAACIs.filter(arr => arr.length).length;
			if(aaciCount > 1) {
				// Don't log multiple AACI ships
				return;
			}

			this.aaci.shipPosition = possibleAACIs.findIndex(arr => arr.length);

			// api_kouku2 is ignored
			const apiAir = apiData.api_kouku.api_stage2.api_air_fire;
			if(apiAir) {
				// Triggered
				const idx = apiAir.api_idx;
				this.aaci.triggeredAACI = apiAir.api_kind;

				if(idx != this.aaci.shipPosition) {
					console.warn(`[TsunDB AACI] Wrong ship position ${idx}, expected ${this.aaci.shipPosition}! Unknown AACI?`);
					this.aaci.shipPosition = idx;
				}
			} else {
				// Not triggered
				this.aaci.triggeredAACI = -1;
			}

			if(aaciCount === 0 && this.aaci.triggeredAACI <= 0) {
				// Keep logging when none expected but one triggered
				return;
			}

			this.aaci.shipPossibleAACI = possibleAACIs[this.aaci.shipPosition];
			this.aaci.badAACI = this.aaci.triggeredAACI > 0 && !this.aaci.shipPossibleAACI.includes(this.aaci.triggeredAACI);

			const triggeredShip = fleet.ship()[this.aaci.shipPosition];
			this.aaci.ship = {
				id: triggeredShip.masterId,
				lvl: triggeredShip.level,
				damage: Math.ceil(triggeredShip.hp[0] / triggeredShip.hp[1] * 4),
				aa: triggeredShip.estimateNakedStats("aa"),
				luck: triggeredShip.lk[0]
			};

			this.aaci.equips = triggeredShip.equipment(true).map(g => g.masterId || -1);
			this.aaci.improvements = triggeredShip.equipment(true).map(g => g.stars || -1);
			this.aaci.kc3version = this.manifest.version + ("update_url" in this.manifest ? "" : "d");

			this.sendData(this.aaci, 'aaci');
		},
		
		processUnexpected: function(http){
			const thisNode = KC3SortieManager.currentNode();
			const unexpectedList = thisNode.unexpectedList;
			if(!unexpectedList || !unexpectedList.length) { return; }
			const template = {
				cleared: !!this.data.cleared,
				edgeID: thisNode.id,
				map: this.data.map,
				difficulty: this.data.difficulty,
				kc3version: this.manifest.version + ("update_url" in this.manifest ? "" : "d")
			};
			unexpectedList.forEach(a => {
				if(a.isUnexpected || a.landFlag || (thisNode.isBoss() && KC3Meta.isEventWorld(this.currentMap[0]))) {
					this.unexpectedDamage = Object.assign({}, a, template);
					delete this.unexpectedDamage.landFlag;
					delete this.unexpectedDamage.isUnexpected;
					this.sendData(this.unexpectedDamage, 'abnormal');
				}
			});
		},

		processGunfit: function(){
			this.gunfit = {};
			const thisNode = KC3SortieManager.currentNode();
			if (!(["1-1","1-2"].includes(this.data.map) && [1,3].includes(thisNode.id) && ConfigManager.TsunDBSubmissionExtra_enabled)) { return; }
			this.updateGunfitsIfNeeded();

			// Leave it as single-fleet check for now
			const fleet = PlayerManager.fleets[this.data.sortiedFleet - 1];
			const battleLog = (thisNode.predictedFleetsNight || thisNode.predictedFleetsDay || {}).playerMain;
			const template = { 
				username: PlayerManager.hq.name,
				id: PlayerManager.hq.id,
				map: this.data.map,
				edge: thisNode.id,
				kc3version: this.manifest.version + ("update_url" in this.manifest ? "" : "d"),
			};
			const battleData = thisNode.battleDay || thisNode.battleNight;
			template.formation = battleData.api_formation[0];
			template.eformation = battleData.api_formation[1];
			const initialMorale = KC3SortieManager.initialMorale;
			
			// Implementing phase tagging to attacks in the future, so this part may need to be updated later
			for (var idx = 0; idx < fleet.ships.length; idx++) {
				const ship = fleet.ship(idx);
				if (ship.isDummy()) { continue; }
				const testId = this.checkGunFitsRequirements(ship);
				if (testId >= 0) {
					const template2 = Object.assign({}, { misc: template, ship: { id:ship.masterId, lv: ship.level, position: idx, morale: initialMorale[idx], luck: ship.lk[0],
						equips: ship.equipment(true).map(g => g.masterId || -1), improvements: ship.equipment(true).map(g => g.stars || -1), }, testId: testId });
					const formMod = ship.estimateShellingFormationModifier(template2.formation, template2.eformation, 'accuracy');
					const accVal = ship.shellingAccuracy(formMod, false);
					template2.accVal = accVal.basicAccuracy;
					const shipLog = battleLog[idx].attacks;

					for (var i = 0; i < shipLog.length; i++) {
						const attack = shipLog[i];
						for (var j = 0; j < attack.acc.length; j++) {
							this.gunfit = Object.assign({}, template2, { api_cl: attack.acc[j], enemy: thisNode.eships[attack.target[j]], 
								spAttackType: attack.cutin >= 0 ? attack.cutin : attack.ncutin, time : attack.cutin >= 0 ? 'day' : 'yasen' });
							this.sendData(this.gunfit, 'fits');
						}
					}
				}
			}
		},

		processDevelopment: function(http){
			this.cleanNonCombat();
			const request = http.params;
			const response = http.response.api_data;
			
			this.development.hqLvl = PlayerManager.hq.level;
			this.development.flagship = {
				id: PlayerManager.fleets[0].ship(0).masterId,
				type: PlayerManager.fleets[0].ship(0).master().api_stype,
				lvl: PlayerManager.fleets[0].ship(0).level
			};
			this.development.resources = {
				fuel: request.api_item1,
				ammo: request.api_item2,
				steel: request.api_item3,
				bauxite: request.api_item4
			};
			this.development.result = response.api_create_flag ?
				response.api_slot_item.api_slotitem_id :
				Number(response.api_fdata.split(',')[1]);
			this.development.success = response.api_create_flag;
			//console.debug(this.development);
			this.sendData(this.development, 'development');
		},
		
		handleFleet: function(fleet) {
			// Update fleet minimal speed
			fleet.speed();
			// Slow fleet wins over fast
			this.data.fleetSpeed = Math.min(this.data.fleetSpeed, fleet.minSpeed);
			// F33 Cn 1,2,3 & 4
			[1,2,3,4].forEach(i => { this.data.los[i - 1] += fleet.eLos4(i); });
			return fleet.ship().map(ship => ({
				id : ship.master().api_id,
				name: ship.master().api_name,
				shiplock: ship.sally,
				level: ship.level,
				type: ship.master().api_stype,
				speed: ship.speed,
				flee: ship.didFlee,
				slots: ship.api_slot_num,
				equip: ship.equipment(false).map(gear => gear.masterId || -1),
				exslot: ship.exItem().masterId || -1
			}));
		},

		updateGunfitsIfNeeded: function(callback) {
			let currentTime = Math.floor(new Date().getTime() / 3600 / 1000);

			if(localStorage.tsundb_gunfits != undefined) {
				let gf = JSON.parse(localStorage.tsundb_gunfits);
				if (gf.updateTime + 3 > currentTime) // Cache for ~3h
					return;
			}
			$.getJSON(`https://raw.githubusercontent.com/Tibo442/TsunTools/master/config/gunfits.json?cache=${currentTime}`, function(newGunfits) {
				if(callback)
					callback(newGunfits);

				localStorage.tsundb_gunfits = JSON.stringify({
					tests: newGunfits,
					updateTime: currentTime
				});
			});
		},

		/*
		* Returns: 
		*   i: index of test (>= 0) matches test and morale
		*  -1: matches a test but not morale
		*  -2: doesn't match a test
		* 
		* Eg: if(checkGunFitsRequirements(ship) < 0) continue;
		*/
		checkGunFitsRequirements: function(ship) {
			if(localStorage.tsundb_gunfits == undefined)
				return -2;
			
			let status = -2;
			let tests = JSON.parse(localStorage.tsundb_gunfits).tests;

			const onClick = e => {
				(new RMsg("service", "strategyRoomPage", {
					tabPath: "gunfits"
				})).execute();
				return false;
			};

			for(let testId in tests) {
				let testStatus = this.checkGunFitTestRequirements(ship, tests[testId]);

				if(testStatus == 0) {
					if (!tests[testId].active) {
						KC3Network.trigger("ModalBox", {
							title: KC3Meta.term("TsunDBTestInactiveTitle"),
							message: KC3Meta.term("TsunDBTestInactiveMessage"),
							link: KC3Meta.term("TsunDBTestLink"),
							onClick: onClick
						});
					}
					return parseInt(testId);
				}

				status = Math.max(status, testStatus);
			}
			
			return status;
		},
		/*
		* Returns: 
			0: matches test and morale
			-1: matches test but not morale
			-2: doesn't match test
		*/
		checkGunFitTestRequirements: function(ship, test) {
			if(ship.masterId !== test.shipId
				|| ship.level < test.lvlRange[0]
				|| ship.level > test.lvlRange[1])
				return -2; // Wrong remodel/ship or wrong lvl

			let equip = ship.equipment(true).filter((gear) => gear.masterId > 0);
			let testEquip = test.equipment;
			
			eqloop: for(let e of testEquip) {
				for(let i in equip) {
					if(e == equip[i].masterId) {
						equip.splice(i, 1);
						continue eqloop;
					}
				}
				return -2; // Missing required equip
			}

			if(equip.length > 0)
				return -2; // Too many equips, might ignore some equip types that don't affect acc
			
			if(ship.morale < test.moraleRange[0]
				|| ship.morale > test.moraleRange[1])
				return -1; // Wrong morale
			return 0;
		},
		
		/**
		 * Cleans up the data for each time start to sortie.
		 */
		cleanOnStart: function() {
			this.celldata = {};
			this.eventreward = {};
			this.currentMap = [0, 0];
			this.data.edgeID = [];
			this.data.nodeInfo = {
				nodeType: null,
				eventId: null,
				eventKind: null,
				nodeColor: null,
				amountOfNodes: null,
				itemGet: []
			};
			this.shipDrop.counts = {};
		},
		
		/**
		 * Cleans up the data after each submission for each node.
		 */
		cleanOnNext: function() {
			// states of fleets might be changed every nodes
			this.data.los = [0, 0, 0, 0];
			this.data.fleet1 = [];
			this.data.fleet2 = [];
			this.data.fleetSpeed = 20;
			// optional properties for event only
			this.data.difficulty = 0;
			this.data.currentMapHP = 0;
			this.data.maxMapHP = 0;
			this.data.gaugeNum = 0;
			this.data.gaugeType = 0;
		},
		
		/**
		 * Cleans up the data of non-combat related things.
		 */
		cleanNonCombat: function(){
			this.development = {};
		},
		
		/**
		 * SPI: clean all previous states up.
		 */
		cleanup: function(){
			this.cleanOnStart();
			this.cleanOnNext();
			this.cleanNonCombat();
		},
		
		/**
		 * SPI: process entry.
		 */
		processData: function(requestObj) {
			try {
				// get data handler based on URL given
				// `null` is returned if no handler is found
				var handler = this.handlers[requestObj.call];
				if (handler) {
					if (Array.isArray(handler))
						handler.forEach(h => h.call(this, requestObj));
					else
						handler.call(this, requestObj);
				}
			} catch (e) {
				console.warn("TsunDB submission error", e);
				// I like mangos
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
		
		sendData: function(payload, type) {
			//console.debug(JSON.stringify(payload));
			$.ajax({
				url: `https://tsundb.kc3.moe/api/${type}`,
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'tsun-ver': 'Kasumi'
				},
				data: JSON.stringify(payload)
			}).done( function() {
				console.log(`Tsun DB Submission to /${type} done.`);
			}).fail( function(jqXHR, textStatus, error) {
				const statusCode = jqXHR.status;
				if(statusCode === 400) {
					// Server-side defines: '400 Bad Request' = status can be ignored
					console.log(`Tsun DB Submission to /${type} ${textStatus}`, statusCode, error);
				} else {
					console.warn(`Tsun DB Submission to /${type} ${textStatus}`, statusCode, error);
				}
			});
			return;
		}
	};
	window.TsunDBSubmission.init();
})();
