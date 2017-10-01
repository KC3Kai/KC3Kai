(function(){
	"use strict";
	
	KC3StrategyTabs.mstship = new KC3StrategyTab("mstship");
	
	KC3StrategyTabs.mstship.definition = {
		tabSelf: KC3StrategyTabs.mstship,
		hourlies: {
			30: "0000",
			31: "0100",
			32: "0200",
			33: "0300",
			34: "0400",
			35: "0500",
			36: "0600",
			37: "0700",
			38: "0800",
			39: "0900",
			40: "1000",
			41: "1100",
			42: "1200",
			43: "1300",
			44: "1400",
			45: "1500",
			46: "1600",
			47: "1700",
			48: "1800",
			49: "1900",
			50: "2000",
			51: "2100",
			52: "2200",
			53: "2300"
		},
		currentGraph: "",
		currentShipId: 0,
		currentCardVersion: "",
		audio: false,
		server_ip: "",
		atLvlSlider: null,
		// placeholder, the real function is set during "execute()"
		// atLevelChange(newLevel) updates info on UI
		// with current ship & specified new level
		atLevelChange: null,
		// Merged master ship data with abyssal stats and seasonal CGs
		mergedMasterShips: {},
		damagedBossFileSuffix: "_d",
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			KC3Meta.loadQuotes();
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
			// Ship master data will not changed frequently
			this.mergedMasterShips = KC3Master.all_ships(true, true);
		},
		
		/* RELOAD
		Prepares latest in game data
		---------------------------------*/
		reload :function(){
			ConfigManager.load();
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".tab_mstship .runtime_id").text(chrome.runtime.id);
			var self = this;

			// slider setup for level-dependent stats
			self.atLvlSlider = $("input#at-level-slider");
			// create a dummy slider, this will be destroyed once there's something
			// to be displayed.
			self.atLvlSlider.slider();
			var sliderLevel = $(".at_level .level-val");
			var sliderDetail = $(".at_level .stat-detail");
			self.atLevelChange = function atLevelChange(newLevel) {
				sliderLevel.text( newLevel );
				var aswBound = WhoCallsTheFleetDb.getStatBound( self.currentShipId, 'asw' );
				var losBound = WhoCallsTheFleetDb.getStatBound( self.currentShipId, 'los' );
				var evsBound = WhoCallsTheFleetDb.getStatBound( self.currentShipId, 'evasion' );
				
				var asw = WhoCallsTheFleetDb.estimateStat(aswBound, newLevel);
				var los = WhoCallsTheFleetDb.estimateStat(losBound, newLevel);
				var evs = WhoCallsTheFleetDb.estimateStat(evsBound, newLevel);
				
				function ppr(v) { return v === false ? "???" : String(v); }
				$(".asw", sliderDetail).text( ppr(asw) );
				$(".los", sliderDetail).text( ppr(los) );
				$(".evs", sliderDetail).text( ppr(evs) );
			};

			// List all ships
			$.each(this.mergedMasterShips, function(index, ShipData){
				if(!ShipData) { return true; }
				
				var shipBox = $(".tab_mstship .factory .shipRecord").clone();
				shipBox.attr("data-id", ShipData.api_id);
				shipBox.data("bs", ShipData.kc3_bship);
				
				$("img", shipBox).attr("src", KC3Master.isAbyssalShip(ShipData.api_id) ?
					KC3Meta.abyssIcon(ShipData.api_id) : KC3Meta.shipIcon(ShipData.api_id)
				);
				
				if(ConfigManager.salt_list.indexOf(ShipData.kc3_bship)>=0) {
					shipBox.addClass('salted');
				}
				
				$(".shipName", shipBox).text( "["+ShipData.api_id+"] "+KC3Meta.shipName(ShipData.api_name) );

				shipBox.appendTo(".tab_mstship .shipRecords");
			});
			
			// Select ship
			$(".tab_mstship .shipRecords .shipRecord").on("click", function(){
				var sid = $(this).data("id");
				if( sid != self.currentShipId ){
					KC3StrategyTabs.gotoTab(null, sid);
				}
			});
			
			// Play voice
			$(".tab_mstship .shipInfo .voices, .tab_mstship .shipInfo .hourlies").on("click", ".voice", function(){
				if(self.audio){ self.audio.pause(); }
				var vnum = Number($(this).data("vnum"));
				var voiceFile = KC3Meta.getFilenameByVoiceLine(self.currentShipId, vnum);
				$(".tab_mstship .shipInfo .subtitles").show();
				if(!voiceFile || voiceFile==100000){
					$(".tab_mstship .shipInfo .subtitles").html("This voice is currently disabled to be replayable in KC3Kai");
					return true;
				}
				
				var voiceSrc = "http://"+self.server_ip
							+ "/kcs/sound/kc"+self.currentGraph+"/"+voiceFile+".mp3"
							+ (!self.currentCardVersion?"":"?version="+self.currentCardVersion);
				var voiceSize = 0;
				var playAndShowSubtitle = function(){
					// Playback voice audio file
					if(self.audio) { self.audio.pause(); }
					self.audio = new Audio(voiceSrc);
					self.audio.play();
					// Emulate subtitles
					var shipGirl = KC3Master.graph_file(self.currentGraph);
					var voiceLine = KC3Meta.getVoiceLineByFilename(shipGirl, voiceFile);
					var quote = KC3Meta.quote( shipGirl, voiceLine, voiceSize );
					console.debug("Playing subtitle: shipId, vnum, voiceLine, voiceFile, voiceSize:",
						shipGirl, vnum, voiceLine, voiceFile, voiceSize);
					if(quote){
						$(".tab_mstship .shipInfo .subtitles").html(quote);
					} else {
						$(".tab_mstship .shipInfo .subtitles").html(
							"Quote not found yet for: ship={0}, vnum={1}, vline={2}"
								.format(shipGirl, vnum, voiceLine)
						);
					}
				};
				// Get audio file size first for seasonal Poke(1/2/3)
				if(vnum >= 2 && vnum <= 4){
					$.ajax({
						type: "HEAD",
						url: voiceSrc,
						async: true,
						success: (data, status, xhr) => {
							voiceSize = parseInt(xhr.getResponseHeader("Content-Length"), 10) || 0;
							playAndShowSubtitle();
						}
					});
				} else {
					playAndShowSubtitle();
				}
			});
			
			// On-click remodels
			$(".tab_mstship .shipInfo").on("click", ".remodel_name a", function(e){
				var sid = $(this).data("sid");
				self.scrollShipListTop(sid);
				KC3StrategyTabs.gotoTab(null, sid);
				e.preventDefault();
				return false;
			});
			// On-click other forms
			$(".tab_mstship .shipInfo").on("click", ".more .other_forms a", function(e){
				var sid = $(this).data("sid");
				self.scrollShipListTop(sid);
				KC3StrategyTabs.gotoTab(null, sid);
				e.preventDefault();
				return false;
			});
			// On-click seasonal CG links
			$(".tab_mstship .shipInfo").on("click", ".more .seasonal_cg a", function(e){
				var sid = $(this).data("sid");
				//self.scrollShipListTop(sid);
				KC3StrategyTabs.gotoTab(null, sid);
				e.preventDefault();
				return false;
			});
			
			// CG Notice can be dismissed
			if(!ConfigManager.dismissed_hints.cg_notice){
				$(".cg_notes").show();
				$(".cg_notes").on("click", function(e){
					ConfigManager.loadIfNecessary();
					ConfigManager.dismissed_hints.cg_notice = true;
					ConfigManager.save();
					// To keep URL for copying, do not disappear
					//$(".cg_notes").fadeOut();
					// Just change color to feed-back the action
					$(".cg_notes").css("background-color", "#f9f2f4");
					$(".cg_notes").attr("title", "Dismissed, will not be shown next time. But can always be found at Help Topics.");
				});
			}
			
			// Fold/unfold sections like a accordion widget
			$(".tab_mstship .shipInfo .accordion .head").on("click", function(e){
				$(this).next().slideToggle();
				return false;
			}).next().hide();
			
			// View big CG mode of our shipgirl
			$(".tab_mstship .shipInfo .type").addClass("hover").on("click", function(e){
				if(KC3Master.isRegularShip(self.currentShipId)){
					self.showShip(self.currentShipId, false, true);
				}
			});
			
			// Show damaged CG of abyssal boss
			$(".tab_mstship .shipInfo .boss").on("click", function(e){
				self.showShip(self.currentShipId, true);
			});
			
			// Link to quotes developer page
			if(ConfigManager.devOnlyPages){
				$(".tab_mstship .shipInfo").on("click", ".to-quotes", function(e){
					KC3StrategyTabs.gotoTab("quotes", self.currentShipId);
				});
			}
			
			// Salt-toggle
			$(".tab_mstship .shipInfo").on("click", ".salty-zone", function(e){
				var
					saltList = ConfigManager.salt_list,
					shipData = KC3Master.ship(self.currentShipId),
					saltPos  = saltList.indexOf(shipData.kc3_bship),
					shipBox  = $(".shipRecord").filter(function(i,x){
						return shipData.kc3_bship == $(x).data('bs');
					});
				if(saltPos >= 0) {
					saltList.splice(saltPos,1);
					shipBox.removeClass('salted');
				} else {
					saltList.push(shipData.kc3_bship);
					shipBox.addClass('salted');
				}
				ConfigManager.save();
				e.preventDefault();
				self.showShip( shipData.api_id );
				return false;
			});
			
			// Link to ship specified by URL hash
			if(!!KC3StrategyTabs.pageParams[1]){
				this.showShip(KC3StrategyTabs.pageParams[1]);
				// Also expand unfolded section
				if(KC3StrategyTabs.pageParams.indexOf("aaci") > 1){
					$(".tab_mstship .shipInfo .aaci").parent().show();
				}
				if(KC3StrategyTabs.pageParams.indexOf("gunfit") > 1){
					$(".tab_mstship .shipInfo .gunfit").parent().show();
				}
			}else{
				this.showShip();
			}
			
			// Scroll list top to selected ship
			setTimeout(function(){self.scrollShipListTop();}, 0);
		},
		
		/* UPDATE: optional
		Partially update elements of the interface,
			possibly without clearing all contents first.
		Be careful! Do not only update new data,
			but also handle the old states (do cleanup).
		Return `false` if updating all needed,
			EXECUTE will be invoked instead.
		---------------------------------*/
		update :function(pageParams){
			if(!!pageParams && !!pageParams[1]){
				this.showShip(pageParams[1]);
			}else{
				this.showShip();
			}
			// Tell tab manager: Have handled the updating, don't re-execute the rendering
			return true;
		},
		
		scrollShipListTop :function(shipId){
			var shipList = $(".tab_mstship .shipRecords");
			var shipItem = $(".tab_mstship .shipRecords .shipRecord[data-id={0}]"
				.format(shipId || this.currentShipId)
			);
			var scrollTop = shipItem.length === 1 ?
				(shipItem.offset().top
				 + shipList.scrollTop()
				 - shipList.offset().top) : 0;
			shipList.scrollTop(scrollTop);
		},

		showShip :function(ship_id, tryDamagedGraph = false, switchCgView = false){
			ship_id = Number(ship_id||"405");
			var
				self = this,
				shipData = this.mergedMasterShips[ship_id],
				saltState = function(){
					return ConfigManager.info_salt && shipData.kc3_bship && ConfigManager.salt_list.indexOf(shipData.kc3_bship)>=0;
				},
				denyTerm = function(){
					return ["MasterShipSalt","Un","Check"].filter(function(str,i){
						return 	((i==1) && !saltState()) ? "" : str;
					}).join('');
				},
				saltClassUpdate = function(){
					if(saltState())
						$(".tab_mstship .shipInfo").addClass('salted');
					else
						$(".tab_mstship .shipInfo").removeClass('salted');
				},
				viewCgMode = switchCgView && $(".tab_mstship .shipInfo .intro").is(":visible");
			this.currentShipId = ship_id;
			console.debug("Viewing shipData", shipData);
			if(!shipData) { return; }
			
			$(".tab_mstship .shipInfo .name").text( "[{0}] {1} {2}"
				.format(ship_id, KC3Meta.shipName(shipData.api_name),
					KC3Meta.shipReadingName(shipData.api_yomi).replace("-", "") ) )
				.attr("title",
					KC3Master.isAbyssalShip(ship_id) ? "" : // Abyssal ships
					KC3Meta.ctypeName(shipData.api_ctype).replace("??", "") // No tooltip for seasonal CGs
				).lazyInitTooltip();
			$(".tab_mstship .shipInfo .type").text( "{0}".format(KC3Meta.stype(shipData.api_stype)) );
			$(".tab_mstship .shipInfo .json").text( '"{0}":{1}'.format(ship_id, JSON.stringify(shipData)) );
			
			// CG VIEWER
			var shipFile = KC3Master.graph(ship_id).api_filename;
			// Changed to an Array from 2016-04-01
			var shipVersions = KC3Master.graph(ship_id).api_version;
			//console.debug("shipgraph.api_version", shipVersions);
			this.currentGraph = shipFile;
			this.currentCardVersion = shipVersions[0];
			
			var shipSrc = "../../../../assets/swf/card.swf?sip=" + this.server_ip
					+ ("&shipFile=" + shipFile + (tryDamagedGraph ? this.damagedBossFileSuffix : ""))
					+ ("&abyss=" + (KC3Master.isAbyssalShip(ship_id) ? 1 : 0))
					+ (!this.currentCardVersion ? "" : "&ver=" + this.currentCardVersion);
			if(KC3Master.isSeasonalShip(ship_id)){
				shipSrc += "&forceFrame=8";
				// try to make it center
				shipSrc += "&forceX=-40&forceY=-80";
			} else if(KC3Master.isAbyssalShip(ship_id)){
				// get shipgraph battle offset
				let [x, y] = KC3Master.graph(ship_id).api_battle_n;
				// 0.4 is card default scale, try to center it by [-15, -15]
				x = Math.floor(x * 0.4) - 15; y = Math.floor(y * 0.4) - 15;
				shipSrc += "&forceX={0}&forceY={1}".format(x, y);
			} else if(viewCgMode){
				// view large CG
				shipSrc += "&forceFrame=10";
				let [x, y] = KC3Master.graph(ship_id).api_battle_n;
				x -= 180; y -= 280;
				shipSrc += "&forceX={0}&forceY={1}".format(x, y);
			}
			
			$(".tab_mstship .shipInfo .cgswf embed").remove();
			$("<embed/>")
				.attr("src", shipSrc)
				.attr("wmode", "transparent")
				.attr("menu", "false")
				.appendTo(".tab_mstship .shipInfo .cgswf");
			$(".tab_mstship .shipInfo .salty-zone").text(KC3Meta.term(denyTerm()));
			$(".tab_mstship .shipInfo .hourlies").empty();
			
			saltClassUpdate();
			
			var statBox;
			if(KC3Master.isRegularShip(ship_id) && !viewCgMode){
				// Ship-only, non abyssal
				$(".tab_mstship .shipInfo .stats").empty();
				$(".tab_mstship .shipInfo .stats").css("width", "");
				$(".tab_mstship .shipInfo .intro").html( shipData.api_getmes );
				$(".tab_mstship .shipInfo .cgswf")
					.css("width", "218px")
					.css("height", "300px");
				$(".tab_mstship .shipInfo .cgswf embed")
					.css("width", "218px")
					.css("height", "300px");
				
				// STATS
				var statFromDb = WhoCallsTheFleetDb.getShipStat(ship_id);
				$.each([
					["hp", "taik"],
					["fp", "houg"],
					["ar", "souk"],
					["tp", "raig"],
					["ev", "db_evasion"],
					["aa", "tyku"],
					["ac", "db_carry"],
					["as", "db_asw"],
					["sp", "soku"],
					["ls", "db_los"],
					["rn", "leng"],
					["lk", "luck"],
				], function(index, stat){
					statBox = $(".tab_mstship .factory .ship_stat").clone();
					$("img", statBox).attr("src", "../../../../assets/img/stats/"+stat[0]+".png");
					$(".ship_stat_name", statBox).text(stat[1]);
					
					if(stat[0]=="rn"){
						$(".ship_stat_text", statBox).text(["","Short","Medium","Long","V.Long"][shipData.api_leng]);
						$(".ship_stat_text", statBox).show();
						$(".ship_stat_value", statBox).hide();
						
					}else if(stat[0]=="sp"){
						$(".ship_stat_text", statBox).text({"5":"Slow","10":"Fast"}[shipData.api_soku]);
						$(".ship_stat_text", statBox).show();
						$(".ship_stat_value", statBox).hide();
						
					}else if(stat[0]=="hp"){
						$(".ship_stat_min", statBox).text(shipData["api_"+stat[1]][0]);
						// Show our max value for married ship, as api_taik[1] is unreasonable
						$(".ship_stat_max span", statBox).text(KC3Ship.getMaxHp(ship_id));
					}else if(stat[1].startsWith("db_")){
						var realName = stat[1].slice(3);
						$(".ship_stat_name", statBox).text(realName);
						// New initial asw statistic added for Anti-sub Carrier (Taiyou for now)
						if(stat[0]=="as" && shipData.api_tais){
							$(".ship_stat_min", statBox).text(shipData.api_tais[0]);
						} else {
							$(".ship_stat_min", statBox).text(
								statFromDb[realName] < 0 || statFromDb[realName] === ""
									? "tbc"
									: statFromDb[realName]
							);
						}
						if(realName==="carry"){
							$(".ship_stat_max", statBox).hide();
						} else {
							$(".ship_stat_max span", statBox).text(
								statFromDb[realName+"_max"] < 0 || statFromDb[realName+"_max"] === ""
									? "tbc"
									: statFromDb[realName+"_max"]
							);
						}
					}else{
						$(".ship_stat_min", statBox).text(shipData["api_"+stat[1]][0]);
						$(".ship_stat_max span", statBox).text(shipData["api_"+stat[1]][1]);
					}
					statBox.appendTo(".tab_mstship .shipInfo .stats");
				});
				
				var stockEquipments = WhoCallsTheFleetDb.getStockEquipment( ship_id );
				var remodelInfo = RemodelDb.remodelInfo( ship_id ) || {};
				
				// EQUIPMENT
				$(".tab_mstship .equipments .equipment").each(function(index){
					$(".capacity", this).text( shipData.api_maxeq[index] ).show();
					if(index >= shipData.api_slot_num){
						$(this).hide();
					}else{
						$(this).show();
					}

					// in case when the data isn't available,
					// slots should still be getting cleaned up
					$(".slotitem", this).empty().removeAttr("title");
					$(".sloticon img", this).attr("src", "");
					$(".sloticon img", this).hide();

					if (stockEquipments) {
						var equipId = stockEquipments[index];
						if (equipId > 0) {
							var equipment = KC3Master.slotitem( equipId );
							$(".slotitem", this).text(KC3Meta.gearName( equipment.api_name ) );
							$(".sloticon img", this)
								.attr("src","../../../../assets/img/items/"+equipment.api_type[3]+".png");
							$(".sloticon img", this).attr("alt", equipId);
							$(".sloticon img", this).off("click").click(function(){
								KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
							});
							$(".sloticon img", this).show();
							$(".sloticon", this).addClass("hover");
						} else {
							$(".sloticon img", this).hide();
							$(".sloticon img", this).off("click");
							$(".sloticon", this).removeClass("hover");
						}
					}
				});
				
				// MORE INFO
				if(shipData.api_aftershipid>0){
					$(".tab_mstship .shipInfo .remodel_name a").text( KC3Meta.shipName(KC3Master.ship(shipData.api_aftershipid).api_name) );
					$(".tab_mstship .shipInfo .remodel_name a").data("sid", shipData.api_aftershipid);
					$(".tab_mstship .shipInfo .remodel_level span").text( shipData.api_afterlv );
					$(".tab_mstship .shipInfo .remodel_ammo .rsc_value").text( shipData.api_afterbull );
					$(".tab_mstship .shipInfo .remodel_steel .rsc_value").text( shipData.api_afterfuel );
					$(".tab_mstship .shipInfo .remodel_blueprint").toggle( remodelInfo.blueprint > 0 );
					$(".tab_mstship .shipInfo .remodel").show();
				}else{
					$(".tab_mstship .shipInfo .remodel").hide();
				}

				// other forms
				var otherFormIds = RemodelDb
					.remodelGroup(shipData.api_id)
					.filter( function(x) {
						return x !== shipData.api_id &&
							x !== shipData.api_aftershipid;
					});
				
				if (otherFormIds.length > 0) {
					$(".tab_mstship .shipInfo .more .other_forms a").remove();
					$.each(otherFormIds, function(i,x) {
						$("<a/>")
							.addClass("hover")
							.text( KC3Meta.shipName(self.mergedMasterShips[x].api_name) )
							.data("sid",x)
							.appendTo( ".tab_mstship .shipInfo .more .other_forms .other_forms_list" );
					});
					$(".tab_mstship .shipInfo .more .other_forms").show();
				} else {
					$(".tab_mstship .shipInfo .more .other_forms").hide();
				}

				// Seasonal CGs
				var seasonalCgIds = Object.keys(this.mergedMasterShips).filter(
					id => KC3Master.isSeasonalShip(id)
						&& this.mergedMasterShips[id].api_yomi === shipData.api_yomi
				);
				if (seasonalCgIds.length > 0) {
					$(".tab_mstship .shipInfo .more .seasonal_cg a").remove();
					$.each(seasonalCgIds, function(i, x) {
						$("<a/>")
							.addClass("hover")
							.text( KC3Meta.shipName(self.mergedMasterShips[x].api_name) )
							.data("sid", x)
							.appendTo( ".tab_mstship .shipInfo .more .seasonal_cg .seasonal_cg_list" );
					});
					$(".tab_mstship .shipInfo .more .seasonal_cg").show();
				} else {
					$(".tab_mstship .shipInfo .more .seasonal_cg").hide();
				}

				$(".tab_mstship .scrap .rsc").each(function(index){
					$(".rsc_value", this).text( shipData.api_broken[index] );
				});
				$(".tab_mstship .modfods .rsc").each(function(index){
					$(".rsc_value", this).text( shipData.api_powup[index] );
				});
				$(".tab_mstship .shipInfo .consume_fuel .rsc_value").text( shipData.api_fuel_max );
				$(".tab_mstship .shipInfo .consume_ammo .rsc_value").text( shipData.api_bull_max );

				// level-dependent stats
				var lowestLevel = RemodelDb.lowestLevel( self.currentShipId );
				// it seems "ticks" cannot be reset, so we have to
				// destroy the slider and build a fresh one.
				self.atLvlSlider.slider('destroy');
				self.atLvlSlider.slider({
					tooltip: 'hide',
					ticks: [lowestLevel, KC3Ship.getMarriedLevel() - 1, KC3Ship.getMaxLevel()]
				});
				self.atLvlSlider.on('change', function(e) {
					self.atLevelChange( e.value.newValue );
				});
				self.atLvlSlider.slider('setValue', KC3Ship.getMarriedLevel() - 1, true, true);

				$(".tab_mstship .shipInfo .subtitles").empty();
				
				// VOICE LINES
				$(".tab_mstship .shipInfo .voices").show();
				$(".tab_mstship .shipInfo .voices").empty();

				var allVoiceNums = KC3Translation.getShipVoiceNums(shipData.api_id, false, true);
				$.each(allVoiceNums, function(ignored, vnum){
					$("<div/>")
						.addClass("hover")
						.addClass("voice")
						.data("vnum", vnum)
						.text(KC3Translation.voiceNumToDesc(vnum) )
						.appendTo(".tab_mstship .shipInfo .voices");
				});
				$("<div/>").addClass("clear").appendTo(".tab_mstship .shipInfo .voices");
				
				// Hourly lines
				$(".tab_mstship .shipInfo .hourlies").show();
				$(".tab_mstship .shipInfo .hourlies").empty();
				
				if (KC3Meta.shipHasHourlyVoices(shipData.api_id)){
					$.each(this.hourlies, function(vnum, vname){
						var hhStr = vname.substring(0,2);
						var mmStr = vname.substring(2);
						$("<div/>")
							.addClass("hover")
							.addClass("voice")
							.data("vnum", vnum)
							.text(hhStr + ":" + mmStr)
							.appendTo(".tab_mstship .shipInfo .hourlies");
					});
					$("<div/>").addClass("clear").appendTo(".tab_mstship .shipInfo .hourlies");
				}
				
				// AACI Types
				$(".aaciList").empty();
				var aaciList = AntiAir.sortedPossibleAaciList( AntiAir.shipAllPossibleAACIs(shipData) );
				if (aaciList.length > 0) {
					$.each(aaciList, function(idx, aaciObj){
						let aaciBox = $(".tab_mstship .factory .aaciPattern").clone();
						$(".apiId", aaciBox).text("[{0}]".format(aaciObj.id));
						if(aaciObj.icons[0] > 0) {
							$(".shipIcon img", aaciBox)
								.attr("src", KC3Meta.shipIcon(aaciObj.icons[0]) )
								.attr("title", KC3Meta.aacitype(aaciObj.id)[0] || "");
						} else {
							$(".shipIcon img", aaciBox).hide();
						}
						if(aaciObj.icons.length > 1) {
							for(let i = 1; i < aaciObj.icons.length; i++) {
								let equipIcon = String(aaciObj.icons[i]).split(/[+-]/);
								$("<img/>")
									.attr("src", "../../../../assets/img/items/"+equipIcon[0]+".png")
									.attr("title", KC3Meta.aacitype(aaciObj.id)[i] || "")
									.appendTo($(".equipIcons", aaciBox));
								if(equipIcon.length>1) {
									$('<img/>')
										.attr("src", "../../../../assets/img/items/"+equipIcon[1]+".png")
										.addClass(aaciObj.icons[i].indexOf("-")>-1 ? "minusIcon" : "plusIcon")
										.appendTo($(".equipIcons", aaciBox));
								}
							}
						}
						$(".fixed", aaciBox).text("+{0}".format(aaciObj.fixed));
						$(".modifier", aaciBox).text("x{0}".format(aaciObj.modifier));
						aaciBox.toggleClass("odd", (idx+1) % 2 !== 0);
						aaciBox.toggleClass("even", (idx+1) % 2 === 0);
						aaciBox.appendTo(".aaciList");
					});
					$(".aaci").show();
					$(".aaci").parent().prev().show();
				} else {
					$(".aaci").hide();
					$(".aaci").parent().prev().hide();
				}
				
				// GUN FITS
				$(".gunfitList").empty();
				var gunfits = KC3Meta.sortedGunfits(shipData.api_id);
				if (gunfits) {
					let lastWeightClass = "";
					let isOdd = false;
					const fillGearFitValue = function(gunfitBox, value, className) {
						$(".gearFit{0}".format(className), gunfitBox).text(
							(value > 0 ? "+" : "") + value
						);
						$(".gearFit{0}".format(className), gunfitBox).addClass(
							["fit_penalty", "fit_neutral", "fit_bonus"][Math.sign(value) + 1]
						);
					};
					$.each(gunfits, function(idx, gunfitObj){
						if(lastWeightClass != gunfitObj.weight) {
							isOdd = !isOdd;
							lastWeightClass = gunfitObj.weight;
						}
						const itemId = gunfitObj.id;
						const gunfitBox = $(".tab_mstship .factory .fitgear").clone();
						const gearObj = KC3Master.slotitem(itemId);
						$(".gearName", gunfitBox).text(
							"[{0}] {1}".format(itemId, KC3Meta.gearName(gearObj.api_name))
						).data("id", itemId).on("click", function(e) {
							KC3StrategyTabs.gotoTab("mstgear", $(this).data("id"));
						}).addClass("hover");
						
						if (gunfitObj.unknown === true) {
							$(".gearFitDay", gunfitBox).text(KC3Meta.term("FitWeightUnknown"))
								.addClass("fit_unknown");
							$(".gearFitNight", gunfitBox).width(0);
						} else {
							fillGearFitValue(gunfitBox, gunfitObj.day, "Day");
							fillGearFitValue(gunfitBox, gunfitObj.night, "Night");
						}
						gunfitBox.addClass(gunfitObj.weight);
						gunfitBox.addClass(isOdd ? "odd" : "even");
						gunfitBox.appendTo(".gunfitList");
					});
					$(".gunfit").parent().prev().show();
				} else {
					$(".gunfit").parent().prev().hide();
				}
				
				// BOXES
				$(".tab_mstship .shipInfo .stats").show();
				$(".tab_mstship .shipInfo .equipments").show();
				$(".tab_mstship .shipInfo .intro").show();
				$(".tab_mstship .shipInfo .more").show();
				$(".tab_mstship .shipInfo .json").hide();
				$(".tab_mstship .shipInfo .boss").hide();
				$(".tab_mstship .shipInfo .encounter").hide();
				$(".tab_mstship .shipInfo .accordion").show();
				$(".tab_mstship .shipInfo .tokubest").show();
				if(ConfigManager.info_salt)
					$(".tab_mstship .shipInfo .tokubest .salty-zone").show();
				else
					$(".tab_mstship .shipInfo .tokubest .salty-zone").hide();
				if(ConfigManager.devOnlyPages)
					$(".tab_mstship .shipInfo .tokubest .to-quotes").show();
				else
					$(".tab_mstship .shipInfo .tokubest .to-quotes").hide();
			} else if (KC3Master.isAbyssalShip(ship_id)) {
				// Abyssal, show larger CG viewer
				$(".tab_mstship .shipInfo .stats").hide();
				$(".tab_mstship .shipInfo .equipments").hide();
				$(".tab_mstship .shipInfo .json").hide().css("width", "100%");
				$(".tab_mstship .shipInfo .subtitles").empty().hide();
				$(".tab_mstship .shipInfo .cgswf")
					.css("width", "100%")
					.css("height", "400px");
				$(".tab_mstship .shipInfo .cgswf embed")
					.css("width", "468px")
					.css("height", "400px");
				$(".tab_mstship .shipInfo .boss").toggle("boss" === KC3Meta.abyssShipBorderClass(shipData));
				
				// ENEMY STATS
				// show stats if encounter once, or show stats of internal db
				KC3Database.get_enemyInfo(ship_id, function(enemyDbStats){
					var abyssDb = KC3Master.abyssalShip(ship_id, false);
					var abyssMaster = self.mergedMasterShips[ship_id];
					console.debug("Enemy DB stats", enemyDbStats);
					console.debug("Abyssal internal stats", abyssDb);
					console.debug("Merged abyssal master", abyssMaster);
					$(".tab_mstship .shipInfo .encounter").toggle(!!enemyDbStats);
					if(enemyDbStats || abyssDb){
						$(".tab_mstship .shipInfo .stats").empty();
						$.each([
							["hp", "taik"],
							["fp", "houg"],
							["ar", "souk"],
							["tp", "raig"],
							["aa", "tyku"],
							["sp", "soku"],
							["if", "airpow"],
						], function(index, stat){
							statBox = $(".tab_mstship .factory .ship_stat").clone();
							$("img", statBox).attr("src", "../../../../assets/img/stats/"+stat[0]+".png");
							$(".ship_stat_name", statBox).text(stat[1]);
							if(stat[0]=="sp"){
								var speedEnNameMap = {"0":"Land","5":"Slow","10":"Fast","15":"Fast+","20":"Fastest"};
								$(".ship_stat_text", statBox).text(speedEnNameMap[shipData.api_soku]);
								$(".ship_stat_text", statBox).show();
								$(".ship_stat_value", statBox).hide();
							} else if(stat[0]=="if"){
								// Compute fighter air power based on known slots
								$(".ship_stat_min", statBox).text(
									KC3Calc.enemyFighterPower([abyssMaster.api_id])[0] || 0
								);
								$(".ship_stat_max", statBox).hide();
							} else {
								$(".ship_stat_min", statBox).text(
									// Priority to show stats recorded via encounter
									enemyDbStats ? enemyDbStats[stat[0]] : abyssMaster["api_" + stat[1]]
								);
								$(".ship_stat_max", statBox).hide();
								// Check diff for updating `abyssal_stats.json`
								if(enemyDbStats && (!abyssDb ||
									typeof abyssDb["api_" + stat[1]] === "undefined" ||
									enemyDbStats[stat[0]] != abyssDb["api_" + stat[1]])){
									// Different color to indicate stats attribute to be updated
									$(".ship_stat_min", statBox).html(
										$("<span style='color:orangered'></span>").text($(".ship_stat_min", statBox).text())
									).attr("title",
										"{0} => {1}".format(abyssDb["api_" + stat[1]], enemyDbStats[stat[0]])
									);
								}
							}
							statBox.appendTo(".tab_mstship .shipInfo .stats");
						});
						
						// ENEMY EQUIPMENT
						$(".tab_mstship .shipInfo .stats").css("width", "220px");
						$(".tab_mstship .equipments .equipment").each(function(index){
							$(this).show();
							if(abyssDb && abyssDb.api_maxeq && typeof abyssMaster.api_maxeq[index] !== "undefined"){
								$(".capacity", this).text(abyssMaster.api_maxeq[index]).show();
							} else {
								$(".capacity", this).text(index >= abyssMaster.api_slot_num ? "-" : "?").show();
							}
							// Priority to show equipment recorded via encounter
							var equipId = enemyDbStats ? enemyDbStats["eq"+(index+1)] : (abyssMaster.kc3_slots || [])[index];
							if (equipId > 0) {
								var equipment = KC3Master.slotitem( equipId );
								$(".slotitem", this).text(KC3Meta.gearName( equipment.api_name ) )
									.attr("title", "");
								$(".sloticon img", this)
									.attr("src","../../../../assets/img/items/"+equipment.api_type[3]+".png");
								$(".sloticon img", this).attr("alt", equipId);
								$(".sloticon img", this).off("click").click(function(){
									KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
								});
								$(".sloticon img", this).show();
								$(".sloticon", this).addClass("hover");
								// Check diff for updating `abyssal_stats.json`
								if(enemyDbStats && (!abyssDb || !abyssDb.kc3_slots ||
									typeof abyssMaster.kc3_slots[index] === "undefined" ||
									enemyDbStats["eq"+(index+1)] != abyssMaster.kc3_slots[index])){
									$(".slotitem", this).html(
										$("<span style='color:yellow'></span>").text($(".slotitem", this).text())
									).attr("title",
										"{0} => {1}".format((abyssMaster.kc3_slots||[])[index], enemyDbStats["eq"+(index+1)])
									);
								}
							} else {
								$(".slotitem", this).empty();
								$(".sloticon img", this).hide();
								$(".sloticon img", this).off("click");
								$(".sloticon", this).removeClass("hover");
							}
						});
						
						$(".tab_mstship .shipInfo .stats").show();
						$(".tab_mstship .shipInfo .equipments").show();
					} else {
						$(".tab_mstship .shipInfo .json").show();
						$(".tab_mstship .shipInfo .boss").hide();
					}
				});
				
				$(".tab_mstship .shipInfo .voices").hide();
				$(".tab_mstship .shipInfo .hourlies").hide();
				$(".tab_mstship .shipInfo .intro").hide();
				$(".tab_mstship .shipInfo .more").hide();
				$(".tab_mstship .shipInfo .accordion").hide();
				$(".tab_mstship .shipInfo .tokubest").hide();
			} else {
				$(".tab_mstship .shipInfo .stats").hide();
				$(".tab_mstship .shipInfo .equipments").hide();
				$(".tab_mstship .shipInfo .json").hide().css("width", "100%");
				$(".tab_mstship .shipInfo .subtitles").hide();
				$(".tab_mstship .shipInfo .cgswf").css("width", "100%").css("height", "600px");
				$(".tab_mstship .shipInfo .cgswf embed").css("width", "100%").css("height", "600px");
				
				$(".tab_mstship .shipInfo .voices").hide();
				$(".tab_mstship .shipInfo .hourlies").hide();
				$(".tab_mstship .shipInfo .intro").hide();
				$(".tab_mstship .shipInfo .boss").hide();
				$(".tab_mstship .shipInfo .encounter").hide();
				$(".tab_mstship .shipInfo .more").hide();
				$(".tab_mstship .shipInfo .accordion").hide();
				$(".tab_mstship .shipInfo .tokubest").hide();
			}
		}
	};
	
})();
