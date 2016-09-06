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
		bases: [],
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
			this.bases = [
				new KC3LandBase(),
				new KC3LandBase(),
				new KC3LandBase(),
				new KC3LandBase()
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
			var self = this;
			[0,1,2,3].forEach(function(i){
				self.fleets[i].update( data[i] || {} );
			});
			localStorage.fleets = JSON.stringify(this.fleets);
		},

		setBases :function( data ){
			var self = this;
			[0,1,2,3].forEach(function(i){
				self.bases[i] = new KC3LandBase(data[i]);
			});
			localStorage.bases = JSON.stringify(self.bases);
		},

		setRepairDocks :function( data ){
			var lastRepair = this.repairShips.map(function(x){return x;}); // clone
			this.repairShips.splice(0);
			var dockingShips = [];
			var self = this;
			$.each(data, function(ctr, ndock){
				if(lastRepair[ndock.api_id] != ndock.api_ship_id) { // check if not in the list (repaired)
					KC3ShipManager.get(lastRepair[ndock.api_id]).applyRepair();
				}

				if(ndock.api_state > 0){
					self.repairShips[ ndock.api_id ] = ndock.api_ship_id;
					var repairInfo =
						{ id: ndock.api_ship_id,
						  completeTime: ndock.api_complete_time
						};
					dockingShips.push( repairInfo );
					KC3TimerManager.repair( ndock.api_id ).activate(
						ndock.api_complete_time,
						KC3ShipManager.get( ndock.api_ship_id ).masterId
					);
				}else{
					KC3TimerManager.repair( ndock.api_id ).deactivate();
				}
			});
			// "localStorage.dockingShips" is not supposed
			// to be modified,
			// it record the most recent docking ships
			// whenever a docking event comes
			localStorage.dockingShips = JSON.stringify(dockingShips);
		},

		// cached docking ships' status
		// the return value is an object whose properties are "x{ship_id}"
		// with value set to the completeTime
		getCachedDockingShips: function() {
			var dockingShips = {};
			if (typeof localStorage.dockingShips !== "undefined") {
				try {
					var ndockData = JSON.parse( localStorage.dockingShips );
					$.each(ndockData, function (i, v) {
						var key = "x" + v.id.toString();
						dockingShips[key] = v.completeTime;
					});
				} catch (err) {
					console.error( "Error while processing cached docking ship" );
					console.error(err);
				}
			}
			return dockingShips;
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
			this.hq.lastMaterial = data;
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
			var newStatistics = {
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
			};
			if(newStatistics.sortie.rate===0){
				newStatistics.sortie.rate = Math.round(newStatistics.sortie.win / (newStatistics.sortie.win + newStatistics.sortie.lose) * 10000)/100;
			}
			if(newStatistics.pvp.rate===0){
				newStatistics.pvp.rate = Math.round(newStatistics.pvp.win / (newStatistics.pvp.win + newStatistics.pvp.lose) *10000)/100;
			}
			if(newStatistics.exped.rate===0){
				newStatistics.exped.rate =  Math.round(newStatistics.exped.success / newStatistics.exped.total * 10000)/100;
			}
			// console.log("rates", newStatistics.sortie.rate, newStatistics.pvp.rate, newStatistics.exped.rate);
			localStorage.statistics = JSON.stringify(newStatistics);
		},

		setNewsfeed :function( data, stime ){
			//console.log("newsfeed", data);
			$.each(data, function( index, element){
				//console.log("checking newsfeed item", element);
				if(parseInt(element.api_state, 10) !== 0){
					//console.log("saved news", element);
					KC3Database.Newsfeed({
						type: element.api_type,
						message: element.api_message,
						time: stime
					});
				}
			});
		},

		portRefresh :function( data ){
			var
				self      = this,
				// get server time (as usual)
				ctime     = Math.hrdInt("floor",(new Date(data.time)).getTime(),3,1);

			if(!(this.hq.lastPortTime && this.hq.lastMaterial)) {
				if(!this.hq.lastPortTime)
					this.hq.lastPortTime = ctime;
				if(!this.hq.lastMaterial)
					this.hq.lastMaterial = data.matAbs;
				return false;
			}

			this.fleets.forEach(function(fleet){ fleet.checkAkashi(); });

			var
				// get current player regen cap
				regenCap  = this.hq.getRegenCap(),
				// get regen time
				regenTime = {
					// find next multiplier of 3 from last time
					start: Math.hrdInt("ceil" ,this.hq.lastPortTime,Math.log10(3 * 60),1),
					// find last multiplier of 3 that does not exceeds the current time
					end  : Math.hrdInt("floor",ctime,Math.log10(3 * 60),1),
				},
				// get regeneration ticks
				regenRate = Math.max(0,regenTime.end - regenTime.start + 1),
				// set regeneration amount
				regenVal  = [3,3,3,1]
					.map(function(x){return regenRate * x;})
					.map(function(x,i){return Math.max(0,Math.min(x,regenCap - self.hq.lastMaterial[i]));});
			console.log(this.hq.lastPortTime,regenTime,ctime);
			// Check whether a server time is supplied, or keep the last refresh time.
			this.hq.lastPortTime = (data.time && ctime) || (this.hq.lastPortTime);
			console.info("regen" ,regenVal);
			console.info.apply(console,["pRegenMat"].concat(this.hq.lastMaterial));
			console.info.apply(console,["actualMat"].concat((this.hq.lastMaterial || []).map(function(x,i){
				return (x || 0) + regenVal[i];
			})));
			KC3Database.Naverall({
				hour:Math.hrdInt('floor',ctime/3.6,3,1),
				type:'regen',
				data:regenVal.concat([0,0,0,0])
			});
			this.hq.lastMaterial = data.matAbs || this.hq.lastMaterial;

			this.hq.save();
		},

		loadFleets :function(){
			if(typeof localStorage.fleets != "undefined"){
				var oldFleets =JSON.parse( localStorage.fleets );
				this.fleets = this.fleets.map(function(x,i){
					return (new KC3Fleet()).defineFormatted(oldFleets[i]);
				});
			}
		},

		loadBases :function(){
			if(typeof localStorage.bases != "undefined"){
				var oldBases = JSON.parse( localStorage.bases );
				this.bases = oldBases.map(function(baseData){
					return (new KC3LandBase()).defineFormatted(baseData);
				});
			}
		},
		
		fleets_backup :function(){
			return this.fleets.map(function(x,i){
				return x.ships.map(function(s){
					return new KC3Ship(KC3ShipManager.get(s));
				});
			});
		}
		
	};

})();
