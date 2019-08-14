(function(){
	"use strict";
	
	KC3StrategyTabs.expedpast = new KC3StrategyTab("expedpast");
	
	KC3StrategyTabs.expedpast.definition = {
		tabSelf: KC3StrategyTabs.expedpast,
		
		exped_filters: [],
		fleet_filters: [2,3,4],
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			this.locale = KC3Translation.getLocale();
			this.itemsPerPage = 20;
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;
			
			// Build more details from expedition master data
			const buildExpedTooltip = (m) => (
				["[{0}] ".format(m.api_id) + m.api_name,
					m.api_details,
					"Difficulty: {0}".format(m.api_difficulty),
					"Reset type: {0}".format(m.api_reset_type),
					"Damage type: {0}".format(m.api_damage_type),
					"Cost fuel: {0}%, ammo: {1}%".format(m.api_use_fuel * 100, m.api_use_bull * 100),
					"Levels of successful rewards:\n"
						+ "\tfuel: {0}, ammo: {1}, steel: {2}, bauxite: {3}".format(m.api_win_mat_level)
						+ (m.api_win_item1[0] > 0 ?
							["\n\t", PlayerManager.getConsumableById(m.api_win_item1[0], true), ": ", m.api_win_item1[1]].join("") : "")
						+ (m.api_win_item2[0] > 0 ?
							[", ", PlayerManager.getConsumableById(m.api_win_item2[0], true), ": ", m.api_win_item2[1]].join("") : ""),
					String(m.api_deck_num) + " ships fleet: "
						+ m.api_sample_fleet.filter(t => !!t).map(t => KC3Meta.stype(t)).join(", ")
				].join("\n")
			);
			// Add all expedition numbers on the filter list
			self.exped_filters = [];
			$('.tab_expedpast .expedNumbers').empty();
			if(KC3Master.available) {
				$.each(KC3Master.all_missions(), function(ind, curVal) {
					// Event expeditions have the event world (eg, 38, 39, ...)
					if(curVal.api_maparea_id >= 10) return;
					var row = $('.tab_expedpast .factory .expedNum').clone();
					$(".expedCheck input", row).attr("value", curVal.api_id);
					$(".expedCheck input", row).attr("world", curVal.api_maparea_id);
					$(".expedText .disp", row).text(curVal.api_disp_no);
					// Support fleet expeditions (33, 34) cannot be cancelled
					$(".expedText .flag", row).text(!curVal.api_return_flag ? "*" : "");
					$(".expedTime", row).text(
						(curVal.api_time * 60).toString().toHHMMSS().substring(0,5)
					);
					$(".expedText", row).toggleClass("monthly", curVal.api_reset_type == 1);
					$(".expedTime", row).toggleClass("combat", curVal.api_damage_type > 0);
					$(".expedText", row).attr("title", buildExpedTooltip(curVal)).lazyInitTooltip();
					
					self.exped_filters.push(curVal.api_id);
					
					$(".tab_expedpast .expedNumBox_"+curVal.api_maparea_id).append( row );
				});
			} else {
				// In case missing raw data
				const KE = PS["KanColle.Expedition"];
				KE.allExpeditions.forEach( function(curVal, ind) {
					var row = $('.tab_expedpast .factory .expedNum').clone();
					$(".expedCheck input", row).attr("value", curVal.id);
					$(".expedCheck input", row).attr("world", curVal.world);
					$(".expedText .disp", row).text(curVal.name);
					$(".expedTime", row).text(
						(curVal.cost.time*60).toString().toHHMMSS().substring(0,5)
					);
					
					self.exped_filters.push(curVal.id);
					
					$(".tab_expedpast .expedNumBox_"+curVal.world).append( row );
				});
			}
			
			// Add world toggle
			$(".tab_expedpast .expedNumBox")
				.filter(function(i,x) { return !!$(x).data("world"); })
				.each(function(i,x) {
					const row = $('.tab_expedpast .factory .expedNum').clone()
						.addClass("expedWhole").removeClass("expedNum");
					const world = $(x).data("world");
					let val = true;
					$("input",".expedNumBox_"+world).each(function(id,elm){
						val &= $(elm).prop("checked");
					});
					$(row)
						.find(".expedCheck input")
							.attr("value", world)
							.prop("checked", val)
						.end()
						.find(".expedText")
							.text( "World " + world).attr("title", KC3Meta.worldToDesc(world))
						.end()
						.find(".expedTime")
							.remove()
						.end();
					
					$(x).prepend(row);
				});
			
			// Expedition Number Filter
			$(".tab_expedpast .expedNumBox").on("click", '.expedNum input', function(){
				const
					filterExpeds = $('.tab_expedpast .expedNumBox .expedNum input:checked'),
					worldNum     = $(this).attr("world"),
					context      = ".tab_expedpast .expedNumBox_"+worldNum;
				let parentCheck  = true;
				self.exped_filters = [];
				$(".expedNum   input",context).each(function(i,x){ parentCheck &= $(x).prop("checked"); });
				$(".expedWhole input",context).prop("checked",parentCheck);
				filterExpeds.each( function() {
					self.exped_filters.push( parseInt( $(this).attr("value"),10) );
				});
				self.refreshList();
			}).on("click", ".expedWhole input", function() {
				const
					worldNum = $(this).val(),
					state    = $(this).prop("checked"),
					expeds   = $(".tab_expedpast .expedNumBox_"+worldNum+" .expedNum input");
				expeds.each(function(i,x){
					const
						elmState = $(x).prop("checked"),
						expedNum = parseInt($(x).val());
					if(elmState ^ state) { // check different state
						if(elmState) { // set -> unset
							self.exped_filters.splice(self.exped_filters.indexOf(expedNum),1);
						} else { // unset -> set
							self.exped_filters.push(expedNum);
						}
						$(x).prop("checked",state);
					}
				});
				self.exped_filters.sort(function(a,b){return a-b;});
				self.refreshList();
			});
			
			// Fleet Number Filter
			$(".tab_expedpast .expedNumBox").on("click", '.fleetRadio input', function(){
				const filterFleets = $('.tab_expedpast .expedNumBox .fleetRadio input:checked');
				self.fleet_filters = [];
				filterFleets.each( function() {
					self.fleet_filters.push( parseInt( $(this).attr("value"),10) );
				});
				self.refreshList();
			});
			$(".tab_expedpast .expedNumBox").on("change", '.fleetSparkles', function(){
				self.refreshList();
			});
			
			// Show initial list
			self.refreshList();
		},
		
		refreshList :function(){
			const self = this;
			
			$(".tab_expedpast .exped_count").hide();
			$(".tab_expedpast .exped_list").empty();
			$(".tab_expedpast .exped_pages").html('<ul class="pagination pagination-sm"></ul>');
			const typeSelect = parseInt($(".tab_expedpast .typeSelect select").val(), 10);
			const target = parseInt($(".tab_expedpast .fleetDropdown input").val(), 10);
			const sparkled = function(sparkles) {
				switch(typeSelect) {
					case 0:
						return sparkles > target;
					case 1:
						return sparkles >= target;
					case 2:
						return sparkles == target;
				}
			};
			// Get pagination
			KC3Database.count_expeds(this.exped_filters, this.fleet_filters, sparkled,
				function(numRecords, gs, ns, itemCount){
				const numPages = Math.ceil(numRecords / self.itemsPerPage);
				//console.debug("count_expeds", numRecords);
				
				if(numPages > 0){
					$('.tab_expedpast .pagination').twbsPagination({
						totalPages: numPages,
						visiblePages: 9,
						onPageClick: function (event, page) {
							self.showPage( page );
						}
					});
					$('.tab_expedpast .exped_count').text(
						"Total pages: {0}, Total expeditions: {1}, Great Success /Total Success: {2} /{3} ({4}%)"
							.format(KC3Meta.formatNumber(numPages), KC3Meta.formatNumber(numRecords),
								KC3Meta.formatNumber(gs), KC3Meta.formatNumber(ns),
								((gs / ns * 100) || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }))
					).show();
					$('.tab_expedpast .pagination').show();
				}else{
					$('.tab_expedpast .pagination').hide();
				}
			});
		},
		
		showPage :function(pageNumber){
			const self = this;
			
			const typeSelect = parseInt($(".tab_expedpast .typeSelect select").val(), 10);
			const target = parseInt($(".tab_expedpast .fleetDropdown input").val(), 10);
			const sparkled = function(sparkles) {
				switch(typeSelect) {
					case 0:
						return sparkles > target;
					case 1:
						return sparkles >= target;
					case 2:
						return sparkles == target;
				}
			};
			KC3Database.get_expeds(pageNumber, this.itemsPerPage, this.exped_filters, this.fleet_filters, sparkled,
				function(response){
				//console.debug("get_expeds", response, self.exped_filters, self.fleet_filters);
				$(".tab_expedpast .exped_list").empty();
				
				for(const ctr in response){
					const ThisExped = response[ctr];
					//console.debug(ThisExped);
					
					const ExpedBox = $(".tab_expedpast .factory .exped_item").clone()
						.appendTo(".tab_expedpast .exped_list");
					
					// Expedition date
					const expedDate = new Date(ThisExped.time * 1000);
					$(".exped_date", ExpedBox).text( expedDate.format("mmm dd", false, self.locale) );
					$(".exped_time", ExpedBox).text( expedDate.format("hh:MM tt") );
					$(".exped_info", ExpedBox).attr("title", expedDate.format("yyyy-mm-dd HH:MM:ss"));
					
					// Number and HQ exp
					$(".exped_number", ExpedBox).text( KC3Master.missionDispNo(ThisExped.mission) );
					$(".exped_exp", ExpedBox).text( ThisExped.admiralXP );

					let drumCount = 0;
					// Ship List. WARN: `.fleet` might be `{}` for old bad data
					for(const sctr in ThisExped.fleet){
						const ThisShip = ThisExped.fleet[sctr];
						const ShipBox = $(".tab_expedpast .factory .exped_ship").clone();
						$(".exped_ship_img img", ShipBox).attr("src", KC3Meta.shipIcon(ThisShip.mst_id) );
						$(".exped_ship_exp", ShipBox).text( ThisExped.shipXP[sctr] );
						if(ThisShip.morale > 49){ $(".exped_ship_img", ShipBox).addClass("sparkled"); }
						$(".exped_ships", ExpedBox).append( ShipBox );
						for (var eId in ThisShip.equip) {
							if (ThisShip.equip[eId] === 75)
								++drumCount;
						}
					}

					// Drum count
					$(".exped_drums", ExpedBox).text( drumCount );

					// Resource gains
					for(let rctr in ThisExped.data.api_get_material){
						rctr = parseInt(rctr, 10);
						const rscAmt = ThisExped.data.api_get_material[rctr];
						if(rscAmt > 0){
							$(".exped_rsc"+(rctr+1), ExpedBox).text( rscAmt );
						}else{
							$(".exped_rsc"+(rctr+1), ExpedBox).text("");
							$(".exped_rsc"+(rctr+1), ExpedBox).addClass("empty");
						}
					}

					// Result image
					$(".exped_result img", ExpedBox).attr("src",
						"../../../../assets/img/client/exped_"+
						(["fail","fail","success","gs"][ThisExped.data.api_clear_result+1])
						+".png");

					// see private function used by `main.js#ExpeditionResultModel.prototype._createItemModel`
					const useItemMap = {
						1:"bucket", // flag value
						2:"ibuild", // flag value
						3:"devmat", // flag value
						4:"screws", // master id
						5:"coin",   // flag value, its master id is 44
						10:"box1",  // master id
						11:"box2",  // master id
						12:"box3",  // master id
					};
					// Reward item1 and item2
					for(const fctr in ThisExped.data.api_useitem_flag) {
						const flag = ThisExped.data.api_useitem_flag[fctr];
						const itemIndex = parseInt(fctr, 10) + 1;
						const itemDiv = $(".exped_item" + itemIndex, ExpedBox);
						if(flag > 0) {
							const getItem = ThisExped.data["api_get_item" + itemIndex];
							const useitemId = flag === 4 ? getItem.api_useitem_id : flag;
							const useitemCount = getItem.api_useitem_count;
							$("img", itemDiv).attr("src",
								`/assets/img/client/${useItemMap[useitemId]}.png`
							).attr("title",
								KC3Meta.useItemName(useitemId === 5 ? 44 : useitemId)
							);
							$("span", itemDiv).text(useitemCount > 1 ? useitemCount : "");
						} else {
							$("img", itemDiv).hide();
							$("span", itemDiv).hide();
						}
					}

				}
			});
		}
		
	};
	
})();
