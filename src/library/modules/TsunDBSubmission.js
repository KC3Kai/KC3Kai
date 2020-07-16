/**
 * TsunDBSubmission.js
 *
 * KC3Kai routing, enemies, drops, AACI kinds and developments data submission module.
 */
(function(){
	"use strict";
	
	// CRC32C as per https://github.com/ashi009/node-fast-crc32c/blob/master/impls/js_crc32c.js

	const crc32cTable = new Int32Array([
		0x00000000, 0xf26b8303, 0xe13b70f7, 0x1350f3f4,
		0xc79a971f, 0x35f1141c, 0x26a1e7e8, 0xd4ca64eb,
		0x8ad958cf, 0x78b2dbcc, 0x6be22838, 0x9989ab3b,
		0x4d43cfd0, 0xbf284cd3, 0xac78bf27, 0x5e133c24,
		0x105ec76f, 0xe235446c, 0xf165b798, 0x030e349b,
		0xd7c45070, 0x25afd373, 0x36ff2087, 0xc494a384,
		0x9a879fa0, 0x68ec1ca3, 0x7bbcef57, 0x89d76c54,
		0x5d1d08bf, 0xaf768bbc, 0xbc267848, 0x4e4dfb4b,
		0x20bd8ede, 0xd2d60ddd, 0xc186fe29, 0x33ed7d2a,
		0xe72719c1, 0x154c9ac2, 0x061c6936, 0xf477ea35,
		0xaa64d611, 0x580f5512, 0x4b5fa6e6, 0xb93425e5,
		0x6dfe410e, 0x9f95c20d, 0x8cc531f9, 0x7eaeb2fa,
		0x30e349b1, 0xc288cab2, 0xd1d83946, 0x23b3ba45,
		0xf779deae, 0x05125dad, 0x1642ae59, 0xe4292d5a,
		0xba3a117e, 0x4851927d, 0x5b016189, 0xa96ae28a,
		0x7da08661, 0x8fcb0562, 0x9c9bf696, 0x6ef07595,
		0x417b1dbc, 0xb3109ebf, 0xa0406d4b, 0x522bee48,
		0x86e18aa3, 0x748a09a0, 0x67dafa54, 0x95b17957,
		0xcba24573, 0x39c9c670, 0x2a993584, 0xd8f2b687,
		0x0c38d26c, 0xfe53516f, 0xed03a29b, 0x1f682198,
		0x5125dad3, 0xa34e59d0, 0xb01eaa24, 0x42752927,
		0x96bf4dcc, 0x64d4cecf, 0x77843d3b, 0x85efbe38,
		0xdbfc821c, 0x2997011f, 0x3ac7f2eb, 0xc8ac71e8,
		0x1c661503, 0xee0d9600, 0xfd5d65f4, 0x0f36e6f7,
		0x61c69362, 0x93ad1061, 0x80fde395, 0x72966096,
		0xa65c047d, 0x5437877e, 0x4767748a, 0xb50cf789,
		0xeb1fcbad, 0x197448ae, 0x0a24bb5a, 0xf84f3859,
		0x2c855cb2, 0xdeeedfb1, 0xcdbe2c45, 0x3fd5af46,
		0x7198540d, 0x83f3d70e, 0x90a324fa, 0x62c8a7f9,
		0xb602c312, 0x44694011, 0x5739b3e5, 0xa55230e6,
		0xfb410cc2, 0x092a8fc1, 0x1a7a7c35, 0xe811ff36,
		0x3cdb9bdd, 0xceb018de, 0xdde0eb2a, 0x2f8b6829,
		0x82f63b78, 0x709db87b, 0x63cd4b8f, 0x91a6c88c,
		0x456cac67, 0xb7072f64, 0xa457dc90, 0x563c5f93,
		0x082f63b7, 0xfa44e0b4, 0xe9141340, 0x1b7f9043,
		0xcfb5f4a8, 0x3dde77ab, 0x2e8e845f, 0xdce5075c,
		0x92a8fc17, 0x60c37f14, 0x73938ce0, 0x81f80fe3,
		0x55326b08, 0xa759e80b, 0xb4091bff, 0x466298fc,
		0x1871a4d8, 0xea1a27db, 0xf94ad42f, 0x0b21572c,
		0xdfeb33c7, 0x2d80b0c4, 0x3ed04330, 0xccbbc033,
		0xa24bb5a6, 0x502036a5, 0x4370c551, 0xb11b4652,
		0x65d122b9, 0x97baa1ba, 0x84ea524e, 0x7681d14d,
		0x2892ed69, 0xdaf96e6a, 0xc9a99d9e, 0x3bc21e9d,
		0xef087a76, 0x1d63f975, 0x0e330a81, 0xfc588982,
		0xb21572c9, 0x407ef1ca, 0x532e023e, 0xa145813d,
		0x758fe5d6, 0x87e466d5, 0x94b49521, 0x66df1622,
		0x38cc2a06, 0xcaa7a905, 0xd9f75af1, 0x2b9cd9f2,
		0xff56bd19, 0x0d3d3e1a, 0x1e6dcdee, 0xec064eed,
		0xc38d26c4, 0x31e6a5c7, 0x22b65633, 0xd0ddd530,
		0x0417b1db, 0xf67c32d8, 0xe52cc12c, 0x1747422f,
		0x49547e0b, 0xbb3ffd08, 0xa86f0efc, 0x5a048dff,
		0x8ecee914, 0x7ca56a17, 0x6ff599e3, 0x9d9e1ae0,
		0xd3d3e1ab, 0x21b862a8, 0x32e8915c, 0xc083125f,
		0x144976b4, 0xe622f5b7, 0xf5720643, 0x07198540,
		0x590ab964, 0xab613a67, 0xb831c993, 0x4a5a4a90,
		0x9e902e7b, 0x6cfbad78, 0x7fab5e8c, 0x8dc0dd8f,
		0xe330a81a, 0x115b2b19, 0x020bd8ed, 0xf0605bee,
		0x24aa3f05, 0xd6c1bc06, 0xc5914ff2, 0x37faccf1,
		0x69e9f0d5, 0x9b8273d6, 0x88d28022, 0x7ab90321,
		0xae7367ca, 0x5c18e4c9, 0x4f48173d, 0xbd23943e,
		0xf36e6f75, 0x0105ec76, 0x12551f82, 0xe03e9c81,
		0x34f4f86a, 0xc69f7b69, 0xd5cf889d, 0x27a40b9e,
		0x79b737ba, 0x8bdcb4b9, 0x988c474d, 0x6ae7c44e,
		0xbe2da0a5, 0x4c4623a6, 0x5f16d052, 0xad7d5351
	]);

	const crc32c = str => {
		let crc = -1;
		for (const char of str) {
			crc = crc32cTable[(crc ^ char.charCodeAt(0)) & 0xff] ^ (crc >>> 8);
		}
		return (crc ^ -1) >>> 0;
	};

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
			fleetids: [],
			fleetlevel: 0,
			fleetoneequips: [],
			fleetoneexslots: [],
			fleetonetypes: [],
			fleettwoequips: [],
			fleettwoexslots: [],
			fleettwotypes: [],
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
				amountOfNodes: null,
				resupplyUsed: null
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
				starshell: null,
				searchlight: null,
				ncontact: null,
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
			apiCl: null,
			enemy: null,
			spAttackType: null,
			testName: null,
			time: null,
		},
		gimmick: {
			map: null,
			nodes: [],
			gaugenum: null,
			trigger: null,
			amountofnodes: null,
			battles: [],
			lbasdef: [],
			difficulty: null,
			kc3version: null
		},
		spAttack: {
			ship: {
				id: null,
				lv: null,
				position: null,
				morale: null,
				stats: null,
				equips: null,
				proficiency: null,
			},
			misc: null,
			map: null,
			node: null,
			cutin: null,
			cutintype: null,
			cutinequips: null,
			time: null,
			kc3version: null
		},
		maelstrom : {
			map: null,
			node: null,
			radars: [],
			loss: null,
			resources: [],
			type: null
		},
		lolimodfod: {
			shipid: null,
			shiplvl: null,
			modids: null,
			modlvls: null,

			modbefore: null,
			modafter: null,
			modleft: null
		},
		handlers : {},
		isListenerRegistered: false,
		mapInfo : [],
		currentMap : [0, 0],
		
		init: function () {
			this.handlers = {
				'api_get_member/mapinfo': this.processMapInfo,
				'api_req_map/select_eventmap_rank': this.processSelectEventMapRank,
				
				'api_req_map/start': this.processStart,
				'api_req_map/next': this.processNext,
				
				'api_req_sortie/battle': [this.processEnemy, this.processAACI, this.processGunfit, this.processSpAttack],
				'api_req_sortie/airbattle': this.processEnemy,
				'api_req_sortie/night_to_day': [this.processEnemy, this.processFriendlyFleet, this.processSpAttack],
				'api_req_sortie/ld_airbattle': this.processEnemy,
				'api_req_sortie/ld_shooting': this.processEnemy,
				// Night only: `sp_midnight`, Night starts as 1st part then day part: `night_to_day`
				'api_req_battle_midnight/sp_midnight': [this.processEnemy, this.processFriendlyFleet, this.processSpAttack],
				'api_req_combined_battle/airbattle': this.processEnemy,
				'api_req_combined_battle/battle': [this.processEnemy, this.processSpAttack],
				'api_req_combined_battle/sp_midnight': [this.processEnemy, this.processFriendlyFleet, this.processSpAttack],
				'api_req_combined_battle/battle_water': [this.processEnemy, this.processSpAttack],
				'api_req_combined_battle/ld_airbattle': this.processEnemy,
				'api_req_combined_battle/ld_shooting': this.processEnemy,
				'api_req_combined_battle/ec_battle': [this.processEnemy, this.processSpAttack],
				'api_req_combined_battle/each_battle': [this.processEnemy, this.processSpAttack],
				'api_req_combined_battle/each_airbattle': this.processEnemy,
				'api_req_combined_battle/each_sp_midnight': [this.processEnemy, this.processFriendlyFleet, this.processSpAttack],
				'api_req_combined_battle/each_battle_water': [this.processEnemy, this.processSpAttack],
				'api_req_combined_battle/ec_night_to_day': [this.processEnemy, this.processFriendlyFleet, this.processSpAttack],
				'api_req_combined_battle/each_ld_airbattle': this.processEnemy,
				'api_req_combined_battle/each_ld_shooting': this.processEnemy,
				// Night battles as 2nd part following day part:
				'api_req_battle_midnight/battle': [this.processFriendlyFleet, this.processGunfit, this.processSpAttack],
				'api_req_combined_battle/midnight_battle': [this.processFriendlyFleet, this.processSpAttack],
				'api_req_combined_battle/ec_midnight_battle': [this.processFriendlyFleet, this.processSpAttack],
				// PvP battles are excluded intentionally
				
				'api_req_sortie/battleresult': [this.processDrop, this.processSanma, this.processUnexpected],
				'api_req_combined_battle/battleresult': [this.processDrop, this.processSanma, this.processUnexpected],
				// PvP battle_result excluded intentionally
				
				// Development related
				'api_req_kousyou/createitem': this.processDevelopment,

				// Debuff gimmick check
				'api_port/port': [this.processGimmick, this.lazyInitNetworkListener],

				// Equipment list
				'api_get_member/picture_book': this.processPictureBook,

				'api_req_mission/result': this.processExped,

				'Modernize': this.processModernizeEvent
			};
			this.manifest = chrome.runtime.getManifest() || {};
			this.kc3version = this.manifest.version + ("update_url" in this.manifest ? "" : "d");
		},
		
		lazyInitNetworkListener: function() {
			if(!this.isListenerRegistered) {
				this.isListenerRegistered = true;
				/**
				 * Lazy register to KC3Network global listener
				 * @param event - the triggered event name.
				 * @param data - the data object built by Kcsapi handler, {} by default.
				 */
				KC3Network.addGlobalListener((event, data) => {
					if(!ConfigManager.TsunDBSubmission_enabled)
						return;
					const eventHandler = this.handlers[event];
					if(Array.isArray(eventHandler))
						eventHandler.forEach(h => h && h.call(this, data));
					else if(typeof eventHandler === "function")
						eventHandler.call(this, data);
				});
			}
		},
		
		processMapInfo: function(http) {
			this.mapInfo = $.extend(true, [], http.response.api_data.api_map_info);

			// Update enemycomp with leftover slots from air battle
			if (this.delayedABSubmission && this.enemyComp.airBattle) {
				this.delayedABSubmission = null;				
				const base = http.response.api_data.api_air_base.find(base => base.api_area_id === this.currentMap[0] && base.api_rid === this.enemyComp.airBattle.enemyShotdown.baseId);
				this.enemyComp.airBattle.enemyShotdown.finalSlots = base.api_plane_info.map(slot => slot.api_count);

				this.sendData(this.enemyComp, 'enemy-comp');
			}
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
			else{
				this.celldata.difficulty = 0;
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

			if ((apiData.api_cell_flavor || {}).api_message) {
				this.data.nodeInfo.flavorType = apiData.api_cell_flavor.api_type;
				this.data.nodeInfo.flavorMessage = apiData.api_cell_flavor.api_message;
			}

			// Checks whether the fleet has hit a dead end or not
			this.data.nextRoute = apiData.api_next;
			
			this.data.fleet1 = this.handleFleet(PlayerManager.fleets[this.data.sortiedFleet - 1]);
			if(this.data.fleetType > 0 && this.data.sortiedFleet === 1) {
				this.data.fleet2 = this.handleFleet(PlayerManager.fleets[1]);
			}
			
			for(const ship of this.data.fleet1) {
				this.data.fleetids.push(ship.id);
				this.data.fleetlevel += ship.level;
				this.data.fleetoneequips.push(...ship.equip);
				this.data.fleetoneexslots.push(ship.exslot);
				this.data.fleetonetypes.push(ship.type);
			}
			if(this.data.fleet2.length > 0) {
				for(const ship of this.data.fleet2) {
					this.data.fleetids.push(ship.id);
					this.data.fleetlevel += ship.level;
					this.data.fleettwoequips.push(...ship.equip);
					this.data.fleettwoexslots.push(ship.exslot);
					this.data.fleettwotypes.push(ship.type);
				}
			}
			
			// Sets all the event related values
			if(apiData.api_eventmap) {
				const mapStorage = KC3SortieManager.getCurrentMapData(this.currentMap[0], this.currentMap[1]);
				
				this.data.currentMapHP = apiData.api_eventmap.api_now_maphp;
				this.data.maxMapHP = apiData.api_eventmap.api_max_maphp;
				this.data.difficulty = mapData.api_eventmap.api_selected_rank;
				this.data.gaugeNum = mapData.api_gauge_num;
				this.data.gaugeType = mapData.api_gauge_type;
				this.data.debuffSound = mapStorage.debuffSound;
				
				this.sendData(this.data, 'eventrouting');
			} else {
				this.sendData(this.data, 'routing');
			}
			
			// Send Land-base Air Raid enemy compos
			if(apiData.api_destruction_battle) {
				this.processEnemy(http, apiData.api_destruction_battle);
				this.fillGimmickInfo(apiData.api_destruction_battle, true);
			}
			if(apiData.api_m1) {
				this.processGimmick(http);
			}
			// Currently not present in /next
			if(apiData.api_m2) {
				this.processGimmick(http);
			}
			if(apiData.api_happening) {
				this.processMaelstrom(apiData.api_happening);
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
				equip: friendlyInfo.api_Slot,
				requestType: PlayerManager.friendlySettings.api_request_type,
				voice: [friendlyInfo.api_voice_id, friendlyInfo.api_voice_p_no],
				fleet1: (this.data.fleet1 || []).map(e => RemodelDb.originOf(e.id)).sort((a, b) => a - b),
				fleet2: (this.data.fleet2 || []).map(e => RemodelDb.originOf(e.id)).sort((a, b) => a - b),
			};
			this.friendlyFleet.uniquekey = crc32c(JSON.stringify(this.friendlyFleet.fleet));
			this.sendData(this.friendlyFleet, 'friendlyfleet');
		},
		
		processEnemy: function(http, airRaidData) {
			if(!this.currentMap[0] || !this.currentMap[1]) { return; }
			this.resupplyUsed = !!http.params.api_supply_flag;
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
			if(KC3Meta.isEventWorld(this.currentMap[0])) {
				this.enemyComp.enemyComp.mapStats = {
					gaugeNum: this.data.gaugeNum,
					currentHP: this.data.currentMapHP,
					maxHP: this.data.maxMapHP
				};
			}
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
					airBattle.improvements = [];
					airBattle.bases = bases.map(base => base.toShipObject().equipment().map(gear => gear.masterId));
					airBattle.contact = koukuApi.api_stage1.api_touch_plane;
					(koukuApi.api_plane_from[0] || []).forEach(baseId => {
						const baseInfo = bases[baseId - 1];
						const squadronPlanes = koukuApi.api_map_squadron_plane[baseId] || [];
						const shipObj = buildShipFromBase(baseInfo, squadronPlanes);
						const planes = squadronPlanes.map(plane => plane.api_mst_id || -1);
						const proficiency = shipObj.equipment().map(g => g.ace || -1);
						const improvements = shipObj.equipment().map(g => g.stars || -1);
						airBattle.planes.push(planes);
						airBattle.slots.push(shipObj.slots);
						airBattle.proficiency.push(proficiency);
						airBattle.improvements.push(improvements);
						fp += shipObj.interceptionPower();
					});
					if(koukuApi.api_stage3) {
						airBattle.bakFlag = koukuApi.api_stage3.api_fbak_flag || [];
						airBattle.raiFlag = koukuApi.api_stage3.api_frai_flag || [];
						airBattle.fclFlag = koukuApi.api_stage3.api_fcl_flag || [];
						airBattle.damage = koukuApi.api_stage3.api_fdam || [];
					}
				}
				
				// Get sortie power of the land-base involved in the first wave
				else if(isLandBase && !airRaidData) {
					const baseInfo = bases[koukuApi.api_base_id - 1];
					const squadronPlanes = koukuApi.api_squadron_plane || [];
					const shipObj = buildShipFromBase(baseInfo, squadronPlanes);
					// fp will be an Array[2]
					fp = shipObj.fighterBounds(true);
					// Prepare enemy shootdown submission, only use last nodes to prevent all submissions from being delayed
					// Also enforce that both strikepoints are on same node and wave is not fighter sweep
					if(KC3SortieManager.currentNode().isBoss() && (baseInfo.strikePoints[0] === baseInfo.strikePoints[1]) && !!apiData.api_air_base_attack[1].api_stage2) {
						this.delayedABSubmission = true;
						const waveData = apiData.api_air_base_attack[1];
						airBattle.enemyShotdown = {
							baseId: koukuApi.api_base_id,
							planes: waveData.api_squadron_plane.map(plane => plane.api_mst_id || -1),
							initialSlots: shipObj.slots,
							initialCount: waveData.api_stage2.api_f_count,
							totalLoss: waveData.api_stage2.api_f_lostcount
						};
					}
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
			
			if (!this.delayedABSubmission) { this.sendData(this.enemyComp, 'enemy-comp'); }
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
			
			if (KC3Meta.isEventWorld(this.currentMap[0])) {
				this.fillGimmickInfo(apiData);
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
			this.processDropLoc(this.shipDrop);
			this.sendData(this.shipDrop, 'drops');
			
			// To avoid iterating all ships every time,
			// and KC3ShipManager may not be updated until next `api_get_member/ship_deck` call.
			if(this.shipDrop.ship > 0){
				// Basically not need this converting, but once a time KC devs made a Fusou Kai Ni drop bug
				const baseFormId = RemodelDb.originOf(this.shipDrop.ship);
				this.shipDrop.counts[baseFormId] = 1 + (this.shipDrop.counts[baseFormId] || 0);
			}
		},

		processDropLoc(shipdrop){
			let data = {
				ship: shipdrop.ship,
				map: shipdrop.map,
				node: shipdrop.node,
				rank: shipdrop.rank,
				difficulty: shipdrop.difficulty
			};
			this.sendData(data, 'droplocs');
		},

		processSanma: function(http) {
			const apiData = http.response.api_data;
			if(apiData.api_get_useitem == undefined) return;
			let data = {
				uid: PlayerManager.hq.id,
				item: apiData.api_get_useitem.api_useitem_id,
				hqlvl: this.data.hqLvl, 
				map: this.data.map,
				node: this.data.node,
				cleared: this.data.cleared,
				rank: apiData.api_win_rank,
				count: {
					68: PlayerManager.getConsumableById(68),
					93: PlayerManager.getConsumableById(93)
				},
				difficulty: this.data.difficulty,
				fleettype: this.data.fleetType,
				fleetids: this.data.fleetids,
				fleetlevel: this.data.fleetlevel,
				fleet1: this.data.fleet1,
				fleetonetypes: this.data.fleetonetypes,
				fleetoneequips: this.data.fleetoneequips,
				fleetoneexslots: this.data.fleetoneexslots,
				fleet2: this.data.fleet2,
				fleettwotypes: this.data.fleettwotypes,
				fleettwoequips: this.data.fleettwoequips,
				fleettwoexslots: this.data.fleettwoexslots,
				los: this.data.los
			};
			this.sendData(data, 'sanma');
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
			this.aaci.kc3version = this.kc3version;

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
				kc3version: this.kc3version
			};
			unexpectedList.forEach(a => {
				if(a.isUnexpected || a.landFlag || (thisNode.isBoss() && KC3Meta.isEventWorld(this.currentMap[0]))) {
					this.unexpectedDamage = Object.assign({}, a, template);
					this.unexpectedDamage.damageInstance.amountOfNodes = this.data.nodeInfo.amountOfNodes;
					this.unexpectedDamage.damageInstance.resupplyUsed = this.resupplyUsed;
					delete this.unexpectedDamage.landFlag;
					delete this.unexpectedDamage.isUnexpected;
					this.sendData(this.unexpectedDamage, 'abnormal');
				}
			});
		},
		
		processGunfit: function(){
			this.gunfit = {};
			const thisNode = KC3SortieManager.currentNode();
			const allowedNodes = {
				"1-1": [1],
				"1-2": [1, 3]
			};
			if (!(ConfigManager.TsunDBSubmissionExtra_enabled
				&& Object.keys(allowedNodes).includes(this.data.map)
				&& allowedNodes[this.data.map].includes(thisNode.id)
			)) { return; }
			this.updateGunfitsIfNeeded();
			
			if(localStorage.tsundb_gunfits === undefined) { return; }
			const tests = JSON.parse(localStorage.tsundb_gunfits).tests;
			
			// Leave it as single-fleet check for now
			const fleet = PlayerManager.fleets[this.data.sortiedFleet - 1];
			const battleLog = (thisNode.predictedFleetsNight || thisNode.predictedFleetsDay || {}).playerMain;
			const template = {
				username: PlayerManager.hq.name,
				id: PlayerManager.hq.id,
				map: this.data.map,
				edge: thisNode.id,
				kc3version: this.kc3version,
				starshell: !!thisNode.flarePos,
				searchlight: !!fleet.estimateUsableSearchlight(),
				ncontact: thisNode.fcontactId === 102,
			};
			const battleData = thisNode.battleDay || thisNode.battleNight;
			template.formation = battleData.api_formation[0];
			template.eformation = battleData.api_formation[1];
			const initialMorale = KC3SortieManager.initialMorale;
			
			// Implementing phase tagging to attacks in the future, so this part may need to be updated later
			for (var idx = 0; idx < fleet.ships.length; idx++) {
				const ship = fleet.ship(idx);
				if (ship.isDummy()) { continue; }
				const testId = this.checkGunFitsRequirements(ship, initialMorale[idx]);
				if (testId >= 0) {
					const template2 = Object.assign({}, { misc: template, ship: { id:ship.masterId, lv: ship.level, position: idx, morale: initialMorale[idx], luck: ship.lk[0],
						equips: ship.equipment(true).map(g => g.masterId || -1), improvements: ship.equipment(true).map(g => g.stars || -1), }, testName: tests[testId].testName });
					const formMod = ship.estimateShellingFormationModifier(template2.formation, template2.eformation, 'accuracy');
					const accVal = ship.shellingAccuracy(formMod, false);
					template2.accVal = accVal.basicAccuracy;
					const shipLog = battleLog[idx].attacks;
					
					for (var i = 0; i < shipLog.length; i++) {
						const attack = shipLog[i];
						for (var j = 0; j < attack.acc.length; j++) {
							this.gunfit = Object.assign({}, template2, { apiCl: attack.acc[j], enemy: thisNode.eships[attack.target[j]], 
								spAttackType: attack.cutin >= 0 ? attack.cutin : attack.ncutin, time : attack.cutin >= 0 ? 'day' : 'yasen' });
							this.sendData(this.gunfit, 'fits');
						}
					}
				}
			}
		},
		
		processGimmick: function(http, trigger = 'port'){
			const apiData = http ? http.response.api_data : {};
			if (http) {
				if (!(
					// triggered by next node flag
					apiData.api_m1 ||
					// "new" debuff flag, currently not present in next
					apiData.api_m2 || 
					// triggered by home port SE flag
					(apiData.api_event_object && apiData.api_event_object.api_m_flag2)
				)) { return; }
			} // else triggered by battle/LB air raid result flag
			this.gimmick.map = this.data.map;
			this.gimmick.amountofnodes = this.data.nodeInfo.amountOfNodes;
			this.gimmick.gaugenum = this.data.gaugeNum;
			this.gimmick.trigger = trigger;
			this.gimmick.nodes = this.data.edgeID;
			this.gimmick.kc3version = this.kc3version;
			this.gimmick.difficulty = this.data.difficulty;
			if (apiData.api_m1) {
				this.gimmick.trigger = 'nodeNext' + apiData.api_m1;
			}
			if (apiData.api_m2) {
				this.gimmick.trigger = 'nodeDebuff' + apiData.api_m2;
			}
			this.sendData(this.gimmick, 'gimmick');
		},

		processSpAttack: function() {
			this.spAttack = {};
			const thisNode = KC3SortieManager.currentNode();
			const template = {
				kc3version: this.kc3version,
				map: this.data.map,
				node: thisNode.id
			};
			const enemyList = thisNode.eships, isCombined = KC3SortieManager.isCombinedSortie();
			const result = thisNode.predictedFleetsNight || thisNode.predictedFleetsDay || {};
			const playerShips = (result.playerMain || []).concat(result.playerEscort || []);
			const fleetSent = this.data.sortiedFleet;
			const battleConds = KC3Calc.collectBattleConditions();
			const fillShipInfo = ship => ({
				id: ship.masterId,
				lvl: ship.level,
				morale: ship.morale,
				stats: ship.estimateNakedStats(),
				equips: ship.equipment(true).map(g => g.masterId || -1), 
				improvements: ship.equipment(true).map(g => g.stars || -1),
				proficiency: ship.equipment(true).map(g => g.ace || -1),
				slots: ship.slots,
			});
			const buildSortieSpecialInfo = (fleet, cutin) => {
				const misc = {};
				const shipIndexList = {
					100: [2, 4],
					101: [1],
					102: [1],
					103: [1, 2],
					104: [1]
				}[cutin] || [];
				shipIndexList.forEach(idx => {
					const ship = fleet.ship(idx);
					misc["ship" + (idx + 1)] = fillShipInfo(ship);
				});
				return misc;
			};
			for (let idx = 0; idx < playerShips.length; idx++) {
				const attacks = (playerShips[idx] || {}).attacks || [];
				if (attacks.length === 0) { continue; }
				const isEscort = isCombined && idx > 5;
				const shipPos = !isEscort ? idx : idx - 6;
				const fleet = PlayerManager.fleets[!isEscort ? fleetSent - 1 : 1];
				const ship = fleet.ship(shipPos);
				const shipInfo = fillShipInfo(ship);
				shipInfo.position = shipPos;
				const template2 = Object.assign({}, template, {ship: shipInfo});
				for (let num = 0; num < attacks.length; num++) {
					const attack = attacks[num];
					let target = attack.target;
					if (Array.isArray(target)) { target = target[0]; }
					let enemy = enemyList[target];
					const {isLand, isSubmarine} = ship.estimateTargetShipType(enemy);
					if (isSubmarine) { continue; }
					const time = attack.cutin >= 0 ? "day" : "yasen";
					const cutinType = time === "day" ? ship.estimateDayAttackType(enemy, true, battleConds.airBattleId)
						: ship.estimateNightAttackType(enemy, true);
					if (cutinType[1] === 0) { break; }
					const cutin = attack.cutin || attack.ncutin || 0;
					const cutinEquips = attack.equip || [-1];
					const specialCutinIds = [100, 101, 102, 103, 104];
					let misc = {};
					if (this.sortieSpecialAttack && (
							specialCutinIds.includes(cutinType[1]) ||
							specialCutinIds.includes(cutin)
						)
					) { continue; }
					if (specialCutinIds.includes(cutin)) {
						this.sortieSpecialAttack = true;
					}
					if (specialCutinIds.includes(cutinType[1])) {
						if (attack.hp / ship.hp[1] <= 0.5) { continue; }
						misc = buildSortieSpecialInfo(fleet, cutinType[1]);
					} else if (time === "day"
						&& !(thisNode.planeFighters.player[0] === 0
							&& thisNode.planeFighters.abyssal[0] === 0)) {
						misc = ship.daySpAttackBaseRate();
						if (isCombined) {
							if (isEscort) { misc.fleetMainLoS = PlayerManager.fleets[0].artillerySpottingLineOfSight(); }
							else { misc.fleetEscortLoS = PlayerManager.fleets[1].artillerySpottingLineOfSight(); }
						}
					} else {
						misc = ship.nightSpAttackBaseRate();
					}
					if (Object.keys(misc).length === 0) { continue; }
					misc.formation = [thisNode.fformation, thisNode.eformation];
					misc.isCombined = isCombined;
					misc.enemy = enemy;
					misc.eposition = target;
					misc.ehp = attack.ehp;
					misc.acc = attack.acc;
					misc.damage = attack.damage;
					misc.contact = battleConds.airBattleId;
					misc.isLand = isLand;
					this.spAttack = Object.assign({}, template2, {
						misc, cutin,
						cutinequips: cutinEquips,
						cutintype: cutinType[2],
						time,
					});
					this.sendData(this.spAttack, 'spattack');
				}
			}
		},

		processMaelstrom: function(apiData) {
			this.maelstrom = {
				map: this.data.map,
				node: this.data.edgeID[this.data.edgeID.length - 1],
				loss: apiData.api_count,
				type: apiData.api_mst_id,
				radars: [],
				resources: []
			};
			const rscType = ["", "fuel", "ammo"][apiData.api_mst_id] || "";
			KC3SortieManager.getSortieFleet().map(id => PlayerManager.fleets[id]).forEach(fleet => {
				fleet.shipsUnescaped().forEach(ship => {
					this.maelstrom.resources.push(ship[rscType] || 0);
					this.maelstrom.radars.push(ship.countEquipmentType(2, [12, 13]));
				});
			});
			this.sendData(this.maelstrom, 'maelstrom');
		},
		
		processDevelopment: function(http) {
			const request = http.params;
			const response = http.response.api_data;
			response.api_get_items.forEach(e => {
				this.sendData({
					hqLvl: PlayerManager.hq.level,
					flagship: {
						id: PlayerManager.fleets[0].ship(0).masterId,
						type: PlayerManager.fleets[0].ship(0).master().api_stype,
						lvl: PlayerManager.fleets[0].ship(0).level,
					},
					resources: {
						fuel: request.api_item1,
						ammo: request.api_item2,
						steel: request.api_item3,
						bauxite: request.api_item4,
					},
					result: e.api_slotitem_id,
					success: e.api_slotitem_id !== -1 ? 1 : 0,
				}, 'development');
			});
		},

		processPictureBook: function(http) {
			const request = http.params;
			const response = http.response.api_data;

			if(request.api_type !== "2") return; // Equipment only
			if(response == null || response.api_list === null) return; // Pages with content only

			const equips = response.api_list.map((equip) => {
				return {
					id: equip.api_table_id[0],
					name: equip.api_name,
					description: equip.api_info,
					firepower: equip.api_houg,
					torpedo: equip.api_raig,
					aa: equip.api_tyku,
					armor: equip.api_souk,
					los: equip.api_saku,
					range: equip.api_leng,
					bombing: equip.api_baku,
					evasion: equip.api_houk,
					accuracy: equip.api_houm,
					speed: equip.api_soku,
					asw: equip.api_tais,
					type: equip.api_type
				};
			});
			this.sendData({equips}, "equips");
		},

		processExped: function(http) {
			const request = http.params;
			const response = http.response.api_data;

			const deck = request.api_deck_id;
			const expedID = KC3TimerManager._exped[deck - 2].expedNum;

			// Can happen when expedition cleared before listener executes
			if(expedID === 0) {
				console.log(`[TsunDB] Cancelling submissions, unknown expedition ID for deck ${deck}`);
				return;
			}
			
			const exped = {
				deck,
				fleet: PlayerManager.fleets[deck - 1].ship().map(ship => {
					return {
						id: ship.masterId,
						lvl: ship.level,
						morale: ship.morale,
						stats: ship.nakedStats(),
						// Caution: `fromEntries` supported since Chromium m73. Alternative:
						//   (() => { let o = {}; ["hp", "fp", "tp", "aa", "ar", "ev", "as", "ls", "lk"].forEach(s => o[s] = ship[s][0]); return o; })()
						visibleStats: Object.fromEntries(["hp", "fp", "tp", "aa", "ar", "ev", "as", "ls", "lk"].map((stat) => [stat, ship[stat][0]])),
						kyouka: ship.mod,
						equips: ship.equipment(true).map(g => g.masterId || -1), 
						improvements: ship.equipment(true).map(g => g.stars || -1),
						proficiency: ship.equipment(true).map(g => g.ace || -1),
						slots: ship.slots,
								
						fuel: [ship.fuel, ship.master().api_fuel_max],
						ammo: [ship.ammo, ship.master().api_bull_max]
					};
				}),
				result: response.api_clear_result,
				hqXP: response.api_get_exp,
				shipXP: response.api_get_ship_exp,
				items: [1,2].map((ind) => {
					const x = response["api_get_item" + ind];
					if(!x)
						return x;
					return {
						id: (x.api_useitem_id == -1 ? response.api_useitem_flag[ind-1] : x.api_useitem_id),
						count: x.api_useitem_count
					};
				}),
				resources: (!response.hasOwnProperty("api_get_material") || response.api_get_material === -1) ? [0, 0, 0, 0] : response.api_get_material,
				expedID
			};

			this.sendData(exped, "expeds");
		},

		/**
		 * This will be called from KC3Network listener,
		 * when the ship modernize event is triggered by the Kcsapi handler.
		 * @param data - the data instance including mod ship and fodders.
		 */
		processModernizeEvent: function(data) {
			const ship = KC3ShipManager.get(data.rosterId);
			const modFod = data.consumedMasterIds.map((id) => KC3Master.ship(id));

			// Checks in `main.js#RemodelUtil.calcPowerUpParams`
			const deCount = modFod.filter((s) => s.api_stype === 1).length;

			const mizuhoCount = modFod.filter((s) => s.api_ctype === 62).length;
			const isMizuhoHPAble = [62, 72].includes(ship.master().api_ctype);

			const kamoiCount = modFod.filter((s) => s.api_ctype === 72).length;
			const isKamoiHPAble = [72, 62, 41, 37].includes(ship.master().api_ctype);

			// DE / Mizuho / Kamoi mod filter
			if (deCount === 0 &&
				!(isMizuhoHPAble && mizuhoCount >= 2) &&
				!(isKamoiHPAble && kamoiCount >= 2)
			) return;

			this.lolimodfod = {
				shipid: ship.masterId,
				shiplvl: ship.level,
				modids: data.consumedMasterIds,
				modlvls: data.consumedMasterLevels,

				modbefore: data.oldMod,
				modafter: data.newMod,
				modleft: data.left
			};
			//console.debug(this.lolimodfod);
			this.sendData(this.lolimodfod, 'lolimodfod');
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
				equip: ship.equipment(false).map(gear => gear.masterId || -1),
				stars: ship.equipment(true).map(gear => gear.stars === 0 ? 0 : (gear.stars || -1)),
				ace: ship.equipment(true).map(gear => gear.ace === 0 ? 0 : (gear.ace || -1)),
				exslot: ship.exItem().masterId || -1
			}));
		},
		
		updateGunfitsIfNeeded: function(callback) {
			const currentHour = Date.toUTChours();
			if(localStorage.tsundb_gunfits !== undefined) {
				const gf = JSON.parse(localStorage.tsundb_gunfits);
				if(gf.updateTime + 3 > currentHour) // Cache for ~3h
					return;
			}
			const dataSourceUrl = `https://raw.githubusercontent.com/Tibowl/TsunTools/master/config/gunfits.json?cache=${currentHour}`;
			$.getJSON(dataSourceUrl, newGunfitData => {
				if(callback) callback(newGunfitData);
				localStorage.tsundb_gunfits = JSON.stringify({
					tests: newGunfitData,
					updateTime: currentHour
				});
			});
		},
		
		/**
		 * @return
		 *   i: index of test (>= 0) matches test and morale
		 *  -1: matches a test but not morale
		 *  -2: matches a test but not equips
		 *  -3: does not match any test
		 * 
		 * Eg: if(checkGunFitsRequirements(ship) < 0) continue;
		 */
		checkGunFitsRequirements: function(ship, morale = ship.morale) {
			if(localStorage.tsundb_gunfits === undefined)
				return -3;
			
			const modalWarning = function (termPrefix) {
				const title = termPrefix + "Title", message = termPrefix + "Message";
				if (KC3SortieManager.isOnSortie()) {
					KC3Network.trigger("ModalBox", {
						title: KC3Meta.term(title),
						message: KC3Meta.term(message),
					});
				}
			};
			let status = -3;
			const tests = JSON.parse(localStorage.tsundb_gunfits).tests;
			const onClick = e => {
				(new RMsg("service", "strategyRoomPage", {
					tabPath: "gunfits"
				})).execute();
				return false;
			};
			for(const testId in tests) {
				const testStatus = this.checkGunFitTestRequirements(ship, tests[testId], morale);
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
			if ([-2, -1].includes(status)) {
				modalWarning(status === -1 ? "TsunDBTestWrongMorale" : "TsunDBTestWrongSetup");
			}
			return status;
		},
		
		/**
		 * @return
		 *   0: matches test and morale
		 *  -1: matches test but not morale
		 *  -2: matches test but not equip
		 *  -3: does not match test at all
		 */
		checkGunFitTestRequirements: function(ship, test, morale = ship.morale) {
			if(ship.masterId !== test.shipId
				|| ship.level < test.lvlRange[0]
				|| ship.level > test.lvlRange[1])
				return -3; // Wrong remodel/ship or wrong lvl
			
			const equip = ship.equipment(true).filter((gear) => gear.masterId > 0);
			const testEquip = test.equipment;

			if(test.minVersion) {
				const kc3version = this.manifest.version;
				const verStr2Num = str => Number(str.replace(/[.]/g, ""));
				if(verStr2Num(test.minVersion) > verStr2Num(kc3version)) {
					return -2; // Wrong KC3 minimum version
				}
			}
			
			eqloop: for(const e of testEquip) {
				for(const i in equip) {
					if(e == equip[i].masterId) {
						equip.splice(i, 1);
						continue eqloop;
					}
				}
				return -2; // Missing required equip
			}
			
			if(test.accuracy) {
				let equipAcc = 0;
				const accCheck = test.accuracy;
				const stype = ship.master().api_stype;
				for (let idx in equip) {
					const eqType2 = equip[idx].master().api_type[2];
					// Either radars or medium caliber guns on (F)BB(V) to adjust accuracy
					if([12, 13].includes(eqType2) || (eqType2 === 2 && [8, 9, 10].includes(stype))) {
						equipAcc += equip[idx].master().api_houm;
					} else {
						return -2; // Non-test related equipment
					}
				}
				if(equipAcc !== accCheck) {
					return -2; // Too little or too much accuracy
				}
			}	
			else if(equip.length > 0) {
				return -2; // Too many equips
			}
			
			if(morale < test.moraleRange[0]
				|| morale > test.moraleRange[1])
				return -1; // Wrong morale
			return 0;
		},
		
		fillGimmickInfo: function(apiData, isAirRaid) {
			const thisNode = KC3SortieManager.currentNode();
			const battleConds = KC3Calc.collectBattleConditions();
			let obj = {};
			if (!isAirRaid) {
				const predictedFleet = thisNode.predictedFleetsNight || thisNode.predictedFleetsDay || {};
				obj = {
					node: thisNode.id,
					seiku: battleConds.airBattleId,
					lbasPresent: thisNode.lbasFlag,
					rank: apiData.api_win_rank,
					flagshipSunk: Object.getSafePath(predictedFleet, "enemyMain.0.hp") < 1,
				};
				this.gimmick.battles.push(obj);
			} else {
				const airRaidData = apiData.api_air_base_attack;
				obj = {
					node: thisNode.id,
					damaged: airRaidData.api_stage3 ? !airRaidData.api_stage3.api_fdam.every(v => v === 0) : false,
					seiku: airRaidData.api_stage1.api_disp_seiku,
					success: apiData.api_lost_kind === 4
				};
				this.gimmick.lbasdef.push(obj);
			}
			if (apiData.api_m1) {
				obj.api_m1 = apiData.api_m1;
				this.processGimmick(false, isAirRaid ? 'nodeAB' : 'nodeBattle');
			}
			if (apiData.api_m2) {
				obj.api_m2 = apiData.api_m2;
				this.processGimmick(false, isAirRaid ? 'nodeAB2' : 'nodeBattle2');
			}
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
			this.gimmick = {
				map: null,
				nodes: [],
				gaugenum: null,
				trigger: null,
				battles: [],
				lbasdef: [],
				amountofnodes: null,
				difficulty: null
			};
			this.sortieSpecialAttack = null;
			this.delayedABSubmission = null;
			this.resupplyUsed = false;
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
			this.data.fleetids = [];
			this.data.fleetlevel = 0;
			this.data.fleetoneequips = [];
			this.data.fleetoneexslots = [];
			this.data.fleetonetypes = [];
			this.data.fleettwoequips = [];
			this.data.fleettwoexslots = [];
			this.data.fleettwotypes = [];
			// optional properties for event only
			this.data.difficulty = 0;
			this.data.currentMapHP = 0;
			this.data.maxMapHP = 0;
			this.data.gaugeNum = 0;
			this.data.gaugeType = 0;
			this.resupplyUsed = false;
		},

		/**
		 * SPI: clean all previous states up.
		 */
		cleanup: function(){
			this.cleanOnStart();
			this.cleanOnNext();
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
				method: 'PUT',
				headers: {
					'content-type': 'application/json',
					'tsun-ver': 'Kasumi Kai',
					'dataorigin': 'kc3',
					'version': this.kc3version
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
