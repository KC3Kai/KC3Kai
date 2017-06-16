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
			this.defineSimpleSorter("materials", "Consumptions",
				(ship) => -ship.materials.length);
			this.defineSimpleFilter("materials", [], 0, (index, ship) => ship.materials.length);
			this.showListRowCallback = this.showRemodelMaterials;
			this.heartLockMode = 2;
		}

		/* RELOAD
		Loads latest player or game data if needed.
		---------------------------------*/
		reload() {
			PlayerManager.loadConsumables();
			KC3ShipManager.load();
			this.prepareShipList(true, this.mapRemodelMaterials);
		}

		/* EXECUTE
		Places data onto the interface from scratch.
		---------------------------------*/
		execute() {
			this.shipListDiv = $(".tab_blueprints .ship_list");
			this.shipRowTemplateDiv = $(".tab_blueprints .factory .ship_item");
			this.registerShipListHeaderEvent(
				$(".tab_blueprints .ship_header .ship_field.hover")
			);
			this.shipListDiv.on("onshow", this.showTotalMaterials);
			this.showListGrid();
		}

		mapRemodelMaterials(shipObj) {
			const mappedObj = this.defaultShipDataMapping(shipObj);
			const remodelForms = RemodelDb.remodelGroup(mappedObj.masterId);
			mappedObj.materials = [];
			for(let masterId of remodelForms) {
				const remodelInfo = RemodelDb.remodelInfo(masterId);
				if(remodelInfo) {
					// Check and mark possibly used material
					const isUsed = remodelForms.indexOf(mappedObj.masterId)
						>= remodelForms.indexOf(remodelInfo.ship_id_to);
					// Current remodel info support these materials
					if(remodelInfo.blueprint) {
						mappedObj.materials.push({
							icon: 58,
							info: remodelInfo,
							used: isUsed
						});
					}
					if(remodelInfo.catapult) {
						mappedObj.materials.push({
							icon: 65,
							info: remodelInfo,
							used: isUsed
						});
					}
				}
			}
			return mappedObj;
		}

		showRemodelMaterials(ship, shipRow) {
			for(let material of ship.materials) {
				const iconDiv = $("<div />")
					.addClass("ship_field materialIcon");
				$("<img />")
					.attr("src", "../../assets/img/useitems/" + material.icon + ".png")
					.appendTo(iconDiv);
				$("<span></span>")
					.text(KC3Meta.useItemName(material.icon))
					.toggleClass("used", material.used).appendTo(iconDiv);
				iconDiv.attr("title", this.buildMaterialTooltip(material.info));
				$(".need_materials", shipRow).append(iconDiv);
			}
		}

		showTotalMaterials(event, { shipList }) {
			const totalDiv = $(".tab_blueprints .total .total_items").empty();
			const ownedDiv = $(".tab_blueprints .owned .owned_items").empty();
			
			let totalItemDiv = $("<div />").addClass("total_item").appendTo(totalDiv);
			$("<img />")
				.attr("src", "../../assets/img/client/ship.png")
				.appendTo(totalItemDiv);
			$("<span></span>")
				.text("x{0}".format(shipList.length))
				.appendTo(totalItemDiv);
			
			// Count total and used remodel materials
			const countMaterials = (resultMap = ({}), filter = (m => true)) => {
				[].concat(...shipList.map(ship => ship.materials
					.filter(filter).map(
					m => new Array(m.icon === 58 ? m.info.blueprint :
									m.icon === 65 ? m.info.catapult :
									1).fill(m.icon)
				))).map(icon => {
					resultMap[icon] = resultMap[icon] || 0;
					resultMap[icon] += 1;
				});
				return resultMap;
			};
			const materialCount = countMaterials();
			const usedCount = countMaterials({}, (m => m.used));
			
			// Show total results and owned materials
			const appendOwnedItem = (iconImg, count) => {
				const ownedItemDiv = $("<div />")
					.addClass("owned_item").appendTo(ownedDiv);
				iconImg.clone().appendTo(ownedItemDiv);
				$("<span></span>")
					.text("x{0}".format(count || 0))
					.appendTo(ownedItemDiv);
			};
			for(let icon in materialCount) {
				const totalItemDiv = $("<div />").addClass("total_item").appendTo(totalDiv);
				const iconImg = $("<img />")
					.attr("src", "../../assets/img/useitems/" + icon + ".png")
					.appendTo(totalItemDiv);
				$("<span></span>")
					.text("x{0}/{1}".format(
						materialCount[icon] - (usedCount[icon] || 0),
						materialCount[icon]
					)).appendTo(totalItemDiv);
				switch(Number(icon)) {
					case 58:
						appendOwnedItem(iconImg, PlayerManager.consumables.blueprints);
						break;
					case 65:
						appendOwnedItem(iconImg, PlayerManager.consumables.protoCatapult);
						break;
				}
			}
			totalDiv.parent().show();
			ownedDiv.parent().show();
		}

		buildMaterialTooltip(remodelInfo) {
			let title = $("<div />");
			// Ship icons from to
			let line = $("<div />");
			$("<img />")
				.attr("src", KC3Meta.shipIcon(remodelInfo.ship_id_from))
				.width(18).height(18).css("vertical-align", "top")
				.appendTo(line);
			$("<span></span>")
				.text(" Lv {0} \u2bc8\u2bc8 ".format(remodelInfo.level))
				.appendTo(line);
			$("<img />")
				.attr("src", KC3Meta.shipIcon(remodelInfo.ship_id_to))
				.width(18).height(18).css("vertical-align", "top")
				.appendTo(line);
			title.append(line);
			
			// Consumption of ammo and steel
			line = $("<div />");
			$("<img />")
				.attr("src", "../../assets/img/client/ammo.png")
				.width(15).height(15).css("margin-right", 2)
				.css("vertical-align", "top")
				.appendTo(line);
			$("<span></span>").css("margin-right", 10)
				.text(remodelInfo.ammo)
				.appendTo(line);
			$("<img />")
				.attr("src", "../../assets/img/client/steel.png")
				.width(15).height(15).css("margin-right", 2)
				.css("vertical-align", "top")
				.appendTo(line);
			$("<span></span>").css("margin-right", 2)
				.text(remodelInfo.steel)
				.appendTo(line);
			title.append(line);
			
			// Blueprints or catapults
			line = $("<div />");
			if(remodelInfo.blueprint) {
				$("<img />")
					.attr("src", "../../assets/img/useitems/58.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.blueprint)
					.appendTo(line);
			}
			if(remodelInfo.catapult) {
				$("<img />")
					.attr("src", "../../assets/img/useitems/65.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 2)
					.text(remodelInfo.catapult)
					.appendTo(line);
			}
			title.append(line);
			
			// Consumption of devmats or torch
			line = $("<div />");
			if(remodelInfo.devmat) {
				$("<img />")
					.attr("src", "../../assets/img/client/devmat.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.devmat)
					.appendTo(line);
			}
			if(remodelInfo.torch) {
				$("<img />")
					.attr("src", "../../assets/img/client/ibuild.png")
					.width(15).height(15).css("margin-right", 2)
					.css("vertical-align", "top")
					.appendTo(line);
				$("<span></span>").css("margin-right", 2)
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
