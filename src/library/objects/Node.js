/* Node.js
KC3改 Node Object

Represents a single battle on a node
Used by SortieManager
*/
(function(){
	"use strict";
	
	window.KC3Node = function(sortie_id, id, UTCTime){
		this.sortie = (sortie_id || 0);
		this.id = (id || 0);
		this.type = "";
		this.stime = UTCTime;
		this.isPvP = false;
	};

	/**
	// Return predicted battle rank letter. Static function.
	// @param beginHPs, endHPs in following structure:
	//   { ally: [array of hps],
	//     enemy: [array of hps]
	//   }
	//   arrays are all begins at 0.
	// @param battleName - optional, the API call name invoked currently
	*/
	KC3Node.predictRank = function(beginHPs, endHPs, battleName) {
		console.assert( 
			beginHPs.ally.length === endHPs.ally.length,
			"Ally data length mismatched");
		console.assert(
			beginHPs.enemy.length === endHPs.enemy.length,
			"Enemy data length mismatched");

		// Removes "-1"s in begin HPs
		// also removes data from same position
		// in end HPs
		// in addition, negative end HP values are set to 0
		function normalizeHP(begins, ends) {
			var nBegins = [];
			var nEnds = [];
			for (var i=0; i<begins.length; ++i) {
				if (begins[i] !== -1) {
					console.assert(
						begins[i] > 0,
						"Wrong begin HP");
					nBegins.push(begins[i]);
					nEnds.push( ends[i]<0 ? 0 : ends[i] );
				}
			}
			return [nBegins,nEnds];
		}

		// perform normalization
		var result1, result2;
		result1 = normalizeHP(beginHPs.ally, endHPs.ally);
		result2 = normalizeHP(beginHPs.enemy, endHPs.enemy);

		// create new objs leaving old data intact
		beginHPs = {
			ally: result1[0],
			enemy: result2[0]
		};

		endHPs = {
			ally:  result1[1],
			enemy: result2[1]
		};

		var allySunkCount = endHPs.ally.filter(function(x){return x===0;}).length;
		var allyCount = endHPs.ally.length;
		var enemySunkCount = endHPs.enemy.filter(function(x){return x===0;}).length;
		var enemyCount = endHPs.enemy.length;

		var requiredSunk = enemyCount === 1 ? 1 : Math.floor( enemyCount * 0.7);
		
		var i;
		// damage taken by ally
		var allyGauge = 0;
		var allyBeginHP = 0;
		for (i=0; i<allyCount; ++i) {
			allyGauge += beginHPs.ally[i] - endHPs.ally[i];
			allyBeginHP += beginHPs.ally[i];
		}
		var enemyGauge = 0;
		var enemyBeginHP = 0;
		for (i=0; i<enemyCount; ++i) {
			enemyGauge += beginHPs.enemy[i] - endHPs.enemy[i];
			enemyBeginHP += beginHPs.enemy[i];
		}

		// Related comments:
		// - https://github.com/KC3Kai/KC3Kai/issues/728#issuecomment-139681987
		// - https://github.com/KC3Kai/KC3Kai/issues/1766#issuecomment-275883784
		// - https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/kcmemo.md#%E6%88%A6%E9%97%98%E5%8B%9D%E5%88%A9%E5%88%A4%E5%AE%9A
		// The flooring behavior is intended and important.
		// Please do not change it unless it's proved to be more accurate than
		// the formula referred to by the comments above.
		var allyGaugeRate = Math.floor(allyGauge / allyBeginHP * 100);
		var enemyGaugeRate = Math.floor(enemyGauge / enemyBeginHP * 100);
		var equalOrMore = enemyGaugeRate > (0.9 * allyGaugeRate);
		var superior = enemyGaugeRate > 0 && enemyGaugeRate > (2.5 * allyGaugeRate);

		console.log("Predicted HP gauge rate",
			"-{0}/{1} = {2}%".format(allyGauge, allyBeginHP, allyGaugeRate),
			"vs",
			"{2}% = -{0}/{1}".format(enemyGauge, enemyBeginHP, enemyGaugeRate),
			"enemy -{1}, A needs {2}/{0} ".format(enemyCount, enemySunkCount, requiredSunk)
		);

		// For long distance air raid
		if ( (battleName||"").indexOf("ld_airbattle") >-1 ) {
			// Based on long distance air raid rules from:
			// https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/kcmemo.md#%E9%95%B7%E8%B7%9D%E9%9B%A2%E7%A9%BA%E8%A5%B2%E6%88%A6%E3%81%A7%E3%81%AE%E5%8B%9D%E5%88%A9%E5%88%A4%E5%AE%9A
			// Also referenced:
			// - http://kancolle.wikia.com/wiki/Events/Mechanics (as of 2017-01-28)
			// - http://nga.178.com/read.php?tid=8989155
			return (allyGauge === 0) ? "SS"
				: (allyGaugeRate < 10) ? "A"
				: (allyGaugeRate < 20) ? "B"
				: (allyGaugeRate < 50) ? "C"
				: (allyGaugeRate < 80) ? "D"
				: /* otherwise */ "E";
		}

		if (allySunkCount === 0) {
			if (enemySunkCount === enemyCount) {
				return allyGauge === 0 ? "SS" : "S";
			}
			if (enemySunkCount >= requiredSunk)
				return "A";

			if (endHPs.enemy[0] === 0)
				return "B";
			
			if (superior)
				return "B";
		} else {
			if (enemySunkCount === enemyCount)
				return "B";
			if (endHPs.enemy[0] === 0 && allySunkCount < enemySunkCount)
				return "B";
						
			if (superior)
				return "B";

			if (endHPs.enemy[0] === 0)
				return "C";
		}

		if (enemyGauge > 0 && equalOrMore)
			return "C";
		if (allySunkCount > 0 && allyCount === 1)
			return "E";
		return "D";
	};
	
	KC3Node.prototype.defineAsBattle = function( nodeData ){
		this.type = "battle";
		this.startsFromNight = false;
		
		// If passed initial values
		if(typeof nodeData != "undefined"){
			
			// If passed raw data from compass
			//"api_event_id":4,"api_event_kind":1
			if(typeof nodeData.api_event_kind != "undefined"){
				this.eships = [];
				this.eventKind = nodeData.api_event_kind;
				this.eventId = nodeData.api_event_id;
				this.gaugeDamage = 0; // calculate this on result screen. make it fair :D
			}
			
			// If passed formatted enemy list from PVP
			if(typeof nodeData.pvp_opponents != "undefined"){
				this.eships = nodeData.pvp_opponents;
				this.gaugeDamage = -1;
			}
		}
		this.enemySunk = [false, false, false, false, false, false];
		this.enemyHP = [0,0,0,0,0,0];
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
		var
			self = this,
			maps = JSON.parse(localStorage.maps),
			ckey = ["m",KC3SortieManager.map_world,KC3SortieManager.map_num].join("");
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
		
		maps[ckey].clear |= (++maps[ckey].kills) >= KC3Meta.gauge(ckey.replace("m",""));
		localStorage.maps = JSON.stringify(maps);
		
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
		this.amount = Math.floor(KC3SortieManager.getSortieFleet().map(function(fleetId){
			return PlayerManager.fleets[fleetId].ship().map(function(ship){
				return ship.obtainTP();
			}).reduce(function(pre,cur){ return pre.add(cur); },KC3Meta.tpObtained());
		}).reduce(function(pre,cur){ return pre.add(cur); },KC3Meta.tpObtained())
		.value);
		
		return this;
	};
	
	KC3Node.prototype.defineAsDud = function( nodeData ){
		this.type = "";
		
		return this;
	};
	
	/* BATTLE FUNCTIONS
	---------------------------------------------*/
	KC3Node.prototype.engage = function( battleData, fleetSent ){
		this.battleDay = battleData;
		this.fleetSent = parseInt(fleetSent) || KC3SortieManager.fleetSent;
		//console.log("Raw battle data", battleData);
		
		var enemyships = battleData.api_ship_ke;
		if(enemyships[0]==-1){ enemyships.splice(0,1); }
		var isEnemyCombined = (typeof battleData.api_ship_ke_combined !== "undefined");
		this.enemyCombined = isEnemyCombined;
		
		var enemyEscortList = battleData.api_ship_ke_combined;
		if (typeof enemyEscortList != "undefined") {
			if(enemyEscortList[0]==-1){ enemyEscortList.splice(0,1); }
			enemyships = enemyships.concat(enemyEscortList);
		}
		
		this.eships = enemyships;
		// Reserved for combined enemy ships if eships re-assigned on night battle
		this.ecships = undefined;
		this.eformation = battleData.api_formation[1];
		
		this.elevels = battleData.api_ship_lv.slice(1);
		if(isEnemyCombined) {
			this.elevels = this.elevels.concat(battleData.api_ship_lv_combined.slice(1));
		}
		
		this.eParam = battleData.api_eParam;
		if (typeof battleData.api_eParam_combined != "undefined") {
			this.eParam = this.eParam.concat(battleData.api_eParam_combined);
		}
		
		this.eKyouka = battleData.api_eKyouka || [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
		
		this.eSlot = battleData.api_eSlot;
		if (typeof battleData.api_eSlot_combined != "undefined") {
			this.eSlot = this.eSlot.concat(battleData.api_eSlot_combined);
		}
		
		this.supportFlag = (battleData.api_support_flag>0);
		if(this.supportFlag){
			this.supportInfo = battleData.api_support_info;
			this.supportInfo.api_support_flag = battleData.api_support_flag;
		}
		this.yasenFlag = (battleData.api_midnight_flag>0);
		
		// max HP of enemy main fleet flagship (boss), keep this for later use
		// especially when enemy combined and active deck is not main fleet on night battle
		this.originalHPs = battleData.api_nowhps;
		this.enemyFlagshipHp = this.originalHPs[7];
		
		this.maxHPs = {
			ally: battleData.api_maxhps.slice(1,7),
			enemy: battleData.api_maxhps.slice(7,13)
		};
		
		if (typeof battleData.api_maxhps_combined != "undefined") {
			this.maxHPs.ally = this.maxHPs.ally.concat(battleData.api_maxhps_combined.slice(1,7));
			this.maxHPs.enemy = this.maxHPs.enemy.concat(battleData.api_maxhps_combined.slice(7,13));
		}
		
		var beginHPs = {
			ally: battleData.api_nowhps.slice(1,7),
			enemy: battleData.api_nowhps.slice(7,13)
		};
		
		if (typeof battleData.api_nowhps_combined != "undefined") {
			beginHPs.ally = beginHPs.ally.concat(battleData.api_nowhps_combined.slice(1,7));
			beginHPs.enemy = beginHPs.enemy.concat(battleData.api_nowhps_combined.slice(7,13));
		}
		
		this.dayBeginHPs = beginHPs;
		
		this.detection = KC3Meta.detection( battleData.api_search[0] );
		this.engagement = KC3Meta.engagement( battleData.api_formation[2] );
		
		// LBAS attack phase, including jet plane assault
		this.lbasFlag = typeof battleData.api_air_base_attack != "undefined";
		if(this.lbasFlag){
			// Array of engaged land bases
			this.airBaseAttack = battleData.api_air_base_attack;
			// No plane from, just injecting from far away air base :)
			this.airBaseJetInjection = battleData.api_air_base_injection;
			// Jet planes also consume steels each LBAS attack, the same with on carrier:
			// see Fleet.calcJetsSteelCost()
			if(!!this.airBaseJetInjection && !!this.airBaseJetInjection.api_stage1
				&& this.airBaseJetInjection.api_stage1.api_f_count > 0
				&& KC3SortieManager.onSortie > 0){
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
			planePhase  = battleData.api_kouku.api_stage1 || {
				api_touch_plane:[-1,-1],
				api_f_count    :0,
				api_f_lostcount:0,
				api_e_count    :0,
				api_e_lostcount:0,
			},
			attackPhase = battleData.api_kouku.api_stage2;
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
			
			// Bombine phase 2
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
				&& (KC3SortieManager.onSortie > 0 || KC3SortieManager.isPvP())){
				let consumedSteel = PlayerManager.fleets[this.fleetSent - 1]
					.calcJetsSteelCost(KC3SortieManager.sortieName(2));
				console.log("Jets consumed steel", consumedSteel);
			}
		}
		
		// Boss Debuffed
		this.debuffed = typeof battleData.api_boss_damaged != "undefined" ?
			(battleData.api_boss_damaged == 1) ? true : false
			: false;
		
		var i = 0;
		// Battle analysis only if on sortie or PvP, not applied to sortielogs
		if(KC3SortieManager.onSortie > 0 || KC3SortieManager.isPvP()){
			var PS = window.PS;
			var DA = PS["KanColle.DamageAnalysis.FFI"];
			var result = null;
			var fleet;
			var dameConCode;
			var shipNum;
			var ship;
			var fleetId = this.fleetSent - 1;
			var enemyMain, enemyEscort, mainFleet, escortFleet;
			
			// PLAYER SINGLE FLEET
			if ((typeof PlayerManager.combinedFleet === "undefined") || (PlayerManager.combinedFleet === 0) || fleetId>1){
				// single fleet: not combined, or sent fleet is not first fleet
				
				// Update our fleet
				fleet = PlayerManager.fleets[fleetId];
				// damecon ignored for PvP
				dameConCode = KC3SortieManager.isPvP()
					? [0,0,0,0,0,0]
					: fleet.getDameConCodes();
				
				var endHPs = {
					ally: beginHPs.ally.slice(),
					enemy: beginHPs.enemy.slice()
				};
				
				// ONLY ENEMY IS COMBINED
				if (isEnemyCombined) {
					this.ecships = this.eships;
					result = DA.analyzeAbyssalCTFBattleJS(dameConCode, battleData);
					console.log("Only enemy is combined", result);
					
					// Update enemy ships
					for (i = 7; i < 13; i++) {
						this.enemyHP[i-7] = result.enemyMain[i-7];
						endHPs.enemy[i-7] = result.enemyMain[i-7] ? result.enemyMain[i-7].hp : -1;
						this.enemySunk[i-7] = result.enemyMain[i-7] ? result.enemyMain[i-7].sunk : true;
					}
					for (i = 13; i < 19; i++) {
						this.enemyHP[i-7] = result.enemyEscort[i-13];
						endHPs.enemy[i-7] = result.enemyEscort[i-13] ? result.enemyEscort[i-13].hp : -1;
						this.enemySunk[i-7] = result.enemyEscort[i-13] ? result.enemyEscort[i-13].sunk : true;
					}
				
				// BOTH SINGLE FLEET
				} else {
					// regular day-battle
					result = DA.analyzeBattleJS(dameConCode, battleData);
					console.log("Both single fleet", result);
					
					// Update enemy ships
					for (i = 7; i < 13; i++) {
						this.enemyHP[i-7] = result.enemy[i-7];
						endHPs.enemy[i-7] = result.enemy[i-7] ? result.enemy[i-7].hp : -1;
						this.enemySunk[i-7] = result.enemy[i-7] ? result.enemy[i-7].sunk : true;
					}
				}
				
				// update player ships
				shipNum = fleet.countShips();
				for(i = 0; i < shipNum; i++) {
					ship = fleet.ship(i);
					ship.afterHp[0] = result.main[i].hp;
					this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
					ship.afterHp[1] = ship.hp[1];
					endHPs.ally[i] = result.main[i].hp;
					// Check if damecon consumed, if yes, get item consumed
					if (result.main[i].dameConConsumed){
						this.dameConConsumed[i] = ship.findDameCon();
					} else {
						this.dameConConsumed[i] = false;
					}
				}
				
				if(ConfigManager.info_btrank){
					this.predictedRank = KC3Node.predictRank( beginHPs, endHPs, battleData.api_name );
				}
				
			// PLAYER COMBINED FLEET
			} else {
				dameConCode = PlayerManager.fleets[0].getDameConCodes()
					 .concat( PlayerManager.fleets[1].getDameConCodes() );
				console.assert(dameConCode.length === 12, "dameConCode length should be 12 for combined fleets");
				
				// BOTH COMBINED FLEET
				if (isEnemyCombined) {
					this.ecships = this.eships;
					if (PlayerManager.combinedFleet === 1 || PlayerManager.combinedFleet === 3) {
						// Carrier Task Force or Transport Escort
						result = DA.analyzeBothCombinedCTFBattleJS(dameConCode,battleData);
						console.log("CTF both combined", result);
						
					} else if (PlayerManager.combinedFleet === 2) {
						// Surface Task Force
						result = DA.analyzeBothCombinedSTFBattleJS(dameConCode,battleData);
						console.log("STF both combined", result);
						
					} else {
						console.error("Unknown combined fleet code:", PlayerManager.combinedFleet);
					}
					
					// Update enemy
					for(i = 1; i <= 6; i++) {
						enemyMain = result.enemyMain[i-1];
						if (enemyMain !== null) {
							this.enemyHP[i-1] = enemyMain;
							this.enemySunk[i-1] = enemyMain.sunk;
						}
					}
					for(i = 1; i <= 6; i++) {
						enemyEscort = result.enemyEscort[i-1];
						if (enemyEscort !== null) {
							this.enemyHP[i+5] = enemyEscort;
							this.enemySunk[i+5] = enemyEscort.sunk;
						}
					}
					
					// Update main fleet
					fleet = PlayerManager.fleets[0];
					shipNum = fleet.countShips();
					mainFleet = result.allyMain;
					for(i = 0; i < shipNum; i++) {
						ship = fleet.ship(i);
						ship.afterHp[0] = mainFleet[i].hp;
						this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
						ship.afterHp[1] = ship.hp[1];
						// Check if damecon consumed, if yes, get item consumed
						if (mainFleet[i].dameConConsumed){
							this.dameConConsumed[i] = ship.findDameCon();
						} else {
							this.dameConConsumed[i] = false;
						}
					}
					
					// Update escort fleet
					fleet = PlayerManager.fleets[1];
					shipNum = fleet.countShips();
					escortFleet = result.allyEscort;
					for(i = 0; i < shipNum; i++) {
						ship = fleet.ship(i);
						ship.afterHp[0] = escortFleet[i].hp;
						this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
						ship.afterHp[1] = ship.hp[1];
						// Check if damecon consumed, if yes, get item consumed
						if (escortFleet[i].dameConConsumed){
							this.dameConConsumedEscort[i] = ship.findDameCon();
						} else {
							this.dameConConsumedEscort[i] = false;
						}
					}
					
				// ONLY PLAYER IS COMBINED
				} else {
					if (PlayerManager.combinedFleet === 1) {
						// Carrier Task Force
						result = DA.analyzeCTFBattleJS(dameConCode,battleData);
						console.log("CTF only player is combined", result);
						
					} else if (PlayerManager.combinedFleet === 2) {
						// Surface Task Force
						result = DA.analyzeSTFBattleJS(dameConCode,battleData);
						console.log("STF only player is combined", result);
						
					} else if (PlayerManager.combinedFleet === 3) {
						// Transport Escort
						result = DA.analyzeTECFBattleJS(dameConCode,battleData);
						console.log("TECF only player is combined", result);
						
					} else {
						console.error("Unknown combined fleet code:", PlayerManager.combinedFleet);
					}
					
					// Update enemy
					for(i = 1; i <= 6; i++) {
						enemyMain = result.enemy[i-1];
						if (enemyMain !== null) {
							this.enemyHP[i-1] = enemyMain;
							this.enemySunk[i-1] = enemyMain.sunk;
						}
					}
					
					// Update main fleet
					fleet = PlayerManager.fleets[0];
					shipNum = fleet.countShips();
					mainFleet = result.main;
					for(i = 0; i < shipNum; i++) {
						ship = fleet.ship(i);
						ship.afterHp[0] = mainFleet[i].hp;
						this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
						ship.afterHp[1] = ship.hp[1];
						// Check if damecon consumed, if yes, get item consumed
						if (mainFleet[i].dameConConsumed){
							this.dameConConsumed[i] = ship.findDameCon();
						} else {
							this.dameConConsumed[i] = false;
						}
					}
					
					// Update escort fleet
					fleet = PlayerManager.fleets[1];
					shipNum = fleet.countShips();
					escortFleet = result.escort;
					for(i = 0; i < shipNum; i++) {
						ship = fleet.ship(i);
						ship.afterHp[0] = escortFleet[i].hp;
						this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
						ship.afterHp[1] = ship.hp[1];
						// Check if damecon consumed, if yes, get item consumed
						if (escortFleet[i].dameConConsumed){
							this.dameConConsumedEscort[i] = ship.findDameCon();
						} else {
							this.dameConConsumedEscort[i] = false;
						}
					}
				}
				
			}
		}
		
		if(this.gaugeDamage > -1) {
			this.gaugeDamage = Math.min(this.enemyFlagshipHp, this.enemyFlagshipHp - this.enemyHP[0].hp);
			
			(function(sortieData){
				var maps = localStorage.getObject("maps"),
					desg = ['m', sortieData.map_world, sortieData.map_num].join('');
				if(this.isBoss()) {
					// Invoke on boss event callback
					if(sortieData.onSortie > 0 && sortieData.onBossAvailable) {
						sortieData.onBossAvailable(this);
					}
					// Save boss HP for future sortie
					if(maps[desg].kind === "gauge-hp") {
						maps[desg].baseHp = maps[desg].baseHp || this.enemyFlagshipHp;
						if(maps[desg].baseHp != this.enemyFlagshipHp) {
							console.info("Different boss HP detected:", maps[desg].baseHp + " -> " + this.enemyFlagshipHp);/*RemoveLogging:skip*/
							// If new HP lesser than old, should update it for Last Kill
							if(this.enemyFlagshipHp < maps[desg].baseHp) {
								maps[desg].baseHp = this.enemyFlagshipHp;
							}
						}
					}
					localStorage.setObject("maps", maps);
				}
			}).call(this, KC3SortieManager);
		}
		
		// Record encoutners only if on sortie
		if(KC3SortieManager.onSortie > 0) {
			this.saveEnemyEncounterInfo(this.battleDay);
			
			// Don't log at Strategy Room Maps/Events History
			console.log("Parsed battle node", this);
		}
	};
	
	KC3Node.prototype.engageNight = function( nightData, fleetSent, setAsOriginalHP = true ){
		this.battleNight = nightData;
		this.fleetSent = fleetSent || this.fleetSent || KC3SortieManager.fleetSent;
		this.startsFromNight = !!fleetSent;
		//console.debug("Raw night battle data", nightData);
		
		var enemyships = nightData.api_ship_ke;
		if(enemyships[0]==-1){ enemyships.splice(0,1); }
		var isEnemyCombined = (typeof nightData.api_ship_ke_combined !== "undefined");
		this.enemyCombined = isEnemyCombined;
		// activated one fleet for combined night battle: 1 = main, 2 = escort
		if(isEnemyCombined){
			this.activatedFriendFleet = nightData.api_active_deck[0];
			this.activatedEnemyFleet = nightData.api_active_deck[1];
		}
		
		this.eships = enemyships;
		this.elevels = nightData.api_ship_lv.slice(1);
		this.eformation = this.eformation || (nightData.api_formation || [])[1];
		this.eParam = nightData.api_eParam;
		this.eKyouka = nightData.api_eKyouka || [-1,-1,-1,-1,-1,-1];
		this.eSlot = nightData.api_eSlot;
		
		this.maxHPs = {
			ally: nightData.api_maxhps.slice(1,7),
			enemy: nightData.api_maxhps.slice(7,13)
		};
		
		if (typeof nightData.api_maxhps_combined != "undefined") {
			this.maxHPs.ally = this.maxHPs.ally.concat(nightData.api_maxhps_combined.slice(1,7));
			this.maxHPs.enemy = this.maxHPs.enemy.concat(nightData.api_maxhps_combined.slice(7,13));
		}
		
		// if we did not started at night, at this point dayBeginHPs should be available
		var beginHPs = {
			ally: [],
			enemy: []
		};
		
		if (this.dayBeginHPs) {
			beginHPs = this.dayBeginHPs;
		} else {
			beginHPs.ally = nightData.api_nowhps.slice(1,7);
			beginHPs.enemy = nightData.api_nowhps.slice(7,13);
		}
		
		if(setAsOriginalHP){
			this.originalHPs = nightData.api_nowhps;
			if(this.startsFromNight) { this.enemyFlagshipHp = this.originalHPs[7]; }
		}
		
		this.engagement = this.engagement || KC3Meta.engagement( nightData.api_formation[2] );
		this.fcontactId = nightData.api_touch_plane[0]; // masterId of slotitem, starts from 1
		this.fcontact = this.fcontactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		this.econtactId = nightData.api_touch_plane[1];
		this.econtact = this.econtactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		this.flarePos = nightData.api_flare_pos[0]; // Star shell user pos 1-6
		this.eFlarePos = nightData.api_flare_pos[1]; // PvP opponent only, abyss star shell not existed yet
		
		// Battle analysis only if on sortie or PvP, not applied to sortielogs
		if(KC3SortieManager.onSortie > 0 || KC3SortieManager.isPvP()){
			var PS = window.PS;
			var DA = PS["KanColle.DamageAnalysis.FFI"];
			var result = null;
			var i = 0;
			var fleet;
			var dameConCode;
			var shipNum;
			var ship;
			var fleetId = this.fleetSent - 1;
			
			var endHPs = {
				ally: beginHPs.ally.slice(),
				enemy: beginHPs.enemy.slice()
			};
			
			// PLAYER COMBINED FLEET
			if (PlayerManager.combinedFleet && fleetId < 1) {
				// player combined fleet yasen, escort always fleet #2
				fleet = PlayerManager.fleets[1];
				dameConCode = fleet.getDameConCodes();
				
				// BOTH COMBINED FLEET
				if (isEnemyCombined) {
					// still needs 12-element array for dameConCode
					if (dameConCode.length < 7) {
						dameConCode = dameConCode.concat([0,0,0,0,0,0]);
					}
					console.log("Fleet dameConCode", dameConCode);
					result = DA.analyzeBothCombinedNightBattleJS(dameConCode, nightData); 
					console.log("Player combined", "enemy combined", result);
					
					// enemy info, enemy main fleet in yasen
					if (this.activatedEnemyFleet == 1) {
						console.log("Enemy main fleet in yasen", result.enemyMain);
						for (i = 0; i < 6; i++) {
							this.enemyHP[i] = result.enemyMain[i];
							endHPs.enemy[i] = result.enemyMain[i] ? result.enemyMain[i].hp : -1;
							this.enemySunk[i] = result.enemyMain[i] ? result.enemyMain[i].sunk : true;
						}
						
					// enemy info, enemy escort fleet in yasen
					} else {
						console.log("Enemy escort fleet in yasen", result.enemyEscort);
						enemyships = nightData.api_ship_ke_combined;
						if(enemyships[0]==-1){ enemyships.splice(0,1); }
						this.eships = enemyships;
						this.elevels = nightData.api_ship_lv_combined.slice(1);
						this.eParam = nightData.api_eParam_combined;
						this.eSlot = nightData.api_eSlot_combined;
						this.maxHPs.enemy = nightData.api_maxhps_combined.slice(7,13);
						for (i = 0; i < 6; i++) {
							this.enemyHP[i] = result.enemyEscort[i];
							endHPs.enemy[i] = result.enemyEscort[i] ? result.enemyEscort[i].hp : -1;
							this.enemySunk[i] = result.enemyEscort[i] ? result.enemyEscort[i].sunk : true;
						}
					}
					
					// player fleet
					shipNum = fleet.countShips();
					for(i = 0; i < shipNum; i++) {
						ship = fleet.ship(i);
						ship.hp = [ship.afterHp[0], ship.afterHp[1]];
						ship.morale = Math.max(0,Math.min(100,ship.morale + (this.startsFromNight ? 1 : -3 )));
						ship.afterHp[0] = result.allyEscort[i].hp;
						this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
						ship.afterHp[1] = ship.hp[1];
						endHPs.ally[i] = result.allyEscort[i].hp;
					}
					
					
				// ONLY PLAYER IS COMBINED
				} else {
					// only player is combined fleet
					result = DA.analyzeCombinedNightBattleJS(dameConCode, nightData); 
					console.log("Player combined", "enemy single", result);
					
					// update enemy info
					for (i = 0; i < 6; i++) {
						this.enemyHP[i] = result.enemy[i];
						endHPs.enemy[i] = result.enemy[i] ? result.enemy[i].hp : -1;
						this.enemySunk[i] = result.enemy[i] ? result.enemy[i].sunk : true;
					}
					
					// player fleet
					shipNum = fleet.countShips();
					for(i = 0; i < shipNum; i++) {
						ship = fleet.ship(i);
						ship.hp = [ship.afterHp[0], ship.afterHp[1]];
						ship.morale = Math.max(0,Math.min(100,ship.morale + (this.startsFromNight ? 1 : -3 )));
						ship.afterHp[0] = result.main[i].hp;
						this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
						ship.afterHp[1] = ship.hp[1];
						endHPs.ally[i] = result.main[i].hp;
					}
				}
				
			// PLAYER SINGLE FLEET
			} else {
				fleet = PlayerManager.fleets[fleetId];
				// damecon ignored for PvP
				dameConCode = KC3SortieManager.isPvP() ? [0,0,0, 0,0,0] : fleet.getDameConCodes();
				
				// ONLY ENEMY IS COMBINED
				if (isEnemyCombined) {
					// enemy combined fleet
					result = DA.analyzeAbyssalCTFNightBattleJS(dameConCode, nightData);
					console.log("Player single", "enemy combined", result);
					
					// enemy info, enemy main fleet in yasen
					if (this.activatedEnemyFleet == 1) {
						console.log("Enemy main fleet in yasen", result.enemyMain);
						for (i = 0; i < 6; i++) {
							this.enemyHP[i] = result.enemyMain[i];
							endHPs.enemy[i] = result.enemyMain[i] ? result.enemyMain[i].hp : -1;
							this.enemySunk[i] = result.enemyMain[i] ? result.enemyMain[i].sunk : true;
						}
						
					// enemy info, enemy escort fleet in yasen
					} else {
						console.log("Enemy escort fleet in yasen", result.enemyEscort);
						enemyships = nightData.api_ship_ke_combined;
						if(enemyships[0]==-1){ enemyships.splice(0,1); }
						this.eships = enemyships;
						this.elevels = nightData.api_ship_lv_combined.slice(1);
						this.eParam = nightData.api_eParam_combined;
						this.eSlot = nightData.api_eSlot_combined;
						this.maxHPs.enemy = nightData.api_maxhps_combined.slice(7,13);
						for (i = 0; i < 6; i++) {
							this.enemyHP[i] = result.enemyEscort[i];
							endHPs.enemy[i] = result.enemyEscort[i] ? result.enemyEscort[i].hp : -1;
							this.enemySunk[i] = result.enemyEscort[i] ? result.enemyEscort[i].sunk : true;
						}
					}
					
				// BOTH SINGLE FLEET
				} else {
					// regular yasen
					result = DA.analyzeNightBattleJS(dameConCode, nightData);
					console.log("Player single", "enemy single", result);
					
					// regular yasen enemy info
					for (i = 0; i < 6; i++) {
						this.enemyHP[i] = result.enemy[i];
						endHPs.enemy[i] = result.enemy[i] ? result.enemy[i].hp : -1;
						this.enemySunk[i] = result.enemy[i] ? result.enemy[i].sunk : true;
					}
				}
				
				// regular yasen fleet info
				shipNum = fleet.countShips();
				for(i = 0; i < shipNum; i++) {
					ship = fleet.ship(i);
					ship.hp = [ship.afterHp[0], ship.afterHp[1]];
					ship.morale = Math.max(0,Math.min(100,ship.morale + (this.startsFromNight ? 1 : -3 )));
					ship.afterHp[0] = result.main[i].hp;
					this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
					ship.afterHp[1] = ship.hp[1];
					endHPs.ally[i] = result.main[i].hp;
				}
			}
			
			console.log("Predicted enemyHP & Sunk", this.enemyHP, this.enemySunk);
			
			// both single fleet predictable only for now
			if(ConfigManager.info_btrank &&
				!isEnemyCombined && (!PlayerManager.combinedFleet || fleetId > 0)){
				this.predictedRankNight = KC3Node.predictRank( beginHPs, endHPs, nightData.api_name );
			}
		}
		
		if(this.gaugeDamage > -1
			&& (!isEnemyCombined || this.activatedEnemyFleet == 1) ){
			let bossCurrentHp = nightData.api_nowhps[7];
			this.gaugeDamage += Math.min(bossCurrentHp, bossCurrentHp - this.enemyHP[0].hp);
		}
		
		// Record encoutners only if on sortie and starts from night
		if(this.startsFromNight && KC3SortieManager.onSortie > 0) {
			this.saveEnemyEncounterInfo(this.battleNight);
		}
		// Don't log at Strategy Room Maps/Events History
		if(KC3SortieManager.onSortie > 0) {
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
				var maps = localStorage.getObject("maps"),
					ckey = ['m', KC3SortieManager.map_world, KC3SortieManager.map_num].join(''),
					stat = maps[ckey].stat,
					srid = KC3SortieManager.onSortie;
				/* DESPAIR STATISTICS ==> */
				if(stat) {
					let fs = [this.gaugeDamage, this.enemyFlagshipHp],
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
				switch(maps[ckey].kind) {
					case 'single':   /* Single Victory */
						break;
					case 'multiple': /* Kill-based */
						if((KC3Meta.gauge(ckey.replace("m","")) - (maps[ckey].kills || 0)) > 0)
							maps[ckey].kills += resultData.api_destsf;
						break;
					case 'gauge-hp': /* HP-Gauge */
						if((this.gaugeDamage >= 0) && (maps[ckey].curhp || 0) > 0) {
							maps[ckey].curhp -= this.gaugeDamage;
							if(maps[ckey].curhp <= 0) // if last kill -- check whether flagship is killed or not -- flagship killed = map clear
								maps[ckey].curhp = 1-(maps[ckey].clear = resultData.api_destsf);
						}
						break;
					case 'gauge-tp': /* TP-Gauge */
						/* TP Gauge */
						if (typeof resultData.api_landing_hp != "undefined") {
							var TPdata = resultData.api_landing_hp;
							this.gaugeDamage = Math.min(TPdata.api_now_hp,TPdata.api_sub_value);
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
				
				/* ==> FLAGSHIP ATTACKING */
				
				localStorage.setObject('maps',maps);
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
			
			var eshipCnt = (this.ecships || []).length || 6;
			var sunkApCnt = 0;
			for(var i = 0; i < eshipCnt; i++) {
				if (this.enemySunk[i]) {
					let shipId = (this.ecships || this.eships)[i];
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
			if(KC3SortieManager.onSortie > 0 && !!name){
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
	
	/**
	 * Builds a complex long message for results of Exped/LBAS support attack,
	 * Used as a tooltip by devtools panel or SRoom Maps History for now.
	 * return a empty string if no any support triggered.
	 */
	KC3Node.prototype.buildSupportAttackMessage = function(){
		var thisNode = this;
		var supportTips = "";
		if(thisNode.supportFlag && !!thisNode.supportInfo){
			var fleetId = "", supportDamage = 0;
			var attackType = thisNode.supportInfo.api_support_flag;
			if(attackType === 1){
				var airatack = thisNode.supportInfo.api_support_airatack;
				fleetId = airatack.api_deck_id;
				supportDamage = !airatack.api_stage3 ? 0 :
					Math.floor(airatack.api_stage3.api_edam.slice(1).reduce(function(a,b){return a+b;},0));
				// Support air attack has the same structure with kouku/LBAS
				// So disp_seiku, plane xxx_count are also possible to be displayed
				// Should break BattleSupportTips into another type for air attack
			} else if([2,3].indexOf(attackType) > -1){
				var hourai = thisNode.supportInfo.api_support_hourai;
				fleetId = hourai.api_deck_id;
				supportDamage = !hourai.api_damage ? 0 :
					Math.floor(hourai.api_damage.slice(1).reduce(function(a,b){return a+b;},0));
			}
			supportTips = KC3Meta.term("BattleSupportTips").format(fleetId, KC3Meta.support(attackType), supportDamage);
		}
		var lbasTips = "";
		if(thisNode.lbasFlag && !!thisNode.airBaseAttack){
			if(!!thisNode.airBaseJetInjection){
				var jet = thisNode.airBaseJetInjection;
				var jetStage2 = jet.api_stage2 || {};
				var jetPlanes = jet.api_stage1.api_f_count;
				var jetShotdown = jet.api_stage1.api_e_lostcount + (jetStage2.api_e_lostcount || 0);
				var jetDamage = !jet.api_stage3 ? 0 :
					Math.floor(jet.api_stage3.api_edam.slice(1).reduce(function(a,b){return a+b;},0));
				jetDamage += !jet.api_stage3_combined ? 0 :
					Math.floor(jet.api_stage3_combined.api_edam.slice(1).reduce(function(a,b){return a+b;},0));
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
				var damage = !ab.api_stage3 ? 0 :
					Math.floor(ab.api_stage3.api_edam.slice(1).reduce(function(a,b){return a+b;},0));
				damage += !ab.api_stage3_combined ? 0 :
					Math.floor(ab.api_stage3_combined.api_edam.slice(1).reduce(function(a,b){return a+b;},0));
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
			thisNode.antiAirFire.forEach(function(fire){
				if(!!fire){
					var fireShipPos = fire.api_idx; // starts from 0
					// fireShipPos = [0,5]: in normal fleet or main fleet
					// fireShipPos = [6,11]: in escort fleet
					if(fireShipPos >= 0 && fireShipPos < 12){
						var sentFleet = PlayerManager.fleets[fireShipPos >= 6 ? 1 : KC3SortieManager.fleetSent-1];
						var shipName = KC3ShipManager.get(sentFleet.ships[fireShipPos % 6]).name();
						aaciTips += (!!aaciTips ? "\n" : "") + shipName;
						var aaciType = AntiAir.AACITable[fire.api_kind];
						if(!!aaciType){
							aaciTips += "\n[{0}] +{1} (x{2})"
								.format(aaciType.id, aaciType.fixed, aaciType.modifier);
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
		var apTuple = KC3SortieManager.enemyFighterPower(this.eships, this.eSlot);
		// Air Power: AI<1/3, 1/3<=AD<2/3, 2/3<=AP<3/2, 3/2<=AS<3, 3<=AS+
		// No i18n yet as it's for researchers
		var ap = apTuple[0];
		if(!!ap){
			tooltip += "\nPOW: {0} (AI< {1}< AD< {2}< AP< {3}< AS< {4}< AS+)"
				.format(ap, Math.floor(ap / 3), Math.floor(2 * ap / 3),
					Math.floor(3 * ap / 2), 3 * ap);
		}
		var enemyTotalPlanes = this.planeFighters.abyssal[0];
		if(!!enemyTotalPlanes){
			tooltip += "\nFTG: {0} /{1}".format(apTuple[1], enemyTotalPlanes);
			// 'total - AA Fighter - No AA (Bomber)' may be unknown slot or shot down by support
			tooltip += " (AA0: {0}, UFO: {1})"
				.format(apTuple[2], enemyTotalPlanes - apTuple[1] - apTuple[2]);
		}
		if(Object.keys(apTuple[3]).length > 0){
			tooltip += "\nERR: " + JSON.stringify(apTuple[3]);
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
		// Exped Aerial Support
		if(this.battleDay.api_support_info && this.battleDay.api_support_info.api_support_airatack)
			fillAirBattleData("Exped Support", this.battleDay.api_support_info.api_support_airatack).appendTo(tooltip);
		return tooltip.html();
	};

	/**
	 * Not real battle on this node in fact. Enemy raid just randomly occurs before entering node.
	 * See: http://kancolle.wikia.com/wiki/Land-Base_Aerial_Support#Enemy_Raid
	 */
	KC3Node.prototype.airBaseRaid = function( battleData ){
		this.battleDestruction = battleData;
		//console.debug("Raw Air Base Raid data", battleData);
		this.lostKind = battleData.api_lost_kind;
		this.eships = battleData.api_ship_ke.slice(1);
		this.eformation = battleData.api_formation[1];
		this.elevels = battleData.api_ship_lv.slice(1);
		this.eSlot = battleData.api_eSlot;
		this.engagement = KC3Meta.engagement(battleData.api_formation[2]);
		this.maxHPs = {
			ally: battleData.api_maxhps.slice(1,7),
			enemy: battleData.api_maxhps.slice(7,13)
		};
		this.beginHPs = {
			ally: battleData.api_nowhps.slice(1,7),
			enemy: battleData.api_nowhps.slice(7,13)
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
		this.baseDamage = bomberPhase && bomberPhase.api_fdam ? Math.floor(
			bomberPhase.api_fdam.slice(1).reduce(function(a,b){return a+b;},0)
		) : 0;
	};
	
	KC3Node.prototype.isBoss = function(){
		// Normal BOSS node starts from day battle
		return (this.eventKind === 1 && this.eventId === 5)
		// Combined BOSS node, see advanceNode()@SortieManager.js
			|| (this.eventKind === 5 && this.eventId === 5);
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
		var ed = {
			world: KC3SortieManager.map_world,
			map: KC3SortieManager.map_num,
			diff: KC3SortieManager.map_difficulty,
			node: this.id,
			form: this.eformation,
			ke: JSON.stringify(this.eships)
		};
		ed.uniqid = [ed.world,ed.map,ed.diff,ed.node,ed.form,ed.ke]
			.filter(function(v){return !!v;}).join("/");
		KC3Database.Encounter(ed, true);
		this.enemyEncounter = ed;
		var i, enemyId;
		// Save enemy info
		for(i = 0; i < 6; i++) {
			enemyId = this.eships[i] || -1;
			// Only record ships for abyssal
			if (KC3Master.isAbyssalShip(enemyId)) {
				KC3Database.Enemy({
					id: enemyId,
					hp: battleData.api_maxhps[i+7],
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
		}
		// Save combined enemy info
		if(this.eships.length > 6) {
			for(i = 6; i < 13; i++) {
				enemyId = this.eships[i] || -1;
				if (KC3Master.isAbyssalShip(enemyId)) {
					KC3Database.Enemy({
						id: enemyId,
						hp: battleData.api_maxhps_combined[i+1],
						fp: battleData.api_eParam_combined[i-6][0],
						tp: battleData.api_eParam_combined[i-6][1],
						aa: battleData.api_eParam_combined[i-6][2],
						ar: battleData.api_eParam_combined[i-6][3],
						eq1: battleData.api_eSlot_combined[i-6][0],
						eq2: battleData.api_eSlot_combined[i-6][1],
						eq3: battleData.api_eSlot_combined[i-6][2],
						eq4: battleData.api_eSlot_combined[i-6][3]
					});
				}
			}
		}
		return true;
	};
	
	KC3Node.prototype.saveBattleOnDB = function( resultData ){
		var b = {
			// TODO ref to the uniq key of sortie table which is not the auto-increment ID
			// foreign key to sortie
			sortie_id: (this.sortie || KC3SortieManager.onSortie || 0),
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
		if(this.battleDestruction){ b.airRaid = this.battleDestruction; }
		if(this.isBoss()){ b.boss = true; }
		console.log("Saving battle", b);
		KC3Database.Battle(b);
	};
	
	KC3Node.prototype.savePvPOnDB = function( resultData ){
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
