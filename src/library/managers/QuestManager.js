/* QuestManager.js
KC3改 Quest Management Object

Stand-alone object, attached to root window, never to be instantiated
Contains functions to perform quest management tasks
Uses KC3Quest objects to play around with
*/
(function(){
	"use strict";

	const MS_PER_HOUR = 1000 * 60 * 60;
	const MS_PER_DAY = MS_PER_HOUR * 24;

	const SUNDAY = 0;

	const JANUARY = 0;
	const FEBRUARY = 1;
	const MARCH = 2;
	const APRIL = 3;
	const MAY = 4;
	const JUNE = 5;
	const JULY = 6;
	const AUGUST = 7;
	const SEPTEMBER = 8;
	const OCTOBER = 9;
	const NOVEMBER = 10;
	const DECEMBER = 11;

	window.KC3QuestManager = {
		list: {}, // Use curly brace instead of square bracket to avoid using number-based indexes
		open: [], // Array of quests seen on the quests page, regardless of state
		active: [], // Array of quests that are active and counting

		// A quests list which confirmed sharing same counter at server-side
		// Currently quests list is confirmed at: http://wikiwiki.jp/kancolle/?%C7%A4%CC%B3#sc3afcc0
		sharedCounterQuests: [ [218, 212] ],

		/* GET
		Get a specific quest object in the list using its ID
		------------------------------------------*/
		get :function( questId ){
			// Return requested quest object of that ID, or a new Quest object, whichever works
			return (this.list["q"+questId] || (this.list["q"+questId] = new KC3Quest()));
		},

		getIfExists :function( questId ){
			return this.exists(questId) ? this.get(questId) : false;
		},

		exists :function( questId ){
			return !!this.list["q"+questId];
		},

		remove :function( quest ){
			var questId = (typeof quest === "object") ? quest.id : quest;
			return delete this.list["q"+questId];
		},

		/* GET ACTIVE
		Get list of active quests
		------------------------------------------*/
		getActives :function(){
			var activeQuestObjects = [];
			var self = this;
			$.each(this.active, function( index, element ){
				activeQuestObjects.push( self.get(element) );
			});
			return activeQuestObjects;
		},

		// Remove expired repeatables
		checkAndResetQuests: function (serverTime) {
			try {
				KC3QuestManager.load();

				KC3QuestManager.getRepeatableTypes().forEach(({ type, resetQuests }) => {
					const resetTime = KC3QuestManager.getResetTime(type, serverTime);
					if (serverTime >= resetTime) {
						resetQuests();
						KC3QuestManager.updateResetTime(type, serverTime);
						KC3QuestManager.triggerNetworkEvent();
					}
				});

				KC3QuestManager.save();
			} catch (error) {
				console.error("Reset Quest Error:", error);
			}
		},

		getResetTime: function (questType, serverTime) {
			const repeatable = KC3QuestManager.repeatableTypes[questType];

			const result = localStorage.getItem(repeatable.key);
			if (result) { return parseInt(result, 10); }

			const resetTime = repeatable.calculateNextReset(serverTime);
			localStorage.setItem(repeatable.key, resetTime);
			return resetTime;
		},

		updateResetTime: function (questType, serverTime) {
			const repeatable = KC3QuestManager.repeatableTypes[questType];

			localStorage.setItem(repeatable.key, repeatable.calculateNextReset(serverTime));
		},

		triggerNetworkEvent: function () {
			if (typeof KC3Network === 'object') {
				KC3Network.trigger('Quests');
			}
		},

		repeatableTypes: {
			daily: {
				type: 'daily',
				key: 'timeToResetDailyQuests',
				questIds: [201, 216, 210, 211, 218, 212, 226, 230, 303, 304, 402, 403, 503, 504, 605, 606, 607, 608, 609, 619, 673, 674, 702],
				resetQuests: function () { KC3QuestManager.resetDailies(); },
				calculateNextReset: function (serverTime) {
					// JST is +9 GMT, so 05:00 JST === 20:00 UTC
					let result = new Date(serverTime);

					if (result.getUTCHours() >= 20) {
						result = new Date(result.getTime() + MS_PER_DAY);
					}
					result.setUTCHours(20);
					result.setUTCMinutes(0);
					result.setUTCSeconds(0);
					result.setUTCMilliseconds(0);

					return result.getTime();
				},
			},
			weekly: {
				type: 'weekly',
				key: 'timeToResetWeeklyQuests',
				questIds: [214, 220, 213, 221, 228, 229, 241, 242, 243, 261, 302, 404, 410, 411, 613, 638, 676, 677, 703],
				resetQuests: function () { KC3QuestManager.resetWeeklies(); },
				calculateNextReset: function (serverTime) {
					const nextDailyReset = new Date(
						KC3QuestManager.repeatableTypes.daily.calculateNextReset(serverTime));
					const day = nextDailyReset.getUTCDay();

					// if the (daily) reset is on Sunday, it's also a weekly reset
					// (Monday 05:00 JST === Sunday 20:00 UTC)
					if (day === SUNDAY) {
						return nextDailyReset.getTime();
					}
					// otherwise we need to advance to the end of the week
					return nextDailyReset.getTime() + (MS_PER_DAY * (7 - day));
				},
			},
			monthly: {
				type: 'monthly',
				key: 'timeToResetMonthlyQuests',
				questIds: [249, 256, 257, 259, 265, 264, 266, 280, 311, 318, 424, 626, 628, 645],
				resetQuests: function () { KC3QuestManager.resetMonthlies(); },
				calculateNextReset: function (serverTime) {
					const nextDailyReset = new Date(
						KC3QuestManager.repeatableTypes.daily.calculateNextReset(serverTime));
					// Date will handle wrapping for us; e.g. Date(2016, 12) === Date(2017, 0)
					const firstDayOfNextMonth = new Date(Date.UTC(nextDailyReset.getUTCFullYear(),
						nextDailyReset.getUTCMonth() + 1));
					return firstDayOfNextMonth.getTime() - (4 * MS_PER_HOUR);
				},
			},
			quarterly: {
				type: 'quarterly',
				key: 'timeToResetQuarterlyQuests',
				questIds: [284, 330, 337, 339, 342, 426, 428, 637, 643, 653, 663, 675, 678, 680, 686, 688, 822, 845, 854, 861, 862, 872, 873, 875, 888, 893, 894, 903],
				resetQuests: function () { KC3QuestManager.resetQuarterlies(); },
				calculateNextReset: function (serverTime) {
					const nextMonthlyReset = new Date(
						KC3QuestManager.repeatableTypes.monthly.calculateNextReset(serverTime));
					const month = nextMonthlyReset.getUTCMonth();
					switch (month) {
						// if nextMonthlyReset is in March, April, May, we're in the June quarter
						// (i.e. reset at May 31st, 20:00 UTC)
						case MARCH: case APRIL: case MAY: {
							const firstofJune = new Date(Date.UTC(nextMonthlyReset.getUTCFullYear(), JUNE));
							return firstofJune.getTime() - (4 * MS_PER_HOUR);
						}
						// if nextMonthlyReset is in June, July, August, we're in the September quarter
						// (i.e. reset at August 31st, 20:00 UTC)
						case JUNE: case JULY: case AUGUST: {
							const firstOfSeptember = new Date(Date.UTC(nextMonthlyReset.getUTCFullYear(), SEPTEMBER));
							return firstOfSeptember.getTime() - (4 * MS_PER_HOUR);
						}
						// if nextMonthlyReset is in September, October, November, we're in the December quarter
						// (i.e. reset at November 30th, 20:00 UTC)
						case SEPTEMBER: case OCTOBER: case NOVEMBER: {
							const firstOfDecember = new Date(Date.UTC(nextMonthlyReset.getUTCFullYear(), DECEMBER));
							return firstOfDecember.getTime() - (4 * MS_PER_HOUR);
						}
						// if nextMonthlyReset is in December, January, February, we're in the March quarter
						// (i.e. reset at February 28th/29th, 20:00 UTC)
						case DECEMBER: case JANUARY: case FEBRUARY: {
							const firstOfMarch = new Date(Date.UTC(nextMonthlyReset.getUTCFullYear(), MARCH));
							if (month === DECEMBER) {
								firstOfMarch.setUTCFullYear(nextMonthlyReset.getUTCFullYear() + 1);
							}
							return firstOfMarch.getTime() - (4 * MS_PER_HOUR);
						}
						default:
							// should be unreachable
							throw new Error(`Bad month: ${month}`);
					}
				},
			},
			// Reset on 1st January every year
			yearlyJan: {
				type: 'yearlyJan',
				key: 'timeToResetYearlyJanQuests',
				resetMonth: JANUARY,
				questIds: [681],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyJan.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyJan.resetMonth);
				},
			},
			// Reset on 1st February every year
			yearlyFeb: {
				type: 'yearlyFeb',
				key: 'timeToResetYearlyFebQuests',
				resetMonth: FEBRUARY,
				questIds: [348, 434, 442, 716, 717, 904, 905],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyFeb.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyFeb.resetMonth);
				},
			},
			// Reset on 1st March every year
			yearlyMar: {
				type: 'yearlyMar',
				key: 'timeToResetYearlyMarQuests',
				resetMonth: MARCH,
				questIds: [350, 436, 444, 912, 914],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyMar.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyMar.resetMonth);
				},
			},
			// Reset on 1st May every year
			yearlyMay: {
				type: 'yearlyMay',
				key: 'timeToResetYearlyMayQuests',
				resetMonth: MAY,
				questIds: [356, 437, 973, 975],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyMay.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyMay.resetMonth);
				},
			},
			// Reset on 1st June every year
			yearlyJun: {
				type: 'yearlyJun',
				key: 'timeToResetYearlyJunQuests',
				resetMonth: JUNE,
				questIds: [353, 357, 944, 945, 946, 947, 948, 1103, 1104],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyJun.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyJun.resetMonth);
				},
			},
			// Reset on 1st July every year
			yearlyJul: {
				type: 'yearlyJul',
				key: 'timeToResetYearlyJulQuests',
				resetMonth: JULY,
				questIds: [354, 1105],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyJul.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyJul.resetMonth);
				},
			},
			// Reset on 1st August every year
			yearlyAug: {
				type: 'yearlyAug',
				key: 'timeToResetYearlyAugQuests',
				resetMonth: AUGUST,
				questIds: [438],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyAug.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyAug.resetMonth);
				},
			},
			// Reset on 1st September every year
			yearlySep: {
				type: 'yearlySep',
				key: 'timeToResetYearlySepQuests',
				resetMonth: SEPTEMBER,
				questIds: [439, 440, 657, 928, 1107],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlySep.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlySep.resetMonth);
				},
			},
			// Reset on 1st October every year
			yearlyOct: {
				type: 'yearlyOct',
				key: 'timeToResetYearlyOctQuests',
				resetMonth: OCTOBER,
				questIds: [345, 346, 355, 654],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyOct.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyOct.resetMonth);
				},
			},
			// Reset on 1st November every year
			yearlyNov: {
				type: 'yearlyNov',
				key: 'timeToResetYearlyNovQuests',
				resetMonth: NOVEMBER,
				questIds: [655, 714, 715],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyNov.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyNov.resetMonth);
				},
			},
			// Reset on 1st December every year
			yearlyDec: {
				type: 'yearlyDec',
				key: 'timeToResetYearlyDecQuests',
				resetMonth: DECEMBER,
				questIds: [1120],
				resetQuests: function () {
					KC3QuestManager.resetYearlies(KC3QuestManager.repeatableTypes.yearlyDec.type);
				},
				calculateNextReset: function (serverTime) {
					return KC3QuestManager.calculateNextYearlyReset(serverTime, KC3QuestManager.repeatableTypes.yearlyDec.resetMonth);
				},
			},
		},

		calculateNextYearlyReset: function (serverTime, resetMonth) {
			const nextMonthlyReset = new Date(KC3QuestManager.repeatableTypes.monthly.calculateNextReset(serverTime));
			const nextUTCMonth = nextMonthlyReset.getUTCMonth();
			// UTCMonth will be always previous month of JST month on 1st day 5:00, so >= used here
			const nextYearlyReset = new Date(Date.UTC(nextMonthlyReset.getUTCFullYear() + (1 & (nextUTCMonth >= resetMonth)), resetMonth));
			return nextYearlyReset.getTime() - (4 * MS_PER_HOUR);
		},

		getRepeatableTypes: function () {
			return Object.keys(KC3QuestManager.repeatableTypes).map((key) => {
				return KC3QuestManager.repeatableTypes[key];
			});
		},

		// Get the ids of all quests of a specified repeatable type
		getRepeatableIds: function (type) {
			const repeatable = KC3QuestManager.repeatableTypes[type];

			return !!repeatable ? repeatable.questIds.concat() : [];
		},

		/** DEFINE PAGE
		 * When a user loads a quest page, we use its data to update our list
		 * Since 2020-03-27, quest page in API no longer exists (in-game UI paginated still), list includes all available items in specified tab ID
		------------------------------------------*/
		definePage :function( questList, questPage, questTabId ){
			const untranslated = [], existedAllIds = [];
			const reportedQuests = JSON.parse(localStorage.reportedQuests || "[]");
			for(var ctr in questList){
				if(!questList[ctr] || questList[ctr] === -1) continue;
				
				const questRaw = questList[ctr];
				const questId = questRaw.api_no;
				const questObj = this.get(questId);
				questObj.defineRaw(questRaw);
				questObj.autoAdjustCounter();
				if(questTabId === 0){
					existedAllIds.push(questId);
				}
				
				// Check for untranslated quests
				if(typeof questObj.meta().available == "undefined"){
					if(reportedQuests.indexOf(questId) === -1){
						untranslated.push(questRaw);
						// remember reported quest so wont send data twice
						reportedQuests.push(questId);
					}
				}
				
				// Add to actives or opens depending on its state
				switch(questRaw.api_state){
					case 1: // Unselected
						this.isOpen(questId,   true);
						this.isActive(questId, false);
						break;
					case 2: // Selected
						this.isOpen(questId,   true);
						this.isActive(questId, true);
						break;
					case 3: // Completed
						this.isOpen(questId,   false);
						this.isActive(questId, false);
						break;
					default:
						this.isOpen(questId,   false);
						this.isActive(questId, false);
						break;
				}
			}
			// Data submitting of untranslated quests no longer available for now
			if(untranslated.length){
				console.info("Untranslated quest detected", reportedQuests, untranslated);
			}
			
			// It's now possible to clean quests non-open-nor-active in-game for API change reason,
			// Close (mark as completed) quests for those `api_no` not in current quest list, as long as questTabId is 0 (All quests available).
			if(existedAllIds.length){
				this.open.filter(id   => !existedAllIds.includes(id)).forEach(id => { this.isOpen(id,   false); this.get(id).status = 3; });
				this.active.filter(id => !existedAllIds.includes(id)).forEach(id => { this.isActive(id, false); this.get(id).status = 3; });
			}
			
			this.save();
		},
		
		buildHtmlTooltip :function(questId, meta, isShowId = true, isShowUnlocks = true){
			const questMeta = meta || KC3Meta.quest(questId);
			if(!questId || !questMeta) return "";
			const questObj = this.getIfExists(questId);
			let title = ((isShowId ? "[{0:id}] " : "") + "{1:code} {2:name}")
				.format(questId, questMeta.code || "N/A",
					questMeta.name || KC3Meta.term("UntranslatedQuest"));
			title += $("<p></p>").css("font-size", "11px")
				.css("margin-left", "1em")
				.css("text-indent", "-1em")
				.text(questMeta.desc || KC3Meta.term("UntranslatedQuestTip"))
				.prop("outerHTML");
			if(questObj && Array.isArray(questObj.materials) && questObj.materials.some(v => v > 0)){
				const buildRscItem = (name, value) => {
					const rsc = $("<div><img />&nbsp;<span></span></div>");
					$("img", rsc)
						.width(11).height(11).css("margin-top", "-3px")
						.attr("src", `/assets/img/client/${name}.png`);
					$("span", rsc).text(value || 0);
					return rsc.html();
				};
				title += $("<p></p>").css("font-size", "11px").html(
					["fuel", "ammo", "steel", "bauxite"]
						.map((n, i) => buildRscItem(n, questObj.materials[i]))
						.join("&emsp;")
				).prop("outerHTML");
			}
			if(!!questMeta.memo){
				title += $("<p></p>")
					.css("font-size", "11px")
					.css("color", "#69a").html(questMeta.memo)
					.prop("outerHTML");
			}
			if(isShowUnlocks && Array.isArray(questMeta.unlock)){
				for(const i in questMeta.unlock) {
					const cq = KC3Meta.quest(questMeta.unlock[i]);
					if(!!cq) title += "&emsp;" +
						$("<span></span>").css("font-size", "11px")
							.css("color", "#a96")
							.text("-> [{0:id}] {1:code} {2:name}"
								.format(questMeta.unlock[i], cq.code || "N/A", cq.name)
							).prop("outerHTML") + "<br/>";
				}
			}
			return title;
		},
		
		/* IS OPEN
		Defines a questId as open (not completed), adds to list
		------------------------------------------*/
		isOpen :function(questId, mode){
			if(mode){
				if(this.open.indexOf(questId) == -1){
					this.open.push(questId);
				}
			}else{
				if(this.open.indexOf(questId) > -1){
					this.open.splice(this.open.indexOf(questId), 1);
				}
			}
		},
		
		/* IS ACTIVE
		Defines a questId as active (the quest is selected), adds to list
		------------------------------------------*/
		isActive :function(questId, mode){
			if(mode){
				if(this.active.indexOf(questId) == -1){
					this.active.push(questId);
				}
			}else{
				if(this.active.indexOf(questId) > -1){
					this.active.splice(this.active.indexOf(questId), 1);
				}
			}
		},
		
		/* IS PERIOD
		Indicates if a questId is belong to time-period type quest.
		------------------------------------------*/
		isPeriod :function(questId){
			var period = this.getRepeatableIds('daily').indexOf(questId)>-1;
			period |= this.getRepeatableIds('weekly').indexOf(questId)>-1;
			period |= this.getRepeatableIds('monthly').indexOf(questId)>-1;
			period |= this.getRepeatableIds('quarterly').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyJan').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyFeb').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyMar').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyMay').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyJun').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyJul').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyAug').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlySep').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyOct').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyNov').indexOf(questId)>-1;
			period |= this.getRepeatableIds('yearlyDec').indexOf(questId)>-1;
			return !!period;
		},
		
		/* RESETTING FUNCTIONS
		Allows resetting quest state and counting
		------------------------------------------*/
		resetQuest :function(questId){
			if(typeof this.list["q"+questId] != "undefined"){
				delete this.list["q"+questId];
				this.isOpen(questId, false);
				this.isActive(questId, false);
			}
		},
		
		resetQuestCounter: function( questId, forced ){
			var quest = this.list["q"+questId];
			if(quest !== undefined && Array.isArray(quest.tracking)){
				for(var ctr in quest.tracking){
					var progress = quest.tracking[ctr];
					if(progress.length > 1 && (!!forced || progress[0] < progress[1])){
						progress[0] = 0;
					}
				}
				if(!!forced){
					this.isActive(questId, false);
				}
			}
		},
		
		resetLoop: function( questIds ){
			for(var ctr in questIds){
				this.resetQuest( questIds[ctr] );
			}
		},
		
		resetCounterLoop: function( questIds, forced ){
			for(var ctr in questIds){
				this.resetQuestCounter( questIds[ctr], forced );
			}
		},
		
		resetDailies :function(){
			this.load();
			console.log("Resetting dailies");
			this.resetLoop(this.getRepeatableIds('daily'));
			
			// Progress counter reset to 0 even if completed but reward not clicked in a day:
			// Monthly PvP C8
			this.resetCounterLoop([311], true);
			
			// Progress counter reset to 0 only if progress not completed in a day:
			// Quarterly PvP C29, C38, C42, C44
			this.resetCounterLoop([330, 337, 339, 342], false);
			// Yearly PvP C49, C50, C53, C58, C60, C62, C65, C66
			this.resetCounterLoop([345, 346, 348, 353, 354, 355, 356, 357], false);
			
			// Progress counter not changed at all on daily reset:
			// Monthly PvP C16
			//this.resetCounterLoop([318], false);
			
			this.save();
		},
		
		resetWeeklies :function(){
			this.load();
			console.log("Resetting weeklies");
			this.resetLoop(this.getRepeatableIds('weekly'));
			this.save();
		},
		
		resetMonthlies :function(){
			this.load();
			console.log("Resetting monthlies");
			this.resetLoop(this.getRepeatableIds('monthly'));
			this.save();
		},
		
		resetQuarterlies :function(){
			this.load();
			console.log("Resetting quarterlies");
			this.resetLoop(this.getRepeatableIds('quarterly'));
			this.save();
		},
		
		resetYearlies :function(typeId){
			this.load();
			console.log("Resetting yearlies", typeId || "auto");
			if(!typeId || typeId === 'all') {
				if(typeId === 'all') {
					KC3QuestManager.getRepeatableTypes().forEach(({ type }) => {
						if(type.startsWith('yearly')) {
							this.resetLoop(this.getRepeatableIds(type));
						}
					});
				} else {
					const thisMonth = Date.getJstDate().getMonth();
					// keep empty for umimplemented months
					const monthAbbr = ["Jan", "Feb", "Mar", "", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][thisMonth];
					const type = monthAbbr ? "yearly" + monthAbbr : false;
					console.log("Auto found yearlies", type);
					if(type) this.resetLoop(this.getRepeatableIds(type));
				}
			} else {
				this.resetLoop(this.getRepeatableIds(typeId));
			}
			this.save();
		},
		
		clear :function(){
			this.list = {};
			this.active = [];
			this.open = [];
			this.save();
		},
		
		/**
		 * Check if specified quest's completion prerequisites are fulfilled.
		 * Such quests usually require some conditions can be checked at client-side,
		 * such as: specified composition of ships, have xxx resources / equipment...
		 *
		 * @param questId - the api_id of quest to be checked
		 * @param extraContexts - extra context object, eg: fleet num to be sent to sortie
		 * @see https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/kcmemo.md#%E3%82%AF%E3%83%A9%E3%82%A4%E3%82%A2%E3%83%B3%E3%83%88%E5%81%B4%E3%81%A7%E9%81%94%E6%88%90%E5%88%A4%E5%AE%9A%E3%81%8C%E3%81%AA%E3%81%95%E3%82%8C%E3%82%8B%E4%BB%BB%E5%8B%99
		 * @see `Kcsapi.resultScreenQuestFulfillment` about conditions of sortie and battles.
		 * @return true if current state fulfill the prerequisites of the quest; false if not.
		 *         undefined if condition of specified quest is undefined.
		 *
		 * Should move this to an independent module if condition library grows bigger.
		 */
		isPrerequisiteFulfilled(questId, extraContexts = {}){
			var questObj = this.get(questId);
			// Definitions of prerequisites, not take 'tracking' counts into account here.
			// Just give some typical samples, not completed for all period quests yet.
			var questCondsLibrary = {
				"249": // Bm1 Sortie a fleet has: Myoukou, Nachi, Haguro
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShip(62) && fleet.hasShip(63) && fleet.hasShip(65);
					},
				"257": // Bm3 Sortie CL as flagship, 0-2 more CL and 1 DD at least, no other ship type
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType(3, 0)
							&& fleet.countShipType(3) <= 3
							&& fleet.countShipType(2) >= 1
							// Progress not counted in-game if there is ETS FCF retreated ship, so use KCKai vita logic to simulate
							//&& fleet.countShipType([2, 3], true) === 0;
							&& fleet.countShipType([2, 3], false, true) === fleet.countShips(false);
					},
				"259": // Bm4 Sortie 3 BB (4 classes below only) and 1 CL
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.countShipClass([
								37, // Yamato-class
								19, // Nagato-class
								2,  // Ise-class
								26, // Fusou-class
							]) === 3 && fleet.countShipType(3) === 1;
					},
				"280": // Bm8 Sortie 1 CVL/CL(T)/CT and 3 DD/DE
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType([3, 4, 7, 21])
							&& fleet.countShipType([1, 2]) >= 3;
					},
				"284": // Bq11 Sortie 1 CVL/CL(T)/CT and 3 DD/DE
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType([3, 4, 7, 21])
							&& fleet.countShipType([1, 2]) >= 3;
					},
				"318": // C16 PvP with 2 more CLs in 1st fleet
					() => {
						const firstFleet = PlayerManager.fleets[0];
						return KC3SortieManager.isPvP() && KC3SortieManager.fleetSent == 1 &&
							firstFleet.countShipType(3) >= 2;
					},
				"330": // C29 PvP with CV(L/B) as flagship, 1 more CV(L/B) and 2 DD
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP() &&
							fleet.hasShipType([7, 11, 18], 0) &&
							fleet.countShipType([7, 11, 18]) >= 2 &&
							fleet.countShipType(2) >= 2;
					},
				"337": // C38 PvP with Arare, Kagerou, Kasumi, Shiranui
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShip(17)  // Kagerou any remodel
							&& fleet.hasShip(18)  // Shiranui any remodel
							&& fleet.hasShip(48)  // Arare any remodel
							&& fleet.hasShip(49); // Kasumi any remodel
					},
				"339": // C42 PvP with Isonami, Uranami, Ayanami, Shikinami
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShip(12)   // Isonami any remodel
							&& fleet.hasShip(13)   // Ayanami any remodel
							&& fleet.hasShip(14)   // Shikinami any remodel
							&& fleet.hasShip(486); // Uranami any remodel
					},
				"342": // C44 PvP with 3 DD/DE and 1 more DD/DE/CL(T)/CT
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP() && (
							fleet.countShipType([1, 2]) >= 4 ||
							fleet.countShipType([1, 2]) >= 3 &&
							fleet.hasShipType([3, 4, 21])
						);
					},
				"345": // C49 PvP with 4 of Warspite, Kongou, Ark Royal, Nelson, J-Class DD
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP() && (
							fleet.countShip(439)   + // Warspite any remodel
							fleet.countShip(78)    + // Kongou any remodel
							fleet.countShip(515)   + // Ark Royal any remodel
							fleet.countShip(571)   + // Nelson any remodel
							fleet.countShipClass(82) // J-Class any remodel
						) >= 4;
					},
				"346": // C50 PvP with Yuugumo K2, Makigumo K2, Kazagumo K2, Akigumo K2
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShip([542])  // Yuugumo K2
							&& fleet.hasShip([563])  // Makigumo K2
							&& fleet.hasShip([564])  // Kazagumo K2
							&& fleet.hasShip([648]); // Akigumo K2
					},
				"348": // C53 PvP with CL/CT as flagship, 2 more CL(T)/CT, 2 DD
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShipType([3, 21], 0)
							&& fleet.countShipType([3, 4, 21]) >= 3
							&& fleet.countShipType(2) >= 2;
					},
				"350": // C55 PvP with Oboro, Akebono, Sazanami, Ushio
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShip(15)  // Akebono any remodel
							&& fleet.hasShip(16)  // Ushio any remodel
							&& fleet.hasShip(93)  // Oboro any remodel
							&& fleet.hasShip(94); // Sazanami any remodel
					},
				"353": // C58 PvP with CA(V) as flagship, 3 more CA(V), 2 DD
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShipType([5, 6], 0)
							&& fleet.countShipType([5, 6]) >= 4
							&& fleet.countShipType(2) >= 2;
					},
				"354": // C60 PvP with Gambier Bay Mk.II as flagship, 2 Fletcher-class, John C.Butler-class DD
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShip([707], 0)
							&& fleet.countShipClass([87, 91]) >= 2;
					},
				"355": // C62 PvP with Kuroshio K2/Oyashio K2 as flagship, another ship as 2nd ship
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShip([568, 670], 0)
							&& fleet.hasShip([670, 568], 1);
					},
				"356": // C65 PvP with Isonami K2, Uranami K2, Ayanami K2, Shikinami K2
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShip([666])  // Isonami K2
							&& fleet.hasShip([647])  // Uranami K2
							&& fleet.hasShip([195])  // Ayanami K2
							&& fleet.hasShip([627]); // Shikinami K2
					},
				"357": // C66 PvP with Yamato, Musashi, 1 CL, 2 DD
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return KC3SortieManager.isPvP()
							&& fleet.hasShip(131)  // Yamato any remodel
							&& fleet.hasShip(143)  // Musashi any remodel
							&& fleet.countShipType(3) >= 1
							&& fleet.countShipType(2) >= 2;
					},
				"626": // F22 Have 1 Skilled Crew Member. Houshou as secretary, equip her with a >> Type 0 Fighter Model 21
					() => {
						const firstFleet = PlayerManager.fleets[0];
						const isMaxProType0Model21Equipped = firstFleet.ship(0)
							.equipment().some(gear => gear.masterId === 20 && gear.ace >= 7);
						return PlayerManager.consumables.skilledCrew >= 1
							&& firstFleet.hasShip(89, 0)
							&& isMaxProType0Model21Equipped;
					},
				"643": // F32 Have 1 Type 96 Land-based Attack Aircraft and 2 Type 97 Torpedo Bombers
					() => (KC3GearManager.countFree(168) >= 1
						&& KC3GearManager.countFree(16) >= 2
					),
				"645": // F41 Have 750 fuel, 750 ammo, 2 Drum Canisters and 1 Type 91 AP Shell
					() => (PlayerManager.hq.lastMaterial[0] >= 750
						&& PlayerManager.hq.lastMaterial[1] >= 750
						&& KC3GearManager.countFree(75) >= 2
						&& KC3GearManager.countFree(36) >= 1
					),
				"654": // F93 Have 1 Skilled Crew Member, 1500 ammo, 1500 bauxite. Ary Royal as secretary, equip her 1st slot with a maxed star Swordfish
					() => {
						const firstFleet = PlayerManager.fleets[0];
						const firstSlotGear = firstFleet.ship(0).equipment(0);
						const isMaxSwordfishEquipped = firstSlotGear.masterId === 242 && firstSlotGear.stars === 10;
						return PlayerManager.hq.lastMaterial[1] >= 1500
							&& PlayerManager.hq.lastMaterial[4] >= 1500
							&& PlayerManager.consumables.skilledCrew >= 1
							&& firstFleet.hasShip(515, 0)
							&& isMaxSwordfishEquipped;
					},
				"663": // F55 Have 18000 steel (scrapping not counted here)
					() => PlayerManager.hq.lastMaterial[2] >= 18000,
				"854": // Bq2 Sortie 1st fleet (sortie maps and battle ranks not counted here)
					() => KC3SortieManager.isOnSortie() && KC3SortieManager.fleetSent == 1,
				"861": // Bq3 Sortie 2 of BBV or AO
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return (fleet.countShipType(10) +
							fleet.countShipType(22)) >= 2;
					},
				"862": // Bq4 Sortie 1 AV, 2 CL
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType(16)
							&& fleet.countShipType(3) >= 2;
					},
				"872": // Bq10 Sortie 1st fleet
					() => KC3SortieManager.isOnSortie() && KC3SortieManager.fleetSent == 1,
				"873": // Bq5 Sortie 1 CL
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType(3);
					},
				"875": // Bq6 Sortie DesDiv 31
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShip([543]) // Naganami K2
							&& fleet.hasShip([
								345, 649, // Takanami Kai/K2
								359, 569, // Okinami Kai/K2
								344, 578, // Asashimo Kai/K2
							]);
					},
				"888": // Bq7 Sortie New Mikawa Fleet
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.countShip(69)  + // Choukai any remodel
							   fleet.countShip(61)  + // Aoba any remodel
							   fleet.countShip(123) + // Kinugasa any remodel
							   fleet.countShip(60)  + // Kako any remodel
							   fleet.countShip(59)  + // Furutaka any remodel
							   fleet.countShip(51)  + // Tenryuu any remodel
							   fleet.countShip(115)   // Yuubari any remodel
							>= 4;
					},
				"894": // Bq9 Sortie 1 CV(L/B)
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType([7, 11, 18]);
					},
				"903": // Bq13 Sortie Yuubari K2+ as flagship, 2 of 6th Torpedo Squad, or Yura K2
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						// Yuubari Kai Ni any variant as flagship
						return RemodelDb.remodelGroup(115).indexOf(fleet.ship(0).masterId) >= 2 && ((
							fleet.countShip(1)   + // Mutsuki any remodel
							fleet.countShip(2)   + // Kisaragi any remodel
							fleet.countShip(30)  + // Kikuzuki any remodel
							fleet.countShip(31)  + // Mochizuki any remodel
							fleet.countShip(164) + // Yayoi any remodel
							fleet.countShip(165)   // Uzuki any remodel
						) >= 2 || (
							fleet.hasShip([488])   // Yura K2
						));
					},
				"904": // By1 Sortie Ayanami K2, Shikinami K2
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShip([
							195, // Ayanami K2
							627, // Shikinami K2
						]);
					},
				"905": // By2 Sortie 3 DE, up to 5 ships
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.countShipType(1) >= 3 && fleet.countShips() <= 5;
					},
				"912": // By3 Sortie Akashi as flagship, 3 DD
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType(19, 0) && fleet.countShipType(2) >= 3;
					},
				"914": // By4 Sortie 3 CA, 1 DD
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.countShipType(5) >= 3 && fleet.countShipType(2) >= 1;
					},
				"928": // By5 Sortie 2 of Haguro/Ashigara/Myoukou/Takao/Kamikaze
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return (
							fleet.countShip(65)   + // Haguro any remodel
							fleet.countShip(64)   + // Ashigara any remodel
							fleet.countShip(62)   + // Myoukou any remodel
							fleet.countShip(66)   + // Takao any remodel
							fleet.countShip(471)    // Kamikaze any remodel
						) >= 2;
					},
				"944": // By6 Sortie CA/DD as flagship, 3 DD/DE (excluding flagship DD)
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType([2, 5], 0)
							&& (fleet.hasShipType(2, 0) ?
								fleet.countShipType(1) + (fleet.countShipType(2) - 1) >= 3 :
								fleet.countShipType([1, 2]) >= 3);
					},
				"945": // By7 Sortie CL/CT/DD as flagship, 3 DD/DE (excluding flagship DD)
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType([2, 3, 21], 0)
							&& (fleet.hasShipType(2, 0) ?
								fleet.countShipType(1) + (fleet.countShipType(2) - 1) >= 3 :
								fleet.countShipType([1, 2]) >= 3);
					},
				"946": // By8 Sortie CV(L/B) as flagship, 2 CA(V)
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShipType([7, 11, 18], 0)
							&& fleet.countShipType([5, 6]) >= 2;
					},
				"947": // By9 Sortie 2 CVL
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.countShipType(7) >= 2;
					},
				"948": // By10 Sortie 1st fleet with CV(L/B) as flagship
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleetSent == 1 && fleet.hasShipType([7, 11, 18], 0);
					},
				"973": // By11 Sortie 3 American/British ships without any carrier
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.countShipType([7, 11, 18]) === 0
							// replace ctype with by nation function in future?
							&& fleet.countShipClass([
								65, 69, 83, 84, 87, 91, 93, 95, 99, 102, 105, 106, 107, 110, 114, // US
								67, 78, 82, 88, 108, 112,                                         // UK
							]) >= 3;
					},
				"975": // By12 Sortie Isonami K2, Uranami K2, Ayanami K2, Shikinami K2
					({fleetSent = KC3SortieManager.fleetSent}) => {
						const fleet = PlayerManager.fleets[fleetSent - 1];
						return fleet.hasShip([666])  // Isonami K2
							&& fleet.hasShip([647])  // Uranami K2
							&& fleet.hasShip([195])  // Ayanami K2
							&& fleet.hasShip([627]); // Shikinami K2
					},
			};
			if(questObj.id && questCondsLibrary[questId]){
				return !!questCondsLibrary[questId].call(questObj, extraContexts);
			}
			// if no condition definition found, return undefined as 'unknown'
			return;
		},
		
		/* SAVE
		Write current quest data to localStorage
		------------------------------------------*/
		save :function(){
			// Store only the list. The actives and opens will be redefined on load()
			localStorage.quests = JSON.stringify(this.list);
			
			// Check if synchronization is enabled and quests list is not empty
			ConfigManager.loadIfNecessary();
			if (ConfigManager.chromeSyncQuests && Object.keys(this.list).length > 0) {
				const now = Date.now();
				KC3QuestSync.save(Object.assign(KC3QuestManager.getRepeatableResetTimes(now), {
					quests: localStorage.quests,
					syncTimeStamp: now,
				}));
			}
		},

		getRepeatableResetTimes: function (timestamp) {
			return KC3QuestManager.getRepeatableTypes().reduce((result, { type, key }) => {
				result[key] = KC3QuestManager.getResetTime(type, timestamp);
				return result;
			}, {});
		},
		
		/* LOAD
		Read and refill list from localStorage
		------------------------------------------*/
		load :function(){
			if(typeof localStorage.quests != "undefined"){
				var tempQuests = JSON.parse(localStorage.quests);
				this.list = {};
				var tempQuest;
				
				// Empty actives and opens since they will be re-added
				this.active = [];
				this.open = [];
				
				for(var ctr in tempQuests){
					tempQuest = tempQuests[ctr];
					
					// Add to actives or opens depending on status
					switch( tempQuest.status ){
						case 1:	// Unselected
							this.isOpen( tempQuest.id, true );
							this.isActive( tempQuest.id, false );
							break;
						case 2:	// Selected
							this.isOpen( tempQuest.id, true );
							this.isActive( tempQuest.id, true );
							break;
						case 3:	// Completed
							this.isOpen( tempQuest.id, false );
							this.isActive( tempQuest.id, false );
							break;
						default:
							this.isOpen( tempQuest.id, false );
							this.isActive( tempQuest.id, false );
							break;
					}
					
					// Add to manager's main list using Quest object
					this.list["q"+tempQuest.id] = new KC3Quest();
					this.list["q"+tempQuest.id].define( tempQuest );
				}
				// console.info("Quest management data loaded");
				return true;
			}
			return false;
		},

		mergeSyncData: function (remoteData) {
			var localQuests = KC3QuestManager.removeExpiredRepeatables(KC3QuestManager.getLocalData());
			var remoteQuests = KC3QuestManager.removeExpiredRepeatables(remoteData);

			var quests = KC3QuestManager.mergeQuests(remoteQuests, localQuests);

			KC3QuestManager.saveToLocal(quests, remoteData);
		},

		getLocalData: function () {
			return $.extend(KC3QuestManager.getRepeatableResetTimes(Date.now()), {
				quests: localStorage.quests || JSON.stringify({}),
			});
		},

		// Discard data for repeatable quests that have passed their reset time
		removeExpiredRepeatables: function (data) {
			var now = Date.now();
			return KC3QuestManager.getRepeatableTypes().reduce(function (quests, { key, type }) {
				var resetTime = parseInt(data[key], 10) || -1;
				if (now >= resetTime) {
					return KC3QuestManager.removeQuests(quests, KC3QuestManager.getRepeatableIds(type));
				}
				return quests;
			}, JSON.parse(data.quests));
		},

		removeQuests: function (quests, ids) {
			return ids.reduce(function (result, id) {
				result["q" + id] = null;
				return result;
			}, quests);
		},

		mergeQuests: function (remoteQuests, localQuests) {
			var ids = KC3QuestManager.getIdList(remoteQuests, localQuests);
			return ids.reduce(function (result, id) {
				var newState = KC3QuestManager.mergeQuestState(remoteQuests[id], localQuests[id]);
				if (newState) { result[id] = newState; }
				return result;
			}, {});
		},

		getIdList: function (remoteQuests, localQuests) {
			return Object.keys(localQuests).reduce(function (result, id) {
				if (!remoteQuests[id]) {
					result.push(id);
				}
				return result;
			}, Object.keys(remoteQuests));
		},

		mergeQuestState: function (remote, local) {
			if (!remote) { return local; }
			if (!local) { return remote; }

			if (remote.status === 3 && local.status !== 3) { return remote; }
			if (local.status === 3 && remote.status !== 3) { return local; }

			var result = KC3QuestManager.compareTrackingState(remote, local);
			if (result) { return result; }

			if (remote.progress || local.progress) {
				return (remote.progress || 0) > (local.progress || 0) ? remote : local;
			}

			return local;
		},

		compareTrackingState: function (remote, local) {
			var isRemoteValid = KC3QuestManager.isTrackingValid(remote);
			var isLocalValid = KC3QuestManager.isTrackingValid(local);

			if (isRemoteValid && !isLocalValid) { return remote; }
			if (isLocalValid && !isRemoteValid) { return local; }
			if (!isRemoteValid && !isLocalValid) { return null; }

			return KC3QuestManager.mergeTracking(remote, local);
		},

		// Check if the tracking property is defined correctly
		isTrackingValid: function (quest) {
			var meta = KC3Meta.quest(quest.id);
			if (!Array.isArray(quest.tracking) || !meta ||  !Array.isArray(meta.tracking)) {
				return false;
			}
			if (quest.tracking.length !== meta.tracking.length) {
				return false;
			}
			return quest.tracking.every(function (actual, index) {
				if (!actual || !Array.isArray(actual)) { return false; }
				var expected = meta.tracking[index];
				if (!expected || !Array.isArray(expected)) { return false; }
				return actual.length === expected.length;
			});
		},

		mergeTracking: function (remote, local) {
			// since validation passed, we know the two tracking arrays have the same length
			if (remote.tracking.length === 1) {
				return KC3QuestManager.selectSingleStageTracking(remote, local);
			} else if (remote.tracking.length >= 1) {
				return KC3QuestManager.mergeMultiStageTracking(remote, local);
			}
			// should be unreachable
			throw new Error('bad tracking array');
		},

		// Select the version with the higher progress
		selectSingleStageTracking: function (remote, local) {
			if (remote.tracking[0][0] > local.tracking[0][0]) {
				return remote;
			}
			return local;
		},

		// Combine versions for quests with multi-stage tracking (e.g. Bw1)
		mergeMultiStageTracking: function (remote, local) {
			// NB: result.progress may be incorrect
			// (shouldn't matter since multi-stage quests aren't auto-adjusted)
			return remote.tracking.reduce(function (result, stage, index) {
				result.tracking[index][0] = Math.max(stage[0], result.tracking[index][0]);
				return result;
			}, local);
		},

		saveToLocal: function (quests) {
			localStorage.quests = JSON.stringify(quests);

			KC3QuestManager.getRepeatableTypes().forEach(function ({ key }) {
				localStorage.removeItem(key);
			});
		},

		printError: function (e) {
			KC3Log.console.error(e, e.stack);
		},
	};
	
})();
