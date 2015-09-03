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
		map_difficulty: 0,
		fullSupplyMode: true,
		nextNodeCount: 0,
		hqExpGained: 0,
		nodes: [],
		boss: {},
		onBossAvailable: function(){},
		onEnemiesAvailable: function(node){},
		fcfCheck: [],
		escapedList: [],
		
		startSortie :function(world, mapnum, fleetNum, stime){
			// If still on sortie, end previous one
			if(this.onSortie > 0){ this.endSortie(); }
			
			if(world < 10){ this.map_difficulty = 0; }
			
			this.fleetSent = parseInt(fleetNum);
			this.map_world = world;
			this.map_num = mapnum;
			this.map_difficulty = JSON.parse(localStorage.maps)["m"+world+mapnum].difficulty || 0;
			this.nextNodeCount = 0;
			this.hqExpGained = 0;
			this.nodes = [];
			this.boss = {
				node: -1,
				comp: -1,
				info: false,
				formation: -1,
				ships: [ -1, -1, -1, -1, -1, -1 ]
			};
			
			this.fullSupplyMode = ((PlayerManager.combinedFleet&&this.fleetSent===1) ? [0,1] : [this.fleetSent-1]).map(function(x){
				return PlayerManager.fleets[x];
			}).every(function(x){
				return x.isSupplied();
			});
			
			var fleet = PlayerManager.fleets[this.fleetSent-1];
			fleet.resetAfterHp();
			
			// Save on database and remember current sortieId
			var self = this;
			KC3Database.Sortie({
				diff: this.map_difficulty,
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
			function supportFormula(expedNum, isBoss){
				console.log("checking support", expedNum, "isboss", isBoss);
				var e,w,n;
				e = (expedNum > 100);
				if(e) expedNum -= 100;
				w = (expedNum-1 / 8)+1;
				n = (expedNum-1) % 8;
				console.log(e,w,n,(w == 5 || e) && (n == 0 + isBoss));
				return (w == 5 || e) && (n == 0 + isBoss);
			}
			
			for(var i=2;i<=4;i++)
				if(PlayerManager.fleets[i-1].active){
					var fleetExpedition = PlayerManager.fleets[i-1].mission[1];
					if(supportFormula(fleetExpedition, bossSupport)){
						return i;
					}
				}
			return 0;
		},
		
		isSortieAt: function(world,map) {
			// Always return false on event maps
			// (speculated map_world for events > 10 as expedition format follows)
			return (this.map_world == world && this.map_world <= 10) &&
				(this.map_num == (map || this.map_num));
		},
		
		setBoss :function( cellno, comp ){
			this.boss.node = cellno;
			this.boss.comp = comp;
			
			var self = this;
			// Retrieve boss info from somewhere
			setTimeout(function(){
				console.log("");
				self.boss.formation = -1;
				// self.boss.ships = [ -1, -1, -1, -1, -1, -1 ];
				self.boss.ships = [ 501,502,503,504,505,506 ];
				self.onBossAvailable(self);
			}, 1);
		},
		
		currentNode :function(){
			return this.nodes[ this.nodes.length-1 ];
		},
		
		advanceNode :function( nodeData, UTCTime ){
			var thisNode;
			console.log("nodeData", nodeData);
			
			// Selection node
			// api_event_id = 6
			if (typeof nodeData.api_select_route != "undefined") {
				console.log("nodeData.api_select_route found, defining as selector");
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no, UTCTime )).defineAsSelector(nodeData);
			//  Battle Node
			// api_event_kind = 1 (day battle)
			// api_event_kind = 2 (start at night battle)
			// api_event_kind = 4 (aerial exchange)
			// api_event_id = 4 (normal battle)
			// api_event_id = 5 (boss)
			}else if((nodeData.api_event_kind == 1) || (nodeData.api_event_kind == 2) || (nodeData.api_event_kind == 4)) {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no, UTCTime )).defineAsBattle(nodeData);
			// Resource Node
			// api_event_kind = 0
			// api_event_id = 2
			}else if (typeof nodeData.api_itemget != "undefined") {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no, UTCTime )).defineAsResource(nodeData);
			// Bounty Node
			// api_event_kind = 0
			// api_event_id = 8
			} else if (typeof nodeData.api_itemget_eo_comment != "undefined") {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no, UTCTime )).defineAsBounty(nodeData);
			// Maelstrom Node
			} else if (typeof nodeData.api_happening != "undefined") {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no, UTCTime )).defineAsMaelstrom(nodeData);
			// Empty Node 
			// api_event_kind = 0 
			} else {
				thisNode = (new KC3Node( this.onSortie, nodeData.api_no, UTCTime )).defineAsDud(nodeData);
			}
			
			this.nodes.push(thisNode);
		},
		
		engageBattle :function( battleData, stime ){
			if(this.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
			this.currentNode().engage( battleData, this.fleetSent );
		},
		
		engageBattleNight :function( nightData, stime ){
			if(this.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
			this.currentNode().engageNight( nightData, this.fleetSent );
		},
		
		engageNight :function( nightData ){
			if(this.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
			this.currentNode().night( nightData );
		},
		
		resultScreen :function( resultData ){
			if(this.currentNode().type != "battle"){ console.error("Wrong node handling"); return false; }
			this.hqExpGained += resultData.api_get_exp;
			this.currentNode().results( resultData );
			this.checkFCF( resultData.api_escape );
			if(!ConfigManager.info_delta)
				PlayerManager.hq.updateLevel( resultData.api_member_lv, resultData.api_member_exp);
		},
		
		checkFCF :function( escapeData ){
			console.log("checking FCF");
			if ((typeof escapeData !== "undefined") && (escapeData !== null)) {
				console.log("FCF triggered");
				
				var taihadIndex = escapeData.api_escape_idx[0];
				var taihadShip;
				var escortIndex = escapeData.api_tow_idx[0];
				var escortShip;
				
				console.log("fcf fleet indexes", taihadIndex, escortIndex);
				
				if(taihadIndex < 7){
					taihadShip = PlayerManager.fleets[0].ship(taihadIndex-1).rosterId;
				}else{
					taihadShip = PlayerManager.fleets[1].ship(taihadIndex-7).rosterId;
				}
				
				if(escortIndex < 7){
					escortShip = PlayerManager.fleets[0].ship(escortIndex-1).rosterId;
				}else{
					escortShip = PlayerManager.fleets[1].ship(escortIndex-7).rosterId;
				}
				
				this.fcfCheck = [taihadShip, escortShip];
				
				console.log("has set fcfCheck to", this.fcfCheck);
			}
		},
		
		sendFCFHome :function(){
			console.log("setting escape flag for fcfCheck", this.fcfCheck);
			KC3ShipManager.get( this.fcfCheck[0] ).didFlee = true;
			KC3ShipManager.get( this.fcfCheck[1] ).didFlee = true;
			this.fcfCheck = [];
			this.escapedList.push( this.fcfCheck[0] );
			this.escapedList.push( this.fcfCheck[1] );
			console.log( "new escapedList", this.escapedList );
		},
		
		endSortie :function(){
			this.onSortie = 0;
			this.fleetSent = 1;
			this.map_world = 0;
			this.map_num = 0;
			this.map_difficulty = 0;
			this.nextNodeCount = 0;
			this.hqExpGained = 0;
			this.nodes = [];
			this.boss = {
				node: -1,
				comp: -1,
				info: false,
				formation: -1,
				ships: [ -1, -1, -1, -1, -1, -1 ]
			};
			for(var ectr in this.escapedList){
				KC3ShipManager.get( this.escapedList[ectr] ).didFlee = false;
			}
			this.fcfCheck = [];
			this.escapedList = [];
			KC3ShipManager.pendingShipNum = 0;
			KC3GearManager.pendingGearNum = 0;
		}
	};
	
})();