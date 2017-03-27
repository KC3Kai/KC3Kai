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
		repairSlots: 2,
		repairShips: [-1,-1,-1,-1,-1],
		buildSlots: 2,
		combinedFleet: 0,
		statistics: {},
		maxResource: 300000,
		maxConsumable: 3000,

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
			return this;
		},

		setHQ :function( data ){
			// Check if player suddenly changed
			if(this.hq.id !== 0 && this.hq.id != data.mid){
				this.hq.logout();
				this.hq = new KC3Player();
			}
			// Update player with new data
			this.hq.update( data );
			this.hq.save();
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
				// For now, moving peroid of LBAS plane is 12 mins.
				if(Array.isArray(data.api_base_convert_slot)) {
					[].push.apply(this.baseConvertingSlots, data.api_base_convert_slot);
				}
			}
			localStorage.setObject("baseConvertingSlots", this.baseConvertingSlots);
			return this;
		},

		setRepairDocks :function( data ){
			var lastRepair = this.repairShips.map(function(x){return x;}); // clone
			this.repairShips.splice(0);
			var dockingShips = [];
			var self = this;
			$.each(data, function(ctr, ndock){
				if(lastRepair[ndock.api_id] != ndock.api_ship_id) { // check if not in the list (repaired)
					KC3ShipManager.get(lastRepair[ndock.api_id]).applyRepair();
				}

				if(ndock.api_state > 0){
					self.repairShips[ ndock.api_id ] = ndock.api_ship_id;
					var repairInfo =
						{ id: ndock.api_ship_id,
						  completeTime: ndock.api_complete_time
						};
					dockingShips.push( repairInfo );
					KC3TimerManager.repair( ndock.api_id ).activate(
						ndock.api_complete_time,
						KC3ShipManager.get( ndock.api_ship_id ).masterId
					);
				}else{
					KC3TimerManager.repair( ndock.api_id ).deactivate();
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
					console.error( "Error while processing cached docking ship" );
					console.error(err);
				}
			}
			return dockingShips;
		},

		setBuildDocks :function( data ){
			$.each(data, function(ctr, kdock){
				if(kdock.api_state > 0){
					KC3TimerManager.build( kdock.api_id ).activate(
						kdock.api_complete_time,
						kdock.api_created_ship_id
					);
					if(kdock.api_item1 > 999){
						KC3TimerManager.build( kdock.api_id ).lsc = true;
					}else{
						KC3TimerManager.build( kdock.api_id ).lsc = false;
					}
				}else{
					KC3TimerManager.build( kdock.api_id ).deactivate();
				}
			});
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
			var oldStatistics = JSON.parse(localStorage.statistics || "{\"exped\":{},\"pvp\":{},\"sortie\":{}}");
			var newStatistics = {
				exped: {
					rate: data.exped.rate || oldStatistics.exped.rate || 0,
					total: data.exped.total || oldStatistics.exped.total,
					success: data.exped.success || oldStatistics.exped.success
				},
				pvp: {
					rate: data.pvp.rate || oldStatistics.pvp.rate || 0,
					win: data.pvp.win || oldStatistics.pvp.win,
					lose: data.pvp.lose || oldStatistics.pvp.lose,
					attacked: data.pvp.attacked || oldStatistics.pvp.attacked,
					attacked_win: data.pvp.attacked_win || oldStatistics.pvp.attacked_win
				},
				sortie: {
					rate: data.sortie.rate || oldStatistics.sortie.rate || 0,
					win: data.sortie.win || oldStatistics.sortie.win,
					lose: data.sortie.lose || oldStatistics.sortie.lose
				}
			};
			if(newStatistics.sortie.rate===0){
				newStatistics.sortie.rate = Math.round(newStatistics.sortie.win / (newStatistics.sortie.win + newStatistics.sortie.lose) * 10000)/100;
			}
			if(newStatistics.pvp.rate===0){
				newStatistics.pvp.rate = Math.round(newStatistics.pvp.win / (newStatistics.pvp.win + newStatistics.pvp.lose) *10000)/100;
			}
			if(newStatistics.exped.rate===0){
				newStatistics.exped.rate =  Math.round(newStatistics.exped.success / newStatistics.exped.total * 10000)/100;
			}
			// console.log("rates", newStatistics.sortie.rate, newStatistics.pvp.rate, newStatistics.exped.rate);
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

			this.fleets.forEach(function(fleet){ fleet.checkAkashi(); });

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
			console.log(this.hq.lastPortTime,regenTime,serverSeconds);
			// Check whether a server time is supplied, or keep the last refresh time.
			this.hq.lastPortTime = serverSeconds || this.hq.lastPortTime;
			console.info("regen" ,regenVal);
			console.info.apply(console,["pRegenMat"].concat(this.hq.lastMaterial));
			console.info.apply(console,["actualMat"].concat((this.hq.lastMaterial || []).map(function(x,i){
				return (x || 0) + regenVal[i];
			})));
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
				this.consumables =  $.extend(this.consumables, JSON.parse(localStorage.consumables));
			}
			return this;
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

		isBasesSupplied :function(){
			return this.bases.every(function(base){
				return base.isPlanesSupplied();
			});
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
