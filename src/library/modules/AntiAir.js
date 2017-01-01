(function() {
	"use strict";

	function categoryEq(n) {
		return function (mst) {
			return mst.api_type[2] /* category */ === n;
		};
	}

	function iconEq(n) {
		return function (mst) {
			return mst.api_type[3] /* icon */ === n;
		};
	}

	// a predicate combinator, "predAnyOf(f,g)(x)" is the same as "f(x) || g(x)"
	// test all predicates passed as argument in order,
	// return the first non-falsy value or "false" if all predicates have falled.
	function predAnyOf(/* list of predicates */) {
		var args = arguments;
		return function(x) {
			for (var fInd in args) {
				var result = args[fInd](x);
				if (result)
					return result;
			}
			return false;
		};
	}

	function predAllOf(/* list of predicates */) {
		var args = arguments;
		return function(x) {
			var result;
			for (var fInd in args) {
				result = args[fInd](x);
				if (! result)
					return false;
			}
			return result;
		};
	}

	function predNot( pred ) {
		return function(x) {
			return ! pred(x);
		};
	}

	// AA Radar (12 for small, 13 for large)
	// Surface Radar are excluded by checking whether
	// the equipment gives AA stat (api_tyku)
	function isAARadar(mst) {
		return (categoryEq(12)(mst) || categoryEq(13)(mst)) && 
			mst.api_tyku > 0;
	}

	// AAFD: check by category (36)
	var isAAFD = categoryEq(36);

	// High-angle mounts: check by icon (16)
	var isHighAngleMount = iconEq(16);
	
	// Type 3 Shell
	var isType3Shell = categoryEq(18);

	// Anti-air gun includes machine guns and rocket launchers
	var isAAGun = categoryEq(21);

	var isRedGun = predAnyOf(
		iconEq(1),
		iconEq(2),
		iconEq(3));
	
	var isYellowGun = iconEq(4);
	var isFighter = categoryEq(6);
	var isDiveBomber = categoryEq(7);
	var isSeaplaneRecon = categoryEq(10);

	function isBuiltinHighAngleMount(mst) {
		return [
			122 /* aki-gun */,
			130 /* maya-gun */,
			135 /* 90mm single HA */,
			172 /* 5inch */
		].indexOf( mst.api_id ) !== -1;
	}

	function isCDMG(mst) {
		return [
			131 /* 25mm triple (CD) */,
			173 /* Bofors */,
			191 /* QF 2-pounder */
		].indexOf( mst.api_id ) !== -1;
	}

	// for equipments the coefficient is different for
	// calculating adjusted ship AA stat and fleet AA stat,
	// so let's use the following naming convention:
	//
	// - "getShipXXX" is for calculating adjusted AA stat for individual ships
	// - "getFleetXXX" for fleet AA
	//
	// verbs might change but the same convention should follow.

	// TODO: abyssal equipments into consideration?

	// it is possible for conditions to have overlap:
	// Akizuki-gun for example is both high angle mount and short caliber main gun.
	// to resolve this:
	// - the conditions are re-ordered so the highest applicable
	//   modifier is always checked first.
	// - the wiki says main gun (red), so maybe an icon-based checker "isRedGun"
	//   might be more appropriate.

	function getShipEquipmentModifier(mst) {
		if (isAAGun(mst))
			return 6;
		if (isHighAngleMount(mst) || isAAFD(mst))
			return 4;
		if (isAARadar(mst))
			return 3;

		return 0;
	}

	function getFleetShipEquipmentModifier(mst) {
		if (isType3Shell(mst))
			return 0.6;
		if (isAARadar(mst))
			return 0.4;
		if (isHighAngleMount(mst) || isAAFD(mst))
			return 0.35;
		if (predAnyOf(isRedGun,
				  isYellowGun,
				  isAAGun,
				  isFighter,
				  isDiveBomber,
				  isSeaplaneRecon)(mst))
			return 0.2;

		return 0;
	}

	function getShipImprovementModifier(mst) {
		if (isAAGun(mst))
			return 4;
		if (isHighAngleMount(mst))
			return 3;
		if (isAARadar(mst))
			return 0;

		return 0;
	}

	function getFleetImprovementModifier(mst) {
		if (isHighAngleMount(mst))
			return 3;
		if (isAAFD(mst))
			return 2;
		if (isAARadar(mst))
			return 1.5;
		if (isAAGun(mst))
			return 0;

		return 0;
	}

	function calcEquipmentAADefense(
		mst,
		stars /* number 0..10 */,
		forFleet /* bool */) {

		var eTypMod = 
			(forFleet 
			 ? getFleetShipEquipmentModifier 
			 : getShipEquipmentModifier)(mst);
		var eImproveMod =
			(forFleet
			 ? getFleetImprovementModifier
			 : getShipImprovementModifier)(mst);
		var aaStat = mst.api_tyku;
		return eTypMod*aaStat + eImproveMod*Math.sqrt( stars );
	}

	// returns a special floor function f(x) = q * floor( x / q )
	// - q = 1 if shipObj equips nothing
	// - q = 2 otherwise
	function specialFloor(shipObj) {
		var q = 1;
		var allItems = allShipEquipments(shipObj);
		for (var itemInd in allItems) {
			var item = allItems[itemInd];
			if (item.masterId !== 0) {
				q = 2;
				break;
			}
		}

		return function(x) {
			return q*Math.floor(x / q);
		};
	}

	function allShipEquipments(shipObj) {
		return [
			shipObj.equipment(0),
			shipObj.equipment(1),
			shipObj.equipment(2),
			shipObj.equipment(3),
			shipObj.exItem()];
	}

	function shipEquipmentAntiAir(shipObj, forFleet) {
		var allItems = allShipEquipments(shipObj);
		return allItems.reduce( function(curAA, item) {
			return curAA + item.aaDefense(forFleet);
		}, 0);
	}

	function shipAdjustedAntiAir(shipObj) {
		return shipObj.aa[1] + shipEquipmentAntiAir(shipObj,false);
	}

	function shipProportionalShotdownRate(shipObj) {
		var floor = specialFloor(shipObj);
		var adjustedAA = shipAdjustedAntiAir(shipObj);
		return floor(adjustedAA) / 400;
	}

	function shipProportionalShotdown(shipObj, num) {
		return Math.floor( shipProportionalShotdownRate(shipObj) * num );
	}

	// avoid modifying this structure directly, use "declareAACI" instead.
	var AACITable = {};

	// predicate is a function f:
	// f(shipObj)
	// returns a boolean to indicate whether the ship in question (with equipments)
	// is capable of performing such type of AACI
	function declareAACI(
		apiId,
		fixedBonus, 
		modifier, 
		predicate) {
		AACITable[apiId] =
			{id: apiId,
			 fixed: fixedBonus,
			 modifier: modifier,
			 predicate: predicate };
	}

	function isNotSubmarine( shipObj ) {
		var stype = shipObj.master().api_stype;
		return [13 /* SS */, 14 /* SSV */].indexOf( stype ) === -1;
	}

	function withEquipmentMsts( pred ) {
		return function(shipObj) {
			var gears = allShipEquipments(shipObj)
				.filter( function(g) { return g.masterId !== 0; } )
				.map( function(g) { return g.master(); });
			return pred(gears);
		};
	}

	// all non-sub ships
	declareAACI(
		5, 4, 1.5,
		predAllOf(
			isNotSubmarine,
			withEquipmentMsts(
				function (gears) {
					console.log( gears );
					return gears.filter( isBuiltinHighAngleMount ).length >= 2 &&
						gears.some( isAARadar );
				})));

	declareAACI(
		8, 4, 1.4,
		predAllOf(
			isNotSubmarine,
			withEquipmentMsts(
				function(gears) {
				 	return gears.some( isBuiltinHighAngleMount ) &&
						gears.some( isAARadar );
				})));

	declareAACI(
		7, 3, 1.35,
		predAllOf(
			isNotSubmarine,
			withEquipmentMsts(
				function(gears) {
					return gears.some( isHighAngleMount ) &&
						gears.some( isAAFD ) &&
						gears.some( isAARadar );
				})));

	declareAACI(
		9, 2, 1.3,
		predAllOf(
			isNotSubmarine,
			withEquipmentMsts(
				function(gears) {
					return gears.some( isHighAngleMount ) &&
						gears.some( isAAFD );
				})));

	declareAACI(
		12, 3, 1.25,
		predAllOf(
			isNotSubmarine,
			withEquipmentMsts(
				function(gears) {
					return gears.some( isCDMG ) &&
						gears.some( isAAGun ) &&
						gears.some( isAARadar );
				})));

	// exporting module
	window.AntiAir = {
		getFleetShipEquipmentModifier: getFleetShipEquipmentModifier,
		getShipEquipmentModifier: getShipEquipmentModifier,
		getFleetImprovementModifier: getFleetImprovementModifier,
		getShipImprovementModifier: getShipImprovementModifier,

		calcEquipmentAADefense: calcEquipmentAADefense,
		shipEquipmentAntiAir: shipEquipmentAntiAir,
		shipAdjustedAntiAir: shipAdjustedAntiAir,
		specialFloor: specialFloor,
		shipProportionalShotdown: shipProportionalShotdown,
		shipProportionalShotdownRate: shipProportionalShotdownRate,
		AACITable: AACITable
	};
})();
