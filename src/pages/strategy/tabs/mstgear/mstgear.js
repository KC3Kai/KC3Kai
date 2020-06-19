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
		
		showGear :function(gearId){
			gearId = Number(gearId || "124");
			const self = this;
			const gearData = KC3Master.slotitem(gearId);
			console.debug("Viewing gearData", gearData);
			self.currentGearId = gearId;
			const gearHost = `http://${this.server_ip}/kcs2/resources`;
			const appendRscVer = (url) => (url && gearData.api_version ? url + `?version=${gearData.api_version}` : url);
			
			$(".tab_mstgear .gearInfo .gearAsset img").attr("src", "");
			if(!KC3Master.isAbyssalGear(gearId)) {
				$(".tab_mstgear .gearInfo .ga_1 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "card", "slot")));
				$(".tab_mstgear .gearInfo .ga_2 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "item_character", "slot")));
				$(".tab_mstgear .gearInfo .ga_3 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "item_up", "slot")));
				$(".tab_mstgear .gearInfo .ga_4 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "item_on", "slot")));
				$(".tab_mstgear .gearInfo .gearAssets").show();
			} else {
				// Map a abyssal gear to player gear for itemup image,
				// see `SlotLoader.prototype.add` or `ResourceManager.prototype.getSlotitem`
				const replacedId = KC3Meta.abyssalItemupReplace[gearId];
				const mappedId = gearId - 500, mappedGear = KC3Master.slotitem(mappedId);
				// Hide itemup image if category of mapped gear is different,
				// itemup is used on cut-in scene, so items never shown may not be mapped correctly
				if(replacedId || (mappedGear.api_type && mappedGear.api_type[0] === gearData.api_type[0])) {
					$(".tab_mstgear .gearInfo .ga_1 img").attr("src",
						appendRscVer(gearHost + KC3Master.png_file(replacedId || mappedId, "item_up", "slot")));
					$(".tab_mstgear .gearInfo .gearAssets").show();
				} else {
					$(".tab_mstgear .gearInfo .gearAssets").hide();
				}
			}
			
			const gearTypesBox = $(".tab_mstgear .gearInfo .types");
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
			for(let bctr = 0; bctr < gearData.api_rare; bctr++) {
				$(".tab_mstgear .gearInfo .rarity").append("&#10031;");
			}
			if(gearData.api_rare === 0){
				$(".tab_mstgear .gearInfo .rarity").append("&#10031;");
			}
			if(!KC3Master.isAbyssalGear(gearId) && gearData.api_broken.length >= 4) {
				$(".tab_mstgear .gearInfo .scrap .fuel span").text(gearData.api_broken[0]);
				$(".tab_mstgear .gearInfo .scrap .ammo span").text(gearData.api_broken[1]);
				$(".tab_mstgear .gearInfo .scrap .steel span").text(gearData.api_broken[2]);
				$(".tab_mstgear .gearInfo .scrap .bauxite span").text(gearData.api_broken[3]);
				$(".tab_mstgear .gearInfo .scrap").show();
			} else {
				$(".tab_mstgear .gearInfo .scrap").hide();
			}
			
			$(".tab_mstgear .gearInfo .name").text(
				"[{0}] {1}".format(gearId, KC3Meta.gearName(gearData.api_name))
			);
			// Devs removed this property from master since 2019-06-25
			// Picture book API will return it for those unlocked items only
			$(".tab_mstgear .gearInfo .intro").html(gearData.api_info || "");
			
			// Stats
			const planeOnlyStats = ["or", "kk"];
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
				["rk", "baku", "ShipGearAntiLand"],
			], (index, sdata) => {
				if((gearData["api_"+sdata[1]]||0) !== 0 && (
					!planeOnlyStats.includes(sdata[0]) || (
						planeOnlyStats.includes(sdata[0]) &&
						KC3GearManager.landBasedAircraftType3Ids.includes(gearData.api_type[3])
					)) && (
					sdata[0] !== "rk" || KC3GearManager.antiLandDiveBomberIds.includes(gearData.api_id)
				)) {
					const isLandFighter = gearData.api_type[2] === 48;
					const statBox = $(".tab_mstgear .factory .stat").clone()
						.appendTo(".tab_mstgear .gearInfo .stats");
					$("img", statBox)
						.attr("src", KC3Meta.statIcon(sdata[
							sdata.length > 3 && isLandFighter ? 3 : 0
						])).attr("title", KC3Meta.term(
							sdata[sdata.length > 4 && isLandFighter ? 4 : 2]) || "")
						.lazyInitTooltip();
					if(sdata[0] === "rn") { // For range length
						$(".stat_value", statBox).text(
							KC3Meta.gearRange(gearData["api_"+sdata[1]])
						);
					} else if(sdata[0] === "kk") { // For bauxite cost when deploy to LBAS
						const landSlot = KC3GearManager.landBaseReconnType2Ids.includes(gearData.api_type[2]) ?
							KC3GearManager.landBaseReconnMaxSlot : KC3GearManager.landBaseOtherMaxSlot;
						const deployCost = gearData["api_"+sdata[1]] * landSlot;
						$(".stat_value", statBox).text(
							"{0}(={1}x{2})".format(deployCost, gearData["api_"+sdata[1]], landSlot)
						);
						$(statBox).css("width", "130px");
					} else if(sdata[0] === "rk") { // For dive bomber who can anti-land
						$(".stat_value", statBox).text("");
					} else {
						$(".stat_value", statBox).text(gearData["api_"+sdata[1]]);
					}
				}
			});
			$("<div/>").addClass("clear").appendTo(".tab_mstgear .gearInfo .stats");
			
			// Equippable ship types / ships
			$(".tab_mstgear .gearInfo .equippable > div").empty();
			const equipOn = KC3Master.equip_on(gearId);
			if(!KC3Master.isAbyssalGear(gearId) && Array.isArray(equipOn.stypes)) {
				$.each(KC3Meta.sortedStypes(), (_, stypeDef) => {
					if(stypeDef.id <= 0 || stypeDef.order === 999) return;
					const stypeBox = $("<div/>").appendTo(".tab_mstgear .gearInfo .equippable .stype");
					stypeBox.attr("stype", stypeDef.id).text(stypeDef.name);
					stypeBox.toggleClass("capable", equipOn.stypes.includes(stypeDef.id));
				});
				const shipClickFunc = function(e) {
					KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
				};
				const addEquipShips = (shipIdArr, appendTo, isIncapable = false) => {
					if(!Array.isArray(shipIdArr)) return;
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
				const isTurbine = gearId === 33;
				const hasExslotCapableShips = Array.isArray(equipOn.exslotIncludes) && equipOn.exslotIncludes.length > 0;
				$('<div><img src="/assets/img/useitems/64.png" /></div>')
					.toggleClass("incapable", !(equipOn.exslot || isTurbine))
					.toggle(equipOn.exslot || isTurbine || hasExslotCapableShips)
					.attr("title", "[Lighted] Capable on ex-slot of ships or types above\n[Greyed] Capable on ex-slot of following ships")
					.lazyInitTooltip()
					.appendTo(".tab_mstgear .gearInfo .equippable .exslot");
				addEquipShips(equipOn.exslotIncludes, ".tab_mstgear .gearInfo .equippable .exslot");
			}
			
		}
		
	};
	
})();
