var TabHome = {
	active: false,
	cache_stats: {},
	
	init :function(){
		if(this.active) return false; this.active = true;
		app.Player.load();
	},
	
	show :function(){
		$(".page_home .hq_id .hq_content").html(app.Player.id);
		$(".page_home .hq_name .hq_content").html(app.Player.name);
		$(".page_home .hq_desc .hq_content").html(app.Player.desc);
		
		var MyServer = app.Meta.serverByNum(app.Player.server);
		$(".page_home .hq_server .hq_content").html(MyServer.name);
		
		$(".page_home .hq_rank .hq_content").html(app.Player.rank);
		$(".page_home .hq_level .hq_content").html(app.Player.level);
		
		this.cache_stats = JSON.parse(localStorage.player_statistics);
		$(".page_home .stat_sortie .stat_rate .stat_value").html(this.cache_stats.sortie.rate);
		$(".page_home .stat_sortie .stat_win .stat_value").html(this.cache_stats.sortie.win);
		$(".page_home .stat_sortie .stat_lose .stat_value").html(this.cache_stats.sortie.lose);
		
		$(".page_home .stat_pvp .stat_rate .stat_value").html(this.cache_stats.pvp.rate);
		$(".page_home .stat_pvp .stat_win .stat_value").html(this.cache_stats.pvp.win);
		$(".page_home .stat_pvp .stat_lose .stat_value").html(this.cache_stats.pvp.lose);
		$(".page_home .stat_pvp .stat_atk .stat_value").html(this.cache_stats.pvp.attacked);
		$(".page_home .stat_pvp .stat_atkwin .stat_value").html(this.cache_stats.pvp.attacked_win);
		
		$(".page_home .stat_exped .stat_rate .stat_value").html(this.cache_stats.exped.rate);
		$(".page_home .stat_exped .stat_success .stat_value").html(this.cache_stats.exped.success);
		$(".page_home .stat_exped .stat_total .stat_value").html(this.cache_stats.exped.total);
		
		var newfeed = JSON.parse(localStorage.player_newsfeed);
		this.showFeedItem( 0, newfeed[0] );
		this.showFeedItem( 1, newfeed[1] );
		this.showFeedItem( 2, newfeed[2] );
		this.showFeedItem( 3, newfeed[3] );
		this.showFeedItem( 4, newfeed[4] );
	},
	
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