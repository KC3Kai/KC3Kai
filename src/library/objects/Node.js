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

	// static function. predicts battle rank,
	// arguments are beginHPs, endHPs in following structure:
	// { ally: [array of hps]
	// , enemy: [array of hps]
	// }
	// arrays are all begins at 0
	KC3Node.predictRank = function(beginHPs, endHPs) {
		console.assert( 
			beginHPs.ally.length === endHPs.ally.length,
			"ally data length mismatched");
		console.assert(
			beginHPs.enemy.length === endHPs.enemy.length,
			"enemy data length mismatched");

		// removes "-1"s in begin HPs
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
						"wrong begin HP");
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

		var requiredSunk = enemyCount === 6 ? 4 : Math.ceil( enemyCount / 2);
		
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

		var allyGaugeRate = Math.floor(allyGauge / allyBeginHP * 100);
		var enemyGaugeRate = Math.floor(enemyGauge / enemyBeginHP * 100);
		var equalOrMore = enemyGaugeRate > (0.9 * allyGaugeRate);
		var superior = enemyGaugeRate > 0 && enemyGaugeRate > (2.5 * allyGaugeRate);

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
		this.startNight = false;
		
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
		return this;
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
		this.amount = nodeData.api_itemget_eo_comment.api_getcount;
		KC3SortieManager.materialGain[this.item-1] += this.amount;
		
		maps[ckey].clear |= (++maps[ckey].kills) >= KC3Meta.gauge(ckey.replace("m",""));
		localStorage.maps = JSON.stringify(maps);
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
		this.amount = nodeData.api_happening.api_count;
		return this;
	};
	
	KC3Node.prototype.defineAsSelector = function( nodeData ){
		console.log("defining as selector", nodeData);
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
		console.log("choices", this.choices);
		return this;
	};
	
	KC3Node.prototype.defineAsTransport = function( nodeData ){
		this.type = "transport";
		this.amount = Math.floor(KC3SortieManager.getSortieFleet().map(function(fleetId){
			return PlayerManager.fleets[fleetId].ship().map(function(ship){
				return ship.obtainTP();
			}).reduce(function(pre,cur){ return pre.add(cur); },KC3Meta.tpObtained());
		}).reduce(function(pre,cur){ return pre.add(cur); },KC3Meta.tpObtained()));
		
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
		
		var enemyships = battleData.api_ship_ke;
		if(enemyships[0]==-1){ enemyships.splice(0,1); }
		
		console.log("battleData", battleData);
		var enemyEscort = battleData.api_ship_ke_combined;
		if (typeof enemyEscort != "undefined") {
			if(enemyEscort[0]==-1){ enemyEscort.splice(0,1); }
			enemyships = enemyships.concat(enemyEscort);
		}
		
		this.eships = enemyships;
		this.eformation = battleData.api_formation[1];
		
		
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
		
		this.originalHPs = battleData.api_nowhps;
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
			var fleetId = parseInt(fleetSent) || KC3SortieManager.fleetSent;
			
			if ((typeof PlayerManager.combinedFleet === "undefined") || (PlayerManager.combinedFleet === 0) || fleetId>1){
				// single fleet: not combined, or sent fleet is not first fleet

				// Update our fleet
				fleet = PlayerManager.fleets[fleetId - 1];
				// damecon ignored for PvP
				dameConCode = KC3SortieManager.isPvP()
					? [0,0,0, 0,0,0]
					: fleet.getDameConCodes();
				
				var endHPs = {
					ally: beginHPs.ally.slice(),
					enemy: beginHPs.enemy.slice()
				};
				
				// enemy combined fleet
				if (this.eships.length > 7) {
					result = DA.analyzeAbyssalCTFBattleJS(dameConCode, battleData);
					
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
				} else {
					// regular day-battle
					result = DA.analyzeBattleJS(dameConCode, battleData);
					
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

				if(ConfigManager.info_btrank &&
					// long distance aerial battle not predictable for now, see #1333
					// but go for aerial battle (eventKind:4) possible Yasen
					[6].indexOf(this.eventKind)<0 ){
					this.predictedRank = KC3Node.predictRank( beginHPs, endHPs );
					// console.debug("Rank Predict:", this.predictedRank);
				}
			} else {
				// combined fleet
				dameConCode = PlayerManager.fleets[0].getDameConCodes()
					 .concat( PlayerManager.fleets[1].getDameConCodes() );
				console.assert(dameConCode.length === 12, "dameConCode length should be 12 for combined fleets");
				if (PlayerManager.combinedFleet === 1) {
					// Carrier Task Force
					result = DA.analyzeCTFBattleJS(dameConCode,battleData);
				} else if (PlayerManager.combinedFleet === 2) {
					// Surface Task Force
					result = DA.analyzeSTFBattleJS(dameConCode,battleData);
				} else if (PlayerManager.combinedFleet === 3) {
					// Transport Escort
					result = DA.analyzeTECFBattleJS(dameConCode,battleData);
				} else {
					console.error( "Unknown combined fleet code: " + PlayerManager.combinedFleet );
				}

				// Update enemy
				for(i = 1; i <= 6; i++) {
					var enemy = result.enemy[i-1];
					if (enemy !== null) {
						this.enemyHP[i-1] = enemy;
						this.enemySunk[i-1] = enemy.sunk;
					}
				}

				// Update main fleet
				fleet = PlayerManager.fleets[0];
				shipNum = fleet.countShips();
				var mainFleet = result.main;
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
				var escortFleet = result.escort;
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

		if(this.gaugeDamage > -1) {
			this.gaugeDamage = Math.min(this.originalHPs[7],this.originalHPs[7] - this.enemyHP[0].hp);
			
			(function(sortieData){
				var
					maps = localStorage.getObject('maps'),
					desg = ['m',sortieData.map_world,sortieData.map_num].join('');
				if(this.isBoss() && maps[desg].kind == 'gauge-hp') {
					maps[desg].baseHp = maps[desg].baseHp || this.originalHPs[7];
				}
				localStorage.setObject('maps',maps);
			}).call(this,KC3SortieManager);
		}
		
		// Record encoutners only if on sortie
		if(KC3SortieManager.onSortie > 0) {
			this.saveEnemyEncounterInfo(this.battleDay);
		}
	};
	
	KC3Node.prototype.engageNight = function( nightData, fleetSent, setAsOriginalHP ){
		if(typeof setAsOriginalHP == "undefined"){ setAsOriginalHP = true; }
		
		this.battleNight = nightData;
		this.startNight = (fleetSent !== undefined);
		
		var enemyships = nightData.api_ship_ke;
		if(enemyships[0]==-1){ enemyships.splice(0,1); }
		this.eships = enemyships;
		this.eformation = this.eformation || nightData.api_formation[1];
		this.eParam = nightData.api_eParam;
		this.eKyouka = nightData.api_eKyouka;
		this.eSlot = nightData.api_eSlot;
		
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
		}
		
		this.engagement = this.engagement || KC3Meta.engagement( nightData.api_formation[2] );
		this.fcontactId = nightData.api_touch_plane[0]; // masterId of slotitem, starts from 1
		this.fcontact = this.fcontactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		this.econtactId = nightData.api_touch_plane[1];
		this.econtact = this.econtactId > 0 ? KC3Meta.term("BattleContactYes") : KC3Meta.term("BattleContactNo");
		this.flarePos = nightData.api_flare_pos[0]; // Star shell user pos 1-6
		this.eFlarePos = nightData.api_flare_pos[1]; // PvP opponent only, abyss star shell not existed yet
		
		var PS = window.PS;
		var DA = PS["KanColle.DamageAnalysis.FFI"];
		var result = null;
		var i = 0;
		var fleet;
		var dameConCode;
		var shipNum;
		var ship;
		var fleetId = parseInt(fleetSent) || KC3SortieManager.fleetSent;
		
		// COMBINED FLEET
		if (PlayerManager.combinedFleet && (fleetId <= 1)) { 
			fleet = PlayerManager.fleets[1];
			dameConCode = fleet.getDameConCodes();
			result = DA.analyzeCombinedNightBattleJS(dameConCode, nightData); 
		// SINGLE FLEET
		} else { // single fleet: not combined, or sent fleet is not first fleet
			fleet = PlayerManager.fleets[fleetId - 1];
			// damecon ignored for PvP
			dameConCode = KC3SortieManager.isPvP() ? [0,0,0, 0,0,0] : fleet.getDameConCodes();
			// enemy combined fleet
			if (this.eships.length > 7) {
				result = DA.analyzeAbyssalCTFNightBattleJS(dameConCode, battleData);
			} else {
				// regular yasen
				result = DA.analyzeNightBattleJS(dameConCode, nightData); 
			}
		}
		var endHPs = {
			ally: beginHPs.ally.slice(),
			enemy: beginHPs.enemy.slice()
		};
			
		for (i = 7; i < 13; i++) {
			this.enemyHP[i-7] = result.enemy[i-7];
			endHPs.enemy[i-7] = result.enemy[i-7] ? result.enemy[i-7].hp : -1;
			this.enemySunk[i-7] = result.enemy[i-7] ? result.enemy[i-7].sunk : true;
		}

		shipNum = fleet.countShips();
		for(i = 0; i < shipNum; i++) {
			ship = fleet.ship(i);
			ship.hp = [ship.afterHp[0], ship.afterHp[1]];
			ship.morale = Math.max(0,Math.min(100,ship.morale+(fleetSent ? 1 : -3 )));
			ship.afterHp[0] = result.main[i].hp;
			this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
			ship.afterHp[1] = ship.hp[1];
			endHPs.ally[i] = result.main[i].hp;
		}
		if(ConfigManager.info_btrank){
			this.predictedRankNight = KC3Node.predictRank( beginHPs, endHPs );
			// console.debug("Rank Predict (Night):", this.predictedRankNight);
		}
		if(this.gaugeDamage > -1){
			this.gaugeDamage = this.gaugeDamage + 
				Math.min(nightData.api_nowhps[7],nightData.api_nowhps[7] - this.enemyHP[0].hp);
		}
		
		// Record encoutners only if on sortie and starts from night
		if(this.startNight && KC3SortieManager.onSortie > 0) {
			this.saveEnemyEncounterInfo(this.battleNight);
		}
	};
	
	KC3Node.prototype.night = function( nightData ){
		this.engageNight(nightData, null, false);
	};
	
	KC3Node.prototype.results = function( resultData ){
		try {
			this.rating = resultData.api_win_rank;
			this.nodalXP = resultData.api_get_base_exp;
			if(this.allyNoDamage && this.rating === "S")
				this.rating = "SS";
			console.log("This battle, the ally fleet has no damage:",this.allyNoDamage);
			
			if(this.isBoss()) {
				var
					maps = localStorage.getObject('maps'),
					ckey = ["m",KC3SortieManager.map_world,KC3SortieManager.map_num].join(""),
					stat = maps[ckey].stat,
					srid = KC3SortieManager.onSortie;
				/* DESPAIR STATISTICS ==> */
				if(stat) {
					var
						fs = [this.gaugeDamage,this.originalHPs[7]],
						pt = 'dummy',
						sb = stat.onBoss,
						oc = 0;
					fs.push(fs[0]/fs[1]);
					fs.push(fs[1]-fs[0]);
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
					console.info('Current sortie recorded as',pt,'.');
					console.info('You\'ve done this',oc,'time'+(oc != 1 ? 's' : '')+'.','Good luck, see you next time!');
				}
				/* ==> DESPAIR STATISTICS */
				
				/* FLAGSHIP ATTACKING ==> */
				console.log("Damaged Flagship ",this.gaugeDamage,"/",maps[ckey].curhp || 0,"pts");
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
			
			var
				ship_get = [];
			
			if(typeof resultData.api_get_ship != "undefined"){
				this.drop = resultData.api_get_ship.api_ship_id;
				KC3ShipManager.pendingShipNum += 1;
				KC3GearManager.pendingGearNum += KC3Meta.defaultEquip(this.drop);
				console.log("Drop " + resultData.api_get_ship.api_ship_name + " (" + this.drop + ") Equip " + KC3Meta.defaultEquip(this.drop));
				
				ship_get.push(this.drop);
			}else{
				this.drop = 0;
			}
			
			/*
			api_get_eventitem		：海域攻略報酬　イベント海域突破時のみ存在
				api_type			：報酬種別 1=アイテム, 2=艦娘, 3=装備
				api_id				：ID
				api_value			：個数？
			*/
			(function(resultEventItems){
				console.log("event result",resultEventItems);
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
							console.log("unknown type",eventItem);
						break;
					}
				});
			}).call(this,resultData.api_get_eventitem);
			
			ConfigManager.load();
			ship_get.forEach(function(newShipId){
				var wish_kind = ["salt","wish"];
				
				wish_kind.some(function(wishType){
					var
						wish_key = [wishType,'list'].join('_'),
						wish_id = ConfigManager[wish_key].indexOf(newShipId)+1;
					if(wish_id){
						ConfigManager[wish_key].splice(wish_id-1,1);
						console.warn("Removed",KC3Meta.shipName(KC3Master.ship(newShipId).api_name),"from",wishType,"list");
						
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
				fleetDesg = [KC3SortieManager.fleetSent - 1,1]; // designated fleet (fleet mapping)
			this.lostShips = lostCheck.map(function(lostFlags,fleetNum){
				console.log("lostFlags",fleetNum, lostFlags);
				return (lostFlags || []).filter(function(x){return x>=0;}).map(function(checkSunk,rosterPos){
					if(!!checkSunk) {
						var rtv = PlayerManager.fleets[fleetDesg[fleetNum]].ships[rosterPos];
						if(KC3ShipManager.get(rtv).didFlee) return 0;
						
						console.log("このクソ提督、深海に%c%s%cが沈んだ (ID:%d)",
							'color:red,font-weight:bold',
							KC3ShipManager.get(rtv).master().api_name,
							'color:initial,font-weight:initial',
							rtv
						);
						return rtv;
					} else {
						return 0;
					}
				}).filter(function(shipId){return shipId;});
			});
			
			//var enemyCVL = [510, 523, 560];
			//var enemyCV = [512, 525, 528, 565, 579];
			//var enemySS = [530, 532, 534, 531, 533, 535, 570, 571, 572];
			//var enemyAP = [513, 526, 558];

			for(var i = 0; i < 6; i++) {
				if (this.enemySunk[i]) {
					var enemyShip = KC3Master.ship(this.eships[i]);
					if (!enemyShip) {
						console.log("Cannot find enemy " + this.eships[i]);
					} else if (this.eships[i] < 500) {
						console.log("Enemy ship is not Abyssal!");
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
								KC3QuestManager.get(218).increment();
								KC3QuestManager.get(212).increment();
								KC3QuestManager.get(213).increment();
								KC3QuestManager.get(221).increment();
								break;
						}
					}
					
				}
			}
			
			// Save enemy deck name for encounter
			var name = resultData.api_enemy_info.api_deck_name;
			if(KC3SortieManager.onSortie > 0 && !!name){
				this.saveEnemyEncounterInfo(null, name);
			}
		} catch (e) {
			console.error("Captured an exception ==>", e,"\n==> proceeds safely");
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
			console.error("Captured an exception ==>", e,"\n==> proceeds safely");
		} finally {
			// Reserved for future PvP history storage
			this.savePvPOnDB(resultData);
		}
	};
	
	KC3Node.prototype.isBoss = function(){
		//console.log("Meet Boss: " + ((this.eventKind === 1) && (this.eventId === 5)));
		return ((this.eventKind === 1) && (this.eventId === 5));
	};
	
	KC3Node.prototype.saveEnemyEncounterInfo = function(battleData, updatedName){
		// Update name only if new name offered
		if(!battleData && !!updatedName){
			if(!!this.enemyEncounter){
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
		
		// Save enemy info
		for(var i = 0; i < 6; i++) {
			var enemyId = this.eships[i] || -1;
			// Only record ships with ID more than 500 coz abyss only
			if (enemyId > 500) {
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
		return true;
	};
	
	KC3Node.prototype.saveBattleOnDB = function( resultData ){
		KC3Database.Battle({
			sortie_id: (this.sortie || KC3SortieManager.onSortie || 0),
			node: this.id,
			enemyId: (this.epattern || 0),
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
		});
	};
	
	KC3Node.prototype.savePvPOnDB = function( resultData ){
		console.log("savePvPOnDB", KC3SortieManager);
		KC3Database.PvP({
			fleet: PlayerManager.fleets[KC3SortieManager.fleetSent-1].sortieJson(),
			enemy: [],
			data: (this.battleDay || {}),
			yasen: (this.battleNight || {}),
			rating: this.rating,
			baseEXP: this.nodalXP,
			mvp: this.mvps,
			time: KC3SortieManager.sortieTime
		});
	};
	
})();
