/* ShipboxShort.js
KC3改 Ship Box for Natsuiro theme
*/
(function(){
	"use strict";
	
	window.KC3NatsuiroShipbox = function( base, rosterId, showCombinedFleetBars, dameConConsumed, isStarShellUsed ){
		this.element = $("#factory "+base).clone();
		this.element.attr("id", "ShipBox"+rosterId);
		this.shipData = KC3ShipManager.get( rosterId );
		this.dameConConsumed = dameConConsumed || false;
		this.starShellUsed = isStarShellUsed || false;
		
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
	KC3NatsuiroShipbox.prototype.commonElements = function( isCombinedEscort ){
		//var shipDb = WhoCallsTheFleetDb.getShipStat(this.shipData.masterId);
		var tooltipBox = $("#factory .ship_face_tooltip_outer").clone();
		tooltipBox.hide().appendTo(this.element);
		this.shipData.htmlTooltip(tooltipBox);
		// Show a rich text tool-tip like stats in game
		$(".ship_img", this.element).tooltip({
			position: { my: !!isCombinedEscort ? "left-100 top" : "left+50 top",
				at: "left top", of: $(".module.fleet") },
			items: "div",
			content: tooltipBox.html(),
			open: KC3Ship.onShipTooltipOpen
		});
		// Double click on icon to show Strategy Room Ship Library page
		$(".ship_img", this.element).data("masterId", this.shipData.masterId)
			.on("dblclick", function(e){
				(new RMsg("service", "strategyRoomPage", {
					tabPath: "mstship-{0}".format($(this).data("masterId"))
				})).execute();
			});
		$(".ship_img img", this.element).attr("src", KC3Meta.shipIcon(this.shipData.masterId));
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
		if( myExItem && myExItem.masterId > 0 ) {
			$(".ex_item .gear_icon img", this.element)
				.attr("src", "../../../../assets/img/items/"+myExItem.master().api_type[3]+".png")
				.attr("title", myExItem.htmlTooltip(undefined, this.shipData))
				.data("masterId", myExItem.masterId)
				.on("dblclick", function(e){
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "mstgear-{0}".format($(this).data("masterId"))
					})).execute();
				})
				.lazyInitTooltip();
			$(".ex_item", this.element).toggleClass("goddess", myExItem.masterId == 43);
			if (myExItem.stars > 0) {
				$(".ex_item .gear_star", this.element).show()
					.text(myExItem.stars >= 10 ? "\u2605" : myExItem.stars);
			}
		} else {
			$(".ex_item", this.element).hide();
		}
		$(".ex_item", this.element).toggleClass("item_being_used",
			ConfigManager.info_battle && (this.dameConConsumed.pos == 4 ||
				// Although starshell not equippable at ex-slot for now
				(this.starShellUsed && myExItem.masterId == 101))
		);
		
		// MVP icon
		if(this.shipData.mvp){
			switch(this.shipData.mvp){
				case "chosen": // a capable prediction
					$(".mvp_icon img", this.element).css("opacity", 0.7)
						.attr("src", "/assets/img/ui/mvp.png")
						.css("-webkit-filter", "brightness(1.2)")
						.css("filter", "brightness(1.2)");
					$(".mvp_icon", this.element)
						.toggle(ConfigManager.info_btmvp);
					break;
				case "candidate": // an incapable prediction
					$(".mvp_icon img", this.element)
						.attr("src", "/assets/img/ui/mdp.png")
						.css("opacity", 0.7)
						.css("-webkit-filter", "brightness(0.8)")
						.css("filter", "brightness(0.8)");
					$(".mvp_icon", this.element)
						.toggle(ConfigManager.info_btmvp);
					break;
				default: // an indeed result
					$(".mvp_icon img", this.element)
						.attr("src", "/assets/img/ui/mvp.png")
						.css("opacity", 1).css("filter", "").css("-webkit-filter", "");
					$(".mvp_icon", this.element).show();
			}
		} else {
			$(".mvp_icon", this.element).hide();
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
				resupplyCost.bauxite,
				this.shipData.isMarried() ? KC3Meta.term("PanelResupplyMarriedHint") : ""
			)
		).lazyInitTooltip();
		
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
			.attr( "title", (function(shipData){
				var mst = shipData.master();
				return (shipData.level >= (mst.api_afterlv || Infinity)) ?
					[KC3Meta.term("PanelPossibleRemodel")] :
					(mst.api_afterlv && [KC3Meta.term("PanelNextRemodelLv"),mst.api_afterlv].join(' ') || '');
			})(this.shipData) ).lazyInitTooltip()
			.toggleClass("goaled", (function(shipData){
				var shipGoal = (localStorage.getObject("goals") || {})["s" + shipData.rosterId];
				return Array.isArray(shipGoal) && shipData.level >= shipGoal[0];
			})(this.shipData));
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
					resupplyCost.bauxite,
					this.shipData.isMarried() ? KC3Meta.term("PanelResupplyMarriedHint") : ""
				)
			).lazyInitTooltip();
		} else {
			$(".ship_supply", this.element).attr("title",
				"\u27A4{0}\n\u27A4{1}".format(this.shipData.master().api_fuel_max, this.shipData.master().api_bull_max)
			).lazyInitTooltip();
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
		$(".ship_hp_pred_value", this.element).hide();
		
		// HP bar
		var hpPercent = this.shipData.hp[0] / this.shipData.hp[1];
		$(".ship_hp_bar", this.element).css("width", (this.hpBarLength*hpPercent)+"px");
		
		// Left HP to be Taiha & Chuuha
		var taihaHp = Math.floor(0.25 * this.shipData.hp[1]);
		var chuuhaHp = Math.floor(0.50 * this.shipData.hp[1]);
		$(".ship_hp_cur", this.element).attr("title", (curHp => {
			return KC3Meta.term(curHp > taihaHp ? "PanelTaihaHpLeft" : "PanelTaihaHp")
				.format(taihaHp, curHp - taihaHp)
				+ "\n" + KC3Meta.term(curHp > chuuhaHp ? "PanelChuuhaHpLeft" : "PanelChuuhaHp")
				.format(chuuhaHp, curHp - chuuhaHp);
		})(this.shipData.hp[0])).lazyInitTooltip();
		
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
			).lazyInitTooltip({ position: { at: "left+25 bottom+5" } });
		}else{
			$(".ship_hp_box", this.element).attr("title", KC3Meta.term("PanelNoRepair"))
				.lazyInitTooltip({ position: { at: "left+25 bottom+5" } });
		}
		
		// If ship is being repaired
		if( PlayerManager.repairShips.indexOf( this.shipData.rosterId ) > -1){
			$(".ship_hp_bar", this.element).css("background", "#aaccee");
			this.element.css("background-color", "rgba(100,255,100,0.3)");
		// If not being repaired
		}else{
			if(this.shipData.didFlee){
				//console.debug("Ship", this.shipData.name(), "fled, setting backgrounds to white");
				// if FCF, mark background and hp bar as white
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
	(If enabled?) Show the timer whenever hover Akashi shipbox.
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
			
			// Prediction HP result and diff values
			var hpDiff = this.shipData.afterHp[0] - this.shipData.hp[0];
			if(this.shipData.hp[0] <= 0) {
				// Already sunk ship will get negative hp and no prediction
				$(".ship_hp_cur", this.element).text(this.shipData.hp[0]);
			} else {
				$(".ship_hp_diff", this.element).text((hpDiff > 0 ? "+" : "") + hpDiff);
				$(".ship_hp_cur", this.element).text(this.shipData.afterHp[0]);
				$(".ship_hp_pred_value", this.element).show();
			}
			
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
	Add special glow if more than 53
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showMorale = function(){
		$(".ship_morale", this.element).text( this.shipData.morale );
		switch(true){
			case this.shipData.morale > 52: // sparkle and get buff
				$(".ship_morale", this.element).css("background", "#FFFF00");
				$(".ship_morale", this.element).addClass("glowing");
				break;
			case this.shipData.morale > 49: // sparkle in-game
				$(".ship_morale", this.element).css("background", "#FFFF00");
				break;
			case this.shipData.morale > 39: // no effect in-game, regular state
				$(".ship_morale", this.element).css("background", "#FFFFFF");
				break;
			case this.shipData.morale > 29: // mamiya/irako usable, debuff when < 33
				$(".ship_morale", this.element).css("background", "#FFDDBB");
				break;
			case this.shipData.morale > 19: // orange face, debuff
				$(".ship_morale", this.element).css("background", "#FFB74A");
				break;
			default: // red face, heavy debuff
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
				
				// Unknown item
				if(thisGear.masterId === 0){
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).attr("src",
						"../../../../assets/img/ui/empty.png");
					return false;
				}
				
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).attr("src",
					"../../../../assets/img/items/"+thisGear.master().api_type[3]+".png");
				$(".ship_gear_"+(slot+1), this.element).addClass("equipped");
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element)
					.attr("titlealt", thisGear.htmlTooltip(this.shipData.slots[slot], this.shipData))
					.lazyInitTooltip()
					.data("masterId", thisGear.masterId)
					.on("dblclick", function(e){
						(new RMsg("service", "strategyRoomPage", {
							tabPath: "mstgear-{0}".format($(this).data("masterId"))
						})).execute();
					});
				
				if (thisGear.masterId == 43) {
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).addClass("goddess");
				} else {
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).removeClass("goddess");
				}
				
				if (thisGear.ace > 0) {
					// Is a plane with proficiency level
					$(".ship_gear_"+(slot+1)+" .ship_gear_ace", this.element).show();
					$(".ship_gear_"+(slot+1)+" .ship_gear_ace img", this.element)
						.attr("src", "../../../../assets/img/client/achev/"+thisGear.ace+".png");
				}
				if (thisGear.stars > 0){
				    // Is a normal equipment that can be upgraded
					$(".ship_gear_"+(slot+1)+" .ship_gear_star", this.element).show();
					$(".ship_gear_"+(slot+1)+" .ship_gear_star", this.element).text(
						thisGear.stars >= 10 ? "\u2605" : thisGear.stars
					);
				}
				
				// Check damecon or starshell if prediction is enabled
				if(ConfigManager.info_battle){
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).toggleClass("item_being_used",
						// Consumed damecon slot
						this.dameConConsumed.pos == slot ||
						// Mark all equipped starshell
						(this.starShellUsed && thisGear.masterId == 101)
					);
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
						"{0} /{1}".format(slotCurr, slotMax) ).lazyInitTooltip();
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
