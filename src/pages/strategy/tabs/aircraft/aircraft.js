(function(){
	"use strict";
	
	KC3StrategyTabs.aircraft = new KC3StrategyTab("aircraft");
	
	KC3StrategyTabs.aircraft.definition = {
		tabSelf: KC3StrategyTabs.aircraft,
		
		squadNames: {},
		_items: {},
		_holders: {},
		_slotNums: {},
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){

		},

		/* RELOAD
		Prepares latest player data
		---------------------------------*/
		reload :function(){
			var self = this;
			this._items = {};
			this._holders = {};
			this._slotNums = {};

			KC3ShipManager.load();
			KC3GearManager.load();
			PlayerManager.loadBases();
			
			// Get squad names
			if(typeof localStorage.planes == "undefined"){ localStorage.planes = "{}"; }
			this.squadNames = JSON.parse(localStorage.planes);
			
			// Compile equipment holders
			var ctr, ThisItem, MasterItem, ThisShip, MasterShip;
			for(ctr in KC3ShipManager.list){
				this.checkShipSlotForItemHolder(0, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(1, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(2, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(3, KC3ShipManager.list[ctr]);
				// No plane is able to be equipped in ex-slot for now
			}
			for(ctr in PlayerManager.bases){
				this.checkLbasSlotForItemHolder(PlayerManager.bases[ctr]);
			}
			for(ctr in PlayerManager.baseConvertingSlots){
				this._holders["s"+PlayerManager.baseConvertingSlots[ctr]] = "LbasMoving";
			}
			
			// Compile ships on Index
			var thisType, thisSlotitem, thisGearInstance;
			
			function GetMyHolder(){ return self._holders["s"+this.itemId]; }
			function NoHolder(){ return false; }
			
			for(ctr in KC3GearManager.list){
				ThisItem = KC3GearManager.list[ctr];
				MasterItem = ThisItem.master();
				if(!MasterItem) continue;
				//if(KC3GearManager.carrierBasedAircraftType3Ids.indexOf(MasterItem.api_type[3]) == -1) continue;
				
				// Add holder to the item object temporarily via function return
				if(typeof this._holders["s"+ThisItem.itemId] != "undefined"){
					ThisItem.MyHolder = GetMyHolder;
				}else{
					ThisItem.MyHolder = NoHolder;
				}
				
				// Check if slotitem_type is filled
				if(typeof this._items["t"+MasterItem.api_type[3]] == "undefined"){
					this._items["t"+MasterItem.api_type[3]] = [];
				}
				thisType = this._items["t"+MasterItem.api_type[3]];
				
				// Check if slotitem_id is filled
				if(typeof this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id] == "undefined"){
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id] = {
						id: ThisItem.masterId,
						type_id: MasterItem.api_type[3],
						english: ThisItem.name(),
						japanese: MasterItem.api_name,
						stats: {
							fp: MasterItem.api_houg,
							tp: MasterItem.api_raig,
							aa: MasterItem.api_tyku,
							ar: MasterItem.api_souk,
							as: MasterItem.api_tais,
							ev: MasterItem.api_houk,
							ls: MasterItem.api_saku,
							dv: MasterItem.api_baku,
							ht: MasterItem.api_houm,
							rn: MasterItem.api_leng,
							or: MasterItem.api_distance
						},
						instances: []
					};
				}
				thisSlotitem = this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id];
				
				thisSlotitem.instances.push(ThisItem);
			}
			
			// sort this_items
			var sortMasterItem = function(a, b){
				var attr;
				switch( i ){
					case 't6': case 6:
						attr = 'aa'; break;
					case 't7': case 7:
						attr = 'dv'; break;
					case 't8': case 8:
						attr = 'tp'; break;
					case 't9': case 9:
						attr = 'ls'; break;
					case 't10': case 10:
						attr = 'dv'; break;
					default:
						attr = 'aa'; break;
				}
				if( b.stats[attr] == a.stats[attr] )
					return b.stats.ht - a.stats.ht;
				return b.stats[attr] - a.stats[attr];
			};
			var sortSlotItem = function(a,b){
				return b.ace - a.ace;
			};
			for( var i in this._items ){

				// make elements in this._items true Array
				for( var j in this._items[i] ){
					// sort item by ace
					this._items[i][j].instances.sort(sortSlotItem);
					this._items[i].push( this._items[i][j] );
					delete this._items[i][j];
				}
				
				// sort MasterItem by stat
				this._items[i].sort(sortMasterItem);
			}
		},
		
		/* Check a ship's equipment slot of an item is equipped
		--------------------------------------------*/
		checkShipSlotForItemHolder :function(slot, ThisShip){
			if(ThisShip.items[slot] > 0){
				this._holders["s"+ThisShip.items[slot]] = ThisShip;
				this._slotNums["s"+ThisShip.items[slot]] = slot;
			}
		},
		
		/* Check LBAS slot of an aircraft is equipped
		--------------------------------------------*/
		checkLbasSlotForItemHolder :function(LandBase){
			for(var squad in LandBase.planes){
				if(LandBase.planes[squad].api_slotid > 0){
					this._holders["s"+LandBase.planes[squad].api_slotid] = LandBase;
				}
			}
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			$(".tab_aircraft .item_type").on("click", function(){
				KC3StrategyTabs.gotoTab(null, $(this).data("type"));
			});
			
			$(".tab_aircraft .item_list").on("change", ".instance_name input", function(){
				self.squadNames["p"+$(this).attr("data-gearId")] = $(this).val();
				localStorage.planes = JSON.stringify(self.squadNames);
			});
			
			if(!!KC3StrategyTabs.pageParams[1]){
				this.showType(KC3StrategyTabs.pageParams[1]);
			} else {
				this.showType($(".tab_aircraft .item_type").first().data("type"));
			}
		},
		
		/* Show slotitem type
		--------------------------------------------*/
		showType :function(type_id){
			$(".tab_aircraft .item_type").removeClass("active");
			$(".tab_aircraft .item_type[data-type={0}]".format(type_id)).addClass("active");
			$(".tab_aircraft .item_list").html("");
			
			var ctr, ThisType, ItemElem, ThisSlotitem;
			var gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			var lbasPlanesFilter = function(s){
				return s.api_slotid === ThisPlane.itemId;
			};
			for(ctr in this._items["t"+type_id]){
				ThisSlotitem = this._items["t"+type_id][ctr];
				
				ItemElem = $(".tab_aircraft .factory .slotitem").clone().appendTo(".tab_aircraft .item_list");
				$(".icon img", ItemElem).attr("src", "../../assets/img/items/"+type_id+".png");
				$(".icon img", ItemElem).attr("alt", ThisSlotitem.id);
				$(".icon img", ItemElem).click(gearClickFunc);
				$(".english", ItemElem).text(ThisSlotitem.english);
				$(".japanese", ItemElem).text(ThisSlotitem.japanese);
				
				this.slotitem_stat(ItemElem, ThisSlotitem, "fp");
				this.slotitem_stat(ItemElem, ThisSlotitem, "tp");
				this.slotitem_stat(ItemElem, ThisSlotitem, "aa");
				this.slotitem_stat(ItemElem, ThisSlotitem, "ar");
				this.slotitem_stat(ItemElem, ThisSlotitem, "as");
				this.slotitem_stat(ItemElem, ThisSlotitem, "ev");
				this.slotitem_stat(ItemElem, ThisSlotitem, "ls");
				this.slotitem_stat(ItemElem, ThisSlotitem, "dv");
				this.slotitem_stat(ItemElem, ThisSlotitem, "ht");
				this.slotitem_stat(ItemElem, ThisSlotitem, "rn");
				this.slotitem_stat(ItemElem, ThisSlotitem, "or");
				
				var PlaneCtr, ThisPlane, PlaneBox, rankLines, ThisCapacity;
				for(PlaneCtr in ThisSlotitem.instances){
					ThisPlane = ThisSlotitem.instances[PlaneCtr];
					
					PlaneBox = $(".tab_aircraft .factory .instance").clone();
					$(".instances", ItemElem).append(PlaneBox);
					
					$(".instance_icon img", PlaneBox).attr("src", "../../assets/img/items/"+type_id+".png");
					
					if(ThisPlane.stars > 0){
						$(".instance_star span", PlaneBox).text( ThisPlane.stars > 9 ? "m" : ThisPlane.stars);
					} else {
						$(".instance_star img", PlaneBox).hide();
					}
					
					if(ThisPlane.ace > 0){
						$(".instance_chev img", PlaneBox).attr("src", "../../assets/img/client/achev/"+ThisPlane.ace+".png");
					}else{
						$(".instance_chev img", PlaneBox).hide();
					}
					
					$(".instance_name input", PlaneBox).attr("data-gearId", ThisPlane.itemId);
					
					if(typeof this.squadNames["p"+ThisPlane.itemId] != "undefined"){
						$(".instance_name input", PlaneBox).val( this.squadNames["p"+ThisPlane.itemId] );
					}
					
					if(ThisPlane.MyHolder()){
						if(ThisPlane.MyHolder() instanceof KC3LandBase){
							$(".holder_pic img", PlaneBox).attr("src", "../../../../assets/img/items/33.png" );
							$(".holder_name", PlaneBox).text( "LBAS World "+ThisPlane.MyHolder().map );
							$(".holder_level", PlaneBox).text( "#"+ThisPlane.MyHolder().rid );
							ThisCapacity = ThisPlane.MyHolder().planes
								.filter(lbasPlanesFilter)[0].api_max_count;
						} else if(ThisPlane.MyHolder() === "LbasMoving"){
							$(".holder_pic img", PlaneBox).attr("src", "../../../../assets/img/items/33.png" );
							$(".holder_name", PlaneBox).text( "LBAS Moving" );
							$(".holder_level", PlaneBox).text( "" );
							ThisCapacity = "";
						} else {
							$(".holder_pic img", PlaneBox).attr("src", KC3Meta.shipIcon(ThisPlane.MyHolder().masterId) );
							$(".holder_name", PlaneBox).text( ThisPlane.MyHolder().name() );
							$(".holder_level", PlaneBox).text("Lv."+ThisPlane.MyHolder().level);
							ThisCapacity = ThisPlane.MyHolder().slots[ this._slotNums["s"+ThisPlane.itemId] ];
						}
						if(ThisCapacity > 0){
							// Compute for ace fighter air power
							var MyFighterPowerText = "";
							if(ConfigManager.air_formula == 1){
								MyFighterPowerText = ThisPlane.fighterPower(ThisCapacity);
							}else{
								MyFighterPowerText = "~"+ThisPlane.fighterVeteran(ThisCapacity);
							}
							$(".instance_aaval", PlaneBox).text( MyFighterPowerText );
						}
						$(".instance_aaval", PlaneBox).addClass("activeSquad");
						$(".instance_slot", PlaneBox).text(ThisCapacity);
					}else{
						$(".holder_pic", PlaneBox).hide();
						$(".holder_name", PlaneBox).hide();
						$(".holder_level", PlaneBox).hide();
						$(".instance_aaval", PlaneBox).addClass("reserveSquad");
						$(".instance_aaval", PlaneBox).text( ThisSlotitem.stats.aa );
					}
				}
				
			}
			
		},
		
		/* Determine if an item has a specific stat
		--------------------------------------------*/
		slotitem_stat :function(ItemElem, SlotItem, statName){
			if(SlotItem.stats[statName] !== 0 &&
				(statName !== "or" ||
					(statName === "or" &&
					KC3GearManager.landBasedAircraftType3Ids.indexOf(SlotItem.type_id)>-1)
				)
			){
				$(".stats .item_"+statName+" span", ItemElem).text(SlotItem.stats[statName]);
			}else{
				$(".stats .item_"+statName, ItemElem).hide();
			}
		}
		
	};
	
})();
