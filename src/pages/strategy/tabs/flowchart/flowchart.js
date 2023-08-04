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
			this.seedBranch( rootQuestTree, 303 ); // Cd1
			this.seedBranch( rootQuestTree, 342 ); // C44/Cq1
			this.seedBranch( rootQuestTree, 345 ); // C49/Cy1
			this.seedBranch( rootQuestTree, 346 ); // C50/Cy2
			this.seedBranch( rootQuestTree, 348 ); // C53/Cy3
			this.seedBranch( rootQuestTree, 350 ); // C55/Cy4
			this.seedBranch( rootQuestTree, 353 ); // C58/Cy5
			this.seedBranch( rootQuestTree, 354 ); // C60/Cy6
			this.seedBranch( rootQuestTree, 355 ); // C62/Cy7
			this.seedBranch( rootQuestTree, 357 ); // C66/Cy9
			this.seedBranch( rootQuestTree, 362 ); // C72/Cy10
			this.seedBranch( rootQuestTree, 368 ); // Cy11
			this.seedBranch( rootQuestTree, 402 ); // Dd2
			this.seedBranch( rootQuestTree, 404 ); // Dw4
			this.seedBranch( rootQuestTree, 410 ); // Dw9
			this.seedBranch( rootQuestTree, 434 ); // D32/Dy1
			this.seedBranch( rootQuestTree, 437 ); // D34/Dy3
			this.seedBranch( rootQuestTree, 439 ); // D36/Dy5
			this.seedBranch( rootQuestTree, 442 ); // D38/Dy7
			this.seedBranch( rootQuestTree, 444 ); // D40/Dy8
			this.seedBranch( rootQuestTree, 503 ); // Ed1
			this.seedBranch( rootQuestTree, 605 ); // Fd1
			this.seedBranch( rootQuestTree, 655 ); // F94/Fy3
			this.seedBranch( rootQuestTree, 681 ); // F95/Fy4
			this.seedBranch( rootQuestTree, 1103); // F98/Fy5
			this.seedBranch( rootQuestTree, 1105); // F100/Fy7
			this.seedBranch( rootQuestTree, 1107); // F102/Fy8
			this.seedBranch( rootQuestTree, 1120); // F113/Fy9
			this.seedBranch( rootQuestTree, 1123); // F114/Fy10
			this.seedBranch( rootQuestTree, 702 ); // Gd1
			this.seedBranch( rootQuestTree, 716 ); // G8/Gy3
			this.seedBranch( rootQuestTree, 249 ); // Bm1
			this.seedBranch( rootQuestTree, 256 ); // Bm2
			this.seedBranch( rootQuestTree, 259 ); // Bm4
			this.seedBranch( rootQuestTree, 861 ); // Bq3
			this.seedBranch( rootQuestTree, 873 ); // Bq5
			this.seedBranch( rootQuestTree, 888 ); // Bq7
			this.seedBranch( rootQuestTree, 894 ); // Bq9
			this.seedBranch( rootQuestTree, 904 ); // By1
			this.seedBranch( rootQuestTree, 912 ); // By3
			this.seedBranch( rootQuestTree, 928 ); // By5
			this.seedBranch( rootQuestTree, 973 ); // By11
			
			// Other non-flowchart quests
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
			const completeExtralist = $(".tab_flowchart .extralist .complete");
			completeExtralist.hide();
			
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
			completeExtralist.toggle(this.showingAll);
			
			$(".resetDailies").on("click", function(){
				if(confirm(KC3Meta.term("QuestFlowchartConfirm"))){
					KC3QuestManager.resetDailies();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetWeeklies").on("click", function(){
				if(confirm(KC3Meta.term("QuestFlowchartConfirm"))){
					KC3QuestManager.resetWeeklies();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetMonthlies").on("click", function(){
				if(confirm(KC3Meta.term("QuestFlowchartConfirm"))){
					KC3QuestManager.resetMonthlies();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetQuarterlies").on("click", function(){
				if(confirm(KC3Meta.term("QuestFlowchartConfirm"))){
					KC3QuestManager.resetQuarterlies();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			$(".resetYearlies").on("click", function(){
				if(confirm(KC3Meta.term("QuestFlowchartYearlyPrompt"))){
					if(confirm(KC3Meta.term("QuestFlowchartConfirm"))){
						KC3QuestManager.resetYearlies("all");
						KC3StrategyTabs.reloadTab(undefined, true);
					}
				} else {
					if(confirm(KC3Meta.term("QuestFlowchartConfirm"))){
						KC3QuestManager.resetYearlies();
						KC3StrategyTabs.reloadTab(undefined, true);
					}
				}
			});
			
			$(".resetAllQuests").on("click", function(){
				if(confirm(KC3Meta.term("QuestFlowchartAllPrompt"))){
					KC3QuestManager.clear();
					KC3StrategyTabs.reloadTab(undefined, true);
				}
			});
			
			const rewardFilterTypes = ["Torches", "Buckets", "DevMats", "Screws"].map(str => `contains${str}`);
			$(".questFilter").on("click", function(e) {
				const filterId = parseInt(e.target.dataset.filterid, 10);
				$(".flowchart .questFlowItem, .extralist .questExtraItem").each(function() {
					$(this).addClass("questFilterHidden").removeClass(rewardFilterTypes.join(" "));
					const rewardItems = $(".questDesc:first", this).data("rewardConsumables");
					if (rewardItems && rewardItems[filterId] > 0) {
						$(this).removeClass("questFilterHidden").addClass(rewardFilterTypes[filterId]);
						$(this).parents(".questFlowItem, .questExtraItem").removeClass("questFilterHidden");
					}
				});
			});
			
			$(".showEverything").on("click", function() {
				$(".flowchart .questFlowItem, .extralist .questExtraItem")
					.removeClass("questFilterHidden").removeClass(rewardFilterTypes.join(" "));
			});
			
			// Manual quest count overrides
			const flowchart = $(".flowchart");
			flowchart.on("click", ".questOverride", function(){
				const editingQuest = KC3QuestManager.get($(this).data("id"));
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
			flowchart.on("click", ".questToggle", function(){
				const editingQuest = KC3QuestManager.get($(this).data("id"));
				console.log("Quest status before", editingQuest.status);
				editingQuest.status++;
				if(editingQuest.status>=4){ editingQuest.status=0; }
				KC3QuestManager.save();
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			
			// Manual remove quest
			$(".page_padding").on("click", ".questRemove", function(){
				const removingQuest = KC3QuestManager.get($(this).data("id"));
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
			$(".questIcon", thisBox).text(thisQuest.code);
			$(".questIcon", thisBox).addClass(KC3Quest.getIconClass(quest_id));
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
			$(".questDesc", thisBox).data("rewardConsumables", thisQuest.rewardConsumables);
			$(".questOverride", thisBox).data("id", quest_id);
			$(".questToggle", thisBox).data("id", quest_id);
			$(".questRemove", thisBox).data("id", quest_id);
			
			// If we have player data about the quest, not just metadata from json
			if(KC3QuestManager.exists(quest_id)){
				const questRecord = KC3QuestManager.get(quest_id);
				$(".questIcon", thisBox).addClass(questRecord.getLabelClass());
				
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
			
			// If the quest has children, show them under me
			if(typeof thisQuest.unlock != "undefined"){
				const childContainer = $("ul.questChildren", thisBox);
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
			$(".questIcon", thisBox).text(questMeta.code || thisQuest.id);
			$(".questIcon", thisBox).addClass(thisQuest.getIconClass())
				.addClass(thisQuest.getLabelClass());
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
			$(".questDesc", thisBox).data("rewardConsumables", questMeta.rewardConsumables);
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
