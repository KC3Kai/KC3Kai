(function(){
	"use strict";
	
	KC3StrategyTabs.mstship = new KC3StrategyTab("mstship");
	
	KC3StrategyTabs.mstship.definition = {
		tabSelf: KC3StrategyTabs.mstship,
		
		lines: {
			"Intro" : 1,
			"Library" : 25,
			"Poke(1)" : 2,
			"Poke(2)" : 3,
			"Poke(3)" : 4,
			"Married" : 28,
			"Wedding" : 24,
			"Ranking" : 8,
			"Join" : 13,
			"Equip(1)" : 9,
			"Equip(2)" : 10,
			"Equip(3)" : 26,
			"Supply" : 27,
			"Docking(1)" : 11,
			"Docking(2)" : 12,
			"Construction" : 5,
			"Return" : 7,
			"Sortie" : 14,
			"Battle" : 15,
			"Attack" : 16,
			"Yasen(1)" : 18,
			"Yasen(2)" : 17,
			"MVP" : 23,
			"Damaged(1)" : 19,
			"Damaged(2)" : 20,
			"Damaged(3)" : 21,
			"Sunk" : 22,
			"Idle" : 29,
			"Repair" : 6
		},
		hourlies: {
			"0000" : 30,
			"0100" : 31,
			"0200" : 32,
			"0300" : 33,
			"0400" : 34,
			"0500" : 35,
			"0600" : 36,
			"0700" : 37,
			"0800" : 38,
			"0900" : 39,
			"1000" : 40,
			"1100" : 41,
			"1200" : 42,
			"1300" : 43,
			"1400" : 44,
			"1500" : 45,
			"1600" : 46,
			"1700" : 47,
			"1800" : 48,
			"1900" : 49,
			"2000" : 50,
			"2100" : 51,
			"2200" : 52,
			"2300" : 53
		},
		
		currentGraph: "",
		audio: false,
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".tab_mstship .runtime_id").text(chrome.runtime.id);
			
			var self = this;
			
			/*
			// Add ship type filters
			$.each(KC3Meta._stype, function(index, stype_code){
				if(index === 0) return true;
				
				$("<div />")
					.addClass("stype")
					.text(stype_code)
					.data("id", index)
					.appendTo(".tab_mstship .filters");
			});
			$("<div />").addClass("clear").appendTo(".tab_mstship .filters");*/
			
			// List all ships
			var shipBox;
			$.each(KC3Master._ship, function(index, ShipData){
				shipBox = $(".tab_mstship .factory .shipRecord").clone();
				shipBox.data("id", ShipData.api_id);
				
				if(ShipData.api_id<=500){
					$("img", shipBox).attr("src", KC3Meta.shipIcon(ShipData.api_id) );
				}else{
					$("img", shipBox).attr("src", KC3Meta.abyssIcon(ShipData.api_id) );
				}
				
				$(".shipName", shipBox).text( KC3Meta.shipName(ShipData.api_name) );
					
				shipBox.appendTo(".tab_mstship .shipRecords");
			});
			
			// Select ship
			$(".tab_mstship .shipRecords .shipRecord").on("click", function(){
				self.showShip( $(this).data("id") );
			});
			
			
			if(!!KC3StrategyTabs.pageParams[1]){
				this.showShip(KC3StrategyTabs.pageParams[1]);
			}else{
				this.showShip(405);
			}
		},
		
		
		showShip :function(ship_id){
			var self = this;
			var shipData = KC3Master.ship(ship_id);
			console.log(shipData);
			
			$(".tab_mstship .shipInfo .name").text( KC3Meta.shipName( shipData.api_name ) );
			
			// CG VIEWER
			var shipFile = KC3Master.graph_id(ship_id);
			this.currentGraph = shipFile;
			$(".tab_mstship .shipInfo .cgswf embed").remove();
			
			$("<embed/>")
				.attr("src", "../../../../assets/swf/card.swf?shipFile="+shipFile+"&abyss="+(ship_id>500?1:0))
				.appendTo(".tab_mstship .shipInfo .cgswf");
			
			if(ship_id<=500){
				// Ship-only, non abyssal
				
				$(".tab_mstship .shipInfo .stats").html("");
				$(".tab_mstship .shipInfo .intro").html( shipData.api_getmes );
				
				// STATS
				var statBox;
				$.each([
					["hp", "taik"],
					["fp", "houg"],
					["ar", "souk"],
					["tp", "raig"],
					["rn", "leng"],
					["aa", "tyku"],
					["sp", "soku"],
					["lk", "luck"],
				], function(index, stat){
					statBox = $(".tab_mstship .factory .ship_stat").clone();
					$("img", statBox).attr("src", "../../../../assets/img/stats/"+stat[0]+".png");
					$(".ship_stat_name", statBox).text(stat[1]);
					
					if(stat[0]=="rn"){
						$(".ship_stat_text", statBox).text(["","Short","Medium","Long","V.Long"][shipData.api_leng]);
						$(".ship_stat_text", statBox).show();
						$(".ship_stat_value", statBox).hide();
						
					}else if(stat[0]=="sp"){
						$(".ship_stat_text", statBox).text({"5":"Slow","10":"Fast"}[shipData.api_soku]);
						$(".ship_stat_text", statBox).show();
						$(".ship_stat_value", statBox).hide();
						
					}else{
						$(".ship_stat_min", statBox).text(shipData["api_"+stat[1]][0]);
						$(".ship_stat_max span", statBox).text(shipData["api_"+stat[1]][1]);
					}
					statBox.appendTo(".tab_mstship .shipInfo .stats");
				});
				
				// EQUIPMENT
				$(".tab_mstship .equipments .equipment").each(function(index){
					$(".capacity", this).text( shipData.api_maxeq[index] );
					if(index >= shipData.api_slot_num){
						$(this).hide();
					}else{
						$(this).show();
					}
				});
				
				// MORE INFO
				if(shipData.api_aftershipid>0){
					$(".tab_mstship .shipInfo .remodel_name").text( KC3Meta.shipName(KC3Master.ship(shipData.api_aftershipid).api_name) );
					$(".tab_mstship .shipInfo .remodel_level span").text( shipData.api_afterlv );
					$(".tab_mstship .shipInfo .remodel_ammo .rsc_value").text( shipData.api_afterfuel );
					$(".tab_mstship .shipInfo .remodel_steel .rsc_value").text( shipData.api_afterbull );
					$(".tab_mstship .shipInfo .remodel").show();
				}else{
					$(".tab_mstship .shipInfo .remodel").hide();
				}
				$(".tab_mstship .scrap .rsc").each(function(index){
					$(".rsc_value", this).text( shipData.api_broken[index] );
				});
				$(".tab_mstship .modfods .rsc").each(function(index){
					$(".rsc_value", this).text( shipData.api_powup[index] );
				});
				$(".tab_mstship .shipInfo .consume_fuel .rsc_value").text( shipData.api_fuel_max );
				$(".tab_mstship .shipInfo .consume_ammo .rsc_value").text( shipData.api_bull_max );
				
				// VOICE LINES
				$(".tab_mstship .shipInfo .voices").html("");
				$.each(this.lines, function(vname, vnum){
					$("<div/>")
						.addClass("hover")
						.addClass("voice")
						.data("vnum", vnum)
						.text(vname)
						.appendTo(".tab_mstship .shipInfo .voices");
				});
				$("<div/>").addClass("clear").appendTo(".tab_mstship .shipInfo .voices");
				
				// HOURLIES
				if(shipData.api_voicef>1){
					$(".tab_mstship .shipInfo .hourlies").html("");
					$.each(this.hourlies, function(vname, vnum){
						$("<div/>")
							.addClass("hover")
							.addClass("voice")
							.data("vnum", vnum)
							.text(vname)
							.appendTo(".tab_mstship .shipInfo .hourlies");
					});
					$("<div/>").addClass("clear").appendTo(".tab_mstship .shipInfo .hourlies");
				}
				
				$(".tab_mstship .shipInfo .voice").on("click", function(){
					if(self.audio){ self.audio.pause(); }
					self.audio = new Audio("http://125.6.189.247/kcs/sound/kc"+self.currentGraph+"/"+$(this).data("vnum")+".mp3");
					self.audio.play();
				});
				
				$(".tab_mstship .shipInfo .stats").show();
				$(".tab_mstship .shipInfo .equipments").show();
				$(".tab_mstship .shipInfo .intro").show();
				$(".tab_mstship .shipInfo .more").show();
				$(".tab_mstship .shipInfo .json").hide();
			}else{
				// abyssals, just show json
				$(".tab_mstship .shipInfo .json").text(JSON.stringify(shipData));
				
				$(".tab_mstship .shipInfo .stats").hide();
				$(".tab_mstship .shipInfo .equipments").hide();
				$(".tab_mstship .shipInfo .intro").hide();
				$(".tab_mstship .shipInfo .more").hide();
				$(".tab_mstship .shipInfo .json").show();
			}
			
		}
		
	};
	
})();
