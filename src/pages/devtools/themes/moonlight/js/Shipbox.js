//var partnerlvl = 1;
//var partnerID = 50;

/**
 * Shipbox.js
 * KC3改 Ship Box for the Moonlight theme
 */
(function(){
	"use strict";
	
	window.KC3NatsuiroShipbox = function( base, rosterId, position,
		showCombinedFleetBars, dameConConsumed, isStarShellUsed, noAirBombingDamage, smokeType ){
		this.element = $("#factory "+base).clone();
		this.element.attr("id", "ShipBox"+rosterId);
		this.shipData = KC3ShipManager.get( rosterId );
		this.position = position;
		this.showCombinedFleetBars = showCombinedFleetBars || false;
		this.dameConConsumed = dameConConsumed || false;
		this.starShellUsed = isStarShellUsed || false;
		this.rosaK2Success = noAirBombingDamage === true && [4, 6].includes(this.shipData.estimateAntiAirEffectType()[0]);
		this.smokeEmitted = smokeType > 0;
		
		this.expPercent = this.shipData.exp[2] / 100;
		this.fuelPercent = this.shipData.fuel / this.shipData.master().api_fuel_max;
		this.ammoPercent = this.shipData.ammo / this.shipData.master().api_bull_max;
		
		this.eventLockPlans = JSON.parse(localStorage.lock_plan || "[]");
		this.lockTagColors = KC3Meta.eventLockingTagColors(ConfigManager.sr_theme);
	};

	KC3NatsuiroShipbox.prototype.setStyleVar = function(elm, name, value){
		const nativeStyle = $(elm).get(0).style;
		nativeStyle.removeProperty(name);
		nativeStyle.setProperty(name, value);
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
		if($(".wrapper").hasClass("h"))	{
			$(".ship_img", this.element).tooltip({
				position: { my: !!isCombinedEscort ? "right-170 top" : "right-25 top",
					at: "right top", of: $(".module.fleet") },
				items: "div",
				content: tooltipBox.html(),
				open: KC3Ship.onShipTooltipOpen
			});
		} else if($(".wrapper").hasClass("v"))	{
			$(".ship_img", this.element).tooltip({
				position: { my: !!isCombinedEscort ? "right+60 top" : "right-105 top",
					at: "right top", of: $(".module.fleet") },
				items: "div",
				content: tooltipBox.html(),
				open: KC3Ship.onShipTooltipOpen
			});
		} else if($(".wrapper").hasClass("c")) {
			$(".ship_img", this.element).tooltip({
				position: { my: !!isCombinedEscort ? "right+135 top" : "right-35 top",
					at: "right top", of: $(".module.fleet") },
				items: "div",
				content: tooltipBox.html(),
				open: KC3Ship.onShipTooltipOpen
			});
		} else if($(".wrapper").hasClass("t")) {
			$(".ship_img", this.element).tooltip({
				position: { my: !!isCombinedEscort ? "right top" : "right top",
					at: "right top", of: $(".module.quests") },
				items: "div",
				content: tooltipBox.html(),
				open: KC3Ship.onShipTooltipOpen
			});
		}
		// Double click on icon to show Strategy Room Ship Library page
		$(".ship_img", this.element).data("masterId", this.shipData.masterId)
			.on("dblclick", function(e){
				(new RMsg("service", "strategyRoomPage", {
					tabPath: "mstship-{0}".format($(this).data("masterId"))
				})).execute();
			});
		$(".ship_img img", this.element).attr("src", this.shipData.shipIcon() );
		/*if(this.shipData.level > partnerlvl) {
			partnerlvl = this.shipData.level;
			partnerID = this.shipData.masterId;
			$(".module.Partner .partner img").attr("src", KC3Ship.shipIcon(partnerID, 2, 2));
		}*/
		$(".ship_name", this.element).text( this.shipData.name() );
		$(".ship_type", this.element).text( this.shipData.stype() );
		
		$(this.element)
			.addClass((this.shipData.level >= 100) && 'sWife')
			.addClass( (ConfigManager.salt_list.indexOf(this.shipData.master().kc3_bship)+1) && 'sSalt' )
			.addClass( (ConfigManager.lock_list.indexOf(this.shipData.rosterId)+1) && (!this.shipData.lock) && 'sLock' )
			.end();
		
		$(".ship_no_lock",this.element).text(KC3Meta.term("PanelRequireShipLockInFleet"));
		
		// Item on ex-slot
		var myExItem = this.shipData.exItem();
		if( myExItem.exists() ) {
			$(".ex_item .gear_icon img", this.element)
				.attr("src", KC3Meta.itemIcon(myExItem.master().api_type[3]))
				.attr("title", myExItem.htmlTooltip(undefined, this.shipData))
				.data("masterId", myExItem.masterId)
				.on("dblclick", function(e){
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "mstgear-{0}".format($(this).data("masterId"))
					})).execute();
				})
				.lazyInitTooltip();
			$(".ex_item", this.element).attr("data-mst-id", myExItem.masterId)
				.toggleClass("goddess", myExItem.masterId == 43);
			if (myExItem.stars > 0) {
				$(".ex_item .gear_star", this.element).show()
					.text(myExItem.stars >= 10 ? "\u2605" : myExItem.stars);
			}
		} 
		else {
			$(".ex_item .gear_icon img", this.element).hide();
			// Still show the empty item background if ex-slot opened but equipped nothing
			$(".ex_item", this.element).toggle(this.shipData.ex_item === -1)
				.toggleClass("empty", this.shipData.ex_item === -1);
		}
		$(".ex_item", this.element).toggleClass("item_being_used",
			ConfigManager.info_battle && (this.dameConConsumed.pos === 0 ||
				// Although starshell not equippable at ex-slot for now
				(this.starShellUsed && myExItem.masterId == 101) ||
				// Successful 12cm 30tube Rocket Launcher K2 AA defense
				(this.rosaK2Success && myExItem.masterId === 274) ||
				// Although Smoke Generators not equippable in ex-slot for now
				(this.smokeEmitted && [500, 501].includes(myExItem.masterId))
			)
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
		
		// Event locking color tags
		var tagColorId = this.shipData.sally || 0;
		if(!tagColorId){
			this.eventLockPlans.forEach((tagPlan, tagId) => {
				if(Array.isArray(tagPlan) && tagPlan.includes(this.shipData.rosterId)){
					tagColorId = tagId + 1;
				}
			});
		}
		if(tagColorId > 0){
			$(".locktag .solid", this.element).text(this.shipData.sally || "");
			$(".locktag", this.element).show()
				.toggleClass("locked", this.shipData.sally > 0)
				.addClass("color-{0}".format(tagColorId))
				.css("background-color", this.lockTagColors[tagColorId - 1] || "#aaa")
				.css("border-color", ConfigManager.pan_ship_icon_border_moon);
		} else {
			$(".locktag", this.element).hide();
		}
		
		// Ribbon sash
		var ribbonType = this.shipData.ribbonType();
		if(ribbonType > 0){
			$(".ribbon", this.element).addClass("r-" + ribbonType).show();
		} else {
			$(".ribbon", this.element).hide();
		}
		
		return this;
	};
	
	
	/* DEFINE SHORT
	Short ship box for combined fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.defineShort = function( currentFleet ){
		this.showHP();
		this.showPrediction();
		this.showMorale();
		
		// REMOVED Thin bars below the ship box
		$(".ship_exp", this.element).css("width", (25 * this.expPercent)+"px");
		$(".ship_fuel .ship_supply_text", this.element).text(Math.ceil(this.fuelPercent*100)+"%");
		$(".ship_ammo .ship_supply_text", this.element).text(Math.ceil(this.ammoPercent*100)+"%");
		$(".ship_fuel .ship_supply_bar", this.element).css("width", (25 * Math.min(this.fuelPercent, 1))+"px");
		$(".ship_ammo .ship_supply_bar", this.element).css("width", (25 * Math.min(this.ammoPercent, 1))+"px");
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

		Array.numbers(0, Math.max(this.shipData.slotnum - 1, 3)).forEach(slot => {
			this.showEquipment(slot);
		});
		
		return this.element;
	};
	
	/* DEFINE LONG
	Long ship box for single-view fleets
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.defineLong = function( currentFleet ){
		this.showHP();
		this.showPrediction();
		this.showMorale();
		
		const shipMaster = this.shipData.master();
		const shipGoal = KC3Calc.getShipLevelingGoal(this.shipData);
		$(".ship_level span.value", this.element)
			.text( this.shipData.level )
			.toggleClass("goaled", this.shipData.level >= shipGoal.targetLevel)
			.attr( "title", (function(shipData){
				let title = "";
				title += shipMaster.api_afterlv ?
					(shipData.level >= shipMaster.api_afterlv ? KC3Meta.term("PanelPossibleRemodel")
						: KC3Meta.term("PanelNextRemodelLv").format(shipMaster.api_afterlv))
					: "";
				const nextGoal = isFinite(shipGoal.battlesLeft) && shipGoal.battlesLeft > 0 ?
					KC3Meta.term("PanelNextLvGoalLeft")
						.format(shipGoal.targetLevel, shipGoal.battlesLeft,
							shipGoal.baseExp || shipGoal.baseExpPerBattles) : "";
				if(nextGoal){
					if(title) title += "\n";
					title += nextGoal;
				}
				return title;
			})(this.shipData) ).lazyInitTooltip();
		$(".ship_exp_next", this.element).text( KC3Meta.formatNumber(this.shipData.exp[1]) );
		this.setStyleVar($(".ship_exp_bar", this.element), "--expPercent", this.expPercent);
		
		$(".ship_fuel .ship_supply_text", this.element).text(Math.ceil(this.fuelPercent*100)+"%");
		$(".ship_ammo .ship_supply_text", this.element).text(Math.ceil(this.ammoPercent*100)+"%");
		
		$(".ship_fuel .ship_supply_bar", this.element).css("width", (30 * Math.min(this.fuelPercent, 1))+"px");
		$(".ship_ammo .ship_supply_bar", this.element).css("width", (30 * Math.min(this.ammoPercent, 1))+"px");
		
		if(this.fuelPercent < 1 || this.ammoPercent < 1){
			var resupplyCost = this.shipData.calcResupplyCost(-1, -1, true);
			$(".ship_supply", this.element).attr("title",
				KC3Meta.term("PanelResupplyCosts").format(
					"+{0} \u27A4{1}".format(resupplyCost.fuel, shipMaster.api_fuel_max),
					"+{0} \u27A4{1}".format(resupplyCost.ammo, shipMaster.api_bull_max),
					resupplyCost.bauxite,
					this.shipData.isMarried() ? KC3Meta.term("PanelResupplyMarriedHint") : ""
				)
			).lazyInitTooltip();
		} else {
			$(".ship_supply", this.element).attr("title",
				"\u27A4{0}\n\u27A4{1}".format(shipMaster.api_fuel_max, shipMaster.api_bull_max)
			).lazyInitTooltip();
		}
		
		Array.numbers(0, Math.max(this.shipData.slotnum - 1, 3)).forEach(slot => {
			this.showEquipment(slot);
		});
		
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
		
		// HP bar, for prediction bar either since it is sliding now
		var hpPercent = this.shipData.hp[0] / this.shipData.hp[1];
		this.setStyleVar($(".ship_hp_bar", this.element), "--hpPercent", hpPercent);
		this.setStyleVar($(".ship_hp_prediction", this.element), "--afterHpPercent", hpPercent);
		
		// Left HP to be Taiha & Chuuha
		var taihaHp = Math.floor(0.25 * this.shipData.hp[1]);
		var chuuhaHp = Math.floor(0.50 * this.shipData.hp[1]);
		$(".ship_hp_cur", this.element).attr("title", (curHp => {
			return KC3Meta.term(curHp > taihaHp ? "PanelTaihaHpLeft" : "PanelTaihaHp")
				.format(taihaHp, curHp - taihaHp)
				+ "\n" + KC3Meta.term(curHp > chuuhaHp ? "PanelChuuhaHpLeft" : "PanelChuuhaHp")
				.format(chuuhaHp, curHp - chuuhaHp)
				+ "\n" + KC3Meta.term("PanelOverkillTaihaRate")
				.format(this.shipData.overkillTaihaRate());
		})(this.shipData.hp[0])).lazyInitTooltip();
		
		// Clear box & hp bar color classes
		var hpClasses = ["akashiMark", "hp_fcf", "hp_repairing", // used by root element
			"hp_sunk", "hp_taiha", "hp_chuuha", "hp_shouha", "hp_normal"].join(" ");
		this.element.removeClass(hpClasses);
		$(".ship_hp_bar", this.element).removeClass(hpClasses);
		$(".ship_hp_prediction", this.element).removeClass(hpClasses);
		
		// Show time and cost based on predicted after-battle hp if setting enabled
		var isAfterHpUsed = ConfigManager.info_battle &&
			KC3SortieManager.isOnSortie() && (
				KC3SortieManager.isCombinedSortie() ? [1, 2] : [KC3SortieManager.fleetSent]
			).includes(this.shipData.onFleet());
		var repairTimes = this.shipData.repairTime(isAfterHpUsed);
		var repairCost = this.shipData.calcRepairCost(isAfterHpUsed ? this.shipData.afterHp[0] : 0);
		
		if(repairTimes.docking > 0){
			$(".ship_hp_box", this.element).attr("title", [
				KC3Meta.term("PanelDocking") + ": " + String(repairTimes.docking).toHHMMSS(),
				KC3Meta.term("PanelAkashi")  + ": " + (
					repairTimes.akashi > 0 ? String(repairTimes.akashi).toHHMMSS() : KC3Meta.term("PanelCantRepair")
				),
				KC3Meta.term("PanelRepairCost").format(repairCost.fuel, repairCost.steel)
			].join("\n")).lazyInitTooltip({ position: { at: "left+25 bottom+5" } });
		}else{
			$(".ship_hp_box", this.element).attr("title", KC3Meta.term("PanelNoRepair"))
				.lazyInitTooltip({ position: { at: "left+25 bottom+5" } });
		}
		
		// If ship is being repaired
		if (PlayerManager.repairShips.indexOf(this.shipData.rosterId) > -1) {
			$(".ship_hp_bar", this.element).addClass("hp_repairing");
			this.element.addClass("hp_repairing");
			// If not being repaired
		} else {
			if (this.shipData.didFlee) {
				//console.debug("Ship", this.shipData.name(), "fled, setting backgrounds to white");
				// if FCF, mark background and hp bar as white
				$(".ship_hp_bar", this.element).addClass("hp_fcf");
				this.element.addClass("hp_fcf");
			} else {
				if (hpPercent <= 0.25) {
					// mark hp bar and container box as red if taiha
					$(".ship_hp_bar,.ship_hp_prediction", this.element).addClass("hp_taiha");
					this.element.addClass("hp_taiha");
				} else if (hpPercent <= 0.50) {
					$(".ship_hp_bar,.ship_hp_prediction", this.element).addClass("hp_chuuha");
				} else if (hpPercent <= 0.75) {
					$(".ship_hp_bar,.ship_hp_prediction", this.element).addClass("hp_shouha");
				} else {
					$(".ship_hp_bar,.ship_hp_prediction", this.element).addClass("hp_normal");
				}
			}

			if (this.shipData.akashiMark) {
				this.element.addClass("akashiMark");
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
	Show diff HP text, new HP bars and its color
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showPrediction = function(){
		// If prediction is disabled, cancel this function
		if(!ConfigManager.info_battle){ return false; }
		
		// Apply only if HP actually changed after prediction
		if(this.shipData.hp[0] != this.shipData.afterHp[0]){
			// Make original HP bar gray
			$(".ship_hp_bar", this.element).addClass("hp_sunk");
			
			// Prediction bar
			var afterHpPercent = this.shipData.afterHp[0] / this.shipData.afterHp[1];
			this.setStyleVar($(".ship_hp_prediction", this.element), "--afterHpPercent", afterHpPercent);
			
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
				$(".ship_hp_prediction", this.element).addClass("hp_taiha");
			} else if(afterHpPercent <= 0.50){
				$(".ship_hp_prediction", this.element).addClass("hp_chuuha");
			} else if(afterHpPercent <= 0.75){
				$(".ship_hp_prediction", this.element).addClass("hp_shouha");
			} else{
				$(".ship_hp_prediction", this.element).addClass("hp_normal");
			}
			
			// Change to damaged ship icon if worse than 'chuuha'
			if(ConfigManager.info_chuuha_icon) {
				$(".ship_img img", this.element).attr("src",
					KC3Ship.shipIcon(this.shipData.masterId, this.shipData.hp[1], this.shipData.afterHp[0])
				);
			}
		}
	};
	
	/* SHOW MORALE
	Morale value on the circle, and its colors
	Add special glow if more than 53
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showMorale = function(){
		const moraleClasses = ["glowing", "morale_sparkle", "morale_normal",
			"morale_mamiya", "morale_orange", "morale_red", ].join(" ");
		$(".ship_morale", this.element).text(this.shipData.morale).removeClass(moraleClasses);
		switch(true){
			case this.shipData.morale > 52: // sparkle and get buff
				$(".ship_morale", this.element).addClass("morale_sparkle glowing");
				break;
			case this.shipData.morale > 49: // sparkle in-game
				$(".ship_morale", this.element).addClass("morale_sparkle");
				break;
			case this.shipData.morale > 39: // no effect in-game, regular state
				$(".ship_morale", this.element).addClass("morale_normal");
				break;
			case this.shipData.morale > 29: // mamiya/irako usable, debuff when < 33
				$(".ship_morale", this.element).addClass("morale_mamiya");
				break;
			case this.shipData.morale > 19: // orange face, debuff
				$(".ship_morale", this.element).addClass("morale_orange");
				break;
			default: // red face, heavy debuff
				$(".ship_morale", this.element).addClass("morale_red");
				break;
		}
	};
	
	/* SHOW EQUIPMENT
	
	---------------------------------------------------*/
	KC3NatsuiroShipbox.prototype.showEquipment = function( slot ){
		var thisGear = false;
		if(this.shipData.slotnum > slot){
			
			if(this.shipData.items[slot] > 0){
				
				thisGear = KC3GearManager.get( this.shipData.items[slot] );
				
				// Unknown item
				if(thisGear.isDummy()){
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).attr("src",
						"/assets/img/ui/empty.png");
					return false;
				}
				
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).attr("src",
					KC3Meta.itemIcon(thisGear.master().api_type[3]));
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
				
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element)
					.attr("data-mst-id", thisGear.masterId)
					.toggleClass("goddess", thisGear.masterId == 43);
				
				if (thisGear.ace > 0) {
					// Is a plane with proficiency level
					$(".ship_gear_"+(slot+1)+" .ship_gear_ace", this.element).show();
					$(".ship_gear_"+(slot+1)+" .ship_gear_ace img", this.element)
						.attr("src", "/assets/img/client/achev/"+thisGear.ace+".png");
				}
				if (thisGear.stars > 0){
					// Is a normal equipment that can be upgraded
					$(".ship_gear_"+(slot+1)+" .ship_gear_star", this.element).show();
					$(".ship_gear_"+(slot+1)+" .ship_gear_star", this.element).text(
						thisGear.stars >= 10 ? "\u2605" : thisGear.stars
					);
				}
				
				// Check damecon, starshell or rosaK2 if prediction is enabled
				if(ConfigManager.info_battle){
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).toggleClass("item_being_used",
						// Consumed damecon slot
						this.dameConConsumed.pos === slot+1 ||
						// Mark all equipped starshell
						(this.starShellUsed && thisGear.masterId == 101) ||
						// Successful 12cm 30tube Rocket Launcher K2 AA defense
						(this.rosaK2Success && thisGear.masterId === 274) ||
						// Mark all Smoke Generators
						(this.smokeEmitted && [500, 501].includes(thisGear.masterId))
					);
				} else {
					$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).removeClass("item_being_used");
				}
				
			}else{
				$(".ship_gear_"+(slot+1)+" .ship_gear_icon img", this.element).hide();
				$(".ship_gear_"+(slot+1), this.element).addClass("empty");
			}
			
			const slotSizeClasses = ["slot_size_empty", "slot_size_taiha",
				"slot_size_chuuha", "slot_size_shouha", "slot_size_full"].join(" ");
			$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).removeClass(slotSizeClasses);
			if(this.shipData.slots[slot] > 0 ||
				(thisGear && KC3GearManager.carrierBasedAircraftType3Ids.indexOf(thisGear.master().api_type[3]) > -1)
			){
				var slotCurr = this.shipData.slots[slot];
				$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).text( slotCurr );
				// For now, max slot size will be forced to 1 if Large Flying Boat equipped,
				// and will restore to its default capacity on resupply if other equipped
				var slotMax = thisGear && thisGear.master().api_type[2] === 41 ? 1 : this.shipData.master().api_maxeq[slot];
				if(slotCurr < slotMax){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).attr("title",
						"{0} /{1}".format(slotCurr, slotMax) ).lazyInitTooltip();
				}
				var slotPercent = slotCurr / (slotMax || 1);
				if(slotPercent <= 0){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).addClass("slot_size_empty");
				} else if(slotPercent <= 0.25){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).addClass("slot_size_taiha");
				} else if(slotPercent <= 0.50){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).addClass("slot_size_chuuha");
				} else if(slotPercent <= 0.75){
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).addClass("slot_size_shouha");
				} else {
					$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).addClass("slot_size_full");
				}
			}else{
				$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).text("");
			}
			
			$(".ship_gear_"+(slot+1), this.element).show();
		}else{
			$(".ship_gear_"+(slot+1)+" .ship_gear_icon", this.element).hide();
			$(".ship_gear_"+(slot+1)+" .ship_gear_slot", this.element).hide();
			$(".ship_gear_"+(slot+1)+" .sship_gear_slot", this.element).hide();
		}
	};
	
})();
