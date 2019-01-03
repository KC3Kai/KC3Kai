/* SortieManager.js
KC3改 Sortie Manager

Stores and manages states and functions during sortie of fleets (including PvP battle).
*/
(function(){
	"use strict";
	
	window.KC3SortieManager = {
		onSortie: false,
		onPvP: false,
		onCat: false,
		fleetSent: 1,
		map_world: 0,
		map_num: 0,
		map_difficulty: 0,
		hqExpGained: 0,
		nodes: [],
		boss: {},
		focusedFleet: [],
		supportFleet: [],
		fcfCheck: [],
		escapedList: [],
		materialGain: Array.apply(null, {length:8}).map(v => 0),
		sinkList: {main:[], escr:[]},
		slotitemConsumed: false,
		sortieTime: 0,
		
		startSortie :function(world, mapnum, fleetNum, stime, eventData){
			const self = this;
			// If still on sortie, end previous one
			if(this.isOnSortie()){
				this.endSortie();
			}
			
			this.fleetSent = parseInt(fleetNum);
			this.map_world = world;
			this.map_num = mapnum;
			const thisMap = this.getCurrentMapData();
			this.map_difficulty = world < 10 ? 0 : thisMap.difficulty || 0;
			this.hqExpGained = 0;
			this.slotitemConsumed = false;
			this.boss = {
				info: false,
				bosscell: -1,
				comp: -1,
				letters: []
			};
			this.clearNodes();
			
			this.snapshotFleetState();
			const fleet = PlayerManager.fleets[this.fleetSent-1];
			fleet.resetAfterHp();
			
			// Prepare sortie database record
			const sortie = {
				diff: this.map_difficulty,
				world: world,
				mapnum: mapnum,
				fleetnum: parseInt(fleetNum, 10),
				combined: PlayerManager.combinedFleet,
				fleet1: PlayerManager.fleets[0].sortieJson(),
				fleet2: PlayerManager.fleets[1].sortieJson(),
				fleet3: PlayerManager.fleets[2].sortieJson(),
				fleet4: PlayerManager.fleets[3].sortieJson(),
				support1: this.getSupportingFleet(false),
				support2: this.getSupportingFleet(true),
				lbas: this.getWorldLandBases(world, mapnum),
				time: stime
			};
			// Add optional properties
			// Record states of unclear normal (or EO) maps
			if(world < 10 && (mapnum > 4 || thisMap.kind === "multiple")){
				sortie.mapinfo = { "api_cleared": thisMap.clear };
				if(thisMap.kills !== false || thisMap.killsRequired){
					sortie.mapinfo.api_defeat_count = thisMap.kills || 0;
					if(thisMap.killsRequired > 0)
						sortie.mapinfo.api_required_defeat_count = thisMap.killsRequired;
				}
				if(thisMap.gaugeNum > 1){
					sortie.mapinfo.api_gauge_num = thisMap.gaugeNum;
				}
			}
			// Record boss HP gauge states of event maps
			if(eventData){
				const mergedEventInfo = {};
				$.extend(mergedEventInfo, eventData, {
					// api_state not stored, use this instead
					"api_cleared": thisMap.clear,
					"api_gauge_type": thisMap.gaugeType,
					"api_gauge_num": thisMap.gaugeNum || 1
				});
				// api_dmg seems always 0 on sortie start
				delete mergedEventInfo.api_dmg;
				
				sortie.eventmap = mergedEventInfo;

				// Update event map now/max hp at once for panel display,
				// because first run after rank selected, they were set to 9999
				if((thisMap.curhp || 9999) === 9999 && eventData.api_now_maphp){
					thisMap.curhp = parseInt(eventData.api_now_maphp, 10);
					thisMap.maxhp = parseInt(eventData.api_max_maphp, 10);
					this.setCurrentMapData(thisMap);
				}
			}
			if(ConfigManager.isNotToSaveSortie(this.map_world, this.map_num)){
				// Ignore database saving if user demands, set a pseudo sortie id (keep > 0)
				this.onSortie = Number.MAX_SAFE_INTEGER;
				this.sortieTime = stime;
				this.save();
			} else {
				this.onSortie = 0;
				this.sortieTime = stime;
				// Save on database and remember current sortie id
				KC3Database.Sortie(sortie, function(id){
					self.onSortie = id;
					self.save();
					// Lazy save event map hp to stat.onBoss.hpdat after sortie id confirmed
					if(eventData){
						if(thisMap.stat && thisMap.stat.onBoss){
							const hpData = thisMap.stat.onBoss.hpdat || [];
							hpData[id] = [eventData.api_now_maphp, eventData.api_max_maphp];
							thisMap.stat.onBoss.hpdat = hpData;
							self.setCurrentMapData(thisMap);
							console.log("Event map HP on sortie " + id + " recorded as", hpData[id]);
						}
					}
				});
			}
			// Remember morale values of sortied ships on sortieing started for GunFit tests
			if(ConfigManager.TsunDBSubmissionExtra_enabled){
				this.initialMorale = fleet.ships.map((rid, idx) => {
					const ship = fleet.ship(idx);
					return !ship.isDummy() ? ship.morale : 0;
				});
			} else {
				this.initialMorale = [];
			}
		},
		
		snapshotFleetState :function(){
			PlayerManager.hq.lastSortie = PlayerManager.cloneFleets();
			// remember index(es) of sent fleet(s) to battle
			this.focusedFleet = this.isCombinedSortie() ? [0,1] : [this.fleetSent-1];
			// remember index(es) of sent fleet(s) to exped support
			this.supportFleet = [];
			if(!this.isPvP()){
				var support1 = this.getSupportingFleet(false),
					support2 = this.getSupportingFleet(true);
				if(support1 > 0){
					this.supportFleet.push(support1 - 1);
					console.assert(this.focusedFleet.indexOf(support1 - 1) < 0, "focused fleet should not include pre-boss support");
				}
				if(support2 > 0){
					this.supportFleet.push(support2 - 1);
					console.assert(this.focusedFleet.indexOf(support2 - 1) < 0, "focused fleet should not include boss support");
				}
			}
			PlayerManager.hq.save();
		},
		
		getBattleFleetStates :function(addEquip = this.slotitemConsumed, addMorale = false){
			const fleetStates = this.focusedFleet.map(id => PlayerManager.fleets[id]).map(fleet => {
				const fleetState = {
					fuel: fleet.ships.map(ship => KC3ShipManager.get(ship).fuel),
					ammo: fleet.ships.map(ship => KC3ShipManager.get(ship).ammo),
					slots: fleet.ships.map(ship => KC3ShipManager.get(ship).slots),
				};
				// Could add more if necessary to track these properties of ships
				if(addEquip) fleetState.equip = fleet.ships.map(ship => KC3ShipManager.get(ship).equipment(true).map(g => g.masterId));
				if(addMorale) fleetState.morale = fleet.ships.map(ship => KC3ShipManager.get(ship).morale);
				return fleetState;
			});
			return fleetStates;
		},
		
		getSupportingFleet :function(bossSupport){
			const isSupportExpedition = (expedId, isBoss) => {
				const m = KC3Master.mission(expedId);
				// check sortied world matches with exped world
				return m && m.api_maparea_id === this.map_world &&
					// check is the right support exped display number
					(isBoss ? ["34", "S2"] : ["33", "S1"]).includes(m.api_disp_no);
			};
			for(let i = 2; i <= 4; i++)
				if(PlayerManager.fleets[i-1].active){
					const fleetExpedition = PlayerManager.fleets[i-1].mission[1];
					if(isSupportExpedition(fleetExpedition, bossSupport)){
						return i;
					}
				}
			return 0;
		},
		
		getWorldLandBases :function(world, map){
			// Now mapinfo declares max land base amount can be sortied via `api_air_base_decks`
			const mapInfo = this.getCurrentMapData(world, map),
				maxLbasAllowed = mapInfo.airBase,
				// Ignore regular maps that not allow to use land base, such as 6-1, 6-2, 6-3
				// For event maps, not sure if devs make 0 sortie but air raid defense needed map?
				isIgnoreThisMap = world < 10 && map !== undefined && !!mapInfo.id && !maxLbasAllowed;
			const lbas = [];
			$.each(PlayerManager.bases, function(i, base){
				if(base.rid > -1 && base.map === world && !isIgnoreThisMap
					// Not only sortie and defend, all actions saved for future loading
					//&& [1,2].indexOf(base.action) > -1
				){
					lbas.push(base.sortieJson());
				}
			});
			return lbas;
		},
		
		getSortieFleet: function() {
			return this.focusedFleet.slice(0);
		},
		
		isFullySupplied: function() {
			return this.focusedFleet.map(function(x){
				return PlayerManager.hq.lastSortie[x];
			}).every(function(ships){
				return ships.every(function(ship){
					return ship.isSupplied();
				});
			});
		},
		
		getSortieId: function() {
			return this.isOnUnsavedSortie() ? 0 : this.onSortie || 0;
		},
		
		getSortieMap: function() {
			return [this.map_world, this.map_num];
		},
		
		isOnSortie: function() {
			return Number.isInteger(this.onSortie) || this.isOnUnsavedSortie();
		},
		
		isOnUnsavedSortie: function() {
			return this.onSortie === Number.MAX_SAFE_INTEGER;
		},
		
		isOnSavedSortie: function() {
			return !this.isOnUnsavedSortie() && this.isOnSortie();
		},
		
		isSortieAt: function(world, map) {
			// Always return false on event maps
			// (speculated map_world for events >= 10 as expedition format follows)
			return (this.map_world == world && !KC3Meta.isEventWorld(this.map_world)) &&
				(this.map_num == (map || this.map_num));
		},
		
		isPvP: function(){
			return this.isSortieAt(-1) || this.onPvP;
		},
		
		isCombinedSortie: function() {
			return !!PlayerManager.combinedFleet && this.fleetSent === 1;
		},
		
		setBoss :function( cellno, comp ){
			// These are set on sortie start API call
			this.boss.bosscell = cellno;
			this.boss.comp = comp;
			this.boss.letters = [KC3Meta.nodeLetter(this.map_world, this.map_num, cellno)];
			console.debug("Boss node info on start", this.boss);
		},
		
		setSlotitemConsumed :function(cond, requestParams){
			if(cond === undefined && !!requestParams){
				const dameconUsedType = parseInt(requestParams.api_recovery_type, 10) || 0,
					resupplyUsedFlag = requestParams.api_supply_flag == 1,
					rationUsedFlag = requestParams.api_ration_flag == 1;
				// 1: repair team used, 2: repair goddess used
				cond = dameconUsedType > 0 || resupplyUsedFlag || rationUsedFlag;
			}
			if(typeof cond === "function"){
				this.slotitemConsumed = this.slotitemConsumed || !!cond.call(this);
			} else if(!!cond){
				this.slotitemConsumed = true;
			}
		},
		
		onBossAvailable :function(nodeObj){
			if(this.boss && nodeObj){
				this.boss.edge      = nodeObj.id;
				this.boss.formation = nodeObj.eformation;
				this.boss.ships     = nodeObj.eships;
				this.boss.lvls      = nodeObj.elevels;
				this.boss.maxhps    = nodeObj.maxHPs.enemy;
				this.boss.stats     = nodeObj.eParam;
				this.boss.equip     = nodeObj.eSlot;
				this.boss.info      = true;
				console.log("Boss node reached", this.boss);
			}
		},
		
		currentNode :function(){
			return this.nodes[ this.nodes.length - 1 ] || new KC3Node();
		},
		
		advanceNode :function( nodeData, UTCTime ){
			//console.debug("Raw next node data", nodeData);
			let nodeKind = "Dud";
			// Map Start Point
			// api_event_id = 0
			if (nodeData.api_event_id === 0) {
				nodeKind = "Dud";
			}
			// Route Selection Node
			// api_event_id = 6
			// api_event_kind = 2
			else if (typeof nodeData.api_select_route !== "undefined") {
				nodeKind = "Selector";
			}
			// Battle avoided node (message might be: Enemy not found / Peace sea / etc)
			// api_event_id = 1 or 6
			// api_event_kind = 0/1/3~25 (id 6, kind 2 used by route selection above)
			else if (nodeData.api_event_id === 6 || nodeData.api_event_id === 1) {
				// Might use another name to show a different message
				// since Phase 2, possible to see `nodeData.api_cell_flavor.api_message`
				nodeKind = "Dud";
			}
			// Resource Node
			// api_event_id = 2
			else if (typeof nodeData.api_itemget !== "undefined") {
				nodeKind = "Resource";
			}
			// Maelstrom Node
			// api_event_id = 3
			else if (typeof nodeData.api_happening !== "undefined") {
				nodeKind = "Maelstrom";
			}
			// Aerial Reconnaissance Node
			// api_event_id = 7
			// api_event_kind = 0
			else if (nodeData.api_event_id === 7 && nodeData.api_event_kind === 0) {
				// similar with both Resource and Transport, found at 6-3 G & H
				nodeKind = "Dud";
			}
			// Bounty Node, typical example: 1-6-N
			// api_event_id = 8
			else if (typeof nodeData.api_itemget_eo_comment !== "undefined") {
				nodeKind = "Bounty";
			}
			// Transport Node, event only for now
			// api_event_id = 9
			else if (nodeData.api_event_id === 9) {
				nodeKind = "Transport";
			}
			// Battle Node
			// api_event_kind = 1 (start from day battle)
			// api_event_kind = 2 (start at night battle), eg: 2-5 D; 5-3 BCDF; 6-5 J
			// api_event_kind = 3 (night battle first, then day battle), event in the past only
			// api_event_kind = 4 (aerial exchange battle), eg: 1-6 DFL
			// api_event_kind = 5 (enemy combined), eg: 6-5 Boss M
			// api_event_kind = 6 (defensive aerial battle), eg: 6-4 DFG; 6-5 GH
			// api_event_kind = 7 (night to day battle), since event fall 2017, all stages in 1 call
			// api_event_kind = 8 (long range radar ambush battle), since event winter 2019
			// api_event_id = 4 (normal battle)
			// api_event_id = 5 (boss battle)
			// api_event_id = 7 (aerial battle / reconnaissance (api_event_kind = 0))
			// api_event_id = 10 (long distance aerial raid)
			else if ([1, 2, 3, 4, 5, 6, 7, 8].indexOf(nodeData.api_event_kind) >= 0) {
				// api_event_id not used, might cause misjudging if new id added
				nodeKind = "Battle";
			} else {
				// Otherwise, supposed to be non-battle node
				console.log(`Unknown node kind, api_event_id = ${nodeData.api_event_id} and api_event_kind = ${nodeData.api_event_kind}, defining as dud`);
				nodeKind = "Dud";
			}
			
			// According testing, boss node not able to be indicated since api_bosscell_no return random values even edge is still hidden,
			// now we use manually configures to indicate known boss nodes (and their corresponding map gauges), see `fud_quarterly.json`
			const bossLetter = KC3Meta.nodeLetter(this.map_world, this.map_num, nodeData.api_bosscell_no);
			if(Array.isArray(this.boss.letters) && this.boss.letters.indexOf(bossLetter) < 0)
				this.boss.letters.push(bossLetter);
			console.debug("Next edge points to boss node", nodeData.api_bosscell_no, bossLetter);
			
			const definedKind = "defineAs" + nodeKind;
			const thisNode = (new KC3Node( this.getSortieId(), nodeData.api_no, UTCTime,
				this.map_world, this.map_num, nodeData ))[definedKind](nodeData);
			this.nodes.push(thisNode);
			this.updateNodeCompassResults();
			
			console.log("Next node", nodeData.api_no, definedKind, thisNode);
			this.save();
			return thisNode;
		},
		
		appendNode :function( nodeObj ){
			if(nodeObj instanceof KC3Node){
				this.nodes.push(nodeObj);
				return this.countNodes();
			}
			return false;
		},
		
		countNodes :function(){
			return this.nodes.length;
		},
		
		clearNodes :function(){
			// remove all array elements but no new array instance created,
			// alternative method (will pop up a new array): this.nodes.splice(0);
			this.nodes.length = 0;
		},
		
		engageLandBaseAirRaid :function( battleData ){
			// can not check node type because air raid may occur at any node
			this.currentNode().airBaseRaid( battleData );
		},
		
		engageBattle :function( battleData, stime ){
			if(this.currentNode().type != "battle"){ console.warn("Wrong node handling"); return false; }
			this.currentNode().engage( battleData, this.fleetSent );
		},
		
		engageBattleNight :function( nightData, stime ){
			if(this.currentNode().type != "battle"){ console.warn("Wrong node handling"); return false; }
			this.currentNode().engageNight( nightData, this.fleetSent );
		},
		
		engageNight :function( nightData ){
			if(this.currentNode().type != "battle"){ console.warn("Wrong node handling"); return false; }
			this.currentNode().night( nightData );
		},
		
		resultScreen :function( resultData ){
			if(this.currentNode().type != "battle"){ console.warn("Wrong node handling"); return false; }
			this.hqExpGained += resultData.api_get_exp;
			if(this.isPvP()){
				this.currentNode().resultsPvP( resultData );
			} else {
				this.currentNode().results( resultData );
				this.addSunk(this.currentNode().lostShips);
				this.checkFCF( resultData.api_escape );
			}
			this.updateMvps( this.currentNode().mvps );
			if(!ConfigManager.info_delta){
				PlayerManager.hq.checkRankPoints();
				PlayerManager.hq.updateLevel( resultData.api_member_lv, resultData.api_member_exp);
			}
			if(resultData.api_m1){
				console.info("Map gimmick flag detected", resultData.api_m1);
			}
		},
		
		/**
		 * @param node - current battle node instance by default.
		 * @param position - 0-based index of ship position, ranged in [0, 6].
		 * @param isOnEscortFleet - if ship is on escort fleet of combined fleet.
		 * @return true if ship at specified position is not taken any damage in any wave of opening airstrike,
		 *         will return undefined if bombing phase not occur or no data for specified ship.
		 * @see Node.js#takenAirBombingDamages - contains all waves of opening airstrike damages dealt to player fleets,
		 *      for now excluding LBAS battle (no damage can be taken), jet assaults (PvP ignored).
		 * @see main.js#TaskAircraftFlightBase.prototype._antiAircraft
		 * @see main.js#TaskAirWarAntiAircraft.prototype._start
		 *      in-game `12cm 30tube Rocket Launcher Kai Ni` animation will show the banner if damage <= 0.
		 */
		isPlayerNotTakenAirBombingDamage :function(node, position, isOnEscortFleet){
			const thisNode = node || this.currentNode();
			if(Array.isArray(thisNode.takenAirBombingDamages)) {
				let isUndefined = false;
				const found = thisNode.takenAirBombingDamages.find(wave => {
					const fleetIdx = isOnEscortFleet ? 1 : 0;
					if(!Array.isArray(wave[fleetIdx]) || wave[fleetIdx][position] === undefined) {
						isUndefined = true;
						return true;
					} else if(wave[fleetIdx][position] <= 0) {
						return true;
					}
				}) !== undefined;
				return isUndefined ? undefined : found;
			}
			return undefined;
		},
		
		updateMvps :function(mvps){
			if(Array.isArray(mvps) && mvps.length){
				if(this.isCombinedSortie()){
					const mainMvp = mvps[0] || 1,
						escortMvp = mvps[1] || 1,
						mainFleet = PlayerManager.fleets[0],
						escortFleet = PlayerManager.fleets[1];
					if(mainMvp > 0){
						this.cleanMvpShips(mainFleet);
						mainFleet.ship(mainMvp - 1).mvp = true;
					}
					if(escortMvp > 0){
						this.cleanMvpShips(escortFleet);
						escortFleet.ship(escortMvp - 1).mvp = true;
					}
				} else {
					const mvp = mvps[0] || mvps[1] || -1,
						fleet = PlayerManager.fleets[this.fleetSent - 1];
					if(mvp > 0){
						this.cleanMvpShips(fleet);
						fleet.ship(mvp - 1).mvp = true;
					}
				}
			}
		},
		
		cleanMvpShips :function(fleet){
			fleet.ship((rid, idx, ship) => {
				ship.mvp = false;
			});
		},
		
		checkFCF :function(escapeData){
			if (escapeData) {
				const getRetreatableShipId = (escapeIdx) => {
					if (!escapeIdx || !escapeIdx[0]) { return 0; }
					// Although there may be more elements in escape array, but only 1st element used
					// since only 1 ship (topmost one) can be retreated per battle
					const shipIndex = escapeIdx[0];
					// If combined fleets sent, index > 6 belongs to escort fleet
					if (this.isCombinedSortie() && shipIndex > 6) {
						return PlayerManager.fleets[1].ship(shipIndex - 7).rosterId;
					}
					return PlayerManager.fleets[this.fleetSent - 1].ship(shipIndex - 1).rosterId;
				};
				const taihadShip = getRetreatableShipId(escapeData.api_escape_idx);
				const escortShip = getRetreatableShipId(escapeData.api_tow_idx);
				this.fcfCheck = [taihadShip, escortShip].filter(rosterId => rosterId > 0);
				console.log("FCF escape-able ships have set to", this.fcfCheck);
			}
		},
		
		getCurrentFCF :function(){
			// For now only to event map, can sortie with CF and SF
			const isSortieAtEvent = KC3Meta.isEventWorld(this.map_world);
			const sortiedFleets = this.focusedFleet.map(id => PlayerManager.fleets[id]);
			if(!isSortieAtEvent || !sortiedFleets.length || !this.fcfCheck.length)
				return { isAvailable: false };
			const isCombinedSortie = sortiedFleets.length >= 2;
			const flagship = sortiedFleets[0].ship(0);
			const taihaShip = KC3ShipManager.get(this.fcfCheck[0]);
			const escortShip = isCombinedSortie && KC3ShipManager.get(this.fcfCheck[1]);
			const isNextNodeFound = !!this.currentNode().nodeData.api_next;
			const canUseFCF = !isCombinedSortie ?
				// is Striking Force (fleet #3) sortied (both check)
				this.fleetSent === 3 && sortiedFleets[0].ships[6] > 0
				// And flagship has SF-FCF (FCF incapable) (client check)
				&& flagship.hasEquipment(272)
				// And not flagship Taiha (supposed server-side checked already)
				//&& taihaShip.fleetPosition()[0] > 0
				// And current battle is not the final node (client check)
				&& isNextNodeFound
				:
				// Main fleet flagship has FCF (client check)
				flagship.hasEquipment(107)
				// And Taiha ship not flagship of main and escort (server check)
				//&& taihaShip.fleetPosition()[0] > 0
				// And escort-able DD available (flagship DD incapable) (server check)
				//&& !!escortShip && !escortShip.isDummy() && !escortShip.isAbsent()
				//&& escortShip.fleetPosition()[0] > 0
				//&& !escortShip.isTaiha()
				// And current battle is not the final node (client check)
				&& isNextNodeFound
				;
			return {
				isAvailable: canUseFCF,
				isCombined: isCombinedSortie,
				shipToRetreat: taihaShip,
				shipToEscort: escortShip,
				sortiedFleets: sortiedFleets,
				shipIdsToBeAbsent: this.fcfCheck.slice(0)
			};
		},
		
		sendFCFHome :function(){
			console.debug("FCF escape-able ships", this.fcfCheck);
			this.fcfCheck.forEach(function(fcfShip) {
				KC3ShipManager.get(fcfShip).didFlee = true;
			});
			[].push.apply(this.escapedList, this.fcfCheck.splice(0));
			console.log("Have escaped ships", this.escapedList);
		},
		
		addSunk :function(shizuList){
			console.debug("Adding sink list", shizuList);
			this.sinkList.main = this.sinkList.main.concat(shizuList[0]);
			this.sinkList.escr = this.sinkList.escr.concat(shizuList[1]);
		},
		
		discardSunk :function(){
			var fleetDesg = [this.fleetSent-1,1],
				self = this;
			Object.keys(this.sinkList).forEach(function(fleetType, fleetId){
				console.debug("Checking " + fleetType + " fleet #", fleetDesg[fleetId] + 1,
					"consisting of", PlayerManager.fleets[fleetDesg[fleetId]].ships);
				var sinkList = self.sinkList[fleetType];
				if(Array.isArray(sinkList) && sinkList.length > 0){
					console.log("Found sink losses", sinkList);
					sinkList.map(function(x){
						KC3ShipManager.remove(x);
						return x;
					}).filter(function(x){return false;});
				}
			});
		},
		
		updateNodeCompassResults: function(){
			if(this.isOnSavedSortie()) {
				KC3Database.updateNodes(this.onSortie, this.nodes.map(node => {
					// Basic edge ID and parsed type (dud === "")
					const toSave = { id: node.id, type: node.type };
					// Raw API result data
					const mapNext = node.nodeData;
					if(mapNext) {
						if(mapNext.api_event_id !== undefined)   // Node raw event ID, 0 should be saved
							toSave.eventId = mapNext.api_event_id;
						if(mapNext.api_event_kind !== undefined) // Node raw event kind, 0 should be saved
							toSave.eventKind = mapNext.api_event_kind;
						if(mapNext.api_destruction_battle)       // Land Base Enemy Raid
							toSave.airRaid = mapNext.api_destruction_battle;
						if(mapNext.api_offshore_supply)          // Resupplier used event
							toSave.offshoreSupply = mapNext.api_offshore_supply;
					}
					// FIXME saving nodeDesc directly will save translated text,
					// which causes i18n switching not affect old records.
					// To resolve this, parsed 'type, item & count' info should be saved,
					// which could be recognized via all these attributes:
					// api_itemget, api_happening, api_itemget_eo_result, api_itemget_eo_comment
					if(node.nodeDesc)
						toSave.desc = node.nodeDesc;
					return toSave;
				}));
			}
		},

		// return empty object if not found
		getAllMapData: function(){
			return localStorage.getObject("maps") || {};
		},
		
		setAllMapData: function(allMapData){
			localStorage.setObject("maps", allMapData || {});
		},
		
		// return empty object if not found
		getCurrentMapData: function(world, map){
			return (this.getAllMapData()[
				['m', world || this.map_world, map || this.map_num].join('')
			]) || {};
		},
		
		setCurrentMapData: function(mapData, world, map){
			const allMapData = this.getAllMapData();
			allMapData[
				['m', world || this.map_world, map || this.map_num].join('')
			] = (mapData || {});
			this.setAllMapData(allMapData);
		},
		
		load :function(){
			if(localStorage.sortie) {
				$.extend(this, localStorage.getObject("sortie"));
			}
		},
		
		save :function(){
			localStorage.setObject("sortie", this);
		},
		
		sortieName :function(diff){
			const pvpData = JSON.parse(localStorage.statistics || '{"pvp":{"win":0,"lose":0}}').pvp;
			return this.isPvP() ? (
				"pvp" + (this.onSortie = (Number(pvpData.win) + Number(pvpData.lose) + (diff||1)))
			) : ("sortie" + (this.isOnUnsavedSortie() ? 0 : this.onSortie || 0));
		},
		
		endSortie :function(portApiData){
			var sentFleet = this.fleetSent,
				self = this,
				cons = {};
			this.fleetSent = 1;
			cons.name = self.sortieName();
			cons.resc = Array.apply(null,{length:8}).map(function(){return 0;});
			// Calculate sortie difference with buffer
			var sentBattleSupportFleets = Array.isArray(PlayerManager.hq.lastSortie)
				? this.focusedFleet.concat(this.supportFleet) : [];
			sentBattleSupportFleets.map(id => PlayerManager.hq.lastSortie[id]).forEach(function(fleet, fleetIdx){
				fleet.forEach(function(after, ship_pos){
					var fleet_id = sentBattleSupportFleets[fleetIdx] + 1,
						rosterId = after.rosterId,
						before   = KC3ShipManager.get(rosterId),
						supply   = [
							/*
								[Fuel Difference] [Ammo Difference] [All Slots Difference]
							*/
							function(ship1,ship2){return ship1.fuel - ship2.fuel;},
							function(ship1,ship2){return ship1.ammo - ship2.ammo;},
							function(ship1,ship2){
								return Array.apply(null,{length:ship1.slots.length}).map(function(x,i){return (ship1.slots[i] - ship2.slots[i])*1;})
									.reduce(function(x,y){return x+y;});
							}
						].map(function(supplyFunc){return supplyFunc(before, after);}),
						/*
							RepairLength = 3, third entry always zero.
							if PvP => RepairLength = 0, all zero entry.
						*/
						repLen   = before.repair.length * !self.isPvP(),
						repair   = [1,2,9].map(function(x){
							return (x<repLen) ? Math.min(0, after.repair[x] - before.repair[x]) : 0;
						}),
						pendingCon = before.pendingConsumption[cons.name];
					if(!self.isPvP()) {
						before.lastSortie.unshift(cons.name);
					}
					if(pendingCon) {
						console.log("Battle pending consumption #", fleet_id, ship_pos, rosterId, pendingCon);
					}
					// Count steel consumed by jet
					if(Array.isArray(pendingCon) && pendingCon.length > 2) {
						cons.resc[2] += pendingCon[2][0] || 0;
						pendingCon.splice(2,1);
					}
					if(!(supply.every(function(matr){return !matr;}) && repair.every(function(matr){return !matr;}))){
						console.log("Supply & repair pending consumption #", fleet_id, ship_pos, rosterId, supply, repair);
						before.pendingConsumption[cons.name] = [supply, repair];
					}
				});
			});
			if(cons.name !== "sortie0") {
				console.log("Before " + cons.name +" sent fleets", sentBattleSupportFleets, PlayerManager.hq.lastSortie);
				console.log("After " + cons.name +" battle consumption and fleets", cons.resc, PlayerManager.cloneFleets());
			}
			// Ignore every resource gain if disconnected during sortie
			if(this.onCat)
				this.materialGain.fill(0);
			// Fill the resource gain to the current material checkout
			// Not need to increase lastMaterial because they've already updated at API 'api_port/port'
			// Otherwise lastMaterial will become 'doubled' issue.
			/*
			this.materialGain.forEach(function(x,i){
				if(i<(PlayerManager.hq.lastMaterial || []).length)
					PlayerManager.hq.lastMaterial[i] += x;
			});
			*/
			// Control Consumption of the Current Sortie
			cons.resc.forEach(function(matr,indx){
				self.materialGain[indx] += matr;
			});
			// Still save as a record with sortie id unknown 'sortie0',
			// for saving resupply / repair costs later
			if(this.isOnSortie()){
				KC3Database.Naverall({
					hour: Math.hrdInt('floor', this.sortieTime / 3.6, 3, 1),
					type: cons.name,
					data: this.materialGain.slice(0)
				}, null, true);
				// Save node data to sortie table even end at 1st node
				this.updateNodeCompassResults();
			}
			// Remove sortie comparison buffer
			PlayerManager.hq.lastSortie = null;
			// Record event debuff flags
			if(portApiData && portApiData.api_event_object
				&& KC3Meta.isEventWorld(this.map_world) && this.map_num > 0){
				const eventObject = portApiData.api_event_object;
				const thisMap = this.getCurrentMapData(this.map_world, this.map_num);
				if(eventObject.api_m_flag){
					thisMap.debuffFlag = eventObject.api_m_flag;
				}
				if(eventObject.api_m_flag2){
					thisMap.debuffSound = (thisMap.debuffSound || 0) + 1;
				}
				// first found at event Winter 2018
				/*
				if(eventObject.api_m_flag3){
					thisMap.selectedOperation = eventObject.api_m_flag3;
				}
				*/
				this.setCurrentMapData(thisMap, this.map_world, this.map_num);
			}
			
			// Reset sortie statistics
			this.map_world = 0;
			this.map_num = 0;
			this.map_difficulty = 0;
			this.hqExpGained = 0;
			this.boss = { info: false };
			this.clearNodes();
			if(PlayerManager.combinedFleet && sentFleet === 1){
				this.cleanMvpShips(PlayerManager.fleets[0]);
				this.cleanMvpShips(PlayerManager.fleets[1]);
				PlayerManager.fleets[0].setEscapeShip();
				PlayerManager.fleets[1].setEscapeShip();
			} else {
				this.cleanMvpShips(PlayerManager.fleets[sentFleet - 1]);
				PlayerManager.fleets[sentFleet - 1].setEscapeShip();
			}
			for(var ectr in this.escapedList){
				KC3ShipManager.get( this.escapedList[ectr] ).didFlee = false;
			}
			KC3ShipManager.save();
			
			this.focusedFleet = [];
			this.supportFleet = [];
			this.fcfCheck = [];
			this.escapedList = [];
			this.initialMorale = [];
			this.materialGain.fill(0);
			this.sinkList.main.splice(0);
			this.sinkList.escr.splice(0);
			KC3ShipManager.pendingShipNum = 0;
			KC3GearManager.pendingGearNum = 0;
			this.onSortie = false;
			this.onPvP = false;
			this.onCat = false;
			this.slotitemConsumed = false;
			this.sortieTime = 0;
			this.save();
		},

		/**
		 * Prepares encounter/real battle data for simulator export while on sortie
		 * @see https://kc3kai.github.io/kancolle-replay/simulator-import-help.html
		 */
		prepareSimData :function(edata, resultFleets = {}, realBattle = false) {
			let res = {};
			const thisNode = this.currentNode();
			const combined = this.isCombinedSortie();
			const fleet = PlayerManager.fleets[this.fleetSent - 1];
			const fleetF = {
				ships: this.prepareSimPlayerFleetShips(fleet, realBattle),
				formation: (ConfigManager.aaFormation < 7 && !combined) || (ConfigManager.aaFormation > 10 && combined) ? ConfigManager.aaFormation 
					: !combined ? 1 : 14
			};
			if (combined) {
				fleetF.shipsC = this.prepareSimPlayerFleetShips(PlayerManager.fleets[1], realBattle);
				fleetF.combineType = PlayerManager.combinedFleet;
			}

			const fleetE = {
				ships: this.prepareSimEnemyFleetShips(edata.main, resultFleets.enemyMain)
			};
			if (edata.escort && edata.escort.length > 0) {
				fleetE.shipsC = this.prepareSimEnemyFleetShips(edata.escort, resultFleets.enemyEscort);
			}
			const nodes = [{
				fleetE: fleetE
			}];

			res = {
				numSims: 10000,
				fleetF: fleetF,
				nodes: nodes,
			};

			// If real battle, we can ignore stuff like lbas/support fleets since we are only interested in yasen prediction
			if (realBattle) {
				res.nodes[0].NBOnly = 1;
				const battleData = thisNode.battleDay || thisNode.battleNight;
				fleetF.formation = battleData.api_formation[0];
				fleetE.formation = battleData.api_formation[1];
				return res;
			}
			
			// For simulating from encounters, we need to prepare LBAS, Support Fleets and Enemy Formation

			fleetE.formation = edata.formation;
			const isBoss = thisNode.isBoss();
			const supportFleetNum = this.getSupportingFleet(isBoss);
			if (supportFleetNum > 0) {
				const supportFleet = PlayerManager.fleets[supportFleetNum - 1];
				res.fleetSupportB = {
					ships: this.prepareSimPlayerFleetShips(supportFleet),
					formation: fleetF.formation,
				};
			}

			// Simulator options
			const eventKind = thisNode.eventKind;
			if (eventKind === 2) {
				res.nodes[0].NBOnly = 1;
			}
			else if (eventKind === 4) {
				res.nodes[0].airOnly = 1;
			}
			else if (eventKind === 6) {
				res.nodes[0].airRaid = 1;
			}
			else if (isBoss) {
				res.nodes[0].doNB = 1;
			}

			// Export LBAS (if any)
			const bases = PlayerManager.bases.filter(base => base.action === 1 && base.map === this.map_world);
			// Convert to node letter in case airstrike selected node id different from route node id (multiple path to same node)
			const node = KC3Meta.nodeLetter(this.map_world, this.map_num, thisNode.id);
			let baseCount = 0;
			if (bases.length > 0) {
				const lbas = [], waves = [], simPlayerEqIdMax = 308;
				for (let idx = 0; idx < bases.length; idx++) {
					let strikePoints = bases[idx].strikePoints || [], arr = [];
					for (let point = 0; point < strikePoints.length; point++) {
						arr.push(KC3Meta.nodeLetter(this.map_world, this.map_num, strikePoints[point]));
					}
					strikePoints = arr;
					if (strikePoints.length === 0 || !strikePoints.includes(node)) { continue; }
					baseCount++;
					const equips = [], slotdata = [];
					const base = bases[idx];
					for (let plane = 0; plane < base.planes.length; plane++) {
						const gear = KC3GearManager.get(base.planes[plane].api_slotid);
						if (gear.isDummy()) { continue; }
						const eqData = {
							masterId: gear.masterId,
							improve: gear.stars,
							proficiency: gear.ace
						};
						slotdata.push(base.planes[plane].api_count);
						if (gear.masterId > simPlayerEqIdMax) { eqData.stats = this.generateEquipStats(gear.masterId); }
						equips.push(eqData);
					}
					lbas.push({
						equips: equips,
						slots: slotdata
					});

					for (let waveIdx = 0; waveIdx < strikePoints.length; waveIdx++) {
						if (strikePoints[waveIdx] === node) { waves.push(baseCount); }
					}
				}
				res.lbas = lbas;
				res.nodes[0].lbas = waves;
			}
			return res;
		},
		
		prepareSimEnemyFleetShips :function(midList, resultFleet){
			midList = midList.filter(id => id > 0);
			const simAbyssMasterIdMax = 1845;
			const list = [];
			for (let idx = 0; idx < midList.length; idx++) {
				const masterId = midList[idx];
				const obj = {
					masterId: masterId,
				};
				if (resultFleet) {
					obj.HPInit = resultFleet[idx].hp;
				}

				// If new enemy and not in sim yet, fill stats
				if (masterId > simAbyssMasterIdMax) {
					const master = KC3Master.ship(masterId) || {};
					obj.stats = {
						type: master.api_stype,
					};
					if (KC3Master.abyssalShip(masterId)) {
						const stats = KC3Master.abyssalShip(masterId);
						obj.stats.HP = stats.api_taik;
						obj.stats.FP = stats.api_houg;
						obj.stats.TP = stats.api_raig;
						obj.stats.AA = stats.api_tyku;
						obj.stats.AR = stats.api_souk;
						const equips = stats.kc3_slots || [];
						obj.stats.SLOTS = stats.api_maxeq || equips.map(() => 0);

						obj.equips = [];
						for (let k = 0; k < equips.length; k++) {
							const gearId = equips[k];
							obj.equips.push({
								masterId: gearId,
								stats: this.generateEquipStats(gearId)
							});
						}
					}
				}
				list.push(obj);
			}
			return list;
		},

		prepareSimPlayerFleetShips :function(fleet, realBattle = false) {
			const simPlayerEqIdMax = 308;
			const list = [];
			for (let idx = 0; idx < fleet.ships.length; idx++) {
				const ship = fleet.ship(idx);
				if (ship.isDummy() || ship.isAbsent()) { continue; }
				let stats = {
					HP: ship.hp[1],
					FP: ship.fp[0],
					TP: ship.tp[0],
					AA: ship.aa[0],
					AR: ship.ar[0],
					LUK: ship.lk[0],
					EV: ship.ev[0],
					ASW: ship.as[0],
					LOS: ship.ls[0],
					RNG: ship.range,
					SPD: ship.speed,
					SLOTS: ship.slots,
					type: ship.master().api_stype
				};
				let equips = ship.equipment(true).map(gear => {
					let equip = {
						masterId: gear.masterId,
						improve: gear.stars,
						proficiency: gear.ace
					};					

					// If equip data not in sim yet, fill with stats
					if (equip.masterId > simPlayerEqIdMax) { equip.stats = this.generateEquipStats(gear.masterId); }
					return equip;
				});
				equips = equips.filter(equip => equip.masterId > 0);
				let morale = ship.morale;
				// Undo kc3 morale calc, ignore case for -9 and align morale to sim cutoffs
				if (realBattle) {
					morale += 3;
				}
				else if (morale > 49 && morale < 53) {
					morale += 3;
				}
				list.push({
					masterId: ship.masterId,
					LVL: ship.level,
					stats: stats,
					HPInit: !realBattle ? ship.hp[0] : ship.afterHp[0],
					fuelInit: ship.fuel / ship.master().api_fuel_max,
					ammoInit: ship.ammo / ship.master().api_bull_max,
					morale: morale,
					equips: equips,
					includesEquipStats: 1
				});
			}
			return list;
		},

		generateEquipStats :function(masterId) {
			const gearMaster = KC3Master.slotitem(masterId),
				stats = {},
				simulatorKeys = {
					FP: "api_houg",
					TP: "api_raig",
					AA:	"api_tyku",
					AR:	"api_souk",
					EV: "api_houk",
					ASW: "api_tais",
					LOS: "api_saku",
					ACC: "api_houm",
					DIVEBOMB: "api_baku",
					RNG: "api_leng"
			};
			for (let key in simulatorKeys) {
				const apiName = simulatorKeys[key];
				stats[key] = gearMaster[apiName];
			}
			stats.type = gearMaster.api_type[3];
			return stats;
		}
		
	};
	
})();
