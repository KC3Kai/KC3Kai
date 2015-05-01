KC3.prototype.Config  = {
	timerAlert: true,
	
	gambox_margin: "0px",
	background: "#def",
	tl_overlay: true,
	size: 100,
	time_dev: 45,
	rsc_interval: 3600,
	reveal_names: true,
	
	elos_mode: 3,
	
	init :function(){
		this.load();
	},
	
	scrollElosMode :function(){
		this.elos_mode++;
		if(this.elos_mode > 3){ this.elos_mode=1; }
		this.save();
	},
	
	/* Save/Load Local Storage
	-------------------------------------*/
	load :function(){
		if(typeof localStorage.config !== "undefined"){
			var tmpData = JSON.parse(localStorage.config);
			this.loadField(tmpData, "timerAlert");
			this.loadField(tmpData, "gambox_margin");
			this.loadField(tmpData, "background");
			this.loadField(tmpData, "tl_overlay");
			this.loadField(tmpData, "size");
			this.loadField(tmpData, "time_dev");
			this.loadField(tmpData, "rsc_interval");
			this.loadField(tmpData, "reveal_names");
			this.loadField(tmpData, "elos_mode");
		}
	},
	
	loadField :function(data, fieldname){
		// console.log(fieldname+" on localStorage = "+data[fieldname]);
		if(typeof data[fieldname] != "undefined"){
			this[fieldname] = data[fieldname];
		}else{
			// console.log(fieldname+" not in local. using default value: "+this[fieldname]);
		}
	},
	
	save :function(){
		localStorage.config = JSON.stringify({
			timerAlert 		: this.timerAlert,
			gambox_margin 	: this.gambox_margin,
			background 		: this.background,
			tl_overlay 		: this.tl_overlay,
			size 			: this.size,
			time_dev 		: this.time_dev,
			rsc_interval 	: this.rsc_interval,
			reveal_names 	: this.reveal_names,
			elos_mode 		: this.elos_mode
		});
	}
};