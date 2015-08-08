/* ShipboxShort.js
KC3改 Ship Box for Natsuiro theme
*/
(function(){
	"use strict";
	
	window.KC3NatsuiroShipbox = function( base, rosterId ){
		this.element = $("#factory "+base).clone();
		this.shipData = KC3ShipManager.get( rosterId );
		
		this.expPercent = this.shipData.exp[2] / 100;
		this.fuelPercent = this.shipData.fuel / this.shipData.master().api_fuel_max;
		this.ammoPercent = this.shipData.ammo / this.shipData.master().api_bull_max;	
	};
	
	/* SET SHIP
	Short ship box for combined fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.commonElements = function( rosterId ){
		$(".ship_img img", this.element).attr("src", KC3Meta.shipIcon(this.shipData.masterId));
		$(".ship_name", this.element).text( this.shipData.name() );
		$(".ship_type", this.element).text( this.shipData.stype() );
		
		this.showMorale();
		
		if( this.shipData.didFlee ){
			this.element.css("background", "rgba(255,200,0,0.4)");
		}
		
		return this;
	};
	
	
	/* DEFINE SHORT
	Short ship box for combined fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.defineShort = function(){
		this.hpBarLength = 90;
		this.showHP();
		this.showPrediction();
		
		// Thin bars below the ship box
		$(".ship_exp", this.element).css("width", (120 * this.expPercent)+"px");		
		$(".ship_fuel", this.element).css("width", (120 * this.fuelPercent)+"px");
		$(".ship_ammo", this.element).css("width", (120 * this.ammoPercent)+"px");
		
		return this.element;
	};
	
	/* DEFINE LONG
	Long ship box for single-view fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.defineLong = function(){
		this.hpBarLength = 120;
		this.showHP();
		this.showPrediction();
		
		$(".ship_level span", this.element).text( this.shipData.level );		
		$(".ship_exp_next", this.element).text( this.shipData.exp[1] );		
		$(".ship_exp_bar", this.element).css("width", (290*this.expPercent)+"px");
		
		$(".ship_fuel .ship_supply_text", this.element).text(Math.ceil(this.fuelPercent*100)+"%");
		$(".ship_ammo .ship_supply_text", this.element).text(Math.ceil(this.ammoPercent*100)+"%");
		
		$(".ship_fuel .ship_supply_bar", this.element).css("width", (38 * this.fuelPercent)+"px");
		$(".ship_ammo .ship_supply_bar", this.element).css("width", (38 * this.ammoPercent)+"px");
		
		this.showEquipment(0);
		this.showEquipment(1);
		this.showEquipment(2);
		this.showEquipment(3);
		
		return this.element;
	};
	
	/* SHOW HP
	HP text, bars and its value-dependent colors
	Includes highlighting for repair or damage states
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showHP = function(){
		// HP text
		$(".ship_hp_cur", this.element).text( this.shipData.hp[0] );
		$(".ship_hp_max", this.element).text( "/"+this.shipData.hp[1] );
		
		// HP bar
		var hpPercent = this.shipData.hp[0] / this.shipData.hp[1];
		$(".ship_hp_bar", this.element).css("width", (this.hpBarLength*hpPercent)+"px");
		
		// Clear box colors
		this.element.css("background-color", "transparent");
		
		// If ship is being repaired
		if( PlayerManager.repairShips.indexOf( this.shipData.rosterId ) > -1){
			$(".ship_hp_bar", this.element).css("background", "#aaccee");
			this.element.css("background-color", "rgba(100,255,100,0.3)");
		// If not being repaired
		}else{
			if(hpPercent <= 0.25){
				$(".ship_hp_bar", this.element).css("background", "#FF0000");
				if(!this.shipData.didFlee){
					this.element.css("background", "rgba(255,0,0,0.4)");
				}
			} else if(hpPercent <= 0.50){
				$(".ship_hp_bar", this.element).css("background", "#FF9900");
			} else if(hpPercent <= 0.75){
				$(".ship_hp_bar", this.element).css("background", "#FFFF00");
			} else{
				$(".ship_hp_bar", this.element).css("background", "#00FF00");
			}
		}
	};
	
	/* SHOW PREDICTION
	If enabled, and after-battle HP changed,
	Show new HP bars and its color (not HP text)
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showPrediction = function(){
		// If prediction is disabled, cancel this function
		if(!ConfigManager.info_battle){ return false; }
		
		// Apply only if HP actually changed after prediction
		if(this.shipData.hp[0] != this.shipData.afterHp[0]){
			// Make original HP bar gray
			$(".ship_hp_bar", this.element).css("background", "#ccc");
			
			// Prediction bar
			var afterHpPercent = this.shipData.afterHp[0] / this.shipData.afterHp[1];
			$(".ship_hp_prediction", this.element).css("width", (this.hpBarLength*afterHpPercent)+"px");
			
			// HP-based UI and colors
			if(afterHpPercent <= 0.00 && ConfigManager.info_btstamp) { // Sunk or Knocked out
				this.element.addClass("ship-stamp");
				this.element.attr("title", KC3Meta.term("PredictionStamp"+
					(KC3Panel.layout().data.isSunkable ? "Sortie" : "PvP")));
			} else if(afterHpPercent <= 0.25){
				$(".ship_hp_prediction", this.element).css("background", "#FF0000");
			} else if(afterHpPercent <= 0.50){
				$(".ship_hp_prediction", this.element).css("background", "#FF9900");
			} else if(afterHpPercent <= 0.75){
				$(".ship_hp_prediction", this.element).css("background", "#FFFF00");
			} else{
				$(".ship_hp_prediction", this.element).css("background", "#00FF00");
			}
		}
	};
	
	/* SHOW MORALE
	Morale value on the circle, and its colors
	Add special glow if more than 54
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showMorale = function(){
		$(".ship_morale", this.element).text( this.shipData.morale );
		switch(true){
			case this.shipData.morale > 53:
				$(".ship_morale", this.element).css("background", "#FFFF00");
				$(".ship_morale", this.element).addClass("glowing");
				break;
			case this.shipData.morale > 49:
				$(".ship_morale", this.element).css("background", "#FFFF00");
				break;
			case this.shipData.morale > 39:
				$(".ship_morale", this.element).css("background", "#FFFFFF");
				break;
			case this.shipData.morale > 29:
				$(".ship_morale", this.element).css("background", "#FFDDBB");
				break;
			case this.shipData.morale > 19:
				$(".ship_morale", this.element).css("background", "#FFB74A");
				break;
			default:
				$(".ship_morale", this.element).css("background", "#FFA6A6");
				break;
		}
	};
	
	KC3NatsuiroShipbox.prototype.showEquipment = function( slot ){
		
	};
	
})();