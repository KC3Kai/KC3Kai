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
			this.exp = [0,0,0,0];
			this.server = 0;
			this.rankPtLastCount = 0;
			this.rankPtCutoff = 0;
			this.rankPtLastCheck = 0;
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
		var exp_next    = Math.max(0,ExpNextLevel - exp);
		var exp_current = Math.max(0,exp - ExpCurrLevel);
		var exp_percent = (exp_current) / (ExpNextLevel - ExpCurrLevel);
		if(exp_next <= 0) {
			exp_next = 0;
			exp_percent = 1.0;
		}
		this.exp = [ exp_percent, exp_next, exp_current, ExpCurrLevel + exp_current ];
		
		this.checkRankPoints();
	};
	
	KC3Player.prototype.checkRankPoints = function(){
		var TimestampNow = (new Date()).getTime();
		
		var PvPResetTime;
		
		var PvPReset = (new Date());
		PvPReset.setUTCMinutes(0);
		PvPReset.setUTCSeconds(0);
		PvPReset.setUTCMilliseconds(0);
		
		PvPReset.setUTCHours(6);
		PvPResetTime = PvPReset.getTime();
		if(this.rankPtLastCheck < PvPResetTime && PvPResetTime < TimestampNow){
			this.rankCutOff();
		}else{
			PvPReset.setUTCHours(18);
			PvPResetTime = PvPReset.getTime();
			if(this.rankPtLastCheck < PvPResetTime && PvPResetTime < TimestampNow){
				this.rankCutOff();
			}
		}
		
		this.rankPtLastCheck = TimestampNow;
	};
	
	KC3Player.prototype.rankCutOff = function(){
		this.rankPtLastCount = this.getRankPoints();
		this.rankPtCutoff = this.exp[3];
	};
	
	KC3Player.prototype.getRankPoints = function(){
		return Math.floor((this.exp[3] - this.rankPtCutoff)/1400);
	};

	KC3Player.prototype.logout = function(){
		localStorage.removeItem("player");
		localStorage.removeItem("fleets");
		localStorage.removeItem("ships");
		localStorage.removeItem("gears");
		localStorage.removeItem("maps");
		localStorage.removeItem("statistics");
		localStorage.removeItem("quests");
		localStorage.removeItem("lock_plan");
		localStorage.removeItem("lastResource");
		localStorage.removeItem("lastUseitem");
		
		KC3ShipManager.clear();
		KC3GearManager.clear();
		KC3QuestManager.clear();
		KC3SortieManager.endSortie();
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
			this.rankPtLastCount = (playerInfo.rankPtLastCount || 0);
			this.rankPtCutoff = (playerInfo.rankPtCutoff || 0);
			this.rankPtLastCheck = (playerInfo.rankPtLastCheck || 0);
			return true;
		}
		return false;
	};
	
})();
