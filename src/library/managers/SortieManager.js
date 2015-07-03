/* SortieManager.js
KC3改 Sortie Manager

Xxxxxxx
*/
(function(){
	"use strict";
	
	window.KC3SortieManager = {
		onSortie: 0,
		fleetSent: 1,
		map_world: 0,
		map_num: 0,
		bossNode: 0,
		bossPattern: 0,
		nodeNum: 0,
		nodePattern: 0,
		nextNodeCount: 0,
		
		startSortie :function(world, mapnum, fleetNum, stime){
			// If still on sortie, end previous one
			if(this.onSortie > 0){ this.endSortie(); }
			
			this.map_world = world;
			this.map_num = mapnum;
			this.fleetSent = fleetNum;
			this.nextNodeCount = 0;
			
			// Save on database and remember current sortieId
			var self = this;
			KC3Database.Sortie({
				world: world,
				mapnum: mapnum,
				fleetnum: parseInt(fleetNum, 10),
				combined: PlayerManager.combinedFleet,
				fleet1: PlayerManager.fleets[0].sortieJson(),
				fleet2: PlayerManager.fleets[1].sortieJson(),
				fleet3: PlayerManager.fleets[2].sortieJson(),
				fleet4: PlayerManager.fleets[3].sortieJson(),
				support1: this.getSupportingFleet(false),
				support2: this.getSupportingFleet(true),
				time: stime
			}, function(id){
				self.onSortie = id;
			});
		},
		
		getSupportingFleet :function(bossSupport){
			var expedNumbers;
			if(bossSupport){
				expedNumbers = [34,110,118,126,150];
				return this.checkIfFleetIsSupporting(expedNumbers, 1)
					|| this.checkIfFleetIsSupporting(expedNumbers, 2)
					|| this.checkIfFleetIsSupporting(expedNumbers, 3);
			}else{
				expedNumbers = [33,109,117,125,149];
				return this.checkIfFleetIsSupporting(expedNumbers, 1)
					|| this.checkIfFleetIsSupporting(expedNumbers, 2)
					|| this.checkIfFleetIsSupporting(expedNumbers, 3);
			}
		},
		
		checkIfFleetIsSupporting :function(expedNumbers, fleetNumber){
			if(PlayerManager.fleets[fleetNumber].active){
				var fleetExpedition = PlayerManager.fleets[fleetNumber].mission[1];
				return (expedNumbers.indexOf(fleetExpedition)>-1)?fleetNumber:0;
			}
			return 0;
		},
		
		setBoss :function(){
			
		},
		
		advanceNode :function( nodeNum ){
			this.nextNodeCount++,
			this.nodeNum = nodeNum;
		},
		
		setEnemy :function( nodePattern ){
			this.nodePattern = nodePattern;
		},
		
		engageBattle :function(){
			
		},
		
		engageNight :function(){
			
		},
		
		resultScreen :function(){
			
		},
		
		endSortie :function(){
			this.onSortie = 0;
			this.fleetSent = 1;
			this.map_world = 0;
			this.map_num = 0;
			this.bossNode = 0;
			this.bossPattern = 0;
			this.nodeNum = 0;
			this.nodePattern = 0;
			this.nextNodeCount = 0;
		},
		
	};
	
})();