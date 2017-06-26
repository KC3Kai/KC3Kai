/* Gear.js
KC3改 Equipment Object
*/
(function(){
	"use strict";

	window.KC3Gear = function( data ){
		// Default object properties incuded in stringifications
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
	KC3Gear.prototype.fighterPower = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }

		// Check if this object is a fighter plane
		if( KC3GearManager.antiAirFighterType2Ids.indexOf( String(this.master().api_type[2]) ) > -1){
			return Math.floor( Math.sqrt(capacity) * this.master().api_tyku );
		}

		// Equipment did not return on plane check, no fighter power
		return 0;
	};


	KC3Gear.prototype.AAStatImprovementBonous = function() {
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
			// there's no distinction between bomber and fighter-bomber from KCAPI,
			// so let's just say the rule applies to all bombers.
			// (regular bombers cannot be improved anyway, for now...)
			if (this.master().api_type[2] === 7 // is bomber
				&& hasBeenImproved) {
				return 0.25 * this.stars;
			}
		}
		return 0;
	};

	/* FIGHTER POWER: VETERAN
	Get fighter power of this equipment
	with added whole number proficiency bonus
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterVeteran = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }

		// Check if this object is a fighter plane
		if( KC3GearManager.antiAirFighterType2Ids.indexOf( String(this.master().api_type[2]) ) > -1){
			var typInd = String( this.master().api_type[2] );
			var airAverageTable = ConfigManager.air_average[typInd];
			// if new type added to default, have to reset to default
			if(typeof airAverageTable === 'undefined') {
				var defaultTable = ConfigManager.defaults().air_average[typInd];
				if(typeof defaultTable !== 'undefined') {
					ConfigManager.resetValueOf('air_average');
					airAverageTable = defaultTable;
					console.info("Setting 'air_average' reset to default for missing type:", typInd);
				} else {
					console.warn("No 'air_average' setting found for type:", typInd);
					return 0;
				}
			}

			var veteranBonus;
			if(this.ace==-1){
				veteranBonus = airAverageTable[ 0 ];
			}else{
				veteranBonus = airAverageTable[ this.ace ];
			}
			var aaStat = this.master().api_tyku;
			aaStat += this.AAStatImprovementBonous();
			// Interceptor use evasion as interception stat against fighter
			var intStat = KC3GearManager.interceptorsType3Ids.indexOf(this.master().api_type[3]) > -1 ?
				this.master().api_houk : 0;
			aaStat += intStat * 1.5;
			return Math.floor( Math.sqrt(capacity) * aaStat + veteranBonus );
		}

		// Equipment did not return on plane check, no fighter power
		return 0;
	};

	/* FIGHTER POWER: VETERAN with BOUNDS
	Get fighter power of this equipment
	as an array with lower and upper bound bonuses
	--------------------------------------------------------------*/
	KC3Gear.prototype.fighterBounds = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return [0,0]; }

		// Check if this object is a fighter plane
		if( KC3GearManager.antiAirFighterType2Ids.indexOf( String(this.master().api_type[2]) ) > -1){
			// console.log("this.ace", this.ace);

			var typInd = String( this.master().api_type[2] );
			var airBoundTable = ConfigManager.air_bounds[typInd];
			// if new type added to default, have to reset to default
			if(typeof airBoundTable === 'undefined') {
				var defaultTable = ConfigManager.defaults().air_bounds[typInd];
				if(typeof defaultTable !== 'undefined') {
					ConfigManager.resetValueOf('air_bounds');
					airBoundTable = defaultTable;
					console.info("Setting 'air_bounds' reset to default for missing type:", typInd);
				} else {
					console.warn("No 'air_bounds' setting found for type:", typInd);
					return [0,0];
				}
			} 

			var veteranBounds;
			if(this.ace==-1){
				veteranBounds = airBoundTable[ 0 ];
			}else{
				veteranBounds = airBoundTable[ this.ace ];
			}
			var aaStat = this.master().api_tyku;
			aaStat += this.AAStatImprovementBonous();
			// Interceptor use evasion as interception stat against fighter
			var intStat = KC3GearManager.interceptorsType3Ids.indexOf(this.master().api_type[3]) > -1 ?
				this.master().api_houk : 0;
			aaStat += intStat * 1.5;

			return [
				Math.floor( Math.sqrt(capacity) * aaStat + veteranBounds[0] ),
				Math.floor( Math.sqrt(capacity) * aaStat + veteranBounds[1] ),
			];
		}

		// Equipment did not return on plane check, no fighter power
		return [0,0];
	};
	
	/* FIGHTER POWER on Air Defense with INTERCEPTOR FORMULA
	 * Normal planes get usual fighter power formula
	 * Interceptor planes get two special stats: interception, anti-bomber
	see http://wikiwiki.jp/kancolle/?%B4%F0%C3%CF%B9%D2%B6%F5%C2%E2#sccf3a4c
	see http://kancolle.wikia.com/wiki/Land-Base_Aerial_Support#Fighter_Power_Calculations
	--------------------------------------------------------------*/
	KC3Gear.prototype.interceptionPower = function(capacity){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }
		// Check if this object is a interceptor plane or not
		if( KC3GearManager.interceptorsType3Ids.indexOf(this.master().api_type[3]) > -1) {
			// If slot has plane capacity
			if (capacity) {
				var interceptPower = (
					// Base anti-air power
					this.master().api_tyku +
					// Interception is from evasion
					this.master().api_houk +
					// Anti-Bomber is from hit accuracy
					this.master().api_houm * 2 +
					// Although no interceptor can be improved for now
					this.AAStatImprovementBonous()
				) * Math.sqrt(capacity);
				
				// Proficiency Bonus, no fail-over here
				if(this.ace != 1){
					var typInd = String(this.master().api_type[2]);
					var airAverageTable = ConfigManager.air_average[typInd];
					if (typeof airAverageTable != "undefined") {
						interceptPower += airAverageTable[this.ace] || 0;
					}
				}
				
				return Math.floor(interceptPower);
			} else {
				return 0;
			}
		} else {
			return this.fighterVeteran(capacity);
		}
	};

	KC3Gear.prototype.supportPower = function(){
		// Empty item means no fighter power
		if(this.itemId===0){ return 0; }

		// 1.5 TP + 2.0 DV
		return (1.5 * Number(this.master().api_raig) )
			+(2.0 * Number(this.master().api_baku) );
	};

	KC3Gear.prototype.bauxiteCost = function(slotCurrent, slotMaxeq){
		// Only used for the slot already equiped aircrafts, unused for now
		if(this.itemId===0){ return 0; }
		if( KC3GearManager.carrierBasedAircraftType3Ids.indexOf( this.master().api_type[3] ) > -1){
			return KC3GearManager.carrierSupplyBauxiteCostPerSlot * (slotMaxeq - slotCurrent);
		}
		return 0;
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

	/*
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
				KC3GearManager.carrierBasedAircraftType3Ids.indexOf(gearData.api_type[3]) >- 1){
				nameText += " x{0}".format(slotSize);
			}
		}
		$(".name", title).html(nameText);
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
			var statBox = $('<div><img class="icon"/> <span class="value"></span>&nbsp;</div>');
			statBox.css("font-size", "11px");
			if((gearData["api_" + sdata[1]] || 0) !== 0
				&& (planeStats.indexOf(sdata[0]) < 0
				|| (planeStats.indexOf(sdata[0]) >=0
					&& KC3GearManager.landBasedAircraftType3Ids.indexOf(gearData.api_type[3])>-1)
				)
			) { // Path of image should be inputed, maybe
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
