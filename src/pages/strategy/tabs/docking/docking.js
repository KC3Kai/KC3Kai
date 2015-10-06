(function(){
	"use strict";
	
	KC3StrategyTabs.docking = new KC3StrategyTab("docking");
	
	KC3StrategyTabs.docking.definition = {
		tabSelf: KC3StrategyTabs.docking,
		
		shipCache:[],
		filters: [],
		options: [],
		sortBy: "status",
		sortAsc: true,
		equipMode: 0,
		remodelOption: 0,
		modernizationOption: 0,
		marriageFilter: 0,
		withFleet: true,
		isLoading: false,
		//shipList: $(".tab_docking .ship_list"),
		
		/* INIT
		   Prepares all data needed
		   ---------------------------------*/
		init :function(){
			// Cache ship info
			PlayerManager.loadFleets();
			var ctr, ThisShip, MasterShip, ThisShipData;
			for(ctr in KC3ShipManager.list){
				ThisShip = KC3ShipManager.list[ctr];
				MasterShip = ThisShip.master();
				var RepairTime = ThisShip.repairTime();
				ThisShipData = {
					id : ThisShip.rosterId,
					bid : ThisShip.masterId,
					stype: MasterShip.api_stype,
					english: ThisShip.name(),
					level: ThisShip.level,
					morale: ThisShip.morale,
					equip: ThisShip.items,
					locked: ThisShip.lock,
					hp: ThisShip.hp[0],
					maxhp: ThisShip.hp[1],
					repairDocking: RepairTime.docking,
					repairAkashi: RepairTime.akashi,
					stripped: ThisShip.isStriped(),
					taiha: ThisShip.isTaiha(),
					fp: [MasterShip.api_houg[1], MasterShip.api_houg[0]+ThisShip.mod[0], ThisShip.fp[0] ],
					tp: [MasterShip.api_raig[1], MasterShip.api_raig[0]+ThisShip.mod[1], ThisShip.tp[0] ],
					yasen: [
						MasterShip.api_houg[1] + MasterShip.api_raig[1],
						MasterShip.api_houg[0]+ThisShip.mod[0] + MasterShip.api_raig[0]+ThisShip.mod[1],
						ThisShip.fp[0] + ThisShip.tp[0]
					],
					aa: [MasterShip.api_tyku[1], MasterShip.api_tyku[0]+ThisShip.mod[2], ThisShip.aa[0] ],
					ar: [MasterShip.api_souk[1], MasterShip.api_souk[0]+ThisShip.mod[3], ThisShip.ar[0] ],
					lk: ThisShip.lk[0],
					slots: ThisShip.slots,
					
					fleet: ThisShip.onFleet(),
					
					// Check whether remodel is max
					remodel: MasterShip.kc3_maxed,
				};
				
				// Check whether modernization is max
				if( ThisShipData.fp[0] == ThisShipData.fp[1]
					&& ThisShipData.tp[0] == ThisShipData.tp[1]
					&& ThisShipData.aa[0] == ThisShipData.aa[1]
					&& ThisShipData.ar[0] == ThisShipData.ar[1]
				  )
					ThisShipData.statmax = 1;
				else
					ThisShipData.statmax = 0;
				
				this.shipCache.push(ThisShipData);
			}
		},
		
		/* EXECUTE
		   Places data onto the interface
		   ---------------------------------*/
		execute :function(){
			this.shipList = $(".tab_docking .ship_list");
			this.showFilters();
		},
		
		/* FILTERS
		   Ship types, and other toggles
		   ---------------------------------*/
		showFilters :function(){
			var self = this;
			// Column header sorting
			$(".tab_docking .ship_header .ship_field.hover").on("click", function(){
				if($(this).data('type') == self.sortBy){
					self.sortAsc = !self.sortAsc;
				}else{
					self.sortAsc = true;
				}
				self.sortBy = $(this).data('type');
				self.refreshTable();
			});
			
			this.refreshTable();
		},
		
		/* REFRESH TABLE
		   Reload ship list based on filters
		   ---------------------------------*/
		refreshTable :function(){
			if(this.isLoading){ return false; }
			this.isLoading = true;
			
			var self = this;
			this.startTime = (new Date()).getTime();
			
			// Clear list
			this.shipList.html("").hide();
			
			// Checks the configuration
			var config = (new KekkonType()).values;
			
			// Wait until execute
			setTimeout(function(){
				var shipCtr, cElm, cShip, shipLevel;
				var FilteredShips = self.shipCache.slice(0);

				// Sorting
				FilteredShips.sort(function(a,b){
					var returnVal = 0;
					switch(self.sortBy){
					case "id":
						if((a.id-b.id) > 0){ returnVal = 1; }
						else if((a.id-b.id) < 0){ returnVal = -1; }
						break;
					case "name":
						if(a.english < b.english) returnVal = -1;
						else if(a.english > b.english) returnVal = 1;
						break;
					case "type": returnVal = a.stype  - b.stype; break;
					case "lv": returnVal = b.level	- a.level; break;
					case "morale": returnVal = b.morale	 - a.morale; break;
					case "hp": returnVal = b.hp	 - a.hp; break;
					case "status": returnVal = a.hp / a.maxhp  - b.hp / b.maxhp; break;
					case "repair_docking": returnVal = b.repairDocking - a.repairDocking; break;
					case "repair_akashi": returnVal = b.repairAkashi - a.repairAkashi; break;
					default: returnVal = 0; break;
					}
					if(!self.sortAsc){ returnVal =- returnVal; }
					return returnVal;
				});
				
				// Fill up list
				Object.keys(FilteredShips).forEach(function(shipCtr){
					if(shipCtr%10 === 0){
						$("<div>").addClass("ingame_page").html("Page "+Math.ceil((Number(shipCtr)+1)/10)).appendTo(self.shipList);
					}
					
					cShip = FilteredShips[shipCtr]; //console.log(cShip);
					shipLevel = cShip.level + 50 * 0; // marry enforcement (debugging toggle)
					cElm = $(".tab_docking .factory .ship_item").clone().appendTo(self.shipList);
					if(shipCtr%2 === 0){ cElm.addClass("even"); }else{ cElm.addClass("odd"); }
					
					$(".ship_id", cElm).text( cShip.id );
					$(".ship_img .ship_icon", cElm).attr("src", KC3Meta.shipIcon(cShip.bid));
					if(config.kanmusuPic && shipLevel >= 100)
						$(".ship_img .ship_kekkon", cElm).attr("src","tabs/ships/SEGASonicRing.png").show();
					$(".ship_name", cElm).text( cShip.english );
					$(".ship_type", cElm).text( KC3Meta.stype(cShip.stype) );
					var shipLevelConv = shipLevel - (shipLevel>=100 && config.kanmusuLv ? (102 - ConfigManager.marryLevelFormat) : 0);
					$(".ship_lv", cElm).html( "<span>Lv.</span>" + shipLevelConv);
					if(config.kanmusuLv && shipLevel >= 100)
						$(".ship_lv", cElm).addClass("ship_kekkon ship_kekkon-color");
					$(".ship_morale", cElm).html( cShip.morale );

					var hpStatus = cShip.hp.toString() + " / " + cShip.maxhp.toString();
					$(".ship_status", cElm).text( hpStatus );
					if (cShip.hp === cShip.maxhp) {
						$(".ship_repair_docking", cElm).text( "-" );
						$(".ship_repair_akashi", cElm).text( "-" );
					} else {
						$(".ship_repair_docking", cElm).text( String(cShip.repairDocking).toHHMMSS() );
						$(".ship_repair_akashi", cElm).text( "-" );
						if (cShip.taiha) {
							$(".ship_status", cElm).addClass("ship_taiha");
						} else if (cShip.stripped) {
							$(".ship_status", cElm).addClass("ship_stripped");
						} else {
							$(".ship_repair_akashi", cElm).text( String(cShip.repairAkashi).toHHMMSS() );
						}
					}
					
					[1,2,3,4].forEach(function(x){
						self.equipImg(cElm, x, cShip.slots[x-1], cShip.equip[x-1]);
					});
					
				});
				
				self.shipList.show();
				self.isLoading = false;
				console.log("Showing this list took", ((new Date()).getTime() - self.startTime)-100 , "milliseconds");
			},100);
		},
		
		/* Show single equipment icon
		   --------------------------------------------*/
		equipImg :function(cElm, equipNum, equipSlot, gear_id){
			var element = $(".ship_equip_" + equipNum, cElm);
			if(gear_id > -1){
				var gear = KC3GearManager.get(gear_id);
				if(gear.itemId<=0){ element.hide(); return; }

				var masterGear = KC3Master.slotitem(gear.api_slotitem_id);
				$("img",element)
					.attr("src", "../../assets/img/items/" + gear.master().api_type[3] + ".png")
					.attr("title", gear.name());
				$("span",element).css('visibility','hidden');
			} else {
				$("img",element).hide();
				$("span",element).each(function(i,x){
					if(equipSlot > 0)
						$(x).text(equipSlot);
					else
						$(x).css('visibility','hidden');
				});
			}
		}
	};
	
	// checks kekkon setting
	function KekkonType(){
		var checks = {
			kanmusuDT  : [0],	// ONLY show this
			kanmusuName: [1],	// ring location: name
			kanmusuLv  : [2,3], // ring location: level
			kanmusuLv0 : [2],	// level convention, 0-index
			kanmusuLv1 : [3],	// level convention, 1-index
			kanmusuPic : [4],	// ring location: ship icon
		};
		if(!KekkonType.values) {
			this.values = {};
			KekkonType.instance = this;
		}
		Object.keys(checks).forEach(function(k){
			KekkonType.instance.values[k] = (function(x){return x.indexOf(ConfigManager.marryLevelFormat || -1) >= 0;})(checks[k]);
		});
		return KekkonType.instance;
	}
	new KekkonType();
	
})();
