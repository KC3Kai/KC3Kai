(function(){
	"use strict";
	
	KC3StrategyTabs.expedpast = new KC3StrategyTab("expedpast");
	
	KC3StrategyTabs.expedpast.definition = {
		tabSelf: KC3StrategyTabs.expedpast,
		
		exped_filters: [],
		fleet_filters: [2,3,4],
		useItemMap: {
			1:"bucket",
			2:"ibuild",
			3:"devmat",
			4:"box1",
			5:"box2",
			6:"box3",
		},
			
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;
			
			// Add all expedition numbers on the filter list
			const KE = PS["KanColle.Expedition"];
			$('.tab_expedpast .expedNumbers').empty();
			KE.allExpeditions.forEach( function(curVal, ind) {
				var row = $('.tab_expedpast .factory .expedNum').clone();
				$(".expedCheck input", row).attr("value", curVal.id);
				$(".expedCheck input", row).attr("world", curVal.world);
				$(".expedText", row).text( curVal.name );
				$(".expedTime", row).text( (curVal.cost.time*60).toString().toHHMMSS().substring(0,5) );
				
				self.exped_filters.push(curVal.id);
				
				$(".tab_expedpast .expedNumBox_"+curVal.world).append( row );
			});
			
			// Add world toggle
			$(".tab_expedpast .expedNumBox")
				.filter(function(i,x){return $(x).hasClass("expedNumBox_"+(i+1));})
				.each(function(i,x){
					var
						row = $('.tab_expedpast .factory .expedNum').clone().addClass("expedWhole").removeClass("expedNum"),
						val = true;
					$("input",".expedNumBox_"+(i+1)).each(function(id,elm){
						val&= $(elm).prop("checked");
					});
					$(row)
						.find(".expedCheck input")
							.attr("value", i+1)
							.prop("checked", val)
						.end()
						.find(".expedText")
							.text( "World " + (i+1) )
						.end()
						.find(".expedTime")
							.remove()
						.end();
					
					$(x).prepend(row);
				});
			
			// Expedition Number Filter
			$(".tab_expedpast .expedNumBox").on("click", '.expedNum input', function(){
				var
					filterExpeds = $('.tab_expedpast .expedNumBox .expedNum input:checked'),
					worldNum     = $(this).attr("world"),
					context      = ".tab_expedpast .expedNumBox_"+worldNum,
					parentCheck  = true;
				self.exped_filters = [];
				$(".expedNum   input",context).each(function(i,x){ parentCheck &= $(x).prop("checked"); });
				$(".expedWhole input",context).prop("checked",parentCheck);
				filterExpeds.each( function() {
					self.exped_filters.push( parseInt( $(this).attr("value"),10) );
				});
				self.tabSelf.definition.refreshList();
			}).on("click", ".expedWhole input", function() {
				var
					worldNum = $(this).val(),
					state    = $(this).prop("checked"),
					expeds   = $(".tab_expedpast .expedNumBox_"+worldNum+" .expedNum input");
				expeds.each(function(i,x){
					var
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
				self.tabSelf.definition.refreshList();
			});
			
			// Fleet Number Filter
			$(".tab_expedpast .expedNumBox").on("click", '.fleetRadio input', function(){
				var filterFleets = $('.tab_expedpast .expedNumBox .fleetRadio input:checked');
				self.fleet_filters = [];
				filterFleets.each( function() {
					self.fleet_filters.push( parseInt( $(this).attr("value"),10) );
				});
				self.tabSelf.definition.refreshList();
			});
			
			// Show initial list
			self.tabSelf.definition.refreshList();
		},
		
		refreshList :function(){
			const self = this;
			
			$(".tab_expedpast .exped_list").empty();
			$(".tab_expedpast .exped_pages").html('<ul class="pagination pagination-sm"></ul>');
			// Get pagination
			KC3Database.count_expeds(this.exped_filters, this.fleet_filters, function(numRecords){
				const itemsPerPage = 20;
				const numPages = Math.ceil(numRecords / itemsPerPage);
				//console.debug("count_expeds", numRecords);
				
				if(numPages > 0){
					$('.tab_expedpast .pagination').twbsPagination({
						totalPages: numPages,
						visiblePages: 9,
						onPageClick: function (event, page) {
							self.tabSelf.definition.showPage( page );
						}
					});
					$('.tab_expedpast .pagination').show();
				}else{
					$('.tab_expedpast .pagination').hide();
				}
			});
		},
		
		showPage :function(pageNumber){
			const self = this;
			
			KC3Database.get_expeds(pageNumber, this.exped_filters, this.fleet_filters, function(response){
				//console.debug("get_expeds", response, self.exped_filters, self.fleet_filters);
				$(".tab_expedpast .exped_list").empty();
				
				for(let ctr in response){
					const ThisExped = response[ctr];
					const expedMaster = KC3Master.mission(ThisExped.mission) || {};
					//console.debug(ThisExped);
					
					const ExpedBox = $(".tab_expedpast .factory .exped_item").clone().appendTo(".tab_expedpast .exped_list");
					
					// Expedition date
					const expedDate = new Date(ThisExped.time * 1000);
					$(".exped_date", ExpedBox).text( expedDate.format("mmm dd") );
					$(".exped_time", ExpedBox).text( expedDate.format("hh:MM tt") );
					$(".exped_info", ExpedBox).attr("title", expedDate.format("yyyy-mm-dd HH:MM:ss"));
					
					// Number and HQ exp
					$(".exped_number", ExpedBox).text( expedMaster.api_disp_no || ThisExped.mission );
					$(".exped_exp", ExpedBox).text( ThisExped.admiralXP );

					let drumCount = 0;
					// Ship List
					for(let sctr in ThisExped.fleet){
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
					
					// Reward item 1
					if(ThisExped.data.api_useitem_flag[0] > 0){
						$(".exped_item1 img", ExpedBox).attr("src",
							"../../assets/img/client/"+
							self.tabSelf.definition.useItemMap[
								ThisExped.data.api_useitem_flag[0]
							]+".png");
					}else{
						$("exped_item1 img", ExpedBox).hide();
					}
					
					// Reward item 2
					if(ThisExped.data.api_useitem_flag[1] > 0){
						$(".exped_item2 img", ExpedBox).attr("src",
							"../../assets/img/client/"+
							self.tabSelf.definition.useItemMap[
								ThisExped.data.api_useitem_flag[1]
							]+".png");
					}else{
						$("exped_item2 img", ExpedBox).hide();
					}
				}
			});
		}
		
	};
	
})();
