(function(){
	"use strict";
	
	KC3StrategyTabs.wikia = new KC3StrategyTab("wikia");
	
	KC3StrategyTabs.wikia.definition = {
		tabSelf: KC3StrategyTabs.wikia,
		
		fleets: [],
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init: function(){
			PlayerManager.loadFleets();
			console.log(PlayerManager.fleets);
			console.log("http://www.kancolle-calc.net/deckbuilder.html?predeck=".concat(encodeURI(
						JSON.stringify({
							"version":3,
							"f1":this.generate_fleet_JSON(PlayerManager.fleets[0]),
							"f2":this.generate_fleet_JSON(PlayerManager.fleets[1]),
							"f3":this.generate_fleet_JSON(PlayerManager.fleets[2]),
							"f4":this.generate_fleet_JSON(PlayerManager.fleets[3]),
							})
					)));
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute: function(){
      $('.tab_wikia .wikia_list').html('');

      this.show_fleet_code(0, PlayerManager.fleets[0]);
      this.show_fleet_code(1, PlayerManager.fleets[1]);
      this.show_fleet_code(2, PlayerManager.fleets[2]);
      this.show_fleet_code(3, PlayerManager.fleets[3]);
		},

		/* Split the name and remodel with a slash
		--------------------------------------------*/
    process_ship_name: function(ship) {
      var api_name = ship.name();
      var base_name = api_name
        .replace(' Kai Ni', '')
        .replace(' Kai', '')
        .replace(' zwei', '')
        .replace(' drei', '')
        .replace(' Carrier Kai Ni', '')
        .replace(' Carrier Kai', '')
        .replace(' Carrier', '');

      // Special case because Chiyoda and Chitose have an "A" remodel which could be part of a name
      if(api_name.substr(0, 7) == 'Chiyoda' || api_name.substr(0, 7) == 'Chitose') {
        base_name = base_name.replace('-A', '');
      }

      var remodel = api_name.split(base_name + ' ')[1] || '';

      return [base_name, remodel];
    },

		/* Show wikia code for a single fleet
		--------------------------------------------*/
    show_fleet_code: function(index, fleet) {
      if(!fleet.active) return false;

      // Create the box and apply basic values
      var box = $('.tab_wikia .factory .wikia_box').clone().appendTo('.tab_wikia .wikia_list');
      box.attr('id', 'wikia_box' + index);
      $('.wikia_name', box).text(fleet.name);

      // Start up the code string
      var code = "{{EventComp\n";

      // Iterate over the ships in this fleet
      for(var i = 0; i < fleet.ships.length; i++) {
        if(fleet.ships[i] > -1) code += this.show_ship_code(box, fleet.ships[i]);
      }

      code += "| hq = " + PlayerManager.hq.level + "\n";
      code += "}}";

      $('.wikia_code', box).text(code);
      
    },

		/* Show wikia code for a single ship
		--------------------------------------------*/
    show_ship_code: function(box, ship_id) {
      var ship = KC3ShipManager.get(ship_id);
      var ship_name = this.process_ship_name(ship).join('/');
      var code = '';

      code += "| " + ship_name  + "\n";
      code += "| " + ship.level + "\n";

      code += this.show_equip_code(ship.items[0]);
      code += this.show_equip_code(ship.items[1]);
      code += this.show_equip_code(ship.items[2]);
      code += this.show_equip_code(ship.items[3]);

      code += "|-\n";

      return code;
    },

    show_equip_code: function(equip_id) {
      if(equip_id > -1) {
        var equip = KC3GearManager.get(equip_id);
        return "| " + equip.name() + "\n";
      } else {
        return '';
      }
    },
    
		/* Code for generating deckbuilder style JSON data.
		--------------------------------------------*/
    generate_fleet_JSON: function(fleet) {
    	var result = {};
    	for(var i = 0; i < fleet.ships.length; i++) {
    		if(fleet.ships[i] > -1){
    			result["s".concat(i+1)] = this.generate_ship_JSON(fleet.ships[i]);
    		}
    	}
    	return result;
    },
    generate_ship_JSON: function(ship_ID) {
    	var result = {};
    	var ship = KC3ShipManager.get(ship_ID);
    	result["id"] = ship.masterId;
    	result["lv"] = ship.level;
    	result["luck"] = ship.lk[0];
    	result["items"] = this.generate_equipment_JSON(ship);
    	return result;
    },
    generate_equipment_JSON: function(shipObj) {
    	var result = {};
    	for(var i = 0; i < 4; i++) {
    		if(shipObj.items[i]> -1){
    			result["i".concat(i+1)] ={
    					"id":KC3GearManager.get(shipObj.items[i]).masterId,
    					"rf":KC3GearManager.get(shipObj.items[i]).stars
    			};
    		} else {
    			break;
    		}
    	}
    	return result;
    },
	};
})();
