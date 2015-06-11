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
					// Add to open quests
					if(this.open.indexOf(questId) == -1){ this.open.push(questId); }
					// Remove from active quests
					var activeIndex = this.active.indexOf(questId);
					if(activeIndex > -1){ this.active.splice(activeIndex, 1); }
					break;
				// Quest is active and tracking
				case 2:
					// Add to open quests and active quests
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
	
	resetLoop: function( questIds ){
		for(var ctr in questIds){
			this.resetQuest( questIds[ctr] );
		}
	},
	
	resetDailies :function(){
		this.load();
		this.resetLoop([201, 216, 210, 211, 218, 212, 226, 230, 303, 304, 402, 403, 503, 504, 605, 606, 607, 608, 609, 619, 702]);
		this.save();
	},
	
	resetWeeklies :function(){
		this.load();
		this.resetLoop([214, 220, 213, 221, 228, 229, 241, 242, 243, 261, 302, 404, 410, 411, 613, 703]);
		this.save();
	},
	
	resetMonthlies :function(){
		this.load();
		this.resetLoop([249, 256, 257, 259, 265, 264, 266]);
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
		return trackingText.join(" ");
	},
	
	getTrackingHtml :function( questData ){
		var trackingText = [];
		var ctr;
		for(ctr in questData.tracking){
			trackingText.push(questData.tracking[ctr][0]+" / "+questData.tracking[ctr][1]);
		}
		return trackingText.join("<br />");
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
			this.active = [];
			this.open = [];
			this.list = {};
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