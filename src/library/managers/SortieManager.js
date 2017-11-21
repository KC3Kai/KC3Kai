/* SortieManager.js
KC3改 Sortie Manager

Stores and manages states and functions during sortie of fleets (including PvP battle).
*/
(function(){
	"use strict";
	
	window.KC3SortieManager = {
		onSortie: 0,
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
				lbas: this.getWorldLandBases(world),
				time: stime
			};
			// Add optional properties
			// Record states of unclear normal (or EO) maps
			if((world < 10 && mapnum > 4) || typeof thisMap.kills !== "undefined"){
				sortie.mapinfo = { "api_cleared": thisMap.clear };
				if(typeof thisMap.kills !== "undefined"){
					sortie.mapinfo.api_defeat_count = thisMap.kills || 0;
				}
			}
			// Record boss HP gauge states of event maps
			if(eventData){
				const mergedEventInfo = {};
				$.extend(mergedEventInfo, eventData, {
					// api_state not stored, use this instead
					"api_cleared": thisMap.clear,
					"api_gauge_type": thisMap.gaugeType
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
				// Save on database and remember current sortie id
				KC3Database.Sortie(sortie, function(id){
					self.onSortie = id;
					self.sortieTime = stime;
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
		},
		
		snapshotFleetState :function(){
			PlayerManager.hq.lastSortie = PlayerManager.cloneFleets();
			// remember index(es) of sent fleet(s) to battle
			this.focusedFleet = (PlayerManager.combinedFleet && this.fleetSent === 1) ? [0,1] : [this.fleetSent-1];
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
		
		getSupportingFleet :function(bossSupport){
			function supportFormula(expedNum, isBoss){
				// expedition ID extended since 207-10-18, 101 no longer the start of event support
				// starts from 301 since 2017-11-17, might be retrieved from master missions with disp no S1, S2
				const eventStartId = 301 - 1;
				const mission = KC3Master.mission(expedNum);
				let world = mission ? mission.api_maparea_id : 0;
				const event = world >= 10 || expedNum > eventStartId;
				if(event) expedNum -= eventStartId;
				world = world || Math.floor((expedNum - 1) / 8) + 1;
				const n = (expedNum - 1) % 8;
				return (world === 5 || event) && (isBoss ? n === 1 : n === 0);
			}
			for(var i = 2; i <= 4; i++)
				if(PlayerManager.fleets[i-1].active){
					var fleetExpedition = PlayerManager.fleets[i-1].mission[1];
					if(supportFormula(fleetExpedition, bossSupport)){
						return i;
					}
				}
			return 0;
		},
		
		getWorldLandBases :function(world){
			const lbas = [];
			$.each(PlayerManager.bases, function(i, base){
				if(base.rid > -1 && base.map === world
					// Only sortie and defend needed
					&& [1,2].indexOf(base.action) > -1){
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
			return this.onSortie > 0 || this.isOnUnsavedSortie();
		},
		
		isOnUnsavedSortie: function() {
			return this.onSortie === Number.MAX_SAFE_INTEGER;
		},
		
		isOnSavedSortie: function() {
			return !this.isOnUnsavedSortie() && this.isOnSortie();
		},
		
		isSortieAt: function(world, map) {
			// Always return false on event maps
			// (speculated map_world for events > 10 as expedition format follows)
			return (this.map_world == world && this.map_world < 10) &&
				(this.map_num == (map || this.map_num));
		},
		
		isPvP: function(){
			return this.isSortieAt(-1) || this.onPvP;
		},
		
		setBoss :function( cellno, comp ){
			// These are set on sortie start API call
			this.boss.bosscell = cellno;
			this.boss.comp = comp;
			this.boss.letters = [KC3Meta.nodeLetter(this.map_world, this.map_num, cellno)];
			console.debug("Boss node info on start", this.boss);
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
			// api_event_id = 6
			// api_event_kind = 0/1/3/4/5/6/7/8/9
			else if (nodeData.api_event_id === 6) {
				// Might use another name to show a different message?
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
			// api_event_kind = 7 (night to day battle), new for event fall 2017, why not 3?
			// api_event_id = 4 (normal battle)
			// api_event_id = 5 (boss battle)
			// api_event_id = 7 (aerial battle / reconnaissance (api_event_kind = 0))
			// api_event_id = 10 (long distance aerial raid)
			else if ([1, 2, 3, 4, 5, 6, 7].indexOf(nodeData.api_event_kind) >= 0) {
				// api_event_id not used, might cause misjudging if new id added
				nodeKind = "Battle";
			} else {
				// Otherwise, supposed to be non-battle node
				console.log(`Unknown node kind, api_event_id = ${nodeData.api_event_id} and api_event_kind = ${nodeData.api_event_kind}, defining as dud`);
				nodeKind = "Dud";
			}
			
			// According testing, boss node not able to be indicated since api_bosscell_no return random values even edge is still hidden
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
		},
		
		updateMvps :function(mvps){
			if(Array.isArray(mvps) && mvps.length){
				if(PlayerManager.combinedFleet && this.fleetSent === 1){
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
		
		checkFCF :function( escapeData ){
			if ((typeof escapeData !== "undefined") && (escapeData !== null)) {
				console.debug("FCF triggered");

				const taihadShip = this.getRetreatedShip(escapeData.api_escape_idx);
				const escortShip = this.getRetreatedShip(escapeData.api_tow_idx);

				this.fcfCheck = [taihadShip, escortShip].filter(function (ship) {
					return typeof ship !== 'undefined';
				});
				
				console.log("Has set fcfCheck to", this.fcfCheck);
			}
		},

		getRetreatedShip: function (escapeIdx) {
			if (!escapeIdx) { return undefined; }

			const shipIndex = escapeIdx[0];
			if (PlayerManager.combinedFleet && shipIndex > 6) {
				return PlayerManager.fleets[this.fleetSent].ship(shipIndex - 7).rosterId;
			}
			return PlayerManager.fleets[this.fleetSent - 1].ship(shipIndex - 1).rosterId;
		},
		
		sendFCFHome :function(){
			console.debug("Setting escape flag for fcfCheck", this.fcfCheck);
			this.fcfCheck.forEach(function(fcfShip){
				KC3ShipManager.get(fcfShip).didFlee = true;
			});
			[].push.apply(this.escapedList,this.fcfCheck.splice(0));
			console.log("New escapedList", this.escapedList);
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
			) : ("sortie" + (this.isOnUnsavedSortie() ? 0 : this.onSortie));
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
			if(portApiData && portApiData.api_event_object){
				const eventObject = portApiData.api_event_object;
				const thisMap = this.getCurrentMapData(this.map_world, this.map_num);
				if(eventObject.api_m_flag){
					thisMap.debuffFlag = eventObject.api_m_flag;
				}
				if(eventObject.api_m_flag2){
					thisMap.debuffSound = (thisMap.debuffSound || 0) + 1;
				}
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
			} else {
				this.cleanMvpShips(PlayerManager.fleets[sentFleet - 1]);
			}
			for(var ectr in this.escapedList){
				KC3ShipManager.get( this.escapedList[ectr] ).didFlee = false;
			}
			KC3ShipManager.save();
			
			this.focusedFleet = [];
			this.supportFleet = [];
			this.fcfCheck = [];
			this.escapedList = [];
			this.materialGain.fill(0);
			this.sinkList.main.splice(0);
			this.sinkList.escr.splice(0);
			KC3ShipManager.pendingShipNum = 0;
			KC3GearManager.pendingGearNum = 0;
			this.onSortie = 0;
			this.onPvP = false;
			this.onCat = false;
			this.sortieTime = 0;
			this.save();
		}
		
	};
	
})();
