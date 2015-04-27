KC3.prototype.Resources  = {
	
	init :function(){
		this.fcoin = 0;
		this.torch = 0;
		this.buckets = 0;
		this.devmats = 0;
		this.screws = 0;
	},
	
	set :function(data, stime){
		app.Logging.Resource(data, stime);
	},
	
	setFcoin :function(value){
		this.fcoin = value;
	},
	
	useitem :function(data, stime){
		this.torch = data.torch;
		this.buckets = data.buckets;
		this.devmats = data.devmats;
		this.screws = data.screws;
		app.Logging.Useitem(data, stime);
	}
	
};