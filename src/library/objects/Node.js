/* Node.js
KC3改 Node Object

Represents a single battle on a node
Used by SortieManager
*/
(function(){
	"use strict";
	
	window.KC3Node = function(sortie_id, id){
		this.sortie = sortie_id;
		this.id = id;
		this.type = "";
	};
	
	KC3Node.prototype.defineAsBattle = function( nodeData ){
		this.type = "battle";
		
		this.epattern = nodeData.api_enemy.api_enemy_id;
		this.checkEnemy();
		
		return this;
	};
	
	KC3Node.prototype.checkEnemy = function( nodeData ){
		// this.epattern
		// this.eships = [ api_ship_ke[i++] ];
		// this.eformation = api_formation[1];
		this.eships = [-1,-1,-1,-1,-1,-1];
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
		
		this.supportFlag = (battleData.api_support_flag==1)?true:false;
		this.yasenFlag = (battleData.api_midnight_flag==1)?true:false;
		
		this.detection = KC3Meta.detection( battleData.api_search[0] )
		this.engagement = KC3Meta.engagement( battleData.api_formation[2] )
		this.fcontact = (battleData.api_kouku.api_stage1.api_touch_plane==1)?"YES":"NO";
		this.econtact = (battleData.api_kouku.api_stage1.api_touch_plane==1)?"YES":"NO";
		
		this.airbattle = KC3Meta.airbattle( battleData.api_kouku.api_stage1.api_disp_seiku );
		
		// Fighter phase
		/*var allyPlaneBefore = battleData.api_kouku.api_stage1.api_f_count;
		var allyPlaneAfter = allyPlaneBefore - battleData.api_kouku.api_stage1.api_f_lostcount;
		$("#battleModal #ally-fighters").html("<img src=\"../../assets/img/items/6.png\" alt=\"Fighters\">" + allyPlaneBefore + " <img src=\"../../assets/img/ui/arrow.png\" alt=\"=>\"> " + allyPlaneAfter);
		
		var enemyPlaneBefore = battleData.api_kouku.api_stage1.api_e_count;
		var enemyPlaneAfter = enemyPlaneBefore - battleData.api_kouku.api_stage1.api_e_lostcount;
		$("#battleModal #enemy-fighters").html("<img src=\"../../assets/img/items/6.png\" alt=\"Fighters\">" + enemyPlaneBefore + " <img src=\"../../assets/img/ui/arrow.png\" alt=\"=>\"> " + enemyPlaneAfter);
		
		// Bombing phase
		if (typeof battleData.api_kouku.api_stage2 != "undefined") {
			allyPlaneBefore = battleData.api_kouku.api_stage2.api_f_count;
			allyPlaneAfter = allyPlaneBefore - battleData.api_kouku.api_stage2.api_f_lostcount;
			$("#battleModal #ally-bombers").html("<img src=\"../../assets/img/items/7.png\" alt=\"Bombers\">" + allyPlaneBefore + " <img src=\"../../assets/img/ui/arrow.png\" alt=\"=>\"> " + allyPlaneAfter);
			
			enemyPlaneBefore = battleData.api_kouku.api_stage2.api_e_count;
			enemyPlaneAfter = enemyPlaneBefore - battleData.api_kouku.api_stage2.api_e_lostcount;
			$("#battleModal #enemy-bombers").html("<img src=\"../../assets/img/items/7.png\" alt=\"Bombers\">" + enemyPlaneBefore + " <img src=\"../../assets/img/ui/arrow.png\" alt=\"=>\"> " + enemyPlaneAfter);
		} else {
			$("#battleModal #ally-bombers").html("");
			$("#battleModal #enemy-bombers").html("");
		}*/
		
	};
	
	KC3Node.prototype.night = function( nightData ){
		this.battleNight = nightData;
		this.fcontact = nightData.api_touch_plane[0];
		this.econtact = nightData.api_touch_plane[1];
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
	};
	
	KC3Node.prototype.save = function( resultData ){
		console.log({
			node: this.id,
			battle: this.battleDay,
			yasen: this.battleNight,
			rating: this.rating,
			drop: this.rating,
		});
	};
	
})();