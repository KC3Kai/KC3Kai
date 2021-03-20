/* Player.js
KC3改 Player Class

Instantiate-able class to represent one player
*/
(function(){
	"use strict";
	
	window.KC3Player = function(){
		if(!this.load()){
			this.id = 0;
			this.name = "Unknown";
			this.nameId = "-1";
			this.desc = "";
			this.rank = "";
			this.level = 1;
			this.exp = [0,0,0,0];
			this.server = 0;
			this.rankPtLastCount = 0;
			this.rankPtCutoff = 0;
			this.rankPtLastCheck = 0;
			this.rankPtLastTimestamp = 0;
			this.lastMaterial = null;
			this.lastPortTime = null;
			this.lastSortie   = null;
			this.fleetSlots = 1;
			this.repairSlots = 2;
			this.buildSlots = 2;
			this.shipSlots = 100;
			this.gearSlots = 500;
			this.parallelQuestCount = 5;
			this.monthlyExpedResetTime = 0;
		}
	};
	
	KC3Player.prototype.update = function(data){
		this.id = data.mid;
		this.name = data.name;
		this.nameId = data.nameId;
		KC3Database.index = this.id;
		
		var MyServer = (new KC3Server()).setUrl(KC3Network.lastUrl);
		this.server = MyServer.num;
		
		this.desc = data.desc;
		this.rank = KC3Meta.rank(data.rank);
		
		this.fleetSlots = data.fleetCount;
		this.repairSlots = data.repairSlots;
		this.buildSlots = data.buildSlots;
		this.shipSlots = data.maxShipSlots;
		this.gearSlots = 3 + data.maxGearSlots;
		this.parallelQuestCount = data.questCount;
		
		this.updateLevel(data.level, data.exp);
		this.checkRankPoints();
	};
	
	KC3Player.prototype.updateLevel = function(level, exp){
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
	};
	
	KC3Player.prototype.checkRankPoints = function(){
		var now = Date.now();
		var cutoffToday = new Date(now);
		cutoffToday.setUTCMinutes(0);
		cutoffToday.setUTCSeconds(0);
		cutoffToday.setUTCMilliseconds(0);
		
		// Get last date of this month
		var lastDay = new Date(Date.UTC(
			cutoffToday.getUTCFullYear(),
			cutoffToday.getUTCMonth() + 1,
			0
		));
		var didCutoff = false;
		// If this is the last day of the month
		if(cutoffToday.getUTCDate() == lastDay.getUTCDate()) {
			// At morning, check 0500 UTC = 1400 JST
			// At night, check 1300 UTC = 2200 JST: Montly points reset
			// At night, check 1700 UTC = 0200 JST: First cycle end, start second cycle
			didCutoff |= this.checkRankCutOff(cutoffToday, 5, now);
			didCutoff |= this.checkRankCutOff(cutoffToday, 13, now);
			didCutoff |= this.checkRankCutOff(cutoffToday, 17, now);
		} else {
			// At morning, check 0500 UTC = 1400 JST
			// At night, check 1700 UTC = 0200 JST
			didCutoff |= this.checkRankCutOff(cutoffToday, 5, now);
			didCutoff |= this.checkRankCutOff(cutoffToday, 17, now);
		}
		// If today all cutoff skipped, check if has not been cutoff for 12 hours since last
		if(!didCutoff) {
			didCutoff |= this.checkRankCutOff(false, 0, now);
		}
		
		this.rankPtLastCheck = now;
		return didCutoff;
	};
	
	KC3Player.prototype.checkRankCutOff = function(dateToday, hr, now = Date.now()){
		if(!dateToday || hr == undefined){
			// 12 hours + 1 minute to avoid bounds conflict
			if((now - this.rankPtLastTimestamp) > (1000 * 60 * 60 * 12 + 60000)) {
				this.rankCutOff(now);
				return true;
			}
			return false;
		}
		dateToday.setUTCHours(hr);
		var cutoffTimestamp = dateToday.getTime();
		if(this.rankPtLastCheck < cutoffTimestamp && cutoffTimestamp < now){
			this.rankCutOff(now);
			return true;
		}
		return false;
	};
	
	KC3Player.prototype.rankCutOff = function(now = Date.now()){
		this.rankPtLastCount = this.getRankPoints();
		this.rankPtLastTimestamp = now;
		this.rankPtCutoff = this.exp[3];
	};
	
	KC3Player.prototype.getRankPoints = function(){
		var ExOpBonus = 0;
		
		/*var maps = JSON.parse(localStorage.maps);
		for(var mapName in maps){
			if(maps[mapName].clear){
				switch(mapName){
					case "m15": ExOpBonus += 75; break;
					case "m16": ExOpBonus += 75; break;
					case "m25": ExOpBonus += 100; break;
					case "m35": ExOpBonus += 150; break;
					case "m45": ExOpBonus += 180; break;
					case "m55": ExOpBonus += 200; break;
					default: break;
				}
			}
		}*/
		
		return (this.exp[3] - this.rankPtCutoff) * 7 / 10000 + ExOpBonus;
	};
	
	KC3Player.prototype.getRegenCap = function(){
		return (3 + this.level) * 250;
	};

	KC3Player.prototype.logout = function(){
		// Clear all cached / tracked game data related to specified player member,
		// KC3 user settings, Strategy Room options untouched, may cause minor conflict.
		localStorage.removeItem("player");
		localStorage.removeItem("fleets");
		localStorage.removeItem("statistics");
		localStorage.removeItem("lastResource");
		localStorage.removeItem("lastUseitem");
		localStorage.removeItem("lastExperience");
		localStorage.removeItem("akashiRepairStartTime");
		localStorage.removeItem("baseConvertingSlots");
		localStorage.removeItem("bases");
		localStorage.removeItem("consumables");
		localStorage.removeItem("dockingShips");
		localStorage.removeItem("buildingShips");
		localStorage.removeItem("longestIdleTime");
		localStorage.removeItem("pictureBook");
		localStorage.removeItem("playerNewsFeed");
		// History of map clear and event boss hp info will be lost,
		// still keep them since they are unrecoverable.
		//localStorage.removeItem("maps");
		//localStorage.removeItem("quests");
		// KCSAPI of totally refreshing ships and gears already done,
		// clearing them here will cause temporarily missing of cached data.
		//localStorage.removeItem("ships");
		//localStorage.removeItem("gears");
		//KC3ShipManager.clear();
		//KC3GearManager.clear();
		//KC3QuestManager.clear();
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
			this.rankPtLastTimestamp = (playerInfo.rankPtLastTimestamp || 0);
			this.rankPtCutoff = (playerInfo.rankPtCutoff || 0);
			this.rankPtLastCheck = (playerInfo.rankPtLastCheck || 0);
			this.lastMaterial = playerInfo.lastMaterial || null;
			this.lastPortTime = playerInfo.lastPortTime || null;
			this.lastSortie   = playerInfo.lastSortie || null;
			this.fleetSlots = playerInfo.fleetSlots || 1;
			this.repairSlots = playerInfo.repairSlots || 2;
			this.buildSlots = playerInfo.buildSlots || 2;
			this.shipSlots = playerInfo.shipSlots || 100;
			this.gearSlots = playerInfo.gearSlots || 500;
			this.parallelQuestCount = playerInfo.parallelQuestCount || 5;
			this.monthlyExpedResetTime = playerInfo.monthlyExpedResetTime || 0;
			return true;
		}
		return false;
	};
	
})();
