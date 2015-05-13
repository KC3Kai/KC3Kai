var TabFleets = {
	status: {
		active: false,
		error: false,
		message: "",
		check :function(){
			if(this.error){
				app.Strategy.showError( this.status.message );
				return false;
			}
			return true;
		}
	},
	
	currentShipLos: 0,
	
	/* Load required data, set error if not available
	---------------------------------------------------*/
	init :function(){
		if(this.status.active) return true;
		
		// Load fleets and error if empty
		if( app.Docks.loadFleets() == 0 ){
			this.status.error = true;
			this.status.message = "Fleet information not available";
			return false;
		}
		
		// Load ships and error if empty
		if( app.Ships.load() == 0 ){
			this.status.error = true;
			this.status.message = "Ship list not available";
			return false;
		}
		
		// Load equipment and error if empty
		if( app.Gears.load() == 0 ){
			this.status.error = true;
			this.status.message = "Equipment list not available";
			return false;
		}
		
		this.status.active = true;
	},
	
	/* Attempt to show the page
	--------------------------------------------*/
	show :function(){
		if(!this.status.check()) return false;
		
		// Empty fleet list
		$(".page_fleets .fleet_list").html("");
		
		// Execute fleet fill
		this.showFleet( app.Docks._fleets[0] );
		this.showFleet( app.Docks._fleets[1] );
		this.showFleet( app.Docks._fleets[2] );
		this.showFleet( app.Docks._fleets[3] );
	},
	
	
	/* Show single fleet
	--------------------------------------------*/
	showFleet :function(fleet_data){
		// Check if fleet exists
		if(typeof fleet_data.api_id != "undefined"){
			// Clear old summary
			app.Fleet.clear();
			
			// Create fleet box
			var fleetBox = $(".page_fleets .factory .fleet_box").clone().appendTo(".page_fleets .fleet_list");
			fleetBox.attr("id", "fleet_box"+fleet_data.api_id);
			$(".fleet_name", fleetBox).text( fleet_data.api_name );
			
			// Add ships to fleet box
			var shipCtr;
			for(shipCtr in fleet_data.api_ship){
				if(fleet_data.api_ship[shipCtr] > -1){
					this.showShip( fleetBox , fleet_data.api_ship[shipCtr]);
				}
			}
			
			// Fleet info completion check
			if(!app.Fleet.complete){
				$(".detail_los2", fleetBox).addClass("incomplete");
				$(".detail_los3", fleetBox).addClass("incomplete");
				$(".detail_air", fleetBox).addClass("incomplete");
			}
			
			// Show fleet info
			$(".detail_level .detail_value", fleetBox).text(app.Fleet.level);
			$(".detail_los2 .detail_value", fleetBox).text(app.Fleet.getEffectiveLoS(2));
			$(".detail_los3 .detail_value", fleetBox).text(app.Fleet.getEffectiveLoS(3));
			$(".detail_air .detail_value", fleetBox).text(app.Fleet.fighter_power);
			$(".detail_speed .detail_value", fleetBox).text(app.Fleet.speed);
		}
	},
	
	/* Show single ship
	--------------------------------------------*/
	showShip :function( fleetBox, ship_id ){
		
		// If ship exists on current list
		if(app.Ships.get(ship_id) !== false){
			var thisShip = app.Ships.get(ship_id);
			var masterShip = app.Master.ship(thisShip.api_ship_id);
			
			app.Fleet.level += thisShip.api_lv;
			app.Fleet.total_los += thisShip.api_sakuteki[0];
			if(masterShip.api_soku < 10){ app.Fleet.speed = "Slow"; }
			
			var shipBox = $(".page_fleets .factory .fleet_ship").clone().appendTo("#"+fleetBox.attr("id")+" .fleet_ships");
			$(".ship_type", shipBox).text( app.Meta.stype(masterShip.api_stype) );
			$(".ship_pic img", shipBox).attr("src", app.Assets.shipIcon(masterShip.api_id) );
			$(".ship_lv_val", shipBox).text( thisShip.api_lv );
			$(".ship_name", shipBox).text( masterShip.english );
			
			this.currentShipLos = thisShip.api_sakuteki[0];
			
			this.showEquip( $(".ship_gear_1", shipBox), thisShip.api_slot[0], thisShip.api_onslot[0] );
			this.showEquip( $(".ship_gear_2", shipBox), thisShip.api_slot[1], thisShip.api_onslot[1] );
			this.showEquip( $(".ship_gear_3", shipBox), thisShip.api_slot[2], thisShip.api_onslot[2] );
			this.showEquip( $(".ship_gear_4", shipBox), thisShip.api_slot[3], thisShip.api_onslot[3] );
			
			app.Fleet.naked_los += Math.sqrt(this.currentShipLos);
		}
	},
	
	/* Show single equipment
	--------------------------------------------*/
	showEquip :function( gearBox, gear_id, capacity){
		if(gear_id > -1){
			if(app.Gears.get(gear_id) === false){
				$("img", gearBox).attr("src", "../../assets/img/items/0.png");
				app.Fleet.complete = false;
				return false;
			}
			
			var thisItem = app.Gears.get(gear_id);
			var masterItem = app.Master.slotitem(thisItem.api_slotitem_id);
			
			this.currentShipLos -= masterItem.api_saku;
			app.Fleet.includeEquip(thisItem, masterItem, capacity, "all");
			$("img", gearBox).attr("src", "../../assets/img/items/"+masterItem.api_type[3]+".png");
			$(".gear_name", gearBox).text(masterItem.english);
		}else{
			gearBox.hide();
		}
	}
	
};