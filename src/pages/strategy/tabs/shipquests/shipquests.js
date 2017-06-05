(function(){
	"use strict";

	KC3StrategyTabs.shipquests = new KC3StrategyTab("shipquests");

	KC3StrategyTabs.shipquests.definition = {
		tabSelf: KC3StrategyTabs.shipquests,

		shipCache:[],
		shipQuests:[],

		// default sorting method to Level
		currentSorters: [{name:"lv", reverse:false}],

		// all sorters
		sorters: {},

		/* INIT
		Prepares initial static data needed.
		---------------------------------*/
		init :function(){
			// Load ships quests data
			var questsData = $.ajax('../../data/ship_quests.json', { async: false }).responseText;
			this.shipQuests = JSON.parse(questsData);

			this.prepareSorters();
		},

		/* RELOAD
		Loads latest player or game data if needed.
		---------------------------------*/
		reload :function(){
			KC3ShipManager.load();
			KC3QuestManager.load();

			// Cache ship info
			this.shipCache = [];
			for(let ctr in KC3ShipManager.list){
				let thisShip = KC3ShipManager.list[ctr];
				let shipData = this.prepareShipData(thisShip);
				this.shipCache.push(shipData);
			}
		},

		// Get ship quests
		getShipQuests: function(shipId) {
			var entry = this.shipQuests[shipId];
			return entry ? entry : [];
		},

		// Prepares necessary info
		prepareShipData: function(ship) {
			var ThisShip = ship;
			var MasterShip = ThisShip.master();
			var BaseRemodelForm = RemodelDb.originOf(ThisShip.masterId);
			var Quests = this.getShipQuests(BaseRemodelForm);

			var cached = {
				id: ThisShip.rosterId,
				masterId: ThisShip.masterId,
				stype: MasterShip.api_stype,
				sortno: MasterShip.api_sortno,
				name: ThisShip.name(),
				level: ThisShip.level,
				quests: Quests,
			};

			return cached;
		},

		getLastCurrentSorter: function() {
			return this.currentSorters[this.currentSorters.length-1];
		},

		reverseLastCurrentSorter: function() {
			var sorter = this.getLastCurrentSorter();
			sorter.reverse = ! sorter.reverse;
		},

		setCurrentSorter: function(name) {
			var sorter = this.sorters[name];
			console.assert(sorter, "sorter should have been registered");
			this.currentSorters = [ {name: sorter.name, reverse:false} ];
		},

		defineSorter: function(name,desc,comparator) {
			this.sorters[name] = {
				name: name,
				desc: desc,
				comparator: comparator
			};
		},

		defineSimpleSorter: function(name,desc,getter) {
			var self = this;
			this.defineSorter(
				name,desc,
				function(a,b) {
					var va = getter.call(self,a);
					var vb = getter.call(self,b);
					return typeof va === "string" ? va.localeCompare(vb) : va - vb;
				});
		},

		prepareSorters: function() {
			var define = this.defineSimpleSorter.bind(this);

			define("id", "Id", function(x) { return x.id; });
			define("name", "Name", function(x) { return x.name; });
			define("type", "Type", function(x) { return x.stype; });
			define("lv", "Level", function(x) { return -x.level; });
			define("sortno", "BookNo", function(x) { return x.sortno; });
		},

		// create comparator based on current list sorters
		makeComparator: function() {
			function reversed(comparator) {
				return (l, r) => -comparator(l, r);
			}
			function compose(prevComparator, nextComparator) {
				return (l, r) => prevComparator(l, r) || nextComparator(l, r);
			}
			var mergedSorters = this.currentSorters.concat([{
				name: "sortno",
				reverse: false
			}]);
			if(this.currentSorters.every(si => si.name !== "id")){
				mergedSorters.push({
					name: "id",
					reverse: false
				});
			}
			return mergedSorters
				.map( sorterInfo => {
					var sorter = this.sorters[sorterInfo.name];
					return sorterInfo.reverse
						? reversed(sorter.comparator)
						: sorter.comparator;
				})
				.reduce( compose );
		},

		/* EXECUTE
		Places data onto the interface from scratch.
		---------------------------------*/
		execute :function(){
			var self = this;

			// Column header sorting
			$(".tab_shipquests .ship_header .ship_field.hover").on("click", function(){
				var sorter = self.getLastCurrentSorter();
				var sorterName = $(this).data("type");
				if (sorterName === sorter.name) {
					self.reverseLastCurrentSorter();
				} else {
					self.setCurrentSorter( sorterName  );
				}
				self.showList();
			});

			this.shipList = $(".tab_shipquests .ship_list");
			this.showList();
		},

		/* SHOW SHIP LIST
		Pagination not support yet.
		---------------------------------*/
		showList :function(){
			var self = this;

			this.startTime = Date.now();

			// Clear list
			this.shipList.empty().hide();

			// Wait until execute
			setTimeout(function(){
				var shipCtr, cElm, qElm, cShip, shipLevel, questCtr;

				// Sorting
				self.shipCache.sort( self.makeComparator() );

				// Fill up list
				Object.keys(self.shipCache).forEach(function(shipCtr){
					cShip = self.shipCache[shipCtr];
					shipLevel = cShip.level;

					cElm = $(".tab_shipquests .factory .ship_item").clone().appendTo(self.shipList);
					if(shipCtr%2 === 0){ cElm.addClass("even"); }else{ cElm.addClass("odd"); }

					$(".ship_id", cElm).text( cShip.id );
					$(".ship_img .ship_icon", cElm).attr("src", KC3Meta.shipIcon(cShip.masterId));
					$(".ship_img .ship_icon", cElm).attr("alt", cShip.masterId);
					$(".ship_img .ship_icon", this).click(self.shipClickFunc);
					$(".ship_name", cElm).text( cShip.name );
					if(shipLevel >= 100) {
						$(".ship_name", cElm).addClass("ship_kekkon-color");
					}
					$(".ship_type", cElm).text( KC3Meta.stype(cShip.stype) );
					var shipLevelConv = shipLevel;
					$(".ship_lv", cElm).html( "<span>Lv.</span>" + shipLevelConv);

					Object.keys(cShip.quests).forEach(function(questCtr){
						var questId = cShip.quests[questCtr];
						var thisQuest = KC3Meta.quest(questId);

						var divTag = $("<div />").addClass("ship_field");
						divTag.addClass("ship_stat");
						divTag.addClass("questIcon");
						divTag.addClass("type"+(String(questId).substring(0,1)));
						divTag.text(thisQuest.code);
						divTag.attr("title", self.buildQuestTooltip(questId, thisQuest));

						$(".ship_quests", cElm).append(divTag);

					});

				});

				self.shipList.show();
				self.shipList.createChildrenTooltips();
				console.debug("Showing ship quests took", (Date.now() - self.startTime)-100 , "milliseconds");
			}, 100);
		},

		shipClickFunc: function(e){
			KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
		},

		buildQuestTooltip :function(questId, questMeta){
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

	};

})();
