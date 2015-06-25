/* Ship.js
KC3改 Ship Object

*/
(function(){
	"use strict";
	
	/* CONSTRUCTOR
	Initialize ship data
	--------------------------------------------------------------*/
	window.KC3Ship = function( data ){
		// Raw Data from API
		if(typeof data.api_id != "undefined"){
			this.rosterId = rawData.api_id;
			this.masterId = rawData.api_ship_id;
			
		// Already-formatted Data from storage
		}else{
			this.loadField(data, "rosterId");
			this.loadField(data, "masterId");
		}
	}
	
	
	/* LOAD FIELD
	Initialize single ship attribute using already-formatted data
	--------------------------------------------------------------*/
	KC3Ship.prototype.loadField = function( data, fieldName ){
		// Put the attribute value from source into this ship object
		this[fieldName] = data[fieldName];
	}
	
	KC3Ship.prototype.countDrums = function(){
		
	};
	
	/* STATS FULL
	Get all stats "with" equipment
	--------------------------------------------------------------*/
	KC3Ship.prototype.statsFull = function(){
		
	}
	
	/* STATS BASE
	Get all stats "without" equipment
	--------------------------------------------------------------*/
	KC3Ship.prototype.statsBase = function(){
		
	}
	
})();