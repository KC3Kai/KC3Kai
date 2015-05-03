KC3.prototype.Quests = {
	activeQuests: [],
	quests: {},
	
	receivePage :function(questList){
		
	},
	
	activateQuest :function(id){
		this.quests["q"+id].active = true;
	},
	
	deactivateQuest :function(id){
		this.quests["q"+id].active = false;
	},
	
	acceptReward :function(id){
		
	},
	
	track :function(id, data){
		
	}
	
};