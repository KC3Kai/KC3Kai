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

	function masterIdEq( n ) {
		return function(mst) {
			return mst.api_id === n;
		};
	}

	function masterIdIn( arr ) {
		return function(mst) {
			return arr.includes(mst.api_id);
		};
	}

	function stypeIdIn( arr ) {
		return function(mst) {
			return arr.includes(mst.api_stype);
		};
	}

	function ctypeIdEq( n ) {
		return function(mst) {
			return mst.api_ctype === n;
		};
	}

	function ctypeIdIn( arr ) {
		return function(mst) {
			return arr.includes(mst.api_ctype);
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
	var isAARadar = predAllOf(isRadar, function(mst) {
		return mst.api_tyku >= 2;
	});

	// AAFD: check by category (36)
	var isAAFD = categoryEq(36);

	// High-angle mounts: check by icon (16)
	var isHighAngleMount = iconEq(16);
	
	// Type 3 Shell
	var isType3Shell = categoryEq(18);

	// Check by icon (15)
	var isMachineGun = iconEq(15);

	// Anti-air gun includes machine guns and rocket launchers, equaled to machine gun
	var isAAGun = predAllOf(isMachineGun, function(mst) {
		return mst.api_tyku > 1;
	});

	// To match AA gun with minimal tyku of specified value:
	// kind 12 needs AA stat >= 3 (defined by KC Vita, only 7.7mm MG incapable for now)
	// kind 33 needs AA stat >= 4
	// kind 42/44 needs AA stat >= 6
	function isAAGunWithAtLeast(aa) {
		return predAllOf(isMachineGun, function(mst) {
			return mst.api_tyku >= aa;
		});
	}
	// special high AA machine gun
	var isAAGunCDMG = isAAGunWithAtLeast(9);
	// some kinds need AA between 3 and 8
	var isAAGunNotCD = predAllOf(isAAGunWithAtLeast(3), predNot(isAAGunCDMG));

	// High AA HA/machine guns/AAFD for modifier conditions.
	// api_tyku threshold from KC Vita Exec_AirBattle.cs#getA1Plus
	var isHighAAGear = function(mst) {
		return mst.api_tyku > 7;
	};

	var isRedGun = predAnyOf(
		iconEq(1),
		iconEq(2),
		iconEq(3)
	);
	var isYellowGun = iconEq(4);
	var isFighter = categoryEq(6);
	var isDiveBomber = categoryEq(7);
	var isSeaplaneRecon = categoryEq(10);
	var isLargeCaliberMainGun = categoryEq(3);

	var isBuiltinHighAngleMount = predAllOf(isHighAngleMount, function(mst) {
		return mst.api_tyku >= 8;
	});

	// [276] 46cm Kai not counted
	// http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:363#21
	var is46cmTripleMount = masterIdEq(6);

	// 12cm 30-tube Rocket Launcher Kai Ni
	var is12cm30tubeRocketLauncherKai2 = masterIdEq(274);
	// 10cm Twin High-angle Gun Mount Kai + Additional Machine
	var is10cmTwinHighAngleMountKaiAMG = masterIdEq(275);

	// 20-tube 7inch UP Rocket Launchers
	var is20tube7inchUPRocketLaunchers = masterIdEq(301);
	// QF 2-pounder Octuple Pom-pom Gun Mount
	var isBritishAAGun = masterIdEq(191);
	// 16inch Mk.I Triple Gun Mount Kai + FCR Type 284 (UP Rocket Launchers embedded)
	// 20-tube 7inch UP Rocket Launchers
	var isBritishRocketLauncher = masterIdIn([300, 301]);

	// GFCS Mk.37
	var isGfcsRadar = masterIdEq(307);
	// 5inch Single Gun Mount Mk.30 Kai + GFCS Mk.37
	var is5inchSingleMountKaiWithGfcs = masterIdEq(308);
	// 5inch Single Gun Mount Mk.30 Kai
	var is5inchSingleMountKai = masterIdEq(313);
	// 5inch Single Gun Mount Mk.30 or +Kai
	var is5inchSingleMountOrKai = masterIdIn([284, 313]);

	// 5inch Twin Dual-purpose Gun Mount (Concentrated Deployment)
	var is5inchTwinDualMountCD = masterIdEq(362);
	// GFCS Mk.37 + 5inch Twin Dual-purpose Gun Mount (Concentrated Deployment)
	var is5inchTwinDualMountCDwithGfcs = masterIdEq(363);
	// any of previous two guns
	var is5inchTwinDualMountCdOrWithGfcs = predAnyOf(is5inchTwinDualMountCD, is5inchTwinDualMountCDwithGfcs);

	// 10cm Twin High-angle Gun Mount Battery Concentrated Deployment
	var is10cmTwinHighAngleGunMountBatteryCD = masterIdEq(464);
	// 15m Duplex Rangefinder + Type 21 Air Radar Kai Ni or + Skilled Fire Direction Center
	var is15mDuplexRangefinderT21AirRadarOrFDC = masterIdIn([142, 460]);

	// 35.6cm Twin Gun Mount Kai 3 (Dazzle Camouflage) or Kai 4
	var is356mmTwinGunMountKai3Plus = masterIdIn([502, 503]);

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
		if (is46cmTripleMount(mst))
			return 0.25;
		if (isType3Shell(mst))
			return 0.6;
		if (isAARadar(mst))
			return 0.4;
		if (isHighAngleMount(mst) || isAAFD(mst))
			return 0.35;
		// 0.2 by default, even for unverified equipment since KC Vita does so
		/*
		if (predAnyOf(isRedGun,
				  isYellowGun,
				  isMachineGun,
				  isFighter,
				  isDiveBomber,
				  isSeaplaneRecon)(mst))
			return 0.2;
		*/
		return 0.2;
	}

	// Updated data: https://wikiwiki.jp/kancolle/%E5%AF%BE%E7%A9%BA%E7%A0%B2%E7%81%AB
	function getShipImprovementModifier(mst) {
		if (isMachineGun(mst))
			return isHighAAGear(mst) ? 6 : 4;
		if (isHighAngleMount(mst))
			return isHighAAGear(mst) ? 3 : 2;
		if (isAAFD(mst))
			return isHighAAGear(mst) ? 3 : 2;
		if (isAARadar(mst))
			return 0;
		// no default value for unverified equipment
		return 0;
	}

	function getFleetImprovementModifier(mst) {
		if (isHighAngleMount(mst))
			return isHighAAGear(mst) ? 3 : 2;
		if (isAAFD(mst))
			return isHighAAGear(mst) ? 3 : 2;
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
		// ~~According verification, AA bonus of specific equip on specific ship not counted~~
		// Visible AA bonus applied since 2022-08-04 https://twitter.com/KanColle_STAFF/status/1555144543766724608
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

	function shipEquipmentAntiAir(shipObj, forFleet, includeOnShipBonus = true) {
		// Calculations unknown for AA visible bonus yet,
		// total value added to adjusted aa of both ship and fleet?
		// https://twitter.com/nishikkuma/status/1555195233658601473
		// https://twitter.com/noro_006/status/1562055932431208448
		var onShipBonus = !includeOnShipBonus ? 0 :
			(forFleet ? 0.5 : 2*0.375) * shipObj.equipmentTotalStats("tyku", true, true, true);
		var allItems = allShipEquipments(shipObj);
		return onShipBonus + allItems.reduce( function(curAA, item) {
			return curAA + item.aaDefense(forFleet);
		}, 0);
	}

	function shipAdjustedAntiAir(shipObj) {
		//return shipObj.aa[1] + shipEquipmentAntiAir(shipObj, false);
		// here aa[1] is max naked stat on lv99, equaled to api_tyku[1], to get current level naked stat,
		// might use current naked stat: aa[0] - equipment stat.
		// according verification, AA bonus of specific equip on specific ship not counted,
		// it seems be better not to use aa[0] property,
		// might use `shipObj.estimateNakedStats("aa")` instead.
		// According KC vita calculations, player ship AA is x0.5, but our formula does not,
		// so here all equipment modifiers for ship are x2 either, and specialFloor used later.
		return shipObj.estimateNakedStats("aa") + shipEquipmentAntiAir(shipObj, false);
	}

	function abyssalEquipmentAntiAir(gearMst, forFleet) {
		if (typeof gearMst === "number" && KC3Master.isAbyssalGear(gearMst))
			gearMst = KC3Master.slotitem(gearMst);
		if (!gearMst) return 0;
		return calcEquipmentAADefense(gearMst, 0, forFleet);
	}

	function abyssalShipAdjustedAntiAir(shipMst, altTyku, altSlots) {
		if (typeof shipMst === "number" && KC3Master.isAbyssalShip(shipMst))
			shipMst = KC3Master.abyssal_ship(shipMst);
		// return undefined if required parameters not ready
		if (!shipMst || (shipMst.api_tyku === undefined && altTyku === undefined)
			|| (!Array.isArray(shipMst.kc3_slots) && !Array.isArray(altSlots))) return;
		// https://wikiwiki.jp/kancolle/%E5%AF%BE%E7%A9%BA%E7%A0%B2%E7%81%AB#enemy_AAfire
		var shipAA = altTyku || shipMst.api_tyku || 0;
		var allItems = (altSlots || shipMst.kc3_slots).map(id => KC3Master.slotitem(id));
		var totalEquipBaseAA = allItems.reduce((sum, item) => sum + (item.api_tyku || 0), 0);
		var totalEquipAADefense = allItems.reduce((sum, item) => sum + abyssalEquipmentAntiAir(item, false), 0);
		// abyssal does not need specialFloor, since according KC vita calculations,
		// no x0.5 applied to abyssal ship's AA, here x2 as fleet adjusted AA does,
		// in order to be put into the same formula.
		return 2 * Math.floor(Math.sqrt(shipAA + totalEquipBaseAA)) + totalEquipAADefense;
	}

	function abyssalShipFleetAdjustedAntiAir(shipMst, altSlots, formationModifier = 1) {
		if (typeof shipMst === "number" && KC3Master.isAbyssalShip(shipMst))
			shipMst = KC3Master.abyssal_ship(shipMst);
		// return undefined if required parameters not ready
		if (!shipMst || (!Array.isArray(shipMst.kc3_slots) && !Array.isArray(altSlots))) return;
		var allItems = (altSlots || shipMst.kc3_slots).map(id => KC3Master.slotitem(id));
		var totalEquipFleetDefense = allItems.reduce((sum, item) => sum + abyssalEquipmentAntiAir(item, true), 0);
		return (2/1) * Math.floor(formationModifier * totalEquipFleetDefense);
	}

	function abyssalFleetAdjustedAntiAir(fleetArr, formationModifier = 1) {
		if (!Array.isArray(fleetArr)) return;
		var allShips = fleetArr.map(id => KC3Master.abyssal_ship(id));
		var totalEquipFleetDefense = allShips.reduce((total, shipMst) => {
			var allItems = (shipMst.kc3_slots || []).map(id => KC3Master.slotitem(id));
			return allItems.reduce((sum, item) => sum + abyssalEquipmentAntiAir(item, true), 0);
		}, 0);
		return (2/1) * Math.floor(formationModifier * totalEquipFleetDefense);
	}

	function shipProportionalShotdownRate(shipObj, onCombinedFleetNum) {
		var floor = specialFloor(shipObj);
		var adjustedAA = shipAdjustedAntiAir(shipObj);
		var combinedModifier = getCombinedFleetModifier(onCombinedFleetNum);
		return floor(adjustedAA) / 400 * combinedModifier;
		// according KC vita calculations, `/ 400` should be `* 0.02 * 0.25 / 2`
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
		// according KC vita calculations, 1.3 is browser ver player constant,
		// x2 since extra /2 on later calc, to fit with 'ship adjusted not x0.5, so x2 everywhere calc'
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
			// according KC vita calculations, `/ 10` should be `* 0.25 * 0.8 / 2`, abyssal uses 0.75 instead of 0.8
		);
	}

	// avoid modifying this structure directly, use "declareAACI" instead.
	var AACITable = {};

	// 2 parts of fixed bonus defined by KC vita, and resist means AAR (and smoke?) modifier applied to this part only
	//   and resist part is minimal 1 for player side even no AACI, which omitted by wikiwiki AACI table
	// sort order used for sorting on fleet priority of all possible AACIs
	// typeIcons is a array including [ship icon, equip icon, ...]
	// predicateShipMst is a function f: f(mst)
	// predicateShipObj is a function f: f(shipObj)
	// returns a boolean to indicate whether the ship in question (with equipments)
	// is capable of performing such type of AACI
	function declareAACI(
		apiId,
		fixedResist,
		fixedRandom,
		modifier,
		ratePercent,
		sortSequen,
		typeIcons,
		predicateShipSlots,
		predicateWithEquips) {
		AACITable[apiId] = {
			id: apiId,
			fixed: fixedResist + fixedRandom - 1,
			modifier: modifier,
			rate: ratePercent,
			sort: sortSequen,
			additives: [fixedResist, fixedRandom],
			icons: typeIcons,
			predicateShipMst: predicateShipSlots,
			predicateShipObj: predicateWithEquips
		};
	}

	// Icons used to declare AACI type
	var surfaceShipIcon = 0, // Means no icon, low priority
		akizukiIcon = 421,
		battleShipIcon = 131, // Yamato, weigh anchor!
		battleShipKaiIcon = 148, // Musashi Kai represents
		yamatoK2Icon = 911,
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
		tenryuuK2Icon = 477,
		tatsutaK2Icon = 478,
		ooyodoKaiIcon = 321,
		isokazeBkIcon = 557,
		hamakazeBkIcon = 558,
		warspiteIcon = 439,
		gotlandKaiIcon = 579,
		johnstonIcon = 562,
		fletcherIcon = 596,
		atlantaIcon = 597,
		harunaK2BIcon = 593,
		haMountIcon = 16,
		radarIcon = 11,
		aaFdIcon = 30,
		aaGunIcon = 15,
		lcMainGunIcon = 3,
		type3ShellIcon = 12,
		// Special combined icons for Build-in HA / CDMG / etc
		biHaMountIcon = "16+30",    // HA plus AAFD
		cdmgIcon = "15+15",         // AAGun double
		haMountNbifdIcon = "16-30", // HA without AAFD
		aaGunNotCdIcon = "15-15",   // Non-CD AA Machine Gun
		aaGunK2RockeLaunIcon = "15+31", // 12cm 30tube Rocket Launcher Kai 2
		haMountKaiAmg = "16+15",    // 10cm Twin High-angle Mount Kai + Additional Machine Gun
		haMountKaiRadar = "16+11",  // 5inch Single Gun Mount Mk.30 Kai + GFCS Mk.37 / GFCS Mk.37 + next one
		haMountCdIcon = "16+16",  // 5inch Twin Dual-purpose Gun Mount (Concentrated Deployment)
		rangefinderRadarIcon = "11+30";  // 15m Duplex Rangefinder + Type 21 Air Radar Kai Ni variants

	// Ships (types/classes) used to declare AACI type
	var isNotSubmarine = predNot(stypeIdIn( [13 /* SS */, 14 /* SSV */] ));
	var isBattleship = stypeIdIn( [8 /* FBB */, 9 /* BB */, 10 /* BBV */] );
	var isAkizukiClass = ctypeIdEq( 54 );
	var isNotAkizukiClass = predNot( isAkizukiClass );
	var isMusashiK2 = masterIdEq( musashiK2Icon );
	var isMayaK2 = masterIdEq( mayaK2Icon );
	var isNotMayaK2 = predNot( isMayaK2 );
	var isIsuzuK2 = masterIdEq( isuzuK2Icon );
	var isKasumiK2B = masterIdEq( kasumiK2BIcon );
	var isSatsukiK2 = masterIdEq( satsukiK2Icon );
	var isKinuK2 = masterIdEq( kinuK2Icon );
	var isYuraK2 = masterIdEq( yuraK2Icon );
	var isFumizukiK2 = masterIdEq( fumizukiK2Icon );
	var isUit25 = masterIdEq( uit25Icon );
	var isI504 = masterIdEq( i504Icon );
	var isTenryuuK2 = masterIdEq( tenryuuK2Icon );
	var isTatsutaK2 = masterIdEq( tatsutaK2Icon );
	var isOoyodoKai = masterIdEq ( ooyodoKaiIcon );
	var isIsokazeBk = masterIdEq( isokazeBkIcon );
	var isHamakazeBk = masterIdEq( hamakazeBkIcon );
	var isGotlandKai = masterIdEq( gotlandKaiIcon );
	var isGotlandAndra = masterIdEq( 630 );
	var isFletcherClass = ctypeIdEq( 91 );
	var isAtlantaClass = ctypeIdEq( 99 );
	var isYuubariK2 = masterIdEq( 622 );
	var isHarunaK2B = masterIdEq( harunaK2BIcon );

	function isIseClassKai( mst ) {
		return mst.api_ctype === 2
			// if non-Kai excluded
			&& mst.api_id !== 77 && mst.api_id !== 87;
			// ~~Ise Kai Ni included, but Hyuuga Kai Ni incapable for both kind 25 and 28~~
			// https://twitter.com/MadonoHaru/status/1121902964120023040
			// wtf, it was a bug before 2019-04-30 maint
			// https://twitter.com/KanColle_STAFF/status/1123197646561136642
			//&& mst.api_id !== 554;
	}
	// Battleships capable for 12cm 30tube Rocket Launcher Kai 2
	var isBattleShipKai = masterIdIn([
		82, // Ise Kai
		553, // Ise K2
		88, // Hyuuga Kai
		554, // Hyuuga K2
		148, // Musashi Kai
		546, // Musashi K2
	]);
	// British-relevant ships can trigger AACI with 20-tube 7inch UP Rocket Launchers
	var isBritishShips = predAnyOf(ctypeIdIn([
			67, // Queen Elizabeth Class
			78, // Ark Royal Class
			82, // Jervis Class
			88, // Nelson Class
			// Shelffield not been capable until 2021-2-5 fix
			// https://twitter.com/KanColle_STAFF/status/1357645300895080449
			108, // Town Class
			112, // Illustrious Class
		]),
		// Kongou Class Kai Ni+
		masterIdIn( [149, 150, 151, 152, 591, 592, 593, 954] )
	);
	var isYamatoClassKai2 = masterIdIn([
		911, // Yamato K2
		916, // Yamato K2J
		546, // Musashi K2
	]);

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

	// check if slot num of ship (excluding ex-slot) equals or greater
	// note: 8cm HA mount variants and AA machine guns can be equipped in ex-slot
	function slotNumAtLeast(n) {
		return function(mst) {
			var slotnum = mst.api_slot_num;
			return slotnum >= n;
		};
	}

	// General AACIs for all non-sub surface ships, according KC vita codes, no ship type is used in predictions,
	//   (only ctype for Akizuki kinds, id for Maya K2 kinds)
	// might be able to trigger as long as ship can equip corresponding equipment,
	//   eg: kind 5,7,8,9,12,13 may be available for submarines if they can equip HA mount and air radar.
	// but kind 5,7,8,~9~ (contains HA mount) seems never trigger on Akizuki-class,
	//   reason might be: https://gist.github.com/Nishisonic/62cead1f57a323c737019d6b630fa4a5
	// Besides, there are 3 elements in KC vita `antifireParam` (see `Server_Controllers.BattleLogic/Exec_AirBattle.cs`)
	//   fixed bonus [0] default to 1 for player, 0 for enemy, [1] another part of fixed bonus, [2] is modifier.
	//   however wikiwiki have assumed all fixed bonus +1, so values here are [0] + [1] - 1
	// Reworks of server-side codes are released on 2023-05-26, known facts from vita codes are subjected to update.

	// Akizuki-class AACIs
	declareAACI(
		1, 3, 5, 1.7, 65, 2100, // vita value: [3.0, 5.0, 1.75]
		[akizukiIcon, haMountIcon, haMountIcon, radarIcon],
		predAllOf(isAkizukiClass, slotNumAtLeast(3)),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( isHighAngleMount, 2 ),
				hasSome( isRadar ))
		)
	);
	declareAACI(
		2, 3, 4, 1.7, 58, 2200, // vita value
		[akizukiIcon, haMountIcon, radarIcon],
		predAllOf(isAkizukiClass, slotNumAtLeast(2)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isRadar ))
		)
	);
	declareAACI(
		3, 2, 3, 1.6, 50, 2300, // vita value
		[akizukiIcon, haMountIcon, haMountIcon],
		predAllOf(isAkizukiClass, slotNumAtLeast(2)),
		withEquipmentMsts(
			hasAtLeast( isHighAngleMount, 2 )
		)
	);

	// Battleship exclusive AACIs
	declareAACI(
		4, 5, 2, 1.5, 52, 2150, // vita value
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
		6, 4, 1, 1.45, 40, 2410, // vita value: [4.0, 1.0, 1.5]
		[battleShipIcon, lcMainGunIcon, type3ShellIcon, aaFdIcon],
		predAllOf(isBattleship, slotNumAtLeast(3)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isLargeCaliberMainGun ),
				hasSome( isType3Shell ),
				hasSome( isAAFD ))
		)
	);

	// General AACIs (except Akizuki-class)
	// not to be listed in Strategy Room Library for submarines because some gears not equippable,
	// the same reason for limitation of min slot num
	declareAACI(
		5, 2, 3, 1.5, 55, 2400, // vita value: [2.0, 3.0, 1.55], rate 50?
		[surfaceShipIcon, biHaMountIcon, biHaMountIcon, radarIcon],
		predAllOf(isNotSubmarine, isNotAkizukiClass, slotNumAtLeast(3)),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast(isBuiltinHighAngleMount, 2),
				hasSome( isAARadar ))
		)
	);
	declareAACI(
		7, 2, 2, 1.35, 45, 2600, // vita value
		[surfaceShipIcon, haMountIcon, aaFdIcon, radarIcon],
		// 8cm HA variants can be equipped on ex-slot for some ships, min slots can be 2
		// but for now, these ships are all not 2-slot DD
		predAllOf(isNotSubmarine, isNotAkizukiClass, slotNumAtLeast(3)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAFD ),
				hasSome( isAARadar ))
		)
	);
	declareAACI(
		8, 2, 3, 1.4, 50, 2500, // vita value: [2.0, 3.0, 1.45]
		[surfaceShipIcon, biHaMountIcon, radarIcon],
		predAllOf(isNotSubmarine, isNotAkizukiClass, slotNumAtLeast(2)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isBuiltinHighAngleMount ),
				hasSome( isAARadar ))
		)
	);
	// possible to trigger on Akizuki-class since 2023-05-26 for unknown reason
	declareAACI(
		9, 1, 2, 1.3, 40, 2750, // vita value
		[surfaceShipIcon, haMountIcon, aaFdIcon],
		predAllOf(isNotSubmarine, slotNumAtLeast(1)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAFD ))
		)
	);
	declareAACI(
		12, 1, 3, 1.25, 45, 2700, // vita value
		[surfaceShipIcon, cdmgIcon, aaGunIcon, radarIcon],
		predAllOf(isNotSubmarine, slotNumAtLeast(2)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isAAGunCDMG ),
				/* CDMGs are AAGuns, so we need at least 2 AA guns
				   including the CDMG one we have just counted */
				hasAtLeast( isAAGunWithAtLeast(3), 2 ),
				hasSome( isAARadar ))
		)
	);
	// api_kind 13 was deprecated by devs, perhaps masked by kind 8/10 so 0% trigger chance?
	// according vita codes, non-MayaK2 biHaMount+CDMG+AirRadar +4 x1.35
	// eventually fixed by the reworks on 2023-05-26
	declareAACI(
		13, 1, 4, 1.35, 35, 2510, // vita value
		[surfaceShipIcon, biHaMountIcon, cdmgIcon, radarIcon],
		predAllOf(isNotSubmarine, isNotMayaK2, slotNumAtLeast(2)),
		withEquipmentMsts(
			predAllOf(
				hasSome( isBuiltinHighAngleMount ),
				hasSome( isAAGunCDMG ),
				hasSome( isAARadar ))
		)
	);

	// Maya K2
	declareAACI(
		10, 3, 6, 1.65, 60, 1900, // vita value
		[mayaK2Icon, haMountIcon, cdmgIcon, radarIcon],
		// Omitted slot num for kinds that ship and remodel specified, same below
		predAllOf(isMayaK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGunCDMG ),
				hasSome( isAARadar ))
		)
	);
	declareAACI(
		11, 2, 5, 1.5, 55, 1930, // vita value
		[mayaK2Icon, haMountIcon, cdmgIcon],
		predAllOf(isMayaK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGunCDMG ))
		)
	);

	// All values like fixed and rate below are uncertain because only 1~13 implemented by KC vita
	// AA stat 2 machine gun capable for kind 14~17: https://twitter.com/nishikkuma/status/1535641120386224129
	// Isuzu K2
	declareAACI(
		14, 4, 1, 1.45, 63, 2290,
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
		15, 3, 1, 1.3, 54, 2590,
		[isuzuK2Icon, haMountIcon, aaGunIcon],
		predAllOf(isIsuzuK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGun ))
		)
	);

	// Kasumi K2B, Yuubari K2
	declareAACI(
		16, 4, 1, 1.4, 62, 2280,
		[kasumiK2BIcon, haMountIcon, aaGunIcon, radarIcon],
		predAnyOf(isKasumiK2B, isYuubariK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGun ),
				hasSome( isAARadar ))
		)
	);
	declareAACI(
		17, 2, 1, 1.25, 57, 2720,
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
		18, 2, 1, 1.2, 59, 2730,
		[satsukiK2Icon, cdmgIcon],
		predAllOf(isSatsukiK2),
		withEquipmentMsts(
			hasSome( isAAGunCDMG )
		)
	);

	// Kinu K2
	declareAACI(
		19, 5, 1, 1.45, 60, 2250, // rate 55?
		[kinuK2Icon, haMountNbifdIcon, cdmgIcon],
		predAllOf(isKinuK2),
		withEquipmentMsts(
			predAllOf(
				/* any HA with builtin AAFD will not work */
				predNot( hasSome( isBuiltinHighAngleMount )),
				hasSome( isHighAngleMount ),
				hasSome( isAAGunCDMG ))
		)
	);
	declareAACI(
		20, 3, 1, 1.25, 65, 2610,
		[kinuK2Icon, cdmgIcon],
		predAllOf(isKinuK2),
		withEquipmentMsts(
			hasSome( isAAGunCDMG )
		)
	);

	// Yura K2
	declareAACI(
		21, 5, 1, 1.45, 60, 2260,
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
		22, 2, 1, 1.2, 65, 2740, // rate 60?
		[fumizukiK2Icon, cdmgIcon],
		predAllOf(isFumizukiK2),
		withEquipmentMsts(
			hasSome( isAAGunCDMG )
		)
	);

	// UIT-25, I-504
	declareAACI(
		23, 1, 1, 1.05, 80, 2760, // fixed referred from abyssal resist: [1, 1]
		[uit25Icon, aaGunNotCdIcon],
		predAnyOf(isUit25, isI504),
		withEquipmentMsts(
			hasSome( isAAGunNotCD )
		)
	);

	// Tenryuu K2, Tatsuta K2
	declareAACI(
		24, 3, 1, 1.25, 62, 2620, // rate 50?
		[tatsutaK2Icon, haMountIcon, aaGunNotCdIcon],
		predAnyOf(isTenryuuK2, isTatsutaK2),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGunNotCD ))
		)
	);

	// Ise-class Kai+
	declareAACI(
		25, 7, 1, 1.55, 60, 1950,
		[iseIcon, aaGunK2RockeLaunIcon, radarIcon, type3ShellIcon],
		predAllOf(isIseClassKai, slotNumAtLeast(2)),
		withEquipmentMsts(
			predAllOf(
				hasSome( is12cm30tubeRocketLauncherKai2 ),
				hasSome( isType3Shell ),
				hasSome( isAARadar ))
		)
	);

	// Musashi K2, Yamato K2+
	declareAACI(
		26, 6, 1, 1.4, 60, 2130, // rate 55?
		[musashiK2Icon, haMountKaiAmg, radarIcon],
		predAllOf(isYamatoClassKai2),
		withEquipmentMsts(
			predAllOf(
				hasSome( is10cmTwinHighAngleMountKaiAMG ),
				hasSome( isAARadar ))
		)
	);

	// Ooyodo Kai
	declareAACI(
		27, 5, 1, 1.55, 55, 2230,
		[ooyodoKaiIcon, haMountKaiAmg, aaGunK2RockeLaunIcon, radarIcon],
		predAllOf(isOoyodoKai),
		withEquipmentMsts(
			predAllOf(
				hasSome( is10cmTwinHighAngleMountKaiAMG ),
				hasSome( is12cm30tubeRocketLauncherKai2 ),
				hasSome( isAARadar ))
		)
	);

	// Ise-class Kai+, Musashi Kai+
	declareAACI(
		28, 4, 1, 1.4, 55, 2420,
		[battleShipKaiIcon, aaGunK2RockeLaunIcon, radarIcon],
		predAllOf(isBattleShipKai),
		withEquipmentMsts(
			predAllOf(
				hasSome( is12cm30tubeRocketLauncherKai2 ),
				hasSome( isAARadar ))
		)
	);

	// Isokaze B Kai, Hamakaze B Kai
	declareAACI(
		29, 5, 1, 1.55, 60, 2270,
		[isokazeBkIcon, haMountIcon, radarIcon],
		predAnyOf(isIsokazeBk, isHamakazeBk),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAARadar ))
		)
	);

	// Tenryuu K2, Gotland Kai+
	declareAACI(
		30, 3, 1, 1.3, 50, 2450, // rate 40?
		[tenryuuK2Icon, haMountIcon, haMountIcon, haMountIcon],
		predAnyOf(isTenryuuK2, isGotlandKai, isGotlandAndra),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( isHighAngleMount, 3 ))
		)
	);
	declareAACI(
		31, 2, 1, 1.25, 50, 2710,
		[tenryuuK2Icon, haMountIcon, haMountIcon],
		predAllOf(isTenryuuK2),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( isHighAngleMount, 2 ))
		)
	);

	// British-relevant ships
	//   Known for now: Nelson, Warspite, Ark Royal, Jervis, all Kongou-class K2
	// (QF2 + FCR) OR (QF2 + 7UP) OR (7UP + 7UP)
	declareAACI(
		32, 3, 1, 1.2, 60, 2630, // rate 50?
		[warspiteIcon, aaGunK2RockeLaunIcon, cdmgIcon],
		predAnyOf(isBritishShips),
		withEquipmentMsts(
			predAnyOf(
				predAllOf(
					hasSome( isBritishRocketLauncher ),
					hasSome( isBritishAAGun )),
				predAllOf(
					hasAtLeast( is20tube7inchUPRocketLaunchers, 2 ))
			)
		)
	);

	// Gotland Kai/andra
	declareAACI(
		33, 3, 1, 1.35, 42, 2440,
		[gotlandKaiIcon, haMountIcon, aaGunIcon],
		predAnyOf(isGotlandKai, isGotlandAndra),
		withEquipmentMsts(
			predAllOf(
				hasSome( isHighAngleMount ),
				hasSome( isAAGunWithAtLeast(4) ))
		)
	);

	// Fletcher-class all forms
	declareAACI(
		34, 7, 1, 1.6, 60, 2110,
		[fletcherIcon, haMountKaiRadar, haMountKaiRadar],
		predAllOf(isFletcherClass),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( is5inchSingleMountKaiWithGfcs, 2 ))
		)
	);
	declareAACI(
		35, 6, 1, 1.55, 55, 2210,
		[fletcherIcon, haMountKaiRadar, haMountIcon],
		predAllOf(isFletcherClass),
		withEquipmentMsts(
			predAllOf(
				hasSome( is5inchSingleMountOrKai ),
				hasSome( is5inchSingleMountKaiWithGfcs ))
		)
	);
	declareAACI(
		36, 6, 1, 1.55, 50, 2220,
		[fletcherIcon, haMountIcon, haMountIcon, radarIcon],
		// there are enough slots for Kai only
		predAllOf(isFletcherClass, slotNumAtLeast(3)),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( is5inchSingleMountOrKai, 2 ),
				hasSome( isGfcsRadar ))
		)
	);
	declareAACI(
		37, 2, 3, 1.45, 40, 2430, // fixed referred from abyssal resist: [2or3, 3or2]
		[fletcherIcon, haMountIcon, haMountIcon],
		predAllOf(isFletcherClass),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( is5inchSingleMountKai, 2 ))
		)
	);

	// Atlanta-class
	declareAACI(
		38, 6, 5, 1.85, 60, 1500, // fixed referred from abyssal resist 0.6: [5or6, 6or5]
		[atlantaIcon, haMountKaiRadar, haMountKaiRadar],
		predAllOf(isAtlantaClass),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( is5inchTwinDualMountCDwithGfcs, 2 ))
		)
	);
	declareAACI(
		39, 6, 5, 1.7, 60, 1600, // rate 55?
		[atlantaIcon, haMountKaiRadar, haMountCdIcon],
		predAllOf(isAtlantaClass),
		withEquipmentMsts(
			predAllOf(
				hasSome( is5inchTwinDualMountCDwithGfcs ),
				hasSome( is5inchTwinDualMountCD ))
		)
	);
	declareAACI(
		40, 6, 5, 1.7, 60, 1700, // fixed referred from pvp resist 0.5: [6or7, 5or4]
		[atlantaIcon, haMountCdIcon, haMountCdIcon, radarIcon],
		predAllOf(isAtlantaClass),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( is5inchTwinDualMountCdOrWithGfcs, 2 ),
				hasSome( isGfcsRadar ))
		)
	);
	declareAACI(
		41, 5, 5, 1.65, 55, 1800,
		[atlantaIcon, haMountCdIcon, haMountCdIcon],
		predAllOf(isAtlantaClass),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( is5inchTwinDualMountCdOrWithGfcs, 2 ))
		)
	);

	// Yamato K2+, Musashi K2 (kind 26 either)
	declareAACI(
		42, 10, 1, 1.65, 65, 1750,
		[yamatoK2Icon, haMountCdIcon, haMountCdIcon, rangefinderRadarIcon, aaGunIcon],
		predAllOf(isYamatoClassKai2),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( is10cmTwinHighAngleGunMountBatteryCD, 2 ),
				hasSome( is15mDuplexRangefinderT21AirRadarOrFDC ),
				hasSome( isAAGunWithAtLeast(6) ))
		)
	);
	declareAACI(
		43, 8, 1, 1.6, 60, 1910, // rate 55?
		[yamatoK2Icon, haMountCdIcon, haMountCdIcon, rangefinderRadarIcon],
		predAllOf(isYamatoClassKai2),
		withEquipmentMsts(
			predAllOf(
				hasAtLeast( is10cmTwinHighAngleGunMountBatteryCD, 2 ),
				hasSome( is15mDuplexRangefinderT21AirRadarOrFDC ))
		)
	);
	declareAACI(
		44, 6, 1, 1.6, 55, 2120,
		[yamatoK2Icon, haMountCdIcon, rangefinderRadarIcon, aaGunIcon],
		predAllOf(isYamatoClassKai2),
		withEquipmentMsts(
			predAllOf(
				hasSome( is10cmTwinHighAngleGunMountBatteryCD ),
				hasSome( is15mDuplexRangefinderT21AirRadarOrFDC ),
				hasSome( isAAGunWithAtLeast(6) ))
		)
	);
	declareAACI(
		45, 5, 1, 1.55, 50, 2240,
		[yamatoK2Icon, haMountCdIcon, rangefinderRadarIcon],
		predAllOf(isYamatoClassKai2),
		withEquipmentMsts(
			predAllOf(
				hasSome( is10cmTwinHighAngleGunMountBatteryCD ),
				hasSome( is15mDuplexRangefinderT21AirRadarOrFDC ))
		)
	);

	// Haruna K2B
	declareAACI(
		46, 3, 6, 1.55, 50, 1920, // fixed referred from abyssal resist under smoke
		[harunaK2BIcon, lcMainGunIcon, cdmgIcon, radarIcon],
		predAllOf(isHarunaK2B),
		withEquipmentMsts(
			predAllOf(
				hasSome( is356mmTwinGunMountKai3Plus ),
				hasSome( isAAGunCDMG ),
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
	//    * https://docs.google.com/document/d/1XBrQgQsA_pM3fXsDDC7e1N5Xpr2p59kmvQbnY2UH0Ko
	//    * https://gist.github.com/Nishisonic/62cead1f57a323c737019d6b630fa4a5
	//    * http://nishisonic.xsrv.jp/archives/809
	//    * https://twitter.com/syoukuretin/status/1535102184530276352
	//   here still use the simple way via ordering by 'effect' since new AACI kinds not covered by investigations.
	// note: priority is different from trigger chance rate, since random number roll just done once,
	//       lower priority AACI is still possible to be triggered if chance value is greater.
	//       on the opposite, both lower priority and lesser chance means never be triggered.
	// note since 2023-05-26: priority and roll chance have been re-organized, notably:
	//    * almost all possible patterns on a ship are put into the list to get trigger chance;
	//    * kind 13 no longer unreachable by trigger rate or elseif statement;
	//    * priority of all possible patterns on fleet no longer ordered by ID, new sorting updated on 2023-05-28;
	//    * https://docs.google.com/spreadsheets/d/1agGoLv57g5eOXLXtNIKHRoBYy61OQYxibWP6Vi_DMuY/view
	//    other details still under investigations.
	// param: AACI IDs from possibleAACIs functions
	// param: a optional callback function to customize ordering
	function sortedPossibleAaciList(aaciIds, sortCallback) {
		var aaciList = [];
		if(!!aaciIds && Array.isArray(aaciIds)) {
			$.each( aaciIds, function(i, apiId) {
				if(!!AACITable[apiId]) aaciList.push( AACITable[apiId] );
			});
			var defaultOrder = function(a, b) {
				// Order by predefined asc (since 2023-05-28),  fixed desc, modifier desc, icons[0] desc
				return (a.sort || Infinity) - (b.sort || Infinity)
					|| b.fixed - a.fixed
					|| b.modifier - a.modifier
					|| b.icons[0] - a.icons[0];
			};
			aaciList = aaciList.sort(sortCallback || defaultOrder);
		}
		return aaciList;
	}

	function sortedFleetPossibleAaciList(triggeredShipAaciIds) {
		return sortedPossibleAaciList(triggeredShipAaciIds, function(a, b) {
			// Order by predefined order id asc (since 2023-05-28), API id desc
			return (a.sort || Infinity) - (b.sort || Infinity)
				|| b.id - a.id;
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

		abyssalShipAdjustedAntiAir: abyssalShipAdjustedAntiAir,
		abyssalShipFleetAdjustedAntiAir: abyssalShipFleetAdjustedAntiAir,
		abyssalFleetAdjustedAntiAir: abyssalFleetAdjustedAntiAir,

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
		sortedPossibleAaciList: sortedPossibleAaciList,
		sortedFleetPossibleAaciList: sortedFleetPossibleAaciList
	};
})();
