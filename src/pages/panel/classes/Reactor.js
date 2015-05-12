KC3.prototype.Reactor  = {
	shipConstruction:{ active: false },
	
	/* Load Master Data
	-------------------------------------------------------*/
	"api_start2":function(params, response, headers){
		app.Master.processRaw( response.api_data );
		app.Dashboard.state = "arriving";
		app.Dashboard.messageBox("Arriving at Naval Base...");
	},
	
	/* Home Port Screen
	-------------------------------------------------------*/
	"api_port/port":function(params, response, headers){
		app.Dashboard.showPanel();
		
		app.Battle.EndSortie();
		
		app.Player.set({
			mid: response.api_data.api_basic.api_member_id,
			name: response.api_data.api_basic.api_nickname,
			desc: response.api_data.api_basic.api_comment,
			rank: response.api_data.api_basic.api_rank,
			level: response.api_data.api_basic.api_level,
			exp: response.api_data.api_basic.api_experience
		});
		
		app.Ships.clear();
		app.Ships.set(response.api_data.api_ship);
		
		app.Gears.max = response.api_data.api_basic.api_max_slotitem;
		
		app.Docks.setFleets(response.api_data.api_deck_port);
		app.Docks.setRepair(response.api_data.api_ndock);
		app.Docks._buildCount = response.api_data.api_basic.api_count_kdock;
		
		app.Resources.setFcoin(response.api_data.api_basic.api_fcoin);
		
		var UTCtime = app.Util.getUTC(headers);
		
		app.Resources.set([
			response.api_data.api_material[0].api_value,
			response.api_data.api_material[1].api_value,
			response.api_data.api_material[2].api_value,
			response.api_data.api_material[3].api_value
		], UTCtime);
		
		app.Resources.useitem({
			torch: response.api_data.api_material[4].api_value,
			buckets: response.api_data.api_material[5].api_value,
			devmats: response.api_data.api_material[6].api_value,
			screws: response.api_data.api_material[7].api_value
		}, UTCtime);
		
		app.Player.statistics({
			exped: {
				rate: false,
				total: response.api_data.api_basic.api_ms_count,
				success: response.api_data.api_basic.api_ms_success
			},
			pvp: {
				rate: false,
				win: response.api_data.api_basic.api_pt_win,
				lose: response.api_data.api_basic.api_pt_lose,
				attacked: response.api_data.api_basic.api_pt_challenged,
				attacked_win: response.api_data.api_basic.api_pt_challenged_win
			},
			sortie: {
				rate: false,
				win: response.api_data.api_basic.api_st_win,
				lose: response.api_data.api_basic.api_st_lose
			}
		});
		
		app.Player.newsfeed(response.api_data.api_log);
		
		app.Docks._combined = response.api_data.api_combined_flag;
		
		app.Dashboard.Info.admiral();
		app.Dashboard.Info.materials();
		app.Dashboard.Timers.update();
		app.Dashboard.Fleet.update();
	},
	
	
	/*-------------------------------------------------------*/
	/*--------------------[ PLAYER INFO ]--------------------*/
	/*-------------------------------------------------------*/
	
	/* User Basic Information
	-------------------------------------------------------*/
	"api_get_member/basic":function(params, response, headers){
		app.Player.set({
			mid: response.api_data.api_member_id,
			name: response.api_data.api_nickname,
			desc: response.api_data.api_comment,
			rank: response.api_data.api_rank,
			level: response.api_data.api_level,
			exp: response.api_data.api_experience
		});
		app.Resources.setFcoin(response.api_data.api_fcoin);
		
		app.Docks._fleetCount = response.api_data.api_count_deck;
		app.Docks._repairCount = response.api_data.api_count_ndock;
		app.Docks._buildCount = response.api_data.api_count_kdock;
		
		app.Ships.max = response.api_data.api_max_chara;
		app.Gears.max = response.api_data.api_max_slotitem;
		
		app.Player.statistics({
			exped: {
				rate: false,
				total: response.api_data.api_ms_count,
				success: response.api_data.api_ms_success
			},
			pvp: {
				rate: false,
				win: response.api_data.api_pt_win,
				lose: response.api_data.api_pt_lose,
				attacked: response.api_data.api_pt_challenged,
				attacked_win: response.api_data.api_pt_challenged_win
			},
			sortie: {
				rate: false,
				win: response.api_data.api_st_win,
				lose: response.api_data.api_st_lose
			}
		});
		
		app.Dashboard.Info.admiral();
		app.Dashboard.Info.materials();
	},
	
	/* HQ Record Screen
	-------------------------------------------------------*/
	"api_get_member/record":function(params, response, headers){
		app.Player.set({
			mid: response.api_data.api_member_id,
			name: response.api_data.api_nickname,
			desc: response.api_data.api_cmt,
			rank: response.api_data.api_rank,
			level: response.api_data.api_level,
			exp: response.api_data.api_experience[0]
		});
		
		app.Resources.setFcoin(response.api_data.api_fcoin);
		
		app.Docks._fleetCount = response.api_data.api_deck;
		app.Docks._repairCount = response.api_data.api_ndoc;
		app.Docks._buildCount = response.api_data.api_kdoc;
		
		app.Ships.max = response.api_data.api_ship[1];
		app.Gears.max = response.api_data.api_slotitem[1];
		
		app.Player.statistics({
			exped: {
				rate: response.api_data.api_mission.api_rate,
				total: response.api_data.api_mission.api_count,
				success: response.api_data.api_mission.api_success
			},
			pvp: {
				rate: response.api_data.api_practice.api_rate,
				win: response.api_data.api_practice.api_win,
				lose: response.api_data.api_practice.api_lose,
				attacked: false,
				attacked_win: false
			},
			sortie: {
				rate: response.api_data.api_war.api_rate,
				win: response.api_data.api_war.api_win,
				lose: response.api_data.api_war.api_lose
			}
		});
		
		app.Dashboard.Info.admiral();
		app.Dashboard.Info.materials();
	},
	
	/* Get resource count
	-------------------------------------------------------*/
	"api_get_member/material":function(params, response, headers){
		
	},
	
	
	/*-------------------------------------------------------*/
	/*----------------------[ LIBRARY ]----------------------*/
	/*-------------------------------------------------------*/
	
	/* Ship Infos mid-sortie
	-------------------------------------------------------*/
	"api_get_member/ship2":function(params, response, headers){
		app.Ships.set(response.api_data);
		app.Docks.setFleets( response.api_data_deck );
		app.Dashboard.Fleet.update();
	},
	
	/* Custom Ship Query
	-------------------------------------------------------*/
	"api_get_member/ship3":function(params, response, headers){
		app.Ships.set( response.api_data.api_ship_data );
		app.Docks.setFleets( response.api_data.api_deck_data );
		app.Dashboard.Timers.update();
		app.Dashboard.Fleet.update();
	},
	
	/* All owned equipment
	-------------------------------------------------------*/
	"api_get_member/slot_item": function(params, response, headers){
		app.Gears.clear();
		app.Gears.set( response.api_data );
	},
	
	/* Get Fleets
	-------------------------------------------------------*/
	"api_get_member/deck":function(params, response, headers){
		app.Docks.setFleets( response.api_data );
		app.Dashboard.Timers.update();
		app.Dashboard.Fleet.update();
	},
	
	
	/*-------------------------------------------------------*/
	/*-------------------[ CONSTRUCTION ]--------------------*/
	/*-------------------------------------------------------*/
	
	/* Construct a Ship
	-------------------------------------------------------*/
	"api_req_kousyou/createship":function(params, response, headers){
		this.shipConstruction = {
			active: true,
			dock_num: app.Util.findParam(params, "api%5Fkdock%5Fid"),
			flagship: app.Ships.get( app.Docks._fleets[0].api_ship[0] ).api_ship_id,
			lsc: app.Util.findParam(params, "api%5Flarge%5Fflag"),
			torched: app.Util.findParam(params, "api_highspeed"),
			resources: [
				app.Util.findParam(params, "api%5Fitem1"),
				app.Util.findParam(params, "api%5Fitem2"),
				app.Util.findParam(params, "api%5Fitem3"),
				app.Util.findParam(params, "api%5Fitem4"),
				app.Util.findParam(params, "api%5Fitem5")
			]
		};
	},
	
	
	/* Construction Docks
	-------------------------------------------------------*/
	"api_get_member/kdock":function(params, response, headers){
		if(this.shipConstruction.active){
			if(this.shipConstruction.lsc == 1){
				app.Logging.LSC({
					flag: this.shipConstruction.flagship,
					rsc1: this.shipConstruction.resources[0],
					rsc2: this.shipConstruction.resources[1],
					rsc3: this.shipConstruction.resources[2],
					rsc4: this.shipConstruction.resources[3],
					devmat: this.shipConstruction.resources[4],
					result: response.api_data[this.shipConstruction.dock_num-1].api_created_ship_id,
					time: app.Util.getUTC(headers)
				});
			}else{
				app.Logging.Build({
					flag: this.shipConstruction.flagship,
					rsc1: this.shipConstruction.resources[0],
					rsc2: this.shipConstruction.resources[1],
					rsc3: this.shipConstruction.resources[2],
					rsc4: this.shipConstruction.resources[3],
					result: response.api_data[this.shipConstruction.dock_num-1].api_created_ship_id,
					time: app.Util.getUTC(headers)
				});
			}
			this.shipConstruction = { active: false };
		}
		
		app.Docks.setBuild(response.api_data);
		app.Dashboard.Timers.update();
	},
	
	/* Instant-Torch a construction
	-------------------------------------------------------*/
	"api_req_kousyou/createship_speedchange":function(params, response, headers){
		app.Resources.torch--;
		var kDockNum = app.Util.findParam(params, "api%5Fkdock%5Fid");
		app.Docks._build[ kDockNum-1 ].api_state = 3;
		app.Dashboard.Info.materials();
		app.Dashboard.Timers.update();
	},
	
	/* Get a completed construction
	-------------------------------------------------------*/
	"api_req_kousyou/getship":function(params, response, headers){
		app.Docks.setBuild( response.api_data.api_kdock );
		app.Ships.set([response.api_data.api_ship]);
		app.Gears.set(response.api_data.api_slotitem);
		app.Dashboard.Timers.update();
		app.Dashboard.Info.materials();
	},
	
	
	/*-------------------------------------------------------*/
	/*-------------------[ FLEET MANAGEMENT ]----------------*/
	/*-------------------------------------------------------*/
	
	/* Change fleet member
	-------------------------------------------------------*/
	"api_req_hensei/change":function(params, response, headers){
		var FleetIndex = app.Util.findParam(params, "api%5Fid");
		
		if(typeof response.api_data != "undefined"){
			if(typeof response.api_data.api_change_count != "undefined"){
				app.Docks._fleets[FleetIndex-1].api_ship[1] = -1;
				app.Docks._fleets[FleetIndex-1].api_ship[2] = -1;
				app.Docks._fleets[FleetIndex-1].api_ship[3] = -1;
				app.Docks._fleets[FleetIndex-1].api_ship[4] = -1;
				app.Docks._fleets[FleetIndex-1].api_ship[5] = -1;
				app.Dashboard.Fleet.update();
				return true;
			}
		}
		
		var ChangedIndex = app.Util.findParam(params, "api%5Fship%5Fidx");
		var NewShipOnSlet = app.Util.findParam(params, "api%5Fship%5Fid");
		if(NewShipOnSlet > -1){
			app.Docks._fleets[FleetIndex-1].api_ship[ChangedIndex] = NewShipOnSlet;
		}else{
			app.Docks._fleets[FleetIndex-1].api_ship.splice(ChangedIndex, 1);
			app.Docks._fleets[FleetIndex-1].api_ship[5] = -1;
		}
		app.Dashboard.Fleet.update();
	},
	
	/* Change equipment of a ship
	-------------------------------------------------------*/
	"api_req_kaisou/slotset":function(params, response, headers){
		var itemID = app.Util.findParam(params, "api%5Fitem%5Fid");
		var slotIndex = app.Util.findParam(params, "api%5Fslot%5Fidx");
		var shipID = app.Util.findParam(params, "api%5Fid");
		if(itemID > -1){
			app.Ships.changeEquip(shipID, slotIndex), itemID;
		}else{
			app.Ships.clearEquip(shipID, slotIndex);
		}
		app.Dashboard.Fleet.update(shipID);
	},
	
	/* Remove all equipment of a ship
	-------------------------------------------------------*/
	"api_req_kaisou/unsetslot_all":function(params, response, headers){
		var shipID = app.Util.findParam(params, "api%5Fid");
		app.Ships.clearEquips(shipID);
		app.Dashboard.Fleet.update(shipID);
	},
	
	/* Re-supply a ship
	-------------------------------------------------------*/
	"api_req_hokyu/charge":function(params, response, headers){
		
	},
	
	/* Combine/Uncombine Fleets
	-------------------------------------------------------*/
	"api_req_hensei/combined":function(params, response, headers){
		app.Docks._combined = parseInt(app.Util.findParam(params, "api%5Fcombined%5Ftype"), 10);
	},
	
	/*-------------------------------------------------------*/
	/*----------------------[ BATTLES ]----------------------*/
	/*-------------------------------------------------------*/
	
	/* Start Sortie
	-------------------------------------------------------*/
	"api_req_map/start":function(params, response, headers){
		app.Battle.StartSortie(
			response.api_data.api_maparea_id,
			response.api_data.api_mapinfo_no,
			app.Util.findParam(params, "api%5Fdeck%5Fid"),
			app.Util.getUTC(headers)
		);
		app.Battle.onNode = response.api_data.api_no;
		
		if(app.Config.showCompass){
			app.Dashboard.showCompass(response.api_data);
		}
	},
	
	/* Traverse Map
	-------------------------------------------------------*/
	"api_req_map/next":function(params, response, headers){
		app.Battle.onNode = response.api_data.api_no;
		
		if(app.Config.showCompass){
			app.Dashboard.showCompass(response.api_data);
		}
	},
	
	/* Node Battle
	-------------------------------------------------------*/
	"api_req_sortie/battle":function(params, response, headers){
		app.Battle.Engage(
			response.api_data,
			app.Util.getUTC(headers)
		);
	},
	
	/* Air Battle
	-------------------------------------------------------*/
	"api_req_sortie/airbattle":function(params, response, headers){
		app.Battle.Engage(
			response.api_data,
			app.Util.getUTC(headers)
		);
	},
	
	/* 
	-------------------------------------------------------*/
	"api_req_combined_battle/battle_water":function(params, response, headers){
		app.Battle.Engage(
			response.api_data,
			app.Util.getUTC(headers)
		);
	},
	
	/* 
	-------------------------------------------------------*/
	"api_req_combined_battle/goback_port":function(params, response, headers){
		
	},
	
	/* START AT YASEN!
	-------------------------------------------------------*/
	"api_req_battle_midnight/sp_midnight":function(params, response, headers){
		app.Battle.Engage(
			response.api_data,
			app.Util.getUTC(headers)
		);
	},
	
	/* YASEN!
	-------------------------------------------------------*/
	"api_req_battle_midnight/battle":function(params, response, headers){
		app.Battle.Yasen( response.api_data );
	},
	
	/* Battle Results
	-------------------------------------------------------*/
	"api_req_sortie/battleresult":function(params, response, headers){
		app.Battle.Results( response.api_data );
	},
	
	/* Combined Fleet Battle Results
	-------------------------------------------------------*/
	"api_req_combined_battle/battleresult":function(params, response, headers){
		app.Battle.Results( response.api_data );
	},
	
	
	/*-------------------------------------------------------*/
	/*-----------------------[ QUESTS ]----------------------*/
	/*-------------------------------------------------------*/
	
	/* Quest List
	-------------------------------------------------------*/
	"api_get_member/questlist":function(params, response, headers){
		if(app.Config.tl_overlay){
			chrome.runtime.sendMessage({
				game:"kancolle",
				type:"game",
				action:"quest_overlay",
				questlist: response.api_data.api_list
			}, function(response){});
		}
	},
	
	/* Receive Quest Reward
	-------------------------------------------------------*/
	"api_req_quest/clearitemget":function(params, response, headers){
		
	},
	
	
	/*-------------------------------------------------------*/
	/*--------------------[ REPAIR DOCKS ]-------------------*/
	/*-------------------------------------------------------*/
	
	/* Repair Docks
	-------------------------------------------------------*/
	"api_get_member/ndock":function(params, response, headers){
		app.Docks.setRepair(response.api_data);
		app.Dashboard.Timers.update();
		app.Dashboard.Fleet.update();
	},
	
	/* Start repair
	-------------------------------------------------------*/
	"api_req_nyukyo/start":function(params, response, headers){
		var ship_id = app.Util.findParam(params, "api%5Fship%5Fid");
		var bucket = app.Util.findParam(params, "api%5Fhighspeed");
		var nDockNum = app.Util.findParam(params, "api%5Fndock%5Fid");
	},
	
	/* Use bucket
	-------------------------------------------------------*/
	"api_req_nyukyo/speedchange":function(params, response, headers){
		app.Resources.buckets--;
		var nDockNum = app.Util.findParam(params, "api%5Fndock%5Fid");
		app.Docks._repair[ nDockNum-1 ].api_state = 0;
		app.Dashboard.Info.materials();
		app.Dashboard.Timers.update();
	},
	
	/*-------------------------------------------------------*/
	/*----------------------[ OTHERS ]-----------------------*/
	/*-------------------------------------------------------*/
	
	/* Craft Equipment
	-------------------------------------------------------*/
	"api_req_kousyou/createitem":function(params, response, headers){
		var resourceUsed = [
			app.Util.findParam(params, "api%5Fitem1"),
			app.Util.findParam(params, "api%5Fitem2"),
			app.Util.findParam(params, "api%5Fitem3"),
			app.Util.findParam(params, "api%5Fitem4")
		];
		
		// Log into development History
		app.Logging.Develop({
			flag: app.Ships.get( app.Docks._fleets[0].api_ship[0] ).api_ship_id,
			rsc1: resourceUsed[0],
			rsc2: resourceUsed[1],
			rsc3: resourceUsed[2],
			rsc4: resourceUsed[3],
			result:
				(typeof response.api_data.api_slot_item != "undefined")
				?response.api_data.api_slot_item.api_slotitem_id
				:-1,
			time: app.Util.getUTC(headers)
		});
		
		// Call craft box if enabled
		if(app.Config.showCraft){
			if(typeof response.api_data.api_slot_item != "undefined"){
				app.Dashboard.showCraft(response.api_data, resourceUsed);
			}
		}
	},
	
	/* View World Maps
	-------------------------------------------------------*/
	"api_get_member/mapinfo":function(params, response, headers){
		var maps = {};
		var ctr, thisMap;
		for(ctr in response.api_data){
			thisMap = response.api_data[ctr];
			
			// Create map object
			maps[ "m"+thisMap.api_id ] = {
				id: thisMap.api_id,
				clear: thisMap.api_cleared
			};
			
			// Check for boss gauge kills
			if(typeof thisMap.api_defeat_count != "undefined"){
				maps[ "m"+thisMap.api_id ].kills = thisMap.api_defeat_count;
			}
			
			// Check for event map info
			if(typeof thisMap.api_eventmap != "undefined"){
				maps[ "m"+thisMap.api_id ].curhp = thisMap.api_eventmap.api_now_maphp;
				maps[ "m"+thisMap.api_id ].maxhp = thisMap.api_eventmap.api_max_maphp;
				maps[ "m"+thisMap.api_id ].difficulty = thisMap.api_eventmap.api_selected_rank;
			}
		}
		localStorage.player_maps = JSON.stringify(maps);
	},
	
	/* Modernize
	-------------------------------------------------------*/
	"api_req_kaisou/powerup":function(params, response, headers){
		var consumed_ids = app.Util.findParam(params, "api%5Fid%5Fitems");
		app.Ships.remove(consumed_ids.split("%2C"));
		app.Dashboard.Info.materials();
	},
	
	/* Scrap a Ship
	-------------------------------------------------------*/
	"api_req_kousyou/destroyship":function(params, response, headers){
		var ship_id = app.Util.findParam(params, "api%5Fship%5Fid");
		app.Ships.remove(ship_id);
		app.Dashboard.Info.materials();
		app.Dashboard.Fleet.update();
	},
	
	/* Scrap a Gear
	-------------------------------------------------------*/
	"api_req_kousyou/destroyitem2":function(params, response, headers){
		var gear_ids = app.Util.findParam(params, "api%5Fslotitem%5Fids");
		app.Gears.remove(gear_ids.split("%2C"));
		app.Dashboard.Info.materials();
	}
	
};