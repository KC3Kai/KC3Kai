/* QuestManager.js
KC3改 Quest Management Object

Stand-alone object, attached to root window, never to be instantiated
Contains functions to perform quest management tasks
Uses KC3Quest objects to play around with
*/
(function(){
	"use strict";
	
	console.log("KC3改 Quest Management loaded");
	
	window.KC3QuestManager = {
		list: {}, // Use curly brace instead of square bracket to avoid using number-based indexes
		open: [], // Array of quests seen on the quests page, regardless of state
		active: [], // Array of quests that are active and counting
		
		timeToResetDailyQuests: -1,
		timeToResetWeeklyQuests: -1,
		timeToResetMonthlyQuests: -1,
		
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
			if ($.isEmptyObject(this.list)) {
				this.load();
			}
			
			// 5AM JST = 8PM GMT (previous day)
			var millisecondsInDay = 24*60*60*1000;
			var ServerJstClock = new Date( serverJstTime );
			var today8PmGmt = new Date(ServerJstClock.getTime());
			today8PmGmt.setUTCHours(20);
			today8PmGmt.setUTCMinutes(0);
			today8PmGmt.setUTCSeconds(0);
			today8PmGmt.setUTCMilliseconds(0);
			var tomorrow8PmGmt = new Date(today8PmGmt.getTime() + millisecondsInDay);
			
			var thisWeekSunday8PmGmt = new Date(today8PmGmt.getTime() - today8PmGmt.getUTCDay()*millisecondsInDay);
			var nextWeekSunday8PmGmt = new Date(thisWeekSunday8PmGmt.getTime() + 7*millisecondsInDay);
			
			var thisMonthFirstDay8PmGmt = new Date(today8PmGmt.getTime() - (today8PmGmt.getUTCDate()-1)*millisecondsInDay);
			var nextMonthFirstDay8PmGmt = new Date(thisMonthFirstDay8PmGmt.getTime());
			nextMonthFirstDay8PmGmt.setUTCMonth(thisMonthFirstDay8PmGmt.getUTCMonth() + 1);
			var thisMonthLastDay8PmGmt = new Date(nextMonthFirstDay8PmGmt.getTime() - millisecondsInDay);
			
			var nextNextMonthFirstDay8PmGmt = new Date(nextMonthFirstDay8PmGmt.getTime());
			nextNextMonthFirstDay8PmGmt.setUTCMonth(nextMonthFirstDay8PmGmt.getUTCMonth() + 1);
			var nextMonthLastDay8PmGmt = new Date(nextNextMonthFirstDay8PmGmt.getTime() - millisecondsInDay);
			
			//console.log("============================================");
			//console.log( ServerJstClock );
			//console.log( today8PmGmt );
			//console.log( tomorrow8PmGmt );
			//console.log( thisWeekSunday8PmGmt );
			//console.log( nextWeekSunday8PmGmt );
			//console.log( thisMonthLastDay8PmGmt );
			//console.log( nextMonthLastDay8PmGmt );
			
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
			
			console.log("Time until reset daily quests: " + remainingHours + ":" + remainingMinutes + ":" + remainingSeconds);
			
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
			for(var ctr in questList){
				var questId = questList[ctr].api_no;
				var oldQuest = this.get( questId );
				oldQuest.defineRaw( questList[ctr] );
				oldQuest.autoAdjustCounter();
				
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
		
		/* RESETTING FUNCTIONS
		Allows resetting quest state and counting
		------------------------------------------*/
		resetQuest :function(questId){
			if(typeof this.list["q"+questId] != "undefined"){
				this.list["q"+questId] = new KC3Quest(questId);
				this.isOpen(questId, false);
				this.isActive(questId, false);
			}
		},
		
		resetLoop: function( questIds ){
			for(var ctr in questIds){
				this.resetQuest( questIds[ctr] );
			}
		},
		
		resetDailies :function(){
			this.load();
			console.log("resetting dailies");
			this.resetLoop([201, 216, 210, 211, 218, 212, 226, 230, 303, 304, 402, 403, 503, 504, 605, 606, 607, 608, 609, 619, 702]);
			this.save();
		},
		
		resetWeeklies :function(){
			this.load();
			console.log("resetting weeklies");
			this.resetLoop([214, 220, 213, 221, 228, 229, 241, 242, 243, 261, 302, 404, 410, 411, 613, 703]);
			this.save();
		},
		
		resetMonthlies :function(){
			this.load();
			console.log("resetting monthlies");
			this.resetLoop([249, 256, 257, 259, 265, 264, 266]);
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
			//console.log("saved " + localStorage.quests);
		},
		
		/* LOAD
		Read and refill list from localStorage
		------------------------------------------*/
		load :function(){
			if(typeof localStorage.quests != "undefined"){
				var tempQuests = JSON.parse(localStorage.quests);
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
				return true;
			}
			return false;
		}
	};
	
})();