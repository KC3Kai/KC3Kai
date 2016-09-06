(function(){
	"use strict";
	
	KC3StrategyTabs.mstupdate = new KC3StrategyTab("mstupdate");
	
	KC3StrategyTabs.mstupdate.definition = {
		tabSelf: KC3StrategyTabs.mstupdate,
		newShips: [],
		newGears: [],
		server_ip: "",
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
			
			var timeNow = (new Date()).getTime();
			var self = this;
			var masterChanged = false;
			
			$.each(KC3Master.new_ships(), function(ship_id, ship_time){
				console.log("testing ship time", timeNow, ship_time, "diff=", timeNow-ship_time);
				if(timeNow-ship_time > 7*24*60*60*1000){
					KC3Master.remove_new_ship(ship_id);
					console.log("SHIP", ship_id, "has expired from update list");
					masterChanged = true;
				}else{
					self.newShips.push( KC3Master.ship(ship_id) );
				}
			});
			
			$.each(KC3Master.new_slotitems(), function(item_id, item_time){
				console.log("testing item time", timeNow, item_time, "diff=", timeNow-item_time);
				if(timeNow-item_time > 7*24*60*60*1000){
					KC3Master.remove_new_slotitem(item_id);
					console.log("ITEM", item_id, "has expired from update list");
					masterChanged = true;
				}else{
					self.newGears.push( KC3Master.slotitem(item_id) );
				}
			});
			
			if(masterChanged){
				console.log("master changed, saving..");
				KC3Master.save();
			}
			
			console.log(this.newShips);
			console.log(this.newGears);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".tab_mstupdate .runtime_id").text(chrome.runtime.id);
			
			var shipBox, gearBox, shipFile, shipVersion, shipSrc;
			var self = this;
			var linkClickFunc = function(e){
				KC3StrategyTabs.gotoTab($(this).data("tab"), $(this).data("api_id"));
			};

			// New Ship list
			$.each(this.newShips, function(index, shipData){
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph(shipData.api_id).api_filename;
				shipVersion = KC3Master.graph(shipData.api_id).api_version[0];
				
				shipSrc = "../../../../assets/swf/card.swf?sip="+self.server_ip
						+"&shipFile="+shipFile
						+"&abyss="+(shipData.api_id>500?1:0)
						+(!shipVersion?"":"&ver="+shipVersion);
						
				$(".ship_cg embed", shipBox).attr("src", shipSrc).attr("menu", "false");
				
				$(".ship_name", shipBox).text( KC3Meta.shipName( shipData.api_name ) );
				$(".ship_name", shipBox).data("tab", "mstship");
				$(".ship_name", shipBox).data("api_id", shipData.api_id);
				$(".ship_name", shipBox).click(linkClickFunc);
				
				shipBox.appendTo(".tab_mstupdate .mstships");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstships");

			// New Equipment List
			$.each(this.newGears, function(index, GearData){
				gearBox = $(".tab_mstupdate .factory .mstgear").clone();
				
				if(GearData.api_id<501){
					var paddedId = (GearData.api_id<10?"00":GearData.api_id<100?"0":"")+GearData.api_id;
					$(".gear_cg img", gearBox).attr("src", "http://"+self.server_ip+"/kcs/resources/image/slotitem/card/"+paddedId+".png");
				}else{
					$(".gear_cg img", gearBox).hide();
				}
				
				$(".gear_name", gearBox).text( KC3Meta.gearName( GearData.api_name ) );
				$(".gear_name", gearBox).data("tab", "mstgear");
				$(".gear_name", gearBox).data("api_id", GearData.api_id);
				$(".gear_name", gearBox).click(linkClickFunc);
				
				gearBox.appendTo(".tab_mstupdate .mstgears");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstgears");
			
		}
		
	};
	
})();
