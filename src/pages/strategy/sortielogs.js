(function(){
	"use strict";
	
	var
		BATTLE_INVALID = 0,
		BATTLE_BASIC   = 1,
		BATTLE_NIGHT   = 2,
		BATTLE_AERIAL  = 4,
		BATTLE_NIGHT2DAY = 8,
		
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
		this.scrollVars     = {};
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		this.init = function(){
			this.locale = KC3Translation.getLocale();
		};

		/* RELOAD
		Prepares reload-able data
		---------------------------------*/
		this.reload = function(){
			ConfigManager.load();
			this.maps = JSON.parse(localStorage.maps || "{}");
			this.exportingReplay = false;
			this.enterCount = 0;
			this.itemsPerPage = ConfigManager.sr_items_per_page || 20;
		};

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		this.execute = function(){
			const self = this;
			this.scrollVars[tabCode] = this.scrollVars[tabCode] || {};
			this.loadWorldsFromStorage();
			
			// On-click world menus
			$(".tab_"+tabCode+" .world_list .world_box").on("click", function(){
				if(!$(".world_text",this).text().length) { return false; }
				KC3StrategyTabs.gotoTab(null, $(this).data("world_num"));
			});
			
			// Toggle-able world scroll
			$(".tab_"+tabCode+" .world_shift").on("click", function(){
				var le = 0;
				var cr = self.scrollVars[tabCode].world_off;
				var re = self.scrollVars[tabCode].world_max;
				self.scrollVars[tabCode].world_off = (cr = Math.max(le, Math.min(re, (function(e){
					if(e.hasClass("disabled"))
						return cr;
					else if(e.hasClass("left"))
						return cr - 1;
					else if(e.hasClass("right"))
						return cr + 1;
					else
						return cr;
				})($(this)))));
				updateScrollItem(self.scrollVars[tabCode], "world", tabCode === "maps" ? 87 : 116);
			});
			
			// On-click map menus
			$(".tab_"+tabCode+" .map_list").on("click", ".map_box", function(){
				KC3StrategyTabs.gotoTab(null, self.selectedWorld, $(this).data("map_num"));
			});
			
			// Toggle-able map scroll
			$(".tab_"+tabCode+" .map_shift").on("click", function(){
				var le = 0;
				var cr = self.scrollVars[tabCode].map_off;
				var re = self.scrollVars[tabCode].map_max;
				self.scrollVars[tabCode].map_off = (cr = Math.max(le, Math.min(re, (function(e){
					if(e.hasClass("disabled"))
						return cr;
					else if(e.hasClass("left"))
						return cr - 1;
					else if(e.hasClass("right"))
						return cr + 1;
					else
						return cr;
				})($(this)))));
				updateScrollItem(self.scrollVars[tabCode], "map", 97);
			});
			
			// On-click sortie ID export battle
			$(".sortie_list").on("click contextmenu", ".sortie_dl", function(e){
				e.preventDefault();
				self.exportBattleImg(parseInt($(this).data("id")), e);
			});
			
			// On-click single sortie toggles
			$(".tab_"+tabCode+" .sortie_list").on("click", ".sortie_box .sortie_toggles .sortie_toggle", function(){
				self.toggleSortie(this, false);
			});
			
			// On-click batch sortie toggles
			$(".tab_"+tabCode+" .sortie_batch_toggles").append(
				$(".tab_"+tabCode+" .factory .sortie_column.sortie_toggles").clone()
			).createChildrenTooltips().on("click", ".sortie_toggles .sortie_toggle", function(){
				self.toggleSortie(this, true);
			});
			
			// Select sorties per page
			$(".tab_"+tabCode+" .sortie_per_page select").on("change", function(){
				ConfigManager.load();
				ConfigManager.sr_items_per_page = Number($(this).val()) || 20;
				ConfigManager.save();
				self.itemsPerPage = ConfigManager.sr_items_per_page;
				self.showMap();
			}).val(self.itemsPerPage);
			
			// Toggle between boss node arrival only and with all nodes
			$(".tab_"+tabCode+" .sortie_batch_toggles .boss_node_toggle").on("click", function(){
				ConfigManager.load();
				ConfigManager.sr_show_boss_node = !ConfigManager.sr_show_boss_node;
				ConfigManager.save();
				$(this).toggleClass("active", ConfigManager.sr_show_boss_node);
				self.showMap();
			}).toggleClass("active", ConfigManager.sr_show_boss_node);
			
			// Toggle between battle nodes only and with non-battle nodes
			$(".tab_"+tabCode+" .sortie_batch_toggles .non_battle_toggle").on("click", function(){
				ConfigManager.load();
				ConfigManager.sr_show_non_battle = !ConfigManager.sr_show_non_battle;
				ConfigManager.save();
				$(this).toggleClass("active", !ConfigManager.sr_show_non_battle);
				self.showMap();
			}).toggleClass("active", !ConfigManager.sr_show_non_battle);
			
			// Toggle between using predictions to get taiha/chuuha/sunk state
			$(".tab_"+tabCode+" .sortie_batch_toggles .show_new_shipstate_toggle").on("click", function(){
				ConfigManager.load();
				ConfigManager.sr_show_new_shipstate = !ConfigManager.sr_show_new_shipstate;
				ConfigManager.save();
				$(this).toggleClass("active", ConfigManager.sr_show_new_shipstate);
				self.showMap();
			}).toggleClass("active", ConfigManager.sr_show_new_shipstate);
			
			// Toggle between using predictions to get yasen states
			$(".tab_"+tabCode+" .sortie_batch_toggles .show_yasen_shipstate_toggle").on("click", function(){
				ConfigManager.load();
				ConfigManager.sr_show_yasen_shipstate = !ConfigManager.sr_show_yasen_shipstate;
				ConfigManager.save();
				$(this).toggleClass("active", ConfigManager.sr_show_yasen_shipstate);
				self.showMap();
			}).toggleClass("active", ConfigManager.sr_show_yasen_shipstate);
			
			if(!!KC3StrategyTabs.pageParams[1]){
				this.switchWorld(KC3StrategyTabs.pageParams[1], KC3StrategyTabs.pageParams[2]);
			} else {
				// Select default opened world
				this.switchWorld($(".tab_"+tabCode+" .world_list .world_box.active").data("world_num"));
			}
		};

		/**
		 * Load missing world info from localStorage if any.
		 */
		this.loadWorldsFromStorage = function(){
			var missingWorldCount = 0;
			var lastWorldId = 0;
			Object.keys(this.maps).sort((id1, id2) => {
					const m1 = id1.slice(-1), m2 = id2.slice(-1);
					let w1 = id1.slice(1, -1), w2 = id2.slice(1, -1);
					if(w1 === "7") w1 = "3.5";
					if(w2 === "7") w2 = "3.5";
					return Number(w1) - Number(w2) || Number(m1) - Number(m2);
				}).map(id => (Number(id.slice(1,-1))
				)).filter((w, idx, arr) => (idx > 0 ? w !== arr[idx - 1] : true
				)).filter(w => (KC3Meta.isEventWorld(w) == (tabCode === "event")
				)).forEach(id => {
					lastWorldId = id;
					const worldBox = $(".tab_{0} .world_list .world_box[data-world_num={1}]".format(tabCode, id));
					if(!worldBox.length) {
						missingWorldCount += 1;
						const newWorldBox = $(".tab_{0} .factory .world_box".format(tabCode)).clone();
						newWorldBox.attr("data-world_num", id);
						// Only World ID here, no l10n since text might be too long
						$(".world_text", newWorldBox).text("World-" + id);
						$(".tab_{0} .world_list .clear".format(tabCode)).before(newWorldBox);
					}
				});
			// Auto active latest event world if active is old
			if(tabCode === "event") {
				const oldActive = $(".tab_{0} .world_list .world_box.active".format(tabCode)).data("world_num");
				if(!oldActive || lastWorldId > Number(oldActive)) {
					$(".tab_{0} .world_list .world_box".format(tabCode)).removeClass("active");
					$(".tab_{0} .world_list .world_box[data-world_num={1}]".format(tabCode, lastWorldId)).addClass("active");
				}
			}
			return missingWorldCount;
		};

		// Common sortie toggling method
		this.toggleSortie = function(origin, globalSwitch) {
			var targetName = $(origin).data("target");
			var targetParent = globalSwitch ? $(".tab_"+tabCode+" .sortie_box") : $(origin).parent().parent().parent();
			var targetBox = targetParent.find("."+targetName);
			var expandedQualif = !$(origin).hasClass("sortie_toggle_in");
			var expandedBefore = $(".sortie_toggle.active:not(.sortie_toggle_in)",$(origin).parent()).length;
			
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
			
			var expandedAfter = $(".sortie_toggle.active:not(.sortie_toggle_in)",$(origin).parent()).length;
			if(expandedQualif && expandedAfter < 1)
				targetParent.removeClass("expanded");
		};

		/* SWITCH WORLD
		Handle event on a world has been selected by clicking menu or by url
		---------------------------------*/
		this.switchWorld = function(worldNum, mapNum){
			const self = this;
			self.selectedWorld = Number(worldNum);
			$(".tab_"+tabCode+" .world_list .world_box").removeClass("active");
			$(".tab_"+tabCode+" .world_list .world_box[data-world_num={0}]".format(self.selectedWorld)).addClass("active");

			$(".tab_"+tabCode+" .map_list").empty().css("width","").css("margin-left","");
			$(".tab_"+tabCode+" .page_list").empty();
			$(".tab_"+tabCode+" .sortie_list").empty();
			var countWorlds = $(".tab_"+tabCode+" .world_list .world_box").length;
			var maxDispWorlds = 6 + (tabCode === "maps" ? 2 : 0);
			var worldOffset = self.scrollVars[tabCode].world_off;
			var selectOffset = $(".tab_"+tabCode+" .world_list .world_box[data-world_num={0}]".format(self.selectedWorld)).index();
			if(worldOffset === undefined){
				self.scrollVars[tabCode].world_off = Math.min(selectOffset, countWorlds - maxDispWorlds);
			} else if(selectOffset < worldOffset){
				self.scrollVars[tabCode].world_off = selectOffset;
			} else if(selectOffset >= maxDispWorlds && worldOffset < selectOffset - maxDispWorlds - 1){
				self.scrollVars[tabCode].world_off = selectOffset - maxDispWorlds - 1;
			}
			self.scrollVars[tabCode].world_max = Math.max(0, countWorlds - maxDispWorlds);
			updateScrollItem(self.scrollVars[tabCode], "world", tabCode === "maps" ? 87 : 116);

			if(self.selectedWorld !== 0){
				// As IndexedDB real-time updated, also load Storage maps
				self.maps = JSON.parse(localStorage.maps || "{}");
				// Add all maps in this world selection
				var mapBox,countMaps;
				mapBox = $(".tab_"+tabCode+" .factory .map_box").clone().appendTo(".tab_"+tabCode+" .map_list");
				$(".map_title", mapBox)
					.text((function(x){
						return KC3Meta.isEventWorld(x) ? KC3Meta.term("StrategyEventGo") : KC3Meta.term("StrategyNormalMapGo").format(x);
					})(self.selectedWorld));

				for(countMaps = 1;!!self.maps["m"+self.selectedWorld+countMaps];countMaps++){}
				$(".tab_"+tabCode+" .map_list").css("width",Math.max(7,countMaps)*100);

				mapBox.attr("data-map_num", 0);
				self.scrollVars[tabCode].map_off = countMaps >= 8 ? 1 : 0;
				self.scrollVars[tabCode].map_max = Math.max(0, countMaps - 7);
				mapBox.addClass("empty");
				mapBox.addClass("active");

				updateScrollItem(self.scrollVars[tabCode], "map", 97);

				const diffStr = [
					KC3Meta.term("EventRankCasualAbbr"),
					KC3Meta.term("EventRankEasyAbbr"),
					KC3Meta.term("EventRankNormalAbbr"),
					KC3Meta.term("EventRankHardAbbr")
				];
				// Check player's map list
				$.each(self.maps, function(index, element){
					var cWorld = (""+element.id).substr(0, (""+element.id).length-1);
					var cMap = (""+element.id).substr((""+element.id).length-1);

					// If this map is part of selected world
					if(cWorld == self.selectedWorld){
						mapBox = $(".tab_"+tabCode+" .factory .map_box").clone().appendTo(".tab_"+tabCode+" .map_list");
						mapBox.attr("data-map_num", cMap);
						$(".map_title", mapBox).text( (cWorld>=10 ? "E" : cWorld) + "-" + cMap + " " +
						(function(x, w){
							return diffStr[x - (w >= 41 ? 1 : 0)] || "";
						})(element.difficulty, cWorld));

						// Check unselected difficulty
						if(KC3Meta.isEventWorld(cWorld) && !element.difficulty) {
							mapBox.addClass("noclearnogauge");
							$(".map_hp_txt", mapBox).text("No difficulty");
						} else {
							// EASY MODO STRIKES BACK
							if(ConfigManager.info_troll && element.difficulty==1) {
								mapBox.addClass("easymodokimoi");
							}
							// If this map is already cleared
							if(element.clear == 1 && !element.killsRequired){
								$(".map_hp_txt", mapBox).text(KC3Meta.term("BattleHistoryMapCleared"));
								mapBox.addClass("cleared");
								if (cWorld>=10) {
									mapBox.addClass((function(x, w){
										// New difficulty 'Casual' added since Winter 2018, and ID shifted +1
										if(w >= 41){
											return ["", "casual", "easy", "normal", "hard"][x] || "";
										} else {
											return ["", "easy", "normal", "hard"][x] || "";
										}
									})(element.difficulty, cWorld));
								}
								if(typeof element.maxhp != "undefined")
									$(".map_hp_txt", mapBox).lazyInitTooltip()
										.attr("title", "{0} / {1}".format(element.curhp, element.maxhp));
								else if(!!KC3Meta.gauge(element.id))
									$(".map_hp_txt", mapBox).lazyInitTooltip()
										.attr("title", KC3Meta.term("BattleHistoryKillsReqTip").format(element.killsRequired || KC3Meta.gauge(element.id)));
							}else{
								mapBox.addClass("notcleared");
								// If HP-based gauge
								if(typeof element.maxhp != "undefined"){
									// want to approach last kill as JUST DO IT instead leaving 1HP only.
									// but recent boss changes form for possible last dance and HP becomes lesser,
									// so only show it on 1HP, leave exact left HP shown even < element.baseHp.
									if(element.curhp > 1 || element.kind === "gauge-tp"){
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
									var totalKills = element.killsRequired || KC3Meta.gauge( element.id );
									var killsLeft = totalKills - element.kills;
									if(totalKills){
										if(killsLeft > 1)
											$(".map_hp_txt", mapBox).text( KC3Meta.term("BattleHistoryKillsProgress").format(killsLeft, totalKills) );
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
				updateScrollItem(self.scrollVars[tabCode], "map", 97);
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
		
		/* A callback function to add more filtering conditions to database query.
		---------------------------------*/
		this.sortieFilter = function(sortie){
			return !ConfigManager.sr_show_boss_node ||
				// here judges by node event_id: 5 just like in-game and Node.js does,
				// although there is `.boss` property in battle records, but lower performance by doing more table query
				// known behavior: sorties which reached boss but no battle result recorded (eg: catbomb or F5) will hit still
				(Array.isArray(sortie.nodes) && sortie.nodes.some(
					node => node.eventId == 5
					// treat W1-6-N node as boss
					|| (node.eventId == 8 && sortie.world == 1 && sortie.mapnum == 6)
				));
		};
		
		/* SHOW MAP
		A map has been selected
		---------------------------------*/
		this.showMap = function(){
			var self = this;
			this.pageNum = 1;
			this.enterCount += 1;
			// Because showPage() is using async DB operation and time expensive (ofen > 1000ms),
			// to prevent executing and adding elements to list duplicatedly
			// when switch between worlds/maps quickly, should stop to re-enter it.
			var expectedEnterCount = this.enterCount;
			$(".tab_"+tabCode+" .page_list").empty();
			$(".tab_"+tabCode+" .sortie_list").empty();
			$(".tab_"+tabCode+" .sortie_controls").hide();
			
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.count_normal_sorties(this.sortieFilter, function(countSorties){
					console.debug("Count of All", ConfigManager.sr_show_boss_node ? "Boss:" : ":", countSorties);
					if(expectedEnterCount === self.enterCount)
						self.showPagination(countSorties);
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.count_world(this.selectedWorld, this.sortieFilter,
					function(countSorties){
						console.debug("Count of World", self.selectedWorld, ConfigManager.sr_show_boss_node ? "Boss:" : ":", countSorties);
						if(expectedEnterCount === self.enterCount)
							self.showPagination(countSorties);
					});
					
				// Selected specific map
				}else{
					KC3Database.count_map(this.selectedWorld, this.selectedMap, this.sortieFilter,
					function(countSorties){
						console.debug("Count of Map", self.selectedWorld, self.selectedMap, ConfigManager.sr_show_boss_node ? "Boss:" : ":", countSorties);
						if(expectedEnterCount === self.enterCount)
							self.showPagination(countSorties);
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
			var twbsPageObj;
			if(countPages > 0){
				twbsPageObj = $(".tab_"+tabCode+" .pagination").twbsPagination({
					totalPages: countPages,
					visiblePages: 9,
					first: KC3Meta.term("TwbsPaginationFirstLabel"),
					prev: KC3Meta.term("TwbsPaginationPrevLabel"),
					next: KC3Meta.term("TwbsPaginationNextLabel"),
					last: KC3Meta.term("TwbsPaginationLastLabel"),
					onPageClick: function(event, page) {
						// only reload on different page, as event also triggered after init or enabled
						if(self.pageNum != page){
							self.showPage(page, twbsPageObj);
						}
					}
				});
				self.showPage(1, twbsPageObj);
				$(".tab_"+tabCode+" .sortie_controls .sortie_count").text(
					KC3Meta.term("BattleHistoryPagingInfoLine").format(countPages, countSorties)
				);
				$(".tab_"+tabCode+" .sortie_controls").show();
			}else{
				$(".tab_"+tabCode+" .pagination").hide();
			}
		};
		
		/* SHOW PAGE
		Determines list type and gets data from IndexedDB
		---------------------------------*/
		this.showPage = function(page, twbsPageObj){
			var self = this;
			var startTime = Date.now();
			this.pageNum = page || 1;
			var postShowList = function(){
				var showPageTime = Date.now() - startTime;
				console.debug("Showing sortie history list took", showPageTime, "milliseconds");
				if(twbsPageObj) twbsPageObj.twbsPagination("enable");
			};
			// Prevent to quickly switch on pagination
			if(twbsPageObj) twbsPageObj.twbsPagination("disable");
			$(".tab_"+tabCode+" .pagination").show();
			$(".tab_"+tabCode+" .sortie_list").empty();
			
			// Show all sorties
			if(this.selectedWorld === 0){
				KC3Database.get_normal_sorties(this.sortieFilter, this.pageNum, this.itemsPerPage, function( sortieList ){
					self.showList( sortieList );
					postShowList();
				});
				
			// Selected specific world
			}else{
				// Show all on this world
				if(this.selectedMap === 0){
					KC3Database.get_world(this.selectedWorld, this.sortieFilter, this.pageNum, this.itemsPerPage,
					function( sortieList ){
						self.showList( sortieList );
						postShowList();
					});
					
				// Selected specific map
				}else{
					KC3Database.get_map(this.selectedWorld, this.selectedMap, this.sortieFilter, this.pageNum, this.itemsPerPage,
					function( sortieList ){
						self.showList( sortieList );
						postShowList();
					});
				}
			}
		};
		
		/* SHOW LIST
		Shows sorties on interface using list of collected sortie objects
		---------------------------------*/
		this.showList = function( sortieList ){
			const self = this;
			// Show sortie records on list
			var sortieBox, fleets, fleetkey, mainFleet, isCombined, rshipBox, nodeBox, thisNode, sinkShips;
			const shipNameEquipSwitchFunc = function(e){
				var ref = $(this).parent().parent();
				if($(".rfleet_detail",ref).css("display") === "none") {
					$(".rfleet_detail",ref).show();
					$(".rfleet_equips",ref).hide();
				} else {
					$(".rfleet_detail",ref).hide();
					$(".rfleet_equips",ref).show();
				}
			};
			const shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			const viewFleetAtManagerFunc = function(e) {
				const id = $(this).data("id");
				if(!id) return;
				if(e.metaKey || e.ctrlKey) {
					const url = chrome.runtime.getURL("/pages/strategy/strategy.html") + `#fleet-history-${id}`;
					chrome.tabs.create({ url, active: true });
				} else {
					KC3StrategyTabs.gotoTab("fleet", "history", id);
				}
			};
			const exportImageBuilder = function () {
				const id = $(this).data("id");
				if(!id) return;
				KC3ImageBuilder.exportSortie(id);
			};
			const exportAirSimulator = function () {
				const id = $(this).data("id");
				if(!id) return;
				KC3ImageBuilder.exportSortie(id, "kcweb", "aircalc", true);
			};
			const exportJervisOr = function () {
				const id = $(this).data("id");
				if(!id) return;
				KC3ImageBuilder.exportSortie(id, "jervis", "fleethub", true);
			};
			const parseAirRaidFunc = function(airRaid, heavyAirRaid) {
				if(!airRaid) return {airRaidLostKind: 0};
				if(airRaid.api_air_base_attack) {
					//console.debug("LB Air Raid", airRaid);
					// Whoever wanna do whatever? such as dump enemy info
					if(typeof window.dumpLandbaseAirRaid === "function")
						window.dumpLandbaseAirRaid.call(self, airRaid, heavyAirRaid);
				}
				let damageArray = Object.getSafePath(airRaid, "api_air_base_attack.api_stage3.api_fdam") || [];
				// FIXME Handle all waves from heavy air raids
				// here simple sum all damages again
				if(heavyAirRaid) {
					damageArray = [];
					heavyAirRaid.api_destruction_battle.map(wave =>
						Object.getSafePath(wave, "api_air_base_attack.api_stage3.api_fdam") || [])
						.forEach(arr => { damageArray.push(...arr); });
				}
				const baseTotalDamage = damageArray.reduce((sum, n) => sum + Math.max(0, Math.floor(n)), 0);
				const planePhase = Object.getSafePath(airRaid, "api_air_base_attack.api_stage1") || {};
				const airState = planePhase.api_disp_seiku === undefined ? 99 : planePhase.api_disp_seiku;
				let airStateText = KC3Meta.airbattle(airState)[2] || KC3Meta.airbattle(airState)[0];
				// list up all air states from every waves
				if(heavyAirRaid) {
					airStateText = "[{0}]".format(heavyAirRaid.api_destruction_battle.map(wave =>
						Object.getSafePath(wave, "api_air_base_attack.api_stage1.api_disp_seiku") || 99)
						.map(seiku => KC3Meta.airbattle(airState)[2] || "?").join(","));
				}
				const enemyPlaneLost = planePhase.api_e_count > 0 ?
					Math.qckInt("round", planePhase.api_e_lostcount / planePhase.api_e_count * 100, 1) : 0;
				const bomberPhase = Object.getSafePath(airRaid, "api_air_base_attack.api_stage3") || {};
				const defenderSquads = Object.getSafePath(airRaid, "api_air_base_attack.api_map_squadron_plane");
				const topAbSquadSlots = [0, 0, 0, 0];
				// Fill up Anti-bombing squadron slots with LBF/LBI master ID, highest AB stat as priority
				// See https://www.reddit.com/r/kancolle/comments/7ziide/discussion_newly_discovered_mechanics_of_lbas_air/
				// http://ja.kancolle.wikia.com/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89:1140#60
				if(defenderSquads){
					for(const idx in topAbSquadSlots){
						for(const base in defenderSquads){
							// Check if defender plane is non-zeroed LBF/LBI
							const basePlaneId = (defenderSquads[base][idx] || {}).api_mst_id;
							if(basePlaneId > 0 && defenderSquads[base][idx].api_count > 0
								&& KC3GearManager.interceptorsType2Ids.includes(KC3Master.slotitem(basePlaneId).api_type[2])){
								const topPlaneId = topAbSquadSlots[idx];
								// Use higher AB stat plane, `api_houm` is the Anti-bombing stat
								if(topPlaneId === 0 ||
									KC3Master.slotitem(basePlaneId).api_houm >
									KC3Master.slotitem(topPlaneId).api_houm){
									topAbSquadSlots[idx] = basePlaneId;
								}
							}
						}
					}
				}
				const topAbSquadsName = topAbSquadSlots.map(id =>
					id > 0 ? KC3Meta.gearName(KC3Master.slotitem(id).api_name) : KC3Meta.term("None")
				);
				const eships = airRaid.api_ship_ke || [];
				const airpow = KC3Calc.enemyFighterPower(eships, airRaid.api_eSlot, undefined, true);
				const airpowIntervals = KC3Calc.fighterPowerIntervals(airpow[0]);
				if(Object.keys(airpow[4]).length) {
					// add a question mark if there is inferring exception
					airpowIntervals[0] = "{0}?".format(airpowIntervals[0]);
				}
				let lostKindId = airRaid.api_lost_kind || 0;
				if(heavyAirRaid) {
					lostKindId = ((arr) => (
						arr.includes(2) || arr.includes(1) && arr.includes(3) ? 2 :
						arr.includes(1) ? 1 :
						arr.includes(3) ? 3 :
						arr.includes(4) ? 4 : 0
					))(heavyAirRaid.api_destruction_battle.map(wave => wave.api_lost_kind));
				}
				return {
					airRaidLostKind: lostKindId,
					baseTotalDamage: baseTotalDamage,
					resourceLossAmount: Math.round(baseTotalDamage * 0.9 + 0.1),
					eships: eships,
					eFighterPowers: airpowIntervals,
					airState: airStateText,
					isTorpedoBombingFound: (bomberPhase.api_frai_flag || []).includes(1),
					isDiveBombingFound: (bomberPhase.api_fbak_flag || []).includes(1),
					shotdownPercent: enemyPlaneLost,
					topAntiBomberSquadSlots: topAbSquadSlots,
					topAntiBomberSquadNames: topAbSquadsName,
					heavyDefenseRequest: heavyAirRaid ? heavyAirRaid.api_scc : undefined,
				};
			};
			const showSortieLedger = function(sortieId, sortieBox, sortieWorld) {
				// LBAS consumption not accurate, as they contain plane swap and sortie cost of next sortie, but sortie cost should be the same for back-to-back sorties
				// Akashi repair not included either, belonged to its own type
				const buildConsumptionArray = arr => arr.reduce((acc, o) =>
					acc.map((v, i) => acc[i] + (o.data[i] || 0)), [0, 0, 0, 0, 0, 0, 0, 0]);
				const buildLedgerMessage = consumption => {
					return consumption.map((v, i) => {
						const icon = $("<img />").attr("src", "/assets/img/client/" +
							["fuel.png", "ammo.png", "steel.png", "bauxite.png",
								"ibuild.png", "bucket.png", "devmat.png", "screws.png"][i]
						).width(13).height(13).css("margin", "-3px 2px 0 0");
						return i < 4 || !!v ? $("<div/>").append(icon).append(v).html() : "";
					}).join(" ");
				};
				KC3Database.con.navaloverall.where("type").equals("sortie" + sortieId).toArray(arr => {
					const consumption = buildConsumptionArray(arr);
					if(arr.length && !consumption.every(v => !v)) {
						const tooltip = buildLedgerMessage(consumption);
						if(KC3Meta.isEventWorld(sortieWorld) || sortieWorld === 6) {
							let lbTooltip = "";
							KC3Database.con.navaloverall.where("type").equals("sortie" + (sortieId - 1)).first(firstEntry => {
							KC3Database.con.navaloverall.offset(firstEntry.id)
								.until(entry => entry.type === "sortie" + (sortieId + 1))
								.and(entry => "lbas" + sortieWorld === entry.type)
								.toArray(lbArr => {
									const lbConsumption = buildConsumptionArray(lbArr);
									if(lbArr.length && !lbConsumption.every(v => !v)) {
										lbTooltip = buildLedgerMessage(lbConsumption);
									}
								}).then(() => $(".sortie_map", sortieBox).attr("titlealt",
									(!lbTooltip ? "{0}" : KC3Meta.term("BattleHistoryFleetAndLbasCostTip"))
										.format(tooltip, lbTooltip)).lazyInitTooltip()
								);
							});
						} else {
							$(".sortie_map", sortieBox).attr("titlealt",
								"{0}".format(tooltip)).lazyInitTooltip();
						}
					}
				});
			};
			$.each(sortieList, function(id, sortie){
				const mapkey = ["m", sortie.world, sortie.mapnum].join(''),
					mapInfo = self.maps[mapkey] || {};
				//console.debug("list.sortie", id, sortie);
				try {
					// Create sortie box
					sortieBox = $(".tab_"+tabCode+" .factory .sortie_box").clone().appendTo(".tab_"+tabCode+" .sortie_list");
					if(KC3Meta.isEventWorld(sortie.world)) {
						sortie.diff = sortie.diff || mapInfo.difficulty || 0;
					}
					if((sortie.diff || 0) > 0) {
						const rankMarker = ((d, w) => w >= 41 ? (d === 1 ? "1C" : d - 1) : d)(sortie.diff, sortie.world);
						$(sortieBox).addClass("sortie_ranks")
							.addClass("sortie_rank_" + rankMarker)
							.attr("data-diff", KC3Meta.term("EventHistoryRank" + rankMarker));
					}
					$(".sortie_id", sortieBox).text(sortie.id)
						.data("id", sortie.id).on("click", viewFleetAtManagerFunc);
					$(".sortie_dl", sortieBox).data("id", sortie.id);
					const sortieTime = sortie.time * 1000;
					$(".sortie_date", sortieBox).text( new Date(sortieTime).format("mmm d", false, self.locale) );
					$(".sortie_date", sortieBox).attr("title", new Date(sortieTime).format("yyyy-mm-dd HH:MM:ss") );
					$(".sortie_map", sortieBox).text( (KC3Meta.isEventWorld(sortie.world) ? "E" : sortie.world) + "-" + sortie.mapnum );
					showSortieLedger(sortie.id, sortieBox, sortie.world);
					$(".button_tomanager", sortieBox)
						.data("id", sortie.id)
						.on("click", viewFleetAtManagerFunc);
					$(".export_img_builder", sortieBox)
						.data("id", sortie.id)
						.on("click", exportImageBuilder);
					$(".export_kcweb", sortieBox)
						.data("id", sortie.id)
						.on("click", exportAirSimulator);
					$(".export_jervis", sortieBox)
						.data("id", sortie.id)
						.on("click", exportJervisOr);
					var edges = [];
					if(sortie.nodes && ConfigManager.sr_show_non_battle) {
						$.each(sortie.nodes, function(index, node) {
							const letter = KC3Meta.nodeLetter(sortie.world, sortie.mapnum, node.id, sortieTime);
							const isBattle = node.type === "battle";
							const battleKind = KC3Node.knownNodeExtraClasses(true)
								.map(s => s.substr(3))[node.eventKind];
							edges.push(node.id);
							$(".sortie_edge_"+(index+1), sortieBox)
								.addClass("edge_" + node.type)
								.addClass((isBattle && battleKind) || "")
								.toggleClass("non_battle", !isBattle)
								.attr("title", node.desc || "")
								.text(letter)
								.toggleClass("long_name", String(letter).length > 2);

							if(node.airRaid || node.heavyAirRaid) {
								// Adding air raids to all nodes, including non battle ones
								const destBattle = node.heavyAirRaid ? node.heavyAirRaid.api_destruction_battle.slice(-1)[0] : node.airRaid;
								//if(node.heavyAirRaid) { console.debug(node.heavyAirRaid); }
								const airRaid = parseAirRaidFunc(destBattle, node.heavyAirRaid);
								if(airRaid.airRaidLostKind > 0) {
									$(".sortie_edge_"+(index+1), sortieBox)
										.addClass(airRaid.airRaidLostKind === 4 ? "nodamage" : "damaged");
									// Show Enemy Air Raid damage
									let oldTitle = $(".sortie_edge_"+(index+1), sortieBox).attr("title") || "";
									oldTitle += oldTitle ? "\n" : "";
									// Prepended info for super heavy air raid
									if(airRaid.heavyDefenseRequest !== undefined) {
										oldTitle += KC3Meta.term("BattleHistoryHeavyAirRaidTip")
											.format(airRaid.heavyDefenseRequest, JSON.stringify(airRaid.eships)) + "\n";
									}
									oldTitle += KC3Meta.term("BattleHistoryAirRaidTip").format(
										airRaid.baseTotalDamage,
										KC3Meta.airraiddamage(airRaid.airRaidLostKind),
										airRaid.resourceLossAmount,
										airRaid.airState,
										"{0}%".format(airRaid.shotdownPercent),
										KC3Meta.term(airRaid.isTorpedoBombingFound ? "BattleContactYes" : "BattleContactNo"),
										KC3Meta.term(airRaid.isDiveBombingFound ? "BattleContactYes" : "BattleContactNo"),
										airRaid.topAntiBomberSquadNames[0], airRaid.topAntiBomberSquadNames[1],
										airRaid.topAntiBomberSquadNames[2], airRaid.topAntiBomberSquadNames[3],
										KC3Meta.term("InferredFighterPower").format(airRaid.eFighterPowers)
									);
									$(".sortie_edge_"+(index+1), sortieBox).attr("title", oldTitle);
								}
							}

							if(index === 5) {
								$(".sortie_edges", sortieBox).removeClass("one_line").addClass("two_lines");
							}
							if(index === 10) {
								$(".sortie_edges", sortieBox).addClass("more_edges");
								$(".sortie_edges .extra_node", sortieBox).show();
							}
						});
					}
					
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
						if(selFleet.length === 7)
							sortieBox.toggleClass("seven_ships");
						$.each(selFleet, function(index, ship){
							// false recorded on older sorties. stop loop when encountered
							if(ship === false) { return false; }
							if(i === 0) {
								$(".sortie_ship_"+(index+1)+" img", sortieBox)
									.attr("src", KC3Meta.shipIcon(ship.mst_id))
									.attr("alt", ship.mst_id)
									.click(shipClickFunc)
									.css("visibility", "visible");
								$(".sortie_ship_"+(index+1), sortieBox)
									.addClass("hover")
									.addClass("simg-"+ship.mst_id)
									.toggleClass("seven_ships", selFleet.length === 7)
									.show();
							} else if(i === 1) {
								$(".sortie_combined_ship_"+(index+1)+" img", sortieBox)
									.attr("src", KC3Meta.shipIcon(ship.mst_id))
									.attr("alt", ship.mst_id)
									.click(shipClickFunc)
									.css("visibility", "visible");
								$(".sortie_combined_ship_"+(index+1), sortieBox)
									.addClass("hover")
									.addClass("simg-"+ship.mst_id)
									.show();
								$(".sortie_ship_"+(index+1), sortieBox).show();
							}
							
							rshipBox = $(".tab_"+tabCode+" .factory .rfleet_ship").clone();
							$(".rfleet_pic img", rshipBox)
								.attr("src", KC3Meta.shipIcon(ship.mst_id))
								.addClass("hover")
								.click(shipNameEquipSwitchFunc);
							$(".rfleet_name", rshipBox).text(
								KC3Meta.shipNameById(ship.mst_id)
							).attr("title",
								KC3Meta.shipNameById(ship.mst_id)
							);
							$(".rfleet_level", rshipBox).text(
								KC3Meta.term("LevelText") + " " + ship.level
							);
							
							ship.equip.filter(id => id > 0).forEach((gearId, i) => {
								let masterGear = KC3Master.slotitem(gearId);
								$(".rfleet_equips .rfleet_equip.rfleet_equip_"+(i+1),rshipBox)
									.find("img")
									.attr("src", KC3Meta.itemIcon(masterGear.api_type[3]))
									.attr("title", KC3Meta.gearName(masterGear.api_name))
									.addClass("hover").attr("alt", gearId)
									.click(gearClickFunc);
							});
							$(".rfleet_detail", rshipBox).show();
							$(".rfleet_equips", rshipBox).hide();
							
							$(".rfleet_"+fleetkey[i]+" .rfleet_body", sortieBox).append( rshipBox );
						});
						$(".rfleet_"+fleetkey[i]+" .rfleet_body", sortieBox).append(
							$("<div>").addClass("clear")
						);
					});
					
					$(".rfleet_lbas", sortieBox).addClass("disabled");
					// `api_air_base_decks` not defined (or saved) for old event maps,
					// assume all available land bases can be used
					const lbMaxSortie = mapInfo.airBase || (sortie.world < 10 || sortie.world >= 41 ? 0 : 99);
					let lbi = 0, lbSortie = 0;
					$.each(sortie.lbas || [], function(index, landbase){
						// Skip those land bases not set to sortie or defend
						if(![1, 2].includes(landbase.action)){ return true; }
						lbi += 1;
						if(landbase.action === 1){
							// Skip those land bases over max sortie amount allowed
							if(lbSortie >= lbMaxSortie) { return true; }
							lbSortie += 1;
						}
						$(".rfleet_lbas"+lbi, sortieBox).removeClass("disabled");
						$(".rfleet_lbas"+lbi+" .rfleet_title .num", sortieBox)
							.text("#{0}".format(landbase.rid));
						$(".rfleet_lbas"+lbi+" .rfleet_title .action", sortieBox)
							.text(KC3Meta.term("LandBaseAction" + KC3LandBase.actionEnum(landbase.action)));
						if(landbase.action === 1){
							if(Array.isArray(landbase.edges)){
								$(".rfleet_lbas"+lbi+" .rfleet_title", sortieBox).attr("title",
									"{0} \u21db {1}".format(landbase.range, landbase.edges.map(
										id => KC3Meta.nodeLetter(sortie.world, sortie.mapnum, id, sortieTime)
									).join(", "))
								);
							} else {
								$(".rfleet_lbas"+lbi+" .rfleet_title .action", sortieBox)
									.attr("title", landbase.range);
							}
						}
						$.each(landbase.planes, function(pi, plane){
							if(!plane.mst_id){ return false; }
							var planeBox = $(".tab_"+tabCode+" .factory .rfleet_lbas_plane").clone();
							var planeMaster = KC3Master.slotitem(plane.mst_id);
							$(".rfleet_pic img", planeBox)
								.attr("src", KC3Meta.itemIcon(planeMaster.api_type[3]))
								.attr("alt", plane.mst_id)
								.click(gearClickFunc)
								.addClass("hover");
							$(".rfleet_detail .rfleet_name ", planeBox)
								.text(KC3Meta.gearName(planeMaster.api_name))
								.attr("title", KC3Meta.gearName(planeMaster.api_name));
							if(plane.state === 1){
								$(".rfleet_stars img", planeBox)
									.attr("src", "/assets/img/client/eqstar.png");
								$(".rfleet_stars span", planeBox).text(plane.stars || 0);
								if(plane.ace > -1) {
									$(".rfleet_ace img", planeBox)
										.attr("src", "/assets/img/client/achev/" + plane.ace + ".png");
								} else {
									$(".rfleet_ace img", planeBox).hide();
								}
								$(".rfleet_count", planeBox).text(plane.count);
								$(".rfleet_morale img", planeBox)
									.attr("src", "/assets/img/client/morale/" + ["","3","2","1"][plane.morale] + ".png");
							} else {
								$(".rfleet_stars", planeBox).hide();
								$(".rfleet_ace", planeBox).hide();
								$(".rfleet_count", planeBox).hide();
								$(".rfleet_morale", planeBox).hide();
							}
							$(".rfleet_lbas"+lbi+" .rfleet_body", sortieBox).append(planeBox);
						});
					});
					
					// console.debug("sortie.battles", sortie.battles);
					var finalNodeIndex = -1;
					// For each battle
					if(sortie.battles.length === 0){
						$(".sortie_edges", sortieBox).append("<div class=\"nonodes\">No available node recorded</div>");
						$(".sortie_edge",  sortieBox).hide();
					}else{
						$.each(sortie.battles, function(index, battle){
							var battleData, battleType;
							
							// Determine if day or night battle node
							// misspelling `api_dock_id` fixed since 2017-11-17, but old data still
							if(typeof battle.data.api_dock_id != "undefined"){
								battleData = battle.data;
								battleType = BATTLE_BASIC;
								if((battle.data.api_name || "").indexOf("ld_airbattle") >= 0)
									battleType += BATTLE_AERIAL;
							}else if(typeof battle.data.api_deck_id != "undefined"){
								battleData = battle.data;
								battleType = BATTLE_BASIC;
								if((battle.data.api_name || "").indexOf("ld_airbattle") >= 0)
									battleType += BATTLE_AERIAL;
								if(battle.data.api_day_flag !== undefined)
									battleType += BATTLE_NIGHT2DAY;
							}else if(typeof battle.yasen.api_deck_id != "undefined"){
								battleData = battle.yasen;
								battleType = BATTLE_NIGHT;
							}else{
								battleType = BATTLE_INVALID;
								return true;
							}
							
							// Show on node list
							var edgeIndex = edges.indexOf(battle.node);
							if(edgeIndex < 0) {
								edgeIndex = edges.length;
								edges.push(battle.node);
								const letter = KC3Meta.nodeLetter(sortie.world, sortie.mapnum, battle.node, sortieTime);
								$(".sortie_edge_"+(edgeIndex+1), sortieBox).addClass("edge_battle")
									.text(letter).toggleClass("long_name", String(letter).length > 2);
								if(edgeIndex === 5){
									$(".sortie_edges", sortieBox).removeClass("one_line").addClass("two_lines");
								}
							}
							$(".sortie_edge_"+(edgeIndex+1), sortieBox)
								.toggleClass("boss", !!battle.boss).addClass("active");
							finalNodeIndex = edgeIndex;
							
							var airRaidRaw = battle.airRaid;
							if(!airRaidRaw)
								airRaidRaw = (sortie.nodes && sortie.nodes.find(node => node.id === battle.node) || {}).airRaid;
							var airRaid = parseAirRaidFunc(airRaidRaw);

							// HTML elements
							nodeBox = $(".tab_"+tabCode+" .factory .sortie_nodeinfo").clone();
							$(".node_id", nodeBox).text( KC3Meta.nodeLetter( sortie.world, sortie.mapnum, battle.node, sortieTime ) );
							if(airRaid.airRaidLostKind > 0) {
								// Adding to sortie_edge for consistency with old sorties
								$(".node_id", nodeBox).addClass(airRaid.airRaidLostKind === 4 ? "nodamage" : "damaged");
								$(".sortie_edge_"+(edgeIndex+1), sortieBox).addClass(airRaid.airRaidLostKind === 4 ? "nodamage" : "damaged");
								// Show Enemy Air Raid damage
								const airRaidTooltip = KC3Meta.term("BattleHistoryAirRaidTip").format(
									airRaid.baseTotalDamage,
									KC3Meta.airraiddamage(airRaid.airRaidLostKind),
									airRaid.resourceLossAmount,
									airRaid.airState,
									"{0}%".format(airRaid.shotdownPercent),
									KC3Meta.term(airRaid.isTorpedoBombingFound ? "BattleContactYes" : "BattleContactNo"),
									KC3Meta.term(airRaid.isDiveBombingFound ? "BattleContactYes" : "BattleContactNo"),
									airRaid.topAntiBomberSquadNames[0], airRaid.topAntiBomberSquadNames[1],
									airRaid.topAntiBomberSquadNames[2], airRaid.topAntiBomberSquadNames[3],
									KC3Meta.term("InferredFighterPower").format(airRaid.eFighterPowers)
								);
								$(".node_id", nodeBox).attr("title", airRaidTooltip);
								$(".sortie_edge_"+(edgeIndex+1), sortieBox).attr("title", airRaidTooltip);
							} else {
								$(".node_id", nodeBox).removeClass("nodamage damaged");
							}
							
							// Result Icons
							$(".node_formation img", nodeBox).attr("src", KC3Meta.formationIcon(battleData.api_formation[0]) );
							$(".node_formation", nodeBox).attr("title", KC3Meta.formationText(battleData.api_formation[0]) );
							$(".node_rating img", nodeBox).attr("src", "../../assets/img/client/ratings/"+battle.rating+".png");
							
							// Kanmusu Drop
							if(battle.drop > 0){
								$(".node_drop img", nodeBox).attr("src", KC3Meta.shipIcon( battle.drop ) )
									.attr("title", KC3Meta.shipName(battle.drop))
									.attr("alt", battle.drop)
									.click(shipClickFunc);
								$(".node_drop", nodeBox).addClass("hover");
							}else{
								$(".node_drop img", nodeBox).attr("src", ConfigManager.info_troll ?
									"../../assets/img/ui/jervaited.png" :
									"../../assets/img/ui/shipdrop-x.png");
							}
							// Useitem Drop
							if(battle.useitem > 0){
								$(".node_drop img", nodeBox)
									.attr("src", KC3Meta.useitemIcon(battle.useitem))
									.error(function(){$(this).off("error").attr("src", "/assets/img/ui/map_drop.png");})
									.attr("title", [$(".node_drop img", nodeBox).attr("title"),
										KC3Meta.useItemName(battle.useitem)].filter(v => !!v).join(" + "));
							}
							
							// Process Battle, simulate combinedFleet type
							// should avoid state-ful PlayerManager dependency as possible as we can
							//PlayerManager.combinedFleet = sortie.combined;
							thisNode = (new KC3Node(battle.sortie_id, battle.node, battle.time,
								sortie.world, sortie.mapnum, sortie)).defineAsBattle();
							thisNode.playerCombinedType = sortie.combined;
							thisNode.fleetStates = battle.fleetStates;
							// Known issue: prediction will fail when Damecon used,
							// because Node does not see equipped damecon from old sortie history,
							// and damecon used on which node during 1 sortie was not remembered.
							// So add initial equipment on sortie started instead,
							// in order to allow Node to check if there is damecon at least for 1st time used.
							(thisNode.fleetStates || []).forEach((fleet, idx) => {
								if(!fleet.equip){
									if(idx === 0) {
										fleet.equip = sortie["fleet" + sortie.fleetnum].map(ship => ship.equip);
									} else if(sortie.combined && idx === 1){
										fleet.equip = sortie.fleet2.map(ship => ship.equip);
									}
								}
							});
							thisNode.sunken = sinkShips;
							try {
								if(typeof battle.data.api_dock_id != "undefined"){
									thisNode.engage( battleData, sortie.fleetnum );
									if(typeof battle.yasen.api_deck_id != "undefined" &&
										(ConfigManager.sr_show_yasen_shipstate || KC3Node.debugPrediction())){
										thisNode.night( battle.yasen );
									}
								}else if(typeof battle.data.api_deck_id != "undefined"){
									thisNode.engage( battleData, sortie.fleetnum );
									if(typeof battle.yasen.api_deck_id != "undefined" &&
										(ConfigManager.sr_show_yasen_shipstate || KC3Node.debugPrediction())){
										thisNode.night( battle.yasen );
									}
								}else if(typeof battle.yasen.api_deck_id != "undefined"){
									thisNode.engageNight( battleData, sortie.fleetnum );
								}
							} catch(e) {
								if(ConfigManager.sr_show_new_shipstate || ConfigManager.sr_show_yasen_shipstate) {
									console.error("Predicting battle ship state", e);
								} else {
									throw e;
								}
							}

							if(KC3Node.debugPrediction() && thisNode.unexpectedList && thisNode.unexpectedList.length) {
								const messages = thisNode.buildUnexpectedDamageMessage();
								if(messages) {
									console.warn(`Unexpected damage in sortie #${thisNode.sortie} ${sortie.world}-${sortie.mapnum}-${KC3Meta.nodeLetter(sortie.world, sortie.mapnum, battle.node, sortieTime)}`, thisNode.unexpectedList);
									const prevTitle = $(".sortie_edge_"+(edgeIndex+1), sortieBox).attr("title");
									$(".sortie_edge_"+(edgeIndex+1), sortieBox).attr("title",
										(prevTitle ? prevTitle + "\n" : "") + messages
									).lazyInitTooltip();
								}
							}
							if(thisNode.sortieSpecialCutins && thisNode.sortieSpecialCutins.some(v => !!v)) {
								$(".node_id", nodeBox).addClass("special_cutin");
								$(".sortie_edge_"+(edgeIndex+1), sortieBox).addClass("special_cutin");
							}
							if(ConfigManager.sr_show_new_shipstate){
								const predicted = thisNode.predictedFleetsNight || thisNode.predictedFleetsDay;
								if(predicted){
									const toDamageLevel = (hpRatio) => Math.ceil(hpRatio * 4);
									const rawData = thisNode.startsFromNight ? thisNode.battleNight : thisNode.battleDay;
									let lowestHP = 1;
									$.each(predicted.playerMain, function(index, ship){
										const maxHP = thisNode.maxHPs.ally[index];
										const nowHP = rawData.api_f_nowhps[index];
										const currentHP = ship.hp / maxHP;
										if(toDamageLevel(currentHP) < toDamageLevel(nowHP / maxHP))
											lowestHP = Math.min(currentHP, lowestHP);
									});
									$.each(predicted.playerEscort, function(index, ship){
										const maxHP = thisNode.maxHPs.allyEscort[index];
										const nowHP = rawData.api_f_nowhps_combined[index];
										const currentHP = ship.hp / maxHP;
										if(toDamageLevel(currentHP) < toDamageLevel(nowHP / maxHP))
											lowestHP = Math.min(currentHP, lowestHP);
									});
									if(lowestHP < 0) lowestHP = 0;
									if(lowestHP <= 0.5){
										const level = toDamageLevel(lowestHP);
										$(".sortie_edge_"+(edgeIndex+1), sortieBox)
											.append(`<div class="shipstate"><img src="/assets/img/ui/estat_boss${["destr", "heavy", "modrt"][level]}.png"></img></div>`);
									}
								}
							}
							if(ConfigManager.sr_show_yasen_shipstate &&
								typeof battle.yasen.api_deck_id != "undefined" &&
								!(battleType & (BATTLE_NIGHT | BATTLE_NIGHT2DAY))){
								$(".node_id", nodeBox).addClass("day_to_night");
								$(".sortie_edge_"+(edgeIndex+1), sortieBox).addClass("day_to_night");
							}
							if(KC3Node.debugPrediction()){
								// Known issue 1: if `api_name` not saved into battle data for old history,
								// prediction on long distance air raid node will fail.
								// Known issue 2: saved rating in DB will be incorrect,
								// if thisNode.allyNoDamage is not correctly calculated on that sortie.
								console.debug("Node " + thisNode.letter + " result rank", battle.rating, battle.sortie_id);
								console.assert(battle.rating == (thisNode.predictedRankNight || thisNode.predictedRank), "Rank prediction mismatch", battle);
								
								console.debug("Node " + thisNode.letter + " result mvp", battle.mvp, battle.sortie_id);
								if(thisNode.predictedMvpCapable){
									const predictedMvps = thisNode.predictedMvpsNight || thisNode.predictedMvps || [];
									console.assert(battle.mvp[0] == predictedMvps[0], "MVP prediction mismatch", battle);
									if(battle.mvp[1]){
										console.assert(battle.mvp[1] == predictedMvps[1], "Escort MVP prediction mismatch", battle);
									}
								} else {
									console.info("MVP prediction incapable");
								}
							}
							sinkShips[0] = sinkShips[0].concat(battle.shizunde[0]);
							sinkShips[1] = sinkShips[1].concat(battle.shizunde[1]);
							
							// Enemies
							$(".node_eformation img", nodeBox).attr("src", KC3Meta.formationIcon(thisNode.eformation) );
							$(".node_eformation", nodeBox).attr("title", KC3Meta.formationText(thisNode.eformation) );
							$.each(thisNode.eships.slice(0, 12), function(index, eship){
								if(eship > 0){
									const mainEscort = index >= 6 ? "escort" : "main";
									$(`.node_eship.${mainEscort}.node_eship_${index+1} img`, nodeBox)
										.attr("src", KC3Meta.abyssIcon( eship ) )
										.attr("alt", eship)
										.click(shipClickFunc);
									$(`.node_eship.${mainEscort}.node_eship_${index+1}`, nodeBox)
										.addClass("hover")
										.removeClass(KC3Meta.abyssShipBorderClass())
										.addClass(KC3Meta.abyssShipBorderClass(eship))
										.attr("title", thisNode.buildEnemyStatsMessage(index))
										.show();
									if(thisNode.debuffed && index === 0){
										//console.debug("Boss node " + thisNode.letter + " was debuffed", battle.sortie_id, thisNode);
										$(`.node_eship.${mainEscort}.node_eship_${index+1}`, nodeBox)
											.addClass("debuffed");
									}
								}
							});
							
							// Support Exped/LBAS triggered
							if(thisNode.supportFlag || thisNode.lbasFlag || thisNode.nightSupportFlag){
								$(".node_support img", nodeBox).attr("src", "../../assets/img/ui/support.png");
								if(
									(thisNode.supportFlag && battleData.api_support_info) ||
									(thisNode.nightSupportFlag && battleData.api_n_support_info)
								) {
									const supportInfo = battleData.api_support_info || battleData.api_n_support_info;
									const fleetId = (supportInfo.api_support_airatack||{}).api_deck_id
										|| (supportInfo.api_support_hourai||{}).api_deck_id || "?";
									$(".node_support .exped", nodeBox).text(fleetId);
									$(".node_support .exped", nodeBox).show();
								}
								$(".node_support .lbas", nodeBox).toggle(thisNode.lbasFlag);
								$(".node_support", nodeBox).attr("title", thisNode.buildSupportAttackMessage(thisNode, true));
							}else{
								$(".node_support img", nodeBox).attr("src", "../../assets/img/ui/support-x.png");
							}
							
							// Day Friendly Fleet aerial support triggered, or
							// Night battle Friendly Fleet support triggered
							if(battle.data.api_friendly_info || battle.yasen.api_friendly_info){
								$(".node_result", nodeBox).addClass("icon5");
								$(".node_friend img", nodeBox).attr("src", "../../assets/img/ui/friendly.png");
								if(battle.data.api_friendly_kouku){
									const msg = thisNode.buildFriendlyBattleMessage(battle.data, sortieTime, "kouku");
									$(".node_friend", nodeBox).attr("title", [$(".node_friend", nodeBox).attr("title"), msg].filter(v => !!v).join("\n"));
								}
								if(battle.yasen.api_friendly_battle){
									const msg = thisNode.buildFriendlyBattleMessage(battle.yasen, sortieTime, "battle");
									$(".node_friend", nodeBox).attr("title", [$(".node_friend", nodeBox).attr("title"), msg].filter(v => !!v).join("\n"));
								}
							}else{
								$(".node_result", nodeBox).removeClass("icon5");
								$(".node_friend", nodeBox).hide();
							}
							
							// Conditions
							$(".node_engage", nodeBox).text( thisNode.engagement[2] );
							$(".node_engage", nodeBox).addClass( thisNode.engagement[1] );
							$(".node_contact", nodeBox).text(thisNode.fcontact +" vs "+thisNode.econtact);
							
							// Day Battle only or Night to Day Battle data
							if((battleType & BATTLE_NIGHT) === 0){
								// No detection, aerial and LBAS combat if Night2Day battle not go into day
								if(thisNode.detection[0]){
									$(".node_detect", nodeBox).text( thisNode.detection[0] )
										.addClass( thisNode.detection[1] )
										.attr("title", "{0} vs {1}".format(
											thisNode.detection[0],
											KC3Meta.detection(thisNode.battleDay.api_search[1])[0]
										));
								}
								
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
								$("span.node_BAL",nodeBox).toggleClass("aaci_loss", !!thisNode.antiAirFire && thisNode.antiAirFire.length > 0);
								$(".node_planes", nodeBox).attr("title", thisNode.buildAirBattleLossMessage());
							}
							//console.debug(`${thisNode.sortie} ${thisNode.letter}`, thisNode);
							
							// Node EXP
							[["base","nodal"],["hq","hq"]].forEach(function(x){
								if(!!battle[x[0]+"EXP"]) {
									$(".node_exp."+x[1]+" span.value",nodeBox).text(battle[x[0]+"EXP"]);
								} else {
									$(".node_exp."+x[1],nodeBox).css("visibility",'hidden');
								}
							});
							
							// Add box to UI
							$(".sortie_nodes", sortieBox).append( nodeBox );
							
							// Filter and do whatever, such as dump API data with friend fleet
							if(typeof window.dumpBattleNode === "function")
								window.dumpBattleNode.call(self, battle, thisNode, sortie);
						});
						
					}
					
					$(".sortie_nodes", sortieBox).append( $("<div>").addClass("clear") );
					
					var mstat = mapInfo.stat,
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
							if(finalNodeIndex > -1 && stateKey && stateKey !== "faild"){
								$(".sortie_edge_"+(finalNodeIndex+1), sortieBox).addClass("boss");
							}
						} catch (e) {
							throw e;
						}
					}
				}catch(e){ console.error("Sortie battle rendering exception", e); }
			});
			
			$(".tab_"+tabCode+" .sortie_list").createChildrenTooltips();

		};
		
		function updateScrollItem(scrollVars, worldMap, itemWidth) {
			var le = 0,
				cr = scrollVars[worldMap + "_off"],
				re = scrollVars[worldMap + "_max"];
			if(cr === undefined || cr <= le)
				$(".tab_"+tabCode+" ."+worldMap+"_shift.left").addClass("disabled");
			else
				$(".tab_"+tabCode+" ."+worldMap+"_shift.left").removeClass("disabled");
			
			if(cr === undefined || cr >= re)
				$(".tab_"+tabCode+" ."+worldMap+"_shift.right").addClass("disabled");
			else
				$(".tab_"+tabCode+" ."+worldMap+"_shift.right").removeClass("disabled");
			
			$(".tab_"+tabCode+" ."+worldMap+"_list").css("margin-left",(cr * -itemWidth) + "px");
		}
		
		function updateMapHpInfo(self, sortieData) {
			const mapId = ["m", sortieData.world, sortieData.mapnum].join("");
			const mapData = self.maps[mapId] || {};
			if(sortieData.mapinfo){
				const maxKills = sortieData.mapinfo.api_required_defeat_count || mapData.killsRequired || KC3Meta.gauge(mapId.substr(1));
				// keep defeat_count undefined after map cleared to hide replayer gauge
				if(!sortieData.mapinfo.api_cleared || sortieData.mapinfo.api_required_defeat_count){
					sortieData.defeat_count = sortieData.mapinfo.api_defeat_count || 0;
					sortieData.required_defeat_count = maxKills;
					// pass to replayer for the 2nd gauge of 7-2
					sortieData.gauge_num = sortieData.mapinfo.api_gauge_num || 1;
				}
				console.debug("Map {0} boss gauge {3}: {1}/{2} kills".format(mapId,
					sortieData.defeat_count || (sortieData.mapinfo.api_cleared ? "post-cleared" : "?"),
					maxKills, sortieData.gauge_num || 1
				));
			} else if(sortieData.eventmap && sortieData.eventmap.api_gauge_type !== undefined) {
				sortieData.now_maphp = sortieData.eventmap.api_now_maphp;
				sortieData.max_maphp = sortieData.eventmap.api_max_maphp;
				console.debug("Map {0} boss gauge {3}: HP {1}/{2}"
					.format(mapId, sortieData.now_maphp, sortieData.max_maphp,
						sortieData.eventmap.api_gauge_type)
				);
			} else if(mapData.stat && mapData.stat.onBoss && mapData.stat.onBoss.hpdat){
				let hpObj = mapData.stat.onBoss.hpdat;
				let bossHpArr = hpObj[sortieData.id];
				if(Array.isArray(bossHpArr)){
					// Get boss HP on previous sortie
					let hpKeyArr = Object.keys(hpObj);
					let sortieKeyIdx = hpKeyArr.indexOf(String(sortieData.id));
					if(sortieKeyIdx > 0){
						let prevBossHpArr = hpObj[hpKeyArr[sortieKeyIdx - 1]];
						// Do not use previous HP if max changed
						if(bossHpArr[1] !== prevBossHpArr[1]){
							bossHpArr = [bossHpArr[1], bossHpArr[1]];
						} else {
							bossHpArr = prevBossHpArr;
						}
					}
				}
				if(Array.isArray(bossHpArr)){
					sortieData.now_maphp = bossHpArr[0];
					sortieData.max_maphp = bossHpArr[1];
					console.debug("Map {0} boss gauge: HP {1}/{2}"
						.format(mapId, bossHpArr[0], bossHpArr[1])
					);
				}
			}
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
			
			var domImg = new Image();
			domImg.onload = function(){
				
				KC3Database.get_sortie_data(sortieId, function(sortieData) {
					if(sortieData.battles.length === 0) {
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return false;
					}
					
					updateMapHpInfo(self, sortieData);
					
					// RMB clicked
					if(e.which === 3) {
						if(e.altKey) {
							window.open("https://kc3kai.github.io/kancolle-replay/battleText.html#"
								+ JSON.stringify(sortieData), "_blank");
						} else {
							window.open("https://kc3kai.github.io/kancolle-replay/battleplayer.html#"
								+ encodeURIComponent(JSON.stringify(sortieData)), "_blank");
						}
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return true;
					} else if(e.altKey) {
						self.copyToClipboard(JSON.stringify(sortieData), () => {
							alert(KC3Meta.term("BattleReplayToClipboard"));
						});
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return true;
					}
					
					console.debug("Downloading reply", sortieId, ", data:", sortieData);
					// Clear properties duplicated or may not used by replayer for now
					delete sortieData.nodes;
					$.each(sortieData.battles, function(_, battle) {
						delete battle.hq;
						delete battle.enemyId;
						delete battle.airRaid;
						delete battle.shizunde;
					});
					
					var jsonData = JSON.stringify(sortieData);
					var scale = Math.ceil(Math.sqrt(jsonData.length / 30000));
					console.debug("Image scale", scale, "based on data size:", jsonData.length);
					
					var rcanvas = document.createElement("canvas");
					rcanvas.width = 400 * scale;
					rcanvas.height = 400 * scale;
					var rcontext = rcanvas.getContext("2d");
					rcontext.drawImage(domImg, 0, 0, 400, 400, 0, 0, 400 * scale, 400 * scale);

					rcontext.font = (26 * scale) + "pt Calibri";
					rcontext.fillStyle = '#ffffff';
					rcontext.fillText(sortieData.world+"-"+sortieData.mapnum, 20 * scale, 215 * scale);
					
					rcontext.font = (20 * scale) + "pt Calibri";
					rcontext.fillStyle = '#ffffff';
					rcontext.fillText(PlayerManager.hq.name, 100 * scale, 210 * scale);
					
					var fleetUsed = sortieData["fleet"+sortieData.fleetnum];
					if(sortieData.combined && sortieData.fleetnum == 1) {
						$.each(fleetUsed, function(shipIndex, ShipData) {
							var shipIconImage = $(".simg-"+ShipData.mst_id+" img")[0];
							rcontext.save();
							rcontext.beginPath();
							rcontext.arc((43 + (60 * shipIndex)) * scale, (25 + 227) * scale,25*scale,0,2*Math.PI);
							rcontext.closePath();
							rcontext.clip();
							rcontext.drawImage(shipIconImage, (shipIconImage.naturalWidth*0.17), 0, (shipIconImage.naturalWidth*0.67), shipIconImage.naturalHeight,
								(18 + (60 * shipIndex)) * scale, 227 * scale, 50 * scale, 50 * scale);
							rcontext.restore();
						});
						$.each(sortieData.fleet2, function(shipIndex, ShipData) {
							var shipIconImage = $(".simg-"+ShipData.mst_id+" img")[0];
							rcontext.save();
							rcontext.beginPath();
							rcontext.arc((63 + (60 * shipIndex)) * scale, (18 + 253) * scale,17*scale,0,2*Math.PI);
							rcontext.closePath();
							rcontext.clip();
							rcontext.drawImage(shipIconImage, (shipIconImage.naturalWidth*0.17), 0, (shipIconImage.naturalWidth*0.67), shipIconImage.naturalHeight,
								(45 + (60 * shipIndex)) * scale, 253 * scale, 35 * scale, 35 * scale);
							rcontext.restore();
						});
					} else {
						var shipImageSize = Math.min(55, 300 / fleetUsed.length);
						$.each(fleetUsed, function(shipIndex, ShipData) {
							var shipIconImage = $(".simg-"+ShipData.mst_id+" img")[0];
							rcontext.save();
							rcontext.beginPath();
							rcontext.arc(
								(shipImageSize + ((shipImageSize+10) * shipIndex)) * scale,
								(225 + (65-shipImageSize)/2 + (shipImageSize/2)) * scale,
								(shipImageSize/2) * scale,0,2*Math.PI
							);
							rcontext.closePath();
							rcontext.clip();
							rcontext.drawImage(
								shipIconImage, (shipIconImage.naturalWidth*0.17), 0, (shipIconImage.naturalWidth*0.67), shipIconImage.naturalHeight,
								((shipImageSize/2) + ((shipImageSize+10) * shipIndex)) * scale,
								(225 + (65-shipImageSize)/2) * scale, shipImageSize * scale, shipImageSize * scale
							);
							rcontext.restore();
						});
					}
					
					withDataCover64 = rcanvas.toDataURL("image/png");
					
					steg.encode(jsonData, withDataCover64, {
						success: function(newImg) {
							KC3ImageExport.writeToCanvas(newImg,
								{ width: 400 * scale, height: 400 * scale },
								function(error, canvas) {
								if (error) {
									self.endExport(error);
									return;
								}
								new KC3ImageExport(canvas, {
									filename: PlayerManager.hq.name + '_' + sortieId,
									format: 'png',
									subDir: 'replay',
									hideDownload: false,
								}).export(self.endExport.bind(self));
							});
						},
						error: function(e) {
							self.endExport(e);
							return false;
						}
					});
					
				}, function(e) {
					self.endExport(e);
					return false;
				});
				
			};
			domImg.src = this.stegcover64;
			
		};
		
		this.endExport = function(error, result) {
			if (error) {
				console.error("Generating replay data failed", error);
				alert(KC3Meta.term("BattleReplayGenReplayFailed"));
			} else if (result && result.filename) {
				// Show a response if hideDownload shelf bar is true
				//alert("Saved to {0}".format(result.filename));
			}
			this.exportingReplay = false;
			$("body").css("opacity", "1");
		};
		
		this.copyToClipboard = function(stringData, successCallback) {
			const copyHandler = function(e) {
				e.preventDefault();
				if(e.clipboardData) {
					e.clipboardData.setData("text/plain", stringData);
					if(typeof successCallback === "function") {
						successCallback.call(this, e);
					}
				} else {
					console.warn("Browser does not support Clipboard event");
				}
				return true;
			};
			document.addEventListener("copy", copyHandler);
			document.execCommand("copy");
			document.removeEventListener("copy", copyHandler);
		};
		
	};
	
})();
