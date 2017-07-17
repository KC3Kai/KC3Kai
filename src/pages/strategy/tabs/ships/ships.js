(function(){
	"use strict";

	KC3StrategyTabs.ships = new KC3StrategyTab("ships");

	KC3StrategyTabs.ships.definition = {
		tabSelf: KC3StrategyTabs.ships,

		isLoading: false,
		shipCache:[],
		// Formatted settings to be stored into localStorage
		settings: {},
		// Default properties of sorters and views
		defaultSettings: {
			// default sorting method to Level
			currentSorters: [{name:"lv", reverse:false}],
			// default options of view
			equipMode: 0,
			multiKey: false,
			pageNo: false,
			scrollList: false,
			heartLockMode: 0,
			className: false,
			// default values of filters are defined at `prepareFilters`
		},
		// All pre-defined filters instances
		newFilterRep: {},
		// All pre-defined sorters instances
		sorters: {},
		sorterDescCtrl: null,
		viewElements: {},

		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			$.extend(true, this, this.defaultSettings);
			this.prepareSorters();
		},

		/* RELOAD
		Prepares latest ships data
		---------------------------------*/
		reload :function(){
			PlayerManager.loadFleets();
			KC3ShipManager.load();
			KC3GearManager.load();
			// Cache pre-processed ship info
			this.shipCache = [];
			for(let key in KC3ShipManager.list){
				let shipData = KC3ShipManager.list[key];
				let preparedData = this.prepareShipData(shipData);
				this.shipCache.push(preparedData);
			}
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;

			// Binding click event starts
			$(".filters_label").on("click", function(){
				$(".filters .ship_types").slideToggle(300);
				$(".filters .massSelect").slideToggle(300, function(){
					$(".fold_button").toggleClass("glyph_minus", $(this).is(":visible"));
					$(".fold_button").toggleClass("glyph_plus", !$(this).is(":visible"));
					if(self.scrollList){
						self.toggleTableScrollbar(true);
					}
				});
			});
			$(".pages_yes").on("click", function(){
				$(".ingame_page").show();
				if(!self.pageNo){
					self.pageNo = true;
					self.saveSettings();
				}
			});
			$(".pages_no").on("click", function(){
				$(".ingame_page").hide();
				if(self.pageNo){
					self.pageNo = false;
					self.saveSettings();
				}
			});
			$(".scroll_fix").on("click", function(){
				self.toggleTableScrollbar(true);
				if(!self.scrollList){
					self.scrollList = true;
					self.saveSettings();
				}
			});
			$(".scroll_none").on("click", function(){
				self.toggleTableScrollbar(false);
				if(self.scrollList){
					self.scrollList = false;
					self.saveSettings();
				}
				KC3StrategyTabs.reloadTab(undefined, false);
			});
			$(".lock_none").on("click", function(){
				$(".ship_list .ship_lock").hide();
				if(!!self.heartLockMode){
					self.heartLockMode = 0;
					self.saveSettings();
				}
			});
			$(".lock_yes").on("click", function(){
				if(self.heartLockMode !== 1){
					self.heartLockMode = 1;
					self.saveSettings();
				}
				KC3StrategyTabs.reloadTab(undefined, false);
			});
			$(".lock_no").on("click", function(){
				if(self.heartLockMode !== 2){
					self.heartLockMode = 2;
					self.saveSettings();
				}
				KC3StrategyTabs.reloadTab(undefined, false);
			});
			$(".class_yes").on("click", function(){
				if(!self.className){
					self.className = true;
					self.saveSettings();
				}
				KC3StrategyTabs.reloadTab(undefined, false);
			});
			$(".class_no").on("click", function(){
				if(self.className){
					self.className = false;
					self.saveSettings();
				}
				KC3StrategyTabs.reloadTab(undefined, false);
			});
			$(".control_buttons .reset_default").on("click", function(){
				delete self.currentSorters;
				$.extend(true, self, self.defaultSettings);
				delete localStorage.srShiplist;
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			// Binding click event ends

			// Add filter elements of ship types before `prepareFilters` executed
			for(let sCtr in KC3Meta._stype){
				// stype 12, 15 not used by shipgirl
				// stype 1 is used from 2017-05-02
				if(KC3Meta._stype[sCtr] && ["12", "15"].indexOf(sCtr) < 0){
					let cElm = $(".tab_ships .factory .ship_filter_type").clone().appendTo(".tab_ships .filters .ship_types");
					cElm.data("id", sCtr);
					$(".filter_name", cElm).text(KC3Meta.stype(sCtr));
				}
			}

			// Update multi sorter elements
			var multiKeyCtrl = $( ".advanced_sorter .adv_sorter" );
			var updateSorterControl = function() {
				$(".filter_check", multiKeyCtrl).toggle( self.multiKey );
				self.sorterDescCtrl.toggle(self.multiKey);
			};
			multiKeyCtrl.on("click", function() {
				self.multiKey = ! self.multiKey;

				updateSorterControl();

				if (! self.multiKey) {
					var needUpdate = self.cutCurrentSorter();
					if (needUpdate)
						self.refreshTable();
				}
			});

			this.loadSettings();
			this.sorterDescCtrl = $(".advanced_sorter .sorter_desc");
			this.updateSorterDescription();
			updateSorterControl();
			this.prepareFilters();
			this.shipList = $(".tab_ships .ship_list");
			this.showFilters();
		},

		getLastCurrentSorter: function() {
			return this.currentSorters[this.currentSorters.length-1];
		},

		reverseLastCurrentSorter: function() {
			var sorter = this.getLastCurrentSorter();
			sorter.reverse = ! sorter.reverse;
			this.updateSorterDescription();
		},

		// try pushing a new sorter to existing list
		// if the sorter already exists, the its "reverse"
		// value will be filpped.
		pushToCurrentSorters: function(name) {
			var i;
			var found = false;
			for (i=0; !found && i<this.currentSorters.length; ++i) {
				var sorterInfo = this.currentSorters[i];
				if (name === sorterInfo.name) {
					found = true;
					sorterInfo.reverse = ! sorterInfo.reverse;
				}
			}

			if (!found) {
				this.currentSorters.push({
					name: name,
					reverse: false
				});
			}

			this.updateSorterDescription();
		},

		// remove all sorters except the first one
		// returning true means visible ship list needs to be updated.
		cutCurrentSorter: function() {
			if (this.currentSorters.length > 1) {
				this.currentSorters = [ this.currentSorters[0] ];
				this.updateSorterDescription();
				return true;
			}
			return false;
		},

		setCurrentSorter: function(name) {
			var sorter = this.sorters[name];
			console.assert(sorter, "sorter should have been registered");
			this.currentSorters = [ {name: sorter.name, reverse:false} ];
			this.updateSorterDescription();
		},

		updateSorterDescription: function() {
			var self = this;
			var desc = this.currentSorters
				.map(function(sorterInfo) {
					var sorter = self.sorters[sorterInfo.name];
					return sorterInfo.reverse
						? sorter.desc + "(R)"
						: sorter.desc;
				})
				.join(" > ");

			this.sorterDescCtrl.text( desc );
		},

		// create comparator based on current list sorters
		makeComparator: function() {
			function reversed(comparator) {
				return function(l, r) {
					return -comparator(l, r);
				};
			}
			function compose(prevComparator, nextComparator) {
				return function(l, r) {
					return prevComparator(l, r) || nextComparator(l, r);
				};
			}
			// Append sortno as default sorter to keep order stable
			var lastSorterReverse = this.getLastCurrentSorter().reverse;
			var mergedSorters = this.currentSorters.concat([{
				name: "sortno",
				reverse: lastSorterReverse
			}]);
			// To simulate in game behavior, if 1st sorter is stype, and no level found
			if(this.currentSorters[0].name == "type"
				&& this.currentSorters.every(si => si.name !== "lv")){
				mergedSorters.push({
					name: "lv",
					reverse: false
				});
			}
			// For duplicated ships, final sorter if roster ID not used
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

		// prepares necessary info.
		// also stores those that doesn't need to be recomputed overtime.
		prepareShipData: function(ship) {
			var ThisShip = ship;
			var MasterShip = ThisShip.master();
			var cached =  {
				id: ThisShip.rosterId,
				bid : ThisShip.masterId,
				stype: MasterShip.api_stype,
				ctype: MasterShip.api_ctype,
				sortno: MasterShip.api_sortno,
				name: ThisShip.name(),
				className: KC3Meta.ctypeName(MasterShip.api_ctype),
				fullName: KC3Meta.term("ShipListFullNamePattern")
					.format(KC3Meta.ctypeName(MasterShip.api_ctype), ThisShip.name()),
				level: ThisShip.level,
				levelClass: ThisShip.levelClass(),
				morale: ThisShip.morale,
				equip: ThisShip.items,
				locked: ThisShip.lock,

				hp: ThisShip.hp[1],
				fp: [MasterShip.api_houg[1], MasterShip.api_houg[0]+ThisShip.mod[0], ThisShip.fp[0] ],
				tp: [MasterShip.api_raig[1], MasterShip.api_raig[0]+ThisShip.mod[1], ThisShip.tp[0] ],
				yasen: [
					MasterShip.api_houg[1] + MasterShip.api_raig[1],
					MasterShip.api_houg[0]+ThisShip.mod[0] + MasterShip.api_raig[0]+ThisShip.mod[1],
					ThisShip.fp[0] + ThisShip.tp[0]
				],
				aa: [MasterShip.api_tyku[1], MasterShip.api_tyku[0]+ThisShip.mod[2], ThisShip.aa[0] ],
				ar: [MasterShip.api_souk[1], MasterShip.api_souk[0]+ThisShip.mod[3], ThisShip.ar[0] ],
				as: [this.getDerivedStatNaked("tais", ThisShip.as[0], ThisShip), ThisShip.as[0] ],
				ev: [this.getDerivedStatNaked("houk", ThisShip.ev[0], ThisShip), ThisShip.ev[0] ],
				ls: [this.getDerivedStatNaked("saku", ThisShip.ls[0], ThisShip), ThisShip.ls[0] ],
				lk: [ThisShip.lk[0], ThisShip.lk[1], MasterShip.api_luck[0]],
				sp: ThisShip.speed,
				range: ThisShip.range,
				slots: ThisShip.slots,
				exSlot: ThisShip.ex_item,
				fleet: ThisShip.onFleet(),
				ship: ThisShip,
				master: ThisShip.master(),
				// Check whether remodel is max
				remodel: RemodelDb.isFinalForm(ship.masterId),
				canEquipDaihatsu: ThisShip.canEquipDaihatsu()
			};
			var ThisShipData = cached;
			// Check whether modernization is max
			if( ThisShipData.fp[0] == ThisShipData.fp[1]
				&& ThisShipData.tp[0] == ThisShipData.tp[1]
				&& ThisShipData.aa[0] == ThisShipData.aa[1]
				&& ThisShipData.ar[0] == ThisShipData.ar[1]
			  )
				ThisShipData.statmax = 1;
			else
				ThisShipData.statmax = 0;
			return cached;
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			// now we need to do this before preparing filters
			// Ship types
			var sCtr, cElm;

			for(sCtr in KC3Meta._stype){
				// stype 12, 15 not used by shipgirl
				// stype 1 is used from 2017-05-02
				if(KC3Meta._stype[sCtr] && ["12", "15"].indexOf(sCtr) < 0){
					cElm = $(".tab_ships .factory .ship_filter_type").clone().appendTo(".tab_ships .filters .ship_types");
					cElm.data("id", sCtr);
					$(".filter_name", cElm).text(KC3Meta.stype(sCtr));
				}
			}

			$(".pages_yes").on("click", function(){
				$(".ingame_page").show();
				if(!self.pageNo){
					self.pageNo = true;
					self.saveSettings();
				}
			});
			$(".pages_no").on("click", function(){
				$(".ingame_page").hide();
				if(self.pageNo){
					self.pageNo = false;
					self.saveSettings();
				}
			});
			$(".control_buttons .reset_default").on("click", function(){
				self.equipMode = 0;
				self.pageNo = false;
				self.multiKey = false;
				self.currentSorters = [{name:"lv", reverse:false}];
				delete localStorage.srShiplist;
				KC3StrategyTabs.reloadTab(undefined, true);
			});

			var multiKeyCtrl = $( ".advanced_sorter .adv_sorter" );
			var updateSorterControl = function() {
				$(".filter_check", multiKeyCtrl).toggle( self.multiKey );
				self.sorterDescCtrl.toggle(self.multiKey);
			};
			multiKeyCtrl.on("click", function() {
				self.multiKey = ! self.multiKey;

				updateSorterControl();

				if (! self.multiKey) {
					var needUpdate = self.cutCurrentSorter();
					if (needUpdate)
						self.refreshTable();
				}
			});

			$(".pages_yes").on("click", function(){
				$(".ingame_page").show();
			});
			$(".pages_no").on("click", function(){
				$(".ingame_page").hide();
			});
            
            /* Filter for duplicates */
            $(".dupe_filter").on("click", function() {
                if (!$(this).hasClass("active")) {
                    $(".ship_list .ship_item").each(function() {
                        var thisShipId = parseInt($(this).find(".ship_id").text());
                        /* Find master ID */
                        var result = $.grep(KC3StrategyTabs.ships.definition.shipCache, function(e) {
                            return e.id === thisShipId;
                        });
                        var dupeCount = 0;
                        function getDupeShipsCount() {
                            var dupeCheck = $.grep(KC3StrategyTabs.ships.definition.shipCache, function(e) {
                                if (e.bid === RemodelDb.remodelGroup(result[0].bid)[i])
                                    dupeCount++;
                            });
                        }
                        /* Iterate ship group of master ID over every ship in list */
                        for (var i = 0, len = RemodelDb.remodelGroup(result[0].bid).length; i < len; i++) {
                            getDupeShipsCount();
                        }
                        if (dupeCount === 1) {
                            $(this).addClass("dupe_hidden");
                        }
                    });
                } else {
                    $(".ship_list .ship_item").removeClass("dupe_hidden");
                }
                $(this).find(".dupe_filter_check").toggle();
                $(this).toggleClass("active");
            });
            
            /* Name filter */
            $(".name_filter").on("keyup", function() {
                if ($(".name_filter").length > 0) {
                    $(".ship_list .ship_item").each(function() {
                        var currentShipName = $(this).find(".ship_name").text();
                        var shipSearch = $(".name_filter").val();
                        if (currentShipName.toLowerCase().indexOf(shipSearch.toLowerCase()) < 0) {
                            $(this).addClass("name_hidden");
                        } else {
                            $(this).removeClass("name_hidden");
                        }
                    });
                } else {
                    $(".ship_list .ship_item").removeClass("name_hidden");
                }
            });

			this.loadSettings();
			this.sorterDescCtrl = $(".advanced_sorter .sorter_desc");
			this.updateSorterDescription();
			updateSorterControl();

			this.prepareFilters();
			this.shipList = $(".tab_ships .ship_list");
			this.showFilters();
		},

		// default UI actions for options that are mutually exclusive
		// NOTE: this function is supposed to be a shared callback function
		// and should not be called directly.
		_mutualExclusiveOnToggle: function(selectedInd,optionRep,initializing) {
			// mutural exclusive options use just value indices
			// as the option value
			var oldVal = optionRep.curValue;
			if (oldVal === selectedInd)
				return;
			// first update value
			optionRep.curValue = selectedInd;
			// then update UI accordingly
			$.each(optionRep.options, function(thisInd, optionObj) {
				optionObj.view.toggleClass('on', thisInd === selectedInd);
			});
			// only trigger update when it's not the first time
			// first time we just need to give it a initial value (default value)
			// and then upate UI.
			if (!initializing)
				this.refreshTable();
		},

		// findView given filter's name and this option
		// NOTE: this function is supposed to be a shared callback function
		// and should not be called directly.
		_commonFindView: function(filterName, option) {
			return $(".tab_ships .filters .massSelect"
					 +" ." + filterName
					 + "_" + option);
		},

		/*
		   defineShipFilter defines a filter that has UI controls.
		   see comments on each arguments for detail.
		 */
		defineShipFilter: function(
			// a string name for this filter
			filterName,
			// ship filters can hold a piece of value
			// which represents its state.
			// (e.g. true / false for keeping track of whether
			//  this filter is enabled or disable)
			defValue,
			// an array of arbitrary values, each of the option should
			// correspond to a toggle / control on UI
			options,
			// a callback function testShip(curVal,ship)
			// that does the actual fitlering:
			// returning a falsy value means
			// the ship should be filtered out from the list.
			// curVal is the current state of the filter.
			testShip,
			// findView(filterName,option) should return
			// a jQuery object that represents the UI control specified by
			// "filterName" and "option", where "option" is one value from "options"
			// note that the length of the jquery object has to be exactly one,
			// otherwise you'll see assertion failures in the console.
			findView,
			// onToggle(newVal,optionRep,initializing) that triggers either when initializing
			// or when user has changed something on UI.
			// optionRep is the runtime representation of this filter:
			// * optionRep.curValue represents the current value
			//   held by this filter, when initializing, this value is set to "null".
			// * optionRep.options is the runtime representation of
			//   all options you have passed to this function.
			//   for all valid options indices ind
			//   * optionRep.options[ind].name is set to options[ind]
			//   * optionRep.options[ind].view is set to the jQuery object returned
			//     by your "findView".
			// * initializing: newly added to help indicate whether we are initializing
			// your onToggle is responsible for 2 things:
			// * when initalizing a filter, "optionRep.curValue" is set to "null",
			//   in this case "newVal" is "defValue" you passed to this function,
			//   you should do something like "optionRep.curValue = newVal"
			//   to complete initializing filter state. and update UI accordingly
			//   (but avoid refreshing ship list, since we are just initalizing)
			// * when user does something on UI, your onToggle function will be triggered.
			//   in this case "newVal" is set to an index of "options" to indicate
			//   which option triggers this function. in this case you are responsible
			//   for updating "optionRep.curValue" accordingly, updating UI to reflect the change
			//   and finally refresh ship list to execute all filters.
			onToggle) {
			var self = this;
			// as most filters are groups of mutually exclusive controls
			// it makes sense setting them as defaults
			if (! findView)
				findView = this._commonFindView;
			if (! onToggle)
				onToggle = this._mutualExclusiveOnToggle;

			var newOptions = [];
			$.each(options, function(ind, optionName) {
				var thisOption = {};
				var view = findView(filterName,optionName);
				thisOption.name = optionName;
				thisOption.view = view;
				thisOption.view.on('click', function() {
					var curRep = self.newFilterRep[filterName];
					var selectedInd = ind;
					curRep.onToggle.call(self,selectedInd,curRep,false);
				});
				console.assert(
					thisOption.view.length === 1,
					"expecting exactly one result of getView on "
						+ filterName  + "," + optionName );
				newOptions.push( thisOption );
			});

			var optionRep = {
				curValue: null,
				options: newOptions,
				onToggle: onToggle,
				testShip: function (ship) {
					return testShip(optionRep.curValue,ship);
				}
			};

			this.newFilterRep[filterName] = optionRep;
			optionRep.onToggle.call(self,defValue,optionRep,true);
		},

		prepareFilters: function() {
			var self = this;
			var savedFilterValues = this.settings.filters || {};
			self.defineShipFilter(
				"marriage",
				savedFilterValues.marriage || 0,
				[ "in","on","ex" ],
				function(curVal, ship) {
					return (curVal === 0)
						|| (curVal === 1 && ship.level >= 100)
						|| (curVal === 2 && ship.level <  100);
				});

			self.defineShipFilter(
				"remodel",
				savedFilterValues.remodel || 0,
				["all","max","nomax"],
				function(curVal, ship) {
					return (curVal === 0)
						|| (curVal === 1 && ship.remodel)
						|| (curVal === 2 && !ship.remodel);
				});

			self.defineShipFilter(
				"modernization",
				savedFilterValues.modernization || 0,
				["all","max","nomax"],
				function(curVal, ship) {
					return (curVal === 0)
						|| (curVal === 1 && ship.statmax)
						|| (curVal === 2 && !ship.statmax);
				});

			self.defineShipFilter(
				"heartlock",
				savedFilterValues.heartlock || 0,
				["all","yes","no"],
				function(curVal, ship) {
					return (curVal === 0)
						|| (curVal === 1 && ship.locked === 1)
						|| (curVal === 2 && ship.locked === 0);
				});

			self.defineShipFilter(
				"speed",
				savedFilterValues.speed || 0,
				["all","slow","fast","faster","fastest"],
				function(curVal,ship) {
					return (curVal === 0)
						|| (curVal === 1 && ship.sp > 0 && ship.sp < 10)
						|| (curVal === 2 && ship.sp >= 10 && ship.sp < 15)
						|| (curVal === 3 && ship.sp >= 15 && ship.sp < 20)
						|| (curVal === 4 && ship.sp >= 20);
				});

			self.defineShipFilter(
				"fleet",
				savedFilterValues.fleet || 0,
				["all", "yes","no"],
				function(curVal,ship) {
					return (curVal === 0)
						|| (curVal === 1 && ship.fleet)
						|| (curVal === 2 && !ship.fleet);
				});

			self.defineShipFilter(
				"sparkle",
				savedFilterValues.sparkle || 0,
				["all", "yes","no"],
				function(curVal, ship) {
					return (curVal === 0)
						|| (curVal === 1 && ship.morale >= 50)
						|| (curVal === 2 && ship.morale < 50);
				});

			self.defineShipFilter(
				"daihatsu",
				savedFilterValues.daihatsu || 0,
				["all", "yes","no"],
				function(curVal, ship) {
					return (curVal === 0)
						|| (curVal === 1 && ship.canEquipDaihatsu)
						|| (curVal === 2 && !ship.canEquipDaihatsu);
				});

			self.defineShipFilter(
				"exslot",
				savedFilterValues.exslot || 0,
				["all", "yes","no"],
				function(curVal, ship) {
					return (curVal === 0)
						|| (curVal === 1 && (ship.exSlot > 0 || ship.exSlot === -1))
						|| (curVal === 2 && ship.exSlot === 0);
				});

			self.defineShipFilter(
				"dupe",
				savedFilterValues.dupe || 0,
				["all", "yes","no"],
				function(curVal, ship) {
					if(curVal === 0) return true;
					var dupeShips = self.shipCache.filter(s =>
						(RemodelDb.originOf(ship.bid) === RemodelDb.originOf(s.bid)
							&& s.id !== ship.id)
					);
					return (curVal === 1 && dupeShips.length > 0)
							|| (curVal === 2 && dupeShips.length === 0);
				});

			self.defineShipFilter(
				"range",
				savedFilterValues.range || 0,
				["all","short","medium","long","verylong"],
				function(curVal, ship) {
					return (curVal === 0)
						|| (curVal === ship.range);
				});

			var stypes = Object
				.keys(KC3Meta._stype)
				.map(function(x) { return parseInt(x,10); })
				.filter(function(x) { return [12,15].indexOf(x)<0; })
				.sort(function(a,b) { return a-b; });
			console.assert(stypes[0] === 0, "stype array should start with element 0");
			// remove initial "0", which is invalid
			stypes.shift();
			var stypeDefValue = [];
			$.each(stypes, function(ignore, stype) {
				stypeDefValue[stype] = true;
			});

			self.defineShipFilter(
				"stype",
				savedFilterValues.stype || stypeDefValue,
				// valid ship types and addtionally 3 controls
				stypes.concat(["all","none","invert"]),
				// testShip
				function(curVal,ship) {
					return curVal[ship.stype];
				},
				// find view
				function (filterName,option) {
					if (typeof option === "number") {
						// this is a ship type toggle
						return $(".tab_ships .filters .ship_types .ship_filter_type")
							.filter( function() {  return $(this).data("id") === "" + option;  }  );
					} else {
						// one of: all / none / invert
						return $(".tab_ships .filters .massSelect ." + option);
					}
				},
				// onToggle
				function(selectedInd, optionRep, initializing) {
					if (initializing) {
						// the variable name is a bit misleading..
						// but at this point we should set the initial value
						optionRep.curValue = selectedInd;
					} else {
						var selected = optionRep.options[selectedInd];
						if (typeof selected.name === 'number') {
							// this is a ship type toggle
							optionRep.curValue[selected.name] = !optionRep.curValue[selected.name];
						} else {
							$.each(stypes, function(ignore, stype) {
								optionRep.curValue[stype] =
									(selected.name === "all")
									? true
									: (selected.name === "none")
									? false
									: ! optionRep.curValue[stype];
							});
						}
					}
					// update UI
					$.each(optionRep.options, function(ignored, x) {
						if (typeof x.name === "number") {
							$( ".filter_check", x.view ).toggle( optionRep.curValue[x.name]  );
						}
					});
					if (!initializing)
						self.refreshTable();
				}
			);
		},

		// execute all registered filters on a ship
		executeFilters: function(ship) {
			for(let key in this.newFilterRep) {
				var filter = this.newFilterRep[key].testShip;
				if (!filter(ship)) return false;
			}
			return true;
		},

		saveSettings: function() {
			var shrinkedSettings = {
				sorters: this.currentSorters,
				filters: {},
				views: {}
			};
			for(let key in this.newFilterRep) {
				shrinkedSettings.filters[key] = this.newFilterRep[key].curValue;
			}
			shrinkedSettings.views.equip = this.equipMode;
			shrinkedSettings.views.page = this.pageNo;
			shrinkedSettings.views.scroll = this.scrollList;
			shrinkedSettings.views.lock = this.heartLockMode;
			shrinkedSettings.views.ctype = this.className;
			this.settings = shrinkedSettings;
			localStorage.srShiplist = JSON.stringify(this.settings);
		},

		loadSettings: function() {
			this.settings = JSON.parse( localStorage.srShiplist || "{}" );
			if(this.settings.sorters){
				this.currentSorters = this.settings.sorters;
				if(this.currentSorters.length > 1)
					this.multiKey = true;
			}
			if(this.settings.views){
				this.equipMode = this.settings.views.equip || 0;
				this.pageNo = this.settings.views.page || false;
				this.scrollList = this.settings.views.scroll || false;
				this.heartLockMode = this.settings.views.lock || 0;
				this.className = this.settings.views.ctype || false;
			}
		},

		/* FILTERS
		Ship types, and other toggles
		---------------------------------*/
		showFilters :function(){
			var self = this;
			var sCtr;

			// Equip Stats: Yes
			self.viewElements.equip_yes = $(".tab_ships .filters .massSelect .equip_yes")
			.on("click", function(){
				self.equipMode = 1;
				self.refreshTable();
				self.viewElements.equip_yes.addClass('on');
				self.viewElements.equip_no.removeClass('on');
			});

			// Equip Stats: No
			self.viewElements.equip_no = $(".tab_ships .filters .massSelect .equip_no")
			.on("click", function(){
				self.equipMode = 0;
				self.refreshTable();
				self.viewElements.equip_yes.removeClass('on');
				self.viewElements.equip_no.addClass('on');
			});

			// Default status
			if( self.equipMode )
				self.viewElements.equip_yes.addClass('on');
			else
				self.viewElements.equip_no.addClass('on');

			// Column header sorting
			$(".tab_ships .ship_header .ship_field.hover").on("click", function(){
				var sorter = self.getLastCurrentSorter();
				var sorterName = $(this).data("type");
				if (sorterName === sorter.name) {
					self.reverseLastCurrentSorter();
				} else {
					if (self.multiKey) {
						// for multi index sorters
						self.pushToCurrentSorters( sorterName );
					} else {
						// for normal sorters
						self.setCurrentSorter( sorterName  );
					}
				}
				self.refreshTable();
			});

			this.refreshTable();
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

			define("id", "Id",
				   function(x) { return x.id; });
			define("name", "Name",
				   function(x) { return this.className ? x.fullName : x.name; });
			define("type", "Type",
				   function(x) { return x.stype; });
			define("lv", "Level",
				   function(x) { return -x.level; });
			define("morale", "Morale",
				   function(x) { return -x.morale; });
			define("hp", "HP",
				   function(x) { return -x.hp; });
			define("fp", "Firepower",
				   function(x) { return -x.fp[this.equipMode+1]; });
			define("tp", "Torpedo",
				   function(x) { return -x.tp[this.equipMode+1]; });
			define("yasen", "Yasen",
				   function(x) { return -(x.fp[this.equipMode+1] + x.tp[this.equipMode+1]); });
			define("aa", "Anti-Air",
				   function(x) { return -x.aa[this.equipMode+1]; });
			define("ar", "Armor",
				   function(x) { return -x.ar[this.equipMode+1]; });
			define("as", "ASW",
				   function(x) { return -x.as[this.equipMode]; });
			define("ev", "Evasion",
				   function(x) { return -x.ev[this.equipMode]; });
			define("ls", "LoS",
				   function(x) { return -x.ls[this.equipMode]; });
			define("lk", "Luck",
				   function(x) { return -x.lk[0]; });
			define("ctype", "Class",
				   function(x) { return x.ctype; });
			define("bid", "ShipId",
				   function(x) { return x.bid; });
			define("sortno", "SortOrder",
				   function(x) { return x.sortno; });
		},

		/* REFRESH TABLE
		Reload ship list based on filters
		---------------------------------*/
		refreshTable :function(){
			// use "isLoading" to check if we need UI update.
			if(this.isLoading){ return false; }
			this.isLoading = true;
			this.saveSettings();

			var self = this;
			this.startTime = Date.now();

			// Update indicators of sorters
			$(".tab_ships .ship_header .ship_field.hover").removeClass("sorted");
			$.each(this.currentSorters, function(i, s){
				$(".tab_ships .ship_header .ship_field.hover.ship_{0}".format(s.name)).addClass("sorted");
			});

			// Clear list
			this.shipList.empty().hide();

			// Wait until execute
			setTimeout(function(){
				var shipCtr, cElm, cShip, shipLevel;

				// Filtering
				var FilteredShips = self.shipCache.filter(function(x) {
					return self.executeFilters(x);
				});

				// Sorting
				FilteredShips.sort( self.makeComparator() );

				// Fill up list
				Object.keys(FilteredShips).forEach(function(shipCtr){
					if(shipCtr%10 === 0){
						$("<div>").addClass("ingame_page")
							.html("Page "+Math.ceil((Number(shipCtr)+1)/10))
							.appendTo(self.shipList);
					}

					cShip = FilteredShips[shipCtr];
					shipLevel = cShip.level;

					// we can save some time by avoiding constructing jquery object
					// if we already have one
					if (cShip.view) {
						cElm = cShip.view;
						cElm.appendTo(self.shipList);

						if (cElm.onRecompute)
							cElm.onRecompute(cShip);
						return;
					}

					// elements constructing for the time-consuming 'first time rendering'
					cElm = $(".tab_ships .factory .ship_item").clone().appendTo(self.shipList);
					cShip.view = cElm;
					if(shipCtr%2 === 0){ cElm.addClass("even"); }else{ cElm.addClass("odd"); }

					$(".ship_id", cElm).text( cShip.id );
					$(".ship_img .ship_icon", cElm).attr("src", KC3Meta.shipIcon(cShip.bid));
					$(".ship_img .ship_icon", cElm).attr("alt", cShip.bid);
					if(shipLevel >= 100) {
						$(".ship_name", cElm).addClass("ship_kekkon-color");
					}
					if(cShip.fleet > 0) {
						$(".ship_name", cElm).addClass("ship_onfleet-color" + cShip.fleet);
					}
					$(".ship_type", cElm).text( KC3Meta.stype(cShip.stype) );
					$(".ship_lv .value", cElm).text( shipLevel )
						.addClass( cShip.levelClass );
					$(".ship_morale", cElm).text( cShip.morale );
					$(".ship_hp", cElm).text( cShip.hp );
					$(".ship_lk", cElm).text( cShip.lk[0] );
					if(cShip.lk[0] >= cShip.lk[1]){
						$(".ship_lk", cElm).addClass("max");
					} else if(cShip.lk[0] > cShip.lk[2]){
						$(".ship_lk", cElm)
							.append("<sup class='sub'>{0}</sup>".format(cShip.lk[0] - cShip.lk[2]));
					}

					if(cShip.morale >= 50){ $(".ship_morale", cElm).addClass("sparkled"); }

					// Check whether remodel is max
					if( !cShip.remodel )
						cElm.addClass('remodel-max');
					else
						cElm.addClass('remodel-able');

					// Check whether modernization is max
					if( cShip.statmax )
						cElm.addClass('modernization-max');
					else
						cElm.addClass('modernization-able');

					[1,2,3,4].forEach(function(x){
						self.equipImg(cElm, x, cShip.slots[x-1], cShip.equip[x-1]);
					});
					if(cShip.exSlot !== 0){
						self.equipImg(cElm, "ex", -2, cShip.exSlot);
					}

					// callback for things that has to be recomputed
					cElm.onRecompute = function(ship) {
						const thisShip = ship || cShip;
						// Reset shown ship name
						const showName = self.className ? thisShip.fullName : thisShip.name;
						$(".ship_name", this)
							.text( showName )
							.attr("title",
								KC3StrategyTabs.isTextEllipsis($(".ship_name", this)) ? showName : ""
							);
						// Recomputes stats
						self.modernizableStat("fp", this, thisShip.fp);
						self.modernizableStat("tp", this, thisShip.tp);
						self.modernizableStat("yasen", this, thisShip.yasen);
						self.modernizableStat("aa", this, thisShip.aa);
						self.modernizableStat("ar", this, thisShip.ar);
						$(".ship_as", this).text( thisShip.as[self.equipMode] );
						$(".ship_ev", this).text( thisShip.ev[self.equipMode] );
						$(".ship_ls", this).text( thisShip.ls[self.equipMode] );
						// Reset heart-lock icon
						$(".ship_lock img", this).attr("src",
							"../../assets/img/client/heartlock{0}.png"
								.format(!thisShip.locked ? "-x" : "")
						).show();
						if((self.heartLockMode === 1 && thisShip.locked)
						|| (self.heartLockMode === 2 && !thisShip.locked)) {
							$(".ship_lock", this).show();
						} else {
							$(".ship_lock", this).hide();
						}
						// Rebind click handlers
						$(".ship_img .ship_icon", this).click(self.shipClickFunc);
						$(".ship_equip_icon img", this).click(self.gearClickFunc);
					};
					// also invoke recompute for the first time
					cElm.onRecompute(cShip);

				});

				self.shipList.show().createChildrenTooltips();
				$(".ship_count .count_value").text(
					"{0} /{1}".format(FilteredShips.length, self.shipCache.length)
				);
				$(".ingame_page").toggle(self.pageNo);
				self.toggleTableScrollbar(self.scrollList);
				self.isLoading = false;
				console.debug("Showing ship list took", (Date.now() - self.startTime)-100 , "milliseconds");
			}, 100);
		},

		shipClickFunc: function(e){
			KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
		},

		gearClickFunc: function(e){
			KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
		},

		toggleTableScrollbar: function(isFixed){
			$(".ship_list").toggleClass("scroll_fix", isFixed);
			$(".page_padding").toggleClass("scroll_fix", isFixed);
			if(isFixed){
				$(".ship_list").height(window.innerHeight - $(".ship_list").offset().top - 5);
			}
		},

		/* Compute Derived Stats without Equipment
		--------------------------------------------*/
		getDerivedStatNaked :function(StatName, EquippedValue, ShipObj){
			var Items = ShipObj.equipment(true);
			for(var ctr in Items){
				if(Items[ctr].itemId > 0){
					EquippedValue -= Items[ctr].master()["api_"+StatName];
				}
			}
			return EquippedValue;
		},

		/* Show cell contents of a mod stat
		--------------------------------------------*/
		modernizableStat :function(stat, cElm, Values){
			$(".ship_"+stat, cElm).text( Values[this.equipMode+1] );
			if(Values[0] == Values[1]){
				$(".ship_"+stat, cElm).addClass("max");
			}else{
				$(".ship_"+stat, cElm).append("<span>+"+(Values[0] - Values[1])+"</span>");
			}
		},

		/* Show single equipment icon
		--------------------------------------------*/
		equipImg :function(cElm, equipNum, equipSlot, gearId){
			var element = $(".ship_equip_" + equipNum, cElm);
			if(gearId > 0){
				var gear = KC3GearManager.get(gearId);
				if(gear.itemId<=0){ element.hide(); return; }

				$("img",element)
					.attr("src", "../../assets/img/items/" + gear.master().api_type[3] + ".png")
					.attr("title", gear.htmlTooltip(equipSlot))
					.attr("alt", gear.master().api_id)
					.show();
				$("span",element).css('visibility','hidden');
			} else {
				$("img",element).hide();
				$("span",element).each(function(i,x){
					if(equipSlot > 0)
						$(x).text(equipSlot);
					else if(equipSlot === -2)
						// for ex slot opened, but not equipped
						$(x).addClass("empty");
					else
						$(x).css('visibility','hidden');
				});
			}
		}
	};

})();
