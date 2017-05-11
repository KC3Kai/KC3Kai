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
	
	/**
	 * Convert to new Object used to record sorties on indexedDB
	 * Use masterId instead of rosterId, also record stars and ace of aircraft.
	 */
	KC3LandBase.prototype.sortieJson = function(){
		var returnObj = {};
		if(this.rid > -1){
			returnObj.rid = this.rid;
			returnObj.range = this.range;
			returnObj.action = this.action;
			returnObj.planes = [];
			$.each(this.planes, function(index, squad){
				if(squad.api_slotid > 0){
					var gear = KC3GearManager.get(squad.api_slotid);
					returnObj.planes.push({
						//squadron: squad.api_squadron_id,
						mst_id: gear.masterId,
						count: squad.api_count,
						//max_count: squad.api_max_count,
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