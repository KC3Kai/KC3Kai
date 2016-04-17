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
		marriageFilter: 0,
		heartlockFilter: 0,
		speedFilter: 0,
		withFleet: true,
		isLoading: false,

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Cache ship info
			PlayerManager.loadFleets();
			var ctr, ThisShip, ThisShipData;
			for(ctr in KC3ShipManager.list){
				ThisShip = KC3ShipManager.list[ctr];
				ThisShipData = this.prepareShipData(ThisShip);
				
				this.shipCache.push(ThisShipData);
			}
		},

		// prepares necessary info.
		// also stores those that doesn't need to be recomputed overtime.
		prepareShipData: function(ship) {
			var ThisShip = ship;
			var MasterShip = ThisShip.master();
			var cached =  {
				id: ThisShip.rosterId,
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
					yasen: [
						MasterShip.api_houg[1] + MasterShip.api_raig[1],
						MasterShip.api_houg[0]+ThisShip.mod[0] + MasterShip.api_raig[0]+ThisShip.mod[1],
						ThisShip.fp[0] + ThisShip.tp[0]
					],
					aa: [MasterShip.api_tyku[1], MasterShip.api_tyku[0]+ThisShip.mod[2], ThisShip.aa[0] ],
					ar: [MasterShip.api_souk[1], MasterShip.api_souk[0]+ThisShip.mod[3], ThisShip.ar[0] ],
					as: [this.getDerivedStatNaked("tais", ThisShip.as[0], ThisShip.items), ThisShip.as[0] ],
					ev: [this.getDerivedStatNaked("houk", ThisShip.ev[0], ThisShip.items), ThisShip.ev[0] ],
					ls: [this.getDerivedStatNaked("saku", ThisShip.ls[0], ThisShip.items), ThisShip.ls[0] ],
					lk: ThisShip.lk[0],
					sp: MasterShip.api_soku,
					slots: ThisShip.slots,
					fleet: ThisShip.onFleet(),
					ship: ThisShip,
					master: ThisShip.master(),
					// Check whether remodel is max
					remodel: RemodelDb.isFinalForm(ship.masterId)
				};
			var ThisShipData = cached;
			// Check whether modernization is max
			if( ThisShipData.fp[0] == ThisShipData.fp[1]
				&& ThisShipData.tp[0] == ThisShipData.tp[1]
				&& ThisShipData.aa[0] == ThisShipData.aa[1]
				&& ThisShipData.ar[0] == ThisShipData.ar[1]
			  )
				ThisShipData.statmax = 1;
			else
				ThisShipData.statmax = 0;

			return cached;
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

			// Select: Invert
			self.options.none = $(".tab_ships .filters .massSelect .invert").on("click", function(){
				$(".tab_ships .ship_filter_type .filter_check").toggle();
				for(sCtr in KC3Meta._stype){
					self.filters[sCtr] = !self.filters[sCtr];
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
			
			// Marriage
			["in","on","ex"].forEach(function(x,i,a){
				self.options["marriage_"+x] = $(".tab_ships .filters .massSelect .marriage_"+x).on("click",function(){
					self.marriageFilter = i;
					self.refreshTable();
					a.forEach(function(_x,_i,_a){
						if(i==_i)
							self.options["marriage_"+_x].addClass('on');
						else
							self.options["marriage_"+_x].removeClass('on');
					});
				});
			});
			
			// Fleet Inclusion
			["no","yes"].forEach(function(x,i,a){
				self.options["fleet_"+x] = $(".tab_ships .filters .massSelect .fleet_"+x).on("click",function(){
					self.withFleet = !!i;
					self.refreshTable();
					a.forEach(function(_x,_i,_a){
						if(i==_i)
							self.options["fleet_"+_x].addClass('on');
						else
							self.options["fleet_"+_x].removeClass('on');
					});
 				});
			});

			["all","yes","no"].forEach(function(x,i,a){
				self.options["heartlock_"+x] = $(".tab_ships .filters .massSelect .heartlock_"+x).on("click",function(){
					self.heartlockFilter = i;
					self.refreshTable();
					a.forEach(function(_x,_i,_a){
						if(i==_i)
							self.options["heartlock_"+_x].addClass('on');
						else
							self.options["heartlock_"+_x].removeClass('on');
					});
				});
			});

			["all","fast","slow"].forEach(function(x,i,a){
				self.options["speed_"+x] = $(".tab_ships .filters .massSelect .speed_"+x).on("click",function(){
					self.speedFilter = i;
					self.refreshTable();
					a.forEach(function(_x,_i,_a){
						if(i==_i)
							self.options["speed_"+_x].addClass('on');
						else
							self.options["speed_"+_x].removeClass('on');
					});
				});
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

			self.options["heartlock_"+["all","yes","no"][self.heartlockFilter]].addClass('on');
			self.options["marriage_"+["in","on","ex"][self.marriageFilter]].addClass('on');
			self.options["fleet_"+["no","yes"][self.withFleet & 1]].addClass('on');
			self.options["speed_"+["all","fast","slow"][self.speedFilter]].addClass('on');
			
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
			this.startTime = Date.now();
			
			// Clear list
			this.shipList.html("").hide();
			
			// Wait until execute
			setTimeout(function(){
				var shipCtr, cElm, cShip, shipLevel;
				var FilteredShips = [];
				
				// Filtering
				for(shipCtr in self.shipCache){
					var thisShip = self.shipCache[shipCtr];
					if(typeof self.filters[ thisShip.stype ] != "undefined"){
						if( self.filters[ thisShip.stype ]
							&& (
								self.remodelOption === 0
								|| (self.remodelOption == 1 && thisShip.remodel)
								|| (self.remodelOption == 2 && !thisShip.remodel)
							)
							&& (
								self.modernizationOption === 0
								|| (self.modernizationOption == 1 && thisShip.statmax)
								|| (self.modernizationOption == 2 && !thisShip.statmax)
							)
							&& (
								((self.marriageFilter || 1) == 1 && thisShip.level >= 100) ||
								((self.marriageFilter || 2) == 2 && thisShip.level <  100)
							)
							&& (self.withFleet || (!self.withFleet && !thisShip.fleet)
							   )
							&& (self.heartlockFilter === 0
								|| (self.heartlockFilter === 1 && thisShip.locked === 1)
								|| (self.heartlockFilter === 2 && thisShip.locked === 0)
							   )
							&& (self.speedFilter === 0
								|| (self.speedFilter === 1 && thisShip.sp >= 10)
								|| (self.speedFilter === 2 && thisShip.sp < 10)
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
						case "yasen": returnVal = (b.fp[self.equipMode+1] + b.tp[self.equipMode+1]) - (a.fp[self.equipMode+1] + a.tp[self.equipMode+1]); break;
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
				
				// Fill up list
				Object.keys(FilteredShips).forEach(function(shipCtr){
					if(shipCtr%10 === 0){
						$("<div>").addClass("ingame_page").html("Page "+Math.ceil((Number(shipCtr)+1)/10)).appendTo(self.shipList);
					}
					
					cShip = FilteredShips[shipCtr]; //console.log(cShip);
					shipLevel = cShip.level;

					// we can save some time by avoiding constructing jquery object
					// if we already have one
					if (cShip.view) {
						cShip.view.appendTo(self.shipList);
						return;
					}

					cElm = $(".tab_ships .factory .ship_item").clone().appendTo(self.shipList);
					cShip.view = cElm;
					if(shipCtr%2 === 0){ cElm.addClass("even"); }else{ cElm.addClass("odd"); }
					
					$(".ship_id", cElm).text( cShip.id );
					$(".ship_img .ship_icon", cElm).attr("src", KC3Meta.shipIcon(cShip.bid));
					$(".ship_name", cElm).text( cShip.english );
					if(shipLevel >= 100) {
						$(".ship_name", cElm).addClass("ship_kekkon-color");
					}
					$(".ship_type", cElm).text( KC3Meta.stype(cShip.stype) );
					var shipLevelConv = shipLevel;
					$(".ship_lv", cElm).html( "<span>Lv.</span>" + shipLevelConv);
					$(".ship_morale", cElm).html( cShip.morale );
					$(".ship_hp", cElm).text( cShip.hp );
					$(".ship_lk", cElm).text( cShip.lk );
					
					if(cShip.morale >= 50){ $(".ship_morale", cElm).addClass("sparkled"); }
					
					self.modernizableStat("fp", cElm, cShip.fp);
					self.modernizableStat("tp", cElm, cShip.tp);
					self.modernizableStat("yasen", cElm, cShip.yasen);
					self.modernizableStat("aa", cElm, cShip.aa);
					self.modernizableStat("ar", cElm, cShip.ar);
					
					$(".ship_as", cElm).text( cShip.as[self.equipMode] );
					$(".ship_ev", cElm).text( cShip.ev[self.equipMode] );
					$(".ship_ls", cElm).text( cShip.ls[self.equipMode] );
					
					[1,2,3,4].forEach(function(x){
						self.equipImg(cElm, x, cShip.slots[x-1], cShip.equip[x-1]);
					});
					
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
				});
				
				self.shipList.show();
				self.isLoading = false;
				console.log("Showing this list took", (Date.now() - self.startTime)-100 , "milliseconds");
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
	
})();
