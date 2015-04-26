/*
TabFleets.js
By: dragonjet

List all fleets and ship infos
*/

var TabFleets = {
	active: false,
	fleets: [],
	
	/* onReady, initialize
	--------------------------------------------*/
	init :function(){
		if(this.active) return false; this.active = true;
		this.fleets = JSON.parse(localStorage.player_fleets);
	},
	
	/* Show the page
	--------------------------------------------*/
	show :function(){
		console.log(this.fleets);
	},
	
	dummy:""
};