/* Player.js
KC3改 Player Class

Instantiatable class to represent one player
*/
(function(){
	"use strict";
	
	window.KC3Player = function(){
		if(!this.load()){
			this.id =  0;
			this.name = "Unknown";
			this.desc = "";
			this.rank = "";
			this.level = 1;
			this.exp = [0,0,0];
			this.server = 0;
		}
	};
	
	KC3Player.prototype.update = function( data ){
		this.id =  data.mid;
		this.name = data.name;
		KC3Database.index = this.id;
		
		var MyServer = (new KC3Server()).setUrl( KC3Network.lastUrl );
		this.server = MyServer.num;
		
		this.desc = data.desc;
		this.rank = KC3Meta.rank( data.rank );
		
		this.updateLevel(data.level,data.exp);
	};
	
	KC3Player.prototype.updateLevel = function( level, exp ){
		this.level = level;
		
		// Computer level and experience values
		var ExpCurrLevel = KC3Meta.exp( this.level )[1];
		var ExpNextLevel = KC3Meta.exp( this.level+1 )[1];
		var exp_current = exp - ExpCurrLevel;
		var exp_next = ExpNextLevel - exp;
		var exp_percent = (exp_current) / (ExpNextLevel - ExpCurrLevel);
		this.exp = [ exp_percent, exp_next, exp_current, ExpCurrLevel + exp_current ];
	};

	KC3Player.prototype.logout = function(){
		localStorage.removeItem("player");
		// localStorage.removeItem("player_fleets");
		localStorage.removeItem("ships");
		localStorage.removeItem("gears");
		// localStorage.removeItem("player_maps");
		localStorage.removeItem("statistics");
		localStorage.removeItem("quests");
		// localStorage.removeItem("lastResource");
		// localStorage.removeItem("lastUseitem");
		
		KC3ShipManager.clear();
		KC3GearManager.clear();
		KC3QuestManager.clear();
		// KC3SortieManager.clear();
	};
	
	KC3Player.prototype.save = function(){
		localStorage.player = JSON.stringify(this);
	};
	
	KC3Player.prototype.load = function(){
		if( typeof localStorage.player != "undefined" ){
			var playerInfo = JSON.parse(localStorage.player);
			this.id =  playerInfo.id;
			this.name = playerInfo.name;
			this.desc = playerInfo.desc;
			this.rank = playerInfo.rank;
			this.level = playerInfo.level;
			this.exp = playerInfo.exp;
			this.server = playerInfo.server;
			return true;
		}
		return false;
	};
	
})();