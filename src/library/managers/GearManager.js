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

		// These IDs can be updated at `fud_weekly.json`
		carrierBasedAircraftType3Ids: [6,7,8,9,10,21,22,33,39,40,43,45,46],
		// Dupe `api_cost`, `api_distance` fixed for non aircraft gears since 2017-03-17
		landBasedAircraftType3Ids: [6,7,8,9,10,33,37,38,39,40,43,44,45,46,47],
		antiAirFighterType2Ids: [6,7,8,11,45,47,48,56,57],
		airStrikeBomberType2Ids: [7,8,11,41,47,57,58],
		aswAircraftType2Ids: [7,8,11,25,26,41,47,57,58],
		interceptorsType3Ids: [38,44],
		nightAircraftType3Ids: [45,46],

		carrierSupplyBauxiteCostPerSlot: 5,
		// LBAS mechanism still in progress
		landBaseSupplyBauxiteCostPerSlot: 5,
		landBaseSupplyFuelCostPerSlot: 3,
		landBaseBomberSortieFuelCostPerSlot: 1.5,
		landBaseReconnSortieFuelCostPerSlot: 1.0,
		landBaseOtherSortieFuelCostPerSlot: 1.0,
		landBaseBomberSortieAmmoCostPerSlot: 0.67,
		landBaseReconnSortieAmmoCostPerSlot: 0.75,
		landBaseOtherSortieAmmoCostPerSlot: 0.62,
		landBaseReconnMaxSlot: 4,
		landBaseOtherMaxSlot: 18,
		landBaseReconnType2Ids: [9,10,41],
		// Jet aircraft mechanism still in progress
		jetAircraftType2Ids: [56,57,58,59],
		jetBomberSteelCostRatioPerSlot: 0.2,
		// steel_consumption = floor(api_cost * current_slot * 0.2)

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
				if (cond.call(x,x)) {
					n += 1;
				}
			}
			return n;
		},
		
		// Count number of equipment by master item
		countByMasterId :function(slotitem_id){
			return this.count( function() {
				return this.masterId == slotitem_id;
			});
		},
		
		// Count number of equipment is not equipped by any ship or land-base
		// Assume KC3ShipManager and PlayerManager are up to date
		countFree :function(slotitem_id, isUnlock){
			const heldRosterIds = [];
			const rosterIdFilter = id => id > 0;
			const landBasePlaneIdMap = p => p.api_slotid;
			// Collect roster IDs of equipped (held) items by ships, land bases
			for(let key in KC3ShipManager.list){
				heldRosterIds.push(...KC3ShipManager.list[key].items.filter(rosterIdFilter));
			}
			for(let base of PlayerManager.bases){
				heldRosterIds.push(...base.planes.map(landBasePlaneIdMap).filter(rosterIdFilter));
			}
			for(let id of PlayerManager.baseConvertingSlots){
				heldRosterIds.push(id);
			}
			return this.count( gear => {
				return gear.masterId == slotitem_id
					&& heldRosterIds.indexOf(gear.itemId) === -1
					&& (!isUnlock || gear.lock === 0);
			});
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
