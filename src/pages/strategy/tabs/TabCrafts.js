var TabCrafts = {
	status: {
		active: false,
		error: false,
		message: "",
		check :function(){
			if(this.error){
				app.Strategy.showError( this.message );
				return false;
			}
			return true;
		}
	},
	
	init :function(){
		if(this.status.active) return true;
		
		this.status.active = true;
	},
	
	show :function(){
		if(!this.status.check()) return false;
		
		// Get pagination
		app.Logging.count_build(function(NumRecords){
			var itemsPerPage = 25;
			var numPages = Math.ceil(NumRecords/itemsPerPage);
			
			var pageCtr, pageBox;
			for(pageCtr=0; pageCtr<numPages; pageCtr++){
				pageBox = $(".page_crafts .factory .build_page").clone().appendTo(".page_crafts .build_pages");
				pageBox.text(pageCtr+1);
			}
			
			$(".page_crafts .build_pages .build_page").on("click", function(){
				$(".page_crafts .build_page").removeClass("active");
				$(this).addClass("active");
				PageTabs.crafts.showPage( $(this).text() );
			});
			
			$(".page_crafts .build_pages .build_page").first().click();
		});
	},
	
	showPage :function(pageNumber){
		app.Logging.get_build(pageNumber, function(response){
			$(".page_crafts .build_list").html("")
			
			var ctr, thisBuild, buildbox;
			for(ctr in response){
				thisBuild = response[ctr];
				
				buildbox = $(".page_crafts .factory .build_item").clone().appendTo(".page_crafts .build_list");
				
				$(".build_id", buildbox).text( thisBuild.id );
				$(".build_ficon img", buildbox).attr("src", app.Assets.shipIcon(thisBuild.flag) );
				$(".build_flag", buildbox).text( app.Master.ship(thisBuild.flag).english );
				
				$(".build_rsc1", buildbox).text( thisBuild.rsc1 );
				$(".build_rsc2", buildbox).text( thisBuild.rsc2 );
				$(".build_rsc3", buildbox).text( thisBuild.rsc3 );
				$(".build_rsc4", buildbox).text( thisBuild.rsc4 );
				
				$(".build_ricon img", buildbox).attr("src", app.Assets.shipIcon(thisBuild.result) );
				$(".build_result", buildbox).text( app.Master.ship(thisBuild.result).english );
				$(".build_time", buildbox).text( new Date(thisBuild.time*1000).format("mmm dd, yy - hh:MM tt") );
			}
		});
		
		
	}
};