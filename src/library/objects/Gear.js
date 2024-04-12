/* Gear.js
KC3改 Equipment Object
*/
(function(){
	"use strict";

	window.KC3Gear = function( data, toClone ){
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

			// Initialized with formatted data, deep clone if demanded
			} else {
				if(!!toClone)
					$.extend(true, this, data);
				else
					// jquery: can not use `extend(false, this, data)`
					$.extend(this, data);
			}
		}
	};

	KC3Gear.prototype.exists = function(){ return this.itemId > 0 && this.masterId > 0 && this.master() !== false; };
	KC3Gear.prototype.isDummy = function(){ return ! this.exists(); };
	KC3Gear.prototype.master = function(){ return KC3Master.slotitem( this.masterId ); };
	KC3Gear.prototype.name = function(){ return KC3Meta.gearNameById( this.masterId ); };

	/**
	 * @return {Object} a bonus definition table with new counters.
	 * @see KC3GearBonus - in where the actual data defined.
	 * @see #accumulateShipBonusGear - to accumulate counters according ship's actual equipment.
	 */
	KC3Gear.explicitStatsBonusGears = function(){
		return KC3GearBonus.explicitStatsBonusGears();
	};

	/**
	 * Accmulate bonus from 1 piece of equipment to an existed bonus definition table.
	 * @param {Object} bonusGears - the bonus definition table to be accmulated.
	 * @param {Object} gear - the gear object instance equipped by the ship.
	 * @see KC3Ship.prototype.equipmentTotalStats
	 */
	KC3Gear.accumulateShipBonusGear = function(bonusGears, gear){
		const gearTypes = gear.master().api_type || [];
		const synergyGears = bonusGears.synergyGears;
		if(synergyGears) {
			Object.keys(synergyGears).forEach(key => {
				if(key.endsWith("Ids") && Array.isArray(synergyGears[key])) {
					switch(key) {
						case "surfaceRadarIds":
							if(gear.isSurfaceRadar()) synergyGears.surfaceRadar += 1;
						break;
						case "airRadarIds":
							if(gear.isAirRadar()) synergyGears.airRadar += 1;
						break;
						case "highAccuracyRadarIds":
							// caution: different definition with #isHighAccuracyRadar (>= 3)
							if(gearTypes[1] === 8 && gear.master().api_houm >= 8)
								synergyGears.highAccuracyRadar += 1;
						break;
						case "rotorcraftIds":
							if(gearTypes[2] === 25) synergyGears.rotorcraft += 1;
						break;
						case "aaMachineGunIds":
							if(gearTypes[2] === 21) synergyGears.aaMachineGun += 1;
						break;
						default:
							const baseKey = key.slice(0, -3);
							if(synergyGears[key].includes(gear.masterId)) {
								const minStars = synergyGears[baseKey + "MinStars"];
								if(minStars > 0 && (!gear.stars || gear.stars < minStars)) break;
								synergyGears[baseKey] += 1;
								if(synergyGears[baseKey + "Nonexist"]) synergyGears[baseKey + "Nonexist"] = 0;
							}
					}
				}
			});
		}
		const addupStarsDistribution = (bonusDefs) => {
			if(Array.isArray(bonusDefs.starsDist)) {
				bonusDefs.starsDist[gear.stars || 0] = 1 + (bonusDefs.starsDist[gear.stars || 0] || 0);
			}
		};
		const bonusDefs = bonusGears[gear.masterId];
		if(bonusDefs) {
			if(bonusDefs.count >= 0) bonusDefs.count += 1;
			addupStarsDistribution(bonusDefs);
		}
		const type2Key = "t2_" + gearTypes[2];
		const type3Key = "t3_" + gearTypes[3];
		if(gearTypes.length && bonusGears[type2Key]) {
			const bonusDefs = bonusGears[type2Key];
			if(bonusDefs.count >= 0) bonusDefs.count += 1;
			addupStarsDistribution(bonusDefs);
		}
		if(gearTypes.length && bonusGears[type3Key]) {
			const bonusDefs = bonusGears[type3Key];
			if(bonusDefs.count >= 0) bonusDefs.count += 1;
			addupStarsDistribution(bonusDefs);
		}
	};

	/**
	 * @param bonusGears - the accmulated bonus definition table.
	 * @param {Object} ship - the ship object instance with bonus equipment.
	 * @param {string} apiName - the api name of gear stat given to the ship.
	 * @return {number} ship's bonus of specified stat (by api name) based on accmulated bonus definition table.
	 * @see KC3Ship.prototype.equipmentTotalStats
	 */
	KC3Gear.equipmentTotalStatsOnShipBonus = function(bonusGears, ship, apiName){
		var total = 0;
		const shipMasterId = ship.masterId;
		const shipOriginId = RemodelDb.originOf(shipMasterId);
		const shipClassId = ship.master().api_ctype;
		const shipTypeId = ship.master().api_stype;
		const synergyGears = bonusGears.synergyGears || {};
		const addBonusToTotalIfNecessary = (bonusDef, gearInfo) => {
			// Conditional filters, combinations are logic AND, all filters existed have to be passed
			if(Array.isArray(bonusDef.ids) && !bonusDef.ids.includes(shipMasterId)) { return; }
			if(Array.isArray(bonusDef.excludes) && bonusDef.excludes.includes(shipMasterId)) { return; }
			if(Array.isArray(bonusDef.origins) && !bonusDef.origins.includes(shipOriginId)) { return; }
			if(Array.isArray(bonusDef.excludeOrigins) && bonusDef.excludeOrigins.includes(shipOriginId)) { return; }
			if(Array.isArray(bonusDef.classes) && !bonusDef.classes.includes(shipClassId)) { return; }
			if(Array.isArray(bonusDef.excludeClasses) && bonusDef.excludeClasses.includes(shipClassId)) { return; }
			if(Array.isArray(bonusDef.stypes) && !bonusDef.stypes.includes(shipTypeId)) { return; }
			if(Array.isArray(bonusDef.excludeStypes) && bonusDef.excludeStypes.includes(shipTypeId)) { return; }
			if(Array.isArray(bonusDef.distinctGears)) {
				const flagsKey = "countOnceIds" + bonusDef.distinctGears.join("_");
				synergyGears[flagsKey] = (synergyGears[flagsKey] || 0) + 1;
				if(synergyGears[flagsKey] > 1) { return; }
			}
			if(bonusDef.remodel || bonusDef.remodelCap) {
				const remodelGroup = RemodelDb.remodelGroup(shipMasterId);
				if(remodelGroup.indexOf(shipMasterId) < bonusDef.remodel) { return; }
				if(remodelGroup.indexOf(shipMasterId) > bonusDef.remodelCap) { return; }
			}
			let gearCount = gearInfo.count;
			if(bonusDef.minStars && gearInfo.starsDist) {
				gearCount = gearInfo.starsDist.slice(bonusDef.minStars).sumValues();
				if(!gearCount) { return; }
			}
			if(bonusDef.minCount) {
				let reqMinCount = gearCount;
				if(Array.isArray(bonusDef.distinctGears)) {
					reqMinCount = bonusDef.distinctGears.reduce(
						(acc, id) => (acc + (bonusGears[id] || {}).count || 0), 0
					);
				}
				if(reqMinCount < bonusDef.minCount) { return; }
			}
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
							if(synergy.byCount.distinct) {
								const flagsKey = synergy.flags.join("_") + "Applied";
								synergyGears[flagsKey] = (synergyGears[flagsKey] || 0) + 1;
								if(synergyGears[flagsKey] < 2) {
									total += (synergy.byCount[countAmount] || {})[apiName] || 0;
								}
							} else {
								total += (synergy.byCount[countAmount] || {})[apiName] || 0;
							}
						}
						if(synergy.byStars) {
							const gearMstId = synergy.byStars.gearId;
							const starDist = (bonusGears[gearMstId] || {}).starsDist || [];
							const isMultiple = !!synergy.byStars.multiple;
							const countCap = synergy.byStars.countCap || Number.POSITIVE_INFINITY;
							const lessStars = synergy.byStars.noStarsLessThan;
							if(!lessStars || starDist.slice(0, lessStars).sumValues() === 0) {
								Object.keys(synergy.byStars).forEach(starStr => {
									const minStars = parseInt(starStr);
									if(!isNaN(minStars)) {
										const synergyGearCount = starDist.slice(minStars).sumValues();
										if(synergyGearCount > 0) {
											total += ((synergy.byStars[starStr] || {})[apiName] || 0) * Math.min(countCap, isMultiple ? synergyGearCount : 1);
										}
									}
								});
							}
						}
					}
				};
				if(Array.isArray(bonusDef.synergy)) {
					bonusDef.synergy.forEach(addBonusFromSynergyGears);
				} else {
					addBonusFromSynergyGears(bonusDef.synergy);
				}
			}
			// Limit speed here only affect this bonus item, multiple speed bonuses could over cap
			if(bonusDef.speedCap && apiName === "soku") {
				total = Math.min(bonusDef.speedCap, total);
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
						if(typeof byClass !== "object") {
							byClass = gearInfo.byClass[byClass] || {};
						}
						if(Array.isArray(byClass)) {
							byClass.forEach(c => addBonusToTotalIfNecessary(c, gearInfo));
						} else {
							addBonusToTotalIfNecessary(byClass, gearInfo);
						}
					}
				}
				if(gearInfo.byNation) {
					const nationName = KC3Meta.countryNameByCtype(shipClassId);
					let byNation = gearInfo.byNation[nationName];
					if(byNation) {
						if(typeof byNation === "string") {
							byNation = gearInfo.byNation[byNation] || {};
						}
						if(typeof byNation === "number") {
							byNation = gearInfo.byClass[byNation] || {};
						}
						if(Array.isArray(byNation)) {
							byNation.forEach(c => addBonusToTotalIfNecessary(c, gearInfo));
						} else {
							addBonusToTotalIfNecessary(byNation, gearInfo);
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
	 *                        `fire`, `torpedo`, `yasen`, `asw`, `airstrike`, `lbas`, `support`, `exped`
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
					case 34: // Command Facility
					case 35: // Aviation Personnel
					case 36: // AA Fire Director
					case 37: // Anti-Ground Rocket
					case 39: // Skilled Lookouts
					case 46: // Amphibious Tank
					case 52: // Landing Force
					case 54: // Smoke Generator
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
						// 0.3 per star for Secondary (II) guns?
						// https://twitter.com/hedgehog_hasira/status/1545868174259720192
						} else if([467].includes(this.masterId)) {
							return 0.3 * stars;
						} else {
							modifier = this.master().api_type[3] === 16 ? 0.2 : 0.3;
							return modifier * stars;
						}
						break;
					case 7: // Dive Bomber
					case 57: // Jet Fighter Bomber
						// only applied if not a fighter bomber, btw fighter bomber get AA bonus instead
						if(!this.isFighterBomber()) return 0.2 * stars;
						break;
					case 8: // Torpedo Bomber
					case 58: // Jet Torpedo Bomber
						return 0.2 * stars;
					case 14: // Sonar
					case 40: // Large Sonar
						modifier = 0.75; break;
					case 15: // Depth Charge (Projector)
						// DCP and mortars give shelling fire power:
						// https://twitter.com/dd_izokaze_fake/status/1164149227024334848
						// DC too, except these items:
						// https://twitter.com/hedgehog_hasira/status/1509928826117054469
						modifier = [226, 227, 488].includes(this.masterId) ? 0 : 0.75;
						break;
				}
				break;
			case "torpedo":
				// Torpedo or AA Machine Gun
				if([5, 21].includes(type2))
					modifier = 1.2;
				// Submarine Torpedo
				// https://twitter.com/CC_jabberwock/status/1492866480102248451
				if(type2 === 32)
					return 0.2 * stars;
				break;
			case "yasen":
				// Known standard sqrt(stars), see equiptype for api_type[2]
				if([1, 2, 3, 5, 19, 22, 24, 29, 34, 35, 36, 37, 38, 39, 42, 46, 52, 54].includes(type2))
					modifier = 1;
				else switch(type2) {
					case 4: // Secondary guns, same values with day shelling fire
						if([11, 134, 135].includes(this.masterId)) {
							modifier = 1;
						// https://twitter.com/hedgehog_hasira/status/1546101225069826049
						} else if([467].includes(this.masterId)) {
							return 0.3 * stars;
						} else {
							modifier = this.master().api_type[3] === 16 ? 0.2 : 0.3;
							return modifier * stars;
						}
						break;
					case 32: // Submarine Torpedo
						// Has changed from sqrt(stars) since 2022-01-22?
						// https://twitter.com/CC_jabberwock/status/1492881101131436034
						return 0.2 * stars;
					case 7: // Dive Bomber
					case 57: // Jet Fighter Bomber
						// Zero Fighter Model 62 (Fighter-bomber Iwai Squadron) gets power bonus either?
					case 8: // Torpedo Bomber
					case 58: // Jet Torpedo Bomber
						// Uncertained, sqrt(stars) suspected?
						// https://twitter.com/myteaGuard/status/1360886212274216963
						modifier = 1;
						break;
				}
				break;
			case "asw":
				// Depth Charge or Sonar
				if([14, 15, 40].includes(type2))
					modifier = 1;
				// Dive Bomber, 0.2 per star
				if([7, 57].includes(type2) && (
					// Type 0 Fighter Model 64 variants counted as both
					!this.isFighterBomber() || [447, 487].includes(this.masterId)
				))	return 0.2 * stars;
				// Torpedo Bomber, 0.2 per star
				if([8, 58].includes(type2))
					return 0.2 * stars;
				// Autogyro or Helicopter
				// weaker than "O Type Observation Autogyro Kai Ni" (asw 11) changed to 0.2?
				if(type2 === 25)
					return (this.master().api_tais > 10 ? 0.3 : 0.2) * stars;
				// Anti-Sub PBY, Kai & ASW: 0.3 vs 0.2?
				// https://twitter.com/CC_jabberwock/status/1522610871788212226
				// https://twitter.com/yukicacoon/status/1522783905350565889
				// https://twitter.com/CC_jabberwock/status/1621947944596557824
				if(type2 === 26)
					return (this.master().api_tais > 7 ? 0.3 : 0.2) * stars;
				// Toukai variants lbas airstrike against sub might be 0.66
				//if(type2 === 47)
				//	return 0.66;
				break;
			case "airstrike":
			case "lbas":
				// for normal opening airstrike and lbas, dive/torpedo/seaplane bomber bonus confirmed
				if([7, 57].includes(type2) && !this.isFighterBomber()) return 0.2 * stars;
				if([8, 58, 11].includes(type2)) return 0.2 * stars;
				// land-base attacker/heavybomber against surface
				// Type 4 Heavy Bomber Hiryuu (Skilled) + I-go Model 1A Guided Missile seems be different:
				// https://twitter.com/kancolle_aki/status/1732452282611154982
				if([47, 53].includes(type2)) modifier = [484].includes(this.masterId) ? 0.75 : 0.7;
				break;
			case "support":
				// No any improvement bonus found for support fleet for now
				break;
			case "exped":
				// Fire power bonus for monthly/combat expeditions
				// https://wikiwiki.jp/kancolle/%E9%81%A0%E5%BE%81#about_stat
				switch (type2) {
					case 1: // Small main gun
						modifier = 0.5; break;
					case 2: // Medium main gun
					case 3: // Large main gun
						modifier = 1; break;
					case 4: // Secondary gun
						return 0.15 * stars;
					case 12: // Small radar
						// https://twitter.com/jo_swaf/status/1370544125703979008
						modifier = 0.5; break;
					case 13: // Large radar
						modifier = 1; break;
					case 19: // AP Shell
					case 21: // AA Machine Gun
						modifier = 0.5; break;
				}
				// Test only return 1 decimal for expeditions
				// https://twitter.com/myteaGuard/status/1375386223217238017
				return Math.qckInt("floor", modifier * Math.sqrt(stars), 1);
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
			case "exped":
			case "fire":
				// Main gun/Secondary gun/T3/AP shell/AAFD/FCF/Searchlight/Lookouts/DLC/T2Tank
				if([1, 2, 3, 4, 18, 19, 24, 29, 34, 36, 39, 42, 46].includes(type2))
					modifier = 1;
				// Radar
				if([12, 13].includes(type2))
					modifier = this.isHighAccuracyRadar() ? 1.7 : 1;
				// Depth Charge Projector
				// no bonus on shelling fire? neither for Sonar: https://twitter.com/Divinity__123/status/1528385260567797760
				//if([15].includes(type2))
				//	modifier = this.isDepthCharge() ? 0 : 0.333; // mod unknown
				break;
			case "torpedo":
				// AA Gun
				if([21].includes(type2)) modifier = 1; // mod unknown
				// Torpedo
				if([5, 32].includes(type2)) modifier = 2;
				break;
			case "yasen":
				// Similar with day shelling, additional Torpedo/Minisub
				// https://twitter.com/Divinity_123/status/1680199577989685251
				if([1, 2, 3, 4, 5, 18, 19, 22, 24, 29, 34, 36, 39, 42, 46].includes(type2))
					modifier = 1.3;
				// Radar
				if([12, 13].includes(type2))
					modifier = this.isHighAccuracyRadar() ? 1.6 : 1.3;
				break;
			case "asw":
				// Sonar
				if([14, 40].includes(type2))
					modifier = 1.3;
				break;
			case "support":
				// unknown
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
			case "exped":
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
	KC3Gear.prototype.losStatImprovementBonus = function(type = "fire") {
		if (this.isDummy()) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		let modifier = 0;
		if (type.toLowerCase() === "exped") {
			switch (type2) {
				case 12: // Small radar
					modifier = 1; break;
				case 13: // Large radar
				case 93: // Large radar (II)
				case 10: // Seaplane recon
					modifier = 0.95; break;
			}
			return Math.qckInt("floor", modifier * Math.sqrt(stars), 1);
		}
		switch (type2) {
			case 12: // Small radar
				modifier = 1.25; break;
			case 13: // Large radar
			case 93: // Large radar (II)
				modifier = 1.4; break;
			case 9: // Recon plane
			case 94: // Recon (II)
			case 10: // Seaplane recon
			case 41: // Large Flying Boat
			case 49: // LB Recon
			case 59: // Jet Recon
				modifier = 1.2; break;
			case 11: // Seaplane bomber
				modifier = 1.15; break;
			case 26: // Anti-Sub PBY
				modifier = 1; break;
		}
		return modifier * Math.sqrt(stars);
	};

	/**
	 * Get improvement bonus of anti-air fighters.
	 * @see AntiAir.js - for bonus of AA defense.
	 * @see http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#ic9d577c
	 */
	KC3Gear.prototype.aaStatImprovementBonus = function(type = "fire") {
		if (this.isDummy()) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		let modifier = 0;
		if (type.toLowerCase() === "exped") {
			switch (type2) {
				case 1: // Small main gun
				case 2: // Medium main gun
				case 4: // Secondary gun
					const type3 = this.master().api_type[3];
					// 16 => HA gun
					if ([16].includes(type3)) {
						modifier = 1; break;
					}
					break;
				case 21: // Machine gun
					modifier = 1; break;
			}
			return Math.qckInt("floor", modifier * Math.sqrt(stars), 1);
		}
		switch (type2) {
			case 6: // Carrier-based fighter
			case 45: // Seaplane fighter. Seaplane bomber no AA bonus found yet, but found DV & LoS bonus
			case 48: // LB fighter or LB interceptor
			case 49: // LB recon, uncertain: all? or AA > 2 like fighter bomber?
				// for now: https://twitter.com/noro_006/status/1628605249492766721
				// btw, no proficiency type bonus: https://twitter.com/noro_006/status/1628593477134209024
				modifier = 0.2; break;
			case 7: // Fighter bomber
			case 57: // Jet fighter bomber
				if(this.isFighterBomber()) modifier = 0.25;
				break;
			case 41: // Large Flying Boat, uncertain?
				return 0.25 * Math.sqrt(stars);
			case 47: // LB attacker
			case 53: // LB heavy bomber
				return 0.5 * Math.sqrt(stars);
		}
		return modifier * stars;
	};

	/**
	 * Get improvement bonus of ASW stat. Expeditions only for now.
	 */
	KC3Gear.prototype.aswStatImprovementBonus = function(type = "exped") {
		if (this.isDummy()) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		let modifier = 0;
		if (type.toLowerCase() === "exped") {
			switch (type2) {
				case 14: // Sonar
				case 15: // Depth Charge
				case 40: // Large Sonar
					modifier = 1; break;
			}
			return Math.qckInt("floor", modifier * Math.sqrt(stars), 1);
		}
		return modifier * Math.sqrt(stars);
	};

	/* FIGHTER POWER
	Get fighter power of this equipment on a slot,
	for scenes without proficiency and improvement bonus
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterPower = function(capacity = 0, forLbas = false){
		// Empty item means no fighter power
		if(this.isDummy()){ return 0; }

		var type2 = this.master().api_type[2];
		// Check if this object is a fighter plane
		if(this.isAntiAirAircraft(forLbas)){
			return Math.floor( Math.sqrt(capacity) * (this.master().api_tyku || 0) );
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

		var type2 = this.master().api_type[2];
		// Check if this object is a fighter plane
		if(this.isAntiAirAircraft(forLbas)){
			var aceLevel = this.ace > 0 ? this.ace : 0,
				internalBonus = KC3Meta.airPowerAverageBonus(aceLevel),
				typeBonus = KC3Meta.airPowerTypeBonus(type2, aceLevel),
				averageBonus = internalBonus + typeBonus;
			var aaStat = this.master().api_tyku || 0;
			aaStat += this.aaStatImprovementBonus();
			// Interceptor use evasion as interception stat against fighter
			var intStat = KC3GearManager.interceptorsType2Ids.includes(type2) ?
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

		var type2 = this.master().api_type[2];
		// Check if this object is a fighter plane,
		// Also take recon/lb planes into account because they participate in LBAS battle.
		if(this.isAntiAirAircraft(forLbas)){
			var aceLevel = this.ace > 0 ? this.ace : 0,
				internalExps = KC3Meta.airPowerInternalExpBounds(aceLevel),
				typeBonus = KC3Meta.airPowerTypeBonus(type2, aceLevel),
				bonusBounds = [
					Math.sqrt(internalExps[0] / 10) + typeBonus,
					Math.sqrt(internalExps[1] / 10) + typeBonus
				];
			
			var aaStat = this.master().api_tyku || 0;
			aaStat += this.aaStatImprovementBonus();
			// Interceptor use evasion as interception stat against fighter
			var intStat = KC3GearManager.interceptorsType2Ids.includes(type2) ?
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
		var type2 = this.master().api_type[2];
		// Check if this object is a interceptor plane or not
		if(KC3GearManager.interceptorsType2Ids.includes(type2)) {
			var interceptPower = (
				// Base anti-air power
				this.master().api_tyku +
				// Interception is from evasion
				this.master().api_houk +
				// Anti-Bomber is from hit accuracy
				this.master().api_houm * 2 +
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
	KC3Gear.prototype.airstrikePower = function(capacity = 0, combinedFleetFactor = 0, isJetAssault = false, isExpedSupport = false, targetShipId = 0){
		if(this.isDummy()) { return [0, 0, false]; }
		if(this.isAirstrikeAircraft()) {
			const type2 = this.master().api_type[2];
			const isTorpedoBomber = [8, 58].includes(type2);
			const isOtherBomber = [7, 11, 57].includes(type2);
			const isJet = [57, 58].includes(type2);
			const isAsPartol = [26].includes(type2);
			// ~~Visible bonus no effect~~ Added since 2021-08-04, counted in ship class later since it's total stats bonus.
			let power = isTorpedoBomber ? this.master().api_raig : this.master().api_baku;
			if((isTorpedoBomber && targetShipId > 0 && KC3Master.ship(targetShipId).api_soku === 0)
				// still under verification for strange Antisub Patrol
				// baku stat no effect on opening airstrike even for the only Type 1 Fighter
				|| isAsPartol) {
				power = 0;
			}
			power += this.attackPowerImprovementBonus(isExpedSupport ? "support" : "airstrike");
			power *= Math.sqrt(capacity);
			power += isExpedSupport ? 3 : 25;
			power += isExpedSupport ? 0 : combinedFleetFactor;
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
			const isOtherBomber = [7, 11, 57].includes(type2);
			const isLandBaseAttacker = [47].includes(type2);
			const isLandBaseHeavyBomber = [53].includes(type2);
			const isJet = [57, 58].includes(type2);
			const isAsAircraft = [25, 26].includes(type2);
			const targetMst = targetShipId > 0 && KC3Master.ship(targetShipId);
			const isTargetLand = !!targetMst && targetMst.api_soku === 0;

			result += 25;
			let stat = isTorpedoBomber || isLandBaseAttacker || isLandBaseHeavyBomber ?
				this.master().api_raig : this.master().api_baku;
			let typeModifier = 1;
			if(isLandBaseAttacker || isLandBaseHeavyBomber) {
				typeModifier = 0.8;
				// use DV stat if LandBase Attack Aircraft against land installation
				if(isTargetLand) {
					stat = this.master().api_baku;
				}
			}
			if(isJet) typeModifier = 1 / Math.sqrt(2);
			// Antisub Patrol and Rotorcraft might use different values?
			// against DD for Type 1 Fighter Hayabusa Model III Kai (Skilled / 20th Squadron)
			// https://twitter.com/Divinity_123/status/1651948848351158273
			if(isAsAircraft) {
				const isTargetDestroyer = !isTargetLand && !!targetMst && targetMst.api_stype === 2;
				stat = (this.masterId === 491 && isTargetDestroyer) ? 30 : this.master().api_baku || 0;
				typeModifier = 1;
			}
			stat += this.attackPowerImprovementBonus("lbas");
			let sizeModifier = 1.8;
			// even no 1.8 found on Shinzan Kai?
			// https://twitter.com/yukicacoon/status/1341747923109875715
			//if(isLandBaseHeavyBomber) sizeModifier = 1.0;
			result += Math.sqrt(capacity * sizeModifier) * stat;
			result *= typeModifier;
		}
		return result;
	};

	/**
	 * @return the same structure with Ship.js#applyPowerCap
	 */
	KC3Gear.prototype.applyLandbasePowerCap = function(precapPower){
		// increased from 150 to 170 since 2021-03-01
		// suspected to be increased to 220 sometime? uncertain since LBAA power can rarely reach cap
		const cap = 220;
		const isCapped = precapPower > cap;
		const power = Math.floor(isCapped ? cap + Math.sqrt(precapPower - cap) : precapPower);
		return {
			power,
			cap,
			isCapped
		};
	};

	/**
	 * Get post-modified support airstrike power from this land-based aircraft.
	 * @return tuple of [normal power, critical power]
	 */
	KC3Gear.prototype.applyLandbasePowerModifiers = function(basicPower, landBaseObj, targetShipId = 0){
		const type2 = this.master().api_type[2];
		const isLbaa = [47].includes(type2);

		// Power modifier if LB recon is present
		// suspected to be precap modifier?
		// https://twitter.com/syoukuretin/status/1068477784232587264
		// https://twitter.com/Nishisonic/status/1080146808318263296
		// https://twitter.com/yukicacoon/status/1570246361790185473
		// https://twitter.com/CC_jabberwock/status/1651961974497107968
		let lbReconModifier = 1;
		if(landBaseObj) {
			// Get power modifier by LB recon accuray stat
			landBaseObj.toShipObject().equipment((rid, idx, gear) => {
				if(!rid || gear.isDummy()) { return; }
				if(gear.master().api_type[2] === 49) {
					const acc = gear.master().api_houm;
					lbReconModifier = Math.max(lbReconModifier,
						acc >= 3 ? 1.15 : 1.12
					);
				}
			});
		}
		// Applies power cap
		const cappedPower = this.applyLandbasePowerCap(basicPower * lbReconModifier).power;
		const lbAttackerModifier = isLbaa ? 1.8 : 1;
		let contactModifier = 1;
		// TODO contact plane should be gotten from LBAS support section, wave by wave
		const contactPlaneId = 0;
		if(contactPlaneId > 0) {
			const contactPlaneAcc = KC3Master.slotitem(contactPlaneId).api_houm;
			contactModifier = contactPlaneAcc >= 3 ? 1.2 : contactPlaneAcc >= 2 ? 1.17 : 1.12;
		}
		const isEnemyCombined = KC3Calc.collectBattleConditions().isEnemyCombined || false;
		const enemyCombinedModifier = isEnemyCombined ? 1.1 : 1;
		// TODO modifier unused, since no invoker pass targetShipId yet
		let lbaaAbyssalModifier = 1;
		if(targetShipId > 0) {
			const targetMst = KC3Master.ship(targetShipId);
			const isLand = targetMst.api_soku === 0;
			// LBAA targeting 6-5 Abyssal Carrier Princess, ranged in (3.11, 3.45)?
			// https://twitter.com/muu_1106/status/850875064106889218
			if(isLbaa && [1586, 1620, 1781, 1782].includes(targetShipId))
				lbaaAbyssalModifier = 3.2;
			// Bomb-carrying Type 1 Fighter Hayabusa Model III Kai (65th Squadron) targeting DD?, 2.21?
			// https://twitter.com/syusui_200/status/1364056148605685761
			// but, since there is no visible TP stat for the plane, and slot size affects final power,
			// so instead of modifier, hidden power like TP (probably 25) against DD should be added to base power?
			// https://twitter.com/yukicacoon/status/1364852802103640064
			if(this.masterId === 224 && !isLand && [2].includes(targetMst.api_stype))
				lbaaAbyssalModifier = 2.2;
			// More modifiers again abyssal surface ships on Do 217 variants since 2021-01-29
			// planes with missile see: `main.js#TaskAircraftFlightBase.HAS_MISSILE_PLANES`
			// Do 217 E-5 + Hs293 Initial Model targeting DD
			if(this.masterId === 405 && !isLand && [2].includes(targetMst.api_stype))
				lbaaAbyssalModifier = 1.1;
			// Type 4 Heavy Bomber Hiryuu + I-go Model 1A Guided Missile targeting many types since 2021-11-30
			// Type 4 Heavy Bomber Hiryuu (Skilled) + I-go Model 1A Guided Missile since 2022-10-31
			// DD, CL, CLT, CA, CVL, BB, AO: https://twitter.com/oxke_admiral/status/1465639932970430469
			if([444, 484].includes(this.masterId) && !isLand && [2, 3, 4, 5, 6, 7, 8, 9, 10, 22].includes(targetMst.api_stype))
				lbaaAbyssalModifier = 1.15;
			// Ki-102 B Kai + No.1 Model 1B Guided Missile since 2022-03-31
			// https://twitter.com/Yama625Ayanami/status/1509497879303319552
			// https://twitter.com/yukicacoon/status/1510174783819812866
			if([454].includes(this.masterId) && !isLand && [2, 3, 4, 5, 6, 7, 8, 9, 10].includes(targetMst.api_stype))
				lbaaAbyssalModifier = 1.16;
			// Do 217 K-2 + Fritz-X targeting surface types:
			if(this.masterId === 406 && !isLand) {
				// CA, CAV, CV, CVB
				if([5, 6, 11, 18].includes(targetMst.api_stype)) lbaaAbyssalModifier = 1.15;
				// FBB, BB, BBV
				if([8, 9, 10].includes(targetMst.api_stype)) lbaaAbyssalModifier = 1.38;
			}
			// relations unknown, for now there are 3 types of missiles defined in `main.js#TaskAirWarMissileOne.prototype._getMissileType`
			// planes with bouncing bomb see: `main.js#TaskAircraftFlightBase.BOUNCE_TORPEDO_PLANES`
			// B-25 against surface types since 202-05-27
			// Old TP (a15) mods: https://twitter.com/Camellia_bb/status/1532006059174690816
			// New precap (a14) mods: https://twitter.com/Camellia_bb/status/1535920376555147264
			if(this.masterId === 459 && !isLand) {
				// DD
				if([2].includes(targetMst.api_stype)) lbaaAbyssalModifier = 1.9;
				// CL
				if([3, 4].includes(targetMst.api_stype)) lbaaAbyssalModifier = 1.75;
				// CA
				if([5, 6].includes(targetMst.api_stype)) lbaaAbyssalModifier = 1.6;
				// CVL, BB, AO
				if([7, 8, 9, 10, 22].includes(targetMst.api_stype)) lbaaAbyssalModifier = 1.3;
			}
			// Type 1 Fighter Hayabusa Model III Kai (Skilled / 20th Squadron) works like LBAA,
			// might be hidden base power too, see #landbaseAirstrikePower
			if(this.masterId === 491 && !isLand) {
				lbaaAbyssalModifier = 1;
			}
		}
		const onNormal = Math.floor(cappedPower
			* lbAttackerModifier * contactModifier * lbaaAbyssalModifier * enemyCombinedModifier);
		// Proficiency critical modifier has been applied sometime since 2017-12-11?
		// Modifier calculation is the same, but different from carrier-based,
		// modifiers for squadron slots are independent and no first slot bonus.
		const aceLevel = this.ace || 0;
		const expBonus = [0, 1, 2, 3, 4, 5, 7, 10];
		const internalExpLow = KC3Meta.airPowerInternalExpBounds(aceLevel)[0];
		const proficiencyCriticalModifier = 1 + (Math.floor(Math.sqrt(internalExpLow) + (expBonus[aceLevel] || 0)) / 100);
		const criticalModifier = 1.5;
		const onCritical = Math.floor(Math.floor(cappedPower * criticalModifier * proficiencyCriticalModifier)
			* lbAttackerModifier * contactModifier * lbaaAbyssalModifier * enemyCombinedModifier);
		return [onNormal, onCritical];
	};

	KC3Gear.prototype.bauxiteCost = function(slotCurrent, slotMaxeq){
		// Only used for the slot already equipped aircraft, unused for now
		if(this.isDummy()) { return 0; }
		if( KC3GearManager.carrierBasedAircraftType3Ids.includes(this.master().api_type[3])){
			return KC3GearManager.carrierSupplyBauxiteCostPerSlot * (slotMaxeq - slotCurrent);
		}
		return 0;
	};

	// Following methods used to type equips not by category, but by functionality (stats).
	// Some special cases used just in case are defined at Ship object.
	// Handling data only from master defined at AntiAir module.

	KC3Gear.prototype.isAntiAirAircraft = function(forLbas){
		return this.exists()
			&& ((
				(forLbas ?
					KC3GearManager.antiAirLandBaseFighterType2Ids.concat(KC3GearManager.antiAirFighterType2Ids) :
					KC3GearManager.antiAirFighterType2Ids
				).includes(this.master().api_type[2])
				// many planes have proficiency AA bonus even base AA is 0
				//&& this.master().api_tyku > 0
				// Type 1 Fighter Hayabusa Model II Kai (20th Squadron) since 2023-02-14
				// Type 1 Fighter Hayabusa Model III Kai (Skilled / 20th Squadron) since 2023-02-27
				// other [25] Autogyro and [26] AS Partol participate in stage1 and get proficiency, but no AA power found
			) || [489, 491].includes(this.masterId));
	};

	KC3Gear.prototype.isAirstrikeAircraft = function(){
		return this.exists()
			&& ((
				KC3GearManager.airStrikeBomberType2Ids.includes(this.master().api_type[2])
				&& (this.master().api_raig > 0 || this.master().api_baku > 0)
				// Type 1 Fighter Hayabusa Model II Kai (20th Squadron) since 2023-02-14
				// Type 1 Fighter Hayabusa Model III Kai (Skilled / 20th Squadron) since 2023-02-27
			) || [489, 491].includes(this.masterId));
	};

	KC3Gear.prototype.isAswAircraft = function(forCvl = false, forSupport = false){
		/* These type of aircraft with asw stat > 0 can do (o)asw (support):
		 * - 7: Dive Bomber (known 0 asw stat: Suisei 12 w/Type 31 Photo Bombs)
		 * - 8: Torpedo Bomber (known 0 asw stat: Re.2001 G Kai)
		 * - 10: Seaplane Recon (only capable for ASW support)
		 * - 11: Seaplane Bomber
		 * - 25: Autogyro/Helicopter (CVL shelling incapable, but capable for CVE OASW and CVL ASW support)
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
			type2Ids.includes(this.master().api_type[2]) &&
			this.master().api_tais > 0;
	};

	KC3Gear.prototype.isHighAswBomber = function(forLbas = false){
		// See http://wikiwiki.jp/kancolle/?%C2%E7%C2%EB
		// and official has announced high ASW ability aircraft is ASW stat >= 7.
		// Carrier-based or Land-base bombers for now;
		// Torpedo bombers current implemented:
		//   T97 / Tenzan (931 Air Group) variants, Swordfish Mk.III (Skilled), TBM-3D/3W+3S, Ryuusei Kai(CD1/Sk), PT97Kai (Skilled)
		// LB attackers current implemented:
		//   Toukai variants
		// Dive bombers still NOT capable for OASW, unknown for LBAS:
		//   Ju87C Kai Ni (w/ KMX) variants
		// AS-PBY, Autogyro/Helicopter capable for OASW:
		//   https://twitter.com/FlatIsNice/status/966332515681296384
		// Seaplane Recon capable for LBAS ASW attack:
		//   Type 0 Model 11B variants
		const type2Ids = forLbas ? [8, 10, 47] : [8, 25, 26];
		return this.exists() &&
			type2Ids.includes(this.master().api_type[2]) &&
			this.master().api_tais > 6;
	};

	KC3Gear.prototype.isFighterBomber = function(){
		// 'Fighter Bomber' in dive bomber category is likely based on name, not AA stat and DV stat?
		//   depends on tests of Suisei M12 (634 Air Group w/Type 3 Cluster Bombs) or other new AA 3 dive bomer.
		// Re.2001 CB Kai (AA 4 DV 6) is not fighter-bomber: https://twitter.com/myteaGuard/status/1330856406363193345
		// FM-2 (AA 6 DV 2) is not fighter-bomber: https://twitter.com/myteaGuard/status/1366391634837991425
		//   perhaps F4U-1D (AA 7 DV 7) neither? (not improvable yet)
		// Type 0 Fighter Model 64 (Two-seat w/ KMX) is fighter-bomber: https://twitter.com/Yama625Ayanami/status/1485655534472941572
		// Type 0 Fighter Model 64 (Skilled Fighter-bomber): https://twitter.com/noro_006/status/1600419310006317056
		const type2Ids = [7, 57];
		return this.exists() &&
			type2Ids.includes(this.master().api_type[2]) &&
			// Using ID list for now since data insufficient
			[60, 154, 219, 447, 487].includes(this.masterId);
			//this.master().api_tyku > 2 && this.master().api_baku < 6;
	};

	KC3Gear.prototype.isContactAircraft = function(isSelection = false){
		// Contact trigger-able by Recon Aircraft, Recon Seaplane, Large Flying Boat, LB Recon
		// Contact select-able by previous 3 types, plus Torpedo Bomber
		const type2 = isSelection ? [8, 9, 10, 41, 49, 58, 59, 94] : [9, 10, 41, 49, 59, 94];
		return this.exists() &&
			type2.includes(this.master().api_type[2]);
	};

	KC3Gear.isNightContactAircraft = function(mstId = 0, returnEffectsObj = false){
		const planeMst = KC3Master.slotitem(mstId);
		const isNightRecon = planeMst && planeMst.api_type[3] === 50;
		if(!returnEffectsObj) return isNightRecon;
		else {
			// see KC Vita `Server_Controllers.BattleLogic.Exec_Midnight.cs#setTouchPlaneValanceValue`
			const nightContactLevel = isNightRecon ? [1, 1, 2, 3][planeMst.api_houm || 0] || 3 : 0;
			const powerBonus = isNightRecon ? [0, 5, 7, 9][nightContactLevel] || 0 : 0;
			// night battle base hit constant is 69
			const accuracyBaseModifier = isNightRecon ? [1, 1.1, 1.15, 1.2][nightContactLevel] || 1 : 1;
			// critical trigger threshold based on final hit rate
			const criticalHitModifier = isNightRecon ? [1.5, 1.57, 1.64, 1.7][nightContactLevel] || 1.5 : 1.5;
			return {
				isNightRecon,
				level: nightContactLevel,
				powerBonus,
				accuracyBaseModifier,
				criticalHitModifier,
			};
		}
	};
	KC3Gear.prototype.isNightContactAircraft = function(returnEffects){
		return KC3Gear.isNightContactAircraft(this.masterId, returnEffects);
	};

	KC3Gear.prototype.isAirRadar = function(){
		return this.exists() &&
			// BTW, type 93 is the special Large Radar that not existed in master data without special converation
			[12, 13, 93].includes(this.master().api_type[2]) &&
			this.master().api_tyku > 1;
	};

	KC3Gear.prototype.isSurfaceRadar = function(){
		// According main.js codes, has confirmed that Surface Radar is `api_saku >= 5`, Air Radar is `api_tyku >= 2`,
		// so uses high LoS definition instead of high accuracy one
		return this.isHighLineOfSightRadar();
	};

	KC3Gear.prototype.isHighLineOfSightRadar = function(){
		/* Another speculation of 'isSurfaceRadar' definition:
		   uses 'api_saku > 4' instead of 'api_houm > 2',
		   which the only difference is including '[278] SK Radar' large radar.
		   sample: DD Kasumi K2 + SK Radar + Model C gun gets synergy bonus. */
		return this.exists() &&
			[12, 13, 93].includes(this.master().api_type[2]) &&
			this.master().api_saku > 4;
	};

	KC3Gear.prototype.isHighAccuracyRadar = function(){
		/* Here not call it 'isSurfaceRadar', because it's indeed including some Air Radars.
		 The guess why KC devs suppose to judge 'Surface Radar' by 'api_houm > 2':
		 since the accuracy <= 2 for all Air Radars in Small Radar category,
		 but they have forgotten there are Air Radars with accuracy > 2 in Large Radar category,
		 and there is a Destroyer (Kasumi K2) who can equip Large Radar... */
		return this.exists() &&
			[12, 13, 93].includes(this.master().api_type[2]) &&
			this.master().api_houm > 2;
	};

	KC3Gear.prototype.isAafdBuiltinHighAngleMount = function(){
		return this.exists() &&
			[1, 4].includes(this.master().api_type[2]) &&
			this.master().api_tyku > 7;
	};

	KC3Gear.prototype.isCdMachineGun = function(){
		return this.exists() &&
			this.master().api_type[2] === 21 &&
			this.master().api_tyku > 8;
	};

	KC3Gear.prototype.isDepthCharge = function(){
		/* In-game, newly implemented two Depth Charges are counted as different items in kinds of scenes,
		 but their type in category or icon is the same with Depth Charge Projector.
		 To differentiate them, the only method for now is a list of IDs. */
		return this.exists() && this.master().api_type[2] === 15 &&
		// Currently counted as DC:
		//   [226] Type95 DC, [227] Type2 DC
		// Added since 2021-10-29: https://twitter.com/KanColle_STAFF/status/1454037548209037315
		//   [378] Lightweight ASW Torpedo (Initial Test Model)
		//   [439] Hedgehog (Initial Model)
		// Added since 2022-12-31: https://twitter.com/twillwave1024/status/1609121582139707395
		//   [488] Type2 DC K2
		// ~~No armor penetration effect found for newly added ones~~
		//   https://twitter.com/myteaGuard/status/1454139122168127493
		// Armor penetration extended since 2022-08-04, even applied to some projectors, summary:
		//   https://twitter.com/twillwave1024/status/1555399272358899712
			KC3GearManager.aswDepthChargeIds.includes(this.masterId);
	};

	KC3Gear.prototype.isDepthChargeProjector = function(){
		// Currently counted as DC projector:
		//   [44] Type94 DCP, [45] Type3 DCP
		// Added since 2021-10-29: https://twitter.com/myteaGuard/status/1454141304737185795
		//   [287] Type3 DCP (Concentrated Deployment)
		//   [288] Prototype 15cm 9-tube ASW Rocket Launcher
		//   [377] RUR-4A Weapon Alpha Kai
		// Added since 2022-08-04:
		//   [472] Mk.32 ASW Torpedo (Mk.2 Thrower)
		// Not counted by either:
		//   [346][347] Type2 12cm Mortar Kai & CD
		return this.exists() && this.master().api_type[2] === 15 &&
			KC3GearManager.aswDepthChargeProjectorIds.includes(this.masterId);
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
				(KC3GearManager.carrierBasedAircraftType3Ids.includes(gearData.api_type[3])
				|| KC3GearManager.landBasedAircraftType3Ids.includes(gearData.api_type[3]))){
				nameText += " x{0}".format(slotSize);
			}
		}
		$(".name", title).text(nameText);
		// Some stats only shown at Equipment Library, omitted here.
		const planeStats = ["or", "kk"];
		// Some stats not defined in API data, these flags maintained by us manually.
		const nonMasterFlags = ["rk", "rm", "hk", "dc", "dp", "ap"];
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
			["or", "distance"],
			["rk", "baku"],
			["rm", "houm"],
			["hk", "distance"],
			["dc", "tais"],
			["dp", "tais"],
			["ap", "tais"],
		], function(index, sdata) {
			const statBox = $('<div><img class="icon stats_icon_img"/> <span class="value"></span>&nbsp;</div>');
			statBox.css("font-size", "11px");
			if((gearData["api_" + sdata[1]] || 0) !== 0 && (
				!planeStats.includes(sdata[0]) || (planeStats.includes(sdata[0]) &&
					KC3GearManager.landBasedAircraftType3Ids.includes(gearData.api_type[3]))
			) && (
				sdata[0] !== "rk" || KC3GearManager.antiLandDiveBomberIds.includes(gearData.api_id)
			) && (
				sdata[0] !== "rm" || KC3GearManager.highAltitudeInterceptorIds.includes(gearData.api_id)
			) && (
				sdata[0] !== "hk" || KC3GearManager.evadeAntiAirFireIds.includes(gearData.api_id)
			) && (
				sdata[0] !== "dc" || KC3GearManager.aswDepthChargeIds.includes(gearData.api_id)
			) && (
				sdata[0] !== "dp" || KC3GearManager.aswDepthChargeProjectorIds.includes(gearData.api_id)
			) && (
				sdata[0] !== "ap" || KC3GearManager.aswArmorPenetrationIds.includes(gearData.api_id)
			)) {
				$(".icon", statBox).attr("src", KC3Meta.statIcon(sdata[0]));
				$(".icon", statBox).css("max-width", 15).height(13).css("margin-top", "-3px");
				if(sdata[0] === "rn") {
					$(".value", statBox).text(KC3Meta.gearRange(gearData["api_" + sdata[1]]));
				} else if(nonMasterFlags.includes(sdata[0])) {
					$(".value", statBox).text("");
				} else {
					$(".value", statBox).text(gearData["api_" + sdata[1]]);
				}
				title.append(statBox.html());
			}
		});
		if(slotSize !== undefined && shipOrLb && gearObj.isAntiAirAircraft(shipOrLb instanceof KC3LandBase)) {
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
		const isLbas = shipOrLb instanceof KC3LandBase;
		let pattern, value;
		switch(ConfigManager.air_formula) {
			case 2:
				pattern = "\u2248{0}";
				value = gearObj.fighterVeteran(slotSize, isLbas);
				break;
			case 3:
				pattern = "{0}~{1}";
				value = gearObj.fighterBounds(slotSize, isLbas);
				break;
			default:
				pattern = "{0}";
				value = gearObj.fighterPower(slotSize, isLbas);
		}
		$(".value", airBox).text(pattern.format(value));
		// interception power only applied to aircraft deployed to land base
		if(isLbas) {
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
			const isLbaaPower = [47, 53].includes(gearMaster.api_type[2]);
			const [onNormal, onCritical] = gearObj.applyLandbasePowerModifiers(lbasPower, shipOrLb);
			const powBox = $('<div><img class="icon stats_icon_img"/> <span class="value"></span></div>');
			powBox.css("font-size", "11px");
			$(".icon", powBox).attr("src", KC3Meta.statIcon(isLbaaPower ? "rk" : "kk"));
			$(".icon", powBox).width(13).height(13).css("margin-top", "-3px");
			$(".value", powBox).text("{0}({1})".format(onNormal, onCritical));
			tooltipTitle.append("<br/>").append(powBox.html());
		} else if(shipOrLb instanceof KC3Ship) {
			const powerRange = gearObj.airstrikePower(slotSize);
			const isRange = !!powerRange[2];
			const appliedCapInfo = [
				shipOrLb.applyPowerCap(powerRange[0], "Day", "Aerial"),
				shipOrLb.applyPowerCap(powerRange[1], "Day", "Aerial")
			];
			const postCap = appliedCapInfo.map(o => o.power);
			const isOverCap = appliedCapInfo.map(o => o.isCapped);
			const contactPlaneId = shipOrLb.collectBattleConditions().contactPlaneId;
			const onNormal = [
				Math.floor(shipOrLb.applyPostcapModifiers(postCap[0], "Aerial", undefined, contactPlaneId, false).power),
				isRange ? Math.floor(shipOrLb.applyPostcapModifiers(postCap[1], "Aerial", undefined, contactPlaneId, false).power) : 0
			];
			const onCritical = [
				Math.floor(shipOrLb.applyPostcapModifiers(postCap[0], "Aerial", undefined, contactPlaneId, true).power),
				isRange ? Math.floor(shipOrLb.applyPostcapModifiers(postCap[1], "Aerial", undefined, contactPlaneId, true).power) : 0
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
