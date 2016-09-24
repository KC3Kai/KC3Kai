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
		
		timeToResetDailyQuests: -1,
		timeToResetWeeklyQuests: -1,
		timeToResetMonthlyQuests: -1,
		
		// Internal constants for time period quests
		_dailyIds: [201, 216, 210, 211, 218, 212, 226, 230, 303, 304, 402, 403, 503, 504, 605, 606, 607, 608, 609, 619, 702],
		_weeklyIds: [214, 220, 213, 221, 228, 229, 241, 242, 243, 261, 302, 404, 410, 411, 613, 638, 703],
		_monthlyIds: [249, 256, 257, 259, 265, 264, 266, 311, 626, 628, 645],
		_quarterlyIds: [637, 643, 822],
		
		/* GET
		Get a specific quest object in the list using its ID
		------------------------------------------*/
		get :function( questId ){
			// Return requested quest object of that ID, or a new Quest object, whichever works
			return (this.list["q"+questId] || (this.list["q"+questId] = new KC3Quest()));
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
		
		checkAndResetQuests :function(serverJstTime){
			//console.log($.isEmptyObject(this.list));
			/*if ($.isEmptyObject(this.list)) {
				this.load();
			}*/
			this.load();
			
			// 5AM JST = 8PM GMT (previous day)
			var millisecondsInDay = 24*60*60*1000;
			var ServerJstClock = new Date( serverJstTime ).shiftHour(4);
			var today8PmGmt = new Date(ServerJstClock); // perform copy constructor
			today8PmGmt.shiftDate(-2,true).shiftHour(20);
			
			var tomorrow8PmGmt = (new Date(today8PmGmt)).shiftDate(1);
			
			var thisWeekSunday8PmGmt = (new Date(today8PmGmt)).shiftWeek(0,-1,0);
			var nextWeekSunday8PmGmt = (new Date(thisWeekSunday8PmGmt)).shiftWeek(null,null,1);
			
			var thisMonthFirstDay8PmGmt = (new Date(today8PmGmt)).resetTime(4).shiftHour(20);
			var nextMonthFirstDay8PmGmt = (new Date(thisMonthFirstDay8PmGmt)).shiftMonth(1);
			var thisMonthLastDay8PmGmt = (new Date(nextMonthFirstDay8PmGmt)).shiftDate(-1);
			
			var nextNextMonthFirstDay8PmGmt = (new Date(thisMonthFirstDay8PmGmt)).shiftMonth(2);
			var nextMonthLastDay8PmGmt = (new Date(nextNextMonthFirstDay8PmGmt)).shiftDate(-1);
			
			ServerJstClock.shiftHour(-4);
			
			//console.log("============================================");
			//console.log( 'Time      ', ServerJstClock.format(undefined,true) );
			//console.log( 'Curr day  ', today8PmGmt.format(undefined,true) );
			//console.log( 'Next day  ', tomorrow8PmGmt.format(undefined,true) );
			//console.log( 'Curr week ', thisWeekSunday8PmGmt.format(undefined,true) );
			//console.log( 'Next week ', nextWeekSunday8PmGmt.format(undefined,true) );
			//console.log( 'Curr month', thisMonthFirstDay8PmGmt.format(undefined,true), thisMonthLastDay8PmGmt.format(undefined,true) );
			//console.log( 'Next month', nextMonthFirstDay8PmGmt.format(undefined,true), nextMonthLastDay8PmGmt.format(undefined,true) );
			
			/*if ( ServerJstClock.getTime() > today8PmGmt.getTime()) {
				console.log("Passed 5AM JST");
			}*/
			
			var timeFromLocalStorage;
			
			/* RESET DAILY QUESTS
			-----------------------------------------------------*/
			if (this.timeToResetDailyQuests === -1) {
				timeFromLocalStorage = this.getTimeToResetFromLocalStorage("timeToResetDailyQuests");
				
				// Nothing in localStorage
				if (timeFromLocalStorage === -1) {
					if (today8PmGmt.getTime() < ServerJstClock.getTime()) {
						this.timeToResetDailyQuests = tomorrow8PmGmt.getTime();
					} else {
						this.timeToResetDailyQuests = today8PmGmt.getTime();
					}
					
					// Update localStorage
					localStorage.timeToResetDailyQuests = this.timeToResetDailyQuests;
				} else {
					this.timeToResetDailyQuests = timeFromLocalStorage;
				}
				console.log("Reset Daily Quests: " + this.timeToResetDailyQuests + " " + new Date(this.timeToResetDailyQuests));
			}
			
			if (this.timeToResetDailyQuests <= ServerJstClock.getTime()) {
				this.resetDailies();
				if (this.timeToResetDailyQuests < today8PmGmt.getTime()) {
					this.timeToResetDailyQuests = today8PmGmt.getTime();
				} else {
					this.timeToResetDailyQuests = tomorrow8PmGmt.getTime();
				}
				localStorage.timeToResetDailyQuests = this.timeToResetDailyQuests;
				KC3Network.trigger("Quests");
			} else if (this.timeToResetDailyQuests > ServerJstClock.getTime() + millisecondsInDay) {
				this.timeToResetDailyQuests -= millisecondsInDay;
				localStorage.timeToResetDailyQuests = this.timeToResetDailyQuests;
			}
			
			var remainingTime = this.timeToResetDailyQuests - ServerJstClock.getTime();
			var remainingHours = Math.floor(remainingTime / (60*60*1000));
			var remainingMinutes = Math.floor((remainingTime / (60*1000))%60);
			var remainingSeconds = Math.floor((remainingTime / (1000))%60);
			
			//console.log("Time until reset daily quests: " + remainingHours + ":" + remainingMinutes + ":" + remainingSeconds);
			
			/* RESET WEEKLY QUESTS
			-----------------------------------------------------*/
			if (this.timeToResetWeeklyQuests === -1) {
				timeFromLocalStorage = this.getTimeToResetFromLocalStorage("timeToResetWeeklyQuests");
				
				// Nothing in localStorage
				if (timeFromLocalStorage === -1) {
					if (thisWeekSunday8PmGmt.getTime() < ServerJstClock.getTime()) {
						this.timeToResetWeeklyQuests = nextWeekSunday8PmGmt.getTime();
					} else {
						this.timeToResetWeeklyQuests = thisWeekSunday8PmGmt.getTime();
					}
					
					// Update localStorage
					localStorage.timeToResetWeeklyQuests = this.timeToResetWeeklyQuests;
				} else {
					this.timeToResetWeeklyQuests = timeFromLocalStorage;
				}
				console.log("Reset Weekly Quests: " + this.timeToResetWeeklyQuests + " " + new Date(this.timeToResetWeeklyQuests));
			}
			
			if (this.timeToResetWeeklyQuests <= ServerJstClock.getTime()) {
				this.resetWeeklies();
				if (this.timeToResetWeeklyQuests < thisWeekSunday8PmGmt.getTime()) {
					this.timeToResetWeeklyQuests = thisWeekSunday8PmGmt.getTime();
				} else {
					this.timeToResetWeeklyQuests = nextWeekSunday8PmGmt.getTime();
				}
				localStorage.timeToResetWeeklyQuests = this.timeToResetWeeklyQuests;
				KC3Network.trigger("Quests");
			}
			
			/* RESET MONTHLY QUESTS
			-----------------------------------------------------*/
			if (this.timeToResetMonthlyQuests === -1) {
				timeFromLocalStorage = this.getTimeToResetFromLocalStorage("timeToResetMonthlyQuests");
				
				// Nothing in localStorage
				if (timeFromLocalStorage === -1) {
					if (thisMonthLastDay8PmGmt.getTime() < ServerJstClock.getTime()) {
						this.timeToResetMonthlyQuests = nextMonthLastDay8PmGmt.getTime();
					} else {
						this.timeToResetMonthlyQuests = thisMonthLastDay8PmGmt.getTime();
					}
					
					// Update localStorage
					localStorage.timeToResetMonthlyQuests = this.timeToResetMonthlyQuests;
				} else {
					this.timeToResetMonthlyQuests = timeFromLocalStorage;
				}
				console.log("Reset Monthly Quests: " + this.timeToResetMonthlyQuests + " " + new Date(this.timeToResetMonthlyQuests));
			}
			
			if (this.timeToResetMonthlyQuests <= ServerJstClock.getTime()) {
				this.resetMonthlies();
				if (this.timeToResetMonthlyQuests < thisMonthLastDay8PmGmt.getTime()) {
					this.timeToResetMonthlyQuests = thisMonthLastDay8PmGmt.getTime();
				} else {
					this.timeToResetMonthlyQuests = nextMonthLastDay8PmGmt.getTime();
				}
				localStorage.timeToResetMonthlyQuests = this.timeToResetMonthlyQuests;
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
			for(var ctr in questList){
				if(questList[ctr]===-1) continue;
				
				var questId = questList[ctr].api_no;
				var oldQuest = this.get( questId );
				oldQuest.defineRaw( questList[ctr] );
				oldQuest.autoAdjustCounter();
				
				// Check for untranslated quests
				if( typeof oldQuest.meta().available == "undefined" ){
					var repotedQuests = JSON.parse(localStorage.repotedQuests||"[]");
					if(repotedQuests.indexOf(questId)===-1){
						untranslated.push(questList[ctr]);
						// remember reported quest so wont send data twice
						repotedQuests.push(questId);
						localStorage.repotedQuests = JSON.stringify(repotedQuests);
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
					// 1: Unselected
					// 2: Selected
					if(tempQuest.status==1 || tempQuest.status==2){
						
					}
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
