(function(){
	"use strict";
	
	KC3StrategyTabs.pvp = new KC3StrategyTab("pvp");
	
	KC3StrategyTabs.pvp.definition = {
		tabSelf: KC3StrategyTabs.pvp,
		
		box_record: false,
		box_ship: false,
		
		init :function(){},
		execute :function(){
			var self = this;
			// Count PvP records for pagination
			KC3Database.count_pvps(function(result){
				self.pages = Math.ceil( result / 10 );
				if(self.pages > 0){
					self.showPagination();
					self.showPage(1);
				} else {
					$(".tab_pvp .pagination").hide();
				}
			});
		},
		
		/* SHOW SPECIFIC PAGE
		---------------------------------*/
		showPage :function(pageNum){
			var self = this;
			$("#pvp_list").html("");
			KC3Database.get_pvps(pageNum, function(results){
				$.each(results, function(index, pvpBattle){
					console.log(pvpBattle);
					self.box_record = $(".tab_pvp .factory .pvp_record").clone();
					$(".pvp_id", self.box_record).text(pvpBattle.id);
					if (pvpBattle.time) {
						$(".pvp_date", self.box_record).text(new Date(pvpBattle.time*1000).format("mmm d"));
					} else {
						$(".pvp_date", self.box_record).text("?");
					}
					self.box_record.appendTo("#pvp_list");
				});
			});
		},
		
		/* PAGINATION
		---------------------------------*/
		showPagination :function(){
			var self = this;
			$(".tab_pvp .page_list").html('<ul class="pagination pagination-sm"></ul>');
			$(".tab_pvp .pagination").twbsPagination({
				totalPages: self.pages,
				visiblePages: 9,
				onPageClick: function (event, page) {
					self.showPage(page);
				}
			});
		}
	};
	
})();
