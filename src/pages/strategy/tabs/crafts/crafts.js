(function(){
	"use strict";

	KC3StrategyTabs.crafts = new KC3StrategyTab("crafts");
	const DEFAULT_ITEMS_PER_PAGE = 25;

	KC3StrategyTabs.crafts.definition = {
		tabSelf: KC3StrategyTabs.crafts,

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			this.locale = KC3Translation.getLocale();
			this.itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
			this.filters = {};
			this.compareNum = (lhs, rhs, op = "=") => {
				switch(op) {
					case ">": case ">=": return Number(lhs) >= Number(rhs);
					case "<": case "<=": return Number(lhs) <= Number(rhs);
					case "#": case "!=": return Number(lhs) !== Number(rhs);
					default: return Number(lhs) === Number(rhs);
				}
			};
			this.filterFunc = (recipeOnly, r) => {
				// falsy value considered as unfiltered property
				return (!this.filters.flagship || r.flag === this.filters.flagship)
					// note: data type of `rsc?` in DB is string
					&& (!this.filters.fuel || this.compareNum(r.rsc1, this.filters.fuel, this.filters.fuelOp))
					&& (!this.filters.ammo || this.compareNum(r.rsc2, this.filters.ammo, this.filters.ammoOp))
					&& (!this.filters.steel || this.compareNum(r.rsc3, this.filters.steel, this.filters.steelOp))
					&& (!this.filters.bauxite || this.compareNum(r.rsc4, this.filters.bauxite, this.filters.bauxiteOp))
					&& (!!recipeOnly || !this.filters.result || r.result === this.filters.result);
			};
			this.dateTimeOptions = {
				year: 'numeric', month: 'short', day: 'numeric',
				hour: 'numeric', minute: '2-digit', hour12: true
			};
			this.sortedSecretaryIds = [];
			this.sortedEquipmentIds = [];
			this.totalItems = 0;
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;
			// Update options for select list and current values
			const updateFiltersValues = () => {
				$(".filters .secretary_ship").val(this.filters.flagship || 0);
				$(".filters .build_result").val(this.filters.result || 0);
				$(".filters .build_rsc1").val(`${this.filters.fuelOp || ""}${this.filters.fuel || ""}`);
				$(".filters .build_rsc2").val(`${this.filters.ammoOp || ""}${this.filters.ammo || ""}`);
				$(".filters .build_rsc3").val(`${this.filters.steelOp || ""}${this.filters.steel || ""}`);
				$(".filters .build_rsc4").val(`${this.filters.bauxiteOp || ""}${this.filters.bauxite || ""}`);
			};
			updateFiltersValues();
			KC3Database.uniquekeys_devmt("flag", keys => {
				this.sortedSecretaryIds = keys.filter(key => key > 0).sort((id1, id2) => (
					(KC3Meta.shipName(KC3Master.ship(id1).api_name) || "").localeCompare(
						KC3Meta.shipName(KC3Master.ship(id2).api_name),
					this.locale) || id1 - id2
				));
				this.sortedSecretaryIds.forEach(key => {
					$('<option />').val(key).text(
						KC3Meta.shipName(KC3Master.ship(key).api_name)
					).appendTo($(".filters .secretary_ship"));
				});
				updateFiltersValues();
			});
			KC3Database.uniquekeys_devmt("result", keys => {
				this.sortedEquipmentIds = keys.filter(key => key > 0).sort((id1, id2) => (
					(KC3Meta.gearName(KC3Master.slotitem(id1).api_name) || "").localeCompare(
						KC3Meta.gearName(KC3Master.slotitem(id2).api_name),
					this.locale) || id1 - id2
				));
				this.sortedEquipmentIds.forEach(key => {
					$('<option />').val(key).text(
						KC3Meta.gearName(KC3Master.slotitem(key).api_name)
					).appendTo($(".filters .build_result"));
				});
				updateFiltersValues();
			});
			// Register event handlers
			$(".filters .secretary_ship").on("change", function(e) {
				self.filters.flagship = Number($(this).val());
				self.showList();
			});
			$(".filters .build_result").on("change", function(e) {
				self.filters.result = Number($(this).val());
				self.showList();
			});
			$(".filters .build_rsc").on("focus", function(e) {
				$(this).select();
			});
			$(".filters .build_rsc").on("input", function(e) {
				this.reportValidity();
			});
			$(".filters .build_rsc").on("blur", function(e) {
				if(!this.checkValidity()) return;
				const rscKey = $(this).data("rsc");
				const oldValue = self.filters[rscKey] || 0;
				const oldOp = self.filters[`${rscKey}Op`];
				const val = ($(this).val().match(/\d+$/) || [""])[0];
				const op = ($(this).val().match(/^[<=#>]/) || [])[0];
				self.filters[rscKey] = Number(val) || 0;
				self.filters[`${rscKey}Op`] = op;
				if(oldValue !== self.filters[rscKey] || oldOp !== self.filters[`${rscKey}Op`])
					self.showList();
			});
			$(".filters .reset_all").on("click", function(e) {
				self.filters = {};
				updateFiltersValues();
				self.showList();
			});
			$(".page_items .item_per_page").on("change", function(e) {
				self.itemsPerPage = Number($(this).val()) || DEFAULT_ITEMS_PER_PAGE;
				self.showList();
			}).val(this.itemsPerPage || DEFAULT_ITEMS_PER_PAGE);
			// Show initial pages
			this.showList();
		},

		showList :function(){
			const hideAndResetInfo = () => {
				$(".page_items .total_items").text(this.totalItems);
				$(".page_items .filtered_items").text(0);
				$(".page_items .total_page").text(0);
				$(".page_items .percent").text(0);
				$(".pagination").hide();
			};
			// Get total records of this recipe first
			KC3Database.count_devmt(this.filterFunc.bind(this, true), total => {
				this.totalItems = total;
				$(".build_list").empty();
				$(".page_items .total_items").text(this.totalItems);
				if(this.totalItems > 0){
					$(".build_pages").html('<ul class="pagination pagination-sm"></ul>');
					const updatePagination = (filtered) => {
						const numPages = Math.ceil(filtered / this.itemsPerPage);
						$(".page_items .filtered_items").text(filtered);
						$(".page_items .total_page").text(numPages);
						$(".page_items .percent").text(
							Math.qckInt("round", filtered / this.totalItems * 100, 1)
						);
						if(numPages > 0){
							$(".pagination").twbsPagination({
								totalPages: numPages,
								visiblePages: 9,
								onPageClick: (event, page) => {
									this.showPage(page);
								}
							});
							$(".pagination").show();
						}else{
							$(".pagination").hide();
						}
					};
					if(this.filters.result) {
						KC3Database.count_devmt(this.filterFunc.bind(this, false), updatePagination);
					} else {
						// Do not need to count again if only filtering by recipe
						updatePagination(this.totalItems);
					}
				} else {
					hideAndResetInfo();
				}
			}).catch(error => {
				console.error("Retrieving equipment crafting history failed", error);
				hideAndResetInfo();
				$(".build_list").text("Oops! Something was going wrong. See error logs for details.");
			});
		},

		showPage :function(pageNumber){
			const shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			$(".build_list").empty();
			KC3Database.get_devmt(this.filterFunc.bind(this, false), pageNumber, this.itemsPerPage, resultArray => {
				for(const index in resultArray){
					const thisBuild = resultArray[index];
					const buildBox = $(".factory .build_item").clone()
						.appendTo(".build_list");

					$(".build_id", buildBox).text( thisBuild.id );
					const secretaryShip = KC3Master.ship(thisBuild.flag);
					const shipName = KC3Meta.shipName(secretaryShip.api_name);
					$(".build_ficon img", buildBox)
						.attr("src", KC3Meta.shipIcon(secretaryShip.api_id, undefined, false))
						.attr("alt", secretaryShip.api_id)
						.click(shipClickFunc);
					$(".build_flag", buildBox).text(shipName).attr("title", shipName);

					$(".build_rsc1", buildBox).text(thisBuild.rsc1);
					$(".build_rsc2", buildBox).text(thisBuild.rsc2);
					$(".build_rsc3", buildBox).text(thisBuild.rsc3);
					$(".build_rsc4", buildBox).text(thisBuild.rsc4);

					if(thisBuild.result > 0){
						const itemMaster = KC3Master.slotitem(thisBuild.result);
						const itemName = KC3Meta.gearName(itemMaster.api_name);
						$(".build_ricon img", buildBox)
							.attr("src", `/assets/img/items/${itemMaster.api_type[3]}.png`)
							.attr("alt", thisBuild.result)
							.click(gearClickFunc);
						$(".build_ricon", buildBox).addClass("hover");
						$(".build_result", buildBox).text(itemName).attr("title", itemName);
					}else{
						$(".build_ricon img", buildBox).attr("src", "/assets/img/client/penguin.png");
						$(".build_result", buildBox).text( "Penguin" );
					}

					$(".build_time", buildBox).text(
						new Date(thisBuild.time * 1000)
							// format date time following KC3 global language setting
							.toLocaleString(this.locale, this.dateTimeOptions)
					);

				}
			}).catch(error => {
				console.error("Retrieving equipment crafting history failed", error);
				$(".build_list").text("Oops! Something was going wrong. See error logs for details.");
			});
		}

	};

})();
