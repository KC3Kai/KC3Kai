/* Gear.js
KC3改 Equipment Object
*/
(function(){
	"use strict";
	
	window.KC3Gear = function( data ){
		// Default object properties incuded in stringifications
		this.itemId = 0;
		this.masterId = 0;
		this.stars = 0;
		this.lock = 0;
		this.ace = -1;
		
		// If specified with data, fill this object
		if(typeof data != "undefined"){
			// Initialized with raw data
			if(typeof data.api_id != "undefined"){
				this.itemId = data.api_id;
				this.masterId = data.api_slotitem_id;
				this.stars = data.api_level;
				this.lock = data.api_locked;
				
				// Plane Ace mechanism
				if(typeof data.api_alv != "undefined"){
					this.ace = data.api_alv;
				}
				
			// Initialized with formatted data
			}else{
				$.extend(this, data);
			}
		}
	};
	
	KC3Gear.prototype.master = function(){ return KC3Master.slotitem( this.masterId ); };
	KC3Gear.prototype.name = function(){ return KC3Meta.gearName( this.master().api_name ); };
	
	/* FIGHTER POWER
	Get fighter power of this equipment on a slot
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterPower = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }
		
		// Check if this object is a fighter plane
		if( [6,7,8,11,45].indexOf( this.master().api_type[2] ) > -1){
			return Math.floor( Math.sqrt(capacity) * this.master().api_tyku );
		}
		
		// Equipment did not return on plane check, no fighter power
		return 0;
	};
	
	/* FIGHTER POWER: VETERAN
	Get fighter power of this equipment
	with added whole number proficiency bonus
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterVeteran = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }
		
		// Check if this object is a fighter plane
		if( [6,7,8,11,45].indexOf( this.master().api_type[2] ) > -1){
			var typInd = String( this.master().api_type[2] );

			if (typeof ConfigManager.air_average[typInd] == 'undefined') {
				ConfigManager.resetValueOf('air_average');
			}
			var airAverageTable = ConfigManager.air_average[typInd];

			var veteranBonus;
			if(this.ace==-1){
				veteranBonus = airAverageTable[ 0 ];
			}else{
				veteranBonus = airAverageTable[ this.ace ];
			}
			return Math.floor( Math.sqrt(capacity) * this.master().api_tyku + veteranBonus );
		}
		
		// Equipment did not return on plane check, no fighter power
		return 0;
	};
	
	/* FIGHTER POWER: VETERAN withBOUNDS
	Get fighter power of this equipment
	as an array with lower and upper bound bonuses
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterBounds = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return [0,0]; }
		
		// Check if this object is a fighter plane
		if( [6,7,8,11,45].indexOf( this.master().api_type[2] ) > -1){
			// console.log("this.ace", this.ace);
			
			var typInd = String( this.master().api_type[2] );
			if (typeof ConfigManager.air_bounds[typInd] == 'undefined') {
				ConfigManager.resetValueOf('air_bounds');
			}
			var airBoundTable = ConfigManager.air_bounds[typInd];
			var veteranBounds;
			if(this.ace==-1){
				veteranBounds = airBoundTable[ 0 ];
			}else{
				veteranBounds = airBoundTable[ this.ace ];
			}
			
			// console.log("ConfigManager.air_bounds",ConfigManager.air_bounds);
			// console.log("veteranBounds", veteranBounds);
			return [
				Math.floor( Math.sqrt(capacity) * this.master().api_tyku + veteranBounds[0] ),
				Math.floor( Math.sqrt(capacity) * this.master().api_tyku + veteranBounds[1] ),
			];
		}
		
		// Equipment did not return on plane check, no fighter power
		return [0,0];
	};
	
	KC3Gear.prototype.supportPower = function(){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }
		
		// 1.5 TP + 2.0 DV
		return (1.5 * Number(this.master().api_raig) )
			+(2.0 * Number(this.master().api_baku) );
	};
	
})();
