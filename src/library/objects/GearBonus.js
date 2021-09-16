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
	 *  * [20210302 ALL] https://docs.google.com/spreadsheets/d/1bInH11S_xKdaKP754bB7SYh-di9gGzcXkiQPvGuzCpg/htmlview
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
				surfaceRadarIds: [28, 29, 31, 32, 88, 89, 124, 141, 142, 240, 278, 279, 307, 315, 410, 411],
				airRadar: 0,
				airRadarIds: [27, 30, 32, 89, 106, 124, 142, 278, 279, 307, 315, 410, 411],
				aaMachineGun: 0,
				aaMachineGunIds: [37, 38, 39, 40, 49, 51, 84, 85, 92, 131, 173, 191, 274, 301],
				enhancedBoiler: 0,
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
				kamikazeTwinTorpedo: 0,
				kamikazeTwinTorpedoIds: [174],
				tripleLargeGunMountK2: 0,
				tripleLargeGunMountK2Nonexist: 1,
				tripleLargeGunMountK2Ids: [290],
				triple305mm46LargeGunMount: 0,
				triple305mm46LargeGunMountIds: [427],
				triple320mm44LargeGunMount: 0,
				triple320mm44LargeGunMountIds: [429],
				twin203MediumGunMountNo2: 0,
				twin203MediumGunMountNo2Nonexist: 1,
				twin203MediumGunMountNo2Ids: [90],
				rotorcraft: 0,
				rotorcraftIds: [69, 324, 325, 326, 327],
				helicopter: 0,
				helicopterIds: [326, 327],
				twin127SmallGunMountModelDK2: 0,
				twin127SmallGunMountModelDK2Nonexist: 1,
				twin127SmallGunMountModelDK2Ids: [267],
				ru130mmB13SmallGunMount: 0,
				ru130mmB13SmallGunMountIds: [282],
				skilledLookouts: 0,
				skilledLookoutsIds: [129, 412],
				searchlightSmall: 0,
				searchlightSmallIds: [74],
				type21AirRadar: 0,
				type21AirRadarIds: [30, 410],
				type21AirRadarK2: 0,
				type21AirRadarK2Ids: [410],
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
			// TBM-3W+3S
			"389": {
				count: 0,
				byClass: {
					// Lexington Class
					"69": {
						multiple: { "houg": 2, "tais": 3, "houk": 1 },
					},
					// Casablanca Class
					"83": "69",
					// Essex Class
					"84": "69",
					// Yorktown Class
					"105": "69",
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
				byClass: {
					// Ark Royal Class
					"78": {
						multiple: { "houg": 4, "houk": 2 },
					},
					// Houshou Class
					"27": {
						multiple: { "houg": 3 },
					},
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
			// FM-2
			"277": {
				count: 0,
				byClass: {
					// Following carriers: Lexington Class
					"69": {
						multiple: { "houg": 1, "houk": 1 },
					},
					// Essex Class
					"84": "69",
					// Yorktown Class
					"105": "69",
					// Ark Royal Class
					"78": "69",
					// Illustrious Class
					"112": "69",
					// Casablanca Class
					"83": {
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
				},
			},
			// SBD
			"195": {
				count: 0,
				byClass: {
					// Following American carriers: Lexington Class
					"69": {
						multiple: { "houg": 1 },
					},
					// Casablanca Class
					"83": "69",
					// Essex Class
					"84": "69",
					// Yorktown Class
					"105": "69",
				},
			},
			// SBD-5
			"419": {
				count: 0,
				starsDist: [],
				byClass: {
					// Following American carriers: Lexington Class
					"69": [
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
					// Casablanca Class
					"83": "69",
					// Essex Class
					"84": "69",
					// Yorktown Class
					"105": "69",
				},
			},
			// SB2C-3
			"420": {
				count: 0,
				starsDist: [],
				byClass: {
					// Following American carriers: Lexington Class
					"69": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 3,
							multiple: { "houg": 1 },
						},
					],
					// Casablanca Class
					"83": "69",
					// Yorktown Class
					"105": "69",
					// Illustrious Class
					"112": "69",
					// Essex Class
					"84": [
						{
							multiple: { "houg": 2 },
						},
						{
							minStars: 3,
							multiple: { "houg": 1 },
						},
					],
					// Ark Royal Class
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
				byClass: {
					// Following American carriers: Lexington Class
					"69": [
						{
							multiple: { "houg": 2 },
						},
						{
							minStars: 5,
							multiple: { "houg": 1 },
						},
					],
					// Casablanca Class
					"83": "69",
					// Yorktown Class
					"105": "69",
					// Illustrious Class
					"112": "69",
					// Essex Class
					"84": [
						{
							multiple: { "houg": 3 },
						},
						{
							minStars: 5,
							multiple: { "houg": 1 },
						},
					],
					// Ark Royal Class
					"78": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 5,
							multiple: { "houg": 1 },
						},
					],
				},
				byShip: {
					// All CVL -2 fp, -1 ev, -2 ar
					stypes: [7],
					multiple: { "houg": -2, "houk": -1, "souk": -2 },
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
				byShip: {
					// All CVL +1 aa, +1 ev
					stypes: [7],
					multiple: { "tyku": 1, "houk": 1 },
				},
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
				byShip: {
					// All CVL +1 aa, +1 ev, +2 asw
					stypes: [7],
					multiple: { "tyku": 1, "tais": 2, "houk": 1 },
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
					// Kaga Class
					"3": {
						multiple: { "houg": 1, "tyku": 1, "tais": 1, "houk": 1 },
					},
				},
			},
			// FR-1 Fireball
			"422": {
				count: 0,
				byClass: {
					// Following carriers: Lexington Class
					"69": {
						multiple: { "houg": 1, "houk": 1 },
					},
					// Yorktown Class
					"105": "69",
					// Ark Royal Class
					"78": "69",
					// Illustrious Class
					"112": "69",
					// Essex Class
					"84": {
						multiple: { "houg": 2, "tyku": 1, "houk": 2 },
					},
					// Casablanca Class
					"83": [
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						{
							// Gambier Bay Mk.II
							remodel: 2,
							multiple: { "houg": 2, "tyku": 2, "houk": 2 },
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
					// Lexington Class
					"69": {
						multiple: { "houg": 1, "tyku": 1, "houk": 2 },
					},
					// Casablanca Class
					"83": "69",
					// Essex Class
					"84": "69",
					// Yorktown Class
					"105": "69",
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
					// Lexington Class
					"69": {
						multiple: { "houg": 1, "tyku": 1, "houk": 2 },
					},
					// Casablanca Class
					"83": "69",
					// Essex Class
					"84": "69",
					// Yorktown Class
					"105": "69",
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
				byClass: {
					// Ark Royal Class
					"78": {
						multiple: { "houg": 4, "tyku": 4, "houk": 4, "saku": 4 },
					},
					// Illustrious Class
					"112": "78",
					// Lexington Class
					"69": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1, "saku": 1 },
					},
					// Casablanca Class
					"83": "69",
					// Essex Class
					"84": "69",
					// Yorktown Class
					"105": "69",
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
					],
					// Illustrious Class
					"112": "78",
				},
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
							minStars: 8,
							multiple: { "raig": 1 },
						},
						{
							minStars: 10,
							multiple: { "tais": 1 },
						},
					],
					// Illustrious Class
					"112": "78",
				},
			},
			// Zuiun
			"26": {
				count: 0,
				byShip: [
					{
						// Noshiro Kai Ni
						ids: [662],
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						single: { "houg": 2 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
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
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						single: { "houg": 2 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
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
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						single: { "houg": 2 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
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
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						single: { "houg": 2 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
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
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						single: { "houg": 2 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
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
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						single: { "houg": 2 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
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
						single: { "houg": 2, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						single: { "houg": 2 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
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
						single: { "houg": 3, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						multiple: { "houg": 3, "tyku": 1, "houk": 2 },
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
						single: { "houg": 3, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						multiple: { "houg": 3, "tyku": 1, "houk": 2 },
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
						single: { "houg": 3, "houk": 1 },
					},
					{
						// Yahagi Kai Ni+, Mogami Kai Ni+
						ids: [663, 668, 501, 506],
						multiple: { "houg": 3, "tyku": 1, "houk": 2 },
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
					/* Queen Elizabeth Class, Ark Royal Class, J Class and Nelson Class (but they can not equip)
					"67": {
						multiple: { "houg": 2, "houk": 2, "saku": 2 },
					},
					"78": "67",
					"82": "67",
					"88": "67", */
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
					// Mogami Kai Ni+
					ids: [501, 506],
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
					"67": [
						{
							multiple: { "houg": 2, "tais": 3, "houk": 2, "saku": 2 },
						},
						// Warspite only
						{
							single: { "houg": 4, "houk": 1, "saku": 1 },
						},
					],
					// Nelson Class
					"88": {
						multiple: { "houg": 2, "tais": 3, "houk": 2, "saku": 2 },
					},
					// Town Class
					"108": "88",
				},
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
							minStars: 5,
							single: { "houk": 1 },
						},
						{
							minStars: 8,
							single: { "saku": 1 },
						},
						{
							minStars: 10,
							single: { "houg": 1 },
						},
					],
					// Colorado Class
					"93": "65",
					// South Dakota Class
					"102": "65",
					// North Carolina Class
					"107": "65",
					// Northampton Class
					"95": [
						{
							minStars: 5,
							single: { "houk": 1 },
						},
						{
							minStars: 10,
							single: { "houg": 1 },
						},
					],
					// Atlanta Class
					"99": "95",
					// St. Louis Class
					"106": "95",
					// Brooklyn Class
					"110": "95",
				},
			},
			// SOC Seagull
			"414": {
				count: 0,
				starsDist: [],
				byClass: {
					// Following Americans:
					// Iowa Class
					"65": [
						{
							single: { "saku": 1 },
						},
						{
							minStars: 5,
							single: { "houk": 1 },
						},
					],
					// Colorado Class
					"93": "65",
					// South Dakota Class
					"102": "65",
					// North Carolina Class
					"107": "65",
					// Northampton Class
					"95": [
						{
							single: { "houg": 1, "saku": 2 },
						},
						{
							minStars: 3,
							single: { "saku": 1 },
						},
						{
							minStars: 5,
							single: { "houk": 1 },
						},
						{
							minStars: 8,
							single: { "houk": 1 },
						},
						{
							minStars: 10,
							single: { "houg": 1 },
						},
					],
					// Atlanta Class
					"99": "95",
					// St. Louis Class
					"106": "95",
					// Brooklyn Class
					"110": "95",
				},
			},
			// SO3C Seamew Kai
			"415": {
				count: 0,
				starsDist: [],
				byClass: {
					// Following Americans:
					// Iowa Class
					"65": [
						{
							single: { "saku": 1, "tais": 1 },
						},
						{
							minStars: 5,
							single: { "houk": 1 },
						},
					],
					// Colorado Class
					"93": "65",
					// South Dakota Class
					"102": "65",
					// North Carolina Class
					"107": "65",
					// Northampton Class
					"95": [
						{
							single: { "houg": 1, "saku": 1, "tais": 1 },
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
			},
			// Type 2 Seaplane Fighter Kai
			"165": {
				count: 0,
				byShip: {
					// Mogami K2+
					ids: [501, 506],
					single: { "tyku": 2, "houk": 2 },
				},
			},
			// Type 2 Seaplane Fighter Kai (Skilled)
			"216": {
				count: 0,
				byShip: {
					// Mogami K2+
					ids: [501, 506],
					single: { "tyku": 2, "houk": 2 },
				},
			},
			// Type 0 Reconnaissance Seaplane Model 11B
			"238": {
				count: 0,
				byShip: {
					// Mogami K2+
					ids: [501, 506],
					single: { "raig": 1, "houk": 1 },
				},
			},
			// Type 0 Reconnaissance Seaplane Model 11B (Skilled)
			"239": {
				count: 0,
				byShip: {
					// Mogami K2+
					ids: [501, 506],
					single: { "raig": 1, "houk": 1 },
				},
			},
			// Kyoufuu Kai
			"217": {
				count: 0,
				byShip: {
					// Mogami K2+
					ids: [501, 506],
					multiple: { "houg": 1, "tyku": 5, "houk": 3 },
				},
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
			// 35.6cm Twin Gun Mount (Dazzle Camouflage)
			"104": {
				count: 0,
				byShip: [
					{
						// all Kongou Class Kai Ni
						ids: [149, 150, 151, 152],
						multiple: { "houg": 1 },
					},
					{
						// for Kongou K2 and Haruna K2
						ids: [149, 151],
						multiple: { "houg": 1 },
					},
					{
						// extra +1 aa, +2 ev for Haruna K2
						ids: [151],
						multiple: { "tyku": 1, "houk": 2 },
					},
				],
			},
			// 35.6cm Triple Gun Mount Kai (Dazzle Camouflage)
			"289": {
				count: 0,
				byShip: [
					{
						// all Kongou Class Kai Ni
						ids: [149, 150, 151, 152],
						multiple: { "houg": 1 },
					},
					{
						// for Kongou K2 and Haruna K2
						ids: [149, 151],
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
						// extra +2 aa, +2 ev for Haruna K2
						ids: [151],
						multiple: { "tyku": 2, "houk": 2 },
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
					// extra +1 fp, +1 aa for Hiei Kai Ni C
					{
						ids: [592],
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
				byClass: {
					// Following American can equip Large Main Gun:
					// Iowa
					"65": [
						{
							multiple: { "houg": 1 },
						},
						{
							minStars: 6,
							multiple: { "houg": 1 },
						},
					],
					// Colorado
					"93": "65",
					// North Carolina Class
					"107": "65",
					// South Dakota
					"102": [
						{
							multiple: { "houg": 2 },
						},
						{
							minStars: 6,
							multiple: { "houg": 1 },
						},
					],
				},
			},
			// 16inch Triple Gun Mount Mk.6 mod.2
			"385": {
				count: 0,
				starsDist: [],
				byClass: {
					// Following American can equip Large Main Gun:
					// Iowa
					"65": [
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
					// Colorado
					"93": [
						{
							multiple: { "houg": 2 },
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
					// South Dakota
					"102": [
						{
							multiple: { "houg": 2, "souk": 1 },
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
				byClass: {
					// Following American can equip Large Main Gun:
					// Iowa
					"65": [
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
					// Colorado
					"93": [
						{
							multiple: { "houg": 2 },
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
					// South Dakota
					"102": [
						{
							multiple: { "houg": 2, "souk": 1 },
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
				byClass: {
					// Following American can equip Medium Main Gun:
					// Colorado
					"93": [
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
					// Northampton
					"95": "93",
					// Atlanta
					"99": "93",
					// St. Louis
					"106": "93",
					// Brooklyn Class
					"110": "93",
				},
			},
			// 16inch Triple Rapid Fire Gun Mount Mk.16 mod.2
			"387": {
				count: 0,
				starsDist: [],
				byClass: {
					// Following American can equip Medium Main Gun:
					// Colorado
					"93": [
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
					// Northampton
					"95": "93",
					// Atlanta
					"99": "93",
					// St. Louis
					"106": "93",
					// Brooklyn Class
					"110": "93",
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
			// 15.5cm Triple Gun Mount
			"5": {
				count: 0,
				byClass: {
					// Mogami Class
					"9": {
						multiple: { "houg": 1 },
					},
					// Ooyodo Class
					"52": "9",
				},
			},
			// 15.5cm Triple Gun Mount Kai
			"235": {
				count: 0,
				byClass: {
					// Mogami Class
					"9": {
						multiple: { "houg": 1, "tyku": 1 },
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
						// Mogami Kai Ni+
						ids: [501, 506],
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
					// Mogami Kai Ni+
					ids: [501, 506],
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
			// 5inch Single High-angle Gun Mount Battery
			"358": {
				count: 0,
				byClass: {
					// Northampton Class
					"95": {
						multiple: { "houg": 2, "tyku": 3, "houk": 3 },
					},
					// Following British and Americans: Queen Elizabeth Class
					"67": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					// Ark Royal Class
					"78": "67",
					// Nelson Class
					"88": "67",
					// Iowa Class
					"65": "67",
					// Lexington Class
					"69": "67",
					// Casablanca Class
					"83": "67",
					// Essex Class
					"84": "67",
					// Colorado Class
					"93": "67",
					// Atlanta Class
					"99": "67",
					// South Dakota Class
					"102": "67",
					// Yorktown Class
					"105": "67",
					// St. Louis Class
					"106": "67",
					// North Carolina Class
					"107": "67",
					// Town Class
					"108": "67",
					// Brooklyn Class
					"110": "67",
					// Illustrious Class
					"112": "67",
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
			// SK Radar
			"278": {
				count: 0,
				byClass: {
					// Following American: Northampton Class
					"95": {
						single: { "tyku": 1, "houk": 3, "saku": 1 },
					},
					// Iowa Class
					"65": "95",
					// Lexington Class
					"69": "95",
					// Casablanca Class
					"83": "95",
					// Essex Class
					"84": "95",
					// Colorado Class
					"93": "95",
					// Atlanta Class
					"99": "95",
					// South Dakota Class
					"102": "95",
					// Yorktown Class
					"105": "95",
					// St. Louis Class
					"106": "95",
					// North Carolina Class
					"107": "95",
					// Brooklyn Class
					"110": "95",
					// Following British: Queen Elizabeth Class
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
				byClass: {
					// Following American: Northampton Class
					"95": {
						single: { "houg": 2, "tyku": 2, "houk": 3, "saku": 2 },
					},
					// Iowa Class
					"65": "95",
					// Lexington Class
					"69": "95",
					// Casablanca Class
					"83": "95",
					// Essex Class
					"84": "95",
					// Colorado Class
					"93": "95",
					// Atlanta Class
					"99": "95",
					// South Dakota Class
					"102": "95",
					// Yorktown Class
					"105": "95",
					// St. Louis Class
					"106": "95",
					// Brooklyn Class
					"110": "95",
					// North Carolina Class
					"107": "95",
					// Following British: Queen Elizabeth Class
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
				byClass: {
					// Following Americans: John C. Butler Class
					"87": {
						multiple: { "houg": 2, "raig": 4 },
					},
					// Fletcher Class
					"91": "87",
					// Northampton Class
					"95": "87",
					// Atlanta Class
					"99": "87",
					// St. Louis Class
					"106": "87",
					// Brooklyn Class
					"110": "87",
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
					// Ayanami Class K2: Ayanami K2, Ushio K2, Akebono K2
					"1": [
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
					// Akatsuki Class K2: Akatsuki K2, Hibiki K2 (Bep)
					"5": "1",
					// Hatsuharu Class K2: Hatsuharu K2, Hatsushimo K2
					"10": "1",
					// Fubuki Class K2: Fubuki K2, Murakumo K2
					"12": "1",
				},
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
				],
			},
			// 533mm Triple Torpedo Mount
			"283": {
				count: 0,
				byClass: {
					// Tashkent Class
					"81": {
						multiple: { "houg": 1, "raig": 3, "souk": 1 },
					},
				},
				byShip: {
					// Hibiki K2 (Bep)
					ids: [147],
					multiple: { "houg": 1, "raig": 3, "souk": 1 },
				},
			},
			// 533mm Triple Torpedo Mount (Model 53-39)
			"400": {
				count: 0,
				byClass: {
					// Tashkent Class
					"81": {
						multiple: { "houg": 1, "raig": 5, "souk": 1, "houk": 2 },
						synergy: {
							flags: [ "ru130mmB13SmallGunMount" ],
							single: { "houg": 2 },
						},
					},
				},
				byShip:{
					// Hibiki K2 (Bep)
					ids: [147],
					multiple: { "houg": 1, "raig": 5, "souk": 1, "houk": 2 },
					synergy: {
						flags: [ "ru130mmB13SmallGunMount" ],
						single: { "houg": 2 },
					},
				},
			},
			// Late Model 53cm Bow Torpedo Mount (8 tubes)
			"383": {
				count: 0,
				byClass: {
					// I-58 Class
					"36": {
						multiple: { "raig": 1 },
					},
					// I-400 Class
					"44": {
						multiple: { "raig": 2 },
					},
					// I-47 Class
					"103": {
						multiple: { "raig": 3 },
					},
				},
				byShip: {
					// I-47 Kai
					ids: [607],
					multiple: { "raig": 1 },
				},
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
						// Ooi K2, Nisshin A, Kuma K2D, Mogami K2T, Yahagi K2B
						ids: [118, 586, 657, 506, 668],
						multiple: { "raig": 1, "houk": -2 },
					},
					{
						// All other ships who can equip it
						stypes: [3, 4, 13, 14, 16],
						excludes: [118, 119, 506, 586, 623, 657, 668],
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
			},
			// 10cm Twin High-angle Gun Mount + Anti-Aircraft Fire Director
			"122": {
				count: 0,
				starsDist: [],
				byClass: {
					// Akizuki Class
					"54": {
						multiple: { "houg": 1, "tyku": 2, "houk": 1 },
					},
				},
				byShip: [
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
				byClass: {
					// Maestrale Class
					"61": [
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						{
							multiple: { "houg": 1, "tyku": 1, "houk": 1 },
						},
					],
				},
				byShip: {
					// extra +1 ev for Grecale all remodels
					origins: [614],
					multiple: { "houk": 1 },
				},
			},
			// 130mm B-13 Twin Gun Mount
			"282": {
				count: 0,
				byClass: {
					// Tashkent Class
					"81": {
						multiple: { "houg": 2, "souk": 1 },
					},
					// Yuubari Class
					"34": "81",
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
						// Shigure K2, Shikinami K2
						ids: [145, 627],
						multiple: { "houg": 1 },
					},
					{
						// Shiratsuyu Kai+, Murasame Kai+
						ids: [242, 497, 244, 498],
						multiple: { "houk": 1 },
					},
					{
						// Kawakaze K2
						ids: [469],
						multiple: { "houk": 2 },
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
							remodel: 2,
							excludes: [556, 557, 558, 559, 648, 651],
							// Kagerou Class K2 total +2 fp til 2 guns
							multiple: { "houg": 1 },
							countCap: 2,
						},
						{
							remodel: 2,
							excludes: [556, 557, 558, 559, 648, 651],
							// Kagerou Class K2 total +5 instead of +4 if guns = 2
							// https://wikiwiki.jp/kancolle/%E9%99%BD%E7%82%8E%E6%94%B9%E4%BA%8C
							single: { "houg": 1 },
							minCount: 2,
						},
					],
				},
				byShip: {
					// Yukikaze, Shigure, Isokaze, extra +1 ev
					origins: [20, 43, 167],
					multiple: { "houk": 1 },
				},
			},
			// 12.7cm Twin Gun Mount Model D Kai Ni
			// https://wikiwiki.jp/kancolle/12.7cm%E9%80%A3%E8%A3%85%E7%A0%B2D%E5%9E%8B%E6%94%B9%E4%BA%8C
			"267": {
				count: 0,
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
						// A code typo suspected in both sides, which supposed to give non-K2 ships +2 tp, instead of giving all,
						// see https://github.com/Tibowl/KCBugTracker/issues/42
						// here should follow server-side's value, so +2 tp has been added to previous line, and Akigumo K2's synergy
						/*
						{
							// remodels except all of Yuugumo Class K2
							excludes: [542, 543, 563, 564, 569, 578],
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "raig": 2 },
							},
						},
						*/
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
						// Kagerou K2, Shiranui K2, Kuroshio K2, Yukikaze K2, one-time +1 fp
						ids: [566, 567, 568, 656],
						single: { "houg": 1 },
					},
					{
						// Akigumo Kai Ni
						ids: [648],
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
				]
			},
			// 12.7cm Twin Gun Mount Model D Kai 3
			"366": {
				count: 0,
				byClass: {
					// Shimakaze Class
					"22": [
						{
							multiple: { "houg": 2, "houk": 1 },
						},
						{
							// Shimakaze Kai
							remodel: 1,
							synergy: [
								{
									flags: [ "surfaceRadar" ],
									single: { "houg": 2, "raig": 4, "houk": 2 },
								},
								{
									flags: [ "airRadar" ],
									single: { "houg": 1, "tyku": 5, "houk": 2 },
								},
							],
						},
						{
							// Shimakaze Kai, one-time +3 AA
							remodel: 1,
							single: { "tyku": 3 },
						},
						{
							// Shimakaze Kai, one-time +5 AA for 2 guns
							remodel: 1,
							single: { "tyku": 2 },
							minCount: 2,
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
						},
						{
							// Yuugumo Class K2
							remodel: 2,
							multiple: { "houg": 1 },
							synergy: [
								{
									flags: [ "surfaceRadar" ],
									single: { "houg": 2, "raig": 4, "houk": 2 },
								},
								{
									flags: [ "airRadar" ],
									single: { "houg": 1, "tyku": 5, "houk": 2 },
								},
							],
						},
						{
							// Yuugumo Class K2, one-time +3 AA
							remodel: 2,
							single: { "tyku": 3 },
						},
						{
							// Yuugumo Class K2, one-time +5 AA for 2 guns
							remodel: 2,
							single: { "tyku": 2 },
							minCount: 2,
						},
					],
				},
				byShip: [
					{
						// Kagerou K2, Shiranui K2, Kuroshio K2, Yukikaze K2 +1 fp, +2 aa for one or two gun(s)
						ids: [566, 567, 568, 656],
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
						single: { "tyku": 3 },
					},
					{
						// Akigumo Kai Ni, one-time +5 AA for 2 guns
						ids: [648],
						single: { "tyku": 2 },
						minCount: 2,
					},
					{
						// Akigumo Kai Ni
						ids: [648],
						multiple: { "houg": 2 },
						synergy: [
							{
								flags: [ "surfaceRadar" ],
								single: { "houg": 2, "raig": 4, "houk": 2 },
							},
							{
								flags: [ "airRadar" ],
								single: { "houg": 1, "tyku": 5, "houk": 2 },
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
						// Shigure K2
						ids: [145],
						multiple: { "houg": 1, "tyku": 1 },
					},
					{
						// Murasame K2
						ids: [498],
						multiple: { "tyku": 1, "houk": 1 },
					},
					{
						// Kawakaze/Umikaze K2, Shiratsuyu/Murasame Kai
						ids: [469, 587, 242, 244],
						multiple: { "houk": 1 },
					},
					{
						// Shikinami K2
						ids: [627],
						multiple: { "houg": 2, "raig": 1},
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
				byClass: {
					// John C. Butler Class, totally +2 fp from DD stype
					"87": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					// Fletcher Class
					"91": "87",
					// Atlanta Class
					"99": "87",
					// St. Louis Class
					"106": "87",
					// Brooklyn Class
					"110": "87",
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
						// Noshiro K2, Yahagi K2+
						ids: [662, 663, 668],
						multiple: { "tyku": 2, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 1, "houk": 2 },
						},
					},
					{
						// Mogami K2+
						ids: [501, 506],
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
				byShip: [
					{
						// Noshiro K2, Yahagi K2+, Mogami K2+
						ids: [662, 663, 668, 501, 506],
						multiple: { "houg": 1, "tyku": 3, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 3, "houk": 3 },
						},
					},
					{
						// Noshiro K2, Yahagi K2+
						ids: [662, 663, 668],
						multiple: { "tyku": 2, "houk": 1 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 1, "houk": 2 },
						},
					},
					{
						// Mogami K2+
						ids: [501, 506],
						multiple: { "houg": 1, "tyku": 2, "houk": 2 },
						synergy: {
							flags: [ "airRadar" ],
							distinct: { "tyku": 1, "houk": 2 },
						},
					},
				]
			},
			// Type 21 Air Radar
			"30": {
				count: 0,
				byClass: {
					// Akizuki Class
					"54": {
						single: { "tyku": 3, "houk": 2, "saku": 2 },
					},
				},
				byShip: {
					// Mogami Kai+
					ids: [73, 501, 506],
					single: { "tyku": 3, "houk": 2, "saku": 2 },
				},
			},
			// Type 21 Air Radar Kai Ni
			"410": {
				count: 0,
				byClass: {
					// Akizuki Class
					"54": {
						single: { "houg": 1, "souk": 1, "tyku": 5, "houk": 4, "saku": 2 },
					},
				},
				byShip: {
					// Mogami Kai+
					ids: [73, 501, 506],
					single: { "houg": 1, "souk": 1, "tyku": 5, "houk": 4, "saku": 2 },
				},
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
						ids: [151, 411, 412, 541, 573, 553, 554],
						minStars: 4,
						single: { "houg": 1, "tyku": 1 },
					},
					{
						// stars +10 on members below
						ids: [151, 411, 412, 541, 573, 553, 554],
						minStars: 10,
						single: { "houg": 1, "tyku": 1 },
					},
					{
						// Haurna K2, Fusou K2, Yamashiro K2
						ids: [151, 411, 412],
						single: { "houg": 3, "tyku": 4 },
					},
					{
						// Nagato K2, Mutsu K2, Ise K2, Hyuuga K2
						ids: [541, 573, 553, 554],
						single: { "houg": 2, "tyku": 2 },
					},
				],
			},
			// GFCS Mk.37
			"307": {
				count: 0,
				byClass: {
					// Following Americans: Iowa Class
					"65": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					// Lexington Class
					"69": "65",
					// Casablanca Class
					"83": "65",
					// Essex Class
					"84": "65",
					// John C. Butler Class
					"87": "65",
					// Fletcher Class
					"91": "65",
					// Colorado Class
					"93": "65",
					// Northampton Class
					"95": "65",
					// Atlanta Class
					"99": "65",
					// South Dakota Class
					"102": "65",
					// Yorktown Class
					"105": "65",
					// St. Louis Class
					"106": "65",
					// North Carolina Class
					"107": "65",
					// Brooklyn Class
					"110": "65",
				},
			},
			// SG Radar (Initial Model)
			"315": {
				count: 0,
				byClass: {
					// Following Americans: Iowa Class
					"65": {
						multiple: { "houg": 2, "houk": 3, "saku": 4 },
					},
					// Lexington Class
					"69": "65",
					// Casablanca Class
					"83": "65",
					// Essex Class
					"84": "65",
					// Colorado Class
					"93": "65",
					// Northampton Class
					"95": "65",
					// Atlanta Class
					"99": "65",
					// South Dakota Class
					"102": "65",
					// Yorktown Class
					"105": "65",
					// St. Louis Class
					"106": "65",
					// North Carolina Class
					"107": "65",
					// Brooklyn Class
					"110": "65",
					// John C. Butler Class, range from medium to long
					"87": [
						{
							multiple: { "houg": 3, "houk": 3, "saku": 4 },
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
			// Type 13 Air Radar Kai
			"106": {
				count: 0,
				byShip: [
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
						single: { "houg": 1, "tyku": 1, "houk": 1, "souk": 1 },
					},
					{
						// Yahagi K2B
						ids: [668],
						single: { "tyku": 1, "houk": 1 },
					},
				],
			},
			// 25mm Twin Autocannon Mount
			"39": {
				count: 0,
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
				],
			},
			// 25mm Triple Autocannon Mount
			"40": {
				count: 0,
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
				],
			},
			// 25mm Single Autocannon Mount
			"49": {
				count: 0,
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
				],
			},
			// 25mm Triple Autocannon Mount (Concentrated Deployment)
			"131": {
				count: 0,
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
						// Haruna K2 +1 aa, +1 ev
						ids: [151],
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
				byClass: {
					"6": [
						{
							// Kongou Class +1 fp, +1 aa
							single: { "houg": 1, "tyku": 1 },
						},
						{
							// Kongou Class K2C totally +3 fp, +3 aa
							remodel: 3,
							single: { "houg": 2, "tyku": 2 },
						},
					],
					// Nagato Class Kai Ni +1 fp, +2 aa
					"19": {
						remodel: 2,
						single: { "houg": 1, "tyku": 2 },
					},
				},
				byShip: [
					{
						// Kongou K2 totally +3 fp, +3 aa
						ids: [149],
						single: { "houg": 2, "tyku": 2 },
					},
					{
						// Hiei K2 totally +2 fp, +2 aa
						ids: [150],
						single: { "houg": 1, "tyku": 1 },
					},
					{
						// Haruna K2 totally +2 fp, +2 aa, +1 ev
						ids: [151],
						single: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Kirishima K2 totally +3 fp, +2 aa
						ids: [152],
						single: { "houg": 2, "tyku": 1 },
					},
					{
						// Mutsu Kai Ni totally +2 fp, +2 aa, +1 ev
						ids: [573],
						single: { "houg": 1, "houk": 1 },
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
						single: { "houk": 3, "tais": 2 },
					},
				},
			},
			// Type 3 Active Sonar
			"47": {
				count: 0,
				byClass: {
					// Katori Class
					"56": {
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
			// Type 0 Passive Sonar
			"132": {
				count: 0,
				byClass: {
					// Katori Class
					"56": {
						single: { "houk": 3, "tais": 2 },
					},
				},
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
						single: { "houk": 3, "tais": 2 },
					},
				},
				byShip: [
					{
						// Yuubari K2/T, Isuzu K2, Naka K2, Yura K2, Yukikaze K2
						ids: [622, 623,  141,      160,     488,     656],
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
						// Noshiro K2
						ids: [662],
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
						// Noshiro K2
						ids: [662],
						multiple: { "tais": 4, "houk": 1 },
					},
				],
			},
			// RUR-4A Weapon Alpha Kai
			"377": {
				count: 0,
				byClass: {
					// Following Americans: John C. Butler Class
					"87": {
						single: { "houk": 1, "tais": 2 },
					},
					// Fletcher Class
					"91": "87",
					// Atlanta Class
					"99": "87",
					// St. Louis Class
					"106": "87",
					// Brooklyn Class
					"110": "87",
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
				byClass: {
					// Following Americans: John C. Butler Class
					"87": {
						single: { "houk": 1, "tais": 3 },
					},
					// Fletcher Class
					"91": "87",
					// Atlanta Class
					"99": "87",
					// St. Louis Class
					"106": "87",
					// Brooklyn Class
					"110": "87",
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
			// Arctic Camouflage
			"268": {
				count: 0,
				byShip: {
					// Tama K / K2, Kiso K / K2
					ids: [146, 216, 217, 547],
					single: { "souk": 2, "houk": 7 },
				},
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
			// New Model High Temperature High Pressure Boiler
			"87": {
				count: 0,
				starsDist: [],
				byClass: {
					// Kongou Class Kai Ni C
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
					// I-203 Class, 1 boiler without Turbine: Slow -> Fast 
					"109": {
						single: { "soku": 5, },
					},
				},
			},
			// Skilled Lookouts
			"129": {
				count: 0,
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
					// Kuma Class extra +1 fp, +2 tp, +3 ev
					"4": {
						single: { "houg": 5, "raig": 4, "houk": 5 },
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
						// Jintsuu, Sendai, Naganami, Hatsushimo, Teruzuki
						origins: [55, 54, 135, 41, 422],
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
						// Mogami K2+
						ids: [501, 506],
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
						// Mogami K2+
						ids: [501, 506],
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
						// Yamato, Musashi
						origins: [131, 143],
						single: { "houg": 4, "houk": -1 },
					},
				],
			},
			// All Radars
			"t3_11": {
				count: 0,
				byShip: [
					{
						// Okinami K2, Akigumo K2 with Air Radar fp +1, aa +2, ev +3
						// btw1, main.js also counted Surface Radar for her at the same time, but no bouns assigned at all.
						// btw2, main.js's function `get_type3_nums` refers `api_type[2]` in fact, not our 't3'(`api_type[3]`), so it uses `12 || 13` for all radars.
						ids: [569, 648],
						synergy: {
							flags: [ "airRadar" ],
							single: { "houg": 1, "tyku": 2, "houk": 3 },
						},
					},
				],
			},
			// Improved Kanhon Type Turbine, speed boost synergy with boilers
			// https://wikiwiki.jp/kancolle/%E9%80%9F%E5%8A%9B#da6be20e
			"33": {
				count: 0,
				byShip: [
					{
						// Fast Group A: Shimakaze, Tashkent, Taihou, Shoukaku, Zuikaku, Mogami, Mikuma, Suzuya, Kumano, Tone, Chikuma, Victorious?
						origins: [50, 516, 153, 110, 111, 70, 120, 124, 125, 71, 72, 885],
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"1": { "soku": 5 },
									"2": { "soku": 10 },
									"3": { "soku": 10 },
									"4": { "soku": 10 },
								},
							},
							{
								flags: [ "newModelBoiler" ],
								single: { "soku": 10 },
							},
						],
					},
					{
						// Fast Group B1: Amatsukaze, Iowa, Souryuu, Hiryuu, Unryuu, Amagi, Kongou, Haruna, Kirishima, Hiei, Agano, Noshiro, Yahagi, Sakawa
						origins: [181, 440, 90, 91, 404, 331, 78, 79, 85, 86, 137, 138, 139, 140],
						excludes: [662],
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler" ],
								single: { "soku": 10 },
							},
						],
					},
					{
						// Fast Group B2: Yuubari Kai Ni/K2D, Noshiro K2
						//   Almost fast CV: Akagi, Katsuragi, Intrepid, Ark Royal, Aquila, Graf Zeppelin, Saratoga, Hornet
						//   Almost FBB: Littorio, Roma, Bismarck, Richelieu, South Dakota, Washington
						//   All fast DD: not here, see next item
						//   All fast CL/CLT: Nagara, Isuzu, Yura, Ooi, Kitakami, Tenryuu, Tatsuta, Natori, Sendai, Jintsuu, Naka, Kuma, Tama, Kiso, Kinu, Abukuma, Ooyodo, Gotland, Abruzzi, Garibaldi, Atlanta, De Ruyter, Perth, Helena, Sheffield, Honolulu?
						//   All fast CA(V): Furutaka, Kako, Aoba, Myoukou, Nachi, Ashigara, Haguro, Takao, Atago, Maya, Choukai, Kinugasa, Prinz Eugen, Zara, Pola, Houston, Northampton
						//   All fast CVL: Shouhou, Ryuujou, Zuihou, Chitose-Kou, Chiyoda-Kou, Ryuuhou K2
						origins: [115, 138, 441, 442, 171, 492, 602, 654, 83, 332, 549, 515, 444, 432, 433, 603,
								21, 22, 23, 24, 25, 51, 52, 53, 54, 55, 56, 99, 100, 101, 113, 114, 183, 574, 589, 590, 597, 604, 613, 615, 514, 598,
								59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 123, 176, 448, 449, 595, 655,
								74, 76, 116, 102, 103, 184
							],
						excludes: [115, 293, 623, 138, 306, 102, 103, 104, 105, 106, 107, 184, 185, 318, 883],
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
							{
								flags: [ "newModelBoiler", "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"1": { "soku": -5 },
								},
							},
						],
					},
					{
						// Fast Group B2 for all fast DDs
						stypes: [2],
						// Except slow DDs(see Slow Group B special below) and DDs in other groups:
						//   Samuel B.Roberts, Shimakaze, Tashkent, Amatsukaze
						excludes: [561, 681, 50, 229, 516, 395, 181, 316],
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
							{
								flags: [ "newModelBoiler", "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"1": { "soku": -5 },
								},
							},
						],
					},
					{
						// Fast Group C: Yuubari/Yuubari Kai, Kaga, fast AV: Chitose, Chiyoda, Nisshin
						origins: [115, 84, 102, 103, 581],
						excludes: [622, 623, 624, 108, 109, 291, 292, 296, 297],
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler", "enhancedBoiler" ],
								single: { "soku": -5 },
							},
						],
					},
					{
						// Slow Group A: Yamato, Musashi, Nagato Kai Ni, Mutsu Kai Ni
						origins: [131, 143, 80, 81],
						excludes: [80, 275, 81, 276],
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
								},
							},
							{
								flags: [ "newModelBoiler", "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"2": { "soku": 5 },
									"3": { "soku": 5 },
								},
							},
						],
					},
					{
						// Slow Group B: Taigei/Ryuuhou, Jingei, Chougei, Kamoi, Katori, Kashima, Shinshumaru, Souya (AGS)
						//   All slow BB(V): Fusou, Yamashiro, Ise, Hyuuga, Nagato, Mutsu, Warspite, Nelson, Colorado, Gangut, Conte di Cavour (base remodel)
						//   Slow CVL: Hiyou, Houshou, Junyou, Taiyou, Shinyou, Gambier Bay
						//   Slow AV: Akitsushima, Mizuho, Commandant Teste
						origins: [184, 634, 635, 162, 154, 465, 621, 699,
								26, 27, 77, 87, 80, 81, 439, 571, 601, 511, 877,
								75, 89, 92, 521, 534, 544,
								445, 451, 491
							],
						excludes: [541, 573, 888, 878, 879],
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
							{
								flags: [ "newModelBoiler", "enhancedBoiler" ],
								byCount: {
									gear: "enhancedBoiler",
									"1": { "soku": -5 },
									"3": { "soku": -5 },
									"4": { "soku": -5 },
								},
							},
							{
								flags: [ "enhancedBoiler", "newModelBoiler" ],
								byCount: {
									gear: "newModelBoiler",
									"2": { "soku": -5 },
									"3": { "soku": -5 },
									"4": { "soku": -5 },
								},
							},
						],
					},
					{
						// Slow Group B special: Yuubari Kai Ni Toku, Samuel B.Roberts
						ids: [623, 561, 681],
						single: { "soku": 5 },
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
						//   All SS(V): I-168, I-58, I-8, I-19, I-26, I-13, I-400, I-401, I-14, I-47, U-511, UIT-25, Maruyu, I-203
						origins: [182, 460, 161,  126, 127, 128, 191, 483, 493, 155, 494, 495, 636, 431, 539, 163, 882],
						synergy: [
							{
								flags: [ "enhancedBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler" ],
								single: { "soku": 5 },
							},
							{
								flags: [ "newModelBoiler", "enhancedBoiler" ],
								single: { "soku": -5 },
							},
						],
					},
				],
			},
		};
	};

})();
