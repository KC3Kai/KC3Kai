var TabSortie = {
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
	
	page: 0,
	
	/* Load data, still ok if not available, it's just gauge
	---------------------------------------------------*/
	init :function(){
		if(this.status.active) return true;
		
		this.status.active = true;
	},
	
	/* Attempt to show the page
	--------------------------------------------*/
	show :function(){
		if(!this.status.check()) return false;
		
		var self = this;
		
		// Get pagination
		app.Logging.count_normal_sorties(function(NumRecords){
			var itemsPerPage = 10;
			var numPages = Math.ceil(NumRecords/itemsPerPage);
			
			var pageCtr, pageBox;
			for(pageCtr=0; pageCtr<numPages; pageCtr++){
				pageBox = $(".page_sortie .factory .sortie_page").clone().appendTo(".page_sortie .sortie_pages");
				pageBox.text(pageCtr+1);
			}
			
			$(".page_sortie .sortie_pages .sortie_page").on("click", function(){
				$(".page_sortie .sortie_page").removeClass("active");
				$(this).addClass("active");
				app.Strategy.tabs.sortie.showPage( $(this).text() );
			});
			
			// onClick a Sortie Record on the list
			$(".page_sortie .sortie_list").on("click", ".sortie_item", function(){
				$(".page_sortie .sortie_list .sortie_item").removeClass("active");
				$(this).addClass("active");
				self.showSortie( $(this).data("id") );
			});
			
			$(".page_sortie .sortie_pages .sortie_page").first().click();
		});
	},
	
	showPage :function(pageNumber){
		$(".page_sortie .sortie_list").html("");
		
		var self = this;
		app.Logging.get_normal_sorties(pageNumber, function(response){
			var ctr;
			for(ctr in response){
				self.addSortieRecord( response[ctr] );
			}
		});
	},
	
	/* Show a single sortie record on list
	--------------------------------------------*/
	addSortieRecord :function(thisSortie){
		
		// Clone and add new record box
		var buildbox = $(".page_sortie .factory .sortie_item").clone().appendTo(".page_sortie .sortie_list");
		buildbox.data("id", thisSortie.id);
		
		// Show record info
		$(".sortie_mapnum", buildbox).text( thisSortie.world+"-"+thisSortie.mapnum );
		$(".sortie_id", buildbox).text( thisSortie.id );
		$(".sortie_date", buildbox).text( (new Date(thisSortie.time*1000)).mmdd() );
		
		// Determine flagship
		var flagship = -1;
		if(typeof thisSortie["fleet"+thisSortie.fleetnum] != "undefined"){
			flagship = thisSortie["fleet"+thisSortie.fleetnum][0].mst_id;
		}
		$(".sortie_flag img", buildbox).attr("src", app.Assets.shipIcon(flagship, '../../assets/img/ui/empty.png'));
		
		// Show nodes
		var bctr, battleNum;
		battleNum = 1;
		for(bctr in thisSortie.battles){
			$(".node-"+battleNum, buildbox).text(String.fromCharCode(thisSortie.battles[bctr].node+96).toUpperCase());
			$(".node-"+battleNum, buildbox).show();
			battleNum++;
		}
	},
	
	/* Show single sortie info on right panel
	--------------------------------------------*/
	showSortie :function(sortie_id){
		var self = this;
		
		// Hide sortie details panel
		$(".page_sortie .sortie_info").hide();
		$(".page_sortie .sortie_info .sortie_battles").html("");
		
		// Get data from local database
		app.Logging.get_sortie(sortie_id, function(response){
			if(response){
				$(".page_sortie .sortie_info .sortie_title span").text(response.id);
				
				self.showPanelFleet(1, response["fleet"+response.fleetnum]);
				
				// Check if combined fleet
				if(response.combined > 0){
					self.showPanelFleet(2, response.fleet2);
				}else{
					$(".page_sortie .sortie_info .fleet_2").hide();
				}
				
				// Check for support non-boss support
				try {
					if( response.support1 > 0 ){
						self.showPanelFleet(3, response["fleet"+response.support1]);
					}else{
						$(".page_sortie .sortie_info .fleet_3").hide();
					}
				}catch(e){ $(".page_sortie .sortie_info .fleet_3").hide(); }
				
				// Check for support boss support
				try {
					if( response.support2 > 0 ){
						self.showPanelFleet(4, response["fleet"+response.support2]);
					}else{
						$(".page_sortie .sortie_info .fleet_4").hide();
					}
				}catch(e){ $(".page_sortie .sortie_info .fleet_4").hide(); }
				
				// Show battle nodes
				var bctr;
				for(bctr in response.battles){
					self.showBattleBox( parseInt(bctr, 10)+1, response.battles[bctr] );
				}
				
				$(".page_sortie .sortie_info").animate({width: 'toggle'});
			}
		});
	},
	
	/* Fill specific fleet on panel
	--------------------------------------------*/
	showPanelFleet :function(num, fleet){
		this.showShipImage(num, fleet, 0);
		this.showShipImage(num, fleet, 1);
		this.showShipImage(num, fleet, 2);
		this.showShipImage(num, fleet, 3);
		this.showShipImage(num, fleet, 4);
		this.showShipImage(num, fleet, 5);
	},
	
	/* Show ship image on specific fleet
	--------------------------------------------*/
	showShipImage :function(num, fleet, index){
		if(fleet[index]){
			$(".page_sortie .sortie_info .fleet_"+num+" .fleet_img_"+(index+1)+" img").attr("src",
				app.Assets.shipIcon(fleet[index].mst_id, '../../assets/img/ui/empty.png')
			);
		}else{
			$(".page_sortie .sortie_info .fleet_"+num+" .fleet_img_"+(index+1)).hide();
		}
	},
	
	/* Add battle box on the panel
	--------------------------------------------*/
	showBattleBox :function(battleNum, battleData){
		
		// Clone and add new battle box
		var battleBox = $(".page_sortie .factory .sortie_battle").clone().appendTo(".page_sortie .sortie_battles");
		$(".battle_node", battleBox).text(String.fromCharCode(battleData.node+96).toUpperCase());
		$(".battle_date", battleBox).text((new Date(battleData.time*1000)).format("mmm dd, yy - hh:MM tt"));
		
		// Detection
		var detection = app.Meta.detection(battleData.data.api_search[0]);
		$(".battle_detect", battleBox).text( detection[0] );
		if( detection[1] != "" ){ $(".battle_detect", battleBox).addClass( detection[1] ); }
		
		
		// Air Battle
		var airbattle = app.Meta.airbattle(battleData.data.api_kouku.api_stage1.api_disp_seiku);
		$(".battle_air", battleBox).text( airbattle[0] );
		if( airbattle[1] != "" ){ $(".battle_air", battleBox).addClass( airbattle[1] ); }
		
		// Engagement
		$(".battle_engage", battleBox).text( app.Meta.engagement( battleData.data.api_formation[2] ) );
		
		// Support Expedition
		if( battleData.data.api_support_flag > 0 ){
			$(".battle_support", battleBox).text("YES");
			$(".battle_support", battleBox).addClass("good");
		}else{
			$(".battle_support", battleBox).text("NO");
		}
		
		
		
		$(".battle_rate img", battleBox).attr("src", "../../assets/img/client/ratings/"+battleData.rating+".png");
		
		if(battleData.drop > 0){
			$(".battle_drop img", battleBox).attr("src", app.Assets.shipIcon(battleData.drop, '../../assets/img/ui/empty.png'));
		}else{
			$(".battle_drop", battleBox).hide();
		}
	}
};