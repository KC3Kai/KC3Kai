(function(){
	"use strict";
	
	KC3StrategyTabs.flowchart = new KC3StrategyTab("flowchart");
	
	KC3StrategyTabs.flowchart.definition = {
		tabSelf: KC3StrategyTabs.flowchart,
		
		flowchartIds: [],
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){

		},

		/* RELOAD
		Prepares latest quests data
		---------------------------------*/
		reload :function(){
			KC3QuestManager.load();
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			// Flowchart root nodes
			var rootQuestTree = $(".tab_flowchart .flowchart ul.questTree");
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
			
			// Other non-flowchart quests
			var rootQuestList = $(".tab_flowchart .extralist ul.questList");
			for(var ctr in KC3QuestManager.open){
				var anotherQuest = KC3QuestManager.get( KC3QuestManager.open[ctr] );
				if(this.flowchartIds.indexOf( KC3QuestManager.open[ctr] ) === -1){
					this.addOtherQuest( anotherQuest );
				}
			}
			
			$(".resetDailies").on("click", function(){
				KC3QuestManager.resetDailies();
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			
			$(".resetWeeklies").on("click", function(){
				KC3QuestManager.resetWeeklies();
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			
			$(".resetMonthlies").on("click", function(){
				KC3QuestManager.resetMonthlies();
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			
			$(".resetAllQuests").on("click", function(){
				KC3QuestManager.clear();
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			
			// Manual quest count overrides
			$(".flowchart").on("click", ".questOverride", function(){
				var editingQuest = KC3QuestManager.get($(this).data("id"));
				if(typeof editingQuest.tracking != "undefined"){
					// +1
					if( $(this).hasClass("questAdd") ){
						if(editingQuest.tracking[0][0] < editingQuest.tracking[0][1]){
							editingQuest.tracking[0][0]++;
						}
					
					// -1
					}else if( $(this).hasClass("questMinus") ){
						if(editingQuest.tracking[0][0] > 0){
							editingQuest.tracking[0][0]--;
						}
					}
					
					KC3QuestManager.save();
					$(this).parent().find(".questCount").text( editingQuest.outputShort() );
				}
			});
			
			// Manual override quest status
			$(".flowchart").on("click", ".questToggle", function(){
				var editingQuest = KC3QuestManager.get($(this).data("id"));
				console.log(editingQuest.status);
				editingQuest.status++;
				if(editingQuest.status>=4){ editingQuest.status=0; }
				KC3QuestManager.save();
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			
			// Manual remove quest
			$(".page_padding").on("click", ".questRemove", function(){
				console.log(KC3QuestManager.list["q"+$(this).data("id")]);
				delete KC3QuestManager.list["q"+$(this).data("id")];
				KC3QuestManager.save();
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			
		},
		
		/* Add a branch item to the flowchart
		--------------------------------------------*/
		seedBranch :function( parentElement, quest_id ){
			// Add this quest to flowchartIds used as exceptions from extra quests at bottom
			this.flowchartIds.push(quest_id);
			
			// Get meta data of this quest
			var thisQuest = KC3Meta.quest(quest_id);
			
			// Create quest HTML box and fill initial data
			var thisBox = $(".tab_flowchart .factory .questFlowItem").clone().appendTo("#"+parentElement.attr("id"));
			$(".questIcon", thisBox).text( thisQuest.code );
			$(".questIcon", thisBox).addClass("type"+(String(quest_id).substring(0,1)));
			$(".questDesc", thisBox).text( thisQuest.desc);
			var title = quest_id+": ["+thisQuest.code+"] "+thisQuest.name+"\n"+thisQuest.desc;
			if(!!thisQuest.memo) {
				title += "\n" + thisQuest.memo;
			}
			$(".questDesc", thisBox).attr("title", title);
			$(".questOverride", thisBox).data("id", quest_id);
			$(".questToggle", thisBox).data("id", quest_id);
			$(".questRemove", thisBox).data("id", quest_id);
			
			// If we have player data about the quest, not just meta data from json
			if(typeof KC3QuestManager.list["q"+quest_id] != "undefined"){
				var questRecord = KC3QuestManager.list["q"+quest_id];
				
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
							"background-repeat": "no-repeat",
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
							"background-repeat": "no-repeat",
							"margin-right": "0px"
						});
						break;
						
					// Else
					default:
						$(".questInfo", thisBox).addClass("disabled");
						break;
				}
				
				$(".questCount", thisBox).text( questRecord.outputShort() );
				
				if(typeof questRecord.tracking != "undefined"){
					$(".questTrack", thisBox).show();
				}
				
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
					if(KC3QuestManager.isPeriod(thisQuest.unlock[ctr])){
						this.seedBranch( childContainer, thisQuest.unlock[ctr] );
					}
				}
			}
		},
		
		/* Add quest row to normal list
		--------------------------------------------*/
		addOtherQuest :function( thisQuest ){
			var masterQuest = KC3Meta.quest( thisQuest.id );
			// console.log(masterQuest, thisQuest);
			
			var thisBox = $(".tab_flowchart .factory .questExtraItem").clone().appendTo(".tab_flowchart .extralist");
			$(".questIcon", thisBox).text( masterQuest.code || thisQuest.id );
			$(".questIcon", thisBox).addClass("type"+(String(thisQuest.id).substring(0,1)));
			$(".questDesc", thisBox).text( masterQuest.desc || KC3Meta.term("UntranslatedQuest") );
			var title = thisQuest.id+": ["+(masterQuest.code||"N/A")+"] "
				+ (masterQuest.name || KC3Meta.term("UntranslatedQuest"))
				+ "\n"+(masterQuest.desc || KC3Meta.term("UntranslatedQuestTip"));
			if(!!masterQuest.memo) {
				title += "\n" + masterQuest.memo;
			}
			if(!!masterQuest.unlock) {
				var ctr;
				for(ctr in masterQuest.unlock) {
					var cq = KC3Meta.quest(masterQuest.unlock[ctr]);
					if(!!cq) title += "\n -> "+masterQuest.unlock[ctr]+": ["+(cq.code||"N/A")+"] "+cq.name;
				}
			}
			$(".questDesc", thisBox).attr("title", title);
			$(".questToggle", thisBox).data("id", thisQuest.id);
			$(".questRemove", thisBox).data("id", thisQuest.id);
			
			// Status-based actions
			switch(thisQuest.status){
				// Open
				case 1:
					$(thisBox).addClass("open");
					break;
				// Active
				case 2:
					$(thisBox).addClass("active");
					break;
				// Complete
				case 3:
					$(thisBox).addClass("complete");
					break;
				// Else
				default:
					$(thisBox).addClass("disabled");
					break;
			}
		}
		
	};
	
})();
