/* ShipManager.js

Made in the advent of lib2, Needs Rewrite!
*/
(function(){
	"use strict";
	
	window.KC3ShipManager = {
		list: {},
		max: 100,
		
		// Get a specific ship by ID
		get :function( rosterId ){
			// console.log("getting ship", rosterId, this.list["x"+rosterId]);
			return this.list["x"+rosterId] || (new KC3Ship());
		},
		
		// Count number of ships
		count :function(){
			return Object.size(this.list);
		},
		
		// Add or replace a ship on the list
		add :function(data){
			if(typeof data.api_id != "undefined"){
				this.list["x"+data.api_id] = new KC3Ship(data);
			}else if(typeof data.rosterId != "undefined"){
				this.list["x"+data.rosterId] = new KC3Ship(data);
			}
		},
		
		// Mass set multiple ships
		set :function(data){
			var ctr;
			for(ctr in data){
				if(!!data[ctr]){
					this.add(data[ctr]);
				}
			}
			this.save();
		},
		
		// Show JSON string of the list for debugging purposes
		json: function(){
			console.log(JSON.stringify(this.list));
		},
		
		// Save ship list onto local storage
		clear: function(){
			this.list = {};
		},
		
		// Save ship list onto local storage
		save: function(){
			localStorage.ships = JSON.stringify(this.list);
		},
		
		// Load from storage and add each one to manager list
		load: function(){
			this.clear();
			var ShipList = JSON.parse(localStorage.ships);
			for(var ctr in ShipList){
				this.add( ShipList[ctr] );
			}
		}
		
	};
	
})();