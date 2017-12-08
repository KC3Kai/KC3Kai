(function(){
	"use strict";

	KC3StrategyTabs.gears = new KC3StrategyTab("gears");

	KC3StrategyTabs.gears.definition = {
		tabSelf: KC3StrategyTabs.gears,

		_items: {},
		_holders: {},
		_comparator: {},
		_currentTypeId: 1, // keep track of current type_id
		_allProperties: ["fp","tp","aa","ar","as","ev","ls","dv","ht","rn","or"],
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
			"t38": "aa",
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
			var mkComparator = function(propertyGetter) {
				return function(a,b) {
					// for equipments, greater usually means better xD
					// so the comparison is flipped
					var result = propertyGetter(b) - propertyGetter(a);
					// additionally, if they look the same on the given stat
					// we compare all properties by taking their sum.
					if (result === 0) {
						return sumAllGetter(b) - sumAllGetter(a);
					} else {
						return result;
					}
				};
			};
			var self = this;
			var allProperties = this._allProperties;
			var sumAllGetter = function(obj) {
				return allProperties
					.map( function(p) { return obj.stats[p] || 0; } )
					.reduce( function(a,b) { return a+b; }, 0);
			};

			allProperties.forEach( function(property,i) {
				var getter = function(obj) {
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
			var ctr, ThisItem, MasterItem, ThisShip, MasterShip;
			for(ctr in KC3ShipManager.list){
				this.checkShipSlotForItemHolder(0, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(1, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(2, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(3, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(-1, KC3ShipManager.list[ctr]);
			}
			for(ctr in PlayerManager.bases){
				this.checkLbasSlotForItemHolder(PlayerManager.bases[ctr]);
			}

			var getSpecialEquipType = (mstId, type2) => {
				const SLOTITEM_SPECIAL_FLAGS = {
					128: 38,
					142: 43,
				};
				return SLOTITEM_SPECIAL_FLAGS[mstId] || type2;
			};
			// Compile ships on Index
			for(ctr in KC3GearManager.list){
				ThisItem = KC3GearManager.list[ctr];
				MasterItem = ThisItem.master();
				if(!MasterItem) continue;

				// Check if slotitem_type is filled
				if(typeof this._items["t"+MasterItem.api_type[3]] == "undefined"){
					this._items["t"+MasterItem.api_type[3]] = [];
				}

				// Check if slotitem_id is filled
				if(typeof this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id] == "undefined"){
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id] = {
						rid: ThisItem.id,
						id: ThisItem.masterId,
						type_id: MasterItem.api_type[3],
						category: getSpecialEquipType(ThisItem.masterId, MasterItem.api_type[2]),
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
							or: MasterItem.api_distance
						},
						held: [],
						extras: [],
						arranged: {}
					};
				}

				var holder = this._holders["s"+ThisItem.itemId];

				// Add this item to the instances
				if(typeof this._holders["s"+ThisItem.itemId] != "undefined"){
					// Someone is holding it
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].held.push({
						id: ThisItem.itemId,
						level: ThisItem.stars,
						locked: ThisItem.lock,
						holder: holder,
					});

					if( !this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars] )
						this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars] = {
							holder: {},
							extraCount: 0,
							heldCount: 0
						};

					if( !this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].holder[holder.rosterId] )
						this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].holder[holder.rosterId] = {
							holder: holder,
							count: 0
						};

					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].holder[holder.rosterId].count++;
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].heldCount++;
				}else{
					// It's an extra equip on inventory
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].extras.push({
						id: ThisItem.itemId,
						level: ThisItem.stars,
						locked: ThisItem.lock
					});

					if( !this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars] )
						this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars] = {
							holder: {},
							extraCount: 0,
							heldCount: 0
						};

					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].extraCount++;
				}
			}
		},

		/* Check a ship's equipment slot of an item is equipped
		--------------------------------------------*/
		checkShipSlotForItemHolder :function(slot, ThisShip){
			if(slot<0){
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
			for(var squad in LandBase.planes){
				if(LandBase.planes[squad].api_slotid > 0){
					this._holders["s"+LandBase.planes[squad].api_slotid] = LandBase;
				}
			}
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;

			$(".tab_gears .item_type").on("click", function(){
				KC3StrategyTabs.gotoTab(null, $(this).data("type"));
			});

			// setup sort methods
			var sortControls = this._allProperties.slice(0);
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
			var compareMethod = sortMethod || this._defaultCompareMethod["t"+typeId] || "overall";
			this.updateSorters(typeId);
			this._currentTypeId = typeId;
			this.showType(typeId, compareMethod);
		},

		/*
		 * get all available type ids from _items
		 */
		getAllAvailableTypes: function() {
			var allTypeIds = [];
			for (var ty in this._items) {
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
			var self = this;
			var statSets = {};
			var allProperties = self._allProperties;
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
					var tyInd = "t" + typeId;
					for (var item in self._items[tyInd]) {
					var ThisSlotitem = self._items[tyInd][item];
						allProperties.forEach(accumulateStats(statSets, ThisSlotitem));
					}
				});
			} else {
				for (var item in self._items["t"+type_id]) {
					var ThisSlotitem = self._items["t"+type_id][item];
					allProperties.forEach(accumulateStats(statSets, ThisSlotitem));
				}
			}

			var removeDuplicates = function(xs) {
				var result = [];
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
				var q = ".tab_gears .itemSorters .sortControl." + p;
				if ((statSets[p].length <= 1 &&
					self._defaultCompareMethod["t"+type_id] !== p)
					|| (p==="or" && self._landPlaneTypes.indexOf(Number(type_id))<0)
				) {
					  $(q).addClass("hide");
				} else {
					  $(q).removeClass("hide");
				}
			});

			var q = ".tab_gears .itemSorters .sortControl.type";
			if (type_id === "all") {
				$(q).removeClass("hide");
			} else {
				$(q).addClass("hide");
			}
		},

		/* Show slotitem type, with a compare method
		--------------------------------------------*/
		showType :function(type_id, compareMethod){
			$(".tab_gears .item_type").removeClass("active");
			$(".tab_gears .item_type[data-type={0}]".format(type_id)).addClass("active");
			$(".tab_gears .item_list").html("");

			var comparator = this._comparator[compareMethod];
			if (typeof comparator == "undefined") {
				console.warn("Missing comparator for:", compareMethod);
			} else {
				$(".tab_gears .sortControl").removeClass("active");
				$(".tab_gears .sortControl.{0}".format(compareMethod)).addClass("active");
			}

			function showEqList(i,arranged){
				if( !arranged[i].heldCount )
					return null;

				var els = $();
				for( var j in arranged[i].holder ){
					if(arranged[i].holder[j].holder instanceof KC3LandBase){
						els = els.add(
							$('<div/>',{
								'class':	'holder',
								'html':		'<img src="../../../../assets/img/items/33.png" />'
											+ '<font>LBAS World '+arranged[i].holder[j].holder.map+'</font>'
											+ '<span>#'+arranged[i].holder[j].holder.rid+'</span>'
											+ '<span>x'+arranged[i].holder[j].count+'</span>'
							})
						);
					} else {
						els = els.add(
							$('<div/>',{
								'class':	'holder',
								'html':		'<img src="'+KC3Meta.shipIcon(
													arranged[i].holder[j].holder.masterId,
													"../../assets/img/ui/empty.png"
												)+'"/>'
											+ '<font>'+arranged[i].holder[j].holder.name()+'</font>'
											+ '<span>Lv'+arranged[i].holder[j].holder.level+'</span>'
											+ '<span>x'+arranged[i].holder[j].count+'</span>'
							})
						);
					}
				}
				return els;
			}

			var ctr, ThisType, ItemElem, ThisSlotitem;
			var gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			var SlotItems = [];
			var self = this;
			if (type_id === "all") {
				$.each(this.getAllAvailableTypes(), function(i,typeId) {
					var tyInd = "t"+typeId;
					for (var slotItem in self._items[tyInd]) {
						SlotItems.push( self._items[tyInd][slotItem] );
					}
				});
			} else {
				for (var slotItem in this._items["t"+type_id]) {
					SlotItems.push( this._items["t"+type_id][slotItem] );
				}
			}

			SlotItems.sort( comparator );

			var allProperties = this._allProperties;
			$.each(SlotItems, function(index,ThisSlotitem) {
				ItemElem = $(".tab_gears .factory .slotitem").clone().appendTo(".tab_gears .item_list");
				$(".icon img", ItemElem).attr("src", "../../assets/img/items/"+ThisSlotitem.type_id+".png")
					.error(function() { $(this).unbind("error").attr("src", "../../assets/img/ui/empty.png"); });
				$(".icon img", ItemElem).attr("alt", ThisSlotitem.id);
				$(".icon img", ItemElem).on("click", gearClickFunc);
				$(".english", ItemElem).text(ThisSlotitem.english);
				$(".japanese", ItemElem).text(ThisSlotitem.japanese);

				allProperties.forEach( function(v,i) {
					self.slotitem_stat(ItemElem, ThisSlotitem, v);
				});

				var holderCtr, ThisHolder, HolderElem;
				for( var i in ThisSlotitem.arranged ){
					$('<dl/>')
						.append( $('<dt/>',{
								'class':	i === 0 ? 'base' : '',
								'html':		'<img src="../../assets/img/client/eqstar.png"><span>+' + i + '</span>'
							}).append( $('<small/>').html(
								'x' + (ThisSlotitem.arranged[i].heldCount + ThisSlotitem.arranged[i].extraCount)
								+ ( ThisSlotitem.arranged[i].heldCount
									? ' (' +ThisSlotitem.arranged[i].heldCount+ ' Equipped, ' +ThisSlotitem.arranged[i].extraCount + ' Equippable)'
									: ''
								)
							) )
						)
						.append( $('<dd/>').append(showEqList(i,ThisSlotitem.arranged)) )
						.appendTo( ItemElem.children('.holders') );
				}

				$('<dl/>')
					.append( $('<dd/>').html(
						'Total ' + (ThisSlotitem.held.length+ThisSlotitem.extras.length)
						+ ( ThisSlotitem.held.length
							? ' (' +ThisSlotitem.held.length+ ' Equipped, ' +ThisSlotitem.extras.length + ' Equippable)'
							: ''
						)
					) )
					.appendTo( ItemElem.children('.holders') );
			});

		},

		/* Determine if an item has a specific stat
		--------------------------------------------*/
		slotitem_stat :function(ItemElem, SlotItem, statName){
			if(SlotItem.stats[statName] !== 0 &&
				(statName !== "or" || 
					(statName === "or" &&
					this._landPlaneTypes.indexOf(SlotItem.type_id)>-1)
				)
			){
				$(".stats .item_{0} span".format(statName), ItemElem)
					.text(SlotItem.stats[statName]);
			} else {
				$(".stats .item_{0}".format(statName), ItemElem).hide();
			}
		}

	};

})();
