/*
TabItems.js
By: dragonjet
*/

var TabItems = {
	active: false,
	_compile: [],
	_items: [],
	
	/* onReady, initialize
	--------------------------------------------*/
	init :function(){
		if(this.active) return false; this.active = true;
		
		var tempItems, ctr, ThisItem, MasterItem;
		
		// Compile all Master Items
		for(ctr in master.slotitem){
			if(typeof master.slotitem[ctr] !== "undefined"){
				ThisItem = master.slotitem[ctr];
				if(ThisItem.api_id < 500){ 
					this._compile[ ThisItem.api_id ] = {
						id: ThisItem.api_id,
						name: ThisItem.english,
						jp : ThisItem.api_name,
						icon : ThisItem.api_type[3],
						count: 0,
						ships: [],
					};
				}
			}
		}
		// console.log(this._compile);
		
		// Compile items on Index
		tempItems = JSON.parse(localStorage.user_items);
		for(ctr in tempItems){
			ThisItem = tempItems[ctr];
			this._items[ ThisItem.api_id ] = {
				id: ThisItem.api_id,
				slotitem_id: ThisItem.api_slotitem_id,
				holder: false,
			};
		}
		delete tempItems;
		console.log(this._items);
		
		/*for(ctr in tempItems){
			ThisItem = tempItems[ctr];
			this._compile[ ThisItem.api_slotitem_id ].count ++;
		}
		delete tempItems;
		
		// Compile ships on Index
		tempItems = JSON.parse(localStorage["user_ships"]);
		for(ctr in tempItems){
			ThisShip = tempItems[ctr];
			if(ThisShip){
				if(ThisShip.api_slot[0]>-1){  }
			}
		}*/
	},
	
	/* Show the page
	--------------------------------------------*/
	show :function(){
		// console.log(this._compile);
	},
	
	dummy:""
};