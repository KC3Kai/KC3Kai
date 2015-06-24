/* PlayerManager.js
KC3改 Player Manager

Manages info about the player and all its holdings
Includes HQ, Fleet, Docks
Does not include Ships and Gears which are managed by other Managers
*/
(function(){
	"use strict";
	
	window.PlayerManager = {
		hq: {},
		consumables: {},
		fleets: [],
		fleetCount: 1,
		repairDocks: [],
		repairSlots: 2,
		repairShips: [],
		buildDocks: [],
		buildSlots: 2,
		combinedFleet: 0,
		statistics: {},
		
		init :function(){
			this.hq = new KC3Player();
			this.consumables = {
				fcoin: 0,
				buckets : 0,
				devmats : 0,
				screws: 0,
				torch: 0,
				blueprints: 0
			};
			this.fleets = [
				new KC3Fleet(),
				new KC3Fleet(),
				new KC3Fleet(),
				new KC3Fleet()
			];
			this.repairDocks = [
				new KC3RepairDock(),
				new KC3RepairDock(),
				new KC3RepairDock(),
				new KC3RepairDock()
			];
			this.buildDocks = [
				new KC3BuildDock(),
				new KC3BuildDock(),
				new KC3BuildDock(),
				new KC3BuildDock()
			];
		},
		
		setHQ :function( data ){
			// Check if player suddenly changed
			if(this.hq.id != 0 && this.hq.id != data.mid){
				this.hq.logout();
				this.hq = new Player();
			}
			// Update player with new data
			this.hq.update( data );
			this.hq.save();
		},
		
		setFleets :function( data ){
			this.fleets[0].update( data[0] || {} );
			this.fleets[1].update( data[1] || {} );
			this.fleets[2].update( data[2] || {} );
			this.fleets[3].update( data[3] || {} );
			localStorage.fleets = JSON.stringify(this.fleets);
		},
		
		setRepairDocks :function( data ){
			this.repairDocks = [
				new KC3RepairDock( data[0] || {} ),
				new KC3RepairDock( data[1] || {} ),
				new KC3RepairDock( data[2] || {} ),
				new KC3RepairDock( data[3] || {} )
			];
		},
		
		setBuildDocks :function( data ){
			this.buildDocks = [
				new KC3BuildDock( data[0] || {} ),
				new KC3BuildDock( data[1] || {} ),
				new KC3BuildDock( data[2] || {} ),
				new KC3BuildDock( data[3] || {} )
			];
		},
		
		setResources :function( data ){
			// insert to IndexedDB
		},
		
		setConsumables :function( data ){
			$.extend(this.consumables, data);
		},
		
		setStatistics :function( data ){
			$.extend( this.statistics, JSON.parse(localStorage.player_statistics)||{}, data);
		},
		
		setNewsfeed :function( data ){
			$.each(data, function( index, element){
				if(element.api_state=="1"){
					// insert to IndexedDB
					/* {
						type: element.api_type,
						message: element.api_message
					} */
				}
			})
		}
		
	};
	
})();