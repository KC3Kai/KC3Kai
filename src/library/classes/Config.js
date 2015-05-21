KC3.prototype.Config  = {
	
	init :function(){
		// Set Defaults
		this.version = 5;
		this.timerAlert = 1;
		this.gambox_margin = 0;
		this.background = "#def";
		this.background_panel = "#def";
		this.background_align_h = "left";
		this.background_align_v = "top";
		this.tl_overlay = false;
		this.size = 100;
		this.time_dev = 45;
		this.rsc_interval = 3600;
		this.reveal_names = true;
		this.elos_mode = 3;
		this.alert_volume = 60;
		this.desktop_notif = true;
		this.ss_mode = 0;
		this.customsound = "";
		this.showCraft = true;
		this.showCompass = false;
		this.predictBattle = false;
		this.panelAlpha = 100;
		this.askExit = 1;
		// Load existing user config
		this.load();
	},
	
	/* Toggle Equipment LoS
	-------------------------------------*/
	scrollElosMode :function(){
		this.load();
		this.elos_mode++;
		if(this.elos_mode > 3){ this.elos_mode=1; }
		this.save();
	},
	
	/* Restore Defaults
	-------------------------------------*/
	clear :function(){
		localStorage.removeItem("config");
		this.init();
		this.save();
	},
	
	/* Save/Load Local Storage
	-------------------------------------*/
	load :function(){
		if(typeof localStorage.config !== "undefined"){
			var tmpData = JSON.parse(localStorage.config);
			
			if(typeof tmpData.version !== "undefined"){
				if(tmpData.version != this.version){
					this.clear();
				}
			}else{
				this.clear();
			}
			
			this.loadField(tmpData, "version");
			this.loadField(tmpData, "timerAlert");
			this.loadField(tmpData, "gambox_margin");
			this.loadField(tmpData, "background");
			this.loadField(tmpData, "background_panel");
			this.loadField(tmpData, "background_align_h");
			this.loadField(tmpData, "background_align_v");
			this.loadField(tmpData, "tl_overlay");
			this.loadField(tmpData, "size");
			this.loadField(tmpData, "time_dev");
			this.loadField(tmpData, "rsc_interval");
			this.loadField(tmpData, "reveal_names");
			this.loadField(tmpData, "elos_mode");
			this.loadField(tmpData, "alert_volume");
			this.loadField(tmpData, "desktop_notif");
			this.loadField(tmpData, "ss_mode");
			this.loadField(tmpData, "customsound");
			this.loadField(tmpData, "showCraft");
			this.loadField(tmpData, "showCompass");
			this.loadField(tmpData, "predictBattle");
			this.loadField(tmpData, "panelAlpha");
			this.loadField(tmpData, "askExit");
		}
	},
	
	loadField :function(data, fieldname){
		if(typeof data[fieldname] != "undefined"){
			this[fieldname] = data[fieldname];
		}
	},
	
	save :function(){
		localStorage.config = JSON.stringify({
			version 			: this.version,
			timerAlert 			: this.timerAlert,
			gambox_margin 		: this.gambox_margin,
			background 			: this.background,
			background_panel	: this.background_panel,
			background_align_h	: this.background_align_h,
			background_align_v	: this.background_align_v,
			tl_overlay 			: this.tl_overlay,
			size 				: this.size,
			time_dev 			: this.time_dev,
			rsc_interval 		: this.rsc_interval,
			reveal_names 		: this.reveal_names,
			elos_mode 			: this.elos_mode,
			alert_volume 		: this.alert_volume,
			desktop_notif 		: this.desktop_notif,
			ss_mode 			: this.ss_mode,
			customsound 		: this.customsound,
			showCraft 			: this.showCraft,
			showCompass 		: this.showCompass,
			predictBattle 		: this.predictBattle,
			panelAlpha 			: this.panelAlpha,
			askExit 			: this.askExit
		});
	}
};