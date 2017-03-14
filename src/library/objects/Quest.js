/* Quest.js
KC3改 Quest Class

Instantiatable class to represent a single Quest
Mainly used by QuestManager to store quest information

Known Quest Type (api_type):
1 = Daily
2 = Weekly
3 = Monthly
4 = Once
5 = Other (Bd4, Bd6, Quarterly, etc)

known IDs see QuestManager
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

		// is selected on progress, or force to be adjusted on shared counter
		if(this.tracking && (this.isSelected() || !!isAdjustingCounter)){
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
		var questMeta = KC3Meta.quest(this.id);
		// If this object doesn't have meta yet
		if(this.meta === undefined || !this.meta().available){
			// If we have meta for this quest
			if(questMeta){
				// Attach meta info to this object
				this.meta = function(){ return {
					available : true,
					code : questMeta.code,
					name : questMeta.name,
					desc : questMeta.desc,
					memo : questMeta.memo
				}; };
				// If tracking is empty and Meta is defined
				if(this.tracking === false){
					this.tracking = questMeta.tracking;
				}
			} else if(this.meta === undefined) {
				this.meta = function(){ return {
					available : undefined,
					code : "N/A",
					name : KC3Meta.term("UntranslatedQuest"),
					desc : KC3Meta.term("UntranslatedQuestTip")
				}; };
			}
		} else {
			// Check if translation updated
			var oldMeta = this.meta();
			if(questMeta
				&&(oldMeta.code !== questMeta.code
				|| oldMeta.name !== questMeta.name
				|| oldMeta.desc !== questMeta.desc
				|| oldMeta.memo !== questMeta.memo
				)){
				// Only update meta text, keep tracking untouched
				this.meta = function(){ return {
					available : true,
					code : questMeta.code,
					name : questMeta.name,
					desc : questMeta.desc,
					memo : questMeta.memo
				}; };
			}
		}
	};

	KC3Quest.prototype.isDaily = function(){
		return (this.type == 1)		// Daily Quest
			|| (this.id == 211)		// Bd4, but type == 5
			|| (this.id == 212)		// Bd6, but type == 5
			// Other known cases
			|| KC3QuestManager._dailyIds.indexOf(this.id) > -1;
	};

	KC3Quest.prototype.isWeekly = function(){
		return this.type == 2;	// Weekly Quest
	};

	KC3Quest.prototype.isMonthly = function(){
		return this.type == 3;	// Monthly Quest
	};

	KC3Quest.prototype.isQuarterly = function(){
		return KC3QuestManager._quarterlyIds.indexOf(this.id) > -1;
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

	KC3Quest.prototype.autoAdjustCounter = function() {
		if (! this.tracking || !Array.isArray(this.tracking))
			return;

		if (this.isCompleted()) {
			// avoid using "for ... of" syntax for now
			// which needs babel-polyfill to work
			// and getting that to work is bs.
			for (const ind in this.tracking) {
				const trackingData = this.tracking[ind];
				if (trackingData[0] !== trackingData[1]) {
					console.log("Adjusting quest", this.id, "tracking (multi-counter)",
								"index", ind, "tracking", trackingData[0],
								"to", trackingData[1],
								"upon completion.");
					trackingData[0] = trackingData[1];
				}
			}
			return;
		}

		// known fact at this point: the actual quest is *not* completed

		// no adjustment for multi-counter quests
		// an example of this Bw1 (questId = 214)
		if (this.tracking.length > 1)
			return;

		// at this point we can confirm this is a singleton array
		// so only need to deal with one tracking data, let's give it a name
		const trackingData = this.tracking[0];

		let currentCount = trackingData[0];
		let maxCount = parseFloat(trackingData[1]);

		// no adjustment for F7 and F8:
		// these two quests have a weird behavior that 1/3 is marked as being 50% completed
		// so our auto-adjustment won't work for them.
		if([607, 608].indexOf(this.id) > -1
			&& currentCount > 0 && currentCount < maxCount)
			return;

		// pFlag: short for Progress Flag,
		// for incompleted quests:
		// pFlag = 2: 80% <= progress percentage < 100%
		// pFlag = 1: 50% <= progress percentage < 80%
		// pFlag = 0:        progress percentage < 50%
		let actualPFlag = this.progress;
		console.assert([0,1,2].indexOf( actualPFlag ) !== -1);
		let progress =
			actualPFlag === 0 ? 0.0
			: actualPFlag === 1 ? 0.5
			: actualPFlag === 2 ? 0.8
			: NaN /* unreachable */;

		// we compare actual pFlag and pFlag under our track
		// to see if they are consistent,
		// by doing so we not only correct counter falling-behind problems,
		// but also overshotting ones.
		let trackedPFlag =
			/* cur/max >= 4/5 (80%) */
			5*currentCount >= 4*maxCount ? 2
		/* cur/max >= 1/2 (50%) */
			: 2*currentCount >= maxCount ? 1
			: 0;

		// does the actual correction and announce it
		let announcedCorrection = newCurrentCount => {
			console.log("Adjusting quest", this.id, "tracking", currentCount,
						"to", newCurrentCount , "=", progress * 100 + "%",
						"of", maxCount);
			trackingData[0] = newCurrentCount;
		};

		// it's good if pFlag is consistent
		// but something is defintely wrong if cur >= max
		if (trackedPFlag === actualPFlag &&
			currentCount < maxCount)
			return;

		if (maxCount >= 5) {
			announcedCorrection( Math.ceil(maxCount*progress) );
		} else {
			// things special about maxCount < 5 quests is that
			// it is possible for:
			//   ceil(maxCount * 0.8), maxCount
			// to take the same number

			// so if we end up making new "currentCount" equal to "maxCount",
			// we must minus 1 from it to prevent it from completion
			let potentialCount = Math.ceil(maxCount * progress);
			if (potentialCount === maxCount)
				potentialCount = maxCount-1;
			// if what we have figured out is the same as current counter
			// then it's still fine.
			if (potentialCount === currentCount)
				return;
			announcedCorrection( potentialCount );
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
			// Reset counter, but do not touch multi-counter (Bw1 for now)
			if(Array.isArray(this.tracking) && this.tracking.length === 1){
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
