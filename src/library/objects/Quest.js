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
		this.label = 0;
		this.status = 0;
		this.hash = 0;
		this.progress = 0;
		this.materials = [0,0,0,0];
		this.tracking = false;
	};

	/* DEFINE
	Fill object with already-formatted quest data
	------------------------------------------*/
	KC3Quest.prototype.define = function( data ){
		this.id = data.id;
		this.status = data.status;
		this.type = data.type;
		this.label = data.label;
		this.hash = data.hash;
		if (data.progress) {
			this.progress = data.progress;
		} else {
			this.progress = 0;
		}
		if (data.materials) {
			this.materials = data.materials;
		}
		if (data.tracking) {
			this.tracking = data.tracking;
		}
		this.attachMeta();
	};

	/* DEFINE RAW
	Fill object with quest data from Raw API response
	------------------------------------------*/
	KC3Quest.prototype.defineRaw = function( data ){
		// Attach temporary raw data for quick reference
		// Possible useful for us, but not persistent yet:
		//   api_category: 1=Compo, 2/8/9/10=Sortie, 3=PvP, 4=Exped, 5=Supply/Dock, 6/11=Arsenal, 7=Modern
		//   api_lost_badges: medal will be consumed
		//   api_bonus_flag: 1 = regular, 2 = shipgirl
		//   api_select_rewards: ID object array of selectable rewrads
		//   api_voice_id: voice will be played on completed, stored at /sound/kc9999/
		//   api_invalid_flag: 1 = the gear will be converted is locked
		this.raw = function(){ return data; };
		this.id = data.api_no;
		this.status = data.api_state;
		this.type = data.api_type;
		// similar to api_type, indicate the icon label for:
		//   1=One-time, 2=Daily, 3=Weekly, 6=Monthly, 7=Other(incl.Quarterly), 102=Yearly Feb, 103=Yearly Mar,..., 110=Year Oct, ...
		this.label = data.api_label_type;
		// for simplicity, only use string simple hash on `api_title`,
		// for accurate identitifer, might add more properties or use less collision hash.
		// but notice: text not exactly the same will raise issue,
		// and in-game `api_detail` is using `<br>`, always removed by wiki and us.
		this.hash = (data.api_title || "").hashCode();
		this.progress = data.api_progress_flag;
		this.materials = data.api_get_material;
		this.attachMeta();
	};

	/* OUTPUT SHORT
	Return tracking text to be shown on Panel and Strategy Room
	------------------------------------------*/
	KC3Quest.prototype.outputShort = function(showAll = false, oneTimeChecks = false){
		if(this.tracking){
			const trackingText = [];
			let textToShow = "";
			// If all tracking items are 1-time checks: [0, 1]
			const isAllTicks = Array.isArray(this.tracking) &&
				this.tracking.every(el => Array.isArray(el) && el[1] === 1);
			let ticked = 0;
			for(const key in this.tracking){
				if(!Array.isArray(this.tracking[key])) continue;
				textToShow = this.tracking[key].join("/");
				trackingText.push(
					(this.meta().trackingDesc ? this.meta().trackingDesc[key] || "{0}" : "{0}")
						.format(textToShow)
				);
				if(!showAll) {
					if(this.tracking[key][0] < this.tracking[key][1]) {
						// Show first uncompleted item only if not show all and items not 1-time checks
						if(!oneTimeChecks || !isAllTicks) return textToShow;
					} else {
						// Count completed ticks
						ticked += 1;
					}
				}
			}
			if(!showAll) {
				// Show completed ticks if all tracking items are 1-time checks
				if(oneTimeChecks && isAllTicks)
					return "{0}/{1}".format(ticked, this.tracking.length);
				return textToShow;
			} else {
				return trackingText.join("\n");
			}
		}
		return "";
	};

	/* OUTPUT HTML
	Return tracking text to be shown on in-game quest overlay
	------------------------------------------*/
	KC3Quest.prototype.outputHtml = function(){
		if(this.tracking){
			const trackingText = [];
			for(const key in this.tracking){
				trackingText.push(this.tracking[key].join("/"));
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

	/** Batch increasing tracking progress counter for known period quests (with specific conditions) */
	KC3Quest.incrementBatch = function(type = 0, context = {}){
		switch(type) {
			case 3: // Cxx type, PvP win
				KC3QuestManager.get(303).increment(); // C2: Daily Exercises 1
				if(context.rankPt >= 3) { // B-Rank+
					KC3QuestManager.get(304).increment(); // C3: Daily Exercises 2
					KC3QuestManager.get(302).increment(); // C4: Weekly Exercises
					KC3QuestManager.get(311).increment(); // C8: Monthly Exercises 1
					if(KC3QuestManager.isPrerequisiteFulfilled(318))
						KC3QuestManager.get(318).increment(); // C16: Monthly Exercises 2
					if(KC3QuestManager.isPrerequisiteFulfilled(330))
						KC3QuestManager.get(330).increment(); // C29: Quarterly Exercises 1
					if(KC3QuestManager.isPrerequisiteFulfilled(353))
						KC3QuestManager.get(353).increment(); // C58: Yearly Exercises 5
				}
				if(context.rankPt >= 4) { // A-Rank+
					if(KC3QuestManager.isPrerequisiteFulfilled(342))
						KC3QuestManager.get(342).increment(); // C44: Quarterly Exercises 4
					if(KC3QuestManager.isPrerequisiteFulfilled(345))
						KC3QuestManager.get(345).increment(); // C49: Yearly Exercises 1
					if(KC3QuestManager.isPrerequisiteFulfilled(348))
						KC3QuestManager.get(348).increment(); // C53: Yearly Exercises 3
					if(KC3QuestManager.isPrerequisiteFulfilled(350))
						KC3QuestManager.get(350).increment(); // C55: Yearly Exercises 4
				}
				if(context.rankPt >= 5) { // S-Rank+
					if(KC3QuestManager.isPrerequisiteFulfilled(337))
						KC3QuestManager.get(337).increment(); // C38: Quarterly Exercises 2
					if(KC3QuestManager.isPrerequisiteFulfilled(339))
						KC3QuestManager.get(339).increment(); // C42: Quarterly Exercises 3
					if(KC3QuestManager.isPrerequisiteFulfilled(346))
						KC3QuestManager.get(346).increment(); // C50: Yearly Exercises 2
					if(KC3QuestManager.isPrerequisiteFulfilled(354))
						KC3QuestManager.get(354).increment(); // C60: Yearly Exercises 6
				}
				break;
			case 4: // Dxx type, expedition success
				KC3QuestManager.get(402).increment(); // D2: Daily Expeditions 1
				KC3QuestManager.get(403).increment(); // D3: Daily Expeditions 2
				KC3QuestManager.get(404).increment(); // D4: Weekly Expeditions
				switch(context.expedId) {
					case 1:
						KC3QuestManager.get(436).increment(0); // D33: Yearly, index 0
						break;
					case 2:
						KC3QuestManager.get(436).increment(1); // D33: Yearly, index 1
						break;
					case 3:
						KC3QuestManager.get(426).increment(0); // D24: Quarterly, index 0
						KC3QuestManager.get(434).increment(0); // D32: Yearly, index 0
						KC3QuestManager.get(436).increment(2); // D33: Yearly, index 2
						break;
					case 4:
						KC3QuestManager.get(426).increment(1); // D24: Quarterly, index 1
						KC3QuestManager.get(428).increment(0); // D26: Quarterly, index 0
						KC3QuestManager.get(436).increment(3); // D33: Yearly, index 3
						KC3QuestManager.get(437).increment(0); // D34: Yearly, index 0
						KC3QuestManager.get(438).increment(1); // D35: Yearly, index 1
						break;
					case 5:
						KC3QuestManager.get(424).increment();  // D22: Monthly Expeditions
						KC3QuestManager.get(426).increment(2); // D24: Quarterly, index 2
						KC3QuestManager.get(434).increment(1); // D32: Yearly, index 1
						KC3QuestManager.get(439).increment(0); // D36: Yearly, index 0
						KC3QuestManager.get(440).increment(1); // D37: Yearly, index 1
						KC3QuestManager.get(444).increment(0); // D40: Yearly, index 0
						break;
					case 9:
						KC3QuestManager.get(434).increment(4); // D32: Yearly, index 4
						KC3QuestManager.get(438).increment(2); // D35: Yearly, index 2
						KC3QuestManager.get(444).increment(2); // D40: Yearly, index 2
						break;
					case 10:
						KC3QuestManager.get(426).increment(3); // D24: Quarterly, index 3
						KC3QuestManager.get(436).increment(4); // D33: Yearly, index 4
						break;
					case 11:
						KC3QuestManager.get(439).increment(2); // D36: Yearly, index 2
						KC3QuestManager.get(444).increment(4); // D40: Yearly, index 4
						break;
					case 12:
						KC3QuestManager.get(444).increment(1); // D40: Yearly, index 1
						break;
					case 29:
						KC3QuestManager.get(442).increment(1); // D38: Yearly, index 1
						break;
					case 30:
						KC3QuestManager.get(442).increment(2); // D38: Yearly, index 2
						break;
					case 37:
					case 38:
						KC3QuestManager.get(410).increment(); // D9: Weekly Expedition 2
						KC3QuestManager.get(411).increment(); // D11: Weekly Expedition 3
						break;
					case 40:
						KC3QuestManager.get(440).increment(2); // D37: Yearly, index 2
						break;
					case 41:
						KC3QuestManager.get(440).increment(0); // D37: Yearly, index 0
						break;
					case 46:
						KC3QuestManager.get(440).increment(4); // D37: Yearly, index 4
						break;
					case 100: // A1
						KC3QuestManager.get(434).increment(2); // D32: Yearly, index 2
						KC3QuestManager.get(438).increment(0); // D35: Yearly, index 0
						KC3QuestManager.get(439).increment(1); // D36: Yearly, index 1
						break;
					case 101: // A2
						KC3QuestManager.get(428).increment(1); // D26: Quarterly, index 1
						KC3QuestManager.get(434).increment(3); // D32: Yearly, index 3
						break;
					case 102: // A3
						KC3QuestManager.get(428).increment(2); // D26: Quarterly, index 2
						break;
					case 104: // A5
						KC3QuestManager.get(437).increment(1); // D34: Yearly, index 1
						break;
					case 105: // A6
						KC3QuestManager.get(437).increment(2); // D34: Yearly, index 2
						break;
					case 110: // B1
						KC3QuestManager.get(437).increment(3); // D34: Yearly, index 3
						KC3QuestManager.get(439).increment(3); // D36: Yearly, index 3
						KC3QuestManager.get(444).increment(3); // D40: Yearly, index 3
						break;
					case 114: // B5
						KC3QuestManager.get(438).increment(3); // D35: Yearly, index 3
						break;
					case 131: // D1
						KC3QuestManager.get(442).increment(0); // D38: Yearly, index 0
						break;
					case 133: // D3
						KC3QuestManager.get(442).increment(3); // D38: Yearly, index 3
						break;
					case 142: // E2
						KC3QuestManager.get(440).increment(3); // D37: Yearly, index 3
						break;
				}
				break;
			case 6: // Fxx type, scrapping slotitem
				switch(context.gearMaster.api_type[2]) {
					case 1: // Small Caliber Main Gun
						KC3QuestManager.get(673).increment(); // F65 daily
						KC3QuestManager.get(657).increment(0); // F92 yearly index 0
						KC3QuestManager.get(655).increment(0); // F94 yearly index 0
						break;
					case 2: // Medium Caliber Main Gun
						KC3QuestManager.get(676).increment(0); // F68 weekly index 0
						KC3QuestManager.get(657).increment(1); // F92 yearly index 1
						KC3QuestManager.get(655).increment(1); // F94 yearly index 1
						break;
					case 3: // Large Caliber Main Gun
						KC3QuestManager.get(663).increment(); // F55 quarterly
						KC3QuestManager.get(677).increment(0); // F69 weekly index 0
						KC3QuestManager.get(655).increment(2); // F94 yearly index 2
						break;
					case 4: // Secondary Gun
						KC3QuestManager.get(676).increment(1); // F68 weekly index 1
						break;
					case 5: // Torpedo
					case 32: // Submarine Torpedo
						KC3QuestManager.get(677).increment(2); // F69 weekly index 2
						KC3QuestManager.get(657).increment(2); // F92 yearly index 2
						break;
					case 6: // Fighter
						KC3QuestManager.get(675).increment(0); // F67 quarterly index 0
						KC3QuestManager.get(688).increment(0); // F79 quarterly index 0
						KC3QuestManager.get(1107).increment(0); // F102 yearly index 0
						break;
					case 7: // Dive Bomber
						KC3QuestManager.get(688).increment(1); // F79 quarterly index 1
						KC3QuestManager.get(681).increment(0); // F95 yearly index 0
						break;
					case 8: // Torpedo Bomber
						KC3QuestManager.get(688).increment(2); // F79 quarterly index 2
						KC3QuestManager.get(655).increment(4); // F94 yearly index 4
						KC3QuestManager.get(681).increment(1); // F95 yearly index 1
						KC3QuestManager.get(1107).increment(1); // F102 yearly index 1
						break;
					case 10: // Recon Seaplane
						KC3QuestManager.get(677).increment(1); // F69 weekly index 1
						KC3QuestManager.get(688).increment(3); // F79 quarterly index 3
						KC3QuestManager.get(655).increment(3); // F94 yearly index 3
						break;
					case 12: // Small Radar
					case 13: // Large Radar
						KC3QuestManager.get(680).increment(1); // F72 quarterly index 1
						break;
					case 21: // Anti-Air Machine Gun
						KC3QuestManager.get(638).increment(); // F34 weekly
						KC3QuestManager.get(674).increment(); // F66 daily
						KC3QuestManager.get(675).increment(1); // F67 quarterly index 1
						KC3QuestManager.get(680).increment(0); // F72 quarterly index 0
						break;
					case 30: // Supply Container
						KC3QuestManager.get(676).increment(2); // F68 weekly index 2
						break;
					case 47: // LB Attacker Aircraft
						KC3QuestManager.get(1105).increment(); // F100 yearly
						break;
				}
				switch(context.gearMaster.api_id) {
					case 3: // 10cm Twin High-angle Gun Mount
						KC3QuestManager.get(686).increment(0); // F77 quarterly index 0
						break;
					case 4: // 14cm Single Gun Mount
						KC3QuestManager.get(653).increment(); // F90 quarterly
						break;
					case 19: // Type 96 Fighter
						KC3QuestManager.get(626).increment(1); // F22 monthly index 1
						KC3QuestManager.get(678).increment(0); // F70 quarterly index 0
						break;
					case 20: // Type 0 Fighter Model 21
						KC3QuestManager.get(626).increment(0); // F22 monthly index 0
						KC3QuestManager.get(643).increment(); // F39 quarterly
						KC3QuestManager.get(678).increment(1); // F70 quarterly index 1
						break;
					case 21: // Type 0 Fighter Model 52
						KC3QuestManager.get(628).increment(); // F25 monthly
						break;
					case 106: // Type 13 Air Radar Kai
						KC3QuestManager.get(1104).increment(); // F99 yearly
						break;
					case 121: // Type 94 Anti-Aircraft Fire Director
						KC3QuestManager.get(686).increment(1); // F77 quarterly index 1
						break;
					case 125: // 61cm Triple (Oxygen) Torpedo Mount
						KC3QuestManager.get(1103).increment(); // F98 yearly
						break;
					case 242: // Swordfish
						KC3QuestManager.get(654).increment(0); // F93 yearly index 0
						break;
					case 249: // Fulmar
						KC3QuestManager.get(654).increment(1); // F93 yearly index 1
						break;
				}
				break;
			default:
				console.warn("Unknown quest type: " + type, context);
		}
	};

	/* IS COMPLETE
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
		const questMeta = KC3Meta.quest(this.id);
		const noMeta = function() { return {
			available : undefined,
			code : "N/A",
			name : KC3Meta.term("UntranslatedQuest"),
			desc : KC3Meta.term("UntranslatedQuestTip")
		}; };
		const checkExpectedHash = (meta) => {
			if(meta.hash && this.hash && meta.hash !== this.hash) {
				console.debug(`Quest ${this.id} hash ${this.hash}, expected:`, meta.hash);
				return false;
			}
			return true;
		};
		// If this object doesn't have meta yet
		if(this.meta === undefined || !this.meta().available) {
			// If we have meta for this quest, and not an ID-reused seasonal one
			if(questMeta && checkExpectedHash(questMeta)) {
				// Attach meta info to this object
				this.meta = function() { return {
					available : true,
					code : questMeta.code,
					name : questMeta.name,
					desc : questMeta.desc,
					memo : questMeta.memo,
					trackingDesc : questMeta.trackingDesc
				}; };
				// If tracking is empty and Meta is defined
				if(this.tracking === false && Array.isArray(questMeta.tracking)) {
					this.tracking = questMeta.tracking;
				// If tracking not empty but Meta is undefined
				} else if(questMeta.tracking === undefined && Array.isArray(this.tracking)) {
					this.tracking = false;
				}
			} else if(this.meta === undefined) {
				this.meta = noMeta;
			}
		} else {
			// Check if translation updated
			var oldMeta = this.meta();
			if(questMeta
				&&(oldMeta.code !== questMeta.code
				|| oldMeta.name !== questMeta.name
				|| oldMeta.desc !== questMeta.desc
				|| oldMeta.memo !== questMeta.memo
				|| oldMeta.trackingDesc !== questMeta.trackingDesc
				)) {
				// Only update meta text, keep tracking untouched
				this.meta = function() { return {
					available : true,
					code : questMeta.code,
					name : questMeta.name,
					desc : questMeta.desc,
					memo : questMeta.memo,
					trackingDesc : questMeta.trackingDesc
				}; };
			} else if(questMeta && !checkExpectedHash(questMeta)) {
				this.meta = noMeta;
			}
		}
	};

	KC3Quest.prototype.isDaily = function(){
		return (this.type == 1)		// Daily Quest
			|| (this.id == 211)		// Bd4, but type == 5
			|| (this.id == 212)		// Bd6, but type == 5
			// Other known cases
			|| KC3QuestManager.getRepeatableIds('daily').indexOf(this.id) > -1;
	};

	KC3Quest.prototype.isWeekly = function(){
		return this.type == 2;	// Weekly Quest
	};

	KC3Quest.prototype.isMonthly = function(){
		return this.type == 3;	// Monthly Quest
	};

	KC3Quest.prototype.isQuarterly = function(){
		return KC3QuestManager.getRepeatableIds('quarterly').indexOf(this.id) > -1;
	};

	KC3Quest.prototype.isYearly = function(){
		return this.label > 100 && this.label <= 112;	// Yearly Quest from Jan to Dec
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
		if (!Array.isArray(this.tracking))
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
		if (this.tracking.length > 1) {
			// fix counters to 0 for yearly quests completed previously not reset correctly in time
			if(this.isYearly() && this.progress == 0
				&& this.tracking.every(td => td[0] > 0 && td[0] === td[1])) {
				this.tracking.forEach(td => { td[0] = 0; });
				console.log("Adjusting quest", this.id, "tracking multi-counter",
							"to 0 since completed state not reset.");
			}
			return;
		}

		// at this point we can confirm this is a singleton array
		// so only need to deal with one tracking data, let's give it a name
		const trackingData = this.tracking[0];

		const currentCount = trackingData[0],
			maxCount = parseFloat(trackingData[1]);

		// single tracking counter and client-side progress judgement for these:
		//   C16: no progress by PvP victories, 50% if 1st flagship equip 1 ration
		//   F25, F39, F90, F98, F99, F100: 50%/80% if secretary or inventory holds insufficient required items
		// about all client-side progress conditions, see `main.js#DutyModel_`.
		// quest F90, F98, F99, F100 also affected by `api_c_flag` in `api_c_list` array, which outside of `api_list`,
		//   and it may get non-zero progress even slotitem scrapping not enough, so counter no touch.
		//   anyway they might treat holding conditions + scrapping amount as couner max.
		if([318, 628, 643, 653, 1103, 1104, 1105].indexOf(this.id) > -1) {
			if (currentCount < maxCount && this.progress > 0
				&& [653, 1103, 1104, 1105].indexOf(this.id) === 0) {
				trackingData[0] = maxCount;
			}
			return;
		}

		// pFlag: short for Progress Flag, for uncompleted quests:
		// pFlag = 2: 80% <= progress percentage < 100%
		// pFlag = 1: 50% <= progress percentage < 80%
		// pFlag = 0:        progress percentage < 50%
		const actualPFlag = this.progress;
		console.assert([0,1,2].indexOf( actualPFlag ) !== -1);
		const progress =
			  actualPFlag === 0 ? 0.0
			: actualPFlag === 1 ? 0.5
			: actualPFlag === 2 ? 0.8
			: NaN /* unreachable */;

		// we compare actual pFlag and pFlag under our track
		// to see if they are consistent,
		// by doing so we not only correct counter falling-behind problems,
		// but also overshooting ones.
		const trackedPFlag =
			  /* cur/max >= 4/5 (80%) */
			  5*currentCount >= 4*maxCount ? 2
			  /* cur/max >= 1/2 (50%) */
			: 2*currentCount >=   maxCount ? 1
			: 0;

		// does the actual correction and announce it
		const announcedCorrection = newCurrentCount => {
			console.log("Adjusting quest", this.id, "tracking", currentCount,
						"to", newCurrentCount , "=", progress * 100 + "%",
						"of", maxCount);
			trackingData[0] = newCurrentCount;
		};

		// Special 3-times maxCount adjustment for quest C38, C42, F7, F8, F66:
		//   these quests have different behavior that 1/3 is marked as being 50% completed,
		//   so our auto-adjustment for max < 5 won't work for them.
		// EO74 marks them as '(internal counter) starts from 1/4', so +1 50%, +2 80%.
		if (maxCount === 3 && [337, 339, 607, 608, 674].indexOf(this.id) > -1) {
			// but F7/F8 still 50%, not 80% mark at 2/3, so no adjustment
			if (currentCount !== actualPFlag && [607, 608].indexOf(this.id) == -1) {
				announcedCorrection(actualPFlag);
			}
			return;
		}

		// it's good if pFlag is consistent
		// but something is definitely wrong if cur >= max
		if (trackedPFlag === actualPFlag && currentCount < maxCount)
			return;

		if (maxCount >= 5) {
			announcedCorrection(Math.ceil(maxCount*progress));
		} else {
			// things special about maxCount < 5 quests is that
			// it is possible for:
			//   ceil(maxCount * 0.8), maxCount
			// to take the same number

			// so if we end up making new "currentCount" equal to "maxCount",
			// we must minus 1 from it to prevent it from completion
			let potentialCount = Math.ceil(maxCount * progress);
			if (potentialCount === maxCount)
				potentialCount = maxCount - 1;
			// if what we have figured out is the same as current counter
			// then it's still fine.
			if (potentialCount === currentCount)
				return;
			announcedCorrection(potentialCount);
		}
	};

	KC3Quest.prototype.toggleCompletion = function(forceCompleted){
		if(this.isSelected() || !!forceCompleted){
			console.log("Force to complete quest:", this.id);
			this.status = 3;
			// Do not set tracking counter to max,
			// as quest will be always completed when re-activated
			KC3QuestManager.save();
		} else if(this.isCompleted()){
			console.log("Re-select quest again:", this.id);
			this.status = 2;
			// Reset counter, but do not touch multi-counter (Bw1 for example)
			if(Array.isArray(this.tracking) && this.tracking.length === 1){
				this.tracking[0][0] = 0;
			}
			KC3QuestManager.save();
		} else {
			console.warn("Quest", this.id, "status", this.status, "invalid");
		}
	};

	/** Get rid of ID lower 2 digits */
	KC3Quest.getIdHigh = function(id){
		// ID always starts from 101, better memory usage than string slice
		return Math.floor((Number(id) || 0) / 100);
	};

	KC3Quest.prototype.getColor = function(){
		return [
			"",        //0
			"#33A459", //1
			"#D75048", //2
			"#98E75F", //3
			"#AACCEE", //4
			"#EDD286", //5
			"#996600", //6
			"#AE76FA", //7
			"#D75048", //8
			"#D75048", //9
			"#D75048", //10
			"#996600", //11
		][KC3Quest.getIdHigh(this.id)] || "#555555";
	};

	/** Static method for scenes that only ID available without quest API data */
	KC3Quest.getIconClass = function(id){
		return "type" + KC3Quest.getIdHigh(id);
	};

	KC3Quest.prototype.getIconClass = function(){
		return KC3Quest.getIconClass(this.id);
	};

	/** @return array of accepted api_category values when filtered by types.
		api_category not persistent since it's still just a number without api_id lower 2 digits */
	KC3Quest.getCategoriesByFilter = function(filterId){
		// filter IDs and matched categories see `main.js#DutyUtil.filterByCategory`
		switch(filterId){
			// Sortie
			case 1: return [2, 8, 9, 10];
			// PvP
			case 2: return [3];
			// Exped
			case 3: return [4];
			// Arsenal
			case 4: return [6, 11];
			// Others
			case 5: return [1, 5, 7];
		}
		return [];
	};

	KC3Quest.prototype.getLabelClass = function(){
		if(this.label > 0) switch(this.label){
			case 2: return "label_daily";
			case 3: return "label_weekly";
			case 6: return "label_monthly";
			case 7: return this.isQuarterly() ? "label_quarterly" : "label_other";
			default: if(this.isYearly()) return "label_yearly";
		}
		return "";
	};

})();
