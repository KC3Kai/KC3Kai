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

	KC3Gear.prototype.exists = function(){ return this.itemId > 0 && this.masterId > 0; };
	KC3Gear.prototype.isDummy = function(){ return ! this.exists(); };
	KC3Gear.prototype.master = function(){ return KC3Master.slotitem( this.masterId ); };
	KC3Gear.prototype.name = function(){ return KC3Meta.gearName( this.master().api_name ); };

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

	/**
	 * Get the improvement bonus for kinds of attack type based on current gear stars.
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
					case 4: // Secondary
					case 19: // AP Shell
					case 21: // AA Machine Gun
					case 24: // Landing Craft
					case 29: // Searchlight
					case 36: // AA Fire Director
					case 46: // Amphibious Tank
						modifier = 1; break;
					case 3: // Large Cal. Main
						modifier = 1.5; break;
					case 14: // Sonar
					case 15: // Depth Charge
					case 40: // Large Sonar
						modifier = 0.75; break;
				}
				break;
			case "torpedo":
				// Torpedo or AA Machine Gun
				if(type2 === 5 || type2 === 21)
					modifier = 1.2;
				break;
			case "yasen":
				// See equiptype for api_type[2]
				if([1, 2, 3, 4, 5, 19, 24, 29, 36, 46].indexOf(type2) > -1)
					modifier = 1;
				break;
			case "asw":
				// Depth Charge or Sonar
				if([14, 15, 40].indexOf(type2) > -1)
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
				// Main gun/Secondary gun/AP shell/Radar/AAFD
				// but wikia says Sonar gives shelling acc bonus?
				if([1, 2, 3, 4, 12, 13, 19, 36].indexOf(type2) > -1)
					modifier = 1;
				break;
			case "torpedo":
				// Torpedo/AA Gun
				if([5, 21, 32].indexOf(type2) > -1)
					modifier = 1; // unknown
				break;
			case "yasen":
				// unknown
				break;
			case "asw":
				// Sonar
				if([14, 40].indexOf(type2) > -1)
					modifier = 1; // unknown
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
				// unknown
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
		}
		return modifier * stars;
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
		return this.masterId > 0 &&
			KC3GearManager.antiAirFighterType2Ids.indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tyku > 0;
	};

	KC3Gear.prototype.isAirstrikeAircraft = function(){
		return this.masterId > 0 &&
			KC3GearManager.airStrikeBomberType2Ids.indexOf(this.master().api_type[2]) > -1 &&
			(this.master().api_raig > 0 || this.master().api_baku > 0);
	};

	KC3Gear.prototype.isAswAircraft = function(forCvl = false){
		/* These type of aircraft with asw stat > 0 can do (o)asw:
		 * - 7: Dive Bomber
		 * - 8: Torpedo Bomber (known 0 asw stat: Re.2001 G Kai)
		 * - 11: Seaplane Bomber
		 * - 25: Autogyro (CVL incapable)
		 * - 26: Anti-Sub PBY (CVL incapable)
		 * - 41: Large Flying Boat
		 * - 47: Land Base Bomber (not equippable by carrier anyway)
		 * - 57: Jet Bomber
		 * Game might just use the simple way: stat > 0 of any aircraft
		 */
		const type2Ids = !forCvl ? KC3GearManager.aswAircraftType2Ids :
			KC3GearManager.aswAircraftType2Ids.filter(id => id !== 25 && id !== 26);
		return this.masterId > 0 &&
			type2Ids.indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tais > 0;
	};

	KC3Gear.prototype.isContactAircraft = function(isSelection = false){
		// Contact trigger-able by Recon Aircraft, Recon Seaplane, Large Flying Boat
		// Contact select-able by previous 3 types, plus Torpedo Bomber
		const type2 = isSelection ? [8, 9, 10, 41, 58, 59] : [9, 10, 11, 59];
		return this.masterId > 0 &&
			type2.indexOf(this.master().api_type[2]) > -1;
	};

	KC3Gear.prototype.isAirRadar = function(){
		return this.masterId > 0 &&
			[12, 13].indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tyku > 0;
	};

	KC3Gear.prototype.isAafdBuiltinHighAngleMount = function(){
		return this.masterId > 0 &&
			[1, 4].indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tyku > 7;
	};

	KC3Gear.prototype.isCdMachineGun = function(){
		return this.masterId > 0 &&
			this.master().api_type[2] === 21 &&
			this.master().api_tyku > 8;
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
			if(slotSize !== undefined &&
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
			if((gearData["api_" + sdata[1]] || 0) !== 0
				&& (planeStats.indexOf(sdata[0]) < 0
				|| (planeStats.indexOf(sdata[0]) >=0
					&& KC3GearManager.landBasedAircraftType3Ids.indexOf(gearData.api_type[3])>-1)
				)
			) { // Path of image should be inputted, maybe
				$(".icon", statBox).attr("src", "/assets/img/stats/" + sdata[0] + ".png");
				$(".icon", statBox).width(13).height(13).css("margin-top", "-3px");
				if(sdata[0] === "rn") {
					$(".value", statBox).text(["?","S","M","L","VL","XL"][gearData["api_" + sdata[1]]] || "?");
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
		$(".icon", airBox).attr("src", "/assets/img/stats/if.png");
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
			$(".icon", interceptSpan).attr("src", "/assets/img/stats/ib.png");
			$(".icon", interceptSpan).width(13).height(13).css("margin-top", "-3px");
			$(".value", interceptSpan).text(gearObj.interceptionPower(slotSize));
			airBox.append("&emsp;").append(interceptSpan.html());
		}
		tooltipTitle.append("<br/>").append(airBox.html());
	};
	KC3Gear.appendAirstrikePowerTooltip = function(tooltipTitle, gearObj, slotSize, shipOrLb) {
		const gearMaster = gearObj.master();
		if(shipOrLb instanceof KC3LandBase) {
			// Land installation target not taken into account
			const lbasPower = Math.floor(gearObj.landbaseAirstrikePower(slotSize));
			const isLbaa = gearMaster.api_type[2] === 47;
			const lbAttackerModifier = isLbaa ? 1.8 : 1;
			const onNormal = Math.floor(lbasPower * lbAttackerModifier);
			// Proficiency critical modifier not applied yet
			const onCritical = Math.floor(Math.floor(lbasPower * 1.5) * lbAttackerModifier);
			const powBox = $('<div><img class="icon stats_icon_img"/> <span class="value"></span></div>');
			powBox.css("font-size", "11px");
			$(".icon", powBox).attr("src", "/assets/img/stats/" + (isLbaa ? "rk" : "kk") + ".png");
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
			$(".icon", powBox).attr("src", "/assets/img/stats/" + (isRange ? "rk" : "kk") + ".png");
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
