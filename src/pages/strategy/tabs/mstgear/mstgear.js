(function(){
	"use strict";
	
	KC3StrategyTabs.mstgear = new KC3StrategyTab("mstgear");
	
	KC3StrategyTabs.mstgear.definition = {
		tabSelf: KC3StrategyTabs.mstgear,
		
		currentGearId: 0,
		gameServer: {},
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			this.gameServer = PlayerManager.hq.getServer();
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
			if(!KC3Master.available) { return; }
			
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
				if(!!ConfigManager.sr_dexmark && !KC3Master.isAbyssalGear(id)) {
					const isOwned = PictureBook.isEverOwnedGear(id);
					gearBox.toggleClass("unlocked", isOwned);
					gearBox.toggleClass("norecord", !isOwned);
				}
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
			const gearHost = `${this.gameServer.urlPrefix}/kcs2/resources`;
			const appendRscVer = (url) => (url && gearData.api_version ? url + `?version=${gearData.api_version}` : url);
			// see the same name in main.js to exclude loading some special types
			const EXCLUDE_RES = {
				"item_character": [42],
				"item_up": [496],
				"item_on": [],
			};
			// see the same name in main.js to include special item_up2 and item_on2
			const ADD_IMAGE_SLOTS = [525, 526];
			
			$(".tab_mstgear .gearInfo .gearAsset img").attr("src", "");
			if(!KC3Master.isAbyssalGear(gearId)) {
				$(".tab_mstgear .gearInfo .ga_1 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "card", "slot")));
				if(!EXCLUDE_RES.item_character.includes(gearId))
					$(".tab_mstgear .gearInfo .ga_2 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "item_character", "slot")));
				if(!EXCLUDE_RES.item_up.includes(gearId))
					$(".tab_mstgear .gearInfo .ga_3 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "item_up", "slot")));
				if(!EXCLUDE_RES.item_on.includes(gearId))
					$(".tab_mstgear .gearInfo .ga_4 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "item_on", "slot")));
				if(ADD_IMAGE_SLOTS.includes(gearId)) {
					$(".tab_mstgear .gearInfo .ga_5 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "item_up2", "slot")));
					$(".tab_mstgear .gearInfo .ga_6 img").attr("src", appendRscVer(gearHost + KC3Master.png_file(gearId, "item_on2", "slot")));
					$(".tab_mstgear .gearInfo .ga_5, .tab_mstgear .gearInfo .ga_6").show();
				} else {
					$(".tab_mstgear .gearInfo .ga_5, .tab_mstgear .gearInfo .ga_6").hide();
				}
				$(".tab_mstgear .gearInfo .gearAssets").show();
			} else {
				// Map a abyssal gear to player gear for itemup image,
				// see `SlotLoader.prototype.add` or `ResourceManager.prototype.getSlotitem`
				const replacedId = KC3Meta.abyssalItemupReplace[gearId];
				const mappedId = gearId - KC3Master.abyssalGearIdFrom,
					mappedGear = KC3Master.slotitem(mappedId);
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

			$(".tab_mstgear .gearInfo .rarity").html(
				'[{0}] <span class="stars"></span>'.format(gearData.api_rare)
			);
			// api_rare value not fully match with the stars on card image, at least 1 star for common rare
			for(let bctr = 0; bctr < Math.max(1, gearData.api_rare); bctr++) {
				$(".tab_mstgear .gearInfo .rarity span").append("&#10031;");
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
			
			$(".tab_mstgear .gearInfo .name").text(KC3Meta.gearName(gearData.api_name));
			$(".tab_mstgear .gearInfo .name_jp").text(
				"[{0}] {1}".format(gearId, gearData.api_name)
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
				["hk", "distance", "ShipGearEvadeAAFire"], // fake `distance` for almost planes
				["rk", "baku", "ShipGearAntiLand"],        // fake `baku` for all dive bombers
				["rm", "houm", "ShipGearHighAltitude"],    // fake `houm` for LB interceptors
				["dc", "tais", "ShipGearDepthCharge"],     // fake `tais` for Depth Charges
				["dp", "tais", "ShipGearDCProjector"],     // fake `tais` for Depth Charge Projectors
				["ap", "tais", "ShipGearSubArmorPen"],     // fake `tais` for ASW Armor Penetration
			], (index, sdata) => {
				if((gearData["api_"+sdata[1]]||0) !== 0 && (
					!planeOnlyStats.includes(sdata[0]) || (
						planeOnlyStats.includes(sdata[0]) &&
						(KC3GearManager.landBasedAircraftType3Ids.includes(gearData.api_type[3])
							|| gearData.api_cost !== undefined)
					)
				) && (
					sdata[0] !== "dc" || KC3GearManager.aswDepthChargeIds.includes(gearData.api_id)
				) && (
					sdata[0] !== "dp" || KC3GearManager.aswDepthChargeProjectorIds.includes(gearData.api_id)
				) && (
					sdata[0] !== "ap" || KC3GearManager.aswArmorPenetrationIds.includes(gearData.api_id)
				) && (
					sdata[0] !== "rk" || KC3GearManager.antiLandDiveBomberIds.includes(gearData.api_id)
				) && (
					sdata[0] !== "rm" || KC3GearManager.highAltitudeInterceptorIds.includes(gearData.api_id)
				) && (
					sdata[0] !== "hk" || KC3GearManager.evadeAntiAirFireIds.includes(gearData.api_id)
				)) {
					const isLandFighter = KC3GearManager.interceptorsType2Ids.includes(gearData.api_type[2]);
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
						const landSlot = KC3GearManager.getLandBaseSlotSize(gearData.api_type[2]);
						const deployCost = gearData["api_"+sdata[1]] * landSlot;
						$(".stat_value", statBox).text(
							"{0}(={1}x{2})".format(deployCost, gearData["api_"+sdata[1]], landSlot)
						);
						$(statBox).css("width", "130px");
					} else if(sdata[0] === "hk") { // For higher evasion from AA fire
						$(".stat_value", statBox).text(
							"x{0}/x{1}".format(KC3Meta.antiAirResistMods(gearData.api_id))
						);
						$(statBox).css("width", "100px");
					// For dive bomber who can anti-land, or LB interceptors who can intercept High Altitude air-raid, or asw gears
					} else if(["rk","rm", "dc", "dp", "ap"].includes(sdata[0])) {
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
				const orderByRemodel = (a, b) => (
					RemodelDb.originOf(a) - RemodelDb.originOf(b)
					|| RemodelDb.remodelGroup(a).indexOf(a) - RemodelDb.remodelGroup(b).indexOf(b)
					|| a - b
				);
				const addEquipShips = (shipIdArr, appendTo, isIncapable = false) => {
					if(!Array.isArray(shipIdArr) || !shipIdArr.length) return;
					shipIdArr.sort(orderByRemodel).forEach(shipId => {
						const shipBox = $("<div class='shipiconbox'><img/></div>").appendTo(appendTo);
						shipBox.attr("masterId", shipId).toggleClass("incapable", isIncapable);
						const shipMst = KC3Master.ship(shipId);
						$("img", shipBox).attr("src", KC3Meta.shipIcon(shipId, undefined, false))
							.attr("alt", shipId).addClass("hover").click(shipClickFunc)
							.attr("title", "[{0}] {1} {2}".format(shipId,
								KC3Meta.shipName(shipMst.api_id),
								KC3Meta.stype(shipMst.api_stype)
							)).lazyInitTooltip();
					});
				};
				const addEquipStypes = (stypeIdArr, appendTo, capable = true) => {
					if(!Array.isArray(stypeIdArr) || !stypeIdArr.length) return;
					const stypesBox = $("<div class='stype'></div>").appendTo(appendTo);
					stypeIdArr.forEach(stype => {
						const stypeBox = $("<div></div>").appendTo(stypesBox);
						stypeBox.attr("stype", stype).toggleClass("capable", capable).text(
							KC3Meta.stype(stype)
						);
					});
				};
				addEquipShips(equipOn.includes, ".tab_mstgear .gearInfo .equippable .ships");
				addEquipShips(equipOn.excludes, ".tab_mstgear .gearInfo .equippable .ships", true);
				const exslotCapableShips = !Array.isArray(equipOn.exslotIncludes) ? [] :
					equipOn.exslotIncludes.filter(id => KC3Master.equip_on_ship(id, gearId) & 2);
				const hasExslotCapableShips = exslotCapableShips.length > 0;
				const hasExslotCapableStypes = Array.isArray(equipOn.exslotStypes) && equipOn.exslotStypes.length > 0;
				const reIcon = $('<div class="reicon"><img src="/assets/img/useitems/64.png" /></div>');
				reIcon.toggleClass("incapable", !equipOn.exslot)
					.toggle(equipOn.exslot || hasExslotCapableShips || hasExslotCapableStypes)
					.attr("title", "[Lighted] Capable on ex-slot of ships or types above\n[Greyed] Capable on ex-slot of following ships or types")
					.lazyInitTooltip()
					.appendTo(".tab_mstgear .gearInfo .equippable .exslot");
				if(equipOn.exslotMinStars > 0) reIcon.append($('<div class="star">').text(
					"\u2605{0}".format(equipOn.exslotMinStars >= 10 ? "m" : equipOn.exslotMinStars)
				));
				addEquipShips(exslotCapableShips, ".tab_mstgear .gearInfo .equippable .exslot");
				if(hasExslotCapableStypes) addEquipStypes(equipOn.exslotStypes, ".tab_mstgear .gearInfo .equippable .exslot");
			}
			
		}
		
	};
	
})();
