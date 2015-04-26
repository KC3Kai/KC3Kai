KC3.prototype.Server = {
	lastUrl: "",
	num : 0,
	ip: "",
	name :"",
	
	/* Make sure all info are updated depending on last visited URL
	-------------------------------------------------------*/
	assureLatest :function(){
		this.extractIP(this.lastUrl);
		this.getInfo();
	},
	
	/* Manual Init via Server number
	-------------------------------------------------------*/
	setViaNumber :function(num){
		this.num = num;
		this.getInfo();
	},
	
	/* Extract IP address from a defined URL
	-------------------------------------------------------*/
	extractIP :function(url){
		var anchor = document.createElement("a");
		anchor.href = url;
		this.ip = anchor.host;
	},
	
	/* Get other server info based on known IP
	-------------------------------------------------------*/
	getInfo :function(){
		var ServerInfo = app.Meta.server( this.ip );
		this.num = ServerInfo.num;
		this.name = ServerInfo.name;
	}
	
};