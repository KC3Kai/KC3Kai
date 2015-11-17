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
		return this;
	};
	
	KC3Node.prototype.defineAsResource = function( nodeData ){
		this.type = "resource";
		this.item = nodeData.api_itemget.api_icon_id;
		this.icon = function(folder){
			return folder+(
				["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass","","box1","box2","box3"]
				[nodeData.api_itemget.api_icon_id-1]
			)+".png";
		};
		this.amount = nodeData.api_itemget.api_getcount;
		return this;
	};
	
	KC3Node.prototype.defineAsBounty = function( nodeData ){
		var
			maps = JSON.parse(localStorage.maps),
			ckey = ["m",KC3SortieManager.map_world,KC3SortieManager.map_num].join("");
		this.type = "bounty";
		this.item = nodeData.api_itemget_eo_comment.api_id;
		this.icon = function(folder){
			return folder+(
				["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass"]
				[nodeData.api_itemget_eo_comment.api_id-1]
			)+".png";
		};
		this.amount = nodeData.api_itemget_eo_comment.api_getcount;
		
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
		this.eships = enemyships;
		this.eformation = battleData.api_formation[1];
		this.eParam = battleData.api_eParam;

		this.supportFlag = (battleData.api_support_flag>0);
		this.yasenFlag = (battleData.api_midnight_flag>0);
		
		this.originalHPs = battleData.api_nowhps;
		
		this.detection = KC3Meta.detection( battleData.api_search[0] );
		this.engagement = KC3Meta.engagement( battleData.api_formation[2] );
		
		var
			planePhase  = battleData.api_kouku.api_stage1 || {
				api_touch_plane:[-1,-1],
				api_f_count    :0,
				api_f_lostcount:0,
				api_e_count    :0,
				api_e_lostcount:0,
			},
			attackPhase = battleData.api_kouku.api_stage2;
		this.fcontact = (planePhase.api_touch_plane[0] > -1)?"YES":"NO";
		this.econtact = (planePhase.api_touch_plane[1] > -1)?"YES":"NO";
		
		if(typeof planePhase.api_disp_seiku != "undefined"){
			this.airbattle = KC3Meta.airbattle( planePhase.api_disp_seiku );
		}else{
			this.airbattle = ["?", "", "Unknown"];
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
			this.airbattle = ["None", "", "No Air Battle"];
		}
		
		// Bombing phase 1
		this.planeBombers = { player:[0,0], abyssal:[0,0] };
		if(battleData.api_kouku.api_stage2 !== null){
			this.planeBombers.player[0] = battleData.api_kouku.api_stage2.api_f_count;
			this.planeBombers.player[1] = battleData.api_kouku.api_stage2.api_f_lostcount;
			this.planeBombers.abyssal[0] = battleData.api_kouku.api_stage2.api_e_count;
			this.planeBombers.abyssal[1] = battleData.api_kouku.api_stage2.api_e_lostcount;
		}
		
		// Fighter phase 2
		if(typeof battleData.api_kouku2 != "undefined"){
			this.planeFighters.player[1] += battleData.api_kouku2.api_stage1.api_f_lostcount;
			this.planeFighters.abyssal[1] += battleData.api_kouku2.api_stage1.api_e_lostcount;
			
			// Bombine phase 2
			if(battleData.api_kouku2.api_stage2 !== null){
				this.planeBombers.player[1] += battleData.api_kouku2.api_stage2.api_f_lostcount;
				this.planeBombers.abyssal[1] += battleData.api_kouku2.api_stage2.api_e_lostcount;
			}
		}

		var PS = window.PS;
		var DA = PS["KanColle.DamageAnalysis"];
		var result = null;
		var i = 0;
		var fleet;
		var shipNum;
		var ship;
		var fleetId = parseInt(fleetSent) || KC3SortieManager.fleetSent;
		
		if ((typeof PlayerManager.combinedFleet === "undefined") || (PlayerManager.combinedFleet === 0) || fleetId>1){ // single fleet: not combined, or sent fleet is not first fleet
			result = DA.analyzeRawBattleJS(battleData); 
			// console.log("Single Fleet");
			// console.log("analysis result", result);
			
			// Update enemy
			for (i = 7; i < 13; i++) {
				this.enemyHP[i-7] = result[i];
				if ((result[i] || {currentHp:0}).currentHp <= 0) {
					this.enemySunk[i-7] = true;
				}
			}
			
			// Update our fleet
			fleet = PlayerManager.fleets[fleetId - 1];
			shipNum = fleet.countShips();
			for(i = 0; i < shipNum; i++) {
				ship = fleet.ship(i);
				ship.afterHp[0] = result[i+1].currentHp;
				this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
				ship.afterHp[1] = ship.hp[1];
			}
		} else {
			if (PlayerManager.combinedFleet === 1) {
				result = DA.analyzeRawCarrierTaskForceBattleJS(battleData); 
				// console.log("Carrier Task Force");
			} else {
				result = DA.analyzeRawSurfaceTaskForceBattleJS(battleData); 
				// console.log("Surface Task Force");
			}
			// console.log("analysis result", result);

			// Update enemy
			for(i = 1; i <= 6; i++) {
				var enemy = result.enemy[i];
				if (enemy !== null) {
					this.enemyHP[i-1] = enemy;
					this.enemySunk[i-1] = (enemy.currentHp <= 0);
				}
			}

			// Update main fleet
			fleet = PlayerManager.fleets[0];
			shipNum = fleet.countShips();
			var mainFleet = result.main;
			for(i = 0; i < shipNum; i++) {
				ship = fleet.ship(i);
				ship.afterHp[0] = mainFleet[i+1].currentHp;
				this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
				ship.afterHp[1] = ship.hp[1];
			}

			// Update escort fleet
			fleet = PlayerManager.fleets[1];
			shipNum = fleet.countShips();
			var escortFleet = result.escort;
			for(i = 0; i < shipNum; i++) {
				ship = fleet.ship(i);
				ship.afterHp[0] = escortFleet[i+1].currentHp;
				this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
				ship.afterHp[1] = ship.hp[1];
			}
		}
		if(this.gaugeDamage > -1)
			this.gaugeDamage = Math.min(this.originalHPs[7],this.originalHPs[7] - this.enemyHP[0].currentHp);
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
		
		if(setAsOriginalHP){
			this.originalHPs = nightData.api_nowhps;
		}
		
		this.engagement = this.engagement || KC3Meta.engagement( nightData.api_formation[2] );
		this.fcontact = (nightData.api_touch_plane[0] > -1)?"YES":"NO";
		this.econtact = (nightData.api_touch_plane[1] > -1)?"YES":"NO";
		this.flare = nightData.api_flare_pos[0]; //??
		this.searchlight = nightData.api_flare_pos[1]; //??
		
		var PS = window.PS;
		var DA = PS["KanColle.DamageAnalysis"];
		var result = null;
		var i = 0;
		var fleet;
		var shipNum;
		var ship;
		var fleetId = parseInt(fleetSent) || KC3SortieManager.fleetSent;
		
		// COMBINED FLEET
		if (PlayerManager.combinedFleet && (fleetId <= 1)) { 
			result = DA.analyzeRawNightBattleCombinedJS( nightData ); 
			fleet = PlayerManager.fleets[1];
		// SINGLE FLEET
		} else { // single fleet: not combined, or sent fleet is not first fleet
			result = DA.analyzeRawNightBattleJS( nightData ); 
			fleet = PlayerManager.fleets[fleetId - 1];
		}
		
		for (i = 7; i < 13; i++) {
			this.enemyHP[i-7] = result[i];
			if ((result[i] || {currentHp:0}).currentHp <= 0) {
				this.enemySunk[i-7] = true;
			}
		}
		
		shipNum = fleet.countShips();
		for(i = 0; i < shipNum; i++) {
			ship = fleet.ship(i);
			ship.hp = [ship.afterHp[0], ship.afterHp[1]];
			ship.morale = Math.max(0,Math.min(100,ship.morale+(fleetSent ? 1 : -3 )));
			ship.afterHp[0] = result[i+1].currentHp;
			this.allyNoDamage &= ship.hp[0]==ship.afterHp[0];
			ship.afterHp[1] = ship.hp[1];
		}
		
		if(this.gaugeDamage > -1)
			this.gaugeDamage = this.gaugeDamage + Math.min(nightData.api_nowhps[7],nightData.api_nowhps[7] - this.enemyHP[0].currentHp);
	};
	
	KC3Node.prototype.night = function( nightData ){
		this.engageNight(nightData, null, false);
	};
	
	KC3Node.prototype.results = function( resultData ){
		this.rating = resultData.api_win_rank;
		this.nodalXP = resultData.api_get_base_exp;
		if(this.allyNoDamage && this.rating === "S")
			this.rating = "SS";
		console.log("This battle, have damaged the ally fleet",!this.allyNoDamage);
		
		if(this.isBoss()) {
			var
				maps = JSON.parse(localStorage.maps),
				ckey = ["m",KC3SortieManager.map_world,KC3SortieManager.map_num].join("");
			console.log("Damaged Flagship ",this.gaugeDamage,"/",maps[ckey].curhp || 0,"pts");
			if((this.gaugeDamage >= 0) && (maps[ckey].curhp || 0) > 0) { // gauge-based not cleared / not gauge-based
				maps[ckey].curhp -= this.gaugeDamage;
				if(maps[ckey].curhp <= 0) // if last kill -- check whether flagship is killed or not -- flagship killed = map clear
					maps[ckey].curhp = 1-(maps[ckey].clear = resultData.api_destsf);
			}else if((KC3Meta.gauge(ckey.replace("m","")) - (maps[ckey].kills || 0)) > 0) { // kill-based map not cleared
				maps[ckey].kills += resultData.api_destsf;
			}
			maps[ckey].clear |= resultData.api_first_clear; // obtaining clear once
			localStorage.maps = JSON.stringify(maps);
		}
		
		if(typeof resultData.api_get_ship != "undefined"){
			this.drop = resultData.api_get_ship.api_ship_id;
			KC3ShipManager.pendingShipNum += 1;
			KC3GearManager.pendingGearNum += KC3Meta.defaultEquip(this.drop);
			console.log("Drop " + resultData.api_get_ship.api_ship_name + " (" + this.drop + ") Equip " + KC3Meta.defaultEquip(this.drop));
		}else{
			this.drop = 0;
		}
		
		this.mvps = [resultData.api_mvp || 0,resultData.api_mvp_combined || 0].filter(function(x){return !!x;});
		var fleetDesg = [KC3SortieManager.fleetSent - 1,1];
		this.lostShips = [resultData.api_lost_flag,resultData.api_lost_flag_combined || [-1,0,0,0,0,0,0]]
			.map(function(lostFlags,fleetNum){
				return lostFlags.filter(function(x){return x>=0;}).map(function(checkSunk,rosterPos){
					if(!!checkSunk) {
						var rtv = PlayerManager.fleets[fleetDesg[fleetNum]].ships[rosterPos];
						console.log("このクソ提督、深海に",KC3ShipManager.get(rtv).master().api_name,"が沈んだ (ID:",rtv,")");
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

		this.saveBattleOnDB(resultData);
	};
	
	KC3Node.prototype.isBoss = function(){
		//console.log("Meet Boss: " + ((this.eventKind === 1) && (this.eventId === 5)));
		return ((this.eventKind === 1) && (this.eventId === 5));
	};
	
	KC3Node.prototype.getBattleObject = function( resultData ){
		return {
			sortie_id: this.sortie || KC3SortieManager.onSortie || 0,
			node: this.id,
			enemyId: (this.epattern || 0),
			data: this.battleDay || {},
			yasen: this.battleNight || {},
			rating: this.rating || "S",
			drop: this.drop || 0,
			time: this.stime,
			baseEXP: this.nodalXP || 0,
			hqEXP: !!resultData?resultData.api_get_exp:0,
			shizunde: this.lostShips.map(function(fleetLost){
				return fleetLost.map(function(shipSunk){
					return KC3ShipManager.get(shipSunk).masterId;
				});
			}),
			mvp: this.mvps || []
		};
	};
	
	KC3Node.prototype.saveBattleOnDB = function( resultData ){
		KC3Database.Battle(this.getBattleObject( resultData ));
	};
	
})();
