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
			this.heartLockMode = 0;
			this.isLoading = false;
		}

		registerShipListHeaderEvent(shipHeaderDiv) {
			if(!shipHeaderDiv || !shipHeaderDiv.length) {
				console.assert(false, "ship list header element not found");
				return;
			}
			const self = this;
			shipHeaderDiv.off("click").on("click", function() {
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
			if(this.isLoading) {
				console.debug("Ignored this refresh, still loading from", this.loadStartTime);
				return false;
			}
			console.assert(this.shipListDiv, "ship list element must be defined");
			console.assert(this.shipListDiv.length, "ship list element not found");
			console.assert(this.shipRowTemplateDiv, "ship row template element must be defined");
			console.assert(this.shipRowTemplateDiv.length, "ship row template element not found");
			this.isLoading = true;
			this.loadStartTime = Date.now();
			// Trigger pre-show event
			this.shipListDiv.trigger("preShow");
			// Clear old list
			this.shipListDiv.hide().html("");
			const delayMillis = 0;
			setTimeout(() => {
				// Do list filtering
				const filteredShipList = this.shipList.filter(ship => this.executeFilters(ship));
				// Do list sorting
				filteredShipList.sort(this.makeComparator());
				// Fill up rows of grid
				const oddEvenClass = (index) => {
					return index % 2 === 0 ? "even" : "odd";
				};
				for(let shipIdx in filteredShipList) {
					if(shipIdx % 10 === 0) {
						$("<div />").addClass("ingame_page").text(
							"Page {0}".format(Math.ceil((1 + Number(shipIdx)) / 10))
						).appendTo(this.shipListDiv);
					}
					const ship = filteredShipList[shipIdx];
					const shipRow = this.shipRowTemplateDiv.clone().appendTo(this.shipListDiv);
					
					shipRow.toggleClass(oddEvenClass.bind(this, shipIdx));
					$(".ship_id", shipRow).text(ship.id);
					$(".ship_img .ship_icon", shipRow)
						.attr("src", KC3Ship.shipIcon(ship.masterId))
						.attr("alt", ship.masterId)
						.click(this.shipClickFunc);
					$(".ship_name", shipRow).text(ship.name)
						.toggleClass("ship_kekkon-color", ship.level >= 100);
					$(".ship_type", shipRow).text(KC3Meta.stype(ship.stype));
					$(".ship_lv .value", shipRow).text(ship.level)
						.addClass(ship.levelClass);
					$(".ship_lock img", shipRow).attr("src",
						"../../assets/img/client/heartlock{0}.png".format(!ship.locked ? "-x" : "")
					);
					if(this.heartLockMode === 1 && ship.locked){
						$(".ship_lock img", shipRow).show();
					} else if(this.heartLockMode === 2 && !ship.locked){
						$(".ship_lock img", shipRow).show();
					} else {
						$(".ship_lock", shipRow).hide();
					}
					
					// Invoke more rendering of ship row
					if(typeof this.showListRowCallback === "function") {
						this.showListRowCallback.call(this, ship, shipRow);
					}
				}
				this.shipListDiv.show(0, () => {
					if(this.isLoading) {
						$(".ship_name", this.shipListDiv).each(function() {
							if(KC3StrategyTabs.isTextEllipsis(this)) {
								$(this).attr("title", $(this).text());
							}
						});
						this.shipListDiv.createChildrenTooltips();
					}
				});
				$(".ingame_page").toggle(this.pageNo);
				// Trigger post-show event
				this.shipListDiv.trigger("postShow", {shipList: filteredShipList});
				this.isLoading = false;
				console.debug("Showing", this.tabName, "list took",
					(Date.now() - this.loadStartTime) - delayMillis, "milliseconds");
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
			for(let key in KC3ShipManager.list) {
				const shipObj = KC3ShipManager.list[key];
				// Exclude ship(s) that not exist in master to avoid render error
				if(!KC3Master.ship(shipObj.masterId)) {
					continue;
				}
				if(initShipFilter(shipObj)) {
					const shipData = mapShipDataCallback.call(this, shipObj);
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
				sortId: shipMaster.api_sort_id,
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
			define("sortno", "SortOrder", ship => ship.sortId);
			define("morale", "Morale", ship => -ship.morale);
		}

		defineSimpleFilter(filterName, optionValues, defaultIndex, testShipFunc) {
			const filterDef = {
				optionValues: optionValues,
				currentIndex: defaultIndex === undefined ? null : defaultIndex,
				testShip: (ship) => testShipFunc(filterDef, ship)
			};
			this.filterDefinitions[filterName] = filterDef;
		}

		executeFilters(ship) {
			for (let key in this.filterDefinitions) {
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
			console.assert(sorter, `sorter '${name}' should have been registered`);
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
			if(this.sorters.every(sd => sd.name !== "id")) {
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