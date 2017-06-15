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
			const remodelForms = RemodelDb.remodelGroup(shipObj.masterId);
			mappedObj.materials = [];
			for(let masterId of remodelForms) {
				const remodelInfo = RemodelDb.remodelInfo(masterId);
				if(remodelInfo) {
					if(remodelInfo.blueprint) {
						mappedObj.materials.push({
							icon: 58,
							info: remodelInfo
						});
					}
					if(remodelInfo.catapult) {
						mappedObj.materials.push({
							icon: 65,
							info: remodelInfo
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
				const remodelIds = RemodelDb.remodelGroup(ship.masterId);
				$("<span></span>")
					.text(KC3Meta.useItemName(material.icon))
					.toggleClass("used",
						remodelIds.indexOf(ship.masterId) >= remodelIds.indexOf(material.info.ship_id_to)
					).appendTo(iconDiv);
				iconDiv.attr("title", this.buildMaterialTooltip(material.info));
				$(".need_materials", shipRow).append(iconDiv);
			}
		}

		showTotalMaterials(event, { shipList }) {
			const totalDiv = $(".tab_blueprints .total .total_items").empty();
			let totalItemDiv = $("<div />").addClass("total_item").appendTo(totalDiv);
			$("<img />")
				.attr("src", "../../assets/img/client/ship.png")
				.appendTo(totalItemDiv);
			$("<span></span>")
				.text("x{0}".format(shipList.length))
				.appendTo(totalItemDiv);
			
			// Count total remodel materials
			const materialCount = {};
			[].concat(...shipList.map(ship => ship.materials.map(
				m => new Array(m.icon === 58 ? m.info.blueprint :
								m.icon === 65 ? m.info.catapult :
								1).fill(m.icon)
				))).map(icon => {
					materialCount[icon] = materialCount[icon] || 0;
					materialCount[icon] += 1;
				});
			for(let icon in materialCount) {
				let totalItemDiv = $("<div />").addClass("total_item").appendTo(totalDiv);
				$("<img />")
					.attr("src", "../../assets/img/useitems/" + icon + ".png")
					.appendTo(totalItemDiv);
				$("<span></span>")
					.text("x{0}".format(materialCount[icon]))
					.appendTo(totalItemDiv);
			}
			totalDiv.parent().show();
		}

		buildMaterialTooltip(remodelInfo) {
			let title = $("<div />");
			// Ship icons from to
			let line = $("<div />");
			$("<img />")
				.attr("src", KC3Meta.shipIcon(remodelInfo.ship_id_from))
				.width(18).height(18)
				.appendTo(line);
			$("<span></span>")
				.text(" Lv {0} \u2bc8\u2bc8 ".format(remodelInfo.level))
				.appendTo(line);
			$("<img />")
				.attr("src", KC3Meta.shipIcon(remodelInfo.ship_id_to))
				.width(18).height(18)
				.appendTo(line);
			title.append(line);
			
			// Consumption of ammo and steel
			line = $("<div />");
			$("<img />")
				.attr("src", "../../assets/img/client/ammo.png")
				.width(15).height(15).css("margin-right", 2)
				.appendTo(line);
			$("<span></span>").css("margin-right", 10)
				.text(remodelInfo.ammo)
				.appendTo(line);
			$("<img />")
				.attr("src", "../../assets/img/client/steel.png")
				.width(15).height(15).css("margin-right", 2)
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
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.blueprint)
					.appendTo(line);
			}
			if(remodelInfo.catapult) {
				$("<img />")
					.attr("src", "../../assets/img/useitems/65.png")
					.width(15).height(15).css("margin-right", 2)
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
					.appendTo(line);
				$("<span></span>").css("margin-right", 10)
					.text(remodelInfo.devmat)
					.appendTo(line);
			}
			if(remodelInfo.torch) {
				$("<img />")
					.attr("src", "../../assets/img/client/ibuild.png")
					.width(15).height(15).css("margin-right", 2)
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
