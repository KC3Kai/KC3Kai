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
	
	flowchartIds: [],
	
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
		this.seedBranch( rootQuestTree, 303 ); // Cd2
		this.seedBranch( rootQuestTree, 402 ); // Dd2
		this.seedBranch( rootQuestTree, 404 ); // Dw4
		this.seedBranch( rootQuestTree, 410 ); // Dw9
		this.seedBranch( rootQuestTree, 503 ); // Ed3
		this.seedBranch( rootQuestTree, 605 ); // Fd1
		this.seedBranch( rootQuestTree, 702 ); // Gd2
		this.seedBranch( rootQuestTree, 249 ); // Bm1
		this.seedBranch( rootQuestTree, 256 ); // Bm2
		this.seedBranch( rootQuestTree, 259 ); // Bm4
		
		// Player quests
		if(Object.size(app.Quests.list) > 0){
			var rootQuestList = $(".page_quests .extralist ul.questList");
			var ctr;
			for(ctr in app.Quests.list){
				// console.log("pending list",app.Quests.list[ctr]);
				if(this.flowchartIds.indexOf(app.Quests.list[ctr].id) == -1){
					this.addOtherQuest(app.Quests.list[ctr]);
				}
			}
			
		}else{
			 $(".page_quests .questHead_2").hide();
			 $(".page_quests .extralist").hide();
		}
		
		$(".resetDailies").on("click", function(){
			app.Quests.resetDailies();
			window.location.reload();
		});
		$(".resetWeeklies").on("click", function(){
			app.Quests.resetWeeklies();
			window.location.reload();
		});
		$(".resetMonthlies").on("click", function(){
			app.Quests.resetMonthlies();
			window.location.reload();
		});
		$(".resetAllQuests").on("click", function(){
			app.Quests.clear();
			window.location.reload();
		});
	},
	
	/* Add a branch item to the flowchart
	--------------------------------------------*/
	seedBranch :function( parentElement, quest_id ){
		// Add this quest to flowchartIds used as exceptions from extra quests at bottom
		this.flowchartIds.push(quest_id);
		
		// Get meta data of this quest
		var thisQuest = app.Meta.quest(quest_id);
		
		// Create quest HTML box and fill initial data
		var thisBox = $(".page_quests .factory .questFlowItem").clone().appendTo("#"+parentElement.attr("id"));
		$(".questIcon", thisBox).text(thisQuest.code);
		$(".questIcon", thisBox).addClass("type"+(String(quest_id).substring(0,1)));
		$(".questDesc", thisBox).text(thisQuest.desc);
		
		// If we have player data about the quest, not just meta data from json
		if(typeof app.Quests.list["q"+quest_id] != "undefined"){
			var questRecord = app.Quests.list["q"+quest_id];
			
			// Status-based actions
			switch(questRecord.status){
				// Open
				case 1:
					$(".questInfo", thisBox).addClass("open");
					break;
					
				// Active
				case 2:
					$(".questInfo", thisBox).addClass("active");
					$(".questInfo .questIcon", thisBox).text("");
					$(".questInfo .questIcon", thisBox).css({
						"background-image": "url(../../assets/img/ui/quest_active.png)",
						"background-color": "transparent",
						"margin-right": "0px"
					});
					break;
				
				// Complete
				case 3:
					$(".questInfo", thisBox).addClass("complete");
					$(".questInfo .questIcon", thisBox).text("");
					$(".questInfo .questIcon", thisBox).css({
						"background-image": "url(../../assets/img/ui/quest_check.png)",
						"background-color": "transparent",
						"margin-right": "0px"
					});
					break;
					
				// Else
				default:
					$(".questInfo", thisBox).addClass("disabled");
					break;
			}
			
			$(".questTrack", thisBox).text( app.Quests.getTrackingText( questRecord ) );
		
		// If we don't have player data about the quest
		}else{
			$(".questInfo", thisBox).addClass("disabled");
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
	addOtherQuest :function( thisQuest ){
		var masterQuest = app.Meta.quest( thisQuest.id );
		// console.log(masterQuest, thisQuest);
	}
	
};