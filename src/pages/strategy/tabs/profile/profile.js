(function(){
	"use strict";
	
	KC3StrategyTabs.profile = new KC3StrategyTab("profile");
	
	KC3StrategyTabs.profile.definition = {
		tabSelf: KC3StrategyTabs.profile,
		
		player: {},
		statistics: {},
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Check for player statstics
			if(typeof localStorage.player != "undefined"){
				this.player = JSON.parse(localStorage.player);
			}else{
				this.tabSelf.showError("Player information not available");
				return false;
			}
			
			// Check for player statstics
			if(typeof localStorage.statistics != "undefined"){
				this.statistics = JSON.parse(localStorage.statistics);
			}else{
				this.tabSelf.showError("Player statistics not available");
				return false;
			}
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".hq_id .hq_content").html("asdasd");
			// Show player information
			// $(".hq_id .hq_content").html(this.player.id);
			$(".hq_name .hq_content").html(this.player.name);
			$(".hq_desc .hq_content").html(this.player.desc);
			
			var MyServer = KC3Meta.serverByNum(this.player.server);
			$(".hq_server .hq_content").html(MyServer.name);
			
			$(".hq_rank .hq_content").html(this.player.rank);
			$(".hq_level .hq_content").html(this.player.level);
			
			// Show statistics
			$(".stat_sortie .stat_rate .stat_value").html(this.statistics.sortie.rate);
			$(".stat_sortie .stat_win .stat_value").html(this.statistics.sortie.win);
			$(".stat_sortie .stat_lose .stat_value").html(this.statistics.sortie.lose);
			
			$(".stat_pvp .stat_rate .stat_value").html(this.statistics.pvp.rate);
			$(".stat_pvp .stat_win .stat_value").html(this.statistics.pvp.win);
			$(".stat_pvp .stat_lose .stat_value").html(this.statistics.pvp.lose);
			$(".stat_pvp .stat_atk .stat_value").html(this.statistics.pvp.attacked);
			$(".stat_pvp .stat_atkwin .stat_value").html(this.statistics.pvp.attacked_win);
			
			$(".stat_exped .stat_rate .stat_value").html(this.statistics.exped.rate);
			$(".stat_exped .stat_success .stat_value").html(this.statistics.exped.success);
			$(".stat_exped .stat_total .stat_value").html(this.statistics.exped.total);
		}
		
	};
	
})();