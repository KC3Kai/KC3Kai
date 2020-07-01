(function(){
	"use strict";

	window.WhoCallsTheFleetDb = {
		db: {},
		expectedShipCount: 615,
		expectedItemCount: 381,
		init: function(repo) {
			var self = this;
			var loadAndParseDb = function(prefix, filename, expectedCount) {
				var rawDb = $.ajax({
					url : repo + 'data/' + filename,
					async: false
				}).responseText;

				/**
				 * WhoCallsTheFleet-DB using nedb storage, which is a line separated json-like format.
				 * @see https://github.com/louischatriot/nedb
				 */
				var content = rawDb
					.split("\n")
					.map( function(x) {
						try {
							return x ? JSON.parse(x) : false;
						} catch (e) {
							return false;
						}
					})
					.filter( function(x) {return x;});
				
				if (content.length < expectedCount) {
					console.warn("WhoCallsTheFleetDB: unexpected entity number,",
								 filename, "might has been changed.");
				} else if(content.length > expectedCount) {
					console.info("WhoCallsTheFleetDB:", filename, "has been updated,",
								 "commit `expected(Ship|Item)Count: " + content.length +
								 ",` instead of `" + expectedCount + "` plz.");
				}

				$.each( content, function(i,x) {
					self.db[(prefix || "s") + x.id] = x;
				});

				return content.length;
			};

			this.db = {};
			this.expectedShipCount = loadAndParseDb("s", "WhoCallsTheFleet_ships.nedb", this.expectedShipCount);
			this.expectedItemCount = loadAndParseDb("i", "WhoCallsTheFleet_items.nedb", this.expectedItemCount);
		},

		getShipStat: function(shipId) {
			var entry = this.db["s"+shipId];
			return entry ? entry.stat : false;
		},

		getStockEquipment: function(shipId) {
			var entry = this.db["s"+shipId];
			return entry ? entry.equip : false;
		},

		getEquippedSlotCount: function(shipId) {
			var entry = this.db["s"+shipId];
			return entry ? entry.equip.reduce(
				function(p, c){
					if(!!c) return p+1; else return p;
				}, 0) : false;
		},

		getLoSInfo: function(shipId) {
			return this.getStatBound(shipId, 'los');
		},

		getStatBound: function(shipId, stat) {
			console.assert(stat === 'los' || stat === 'asw' || stat === 'evasion',
				   "stat should be one of: los / asw / evasion");
			var entry = this.db["s"+shipId];
			return entry ? {
				base: entry.stat[stat],
				max: entry.stat[stat + "_max"] 
			} : false;
		},

		estimateStat: function(statBound, level) {
			var self = this;
			if (!statBound || statBound.base < 0 || (statBound.base !== 0 && !statBound.base)
				|| statBound.max < 0 || (statBound.max !== 0 && !statBound.max))
				return false;
			var retVal = statBound.base +
				Math.floor((statBound.max - statBound.base)*level / 99.0);
			return retVal;
		},

		estimateStatBase: function(stat, statMax, level) {
			var retVal = stat / (( 99 - level) / 99.0)
				- statMax * level / ( 99 - level);
			return Math.ceil(retVal);
		},

		getShipRemodel: function(shipId) {
			var entry = this.db["s"+shipId];
			return entry ? entry.remodel : false;
		},

		getItemImprovement: function(itemId) {
			var entry = this.db["i"+itemId];
			return !entry ? undefined : entry.improvement ? entry.improvement : false;
		}
	};
	
})();
