KC3.prototype.Player  = {
	
	init :function(){
		this.server = "";
		this.id = 0;
		this.name = "";
		this.desc = "";
		this.rank = "";
		this.level = 0;
		this.exp = [0,0];
	},
	
	/* Make sure player is initialized
	-------------------------------------------------------*/
	login :function(data){
		// If first time during this session
		if(this.id == 0){
			// Set static player info
			this.id =  data.mid;
			this.name =  data.name;
			
			// Make sure server info is updated
			app.Server.assureLatest();
			this.server = app.Server.num;
			
			// Make sure localDatabase is updated
			app.Logging.index = this.id;
			app.Logging.Player({
				server: app.Server.num,
				mid: this.id,
				name: this.name
			});
		}
	},
	
	/* When player suddely changed, logout previous player
	-------------------------------------------------------*/
	logout :function(){
		console.log('logging out');
		
		// Remove all remembered player info
		localStorage.removeItem("player");
		localStorage.removeItem("player_fleets");
		localStorage.removeItem("player_ships");
		localStorage.removeItem("player_gears");
		localStorage.removeItem("player_maps");
		localStorage.removeItem("player_statistics");
		localStorage.removeItem("player_newsfeed");
		localStorage.removeItem("player_quests");
		localStorage.removeItem("lastResource");
		localStorage.removeItem("lastUseitem");
		
		// Reset all player object properties to default
		this.init();
		app.Ships.clear();
		app.Gears.clear();
		app.Resources.init();
		app.Docks.init();
	},
	
	/* Set new basic player data
	-------------------------------------------------------*/
	set :function(data){
		// Check if player suddenly changed
		if(this.id != 0 && this.id != data.mid){
			this.logout();
		}
		
		// Make sure player is logged-in on KC3
		this.login(data);
		
		// Set new player dynamic data
		this.desc = data.desc;
		this.rank = app.Meta.rank(data.rank);
		this.level = data.level;
		if(typeof data.fcoin != "undefined"){ this.fcoin = data.fcoin; }
		
		// Computer level and experience values
		var ExpCurrLevel = app.Meta.exp( this.level )[1];
		var ExpNextLevel = app.Meta.exp( this.level+1 )[1];
		var exp_percent = (data.exp - ExpCurrLevel) / (ExpNextLevel - ExpCurrLevel);
		var exp_next = ExpNextLevel - data.exp;
		this.exp = [ exp_percent, exp_next ];
		
		// Remember last player
		this.save();
	},
	
	/* Set player statistics
	-------------------------------------------------------*/
	statistics :function(data){
		// Initialize record object
		var statistics = { exped: { rate: "?", total: "?", success: "?" }, pvp: { rate: "?", win: "?", lose: "?", attacked: "?", attacked_win: "?" }, sortie: { rate: "?", win: "?", lose: "?" } };
		
		// If old statistics exist
		if(typeof localStorage.player_statistics != "undefined"){
			statistics = JSON.parse(localStorage.player_statistics);
		}
		
		// Common always-present stats
		statistics.exped.total = data.exped.total;
		statistics.exped.success = data.exped.success;
		statistics.pvp.win = data.pvp.win;
		statistics.pvp.lose = data.pvp.lose;
		statistics.sortie.win = data.sortie.win;
		statistics.sortie.lose = data.sortie.lose;
		
		// api_port Optionals
		if(data.sortie.rate !== false){
			statistics.sortie.rate = (data.sortie.rate*100)+"%";
		}
		if(data.pvp.rate !== false){
			statistics.pvp.rate = data.pvp.rate+"%";
		}
		if(data.exped.rate !== false){
			statistics.exped.rate = data.exped.rate+"%";
		}
		
		// record_basic Optionals
		if(data.pvp.attacked !== false){
			statistics.pvp.attacked = data.pvp.attacked;
		}
		if(data.pvp.attacked_win !== false){
			statistics.pvp.attacked_win = data.pvp.attacked_win;
		}
		
		// Save to local
		localStorage.player_statistics = JSON.stringify(statistics);
	},
	
	/* Set player newsfeed
	-------------------------------------------------------*/
	newsfeed :function(data){
		localStorage.player_newsfeed = JSON.stringify(data);
	},
	
	/* Load data from localStorage
	-------------------------------------------------------*/
	load :function(){
		if(typeof localStorage.player != "undefined"){
			var player = JSON.parse(localStorage.player);
			this.login(player);
			this.desc = player.desc;
			this.rank = player.rank;
			this.server = player.server;
			this.level = player.level;
			return true;
		}else{
			return false;
		}
	},
	
	/* Remember data to localStorage
	-------------------------------------------------------*/
	save: function(){
		localStorage.player = JSON.stringify({
			server	: this.server,
			mid		: this.id,
			name	: this.name,
			desc	: this.desc,
			rank	: this.rank,
			level	: this.level
		});
	}
	
};