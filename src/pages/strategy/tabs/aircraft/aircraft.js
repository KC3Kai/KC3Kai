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
			this.sortMasterItem = (a, b) => {
				const type = a.type_id;
				let s1 = "aa", s2 = "aa";
				switch(type){
					case 6: case 45: case 43: // (Night/Seaplane) fighter
						s1 = 'aa'; s2 = 'fp'; break;
					case 7: case 58: case 39: case 40: // (Night) Dive/Jet bomber
						s1 = 'dv'; s2 = 'aa'; break;
					case 8: case 46: // (Night) Torpedo bomber
						s1 = 'tp'; s2 = 'as'; break;
					case 9: case 33: // Recon / Large flying boat
						s1 = 'ls'; s2 = 'or'; break;
					case 10: // Seaplane Bomber/Recon
						s1 = 'dv'; s2 = 'ls'; break;
					case 51: // Seaplane Night Bomber
						s1 = 'dv'; s2 = 'ls'; break;
					case 50: // Seaplane Night Recon
						s1 = 'ht'; s2 = 'ls'; break;
					case 37: // LB Attacker
					case 48: // LB Assault
						s1 = 'dv'; s2 = 'tp'; break;
					case 38: // Interceptor (ht = Anti-bomber)
					case 56: // LB Jet Fighter
					case 57: // LB Canard Interceptor
						s1 = 'ht'; s2 = 'aa'; break;
					case 44: // LB Fighter (ev = Interception)
						s1 = 'aa'; s2 = 'ev'; break;
					case 21: case 47: // Autogyro, LB ASW bomber
						s1 = 'as'; s2 = 'dv'; break;
					case 22: // ASW-PBY
						s1 = 'dv'; s2 = 'as'; break;
				}
				return b.stats[s1] - a.stats[s1]
					|| b.stats[s2] - a.stats[s2]
					|| b.stats.ht - a.stats.ht
					|| b.stats.ev - a.stats.ev
					|| b.stats.ls - a.stats.ls
					|| a.id - b.id;
			};
		},

		/* RELOAD
		Prepares latest player data
		---------------------------------*/
		reload :function(){
			const self = this;
			this._items = {};
			this._holders = {};
			this._slotNums = {};

			KC3ShipManager.load();
			KC3GearManager.load();
			PlayerManager.loadBases();
			
			// Get squad names
			this.loadCleanedSquadNames();
			
			// Compile equipment holders
			for(const ctr in KC3ShipManager.list){
				const ship = KC3ShipManager.list[ctr];
				for(const idx in ship.items){
					this.checkShipSlotForItemHolder(idx, ship);
				}
				// No plane is able to be equipped in ex-slot for now
			}
			for(const ctr in PlayerManager.bases){
				this.checkLbasSlotForItemHolder(PlayerManager.bases[ctr]);
			}
			for(const ctr in PlayerManager.baseConvertingSlots){
				this._holders["s"+PlayerManager.baseConvertingSlots[ctr]] = "LbasMoving";
			}
			
			function GetMyHolder(){ return self._holders["s"+this.itemId]; }
			function NoHolder(){ return false; }
			
			// Compile ships on Index
			for(const ctr in KC3GearManager.list){
				// Clone gear object since property modifications followed
				const ThisItem = Object.assign(new KC3Gear(), KC3GearManager.list[ctr]);
				const MasterItem = ThisItem.master();
				if(!MasterItem) continue;
				
				// Add holder to the item object temporarily via function return
				if(this._holders["s"+ThisItem.itemId] !== undefined){
					ThisItem.MyHolder = GetMyHolder;
				}else{
					ThisItem.MyHolder = NoHolder;
				}
				
				// Check if slotitem_type is filled
				if(this._items["t"+MasterItem.api_type[3]] === undefined){
					this._items["t"+MasterItem.api_type[3]] = [];
				}
				const thisType = this._items["t"+MasterItem.api_type[3]];
				
				// Check if slotitem_id is filled
				if(thisType["s"+MasterItem.api_id] === undefined){
					thisType["s"+MasterItem.api_id] = {
						id: ThisItem.masterId,
						category_id: MasterItem.api_type[2],
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
							or: MasterItem.api_distance,
							rk: KC3GearManager.antiLandDiveBomberIds.includes(ThisItem.masterId) & 1,
							rm: KC3GearManager.highAltitudeInterceptorIds.includes(ThisItem.masterId) & 1,
							hk: KC3GearManager.evadeAntiAirFireIds.includes(ThisItem.masterId) & 1,
						},
						instances: []
					};
				}
				const thisMasterItem = thisType["s"+MasterItem.api_id];
				thisMasterItem.instances.push(ThisItem);
				// Compute fighter power when not equpped by a slot
				ThisItem.airpow = Math.qckInt("floor", thisMasterItem.stats.aa + (
					// Add improvement bonus to AA stat
					ConfigManager.air_formula == 1 ? 0 : ThisItem.aaStatImprovementBonus()
				) + (
					// Add Interception power to AA stat
					1.5 * (KC3GearManager.interceptorsType2Ids.includes(thisMasterItem.category_id) ?
						thisMasterItem.stats.ev : 0)
				), 1);
			}
			
			const sortSlotItem = (a, b) => (
				// order by proficiency desc first
				b.ace - a.ace || a.itemId - b.itemId
			);
			for( const i in this._items ){
				// make elements in this._items true Array
				for( const j in this._items[i] ){
					// sort item instances
					this._items[i][j].instances.sort(sortSlotItem);
					this._items[i].push( this._items[i][j] );
					delete this._items[i][j];
				}
				
				// sort MasterItem by stats
				this._items[i].sort(this.sortMasterItem);
			}
		},
		
		loadCleanedSquadNames :function(){
			try {
				this.squadNames = JSON.parse(localStorage.planes || "{}");
			} catch(e) {
				this.squadNames = {};
				console.log("Unexpected plane names in storage: " + localStorage.planes, e);
			} finally {
				// Clean entries with empty squadron name or non-existent plane item
				const isGearCached = KC3GearManager.count() > 0;
				Object.keys(this.squadNames).forEach(pkey => {
					if(!this.squadNames[pkey]
						|| (isGearCached && KC3GearManager.get(pkey.substr(1)).isDummy())) {
						delete this.squadNames[pkey];
					}
				});
				localStorage.planes = JSON.stringify(this.squadNames);
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
			for(const squad in LandBase.planes){
				if(LandBase.planes[squad].api_slotid > 0){
					this._holders["s"+LandBase.planes[squad].api_slotid] = LandBase;
				}
			}
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			const self = this;
			$(".tab_aircraft .item_stat img").each((_, img) => {
				$(img).attr("src", KC3Meta.statIcon($(img).parent().data("stat")));
			});
			$(".tab_aircraft .item_types .item_type img").each((_, img) => {
				$(img).attr("src", KC3Meta.itemIcon($(img).parent().data("type")));
			});
			$(".tab_aircraft .item_type").each((_, elm) => {
				$(elm).attr("title", KC3Meta.gearTypeName(3, $(elm).data("type")));
			});
			$(".tab_aircraft .item_type").on("click", function(e){
				KC3StrategyTabs.gotoTab(null, $(this).data("type"));
			});
			
			$(".tab_aircraft .item_list").on("change", ".instance_name input", function(e){
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
			
			(this._items["t"+type_id] || []).forEach(ThisSlotitem => {
				const ItemElem = $(".tab_aircraft .factory .slotitem").clone()
					.appendTo(".tab_aircraft .item_list");
				const masterId = ThisSlotitem.id;
				$(".icon img", ItemElem)
					.attr("src", KC3Meta.itemIcon(type_id))
					.attr("title", `[${masterId}]`)
					.attr("alt", masterId)
					.click(function(e){
						KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
					});
				$(".english", ItemElem).text(ThisSlotitem.english);
				$(".japanese", ItemElem).text(ThisSlotitem.japanese)
					.toggle(ConfigManager.language != "jp");
				if(KC3GearManager.interceptorsType3Ids.includes(Number(type_id))){
					$(".stats .item_ht", ItemElem).attr("title", KC3Meta.term("ShipAccAntiBomber"));
					$(".stats .item_ht img", ItemElem).attr("src", KC3Meta.statIcon("ib"));
					$(".stats .item_ev", ItemElem).attr("title", KC3Meta.term("ShipEvaInterception"));
					$(".stats .item_ev img", ItemElem).attr("src", KC3Meta.statIcon("if"));
				} else {
					$(".stats .item_ht", ItemElem).attr("title", KC3Meta.term("ShipAccuracy"));
					$(".stats .item_ht img", ItemElem).attr("src", KC3Meta.statIcon("ht"));
					$(".stats .item_ev", ItemElem).attr("title", KC3Meta.term("ShipEvasion"));
					$(".stats .item_ev img", ItemElem).attr("src", KC3Meta.statIcon("ev"));
				}
				
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
				this.slotitem_stat(ItemElem, ThisSlotitem, "rk");
				this.slotitem_stat(ItemElem, ThisSlotitem, "rm");
				this.slotitem_stat(ItemElem, ThisSlotitem, "hk");
				
				ThisSlotitem.instances.forEach(ThisPlane => {
					const rosterId = ThisPlane.itemId;
					let ThisCapacity = 0;
					
					const PlaneBox = $(".tab_aircraft .factory .instance").clone();
					$(".instances", ItemElem).append(PlaneBox);
					
					$(".instance_icon img", PlaneBox).attr("src", KC3Meta.itemIcon(type_id))
						.attr("title", `[${masterId}] #${rosterId}`);
					$(".instance_lock", PlaneBox).toggle(!ThisPlane.lock);
					
					if(ThisPlane.stars > 0){
						$(".instance_star span", PlaneBox).text( ThisPlane.stars > 9 ? "m" : ThisPlane.stars);
					} else {
						$(".instance_star img", PlaneBox).hide();
					}
					if(ThisPlane.ace > 0){
						$(".instance_chev img", PlaneBox).attr("src", "/assets/img/client/achev/"+ThisPlane.ace+".png");
					}else{
						$(".instance_chev img", PlaneBox).hide();
					}
					
					$(".instance_name input", PlaneBox)
						.attr("data-gearId", rosterId)
						.attr("title", "#" + rosterId);
					if(typeof this.squadNames["p"+rosterId] != "undefined"){
						$(".instance_name input", PlaneBox).val(this.squadNames["p"+rosterId]);
					}
					
					if(ThisPlane.MyHolder()){
						const holder = ThisPlane.MyHolder();
						if(holder instanceof KC3LandBase){
							$(".holder_pic img", PlaneBox).attr("src", KC3Meta.itemIcon(33));
							$(".holder_name", PlaneBox).removeAttr("title")
								.html(KC3Meta.term("AircraftListLbasWorld").format(holder.map));
							$(".holder_level", PlaneBox).text("#" + holder.rid);
							ThisCapacity = (holder.planes
								.find(s => s.api_slotid === rosterId) || {}).api_max_count || "?";
						} else if(holder === "LbasMoving"){
							$(".holder_pic img", PlaneBox).attr("src", KC3Meta.itemIcon(33));
							$(".holder_name", PlaneBox).removeAttr("title")
								.html(KC3Meta.term("AircraftListLbasMoving"));
							$(".holder_level", PlaneBox).text("");
							ThisCapacity = "";
						} else {
							$(".holder_pic img", PlaneBox)
								.attr("src", KC3Meta.shipIcon(holder.masterId))
								.attr("title", `[${holder.masterId}] #${holder.rosterId}`)
								.addClass("hover")
								.attr("alt", holder.masterId)
								.click(function(e){
									KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
								});
							$(".holder_name", PlaneBox).attr("title", holder.name())
								.text(holder.name());
							$(".holder_level", PlaneBox).text(KC3Meta.term("LevelShort") + holder.level);
							ThisCapacity = holder.slotSize(this._slotNums["s" + rosterId]);
						}
						if(ThisCapacity > 0){
							// Compute fighter power for ace & improvement according setting
							let MyFighterPowerText = "";
							if(ConfigManager.air_formula == 1){
								MyFighterPowerText = ThisPlane.fighterPower(ThisCapacity);
							}else{
								MyFighterPowerText = "~"+ThisPlane.fighterVeteran(ThisCapacity);
							}
							$(".instance_aaval", PlaneBox).text(MyFighterPowerText);
						}
						$(".instance_aaval", PlaneBox).addClass("activeSquad");
						$(".instance_slot", PlaneBox).text(ThisCapacity);
					}else{
						$(".holder_pic", PlaneBox).hide();
						$(".holder_name", PlaneBox).hide();
						$(".holder_level", PlaneBox).hide();
						$(".instance_aaval", PlaneBox).addClass("reserveSquad");
						$(".instance_aaval", PlaneBox).text(ThisPlane.airpow);
					}
				});
				
			});
			
		},
		
		/* Determine if an item has a specific stat
		--------------------------------------------*/
		slotitem_stat :function(ItemElem, SlotItem, statName){
			if(statName === "rk") {
				$(".stats .item_rk", ItemElem).toggle(!!SlotItem.stats.rk);
			} else if(statName === "rm") {
				$(".stats .item_rm", ItemElem).toggle(!!SlotItem.stats.rm);
			} else if(statName === "hk") {
				$(".stats .item_hk", ItemElem).toggle(!!SlotItem.stats.hk);
				if(!!SlotItem.stats.hk) {
					$(".stats .item_hk span", ItemElem).text(
						"x{0}/x{1}".format(KC3Meta.antiAirResistMods(SlotItem.id))
					).parent().width(70);
				}
			} else if(SlotItem.stats[statName] !== 0 && (statName !== "or" ||
				(statName === "or" && KC3GearManager.landBasedAircraftType3Ids.indexOf(SlotItem.type_id)>-1)
			)){
				$(".stats .item_"+statName+" span", ItemElem).text(
					statName === "rn" ? KC3Meta.gearRange(SlotItem.stats[statName]) : SlotItem.stats[statName]
				);
			}else{
				$(".stats .item_"+statName, ItemElem).hide();
			}
		}
		
	};
	
})();
