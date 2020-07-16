(function(){
	"use strict";
	
	KC3StrategyTabs.flowchart = new KC3StrategyTab("flowchart");
	
	KC3StrategyTabs.flowchart.definition = {
		tabSelf: KC3StrategyTabs.flowchart,
		showingAll: false,
		showQuestName: false,
		
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
			const self = this;
			// Flowchart root nodes
			const rootQuestTree = $(".tab_flowchart .flowchart ul.questTree");
			this.flowchartIds = [];
			this.seedBranch( rootQuestTree, 201 ); // Bd1
			this.seedBranch( rootQuestTree, 303 ); // Cd2
			this.seedBranch( rootQuestTree, 342 ); // C44
			this.seedBranch( rootQuestTree, 402 ); // Dd2
			this.seedBranch( rootQuestTree, 404 ); // Dw4
			this.seedBranch( rootQuestTree, 410 ); // Dw9
			this.seedBranch( rootQuestTree, 434 ); // D32
			this.seedBranch( rootQuestTree, 437 ); // D34
			this.seedBranch( rootQuestTree, 503 ); // Ed3
			this.seedBranch( rootQuestTree, 605 ); // Fd1
			this.seedBranch( rootQuestTree, 702 ); // Gd2
			this.seedBranch( rootQuestTree, 249 ); // Bm1
			this.seedBranch( rootQuestTree, 256 ); // Bm2
			this.seedBranch( rootQuestTree, 259 ); // Bm4
			this.seedBranch( rootQuestTree, 861 ); // Bq3
			this.seedBranch( rootQuestTree, 873 ); // Bq5
			this.seedBranch( rootQuestTree, 888 ); // Bq7
			this.seedBranch( rootQuestTree, 894 ); // Bq9
			this.seedBranch( rootQuestTree, 904 ); // By1
			this.seedBranch( rootQuestTree, 905 ); // By2
			this.seedBranch( rootQuestTree, 912 ); // By3
			
			// Other non-flowchart quests
			const rootQuestList = $(".tab_flowchart .extralist ul.questList");
			const otherQuests = [];
			for(let ctr in KC3QuestManager.list){
				const anotherQuest = KC3QuestManager.list[ctr];
				if(anotherQuest.id > 0 && this.flowchartIds.indexOf( anotherQuest.id ) === -1)
					otherQuests.push( anotherQuest );
			}
			// Sort by ID like in-game
			otherQuests.sort((a, b) => a.id - b.id);
			for(let otherQuest of otherQuests){
				this.addOtherQuest(otherQuest);
			}
			$(".tab_flowchart .extralist .complete").hide();
			
			$(".showName").on("click", function() {
				if(!self.showQuestName) {
					self.showQuestName = true;
					KC3StrategyTabs.reloadTab();
				}
			});
			$(".showDesc").on("click", function() {
				if(self.showQuestName) {
					self.showQuestName = false;
					KC3StrategyTabs.reloadTab();
				}
			});
			
			$(".showAll").on("click", function() {
				self.showingAll = true;
				$(".tab_flowchart .extralist .complete").show();
			});
			$(".hideAll").on("click", function() {
				self.showingAll = false;
				$(".tab_flowchart .extralist .complete").hide();
			});
			$(".tab_flowchart .extralist .complete").toggle(this.showingAll);
			
			$(".resetDailies").on("click", function(){
				if(confirm("Are you sure?")){
					KC3QuestManager.resetDailies();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetWeeklies").on("click", function(){
				if(confirm("Are you sure?")){
					KC3QuestManager.resetWeeklies();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetMonthlies").on("click", function(){
				if(confirm("Are you sure?")){
					KC3QuestManager.resetMonthlies();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetQuarterlies").on("click", function(){
				if(confirm("Are you sure?")){
					KC3QuestManager.resetQuarterlies();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetYearlies").on("click", function(){
				if(confirm("Are you sure?")){
					KC3QuestManager.resetYearlies("all");
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetAllQuests").on("click", function(){
				if(confirm(`Are you sure?
All your quest data will be cleared, including 1-time quests you have done. Lost data would not be recovered. `)){
					KC3QuestManager.clear();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
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
				console.log("Quest status before", editingQuest.status);
				editingQuest.status++;
				if(editingQuest.status>=4){ editingQuest.status=0; }
				KC3QuestManager.save();
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			
			// Manual remove quest
			$(".page_padding").on("click", ".questRemove", function(){
				var removingQuest = KC3QuestManager.get($(this).data("id"));
				console.log("Quest to be removed", removingQuest);
				if(KC3QuestManager.remove(removingQuest)){
					KC3QuestManager.save();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
		},
		
		/* Add a branch item to the flowchart
		--------------------------------------------*/
		seedBranch :function( parentElement, quest_id ){
			// Add this quest to flowchartIds used as exceptions from extra quests at bottom
			this.flowchartIds.push(quest_id);
			
			// Get meta data of this quest
			const thisQuest = KC3Meta.quest(quest_id);
			
			// Create quest HTML box and fill initial data
			const thisBox = $(".tab_flowchart .factory .questFlowItem")
				.clone().appendTo("#"+parentElement.attr("id"));
			$(".questIcon", thisBox).text( thisQuest.code );
			$(".questIcon", thisBox).addClass("type"+(String(quest_id).substring(0,1)));
			$(".questIcon", thisBox).on("mouseover", function(){
				$(this).next().tooltip("open");
			});
			$(".questIcon", thisBox).on("mouseleave", function(){
				$(this).next().tooltip("close");
			});
			$(".questDesc", thisBox).text( this.showQuestName ? thisQuest.name : thisQuest.desc );
			$(".questDesc", thisBox)
				.attr("title", KC3QuestManager.buildHtmlTooltip(quest_id, thisQuest, true, false))
				.lazyInitTooltip();
			$(".questOverride", thisBox).data("id", quest_id);
			$(".questToggle", thisBox).data("id", quest_id);
			$(".questRemove", thisBox).data("id", quest_id);
			
			// If we have player data about the quest, not just meta data from json
			if(KC3QuestManager.exists(quest_id)){
				var questRecord = KC3QuestManager.get(quest_id);
				
				if(!questRecord.tracking){
					$(".questTrack", thisBox).hide();
				} else {
					$(".questCount", thisBox).text( questRecord.outputShort() );
					if(questRecord.tracking.length > 1){
						$(".questCount", thisBox)
							.attr("title", questRecord.outputShort(true))
							.lazyInitTooltip();
					}
				}
				
				// Status-based actions
				switch(questRecord.status){
					// Open
					case 1:
						$(".questInfo", thisBox).addClass("open");
						break;
						
					// Active
					case 2:
						$(".questInfo", thisBox).addClass("active");
						$(".questInfo .questIcon", thisBox).addClass("progress");
						break;
						
					// Complete
					case 3:
						$(".questInfo", thisBox).addClass("complete");
						$(".questInfo .questIcon", thisBox).addClass("ticked");
						break;
						
					// Else
					default:
						$(".questInfo", thisBox).addClass("disabled");
						break;
				}
				
			// If we don't have player data about the quest
			}else{
				$(".questInfo", thisBox).addClass("disabled");
				$(".questTrack", thisBox).hide();
			}
			
			// If has children, show them under me
			if(typeof thisQuest.unlock != "undefined"){
				var childContainer = $("ul.questChildren", thisBox);
				childContainer.attr("id", "questBox_"+quest_id);
				for(let ctr in thisQuest.unlock){
					if(KC3QuestManager.isPeriod(thisQuest.unlock[ctr])){
						this.seedBranch( childContainer, thisQuest.unlock[ctr] );
					}
				}
			}
		},
		
		/* Add quest row to normal list
		--------------------------------------------*/
		addOtherQuest :function( thisQuest ){
			const questMeta = KC3Meta.quest( thisQuest.id );
			const thisBox = $(".tab_flowchart .factory .questExtraItem")
				.clone().appendTo(".tab_flowchart .extralist");
			$(".questIcon", thisBox).text( questMeta.code || thisQuest.id );
			$(".questIcon", thisBox).addClass("type"+(String(thisQuest.id).substring(0,1)));
			$(".questIcon", thisBox).on("mouseover", function(){
				$(this).next().tooltip("open");
			});
			$(".questIcon", thisBox).on("mouseleave", function(){
				$(this).next().tooltip("close");
			});
			$(".questDesc", thisBox).text(
				(this.showQuestName ? questMeta.name : questMeta.desc) || KC3Meta.term("UntranslatedQuest")
			);
			$(".questDesc", thisBox)
				.attr("title", KC3QuestManager.buildHtmlTooltip(thisQuest.id, questMeta))
				.lazyInitTooltip();
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
					$(".questIcon", thisBox).addClass("ticked");
					break;
				// Else
				default:
					$(thisBox).addClass("disabled");
					break;
			}
		}
		
	};
	
})();
