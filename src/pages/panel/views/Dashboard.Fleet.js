KC3.prototype.Dashboard.Fleet = {
	selectedFleet: 1,
	currentShipLos: 0,
	
	fillFleetInfo :function(animateID){
		if(typeof animateID == "undefined"){ animateID = -2; }
		
		// Clear old summary
		app.FleetSummary.clear();
		
		// Fleet Ships
		var fleetShipIds = app.Player._fleets[this.selectedFleet-1].api_ship;
		this.fillFleetShip(0, fleetShipIds[0], animateID);
		this.fillFleetShip(1, fleetShipIds[1], animateID);
		this.fillFleetShip(2, fleetShipIds[2], animateID);
		this.fillFleetShip(3, fleetShipIds[3], animateID);
		this.fillFleetShip(4, fleetShipIds[4], animateID);
		this.fillFleetShip(5, fleetShipIds[5], animateID);
		
		// Fleet summary
		if(!app.FleetSummary.complete){
			$("#fleet-summary .summary-eqlos").addClass("incomplete");
			$("#fleet-summary .summary-airfp").addClass("incomplete");
		}
		$("#fleet-summary .summary-level .summary-text").text(app.FleetSummary.level);
		$("#fleet-summary .summary-eqlos .summary-text").text(app.FleetSummary.getEffectiveLoS());
		$("#fleet-summary .summary-airfp .summary-text").text(app.FleetSummary.fighter_power);
		$("#fleet-summary .summary-speed .summary-text").text(app.FleetSummary.speed);
	},
	
	fillFleetShip :function(index, ship_id, animateID){
		var thisShip, masterShip, hpPercent, expPercent;
		var thisElement = "#fleet-ship-"+(index+1);
		if(ship_id > -1){
			thisShip = app.Player._ships[ship_id];
			masterShip = app.Master.ship(thisShip.api_ship_id);
			
			app.FleetSummary.level += thisShip.api_lv;
			app.FleetSummary.total_los += thisShip.api_sakuteki[0];
			if(masterShip.api_soku < 10){ app.FleetSummary.speed = "Slow"; }
			
			$(thisElement+" .ship-img img").attr("src", "../../images/ships/"+thisShip.api_ship_id+".png");
			$(thisElement+" .ship-name").text(masterShip.english);
			$(thisElement+" .ship-type").text(app.Meta.stype(masterShip.api_stype));
			$(thisElement+" .ship-hp-text").text(thisShip.api_nowhp +" / "+ thisShip.api_maxhp);
			hpPercent = thisShip.api_nowhp / thisShip.api_maxhp;
			$(thisElement+" .ship-hp-val").css("width", (98*hpPercent)+"px");
			$(thisElement).removeClass("repair-effect");
			$(thisElement).removeClass("danger-effect");
			
			if( app.Player._repair_ids.indexOf(ship_id) > -1 ){
				$(thisElement).addClass("repair-effect");
			}
			
			if(hpPercent <= 0.25){
				$(thisElement+" .ship-img").css("background", "#FF0000");
				$(thisElement+" .ship-hp-val").css("background", "#FF0000");
				if( app.Player._repair_ids.indexOf(ship_id) == -1 ){
					$(thisElement).addClass("danger-effect");
				}
			}else if(hpPercent < 0.50){
				$(thisElement+" .ship-img").css("background", "#FF9900");
				$(thisElement+" .ship-hp-val").css("background", "#FF9900");
			}else if(hpPercent < 0.75){
				$(thisElement+" .ship-img").css("background", "#555");
				$(thisElement+" .ship-hp-val").css("background", "#FFFF00");
			}else{
				$(thisElement+" .ship-img").css("background", "#555");
				$(thisElement+" .ship-hp-val").css("background", "#00FF00");
			}
			 
			$(thisElement+" .ship-lvl-txt").text(thisShip.api_lv);
			$(thisElement+" .ship-lvl-next").text("-"+thisShip.api_exp[1]);
			$(thisElement+" .ship-lvl-val").css("width", (56*(thisShip.api_exp[2]/100))+"px");
			$(thisElement+" .ship-morale-box").text(thisShip.api_cond);
			
			$(thisElement+" .ship-morale-box").css("border-color", "#AAA");
			if(thisShip.api_cond>49){
				$(thisElement+" .ship-morale-box").css("background", "#FFFF00");
				$(thisElement+" .ship-morale-box").css("border-color", "#FFCC00");
			}else if(thisShip.api_cond>29){
				$(thisElement+" .ship-morale-box").css("background", "#FFF");
			}else if(thisShip.api_cond>19){
				$(thisElement+" .ship-morale-box").css("background", "#FF9900");
			}else{
				$(thisElement+" .ship-morale-box").css("background", "#FF0000");
			}
			
			this.currentShipLos = thisShip.api_sakuteki[0];
			// console.log("starting ship: "+this.currentShipLos);
			this.fillFleetEquip($(thisElement+" .ship-gear-1 img"), thisShip.api_slot[0], thisShip.api_onslot[0]);
			this.fillFleetEquip($(thisElement+" .ship-gear-2 img"), thisShip.api_slot[1], thisShip.api_onslot[1]);
			this.fillFleetEquip($(thisElement+" .ship-gear-3 img"), thisShip.api_slot[2], thisShip.api_onslot[2]);
			this.fillFleetEquip($(thisElement+" .ship-gear-4 img"), thisShip.api_slot[3], thisShip.api_onslot[3]);
			// console.log("added to naked los summation: "+this.currentShipLos);
			app.FleetSummary.naked_los += Math.sqrt(this.currentShipLos);
			// console.log("new naked los summation: "+app.FleetSummary.naked_los);
			
			if(ship_id == animateID){
				$("div", thisElement).hide();
				$("div", thisElement).fadeIn();
			}
			
			$(thisElement).show();
		}else{
			$(thisElement).hide();
		}
	},
	
	fillFleetEquip :function(imgElement, gear_id, capacity){
		if(gear_id > -1){
			if(typeof app.Player._gears[gear_id] == "undefined"){
				imgElement.hide();
				app.FleetSummary.complete = false;
				return false;
			}
			
			thisItem = app.Player._gears[gear_id];
			masterItem = app.Master.slotitem(thisItem.api_slotitem_id);
			
			this.currentShipLos -= masterItem.api_saku;
			app.FleetSummary.includeEquip(thisItem, masterItem, capacity);
			
			imgElement.attr("src", "../../images/items/"+masterItem.api_type[3]+".png");
			imgElement.show();
		}else{
			imgElement.hide();
		}
	}
	
};