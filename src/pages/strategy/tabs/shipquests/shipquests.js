(function(){
	"use strict";

	class KC3ShipQuestsDefinition extends KC3ShipListGrid {
		constructor() {
			super("shipquests");
		}

		/* INIT
		Prepares initial static data needed.
		---------------------------------*/
		init() {
			this.shipQuests = {};
			// Load relationship data of ships and quests
			try {
				const questsData = $.ajax('../../data/ship_quests.json', { async: false }).responseText;
				this.shipQuests = JSON.parse(questsData);
			} catch(e) {
				console.error("Loading ship quests data failed", e);
			}
			this.showListRowCallback = this.showShipQuests;
			this.defaultSorterDefinitions();
		}

		/* RELOAD
		Loads latest player or game data if needed.
		---------------------------------*/
		reload() {
			KC3ShipManager.load();
			KC3QuestManager.load();
			this.prepareShipList(true, this.mapShipQuests);
		}

		/* EXECUTE
		Places data onto the interface from scratch.
		---------------------------------*/
		execute() {
			this.shipListDiv = $(".tab_shipquests .ship_list");
			this.shipRowTemplateDiv = $(".tab_shipquests .factory .ship_item");
			this.registerShipListHeaderEvent(
				$(".tab_shipquests .ship_header .ship_field.hover")
			);
			this.showListGrid();
		}

		getShipQuests(baseFormMasterId) {
			var entry = this.shipQuests[baseFormMasterId];
			return entry ? entry : [];
		}

		mapShipQuests(shipObj) {
			const mappedObj = this.defaultShipDataMapping(shipObj);
			const baseRemodelForm = RemodelDb.originOf(shipObj.masterId);
			mappedObj.quests = this.getShipQuests(baseRemodelForm);
			return mappedObj;
		}

		showShipQuests(ship, shipRow) {
			for(let questId of ship.quests) {
				const questMeta = KC3Meta.quest(questId);
				const questDiv = $("<div />")
					.addClass("ship_field ship_stat questIcon")
					.addClass("type" + String(questId).substr(0, 1));

				// If we have player data about the quest
				if(KC3QuestManager.exists(questId)) {
					questDiv.addClass("exists");
				}

				questDiv.text(questMeta.code);
				questDiv.attr("title", this.buildQuestTooltip(questId, questMeta));
				$(".ship_quests", shipRow).append(questDiv);
			}
		}

		buildQuestTooltip(questId, questMeta) {
			let title = "[{0:id}] {1:code} {2:name}".format(
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
			if(!!questMeta.unlock) {
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
	}

	KC3StrategyTabs.shipquests = new KC3StrategyTab("shipquests");
	KC3StrategyTabs.shipquests.definition = new KC3ShipQuestsDefinition();

})();
