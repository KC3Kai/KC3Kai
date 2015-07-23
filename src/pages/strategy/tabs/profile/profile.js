(function(){
	"use strict";
	
	KC3StrategyTabs.profile = new KC3StrategyTab("profile");
	
	KC3StrategyTabs.profile.definition = {
		tabSelf: KC3StrategyTabs.profile,
		
		player: {},
		statistics: false,
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Check for player statstics
			if(typeof localStorage.player != "undefined"){
				this.player = JSON.parse(localStorage.player);
			}else{
				// this.tabSelf.showError("Player information not available");
				// return false;
			}
			
			// Check for player statstics
			if(typeof localStorage.statistics != "undefined"){
				this.statistics = JSON.parse(localStorage.statistics);
			}else{
				// this.tabSelf.showError("Player statistics not available");
				// return false;
			}
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			// Show player information
			$(".hq_id .hq_content").html(PlayerManager.hq.id);
			$(".hq_name .hq_content").html(PlayerManager.hq.name);
			$(".hq_desc .hq_content").html(PlayerManager.hq.desc);
			
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			$(".hq_server .hq_content").html( MyServer.name );
			
			$(".hq_rank .hq_content").html(PlayerManager.hq.rank);
			$(".hq_level .hq_content").html(PlayerManager.hq.level);
			
			// Show statistics
			if(this.statistics){
				$(".stat_sortie .stat_rate .stat_value").html((this.statistics.sortie.rate*100)+"%");
				$(".stat_sortie .stat_win .stat_value").html(this.statistics.sortie.win);
				$(".stat_sortie .stat_lose .stat_value").html(this.statistics.sortie.lose);
				
				$(".stat_pvp .stat_rate .stat_value").html(this.statistics.pvp.rate+"%");
				$(".stat_pvp .stat_win .stat_value").html(this.statistics.pvp.win);
				$(".stat_pvp .stat_lose .stat_value").html(this.statistics.pvp.lose);
				
				$(".stat_exped .stat_rate .stat_value").html(this.statistics.exped.rate+"%");
				$(".stat_exped .stat_success .stat_value").html(this.statistics.exped.success);
				$(".stat_exped .stat_total .stat_value").html(this.statistics.exped.total);
			}
			
			// Export all data
			$(".tab_profile .export_data").on("click", function(){
				var blob = new Blob([JSON.stringify({
					absoluteswf: localStorage.absoluteswf,
					config: JSON.parse(localStorage.config),
					fleets: JSON.parse(localStorage.fleets),
					gears: JSON.parse(localStorage.gears),
					lastResource:localStorage.lastResource,
					lastUseitem: localStorage.lastUseitem,
					maps: JSON.parse(localStorage.maps),
					player: JSON.parse(localStorage.player),
					quests: JSON.parse(localStorage.quests),
					ships: JSON.parse(localStorage.ships),
					statistics: JSON.parse(localStorage.statistics)
					
				})], {type: "application/json;charset=utf-8"});
				
				saveAs(blob, "["+PlayerManager.hq.name+"] "+((new Date()).format("yyyy-mm-dd"))+".kc3");
			});
			
			// Import data file open dialog
			$(".tab_profile .import_data").on("click", function(){
				$(".tab_profile .import_file").trigger("click");
			});
			
			// On-data has been read
			var reader = new FileReader();
			reader.onload = function(theFile){
				var importedData = JSON.parse(this.result);
				localStorage.absoluteswf = importedData.absoluteswf;
				localStorage.config = JSON.stringify(importedData.config);
				localStorage.fleets = JSON.stringify(importedData.fleets);
				localStorage.gears = JSON.stringify(importedData.gears);
				localStorage.lastResource = importedData.lastResource;
				localStorage.lastUseitem = importedData.lastUseitem;
				localStorage.maps = JSON.stringify(importedData.maps);
				localStorage.player = JSON.stringify(importedData.player);
				localStorage.quests = JSON.stringify(importedData.quests);
				localStorage.ships = JSON.stringify(importedData.ships);
				localStorage.statistics = JSON.stringify(importedData.statistics);
				alert("Imported data for "+importedData.player.name+" from "+ KC3Meta.serverByNum(importedData.player.server).name+"!");
				window.location.reload();
			};
			
			// On-selected file to import
			$(".tab_profile .import_file").on("change", function(event){
				if( event.target.files.length > 0 ){
					if(window.File && window.FileReader && window.FileList && window.Blob){
						reader.readAsText( event.target.files[0] );
					}else{
						alert("Unfortunately, file reading is not available on your browser.");
					}
				}
			});
		}
		
	};
	
})();