/* QuestManager.js
KC3改 Quest Management Object

Stand-alone object, attached to root window, never to be instantiated
Contains functions to perform quest management tasks
Uses KC3Quest objects to play around with
*/
(function(){
	"use strict";
	
	console.log("KC3改 Quest Management loaded");
	
	window.KC3QuestManager = {
		list: {}, // Use curly brace instead of square bracket to avoid using number-based indexes
		open: [], // Array of quests seen on the quests page, regardless of state
		active: [], // Array of quests that are active and counting
		
		/* GET
		Get a specific quest object in the list using its ID
		------------------------------------------*/
		get :function( questId ){
			try {
				// Return requested quest object of that ID
				return this.list["q"+questId];
				
			}catch(e){ console.error(e); }
		},
		
		/* DEFINE PAGE
		When a user loads a quest page, we use its data to update our list
		------------------------------------------*/
		definePage :function( questList ){
			// For each element in quest List
			for(var ctr in questList){
				// Get that quest object and re-define its data contents
				this.get( questList[ctr].api_no ).defineRaw( questList[ctr] );
			}
		},
		
		
		/* SAVE
		Write current quest data to localStorage
		------------------------------------------*/
		save :function(){
			try {
				
				localStorage.player_quests = JSON.stringify({
					active: this.active,
					open: this.open,
					list: this.list
				});
				
			}catch(e){ console.error(e); }
		},
		
		/* LOAD
		Read and refill list from localStorage
		------------------------------------------*/
		load :function(){
			if(typeof localStorage.player_quests != "undefined"){
				var quests = JSON.parse(localStorage.player_quests);
				this.active = quests.active;
				this.open = quests.open;
				this.list = quests.list;
				return true;
			}else{
				this.active = [];
				this.open = [];
				this.list = {};
				return false;
			}
		}
	};
	
})();