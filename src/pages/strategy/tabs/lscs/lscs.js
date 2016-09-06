(function(){
	"use strict";
	
	KC3StrategyTabs.lscs = new KC3StrategyTab("lscs");
	
	KC3StrategyTabs.lscs.definition = {
		tabSelf: KC3StrategyTabs.lscs,
		
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
			// Get pagination
			KC3Database.count_lscs(function(NumRecords){
				var itemsPerPage = 30;
				var numPages = Math.ceil(NumRecords/itemsPerPage);
				
				if(numPages > 0){
					$('.pagination').twbsPagination({
						totalPages: numPages,
						visiblePages: 9,
						onPageClick: function (event, page) {
							self.tabSelf.definition.showPage( page );
						}
					});
				}else{
					$('.pagination').hide();
				}
				
				self.tabSelf.definition.showPage(1);
			});
		},
		
		showPage :function(pageNumber){
			KC3Database.get_lscs(pageNumber, function(response){
				$(".tab_lscs .build_list").html("");
				
				var ctr, thisBuild, buildbox;
				var shipClickFunc = function(e){
					KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
				};
				for(ctr in response){
					thisBuild = response[ctr];
					
					buildbox = $(".tab_lscs .factory .build_item").clone().appendTo(".tab_lscs .build_list");
					
					$(".build_id", buildbox).text( thisBuild.id );
					$(".build_ficon img", buildbox).attr("src", KC3Meta.shipIcon(thisBuild.flag) );
					$(".build_ficon img", buildbox).attr("alt", thisBuild.flag );
					$(".build_ficon img", buildbox).click(shipClickFunc);
					$(".build_flag", buildbox).text( KC3Meta.shipName( KC3Master.ship(thisBuild.flag).api_name ) );
					
					$(".build_rsc1", buildbox).text( thisBuild.rsc1 );
					$(".build_rsc2", buildbox).text( thisBuild.rsc2 );
					$(".build_rsc3", buildbox).text( thisBuild.rsc3 );
					$(".build_rsc4", buildbox).text( thisBuild.rsc4 );
					$(".build_devmat", buildbox).text( thisBuild.devmat );
					
					$(".build_ricon img", buildbox).attr("src", KC3Meta.shipIcon(thisBuild.result) );
					$(".build_ricon img", buildbox).attr("alt", thisBuild.result );
					$(".build_ricon img", buildbox).click(shipClickFunc);
					$(".build_result", buildbox).text( KC3Meta.shipName( KC3Master.ship(thisBuild.result).api_name ) );
					$(".build_time", buildbox).text( (new Date(thisBuild.time*1000)).format("mmm dd, yy - hh:MM tt") );
				}
			});
		}
		
	};
	
})();
