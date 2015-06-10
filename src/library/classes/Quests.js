KC3.prototype.Quests = {
	active: [],
	list: {},
	
	init :function(){
		this.load();
	},
	
	receivePage :function(pageNum, questList){
		var ctr;
		
		// Disable all previously on this page
		for(ctr in this.list){
			
		}
		
		// Update quest list with data received
		for(ctr in questList){
			
			// If quest does not have entry yet, add
			if(typeof this.list["q"+questList[ctr].api_no] == "undefined"){
				this.list["q"+questList[ctr].api_no] = {
					id: questList[ctr].api_no,
					type: questList[ctr].api_type,
					progress: questList[ctr].api_progress_flag,
					status: questList[ctr].api_state,
					page: pageNum,
					tracking: app.Meta.quest( questList[ctr].api_no ).tracking
				};
			}else{
				this.list["q"+questList[ctr].api_no].progress  = questList[ctr].api_progress_flag;
				this.list["q"+questList[ctr].api_no].status  = questList[ctr].api_state;
				this.list["q"+questList[ctr].api_no].page  = questList[ctr].pageNum;
			}
			
			// If quest is active, add to this.active
			if(questList[ctr].api_state == 2 || questList[ctr].api_state==3){
				if(this.active.indexOf(questList[ctr].api_no) == -1){
					this.active.push(questList[ctr].api_no);
				}
			}
			
		}
		
		this.save();
	},
	
	/* Automatic Reset
	--------------------------------*/
	checkReset :function(utcNow){
		return false; // temporarily disabled
		
		// If there was a last quest time
		if(typeof localStorage.lastQuest != "undefined"){
			// Convert into Date objects
			var dateQuest = new Date( localStorage.lastQuest * 1000 );
			var dateNow = new Date( utcNow * 1000 );
			// Get number of days since epoch
			var epochDaysQuest = Math.floor(localStorage.lastQuest / 86400);
			var epochDaysNow = Math.floor(utcNow / 86400);
			
			// Check if now is after 8pm AND (last check was earlier today OR anytime in the past days)
			if(
				(dateQuest.getHours() < 20 || epochDaysQuest < epochDaysNow)
				&& dateNow.getHours() >= 20
			){
				resetDailies();
				
				/* HOLY SHIT I HATE JAVASCRIPT DATES
				// Check if triggers a weekly reset as well
				if(
					(dateNow.getDay()==0) // if Sunday (reset is 8pm Sunday during UTC)
					|| (dateNow.getDay() < dateQuest.getDay()) // if last check "day" is more than today, means last check was last week
					|| (dateNow.getDay() == dateQuest.getDay()) // if it's the same day, 
					|| (
						(dateNow.getDay() > dateQuest.getDay()) // if day today is greater than last check
						&& (epochDaysNow - epochDaysQuest > 7) // then must be more than 7 days difference
					}
				){
					
				}
				*/
			}
			
			// Check for monthly reset at midnight
			
		}
		
		// Set time now as the last quest time
		localStorage.lastQuest = utcNow;
	},
	
	resetDailies :function(){
		
		this.save();
	},
	
	resetWeeklies :function(){
		
		this.save();
	},
	
	resetMonthlies :function(){
		
		this.save();
	},
	
	acceptReward :function(id){
		this.quests["q"+id].status = 3;
		this.save();
	},
	
	
	/* Tracking
	-------------------------------------------------------*/
	track :function(id, callback){
		if(typeof this.list["q"+id] != "undefined"){
			if( this.list["q"+id].status == 2 ){
				callback( this.list["q"+id].tracking );
				app.Dashboard.showQuestProgress(this.list["q"+id]);
				this.save();
			}
		}
	},
	
	getTrackingText :function( questData ){
		var trackingText = [];
		var ctr;
		for(ctr in questData.tracking){
			trackingText.push(questData.tracking[ctr][0]+" / "+questData.tracking[ctr][1]);
		}
		return trackingText.join();
	},
	
	
	/* Load data from localStorage
	-------------------------------------------------------*/
	load :function(){
		if(typeof localStorage.player_quests != "undefined"){
			var quests = JSON.parse(localStorage.player_quests);
			this.active = quests.active;
			this.list = quests.list;
			return true;
		}else{
			return false;
		}
	},
	
	/* Remember data to localStorage
	-------------------------------------------------------*/
	save: function(){
		localStorage.player_quests = JSON.stringify({
			active: this.active,
			list: this.list
		});
	}
	
};