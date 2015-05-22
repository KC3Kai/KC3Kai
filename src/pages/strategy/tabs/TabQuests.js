var TabQuests = {
	status: {
		active: false,
		error: false,
		message: "",
		check :function(){
			if(this.error){
				app.Strategy.showError( this.message );
				return false;
			}
			return true;
		}
	},
	
	/* Load required data, set error if not available
	---------------------------------------------------*/
	init :function(){
		if(this.status.active) return true;
		
		// Just load quests, do not show error if not exists, can still show flowchart
		app.Quests.load();
		
		this.status.active = true;
	},
	
	/* Attempt to show the page
	--------------------------------------------*/
	show :function(){
		// Flowchart root nodes
		var rootQuestTree = $(".page_quests .flowchart ul.questTree");
		this.seedBranch( rootQuestTree, 201 ); // Bd1
		// this.seedBranch( rootQuestTree, 0 ); // Cd2
		// this.seedBranch( rootQuestTree, 0 ); // Dd2
		// this.seedBranch( rootQuestTree, 0 ); // Dw4
		// this.seedBranch( rootQuestTree, 0 ); // Dw9
		// this.seedBranch( rootQuestTree, 0 ); // Ed3
		this.seedBranch( rootQuestTree, 605 ); // Fd1
		this.seedBranch( rootQuestTree, 702 ); // Gd2
		// this.seedBranch( rootQuestTree, 0 ); // Bm1
		// this.seedBranch( rootQuestTree, 0 ); // Bm2
		// this.seedBranch( rootQuestTree, 0 ); // Bm4
		
		// Player quests
		if(Object.size(app.Quests.list) > 0){
			var rootQuestList = $(".page_quests .extralist ul.questList");
			
			
			
		}
	},
	
	/* Add a branch item to the flowchart
	--------------------------------------------*/
	seedBranch :function( parentElement, quest_id ){
		var thisQuest = app.Meta.quest(quest_id);
		console.log(thisQuest);
		var thisBox = $(".page_quests .factory .questFlowItem").clone().appendTo("#"+parentElement.attr("id"));
		
		$(".questIcon", thisBox).text(thisQuest.code);
		$(".questIcon", thisBox).addClass("type"+(String(quest_id).substring(0,1)));
		
		$(".questDesc", thisBox).text(thisQuest.desc);
		
		this.type++;
		
		if(typeof app.Quests.list["q"+quest_id] != "undefined"){
			var questRecord = app.Quests.list["q"+quest_id];
			
			// $(".questTrack", thisBox).addClass( app.Quests.getTrackingText( quest_id, questRecord ) );
			
		}else{
			$(".questInfo", thisBox).addClass("unknown");
		}
		
		// If has children, show them under me
		if(typeof thisQuest.unlock != "undefined"){
			var ctr;
			var childContainer = $("ul.questChildren", thisBox);
			childContainer.attr("id", "questBox_"+quest_id);
			for(ctr in thisQuest.unlock){
				this.seedBranch( childContainer, thisQuest.unlock[ctr] );
			}
		}
	},
	
	/* Add quest row to normal list
	--------------------------------------------*/
	addOtherQuest :function(){
		
	}
	
};