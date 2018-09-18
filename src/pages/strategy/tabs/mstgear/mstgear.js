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
			const self = this;
			
			// List all equipment
			const iconFailsafeHandler = function(e) {
				$(this).unbind("error").attr("src", "/assets/img/ui/empty.png");
			};
			$.each(KC3Master.all_slotitems(), function(index, gearData){
				if(!gearData) { return true; }
				const id = gearData.api_id,
					iconType = gearData.api_type[3],
					gearName = KC3Meta.gearName(gearData.api_name);
				const gearBox = $(".tab_mstgear .factory .gearRecord")
					.clone().appendTo(".tab_mstgear .gearRecords");
				gearBox.attr("data-id", id);
				$(".gearIcon img", gearBox).attr("src", KC3Meta.itemIcon(iconType)).error(iconFailsafeHandler);
				$(".gearName", gearBox).text(`[${id}] ${gearName}`).attr("title", gearName);
			});
			$(".tab_mstgear .gearRecords").createChildrenTooltips();
			
			// Select equipment
			$(".tab_mstgear .gearRecords .gearRecord").on("click", function(){
				var gid = $(this).data("id");
				if( gid != self.currentGearId ){
					KC3StrategyTabs.gotoTab(null, gid);
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
			const self = this;
			const gearData = KC3Master.slotitem( gear_id );
			console.debug("Viewing gearData", gearData);
			self.currentGearId = gear_id;
			
			if(!KC3Master.isAbyssalGear(gear_id)){
				const gearHost = `http://${this.server_ip}/kcs2/resources`;
				$(".tab_mstgear .gearInfo .gearAsset img").attr("src", "");
				$(".tab_mstgear .gearInfo .ga_1 img").attr("src", gearHost + KC3Master.png_file(gear_id, "card", "slot"));
				$(".tab_mstgear .gearInfo .ga_2 img").attr("src", gearHost + KC3Master.png_file(gear_id, "item_character", "slot"));
				$(".tab_mstgear .gearInfo .ga_3 img").attr("src", gearHost + KC3Master.png_file(gear_id, "item_up", "slot"));
				$(".tab_mstgear .gearInfo .ga_4 img").attr("src", gearHost + KC3Master.png_file(gear_id, "item_on", "slot"));
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
			var planeOnlyStats = ["or", "kk"];
			$(".tab_mstgear .gearInfo .stats").empty();
			$.each([
				["hp", "taik", "ShipHp"],
				["fp", "houg", "ShipFire"],
				["ar", "souk", "ShipArmor"],
				["tp", "raig", "ShipTorpedo"],
				["sp", "soku", "ShipSpeed"],
				["dv", "baku", "ShipBombing"],
				["aa", "tyku", "ShipAntiAir"],
				["as", "tais", "ShipAsw"],
				["ht", "houm", "ShipAccuracy", "ib", "ShipAccAntiBomber"],
				["ev", "houk", "ShipEvasion", "if", "ShipEvaInterception"],
				["ls", "saku", "ShipLos"],
				["rn", "leng", "ShipLength"],
				["or", "distance", "ShipRadius"],
				["kk", "cost", "ShipDeployCost"],
			], function(index, sdata){
				if((gearData["api_"+sdata[1]]||0) !== 0 && (
					!planeOnlyStats.includes(sdata[0]) || (
						planeOnlyStats.includes(sdata[0]) &&
						KC3GearManager.landBasedAircraftType3Ids.includes(gearData.api_type[3])
					)
				)) {
					var isLandFighter = gearData.api_type[2] === 48;
					statBox = $(".tab_mstgear .factory .stat").clone();
					$("img", statBox)
						.attr("src", KC3Meta.statIcon(sdata[
							sdata.length > 3 && isLandFighter ? 3 : 0
						])).attr("title", KC3Meta.term(
							sdata[sdata.length > 4 && isLandFighter ? 4 : 2]) || "")
						.lazyInitTooltip();
					if(sdata[0]==="rn"){ // For range length
						$(".stat_value", statBox).text(
							KC3Meta.gearRange(gearData["api_"+sdata[1]])
						);
					}else if(sdata[0]==="kk"){ // For bauxite cost when deploy to LBAS
						var landSlot = KC3GearManager.landBaseReconnType2Ids.includes(gearData.api_type[2]) ?
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
			
			// Equippable ship types / ships
			$(".tab_mstgear .gearInfo .equippable > div").empty();
			const equipOn = KC3Master.equip_on(gear_id);
			if(!KC3Master.isAbyssalGear(gear_id) && Array.isArray(equipOn.stypes)) {
				$.each(KC3Meta.sortedStypes(), (_, stypeDef) => {
					if(stypeDef.id <= 0 || stypeDef.order === 999) return;
					const stypeBox = $("<div/>").appendTo(".tab_mstgear .gearInfo .equippable .stype");
					stypeBox.attr("stype", stypeDef.id).text(stypeDef.name);
					stypeBox.toggleClass("capable", equipOn.stypes.includes(stypeDef.id));
				});
				const addEquipShips = (shipIdArr, appendTo, isIncapable = false) => {
					if(!Array.isArray(shipIdArr)) return;
					const shipClickFunc = function(e) {
						KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
					};
					shipIdArr.forEach(shipId => {
						const shipBox = $("<div><img/></div>").appendTo(appendTo);
						shipBox.attr("masterId", shipId).toggleClass("incapable", isIncapable);
						const shipMst = KC3Master.ship(shipId);
						$("img", shipBox).attr("src", KC3Meta.shipIcon(shipId))
							.attr("alt", shipId).addClass("hover").click(shipClickFunc)
							.attr("title", "[{0}] {1} {2}".format(shipId,
								KC3Meta.shipName(shipMst.api_name),
								KC3Meta.stype(shipMst.api_stype)
							)).lazyInitTooltip();
					});
				};
				addEquipShips(equipOn.includes, ".tab_mstgear .gearInfo .equippable .ships");
				addEquipShips(equipOn.excludes, ".tab_mstgear .gearInfo .equippable .ships", true);
				// Improved Kanhon Type Turbine can be always equipped on exslot of capable ship types
				$('<div><img src="/assets/img/useitems/64.png" /></div>')
					.toggleClass("incapable", !equipOn.exslot && gear_id !== 33)
					.toggle(equipOn.exslot || gear_id === 33 || (equipOn.exslotIncludes && equipOn.exslotIncludes.length > 0))
					.attr("title", "Capable on ex-slot for ships/types above or following ships")
					.lazyInitTooltip()
					.appendTo(".tab_mstgear .gearInfo .equippable .exslot");
				addEquipShips(equipOn.exslotIncludes, ".tab_mstgear .gearInfo .equippable .exslot");
			}
			
		}
		
	};
	
})();
