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
		repairShips: [-1,-1,-1,-1,-1],
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
			if(this.hq.id !== 0 && this.hq.id != data.mid){
				this.hq.logout();
				this.hq = new KC3Player();
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
					self.repairShips[ ndock.api_id ] = ndock.api_ship_id;
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
					if(kdock.api_item1 > 999){
						KC3TimerManager.build( kdock.api_id ).lsc = true;
					}else{
						KC3TimerManager.build( kdock.api_id ).lsc = false;
					}
				}else{
					KC3TimerManager.build( kdock.api_id ).deactivate();
				}
			});
		},
		
		setResources :function( data, stime ){
			if(typeof localStorage.lastResource == "undefined"){ localStorage.lastResource = 0; }
			var ResourceHour = Math.floor(stime/3600);
			if(ResourceHour == localStorage.lastResource){ return false; }
			localStorage.lastResource = ResourceHour;
			KC3Database.Resource({
				rsc1 : data[0],
				rsc2 : data[1],
				rsc3 : data[2],
				rsc4 : data[3],
				hour : ResourceHour
			});
		},
		
		setConsumables :function( data, stime ){
			$.extend(this.consumables, data);
			
			if(typeof localStorage.lastUseitem == "undefined"){ localStorage.lastUseitem = 0; }
			var ResourceHour = Math.floor(stime/3600);
			if(ResourceHour == localStorage.lastUseitem){ return false; }
			localStorage.lastUseitem = ResourceHour;
			KC3Database.Useitem({
				torch : data.torch,
				screw : data.screws,
				bucket : data.buckets,
				devmat : data.devmats,
				hour : ResourceHour
			});
		},
		
		setStatistics :function( data ){
			var oldStatistics = JSON.parse(localStorage.statistics || "{\"exped\":{},\"pvp\":{},\"sortie\":{}}");
			localStorage.statistics = JSON.stringify({
				exped: {
					rate: data.exped.rate || oldStatistics.exped.rate || 0,
					total: data.exped.total || oldStatistics.exped.total,
					success: data.exped.success || oldStatistics.exped.success
				},
				pvp: {
					rate: data.pvp.rate || oldStatistics.pvp.rate || 0,
					win: data.pvp.win || oldStatistics.pvp.win,
					lose: data.pvp.lose || oldStatistics.pvp.lose,
					attacked: data.pvp.attacked || oldStatistics.pvp.attacked,
					attacked_win: data.pvp.attacked_win || oldStatistics.pvp.attacked_win
				},
				sortie: {
					rate: data.sortie.rate || oldStatistics.sortie.rate || 0,
					win: data.sortie.win || oldStatistics.sortie.win,
					lose: data.sortie.lose || oldStatistics.sortie.lose
				}
			});
		},
		
		setNewsfeed :function( data, stime ){
			$.each(data, function( index, element){
				if(element.api_state=="1"){
					KC3Database.Newsfeed({
						type: element.api_type,
						message: element.api_message,
						time: stime
					});
				}
			});
		},
		
		loadFleets :function(){
			if(typeof localStorage.fleets != "undefined"){
				var oldFleets =JSON.parse( localStorage.fleets );
				this.fleets = [
					(new KC3Fleet()).defineFormatted(oldFleets[0]),
					(new KC3Fleet()).defineFormatted(oldFleets[1]),
					(new KC3Fleet()).defineFormatted(oldFleets[2]),
					(new KC3Fleet()).defineFormatted(oldFleets[3])
				];
			}
		}
		
	};
	
})();