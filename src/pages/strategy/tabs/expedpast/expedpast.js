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
			var self = this;
			
			// Add all expedition numbers on the filter list
			var KE = PS["KanColle.Expedition"];
			$('.tab_expedpast .expedNumbers').html("");
			KE.allExpeditions.forEach( function(curVal, ind) {
				var row = $('.tab_expedpast .factory .expedNum').clone();
				$(".expedCheck input", row).attr("value", curVal.id.toString());
				$(".expedText", row).text( curVal.id.toString() );
				$(".expedTime", row).text( (curVal.cost.time*60).toString().toHHMMSS().substring(0,5) );
				
				self.exped_filters.push(curVal.id);
				
				var boxNum = Math.ceil((ind+1)/8);
				$(".tab_expedpast .expedNumBox_"+boxNum).append( row );
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
					worldNum     = Math.qckInt("ceil",($(this).attr("value")) / 8),
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
			var self = this;
			
			// Get pagination
			$(".tab_expedpast .exped_pages").html('<ul class="pagination pagination-sm"></ul>');
			KC3Database.count_expeds(this.exped_filters, this.fleet_filters, function(NumRecords){
				// console.log("NumRecords", NumRecords);
				var itemsPerPage = 20;
				var numPages = Math.ceil(NumRecords/itemsPerPage);
				
				if(numPages > 0){
					$('.tab_expedpast .pagination').twbsPagination({
						totalPages: numPages,
						visiblePages: 9,
						onPageClick: function (event, page) {
							self.tabSelf.definition.showPage( page );
						}
					});
					$('.tab_expedpast .pagination').show("");
				}else{
					$('.tab_expedpast .pagination').hide();
				}
				
				self.tabSelf.definition.showPage(1);
			});
		},
		
		showPage :function(pageNumber){
			var self = this;
			// console.log("page", pageNumber);
			
			KC3Database.get_expeds(pageNumber, this.exped_filters, this.fleet_filters, function(response){
				// console.log("get_expeds", response);
				$(".tab_expedpast .exped_list").html("");
				
				var ctr, sctr, rctr, drumCount, rscAmt,
					ThisExped, ExpedBox, ExpedDate,
					ThisShip, ShipBox;
					
				for(ctr in response){
					ThisExped = response[ctr];
					//console.log(ThisExped);
					
					ExpedBox = $(".tab_expedpast .factory .exped_item").clone().appendTo(".tab_expedpast .exped_list");
					
					// Expedition date
					ExpedDate = new Date(ThisExped.time*1000);
					$(".exped_date", ExpedBox).text( ExpedDate.format("mmm dd") );
					$(".exped_time", ExpedBox).text( ExpedDate.format("hh:MM tt") );
					$(".exped_info", ExpedBox).attr("title", ExpedDate.format("yyyy-mm-dd HH:MM:ss"));
					
					// Number and HQ exp
					$(".exped_number", ExpedBox).text( ThisExped.mission );
					$(".exped_exp", ExpedBox).text( ThisExped.admiralXP );

					drumCount = 0;
					// Ship List
					for(sctr in ThisExped.fleet){
						ThisShip = ThisExped.fleet[sctr];
						ShipBox = $(".tab_expedpast .factory .exped_ship").clone();
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
					for(rctr in ThisExped.data.api_get_material){
						rctr = parseInt(rctr, 10);
						rscAmt = ThisExped.data.api_get_material[rctr];
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
