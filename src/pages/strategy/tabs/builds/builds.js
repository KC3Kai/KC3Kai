(function(){
	"use strict";
	
	KC3StrategyTabs.builds = new KC3StrategyTab("builds");
	
	KC3StrategyTabs.builds.definition = {
		tabSelf: KC3StrategyTabs.builds,
		
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
			KC3Database.count_build(function(NumRecords){
				var itemsPerPage = 30;
				var numPages = Math.ceil(NumRecords/itemsPerPage);
				
				var pageCtr, pageBox;
				for(pageCtr=0; pageCtr<numPages; pageCtr++){
					pageBox = $(".tab_builds .factory .build_page").clone().appendTo(".tab_builds .build_pages");
					pageBox.text(pageCtr+1);
				}
				$("<div>").addClass("clear").appendTo(".tab_builds .build_pages");
				
				$(".tab_builds .build_pages .build_page").on("click", function(){
					$(".tab_builds .build_page").removeClass("active");
					$(this).addClass("active");
					self.tabSelf.definition.showPage( $(this).text() );
				});
				
				$(".tab_builds .build_pages .build_page").first().trigger("click");
			});
		},
		
		showPage :function(pageNumber){
			KC3Database.get_build(pageNumber, function(response){
				$(".tab_builds .build_list").html("");
				
				var ctr, thisBuild, buildbox;
				for(ctr in response){
					thisBuild = response[ctr];
					
					buildbox = $(".tab_builds .factory .build_item").clone().appendTo(".tab_builds .build_list");
					
					$(".build_id", buildbox).text( thisBuild.id );
					$(".build_ficon img", buildbox).attr("src", KC3Meta.shipIcon(thisBuild.flag) );
					$(".build_flag", buildbox).text( KC3Meta.shipName( KC3Master.ship(thisBuild.flag).api_name ) );
					
					$(".build_rsc1", buildbox).text( thisBuild.rsc1 );
					$(".build_rsc2", buildbox).text( thisBuild.rsc2 );
					$(".build_rsc3", buildbox).text( thisBuild.rsc3 );
					$(".build_rsc4", buildbox).text( thisBuild.rsc4 );
					
					$(".build_ricon img", buildbox).attr("src", KC3Meta.shipIcon(thisBuild.result) );
					$(".build_result", buildbox).text( KC3Meta.shipName( KC3Master.ship(thisBuild.result).api_name ) );
					$(".build_time", buildbox).text( (new Date(thisBuild.time*1000)).format("mmm dd, yy - hh:MM tt") );
				}
			});
		}
		
	};
	
})();