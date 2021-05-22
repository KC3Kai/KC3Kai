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
		listedShipId: 1,
		shipsPerPage: 18,
		
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
			this.listedShipId = 1;
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
			checkExpired(KC3Master.new_graphs(), "New Graph", KC3Master.remove_new_graphs, (id) => {
				// Only seasonal IDs needed, other parts are same things with new ships
				if(KC3Master.isSeasonalShip(id)) {
					this.archivedCgs.push(id);
				}
			});
			checkExpired(KC3Master.changed_graphs(), "Updated Graph", KC3Master.remove_changed_graphs, (id) => {
				if(KC3Master.isRegularShip(id)) {
					this.newCgs.push(KC3Master.ship(id));
				} else {
					console.debug("Seasonal CG or Abyssals graph {0} version change detected".format(id));
				}
			});
			if(masterChanged){
				KC3Master.save();
			}
			console.debug("Current updates", this.newShips, this.newGears, this.newCgs, this.archivedCgs);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".tab_mstupdate .runtime_id").text(chrome.runtime.id);
			
			const self = this;
			const linkClickFunc = function(e){
				KC3StrategyTabs.gotoTab($(this).data("tab"), $(this).data("api_id"));
			};
			var shipBox, gearBox, shipFile, shipVersion, shipSrc, shipPng, appendToBox;

			// New Ship list
			$.each(this.newShips, function(index, shipData) {
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph(shipData.api_id).api_filename;
				shipVersion = (KC3Master.graph(shipData.api_id).api_version || [])[0];
				shipSrc = "/assets/swf/card.swf?sip=" + self.myServerIp + "&shipFile=" + shipFile;
				
				if (KC3Master.isSeasonalShip(shipData.api_id)) {
					// SEASONAL CG, no longer work since 2017-04-05 no seasonal item leak
					// don't handle it here even seasonal leak again since 2017-09-12
					return;
				} else if (KC3Master.isAbyssalShip(shipData.api_id)) {
					// ABYSSAL
					shipSrc += "&abyss=1" + (!shipVersion ? "" : "&ver=" + shipVersion);
					// try to fix CG coordinate offset, only battle exists for abyssal
					let [coordX, coordY] = KC3Master.graph(shipData.api_id).api_battle_n;
					coordX = Math.floor(coordX * 0.4) - 150;
					coordX = Math.floor(coordX * 0.4) - 40;
					shipSrc += "&forceX=" + coordX + "&forceY=" + coordY;
					appendToBox = ".tab_mstupdate .mstabyss";
					shipPng = KC3Master.png_file(shipData.api_id, "full", "ship");
				} else {
					// NON-SEASONAL CG
					// show default card frame, no coordinate adjustment needed
					shipSrc += "&abyss=0" + (!shipVersion ? "" : "&ver=" + shipVersion);
					appendToBox = ".tab_mstupdate .mstships";
					shipPng = KC3Master.png_file(shipData.api_id, "card", "ship");
				}
				
				shipSrc += !shipVersion ? "" : "&ver=" + shipVersion;
				shipPng += !shipVersion ? "" : "?version=" + shipVersion;
				
				if(KC3Meta.isAF() && shipData.api_id == KC3Meta.getAF(4)) {
					$(".ship_cg img", shipBox).attr("src", KC3Meta.getAF(3).format("bk"));
				} else {
					$(".ship_cg img", shipBox).attr("src", `http://${self.myServerIp}/kcs2/resources${shipPng}`);
				}
				$(".ship_name", shipBox).text( KC3Meta.shipName( shipData.api_id ) )
					.data("tab", "mstship")
					.data("api_id", shipData.api_id)
					.attr("data-mst-id", shipData.api_id)
					.attr("data-swf", shipSrc)
					.attr("title", "[{0}]".format(shipData.api_id))
					.click(linkClickFunc);
				
				shipBox.appendTo(appendToBox);
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstships");

			// New Equipment List
			$.each(this.newGears, function(index, gearData) {
				gearBox = $(".tab_mstupdate .factory .mstgear").clone();
				
				if(!KC3Master.isAbyssalGear(gearData.api_id)) {
					const cardPng = KC3Master.png_file(gearData.api_id, "card", "slot");
					$(".gear_cg img", gearBox).attr("src",
						`http://${self.myServerIp}/kcs2/resources${cardPng}`);
				} else {
					$(".gear_cg img", gearBox).hide();
				}
				
				$(".gear_name", gearBox).text( KC3Meta.gearName( gearData.api_name ) )
					.data("tab", "mstgear")
					.data("api_id", gearData.api_id)
					.attr("data-mst-id", gearData.api_id)
					.attr("title", "[{0}]".format(gearData.api_id))
					.click(linkClickFunc);
				
				gearBox.appendTo(".tab_mstupdate .mstgears");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstgears");
			
			// New Ship Seasonal CG
			$.each(this.newCgs, function(index, shipData) {
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph(shipData.api_id).api_filename;
				shipVersion = (KC3Master.graph(shipData.api_id).api_version || [])[0];
				shipSrc = "/assets/swf/card.swf?sip=" + self.myServerIp + "&shipFile=" + shipFile;
				shipSrc += "&abyss=0&forceFrame=10";
				// try to fix seasonal CG coordinate offset based on battle values
				const [coordX, coordY] = KC3Master.graph(shipData.api_id).api_battle_n;
				shipSrc += "&forceX=" + (coordX - 160) + "&forceY=" + (coordY - 120);
				shipSrc += !shipVersion ? "" : "&ver=" + shipVersion;
				shipPng = KC3Master.png_file(shipData.api_id, "full", "ship");
				shipPng += !shipVersion ? "" : "?version=" + shipVersion;
				
				$(".ship_cg img", shipBox).attr("src", `http://${self.myServerIp}/kcs2/resources${shipPng}`);
				$(".ship_name", shipBox).text( KC3Meta.shipName( shipData.api_name ) )
					.data("tab", "mstship")
					.data("api_id", shipData.api_id)
					.attr("data-mst-id", shipData.api_id)
					.attr("title", "[{0}]".format(shipData.api_id))
					.attr("data-coord", [coordX, coordY].join(','))
					.attr("data-swf", shipSrc)
					.click(linkClickFunc);
				
				shipBox.appendTo(".tab_mstupdate .mstgraph");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstgraph");
			
			// Archived (removed) Ship Seasonal CG
			$.each(this.archivedCgs, function(index, shipId) {
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph(shipId).api_filename;
				shipVersion = (KC3Master.graph(shipId).api_version || [])[0];
				shipSrc = "/assets/swf/card.swf?sip=" + self.myServerIp + "&shipFile=" + shipFile;
				shipSrc += "&abyss=0&forceFrame=8";
				shipSrc += "&forceX=-40&forceY=-30";
				shipSrc += !shipVersion ? "" : "&ver=" + shipVersion;
				const seasonalData = KC3Master.seasonal_ship(shipId);
				shipPng = KC3Master.png_file(shipId, "character_full", "ship");
				shipPng += !shipVersion ? "" : "?version=" + shipVersion;
				
				$(".ship_cg img", shipBox).attr("src", `http://${self.myServerIp}/kcs2/resources${shipPng}`);
				$(".ship_name", shipBox).text(seasonalData && seasonalData.api_name ?
					seasonalData.api_name : "Not available")
					.data("tab", "mstship")
					.data("api_id", shipId)
					.attr("data-mst-id", shipId)
					.attr("title", "[{0}]".format(shipId))
					.attr("data-swf", shipSrc);
				if(seasonalData) {
					$(".ship_name", shipBox).click(linkClickFunc);
				} else {
					$(".ship_name", shipBox).removeClass("hover");
				}
				
				shipBox.appendTo(".tab_mstupdate .mstseason");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstseason");
			$(".page_padding").createChildrenTooltips();
			
			const toggleImageFunc = function(e) {
				const cgElm = $(this), imgElm = $("img", cgElm);
				const isFullImage = !cgElm.hasClass("char_image");
				cgElm.toggleClass("char_image", isFullImage);
				imgElm.attr("src", cgElm.data(isFullImage ? "char" : "full"));
			};
			const appendShipsByPage = (showAll = false) => {
				const addOneShip = (shipData) => {
					const shipBox = $(".tab_mstupdate .factory .mstship").clone()
						.addClass("smaller")
						.appendTo(".tab_mstupdate .allships");
					const version = (KC3Master.graph(shipData.api_id).api_version || [])[0],
						imgFileFull = KC3Master.png_file(shipData.api_id, "full", "ship")
							+ (!version ? "" : "?version=" + version),
						imgFileChar = KC3Master.png_file(shipData.api_id, "character_full", "ship")
							+ (!version ? "" : "?version=" + version),
						fullUrl = `http://${self.myServerIp}/kcs2/resources${imgFileFull}`,
						charUrl = `http://${self.myServerIp}/kcs2/resources${imgFileChar}`;
					$(".ship_cg img", shipBox).attr("src", fullUrl);
					$(".ship_cg", shipBox).addClass("hover").click(toggleImageFunc)
						.attr("data-full", fullUrl)
						.attr("data-char", charUrl);
					const shipName = "[{0}] {1}".format(shipData.api_id, KC3Meta.shipName(shipData.api_id));
					$(".ship_name", shipBox).text(shipName)
						.data("tab", "mstship")
						.data("api_id", shipData.api_id)
						.click(linkClickFunc);
				};
				if(this.listedShipId > 1 && $(".tab_mstupdate .allships > div").length === 0) {
					for(let id = 1; id < this.listedShipId; id++) {
						const ship = KC3Master.isRegularShip(id) && KC3Master.ship(id);
						if(ship) addOneShip(ship);
					}
				}
				const shipsToShown = showAll ? KC3Master.seasonalCgIdFrom : this.shipsPerPage;
				let shipsAdded = 0;
				for(let cnt = 0; cnt < shipsToShown; cnt++) {
					let shipData = false;
					while(!shipData && KC3Master.isRegularShip(this.listedShipId)) {
						shipData = KC3Master.ship(this.listedShipId);
						this.listedShipId += 1;
					}
					if(!shipData) break;
					addOneShip(shipData);
					shipsAdded += 1;
				}
				return shipsAdded;
			};
			$(".moreships_btn").on("click", (e) => {
				$(".moreships_btn, .allships_btn").toggle(appendShipsByPage() > 0);
			});
			$(".allships_btn").on("click", (e) => {
				appendShipsByPage(true);
				$(".moreships_btn, .allships_btn").hide();
			});
			if(!ConfigManager.devOnlyPages) {
				$(".dev_only").hide();
			}
		}
		
	};
	
})();
