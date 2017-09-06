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

	KC3Gear.prototype.master = function(){ return KC3Master.slotitem( this.masterId ); };
	KC3Gear.prototype.name = function(){ return KC3Meta.gearName( this.master().api_name ); };

	/* FIGHTER POWER
	Get fighter power of this equipment on a slot
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterPower = function(capacity = 0){
		// Empty item means no fighter power
		if(this.itemId === 0){ return 0; }

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
	 * @param {string} - attack type identifier, allow values for now:
	 *                   `fire`, `torpedo`, `yasen`, `asw`, `support`
	 * @return {number} computed bonus = modifier * sqrt(stars)
	 * @see AAStatImprovementBonus for Anti-Air improvement bonus
	 * @see http://kancolle.wikia.com/wiki/Improvements
	 * @see http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#ic9d577c
	 */
	KC3Gear.prototype.attackPowerImprovementBonus = function(attackType = "fire") {
		if(this.itemId === 0) { return 0; }
		const type2 = this.master().api_type[2];
		const stars = this.stars || 0;
		// No improvement bonus is default
		let modifier = 0;
		switch(attackType.toLowerCase()) {
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
			case "support":
				// No any improvement bonus found for support fleet for now
				break;
			default:
				console.warn("Unknown attack type:", attackType);
		}
		return modifier * Math.sqrt(stars);
	};

	KC3Gear.prototype.AAStatImprovementBonus = function() {
		if (this.itemId !== 0) {
			var hasBeenImproved = typeof(this.stars) !== "undefined" && this.stars > 0;
			// reference:
			// http://wikiwiki.jp/kancolle/?%B2%FE%BD%A4%B9%A9%BE%B3#ic9d577c
			// for carrier-based fighters,
			// every star grants +0.2 AA stat, which is added to the AA stat bonus
			// of the gear.
			if (this.master().api_type[2] === 6 && // is carrier-based fighter
				hasBeenImproved) {
				return 0.2 * this.stars;
			}
			// seaplane fighters are improvable now, 0.192 < AA bonus < 0.2014
			// refs: https://twitter.com/syoukuretin/status/843271212377690112
			//       https://twitter.com/DarkQuetzal/status/842686753815191556
			// seaplane bombers are improvable now, but no AA bonus found yet (found DV & LoS bonus)
			if (this.master().api_type[3] === 43 // is seaplane fighter but not bomber/recon
				&& hasBeenImproved) {
				return 0.2 * this.stars;
			}
			// reference:
			// http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:951#32
			// for fighter-bombers, every star grants +0.25 AA stat.
			// there's no distinction between bomber and fighter-bomber from KCSAPI,
			// so let's just say the rule applies to all bombers.
			// (regular bombers cannot be improved anyway, for now...)
			if (this.master().api_type[2] === 7 // is bomber
				&& hasBeenImproved) {
				return 0.25 * this.stars;
			}
		}
		return 0;
	};

	/* FIGHTER POWER: Proficiency Average
	Get fighter power of this equipment
	with added whole number average proficiency bonus
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterVeteran = function(capacity = 0){
		// Empty item or slot means no fighter power
		if(this.itemId === 0 || capacity <= 0){ return 0; }

		var type2 = this.master().api_type[2],
			type3 = this.master().api_type[3];
		// Check if this object is a fighter plane
		if(KC3GearManager.antiAirFighterType2Ids.indexOf(type2) > -1){
			var aceLevel = this.ace > 0 ? this.ace : 0,
				internalBonus = KC3Meta.airPowerAverageBonus(aceLevel),
				typeBonus = KC3Meta.airPowerTypeBonus(type2, aceLevel),
				averageBonus = internalBonus + typeBonus;
			var aaStat = this.master().api_tyku;
			aaStat += this.AAStatImprovementBonus();
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
	KC3Gear.prototype.fighterBounds = function(capacity = 0){
		// Empty item or slot means no fighter power
		if(this.itemId === 0 || capacity <= 0){ return [0, 0]; }

		var type2 = this.master().api_type[2],
			type3 = this.master().api_type[3];
		// Check if this object is a fighter plane
		if(KC3GearManager.antiAirFighterType2Ids.indexOf(type2) > -1){
			var aceLevel = this.ace > 0 ? this.ace : 0,
				internalExps = KC3Meta.airPowerInternalExpBounds(aceLevel),
				typeBonus = KC3Meta.airPowerTypeBonus(type2, aceLevel),
				bonusBounds = [
					Math.sqrt(internalExps[0] / 10) + typeBonus,
					Math.sqrt(internalExps[1] / 10) + typeBonus
				];
			
			var aaStat = this.master().api_tyku;
			aaStat += this.AAStatImprovementBonus();
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
		if(this.itemId === 0 || capacity <= 0){ return 0; }
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
				this.AAStatImprovementBonus()
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
			return this.fighterVeteran(capacity);
		}
	};

	KC3Gear.prototype.bauxiteCost = function(slotCurrent, slotMaxeq){
		// Only used for the slot already equipped aircraft, unused for now
		if(this.itemId===0){ return 0; }
		if( KC3GearManager.carrierBasedAircraftType3Ids.indexOf( this.master().api_type[3] ) > -1){
			return KC3GearManager.carrierSupplyBauxiteCostPerSlot * (slotMaxeq - slotCurrent);
		}
		return 0;
	};

	KC3Gear.prototype.isAswAircraft = function(){
		/* These type of aircraft with asw stat > 0 can do asw:
		 * - 7: Dive Bomber
		 * - 8: Torpedo Bomber (known 0 asw stat: Re.2001 G Kai)
		 * - 11: Seaplane Bomber
		 * - 25: Autogyro
		 * - 26: Anti-Sub PBY
		 * - 41: Large Flying Boat
		 * - 47: Land Base Bomber (not equipped by carrier anyway)
		 * - 57: Jet Bomber
		 */
		return this.masterId > 0 &&
			[7, 8, 11, 25, 26, 41, 47, 57].indexOf(this.master().api_type[2]) > -1 &&
			this.master().api_tais > 0;
	};

	KC3Gear.prototype.aaDefense = function(forFleet) {
		if (this.masterId === 0)
			return 0;
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
	KC3Gear.prototype.htmlTooltip = function(slotSize) {
		return KC3Gear.buildGearTooltip(this, slotSize !== undefined, slotSize);
	};
	/** Also export a static method */
	KC3Gear.buildGearTooltip = function(gearObj, altName, slotSize) {
		var gearData = gearObj.master();
		if(gearObj.itemId === 0 || gearData === false){ return ""; }
		var title = $('<div><span class="name"></span><br/></div>');
		var nameText = altName || gearObj.name();
		if(altName === true){
			nameText = gearObj.name();
			if(gearObj.stars > 0){ nameText += " \u2605{0}".format(gearObj.stars); }
			if(gearObj.ace > 0){ nameText += " \u00bb{0}".format(gearObj.ace); }
			if(slotSize > 0 &&
				(KC3GearManager.carrierBasedAircraftType3Ids.indexOf(gearData.api_type[3]) >- 1
				|| KC3GearManager.landBasedAircraftType3Ids.indexOf(gearData.api_type[3]) >- 1)){
				nameText += " x{0}".format(slotSize);
			}
		}
		$(".name", title).text(nameText);
		// Some stats only shown at Equipment Library, omitted here.
		var planeStats = ["or", "kk"];
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
			var statBox = $('<div><img class="icon stats_icon_img"/> <span class="value"></span>&nbsp;</div>');
			statBox.css("font-size", "11px");
			if((gearData["api_" + sdata[1]] || 0) !== 0
				&& (planeStats.indexOf(sdata[0]) < 0
				|| (planeStats.indexOf(sdata[0]) >=0
					&& KC3GearManager.landBasedAircraftType3Ids.indexOf(gearData.api_type[3])>-1)
				)
			) { // Path of image should be inputted, maybe
				$(".icon", statBox).attr("src", "../../../../assets/img/stats/" + sdata[0] + ".png");
				$(".icon", statBox).width(13).height(13).css("margin-top", "-3px");
				if(sdata[0] === "rn") {
					$(".value", statBox).text(["?","S","M","L","VL","XL"][gearData["api_" + sdata[1]]] || "?");
				} else {
					$(".value", statBox).text(gearData["api_" + sdata[1]]);
				}
				title.append(statBox.html());
			}
		});
		return title.html();
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
