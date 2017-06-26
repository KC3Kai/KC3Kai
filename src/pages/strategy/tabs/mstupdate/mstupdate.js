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
				console.debug("Testing ship time", timeNow, ship_time, "diff=", timeNow-ship_time);
				if(timeNow-ship_time > 7*24*60*60*1000){
					KC3Master.remove_new_ship(ship_id);
					console.debug("SHIP", ship_id, "has expired from update list");
					masterChanged = true;
				}else{
					self.newShips.push( KC3Master.ship(ship_id) );
				}
			});
			
			$.each(KC3Master.new_slotitems(), function(item_id, item_time){
				console.debug("Testing item time", timeNow, item_time, "diff=", timeNow-item_time);
				if(timeNow-item_time > 7*24*60*60*1000){
					KC3Master.remove_new_slotitem(item_id);
					console.debug("ITEM", item_id, "has expired from update list");
					masterChanged = true;
				}else{
					self.newGears.push( KC3Master.slotitem(item_id) );
				}
			});
			
			if(masterChanged){
				console.debug("master changed, saving..");
				KC3Master.save();
			}
			
			console.debug("New ships and gears", this.newShips, this.newGears);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".tab_mstupdate .runtime_id").text(chrome.runtime.id);
			
			var shipBox, gearBox, shipFile, shipVersion, shipSrc, appendToBox;
			var self = this;
			var linkClickFunc = function(e){
				KC3StrategyTabs.gotoTab($(this).data("tab"), $(this).data("api_id"));
			};

			// New Ship list
			$.each(this.newShips, function(index, shipData){
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph(shipData.api_id).api_filename;
				shipVersion = KC3Master.graph(shipData.api_id).api_version[0];
				shipSrc = "../../../../assets/swf/card.swf?sip="+self.server_ip+"&shipFile="+shipFile;
				
				if (KC3Master.isSeasonalShip(shipData.api_id)) {
					// SEASONAL CG
					shipSrc += "&abyss=0&forceFrame=8";
					appendToBox = ".tab_mstupdate .mstseason";
				} else if (KC3Master.isAbyssalShip(shipData.api_id)) {
					// ABYSSALS
					shipSrc += "&abyss=1"+(!shipVersion?"":"&ver="+shipVersion);
					appendToBox = ".tab_mstupdate .mstabyss";
				} else {
					// NON-SEASONAL CG
					shipSrc += "&abyss=0"+(!shipVersion?"":"&ver="+shipVersion);
					appendToBox = ".tab_mstupdate .mstships";
				}
				
				shipSrc += !shipVersion ? "" : "&ver="+shipVersion;
				
				$(".ship_cg embed", shipBox).attr("src", shipSrc).attr("menu", "false");
				$(".ship_name", shipBox).text( KC3Meta.shipName( shipData.api_name ) );
				$(".ship_name", shipBox).data("tab", "mstship");
				$(".ship_name", shipBox).data("api_id", shipData.api_id);
				$(".ship_name", shipBox).click(linkClickFunc);
				
				shipBox.appendTo(appendToBox);
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstships");

			// New Equipment List
			$.each(this.newGears, function(index, GearData){
				gearBox = $(".tab_mstupdate .factory .mstgear").clone();
				
				if(!KC3Master.isAbyssalGear(GearData.api_id)){
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
