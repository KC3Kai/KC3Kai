(function(){
	"use strict";
	
	KC3StrategyTabs.mstgear = new KC3StrategyTab("mstgear");
	
	KC3StrategyTabs.mstgear.definition = {
		tabSelf: KC3StrategyTabs.mstgear,
		
		currentGearId: 0,
		server_ip: "",
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
		},
		
		/* RELOAD
		Prepares latest in game data
		---------------------------------*/
		reload :function(){
			// None for gear library
		},
		
			/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			// List all equipment
			var gearBox;
			$.each(KC3Master.all_slotitems(), function(index, GearData){
				gearBox = $(".tab_mstgear .factory .gearRecord").clone();
				gearBox.attr("data-id", GearData.api_id);
				$(".gearIcon img", gearBox).attr("src", "../../../../assets/img/items/"+GearData.api_type[3]+".png" );
				$(".gearName", gearBox).text( "[" + GearData.api_id + "] " + KC3Meta.gearName(GearData.api_name) );
				gearBox.appendTo(".tab_mstgear .gearRecords");
			});
			
			// Select equipment
			$(".tab_mstgear .gearRecords .gearRecord").on("click", function(){
				var gid = $(this).data("id");
				if( gid != self.currentGearId ){
					KC3StrategyTabs.gotoTab(null, gid);
					//self.showGear( $(this).data("id") );
				}
			});
			
			// Default selected if not direct linked
			if(!!KC3StrategyTabs.pageParams[1]){
				this.showGear(KC3StrategyTabs.pageParams[1]);
			}else{
				this.showGear();
			}
			
			// Scroll list top to selected one
			setTimeout(function(){
				var listItem = $(".tab_mstgear .gearRecords .gearRecord[data-id={0}]".format(self.currentGearId));
				var scrollTop = listItem.length === 1 ? listItem.offset().top - $(".tab_mstgear .gearRecords").offset().top : 0;
				$(".tab_mstgear .gearRecords").scrollTop(scrollTop);
			}, 200);
		},
		
		/* UPDATE
		Partially update elements of the interface without clearing all contents first
		Be careful! Do NOT only update new data, but also handle the old states (do cleanup)
		---------------------------------*/
		update :function(pageParams){
			if(!!pageParams[1]){
				this.showGear(pageParams[1]);
			}else{
				this.showGear();
			}
			return true;
		},
		
		showGear :function(gear_id){
			gear_id = Number(gear_id||"124");
			var self = this;
			var gearData = KC3Master.slotitem( gear_id );
			console.debug("gearData", gearData);
			self.currentGearId = gear_id;
			
			if(gear_id<=500){
				var gearHost = "http://"+this.server_ip+"/kcs/resources/image/slotitem/";
				var paddedId = (gear_id<10?"00":gear_id<100?"0":"")+gear_id;
				$(".tab_mstgear .gearInfo .gearAsset img").attr("src", "");
				$(".tab_mstgear .gearInfo .ga_1 img").attr("src", gearHost+"card/"+paddedId+".png");
				$(".tab_mstgear .gearInfo .ga_2 img").attr("src", gearHost+"item_character/"+paddedId+".png");
				$(".tab_mstgear .gearInfo .ga_3 img").attr("src", gearHost+"item_up/"+paddedId+".png");
				$(".tab_mstgear .gearInfo .ga_4 img").attr("src", gearHost+"item_on/"+paddedId+".png");
				
				$(".tab_mstgear .gearInfo .gearAssets").show();
			}else{
				$(".tab_mstgear .gearInfo .gearAssets").hide();
			}
			
			$(".tab_mstgear .gearInfo .rarity").html("");
			for(var bctr=0; bctr<gearData.api_rare; bctr++){
				$(".tab_mstgear .gearInfo .rarity").append("&#10031;");
			}
			if(gearData.api_rare===0){
				$(".tab_mstgear .gearInfo .rarity").append("&#10031;");
			}
			
			$(".tab_mstgear .gearInfo .name").text( KC3Meta.gearName(gearData.api_name) );
			$(".tab_mstgear .gearInfo .intro").html( gearData.api_info );
			
			// Stats
			var statBox;
			$(".tab_mstgear .gearInfo .stats").html("");
			$.each([
				["hp", "taik"],
				["fp", "houg"],
				["ar", "souk"],
				["tp", "raig"],
				["sp", "soku"],
				["dv", "baku"],
				["aa", "tyku"],
				["as", "tais"],
				["ht", "houm"],
				["ev", "houk"],
				["ls", "saku"],
				["rn", "leng"],
			], function(index, sdata){
				if((gearData["api_"+sdata[1]]||0) > 0){
					statBox = $(".tab_mstgear .factory .stat").clone();
					$("img", statBox).attr("src", "../../../../assets/img/stats/"+sdata[0]+".png");
					if(sdata[0]=="rn"){
						$(".stat_value", statBox).text( [
							"", "S", "M", "L", "VL"
						][gearData["api_"+sdata[1]]] );
					}else if(sdata[0]=="sp"){
						$(".stat_value", statBox).text( gearData["api_"+sdata[1]]==10?"F":"S" );
					}else{
						$(".stat_value", statBox).text( gearData["api_"+sdata[1]] );
					}
					
					statBox.appendTo(".tab_mstgear .gearInfo .stats");
				}
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstgear .gearInfo .stats");
			
		}
		
	};
	
})();
