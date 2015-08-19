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
		
		// Item on 5th slot
		var myExItem = this.shipData.exItem();
		if( myExItem && (myExItem.masterId > 0)){
			$(".ex_item img", this.element).attr("src", "../../../../assets/img/items/"+myExItem.master().api_type[3]+".png");
		}else{
			$(".ex_item", this.element).hide();
		}
		
		return this;
	};
	
	
	/* DEFINE SHORT
	Short ship box for combined fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.defineShort = function( ContainingFleet ){
		this.hpBarLength = 88;
		this.showHP( ContainingFleet );
		this.showPrediction();
		this.showMorale( ContainingFleet );
		
		// Thin bars below the ship box
		$(".ship_exp", this.element).css("width", (120 * this.expPercent)+"px");		
		$(".ship_fuel", this.element).css("width", (120 * this.fuelPercent)+"px");
		$(".ship_ammo", this.element).css("width", (120 * this.ammoPercent)+"px");
		$(".ship_bars", this.element).attr("title", "Remaining Exp = " + this.shipData.exp[1] + ", Fuel = " + Math.ceil(this.fuelPercent*100) +"%" + ", Ammo = " + Math.ceil(this.ammoPercent*100)+"%");
		
		return this.element;
	};
	
	/* DEFINE LONG
	Long ship box for single-view fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.defineLong = function( ContainingFleet ){
		this.hpBarLength = 118;
		this.showHP( ContainingFleet );
		this.showPrediction();
		this.showMorale( ContainingFleet);
		
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
	KC3NatsuiroShipbox.prototype.showHP = function( ContainingFleet ){
		// HP text
		$(".ship_hp_cur", this.element).text( this.shipData.hp[0] );
		$(".ship_hp_max", this.element).text( "/"+this.shipData.hp[1] );
		
		// HP bar
		var hpPercent = this.shipData.hp[0] / this.shipData.hp[1];
		$(".ship_hp_bar", this.element).css("width", (this.hpBarLength*hpPercent)+"px");
		
		// Clear box colors
		this.element.css("background-color", "transparent");
		
		// Import repair time script by @Javran
		var RepairCalc = PS['KanColle.RepairTime'];
		var RepairData = [
			this.shipData.stype(),
			this.shipData.level,
			this.shipData.hp[0],
			this.shipData.hp[1]
		];
		
		var RepairTimes = {
			docking: RepairCalc.dockingInSecJS(
				RepairData[0],
				RepairData[1],
				RepairData[2],
				RepairData[3]
			),
			akashi: RepairCalc.facilityInSecJS(
				RepairData[0],
				RepairData[1],
				RepairData[2],
				RepairData[3]
			)
		};
		
		if(RepairTimes.docking > ContainingFleet.highestDocking){
			ContainingFleet.highestDocking = RepairTimes.docking;
		}
		
		if(RepairTimes.akashi > ContainingFleet.highestAkashi){
			ContainingFleet.highestAkashi = RepairTimes.akashi;
		}
		
		if(RepairTimes.docking > 0){
			$(".ship_hp_box", this.element).attr("title", 
				KC3Meta.term("PanelDocking")+": "+String(RepairTimes.docking).toHHMMSS()+"\n"
				+KC3Meta.term("PanelAkashi")+": "+String(RepairTimes.akashi).toHHMMSS()
			);
		}else{
			$(".ship_hp_box", this.element).attr("title", KC3Meta.term("PanelNoRepair"));
		}
		
		// If ship is being repaired
		if( PlayerManager.repairShips.indexOf( this.shipData.rosterId ) > -1){
			$(".ship_hp_bar", this.element).css("background", "#aaccee");
			this.element.css("background-color", "rgba(100,255,100,0.3)");
		// If not being repaired
		}else{
			if(this.shipData.didFlee){
				console.log( this.shipData.name(), "fled, setting backgrounds to white");
				// if FCF, mark hp bar as blue
				$(".ship_hp_bar", this.element).css("background", "#fff");
				this.element.css("background", "rgba(255,255,255,0.4)");
			}else{
				if(hpPercent <= 0.25){
					// mark hp bar and container box as red if taiha
					$(".ship_hp_bar", this.element).css("background", "#FF0000");
					this.element.css("background", "rgba(255,0,0,0.4)");
					ContainingFleet.hasTaiha = true;
				} else if(hpPercent <= 0.50){
					$(".ship_hp_bar", this.element).css("background", "#FF9900");
				} else if(hpPercent <= 0.75){
					$(".ship_hp_bar", this.element).css("background", "#FFFF00");
				} else{
					$(".ship_hp_bar", this.element).css("background", "#00FF00");
				}
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
				this.element.attr("title", KC3Meta.term("PredictionStampPvP"));
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
	KC3NatsuiroShipbox.prototype.showMorale = function( ContainingFleet ){
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
		
		// Check if this is the lowest morale on fleet, set if it is
		if(this.shipData.morale < ContainingFleet.lowestMorale){
			ContainingFleet.lowestMorale = this.shipData.morale;
		}
	};
	
	/* SHOW EQUIPMENT
	
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showEquipment = function( slot ){
		var thisGear;
		if(this.shipData.slotnum > slot){
			
			if(this.shipData.items[slot] > -1){
				thisGear = KC3GearManager.get( this.shipData.items[slot] );
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).attr("src",
					"../../../../assets/img/items/"+thisGear.master().api_type[3]+".png");
				$(".ship_gear_"+(slot+1), this.element).addClass("equipped");
				$(".ship_gear_"+(slot+1), this.element).attr("title", thisGear.name());
				
				if(typeof thisGear.ace != "undefined"){
					if(thisGear.ace > -1){
						$(".ship_gear_"+(slot+1)+" .ship_gear_ace", this.element).show();
						$(".ship_gear_"+(slot+1)+" .ship_gear_ace", this.element).text(thisGear.ace);
					}
				}
				
			}else{
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).hide();
				$(".ship_gear_"+(slot+1), this.element).addClass("empty");
			}
			
			if(this.shipData.slots[ slot ] > 0){
				$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).text( this.shipData.slots[ slot ] );
			}else{
				$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).text("");
			}
		}else{
			$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).hide();
			$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).hide();
		}
	};
	
})();
