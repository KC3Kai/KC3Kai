/*

AntiAir: anti-air related calculations
  
- variable naming convention:
	- fleetObj: instance of KC3Fleet
	- shipObj: instance of KC3Ship
		- mst: master data of either ship or gear
		- pred: predicates, a function that accepts a single parameter and returns a boolean value
		- predXXX: predicate combinations. "predXXX(pred1, pred2, ...)" combines pred1, pred2, ...
		  in some specific way to produce a new predicate.

- module contents:
	- shipProportionalShotdownRate(shipObj)
	  returns a value (supposed to be 0 <= v <= 1) indicating the rate of planes
	  being shot down. note that it might be possible for this value to exceed 1.0.
	- shipProportionalShotdown(shipObj, num)
	  same as "shipProportionalShotdownRate", except that this one calculates
	  the number of planes being shotdown with slot capacity is given by "num".
	- shipFixedShotdown(shipObj, fleetObj, formationModifier, [K])
	  returns an integer indicating how many planes will be shotdown.
	  "formationModifier" takes one of: 1/1.2/1.6 depending on formation
	  (see "getFormationModifiers" for detail).
	  K (defaults to 1) is optional, depending on whether AACI is triggered and
	  which kind of AACI is triggered.
	- shipFixedShotdownRange(shipObj, fleetObj, formationModifier)
	  like "shipFixedShotdown" but this one returns a range by considering
	  all possible AACIs "shipObj" can perform and use the largest modifier as upper bound.
	- shipFixedShotdownRangeWithAACI(shipObj, fleetObj, formationModifier)
	  the same as "shipFixedShotdownRange" except returning the AACI ID of largest modifier.
	- shipMaxShotdownAllBonuses(shipObj)
	  return the largest fixed and with modifier bonuses of all possible AACIs "shipObj" can perform.
	- shipPossibleAACIs(shipObj) / fleetPossibleAACIs(fleetObj)
	  returns a list of possible AACI API Ids that ship / fleet could perform.
	- shipAllPossibleAACIs(mst)
	  returns a list of possible AACI API Ids that type of ship could perform ignored equipments.
	- sortedPossibleAaciList(aaciIdList)
	  return a list of AACI object sorted by shot down bonus descended.
	- AACITable[<AACI API>] returns a record of AACI info:
		- id: AACI API Id
		- fixed: fixed shotdown bonus
		- modifier: the "K" value to "shipFixedShotdown" when this AACI is triggered
		- icon: IDs of icons representing this kind of AACI
		- predicateShipMst: test whether "mst" can perform this kind of AACI ignoring equipments
		- predicateShipObj: test whether "shipObj" can perform this particular kind of AACI
	- other not explicitly listed contents are for debugging or internal use only.

 */
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
	// return the first non-falsy value or "false" if all predicates have failed.
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
			var result = true;
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

	// all types of Radar (12 for small, 13 for large)
	function isRadar(mst) {
		return (categoryEq(12)(mst) || categoryEq(13)(mst));
	}

	// AA Radar
	// Surface Radar are excluded by checking whether
	// the equipment gives AA stat (api_tyku)
	function isAARadar(mst) {
		return isRadar(mst) && mst.api_tyku >= 2;
	}

	// AAFD: check by category (36)
	var isAAFD = categoryEq(36);

	// High-angle mounts: check by icon (16)
	var isHighAngleMount = iconEq(16);
	
	// Type 3 Shell
	var isType3Shell = categoryEq(18);

	// Check by icon (15)
	var isMachineGun = iconEq(15);

	// Anti-air gun includes machine guns and rocket launchers,
	// but not sure why AA stat < 3 gun not counted (only 7.7mm MG for now)
	var isAAGun = predAllOf(isMachineGun, function(mst) {
		return mst.api_tyku >= 3;
	});

	var isRedGun = predAnyOf(
		iconEq(1),
		iconEq(2),
		iconEq(3));

	function is46cmTripleMount(mst) {
		return mst.api_id === 6 || mst.api_id === 276;
	}
	
	var isYellowGun = iconEq(4);
	var isFighter = categoryEq(6);
	var isDiveBomber = categoryEq(7);
	var isSeaplaneRecon = categoryEq(10);

	var isLargeCaliberMainGun = categoryEq(3);

	function isBuiltinHighAngleMount(mst) {
		// use the condition also used in game for future unknown equipment
		return isHighAngleMount(mst) && mst.api_tyku >= 8;
		/*
		return [
			122, // aki-gun
			130, // maya-gun
			135, // 90mm single HA
			172, // 5inch
		].indexOf( mst.api_id ) !== -1;
		*/
	}

	function is10cmTwinHighAngleMountKaiAMG(mst) {
		return mst.api_id === 275;
	}

	function isCDMG(mst) {
		return isAAGun(mst) && mst.api_tyku >= 9;
		/*
		return [
			131, // 25mm triple (CD)
			173, // Bofors
			191, // QF 2-pounder
		].indexOf( mst.api_id ) !== -1;
		*/
	}

	var isAAGunNotCD = predAllOf(isAAGun, predNot(isCDMG));

	function is12cm30tubeRocketLauncherKai2(mst) {
		return mst.api_id === 274;
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
		if (isMachineGun(mst))
			return 6;
		if (isHighAngleMount(mst) || isAAFD(mst))
			return 4;
		if (isAARadar(mst))
			return 3;
		// no default value for unverified equipment
		return 0;
	}

	function getFleetEquipmentModifier(mst) {
		if (isType3Shell(mst))
			return 0.6;
		if (isAARadar(mst))
			return 0.4;
		if (isHighAngleMount(mst) || isAAFD(mst))
			return 0.35;
		if (is46cmTripleMount(mst))
			return 0.25;
		if (predAnyOf(isRedGun,
				  isYellowGun,
				  isMachineGun,
				  isFighter,
				  isDiveBomber,
				  isSeaplaneRecon)(mst))
			return 0.2;
		// no default value for unverified equipment, might use 0.2 as default?
		return 0;
	}

	// updated data: http://wikiwiki.jp/kancolle/?%B9%D2%B6%F5%C0%EF#anti-aircraft
	// another implementation might give the latest verified data:
	// https://github.com/Nishisonic/anti_aircraft/blob/gh-pages/js/util.js
	function getShipImprovementModifier(mst) {
		if (isMachineGun(mst))
			return 4;
		if (isBuiltinHighAngleMount(mst))
			return 3;
		if (isHighAngleMount(mst))
			return 2;
		if (isAAFD(mst))
			return 2;
		if (isAARadar(mst))
			return 0;
		// no default value for unverified equipment
		return 0;
	}

	function getFleetImprovementModifier(mst) {
		if (isBuiltinHighAngleMount(mst))
			return 3;
		if (isHighAngleMount(mst))
			return 2;
		if (isAAFD(mst))
			return 2;
		if (isAARadar(mst))
			return 1.5;
		if (isMachineGun(mst))
			return 0;
		// no default value for unverified equipment
		return 0;
	}

	function calcEquipmentAADefense(
		mst,
		stars /* number 0..10 */,
		forFleet /* bool */) {

		var eTypMod = 
			(forFleet 
			 ? getFleetEquipmentModifier 
			 : getShipEquipmentModifier)(mst);
		var eImproveMod =
			(forFleet
			 ? getFleetImprovementModifier
			 : getShipImprovementModifier)(mst);
		var aaStat = mst.api_tyku;
		return eTypMod * aaStat + eImproveMod * Math.sqrt( stars );
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
			return q * Math.floor(x / q);
		};
	}

	function allShipEquipments(shipObj) {
		return shipObj.equipment(true);
	}

	function shipEquipmentAntiAir(shipObj, forFleet) {
		var allItems = allShipEquipments(shipObj);
		return allItems.reduce( function(curAA, item) {
			return curAA + item.aaDefense(forFleet);
		}, 0);
	}

	function shipAdjustedAntiAir(shipObj) {
		// here aa[1] is max naked stat, equaled to api_tyku[1],
		// might use current naked stat: aa[0] - equipment stat
		return shipObj.aa[1] + shipEquipmentAntiAir(shipObj, false);
	}

	function shipProportionalShotdownRate(shipObj, onCombinedFleetNum) {
		var floor = specialFloor(shipObj);
		var adjustedAA = shipAdjustedAntiAir(shipObj);
		var combinedModifier = getCombinedFleetModifier(onCombinedFleetNum);
		return floor(adjustedAA) / 400 * combinedModifier;
	}

	function shipProportionalShotdown(shipObj, num, onCombinedFleetNum) {
		return Math.floor( shipProportionalShotdownRate(shipObj, onCombinedFleetNum) * num );
	}

	function getCombinedFleetModifier(onCombinedFleetNum, isLongDistanceAirRaid = false) {
		// https://github.com/Nishisonic/anti_aircraft/blob/gh-pages/js/util.js
		// http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:363#18
		return onCombinedFleetNum > 0 ? // is on combined fleet?
			onCombinedFleetNum > 1 ? // is escort fleet?
				0.6 * 0.8 : // otherwise combined main fleet
				(isLongDistanceAirRaid ? 0.9 * 0.8 : 1 * 0.8)
			: 1.0;
	}

	function getFormationModifiers(id) {
		return (id === 1 || id === 4 || id === 5) ? 1.0  // line ahead / echelon / line abreast
			:  (id === 2) ? 1.2 // double line
			:  (id === 3) ? 1.6 // diamond
			:  (id === 6) ? 1.1 // vanguard
			:  (id === 11 || id === 21) ? 1.1 // Combined anti-sub
			:  (id === 12 || id === 14 || id === 22 || id === 24) ? 1.0 // Combined forward / battle
			:  (id === 13 || id === 23) ? 1.5 // Combined diamond
			:  NaN; // NaN for indicating an invalid id
	}

	function fleetAdjustedAntiAir(fleetObj, formationModifier) {
		var allShipEquipmentAA = fleetObj.ship().reduce( function(curAA, ship) {
			return curAA + shipEquipmentAntiAir(ship, true);
		}, 0);
		return (2/1.3) * Math.floor( formationModifier * allShipEquipmentAA );
	}

	function fleetCombinedAdjustedAntiAir(mainFleetObj, escortFleetObj, formationModifier) {
		var mainAllShipEquipmentAA = mainFleetObj.ship().reduce( function(curAA, ship) {
			return curAA + shipEquipmentAntiAir(ship, true);
		}, 0);
		var escortAllShipEquipmentAA = escortFleetObj.ship().reduce( function(curAA, ship) {
			return curAA + shipEquipmentAntiAir(ship, true);
		}, 0);
		return (2/1.3) * Math.floor( formationModifier * (mainAllShipEquipmentAA + escortAllShipEquipmentAA) );
	}

	/**
	 * @return {number} an integer indicating how many planes will be shotdown.
	 * @param {Object} shipObj - instance of KC3Ship
	 * @param {Object} fleetObj - instance(s) of KC3Fleet,
	 *        if combined fleet requested, should pass nested object: {main: mainFleetObj, escort: escortFleetObj}.
	 * @param {number} formationModifier - formation modifier, see #getFormationModifiers
	 * @param {number} K - AACI modifier, default to 1
	 * @param {number} onCombinedFleetNum - if ship on combined fleet, pass her fleet number (1 or 2), otherwise 0.
	 */
	function shipFixedShotdown(shipObj, fleetObj, formationModifier, K = 1, onCombinedFleetNum = 0) {
		var floor = specialFloor(shipObj);
		var adjustedAA = shipAdjustedAntiAir(shipObj);
		return Math.floor(
			(floor(adjustedAA) + Math.floor(
				Array.isArray(fleetObj) ? fleetCombinedAdjustedAntiAir(fleetObj.main, fleetObj.escort, formationModifier) :
					fleetAdjustedAntiAir(fleetObj, formationModifier) )
			) * K / 10 * getCombinedFleetModifier(onCombinedFleetNum)
		);
	}

	// avoid modifying this structure directly, use "declareAACI" instead.
	var AACITable = {};

	// typeIcons is a array including [ship icon, equip icon, ...]
	// predicateShipMst is a function f: f(mst)
	// predicateShipObj is a function f: f(shipObj)
	// returns a boolean to indicate whether the ship in question (with equipments)
	// is capable of performing such type of AACI
	function declareAACI(
		apiId,
		fixedBonus,
		modifier,
		typeIcons,
		predicateShipSlots,
		predicateWithEquips) {
		AACITable[apiId] = {
			id: apiId,
			fixed: fixedBonus,
			modifier: modifier,
			icons: typeIcons,
			predicateShipMst: predicateShipSlots,
			predicateShipObj: predicateWithEquips
		};
	}

	function isNotSubmarine( mst ) {
		var stype = mst.api_stype;
		return [13 /* SS */, 14 /* SSV */].indexOf( stype ) === -1;
	}

	function isBattleship( mst ) {
		var stype = mst.api_stype;
		return [8 /* FBB */, 9 /* BB */, 10 /* BBV */].indexOf( stype ) !== -1;
	}

	function isAkizukiClass( mst ) {
		return mst.api_ctype === 54;
		/*
		return [
			421, 330, // Akizuki & Kai
			422, 346, // Teruzuki & Kai
			423, 357, // Hatsuzuki & Kai
			532, 537, // Suzutsuki & Kai
		].indexOf( mst.api_id ) !== -1;
		*/
	}

	function isIseClassKai( mst ) {
		return mst.api_ctype === 2
			// if non-Kai excluded
			&& mst.api_id !== 77 && mst.api_id !== 87;
	}

	// Battleships capable for 12cm 30tube Rocket Launcher Kai 2
	function isBattleShipKai( mst ) {
		return [
			82, // Ise Kai
			88, // Hyuuga Kai
			148, // Musashi Kai
			546, // Musashi K2
		].indexOf( mst.api_id ) !== -1;
	}

	function masterIdEq( n ) {
		return function(mst) {
			return mst.api_id === n;
		};
	}

	// Icons used to declare AACI type
	var surfaceShipIcon = 0, // Means no icon, low priority
		akizukiIcon = 421,
		battleShipIcon = 131, // Yamato, weigh anchor!
		battleShipKaiIcon = 148, // Musashi Kai represents
		musashiK2Icon = 546,
		iseIcon = 77,
		mayaK2Icon = 428,
		isuzuK2Icon = 141,
		kasumiK2BIcon = 470,
		satsukiK2Icon = 418,
		kinuK2Icon = 487,
		yuraK2Icon = 488,
		fumizukiK2Icon = 548,
		uit25Icon = 539,
		i504Icon = 530,
		tatsutaK2Icon = 478,
		isokazeBkIcon = 557,
		hamakazeBkIcon = 558,
		haMountIcon = 16,
		radarIcon = 11,
		aaFdIcon = 30,
		aaGunIcon = 15,
		lcMainGunIcon = 3,
		type3ShellIcon = 12,
		// Special combined icons for Build-in HA / CDMG
		biHaMountIcon = "16+30",    // HA plus AAFD
		cdmgIcon = "15+15",         // AAGun double
		haMountNbifdIcon = "16-30", // HA without AAFD
		aaGunNotCdIcon = "15-15",   // Non-CD AA Machine Gun
		aaGunK2RockeLaunIcon = "15+31", // 12cm 30tube Rocket Launcher Kai 2
		haMountKaiAmg = "16+15";    // 10cm Twin High-angle Mount Kai + Additional Machine Gun

	var isMusashiK2 = masterIdEq( musashiK2Icon );
	var isMayaK2 = masterIdEq( mayaK2Icon );
	var isIsuzuK2 = masterIdEq( isuzuK2Icon );
	var isKasumiK2B = masterIdEq( kasumiK2BIcon );
	var isSatsukiK2 = masterIdEq( satsukiK2Icon );
	var isKinuK2 = masterIdEq( kinuK2Icon );
	var isYuraK2 = masterIdEq( yuraK2Icon );
	var isFumizukiK2 = masterIdEq( fumizukiK2Icon );
	var isUit25 = masterIdEq( uit25Icon );
	var isI504 = masterIdEq( i504Icon );
	var isTatsutaK2 = masterIdEq( tatsutaK2Icon );
	var isIsokazeBk = masterIdEq( isokazeBkIcon );
	var isHamakazeBk = masterIdEq( hamakazeBkIcon );

	// turns a "shipObj" into the list of her equipments
	// for its parameter function "pred"
	function withEquipmentMsts( pred ) {
		return function(shipObj) {
			var gears = allShipEquipments(shipObj)
				.filter( function(g) { return g.masterId !== 0; } )
				.map( function(g) { return g.master(); });
			return pred(gears);
		};
	}

	// "hasAtLeast(pred)(n)(xs)" is the same as:
	// xs.filter(pred).length >= n
	function hasAtLeast(pred, n) {
		return function(xs) {
			return xs.filter(pred).length >= n;
		};
	}

	// "hasSome(pred)(xs)" is the same as:
	// xs.some(pred)
	function hasSome(pred) {
		return function(xs) {
			return xs.some(pred);
		};
	}

	// check if slot num of ship (excluding ex slot) equals or greater
	function slotNumAtLeast(n) {
		return function(mst) {
			var slotnum = mst.api_slot_num;
			return slotnum >= n;
		};
	}

	// All non-sub surface ships
	// according KC vita codes, no ship type is used in predictions, (only ctype for Akizuki kinds, id for Maya K2 kinds)
	// might be able to trigger as long as ship can equip corresponding equipment.
	// but kind 5,7,8,9 (contains HA mount) seems never trigger on Akizuki-class,
	// reason might be: https://gist.github.com/Nishisonic/62cead1f57a323c737019d6b630fa4a5
	declareAACI(
		5, 4, 1.5,
		[surfaceShipIcon, biHaMountIcon, biHaMountIcon, radarIcon],
		predAllOf(isNotSubmarine, predNot(isAkizukiClass), slotNumAtLeast(3)),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast(isBuiltinHighAngleMount, 2),
				hasSome( isAARadar ))
		)
	);

	declareAACI(
		8, 4, 1.4,
		[surfaceShipIcon, biHaMountIcon, radarIcon],
		predAllOf(isNotSubmarine, predNot(isAkizukiClass), slotNumAtLeast(2)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isBuiltinHighAngleMount ),
				hasSome( isAARadar ))
		)
	);

	declareAACI(
		7, 3, 1.35,
		[surfaceShipIcon, haMountIcon, aaFdIcon, radarIcon],
		predAllOf(isNotSubmarine, predNot(isAkizukiClass), slotNumAtLeast(2)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAFD ),
				hasSome( isAARadar ))
		)
	);

	declareAACI(
		9, 2, 1.3,
		[surfaceShipIcon, haMountIcon, aaFdIcon],
		predAllOf(isNotSubmarine, predNot(isAkizukiClass), slotNumAtLeast(1)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAFD ))
		)
	);

	declareAACI(
		12, 3, 1.25,
		[surfaceShipIcon, cdmgIcon, aaGunIcon, radarIcon],
		predAllOf(isNotSubmarine, slotNumAtLeast(2)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isCDMG ),
				/* CDMGs are AAGuns, so we need at least 2 AA guns
				   including the CDMG one we have just counted */
				hasAtLeast(isAAGun, 2),
				hasSome( isAARadar ))
		)
	);

	// battleship special AACIs
	declareAACI(
		4, 6, 1.5,
		[battleShipIcon, lcMainGunIcon, type3ShellIcon, aaFdIcon, radarIcon],
		predAllOf(isBattleship, slotNumAtLeast(4)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isLargeCaliberMainGun ),
				hasSome( isType3Shell ),
				hasSome( isAAFD ),
				hasSome( isAARadar ))
		)
	);

	declareAACI(
		6, 4, 1.45,
		[battleShipIcon, lcMainGunIcon, type3ShellIcon, aaFdIcon],
		predAllOf(isBattleship, slotNumAtLeast(3)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isLargeCaliberMainGun ),
				hasSome( isType3Shell ),
				hasSome( isAAFD ))
		)
	);

	// Ise-class Kai only AACIs
	declareAACI(
		25, 7, 1.55,
		[iseIcon, aaGunK2RockeLaunIcon, radarIcon, type3ShellIcon],
		predAllOf(isIseClassKai),
		withEquipmentMsts(
			predAllOf(
				hasSome( is12cm30tubeRocketLauncherKai2 ),
				hasSome( isType3Shell ),
				hasSome( isAARadar ))
		)
	);

	// Musashi K2
	declareAACI(
		26, 6, 1.4,
		[musashiK2Icon, haMountKaiAmg, radarIcon],
		predAllOf(isMusashiK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( is10cmTwinHighAngleMountKaiAMG ),
				hasSome( isAARadar ))
		)
	);

	// api_kind 27 still unknown

	// Ise-class Kai + Musashi Kai
	declareAACI(
		28, 4, 1.4,
		[battleShipKaiIcon, aaGunK2RockeLaunIcon, radarIcon],
		predAllOf(isBattleShipKai),
		withEquipmentMsts(
			predAllOf(
				hasSome( is12cm30tubeRocketLauncherKai2 ),
				hasSome( isAARadar ))
		)
	);

	// Akizuki-class AACIs
	declareAACI(
		1, 7, 1.7,
		[akizukiIcon, haMountIcon, haMountIcon, radarIcon],
		predAllOf(isAkizukiClass),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( isHighAngleMount, 2 ),
				hasSome( isRadar ))
		)
	);
	declareAACI(
		2, 6, 1.7,
		[akizukiIcon, haMountIcon, radarIcon],
		predAllOf(isAkizukiClass),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isRadar ))
		)
	);
	declareAACI(
		3, 4, 1.6,
		[akizukiIcon, haMountIcon, haMountIcon],
		predAllOf(isAkizukiClass),
		withEquipmentMsts(
			hasAtLeast( isHighAngleMount, 2 )
		)
	);

	// Maya K2
	declareAACI(
		10, 8, 1.65,
		[mayaK2Icon, haMountIcon, cdmgIcon, radarIcon],
		// Omitted slot num for specified ship, same below
		predAllOf(isMayaK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isCDMG ),
				hasSome( isAARadar ))
		)
	);
	declareAACI(
		11, 6, 1.5,
		[mayaK2Icon, haMountIcon, cdmgIcon],
		predAllOf(isMayaK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isCDMG ))
		)
	);
	// api_kind 13 deprecated by devs
	// might be non-MayaK2 biHaMount+CDMG+AirRadar +4 x1.35

	// Isuzu K2
	declareAACI(
		14, 4, 1.45,
		[isuzuK2Icon, haMountIcon, aaGunIcon, radarIcon],
		predAllOf(isIsuzuK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGun ),
				hasSome( isAARadar ))
		)
	);
	declareAACI(
		15, 3, 1.3,
		[isuzuK2Icon, haMountIcon, aaGunIcon],
		predAllOf(isIsuzuK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGun ))
		)
	);

	// Kasumi K2B
	declareAACI(
		16, 4, 1.4,
		[kasumiK2BIcon, haMountIcon, aaGunIcon, radarIcon],
		predAllOf(isKasumiK2B),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGun ),
				hasSome( isAARadar ))
		)
	);
	declareAACI(
		17, 2, 1.25,
		[kasumiK2BIcon, haMountIcon, aaGunIcon],
		predAllOf(isKasumiK2B),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGun ))
		)
	);

	// Satsuki K2
	declareAACI(
		18, 2, 1.2,
		[satsukiK2Icon, cdmgIcon],
		predAllOf(isSatsukiK2),
		withEquipmentMsts(
			hasSome( isCDMG )
		)
	);

	// Kinu K2
	declareAACI(
		19, 5, 1.45,
		[kinuK2Icon, haMountNbifdIcon, cdmgIcon],
		predAllOf(isKinuK2),
		withEquipmentMsts(
			predAllOf(
				/* any HA with builtin AAFD will not work */
				predNot( hasSome( isBuiltinHighAngleMount )),
				hasSome( isHighAngleMount ),
				hasSome( isCDMG ))
		)
	);
	declareAACI(
		20, 3, 1.25,
		[kinuK2Icon, cdmgIcon],
		predAllOf(isKinuK2),
		withEquipmentMsts(
			hasSome( isCDMG )
		)
	);

	// Yura K2
	declareAACI(
		21, 5, 1.45,
		[yuraK2Icon, haMountIcon, radarIcon],
		predAllOf(isYuraK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAARadar ))
		)
	);

	// Fumizuki K2
	declareAACI(
		22, 2, 1.2,
		[fumizukiK2Icon, cdmgIcon],
		predAllOf(isFumizukiK2),
		withEquipmentMsts(
			hasSome( isCDMG )
		)
	);

	// UIT-25 / I-504
	declareAACI(
		23, 1, 1.05,
		[uit25Icon, aaGunNotCdIcon],
		predAnyOf(isUit25, isI504),
		withEquipmentMsts(
			hasSome( isAAGunNotCD )
		)
	);

	// Tatsuta K2
	declareAACI(
		24, 3, 1.25,
		[tatsutaK2Icon, haMountIcon, aaGunNotCdIcon],
		predAllOf(isTatsutaK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGunNotCD ))
		)
	);

	// Isokaze B Kai / Hamakaze B Kai
	declareAACI(
		29, 5, 1.55,
		[isokazeBkIcon, haMountIcon, radarIcon],
		predAnyOf(isIsokazeBk, isHamakazeBk),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAARadar ))
		)
	);

	// return a list of possible AACI APIs based on ship and her equipments
	// - returns a list of **strings**, not numbers
	//   (since object keys has to be strings, and AACITable[key] accepts keys
	//   of both number and string anyway)
	// - because of the game mechanism, some AACI API Ids returned might be overlapped
	//   and never triggered, "possibleAACIs" is **not** responsible for removing never-triggered
	//   AACI from resulting list.
	function shipPossibleAACIs(shipObj) {
		var result = [];
		$.each( AACITable, function(k,entry) {
			if (entry.predicateShipMst(shipObj.master())
					&& entry.predicateShipObj(shipObj))
				result.push( k );
		});
		return result;
	}

	// return a list of all possible AACI based on master ship only, equipments ignored
	function shipAllPossibleAACIs(shipMst) {
		var result = [];
		$.each( AACITable, function(k, entry) {
			if (entry.predicateShipMst( shipMst ))
				result.push( k );
		});
		return result;
	}

	// return a list of deduplicate possible AACI APIs based on all ships in fleet
	function fleetPossibleAACIs(fleetObj) {
		var aaciSet = {};
		fleetObj.ship(function(rId, ind, shipObj) {
			shipPossibleAACIs(shipObj).map(function(apiId) {
				aaciSet[apiId] = true;
			});
		});
		return Object.keys(aaciSet);
	}

	// return: a list of sorted AACI objects order by effect desc,
	//   as most effective AACI gets priority to be triggered.
	// in-game, priority is based on kinds of conditions (in `if...return` flavor),
	//   research about AACI priority for a ship:
	//   https://docs.google.com/document/d/1XBrQgQsA_pM3fXsDDC7e1N5Xpr2p59kmvQbnY2UH0Ko
	//   https://gist.github.com/Nishisonic/62cead1f57a323c737019d6b630fa4a5
	//   here still use the simple way via ordering by 'effect' since new AACI kinds not covered by investigations.
	// note: priority is different from trigger chance rate, since random number roll just done once,
	//       lower priority AACI is still possible to be triggered if chance value is bigger.
	//       on the opposite, both lower priority and smaller chance means never can be triggered.
	// param: AACI IDs from possibleAACIs functions
	// param: a optional callback function to customize ordering
	function sortedPossibleAaciList(aaciIds, sortCallback) {
		var aaciList = [];
		if(!!aaciIds && Array.isArray(aaciIds)) {
			$.each( aaciIds, function(i, apiId) {
				if(!!AACITable[apiId]) aaciList.push( AACITable[apiId] );
			});
			var defaultOrder = function(a, b) {
				// Order by fixed desc, modifier desc, icons[0] desc
				return b.fixed - a.fixed
					|| b.modifier - a.modifier
					|| b.icons[0] - a.icons[0];
			};
			aaciList = aaciList.sort(sortCallback || defaultOrder);
		}
		return aaciList;
	}

	function sortedFleetPossibleAaciList(triggeredShipAaciIds) {
		return sortedPossibleAaciList(triggeredShipAaciIds, function(a, b) {
			// Order by (API) id desc
			return b.id - a.id;
		});
	}

	function shipFixedShotdownRange(shipObj, fleetObj, formationModifier, onCombinedFleetNum) {
		var possibleAACIModifiers = fleetPossibleAACIs(fleetObj).map( function( apiId ) {
			return AACITable[apiId].modifier;
		});
		// default value 1 is always available, making call to Math.max always non-empty
		possibleAACIModifiers.push( 1 );
		var mod = Math.max.apply( null, possibleAACIModifiers );
		return [ shipFixedShotdown(shipObj, fleetObj, formationModifier, 1, onCombinedFleetNum),
				 shipFixedShotdown(shipObj, fleetObj, formationModifier, mod, onCombinedFleetNum),
				 mod ];
	}

	function shipFixedShotdownRangeWithAACI(shipObj, fleetObj, formationModifier, onCombinedFleetNum) {
		var possibleAaciList = sortedPossibleAaciList(fleetPossibleAACIs(fleetObj),
			function(a, b){
				// Order by modifier desc, fixed desc, icons[0] desc
				return b.modifier - a.modifier
					|| b.fixed - a.fixed
					|| b.icons[0] - a.icons[0];
			});
		var aaciId = possibleAaciList.length > 0 ? possibleAaciList[0].id : 0;
		var mod = possibleAaciList.length > 0 ? possibleAaciList[0].modifier : 1;
		return [ shipFixedShotdown(shipObj, fleetObj, formationModifier, 1, onCombinedFleetNum),
				 shipFixedShotdown(shipObj, fleetObj, formationModifier, mod, onCombinedFleetNum),
				 aaciId ];
	}

	function shipMaxShotdownFixedBonus(shipObj) {
		var possibleBonuses = shipPossibleAACIs(shipObj).map( function( apiId ) {
			return AACITable[apiId].fixed;
		});
		// default value 0 is always available, making call to Math.max always non-empty
		possibleBonuses.push( 0 );
		return Math.max.apply( null, possibleBonuses );
	}

	function shipMaxShotdownAllBonuses(shipObj) {
		var possibleAaciList = sortedPossibleAaciList(shipPossibleAACIs(shipObj));
		return possibleAaciList.length > 0 ?
			[possibleAaciList[0].id, possibleAaciList[0].fixed, possibleAaciList[0].modifier]
			: [0, 0, 1];
	}

	// exporting module
	window.AntiAir = {
		getFleetEquipmentModifier: getFleetEquipmentModifier,
		getShipEquipmentModifier: getShipEquipmentModifier,
		getFleetImprovementModifier: getFleetImprovementModifier,
		getShipImprovementModifier: getShipImprovementModifier,

		calcEquipmentAADefense: calcEquipmentAADefense,
		shipEquipmentAntiAir: shipEquipmentAntiAir,
		shipAdjustedAntiAir: shipAdjustedAntiAir,
		specialFloor: specialFloor,

		shipProportionalShotdown: shipProportionalShotdown,
		shipProportionalShotdownRate: shipProportionalShotdownRate,

		getFormationModifiers: getFormationModifiers,
		fleetAdjustedAntiAir: fleetAdjustedAntiAir,
		fleetCombinedAdjustedAntiAir: fleetCombinedAdjustedAntiAir,
		shipFixedShotdown: shipFixedShotdown,
		shipFixedShotdownRange: shipFixedShotdownRange,
		shipFixedShotdownRangeWithAACI: shipFixedShotdownRangeWithAACI,
		shipMaxShotdownFixedBonus: shipMaxShotdownFixedBonus,
		shipMaxShotdownAllBonuses: shipMaxShotdownAllBonuses,

		AACITable: AACITable,
		shipPossibleAACIs: shipPossibleAACIs,
		shipAllPossibleAACIs: shipAllPossibleAACIs,
		fleetPossibleAACIs: fleetPossibleAACIs,
		sortedPossibleAaciList: sortedPossibleAaciList
	};
})();
