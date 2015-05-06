var TabFleets = {
	active: false,
	currentShipLos: 0,
	
	/* onReady, initialize
	--------------------------------------------*/
	init :function(){
		if(this.active) return false; this.active = true;
		app.Player.load();
		app.Ships.load();
		app.Gears.load();
	},
	
	/* Show the page
	--------------------------------------------*/
	show :function(){
		if(typeof localStorage.player_fleets == "undefined"){
			alert("Unable to load your ship list.");
			return false;
		}
		
		var fleets = JSON.parse(localStorage.player_fleets);
		$(".page_fleets .fleet_list").html("");
		this.showFleet( fleets[0] );
		this.showFleet( fleets[1] );
		this.showFleet( fleets[2] );
		this.showFleet( fleets[3] );
	},
	
	showFleet :function(fleet_data){
		if(typeof fleet_data == "undefined"){
			alert("Unable to load your ship list.");
			return false;
		}
		
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
					// console.log(fleet_data.api_ship[shipCtr]);
					this.showShip( fleetBox , fleet_data.api_ship[shipCtr]);
				}
			}
			
			// Fleet summary
			if(!app.Fleet.complete){
				$(".detail_los2", fleetBox).addClass("incomplete");
				$(".detail_los3", fleetBox).addClass("incomplete");
				$(".detail_air", fleetBox).addClass("incomplete");
			}
			$(".detail_level .detail_value", fleetBox).text(app.Fleet.level);
			$(".detail_los2 .detail_value", fleetBox).text(app.Fleet.getEffectiveLoS(2));
			$(".detail_los3 .detail_value", fleetBox).text(app.Fleet.getEffectiveLoS(3));
			$(".detail_air .detail_value", fleetBox).text(app.Fleet.fighter_power);
			$(".detail_speed .detail_value", fleetBox).text(app.Fleet.speed);
		}
	},
	
	showShip :function( fleetBox, ship_id ){
		// console.log("showShip: "+ship_id);
		// console.log("showShip2: "+app.Ships.get(ship_id));
		if(app.Ships.get(ship_id) !== false){
			var thisShip = app.Ships.get(ship_id);
			var masterShip = app.Master.ship(thisShip.api_ship_id);
			// console.log(thisShip);
			
			app.Fleet.level += thisShip.api_lv;
			app.Fleet.total_los += thisShip.api_sakuteki[0];
			if(masterShip.api_soku < 10){ app.Fleet.speed = "Slow"; }
			
			// console.log(fleetBox.attr("id"));
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