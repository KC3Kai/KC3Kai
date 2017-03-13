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
			this.flowchartIds = [];
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
			
			$(".resetQuarterlies").on("click", function(){
				KC3QuestManager.resetQuarterlies();
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
				var removingQuest = KC3QuestManager.get($(this).data("id"));
				console.log(removingQuest);
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
			var thisQuest = KC3Meta.quest(quest_id);
			
			// Create quest HTML box and fill initial data
			var thisBox = $(".tab_flowchart .factory .questFlowItem").clone().appendTo("#"+parentElement.attr("id"));
			$(".questIcon", thisBox).text( thisQuest.code );
			$(".questIcon", thisBox).addClass("type"+(String(quest_id).substring(0,1)));
			$(".questIcon", thisBox).on("mouseover", function(){
				$(this).next().tooltip("open");
			});
			$(".questIcon", thisBox).on("mouseleave", function(){
				$(this).next().tooltip("close");
			});
			$(".questDesc", thisBox).text(thisQuest.desc);
			$(".questDesc", thisBox)
				.attr("title", this.buildQuestTooltip(quest_id, thisQuest, true))
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
			var questMeta = KC3Meta.quest( thisQuest.id );
			var thisBox = $(".tab_flowchart .factory .questExtraItem").clone().appendTo(".tab_flowchart .extralist");
			$(".questIcon", thisBox).text( questMeta.code || thisQuest.id );
			$(".questIcon", thisBox).addClass("type"+(String(thisQuest.id).substring(0,1)));
			$(".questIcon", thisBox).on("mouseover", function(){
				$(this).next().tooltip("open");
			});
			$(".questIcon", thisBox).on("mouseleave", function(){
				$(this).next().tooltip("close");
			});
			$(".questDesc", thisBox).text( questMeta.desc || KC3Meta.term("UntranslatedQuest") );
			$(".questDesc", thisBox)
				.attr("title", this.buildQuestTooltip(thisQuest.id, questMeta, false))
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
					break;
				// Else
				default:
					$(thisBox).addClass("disabled");
					break;
			}
		},
		
		buildQuestTooltip :function(questId, questMeta, isBranch){
			var title = "[{0:id}] {1:code} {2:name}".format(
				questId, questMeta.code || "N/A",
				questMeta.name || KC3Meta.term("UntranslatedQuest"));
			title += $("<p></p>").css("font-size", "11px")
				.css("margin-left", "1em")
				.css("text-indent", "-1em")
				.text(questMeta.desc || KC3Meta.term("UntranslatedQuestTip"))
				.prop("outerHTML");
			if(!!questMeta.memo) {
				title += $("<p></p>")
					.css("font-size", "11px")
					.css("color", "#69a").text(questMeta.memo)
					.prop("outerHTML");
			}
			if(!isBranch && !!questMeta.unlock) {
				for(let ctr in questMeta.unlock) {
					let cq = KC3Meta.quest(questMeta.unlock[ctr]);
					if(!!cq) title += "&emsp;" +
						$("<span></span>").css("font-size", "11px")
							.css("color", "#a96")
							.text("-> [{0:id}] {1:code} {2:name}"
								.format(questMeta.unlock[ctr], cq.code||"N/A", cq.name)
							).prop("outerHTML") + "<br/>";
				}
			}
			return title;
		}
		
	};
	
})();
