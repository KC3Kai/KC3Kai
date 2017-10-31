/* ShipboxShort.js
KC3改 Ship Box for Natsuiro theme
*/
(function(){
	"use strict";
	
	window.KC3NatsuiroShipbox = function( base, rosterId ){
		this.element = $("#factory "+base).clone();
		this.element.attr("id", "ShipBox"+rosterId);
		this.shipData = KC3ShipManager.get( rosterId );
		
		this.expPercent = this.shipData.exp[2] / 100;
		this.fuelPercent = this.shipData.fuel / this.shipData.master().api_fuel_max;
		this.ammoPercent = this.shipData.ammo / this.shipData.master().api_bull_max;	
	};
	
	/* SET SHIP
	Short ship box for combined fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.commonElements = function( rosterId ){
		$(".ship_img img", this.element).attr("src", this.shipData.shipIcon() );
		$(".ship_name", this.element).text( this.shipData.name() );
		$(".ship_type", this.element).text( this.shipData.stype() );
		
		// Item on 5th slot
		var myExItem = this.shipData.exItem();
		if( myExItem && (myExItem.masterId > 0)){
			$(".ex_item img", this.element).attr("src", "/assets/img/items/"+myExItem.master().api_type[3]+".png");
		}else{
			$(".ex_item", this.element).hide();
		}
		
		// MVP icon
		if(this.shipData.mvp){
			$(".mvp_icon", this.element).show();
			// Reserved value for predicted MVP
			if(typeof this.shipData.mvp === "string"){
				$(".mvp_icon img", this.element).css("opacity", 0.5);
			}
		} else {
			$(".mvp_icon", this.element).hide();
			$(".mvp_icon img", this.element).css("opacity", "");
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
		this.showMorale();
		
		// Thin bars below the ship box
		$(".ship_exp", this.element).css("width", (120 * this.expPercent)+"px");		
		$(".ship_fuel", this.element).css("width", (120 * Math.min(this.fuelPercent, 1))+"px");
		$(".ship_ammo", this.element).css("width", (120 * Math.min(this.ammoPercent, 1))+"px");
		var resupplyCost = this.shipData.calcResupplyCost(-1, -1, true);
		$(".ship_bars", this.element).attr("title",
			KC3Meta.term("PanelCombinedShipBarsHint")
			.format(this.shipData.exp[1], Math.ceil(this.fuelPercent*100), Math.ceil(this.ammoPercent*100))
			+ "\n" + KC3Meta.term("PanelResupplyCosts").format(resupplyCost.fuel, resupplyCost.ammo, resupplyCost.bauxite)
		);
		
		return this.element;
	};
	
	/* DEFINE LONG
	Long ship box for single-view fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.defineLong = function(){
		this.hpBarLength = 135;
		this.showHP();
		this.showPrediction();
		this.showMorale();
		
		$(".ship_exp_level span.value", this.element)
			.text( this.shipData.level )
			.prop( 'title', (function(shipData){
				var mst = shipData.master();
				return (shipData.level >= (mst.api_afterlv || Infinity)) ?
					KC3Meta.term("PanelPossibleRemodel") :
					(mst.api_afterlv && KC3Meta.term("PanelNextRemodelLv").format(mst.api_afterlv) || '');
			})(this.shipData) );
		$(".ship_exp_next", this.element).text( this.shipData.exp[1] );
		$(".ship_exp_bar", this.element).css("width", (40*this.expPercent)+"px");
		
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
		
		// Left HP to be Taiha
		var taihaHp = Math.floor(0.25 * this.shipData.hp[1]);
		if(this.shipData.hp[0] > taihaHp && this.shipData.hp[0] < this.shipData.hp[1]){
			$(".ship_hp_cur", this.element).attr("title", KC3Meta.term("PanelTaihaHpLeft").format(taihaHp, this.shipData.hp[0] - taihaHp) );
		}
		
		// Clear box colors
		this.element.css("background-color", "transparent");
		
		// Import repair time script by @Javran
		var RepairTimes = this.shipData.repairTime();
		
		if(RepairTimes.docking > 0){
			$(".ship_hp_box", this.element).attr("title", 
				KC3Meta.term("PanelDocking")+": "+String(RepairTimes.docking).toHHMMSS()+"\n"
				+KC3Meta.term("PanelAkashi")+": "+
					((RepairTimes.akashi>0)
						?String(RepairTimes.akashi).toHHMMSS()
						:KC3Meta.term("PanelCantRepair"))
			);
		}else{
			$(".ship_hp_box", this.element).attr("title", KC3Meta.term("PanelNoRepair"));
		}
		
		// If ship is being repaired
		if( PlayerManager.repairShips.indexOf( this.shipData.rosterId ) > -1){
			$(".ship_hp_bar", this.element).css("background", "#aaccee");
			this.element.css("background-color", "rgba(100,255,100,0.15)");
		// If not being repaired
		}else{
			if(this.shipData.didFlee){
				console.log( this.shipData.name(), "fled, setting backgrounds to white");
				// if FCF, mark hp bar as blue
				$(".ship_hp_bar", this.element).css("background", "#fff");
				this.element.css("background", "rgba(255,255,255,0.2)");
			}else{
				if(hpPercent <= 0.25){
					// mark hp bar and container box as red if taiha
					$(".ship_hp_bar", this.element).css("background", "#FF0000");
					this.element.css("background", "rgba(255,0,0,0.2)");
				} else if(hpPercent <= 0.50){
					$(".ship_hp_bar", this.element).css("background", "#FF9900");
				} else if(hpPercent <= 0.75){
					$(".ship_hp_bar", this.element).css("background", "#FFFF00");
				} else{
					$(".ship_hp_bar", this.element).css("background", "#00FF00");
				}
			}
			
			if(this.shipData.akashiMark) {
				this.element.css("background-color", "rgba(191,255,100,0.15)");
			}
		}
		
		this.hideAkashi();
	};
	
	/* HIDE AKASHI TIMER
	(If enabled?) Show the timer whenever hover akashi's shipbox.
	This element will be removed if it does not meet the required condition.
	[Being repaired/Repairing]
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.hideAkashi = function(){
		if(!this.shipData.akashiMark)
			$(".ship_repair_data",this.element).remove();
		else
			$(".ship_repair_data",this.element).data('sid',this.shipData.rosterId);
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
			if(ConfigManager.info_btstamp && afterHpPercent <= 0.00) { // Sunk or Knocked out
				$(this.element).addClass("ship-stamp");
				$(this.element).attr("title", KC3Meta.term( KC3SortieManager.isPvP() ? "PredictionStampPvP" : "PredictionStampSortie") );
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
	Add special glow if more than 53
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showMorale = function(){
		$(".ship_morale", this.element).text( this.shipData.morale );
		switch(true){
			case this.shipData.morale > 52:
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
				if (typeof thisGear.ace !== "undefined" && thisGear.ace > 0) {
					// Is a plane with veterancy
					$(".ship_gear_"+(slot+1)+" .ship_gear_ace", this.element).show();
					$(".ship_gear_"+(slot+1)+" .ship_gear_ace img", this.element)
						.attr("src", "../../../../assets/img/client/achev/"+thisGear.ace+".png");
				}
				if (typeof thisGear.stars !== "undefined" && thisGear.stars > 0){
				    // Is a normal equipment that can be upgraded
					$(".ship_gear_"+(slot+1)+" .ship_gear_star", this.element).show();
					$(".ship_gear_"+(slot+1)+" .ship_gear_star", this.element).text(thisGear.stars);
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
