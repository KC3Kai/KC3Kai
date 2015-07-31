/* GearManager.js
KC3改 Equipment Manager

Manages player equipment which indexes for data access.
Saves and loads list to and from localStorage
*/
(function(){
	"use strict";
	
	window.KC3GearManager = {
		list: {},
		max: 400,
		pendingGearNum: 0,

		// Get a specific item by ID
		get :function( itemId ){
			// console.log("getting ship", rosterId, this.list["x"+rosterId]);
			return this.list["x"+itemId] || (new KC3Gear());
		},
		
		// Count number of items
		count :function(){
			return Object.size(this.list) + this.pendingGearNum;
		},
		
		// Count number of equipment by master item
		countByMasterId :function(slotitem_id){
			var returnCount = 0;
			for(var ctr in this.list){
				if(this.list[ctr].masterId == slotitem_id){
					returnCount++;
				}
			}
			return returnCount;
		},
		
		// Add or replace an item on the list
		add :function(data){
			if(typeof data.api_id != "undefined"){
				this.list["x"+data.api_id] = new KC3Gear(data);
			}else if(typeof data.itemId != "undefined"){
				this.list["x"+data.itemId] = new KC3Gear(data);
			}
		},
		
		// Mass set multiple items
		set :function(data){
			var ctr;
			for(ctr in data){
				if(!!data[ctr]){
					this.add(data[ctr]);
				}
			}
			this.save();
		},
		
		// Remove item from the list
		remove :function( itemId ){
			delete this.list["x"+itemId];
		},
		
		// Show JSON string of the list for debugging purposes
		json: function(){
			console.log(JSON.stringify(this.list));
		},
		
		// Save item list onto local storage
		clear: function(){
			this.list = {};
		},
		
		// Save item list onto local storage
		save: function(){
			localStorage.gears = JSON.stringify(this.list);
		},
		
		// Load from storage and add each one to manager list
		load: function(){
			if(typeof localStorage.gears != "undefined"){
				this.clear();
				var GearList = JSON.parse(localStorage.gears);
				for(var ctr in GearList){
					this.add( GearList[ctr] );
				}
				return true;
			}
			return false;
		}
		
	};
	
})();