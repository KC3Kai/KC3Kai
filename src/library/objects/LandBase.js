(function(){
	"use strict";
	
	window.KC3LandBase = function(data){
		this.map = -1;
		this.rid = -1;
		this.name = "";
		this.range = -1;
		this.action = -1;
		this.planes = [];
		this.strikePoints = undefined;
		
		// If specified with data, fill this object
		if(typeof data !== "undefined"){
			this.map = data.api_area_id;
			this.rid = data.api_rid;
			this.name = data.api_name;
			if(typeof data.api_distance === "object"){
				this.rangeBase = data.api_distance.api_base || 0;
				this.rangeBonus = data.api_distance.api_bonus || 0;
				this.range = this.rangeBase + this.rangeBonus;
			} else {
				this.range = data.api_distance;
			}
			this.action = data.api_action_kind;
			
			data.api_plane_info.forEach((plane, index) => {
				this.planes.push(plane);
			});
		}
	};
	
	KC3LandBase.prototype.defineFormatted = function(data){
		if (typeof data != "undefined") {
			this.map = data.map;
			this.rid = data.rid;
			this.name = data.name;
			this.range = data.range;
			this.rangeBase = data.rangeBase;
			this.rangeBonus = data.rangeBonus;
			this.action = data.action;
			this.planes = data.planes;
			this.strikePoints = data.strikePoints;
		}
		return this;
	};
	
	KC3LandBase.actionEnum = function(key){
		// Action keys are now the suffix of term key in terms.json
		const actionEnumsMap = {
			0: "Waiting",
			1: "Sortie",
			2: "Defend",
			3: "Retreat",
			4: "Rest",
		};
		// return all enums
		return key === undefined ? actionEnumsMap :
		// return action id by term key
			typeof key === "string" ? Number(Object.swapMapKeyValue(actionEnumsMap)[key] || -1) :
		// return term key by action id
			actionEnumsMap[key] || "";
	};
	
	KC3LandBase.prototype.getActionTerm = function(){
		return KC3LandBase.actionEnum(this.action);
	};
	
	KC3LandBase.prototype.isPlanesSupplied = function(){
		return this.planes.every(function(p){
			return !p.api_slotid || p.api_state !== 1 ||
				(!!p.api_max_count && p.api_count === p.api_max_count);
		});
	};
	
	KC3LandBase.prototype.worstCond = function(){
		return this.planes.reduce(function(acc, p){
			return !p.api_slotid || p.api_state !== 1 || !p.api_cond
				|| p.api_cond < acc ? acc : p.api_cond;
		}, 0);
	};
	
	KC3LandBase.prototype.calcResupplyCost = function() {
		var totalFuel = 0,
			totalBauxite = 0;
		$.each(this.planes, function(i, p) {
			if (p.api_slotid > 0 && p.api_state == 1 && p.api_max_count > 0) {
				var lostCount = p.api_max_count - p.api_count;
				totalFuel += lostCount * KC3GearManager.landBaseSupplyFuelCostPerSlot;
				totalBauxite += lostCount * KC3GearManager.landBaseSupplyBauxiteCostPerSlot;
			}
		});
		return {fuel: totalFuel, ammo: 0, steel: 0, bauxite: totalBauxite};
	};
	
	KC3LandBase.prototype.calcSortieCost = function() {
		const totalCost = {fuel: 0, ammo: 0, steel: 0, bauxite: 0};
		$.each(this.planes, function(i, p) {
			// Only count plane which is set, not moving
			if(p.api_slotid > 0 && p.api_state === 1){
				const planeType2 = KC3GearManager.get(p.api_slotid).master().api_type[2];
				const planeCost = KC3GearManager.get(p.api_slotid).master().api_cost;
				const fuelCostPerSlot = KC3GearManager.landBaseReconnType2Ids.indexOf(planeType2) > -1 ?
					KC3GearManager.landBaseReconnSortieFuelCostPerSlot : planeType2 === 47 ?
					KC3GearManager.landBaseBomberSortieFuelCostPerSlot :
					KC3GearManager.landBaseOtherSortieFuelCostPerSlot;
				const ammoCostPerSlot = KC3GearManager.landBaseReconnType2Ids.indexOf(planeType2) > -1 ?
					KC3GearManager.landBaseReconnSortieAmmoCostPerSlot : planeType2 === 47 ?
					KC3GearManager.landBaseBomberSortieAmmoCostPerSlot :
					KC3GearManager.landBaseOtherSortieAmmoCostPerSlot;
				// After testing, should use api_count, not api_max_count
				// but the accuracy depend on costPerSlot series constants
				totalCost.fuel += Math.round(p.api_count * fuelCostPerSlot);
				totalCost.ammo += Math.round(p.api_count * ammoCostPerSlot);
				// Jets consume steel per battle
				totalCost.steel += ((
					KC3GearManager.jetAircraftType2Ids.indexOf(planeType2) > -1 ?
						Math.round(p.api_count * planeCost * KC3GearManager.jetBomberSteelCostRatioPerSlot) : 0
					) || 0
				);
			}
		});
		return totalCost;
	};
	
	/**
	 * Calculate percentages of preliminary shotdown ratio for Air Defense on Enemy Raid.
	 * @param dispSeiku - air battle state id, AS by default, see `api_disp_seiku`.
	 * @return {Object} contains 4-elements Array properties of
	 *         { `minShotdownSlots`, `maxShotdownSlots`, `formattedSlots` }.
	 * @see https://kancolle.wikia.com/wiki/Land_Base_Aerial_Support#Enemy_Raid_2
	 */
	KC3LandBase.prototype.shotdownRatio = function(dispSeiku = 2) {
		const airStateMod = [6, 10, 8, 4, 1][dispSeiku] || 8;
		const minShotdownSlots = [],
			maxShotdownSlots = [],
			formattedSlots = [];
		// Slot-based matching
		$.each(this.planes, function(i, p) {
			let minShotdown = 0,
				maxShotdown = 0;
			if(p.api_slotid > 0 && p.api_state === 1){
				const planeMaster = KC3GearManager.get(p.api_slotid).master();
				const interceptStat = planeMaster.api_houk || 0,
					antiBombingStat = planeMaster.api_houm || 0;
				minShotdown = 6.5 * airStateMod +
					3.5 * (antiBombingStat + airStateMod * Math.min(interceptStat, 1));
				// Exclusive to the upper bound
				maxShotdown = minShotdown + 3.5 * (airStateMod + antiBombingStat - 1);
			} else {
				// If there is no plane, then shotdown depends on air state only,
				// same formula is still applied, without bonus from stats.
				minShotdown = 6.5 * airStateMod;
				maxShotdown = minShotdown + 3.5 * (airStateMod - 1);
			}
			formattedSlots.push(`${minShotdown}% ~ ${maxShotdown}%`);
			minShotdownSlots.push(minShotdown / 100);
			maxShotdownSlots.push(maxShotdown / 100);
		});
		return {
			minShotdownSlots,
			maxShotdownSlots,
			formattedSlots,
		};
	};
	
	KC3LandBase.prototype.getHighAltitudeInterceptorCount = function() {
		return this.planes.reduce((acc, p) => acc + (
			KC3GearManager.highAltitudeInterceptorIds.includes(KC3GearManager.get(p.api_slotid).master().api_id) ? 1 : 0
		), 0);
	};
	
	/**
	 * @return a fake carrier ship instance simulated by this land-base (4 squadrons mapped to 4 slots).
	 */
	KC3LandBase.prototype.toShipObject = function() {
		const shipObj = new KC3Ship();
		// fixed ID 1 to ensure it's not a dummy ship
		shipObj.rosterId = 1;
		// starring by Akagi
		shipObj.masterId = 83;
		shipObj.hp = [1,1];
		shipObj.items = this.planes.map(function (planeInfo) {
			return planeInfo.api_state == 1 ? planeInfo.api_slotid : -1;
		});
		shipObj.slots = this.planes.map(function (planeInfo) {
			return planeInfo.api_state == 1 ? planeInfo.api_count : 0;
		});
		return shipObj;
	};

	/**
	 * Convert to new Object used to record sorties on indexedDB
	 * Use masterId instead of rosterId, also record stars and ace of aircraft.
	 */
	KC3LandBase.prototype.sortieJson = function(){
		const returnObj = {};
		if(this.rid > -1){
			returnObj.rid = this.rid;
			returnObj.range = this.range;
			returnObj.action = this.action;
			if(this.strikePoints){
				returnObj.edges = this.strikePoints;
			}
			returnObj.planes = [];
			$.each(this.planes, function(index, squad){
				if(squad.api_slotid > 0){
					const gear = KC3GearManager.get(squad.api_slotid);
					returnObj.planes.push({
						squad: squad.api_squadron_id,
						mst_id: gear.masterId,
						count: squad.api_count,
						max_count: squad.api_max_count,
						stars: gear.stars,
						ace: gear.ace,
						state: squad.api_state,
						morale: squad.api_cond
					});
				}
			});
		}
		return returnObj;
	};

})();