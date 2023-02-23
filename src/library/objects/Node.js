/* Node.js
KC3改 Node Object

Represents a single battle on a node
Used by SortieManager
*/
(function(){
	"use strict";
	
	window.KC3Node = function(sortie_id, api_no, utcTime, world, map, raw){
		// will be 0 if sortie has not been saved to DB (yet)
		this.sortie = sortie_id || 0;
		this.id = api_no || 0;
		// node data supposed to be available only if created with time stamp
		this.stime = utcTime;
		this.type = "";
		this.isPvP = false;
		this.letter = KC3Meta.nodeLetter(world || KC3SortieManager.map_world,
			map || KC3SortieManager.map_num, this.id);
		this.nodeData = raw || {};
	};

	// set true to test HP, rank and MVP predicting easier via SRoom Maps History
	KC3Node.debugPrediction = function() { return false; };
	
	// Update this list if more extra classes added
	KC3Node.knownNodeExtraClasses = function(isEmptyClassKept = false){
		const classNameKindIdMap = ["", "",
			"nc_night_battle", "nc_night_battle",
			"nc_air_battle", "nc_enemy_combined", "nc_air_raid",
			"nc_night_to_day", "nc_long_range_raid"
		];
		return isEmptyClassKept ? classNameKindIdMap : classNameKindIdMap.filter(n => !!n);
	};
	
	KC3Node.prototype.isInitialized = function(){
		return !!this.stime;
	};
	
	KC3Node.prototype.defineAsBattle = function( nodeData ){
		this.type = "battle";
		this.startsFromNight = false;
		
		// If passed initial values
		if(typeof nodeData !== "undefined"){
			
			// If passed raw data from compass,
			// about api_event_id and api_event_kind, see SortieManager.js#L237
			if(typeof nodeData.api_event_kind !== "undefined"){
				this.eships = [];
				this.eventKind = nodeData.api_event_kind;
				this.eventId = nodeData.api_event_id;
				this.gaugeDamage = 0; // calculate this on result screen. make it fair :D
				this.nodeDesc = ["", "",
					KC3Meta.term("BattleKindNightStart"),
					KC3Meta.term("BattleKindNightStart"),
					KC3Meta.term("BattleKindAirBattleOnly"),
					KC3Meta.term("BattleKindEnemyCombined"),
					KC3Meta.term("BattleKindAirDefendOnly"),
					KC3Meta.term("BattleKindNightToDay"),
					KC3Meta.term("BattleKindLongRangeRaid")][this.eventKind];
				this.nodeExtraClass = KC3Node.knownNodeExtraClasses(true)[this.eventKind] || "";
			}
			
			// If passed formatted enemy list from PVP
			if(typeof nodeData.pvp_opponents !== "undefined"){
				this.eships = nodeData.pvp_opponents;
				this.gaugeDamage = -1;
			} else {
				this.mainFlagshipKilled = false;
			}
		}
		this.enemySunk = [false, false, false, false, false, false];
		this.enemyHP = [{},{},{},{},{},{}];
		this.originalHPs = [0,0,0,0,0,0,0,0,0,0,0,0,0];
		this.allyNoDamage = true;
		this.nodalXP = 0;
		this.lostShips = [[],[]];
		this.mvps = [];
		this.dameConConsumed = [];
		this.dameConConsumedEscort = [];
		this.enemyEncounter = {};
		return this;
	};
	
	// Building up resource / item gain / loss descriptions
	KC3Node.prototype.buildItemNodeDesc = function(itemInfoArray) {
		var resourceNameMap = {
			"1": 31, "2": 32, "3": 33, "4": 34, // Fuel, Ammo, Steel, Bauxite
			"5": 2 , "6": 1 , "7": 3 // Blowtorch, Bucket, DevMat, Compass
		};
		var resourceDescs = [];
		itemInfoArray.forEach(function(item) {
			var rescKeyDesc = KC3Meta.useItemName(
				resourceNameMap[item.api_icon_id] || item.api_icon_id
			);
			if (!rescKeyDesc)
				return;
			if (typeof item.api_getcount !== "undefined")
				resourceDescs.push( rescKeyDesc + ": " + item.api_getcount );
			else if (typeof item.api_count !== "undefined")
				resourceDescs.push( rescKeyDesc + ": -" + item.api_count );
		});
		return resourceDescs.join("\n");
	};
	
	KC3Node.prototype.defineAsResource = function( nodeData ){
		this.type = "resource";
		this.item = [];
		this.icon = [];
		this.amount = [];
		const itemgetArr = Array.isArray(nodeData.api_itemget) ? nodeData.api_itemget :
			nodeData.api_itemget && nodeData.api_itemget.api_id ? [nodeData.api_itemget] : [];
		this.nodeDesc = this.buildItemNodeDesc( itemgetArr );
		itemgetArr.forEach(itemget => {
			const icon_id = itemget.api_icon_id;
			const getcount = itemget.api_getcount;
			this.item.push(icon_id);
			this.icon.push(function(folder){
				return folder+(
					["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass","","box1","box2","box3"]
					[icon_id - 1]
				)+".png";
			});
			this.amount.push(getcount);
			if(icon_id < 8)
				KC3SortieManager.materialGain[icon_id - 1] += getcount;
		});
		return this;
	};
	
	KC3Node.prototype.defineAsBounty = function( nodeData ){
		const self = this,
			mapKey = KC3SortieManager.getSortieMap().join(''),
			currentMap = KC3SortieManager.getCurrentMapData();
		this.type = "bounty";
		this.item = nodeData.api_itemget_eo_comment.api_id;
		this.icon = function(folder){
			return folder+(
				["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass"]
				[self.item - 1]
			)+".png";
		};
		this.nodeDesc = this.buildItemNodeDesc([
			{ api_icon_id: nodeData.api_itemget_eo_comment.api_id,
				api_getcount: nodeData.api_itemget_eo_comment.api_getcount
			}
		]);
		this.amount = nodeData.api_itemget_eo_comment.api_getcount;
		KC3SortieManager.materialGain[this.item-1] += this.amount;
		
		currentMap.clear |= (++currentMap.kills) >= KC3Meta.gauge(mapKey);
		KC3SortieManager.setCurrentMapData(currentMap);
		
		if(KC3SortieManager.isSortieAt(1, 6)){
			// Bq3: Sortie 2 BBV/AO to [W1-6], reach node N twice
			if(KC3QuestManager.isPrerequisiteFulfilled(861)){
				KC3QuestManager.get(861).increment();
			}
			// By2: 5th requirement: reach [W1-6] node N once
			if(KC3QuestManager.isPrerequisiteFulfilled(905)){
				KC3QuestManager.get(905).increment(4);
			}
			// By3: 5th requirement: reach [W1-6] node N once
			if(KC3QuestManager.isPrerequisiteFulfilled(912)){
				KC3QuestManager.get(912).increment(4);
			}
			// By7: 3rd requirement: reach [W1-6] node N twice
			if(KC3QuestManager.isPrerequisiteFulfilled(945)){
				KC3QuestManager.get(945).increment(2);
			}
		}
		return this;
	};
	
	KC3Node.prototype.defineAsMaelstrom = function( nodeData ){
		this.type = "maelstrom";
		this.item = nodeData.api_happening.api_icon_id;
		this.icon = function(folder){
			return folder+(
				["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass"]
				[nodeData.api_happening.api_icon_id - 1]
			)+".png";
		};
		this.nodeDesc = this.buildItemNodeDesc( [nodeData.api_happening] );
		this.amount = nodeData.api_happening.api_count;
		this.reduceFleetRscOnMaelstrom(nodeData);
		return this;
	};
	
	KC3Node.prototype.reduceFleetRscOnMaelstrom = function(nodeData) {
		if(!nodeData || !nodeData.api_happening) return;
		const itemId = nodeData.api_happening.api_mst_id;
		const rscType = ["", "fuel", "ammo"][itemId] || "";
		// Do nothing if not fuel or ammo lost
		if(!rscType) return;
		let maxRemainingRsc = 0, radarShips = 0;
		KC3SortieManager.getSortieFleet().map(id => PlayerManager.fleets[id]).forEach(fleet => {
			fleet.shipsUnescaped().forEach(ship => {
				maxRemainingRsc = Math.max(maxRemainingRsc, ship[rscType] || 0);
				radarShips += (ship.hasEquipmentType(2, [12, 13]) & 1);
			});
		});
		const actualMaxLoss = nodeData.api_happening.api_count;
		// Nothing to lose?
		if(!actualMaxLoss || maxRemainingRsc === 0) return;
		
		// For phase 1:
		// Server-side might use `min(nodeMaxLoss, floor(nowRsc * 0.4 * [1, 0.75, 0.6, 0.5][radarShips]))`,
		// reduce it from remaining rsc of all activated ships and return the max value as `api_count`.
		// `radarShips` = amount of ships equipped any type of radar,
		// `nodeMaxLoss` is the map cell property which unknown by client-side,
		// can be get from `api_count` if computed one greater than it.
		
		// For phase 2: https://wikiwiki.jp/kancolle/%E8%B3%87%E6%9D%90#b7c2f0c7
		// Definitions of loss rate, max loss, etc no longer fixed by maps, can be various by maps & nodes,
		// and random chance to suffer high loss for some nodes implemented.
		// Partially verified definitions see `fud_weekly.json#maelstromLoss` property.
		const lossDef = KC3Meta.maelstromLoss([KC3SortieManager.map_world, KC3SortieManager.map_num].join(""), this.id);
		// Do nothing if loss defintion for this node unknown
		if(!lossDef || !lossDef[2]) {
			console.log("{0} loss at maelstrom node {1} undefined, max loss: {2}/{3}, radar: {4}".format(
				rscType, this.letter, actualMaxLoss, maxRemainingRsc, radarShips),
				lossDef);
			return;
		}
		
		const [defRscType, defLossCap, defLossRate, defLossRateHigh] = lossDef;
		const isReducedByRadar = !!nodeData.api_happening.api_dentan;
		// Uncertain: radarShips capped at 6, even for CF and Striking Force? will not handle them though because we don't have event map defined.
		// For phase 1 combined fleet: radarShips only contribute to their own single fleet
		const radarReduceRate = radarShips && isReducedByRadar ? [0, 0.25, 0.4, 0.5, 0.55, 0.58, 0.6][Math.min(6, radarShips)] : 0;
		const definedCappedLoss = defLossCap || actualMaxLoss;
		let lossRate = 0, expectedMaxLoss = 0;
		if(defLossRate === defLossRateHigh) {
			// Not a strong maelstrom node
			lossRate = defLossRate * (1 - radarReduceRate);
			expectedMaxLoss = Math.floor(maxRemainingRsc * lossRate);
		} else {
			// Strong maelstrom node can cause random high loss (fixed 150% for now)
			const lossRateLow = defLossRate * (1 - radarReduceRate),
				lossRateHigh = defLossRateHigh * (1 - radarReduceRate);
			const expectedMaxLossLow = Math.floor(maxRemainingRsc * lossRateLow),
				expectedMaxLossHigh = Math.floor(maxRemainingRsc * lossRateHigh);
			// here guesses which loss rate is rolled
			if((actualMaxLoss >= expectedMaxLossHigh)
				|| (definedCappedLoss > expectedMaxLossLow && actualMaxLoss > expectedMaxLossLow && actualMaxLoss < expectedMaxLossHigh)
				|| (definedCappedLoss <= expectedMaxLossLow && actualMaxLoss > definedCappedLoss)
			) {
				lossRate = lossRateHigh;
				expectedMaxLoss = expectedMaxLossHigh;
			} else {
				lossRate = lossRateLow;
				expectedMaxLoss = expectedMaxLossLow;
			}
		}
		const isCappedByNode = (actualMaxLoss === definedCappedLoss) && actualMaxLoss < expectedMaxLoss;
		
		let totalLost = 0;
		if(lossRate > 0) {
			KC3SortieManager.getSortieFleet().map(id => PlayerManager.fleets[id]).forEach(fleet => {
				fleet.shipsUnescaped().forEach(ship => {
					// cap reduction to map node max loss value
					let loss = Math.min(actualMaxLoss, Math.floor(ship[rscType] * lossRate));
					// cap reduction to remaining rsc, guarantee it >= 0
					loss = Math.min(ship[rscType], loss);
					ship[rscType] -= loss;
					totalLost += loss;
				});
			});
		}
		console.log("Fleet(s) will lose {0} {1} in total at maelstrom node {2}".format(rscType, totalLost, this.letter),
			lossDef,
			"inferred loss rate {0}".format(Math.qckInt("floor", lossRate, 2)),
			"({0} / {1}){2}{3}".format(
				actualMaxLoss, maxRemainingRsc,
				(isCappedByNode ? " (capped from {0})".format(expectedMaxLoss) : ""),
				(isReducedByRadar ? " (reduced by {0} radars)".format(radarShips) : "")
			)
		);
	};
	
	KC3Node.prototype.defineAsSelector = function( nodeData ){
		this.type = "select";
		this.choices = [
			KC3Meta.nodeLetter(
				KC3SortieManager.map_world,
				KC3SortieManager.map_num,
				nodeData.api_select_route.api_select_cells[0] ),
			KC3Meta.nodeLetter(
				KC3SortieManager.map_world,
				KC3SortieManager.map_num,
				nodeData.api_select_route.api_select_cells[1] )
		];
		console.log("Route choices", this.choices);
		return this;
	};
	
	KC3Node.prototype.defineAsTransport = function( nodeData ){
		this.type = "transport";
		this.amount = PlayerManager.fleets[KC3SortieManager.fleetSent-1].calcTpObtain(
			...KC3SortieManager.getSortieFleet().map(id => PlayerManager.fleets[id])
		);
		console.log("TP amount when arrive TP point", this.amount);
		return this;
	};
	
	KC3Node.prototype.defineAsDud = function( nodeData ){
		this.type = "";
		// since Fall 2018, use message from API first
		this.dudMessage = (nodeData.api_cell_flavor || {}).api_message;
		// since Summer 2019, message from `main.js#CellTaskAnchorageRepair.prototype._start`
		if(nodeData.api_event_id === 10) {
			this.isEmergencyRepairNode = true;
			this.canEmergencyRepairFlag = nodeData.api_anchorage_flag;
			if(!this.dudMessage) this.dudMessage = "波静かな、泊地に適した海域です。";
		}
		// hard-coded messages, see `main.js#CellTaskFancy.prototype._selectMessage`
		if(!this.dudMessage) this.dudMessage = ({
			0: "気のせいだった。",
			1: "敵影を見ず。",
			3: "穏やかな海です。",
			4: "穏やかな海峡です。",
			5: "警戒が必要です。",
			6: "静かな海です。",
		})[nodeData.api_event_kind];
		return this;
	};
	
	// For compatibility, if there is still any property of Array starts with -1 element
	KC3Node.prototype.normalizeArrayIndex = function(array){
		// reuse function from prediction module
		return KC3BattlePrediction.normalizeArrayIndexing(array);
	};
	
	/**
	 * Detect KCSAPI old battle data via existing `api_f_maxhps` instead of `api_maxhps`
	 * @param battleData - raw battle API data.
	 * @return undefined if raw battle data not ready, like non-battle nodes.
	 */
	KC3Node.prototype.isOldBattleData = function(battleData){
		const data = battleData || this.battleNight || this.battleDay;
		return !data ? undefined : data.api_f_maxhps === undefined && Array.isArray(data.api_maxhps);
	};
	
	/**
	 * Check for any one-time special cutin from player fleet.
	 * @param predictedFleets - result of predicted fleets.
	 * @param isNight - indicates battle during night.
	 * @param isCombined - indicates player combined fleet battle.
	 */
	KC3Node.prototype.checkSortieSpecialAttacks = function(predictedFleets, isNight = false, isCombined = false){
		const checkSortieSpecialAttack = attacks => attacks.some(attack => {
			const spApiId = Number(attack.cutin || attack.ncutin);
			// special attacks ID ranged in [100, 200)
			// [200, 201] used by multi-angle/night-zuiun attacks, not counted
			// [300, 302] used by submarine fleet attacks since 2021-05-08
			// [400, 401] used by Yamato/Musashi special attacks
			if (spApiId.inside(200, 201)) return false;
			if (spApiId.inside(300, 302)) {
				// it's not one-time per sortie, may be multiple times as long as resupply materials remained,
				// to remember all its day and night time triggering.
				this.sortieSpecialSubFleetDayNight = this.sortieSpecialSubFleetDayNight || [0, 0];
				this.sortieSpecialSubFleetDayNight[isNight ? 1 : 0] = 1;
				return true;
			}
			if (spApiId >= 100) return true;
			return false;
		});
		const fleetNum = isNight && isCombined ? 2 : 1;
		const playerFleet = fleetNum === 2 ? predictedFleets.playerEscort : predictedFleets.playerMain;
		// to hit result of sub fleet attack, have to check all ships instead of only flagship
		const cutinShipsInFleetNum = playerFleet
				.map(ship => checkSortieSpecialAttack(ship.attacks))
				.map(v => v && fleetNum);
		if (cutinShipsInFleetNum.some(v => v > 0)) {
			this.sortieSpecialCutins = cutinShipsInFleetNum;
		}
	};
	
	/* BATTLE FUNCTIONS
	---------------------------------------------*/
	KC3Node.prototype.engage = function( battleData, fleetSent ){
		this.battleDay = battleData;
		this.fleetSent = fleetSent || this.fleetSent || battleData.api_deck_id || KC3SortieManager.fleetSent;
		//console.debug("Raw battle data", battleData);
		
		this.eships = this.normalizeArrayIndex(battleData.api_ship_ke);
		var isEnemyCombined = battleData.api_ship_ke_combined !== undefined;
		this.enemyCombined = isEnemyCombined;
		if(isEnemyCombined) {
			this.eshipsMain = this.eships;
			this.eshipsEscort = this.normalizeArrayIndex(battleData.api_ship_ke_combined);
			// still unknown: non-combined 7 enemy ships existed?
			this.eships = Array.pad(this.eshipsMain, 6, -1).concat(Array.pad(this.eshipsEscort, 6, -1));
		} else {
			// still pad its length to 6 for compatibility
			this.eships = Array.pad(this.eships, 6, -1);
		}
		this.elevels = this.normalizeArrayIndex(battleData.api_ship_lv);
		if(isEnemyCombined) {
			this.elevelsMain = this.elevels;
			this.elevelsEscort = this.normalizeArrayIndex(battleData.api_ship_lv_combined);
			this.elevels = Array.pad(this.elevelsMain, 6, -1).concat(Array.pad(this.elevelsEscort, 6, -1));
		} else {
			this.elevels = Array.pad(this.elevels, 6, -1);
		}
		this.eParam = battleData.api_eParam;
		if(isEnemyCombined) {
			this.eParamMain = this.eParam;
			this.eParamEscort = battleData.api_eParam_combined;
			this.eParam = Array.pad(this.eParamMain, 6, -1).concat(Array.pad(this.eParamEscort, 6, -1));
		} else {
			this.eParam = Array.pad(this.eParam, 6, -1);
		}
		this.eSlot = battleData.api_eSlot;
		if(isEnemyCombined) {
			this.eSlotMain = this.eSlot;
			this.eSlotEscort = battleData.api_eSlot_combined;
			this.eSlot = Array.pad(this.eSlotMain, 6, -1).concat(Array.pad(this.eSlotEscort, 6, -1));
		} else {
			this.eSlot = Array.pad(this.eSlot, 6, -1);
		}
		this.fformation = battleData.api_formation[0] || this.fformation;
		this.eformation = battleData.api_formation[1] || this.eformation;
		// api_eKyouka seems being removed since 2017-11-17, kept for compatibility
		this.eKyouka = battleData.api_eKyouka || [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
		// might use api_f_maxhps_combined instead
		var isPlayerCombined = battleData.api_fParam_combined !== undefined;
		this.playerCombined = isPlayerCombined;
		this.playerStriking = this.fleetSent === 3 && battleData.api_f_maxhps.length === 7;
		
		this.supportFlag = battleData.api_support_flag > 0;
		if(this.supportFlag) {
			this.supportInfo = battleData.api_support_info;
			this.supportInfo.api_support_flag = battleData.api_support_flag;
		}
		this.nightSupportFlag = battleData.api_n_support_flag > 0;
		if (this.nightSupportFlag) {
			this.nightSupportInfo = battleData.api_n_support_info;
			this.nightSupportInfo.api_n_support_flag = battleData.api_n_support_flag;
		}
		this.yasenFlag = battleData.api_midnight_flag > 0;
		this.isNightToDay = typeof battleData.api_day_flag !== 'undefined';
		if(this.isNightToDay) {
			this.toDawnFlag = battleData.api_day_flag > 0;
			[this.flarePos, this.eFlarePos] = battleData.api_flare_pos;
			this.flarePos = this.flarePos >= 0 ? 1 + (isPlayerCombined ? this.flarePos % 6 : this.flarePos) : -1;
			this.eFlarePos = this.eFlarePos >= 0 ? 1 + (isEnemyCombined ? this.eFlarePos % 6 : this.eFlarePos) : -1;
		}
		if(battleData.api_friendly_info !== undefined) {
			this.friendlySupportFlag = true;
		}
		
		// only used by old theme, replaced by beginHPs
		this.originalHPs = Array.pad(battleData.api_f_nowhps, 6, -1) || this.originalHPs;
		// max HP of enemy main fleet flagship (boss), keep this for later use
		// especially when enemy combined and active deck is not main fleet on night battle
		this.enemyFlagshipHp = this.enemyFlagshipHp || (battleData.api_nowhps ?
			battleData.api_nowhps[7] : battleData.api_e_nowhps[0]);
		
		this.maxHPs = {
			ally: battleData.api_f_maxhps,
			enemy: battleData.api_e_maxhps
		};
		// For old battle history
		if(battleData.api_maxhps) {
			this.maxHPs.ally = battleData.api_maxhps.slice(1, 7);
			this.maxHPs.enemy = battleData.api_maxhps.slice(7, 13);
			if(isPlayerCombined) {
				this.maxHPs.ally = this.maxHPs.ally.concat(battleData.api_maxhps_combined.slice(1, 7));
			}
			if(isEnemyCombined) {
				this.maxHPs.enemy = this.maxHPs.enemy.concat(battleData.api_maxhps_combined.slice(7, 13));
			}
		} else {
			if(isPlayerCombined) {
				this.maxHPs.allyMain = this.maxHPs.ally;
				this.maxHPs.allyEscort = battleData.api_f_maxhps_combined;
				this.maxHPs.ally = Array.pad(this.maxHPs.allyMain, 6, -1).concat(Array.pad(this.maxHPs.allyEscort, 6, -1));
			} else {
				this.maxHPs.ally = Array.pad(this.maxHPs.ally, 6, -1);
			}
			if(isEnemyCombined) {
				this.maxHPs.enemyMain = this.maxHPs.enemy;
				this.maxHPs.enemyEscort = battleData.api_e_maxhps_combined;
				this.maxHPs.enemy = Array.pad(this.maxHPs.enemyMain, 6, -1).concat(Array.pad(this.maxHPs.enemyEscort, 6, -1));
			} else {
				this.maxHPs.enemy = Array.pad(this.maxHPs.enemy, 6, -1);
			}
		}

		this.detection = KC3Meta.detection( battleData.api_search ? battleData.api_search[0] : 0 );
		this.engagement = KC3Meta.engagement( battleData.api_formation[2] );
		
		if((battleData.api_name || "").includes("ld_airbattle") || this.eventKind === 6) {
			this.isLongDistanceAirRaid = true;
		}
		/* Features of long range radar ambush battle implemented since Winter 2019:
		 *   no formation selection, 1 (single) or 14 (combined) by default;
		 *   shelling phase only, no friendly ship can attack, defend like air raid node;
		 *   no detection, no contact, no air battle (but LBAS comes), no night gear triggered;
		 *   night battle background, but API data structures follow day battle;
		 *   friendly contact icon of in-game right top is fixed to red radar wave sign;
		 */
		if((battleData.api_name || "").includes("ld_shooting") || battleData.api_search === undefined) {
			this.isLongRangeRaid = true;
			// use special detection values instead if api_search not existed
			this.detection = ["\u2212\u221a\u2212", KC3Meta.detection(3)[1], KC3Meta.term("BattleKindLongRangeRaid")];
		}
		
		// LBAS attack phase, including jet plane assault
		this.lbasFlag = battleData.api_air_base_attack !== undefined;
		if(this.lbasFlag) {
			// Array of engaged land bases
			this.airBaseAttack = battleData.api_air_base_attack;
			// No plane from, just injecting from far away air base :)
			this.airBaseJetInjection = battleData.api_air_base_injection;
			// Jet planes also consume steels each LBAS attack, the same with on carrier:
			// see Fleet.calcJetsSteelCost()
			if(!!this.airBaseJetInjection && !!this.airBaseJetInjection.api_stage1
				&& this.airBaseJetInjection.api_stage1.api_f_count > 0
				&& KC3SortieManager.isOnSortie()){
				let consumedSteel = 0;
				$.each(this.airBaseJetInjection.api_air_base_data, function(_, jet){
					consumedSteel += Math.round(
						jet.api_count
						* KC3Master.slotitem(jet.api_mst_id).api_cost
						* KC3GearManager.jetBomberSteelCostRatioPerSlot
					) || 0;
				});
				console.log("Jets LBAS consumed steel", consumedSteel);
				if(consumedSteel > 0){
					KC3Database.Naverall({
						hour: Date.toUTChours(),
						type: "lbas" + KC3SortieManager.map_world,
						data: [0,0,-consumedSteel,0].concat([0,0,0,0])
					});
				}
			}
		}
		
		// Air phases
		var planePhase = battleData.api_kouku && battleData.api_kouku.api_stage1 || {
				api_touch_plane:[-1,-1],
				api_f_count    :0,
				api_f_lostcount:0,
				api_e_count    :0,
				api_e_lostcount:0,
			},
			attackPhase = battleData.api_kouku ? battleData.api_kouku.api_stage2 : null;
		this.fcontactId = planePhase.api_touch_plane[0];
		this.fcontact = this.fcontactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		this.econtactId = planePhase.api_touch_plane[1];
		this.econtact = this.econtactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		
		this.airbattle = KC3Meta.airbattle( planePhase.api_disp_seiku );
		
		if(!!attackPhase && !!attackPhase.api_air_fire){
			this.antiAirFire = [ attackPhase.api_air_fire ];
		}
		
		// Fighter phase 1
		this.planeFighters = {
			player:[
				planePhase.api_f_count,
				planePhase.api_f_lostcount
			],
			abyssal:[
				planePhase.api_e_count,
				planePhase.api_e_lostcount
			]
		};
		
		if(
			this.planeFighters.player[0]===0
			&& this.planeFighters.abyssal[0]===0
			&& attackPhase===null
		){
			this.airbattle = KC3Meta.airbattle(5);
		}
		
		// Bombing phase 1
		this.planeBombers = { player:[0,0], abyssal:[0,0] };
		if(attackPhase){
			this.planeBombers.player[0] = attackPhase.api_f_count;
			this.planeBombers.player[1] = attackPhase.api_f_lostcount;
			this.planeBombers.abyssal[0] = attackPhase.api_e_count;
			this.planeBombers.abyssal[1] = attackPhase.api_e_lostcount;
		}
		this.takenAirBombingDamages = [];
		this.beenAirBombingTargeted = [];
		const bombingPhaseMain = (battleData.api_kouku || {}).api_stage3 || {},
			bombingPhaseEscort = (battleData.api_kouku || {}).api_stage3_combined || {},
			bombingDamages = [],
			bombingTargetedFlags = [],
			damageToInteger = v => Math.floor(v),
			mergeToBoolean = (arr, v, i) => !!v || !!arr[i];
		// Although game codes use api_plane_from[1] only as prerequisite
		if(this.planeBombers.abyssal[0] > 0){
			bombingDamages.push((bombingPhaseMain.api_fdam || []).map(damageToInteger));
			bombingDamages.push((bombingPhaseEscort.api_fdam || []).map(damageToInteger));
			bombingTargetedFlags.push((bombingPhaseMain.api_fbak_flag || []).map(mergeToBoolean.bind(null, bombingPhaseMain.api_frai_flag || [])));
			bombingTargetedFlags.push((bombingPhaseEscort.api_fbak_flag || []).map(mergeToBoolean.bind(null, bombingPhaseEscort.api_frai_flag || [])));
		}
		this.takenAirBombingDamages.push(bombingDamages);
		this.beenAirBombingTargeted.push(bombingTargetedFlags);
		
		// Fighter phase 2
		if(battleData.api_kouku2){
			this.planeFighters.player[1] += battleData.api_kouku2.api_stage1.api_f_lostcount;
			this.planeFighters.abyssal[1] += battleData.api_kouku2.api_stage1.api_e_lostcount;
			
			// Bombing phase 2
			if(battleData.api_kouku2.api_stage2){
				this.planeBombers.player[1] += battleData.api_kouku2.api_stage2.api_f_lostcount;
				this.planeBombers.abyssal[1] += battleData.api_kouku2.api_stage2.api_e_lostcount;
				if(!!battleData.api_kouku2.api_stage2.api_air_fire){
					if(!this.antiAirFire || this.antiAirFire.length < 1){
						this.antiAirFire = [null];
					}
					this.antiAirFire[1] = battleData.api_kouku2.api_stage2.api_air_fire;
				}
			}
			const bombingDamages2 = [], bombingTargetedFlags2 = [];
			if(battleData.api_kouku2.api_stage2 && battleData.api_kouku2.api_stage2.api_e_count > 0){
				bombingDamages2.push(
					((battleData.api_kouku2.api_stage3 || {}).api_fdam || []).map(damageToInteger)
				);
				bombingDamages2.push(
					((battleData.api_kouku2.api_stage3_combined || {}).api_fdam || []).map(damageToInteger)
				);
				bombingTargetedFlags.push(
					((battleData.api_kouku2.api_stage3 || {}).api_fbak_flag || []).map(mergeToBoolean.bind(null, (battleData.api_kouku2.api_stage3 || {}).api_frai_flag || []))
				);
				bombingTargetedFlags.push(
					((battleData.api_kouku2.api_stage3_combined || {}).api_fbak_flag || []).map(mergeToBoolean.bind(null, (battleData.api_kouku2.api_stage3_combined || {}).api_frai_flag || []))
				);
			}
			this.takenAirBombingDamages.push(bombingDamages2);
			this.beenAirBombingTargeted.push(bombingTargetedFlags2);
		}
		
		// Jet plane phase, happen before fighter attack phase
		if(typeof battleData.api_injection_kouku !== "undefined"){
			var jetPlanePhase = battleData.api_injection_kouku;
			this.planeJetFighters = { player:[0,0], abyssal:[0,0] };
			this.planeJetBombers = { player:[0,0], abyssal:[0,0] };
			this.planeJetFighters.player[0] = jetPlanePhase.api_stage1.api_f_count;
			this.planeJetFighters.player[1] = jetPlanePhase.api_stage1.api_f_lostcount;
			this.planeJetFighters.abyssal[0] = jetPlanePhase.api_stage1.api_e_count;
			this.planeJetFighters.abyssal[1] = jetPlanePhase.api_stage1.api_e_lostcount;
			if(!!jetPlanePhase.api_stage2){
				this.planeJetBombers.player[0] = jetPlanePhase.api_stage2.api_f_count;
				this.planeJetBombers.player[1] = jetPlanePhase.api_stage2.api_f_lostcount;
				this.planeJetBombers.abyssal[0] = jetPlanePhase.api_stage2.api_e_count;
				this.planeJetBombers.abyssal[1] = jetPlanePhase.api_stage2.api_e_lostcount;
			}
			// Jet planes consume steels each battle based on:
			// pendingConsumingSteel = round(jetMaster.api_cost * ship.slots[jetIdx] * 0.2)
			if(this.planeJetFighters.player[0] > 0
				&& (KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP())){
				let consumedSteel = PlayerManager.fleets[this.fleetSent - 1]
					.calcJetsSteelCost(KC3SortieManager.sortieName(2));
				console.log("Jets consumed steel", consumedSteel);
			}
		}
		// Aerial support type fleet triggered, check if Jet planes consume steels,
		// no check for anti-sub support for now, since there is no asw on current implemented Jet plane
		if(battleData.api_support_flag == 1 && KC3SortieManager.isOnSortie() &&
			!!battleData.api_support_info && !!battleData.api_support_info.api_support_airatack){
			const fleetId = battleData.api_support_info.api_support_airatack.api_deck_id - 1;
			let consumedSteel = PlayerManager.fleets[fleetId]
				.calcJetsSteelCost(KC3SortieManager.sortieName(2));
			if(consumedSteel > 0){
				console.log("Jets on support fleet consumed steel", consumedSteel);
			}
		}
		
		// Boss Debuffed, see `BattleCommonModel.prototype.isBossDamaged`
		this.debuffed = 1 == (battleData.api_boss_damaged || battleData.api_xal01);
		
		// Battle analysis only if on sortie or PvP, not applied to battle simulation, like sortielogs.
		const isRealBattle = KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP();
		if((isRealBattle || KC3Node.debugPrediction() || ConfigManager.sr_show_new_shipstate)
			&& !this.isOldBattleData(battleData)){
			const fleetId = this.fleetSent - 1;
			// To work better on battle simulation, prefer to use `isPlayerCombined`,
			// which check via API data instead of determining 'current state' of PlayerManager
			//const isPlayerCombinedSent = fleetId === 0 && (this.playerCombinedType || PlayerManager.combinedFleet) > 0;

			// Find battle type
			const player = (() => {
				if (!isPlayerCombined) { return KC3BattlePrediction.Player.SINGLE; }
				const combinedFleetType = this.playerCombinedType || PlayerManager.combinedFleet;
				switch (combinedFleetType) {
					case 0: case undefined:
						return KC3BattlePrediction.Player.SINGLE;
					case 1:
						return KC3BattlePrediction.Player.CTF;
					case 2:
						return KC3BattlePrediction.Player.STF;
					case 3:
						return KC3BattlePrediction.Player.TCF;
					default:
						throw new Error(`Unknown combined fleet code: ${combinedFleetType}`);
				}
			})();
			const enemy = isEnemyCombined ? KC3BattlePrediction.Enemy.COMBINED : KC3BattlePrediction.Enemy.SINGLE;
			const time = this.isNightToDay
				? KC3BattlePrediction.Time.NIGHT_TO_DAY
				: KC3BattlePrediction.Time.DAY;

			const dameConCode = (() => {
				if (KC3SortieManager.isPvP()) { return {}; }
				if (Array.isArray(this.fleetStates) && this.fleetStates.length > (isPlayerCombined & 1)) {
					return {
						main: this.fleetStates[0].equip.map(equip => KC3Ship.findDamecon(equip)),
						escort: isPlayerCombined && this.fleetStates[1].equip.map(equip => KC3Ship.findDamecon(equip)),
					};
				} else if (!isRealBattle) {
					return {};
				}
				return {
					main: PlayerManager.fleets[fleetId].getDameConCodes(),
					escort: isPlayerCombined && PlayerManager.fleets[1].getDameConCodes(),
				};
			})();

			const result = KC3BattlePrediction.analyzeBattle(battleData, dameConCode, { player, enemy, time });
			this.predictedFleetsDay = result.fleets;
			if (KC3Node.debugPrediction()) {
				console.debug(`Node ${this.letter} predicted for ${player} vs ${enemy}`, result);
			}

			if (ConfigManager.info_btrank) {
				[this.predictedRank, this.predictedDamageGauge] = KC3BattlePrediction.predictRankAndDamageGauge(
					battleData.api_name, this.battleNight || battleData, this.predictedFleetsDay
				);
				if (KC3Node.debugPrediction()) {
					console.debug(`Node ${this.letter} predicted rank`, this.predictedRank, this.predictedDamageGauge, this.sortie);
				}
				
				const mvpResult = KC3BattlePrediction.predictMvp(this.predictedFleetsDay, this.predictedFleetsNight);
				this.predictedMvps = [mvpResult.playerMain];
				if (mvpResult.playerEscort !== undefined) {
					this.predictedMvps.push(mvpResult.playerEscort);
				}
				if (KC3Node.debugPrediction()) {
					console.debug(`Node ${this.letter} predicted mvp`, this.predictedMvps, this.sortie);
				}
				this.predictedMvpCapable = this.isMvpPredictionCapable();
			}

			// Update fleets with battle result
			this.allyNoDamage = this.allyNoDamage && result.isPlayerNoDamage;
			if (isRealBattle) {
				result.fleets.playerMain.forEach(({ hp, dameConConsumed }, position) => {
					const ship = PlayerManager.fleets[fleetId].ship(position);
					if(!ship.isAbsent()) {
						// For anyside CF battle, cond values decreased on battle result like KCVita?
						if(!isPlayerCombined && !isEnemyCombined) {
							ship.morale = Math.max(0, Math.min(100, ship.morale + (ship.morale < 30 ? -9 : -3)));
						}
						ship.afterHp[0] = hp;
						ship.afterHp[1] = ship.hp[1];
						this.dameConConsumed[position] = dameConConsumed ? ship.findDameCon() : false;
						if(Array.isArray(this.predictedMvps) && this.predictedMvps[0] > 0) {
							// string indicates prediction value
							ship.mvp = this.predictedMvps[0] === position + 1 ?
								(this.predictedMvpCapable ? "chosen" : "candidate") : false;
						}
					}
				});
				result.fleets.playerEscort.forEach(({ hp, dameConConsumed }, position) => {
					const ship = PlayerManager.fleets[1].ship(position);
					if(!ship.isAbsent()) {
						if(!isPlayerCombined && !isEnemyCombined) {
							ship.morale = Math.max(0, Math.min(100, ship.morale + (ship.morale < 30 ? -9 : -3)));
						}
						ship.afterHp[0] = hp;
						ship.afterHp[1] = ship.hp[1];
						this.dameConConsumedEscort[position] = dameConConsumed ? ship.findDameCon() : false;
						if(Array.isArray(this.predictedMvps) && this.predictedMvps[1] > 0) {
							ship.mvp = this.predictedMvps[1] === position + 1 ?
								(this.predictedMvpCapable ? "chosen" : "candidate") : false;
						}
					}
				});
			}
			result.fleets.enemyMain.forEach((ship, position) => {
				this.enemyHP[position] = ship;
				this.enemySunk[position] = ship.sunk;
			});
			result.fleets.enemyEscort.forEach((ship, index) => {
				const position = index + 6;

				this.enemyHP[position] = ship;
				this.enemySunk[position] = ship.sunk;
			});

			this.unexpectedList = this.unexpectedList || [];
			this.unexpectedList.push(...this.unexpectedDamagePrediction(result.fleets.playerMain,
				this.fleetSent -1, battleData.api_formation[0], battleData.api_formation[2], isRealBattle));
			this.unexpectedList.push(...this.unexpectedDamagePrediction(result.fleets.playerEscort,
				1, battleData.api_formation[0], battleData.api_formation[2], isRealBattle)
			);

			this.checkSortieSpecialAttacks(result.fleets);
		}

		if(this.gaugeDamage > -1) {
			this.gaugeDamage = Math.min(this.enemyFlagshipHp, this.enemyFlagshipHp - this.enemyHP[0].hp);
			this.mainFlagshipKilled = this.enemyHP[0].hp <= 0;
			
			(function(sortieData){
				if(this.isValidBoss()) {
					// Invoke on boss event callback
					if(sortieData.isOnSortie() && sortieData.onBossAvailable) {
						sortieData.onBossAvailable(this);
					}
					// Save boss HP for future sortie
					const thisMap = sortieData.getCurrentMapData();
					if(thisMap.kind === "gauge-hp") {
						thisMap.baseHp = thisMap.baseHp || this.enemyFlagshipHp;
						if(thisMap.baseHp != this.enemyFlagshipHp) {
							console.info("Different boss HP detected:", thisMap.baseHp + " -> " + this.enemyFlagshipHp);/*RemoveLogging:skip*/
							// If new HP lesser than old, should update it for Last Kill
							if(this.enemyFlagshipHp < thisMap.baseHp) {
								thisMap.baseHp = this.enemyFlagshipHp;
							}
						}
						sortieData.setCurrentMapData(thisMap);
					}
				}
			}).call(this, KC3SortieManager);
		}
		
		// Record encounters only if on sortie
		if(KC3SortieManager.isOnSortie()) {
			this.saveEnemyEncounterInfo(this.battleDay);
		}
		
		// Don't log at Strategy Room Maps/Events History
		if(isRealBattle) {
			console.log("Parsed battle node", this);
		}
	};
	
	KC3Node.prototype.engageNight = function( nightData, fleetSent, setAsOriginalHP = true ){
		this.battleNight = nightData;
		this.fleetSent = fleetSent || this.fleetSent || nightData.api_deck_id || KC3SortieManager.fleetSent;
		this.startsFromNight = !!fleetSent;
		//console.debug("Raw night battle data", nightData);
		
		this.eships = this.normalizeArrayIndex(nightData.api_ship_ke);
		var isEnemyCombined = nightData.api_ship_ke_combined !== undefined;
		this.enemyCombined = isEnemyCombined;
		if(isEnemyCombined){
			this.eshipsMain = this.eships;
			this.eshipsEscort = this.normalizeArrayIndex(nightData.api_ship_ke_combined);
			this.eships = Array.pad(this.eshipsMain, 6, -1).concat(Array.pad(this.eshipsEscort, 6, -1));
			// activated one fleet for combined night battle: 1 = main, 2 = escort
			this.activatedFriendFleet = nightData.api_active_deck[0];
			this.activatedEnemyFleet = nightData.api_active_deck[1];
		} else {
			this.eships = Array.pad(this.eships, 6, -1);
		}
		this.elevels = this.normalizeArrayIndex(nightData.api_ship_lv);
		if(isEnemyCombined) {
			this.elevelsMain = this.elevels;
			this.elevelsEscort = this.normalizeArrayIndex(nightData.api_ship_lv_combined);
			this.elevels = Array.pad(this.elevelsMain, 6, -1).concat(Array.pad(this.elevelsEscort, 6, -1));
		} else {
			this.elevels = Array.pad(this.elevels, 6, -1);
		}
		this.eParam = nightData.api_eParam;
		if(isEnemyCombined) {
			this.eParamMain = this.eParam;
			this.eParamEscort = nightData.api_eParam_combined;
			this.eParam = Array.pad(this.eParamMain, 6, -1).concat(Array.pad(this.eParamEscort, 6, -1));
		} else {
			this.eParam = Array.pad(this.eParam, 6, -1);
		}
		this.eSlot = nightData.api_eSlot;
		if(isEnemyCombined) {
			this.eSlotMain = this.eSlot;
			this.eSlotEscort = nightData.api_eSlot_combined;
			this.eSlot = Array.pad(this.eSlotMain, 6, -1).concat(Array.pad(this.eSlotEscort, 6, -1));
		} else {
			this.eSlot = Array.pad(this.eSlot, 6, -1);
		}
		
		var isPlayerCombined = nightData.api_fParam_combined !== undefined;
		this.playerCombined = isPlayerCombined;
		this.playerStriking = this.fleetSent === 3 && nightData.api_f_maxhps.length === 7;
		
		this.fformation = (nightData.api_formation || [])[0] || this.fformation;
		this.eformation = (nightData.api_formation || [])[1] || this.eformation;
		this.eKyouka = nightData.api_eKyouka || [-1,-1,-1,-1,-1,-1];

		if (this.startsFromNight) {
			this.lbasFlag = false;
		}

		if (nightData.api_n_support_flag > 0) {
			this.nightSupportFlag = true;
			this.nightSupportInfo = nightData.api_n_support_info;
			this.nightSupportInfo.api_n_support_flag = nightData.api_n_support_flag;
		}

		if (nightData.api_friendly_info !== undefined) {
			this.friendlySupportFlag = true;
		}

		this.maxHPs = {
			ally: nightData.api_f_maxhps,
			enemy: nightData.api_e_maxhps
		};
		// For old battle history
		if(nightData.api_maxhps) {
			this.maxHPs.ally = nightData.api_maxhps.slice(1, 7);
			this.maxHPs.enemy = nightData.api_maxhps.slice(7, 13);
			if(isPlayerCombined) {
				this.maxHPs.ally = this.maxHPs.ally.concat(nightData.api_maxhps_combined.slice(1, 7));
			}
			if(isEnemyCombined) {
				this.maxHPs.enemy = this.maxHPs.enemy.concat(nightData.api_maxhps_combined.slice(7, 13));
			}
		} else {
			if(isPlayerCombined) {
				this.maxHPs.allyMain = this.maxHPs.ally;
				this.maxHPs.allyEscort = nightData.api_f_maxhps_combined;
				this.maxHPs.ally = Array.pad(this.maxHPs.allyMain, 6, -1).concat(Array.pad(this.maxHPs.allyEscort, 6, -1));
			} else {
				this.maxHPs.ally = Array.pad(this.maxHPs.ally, 6, -1);
			}
			if(isEnemyCombined) {
				this.maxHPs.enemyMain = this.maxHPs.enemy;
				this.maxHPs.enemyEscort = nightData.api_e_maxhps_combined;
				this.maxHPs.enemy = Array.pad(this.maxHPs.enemyMain, 6, -1).concat(Array.pad(this.maxHPs.enemyEscort, 6, -1));
			} else {
				this.maxHPs.enemy = Array.pad(this.maxHPs.enemy, 6, -1);
			}
		}
		
		const isAgainstEnemyEscort = isEnemyCombined && this.activatedEnemyFleet !== 1;
		if(isAgainstEnemyEscort) {
			this.eships = Array.pad(this.eshipsEscort, 6, -1);
			this.elevels = Array.pad(this.elevelsEscort, 6, -1);
			this.eParam = Array.pad(this.eParamEscort, 6, -1);
			this.eSlot = Array.pad(this.eSlotEscort, 6, -1);
			this.maxHPs.enemy = Array.pad(this.maxHPs.enemyEscort, 6, -1);
		}
		
		if(setAsOriginalHP){
			// only reserved for old theme using
			this.originalHPs = Array.pad(nightData.api_f_nowhps, 6, -1) || this.originalHPs;
		}
		this.enemyFlagshipHp = this.enemyFlagshipHp || (nightData.api_nowhps ?
			nightData.api_nowhps[7] : nightData.api_e_nowhps[0]);
		
		this.engagement = this.engagement || KC3Meta.engagement( nightData.api_formation[2] );
		this.fcontactId = nightData.api_touch_plane[0]; // masterId of slotitem, starts from 1
		this.fcontact = this.fcontactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		this.econtactId = nightData.api_touch_plane[1];
		this.econtact = this.econtactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		// FIXME to handle history data before event Winter 2018, have to determine its date time?
		//this.flarePos = nightData.api_flare_pos[0]; // Star shell user pos 1-6
		// Star shell user ship index, pos from 0 ~ 6 or 0 ~ 11 (if combined?)
		[this.flarePos, this.eFlarePos] = nightData.api_flare_pos;
		// Shift it back to 1-based index to be compatible with old codes
		this.flarePos = this.flarePos >= 0 ? 1 + (isPlayerCombined ? this.flarePos % 6 : this.flarePos) : -1;
		// PvP opponent only, abyssal star shell not existed yet
		this.eFlarePos = this.eFlarePos >= 0 ? 1 + (isEnemyCombined ? this.eFlarePos % 6 : this.eFlarePos) : -1;
		
		// Battle analysis only if on sortie or PvP, not applied to sortielogs
		const isRealBattle = KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP();
		if((isRealBattle || KC3Node.debugPrediction() || ConfigManager.sr_show_new_shipstate)
			&& !this.isOldBattleData(nightData)){
			const fleetId = this.fleetSent - 1;

			// Find battle type
			const player = (() => {
				if (!isPlayerCombined) { return KC3BattlePrediction.Player.SINGLE; }
				const combinedFleetType = this.playerCombinedType || PlayerManager.combinedFleet;
				switch (combinedFleetType) {
					case 0: case undefined:
						return KC3BattlePrediction.Player.SINGLE;
					case 1:
						return KC3BattlePrediction.Player.CTF;
					case 2:
						return KC3BattlePrediction.Player.STF;
					case 3:
						return KC3BattlePrediction.Player.TCF;
					default:
						throw new Error(`Unknown combined fleet code: ${combinedFleetType}`);
				}
			})();
			const enemy = isEnemyCombined ? KC3BattlePrediction.Enemy.COMBINED : KC3BattlePrediction.Enemy.SINGLE;
			const time = KC3BattlePrediction.Time.NIGHT;
			const dameConCode = (() => {
				if (KC3SortieManager.isPvP()) { return {}; }
				if (Array.isArray(this.fleetStates) && this.fleetStates.length > (isPlayerCombined & 1)) {
					return {
						main: this.fleetStates[0].equip.map(equip => KC3Ship.findDamecon(equip)),
						escort: isPlayerCombined && this.fleetStates[1].equip.map(equip => KC3Ship.findDamecon(equip)),
					};
				} else if (!isRealBattle) {
					return {};
				}
				return {
					main: PlayerManager.fleets[fleetId].getDameConCodes(),
					escort: isPlayerCombined && PlayerManager.fleets[1].getDameConCodes(),
				};
			})();
			const result = KC3BattlePrediction.analyzeBattle(nightData, dameConCode, { player, enemy, time });
			this.predictedFleetsNight = result.fleets;
			if (KC3Node.debugPrediction()) {
				console.debug(`Node ${this.letter} predicted yasen ${player} vs ${enemy}`, result);
			}

			if (ConfigManager.info_btrank) {
				[this.predictedRankNight, this.predictedDamageGaugeNight] = KC3BattlePrediction.predictRankAndDamageGauge(
					nightData.api_name, this.battleDay || nightData, this.predictedFleetsNight
				);
				if (KC3Node.debugPrediction()) {
					console.debug(`Node ${this.letter} predicted yasen rank`, this.predictedRankNight, this.predictedDamageGaugeNight);
				}
				
				const mvpResult = KC3BattlePrediction.predictMvp(this.predictedFleetsDay, this.predictedFleetsNight);
				this.predictedMvpsNight = [mvpResult.playerMain];
				if (mvpResult.playerEscort !== undefined) {
					this.predictedMvpsNight.push(mvpResult.playerEscort);
				}
				if (KC3Node.debugPrediction()) {
					console.debug(`Node ${this.letter} predicted yasen mvp`, this.predictedMvpsNight, this.sortie);
				}
				this.predictedMvpCapable = this.isMvpPredictionCapable();
			}

			// Update fleets
			this.allyNoDamage = this.allyNoDamage && result.isPlayerNoDamage;
			if (isRealBattle) {
				const playerFleet = PlayerManager.fleets[isPlayerCombined ? 1 : fleetId];
				const playerResult = isPlayerCombined ? result.fleets.playerEscort : result.fleets.playerMain;
				playerResult.forEach(({ hp, dameConConsumed }, position) => {
					const ship = playerFleet.ship(position);
					if(!ship.isAbsent()) {
						ship.hp = [ship.afterHp[0], ship.afterHp[1]];
						if(!isPlayerCombined && !isEnemyCombined) {
							ship.morale = Math.max(0, Math.min(100, ship.morale + (this.startsFromNight ? -2 : -2)));
						}
						ship.afterHp[0] = hp;
						ship.afterHp[1] = ship.hp[1];
						if(isPlayerCombined) {
							this.dameConConsumedEscort[position] = dameConConsumed ? ship.findDameCon() : false;
						} else {
							this.dameConConsumed[position] = dameConConsumed ? ship.findDameCon() : false;
						}
						if(Array.isArray(this.predictedMvpsNight) &&
							this.predictedMvpsNight[isPlayerCombined ? 1 : 0] > 0) {
							ship.mvp = this.predictedMvpsNight[isPlayerCombined ? 1 : 0] === position + 1 ? 
								(this.predictedMvpCapable ? "chosen" : "candidate") : false;
						}
					}
				});
			}

			const enemyResult = isAgainstEnemyEscort ? result.fleets.enemyEscort : result.fleets.enemyMain;
			enemyResult.forEach((ship, position) => {
				this.enemyHP[position] = ship;
				this.enemySunk[position] = ship.sunk;
			});

			this.unexpectedList = this.unexpectedList || [];
			this.unexpectedList.push(...this.unexpectedDamagePrediction(result.fleets.playerMain,
				this.fleetSent -1, nightData.api_formation[0], nightData.api_formation[2], isRealBattle));
			this.unexpectedList.push(...this.unexpectedDamagePrediction(result.fleets.playerEscort,
				1, nightData.api_formation[0], nightData.api_formation[2], isRealBattle)
			);

			this.checkSortieSpecialAttacks(result.fleets, true, isPlayerCombined);
		}
		
		if(this.gaugeDamage > -1
			&& (!isEnemyCombined || this.activatedEnemyFleet == 1) ) {
			let bossCurrentHp = nightData.api_e_nowhps[0];
			// boss now hp will be the one after friendly fleet battle,
			// so have to find the damage made by friend fleet back.
			if(bossCurrentHp + this.gaugeDamage < nightData.api_e_maxhps[0])
				bossCurrentHp = nightData.api_e_maxhps[0] - this.gaugeDamage;
			this.gaugeDamage += Math.min(bossCurrentHp, bossCurrentHp - this.enemyHP[0].hp);
			this.mainFlagshipKilled = this.enemyHP[0].hp <= 0;
		}
		
		// Record encounters only if on sortie and starts from night
		if(this.startsFromNight && KC3SortieManager.isOnSortie()) {
			this.saveEnemyEncounterInfo(this.battleNight);
		}
		// Don't log at Strategy Room Maps/Events History
		if(isRealBattle) {
			console.log("Parsed night battle node", this);
		}
	};
	
	KC3Node.prototype.night = function( nightData ){
		// Pass falsy as `fleetSent` to define as regular night battle following day
		this.engageNight(nightData, null, false);
	};
	
	KC3Node.prototype.results = function( resultData ){
		//console.debug("Raw battle result data", resultData);
		try {
			this.rating = resultData.api_win_rank;
			this.nodalXP = resultData.api_get_base_exp;
			console.log("Battle rank " + this.rating, "with ally fleet no damage", !!this.allyNoDamage);
			if(this.allyNoDamage && this.rating === "S")
				this.rating = "SS";
			
			// for multi-gauges event map, check if this node is the right boss for current stage
			if(this.isValidBoss()) {
				// assumed maps[ckey] already initialized at /mapinfo or /start
				var maps = KC3SortieManager.getAllMapData(),
					ckey = 'm' + KC3SortieManager.getSortieMap().join(''),
					stat = maps[ckey].stat,
					srid = KC3SortieManager.getSortieId();
				/* DESPAIR STATISTICS ==> */
				if(stat) {
					var fs = [this.gaugeDamage, this.enemyFlagshipHp],
						pt = 'dummy',
						sb = stat.onBoss,
						oc = 0;
					fs.push(fs[0] / fs[1]);
					fs.push(fs[1] - fs[0]);
					switch(true){
						case (fs[0] ===   0): pt = 'fresh'; break;
						case (fs[2] <  0.25): pt = 'graze'; break;
						case (fs[2] <  0.50): pt = 'light'; break;
						case (fs[2] <  0.75): pt = 'modrt'; break;
						case (fs[3] >     9): pt = 'heavy'; break;
						case (fs[3] >     1): pt = 'despe'; break;
						case (fs[3] ==    1): pt = 'endur'; break;
						case (fs[3] <     1): pt = 'destr'; break;
					}
					sb[pt].push(srid);
					oc = sb[pt].length;
					console.info("Current sortie recorded as", pt);
					console.info("You've done this", oc, "time"+(oc > 1 ? 's' : '')+'.',
						"Good luck, see you next time!");
				}
				/* ==> DESPAIR STATISTICS */
				
				/* FLAGSHIP ATTACKING ==> */
				console.log("Damaged Flagship", this.gaugeDamage, "/", maps[ckey].curhp || 0, "pts");
				// also check if destroyed flagship is from main fleet (the boss)
				const mainFlagshipDestFlag = (!this.activatedEnemyFleet || this.activatedEnemyFleet == 1) ?
					resultData.api_destsf : 0;
				this.mainFlagshipKilled = !!mainFlagshipDestFlag;
				switch(maps[ckey].kind) {
					case 'single':   /* Single Victory */
						break;
					case 'multiple': /* Kill-based */
						const totalKills = maps[ckey].killsRequired || KC3Meta.gauge(ckey.replace("m",""));
						if(totalKills - (maps[ckey].kills || 0) > 0)
							maps[ckey].kills += mainFlagshipDestFlag;
						break;
					case 'gauge-hp': /* HP-Gauge */
						if(this.gaugeDamage >= 0 && (maps[ckey].curhp || 0) > 0) {
							maps[ckey].curhp -= this.gaugeDamage;
							// if last kill, check whether flagship is killed or not
							// flagship killed = gauge clear, not map clear if there are multi-gauges
							if(maps[ckey].curhp <= 0)
								maps[ckey].curhp = 1 - (mainFlagshipDestFlag & 1);
						}
						break;
					case 'gauge-tp': /* TP-Gauge */
						if(typeof resultData.api_landing_hp !== "undefined") {
							var TPdata = resultData.api_landing_hp;
							this.gaugeDamage = Math.min(TPdata.api_now_hp, TPdata.api_sub_value);
							maps[ckey].curhp = TPdata.api_now_hp - this.gaugeDamage;
							maps[ckey].maxhp = TPdata.api_max_hp - 0;
						} else {
							maps[ckey].curhp = 0;
						}
						// clean remembered boss hp if there is one
						delete maps[ckey].baseHp;
						console.log("Landing get",this.gaugeDamage,"->",maps[ckey].curhp,"/",maps[ckey].maxhp,"TP");
						break;
					default:         /* Undefined */
						break;
				}
				// obtaining clear once
				maps[ckey].clear |= resultData.api_first_clear;
				
				// add a flag to this sortie record
				if(resultData.api_first_clear && KC3SortieManager.isOnSavedSortie()) {
					KC3Database.con.sortie.get(KC3SortieManager.getSortieId(), (sortie) => {
						const eventmap = (sortie || {}).eventmap;
						if(eventmap) {
							eventmap.api_first_clear = resultData.api_first_clear;
							KC3Database.con.sortie.put(sortie).then(() => {
								console.info("Congratulations! This is your first time clear this map", eventmap);
							});
						}
					});
				}
				
				if(stat) {
					stat.onBoss.hpdat[srid] = [maps[ckey].curhp,maps[ckey].maxhp];
					if(resultData.api_first_clear)
						stat.onClear = srid; // retrieve sortie ID for first clear mark
				}
				
				KC3SortieManager.setAllMapData(maps);
			}
			
			var ship_get = [];
			
			if(typeof resultData.api_get_ship !== "undefined"){
				this.drop = resultData.api_get_ship.api_ship_id;
				KC3ShipManager.pendingShipNum += 1;
				KC3GearManager.pendingGearNum += KC3Meta.defaultEquip(this.drop);
				console.log("Drop", resultData.api_get_ship.api_ship_name,
					"(" + this.drop + ") Equip", KC3Meta.defaultEquip(this.drop)
				);
				ship_get.push(this.drop);
			}else{
				this.drop = 0;
			}
			
			if(typeof resultData.api_get_useitem !== "undefined"){
				this.dropUseitem = resultData.api_get_useitem.api_useitem_id || 0;
			}else{
				this.dropUseitem = 0;
			}
			
			if(typeof resultData.api_get_slotitem !== "undefined"){
				this.dropSlotitem = resultData.api_get_slotitem.api_slotitem_id || 0;
			}else{
				this.dropSlotitem = 0;
			}
			
			if(typeof resultData.api_get_eventitem !== "undefined"){
				(function(resultEventItems){
					console.log("Event items get", resultEventItems);
					(resultEventItems || []).forEach(function(eventItem){
						switch(eventItem.api_type){
							case 1: // Materials/Resources
								if(eventItem.api_id.inside(1, 4)) {
									KC3SortieManager.materialGain[eventItem.api_id + 3] += eventItem.api_value;
								}
								if(eventItem.api_id.inside(31, 34)) {
									KC3SortieManager.materialGain[eventItem.api_id - 31] += eventItem.api_value;
								}
							break;
							case 2: // Ship
								ship_get.push(eventItem.api_id);
							break;
							case 3: // Equip
							break;
							case 5: // Furniture
							break;
							default:
								console.info("Unknown item type", eventItem);/*RemoveLogging:skip*/
							break;
						}
					});
				}).call(this, resultData.api_get_eventitem);
			}
			if(typeof resultData.api_select_reward_dict !== "undefined"){
				console.log("Event items selectable", resultData.api_select_reward_dict);
			}
			
			ConfigManager.load();
			ship_get.forEach(function(newShipId){
				var wish_kind = ["salt","wish"];
				
				wish_kind.some(function(wishType){
					var
						wish_key = [wishType,'list'].join('_'),
						wish_id = ConfigManager[wish_key].indexOf(newShipId)+1;
					if(wish_id){
						ConfigManager[wish_key].splice(wish_id-1,1);
						console.info("Removed", KC3Meta.shipName(KC3Master.ship(newShipId).api_name),
							"from", wishType, "list");
						
						ConfigManager.lock_prep.push(newShipId);
						return true;
					} else {
						return false;
					}
				});
			});
			ConfigManager.save();
			
			this.mvps = [resultData.api_mvp || 0,resultData.api_mvp_combined || 0].filter(function(x){return !!x;});
			var
				lostCheck = (resultData.api_lost_flag) ?
					[resultData.api_lost_flag,null] : /* if api_lost_flag is explicitly specified */
					[resultData.api_get_ship_exp,resultData.api_get_ship_exp_combined].map(function(expData,fleetId){
						return expData ? expData.slice(1) : []; // filter out first dummy element, be aware for undefined item
					}).map(function(expData,fleetId){
						/* Example data:
							"api_get_ship_exp":[-1,420,140,140,140,-1,-1],
							"api_get_exp_lvup":[[177,300,600],[236,300,600],[118,300],[118,300]],
							
							"api_get_ship_exp_combined":[-1,420,140,140,-1,-1,-1],
							"api_get_exp_lvup_combined":[[177,300,600],[236,300,600],[118,300],[118,300]]
							
							Logic :
							- for ship_exp indices, start from 1.
							- compare ship_exp data, check it if -1
							- (fail condition) ignore, set as non-sink and skip to next one
							- compare the current index with the neighboring array (exp_lvup),
								check if an array exists on that index
							- if it exists, mark as sunk
							
							Source: https://gitter.im/KC3Kai/Public?at=5662e448c15bca7e3c96376f
						*/
						return expData.map(function(data,slotId){
							return (data == -1) && !!resultData[['api_get','exp_lvup','combined'].slice(0,fleetId+2).join('_')][slotId];
						});
					}),
				fleetDesg = [this.fleetSent - 1, 1]; // designated fleet (fleet mapping)
			this.lostShips = lostCheck.map(function(lostFlags, fleetNum){
				console.log("Lost flags", fleetNum, lostFlags);
				return (lostFlags || []).filter(function(x){return x>=0;}).map(function(checkSunk,rosterPos){
					if(!!checkSunk) {
						var rtv = PlayerManager.fleets[fleetDesg[fleetNum]].ships[rosterPos];
						if(KC3ShipManager.get(rtv).didFlee) return 0;
						var name = KC3ShipManager.get(rtv).master().api_name;
						console.info("このクソ提督、深海に" + name + "を沈みさせやがったな", rtv);/*RemoveLogging:skip*/
						return rtv;
					} else {
						return 0;
					}
				}).filter(function(shipId){return shipId;});
			});
			
			// If damecon used in a battle, will record changed equipment for this and later nodes
			const isAnyDameconConsumed = (this.dameConConsumed || []).some(v => !!v) ||
				(this.dameConConsumedEscort || []).some(v => !!v);
			KC3SortieManager.setSlotitemConsumed(isAnyDameconConsumed);
			
			// Consumed 'Submarine Supply Materials' if Sub Fleet Special Cutin triggered
			if(Array.isArray(this.sortieSpecialSubFleetDayNight) && PlayerManager.consumables.submarineSupplyMaterial) {
				const matsHeld = PlayerManager.consumables.submarineSupplyMaterial;
				const matsUsed = this.sortieSpecialSubFleetDayNight.sumValues();
				console.info("SubFleetCI affected submarineSupplyMaterial", matsHeld, -matsUsed);
				PlayerManager.consumables.submarineSupplyMaterial = Math.max(0, matsHeld - matsUsed);
				PlayerManager.setConsumables();
			}
			
			var sunkApCnt = 0;
			for(var i = 0; i < this.eships.length; i++) {
				if (this.enemySunk[i]) {
					let shipId = this.eships[i];
					let enemyShip = KC3Master.ship(shipId);
					if (!enemyShip) {
						// ID starts from 1, -1 represents empty slot
						if(shipId > 0){
							console.info("Cannot find enemy", shipId);
						}
					} else if (!KC3Master.isAbyssalShip(shipId)) {
						console.info("Enemy ship is not Abyssal", shipId);
					} else {
						switch(enemyShip.api_stype) {
							case  7:	// 7 = CVL
							case 11:	// 11 = CV
								console.log("You sunk a CV"+((enemyShip.api_stype==7)?"L":""));
								KC3QuestManager.get(217).increment();
								KC3QuestManager.get(211).increment();
								KC3QuestManager.get(220).increment();
								break;
							case 13:	// 13 = SS
								console.log("You sunk a SS");
								KC3QuestManager.get(230).increment();
								KC3QuestManager.get(228).increment();
								break;
							case 15:	// 15 = AP
								console.log("You sunk a AP");
								sunkApCnt += 1;
								KC3QuestManager.get(213).increment();
								KC3QuestManager.get(221).increment();
								break;
						}
					}

				}
			}
			if(sunkApCnt > 0){
				// Bd6 must inc first than Bd5 as its id smaller :)
				KC3QuestManager.get(212).increment(0, sunkApCnt);
				KC3QuestManager.get(218).increment(0, sunkApCnt);
			}
			// Save enemy deck name for encounter
			var name = resultData.api_enemy_info.api_deck_name;
			if(KC3SortieManager.isOnSortie() && !!name){
				this.saveEnemyEncounterInfo(null, name, this.nodalXP);
			}
		} catch (e) {
			console.warn("Caught an exception:", e, "\nProceeds safely");/*RemoveLogging:skip*/
		} finally {
			this.saveBattleOnDB(resultData);
		}
	};

	KC3Node.prototype.resultsPvP = function( resultData ){
		try {
			this.rating = resultData.api_win_rank;
			this.nodalXP = resultData.api_get_base_exp;
			if(this.allyNoDamage && this.rating === "S")
				this.rating = "SS";
			this.mvps = [resultData.api_mvp || 0];
		} catch (e) {
			console.warn("Captured an exception:", e, "\nProceeds safely");/*RemoveLogging:skip*/
		} finally {
			this.savePvPOnDB(resultData);
		}
	};
	
	function sumSupportDamageArray(damageArray) {
		return damageArray.reduce(function (total, attack) {
			// old data format used leading -1 to make 1-based arrays
			// kcsapi adds 0.1 to damage value to indicate flagship protection
			return total + Math.max(0, Math.floor(attack));
		}, 0);
	}

	function buildSupportExpeditionMessage(supportInfo) {
		let fleetId = "";
		let supportDamage = 0;
		const attackType = supportInfo.api_support_flag || supportInfo.api_n_support_flag;
		if (supportInfo.api_support_airatack) {
			const airatack = supportInfo.api_support_airatack;
			fleetId = airatack.api_deck_id;
			supportDamage = !airatack.api_stage3 ? 0 : sumSupportDamageArray(airatack.api_stage3.api_edam);
			// Support air attack has the same structure with kouku/LBAS
			// So disp_seiku, plane xxx_count are also possible to be displayed
			// Should break BattleSupportTips into another type for air attack
		} else if (supportInfo.api_support_hourai) {
			const hourai = supportInfo.api_support_hourai;
			fleetId = hourai.api_deck_id;
			supportDamage = !hourai.api_damage ? 0 : sumSupportDamageArray(hourai.api_damage);
		}
		return KC3Meta.term("BattleSupportTips").format(fleetId, KC3Meta.support(attackType), supportDamage);
	}
	/**
	 * Builds a complex long message for results of Exped/LBAS support attack,
	 * Used as a tooltip by devtools panel or SRoom Maps History for now.
	 * return a empty string if no any support triggered.
	 */
	KC3Node.prototype.buildSupportAttackMessage = function(thisNode = this,
		showEnemyDamage = false, autoVertical = false){
		var supportTips = "";
		if(thisNode.supportFlag && !!thisNode.supportInfo){
			supportTips += buildSupportExpeditionMessage(thisNode.supportInfo);
		}
		if (thisNode.nightSupportFlag && !!thisNode.nightSupportInfo) {
			supportTips += buildSupportExpeditionMessage(thisNode.nightSupportInfo);
		}
		var lbasTips = "";
		if(thisNode.lbasFlag && !!thisNode.airBaseAttack){
			if(!!thisNode.airBaseJetInjection){
				var jet = thisNode.airBaseJetInjection;
				var jetStage2 = jet.api_stage2 || {};
				var jetPlanes = jet.api_stage1.api_f_count;
				var jetShotdown = jet.api_stage1.api_e_lostcount + (jetStage2.api_e_lostcount || 0);
				var jetDamage = !jet.api_stage3 ? 0 : sumSupportDamageArray(jet.api_stage3.api_edam);
				jetDamage += !jet.api_stage3_combined ? 0 : sumSupportDamageArray(jet.api_stage3_combined.api_edam);
				var jetLost = jet.api_stage1.api_f_lostcount + (jetStage2.api_f_lostcount || 0);
				var jetEnemyPlanes = jet.api_stage1.api_e_count;
				if(jetEnemyPlanes > 0) {
					jetShotdown = "{0:eLostCount} / {1:eTotalCount}".format(jetShotdown, jetEnemyPlanes);
				}
				lbasTips += KC3Meta.term("BattleLbasJetSupportTips").format(jetPlanes, jetShotdown, jetDamage, jetLost);
			}
			$.each(thisNode.airBaseAttack, function(i, ab){
				var baseId = ab.api_base_id;
				var stage2 = ab.api_stage2 || {};
				var airBattle = KC3Meta.airbattle(ab.api_stage1.api_disp_seiku)[2];
				airBattle += ab.api_stage1.api_touch_plane[0] > 0 ? "+" + KC3Meta.term("BattleContact") : "";
				var planes = ab.api_stage1.api_f_count;
				var shotdown = ab.api_stage1.api_e_lostcount + (stage2.api_e_lostcount || 0);
				var damage = !ab.api_stage3 ? 0 : sumSupportDamageArray(ab.api_stage3.api_edam);
				damage += !ab.api_stage3_combined ? 0 : sumSupportDamageArray(ab.api_stage3_combined.api_edam);
				var lost = ab.api_stage1.api_f_lostcount + (stage2.api_f_lostcount || 0);
				var enemyPlanes = ab.api_stage1.api_e_count;
				if(enemyPlanes > 0) {
					shotdown = "{0:eLostCount} / {1:eTotalCount}".format(shotdown, enemyPlanes);
				}
				if(!!lbasTips) { lbasTips += "\n"; }
				lbasTips += KC3Meta.term("BattleLbasSupportTips").format(planes, baseId, shotdown, damage, lost, airBattle);
			});
			// PBY-5A Catalina rescue system implemented since 2021-04-22
			const rescueType = (thisNode.battleDay || {}).api_air_base_rescue_type;
			if(!!lbasTips && rescueType > 0) {
				lbasTips += "\n" + KC3Meta.term("BattleLbasRescueTip").format(rescueType);
			}
			if(!!supportTips && !!lbasTips) { supportTips += "\n"; }
		}
		const tipLogs = supportTips + lbasTips;
		if(tipLogs === "") return "";
		const tooltip = $("<div/>"), logs = $("<p></p>");
		logs.css("font-size", "11px").css("max-width", "390px").appendTo(tooltip);
		logs.append(tipLogs);
		
		// night battle only nodes (at 5-3) have allowed support fleet since 2017-11-17
		const battleData = thisNode.battleDay || thisNode.battleNight;
		if(showEnemyDamage && battleData && battleData.api_e_nowhps){
			// Battle data without `api_e_nowhps` is old, not supported by current prediction module
			const { fleets } = KC3BattlePrediction.analyzeBattlePartially(
				battleData, {}, // Not concern at damecons and damages of player ships here
				// Might pre-define this type of phases preset inside module?
				["nSupport", "airBaseInjection", "airBaseAttack", "support"]
			);
			// Auto put table vertically on right if lines of logs >= enemy ship amount
			const tipLogsLines = (tipLogs.match(/\r\n|\n|\r/g) || []).length + 1;
			const isVertical = autoVertical && tipLogsLines >= Math.max(6, battleData.api_ship_ke.length);
			const enemyTable = isVertical ?
				$(`<table>
					<tr class="r1"><td class="e1 s"></td><td class="e1 d"></td><td class="m1 s"></td><td class="m1 d"></td></tr>
					<tr class="r2"><td class="e2 s"></td><td class="e2 d"></td><td class="m2 s"></td><td class="m2 d"></td></tr>
					<tr class="r3"><td class="e3 s"></td><td class="e3 d"></td><td class="m3 s"></td><td class="m3 d"></td></tr>
					<tr class="r4"><td class="e4 s"></td><td class="e4 d"></td><td class="m4 s"></td><td class="m4 d"></td></tr>
					<tr class="r5"><td class="e5 s"></td><td class="e5 d"></td><td class="m5 s"></td><td class="m5 d"></td></tr>
					<tr class="r6"><td class="e6 s"></td><td class="e6 d"></td><td class="m6 s"></td><td class="m6 d"></td></tr>
				</table>`) :
				$(`<table><tr class="main">
					<td class="m1 s"></td><td class="m1 d"></td><td class="m2 s"></td><td class="m2 d"></td>
					<td class="m3 s"></td><td class="m3 d"></td><td class="m4 s"></td><td class="m4 d"></td>
					<td class="m5 s"></td><td class="m5 d"></td><td class="m6 s"></td><td class="m6 d"></td>
				</tr><tr class="escort">
					<td class="e1 s"></td><td class="e1 d"></td><td class="e2 s"></td><td class="e2 d"></td>
					<td class="e3 s"></td><td class="e3 d"></td><td class="e4 s"></td><td class="e4 d"></td>
					<td class="e5 s"></td><td class="e5 d"></td><td class="e6 s"></td><td class="e6 d"></td>
				</tr></table>`);
			// Remove line feeds and indents to avoid auto `<br/>` converting
			enemyTable.html(enemyTable.prop("outerHTML").replace(/\t|\n|\r|\r\n/g, ""));
			enemyTable.css("font-size", "11px");
			if(isVertical) {
				logs.css("float", "left");
				enemyTable.css("float", "left").css("margin-left", "5px");
			}
			const enemyShips = battleData.api_ship_ke.slice(0, 6),
				mainFleetCount = enemyShips.length,
				enemyShipHps = battleData.api_e_nowhps.slice(0, 6);
			if(battleData.api_ship_ke_combined) {
				enemyShips.push(...battleData.api_ship_ke_combined);
				enemyShipHps.push(...battleData.api_e_nowhps_combined);
			}
			const enemyShipDamages = enemyShipHps.slice(0);
			fleets.enemyMain.forEach((ship, idx) => { enemyShipDamages[idx] -= ship.hp; });
			if(battleData.api_ship_ke_combined) {
				fleets.enemyEscort.forEach((ship, idx) => {
					const pos = mainFleetCount + idx;
					enemyShipDamages[pos] -= ship.hp;
				});
			}
			enemyShips.forEach((sid, idx) => {
				if(sid > 0) {
					const shipIdx = idx > mainFleetCount - 1 ? idx - mainFleetCount + 1 : idx + 1,
						mainEscort = idx > mainFleetCount - 1 ? "e" : "m";
					const shipCell = $(`.${mainEscort}${shipIdx}.s`, enemyTable),
						damageCell = $(`.${mainEscort}${shipIdx}.d`, enemyTable);
					const shipMaster = KC3Master.ship(sid);
					const shipIcon = $("<img/>").width(14).height(14)
						.css("margin-top", "-3px")
						.attr("src", KC3Meta.abyssIcon(sid));
					shipCell.append(shipIcon).css("padding-right", 3);
					damageCell.append(-enemyShipDamages[idx]).css("padding-right", 5);
					const isSunk = enemyShipDamages[idx] >= enemyShipHps[idx];
					if(isSunk) damageCell.css("color", "goldenrod");
				}
			});
			tooltip.append(enemyTable);
		}
		return tooltip.html();
	};
	
	/**
	 * Builds a complex long message for results of AACI fire,
	 * Used as a tooltip by devtools panel or SRoom Maps History for now.
	 * return a empty string if no any AACI triggered.
	 */
	KC3Node.prototype.buildAntiAirCutinMessage = function(){
		var thisNode = this;
		var aaciTips = "";
		if(!!thisNode.antiAirFire && thisNode.antiAirFire.length > 0){
			thisNode.antiAirFire.forEach(fire => {
				if(!!fire){
					var fireShipPos = fire.api_idx; // starts from 0
					// fireShipPos in [0, 5]: in normal fleet or main fleet, 6 for 3rd 7 ships fleet
					// fireShipPos in [6, 11]: in escort fleet
					if(fireShipPos >= 0 && fireShipPos < 12){
						var sentFleet = PlayerManager.fleets[fireShipPos >= 6 && thisNode.playerCombined ? 1 : thisNode.fleetSent-1];
						fireShipPos = thisNode.playerCombined ? fireShipPos % 6 : fireShipPos;
						var shipName = KC3ShipManager.get(sentFleet.ships[fireShipPos]).name();
						aaciTips += (!!aaciTips ? "\n" : "") + (shipName || "");
						var aaciType = AntiAir.AACITable[fire.api_kind];
						if(!!aaciType){
							aaciTips += "\n[{0}] +{1} (x{2})"
								.format(aaciType.id, aaciType.fixed, aaciType.modifier);
						} else {
							aaciTips += "\n[{0}] {1}"
								.format(fire.api_kind, KC3Meta.term("Unknown"));
						}
					}
					var itemList = fire.api_use_items;
					if(!!itemList && itemList.length > 0){
						for(var itemIdx = 0; itemIdx < Math.min(itemList.length,4); itemIdx++) {
							if(itemList[itemIdx] > -1) aaciTips += "\n" +
								KC3Meta.gearName(KC3Master.slotitem(itemList[itemIdx]).api_name);
						}
					}
				}
			});
		}
		return aaciTips;
	};
	
	/**
		Build a tooltip about computed enemy air power for researching air battle
	*/
	KC3Node.prototype.buildAirPowerMessage = function(forLbas = false, isPvP = this.isPvP){
		var tooltip = this.airbattle[2] || "";
		// Show all results for multi-waves heavy air raid, only last wave shown in-game
		if(Array.isArray(this.airbattleIdByWaves)){
			tooltip += " [{0}]".format(this.airbattleIdByWaves.map(seiku => KC3Meta.airbattle(seiku)[0] || "?").join(","));
		}
		const apTuple = KC3Calc.enemyFighterPower(this.eships, this.eSlot, undefined, forLbas);
		// Air Power: AI<1/3, 1/3<=AD<2/3, 2/3<=AP<3/2, 3/2<=AS<3, 3<=AS+
		const ap = apTuple[0];
		if(!!ap){
			tooltip += "\n" + KC3Meta.term("InferredFighterPower")
				.format(KC3Calc.fighterPowerIntervals(ap));
			if(!!isPvP){
				tooltip += "\n" + KC3Meta.term("InferredPvPDisclaimer");
			}
		}
		const enemyTotalPlanes = this.planeFighters.abyssal[0];
		if(!!enemyTotalPlanes){
			// 'AA plane + Non AA plane - stage1 Total' may be unknown slot sum or shot down by support
			tooltip += "\n" + KC3Meta.term("InferredEnemyAircraft")
				.format(apTuple[1], apTuple[2], enemyTotalPlanes,
					apTuple[1] + apTuple[2] - enemyTotalPlanes);
			// so try to infer unknown count by looking through air base attack
			let airBaseEnemyTotalPlanes = 0;
			if(this.airBaseAttack && this.airBaseAttack[0] && this.airBaseAttack[0].api_stage1){
				airBaseEnemyTotalPlanes = this.airBaseAttack[0].api_stage1.api_e_count;
			}
			if(airBaseEnemyTotalPlanes){
				tooltip += "\n" + KC3Meta.term("InferredLbasPlanes")
					.format(airBaseEnemyTotalPlanes, apTuple[3],
						airBaseEnemyTotalPlanes - apTuple[1] - apTuple[2] - apTuple[3]);
			}
			// also try to infer unknown count by looking through friend fleet aerial support
			let friendEnemyTotalPlanes = 0;
			if(Object.getSafePath(this.battleDay, "api_friendly_kouku.api_stage1")){
				friendEnemyTotalPlanes = this.battleDay.api_friendly_kouku.api_stage1.api_e_count;
			}
			if(friendEnemyTotalPlanes){
				tooltip += "\n" + KC3Meta.term("InferredSupportPlanes")
					.format(friendEnemyTotalPlanes,
						apTuple[1] + apTuple[2] - friendEnemyTotalPlanes);
			}
			// also try to infer something from exped fleet aerial support
			let airSupportEnemyTotalPlanes = 0;
			if(Object.getSafePath(this.battleDay, "api_support_info.api_support_airatack.api_stage1")){
				airSupportEnemyTotalPlanes = this.battleDay.api_support_info.api_support_airatack.api_stage1.api_e_count;
			}
			if(airSupportEnemyTotalPlanes){
				tooltip += "\n" + KC3Meta.term("InferredSupportPlanes")
					.format(airSupportEnemyTotalPlanes,
						apTuple[1] + apTuple[2] - airSupportEnemyTotalPlanes);
			}
			// also may try to infer something from jet assault phase, if abyssal has one
		}
		if(Object.keys(apTuple[4]).length > 0){
			tooltip += "\n" + KC3Meta.term("InferredExceptions").format(JSON.stringify(apTuple[4]));
		}
		return $("<p></p>")
			.css("font-size", "11px")
			.text(tooltip)
			.prop("outerHTML");
	};

	/**
	 * Builds a complex long message for battle enemy face icon,
	 * Used as a tooltip by devtools panel or SRoom Maps History for now.
	 * @param index - index of enemy data Array, range in [0, 11],
	 *        should pass left params if this node data not available, otherwise error will occur.
	 * @param restParams - to override data from this node.
	 * @return HTML string, a empty string if masterId invalid.
	 */
	KC3Node.prototype.buildEnemyStatsMessage = function(index,
			masterId = this.eships[index],
			level = this.elevels[index],
			currentHp = (this.enemyHP[index] || {}).hp,
			maxHp = this.maxHPs.enemy[index],
			eParam = this.eParam[index],
			eSlot = this.eSlot[index],
			isPvP = this.isPvP){
		var tooltip = "";
		const iconStyles = {
			"width":"13px", "height":"13px",
			"margin-top":"-3px", "margin-right":"2px"
		};
		if(masterId > 0){
			const shipMaster = KC3Master.ship(masterId);
			const abyssMaster = KC3Master.abyssalShip(masterId, true);
			const isCurrentHpShown = ConfigManager.info_battle && this.enemyHP && Object.keys(this.enemyHP[index] || {}).length > 0;
			tooltip += "{0}: {1}\n".format(masterId,
				isPvP ? KC3Meta.shipName(masterId) : KC3Meta.abyssShipName(masterId));
			tooltip += "{0} Lv {1} HP {2}\n".format(
				KC3Meta.stype(shipMaster.api_stype),
				level || "?",
				!isCurrentHpShown ? maxHp || "?" :
					"{0} /{1}".format(currentHp === 0 || currentHp ? currentHp : "?", maxHp || "?")
			);
			if(Array.isArray(eParam)){
				tooltip += $("<img />").attr("src", KC3Meta.statIcon("mod_fp"))
					.css(iconStyles).prop("outerHTML");
				tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipFire"), eParam[0]);
				tooltip += $("<img />").attr("src", KC3Meta.statIcon("mod_tp"))
					.css(iconStyles).prop("outerHTML");
				tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipTorpedo"), eParam[1]);
				tooltip += $("<img />").attr("src", KC3Meta.statIcon("mod_aa"))
					.css(iconStyles).prop("outerHTML");
				tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipAntiAir"), eParam[2]);
				tooltip += $("<img />").attr("src", KC3Meta.statIcon("mod_ar"))
					.css(iconStyles).prop("outerHTML");
				tooltip += "{0}: {1}".format(KC3Meta.term("ShipArmor"), eParam[3]);
			}
			if(Array.isArray(eSlot) && eSlot.length > 0){
				for(let slotIdx = 0; slotIdx < Math.min(eSlot.length, 5); slotIdx++){
					const gearMaster = KC3Master.slotitem(eSlot[slotIdx]);
					if(eSlot[slotIdx] > 0 && !!gearMaster) {
						tooltip += "\n" + $("<img />")
							.attr("src", KC3Meta.itemIcon(gearMaster.api_type[3]))
							.css(iconStyles).prop("outerHTML");
						tooltip += KC3Meta.gearName(gearMaster.api_name);
						if(KC3GearManager.carrierBasedAircraftType3Ids
							.indexOf(gearMaster.api_type[3]) > -1){
							let slotMaxeq = isPvP ? shipMaster.api_maxeq[slotIdx] : (abyssMaster.api_maxeq || [])[slotIdx];
							slotMaxeq = slotMaxeq === undefined ? "?" : slotMaxeq;
							tooltip += $("<span></span>").css("color", "#999").text(" x"+slotMaxeq).prop("outerHTML");
						}
					}
				}
			}
		}
		return tooltip;
	};

	/**
	 * Build HTML tooltip for friendly fleet info and battle result.
	 */
	KC3Node.prototype.buildFriendlyBattleMessage = function(battleData = this.battleNight, sortieTime = this.stime * 1000, battleType = ""){
		//console.debug("Friendly battle", battleData, this.battleDay);
		const friendlyTable = $('<table>' +
			'<tr class="header"><th class="type" colspan="3">&nbsp;</th><th class="level">Lv</th><th class="hp">HP</th><th class="stats"></th><th class="equip">&nbsp;</th></tr>' +
			'<tr class="ship_1"><td class="face"></td><td class="name"></td><td class="voice"></td><td class="level"></td><td class="hp"></td><td class="stats"></td><td class="equip"></td></tr>' +
			'<tr class="ship_2"><td class="face"></td><td class="name"></td><td class="voice"></td><td class="level"></td><td class="hp"></td><td class="stats"></td><td class="equip"></td></tr>' +
			'<tr class="ship_3"><td class="face"></td><td class="name"></td><td class="voice"></td><td class="level"></td><td class="hp"></td><td class="stats"></td><td class="equip"></td></tr>' +
			'<tr class="ship_4"><td class="face"></td><td class="name"></td><td class="voice"></td><td class="level"></td><td class="hp"></td><td class="stats"></td><td class="equip"></td></tr>' +
			'<tr class="ship_5"><td class="face"></td><td class="name"></td><td class="voice"></td><td class="level"></td><td class="hp"></td><td class="stats"></td><td class="equip"></td></tr>' +
			'<tr class="ship_6"><td class="face"></td><td class="name"></td><td class="voice"></td><td class="level"></td><td class="hp"></td><td class="stats"></td><td class="equip"></td></tr>' +
			'<tr class="ship_7"><td class="face"></td><td class="name"></td><td class="voice"></td><td class="level"></td><td class="hp"></td><td class="stats"></td><td class="equip"></td></tr>' +
			'</table>');
		const enemyTable = $('<table>' +
			'<tr class="main"><td class="s_1"></td><td class="dmg_1"></td><td class="s_2"></td><td class="dmg_2"></td><td class="s_3"></td><td class="dmg_3"></td>' +
				'<td class="s_4"></td><td class="dmg_4"></td><td class="s_5"></td><td class="dmg_5"></td><td class="s_6"></td><td class="dmg_6"></td></tr>' +
			'<tr class="escort"><td class="s_1"></td><td class="dmg_1"></td><td class="s_2"></td><td class="dmg_2"></td><td class="s_3"></td><td class="dmg_3"></td>' +
				'<td class="s_4"></td><td class="dmg_4"></td><td class="s_5"></td><td class="dmg_5"></td><td class="s_6"></td><td class="dmg_6"></td></tr>' +
			'</table>');
		const tooltip = $("<div></div>");
		// Summaries ship damage for one side made by another side for night shelling
		const sumFriendlyBattleDamages = (friendlyBattle, defenderFleetCount, attackerSide = 0) => {
			const damages = new Array(defenderFleetCount).fill(0);
			const hougeki = friendlyBattle.api_hougeki;
			hougeki.api_at_eflag.forEach((sideFlag, atkIdx) => {
				if(sideFlag === attackerSide) {
					hougeki.api_df_list[atkIdx].forEach((defender, dmgIdx) => {
						if(defender >= 0 && defender < defenderFleetCount) {
							damages[defender] += sumSupportDamageArray([hougeki.api_damage[atkIdx][dmgIdx] || 0]);
						}
					});
				}
			});
			return damages;
		};
		// Summaries ship damages from day aerial support (added since 2021-09-17)
		const sumFriendlyKoukuDamages = (friendlyKouku, defenderFleetCount, attackerSide = 0) => {
			const damages = new Array(defenderFleetCount).fill(0);
			let mainFleetCount = 6;
			if(friendlyKouku.api_stage3) {
				const dmgArr = attackerSide === 0 ? friendlyKouku.api_stage3.api_edam : friendlyKouku.api_stage3.api_fdam;
				mainFleetCount = dmgArr.legnth;
				(dmgArr || []).forEach((dmg, idx) => {
					damages[idx] += sumSupportDamageArray([dmg || 0]);
				});
			}
			if(friendlyKouku.api_stage3_combined) {
				const dmgArrCombined = attackerSide === 0 ? friendlyKouku.api_stage3_combined.api_edam : friendlyKouku.api_stage3_combined.api_fdam;
				(dmgArrCombined || []).forEach((dmg, idx) => {
					damages[idx + mainFleetCount] += sumSupportDamageArray([dmg || 0]);
				});
			}
			return damages;
		};
		battleData = battleData || {};
		const friendlyFleet = battleData.api_friendly_info;
		// Try to auto recognize battle type if not specified
		if(!battleType) {
			if(battleData.api_friendly_kouku) battleType = "kouku";
			if(battleData.api_friendly_battle) battleType = "battle";
			if(!battleType || (battleData.api_friendly_kouku && battleData.api_friendly_battle)) {
				console.warn("Unrecognized or unsupported friend fleet battle type", battleData);
			}
		}
		const friendlyBattle = battleData[`api_friendly_${battleType}`];
		if(!friendlyFleet || !friendlyBattle) return tooltip.html();
		const isAirSupport = battleType === "kouku";
		const sumFriendlyDamageFunc = isAirSupport ? sumFriendlyKoukuDamages : sumFriendlyBattleDamages;
		
		// Fill up table of friendly fleet info
		friendlyTable.css("font-size", "11px");
		$(".header .hp", friendlyTable).css("text-align", "center");
		const yasenIcon = $("<img/>").width(10).height(10)
			.css("margin-top", "-2px")
			.attr("src", KC3Meta.statIcon("yasen"));
		const aaIcon = $("<img/>").width(10).height(10)
			.css("margin-top", "-2px")
			.attr("src", KC3Meta.statIcon("aa"));
		$(".header .stats", friendlyTable).append(isAirSupport ? aaIcon : yasenIcon);
		$(".type", friendlyTable).text("#{0}".format(friendlyFleet.api_production_type));
		const friendlyFleetDamages = sumFriendlyDamageFunc(friendlyBattle,
			friendlyFleet.api_ship_id.length, 1);
		const aaciInfo = {};
		if(isAirSupport && friendlyBattle.api_stage2 && friendlyBattle.api_stage2.api_air_fire) {
			const airfire = friendlyBattle.api_stage2.api_air_fire;
			aaciInfo[airfire.api_idx] = {
				kind: airfire.api_kind,
				items: (airfire.api_use_items || []).map(v => Number(v))
			};
		}
		friendlyFleet.api_ship_id.forEach((sid, idx) => {
			const tRow = $(`.ship_${idx+1}`, friendlyTable);
			if(sid > 0) {
				const shipMaster = KC3Master.ship(sid);
				const chp = friendlyFleet.api_nowhps[idx], mhp = friendlyFleet.api_maxhps[idx];
				const leftHp = chp - friendlyFleetDamages[idx];
				const isTaiha = (leftHp / mhp) < 0.25;
				const shipIcon = $("<img/>").width(14).height(14)
					.css("margin-top", "-3px").addClass("shipiconimg")
					.attr("src", KC3Meta.shipIcon(sid, undefined, true, isTaiha));
				$(".face", tRow).append(shipIcon).css("padding-right", 3);
				$(".name", tRow).append(KC3Meta.shipName(shipMaster.api_id)).css("padding-right", 2);
				$(".voice", tRow).append(friendlyFleet.api_voice_p_no[idx] > 0 ?
					$("<img/>").width(11).height(8).css("margin-top", "-2px")
						.attr("src", "/assets/img/ui/sound.png") :
					"&nbsp;"
				).css("padding-right", 3);
				$(".level", tRow).append(friendlyFleet.api_ship_lv[idx]).css("padding-right", 5);
				$(".hp", tRow).append("{0}{2} /{1}".format(chp, mhp,
						friendlyFleetDamages[idx] > 0 ? -friendlyFleetDamages[idx] : ""
					)
				).css("padding-right", 5);
				if(isTaiha) $(".hp", tRow).css("color", "red");
				if(isAirSupport) {
					// Show anti-air power only
					$(".stats", tRow).append(
						"{0} /{1}".format(
							friendlyFleet.api_Param[idx][2],
							shipMaster.api_tyku[1]
						)
					).css("padding-right", 3);
				} else {
					// Show yasen (fp + tp) power only, ship current power / possible max power
					$(".stats", tRow).append(
						"{0} /{1}".format(
							friendlyFleet.api_Param[idx][0] + friendlyFleet.api_Param[idx][1],
							shipMaster.api_houg[1] + shipMaster.api_raig[1]
						)
					).css("padding-right", 3);
				}
				const isStarShellUser = friendlyBattle.api_flare_pos && friendlyBattle.api_flare_pos[0] === idx;
				const isAaciTriggered = isAirSupport && aaciInfo[idx] && aaciInfo[idx].kind > 0;
				friendlyFleet.api_Slot[idx].forEach((gid, slot) => {
					if(gid > 0) {
						const gearMaster = KC3Master.slotitem(gid);
						const gearIcon = $("<img/>").width(13).height(13)
							.css("vertical-align", "text-bottom")
							.attr("src", KC3Meta.itemIcon(gearMaster.api_type[3]));
						if(isStarShellUser && gearMaster.api_type[2] === 33) {
							gearIcon.css("filter", "drop-shadow(0px 0px 2px #ff3399)")
								.css("-webkit-filter", "drop-shadow(0px 0px 2px #ff3399)");
						}
						if(isAaciTriggered && aaciInfo[idx].items.includes(gearMaster.api_id)) {
							gearIcon.css("filter", "drop-shadow(0px 0px 2px #119911)")
								.css("-webkit-filter", "drop-shadow(0px 0px 2px #119911)");
						}
						$(".equip", tRow).append(gearIcon).css("margin-right", 2);
					}
				});
				if(Array.isArray(friendlyFleet.api_slot_ex) && friendlyFleet.api_slot_ex[idx] > 0) {
					const gearMaster = KC3Master.slotitem(friendlyFleet.api_slot_ex[idx]);
					const gearIcon = $("<img/>").width(13).height(13)
						.css("vertical-align", "text-bottom")
						.css("border-radius", "50%")
						.css("background-color", "rgba(192,192,192,0.5)")
						.attr("src", KC3Meta.itemIcon(gearMaster.api_type[3]));
					if(isAaciTriggered && aaciInfo[idx].items.includes(gearMaster.api_id)) {
						gearIcon.css("filter", "drop-shadow(0px 0px 2px #119911)")
							.css("-webkit-filter", "drop-shadow(0px 0px 2px #119911)");
					}
					$(".equip", tRow).append(gearIcon).css("margin-right", 2);
				}
			}
		});
		// Fill up table of damage made to abyssal ships
		enemyTable.css("font-size", "11px");
		const enemyShips = battleData.api_ship_ke.slice(0, 6),
			mainFleetCount = enemyShips.length,
			enemyShipBeforeHps = battleData.api_e_nowhps.slice(0, 6);
		if(battleData.api_ship_ke_combined) {
			enemyShips.push(...battleData.api_ship_ke_combined);
			enemyShipBeforeHps.push(...battleData.api_e_nowhps_combined);
		}
		const enemyFleetDamages = sumFriendlyDamageFunc(friendlyBattle,
			enemyShips.length, 0);
		enemyShips.forEach((sid, idx) => {
			const tRow = $(idx > mainFleetCount - 1 ? ".escort" : ".main", enemyTable);
			const shipIdx = idx > mainFleetCount - 1 ? idx - mainFleetCount + 1 : idx + 1;
			if(sid > 0) {
				const shipMaster = KC3Master.ship(sid);
				const shipIcon = $("<img/>").width(14).height(14)
					.css("margin-top", "-3px")
					.attr("src", KC3Meta.abyssIcon(sid));
				$(`.s_${shipIdx}`, tRow).append(shipIcon).css("padding-right", 3);
				$(`.dmg_${shipIdx}`, tRow).append(-enemyFleetDamages[idx]).css("padding-right", 5);
				const isSunk = enemyFleetDamages[idx] > 0 && enemyShipBeforeHps[idx] -
					// before Phase 2, enemyShipBeforeHps meant enemyShipAfterHps
					(KC3Meta.isPhase2Started(sortieTime) ? enemyFleetDamages[idx] : 0) <= 0;
				if(isSunk) $(`.dmg_${shipIdx}`, tRow).css("color", "goldenrod");
			}
		});
		// Join up messages and tables
		tooltip.append(KC3Meta.term("BattleFriendlyArrived") + "<br/>");
		tooltip.append(friendlyTable);
		if(isAirSupport) {
			const stage1 = friendlyBattle.api_stage1 || {},
				stage2 = friendlyBattle.api_stage2 || {};
			const etotal = (stage1.api_e_count || 0);
			const elost = (stage1.api_e_lostcount || 0) + (stage2.api_e_lostcount || 0);
			const planeInfo = "{0} / {1}".format(elost, etotal);
			const airBattle = KC3Meta.airbattle(stage1.api_disp_seiku)[2];
			const aaciKinds = Object.keys(aaciInfo).map(pos => aaciInfo[pos].kind).filter(v => v > 0);
			const airBattleInfo = aaciKinds.length ? "{0} (AACI: {1})".format(airBattle, aaciKinds.join(",")) : airBattle;
			tooltip.append(KC3Meta.term("BattleFriendlyKouku").format(planeInfo, airBattleInfo) + "<br/>");
		} else {
			tooltip.append(KC3Meta.term("BattleFriendlyBattle") + "<br/>");
		}
		tooltip.append(enemyTable);
		return tooltip.html();
	};

	/**
		Build HTML tooltip for details of air battle losses
	*/
	KC3Node.prototype.buildAirBattleLossMessage = function(){
		const template = $('<table><tr><th class="type">&nbsp;</th><th>'+KC3Meta.term("BattleTipFriendly")+'&nbsp;</th><th>'+KC3Meta.term("BattleTipAbyssal")+'</th></tr>' +
			'<tr class="contact_row"><td>'+KC3Meta.term("BattleContact")+'</td><td class="ally_contact"></td><td class="enemy_contact"></td></tr>' +
			'<tr class="airbattle_row"><td>'+KC3Meta.term("BattleTipAirResult")+'</td><td colspan="2" class="airbattle"></td></tr>' +
			'<tr><td>Stage1</td><td class="ally_fighter"></td><td class="enemy_fighter"></td></tr>' +
			'<tr><td>Stage2</td><td class="ally_bomber"></td><td class="enemy_bomber"></td></tr>' +
			'<tr class="aaci"><td>'+KC3Meta.term("BattleTipAaci")+'</td><td class="kind"></td><td class="info"></td></tr>' +
			'</table>'
		);
		const stage3Template = $('<table class="stage3"><tr><td colspan="18">Stage3</td></tr>' +
			'<tr class="ally_main"><td class="s_1"></td><td class="f_1"></td><td class="dmg_1"></td><td class="s_2"></td><td class="f_2"></td><td class="dmg_2"></td><td class="s_3"></td><td class="f_3"></td><td class="dmg_3"></td>' +
			'<td class="s_4"></td><td class="f_4"></td><td class="dmg_4"></td><td class="s_5"></td><td class="f_5"></td><td class="dmg_5"></td><td class="s_6"></td><td class="f_6"></td><td class="dmg_6"></td><td class="s_7"></td><td class="f_7"></td><td class="dmg_7"></td></tr>' +
			'<tr class="ally_escort"><td class="s_1"></td><td class="f_1"></td><td class="dmg_1"></td><td class="s_2"></td><td class="f_2"></td><td class="dmg_2"></td><td class="s_3"></td><td class="f_3"></td><td class="dmg_3"></td>' +
			'<td class="s_4"></td><td class="f_4"></td><td class="dmg_4"></td><td class="s_5"></td><td class="f_5"></td><td class="dmg_5"></td><td class="s_6"></td><td class="f_6"></td><td class="dmg_6"></td></tr>' +
			'<tr class="enemy_main"><td class="s_1"></td><td class="f_1"></td><td class="dmg_1"></td><td class="s_2"></td><td class="f_2"></td><td class="dmg_2"></td><td class="s_3"></td><td class="f_3"></td><td class="dmg_3"></td>' +
			'<td class="s_4"></td><td class="f_4"></td><td class="dmg_4"></td><td class="s_5"></td><td class="f_5"></td><td class="dmg_5"></td><td class="s_6"></td><td class="f_6"></td><td class="dmg_6"></td></tr>' +
			'<tr class="enemy_escort"><td class="s_1"></td><td class="f_1"></td><td class="dmg_1"></td><td class="s_2"></td><td class="f_2"></td><td class="dmg_2"></td><td class="s_3"></td><td class="f_3"></td><td class="dmg_3"></td>' +
			'<td class="s_4"></td><td class="f_4"></td><td class="dmg_4"></td><td class="s_5"></td><td class="f_5"></td><td class="dmg_5"></td><td class="s_6"></td><td class="f_6"></td><td class="dmg_6"></td></tr>' +
			'</table>'
		);
		const tooltip = $("<div></div>");
		const enemyMainShipIds = this.battleDay.api_ship_ke || [],
			enemyEscortShipIds = this.battleDay.api_ship_ke_combined || [];
		const fillAirBattleData = function(typeName, koukuApiData, ignoreStage3){
			const tables = $("<div></div>");
			const table = template.clone().appendTo(tables);
			const planeFrom = koukuApiData.api_plane_from;
			const stage1 = koukuApiData.api_stage1 || {
					api_f_count:0,api_f_lostcount:0,
					api_e_count:0,api_e_lostcount:0
				},
				stage2 = koukuApiData.api_stage2,
				stage3 = koukuApiData.api_stage3,
				stage3cf = koukuApiData.api_stage3_combined;
			$(".type", table).html(typeName + "&nbsp;");
			if(stage1.api_touch_plane){
				$(".ally_contact", table).text(stage1.api_touch_plane[0] <= 0 ? KC3Meta.term("BattleContactNo") : "[{0}]".format(stage1.api_touch_plane[0]));
				$(".enemy_contact", table).text(stage1.api_touch_plane[1] <= 0 ? KC3Meta.term("BattleContactNo") : "[{0}]".format(stage1.api_touch_plane[1]));
			} else {
				$(".ally_contact", table).text("---");
				$(".enemy_contact", table).text("---");
				$(".contact_row", table).hide();
			}
			if(stage1.api_disp_seiku !== undefined){
				$(".airbattle", table).text(KC3Meta.airbattle(stage1.api_disp_seiku)[2]);
			} else {
				$(".airbattle", table).text("---");
				$(".airbattle_row", table).hide();
			}
			$(".ally_fighter", table).text(stage1.api_f_count + (stage1.api_f_lostcount > 0 ? " -" + stage1.api_f_lostcount : ""));
			$(".enemy_fighter", table).text(stage1.api_e_count + (stage1.api_e_lostcount > 0 ? " -" + stage1.api_e_lostcount : ""));
			if(stage2){
				$(".ally_bomber", table).text(stage2.api_f_count + (stage2.api_f_lostcount > 0 ? " -" + stage2.api_f_lostcount : ""));
				$(".enemy_bomber", table).text(stage2.api_e_count + (stage2.api_e_lostcount > 0 ? " -" + stage2.api_e_lostcount : ""));
				if(stage2.api_air_fire){
					const airfire = stage2.api_air_fire;
					$(".aaci .kind", table).text("[{0}]".format(airfire.api_kind));
					$(".aaci .info", table).text("#{0} [{1}]".format(
						airfire.api_idx + 1, airfire.api_use_items.join(",")
					));
				} else {
					$(".aaci", table).hide();
				}
			} else {
				$(".ally_bomber", table).text("---");
				$(".enemy_bomber", table).text("---");
				$(".aaci", table).hide();
			}
			const fillAirstrikeData = (stage3Api, table, className, enemyIds) => {
				// planeFrom[0] = ally fleet plane(s) engaged. it's always null for LBAS and support fleet
				if(planeFrom && (!planeFrom[0] || planeFrom[0].length) && Array.isArray(stage3Api.api_edam)){
					stage3Api.api_edam.forEach((dmg, i) => {
						const sid = enemyIds[i];
						if(sid > 0){
							const shipIcon = $("<img/>").width(14).height(14)
								.css("margin-top", "-3px").css("margin-right", "3px")
								.addClass("shipiconimg")
								// can be regular ship icon for PvP battle
								.attr("src", KC3Meta.abyssIcon(sid));
							$(`.enemy_${className} .s_${i+1}`, table).append(shipIcon);
							// targeted by dive bomber squadron(s)
							if(stage3Api.api_ebak_flag[i]){
								const diveBomber = $("<img/>").width(8).height(8)
									.css({"float": "left", "margin-left": "-5px", "margin-top": "0px"})
									.attr("src", KC3Meta.itemIcon(7));
								$(`.enemy_${className} .f_${i+1}`, table).append(diveBomber);
							}
							// targeted by torpedo bomber squadron(s)
							if(stage3Api.api_erai_flag[i]){
								const torpedoBomber = $("<img/>").width(8).height(8)
									.css({"float": "left", "margin-left": stage3Api.api_ebak_flag[i] ? "-8px" : "-5px", "margin-top": "7px"})
									.attr("src", KC3Meta.itemIcon(8));
								$(`.enemy_${className} .f_${i+1}`, table).append(torpedoBomber);
							}
							// 0.1 exists as flagship protection
							$(`.enemy_${className} .dmg_${i+1}`, table).text("-" + Math.floor(dmg)).css("padding-right", "5px");
							// purple = critical hit, golden = sunk (not implemented)
							if(stage3Api.api_ecl_flag[i]) $(`.enemy_${className} .dmg_${i+1}`, table).css("color", "mediumpurple");
						}
					});
				}
				// planeFrom[1] = enemy fleet plane(s) engaged
				if(planeFrom && planeFrom[1] && planeFrom[1].length && Array.isArray(stage3Api.api_fdam)){
					stage3Api.api_fdam.forEach((dmg, i) => {
						// Cannot get player's ship ID from single battle api or this node data, so only #number
						$(`.ally_${className} .s_${i+1}`, table)
							.text("#" + (i + (className === "escort" ? 7 : 1)))
							.css("color", "silver")
							.css("margin-right", "3px");
						// sp_list: [1] = bouncing torpedo (skip bombs) since 2022-05-27, treat it as dive bombing because bak_flag: 1 at the same time
						// see `main.js#AirWarStage3Model.SP_ATTACK_TYPE.BOUNCE_BOM`
						if(stage3Api.api_fbak_flag[i]){
							const diveBomber = $("<img/>").width(8).height(8)
								.css({"float": "left", "margin-left": "-5px", "margin-top": "0px"})
								.attr("src", KC3Meta.itemIcon(7));
							const isBounce = ((stage3Api.api_f_sp_list || [])[i] || []).includes(1);
							if(isBounce) {
								diveBomber.css("filter", "drop-shadow(0px 0px 2px #911)")
									.css("-webkit-filter", "drop-shadow(0px 0px 2px #911)");
							}
							$(`.ally_${className} .f_${i+1}`, table).append(diveBomber);
						}
						if(stage3Api.api_frai_flag[i]){
							const torpedoBomber = $("<img/>").width(8).height(8)
								.css({"float": "left", "margin-left": stage3Api.api_fbak_flag[i] ? "-8px" : "-5px", "margin-top": "7px"})
								.attr("src", KC3Meta.itemIcon(8));
							$(`.ally_${className} .f_${i+1}`, table).append(torpedoBomber);
						}
						$(`.ally_${className} .dmg_${i+1}`, table).text("-" + Math.floor(dmg)).css("padding-right", "5px");
						if(stage3Api.api_fcl_flag[i]) $(`.ally_${className} .dmg_${i+1}`, table).css("color", "mediumpurple");
					});
				}
			};
			// Ignore stage3 for LBAS because might be too many items, and summary report already showed
			if(!ignoreStage3 && (stage3 || stage3cf)){
				const stage3Table = stage3Template.clone().appendTo(tables);
				if(stage3) fillAirstrikeData(stage3, stage3Table, "main", enemyMainShipIds);
				if(stage3cf) fillAirstrikeData(stage3cf, stage3Table, "escort", enemyEscortShipIds);
			}
			$("table", tables).css("font-size", "11px");
			return tables.children();
		};
		// Land-Base Jet Assault
		if(this.battleDay.api_air_base_injection)
			fillAirBattleData(KC3Meta.term("BattleTipPhaseLbasJet"), this.battleDay.api_air_base_injection, true).appendTo(tooltip);
		// Carrier Jet Assault
		if(this.battleDay.api_injection_kouku)
			fillAirBattleData(KC3Meta.term("BattleTipPhaseJetAssult"), this.battleDay.api_injection_kouku).appendTo(tooltip);
		// Land-Base Aerial Support(s)
		if(this.battleDay.api_air_base_attack){
			$.each(this.battleDay.api_air_base_attack, function(i, lb){
				fillAirBattleData(KC3Meta.term("BattleTipPhaseLbasWave").format(i + 1), lb, true).appendTo(tooltip);
			});
		}
		// Friend Fleet Aerial Support
		if(this.battleDay.api_friendly_kouku){
			fillAirBattleData(KC3Meta.term("BattleTipPhaseFriendFleet"), this.battleDay.api_friendly_kouku).appendTo(tooltip);
		}
		// Carrier Aerial Combat / (Long Distance) Aerial Raid
		if(this.battleDay.api_kouku)
			fillAirBattleData(KC3Meta.term("BattleTipPhaseAirBattle"), this.battleDay.api_kouku).appendTo(tooltip);
		if(this.battleDay.api_kouku2)
			fillAirBattleData(KC3Meta.term("BattleTipPhaseAirBattleWave2"), this.battleDay.api_kouku2).appendTo(tooltip);
		// Exped Aerial Support
		if(Object.getSafePath(this.battleDay, "api_support_info.api_support_airatack"))
			fillAirBattleData(KC3Meta.term("BattleTipPhaseExpedAirSupport"), this.battleDay.api_support_info.api_support_airatack).appendTo(tooltip);
		return tooltip.html();
	};

	/**
	 * @return tuple of [
	 *   total damage dealt from carriers to enemy in day time opening aerial combat phase,
	 *   [planes from ship index (1-based)]
	 * ]
	 */
	KC3Node.prototype.getAirBattleDamageInvolved = function(b = this.battleDay){
		var totalDamage = 0;
		const planeFromSet = new Set();
		const isSafeArray = (obj, path) => Array.isArray(Object.getSafePath(obj, path));
		// jets assault from carriers
		if(isSafeArray(b, "api_injection_kouku.api_stage3.api_edam")){
			totalDamage += sumSupportDamageArray(b.api_injection_kouku.api_stage3.api_edam);
		}
		if(isSafeArray(b, "api_injection_kouku.api_stage3_combined.api_edam")){
			totalDamage += sumSupportDamageArray(b.api_injection_kouku.api_stage3_combined.api_edam);
		}
		if(isSafeArray(b, "api_injection_kouku.api_plane_from") && Array.isArray(b.api_injection_kouku.api_plane_from[0])){
			b.api_injection_kouku.api_plane_from[0].filter(idx => idx > -1).forEach(idx => { planeFromSet.add(idx); });
		}
		// regular air battle
		if(isSafeArray(b, "api_kouku.api_stage3.api_edam")){
			totalDamage += sumSupportDamageArray(b.api_kouku.api_stage3.api_edam);
		}
		if(isSafeArray(b, "api_kouku.api_stage3_combined.api_edam")){
			totalDamage += sumSupportDamageArray(b.api_kouku.api_stage3_combined.api_edam);
		}
		if(isSafeArray(b, "api_kouku.api_plane_from") && Array.isArray(b.api_kouku.api_plane_from[0])){
			b.api_kouku.api_plane_from[0].filter(idx => idx > -1).forEach(idx => { planeFromSet.add(idx); });
		}
		// 2nd wave for air battle only node, supposed to no combined
		if(isSafeArray(b, "api_kouku2.api_stage3_combined.api_edam")){
			totalDamage += sumSupportDamageArray(b.api_kouku2.api_stage3_combined.api_edam);
		}
		if(isSafeArray(b, "api_kouku2.api_plane_from") && Array.isArray(b.api_kouku2.api_plane_from[0])){
			b.api_kouku2.api_plane_from[0].filter(idx => idx > -1).forEach(idx => { planeFromSet.add(idx); });
		}
		return [totalDamage, [...planeFromSet]];
	};

	/**
	 * Not real battle on this node in fact. Enemy raid just randomly occurs before entering node.
	 * See: http://kancolle.wikia.com/wiki/Land-Base_Aerial_Support#Enemy_Raid
	 */
	KC3Node.prototype.airBaseRaid = function( battleData, isSaveEncounter = true ){
		this.battleDestruction = battleData;
		//console.debug("Raw Air Base Raid data", battleData);
		this.isAirBaseEnemyRaid = true;
		this.lostKind = battleData.api_lost_kind;
		this.eships = this.normalizeArrayIndex(battleData.api_ship_ke);
		// Pad ship array to 6 for saving into encounter record
		this.eships = Array.pad(this.eships, 6, -1);
		this.elevels = this.normalizeArrayIndex(battleData.api_ship_lv);
		this.elevels = Array.pad(this.elevels, 6, -1);
		this.eSlot = battleData.api_eSlot;
		this.eSlot = Array.pad(this.eSlot, 6, -1);
		//this.fformation = battleData.api_formation[0];
		this.eformation = battleData.api_formation[1];
		this.engagement = KC3Meta.engagement(battleData.api_formation[2]);
		this.maxHPs = {
			ally: battleData.api_f_maxhps,
			enemy: battleData.api_e_maxhps
		};
		this.beginHPs = {
			ally: battleData.api_f_nowhps,
			enemy: battleData.api_e_nowhps
		};
		var planePhase = battleData.api_air_base_attack.api_stage1 || {
				api_touch_plane:[-1,-1],
				api_f_count    :0,
				api_f_lostcount:0,
				api_e_count    :0,
				api_e_lostcount:0,
			},
			attackPhase = battleData.api_air_base_attack.api_stage2,
			bombingPhase = battleData.api_air_base_attack.api_stage3;
		this.fplaneFrom = battleData.api_air_base_attack.api_plane_from[0];
		this.fcontactId = planePhase.api_touch_plane[0];
		this.fcontact = this.fcontactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		this.eplaneFrom = battleData.api_air_base_attack.api_plane_from[1];
		this.econtactId = planePhase.api_touch_plane[1];
		this.econtact = this.econtactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		this.airbattle = KC3Meta.airbattle(planePhase.api_disp_seiku);
		this.planeFighters = {
			player:[
				planePhase.api_f_count,
				planePhase.api_f_lostcount
			],
			abyssal:[
				planePhase.api_e_count,
				planePhase.api_e_lostcount
			]
		};
		if(
			this.planeFighters.player[0]===0
			&& this.planeFighters.abyssal[0]===0
			&& attackPhase===null
		){
			this.airbattle = KC3Meta.airbattle(5);
		}
		this.planeBombers = { player:[0,0], abyssal:[0,0] };
		if(attackPhase !== null){
			this.planeBombers.player[0] = attackPhase.api_f_count;
			this.planeBombers.player[1] = attackPhase.api_f_lostcount;
			this.planeBombers.abyssal[0] = attackPhase.api_e_count;
			this.planeBombers.abyssal[1] = attackPhase.api_e_lostcount;
		}
		this.baseDamage = bombingPhase && bombingPhase.api_fdam
			? sumSupportDamageArray(bombingPhase.api_fdam)
			: 0;
		// Record encountered enemy air raid formation
		if(isSaveEncounter){
			this.saveEnemyEncounterInfo(this.battleDestruction, undefined, undefined, true);
		}
		if(battleData.api_m1){
			console.info("Map gimmick flag detected", battleData.api_m1);
		}
	};

	KC3Node.prototype.heavyAirBaseRaid = function( battleData ){
		this.isHeavyAirBaseRaid = true;
		this.heavyBattleDestructions = battleData;
		this.heavyDefenseRequest = battleData.api_scc;
		this.lostKindByWaves = [];
		this.baseDamageByWaves = [];
		this.fplaneFromByWaves = [];
		this.fcontactIdByWaves = [];
		this.airbattleIdByWaves = [];
		this.planeFightersByWaves = [];
		const battleArr = battleData.api_destruction_battle;
		if(Array.isArray(battleArr) && battleArr.length > 0){
			battleArr.forEach((singleWave, idx) => {
				// to save enemy counter only once
				const isLast = idx === battleArr.length - 1;
				this.airBaseRaid(singleWave, isLast);
				this.lostKindByWaves.push(this.lostKind);
				this.baseDamageByWaves.push(this.baseDamage);
				this.fplaneFromByWaves.push(this.fplaneFrom);
				this.planeFightersByWaves.push(this.planeFighters);
				this.fcontactIdByWaves.push(this.fcontactId);
				this.airbattleIdByWaves.push(Object.getSafePath(singleWave,
					"api_air_base_attack.api_stage1.api_disp_seiku"));
			});
			// client also merges all waves into 1 show, see main.js#AirRaidModel.prototype._convert and ._getLostKind
			// client only uses info except api_air_base_attack from 1st wave, show api_disp_seiku from last wave (see TaskAirUnitHeavy.prototype.setLast)
			// Here most info from last wave, and merge necessary data from all waves
			this.lostKind = ((arr) => (
				arr.includes(2) || arr.includes(1) && arr.includes(3) ? 2 :
				arr.includes(1) ? 1 : arr.includes(3) ? 3 : 4
			))(this.lostKindByWaves);
			this.baseDamage = this.baseDamageByWaves.sumValues();
			// Loss of player interception squads are cumulative wave by wave
			// abyssal counts kept from last wave
			this.planeFighters.player = [
				// total plane count is from 1st wave
				this.planeFightersByWaves[0].player[0],
				// lost plane count is total from all waves
				this.planeFightersByWaves.map(o => o.player[1]).sumValues()
			];
			// Skips planeBombers process since it seems api_stage2 always null for air raid?
			// According tests, defender squads count is decided by QTE result,
			// so api_map_squadron_plane and api_plane_from[0] will be null if api_scc = 0.
			// here only show fplaneFrom from last wave, so keep it untouched
		}
	};

	KC3Node.prototype.isBoss = function(){
		// see advanceNode() (SortieManager.js) for api details,
		// or alternatively at `Core.swf/common.models.bases.BattleBaseData.isBossMap()`
		// since Phase 2, see from `main.js#TaskNextSpot.prototype._createCellTaskBattle`
		//                      to `main.js#BattleSceneModel.map_info.prototype.isBoss`
		// only decided by api_event_id = 5, irrelevant to api_event_kind
		return this.eventId === 5;
	};

	KC3Node.prototype.isValidBoss = function(){
		if(!this.isBoss()) return false;
		const thisMap = KC3SortieManager.getCurrentMapData(),
			eventMapGauge = KC3Meta.eventGauge(KC3SortieManager.getSortieMap().join(''), thisMap.gaugeNum || 1),
			isInvalidBoss = eventMapGauge && Array.isArray(eventMapGauge.boss) &&
				eventMapGauge.boss.indexOf(this.id) === -1;
		return !isInvalidBoss;
	};

	KC3Node.prototype.isEventMapBoss = function(){
		if(!this.isBoss()) return false;
		const thisMap = KC3SortieManager.getCurrentMapData(),
			eventMapGauges = KC3Meta.eventGauge(KC3SortieManager.getSortieMap().join('')),
			finalGaugeKey = Object.keys(eventMapGauges).pop(),
			finalGauge = eventMapGauges[finalGaugeKey],
			isInvalidBoss = finalGauge && Array.isArray(finalGauge.boss) && !finalGauge.boss.includes(this.id);
		return !isInvalidBoss;
	};

	KC3Node.prototype.isMvpPredictionCapable = function(){
		// Rule unknown: ship nearest to flagship does not get MVP when same damage dealt
		const battleRank = this.predictedRankNight || this.predictedRank;
		if(!ConfigManager.info_btrank || battleRank === "D" || battleRank === "E"){
			return false;
		}
		// Should no air battle and not combined fleet for now
		// But there was battle node starts from night to day in game history
		if(this.startsFromNight){
			return true;
		}
		const [bombingDamage, planeFrom] = this.getAirBattleDamageInvolved();
		this.totalAirBombingDamage = bombingDamage;
		// No air bombing damage, just go ahead
		if(this.totalAirBombingDamage === 0){
			return true;
		}
		// Damages and losses of all kinds of aerial combat are too black-boxed to be predicted,
		// but if total damage dealt in air battle is smaller than MVP ship dealt, it's safe.
		const mvpPosition = this.predictedMvps[0] - 1;
		var mvpShipDamageDealt = this.predictedFleetsDay.playerMain[mvpPosition].damageDealt;
		if(this.predictedFleetsNight && mvpPosition === this.predictedMvpsNight[0] - 1){
			mvpShipDamageDealt += this.predictedFleetsNight.playerMain[this.predictedMvpsNight[0] - 1].damageDealt;
		}
		return undefined === this.predictedFleetsDay.playerMain
			.map(ship => ship.damageDealt)
			.find((damage, idx) => {
			// Skip ship which predicted MVP and no bomber equipped
			if(mvpPosition !== idx && planeFrom.indexOf(idx + 1) > -1
				&& damage + this.totalAirBombingDamage > mvpShipDamageDealt){
				return true;
			}
		});
	};

	/**
	 * Unexpected damage checker that checks damage instances from BP module.
	 * @see http://kancolle.wikia.com/wiki/Combat/Damage_Calculation
	 * @param predictedFleet - playerMain/playerEscort array from BP fleets export
	 * @param fleetnum - player fleet index
	 * @param formation - player formation id
	 * @param engagement - engagement id
	 * @param isRealBattle - indicate node data is from real sortie battle or DB history
	 * @return {array} with element {Object} that has attributes:
	 *   * enemy: Enemy formation, id, equips, stats and health before attack
	 *   * ship: Player formation, position, id, equips, stats, improvements, proficiency, combined fleet type, current health and ammo
	 *   * damageInstance: Actual damage, expected damage range and critical
	 *   * isUnexpected: Boolean to check if damage is in expected or unexpected range
	 */
	KC3Node.prototype.unexpectedDamagePrediction = function(predictedFleet, fleetnum, formation, engagement,
		isRealBattle = true) {
		const unexpectedList = [];
		let sunkenShips = 0;
		let shipCount = PlayerManager.fleets[fleetnum].ships.filter(id => id > 0).length;
		let shipsOnSortie = [];
		if (this.playerCombined) {
			shipsOnSortie = [0, 1].map(fleetId => PlayerManager.fleets[fleetId].ship().map(ship => ship.masterId));
		} else {
			shipsOnSortie = [PlayerManager.fleets[fleetnum].ship().map(ship => ship.masterId)];
		}
		predictedFleet.forEach(({ attacks }, position) => {
			let ship = PlayerManager.fleets[fleetnum].ship(position);

			// SHIP SIMULATION FOR SORTIE HISTORY
			if (!isRealBattle && KC3Node.debugPrediction() && this.nodeData.id) {
				position = position + sunkenShips;
				shipCount = this.nodeData["fleet" + (fleetnum + 1)].length;
				let shipData = this.nodeData["fleet" + (fleetnum + 1)][position];
				while(this.sunken && this.sunken[this.playerCombined ? fleetnum : 0].includes(shipData.mst_id)) {
					sunkenShips++;
					position = position + sunkenShips;
					shipData = this.nodeData["fleet" + (fleetnum + 1)][position];
				}
				const shipMaster = KC3Master.ship(shipData.mst_id);
				ship = new KC3Ship();
				ship.shipData = shipData;
				ship.rosterId = 1;
				ship.masterId = shipData.mst_id;
				ship.slots = this.fleetStates && this.fleetStates.length ?
					this.fleetStates[this.playerCombined ? fleetnum : 0].slots[position] :
					shipMaster.api_maxeq;
				ship.equipment = function(slot){
					switch(typeof slot) {
						case 'number':
						case 'string':
							// assume last element in this.shipData.equip is ex item
							return slot < 0 || slot >= this.shipData.equip.length ?
								this.equipment(true)[this.shipData.equip.length - 1] :
								this.equipment(true)[slot];
						case 'boolean':
							// create and cache KC3Gear array based on this.shipData.equip
							this.gearData = this.gearData ||
								this.shipData.equip.map((masterId, idx) => new KC3Gear({
									api_id: masterId > 0 ? idx + 1 : 0, // placeholder for rosterId
									api_slotitem_id: masterId > 0 ? masterId : 0,
									api_level: this.shipData.stars[idx] > 0 ? this.shipData.stars[idx] : 0,
									api_alv: this.shipData.ace[idx] > 0 ? this.shipData.ace[idx] : undefined,
									api_locked: 1 // assume all gear locked
								}));
							return slot ? this.gearData : this.gearData.slice(0, -1);
						case 'undefined':
							return this.equipment(false);
						case 'function':
							const equipObjs = this.equipment();
							equipObjs.forEach((item, index) => {
								slot.call(this, item.itemId, index, item);
							});
							// forEach always return undefined, return equipment for chain use
							return equipObjs;
					}
				};
				ship.onFleet = function() {
					return fleetnum + 1;
				};
				ship.nakedAsw = function() {
					return this.as[0];
				};

				ship.fp[0] = shipMaster.api_houg[0] + (shipData.kyouka[0] || 0) + ship.equipmentTotalStats("houg");
				ship.tp[0] = shipMaster.api_raig[0] + (shipData.kyouka[1] || 0) + ship.equipmentTotalStats("raig");
				ship.as[0] = shipData.stats.as;
				ship.hp[1] = this.maxHPs.ally[this.playerCombined && fleetnum === 1 ? position + 6 : position];
				ship.mod = shipData.kyouka;

				if (ship.as[0] === undefined){
					const aswBound = WhoCallsTheFleetDb.getStatBound(shipData.mst_id, 'asw');
					ship.as[0] = WhoCallsTheFleetDb.estimateStat(aswBound, shipData.level);
				}

				if(this.fleetStates && this.fleetStates.length) {
					ship.ammo = this.fleetStates[this.playerCombined ? fleetnum : 0].ammo[position];
				} else {
					// Make a rough guess of current ammo percentage remaining with event node consumption
					let ammoPercent = 100,
						reachedNode = false;
					// Ignore maelstrom/whirlpool for now
					this.nodeData.nodes.forEach(node => {
						if (this.id === node.id) { reachedNode = true; }
						if (reachedNode) { return; }
						// Cannot tell submarine node from node list?
						// Normal battle, yasen/day
						if (node.eventId === 4) { ammoPercent -= (node.eventKind === 2 || node.eventKind === 3) ? 10 : 20; }
						// Boss node
						if (node.eventId === 5) { ammoPercent -= 20; }
						// Aerial battle
						if (node.eventId === 7 && node.eventKind === 4 ) { ammoPercent -= 20; }
						// Aerial raid
						if (node.eventId === 10 ) { ammoPercent -= 4;}
					});
					ship.ammo = shipMaster.api_bull_max * ammoPercent / 100;
					ship.ammo = ship.ammo > 0 ? ship.ammo : 0;
				}
			}

			if (!attacks || !attacks.length) { return; }
			if (ship.isDummy()) { return; }
			attacks.forEach(attack => {
				// BATTLE CONDITIONS
				const damage = attack.damage,
					cutin = attack.cutin >= 0 ? attack.cutin : attack.ncutin,
					acc = attack.acc,
					hp = attack.hp,
					ciequip = attack.equip,
					time = attack.cutin >= 0 ? 'Day' : 'Night',
					phase = attack.phase;

				if (phase !== "hougeki") { return; }

				// ENEMY STATS
				const combinedFleetIndexAlign = 6;
				const isAgainstEnemyEscort = this.enemyCombined &&
					this.activatedEnemyFleet !== undefined && this.activatedEnemyFleet !== 1,
					targetIndex = attack.target[0] - (isAgainstEnemyEscort ? combinedFleetIndexAlign : 0);
				// Enemy arrays will be only 6 elements if abyssal escort fleet activated on night battle
				let target = this.eships[targetIndex],
					enemyShip = KC3Master.ship(target);

				// Simulate an enemy ship to obtain armor stats from equipment,
				// if uses actual ship master ID and methods in KC3Gear, armor bonuses from equipment could be counted for PvP,
				// but if don't want to consume memory to simulate KC3Ship and KC3Gear instances, just use:
				const getEquipTotalArmor = gearArr => gearArr.reduce((armor, mstId) => (
					armor + (mstId > 0 ? KC3Master.slotitem(mstId).api_souk || 0 : 0)
				), 0);
				let eShipEquipArmor = getEquipTotalArmor(this.eSlot[targetIndex] || []);
				/*
				const eShip = new KC3Ship();
				eShip.rosterId = 1;
				eShip.masterId = target;
				eShip.items = this.eSlot[targetIndex];
				// eSlot contains gear master IDs, have to simulate the KC3Gear converter too
				eShip.equipment = function(slot) {
					// only implement the method to return all gears for equipmentTotalStats
					this.gearData = this.gearData ||
						this.items.map((masterId, idx) => new KC3Gear({
							api_id: masterId > 0 ? idx + 1 : 0,
							api_slotitem_id: masterId > 0 ? masterId : 0,
							// no info about enemy equipment's stars and ace
							api_level: 0,
							api_locked: 0
						}));
					// there is no ex item in eSlot, so add a dummy one
					return slot ? this.gearData.concat(new KC3Gear()) : this.gearData;
				};
				let eShipEquipArmor = eShip.equipmentTotalStats("souk");
				*/

				let { isSubmarine, isLand } = ship.estimateTargetShipType(target);
				let nightSpecialAttackType, daySpecialAttackType;
				// PLAYER SPECIAL ATTACKS
				/*
				 * CVCI/CVNCI/SS LateModel cut-ins have varying damage modifier, but for now just take the highest one and see if actual exceeds it
				 * Technically possible to guess exact cut-in from api_si_list (included per attack)
				 * Since multiple cutins are possible per ship, reassignment to match cutin number from estimation is required
				 */
				if (time === "Night") {
					const possibleAttackTypes = ship.estimateNightAttackType(target, true, false);
					nightSpecialAttackType = possibleAttackTypes.find(t => t[0] === "Cutin" && t[1] === cutin);
					if (!nightSpecialAttackType) {
						// Fail-safe to default known sp attack
						nightSpecialAttackType = KC3Ship.specialAttackTypeNight(cutin);
					}
					daySpecialAttackType = [];
					// CVNCI modifier correction for cutin type by equip setup
					if (cutin === 6) {
						if (ciequip.length === 2) { nightSpecialAttackType[3] = 1.2; }
						else {
							let nightFighterCnt = 0, nightTorpedoBomberCnt = 0;
							ciequip.forEach(slotitem => {
								const master = KC3Master.slotitem(slotitem);
								if (!master) { return; }
								if (master.api_type[3] === 45) { nightFighterCnt++; }
								if (master.api_type[3] === 46) { nightTorpedoBomberCnt++; }
							});
							if (nightFighterCnt === 2 && nightTorpedoBomberCnt === 1) { nightSpecialAttackType[3] = 1.25; }
							else { nightSpecialAttackType[3] = 1.18; }
						}
					}
				} else {
					const possibleAttackTypes = ship.estimateDayAttackType(target, true, 1, false);
					daySpecialAttackType = possibleAttackTypes.find(t => t[0] === "Cutin" && t[1] === cutin);
					if (!daySpecialAttackType) {
						// Fail-safe to default known artillery spotting attack
						daySpecialAttackType = KC3Ship.specialAttackTypeDay(cutin);
					}
					// CVCI modifier correction for cutin type by equip setup
					if (cutin === 7) {
						if (ciequip.length === 2) { daySpecialAttackType[3] = 1.15; }
						else {
							let torpedoBomberCnt = 0, diveBomberCnt = 0;
							ciequip.forEach(slotitem => {
								const master = KC3Master.slotitem(slotitem);
								if (!master) { return; }
								if (master.api_type[2] === 7) { diveBomberCnt++; }
								if (master.api_type[2] === 8) { torpedoBomberCnt++; }
							});
							if (torpedoBomberCnt === 1 && diveBomberCnt === 2) { daySpecialAttackType[3] = 1.2; }
						}
					}
				}
				
				const combinedFleetType = this.playerCombined ? this.playerCombinedType || PlayerManager.combinedFleet : 0;
				const warfareType = !isSubmarine ? 'Shelling' : 'Antisub',
					powerBonus = ship.combinedFleetPowerBonus(combinedFleetType, this.enemyCombined, warfareType),
					combinedFleetFactor = !this.playerCombined ? powerBonus.main : fleetnum === 0 ? powerBonus.main : powerBonus.escort,
					damageStatus = ['taiha', 'chuuha', 'shouha', 'normal'].find((_, idx) => (idx + 1) / 4 >= hp / ship.hp[1]);

				let eHp = attack.ehp || this.maxHPs.enemy[targetIndex];
				const unexpectedFlag = isLand || KC3Meta.isEventWorld(KC3SortieManager.map_world) || KC3Node.debugPrediction();
				// To fix unexpected damage from Touch-like special cutins, modifier in arrary[3] should be recalculated according ship position in fleet
				// For sortie histoy ship simulation, this not work since fleets in PlayerManager are not simulated yet
				const updateSpecialCutinModifierIfNecessary = (spAtkTypeArr) => {
					if (Array.isArray(spAtkTypeArr) && !!spAtkTypeArr[3]) {
						const spcutinId = spAtkTypeArr[1];
						const spcutinInfo = KC3Ship.specialAttackExtendInfo(spcutinId);
						if (spcutinInfo && spcutinInfo.modFunc) {
							// assumed `position` is the right cutin position index in fleet
							if (spcutinInfo.posIndex.includes(position))
								spAtkTypeArr[3] = ship[spcutinInfo.modFunc](position, spcutinId);
						}
					}
				};
				updateSpecialCutinModifierIfNecessary(nightSpecialAttackType);
				updateSpecialCutinModifierIfNecessary(daySpecialAttackType);

				// Simulating each attack
				for (let i = 0; i < damage.length; i++) {
					const result = {};
					// Remove Flagship protection flag
					damage[i] = Math.floor(damage[i]);
					// Skip unused values in CVNCI array of [x, -1, -1]
					if (damage[i] === -1) { break; }

					// Also ignore scratch damage or miss
					const scratchDamage = eHp * 0.06 + (eHp - 1) * 0.08;
					if ((unexpectedFlag || damage[i] > scratchDamage) && acc[i] > 0) {

						const damageInstance = {};
						const isNightContacted = KC3Gear.isNightContactAircraft(this.fcontactId);
						const isCritical = acc[i] === 2;
						let unexpectedDamage = false,
							newDepthChargeBonus = 0,
							remainingAmmoModifier = 1,
							armor = ((this.eParam[targetIndex] || [])[3] || 0) + eShipEquipArmor;

						let power = time === 'Day'
							? ship.shellingFirePower(combinedFleetFactor, isLand)
							: ship.nightBattlePower(this.fcontactId) - (isLand ? ship.tp[0] : 0);
						if (warfareType === 'Antisub') { power = ship.antiSubWarfarePower(); }
						if (time === 'Night' && ship.canCarrierNightAirAttack()) {
							power = ship.nightAirAttackPower(this.fcontactId, isLand);
						}
						const shellingPower = power;

						({power} = ship.applyPrecapModifiers(power, warfareType, engagement, formation,
							nightSpecialAttackType, this.isNightStart, this.playerCombined, target, damageStatus));
						const precapPower = power;
						({power} = ship.applyPowerCap(power, time, warfareType));

						// To fix proficiency critical modifier from OASW air attacks, get OASW phase `openingTaisen` value from BP instead of always `hougeki`?
						const isOasw = false;
						// Simplify aerial attack check to just carrier check, unlikely that need to check for edge cases like Hayasui/old CV night attacks
						({power, newDepthChargeBonus, remainingAmmoModifier} = ship.applyPostcapModifiers(power, warfareType,
							daySpecialAttackType, 0, isCritical, ship.isCarrier(), enemyShip.api_stype, false, target, isOasw));
						const postcapPower = power;
						if (newDepthChargeBonus)
							armor = Math.max(1, armor - newDepthChargeBonus);

						const maxDam = Math.floor((power - Math.max(0, armor) * 0.7) * remainingAmmoModifier);
						const minDam = Math.floor((power - Math.max(0, armor) * 0.7 - Math.max(0, armor - 1) * 0.6) * remainingAmmoModifier);
						if (damage[i] > maxDam) {
							unexpectedDamage = damage[i] > scratchDamage;
						}
						if (unexpectedDamage || unexpectedFlag) {
							// TsunDB formatting
							damageInstance.actualDamage = damage[i];
							damageInstance.isCritical = isCritical;
							damageInstance.expectedDamage = [minDam, maxDam];
							result.damageInstance = damageInstance;

							const hpPercent = Math.max(0, Math.qckInt('floor', hp / ship.hp[1], 3) * 100);
							result.ship = {
								id: ship.masterId,
								damageStatus: Math.ceil(hpPercent / 25),
								equip: ship.equipment(true).map(g => g.masterId || -1),
								improvements: ship.equipment(true).map(g => g.stars || -1),
								proficiency: ship.equipment(true).map(g => g.ace || -1),
								slots: ship.slots,
								stats: ship.nakedStats(),
								position: position,
								shipCount: shipCount,
								formation: formation,
								shipsOnSortie: shipsOnSortie,
								isMainFleet: !this.playerCombined ? null : fleetnum === 0,
								combinedFleet: combinedFleetType,
								rAmmoMod: remainingAmmoModifier,
								spAttackType: cutin,
								cutinEquips: ciequip,
								shellingPower: shellingPower,
								armorReduction: newDepthChargeBonus,
								precapPower: precapPower,
								postcapPower: postcapPower,
								time: time,
								isNightContacted: isNightContacted,
							};

							result.enemy = {
								id: target,
								equip: this.eSlot[targetIndex],
								formation: this.eformation,
								position: targetIndex,
								armor: armor,
								isMainFleet: !this.enemyCombined ? null : attack.target[i] < combinedFleetIndexAlign,
								hp: eHp,
							};

							result.isUnexpected = unexpectedDamage;
							result.landFlag = isLand;
							result.engagement = engagement;
							result.debuffed = !!this.debuffed;
							unexpectedList.push(result);
						}
					}
					// Updating eHp (if needed for multi-hit)
					eHp -= damage[i];
				}
			});
		});

		if (unexpectedList.length && KC3Node.debugPrediction()) {
			console.debug("Unexpected damage predicted", unexpectedList);
		}
		return unexpectedList;
	};

	KC3Node.prototype.buildUnexpectedDamageMessage = function(unexpectedList = this.unexpectedList){
		let tooltips = "";
		const getScratchDamage = eHp => (
			[0, 0].map((z, i) =>
				Math.max(z, Math.floor(eHp * 0.06 + (i === 1 ? (eHp - 1) * 0.08 : 0)))
			)
		);
		if(Array.isArray(unexpectedList)) {
			unexpectedList.forEach(a => {
				if(a.isUnexpected) {
					const shipMaster = KC3Master.ship(a.ship.id),
						attackerName = KC3Meta.shipName(shipMaster.api_name);
					const defenderMstId = a.enemy.id,
						defenderName = KC3Meta.abyssShipName(defenderMstId);
					const dmg = a.damageInstance;
					const expectedDamage = dmg.expectedDamage;
					const scratchDamage = getScratchDamage(a.enemy.hp);
					const displayedDamage = expectedDamage[1] <= 0 ? scratchDamage :
						expectedDamage[0] <= 0 ? [
							Math.min(1, scratchDamage[0]),
							expectedDamage[1]
						] : expectedDamage;
					if(tooltips) tooltips += "\n";
					tooltips += KC3Meta.term("BattleUnexpectedDamageTip").format(
						attackerName, defenderName, defenderMstId,
						dmg.actualDamage, displayedDamage[0], displayedDamage[1]
					);
				}
			});
		}
		return tooltips;
	};
	
	KC3Node.prototype.saveEnemyEncounterInfo = function(battleData, updatedName, baseExp, isAirBaseRaid){
		// Update name and base exp only if new name offered
		if(!battleData && !!updatedName){
			if(!!this.enemyEncounter.uniqid){
				this.enemyEncounter.name = updatedName;
				if(baseExp > 0){ this.enemyEncounter.exp = baseExp; }
				KC3Database.Encounter(this.enemyEncounter, false);
				return true;
			}
			return false;
		}
		
		// Validate map values
		if(KC3SortieManager.map_world < 1){ return false; }
		if(KC3SortieManager.map_num < 1){ return false; }
		
		// Save the enemy encounter
		const ed = {
			world: KC3SortieManager.map_world,
			map: KC3SortieManager.map_num,
			diff: KC3SortieManager.map_difficulty,
			clear: KC3SortieManager.getCurrentMapData().clear,
			node: isAirBaseRaid ? KC3Meta.getAirBaseFakeEdge() : this.id,
			form: this.eformation,
			// eships is padded array
			ke: JSON.stringify(this.eships)
		};
		ed.uniqid = [ed.world,ed.map,ed.diff,ed.node,ed.form,ed.ke].filter(v => !!v).join("/");
		KC3Database.Encounter(ed, true, true);
		// Do not continue to save abyssal stats, thank to missing `api_eParam` on Land-Base Air Raid
		if(!!isAirBaseRaid) { return true; }
		this.enemyEncounter = ed;
		// Save enemy info, maybe main fleet
		(this.eshipsMain || this.eships).forEach((enemyId, i) => {
			if (KC3Master.isAbyssalShip(enemyId)) {
				const edata = {
					id: enemyId,
					hp: battleData.api_e_maxhps[i],
					fp: battleData.api_eParam[i][0],
					tp: battleData.api_eParam[i][1],
					aa: battleData.api_eParam[i][2],
					ar: battleData.api_eParam[i][3]
				};
				battleData.api_eSlot[i].forEach((eqId, eidx) => {
					if (eidx < 4 || eqId > 0) edata["eq" + (eidx+1)] = eqId;
				});
				KC3Database.Enemy(edata);
			}
		});
		// Save combined enemy escort info
		if(Array.isArray(this.eshipsEscort)) {
			this.eshipsEscort.forEach((enemyId, i) => {
				if (KC3Master.isAbyssalShip(enemyId)) {
					const edata = {
						id: enemyId,
						hp: battleData.api_e_maxhps_combined[i],
						fp: battleData.api_eParam_combined[i][0],
						tp: battleData.api_eParam_combined[i][1],
						aa: battleData.api_eParam_combined[i][2],
						ar: battleData.api_eParam_combined[i][3]
					};
					battleData.api_eSlot_combined[i].forEach((eqId, eidx) => {
						if (eidx < 4 || eqId > 0) edata["eq" + (eidx+1)] = eqId;
					});
					KC3Database.Enemy(edata);
				}
			});
		}
		return true;
	};
	
	KC3Node.prototype.saveBattleOnDB = function( resultData ){
		// Ignore if not saving to DB is demanded
		if(ConfigManager.isNotToSaveSortie(...KC3SortieManager.getSortieMap())){
			return;
		}
		const b = this.buildBattleDBData(resultData);
		console.log("Saving battle", b);
		KC3Database.Battle(b);
	};
	
	KC3Node.prototype.buildBattleDBData = function( resultData = {} ) {
		const b = {
			// TODO ref to the uniq key of sortie table which is not the auto-increment ID
			// foreign key to sortie
			sortie_id: (this.sortie || KC3SortieManager.getSortieId()),
			node: this.id,
			// foreign key to encounters
			//enemyId: (this.enemyEncounter.uniqid || ""),
			enemyId: 0, // 0 as placeholder. Because unused for now, encounter uniqid is too long
			data: (this.battleDay || {}),
			yasen: (this.battleNight || {}),
			rating: this.rating,
			drop: this.drop,
			time: this.stime,
			baseEXP: this.nodalXP,
			hqEXP: resultData.api_get_exp || 0,
			shizunde: this.lostShips ? this.lostShips.map(function(fleetLost){
				return fleetLost.map(function(shipSunk){
					return KC3ShipManager.get(shipSunk).masterId;
				});
			}) : [],
			mvp: this.mvps,
			// Save fleet current states (fuel, ammo, slots, etc) at the start of the battle
			fleetStates: KC3SortieManager.getBattleFleetStates()
		};
		// Optional properties
		// Air raid moved to proper place `sortie.nodes`, no longer here
		//if(this.battleDestruction){ b.airRaid = this.battleDestruction; }
		if(this.isBoss()){ b.boss = true; }
		// optional drop item (useitem & slotitem), not added into DB index yet
		if(this.dropUseitem > 0){ b.useitem = this.dropUseitem; }
		if(this.dropSlotitem > 0){ b.slotitem = this.dropSlotitem; }
		// btw, event map clearing award items not saved yet, see `api_get_eventitem`
		return b;
	};
	
	KC3Node.prototype.savePvPOnDB = function( resultData ){
		// Ignore if not saving to DB is demanded
		if(!ConfigManager.idbSavePvP) { return; }
		var p = {
			fleet: PlayerManager.fleets[KC3SortieManager.fleetSent - 1].sortieJson(),
			// Unused, included in following data
			enemy: [],
			data: (this.battleDay || {}),
			yasen: (this.battleNight || {}),
			rating: this.rating,
			baseEXP: this.nodalXP,
			// ID bound to PvP win count + 1, related to ledger type
			sortie_name: KC3SortieManager.sortieName(2),
			mvp: this.mvps,
			time: KC3SortieManager.sortieTime
		};
		console.log("Saving PvP battle", p, "fake SortieManager", KC3SortieManager);
		KC3Database.PvP(p);
	};
	
})();
