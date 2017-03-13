(function(){
	"use strict";

	KC3StrategyTabs.shipdrop = new KC3StrategyTab("shipdrop");

	
	
	//KC3StrategyTabs.shipdrop.definition = new KC3SortieLogs("shipdrop" , exexe);
	KC3StrategyTabs.shipdrop.definition = {
		tabSelf: KC3StrategyTabs.shipdrop,

		selectedWorld : 0,
		selectedMap : 0,
		maps : {},
		hash_world_to_index : {},
		ship_filter_checkbox : {},

		fresh_ship_drop : function(cworld , cmap){
			let self = this;
			let contentRoot = $(".tab_shipdrop .content_root");
			contentRoot.empty();
			let factory = $(".tab_shipdrop .factory");
			let hq = PlayerManager.hq.id;
			let world = parseInt(cworld);
			let subMap = parseInt(cmap);
			let sorties37_1;
			sorties37_1 = KC3Database.con.sortie.where("world").equals(world).and( data => data.mapnum === subMap && data.hq === hq);
			let dropTable = {};
			let pList = [];
			//first: get info from KC3Database and count the drop of different node
			sorties37_1.each( function(sortie) {
				let p = KC3Database.con.battle.where("sortie_id").equals(sortie.id).each( function(battle) {
					if (typeof dropTable[battle.node] === "undefined"){
						dropTable[battle.node] = {};
					}
					let tbl = dropTable[battle.node];
					if (typeof tbl[battle.drop] === "undefined") {
						tbl[battle.drop] = 0;
					}
					++ tbl[battle.drop];
				});
				pList.push(p);
			}).then( function() {
				Promise.all(pList).then( function() {
					let node_tot = {};
					$.each( dropTable, function(nodeNum, dropInfo) {
						let node = KC3Meta.nodeLetter(world,subMap,nodeNum);
						if(typeof node_tot[node] === "undefined") node_tot[node] = {};

						let keys = Object.keys( dropInfo );
						keys.sort( (ka,kb) => dropInfo[kb] - dropInfo[ka] );
						//handle the drop info
						$.each( keys, function(ind,mstId) {
							let count = dropInfo[mstId];
							let shipPanel = $(".ship", factory).clone();
							let name = KC3Master.ship(mstId).api_name || "<nothing>";
							if(mstId !== "0" && name != "<nothing>") {
								if(typeof node_tot[node][mstId] == "undefined") node_tot[node][mstId] = 0;
								node_tot[node][mstId] += count;
							}
							else {
								if(typeof node_tot[node][0] === "undefined") node_tot[node][0] = 0;
								node_tot[node][0] += count;
							}
						});
					});

					let keys_node = Object.keys( node_tot );
					keys_node.sort( (ka,kb) => ka - kb );
					$.each(keys_node , function(i , node) {
						var shipClickFunc = function(e){
							KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
						};
						let nodeDrop = $(".node_drop", factory).clone();
						$(".node_name", nodeDrop).text( "Node: " + node);
						let keys_ship = Object.keys( node_tot[node] );
						keys_ship.sort( (ka,kb) => ka - kb );
						let flag = false;
						$.each(keys_ship , function(i , ship_id) {
							let Master = KC3Master.ship(ship_id);
							let tmp_stype = Master.api_stype !== "undefined" ? Master.api_stype : 0;
							if(self.ship_filter_checkbox[tmp_stype] === true) {
								flag = true;
								let shipPanel = $(".ship", factory).clone();
								if (ship_id !== "0") {
									$("img", shipPanel).attr("src", KC3Meta.getIcon( ship_id ));
									$("img", shipPanel).attr("alt", ship_id);
									$("img", shipPanel).addClass("hover");
									$("img", shipPanel).click(shipClickFunc);
								} else {
									$("img", shipPanel).attr("src", "../../assets/img/ui/dark_shipdrop-x.png");
								}
								$(".drop_times", shipPanel).text( "x" + node_tot[node][ship_id] );
								shipPanel.appendTo( nodeDrop );
							}
						});
						if(flag) {
							nodeDrop.append( $('<div class="clear"></div>') );
							nodeDrop.appendTo( contentRoot );
						}
					});
				});
			});
		},
		
		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
			// TODO codes stub, remove this if nothing to do
		},
		
		/* RELOAD: optional
		Loads latest player or game data if needed.
		---------------------------------*/
		reload: function() {
			// TODO codes stub, remove this if nothing to do
			if(typeof localStorage.maps != "undefined"){
				this.maps = JSON.parse( localStorage.maps );
			}else{
				return false;
			}
		},

		listen: function() {
			var self = this;
			let world_list = $(".control_panel select.world_list");
			let map_list = $(".control_panel select.map_list");
			let map_clone = $(".factory option").clone();
			world_list.children().each(function(i , world){
				let world_value = world.value;
				self.hash_world_to_index[world_value] = world.dataset.world_num;
			});
			world_list.change(function(){
				self.selectedWorld = self.hash_world_to_index[this.value];
				map_list.empty();
				map_clone.appendTo(map_list);

				//update maps that can be selected
				let diffStr = ["E","N","H"];

				//update difficulty that can be selected
				$.each(self.maps , function(index , element){
					let cWorld = (""+element.id).substr(0, (""+element.id).length-1);
					let cMap = (""+element.id).substr((""+element.id).length-1);

					if(cWorld == self.selectedWorld){
						let map_clone = $(".factory option")
						.clone().text((cWorld>=10 ? "E" : cWorld)+" - "+cMap+(function(x){
							switch(x){
								case 1: case 2: case 3:
									return " " + diffStr[x-1];
								default:
									return "";
							}
						})(element.difficulty));
						 map_clone.attr("value" , cMap);
						 map_clone.appendTo(map_list);
					}
				});
			});

			map_list.change(function() {
				self.selectedMap = this.value;
				self.fresh_ship_drop(self.selectedWorld , self.selectedMap);
			});

		},

		gen_ship_filter : function() {
			let self = this;
			let sCtr, cElm;
			let cBox_filter = function() {
				return $(this).data("id") === "" + sCtr;
			};
			let cBox_on = function(cCtr , cBox) {
				$(".filter_box .filter_check" , cBox).toggle();
				if(self.ship_filter_checkbox[cCtr + ""])
					self.ship_filter_checkbox[cCtr + ""] = false;
				else
					self.ship_filter_checkbox[cCtr + ""] = true;
				self.fresh_ship_drop(self.selectedWorld , self.selectedMap);
			};

			for(sCtr in KC3Meta._stype){
				// stype 1, 12, 15 not used by shipgirl
				if(["1", "12", "15"].indexOf(sCtr) < 0){
					cElm = $(".tab_shipdrop .factory .ship_filter_type").clone().appendTo(".tab_shipdrop .filters .ship_types");
					cElm.data("id", sCtr);
					$(".filter_name", cElm).text(KC3Meta.stype(sCtr) != "??" ? KC3Meta.stype(sCtr) : "NULL");
					if(typeof self.ship_filter_checkbox[sCtr + ""] === "undefined")
						self.ship_filter_checkbox[sCtr + ""] = true;
					let cBox = $(".tab_shipdrop .filters .ship_types .ship_filter_type")
						.filter( cBox_filter );
					let cCtr = sCtr;
					cBox.on("click" , cBox_on.bind(this , cCtr , cBox));
				}
			}
		},

		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			// TODO codes stub, remove this if nothing to do
			this.listen();
			this.gen_ship_filter();
		},

		/* UPDATE: optional
		Partially update elements of the interface,
			possibly without clearing all contents first.
		Be careful! Do not only update new data,
			but also handle the old states (do cleanup).
		Return `false` if updating all needed,
			EXECUTE will be invoked instead.
		---------------------------------*/
		update: function(pageParams) {
			// Use `pageParams` for latest page hash values,
			// KC3StrategyTabs.pageParams keeps the old values for states tracking
			
			// TODO codes stub, remove this if nothing to do

			// Returning `true` means updating has been handled.
			return false;
		}
	};
})();
