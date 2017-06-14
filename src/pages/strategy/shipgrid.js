(function(){

	class KC3ShipListGrid {

		constructor(tabName) {
			this.tabName = tabName;
			this.shipListDiv = null;
			this.shipRowTemplateDiv = null;
			this.showListRowCallback = null;
			this.shipList = [];
			this.sorters = [{name:"lv", reverse:false}];
			this.sorterDefinitions = {};
			this.filterDefinitions = {};
			this.pageNo = false;
			this.isLoading = false;
		}

		registerShipListHeaderEvent(shipHeaderDiv) {
			if(!shipHeaderDiv) {
				return;
			}
			const self = this;
			shipHeaderDiv.on("click", function() {
				const sorter = self.getLastSorter();
				const sorterName = $(this).data("type");
				if (sorterName === sorter.name) {
					self.reverseLastSorter();
				} else {
					self.setSorter(sorterName);
				}
				self.showListGrid();
			});
		}

		showListGrid() {
			const startTime = Date.now();
			const delayMillis = 100;
			if(this.isLoading) {
				console.debug("Ignored this refresh, still loading from", startTime);
				return false;
			}
			console.assert(this.shipListDiv, "Ship list element must be defined");
			console.assert(this.shipRowTemplateDiv, "Ship row template element must be defined");
			this.isLoading = true;
			// Clear old list
			this.shipListDiv.empty().hide();
			setTimeout(() => {
				// Do list filtering
				const filteredShipList = this.shipList.filter(ship => this.executeFilters(ship));
				// Do list sorting
				filteredShipList.sort(this.makeComparator());
				// Fill up rows of grid
				Object.keys(filteredShipList).forEach(shipIdx => {
					if(shipIdx % 10 === 0){
						$("<div>").addClass("ingame_page").text(
							"Page " + Math.ceil((shipIdx + 1) / 10)
						).appendTo(this.shipListDiv);
					}
					let ship = filteredShipList[shipIdx];
					let shipRow = this.shipRowTemplateDiv.clone().appendTo(this.shipListDiv);
					shipRow.toggleClass(() => {
						return shipIdx % 2 === 0 ? "even" : "odd";
					});
					$(".ship_id", shipRow).text(ship.id);
					$(".ship_img .ship_icon", shipRow)
						.attr("src", KC3Meta.shipIcon(ship.masterId))
						.attr("alt", ship.masterId)
						.click(this.shipClickFunc);
					$(".ship_name", shipRow).text(ship.name);
					$(".ship_name", shipRow).toggleClass("ship_kekkon-color", ship.level >= 100);
					$(".ship_type", shipRow).text(KC3Meta.stype(ship.stype));
					$(".ship_lv .value", shipRow).text(ship.level)
						.addClass(ship.levelClass);
					
					// Invoke more rendering of ship row
					if(typeof this.showListRowCallback === "function") {
						this.showListRowCallback.call(this, ship, shipRow);
					}
				});
				this.shipListDiv.show().createChildrenTooltips();
				$(".ingame_page").toggle(this.pageNo);
				this.isLoading = false;
				console.debug("Showing", this.tabName, "list took",
					(Date.now() - startTime) - delayMillis, "milliseconds");
			}, delayMillis);
			return true;
		}

		shipClickFunc(event) {
			KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt") || $(this).data("id"));
		}

		gearClickFunc(event) {
			KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt") || $(this).data("id"));
		}

		prepareShipList(isReload,
			mapShipDataCallback = this.defaultShipDataMapping,
			initShipFilter = ((shipObj) => true)) {
			if(!isReload && this.shipList.length > 0) {
				return false;
			}
			this.shipList.length = 0;
			for(let key in KC3ShipManager.list){
				let shipObj = KC3ShipManager.list[key];
				if(initShipFilter(shipObj)) {
					let shipData = mapShipDataCallback.call(this, shipObj);
					this.shipList.push(shipData);
				}
			}
			return true;
		}

		defaultShipDataMapping(shipObj) {
			const shipMaster = shipObj.master();
			const mappedObj = {
				id: shipObj.rosterId,
				masterId: shipObj.masterId,
				stype: shipMaster.api_stype,
				ctype: shipMaster.api_ctype,
				sortno: shipMaster.api_sortno,
				name: shipObj.name(),
				level: shipObj.level,
				levelClass: shipObj.levelClass(),
				morale: shipObj.morale,
				equip: shipObj.items,
				slots: shipObj.slots,
				locked: shipObj.lock,
				speed: shipObj.speed,
				range: shipObj.range,
				fleet: shipObj.onFleet()
			};
			return mappedObj;
		}

		defaultSorterDefinitions() {
			const define = this.defineSimpleSorter.bind(this);
			define("id", "Id", ship => ship.id);
			define("masterId", "ShipId", ship => ship.masterId);
			define("name", "Name", ship => ship.name);
			define("type", "Type", ship => ship.stype);
			define("ctype", "Class", ship => ship.ctype);
			define("lv", "Level", ship => -ship.level);
			define("sortno", "SortOrder", ship => ship.sortno);
			define("morale", "Morale", ship => -ship.morale);
		}

		defineSimpleFilter(filterName, optionValues, defaultIndex, testShipFunc) {
			const filterDef = {
				optionValues: optionValues,
				currentIndex: defaultIndex || null,
				testShip: (ship) => testShipFunc(filterDef.currentIndex, ship)
			};
			this.filterDefinitions[filterName] = filterDef;
		}

		executeFilters(ship) {
			for(let key in this.filterDefinitions) {
				var filter = this.filterDefinitions[key].testShip;
				if (!filter(ship)) return false;
			}
			return true;
		}

		getLastSorter() {
			return this.sorters[this.sorters.length - 1];
		}

		reverseLastSorter() {
			var sorter = this.getLastSorter();
			sorter.reverse = ! sorter.reverse;
		}

		setSorter(name) {
			var sorter = this.sorterDefinitions[name];
			console.assert(sorter, "sorter '" + name + "' should have been registered");
			this.sorters = [ {name: sorter.name, reverse:false} ];
		}

		defineSorter(name, desc, comparator) {
			this.sorterDefinitions[name] = {
				name: name,
				desc: desc,
				comparator: comparator
			};
		}

		defineSimpleSorter(name, desc, getter) {
			this.defineSorter(
				name, desc,
				(l, r) => {
					const vl = getter.call(this, l);
					const vr = getter.call(this, r);
					return typeof vl === "string" ? vl.localeCompare(vr) : vl - vr;
				}
			);
		}

		makeComparator() {
			const reversed = (comparator) => ((l, r) => -comparator(l, r));
			const compose = (prevComparator, nextComparator) =>
				((l, r) => prevComparator(l, r) || nextComparator(l, r));
			const lastSorterReverse = this.getLastSorter().reverse;
			const mergedSorters = this.sorters.concat([{
				name: "sortno",
				reverse: lastSorterReverse
			}]);
			if(this.sorters.every(sd => sd.name !== "id")){
				mergedSorters.push({
					name: "id",
					reverse: lastSorterReverse
				});
			}
			return mergedSorters
				.map(sorterDef => {
					const sorter = this.sorterDefinitions[sorterDef.name];
					return sorterDef.reverse
						? reversed(sorter.comparator)
						: sorter.comparator;
				})
				.reduce(compose);
		}

	}

	window.KC3ShipListGrid = KC3ShipListGrid;

})();