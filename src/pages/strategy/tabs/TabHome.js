var TabHome = {
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
	
	statistics: {},
	newsfeed: {},
	
	/* Load required data, set error if not available
	---------------------------------------------------*/
	init :function(){
		if(this.status.active) return true;
		
		// Check for player statstics
		if(typeof localStorage.player_statistics != "undefined"){
			this.statistics = JSON.parse(localStorage.player_statistics);
		}else{
			this.status.error = true;
			this.status.message = "Player statistics not available";
			return false;
		}
		
		// Check for player newsfeed
		if(typeof localStorage.player_newsfeed != "undefined"){
			this.newsfeed = JSON.parse(localStorage.player_newsfeed);
		}else{
			this.status.error = true;
			this.status.message = "News Feed not available";
			return false;
		}
		
		this.status.active = true;
	},
	
	/* Attempt to show the page
	--------------------------------------------*/
	show :function(){
		if(!this.status.check()) return false;
		
		// Show player information
		$(".page_home .hq_id .hq_content").html(app.Player.id);
		$(".page_home .hq_name .hq_content").html(app.Player.name);
		$(".page_home .hq_desc .hq_content").html(app.Player.desc);
		
		var MyServer = app.Meta.serverByNum(app.Player.server);
		$(".page_home .hq_server .hq_content").html(MyServer.name);
		
		$(".page_home .hq_rank .hq_content").html(app.Player.rank);
		$(".page_home .hq_level .hq_content").html(app.Player.level);
		
		// Show statistics
		$(".page_home .stat_sortie .stat_rate .stat_value").html(this.statistics.sortie.rate);
		$(".page_home .stat_sortie .stat_win .stat_value").html(this.statistics.sortie.win);
		$(".page_home .stat_sortie .stat_lose .stat_value").html(this.statistics.sortie.lose);
		
		$(".page_home .stat_pvp .stat_rate .stat_value").html(this.statistics.pvp.rate);
		$(".page_home .stat_pvp .stat_win .stat_value").html(this.statistics.pvp.win);
		$(".page_home .stat_pvp .stat_lose .stat_value").html(this.statistics.pvp.lose);
		$(".page_home .stat_pvp .stat_atk .stat_value").html(this.statistics.pvp.attacked);
		$(".page_home .stat_pvp .stat_atkwin .stat_value").html(this.statistics.pvp.attacked_win);
		
		$(".page_home .stat_exped .stat_rate .stat_value").html(this.statistics.exped.rate);
		$(".page_home .stat_exped .stat_success .stat_value").html(this.statistics.exped.success);
		$(".page_home .stat_exped .stat_total .stat_value").html(this.statistics.exped.total);
		
		// Show Newsfeed
		this.showFeedItem( 0, this.newsfeed[0] );
		this.showFeedItem( 1, this.newsfeed[1] );
		this.showFeedItem( 2, this.newsfeed[2] );
		this.showFeedItem( 3, this.newsfeed[3] );
		this.showFeedItem( 4, this.newsfeed[4] );
	},
	
	/* Show single news feed record
	--------------------------------------------*/
	showFeedItem :function( index, data ){
		switch(data.api_type){
			case "1":
				$(".page_home .feed_item_"+(index+1)+" .colorbox").css("background", "#ffcc00");
				$(".page_home .feed_item_"+(index+1)+" .feed_text").html("Repairs Complete");
				break;
			case "2":
				$(".page_home .feed_item_"+(index+1)+" .colorbox").css("background", "#996600");
				$(".page_home .feed_item_"+(index+1)+" .feed_text").html("Construction Complete");
				break;
			case "3":
				$(".page_home .feed_item_"+(index+1)+" .colorbox").css("background", "#ace");
				$(".page_home .feed_item_"+(index+1)+" .feed_text").html("Expedition fleet has returned");
				break;
			case "5":
				$(".page_home .feed_item_"+(index+1)+" .colorbox").css("background", "#98E75F");
				var opponent = data.api_message.substring(1, data.api_message.indexOf("」"));
				if(data.api_message.indexOf("勝利") > -1){
					$(".page_home .feed_item_"+(index+1)+" .feed_text").html("You were attacked in PvP by \"<strong>"+opponent+"</strong>\" but won!");
				}else if(data.api_message.indexOf("敗北") > -1){
					$(".page_home .feed_item_"+(index+1)+" .feed_text").html("You were attacked in PvP by \"<strong>"+opponent+"</strong>\" and lost!");
				}
				break;
			case "7":
				$(".page_home .feed_item_"+(index+1)+" .colorbox").css("background", "#D75048");
				$(".page_home .feed_item_"+(index+1)+" .feed_text").html("Cleared or unlocked a new map");
				break;
			case "11":
				$(".page_home .feed_item_"+(index+1)+" .colorbox").css("background", "#9999FF");
				$(".page_home .feed_item_"+(index+1)+" .feed_text").html("Your ship library has been updated");
				break;
			default:
				$(".page_home .feed_item_"+(index+1)+" .colorbox").css("background", "#ccc");
				$(".page_home .feed_item_"+(index+1)+" .feed_text").html("<span style='font-size:12px;'>Unknown. To help, report that type "+data.api_type+" is "+data.api_message+"</span>");
				break;
		}
		
	}
};