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
			this.itemsPerPage = DEFAULT_ITEMS_PER_PAGE;
			this.filters = {};
			this.filterFunc = (r) => {
				// falsy value considered as unfiltered property
				return (!this.filters.flagship || r.flag === this.filters.flagship)
					&& (!this.filters.result || r.result === this.filters.result)
					// note: data type of `rsc?` in DB is string
					&& (!this.filters.fuel || r.rsc1 == this.filters.fuel)
					&& (!this.filters.ammo || r.rsc2 == this.filters.ammo)
					&& (!this.filters.steel || r.rsc3 == this.filters.steel)
					&& (!this.filters.bauxite || r.rsc4 == this.filters.bauxite);
			};
			this.dateTimeOptions = {
				year: 'numeric', month: 'short', day: 'numeric',
				hour: 'numeric', minute: '2-digit', hour12: true
			};
			this.availSecretaryIds = [];
			this.availEquipmentIds = [];
			this.totalItems = 0;
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;
			// Update options for select list and current values
			KC3Database.devmt_uniquekeys("flag", keys => {
				this.availSecretaryIds = keys;
				this.availSecretaryIds.forEach(key => {
					$('<option />').val(key).text(
						KC3Meta.shipName(KC3Master.ship(key).api_name)
					).appendTo($(".tab_crafts .secretary_ship"));
				});
				$(".tab_crafts .secretary_ship").val(this.filters.flagship || 0);
			});
			KC3Database.devmt_uniquekeys("result", keys => {
				this.availEquipmentIds = keys.filter(key => key > 0);
				this.availEquipmentIds.forEach(key => {
					$('<option />').val(key).text(
						KC3Meta.gearName(KC3Master.slotitem(key).api_name)
					).appendTo($(".tab_crafts .build_result"));
				});
				$(".tab_crafts .build_result").val(this.filters.result || 0);
			});
			$(".tab_crafts .build_rsc1").val(this.filters.fuel || "");
			$(".tab_crafts .build_rsc2").val(this.filters.ammo || "");
			$(".tab_crafts .build_rsc3").val(this.filters.steel || "");
			$(".tab_crafts .build_rsc4").val(this.filters.bauxite || "");
			// Register event handlers
			$(".tab_crafts .secretary_ship").on("change", function(e) {
				self.filters.flagship = Number($(this).val());
				self.showList();
			});
			$(".tab_crafts .build_result").on("change", function(e) {
				self.filters.result = Number($(this).val());
				self.showList();
			});
			$(".tab_crafts .build_rsc").on("focus", function(e) {
				$(this).select();
			});
			$(".tab_crafts .build_rsc").on("blur", function(e) {
				const rscKey = $(this).data("rsc");
				const oldValue = self.filters[rscKey] || 0;
				self.filters[rscKey] = Number($(this).val()) || 0;
				if(oldValue !== self.filters[rscKey]) self.showList();
			});
			$(".tab_crafts .item_per_page").on("change", function(e) {
				self.itemsPerPage = Number($(this).val()) || DEFAULT_ITEMS_PER_PAGE;
				self.showList();
			}).val(this.itemsPerPage || DEFAULT_ITEMS_PER_PAGE);
			// Show initial pages
			this.showList();
		},

		showList :function(){
			// Get total records first
			KC3Database.count_devmt((r => true), total => {
				this.totalItems = total;
				$(".tab_crafts .page_items .total_items").text(this.totalItems);
				if(this.totalItems > 0){
					$(".tab_crafts .build_pages").html('<ul class="pagination pagination-sm"></ul>');
					// Get filtered records and pagination
					KC3Database.count_devmt(this.filterFunc, filtered => {
						const numPages = Math.ceil(filtered / this.itemsPerPage);
						$(".tab_crafts .page_items .filtered_items").text(filtered);
						$(".tab_crafts .page_items .total_page").text(numPages);
						$(".tab_crafts .page_items .percent").text(
							Math.qckInt("round", filtered / this.totalItems * 100, 1)
						);
						if(numPages > 0){
							$(".tab_crafts .pagination").twbsPagination({
								totalPages: numPages,
								visiblePages: 9,
								onPageClick: (event, page) => {
									this.showPage(page);
								}
							});
							$(".tab_crafts .pagination").show();
						}else{
							$(".tab_crafts .pagination").hide();
							$(".tab_crafts .build_list").empty();
						}
					});
				} else {
					$(".tab_crafts .page_items .filtered_items").text(0);
					$(".tab_crafts .page_items .total_page").text(0);
					$(".tab_crafts .page_items .percent").text(0);
					$(".tab_crafts .pagination").hide();
					$(".tab_crafts .build_list").empty();
				}
			});
		},

		showPage :function(pageNumber){
			const shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};

			KC3Database.get_devmt(this.filterFunc, pageNumber, this.itemsPerPage, resultArray => {
				$(".tab_crafts .build_list").empty();
				for(const index in resultArray){
					const thisBuild = resultArray[index];
					const buildBox = $(".tab_crafts .factory .build_item").clone()
						.appendTo(".tab_crafts .build_list");

					$(".build_id", buildBox).text( thisBuild.id );
					const secretaryShip = KC3Master.ship(thisBuild.flag);
					const shipName = KC3Meta.shipName(secretaryShip.api_name);
					$(".build_ficon img", buildBox)
						.attr("src", KC3Meta.shipIcon(secretaryShip.api_id) )
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
							.toLocaleString(KC3Translation.getLocale(), this.dateTimeOptions)
					);

				}
			});
		}

	};

})();
