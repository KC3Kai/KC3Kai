/* ShipboxShort.js
KC3改 Ship Box for Natsuiro theme
*/
(function(){
	"use strict";
	
	window.KC3NatsuiroShipbox = function( base, rosterId, showCombinedFleetBars, dameConConsumed ){
		this.element = $("#factory "+base).clone();
		this.element.attr("id", "ShipBox"+rosterId);
		this.shipData = KC3ShipManager.get( rosterId );
		this.dameConConsumed = dameConConsumed || false;
		
		this.showCombinedFleetBars = true;
		if(typeof showCombinedFleetBars != "undefined"){
			this.showCombinedFleetBars = showCombinedFleetBars;
		}
		
		this.expPercent = this.shipData.exp[2] / 100;
		this.fuelPercent = this.shipData.fuel / this.shipData.master().api_fuel_max;
		this.ammoPercent = this.shipData.ammo / this.shipData.master().api_bull_max;
	};
	
	/* SET SHIP
	Short ship box for combined fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.commonElements = function( rosterId ){
		var leftPad = function(num){return ("   "+num).slice(-3);};
		var tooltip = "{0}: {1}\n".format(this.shipData.masterId, KC3Meta.shipReadingName(this.shipData.master().api_yomi));
		tooltip += "{0}: {1} \t".format(KC3Meta.term("ShipArmor"), leftPad(this.shipData.ar[0]));
		tooltip += "{0}: {1} \n".format(KC3Meta.term("ShipFire"), leftPad(this.shipData.fp[0]));
		tooltip += "{0}: {1} \t".format(KC3Meta.term("ShipEvasion"), leftPad(this.shipData.ev[0]));
		tooltip += "{0}: {1} \n".format(KC3Meta.term("ShipTorpedo"), leftPad(this.shipData.tp[0]));
		tooltip += "{0}: {1} \t".format(KC3Meta.term("ShipAsw"), leftPad(this.shipData.as[0]));
		tooltip += "{0}: {1} \n".format(KC3Meta.term("ShipAntiAir"), leftPad(this.shipData.aa[0]));
		tooltip += "{0}: {1} \t".format(KC3Meta.term("ShipLos"), leftPad(this.shipData.ls[0]));
		tooltip += "{0}: {1} \n".format(KC3Meta.term("ShipLuck"), leftPad(this.shipData.lk[0]));
		tooltip += "{0}: {1} \t".format(KC3Meta.term("ShipSpeed"), this.shipData.speedName());
		tooltip += "{0}: {1} ".format(KC3Meta.term("ShipLength"), this.shipData.rangeName());
		
		tooltip += "\n" + KC3Meta.term("ShipAAAdjusted")
			.format( this.shipData.adjustedAntiAir() ) ;
		tooltip += "\n" + KC3Meta.term("ShipAAShotdownRate")
			.format( Math.qckInt("floor", this.shipData.proportionalShotdownRate() * 100, 1) );
		var fixedShotdownRange = this.shipData.fixedShotdownRange(ConfigManager.aaFormation);
		var fleetPossibleAaci = fixedShotdownRange[2];
		if(fleetPossibleAaci > 0){
			tooltip += "\n" + KC3Meta.term("ShipAAFixedShotdown")
				.format( "{0}~{1} (x{2})".
					format(fixedShotdownRange[0], fixedShotdownRange[1],
						AntiAir.AACITable[fleetPossibleAaci].modifier)
				);
		} else {
			tooltip += "\n" + KC3Meta.term("ShipAAFixedShotdown")
				.format( fixedShotdownRange[0] );
		}
		var maxAaciParams = this.shipData.maxAaciShotdownBonuses();
		if(maxAaciParams[0] > 0){
			tooltip += "\n" + KC3Meta.term("ShipAACIMaxBonus")
				.format( "+{0} (x{1})".format(maxAaciParams[1], maxAaciParams[2]) );
		} else {
			tooltip += "\n" + KC3Meta.term("ShipAACIMaxBonus").format( KC3Meta.term("None") );
		}
		tooltip += "\n" + KC3Meta.term("ShipAAImgEnemySlot").format( ConfigManager.imaginaryEnemySlot );
		var propShotdown = this.shipData.proportionalShotdown(ConfigManager.imaginaryEnemySlot);
		var aaciFixedShotdown = fleetPossibleAaci > 0 ? AntiAir.AACITable[fleetPossibleAaci].fixed : 0;
		tooltip += "\n" + KC3Meta.term("ShipAAShotdownPred").format(
			"-{0} / -{1} / -{2} / -{3}".format(
				// Both succeeded
				propShotdown + fixedShotdownRange[1] + aaciFixedShotdown + 1,
				// Proportional succeeded only
				propShotdown + aaciFixedShotdown + 1,
				// Fixed succeeded only
				fixedShotdownRange[1] + aaciFixedShotdown + 1,
				// Both failed
				aaciFixedShotdown + 1
			)
		);
		
		$(".ship_img img", this.element).attr("src", KC3Meta.shipIcon(this.shipData.masterId))
			.attr("title", tooltip);
		/*
		$(".ship_img", this.element).addClass("hover").data("sid", this.shipData.masterId);
		$(".ship_img", this.element).click(function(e){
			var tab = "#mstship-" + $(this).data("sid");
			var sr = window.open("/pages/strategy/strategy.html" + tab, "kc3kai_strategy");
		});
		*/
		$(".ship_name", this.element).text( this.shipData.name() );
		$(".ship_type", this.element).text( this.shipData.stype() );
		
		$(this.element)
			.addClass((this.shipData.level >= 100) && 'sWife')
			.addClass( (ConfigManager.salt_list.indexOf(this.shipData.master().kc3_bship)+1) && 'sSalt' )
			.addClass( (ConfigManager.lock_list.indexOf(this.shipData.rosterId)+1) && (!this.shipData.lock) && 'sLock' )
			.end();
		
		$(".ship_no_lock",this.element).text(KC3Meta.term("PanelRequireShipLockInFleet"));
		
		// Item on 5th slot
		var myExItem = this.shipData.exItem();
		if( myExItem && (myExItem.masterId > 0)){
			$(".ex_item img", this.element).attr("src", "../../../../assets/img/items/"+myExItem.master().api_type[3]+".png");
			$(".ex_item img", this.element).attr("title", myExItem.name());
			if (myExItem.masterId == 43) {
				$(".ex_item", this.element).addClass("goddess");
			} else {
				$(".ex_item", this.element).removeClass("goddess");
			}
		}else{
			$(".ex_item", this.element).hide();
		}
		if(this.dameConConsumed.pos == 4){
			$(".ex_item", this.element).addClass("item_being_used");
		} else {
			$(".ex_item", this.element).removeClass("item_being_used");
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
	KC3NatsuiroShipbox.prototype.defineShort = function( CurrentFleet ){
		this.hpBarLength = 88;
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
			+ "\n" + KC3Meta.term("PanelResupplyCosts").format(
				"+{0} \u27A4{1}".format(resupplyCost.fuel, this.shipData.master().api_fuel_max),
				"+{0} \u27A4{1}".format(resupplyCost.ammo, this.shipData.master().api_bull_max),
				resupplyCost.bauxite
			)
		);
		
		if(!this.showCombinedFleetBars){
			$(".ship_bars", this.element).css("opacity", "0");
		}
		
		return this.element;
	};
	
	/* DEFINE LONG
	Long ship box for single-view fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.defineLong = function( CurrentFleet ){
		this.hpBarLength = 118;
		this.showHP();
		this.showPrediction();
		this.showMorale();
		
		$(".ship_level span.value", this.element)
			.text( this.shipData.level )
			.prop( 'title', (function(shipData){
				var mst = shipData.master();
				return (shipData.level >= (mst.api_afterlv || Infinity)) ?
					[KC3Meta.term("PanelPossibleRemodel")] :
					(mst.api_afterlv && [KC3Meta.term("PanelNextRemodelLv"),mst.api_afterlv].join(' ') || '');
			})(this.shipData) );
		$(".ship_exp_next", this.element).text( this.shipData.exp[1] );
		$(".ship_exp_bar", this.element).css("width", (290*this.expPercent)+"px");
		
		$(".ship_fuel .ship_supply_text", this.element).text(Math.ceil(this.fuelPercent*100)+"%");
		$(".ship_ammo .ship_supply_text", this.element).text(Math.ceil(this.ammoPercent*100)+"%");
		
		$(".ship_fuel .ship_supply_bar", this.element).css("width", (38 * Math.min(this.fuelPercent, 1))+"px");
		$(".ship_ammo .ship_supply_bar", this.element).css("width", (38 * Math.min(this.ammoPercent, 1))+"px");
		
		if(this.fuelPercent<1 || this.ammoPercent<1){
			var resupplyCost = this.shipData.calcResupplyCost(-1, -1, true);
			$(".ship_supply", this.element).attr("title",
				KC3Meta.term("PanelResupplyCosts").format(
					"+{0} \u27A4{1}".format(resupplyCost.fuel, this.shipData.master().api_fuel_max),
					"+{0} \u27A4{1}".format(resupplyCost.ammo, this.shipData.master().api_bull_max),
					resupplyCost.bauxite
				)
			);
		} else {
			$(".ship_supply", this.element).attr("title",
				"\u27A4{0}\n\u27A4{1}".format(this.shipData.master().api_fuel_max, this.shipData.master().api_bull_max)
			);
		}

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
			if(ConfigManager.info_btstamp && afterHpPercent <= 0.00) {
				// Sunk or Knocked out: afterHp[0]<=0 only occurs when battle starts from 'taiha'
				// Call KO for PvP as although 'sinks' but not lost, and cannot move, gains 0 exp
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
	
	/* SHOW EQUIPMENT
	
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showEquipment = function( slot ){
		var thisGear;
		if(this.shipData.slotnum > slot){
			
			if(this.shipData.items[slot] > -1){
				
				thisGear = KC3GearManager.get( this.shipData.items[slot] );
				
				// unknown item
				if(thisGear.masterId === 0){
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).attr("src",
						"../../../../assets/img/ui/empty.png");
					return false;
				}
				
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).attr("src",
					"../../../../assets/img/items/"+thisGear.master().api_type[3]+".png");
				$(".ship_gear_"+(slot+1), this.element).addClass("equipped");
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).attr("title", thisGear.name());
				
				if (thisGear.masterId == 43) {
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).addClass("goddess");
				} else {
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).removeClass("goddess");
				}
				
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
				
				// Check damecon if prediction is enabled
				if(this.dameConConsumed && ConfigManager.info_battle){
					if(this.dameConConsumed.pos == slot){
						$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).addClass("item_being_used");
					}
				} else {
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).removeClass("item_being_used");
				}
				
			}else{
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).hide();
				$(".ship_gear_"+(slot+1), this.element).addClass("empty");
			}
			
			if(this.shipData.slots[ slot ] > 0 ||
				(thisGear && KC3GearManager.carrierBasedAircraftType3Ids.indexOf(thisGear.master().api_type[3])>-1) ){
				var slotCurr = this.shipData.slots[slot];
				$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).text( slotCurr );
				var slotMax = this.shipData.master().api_maxeq[slot];
				if(slotCurr < slotMax){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).attr("title",
						"{0} /{1}".format(slotCurr, slotMax) );
				}
				var slotPercent = slotCurr / (slotMax || 1);
				if(slotPercent <= 0){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).css("color", "#999");
				} else if(slotPercent <= 0.25){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).css("color", "#f00");
				} else if(slotPercent <= 0.50){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).css("color", "#f90");
				} else if(slotPercent <= 0.75){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).css("color", "#ff0");
				} else {
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).css("color", "");
				}
			}else{
				$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).text("");
				$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).css("color", "");
			}
		}else{
			$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).hide();
			$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).hide();
		}
	};
	
})();
