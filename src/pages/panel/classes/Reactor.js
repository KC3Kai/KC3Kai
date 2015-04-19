KC3.prototype.Reactor  = {
	
	/* [api_start2] Load Master Data
	-------------------------------------------------------*/
	"api_start2":function(params, response, headers){
		app.Master.processRaw( response.api_data );
		app.Dashboard.state = "arriving";
		app.Dashboard.messageBox("Arriving at Naval Base...");
	},
	
	/* [api_port/port] Home Port Screen
	-------------------------------------------------------*/
	"api_port/port":function(params, response, headers){
		app.Dashboard.showPanel();
		
		app.Battle.EndSortie();
		
		app.Player.setBasic({
			mid: response.api_data.api_basic.api_member_id,
			name: response.api_data.api_basic.api_nickname,
			desc: response.api_data.api_basic.api_comment,
			rank: response.api_data.api_basic.api_rank,
			level: response.api_data.api_basic.api_level,
			exp: response.api_data.api_basic.api_experience,
			fcoin: response.api_data.api_basic.api_fcoin
		});
		
		app.Player.setShips(response.api_data.api_ship);
		app.Player._shipSlot = [
			response.api_data.api_ship.length,
			response.api_data.api_basic.api_max_chara
		];
		
		app.Player._gearSlot[1] = response.api_data.api_basic.api_max_slotitem;
		
		app.Player.setFleets(response.api_data.api_deck_port);
		app.Player.setRepairDocks( response.api_data.api_ndock );
		app.Player._buildCount = response.api_data.api_basic.api_count_kdock;
		
		app.Player.setResource ([
			response.api_data.api_material[0].api_value,
			response.api_data.api_material[1].api_value,
			response.api_data.api_material[2].api_value,
			response.api_data.api_material[3].api_value
		]);
		
		app.Player.setUseitem({
			torch: response.api_data.api_material[4].api_value,
			buckets: response.api_data.api_material[5].api_value,
			devmats: response.api_data.api_material[6].api_value,
			screws: response.api_data.api_material[7].api_value
		});
		
		app.Player.saveLocal();
		app.Dashboard.Info.admiral();
		app.Dashboard.Info.materials();
		app.Dashboard.Timers.update();
		app.Dashboard.Fleet.update();
		/*
		KanColleAccount.record({
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
		KanColleAccount.log(response.api_data.api_log);*/
	},
	
	/* [api_get_member/basic] User Basic Information
	-------------------------------------------------------*/
	"api_get_member/basic":function(params, response, headers){
		app.Player.setBasic({
			mid: response.api_data.api_member_id,
			name: response.api_data.api_nickname,
			desc: response.api_data.api_comment,
			rank: response.api_data.api_rank,
			level: response.api_data.api_level,
			exp: response.api_data.api_experience,
			fcoin: response.api_data.api_fcoin
		});
	},
	
	/* [api_get_member/slot_item] All owned equipment
	-------------------------------------------------------*/
	"api_get_member/slot_item": function(params, response, headers){
		app.Player.setGears(response.api_data);
	},
	
	
	/* [api_get_member/kdock] Construction Docks
	-------------------------------------------------------*/
	"api_get_member/kdock":function(params, response, headers){
		app.Player._build = response.api_data;
		var ctr;
		var totalBuildDocks = 0;
		for(ctr in response.api_data){
			if( response.api_data[ctr].api_state > -1 ){
				totalBuildDocks++;
			}
		}
		app.Player._buildCount = totalBuildDocks;
		app.Dashboard.Timers.update();
	},
	
	/* [api_get_member/record] HQ Record Screen
	-------------------------------------------------------*/
	"api_get_member/record":function(params, response, headers){
		/*KanColleAccount.basic({
			url: url,
			mid: response.api_data.api_member_id,
			name: response.api_data.api_nickname,
			desc: response.api_data.api_cmt,
			rank: response.api_data.api_rank,
			level: response.api_data.api_level,
			exp: response.api_data.api_experience[0],
		});
		KanColleAccount.repairDocks([], response.api_data.api_ndoc);
		KanColleAccount.buildDocks([], response.api_data.api_kdoc);
		KanColleAccount.fleets([], response.api_data.api_deck);
		KanColleAccount.ships([], response.api_data.api_ship[0], response.api_data.api_ship[1]);
		KanColleAccount.items([],
			response.api_data.api_slotitem[0],
			response.api_data.api_slotitem[1]
		);
		KanColleAccount.record({
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
		});*/
	},
	
	
	
	/* [api_get_member/questlist] Quest List
	-------------------------------------------------------*/
	"api_get_member/questlist":function(params, response, headers){
		
	},
	
	/* [api_req_hokyu/charge] Re-supply
	-------------------------------------------------------*/
	"api_req_hokyu/charge":function(params, response, headers){
		console.log(params);
		console.log(response);
	},
	
	/* [api_req_kaisou/slotset] Change equipment
	-------------------------------------------------------*/
	"api_req_kaisou/slotset":function(params, response, headers){
		var itemID = app.Util.findParam(params, "api%5Fitem%5Fid");
		var slotIndex = app.Util.findParam(params, "api%5Fslot%5Fidx");
		var shipID = app.Util.findParam(params, "api%5Fid");
		if(itemID > -1){
			app.Player._ships[shipID].api_slot[slotIndex] = itemID;
		}else{
			app.Player._ships[shipID].api_slot.splice(slotIndex, 1);
			app.Player._ships[shipID].api_slot[3] = -1;
		}
		app.Dashboard.Fleet.update(shipID);
	},
	
	/* [api_req_kaisou/unsetslot_all] Remove all equipment
	-------------------------------------------------------*/
	"api_req_kaisou/unsetslot_all":function(params, response, headers){
		var shipID = app.Util.findParam(params, "api%5Fid");
		app.Player._ships[shipID].api_slot = [-1,-1,-1,-1,-1];
		app.Dashboard.Fleet.update(shipID);
	},
	
	/* [api_req_hensei/change] Change fleet member
	-------------------------------------------------------*/
	"api_req_hensei/change":function(params, response, headers){
		var FleetIndex = app.Util.findParam(params, "api%5Fid");
		
		if(typeof response.api_data != "undefined"){
			if(typeof response.api_data.api_change_count != "undefined"){
				app.Player._fleets[FleetIndex-1].api_ship[1] = -1;
				app.Player._fleets[FleetIndex-1].api_ship[2] = -1;
				app.Player._fleets[FleetIndex-1].api_ship[3] = -1;
				app.Player._fleets[FleetIndex-1].api_ship[4] = -1;
				app.Player._fleets[FleetIndex-1].api_ship[5] = -1;
				app.Dashboard.Fleet.update();
				return true;
			}
		}
		
		var ChangedIndex = app.Util.findParam(params, "api%5Fship%5Fidx");
		var NewShipOnSlet = app.Util.findParam(params, "api%5Fship%5Fid");
		if(NewShipOnSlet > -1){
			app.Player._fleets[FleetIndex-1].api_ship[ChangedIndex] = NewShipOnSlet;
		}else{
			app.Player._fleets[FleetIndex-1].api_ship.splice(ChangedIndex, 1);
			app.Player._fleets[FleetIndex-1].api_ship[5] = -1;
		}
		app.Dashboard.Fleet.update();
	},
	
	/* [api_get_member/ship2] Ship Infos mid-sortie
	-------------------------------------------------------*/
	"api_get_member/ship2":function(params, response, headers){
		app.Player.setShips(response.api_data);
		app.Player._shipSlot[0] = response.api_data.length;
		
		app.Player._fleets = response.api_data_deck;
		
		app.Player.saveLocal();
		app.Dashboard.Fleet.update();
	},
	
	/* [api_get_member/ship3] Custom Ship Query
	-------------------------------------------------------*/
	"api_get_member/ship3":function(params, response, headers){
		app.Player.setShipsSafe(response.api_data.api_ship_data);
		app.Player._shipSlot[0] = response.api_data.api_ship_data.length;
		
		app.Player._fleets = response.api_data.api_deck_data;
		
		app.Player.saveLocal();
		app.Dashboard.Fleet.update();
	},
	
	/* [api_req_quest/clearitemget] Receive Quest Reward
	-------------------------------------------------------*/
	"api_req_quest/clearitemget":function(params, response, headers){
		
	},
	
	/* [api_get_member/material] Get resource count
	-------------------------------------------------------*/
	"api_get_member/material":function(params, response, headers){
		
	},
	
	/* [api_req_map/start] Start Sortie
	-------------------------------------------------------*/
	"api_req_map/start":function(params, response, headers){
		app.Battle.StartSortie(
			response.api_data.api_maparea_id,
			response.api_data.api_mapinfo_no,
			app.Util.findParam(params, "api%5Fdeck%5Fid"),
			new Date(app.Util.findParam(headers, "Date")).getTime()
		);
		app.Battle.onNode = response.api_data.api_no;
	},
	
	/* [api_req_map/next] Traverse Map
	-------------------------------------------------------*/
	"api_req_map/next":function(params, response, headers){
		app.Battle.onNode = response.api_data.api_no;
	},
	
	/* [api_req_sortie/battle] Node Battle
	-------------------------------------------------------*/
	"api_req_sortie/battle":function(params, response, headers){
		app.Battle.Engage(
			response.api_data,
			new Date(app.Util.findParam(headers, "Date")).getTime()
		);
	},
	
	/* [api_req_battle_midnight/battle] YASEN!
	-------------------------------------------------------*/
	"api_req_battle_midnight/battle":function(params, response, headers){
		app.Battle.Yasen(response.api_data);
	},
	
	/* [api_req_sortie/battleresult] Battle Results
	-------------------------------------------------------*/
	"api_req_sortie/battleresult":function(params, response, headers){
		app.Battle.Results( response.api_data );
	},
	
	/* [api_get_member/ndock] Enter Repair Docks
	-------------------------------------------------------*/
	"api_get_member/ndock":function(params, response, headers){
		app.Player.setRepairDocks( response.api_data );
		app.Dashboard.Timers.update();
		app.Dashboard.Fleet.update();
	},
	
	/* [api_req_nyukyo/speedchange] Use bucket
	-------------------------------------------------------*/
	"api_req_nyukyo/speedchange":function(params, response, headers){
		// app.Util.findParam(headers, "api%5Fndock%5Fid")
	},
	
	/* [api_get_member/deck] Get Fleets
	-------------------------------------------------------*/
	"api_get_member/deck":function(params, response, headers){
		app.Player.setFleets(response.api_data);
		app.Dashboard.Timers.update();
		app.Dashboard.Fleet.update();
	},
	
	/* [api_req_kousyou/getship] Finish construction
	-------------------------------------------------------*/
	"api_req_kousyou/getship":function(params, response, headers){
		app.Player._build = response.api_data.api_kdock;
		var ctr;
		var totalBuildDocks = 0;
		for(ctr in response.api_data.api_kdock){
			if( response.api_data.api_kdock[ctr].api_state > -1 ){
				totalBuildDocks++;
			}
		}
		app.Player._buildCount = totalBuildDocks;
		app.Player.setShipsSafe([response.api_data.api_ship]);
		app.Player.setGearsSafe(response.api_data.api_slotitem);
		app.Dashboard.Timers.update();
	},
	
	/* [dummyAPI] dummyAPI
	-------------------------------------------------------*/
	"dummyAPI":function(params, response, headers){
		
	}
};