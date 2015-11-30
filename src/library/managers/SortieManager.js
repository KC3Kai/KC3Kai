/* SortieManager.js
KC3改 Sortie Manager

Xxxxxxx
*/
(function(){
	"use strict";
	
	var 
		focusedFleet = [],
		preSortieFleet = [];
	
	window.KC3SortieManager = {
		onSortie: 0,
		onPvP: false,
		onCat: false,
		fleetSent: 1,
		map_world: 0,
		map_num: 0,
		map_difficulty: 0,
		nextNodeCount: 0,
		hqExpGained: 0,
		nodes: [],
		boss: {},
		onBossAvailable: function(){},
		onEnemiesAvailable: function(node){},
		fcfCheck: [],
		escapedList: [],
		materialGain: Array.apply(null,{length:8}).map(function(){return 0;}),
		sinkList:{main:[],escr:[]},
		sortieTime: 0,
		
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
			
			PlayerManager.hq.lastSortie = PlayerManager.fleets_backup();
			
			focusedFleet = (PlayerManager.combinedFleet&&this.fleetSent===1) ? [0,1] : [this.fleetSent-1];
			PlayerManager.hq.save();
			
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
				self.sortieTime = stime;
				self.save();
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
		
		isFullySupplied: function() {
			return focusedFleet.map(function(x){
				return PlayerManager.hq.lastSortie[x];
			}).every(function(ships){
				return ships.every(function(ship){
					return ship.isSupplied();
				});
			});
		},
		
		isSortieAt: function(world,map) {
			// Always return false on event maps
			// (speculated map_world for events > 10 as expedition format follows)
			return (this.map_world == world && this.map_world <= 10) &&
				(this.map_num == (map || this.map_num));
		},
		
		isPvP: function(){
			return this.isSortieAt(-1) || this.onPvP;
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
			this.save();
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
			this.addSunk(this.currentNode().lostShips);
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
		
		addSunk :function(shizuList){
			console.log(shizuList);
			this.sinkList.main = this.sinkList.main.concat(shizuList[0]);
			this.sinkList.escr = this.sinkList.escr.concat(shizuList[1]);
		},
		
		discardSunk :function(){
			var
				fleetDesg = [this.fleetSent-1,1],
				self = this;
			Object.keys(this.sinkList).forEach(function(fleetType,fleetId){
				console.log("Fleet",fleetDesg[fleetId]+1,"consisting of",PlayerManager.fleets[fleetDesg[fleetId]].ships);
				console.log("\t","losses",self.sinkList[fleetType]);
				self.sinkList[fleetType].map(function(x){
					KC3ShipManager.remove(x);
					return x;
				}).filter(function(x){return false;});
			});
		},
		
		load :function(){
			if(localStorage.sortie) {
				$.extend(this,localStorage.getObject('sortie'));
			}
		},
		
		save :function(){
			localStorage.setObject('sortie',this);
		},
		
		endSortie :function(){
			var
				pvpData = JSON.parse(localStorage.statistics).pvp,
				self = this,
				cons = {};
			this.fleetSent = 1;
			console.log("Pre-sortie State",PlayerManager.hq.lastSortie);
			cons.name = self.isPvP() ? ("pvp" + (pvp.win + pvp.lose)) : ("sortie" + self.onSortie);
			cons.resc = Array.apply(null,{length:8}).map(function(){return 0;});
			// Calculate sortie difference with buffer
			(PlayerManager.hq.lastSortie || []).forEach(function(fleet,fleet_id){
				fleet.forEach(function(after,ship_fleet){
					var
						rosterId = after.rosterId,
						before   = KC3ShipManager.get(rosterId),
						supply   = [
							/*
								[Fuel Difference] [Ammo Difference] [All Slots Difference]
							*/
							function(a,b){return a.fuel - b.fuel;},
							function(a,b){return a.ammo - b.ammo;},
							0,
							function(a,b){
								return Array.apply(null,{length:a.slots.length}).map(function(x,i){return (a.slots[i] - b.slots[i])*5;})
									.reduce(function(x,y){return x+y;});
							}
						].map(function(f){return f(before,after);}),
						/*
							RepairLength = 3, third entry always zero.
							if PvP => RepairLength = 0, all zero entry.
						*/
						rl       = before.repair.length * !self.isPvP(),
						repair   = [1,9,2,9].map(function(x){
							return (x<rl) ? (after.repair[x] - before.repair[x]) : 0;
						});
					if(!self.isPvP())
						before.lastSortie.push(cons.name);
					if(!(supply.every(function(x){return !x;}) && repair.every(function(x){return !x;})))
						[supply.repair].forEach(function(cost){
							cost.forEach(function(matr,indx){
								cons.resc[indx] -= matr;
							});
						});
				});
			});
			// Ignore every resource gain if disconnected during sortie
			if(this.onCat)
				this.materialGain.fill(0);
			// Fill the resource gain to the current material checkout
			this.materialGain.forEach(function(x,i){
				if(i<(PlayerManager.hq.lastMaterial || []).length)
					PlayerManager.hq.lastMaterial[i] += x;
			});
			// Control Consumption of the Current Sortie
			cons.resc.forEach(function(matr,indx){
				self.materialGain[indx] += matr;
			});
			// To detect whether invalid sortie ID or not
			if(this.onSortie)
				KC3Database.Naverall({
					hour: Math.hrdInt('floor',this.sortieTime,3.6,1),
					type: "sortie" + this.onSortie,
					data: this.materialGain.slice(0)
				},null,true);
			// Remove sortie comparison buffer
			PlayerManager.hq.lastSortie = null;
			
			// Reset sortie statistics
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
			this.materialGain.fill(0);
			this.sinkList.main.splice(0);
			this.sinkList.escr.splice(0);
			KC3ShipManager.pendingShipNum = 0;
			KC3GearManager.pendingGearNum = 0;
			this.onSortie = 0; // clear sortie ID last
			this.onCat = false;
			this.sortieTime = 0;
			this.save();
		}
	};
	
})();
