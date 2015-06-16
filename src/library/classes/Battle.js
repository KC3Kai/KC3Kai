KC3.prototype.Battle  = {
	onSortie : 0,
	onNode : 0,
	enemyId : -1,
	currentBattle : {},
	
	CompileFleetInfo :function(index){
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
	},
	
	CompileShipEquip :function(gear_id){
		if(gear_id > -1){
			if(app.Gears.get(gear_id)){
				return app.Gears.get(gear_id).api_slotitem_id;
			}else{
				return 9999;
			}
		}else{
			return false;
		}
	},
	
	StartSortie :function(world, mapnum, fleetnum, stime){
		// If still on sortie, end previous one
		if(this.onSortie > 0){ this.EndSortie(); }
		
		var self = this;
		app.Logging.Sortie({
			world: world,
			mapnum: mapnum,
			fleetnum: parseInt(fleetnum, 10),
			combined: app.Docks._combined,
			fleet1: this.CompileFleetInfo(0),
			fleet2: this.CompileFleetInfo(1),
			fleet3: this.CompileFleetInfo(2),
			fleet4: this.CompileFleetInfo(3),
			support1: this.GetSupportingFleet(false),
			support2: this.GetSupportingFleet(true),
			time: stime
		}, function(id){
			self.onSortie = id;
		});
	},
	
	GetSupportingFleet :function(bossSupport){
		var expedNumbers;
		if(bossSupport){
			expedNumbers = [34,110,118,126,150];
			return this.CheckIfFleetIsSupporting(expedNumbers, 1)
				|| this.CheckIfFleetIsSupporting(expedNumbers, 2)
				|| this.CheckIfFleetIsSupporting(expedNumbers, 3);
		}else{
			expedNumbers = [33,109,117,125,149];
			return this.CheckIfFleetIsSupporting(expedNumbers, 1)
				|| this.CheckIfFleetIsSupporting(expedNumbers, 2)
				|| this.CheckIfFleetIsSupporting(expedNumbers, 3);
		}
	},
	
	CheckIfFleetIsSupporting :function(expedNumbers, fleetNumber){
		var fleetExpedition = app.Docks._fleets[fleetNumber].api_mission[1];
		return (expedNumbers.indexOf(fleetExpedition)>-1)?fleetNumber:0;
	},
	
	EndSortie :function(){
		this.onSortie = 0;
	},
	
	Engage :function(data, stime){
		if(this.onSortie > 0){
			this.currentBattle = {
				sortie_id : this.onSortie,
				node : this.onNode,
				enemyId : this.enemyId,
				yasen : {},
				data : data,
				time: stime
			};
		}
	},
	
	Yasen :function(data){
		this.currentBattle.yasen = data;
	},
	
	Results :function(data){
		if(["SS","S","A","B"].indexOf(data.api_win_rank)){
			// Bd1: Daily Sortie 1
			app.Quests.track(201, function(trackingObj){
				trackingObj[0][0]++;
			});
		}
		
		// Logging
		this.currentBattle.rating = data.api_win_rank;
		if(typeof data.api_get_ship != "undefined"){
			this.currentBattle.drop = data.api_get_ship.api_ship_id; 
		}else{
			this.currentBattle.drop = 0;
		}
		app.Logging.Battle(this.currentBattle);
		this.currentBattle = {};
	}
	
};