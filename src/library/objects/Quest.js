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
			this.progress =	 0;
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
				return trackingText.join(String.fromCharCode(10));
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
	@param {number} reqNum - index of counter type, mainly for Bw1. Default: 0
	@param {number} amount - progress amount to be increased. Default: 1
	@param isAdjustingCounter - if true, prevent recursively inc on specific quest itself
	------------------------------------------*/
	KC3Quest.prototype.increment = function(reqNum=0, amount=1, isAdjustingCounter=false){
		var self = this;
		var isIncreased = false;
		if (! ConfigManager.spCounterAdjust) {
			if (this.tracking && this.isSelected()) {
				if (this.tracking[reqNum][0] + amount <= this.tracking[reqNum][1]) {
					this.tracking[reqNum][0] += amount;
				}
				KC3QuestManager.save();
			}
			return;
		}

		// is selected on progress, or force to be adjusted on shared counter
		if(this.tracking && (this.isSelected() || !!isAdjustingCounter)){
			if(typeof reqNum == "undefined"){ reqNum=0; }
			if(typeof amount == "undefined"){ amount=1; }
			// passive adjusted never reach completion
			var maxValue = !!isAdjustingCounter ? this.tracking[reqNum][1] - 1 : this.tracking[reqNum][1];
			if (this.tracking[reqNum][0] < maxValue) {
				isIncreased = true;
				this.tracking[reqNum][0] += Math.min(amount, maxValue - this.tracking[reqNum][0]);
			}
			KC3QuestManager.save();
		}
		// Some quests are reported bug-like behavior on progress counter at server-side,
		// Try to simulate the increment behavior, keep counters the same with in-game's
		// See PR #1436
		if(!isAdjustingCounter && isIncreased && Array.isArray(KC3QuestManager.sharedCounterQuests)){
			KC3QuestManager.sharedCounterQuests.forEach(function(idList){
				var ids = Array.apply(null, idList);
				ids.forEach(function(incId, idx){
					if(self.id === incId){
						ids.splice(idx, 1);
						ids.forEach(function(id){
							KC3QuestManager.get(id).increment(reqNum, amount, true);
						});
					}
				});
			});
		}
	};

	/* ISCOMPLETE
	Return true iff all of the counters are complete
	------------------------------------------*/
	KC3Quest.prototype.isComplete = function() {
		if (this.tracking) {
			for (var ctr in this.tracking) {
				if (this.tracking[ctr][0] <
					this.tracking[ctr][1])
					return false;
			}
			return true;
		}
		return false;
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
					desc : MyMeta.desc,
					memo : MyMeta.memo
				}; };
				// If tracking is empty and Meta is defined
				if(this.tracking === false){
					this.tracking = MyMeta.tracking;
				}
			}else{
				// Attach meta info to this object
				this.meta = function(){ return {
					code : "N/A",
					name : KC3Meta.term("UntranslatedQuest"),
					desc : KC3Meta.term("UntranslatedQuestTip")
				}; };
			}
		}
	};

	KC3Quest.prototype.isDaily = function(){
		return (this.type == 2)		// Daily Quest
			|| (this.type == 4)		// Bd4
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
		if(this.tracking){
			if(this.isCompleted()) {
				this.tracking[0][0] = this.tracking[0][1];
				return;
			}
			// No adjustment for Bw1, F7, F8
			if([214, 607, 608].indexOf(this.id) < 0){
				var currentCount = this.tracking[0][0];
				var maxCount = parseFloat(this.tracking[0][1]);
				var progress = 0;
				if (this.progress == 1) {
					progress = 0.5;
				} else if (this.progress == 2) {
					progress = 0.8;
				}
				if (currentCount/maxCount < progress) {
					console.log("Adjusting quest", this.id, "tracking", currentCount,
						"to", Math.ceil(maxCount * progress), "=", progress * 100 + "%", "of", maxCount);
					this.tracking[0][0] = Math.ceil(maxCount * progress);
				}
			}
		}
	};

	KC3Quest.prototype.toggleCompletion = function(forceCompleted){
		if(this.isSelected() || !!forceCompleted){
			console.info("Force to complete quest:", this.id);
			this.status = 3;
			// Do not set tracking counter to max,
			// as quest will be always completed when re-activated
			KC3QuestManager.save();
		} else if(this.isCompleted()){
			console.info("Re-select quest again:", this.id);
			this.status = 2;
			// Reset counter, but do not touch Bw1
			if(this.tracking && this.id != 214){
				this.tracking[0][0] = 0;
			}
			KC3QuestManager.save();
		} else {
			console.warn("Quest", this.id, "status", this.status, "invalid");
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
			"#D75048", //8
		][(this.id+"").substring(0,1)];
	};

})();
