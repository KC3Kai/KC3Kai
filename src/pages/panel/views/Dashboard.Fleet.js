KC3.prototype.Dashboard.Fleet = {
	selectedFleet: 1,
	currentShipLos: 0,
	
	update :function(animateID){
		// If fleet doesn't exist yet (player has not yet unlocked the fleet)
		if(typeof app.Docks._fleets[this.selectedFleet-1] == "undefined"){ return false; }
		
		// If there's no ship animating
		if(typeof animateID == "undefined"){ animateID = -2; }
		
		// Clear old summary
		app.Fleet.clear();
		
		// Fleet Ships
		var fleetShipIds = app.Docks._fleets[this.selectedFleet-1].api_ship;
		this.ship(0, fleetShipIds[0], animateID);
		this.ship(1, fleetShipIds[1], animateID);
		this.ship(2, fleetShipIds[2], animateID);
		this.ship(3, fleetShipIds[3], animateID);
		this.ship(4, fleetShipIds[4], animateID);
		this.ship(5, fleetShipIds[5], animateID);
		
		// Fleet summary
		if(!app.Fleet.complete){
			$(".fleet-summary .summary-eqlos").addClass("incomplete");
			$(".fleet-summary .summary-airfp").addClass("incomplete");
		}else{
			$(".fleet-summary .summary-eqlos").removeClass("incomplete");
			$(".fleet-summary .summary-airfp").removeClass("incomplete");
		}
		$(".fleet-summary .summary-level .summary-text").text(app.Fleet.level);
		$(".fleet-summary .summary-eqlos .summary-text").text(app.Fleet.getEffectiveLoS());
		$(".fleet-summary .summary-airfp .summary-text").text(app.Fleet.fighter_power);
		$(".fleet-summary .summary-speed .summary-text").text(app.Fleet.speed);
	},
	
	ship :function(index, ship_id, animateID){
		var thisShip, masterShip, hpPercent, expPercent;
		var thisElement = ".fleet-ship-"+(index+1);
		if(ship_id > -1){
			if(app.Ships.get(ship_id)===false){ $(thisElement).hide(); return false; }
			thisShip = app.Ships.get(ship_id);
			masterShip = app.Master.ship(thisShip.api_ship_id);
			
			app.Fleet.level += thisShip.api_lv;
			app.Fleet.total_los += thisShip.api_sakuteki[0];
			if(masterShip.api_soku < 10){ app.Fleet.speed = "Slow"; }
			
			$(thisElement+" .ship-img img").attr("src", app.Assets.shipIcon(thisShip.api_ship_id, '../../assets/img/ui/empty.png'));
			$(thisElement+" .ship-name").text(masterShip.english);
			$(thisElement+" .ship-type").text(app.Meta.stype(masterShip.api_stype));
			$(thisElement+" .ship-hp-text").text(thisShip.api_nowhp +" / "+ thisShip.api_maxhp);
			hpPercent = thisShip.api_nowhp / thisShip.api_maxhp;
			$(thisElement+" .ship-hp-val").css("width", (98*hpPercent)+"px");
			$(thisElement+" .ship-hp-nval").css("width", (98*hpPercent)+"px");
			$(thisElement).removeClass("repair-effect");
			$(thisElement).removeClass("danger-effect");
			
			if( app.Docks._repair_ids.indexOf(ship_id) > -1 ){
				$(thisElement).addClass("repair-effect");
			}
			
			if(hpPercent <= 0.25){
				$(thisElement+" .ship-img").css("background", "#FF0000");
				$(thisElement+" .ship-hp-val").css("background", "#FF0000");
				if( app.Docks._repair_ids.indexOf(ship_id) == -1 ){
					$(thisElement).addClass("danger-effect");
				}
			}else if(hpPercent <= 0.50){
				$(thisElement+" .ship-img").css("background", "#FF9900");
				$(thisElement+" .ship-hp-val").css("background", "#FF9900");
			}else if(hpPercent <= 0.75){
				$(thisElement+" .ship-img").css("background", "#555");
				$(thisElement+" .ship-hp-val").css("background", "#FFFF00");
			}else{
				$(thisElement+" .ship-img").css("background", "#555");
				$(thisElement+" .ship-hp-val").css("background", "#00FF00");
			}
			$(thisElement+" .ship-hp-nval").css("background", $(thisElement+" .ship-hp-val").css("background"));
			 
			$(thisElement+" .ship-lvl-txt").text(thisShip.api_lv);
			$(thisElement+" .ship-lvl-next").text("-"+thisShip.api_exp[1]);
			$(thisElement+" .ship-lvl-val").css("width", (56*(thisShip.api_exp[2]/100))+"px");
			$(thisElement+" .ship-morale-box").text(thisShip.api_cond);
			
			$(thisElement+" .ship-morale-box").css("border-color", "#AAA");
			if(thisShip.api_cond>49){
				$(thisElement+" .ship-morale-box").css("background", "#FFFF00");
				$(thisElement+" .ship-morale-box").css("border-color", "#FFCC00");
			}else if(thisShip.api_cond>39){
				$(thisElement+" .ship-morale-box").css("background", "#FFF");
			}else if(thisShip.api_cond>29){
				$(thisElement+" .ship-morale-box").css("background", "#FFCE84");
			}else if(thisShip.api_cond>19){
				$(thisElement+" .ship-morale-box").css("background", "#FF9900");
			}else{
				$(thisElement+" .ship-morale-box").css("background", "#FF0000");
			}
			
			this.currentShipLos = thisShip.api_sakuteki[0];
			// console.log("starting ship: "+this.currentShipLos);
			this.equip($(thisElement+" .ship-gear-1 img"), thisShip.api_slot[0], thisShip.api_onslot[0]);
			this.equip($(thisElement+" .ship-gear-2 img"), thisShip.api_slot[1], thisShip.api_onslot[1]);
			this.equip($(thisElement+" .ship-gear-3 img"), thisShip.api_slot[2], thisShip.api_onslot[2]);
			this.equip($(thisElement+" .ship-gear-4 img"), thisShip.api_slot[3], thisShip.api_onslot[3]);
			// console.log("added to naked los summation: "+this.currentShipLos);
			app.Fleet.naked_los += Math.sqrt(this.currentShipLos);
			// console.log("new naked los summation: "+app.Fleet.naked_los);
			
			if(ship_id == animateID){
				$("div", thisElement).hide();
				$("div", thisElement).fadeIn();
			}
			
			$(thisElement).show();
		}else{
			$(thisElement).hide();
		}
	},
	
	equip :function(imgElement, gear_id, capacity){
		if(gear_id > -1){
			imgElement.show();
			if(app.Gears.get(gear_id) === false){
				imgElement.attr("src", "../../assets/img/items/0.png");
				app.Fleet.complete = false;
				return false;
			}
			
			thisItem = app.Gears.get(gear_id);
			masterItem = app.Master.slotitem(thisItem.api_slotitem_id);
			
			this.currentShipLos -= masterItem.api_saku;
			app.Fleet.includeEquip(thisItem, masterItem, capacity);
			imgElement.attr("src", "../../assets/img/items/"+masterItem.api_type[3]+".png");
		}else{
			imgElement.hide();
		}
	}
	
};