/* PlayerManager.js
KC3改 Player Manager

Manages info about the player and all its holdings
Includes HQ, Fleets, Docks, LandBases
Does not include Ships and Gears which are managed by other Managers
*/
(function(){
	"use strict";

	window.PlayerManager = {
		hq: {},
		consumables: {},
		fleets: [],
		bases: [],
		baseConvertingSlots: [],
		fleetCount: 1,
		questCount: 5,
		repairSlots: 2,
		repairShips: [-1,-1,-1,-1,-1],
		buildSlots: 2,
		combinedFleet: 0,
		friendlySettings: {},
		extraSupply: [0, 0],
		statistics: {},
		maxResource: 300000,
		maxConsumable: 3000,
		maxCoin: 200000,

		init :function(){
			this.hq = new KC3Player();
			this.consumables = {
				fcoin: 0,
				buckets : 0,
				devmats : 0,
				screws: 0,
				torch: 0,
				medals: 0,
				blueprints: 0
			};
			this.fleets = [
				new KC3Fleet(),
				new KC3Fleet(),
				new KC3Fleet(),
				new KC3Fleet()
			];
			this.bases = [
				new KC3LandBase(),
				new KC3LandBase(),
				new KC3LandBase(),
				new KC3LandBase()
			];
			this.akashiRepair = new KC3AkashiRepair();
			return this;
		},

		setHQ :function( serverSeconds, data ){
			// Check if player suddenly changed
			if(this.hq.id !== 0 && this.hq.id != data.mid){
				this.hq.logout();
				this.hq = new KC3Player();
			}
			// Update player with new data
			this.hq.update( data );
			this.hq.save();
			
			// Update related managers with new data if exists
			Object.assignIfDefined(PlayerManager.consumables, "fcoin", data.fcoin);
			PlayerManager.fleetCount = data.fleetCount;
			PlayerManager.questCount = data.questCount;
			PlayerManager.repairSlots = data.repairSlots;
			PlayerManager.buildSlots = data.buildSlots;
			KC3ShipManager.max = data.maxShipSlots;
			// Not sure why, but always shown +3 at client side. see #1860
			KC3GearManager.max = 3 + data.maxGearSlots;

			// Record values of recent hour if necessary
			if(typeof localStorage.lastExperience == "undefined"){ localStorage.lastExperience = 0; }
			var currentHour = Math.floor(serverSeconds / 3600);
			if(currentHour == localStorage.lastExperience){ return this; }
			localStorage.lastExperience = currentHour;
			KC3Database.Experience({
				exp  : data.exp,
				level: data.level,
				hour : currentHour
			});
			return this;
		},

		setFleets :function( data ){
			var self = this;
			[0,1,2,3].forEach(function(i){
				self.fleets[i].update( data[i] || {} );
			});
			this.saveFleets();
			return this;
		},

		setBases :function( data ){
			var self = this;
			Array.numbers(0, data.length < 4 ? 3 : data.length - 1)
				.forEach(function(i){
				self.bases[i] = new KC3LandBase(data[i]);
				});
			if(self.bases.length > 4 && data.length < self.bases.length){
				self.bases.splice(data.length < 4 ? 4 : data.length);
			}
			this.saveBases();
			localStorage.setObject("baseConvertingSlots", self.baseConvertingSlots);
			return this;
		},

		setBasesOnWorldMap :function( data ){
			var airBase = data.api_air_base,
				mapInfo = data.api_map_info;
			if(typeof airBase !== "undefined") {
				// Map and keep World IDs only
				var openedWorldIds = (mapInfo || []).map(m => m.api_id)
					.map(id => String(id).slice(0, -1));
				// Remove duplicate IDs
				openedWorldIds = [...new Set(openedWorldIds)];
				// Filter unset land bases after event if event world API data still exist
				var openedBases = airBase.filter(ab => openedWorldIds.indexOf(String(ab.api_area_id)) > -1);
				this.setBases(openedBases);
				return true;
			} else if(this.bases[0].map > 0) {
				// Clean land bases after event if World 6 not opened
				this.setBases([]);
				return true;
			}
			// No base is set, tell invoker
			return false;
		},

		setBaseConvertingSlots :function( data ){
			// Clear Array to empty (reference unchanged)
			this.baseConvertingSlots.length = 0;
			if(typeof data !== "undefined") {
				// Let client know: these types of slotitem are free to equipped.
				// KC3 does not track them for now.
				/*
				if(!!data.api_unset_slot){
					// Same structure with `api_get_member/require_info.api_unsetslot`
				}
				*/
				// Let client know: these slotitems are moving, not equippable.
				// For now, moving period of LBAS plane is 12 mins.
				if(Array.isArray(data.api_base_convert_slot)) {
					[].push.apply(this.baseConvertingSlots, data.api_base_convert_slot);
				}
			}
			localStorage.setObject("baseConvertingSlots", this.baseConvertingSlots);
			return this;
		},

		setRepairDocks :function( data ){
			// clone last repairing ship list, empty current list
			const lastRepair = this.repairShips.splice(0);
			this.repairShips.push(-1);
			const dockingShips = [];
			const self = this;
			$.each(data, function(ctr, ndock){
				const dockNum = ndock.api_id;
				const shipRosterId = ndock.api_ship_id;
				// check if not in the repairing list, mark as repaired
				if(lastRepair[dockNum] > 0 && lastRepair[dockNum] != shipRosterId) {
					KC3ShipManager.get(lastRepair[dockNum]).applyRepair();
				}
				if(ndock.api_state > 0){
					self.repairShips[dockNum] = shipRosterId;
					dockingShips.push( {
						id: shipRosterId,
						completeTime: ndock.api_complete_time
					} );
					KC3TimerManager.repair(dockNum).activate(
						ndock.api_complete_time,
						KC3ShipManager.get(shipRosterId).masterId,
						undefined,
						shipRosterId
					);
				}else{
					self.repairShips[dockNum] = -1;
					KC3TimerManager.repair(dockNum).deactivate();
				}
			});
			// "localStorage.dockingShips" is not supposed
			// to be modified,
			// it record the most recent docking ships
			// whenever a docking event comes
			localStorage.dockingShips = JSON.stringify(dockingShips);
			return this;
		},

		// cached docking ships' status
		// the return value is an object whose properties are "x{ship_id}"
		// with value set to the completeTime
		getCachedDockingShips: function() {
			var dockingShips = {};
			if (typeof localStorage.dockingShips !== "undefined") {
				try {
					var ndockData = JSON.parse( localStorage.dockingShips );
					$.each(ndockData, function (i, v) {
						var key = "x" + v.id.toString();
						dockingShips[key] = v.completeTime;
					});
				} catch (err) {
					console.error("Error while processing cached docking ship", err);
				}
			}
			return dockingShips;
		},

		setBuildDocks :function( data ){
			const buildingShips = [];
			$.each(data, function(ctr, kdock){
				if(kdock.api_state > 0){
					const faceId = kdock.api_created_ship_id;
					const timer = KC3TimerManager.build( kdock.api_id );
					timer.activate(
						kdock.api_complete_time,
						faceId
					);
					if(kdock.api_item1 > 999){
						timer.lsc = true;
					}else{
						timer.lsc = false;
					}
					timer.newShip = ConfigManager.info_dex_owned_ship ?
						! PictureBook.isEverOwnedShip(faceId) :
						! KC3ShipManager.masterExists(faceId);
				}else{
					KC3TimerManager.build( kdock.api_id ).deactivate();
				}
				buildingShips.push({
					num: kdock.api_id,
					state: kdock.api_state,
					id: kdock.api_created_ship_id,
					completeTime: kdock.api_complete_time,
					lsc: kdock.api_item1 > 999,
				});
			});
			localStorage.buildingShips = JSON.stringify(buildingShips);
			return this;
		},

		setBuildDocksByCache :function(){
			if(!!localStorage.buildingShips){
				try {
					const buildingShips = JSON.parse(localStorage.buildingShips);
					$.each(buildingShips, function(idx, kdock){
						if(kdock.state > 0){
							const faceId = kdock.id;
							const timer = KC3TimerManager.build(kdock.num);
							timer.activate(kdock.completeTime, faceId);
							timer.lsc = kdock.lsc;
							timer.newShip = ConfigManager.info_dex_owned_ship ?
								! PictureBook.isEverOwnedShip(faceId) :
								! KC3ShipManager.masterExists(faceId);
						} else {
							KC3TimerManager.build(kdock.num).deactivate();
						}
					});
				} catch (err) {
					console.error("Error while processing cached building ship", err);
				}
			}
			return this;
		},

		// data array always: [fuel, ammo, steel, bauxite]
		setResources :function( serverSeconds, absData, deltaData ){
			// Only for displaying, because accuracy depends on previous values
			if(Array.isArray(deltaData) && deltaData.length === 4){
				this.hq.lastMaterial[0] += deltaData[0] || 0;
				this.hq.lastMaterial[1] += deltaData[1] || 0;
				this.hq.lastMaterial[2] += deltaData[2] || 0;
				this.hq.lastMaterial[3] += deltaData[3] || 0;
				// Limit resource values between [0, 300000]
				this.hq.lastMaterial.map((v, i) => {
					this.hq.lastMaterial[i] = v.valueBetween(0, this.maxResource);
				});
				this.hq.save();
				return this;
			}
			// Sync with API absolute values and save to storage
			if(!Array.isArray(absData) || absData.length !== 4){ return this; }
			this.hq.lastMaterial = absData;
			this.hq.save();
			// Record values of recent hour if necessary
			if(typeof localStorage.lastResource == "undefined"){ localStorage.lastResource = 0; }
			var currentHour = Math.floor(serverSeconds / 3600);
			if(currentHour == localStorage.lastResource){ return this; }
			localStorage.lastResource = currentHour;
			KC3Database.Resource({
				rsc1 : absData[0],
				rsc2 : absData[1],
				rsc3 : absData[2],
				rsc4 : absData[3],
				hour : currentHour
			});
			return this;
		},

		// To only save consumables to localStorage without DB recording, let dataObj falsy
		// basic 4 consumables represented in array always: [torch, buckets, devmats, screws]
		setConsumables :function( serverSeconds, dataObj, deltaArray ){
			// Only for displaying, because accuracy depends on previous values
			if(Array.isArray(deltaArray) && deltaArray.length === 4){
				this.consumables.torch += deltaArray[0] || 0;
				this.consumables.torch = this.consumables.torch.valueBetween(0, this.maxConsumable);
				this.consumables.buckets += deltaArray[1] || 0;
				this.consumables.buckets = this.consumables.buckets.valueBetween(0, this.maxConsumable);
				this.consumables.devmats += deltaArray[2] || 0;
				this.consumables.devmats = this.consumables.devmats.valueBetween(0, this.maxConsumable);
				this.consumables.screws += deltaArray[3] || 0;
				this.consumables.screws = this.consumables.screws.valueBetween(0, this.maxConsumable);
				localStorage.consumables = JSON.stringify(this.consumables);
				return this;
			}
			// Merge and save consumables data to storage
			$.extend(this.consumables, dataObj);
			localStorage.consumables = JSON.stringify(this.consumables);
			// Record values of recent hour if necessary
			if(typeof localStorage.lastUseitem == "undefined"){ localStorage.lastUseitem = 0; }
			var currentHour = Math.floor(serverSeconds / 3600);
			if(currentHour == localStorage.lastUseitem || !dataObj || Object.keys(dataObj).length < 4){
				return this;
			}
			localStorage.lastUseitem = currentHour;
			KC3Database.Useitem({
				torch : this.consumables.torch,
				bucket : this.consumables.buckets,
				devmat : this.consumables.devmats,
				screw : this.consumables.screws,
				hour : currentHour
			});
			return this;
		},

		setStatistics :function( data ){
			const oldStatistics = JSON.parse(localStorage.statistics || '{"exped":{},"pvp":{},"sortie":{}}');
			const newStatistics = {
				exped: {
					rate: Number(data.exped.rate) || 0,
					total: Number(data.exped.total || oldStatistics.exped.total) || 0,
					success: Number(data.exped.success || oldStatistics.exped.success) || 0
				},
				pvp: {
					rate: Number(data.pvp.rate) || 0,
					win: Number(data.pvp.win || oldStatistics.pvp.win) || 0,
					lose: Number(data.pvp.lose || oldStatistics.pvp.lose) || 0,
					// these properties are always 0, maybe deprecated by devs, here ignored
					//attacked: data.pvp.attacked || oldStatistics.pvp.attacked,
					//attacked_win: data.pvp.attacked_win || oldStatistics.pvp.attacked_win
				},
				sortie: {
					rate: Number(data.sortie.rate) || 0,
					win: Number(data.sortie.win || oldStatistics.sortie.win) || 0,
					lose: Number(data.sortie.lose || oldStatistics.sortie.lose) || 0
				}
			};
			// only `api_get_member/record` offer us `rate` (as string) values,
			// to get the rates before entering record screen, have to compute them by ourselves.
			// rate is displayed after a 'Math.round' in-game, although raw api data keeps 2 decimals,
			// but an exception: `api_war.api_rate` is not multiplied by 100, so no decimal after % it.
			// see `api_get_member/record` function at `Kcsapi.js`
			const getRate = (win = 0, lose = 0, total = undefined) => {
				// different with in-game displaying integer, we always keep 2 decimals
				let rate = Math.qckInt("floor", win / (total === undefined ? win + lose : total) * 100, 2);
				if(isNaN(rate) || rate === Infinity) rate = 0;
				return rate;
			};
			if(!newStatistics.sortie.rate) {
				newStatistics.sortie.rate = getRate(newStatistics.sortie.win, newStatistics.sortie.lose);
			}
			if(!newStatistics.pvp.rate) {
				newStatistics.pvp.rate = getRate(newStatistics.pvp.win, newStatistics.pvp.lose);
			}
			if(!newStatistics.exped.rate) {
				newStatistics.exped.rate = getRate(newStatistics.exped.success, 0, newStatistics.exped.total);
			}
			localStorage.statistics = JSON.stringify(newStatistics);
			return this;
		},

		setNewsfeed :function( data, timestamp = Date.now() ){
			//console.log("newsfeed", data);
			localStorage.playerNewsFeed = JSON.stringify({ time: timestamp, log: data });
			// Give up to save into DB, just keep recent 6 logs
			return this;
			// No way to track which logs are already recorded,
			// because no cursor/timestamp/state could be found in API
			/*
			$.each(data, function( index, element){
				if(parseInt(element.api_state, 10) !== 0){
					KC3Database.Newsfeed({
						type: element.api_type,
						message: element.api_message,
						time: timestamp
					});
				}
			});
			*/
		},

		// make sure to "loadFleets" before calling this function.
		prepareDeckbuilder: function() {
			return {
				version: 4,
				hqlv: PlayerManager.hq.level,
				f1: PlayerManager.fleets[0].deckbuilder(),
				f2: PlayerManager.fleets[1].deckbuilder(),
				f3: PlayerManager.fleets[2].deckbuilder(),
				f4: PlayerManager.fleets[3].deckbuilder()
			};
		},

		// Refresh last home port time and material regeneration
		// Partially same effects with `setResources`
		portRefresh :function( serverSeconds, absMaterial ){
			var self = this;

			if(!(this.hq.lastPortTime && this.hq.lastMaterial)) {
				if(!this.hq.lastPortTime)
					this.hq.lastPortTime = serverSeconds;
				if(!this.hq.lastMaterial)
					this.hq.lastMaterial = absMaterial;
				return this;
			}

			this.akashiRepair.onPort(this.fleets);

			var
				// get current player regen cap
				regenCap  = this.hq.getRegenCap(),
				// get regen time
				regenTime = {
					// find next multiplier of 3 from last time
					start: Math.hrdInt("ceil" ,this.hq.lastPortTime,Math.log10(3 * 60),1),
					// find last multiplier of 3 that does not exceeds the current time
					end  : Math.hrdInt("floor",serverSeconds,Math.log10(3 * 60),1),
				},
				// get regeneration ticks
				regenRate = Math.max(0,regenTime.end - regenTime.start + 1),
				// set regeneration amount
				regenVal  = [3,3,3,1]
					.map(function(x){return regenRate * x;})
					.map(function(x,i){return Math.max(0,Math.min(x,regenCap - self.hq.lastMaterial[i]));});
			console.log("Last port", this.hq.lastPortTime, regenTime, serverSeconds);
			// Check whether a server time is supplied, or keep the last refresh time.
			this.hq.lastPortTime = serverSeconds || this.hq.lastPortTime;
			console.log("Regenerated materials", regenVal);
			console.log("Materials before after", this.hq.lastMaterial, absMaterial);
			KC3Database.Naverall({
				hour:Math.hrdInt('floor',serverSeconds/3.6,3,1),
				type:'regen',
				data:regenVal.concat([0,0,0,0])
			});
			this.hq.lastMaterial = absMaterial || this.hq.lastMaterial;

			this.hq.save();
			return this;
		},

		saveFleets :function(){
			localStorage.fleets = JSON.stringify(this.fleets);
			return this;
		},

		loadFleets :function(){
			if(typeof localStorage.fleets != "undefined"){
				var oldFleets =JSON.parse( localStorage.fleets );
				this.fleets = this.fleets.map(function(x,i){
					return (new KC3Fleet()).defineFormatted(oldFleets[i]);
				});
			}
			return this;
		},

		loadConsumables :function(){
			if(typeof localStorage.consumables != "undefined"){
				this.consumables = $.extend(this.consumables, JSON.parse(localStorage.consumables));
			}
			return this;
		},

		getConsumableById :function(useitemId, attrNameOnly = false){
			// ID mapping see also `api_get_member/useitem` at Kcsapi.js#282
			const attrNameMap = {
				"1": "buckets",
				"2": "torch",
				"3": "devmats",
				"4": "screws",
				"10": "furniture200",
				"11": "furniture400",
				"12": "furniture700",
				"31": "fuel",
				"32": "ammo",
				"33": "steel",
				"34": "bauxite",
				"44": "fcoin",
				"49": "dockKey",
				"50": "repairTeam",
				"51": "repairGoddess",
				"52": "furnitureFairy",
				"53": "portExpansion",
				"54": "mamiya",
				"55": "ring",
				"56": "chocolate",
				"57": "medals",
				"58": "blueprints",
				"59": "irako",
				"60": "presents",
				"61": "firstClassMedals",
				"62": "hishimochi",
				"63": "hqPersonnel",
				"64": "reinforceExpansion",
				"65": "protoCatapult",
				"66": "ration",
				"67": "resupplier",
				"68": "mackerel",
				"69": "mackerelCan",
				"70": "skilledCrew",
				"71": "nEngine",
				"72": "decoMaterial",
				"73": "constCorps",
				"74": "newAircraftBlueprint",
				"75": "newArtilleryMaterial",
				"76": "rationSpecial",
				"77": "newAviationMaterial",
				"78": "actionReport",
				"79": "straitMedal",
				"80": "xmasGiftBox",
				"81": "shogoMedalHard",
				"82": "shogoMedalNormal",
				"83": "shogoMedalEasy",
				"84": "shogoMedalCasual",
				"85": "rice",
				"86": "umeboshi",
				"87": "nori",
				"88": "tea",
				"89": "dinnerTicket",
				"90": "setsubunBeans",
				"91": "emergencyRepair",
				"92": "newRocketDevMaterial",
				"93": "sardine",
			};
			// You may need to `loadConsumables` first for Strategy Room
			return useitemId === undefined ? attrNameMap :
				attrNameOnly ? attrNameMap[useitemId] : this.consumables[attrNameMap[useitemId]];
		},

		saveBases :function(){
			localStorage.bases = JSON.stringify(this.bases);
			return this;
		},

		loadBases :function(){
			if(typeof localStorage.bases != "undefined"){
				var oldBases = JSON.parse( localStorage.bases );
				this.bases = oldBases.map(function(baseData){
					return (new KC3LandBase()).defineFormatted(baseData);
				});
			}
			if(typeof localStorage.baseConvertingSlots != "undefined"){
				this.baseConvertingSlots = localStorage.getObject("baseConvertingSlots");
			}
			return this;
		},

		cloneFleets :function(){
			return this.fleets.map(function(x,i){
				return x.ships.map(function(s){
					return new KC3Ship(KC3ShipManager.get(s));
				});
			});
		}
		
	};

})();
