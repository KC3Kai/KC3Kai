var TabItems = {
	active: false,
	_items: {},
	_holders: {},
	
	/* onReady, initialize
	--------------------------------------------*/
	init :function(){
		if(this.active) return false; this.active = true;
		
		var ctr, ThisItem, MasterItem, ThisShip, MasterShip;
		
		app.Ships.load();
		app.Gears.load();
		
		// Compile equipment holders
		for(ctr in app.Ships.list){
			this.checkShipSlotForItemHolder(0, app.Ships.list[ctr]);
			this.checkShipSlotForItemHolder(1, app.Ships.list[ctr]);
			this.checkShipSlotForItemHolder(2, app.Ships.list[ctr]);
			this.checkShipSlotForItemHolder(3, app.Ships.list[ctr]);
		}
		
		// Compile ships on Index
		for(ctr in app.Gears.list){
			ThisItem = app.Gears.list[ctr];
			MasterItem = app.Master.slotitem(ThisItem.api_slotitem_id);
			
			// Check if slotitem_type is filled
			if(typeof this._items["t"+MasterItem.api_type[3]] == "undefined"){
				this._items["t"+MasterItem.api_type[3]] = [];
			}
			
			// Check if slotitem_id is filled
			if(typeof this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id] == "undefined"){
				this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id] = {
					id: MasterItem.api_id,
					english: MasterItem.english,
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
						rn: MasterItem.api_leng
					},
					held: [],
					extras: []
				};
			}
			
			// Add this item to the instances
			if(typeof this._holders["s"+ThisItem.api_id] != "undefined"){
				// Someone is holding it
				this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].held.push({
					id: ThisItem.api_id,
					level: ThisItem.api_level,
					locked: ThisItem.api_locked,
					holder: this._holders["s"+ThisItem.api_id],
				});
			}else{
				// It's an extra equip on inventory
				this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].extras.push({
					id: ThisItem.api_id,
					level: ThisItem.api_level,
					locked: ThisItem.api_locked
				});
			}
		}
		
		console.log(this._items);
	},
	
	/* Check a ship's equipment slot of an item is equipped
	--------------------------------------------*/
	checkShipSlotForItemHolder :function(slot, ThisShip){
		MasterShip = app.Master.ship(ThisShip.api_ship_id);
		if(ThisShip.api_slot[0] > -1){
			this._holders["s"+ThisShip.api_slot[0]] = {
				master: ThisShip.api_ship_id,
				level: ThisShip.api_lv,
				english: MasterShip.english
			};
		}
	},
	
	/* Show the page
	--------------------------------------------*/
	show :function(){
		var self = this;
		
		$(".page_items .item_type").on("click", function(){
			self.showType($(this).data("type"));
		});
		
		$(".page_items .item_type").first().trigger("click");
		
	},
	
	/* Show slotitem type
	--------------------------------------------*/
	showType :function(type_id){
		$(".page_items .item_list").html("");
		
		var ctr, ThisType, ItemElem;
		for(ctr in this._items["t"+type_id]){
			ThisSlotitem = this._items["t"+type_id][ctr];
			
			ItemElem = $(".page_items .factory .slotitem").clone().appendTo(".page_items .item_list");
			$(".icon img", ItemElem).attr("src", "../../assets/img/items/"+type_id+".png");
			$(".english", ItemElem).text(ThisSlotitem.english);
			$(".japanese", ItemElem).text(ThisSlotitem.japanese);
			
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "fp");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "tp");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "aa");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "ar");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "as");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "ev");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "ls");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "dv");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "ht");
			this.slotitem_stat(ItemElem, ThisSlotitem.stats, "rn");
			
			var holderCtr, ThisHolder, HolderElem;
			for(holderCtr in ThisSlotitem.held){
				ThisHolder = ThisSlotitem.held[holderCtr];
				HolderElem = $(".page_items .factory .holder").clone();
				$(".holder_list", ItemElem).append(HolderElem);
				
				$(".holder_pic img", HolderElem).attr("src",
					app.Assets.shipIcon(
						ThisHolder.holder.master,
						"../../assets/img/ui/empty.png"
					)
				);
				$(".holder_name", HolderElem).text(ThisHolder.holder.english);
				$(".holder_level", HolderElem).text("Lv"+ThisHolder.holder.level);
				
				if(ThisHolder.level==0){ $(".holder_star", HolderElem).hide(); }
				else{ $(".holder_star span", HolderElem).text(ThisHolder.level); }
				// console.log(ThisHolder);
			}
			
			for(holderCtr in ThisSlotitem.extras){
				ThisHolder = ThisSlotitem.extras[holderCtr];
				HolderElem = $(".page_items .factory .xholder").clone();
				$(".holder_list", ItemElem).append(HolderElem);
				
				$(".holder_icon img", HolderElem).attr("src", "../../assets/img/items/"+type_id+".png");
				
				if(ThisHolder.level==0){ $(".holder_star", HolderElem).hide(); }
				else{ $(".holder_star span", HolderElem).text(ThisHolder.level); }
				// console.log(ThisHolder);
			}
		}
		
	},
	
	/* Determine if an item has a specific stat
	--------------------------------------------*/
	slotitem_stat :function(ItemElem, stats, stat_name){
		if(stats[stat_name] != 0){
			$(".stats .item_"+stat_name+" span", ItemElem).text(stats[stat_name]);
		}else{
			$(".stats .item_"+stat_name, ItemElem).hide();
		}
	}
	
};