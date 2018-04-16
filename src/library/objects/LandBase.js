(function(){
	"use strict";
	
	window.KC3LandBase = function(data){
		this.map = -1;
		this.rid = -1;
		this.name = "";
		this.range = -1;
		this.action = -1;
		this.planes = [];
		
		// If specified with data, fill this object
		if(typeof data != "undefined"){
			this.map = data.api_area_id;
			this.rid = data.api_rid;
			this.name = data.api_name;
			this.range = data.api_distance;
			this.action = data.api_action_kind;
			
			var self = this;
			data.api_plane_info.forEach(function(plane, index){
				self.planes.push(plane);
			});
		}
	};
	
	KC3LandBase.prototype.defineFormatted = function(data){
		if (typeof data != "undefined") {
			this.map = data.map;
			this.rid = data.rid;
			this.name = data.name;
			this.range = data.range;
			this.action = data.action;
			this.planes = data.planes;
		}
		return this;
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
	 * Convert to new Object used to record sorties on indexedDB
	 * Use masterId instead of rosterId, also record stars and ace of aircraft.
	 */
	KC3LandBase.prototype.sortieJson = function(){
		const returnObj = {};
		if(this.rid > -1){
			returnObj.rid = this.rid;
			returnObj.range = this.range;
			returnObj.action = this.action;
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