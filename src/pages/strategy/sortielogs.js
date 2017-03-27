(function(){
	"use strict";
	
	var
		BATTLE_INVALID = 0,
		BATTLE_BASIC   = 1,
		BATTLE_NIGHT   = 2,
		BATTLE_AERIAL  = 4,
		
		// Sortie Boss Node Indicator
		// FIXME: this is not for translation. to test sortie status
		SORTIE_STRING  = {
			faild : "Did not reach boss",
			fresh : "Did not able to hurt",
			graze : "Hurt the boss a little",
			light : "Lightly Damages the Boss",
			modrt : "Moderately Damages the Boss",
			heavy : "Heavily Damages the Boss",
			despe : "Leaves the boss below 10HP",
			endur : "Leaves the boss below 2HP",
			destr : "Completely destroys"
		};
	
	/* KC3 Sortie Logs
			Arguments:
			tabRefer -- StrategyTab object reference
			callable -- database function
	*/
	
	window.KC3SortieLogs = function(tabCode) {
		this.tabSelf        = KC3StrategyTabs[tabCode];
		
		this.maps           = {};
		this.selectedWorld  = 0;
		this.selectedMap    = 0;
		this.itemsPerPage   = 20;
		this.currentSorties = [];
		this.stegcover64 = "";
		this.exportingReplay = false;
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		this.init = function(){
		};

		/* RELOAD
		Prepares reloadable data
		---------------------------------*/
		this.reload = function(){
			if(typeof localStorage.maps != "undefined"){
				this.maps = JSON.parse( localStorage.maps );
			}else{
				return false;
			}
		};
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		this.execute = function(){
			var self = this;
			
			// On-click world menus
			$(".tab_"+tabCode+" .world_box").on("click", function(){
				if(!$(".world_text",this).text().length) { return false; }
				KC3StrategyTabs.gotoTab(null, $(this).data("world_num"));
			});
			
			// Toggleable world scroll
			$(".tab_"+tabCode+" .world_shift").on("click", function(){
				var le,cr,re;
				le = 0;
				cr = $(window).data("world_off");
				re = $(window).data("world_max");
				$(window).data("world_off",cr = Math.max(le,Math.min(re,(function(e){
					if(e.hasClass("disabled"))
						return cr;
					else if(e.hasClass("left"))
						return cr-1;
					else if(e.hasClass("right"))
						return cr+1;
					else
						return cr;
				})($(this)))));
				updateScrollItem("world", 116);
			});
			
			// On-click map menus
			$(".tab_"+tabCode+" .map_list").on("click", ".map_box", function(){
				KC3StrategyTabs.gotoTab(null, self.selectedWorld, $(this).data("map_num"));
			});
			
			// Toggleable map scroll
			$(".tab_"+tabCode+" .map_shift").on("click", function(){
				var le,cr,re;
				le = 0;
				cr = $(window).data("map_off");
				re = $(window).data("map_max");
				$(window).data("map_off",cr = Math.max(le,Math.min(re,(function(e){
					if(e.hasClass("disabled"))
						return cr;
					else if(e.hasClass("left"))
						return cr-1;
					else if(e.hasClass("right"))
						return cr+1;
					else
						return cr;
				})($(this)))));
				updateScrollItem("map", 97);
			});
			
			// On-click sortie ID export battle
			$(".sortie_list").on("click", ".sortie_dl", function(e){
				self.exportBattleImg(parseInt($(this).data("id")), e);
			});
			
			// On-click sortie toggles
			function toggleSortie(origin, globalSwitch) {
				var targetName = $(origin).data("target");
				var targetParent = globalSwitch ? $(".tab_"+tabCode+" .sortie_box") : $(origin).parent().parent().parent();
				var targetBox = targetParent.find("."+targetName);
				var expandedQualif = !$(origin).hasClass("sortie_toggle_in");
				var expandedBefore = $(".sortie_toggle.active:not(.sortie_toggle_in)",$(origin).parent()).length;
				var expandedAfter = $(".sortie_toggle.active:not(.sortie_toggle_in)",$(origin).parent()).length;
				
				if( $(origin).hasClass("active") ){
					$(origin).removeClass("active");
					if (globalSwitch) {
						targetParent.find("[data-target=" + targetName + "]").removeClass("active");
					}
					// Hide the target box
					targetBox.slideUp(undefined,function(){
						if(expandedQualif && expandedBefore < 1)
							targetParent.addClass("expanded");
					});
				} else {
					$(origin).addClass("active");
					if (globalSwitch) {
						targetParent.find("[data-target=" + targetName + "]").addClass("active");
					}
					// Show the target box
					targetBox.slideDown(undefined,function(){
						if(expandedQualif && expandedBefore < 1)
							targetParent.addClass("expanded");
					});
				}
				
				if(expandedQualif && expandedAfter < 1)
					targetParent.removeClass("expanded");
			}
			
			$(".tab_"+tabCode+" .sortie_list").on("click", ".sortie_box .sortie_toggles .sortie_toggle", function(){
				toggleSortie(this, false);
			});
			
			// On-click global sortie toggles
			$(".tab_"+tabCode+" .sortie_switcher").on("click", ".sortie_toggles .sortie_toggle", function(){
				toggleSortie(this, true);
			});

			if(!!KC3StrategyTabs.pageParams[1]){
				this.switchWorld(KC3StrategyTabs.pageParams[1],
					KC3StrategyTabs.pageParams[2]);
			} else {
				// Select default opened world
				this.switchWorld($(".tab_"+tabCode+" .world_box.active").data("world_num"));
			}
		};

		/* SWITCH WORLD
		Handle event on a world has been selected by clicking menu or by url
		---------------------------------*/
		this.switchWorld = function(worldNum, mapNum){
			var self = this;
			self.selectedWorld = Number(worldNum);
			$(".tab_"+tabCode+" .world_box").removeClass("active");
			$(".tab_"+tabCode+" .world_box[data-world_num={0}]".format(self.selectedWorld)).addClass("active");

			$(".tab_"+tabCode+" .map_list").empty().css("width","").css("margin-left","");
			$(".tab_"+tabCode+" .page_list").empty();
			$(".tab_"+tabCode+" .sortie_switcher").empty();
			$(".tab_"+tabCode+" .sortie_list").empty();
			var countWorlds = $(".tab_"+tabCode+" .world_box").length;
			var worldOffset = $(window).data("world_off");
			var selectOffset = $(".tab_"+tabCode+" .world_box[data-world_num={0}]".format(self.selectedWorld)).index();
			if(typeof worldOffset === "undefined"){
				$(window).data("world_off", Math.min(selectOffset, countWorlds-6));
			} else if(selectOffset < worldOffset){
				$(window).data("world_off", selectOffset);
			} else if(selectOffset >= 6+((tabCode=="maps")&1) && worldOffset < selectOffset-5){
				$(window).data("world_off", selectOffset-5);
			}
			$(window).data("world_max", Math.max(0, countWorlds-6));
			updateScrollItem("world", 116);

			if(self.selectedWorld !== 0){
				// Add all maps in this world selection
				var mapBox,countMaps;
				mapBox = $(".tab_"+tabCode+" .factory .map_box").clone().appendTo(".tab_"+tabCode+" .map_list");
				$(".map_title", mapBox)
					.text((function(x){
						return (x>=10) ? KC3Meta.term("StrategyEventGo") : ("All W"+x);
					})(self.selectedWorld));

				for(countMaps = 1;!!self.maps["m"+self.selectedWorld+countMaps];countMaps++){}
				$(".tab_"+tabCode+" .map_list").css("width",Math.max(7,countMaps)*100);

				mapBox.attr("data-map_num", 0);
				$(window).data("map_off", (self.selectedWorld > 10 && countMaps >= 8) ? 1 : 0);
				$(window).data("map_max", Math.max(0,countMaps-7));
				mapBox.addClass("empty");
				mapBox.addClass("active");

				updateScrollItem("map", 97);

				var diffStr = ["E","N","H"];
				// Check player's map list
				$.each(self.maps, function(index, element){
					var cWorld = (""+element.id).substr(0, (""+element.id).length-1);
					var cMap = (""+element.id).substr((""+element.id).length-1);

					// If this map is part of selected world
					if(cWorld == self.selectedWorld){
						mapBox = $(".tab_"+tabCode+" .factory .map_box").clone().appendTo(".tab_"+tabCode+" .map_list");
						mapBox.attr("data-map_num", cMap);
						$(".map_title", mapBox).text((cWorld>=10 ? "E" : cWorld)+" - "+cMap+(function(x){
							switch(x){
								case 1: case 2: case 3:
									return " " + diffStr[x-1];
								default:
									return "";
							}
						})(element.difficulty));

						// Check unselected difficulty
						if(cWorld >= 10 && !element.difficulty) {
							mapBox.addClass("noclearnogauge");
							$(".map_hp_txt", mapBox).text("No difficulty");
						} else {
							// EASY MODO STRIKES BACK
							if(ConfigManager.info_troll && element.difficulty==1) {
								mapBox.addClass("easymodokimoi");
							}
							// If this map is already cleared
							if(element.clear == 1){
								$(".map_hp_txt", mapBox).text("Cleared!");
								mapBox.addClass("cleared");
								if (cWorld>=10) {
									mapBox.addClass((function(x){
										switch(x){
											case 1:
												return "easy";
											case 2:
												return "normal";
											case 3:
												return "hard";
											default:
												return "";
										}
									})(element.difficulty));
								}
								if(typeof element.maxhp != "undefined")
									$(".map_hp_txt", mapBox).lazyInitTooltip()
										.attr("title", "{0} / {1}".format(element.curhp, element.maxhp));
								else if(!!KC3Meta.gauge(element.id))
									$(".map_hp_txt", mapBox).lazyInitTooltip()
										.attr("title", "{0} kills".format(KC3Meta.gauge(element.id)));
							}else{
								mapBox.addClass("notcleared");
								// If HP-based gauge
								if(typeof element.maxhp != "undefined"){
									// want to approach last kill as JUST DO IT instead leaving 1HP only.
									// but recent boss changes form for possible last dance and HP becomes lesser,
									// so only show it on 1HP, leave exact left HP shown even < element.baseHp.
									if(element.curhp > 1){
										if((element.maxhp === 9999) || (element.curhp === 9999))
											$(".map_hp_txt", mapBox).text( "???? / ????" );
										else
											$(".map_hp_txt", mapBox).text( "{0} / {1}".format(element.curhp, element.maxhp) );
										$(".map_bar", mapBox).css("width", ((element.curhp/element.maxhp)*80)+"px");
									}else{
										mapBox.addClass("noclearnogauge");
										if(ConfigManager.info_troll)
											mapBox
												.addClass("justdoit")
												.attr("title", "Just kill her already, yesterday you said tommorow! JUST DO IT!!!"); // placeholder class...
										$(".map_hp_txt", mapBox).text(KC3Meta.term("StrategyEvents1HP"))
											.attr("title", "{0} < {1} / {2}".format(element.curhp, element.baseHp, element.maxhp))
											.lazyInitTooltip();
									}
								// If kill-based gauge
								}else{
									var totalKills = KC3Meta.gauge( element.id );
									var killsLeft = totalKills - element.kills;
									if(totalKills){
										if(killsLeft > 1)
											$(".map_hp_txt", mapBox).text( "{0} / {1} kills left".format(killsLeft, totalKills) );
										else
											$(".map_hp_txt", mapBox).text( KC3Meta.term("StrategyEvents1HP") )
												.attr("title", "{0} / {1}".format(killsLeft, totalKills))
												.lazyInitTooltip();
										$(".map_bar", mapBox).css("width", ((killsLeft/totalKills)*80)+"px");
									} else {
										mapBox.addClass("noclearnogauge");
										$(".map_hp_txt", mapBox).text("Not cleared");
									}
								}
							}

						}
					}
				});

				$("<div>").addClass("clear").appendTo(".tab_"+tabCode+" .map_list");
				if(!mapNum){
					self.switchMap($(".tab_"+tabCode+" .map_list .map_box.active").data("map_num"));
				} else {
					self.switchMap(mapNum);
				}
			}else{
				self.showMap();
			}
		};

		/* SWITCH MAP
		Handle event on a map has been selected by clicking menu or by url
		---------------------------------*/
		this.switchMap = function(mapNum){
			var self = this;
			self.selectedMap = Number(mapNum);
			$(".tab_"+tabCode+" .map_box").removeClass("active");
			$(".tab_"+tabCode+" .map_box[data-map_num={0}]".format(self.selectedMap)).addClass("active");
			self.showMap();
		};
		
		/* SHOW MAP
		A map has been selected
		---------------------------------*/
		this.showMap = function(){
			var self = this;
			this.pageNum = 1;
			$(".tab_"+tabCode+" .page_list").html("");
			$(".tab_"+tabCode+" .sortie_list").html("");
			
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.count_normal_sorties(function(countSorties){
					self.showPagination(countSorties);
					self.showSwitcher(countSorties);
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.count_world(this.selectedWorld, function(countSorties){
						console.log("count_world", countSorties);
						self.showPagination(countSorties);
						self.showSwitcher(countSorties);
					});
					
				// Selected specifc map
				}else{
					KC3Database.count_map(this.selectedWorld, this.selectedMap, function(countSorties){
						console.log("count_map", countSorties);
						self.showPagination(countSorties);
						self.showSwitcher(countSorties);
					});
				}
			}
		};
		
		/* SHOW PAGINATION
		Show list of clickable page boxes
		---------------------------------*/
		this.showPagination = function(countSorties){
			var self = this;
			var countPages = Math.ceil( countSorties / this.itemsPerPage );
			$(".tab_"+tabCode+" .page_list").html('<ul class="pagination pagination-sm"></ul>');
			
			if(countPages > 0){
				$(".tab_"+tabCode+" .pagination").twbsPagination({
					totalPages: countPages,
					visiblePages: 9,
					onPageClick: function (event, page) {
						self.pageNum = page;
						self.showPage();
					}
				});
				self.pageNum = 1;
				self.showPage();
				$(".tab_"+tabCode+" .page_list")
					.prepend('<div class="sortie_count">Total pages: {0}, sorties: {1}</div>'
						.format(countPages, countSorties));
			}else{
				$(".tab_"+tabCode+" .pagination").hide();
			}
		};

		/* SHOW SORTIE SWITCHER
		Show controls for global switching in all sorties
		-------------------------------------------------*/
		this.showSwitcher = function(countSorties) {
			var self = this;
			var sortie_switcher;
			
			if (countSorties > 0) {
				sortie_switcher = $(".tab_"+tabCode+" .factory .sortie_column.sortie_toggles").clone().appendTo(".tab_"+tabCode+" .sortie_switcher");
			}
		};
		
		
		/* SHOW PAGE
		Determines list type and gets data from IndexedDB
		---------------------------------*/
		this.showPage = function(){
			var self = this;
			$(".tab_"+tabCode+" .pagination").show();
			$(".tab_"+tabCode+" .sortie_list").empty();
			
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.get_normal_sorties(this.pageNum, this.itemsPerPage, function( sortieList ){
					self.showList( sortieList );
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.get_world(this.selectedWorld, this.pageNum, this.itemsPerPage, function( sortieList ){
						self.showList( sortieList );
					});
					
				// Selected specifc map
				}else{
					KC3Database.get_map(this.selectedWorld, this.selectedMap, this.pageNum, this.itemsPerPage, function( sortieList ){
						self.showList( sortieList );
					});
				}
			}
		};
		
		/* SHOW LIST
		Shows sorties on interface using list of collected sortie objects
		---------------------------------*/
		this.showList = function( sortieList ){
			var self = this;
			// Show sortie records on list
			var sortieBox, fleets, fleetkey, mainFleet, isCombined, rshipBox, nodeBox, thisNode, sinkShips;
			var shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			$.each(sortieList, function(id, sortie){
				try {
					var skey = ["m",sortie.world,sortie.mapnum].join('');
					// Create sortie box
					sortieBox = $(".tab_"+tabCode+" .factory .sortie_box").clone().appendTo(".tab_"+tabCode+" .sortie_list");
					if(sortie.world >= 10) {
						sortie.diff = sortie.diff || (maps[skey] || {difficulty:0}).difficulty || 0;
					}
					if((sortie.diff || 0) > 0)
						$(sortieBox)
							.addClass("sortie_rank_"+sortie.diff)
							.attr("data-diff",KC3Meta.term("EventHistoryRank"+sortie.diff));
					$(".sortie_id", sortieBox).text( sortie.id );
					$(".sortie_dl", sortieBox).data("id", sortie.id);
					$(".sortie_date", sortieBox).text( new Date(sortie.time*1000).format("mmm d") );
					$(".sortie_date", sortieBox).attr("title", new Date(sortie.time*1000).format("yyyy-mm-dd HH:MM:ss") );
					$(".sortie_map", sortieBox).text( (sortie.world >= 10 ? "E" : sortie.world) + "-" + sortie.mapnum );
					
					fleetkey = ["main","escort","preboss","boss"];
					fleets   = [
						sortie.fleetnum,
						(((sortie.fleetnum==1)&&(parseInt(sortie.combined))) ? 2 : 0),
						sortie.support1,
						sortie.support2
					];
					sinkShips = [[],[]];
					// Show main fleet faces
					$(".sortie_ship", sortieBox).hide();
					fleets.forEach(function(n,i){
						if(!n) {
							$(".rfleet_"+fleetkey[i], sortieBox).addClass("disabled");
							return false;
						}
						var selFleet = sortie["fleet"+n];
						$.each(selFleet, function(index, ship){
							// false recorded on older sorties. stop loop when encountered
							if(i===0) {
								if(ship===false){ return false; }
								
								$(".sortie_ship_"+(index+1)+" img", sortieBox).attr("src", KC3Meta.shipIcon(ship.mst_id));
								$(".sortie_ship_"+(index+1)+" img", sortieBox).attr("alt", ship.mst_id);
								$(".sortie_ship_"+(index+1)+" img", sortieBox).click(shipClickFunc);
								$(".sortie_ship_"+(index+1), sortieBox).addClass("hover");
								$(".sortie_ship_"+(index+1), sortieBox).addClass("simg-"+ship.mst_id);
								$(".sortie_ship_"+(index+1), sortieBox).show();
							}
							
							rshipBox = $(".tab_"+tabCode+" .factory .rfleet_ship").clone();
							$(".rfleet_pic img", rshipBox)
								.attr("src", KC3Meta.shipIcon(ship.mst_id) )
								.click(function(){
									var ref = $(this).parent().parent();
									if($(".rfleet_detail",ref).css("display")=="none") {
										$(".rfleet_detail",ref).show();
										$(".rfleet_equips",ref).hide();
									} else {
										$(".rfleet_detail",ref).hide();
										$(".rfleet_equips",ref).show();
									}
								});
							$(".rfleet_name", rshipBox).html( KC3Meta.shipName( KC3Master.ship(ship.mst_id).api_name ) );
							$(".rfleet_level", rshipBox).html( KC3Meta.term("LevelText")+" "+ship.level);
							
							ship.equip.filter(function(x){return x>0;})
								.forEach(function(x,i){
									var masterGear = KC3Master.slotitem(x);
									$(".rfleet_equips .rfleet_equip.rfleet_equip_"+(i+1),rshipBox)
										.find('img')
										.attr("src","../../assets/img/items/" + masterGear.api_type[3] + ".png")
										.attr("title",KC3Meta.gearName(masterGear.api_name));
								});/* comment stopper */
							$(".rfleet_detail", rshipBox).show();
							$(".rfleet_equips", rshipBox).hide();
							
							$(".rfleet_"+fleetkey[i]+" .rfleet_body", sortieBox).append( rshipBox );
						});
						$(".rfleet_"+fleetkey[i]+" .rfleet_body", sortieBox).append( $("<div>").addClass("clear") 
						);
					});
					
					// console.log("sortie.battles", sortie.battles);
					
					// For each battle
					if(sortie.battles.length===0){
						$(".sortie_edges", sortieBox).append("<div class=\"nonodes\">Unable to record nodes</div>");
						$(".sortie_edge ", sortieBox).hide();
						
						
					}else{
						$.each(sortie.battles, function(index, battle){
							var battleData, battleType;
							
							// Determine if day or night battle node
							if(typeof battle.data.api_dock_id != "undefined"){
								battleData = battle.data;
								battleType = BATTLE_BASIC;
							}else if(typeof battle.data.api_deck_id != "undefined"){
								battleData = battle.data;
								battleType = BATTLE_BASIC;
							}else if(typeof battle.yasen.api_deck_id != "undefined"){
								battleData = battle.yasen;
								battleType = BATTLE_NIGHT;
							}else{
								battleType = BATTLE_INVALID;
								return true;
							}
							var airRaidLostKind = (battle.airRaid || {}).api_lost_kind;
							var baseTotalDamage = battle.airRaid && battle.airRaid.api_air_base_attack
									&& battle.airRaid.api_air_base_attack.api_stage3
									&& battle.airRaid.api_air_base_attack.api_stage3.api_fdam ?
									Math.floor(battle.airRaid.api_air_base_attack.api_stage3.api_fdam.slice(1).reduce(function(a,b){return a+b;},0))
								: 0;
							
							battle.shizunde |= [[],[]];
							
							// Show on node list
							$(".sortie_edge_"+(index+1), sortieBox).addClass("active");
							$(".sortie_edge_"+(index+1), sortieBox).html( KC3Meta.nodeLetter( sortie.world, sortie.mapnum, battle.node ) );
							
							// HTML elements
							nodeBox = $(".tab_"+tabCode+" .factory .sortie_nodeinfo").clone();
							$(".node_id", nodeBox).text( KC3Meta.nodeLetter( sortie.world, sortie.mapnum, battle.node ) );
							if(airRaidLostKind > 0){
								$(".node_id", nodeBox).addClass(airRaidLostKind === 4 ? "nodamage" : "damaged");
								// Show Enemy Air Raid damage
								if(airRaidLostKind != 4){
									$(".node_id", nodeBox).attr("title",
										KC3Meta.term("BattleAirBaseLossTip").format(baseTotalDamage, Math.round(baseTotalDamage * 0.9 + 0.1)));
								}
							} else {
								$(".node_id", nodeBox).removeClass("nodamage damaged");
							}
							
							// Result Icons
							$(".node_formation img", nodeBox).attr("src", KC3Meta.formationIcon(battleData.api_formation[0]) );
							$(".node_formation", nodeBox).attr("title", KC3Meta.formationText(battleData.api_formation[0]) );
							$(".node_rating img", nodeBox).attr("src", "../../assets/img/client/ratings/"+battle.rating+".png");
							
							// Kanmusu Drop
							if(battle.drop > 0){
								$(".node_drop img", nodeBox).attr("src", KC3Meta.shipIcon( battle.drop ) );
								$(".node_drop img", nodeBox).attr("alt", battle.drop);
								$(".node_drop img", nodeBox).click(shipClickFunc);
								$(".node_drop", nodeBox).addClass("hover");
							}else{
								$(".node_drop img", nodeBox).attr("src", "../../assets/img/ui/shipdrop-x.png");
							}
							
							// Enemies
							$(".node_eformation img", nodeBox).attr("src", KC3Meta.formationIcon(battleData.api_formation[1]) );
							$(".node_eformation", nodeBox).attr("title", KC3Meta.formationText(battleData.api_formation[1]) );
							$.each(battleData.api_ship_ke, function(index, eship){
								if(eship > -1){
									$(".node_eship_"+(index+1)+" img", nodeBox).attr("src", KC3Meta.abyssIcon( eship ) );
									$(".node_eship_"+(index+1), nodeBox).attr("title", KC3Meta.abyssShipName( eship) );
									$(".node_eship_"+(index+1)+" img", nodeBox).attr("alt", eship);
									$(".node_eship_"+(index+1)+" img", nodeBox).click(shipClickFunc);
									$(".node_eship_"+(index+1), nodeBox).addClass("hover");
									$(".node_eship_"+(index+1), nodeBox).removeClass(KC3Meta.abyssShipBorderClass());
									$(".node_eship_"+(index+1), nodeBox).addClass(KC3Meta.abyssShipBorderClass(eship));
									$(".node_eship_"+(index+1), nodeBox).show();
								}
							});
							
							// Process Battle
							PlayerManager.combinedFleet = sortie.combined;
							thisNode = (new KC3Node()).defineAsBattle();
							if(typeof battle.data.api_dock_id != "undefined"){
								thisNode.engage( battleData, sortie.fleetnum );
							}else if(typeof battle.data.api_deck_id != "undefined"){
								thisNode.engage( battleData, sortie.fleetnum );
							}else if(typeof battle.yasen.api_deck_id != "undefined"){
								thisNode.engageNight( battleData, sortie.fleetnum );
							}
							
							sinkShips[0].concat(battle.shizunde[0]);
							sinkShips[1].concat(battle.shizunde[1]);
							
							// Support Exped/LBAS Triggered
							if(thisNode.supportFlag || thisNode.lbasFlag){
								$(".node_support img", nodeBox).attr("src", "../../assets/img/ui/support.png");
								if(thisNode.supportFlag && !!battleData.api_support_info){
									var fleetId = (battleData.api_support_info.api_support_airatack||{}).api_deck_id
										|| (battleData.api_support_info.api_support_hourai||{}).api_deck_id || "?";
									$(".node_support .exped", nodeBox).text(fleetId);
									$(".node_support .exped", nodeBox).show();
								}
								$(".node_support .lbas", nodeBox).toggle(thisNode.lbasFlag);
								$(".node_support", nodeBox).attr("title", thisNode.buildSupportAttackMessage(thisNode));
							}else{
								$(".node_support img", nodeBox).attr("src", "../../assets/img/ui/support-x.png");
							}
							
							// Conditions
							$(".node_engage", nodeBox).text( thisNode.engagement[2] );
							$(".node_engage", nodeBox).addClass( thisNode.engagement[1] );
							$(".node_contact", nodeBox).text(thisNode.fcontact +" vs "+thisNode.econtact);
							
							// Day Battle-only data
							if((battleType & BATTLE_NIGHT) === 0){
								$(".node_detect", nodeBox).text( thisNode.detection[0] );
								$(".node_detect", nodeBox).addClass( thisNode.detection[1] );
								
								$(".node_airbattle", nodeBox).text( thisNode.airbattle[0] );
								$(".node_airbattle", nodeBox).addClass( thisNode.airbattle[1] );
								$(".node_airbattle", nodeBox).attr("title",
									thisNode.buildAirPowerMessage()
								);
								
								["Fighters","Bombers"].forEach(function(planeType){
									["player","abyssal"].forEach(function(side,jndex){
										var nodeName = ".node_"+(planeType[0])+(side[0]=='p' ? 'F' : 'A');
										// Plane total counts
										$(nodeName+"T",nodeBox).text(thisNode["plane"+planeType][side][0]);
										// Plane losses
										if(thisNode["plane"+planeType][side][1] > 0)
											$(nodeName+"L",nodeBox).text("-"+thisNode["plane"+planeType][side][1]);
									});
								});
								$(".node_planes", nodeBox).attr("title", thisNode.buildAirBattleLossMessage());
							}
							
							// Node EXP
							[["base","nodal"],["hq","hq"]].forEach(function(x){
								if(!!battle[x[0]+"EXP"]) {
									$(".node_exp."+x[1]+" span",nodeBox).text(battle[x[0]+"EXP"]);
								} else {
									$(".node_exp."+x[1],nodeBox).css("visibility",'hidden');
								}
							});
							
							// Add box to UI
							$(".sortie_nodes", sortieBox).append( nodeBox );
						});
						
					}
					
					$(".sortie_nodes", sortieBox).append( $("<div>").addClass("clear") );
					
					var
						mstat = self.maps[skey].stat,
						sstat = $(".sortie_stat", sortieBox),
						kstat = ["now","max"];
					if(mstat && sstat.length) {
						var
							isHClear = mstat.onClear == sortie.id,
							isCtBomb = mstat.onError.indexOf(sortie.id) >= 0,
							stateKey = Object.keys(SORTIE_STRING).filter(function(statKey){
								return (mstat.onBoss[statKey] || []).indexOf(sortie.id) >= 0;
							}).shift();
						try {
							if(mstat.onBoss.hpdat[sortie.id]){
								mstat.onBoss.hpdat[sortie.id].forEach(function(v,i){
									$([".boss.",kstat[i],"hp"].join(''),sstat).text(v);
								});
							}
							$(".sortie_end_clear",sstat).css('visibility',isHClear ? 'visible' : '');
							$(".sortie_end_error",sstat).css('visibility',isCtBomb ? 'visible' : '');
							$(".sortie_end_final",sstat)
								.attr('title',SORTIE_STRING[stateKey || 'faild'])
								.attr("src",
									["../../../../assets/img/ui/estat_boss",stateKey || 'fresh',".png"].join('')
								)
								.css('opacity',1 / (1 + !stateKey));
						} catch (e) {
							throw e;
						}
					}
				}catch(e){console.error(e.stack);}
			});
			
			$(".tab_"+tabCode+" .sortie_list").createChildrenTooltips();
		};
		
		function updateScrollItem(worldMap, itemWidth) {
			var
				le = 0,
				cr = $(window).data(worldMap + "_off"),
				re = $(window).data(worldMap + "_max");
			if(cr<=le)
				$(".tab_"+tabCode+" ."+worldMap+"_shift.left").addClass("disabled");
			else
				$(".tab_"+tabCode+" ."+worldMap+"_shift.left").removeClass("disabled");
			
			if(cr>=re)
				$(".tab_"+tabCode+" ."+worldMap+"_shift.right").addClass("disabled");
			else
				$(".tab_"+tabCode+" ."+worldMap+"_shift.right").removeClass("disabled");
			
			$(".tab_"+tabCode+" ."+worldMap+"_list").css("margin-left",(cr * -itemWidth) + "px");
		}
		
		/* EXPORT REPLAY IMAGE
		-------------------------------*/
		this.exportBattleImg = function(sortieId, e){
			if(this.exportingReplay) return false;
			this.exportingReplay = true;
			
			var self = this;
			
			$("body").css("opacity", "0.5");
			
			if(this.stegcover64===""){
				this.stegcover64 = $.ajax({
					async: false,
					url: "../../../../assets/img/stegcover.b64"
				}).responseText;
			}
			
			var withDataCover64 = this.stegcover64;
			
			var rcanvas = document.createElement("canvas");
			rcanvas.width = 400;
			rcanvas.height = 400;
			var rcontext = rcanvas.getContext("2d");
			
			var domImg = new Image();
			domImg.onload = function(){
				rcontext.drawImage( domImg, 0, 0, 400, 400, 0, 0, 400, 400 );
				
				KC3Database.get_sortie_data( sortieId, function(sortieData){
					if(sortieData.battles.length===0){
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return false;
					}
					
					if(e.shiftKey) {
						window.open("https://kc3kai.github.io/kancolle-replay/battleplayer.html#" + encodeURIComponent(JSON.stringify(sortieData), "_blank"));
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return true;
					}

					console.log("Downloading reply", sortieId, ", data:", sortieData);
					rcontext.font = "26pt Calibri";
					rcontext.fillStyle = '#ffffff';
					rcontext.fillText(sortieData.world+"-"+sortieData.mapnum, 20, 215);
					
					rcontext.font = "20pt Calibri";
					rcontext.fillStyle = '#ffffff';
					rcontext.fillText(PlayerManager.hq.name, 100, 210);
					
					var fleetUsed = sortieData["fleet"+sortieData.fleetnum];
					var shipIconImage;
					$.each(fleetUsed, function(ShipIndex, ShipData){
						shipIconImage = $(".simg-"+ShipData.mst_id+" img")[0];
						rcontext.drawImage(shipIconImage,0,0,70,70,25+(60*ShipIndex),233,50,50);
					});
					
					withDataCover64 = rcanvas.toDataURL("image/png");
					
					steg.encode(JSON.stringify(sortieData), withDataCover64, {
						success: function(newImg){
							chrome.downloads.download({
								url: newImg,
								filename: ConfigManager.ss_directory+'/replay/'+PlayerManager.hq.name+"_"+sortieId+'.png',
								conflictAction: "uniquify"
							}, function(downloadId){
								self.exportingReplay = false;
								$("body").css("opacity", "1");
							});
						},
						error: function(e){
							console.error("Failed to encode replay data by", e, e.stack);
							self.exportingReplay = false;
							$("body").css("opacity", "1");
							return false;
						}
					});
					
				});
				
			};
			domImg.src = this.stegcover64;
			
		};
		
	};
	
})();
