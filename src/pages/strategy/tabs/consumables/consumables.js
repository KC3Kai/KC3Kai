(function(){
	"use strict";
	
	KC3StrategyTabs.consumables = new KC3StrategyTab("consumables");
	
	KC3StrategyTabs.consumables.definition = new KC3Graphable('useitem', {
		name  :["bucket", "devmat", "screw", "torch"],
		full  :["Bucket", "DevMat", "Screw", "Torch"],
		dbkey :["bucket", "devmat", "screw", "torch"],
		colorhex :["00CC00", "009999", "CCCCCC", "FFCC66"],
		colorbyte:["  0,204,  0", "  0,153,153", "204,204,204", "255,204,102"]
	});
	
	// Extend original `execute` method to show more data
	KC3StrategyTabs.consumables.definition.originExecute = KC3StrategyTabs.consumables.definition.execute;
	KC3StrategyTabs.consumables.definition.execute = function() {
		this.originExecute();
		this.listAllItems();
	};
	
	KC3StrategyTabs.consumables.definition.listAllItems = function() {
		PlayerManager.loadConsumables();
		const id2NameMap = PlayerManager.getConsumableById(),
			name2IdMap = Object.swapMapKeyValue(id2NameMap, true);
		//console.debug("Player current consumables", PlayerManager.consumables);
		$(".item_list").empty();
		if(typeof PlayerManager.consumables === "object"
			&& Object.keys(PlayerManager.consumables).length) {
			// Preserve item order untouched for now
			Object.keys(PlayerManager.consumables).forEach(attrName => {
				const itemId = name2IdMap[attrName],
					itemValue = PlayerManager.consumables[attrName] || 0;
				// Show frequently used item even its amount is 0
				if(itemId && (itemId < 49 || itemValue > 0)) {
					const iconSrc = KC3Meta.useitemIcon(itemId);
					const itemName = KC3Meta.useItemName(itemId) || KC3Meta.term("Unknown");
					// Template factory not used for this simple element
					const itemBox = $("<div class='item'></div>").appendTo(".item_list");
					$("<img />").attr("src", iconSrc)
						.attr("title", itemId)
						.appendTo(itemBox);
					$("<div class='name'></div>").text(itemName)
						.attr("title", itemName)
						.appendTo(itemBox);
					$("<div class='value'></div>").text(itemValue).appendTo(itemBox);
				}
			});
		}
	};
	
})();