/* Gear.js
KC3改 Equipment Object
*/
(function(){
	"use strict";

	window.KC3Gear = function( data ){
		// Default object properties included in stringifications
		this.itemId = 0;
		this.masterId = 0;
		this.stars = 0;
		this.lock = 0;
		this.ace = -1;

		// If specified with data, fill this object
		if(typeof data != "undefined"){
			// Initialized with raw data
			if(typeof data.api_id != "undefined"){
				this.itemId = data.api_id;
				this.masterId = data.api_slotitem_id;
				this.stars = data.api_level;
				this.lock = data.api_locked;

				// Plane Ace mechanism
				if(typeof data.api_alv != "undefined"){
					this.ace = data.api_alv;
				}

			// Initialized with formatted data
			}else{
				$.extend(this, data);
			}
		}
	};

	KC3Gear.prototype.exists = function(){ return this.itemId > 0 && this.masterId > 0 && this.master() !== false; };
	KC3Gear.prototype.isDummy = function(){ return ! this.exists(); };
	KC3Gear.prototype.master = function(){ return KC3Master.slotitem( this.masterId ); };
	KC3Gear.prototype.name = function(){ return KC3Meta.gearName( this.master().api_name ); };

	/**
	 * Explicit stats bonuses from equipment on specific ship are added to API result by server-side,
	 * to correct the 'naked stats' for these cases, have to simulate them all.
	 * It might be moved to an independent JSON, but stays here so that we can add comments.
	 * @return the bonus definition table with new counters of related equipment.
	 * @see https://wikiwiki.jp/kancolle/%E8%A3%85%E5%82%99#bonus - about naming of this bonus type
	 * @see URLs some summary tables:
	 *  * [20190222 ALL] https://docs.google.com/spreadsheets/d/1bInH11S_xKdaKP754bB7SYh-di9gGzcXkiQPvGuzCpg/htmlview
	 *  * [20190208 ALL] https://docs.google.com/spreadsheets/d/1_peG-B4ijt7HOvDtkd8dPZ8vA7ZMLx-YuwsuGoEm6wY/htmlview
	 *  * [20180904 ALL] https://github.com/andanteyk/ElectronicObserver/blob/develop/ElectronicObserver/Other/Information/kcmemo.md#%E7%89%B9%E6%AE%8A%E8%A3%85%E5%82%99%E3%81%AB%E3%82%88%E3%82%8B%E3%83%91%E3%83%A9%E3%83%A1%E3%83%BC%E3%82%BF%E8%A3%9C%E6%AD%A3
	 *  * [20180816 ALL] http://furukore.com/archives/13793
	 *  * [20180726  DD] https://zekamashi.net/kancolle-kouryaku/kutiku-fit/
	 *  * [20180808  DD] https://kitongame.com/%E3%80%90%E8%89%A6%E3%81%93%E3%82%8C%E3%80%91%E9%A7%86%E9%80%90%E8%89%A6%E3%81%AE%E4%B8%BB%E7%A0%B2%E3%83%95%E3%82%A3%E3%83%83%E3%83%88%E8%A3%9C%E6%AD%A3%E3%81%A8%E8%89%A6%E7%A8%AE%E5%88%A5%E3%81%8A/#i
	 *  * [20180429  DD] https://twitter.com/Lambda39/status/990268289866579968
	 */
	KC3Gear.explicitStatsBonusGears = function(){
		return {
			"synergyGears": {
				surfaceRadar: 0,
				surfaceRadarIds: [28, 29, 31, 32, 88, 89, 124, 141, 142, 240, 278, 279, 307, 315],
				airRadar: 0,
				airRadarIds: [27, 30, 32, 89, 106, 124, 142, 278, 279, 307, 315],
				tripleTorpedo: 0,
				tripleTorpedoIds: [13, 125],
				tripleTorpedoLateModel: 0,
				tripleTorpedoLateModelIds: [285],
				tripleTorpedoOxygenLateModel: 0,
				tripleTorpedoOxygenLateModelIds: [125, 285],
				quadrupleTorpedoOxygenLateModel: 0,
				quadrupleTorpedoOxygenLateModelIds: [15, 286],
				kamikazeTwinTorpedo: 0,
				kamikazeTwinTorpedoIds: [174],
				tripleLargeGunMountK2: 0,
				tripleLargeGunMountK2Ids: [290],
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
			// Suisei (Egusa Squadron)
			"100": {
				count: 0,
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						multiple: { "houg": 4 },
					},
				},
			},
			// Suisei Model 22 (634 Air Group)
			// https://wikiwiki.jp/kancolle/%E5%BD%97%E6%98%9F%E4%BA%8C%E4%BA%8C%E5%9E%8B%28%E5%85%AD%E4%B8%89%E5%9B%9B%E7%A9%BA%29
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
			// https://wikiwiki.jp/kancolle/%E5%BD%97%E6%98%9F%E4%BA%8C%E4%BA%8C%E5%9E%8B%28%E5%85%AD%E4%B8%89%E5%9B%9B%E7%A9%BA%EF%BC%8F%E7%86%9F%E7%B7%B4%29
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
			// Type 2 Reconnaissance Aircraft
			// https://wikiwiki.jp/kancolle/%E4%BA%8C%E5%BC%8F%E8%89%A6%E4%B8%8A%E5%81%B5%E5%AF%9F%E6%A9%9F
			"61": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ise Class Kai Ni
					"2": {
						remodel: 2,
						single: { "houg": 3, "souk": 1, "houk": 2, "leng": 1 },
					},
				},
				byShip: [
					{
						// All CVL/CV/CVB/BBV stars+2 extra +1 los
						// BBV only applied to Ise K2 for now
						stypes: [7, 11, 18, 12],
						minStars: 2,
						multiple: { "saku": 1 },
					},
					{
						// All CVL/CV/CVB/BBV stars+4 extra +1 fp, accumulative +1 fp, +1 los
						stypes: [7, 11, 18, 12],
						minStars: 4,
						multiple: { "houg": 1 },
					},
					{
						// All CVL/CV/CVB/BBV stars+6 extra +1 los, accumulative +1 fp, +2 los
						stypes: [7, 11, 18, 12],
						minStars: 6,
						multiple: { "saku": 1 },
					},
					{
						// All CVL/CV/CVB/BBV stars+10 accumulative +2 fp, +3 los
						// Suzuya/Kumano Kou K2, Zuihou K2B totally +3 fp, +4 los
						// Hiryuu K2  totally +4 fp, +5 los
						// Souryuu K2 totally +6 fp, +7 los
						// Ise K2 totally +5 fp, +1 ar, +2 ev, +3 los, multiple part unknown
						stypes: [7, 11, 18, 12],
						minStars: 10,
						multiple: { "houg": 1, "saku": 1 },
					},
					{
						// Suzuya/Kumano Kou K2, Zuihou K2B stars+1
						ids: [508, 509, 560],
						minStars: 1,
						multiple: { "houg": 1, "saku": 1 },
					},
					{
						// Hiryuu K2 stars+1
						ids: [196],
						minStars: 1,
						multiple: { "houg": 2, "saku": 2 },
					},
					{
						// Souryuu K2 stars+1
						ids: [197],
						minStars: 1,
						multiple: { "houg": 3, "saku": 3 },
					},
					{
						// Souryuu K2 stars+8 totally +5 fp, +6 los
						ids: [197],
						minStars: 8,
						multiple: { "houg": 1, "saku": 1 },
					},
				],
			},
			// Prototype Keiun (Carrier-based Reconnaissance Model)
			// https://wikiwiki.jp/kancolle/%E8%A9%A6%E8%A3%BD%E6%99%AF%E9%9B%B2%28%E8%89%A6%E5%81%B5%E5%9E%8B%29
			"151": {
				count: 0,
				starsDist: [],
				byShip: [
					{
						// All CVB stars+2 extra +1 los
						stypes: [18],
						minStars: 2,
						single: { "saku": 1 },
					},
					{
						// All CVB stars+4 extra +1 fp, accumulative +1 fp, +1 los
						stypes: [18],
						minStars: 4,
						single: { "houg": 1 },
					},
					{
						// All CVB stars+6 extra +1 los, accumulative +1 fp, +2 los
						stypes: [18],
						minStars: 6,
						single: { "saku": 1 },
					},
					{
						// All CVB stars+10 extra +1 fp, +1 los, accumulative +2 fp, +3 los
						stypes: [18],
						minStars: 10,
						single: { "houg": 1, "saku": 1 },
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
				byShip: {
					// Ise Class Kai
					ids: [82, 88],
					multiple: { "houg": 2 },
				},
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
				byShip: {
					// Ise Class Kai
					ids: [82, 88],
					multiple: { "houg": 2 },
				},
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
				byShip: {
					// Ise Class Kai
					ids: [82, 88],
					multiple: { "houg": 3, "houk": 1 },
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
			// https://wikiwiki.jp/kancolle/35.6cm%E4%B8%89%E9%80%A3%E8%A3%85%E7%A0%B2%E6%94%B9%28%E3%83%80%E3%82%BA%E3%83%AB%E8%BF%B7%E5%BD%A9%E4%BB%95%E6%A7%98%29
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
								distinct: { "tyku": 2, "houk": 3 },
							},
						},
						// extra +1 fp for Ise Class Kai Ni
						{
							remodel: 2,
							multiple: { "houg": 1 },
						},
					],
					// Fusou Class Kai Ni
					"26": {
						remodel: 2,
						multiple: { "houg": 1 },
					},
				},
			},
			// 41cm Twin Gun Mount Kai Ni
			// https://wikiwiki.jp/kancolle/41cm%E9%80%A3%E8%A3%85%E7%A0%B2%E6%94%B9%E4%BA%8C
			"318": {
				count: 0,
				byClass: {
					// Ise Class Kai+ +2 fp, +2 aa, +2 ev
					"2": {
						remodel: 1,
						multiple: { "houg": 2, "tyku": 2, "houk": 2 },
						synergy: [
							// `distinct` means only 1 set takes effect at the same time,
							// not stackable with 41cm Triple K2's air radar synergy
							// see https://twitter.com/KennethWWKK/status/1098960971865894913
							{
								flags: [ "airRadar" ],
								distinct: { "tyku": 2, "houk": 3 },
							},
							// Synergy with `41cm Triple Gun Mount Kai Ni`
							{
								flags: [ "tripleLargeGunMountK2" ],
								single: { "souk": 1, "houk": 2 },
							},
						],
					},
					// Nagato Class Kai Ni +3 fp, +2 aa, +1 ev
					"19": {
						remodel: 2,
						multiple: { "houg": 3, "tyku": 2, "houk": 1 },
						synergy: {
							flags: [ "tripleLargeGunMountK2" ],
							single: { "houg": 2, "souk": 1, "houk": 2 },
						},
					},
					// Fusou Class Kai Ni
					"26": {
						remodel: 2,
						multiple: { "houg": 1 },
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
					// Kongou Class Kai Ni
					"6": {
						remodel: 2,
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
					// Kongou Class Kai Ni
					"6": {
						remodel: 2,
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
					// Kongou Class Kai Ni
					"6": {
						remodel: 2,
						multiple: { "houg": 1, "souk": 1, "houk": -3 },
					},
				},
			},
			// 14cm Twin Gun Mount
			// https://wikiwiki.jp/kancolle/14cm%E9%80%A3%E8%A3%85%E7%A0%B2
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
			// https://wikiwiki.jp/kancolle/14cm%E9%80%A3%E8%A3%85%E7%A0%B2%E6%94%B9
			"310": {
				count: 0,
				byClass: {
					// Yuubari Class
					"34": {
						multiple: { "houg": 2, "tyku": 1, "houk": 1 },
					},
					// Katori Class
					"56": {
						multiple: { "houg": 2, "houk": 1 },
					},
					// Nisshin Class
					"90": {
						multiple: { "houg": 3, "raig": 2, "tyku": 1, "houk": 1 },
					},
				},
			},
			// 20.3cm (No.2) Twin Gun Mount
			"90": {
				count: 0,
				byShip: [
					{
						// Radar synergy with following ships
						ids: [142, 264, 416, 417],
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "raig": 2, "houk": 2 },
						},
					},
					{
						// Aoba Kai, extra Air Radar synergy
						ids: [264],
						multiple: { "houg": 1, "tyku": 1 },
						synergy: {
							flags: [ "airRadar" ],
							single: { "tyku": 5, "houk": 2 },
						},
					},
					{
						// Kinugasa Kai Ni
						ids: [142],
						multiple: { "houg": 2, "houk": 1 },
					},
					{
						// Furutaka Kai Ni, Kako Kai Ni
						ids: [416, 417],
						multiple: { "houg": 1 },
					},
				],
			},
			// Searchlight
			"74": {
				count: 0,
				byShip: [
					{
						// Hiei, Kirishima, Choukai, Akatsuki
						ids: [86, 150, 210, 85, 152, 212, 69, 272, 427, 34, 234, 437],
						single: { "houg": 2, "houk": -1 },
					},
					{
						// Jintsuu
						ids: [55, 159, 223],
						single: { "houg": 2, "raig": 2, "houk": -1 },
					},
					{
						// Akigumo
						ids: [132, 301],
						multiple: { "houg": 1 },
					},
					{
						// Yukikaze
						ids: [20, 228],
						multiple: { "tyku": 1 },
					},
				],
			},
			// Type 96 150cm Searchlight
			"140": {
				count: 0,
				byShip: [
					{
						// Hiei, Kirishima
						ids: [86, 150, 210, 85, 152, 212],
						single: { "houg": 3, "houk": -2 },
					},
					{
						// Yamato, Musashi
						ids: [131, 136, 143, 148, 546],
						single: { "houg": 2, "houk": -1 },
					},
				],
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
			},
			// 61cm Quintuple (Oxygen) Torpedo Mount
			// https://wikiwiki.jp/kancolle/61cm%E4%BA%94%E9%80%A3%E8%A3%85%28%E9%85%B8%E7%B4%A0%29%E9%AD%9A%E9%9B%B7
			"58": {
				count: 0,
				byClass: {
					// CLT types in Kuma Class
					"4": {
						stypes: [4],
						multiple: { "raig": 1 },
						countCap: 2,
					},
					// Shimakaze (Kai only?)
					"22": {
						remodel: 1,
						multiple: { "raig": 1 },
						countCap: 2,
					},
					// Akizuki Class (not only Kai?)
					"54": {
						multiple: { "raig": 1 },
						countCap: 2,
					},
				},
			},
			// 53cm Bow (Oxygen) Torpedo Mount
			// https://wikiwiki.jp/kancolle/53cm%E8%89%A6%E9%A6%96%28%E9%85%B8%E7%B4%A0%29%E9%AD%9A%E9%9B%B7
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
					// John C.Butler Class
					"87": {
						multiple: { "houg": 1, "raig": 3 },
						countCap: 2,
					},
					// Fletcher Class
					"91": "87",
				},
			},
			// 61cm Triple (Oxygen) Torpedo Mount Late Model
			// https://wikiwiki.jp/kancolle/61cm%E4%B8%89%E9%80%A3%E8%A3%85%28%E9%85%B8%E7%B4%A0%29%E9%AD%9A%E9%9B%B7%E5%BE%8C%E6%9C%9F%E5%9E%8B
			"285": {
				count: 0,
				starsDist: [],
				byClass: {
					// Ayanami Class K2: Ayanami K2, Ushio K2
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
			// https://wikiwiki.jp/kancolle/61cm%E5%9B%9B%E9%80%A3%E8%A3%85%28%E9%85%B8%E7%B4%A0%29%E9%AD%9A%E9%9B%B7%E5%BE%8C%E6%9C%9F%E5%9E%8B
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
			// 12.7cm Single High-angle Gun Mount (Late Model)
			// https://wikiwiki.jp/kancolle/12.7cm%E5%8D%98%E8%A3%85%E9%AB%98%E8%A7%92%E7%A0%B2%28%E5%BE%8C%E6%9C%9F%E5%9E%8B%29
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
					// Shimushu Class
					"74": {
						minStars: 7,
						multiple: { "houg": 1, "tyku": 1 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 1, "houk": 4 },
						},
					},
					// Etorofu Class
					"77": "74",
					// Hiburi Class
					"85": "74",
				},
				byShip: [
					{
						// Kinu Kai Ni
						ids: [487],
						minStars: 7,
						multiple: { "houg": 2, "tyku": 2 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "houk": 2 },
						},
					},
					{
						// Yura Kai Ni
						ids: [488],
						minStars: 7,
						multiple: { "houg": 2, "tyku": 3 },
						synergy: {
							flags: [ "surfaceRadar" ],
							single: { "houg": 3, "houk": 2 },
						},
					},
				],
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
								// Not sure how more torpedoes will go?
								byCount: {
									gear: "tripleTorpedo",
									"1": { "houg": 1, "raig": 3 },
									"2": { "houg": 2, "raig": 5 },
								},
							},
							{
								flags: [ "tripleTorpedoLateModel" ],
								byCount: {
									gear: "tripleTorpedoLateModel",
									"1": { "houg": 1, "raig": 4 },
									"2": { "houg": 2, "raig": 6 },
								},
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
						// Yuudachi K2
						ids: [144],
						multiple: { "houg": 1, "raig": 1, "tyku": 1, "houk": 2 },
					},
					{
						// Shigure K2
						ids: [145],
						multiple: { "houg": 1 },
					},
					{
						// Shiratsuyu Kai+, Murasame K2
						ids: [242, 497, 498],
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
							excludes: [556, 557, 558, 559],
							// Kagerou Class K2 total +2 fp til 2 guns
							multiple: { "houg": 1 },
							countCap: 2,
						},
						{
							remodel: 2,
							excludes: [556, 557, 558, 559],
							// Kagerou Class K2 total +5 instead of +4 if guns = 2
							// https://wikiwiki.jp/kancolle/%E9%99%BD%E7%82%8E%E6%94%B9%E4%BA%8C
							single: { "houg": 1 },
							minCount: 2,
						},
					],
				},
				byShip: {
					// Yukikaze Kai, Shigure K2, Isokaze B Kai, extra +1 ev
					ids: [145, 228, 557],
					multiple: { "houk": 1 },
				},
			},
			// 12.7cm Twin Gun Mount Model D Kai Ni
			// http://wikiwiki.jp/kancolle/?12.7cm%CF%A2%C1%F5%CB%A4D%B7%BF%B2%FE%C6%F3
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
							// Yuugumo Class K2, total +3 for each gun
							remodel: 2,
							multiple: { "houg": 1 },
							// total +6 fp, +4 tp, +4 ev
							synergy: {
								flags: [ "surfaceRadar" ],
								single: { "houg": 1, "raig": 1, "houk": 2 },
							},
						},
					],
					// Kagerou Class
					"30": [
						{
							multiple: { "houg": 1, "houk": 1 },
						},
						{
							// Kagerou Class K2, total +2 for 1st gun
							remodel: 2,
							excludes: [556, 557, 558, 559],
							single: { "houg": 1 },
						},
					],
				},
			},
			// 12.7cm Twin Gun Mount Model A Kai 3 + AAFD
			// https://wikiwiki.jp/kancolle/12.7cm%E9%80%A3%E8%A3%85%E7%A0%B2A%E5%9E%8B%E6%94%B9%E4%B8%89%28%E6%88%A6%E6%99%82%E6%94%B9%E4%BF%AE%29%EF%BC%8B%E9%AB%98%E5%B0%84%E8%A3%85%E7%BD%AE
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
								},
							},
							{
								flags: [ "tripleTorpedoLateModel" ],
								byCount: {
									gear: "tripleTorpedoLateModel",
									"1": { "houg": 1, "raig": 4 },
									"2": { "houg": 2, "raig": 6 },
								},
							},
							{
								// fp +2, tp +6 if equips both LM and non-LM at the same time
								flags: [ "tripleTorpedo", "tripleTorpedoLateModel" ],
								single: { "raig": -1 },
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
			// https://wikiwiki.jp/kancolle/12.7cm%E9%80%A3%E8%A3%85%E7%A0%B2B%E5%9E%8B%E6%94%B9%E5%9B%9B%28%E6%88%A6%E6%99%82%E6%94%B9%E4%BF%AE%29%EF%BC%8B%E9%AB%98%E5%B0%84%E8%A3%85%E7%BD%AE
			"296": {
				count: 0,
				byClass: {
					// Ayanami Class
					"1": {
						multiple: { "houg": 1 },
						// Not sure how multiple synergies will go?
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
						// extra synergies for Yuudachi/Shigure/Kawakaze/Shiratsuyu/Murasame K2
						ids: [144, 145, 469, 497, 498],
						synergy: [
							{
								flags: [ "airRadar" ],
								single: { "tyku": 1 },
							},
							{
								flags: [ "surfaceRadar" ],
								single: { "raig": 1 },
							},
						],
					},
					{
						// Shiratsuyu K2
						ids: [497],
						multiple: { "houg": 1, "houk": 2 },
					},
					{
						// Yuudachi K2
						ids: [144],
						multiple: { "houg": 1, "raig": 1, "houk": 1 },
					},
					{
						// Shigure K2
						ids: [145],
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					{
						// Murasame K2
						ids: [498],
						multiple: { "tyku": 1, "houk": 2 },
					},
					{
						// Kawakaze K2
						ids: [469],
						multiple: { "houk": 2 },
					},
				],
			},
			// 5inch Single Gun Mount Mk.30 Kai
			"313": {
				count: 0,
				byClass: {
					// John C.Butler Class
					"87": {
						multiple: { "houg": 2, "tyku": 2, "souk": 1, "houk": 1 },
					},
					// Fletcher Class
					"91": "87",
				},
			},
			// 5inch Single Gun Mount Mk.30 Kai + GFCS Mk.37
			"308": {
				count: 0,
				byClass: {
					// John C.Butler Class, extra +1 fp from DD stype
					"87": {
						multiple: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					// Fletcher Class
					"91": "87",
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
				],
			},
			// GFCS Mk.37
			"307": {
				count: 0,
				byClass: {
					// Following Americans: Iowa Class
					"65": {
						single: { "houg": 1, "tyku": 1, "houk": 1 },
					},
					// Lexington Class
					"69": "65",
					// Casablanca Class
					"83": "65",
					// Essex Class
					"84": "65",
					// John C.Butler Class
					"87": "65",
					// Fletcher Class
					"91": "65",
				},
			},
			// SG Radar (Initial Model)
			"315": {
				count: 0,
				byClass: {
					// Following Americans: Iowa Class
					"65": {
						single: { "houg": 2, "houk": 3, "saku": 4 },
					},
					// Lexington Class
					"69": "65",
					// Casablanca Class
					"83": "65",
					// Essex Class
					"84": "65",
					// John C.Butler Class, range from medium to long
					"87": {
						single: { "houg": 3, "houk": 3, "saku": 4, "leng": 1 },
					},
					// Fletcher Class
					"91": "87",
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
						// Isokaze,          Hamakaze,      Asashimo, Kasumi,            Yukikaze, Suzutsuki, Yahagi
						ids: [167, 320, 557, 170, 312, 558, 425, 344, 49, 253, 464, 470, 20, 228,  532, 537,  139, 307],
						multiple: { "tyku": 2, "houk": 2, "souk": 1 },
					},
					{
						// Hibiki,          Ooyodo,   Kashima
						ids: [35, 235, 147, 183, 321, 465, 356],
						multiple: { "tyku": 1, "houk": 3, "souk": 1 },
					},
				],
			},
			// Type 3 Shell
			"35": {
				count: 0,
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
					// Kongou Class +1 fp, +1 aa
					"6": {
						single: { "houg": 1, "tyku": 1 },
					},
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
				},
			},
			// Type 3 Active Sonar
			"47": {
				count: 0,
				byShip: [
					{
						// Kamikaze,    Harukaze, Shigure,      Yamakaze, Maikaze,  Asashimo
						ids: [471, 476, 473, 363, 43, 243, 145, 457, 369, 122, 294, 425, 344],
						multiple: { "houg": 1, "houk": 2, "tais": 3 },
					},
					{
						// Ushio,           Ikazuchi,Yamagumo, Isokaze,       Hamakaze,      Kishinami
						ids: [16, 233, 407, 36, 236, 414, 328, 167, 320, 557, 170, 312, 558, 527, 686],
						multiple: { "houk": 2, "tais": 2 },
					},
				],
			},
			// Arctic Camouflage
			// http://wikiwiki.jp/kancolle/?%CB%CC%CA%FD%CC%C2%BA%CC%28%A1%DC%CB%CC%CA%FD%C1%F5%C8%F7%29
			"268": {
				count: 0,
				byShip: {
					// Tama K / K2, Kiso K / K2
					ids: [146, 216, 217, 547],
					single: { "souk": 2, "houk": 7 },
				},
			},
		};
	};

	KC3Gear.accumulateShipBonusGear = function(bonusGears, gear){
		const synergyGears = bonusGears.synergyGears;
		const bonusDefs = bonusGears[gear.masterId];
		if(synergyGears) {
			if(synergyGears.tripleTorpedoIds.includes(gear.masterId)) synergyGears.tripleTorpedo += 1;
			if(synergyGears.tripleTorpedoLateModelIds.includes(gear.masterId)) synergyGears.tripleTorpedoLateModel += 1;
			if(synergyGears.tripleTorpedoOxygenLateModelIds.includes(gear.masterId)) synergyGears.tripleTorpedoOxygenLateModel += 1;
			if(synergyGears.quadrupleTorpedoOxygenLateModelIds.includes(gear.masterId)) synergyGears.quadrupleTorpedoOxygenLateModel += 1;
			if(synergyGears.kamikazeTwinTorpedoIds.includes(gear.masterId)) synergyGears.kamikazeTwinTorpedo += 1;
			if(synergyGears.tripleLargeGunMountK2Ids.includes(gear.masterId)) synergyGears.tripleLargeGunMountK2 += 1;
			if(gear.isSurfaceRadar()) synergyGears.surfaceRadar += 1;
			if(gear.isAirRadar()) synergyGears.airRadar += 1;
		}
		if(bonusDefs) {
			if(bonusDefs.count >= 0) bonusDefs.count += 1;
			if(Array.isArray(bonusDefs.starsDist)) {
				bonusDefs.starsDist[gear.stars || 0] = 1 + (bonusDefs.starsDist[gear.stars || 0] || 0);
			}
		}
	};

	KC3Gear.equipmentTotalStatsOnShipBonus = function(bonusGears, ship, apiName){
		var total = 0;
		const shipMasterId = ship.masterId;
		const shipClassId = ship.master().api_ctype;
		const shipTypeId = ship.master().api_stype;
		const synergyGears = bonusGears.synergyGears || {};
		const addBonusToTotalIfNecessary = (bonusDef, gearInfo) => {
			// Conditional filters, combinations are logic AND, all filters existed have to be passed
			if(Array.isArray(bonusDef.ids) && !bonusDef.ids.includes(shipMasterId)) { return; }
			if(Array.isArray(bonusDef.excludes) && bonusDef.excludes.includes(shipMasterId)) { return; }
			if(Array.isArray(bonusDef.classes) && !bonusDef.classes.includes(shipClassId)) { return; }
			if(Array.isArray(bonusDef.excludeClasses) && bonusDef.excludeClasses.includes(shipClassId)) { return; }
			if(Array.isArray(bonusDef.stypes) && !bonusDef.stypes.includes(shipTypeId)) { return; }
			if(Array.isArray(bonusDef.excludeStypes) && bonusDef.excludeStypes.includes(shipTypeId)) { return; }
			if(bonusDef.remodel &&
				RemodelDb.remodelGroup(shipMasterId).indexOf(shipMasterId) < bonusDef.remodel) { return; }
			let gearCount = gearInfo.count;
			if(bonusDef.minStars && gearInfo.starsDist) {
				gearCount = gearInfo.starsDist.slice(bonusDef.minStars).sumValues();
				if(!gearCount) { return; }
			}
			if(bonusDef.minCount && gearCount < bonusDef.minCount) { return; }
			// Additive bonus actions
			if(bonusDef.single) { total += bonusDef.single[apiName] || 0; }
			if(bonusDef.multiple) {
				total += (bonusDef.multiple[apiName] || 0) *
					(bonusDef.countCap ? Math.min(bonusDef.countCap, gearCount) : gearCount);
			}
			if(bonusDef.synergy) {
				const addBonusFromSynergyGears = (synergy) => {
					// All flags are true (logic AND, no logic OR/NOT yet)
					if(synergy.flags.every(flag => synergyGears[flag] > 0)) {
						if(synergy.single) { total += synergy.single[apiName] || 0; }
						if(synergy.distinct) {
							const flagsKey = synergy.flags.join("_") + "Applied";
							synergyGears[flagsKey] = (synergyGears[flagsKey] || 0) + 1;
							if(synergyGears[flagsKey] < 2) { total += synergy.distinct[apiName] || 0; }
						}
						if(synergy.byCount) {
							const gearName = synergy.byCount.gear;
							const countAmount = gearName === "this" ? gearCount : synergyGears[gearName] || 0;
							total += (synergy.byCount[countAmount] || {})[apiName] || 0;
						}
					}
				};
				if(Array.isArray(bonusDef.synergy)) {
					bonusDef.synergy.forEach(addBonusFromSynergyGears);
				} else {
					addBonusFromSynergyGears(bonusDef.synergy);
				}
			}
			// Try not to use any callback in order to let bonus table suit for a JSON
			//if(bonusDef.callback) { total += bonusDef.callback(apiName, gearInfo, synergyGears); }
		};
		Object.keys(bonusGears).forEach(gearId => {
			const gearInfo = bonusGears[gearId];
			if(gearInfo.count > 0) {
				if(gearInfo.byClass) {
					let byClass = gearInfo.byClass[shipClassId];
					if(byClass) {
						// Refer to another ship class if bonuses supposed to be the same
						if(typeof byClass === "string") {
							byClass = gearInfo.byClass[byClass] || {};
						}
						if(Array.isArray(byClass)) {
							byClass.forEach(c => addBonusToTotalIfNecessary(c, gearInfo));
						} else {
							addBonusToTotalIfNecessary(byClass, gearInfo);
						}
					}
				}
				if(gearInfo.byShip) {
					const byShip = gearInfo.byShip;
					if(Array.isArray(byShip)) {
						byShip.forEach(s => addBonusToTotalIfNecessary(s, gearInfo));
					} else {
						addBonusToTotalIfNecessary(byShip, gearInfo);
					}
				}
			}
		});
		return total;
	};

	/**
	 * Get the hidden improvement bonus for kinds of attack type based on current gear stars.
	 * Modifiers might be broken into a JSON for better maintenance.
	 * 
	 * @param {string} type - attack type identifier, allow values for now:
	 *                        `fire`, `torpedo`, `yasen`, `asw`, `support`
	 * @return {number} computed bonus = modifier * sqrt(stars)
	 * @see accStatImprovementBonus for accuracy improvement bonus
	 * @see losStatImprovementBonus for LoS improvement bonus
	 * @see aaStatImprovementBonus for Anti-Air improvement bonus
	 * @see http://kancolle.wikia.com/wiki/Improvements
	 * @see http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#ic9d577c
	 */
	KC3Gear.prototype.attackPowerImprovementBonus = function(type = "fire") {
		if(this.isDummy()) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		// No improvement bonus is default
		let modifier = 0;
		switch(type.toLowerCase()) {
			case "airattack":
			case "fire":
				switch(type2) {
					case 1: // Small Cal. Main
					case 2: // Medium Cal. Main
					case 18: // Type 3 Shell
					case 19: // AP Shell
					case 21: // AA Machine Gun
					case 24: // Landing Craft
					case 29: // Searchlight
					case 42: // Large Searchlight
					case 36: // AA Fire Director
					case 46: // Amphibious Tank
						modifier = 1; break;
					case 3: // Large Cal. Main
						modifier = 1.5; break;
					case 4: // Secondary
						// 0.2 per star for some green HA guns,
						// 0.3 per star for some yellow guns,
						// might be all but with some exceptions?
						// so here use white-list for sqrt(stars)
						if([11, 134, 135].includes(this.masterId)) {
							modifier = 1;
						} else {
							modifier = this.master().api_type[3] === 16 ? 0.2 : 0.3;
							return modifier * stars;
						}
						break;
					case 14: // Sonar
					case 40: // Large Sonar
						modifier = 0.75; break;
					case 15: // Depth Charge (Projector)
						modifier = this.isDepthCharge() ? 0 : 0.75;
						break;
				}
				break;
			case "torpedo":
				// Torpedo or AA Machine Gun
				if([5, 21, 32].includes(type2))
					modifier = 1.2;
				break;
			case "yasen":
				// See equiptype for api_type[2]
				if([1, 2, 3, 4, 5, 19, 22, 24, 29, 36, 42, 46].includes(type2))
					modifier = 1;
				break;
			case "asw":
				// Depth Charge or Sonar
				if([14, 15, 40].includes(type2))
					modifier = 1;
				break;
			case "airstrike":
				// for normal opening airstrike, only seaplane bomber bonus confirmed
				if(type2 === 11) return 0.2 * stars;
				break;
			case "support":
				// No any improvement bonus found for support fleet for now
				break;
			default:
				console.warn("Unknown attack type:", type);
		}
		return modifier * Math.sqrt(stars);
	};

	/**
	 * Get improvement bonus of accuracy stat.
	 * @see http://kancolle.wikia.com/wiki/Improvements
	 * @see http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#oe80ec59
	 */
	KC3Gear.prototype.accStatImprovementBonus = function(type = "fire") {
		if(this.isDummy()) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		let modifier = 0;
		switch(type.toLowerCase()) {
			case "fire":
				// Main gun/Secondary gun/AP shell/AAFD/Searchlight
				// wikia says Sonar gives shelling acc bonus?
				if([1, 2, 3, 4, 19, 29, 36, 42].includes(type2))
					modifier = 1;
				// Radar
				if([12, 13].includes(type2))
					modifier = this.isSurfaceRadar() ? 1.7 : 1;
				// Depth Charge Projector
				if([15].includes(type2))
					modifier = this.isDepthCharge() ? 0 : 0.333; // unknown
				break;
			case "torpedo":
				// AA Gun
				if([21].includes(type2)) modifier = 1; // unknown
				// Torpedo
				if([5, 32].includes(type2)) modifier = 2;
				break;
			case "yasen":
				// unknown
				break;
			case "asw":
				// Sonar
				if([14, 40].includes(type2))
					modifier = 1.3;
				break;
			default:
				console.warn("Unknown attack type:", type);
		}
		return modifier * Math.sqrt(stars);
	};

	/**
	 * Get improvement bonus of evasion stat.
	 * @see http://kancolle.wikia.com/wiki/Improvements
	 * @see http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#oe80ec59
	 */
	KC3Gear.prototype.evaStatImprovementBonus = function(type = "fire") {
		if(this.isDummy()) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		let modifier = 0;
		switch(type.toLowerCase()) {
			case "fire":
				// Engine Boiler
				if(type2 === 17) modifier = 1.5;
				break;
			case "torpedo":
				// Sonar
				if([14, 40].includes(type2)) modifier = 1.5;
				break;
			case "yasen":
				// unknown
				break;
			case "asw":
				// unknown
				break;
			default:
				console.warn("Unknown attack type:", type);
		}
		return modifier * Math.sqrt(stars);
	};

	/**
	 * Get improvement bonus of LoS stat.
	 * LoS improvement applied to eLoS (Formula 33), air contact, etc.
	 * @see http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#k9b5bd32
	 */
	KC3Gear.prototype.losStatImprovementBonus = function() {
		if(this.isDummy()) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		let modifier = 0;
		switch(type2) {
			case 12: // Small radar
				modifier = 1.25; break;
			case 13: // Large radar
				modifier = 1.4; break;
			case 9: // Recon plane
			case 10: // Seaplane recon
			case 49: // LB Recon
			case 59: // Jet Recon
			case 94: // Recon (II)
				modifier = 1.2; break;
			case 11: // Seaplane bomber
				modifier = 1.15; break;
		}
		return modifier * Math.sqrt(stars);
	};

	/**
	 * Get improvement bonus of anti-air fighters.
	 * @see http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#ic9d577c
	 */
	KC3Gear.prototype.aaStatImprovementBonus = function() {
		if(this.isDummy()) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		let modifier = 0;
		switch(type2) {
			case 6: // carrier-based fighter
				modifier = 0.2; break;
			case 7: // fighter bomber (dive bomber with AA stat)
				modifier = 0.25; break;
			case 45: // seaplane fighter
				// seaplane bomber no AA bonus found yet, but found DV & LoS bonus
				modifier = 0.2; break;
			case 48: // LB fighter or LB interceptor
				modifier = 0.2; break;
		}
		return modifier * stars;
	};

	/* FIGHTER POWER
	Get fighter power of this equipment on a slot
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterPower = function(capacity = 0){
		// Empty item means no fighter power
		if(this.isDummy()){ return 0; }

		// Check if this object is a fighter plane
		if(KC3GearManager.antiAirFighterType2Ids.indexOf( this.master().api_type[2] ) > -1){
			return Math.floor( Math.sqrt(capacity) * this.master().api_tyku );
		}

		// Equipment did not return on plane check, no fighter power
		return 0;
	};

	/* FIGHTER POWER: Proficiency Average
	Get fighter power of this equipment
	with added whole number average proficiency bonus
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterVeteran = function(capacity = 0, forLbas = false){
		// Empty item or slot means no fighter power
		if(this.isDummy() || capacity <= 0) { return 0; }

		var type2 = this.master().api_type[2],
			type3 = this.master().api_type[3];
		// Check if this object is a fighter plane
		if(KC3GearManager.antiAirFighterType2Ids.indexOf(type2) > -1
			|| (forLbas && KC3GearManager.landBaseReconnType2Ids.indexOf(type2) > -1)){
			var aceLevel = this.ace > 0 ? this.ace : 0,
				internalBonus = KC3Meta.airPowerAverageBonus(aceLevel),
				typeBonus = KC3Meta.airPowerTypeBonus(type2, aceLevel),
				averageBonus = internalBonus + typeBonus;
			var aaStat = this.master().api_tyku;
			aaStat += this.aaStatImprovementBonus();
			// Interceptor use evasion as interception stat against fighter
			var intStat = KC3GearManager.interceptorsType3Ids.indexOf(type3) > -1 ?
				this.master().api_houk : 0;
			aaStat += intStat * 1.5;
			return Math.floor( Math.sqrt(capacity) * aaStat + averageBonus );
		}

		// Equipment did not return on plane check, no fighter power
		return 0;
	};

	/* FIGHTER POWER: Proficiency with Bounds
	Get fighter power of this equipment
	as an array with lower and upper bound proficiency bonuses
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterBounds = function(capacity = 0, forLbas = false){
		// Empty item or slot means no fighter power
		if(this.isDummy() || capacity <= 0) { return [0, 0]; }

		var type2 = this.master().api_type[2],
			type3 = this.master().api_type[3];
		// Check if this object is a fighter plane,
		// Also take recon planes into account because they participate in LBAS battle.
		if(KC3GearManager.antiAirFighterType2Ids.indexOf(type2) > -1
			|| (forLbas && KC3GearManager.landBaseReconnType2Ids.indexOf(type2) > -1)){
			var aceLevel = this.ace > 0 ? this.ace : 0,
				internalExps = KC3Meta.airPowerInternalExpBounds(aceLevel),
				typeBonus = KC3Meta.airPowerTypeBonus(type2, aceLevel),
				bonusBounds = [
					Math.sqrt(internalExps[0] / 10) + typeBonus,
					Math.sqrt(internalExps[1] / 10) + typeBonus
				];
			
			var aaStat = this.master().api_tyku;
			aaStat += this.aaStatImprovementBonus();
			// Interceptor use evasion as interception stat against fighter
			var intStat = KC3GearManager.interceptorsType3Ids.indexOf(type3) > -1 ?
				this.master().api_houk : 0;
			aaStat += intStat * 1.5;

			return [
				Math.floor( Math.sqrt(capacity) * aaStat + bonusBounds[0] ),
				Math.floor( Math.sqrt(capacity) * aaStat + bonusBounds[1] ),
			];
		}

		// Equipment did not return on plane check, no fighter power
		return [0, 0];
	};
	
	/* FIGHTER POWER on Air Defense with INTERCEPTOR FORMULA
	 * Normal planes get usual fighter power formula
	 * Interceptor planes get two special stats: interception, anti-bomber
	see http://wikiwiki.jp/kancolle/?%B4%F0%C3%CF%B9%D2%B6%F5%C2%E2#sccf3a4c
	see http://kancolle.wikia.com/wiki/Land-Base_Aerial_Support#Fighter_Power_Calculations
	--------------------------------------------------------------*/
	KC3Gear.prototype.interceptionPower = function(capacity = 0){
		// Empty item or slot means no fighter power
		if(this.isDummy() || capacity <= 0) { return 0; }
		var type2 = this.master().api_type[2],
			type3 = this.master().api_type[3];
		// Check if this object is a interceptor plane or not
		if(KC3GearManager.interceptorsType3Ids.indexOf(type3) > -1) {
			var interceptPower = (
				// Base anti-air power
				this.master().api_tyku +
				// Interception is from evasion
				this.master().api_houk +
				// Anti-Bomber is from hit accuracy
				this.master().api_houm * 2 +
				// Although no interceptor can be improved for now
				this.aaStatImprovementBonus()
			) * Math.sqrt(capacity);
			
			// Add proficiency average bonus
			if(this.ace > 0){
				var internalBonus = KC3Meta.airPowerAverageBonus(this.ace),
					typeBonus = KC3Meta.airPowerTypeBonus(type2, this.ace),
					averageBonus = internalBonus + typeBonus;
				interceptPower += averageBonus;
			}
			
			return Math.floor(interceptPower);
		} else {
			return this.fighterVeteran(capacity, true);
		}
	};

	/**
	 * Get pre-cap opening airstrike power of this carrier-based aircraft.
	 * @return tuple of [low power, high power, isRange]
	 */
	KC3Gear.prototype.airstrikePower = function(capacity = 0, combinedFleetFactor = 0, isJetAssault = false){
		if(this.isDummy()) { return [0, 0, false]; }
		if(this.isAirstrikeAircraft()) {
			const type2 = this.master().api_type[2];
			const isTorpedoBomber = [8, 58].includes(type2);
			const isOtherBomber = [7, 11, 57].includes(type2);
			const isJet = [57, 58].includes(type2);
			let power = isTorpedoBomber ? this.master().api_raig : this.master().api_baku;
			power += this.attackPowerImprovementBonus("airstrike");
			power *= Math.sqrt(capacity);
			power += 25;
			power += combinedFleetFactor;
			if(isTorpedoBomber) {
				// 80% or 150% random modifier (both 50% chance) for torpedo bomber
				// modifier for unimplemented jet torpedo bomber unknown
				return [0.8 * power, 1.5 * power, true];
			} else {
				const typeModifier = isJet ? isJetAssault ? 1 : 1 / Math.sqrt(2) : 1;
				return [typeModifier * power, typeModifier * power, false];
			}
		}
		return [0, 0, false];
	};

	/**
	 * Get pre-cap support airstrike power from this land-based aircraft.
	 */
	KC3Gear.prototype.landbaseAirstrikePower = function(capacity = 0, targetShipId = 0){
		if(this.isDummy()) { return 0; }
		let result = 0;
		if(this.isAirstrikeAircraft()) {
			const type2 = this.master().api_type[2];
			const isTorpedoBomber = [8, 58].includes(type2);
			const isDiveBomber = [7, 11, 57].includes(type2);
			const isLandBaseAttacker = [47].includes(type2);
			const isJet = [57, 58].includes(type2);
			result += 25;
			let stat = isTorpedoBomber || isLandBaseAttacker ?
				this.master().api_raig : this.master().api_baku;
			let typeModifier = 1;
			if(isLandBaseAttacker) {
				typeModifier = 0.8;
				// use DV stat if LandBase Attack Aircraft against land installation
				if(targetShipId > 0 && KC3Master.ship(targetShipId).api_soku === 0) {
					stat = this.master().api_baku;
				}
			}
			if(isJet) typeModifier = 1 / Math.sqrt(2);
			result += Math.sqrt(1.8 * capacity) * stat;
			result *= typeModifier;
		}
		return result;
	};

	KC3Gear.prototype.bauxiteCost = function(slotCurrent, slotMaxeq){
		// Only used for the slot already equipped aircraft, unused for now
		if(this.isDummy()) { return 0; }
		if( KC3GearManager.carrierBasedAircraftType3Ids.indexOf( this.master().api_type[3] ) > -1){
			return KC3GearManager.carrierSupplyBauxiteCostPerSlot * (slotMaxeq - slotCurrent);
		}
		return 0;
	};

	// Following methods used to type equips not by category, but by functionality (stats).
	// Some special cases used just in case are defined at Ship object.
	// Handling data only from master defined at AntiAir module.

	KC3Gear.prototype.isAntiAirAircraft = function(){
		return this.exists() &&
			KC3GearManager.antiAirFighterType2Ids.indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tyku > 0;
	};

	KC3Gear.prototype.isAirstrikeAircraft = function(){
		return this.exists() &&
			KC3GearManager.airStrikeBomberType2Ids.indexOf(this.master().api_type[2]) > -1 &&
			(this.master().api_raig > 0 || this.master().api_baku > 0);
	};

	KC3Gear.prototype.isAswAircraft = function(forCvl = false, forSupport = false){
		/* These type of aircraft with asw stat > 0 can do (o)asw (support):
		 * - 7: Dive Bomber
		 * - 8: Torpedo Bomber (known 0 asw stat: Re.2001 G Kai)
		 * - 10: Seaplane Recon (only capable for ASW support)
		 * - 11: Seaplane Bomber
		 * - 25: Autogyro (CVL shelling incapable, but capable for CVE OASW and CVL ASW support)
		 * - 26: Anti-Sub PBY (CVL shelling incapable, but capable for CVE OASW and CVL ASW support)
		 * - 41: Large Flying Boat
		 * - 45: Seaplane Fighter (only capable for ASW support)
		 * - 47: Land Base Bomber (not equippable by ship anyway)
		 * - 57: Jet Bomber
		 * Game might just use the simple way: stat > 0 of any aircraft
		 */
		const type2Ids = !forCvl || forSupport ?
			KC3GearManager.aswAircraftType2Ids.slice(0) :
			KC3GearManager.aswAircraftType2Ids.filter(id => id !== 25 && id !== 26);
		if(forSupport) type2Ids.push(10, 45);
		return this.exists() &&
			type2Ids.indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tais > 0;
	};

	KC3Gear.prototype.isHighAswBomber = function(forLbas = false){
		// See http://wikiwiki.jp/kancolle/?%C2%E7%C2%EB
		// and official has announced high ASW ability aircraft is ASW stat >= 7.
		// Carrier-based or Land-base bombers for now;
		// Torpedo bombers current implemented:
		//   T97 / Tenzan (931 Air Group) variants, Swordfish Mk.III (Skilled), TBM-3D
		// LB attackers current implemented:
		//   Toukai variants
		// Dive bombers still NOT capable for OASW, unknown for LBAS:
		//   Ju87C Kai Ni (w/ KMX) variants
		// AS-PBY, Autogyro capable for OASW:
		//   https://twitter.com/FlatIsNice/status/966332515681296384
		// Seaplane Recon capable for LBAS ASW attack:
		//   Type 0 Model 11B variants
		const type2Ids = forLbas ? [8, 10, 47] : [8, 25, 26];
		return this.exists() &&
			type2Ids.indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tais > 6;
	};

	KC3Gear.prototype.isContactAircraft = function(isSelection = false){
		// Contact trigger-able by Recon Aircraft, Recon Seaplane, Large Flying Boat, LB Recon?
		// Contact select-able by previous 3 types, plus Torpedo Bomber
		const type2 = isSelection ? [8, 9, 10, 41, 49, 58, 59, 94] : [9, 10, 41, 49, 59, 94];
		return this.exists() &&
			type2.indexOf(this.master().api_type[2]) > -1;
	};

	KC3Gear.prototype.isAirRadar = function(){
		return this.exists() &&
			[12, 13].indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tyku > 1;
	};

	KC3Gear.prototype.isSurfaceRadar = function(){
		// currently uses high LoS definition instead of high accuracy one
		return this.isHighLineOfSightRadar();
	};

	KC3Gear.prototype.isHighLineOfSightRadar = function(){
		/* Another speculation of 'isSurfaceRadar' definition:
		   uses 'api_saku > 4' instead of 'api_houm > 2',
		   which the only difference is including '[278] SK Radar' large radar.
		   sample: DD Kasumi K2 + SK Radar + Model C gun gets synergy bonus. */
		return this.exists() &&
			[12, 13].indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_saku > 4;
	};

	KC3Gear.prototype.isHighAccuracyRadar = function(){
		/* Here not call it 'isSurfaceRadar', because it's indeed including some Air Radars.
		 The guess why KC devs suppose to judge 'Surface Radar' by 'api_houm > 2':
		 since the accuracy <= 2 for all Air Radars in Small Radar category,
		 but they have forgotten there are Air Radars with accuracy > 2 in Large Radar category,
		 and there is a Destroyer (Kasumi K2) who can equip Large Radar... */
		return this.exists() &&
			[12, 13].indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_houm > 2;
	};

	KC3Gear.prototype.isAafdBuiltinHighAngleMount = function(){
		return this.exists() &&
			[1, 4].indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tyku > 7;
	};

	KC3Gear.prototype.isCdMachineGun = function(){
		return this.exists() &&
			this.master().api_type[2] === 21 &&
			this.master().api_tyku > 8;
	};

	KC3Gear.prototype.isDepthCharge = function(){
		/* In-game, newly implemented Depth Charge are counted as different items in kinds of scenes,
		 but their type in category or icon is the same with Depth Charge Projector.
		 To differentiate them, the only method for now is a white-list of IDs. */
		return this.exists() && this.master().api_type[2] === 15 &&
		// Current implemented: Type95 DC, Type2 DC
			[226, 227].indexOf(this.masterId) > -1;
	};

	KC3Gear.prototype.isDepthChargeProjector = function(){
		return this.exists() && this.master().api_type[2] === 15 &&
			// Current implemented: Type94 DCP, Type3 DCP, Type3 DCP CD, 15cm9t ASW Rocket
			//[44, 45].indexOf(this.masterId) > -1;
			// To maintenance fewer lists
			!this.isDepthCharge();
	};

	KC3Gear.prototype.aaDefense = function(forFleet) {
		if (this.isDummy()) { return 0; }
		// permissive on "this.stars" in case the improvement level is not yet available.
		var stars = (typeof this.stars === "number") ? this.stars : 0;
		return KC3Gear.aaDefense( this.master(), stars, forFleet );
	};

	// there is no need of any Gear instance to calculate this
	// as long as we know the improvement level
	// serves as a shortcut to AntiAir module
	KC3Gear.aaDefense = function(mst, stars, forFleet) {
		return AntiAir.calcEquipmentAADefense(mst, stars, forFleet);
	};

	/**
	 * Build tooltip HTML of this Gear. Used by Panel/Strategy Room.
	 */
	KC3Gear.prototype.htmlTooltip = function(slotSize, onShipOrLandbase) {
		return KC3Gear.buildGearTooltip(this, slotSize !== undefined, slotSize, onShipOrLandbase);
	};
	/** Also export a static method */
	KC3Gear.buildGearTooltip = function(gearObj, altName, slotSize, shipOrLb) {
		if(!gearObj || gearObj.isDummy()) { return ""; }
		const gearData = gearObj.master();
		const title = $('<div><span class="name"></span><br/></div>');
		var nameText = altName || gearObj.name();
		if(altName === true){
			nameText = gearObj.name();
			if(gearObj.stars > 0){ nameText += " \u2605{0}".format(gearObj.stars); }
			if(gearObj.ace > 0){ nameText += " \u00bb{0}".format(gearObj.ace); }
			if(slotSize !== undefined && gearData &&
				(KC3GearManager.carrierBasedAircraftType3Ids.indexOf(gearData.api_type[3]) >- 1
				|| KC3GearManager.landBasedAircraftType3Ids.indexOf(gearData.api_type[3]) >- 1)){
				nameText += " x{0}".format(slotSize);
			}
		}
		$(".name", title).text(nameText);
		// Some stats only shown at Equipment Library, omitted here.
		const planeStats = ["or", "kk"];
		$.each([
			["hp", "taik"],
			["fp", "houg"],
			["ar", "souk"],
			["tp", "raig"],
			["dv", "baku"],
			["aa", "tyku"],
			["as", "tais"],
			["ht", "houm"],
			["ev", "houk"],
			["ls", "saku"],
			["rn", "leng"],
			["or", "distance"]
		], function(index, sdata) {
			const statBox = $('<div><img class="icon stats_icon_img"/> <span class="value"></span>&nbsp;</div>');
			statBox.css("font-size", "11px");
			if((gearData["api_" + sdata[1]] || 0) !== 0 && (
				!planeStats.includes(sdata[0]) || (planeStats.includes(sdata[0]) &&
					KC3GearManager.landBasedAircraftType3Ids.includes(gearData.api_type[3]))
			)) {
				$(".icon", statBox).attr("src", KC3Meta.statIcon(sdata[0]));
				$(".icon", statBox).css("max-width", 15).height(13).css("margin-top", "-3px");
				if(sdata[0] === "rn") {
					$(".value", statBox).text(KC3Meta.gearRange(gearData["api_" + sdata[1]]));
				} else {
					$(".value", statBox).text(gearData["api_" + sdata[1]]);
				}
				title.append(statBox.html());
			}
		});
		if(slotSize !== undefined && shipOrLb && gearObj.isAntiAirAircraft()) {
			KC3Gear.appendFighterPowerTooltip(title, gearObj, slotSize, shipOrLb);
		}
		if(slotSize !== undefined && shipOrLb && gearObj.isAirstrikeAircraft()) {
			KC3Gear.appendAirstrikePowerTooltip(title, gearObj, slotSize, shipOrLb);
		}
		return title.html();
	};
	KC3Gear.appendFighterPowerTooltip = function(tooltipTitle, gearObj, slotSize, shipOrLb) {
		const airBox = $('<div><img class="icon stats_icon_img"/> <span class="value"></span></div>');
		airBox.css("font-size", "11px");
		$(".icon", airBox).attr("src", KC3Meta.statIcon("if"));
		$(".icon", airBox).width(13).height(13).css("margin-top", "-3px");
		let pattern, value;
		switch(ConfigManager.air_formula) {
			case 2:
				pattern = "\u2248{0}";
				value = gearObj.fighterVeteran(slotSize);
				break;
			case 3:
				pattern = "{0}~{1}";
				value = gearObj.fighterBounds(slotSize);
				break;
			default:
				pattern = "{0}";
				value = gearObj.fighterPower(slotSize);
		}
		$(".value", airBox).text(pattern.format(value));
		// interception power only applied to aircraft deployed to land base
		if(shipOrLb instanceof KC3LandBase) {
			const interceptSpan = $('<div><img class="icon stats_icon_img"/> <span class="value"></span></div>');
			$(".icon", interceptSpan).attr("src", KC3Meta.statIcon("ib"));
			$(".icon", interceptSpan).width(13).height(13).css("margin-top", "-3px");
			$(".value", interceptSpan).text(gearObj.interceptionPower(slotSize));
			airBox.append("&emsp;").append(interceptSpan.html());
		}
		tooltipTitle.append("<br/>").append(airBox.html());
	};
	KC3Gear.appendAirstrikePowerTooltip = function(tooltipTitle, gearObj, slotSize, shipOrLb) {
		const gearMaster = gearObj.master();
		if(shipOrLb instanceof KC3LandBase) {
			// Land installation / submarine target not taken into account here
			const lbasPower = Math.floor(gearObj.landbaseAirstrikePower(slotSize));
			// Kinds of land-based modifiers:
			const isLbaa = gearMaster.api_type[2] === 47;
			const lbAttackerModifier = isLbaa ? 1.8 : 1;
			let concatModifier = 1;
			// TODO contact plane should be gotten from LBAS support section, wave by wave
			const contactPlaneId = 0;
			if(contactPlaneId > 0) {
				const contactPlaneAcc = KC3Master.slotitem(contactPlaneId).api_houm;
				concatModifier = contactPlaneAcc >= 3 ? 1.2 : contactPlaneAcc >= 2 ? 1.17 : 1.12;
			}
			const isEnemyCombined = KC3Calc.collectBattleConditions().isEnemyCombined || false;
			const enemyCombinedModifier = isEnemyCombined ? 1.1 : 1;
			// TODO uncertain modifier for LBAA against some enemies,
			// seems be (3.1, 3.5) for 6-5 Abyssal Carrier Princess
			// https://twitter.com/muu_1106/status/850875064106889218
			const lbaaAbyssalModifier = 1;
			// Postcap LBAA recon modifier if LB recon is present
			// https://twitter.com/syoukuretin/status/1068477784232587264
			// https://twitter.com/Nishisonic/status/1080146808318263296
			let lbaaReconModifier = 1;
			if(isLbaa) {
				// Check LB recon and set the value according FP modifier
				const lbfpReconModifier = shipOrLb.toShipObject().fighterPowerReconModifier(true);
				lbaaReconModifier = lbfpReconModifier === 1.15 ? 1.125 :
					lbfpReconModifier === 1.18 ? 1.15 : 1;
			}
			const onNormal = Math.floor(lbasPower
				* lbAttackerModifier * concatModifier * lbaaAbyssalModifier * enemyCombinedModifier * lbaaReconModifier);
			// Proficiency critical modifier has been applied sometime since 2017-12-11?
			// Modifier calculation is the same, but different from carrier-based,
			// modifiers for squadron slots are independent and no first slot bonus.
			const aceLevel = gearObj.ace || 0;
			const expBonus = [0, 1, 2, 3, 4, 5, 7, 10];
			const internalExpLow = KC3Meta.airPowerInternalExpBounds(aceLevel)[0];
			const proficiencyCriticalModifier = 1 + (Math.floor(Math.sqrt(internalExpLow) + (expBonus[aceLevel] || 0)) / 100);
			const criticalModifier = 1.5;
			const onCritical = Math.floor(Math.floor(lbasPower * criticalModifier * proficiencyCriticalModifier)
				* lbAttackerModifier * concatModifier * lbaaAbyssalModifier * enemyCombinedModifier * lbaaReconModifier);
			const powBox = $('<div><img class="icon stats_icon_img"/> <span class="value"></span></div>');
			powBox.css("font-size", "11px");
			$(".icon", powBox).attr("src", KC3Meta.statIcon(isLbaa ? "rk" : "kk"));
			$(".icon", powBox).width(13).height(13).css("margin-top", "-3px");
			$(".value", powBox).text("{0}({1})".format(onNormal, onCritical));
			tooltipTitle.append("<br/>").append(powBox.html());
		} else if(shipOrLb instanceof KC3Ship) {
			const powerRange = gearObj.airstrikePower(slotSize);
			const isRange = !!powerRange[2];
			const isOverCap = [powerRange[0] > 150, powerRange[1] > 150];
			const contactPlaneId = shipOrLb.collectBattleConditions().contactPlaneId;
			const afterCap = [
				shipOrLb.applyPowerCap(powerRange[0], "Day", "Aerial").power,
				isRange ? shipOrLb.applyPowerCap(powerRange[1], "Day", "Aerial").power : 0
			];
			const onNormal = [
				Math.floor(shipOrLb.applyPostcapModifiers(afterCap[0], "Aerial", undefined, contactPlaneId, false).power),
				isRange ? Math.floor(shipOrLb.applyPostcapModifiers(afterCap[1], "Aerial", undefined, contactPlaneId, false).power) : 0
			];
			const onCritical = [
				Math.floor(shipOrLb.applyPostcapModifiers(afterCap[0], "Aerial", undefined, contactPlaneId, true).power),
				isRange ? Math.floor(shipOrLb.applyPostcapModifiers(afterCap[1], "Aerial", undefined, contactPlaneId, true).power) : 0
			];
			const powBox = $('<div><img class="icon stats_icon_img"/> <span class="value"></span></div>');
			powBox.css("font-size", "11px");
			$(".icon", powBox).attr("src", KC3Meta.statIcon(isRange ? "rk" : "kk"));
			$(".icon", powBox).width(13).height(13).css("margin-top", "-3px");
			let valueBox = $('<div><span class="vl"></span>(<span class="vlc"></span>)</div>');
			$(".vl", valueBox).text(onNormal[0]);
			if(isOverCap[0]) $(".vl", valueBox).addClass("power_capped");
			$(".vlc", valueBox).text(onCritical[0]);
			if(isOverCap[0]) $(".vlc", valueBox).addClass("power_capped");
			$(".value", powBox).append(valueBox.html());
			if(isRange) {
				let valueBox = $('<div><span class="vh"></span>(<span class="vhc"></span>)</div>');
				$(".vh", valueBox).text(onNormal[1]);
				if(isOverCap[1]) $(".vh", valueBox).addClass("power_capped");
				$(".vhc", valueBox).text(onCritical[1]);
				if(isOverCap[1]) $(".vhc", valueBox).addClass("power_capped");
				$(".value", powBox).append(" / ").append(valueBox.html());
			}
			tooltipTitle.append("<br/>").append(powBox.html());
		}
		return tooltipTitle;
	};

	// prepare info necessary for deckbuilder
	KC3Gear.prototype.deckbuilder = function() {
		if (this.masterId <= 0)
			return false;
		var result = {id: this.masterId};
		if (typeof this.stars !== "undefined" &&
			this.stars > 0)
			result.rf = this.stars;
		if (typeof this.ace !== "undefined" &&
			this.ace > 0)
			result.mas = this.ace;
		return result;
	};
})();
