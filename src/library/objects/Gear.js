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
	
	KC3Gear.prototype.fighterPower = function(capacity, applyVeterancy){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }
		
		// Check if veterancy request is defined
		if(typeof applyVeterancy == "undefined"){ applyVeterancy = false; }
		
		// Check if this object is a fighter plane
		// if( [6,7,8,11].indexOf( this.master().api_type[2] ) > -1){
		if( [6,7,8,11].indexOf( this.master().api_type[2] ) > -1){
			// Formula for each equipment
			var traditionalFP = this.master().api_tyku * Math.sqrt(capacity);
			
			if(applyVeterancy){
				var veteranPower = (this.ace==7?8:0) * Math.sqrt( this.master().api_tyku );
				return Math.floor(traditionalFP + veteranPower);
			}
			
			return traditionalFP;
		}
		
		// Equipment did not return on plane check, no fighter power
		return 0;
	};
	
	KC3Gear.prototype.supportPower = function(){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }
		
		// 1.5 TP + 2.0 DV
		return (1.5 * Number(this.master().api_raig) )
			+(2.0 * Number(this.master().api_baku) );
	};
	
})();