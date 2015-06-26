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
			// Return requested quest object of that ID, or a new Quest object, whichever works
			return (this.list["q"+questId] || (this.list["q"+questId] = new KC3Quest()));
		},
		
		/* GET ACTIVE
		Get list of active quests
		------------------------------------------*/
		getActives :function(){
			var activeQuestObjects = [];
			var self = this;
			$.each(this.active, function( index, element ){
				activeQuestObjects.push( self.get(element) );
			});
			return activeQuestObjects;
		},
		
		/* DEFINE PAGE
		When a user loads a quest page, we use its data to update our list
		------------------------------------------*/
		definePage :function( questList, questPage ){
			// For each element in quest List
			for(var ctr in questList){
				// Get that quest object and re-define its data contents
				this.get( questList[ctr].api_no ).defineRaw( questList[ctr] );
				
				// Add to actives or opens depeding on status
				switch( questList[ctr].api_state ){
					case 1:
						this.isOpen( questList[ctr].api_no, true );
						this.isActive( questList[ctr].api_no, false );
						break;
					case 2:
						this.isOpen( questList[ctr].api_no, true );
						this.isActive( questList[ctr].api_no, true );
						break;
					case 3:
						this.isOpen( questList[ctr].api_no, false );
						this.isActive( questList[ctr].api_no, false );
						break;
					default:
						this.isOpen( questList[ctr].api_no, false );
						this.isActive( questList[ctr].api_no, false );
						break;
				}
			}
			this.save();
		},
		
		/* IS OPEN
		Defines a questId as open, adds to list
		------------------------------------------*/
		isOpen :function(questId, mode){
			if(mode){
				if(this.open.indexOf(questId) == -1){
					this.open.push(questId);
				}
			}else{
				if(this.open.indexOf(questId) > -1){
					this.open.splice(this.open.indexOf(questId), 1);
				}
			}
		},
		
		/* IS ACTIVE
		Defines a questId as active, adds to list
		------------------------------------------*/
		isActive :function(questId, mode){
			if(mode){
				if(this.active.indexOf(questId) == -1){
					this.active.push(questId);
				}
			}else{
				if(this.active.indexOf(questId) > -1){
					this.active.splice(this.active.indexOf(questId), 1);
				}
			}
		},
		
		/* SAVE
		Write current quest data to localStorage
		------------------------------------------*/
		save :function(){
			// Store only the list. The actives and opens will be redefined on load()
			localStorage.player_quests = JSON.stringify(this.list);
		},
		
		/* LOAD
		Read and refill list from localStorage
		------------------------------------------*/
		load :function(){
			if(typeof localStorage.player_quests != "undefined"){
				var tempQuests = JSON.parse(localStorage.player_quests);
				var tempQuest;
				
				// Empty actives and opens since they will be re-added
				this.active = [];
				this.open = [];
				
				for(var ctr in tempQuests){
					tempQuest = tempQuests[ctr];
					
					// Add to actives or opens depeding on status
					if(tempQuest.status==1 || tempQuest.status==2){
						
					}
					switch( tempQuest.status ){
						case 1:
							this.isOpen( tempQuest.id, true );
							this.isActive( tempQuest.id, false );
							break;
						case 2:
							this.isOpen( tempQuest.id, true );
							this.isActive( tempQuest.id, true );
							break;
						case 3:
							this.isOpen( tempQuest.id, false );
							this.isActive( tempQuest.id, false );
							break;
						default:
							this.isOpen( tempQuest.id, false );
							this.isActive( tempQuest.id, false );
							break;
					}
					
					// Add to manager's main list using Quest object
					this.list["q"+tempQuest.id] = new KC3Quest();
					this.list["q"+tempQuest.id].define( tempQuest );
				}
				return true;
			}
			return false;
		}
	};
	
})();