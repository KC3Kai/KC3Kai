/* SortieManager.js
KC3改 Sortie Manager

Xxxxxxx
*/
(function(){
	"use strict";
	
	window.KC3SortieManager = {
		onSortie: 0,
		
		startSortie :function(world, mapnum, fleetNum, stime){
			// If still on sortie, end previous one
			if(this.onSortie > 0){ this.endSortie(); }
			
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
		
		advanceNode :function(){
			
		},
		
		setEnemy :function(){
			
		},
		
		engageBattle :function(){
			
		},
		
		engageNight :function(){
			
		},
		
		resultScreen :function(){
			
		},
		
		endSortie :function(){
			this.onSortie = 0;
		},
		
	};
	
})();