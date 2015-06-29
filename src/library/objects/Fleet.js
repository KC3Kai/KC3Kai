/* Fleet.js
KC3改 Fleet Object

Contains summary information about a fleet and its 6 ships
{
	"api_member_id":18066975,
	"api_id":1,
	"api_name":"111",
	"api_name_id":"136558260",
	"api_mission":[ 0, 0, 0, 0 ],
	"api_flagship":"0",
	"api_ship":[ 76, -1, -1, -1, -1, -1 ]
}
*/
(function(){
	"use strict";
	
	window.KC3Fleet = function( data ){
		this.active = false;
		this.name = "";
		this.ships = [ -1, -1, -1, -1, -1, -1 ];
		this.mission = [ 0, 0, 0, 0 ];
	};
	
	KC3Fleet.prototype.update = function( data ){
		if(typeof data.api_member_id != "undefined"){
			this.active = true;
			this.name = data.api_name;
			this.ships = data.api_ship;
			this.mission = data.api_mission;
		}
	};
	
	KC3Fleet.prototype.ship = function( slot ){
		return KC3ShipManager.get( this.ships[slot] );
	};
	
	KC3Fleet.prototype.countShips = function( slot ){
		return $.grep(this.ships, function(shipId){ return shipId>-1; }).length;
	};
	
	KC3Fleet.prototype.clearNonFlagShips = function(){
		this.ships[1] = -1;
		this.ships[2] = -1;
		this.ships[3] = -1;
		this.ships[4] = -1;
		this.ships[5] = -1;
	};
	
	KC3Fleet.prototype.totalLevel = function(){
		return this.ship(0).level
			+ this.ship(1).level
			+ this.ship(2).level
			+ this.ship(3).level
			+ this.ship(4).level
			+ this.ship(5).level;
	};
	
	KC3Fleet.prototype.countDrums = function(){
		return this.ship(0).countDrums()
			+ this.ship(1).countDrums()
			+ this.ship(2).countDrums()
			+ this.ship(3).countDrums()
			+ this.ship(4).countDrums()
			+ this.ship(5).countDrums();
	};
	
	KC3Fleet.prototype.countShipsWithDrums = function(){
		var shipsWithDrums = 0;
		shipsWithDrums += (this.ship(0).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(1).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(2).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(3).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(4).countDrums() > 0)?1:0;
		shipsWithDrums += (this.ship(5).countDrums() > 0)?1:0;
		return shipsWithDrums;
	};
	
	KC3Fleet.prototype.averageLevel = function(){
		return this.totalLevel() / this.countShips();
	};
	
	KC3Fleet.prototype.fighterPower = function(){
		return this.ship(0).fighterPower()
			+ this.ship(1).fighterPower()
			+ this.ship(2).fighterPower()
			+ this.ship(3).fighterPower()
			+ this.ship(4).fighterPower()
			+ this.ship(5).fighterPower();
	};
	
	KC3Fleet.prototype.speed = function(){
		
	};
	
	KC3Fleet.prototype.qualifyingExpeditions = function(){
		
	};
	
	KC3Fleet.prototype.compileStats = function(){
		
	};
	
	KC3Fleet.prototype.canCombineCarrier = function(){
		
	};
	
	KC3Fleet.prototype.canCombineSurface = function(){
		
	};
	
	KC3Fleet.prototype.supportPower = function(){
		
	};
	
	KC3Fleet.prototype.eLoS = function(){
		switch(ConfigManager.elosFormula){
			case 1: this.eLos1(); break;
			case 2: this.eLos2(); break;
			default: this.eLos3(); break;
		}
	};
	
	KC3Fleet.prototype.eLos1 = function(){
		
	};
	
	KC3Fleet.prototype.eLos2 = function(){
		
	};
	
	KC3Fleet.prototype.eLos3 = function(){
		
	};
	
	KC3Fleet.prototype.sortieJson = function(){
		var ReturnObj = [];
		var thisFleet = app.Docks._fleets[index];
		var ctr, thisShip;
		if (typeof thisFleet != "undefined") {
			for(ctr in thisFleet.api_ship){
				if(thisFleet.api_ship[ctr] > -1){
					thisShip = app.Ships.get( thisFleet.api_ship[ctr] );
					ReturnObj.push({
						mst_id: thisShip.api_ship_id,
						level: thisShip.api_lv,
						kyouka: thisShip.api_kyouka,
						morale: thisShip.api_cond,
						equip: [
							this.CompileShipEquip( thisShip.api_slot[0] ),
							this.CompileShipEquip( thisShip.api_slot[1] ),
							this.CompileShipEquip( thisShip.api_slot[2] ),
							this.CompileShipEquip( thisShip.api_slot[3] )
						],
					});
				}else{
					ReturnObj.push(false);
				}
			}
		}
		return ReturnObj;
	};
	
})();