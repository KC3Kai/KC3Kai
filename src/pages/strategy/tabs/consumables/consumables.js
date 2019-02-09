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
		// For those known item IDs not given an icon by game, eg: Strait/Sho-go medal
		const noIconIds = [5, 6, 7, 8, 9, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
			25, 26, 27, 28, 29, 30, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48,
			79, 81, 82, 83, 84];
		$(".item_list").empty();
		if(typeof PlayerManager.consumables === "object"
			&& Object.keys(PlayerManager.consumables).length) {
			// Preserve item order untouched for now
			Object.keys(PlayerManager.consumables).forEach(attrName => {
				const itemId = name2IdMap[attrName],
					itemValue = PlayerManager.consumables[attrName] || 0;
				// Show frequently used item even its amount is 0
				if(itemId && (itemId < 49 || itemValue > 0)) {
					const iconSrc = noIconIds.includes(itemId) ?
						"/assets/img/ui/empty.png" :
						`/assets/img/useitems/${itemId}.png`;
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