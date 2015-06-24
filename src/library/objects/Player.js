/* Player.js
KC3改 Player Class

Instantiatable class to represent one player
*/
(function(){
	"use strict";
	
	window.KC3Player = function(){
		this.id =  0;
		this.name = "Unknown";
		this.desc = "";
		this.rank = "";
		this.level = 1;
		this.exp = [0,0];
		this.server = 0;
	};
	
	KC3Player.prototype.update = function( data ){
		this.id =  data.mid;
		this.name = data.name;
		this.server = 0;
		this.desc = data.desc;
		this.rank = KC3Meta.rank( data.rank );
		this.level = data.level;
		
		// Computer level and experience values
		var ExpCurrLevel = KC3Meta.exp( this.level )[1];
		var ExpNextLevel = KC3Meta.exp( this.level+1 )[1];
		var exp_percent = (data.exp - ExpCurrLevel) / (ExpNextLevel - ExpCurrLevel);
		var exp_next = ExpNextLevel - data.exp;
		this.exp = [ exp_percent, exp_next ];
	};
	
	KC3Player.prototype.logout = function(){
		localStorage.removeItem("player");
		localStorage.removeItem("player_fleets");
		localStorage.removeItem("player_ships");
		localStorage.removeItem("player_gears");
		localStorage.removeItem("player_maps");
		localStorage.removeItem("player_statistics");
		localStorage.removeItem("player_newsfeed");
		localStorage.removeItem("player_quests");
		localStorage.removeItem("lastResource");
		localStorage.removeItem("lastUseitem");
		
		// ShipManager.clear();
		// GearManager.clear();
		// QuestManager.clear();
		// SortieManager.clear();
		// TimerManager.clear();
	};
	
	KC3Player.prototype.save = function(){
		localStorage.player = JSON.stringify(this);
	};
	
})();