/* Quest.js
KC3改 Quest Class

Instantiatable class to represent a single Quest
Mainly used by QuestManager to store quest information
*/
(function(){
	"use strict";
	
	window.KC3Quest = function(){
		this.id = 0;
		this.status = 0;
		this.tracking = false;
	};
	
	/* DEFINE
	Fill object with already-formatted quest data
	------------------------------------------*/
	KC3Quest.prototype.define = function( data ){
		this.id = data.id;
		this.status = data.status;
		this.tracking = data.tracking;
		this.attachMeta();
	};
	
	/* DEFINE RAW
	Fill object with quest data from Raw API response
	------------------------------------------*/
	KC3Quest.prototype.defineRaw = function( data ){
		this.id = data.api_no;
		this.status = data.api_state;
		this.attachMeta();
	};
	
	/* ATTACH META
	Add reference to its Meta data from the built-in JSON files
	this.meta assigned as function to avoid being included in JSON.stringify
	Define tracking from meta if current object's is empty
	------------------------------------------*/
	KC3Quest.prototype.attachMeta = function(){
		// If this object doesn't have meta yet
		if(typeof this.meta == "undefined"){
			// Get data from Meta Manager
			var MyMeta = app.Meta.quest( this.id );
			
			// Attach meta info to this object 
			this.meta = function(){ return{
				code : MyMeta.code,
				name : MyMeta.name,
				desc : MyMeta.desc
			}};
			
			// If tracking is empty and Meta is defined
			if(this.tracking === false && (temp.tracking || false)){
				this.tracking = MyMeta.tracking;
			}
		}
	};
	
	
	
})();