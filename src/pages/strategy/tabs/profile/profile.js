(function(){
	"use strict";
	
	KC3StrategyTabs.profile = new KC3StrategyTab("profile");
	
	KC3StrategyTabs.profile.definition = {
		tabSelf: KC3StrategyTabs.profile,
		
		player: {},
		statistics: false,
		newsfeed: {},
		showRawNewsfeed: false,
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){

		},

		/* RELOAD
		Prepares latest player data
		---------------------------------*/
		reload :function(){
			ConfigManager.load();
			// Check for player HQ info
			PlayerManager.hq.load();
			// Check for player statstics
			if(typeof localStorage.statistics != "undefined"){
				this.statistics = JSON.parse(localStorage.statistics);
			}else{
				this.statistics = false;
			}
			// Check for player news feed
			this.newsfeed = JSON.parse(localStorage.playerNewsFeed || "{}");
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			// First time hints can be dismissed
			if(!ConfigManager.dismissed_hints.homepage_hints){
				$(".homepage_hints").show();
				$(".homepage_hints").on("click", function(e){
					ConfigManager.loadIfNecessary();
					ConfigManager.dismissed_hints.homepage_hints = true;
					ConfigManager.save();
					$(".homepage_hints").fadeOut();
				});
			}
			
			// Show player information
			$(".hq_id .hq_content").html(PlayerManager.hq.id);
			$(".hq_name .hq_content").html(PlayerManager.hq.name);
			$(".hq_desc .hq_content").html(PlayerManager.hq.desc);
			
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			$(".hq_server .hq_content").html( MyServer.name );
			
			$(".hq_rank .hq_content").html(PlayerManager.hq.rank);
			$(".hq_level .hq_content").html(PlayerManager.hq.level);
			$(".hq_exp .hq_content").html( "{0} / {1}".format(PlayerManager.hq.exp[3], PlayerManager.hq.exp[1]+PlayerManager.hq.exp[3]) );
			
			$(".rank_previous .rank_content").html(PlayerManager.hq.rankPtLastCount);
			$(".rank_cutval .rank_content").html(PlayerManager.hq.rankPtCutoff);
			$(".rank_current .rank_content").html(PlayerManager.hq.getRankPoints());
			
			// Manual rank cut-off
			$("#rank_manual_cut").on("click", function(){
				PlayerManager.hq.rankCutOff();
				window.location.reload();
			});
			
			// Show statistics
			if(this.statistics){
				if(typeof this.statistics.sortie.rate == "string"){
					$(".stat_sortie .stat_rate .stat_value").html((Number(this.statistics.sortie.rate)*100)+"%");
				}else {
					$(".stat_sortie .stat_rate .stat_value").html(this.statistics.sortie.rate+"%");
				}
				$(".stat_sortie .stat_win .stat_value").html(this.statistics.sortie.win);
				$(".stat_sortie .stat_lose .stat_value").html(this.statistics.sortie.lose);
				
				$(".stat_pvp .stat_rate .stat_value").html(this.statistics.pvp.rate+"%");
				$(".stat_pvp .stat_win .stat_value").html(this.statistics.pvp.win);
				$(".stat_pvp .stat_lose .stat_value").html(this.statistics.pvp.lose);
				
				$(".stat_exped .stat_rate .stat_value").html(this.statistics.exped.rate+"%");
				$(".stat_exped .stat_success .stat_value").html(this.statistics.exped.success);
				$(".stat_exped .stat_total .stat_value").html(this.statistics.exped.total);
			}
			
			// Show news feed
			this.refreshNewsfeed(this.showRawNewsfeed);
			// Toggle news feed translation
			$("#translate_newsfeed").on("click", function(){
				self.showRawNewsfeed = !self.showRawNewsfeed;
				self.refreshNewsfeed(self.showRawNewsfeed);
				return false;
			});
			
			// Fix ledger data of IndexedDB, current:
			// 0: LBAS type, 1: Consumables empty useitem
			// Should be reserved until next several releases when most users have their fixed data
			if(!localStorage.fixed_ledger_db){
				KC3Database.get_lodger_data(Range(0,Infinity,0,1),
				function(ld){
					ld.forEach(function(d){
						if(d.type === "sortie0" || d.type === "lbas"){
							KC3Database.con.navaloverall.where("id").equals(d.id).modify(function(r){r.type="lbas6";});
						}
					});
				});
				delete localStorage.fixed_lbas_ledger;
				localStorage.fixed_ledger_db = 1;
				console.info("Ledger data of LBAS have been fixed");
			} else if(localStorage.fixed_ledger_db == 1){
				// Fix "hq": "0"
				KC3Database.con.useitem.where("hq").equals("0").modify(function(mr){mr.hq = PlayerManager.hq.id;});
				// Fix undefined consumables via using values of previous hour
				KC3Database.get_useitem(null, function(rs){
					var i,j,r,rp;
					for(i in rs){
						r = rs[i];
						for(j=i-1; j>0; j--){ rp = rs[j];
							if(typeof rp.torch !== "undefined") break;
						}
						if(typeof r.torch === "undefined" && typeof rp.torch !== "undefined"){
							rp.id = r.id; rp.hour = r.hour;
							KC3Database.con.useitem.put(rp);
						}
					}
				});
				localStorage.fixed_ledger_db = 2;
				console.info("Ledger data of Consumables have been fixed");
			}
			
			// Export all data
			$(".tab_profile .export_data").on("click", function(){
				var exportObject = {
					config: JSON.parse(localStorage.config || "{}"),
					fleets: JSON.parse(localStorage.fleets || "{}"),
					gears: JSON.parse(localStorage.gears || "{}"),
					//maps: JSON.parse(localStorage.maps || "{}"),
					player: JSON.parse(localStorage.player || "{}"),
					//quests: JSON.parse(localStorage.quests || "{}"),
					ships: JSON.parse(localStorage.ships || "{}"),
					//statistics: JSON.parse(localStorage.statistics || "{}")
				};
				var exportString = JSON.stringify(exportObject);
				exportObject.hash = exportString.hashCode();
				exportString = JSON.stringify(exportObject);
				
				var filename = self.makeFilename("Profile", "kc3");
				self.saveFile(filename, exportString, "application/json");
			});
			
			// Import data file open dialog
			$(".tab_profile .import_data").on("click", function(){
				$(".tab_profile .import_file").trigger("click");
			});
			
			// On-data has been read
			var reader = new FileReader();
			reader.onload = function(theFile){
				var importedData = JSON.parse(this.result);
				var hash = importedData.hash;
				delete importedData.hash;
				if( JSON.stringify(importedData).hashCode() == hash ) {
					alert("OK");
				} else {
					alert("Invalid KC3 File. Might have been edited, or from an old KC3 version.");
				}
				
				/*localStorage.config = JSON.stringify(importedData.config);
				localStorage.fleets = JSON.stringify(importedData.fleets);
				localStorage.gears = JSON.stringify(importedData.gears);
				localStorage.maps = JSON.stringify(importedData.maps);
				localStorage.player = JSON.stringify(importedData.player);
				localStorage.quests = JSON.stringify(importedData.quests);
				localStorage.ships = JSON.stringify(importedData.ships);
				localStorage.statistics = JSON.stringify(importedData.statistics);
				alert("Imported data for "+importedData.player.name+" from "+ KC3Meta.serverByNum(importedData.player.server).name+"!");
				window.location.reload();*/
			};
			
			// On-selected file to import
			$(".tab_profile .import_file").on("change", function(event){
				if( event.target.files.length > 0 ){
					if(window.File && window.FileReader && window.FileList && window.Blob){
						reader.readAsText( event.target.files[0] );
					}else{
						alert("Unfortunately, file reading is not available on your browser.");
					}
				}
			});
			
			// Export CSV: Sortie
			/*$(".tab_profile .export_csv_sortie").on("click", function(event){
				// CSV Headers
				var exportData = [
					"Secretary", "Fuel", "Ammo", "Steel", "Bauxite", "Result", "Date"
				].join(",")+String.fromCharCode(13);
				
				// Get data from local DB
				KC3Database.con.develop
					.where("hq").equals(PlayerManager.hq.id)
					.reverse()
					.toArray(function(result){
						result.forEach(function(buildInfo){
							console.log(buildInfo);
							exportData += [
								KC3Meta.shipName(KC3Master.ship(buildInfo.flag).api_name),
								buildInfo.rsc1, buildInfo.rsc2, buildInfo.rsc3, buildInfo.rsc4,
								KC3Meta.gearName(KC3Master.slotitem(buildInfo.result).api_name) || "Junk",
								"\""+(new Date(buildInfo.time*1000)).format("mmm dd, yyyy hh:MM tt")+"\"",
							].join(",")+String.fromCharCode(13);
						});
						
						var filename = self.makeFilename("LSC", ".csv");
						self.saveFile(filename, exportData, "text/csv");
					});
			});*/
			
			// Export CSV: Expedition
			$(".tab_profile .export_csv_exped").on("click", function(event){
				// CSV Headers
				var exportData = [
					"Expedition", "HQ Exp",
					"Fuel", "Ammo", "Steel", "Bauxite",
					"Reward 1", "Reward 2", "Result", "Date"
				].join(",")+String.fromCharCode(13);
				
				// Get data from local DB
				KC3Database.con.expedition
					.where("hq").equals(PlayerManager.hq.id)
					.reverse()
					.toArray(function(result){
						result.forEach(function(expedInfo){
							exportData += [
								expedInfo.mission, expedInfo.admiralXP,
								expedInfo.data.api_get_material[0],
								expedInfo.data.api_get_material[1],
								expedInfo.data.api_get_material[2],
								expedInfo.data.api_get_material[3],
								expedInfo.data.api_useitem_flag[0],
								expedInfo.data.api_useitem_flag[1],
								expedInfo.data.api_clear_result,
								"\""+(new Date(expedInfo.time*1000)).format("mmm dd, yyyy hh:MM tt")+"\"",
							].join(",")+String.fromCharCode(13);
						});
						
						var filename = self.makeFilename("Expeditions", "csv");
						self.saveFile(filename, exportData, "text/csv");
					});
			});
			
			// Export CSV: Construction
			$(".tab_profile .export_csv_build").on("click", function(event){
				// CSV Headers
				var exportData = [
					"Secretary", "Fuel", "Ammo", "Steel", "Bauxite", "Result", "Date"
				].join(",")+String.fromCharCode(13);
				
				// Get data from local DB
				KC3Database.con.build
					.where("hq").equals(PlayerManager.hq.id)
					.reverse()
					.toArray(function(result){
						result.forEach(function(buildInfo){
							//console.log(buildInfo);
							exportData += [
								KC3Meta.shipName(KC3Master.ship(buildInfo.flag).api_name),
								buildInfo.rsc1, buildInfo.rsc2, buildInfo.rsc3, buildInfo.rsc4,
								KC3Meta.shipName(KC3Master.ship(buildInfo.result).api_name),
								"\""+(new Date(buildInfo.time*1000)).format("mmm dd, yyyy hh:MM tt")+"\"",
							].join(",")+String.fromCharCode(13);
						});
						
						var filename = self.makeFilename("Constructions", "csv");
						self.saveFile(filename, exportData, "text/csv");
					});
			});
			
			// Export CSV: Crafting
			$(".tab_profile .export_csv_craft").on("click", function(event){
				// CSV Headers
				var exportData = [
					"Secretary", "Fuel", "Ammo", "Steel", "Bauxite", "Result", "Date"
				].join(",")+String.fromCharCode(13);
				
				// Get data from local DB
				KC3Database.con.develop
					.where("hq").equals(PlayerManager.hq.id)
					.reverse()
					.toArray(function(result){
						result.forEach(function(buildInfo){
							//console.log(buildInfo);
							exportData += [
								KC3Meta.shipName(KC3Master.ship(buildInfo.flag).api_name),
								buildInfo.rsc1, buildInfo.rsc2, buildInfo.rsc3, buildInfo.rsc4,
								KC3Meta.gearName(KC3Master.slotitem(buildInfo.result).api_name) || "Junk",
								"\""+(new Date(buildInfo.time*1000)).format("mmm dd, yyyy hh:MM tt")+"\"",
							].join(",")+String.fromCharCode(13);
						});
						
						var filename = self.makeFilename("Crafting", "csv");
						self.saveFile(filename, exportData, "text/csv");
					});
			});
			
			// Export CSV: LSC
			$(".tab_profile .export_csv_lsc").on("click", function(event){
				// CSV Headers
				var exportData = [
					"Secretary", "Fuel", "Ammo", "Steel", "Bauxite", "Dev Mat", "Result", "Date"
				].join(",")+String.fromCharCode(13);
				
				// Get data from local DB
				KC3Database.con.lsc
					.where("hq").equals(PlayerManager.hq.id)
					.reverse()
					.toArray(function(result){
						result.forEach(function(buildInfo){
							//console.log(buildInfo);
							exportData += [
								KC3Meta.shipName(KC3Master.ship(buildInfo.flag).api_name),
								buildInfo.rsc1, buildInfo.rsc2, buildInfo.rsc3, buildInfo.rsc4,
								buildInfo.devmat,
								KC3Meta.shipName(KC3Master.ship(buildInfo.result).api_name),
								"\""+(new Date(buildInfo.time*1000)).format("mmm dd, yyyy hh:MM tt")+"\"",
							].join(",")+String.fromCharCode(13);
						});
						
						var filename = self.makeFilename("LSC", "csv");
						self.saveFile(filename, exportData, "text/csv");
					});
			});
			
			
			// Clear Quick Data
			$(".tab_profile .clear_storage").on("click", function(event){
				localStorage.clear();
				window.location.reload();
			});
			
			// Clear Histories
			$(".tab_profile .clear_history").on("click", function(event){
				KC3Database.clear(function(){
					window.location.reload();
				});
			});
			
			// Reset Dismissed messages
			$(".tab_profile .clear_dismissed").on("click", function(event){
				// These variables may be moved into ConfigManager
				delete localStorage.read_api_notice;
				delete localStorage.read_api_notice_55;
				delete localStorage.read_dmm_notice_55;
				delete localStorage.repotedQuests;
				ConfigManager.load();
				ConfigManager.dismissed_hints = {};
				ConfigManager.save();
				// For debugging or special case
				delete localStorage.fixed_lbas_ledger;
				delete localStorage.fixed_ledger_db;
			});
			
			// Clear transient properties
			$(".tab_profile .clear_fcf").on("click", function(event){
				if(!confirm("Have you closed the game?\nThis fix won't work if you haven't closed the game."))
					return false;
				var json = localStorage.ships;
				var hash = json.hashCode();
				json = json.replace(/,\"didFlee\":(true|false)/g, "")
						   .replace(/,\"mvp\":(true|false)/g, "");
				if(hash !== json.hashCode()){
					localStorage.ships = json;
					KC3ShipManager.load();
					alert("Done!");
				} else {
					alert("No bug found!");
				}
			});
			
			// Clear buggy encounter data
			$(".tab_profile .clear_encounters").on("click", function(event){
				KC3Database.con.encounters.where("world").equals(0).toArray(function(encounterList){
					$.each(encounterList, function(index, encounterData){
						KC3Database.con.encounters.delete(encounterData.uniqid);
					});
					alert("Done 1/2~");
					KC3Database.con.encounters.where("world").equals(-1).toArray(function(encounterList){
						$.each(encounterList, function(index, encounterData){
							KC3Database.con.encounters.delete(encounterData.uniqid);
						});
						alert("Done 2/2!");
					});
				});
			});
		},
		
		refreshNewsfeed: function(showRawNewsfeed){
			var self = this;
			if(this.newsfeed && this.newsfeed.time){
				this.newsfeed.log.forEach(function(log, i){
					self.showFeedItem(i, self.newsfeed.time, log, !!showRawNewsfeed);
				});
				$(".newsfeed").show();
			} else {
				$(".newsfeed").hide();
			}
		},
		
		showFeedItem: function(index, time, log, showRawNewsfeed){
			var isRaw = !!showRawNewsfeed || ConfigManager.language == "jp";
			var selector = ".newsfeed .feed_item_{0}".format(index + 1);
			$(selector + " .time").text(new Date(time).format("mm/dd HH:MM"));
			switch(log.api_type){
			case "1":
				$(selector + " .colorbox").css("background", "#ffcc00");
				$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedRepair"));
				break;
			case "2":
				$(selector + " .colorbox").css("background", "#996600");
				$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedConstrct"));
				break;
			case "3":
				$(selector + " .colorbox").css("background", "#ace");
				$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedExped"));
				break;
			case "5":
				$(selector + " .colorbox").css("background", "#98e75f");
				var opponent = log.api_message.substring(1, log.api_message.indexOf("」"));
				if(log.api_message.indexOf("勝利") > -1){
					$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedPvPWin").format(opponent));
				} else if(log.api_message.indexOf("敗北") > -1){
					$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedPvPLose").format(opponent));
				} else {
					$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedUnknown").format(log.api_type, log.api_message) );
				}
				break;
			case "7":
				$(selector + " .colorbox").css("background", "#d75048");
				$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedUnlockMap"));
				break;
			case "11":
				$(selector + " .colorbox").css("background", "#9999ff");
				$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedUpdateLib"));
				break;
			default:
				$(selector + " .colorbox").css("background", "#ccc");
				$(selector + " .feed_text").html(isRaw ? log.api_message : KC3Meta.term("NewsfeedUnknown").format(log.api_type, log.api_message) );
				break;
			}
		},
		
		makeFilename: function(type, ext){
			return ["[",PlayerManager.hq.id,"] ",type," ",new Date().format("yyyy-mm-dd"),".",ext].join("");
		},
		
		saveFile: function(filename, data, type){
			var blob = new Blob([data], {type: type+";charset=utf-8"});
			saveAs(blob, filename);
		}
		
	};
	
})();
