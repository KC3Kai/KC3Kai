KC3.prototype.Ships  = {
	list: {},
	max: 100,
	
	get :function(id){
		if(typeof this.list["s"+id] != "undefined"){
			return this.list["s"+id];
		}
		return false;
	},
	
	count :function(){
		return Object.size(this.list);
	},
	
	clear :function(){
		this.list = {};
		this.save();
	},
	
	set :function(nlist){
		var ctr;
		for(ctr in nlist){
			if(!!nlist[ctr]){
				this.list["s"+nlist[ctr].api_id] = nlist[ctr];
			}
		}
		this.save();
	},
	
	remove :function(id){
		var ctr;
		for(ctr in this.list["s"+id].api_slot){
			if(this.list["s"+id].api_slot[ctr] > -1){
				app.Gears.remove( this.list["s"+id].api_slot[ctr], false);
			}
		}
		delete this.list["s"+id];
		this.save();
		app.Gears.save();
	},
	
	save :function(){
		localStorage.player_ships = JSON.stringify(this.list);
	},
	
	load :function(){
		if(typeof localStorage.player_ships != "undefined"){
			console.log("loading player ships");
			this.list = JSON.parse(localStorage.player_ships);
		}
	},
	
	/* Advanced Usage
	-------------------------------------------------------*/
	changeEquip :function(shipID, slotIndex, itemID){
		this.list["s"+shipID].api_slot[slotIndex] = itemID;
	},
	
	clearEquip :function(shipID, slotIndex){
		this.list["s"+shipID].api_slot.splice(slotIndex, 1);
		this.list["s"+shipID].api_slot[3] = -1;
	},
	
	clearEquips :function(shipID){
		this.list["s"+shipID].api_slot = [-1,-1,-1,-1,-1];
	},
};