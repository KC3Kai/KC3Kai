(function(){
	"use strict";
	
	KC3StrategyTabs.screenshots = new KC3StrategyTab("screenshots");
	
	KC3StrategyTabs.screenshots.definition = {
		tabSelf: KC3StrategyTabs.screenshots,
		
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
			KC3Database.count_screenshots(function(NumRecords){
				var itemsPerPage = 20;
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
			});
			
			this.showPage(1);
		},
		
		/* SHOW PAGE
		Show single page of screenshors
		---------------------------------*/
		showPage :function( page ){
			KC3Database.get_screenshots(page, function(screenshots){
				$(".screenshot_list").html("");
				var ss_thumb;
				$.each(screenshots, function(i, screenshot){
					ss_thumb = $(".tab_screenshots .factory .ss_thumb").clone().appendTo(".screenshot_list");
					$("img", ss_thumb).attr("src", screenshot.imgur);
					$(".ss_date", ss_thumb).text( (new Date(screenshot.ltime*1000)).format("mmm dd, yyyy - hh:MM tt") );
				});
			});
		}
	};
	
})();
