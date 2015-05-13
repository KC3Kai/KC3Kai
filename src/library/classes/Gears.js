KC3.prototype.Gears  = {
	list: {},
	max: 500,
	
	get :function(id){
		if(typeof this.list["g"+id] != "undefined"){
			return this.list["g"+id];
		}
		return false;
	},
	
	count :function(){
		return Object.size(this.list);
	},
	
	countByType :function(slotitem_id){
		var returnCount = 0;
		var ctr = 0;
		for(ctr in this.list){
			if(this.list[ctr].api_slotitem_id == slotitem_id){
				returnCount++;
			}
		}
		return returnCount;
	},
	
	clear :function(){
		this.list = {};
		this.save();
	},
	
	set :function(nlist){
		var ctr;
		for(ctr in nlist){
			if(!!nlist[ctr]){
				this.list["g"+nlist[ctr].api_id] = nlist[ctr];
			}
		}
		this.save();
	},
	
	remove :function(ids, save){
		if(typeof ids != "object"){ ids = [ids]; }
		var ctr;
		for(ctr in ids){
			delete this.list["g"+ids[ctr]];
		}
		if(typeof save != "undefined"){
			if(save){
				this.save();
			}
		}else{
			this.save();
		}
	},
	
	save :function(){
		localStorage.player_gears = JSON.stringify(this.list);
	},
	
	load :function(){
		if(typeof localStorage.player_gears != "undefined"){
			this.list = JSON.parse(localStorage.player_gears);
			return true;
		}else{
			return false;
		}
	}
};