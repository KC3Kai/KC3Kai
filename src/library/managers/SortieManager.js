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
		
		nodes: [],
		bossNode: {},
		
		startSortie :function(world, mapnum, fleetNum, stime){
			// If still on sortie, end previous one
			if(this.onSortie > 0){ this.endSortie(); }
			
			this.map_world = world;
			this.map_num = mapnum;
			this.fleetSent = fleetNum;
			this.nextNodeCount = 0;
			this.nodes = [];
			
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
		
		setBoss :function( cellno, comp ){
			/*this.bossNode = (new KC3Node()).defineAsBattle({
				api_enemy: { api_enemy_id:comp }
			})*/
			
			this.bossNode = [-1,-1,-1,-1,-1,-1];
		},
		
		currentNode :function(){
			return this.nodes[ this.nodes.length-1 ];
		},
		
		advanceNode :function( nodeData ){
			var thisNode;
			
			//  Battle Node
			if(typeof nodeData.api_enemy != "undefined") {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no )).defineAsBattle(nodeData);
			// Resource Node
			}else if (typeof nodeData.api_itemget != "undefined") {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no )).defineAsResource(nodeData);
			// Bounty Node
			} else if (typeof nodeData.api_itemget_eo_comment != "undefined") {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no )).defineAsBounty(nodeData);
			// Maelstrom Node
			} else if (typeof nodeData.api_happening != "undefined") {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no )).defineAsMaelstrom(nodeData);
			// Empty Node
			}else{
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no )).defineAsDud(nodeData);
			}
			
			this.nodes.push(thisNode);
		},
		
		engageBattle :function( battleData, stime ){
			if(this.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
			this.currentNode().engage( battleData );
		},
		
		engageNight :function( nightData ){
			if(this.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
			 this.currentNode().night( nightData );
		},
		
		resultScreen :function( resultData ){
			if(this.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
			this.currentNode().results( resultData );
		},
		
		endSortie :function(){
			this.updateDB();
			this.onSortie = 0;
			this.fleetSent = 1;
			this.map_world = 0;
			this.map_num = 0;
			this.nodes = [];
			this.bossNode = {};
		},
		
		updateDB :function(){
			
		}
		
	};
	
})();