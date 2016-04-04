(function(){
	"use strict";

	window.WhoCallsTheFleetDb = {
		db: {},
		expectedShipCount: 417,
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
			return !!entry ? entry.stat : false;
		},

		getStockEquipment: function(shipId) {
			var entry = this.db["s"+shipId];
			return !!entry ? entry.equip : false;
		},

		getLoSInfo: function(shipId) {
			var entry = this.db["s"+shipId];
			return !!entry ? {
					base: entry.stat.los,
					max: entry.stat.los_max 
				} : false;
		}
	};
	
})();
