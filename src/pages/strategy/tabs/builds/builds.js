(function(){
	"use strict";

	KC3StrategyTabs.builds = new KC3StrategyTab("builds");
	const DEFAULT_ITEMS_PER_PAGE = 30;

	KC3StrategyTabs.builds.definition = {
		tabSelf: KC3StrategyTabs.builds,

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			this.locale = KC3Translation.getLocale();
			this.itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
			this.filters = {};
			this.filterFunc = (recipeOnly, r) => {
				// falsy value considered as unfiltered property
				return (!this.filters.flagship || r.flag === this.filters.flagship)
					// note: data type of `rsc?` in DB is string
					&& (!this.filters.fuel || r.rsc1 == this.filters.fuel)
					&& (!this.filters.ammo || r.rsc2 == this.filters.ammo)
					&& (!this.filters.steel || r.rsc3 == this.filters.steel)
					&& (!this.filters.bauxite || r.rsc4 == this.filters.bauxite)
					&& (!!recipeOnly || !this.filters.result || r.result === this.filters.result);
			};
			this.dateTimeOptions = {
				year: 'numeric', month: 'short', day: 'numeric',
				hour: 'numeric', minute: '2-digit', hour12: true
			};
			this.sortedSecretaryIds = [];
			this.sortedResultShipIds = [];
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
				$(".filters .build_rsc1").val(this.filters.fuel || "");
				$(".filters .build_rsc2").val(this.filters.ammo || "");
				$(".filters .build_rsc3").val(this.filters.steel || "");
				$(".filters .build_rsc4").val(this.filters.bauxite || "");
			};
			updateFiltersValues();
			KC3Database.uniquekeys_build("flag", keys => {
				this.sortedSecretaryIds = keys.sort((id1, id2) => (
					KC3Meta.shipName(KC3Master.ship(id1).api_name).localeCompare(
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
			KC3Database.uniquekeys_build("result", keys => {
				this.sortedResultShipIds = keys.filter(key => key > 0).sort((id1, id2) => (
					KC3Meta.shipName(KC3Master.ship(id1).api_name).localeCompare(
						KC3Meta.shipName(KC3Master.ship(id2).api_name),
					this.locale) || id1 - id2
				));
				this.sortedResultShipIds.forEach(key => {
					$('<option />').val(key).text(
						KC3Meta.shipName(KC3Master.ship(key).api_name)
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
			$(".filters .build_rsc").on("blur", function(e) {
				const rscKey = $(this).data("rsc");
				const oldValue = self.filters[rscKey] || 0;
				self.filters[rscKey] = Number($(this).val()) || 0;
				if(oldValue !== self.filters[rscKey]) self.showList();
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
			KC3Database.count_build(this.filterFunc.bind(this, true), total => {
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
						KC3Database.count_build(this.filterFunc.bind(this, false), updatePagination);
					} else {
						// Do not need to count again if only filtering by recipe
						updatePagination(this.totalItems);
					}
				} else {
					hideAndResetInfo();
				}
			}).catch(error => {
				console.error("Retrieving ship building history failed", error);
				hideAndResetInfo();
				$(".build_list").text("Oops! Something was going wrong. See error logs for details.");
			});
		},

		showPage :function(pageNumber){
			const shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			$(".build_list").empty();
			KC3Database.get_build(this.filterFunc.bind(this, false), pageNumber, this.itemsPerPage, resultArray => {
				for(const index in resultArray){
					const thisBuild = resultArray[index];
					const buildBox = $(".factory .build_item").clone()
						.appendTo(".build_list");
					
					const secretaryShipName = KC3Meta.shipName(KC3Master.ship(thisBuild.flag).api_name);
					$(".build_id", buildBox).text(thisBuild.id);
					$(".build_ficon img", buildBox)
						.attr("src", KC3Meta.shipIcon(thisBuild.flag, undefined, false))
						.attr("alt", thisBuild.flag)
						.click(shipClickFunc);
					$(".build_flag", buildBox).text(secretaryShipName)
						.attr("title", secretaryShipName);
					
					$(".build_rsc1", buildBox).text(thisBuild.rsc1);
					$(".build_rsc2", buildBox).text(thisBuild.rsc2);
					$(".build_rsc3", buildBox).text(thisBuild.rsc3);
					$(".build_rsc4", buildBox).text(thisBuild.rsc4);
					
					const resultShipName = KC3Meta.shipName(KC3Master.ship(thisBuild.result).api_name);
					$(".build_ricon img", buildBox)
						.attr("src", KC3Meta.shipIcon(thisBuild.result, undefined, false))
						.attr("alt", thisBuild.result)
						.click(shipClickFunc);
					$(".build_result", buildBox).text(resultShipName)
						.attr("title", resultShipName);
					
					$(".build_time", buildBox).text(
						new Date(thisBuild.time * 1000)
							// format date time following KC3 global language setting
							.toLocaleString(this.locale, this.dateTimeOptions)
					);
				}
			}).catch(error => {
				console.error("Retrieving ship building history failed", error);
				$(".build_list").text("Oops! Something was going wrong. See error logs for details.");
			});
		}

	};

})();