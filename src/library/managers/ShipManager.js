/* ShipManager.js

Made in the advent of lib2, Needs Rewrite!
*/
(function(){
	"use strict";
	
	window.ShipManager = {
		list: {},
		
		// Add or replace a ship on the list
		add :function(data){
			this.list["x"+data.api_id] = new Ship(data);
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