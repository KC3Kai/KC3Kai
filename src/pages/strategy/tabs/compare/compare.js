(function(){
	"use strict";
	
	KC3StrategyTabs.compare = new KC3StrategyTab("compare");
	
	KC3StrategyTabs.compare.definition = {
		tabSelf: KC3StrategyTabs.compare,
		
		server_ip: "",
		ships: [],
		suggestWait: false,
		isSearching: false,
		statList: [
			["hp", "taik", "asc"],
			["fp", "houg", "asc"],
			["tp", "raig", "asc"],
			["aa", "tyku", "asc"],
			["ar", "souk", "asc"],
			["as", "db_asw", "asc"],
			["ev", "db_evasion", "asc"],
			["ls", "db_los", "asc"],
			["lk", "luck", "asc"],
			["ys", "yasen", "asc"],
			["ac", "db_carry", "asc"],
			["sp", "soku", "asc"],
			["rn", "leng", "asc"],
			["am", "bull_max", "desc"],
			["fl", "fuel_max", "desc"],
			["sl", "slot_num", "asc"],
			["lv", "afterlv", "desc"]
		],
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			// Clone all ships
			var box;
			$.each(KC3Master.all_ships(), function(index, ShipData){
				if (ShipData.api_id > 500) return false;
				box = $(".tab_compare .factory .compare_suggest_item").clone();
				$(".compare_suggest_icon img", box).attr("src", KC3Meta.shipIcon(ShipData.api_id));
				$(".compare_suggest_name", box).html(KC3Meta.shipName(ShipData.api_name));
				box.data("id", ShipData.api_id);
				box.appendTo(".tab_compare .compare_suggest");
			});
			
			// Type suggest
			$(".tab_compare .compare_input input").on("keyup", function(){
				if (self.isSearching) return false;
				self.isSearching = true;
				self.search($(this).val());
			});
			
			// Click select ship
			$(".tab_compare .compare_suggest_item").on("click", function(){
				if (self.isSearching) return false;
				self.isSearching = true;
				$(this).hide();
				self.ships.push( $(this).data("id") );
				self.refresh();
				// $(".tab_compare .compare_select_back").trigger("click");
			});
			
			// Remove ship
			$(".tab_compare .compare_list").on("click", ".compare_remove", function(){
				if (self.isSearching) return false;
				self.isSearching = true;
				$(this).parent().hide();
				var index = self.ships.indexOf($(this).data("id"));
				self.ships.splice( index, 1 );
				self.refresh();
				// $(".tab_compare .compare_select_back").trigger("click");
			});
			
			// View selector
			$(".tab_compare .compare_select_back").on("click", function(){
				self.switchToFullView();
			});
			$(".tab_compare .compare_select_stat").on("click", function(){
				self.switchToStatGraph( $(this).data("stat") );
			});
			
			$(".tab_compare .compare_add").show();
		},
		
		/* ADD A SHIP TO COMPARE LIST
		---------------------------------*/
		search :function(searchVal){
			var self = this;
			
			if (searchVal === "") {
				$(".tab_compare .compare_suggest_item").hide();
			} else {
				$(".tab_compare .compare_suggest_item").each(function(){
					if (self.ships.indexOf($(this).data("id")) < 0) {
						if ($(".compare_suggest_name", this).text().toLowerCase().includes(searchVal.toLowerCase())) {
							$(this).show();
						} else {
							$(this).hide();
						}
					} else {
						$(this).hide();
					}
				});
			}
			
			this.isSearching = false;
		},
		
		/* REFRESH COMPARISON DATA
		---------------------------------*/
		refresh :function(){
			var self = this;
			var shipBox, MasterShip;
			$(".tab_compare .compare_list").html("");
			
			// Clone boxes into the interface
			var alpha = 0, bottom = 0, myValue, range;
			$.each(this.ships, function(index, mstId){
				MasterShip = KC3Master.ship(mstId);
				shipBox = $(".tab_compare .factory .compare_ship").clone();
				shipBox.attr("id", "mst-"+mstId);
				$(".compare_ship_icon img", shipBox).attr("src", KC3Meta.shipIcon(mstId));
				$(".compare_ship_name", shipBox).html( KC3Meta.shipName(MasterShip.api_name) );
				$(".compare_remove", shipBox).data("id", mstId);
				shipBox.appendTo(".tab_compare .compare_list");
			});
			
			var seletedStat = $(".tab_compare .compare_selector .active").data("stat");
			if (!seletedStat) {
				this.switchToFullView();
			} else {
				this.switchToStatGraph(seletedStat);
			}
		},
		/* VIEW: SINGLE GRAPHED STAT
		---------------------------------*/
		switchToFullView :function(statIndex){
			$(".tab_compare .compare_select_back").addClass("active");
			$(".tab_compare .compare_select_stat").removeClass("active");
			
			var self = this;
			var shipBox, MasterShip, myStat, myValue, bottom, range, alpha;
			var highestStats = self.calculateHighestStats();
			
			$.each(this.ships, function(index, mstId){
				MasterShip = KC3Master.ship(mstId);
				shipBox = $("#mst-"+mstId);
				$.each(self.statList, function(code, stat){
					myStat = self.getStat(MasterShip, stat);
					alpha = 0;
					if (stat[2] == "asc") {
						bottom = Math.floor(highestStats[stat[0]] * 0.8);
						myValue = myStat - bottom;
						if (myValue < 0) myValue = 0;
						alpha = myValue / (highestStats[stat[0]] - bottom);
					} else {
						myValue = myStat - highestStats[stat[0]][0];
						range = highestStats[stat[0]][1] - highestStats[stat[0]][0];
						alpha = 1 - (myValue / range);
					}
					
					if (alpha) {
						var oldBG = $(".compare_ship_"+stat[0], shipBox).css("background-color");
						var newBG = oldBG.insert( oldBG.length-1, ", "+alpha);
						newBG = newBG.insert(3, "a");
						$(".compare_ship_"+stat[0], shipBox).css({background:newBG});
					} else {
						$(".compare_ship_"+stat[0], shipBox).css({background:'transparent'});
					}
					
				});
			});
			
			$(".tab_compare .compare_ship_stat").show();
			$(".tab_compare .compare_remove").show();
			$(".tab_compare .compare_ship_graph").hide();
			this.isSearching = false;
		},
		
		/* VIEW: SINGLE GRAPHED STAT
		---------------------------------*/
		switchToStatGraph :function(statIndex){
			$(".tab_compare .compare_select_back").removeClass("active");
			$(".tab_compare .compare_select_stat").removeClass("active");
			$(".tab_compare .compare_select_stat[data-stat="+statIndex+"]").addClass("active");
			
			var self = this;
			var stat = self.statList[statIndex];
			var barMaxWidth = 450;
			var highestStats = self.calculateHighestStats();
			var shipBox, MasterShip, percent, myStat;
			
			$.each(this.ships, function(index, mstId){
				MasterShip = KC3Master.ship(mstId);
				shipBox = $("#mst-"+mstId);
				myStat = self.getStat(MasterShip, stat);
				
				if (stat[2] == "asc") {
					percent = myStat / highestStats[stat[0]];
				} else {
					percent = myStat / highestStats[stat[0]][1];
				}
				
				$(".compare_ship_bar", shipBox).animate({
					width: barMaxWidth * percent
				}, 500);
				$(".compare_ship_value", shipBox).text(myStat);
			});
			
			$(".tab_compare .compare_ship_stat").hide();
			$(".tab_compare .compare_remove").hide();
			$(".tab_compare .compare_ship_graph").show();
			this.isSearching = false;
		},
		
		/* UTIL: CALCULATE HIGHEST STATS
		---------------------------------*/
		calculateHighestStats :function(){
			var self = this;
			var MasterShip , highestStats = {}, myStat = 0;
			
			// Calculate highest stats first
			$.each(this.ships, function(index, mstId){
				MasterShip = KC3Master.ship(mstId);
				$.each(self.statList, function(code, stat){
					myStat = self.getStat(MasterShip, stat);
					
					if (typeof highestStats[stat[0]] === "undefined") {
						// If stat not yet recorded in rankings
						if (stat[2] == "asc") {
							highestStats[stat[0]] = myStat;
						} else {
							highestStats[stat[0]] = [myStat, myStat];
						}
					} else {
						// Compare with highest stat recorded
						if (stat[2] == "asc") {
							if (myStat > highestStats[stat[0]]) {
								highestStats[stat[0]] = myStat;
							}
						} else {
							if (myStat < highestStats[stat[0]][0]) {
								highestStats[stat[0]][0] = myStat;
							}
							if (myStat > highestStats[stat[0]][1]) {
								highestStats[stat[0]][1] = myStat;
							}
						}
					}
				});
			});
			return highestStats;
		},
		
		/* UTIL: GET RAW STAT OF MASTER SHIP
		---------------------------------*/
		getStat :function(MasterShip, stat){
			if(stat[1].startsWith("db_")){
				var statFromDb = WhoCallsTheFleetDb.getShipStat(MasterShip.api_id);
				var realName = stat[1].slice(3);
				return statFromDb[realName] == -1 ? 0 : statFromDb[realName];
			} else if(stat[0] == "ys") {
				return MasterShip.api_houg[1] + MasterShip.api_raig[1];
			} else if(stat[0] == "lk") {
				return MasterShip.api_luck[0];
			} else if(["sp","rn","fl","am","sl","lv"].indexOf(stat[0]) > -1) {
				return MasterShip["api_"+stat[1]];
			}else{
				return MasterShip["api_"+stat[1]][1];
			}
		}
		
	};
	
})();
