KC3.prototype.Config  = {
	timerAlert: true,
	
	gambox_margin: "0px",
	background: "#def",
	tl_overlay: false,
	size: 100,
	
	rsc_interval: 3600,
	reveal_names: true,
	
	elos_mode: 3,
	
	theme_wide: "vertical",
	theme_narrow: "horizontal",
	
	init :function(){
		this.loadLocal();
	},
	
	scrollElosMode :function(){
		this.elos_mode++;
		if(this.elos_mode > 3){ this.elos_mode=1; }
		this.saveLocal();
	},
	
	/* Save/Load Local Storage
	-------------------------------------*/
	loadLocal :function(){
		if(typeof localStorage["config"] !== "undefined"){
			var tmpData = JSON.parse(localStorage["config"]);
			//
		}
	},
	
	saveLocal :function(){
		localStorage["config"] = JSON.stringify({
			//
		});
	}
};