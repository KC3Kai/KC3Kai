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
			var MasterChanged = false;
			
			$.each(KC3Master._newShips, function(ship_id, ship_time){
				console.log("testing ship time", timeNow, ship_time, "diff=", timeNow-ship_time);
				if(timeNow-ship_time > 7*24*60*60*1000){
					delete KC3Master._newShips[ship_id];
					console.log("SHIP", ship_id, "has expired from update list");
					MasterChanged = true;
				}else{
					self.newShips.push( KC3Master.ship(ship_id) );
				}
			});
			
			$.each(KC3Master._newItems, function(item_id, item_time){
				console.log("testing item time", timeNow, item_time, "diff=", timeNow-item_time);
				if(timeNow-item_time > 7*24*60*60*1000){
					delete KC3Master._newItems[item_id];
					console.log("ITEM", item_id, "has expired from update list");
					MasterChanged = true;
				}else{
					self.newGears.push( KC3Master.slotitem(item_id) );
				}
			});
			
			if(MasterChanged){
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
			
			var shipBox, gearBox, shipFile;
			var self = this;

			// New Ship list
			$.each(this.newShips, function(index, ShipData){
				shipBox = $(".tab_mstupdate .factory .mstship").clone();
				shipFile = KC3Master.graph_id(ShipData.api_id);
				
				$(".ship_cg embed", shipBox).attr("src", "../../../../assets/swf/card.swf?sip="+self.server_ip+"&shipFile="+shipFile+"&abyss="+(ShipData.api_id>500?1:0));
				
				// $("a", shipBox).attr("href", "?#mstship-"+ShipData.api_id);
				
				$(".ship_name", shipBox).text( KC3Meta.shipName( ShipData.api_name ) );
				
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
				
				// $("a", gearBox).attr("href", "?#mstgear-"+GearData.api_id);
				
				$(".gear_name", gearBox).text( KC3Meta.gearName( GearData.api_name ) );
				
				gearBox.appendTo(".tab_mstupdate .mstgears");
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstupdate .mstgears");
			
		}
		
	};
	
})();
