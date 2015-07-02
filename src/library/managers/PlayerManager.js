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
		repairSlots: 2,
		repairShips: [],
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
			this.repairShips = [];
			var self = this;
			$.each(data, function(ctr, ndock){
				if(ndock.api_state > 0){
					self.repairShips.push( ndock.api_ship_id );
					KC3TimerManager.repair( ndock.api_id ).activate(
						ndock.api_complete_time,
						KC3ShipManager.get( ndock.api_ship_id ).masterId
					);
				}else{
					KC3TimerManager.repair( ndock.api_id ).deactivate();
				}
			});
		},
		
		setBuildDocks :function( data ){
			$.each(data, function(ctr, kdock){
				if(kdock.api_state > 0){
					KC3TimerManager.build( kdock.api_id ).activate(
						kdock.api_complete_time,
						kdock.api_created_ship_id
					);
				}else{
					KC3TimerManager.build( kdock.api_id ).deactivate();
				}
			});
		},
		
		setResources :function( data ){
			// insert to IndexedDB
		},
		
		setConsumables :function( data ){
			$.extend(this.consumables, data);
		},
		
		setStatistics :function( data ){
			$.extend( this.statistics, JSON.parse(localStorage.statistics || "{}"), data);
			localStorage.statistics = JSON.stringify( this.statistics );
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