(function(){
	"use strict";
	
	KC3StrategyTabs.mstupdate = new KC3StrategyTab("mstupdate");
	
	KC3StrategyTabs.mstupdate.definition = {
		tabSelf: KC3StrategyTabs.mstupdate,
		newShips: [],
		newGears: [],
		newCgs: [],
		archivedCgs: [],
		myServerIp: "",
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			this.myServerIp = (new KC3Server()).setNum( PlayerManager.hq.server ).ip;
		},
		
		/* RELOAD
		Prepares latest fleets data
		---------------------------------*/
		reload :function(){
			const self = this;
			const timeNow = Date.now();
			this.newShips.length = 0;
			this.newGears.length = 0;
			this.newCgs.length = 0;
			this.archivedCgs.length = 0;
			var masterChanged = false;
			KC3Master.load();
			const checkExpired = (masterColle, colleName, removeMethod, resolveMethod) => {
				$.each(masterColle, function(mstId, timeAdded) {
					if(timeNow - timeAdded > KC3Master.newUpdatesExpiredAfter) {
						removeMethod.call(KC3Master, mstId);
						console.debug("{0} {1} has expired from update list".format(colleName, mstId));
						masterChanged = true;
					} else {
						resolveMethod.call(self, mstId);
					}
				});
			};
			checkExpired(KC3Master.new_ships(), "Ship", KC3Master.remove_new_ship, (id) => {
				this.newShips.push(KC3Master.ship(id));
			});
			checkExpired(KC3Master.new_slotitems(), "Item", KC3Master.remove_new_slotitem, (id) => {
				this.newGears.push(KC3Master.slotitem(id));
			});
			checkExpired(KC3Master.new_graphs(), "Removed CG", KC3Master.remove_new_graphs, (id) => {
				if(KC3Master.isSeasonalShip(id)) {
					this.archivedCgs.push(id);
				}
			});
			checkExpired(KC3Master.changed_graphs(), "New CG", KC3Master.remove_changed_graphs, (id) => {
				if(KC3Master.isRegularShip(id)) {
					this.newCgs.push(KC3Master.ship(id));
				}
			});
			if(masterChanged){
				KC3Master.save();
			}
			console.debug("New data", this.newShips, this.newGears, this.newCgs, this.archivedCgs);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".tab_mstupdate .runtime_id").text(chrome.runtime.id);
			
			var shipBox, gearBox, shipFile, shipVersion, shipSrc, appendToBox;
			var self = this;
			var linkClickFunc = function(e){
				KC3StrategyTabs.gotoTab($(this).data("tab"), $(this).data("api_id"));
			};

			// New Ship list
			$.each(this.newShips, function(index, shipData){
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph(shipData.api_id).api_filename;
				shipVersion = KC3Master.graph(shipData.api_id).api_version[0];
				shipSrc = "/assets/swf/card.swf?sip=" + self.myServerIp + "&shipFile=" + shipFile;
				
				if (KC3Master.isSeasonalShip(shipData.api_id)) {
					// SEASONAL CG, no longer work since 2017-04-05 no seasonal item leak
					shipSrc += "&abyss=0&forceFrame=8";
					appendToBox = ".tab_mstupdate .mstseason";
				} else if (KC3Master.isAbyssalShip(shipData.api_id)) {
					// ABYSSALS
					shipSrc += "&abyss=1"+(!shipVersion?"":"&ver="+shipVersion);
					appendToBox = ".tab_mstupdate .mstabyss";
				} else {
					// NON-SEASONAL CG
					shipSrc += "&abyss=0"+(!shipVersion?"":"&ver="+shipVersion);
					appendToBox = ".tab_mstupdate .mstships";
				}
				
				shipSrc += !shipVersion ? "" : "&ver="+shipVersion;
				
				$(".ship_cg embed", shipBox).attr("src", shipSrc).attr("menu", "false");
				$(".ship_name", shipBox).text( KC3Meta.shipName( shipData.api_name ) );
				$(".ship_name", shipBox).data("tab", "mstship");
				$(".ship_name", shipBox).data("api_id", shipData.api_id);
				$(".ship_name", shipBox).click(linkClickFunc);
				
				shipBox.appendTo(appendToBox);
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstships");

			// New Equipment List
			$.each(this.newGears, function(index, GearData){
				gearBox = $(".tab_mstupdate .factory .mstgear").clone();
				
				if(!KC3Master.isAbyssalGear(GearData.api_id)){
					var paddedId = (GearData.api_id<10?"00":GearData.api_id<100?"0":"")+GearData.api_id;
					$(".gear_cg img", gearBox).attr("src",
						"http://" + self.myServerIp + "/kcs/resources/image/slotitem/card/" + paddedId + ".png");
				}else{
					$(".gear_cg img", gearBox).hide();
				}
				
				$(".gear_name", gearBox).text( KC3Meta.gearName( GearData.api_name ) );
				$(".gear_name", gearBox).data("tab", "mstgear");
				$(".gear_name", gearBox).data("api_id", GearData.api_id);
				$(".gear_name", gearBox).click(linkClickFunc);
				
				gearBox.appendTo(".tab_mstupdate .mstgears");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstgears");
			
			// New Ship Seasonal CG
			$.each(this.newCgs, function(index, shipData){
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph(shipData.api_id).api_filename;
				shipVersion = KC3Master.graph(shipData.api_id).api_version[0];
				shipSrc = "/assets/swf/card.swf?sip=" + self.myServerIp + "&shipFile=" + shipFile;
				shipSrc += "&abyss=0&forceFrame=10";
				shipSrc += !shipVersion ? "" : "&ver=" + shipVersion;
				
				$(".ship_cg embed", shipBox).attr("src", shipSrc).attr("menu", "false");
				$(".ship_name", shipBox).text( KC3Meta.shipName( shipData.api_name ) );
				$(".ship_name", shipBox).data("tab", "mstship");
				$(".ship_name", shipBox).data("api_id", shipData.api_id);
				$(".ship_name", shipBox).click(linkClickFunc);
				
				shipBox.appendTo(".tab_mstupdate .mstgraph");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstgraph");
			
			// Archived (removed) Ship Seasonal CG
			$.each(this.archivedCgs, function(index, shipId){
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph(shipId).api_filename;
				shipVersion = KC3Master.graph(shipId).api_version[0];
				shipSrc = "/assets/swf/card.swf?sip=" + self.myServerIp + "&shipFile=" + shipFile;
				shipSrc += "&abyss=0&forceFrame=8";
				shipSrc += !shipVersion ? "" : "&ver=" + shipVersion;
				var seasonalData = KC3Master.seasonal_ship(shipId);
				
				$(".ship_cg embed", shipBox).attr("src", shipSrc).attr("menu", "false");
				$(".ship_name", shipBox).text(seasonalData ? seasonalData.api_name : "Link not available");
				$(".ship_name", shipBox).data("tab", "mstship");
				$(".ship_name", shipBox).data("api_id", shipId);
				$(".ship_name", shipBox).click(linkClickFunc);
				
				shipBox.appendTo(".tab_mstupdate .mstseason");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstseason");
			
		}
		
	};
	
})();
