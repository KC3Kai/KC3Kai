/* Database.js
KC3改 Indexed Database

Used to log player information for later use on Strategy Room
Uses Dexie.js third-party plugin on the assets directory
*/
(function(){
	"use strict";
	
	window.KC3Database = {
		index: 0,
		con:{},
		
		init :function( defaultUser ){
			this.con = new Dexie("KC3");
			
			if(typeof defaultUser !== "undefined"){
				this.index = defaultUser;
			}
			
			this.con.version(1).stores({
				account: "++id,&hq,server,mid,name",
				build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
				lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
				sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,time",
				battle: "++id,hq,sortie_id,node,data,yasen,rating,drop,time",
				resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
				useitem: "++id,hq,torch,screw,bucket,devmat,hour"
			});
			
			this.con.version(2).stores({
				account: "++id,&hq,server,mid,name",
				build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
				lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
				sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
				battle: "++id,hq,sortie_id,node,data,yasen,rating,drop,time",
				resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
				useitem: "++id,hq,torch,screw,bucket,devmat,hour",
				screenshots: "++id,hq,imgur,ltime"
			}).upgrade(function(t){});
			
			this.con.version(3).stores({
				account: "++id,&hq,server,mid,name",
				build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
				lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
				sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
				battle: "++id,hq,sortie_id,node,data,yasen,rating,drop,time",
				resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
				useitem: "++id,hq,torch,screw,bucket,devmat,hour",
				screenshots: "++id,hq,imgur,ltime",
				develop: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time"
			}).upgrade(function(t){});
			
			this.con.version(4).stores({
				account: "++id,&hq,server,mid,name",
				build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
				lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
				sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
				battle: "++id,hq,sortie_id,node,enemyId,data,yasen,rating,drop,time",
				resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
				useitem: "++id,hq,torch,screw,bucket,devmat,hour",
				screenshots: "++id,hq,imgur,ltime",
				develop: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time"
			}).upgrade(function(t){});
			
			this.con.version(5).stores({
				account: "++id,&hq,server,mid,name",
				build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
				lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,devmat,result,time",
				sortie: "++id,hq,world,mapnum,fleetnum,combined,fleet1,fleet2,fleet3,fleet4,support1,support2,time",
				battle: "++id,hq,sortie_id,node,enemyId,data,yasen,rating,drop,time",
				resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,hour",
				useitem: "++id,hq,torch,screw,bucket,devmat,hour",
				screenshots: "++id,hq,imgur,ltime",
				develop: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
				newsfeed: "++id,hq,type,message,time",
			}).upgrade(function(t){});
			
			this.con.version(6).stores({
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
			}).upgrade(function(t){});
			
			this.con.open();
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
		
		Screenshot :function(imgur){
			this.con.screenshots.add({
				hq : this.index,
				imgur : imgur,
				ltime : Math.floor((new Date()).getTime()/1000),
			});
		},
		
		Develop :function(data){
			data.hq = this.index;
			this.con.develop.add(data);
		},
		
		/* [GET] Retrive logs from Local DB
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
				.where("id").equals(sortie_id)
				.toArray(function(response){
					if(response.length > 0){
						
						// Get all battles on this sortie
						self.con.battle
							.where("sortie_id").equals(sortie_id)
							.toArray(function(battleList){
								response[0].battles = battleList;
								callback(response[0]);
							});
							
					}else{
						callback(false);
					}
				});
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
		
		get_resource :function(HourNow, callback){
			var self = this;
			this.con.resource
				.where("hour").above(HourNow-720)
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
				.where("hour").above(HourNow-720)
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
		
		get_sortie_page :function( world, map, page, callback ){
			
		},
		
		request_export :function(callback){
			callback("{}");
		},
		
	};
	
})();