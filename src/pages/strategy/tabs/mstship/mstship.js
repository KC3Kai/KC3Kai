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
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			KC3Meta.loadQuotes();
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
		},
		
		/* RELOAD
		Prepares latest in game data
		---------------------------------*/
		reload :function(){
			// None for ship library
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
			var shipBox;
			$.each(KC3Master.all_ships(), function(index, ShipData){
				if(!ShipData) { return true; }
				
				shipBox = $(".tab_mstship .factory .shipRecord").clone();
				shipBox.attr("data-id", ShipData.api_id);
				shipBox.data("bs", ShipData.kc3_bship);
				
				if(ShipData.api_id<=500){
					$("img", shipBox).attr("src", KC3Meta.shipIcon(ShipData.api_id) );
				}else{
					$("img", shipBox).attr("src", KC3Meta.abyssIcon(ShipData.api_id) );
				}
				
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
				//console.debug("VOICE META: voiceFile", voiceFile);
				$(".tab_mstship .shipInfo .subtitles").show();
				if(!voiceFile || voiceFile==100000){
					$(".tab_mstship .shipInfo .subtitles").html("This voice is currently disabled to be replayable in KC3Kai");
					return true;
				}
				
				var voiceSrc = "http://"+self.server_ip
							+ "/kcs/sound/kc"+self.currentGraph+"/"+voiceFile+".mp3"
							+ (!self.currentCardVersion?"":"?version="+self.currentCardVersion);
				self.audio = new Audio(voiceSrc);
				self.audio.play();
				console.debug("PLAYING: shipId, vnum, voiceFile", self.currentShipId, vnum, voiceFile);
				
				// Emulate subtitles
				var shipGirl = KC3Master.graph_file(self.currentGraph);
				var voiceLine = KC3Meta.getVoiceLineByFilename(shipGirl, voiceFile);
				console.debug("SUBTITLE: shipId, voiceFile, voiceLine", shipGirl, voiceFile, voiceLine);
				var quote = KC3Meta.quote( shipGirl, voiceLine );
				if(quote){
					$(".tab_mstship .shipInfo .subtitles").html(quote);
				} else {
					$(".tab_mstship .shipInfo .subtitles").html(
						"Quote not found yet for: ship={0}, vnum={1}, vline={2}".format(shipGirl, vnum, voiceLine)
					);
				}
			});
			
			// On-click remodels
			$(".tab_mstship .shipInfo").on("click", ".remodel_name a", function(e){
				var sid = $(this).data("sid");
				KC3StrategyTabs.gotoTab(null, sid);
				//self.showShip( sid );
				e.preventDefault();
				return false;
			});
			// On-click other forms
			$(".tab_mstship .shipInfo").on("click", ".more .other_forms a", function(e){
				var sid = $(this).data("sid");
				KC3StrategyTabs.gotoTab(null, sid);
				//self.showShip( sid );
				e.preventDefault();
				return false;
			});
			
			// CG Notice can be dismissed
			if(!ConfigManager.dismissed_hints.cg_notice){
				$(".cg_notes").show();
				$(".cg_notes").on("click", function(e){
					ConfigManager.dismissed_hints.cg_notice = true;
					ConfigManager.save();
					// To keep URL for copying, do not disappear
					//$(".cg_notes").fadeOut();
					// Just change color to feed-back the action
					$(".cg_notes").css("background-color", "#f9f2f4");
					$(".cg_notes").attr("title", "Dismissed, will not be shown next time. But can always be found at Help Topics.");
				});
			}
			
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
			}else{
				this.showShip();
			}
			
			// Scroll list top to selected ship
			setTimeout(function(){
				var listItem = $(".tab_mstship .shipRecords .shipRecord[data-id={0}]".format(self.currentShipId));
				var scrollTop = listItem.length === 1 ? listItem.offset().top - $(".tab_mstship .shipRecords").offset().top : 0;
				$(".tab_mstship .shipRecords").scrollTop(scrollTop);
			}, 200);
		},
		
		/* UPDATE
		Partially update elements of the interface without clearing all contents first
		Be careful! Do NOT only update new data, but also handle the old states (do cleanup)
		---------------------------------*/
		update :function(pageParams){
			// KC3StrategyTabs.pageParams has been keeping the old values for states tracking
			if(!!pageParams && !!pageParams[1]){
				this.showShip(pageParams[1]);
			}else{
				this.showShip();
			}
			// Tell tab manager: Have handled the updating, donot re-execute the rendering
			return true;
		},
		
		showShip :function(ship_id){
			ship_id = Number(ship_id||"405");
			var
				self = this,
				shipData = KC3Master.ship(ship_id),
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
				};
			this.currentShipId = ship_id;
			console.debug("shipData", shipData);
			if(!shipData) { return; }
			
			$(".tab_mstship .shipInfo .name").text( "[{0}] {1} {2}".format(ship_id, KC3Meta.shipName(shipData.api_name), KC3Meta.shipName(shipData.api_yomi) ) );
			$(".tab_mstship .shipInfo .type").text( "{0}".format(KC3Meta.stype(shipData.api_stype)) );
			
			// CG VIEWER
			var shipFile = KC3Master.graph(ship_id).api_filename;
			// Changed to an Array from 2016-04-01
			var shipVersions = KC3Master.graph(ship_id).api_version;
			console.debug("shipgraph.api_version", shipVersions);
			this.currentGraph = shipFile;
			this.currentCardVersion = shipVersions[0];
			
			var shipSrc = "../../../../assets/swf/card.swf?sip="+this.server_ip
					+"&shipFile="+shipFile
					+"&abyss="+(ship_id>500 && ship_id<=800 ?1:0)
					+(ship_id > 800 ? "&forceFrame=6":"")
					+(!this.currentCardVersion?"":"&ver="+this.currentCardVersion);
			
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
			if(ship_id<=500){
				// Ship-only, non abyssal
				$(".tab_mstship .shipInfo .stats").empty();
				$(".tab_mstship .shipInfo .intro").html( shipData.api_getmes );
				$(".tab_mstship .shipInfo .cgswf").css("width", "218px")
					.css("height", "300px");
				$(".tab_mstship .shipInfo .cgswf embed").css("width", "218px")
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
						
					}else if(stat[1].startsWith("db_")){
						var realName = stat[1].slice(3);
						$(".ship_stat_name", statBox).text(realName);
						$(".ship_stat_min", statBox).text(statFromDb[realName]==-1?"tbc":statFromDb[realName]);
						if(realName==="carry"){
							$(".ship_stat_max", statBox).hide();
						} else {
							$(".ship_stat_max span", statBox).text(statFromDb[realName+"_max"]==-1?"tbc":statFromDb[realName+"_max"]);
						}
					}else{
						$(".ship_stat_min", statBox).text(shipData["api_"+stat[1]][0]);
						$(".ship_stat_max span", statBox).text(shipData["api_"+stat[1]][1]);
					}
					statBox.appendTo(".tab_mstship .shipInfo .stats");
				});
				
				var stockEquipments = WhoCallsTheFleetDb.getStockEquipment( ship_id );

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
					$(".slotitem", this).empty();
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
					$(".tab_mstship .shipInfo .remodel_ammo .rsc_value").text( shipData.api_afterfuel );
					$(".tab_mstship .shipInfo .remodel_steel .rsc_value").text( shipData.api_afterbull );
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
							.text( KC3Meta.shipName(KC3Master.ship(x).api_name) )
							.data("sid",x)
							.appendTo( ".tab_mstship .shipInfo .more .other_forms .other_forms_list" );
					});
					
					$(".tab_mstship .shipInfo .more .other_forms").show();
				} else {
					$(".tab_mstship .shipInfo .more .other_forms").hide();
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
					ticks: [lowestLevel,99,155]
				});
				self.atLvlSlider.on('change', function(e) {
					self.atLevelChange( e.value.newValue );
				});
				self.atLvlSlider.slider('setValue',99,true,true);

				$(".tab_mstship .shipInfo .subtitles").empty();
				
				// VOICE LINES
				$(".tab_mstship .shipInfo .voices").show();
				$(".tab_mstship .shipInfo .voices").empty();

				var allVoiceNums = KC3Translation.getShipVoiceNums(shipData.api_id,false,false);
				$.each(allVoiceNums, function(ignored, vnum){
					$("<div/>")
						.addClass("hover")
						.addClass("voice")
						.data("vnum", vnum)
						.text(KC3Translation.voiceNumToDesc(vnum) )
						.appendTo(".tab_mstship .shipInfo .voices");
				});
				$("<div/>").addClass("clear").appendTo(".tab_mstship .shipInfo .voices");
				
				// HOURLIES
				$(".tab_mstship .shipInfo .hourlies").show();
				$(".tab_mstship .shipInfo .hourlies").empty();
				
				if (KC3Translation.shipHasHourlyVoices(shipData.api_id)){
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
				
				// GUN FITS
				$(".gunfitList").html("");
				var gunfits = KC3Meta.gunfit(shipData.api_id);
				if (gunfits) {
					var gunfitBox, gearObj;
					$.each(gunfits, function(itemId, fitValue){
						
						gunfitBox = $(".tab_mstship .factory .fitgear").clone();
						gearObj = KC3Master.slotitem(itemId);
						
						$(".gearName", gunfitBox).text(KC3Meta.gearName(gearObj.api_name));
						
						if (fitValue === "") {
							$(".gearFit", gunfitBox).text(KC3Meta.term("FitWeightUnknown"));
							gunfitBox.addClass("fit_unknown");
						} else {
							$(".gearFit", gunfitBox).text(KC3Meta.term("FitWeight_"+fitValue));
							fitValue = parseInt(fitValue, 10);
							if (fitValue < 0) {
								gunfitBox.addClass("fit_penalty");
							} else if (fitValue > 0) {
								gunfitBox.addClass("fit_bonus");
							} else {
								gunfitBox.addClass("fit_neutral");
							}
						}
						
						gunfitBox.appendTo(".gunfitList");
					});
				}
				
				// BOXES
				$(".tab_mstship .shipInfo .stats").show();
				$(".tab_mstship .shipInfo .equipments").show();
				$(".tab_mstship .shipInfo .intro").show();
				$(".tab_mstship .shipInfo .more").show();
				$(".tab_mstship .shipInfo .json").hide();
				$(".tab_mstship .shipInfo .tokubest").show();
				if(ConfigManager.info_salt)
					$(".tab_mstship .shipInfo .tokubest .salty-zone").show();
				else
					$(".tab_mstship .shipInfo .tokubest .salty-zone").hide();
				if(ConfigManager.devOnlyPages)
					$(".tab_mstship .shipInfo .tokubest .to-quotes").show();
				else
					$(".tab_mstship .shipInfo .tokubest .to-quotes").hide();
			} else if (shipData.api_id <= 800) {
				// abyssals, show larger CG viewer
				$(".tab_mstship .shipInfo .stats").hide();
				$(".tab_mstship .shipInfo .equipments").hide();
				$(".tab_mstship .shipInfo .json").text(JSON.stringify(shipData))
					.css("width", "100%").show();
				$(".tab_mstship .shipInfo .subtitles").empty().hide();
				$(".tab_mstship .shipInfo .cgswf").css("width", "100%")
					.css("height", "400px");
				$(".tab_mstship .shipInfo .cgswf embed").css("width", "468px")
					.css("height", "400px");
				
				// show stats if encounter once
				KC3Database.get_enemyInfo(ship_id, function(enemyInfo){
					console.debug("enemyInfo", enemyInfo);
					if(enemyInfo){
						// ENEMY STATS
						$(".tab_mstship .shipInfo .stats").empty();
						$.each([
							["hp", "taik"],
							["fp", "houg"],
							["ar", "souk"],
							["tp", "raig"],
							["aa", "tyku"],
							["sp", "soku"],
						], function(index, stat){
							statBox = $(".tab_mstship .factory .ship_stat").clone();
							$("img", statBox).attr("src", "../../../../assets/img/stats/"+stat[0]+".png");
							$(".ship_stat_name", statBox).text(stat[1]);
							if(stat[0]=="sp"){
								$(".ship_stat_text", statBox).text({"0":"Land","5":"Slow","10":"Fast"}[shipData.api_soku]);
								$(".ship_stat_text", statBox).show();
								$(".ship_stat_value", statBox).hide();
							} else {
								$(".ship_stat_min", statBox).text(enemyInfo[stat[0]]);
								$(".ship_stat_max", statBox).hide();
							}
							
							statBox.appendTo(".tab_mstship .shipInfo .stats");
						});
						
						// ENEMY EQUIPMENT
						$(".tab_mstship .shipInfo .equipments").css("width", "220px");
						$(".tab_mstship .equipments .equipment").each(function(index){
							$(this).show();
							$(".capacity", this).text("?").hide();
							
							var equipId = enemyInfo["eq"+(index+1)];
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
								$(".slotitem", this).empty();
								$(".sloticon img", this).hide();
								$(".sloticon img", this).off("click");
								$(".sloticon", this).removeClass("hover");
							}
						});
						
						$(".tab_mstship .shipInfo .stats").show();
						$(".tab_mstship .shipInfo .equipments").show();
						$(".tab_mstship .shipInfo .json").hide();
					}
				});
				
				$(".tab_mstship .shipInfo .voices").hide();
				$(".tab_mstship .shipInfo .hourlies").hide();
				$(".tab_mstship .shipInfo .intro").hide();
				$(".tab_mstship .shipInfo .more").hide();
				$(".tab_mstship .shipInfo .tokubest").hide();
			} else {
				$(".tab_mstship .shipInfo .stats").hide();
				$(".tab_mstship .shipInfo .equipments").hide();
				$(".tab_mstship .shipInfo .json").hide();
				$(".tab_mstship .shipInfo .subtitles").hide();
				$(".tab_mstship .shipInfo .cgswf").css("width", "100%").css("height", "600px");
				$(".tab_mstship .shipInfo .cgswf embed").css("width", "100%").css("height", "600px");
				
				$(".tab_mstship .shipInfo .voices").hide();
				$(".tab_mstship .shipInfo .hourlies").hide();
				$(".tab_mstship .shipInfo .intro").hide();
				$(".tab_mstship .shipInfo .more").hide();
				$(".tab_mstship .shipInfo .tokubest").hide();
			}
		}
	};
	
})();
