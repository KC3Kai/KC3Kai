(function(){
	"use strict";

	KC3StrategyTabs.gears = new KC3StrategyTab("gears");

	KC3StrategyTabs.gears.definition = {
		tabSelf: KC3StrategyTabs.gears,

		_items: {},
		_holders: {},
		_comparator: {},
		_currentTypeId: 1, // keep track of current type_id
		_allProperties: ["fp","tp","aa","ar","as","ev","ls","dv","ht","rn","or","rk"],
		_defaultCompareMethod: {
			// main guns
			"t1": "fp",
			"t2": "fp",
			"t3": "fp",
			// secondary
			"t4": "fp",
			// torpedo
			"t5": "tp",
			// fighter
			"t6": "aa",
			// dive bomber
			"t7": "dv",
			// torpedo bomber
			"t8": "tp",
			// scout
			"t9": "ls",
			// seaplane, default to overall stat
			"t10": "overall",
			// radar
			"t11": "overall",
			// type 3 shell
			"t12": "aa",
			// AP
			"t13": "fp",
			// dam con
			"t14": "overall",
			// AA gun
			"t15": "aa",
			"t16": "aa",
			// ASW
			"t17": "as",
			"t18": "as",
			// engine
			"t19": "ev",
			// landing craft
			"t20": "overall",
			// KA obs
			"t21": "as",
			// type 3 CLA
			"t22": "as",
			// bulge
			"t23": "ar",
			// searchlight
			"t24": "ls",
			// drum
			"t25": "overall",
			// repair facility
			"t26": "overall",
			// star shell
			"t27": "overall",
			// fleet command facility
			"t28": "overall",
			// skilled aircraft maintenance
			"t29": "fp",
			// AAFD
			"t30": "aa",
			// WG42
			"t31": "overall",
			// skilled lookout
			"t32": "overall",
			// flying boat
			"t33": "overall",
			// combat ration
			"t34": "overall",
			// underway replenishment
			"t35": "overall",
			// land tank
			"t36": "overall",
			// land base bomber
			"t37": "dv",
			// interceptor
			"t38": "ht",
			// jet bomber (keiun)
			"t39": "dv",
			// jet bomber (kikka)
			"t40": "dv",
			// transport material
			"t41": "overall",
			// submarine radar
			"t42": "ev",
			// seaplane fighter
			"t43": "aa",
			// land base fighter (new interceptor)
			"t44": "aa",
			// night fighter
			"t45": "aa",
			// night torpedo bomber
			"t46": "tp",
			// ASW land base bomber
			"t47": "as",
			// all types
			"tall": "type",
		},
		_landPlaneTypes: KC3GearManager.landBasedAircraftType3Ids,

		/* Initialize comparators
		---------------------------------*/
		initComparator: function() {
			const mkComparator = function(propertyGetter) {
				return function(a,b) {
					// for equipments, greater usually means better xD
					// so the comparison is flipped
					const result = propertyGetter(b) - propertyGetter(a);
					// additionally, if they look the same on the given stat
					// we compare all properties by taking their sum.
					if (result === 0) {
						return sumAllGetter(b) - sumAllGetter(a)
							|| a.id - b.id;
					} else {
						return result;
					}
				};
			};
			const self = this;
			const allProperties = this._allProperties;
			const sumAllGetter = function(obj) {
				return allProperties
					.map( function(p) { return obj.stats[p] || 0; } )
					.reduce( function(a,b) { return a+b; }, 0);
			};

			allProperties.forEach( function(property,i) {
				const getter = function(obj) {
					return obj.stats[property];
				};
				self._comparator[property] = mkComparator(getter);
			});
			self._comparator.overall = function(a,b) {
				return sumAllGetter(b) - sumAllGetter(a)
					|| a.id - b.id;
			};
			self._comparator.type = function(a,b) {
				return a.type_id - b.type_id
					|| self._comparator[self._defaultCompareMethod["t" + a.type_id]](a, b)
					|| a.id - b.id;
			};
			self._comparator.total = function(a,b) {
				return (b.held.length+b.extras.length) - (a.held.length+a.extras.length)
					|| b.extras.length - a.extras.length
					|| a.type_id - b.type_id
					|| a.id - b.id;
			};
			self._comparator.ingame = function(a,b) {
				// in-game it sorted by sp(api_type[2]) asc, masterId asc, rosterId asc
				return a.category - b.category
					|| a.id - b.id;
			};
		},

		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			const akashiData = $.ajax('../../data/akashi.json', { async: false }).responseText;
			this.upgrades = JSON.parse(akashiData);
			this.initComparator();
		},

		/* RELOAD
		Prepares latest player data
		---------------------------------*/
		reload :function(){
			// Reload data from local storage
			KC3ShipManager.load();
			KC3GearManager.load();
			PlayerManager.loadBases();
			// Clean old data
			this._items = {};
			this._holders = {};
			// Compile equipment holders
			for(const ctr in KC3ShipManager.list){
				const ship = KC3ShipManager.list[ctr];
				for(const idx in ship.items){
					this.checkShipSlotForItemHolder(idx, ship);
				}
				this.checkShipSlotForItemHolder(-1, ship);
			}
			for(const ctr in PlayerManager.bases){
				this.checkLbasSlotForItemHolder(PlayerManager.bases[ctr]);
			}
			// Compile ships on Index
			for(const ctr in KC3GearManager.list){
				const ThisItem = KC3GearManager.list[ctr];
				const MasterItem = ThisItem.master();
				if(!MasterItem) continue;

				// Check if slotitem_type is filled
				if(typeof this._items["t"+MasterItem.api_type[3]] == "undefined"){
					this._items["t"+MasterItem.api_type[3]] = [];
				}
				const ThisType = this._items["t"+MasterItem.api_type[3]];

				// Check if slotitem_id is filled
				if(typeof ThisType["s"+MasterItem.api_id] == "undefined"){
					ThisType["s"+MasterItem.api_id] = {
						rid: ThisItem.id,
						id: ThisItem.masterId,
						type_id: MasterItem.api_type[3],
						category: KC3Master.equip_type_sp(ThisItem.masterId, MasterItem.api_type[2]),
						english: ThisItem.name(),
						japanese: MasterItem.api_name,
						stats: {
							fp: MasterItem.api_houg,
							tp: MasterItem.api_raig,
							aa: MasterItem.api_tyku,
							ar: MasterItem.api_souk,
							as: MasterItem.api_tais,
							ev: MasterItem.api_houk,
							ls: MasterItem.api_saku,
							dv: MasterItem.api_baku,
							ht: MasterItem.api_houm,
							rn: MasterItem.api_leng,
							or: MasterItem.api_distance,
							rk: KC3GearManager.antiLandDiveBomberIds.includes(ThisItem.masterId) && 1,
						},
						held: [],
						extras: [],
						arranged: {}
					};
				}

				const holder = this._holders["s"+ThisItem.itemId];
				const item = ThisType["s"+MasterItem.api_id];

				// Add this item to the instances if being held by someone
				if(typeof holder != "undefined"){
					var itemSimple = {
						id: ThisItem.itemId,
						level: ThisItem.stars,
						locked: ThisItem.lock,
						holder: holder,
					};
					item.held.push(itemSimple);

					if( !item.arranged[ThisItem.stars] )
						item.arranged[ThisItem.stars] = {
							held: [],
							holder: {},
							extraCount: 0,
							heldCount: 0
						};
					item.arranged[ThisItem.stars].held.push(itemSimple);

					if( !item.arranged[ThisItem.stars].holder[holder.rosterId] )
						item.arranged[ThisItem.stars].holder[holder.rosterId] = {
							held: [],
							holder: holder,
							count: 0
						};
					item.arranged[ThisItem.stars].holder[holder.rosterId].held.push(itemSimple);

					item.arranged[ThisItem.stars].holder[holder.rosterId].count++;
					item.arranged[ThisItem.stars].heldCount++;
				}else{
					// It's an extra equip on inventory
					item.extras.push({
						id: ThisItem.itemId,
						level: ThisItem.stars,
						locked: ThisItem.lock
					});

					if( !item.arranged[ThisItem.stars] )
						item.arranged[ThisItem.stars] = {
							held: [],
							holder: {},
							extraCount: 0,
							heldCount: 0
						};

					item.arranged[ThisItem.stars].extraCount++;
				}
			}
		},

		/* Check a ship's equipment slot of an item is equipped
		--------------------------------------------*/
		checkShipSlotForItemHolder :function(slot, ThisShip){
			if(slot < 0){
				if(ThisShip.ex_item > 0){
					this._holders["s"+ThisShip.ex_item] = ThisShip;
				}
			} else if(ThisShip.items[slot] > 0){
				this._holders["s"+ThisShip.items[slot]] = ThisShip;
			}
		},

		/* Check LBAS slot of an aircraft is equipped
		--------------------------------------------*/
		checkLbasSlotForItemHolder :function(LandBase){
			for(const squad in LandBase.planes){
				if(LandBase.planes[squad].api_slotid > 0){
					this._holders["s"+LandBase.planes[squad].api_slotid] = LandBase;
				}
			}
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;

			$(".tab_gears .item_stat img, .tab_gears .sortControl img").each((_, img) => {
				$(img).attr("src", KC3Meta.statIcon($(img).parent().data("stat")));
			});
			$(".tab_gears .item_types .item_type img").each((_, img) => {
				$(img).attr("src", KC3Meta.itemIcon($(img).parent().data("type")));
			});
			$(".tab_gears .item_types .item_type").each((_, elm) => {
				$(elm).attr("title", KC3Meta.gearTypeName(3, $(elm).data("type")));
			});
			$(".tab_gears .item_type").on("click", function(){
				KC3StrategyTabs.gotoTab(null, $(this).data("type"));
			});

			// setup sort methods
			const sortControls = this._allProperties.slice(0);
			sortControls.push( "overall" );
			sortControls.push( "type" );
			sortControls.push( "total" );
			sortControls.push( "ingame" );
			sortControls.forEach( function(property,i) {
				$(".tab_gears .itemSorters .sortControl." + property).on("click", function() {
					KC3StrategyTabs.gotoTab(null, self._currentTypeId, property);
				});
				
			});

			if(!!KC3StrategyTabs.pageParams[1]){
				if(!!KC3StrategyTabs.pageParams[2]){
					this.switchTypeAndSort(KC3StrategyTabs.pageParams[1], KC3StrategyTabs.pageParams[2]);
				} else {
					this.switchTypeAndSort(KC3StrategyTabs.pageParams[1]);
				}
			} else {
				this.switchTypeAndSort($(".tab_gears .item_type").first().data("type"));
			}
		},

		switchTypeAndSort: function(typeId, sortMethod) {
			const compareMethod = sortMethod || this._defaultCompareMethod["t"+typeId] || "overall";
			this.updateSorters(typeId);
			this._currentTypeId = typeId;
			this.showType(typeId, compareMethod);
		},

		/*
		 * get all available type ids from _items
		 */
		getAllAvailableTypes: function() {
			const allTypeIds = [];
			for (const ty in this._items) {
				if (this._items.hasOwnProperty(ty) && ty.startsWith('t')) {
					allTypeIds.push( parseInt(ty.slice(1)) );
				}
			}
			allTypeIds.sort(function(a,b){return a-b;});
			return allTypeIds;
		},
		/* check available items and show or hide sorters accordingly
		  ------------------------------------------*/
		updateSorters: function(type_id) {
			const self = this;
			const statSets = {};
			const allProperties = self._allProperties;
			allProperties.forEach(function(p,i) {
				statSets[p] = [];
			});

			// grab stat from all available slotitems
			function accumulateStats(statSets,ThisSlotitem) {
				return function(p,i) {
					statSets[p].push( ThisSlotitem.stats[p] );
				};
			}

			if (type_id === "all") {
				$.each(this.getAllAvailableTypes(), function (i,typeId) {
					const tyInd = "t" + typeId;
					for (const item in self._items[tyInd]) {
						const ThisSlotitem = self._items[tyInd][item];
						allProperties.forEach(accumulateStats(statSets, ThisSlotitem));
					}
				});
			} else {
				for (const item in self._items["t"+type_id]) {
					const ThisSlotitem = self._items["t"+type_id][item];
					allProperties.forEach(accumulateStats(statSets, ThisSlotitem));
				}
			}

			const removeDuplicates = function(xs) {
				const result = [];
				xs.forEach(function(v,i) {
					if (result.indexOf(v) === -1)
						result.push(v);
				});
				return result;
			};

			// making sets for each stat values
			allProperties.forEach(function(p,i) {
				statSets[p] = removeDuplicates( statSets[p] );
			});

			allProperties.forEach(function(p,i) {
				const q = ".tab_gears .itemSorters .sortControl." + p;
				if ((statSets[p].length <= 1 &&
					self._defaultCompareMethod["t"+type_id] !== p)
					|| (p==="or" && self._landPlaneTypes.indexOf(Number(type_id))<0)
				) {
					$(q).addClass("hide");
				} else {
					$(q).removeClass("hide");
				}
			});

			// show special stats icon for interceptor and land base fighter
			if(KC3GearManager.interceptorsType3Ids.includes(Number(type_id))){
				$(".itemSorters .sortControl.ht").attr("title", KC3Meta.term("ShipAccAntiBomber"));
				$(".itemSorters .sortControl.ht img").attr("src", KC3Meta.statIcon("ib"));
				$(".itemSorters .sortControl.ev").attr("title", KC3Meta.term("ShipEvaInterception"));
				$(".itemSorters .sortControl.ev img").attr("src", KC3Meta.statIcon("if"));
			} else {
				$(".itemSorters .sortControl.ht").attr("title", KC3Meta.term("ShipAccuracy"));
				$(".itemSorters .sortControl.ht img").attr("src", KC3Meta.statIcon("ht"));
				$(".itemSorters .sortControl.ev").attr("title", KC3Meta.term("ShipEvasion"));
				$(".itemSorters .sortControl.ev img").attr("src", KC3Meta.statIcon("ev"));
			}

			const q = ".tab_gears .itemSorters .sortControl.type";
			if (type_id === "all") {
				$(q).removeClass("hide");
				// there are too many sorters
				$(".tab_gears .itemSorters .sortControl.rk").addClass("hide");
			} else {
				$(q).addClass("hide");
			}
		},

		/* Show slotitem type, with a compare method
		--------------------------------------------*/
		showType :function(type_id, compareMethod){
			const self = this;
			$(".tab_gears .item_type").removeClass("active");
			$(".tab_gears .item_type[data-type={0}]".format(type_id)).addClass("active");
			$(".tab_gears .item_list").html("");

			const comparator = this._comparator[compareMethod];
			if (typeof comparator == "undefined") {
				console.warn("Missing comparator for:", compareMethod);
			} else {
				$(".tab_gears .sortControl").removeClass("active");
				$(".tab_gears .sortControl.{0}".format(compareMethod)).addClass("active");
			}
			// Build details of gear instances. Notes: 'locked' emojis have to be UTF16 escaped for compatibility of old browser
			const getItemList = (held = [], extras = []) => held.concat(extras).sort((a, b) => a.id - b.id)
				.map(i => `#${i.id}\t\u2605+${i.level}`
					+ `\t${!i.locked ? (!i.holder ? "\uD83D\uDD13" : "\uD83D\uDD11") : (!i.holder ? "\uD83D\uDD12" : "\uD83D\uDD10")}`);

			function showEqList(i,arranged){
				if( !arranged[i].heldCount ) return null;
				let div = $(), holderDiv;
				$.each(arranged[i].holder, (rosterId, item) => {
					// Here multi-line strings template apparently better
					if(item.holder instanceof KC3LandBase){
						holderDiv = $('<div/>', {
							'class' : 'holder',
							'html'  : `<img src="${KC3Meta.itemIcon(33)}" />
								<font>LBAS World ${item.holder.map}</font>
								<span>#${item.holder.rid}</span>
								<span>x${item.count}</span>`
						});
						$("img", holderDiv)
							.attr("title", getItemList(arranged[i].held).join("\n"));
					} else {
						const masterId = item.holder.masterId;
						holderDiv = $('<div/>', {
							'class' : 'holder',
							'html'  :
								`<img src="${KC3Meta.shipIcon(masterId,"/assets/img/ui/empty.png")}"/>
								<font>${item.holder.name()}</font>
								<span>Lv${item.holder.level}</span>
								<span>x${item.count}</span>`
						});
						$("img", holderDiv).addClass("hover")
							.attr("title", `[${masterId}]\n${getItemList(item.held).join("\n")}`)
							.attr("alt", masterId)
							.on("click", self.shipClickFunc);
						$("font", holderDiv).attr("title", `#${rosterId} ${item.holder.name()}${!item.holder.lock ? " \uD83D\uDD13" : ""}`);
					}
					div = div.add(holderDiv);
				});
				return div;
			}

			const SlotItems = [];
			if (type_id === "all") {
				$.each(this.getAllAvailableTypes(), function(i,typeId) {
					const tyInd = "t"+typeId;
					for (const slotItem in self._items[tyInd]) {
						SlotItems.push( self._items[tyInd][slotItem] );
					}
				});
			} else {
				for (const slotItem in this._items["t"+type_id]) {
					SlotItems.push( this._items["t"+type_id][slotItem] );
				}
			}

			SlotItems.sort( comparator );
			const dayOfWeek = Date.getJstDate().getDay();
			const allProperties = this._allProperties;
			$.each(SlotItems, function(index, ThisSlotitem) {
				const ItemElem = $(".tab_gears .factory .slotitem").clone().appendTo(".tab_gears .item_list");
				$(".icon img", ItemElem)
					.attr("src", KC3Meta.itemIcon(ThisSlotitem.type_id))
					.error(function() { $(this).unbind("error").attr("src", "/assets/img/ui/empty.png"); });
				$(".icon img", ItemElem)
					.attr("title", `[${ThisSlotitem.id}]\n${getItemList(ThisSlotitem.held, ThisSlotitem.extras).join("\n")}`)
					.attr("alt", ThisSlotitem.id)
					.on("click", self.gearClickFunc);
				$(".english", ItemElem).text(ThisSlotitem.english);
				$(".japanese", ItemElem).text(ThisSlotitem.japanese);

				["sun", "mon", "tue", "wed", "thu", "fri", "sat"].forEach((day, dayIndex) => {
					if (self.upgrades[day] && Array.isArray(self.upgrades[day][ThisSlotitem.id])) {
						$("<a></a>").text(Date.getDayName(dayIndex))
							.attr("title",
								self.upgrades[day][ThisSlotitem.id].map(shipId =>
									KC3Meta.shipName(KC3Master.ship(shipId).api_name)
								).join(", ")
							).attr("href", `#akashi-${day}`)
							.toggleClass("sel", dayIndex === dayOfWeek)
							.appendTo($(".upgradeDays", ItemElem));
					}
				});

				allProperties.forEach( function(v,i) {
					self.slotitem_stat(ItemElem, ThisSlotitem, v);
				});

				for( const i in ThisSlotitem.arranged ){
					$('<dl/>').append(
						$('<dt/>', {
							'class': i === 0 ? 'base' : '',
							'html' : `<img src="/assets/img/client/eqstar.png"><span>+${i}</span>`
						}).append( $('<small/>').html(
							'x' + (ThisSlotitem.arranged[i].heldCount + ThisSlotitem.arranged[i].extraCount)
							+ ( ThisSlotitem.arranged[i].heldCount
								? ' (' +ThisSlotitem.arranged[i].heldCount+ ' Equipped, ' +ThisSlotitem.arranged[i].extraCount + ' Equippable)'
								: ''
							)
						) )
					).append( $('<dd/>').append(showEqList(i,ThisSlotitem.arranged)) )
					.appendTo( ItemElem.children('.holders') );
				}

				$('<dl/>').append( $('<dd/>').html(
					'Total ' + (ThisSlotitem.held.length+ThisSlotitem.extras.length)
					+ ( ThisSlotitem.held.length
						? ' (' +ThisSlotitem.held.length+ ' Equipped, ' +ThisSlotitem.extras.length + ' Equippable)'
						: ''
					)
				) ).appendTo( ItemElem.children('.holders') );
			});

		},

		shipClickFunc: function(e){
			KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
		},

		gearClickFunc: function(e){
			KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
		},

		/* Determine if an item has a specific stat
		--------------------------------------------*/
		slotitem_stat :function(ItemElem, SlotItem, statName){
			if(statName === "rk") {
				$(".stats .item_rk", ItemElem).toggle(!!SlotItem.stats.rk);
			} else if(SlotItem.stats[statName] !== 0 && (statName !== "or" ||
				(statName === "or" && this._landPlaneTypes.indexOf(SlotItem.type_id)>-1)
			)){
				// accuray icon -> anti-bomber
				if(statName === "ht" &&
					KC3GearManager.interceptorsType3Ids.includes(Number(SlotItem.type_id))){
					$(".stats .item_ht", ItemElem).attr("title", KC3Meta.term("ShipAccAntiBomber"));
					$(".stats .item_ht img", ItemElem).attr("src", KC3Meta.statIcon("ib"));
				}
				// evasion icon -> interception
				if(statName === "ev" &&
					KC3GearManager.interceptorsType3Ids.includes(Number(SlotItem.type_id))){
					$(".stats .item_ev", ItemElem).attr("title", KC3Meta.term("ShipEvaInterception"));
					$(".stats .item_ev img", ItemElem).attr("src", KC3Meta.statIcon("if"));
				}
				if(statName === "rn"){
					$(".stats .item_{0} span".format(statName), ItemElem)
						.text(KC3Meta.gearRange(SlotItem.stats[statName]));
				} else {
					$(".stats .item_{0} span".format(statName), ItemElem)
						.text(SlotItem.stats[statName]);
				}
			} else {
				$(".stats .item_{0}".format(statName), ItemElem).hide();
			}
		}

	};

})();
