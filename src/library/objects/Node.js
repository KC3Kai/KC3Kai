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
			}
			
			// If passed formatted enemy list from PVP
			if(typeof nodeData.pvp_opponents != "undefined"){
				this.eships = nodeData.pvp_opponents;
			}
		}
		this.enemySunk = [false, false, false, false, false, false];
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
		this.type = "bounty";
		this.item = nodeData.api_itemget_eo_comment.api_id;
		this.icon = function(folder){
			return folder+(
				["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass"]
				[nodeData.api_itemget_eo_comment.api_id-1]
			)+".png";
		};
		this.amount = nodeData.api_itemget_eo_comment.api_getcount;
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
		
		this.supportFlag = (battleData.api_support_flag>0)?true:false;
		this.yasenFlag = (battleData.api_midnight_flag>0)?true:false;
		
		this.detection = KC3Meta.detection( battleData.api_search[0] );
		this.engagement = KC3Meta.engagement( battleData.api_formation[2] );
		this.fcontact = (battleData.api_kouku.api_stage1.api_touch_plane[0] > -1)?"YES":"NO";
		this.econtact = (battleData.api_kouku.api_stage1.api_touch_plane[1] > -1)?"YES":"NO";
		
		this.airbattle = KC3Meta.airbattle( battleData.api_kouku.api_stage1.api_disp_seiku );
		
		// Fighter phase 1
		this.planeFighters = {
			player:[
				battleData.api_kouku.api_stage1.api_f_count,
				battleData.api_kouku.api_stage1.api_f_lostcount
			],
			abyssal:[
				battleData.api_kouku.api_stage1.api_e_count,
				battleData.api_kouku.api_stage1.api_e_lostcount
			]
		};
		
		if(
			this.planeFighters.player[0]===0
			&& this.planeFighters.abyssal[0]===0
			&& battleData.api_kouku.api_stage2===null
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
		// for regular battles
		var result = DA.analyzeRawBattleJS(battleData); 
		var i = 0;
		for (i = 7; i < 13; i++) {
			if ((result[i] !== null) && (result[i].currentHp <= 0)) {
				this.enemySunk[i-7] = true;
			}
		}
		
		var fleetId = (typeof fleetSent != "undefined")? fleetSent : KC3SortieManager.fleetSent;
		var fleet = PlayerManager.fleets[fleetId - 1];
		var shipNum = fleet.countShips();
		for(i = 0; i < shipNum; i++) {
			var ship = fleet.ship(i);
			ship.afterHp[0] = result[i+1].currentHp;
			ship.afterHp[1] = ship.hp[1];
		}
		// for night battles
		//DA.analyzeRawNightBattleJS(svdata.api_data)
	};
	
	KC3Node.prototype.engageNight = function( nightData, fleetSent ){
		this.battleNight = nightData;
		this.startNight = true;
		
		var enemyships = nightData.api_ship_ke;
		if(enemyships[0]==-1){ enemyships.splice(0,1); }
		this.eships = enemyships;
		this.eformation = nightData.api_formation[1];
		
		this.engagement = KC3Meta.engagement( nightData.api_formation[2] );
		this.fcontact = (nightData.api_touch_plane[0] > -1)?"YES":"NO";
		this.econtact = (nightData.api_touch_plane[1] > -1)?"YES":"NO";
		this.flare = nightData.api_flare_pos[0]; //??
		this.searchlight = nightData.api_flare_pos[1]; //??
		
		var PS = window.PS;
		var DA = PS["KanColle.DamageAnalysis"];
		var result = DA.analyzeRawNightBattleJS( nightData ); 
		var i = 0;
		for (i = 7; i < 13; i++) {
			if ((result[i] !== null) && (result[i].currentHp <= 0)) {
				this.enemySunk[i-7] = true;
			}
		}
		
		var fleetId = (typeof fleetSent != "undefined")? fleetSent : KC3SortieManager.fleetSent;
		var fleet = PlayerManager.fleets[fleetId - 1];
		var shipNum = fleet.countShips();
		for(i = 0; i < shipNum; i++) {
			var ship = fleet.ship(i);
			ship.afterHp[0] = result[i+1].currentHp;
			ship.afterHp[1] = ship.hp[1];
		}
	};
	
	KC3Node.prototype.night = function( nightData ){
		this.battleNight = nightData;
		
		this.fcontact = (nightData.api_touch_plane[0] > -1)?"YES":"NO";
		this.econtact = (nightData.api_touch_plane[1] > -1)?"YES":"NO";
		this.flare = nightData.api_flare_pos[0]; //??
		this.searchlight = nightData.api_flare_pos[1]; //??

		var PS = window.PS;
		var DA = PS["KanColle.DamageAnalysis"];
		var result = DA.analyzeRawNightBattleJS(nightData);
		// console.log(result);
		for (var i = 7; i < 13; i++) {
			if ((result[i] !== null) && (result[i].currentHp <= 0)) {
				this.enemySunk[i-7] = true;
			}
		}

		var fleetId = (typeof fleetSent != "undefined")? fleetSent : KC3SortieManager.fleetSent;
		var fleet = PlayerManager.fleets[fleetId - 1];
		var shipNum = fleet.countShips();
		for(i = 0; i < shipNum; i++) {
			var ship = fleet.ship(i);
			ship.afterHp[0] = result[i+1].currentHp;
			ship.afterHp[1] = ship.hp[1];
		}
	};
	
	KC3Node.prototype.results = function( resultData ){
		this.rating = resultData.api_win_rank;
		
		if(typeof resultData.api_get_ship != "undefined"){
			this.drop = resultData.api_get_ship.api_ship_id;
			KC3ShipManager.pendingShipNum += 1;
			KC3GearManager.pendingGearNum += KC3Meta.defaultEquip(this.drop);
			console.log("Drop " + resultData.api_get_ship.api_ship_name + " (" + this.drop + ") Equip " + KC3Meta.defaultEquip(this.drop));
		}else{
			this.drop = 0;
		}
		
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

		this.saveBattleOnDB();
	};
	
	KC3Node.prototype.isBoss = function(){
		//console.log("Meet Boss: " + ((this.eventKind === 1) && (this.eventId === 5)));
		return ((this.eventKind === 1) && (this.eventId === 5));
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
			time: this.stime
		});
	};
	
})();