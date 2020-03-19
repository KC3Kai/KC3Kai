(function(){
	"use strict";

	class KC3BlueprintsDefinition extends KC3ShipListGrid {
		constructor() {
			super("blueprints");
		}

		/* INIT
		Prepares initial static data needed.
		---------------------------------*/
		init() {
			this.defaultSorterDefinitions();
			this.defineSorter("materials", "Consumptions",
				(ls, rs) => (rs.materials.length - rs.materialsUsed)
					- (ls.materials.length - ls.materialsUsed)
					|| rs.materials.length - ls.materials.length
					|| ls.id - rs.id);
			this.defineSimpleFilter("materials", [], 0, (fd, ship) => ship.materials.length);
			this.defineSimpleFilter("hideUnlock", [], 0, (fd, ship) => !fd.currentIndex || !!ship.locked);
			this.defineSimpleFilter("hideDupe", [], 0, (fd, ship) => {
				if(!fd.currentIndex) return true;
				const dupeShips = this.shipList.filter(s => (
					ship.id !== s.id && RemodelDb.originOf(ship.masterId) === RemodelDb.originOf(s.masterId)
				));
				if(!dupeShips.length) return true;
				const dupeRemodelLevels = dupeShips.map(s => RemodelDb.remodelGroup(s.masterId).indexOf(s.masterId));
				const thisRemodelLevel = RemodelDb.remodelGroup(ship.masterId).indexOf(ship.masterId);
				return thisRemodelLevel >= Math.max(...dupeRemodelLevels);
			});
			this.defineSimpleFilter("hideCompleted", [], 0, (fd, ship) => {
				if(!fd.currentIndex) return true;
				return ship.materials.filter(m => !m.used).length > 0;
			});
			this.showListRowCallback = this.showRemodelMaterials;
			this.heartLockMode = 2;
			this.viewType = "owned";
			this.hideUnlock = false;
			this.hideDupe = false;
			this.hideCompleted = false;
		}

		/* RELOAD
		Loads latest player or game data if needed.
		---------------------------------*/
		reload() {
			PlayerManager.loadConsumables();
			KC3ShipManager.load();
		}

		/* EXECUTE
		Places data onto the interface from scratch.
		---------------------------------*/
		execute() {
			const joinPageParams = () => (
				[this.viewType,
					this.hideUnlock ? "locked" : (this.hideDupe || this.hideCompleted) && "all",
					this.hideDupe ? "nodupe" : this.hideCompleted && "all",
					this.hideCompleted && "nocompleted"
				].filter(v => !!v)
			);
			$(".tab_blueprints .view_type input[type=radio][name=view_type]").on("change", (e) => {
				this.viewType = $(".view_type input[type=radio][name=view_type]:checked").val();
				KC3StrategyTabs.gotoTab(undefined, ...joinPageParams());
			});
			$(".tab_blueprints .view_type input[type=checkbox][name=hide_unlock]").on("change", (e) => {
				this.hideUnlock = $(".view_type input[type=checkbox][name=hide_unlock]").prop("checked");
				KC3StrategyTabs.gotoTab(undefined, ...joinPageParams());
			});
			$(".tab_blueprints .view_type input[type=checkbox][name=hide_dupe]").on("change", (e) => {
				this.hideDupe = $(".view_type input[type=checkbox][name=hide_dupe]").prop("checked");
				KC3StrategyTabs.gotoTab(undefined, ...joinPageParams());
			});
			$(".tab_blueprints .view_type input[type=checkbox][name=hide_completed]").on("change", (e) => {
				this.hideCompleted = $(".view_type input[type=checkbox][name=hide_completed]").prop("checked");
				KC3StrategyTabs.gotoTab(undefined, ...joinPageParams());
			});
			this.shipListDiv = $(".tab_blueprints .ship_list");
			this.shipRowTemplateDiv = $(".tab_blueprints .factory .ship_item");
			this.registerShipListHeaderEvent(
				$(".tab_blueprints .ship_header .ship_field.hover")
			);
			this.shipListDiv.on("preShow", () => {
				$(".tab_blueprints .total").hide();
				$(".tab_blueprints .owned").hide();
			});
			this.shipListDiv.on("postShow", this.showTotalMaterials);
			this.loadView(KC3StrategyTabs.pageParams[1],
				KC3StrategyTabs.pageParams[2] === "locked",
				KC3StrategyTabs.pageParams[3] === "nodupe",
				KC3StrategyTabs.pageParams[4] === "nocompleted"
			);
		}

		loadView(viewType = "owned", hideUnlock = false, hideDupe = false, hideCompleted = false) {
			this.viewType = viewType;
			this.hideUnlock = hideUnlock;
			this.hideDupe = hideDupe;
			this.hideCompleted = hideCompleted;
			$(".tab_blueprints .view_type input[type=radio][name=view_type][value={0}]"
				.format(this.viewType)).prop("checked", true);
			$(".tab_blueprints .view_type input[type=checkbox][name=hide_unlock]")
				.prop("checked", this.hideUnlock);
			$(".tab_blueprints .view_type input[type=checkbox][name=hide_dupe]")
				.prop("checked", this.hideDupe);
			$(".tab_blueprints .view_type input[type=checkbox][name=hide_completed]")
				.prop("checked", this.hideCompleted);
			switch(this.viewType) {
				case "owned":
					this.setSorter("lv");
					this.prepareShipList(true, this.mapRemodelMaterials);
					this.filterDefinitions.hideUnlock.currentIndex = this.hideUnlock & 1;
					this.filterDefinitions.hideDupe.currentIndex = this.hideDupe & 1;
					this.filterDefinitions.hideCompleted.currentIndex = this.hideCompleted & 1;
					break;
				case "all":
					this.setSorter("type");
					this.prepareShipListFromRemodelDb();
					this.filterDefinitions.hideUnlock.currentIndex = 0;
					this.filterDefinitions.hideDupe.currentIndex = 0;
					this.filterDefinitions.hideCompleted.currentIndex = 0;
					break;
				default:
					console.warn("Unsupported view type:", this.viewType);
					return;
			}
			this.showListGrid();
		}

		prepareShipListFromRemodelDb() {
			const allRemodelInfo = RemodelDb._db.remodelInfo;
			this.shipList.length = 0;
			Object.keys(allRemodelInfo).forEach(key => {
				const remodelInfo = allRemodelInfo[key];
				if(remodelInfo.blueprint || remodelInfo.catapult || remodelInfo.report
					|| remodelInfo.gunmat || remodelInfo.airmat) {
					const shipMaster = KC3Master.ship(remodelInfo.ship_id_from);
					const shipData = {
						id: remodelInfo.ship_id_from,
						masterId: remodelInfo.ship_id_from,
						stype: shipMaster.api_stype,
						ctype: shipMaster.api_ctype,
						sortno: shipMaster.api_sortno,
						sortId: shipMaster.api_sort_id,
						name: KC3Meta.shipName(shipMaster.api_name),
						level: remodelInfo.level,
						levelClass: "",
						locked: 1
					};
					const remodelFormIds = RemodelDb.remodelGroup(remodelInfo.ship_id_to);
					const ownedMasterId = KC3ShipManager.find(
						ship => remodelFormIds.indexOf(ship.masterId) >=
							remodelFormIds.indexOf(remodelInfo.ship_id_to)
					).length > 0 ? remodelInfo.ship_id_to : 0;
					this.attachRemodelMaterials(shipData, [shipData.masterId], ownedMasterId);
					this.shipList.push(shipData);
				}
			});
			return true;
		}

		mapRemodelMaterials(shipObj) {
			const mappedObj = this.defaultShipDataMapping(shipObj);
			this.attachRemodelMaterials(mappedObj,
				RemodelDb.remodelGroup(mappedObj.masterId));
			return mappedObj;
		}

		attachRemodelMaterials(mappedObj, remodelFormIds = [], ownedMasterId = 0) {
			const remodelGroup = RemodelDb.remodelGroup(mappedObj.masterId);
			mappedObj.materials = [];
			mappedObj.materialsUsed = 0;
			for(const masterId of remodelFormIds) {
				const remodelInfo = RemodelDb.remodelInfo(masterId);
				if(remodelInfo) {
					// Check and mark possibly used material
					const isUsed = remodelGroup.indexOf(ownedMasterId || mappedObj.masterId)
						>= remodelGroup.indexOf(remodelInfo.ship_id_to);
					// Current remodel info support these materials
					if(remodelInfo.blueprint) {
						mappedObj.materials.push({
							icon: 58,
							info: remodelInfo,
							used: isUsed
						});
						mappedObj.materialsUsed += isUsed;
					}
					if(remodelInfo.catapult) {
						mappedObj.materials.push({
							icon: 65,
							info: remodelInfo,
							used: isUsed
						});
						mappedObj.materialsUsed += isUsed;
					}
					if(remodelInfo.report) {
						mappedObj.materials.push({
							icon: 78,
							info: remodelInfo,
							used: isUsed
						});
						mappedObj.materialsUsed += isUsed;
					}
					if(remodelInfo.gunmat) {
						mappedObj.materials.push({
							icon: 75,
							info: remodelInfo,
							used: isUsed
						});
						mappedObj.materialsUsed += isUsed;
					}
					if(remodelInfo.airmat) {
						mappedObj.materials.push({
							icon: 77,
							info: remodelInfo,
							used: isUsed
						});
						mappedObj.materialsUsed += isUsed;
					}
				}
			}
			return mappedObj;
		}

		showRemodelMaterials(ship, shipRow) {
			let firstMaterial = null;
			for(const material of ship.materials) {
				firstMaterial = firstMaterial || material;
				const iconDiv = $("<div />")
					.addClass("ship_field icon")
					.toggleClass("limited", this.viewType === "all");
				$("<img />")
					.attr("src", "/assets/img/useitems/" + material.icon + ".png")
					.appendTo(iconDiv);
				$("<span></span>")
					.text(KC3Meta.useItemName(material.icon))
					.toggleClass("used", material.used).appendTo(iconDiv);
				iconDiv.attr("title", this.buildMaterialTooltip(material.info));
				$(".need_materials", shipRow).append(iconDiv);
			}
			if(this.viewType === "all" && firstMaterial) {
				const shipDiv = $("<div />")
					.addClass("ship_field icon")
					.toggleClass("limited", this.viewType === "all");
				$("<img />").attr("src", "/assets/img/ui/arrow.png")
					.appendTo(shipDiv);
				$("<img />")
					.attr("src", KC3Meta.shipIcon(firstMaterial.info.ship_id_to))
					.attr("alt", firstMaterial.info.ship_id_to)
					.click(this.shipClickFunc)
					.addClass("hover")
					.appendTo(shipDiv);
				$("<span></span>")
					.text(KC3Meta.shipName(
						KC3Master.ship(firstMaterial.info.ship_id_to).api_name
					)).appendTo(shipDiv);
				$(".need_materials", shipRow).append(shipDiv);
			}
		}

		showTotalMaterials(event, { shipList }) {
			const totalDiv = $(".tab_blueprints .total .total_items").empty();
			const ownedDiv = $(".tab_blueprints .owned .owned_items").empty();
			
			const totalItemDiv = $("<div />").addClass("summary_item").appendTo(totalDiv);
			$("<img />")
				.attr("src", "/assets/img/client/ship.png")
				.appendTo(totalItemDiv);
			$("<span></span>")
				.text("x{0}".format(shipList.length))
				.appendTo(totalItemDiv);
			if(!shipList.length) {
				totalDiv.parent().show();
				return;
			}
			
			// Count total and used remodel materials
			const countMaterials = (resultMap = ({}), filter = (m => true)) => {
				[].concat(...shipList.map(ship => ship.materials
					.filter(filter).map(
					m => new Array(m.icon === 58 ? m.info.blueprint :
									m.icon === 65 ? m.info.catapult :
									m.icon === 78 ? m.info.report :
									m.icon === 75 ? m.info.gunmat :
									m.icon === 77 ? m.info.airmat :
									1).fill(m.icon)
				))).map(iconArr => {
					const icon = iconArr[0];
					const count = iconArr.length;
					resultMap[icon] = resultMap[icon] || 0;
					resultMap[icon] += count;
				});
				return resultMap;
			};
			const materialCount = countMaterials();
			const usedCount = countMaterials({}, (m => m.used));
			
			// Show total results and owned materials
			const appendOwnedItem = (iconImg, count) => {
				const ownedItemDiv = $("<div />")
					.addClass("summary_item").appendTo(ownedDiv);
				iconImg.clone().appendTo(ownedItemDiv);
				$("<span></span>")
					.text("x{0}".format(count || 0))
					.appendTo(ownedItemDiv);
			};
			for(const icon in materialCount) {
				const totalItemDiv = $("<div />").addClass("summary_item").appendTo(totalDiv);
				const iconImg = $("<img />")
					.attr("src", "/assets/img/useitems/" + icon + ".png")
					.attr("title", KC3Meta.useItemName(icon))
					.appendTo(totalItemDiv);
				$("<span></span>")
					.text("x{0}/{1}".format(
						materialCount[icon] - (usedCount[icon] || 0),
						materialCount[icon]
					)).appendTo(totalItemDiv);
				switch(Number(icon)) {
					case 58:
						const medalIcon = iconImg.clone()
							.attr("src", "/assets/img/useitems/57.png")
							.attr("title", KC3Meta.useItemName(57));
						appendOwnedItem(medalIcon, PlayerManager.consumables.medals);
						appendOwnedItem(iconImg, PlayerManager.consumables.blueprints);
						break;
					case 65:
						appendOwnedItem(iconImg, PlayerManager.consumables.protoCatapult);
						break;
					case 75:
						appendOwnedItem(iconImg, PlayerManager.consumables.newArtilleryMaterial);
						break;
					case 77:
						appendOwnedItem(iconImg, PlayerManager.consumables.newAviationMaterial);
						break;
					case 78:
						appendOwnedItem(iconImg, PlayerManager.consumables.actionReport);
						break;
				}
			}
			totalDiv.parent().show();
			ownedDiv.parent().show();
		}

		buildMaterialTooltip(remodelInfo) {
			const title = $("<div />");
			// Ship icon and name from prev to next remodel
			let line = $("<div />");
			$("<img />")
				.attr("src", KC3Meta.shipIcon(remodelInfo.ship_id_from))
				.width(18).height(18).css("margin-right", 2)
				.css("vertical-align", "bottom")
				.css("object-fit", "cover")
				.appendTo(line);
			$("<span></span>").text(
				KC3Meta.shipName(KC3Master.ship(remodelInfo.ship_id_from).api_name)
			).appendTo(line);
			$("<img />").attr("src", "/assets/img/ui/arrow.png")
				.css("vertical-align", "text-top")
				.css("margin", "0px 5px 0px 5px")
				.appendTo(line);
			$("<img />")
				.attr("src", KC3Meta.shipIcon(remodelInfo.ship_id_to))
				.width(18).height(18).css("margin-right", 2)
				.css("vertical-align", "bottom")
				.css("object-fit", "cover")
				.appendTo(line);
			$("<span></span>").text(
				KC3Meta.shipName(KC3Master.ship(remodelInfo.ship_id_to).api_name)
			).appendTo(line);
			title.append(line);
			
			// Level and consumption of ammo and steel
			line = $("<div />");
			$("<span></span>").css("margin-right", 10)
				.text("{0} {1}".format(KC3Meta.term("LevelShort"), remodelInfo.level))
				.appendTo(line);
			$("<img />")
				.attr("src", "/assets/img/client/ammo.png")
				.width(15).height(15).css("margin-right", 2)
				.css("vertical-align", "top")
				.appendTo(line);
			$("<span></span>").css("margin-right", 10)
				.text(remodelInfo.ammo)
				.appendTo(line);
			$("<img />")
				.attr("src", "/assets/img/client/steel.png")
				.width(15).height(15).css("margin-right", 2)
				.css("vertical-align", "top")
				.appendTo(line);
			$("<span></span>").css("margin-right", 10)
				.text(remodelInfo.steel)
				.appendTo(line);
			title.append(line);
			
			// Blueprints, catapults, devmats and torches
			line = $("<div />");
			if(remodelInfo.blueprint) {
				$("<img />")
					.attr("src", "/assets/img/useitems/58.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.blueprint)
					.appendTo(line);
			}
			if(remodelInfo.catapult) {
				$("<img />")
					.attr("src", "/assets/img/useitems/65.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.catapult)
					.appendTo(line);
			}
			if(remodelInfo.report) {
				$("<img />")
					.attr("src", "/assets/img/useitems/78.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.report)
					.appendTo(line);
			}
			if(remodelInfo.gunmat) {
				$("<img />")
					.attr("src", "/assets/img/useitems/75.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.gunmat)
					.appendTo(line);
			}
			if(remodelInfo.airmat) {
				$("<img />")
					.attr("src", "/assets/img/useitems/77.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.airmat)
					.appendTo(line);
			}
			if(remodelInfo.devmat) {
				$("<img />")
					.attr("src", "/assets/img/client/devmat.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.devmat)
					.appendTo(line);
			}
			if(remodelInfo.torch) {
				$("<img />")
					.attr("src", "/assets/img/client/ibuild.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.torch)
					.appendTo(line);
			}
			title.append(line);
			
			return title.prop("outerHTML");
		}

	}

	KC3StrategyTabs.blueprints = new KC3StrategyTab("blueprints");
	KC3StrategyTabs.blueprints.definition = new KC3BlueprintsDefinition();

})();
