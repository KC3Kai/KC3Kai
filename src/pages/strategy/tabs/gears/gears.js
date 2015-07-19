(function(){
	"use strict";
	
	KC3StrategyTabs.gears = new KC3StrategyTab("gears");
	
	KC3StrategyTabs.gears.definition = {
		tabSelf: KC3StrategyTabs.gears,
		
		_items: {},
		_holders: {},
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Compile equipment holders
			var ctr, ThisItem, MasterItem, ThisShip, MasterShip;
			for(ctr in KC3ShipManager.list){
				this.checkShipSlotForItemHolder(0, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(1, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(2, KC3ShipManager.list[ctr]);
				this.checkShipSlotForItemHolder(3, KC3ShipManager.list[ctr]);
			}
			
			// Compile ships on Index
			for(ctr in KC3GearManager.list){
				ThisItem = KC3GearManager.list[ctr];
				MasterItem = ThisItem.master();
				if(!MasterItem) continue;
				
				// Check if slotitem_type is filled
				if(typeof this._items["t"+MasterItem.api_type[3]] == "undefined"){
					this._items["t"+MasterItem.api_type[3]] = [];
				}
				
				// Check if slotitem_id is filled
				if(typeof this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id] == "undefined"){
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id] = {
						id: ThisItem.masterId,
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
							rn: MasterItem.api_leng
						},
						held: [],
						extras: [],
						arranged: {}
					};
				}
				
				var holder = this._holders["s"+ThisItem.itemId];
				
				// Add this item to the instances
				if(typeof this._holders["s"+ThisItem.itemId] != "undefined"){
					// Someone is holding it
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].held.push({
						id: ThisItem.itemId,
						level: ThisItem.stars,
						locked: ThisItem.lock,
						holder: holder,
					});
					
					if( !this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars] )
						this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars] = {
							holder: {},
							extraCount: 0,
							heldCount: 0
						};
					
					if( !this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].holder[holder.rosterId] )
						this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].holder[holder.rosterId] = {
							holder: holder,
							count: 0
						};
					
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].holder[holder.rosterId].count++;
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].heldCount++;
				}else{
					// It's an extra equip on inventory
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].extras.push({
						id: ThisItem.itemId,
						level: ThisItem.stars,
						locked: ThisItem.lock
					});
					
					if( !this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars] )
						this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars] = {
							holder: {},
							extraCount: 0,
							heldCount: 0
						};
					
					this._items["t"+MasterItem.api_type[3]]["s"+MasterItem.api_id].arranged[ThisItem.stars].extraCount++;
				}
			}
		},
		
		/* Check a ship's equipment slot of an item is equipped
		--------------------------------------------*/
		checkShipSlotForItemHolder :function(slot, ThisShip){
			if(ThisShip.items[slot] > -1){
				this._holders["s"+ThisShip.items[slot]] = ThisShip;
			}
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			$(".tab_gears .item_type").on("click", function(){
				$(".tab_gears .item_type").removeClass("active");
				$(this).addClass("active");
				self.showType($(this).data("type"));
			});
			
			$(".tab_gears .item_type").first().trigger("click");
		},
		
		/* Show slotitem type
		--------------------------------------------*/
		showType :function(type_id){
			$(".tab_gears .item_list").html("");
			
			function showEqList(arranged){
				if( !arranged[i].heldCount )
					return null;

				var els = $();
				for( var j in arranged[i].holder ){
					els = els.add(
						$('<div/>',{
							'class':	'holder',
							'html':		'<img src="'+KC3Meta.shipIcon(
												arranged[i].holder[j].holder.masterId,
												"../../assets/img/ui/empty.png"
											)+'"/>'
										+ '<font>'+arranged[i].holder[j].holder.name()+'</font>'
										+ '<span>Lv'+arranged[i].holder[j].holder.level+'</span>'
										+ '<span>x' +arranged[i].holder[j].count+ '</span>'
						})
					);
				}
				return els;
			}
			
			var ctr, ThisType, ItemElem, ThisSlotitem;
			for(ctr in this._items["t"+type_id]){
				ThisSlotitem = this._items["t"+type_id][ctr];
				
				ItemElem = $(".tab_gears .factory .slotitem").clone().appendTo(".tab_gears .item_list");
				$(".icon img", ItemElem).attr("src", "../../assets/img/items/"+type_id+".png");
				$(".english", ItemElem).text(ThisSlotitem.english);
				$(".japanese", ItemElem).text(ThisSlotitem.japanese);
				//$(".counts", ItemElem).html("You have <strong>"+(ThisSlotitem.held.length+ThisSlotitem.extras.length)+"</strong> (<strong>"+ThisSlotitem.held.length+"</strong> worn, <strong>"+ThisSlotitem.extras.length+"</strong> extras)");
				
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
				console.log(ThisSlotitem);
				
				
				
				for( var i in ThisSlotitem.arranged ){
					$('<dl/>')
						.append( $('<dt/>',{
								'class':	i === 0 ? 'base' : '',
								'html':		'<img src="../../assets/img/client/eqstar.png"><span>+' + i + '</span>'
							}).append( $('<small/>').html(
								'x' + (ThisSlotitem.arranged[i].heldCount + ThisSlotitem.arranged[i].extraCount)
								+ ( ThisSlotitem.arranged[i].heldCount
									? ' (' +ThisSlotitem.held.length+ ' Equipped, ' +ThisSlotitem.extras.length + ' Equippable)'
									: ''
								)
							) )
						)
						.append( $('<dd/>').append(showEqList(ThisSlotitem.arranged)) )
						.appendTo( ItemElem.children('.holders') );
				}
				
				$('<dl/>')
					.append( $('<dd/>').html(
						'Total ' + (ThisSlotitem.held.length+ThisSlotitem.extras.length)
						+ ( ThisSlotitem.held.length
							? ' (' +ThisSlotitem.held.length+ ' Equipped, ' +ThisSlotitem.extras.length + ' Equippable)'
							: ''
						)
					) )
					.appendTo( ItemElem.children('.holders') );
				/*
				for(holderCtr in ThisSlotitem.held){
					ThisHolder = ThisSlotitem.held[holderCtr];
					HolderElem = $(".tab_gears .factory .holder").clone();
					$(".holder_list", ItemElem).append(HolderElem);
					
					$(".holder_pic img", HolderElem).attr("src",
						KC3Meta.shipIcon(
							ThisHolder.holder.masterId,
							"../../assets/img/ui/empty.png"
						)
					);
					$(".holder_name", HolderElem).text(ThisHolder.holder.name());
					$(".holder_level", HolderElem).text("Lv"+ThisHolder.holder.level);
					
					if(ThisHolder.level==0){ $(".holder_star", HolderElem).hide(); }
					else{ $(".holder_star span", HolderElem).text(ThisHolder.level); }
				}
				
				for(holderCtr in ThisSlotitem.extras){
					ThisHolder = ThisSlotitem.extras[holderCtr];
					HolderElem = $(".tab_gears .factory .xholder").clone();
					$(".holder_list", ItemElem).append(HolderElem);
					
					$(".holder_icon img", HolderElem).attr("src", "../../assets/img/items/"+type_id+".png");
					
					if(ThisHolder.level==0){ $(".holder_star", HolderElem).hide(); }
					else{ $(".holder_star span", HolderElem).text(ThisHolder.level); }
				}
				*/
			}
			
		},
		
		/* Determine if an item has a specific stat
		--------------------------------------------*/
		slotitem_stat :function(ItemElem, stats, stat_name){
			if(stats[stat_name] !== 0){
				$(".stats .item_"+stat_name+" span", ItemElem).text(stats[stat_name]);
			}else{
				$(".stats .item_"+stat_name, ItemElem).hide();
			}
		}
		
	};
	
})();
