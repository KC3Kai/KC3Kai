/* Quest.js
KC3改 Quest Class

Instantiatable class to represent a single Quest
Mainly used by QuestManager to store quest information

Quest Type:
1 = One time
2 = Daily
3 = Weekly
4 = Sink 3 Aircraft Carrier (only on dates ending in -3rd, -7th, or -0th) Bd4
5 = Sink Transport Fleet (only on dates ending in -2nd or -8th} Bd6
6 = Monthly
*/
(function(){
	"use strict";
	
	window.KC3Quest = function(){
		this.id = 0;
		this.type = 0;
		this.status = 0;
		this.progress = 0;
		this.tracking = false;
	};
	
	/* DEFINE
	Fill object with already-formatted quest data
	------------------------------------------*/
	KC3Quest.prototype.define = function( data ){
		this.id = data.id;
		this.status = data.status;
		this.type = data.type;
		if (data.progress) {
			this.progress = data.progress;
		} else {
			this.progress =  0;
		}
		if (!this.tracking) {
			this.tracking = data.tracking;
		}
		this.attachMeta();
	};
	
	/* DEFINE RAW
	Fill object with quest data from Raw API response
	------------------------------------------*/
	KC3Quest.prototype.defineRaw = function( data ){
		this.id = data.api_no;
		this.status = data.api_state;
		this.type = data.api_type;
		this.progress = data.api_progress_flag;
		this.attachMeta();
		
		// Attach temporary raw data for quick reference
		this.raw = function(){ return data; };
	};
	
	/* OUTPUT SHORT
	Return tracking text to be shown on Panel
	------------------------------------------*/
	KC3Quest.prototype.outputShort = function(showAll){
		if (typeof showAll == "undefined") {
			showAll = false;
		}
		if(this.tracking){
			var trackingText = [];
			var ctr;
			var textToShow = "";
			for(ctr in this.tracking){
				textToShow = this.tracking[ctr][0]+"/"+this.tracking[ctr][1];
				trackingText.push(textToShow);
				if (!showAll && (this.tracking[ctr][0] < this.tracking[ctr][1])) {
					return textToShow;
				}
			}
			if (!showAll) {
				return textToShow;
			} else {
				return trackingText.join(String.fromCharCode(13));
			}
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
	
	/* INCREMENT
	Add one to tracking progress
	------------------------------------------*/
	KC3Quest.prototype.increment = function(reqNum, amount){
		if(this.tracking && this.status==2){    //2 = On progress
			if(typeof reqNum == "undefined"){ reqNum=0; }
			if(typeof amount == "undefined"){ amount=1; }
			if (this.tracking[reqNum][0] + amount <= this.tracking[reqNum][1]) {
				this.tracking[reqNum][0] += amount;
			}
			KC3QuestManager.save();
		}
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
					available: true,
					code : MyMeta.code,
					name : MyMeta.name,
					desc : MyMeta.desc
				}; };
				// If tracking is empty and Meta is defined
				if(this.tracking === false){
					this.tracking = MyMeta.tracking;
				}
			}else{
				// Attach meta info to this object 
				this.meta = function(){ return {
					code : "XX",
					name : "Unidentified Quest",
					desc : "This is an unidentified or untranslated quest. It cannot be shown here, so please visit the quest page in-game to view."
				}; };
			}
		}
	};
	
	KC3Quest.prototype.isDaily = function(){
		return (this.type == 2) 	// Daily Quest
			|| (this.type == 4) 	// Bd4
			|| (this.type == 5);	// Bd6
	};
	
	KC3Quest.prototype.isWeekly = function(){
		return this.type == 3;	// Weekly Quest
	};
	
	KC3Quest.prototype.isMonthly = function(){
		return this.type == 6;	// Weekly Quest
	};
	
	KC3Quest.prototype.isUnselected = function(){
		return this.status == 1;	// Unselected 
	};
	
	KC3Quest.prototype.isSelected = function(){
		return this.status == 2;	// Selected
	};
	
	KC3Quest.prototype.isCompleted = function(){
		return this.status == 3;	// Completed
	};
	
	KC3Quest.prototype.autoAdjustCounter = function(){
		if (this.isCompleted()) {
			this.tracking[0][0] = this.tracking[0][1];
			return;
		}
		if (this.tracking && (this.id != 214) && (this.id != 607)  && (this.id != 608)) {
			var currentCount = this.tracking[0][0];
			var maxCount = parseFloat(this.tracking[0][1]);
			var progress = 0;
			if (this.progress == 1) {
				progress = 0.5;
			} else if (this.progress == 2) {
				progress = 0.8;
			}
			if (currentCount/maxCount < progress) {
				console.log(this.tracking);
				console.log(this.tracking[0][0]);
				console.log(this.tracking[0][1]);
				console.log(currentCount);
				console.log(maxCount);
				console.log("Adjust: " + currentCount/maxCount + " " + progress + " " + Math.ceil(maxCount * progress));
				this.tracking[0][0] = Math.ceil(maxCount * progress);
			}
		}
	};
	
	KC3Quest.prototype.getColor = function(){
		return [
			"#555555", //0
			"#33A459", //1
			"#D75048", //2
			"#98E75F", //3
			"#AACCEE", //4
			"#EDD286", //5
			"#996600", //6
			"#AE76FA", //7
		][(this.id+"").substring(0,1)];
	};
	
})();