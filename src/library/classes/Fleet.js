KC3.prototype.Fleet = {
	complete: true,
	total_los: 0,
	naked_los: 0,
	level: 0,
	fighter_power: 0,
	speed: "Fast",
	
	ship :{
		
	},
	
	clear :function(){
		this.complete = true;
		this.total_los = 0;
		this.naked_los = 0;
		this.level = 0;
		this.fighter_power = 0;
		this.speed = "Fast";
		
		this.method2.clear();
		this.method3.clear();
	},
	
	getEffectiveLoS :function(forced){
		var elos_mode = app.Config.elos_mode;
		if(typeof forced != "undefined"){ elos_mode = forced; }
		
		// Return effective los based on preferred formula
		var ReturnVal;
		switch( elos_mode ){
			case 1: ReturnVal = this.total_los; break;
			case 2: ReturnVal = this.method2.total( this.total_los ); break;
			case 3: ReturnVal = this.method3.total( this.naked_los ); break;
			default: ReturnVal = this.method3.total( this.naked_los ); break;
		}
		return Math.round(ReturnVal * 100) / 100;
	},
	
	includeEquip :function(ThisItem, MasterItem, Capacity, forced){
		var elos_mode = app.Config.elos_mode;
		if(typeof forced != "undefined"){ elos_mode = forced; }
		if(!MasterItem){ return false; }
		
		this.equip_los += MasterItem.api_saku;
		
		// Add equip stats to effective los calculation
		switch( elos_mode ){
			case 2:
				this.method2.addItem(
					MasterItem.api_type[1],
					MasterItem.api_saku,
					Capacity
				); break;
			case 3:
				this.method3.addItem(
					MasterItem.api_type[2],
					MasterItem.api_saku,
					Capacity
				); break;
			case "all":
				// console.log("adding all");
				this.method2.addItem(
					MasterItem.api_type[1],
					MasterItem.api_saku,
					Capacity
				);
				this.method3.addItem(
					MasterItem.api_type[2],
					MasterItem.api_saku,
					Capacity
				);
				break;
			default:
				break;
		}
		
		// Calculate Fighter Power
		this.check_AirPower( MasterItem.api_type[2], MasterItem.api_tyku, Capacity );
	},
	
	/* Air Superiority
	Check an item for fighter power
	------------------------------------*/
	check_AirPower :function(Type, AntiAir, Capacity){
		// Check if it's a fighter plane
		if( [6,7,8,11].indexOf( Type ) > -1){
			// Add equipment anti-air stats to fighter power
			this.fighter_power += Math.floor(AntiAir * Math.sqrt(Capacity));
		}
	},
	
	/* LoS : "Old Formula"
	= Recon LoS×2 + Radar LoS + v(Fleet total LoS - Recon LoS - Radar LoS)
	------------------------------------*/
	method2 : {
		_plane: 0,
		_radar: 0,
		
		clear :function(){
			this._plane = 0;
			this._radar = 0;
		},
		
		addItem :function( ThisType, ThisLoS, Capacity ){
			// Check for Plane LOS
			if( ThisType == 7){
				// console.log("planelos: "+ThisLoS);
				this._plane += ThisLoS;
			}
			
			// Check for Radar LOS
			if( ThisType == 8){
				// console.log("radarlos: "+ThisLoS);
				this._radar += ThisLoS;
			}
		},
		
		total :function( TotalLos ){
			return (this._plane*2) + this._radar + Math.sqrt( TotalLos -  this._plane - this._radar )
		}
	},
	
	/* LoS : "New Formula"
	= Dive Bomber LoS x (1.04) + Torpedo Bomber LoS x (1.37) + Carrier-based Recon Plane LoS x (1.66) + Recon Seaplane LoS x (2.00) + Seaplane Bomber LoS x (1.78) + Small Radar LoS x (1.00) + Large Radar LoS x (0.99) + Searchlight LoS x (0.91) + v(base LoS of each ship) x (1.69) + (HQ Lv. rounded up to the next multiple of 5) x (-0.61)
	------------------------------------*/
	method3 : {
		_dive: 0,
		_torp: 0,
		_cbrp: 0,
		_rspl: 0,
		_splb: 0,
		_smrd: 0,
		_lgrd: 0,
		_srch: 0,
		
		clear :function(){
			this._dive = 0;
			this._torp = 0;
			this._cbrp = 0;
			this._rspl = 0;
			this._splb = 0;
			this._smrd = 0;
			this._lgrd = 0;
			this._srch = 0;
		},
		
		addItem :function( ThisType, ThisLoS, Capacity ){
			switch(ThisType){
				case  7: this._dive += ThisLoS; break;
				case  8: this._torp += ThisLoS; break;
				case  9: this._cbrp += ThisLoS; break;
				case 10: this._rspl += ThisLoS; break;
				case 11: this._splb += ThisLoS; break;
				case 12: this._smrd += ThisLoS; break;
				case 13: this._lgrd += ThisLoS; break;
				case 29: this._srch += ThisLoS; break;
				default: break;
			}
		},
		
		total :function( NakedLos ){
			// console.log("NakedLos: "+NakedLos);
			// console.log("app.Player.level: "+app.Player.level);
			var total = ( this._dive * 1.04 )
				+ ( this._torp * 1.37 )
				+ ( this._cbrp * 1.66 )
				+ ( this._rspl * 2.00 )
				+ ( this._splb * 1.78 )
				+ ( this._smrd * 1.00 )
				+ ( this._lgrd * 0.99 )
				+ ( this._srch * 0.91 )
				+ NakedLos * 1.69
				+ ( (Math.floor((app.Player.level + 4) / 5) * 5) * -0.61 );
			return total;
		}
	},
	
	/* LoS : Some other formula
	= red plane×0.6+blue plane×0.8+recon×1.0+sea recon×1.2+sea bonber×1.0+radar×0.6+searchlight×0.5+root of each kanmusu's naked LoS, then add value for this for all ship together minus 0.4×hq level, and then take integer
	------------------------------------*/
	method4 : {
		_dive: 0,
		_torp: 0,
		_cbrp: 0,
		_rspl: 0,
		_splb: 0,
		_smrd: 0,
		_lgrd: 0,
		_srch: 0,
		
		clear :function(){
			this._dive = 0;
			this._torp = 0;
			this._cbrp = 0;
			this._rspl = 0;
			this._splb = 0;
			this._smrd = 0;
			this._lgrd = 0;
			this._srch = 0;
		},
		
		addItem :function( ThisType, ThisLoS, Capacity ){
			switch(ThisType){
				case  7: this._dive += ThisLoS; break;
				case  8: this._torp += ThisLoS; break;
				case  9: this._cbrp += ThisLoS; break;
				case 10: this._rspl += ThisLoS; break;
				case 11: this._splb += ThisLoS; break;
				case 12: this._smrd += ThisLoS; break;
				case 13: this._lgrd += ThisLoS; break;
				case 29: this._srch += ThisLoS; break;
				default: break;
			}
		},
		
		total :function( NakedLos ){
			var total = ( this._dive * 0.6 )
				+ ( this._torp * 0.8 )
				+ ( this._cbrp * 1 )
				+ ( this._rspl * 1.2 )
				+ ( this._splb * 1 )
				+ ( this._smrd * 0.6 )
				+ ( this._lgrd * 0.6 )
				+ ( this._srch * 0.5 )
				+ Math.sqrt( NakedLos ); // then add value for this for all ship together minus 0.4 ×hq level, and then take integer (??)
				app.Player.level
			return total;
		}
	},
	
	
	/* Support Expedition Power
	= 55 + (1.5 * FP) + (1.5 * \sum(TP)) + (2.0 * \sum(DB))
	------------------------------------*/
	support : {
		_total: 0,
		
		addShip :function(shipData){
			if(shipData /* if CV/CVL */){
				this.addCarrier(shipData);
			}else{
				this.addNormal(shipData)
			}
		},
		
		addNormal :function(){
			
		},
		
		addCarrier :function(){
			
		},
		
		total :function(){
			return this._total;
		}
		
	}
	
};