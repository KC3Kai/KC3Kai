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
		
		// If passed initial values
		if(typeof nodeData != "undefined"){
			
			// If passed raw data from compass
			if(typeof nodeData.api_enemy != "undefined"){
				this.eships = [];
				this.epattern = nodeData.api_enemy.api_enemy_id;
				this.checkEnemy();
			}
			
			// If passed formatted enemy list from PVP
			if(typeof nodeData.pvp_opponents != "undefined"){
				this.eships = nodeData.pvp_opponents;
				KC3SortieManager.onEnemiesAvailable();
			}
		}
		return this;
	};
	
	KC3Node.prototype.checkEnemy = function( nodeData ){
		var self = this;
		KC3Database.get_enemy(this.epattern, function(response){
			if(response){
				self.eships = response.ids;
				self.eformation = response.formation;
			}else{
				self.eships = [-1,-1,-1,-1,-1,-1];
				self.eformation = -1;
			}
			KC3SortieManager.onEnemiesAvailable();
		});
	};
	
	KC3Node.prototype.defineAsResource = function( nodeData ){
		this.type = "resource";
		this.item = nodeData.api_itemget.api_icon_id;
		this.icon = function(folder){
			return folder+(
				["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","compass"]
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
	KC3Node.prototype.engage = function( battleData ){
		this.battleDay = battleData;
		
		var enemyships = battleData.api_ship_ke;
		enemyships.splice(0,1);
		this.eships = enemyships;
		this.eformation = battleData.api_formation[1];
		KC3SortieManager.onEnemiesAvailable();
		
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
		
	};
	
	KC3Node.prototype.night = function( nightData ){
		this.battleNight = nightData;
		this.fcontact = (nightData.api_touch_plane[0] > -1)?"YES":"NO";
		this.econtact = (nightData.api_touch_plane[1] > -1)?"YES":"NO";
		this.flare = nightData.api_flare_pos[0]; //??
		this.searchlight = nightData.api_flare_pos[1]; //??
	};
	
	KC3Node.prototype.results = function( resultData ){
		this.rating = resultData.api_win_rank;
		
		if(typeof resultData.api_get_ship != "undefined"){
			this.drop = resultData.api_get_ship.api_ship_id; 
		}else{
			this.drop = 0;
		}
		
		this.saveBattleOnDB();
	};
	
	KC3Node.prototype.isBoss = function(){
		return this.id == KC3SortieManager.boss.node;
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