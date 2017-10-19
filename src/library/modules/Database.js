/* Database.js
KC3改 Indexed Database

Used to log player information for later use on Strategy Room
Uses Dexie.js third-party plugin on the assets directory
*/
(function(){
	"use strict";
	
	var dbIndex = 0;
	
	window.KC3Database = {
		con:{},
		
		init :function( defaultUser ){
			this.con = new Dexie("KC3");
			
			if(typeof defaultUser !== "undefined"){
				this.index = defaultUser;
			}
			
			var
				// No upgrade flag (used in iteration)
				dbFirst = true,
				// No update function reference
				dbNonFunc = function(t){},
				// Initial State of Proposed Database, modified by every element on dbUpdates, ch and rm key.
				dbProposed = {},
				// DB Changes put in queue
				dbUpdates = [
					{
						ch: {
							account: "++id,&hq,server,mid,name",
							build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
							lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
							sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,time",
							battle: "++id,hq,sortie_id,node,data,yasen,rating,drop,time",
							resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
							useitem: "++id,hq,torch,screw,bucket,devmat,hour",
						},
						vr: 1,
					},
					{
						/* Actual Structure (compare with version 1)
							account: "++id,&hq,server,mid,name",
							build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
							lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
							* sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
							battle: "++id,hq,sortie_id,node,data,yasen,rating,drop,time",
							resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
							useitem: "++id,hq,torch,screw,bucket,devmat,hour",
							* screenshots: "++id,hq,imgur,ltime",
						*/
						ch: {
							sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
							screenshots: "++id,hq,imgur,ltime",
						},
						vr: 2,
					},
					{
						/* Actual Structure (compare with version 2)
							account: "++id,&hq,server,mid,name",
							build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
							lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
							sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
							battle: "++id,hq,sortie_id,node,data,yasen,rating,drop,time",
							resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
							useitem: "++id,hq,torch,screw,bucket,devmat,hour",
							screenshots: "++id,hq,imgur,ltime",
							* develop: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time"
						*/
						ch: {
							develop: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
						},
						vr: 3,
					},
					{
						/* Actual Structure (compare with version 3)
							account: "++id,&hq,server,mid,name",
							build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
							lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
							sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
							* battle: "++id,hq,sortie_id,node,enemyId,data,yasen,rating,drop,time",
							resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
							useitem: "++id,hq,torch,screw,bucket,devmat,hour",
							screenshots: "++id,hq,imgur,ltime",
							develop: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time"
						*/
						ch: {
							battle: "++id,hq,sortie_id,node,enemyId,data,yasen,rating,drop,time",
						},
						vr: 4,
					},
					{
						/* Actual Structure (compare with version 4)
							account: "++id,&hq,server,mid,name",
							build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
							lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
							sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
							battle: "++id,hq,sortie_id,node,enemyId,data,yasen,rating,drop,time",
							resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
							useitem: "++id,hq,torch,screw,bucket,devmat,hour",
							screenshots: "++id,hq,imgur,ltime",
							develop: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
							* newsfeed: "++id,hq,type,message,time",
						*/
						ch: {
							newsfeed: "++id,hq,type,message,time",
						},
						vr: 5,
					},
					{
						/* Actual Structure (compare with version 5)
							account: "++id,&hq,server,mid,name",
							build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
							lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
							sortie: "++id,hq,diff,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
							battle: "++id,hq,sortie_id,node,enemyId,data,yasen,rating,drop,time",
							resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
							useitem: "++id,hq,torch,screw,bucket,devmat,hour",
							screenshots: "++id,hq,imgur,ltime",
							develop: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
							newsfeed: "++id,hq,type,message,time",
						*/
						ch: {
							sortie: "++id,hq,diff,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
						},
						vr: 6,
					},
					{
						ch: {
							battle: "++id,hq,sortie_id,node,enemyId,data,yasen,rating,drop,time,baseEXP,mvp",
							expedition: "++id,hq,data,mission,ships,equip,shipXP,admiralXP,items,time",
						},
						up: function(t){
							console.log("V6.5",t);
						},
						vr: 6.5,
					},
					{
						ch: {
							/** Expedition Alter Proposal
							Keys        DataType        Description
							(+)Fleet    Ships[6]        (Add) data that represents the current fleet (use sortie style, adaptable result)
							(-)Ships    integer[2][7]   (Rem) data that represents ship-level meaning
							(-)Equip    integer[5][7]   (Rem) data that represents ship equipment
							------------------------------------- **/
							expedition: "++id,hq,data,mission,fleet,shipXP,admiralXP,items,time",
							/** Naval Overall Proposal
							Keys        DataType        Description
							ID          PRIMARY-AUTO-INCREMENT
							HQ          char[8]         Describes the HQ ID of the admiral
							Hour        integer         Describes the UTC time, as standard of resources and consumables
							Type        char[*]         Representing the material/useitem change method
							Data        integer[8]      Changes that describes the current action
							------------------------------------- **/
							navaloverall: "++id,hq,hour,type,data",
						},
						up: function(self){
							// Upgrade Expedition Table
							self.expedition.toCollection().modify(function(mission){
								mission.fleet = [];
								mission.ships.shift();
								mission.equip = mission.equip || Array.apply(null,mission.ships)                       /** check expedition equipment, or */
									.map(function(x){return Array.apply(null,{length:5}).map(function(){return -1;});}); /*  generate empty equipment list */
								mission.equip.shift();
								mission.ships.forEach(function(x,i){
									/** data migrating process
									    ship master id, level, and equipment (if available)
									  will be transferred to the standard sortie json format.
									  any other data that remain unknown.
									--------------------------------------------------------- */
									mission.fleet.push({
										mst_id: KC3ShipManager.get(x[0]).masterId,
										level: x[1],
										kyouka: Array.apply(null,{length:5}).map(function(){return '??';}),
										morale: '??',
										equip: mission.equip.shift()
									});
								});
								delete mission.equip;
								delete mission.ships;
							});
						},
						vr: 6.6,
					},
					{
						ch: {
							enemy: "&id,hp,fp,tp,aa,ar,eq1,eq2,eq3,eq4",
							encounters: "&uniqid,world,map,node,form,ke"
						},
						up: function(t){
							console.log("V7",t);
						},
						vr: 7,
					},
					{
						ch: {
							encounters: "&uniqid,world,map,diff,node,form,ke,count,name"
						},
						up: function(t){
							console.log("V7.2",t);
						},
						vr: 7.2,
					},
					{
						ch: {
							pvp: "++id,hq,fleet,enemy,data,yasen,rating,baseEXP,mvp,time"
						},
						up: function(t){
							console.log("Database v73", t);
						},
						vr: 73,
					},
					{
						ch: {
							screenshots: "++id,hq,imgur,deletehash,ltime"
						},
						up: function(t){
							console.log("Database v74", t);
						},
						vr: 74,
					},
					{
						ch: {
							experience: "++id,hq,exp,level,hour",
						},
						up: function(t){
							console.log("Database v75", t);
						},
						vr: 75,
					},
					{
						ch: {
							logs: "++id,type,timestamp,context",
						},
						up: function (t){
							console.log("Databse v76", t);
						},
						vr: 76,
					},
					/*
					Database versions are only integers, no decimals.
					7.2 was detected as 72 by chrome, and thus specifying 8 is actually lower version
					From 7.2, we will use 73, 74, 75, as integers onwards...
					*/
				];
				
			// Process the queue
			var self = this;
			dbUpdates.forEach(function callback(dbCurr, index) {
				var dbVer;
				dbCurr = Object.assign({ch:{},rm:[],up:dbNonFunc},dbCurr);
				
				// Replaces the proposed database table with the new one
				Object.keys(dbCurr.ch).forEach(function(k){
					dbProposed[k] = dbCurr.ch[k];
				});
				
				// Removes the unused database table
				dbCurr.rm.forEach(function(k){
					delete dbProposed[k];
				});
				
				// Apply Versioning
				dbVer = self.con.version(dbCurr.vr).stores(dbProposed);
				//console.log(dbCurr.vr,dbVer,Object.keys(dbProposed));
				if(dbFirst) {
					dbFirst = false;
				} else {
					dbVer.upgrade(dbCurr.up);
				}
			});
			return this.con.open();
		},

		loadIfNecessary :function() {
			if (!(this.con.isOpen && this.con.isOpen())) {
				return this.init();
			}
			return Promise.resolve();
		},
		
		clear :function(callback){
			this.con.delete().then(callback);
		},
		
		Newsfeed: function(data){
			this.con.newsfeed.add({
				hq: this.index,
				type: data.type,
				message: data.message,
				time: data.time
			});
		},
		
		Player :function(data){
			var self = this;
			// check if account exists
			this.con.account
				.where("hq")
				.equals(this.index)
				.count(function(NumRecords){
					if(NumRecords === 0){
						// insert if not yet on db
						self.con.account.add({
							hq: self.index,
							server: data.server,
							mid: parseInt(data.mid, 10),
							name: data.name
						});
					}
				});
		},
		
		Build :function(data){
			data.hq = this.index;
			this.con.build.add(data);
		},
		
		LSC :function(data){
			data.hq = this.index;
			this.con.lsc.add(data);
		},
		
		Sortie :function(data, callback){
			data.hq = this.index;
			this.con.sortie.add(data).then(callback);
		},
		
		updateNodes :function(id, newNodes){
			this.con.sortie.update(id, {nodes: newNodes});
		},

		Battle :function(data){
			data.hq = this.index;
			this.con.battle.add(data);
		},
		
		Resource :function(data){
			data.hq = this.index;
			this.con.resource.add(data);
		},
		
		Useitem :function(data, stime){
			data.hq = this.index;
			this.con.useitem.add(data);
		},

		Experience :function(data, stime){
			data.hq = this.index;
			this.con.experience.add(data);
		},
		
		Screenshot :function(imgur, deletehash){
			this.con.screenshots.add({
				hq : 0,
				imgur : imgur,
				deletehash: deletehash,
				ltime : Math.floor(Date.now()/1000),
			});
		},
		
		Develop :function(data){
			data.hq = this.index;
			this.con.develop.add(data);
		},
		
		Expedition :function(data,callback){
			data.hq = this.index;
			this.con.expedition.add(data).then(callback);
		},
		
		Naverall :function(data,type,force){
			data.hq = this.index;
			data.data = data.data.map(function(x){return parseInt(x);});
			if(data.data.every(function(x){return !x;}) && !force)
				return false;
			if(!type) {
				this.con.navaloverall.add(data);
			} else {
				this.con.navaloverall
					.where("type").equals(type)
					.reverse().limit(1)
					.modify(function(old){
						old.data = old.data.map(function(x,i){return x + data.data[i];});
				});
			}
			return true;
		},
		
		Enemy :function(data, callback){
			this.con.enemy.put(data).then(callback);
		},
		
		Encounter :function(data, isIncCount, callback){
			var self = this;
			this.con.encounters.get(data.uniqid, function(oldData){
				if(!!oldData){
					if(!!isIncCount){
						data.count = (oldData.count || 1) + 1;
					}
					if(!data.name && !!oldData.name){
						data.name = oldData.name;
					}
				}
				self.con.encounters.put(data).then(callback);
			});
		},
		
		PvP :function(data, callback){
			data.hq = this.index;
			this.con.pvp.add(data).then(callback);
		},

		Log :function (data, { expireAt }){
			return KC3Database.deleteExpiredLogs(expireAt)
				.then(() => KC3Database.addLog(data));
		},

		deleteExpiredLogs :function(expireAt){
			const promises = Object.keys(expireAt).map((logType) => {
				const expireTime = expireAt[logType];
				return this.con.logs
					.where('timestamp')
					.belowOrEqual(expireTime)
					.and(({ type }) => type === logType)
					.delete();
			});
			return Dexie.Promise.all(promises);
		},

		addLog :function(data){
			return this.con.logs.add(data);
		},
		
		/* [GET] Retrieve logs from Local DB
		--------------------------------------------*/
		get_build :function(pageNumber, callback){
			var itemsPerPage = 30;
			this.con.build
				.where("hq").equals(this.index)
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(callback);
		},
		
		count_build: function(callback){
			this.con.build
				.where("hq").equals(this.index)
				.count(callback);
		},
		
		get_lscs :function(pageNumber, callback){
			var itemsPerPage = 30;
			this.con.lsc
				.where("hq").equals(this.index)
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(callback);
		},
		
		count_lscs: function(callback){
			this.con.lsc
				.where("hq").equals(this.index)
				.count(callback);
		},
		
		get_expeds :function(pageNumber, expeds, fleets, callback){
			// console.debug("expeds", expeds);
			var itemsPerPage = 20;
			this.con.expedition
				.where("hq").equals(this.index)
				.and(function(exped){ return expeds.indexOf(exped.mission) > -1; })
				.and(function(exped){ return fleets.indexOf(exped.fleetN) > -1; })
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(callback);
		},
		
		count_expeds: function(expeds, fleets, callback){
			this.con.expedition
				.where("hq").equals(this.index)
				.and(function(exped){ return expeds.indexOf(exped.mission) > -1; })
				.and(function(exped){ return fleets.indexOf(exped.fleetN) > -1; })
				.count(callback);
		},
		
		count_normal_sorties: function(callback){
			this.con.sortie
				.where("hq").equals(this.index)
				.and(function(sortie){ return sortie.world < 10; })
				.count(callback);
		},
		
		get_normal_sorties :function(pageNumber, itemsPerPage, callback){
			var self = this;
			var sortieIds = [], bctr, sortieIndexed = {};
			
			this.con.sortie
				.where("hq").equals(this.index)
				.and(function(sortie){ return sortie.world < 10; })
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(function(sortieList){
					// Compile all sortieIDs and indexify
					for(bctr in sortieList){
						sortieIds.push(sortieList[bctr].id);
						sortieIndexed["s"+sortieList[bctr].id] = sortieList[bctr];
						sortieIndexed["s"+sortieList[bctr].id].battles = [];
					}
					
					// Get all battles on those sorties
					self.con.battle
						.where("sortie_id").anyOf(sortieIds)
						.toArray(function(battleList){
							for(bctr in battleList){
								if(typeof sortieIndexed["s"+battleList[bctr].sortie_id] != "undefined"){
									sortieIndexed["s"+battleList[bctr].sortie_id].battles.push(battleList[bctr]);
								}else{
									console.error("orphan battle", battleList[bctr]);
								}
							}
							callback(sortieIndexed);
						});
				});
		},
		
		get_sortie_maps :function(sortieRange, callback) {
			// Clamp Range Input
			sortieRange = ((sortieRange && (sortieRange.length >= 2) && sortieRange) || [null,null])
				.splice(0,2)
				.map(function(x,i){ return x || [0,Infinity][i];})
				.sort();
			
			this.con.sortie
				.where("hq").equals(this.index)
				.offset(sortieRange[0]).limit( sortieRange.reduceRight(function(x,y){return x-y+1;}) )
				.toArray(function(sortieList){
					var wmHash = {}, sortieObj, cnt = 0;
					for(var ctr in sortieList){
						sortieObj = sortieList[ctr];
						wmHash[ sortieObj.id ] = {0:sortieObj.world,1:sortieObj.mapnum,time:sortieObj.time};
						cnt++;
					}
					Object.defineProperty(wmHash,'length',{value:cnt});
					callback(wmHash);
				});
		},
		
		count_world :function(world, callback){
			this.con.sortie
				.where("hq").equals(this.index)
				.and(function(sortie){ return sortie.world == world; })
				.count(callback);
		},
		
		get_world :function(world, pageNumber, itemsPerPage, callback){
			var self = this;
			var sortieIds = [], bctr, sortieIndexed = {};
			
			this.con.sortie
				.where("hq").equals(this.index)
				.and(function(sortie){ return sortie.world==world; })
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(function(sortieList){
					// Compile all sortieIDs and indexify
					for(bctr in sortieList){
						sortieIds.push(sortieList[bctr].id);
						sortieIndexed["s"+sortieList[bctr].id] = sortieList[bctr];
						sortieIndexed["s"+sortieList[bctr].id].battles = [];
					}
					
					// Get all battles on those sorties
					self.con.battle
						.where("sortie_id").anyOf(sortieIds)
						.toArray(function(battleList){
							for(bctr in battleList){
								if(typeof sortieIndexed["s"+battleList[bctr].sortie_id] != "undefined"){
									sortieIndexed["s"+battleList[bctr].sortie_id].battles.push(battleList[bctr]);
								}else{
									console.error("orphan battle", battleList[bctr]);
								}
							}
							callback(sortieIndexed);
						});
				});
		},
		
		count_map :function(world, map, callback){
			this.con.sortie
				.where("hq").equals(this.index)
				.and(function(sortie){ return sortie.world == world && sortie.mapnum==map; })
				.count(callback);
		},
		
		get_map :function(world, map, pageNumber, itemsPerPage, callback){
			var self = this;
			var sortieIds = [], bctr, sortieIndexed = {};
			
			this.con.sortie
				.where("hq").equals(this.index)
				.and(function(sortie){ return sortie.world==world && sortie.mapnum==map; })
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(function(sortieList){
					// Compile all sortieIDs and indexify
					for(bctr in sortieList){
						sortieIds.push(sortieList[bctr].id);
						sortieIndexed["s"+sortieList[bctr].id] = sortieList[bctr];
						sortieIndexed["s"+sortieList[bctr].id].battles = [];
					}
					
					// Get all battles on those sorties
					self.con.battle
						.where("sortie_id").anyOf(sortieIds)
						.toArray(function(battleList){
							for(bctr in battleList){
								if(typeof sortieIndexed["s"+battleList[bctr].sortie_id] != "undefined"){
									sortieIndexed["s"+battleList[bctr].sortie_id].battles.push(battleList[bctr]);
								}else{
									console.error("orphan battle", battleList[bctr]);
								}
							}
							callback(sortieIndexed);
						});
				});
		},
		
		get_sortie :function( sortie_id, callback ){
			var self = this;
			this.con.sortie
				.where("id").equals(Number(sortie_id))
				.toArray(function(response){
					if(response.length > 0){
						callback(response[0]);
					}else{
						callback(false);
					}
				});
		},
		
		get_sortie_data :function(sortie_id, callback, errorCallback){
			var self = this;
			var sortie_data = {};
			this.con.sortie
				.where("id").equals(sortie_id)
				.toArray(function(sortieList){
					console.debug("sortieList", sortieList);
					sortie_data = sortieList[0];
					
					self.con.battle
						.where("sortie_id").anyOf(sortie_id)
						.toArray(function(battleList){
							console.debug("battleList", battleList);
							sortie_data.battles = battleList;
							callback(sortie_data);
						}).catch(errorCallback
							|| function(e){console.error(e);});
				}).catch(errorCallback || function(e){console.error(e);});
		},
		
		get_battle : function(mapArea, mapNo, battleNode, enemyId, callback) {
			var sortieIds = [];
			var bctr;
			
			var self = this;
			
			this.con.sortie
				.where("hq").equals(this.index)
				.and(function(sortie){ return sortie.world == mapArea && sortie.mapnum == mapNo; })
				.toArray(function(sortieList){
					// Compile all sortieIDs and indexify
					for( bctr in sortieList){
						sortieIds.push(sortieList[bctr].id);
					}
					
					var foundBattle;
					var callback2 = callback;
					// Get all battles on those sorties
					self.con.battle
						.where("sortie_id").anyOf(sortieIds)
						.toArray(function(battleList){
							
							for(bctr in battleList){
								if (battleList[bctr].enemyId == enemyId) {
									foundBattle = battleList[bctr];
									break;
								}
							}
							
							callback2(foundBattle);
						});
				});
		},
		
		getBattleById : function(battleId, callback) {
			this.con.battle
				.where("id").equals(Number(battleId))
				.toArray(function( ResultBattles ){
					if(ResultBattles.length > 0){
						callback( ResultBattles[0] );
					}else{
						callback(false);
					}
				});
		},
		
		get_pvps :function(pageNumber, callback){
			var itemsPerPage = 10;
			this.con.pvp
				.where("hq").equals(this.index)
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(callback);
		},
		
		get_pvp_data :function(pvp_id, callback){
			return this.con.pvp
				.where("id").equals(pvp_id)
				.toArray(callback);
		},
		
		count_pvps: function(callback){
			this.con.pvp
				.where("hq").equals(this.index)
				.count(callback);
		},
		
		get_enemy : function(enemyId, callback) {
			var self = this;
			this.con.battle
				.where("enemyId").equals(enemyId)
				.toArray(function(battleList){
					if(battleList.length > 0){
						battleList[0].data.api_ship_ke.splice(0, 1);
						callback({
							ids: battleList[0].data.api_ship_ke,
							formation: battleList[0].data.api_formation[1]
						});
					}else{
						callback(false);
					}
				});
		},
		
		get_enemyInfo :function(shipId, callback){
			try {
				this.con.enemy
					.where("id").equals(shipId)
					.toArray(function(matchList){
						console.debug("matchList", matchList);
						if(matchList.length > 0){
							callback(matchList[0]);
						}else{
							callback(false);
						}
					});
				return true;
			} catch (e) {
				console.warn(e);
			}
		},
		
		get_resource :function(HourNow, callback){
			var self = this;
			this.con.resource
				.toArray(function(response){
					var callbackResponse = [];
					
					var ctr;
					for(ctr in response){
						if(response[ctr].hq == self.index){
							callbackResponse.push(response[ctr]);
						}
					}
					callback(callbackResponse);
				});
		},
		
		get_useitem :function(HourNow, callback){
			var self = this;
			this.con.useitem
				.toArray(function(response){
					var callbackResponse = [];
					
					var ctr;
					for(ctr in response){
						if(response[ctr].hq == self.index){
							callbackResponse.push(response[ctr]);
						}
					}
					
					callback(callbackResponse);
				});
		},
		
		get_devmt :function(pageNumber, callback){
			var itemsPerPage = 25;
			this.con.develop
				.where("hq").equals(this.index)
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(callback);
		},
		
		count_devmt: function(callback){
			this.con.develop
				.where("hq").equals(this.index)
				.count(callback);
		},
		
		count_sortie_battle: function(callback, startSecs, endSecs, world, map){
			var self = this;
			var sortieCount = 0, battleCount = 0;
			this.con.sortie
				.where("hq").equals(this.index)
				.and(function(s){
					return (world ? s.world === world : s.world < 10)
						&& (map ? s.mapnum === map : true)
						&& (startSecs ? s.time >= startSecs : true)
						&& (endSecs ? s.time < endSecs : true);
				})
				.toArray(function(arr){
					var sortiesIds = arr.map(s => s.id);
					sortieCount = sortiesIds.length;
					self.con.battle
						.where("sortie_id").anyOf(sortiesIds)
						.count(function(bc){
							battleCount = bc;
							callback(sortieCount, battleCount);
						});
				});
		},
		
		count_screenshots: function(callback){
			this.con.screenshots.count(callback);
		},
		
		get_screenshots :function(pageNumber, callback){
			var itemsPerPage = 20;
			this.con.screenshots
				.reverse()
				.offset( (pageNumber-1)*itemsPerPage ).limit( itemsPerPage )
				.toArray(callback);
		},
		
		get_lodger_bound :function(callback){
			this.con.navaloverall
				.where("hq").equals(this.index)
				.limit(1)
				.toArray(function(data){
					switch(data.length){
						case 0:
							callback(null);
						break;
						default:
							callback(data.shift().hour * 3600000);
						break;
					}
				});
		},
		
		get_lodger_data :function(iFilters, callbackSucc, callbackFail){
			/*
				DataHead  Param1
				sortie    SortieDBID
				pvp       PvPID
				exped     ExpedDBID
				quest     QuestID
				crship    ShipSlot
				critem    ------
				dsship    ShipMaster
				dsitem    ItemMaster
				akashi    ShipMaster
				rmditem   ItemMaster
				remodel   ShipMaster
				regen     ------
				lbas      WorldID
			*/
			// hour filter
			iFilters = (
				(
					typeof iFilters == 'object' && (typeof iFilters.length == 'number') &&
					iFilters.length >= 2 && iFilters
				) || Range(0,Infinity,0,1)
			);
			this.con.navaloverall
				.where("hq").equals(this.index)
				.and(function(data){
					// hFilter Condition Definition:
					// false: if specified id outside the boundary
					// prec : undefined condition is towards infinite of its polar
					return (0).inside.apply(data.id,iFilters);
				})
				.reverse()
				.toArray()
				.then (callbackSucc || function(){})
				.catch(callbackFail || function(e){console.error(e);});
		},

		count_log_entries :function (filters) {
			return filters.reduce((tableOrCollection, filter, index) => {
				if (index === 0) {
					// we have a Table
					return tableOrCollection.filter(filter);
				}
				// otherwise we have a Collection
				return tableOrCollection.and(filter);
			}, this.con.logs).count();
		},

		get_log_entries :function ({ pageNumber, itemsPerPage, filters }) {
			const collection = this.con.logs.orderBy('timestamp').reverse();

			const filteredCollection = filters.reduce((result, filter) => result.and(filter), collection);

			return filteredCollection
				.offset((pageNumber - 1) * itemsPerPage)
				.limit(itemsPerPage)
				.toArray();
		},

		delete_log_entries :function () {
			return this.con.logs.clear();
		},
		
	};
	
	// Prevent the user ID stored as non-string
	Object.defineProperty(window.KC3Database,'index',{
		get:function(){return String(dbIndex);},
		set:function(value){dbIndex = String(value);},
		enumerable:true
	});
	
	// probably keep this to save memory
	function processLodgerKey(k) {
		return /([a-z]+)/.exec(k)[1];
	}
	
})();
