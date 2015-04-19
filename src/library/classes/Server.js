KC3.prototype.Server = {
	num : 0,
	ip: "",
	name :"",
	
	init :function(url){
		if(this.ip != ""){ return false; }
		this.extractIP(url);
		this.getInfo();
	},
	
	initIP :function(ip){
		this.ip = ip;
		this.getInfo();
	},
	
	extractIP :function(url){
		var anchor = document.createElement("a");
		anchor.href = url;
		this.ip = anchor.host;
	},
	
	getInfo :function(){
		var ServerInfo = app.Meta.server( this.ip );
		this.num = ServerInfo.num;
		this.name = ServerInfo.name;
	}
	
};