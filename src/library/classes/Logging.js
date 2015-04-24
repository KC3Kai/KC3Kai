KC3.prototype.Logging  = {
	database :{},
	index :"",
	
	lastResource: 0,
	lastUseitem: 0,
	
	/* [Initialize] Connect to IndexedDB
	--------------------------------------------*/
	init: function(){
		this.database = new Dexie("KC3");
		this.database.version(3).stores({
			account: "++id,&hq,server,mid,name",
			build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
			lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
			sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2",
			battle: "++id,hq,sortie_id,node,data,yasen,rating,drop,time",
			resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,time",
			useitem: "++id,hq,torch,screw,bucket,devmat,time",
		});
		this.database.open();
	},
	
	/* [Reset] Delete the IndexedDB
	--------------------------------------------*/
	reset :function(){
		this.database.delete().then(function(){ console.log("RESET"); });
	},
	
	/* Account Information
	--------------------------------------------*/
	Player :function(data){
		var self = this;
		// check if account exists
		this.database.account
			.where("hq")
			.equals(this.index)
			.count(function(NumRecords){
				if(NumRecords == 0){
					// insert if not yet on db
					self.database.account.add({
						hq: self.index,
						server: data.server,
						mid: parseInt(data.mid, 10),
						name: data.name
					});
				}
			});
	},
	
	Build :function(data){
		data.hq = this.index;
		this.database.build.add(data);
	},
	
	LSC :function(data){
		data.hq = this.index;
		this.database.lsc.add(data);
	},
	
	Sortie :function(data, callback){
		data.hq = this.index;
		this.database.sortie.add(data).then(callback);
	},
	
	Battle :function(data){
		data.hq = this.index;
		this.database.battle.add(data);
	},
	
	Resource :function(data){
		if(this.lastResource == 0){
			if(typeof localStorage["lastResource"] != "undefined"){
				this.lastResource = localStorage["lastResource"];
			}
		}
		
		var TimeNow = parseInt(new Date().getTime(), 10);
		
		if(this.lastResource > 0){
			var MinDiff = parseInt(app.Config.rsc_interval, 10) * 1000;
			if( (TimeNow - MinDiff) < this.lastResource ){
				return false;
			}
		}
		
		this.lastResource = TimeNow;
		localStorage["lastResource"] = TimeNow;
		
		this.database.resource.add({
			hq : this.index,
			rsc1 : data[0],
			rsc2 : data[1],
			rsc3 : data[2],
			rsc4 : data[3],
			time : TimeNow
		});
	},
	
	Useitem :function(data){
		if(this.lastUseitem == 0){
			if(typeof localStorage["lastUseitem"] != "undefined"){
				this.lastUseitem = localStorage["lastUseitem"];
			}
		}
		
		var TimeNow = parseInt(new Date().getTime(), 10);
		
		if(this.lastUseitem > 0){
			var MinDiff = parseInt(app.Config.rsc_interval, 10) * 1000;
			if( (TimeNow - MinDiff) < this.lastUseitem ){
				return false;
			}
		}
		
		this.lastUseitem = TimeNow;
		localStorage["lastUseitem"] = TimeNow;
		
		this.database.useitem.add({
			hq : this.index,
			torch : data.torch,
			screw : data.screws,
			bucket : data.buckets,
			devmat : data.devmats,
			time : TimeNow
		});
	},
	
	/* [GET] Retrive logs from Local DB
	--------------------------------------------*/
	get_build :function(){
		
	},
	
	get_lsc :function(){
		
	},
	
	get_drop :function(){
		
	},
	
	get_sortie :function(){
		
	},
	
	get_battle :function(){
		
	},
	
	get_resource :function(callback){
		var self  = this;
		
		this.database.transaction("rw", this.database.resource, function(){
			console.log(self.index);
			self.database.resource
				// .where("hq").equals(self.index)
				.orderBy("id").reverse().limit(14)
				.toArray(callback);
		}).catch(function(error){ console.error(error); });
	}
};