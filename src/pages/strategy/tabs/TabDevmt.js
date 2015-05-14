var TabDevmt = {
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
		app.Logging.count_devmt(function(NumRecords){
			var itemsPerPage = 25;
			var numPages = Math.ceil(NumRecords/itemsPerPage);
			
			var pageCtr, pageBox;
			for(pageCtr=0; pageCtr<numPages; pageCtr++){
				pageBox = $(".page_devmt .factory .build_page").clone().appendTo(".page_devmt .build_pages");
				pageBox.text(pageCtr+1);
			}
			
			$(".page_devmt .build_pages .build_page").on("click", function(){
				$(".page_devmt .build_page").removeClass("active");
				$(this).addClass("active");
				app.Strategy.tabs.devmt.showPage( $(this).text() );
			});
			
			$(".page_devmt .build_pages .build_page").first().trigger("click");
		});
	},
	
	showPage :function(pageNumber){
		app.Logging.get_devmt(pageNumber, function(response){
			$(".page_devmt .build_list").html("")
			
			var ctr, thisBuild, buildbox, MasterItem;
			for(ctr in response){
				thisBuild = response[ctr];
				
				buildbox = $(".page_devmt .factory .build_item").clone().appendTo(".page_devmt .build_list");
				
				$(".build_id", buildbox).text( thisBuild.id );
				$(".build_ficon img", buildbox).attr("src", app.Assets.shipIcon(thisBuild.flag) );
				$(".build_flag", buildbox).text( app.Master.ship(thisBuild.flag).english );
				
				$(".build_rsc1", buildbox).text( thisBuild.rsc1 );
				$(".build_rsc2", buildbox).text( thisBuild.rsc2 );
				$(".build_rsc3", buildbox).text( thisBuild.rsc3 );
				$(".build_rsc4", buildbox).text( thisBuild.rsc4 );
				
				if(thisBuild.result > -1){
					MasterItem = app.Master.slotitem(thisBuild.result);
					$(".build_ricon img", buildbox).attr("src", "../../assets/img/items/"+MasterItem.api_type[3]+".png");
					$(".build_result", buildbox).text( MasterItem.english );
				}else{
					$(".build_ricon img", buildbox).attr("src", "../../assets/img/client/penguin.png");
					$(".build_result", buildbox).text( "Penguin" );
				}
				
				$(".build_time", buildbox).text( new Date(thisBuild.time*1000).format("mmm dd, yy - hh:MM tt") );
				
			}
		});
		
		
	}
};