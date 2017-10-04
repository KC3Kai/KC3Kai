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
				$(".gearIcon img", gearBox).attr("src", "../../../../assets/img/items/"+GearData.api_type[3]+".png")
					.error(function() { $(this).unbind("error").attr("src", "../../assets/img/ui/empty.png"); });
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
			console.debug("Viewing gearData", gearData);
			self.currentGearId = gear_id;
			
			if(!KC3Master.isAbyssalGear(gear_id)){
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
			
			var gearTypesBox = $(".tab_mstgear .gearInfo .types");
			gearTypesBox.text("{0} {3:type2} \u21da {2:type1} \u21da {1:type0}".format(
				JSON.stringify(gearData.api_type),
				KC3Meta.gearTypeName(0, gearData.api_type[0]),
				KC3Meta.gearTypeName(1, gearData.api_type[1]),
				KC3Meta.gearTypeName(2, gearData.api_type[2]).replace("?", "") ||
					KC3Master.slotitem_equiptype(gearData.api_type[2]).api_name
			)).lazyInitTooltip();
			setTimeout(() => {
				if(KC3StrategyTabs.isTextEllipsis(gearTypesBox)){
					gearTypesBox.attr("title", gearTypesBox.text());
				} else {
					gearTypesBox.attr("title", "");
				}
			}, 0);

			$(".tab_mstgear .gearInfo .rarity").empty();
			for(var bctr=0; bctr<gearData.api_rare; bctr++){
				$(".tab_mstgear .gearInfo .rarity").append("&#10031;");
			}
			if(gearData.api_rare===0){
				$(".tab_mstgear .gearInfo .rarity").append("&#10031;");
			}
			if(!KC3Master.isAbyssalGear(gear_id) && gearData.api_broken.length >= 4){
				$(".tab_mstgear .gearInfo .scrap .fuel span").text(gearData.api_broken[0]);
				$(".tab_mstgear .gearInfo .scrap .ammo span").text(gearData.api_broken[1]);
				$(".tab_mstgear .gearInfo .scrap .steel span").text(gearData.api_broken[2]);
				$(".tab_mstgear .gearInfo .scrap .bauxite span").text(gearData.api_broken[3]);
				$(".tab_mstgear .gearInfo .scrap").show();
			} else {
				$(".tab_mstgear .gearInfo .scrap").hide();
			}
			
			$(".tab_mstgear .gearInfo .name").text( "[{0}] {1}".format(
				gear_id, KC3Meta.gearName(gearData.api_name)) );
			$(".tab_mstgear .gearInfo .intro").html( gearData.api_info );
			
			// Stats
			var statBox;
			$(".tab_mstgear .gearInfo .stats").empty();
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
				["or", "distance"],
				["kk", "cost"],
			], function(index, sdata){
				if((gearData["api_"+sdata[1]]||0) !== 0
					&& (["or","kk"].indexOf(sdata[0]) < 0
					|| (["or","kk"].indexOf(sdata[0]) >=0 &&
						KC3GearManager.landBasedAircraftType3Ids.indexOf(gearData.api_type[3])>-1) )
				){
					statBox = $(".tab_mstgear .factory .stat").clone();
					$("img", statBox).attr("src", "../../../../assets/img/stats/"+sdata[0]+".png");
					if(sdata[0]==="rn"){ // For range length
						$(".stat_value", statBox).text( [
							"?", "S", "M", "L", "VL", "XL"
						][gearData["api_"+sdata[1]]] || "?" );
					}else if(sdata[0]==="sp"){ // For speed, but not found in gears
						$(".stat_value", statBox).text( ({
							"0":"L", "5":"S", "10":"F", "15":"F+", "20":"F++"
						})[gearData["api_"+sdata[1]]] || "?");
					}else if(sdata[0]==="kk"){ // For bauxite cost when deploy to LBAS
						var landSlot = KC3GearManager.landBaseReconnType2Ids.indexOf(gearData.api_type[2])>-1 ?
							KC3GearManager.landBaseReconnMaxSlot : KC3GearManager.landBaseOtherMaxSlot;
						var deployCost = gearData["api_"+sdata[1]] * landSlot;
						$(".stat_value", statBox).text( "{0}(={1}x{2})".format(deployCost, gearData["api_"+sdata[1]], landSlot) );
						$(statBox).css("width", "130px");
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
