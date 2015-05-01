var TabSortie = {
	active: false,
	
	init :function(){
		if(this.active) return false; this.active = true;
		
	},
	
	show :function(){
		// Get pagination
		app.Logging.count_sortie(function(NumRecords){
			var itemsPerPage = 25;
			var numPages = Math.ceil(NumRecords/itemsPerPage);
			
			var pageCtr, pageBox;
			for(pageCtr=0; pageCtr<numPages; pageCtr++){
				pageBox = $(".page_sortie .factory .sortie_page").clone().appendTo(".page_sortie .sortie_pages");
				pageBox.text(pageCtr+1);
			}
			
			$(".page_sortie .sortie_pages .sortie_page").on("click", function(){
				$(".page_sortie .sortie_page").removeClass("active");
				$(this).addClass("active");
				PageTabs.sortie.showPage( $(this).text() );
			});
			
			$(".page_sortie .sortie_pages .sortie_page").first().click();
		});
	},
	
	showPage :function(pageNumber){
		var self = this;
		app.Logging.get_sortie(pageNumber, function(response){
			console.log(response);
			$(".page_sortie .sortie_list").html("")
			
			var ctr, thisBuild, buildbox, bctr, battleNum;
			for(ctr in response){
				thisSortie = response[ctr];
				
				buildbox = $(".page_sortie .factory .sortie").clone().appendTo(".page_sortie .sortie_list");
				
				$(".worldmap", buildbox).text( thisSortie.world+"-"+thisSortie.mapnum );
				
				self.showFleetFace(buildbox, 1, thisSortie.fleet1[0].mst_id);
				self.showFleetFace(buildbox, 2, thisSortie.fleet1[1].mst_id);
				self.showFleetFace(buildbox, 3, thisSortie.fleet1[2].mst_id);
				self.showFleetFace(buildbox, 4, thisSortie.fleet1[3].mst_id);
				self.showFleetFace(buildbox, 5, thisSortie.fleet1[4].mst_id);
				self.showFleetFace(buildbox, 6, thisSortie.fleet1[5].mst_id);
				
				$(".node", buildbox).hide();
				
				battleNum = 1;
				for(bctr in thisSortie.battles){
					$(".node-"+battleNum, buildbox).text(String.fromCharCode(thisSortie.battles[bctr].node+96).toUpperCase());
					$(".node-"+battleNum, buildbox).show();
					battleNum++;
				}
				
				$(".time", buildbox).text( (new Date(thisSortie.time*1000)).format("mmm dd - hh:MM tt") );
			}
		});
	},
	
	showFleetFace :function(buildbox, num, mst_id){
		if(mst_id){
			$(".faces .face-"+num+" img", buildbox).attr("src", app.Assets.shipIcon(mst_id) );
		}else{
			$(".faces .face-"+num, buildbox).hide();
		}
	}
};