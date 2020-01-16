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
			showTooltip: false,
			// a special filter for quick search by show name
			showNameFilter: "",
			// a special filter for quick limit ships by level range
			shipLevelFilter: ["", ""],
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
			for(const key in KC3ShipManager.list){
				const shipData = KC3ShipManager.list[key];
				// Exclude ship(s) that not exist in master to avoid render error
				if(!KC3Master.ship(shipData.masterId)) {
					continue;
				}
				const preparedData = this.prepareShipData(shipData);
				this.shipCache.push(preparedData);
			}
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;

			// Binding click event starts
			$(".filters_label").on("click", function(){
				$(".filters .ship_types").slideToggle(300);
				$(".filters .input_filter").slideToggle(300);
				$(".filters .massSelect").slideToggle(300, function(){
					$(".filters_label .fold_button").toggleClass("glyph_minus", $(this).is(":visible"));
					$(".filters_label .fold_button").toggleClass("glyph_plus", !$(this).is(":visible"));
					if(self.scrollList){
						self.toggleTableScrollbar(true);
					}
				});
			});
			$(".fleet_stats_label").on("click", function(){
				$(".filters .fleet_stats").slideToggle(300, function(){
					$(".fleet_stats_label .fold_button").toggleClass("glyph_minus", $(this).is(":visible"));
					$(".fleet_stats_label .fold_button").toggleClass("glyph_plus", !$(this).is(":visible"));
					if(self.scrollList){
						self.toggleTableScrollbar(true);
					}
				});
			});
			$(".pages_yes").on("click", function(){
				if(!self.pageNo){
					self.pageNo = true;
					self.saveSettings();
				}
				self.refreshInputFilter();
			});
			$(".pages_no").on("click", function(){
				if(self.pageNo){
					self.pageNo = false;
					self.saveSettings();
				}
				self.refreshInputFilter();
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
			$(".tooltip_yes").on("click", function(){
				if(!self.showTooltip){
					self.showTooltip = true;
					self.saveSettings();
				}
				KC3StrategyTabs.reloadTab(undefined, false);
			});
			$(".tooltip_no").on("click", function(){
				if(self.showTooltip){
					self.showTooltip = false;
					self.saveSettings();
				}
				KC3StrategyTabs.reloadTab(undefined, false);
			});
			$(".ship_export .export_to_kanmusu_list").on("click", function() {
				// Export currently visible ships
				var selectedShips = self.shipCache.filter(function(x) {
					return self.executeFilters(x);
				});
				selectedShips.sort( function(a, b) {
					return RemodelDb.originOf(a.bid) - RemodelDb.originOf(b.bid) 
						|| b.ship.level - a.ship.level; 
				});

				var previousId = 0;
				var importString = ".2";
				// Format .2|shipId:shipLevel|shipId2:shipLevel2.remodel,shipLevel3|...
				for(var i = 0; i < selectedShips.length; i++) {
					var ship = selectedShips[i];
					var shipId = ship.bid;
					if(RemodelDb.originOf(shipId) === previousId)
						// Dupes are separated with ,
						importString += ",";
					else // While first ones are separated by |shipId
						importString += "|" + RemodelDb.originOf(shipId) + ":";
					importString += ship.ship.level;
					if(RemodelDb.remodelInfo(shipId) && ship.ship.level >= RemodelDb.remodelInfo(shipId).level) {
						var group = RemodelDb.remodelGroup(shipId);
						var remodelNumber = group.indexOf(shipId) + 1;
						if(remodelNumber < group.length) // Not necessary for last cyclic remodels
							importString += "." + remodelNumber;
					}
					previousId = RemodelDb.originOf(shipId);
				}

				// Customized base64 encoding: http://kancolle-calc.net/data/share.js
				var CODE = [ '0000', '0001', '0010', '0011', '0100', '0101', '0110', '0111',
					'1000', '1001', '1010', '1011', '1100', '1101' ];
				var BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-';

				var buff = '';
				var outputString = '';
				for (var j = 0; j < importString.length; j++) {
					var c = importString.charAt(j);
					var pos;
					if (c == ',') {
						pos = 10;
					} else if (c == '|') {
						pos = 11;
					} else if (c == '.') {
						pos = 12;
					} else if (c == ':') {
						pos = 13;
					} else {
						pos = parseInt(c);
					}
					buff += CODE[pos];
					if (buff.length >= 6) {
						var seg = buff.slice(0, 6);
						outputString += BASE64.charAt(parseInt(seg, 2));
						buff = buff.slice(6);
					}
				}
				if (buff.length > 0) {
					while (buff.length < 6) {
						buff += '1';
					}
					outputString += BASE64.charAt(parseInt(buff, 2));
				}
				
				window.open("http://kancolle-calc.net/kanmusu_list.html?data=" + outputString);
			});
			$(".ship_export .export_to_kancepts").on("click", function() {
				window.open("https://javran.github.io/kancepts/?sl=" + 
					self.shipCache.filter(x => x.locked).map(function(x) {
						return (x.ship.level > 99 ? "r" : "") + x.bid;
					}).join(","));
			});
			$(".control_buttons .reset_default").on("click", function(){
				delete self.currentSorters;
				$.extend(true, self, self.defaultSettings);
				delete localStorage.srShiplist;
				KC3StrategyTabs.reloadTab(undefined, true);
			});
			// Binding click event ends

			// Update ship stats header icon set
			$(".tab_ships .ship_header .ship_stat:not(.not_stat) img").each((_, img) => {
				$(img).attr("src", KC3Meta.statIcon($(img).parent().data("type")));
			});
			$(".ship_tooltip .stat_icon img").each((_, img) => {
				$(img).attr("src", KC3Meta.statIcon($(img).parent().data("stat")));
			});

			// Add filter elements of ship types before `prepareFilters` executed
			$.each(KC3Meta.sortedStypes(), (idx, stype) => {
				// stype 12, 15 not used by shipgirl, marked as order 999
				// stype 1 is used from 2017-05-02
				if(stype.id && stype.order < 999){
					const cElm = $(".tab_ships .factory .ship_filter_type").clone()
						.appendTo(".tab_ships .filters .ship_types");
					cElm.data("id", stype.id);
					$(".filter_name", cElm).text(stype.name);
				}
			});

			// Update multi sorter elements
			const multiKeyCtrl = $( ".advanced_sorter .adv_sorter" );
			const updateSorterControl = function() {
				$(".filter_check", multiKeyCtrl).toggle( self.multiKey );
				self.sorterDescCtrl.toggle(self.multiKey);
			};
			multiKeyCtrl.on("click", function() {
				self.multiKey = ! self.multiKey;

				updateSorterControl();

				if (! self.multiKey) {
					const needUpdate = self.cutCurrentSorter();
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

			// Ship show name quick filter
			$(".show_name_filter .name_criteria").on("keyup", () => {
				this.refreshInputFilter();
			}).on("focus", () => {
				$(".show_name_filter .name_criteria").select();
			}).val(this.showNameFilter);

			// Ship level range quick filter
			const lvStartInput = $(".ship_level_filter .level_start_input");
			const lvEndInput = $(".ship_level_filter .level_end_input");
			const validateLevelString = (str) => {
				const v = Number(str);
				return str === "" || (
					!isNaN(v) && Number.isInteger(v) && v > 0 && v <= KC3Ship.getMaxLevel()
				);
			};
			lvStartInput.on("keyup", () => {
				const isValid = validateLevelString(lvStartInput.val());
				lvStartInput.toggleClass("error", !isValid);
				if(isValid) this.refreshInputFilter();
			}).on("focus", () => {
				lvStartInput.select();
			}).val(this.shipLevelFilter[0]);
			lvEndInput.on("keyup", () => {
				const isValid = validateLevelString(lvEndInput.val());
				lvEndInput.toggleClass("error", !isValid);
				if(isValid) this.refreshInputFilter();
			}).on("focus", () => {
				lvEndInput.select();
			}).val(this.shipLevelFilter[1]);
		},

		refreshInputFilter: function() {
			const self = this;
			let hiddenShips = 0;

			const newNameCriteria = $(".show_name_filter .name_criteria").val();
			const levelStartCriteria = $(".ship_level_filter .level_start_input").val();
			const levelEndCriteria = $(".ship_level_filter .level_end_input").val();
			if (newNameCriteria.length || levelStartCriteria.length || levelEndCriteria.length) {
				let nameToSearch = newNameCriteria,
					isValidRegex = false;
				if (newNameCriteria.length) {
					try {
						nameToSearch = new RegExp(newNameCriteria, 'iu');
						isValidRegex = true;
					} catch (e) {
						// Ignore regexp syntax error, will fall-back to substring matching
						isValidRegex = false;
					}
					$(".show_name_filter .name_criteria").toggleClass("error", !isValidRegex);
				}
				$(".ship_list .ship_item").each(function() {
					const shipNameElm = $(".ship_name", this);
					// also search for JP name and kana yomi and romaji (useful for JP users)
					const shipName = (self.className ?
							shipNameElm.data("full-name") :
							shipNameElm.data("ship-name")),
						shipNameJp = (shipNameElm.data("jpname") || ""),
						shipNameKana = (shipNameElm.data("jpname-kana") || ""),
						shipNameRomaji = (shipNameElm.data("jpname-romaji") || "");
					const shipLevel = Number($(".ship_lv", this).data("level"));
					const isHiddenByName = newNameCriteria.length &&
						![shipName, shipNameJp, shipNameKana, shipNameRomaji]
							.some(v => isValidRegex ? nameToSearch.test(v) : v.includes(nameToSearch));
					// function `inside` will treat invalid number (like "") as -/+Infinity,
					// and it will auto swap min and max values if min > max
					const isHiddenByLevel = !shipLevel.inside(levelStartCriteria, levelEndCriteria);
					const isToHide = isHiddenByName || isHiddenByLevel;
					hiddenShips += isToHide & 1;
					$(this).toggleClass("hidden_by_name", isToHide);
				});
			} else {
				$(".ship_list .ship_item").removeClass("hidden_by_name");
				$(".show_name_filter .name_criteria").removeClass("error");
			}

			$(".ingame_page").remove();

			let visibleShips = 0;
			let [sumLevel, sumExp] = [0, 0];

			$(".ship_list .ship_item").each(function () {
				if (!$(this).hasClass("hidden_by_name")) {
					$(this).removeClass("odd even").addClass(visibleShips % 2 ? "even" : "odd");
					if (visibleShips % 10 === 0) {
						$("<div>")
							.addClass("ingame_page")
							.html("Page " + Math.ceil((visibleShips + 1) / 10))
							.insertBefore(this)
							.toggle(self.pageNo);
					}
					visibleShips++;

					// Calculate statistic
					const id = Number($('.ship_id', $(this)).text());
					const ship = KC3ShipManager.get(id);
					if (ship.rosterId) {
						sumLevel += ship.level;
						sumExp += ship.exp[0];
					}
				}
			});

			// Update statistic
			const localeOptions = {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1
			};
			const getSumDisplay = n => n.toLocaleString();
			const getAvarageDisplay = n => visibleShips ? (n / visibleShips).toLocaleString(undefined, localeOptions) : 0;
			// $(".fleet_stats_label .sum_ships").text(visibleShips);
			$(".fleet_stats .fleet_stat .sum_level").text(getSumDisplay(sumLevel));
			$(".fleet_stats .fleet_stat .average_level").text(getAvarageDisplay(sumLevel));
			$(".fleet_stats .fleet_stat .sum_exp").text(getSumDisplay(sumExp));
			$(".fleet_stats .fleet_stat .average_exp").text(getAvarageDisplay(sumExp));

			// update listed ship counter
			// have to take filtered list by data into account since hidden rows are still in list
			const filteredBefore = $(".ship_count .count_value .listed").data("filtered") || 0;
			$(".ship_count .count_value .listed").text(filteredBefore - hiddenShips);

			// save criteria values to settings
			let toUpdateSettings = false;
			if (this.showNameFilter !== newNameCriteria) {
				this.showNameFilter = newNameCriteria;
				toUpdateSettings = true;
			}
			if (this.shipLevelFilter[0] !== levelStartCriteria) {
				this.shipLevelFilter[0] = levelStartCriteria;
				toUpdateSettings = true;
			}
			if (this.shipLevelFilter[1] !== levelEndCriteria) {
				this.shipLevelFilter[1] = levelEndCriteria;
				toUpdateSettings = true;
			}
			if (toUpdateSettings) {
				this.saveSettings();
			}
			return hiddenShips;
		},
		
		getLastCurrentSorter: function() {
			return this.currentSorters[this.currentSorters.length-1];
		},

		reverseLastCurrentSorter: function() {
			const sorter = this.getLastCurrentSorter();
			sorter.reverse = ! sorter.reverse;
			this.updateSorterDescription();
		},

		// try pushing a new sorter to existing list
		// if the sorter already exists, the its "reverse"
		// value will be flipped.
		pushToCurrentSorters: function(name) {
			let found = false;
			for (let i = 0; !found && i < this.currentSorters.length; ++i) {
				const sorterInfo = this.currentSorters[i];
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
			const sorter = this.sorters[name];
			console.assert(sorter, "sorter should have been registered");
			this.currentSorters = [ {name: sorter.name, reverse:false} ];
			this.updateSorterDescription();
		},

		updateSorterDescription: function() {
			const self = this;
			const desc = this.currentSorters
				.map(function(sorterInfo) {
					const sorter = self.sorters[sorterInfo.name];
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
			const mergedSorters = this.currentSorters.slice(0);
			// Append sortno as default sorter to keep order stable if not used yet
			if(this.currentSorters.every(si => si.name !== "sortno")){
				const lastSorterReverse = this.getLastCurrentSorter().reverse;
				mergedSorters.push({
					name: "sortno",
					reverse: lastSorterReverse
				});
			}
			// To simulate phase 1 in-game behavior: if 1st sorter is stype,
			// reverse sortno and add descending level if necessary.
			// (no longer reverse for phase 2 `api_sort_id`)
			// For phase 2, also add descending level if 1st sorter is sortno
			if(["type", "sortno"].includes(this.currentSorters[0].name)){
				if(this.currentSorters.every(si => si.name !== "lv")){
					mergedSorters.push({
						name: "lv",
						reverse: false
					});
				}
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
					const sorter = this.sorters[sorterInfo.name];
					return sorterInfo.reverse
						? reversed(sorter.comparator)
						: sorter.comparator;
				})
				.reduce( compose );
		},

		// prepares necessary info.
		// also stores those that doesn't need to be recomputed overtime.
		prepareShipData: function(ship) {
			const ThisShip = ship;
			const MasterShip = ThisShip.master();
			const cached = {
				id: ThisShip.rosterId,
				bid : ThisShip.masterId,
				stype: MasterShip.api_stype,
				ctype: MasterShip.api_ctype,
				sortno: MasterShip.api_sort_id,
				name: ThisShip.name(),
				jpName: MasterShip.api_name,
				jpNameKana: MasterShip.api_yomi,
				jpNameRomaji: wanakana.toRomaji(MasterShip.api_yomi),
				className: KC3Meta.ctypeName(MasterShip.api_ctype),
				fullName: KC3Meta.term("ShipListFullNamePattern")
					.format(KC3Meta.ctypeName(MasterShip.api_ctype), ThisShip.name()),
				level: ThisShip.level,
				levelClass: ThisShip.levelClass(),
				morale: ThisShip.morale,
				equip: ThisShip.items,
				locked: ThisShip.lock,

				hp: [ThisShip.hp[1], ThisShip.maxHp(true), MasterShip.api_taik[0] ],
				fp: [MasterShip.api_houg[1], MasterShip.api_houg[0] + ThisShip.mod[0], ThisShip.fp[0] ],
				tp: [MasterShip.api_raig[1], MasterShip.api_raig[0] + ThisShip.mod[1], ThisShip.tp[0] ],
				yasen: [
					MasterShip.api_houg[1] + MasterShip.api_raig[1],
					MasterShip.api_houg[0] + ThisShip.mod[0] + MasterShip.api_raig[0] + ThisShip.mod[1],
					ThisShip.fp[0] + ThisShip.tp[0]
				],
				aa: [MasterShip.api_tyku[1], MasterShip.api_tyku[0]+ThisShip.mod[2], ThisShip.aa[0] ],
				ar: [MasterShip.api_souk[1], MasterShip.api_souk[0]+ThisShip.mod[3], ThisShip.ar[0] ],
				as: [ThisShip.nakedAsw(), ThisShip.maxAswMod(), ThisShip.nakedAsw() - ThisShip.mod[6], ThisShip.as[0] ],
				ev: [this.getDerivedStatNaked("houk", ThisShip.ev[0], ThisShip), ThisShip.ev[0] ],
				ls: [this.getDerivedStatNaked("saku", ThisShip.ls[0], ThisShip), ThisShip.ls[0] ],
				lk: [ThisShip.lk[0], ThisShip.lk[1], MasterShip.api_luck[0]],
				fuel: [MasterShip.api_fuel_max, ThisShip.fuel],
				ammo: [MasterShip.api_bull_max, ThisShip.ammo],
				sp: ThisShip.speed,
				isp: MasterShip.api_soku,
				range: ThisShip.range,
				irange: MasterShip.api_leng,
				slots: ThisShip.slots,
				exSlot: ThisShip.ex_item,
				slotNum: ThisShip.slotnum,
				fleet: ThisShip.onFleet(),
				ship: ThisShip,
				master: MasterShip,
				// Check whether remodel is max
				remodel: RemodelDb.isFinalForm(ship.masterId),
				canEquipDaihatsu: ThisShip.canEquipDaihatsu()
			};
			const ThisShipData = cached;
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

		// default UI actions for options that are mutually exclusive
		// NOTE: this function is supposed to be a shared callback function
		// and should not be called directly.
		_mutualExclusiveOnToggle: function(selectedInd,optionRep,initializing) {
			// mutual exclusive options use just value indices
			// as the option value
			const oldVal = optionRep.curValue;
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
			// and then update UI.
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
			// that does the actual filtering:
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
			const self = this;
			// as most filters are groups of mutually exclusive controls
			// it makes sense setting them as defaults
			if (! findView)
				findView = this._commonFindView;
			if (! onToggle)
				onToggle = this._mutualExclusiveOnToggle;

			const newOptions = [];
			$.each(options, function(ind, optionName) {
				const thisOption = {};
				const view = findView(filterName,optionName);
				thisOption.name = optionName;
				thisOption.view = view;
				thisOption.view.on('click', function(e) {
					const curRep = self.newFilterRep[filterName];
					const selectedInd = ind;
					curRep.onToggle.call(self,selectedInd,curRep,false,e);
				});
				console.assert(
					thisOption.view.length === 1,
					"expecting exactly one result of getView on "
						+ filterName  + "," + optionName );
				newOptions.push( thisOption );
			});

			const optionRep = {
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
			const self = this;
			const savedFilterValues = this.settings.filters || {};
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
					const dupeShips = self.shipCache.filter(s =>
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

			const stypes = Object.keys(KC3Meta.allStypes())
				.map(id => parseInt(id, 10))
				.filter(id => [12, 15].indexOf(id) < 0)
				.sort((a, b) => a - b);
			console.assert(stypes[0] === 0, "stype array should start with element 0");
			// remove initial "0", which is invalid
			stypes.shift();
			const stypeDefValue = [];
			$.each(stypes, function(ignore, stype) {
				stypeDefValue[stype] = true;
			});

			self.defineShipFilter(
				"stype",
				savedFilterValues.stype || stypeDefValue,
				// valid ship types and additionally 3 controls
				stypes.concat(["all","none","invert"]),
				// testShip
				function(curVal, ship) {
					return curVal[ship.stype];
				},
				// find view
				function (filterName, option) {
					if (typeof option === "number") {
						// this is a ship type toggle
						return $(".tab_ships .filters .ship_types .ship_filter_type")
							.filter( function() { return $(this).data("id") == option; } );
					} else {
						// one of: all / none / invert
						return $(".tab_ships .filters .massSelect ." + option);
					}
				},
				// onToggle
				function(selectedInd, optionRep, initializing, event) {
					if (initializing) {
						// the variable name is a bit misleading..
						// but at this point we should set the initial value
						optionRep.curValue = selectedInd;
					} else {
						const selected = optionRep.options[selectedInd];
						if (typeof selected.name === 'number') {
							if(event && event.altKey){
								// only select this ship type if Alt key held
								$.each(stypes, function(ignore, stype) {
									optionRep.curValue[stype] = false;
								});
								optionRep.curValue[selected.name] = true;
							} else {
								// this is a ship type toggle
								optionRep.curValue[selected.name] = !optionRep.curValue[selected.name];
							}
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
							$( ".filter_check", x.view ).toggle( optionRep.curValue[x.name] );
						}
					});
					if (!initializing)
						self.refreshTable();
				}
			);
		},

		// execute all registered filters on a ship
		executeFilters: function(ship) {
			for(const key in this.newFilterRep) {
				const filter = this.newFilterRep[key].testShip;
				if (!filter(ship)) return false;
			}
			return true;
		},

		saveSettings: function() {
			const shrinkedSettings = {
				sorters: this.currentSorters,
				filters: {},
				views: {}
			};
			for(const key in this.newFilterRep) {
				shrinkedSettings.filters[key] = this.newFilterRep[key].curValue;
			}
			shrinkedSettings.filters.showname = this.showNameFilter;
			shrinkedSettings.filters.levelrange = this.shipLevelFilter;
			shrinkedSettings.views.equip = this.equipMode;
			shrinkedSettings.views.page = this.pageNo;
			shrinkedSettings.views.scroll = this.scrollList;
			shrinkedSettings.views.lock = this.heartLockMode;
			shrinkedSettings.views.ctype = this.className;
			shrinkedSettings.views.tooltip = this.showTooltip;
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
			if(this.settings.filters){
				this.showNameFilter = this.settings.filters.showname || "";
				this.shipLevelFilter = this.settings.filters.levelrange || ["", ""];
		}
			if(this.settings.views){
				this.equipMode = this.settings.views.equip || 0;
				this.pageNo = this.settings.views.page || false;
				this.scrollList = this.settings.views.scroll || false;
				this.heartLockMode = this.settings.views.lock || 0;
				this.className = this.settings.views.ctype || false;
				this.showTooltip = this.settings.views.tooltip || false;
			}
		},

		/* FILTERS
		Ship types, and other toggles
		---------------------------------*/
		showFilters :function(){
			const self = this;

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
				const sorter = self.getLastCurrentSorter();
				const sorterName = $(this).data("type");
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
			const self = this;
			this.defineSorter(
				name,desc,
				function(a,b) {
					const va = getter.call(self,a);
					const vb = getter.call(self,b);
					return typeof va === "string" ? va.localeCompare(vb) : va - vb;
				});
		},

		prepareSorters: function() {
			const define = this.defineSimpleSorter.bind(this);

			define("id", "ID",
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
				   function(x) { return -x.hp[0]; });
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
				   function(x) { return -x.as[this.equipMode ? 3 : 0]; });
			define("ev", "Evasion",
				   function(x) { return -x.ev[this.equipMode]; });
			define("ls", "LoS",
				   function(x) { return -x.ls[this.equipMode]; });
			define("lk", "Luck",
				   function(x) { return -x.lk[0]; });
			define("fuel", "Fuel",
				   function(x) { return x.fuel[1]; });
			define("ammo", "Ammo",
				   function(x) { return x.ammo[1]; });
			define("ctype", "Class",
				   function(x) { return x.ctype; });
			define("bid", "Master-ID",
				   function(x) { return x.bid; });
			define("sortno", "Class in-game",
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

			const self = this;
			this.startTime = Date.now();

			// Update indicators of sorters
			$(".tab_ships .ship_header .ship_field.hover").removeClass("sorted");
			$.each(this.currentSorters, function(i, s){
				$(".tab_ships .ship_header .ship_field.hover.ship_{0}".format(s.name)).addClass("sorted");
			});

			// Clear list
			this.shipList.html("").hide();
			$(".ship_count .count_value").hide();

			// Wait until execute
			setTimeout(function(){
				// Filtering
				const filteredShips = self.shipCache.filter(function(x) {
					return self.executeFilters(x);
				});

				// Sorting
				filteredShips.sort( self.makeComparator() );

				// Fill up list
				Object.keys(filteredShips).forEach(function(shipCtr){
					const cShip = filteredShips[shipCtr];
					const shipLevel = cShip.level;

					// we can save some time by avoiding constructing jquery object
					// if we already have one
					if (cShip.view) {
						const cElm = cShip.view;
						cElm.appendTo(self.shipList);
						if (cElm.onRecompute)
							cElm.onRecompute(cShip);
						return;
					}
					// elements constructing for the time-consuming 'first time rendering'
					const cElm = $(".tab_ships .factory .ship_item").clone().appendTo(self.shipList);
					cShip.view = cElm;

					$(".ship_id", cElm).text( cShip.id );
					$(".ship_img .ship_icon", cElm)
						.attr("src", KC3Meta.shipIcon(cShip.bid))
						.attr("alt", cShip.bid);
					// put data to attributes to ensure not lose them
					$(".ship_name", cElm)
						.attr("data-ship-name", cShip.name)
						.attr("data-full-name", cShip.fullName)
						.attr("data-jpname", cShip.jpName)
						.attr("data-jpname-kana", cShip.jpNameKana)
						.attr("data-jpname-romaji", cShip.jpNameRomaji);
					if(shipLevel >= 100) {
						$(".ship_name", cElm).addClass("ship_kekkon-color");
						//$(".ship_marry", cElm).show();
					}
					if(cShip.fleet > 0) {
						$(".ship_name", cElm).addClass("ship_onfleet-color" + cShip.fleet);
					}
					$(".ship_type", cElm).text( KC3Meta.stype(cShip.stype) );
					$(".ship_lv .value", cElm).text(shipLevel)
						.addClass(cShip.levelClass);
					$(".ship_lv", cElm).attr("data-level", shipLevel);
					$(".ship_morale", cElm).text(cShip.morale);

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

					cShip.equip.forEach(function(gid, idx){
						self.equipImg(cElm, idx + 1, cShip.slotNum, cShip.slots[idx], gid, cShip.id);
					});
					if(cShip.exSlot !== 0){
						self.equipImg(cElm, "ex", cShip.slotNum, -2, cShip.exSlot);
					}
					$(".ship_equip", cElm).toggleClass("slot5",
						cShip.slotNum + ((cShip.exSlot !== 0) & 1) > 5);

					// callback for things that has to be recomputed
					cElm.onRecompute = function(ship) {
						const thisShip = ship || cShip;
						// Reset shown ship name class
						if(self.className !== $(".ship_name", this).data("class-name")) {
							const showName = self.className ? thisShip.fullName : thisShip.name;
							$(".ship_name", this).text(showName).attr("title", showName)
								.attr("data-class-name", self.className);
						}
						// Recomputes stats if equipment get in
						if(self.equipMode !== $(".ship_hp", this).data("equip-mode")) {
							self.modernizableStat("hp", this, thisShip.hp, 0, 0, true);
							self.modernizableStat("fp", this, thisShip.fp, 2, 1);
							self.modernizableStat("tp", this, thisShip.tp, 2, 1);
							self.modernizableStat("yasen", this, thisShip.yasen);
							self.modernizableStat("aa", this, thisShip.aa, 2, 1);
							self.modernizableStat("ar", this, thisShip.ar, 2, 1);
							self.modernizableStat("as", this, thisShip.as, 3, 0, true);
							$(".ship_ev", this).text( thisShip.ev[self.equipMode] );
							$(".ship_ls", this).text( thisShip.ls[self.equipMode] );
							self.modernizableStat("lk", this, thisShip.lk, 0, 0, true);
							$(".ship_hp", this).attr("data-equip-mode", self.equipMode);
							$(".ship_fuel", this).text( thisShip.fuel[1] );
							$(".ship_ammo", this).text( thisShip.ammo[1] );
						}
						// Reset heart-lock icon
						if((self.heartLockMode === 1 && thisShip.locked)
						|| (self.heartLockMode === 2 && !thisShip.locked)) {
							$(".ship_lock", this).toggleClass("unlock", self.heartLockMode === 2).show();
						} else {
							$(".ship_lock", this).hide();
						}
						// Update tooltip
						$(".ship_name", this).lazyInitTooltip();
						$(".ship_equip", this).lazyInitTooltip();
						const targetElm = $(".ship_img .ship_icon", this);
						if(targetElm.tooltip("instance") !== undefined){
							targetElm.tooltip("destroy");
						}
						if(self.showTooltip){
							// but this is also time-consuming
							const tooltipBox = KC3ShipManager.get(thisShip.id)
								.htmlTooltip($(".tab_ships .factory .ship_tooltip").clone());
							targetElm.tooltip({
								position: { my: "left top", at: "left+25 bottom" },
								items: "div",
								content: tooltipBox.prop("outerHTML"),
								// might be disabled for performance
								open: KC3Ship.onShipTooltipOpen,
							});
						}
						// Rebind click handlers
						$(".ship_img .ship_icon", this).click(self.shipClickFunc);
						$(".ship_equip_icon img", this).click(self.gearClickFunc);
					};
					// also invoke recompute for the first time
					cElm.onRecompute(cShip);
				});

				self.shipList.show();

				$(".ship_count .count_value .listed")
					.text(filteredShips.length)
					.data("filtered", filteredShips.length);
				$(".ship_count .count_value .total").text(self.shipCache.length);
				$(".ship_count .count_value").show();

				self.refreshInputFilter();
				self.toggleTableScrollbar(self.scrollList);
				self.isLoading = false;
				console.debug("Showing ship list took", Date.now() - self.startTime, "milliseconds");
			}, 0);
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
		getDerivedStatNaked :function(statName, equippedValue, shipObj){
			return equippedValue - shipObj.equipmentTotalStats(statName, true);
		},

		/* Show cell contents of a mod stat
		--------------------------------------------*/
		modernizableStat :function(statAbbr, rowElm, valuesTuple,
				equipStatIndex = 2, noEquipStatIndex = 1, isSup = false){
			const statElm = $(".ship_" + statAbbr, rowElm);
			$(".stat_value", statElm).text(
				valuesTuple[equipStatIndex > 0 ?
					(this.equipMode ? equipStatIndex : noEquipStatIndex) :
					noEquipStatIndex]
			);
			if(isSup){
				if(valuesTuple[0] >= valuesTuple[1]){
					statElm.addClass("max");
				}
				if(valuesTuple[0] > valuesTuple[2]){
					$(".sup", statElm).text(valuesTuple[0] - valuesTuple[2]);
				} else {
					$(".sup", statElm).hide();
				}
			} else {
				if(valuesTuple[0] <= valuesTuple[1]){
					$(".stat_left", statElm).hide();
					statElm.addClass("max");
				} else {
					$(".stat_left", statElm).show()
						.text("+" + (valuesTuple[0] - valuesTuple[1]));
				}
			}
		},

		/* Show single equipment icon
		--------------------------------------------*/
		equipImg :function(cElm, slotIndex, slotCount, slotSize, gearId, shipId){
			const element = $(".ship_equip_" + slotIndex, cElm);
			if(gearId > 0){
				const gear = KC3GearManager.get(gearId);
				if(gear.isDummy()){ element.hide(); return; }
				const ship = shipId > 0 ? KC3ShipManager.get(shipId) : undefined;
				$("img", element)
					.attr("src", KC3Meta.itemIcon(gear.master().api_type[3]))
					.attr("titlealt", gear.htmlTooltip(slotSize, ship))
					.attr("alt", gear.master().api_id)
					.show();
				$("span", element).css("visibility", "hidden");
				element.show();
			} else if(slotIndex === "ex" || slotIndex <= Math.max(4, slotCount)){
				$("img", element).hide();
				const sizeSpan = $("span", element);
				if(slotSize > 0)
					sizeSpan.text(slotSize);
				else if(slotSize === -2)
					// for ex slot opened, but not equipped
					sizeSpan.addClass("empty");
				else
					sizeSpan.css("visibility", "hidden");
			} else {
				element.hide();
			}
		}
	};

})();
