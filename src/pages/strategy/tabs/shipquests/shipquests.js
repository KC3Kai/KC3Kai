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
				const questsData = $.ajax('/data/ship_quests.json', { async: false }).responseText;
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
			mappedObj.quests = [];
			// remove duplicated quests and join left ones together
			const pushDistinctQuests = (ids = []) => {
				mappedObj.quests.push(...ids.filter(id => !mappedObj.quests.includes(id)));
			};
			// exactly matching current ship ID if there is the suffix `=`
			const questsForThisShipOnly = this.getShipQuests(shipObj.masterId + "=");
			pushDistinctQuests(questsForThisShipOnly);
			// matching by base remodel ID by default, that is like a suffix `>`
			const baseRemodelForm = RemodelDb.originOf(shipObj.masterId);
			const questsForBaseRemodel = this.getShipQuests(baseRemodelForm);
			pushDistinctQuests(questsForBaseRemodel);
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
					if(KC3QuestManager.get(questId).status === 3) {
						questDiv.addClass("completed");
					} else if(KC3QuestManager.active.includes(questId)) {
						questDiv.addClass("actived");
					} else if(KC3QuestManager.open.includes(questId)) {
						questDiv.addClass("opened");
					} else {
						questDiv.addClass("exists");
					}
				}

				questDiv.text(questMeta.code);
				questDiv.attr("title", KC3QuestManager.buildHtmlTooltip(questId, questMeta));
				$(".ship_quests", shipRow).append(questDiv);
			}
		}

	}

	KC3StrategyTabs.shipquests = new KC3StrategyTab("shipquests");
	KC3StrategyTabs.shipquests.definition = new KC3ShipQuestsDefinition();

})();
