KC3.prototype.Quests = {
	active: [],
	open: [],
	list: {},
	
	init :function(){
		this.load();
	},
	
	receivePage :function(pageNum, questList){
		this.load();
		
		// Update quest list with data received
		var ctr;
		for(ctr in questList){
			// console.log(questList[ctr]);
			var questId = questList[ctr].api_no;
			var questStatus = questList[ctr].api_state;
			
			// If quest does not have entry yet, add
			if(typeof this.list["q"+questId] == "undefined"){
				this.list["q"+questId] = {
					id: questId,
					status: questStatus,
					tracking: app.Meta.quest( questId ).tracking
				};
				
			// If quests exists on list, just update status
			}else{
				this.list["q"+questId].status = questStatus;
			}
			
			// Status-based actions
			switch( questStatus ){
				// Quest shows up but not active
				case 1:
					if(this.open.indexOf(questId) == -1){ this.open.push(questId); }
					break;
				// Quest is active and tracking
				case 2:
					if(this.open.indexOf(questId) == -1){ this.open.push(questId); }
					if(this.active.indexOf(questId) == -1){ this.active.push(questId); }
					break;
				// Quest is complete
				case 3:
					// Remove from open quests
					var openIndex = this.open.indexOf(questId);
					if(openIndex > -1){ this.open.splice(openIndex, 1); }
					// Remove from active quests
					var activeIndex = this.active.indexOf(questId);
					if(activeIndex > -1){ this.active.splice(activeIndex, 1); }
					break;
				default: break;
			}
		}
		
		/*console.log("Post-receivePage");
		console.log("this.active", this.active);
		console.log("this.open", this.open);
		console.log("this.list", this.list);*/
		
		this.save();
	},
	
	resetQuest :function(questId){
		if(typeof this.list["q"+questId] != "undefined"){
			this.list["q"+questId].status = -1;
			this.list["q"+questId].tracking = app.Meta.quest( questId ).tracking;
		}
	},
	
	resetDailies :function(){
		this.load();
		this.resetQuest(201);
		this.resetQuest(216);
		this.resetQuest(210);
		this.resetQuest(211);
		this.resetQuest(218);
		this.resetQuest(212);
		this.resetQuest(226);
		this.resetQuest(230);
		this.save();
	},
	
	resetWeeklies :function(){
		this.load();
		this.resetQuest(214);
		this.resetQuest(220);
		this.resetQuest(213);
		this.resetQuest(221);
		this.resetQuest(228);
		this.resetQuest(229);
		this.resetQuest(241);
		this.resetQuest(242);
		this.resetQuest(243);
		this.resetQuest(261);
		this.save();
	},
	
	resetMonthlies :function(){
		this.load();
		this.resetQuest(249);
		this.resetQuest(256);
		this.resetQuest(257);
		this.resetQuest(259);
		this.resetQuest(265);
		this.resetQuest(264);
		this.resetQuest(266);
		this.save();
	},
	
	
	/* Tracking
	-------------------------------------------------------*/
	track :function(id, callback){
		this.load();
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
			trackingText.push(questData.tracking[ctr][0]+"/"+questData.tracking[ctr][1]);
		}
		return trackingText.join();
	},
	
	/* Reset all quests
	-------------------------------------------------------*/
	clear :function(){
		if(typeof localStorage.player_quests != "undefined"){
			localStorage.removeItem("player_quests");
		}
	},
	
	/* Load data from localStorage
	-------------------------------------------------------*/
	load :function(){
		if(typeof localStorage.player_quests != "undefined"){
			var quests = JSON.parse(localStorage.player_quests);
			this.active = quests.active;
			this.open = quests.open;
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
			open: this.open,
			list: this.list
		});
	}
	
};