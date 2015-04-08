/*
TabShips.js
By: dragonjet
*/

var TabShips = {
	active: false,
	_ships:[],
	_items:[],
	sortBy: "id",
	sortAsc: true,
	filters:[
		/*true,true,true,true,true,true,true,
		true,true,true,true,true,true,true,
		true,true,true,true,true,true,true,
		true,true,true,true,true,true,true*/
	],
	equipMode: 0,
	
	/* onReady, initialize
	--------------------------------------------*/
	init :function(){
		if(this.active) return false; this.active = true;
		
		var tempItems, ctr, ThisShip, MasterShip;
		
		// Compile items on Index
		tempItems = JSON.parse(localStorage.user_items);
		for(ctr in tempItems){
			this._items[ tempItems[ctr].api_id ] = tempItems[ctr];
		}
		delete tempItems;
		
		// Compile ships on Index
		tempItems = JSON.parse(localStorage.user_ships);
		for(ctr in tempItems){
			ThisShip = tempItems[ctr];
			MasterShip = master.ship[ThisShip.api_ship_id];
			
			this._ships.push({
				id : ThisShip.api_id,
				bid : MasterShip.api_id,
				stype: MasterShip.api_stype,
				english: MasterShip.english,
				level: ThisShip.api_lv,
				equip: ThisShip.api_slot,
				locked: ThisShip.api_locked,
				hp: ThisShip.api_maxhp,
				// nax, naked, equipped
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
		console.log(this._ships);
	},
	
	/* Compute Derived Stats without Equipment
	--------------------------------------------*/
	getDerivedStatNaked :function(StatName, EquippedValue, Items){
		var cEquip;
		for(cEquip in Items){
			if(Items[cEquip] > -1){
				if(typeof this._items[Items[cEquip]] != "undefined"){
					EquippedValue -= master.slotitem[ this._items[Items[cEquip]].api_slotitem_id ]["api_"+StatName];
				}
			}
		}
		return EquippedValue;
	},
	
	/* Show the page
	--------------------------------------------*/
	show :function(){
		var self = this;
		
		var sCtr, cElm;
		for(sCtr in KanColleData.data_stype){
			if(KanColleData.data_stype[sCtr]){
				cElm = $(".page_ships .factory .ship_filter_type").clone().appendTo(".page_ships .filters .ship_types");
				cElm.data("id", sCtr);
				$(".filter_name", cElm).text(KanColleData.data_stype[sCtr]);
				this.filters[sCtr] = true;
			}
		}
		
		$(".page_ships .filters .massSelect .all").on("click", function(){
			$(".page_ships .ship_filter_type .filter_check").show();
			for(sCtr in KanColleData.data_stype){
				self.filters[sCtr] = true;
			}
			self.listTable();
		});
		
		$(".page_ships .filters .massSelect .none").on("click", function(){
			$(".page_ships .ship_filter_type .filter_check").hide();
			for(sCtr in KanColleData.data_stype){
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
	
	listTable :function(){
		var shipCtr, cElm, cShip;
		var self = this;
		var FilteredShips = [];
		
		// Clear list
		$(".page_ships .ship_list").html("");
		
		// Filtering
		for(shipCtr in this._ships){
			if(typeof this.filters[ this._ships[shipCtr].stype ] != "undefined"){
				if(this.filters[ this._ships[shipCtr].stype ]){
					FilteredShips.push(this._ships[shipCtr]);
				}
			}
		}
		
		// Sorting
		FilteredShips.sort(function(a,b){
			var returnVal = 0;
			switch(self.sortBy){
				case "id": returnVal = a.api_id  - b.api_id; break;
				case "name":
					if(a.english < b.english) returnVal = -1;
					if(a.english > b.english) returnVal = 1;
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
		
		// Fill up list
		for(shipCtr in FilteredShips){
			cShip = FilteredShips[shipCtr];
			cElm = $(".page_ships .factory .ship_item").clone().appendTo(".page_ships .ship_list");
			if(shipCtr%2 === 0){ cElm.addClass("even"); }else{ cElm.addClass("odd"); }
			
			$(".ship_id", cElm).text( cShip.id );
			$(".ship_img img", cElm).attr("src", "../../images/ships/"+cShip.bid+".png");
			$(".ship_name", cElm).text( cShip.english );
			$(".ship_type", cElm).text( KanColleData.data_stype[cShip.stype] );
			$(".ship_lv", cElm).html( "<span>Lv.</span>" + cShip.level );
			$(".ship_hp", cElm).text( cShip.hp );
			$(".ship_lk", cElm).text( cShip.lk );
			
			this.modernizableStat("fp", cElm, cShip.fp);
			this.modernizableStat("tp", cElm, cShip.tp);
			this.modernizableStat("aa", cElm, cShip.aa);
			this.modernizableStat("ar", cElm, cShip.ar);
			
			$(".ship_as", cElm).text( cShip.as[this.equipMode] );
			$(".ship_ev", cElm).text( cShip.ev[this.equipMode] );
			$(".ship_ls", cElm).text( cShip.ls[this.equipMode] );
			
			this.equipImg(cElm, 1, cShip.equip[0]);
			this.equipImg(cElm, 2, cShip.equip[1]);
			this.equipImg(cElm, 3, cShip.equip[2]);
			this.equipImg(cElm, 4, cShip.equip[3]);
			
			if(FilteredShips[shipCtr].locked){ $(".ship_lock img", cElm).show(); }
		}
	},
	
	modernizableStat :function(stat, cElm, Values){
		$(".ship_"+stat, cElm).text( Values[this.equipMode+1] );
		if(Values[0] == Values[1]){
			$(".ship_"+stat, cElm).addClass("max");
		}else{
			$(".ship_"+stat, cElm).append("<span>+"+(Values[0] - Values[1])+"</span>");
		}
	},
	
	equipImg :function(cElm, equipNum, gear_id){
		if(gear_id > -1){
			if(typeof this._items[gear_id] == "undefined"){
				$(".ship_equip_"+equipNum, cElm).hide();
				return false;
			}
			var MasterGear = master.slotitem[this._items[gear_id].api_slotitem_id];
			$(".ship_equip_"+equipNum+" img", cElm).attr("src", "../../images/items/"+MasterGear.api_type[3]+".png");
		}else{
			$(".ship_equip_"+equipNum, cElm).hide();
		}
	},
	
	dummy:""
};