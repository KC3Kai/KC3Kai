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
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			KC3Meta.loadQuotes();
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".tab_mstship .runtime_id").text(chrome.runtime.id);
			
			var self = this;
			
			/*
			// Add ship type filters
			$.each(KC3Meta._stype, function(index, stype_code){
				if(index === 0) return true;
				
				$("<div />")
					.addClass("stype")
					.text(stype_code)
					.data("id", index)
					.appendTo(".tab_mstship .filters");
			});
			$("<div />").addClass("clear").appendTo(".tab_mstship .filters");*/
			
			// List all ships
			var shipBox;
			$.each(KC3Master.all_ships(), function(index, ShipData){
				if(!ShipData) { return true; }
				
				shipBox = $(".tab_mstship .factory .shipRecord").clone();
				shipBox.data("id", ShipData.api_id);
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
					//self.showShip( sid );
				}
			});
			
			// Play voice
			$(".tab_mstship .shipInfo .voices, .tab_mstship .shipInfo .hourlies").on("click", ".voice", function(){
				if(self.audio){ self.audio.pause(); }
				var vnum = Number($(this).data("vnum"));
				var voiceFile = KC3Meta.getFilenameByVoiceLine(self.currentShipId, vnum);
				//console.debug("VOICE META: voiceFile", voiceFile);
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
			if(!ConfigManager.dismissed_cg_notice){
				$(".cg_notes").show();
				$(".cg_notes").on("click", function(e){
					var cgNoticeProp = "dismissed_cg_notice";
					ConfigManager[cgNoticeProp] = true;
					ConfigManager.save();
					$(".cg_notes").fadeOut();
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
			
			if(!!KC3StrategyTabs.pageParams[1]){
				this.showShip(KC3StrategyTabs.pageParams[1]);
			}else{
				this.showShip();
			}
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
			
			$(".tab_mstship .shipInfo .name").text( "[{0}] {1} {2}".format(ship_id, KC3Meta.shipName( shipData.api_name ), shipData.api_yomi) );
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
					+"&abyss="+(ship_id>500?1:0)
					+(!this.currentCardVersion?"":"&ver="+this.currentCardVersion);
			
			$(".tab_mstship .shipInfo .cgswf embed").remove();
			$("<embed/>")
				.attr("src", shipSrc)
				.attr("wmode", "transparent")
				.attr("menu", "false")
				.appendTo(".tab_mstship .shipInfo .cgswf");
			$(".tab_mstship .shipInfo .salty-zone").text(KC3Meta.term(denyTerm()));
			$(".tab_mstship .shipInfo .hourlies").html("");
			
			saltClassUpdate();
			
			var statBox;
			if(ship_id<=500){
				// Ship-only, non abyssal
				$(".tab_mstship .shipInfo .stats").html("");
				$(".tab_mstship .shipInfo .intro").html( shipData.api_getmes );
				
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
					$(".capacity", this).text( shipData.api_maxeq[index] );
					if(index >= shipData.api_slot_num){
						$(this).hide();
					}else{
						$(this).show();
					}

					// in case when the data isn't available,
					// slots should still be getting cleaned up
					$(".slotitem", this).text( "" );
					$(".sloticon img", this).attr("src","");

					if (stockEquipments) {
						var equipId = stockEquipments[index];
						if (equipId > 0) {
							var equipment = KC3Master.slotitem( equipId );
							$(".slotitem", this).text(KC3Meta.gearName( equipment.api_name ) );
							$(".sloticon img", this)
								.attr("src","../../../../assets/img/items/"+equipment.api_type[3]+".png");
							$(".sloticon img", this).attr("alt", equipId);
							$(".sloticon img", this).click(function(){
								KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
							});
							$(".sloticon img", this).show();
							$(".sloticon", this).addClass("hover");
						} else {
							$(".sloticon img", this).hide();
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
				
				$(".tab_mstship .shipInfo .subtitles").html("");
				
				// VOICE LINES
				$(".tab_mstship .shipInfo .voices").show();
				$(".tab_mstship .shipInfo .voices").html("");

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
				$(".tab_mstship .shipInfo .hourlies").html("");
				
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
			}else{
				// abyssals, just show json
				$(".tab_mstship .shipInfo .stats").hide();
				$(".tab_mstship .shipInfo .equipments").hide();
				$(".tab_mstship .shipInfo .subtitles").html("");
				
				// STATS
				KC3Database.get_enemyInfo(ship_id, function(enemyInfo){
					console.debug("enemyInfo", enemyInfo);
					if(enemyInfo){
						// ENEMY STATS
						$(".tab_mstship .shipInfo .stats").html("");
						$.each([
							["hp", "taik"],
							["fp", "houg"],
							["ar", "souk"],
							["tp", "raig"],
							["aa", "tyku"],
						], function(index, stat){
							statBox = $(".tab_mstship .factory .ship_stat").clone();
							$("img", statBox).attr("src", "../../../../assets/img/stats/"+stat[0]+".png");
							$(".ship_stat_name", statBox).text(stat[1]);
							
							$(".ship_stat_min", statBox).text(enemyInfo[stat[0]]);
							
							statBox.appendTo(".tab_mstship .shipInfo .stats");
						});
						
						// ENEMY EQUIPMENT
						$(".tab_mstship .equipments .equipment").each(function(index){
							$(".capacity", this).text("?");
							
							var equipId = enemyInfo["eq"+(index+1)];
							if (equipId > 0) {
								var equipment = KC3Master.slotitem( equipId );
								$(".slotitem", this).text(KC3Meta.gearName( equipment.api_name ) );
								$(".sloticon img", this)
									.attr("src","../../../../assets/img/items/"+equipment.api_type[3]+".png");
								$(".sloticon", this).addClass("hover");
							} else {
								$(".slotitem", this).text( "" );
								$(".sloticon img", this).hide();
								$(".sloticon", this).removeClass("hover");
							}
						});
						
						$(".tab_mstship .shipInfo .stats").show();
						$(".tab_mstship .shipInfo .equipments").show();
					}
				});
				
				$(".tab_mstship .shipInfo .voices").hide();
				$(".tab_mstship .shipInfo .hourlies").hide();
				$(".tab_mstship .shipInfo .intro").hide();
				$(".tab_mstship .shipInfo .more").hide();
				$(".tab_mstship .shipInfo .json").show();
				$(".tab_mstship .shipInfo .tokubest").hide();
			}
			
		}
	};
	
})();
