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
	KC3Node.knownNodeExtraClasses = function(){
		return [
			"nc_night_battle", "nc_air_battle",
			"nc_enemy_combined", "nc_air_raid",
			"nc_night_to_day"
		];
	};
	
	KC3Node.prototype.isInitialized = function(){
		return !!this.stime;
	};
	
	KC3Node.prototype.defineAsBattle = function( nodeData ){
		this.type = "battle";
		this.startsFromNight = false;
		
		// If passed initial values
		if(typeof nodeData != "undefined"){
			
			// If passed raw data from compass,
			// about api_event_id and api_event_kind, see SortieManager.js#L237
			if(typeof nodeData.api_event_kind != "undefined"){
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
					KC3Meta.term("BattleKindNightToDay")][this.eventKind];
				this.nodeExtraClass = ["", "",
					"nc_night_battle", "nc_night_battle",
					"nc_air_battle", "nc_enemy_combined", "nc_air_raid",
					"nc_night_to_day"
					][this.eventKind];
			}
			
			// If passed formatted enemy list from PVP
			if(typeof nodeData.pvp_opponents != "undefined"){
				this.eships = nodeData.pvp_opponents;
				this.gaugeDamage = -1;
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
		var self = this;
		this.type = "resource";
		this.item = [];
		this.icon = [];
		this.amount = [];
		if (typeof nodeData.api_itemget == "object" && typeof nodeData.api_itemget.api_id != "undefined") {
			nodeData.api_itemget = [nodeData.api_itemget];
		}
		this.nodeDesc = this.buildItemNodeDesc( nodeData.api_itemget );
		nodeData.api_itemget.forEach(function(itemget){
			var icon_id = itemget.api_icon_id;
			var getcount = itemget.api_getcount;
			self.item.push(icon_id);
			self.icon.push(function(folder){
				return folder+(
					["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass","","box1","box2","box3"]
					[icon_id - 1]
				)+".png";
			});
			self.amount.push(getcount);
			if(icon_id < 8)
				KC3SortieManager.materialGain[icon_id-1] += getcount;
		});
		return this;
	};
	
	KC3Node.prototype.defineAsBounty = function( nodeData ){
		var self = this,
			mapKey = KC3SortieManager.getSortieMap().join(''),
			currentMap = KC3SortieManager.getCurrentMapData();
		this.type = "bounty";
		this.item = nodeData.api_itemget_eo_comment.api_id;
		this.icon = function(folder){
			return folder+(
				["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass"]
				[self.item-1]
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
		
		// Bq3: Sortie 2 BBV/AO to [W1-6], reach node N twice
		if(KC3SortieManager.isSortieAt(1, 6)
			&& KC3QuestManager.isPrerequisiteFulfilled(861)){
			KC3QuestManager.get(861).increment();
		}
		return this;
	};
	
	KC3Node.prototype.defineAsMaelstrom = function( nodeData ){
		this.type = "maelstrom";
		this.item = nodeData.api_happening.api_icon_id;
		this.icon = function(folder){
			return folder+(
				["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass"]
				[nodeData.api_happening.api_icon_id-1]
			)+".png";
		};
		this.nodeDesc = this.buildItemNodeDesc( [nodeData.api_happening] );
		this.amount = nodeData.api_happening.api_count;
		return this;
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
		
		return this;
	};
	
	// For compatibility, if there is still any property of Array starts with -1 element
	KC3Node.prototype.normalizeArrayIndex = function(array){
		// reuse function from prediction module
		return KC3BattlePrediction.normalizeArrayIndexing(array);
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
		this.eformation = (battleData.api_formation || [])[1] || this.eformation;
		// api_eKyouka seems being removed since 2017-11-17, kept for compatibility
		this.eKyouka = battleData.api_eKyouka || [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
		// might use api_f_maxhps_combined instead
		var isPlayerCombined = battleData.api_fParam_combined !== undefined;
		this.playerCombined = isPlayerCombined;
		
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
			this.flarePos = battleData.api_flare_pos[0];
			this.eFlarePos = battleData.api_flare_pos[1];
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
		var
			planePhase  = battleData.api_kouku && battleData.api_kouku.api_stage1 || {
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
		if(attackPhase !== null){
			this.planeBombers.player[0] = attackPhase.api_f_count;
			this.planeBombers.player[1] = attackPhase.api_f_lostcount;
			this.planeBombers.abyssal[0] = attackPhase.api_e_count;
			this.planeBombers.abyssal[1] = attackPhase.api_e_lostcount;
		}
		
		// Fighter phase 2
		if(typeof battleData.api_kouku2 != "undefined"){
			this.planeFighters.player[1] += battleData.api_kouku2.api_stage1.api_f_lostcount;
			this.planeFighters.abyssal[1] += battleData.api_kouku2.api_stage1.api_e_lostcount;
			
			// Bombing phase 2
			if(battleData.api_kouku2.api_stage2 !== null){
				this.planeBombers.player[1] += battleData.api_kouku2.api_stage2.api_f_lostcount;
				this.planeBombers.abyssal[1] += battleData.api_kouku2.api_stage2.api_e_lostcount;
				if(!!battleData.api_kouku2.api_stage2.api_air_fire){
					if(!this.antiAirFire || this.antiAirFire.length<1){
						this.antiAirFire = [null];
					}
					this.antiAirFire[1] = battleData.api_kouku2.api_stage2.api_air_fire;
				}
			}
		}
		
		// Jet plane phase, happen before fighter attack phase
		if(typeof battleData.api_injection_kouku != "undefined"){
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
		
		// Boss Debuffed
		this.debuffed = typeof battleData.api_boss_damaged != "undefined" ?
			(battleData.api_boss_damaged == 1) ? true : false
			: false;
		
		// Battle analysis only if on sortie or PvP, not applied to battle simulation, like sortielogs.
		const isRealBattle = KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP();
		if(isRealBattle || KC3Node.debugPrediction()){
			const fleetId = this.fleetSent - 1;
			// To work better on battle simulation, prefer to use `isPlayerCombined`,
			// which check via API data instead of determining 'current state' of PlayerManager
			//const isPlayerCombinedSent = fleetId === 0 && PlayerManager.combinedFleet > 0;

			// Find battle type
			const player = (() => {
				if (!isPlayerCombined) { return KC3BattlePrediction.Player.SINGLE; }

				switch (PlayerManager.combinedFleet) {
					case 1:
						return KC3BattlePrediction.Player.CTF;
					case 2:
						return KC3BattlePrediction.Player.STF;
					case 3:
						return KC3BattlePrediction.Player.TCF;
					default:
						throw new Error(`Unknown combined fleet code: ${PlayerManager.combinedFleet}`);
				}
			})();
			const enemy = isEnemyCombined ? KC3BattlePrediction.Enemy.COMBINED : KC3BattlePrediction.Enemy.SINGLE;
			const time = this.isNightToDay
				? KC3BattlePrediction.Time.NIGHT_TO_DAY
				: KC3BattlePrediction.Time.DAY;

			const dameConCode = (() => {
				if (KC3SortieManager.isPvP()) { return {}; }

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
				this.predictedRank = KC3BattlePrediction.predictRank(battleData.api_name, this.battleNight || battleData, this.predictedFleetsDay);
				if (KC3Node.debugPrediction()) {
					console.debug(`Node ${this.letter} predicted rank`, this.predictedRank, this.sortie);
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
					ship.morale = Math.max(0, Math.min(100, ship.morale + (ship.morale < 30 ? -9 : -3)));
					ship.afterHp[0] = hp;
					ship.afterHp[1] = ship.hp[1];
					this.dameConConsumed[position] = dameConConsumed ? ship.findDameCon() : false;
					if(Array.isArray(this.predictedMvps) && this.predictedMvps[0] > 0) {
						// string indicates prediction value
						ship.mvp = this.predictedMvps[0] === position + 1 ?
							(this.predictedMvpCapable ? "chosen" : "candidate") : false;
					}
				});
				result.fleets.playerEscort.forEach(({ hp, dameConConsumed }, position) => {
					const ship = PlayerManager.fleets[1].ship(position);
					ship.morale = Math.max(0, Math.min(100, ship.morale + (ship.morale < 30 ? -9 : -3)));
					ship.afterHp[0] = hp;
					ship.afterHp[1] = ship.hp[1];
					this.dameConConsumedEscort[position] = dameConConsumed ? ship.findDameCon() : false;
					if(Array.isArray(this.predictedMvps) && this.predictedMvps[1] > 0) {
						ship.mvp = this.predictedMvps[1] === position + 1 ?
							(this.predictedMvpCapable ? "chosen" : "candidate") : false;
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

		}
		
		if(this.gaugeDamage > -1) {
			this.gaugeDamage = Math.min(this.enemyFlagshipHp, this.enemyFlagshipHp - this.enemyHP[0].hp);
			
			(function(sortieData){
				if(this.isBoss()) {
					// Invoke on boss event callback
					if(sortieData.isOnSortie() && sortieData.onBossAvailable) {
						sortieData.onBossAvailable(this);
					}
					// Save boss HP for future sortie
					var thisMap = sortieData.getCurrentMapData();
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
		this.flarePos = nightData.api_flare_pos[0]; // Star shell user pos 1-6
		this.eFlarePos = nightData.api_flare_pos[1]; // PvP opponent only, abyss star shell not existed yet
		
		// Battle analysis only if on sortie or PvP, not applied to sortielogs
		const isRealBattle = KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP();
		if(isRealBattle || KC3Node.debugPrediction()){
			const fleetId = this.fleetSent - 1;

			// Find battle type
			const player = (() => {
				if (!isPlayerCombined) { return KC3BattlePrediction.Player.SINGLE; }

				switch (PlayerManager.combinedFleet) {
					case 0: case undefined:
						return KC3BattlePrediction.Player.SINGLE;
					case 1:
						return KC3BattlePrediction.Player.CTF;
					case 2:
						return KC3BattlePrediction.Player.STF;
					case 3:
						return KC3BattlePrediction.Player.TCF;
					default:
						throw new Error(`Unknown combined fleet code: ${PlayerManager.combinedFleet}`);
				}
			})();
			const enemy = isEnemyCombined ? KC3BattlePrediction.Enemy.COMBINED : KC3BattlePrediction.Enemy.SINGLE;
			const time = KC3BattlePrediction.Time.NIGHT;
			const dameConCode = (() => {
				if (KC3SortieManager.isPvP()) { return {}; }

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
				this.predictedRankNight = KC3BattlePrediction.predictRank(nightData.api_name, this.battleDay || nightData, this.predictedFleetsNight);
				if (KC3Node.debugPrediction()) {
					console.debug(`Node ${this.letter} predicted yasen rank`, this.predictedRankNight);
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
					ship.hp = [ship.afterHp[0], ship.afterHp[1]];
					ship.morale = Math.max(0, Math.min(100, ship.morale + (this.startsFromNight ? -2 : -2)));
					ship.afterHp[0] = hp;
					ship.afterHp[1] = ship.hp[1];
					if (isPlayerCombined) {
						this.dameConConsumedEscort[position] = dameConConsumed ? ship.findDameCon() : false;
					} else {
						this.dameConConsumed[position] = dameConConsumed ? ship.findDameCon() : false;
					}
					if(Array.isArray(this.predictedMvpsNight) &&
						this.predictedMvpsNight[isPlayerCombined ? 1 : 0] > 0) {
						ship.mvp = this.predictedMvpsNight[isPlayerCombined ? 1 : 0] === position + 1 ? 
							(this.predictedMvpCapable ? "chosen" : "candidate") : false;
					}
				});
			}

			const enemyResult = isAgainstEnemyEscort ? result.fleets.enemyEscort : result.fleets.enemyMain;
			enemyResult.forEach((ship, position) => {
				this.enemyHP[position] = ship;
				this.enemySunk[position] = ship.sunk;
			});

		}
		
		if(this.gaugeDamage > -1
			&& (!isEnemyCombined || this.activatedEnemyFleet == 1) ) {
			let bossCurrentHp = nightData.api_e_nowhps[0];
			this.gaugeDamage += Math.min(bossCurrentHp, bossCurrentHp - this.enemyHP[0].hp);
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
			
			if(this.isBoss()) {
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
					console.info("You've done this", oc, "time"+(oc != 1 ? 's' : '')+'.',
						"Good luck, see you next time!");
				}
				/* ==> DESPAIR STATISTICS */
				
				/* FLAGSHIP ATTACKING ==> */
				console.log("Damaged Flagship", this.gaugeDamage, "/", maps[ckey].curhp || 0, "pts");
				// also check if destroyed flagship is from main fleet (boss)
				const mainFlagshipKilled = (!this.activatedEnemyFleet || this.activatedEnemyFleet == 1) ?
					resultData.api_destsf : 0;
				switch(maps[ckey].kind) {
					case 'single':   /* Single Victory */
						break;
					case 'multiple': /* Kill-based */
						if((KC3Meta.gauge(ckey.replace("m","")) - (maps[ckey].kills || 0)) > 0)
							maps[ckey].kills += mainFlagshipKilled;
						break;
					case 'gauge-hp': /* HP-Gauge */
						if((this.gaugeDamage >= 0) && (maps[ckey].curhp || 0) > 0) {
							maps[ckey].curhp -= this.gaugeDamage;
							if(maps[ckey].curhp <= 0) // if last kill -- check whether flagship is killed or not -- flagship killed = map clear
								maps[ckey].curhp = 1 - (maps[ckey].clear = mainFlagshipKilled);
						}
						break;
					case 'gauge-tp': /* TP-Gauge */
						/* TP Gauge */
						if (typeof resultData.api_landing_hp != "undefined") {
							var TPdata = resultData.api_landing_hp;
							this.gaugeDamage = Math.min(TPdata.api_now_hp, TPdata.api_sub_value);
							maps[ckey].curhp = TPdata.api_now_hp - this.gaugeDamage;
							maps[ckey].maxhp = TPdata.api_max_hp - 0;
						} else {
							maps[ckey].curhp = 0;
						}
						console.log("Landing get",this.gaugeDamage,"->",maps[ckey].curhp,"/",maps[ckey].maxhp,"TP");
						break;
					default:         /* Undefined */
						break;
				}
				
				maps[ckey].clear |= resultData.api_first_clear; // obtaining clear once
				
				if(stat) {
					stat.onBoss.hpdat[srid] = [maps[ckey].curhp,maps[ckey].maxhp];
					if(resultData.api_first_clear)
						stat.onClear = srid; // retrieve sortie ID for first clear mark
				}
				
				KC3SortieManager.setAllMapData(maps);
			}
			
			var ship_get = [];
			
			if(typeof resultData.api_get_ship != "undefined"){
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
			
			if(typeof resultData.api_get_eventitem != "undefined"){
				(function(resultEventItems){
					console.log("Event items get", resultEventItems);
					(resultEventItems || []).forEach(function(eventItem){
						switch(eventItem.api_type){
							case 1: // Item
								if(eventItem.api_id.inside(1,4)) {
									KC3SortieManager.materialGain[eventItem.api_id+3] += eventItem.api_value;
								}
							break;
							case 2: // Ship
								ship_get.push(eventItem.api_id);
							break;
							case 3: // Equip
							break;
							default:
								console.info("Unknown item type", eventItem);/*RemoveLogging:skip*/
							break;
						}
					});
				}).call(this, resultData.api_get_eventitem);
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
				this.saveEnemyEncounterInfo(null, name);
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
	KC3Node.prototype.buildSupportAttackMessage = function(){
		var thisNode = this;
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
			if(!!supportTips && !!lbasTips) { supportTips += "\n"; }
		}
		return supportTips + lbasTips === "" ? "" : $("<p></p>")
			.css("font-size", "11px")
			.text(supportTips + lbasTips)
			.prop("outerHTML");
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
						aaciTips += (!!aaciTips ? "\n" : "") + shipName;
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
	KC3Node.prototype.buildAirPowerMessage = function(){
		var tooltip = this.airbattle[2] || "";
		const apTuple = KC3Calc.enemyFighterPower(this.eships, this.eSlot);
		// Air Power: AI<1/3, 1/3<=AD<2/3, 2/3<=AP<3/2, 3/2<=AS<3, 3<=AS+
		const ap = apTuple[0];
		if(!!ap){
			tooltip += "\n" + KC3Meta.term("InferredFighterPower")
				.format(ap, Math.round(ap / 3), Math.round(2 * ap / 3),
					Math.round(3 * ap / 2), 3 * ap);
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
			// also try to infer something from exped fleet aerial support
			let airSupportEnemyTotalPlanes = 0;
			if(Object.getSafePath(this.battleDay, "api_support_info.api_support_airatack.api_stage1")){
				airSupportEnemyTotalPlanes = this.battleDay.api_support_info.api_support_airatack.api_stage1.api_e_count;
			}
			if(airSupportEnemyTotalPlanes){
				tooltip += "\n" + KC3Meta.term("InferredSupportPlanes")
					.format(airSupportEnemyTotalPlanes,
						airSupportEnemyTotalPlanes - apTuple[1] - apTuple[2]);
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
				isPvP ? KC3Meta.shipName(shipMaster.api_name) : KC3Meta.abyssShipName(masterId));
			tooltip += "{0} Lv {1} HP {2}\n".format(
				KC3Meta.stype(shipMaster.api_stype),
				level || "?",
				!isCurrentHpShown ? maxHp || "?" :
					"{0} /{1}".format(currentHp === 0 || currentHp ? currentHp : "?", maxHp || "?")
			);
			if(Array.isArray(eParam)){
				tooltip += $("<img />").attr("src", "/assets/img/client/mod_fp.png")
					.css(iconStyles).prop("outerHTML");
				tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipFire"), eParam[0]);
				tooltip += $("<img />").attr("src", "/assets/img/client/mod_tp.png")
					.css(iconStyles).prop("outerHTML");
				tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipTorpedo"), eParam[1]);
				tooltip += $("<img />").attr("src", "/assets/img/client/mod_aa.png")
					.css(iconStyles).prop("outerHTML");
				tooltip += "{0}: {1}\n".format(KC3Meta.term("ShipAntiAir"), eParam[2]);
				tooltip += $("<img />").attr("src", "/assets/img/client/mod_ar.png")
					.css(iconStyles).prop("outerHTML");
				tooltip += "{0}: {1}".format(KC3Meta.term("ShipArmor"), eParam[3]);
			}
			if(Array.isArray(eSlot) && eSlot.length > 0){
				for(let slotIdx = 0; slotIdx < Math.min(eSlot.length, 5); slotIdx++){
					if(eSlot[slotIdx] > 0) {
						const gearMaster = KC3Master.slotitem(eSlot[slotIdx]);
						tooltip += "\n" + $("<img />")
							.attr("src","/assets/img/items/"+gearMaster.api_type[3]+".png")
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
		Build HTML tooltip for details of air battle losses
	*/
	KC3Node.prototype.buildAirBattleLossMessage = function(){
		var template = $('<table><tr><th class="type">&nbsp;</th><th>Friendly&nbsp;</th><th>Abyssal</th></tr>' +
			'<tr class="contact_row"><td>Contact</td><td class="ally_contact"></td><td class="enemy_contact"></td></tr>' +
			'<tr class="airbattle_row"><td>Result</td><td colspan="2" class="airbattle"></td></tr>' +
			'<tr><td>Stage1</td><td class="ally_fighter"></td><td class="enemy_fighter"></td></tr>' + 
			'<tr><td>Stage2</td><td class="ally_bomber"></td><td class="enemy_bomber"></td></tr></table>');
		var tooltip = $("<div></div>");
		var fillAirBattleData = function(typeName, koukuApiData){
			var table = template.clone();
			var stage1 = koukuApiData.api_stage1 || {
					api_f_count:0,api_f_lostcount:0,
					api_e_count:0,api_e_lostcount:0
				},
				stage2 = koukuApiData.api_stage2;
			table.css("font-size", "11px");
			$(".type", table).html(typeName + "&nbsp;");
			if(stage1.api_touch_plane){
				$(".ally_contact", table).text(stage1.api_touch_plane[0] <= 0 ? "No" : "[{0}]".format(stage1.api_touch_plane[0]));
				$(".enemy_contact", table).text(stage1.api_touch_plane[1] <= 0 ? "No" : "[{0}]".format(stage1.api_touch_plane[1]));
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
			} else {
				$(".ally_bomber", table).text("---");
				$(".enemy_bomber", table).text("---");
			}
			return table;
		};
		// Land-Base Jet Assault
		if(this.battleDay.api_air_base_injection)
			fillAirBattleData("LBAS Jets", this.battleDay.api_air_base_injection).appendTo(tooltip);
		// Carrier Jet Assault
		if(this.battleDay.api_injection_kouku)
			fillAirBattleData("Jet Assult", this.battleDay.api_injection_kouku).appendTo(tooltip);
		// Land-Base Aerial Support(s)
		if(this.battleDay.api_air_base_attack){
			$.each(this.battleDay.api_air_base_attack, function(i, lb){
				fillAirBattleData("LBAS #{0}".format(i + 1), lb).appendTo(tooltip);
			});
		}
		// Carrier Aerial Combat / (Long Distance) Aerial Raid
		if(this.battleDay.api_kouku)
			fillAirBattleData("Air Battle", this.battleDay.api_kouku).appendTo(tooltip);
		if(this.battleDay.api_kouku2)
			fillAirBattleData(" Wave #2 ", this.battleDay.api_kouku2).appendTo(tooltip);
		// Exped Aerial Support
		if(Object.getSafePath(this.battleDay, "api_support_info.api_support_airatack"))
			fillAirBattleData("Exped Air", this.battleDay.api_support_info.api_support_airatack).appendTo(tooltip);
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
			totalDamage += Math.floor(b.api_injection_kouku.api_stage3.api_edam.slice(1).reduce((a, v) => a + v, 0));
		}
		if(isSafeArray(b, "api_injection_kouku.api_stage3_combined.api_edam")){
			totalDamage += Math.floor(b.api_injection_kouku.api_stage3_combined.api_edam.slice(1).reduce((a, v) => a + v, 0));
		}
		if(isSafeArray(b, "api_injection_kouku.api_plane_from") && Array.isArray(b.api_injection_kouku.api_plane_from[0])){
			b.api_injection_kouku.api_plane_from[0].filter(idx => idx > -1).forEach(idx => { planeFromSet.add(idx); });
		}
		// regular air battle
		if(isSafeArray(b, "api_kouku.api_stage3.api_edam")){
			totalDamage += Math.floor(b.api_kouku.api_stage3.api_edam.slice(1).reduce((a, v) => a + v, 0));
		}
		if(isSafeArray(b, "api_kouku.api_stage3_combined.api_edam")){
			totalDamage += Math.floor(b.api_kouku.api_stage3_combined.api_edam.slice(1).reduce((a, v) => a + v, 0));
		}
		if(isSafeArray(b, "api_kouku.api_plane_from") && Array.isArray(b.api_kouku.api_plane_from[0])){
			b.api_kouku.api_plane_from[0].filter(idx => idx > -1).forEach(idx => { planeFromSet.add(idx); });
		}
		// 2nd wave for air battle only node, supposed to no combined
		if(isSafeArray(b, "api_kouku2.api_stage3_combined.api_edam")){
			totalDamage += Math.floor(b.api_kouku2.api_stage3_combined.api_edam.slice(1).reduce((a, v) => a + v, 0));
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
	KC3Node.prototype.airBaseRaid = function( battleData ){
		this.battleDestruction = battleData;
		//console.debug("Raw Air Base Raid data", battleData);
		this.lostKind = battleData.api_lost_kind;
		this.eships = this.normalizeArrayIndex(battleData.api_ship_ke);
		this.eformation = battleData.api_formation[1];
		this.elevels = this.normalizeArrayIndex(battleData.api_ship_lv);
		this.eSlot = battleData.api_eSlot;
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
			bomberPhase = battleData.api_air_base_attack.api_stage3;
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
		this.baseDamage = bomberPhase && bomberPhase.api_fdam
			? sumSupportDamageArray(bomberPhase.api_fdam)
			: 0;
	};
	
	KC3Node.prototype.isBoss = function(){
		// see advanceNode() (SortieManager.js) for api details
		return (
			// boss battle
			this.eventId === 5 &&
			// enemy single || enemy combined || night-to-day
			(this.eventKind === 1 || this.eventKind === 5 || this.eventKind === 7)
		);
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
	
	KC3Node.prototype.saveEnemyEncounterInfo = function(battleData, updatedName){
		// Update name only if new name offered
		if(!battleData && !!updatedName){
			if(!!this.enemyEncounter.uniqid){
				this.enemyEncounter.name = updatedName;
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
			node: this.id,
			form: this.eformation,
			// eships is padded array
			ke: JSON.stringify(this.eships)
		};
		ed.uniqid = [ed.world,ed.map,ed.diff,ed.node,ed.form,ed.ke].filter(v => !!v).join("/");
		KC3Database.Encounter(ed, true);
		this.enemyEncounter = ed;
		// Save enemy info, maybe main fleet
		(this.eshipsMain || this.eships).forEach((enemyId, i) => {
			if (KC3Master.isAbyssalShip(enemyId)) {
				KC3Database.Enemy({
					id: enemyId,
					hp: battleData.api_e_maxhps[i],
					fp: battleData.api_eParam[i][0],
					tp: battleData.api_eParam[i][1],
					aa: battleData.api_eParam[i][2],
					ar: battleData.api_eParam[i][3],
					eq1: battleData.api_eSlot[i][0],
					eq2: battleData.api_eSlot[i][1],
					eq3: battleData.api_eSlot[i][2],
					eq4: battleData.api_eSlot[i][3]
				});
			}
		});
		// Save combined enemy escort info
		if(Array.isArray(this.eshipsEscort)) {
			this.eshipsEscort.forEach((enemyId, i) => {
				if (KC3Master.isAbyssalShip(enemyId)) {
					KC3Database.Enemy({
						id: enemyId,
						hp: battleData.api_e_maxhps_combined[i],
						fp: battleData.api_eParam_combined[i][0],
						tp: battleData.api_eParam_combined[i][1],
						aa: battleData.api_eParam_combined[i][2],
						ar: battleData.api_eParam_combined[i][3],
						eq1: battleData.api_eSlot_combined[i][0],
						eq2: battleData.api_eSlot_combined[i][1],
						eq3: battleData.api_eSlot_combined[i][2],
						eq4: battleData.api_eSlot_combined[i][3]
					});
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
		var b = {
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
			shizunde: this.lostShips.map(function(fleetLost){
				return fleetLost.map(function(shipSunk){
					return KC3ShipManager.get(shipSunk).masterId;
				});
			}),
			mvp: this.mvps
		};
		// Optional properties
		// Air raid moved to proper place `sortie.nodes`, no longer here
		//if(this.battleDestruction){ b.airRaid = this.battleDestruction; }
		if(this.isBoss()){ b.boss = true; }
		console.log("Saving battle", b);
		KC3Database.Battle(b);
	};
	
	KC3Node.prototype.savePvPOnDB = function( resultData ){
		// Ignore if not saving to DB is demanded
		if(!ConfigManager.idbSavePvP) { return; }
		var p = {
			fleet: PlayerManager.fleets[KC3SortieManager.fleetSent-1].sortieJson(),
			enemy: [], // Unused
			data: (this.battleDay || {}),
			yasen: (this.battleNight || {}),
			rating: this.rating,
			baseEXP: this.nodalXP,
			mvp: this.mvps,
			time: KC3SortieManager.sortieTime
		};
		console.log("Saving PvP battle", p, "fake SortieManager", KC3SortieManager);
		KC3Database.PvP(p);
	};
	
})();
