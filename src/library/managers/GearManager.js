/* GearManager.js
KC3改 Equipment Manager

Manages player equipment which indexes for data access.
Saves and loads list to and from localStorage
*/
(function(){
	"use strict";
	
	window.KC3GearManager = {
		list: {},
		max: 500,
		pendingGearNum: 0,
		unsetSlotitemByType2: {},

		// These IDs can be updated at `fud_weekly.json`
		carrierBasedAircraftType3Ids: [6,7,8,9,10,21,22,33,39,40,43,45,46,50,51],
		// Dupe `api_cost`, `api_distance` fixed for non aircraft gears since 2017-03-17
		// Type 21, 22 extended since 2023-02-14
		landBasedAircraftType3Ids: [6,7,8,9,10,21,22,33,37,38,39,40,43,44,45,46,47,48,49,50,51,56,57],
		antiAirFighterType2Ids: [6,7,8,11,45,56,57,58],
		antiAirLandBaseFighterType2Ids: [9,10,41,47,48,49,59,94],
		antiLandDiveBomberIds: [64,148,233,277,305,306,319,320,391,392,420,421,474],
		// Modifiers applied to enemy fleet's AA fire formula:
		// https://wikiwiki.jp/kancolle/%E5%AF%BE%E7%A9%BA%E7%A0%B2%E7%81%AB#avoid_AAfire
		evadeAntiAirFireIds: [79,80,81,93,94,99,100,143,144,154,170,199,200,208,224,237,319,320,322,323,343,374,388,404,405,406,433,444,453,454,466,474,475,476,479,481,484,487,490,491,504,545],
		highAltitudeInterceptorIds: [350,351,352],
		airStrikeBomberType2Ids: [7,8,11,41,47,53,57,58],
		aswAircraftType2Ids: [7,8,11,25,26,41,47,57,58],
		aswDepthChargeIds: [226,227,378,439,488],
		aswDepthChargeProjectorIds: [44,45,287,288,377,472],
		aswArmorPenetrationIds: [226,227,377,378,439,472,488],
		interceptorsType3Ids: [38,44,56,57],
		interceptorsType2Ids: [48],
		nightAircraftType3Ids: [45,46],

		carrierSupplyBauxiteCostPerSlot: 5,
		// LBAS mechanism still in progress
		landBaseSupplyBauxiteCostPerSlot: 5,
		landBaseSupplyFuelCostPerSlot: 3,
		landBaseBomberSortieFuelCostPerSlot: 1.5,
		landBaseOtherSortieFuelCostPerSlot: 1.0,
		landBaseBomberSortieAmmoCostPerSlot: 0.64,
		landBaseOtherSortieAmmoCostPerSlot: 0.6,
		landBaseReconnMaxSlot: 4,
		landBaseOtherMaxSlot: 18,
		landBaseReconnType2Ids: [9,10,41,49,59,94],
		// Newly implemented heavy bomber different max slot
		landBaseHeavyBomberMaxSlot: 9,
		landBaseHeavyBomberType2Ids: [53],
		landBaseHeavyBomberSortieFuelCostPerSlot: 2,
		landBaseHeavyBomberSortieAmmoCostPerSlot: 2,
		// Jet aircraft mechanism still in progress
		jetAircraftType2Ids: [56,57,58,59],
		jetBomberSteelCostRatioPerSlot: 0.2,
		// steel_consumption = floor(api_cost * current_slot * 0.2)

		getLandBaseSlotSize :function(type2Id) {
			if(KC3GearManager.landBaseReconnType2Ids.includes(type2Id))
				return KC3GearManager.landBaseReconnMaxSlot;
			else if(KC3GearManager.landBaseHeavyBomberType2Ids.includes(type2Id))
				return KC3GearManager.landBaseHeavyBomberMaxSlot;
			else return KC3GearManager.landBaseOtherMaxSlot;
		},

		// Daihatsu landing craft anti-installation power modifiers per types
		// Array format is [t2Bonus/t4Kai*2, t89Bonus/tokuHoni1Bonus/panzer3Bonus, normalBonus, shikonBonus, tokuBonus/panzer3Bonus, m4a1ddBonus/chihaBonus/ausfJBonus, abBonus/armedBonus/t4Tanks*2, panzer2Bonus]
		// see also: https://wikiwiki.jp/kancolle/%E5%AF%BE%E5%9C%B0%E6%94%BB%E6%92%83#AllBonusTable
		// All base modifiers for T2 Tank are fixed to 1.0 (out of date). T4 Tank variants not simply belonged to T2 Tank
		landingCraftModifiers: {
			// Soft-skinned (including Supply Depot Princess pre-cap bonus)
			0: {
				base:   [1.0, 1.4, 1.4, 1.4, 1.4,  1.4, 1.4, 1.4],
				count1: [1.5, 1.5, 1.0, 1.0, 1.15, 1.1, 1.1, 1.5],
				count2: [1.2, 1.3, 1.0, 1.0, 1.0,  1.0, 1.1, 1.0],
			},
			// Artillery Imp
			1: {
				base:   [1.0,  1.8, 1.8, 1.8, 1.8,  1.8, 1.8, 1.8],
				count1: [2.4,  1.5, 1.0, 1.0, 1.15, 2.0, 1.3, 1.5],
				count2: [1.35, 1.4, 1.0, 1.0, 1.0,  1.0, 1.2, 1.0],
			},
			// Isolated Island Princess
			2: {
				base:   [1.0,  1.8, 1.8, 1.8, 1.8,  1.8, 1.8, 1.8],
				count1: [2.4,  1.2, 1.0, 1.0, 1.15, 1.8, 1.3, 1.2],
				count2: [1.35, 1.4, 1.0, 1.0, 1.0,  1.0, 1.1, 1.0],
			},
			// Supply Depot Princess for post-cap bonus only
			3: {
				base:   [1.0, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7],
				count1: [1.7, 1.3, 1.0, 1.0, 1.0, 1.2, 1.5, 1.3],
				count2: [1.5, 1.6, 1.0, 1.0, 1.0, 1.0, 1.1, 1.0],
			},
			// Summer Harbor Princess
			4: {
				base:   [1.0, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7],
				count1: [2.8, 1.6, 1.0, 1.0, 1.2, 2.0, 1.5, 1.6],
				count2: [1.5, 1.5, 1.0, 1.0, 1.0, 1.0, 1.1, 1.0],
			},
		},

		// Get a specific item by ID
		// NOTE: if you want to write test-cases, avoid setting KC3GearManager.list["x0"]
		// because it'll never be retrieved by "get(0)"
		get :function( itemId ){
			itemId = parseInt(itemId,10);
			// in KCSAPI some item values has special meanings on
			// 0 (e.g. ex_slot == 0 means the slot is available but nothing is equipped.)

			// assuming itemId starts from 1
			// so it's safe to just return an empty gear when itemId <= 0
			return (itemId <= 0)
			  ? (new KC3Gear())
			  : (this.list["x"+itemId] || new KC3Gear());
		},

		// Count number of items
		// - when "cond" is given, count items satisfying "cond"
		//   and pending items are not included
		// - when "cond" is not given, count items
		//   including pending ones.
		count :function( cond ){
			if (typeof cond === "undefined") {
				return Object.size(this.list) + this.pendingGearNum;
			}
			var n = 0;
			var x;
			for (var ind in this.list) {
				x = this.list[ind];
				if (cond.call(x, x)) {
					n += 1;
				}
			}
			return n;
		},
		
		// Count number of equipment by master item
		countByMasterId :function(slotitem_id, isUnlock, isNoStar){
			return this.count(gear => (
				gear.masterId == slotitem_id
					&& (!isUnlock || !gear.lock)
					&& (!isNoStar || !gear.stars)
			));
		},
		
		// Count number of equipment without useitem-like ones, added since 2022-01-21 @ `main.js#SlotitemModelHolder.prototype.num`
		countNonUseitem :function(){
			return this.count(gear => (
				// Repair Personnel, Repair Goddess, Combat Ration, Underway Replenishment, Canned Saury, Special Onigiri
				![42, 43, 145, 146, 150, 241].includes(gear.masterId)
			)) + this.pendingGearNum;
		},
		
		// To collect unequipped slotitem ID list,
		// but correctly should search in `unsetSlotitemByType2` from `api_get_member/unsetslot`.
		collectEquippedIds :function(lbasIncluded = true){
			const heldRosterIds = [];
			const rosterIdFilter = id => id > 0;
			const landBasePlaneIdMap = p => p.api_slotid;
			// Collect roster IDs of equipped (held) items by ships, land bases (optional)
			// Assume KC3ShipManager and PlayerManager are up to date
			for(let key in KC3ShipManager.list){
				heldRosterIds.push(...KC3ShipManager.list[key].items.filter(rosterIdFilter));
			}
			if(lbasIncluded){
				for(let base of PlayerManager.bases){
					heldRosterIds.push(...base.planes.map(landBasePlaneIdMap).filter(rosterIdFilter));
				}
				for(let id of PlayerManager.baseConvertingSlots){
					heldRosterIds.push(id);
				}
			}
			return heldRosterIds;
		},
		
		// Find specific piece of equipment equipped on which ship or land-base,
		// Will return an Array if aircraft is moving from a land-base.
		equippedBy :function(itemId){
			if(itemId > 0 && this.get(itemId).exists()){
				const rosterIdFilter = id => id === itemId;
				const landBasePlaneIdMap = p => p.api_slotid;
				for(let key in KC3ShipManager.list){
					const ship = KC3ShipManager.list[key];
					if(ship.items.some(rosterIdFilter) || ship.ex_item === itemId)
						return ship;
				}
				for(let base of PlayerManager.bases){
					if(base.planes.map(landBasePlaneIdMap).some(rosterIdFilter))
						return base;
				}
				if(PlayerManager.baseConvertingSlots.includes(itemId)){
					return PlayerManager.baseConvertingSlots;
				}
				return false;
			}
			// returning undefined indicates invalid item
			return;
		},
		
		// Count number of equipment is not equipped by any ship or land-base
		countFree :function(slotitem_id, isUnlock, isNoStar){
			const heldRosterIds = this.collectEquippedIds(true);
			return this.count(gear => (
				gear.masterId == slotitem_id
					&& heldRosterIds.indexOf(gear.itemId) === -1
					&& (!isUnlock || !gear.lock)
					&& (!isNoStar || !gear.stars)
			));
		},
		
		// Look for items by specified conditions
		find :function( cond ){
			var result = [];
			var x;
			for(var i in this.list) {
				x = this.list[i];
				if(cond.call(x, x)) {
					result.push(x);
				}
			}
			return result;
		},
		
		// Look for equipment is not equipped by any ship or land-base
		findFree :function( cond ){
			const heldRosterIds = this.collectEquippedIds(true);
			return this.find(g => (
				heldRosterIds.indexOf(g.itemId) === -1 && cond.call(g, g)
			));
		},
		
		// Add or replace an item on the list
		add :function(data){
			if(typeof data.api_id != "undefined"){
				this.list["x"+data.api_id] = new KC3Gear(data);
			}else if(typeof data.itemId != "undefined"){
				this.list["x"+data.itemId] = new KC3Gear(data);
			}
		},
		
		// Mass set multiple items
		set :function(data){
			var ctr;
			for(ctr in data){
				if(!!data[ctr]){
					this.add(data[ctr]);
				}
			}
			this.save();
		},
		
		// Remove item from the list
		remove :function( itemId ){
			delete this.list["x"+itemId];
		},
		
		// Save item list onto local storage
		clear: function(){
			this.list = {};
		},
		
		// Save item list onto local storage
		save: function(){
			localStorage.gears = JSON.stringify(this.list);
		},
		
		// Load from storage and add each one to manager list
		load: function(){
			if(typeof localStorage.gears != "undefined"){
				this.clear();
				var GearList = JSON.parse(localStorage.gears);
				for(var ctr in GearList){
					this.add( GearList[ctr] );
				}
				return true;
			}
			return false;
		}
		
	};
	
})();
