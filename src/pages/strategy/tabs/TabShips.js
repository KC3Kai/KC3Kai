var TabShips = {
	status: {
		active: false,
		error: false,
		message: "",
		check :function(){
			if(this.error){
				app.Strategy.showError( this.message );
				return false;
			}
			return true;
		}
	},
	
	_ships:[],
	sortBy: "id",
	sortAsc: true,
	filters:[],
	equipMode: 0,
	
	/* Load data, error if not available, compile array
	---------------------------------------------------*/
	init :function(){
		if(this.status.active) return true;
		
		// Load ships and error if empty
		if(!app.Ships.load()){
			this.status.error = true;
			this.status.message = "Ship list not available";
			return false;
		}
		
		// Load equipment and error if empty
		if(!app.Gears.load()){
			this.status.error = true;
			this.status.message = "Equipment list not available";
			return false;
		}
		
		// Compile ships on Index
		var tempItems, ctr, ThisShip, MasterShip;
		for(ctr in app.Ships.list){
			ThisShip = app.Ships.list[ctr];
			MasterShip = app.Master.ship(ThisShip.api_ship_id);
			
			this._ships.push({
				id : ThisShip.api_id,
				bid : MasterShip.api_id,
				stype: MasterShip.api_stype,
				english: MasterShip.english,
				level: ThisShip.api_lv,
				equip: ThisShip.api_slot,
				locked: ThisShip.api_locked,
				hp: ThisShip.api_maxhp,
				// max, naked, equipped
				fp: [MasterShip.api_houg[1], MasterShip.api_houg[0]+ThisShip.api_kyouka[0], ThisShip.api_karyoku[0] ],
				tp: [MasterShip.api_raig[1], MasterShip.api_raig[0]+ThisShip.api_kyouka[1], ThisShip.api_raisou[0] ],
				aa: [MasterShip.api_tyku[1], MasterShip.api_tyku[0]+ThisShip.api_kyouka[2], ThisShip.api_taiku[0] ],
				ar: [MasterShip.api_souk[1], MasterShip.api_souk[0]+ThisShip.api_kyouka[3], ThisShip.api_soukou[0] ],
				// naked, equipped
				as: [this.getDerivedStatNaked("tais", ThisShip.api_taisen[0], ThisShip.api_slot), ThisShip.api_taisen[0] ],
				ev: [this.getDerivedStatNaked("houk", ThisShip.api_kaihi[0], ThisShip.api_slot), ThisShip.api_kaihi[0] ],
				ls: [this.getDerivedStatNaked("saku", ThisShip.api_sakuteki[0], ThisShip.api_slot), ThisShip.api_sakuteki[0] ],
				lk: ThisShip.api_lucky[0]
			});
		}
		
		this.status.active = true;
	},
	
	/* Compute Derived Stats without Equipment
	--------------------------------------------*/
	getDerivedStatNaked :function(StatName, EquippedValue, Items){
		var cEquip, cSlotitem;
		for(cEquip in Items){
			if(Items[cEquip] > -1){
				if(app.Gears.get(Items[cEquip])){
					cSlotitem = app.Master.slotitem( app.Gears.get(Items[cEquip]).api_slotitem_id );
					EquippedValue -= cSlotitem["api_"+StatName];
				}
			}
		}
		return EquippedValue;
	},
	
	/* Attempt to show the page
	--------------------------------------------*/
	show :function(){
		if(!this.status.check()) return false;
		
		var self = this;
		
		var sCtr, cElm;
		for(sCtr in app.Meta._stype){
			if(app.Meta._stype[sCtr]){
				cElm = $(".page_ships .factory .ship_filter_type").clone().appendTo(".page_ships .filters .ship_types");
				cElm.data("id", sCtr);
				$(".filter_name", cElm).text(app.Meta.stype(sCtr));
				this.filters[sCtr] = true;
			}
		}
		
		$(".page_ships .filters .massSelect .all").on("click", function(){
			$(".page_ships .ship_filter_type .filter_check").show();
			for(sCtr in app.Meta._stype){
				self.filters[sCtr] = true;
			}
			self.listTable();
		});
		
		$(".page_ships .filters .massSelect .none").on("click", function(){
			$(".page_ships .ship_filter_type .filter_check").hide();
			for(sCtr in app.Meta._stype){
				self.filters[sCtr] = false;
			}
			self.listTable();
		});
		
		$(".page_ships .filters .massSelect .yes").on("click", function(){
			self.equipMode = 1;
			self.listTable();
		});
		$(".page_ships .filters .massSelect .no").on("click", function(){
			self.equipMode = 0;
			self.listTable();
		});
		
		$(".page_ships .filters .ship_filter_type").on("click", function(){
			self.filters[ $(this).data("id") ] = !self.filters[ $(this).data("id") ];
			if(self.filters[ $(this).data("id") ]){ $(".filter_check", this).show(); }
			else{ $(".filter_check", this).hide(); }
			self.listTable();
		});
		
		$(".page_ships .ship_header .ship_field.hover").on("click", function(){
			if($(this).data('type') == self.sortBy){
				self.sortAsc = !self.sortAsc;
			}else{
				self.sortAsc = true;
			}
			self.sortBy = $(this).data('type');
			self.listTable();
		});
		
		this.listTable();
	},
	
	/* Re-fill ship list depending on params
	--------------------------------------------*/
	listTable :function(){
		var self = this;
		
		// Clear list
		$(".page_ships .ship_list").html("");
		$(".page_ships .ship_list").hide();
		
		// Wait until execute
		setTimeout(function(){
			var shipCtr, cElm, cShip;
			var FilteredShips = [];
			
			// Filtering
			for(shipCtr in self._ships){
				if(typeof self.filters[ self._ships[shipCtr].stype ] != "undefined"){
					if(self.filters[ self._ships[shipCtr].stype ]){
						FilteredShips.push(self._ships[shipCtr]);
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
			
			var totals = {lv:0, hp:0, fp:0, tp:0, aa:0, ar:0, as:0, ev:0, ls:0, lk:0 };
			
			// Fill up list
			for(shipCtr in FilteredShips){
				cShip = FilteredShips[shipCtr];
				cElm = $(".page_ships .factory .ship_item").clone().appendTo(".page_ships .ship_list");
				if(shipCtr%2 === 0){ cElm.addClass("even"); }else{ cElm.addClass("odd"); }
				if(shipCtr%10 === 0){ cElm.addClass("ten-margin"); }
				
				$(".ship_id", cElm).text( cShip.id );
				$(".ship_img img", cElm).attr("src", app.Assets.shipIcon(cShip.bid));
				$(".ship_name", cElm).text( cShip.english );
				$(".ship_type", cElm).text( app.Meta.stype(cShip.stype) );
				$(".ship_lv", cElm).html( "<span>Lv.</span>" + cShip.level );
				$(".ship_hp", cElm).text( cShip.hp );
				$(".ship_lk", cElm).text( cShip.lk );
				
				totals.lv += parseInt(cShip.level, 10);
				totals.hp += parseInt(cShip.hp, 10);
				totals.lk += parseInt(cShip.lk, 10);
				
				self.modernizableStat("fp", cElm, cShip.fp);
				self.modernizableStat("tp", cElm, cShip.tp);
				self.modernizableStat("aa", cElm, cShip.aa);
				self.modernizableStat("ar", cElm, cShip.ar);
				
				totals.fp += parseInt($(".ship_fp", cElm).text(), 10);
				totals.tp += parseInt($(".ship_tp", cElm).text(), 10);
				totals.aa += parseInt($(".ship_aa", cElm).text(), 10);
				totals.ar += parseInt($(".ship_ar", cElm).text(), 10);
				
				$(".ship_as", cElm).text( cShip.as[self.equipMode] );
				$(".ship_ev", cElm).text( cShip.ev[self.equipMode] );
				$(".ship_ls", cElm).text( cShip.ls[self.equipMode] );
				
				totals.as += parseInt(cShip.as[self.equipMode], 10);
				totals.ev += parseInt(cShip.ev[self.equipMode], 10);
				totals.ls += parseInt(cShip.ls[self.equipMode], 10);
				
				self.equipImg(cElm, 1, cShip.equip[0]);
				self.equipImg(cElm, 2, cShip.equip[1]);
				self.equipImg(cElm, 3, cShip.equip[2]);
				self.equipImg(cElm, 4, cShip.equip[3]);
				
				if(FilteredShips[shipCtr].locked){ $(".ship_lock img", cElm).show(); }
			}
			
			// Show totals
			$(".page_ships .ship_totals .total_level").text(totals.lv);
			$(".page_ships .ship_totals .total_hp").text(totals.hp);
			$(".page_ships .ship_totals .total_fp").text(totals.fp);
			$(".page_ships .ship_totals .total_tp").text(totals.tp);
			$(".page_ships .ship_totals .total_aa").text(totals.aa);
			$(".page_ships .ship_totals .total_ar").text(totals.ar);
			$(".page_ships .ship_totals .total_as").text(totals.as);
			$(".page_ships .ship_totals .total_ev").text(totals.ev);
			$(".page_ships .ship_totals .total_ls").text(totals.ls);
			$(".page_ships .ship_totals .total_lk").text(totals.lk);
			
			$(".page_ships .ship_list").show();
		},100);
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

		if (gear_id > -1) {
			var gear = app.Gears.get(gear_id);

			if(!gear){
				element.hide();
			}

			var masterGear = app.Master.slotitem(gear.api_slotitem_id);

			element.find("img")
				.attr("src", "../../assets/img/items/" + masterGear.api_type[3] + ".png")
				.attr("title", masterGear.english + "\n" + masterGear.api_name);
		} else {
			element.hide();
		}
	}
	
};