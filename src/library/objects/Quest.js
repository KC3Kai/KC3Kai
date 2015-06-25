/* Quest.js
KC3改 Quest Class

Instantiatable class to represent a single Quest
Mainly used by QuestManager to store quest information
*/
(function(){
	"use strict";
	
	window.KC3Quest = function(){
		this.id = 0;
		this.type = 0;
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
		
		// Attach temporary raw data for quick reference
		this.raw = function(){ return data; };
	};
	
	/* OUTPUT SHORT
	Return tracking text to be shown on Strategy Room
	------------------------------------------*/
	KC3Quest.prototype.outputShort = function(){
		if(this.tracking){
			var trackingText = [];
			var ctr;
			for(ctr in this.tracking){
				trackingText.push(this.tracking[ctr][0]+"/"+this.tracking[ctr][1]);
			}
			return trackingText.join(", ");
		}
		return "";
	};
	
	/* OUTPUT HTML
	Return tracking text to be shown on Strategy Room
	------------------------------------------*/
	KC3Quest.prototype.outputHtml = function(){
		if(this.tracking){
			var trackingText = [];
			var ctr;
			for(ctr in this.tracking){
				trackingText.push(this.tracking[ctr][0]+"/"+this.tracking[ctr][1]);
			}
			return trackingText.join("<br />");
		}
		return "";
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
			var MyMeta = KC3Meta.quest( this.id );
			
			// If we have meta for this quest
			if(MyMeta){
				// Attach meta info to this object 
				this.meta = function(){ return {
					code : MyMeta.code,
					name : MyMeta.name,
					desc : MyMeta.desc
				}};
				// If tracking is empty and Meta is defined
				if(this.tracking === false){
					this.tracking = MyMeta.tracking;
				}
			}
		}
	};
	
	
	
})();