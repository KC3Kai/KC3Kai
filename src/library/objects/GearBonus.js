/**
 * GearBonus.js
 * KC3改 The definitions of Ship's stats visible bonuses from equipment (Gears).
 * Visible bonus only, hidden bonuses, improvement bonuses, anti-specified-target bonuses are excluded for now.
 */
(function(){
	"use strict";

	// All methods are static, do not instantiate this.
	window.KC3GearBonus = function() {
	};

	/**
	 * Explicit stats visible bonuses from equipment on specific ship are added to API result by server-side,
	 * to correct the 'naked stats' for these cases, have to simulate them all.
	 * These definitions might be moved to an independent JSON, but kept to be a module so that we can add comments.
	 * @return a bonus definition table with new counters bound to relevant equipment IDs.
	 * @see https://wikiwiki.jp/kancolle/%E8%A3%85%E5%82%99#bonus - about naming of this bonus type
	 * @see https://kancolle.fandom.com/wiki/Equipment_Bonuses - summary tables and named: visible bonuses
	 * @see `main.js#SlotItemEffectUtil` - since 2020-03-03, devs implemented client-side bonuses display, which hard-coded these logics and wrapped results with `SlotItemEffectModel`
	 * @see URLs some other summary tables:
	 *  * [20210916 ALL] https://docs.google.com/spreadsheets/d/1bInH11S_xKdaKP754bB7SYh-di9gGzcXkiQPvGuzCpg/htmlview
	 *  * [20210301 ALL] https://www.npmjs.com/package/equipment-bonus
	 *  * [20190208 ALL] https://docs.google.com/spreadsheets/d/1_peG-B4ijt7HOvDtkd8dPZ8vA7ZMLx-YuwsuGoEm6wY/htmlview
	 *  * [20180904 ALL] https://github.com/andanteyk/ElectronicObserver/blob/develop/ElectronicObserver/Other/Information/kcmemo.md#%E7%89%B9%E6%AE%8A%E8%A3%85%E5%82%99%E3%81%AB%E3%82%88%E3%82%8B%E3%83%91%E3%83%A9%E3%83%A1%E3%83%BC%E3%82%BF%E8%A3%9C%E6%AD%A3
	 *  * [20180816 ALL] http://furukore.com/archives/13793
	 *  * [20180726  DD] https://zekamashi.net/kancolle-kouryaku/kutiku-fit/
	 *  * [20180808  DD] https://kitongame.com/%E3%80%90%E8%89%A6%E3%81%93%E3%82%8C%E3%80%91%E9%A7%86%E9%80%90%E8%89%A6%E3%81%AE%E4%B8%BB%E7%A0%B2%E3%83%95%E3%82%A3%E3%83%83%E3%83%88%E8%A3%9C%E6%AD%A3%E3%81%A8%E8%89%A6%E7%A8%AE%E5%88%A5%E3%81%8A/#i
	 *  * [20180429  DD] https://twitter.com/Lambda39/status/990268289866579968
	 */
	KC3GearBonus.explicitStatsBonusGears = function(){
		return {
			"synergyGears": {
				surfaceRadar: 0,
				// Array constants used instead for faster executions:
				// surfaceRadarIds: KC3Master.find_slotitems(g => g.api_type[1] == 8 && g.api_saku >= 5 && g.api_id <= KC3Master.abyssalGearIdFrom).map(g => g.api_id)
				surfaceRadarIds: [28, 29, 31, 32, 88, 89, 124, 141, 142, 240, 278, 279, 307, 315, 410, 411, 450, 456, 460, 506, 517, 527, 528],
				airRadar: 0,
				// airRadarIds: KC3Master.find_slotitems(g => g.api_type[1] == 8 && g.api_tyku >= 2 && g.api_id <= KC3Master.abyssalGearIdFrom).map(g => g.api_id)
				airRadarIds: [27, 30, 32, 89, 106, 124, 142, 278, 279, 307, 315, 410, 411, 450, 456, 460, 506, 527, 528],
				highAccuracyRadar: 0,
				// highAccuracyRadarIds: KC3Master.find_slotitems(g => g.api_type[1] == 8 && g.api_houm >= 8 && g.api_id <= KC3Master.abyssalGearIdFrom).map(g => g.api_id)
				highAccuracyRadarIds: [31, 88, 124, 141, 142, 240, 307, 315, 411, 456, 460, 517, 528],
				aaMachineGun: 0,
				// aaMachineGunIds: KC3Master.find_slotitems(g => g.api_type[2] == 21 && g.api_id <= KC3Master.abyssalGearIdFrom).map(g => g.api_id)
				aaMachineGunIds: [37, 38, 39, 40, 49, 51, 84, 85, 92, 131, 173, 191, 274, 301, 505],
				rotorcraft: 0,
				// rotorcraftIds: KC3Master.find_slotitems(g => g.api_type[2] == 25 && g.api_id <= KC3Master.abyssalGearIdFrom).map(g => g.api_id)
				rotorcraftIds: [69, 324, 325, 326, 327],
				helicopter: 0,
				// helicopterIds: KC3Master.find_slotitems(g => g.api_type[1] == 44 && g.api_id <= KC3Master.abyssalGearIdFrom).map(g => g.api_id)
				helicopterIds: [326, 327],
				improvedTurbine: 0,
				improvedTurbineNonexist: 1,
				improvedTurbineIds: [33],
				enhancedBoiler: 0,
				enhancedBoilerNonexist: 1,
				enhancedBoilerIds: [34],
				newModelBoiler: 0,
				newModelBoilerIds: [87],
				tripleTorpedo: 0,
				tripleTorpedoIds: [13, 125, 285],
				tripleTorpedoLateModel: 0,
				tripleTorpedoLateModelIds: [285],
				tripleTorpedoOxygenLateModel: 0,
				tripleTorpedoOxygenLateModelIds: [125, 285],
				quadrupleTorpedoOxygenLateModel: 0,
				quadrupleTorpedoOxygenLateModelIds: [15, 286],
				submarineTorpedoLateModel: 0,
				submarineTorpedoLateModelIds: [213, 214, 383],
				submarineBowTorpedoLateModelSkilled: 0,
				submarineBowTorpedoLateModelSkilledIds: [461],
				kamikazeTwinTorpedo: 0,
				kamikazeTwinTorpedoIds: [174],
				tripleLargeGunMountK2: 0,
				tripleLargeGunMountK2Nonexist: 1,
				tripleLargeGunMountK2Ids: [290],
				triple305mm46LargeGunMount: 0,
				triple305mm46LargeGunMountIds: [427],
				triple320mm44LargeGunMount: 0,
				triple320mm44LargeGunMountIds: [429],
				twin14cmMediumGunMountK2: 0,
				twin14cmMediumGunMountK2Nonexist: 1,
				twin14cmMediumGunMountK2Ids: [518],
				twin203MediumGunMountNo2: 0,
				twin203MediumGunMountNo2Nonexist: 1,
				twin203MediumGunMountNo2Ids: [90],
				antiAirGreenSecGunMount: 0,
				antiAirGreenSecGunMountIds: [10, 66, 71, 130, 220, 275, 464],
				twin10cmKaiHighAngleGunMount: 0,
				twin10cmKaiHighAngleGunMountIds: [533, 553],
				twin51cmLargeGunMount: 0,
				twin51cmLargeGunMountIds: [281],
				twin51cmLargeGunMountNonexist: 1,
				triple14inch45LargeGunMount: 0,
				triple14inch45LargeGunMountIds: [508],
				twin127SmallGunMountModelDK2: 0,
				twin127SmallGunMountModelDK2Nonexist: 1,
				twin127SmallGunMountModelDK2Ids: [267],
				twin127SmallGunMountModelDK3: 0,
				twin127SmallGunMountModelDK3Ids: [366],
				ru130mmB13SmallGunMount: 0,
				ru130mmB13SmallGunMountIds: [282],
				ru10cm56GreenSecGunMount: 0,
				ru10cm56GreenSecGunMountIds: [556],
				skilledLookouts: 0,
				skilledLookoutsIds: [129, 412],
				searchlightSmall: 0,
				searchlightSmallIds: [74],
				type21AirRadar: 0,
				type21AirRadarIds: [30, 410],
				type21AirRadarK2: 0,
				type21AirRadarK2Ids: [410],
				type42AirRadarK2: 0,
				type42AirRadarK2Ids: [411],
				type13AirRadarKaiLateModel: 0,
				type13AirRadarKaiLateModelIds: [450],
				rangefinderAirRadar: 0,
				rangefinderAirRadarIds: [142, 460],
				rangefinderKaiAirRadar: 0,
				rangefinderKaiAirRadarIds: [460],
				usNavySurfaceRadar: 0,
				usNavySurfaceRadarIds: [279, 307, 315, 456],
				usNavyAirRadar: 0,
				usNavyAirRadarIds: [278, 279],
				frenchYellowSecGunMount: 0,
				frenchYellowSecGunMountIds: [247],
				frenchNightRecon: 0,
				frenchNightReconIds: [471, 538],
				frenchNightReconBase: 0,
				frenchNightReconBaseIds: [471],
				frenchNightReconKai: 0,
				frenchNightReconKaiIds: [538],
				germanLargeRadar: 0,
				germanLargeRadarIds: [124],
				arcticGearDeckPersonnel: 0,
				arcticGearDeckPersonnelIds: [402],
			},
			// Ryuusei
			"18": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": {
						remodel: 1,
						multiple: { "houg": 1 },
					},
					// Akagi Class Kai+
					"14": "3",
					// Taihou Class Kai
					"43": "3",
				},
				byShip: [
					{
						// extra +1 ev for Akagi Kai Ni, Kaga K2, K2Go
						ids: [594, 646, 698],
						multiple: { "houk": 1 },
					},
					{
						// extra +1 fp, +1 ev for Akagi Kai Ni E, Kaga K2E
						ids: [599, 610],
						multiple: { "houg": 1, "houk": 1 },
					},
				],
			},
			// Ryuusei Kai
			"52": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": {
						remodel: 1,
						multiple: { "houg": 1 },
					},
					// Akagi Class Kai+
					"14": "3",
					// Taihou Class Kai
					"43": "3",
				},
				byShip: [
					{
						// extra +1 ev for Akagi Kai Ni, Kaga K2, K2Go
						ids: [594, 646, 698],
						multiple: { "houk": 1 },
					},
					{
						// extra +1 fp, +1 ev for Akagi Kai Ni E, Kaga K2E
						ids: [599, 610],
						multiple: { "houg": 1, "houk": 1 },
					},
				],
			},
			// Ryuusei Kai (Skilled)
			"466": {
				count: 0,
				byShip: [
					{
						// Akagi Kai, Kaga Kai, Taihou Kai, Shoukaku Kai, Zuikaku Kai, Hiryuu Kai, Souryuu Kai
						ids: [277, 278, 156, 288, 112, 280, 279],
						multiple: { "houg": 1, "houm": 1 },
					},
					{
						// Shoukaku K2/K2A, Zuikaku K2/K2A
						ids: [461, 466, 462, 467],
						multiple: { "houg": 1, "houk": 2, "houm": 1 },
					},
					{
						// Akagi K2/K2E, Kaga K2/K2Go/K2E, Hiryuu K2, Souryuu K2
						ids: [594, 698, 646, 599, 610, 196, 197],
						multiple: { "houg": 1, "houk": 1, "houm": 2 },
					},
				],
			},
			// Ryuusei Kai (CarDiv 1)
			"342": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": {
						remodel: 1,
						multiple: { "houg": 1 },
					},
					// Akagi Class Kai+
					"14": "3",
					// Shoukaku Class Kai Ni+
					"33": {
						remodel: 2,
						multiple: { "houg": 1 },
					},
				},
				byShip: [
					{
						// extra +1 fp, +1 aa, +1 ev for Akagi Kai Ni, Kaga K2, K2Go
						ids: [594, 646, 698],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// extra +2 fp, +2 aa, +2 ev for Akagi Kai Ni E, Kaga K2E
						ids: [599, 610],
						multiple: { "houg": 2, "tyku": 2, "houk": 2 },
					},
				],
			},
			// Ryuusei Kai (CarDiv 1 / Skilled)
			"343": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": {
						remodel: 1,
						multiple: { "houg": 2 },
					},
					// Akagi Class Kai+
					"14": "3",
					// Shoukaku Class Kai Ni+
					"33": {
						remodel: 2,
						multiple: { "houg": 1 },
					},
				},
				byShip: [
					{
						// extra +1 fp, +2 aa, +1 ev for Akagi Kai Ni, Kaga K2, K2Go
						ids: [594, 646, 698],
						multiple: { "houg": 1, "tyku": 2, "houk": 1 },
					},
					{
						// extra +3 fp, +3 aa, +3 ev for Akagi Kai Ni E, Kaga K2E
						ids: [599, 610],
						multiple: { "houg": 3, "tyku": 3, "houk": 3 },
					},
				],
			},
			// Type 97 Torpedo Bomber (931 Air Group)
			"82": {
				count: 0,
				byClass: {
					// Taiyou Class
					// Kasugamaru ctype is 75, but she is Taiyou remodel group 0
					"76": {
						multiple: { "tais": 1, "houk": 1 },
					},
				},
			},
			// Type 97 Torpedo Bomber (931 Air Group / Skilled)
			"302": {
				count: 0,
				byClass: {
					// Taiyou Class
					"76": {
						multiple: { "tais": 1, "houk": 1 },
					},
				},
			},
			// Type 97 Torpedo Bomber (Tomonaga Squadron)
			"93": {
				count: 0,
				byClass: {
					// Souryuu
					"17": {
						single: { "houg": 1 },
					},
					// Hiryuu
					"25": {
						single: { "houg": 3 },
					},
				},
			},
			// Tenzan Model 12 (Tomonaga Squadron)
			"94": {
				count: 0,
				byClass: {
					// Souryuu Kai Ni
					"17": {
						remodel: 2,
						single: { "houg": 3 },
					},
					// Hiryuu Kai Ni
					"25": {
						remodel: 2,
						single: { "houg": 7 },
					},
				},
			},
			// Type 97 Torpedo Bomber (Murata Squadron)
			"143": {
				count: 0,
				byClass: {
					// Kaga Class
					"3": {
						single: { "houg": 2 },
					},
					// Akagi Class
					"14": {
						single: { "houg": 3 },
					},
					// Ryuujou Class
					"32": {
						single: { "houg": 1 },
					},
					// Shoukaku Class
					"33": {
						single: { "houg": 1 },
					},
				},
				byShip: [
					// extra +1 fp for Shoukaku all remodels
					{
						origins: [110],
						single: { "houg": 1 },
					},
				],
			},
			// Tenzan Model 12 (Murata Squadron)
			"144": {
				count: 0,
				byClass: {
					// Kaga Class
					"3": {
						single: { "houg": 2 },
					},
					// Akagi Class
					"14": {
						single: { "houg": 3 },
					},
					// Ryuujou Class
					"32": {
						single: { "houg": 1 },
					},
					// Shoukaku Class
					"33": [
						// Base and Kai
						{
							single: { "houg": 1 },
						},
						// Kai Ni+
						{
							remodel: 2,
							single: { "houg": 1 },
						},
					],
				},
				byShip: [
					// extra +1 fp for Shoukaku base and Kai
					{
						ids: [110, 288],
						single: { "houg": 1 },
					},
					// extra +2 fp for Shoukaku K2 and K2A
					{
						ids: [461, 466],
						single: { "houg": 2 },
					},
				],
			},
			// Prototype Type 97 Torpedo Bomber Kai Type 3 Model E (w/ Type 6 Airborne Radar Kai)
			"344": {
				count: 0,
				byShip: [
					{
						// Ryuuhou Kai
						ids: [318],
						multiple: { "houg": 4, "tais": 1 },
					},
					{
						// Ryuuhou K2
						ids: [888],
						multiple: { "houg": 4, "tais": 2 },
					},
					{
						// Ryuuhou K2E
						ids: [883],
						multiple: { "houg": 5, "tais": 2 },
					},
					{
						// Zuihou Kai Ni+
						ids: [555, 560],
						multiple: { "houg": 2, "tais": 2 },
					},
					{
						// Shouhou Kai
						ids: [282],
						multiple: { "houg": 2, "tais": 1 },
					},
					{
						// Akagi Kai Ni E, Kaga Kai Ni E
						ids: [599, 610],
						multiple: { "houg": 3 },
					},
				],
			},
			// Prototype Type 97 Torpedo Bomber Kai (Skilled) Type 3 Model E (w/ Type 6 Airborne Radar Kai)
			"345": {
				count: 0,
				byShip: [
					{
						// Ryuuhou Kai
						ids: [318],
						multiple: { "houg": 5, "tais": 1, "houk": 2 },
					},
					{
						// Ryuuhou K2
						ids: [888],
						multiple: { "houg": 4, "tais": 2, "houk": 2 },
					},
					{
						// Ryuuhou K2E
						ids: [883],
						multiple: { "houg": 5, "tais": 2, "houk": 3 },
					},
					{
						// Zuihou Kai Ni+
						ids: [555, 560],
						multiple: { "houg": 3, "tais": 2, "houk": 2 },
					},
					{
						// Shouhou Kai
						ids: [282],
						multiple: { "houg": 3, "tais": 1, "houk": 1 },
					},
					{
						// Akagi Kai Ni E, Kaga Kai Ni E
						ids: [599, 610],
						multiple: { "houg": 3, "houk": 1 },
					},
				],
			},
			// Type 97 Torpedo Bomber Kai (Northeastern Air Group)
			"554": {
				count: 0,
				starsDist: [],
				byClass: {
					// Houshou Class
					"27": {
						multiple: { "tais": 1, "houk": 1, "houm": 1 },
					},
					// Taiyou Class
					"76": "27",
				},
				byShip: [
					{
						// Any CVL
						stypes: [7],
						multiple: { "houg": 1, "tais": 1, "houk": 1 },
					},
					{
						// Zuihou Kai/K2/K2B, Houshou Kai/K2, Ryuuhou Kai/K2/K2E
						ids: [117, 555, 560, 285, 894, 318, 888, 883],
						multiple: { "houg": 1, "houm": 1 },
					},
					{
						// Houshou K2
						ids: [894],
						multiple: { "houg": 1 },
					},
					// For all ships can equip it
					{
						synergy: {
							flags: [ "arcticGearDeckPersonnel" ],
							multiple: { "houg": 3, "tais": 3, "houk": 1, "houm": 2 },
						},
					},
					{
						minStars: 2,
						multiple: { "houg": 1 },
					},
					{
						minStars: 4,
						multiple: { "houm": 1 },
					},
					{
						minStars: 6,
						multiple: { "tais": 1 },
					},
					{
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// TBM-3W+3S
			"389": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 2, "tais": 3, "houk": 1 },
					},
				},
				byShip: [
					{
						// Akagi Kai Ni, K2E
						ids: [594, 599],
						multiple: { "houg": 2, "houk": 2 },
					},
					{
						// Kaga Kai Ni, K2E
						ids: [698, 610],
						multiple: { "houg": 3, "houk": 2 },
					},
					{
						// Kaga Kai Ni Go
						ids: [646],
						multiple: { "houg": 4, "tais": 4, "houk": 3 },
						synergy: [
							{
								flags: [ "rotorcraft" ],
								single: { "houg": 3, "tais": 6 },
							},
							{
								flags: [ "helicopter" ],
								single: { "houg": 5, "tais": 4 },
							},
						],
					},
				],
			},
			// Tenzan Model 12A Kai 2 (Murata Squadron w/ Radar)
			"545": {
				count: 0,
				byShip: [
					{
						// Shoukaku
						origins: [110],
						single: { "houg": 4 },
					},
					{
						// Zuikaku
						origins: [111],
						single: { "houg": 3 },
					},
					{
						// Akagi
						origins: [83],
						single: { "houg": 2 },
					},
					{
						// Kaga, Taihou
						origins: [84, 153],
						single: { "houg": 1 },
					},
					{
						// Shoukaku K2+
						ids: [461, 466],
						multiple: { "houg": 1, "houm": 2, "houk": 1, "saku": 2 },
					},
					{
						// Zuikaku K2+, Kaga K2Go
						ids: [462, 467, 646],
						multiple: { "houg": 1, "houm": 1, "saku": 1 },
					},
					{
						// Akagi K2E, Kaga K2E, Taihou Kai
						ids: [599, 610, 156],
						multiple: { "houm": 1, "saku": 1 },
					},
				],
			},
			// Tenzan Model 12A Kai (with Type 6 Airborne Radar)
			"373": {
				count: 0,
				byClass: {
					// Shouhou Class
					"11": [
						// Base
						{
							multiple: { "tais": 1 },
						},
						// Kai
						{
							remodel: 1,
							multiple: { "houg": 1 },
						},
						{
							remodel: 1,
							single: { "raig": 1 },
						},
						// Kai Ni
						{
							remodel: 2,
							multiple: { "tais": 1 },
						},
						{
							remodel: 2,
							single: { "houk": 1 },
						},
					],
					// Ryuuhou Class
					"51": [
						// Ryuuhou Base (Taigei ctype 50, remodel index 0)
						{
							remodel: 1,
							multiple: { "houg": 1, "tais": 1 },
						},
						{
							remodel: 1,
							single: { "raig": 1 },
						},
						// Ryuuhou Kai
						{
							remodel: 2,
							multiple: { "tais": 1 },
						},
						{
							remodel: 2,
							single: { "houk": 1 },
						},
					],
					// Chitose Class
					"15": [
						// CVL base
						{
							remodel: 3,
							multiple: { "houg": 1 },
						},
						// CVL Kai
						{
							remodel: 4,
							single: { "raig": 1 },
						},
						// CVL Kai Ni
						{
							remodel: 5,
							single: { "houk": 1 },
						},
					],
					// Hiyou Class
					"24": [
						{
							multiple: { "houg": 1 },
						},
						{
							single: { "raig": 1, "houk": 1 },
						},
					],
					// Shoukaku Class
					"33": [
						{
							multiple: { "houg": 1 },
						},
						{
							single: { "raig": 2, "houk": 2 },
						},
					],
					// Taihou Class
					"43": [
						{
							multiple: { "houg": 1 },
						},
						{
							single: { "raig": 2, "houk": 2 },
						},
					],
				},
				byShip: [
					{
						// Shoukaku, extra +1 fp
						origins: [110],
						multiple: { "houg": 1 },
					},
					{
						// Zuikaku, extra +1 ev
						origins: [111],
						single: { "houk": 1 },
					},
					{
						// Suzuya/Kumano CVL
						ids: [508, 509],
						multiple: { "houg": 1 },
					},
					{
						// Suzuya/Kumano CVL
						ids: [508, 509],
						single: { "raig": 2, "houk": 2 },
					},
					{
						// Ryuuhou K2
						ids: [888],
						multiple: { "houg": 1 },
					},
					{
						// Ryuuhou K2
						ids: [888],
						single: { "raig": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E
						ids: [883],
						single: { "raig": 2, "houk": 3 },
					},
				],
			},
			// Tenzan Model 12A Kai (Skilled / with Type 6 Airborne Radar)
			"374": {
				count: 0,
				byClass: {
					// Shouhou Class
					"11": [
						// Base
						{
							multiple: { "houg": 1, "tais": 1 },
						},
						// Kai
						{
							remodel: 1,
							multiple: { "tais": 1 },
						},
						{
							remodel: 1,
							single: { "raig": 1, "houk": 1 },
						},
						// Kai Ni
						{
							remodel: 2,
							multiple: { "tais": 1 },
						},
						{
							remodel: 2,
							single: { "houk": 1 },
						},
					],
					// Ryuuhou Class
					"51": [
						// Ryuuhou Base
						{
							remodel: 1,
							multiple: { "houg": 1, "tais": 2 },
						},
						{
							remodel: 1,
							single: { "raig": 1, "houk": 1 },
						},
						// Ryuuhou Kai
						{
							remodel: 2,
							multiple: { "tais": 1 },
						},
						{
							remodel: 2,
							single: { "houk": 1 },
						},
					],
					// Chitose Class
					"15": [
						// CVL base
						{
							remodel: 3,
							multiple: { "houg": 1  },
						},
						{
							remodel: 3,
							single: { "raig": 1  },
						},
						// CVL Kai
						{
							remodel: 4,
							multiple: { "tais": 1 },
						},
						// CVL Kai Ni
						{
							remodel: 5,
							single: { "houk": 1 },
						},
					],
					// Hiyou Class
					"24": [
						{
							multiple: { "houg": 1 },
						},
						{
							single: { "raig": 2, "houk": 2 },
						},
					],
					// Shoukaku Class
					"33": [
						{
							multiple: { "houg": 2 },
						},
						{
							single: { "raig": 3, "houk": 3 },
						},
					],
					// Taihou Class
					"43": [
						{
							multiple: { "houg": 2 },
						},
						{
							single: { "raig": 3, "houk": 2 },
						},
					],
				},
				byShip: [
					{
						// Shoukaku, extra +1 fp
						origins: [110],
						multiple: { "houg": 1 },
					},
					{
						// Zuikaku, extra +1 ev
						origins: [111],
						single: { "houk": 1 },
					},
					{
						// Suzuya/Kumano CVL
						ids: [508, 509],
						multiple: { "houg": 1, "tais": 2 },
					},
					{
						// Suzuya/Kumano CVL
						ids: [508, 509],
						single: { "raig": 2, "houk": 3 },
					},
					{
						// Ryuuhou K2
						ids: [888],
						multiple: { "houg": 2 },
					},
					{
						// Ryuuhou K2
						ids: [888],
						single: { "raig": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E
						ids: [883],
						multiple: { "houg": 1 },
					},
					{
						// Ryuuhou K2E
						ids: [883],
						single: { "raig": 2, "houk": 3 },
					},
				],
			},
			// Tenzan Model 12A
			"372": {
				count: 0,
				byClass: {
					// Shouhou Class
					"11": [
						// Base
						{
							multiple: { "tais": 1 },
						},
						// Kai Ni
						{
							remodel: 2,
							single: { "raig": 1 },
						},
					],
					// Chitose Class
					"15": [
						// CVL
						{
							remodel: 3,
							multiple: { "houg": 1 },
						},
					],
					// Hiyou Class
					"24": {
						multiple: { "houg": 1 },
					},
					// Shoukaku Class
					"33": [
						{
							multiple: { "houg": 1 },
						},
						{
							single: { "raig": 1 },
						},
					],
					// Taihou Class
					"43": "33",
					// Ryuuhou Class
					"51": [
						// Ryuuhou Base
						{
							remodel: 1,
							multiple: { "tais": 1 },
						},
						// Ryuuhou Kai
						{
							remodel: 2,
							single: { "raig": 1 },
						},
						// Ryuuhou K2+
						{
							remodel: 3,
							multiple: { "houg": 2 },
						},
						// Ryuuhou K2+
						{
							remodel: 3,
							single: { "raig": 1 },
						},
					],
				},
				byShip: [
					{
						// Suzuya/Kumano CVL
						ids: [508, 509],
						multiple: { "houg": 1 },
					},
				],
			},
			// Swordfish
			"242": {
				count: 0,
				byClass: {
					// Ark Royal Class
					"78": {
						multiple: { "houg": 2, "houk": 1 },
					},
					// Houshou Class
					"27": {
						multiple: { "houg": 1 },
					},
				},
			},
			// Swordfish Mk.II (Skilled)
			"243": {
				count: 0,
				byClass: {
					// Ark Royal Class
					"78": {
						multiple: { "houg": 3, "houk": 1 },
					},
					// Houshou Class
					"27": {
						multiple: { "houg": 2 },
					},
				},
			},
			// Swordfish Mk.III (Skilled)
			"244": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ark Royal Class
					"78": [
						{
							multiple: { "houg": 4, "houk": 2 },
						},
						{
							minStars: 3,
							multiple: { "houg": 1 },
						},
						{
							minStars: 5,
							multiple: { "houm": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houk": 1 },
						},
						{
							minStars: 9,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
					// Houshou Class
					"27": [
						{
							multiple: { "houg": 3 },
						},
						{
							minStars: 3,
							multiple: { "houk": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 9,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// Ju 87C Kai Ni (w/ KMX)
			"305": {
				count: 0,
				byClass: {
					// Graf Zeppelin Class
					"63": {
						multiple: { "houg": 1, "houk": 1 },
					},
					// Aquila Class
					"68": "63",
					// Taiyou Class
					"76": {
						multiple: { "tais": 1, "houk": 1 },
					},
				},
				byShip: [
					// extra +2 asw, +1 ev for Shinyou
					{
						ids: [534, 381, 536],
						multiple: { "tais": 2, "houk": 1 },
					},
				],
			},
			// Ju 87C Kai Ni (w/ KMX / Skilled)
			"306": {
				count: 0,
				byClass: {
					// Graf Zeppelin Class
					"63": {
						multiple: { "houg": 1, "houk": 1 },
					},
					// Aquila Class
					"68": "63",
					// Taiyou Class
					"76": {
						multiple: { "tais": 1, "houk": 1 },
					},
				},
				byShip: [
					// extra +2 asw, +1 ev for Shinyou
					{
						ids: [534, 381, 536],
						multiple: { "tais": 2, "houk": 1 },
					},
				],
			},
			// Type 0 Fighter Model 64 (Two-seat w/ KMX)
			"447": {
				count: 0,
				starsDist: [],
				byClass: {
					// Taiyou Class
					"76": {
						multiple: { "houg": 1, "tais": 1, "houk": 2 },
					},
				},
				byShip: [
					// Yawatamaru/Unyou
					{
						origins: [522],
						multiple: { "houg": 1, "tais": 1, "houk": 1 },
					},
					// Houshou, Taigei/Ryuuhou
					{
						origins: [89, 184],
						multiple: { "houg": 1, "tais": 2, "houk": 1 },
					},
					// Houshou K2+
					{
						ids: [894, 899],
						multiple: { "houg": 1, "tyku": 1, "tais": 1, "houk": 1 },
					},
					// All ships can equip this get stars bonuses
					{
						minStars: 2,
						multiple: { "houg": 1 },
					},
					{
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						minStars: 6,
						multiple: { "tais": 1 },
					},
					{
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						minStars: 10,
						multiple: { "tais": 1 },
					},
				],
			},
			// Suisei
			"24": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 2 },
					},
				},
			},
			// Suisei Model 12A
			"57": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 2 },
					},
				},
			},
			// Suisei (601 Air Group)
			"111": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 2 },
					},
				},
			},
			// Type 99 Dive Bomber (Egusa Squadron)
			"99": {
				count: 0,
				byClass: {
					// Souryuu
					"17": {
						single: { "houg": 4 },
					},
					// Hiryuu
					"25": {
						single: { "houg": 1 },
					},
				},
			},
			// Suisei (Egusa Squadron)
			"100": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 4 },
					},
					// Souryuu Kai Ni
					"17": {
						remodel: 2,
						single: { "houg": 6 },
					},
					// Hiryuu Kai Ni
					"25": {
						remodel: 2,
						single: { "houg": 3 },
					},
				},
			},
			// Suisei Model 22 (634 Air Group)
			"291": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 6, "houk": 1 },
					},
				},
			},
			// Suisei Model 22 (634 Air Group / Skilled)
			"292": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 8, "tyku": 1, "houk": 2 },
					},
				},
			},
			// Suisei Model 12 (634 Air Group w/Type 3 Cluster Bombs)
			"319": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 7, "tyku": 3, "houk": 2 },
					},
				},
			},
			// Suisei Model 12 (w/Type 31 Photoelectric Fuze Bombs)
			"320": {
				count: 0,
				byShip: [
					{
						// Ise Kai Ni +2 fp
						ids: [553],
						multiple: { "houg": 2 },
					},
					{
						// Hiryuu/Souryuu K2 +3 fp
						ids: [196, 197],
						multiple: { "houg": 3 },
					},
					{
						// Suzuya/Kumano CVL, Hyuuga Kai Ni +4 fp
						ids: [508, 509, 554],
						multiple: { "houg": 4 },
					},
				],
			},
			// Type 99 Dive Bomber Model 22
			"391": {
				count: 0,
				byShip: [
					{
						// Hiyou, Junyou, Shoukaku, Zuikaku
						origins: [75, 92, 110, 111],
						multiple: { "houg": 1 },
					},
					{
						// Zuihou, Ryuuhou, Shouhou Kai
						ids: [116, 185, 282],
						multiple: { "houg": 1 },
					},
					{
						// Zuihou Kai, Ryuuhou Kai+
						ids: [117, 318, 883, 888],
						multiple: { "houg": 1 },
					},
					{
						// Zuihou Kai, Ryuuhou Kai+
						ids: [117, 318, 883, 888],
						single: { "houk": 1 },
					},
					{
						// Zuihou K2, Zuihou K2B
						ids: [555, 560],
						multiple: { "houg": 1, "houk": 1 },
					},
				],
			},
			// Type 99 Dive Bomber Model 22 (Skilled)
			"392": {
				count: 0,
				byShip: [
					{
						// Hiyou, Junyou
						origins: [75, 92],
						multiple: { "houg": 1, "houk": 1 },
					},
					{
						// Shoukaku, Zuikaku
						origins: [110, 111],
						multiple: { "houg": 2, "houk": 1 },
					},
					{
						// Zuihou, Ryuuhou, Shouhou Kai
						ids: [116, 185, 282],
						multiple: { "houg": 2, "houk": 1 },
					},
					{
						// Zuihou Kai, Ryuuhou Kai+
						ids: [117, 318, 883, 888],
						multiple: { "houg": 2, "houk": 2 },
					},
					{
						// Zuihou K2, Zuihou K2B
						ids: [555, 560],
						multiple: { "houg": 3, "houk": 2 },
					},
				],
			},
			// Prototype Myoujou (Supplementary Prototype)
			"550": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Houshou, Zuihou
						origins: [89, 116],
						multiple: { "houk": 1, "houm": 1 },
					},
					{
						minStars: 7,
						origins: [89, 116],
						multiple: { "houg": 1 },
					},
					{
						minStars: 8,
						origins: [89, 116],
						multiple: { "houk": 1 },
					},
					{
						minStars: 9,
						origins: [89, 116],
						multiple: { "houm": 1 },
					},
					{
						minStars: 10,
						origins: [89, 116],
						multiple: { "houg": 1 },
					},
					{
						// Zuihou all remodels, Houshou Kai+, Ryuuhou Kai+
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houg": 1, "houk": 1 },
					},
				],
			},
			// Myoujou Kai
			"551": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Houshou, Zuihou
						origins: [89, 116],
						multiple: { "houk": 1, "houm": 1 },
					},
					{
						// Zuihou all remodels, Houshou Kai+, Ryuuhou Kai+
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houg": 2, "houk": 2, "houm": 1 },
					},
					{
						minStars: 7,
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houm": 1 },
					},
					{
						minStars: 8,
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houg": 1 },
					},
					{
						minStars: 9,
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houk": 1 },
					},
					{
						minStars: 10,
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houg": 1 },
					},
				],
			},
			// Type 99 Training Bomber Model 22 Kai (Experimental w/ Night Equipment)
			"552": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Houshou, Zuihou
						origins: [89, 116],
						multiple: { "houk": 1, "houm": 1 },
					},
					{
						// Zuihou all remodels, Houshou Kai+, Ryuuhou Kai+
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houg": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E, Houshou K2Sen
						ids: [883, 899],
						multiple: { "houg": 2, "houk": 3, "houm": 3 },
					},
					{
						minStars: 3,
						ids: [883, 899],
						multiple: { "houk": 1 },
					},
					{
						minStars: 6,
						ids: [883, 899],
						multiple: { "houg": 1 },
					},
					{
						minStars: 7,
						ids: [883, 899],
						multiple: { "houm": 1 },
					},
					{
						minStars: 8,
						ids: [883, 899],
						multiple: { "houg": 1 },
					},
					{
						minStars: 9,
						ids: [883, 899],
						multiple: { "houk": 1 },
					},
					{
						minStars: 10,
						ids: [883, 899],
						multiple: { "houg": 1 },
					},
					{
						// Akagi/Kaga K2E, Zuihou K2+, Ryuuhou K2
						ids: [599, 610, 555, 560, 888],
						multiple: { "houg": 1, "houk": 1, "houm": 2 },
					},
					{
						minStars: 7,
						ids: [599, 610, 555, 560, 888],
						multiple: { "houk": 1 },
					},
					{
						minStars: 8,
						ids: [599, 610, 555, 560, 888],
						multiple: { "houm": 1 },
					},
					{
						minStars: 9,
						ids: [599, 610, 555, 560, 888],
						multiple: { "houk": 1 },
					},
					{
						minStars: 10,
						ids: [599, 610, 555, 560, 888],
						multiple: { "houg": 1 },
					},
				],
			},
			// Type 0 Fighter Model 62 (Fighter-bomber)
			"60": {
				count: 0,
				byShip: [
					{
						// Hiyou, Junyou, Chitose, Chiyoda, Zuihou
						origins: [75, 92, 102, 103, 116],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou, Ryuuhou Kai, Shouhou Kai
						ids: [185, 318, 282],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E, K2
						ids: [883, 888],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				],
			},
			// Zero Fighter Model 62 (Fighter-bomber / Iwai Squadron)
			"154": {
				count: 0,
				byShip: [
					{
						// Hiyou, Junyou, Chitose, Chiyoda, Zuihou
						origins: [75, 92, 102, 103, 116],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou, Ryuuhou Kai, Shouhou Kai
						ids: [185, 318, 282],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E, K2
						ids: [883, 888],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				],
			},
			// Type 0 Fighter Model 63 (Fighter-bomber)
			"219": {
				count: 0,
				byShip: [
					{
						// Hiyou, Junyou, Chitose, Chiyoda, Zuihou
						origins: [75, 92, 102, 103, 116],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou, Ryuuhou Kai, Shouhou Kai
						ids: [185, 318, 282],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E, K2
						ids: [883, 888],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				],
			},
			// Type 0 Fighter Model 62 (Night Fighter-bomber)
			"557": {
				count: 0,
				byShip: [
					{
						// Hiyou, Junyou, Chitose, Chiyoda, Zuihou
						origins: [75, 92, 102, 103, 116],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou, Ryuuhou Kai, Shouhou Kai
						ids: [185, 318, 282],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E, K2
						ids: [883, 888],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
					// from getSlotMyoujoPlanePersonalEffect
					{
						// Houshou, Zuihou
						origins: [89, 116],
						multiple: { "houk": 1, "houm": 1 },
					},
					{
						// Zuihou all remodels, Houshou Kai+, Ryuuhou Kai+
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houg": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E, Houshou K2Sen
						ids: [883, 899],
						multiple: { "houg": 2, "houk": 3, "houm": 3 },
					},
					{
						minStars: 1,
						ids: [883, 899],
						multiple: { "houg": 1 },
					},
					{
						minStars: 2,
						ids: [883, 899],
						multiple: { "houm": 1 },
					},
					{
						// Akagi/Kaga K2E, Zuihou K2+, Ryuuhou K2
						ids: [599, 610, 555, 560, 888],
						multiple: { "houg": 1, "houk": 1, "houm": 2 },
					},
					{
						minStars: 2,
						ids: [599, 610, 555, 560, 888],
						multiple: { "houm": 1 },
					},
				],
			},
			// Type 0 Fighter Model 62 (Skilled / Night Fighter-bomber)
			"558": {
				count: 0,
				byShip: [
					{
						// Hiyou, Junyou, Chitose, Chiyoda, Zuihou
						origins: [75, 92, 102, 103, 116],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou, Ryuuhou Kai, Shouhou Kai
						ids: [185, 318, 282],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E, K2
						ids: [883, 888],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
					// from getSlotMyoujoPlanePersonalEffect
					{
						// Houshou, Zuihou
						origins: [89, 116],
						multiple: { "houk": 1, "houm": 1 },
					},
					{
						// Zuihou all remodels, Houshou Kai+, Ryuuhou Kai+
						ids: [116, 117, 555, 560, 285, 894, 899, 318, 888, 883],
						multiple: { "houg": 1, "houk": 1 },
					},
					{
						// Ryuuhou K2E, Houshou K2Sen
						ids: [883, 899],
						multiple: { "houg": 2, "houk": 3, "houm": 3 },
					},
					{
						minStars: 1,
						ids: [883, 899],
						multiple: { "houg": 2 },
					},
					{
						minStars: 2,
						ids: [883, 899],
						multiple: { "houm": 1 },
					},
					{
						// Akagi/Kaga K2E, Zuihou K2+, Ryuuhou K2
						ids: [599, 610, 555, 560, 888],
						multiple: { "houg": 1, "houk": 1, "houm": 2 },
					},
					{
						minStars: 1,
						ids: [599, 610, 555, 560, 888],
						multiple: { "houg": 1 },
					},
					{
						minStars: 2,
						ids: [599, 610, 555, 560, 888],
						multiple: { "houm": 1 },
					},
				],
			},
			// Type 0 Fighter Model 64 (Skilled Fighter-bomber)
			"487": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Houshou K2+
						ids: [894, 899],
						multiple: { "houg": 5, "tyku": 3, "houk": 2, "houm": 4 },
					},
					{
						// Ryuuhou K2+
						ids: [883, 888],
						multiple: { "houg": 3, "tyku": 1, "houk": 1, "houm": 2 },
					},
					// For all ships can equip it
					{
						minStars: 6,
						multiple: { "houg": 1, "houk": 1 },
					},
					{
						minStars: 8,
						multiple: { "tyku": 1, "houm": 1 },
					},
					{
						minStars: 10,
						multiple: { "houg": 1, "houm": 1 },
					},
				],
			},
			// FM-2
			"277": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1, "houk": 1 },
					},
					// Game codes still using ctype matching, here uses country name in advance
					"UnitedKingdom": "UnitedStates",
				},
				byClass: {
					// Casablanca Class
					"83": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				},
			},
			// SBD
			"195": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1 },
					},
				},
			},
			// SBD (Yellow Wings)
			"541": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							minStars: 7,
							multiple: { "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byShip: [
					{
						// Lexington
						origins: [966],
						multiple: { "houg": 3, "houm": 2, "tyku": 1, "houk": 2, "saku": 1 },
					},
					{
						// Saratoga
						origins: [433],
						multiple: { "houg": 2, "houm": 1, "tyku": 1, "houk": 1, "saku": 1 },
					},
					{
						// Hornet, Ranger
						origins: [603, 931],
						multiple: { "houg": 1, "houm": 1, "houk": 1 },
					},
				],
			},
			// TBD (Yellow Wings)
			"542": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							minStars: 7,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byShip: [
					{
						// Lexington
						origins: [966],
						multiple: { "houg": 3, "houm": 2, "tyku": 1, "houk": 2, "saku": 1 },
					},
					{
						// Saratoga
						origins: [433],
						multiple: { "houg": 2, "houm": 1, "tyku": 1, "houk": 1, "saku": 1 },
					},
					{
						// Hornet, Ranger
						origins: [603, 931],
						multiple: { "houg": 1, "houm": 1, "houk": 1 },
					},
				],
			},
			// SBD VS-2 (Reconnaissance Squadron)
			"543": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							minStars: 7,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "saku": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
				},
				byShip: [
					{
						// Lexington
						origins: [966],
						multiple: { "houg": 4, "houm": 2, "tyku": 1, "houk": 2, "saku": 2 },
					},
					{
						// Saratoga
						origins: [433],
						multiple: { "houg": 2, "houm": 1, "tyku": 1, "houk": 1, "saku": 1 },
					},
					{
						// Hornet, Ranger
						origins: [603, 931],
						multiple: { "houg": 1, "houm": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Gambier Bay, Langley
						origins: [544, 925],
						multiple: { "houg": 1, "houk": 1 },
					},
				],
			},
			// SBD VB-2 (Bombing Squadron)
			"544": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byShip: [
					{
						// Lexington
						origins: [966],
						multiple: { "houg": 4, "houm": 2, "tyku": 1, "houk": 2, "saku": 2 },
					},
					{
						// Saratoga
						origins: [433],
						multiple: { "houg": 2, "houm": 1, "tyku": 1, "houk": 1, "saku": 1 },
					},
					{
						// Hornet, Ranger
						origins: [603, 931],
						multiple: { "houg": 1, "houm": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Gambier Bay, Langley
						origins: [544, 925],
						multiple: { "houg": 1, "houk": 1 },
					},
				],
			},
			// SBD-5
			"419": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 2 },
						},
						{
							minStars: 2,
							multiple: { "houg": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// SB2C-3
			"420": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 3,
							multiple: { "houg": 1 },
						},
						{
							minStars: 7,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 9,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byClass: {
					// Essex Class
					"84": {
						multiple: { "houg": 1 },
					},
					// Queen Elizabeth Class
					"67": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 3,
							multiple: { "houg": 1 },
						},
					],
					"82": "67",
					"88": "67",
					"108": "67",
					"112": "67",
					// Ark Royal Class, should share with class 67 too, and fp -1
					"78": {
						minStars: 3,
						multiple: { "houg": 1 },
					},
				},
				byShip: {
					// All CVL -2 fp, -1 ev, -2 ar
					stypes: [7],
					multiple: { "houg": -2, "houk": -1, "souk": -2 },
				},
			},
			// SB2C-5
			"421": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 2 },
						},
						{
							minStars: 5,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
				},
				byClass: {
					// Essex Class
					"84": {
						multiple: { "houg": 1 },
					},
					// Queen Elizabeth Class
					"67": [
						{
							multiple: { "houg": 2 },
						},
						{
							minStars: 5,
							multiple: { "houg": 1 },
						},
					],
					"82": "67",
					"88": "67",
					"108": "67",
					"112": "67",
					// Ark Royal Class, should share with class 67 too, and fp -1
					"78": {
						minStars: 5,
						multiple: { "houg": 1 },
					},
				},
				byShip: {
					// All CVL -2 fp, -1 ev, -2 ar
					stypes: [7],
					multiple: { "houg": -2, "houk": -1, "souk": -2 },
				},
			},
			// F4U-4
			"474": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 2, "tyku": 1, "houk": 1 },
						},
						{
							minStars: 7,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
					"UnitedKingdom": [
						{
							multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						},
						{
							minStars: 7,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
					"France": [
						{
							multiple: { "houg": 1, "tyku": 1 },
						},
						{
							minStars: 7,
							multiple: { "houk": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byShip: {
					// Gambier Bay Mk.II, Langley Kai
					ids: [707, 930],
					multiple: { "houg": 1, "houk": 1 },
				},
			},
			// Ju87C Kai
			"64": {
				count: 0,
				starsDist: [],
				byNation: {
					"Germany": [
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1, "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "tyku": 1, "houm": 1 },
						},
					],
				},
				byShip: [
					{
						// Akagi, Shinyou
						origins: [83, 534],
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						origins: [83, 534],
						minStars: 10,
						multiple: { "houg": 1, "houm": 1 },
					},
				],
			},
			// Ju87 D-4 (Fliegerass)
			"559": {
				count: 0,
				byNation: {
					"Germany": {
						multiple: { "houg": 8, "tyku": 1, "houk": 2, "houm": 6 },
					},
				},
				byShip: {
					// Akagi, Shinyou
					origins: [83, 534],
					multiple: { "houg": 3, "houk": 1, "houm": 2 },
				},
			},
			// Type 96 Fighter
			"19": {
				count: 0,
				byClass: {
					// Taiyou Class
					"76": {
						multiple: { "houg": 2, "tais": 3 },
					},
					// Kasugamaru Class
					"75": "76",
					// Houshou Class
					"27": {
						multiple: { "houg": 2, "tyku": 2, "tais": 2, "houk": 2 },
					},
				},
				byShip: [
					{
						// Houshou K2+
						ids: [894, 899],
						multiple: { "houg":1, "tyku": 1, "tais": 1, "houk": 1 },
					},
					{
						// All CVL +1 aa, +1 ev
						stypes: [7],
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Type 96 Fighter Kai
			"228": {
				count: 0,
				byClass: {
					// Taiyou Class
					"76": {
						multiple: { "houg": 2, "tyku": 1, "tais": 5, "houk": 1 },
					},
					// Kasugamaru Class
					"75": "76",
					// Houshou Class
					"27": {
						multiple: { "houg": 3, "tyku": 3, "tais": 4, "houk": 4 },
					},
				},
				byShip: [
					{
						// Houshou K2+
						ids: [894, 899],
						multiple: { "houg":1, "tyku": 1, "tais": 2, "houk": 2 },
					},
					{
						// All CVL +1 aa, +1 ev, +2 asw
						stypes: [7],
						multiple: { "tyku": 1, "tais": 2, "houk": 1 },
					},
				],
			},
			// Shiden Kai 4
			"271": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Suzuya/Kumano-Kou Kai Ni, Ryuuhou Kai Ni+
						ids: [508, 509, 883, 888],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						// Suzuya/Kumano-Kou Kai Ni, Ryuuhou Kai Ni+
						ids: [508, 509, 883, 888],
						minStars: 6,
						multiple: { "tyku": 2 },
					},
					{
						// Suzuya/Kumano-Kou Kai Ni, Ryuuhou Kai Ni+
						ids: [508, 509, 883, 888],
						minStars: 8,
						multiple: { "houk": 2 },
					},
					{
						// Suzuya/Kumano-Kou Kai Ni, Ryuuhou Kai Ni+
						ids: [508, 509, 883, 888],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Reppuu Model 11
			"53": {
				count: 0,
				starsDist: [],
				byNation: {
					"Japan": [
						{
							minStars: 7,
							multiple: { "houk": 1 },
						},
						{
							minStars: 8,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
						{
							// All IJN CV(B)
							stypes: [11, 18],
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// Reppuu Kai (Prototype Carrier-based Model)
			"335": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": [
						{
							remodel: 1,
							multiple: { "tyku": 1, "houk": 1 },
						},
						{
							remodel: 2,
							multiple: { "tyku": 1 },
						},
					],
					// Akagi Class Kai+
					"14": "3",
				},
			},
			// Reppuu Kai Ni
			"336": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": [
						{
							remodel: 1,
							multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						},
						{
							remodel: 2,
							multiple: { "tyku": 1 },
						},
					],
					// Akagi Class Kai+
					"14": "3",
				},
			},
			// Reppuu Kai Ni (CarDiv 1 / Skilled)
			"337": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": [
						{
							remodel: 1,
							multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						},
						{
							remodel: 2,
							multiple: { "houg": 1, "tyku": 1 },
						},
					],
					// Akagi Class Kai+
					"14": "3",
				},
			},
			// Reppuu Kai Ni Model E
			"338": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": [
						{
							remodel: 1,
							multiple: { "houg": 1, "tyku": 1, "houk": 2 },
						},
						{
							remodel: 2,
							multiple: { "tyku": 1, "houk": 1 },
						},
					],
					// Akagi Class Kai+
					"14": "3",
				},
				byShip: {
					// Akagi K2E, Kaga K2E +4 fp, +3 aa, +4 ev totally
					// Kaga Kai Ni Go's bonus the same with Kai Ni's
					ids: [599, 610],
					multiple: { "houg": 3, "tyku": 1, "houk": 1 },
				},
			},
			// Reppuu Kai Ni Model E (CarDiv 1 / Skilled)
			"339": {
				count: 0,
				byClass: {
					// Kaga Class Kai+
					"3": [
						{
							remodel: 1,
							multiple: { "houg": 1, "tyku": 2, "houk": 2 },
						},
						{
							remodel: 2,
							multiple: { "tyku": 1, "houk": 2 },
						},
					],
					// Akagi Class Kai+
					"14": "3",
				},
				byShip: {
					// Akagi K2E, Kaga K2E +6 fp, +4 aa, +5 ev totally
					// Kaga Kai Ni Go's bonus the same with Kai Ni's
					ids: [599, 610],
					multiple: { "houg": 5, "tyku": 1, "houk": 1 },
				},
			},
			// Re.2001 OR Kai
			"184": {
				count: 0,
				byClass: {
					// Aquila Class
					"68": {
						multiple: { "houg": 1, "tyku": 2, "houk": 3 },
					},
				},
			},
			// Re.2005 Kai
			"189": {
				count: 0,
				byClass: {
					// Aquila Class
					"68": {
						multiple: { "tyku": 1, "houk": 2 },
					},
					// Graf
					"63": "68",
				},
			},
			// Re.2001 G Kai
			"188": {
				count: 0,
				byClass: {
					// Aquila Class
					"68": {
						multiple: { "houg": 3, "tyku": 1, "houk": 1 },
					},
				},
			},
			// Re.2001 CB Kai
			"316": {
				count: 0,
				byClass: {
					// Aquila Class
					"68": {
						multiple: { "houg": 4, "tyku": 1, "houk": 1 },
					},
				},
			},
			// XF5U
			"375": {
				count: 0,
				byClass: {
					// Lexington Class
					"69": {
						multiple: { "houg": 3, "tyku": 3, "tais": 3, "houk": 3 },
					},
					// Casablanca Class
					"83": "69",
					// Essex Class
					"84": "69",
					// Yorktown Class
					"105": "69",
					// Independence Class
					"116": "69",
					// Ranger Class
					"118": "69",
					// Kaga Class
					"3": {
						multiple: { "houg": 1, "tyku": 1, "tais": 1, "houk": 1 },
					},
				},
			},
			// FR-1 Fireball
			"422": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						{
							minStars: 7,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 8,
							multiple: { "houk": 1 },
						},
						{
							minStars: 9,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
					// Game codes still using ctype matching, here uses country name in advance
					"UnitedKingdom": {
						multiple: { "houg": 1, "houk": 1 },
					},
				},
				byClass: {
					// Essex Class
					"84": {
						multiple: { "houg": 1, "tyku": 1 },
					},
				},
				byShip: [
					{
						// Gambier Bay Mk.II
						ids: [707],
						multiple: { "houg": 2, "tyku": 2, "houk": 2 },
					},
					// For all CVL
					{
						stypes: [7],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						stypes: [7],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						stypes: [7],
						minStars: 9,
						multiple: { "tyku": 1 },
					},
					{
						stypes: [7],
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// Seafire Mk.III Kai
			"252": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedKingdom": [
						{
							minStars: 4,
							multiple: { "houk": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1, "tyku": 1 },
						},
						{
							minStars: 8,
							multiple: { "houk": 2 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1, "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "houm": 1 },
						},
					],
				},
			},
			// Corsair Mk.II
			"434": {
				count: 0,
				byClass: {
					// Illustrious Class
					"112": {
						multiple: { "houg": 2, "tyku": 3, "houk": 5 },
					},
					// Ark Royal Class
					"78": {
						multiple: { "houg": 1, "tyku": 2, "houk": 3 },
					},
				},
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1, "tyku": 1, "houk": 2 },
					},
				},
			},
			// Corsair Mk.II (Ace)
			"435": {
				count: 0,
				byClass: {
					// Illustrious Class
					"112": {
						multiple: { "houg": 2, "tyku": 3, "houk": 5 },
					},
					// Ark Royal Class
					"78": {
						multiple: { "houg": 1, "tyku": 2, "houk": 3 },
					},
				},
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1, "tyku": 1, "houk": 2 },
					},
				},
			},
			// F4U-2 Night Corsair
			"473": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					"UnitedKingdom": {
						multiple: { "houg": 1, "houk": 1 },
					},
				},
			},
			// Prototype Jinpuu
			"437": {
				count: 0,
				byShip: [
					{
						// Hiryuu/Souryuu Kai Ni
						ids: [196, 197],
						multiple: { "houg": 2, "tyku": 2, "houk": 3 },
					},
					{
						// Houshou Kai
						ids: [285],
						multiple: { "houg": 3, "tyku": 3, "houk": 4 },
					},
					{
						// Houshou K2+
						ids: [894, 899],
						multiple: { "houg": 4, "tyku": 4, "houk": 4 },
					},
					{
						// Suzuya/Kumano-Kou Kai Ni, Kaga Kai Ni Go
						ids: [508, 509, 646],
						multiple: { "houg": 2, "tyku": 2, "houk": 2 },
					},
					{
						// Ise/Hyuuga Kai Ni, Ryuuhou Kai Ni+,
						ids: [553, 554, 883, 888],
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
					},
				],
			},
			// Type 0 Fighter Model 64 (Air Superiority Fighter Specification)
			"486": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Houshou K2+
						ids: [894, 899],
						multiple: { "houg": 4, "tyku": 4, "houk": 3, "houm": 2 },
					},
					{
						// Ryuuhou K2+
						ids: [883, 888],
						multiple: { "houg": 2, "tyku": 2, "houk": 2, "houm": 1 },
					},
					// For all ships can equip it
					{
						minStars: 6,
						multiple: { "houk": 1, "houm": 1 },
					},
					{
						minStars: 8,
						multiple: { "tyku": 1, "houk": 1 },
					},
					{
						minStars: 10,
						multiple: { "houg": 1, "houm": 1 },
					},
				],
			},
			// Bf109T Kai
			"158": {
				count: 0,
				starsDist: [],
				byNation: {
					"Germany": [
						{
							minStars: 7,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 8,
							multiple: { "houk": 1 },
						},
						{
							minStars: 9,
							multiple: { "tyku": 1, "houk": 1, "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "tyku": 1, "houk": 1, "houm": 1 },
						},
					],
				},
				byShip: [
					{
						// Akagi, Shinyou
						origins: [83, 534],
						minStars: 9,
						multiple: { "tyku": 1, "houk": 1 },
					},
					{
						origins: [83, 534],
						minStars: 10,
						multiple: { "tyku": 1, "houk": 1, "houm": 1 },
					},
				],
			},
			// Bf109 T-3 (G)
			"560": {
				count: 0,
				byNation: {
					"Germany": {
						multiple: { "houg": 3, "tyku": 4, "houk": 5, "houm": 3 },
					},
				},
				byShip: {
					// Akagi, Shinyou
					origins: [83, 534],
					multiple: { "houg": 1, "tyku": 2, "houk": 3, "houm": 1 },
				},
			},
			// All carrier-based improved recon planes on all ships can equip, current implemented:
			// Saiun, Type 2 Reconnaissance Aircraft, Prototype Keiun (Carrier-based Reconnaissance Model)
			"t2_9": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// stars+2, +1 los
						minStars: 2,
						single: { "houg": 0, "saku": 1 },
					},
					{
						// stars+4 extra +1 fp, accumulative +1 fp, +1 los
						minStars: 4,
						single: { "houg": 1 },
					},
					{
						// stars+6 extra +1 los, accumulative +1 fp, +2 los
						minStars: 6,
						single: { "saku": 1 },
					},
					{
						// stars+10 accumulative +2 fp, +3 los
						minStars: 10,
						single: { "houg": 1, "saku": 1 },
					},
				],
			},
			// Type 2 Reconnaissance Aircraft
			// https://wikiwiki.jp/kancolle/%E4%BA%8C%E5%BC%8F%E8%89%A6%E4%B8%8A%E5%81%B5%E5%AF%9F%E6%A9%9F
			"61": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ise Class Kai Ni, range +1 too, can be extreme long
					"2": {
						remodel: 2,
						single: { "houg": 3, "souk": 1, "houk": 2, "houm": 5, "leng": 1 },
					},
					"17": [
						{
							// Souryuu stars+1
							minStars: 1,
							single: { "houg": 3, "saku": 3 },
						},
						{
							// Souryuu K2 stars+8 totally +5 fp, +6 los
							minStars: 8,
							remodel: 2,
							single: { "houg": 1, "saku": 1 },
						},
						{
							// Souryuu Kai Ni acc+5, range +1
							remodel: 2,
							single: { "houm": 5, "leng": 1 },
						},
					],
					"25": [
						{
							// Hiryuu K2 stars+1
							minStars: 1,
							single: { "houg": 2, "saku": 2 },
						},
						{
							// Hiryuu Kai Ni acc+5, range +1
							remodel: 2,
							single: { "houm": 5, "leng": 1 },
						},
					],
				},
				byShip: [
					{
						// Hyuuga Kai Ni, extra +2 ar, +1 ev
						ids: [554],
						single: { "souk": 2, "houk": 1 },
					},
					{
						// Suzuya/Kumano Kou K2, Zuihou K2B stars+1
						ids: [508, 509, 560],
						minStars: 1,
						single: { "houg": 1, "saku": 1 },
					},
				],
			},
			// Fulmar (Reconnaissance Fighter / Skilled)
			"423": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ark Royal Class
					"78": [
						{
							multiple: { "houg": 4, "tyku": 4, "houk": 4, "saku": 4 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "houm": 1 },
						},
					],
					// Illustrious Class
					"112": "78",
					// Queen Elizabeth Class
					"67": [
						{
							multiple: { "houg": 2, "tyku": 2, "houk": 2, "saku": 2 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "houm": 1 },
						},
					],
					// J Class
					"82": "67",
					// Nelson Class
					"88": "67",
					// Town Class
					"108": "67",
				},
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1, "saku": 1 },
					},
				},
				byShip: {
					minStars: 10,
					multiple: { "houk": 1, "houm": 1 },
				},
			},
			// Barracuda Mk.II
			"424": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ark Royal Class
					"78": [
						{
							multiple: { "houg": 2, "raig": 3 },
						},
						{
							minStars: 2,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
					],
					// Illustrious Class
					"112": "78",
					// Queen Elizabeth Class (not capable)
					"67": "78",
					// J Class (not capable)
					"82": "78",
					// Nelson Class (not capable)
					"88": "78",
					// Town Class (not capable)
					"108": "78",
				},
				"byShip": [
					// For any ship can equip it
					{
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// Barracuda Mk.III
			"425": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ark Royal Class
					"78": [
						{
							multiple: { "houg": 2, "tais": 2, "raig": 1, "saku": 1 },
						},
						{
							minStars: 2,
							multiple: { "tais": 1 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "tais": 1 },
						},
						{
							minStars: 7,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "raig": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "tais": 1 },
						},
					],
					// Illustrious Class
					"112": "78",
					// Queen Elizabeth Class (not capable)
					"67": "78",
					// J Class (not capable)
					"82": "78",
					// Nelson Class (not capable)
					"88": "78",
					// Town Class (not capable)
					"108": "78",
				},
				"byShip": [
					// For any ship can equip it
					{
						minStars: 7,
						multiple: { "houg": 1 },
					},
					{
						minStars: 8,
						multiple: { "tais": 1 },
					},
					{
						minStars: 9,
						multiple: { "houm": 1 },
					},
					{
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// Zuiun
			"26": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Mikuma Kai Ni+
						ids: [663, 668, 501, 506, 502, 507],
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Prototype Seiran
			"62": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Mikuma Kai Ni+
						ids: [663, 668, 501, 506, 502, 507],
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Zuiun (634 Air Group)
			"79": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 3 },
					},
					// Fusou Class Kai Ni
					"26": {
						remodel: 2,
						multiple: { "houg": 2 },
					},
				},
				byShip: [
					{
						// Ise Class Kai
						ids: [82, 88],
						multiple: { "houg": 2 },
					},
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Mikuma Kai Ni+
						ids: [663, 668, 501, 506, 502, 507],
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Zuiun Model 12
			"80": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Mikuma Kai Ni+
						ids: [663, 668, 501, 506, 502, 507],
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Zuiun Model 12 (634 Air Group)
			"81": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 3 },
					},
					// Fusou Class Kai Ni
					"26": {
						remodel: 2,
						multiple: { "houg": 2 },
					},
				},
				byShip: [
					{
						// Ise Class Kai
						ids: [82, 88],
						multiple: { "houg": 2 },
					},
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Mikuma Kai Ni+
						ids: [663, 668, 501, 506, 502, 507],
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Zuiun (631 Air Group)
			"207": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Mikuma Kai Ni+
						ids: [663, 668, 501, 506, 502, 507],
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Seiran (631 Air Group)
			"208": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						distinctGears: [26, 62, 79, 80, 81, 207, 208],
						single: { "houg": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Mikuma Kai Ni+
						ids: [663, 668, 501, 506, 502, 507],
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Zuiun (634 Air Group / Skilled)
			"237": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 4, "houk": 2 },
					},
					// Fusou Class Kai Ni
					"26": {
						remodel: 2,
						multiple: { "houg": 2 },
					},
				},
				byShip: [
					{
						// Ise Class Kai
						ids: [82, 88],
						multiple: { "houg": 3, "houk": 1 },
					},
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [237, 322, 323, 490],
						single: { "houg": 3, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Ise-class Kai Ni
						ids: [663, 668, 501, 506, 553, 554],
						multiple: { "houg": 3, "tyku": 1, "houk": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				],
			},
			// Zuiun Kai Ni (634 Air Group)
			"322": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 5, "tyku": 2, "tais": 1, "houk": 2 },
					},
				},
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [237, 322, 323, 490],
						single: { "houg": 3, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Ise-class Kai Ni
						ids: [663, 668, 501, 506, 553, 554],
						multiple: { "houg": 3, "tyku": 1, "houk": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				],
			},
			// Zuiun Kai Ni (634 Air Group / Skilled)
			"323": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 6, "tyku": 3, "tais": 2, "houk": 3 },
					},
				},
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [237, 322, 323, 490],
						single: { "houg": 3, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Ise-class Kai Ni
						ids: [663, 668, 501, 506, 553, 554],
						multiple: { "houg": 3, "tyku": 1, "houk": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				],
			},
			// Prototype Night Zuiun (Attack Equipment)
			"490": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						distinctGears: [237, 322, 323, 490],
						single: { "houg": 3, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+, Ise-class Kai Ni
						ids: [663, 668, 501, 506, 553, 554],
						multiple: { "houg": 3, "tyku": 1, "houk": 2 },
					},
					{
						// Mikuma Kai Ni+
						ids: [502, 507],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				],
			},
			// Laté 298B
			"194": {
				count: 0,
				byClass: {
					// Commandant Teste Class
					"70": {
						multiple: { "houg": 3, "houk": 2, "saku": 2 },
					},
					// Richelieu Kai
					"79": {
						remodel: 1,
						multiple: { "houg": 1, "houk": 2, "saku": 2 },
					},
					// Mizuho Class
					"62": {
						multiple: { "houk": 1, "saku": 2 },
					},
					// Kamoi Class
					"72": "62",
				},
			},
			// Swordfish (Seaplane Model)
			"367": {
				count: 0,
				byClass: {
					// Commandant Teste Class
					"70": {
						multiple: { "houg": 1, "tais": 1, "houk": 1, "saku": 1 },
					},
					// Gotland Class
					"89": {
						multiple: { "houg": 2, "tais": 1, "houk": 1, "saku": 1 },
					},
					// Mizuho Class
					"62": {
						multiple: { "houg": 1, "houk": 1, "saku": 1 },
					},
					// Kamoi Class
					"72": "62",
					// Queen Elizabeth Class (Valiant can equip)
					"67": {
						multiple: { "houg": 2, "houk": 2, "saku": 2 },
					},
					// Ark Royal Class, J Class and Nelson Class can not equip tho
					"78": "67",
					"82": "67",
					"88": "67",
				},
			},
			// Swordfish Mk.III Kai (Seaplane Model)
			"368": {
				count: 0,
				byClass: {
					// Commandant Teste Class
					"70": {
						multiple: { "houg": 2, "tais": 3, "houk": 1, "saku": 2 },
					},
					// Gotland Class
					"89": [
						{
							multiple: { "houg": 4, "tais": 3, "houk": 2, "saku": 3 },
						},
						{
							// Gotland andra FP +2, TP +2, EV +1, LoS +1
							remodel: 2,
							single: { "houg": 2, "raig": 2, "houk": 1, "saku": 1 },
						},
					],
					// Mizuho Class
					"62": {
						multiple: { "houg": 1, "tais": 2, "houk": 1, "saku": 2 },
					},
					// Kamoi Class
					"72": "62",
				},
			},
			// Swordfish Mk.III Kai (Seaplane Model/Skilled)
			"369": {
				count: 0,
				byClass: {
					// Commandant Teste Class
					"70": {
						multiple: { "houg": 3, "tais": 3, "houk": 2, "saku": 3 },
					},
					// Gotland Class
					"89": [
						{
							multiple: { "houg": 5, "tais": 4, "houk": 4, "saku": 3 },
						},
						{
							// Gotland andra FP +3, TP +3, EV +2, LoS +2
							remodel: 2,
							single: { "houg": 3, "raig": 3, "houk": 2, "saku": 2 },
						},
					],
					// Mizuho Class
					"62": {
						multiple: { "houg": 2, "tais": 2, "houk": 1, "saku": 2 },
					},
					// Kamoi Class
					"72": "62",
				},
			},
			// Type 0 Observation Seaplane
			"59": {
				count: 0,
				byShip: {
					// Mogami K2+, Mikuma K2+
					ids: [501, 506, 502, 507],
					single: { "tyku": 1, "houk": 1 },
				},
			},
			// S9 Osprey
			"304": {
				count: 0,
				byClass: {
					// Kuma Class
					"4": {
						multiple: { "houg": 1, "tais": 1, "houk": 1 },
					},
					// Sendai Class
					"16": "4",
					// Nagara Class
					"20": "4",
					// Agano Class
					"41": "4",
					// Gotland Class
					"89": {
						multiple: { "houg": 1, "tais": 2, "houk": 2 },
					},
				},
			},
			// Swordfish Mk.II Kai (Recon Seaplane Model)
			"370": {
				count: 0,
				byClass: {
					// Gotland Class
					"89": [
						{
							multiple: { "houg": 1, "tais": 3, "houk": 1, "saku": 2 },
						},
					],
					// Commandant Teste Class
					"70": {
						multiple: { "houg": 1, "tais": 3, "houk": 1, "saku": 1 },
					},
					// Mizuho Class
					"62": {
						multiple: { "houg": 1, "tais": 2, "houk": 1, "saku": 1 },
					},
					// Kamoi Class
					"72": "62",
					// Queen Elizabeth Class
					"67": {
						multiple: { "houg": 2, "tais": 3, "houk": 2, "saku": 2 },
					},
					// Nelson Class
					"88": {
						multiple: { "houg": 2, "tais": 3, "houk": 2, "saku": 2 },
					},
					// Town Class
					"108": "88",
				},
				byShip: [
					{
						// Warspite
						origins: [439],
						single: { "houg": 4, "houk": 1, "saku": 1 },
					},
					{
						// Valiant
						origins: [927],
						single: { "houg": 3, "houk": 2, "saku": 1 },
					},
				],
			},
			// Fairey Seafox Kai
			"371": {
				count: 0,
				byClass: {
					// Gotland Class
					"89": [
						{
							multiple: { "houg": 4, "tais": 2, "houk": 3, "saku": 6 },
						},
						{
							// Gotland andra FP +2, EV +2, LoS +3
							remodel: 2,
							single: { "houg": 2, "houk": 2, "saku": 3 },
						},
					],
					// Commandant Teste Class
					"70": {
						multiple: { "houg": 2, "tais": 1, "houk": 2, "saku": 4 },
					},
					// Richelieu Class
					"79": {
						multiple: { "houg": 2, "houk": 1, "saku": 3 },
					},
					// Queen Elizabeth Class
					"67": {
						multiple: { "houg": 3, "tais": 1, "houk": 2, "saku": 3 },
					},
					// Town Class
					"108": "67",
					// Nelson Class
					"88": [
						{
							multiple: { "houg": 3, "tais": 1, "houk": 2, "saku": 3 },
						},
						{
							single: { "houg": 3, "houk": 2, "saku": 2 },
						},
					],
				},
			},
			// OS2U
			"171": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							minStars: 5,
							single: { "houk": 1 },
						},
						{
							minStars: 10,
							single: { "houg": 1 },
						},
					],
				},
				byClass: {
					// Iowa Class
					"65": [
						{
							single: { "houg": 1, "saku": 1 },
						},
						{
							minStars: 3,
							single: { "saku": 1 },
						},
						{
							minStars: 8,
							single: { "saku": 1 },
						},
					],
					// Colorado Class
					"93": "65",
					// South Dakota Class
					"102": "65",
					// North Carolina Class
					"107": "65",
					// Nevada Class
					"125": "65",
				},
			},
			// SOC Seagull
			"414": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							single: { "saku": 1 },
						},
						{
							minStars: 5,
							single: { "houk": 1 },
						},
						{
							// All USN CL/CA
							stypes: [3, 5],
							single: { "houg": 1, "saku": 1 },
						},
						{
							stypes: [3, 5],
							minStars: 3,
							single: { "saku": 1 },
						},
						{
							stypes: [3, 5],
							minStars: 8,
							single: { "houk": 1 },
						},
						{
							stypes: [3, 5],
							minStars: 10,
							single: { "houg": 1 },
						},
					],
				},
			},
			// SOC Seagull Late Model (Skilled)
			"539": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							single: { "saku": 1 },
						},
						{
							minStars: 3,
							single: { "houk": 1 },
						},
						{
							minStars: 5,
							single: { "saku": 1 },
						},
						{
							minStars: 7,
							single: { "houm": 1 },
						},
						{
							// All USN CL/CA
							stypes: [3, 5],
							single: { "houg": 1, "saku": 1 },
						},
						{
							stypes: [3, 5],
							minStars: 6,
							single: { "tyku": 1 },
						},
						{
							stypes: [3, 5],
							minStars: 8,
							single: { "houk": 1 },
						},
						{
							stypes: [3, 5],
							minStars: 9,
							single: { "houg": 1 },
						},
						{
							stypes: [3, 5],
							minStars: 10,
							single: { "houm": 1 },
						},
					],
				},
				byClass: {
					// Brooklyn Class
					"110": {
						single: { "houm": 1 },
					},
				},
			},
			// SO3C Seamew Kai
			"415": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							single: { "saku": 1, "tais": 1 },
						},
						{
							minStars: 5,
							single: { "houk": 1 },
						},
					],
				},
				byClass: {
					// Northampton Class
					"95": [
						{
							single: { "houg": 1 },
						},
						{
							minStars: 3,
							single: { "houk": 1 },
						},
						{
							minStars: 8,
							single: { "houg": 1 },
						},
					],
					// Atlanta Class
					"99": "95",
					// St. Louis Class
					"106": "95",
					// Brooklyn Class
					"110": "95",
					// New Orleans Class
					"121": "95",
				},
			},
			// Ar196 Kai
			"115": {
				count: 0,
				starsDist: [],
				byClass: {
					// Bismarck Class
					"47": [
						{
							multiple: { "houg": 2, "houk": 1, "saku": 2 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "houk": 1 },
						},
					],
					// Admiral Hipper Class
					"55": "47",
				},
			},
			// Shiun
			"118": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ooyodo Class
					"52": [
						{
							multiple: { "houg": 1, "houk": 2, "saku": 2 },
						},
						{
							minStars: 10,
							multiple: { "houg": 2, "saku": 1 },
						},
					],
				},
				byShip: [
					{
						// Mikuma Kai Ni Toku
						ids: [507],
						multiple: { "houg": 3, "houk": 2, "saku": 2 },
					},
					{
						// Mikuma Kai Ni Toku
						ids: [507],
						minStars: 2,
						multiple: { "houm": 1 },
					},
					{
						// Mikuma Kai Ni Toku
						ids: [507],
						minStars: 5,
						multiple: { "houk": 1 },
					},
					{
						// Mikuma Kai Ni Toku
						ids: [507],
						minStars: 7,
						multiple: { "houg": 1 },
					},
					{
						// Mikuma Kai Ni Toku
						ids: [507],
						minStars: 10,
						multiple: { "houg": 1, "raig": 1, "tyku": 1, "houk": 1, "saku": 1 },
					},
				],
			},
			// Shiun (Skilled)
			"521": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ooyodo Class
					"52": [
						{
							// From [118] Shiun's bonuses
							multiple: { "houg": 1, "houk": 2, "saku": 2 },
						},
						{
							minStars: 1,
							multiple: { "houm": 1 },
						},
						{
							minStars: 2,
							multiple: { "houk": 1 },
						},
						{
							minStars: 3,
							multiple: { "raig": 1, "saku": 1 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "saku": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
				},
				byShip: [
					{
						// Ooyodo
						ids: [183],
						multiple: { "houg": 1, "houk": 2, "saku": 2, "houm": 1 },
					},
					{
						// Ooyodo Kai
						ids: [321],
						multiple: { "houg": 2, "houk": 3, "saku": 3, "houm": 2 },
					},
					{
						// Mikuma Kai Ni Toku, stacked with [118] Shiun's bonuses
						ids: [507],
						multiple: { "houg": 6, "tyku": 1, "houk": 4, "saku": 4, "houm": 3 },
					},
					{
						ids: [507],
						minStars: 1,
						multiple: { "houm": 1 },
					},
					{
						ids: [507],
						minStars: 2,
						multiple: { "houk": 1 },
					},
					{
						ids: [507],
						minStars: 3,
						multiple: { "raig": 1, "saku": 1 },
					},
					{
						ids: [507],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						ids: [507],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						ids: [507],
						minStars: 8,
						multiple: { "saku": 1 },
					},
					{
						ids: [507],
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// Type 2 Seaplane Fighter Kai
			"165": {
				count: 0,
				byShip: {
					// Mogami K2+, Mikuma K2+
					ids: [501, 506, 502, 507],
					distinctGears: [165, 216],
					single: { "tyku": 2, "houk": 2 },
				},
			},
			// Type 2 Seaplane Fighter Kai (Skilled)
			"216": {
				count: 0,
				byShip: {
					// Mogami K2+, Mikuma K2+
					ids: [501, 506, 502, 507],
					distinctGears: [165, 216],
					single: { "tyku": 2, "houk": 2 },
				},
			},
			// Type 0 Reconnaissance Seaplane Model 11B
			"238": {
				count: 0,
				byShip: {
					// Mogami K2+, Mikuma K2+
					ids: [501, 506, 502, 507],
					distinctGears: [238, 239],
					single: { "raig": 1, "houk": 1 },
				},
			},
			// Type 0 Reconnaissance Seaplane Model 11B (Skilled)
			"239": {
				count: 0,
				byShip: {
					// Mogami K2+, Mikuma K2+
					ids: [501, 506, 502, 507],
					distinctGears: [238, 239],
					single: { "raig": 1, "houk": 1 },
				},
			},
			// Type 0 Reconnaissance Seaplane Model 11A Kai 2
			"540": {
				count: 0,
				byShip: [
					{
						// Yamato K2+, Musashi K2, Noshiro K2, Yahagi K2+
						ids: [911, 916, 546, 662, 663, 668],
						multiple: { "houk": 1, "saku": 1 },
					},
					{
						// Mogami K/K2T, Mikuma K, Suzuya K2, Kumano K2, Tone K2, Chikuma K2
						ids: [73, 506, 121, 503, 504, 188, 189],
						multiple: { "houm": 1, "houk": 1, "saku": 1 },
					},
					{
						// Yura K2, Abukuma K2, Kinu K2, Mogami K2, Mikuma K2+
						ids: [488, 200, 487, 501, 502, 507],
						multiple: { "houg": 1, "houm": 1, "houk": 1 },
					},
					{
						// Nisshin, Chitose, Chiyoda, Akitsushima
						origins: [581, 102, 103, 445],
						multiple: { "houg": 1, "houm": 1,  "tyku": 2, "houk": 2, "saku": 1 },
					},
					{
						// Mizuho, Kamoi
						origins: [451, 162],
						multiple: { "houg": 2, "houm": 1,  "tyku": 2, "houk": 2, "saku": 2 },
					},
				],
			},
			// Type 0 Small Reconnaissance Seaplane
			"522": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All SSV
						stypes: [14],
						multiple: { "raig": 1, "saku": 3, "houk": 5, "houm": 1 },
					},
					{
						stypes: [14],
						minStars: 1,
						multiple: { "raig": 1 },
					},
					{
						stypes: [14],
						minStars: 2,
						multiple: { "houm": 1 },
					},
					{
						stypes: [14],
						minStars: 3,
						multiple: { "houk": 1 },
					},
					{
						stypes: [14],
						minStars: 5,
						multiple: { "saku": 1 },
					},
					{
						stypes: [14],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						stypes: [14],
						minStars: 10,
						multiple: { "houk": 1 },
					},
				],
			},
			// Type 0 Small Reconnaissance Seaplane (Skilled)
			"523": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All SSV
						stypes: [14],
						multiple: { "raig": 3, "baku": 2, "houk": 6, "houm": 2 },
					},
					{
						stypes: [14],
						minStars: 1,
						multiple: { "raig": 1 },
					},
					{
						stypes: [14],
						minStars: 2,
						multiple: { "houm": 1 },
					},
					{
						stypes: [14],
						minStars: 3,
						multiple: { "houk": 1 },
					},
					{
						stypes: [14],
						minStars: 5,
						multiple: { "saku": 1 },
					},
					{
						stypes: [14],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						stypes: [14],
						minStars: 10,
						multiple: { "houk": 1 },
					},
				],
			},
			// Loire 130M
			"471": {
				count: 0,
				starsDist: [],
				byNation: {
					"France": [
						{
							multiple: { "houg": 2, "houk": 2, "houm": 2 },
						},
						{
							minStars: 6,
							multiple: { "houk": 1, "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1, "houk": 1, "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "houm": 1 },
						},
					],
				},
				byClass: {
					// Richelieu Class
					"79": {
						multiple: { "houg": 2, "houm": 1 },
					},
				},
			},
			// Loire 130M Kai (Skilled)
			"538": {
				count: 0,
				starsDist: [],
				byNation: {
					"France": [
						{
							multiple: { "houg": 3, "houk": 2, "houm": 2 },
						},
						{
							minStars: 3,
							multiple: { "houk": 1 },
						},
						{
							minStars: 4,
							multiple: { "houm": 1 },
						},
						{
							minStars: 5,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houk": 1 },
						},
						{
							minStars: 7,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 9,
							multiple: { "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "houm": 1 },
						},
					],
				},
				byClass: {
					// Richelieu Class
					"79": {
						multiple: { "houg": 2, "houm": 1 },
					},
					// Commandant Teste Class
					"70": {
						multiple: { "houg": 1, "tyku": 2, "houk": 2, "houm": 1 },
					},
				},
				byShip: {
					// Richelieu Deux
					ids: [969],
					multiple: { "houg": 1, "houk": 1, "houm": 1 },
				},
			},
			// Walrus
			"510": {
				count: 0,
				byNation: {
					"UnitedKingdom": {
						multiple: { "houg": 2, "tais": 3, "houk": 2, "saku": 2 },
					},
				},
				byClass: {
					// Nelson Class
					"88": {
						single: { "houg": 4, "houk": 2, "saku": 3, "houm": 2 },
					},
				},
			},
			// Kyoufuu Kai
			"217": {
				count: 0,
				byShip: [
					{
						// Mogami K2+, Mikuma K2+
						ids: [501, 506],
						multiple: { "houg": 1, "tyku": 5, "houk": 3 },
					},
					{
						// Mikuma K2+
						ids: [502, 507],
						multiple: { "houg": 1, "tyku": 4, "houk": 2 },
					},
				],
			},
			// Kyoufuu Kai Ni
			"485": {
				count: 0,
				starsDist: [],
				byClass: {
					// Mogami Class
					"9": {
						multiple: { "houg": 1, "tyku": 3, "houk": 2 },
					},
				},
				byShip: [
					{
						// Mogami K2+
						ids: [501, 506],
						multiple: { "tyku": 2, "houk": 1, "houm": 1 },
					},
					{
						// Mikuma K2+
						ids: [502, 507],
						multiple: { "tyku": 1, "houk": 1, "houm": 1 },
					},
					// For any ship can equip it
					{
						minStars: 3,
						multiple: { "houg": 1 },
					},
					{
						minStars: 5,
						multiple: { "tyku": 1 },
					},
					{
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// Ka Type Observation Autogyro
			"69": {
				count: 0,
				byShip: [
					{
						// Ise Kai Ni
						ids: [553],
						multiple: { "houg": 1, "tais": 1 },
					},
					{
						// Hyuuga Kai Ni, Kaga Kai Ni Go
						ids: [554, 646],
						multiple: { "houg": 1, "tais": 2 },
					},
				],
			},
			// O Type Observation Autogyro Kai
			"324": {
				count: 0,
				byShip: [
					{
						// Ise Kai Ni
						ids: [553],
						multiple: { "houg": 1, "tais": 2, "houk": 1 },
					},
					{
						// Hyuuga Kai Ni, Kaga Kai Ni Go
						ids: [554, 646],
						multiple: { "houg": 2, "tais": 3, "houk": 1 },
					},
				],
			},
			// O Type Observation Autogyro Kai Ni
			"325": {
				count: 0,
				byShip: [
					{
						// Ise Kai Ni
						ids: [553],
						multiple: { "houg": 1, "tais": 2, "houk": 1 },
					},
					{
						// Hyuuga Kai Ni, Kaga Kai Ni Go
						ids: [554, 646],
						multiple: { "houg": 2, "tais": 3, "houk": 1 },
					},
				],
			},
			// S-51J
			"326": {
				count: 0,
				byShip: [
					{
						// Ise Kai Ni
						ids: [553],
						multiple: { "houg": 1, "tais": 3, "houk": 1 },
					},
					{
						// Hyuuga Kai Ni
						ids: [554],
						multiple: { "houg": 3, "tais": 4, "houk": 2 },
					},
					{
						// Kaga Kai Ni Go
						ids: [646],
						multiple: { "houg": 3, "tais": 5, "houk": 3 },
					},
				],
			},
			// S-51J Kai
			"327": {
				count: 0,
				byShip: [
					{
						// Ise Kai Ni
						ids: [553],
						multiple: { "houg": 2, "tais": 4, "houk": 1 },
					},
					{
						// Hyuuga Kai Ni
						ids: [554],
						multiple: { "houg": 4, "tais": 5, "houk": 2 },
					},
					{
						// Kaga Kai Ni Go
						ids: [646],
						multiple: { "houg": 5, "tais": 6, "houk": 4 },
					},
				],
			},
			// Type 3 Command Liaison Aircraft (ASW)
			"70": {
				count: 0,
				byShip: {
					// Yamashiomaru
					origins: [900],
					multiple: { "houg": 1, "tais": 1 },
				},
			},
			// Type 3 Command Liaison Aircraft Kai
			"451": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Yamashiomaru, Kumanomaru
						origins: [900, 943],
						multiple: { "houg": 1, "tais": 3 },
					},
					{
						// Yamashiomaru, Kumanomaru
						origins: [900, 943],
						minStars: 1,
						multiple: { "houg": 2 },
					},
					{
						// Yamashiomaru, Kumanomaru
						origins: [900, 943],
						minStars: 2,
						multiple: { "houm": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru
						origins: [900, 943],
						minStars: 3,
						multiple: { "tais": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru
						origins: [900, 943],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru
						origins: [900, 943],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru
						origins: [900, 943],
						minStars: 8,
						multiple: { "tais": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru
						origins: [900, 943],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Akitsumaru
						origins: [161],
						multiple: { "houg": 1, "tais": 2 },
					},
					{
						// Akitsumaru Kai
						ids: [166],
						minStars: 1,
						multiple: { "houg": 1 },
					},
					{
						// Akitsumaru Kai
						ids: [166],
						minStars: 3,
						multiple: { "tais": 1 },
					},
					{
						// Akitsumaru Kai
						ids: [166],
						minStars: 5,
						multiple: { "houm": 1 },
					},
					{
						// Akitsumaru Kai
						ids: [166],
						minStars: 7,
						multiple: { "tais": 1 },
					},
					{
						// Akitsumaru Kai
						ids: [166],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Type 3 Command Liaison Aircraft Kai 2
			"549": {
				count: 0,
				starsDist: [],
				byClass: {
					// Houshou Class
					"27": [
						{
							multiple: { "houg": 1, "tais": 1, "houm": 1 },
						},
						{
							minStars: 4,
							multiple: { "tais": 1 },
						},
						{
							minStars: 6,
							multiple: { "houk": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
					// Taiyou Class
					"76": "27",
				},
				byShip: [
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						multiple: { "houg": 2, "tais": 4, "houk": 1, "houm": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						minStars: 3,
						multiple: { "houg": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						minStars: 4,
						multiple: { "houm": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						minStars: 5,
						multiple: { "tais": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						minStars: 7,
						multiple: { "houg": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						minStars: 9,
						multiple: { "tais": 1 },
					},
					{
						// Yamashiomaru, Kumanomaru, Akitsumaru
						origins: [900, 943, 161],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Type 1 Fighter Hayabusa Model II Kai (20th Squadron)
			"489": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All remodels of Akitsumaru, Yamashiomaru and Kumanomaru
						origins: [161, 900, 943],
						multiple: { "houg": 1, "tais": 1, "tyku": 2, "houk": 1, "houm": 1 },
					},
					{
						// Yamashiomaru Kai, Kumanomaru Kai
						ids: [717, 948],
						multiple: { "houg": 2, "tais": 1, "tyku": 2, "houk": 2, "houm": 1 },
					},
					// For any ship can equip it
					{
						minStars: 3,
						multiple: { "houk": 1 },
					},
					{
						minStars: 6,
						multiple: { "tais": 1 },
					},
					{
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Type 1 Fighter Hayabusa Model III Kai (Skilled / 20th Squadron)
			"491": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All remodels of Akitsumaru, Yamashiomaru and Kumanomaru
						origins: [161, 900, 943],
						multiple: { "houg": 1, "tais": 1, "tyku": 2, "houk": 1, "houm": 1 },
					},
					{
						// Yamashiomaru Kai, Kumanomaru Kai
						ids: [717, 948],
						multiple: { "houg": 2, "tais": 1, "tyku": 2, "houk": 2, "houm": 1 },
					},
					// For any ship can equip it
					{
						minStars: 3,
						multiple: { "houk": 1 },
					},
					{
						minStars: 6,
						multiple: { "tais": 1 },
					},
					{
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// 35.6cm Twin Gun Mount (Dazzle Camouflage)
			"104": {
				count: 0,
				byShip: [
					{
						// Kongou K2/C
						ids: [149, 591],
						multiple: { "houg": 2 },
					},
					{
						// Hiei K2/C, Kirishima K2/C
						ids: [150, 592, 152, 694],
						multiple: { "houg": 1 },
					},
					{
						// Haruna K2+
						ids: [151, 593, 954],
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				],
			},
			// 35.6cm Triple Gun Mount Kai (Dazzle Camouflage)
			"289": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// all Kongou Class Kai Ni+
						ids: [149, 150, 151, 152, 591, 592, 593, 954, 694],
						multiple: { "houg": 1 },
					},
					{
						// for Kongou K2/C and Haruna K2+
						ids: [149, 151, 591, 593, 954],
						multiple: { "houg": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 2 },
						},
					},
					{
						// extra +1 aa for Kongou K2
						ids: [149],
						multiple: { "tyku": 1 },
					},
					{
						// extra +2 aa, +2 ev for Haruna K2+
						ids: [151, 593, 954],
						multiple: { "tyku": 2, "houk": 2 },
					},
					{
						// by stars for Haruna K2+
						ids: [151, 593, 954],
						minStars: 1,
						multiple: { "houk": 1 },
					},
					{
						ids: [151, 593, 954],
						minStars: 3,
						multiple: { "tyku": 1 },
					},
					{
						ids: [151, 593, 954],
						minStars: 5,
						multiple: { "houg": 1 },
					},
					{
						ids: [151, 593, 954],
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						ids: [151, 593, 954],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						ids: [151, 593, 954],
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						ids: [151, 593, 954],
						minStars: 10,
						multiple: { "houk": 1 },
					},
					{
						// by stars for Kongou K2C
						ids: [591],
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						ids: [591],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						ids: [591],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						ids: [591],
						minStars: 10,
						multiple: { "houk": 1 },
					},
					{
						// by stars for Kongou K2, Hiei K2/C, Kirishima K2/C
						ids: [149, 150, 152, 592, 694],
						minStars: 7,
						multiple: { "tyku": 1 },
					},
					{
						ids: [149, 150, 152, 592, 694],
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						ids: [149, 150, 152, 592, 694],
						minStars: 10,
						multiple: { "houk": 1 },
					},
				],
			},
			// 35.6cm Twin Gun Mount Kai 3 (Dazzle Camouflage)
			"502": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// +1 fp for Hiei K2+, Kirishima K2+
						ids: [150, 592, 152, 694],
						multiple: { "houg": 1 },
					},
					{
						// +2 fp for Kongou K2+, Haruna K2
						ids: [149, 591, 151],
						multiple: { "houg": 2, "tyku": 1 },
					},
					{
						// +3 fp Haruna K2C
						ids: [954],
						multiple: { "houg": 3, "tyku": 3 },
					},
					{
						// +5 fp Haruna K2B
						ids: [593],
						multiple: { "houg": 5, "tyku": 4 },
					},
					{
						// total +2 aa for Haruna K2, +1 aa for Kirishima K2C
						ids: [151, 694],
						multiple: { "tyku": 1 },
					},
					{
						// for Kongou K2/C and Haruna K2+
						ids: [149, 151, 591, 954],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 2 },
						},
					},
					{
						// Haruna K2B
						ids: [593],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "houk": 4 },
						},
					},
					{
						// Haruna K2+
						ids: [151, 593, 954],
						synergy: {
							flags: [ "type21AirRadarK2" ],
							single: { "tyku": 1 },
							byStars: {
								gearId: 410,
								 "7": { "houg": 1 },
								"10": { "houk": 1 },
							}
						}
					},
					{
						// Haruna K2+
						ids: [151, 593, 954],
						synergy: {
							flags: [ "type42AirRadarK2" ],
							single: { "tyku": 2 },
							byStars: {
								gearId: 411,
								 "2": { "houg": 1 },
								 "4": { "houk": 1 },
								 "6": { "houm": 1 },
								 "8": { "tyku": 1 },
								"10": { "houg": 1 },
							}
						}
					},
					{
						// by stars for Haruna K2B+
						ids: [593, 954],
						minStars: 0,
						multiple: { "houk": 3 },
					},
					{
						ids: [593, 954],
						minStars: 1,
						multiple: { "houk": 1 },
					},
					{
						ids: [593, 954],
						minStars: 3,
						multiple: { "tyku": 1 },
					},
					{
						ids: [593, 954],
						minStars: 5,
						multiple: { "houg": 1 },
					},
					{
						ids: [593, 954],
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						ids: [593, 954],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						ids: [593, 954],
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						ids: [593, 954],
						minStars: 10,
						multiple: { "houk": 1 },
					},
					{
						// by stars for Haruna K2, Kongou K2C
						ids: [151, 591],
						minStars: 0,
						multiple: { "houk": 1 },
					},
					{
						ids: [151],
						minStars: 2,
						multiple: { "houk": 1 },
					},
					{
						ids: [151, 591],
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						ids: [151, 591],
						minStars: 6,
						multiple: { "houg": 1 },
					},
					{
						ids: [151, 591],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						ids: [151, 591],
						minStars: 10,
						multiple: { "tyku": 1 },
					},
					{
						// by stars for Kongou K2, Hiei K2/C, Kirishima K2/C
						ids: [149, 150, 152, 592, 694],
						minStars: 5,
						multiple: { "houk": 1 },
					},
					{
						ids: [149, 150, 152, 592, 694],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						ids: [149, 150, 152, 592, 694],
						minStars: 10,
						multiple: { "tyku": 1 },
					},
				],
			},
			// 35.6cm Twin Gun Mount Kai 4
			"503": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// +2 fp for Kongou Class K2
						ids: [149, 150, 151, 152],
						multiple: { "houg": 2 },
					},
					{
						// +3 fp for Kongou/Hiei K2C
						ids: [591, 592],
						multiple: { "houg": 3 },
					},
					{
						// +4 fp Haruna K2B/C, Kirishima K2C
						ids: [593, 954, 694],
						multiple: { "houg": 4 },
					},
					{
						// +1 aa Kongou K2+, Hiei K2C, Kirishima K2C
						ids: [149, 591, 592, 694],
						multiple: { "tyku": 1 },
					},
					{
						// +2 aa for Haruna K2
						ids: [151],
						multiple: { "tyku": 2 },
					},
					{
						// +3 aa for Haruna K2C
						ids: [954],
						multiple: { "tyku": 3 },
					},
					{
						// +4 aa for Haruna K2B
						ids: [593],
						multiple: { "tyku": 4 },
					},
					{
						// for Kongou K2C, Hiei K2C, Haruna K2/K2B, Kirishima K2C
						ids: [151, 591, 592, 593, 694],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 1, "houm": 2 },
						},
					},
					{
						// Haruna K2C
						ids: [954],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "houk": 2, "houm": 3 },
						},
					},
					{
						// Kongou K2C
						ids: [591],
						synergy: {
							flags: [ "highAccuracyRadar" ],
							single: { "houg": 3, "houk": 2, "houm": 2 },
						}
					},
					{
						// Hiei K2C, Haruna K2B, Kirishima K2C
						ids: [592, 593, 694],
						synergy: {
							flags: [ "highAccuracyRadar" ],
							single: { "houg": 2, "houk": 2, "houm": 2 },
						}
					},
					{
						// Haruna K2C
						ids: [954],
						synergy: {
							flags: [ "highAccuracyRadar" ],
							single: { "houg": 4, "houk": 2, "houm": 2 },
						}
					},
					{
						// Kongou Class K2B+
						ids: [591, 592, 593, 954, 694],
						synergy: {
							flags: [ "kamikazeTwinTorpedo" ],
							single: { "raig": 4 },
							byStars: {
								gearId: 174,
								 "6": { "raig": 1 },
								 "8": { "houm": 1 },
								"10": { "houg": 1 },
							}
						},
					},
					{
						// by stars for Haruna K2B+
						ids: [593, 954],
						minStars: 0,
						multiple: { "houm": 2 },
					},
					{
						ids: [593, 954],
						minStars: 1,
						multiple: { "houg": 1 },
					},
					{
						ids: [593, 954],
						minStars: 2,
						multiple: { "tyku": 1 },
					},
					{
						ids: [593, 954],
						minStars: 4,
						multiple: { "houm": 1 },
					},
					{
						ids: [593, 954],
						minStars: 6,
						multiple: { "houg": 1 },
					},
					{
						ids: [593, 954],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						ids: [593, 954],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					{
						// by stars for Haruna K2, Kongou K2C, Hiei K2C
						ids: [151, 591, 592],
						minStars: 0,
						multiple: { "houm": 1 },
					},
					{
						ids: [151, 591, 592],
						minStars: 2,
						multiple: { "houg": 1 },
					},
					{
						ids: [151, 591, 592],
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						ids: [151, 591, 592],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						ids: [151, 591, 592],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						ids: [151, 591, 592],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					{
						// by stars for Kongou K2, Hiei K2, Kirishima K2
						ids: [149, 150, 152],
						minStars: 4,
						multiple: { "houm": 1 },
					},
					{
						ids: [149, 150, 152],
						minStars: 7,
						multiple: { "houg": 1 },
					},
					{
						ids: [149, 150, 152],
						minStars: 10,
						multiple: { "tyku": 1 },
					},
					{
						// by stars for Kirishima K2C
						ids: [694],
						minStars: 0,
						multiple: { "houm": 1 },
					},
					{
						ids: [694],
						minStars: 1,
						multiple: { "houg": 1 },
					},
					{
						ids: [694],
						minStars: 2,
						multiple: { "houg": 1 },
					},
					{
						ids: [694],
						minStars: 4,
						multiple: { "houm": 1 },
					},
					{
						ids: [694],
						minStars: 6,
						multiple: { "houg": 1 },
					},
					{
						ids: [694],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						ids: [694],
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// 35.6cm Twin Gun Mount Kai
			"328": {
				count: 0,
				byClass: {
					"6": [
						// Kongou Class
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						// extra +1 fp for Kongou Class Kai+
						{
							remodel: 1,
							multiple: { "houg": 1 },
						},
					],
					// Ise Class
					"2": {
						multiple: { "houg": 1 },
					},
					// Fusou Class
					"26": "2",
				},
				byShip: [
					// extra +1 fp, +1 tp for Kongou Kai Ni C
					{
						ids: [591],
						multiple: { "houg": 1, "raig": 1 },
					},
					// extra +1 fp, +1 aa for Hiei Kai Ni C, Kirishima K2C
					{
						ids: [592, 694],
						multiple: { "houg": 1, "tyku": 1 },
					},
					// extra +2 aa for Haruna Kai Ni B
					{
						ids: [593],
						multiple: { "tyku": 2 },
					},
					// extra +1 fp, +1 aa for Haruna Kai Ni C
					{
						ids: [954],
						multiple: { "houg": 1, "tyku": 1 },
					},
				],
			},
			// 35.6cm Twin Gun Mount Kai Ni
			"329": {
				count: 0,
				byClass: {
					"6": [
						// Kongou Class
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						// extra +1 fp for Kongou Class Kai+
						{
							remodel: 1,
							multiple: { "houg": 1 },
						},
						// extra +1 fp, +1 aa for Kongou Class Kai Ni+
						{
							remodel: 2,
							multiple: { "houg": 1, "tyku": 1 },
						},
						// extra +1 fp, +2 tp for Kongou Class Kai Ni C
						{
							remodel: 3,
							multiple: { "houg": 1, "raig": 2 },
						},
					],
					// Ise Class
					"2": {
						multiple: { "houg": 1 },
					},
					// Fusou Class
					"26": "2",
				},
				byShip: [
					{
						// Haruna Kai Ni
						ids: [593],
						multiple: { "houg": -1, "raig": -1, "tyku": 2 },
					},
					{
						// Kirishima Kai Ni C
						ids: [694],
						multiple: { "houg": 1, "raig": -1 },
					},
				],
			},
			// 35.6cm Twin Gun Mount Kai 3C
			"530": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Kongou K2, Hiei K2, Haruna K2, Kirishima K2, Haruna K2B
						ids: [149, 150, 151, 152, 593],
						multiple: { "houg": 2 },
					},
					{
						// Kongou K2C, Haruna K2C
						ids: [591, 954],
						multiple: { "houg": 3 },
					},
					{
						// Hiei K2C, Kirishima K2C
						ids: [592, 694],
						multiple: { "houg": 4 },
					},
					{
						// Kongou K2, Hiei K2, Haruna K2, Kirishima K2
						ids: [149, 150, 151, 152],
						multiple: { "tyku": 1 },
					},
					{
						// Kongou K2C, Hiei K2C, Haruna K2C, Kirishima K2C
						ids: [591, 592, 954, 694],
						multiple: { "tyku": 2 },
					},
					{
						// Haruna K2B
						ids: [593],
						multiple: { "tyku": 3 },
					},
					{
						// Hiei K2C, Kirishima K2C
						ids: [592, 694],
						multiple: { "houg": 1, "houm": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "houk": 3, "houm": 3 },
							},
							{
								flags: [ "highAccuracyRadar" ],
								single: { "houm": 1 },
							},
						],
					},
					{
						// Hiei K2C
						ids: [592],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3 },
						},
					},
					{
						// Kirishima K2C
						ids: [694],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 4 },
						},
					},
					{
						// Hiei K2C
						ids: [592],
						minCount: 2,
						single: { "houm": 2 },
					},
					{
						// Hiei K2C
						ids: [592],
						minCount: 3,
						single: { "houm": 2 },
					},
					{
						// Hiei K2C
						ids: [592],
						minCount: 4,
						single: { "houm": 2 },
					},
					{
						// Kirishima K2C
						ids: [694],
						minCount: 3,
						single: { "houg": 3 },
					},
					{
						// Hiei K2C
						ids: [592],
						minStars: 2,
						multiple: { "houm": 1 },
					},
					{
						// Hiei K2C
						ids: [592],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						// Hiei K2C
						ids: [592],
						minStars: 6,
						multiple: { "souk": 1 },
					},
					{
						// Hiei K2C
						ids: [592],
						minStars: 7,
						multiple: { "houm": 1 },
					},
					{
						// Hiei K2C
						ids: [592],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						// Hiei K2C
						ids: [592],
						minStars: 9,
						multiple: { "souk": 1 },
					},
					{
						// Hiei K2C
						ids: [592],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					{
						// Hiei K2, Kirishima K2, Kongou K2C, Haruna K2C
						ids: [150, 152, 591, 954],
						multiple: { "houm": 1 },
					},
					{
						// Hiei K2, Kirishima K2, Kongou K2C, Haruna K2C
						ids: [150, 152, 591, 954],
						minStars: 2,
						multiple: { "houg": 1 },
					},
					{
						// Hiei K2, Kirishima K2, Kongou K2C, Haruna K2C
						ids: [150, 152, 591, 954],
						minStars: 4,
						multiple: { "souk": 1 },
					},
					{
						// Hiei K2, Kirishima K2, Kongou K2C, Haruna K2C
						ids: [150, 152, 591, 954],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						// Hiei K2, Kirishima K2, Kongou K2C, Haruna K2C
						ids: [150, 152, 591, 954],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						// Hiei K2, Kirishima K2, Kongou K2C, Haruna K2C
						ids: [150, 152, 591, 954],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					{
						// Kongou K2, Haruna K2, Haruna K2B
						ids: [149, 151, 593],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						// Kongou K2, Haruna K2, Haruna K2B
						ids: [149, 151, 593],
						minStars: 7,
						multiple: { "souk": 1 },
					},
					{
						// Kongou K2, Haruna K2, Haruna K2B
						ids: [149, 151, 593],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					{
						// Kongou K2, Hiei K2, Haruna K2+, Kirishima K2, Kongou K2C
						ids: [149, 150, 151, 152, 591, 954, 593],
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "houk": 2, "houm": 2 },
							},
							{
								flags: [ "highAccuracyRadar" ],
								single: { "houm": 1 },
							},
						],
					},
					{
						// Kirishima K2, Kongou K2C
						ids: [152, 591],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3 },
						},
					},
					{
						// Hiei K2, Haruna K2C
						ids: [150, 954],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2 },
						},
					},
					{
						// Kongou K2, Haruna K2/K2B
						ids: [149, 151, 593],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1 },
						},
					},
					{
						// Kongou K2C, Hiei K2C, Haruna K2/K2B, Kirishima K2C
						ids: [591, 592, 593, 954, 694],
						synergy: [
							{
								flags: [ "kamikazeTwinTorpedo" ],
								single: { "raig": 6 },
								byStars: {
									gearId: 174,
									 "6": { "raig": 1 },
									 "8": { "houm": 1 },
									"10": { "houg": 1 },
								},
							},
							{
								flags: [ "highAccuracyRadar" ],
								single: { "houg": 2, "raig": 2, "houk": 3, "houm": 2 },
							},
						],
					},
					{
						// Kongou K2C, Hiei K2C, Haruna K2/K2B
						ids: [591, 592, 593, 954],
						minCount: 2,
						single: { "houm": 1 },
					},
					{
						// Kongou K2C, Hiei K2C
						ids: [591, 592],
						synergy: {
							flags: [ "highAccuracyRadar" ],
							single: { "houg": 2 },
						},
					},
					{
						// Haruna K2B/K2C
						ids: [593, 954],
						synergy: {
							flags: [ "highAccuracyRadar" ],
							single: { "houg": 1 },
						},
					},
					{
						// Kirishima K2C
						ids: [694],
						synergy: {
							flags: [ "highAccuracyRadar" ],
							single: { "houg": 3 },
						},
					},
				],
			},
			// 41cm Triple Gun Mount Kai Ni
			// https://wikiwiki.jp/kancolle/41cm%E4%B8%89%E9%80%A3%E8%A3%85%E7%A0%B2%E6%94%B9%E4%BA%8C
			"290": {
				count: 0,
				byClass: {
					"2": [
						// Ise Class Kai+
						{
							remodel: 1,
							multiple: { "houg": 2, "tyku": 2, "houk": 1 },
							synergy: {
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 3 },
							},
						},
						// extra +1 fp, +3 acc for Ise Class Kai Ni
						{
							remodel: 2,
							multiple: { "houg": 1, "houm": 3 },
						},
					],
					// Fusou Class Kai Ni
					"26": {
						remodel: 2,
						multiple: { "houg": 1 },
					},
				},
				byShip: {
					// extra +1 ev for Hyuuga Kai Ni
					ids: [554],
					multiple: { "houk": 1 },
				},
			},
			// 41cm Twin Gun Mount Kai Ni
			// https://wikiwiki.jp/kancolle/41cm%E9%80%A3%E8%A3%85%E7%A0%B2%E6%94%B9%E4%BA%8C
			"318": {
				count: 0,
				byClass: {
					// Ise Class Kai+
					"2": {
						remodel: 1,
						multiple: { "houg": 2, "tyku": 2, "houk": 2 },
						synergy: {
							// `distinct` means only 1 set takes effect at the same time,
							// not stackable with 41cm Triple K2's air radar synergy
							// see https://twitter.com/KennethWWKK/status/1098960971865894913
							flags: [ "tripleLargeGunMountK2Nonexist", "airRadar" ],
							distinct: { "tyku": 2, "houk": 3, "houm": 1 },
						},
					},
					// Nagato Class Kai Ni
					"19": {
						remodel: 2,
						multiple: { "houg": 3, "tyku": 2, "houk": 1, "houm": 2 },
						synergy: {
							flags: [ "tripleLargeGunMountK2" ],
							single: { "houg": 2, "souk": 1, "houk": 2, "houm": 1 },
						},
					},
					// Fusou Class Kai Ni
					"26": {
						remodel: 2,
						multiple: { "houg": 1 },
					},
				},
				byShip: [
					{
						// extra +3 acc for Ise Kai Ni
						ids: [553],
						multiple: { "houm": 3 },
						// extra +1 ar, +2 ev when synergy with `41cm Triple Gun Mount Kai Ni`
						synergy: {
							flags: [ "tripleLargeGunMountK2" ],
							single: { "souk": 1, "houk": 2 },
						},
					},
					{
						// extra +1 fp, +3 acc for Hyuuga Kai Ni
						ids: [554],
						multiple: { "houg": 1, "houm": 3 },
						// extra +1 fp, +1 ar, +2 ev, +1 acc when synergy with `41cm Triple Gun Mount Kai Ni`
						synergy: {
							flags: [ "tripleLargeGunMountK2" ],
							single: { "houg": 1, "souk": 1, "houk": 2, "houm": 1 },
						},
					},
				],
			},
			// Prototype 51cm Twin Gun Mount
			"128": {
				count: 0,
				byClass: {
					// Yamato Class
					"37": {
						synergy: {
							flags: [ "twin51cmLargeGunMountNonexist", "rangefinderAirRadar" ],
							single: { "houg": 1, "houm": 2 },
						},
					},
				},
				byShip: {
					// Yamato K2+, Musashi K2
					ids: [911, 916, 546],
					multiple: { "houg": 1, "houm": 1 },
					synergy: {
						flags: [ "twin51cmLargeGunMountNonexist", "rangefinderKaiAirRadar" ],
						single: { "houk": 1, "houm": 1 },
					},
				},
			},
			// 51cm Twin Gun Mount
			"281": {
				count: 0,
				byClass: {
					// Yamato Class
					"37": {
						synergy: {
							flags: [ "rangefinderAirRadar" ],
							single: { "houg": 1, "houm": 2 },
						},
					},
				},
				byShip: {
					// Yamato K2+, Musashi K2
					ids: [911, 916, 546],
					multiple: { "houg": 1, "houm": 1 },
					synergy: {
						flags: [ "rangefinderKaiAirRadar" ],
						single: { "houk": 1, "houm": 1 },
					},
				},
			},
			// Prototype 51cm Triple Gun Mount
			"465": {
				count: 0,
				byClass: {
					// Yamato Class
					"37": {
						synergy: {
							flags: [ "rangefinderAirRadar" ],
							single: { "houg": 2, "houm": 2 },
						},
					},
				},
				byShip: [
					{
						// Yamato K2, Musashi K2
						ids: [911, 546],
						multiple: { "houg": 1, "houk": 2, "houm": 1 },
						synergy: {
							flags: [ "rangefinderKaiAirRadar" ],
							single: { "tyku": 1, "houk": 1, "houm": 2 },
						},
					},
					{
						// Yamato K2J
						ids: [916],
						multiple: { "houg": 2, "houk": 8, "houm": 2 },
						synergy: {
							flags: [ "rangefinderKaiAirRadar" ],
							single: { "houk": 2, "houm": 1 },
						},
					},
				],
			},
			// 14inch/45 Twin Gun Mount
			"507": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": {
						stypes: [8, 9, 10],
						multiple: { "houg": 2, "houk": 1, "houm": 1 },
						synergy: [
							{
								flags: [ "usNavySurfaceRadar" ],
								distinct: { "houg": 1, "houk": 1, "houm": 2 },
							},
							{
								flags: [ "triple14inch45LargeGunMount" ],
								single: { "houg": 1, "houk": 2, "houm": 1 },
							},
						],
					},
					"UnitedKingdom": 6,
				},
				byClass: {
					// Kongou Class
					"6": {
						distinctGears: [507, 508],
						single: { "houk": 1, "houm": 1 },
						synergy: {
							flags: [ "triple14inch45LargeGunMount" ],
							single: { "houg": 1, "houk": 1, "houm": 1 },
						},
					},
					// Ise Class
					"2": 6,
					// Fusou Class
					"26": 6,
					// Nevada Class
					"125": {
						distinctGears: [507, 508],
						multiple: { "houg": 1, "houk": 1, "houm": 1 },
						synergy: {
							flags: [ "triple14inch45LargeGunMount" ],
							single: { "houg": 1, "houm": 1 },
						},
					},
				},
				byShip: [
					// For any ship can equip it
					{
						minStars: 3,
						multiple: { "houg": 1 },
					},
					{
						minStars: 6,
						multiple: { "souk": 1 },
					},
					{
						minStars: 9,
						multiple: { "houm": 1 },
					},
				],
			},
			// 14inch/45 Triple Gun Mount
			"508": {
				count: 0,
				byNation: {
					"UnitedStates": {
						stypes: [8, 9, 10],
						multiple: { "houg": 2, "houk": 1, "houm": 1 },
						synergy: {
							flags: [ "usNavySurfaceRadar" ],
							distinct: { "houg": 1, "houk": 1, "houm": 2 },
						},
					},
					"UnitedKingdom": 6,
				},
				byClass: {
					// Kongou Class
					"6": {
						distinctGears: [507, 508],
						single: { "houk": 1, "houm": 1 },
					},
					// Ise Class
					"2": 6,
					// Fusou Class
					"26": 6,
					// Nevada Class
					"125": {
						distinctGears: [507, 508],
						multiple: { "houg": 1, "houk": 1, "houm": 1 },
					},
				},
			},
			// 16inch Mk.I Triple Gun Mount
			"298": {
				count: 0,
				byClass: {
					// Nelson Class
					"88": {
						multiple: { "houg": 2, "souk": 1 },
					},
					// Queen Elizabeth Class
					"67": {
						multiple: { "houg": 2, "souk": 1, "houk": -2 },
					},
					// Kongou Class Kai Ni only (K2C incapable)
					"6": {
						remodel: 2,
						remodelCap: 2,
						multiple: { "houg": 1, "souk": 1, "houk": -3 },
					},
				},
				byShip: [
					{
						// Kongou K2C, Hiei K2C, Kirishima K2C
						ids: [591, 592, 694],
						multiple: { "houg": 2, "souk": 1, "houk": -2 },
					},
					{
						// Haruna K2B+
						ids: [593, 954],
						multiple: { "houg": 1, "souk": 1, "houk": -1 },
					},
				],
			},
			// 16inch Mk.I Triple Gun Mount + AFCT Kai
			"299": {
				count: 0,
				byClass: {
					// Nelson Class
					"88": {
						multiple: { "houg": 2, "souk": 1 },
					},
					// Queen Elizabeth Class
					"67": {
						multiple: { "houg": 2, "souk": 1, "houk": -2 },
					},
					// Kongou Class Kai Ni only (K2C incapable)
					"6": {
						remodel: 2,
						remodelCap: 2,
						multiple: { "houg": 1, "souk": 1, "houk": -3 },
					},
				},
				byShip: [
					{
						// Kongou K2C, Hiei K2C
						ids: [591, 592],
						multiple: { "houg": 2, "souk": 1, "houk": -2 },
					},
					{
						// Haruna K2B+
						ids: [593, 954],
						multiple: { "houg": 1, "souk": 1, "houk": -1 },
					},
				],
			},
			// 16inch Mk.I Triple Gun Mount Kai + FCR Type 284
			"300": {
				count: 0,
				byClass: {
					// Nelson Class
					"88": {
						multiple: { "houg": 2, "souk": 1 },
					},
					// Queen Elizabeth Class
					"67": {
						multiple: { "houg": 2, "souk": 1, "houk": -2 },
					},
					// Kongou Class Kai Ni only (K2C incapable)
					"6": {
						remodel: 2,
						remodelCap: 2,
						multiple: { "houg": 1, "souk": 1, "houk": -3 },
					},
				},
				byShip: [
					{
						// Kongou K2C, Hiei K2C
						ids: [591, 592],
						multiple: { "houg": 2, "souk": 1, "houk": -2 },
					},
					{
						// Haruna K2B+
						ids: [593, 954],
						multiple: { "houg": 1, "souk": 1, "houk": -1 },
					},
				],
			},
			// 16inch Mk.I Twin Gun Mount
			"330": {
				count: 0,
				byClass: {
					// Colorado Class
					"93": {
						multiple: { "houg": 1 },
					},
					// Nelson Class
					"88": [
						{
							multiple: { "houg": 1 },
						},
						{
							remodel: 1,
							multiple: { "houg": 1 },
						},
					],
					// Nagato Class
					"19": [
						{
							multiple: { "houg": 1 },
						},
						// Kai Ni
						{
							remodel: 2,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// 16inch Mk.V Twin Gun Mount
			"331": {
				count: 0,
				byClass: {
					// Colorado Class
					"93": [
						{
							multiple: { "houg": 1 },
						},
						{
							remodel: 1,
							multiple: { "houg": 1, "houk": 1 },
						},
					],
					// Nelson Class
					"88": [
						{
							multiple: { "houg": 1 },
						},
						{
							remodel: 1,
							multiple: { "houg": 1 },
						},
					],
					// Nagato Class
					"19": [
						{
							multiple: { "houg": 1 },
						},
						// Kai Ni
						{
							remodel: 2,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// 16inch Mk.VIII Twin Gun Mount Kai
			"332": {
				count: 0,
				byClass: {
					// Colorado Class
					"93": [
						{
							multiple: { "houg": 1 },
						},
						{
							remodel: 1,
							multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						},
					],
					// Nelson Class
					"88": [
						{
							multiple: { "houg": 1 },
						},
						{
							remodel: 1,
							multiple: { "houg": 1 },
						},
					],
					// Nagato Class
					"19": [
						{
							multiple: { "houg": 1 },
						},
						// Kai Ni
						{
							remodel: 2,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// 16inch Triple Gun Mount Mk.6
			"381": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houg": 1 },
						},
					],
				},
				byClass: {
					// South Dakota Class
					"102": {
						multiple: { "houg": 1 },
					},
				},
			},
			// 16inch Triple Gun Mount Mk.6 mod.2
			"385": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "souk": 1 },
						},
					],
				},
				byClass: {
					// Colorado Class
					"93": {
						multiple: { "houg": 1 },
					},
					// South Dakota Class
					"102": {
						multiple: { "houg": 1, "souk": 1 },
					},
					// North Carolina Class
					"107": "102",
				},
				byShip: {
					// Any FBB
					stypes: [8],
					multiple: { "houg": 1 },
				},
			},
			// 16inch Triple Gun Mount Mk.6 + GFCS
			"390": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 3,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "souk": 1 },
						},
					],
				},
				byClass: {
					// Colorado Class
					"93": {
						multiple: { "houg": 1 },
					},
					// South Dakota Class
					"102": {
						multiple: { "houg": 1, "souk": 1 },
					},
					// North Carolina Class
					"107": "102",
				},
				byShip: {
					// Any FBB
					stypes: [8],
					multiple: { "houg": 1 },
				},
			},
			// 16inch Triple Rapid Fire Gun Mount Mk.16
			"386": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 2,
							multiple: { "houg": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// 16inch Triple Rapid Fire Gun Mount Mk.16 mod.2
			"387": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 2,
							multiple: { "houg": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// 6inch Mk.XXIII Triple Gun Mount
			"399": {
				count: 0,
				starsDist: [],
				byClass: {
					// Town Class
					"108": [
						{
							multiple: { "houg": 1, "houk": 2 },
						},
						{
							minStars: 3,
							multiple: { "houg": 1 },
						},
						{
							minStars: 5,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// 305mm/46 Twin Gun Mount
			"426": {
				count: 0,
				byClass: {
					// Conte di Cavour Class
					"113": [
						{
							multiple: { "houg": 3, "houk": 1 },
							synergy: {
								flags: [ "triple305mm46LargeGunMount" ],
								single: { "houg": 1, "houk": 1 },
							},
						},
						{
							minCount: 2,
							single: { "houg": 1, "houk": 1 },
							synergy: {
								flags: [ "triple305mm46LargeGunMount" ],
								single: { "houg": -1, "houk": -1 },
							},
						},
					],
					// Gangut Class
					"73": [
						{
							multiple: { "houg": 2, "houk": 1 },
							synergy: {
								flags: [ "triple305mm46LargeGunMount" ],
								single: { "houg": 1 },
							},
						},
						{
							minCount: 2,
							single: { "houg": 1 },
							synergy: {
								flags: [ "triple305mm46LargeGunMount" ],
								single: { "houg": -1 },
							},
						},
					],
				},
			},
			// 305mm/46 Triple Gun Mount
			"427": {
				count: 0,
				byClass: {
					// Conte di Cavour Class
					"113": {
						multiple: { "houg": 2 },
					},
					// Gangut Class
					"73": {
						multiple: { "houg": 1 },
					},
				},
			},
			// 320mm/44 Twin Gun Mount
			"428": {
				count: 0,
				byClass: {
					// Conte di Cavour Class
					"113": [
						{
							multiple: { "houg": 3, "houk": 1 },
							synergy: {
								flags: [ "triple320mm44LargeGunMount" ],
								single: { "houg": 2, "houk": 1 },
							},
						},
						{
							minCount: 2,
							single: { "houg": 2, "houk": 1 },
							synergy: {
								flags: [ "triple320mm44LargeGunMount" ],
								single: { "houg": -2, "houk": -1 },
							},
						},
					],
					// Gangut Class
					"73": [
						{
							multiple: { "houg": 2, "houk": 1 },
							synergy: {
								flags: [ "triple320mm44LargeGunMount" ],
								single: { "houg": 1 },
							},
						},
						{
							minCount: 2,
							single: { "houg": 1 },
							synergy: {
								flags: [ "triple320mm44LargeGunMount" ],
								single: { "houg": -1 },
							},
						},
					],
					// V.Veneto Class
					"58": [
						{
							multiple: { "houg": 1, "houk": 2 },
							synergy: {
								flags: [ "triple320mm44LargeGunMount" ],
								single: { "houg": 2, "houk": 1 },
							},
						},
						{
							minCount: 2,
							single: { "houg": 2, "houk": 1 },
							synergy: {
								flags: [ "triple320mm44LargeGunMount" ],
								single: { "houg": -2, "houk": -1 },
							},
						},
					],
				},
			},
			// 320mm/44 Triple Gun Mount
			"429": {
				count: 0,
				byClass: {
					// Conte di Cavour Class
					"113": {
						multiple: { "houg": 2 },
					},
					// Gangut Class
					"73": {
						multiple: { "houg": 1 },
					},
				},
			},
			// 38cm Twin Gun Mount
			"76": {
				count: 0,
				byNation: {
					"Germany": {
						multiple: { "houg": 1 },
						synergy: {
							flags: [ "germanLargeRadar" ],
							byCount: {
								gear: "germanLargeRadar",
								distinct: true,
								"1": { "houk": 1 },
								"2": { "houk": 2 },
								"3": { "houk": 3 },
							},
						},
					},
				},
			},
			// 38cm Twin Gun Mount Kai
			"114": {
				count: 0,
				starsDist: [],
				byNation: {
					"Germany": [
						{
							multiple: { "houg": 1 },
							synergy: {
								flags: [ "germanLargeRadar" ],
								byCount: {
									gear: "germanLargeRadar",
									distinct: true,
									"1": { "houk": 1 },
									"2": { "houk": 2 },
									"3": { "houk": 3 },
								},
							},
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "souk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// 38cm Quadruple Gun Mount
			"245": {
				count: 0,
				byClass: {
					// Richelieu Class
					"79": {
						multiple: { "houg": 2, "houm": 1 },
						synergy: {
							flags: [ "frenchYellowSecGunMount" ],
							byCount: {
								gear: "frenchYellowSecGunMount",
								distinct: true,
								"1": { "houg": 2, "houk": 2, "houm": 2 },
								"2": { "houg": 4, "houk": 4, "houm": 4 },
								"3": { "houg": 6, "houk": 6, "houm": 6 },
							},
						},
					},
				},
			},
			// 38cm Quadruple Gun Mount Kai
			"246": {
				count: 0,
				byClass: {
					// Richelieu Class
					"79": {
						multiple: { "houg": 2, "houm": 1 },
						synergy: {
							flags: [ "frenchYellowSecGunMount" ],
							byCount: {
								gear: "frenchYellowSecGunMount",
								distinct: true,
								"1": { "houg": 2, "houk": 2, "houm": 2 },
								"2": { "houg": 4, "houk": 4, "houm": 4 },
								"3": { "houg": 6, "houk": 6, "houm": 6 },
							},
						},
					},
				},
			},
			// 38cm Quadruple Gun Mount Kai Deux
			"468": {
				count: 0,
				starsDist: [],
				byClass: {
					// Richelieu Class
					"79": [
						{
							multiple: { "houg": 3, "houm": 1 },
							synergy: {
								flags: [ "frenchYellowSecGunMount" ],
								byCount: {
									gear: "frenchYellowSecGunMount",
									distinct: true,
									"1": { "houg": 2, "houk": 2, "houm": 2 },
									"2": { "houg": 4, "houk": 4, "houm": 4 },
									"3": { "houg": 6, "houk": 6, "houm": 6 },
								},
							},
						},
						{
							minStars: 4,
							multiple: { "houg": 1, "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1, "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "tyku": 1 },
							synergy: [
								{
									flags: [ "frenchNightRecon" ],
									countFlag: 0,
									multiple: { "houm": 2 },
								},
								{
									flags: [ "frenchYellowSecGunMount" ],
									byCount: {
										gear: "frenchYellowSecGunMount",
										"1": { "houk": 1, "houm": 1 },
										"2": { "houk": 2, "houm": 2 },
										"3": { "houk": 3, "houm": 3 },
									},
								},
							],
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
							synergy: [
								{
									flags: [ "frenchNightRecon" ],
									countFlag: 0,
									multiple: { "houm": 1 },
								},
								{
									flags: [ "frenchNightReconBase" ],
									byStars: {
										gearId: 471,
										isMultiple: true,
										"7": { "houm": 1 },
										"9": { "houk": 1 },
									},
								},
								{
									flags: [ "frenchNightReconKai" ],
									byStars: {
										gearId: 538,
										isMultiple: true,
										"7": { "houm": 1 },
										"8": { "houk": 1 },
										"9": { "houm": 1 },
									},
								},
								{
									flags: [ "frenchYellowSecGunMount" ],
									byCount: {
										gear: "frenchYellowSecGunMount",
										"1": { "houg": 1, "houk": 1, "houm": 1 },
										"2": { "houg": 2, "houk": 2, "houm": 2 },
										"3": { "houg": 3, "houk": 3, "houm": 3 },
									},
								},
							],
						},
					],
				},
			},
			// 15.2cm Triple Gun Mount
			"247": {
				count: 0,
				starsDist: [],
				byNation: {
					"France": [
						{
							multiple: { "houg": 2, "houm": 2 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1, "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1, "houk": 1, "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houk": 1, "houm": 1 },
						},
					],
				},
			},
			// 13.8cm Twin Gun Mount
			"534": {
				count: 0,
				starsDist: [],
				byNation: {
					"France": [
						{
							multiple: { "houg": 2, "houm": 1 },
						},
						{
							minStars: 2,
							multiple: { "houm": 1 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byClass: {
					// Mogador Class
					"129": {
						multiple: { "houm": 1 },
					},
				},
			},
			// 13.8cm Twin Gun Mount Kai
			"535": {
				count: 0,
				starsDist: [],
				byNation: {
					"France": [
						{
							multiple: { "houg": 2, "houm": 1 },
						},
						{
							minStars: 2,
							multiple: { "houm": 1 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 9,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byClass: {
					// Mogador Class
					"129": {
						multiple: { "houm": 1 },
					},
				},
				byShip: {
					// Mogador Kai
					ids: [967],
					multiple: { "houg": 1 },
				},
			},
			// 15.2cm Triple Main Gun Mount
			"536": {
				count: 0,
				starsDist: [],
				byNation: {
					"France": [
						{
							multiple: { "houg": 2, "houm": 1 },
						},
						{
							minStars: 1,
							synergy: {
								flags: [ "frenchNightReconKai" ],
								byStars: {
									gearId: 538,
									isMultiple: true,
									"1": { "houk": 1 },
									"9": { "houm": 1 },
								},
							},
						},
						{
							minStars: 3,
							multiple: { "houm": 1 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 5,
							multiple: { "houk": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houk": 1 },
						},
						{
							minStars: 9,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byClass: {
					// La Galissonniere Class
					"128": {
						multiple: { "houm": 1 },
					},
				},
				byShip: {
					// Gloire Kai
					ids: [970],
					minStars: 1,
					synergy: {
						flags: [ "frenchNightRecon" ],
						countFlag: 0,
						multiple: { "houk": 1, "houm": 1 },
					},
				},
			},
			// 15.2cm Triple Main Gun Mount Kai
			"537": {
				count: 0,
				starsDist: [],
				byNation: {
					"France": [
						{
							multiple: { "houg": 2, "houm": 1 },
						},
						{
							minStars: 1,
							synergy: {
								flags: [ "frenchNightReconKai" ],
								byStars: {
									gearId: 538,
									isMultiple: true,
									"1": { "houk": 1 },
									"9": { "houm": 1 },
								},
							},
						},
						{
							minStars: 3,
							multiple: { "houm": 1 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 5,
							multiple: { "houk": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 8,
							multiple: { "houk": 1 },
						},
						{
							minStars: 9,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byClass: {
					// La Galissonniere Class
					"128": {
						multiple: { "houm": 1 },
					},
				},
				byShip: [
					{
						// Gloire Kai
						ids: [970],
						multiple: { "houg": 1, "houk": 2, "houm": 1 },
					},
					{
						// Gloire Kai
						ids: [970],
						minStars: 1,
						synergy: {
							flags: [ "frenchNightRecon" ],
							countFlag: 0,
							multiple: { "houk": 1, "houm": 1 },
						},
					},
				],
			},
			// 14cm Twin Gun Mount
			"119": {
				count: 0,
				byClass: {
					// Yuubari Class
					"34": {
						multiple: { "houg": 1 },
					},
					// Katori Class
					"56": "34",
					// Nisshin Class
					"90": {
						multiple: { "houg": 2, "raig": 1 },
					},
				},
			},
			// 14cm Twin Gun Mount Kai
			"310": {
				count: 0,
				starsDist: [],
				byClass: {
					// Yuubari Class
					"34": [
						{
							multiple: { "houg": 2, "tyku": 1, "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 2 },
						},
						// Yuubari Kai Ni+
						{
							remodel: 2,
							multiple: { "houg": 2, "tais": 1, "houk": 1 },
							synergy: {
								flags: [ "surfaceRadar", "twin14cmMediumGunMountK2Nonexist" ],
								single: { "houg": 3, "raig": 2, "houk": 2 },
							},
						},
						// Yuubari Kai Ni+ with stars >= 7
						{
							remodel: 2,
							minStars: 7,
							multiple: { "houg": 1, "raig": 1 },
						},
					],
					// Katori Class
					"56": [
						{
							multiple: { "houg": 2, "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 2, "houk": 2 },
						},
					],
					// Nisshin Class
					"90": [
						{
							multiple: { "houg": 3, "raig": 2, "tyku": 1, "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "raig": 1 },
						},
					],
				},
			},
			// 14cm Twin Gun Mount Kai Ni
			"518": {
				count: 0,
				starsDist: [],
				byClass: {
					// Yuubari Class
					"34": [
						{
							multiple: { "houg": 3, "tyku": 2, "tais": 1, "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 2 },
						},
						// Yuubari Kai Ni+
						{
							remodel: 2,
							multiple: { "houg": 3, "tais": 1, "houk": 1 },
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "raig": 2, "houk": 2 },
							},
						},
						// Yuubari Kai Ni+ with stars >= 7
						{
							remodel: 2,
							minStars: 7,
							multiple: { "houg": 1, "raig": 1 },
						},
					],
					// Katori Class
					"56": [
						{
							multiple: { "houg": 3, "tyku": 1, "tais": 1, "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 2, "houk": 2 },
						},
					],
					// Nisshin Class
					"90": [
						{
							multiple: { "houg": 3, "raig": 2, "tyku": 1, "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1, "raig": 1 },
						},
					],
				},
				"byShip": [
					{
						// All AVs
						stypes: [16],
						multiple: { "houg": 1, "raig": 1, "houk": 1 },
					},
					{
						// Yuubari K2/K2D
						ids: [622, 624],
						multiple: { "tyku": 1 },
					},
					{
						// Yuubari K2D
						ids: [624],
						multiple: { "tais": 2 },
					},
				],
			},
			// 15.5cm Triple Gun Mount
			"5": {
				count: 0,
				byClass: {
					// Mogami Class
					"9": {
						multiple: { "houg": 1 },
					},
					// Ooyodo Class
					"52": {
						multiple: { "houg": 2 },
					},
				},
			},
			// 15.5cm Triple Gun Mount Kai
			"235": {
				count: 0,
				byClass: {
					// Mogami Class
					"9": {
						multiple: { "houg": 2, "tyku": 1 },
					},
					// Ooyodo Class
					"52": "9",
				},
				byShip: {
					// Ooyodo Kai
					ids: [321],
					multiple: { "houg": 1, "houk": 1 },
					synergy: [
						{
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "houk": 2 },
						},
						{
							flags: [ "airRadar" ],
							single: { "tyku": 3, "houk": 3 },
						},
					],
				},
			},
			// 15.5cm Triple Secondary Gun Mount
			"12": {
				count: 0,
				byClass: {
					// Yamato Class
					"37": {
						multiple: { "houg": 1, "houk": 1, "houm": 1 },
						synergy: {
							flags: [ "rangefinderAirRadar" ],
							single: { "houk": 1, "houm": 1 },
						},
					},
				},
			},
			// 15.5cm Triple Secondary Gun Mount Kai
			"234": {
				count: 0,
				byClass: {
					// Yamato Class
					"37": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1, "houm": 1 },
						synergy: {
							flags: [ "rangefinderAirRadar" ],
							single: { "tyku": 1, "houk": 1, "houm": 1 },
						},
					},
				},
			},
			// 15.5cm Triple Secondary Gun Mount Kai Ni
			"463": {
				count: 0,
				byClass: {
					// Yamato Class
					"37": {
						multiple: { "houg": 1, "tyku": 2, "houk": 1, "houm": 1 },
						synergy: {
							flags: [ "rangefinderAirRadar" ],
							single: { "tyku": 1, "houk": 1, "houm": 1 },
						},
					},
				},
				byShip: {
					// Yamato K2+, Musashi K2
					ids: [911, 916, 546],
					multiple: { "houg": 1, "houk": 1, "houm": 2 },
					synergy: {
						flags: [ "rangefinderKaiAirRadar" ],
						single: { "tyku": 1, "houk": 1, "houm": 2 },
					},
				},
			},
			// 15.2cm Twin Gun Mount Kai
			"139": {
				count: 0,
				byShip: {
					// Noshiro Kai Ni, Yahagi Kai Ni/K2B
					ids: [662, 663, 668],
					multiple: { "houg": 2, "tyku": 1 },
				},
			},
			// 15.2cm Twin Gun Mount Kai Ni
			"407": {
				count: 0,
				byShip: {
					// Noshiro Kai Ni, Yahagi Kai Ni/K2B
					ids: [662, 663, 668],
					multiple: { "houg": 4, "tyku": 2, "houk": 1 },
					synergy: [
						{
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "raig": 2, "houk": 2 },
						},
						{
							flags: [ "airRadar" ],
							single: { "tyku": 2, "houk": 3 },
						},
					],
				},
			},
			// 20.3cm (No.2) Twin Gun Mount
			"90": {
				count: 0,
				byClass: {
					// Furutaka Class
					"7": {
						multiple: { "houg": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "raig": 2, "houk": 2 },
						},
					},
					// Aoba Class
					"13": "7",
					// Takao Class
					"8": {
						multiple: { "houg": 1 },
					},
					// Mogami Class
					"9": "8",
					// Myoukou Class
					"29": "8",
					// Tone Class
					"31": "8",
				},
				byShip: [
					{
						// Aoba all remodels extra Air Radar synergy
						origins: [61],
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 5, "houk": 2 },
						},
					},
					{
						// Aoba Kai, extra +1 fp, +1 aa
						ids: [264],
						multiple: { "houg": 1, "tyku": 1 },
					},
					{
						// Kinugasa Kai Ni
						ids: [142],
						multiple: { "houg": 2, "houk": 1 },
					},
					{
						// Kinugasa Kai, Furutaka Kai Ni, Kako Kai Ni
						ids: [295, 416, 417],
						multiple: { "houg": 1 },
					},
					{
						// Mogami Kai Ni+, Mikuma Kai Ni+
						ids: [501, 506, 502, 507],
						multiple: { "houg": 1 },
					},
				],
			},
			// 20.3cm (No.3) Twin Gun Mount
			"50": {
				count: 0,
				byClass: {
					// Furutaka Class
					"7": {
						multiple: { "houg": 1 },
						synergy: {
							// not stackable with No.2 gun's surface radar synergy
							flags: [ "twin203MediumGunMountNo2Nonexist", "surfaceRadar" ],
							distinct: { "houg": 1, "raig": 1, "houk": 1 },
						},
					},
					// Aoba Class
					"13": "7",
					// Takao Class
					"8": {
						multiple: { "houg": 2, "houk": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "raig": 2, "houk": 2 },
						},
					},
					// Myoukou Class
					"29": "8",
					// Mogami Class
					"9": [
						{
							multiple: { "houg": 2, "houk": 1 },
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "raig": 2, "houk": 2 },
							},
						},
						{
							multiple: { "houg": 1 },
							minCount: 2,
						},
					],
					// Tone Class
					"31": "9",
				},
				byShip: {
					// Mogami Kai Ni+, Mikuma Kai Ni+
					ids: [501, 506, 502, 507],
					multiple: { "houg": 1 },
					synergy: [
						{
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 1 },
						},
						{
							flags: [ "type21AirRadar" ],
							single: { "houg": 1, "tyku": 3, "houk": 2 },
						},
						{
							flags: [ "type21AirRadarK2" ],
							single: { "houg": 2 },
						},
					],
				},
			},
			// Prototype 20.3cm (No.4) Twin Gun Mount
			"520": {
				count: 0,
				starsDist: [],
				byClass: {
					// Furutaka Class
					"7": {
						multiple: { "houg": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "raig": 2, "houk": 1, "houm": 1 },
							},
							{
								flags: [ "antiAirGreenSecGunMount" ],
								single: { "houg": 1, "tyku": 4, "houk": 4, "houm": 1 },
							},
						],
					},
					// Aoba Class
					"13": "7",
					// Takao Class
					"8": {
						multiple: { "houg": 2, "houk": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "raig": 2, "houk": 2, "houm": 1 },
							},
							{
								flags: [ "antiAirGreenSecGunMount" ],
								single: { "houg": 1, "tyku": 4, "houk": 4, "houm": 1 },
							},
						],
					},
					// Myoukou Class
					"29": "8",
					// Mogami Class
					"9": [
						{
							multiple: { "houg": 3, "houk": 1, "houm": 1 },
							synergy: [
								{
									flags: [ "surfaceRadar" ],
									single: { "houg": 3, "raig": 2, "houk": 2, "houm": 1 },
								},
								{
									flags: [ "antiAirGreenSecGunMount" ],
									single: { "houg": 1, "tyku": 4, "houk": 4, "houm": 1 },
								},
							],
						},
						{
							single: { "houg": 2 },
							minCount: 2,
						},
						{
							single: { "houg": 4 },
							minCount: 3,
						},
					],
					// Tone Class
					"31": "9",
				},
				byShip: [
					{
						// Takao Kai, Myoukou Kai/K2, Mikuma K2
						ids: [269, 265, 319, 502],
						multiple: { "houg": 1, "houm": 1 },
					},
					{
						// Mikuma Kai Ni Toku
						ids: [507],
						multiple: { "houg": 1, "tyku": 1, "houm": 2 },
					},
					{
						// Takao Kai, Myoukou Kai/K2
						ids: [269, 265, 319],
						minCount: 2,
						single: { "houg": 2 },
					},
					{
						// Takao Kai, Myoukou Kai/K2
						ids: [269, 265, 319],
						minCount: 3,
						single: { "houg": 2 },
					},
					{
						// Mogami Class Kai Ni/Toku
						ids: [501, 506, 502, 507, 503, 504],
						multiple: { "houg": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "houk": 1, "houm": 2 },
							},
							{
								flags: [ "type21AirRadar" ],
								single: { "houg": 1, "tyku": 3, "houk": 2, "houm": 1 },
							},
							{
								flags: [ "type21AirRadarK2" ],
								single: { "houg": 2, "tyku": 3, "houk": 2, "houm": 1 },
							},
						],
					},
					{
						// Mogami Class Kai Ni/Toku
						ids: [501, 506, 502, 507, 503, 504],
						minStars: 7,
						multiple: { "houg": 1 },
					},
					{
						// Mogami Class Kai Ni/Toku
						ids: [501, 506, 502, 507, 503, 504],
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// 152mm/55 Triple Rapid Fire Gun Mount
			"340": {
				count: 0,
				byClass: {
					// Duca degli Abruzzi Class
					"92": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				},
			},
			// 152mm/55 Triple Rapid Fire Gun Mount Kai
			"341": {
				count: 0,
				byClass: {
					// Duca degli Abruzzi Class
					"92": {
						multiple: { "houg": 2, "tyku": 1, "houk": 1 },
					},
					// Gotland Class
					"89": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				},
			},
			// 65mm/64 Single Rapid Fire Gun Mount Kai
			"430": {
				count: 0,
				starsDist: [],
				byClass: {
					// Conte di Cavour Class
					"113": [
						{
							multiple: { "tyku": 3, "houk": 2 },
						},
						{
							minStars: 2,
							multiple: { "houk": 1 },
						},
						{
							minStars: 4,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 7,
							multiple: { "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "tyku": 1 },
						},
					],
					// V.Veneto Class
					"58": [
						{
							multiple: { "tyku": 2, "houk": 1 },
						},
						{
							minStars: 2,
							multiple: { "houk": 1 },
						},
						{
							minStars: 4,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 7,
							multiple: { "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "tyku": 1 },
						},
					],
					// Zara Class
					"64": "58",
					// Aquila Class
					"68": "58",
					// L.d.S.D.d.Abruzzi Class
					"92": "58",
					// Marcello Class
					"124": "58",
				},
			},
			// Bofors 15.2cm Twin Gun Mount Model 1930
			"303": {
				count: 0,
				byClass: {
					// Kuma Class
					"4": {
						multiple: { "houg": 1, "tyku": 1 },
					},
					// Sendai Class
					"16": "4",
					// Nagara Class
					"20": "4",
					// Agano Class
					"41": "4",
					// Gotland Class
					"89": {
						multiple: { "houg": 1, "tyku": 2, "houk": 1 },
					},
				},
			},
			// 8inch Triple Gun Mount Mk.9
			"356": {
				count: 0,
				byClass: {
					// Mogami Class
					"9": {
						multiple: { "houg": 1 },
					},
					// Northampton Class
					"95": {
						multiple: { "houg": 2 },
					},
				},
			},
			// 8inch Triple Gun Mount Mk.9 mod.2
			"357": {
				count: 0,
				byClass: {
					// Mogami Class
					"9": {
						multiple: { "houg": 1 },
					},
					// Northampton Class
					"95": {
						multiple: { "houg": 2 },
					},
				},
			},
			// SKC34 20.3cm Twin Gun Mount
			"123": {
				count: 0,
				starsDist: [],
				byNation: {
					"Germany": [
						{
							synergy: {
								flags: [ "germanLargeRadar" ],
								countFlag: 0,
								multiple: { "houk": 1 },
							},
						},
						{
							minStars: 5,
							multiple: { "houg": 1 },
						},
						{
							minStars: 7,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
							synergy: {
								flags: [ "germanLargeRadar" ],
								byStars: {
									gearId: 124,
									isMultiple: true,
									 "8": { "houk": 1 },
									"10": { "houm": 1 },
								},
							},
						},
					],
				},
			},
			// 18cm/57 Triple Main Gun Mount
			"555": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Kirov
						origins: [1001],
						multiple: { "houg": 2, "tais": 1, "houm": 1 },
						synergy: [
							{
								flags: [ "ru10cm56GreenSecGunMount" ],
								multiple: { "houg": 1, "tyku": 3, "houk": 2, "houm": 1 },
							},
							{
								flags: [ "arcticGearDeckPersonnel" ],
								multiple: { "houg": 1, "tais": 1, "houk": 2 },
							},
						],
					},
					{
						// Kirov
						origins: [1001],
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						// Kirov
						origins: [1001],
						minStars: 10,
						multiple: { "houg": 2 },
					},
					// For all ships can equip it
					{
						minStars: 3,
						multiple: { "houg": 1 },
					},
					{
						minStars: 7,
						multiple: { "houm": 1 },
					},
					{
						minStars: 10,
						multiple: { "houk": 1 },
					},
				],
			},
			// 5inch Single High-angle Gun Mount Battery
			"358": {
				count: 0,
				byClass: {
					// Northampton Class
					"95": {
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
					},
					// Following British: (Game codes have not used country name to match)
					// Queen Elizabeth Class
					"67": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					// Ark Royal Class
					"78": "67",
					// Nelson Class
					"88": "67",
					// Town Class
					"108": "67",
					// Illustrious Class
					"112": "67",
				},
				byNation: {
					// Number refers to byClass[67] above
					"UnitedStates": 67,
				},
			},
			// 10cm Twin High-angle Gun Mount Battery Concentrated Deployment
			"464": {
				count: 0,
				byClass: {
					// Yamato Class
					"37": {
						multiple: { "tyku": 3, "houk": 2 },
						synergy: {
							flags: [ "rangefinderAirRadar" ],
							single: { "tyku": 2, "houk": 1, "houm": 1 },
						},
					},
					// Kongou Class
					"6": {
						multiple: { "tyku": -2, "houk": -2 },
					},
					// Gangut Class
					"73": "6",
					// Conte di Cavour Class
					"113": "6",
				},
				byShip: {
					// Yamato K2+, Musashi K2, Haruna K2B+
					ids: [911, 916, 546, 593, 954],
					multiple: { "tyku": 2, "houk": 2 },
					synergy: {
						flags: [ "rangefinderKaiAirRadar" ],
						single: { "houg": 2, "tyku": 2, "houk": 2, "houm": 3 },
					},
				},
			},
			// 5inch Twin Gun Mount (Secondary Armament) Concentrated Deployment
			"467": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1, "tyku": 1, "houk": 2 },
						synergy: [
							{
								flags: [ "usNavySurfaceRadar" ],
								single: { "houg": 1, "tyku": 1, "houk": 1, "houm": 2 },
							},
							{
								flags: [ "usNavyAirRadar" ],
								single: { "tyku": 2, "houk": 2 },
							},
						],
					},
				},
				byClass: {
					// Iowa Class
					"65": {
						multiple: { "tyku": 2, "houk": 1 },
					},
					// Colorado Class
					"93": "65",
					// South Dakota Class
					"102": "65",
					// North Carolina Class
					"107": "65",
					// Nevada Class
					"125": "65",
				},
			},
			// 6inch Twin Rapid Fire Gun Mount Mk.XXI
			"359": {
				count: 0,
				byClass: {
					// Perth Class
					"96": {
						multiple: { "houg": 2, "tyku": 2, "houk": 1 },
					},
					// Yuubari Class
					"34": [
						{
							multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						},
						// Yuubari Kai Ni+
						{
							remodel: 2,
							multiple: { "houg": 1, "tyku": 1 },
						},
					],
				},
			},
			// Bofors 15cm Twin Rapid Fire Gun Mount Mk.9 Model 1938
			"360": {
				count: 0,
				byClass: {
					// Agano Class
					"41": {
						multiple: { "houg": 1, "tyku": 1 },
					},
					// Gotland Class
					"89": {
						multiple: { "houg": 2, "tyku": 1, "houk": 1 },
					},
					// De Ryuter Class
					"98": {
						multiple: { "houg": 2, "tyku": 2, "houk": 1 },
					},
				},
			},
			// Bofors 15cm Twin Rapid Fire Gun Mount Mk.9 Kai + Single Rapid Fire Gun Mount Mk.10 Kai Model 1938
			"361": {
				count: 0,
				byClass: {
					// Agano Class
					"41": {
						multiple: { "houg": 1, "tyku": 1 },
					},
					// Gotland Class
					"89": {
						multiple: { "houg": 2, "tyku": 1, "houk": 1 },
					},
					// De Ryuter Class
					"98": {
						multiple: { "houg": 2, "tyku": 2, "houk": 1 },
					},
				},
			},
			// 5inch Twin Dual-purpose Gun Mount (Concentrated Deployment)
			"362": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "tyku": 1, "houk": 1 },
					},
				},
				byClass: {
					// Atlanta Class
					"99": {
						multiple: { "houg": 1, "tyku": 2, "houk": 1 },
					},
					// Agano Class
					"41": {
						multiple: { "tyku": -1, "houk": -2 },
					},
					// Ooyodo Class
					"52": "41",
					// De Ryuter Class
					"98": "41",
					// Katori Class
					"56": {
						multiple: { "houg": -2, "tyku": -1, "houk": -4 },
					},
					// Gotland Class
					"89": "56",
					// Kuma Class
					"4": {
						multiple: { "houg": -3, "tyku": -2, "houk": -6 },
					},
					// Nagara Class
					"20": "4",
					// Sendai Class
					"16": "4",
					// Tenryuu Class
					"21": {
						multiple: { "houg": -3, "tyku": -3, "houk": -8 },
					},
					// Yuubari Class
					"34" : "21"
				},
			},
			// GFCS Mk.37 + 5inch Twin Dual-purpose Gun Mount (Concentrated Deployment)
			"363": {
				count: 0,
				byClass: {
					// Atlanta Class
					"99": {
						multiple: { "houg": 1, "tyku": 3, "houk": 2 },
					},
					// Colorado Class
					"93": {
						multiple: { "tyku": 1, "houk": 1 },
					},
					// Northampton Class
					"95": "93",
					// St. Louis Class
					"106": "93",
					// Brooklyn Class
					"110": "93",
					// Agano Class
					"41": {
						multiple: { "tyku": -1, "houk": -2 },
					},
					// Ooyodo Class
					"52": "41",
					// De Ryuter Class
					"98": "41",
					// Katori Class
					"56": {
						multiple: { "houg": -2, "tyku": -1, "houk": -4 },
					},
					// Gotland Class
					"89": "56",
					// Kuma Class
					"4": {
						multiple: { "houg": -3, "tyku": -2, "houk": -6 },
					},
					// Nagara Class
					"20": "4",
					// Sendai Class
					"16": "4",
					// Tenryuu Class
					"21": {
						multiple: { "houg": -3, "tyku": -3, "houk": -8 },
					},
					// Yuubari Class
					"34" : "21"
				},
			},
			// 10cm/56 Single High-angle Gun Mount (Concentrated Deployment)
			"556": {
				count: 0,
				byShip: {
					// Kirov, Gangut
					origins: [1001, 511],
					multiple: { "houg": 1, "tyku": 3, "houk": 1, "houm": 1 },
				},
			},
			// SK Radar
			"278": {
				count: 0,
				byNation: {
					"UnitedStates": {
						single: { "tyku": 1, "houk": 3, "saku": 1 },
					},
				},
				byClass: {
					// Following British: (Game codes have not used country name to match)
					// Queen Elizabeth Class
					"67": {
						single: { "tyku": 1, "houk": 2 },
					},
					// Ark Royal Class
					"78": "67",
					// Nelson Class
					"88": "67",
					// Town Class
					"108": "67",
					// Illustrious Class
					"112": "67",
					// Perth Class
					"96": {
						single: { "tyku": 1, "houk": 1 },
					},
				},
			},
			// SK + SG Radar
			"279": {
				count: 0,
				byNation: {
					"UnitedStates": {
						single: { "houg": 2, "tyku": 2, "houk": 3, "saku": 2 },
					},
				},
				byClass: {
					// Following British: (Game codes have not used country name to match)
					// Queen Elizabeth Class
					"67": {
						single: { "houg": 1, "tyku": 1, "houk": 2, "saku": 1 },
					},
					// Ark Royal Class
					"78": "67",
					// Nelson Class
					"88": "67",
					// Town Class
					"108": "67",
					// Illustrious Class
					"112": "67",
					// Perth Class
					"96": {
						single: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				},
			},
			// Type281 Radar
			"527": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedKingdom": [
						{
							single: { "tyku": 2, "houk": 1, "saku": 2, "houm": 1 },
						},
						{
							minStars: 2,
							single: { "tyku": 1 },
						},
						{
							minStars: 4,
							single: { "houk": 1 },
						},
						{
							minStars: 7,
							single: { "tyku": 1 },
						},
						{
							minStars: 10,
							single: { "houm": 1 },
						},
					],
				},
				byClass: {
					// Queen Elizabeth Class
					"67": {
						single: { "houg": 1 },
					},
					// Nelson Class
					"88": {
						single: { "houg": 2 },
					},
				},
			},
			// Type274 Fire Control Radar
			"528": {
				count: 0,
				starsDist: [],
				byNation: {
					"UnitedKingdom": [
						{
							multiple: { "houg": 1, "houk": 1, "houm": 2 },
						},
						{
							minStars: 2,
							multiple: { "houg": 1 },
						},
						{
							minStars: 4,
							multiple: { "houm": 1 },
						},
						{
							minStars: 7,
							multiple: { "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
				},
				byClass: {
					// Town Class
					"108": {
						multiple: { "houg": 1, "houk": 1 },
					},
				},
			},
			// 61cm Quadruple (Oxygen) Torpedo Mount
			"15": {
				count: 0,
				byClass: {
					// Kagerou Class K2
					"30": {
						remodel: 2,
						excludes: [556, 557, 558, 559],
						multiple: { "raig": 2 },
						countCap: 2,
					},
				},
				byShip: {
					// All remodels of Matsu Class Take
					origins: [642],
					single: { "raig": 5, "houk": 1 },
				},
			},
			// 61cm Quintuple (Oxygen) Torpedo Mount
			"58": {
				count: 0,
				byClass: {
					// CLT types in Kuma Class
					"4": {
						stypes: [4],
						multiple: { "raig": 1 },
					},
					// Shimakaze Class
					"22": {
						multiple: { "raig": 1 },
					},
					// Akizuki Class
					"54": "22",
				},
			},
			// 53cm Twin Torpedo Mount
			"174": {
				count: 0,
				byClass: {
					// Kamikaze Class
					"66": {
						multiple: { "raig": 1, "houk": 2 },
					},
					// Kongou Class Kai Ni C
					"6": {
						remodel: 3,
						multiple: { "raig": 6, "houk": 3 },
					},
					// Yuubari Kai Ni+
					"34": {
						remodel: 2,
						multiple: { "houg": 2, "raig": 4, "houk": 4 },
					},
				},
				byShip: [
					{
						// Yura Kai Ni
						ids: [488],
						multiple: { "houg": 2, "raig": 4, "houk": 4 },
					},
					{
						// Haruna K2B
						ids: [593],
						multiple: { "raig": -1, "houk": -1 },
					},
				],
			},
			// 53cm Bow (Oxygen) Torpedo Mount
			"67": {
				count: 0,
				byShip: {
					// -5 tp on other ship types except SS, SSV
					excludeStypes: [13, 14],
					multiple: { "raig": -5 },
				},
			},
			// Prototype 61cm Sextuple (Oxygen) Torpedo Mount
			"179": {
				count: 0,
				byClass: {
					// Akizuki Class
					"54": {
						multiple: { "raig": 1 },
						countCap: 2,
					},
				},
			},
			// 533mm Quintuple Torpedo Mount (Initial Model)
			"314": {
				count: 0,
				byClass: {
					// John C. Butler Class
					"87": {
						multiple: { "houg": 1, "raig": 3 },
					},
					// Fletcher Class
					"91": "87",
				},
			},
			// 533mm Quintuple Torpedo Mount (Late Model)
			"376": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 2, "raig": 4 },
					},
				},
				byClass: {
					// Game codes have not used country name to match yet, so does here
					// Jervis Class
					"82": {
						multiple: { "houg": 1, "raig": 2 },
					},
					// Town Class
					"108": "82",
					// Perth Class
					"96": {
						multiple: { "houg": 1, "raig": 1 },
					},
				},
			},
			// 61cm Triple (Oxygen) Torpedo Mount Late Model
			"285": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ayanami Class K2: Ayanami K2, Ushio K2, Akebono K2, Amagiri K2+
					"1": [
						{
							remodel: 2,
							multiple: { "raig": 2, "houk": 1 },
							countCap: 2,
						},
						{
							minStars: 10,
							remodel: 2,
							single: { "houg": 1, "raig": 1 },
						},
						{
							minStars: 10,
							remodel: 2,
							minCount: 2,
							single: { "houg": 1 },
						},
						{
							minStars: 10,
							remodel: 2,
							minCount: 3,
							single: { "raig": 3 },
						},
					],
					// Akatsuki Class K2: Akatsuki K2, Hibiki K2 (Bep)
					"5": "1",
					// Hatsuharu Class K2: Hatsuharu K2, Hatsushimo K2
					"10": "1",
					// Fubuki Class K2: Fubuki K2, Murakumo K2, Uranami K2, Isonami K2, Shirayuki K2, Hatsuyuki K2
					"12": "1",
				},
				byShip: [
					{
						// Amagiri K2
						ids: [903],
						minCount: 2,
						single: { "raig": 2 },
					},
					{
						// Amagiri K2
						ids: [903],
						minCount: 3,
						single: { "raig": 2 },
					},
					{
						// Amagiri K2D
						ids: [908],
						minCount: 2,
						single: { "raig": 1 },
					},
					{
						// Amagiri K2D
						ids: [908],
						minCount: 3,
						single: { "raig": 1 },
					},
				],
			},
			// 61cm Quadruple (Oxygen) Torpedo Mount Late Model
			"286": {
				count: 0,
				starsDist: [],
				byClass: {
					// Asashio Class K2
					"18": [
						{
							remodel: 2,
							multiple: { "raig": 2, "houk": 1 },
							countCap: 2,
						},
						{
							// +1 fp if stars +max
							minStars: 10,
							remodel: 2,
							multiple: { "houg": 1 },
							countCap: 2,
						},
					],
					// Shiratsuyu Class K2
					"23": "18",
					// Yuugumo Class K2
					"38": "18",
					// Kagerou Class K2
					//  except Isokaze / Hamakaze B Kai, Urakaze / Tanikaze D Kai
					"30": [
						{
							remodel: 2,
							excludes: [556, 557, 558, 559],
							multiple: { "raig": 2, "houk": 1 },
							countCap: 2,
						},
						{
							// +1 tp if stars >= +5
							minStars: 5,
							remodel: 2,
							excludes: [556, 557, 558, 559],
							multiple: { "raig": 1 },
							countCap: 2,
						},
						{
							// +1 fp if stars +max
							minStars: 10,
							remodel: 2,
							excludes: [556, 557, 558, 559],
							multiple: { "houg": 1 },
							countCap: 2,
						},
					],
				},
				byShip: [
					{
						// All remodels of Matsu Class Take
						origins: [642],
						single: { "raig": 7, "houk": 2 },
					},
					{
						// extra +2 tp if stars >= +7
						origins: [642],
						minStars: 7,
						single: { "raig": 2 },
					},
					{
						// extra +2 tp if stars +max
						origins: [642],
						minStars: 10,
						single: { "raig": 2 },
					},
					{
						// Noshiro Kai Ni, Yahagi Kai Ni/K2B
						ids: [662, 663, 668],
						multiple: { "raig": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "raig": 3, "houk": 2 },
						},
					},
					{
						// Shigure K3
						ids: [961],
						minStars: 5,
						multiple: { "raig": 1 },
						countCap: 2,
					},
				],
			},
			// 533mm Triple Torpedo Mount
			"283": {
				count: 0,
				byNation: {
					"Russia": {
						multiple: { "houg": 1, "raig": 6, "souk": 1 },
					},
				},
				byShip: {
					// Hibiki K2 (Bep)
					ids: [147],
					multiple: { "houg": 1, "raig": 6, "souk": 1 },
				},
			},
			// 533mm Triple Torpedo Mount (Model 53-39)
			"400": {
				count: 0,
				starsDist: [],
				byNation: {
					"Russia": {
						multiple: { "houg": 1, "raig": 8, "souk": 1, "houk": 2 },
						synergy: {
							flags: [ "ru130mmB13SmallGunMount" ],
							single: { "houg": 2 },
						},
					},
				},
				byShip: [
					{
						// Hibiki K2 (Bep)
						ids: [147],
						multiple: { "houg": 1, "raig": 8, "souk": 1, "houk": 2 },
						synergy: {
							flags: [ "ru130mmB13SmallGunMount" ],
							single: { "houg": 2 },
						},
					},
					// For any ship can equip it
					{
						minStars: 2,
						multiple: { "houm": 1 },
					},
					{
						minStars: 4,
						multiple: { "raig": 1 },
					},
					{
						minStars: 6,
						multiple: { "souk": 1 },
					},
					{
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						minStars: 8,
						multiple: { "raig": 1 },
					},
					{
						minStars: 9,
						multiple: { "houm": 1 },
					},
					{
						minStars: 10,
						multiple: { "raig": 1 },
					},
				],
			},
			// Late Model 53cm Bow Torpedo Mount (8 tubes)
			"383": {
				count: 0,
				starsDist: [],
				byClass: {
					// I-58 Class
					"36": [
						{
							multiple: { "raig": 1 },
						},
						{
							minStars: 5,
							single: { "houm": 1 },
						},
					],
					// I-400 Class
					"44": [
						{
							multiple: { "raig": 2 },
						},
						{
							minStars: 4,
							single: { "raig": 1 },
						},
						{
							minStars: 6,
							single: { "houm": 1 },
						},
					],
					// I-47 Class
					"103": [
						{
							multiple: { "raig": 3 },
						},
						{
							minStars: 5,
							single: { "houm": 1 },
						},
					],
				},
				byShip: [
					{
						// I-47 Kai
						ids: [607],
						multiple: { "raig": 1 },
					},
					// For any ship
					{
						minStars: 8,
						single: { "raig": 1 },
					},
					{
						minStars: 10,
						single: { "houm": 1 },
					},
				],
			},
			// 21inch 4-tube Bow Torpedo Launcher (Initial Model)
			"511": {
				count: 0,
				byClass: {
					// Gato Class
					"114": {
						distinctGears: [511, 512],
						single: { "raig": 1, "houk": 2 },
					},
					// Salmon Class
					"122": {
						distinctGears: [511, 512],
						single: { "raig": 3, "houk": 4 },
					},
				},
			},
			// 21inch 4-tube Bow Torpedo Launcher (Late Model)
			"512": {
				count: 0,
				byClass: {
					// Gato Class
					"114": {
						distinctGears: [511, 512],
						single: { "raig": 1, "houk": 2 },
					},
					// Salmon Class
					"122": {
						distinctGears: [511, 512],
						single: { "raig": 3, "houk": 4 },
					},
				},
			},
			// 21inch 6-tube Bow Torpedo Launcher (Initial Model)
			"440": {
				count: 0,
				byClass: {
					// Gato Class
					"114": {
						distinctGears: [440, 441],
						single: { "raig": 2 },
					},
				},
			},
			// 21inch 6-tube Bow Torpedo Launcher (Late Model)
			"441": {
				count: 0,
				byClass: {
					// Gato Class
					"114": {
						distinctGears: [440, 441],
						single: { "raig": 2 },
					},
				},
			},
			// Submarine 4-tube Stern Torpedo Launcher (Initial Model)
			"442": {
				count: 0,
				byClass: {
					// Gato Class
					"114": {
						distinctGears: [442, 443],
						single: { "raig": 2 },
					},
					// Salmon Class
					"122": {
						distinctGears: [442, 443],
						single: { "raig": 1, "houk": 2 },
					},
				},
			},
			// Submarine 4-tube Stern Torpedo Launcher (Late Model)
			"443": {
				count: 0,
				byClass: {
					// Gato Class
					"114": {
						distinctGears: [442, 443],
						single: { "raig": 2 },
					},
					// Salmon Class
					"122": {
						distinctGears: [442, 443],
						single: { "raig": 1, "houk": 2 },
					},
				},
			},
			// Late Model Bow Torpedo Mount (4 tubes)
			"457": {
				count: 0,
				byClass: {
					// I-400 Class
					"44": {
						distinctGears: [457, 461],
						single: { "raig": 1, "houk": 4 },
					},
					// I-13, I-14
					"71": {
						distinctGears: [457, 461],
						single: { "raig": 2, "houk": 2 },
					},
					// I-47 Class
					"103": "71",
					// I-201, I-203
					"109": {
						distinctGears: [457, 461],
						single: { "raig": 3, "houk": 3 },
					},
				},
			},
			// Skilled Sonar Personnel + Late Model Bow Torpedo Mount (4 tubes)
			"461": {
				count: 0,
				starsDist: [],
				byClass: {
					// I-400 Class
					"44": [
						{
							distinctGears: [457, 461],
							single: { "raig": 1, "houk": 4 },
						},
						{
							minStars: 4,
							multiple: { "raig": 1 },
						},
						{
							minStars: 6,
							multiple: { "raig": 1 },
						},
						{
							minStars: 8,
							multiple: { "raig": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
					// I-13, I-14
					"71": [
						{
							distinctGears: [457, 461],
							single: { "raig": 2, "houk": 2 },
						},
						{
							minStars: 3,
							multiple: { "houk": 1 },
						},
						{
							minStars: 4,
							multiple: { "raig": 1 },
						},
						{
							minStars: 6,
							multiple: { "raig": 1 },
						},
						{
							minStars: 8,
							multiple: { "raig": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
					// I-47 Class
					"103": "71",
					// I-201, I-203
					"109": [
						{
							distinctGears: [457, 461],
							single: { "raig": 3, "houk": 3 },
						},
						{
							minStars: 2,
							multiple: { "raig": 1 },
						},
						{
							minStars: 3,
							multiple: { "houk": 1 },
						},
						{
							minStars: 4,
							multiple: { "raig": 1 },
						},
						{
							minStars: 5,
							multiple: { "houm": 1 },
						},
						{
							minStars: 6,
							multiple: { "raig": 1 },
						},
						{
							minStars: 8,
							multiple: { "raig": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
				},
			},
			// Late Model Radar & Passive Radiolocator + Snorkel Equipment
			"458": {
				count: 0,
				starsDist: [],
				byClass: {
					// I-400 Class
					"44": {
						single: { "raig": 3, "houk": 3 },
					},
					// I-13, I-14
					"71": {
						single: { "raig": 3, "houk": 4 },
					},
					// I-47 Class
					"103": "71",
					// I-201, I-203
					"109": {
						single: { "raig": 3, "houk": 6 },
					},
				},
				byShip: [
					{
						classes: [44, 71, 103, 109],
						minStars: 4,
						multiple: { "houm": 1 },
					},
					{
						classes: [44, 71, 103, 109],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						classes: [44, 71, 103, 109],
						minStars: 8,
						multiple: { "raig": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 2,
						synergy: {
							flags: [ "submarineBowTorpedoLateModelSkilled" ],
							byStars: {
								gearId: 461,
								"4": { "raig": 7, "houm": 5 },
							}
						},
					},
					{
						stypes: [13, 14],
						minStars: 3,
						multiple: { "houk": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 5,
						multiple: { "raig": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// Late Model Submarine Radar & Passive Radiolocator
			"384": {
				count: 0,
				byClass: {
					// I-58 Class
					"36": {
						multiple: { "houk": 2 },
					},
					// I-400 Class
					"44": {
						multiple: { "houk": 3 },
					},
					// I-47 Class
					"103": {
						multiple: { "houk": 3 },
					},
				},
				byShip: [
					{
						// I-47 Kai
						ids: [607],
						multiple: { "houk": 1 },
					},
					{
						// Any ship who can equip it will get synergy +3 tp, +2 ev
						stypes: [13, 14],
						synergy: {
							flags: [ "submarineTorpedoLateModel" ],
							single: { "raig": 3, "houk": 2 },
						},
					},
				],
			},
			// SJ Radar + Submarine Conning Tower Equipment
			"519": {
				count: 0,
				byClass: {
					// Gato Class
					"114": {
						single: { "raig": 1, "houk": 2, "houm": 2 },
					},
					// Salmon Class
					"122": {
						single: { "houk": 2, "houm": 2 },
					},
				},
			},
			// Type C Kouhyouteki
			"309": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Yuubari K2T, Nisshin Kai/A, Kitakami K2, Ooi K2, Kuma K2D, Mogami/Mikuma K2T, Yahagi K2B
						ids: [623, 586, 119, 118, 657, 506, 668, 507, 690],
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						ids: [623, 586, 119, 118, 657, 506, 668, 507, 690],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						ids: [623, 586, 119, 118, 657, 506, 668, 507, 690],
						minStars: 9,
						multiple: { "raig": 1 },
					},
					{
						ids: [623, 586, 119, 118, 657, 506, 668, 507, 690],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					// All other ships can equip this except ships above
					{
						excludes: [623, 586, 119, 118, 657, 506, 668, 507, 690],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						excludes: [623, 586, 119, 118, 657, 506, 668, 507, 690],
						minStars: 9,
						multiple: { "raig": 1 },
					},
					{
						excludes: [623, 586, 119, 118, 657, 506, 668, 507, 690],
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// Type D Kai Kouhyouteki
			"364": {
				count: 0,
				byShip: [
					{
						// Yuubari K2T
						ids: [623],
						multiple: { "houg": 1, "raig": 4, "houk": -2 },
					},
					{
						// Kitakami K2
						ids: [119],
						multiple: { "raig": 2, "houk": -2 },
					},
					{
						// Mikuma K2T
						ids: [507],
						multiple: { "raig": 2 },
					},
					{
						// Ooi K2, Nisshin A, Kuma K2D, Mogami/Mikuma K2T, Yahagi K2B
						ids: [118, 586, 657, 506, 507, 668],
						multiple: { "raig": 1, "houk": -2 },
					},
					{
						// All other ships who can equip it
						stypes: [3, 4, 13, 14, 16],
						excludes: [118, 119, 506, 507, 586, 623, 657, 668],
						multiple: { "houg": -1, "houk": -7 },
					},
				],
			},
			// 12cm Single Gun Mount Kai Ni
			"293": {
				count: 0,
				byClass: {
					// Mutsuki Class
					"28": {
						multiple: { "houg": 2, "tyku": 1, "houk": 3 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "raig": 1, "houk": 3 },
							},
							{
								flags: [ "kamikazeTwinTorpedo" ],
								byCount: {
									gear: "kamikazeTwinTorpedo",
									"1": { "houg": 2, "raig": 4 },
									"2": { "houg": 3, "raig": 7 },
									"3": { "houg": 3, "raig": 7 },
								},
							},
						],
					},
					// Kamikaze Class
					"66": "28",
					// Shimushu Class
					"74": {
						multiple: { "houg": 1, "tyku": 1, "houk": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "tais": 1, "houk": 3 },
						},
					},
					// Etorofu Class
					"77": "74",
				},
			},
			// 12.7cm Single Gun Mount
			"78": {
				count: 0,
				starsDist: [],
				byClass: {
					// Z1 Class
					"48": [
						{
							multiple: { "houg": 1, "houk": 1 },
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "raig": 2, "houk": 2 },
							},
						},
						{
							minStars: 7,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "souk": 1 },
						},
					],
				},
			},
			// 10cm Twin High-angle Gun Mount
			"3": {
				count: 0,
				byClass: {
					// Akizuki Class
					"54": {
						multiple: { "houg": 1, "tyku": 2, "houk": 1 },
					},
				},
				byShip: [
					{
						// Hatsuzuki Kai Ni
						ids: [968],
						multiple: { "houg": 1, "houm": 1, "houk": 1 },
					},
					{
						// Fujinami Kai Ni
						ids: [981],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				],
			},
			// 10cm Twin High-angle Gun Mount + Anti-Aircraft Fire Director
			"122": {
				count: 0,
				starsDist: [],
				byClass: {
					// Akizuki Class
					"54": [
						{
							multiple: { "houg": 1, "tyku": 2, "houk": 1 },
						},
						{
							minStars: 6,
							multiple: { "houk": 1 },
						},
						{
							minStars: 7,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byShip: [
					{
						// Hatsuzuki Kai Ni
						ids: [968],
						multiple: { "houg": 1, "houm": 1, "houk": 1 },
					},
					{
						// Yukikaze Kai Ni
						ids: [656],
						minStars: 4,
						multiple: { "houg": 5, "tyku": 3, "houk": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 4, "houk": 3 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 4, "houk": 3 },
							},
						],
					},
					{
						// Fujinami Kai Ni, Hamanami Kai Ni
						ids: [981, 983],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						ids: [981, 983],
						minStars: 7,
						multiple: { "tyku": 1 },
					},
					{
						ids: [981, 983],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						ids: [981, 983],
						minStars: 9,
						multiple: { "houm": 1 },
					},
					{
						ids: [981, 983],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Fubuki Kai Ni, Shirayuki Kai Ni, Hatsuyuki Kai Ni
						ids: [426, 986, 987],
						minStars: 7,
						multiple: { "tyku": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 9,
						multiple: { "houm": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				]
			},
			// 10cm Twin High-angle Gun Mount Kai + Anti-Aircraft Fire Director Kai
			"533": {
				count: 0,
				starsDist: [],
				byClass: {
					// Akizuki Class
					"54": [
						{
							multiple: { "houg": 1, "tyku": 2, "houk": 1 },
						},
						{
							minStars: 2,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 10,
							multiple: { "houk": 1 },
						},
					],
				},
				byShip: [
					{
						// Hatsuzuki Kai Ni
						ids: [968],
						multiple: { "houg": 1, "houk": 1, "houm": 1 },
					},
					{
						ids: [968],
						minStars: 1,
						multiple: { "houk": 1 },
					},
					{
						ids: [968],
						minStars: 3,
						multiple: { "tyku": 1 },
					},
					{
						ids: [968],
						minStars: 5,
						multiple: { "houm": 1 },
					},
					{
						ids: [968],
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						ids: [968],
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						// Fujinami Kai Ni
						ids: [981],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						ids: [981],
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						ids: [981],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						ids: [981],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						ids: [981],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Fubuki Kai Ni, Shirayuki Kai Ni, Hatsuyuki Kai Ni
						ids: [426, 986, 987],
						multiple: { "houg": 1, "tyku": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				]
			},
			// 10cm Twin High-angle Gun Mount Kai
			"553": {
				count: 0,
				starsDist: [],
				byClass: {
					// Akizuki Class
					"54": [
						{
							multiple: { "houg": 1, "tyku": 2, "houk": 1 },
						},
						{
							minStars: 2,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 10,
							multiple: { "houk": 1 },
						},
					],
				},
				byShip: [
					{
						// Hatsuzuki Kai Ni
						ids: [968],
						multiple: { "houg": 1, "houk": 1, "houm": 1 },
					},
					{
						// Fujinami Kai Ni
						ids: [981],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						ids: [981],
						minStars: 2,
						multiple: { "tyku": 1 },
					},
					{
						ids: [981],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						ids: [981],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						ids: [981],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						ids: [981],
						minStars: 10,
						multiple: { "houk": 1 },
					},
					{
						// Fubuki Kai Ni, Shirayuki Kai Ni, Hatsuyuki Kai Ni
						ids: [426, 986, 987],
						multiple: { "houg": 1, "tyku": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						ids: [426, 986, 987],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				]
			},
			// Locally Modified 12.7cm Twin High-angle Gun Mount
			"397": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Tan Yang
						ids: [651],
						multiple: { "houg": 5, "tyku": 2, "houk": 1 },
					},
					{
						// Tan Yang
						ids: [651],
						minStars: 4,
						multiple: { "houg": 4, "houk": 1 },
					},
					{
						// Yukikaze Kai Ni
						ids: [656],
						multiple: { "houg": 3, "tyku": 1, "houk": 1 },
					},
					{
						// Tan Yang/Yukikaze Kai Ni
						ids: [651, 656],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "houk": 3 },
						},
					},
				]
			},
			// Locally Modified 10cm Twin High-angle Gun Mount
			"398": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Tan Yang
						ids: [651],
						multiple: { "houg": 4, "tyku": 4, "houk": 2 },
					},
					{
						// Tan Yang
						ids: [651],
						minStars: 4,
						multiple: { "houg": 3, "houk": 2 },
					},
					{
						// Yukikaze Kai Ni
						ids: [656],
						multiple: { "houg": 3, "tyku": 2, "houk": 2 },
					},
					{
						// Yukikaze Kai Ni
						ids: [656],
						minStars: 4,
						multiple: { "houg": 2, "houk": 1 },
					},
					{
						// Tan Yang/Yukikaze Kai Ni
						ids: [651, 656],
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "houk": 3 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 3, "houk": 3 },
							},
						],
					},
				]
			},
			// 12.7cm Single High-angle Gun Mount (Late Model)
			"229": {
				count: 0,
				starsDist: [],
				byClass: {
					// Mutsuki Class
					"28": {
						minStars: 7,
						multiple: { "houg": 1, "tyku": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 3 },
						},
					},
					// Kamikaze Class
					"66": "28",
					// Yuubari Kai Ni+
					"34": {
						remodel: 2,
						multiple: { "houg": 1, "tyku": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "houk": 1 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 2 },
							},
						],
					},
				},
				byShip: [
					{
						// All DE
						stypes: [1],
						minStars: 7,
						multiple: { "houg": 1, "tyku": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 4 },
						},
					},
					{
						// All remodels of: Naka, Kinu
						origins: [56, 113],
						minStars: 7,
						multiple: { "houg": 2 },
					},
					{
						// All remodels of: Yura
						origins: [23],
						minStars: 7,
						multiple: { "houg": 2, "tyku": 1 },
					},
					{
						// Yura Kai, Naka Kai, Kinu Kai
						ids: [220, 224, 289],
						minStars: 7,
						multiple: { "tyku": 1 },
					},
					{
						// Naka Kai Ni, Kinu Kai Ni, Yura Kai Ni
						ids: [160, 487, 488],
						minStars: 7,
						multiple: { "tyku": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "houk": 2 },
						},
					},
					{
						// Yukikaze Kai Ni
						ids: [656],
						multiple: { "houg": 2, "tyku": 3, "tais": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 3, "houk": 2 },
							},
						],
					},
				],
			},
			// 12.7cm Single High-angle Gun Mount Kai Ni
			"379": {
				count: 0,
				byClass: {
					// Mutsuki Class
					"28": {
						multiple: { "houg": 1, "tyku": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 3 },
						},
					},
					// Kamikaze Class
					"66": "28",
					// Tenyuu Class
					"21": {
						multiple: { "houg": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 3 },
						},
					},
					// Yuubari Class
					"34": {
						multiple: { "houg": 1, "tais": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 3 },
						},
					},
					// Matsu Class
					"101": [
						{
							single: { "houg": 2, "tyku": 2 },
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 4, "houk": 3 },
							},
						},
						// Make another object in order to compatible with mstship's `.single || .multiple` handling
						{
							multiple: { "houg": 1, "tyku": 2 },
						},
					]
				},
				byShip: [
					{
						// All DE
						stypes: [1],
						multiple: { "houg": 1, "tyku": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 4 },
						},
					},
					{
						// All AV/CT
						stypes: [16, 21],
						multiple: { "houg": 1, "tyku": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 2 },
						},
					},
					{
						// Synergy only for all CL/CLT
						stypes: [3, 4],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 2 },
						},
					},
					{
						// All remodels of: Isuzu, Yura, Naka, Kinu
						origins: [22, 23, 56, 113],
						multiple: { "houg": 2, "tais": 1 },
					},
					{
						// All remodels of: Ooi, Kitakami
						origins: [24, 25],
						multiple: { "houg": 2, "tyku": 2 },
					},
					{
						// Yura base, Isuzu base,Kai, Naka base,Kai, Kinu base,Kai extra +2 aa
						ids: [23,     22, 219,        56, 224,       113, 289],
						multiple: { "tyku": 2 },
					},
					{
						// Yura Kai, Isuzu K2, Naka K2, Kinu K2 extra +3 aa
						ids: [220,   141,      160,     487],
						multiple: { "tyku": 3 },
					},
					{
						// Yura Kai Ni extra +4 aa and synergy
						ids: [488],
						multiple: { "tyku": 4 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 2 },
						},
					},
					{
						// Ooi K2,Kitakami K2, Isuzu K2, Naka K2, Kinu K2 extra synergy
						ids: [118, 119,        141,      160,     487],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 1 },
						},
					},
					{
						// Yura K2, Isuzu K2, Naka K2, Kinu K2 extra +1 asw
						ids: [488,  141,      160,     487],
						multiple: { "tais": 1 },
					},
					{
						// Tenryuu K2, Tatsuta K2, Yuubari K2D extra +2 asw
						ids: [477,     478,        624],
						multiple: { "tais": 2 },
					},
					{
						// Tenryuu K2, Tatsuta K2, Yuubari K2,K2D extra +2 aa
						ids: [477,     478,        622, 624],
						multiple: { "tyku": 2 },
					},
					{
						// Kiso K2, Tama K2, Kuma K2,K2D
						ids: [146,  547,     652, 657],
						single: { "houg": 2, "tyku": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 1 },
						},
					},
					{
						// Tan Yang
						ids: [651],
						multiple: { "houg": 3, "tyku": 3 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 2 },
						},
					},
					{
						// Yukikaze K2
						ids: [656],
						multiple: { "houg": 3, "tyku": 3, "tais": 2, "houk": 3 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 3, "houk": 2 },
							},
						],
					},
				],
			},
			// 12.7cm Twin High-angle Gun Mount Kai Ni
			"380": {
				count: 0,
				byClass: {
					// Tenyuu Class
					"21": {
						multiple: { "houg": 1 },
					},
					// Yuubari Class
					"34": {
						multiple: { "houg": 1, "tais": 1 },
					},
					// Matsu Class
					"101": [
						{
							single: { "houg": 2, "tyku": 2 },
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 4, "houk": 3 },
							},
						},
						// Make another object in order to compatible with mstship's `.single || .multiple` handling
						{
							multiple: { "houg": 1, "tyku": 2 },
						},
					],
				},
				byShip: [
					{
						// All AV/CT
						stypes: [16, 21],
						multiple: { "houg": 1, "tyku": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 1 },
						},
					},
					{
						// Synergy only for all CL/CLT
						stypes: [3, 4],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "houk": 1 },
						},
					},
					{
						// All remodels of: Isuzu, Yura, Naka, Kinu
						origins: [22, 23, 56, 113],
						multiple: { "houg": 2, "tais": 1 },
					},
					{
						// All remodels of: Ooi, Kitakami
						origins: [24, 25],
						multiple: { "houg": 3, "tyku": 2 },
					},
					{
						// Yura base, Isuzu base,Kai, Naka base,Kai, Kinu base,Kai extra +2 aa
						ids: [23,     22, 219,        56, 224,       113, 289],
						multiple: { "tyku": 2 },
					},
					{
						// Yura Kai, Isuzu K2, Naka K2, Kinu K2 extra +3 aa
						ids: [220,   141,      160,     487],
						multiple: { "tyku": 3 },
					},
					{
						// Yura Kai Ni extra +4 aa
						ids: [488],
						multiple: { "tyku": 4 },
					},
					{
						// Ooi K2,Kitakami K2, Isuzu K2, Naka K2, Kinu K2, Yura K2, Tan Yang, Yukikaze K2 extra synergy
						ids: [118, 119,        141,      160,     487,     488,     651,      656],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 2 },
						},
					},
					{
						// Yura K2, Isuzu K2, Naka K2, Kinu K2 extra +1 asw
						ids: [488,  141,      160,     487],
						multiple: { "tais": 1 },
					},
					{
						// Tenryuu K2, Tatsuta K2, Yuubari K2D extra +2 asw
						ids: [477,     478,        624],
						multiple: { "tais": 2 },
					},
					{
						// Tenryuu K2, Tatsuta K2, Yuubari K2,K2D extra +2 aa
						ids: [477,     478,        622, 624],
						multiple: { "tyku": 2 },
					},
					{
						// Kuma K2,K2D
						ids: [652, 657],
						multiple: { "houg": 3 },
					},
					{
						// Kiso K2, Tama K2
						ids: [146, 547],
						single: { "houg": 2 },
					},
					{
						// Kiso K2, Tama K2, Kuma K2,K2D
						ids: [146,  547,     652, 657],
						single: { "tyku": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 3 },
						},
					},
					{
						// Tan Yang/Yukikaze K2
						ids: [651, 656],
						multiple: { "houg": 3, "tyku": 3 },
					},
					{
						// Ushio/Akebono K2
						ids: [407, 665],
						multiple: { "houg": 2, "tyku": 2 },
					},
					{
						// Ushio/Akebono K2
						ids: [407, 665],
						single: { "houg": 1, "tyku": 1, "houk": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "houk": 1 },
							},
							{
								flags: [ "aaMachineGun" ],
								single: { "houg": 1, "tyku": 2, "houk": 1 },
							},
						],
					},
				],
			},
			// 12cm Single High-angle Gun Mount Model E
			"382": {
				count: 0,
				byClass: {
					// Mutsuki Class
					"28": {
						multiple: { "tyku": 2, "houk": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 2 },
							},
						],
					},
					// Kamikaze Class
					"66": "28",
					// Matsu Class
					"101": "28",
				},
				byShip: [
					{
						// All DE
						stypes: [1],
						multiple: { "tais": 1, "tyku": 2, "houk": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "houk": 3 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 3 },
							},
						],
					},
					{
						// All remodels of: Yura, Naka, Kinu
						origins: [23, 56, 113],
						multiple: { "tyku": 1 },
					},
					{
						// Yura Kai, Naka Kai, Kinu Kai
						ids: [220, 224, 289],
						multiple: { "houk": 1 },
					},
					{
						// Yura Kai Ni, Naka Kai Ni, Kinu Kai Ni
						ids: [488, 160, 487],
						multiple: { "houk": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "houk": 1 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 2 },
							},
						],
					},
					{
						// Yukikaze Kai Ni
						ids: [656],
						multiple: { "tyku": 3, "houk": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 3, "houk": 2 },
							},
						],
					},
					{
						// Inagi Kai Ni
						ids: [979],
						multiple: { "houg": 1, "tyku": 1, "houk": 1, "houm": 1 },
					},
				],
			},
			// 12cm Single High-angle Gun Mount Model E Kai
			"509": {
				count: 0,
				starsDist: [],
				byClass: {
					// Mutsuki Class
					"28": [
						{
							multiple: { "tyku": 2, "houk": 1 },
							synergy: [
								{
									flags: [ "surfaceRadar" ],
									single: { "houg": 1, "houk": 2 },
								},
								{
									flags: [ "airRadar" ],
									single: { "tyku": 2, "houk": 2 },
								},
							],
						},
						{
							minStars: 1,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 2,
							multiple: { "houk": 2 },
						},
						{
							minStars: 4,
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "tyku": 1 },
						},
					],
					// Kamikaze Class
					"66": "28",
					// Matsu Class
					"101": "28",
				},
				byShip: [
					{
						// All DE
						stypes: [1],
						multiple: { "tais": 1, "tyku": 2, "houk": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "houk": 3 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 3 },
							},
						],
					},
					{
						// All remodels of: Yura, Naka, Kinu
						origins: [23, 56, 113],
						multiple: { "tyku": 1 },
					},
					{
						// Yura Kai, Naka Kai, Kinu Kai
						ids: [220, 224, 289],
						multiple: { "houk": 1 },
					},
					{
						// Yura Kai Ni, Naka Kai Ni, Kinu Kai Ni
						ids: [488, 160, 487],
						multiple: { "houk": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "houk": 1 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 2 },
							},
						],
					},
					{
						// Yukikaze Kai Ni
						ids: [656],
						multiple: { "tyku": 3, "houk": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 3, "houk": 2 },
							},
						],
					},
					{
						// All CL/CLT/CT
						stypes: [3, 4, 21],
						minStars: 2,
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "houk": 1 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 1 },
							},
						],
					},
					{
						// Shigure K2
						ids: [145],
						minStars: 2,
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "tyku": 1, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 4, "houk": 2 },
							},
						],
					},
					{
						// Shigure K3
						ids: [961],
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "tyku": 2, "houk": 3 },
							},
							{
								flags: [ "airRadar" ],
								single: { "houg": 1, "tyku": 5, "houk": 3 },
							},
						],
					},
					// Most ships and types above get stars bonus
					{
						stypes: [1],
						minStars: 1,
						multiple: { "tyku": 1 },
					},
					{
						stypes: [1],
						minStars: 2,
						multiple: { "houk": 2 },
					},
					{
						stypes: [1],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						stypes: [1],
						minStars: 6,
						multiple: { "tyku": 1 },
					},
					{
						stypes: [1],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						stypes: [1],
						minStars: 10,
						multiple: { "tyku": 1 },
					},
					{
						ids: [488, 656, 145, 961],
						minStars: 1,
						multiple: { "tyku": 1 },
					},
					{
						ids: [488, 656, 145, 961],
						minStars: 2,
						multiple: { "houk": 2 },
					},
					{
						ids: [488, 656, 145, 961],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						ids: [488, 656, 145, 961],
						minStars: 6,
						multiple: { "tyku": 1 },
					},
					{
						ids: [488, 656, 145, 961],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						ids: [488, 656, 145, 961],
						minStars: 10,
						multiple: { "tyku": 1 },
					},
					// All other ships can equip this except ships above
					{
						excludes: [488, 656, 145, 961],
						excludeClasses: [28, 66, 101],
						excludeStypes: [1],
						minStars: 2,
						multiple: { "tyku": 1 },
					},
					{
						excludes: [488, 656, 145, 961],
						excludeClasses: [28, 66, 101],
						excludeStypes: [1],
						minStars: 4,
						multiple: { "houk": 2 },
					},
					{
						excludes: [488, 656, 145, 961],
						excludeClasses: [28, 66, 101],
						excludeStypes: [1],
						minStars: 6,
						multiple: { "houg": 1 },
					},
					{
						excludes: [488, 656, 145, 961],
						excludeClasses: [28, 66, 101],
						excludeStypes: [1],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						excludes: [488, 656, 145, 961],
						excludeClasses: [28, 66, 101],
						excludeStypes: [1],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					{
						// Inagi Kai Ni, extra +1 ev
						ids: [979],
						multiple: { "houg": 1, "tyku": 1, "houk": 1, "houm": 2 },
					},
					// Inagi Kai Ni star bonuses
					{
						ids: [979],
						minStars: 3,
						multiple: { "houk": 1 },
					},
					{
						ids: [979],
						minStars: 5,
						multiple: { "houg": 1 },
					},
					{
						ids: [979],
						minStars: 7,
						multiple: { "tyku": 2 },
					},
					{
						ids: [979],
						minStars: 9,
						multiple: { "houm": 1 },
					},
					{
						ids: [979],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// 12cm Single High-angle Gun Mount + Additional 25mm Machine Guns
			"524": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All LHA/AR/AS/CT/AO
						stypes: [17, 19, 20, 21, 22],
						multiple: { "houg": 1, "tyku": 2, "houk": 2, "houm": 1 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 2, "houk": 2 },
						},
					},
					{
						stypes: [17, 19, 20, 21, 22],
						minStars: 1,
						multiple: { "houk": 1 },
					},
					{
						stypes: [17, 19, 20, 21, 22],
						minStars: 2,
						multiple: { "houk": 1 },
					},
					{
						stypes: [17, 19, 20, 21, 22],
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						stypes: [17, 19, 20, 21, 22],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						stypes: [17, 19, 20, 21, 22],
						minStars: 7,
						multiple: { "houm": 1 },
					},
					{
						stypes: [17, 19, 20, 21, 22],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						stypes: [17, 19, 20, 21, 22],
						minStars: 9,
						multiple: { "houk": 1 },
					},
					{
						stypes: [17, 19, 20, 21, 22],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// 120mm Twin Gun Mount
			"147": {
				count: 0,
				byClass: {
					// Maestrale Class
					"61": {
						multiple: { "houg": 1, "houk": 1 },
					},
				},
			},
			// 120mm/50 Twin Gun Mount mod.1936
			"393": {
				count: 0,
				byClass: {
					// Maestrale Class
					"61": [
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						{
							multiple: { "houg": 1, "tyku": 1 },
						},
					],
				},
			},
			// 120mm/50 Twin Gun Mount Kai A.mod.1937
			"394": {
				count: 0,
				starsDist: [],
				byClass: {
					// Maestrale Class
					"61": [
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						{
							multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						},
						{
							minStars: 7,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 9,
							multiple: { "houm": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
				byShip: [
					{
						// extra +1 ev for Grecale all remodels
						origins: [614],
						multiple: { "houk": 1 },
					},
					{
						origins: [614],
						minStars: 7,
						multiple: { "houg": 1 },
					},
					{
						origins: [614],
						minStars: 10,
						multiple: { "houk": 1 },
					},
				],
			},
			// 130mm B-13 Twin Gun Mount
			"282": {
				count: 0,
				byNation: {
					"Russia": {
						multiple: { "houg": 2, "souk": 1 },
					},
				},
				byClass: {
					// Yuubari Class
					"34": {
						multiple: { "houg": 2, "souk": 1 },
					},
				},
				byShip: {
					// Hibiki K2 (Bep)
					ids: [147],
					multiple: { "houg": 2, "souk": 1 },
				},
			},
			// 12.7cm Twin Gun Mount Model A
			"297": {
				count: 0,
				byClass: {
					// Fubuki Class
					"12": {
						multiple: { "houk": 2 },
					},
					// Ayanami Class
					"1": {
						multiple: { "houk": 1 },
					},
					// Akatsuki Class
					"5": "1",
				},
			},
			// 12.7cm Twin Gun Mount Model A Kai Ni
			"294": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ayanami Class
					"1": {
						multiple: { "houg": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "raig": 1, "houk": 2 },
							},
							{
								flags: [ "tripleTorpedo" ],
								byCount: {
									gear: "tripleTorpedo",
									"1": { "houg": 1, "raig": 3 },
									"2": { "houg": 2, "raig": 5 },
									"3": { "houg": 2, "raig": 5 },
								},
							},
							{
								flags: [ "tripleTorpedoLateModel" ],
								single: { "raig": 1 },
							},
						],
					},
					// Akatsuki Class
					"5": "1",
					// Fubuki Class
					"12": "1",
				},
				byShip: [
					{
						// Miyuki K2
						ids: [959],
						multiple: { "houg": 1 },
					},
					{
						// Miyuki K2
						ids: [959],
						minCount: 2,
						single: { "houg": 2 },
					},
					{
						// Miyuki K2
						ids: [959],
						minCount: 3,
						single: { "houg": 3 },
					},
					{
						// Miyuki K2
						ids: [959],
						minStars: 6,
						multiple: { "houm": 4 },
					},
					{
						// Miyuki K2
						ids: [959],
						minStars: 7,
						multiple: { "houg": 6 },
					},
					{
						// Miyuki K2
						ids: [959],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						// Miyuki K2
						ids: [959],
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						// Miyuki K2
						ids: [959],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Prototype Long-barrel 12.7cm Twin Gun Mount Model A Kai 4
			"455": {
				count: 0,
				byClass: {
					// Ayanami Class
					"1": {
						multiple: { "houg": 2, "tyku": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "raig": 1, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 4 },
							},
							{
								flags: [ "tripleTorpedo" ],
								byCount: {
									gear: "tripleTorpedo",
									"1": { "houg": 1, "raig": 3 },
									"2": { "houg": 2, "raig": 5 },
									"3": { "houg": 2, "raig": 5 },
								},
							},
							{
								flags: [ "tripleTorpedoLateModel" ],
								single: { "raig": 1 },
							},
						],
					},
					// Akatsuki Class
					"5": "1",
					// Fubuki Class
					"12": {
						multiple: { "houg": 3, "tyku": 1 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "raig": 1, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "tyku": 4 },
							},
							{
								flags: [ "tripleTorpedo" ],
								byCount: {
									gear: "tripleTorpedo",
									"1": { "houg": 1, "raig": 3 },
									"2": { "houg": 2, "raig": 5 },
									"3": { "houg": 2, "raig": 5 },
								},
							},
							{
								flags: [ "tripleTorpedoLateModel" ],
								single: { "raig": 1 },
							},
						],
					},
				},
				byShip: [
					{
						// All remodels of Uranami
						origins: [486],
						multiple: { "houg": 1 },
					},
					{
						// Uranami K2
						ids: [647],
						multiple: { "houg": 1, "raig": 1, "tais": 1, "houk": 1 },
					},
					{
						// Isonami K2
						ids: [666],
						multiple: { "houg": 1, "tais": 1 },
					},
					{
						// Miyuki K2
						ids: [959],
						multiple: { "houg": 2 },
					},
					{
						// Miyuki K2
						ids: [959],
						minCount: 2,
						single: { "houg": 2 },
					},
					{
						// Miyuki K2
						ids: [959],
						minCount: 3,
						single: { "houg": 3 },
					},
				],
			},
			// 12.7cm Twin Gun Mount Model B Kai Ni
			"63": {
				count: 0,
				byClass: {
					// Ayanami Class
					"1": {
						multiple: { "tyku": 1 },
					},
					// Akatsuki Class
					"5": "1",
					// Hatsuharu Class
					"10": "1",
				},
				byShip: [
					{
						// All remodels of Yuudachi
						origins: [45],
						multiple: { "houg": 1, "tyku": 1, "houk": 2 },
					},
					{
						// Yuudachi K2
						ids: [144],
						multiple: { "raig": 1 },
					},
					{
						// Shigure K2+, Shikinami K2
						ids: [145, 961, 627],
						multiple: { "houg": 1 },
					},
					{
						// Shiratsuyu Kai+, Murasame Kai+, Harusame K2
						ids: [242, 497, 244, 498, 975],
						multiple: { "houk": 1 },
					},
					{
						// Kawakaze K2
						ids: [469],
						multiple: { "houk": 2 },
					},
					{
						// Amagiri K2/K2D
						ids: [903, 908],
						multiple: { "houg": 2 },
					},
				],
			},
			// 12.7cm Twin Gun Mount Model C Kai Ni
			"266": {
				count: 0,
				byClass: {
					// Asashio Class
					"18": {
						multiple: { "houg": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "raig": 3, "houk": 1 },
						},
					},
					// Shiratsuyu Class
					"23": "18",
					// Kagerou Class
					"30": [
						{
							multiple: { "houg": 1 },
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "raig": 3, "houk": 1 },
							},
						},
						{
							// Kagerou Class K2
							remodel: 2,
							excludes: [556, 557, 558, 559, 648, 651],
							single: { "houg": 1 },
						},
						{
							// Kagerou Class K2
							remodel: 2,
							excludes: [556, 557, 558, 559, 648, 651],
							single: { "houg": 2 },
							minCount: 2,
						},
					],
				},
				byShip: [
					{
						// Yukikaze, Shigure, Isokaze, extra +1 ev
						origins: [20, 43, 167],
						multiple: { "houk": 1 },
					},
					{
						// Shigure K3
						ids: [961],
						multiple: { "houg": 1, "houk": 1, "houm": 1 },
					},
				],
			},
			// 12.7cm Twin Gun Mount Model C Kai 3
			"470": {
				count: 0,
				starsDist: [],
				byClass: {
					// Asashio Class
					"18": {
						multiple: { "houg": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "raig": 3, "houk": 1, "houm": 1 },
						},
					},
					// Shiratsuyu Class
					"23": "18",
					// Kagerou Class
					"30": {
						multiple: { "houg": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "raig": 3, "houk": 1, "houm": 3 },
						},
					},
				},
				byShip: [
					{
						// Yukikaze, Shigure, Isokaze, extra +2 ev
						origins: [20, 43, 167],
						multiple: { "houk": 2 },
					},
					{
						// Shigure K3
						ids: [961],
						multiple: { "houg": 3, "houk": 2, "houm": 3 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						distinctGears: [470, 529],
						single: { "houg": 1, "houm": 2 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						distinctGears: [470, 529],
						minCount: 2,
						single: { "houg": 2 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						minStars: 5,
						multiple: { "houm": 1 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// 12.7cm Twin Gun Mount Model C Kai 3 H
			"529": {
				count: 0,
				starsDist: [],
				byClass: {
					// Asashio Class
					"18": {
						multiple: { "houg": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "raig": 3, "houk": 1, "houm": 1 },
						},
					},
					// Shiratsuyu Class
					"23": "18",
					// Kagerou Class
					"30": {
						multiple: { "houg": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 2, "raig": 3, "houk": 1, "houm": 3 },
						},
					},
				},
				byShip: [
					{
						// Yukikaze, Shigure, Isokaze, extra +2 ev
						origins: [20, 43, 167],
						multiple: { "houk": 2 },
					},
					{
						// Yuudachi K2, Shigure K2, Samidare K, Harusame, Shiratsuyu K2
						ids: [144, 145, 246, 405, 497],
						multiple: { "houg": 1, "tyku": 1, "houk": 1, "houm": 1 },
					},
					{
						// Yuudachi K2, Shigure K2, Samidare K, Harusame, Shiratsuyu K2
						ids: [144, 145, 246, 405, 497],
						minCount: 2,
						single: { "houg": 1 },
					},
					{
						// Yuudachi K2, Shigure K2, Samidare K, Harusame, Shiratsuyu K2
						ids: [144, 145, 246, 405, 497],
						minCount: 3,
						single: { "houg": 2 },
					},
					{
						// Yuudachi K2, Shigure K2, Samidare K, Harusame, Shiratsuyu K2
						ids: [144, 145, 246, 405, 497],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						// Yuudachi K2, Shigure K2, Samidare K, Harusame, Shiratsuyu K2
						ids: [144, 145, 246, 405, 497],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Harusame K, Murasame K2, Shigure K3
						ids: [323, 498, 961],
						multiple: { "houg": 2, "tyku": 2, "houk": 1, "houm": 1 },
					},
					{
						// Harusame K, Murasame K2, Shigure K3
						ids: [323, 498, 961],
						minCount: 2,
						single: { "houg": 2 },
					},
					{
						// Harusame K, Murasame K2, Shigure K3
						ids: [323, 498, 961],
						minCount: 3,
						single: { "houg": 2 },
					},
					{
						// Harusame K, Murasame K2, Shigure K3
						ids: [323, 498, 961],
						minStars: 6,
						multiple: { "tyku": 1 },
					},
					{
						// Harusame K, Murasame K2, Shigure K3
						ids: [323, 498, 961],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						// Harusame K, Murasame K2, Shigure K3
						ids: [323, 498, 961],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Harusame K3
						ids: [975],
						multiple: { "houg": 3, "tyku": 3, "houk": 2, "houm": 2 },
					},
					{
						// Harusame K3
						ids: [975],
						minCount: 2,
						single: { "houg": 3 },
					},
					{
						// Harusame K3
						ids: [975],
						minCount: 3,
						single: { "houg": 3 },
					},
					{
						// Harusame K3
						ids: [975],
						minStars: 4,
						multiple: { "tyku": 1 },
					},
					{
						// Harusame K3
						ids: [975],
						minStars: 6,
						multiple: { "houg": 1 },
					},
					{
						// Harusame K3
						ids: [975],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						// Harusame K3
						ids: [975],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Shigure K3
						ids: [961],
						multiple: { "houg": 3, "houk": 2, "houm": 3 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						distinctGears: [470, 529],
						single: { "houg": 1, "houm": 2 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						distinctGears: [470, 529],
						minCount: 2,
						single: { "houg": 2 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						minStars: 5,
						multiple: { "houm": 1 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						// Kagerou Class K2, Tan Yang, Shigure K2+, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 651, 145, 961, 951],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					// For all ships can equip it
					{
						minCount: 1,
						// Empty bonus stats to avoid error for library display
						single: {},
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 2, "houk": 2 },
						},
					},
					{
						minCount: 2,
						single: {},
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 2 },
						},
					},
					{
						minCount: 3,
						single: {},
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 2 },
						},
					},
				],
			},
			// 12.7cm Twin Gun Mount Model D Kai Ni
			// https://wikiwiki.jp/kancolle/12.7cm%E9%80%A3%E8%A3%85%E7%A0%B2D%E5%9E%8B%E6%94%B9%E4%BA%8C
			"267": {
				count: 0,
				starsDist: [],
				byClass: {
					// Shimakaze Class
					"22": [
						{
							multiple: { "houg": 2, "houk": 1 },
						},
						{
							// Shimakaze Kai, total +3 fp, +3 tp, +3 ev
							remodel: 1,
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "raig": 3, "houk": 2 },
							},
						},
					],
					// Kagerou Class
					"30": {
						multiple: { "houg": 1, "houk": 1 },
					},
					// Yuugumo Class
					"38": [
						{
							multiple: { "houg": 2, "houk": 1 },
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "raig": 3, "houk": 1 },
							},
						},
						{
							// Yuugumo Class K2
							remodel: 2,
							multiple: { "houg": 1 },
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "raig": 3, "houk": 2 },
							},
						},
					],
				},
				byShip: [
					{
						// Kagerou K2, Shiranui K2, Kuroshio K2, Yukikaze K2, Oyashio K2, Hayashio K2, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 951],
						single: { "houg": 1 },
					},
					{
						// Akigumo Kai Ni, Shigure K3
						ids: [648, 961],
						multiple: { "houg": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "raig": 6, "houk": 3 },
							},
							{
								flags: [ "skilledLookouts" ],
								single: { "houg": 2, "tyku": 2, "houk": 3 },
							},
							{
								flags: [ "searchlightSmall" ],
								single: { "houg": 3, "houk": -3 },
							},
						],
					},
					{
						// Takanami K2
						ids: [649],
						multiple: { "houg": 1 },
					},
					{
						// Kiyoshimo K2, Hayashimo K2
						ids: [955, 956],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "raig": -1 },
						},
					},
					{
						// Kiyoshimo K2D
						ids: [960],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "raig": -2 },
						},
					},
				]
			},
			// 12.7cm Twin Gun Mount Model D Kai 3
			"366": {
				count: 0,
				starsDist: [],
				byClass: {
					// Shimakaze Class
					"22": [
						{
							multiple: { "houg": 2, "houk": 1 },
						},
						{
							minStars: 5,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
						{
							// Shimakaze Kai
							remodel: 1,
							synergy: [
								{
									flags: [ "surfaceRadar" ],
									single: { "houg": 2, "raig": 4, "houk": 2, "houm": 2 },
								},
								{
									flags: [ "airRadar" ],
									single: { "houg": 1, "tyku": 5, "houk": 3, "houm": 1 },
								},
							],
						},
						{
							// Shimakaze Kai, one-time +3 AA, since 2022-07-13, +1 fp, +1 acc
							remodel: 1,
							single: { "houg": 1, "tyku": 3, "houm": 1 },
						},
						{
							// Shimakaze Kai, one-time +5 AA for 2 guns, since 2022-07-13, +3 fp, +1 acc
							remodel: 1,
							single: { "houg": 2, "tyku": 2 },
							minCount: 2,
						},
					],
					// Kagerou Class
					"30": [
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						{
							minStars: 5,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
					// Yuugumo Class
					"38": [
						{
							multiple: { "houg": 2, "houk": 1 },
						},
						{
							minStars: 5,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
						{
							// Yuugumo Class K2
							remodel: 2,
							multiple: { "houg": 1 },
							synergy: [
								{
									flags: [ "surfaceRadar" ],
									single: { "houg": 2, "raig": 4, "houk": 2, "houm": 2 },
								},
								{
									flags: [ "airRadar" ],
									single: { "houg": 1, "tyku": 5, "houk": 3, "houm": 1 },
								},
							],
						},
						{
							// Yuugumo Class K2
							remodel: 2,
							single: { "houg": 1, "tyku": 3, "houm": 1 },
						},
						{
							// Yuugumo Class K2, 2 more guns
							remodel: 2,
							single: { "houg": 2, "tyku": 2 },
							minCount: 2,
						},
					],
				},
				byShip: [
					{
						// Kagerou K2, Shiranui K2, Kuroshio K2, Yukikaze K2, Oyashio K2, Hayashio K2, Amatsukaze K2
						ids: [566, 567, 568, 656, 670, 915, 951],
						multiple: { "houg": 1, "tyku": 2 },
						countCap: 2,
					},
					{
						// Okinami Kai Ni, Akigumo Kai Ni
						ids: [569, 648],
						single: { "houg": 1, "tyku": 2 },
					},
					{
						// Akigumo Kai Ni, one-time +3 AA
						ids: [648],
						single: { "houg": 1, "tyku": 3, "houm": 1 },
					},
					{
						// Akigumo Kai Ni, one-time +5 AA for 2 guns
						ids: [648],
						single: { "houg": 2, "tyku": 2 },
						minCount: 2,
					},
					{
						// Akigumo Kai Ni
						ids: [648],
						multiple: { "houg": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "raig": 4, "houk": 2, "houm": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "houg": 1, "tyku": 5, "houk": 3, "houm": 1 },
							},
							{
								flags: [ "twin127SmallGunMountModelDK2Nonexist", "skilledLookouts" ],
								single: { "houg": 2, "tyku": 2, "houk": 3 },
							},
							{
								flags: [ "twin127SmallGunMountModelDK2Nonexist", "searchlightSmall" ],
								single: { "houg": 3, "houk": -3 },
							},
						],
					},
					{
						// Takanami K2
						ids: [649],
						multiple: { "houg": 1 },
					},
					{
						// Kiyoshimo K2
						ids: [650],
						single: { "houg": 1 },
						minCount: 2,
					},
					{
						// Kiyoshimo K2D
						ids: [960],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "raig": -1  },
						},
					},
				],
			},
			// 12.7cm Twin Gun Mount Model A Kai 3 + AAFD
			"295": {
				count: 0,
				byClass: {
					// Ayanami Class
					"1": {
						multiple: { "houg": 2, "tyku": 2 },
						synergy: [
							{
								flags: [ "airRadar" ],
								single: { "tyku": 6 },
							},
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 3, "raig": 1, "houk": 2 },
							},
							{
								flags: [ "tripleTorpedo" ],
								byCount: {
									gear: "tripleTorpedo",
									"1": { "houg": 1, "raig": 3 },
									"2": { "houg": 2, "raig": 5 },
									"3": { "houg": 2, "raig": 5 },
								},
							},
							{
								flags: [ "tripleTorpedoLateModel" ],
								single: { "raig": 1 },
							},
						],
					},
					// Akatsuki Class
					"5": "1",
					// Fubuki Class
					"12": "1",
				},
				byShip: [
					{
						// Isonami K2
						ids: [666],
						multiple: { "houg": 1, "tyku": 1, "tais": 1 },
					},
					{
						// Miyuki K2
						ids: [959],
						multiple: { "houg": 2 },
					},
					{
						// Miyuki K2
						ids: [959],
						minCount: 2,
						single: { "houg": 2 },
					},
					{
						// Miyuki K2
						ids: [959],
						minCount: 3,
						single: { "houg": 3 },
					},
				],
			},
			// 12.7cm Twin Gun Mount Model B Kai 4 + AAFD
			"296": {
				count: 0,
				byClass: {
					// Ayanami Class
					"1": {
						multiple: { "houg": 1 },
						synergy: [
							{
								flags: [ "airRadar" ],
								single: { "tyku": 5 },
							},
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "raig": 2, "houk": 2 },
							},
							{
								flags: [ "tripleTorpedoOxygenLateModel" ],
								single: { "houg": 1, "raig": 3 },
							},
						],
					},
					// Akatsuki Class
					"5": "1",
					// Shiratsuyu Class
					"23": {
						multiple: { "houg": 1, "houk": 1 },
						synergy: [
							{
								flags: [ "airRadar" ],
								single: { "tyku": 6 },
							},
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "raig": 3, "houk": 2 },
							},
							{
								flags: [ "quadrupleTorpedoOxygenLateModel" ],
								single: { "houg": 1, "raig": 3 },
							},
						],
					},
					// Hatsuharu Class
					"10": {
						multiple: { "houg": 1, "houk": 1 },
						synergy: [
							{
								flags: [ "airRadar" ],
								single: { "tyku": 5 },
							},
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "raig": 2, "houk": 2 },
							},
							{
								flags: [ "tripleTorpedoOxygenLateModel" ],
								single: { "houg": 1, "raig": 3 },
							},
						],
					},
				},
				byShip: [
					{
						// Shiratsuyu K2
						ids: [497],
						multiple: { "houg": 1, "houk": 1 },
					},
					{
						// Yuudachi K2
						ids: [144],
						multiple: { "houg": 1, "raig": 1 },
					},
					{
						// Shigure K2+
						ids: [145, 961],
						multiple: { "houg": 1, "tyku": 1 },
					},
					{
						// Murasame K2, Harusame K2
						ids: [498, 975],
						multiple: { "tyku": 1, "houk": 1 },
					},
					{
						// Kawakaze/Umikaze K2, Shiratsuyu/Murasame Kai, Yamakaze K2+
						ids: [469, 587, 242, 244, 588, 667],
						multiple: { "houk": 1 },
					},
					{
						// Shikinami K2
						ids: [627],
						multiple: { "houg": 2, "raig": 1 },
					},
					{
						// Amagiri K2/K2D
						ids: [903, 908],
						multiple: { "houg": 3 },
					},
				],
			},
			// 5inch Single Gun Mount Mk.30 Kai
			"313": {
				count: 0,
				byClass: {
					// John C. Butler Class
					"87": {
						multiple: { "houg": 2, "tyku": 2, "souk": 1, "houk": 1 },
					},
					// Fletcher Class
					"91": "87",
				},
				byShip: {
					// Tan Yang/Yukikaze K2
					ids: [651, 656],
					multiple: { "houg": 2, "tyku": 2, "souk": 1, "houk": 1 },
				},
			},
			// 5inch Single Gun Mount Mk.30 Kai + GFCS Mk.37
			"308": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				},
				byShip: [
					{
						// All DE
						stypes: [1],
						multiple: { "tyku": 1, "houk": 1 },
					},
					{
						// All DD
						stypes: [2],
						multiple: { "houg": 1 },
					},
					{
						// Tan Yang/Yukikaze K2
						ids: [651, 656],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				],
			},
			// 8cm High-angle Gun
			"66": {
				count: 0,
				byShip: [
					{
						// Fixed since 2025-01-28: typo bug found in client which ids are changed to all mogami k2+
						// Noshiro K2, Yahagi K2+
						ids: [662, 663, 668],
						multiple: { "tyku": 2, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 1, "houk": 2 },
						},
					},
					{
						// Mogami K2+, Mikuma K2+
						ids: [501, 506, 502, 507],
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 1, "houk": 2 },
						},
					},
				],
			},
			// 8cm High-angle Gun Kai + Extra Machine Guns
			"220": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Noshiro K2, Yahagi K2+, Mogami K2+, Mikuma K2+
						ids: [662, 663, 668, 501, 506, 502, 507],
						multiple: { "houg": 1, "tyku": 3, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 3, "houk": 3 },
						},
					},
					{
						// Noshiro K2, Yahagi K2+ from [66] 8cm base
						ids: [662, 663, 668],
						multiple: { "tyku": 2, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 1, "houk": 2 },
						},
					},
					{
						// Mogami K2+, Mikuma K2+ from [66] 8cm base
						ids: [501, 506, 502, 507],
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 1, "houk": 2 },
						},
					},
					{
						// Houshou K2+
						ids: [894, 899],
						multiple: { "tyku": 2, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 3, "houk": 3 },
						},
					},
					{
						// Houshou K2+
						ids: [894, 899],
						minStars: 10,
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				],
			},
			// 10cm Twin High-angle Gun Mount Kai + Additional Machine Guns
			"275": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Houshou K2+
						ids: [894, 899],
						multiple: { "houg": 1, "tyku": 3, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 3, "houk": 3 },
						},
					},
					{
						// Houshou K2+
						ids: [894, 899],
						minStars: 7,
						multiple: { "tyku": 1, "houk": 1 },
					},
					{
						// Houshou K2+
						ids: [894, 899],
						minStars: 10,
						multiple: { "houg": 1, "tyku": 1, "houm": 1 },
					},
				],
			},
			// 12.7cm High-angle Gun Mount + Anti-Aircraft Fire Director
			"130": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Maya Kai Ni
						ids: [428],
						minStars: 1,
						multiple: { "tyku": 1 },
					},
					{
						ids: [428],
						minStars: 3,
						multiple: { "houk": 1 },
					},
					{
						ids: [428],
						minStars: 5,
						multiple: { "houm": 1 },
					},
					{
						ids: [428],
						minStars: 7,
						multiple: { "tyku": 1 },
					},
					{
						ids: [428],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						ids: [428],
						minStars: 9,
						multiple: { "tyku": 1 },
					},
					{
						ids: [428],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Isuzu Kai Ni
						ids: [141],
						minStars: 2,
						multiple: { "tyku": 1 },
					},
					{
						ids: [141],
						minStars: 4,
						multiple: { "houk": 1 },
					},
					{
						ids: [141],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						ids: [141],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						ids: [141],
						minStars: 10,
						multiple: { "houk": 1 },
					},
					{
						// All DE
						stypes: [1],
						minStars: 3,
						multiple: { "tyku": 1 },
					},
					{
						stypes: [1],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						stypes: [1],
						minStars: 9,
						multiple: { "tyku": 1 },
					},
					{
						stypes: [1],
						minStars: 10,
						multiple: { "houk": 1 },
					},
				],
			},
			// Type 21 Air Radar
			"30": {
				count: 0,
				byClass: {
					// Akizuki Class
					"54": {
						distinctGears: [30, 410],
						single: { "tyku": 3, "houk": 2, "saku": 2 },
					},
				},
				byShip: {
					// Mogami Kai+, Mikuma K2+
					ids: [73, 501, 506, 502, 507],
					distinctGears: [30, 410],
					single: { "tyku": 3, "houk": 2, "saku": 2 },
				},
			},
			// Type 21 Air Radar Kai Ni
			"410": {
				count: 0,
				starsDist: [],
				byClass: {
					// Akizuki Class
					"54": [
						{
							distinctGears: [30, 410],
							single: { "tyku": 3, "houk": 2, "saku": 2 },
						},
						{
							single: { "houg": 1, "souk": 1, "tyku": 2, "houk": 2 },
						},
					],
				},
				byShip: [
					{
						// Mogami Kai+, Mikuma K2+
						ids: [73, 501, 506, 502, 507],
						distinctGears: [30, 410],
						single: { "tyku": 3, "houk": 2, "saku": 2 },
					},
					{
						// Mogami Kai+
						ids: [73, 501, 506],
						single: { "houg": 1, "souk": 1, "tyku": 2, "houk": 2 },
					},
					{
						// Hatsuzuki Kai Ni
						ids: [968],
						single: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				],
			},
			// Type 42 Air Radar Kai Ni
			"411": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All DD
						stypes: [2],
						multiple: { "houk": -9 },
					},
					{
						// All CL/CLT
						stypes: [3, 4],
						multiple: { "houk": -7 },
					},
					{
						// All CT
						stypes: [21],
						multiple: { "houk": -6 },
					},
					{
						// All CA/CAV
						stypes: [5, 6],
						multiple: { "houk": -5 },
					},
					{
						// stars >= +4 on members below
						ids: [151, 593, 954, 411, 412, 541, 573, 553, 554],
						minStars: 4,
						single: { "houg": 1, "tyku": 1 },
					},
					{
						ids: [151, 593, 954, 411, 412, 541, 573, 553, 554],
						minStars: 10,
						single: { "houg": 1, "tyku": 1 },
					},
					{
						// Haurna K2B
						ids: [593],
						single: { "houg": 1, "tyku": 2, "houk": 3 },
					},
					{
						// Haurna K2+, Fusou K2, Yamashiro K2
						ids: [151, 593, 954, 411, 412],
						single: { "houg": 3, "tyku": 4 },
					},
					{
						// Kirishima K2C
						ids: [694],
						single: { "houg": 4, "tyku": 2 },
					},
					{
						// Nagato K2, Mutsu K2, Ise K2, Hyuuga K2
						ids: [541, 573, 553, 554],
						single: { "houg": 2, "tyku": 2 },
					},
				],
			},
			// FuMO25 Radar
			"124": {
				count: 0,
				starsDist: [],
				byNation: {
					"Germany": [
						{
							minStars: 7,
							multiple: { "houm": 1 },
						},
						{
							minStars: 8,
							multiple: { "houg": 1 },
						},
						{
							minStars: 9,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
					"Italy": [
						{
							minStars: 8,
							multiple: { "houm": 1 },
						},
						{
							minStars: 9,
							multiple: { "tyku": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// GFCS Mk.37
			"307": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
				},
			},
			// SG Radar (Initial Model)
			"315": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "houg": 2, "houk": 3, "saku": 4 },
					},
				},
				byClass: {
					// John C. Butler Class, range from medium to long
					"87": [
						{
							multiple: { "houg": 1 },
						},
						{
							single: { "leng": 1 },
						},
					],
					// Fletcher Class
					"91": "87",
				},
				byShip: {
					// Tan Yang/Yukikaze K2
					ids: [651, 656],
					single: { "houg": 2, "houk": 2, "saku": 3, "leng": 1 },
				},
			},
			// SG Radar (Late Model)
			"456": {
				count: 0,
				byNation: {
					"UnitedStates": [
						{
							multiple: { "houg": 3, "houk": 4, "saku": 4 },
						},
						{
							single: { "houm": 3 },
						},
					],
					"UnitedKingdom": [
						{
							multiple: { "houg": 2, "houk": 2, "saku": 2 },
						},
						{
							single: { "houm": 2 },
						},
					],
					"Australia": "UnitedKingdom",
				},
				byClass: {
					// John C. Butler Class, range from medium to long
					"87": [
						{
							multiple: { "houg": 1 },
						},
						{
							single: { "leng": 1 },
						},
					],
					// Fletcher Class
					"91": "87",
				},
				byShip: {
					// Tan Yang/Yukikaze K2
					ids: [651, 656],
					single: { "houg": 2, "houk": 2, "saku": 3, "houm": 2, "leng": 1 },
				},
			},
			// Type 13 Air Radar Kai
			"106": {
				count: 0,
				byShip: [
					{
						// Ushio K2, Shigure K2+, Hatsushimo K2,   Haruna K2, Nagato K2, Yamato K2+, Haruna K2B+, Harusame K2
						ids: [407,   145, 961,    419,             151,       541,       911, 916,   593, 954,    975],
						multiple: { "houg": 1, "tyku": 2, "houk": 3, "souk": 1 },
					},
					{
						// All remodels of: Isokaze, Hamakaze, Asashimo, Kasumi, Yukikaze, Suzutsuki, Yahagi
						origins: [167, 170, 425, 49, 20, 532, 139],
						multiple: { "tyku": 2, "houk": 2, "souk": 1 },
					},
					{
						// All remodels of: Hibiki, Ooyodo, Kashima
						origins: [35, 183, 465],
						multiple: { "tyku": 1, "houk": 3, "souk": 1 },
					},
					{
						// Yahagi K2+
						ids: [663, 668],
						// can't stack when equip both Kai and Late Model
						distinctGears: [106, 450],
						single: { "houg": 1, "tyku": 1, "houk": 1, "souk": 1 },
					},
					{
						// Yahagi K2B
						ids: [668],
						distinctGears: [106, 450],
						single: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Type 13 Air Radar Kai Late Model
			"450": {
				count: 0,
				starsDist: [],
				byClass: {
					// Matsu Class
					"101": {
						multiple: { "houg": 1, "tyku": 2, "houk": 3, "souk": 1 },
					},
				},
				byShip: [
					{
						// All DE
						stypes: [1],
						multiple: { "tyku": 1, "houk": 2, "souk": 1 },
					},
					// Includes all bonuses from T13 Kai either:
					{
						// Ushio K2, Shigure K2, Hatsushimo K2,   Haruna K2, Nagato K2
						ids: [407,   145,        419,             151,       541],
						multiple: { "houg": 1, "tyku": 2, "houk": 3, "souk": 1 },
					},
					{
						// All remodels of: Isokaze, Hamakaze, Asashimo, Kasumi, Yukikaze, Suzutsuki, Yahagi
						origins: [167, 170, 425, 49, 20, 532, 139],
						multiple: { "tyku": 2, "houk": 2, "souk": 1 },
					},
					{
						// All remodels of: Hibiki, Ooyodo, Kashima
						origins: [35, 183, 465],
						multiple: { "tyku": 1, "houk": 3, "souk": 1 },
					},
					{
						// Yahagi K2+
						ids: [663, 668],
						// can't stack when equip both Kai and Late Model
						distinctGears: [106, 450],
						single: { "houg": 1, "tyku": 1, "houk": 1, "souk": 1 },
					},
					{
						// Yahagi K2B
						ids: [668],
						distinctGears: [106, 450],
						single: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// Type 22 Surface Radar
			"28": {
				count: 0,
				starsDist: [],
				byShip: [
					// Murasame, Minegumo
					{
						origins: [44, 583],
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						origins: [44, 583],
						minStars: 9,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Type 22 Surface Radar Kai 4
			"88": {
				count: 0,
				starsDist: [],
				byShip: [
					// Murasame, Minegumo
					{
						origins: [44, 583],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 9,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Type 22 Surface Radar Kai 4 (Calibrated Late Model)
			"240": {
				count: 0,
				starsDist: [],
				byShip: [
					// Murasame, Minegumo
					{
						origins: [44, 583],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 9,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Radar Equipment Mast (Type 13 Kai + Type 22 Radar Kai 4)
			"506": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// Shigure K3
						ids: [961],
						single: { "houg": 2, "tyku": 2, "houk": 4, "houm": 3 },
					},
					{
						// Shigure K2, Shiratsuyu K2, Yukikaze K2, Isokaze B Kai, Hamakaze B Kai, Amatsukaze K2, Harusame K2
						ids: [145, 497, 656, 557, 558, 951, 975],
						single: { "houg": 1, "tyku": 1, "houk": 3, "houm": 2 },
					},
					{
						// Asashimo K2, Hatsushimo K2, Kasumi K2/K2B, Ushio K2, Hibiki Kai+, Fuyutsuki Kai, Suzutsuki Kai, Kiyoshimo K2/K2D
						ids: [578, 419, 464, 470, 407, 235, 147, 538, 537, 955, 960],
						single: { "houg": 1, "tyku": 1, "houk": 2, "houm": 1 },
					},
					{
						// Murasame, Minegumo
						origins: [44, 583],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 9,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// Passive Radiolocator (E27) + Type 22 Surface Radar Kai 4 (Calibrated Late Model)
			"517": {
				count: 0,
				starsDist: [],
				byClass: {
					// Class group "JDD": [66,28,12,1,5,10,23,18,30,38,22,54,101]
					// Yuugumo Class 38 see below
					"1": {
						single: { "houk": 1, "houm": 1, "saku": 1 },
					},
					"5": "1",
					"10": "1",
					"12": "1",
					"18": "1",
					"22": "1",
					"23": "1",
					"28": "1",
					"30": "1",
					"54": "1",
					"66": "1",
					"101": "1",
					// Shimushu Class
					"74": "1",
					// Etorofu Class
					"77": "1",
					// Hiburi Class
					"85": "1",
					// Type D CD Class
					"104": "1",
					// Ukuru Class
					"117": "1",
					// Yuugumo Class
					"38": {
						single: { "houg": 1, "houk": 1, "houm": 2, "saku": 1 },
						synergy: [
							{
								flags: [ "twin127SmallGunMountModelDK2" ],
								byStars: {
									gearId: 267,
									"3": { "houg": 1, "houm": 1 },
								},
							},
							{
								flags: [ "twin127SmallGunMountModelDK3", "twin127SmallGunMountModelDK2Nonexist" ],
								byStars: {
									gearId: 366,
									"3": { "houg": 1, "houm": 1 },
								},
							},
						],
					},
				},
				byShip: [
					{
						// Kiyoshimo K2D
						ids: [960],
						single: { "houg": 2, "houk": 3, "houm": 1, "saku": 2 },
					},
					{
						// Hibiki/Kai, Ushio K2, Hatsushimo K2, Kasumi K2/K2B, Yukikaze K2, Shigure K3, Asashimo K2, Kiyoshimo K2, Harusame K2
						ids: [147, 235, 407, 419, 464, 470, 656, 961, 578, 955, 975],
						single: { "houg": 1, "houk": 2, "houm": 1, "saku": 1 },
					},
					{
						// Fujinami K2, Hamanami K2
						ids: [981, 983],
						single: { "houg": 1, "houk": 1, "houm": 1 },
					},
					{
						minStars: 7,
						single: { "houm": 1 },
					},
					{
						minStars: 8,
						single: { "houk": 1 },
					},
					{
						minStars: 9,
						single: { "houg": 1 },
					},
					{
						minStars: 10,
						single: { "houm": 1 },
					},
					{
						// All ships can equip this radar synergy with guns/radar +stars
						synergy: [
							{
								flags: [ "twin127SmallGunMountModelDK2" ],
								byStars: {
									gearId: 267,
									"3": { "houg": 1, "houm": 1 },
								},
							},
							{
								flags: [ "twin127SmallGunMountModelDK3", "twin127SmallGunMountModelDK2Nonexist" ],
								byStars: {
									gearId: 366,
									"3": { "houg": 1, "houm": 1 },
								},
							},
							{
								flags: [ "type13AirRadarKaiLateModel" ],
								byStars: {
									gearId: 450,
									"4": { "houg": 1, "tyku": 4, "houk": 3, "houm": 1 },
								},
							},
						],
					},
					{
						// Murasame, Minegumo
						origins: [44, 583],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 9,
						multiple: { "houk": 1 },
					},
					{
						origins: [44, 583],
						minStars: 10,
						multiple: { "houg": 1 },
					},
				],
			},
			// 25mm Twin Autocannon Mount
			"39": {
				count: 0,
				starsDist: [],
				byClass: {
					// Katori Class
					"56": {
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 2, "houk": 2 },
						},
					},
				},
				byShip: [
					{
						// Noshiro Kai Ni, Yahagi Kai Ni
						ids: [662, 663],
						multiple: { "tyku": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni B
						ids: [668],
						multiple: { "tyku": 3, "houk": 2 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						multiple: { "tyku": 2, "houk": 3 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 9,
						multiple: { "tyku": 2 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Shirayuki K2, Hatsuyuki K2, from getSlot25mmMachinegunLightShipEffect
						ids: [986, 987],
						multiple: { "tyku": 1, "houk": 1 },
						synergy: {
							flags: [ "twin10cmKaiHighAngleGunMount" ],
							distinct: { "tyku": 1, "houm": 1 },
						},
					},
					{
						ids: [986],
						minStars: 7,
						multiple: { "houg": 1 },
					},
					{
						ids: [986],
						minStars: 8,
						multiple: { "tyku": 1 },
					},
					{
						ids: [986],
						minStars: 9,
						multiple: { "houk": 1 },
					},
					{
						ids: [986],
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// 25mm Triple Autocannon Mount
			"40": {
				count: 0,
				starsDist: [],
				byClass: {
					// Katori Class
					"56": {
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 2, "houk": 2 },
						},
					},
				},
				byShip: [
					{
						// Noshiro Kai Ni, Yahagi Kai Ni
						ids: [662, 663],
						multiple: { "tyku": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni B
						ids: [668],
						multiple: { "tyku": 3, "houk": 2 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						multiple: { "tyku": 2, "houk": 3 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 9,
						multiple: { "tyku": 2 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Shirayuki K2, Hatsuyuki K2, from getSlot25mmMachinegunLightShipEffect
						ids: [986, 987],
						multiple: { "tyku": 1, "houk": 1 },
						synergy: {
							flags: [ "twin10cmKaiHighAngleGunMount" ],
							distinct: { "tyku": 1, "houm": 1 },
						},
					},
				],
			},
			// 25mm Single Autocannon Mount
			"49": {
				count: 0,
				starsDist: [],
				byClass: {
					// Katori Class
					"56": {
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 2, "houk": 2 },
						},
					},
				},
				byShip: [
					{
						// Noshiro Kai Ni, Yahagi Kai Ni
						ids: [662, 663],
						multiple: { "tyku": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni B
						ids: [668],
						multiple: { "tyku": 3, "houk": 2 },
					},
					{
						// Inagi Kai Ni, extra +2 ev
						ids: [979],
						multiple: { "tyku": 2, "houk": 5 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 7,
						multiple: { "tyku": 1 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 9,
						multiple: { "tyku": 1 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 10,
						multiple: { "houg": 1 },
					},
					{
						// Shirayuki K2, Hatsuyuki K2, from getSlot25mmMachinegunLightShipEffect
						ids: [986, 987],
						multiple: { "tyku": 1, "houk": 1 },
						synergy: {
							flags: [ "twin10cmKaiHighAngleGunMount" ],
							distinct: { "tyku": 1, "houm": 1 },
						},
					},
				],
			},
			// 2cm Flakvierling 38
			"84": {
				count: 0,
				starsDist: [],
				byNation: {
					"Italy": [
						{
							minStars: 4,
							multiple: { "tyku": 1, "houk": 1 },
						},
						{
							minStars: 10,
							single: { "houg": 1 },
						},
					],
					"Germany": "Italy",
				},
				byShip: [
					{
						// All ships can equip this gun stars+4
						minStars: 4,
						multiple: { "tyku": 1, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 1 },
						},
					},
					{
						// All ships can equip this gun stars+7
						minStars: 7,
						multiple: { "houg": 1, "tyku": 1 },
					},
					{
						// All ships can equip this gun stars+10
						minStars: 10,
						multiple: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// 3.7cm FlaK M42
			"85": {
				count: 0,
				starsDist: [],
				byNation: {
					"Italy": [
						{
							minStars: 8,
							multiple: { "tyku": 1, "houk": 1 },
						},
						{
							minStars: 10,
							multiple: { "houg": 1 },
						},
					],
					"Germany": "Italy",
				},
				byShip: [
					{
						minStars: 6,
						multiple: { "tyku": 1, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 2 },
						},
					},
					{
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						minStars: 10,
						multiple: { "houk": 1, "houm": 1 },
					},
				],
			},
			// 25mm Triple Autocannon Mount (Concentrated Deployment)
			"131": {
				count: 0,
				starsDist: [],
				byClass: {
					// Katori Class
					"56": {
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 2, "houk": 2 },
						},
					},
				},
				byShip: [
					{
						// Noshiro Kai Ni, Yahagi Kai Ni
						ids: [662, 663],
						multiple: { "tyku": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni B
						ids: [668],
						multiple: { "tyku": 3, "houk": 2 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						multiple: { "tyku": 2, "houk": 3 },
					},
					{
						// Inagi Kai Ni
						ids: [979],
						minStars: 10,
						multiple: { "tyku": 2 },
					},
				],
			},
			// 25mm Anti-aircraft Autocannon Mount & Machine Guns
			"505": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All DD
						stypes: [2],
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
					},
					{
						// All DE
						stypes: [1],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// All CL, CLT, CT
						stypes: [3, 4, 21],
						multiple: { "tyku": 1, "houk": 2 },
					},
					{
						// All CA, CAV, AV
						stypes: [5, 6, 16],
						multiple: { "tyku": 1, "houk": 1 },
					},
					{
						// Shigure K3
						ids: [961],
						single: { "houg": 2, "tyku": 3, "houk": 4 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "houg": 1, "tyku": 2, "houk": 3 },
						},
					},
					{
						// Shigure K2, Shiratsuyu K2, Yukikaze K2, Yahagi K2B, Amatsukaze K2, Harusame K2
						ids: [145, 497, 656, 668, 951, 975],
						single: { "houg": 2, "tyku": 3, "houk": 4 },
					},
					{
						// Shiratsuyu Kai, Yuudachi K2, Shigure Kai, Tan Yang, Murasame K2, Yukikaze Kai
						ids: [242, 144, 243, 651, 498, 228],
						single: { "tyku": 2, "houk": 2 },
					},
					{
						// Murasame Kai, Yuudachi Kai, Harusame Kai
						ids: [244, 245, 323],
						single: { "tyku": 1, "houk": 2 },
					},
					{
						// Kasumi K2B/K2, Hibiki Kai+, Asashimo K2, Isokaze B Kai, Hamakaze B Kai, Ushio K2, Hatsushimo K2, Kiyoshimo K2+
						ids: [470, 464, 235, 147, 578, 557, 558, 407, 419, 955, 960],
						single: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Fujinami K2, Hamanami K2
						ids: [981, 983],
						single: { "tyku": 1, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 1, "houk": 2 },
						},
					},
					{
						// Shigure K2, Shiratsuyu K2, Yukikaze K2, Hatsushimo K2, Amatsukaze K2, Harusame K2
						ids: [145, 497, 656, 419, 951, 975],
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 2, "houk": 2 },
						},
					},
					{
						// Shigure K3, Yukikaze K2, Amatsukaze K2, Harusame K2
						ids: [961, 656, 951, 975],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 1 },
						},
					},
					{
						// Shirayuki K2, Hatsuyuki K2, from getSlot25mmMachinegunLightShipEffect
						ids: [986, 987],
						multiple: { "houg": 1, "tyku": 1, "houk": 2 },
						synergy: {
							flags: [ "twin10cmKaiHighAngleGunMount" ],
							distinct: { "tyku": 1, "houm": 1 },
						},
					},
					{
						ids: [986],
						minStars: 8,
						multiple: { "houm": 1 },
					},
				],
			},
			// Type 94 Anti-Aircraft Fire Director
			"121": {
				count: 0,
				byClass: {
					// Akizuki Class
					"54": {
						single: { "tyku": 4, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 2, "houk": 2 },
						},
					},
				},
				byShip: [
					{
						// Hatsuzuki Kai Ni
						ids: [968],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							multiple: { "houg": 1, "houm": 1 },
						},
					},
					{
						// Fujinami Kai Ni, Hamanami Kai Ni
						ids: [981, 983],
						multiple: { "tyku": 1, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 2, "houk": 2 },
						},
					},
				],
			},
			// Type 1 Armor-Piercing Shell Kai
			"365": {
				count: 0,
				byClass: {
					// Ise Class
					"2": {
						single: { "houg": 1 },
					},
					// Kongou Class
					"6": [
						{
							single: { "houg": 1 },
						},
						{
							// Extra +2 fp for Kongou Class Kai Ni C
							remodel: 3,
							single: { "houg": 2 },
						},
					],
					// Nagato Class
					"19": [
						{
							single: { "houg": 1 },
						},
						{
							remodel: 2,
							single: { "houg": 1 },
						},
					],
					// Fusou Class
					"26": {
						single: { "houg": 1 },
					},
					// Yamato Class
					"37": [
						{
							single: { "houg": 1 },
						},
						{
							remodel: 1,
							single: { "houg": 1 },
						},
					],
				},
				byShip: {
					// Haruna K2B
					ids: [593],
					single: { "houg": -1 },
				},
			},
			// Type 3 Shell
			"35": {
				count: 0,
				byClass: {
					"6":
						{
							// Kongou Class Kai Ni C
							remodel: 3,
							single: { "houg": 1, "tyku": 1 },
						},
				},
				byShip: [
					{
						// Kongou K2 +1 fp, +1 aa
						ids: [149],
						single: { "houg": 1, "tyku": 1 },
					},
					{
						// Hiei K2 +1 aa
						ids: [150],
						single: { "tyku": 1 },
					},
					{
						// Haruna K2+ +1 aa, +1 ev
						ids: [151, 593, 954],
						single: { "tyku": 1, "houk": 1 },
					},
					{
						// Kirishima K2 +1 fp
						ids: [152],
						single: { "houg": 1 },
					},
				],
			},
			// Type 3 Shell Kai
			"317": {
				count: 0,
				starsDist: [],
				byClass: {
					// Kongou Class
					"6": [
						{
							multiple: { "houg": 2, "tyku": 1 },
						},
						{
							minStars: 8,
							single: { "houm": 1 },
						},
					],
					// Ise Class
					"2": [
						{
							multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						},
						{
							minStars: 10,
							single: { "houm": 1 },
						},
					],
				},
				byShip: [
					{
						// Kongou K2
						ids: [149, 591, 592],
						multiple: { "houg": 2, "tyku": 2 },
					},
					{
						// Hiei K2
						ids: [150],
						multiple: { "houg": 1, "tyku": 1 },
					},
					{
						// Haruna K2
						ids: [151],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Haruna K2B
						ids: [593],
						multiple: { "houg": 1, "tyku": 3, "houk": 2 },
					},
					{
						// Haruna K2C
						ids: [954],
						multiple: { "houg": 2, "tyku": 2, "houk": 1 },
					},
					{
						// Kirishima K2/C
						ids: [152, 694],
						multiple: { "houg": 2, "tyku": 1 },
					},
					{
						// Nagato K2
						ids: [541],
						multiple: { "houg": 1, "tyku": 2 },
					},
					{
						// Mutsu K2
						ids: [573],
						multiple: { "houg": 2, "tyku": 2, "houk": 1 },
					},
				],
			},
			// Type 3 Shell Kai Ni
			"483": {
				count: 0,
				starsDist: [],
				byClass: {
					// Kongou Class
					"6": [
						{
							single: { "houg": 2, "tyku": 3, "houm": 1 },
						},
						{
							minStars: 6,
							single: { "houm": 1 },
						},
						{
							minStars: 10,
							single: { "houm": 1 },
						},
					],
					// Ise Class
					"2": [
						{
							single: { "houg": 1, "tyku": 2, "houk": 2, "houm": 1 },
						},
						{
							minStars: 5,
							single: { "houk": 1 },
						},
						{
							minStars: 6,
							single: { "houm": 1 },
						},
						{
							minStars: 10,
							single: { "houk": 1 },
						},
					],
					// Yamato Class
					"37": [
						{
							minStars: 6,
							single: { "houm": 1 },
						},
						{
							minStars: 10,
							single: { "houk": 1 },
						},
					],
				},
				byShip: [
					// All (F)BB(V)
					{
						stypes: [8, 9, 10],
						minStars: 2,
						single: { "tyku": 1 },
					},
					{
						stypes: [8, 9, 10],
						minStars: 4,
						single: { "houg": 1 },
					},
					{
						stypes: [8, 9, 10],
						minStars: 7,
						single: { "houk": 1 },
					},
					{
						stypes: [8, 9, 10],
						minStars: 8,
						single: { "tyku": 1 },
					},
					{
						stypes: [8, 9, 10],
						minStars: 9,
						single: { "houg": 1 },
					},
					// All CA(V)
					{
						stypes: [5, 6],
						minStars: 2,
						single: { "tyku": 1 },
					},
					{
						stypes: [5, 6],
						minStars: 4,
						single: { "houg": 1 },
					},
					{
						stypes: [5, 6],
						minStars: 6,
						single: { "houk": 1 },
					},
					{
						stypes: [5, 6],
						minStars: 8,
						single: { "houm": 1 },
					},
					{
						stypes: [5, 6],
						minStars: 10,
						single: { "houg": 1 },
					},
					{
						// Kongou K2
						ids: [149],
						single: { "houg": 2, "tyku": 2 },
					},
					{
						// Kongou K2C
						ids: [591],
						single: { "houg": 3, "tyku": 3, "houk": 1 },
					},
					{
						// Hiei K2
						ids: [150],
						single: { "houg": 1, "tyku": 1 },
					},
					{
						// Hiei K2C
						ids: [592],
						single: { "houg": 2, "tyku": 2, "houk": 2 },
					},
					{
						// Haruna K2
						ids: [151],
						single: { "houg": 1, "tyku": 2, "houk": 2 },
					},
					{
						// Haruna K2B
						ids: [593],
						single: { "houg": 2, "tyku": 5, "houk": 3 },
					},
					{
						// Haruna K2C
						ids: [954],
						single: { "houg": 2, "tyku": 4, "houk": 2 },
					},
					{
						// Kirishima K2
						ids: [152],
						single: { "houg": 2, "tyku": 2 },
					},
					{
						// Kirishima K2C
						ids: [694],
						single: { "houg": 3, "tyku": 2, "houk": 1 },
					},
					{
						// Yamato-class K2+
						ids: [911, 916, 546],
						single: { "houg": 2, "tyku": 2, "houk": 2 },
					},
					{
						// Yamato-class K2+
						ids: [911, 916, 546],
						minStars: 5,
						single: { "houm": 1 },
					},
					{
						// Ise-class K2
						ids: [553, 554],
						single: { "houg": 1, "tyku": 2, "houk": 1 },
					},
					{
						// Ise-class K2
						ids: [553, 554],
						minStars: 1,
						single: { "houm": 1 },
					},
					{
						// Ise-class K2
						ids: [553, 554],
						minStars: 3,
						single: { "houm": 1 },
					},
					{
						// Nagato K2, Fusou-class K2
						ids: [541, 411, 412],
						single: { "houg": 1, "tyku": 2 },
					},
					{
						// Mutsu K2
						ids: [573],
						single: { "houg": 2, "tyku": 2, "houk": 1 },
					},
				],
			},
			// 20-tube 7inch UP Rocket Launchers
			"301": {
				count: 0,
				byClass: {
					// Queen Elizabeth Class
					"67": {
						multiple: { "souk": 1, "tyku": 2, "houk": 1 },
					},
					// Ark Royal Class
					"78": "67",
					// Jervis Class
					"82": "67",
					// Nelson Class
					"88": "67",
					// Town Class
					"108": "67",
					// Illustrious Class
					"112": "67",
				},
			},
			// Type 93 Passive Sonar
			"46": {
				count: 0,
				byClass: {
					// Katori Class
					"56": {
						distinctGears: [46, 47, 132, 149, 438],
						single: { "houk": 3, "tais": 2 },
					},
				},
			},
			// Type 3 Active Sonar
			"47": {
				count: 0,
				starsDist: [],
				byClass: {
					// Katori Class
					"56": {
						distinctGears: [46, 47, 132, 149, 438],
						single: { "houk": 3, "tais": 2 },
					},
				},
				byShip: [
					{
						// All remodels of: Kamikaze, Harukaze, Shigure, Yamakaze, Maikaze, Asashimo
						origins: [471, 473, 43, 457, 122, 425],
						multiple: { "houg": 1, "houk": 2, "tais": 3 },
					},
					{
						// All remodels of: Ushio, Ikazuchi, Yamagumo, Isokaze, Hamakaze, Kishinami
						origins: [16, 36, 414, 167, 170, 527],
						multiple: { "houk": 2, "tais": 2 },
					},
				],
			},
			// Type 3 Active Sonar Kai
			"438": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ayanami Class
					"1": {
						single: { "houk": 1, "tais": 1 },
					},
					// Akatsuki Class
					"5": "1",
					// Hatsuharu Class
					"10": "1",
					// Fubuki Class
					"12": "1",
					// Asashio Class
					"18": "1",
					// Shimakaze Class
					"22": "1",
					// Shiratsuyu Class
					"23": "1",
					// Mutsuki Class
					"28": "1",
					// Kagerou Class
					"30": "1",
					// Yuugumo Class
					"38": "1",
					// Akizuki Class
					"54": "1",
					// Kamikaze Class
					"66": "1",
					// Matsu Class
					"101": "1",
					// Katori Class
					"56": {
						distinctGears: [46, 47, 132, 149, 438],
						single: { "houk": 3, "tais": 2 },
					},
				},
				byShip: [
					{
						// All remodels of: Kamikaze, Harukaze, Shigure, Yamakaze, Maikaze, Asashimo
						origins: [471, 473, 43, 457, 122, 425],
						multiple: { "houg": 1, "houk": 2, "tais": 3 },
					},
					{
						// All remodels of: Ushio, Ikazuchi, Yamagumo, Isokaze, Hamakaze, Kishinami
						origins: [16, 36, 414, 167, 170, 527],
						multiple: { "houk": 2, "tais": 2 },
					},
					{
						// All remodels of: Ushio, Maikaze, Isokaze, Hamakaze, Ikazuchi, Yamagumo, Umikaze, Kawakaze, Suzukaze
						origins: [16, 122, 167, 170, 36, 414, 458, 459, 47],
						single: { "tais": 1 },
					},
					{
						// All remodels of: Shigure, Yamakaze, Kamikaze, Harukaze, Mikura, Ishigaki
						origins: [43, 457, 471, 473, 611, 585],
						single: { "houk": 1, "tais": 1 },
					},
					{
						// Naka K2, Yura K2, Isuzu K2
						ids: [160, 488, 141],
						single: { "houk": 1, "tais": 1 },
					},
					{
						// Shigure K2+, Harukaze Kai, Kamikaze Kai, Asashimo K2, Yamakaze K2+
						ids: [145, 961, 363, 476, 578, 588, 667],
						minStars: 4,
						single: { "tais": 1 },
					},
					{
						// Shigure K2, Harukaze Kai, Kamikaze Kai, Asashimo K2, Yamakaze K2+
						ids: [145, 363, 476, 578, 588, 667],
						minStars: 6,
						single: { "houk": 1 },
					},
					{
						// Shigure K2, Harukaze Kai, Kamikaze Kai, Asashimo K2, Yamakaze K2+
						ids: [145, 363, 476, 578, 588, 667],
						minStars: 8,
						single: { "tais": 1 },
					},
					{
						// Shigure K2, Harukaze Kai, Kamikaze Kai, Asashimo K2, Yamakaze K2+
						ids: [145, 363, 476, 578, 588, 667],
						minStars: 10,
						single: { "houk": 1 },
					},
				],
			},
			// Type 0 Passive Sonar
			"132": {
				count: 0,
				starsDist: [],
				byClass: {
					// Katori Class
					"56": {
						distinctGears: [46, 47, 132, 149, 438],
						single: { "houk": 3, "tais": 2 },
					},
				},
				byShip: [
					{
						// Yamato K2+, Musashi K2
						ids: [911, 916, 546],
						single: { "houk": 1 },
					},
					{
						// Taihou Kai, Shoukaku K2+, Zuikaku K2+
						ids: [156, 461, 466, 462, 467],
						single: { "houk": 2 },
					},
					// Following no ship limited, any ship can equip applied
					{
						minStars: 3,
						single: { "houk": 1 },
					},
					{
						minStars: 5,
						single: { "tais": 1 },
					},
					{
						minStars: 7,
						single: { "houk": 1 },
					},
					{
						minStars: 8,
						single: { "tais": 1 },
					},
					{
						minStars: 9,
						single: { "houm": 1 },
					},
					{
						minStars: 10,
						single: { "tais": 1 },
					},
				],
			},
			// Type 4 Passive Sonar
			"149": {
				count: 0,
				byClass: {
					// Akizuki Class
					"54": {
						single: { "houk": 2, "tais": 1 },
					},
					// Katori Class
					"56": {
						distinctGears: [46, 47, 132, 149, 438],
						single: { "houk": 3, "tais": 2 },
					},
				},
				byShip: [
					{
						// Yuubari K2/T, Isuzu K2, Naka K2, Yura K2, Yukikaze K2, Shigure K3
						ids: [622, 623,  141,      160,     488,     656,         961],
						single: { "houk": 3, "tais": 1 },
					},
					{
						// Yuubari K2D
						ids: [624],
						single: { "houk": 5, "tais": 3 },
					},
					{
						// Noshiro K2
						ids: [662],
						single: { "tais": 2, "houk": 4 },
					},
				],
			},
			// Type 94 Depth Charge Projector
			"44": {
				count: 0,
				byClass: {
					// Katori Class
					"56": {
						multiple: { "houk": 2, "tais": 3 },
					},
				},
			},
			// Type 3 Depth Charge Projector
			"45": {
				count: 0,
				byClass: {
					// Katori Class
					"56": {
						multiple: { "houk": 2, "tais": 3 },
					},
				},
			},
			// Type 3 Depth Charge Projector (Concentrated Deployment)
			"287": {
				count: 0,
				byClass: {
					// Katori Class
					"56": {
						multiple: { "houk": 2, "tais": 3 },
					},
				},
				byShip: [
					{
						// Yuubari K2D, Isuzu K2, Naka K2, Yura K2, Yukikaze K2
						ids: [624,      141,      160,     488,     656],
						multiple: { "houk": 1, "tais": 1 },
					},
					{
						// Noshiro K2, Shigure K3
						ids: [662, 961],
						multiple: { "tais": 3 },
					},
				],
			},
			// Prototype 15cm 9-tube ASW Rocket Launcher
			"288": {
				count: 0,
				byClass: {
					// Katori Class
					"56": {
						multiple: { "houk": 2, "tais": 3 },
					},
				},
				byShip: [
					{
						// Isuzu K2, Naka K2, Yura K2, Yukikaze K2
						ids: [141,   160,     488,     656],
						multiple: { "houk": 1, "tais": 2 },
					},
					{
						// Yuubari K2D
						ids: [624],
						multiple: { "houg": 1, "houk": 2, "tais": 3 },
					},
					{
						// Noshiro K2, Shigure K3
						ids: [662, 961],
						multiple: { "tais": 4, "houk": 1 },
					},
				],
			},
			// Type 2 Depth Charge
			"227": {
				count: 0,
				starsDist: [],
				byShip: [
					// For all ships can equip it
					{
						minStars: 8,
						multiple: { "tais": 1 },
					},
					{
						minStars: 10,
						multiple: { "tais": 1 },
					},
				],
			},
			// Type 2 Depth Charge Kai Ni
			"488": {
				count: 0,
				starsDist: [],
				byNation: {
					"Japan": {
						// All IJN DD
						stypes: [2],
						multiple: { "tais": 1, "houk": 1 },
					},
				},
				// IJN DE
				byClass: {
					// Shimushu Class
					"74": {
						multiple: { "tais": 1, "houk": 1 },
					},
					// Etorofu Class
					"77": "74",
					// Hiburi Class
					"85": "74",
					// Type D CDS Class
					"104": "74",
					// Ukuru Class
					"117": "74",
				},
				byShip: [
					{
						// Shigure K2+
						ids: [145, 961],
						multiple: { "tais": 5, "houk": 4, "houm": 2 },
					},
					// For Shigure K2+
					{
						ids: [145, 961],
						minStars: 3,
						multiple: { "houk": 1 },
					},
					{
						ids: [145, 961],
						minStars: 5,
						multiple: { "tais": 1 },
					},
					{
						ids: [145, 961],
						minStars: 7,
						multiple: { "houm": 1 },
					},
					{
						ids: [145, 961],
						minStars: 8,
						multiple: { "houk": 1 },
					},
					{
						ids: [145, 961],
						minStars: 9,
						multiple: { "tais": 1 },
					},
					{
						ids: [145, 961],
						minStars: 10,
						multiple: { "tais": 1 },
					},
					{
						// Shigure Kai, Yukikaze Kai+, Isokaze B Kai, Hamakaze B Kai
						ids: [243,      228, 651, 656, 557, 558],
						multiple: { "tais": 2, "houk": 1, "houm": 1 },
					},
					{
						// Shigure base, Yahagi K2+, Hibiki Kai, Fusou/Yamashiro K2, Suzutsuki/Fuyutsuki Kai, Ushio K2, Hatsushimo K2
						ids: [43, 663, 668, 235, 411, 412, 537, 538, 407, 419],
						multiple: { "tais": 1 },
					},
					// For ships of previous 2 types
					{
						minStars: 5,
						ids: [243, 228, 651, 656, 557, 558, 43, 663, 668, 235, 411, 412, 537, 538, 407, 419],
						multiple: { "tais": 1 },
					},
					{
						minStars: 7,
						ids: [243, 228, 651, 656, 557, 558, 43, 663, 668, 235, 411, 412, 537, 538, 407, 419],
						multiple: { "houk": 1 },
					},
					{
						minStars: 9,
						ids: [243, 228, 651, 656, 557, 558, 43, 663, 668, 235, 411, 412, 537, 538, 407, 419],
						multiple: { "houm": 1 },
					},
					{
						minStars: 10,
						ids: [243, 228, 651, 656, 557, 558, 43, 663, 668, 235, 411, 412, 537, 538, 407, 419],
						multiple: { "tais": 1 },
					},
				],
			},
			// RUR-4A Weapon Alpha Kai
			"377": {
				count: 0,
				byNation: {
					"UnitedStates": {
						single: { "houk": 1, "tais": 2 },
					},
				},
				byClass: {
					// Jervis Class
					"82": {
						single: { "houk": 1, "tais": 1 },
					},
					// Perth Class
					"96": "82",
					// Town Class
					"108": "82",
				},
				byShip: [
					{
						// Fletcher Mk.II, extra +1 ASW, +1 EV
						ids: [629],
						single: { "houk": 2, "tais": 1 },
					},
					{
						// Tan Yang/Yukikaze K2
						ids: [651, 656],
						single: { "houk": 2, "tais": 1 },
					},
				],
			},
			// Lightweight ASW Torpedo (Initial Test Model)
			"378": {
				count: 0,
				byNation: {
					"UnitedStates": {
						single: { "houk": 1, "tais": 3 },
					},
				},
				byClass: {
					// Jervis Class
					"82": {
						single: { "houk": 1, "tais": 2 },
					},
					// Town Class
					"108": "82",
					// Perth Class
					"96": {
						single: { "houk": 1, "tais": 1 },
					},
				},
				byShip: [
					{
						// Fletcher Mk.II, extra +1 ASW, +1 EV
						ids: [629],
						single: { "houk": 1, "tais": 1 },
					},
					{
						// Tan Yang/Yukikaze K2
						ids: [651, 656],
						single: { "houk": 1, "tais": 1 },
					},
				],
			},
			// Hedgehog (Initial Model)
			"439": {
				count: 0,
				byClass: {
					// Matsu Class
					"101": {
						single: { "tais": 1 },
					},
				},
				byNation: {
					"UnitedStates": {
						single: { "tais": 2 },
					},
					"UnitedKingdom": "UnitedStates",
				},
				byShip: [
					{
						// All DE
						stypes: [1],
						single: { "houk": 1, "tais": 2 },
					},
					{
						// All DD/CL/CT
						stypes: [2, 3, 21],
						single: { "houk": 1, "tais": 1 },
					},
				],
			},
			// Mk.32 ASW Torpedo (Mk.2 Thrower)
			"472": {
				count: 0,
				byNation: {
					"UnitedStates": {
						multiple: { "tais": 2 },
					},
					"UnitedKingdom": {
						multiple: { "tais": 1 },
					},
				},
				byShip: [
					{
						// All DE
						stypes: [1],
						multiple: { "houk": 1 },
					},
					{
						// Samuel B.Roberts Mk.II
						ids: [920],
						single: { "houk": 1, "tais": 1, "houm": 1 },
					},
				],
			},
			// Type 2 12cm Mortar Kai
			"346": {
				count: 0,
				byShip: {
					// Yamashiomaru
					origins: [900],
					single: { "tais": 1, "houk": 1 },
				},
			},
			// Type 2 12cm Mortar Kai (Concentrated Deployment)
			"347": {
				count: 0,
				byShip: {
					// Yamashiomaru
					origins: [900],
					single: { "tais": 2, "houk": 2 },
				},
			},
			// Arctic Camouflage
			"268": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All remodels of Tama, Kiso, Gangut
						origins: [100, 101, 511],
						single: { "souk": 2, "houk": 7 },
					},
					{
						// Abukuma Kai+
						ids: [290, 200],
						single: { "souk": 2, "houk": 7 },
					},
					{
						// Nachi, Tama, Kiso, Abukuma, Hibiki, Tashkent, Gotland, Gangut, Kirov
						minStars: 7,
						origins: [63, 100, 101, 114, 35, 516, 574, 511, 1001],
						multiple: { "tais": 1, "houk": 2, "houm": 1 },
						synergy: {
							flags: [ "arcticGearDeckPersonnel" ],
							multiple: { "tais": 2, "houk": 4, "houm": 1 },
						},
					},
					{
						// For all ships can equip
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						minStars: 8,
						multiple: { "houm": 1 },
					},
					{
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						minStars: 10,
						multiple: { "houk": 1 },
					},
				],
			},
			// New Kanhon Design Anti-torpedo Bulge (Large)
			"204": {
				count: 0,
				starsDist: [],
				byClass: {
					// Kongou Class Kai Ni C
					"6": [
						{
							remodel: 3,
							single: { "raig": 1, "souk": 1 },
						},
						{
							remodel: 3,
							minStars: 7,
							single: { "souk": 1 },
						},
						{
							remodel: 3,
							minStars: 10,
							single: { "raig": 1 },
						},
					],
				},
				byShip: [
					{
						// Kirishima K2C
						ids: [694],
						minStars: 7,
						single: { "souk": 1 },
					},
					{
						// Kirishima K2C
						ids: [694],
						minStars: 10,
						single: { "raig": 1 },
					},
				],
			},
			// Soukoutei (Armored Boat Class)
			"408": {
				count: 0,
				byShip: [
					{
						// Shinshuumaru
						origins: [621],
						multiple: { "houg": 2, "saku": 2, "houk": 2 },
					},
					{
						// Akitsumaru
						origins: [161],
						multiple: { "houg": 1, "tais": 1, "saku": 1, "houk": 1 },
					},
					{
						// All DD (if can equip Daihatsu ofc)
						stypes: [2],
						multiple: { "houg": 1, "saku": 1, "houk": -5 },
					},
				],
			},
			// Armed Daihatsu
			"409": {
				count: 0,
				byShip: [
					{
						// Shinshuumaru
						origins: [621],
						multiple: { "houg": 1, "tyku": 2, "houk": 3 },
					},
					{
						// Akitsumaru
						origins: [161],
						multiple: { "houg": 1, "tyku": 1, "tais": 1, "houk": 2 },
					},
				],
			},
			// Special Type 4 Amphibious Tank
			"525": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All SS/SSV
						stypes: [13, 14],
						multiple: { "houg": 1, "raig": 2, "houk": -1 },
					},
					{
						// I-36, I-41
						origins: [971],
						single: { "houg": 2, "raig": 1, "houm": 2 },
					},
					{
						stypes: [13, 14],
						minStars: 1,
						multiple: { "raig": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 3,
						multiple: { "houm": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 10,
						multiple: { "raig": 1 },
					},
				],
			},
			// Special Type 4 Amphibious Tank Kai
			"526": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All SS/SSV
						stypes: [13, 14],
						multiple: { "houg": 2, "raig": 3, "houm": 1, "houk": -1 },
					},
					{
						// I-36, I-41
						origins: [971],
						single: { "houg": 2, "raig": 1, "houm": 2 },
					},
					{
						stypes: [13, 14],
						minStars: 1,
						multiple: { "raig": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 2,
						multiple: { "houg": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 3,
						multiple: { "houm": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 4,
						multiple: { "raig": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 6,
						multiple: { "houm": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						stypes: [13, 14],
						minStars: 10,
						multiple: { "raig": 1 },
					},
				],
			},
			// Pugliese Underwater Protection Bulkhead
			"136": {
				count: 0,
				starsDist: [],
				byClass: {
					// Italian large ships: V.Veneto Class
					"58": [
						{
							single: { "souk": 2, "houk": 1 },
						},
						{
							minStars: 3,
							multiple: { "souk": 1 },
						},
						{
							minStars: 6,
							multiple: { "souk": 1 },
						},
						{
							minStars: 10,
							multiple: { "souk": 1 },
						},
					],
					// Aquila Class
					"68": "58",
					// Conte di Cavour Class
					"113": "58",
					// Marcello Class
					"124": "58",
				},
				byShip: {
						// Conte di Cavour Nuovo
						ids: [879],
						single: { "souk": 1, "houk": 1 },
				},
			},
			// Night Operations Aviation Personnel
			"258": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						minStars: 2,
						multiple: { "houk": 1, "houm": 1 },
					},
					{
						minStars: 2,
						// Ryuuhou K2E, Akagi K2E, Kaga K2E, Houshou K2Sen, Taihou Kai
						ids: [883, 599, 610, 899, 156],
						multiple: { "houg": 1, "houk": 1, "houm": 1 },
					},
				],
			},
			// Skilled Deck Personnel + Aviation Maintenance Hands
			"478": {
				count: 0,
				starsDist: [],
				byShip: [
					// For any ship can equip it
					{
						minStars: 1,
						single: { "houg": 1 },
					},
					{
						minStars: 2,
						single: { "houm": 1 },
					},
					{
						minStars: 3,
						single: { "houk": 1 },
					},
					{
						minStars: 4,
						single: { "baku": 1 },
					},
					{
						minStars: 5,
						single: { "raig": 1 },
					},
					{
						minStars: 6,
						single: { "tyku": 1 },
					},
					{
						minStars: 7,
						single: { "houg": 1 },
					},
					{
						minStars: 8,
						single: { "houm": 1 },
					},
					{
						minStars: 9,
						single: { "houk": 1 },
					},
					{
						minStars: 10,
						single: { "houg": 1 },
					},
				],
			},
			// Skilled Lookouts
			"129": {
				count: 0,
				starsDist: [],
				byClass: {
					// All IJN DD fp +1, tp +2, asw +2, ev +2, los +1
					// Ayanami Class
					"1": {
						multiple: { "houg": 1, "raig": 2, "tais": 2, "houk": 2, "saku": 1 },
					},
					// Akatsuki Class
					"5": "1",
					// Hatsuharu Class
					"10": "1",
					// Fubuki Class
					"12": "1",
					// Asashio Class
					"18": "1",
					// Shimakaze Class
					"22": "1",
					// Shiratsuyu Class
					"23": "1",
					// Mutsuki Class
					"28": "1",
					// Kagerou Class
					"30": "1",
					// Yuugumo Class
					"38": "1",
					// Akizuki Class
					"54": "1",
					// Kamikaze Class
					"66": "1",
					// Matsu Class
					"101": "1",
					// All IJN CL fp +1, tp +2, ev +2, los +3
					// Kuma Class
					"4": {
						multiple: { "houg": 1, "raig": 2, "houk": 2, "saku": 3 },
					},
					// Sendai Class
					"16": "4",
					// Nagara Class
					"20": "4",
					// Tenryuu Class
					"21": "4",
					// Yuubari Class
					"34": "4",
					// Agano Class
					"41": "4",
					// Ooyodo Class
					"52": "4",
					// Katori Class
					"56": "4",
					// All IJN CA fp +1, ev +2, los +3
					// Furutaka Class
					"7": {
						multiple: { "houg": 1, "houk": 2, "saku": 3 },
					},
					// Takao Class
					"8": "7",
					// Mogami Class
					"9": "7",
					// Aoba Class
					"13": "7",
					// Myoukou Class
					"29": "7",
					// Tone Class
					"31": "7",
				},
				byShip: {
					// All ship classes above
					classes: [
						66, 28, 12, 1, 5, 10, 23, 18, 30, 38, 22, 54, 101,
						21, 4, 20, 16, 34, 56, 41, 52,
						7, 13, 29, 8, 9, 31
					],
					minStars: 10,
					single: { "houm": 1 },
				},
			},
			// Torpedo Squadron Skilled Lookouts
			"412": {
				count: 0,
				starsDist: [],
				byClass: {
					// All IJN DD
					// Ayanami Class
					"1": [
						{
							single: { "houg": 2, "raig": 4, "tais": 2 },
						},
						{
							multiple: { "houk": 3, "saku": 1 },
						},
						{
							minStars: 4,
							single: { "houg": 1 },
						},
						{
							minStars: 8,
							single: { "raig": 1 },
						},
					],
					// Akatsuki Class
					"5": "1",
					// Hatsuharu Class
					"10": "1",
					// Fubuki Class
					"12": "1",
					// Asashio Class
					"18": "1",
					// Shimakaze Class
					"22": "1",
					// Shiratsuyu Class
					"23": "1",
					// Mutsuki Class
					"28": "1",
					// Kagerou Class
					"30": "1",
					// Yuugumo Class
					"38": "1",
					// Akizuki Class
					"54": "1",
					// Kamikaze Class
					"66": "1",
					// Matsu Class
					"101": "1",
					// All IJN CL
					// Kuma Class
					"4": [
						{
							single: { "houg": 3, "raig": 3 },
						},
						{
							multiple: { "houk": 2, "saku": 3 },
						},
						{
							minStars: 4,
							single: { "houg": 1 },
						},
						{
							minStars: 8,
							single: { "raig": 1 },
						},
					],
					// Sendai Class
					"16": "4",
					// Nagara Class
					"20": "4",
					// Tenryuu Class
					"21": "4",
					// Yuubari Class
					"34": "4",
					// Agano Class
					"41": "4",
					// Ooyodo Class
					"52": "4",
					// Katori Class
					"56": "4",
					// All IJN CA
					// Furutaka Class
					"7": [
						{
							single: { "houg": 1 },
						},
						{
							multiple: { "houk": 1, "saku": 1 },
						},
					],
					// Takao Class
					"8": "7",
					// Mogami Class
					"9": "7",
					// Aoba Class
					"13": "7",
					// Myoukou Class
					"29": "7",
					// Tone Class
					"31": "7",
				},
			},
			// Elite Torpedo Squadron Command Facility
			"413": {
				count: 0,
				byClass: {
					// Ignore if specific ships can equip or not
					// Ayanami Class
					"1":{
						single: { "houg": 2, "raig": 2, "houk": 4 },
					},
					// Akatsuki Class
					"5": "1",
					// Hatsuharu Class
					"10": "1",
					// Fubuki Class
					"12": "1",
					// Asashio Class
					"18": "1",
					// Shimakaze Class
					"22": "1",
					// Shiratsuyu Class
					"23": "1",
					// Mutsuki Class
					"28": "1",
					// Kagerou Class
					"30": "1",
					// Kamikaze Class
					"66": "1",
					// Matsu Class
					"101": "1",
					// Yuugumo Class extra +2 fp, +3 tp, +3 ev
					"38": {
						single: { "houg": 4, "raig": 5, "houk": 7 },
					},
					// Akizuki Class
					"54": "38",
					// Katori Class
					"56": {
						single: { "houg": 4, "raig": 2, "houk": 2 },
					},
					// Tenryuu Class extra +2 aa, +1 tp, +1 ev
					"21": {
						single: { "houg": 4, "raig": 3, "tyku": 2, "houk": 3 },
					},
					// Yuubari Class
					"34": "21",
					// Kuma Class extra +1 fp, +2 tp, +2 ev
					"4": {
						single: { "houg": 5, "raig": 4, "houk": 4 },
					},
					// Sendai Class
					"16": "4",
					// Nagara Class
					"20": "4",
					// Agano Class
					"41": "4",
					// Ooyodo Class
					"52": "4",
				},
				byShip: [
					{
						// Naka, Yura, Yahagi, Noshiro, Hamanami, Shimakaze, Kiyoshimo, Hatsushimo
						origins: [56, 23, 139, 138, 484, 50, 41],
						single: { "tyku": 1, "houk": 1 },
					},
					{
						// Jintsuu, Sendai, Naganami, ~Hatsushimo~, Teruzuki
						// Another known bug: Hatsushimo appears in game codes, but this case never happens because she has already met previous case
						origins: [55, 54, 135, 422],
						single: { "houg": 1, "raig": 1 },
					},
					{
						// Jintsuu Kai Ni
						ids: [159],
						single: { "houg": 2 },
					},
					{
						// Naganami Kai Ni
						ids: [543],
						single: { "houg": 1, "houk": 1 },
					},
				],
			},
			// Fleet Communication Antenna
			"531": {
				count: 0,
				starsDist: [],
				byShip: [
					// For any ship can equip it
					{
						minStars: 4,
						multiple: { "houm": 1 },
					},
					{
						minStars: 5,
						multiple: { "houg": 1 },
					},
					{
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						minStars: 7,
						multiple: { "houm": 1 },
					},
					{
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						minStars: 9,
						multiple: { "houk": 1 },
					},
					{
						minStars: 10,
						multiple: { "houm": 1 },
					},
				],
			},
			// Smoke Generator (Smoke Screen)
			"500": {
				count: 0,
				byShip: [
					{
						// Miyuki K2
						ids: [959],
						multiple: { "houk": 4 },
					},
					{
						// All remodels of Johnston, Samuel B.Robers, Sendai, Harukaze, Kamikaze, Shikinami, Uranami, Aoba
						origins: [562, 561, 54, 473, 471, 14, 486, 61],
						multiple: { "houk": 3 },
					},
					{
						// All remodels of Inazuma, Haguro, Hatsushimo, Kasumi, Fubuki, Atago, Amagiri, Hamanami
						origins: [37, 65, 41, 49, 9, 67, 479, 484],
						multiple: { "houk": 2 },
					},
				],
			},
			// Smoke Generator Kai (Smoke Screen)
			"501": {
				count: 0,
				byShip: [
					{
						// Miyuki K2
						ids: [959],
						multiple: { "houk": 4 },
					},
					{
						// All remodels of Johnston, Samuel B.Robers, Sendai, Harukaze, Kamikaze, Shikinami, Uranami, Aoba
						origins: [562, 561, 54, 473, 471, 14, 486, 61],
						multiple: { "houk": 3 },
					},
					{
						// All remodels of Inazuma, Haguro, Hatsushimo, Kasumi, Fubuki, Atago, Amagiri, Hamanami
						origins: [37, 65, 41, 49, 9, 67, 479, 484],
						multiple: { "houk": 2 },
					},
				],
			},
			// All Seaplane Reconnaissances
			"t2_10": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni, Yahagi Kai Ni/K2B
						ids: [662, 663, 668],
						single: { "houg": 2, "tais": 3, "houk": 1 },
					},
					{
						// Mogami K2+, Mikuma K2+
						ids: [501, 506, 502, 507],
						single: { "houg": 2 },
					},
				],
			},
			// All Seaplane Bombers
			"t2_11": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni, Yahagi Kai Ni/K2B
						ids: [662, 663, 668],
						single: { "houg": 1, "tais": 1, "houk": 1 },
					},
					{
						// Mogami K2+, Mikuma K2+
						ids: [501, 506, 502, 507],
						single: { "houg": 1, "houk": 1 },
					},
				],
			},
			// All Rotorcraft
			"t2_25": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						single: { "tais": 4, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+
						ids: [663, 668],
						single: { "tais": 3, "houk": 1 },
					},
				],
			},
			// All Small Searchlights
			"t2_29": {
				count: 0,
				byShip: [
					{
						// All remodels of: Akatsuki, Choukai, Kirishima, Hiei
						origins: [34, 69, 85, 86],
						single: { "houg": 4, "houk": -1 },
					},
					{
						// Jintsuu
						origins: [55],
						single: { "houg": 8, "raig": 8, "houk": -1 },
					},
					{
						// Akigumo
						origins: [132],
						multiple: { "houg": 2 },
					},
					{
						// Yukikaze
						origins: [20],
						multiple: { "houg": 1, "tyku": 1 },
					},
					{
						// Noshiro Kai Ni, Yahagi Kai Ni/K2B
						ids: [662, 663, 668],
						single: { "houg": 4, "raig": 2 },
					},
				],
			},
			// All Large Searchlights
			"t2_42": {
				count: 0,
				byShip: [
					{
						// All remodels of: Kirishima, Hiei
						origins: [85, 86],
						single: { "houg": 6, "houk": -2 },
					},
					{
						// Hiei Kai Ni C
						ids: [592],
						single: { "houg": 3, "raig": 3 },
						synergy: {
							flags: [ "kamikazeTwinTorpedo" ],
							single: { "raig": 5 },
						},
					},
					{
						// Kirishima Kai Ni C
						ids: [694],
						single: { "houg": 4, "raig": 1 },
						synergy: {
							flags: [ "kamikazeTwinTorpedo" ],
							single: { "raig": 7 },
						},
					},
					{
						// Yamato, Musashi
						origins: [131, 143],
						single: { "houg": 4, "houk": -1 },
					},
				],
			},
			// All Radars
			// main.js's function `get_type3_nums` refers `api_type[2]` in fact, not our 't3'(`api_type[3]`), so it uses `12 || 13` for all radars.
			"t3_11": {
				count: 0,
				byShip: [
					{
						// Okinami K2, Akigumo K2, Shigure K3, Amatsukaze K2 with Air Radar
						ids: [569, 648, 961, 951],
						synergy: {
							flags: [ "airRadar" ],
							single: { "houg": 1, "tyku": 2, "houk": 3 },
						},
					},
					{
						// Kiyoshimo K2/K2D, Hayashimo K2, Fujinami K2, Hamanami K2
						ids: [955, 960, 956, 981, 983],
						synergy: [
							{
								flags: [ "airRadar" ],
								single: { "tyku": 2, "houk": 1 },
							},
							{
								flags: [ "type13AirRadarKaiLateModel" ],
								byStars: {
									gearId: 450,
									"4": { "houg": 1, "tyku": 1, "houk": 2, "houm": 1 },
								},
							},
						],
					},
				],
			},
			// New Model High Temperature High Pressure Boiler
			"87": {
				count: 0,
				starsDist: [],
				byClass: {
					// Kongou Class Kai Ni B/C
					"6": [
						{
							remodel: 3,
							single: { "raig": 1, "houk": 2 },
						},
						{
							remodel: 3,
							minStars: 6,
							single: { "houk": 1 },
						},
						{
							remodel: 3,
							minStars: 8,
							single: { "raig": 1 },
						},
						{
							remodel: 3,
							minStars: 10,
							single: { "houg": 1 },
						},
					],
					// Yuugumo Class
					"38": [
						{
							minStars: 7,
							multiple: { "houk": 1 },
						},
						{
							minStars: 8,
							multiple: { "raig": 1 },
						},
						{
							minStars: 10,
							multiple: { "houm": 1 },
						},
					],
					// Akizuki Class
					"54": 38,
					// Matsu Class
					"101": 38,
					// I-201/I-203 Class, 1 boiler without Turbine: Slow -> Fast
					"109": {
						single: { "soku": 5 },
					},
				},
				byShip: [
					// Amatsukaze K2
					{
						ids: [951],
						multiple: { "houg": 1, "raig": 1, "houk": 1, "houm": 1 },
					},
					{
						ids: [951],
						minStars: 6,
						multiple: { "tyku": 1 },
					},
					{
						ids: [951],
						minStars: 7,
						multiple: { "houk": 1 },
					},
					{
						ids: [951],
						minStars: 8,
						multiple: { "raig": 1 },
					},
					{
						ids: [951],
						minStars: 9,
						multiple: { "houg": 1 },
					},
					{
						ids: [951],
						minStars: 10,
						multiple: { "houm": 1 },
					},
					// Amatsukaze Kai-, Shimakaze, Shigure K3
					{
						ids: [181, 316, 50, 229, 961],
						minStars: 6,
						multiple: { "houk": 1 },
					},
					{
						ids: [181, 316, 50, 229, 961],
						minStars: 7,
						multiple: { "raig": 1 },
					},
					{
						ids: [181, 316, 50, 229, 961],
						minStars: 8,
						multiple: { "houg": 1 },
					},
					{
						ids: [181, 316, 50, 229, 961],
						minStars: 9,
						multiple: { "houm": 1 },
					},
					{
						ids: [181, 316, 50, 229, 961],
						minStars: 10,
						multiple: { "houk": 1 },
					},
					{
						// Houshou K2+, 1 newModelBoiler gets Fast like I-201/I-203,
						// according tests, supposed to be Slow Group A when turbine equipped,
						// but newModelBoiler + enhancedBoiler (-turbine) goes back to Slow,
						// 2 newModelBoilers + turbine is still Fast+ instead of Fastest.
						// was using strange synergy to simulate this buggy behavior.
						// fixed since 2022-12-27: https://twitter.com/KanColle_STAFF/status/1607683940651012098
						ids: [894, 899],
						single: { "soku": 5 },
						/*
						synergy: {
							flags: [ "improvedTurbineNonexist", "enhancedBoilerNonexist" ],
							single: { "soku": 5 },
						},
						*/
					},
					{
						// Fast Group A, speed level up without Turbine
						origins: [50, 516, 153, 110, 111, 70, 120, 124, 125, 71, 72, 885, 181],
						excludes: [181, 316],
						minStars: 7,
						countCap: 2,
						multiple: { "soku": 5 },
					},
					{
						// Inagi Kai Ni (Slow Group B)
						ids: [979],
						single: { "soku": 5},
					},
				],
			},
			// Improved Kanhon Type Turbine, speed boost synergy with boilers
			// https://wikiwiki.jp/kancolle/%E9%80%9F%E5%8A%9B#da6be20e
			"33": {
				count: 0,
				byShip: [
					{
						// Fast Group A: Shimakaze, Tashkent, Taihou, Shoukaku, Zuikaku, Mogami, Mikuma, Suzuya, Kumano, Tone, Chikuma, Victorious?, Amatsukaze Kai Ni
						origins: [50, 516, 153, 110, 111, 70, 120, 124, 125, 71, 72, 885, 181],
						excludes: [181, 316],
						speedCap: 10,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 10 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
									"5": { "soku": 10 },
								},
							},
							{
								flags: [ "newModelBoiler" ],
								single: { "soku": 10 },
							},
						],
					},
					{
						// Fast Group B1: Amatsukaze, Iowa, Souryuu, Hiryuu, Unryuu, Amagi, Kongou, Haruna, Kirishima, Hiei, Agano, Noshiro, Yahagi, Sakawa, Yamato Kai Ni
						origins: [181, 440, 90, 91, 404, 331, 78, 79, 85, 86, 137, 138, 139, 140, 131],
						excludes: [662, 131, 136, 916, 951],
						speedCap: 10,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler" ],
								byCount: {
									gear: "newModelBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 10 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
									"5": { "soku": 10 },
								},
							},
						],
					},
					{
						// Fast Group B2: Yuubari Kai Ni/K2D, Noshiro K2
						//   Almost fast CV: Akagi, Katsuragi, Intrepid, Ark Royal, Aquila, Graf Zeppelin, Saratoga, Hornet, Ranger?
						//   Almost FBB: Littorio, Roma, Bismarck, Richelieu, Jean Bart?, South Dakota, Massachusetts?, Washington, Conte di Cavour Kai+
						//   All fast DD: not here, see next item
						//   All fast CL/CLT: Nagara, Isuzu, Yura, Ooi, Kitakami, Tenryuu, Tatsuta, Natori, Sendai, Jintsuu, Naka, Kuma, Tama, Kiso, Kinu, Abukuma, Ooyodo, Gotland, Abruzzi, Garibaldi, Atlanta, De Ruyter, Perth, Helena, Sheffield, Honolulu?, Brooklyn?, Gloire?, Kirov?
						//   All fast CA(V): Furutaka, Kako, Aoba, Myoukou, Nachi, Ashigara, Haguro, Takao, Atago, Maya, Choukai, Kinugasa, Prinz Eugen, Zara, Pola, Houston, Northampton, Tuscaloosa?, Minneapolis?
						//   All fast CVL: Shouhou, Ryuujou, Zuihou, Chitose-Kou, Chiyoda-Kou, Ryuuhou K2, Langley?
						origins: [
								83, 332, 549, 515, 444, 432, 433, 603, 931,
								115, 138, 441, 442, 171, 492, 935, 602, 933, 654, 877,
								21, 22, 23, 24, 25, 51, 52, 53, 54, 55, 56, 99, 100, 101, 113, 114, 183, 574, 589, 590, 597, 604, 613, 615, 514, 598, 896, 965, 1001,
								59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 123, 176, 448, 449, 595, 655, 923, 1005,
								74, 76, 116, 102, 103, 184, 925
							],
						excludes: [115, 293, 623, 138, 306, 102, 103, 104, 105, 106, 107, 184, 185, 318, 883, 877],
						speedCap: 10,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 5 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
									"5": { "soku": 10 },
								},
							},
							{
								flags: [ "newModelBoiler" ],
								byCount: {
									gear: "newModelBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 10 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
									"5": { "soku": 10 },
								},
							},
						],
					},
					{
						// Fast Group B2 for all fast DDs
						stypes: [2],
						// Except slow DDs(see Slow Group B special below) and DDs in other groups:
						//   Samuel B.Roberts, Shimakaze, Tashkent, Amatsukaze
						excludes: [561, 681, 920, 50, 229, 516, 395, 181, 316, 951],
						speedCap: 10,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 5 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
								},
							},
							{
								flags: [ "newModelBoiler" ],
								byCount: {
									gear: "newModelBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 10 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
								},
							},
						],
					},
					{
						// Fast Group C: Yuubari/Yuubari Kai, Kaga, fast AV: Chitose, Chiyoda, Nisshin, Samuel B.Roberts Mk.II
						origins: [115, 84, 102, 103, 581, 561],
						excludes: [622, 623, 624, 108, 109, 291, 292, 296, 297, 561, 681],
						speedCap: 5,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler" ],
								single: { "soku": 5 },
							},
						],
					},
					{
						// Slow Group A: Yamato, Musashi, Nagato Kai Ni, Mutsu Kai Ni, Yamato K2J, Houshou K2+
						origins: [131, 143, 80, 81, 89],
						excludes: [80, 275, 81, 276, 911, 89, 285],
						speedCap: 15,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler" ],
								byCount: {
									gear: "newModelBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 10 },
									"3": { "soku": 15 },
									"4": { "soku": 15 },
									"5": { "soku": 15 },
								},
								byStars: {
									gearId: 87,
									// to simulte x1 star>=7 and x1 star<7 still soku+10 instead of +15,
									// but x3 star>=7 will get soku+20, just assume final speed capped at 20
									noStarsLessThan: 7,
									"7": { "soku": 5 },
								}
							},
							{
								flags: [ "newModelBoiler", "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"2": { "soku": 5 },
									"3": { "soku": 5 },
									"4": { "soku": 5 },
								},
								byStars: {
									gearId: 87,
									// to simulte x1 boiler and x1 star>=7 new model still soku+10
									"7": { "soku": -5 },
								},
							},
						],
					},
					{
						// Slow Group B: Taigei/Ryuuhou, Jingei, Chougei, Heianmaru?, Kamoi, Katori, Kashima, Shinshumaru, Souya (AGS), Yamashiomaru, Kumanomaru, No.101 Transport Ship, Asahi, Ootomari, Shimanemaru?
						//   All slow BB(V): Fusou, Yamashiro, Ise, Hyuuga, Nagato, Mutsu, Warspite, Valiant?, Nelson, Rodney?, Colorado, Maryland, Nevada?, Gangut, Conte di Cavour (base remodel)
						//   Slow CVL: Hiyou, Houshou (<K2), Junyou, Taiyou, Unyou?, Shinyou, Gambier Bay
						//   Slow AV: Akitsushima, Mizuho, Commandant Teste
						//   Slow DE: Inagi K2
						origins: [184, 634, 635, 944, 162, 154, 465, 621, 699, 900, 943, 945, 953, 1003,
								26, 27, 77, 87, 80, 81, 439, 927, 571, 572, 601, 918, 924, 511, 877,
								75, 89, 92, 521, 522, 534, 544, 995,
								445, 451, 491,
								922
							],
						excludes: [541, 573, 888, 878, 879, 894, 899, 922, 730],
						speedCap: 10,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 5 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
									"5": { "soku": 10 },
								},
							},
							{
								flags: [ "newModelBoiler" ],
								byCount: {
									gear: "newModelBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 10 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
									"5": { "soku": 10 },
								},
							},
						],
					},
					{
						// Slow Group B special: Yuubari Kai Ni Toku, Samuel B.Roberts
						// suspected works like Houshou K2+ with newModelBoilers:
						//   equip turbine +5 if no other engines equipped, otherwise back to Slow B
						ids: [623, 561, 681],
						single: { "soku": 5 },
						speedCap: 10,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"3": { "soku": 5 },
									"4": { "soku": 5 },
									"5": { "soku": 5 },
								},
							},
							{
								flags: [ "newModelBoiler" ],
								byCount: {
									gear: "newModelBoiler",
									"2": { "soku": 5 },
									"3": { "soku": 5 },
									"4": { "soku": 5 },
									"5": { "soku": 5 },
								},
							},
							{
								flags: [ "newModelBoiler", "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"2": { "soku": 5 },
								},
							},
						],
					},
					{
						// Slow Group C: Akashi, Hayasui, Akitsumaru
						//   All SS(V): I-168, I-58, I-8, I-19, I-26, I-13, I-400, I-401, I-14, I-47, U-511, Luigi Torelli, C.Cappellini?, Maruyu, I-201, I-203, I-36?, I-41?, Scamp, Salmon?, Drum?, Wahoo?
						origins: [182, 460, 161,
							126, 127, 128, 191, 483, 493, 155, 494, 495, 636, 431, 535, 934, 163, 881, 882, 971, 972, 299, 891, 892, 984
						],
						speedCap: 5,
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler" ],
								single: { "soku": 5 },
							},
						],
					},
				],
			},
		};
	};

})();
