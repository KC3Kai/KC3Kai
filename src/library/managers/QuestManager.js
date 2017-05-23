/* QuestManager.js
KC3改 Quest Management Object

Stand-alone object, attached to root window, never to be instantiated
Contains functions to perform quest management tasks
Uses KC3Quest objects to play around with
*/
(function(){
	"use strict";
	
	window.KC3QuestManager = {
		list: {}, // Use curly brace instead of square bracket to avoid using number-based indexes
		open: [], // Array of quests seen on the quests page, regardless of state
		active: [], // Array of quests that are active and counting
		
		syncStructVersion: 2, // Version of data structure, used for quests synchronization
		
		timeToResetDailyQuests: -1,
		timeToResetWeeklyQuests: -1,
		timeToResetMonthlyQuests: -1,
		timeToResetQuarterlyQuests: -1,
		
		// A quests list which confirmed sharing same counter at server-side
		// Currently quests list is confirmed at: http://wikiwiki.jp/kancolle/?%C7%A4%CC%B3#sc3afcc0
		sharedCounterQuests: [ [218, 212] ],
		
		// Internal constants for time period quests
		_dailyIds: [201, 216, 210, 211, 218, 212, 226, 230, 303, 304, 402, 403, 503, 504, 605, 606, 607, 608, 609, 619, 702],
		_weeklyIds: [214, 220, 213, 221, 228, 229, 241, 242, 243, 261, 302, 404, 410, 411, 613, 638, 703],
		_monthlyIds: [249, 256, 257, 259, 265, 264, 266, 311, 424, 626, 628, 645],
		_quarterlyIds: [637, 643, 822, 854],
		
		/* GET
		Get a specific quest object in the list using its ID
		------------------------------------------*/
		get :function( questId ){
			// Return requested quest object of that ID, or a new Quest object, whichever works
			return (this.list["q"+questId] || (this.list["q"+questId] = new KC3Quest()));
		},
		
		exists :function( questId ){
			return !!this.list["q"+questId];
		},

		remove :function( quest ){
			var questId = (typeof quest === "object") ? quest.id : quest;
			return delete this.list["q"+questId];
		},

		/* GET ACTIVE
		Get list of active quests
		------------------------------------------*/
		getActives :function(){
			var activeQuestObjects = [];
			var self = this;
			$.each(this.active, function( index, element ){
				activeQuestObjects.push( self.get(element) );
			});
			return activeQuestObjects;
		},
		
		getTimeToResetFromLocalStorage :function( timeType ){
			var result = parseInt(localStorage[timeType]);
			if (isNaN(result)){
				result = -1;
				localStorage[timeType] = -1;
			}
			return result;
		},
		
		calcNextResetTime :function(serverDatetime){
			var result = {};
			// 5AM JST = 8PM GMT (previous day), shift 4 hours to midnight
			var serverMidnight = new Date(serverDatetime).shiftHour(4);
			// Perform copy constructor
			result.prevDay8PmGmt = new Date(serverMidnight);
			result.prevDay8PmGmt.shiftDate(-2,true).shiftHour(20);
			result.nextDay8PmGmt = (new Date(result.prevDay8PmGmt)).shiftDate(1);
			
			result.prevWeekSunday8PmGmt = (new Date(result.prevDay8PmGmt)).shiftWeek(0,-1,0);
			result.nextWeekSunday8PmGmt = (new Date(result.prevWeekSunday8PmGmt)).shiftWeek(null,null,1);
			
			// Naming is regarding first day of month of server date:
			// prevMonth = thisMonth-1 only if date = 1 (firstDay)
			// prevMonth = thisMonth if date in [2, lastDay]
			result.prevMonthFirstDay8PmGmt = (new Date(result.prevDay8PmGmt)).resetTime(4).shiftHour(20);
			var nextPrevMonthFirstDay8PmGmt = (new Date(result.prevMonthFirstDay8PmGmt)).shiftMonth(1);
			result.prevMonthLastDay8PmGmt = (new Date(nextPrevMonthFirstDay8PmGmt)).shiftDate(-1);
			// So nextMonth will be next next month if date > 1
			result.nextMonthFirstDay8PmGmt = (new Date(result.prevMonthFirstDay8PmGmt)).shiftMonth(2);
			result.nextMonthPrevDay8PmGmt = (new Date(result.nextMonthFirstDay8PmGmt)).shiftDate(-1);
			
			// Quarterly quests reset on the first day of every March, June, September, and December at 05:00 JST
			var quarterTables = {"0":2,"1":1,"2":3,"3":2,"4":1,"5":3,"6":2,"7":1,"8":3,"9":2,"10":1,"11":3};
			var thisMonthFirstDay8PmGmt = (new Date(result.nextDay8PmGmt)).resetTime(4).shiftHour(20);
			result.nextQuarterFirstDay8PmGmt = (new Date(thisMonthFirstDay8PmGmt)).shiftMonth(quarterTables[thisMonthFirstDay8PmGmt.getMonth()]);
			result.nextQuarterPrevDay8PmGmt = (new Date(result.nextQuarterFirstDay8PmGmt)).shiftDate(-1);
			
			/*
			console.log("============================================");
			var mask = dateFormat.masks.isoUtcDateTime;
			console.log("Time      ", serverDatetime.format(mask,true) );
			console.log("Prev day  ", result.prevDay8PmGmt.format(mask,true) );
			console.log("Next day  ", result.nextDay8PmGmt.format(mask,true) );
			console.log("Prev week ", result.prevWeekSunday8PmGmt.format(mask,true) );
			console.log("Next week ", result.nextWeekSunday8PmGmt.format(mask,true) );
			console.log("Prev month", result.prevMonthFirstDay8PmGmt.format(mask,true), result.prevMonthLastDay8PmGmt.format(mask,true) );
			console.log("Next month", result.nextMonthFirstDay8PmGmt.format(mask,true), result.nextMonthPrevDay8PmGmt.format(mask,true) );
			console.log("Next quart", result.nextQuarterFirstDay8PmGmt.format(mask,true), result.nextQuarterPrevDay8PmGmt.format(mask,true) );
			*/
			return result;
		},
		
		checkAndResetQuests :function(serverDatetime){
			this.load();
			
			var currentServerTimestamp = new Date(serverDatetime).getTime();
			var NextResetTime = this.calcNextResetTime(serverDatetime);
			var timeFromLocalStorage;
			
			/* RESET DAILY QUESTS
			-----------------------------------------------------*/
			// Update next reset time of localStorage if necessary
			if (this.timeToResetDailyQuests === -1) {
				timeFromLocalStorage = this.getTimeToResetFromLocalStorage("timeToResetDailyQuests");
				if (timeFromLocalStorage === -1) {
					if (NextResetTime.prevDay8PmGmt.getTime() < currentServerTimestamp) {
						this.timeToResetDailyQuests = NextResetTime.nextDay8PmGmt.getTime();
					} else {
						this.timeToResetDailyQuests = NextResetTime.prevDay8PmGmt.getTime();
					}
					localStorage.timeToResetDailyQuests = this.timeToResetDailyQuests;
				} else {
					this.timeToResetDailyQuests = timeFromLocalStorage;
				}
				console.log("Reset Daily Quests at", this.timeToResetDailyQuests, new Date(this.timeToResetDailyQuests));
			}
			// Check if reset time passed by, update next reset time if reset
			var millisecondsInDay = 24*60*60*1000;
			if (this.timeToResetDailyQuests <= currentServerTimestamp) {
				this.resetDailies();
				if (this.timeToResetDailyQuests < NextResetTime.prevDay8PmGmt.getTime()) {
					this.timeToResetDailyQuests = NextResetTime.prevDay8PmGmt.getTime();
				} else {
					this.timeToResetDailyQuests = NextResetTime.nextDay8PmGmt.getTime();
				}
				localStorage.timeToResetDailyQuests = this.timeToResetDailyQuests;
				if(typeof KC3Network === "object")
					KC3Network.trigger("Quests");
			} else if (this.timeToResetDailyQuests > currentServerTimestamp + millisecondsInDay) {
				// Fix time diff larger than 1 day
				this.timeToResetDailyQuests -= millisecondsInDay;
				localStorage.timeToResetDailyQuests = this.timeToResetDailyQuests;
			}
			
			/* RESET WEEKLY QUESTS
			-----------------------------------------------------*/
			// Update next reset time of localStorage if necessary
			if (this.timeToResetWeeklyQuests === -1) {
				timeFromLocalStorage = this.getTimeToResetFromLocalStorage("timeToResetWeeklyQuests");
				if (timeFromLocalStorage === -1) {
					if (NextResetTime.prevWeekSunday8PmGmt.getTime() < currentServerTimestamp) {
						this.timeToResetWeeklyQuests = NextResetTime.nextWeekSunday8PmGmt.getTime();
					} else {
						this.timeToResetWeeklyQuests = NextResetTime.prevWeekSunday8PmGmt.getTime();
					}
					localStorage.timeToResetWeeklyQuests = this.timeToResetWeeklyQuests;
				} else {
					this.timeToResetWeeklyQuests = timeFromLocalStorage;
				}
				console.log("Reset Weekly Quests at", this.timeToResetWeeklyQuests, new Date(this.timeToResetWeeklyQuests));
			}
			// Check if reset time passed by, update next reset time if reset
			if (this.timeToResetWeeklyQuests <= currentServerTimestamp) {
				this.resetWeeklies();
				if (this.timeToResetWeeklyQuests < NextResetTime.prevWeekSunday8PmGmt.getTime()) {
					this.timeToResetWeeklyQuests = NextResetTime.prevWeekSunday8PmGmt.getTime();
				} else {
					this.timeToResetWeeklyQuests = NextResetTime.nextWeekSunday8PmGmt.getTime();
				}
				localStorage.timeToResetWeeklyQuests = this.timeToResetWeeklyQuests;
				if(typeof KC3Network === "object")
					KC3Network.trigger("Quests");
			}
			
			/* RESET MONTHLY QUESTS
			-----------------------------------------------------*/
			// Update next reset time of localStorage if necessary
			if (this.timeToResetMonthlyQuests === -1) {
				timeFromLocalStorage = this.getTimeToResetFromLocalStorage("timeToResetMonthlyQuests");
				if (timeFromLocalStorage === -1) {
					if (NextResetTime.prevMonthLastDay8PmGmt.getTime() < currentServerTimestamp) {
						this.timeToResetMonthlyQuests = NextResetTime.nextMonthPrevDay8PmGmt.getTime();
					} else {
						this.timeToResetMonthlyQuests = NextResetTime.prevMonthLastDay8PmGmt.getTime();
					}
					localStorage.timeToResetMonthlyQuests = this.timeToResetMonthlyQuests;
				} else {
					this.timeToResetMonthlyQuests = timeFromLocalStorage;
				}
				console.log("Reset Monthly Quests at", this.timeToResetMonthlyQuests, new Date(this.timeToResetMonthlyQuests));
			}
			// Check if reset time passed by, update next reset time if reset
			if (this.timeToResetMonthlyQuests <= currentServerTimestamp) {
				this.resetMonthlies();
				if (this.timeToResetMonthlyQuests < NextResetTime.prevMonthLastDay8PmGmt.getTime()) {
					this.timeToResetMonthlyQuests = NextResetTime.prevMonthLastDay8PmGmt.getTime();
				} else {
					this.timeToResetMonthlyQuests = NextResetTime.nextMonthPrevDay8PmGmt.getTime();
				}
				localStorage.timeToResetMonthlyQuests = this.timeToResetMonthlyQuests;
				if(typeof KC3Network === "object")
					KC3Network.trigger("Quests");
			}
			
			/* RESET QUARTERLY QUESTS
			-----------------------------------------------------*/
			// Update next reset time of localStorage if necessary
			if (this.timeToResetQuarterlyQuests === -1) {
				timeFromLocalStorage = this.getTimeToResetFromLocalStorage("timeToResetQuarterlyQuests");
				if (timeFromLocalStorage === -1) {
					this.timeToResetQuarterlyQuests = NextResetTime.nextQuarterPrevDay8PmGmt.getTime();
					localStorage.timeToResetQuarterlyQuests = this.timeToResetQuarterlyQuests;
				} else {
					this.timeToResetQuarterlyQuests = timeFromLocalStorage;
				}
				console.log("Reset Quarterly Quests at", this.timeToResetQuarterlyQuests, new Date(this.timeToResetQuarterlyQuests));
			}
			// Check if reset time passed by, update next reset time if reset
			if (this.timeToResetQuarterlyQuests <= currentServerTimestamp) {
				this.resetQuarterlies();
				this.timeToResetQuarterlyQuests = NextResetTime.nextQuarterPrevDay8PmGmt.getTime();
				localStorage.timeToResetQuarterlyQuests = this.timeToResetQuarterlyQuests;
				if(typeof KC3Network === "object")
					KC3Network.trigger("Quests");
			}
			
			this.save();
		},
		
		/* DEFINE PAGE
		When a user loads a quest page, we use its data to update our list
		------------------------------------------*/
		definePage :function( questList, questPage ){
			// For each element in quest List
			//console.log("=================PAGE " + questPage + "===================");
			var untranslated = [];
			var reportedQuests = JSON.parse(localStorage.reportedQuests||"[]");
			for(var ctr in questList){
				if(questList[ctr]===-1) continue;
				
				var questId = questList[ctr].api_no;
				var oldQuest = this.get( questId );
				oldQuest.defineRaw( questList[ctr] );
				oldQuest.autoAdjustCounter();
				
				// Check for untranslated quests
				if( typeof oldQuest.meta().available == "undefined" ){
					if(reportedQuests.indexOf(questId) === -1){
						untranslated.push(questList[ctr]);
						// remember reported quest so wont send data twice
						reportedQuests.push(questId);
					}
				}
				
				// Add to actives or opens depeding on status
				switch( questList[ctr].api_state ){
					case 1:	// Unselected
						this.isOpen( questList[ctr].api_no, true );
						this.isActive( questList[ctr].api_no, false );
						break;
					case 2:	// Selected
						this.isOpen( questList[ctr].api_no, true );
						this.isActive( questList[ctr].api_no, true );
						break;
					case 3:	// Completed
						this.isOpen( questList[ctr].api_no, false );
						this.isActive( questList[ctr].api_no, false );
						break;
					default:
						this.isOpen( questList[ctr].api_no, false );
						this.isActive( questList[ctr].api_no, false );
						break;
				}
			}
			
			// submit untranslated quests to kc3kai website
			if(ConfigManager.KC3DBSubmission_enabled){
				if(untranslated.length > 0){
					localStorage.reportedQuests = JSON.stringify(reportedQuests);
					KC3DBSubmission.sendQuests( JSON.stringify(untranslated) );
				}
			}
			
			this.save();
		},
		
		/* IS OPEN
		Defines a questId as open (not completed), adds to list
		------------------------------------------*/
		isOpen :function(questId, mode){
			if(mode){
				if(this.open.indexOf(questId) == -1){
					this.open.push(questId);
				}
			}else{
				if(this.open.indexOf(questId) > -1){
					this.open.splice(this.open.indexOf(questId), 1);
				}
			}
		},
		
		/* IS ACTIVE
		Defines a questId as active (the quest is selected), adds to list
		------------------------------------------*/
		isActive :function(questId, mode){
			if(mode){
				if(this.active.indexOf(questId) == -1){
					this.active.push(questId);
				}
			}else{
				if(this.active.indexOf(questId) > -1){
					this.active.splice(this.active.indexOf(questId), 1);
				}
			}
		},
		
		/* IS PERIOD
		Indicates if a questId is belong to time-period type quest.
		------------------------------------------*/
		isPeriod :function(questId){
			var period = this._dailyIds.indexOf(questId)>-1;
			period |= this._weeklyIds.indexOf(questId)>-1;
			period |= this._monthlyIds.indexOf(questId)>-1;
			period |= this._quarterlyIds.indexOf(questId)>-1;
			return !!period;
		},
		
		/* RESETTING FUNCTIONS
		Allows resetting quest state and counting
		------------------------------------------*/
		resetQuest :function(questId){
			if(typeof this.list["q"+questId] != "undefined"){
				delete this.list["q"+questId];
				this.isOpen(questId, false);
				this.isActive(questId, false);
			}
		},

		resetQuestCounter: function( questId ){
			if (typeof this.list["q"+questId] != "undefined"){
				this.list["q"+questId].tracking[0][0] = 0;
			}
		},
		
		resetLoop: function( questIds ){
			for(var ctr in questIds){
				this.resetQuest( questIds[ctr] );
			}
		},

		resetCounterLoop: function( questIds ){
			for(var ctr in questIds){
				this.resetQuestCounter( questIds[ctr] );
			}
		},
		
		resetDailies :function(){
			this.load();
			console.log("resetting dailies");
			this.resetLoop(this._dailyIds);
			this.resetCounterLoop([311]);
			this.save();
		},
		
		resetWeeklies :function(){
			this.load();
			console.log("resetting weeklies");
			this.resetLoop(this._weeklyIds);
			this.save();
		},
		
		resetMonthlies :function(){
			this.load();
			console.log("resetting monthlies");
			this.resetLoop(this._monthlyIds);
			this.save();
		},
		
		resetQuarterlies :function(){
			this.load();
			console.log("resetting quarterlies");
			this.resetLoop(this._quarterlyIds);
			this.save();
		},
		
		clear :function(){
			this.list = {};
			this.active = [];
			this.open = [];
			this.save();
		},
		
		/* SAVE
		Write current quest data to localStorage
		------------------------------------------*/
		save :function(){
			// Store only the list. The actives and opens will be redefined on load()
			localStorage.quests = JSON.stringify(this.list);
			
			// Check if synchronization is enabled and quests list is not empty
			if (ConfigManager.chromeSyncQuests && Object.keys(this.list).length > 0) {
				if (typeof localStorage.questsVersion == "undefined") {
					localStorage.questsVersion = 0;
				}
				localStorage.questsVersion++;
				var questsData = {
					quests: localStorage.quests,
					questsVersion: localStorage.questsVersion,
					timeToResetDailyQuests: localStorage.timeToResetDailyQuests,
					timeToResetWeeklyQuests: localStorage.timeToResetWeeklyQuests,
					timeToResetMonthlyQuests: localStorage.timeToResetMonthlyQuests,
					timeToResetQuarterlyQuests: localStorage.timeToResetQuarterlyQuests,
					syncStructVersion: this.syncStructVersion,
					syncTimeStamp: Date.now()
				};
				chrome.storage.sync.set({KC3QuestsData: questsData});
			}
		},
		
		/* LOAD
		Read and refill list from localStorage
		------------------------------------------*/
		load :function(){
			if(typeof localStorage.quests != "undefined"){
				var tempQuests = JSON.parse(localStorage.quests);
				this.list = {};
				var tempQuest;
				
				// Empty actives and opens since they will be re-added
				this.active = [];
				this.open = [];
				
				for(var ctr in tempQuests){
					tempQuest = tempQuests[ctr];
					
					// Add to actives or opens depeding on status
					switch( tempQuest.status ){
						case 1:	// Unselected
							this.isOpen( tempQuest.id, true );
							this.isActive( tempQuest.id, false );
							break;
						case 2:	// Selected
							this.isOpen( tempQuest.id, true );
							this.isActive( tempQuest.id, true );
							break;
						case 3:	// Completed
							this.isOpen( tempQuest.id, false );
							this.isActive( tempQuest.id, false );
							break;
						default:
							this.isOpen( tempQuest.id, false );
							this.isActive( tempQuest.id, false );
							break;
					}
					
					// Add to manager's main list using Quest object
					this.list["q"+tempQuest.id] = new KC3Quest();
					this.list["q"+tempQuest.id].define( tempQuest );
				}
				// console.info("Quest management data loaded");
				return true;
			}
			return false;
		}
	};
	
})();
