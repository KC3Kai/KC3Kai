(function(){
	"use strict";

	window.WhoCallsTheFleetDb = {
		db: {},
		expectedShipCount: 429,
		init: function(repo) {
			var rawDb = $.ajax({
				url : repo + 'assets/js/WhoCallsTheFleetShipDb.json',
				async: false
			}).responseText;

			var content = rawDb
				.split("\n")
				.map( function(x) {
					try {
						return JSON.parse(x); 
					} catch (e) {
						return false;
					}
				})
				.filter( function(x) {return x;});
			if (content.length < this.expectedShipCount) {
				console.warn("Unexpected entity number,",
							 "WhoCallsTheFleetShipDb.json might has been changed.");
			} else if(content.length > this.expectedShipCount) {
				console.info("WhoCallsTheFleetShipDb.json has been updated,",
							 "commit `expectedShipCount: " + content.length +
							 ",` instead of `" + this.expectedShipCount + "` plz.");
				this.expectedShipCount = content.length;
			}

			var db = {};
			$.each( content, function(i,x) {
				db["s"+x.id] = x;
			});

			this.db = db;
		},

		getShipStat: function(shipId) {
			var entry = this.db["s"+shipId];
			return entry ? entry.stat : false;
		},

		getStockEquipment: function(shipId) {
			var entry = this.db["s"+shipId];
			return entry ? entry.equip : false;
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
			if (!statBound || statBound.base < 0 || statBound.max < 0)
				return false;
			var retVal = statBound.base +
				Math.floor((statBound.max - statBound.base)*level / 99.0);
			return retVal;
		}
	};
	
})();
