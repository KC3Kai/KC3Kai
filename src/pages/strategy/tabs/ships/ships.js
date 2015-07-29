(function(){
	"use strict";
	
	KC3StrategyTabs.ships = new KC3StrategyTab("ships");
	
	KC3StrategyTabs.ships.definition = {
		tabSelf: KC3StrategyTabs.ships,
		
		shipCache:[],
		filters: [],
		options: [],
		sortBy: "lv",
		sortAsc: true,
		equipMode: 0,
		remodelOption: 0,
		modernizationOption: 0,
		isLoading: false,
		//shipList: $(".tab_ships .ship_list"),
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Cache ship info
			var ctr, ThisShip, MasterShip, ThisShipData;
			for(ctr in KC3ShipManager.list){
				ThisShip = KC3ShipManager.list[ctr];
				MasterShip = ThisShip.master();
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
					fp: [MasterShip.api_houg[1], MasterShip.api_houg[0]+ThisShip.mod[0], ThisShip.fp[0] ],
					tp: [MasterShip.api_raig[1], MasterShip.api_raig[0]+ThisShip.mod[1], ThisShip.tp[0] ],
					aa: [MasterShip.api_tyku[1], MasterShip.api_tyku[0]+ThisShip.mod[2], ThisShip.aa[0] ],
					ar: [MasterShip.api_souk[1], MasterShip.api_souk[0]+ThisShip.mod[3], ThisShip.ar[0] ],
					as: [this.getDerivedStatNaked("tais", ThisShip.as[0], ThisShip.items), ThisShip.as[0] ],
					ev: [this.getDerivedStatNaked("houk", ThisShip.ev[0], ThisShip.items), ThisShip.ev[0] ],
					ls: [this.getDerivedStatNaked("saku", ThisShip.ls[0], ThisShip.items), ThisShip.ls[0] ],
					lk: ThisShip.lk[0],
					
					// Check whether remodel is max
					remodel: (ThisShip.master().api_afterlv && ThisShip.master().api_aftershipid)
								? {
									'level':	ThisShip.master().api_afterlv,
									'bid':		ThisShip.master().api_aftershipid
								}
								: false
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
			this.shipList = $(".tab_ships .ship_list");
			this.showFilters();
		},
		
		/* FILTERS
		Ship types, and other toggles
		---------------------------------*/
		showFilters :function(){
			var self = this;
			
			// Ship types
			var sCtr, cElm;
			for(sCtr in KC3Meta._stype){
				if(KC3Meta._stype[sCtr]){
					cElm = $(".tab_ships .factory .ship_filter_type").clone().appendTo(".tab_ships .filters .ship_types");
					cElm.data("id", sCtr);
					$(".filter_name", cElm).text(KC3Meta.stype(sCtr));
					this.filters[sCtr] = true;
				}
			}
			
			// Select: All
			self.options.all = $(".tab_ships .filters .massSelect .all").on("click", function(){
				$(".tab_ships .ship_filter_type .filter_check").show();
				for(sCtr in KC3Meta._stype){
					self.filters[sCtr] = true;
				}
				self.refreshTable();
			});
			
			// Select: None
			self.options.none = $(".tab_ships .filters .massSelect .none").on("click", function(){
				$(".tab_ships .ship_filter_type .filter_check").hide();
				for(sCtr in KC3Meta._stype){
					self.filters[sCtr] = false;
				}
				self.refreshTable();
			});
			
			// Equip Stats: Yes
			self.options.equip_yes = $(".tab_ships .filters .massSelect .equip_yes").on("click", function(){
				self.equipMode = 1;
				self.refreshTable();
				self.options.equip_yes.addClass('on');
				self.options.equip_no.removeClass('on');
			});
			
			// Equip Stats: No
			self.options.equip_no = $(".tab_ships .filters .massSelect .equip_no").on("click", function(){
				self.equipMode = 0;
				self.refreshTable();
				self.options.equip_yes.removeClass('on');
				self.options.equip_no.addClass('on');
			});
			
			// Remodel: All
			self.options.remodel_all = $(".tab_ships .filters .massSelect .remodel_all").on("click", function(){
				self.remodelOption = 0;
				self.refreshTable();
				self.options.remodel_all.addClass('on');
				self.options.remodel_max.removeClass('on');
				self.options.remodel_nomax.removeClass('on');
			});
			
			// Remodel: Max
			self.options.remodel_max = $(".tab_ships .filters .massSelect .remodel_max").on("click", function(){
				self.remodelOption = 1;
				self.refreshTable();
				self.options.remodel_all.removeClass('on');
				self.options.remodel_max.addClass('on');
				self.options.remodel_nomax.removeClass('on');
			});
			
			// Remodel: Non-Max
			self.options.remodel_nomax = $(".tab_ships .filters .massSelect .remodel_nomax").on("click", function(){
				self.remodelOption = 2;
				self.refreshTable();
				self.options.remodel_all.removeClass('on');
				self.options.remodel_max.removeClass('on');
				self.options.remodel_nomax.addClass('on');
			});
			
			// Modernization: All
			self.options.modernization_all = $(".tab_ships .filters .massSelect .modernization_all").on("click", function(){
				self.modernizationOption = 0;
				self.refreshTable();
				self.options.modernization_all.addClass('on');
				self.options.modernization_max.removeClass('on');
				self.options.modernization_nomax.removeClass('on');
			});
			
			// Modernization: Max
			self.options.modernization_max = $(".tab_ships .filters .massSelect .modernization_max").on("click", function(){
				self.modernizationOption = 1;
				self.refreshTable();
				self.options.modernization_all.removeClass('on');
				self.options.modernization_max.addClass('on');
				self.options.modernization_nomax.removeClass('on');
			});
			
			// Modernization: Non-Max
			self.options.modernization_nomax = $(".tab_ships .filters .massSelect .modernization_nomax").on("click", function(){
				self.modernizationOption = 2;
				self.refreshTable();
				self.options.modernization_all.removeClass('on');
				self.options.modernization_max.removeClass('on');
				self.options.modernization_nomax.addClass('on');
			});
			
			// Default status
				if( self.equipMode )
					self.options.equip_yes.addClass('on');
				else
					self.options.equip_no.addClass('on');

				if( self.remodelOption === 0 )
					self.options.remodel_all.addClass('on');
				else if( self.remodelOption == 1 )
					self.options.remodel_max.addClass('on');
				else if( self.remodelOption == 2 )
					self.options.remodel_nomax.addClass('on');

				if( self.modernizationOption === 0 )
					self.options.modernization_all.addClass('on');
				else if( self.modernizationOption == 1 )
					self.options.modernization_max.addClass('on');
				else if( self.modernizationOption == 2 )
					self.options.modernization_nomax.addClass('on');
			
			// Ship type toggled
			$(".tab_ships .filters .ship_filter_type").on("click", function(){
				self.filters[ $(this).data("id") ] = !self.filters[ $(this).data("id") ];
				if(self.filters[ $(this).data("id") ]){ $(".filter_check", this).show(); }
				else{ $(".filter_check", this).hide(); }
				self.refreshTable();
			});
			
			// Column header sorting
			$(".tab_ships .ship_header .ship_field.hover").on("click", function(){
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
			
			// Wait until execute
			setTimeout(function(){
				var shipCtr, cElm, cShip;
				var FilteredShips = [];
				
				// Filtering
				for(shipCtr in self.shipCache){
					var thisShip = self.shipCache[shipCtr];
					if(typeof self.filters[ thisShip.stype ] != "undefined"){
						if(self.filters[ thisShip.stype ]
							&& (
								self.remodelOption === 0
								|| (self.remodelOption == 1 && !thisShip.remodel)
								|| (self.remodelOption == 2 && thisShip.remodel)
							)
							&& (
								self.modernizationOption === 0
								|| (self.modernizationOption == 1 && thisShip.statmax)
								|| (self.modernizationOption == 2 && !thisShip.statmax)
							)
						){
							FilteredShips.push(thisShip);
						}
					}
				}
				
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
						case "lv": returnVal = b.level  - a.level; break;
						case "morale": returnVal = b.morale  - a.morale; break;
						case "hp": returnVal = b.hp  - a.hp; break;
						case "fp": returnVal = b.fp[self.equipMode+1] - a.fp[self.equipMode+1]; break;
						case "tp": returnVal = b.tp[self.equipMode+1] - a.tp[self.equipMode+1]; break;
						case "aa": returnVal = b.aa[self.equipMode+1] - a.aa[self.equipMode+1]; break;
						case "ar": returnVal = b.ar[self.equipMode+1] - a.ar[self.equipMode+1]; break;
						case "as": returnVal = b.as[self.equipMode] - a.as[self.equipMode]; break;
						case "ev": returnVal = b.ev[self.equipMode] - a.ev[self.equipMode]; break;
						case "ls": returnVal = b.ls[self.equipMode] - a.ls[self.equipMode]; break;
						case "lk": returnVal = b.lk  - a.lk; break;
						default: returnVal = 0; break;
					}
					if(!self.sortAsc){ returnVal =- returnVal; }
					return returnVal;
				});
				
				// var totals = {lv:0, hp:0, fp:0, tp:0, aa:0, ar:0, as:0, ev:0, ls:0, lk:0 };
				
				// Fill up list
				for(shipCtr in FilteredShips){
					if(shipCtr%10 === 0){
						$("<div>").addClass("ingame_page").html("Page "+Math.ceil((Number(shipCtr)+1)/10)).appendTo(self.shipList);
					}
					
					cShip = FilteredShips[shipCtr]; //console.log(cShip);
					cElm = $(".tab_ships .factory .ship_item").clone().appendTo(self.shipList);
					if(shipCtr%2 === 0){ cElm.addClass("even"); }else{ cElm.addClass("odd"); }
					
					$(".ship_id", cElm).text( cShip.id );
					$(".ship_img img", cElm).attr("src", KC3Meta.shipIcon(cShip.bid));
					$(".ship_name", cElm).text( cShip.english );
					$(".ship_type", cElm).text( KC3Meta.stype(cShip.stype) );
					$(".ship_lv", cElm).html( "<span>Lv.</span>" + cShip.level );
					$(".ship_morale", cElm).html( cShip.morale );
					$(".ship_hp", cElm).text( cShip.hp );
					$(".ship_lk", cElm).text( cShip.lk );
					
					if(cShip.morale >= 50){ $(".ship_morale", cElm).addClass("sparkled"); }
					
					// totals.lv += parseInt(cShip.level, 10);
					// totals.hp += parseInt(cShip.hp, 10);
					// totals.lk += parseInt(cShip.lk, 10);
					
					self.modernizableStat("fp", cElm, cShip.fp);
					self.modernizableStat("tp", cElm, cShip.tp);
					self.modernizableStat("aa", cElm, cShip.aa);
					self.modernizableStat("ar", cElm, cShip.ar);
					
					// totals.fp += parseInt($(".ship_fp", cElm).text(), 10);
					// totals.tp += parseInt($(".ship_tp", cElm).text(), 10);
					// totals.aa += parseInt($(".ship_aa", cElm).text(), 10);
					// totals.ar += parseInt($(".ship_ar", cElm).text(), 10);
					
					$(".ship_as", cElm).text( cShip.as[self.equipMode] );
					$(".ship_ev", cElm).text( cShip.ev[self.equipMode] );
					$(".ship_ls", cElm).text( cShip.ls[self.equipMode] );
					
					// totals.as += parseInt(cShip.as[self.equipMode], 10);
					// totals.ev += parseInt(cShip.ev[self.equipMode], 10);
					// totals.ls += parseInt(cShip.ls[self.equipMode], 10);
					
					self.equipImg(cElm, 1, cShip.equip[0]);
					self.equipImg(cElm, 2, cShip.equip[1]);
					self.equipImg(cElm, 3, cShip.equip[2]);
					self.equipImg(cElm, 4, cShip.equip[3]);
					
					if(FilteredShips[shipCtr].locked){ $(".ship_lock img", cElm).show(); }

					// Check whether remodel is max
						if( !cShip.remodel )
							cElm.addClass('remodel-max');
						else
							cElm.addClass('remodel-able');

					// Check whether modernization is max
						if( cShip.statmax )
							cElm.addClass('modernization-max');
						else
							cElm.addClass('modernization-able');
				}
				
				// Show totals
				/*$(".tab_ships .ship_totals .total_level").text(totals.lv);
				$(".tab_ships .ship_totals .total_hp").text(totals.hp);
				$(".tab_ships .ship_totals .total_fp").text(totals.fp);
				$(".tab_ships .ship_totals .total_tp").text(totals.tp);
				$(".tab_ships .ship_totals .total_aa").text(totals.aa);
				$(".tab_ships .ship_totals .total_ar").text(totals.ar);
				$(".tab_ships .ship_totals .total_as").text(totals.as);
				$(".tab_ships .ship_totals .total_ev").text(totals.ev);
				$(".tab_ships .ship_totals .total_ls").text(totals.ls);
				$(".tab_ships .ship_totals .total_lk").text(totals.lk);*/
				
				self.shipList.show();
				self.isLoading = false;
				console.log("Showing this list took", ((new Date()).getTime() - self.startTime)-100 , "milliseconds");
			},100);
		},
		
		/* Compute Derived Stats without Equipment
		--------------------------------------------*/
		getDerivedStatNaked :function(StatName, EquippedValue, Items){
			for(var ctr in Items){
				if(Items[ctr] > -1){
					EquippedValue -= KC3GearManager.get( Items[ctr] ).master()["api_"+StatName];
				}
			}
			return EquippedValue;
		},
		
		/* Show cell contents of a mod stat
		--------------------------------------------*/
		modernizableStat :function(stat, cElm, Values){
			$(".ship_"+stat, cElm).text( Values[this.equipMode+1] );
			if(Values[0] == Values[1]){
				$(".ship_"+stat, cElm).addClass("max");
			}else{
				$(".ship_"+stat, cElm).append("<span>+"+(Values[0] - Values[1])+"</span>");
			}
		},
		
		/* Show single equipment icon
		--------------------------------------------*/
		equipImg :function(cElm, equipNum, gear_id){
			var element = $(".ship_equip_" + equipNum, cElm);
			if(gear_id > -1){
				var gear = KC3GearManager.get(gear_id);
				if(gear.itemId===0){ element.hide(); return; }

				var masterGear = KC3Master.slotitem(gear.api_slotitem_id);
				element.find("img")
					.attr("src", "../../assets/img/items/" + gear.master().api_type[3] + ".png")
					.attr("title", gear.name());
			} else {
				element.hide();
			}
		}
	};
	
})();