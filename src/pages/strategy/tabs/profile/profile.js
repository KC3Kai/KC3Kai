(function(){
	"use strict";
	
	KC3StrategyTabs.profile = new KC3StrategyTab("profile");
	
	KC3StrategyTabs.profile.definition = {
		tabSelf: KC3StrategyTabs.profile,
		
		player: {},
		statistics: false,
		newsfeed: {},
		showRawNewsfeed: false,
		battleCounts: {},
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			this.battleCounts.lastPortTime = 0;
		},

		/* RELOAD
		Prepares latest player data
		---------------------------------*/
		reload :function(){
			ConfigManager.load();
			// Check for player HQ info
			PlayerManager.hq.load();
			// Check for player statistics
			if(localStorage.statistics !== undefined){
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
			$(".hq_id .hq_content").text(PlayerManager.hq.id);
			$(".hq_name .hq_content").text(PlayerManager.hq.name);
			$(".hq_desc .hq_content").text(PlayerManager.hq.desc);
			
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			$(".hq_server .hq_content").text( MyServer.name );
			
			$(".hq_rank .hq_content").text(PlayerManager.hq.rank);
			$(".hq_level .hq_content").text(PlayerManager.hq.level);
			$(".hq_exp .hq_content").text(
				"{0} / {1}".format(
					PlayerManager.hq.exp[3].toLocaleString(),
					(PlayerManager.hq.exp[1]+PlayerManager.hq.exp[3]).toLocaleString()
				)
			);
			
			$(".rank_previous .rank_content").text(
				PlayerManager.hq.rankPtLastCount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
			);
			$(".rank_cuttime .rank_content").text(
				!PlayerManager.hq.rankPtLastTimestamp ? "?"
					: new Date(PlayerManager.hq.rankPtLastTimestamp).format("yyyy-mm-dd HH:MM:ss")
			);
			$(".rank_cutval .rank_content").text(
				PlayerManager.hq.rankPtCutoff.toLocaleString()
			);
			$(".rank_current .rank_content").text(
				PlayerManager.hq.getRankPoints().toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
			);
			
			// Manual rank cut-off
			$("#rank_manual_cut").on("click", function(){
				PlayerManager.hq.load();
				PlayerManager.hq.rankCutOff();
				PlayerManager.hq.save();
				window.location.reload();
			});
			
			// Show statistics
			if(this.statistics){
				$(".stat_sortie .stat_rate .stat_value").text(this.statistics.sortie.rate + "%");
				$(".stat_sortie .stat_win .stat_value").text(this.statistics.sortie.win);
				$(".stat_sortie .stat_lose .stat_value").text(this.statistics.sortie.lose);
				
				$(".stat_pvp .stat_rate .stat_value").text(this.statistics.pvp.rate + "%");
				$(".stat_pvp .stat_win .stat_value").text(this.statistics.pvp.win);
				$(".stat_pvp .stat_lose .stat_value").text(this.statistics.pvp.lose);
				
				$(".stat_exped .stat_rate .stat_value").text(this.statistics.exped.rate + "%");
				$(".stat_exped .stat_success .stat_value").text(this.statistics.exped.success);
				$(".stat_exped .stat_total .stat_value").text(this.statistics.exped.total);
			}
			
			// Show news feed
			this.refreshNewsfeed(this.showRawNewsfeed);
			// Toggle news feed translation
			$("#translate_newsfeed").on("click", function(){
				self.showRawNewsfeed = !self.showRawNewsfeed;
				self.refreshNewsfeed(self.showRawNewsfeed);
				return false;
			});
			
			// Show health metric
			if(PlayerManager.hq.lastPortTime > this.battleCounts.lastPortTime){
				let lastMonthSec = Math.floor(new Date().shiftDate(-30).getTime() / 1000);
				let last2DaySec = Math.floor(new Date().shiftHour(-48).getTime() / 1000);
				let lastDaySec = Math.floor(new Date().shiftHour(-24).getTime() / 1000);
				KC3Database.count_sortie_battle(function(sc, bc){
					self.battleCounts.lastDaySortie = sc;
					self.battleCounts.lastDayBattle = bc;
				}, lastDaySec);
				KC3Database.count_sortie_battle(function(sc, bc){
					self.battleCounts.last2DaySortie = sc;
					self.battleCounts.last2DayBattle = bc;
				}, last2DaySec);
				KC3Database.count_sortie_battle(function(sc, bc){
					self.battleCounts.lastMonthSortie = sc;
					self.battleCounts.lastMonthBattle = bc;
					self.battleCounts.lastMonthAvgBattle = Math.round(bc / 30);
					self.battleCounts.lastPortTime = PlayerManager.hq.lastPortTime;
					self.refreshHealthMetric();
				}, lastMonthSec);
			} else {
				this.refreshHealthMetric();
			}
			
			// Show localStorage space usage (unit is Kilo chars, not bytes)
			let usedChars = localStorage.usedSpace();
			let kiloChars = Math.floor(usedChars / 1024);
			let usedPercent = Math.floor(usedChars / localStorage.quotaLength * 1000) / 10;
			$(".management .used").text("Used {0}K, {1}%".format(kiloChars, usedPercent));
			
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
			
			// MIME text/csv uses CRLF as line breaks according RFC-4180
			const CSV_LINE_BREAKS = String.fromCharCode(13) + String.fromCharCode(10);
			// Precompiled regexp for better performance
			const CSV_QUOTE_TEST_REGEXP = /(\s|\r|\n|\")/;
			const CSV_DQUOTE_REGEXP = /\"/g;
			let csvDquoteEscaped = function(field) {
				return '"' + field.replace(CSV_DQUOTE_REGEXP, '""') + '"';
			};
			let csvQuoteIfNecessary = function(field) {
				return CSV_QUOTE_TEST_REGEXP.test(field) ? csvDquoteEscaped(field) : field;
			};
			// Export CSV: Sortie
			/*$(".tab_profile .export_csv_sortie").on("click", function(event){
				// CSV Headers
				var exportData = [
					"Secretary", "Fuel", "Ammo", "Steel", "Bauxite", "Result", "Date"
				].join(",")+CSV_LINE_BREAKS;
				
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
							].join(",")+CSV_LINE_BREAKS;
						});
						
						var filename = self.makeFilename("LSC", ".csv");
						self.saveFile(filename, exportData, "text/csv");
					});
			});*/
			
			const exportExpedCsv = (forAsw) => {
				// CSV Headers
				var exportData = [
					"Expedition", "HQ Exp",
					"Fuel", "Ammo", "Steel", "Bauxite",
					"Reward 1", "Reward 2", "Result", "Date", "Fleet#",
					"Ship #1", "Ship #2", "Ship #3",
					"Ship #4", "Ship #5", "Ship #6",
				].concat(forAsw ? ["Total AA", "Total LoS", "Total ASW"] : [])
				.join(",") + CSV_LINE_BREAKS;
				const buildRewardItemText = (data, index) => {
					const flag = data.api_useitem_flag[index - 1],
						getItem = data["api_get_item" + index];
					return csvQuoteIfNecessary(
						(flag === 4 ? KC3Meta.useItemName(getItem.api_useitem_id) :
						({"0":"None","1":"Bucket","2":"Blowtorch","3":"DevMat"})[flag] || flag)
						+
						(flag > 0 && getItem ? " x" + getItem.api_useitem_count : "")
					);
				};
				const sumEquipStats = (equipArr, apiName) => {
					return equipArr.reduce(
						(total, id) => (id > 0 ? KC3Master.slotitem(id)["api_" + apiName] || 0 : 0), 0
					);
				};
				const sumShipStats = (shipInfo) => {
					const stats = {
						aa: 0,
						aaEquip: 0,
						los: 0,
						losEquip: 0,
						asw: 0,
						aswEquip: 0
					};
					const shipMst = KC3Master.ship(shipInfo.mst_id);
					stats.aaEquip = sumEquipStats(shipInfo.equip, "tyku");
					stats.losEquip = sumEquipStats(shipInfo.equip, "saku");
					stats.aswEquip = sumEquipStats(shipInfo.equip, "tais");
					stats.aa = shipMst.api_tyku[0] + shipInfo.kyouka[2];
					if(shipInfo.stats){
						stats.los = shipInfo.stats.ls || 0;
						stats.asw = shipInfo.stats.as || 0;
					} else {
						stats.los = WhoCallsTheFleetDb.estimateStat(WhoCallsTheFleetDb.getStatBound(shipInfo.mst_id, "los"), shipInfo.level) || 0;
						stats.asw = WhoCallsTheFleetDb.estimateStat(WhoCallsTheFleetDb.getStatBound(shipInfo.mst_id, "asw"), shipInfo.level) || 0;
					}
					return stats;
				};
				// Get data from local DB
				let db = KC3Database.con.expedition.where("hq").equals(PlayerManager.hq.id);
				// Only need mission ID >= 100
				if(forAsw) db = db.and(r => r.mission >= 100);
				db.reverse().toArray(function(result){
					result.forEach(function(expedInfo){
						const fleetStats = {
							aa: 0,
							los: 0,
							asw: 0,
						};
						const shipsInfo = expedInfo.fleet.map(ship => {
							if(ship.mst_id > 0){
								const stats = sumShipStats(ship);
								fleetStats.aa += stats.aa + stats.aaEquip;
								fleetStats.los += stats.los + stats.losEquip;
								fleetStats.asw += stats.asw + stats.aswEquip;
								return csvQuoteIfNecessary([
									// Give up using String.format for better performance
									KC3Meta.shipName(KC3Master.ship(ship.mst_id).api_name),
									"Lv:" + ship.level,
									"Morale:" + ship.morale,
									"Drums:" + ship.equip.reduce((drums, id) => drums+=(id===75), 0)
								].concat(forAsw ? ["AA+-LoS+-ASW+-",
										stats.aa + stats.aaEquip, stats.aa,
										stats.los + stats.losEquip, stats.los,
										stats.asw + stats.aswEquip, stats.asw].join(":") : []
								).join("/"));
							} else {
								return "-";
							}
						});
						if(shipsInfo.length < 6){
							shipsInfo.length = 6;
							shipsInfo.fill("-", expedInfo.fleet.length);
						}
						exportData += [
							expedInfo.mission, expedInfo.admiralXP,
							expedInfo.data.api_get_material[0],
							expedInfo.data.api_get_material[1],
							expedInfo.data.api_get_material[2],
							expedInfo.data.api_get_material[3],
							buildRewardItemText(expedInfo.data, 1),
							buildRewardItemText(expedInfo.data, 2),
							["F", "S", "GS"][expedInfo.data.api_clear_result] || expedInfo.data.api_clear_result,
							csvQuoteIfNecessary(new Date(expedInfo.time * 1000).format("mmm dd, yyyy hh:MM tt")),
							expedInfo.fleetN
						].concat(shipsInfo)
						.concat(forAsw ? [fleetStats.aa, fleetStats.los, fleetStats.asw] : [])
						.join(",") + CSV_LINE_BREAKS;
					});
					
					const filename = self.makeFilename("Expeditions", "csv");
					self.saveFile(filename, exportData, "text/csv");
				}).catch(function(e){
					console.error("Export expedition error", e);
					alert("Oops! There is something wrong. You might report the error logs.");
				});
			};
			// Export CSV: Expedition
			$(".tab_profile .export_csv_exped").on("click", function(event){
				exportExpedCsv(false);
			});
			$(".tab_profile .export_csv_exped_asw").on("click", function(event){
				exportExpedCsv(true);
			});
			
			// Export CSV: Construction
			$(".tab_profile .export_csv_build").on("click", function(event){
				// CSV Headers
				var exportData = [
					"Secretary", "Fuel", "Ammo", "Steel", "Bauxite", "Result", "Date"
				].join(",")+CSV_LINE_BREAKS;
				
				// Get data from local DB
				KC3Database.con.build
					.where("hq").equals(PlayerManager.hq.id)
					.reverse()
					.toArray(function(result){
						result.forEach(function(buildInfo){
							//console.log(buildInfo);
							exportData += [
								csvQuoteIfNecessary(KC3Meta.shipName(KC3Master.ship(buildInfo.flag).api_name)),
								buildInfo.rsc1, buildInfo.rsc2, buildInfo.rsc3, buildInfo.rsc4,
								csvQuoteIfNecessary(KC3Meta.shipName(KC3Master.ship(buildInfo.result).api_name)),
								csvQuoteIfNecessary(new Date(buildInfo.time*1000).format("mmm dd, yyyy hh:MM tt")),
							].join(",")+CSV_LINE_BREAKS;
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
				].join(",")+CSV_LINE_BREAKS;
				
				// Get data from local DB
				KC3Database.con.develop
					.where("hq").equals(PlayerManager.hq.id)
					.reverse()
					.toArray(function(result){
						result.forEach(function(buildInfo){
							//console.log(buildInfo);
							exportData += [
								csvQuoteIfNecessary(KC3Meta.shipName(KC3Master.ship(buildInfo.flag).api_name)),
								buildInfo.rsc1, buildInfo.rsc2, buildInfo.rsc3, buildInfo.rsc4,
								csvQuoteIfNecessary(KC3Meta.gearName(KC3Master.slotitem(buildInfo.result).api_name) || "Junk"),
								csvQuoteIfNecessary(new Date(buildInfo.time*1000).format("mmm dd, yyyy hh:MM tt")),
							].join(",")+CSV_LINE_BREAKS;
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
				].join(",")+CSV_LINE_BREAKS;
				
				// Get data from local DB
				KC3Database.con.lsc
					.where("hq").equals(PlayerManager.hq.id)
					.reverse()
					.toArray(function(result){
						result.forEach(function(buildInfo){
							//console.log(buildInfo);
							exportData += [
								csvQuoteIfNecessary(KC3Meta.shipName(KC3Master.ship(buildInfo.flag).api_name)),
								buildInfo.rsc1, buildInfo.rsc2, buildInfo.rsc3, buildInfo.rsc4,
								buildInfo.devmat,
								csvQuoteIfNecessary(KC3Meta.shipName(KC3Master.ship(buildInfo.result).api_name)),
								csvQuoteIfNecessary(new Date(buildInfo.time*1000).format("mmm dd, yyyy hh:MM tt")),
							].join(",")+CSV_LINE_BREAKS;
						});
						
						var filename = self.makeFilename("LSC", "csv");
						self.saveFile(filename, exportData, "text/csv");
					});
			});
			
			// Export CSV: Abyssal Enemies
			$(".tab_profile .export_csv_abyssal").on("click", function(event){
				// CSV Headers
				var exportData = [
					"ID", "Name", "SType", "HP", "FP", "AR", "TP", "AA", "Speed", "Equip1", "Equip2", "Equip3", "Equip4"
				].join(",")+CSV_LINE_BREAKS;
				KC3Database.con.enemy
					.toArray(function(result){
						result.forEach(function(ab){
							exportData += [
								ab.id,
								csvQuoteIfNecessary(KC3Meta.abyssShipName(ab.id)),
								csvQuoteIfNecessary(KC3Meta.stype(KC3Master.ship(ab.id).api_stype)),
								ab.hp,
								ab.fp,
								ab.ar,
								ab.tp,
								ab.aa,
								csvQuoteIfNecessary(KC3Meta.shipSpeed(KC3Master.ship(ab.id).api_soku)),
								csvQuoteIfNecessary("[" + ab.eq1 + "] " + KC3Meta.gearName(KC3Master.slotitem(ab.eq1).api_name || "")),
								csvQuoteIfNecessary("[" + ab.eq2 + "] " + KC3Meta.gearName(KC3Master.slotitem(ab.eq2).api_name || "")),
								csvQuoteIfNecessary("[" + ab.eq3 + "] " + KC3Meta.gearName(KC3Master.slotitem(ab.eq3).api_name || "")),
								csvQuoteIfNecessary("[" + ab.eq4 + "] " + KC3Meta.gearName(KC3Master.slotitem(ab.eq4).api_name || ""))
							].join(",")+CSV_LINE_BREAKS;
						});
						
						var filename = self.makeFilename("AbyssalShips", "csv");
						self.saveFile(filename, exportData, "text/csv");
					});
			});

			$(".tab_profile .export_json_logs").on("click", () => {
				KC3Database.con.logs
					.orderBy('timestamp')
					.and(({ type }) => type === 'error' || type === 'warn')
					.toArray()
					.then((data) => {
						const filename = self.makeFilename("ErrorLog", "json");
						self.saveFile(filename, JSON.stringify(data), "text/json");
					});
			});
			
			
			// Clear Quick Data
			$(".tab_profile .clear_storage").on("click", function(event){
				if( ! confirm("Are you sure? Lost data would not be recovered."))
					return false;
				localStorage.clear();
				window.location.reload();
			});
			
			// Clear Histories
			$(".tab_profile .clear_history").on("click", function(event){
				if( ! confirm("Are you sure? Lost data would not be recovered."))
					return false;
				KC3Database.clear(function(){
					window.location.reload();
				});
			});
			
			// Clear RemodelDb
			$(".tab_profile .clear_remodeldb").on("click", function(event) {
				let result = confirm(
					"You are about to remove ship remodel information, " +
						"it won't be available until next time you restart game with KC3.");
				if(result === true) {
					delete localStorage.remodelDb;
					window.location.reload();
				}
			});

			// Reset Dismissed messages
			$(".tab_profile .clear_dismissed").on("click", function(event){
				// These variables may be moved into ConfigManager
				delete localStorage.read_api_notice;
				delete localStorage.read_api_notice_55;
				delete localStorage.read_dmm_notice_55;
				delete localStorage.repotedQuests;
				delete localStorage.fixed_lbas_ledger;
				delete localStorage.fixed_ledger_db;
				delete localStorage.apiUsage;
				ConfigManager.load();
				ConfigManager.dismissed_hints = {};
				delete ConfigManager.air_average;
				delete ConfigManager.air_bounds;
				ConfigManager.save();
				// Give a response instead of alert
				window.location.reload();
			});
			
			// Clear inconsistent localStorage cached ships & gears
			$(".tab_profile .clear_localcache").on("click", function(event){
				if(!confirm("Have you closed the game?\nThis fix won't work if you haven't closed all other KC3 tabs."))
					return false;
				delete localStorage.ships;
				delete localStorage.gears;
				alert("Done! Cache data will be available again after you restart the game.");
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
				KC3Database.con.encounters.filter(d => {
					const ke = JSON.parse(d.ke || null);
					const letter = KC3Meta.nodeLetter(d.world, d.map, d.node);
					return d.world <= 0 || !Array.isArray(ke) || ke.length < 6
						|| (d.world < 10 && letter === d.node);
				}).delete().then((count) => {
					if(count) alert("Done!"); else alert("No bug found!");
				});
			});
			
			// Fix buggy ledger data, current possible types:
			// 1: LBAS type, 2: Consumables empty useitem
			$(".tab_profile .fix_ledger").on("click", function(event){
				// Fix LBAS type
				KC3Database.get_lodger_data(Range(0,Infinity,0,1),
				function(ld){
					ld.forEach(function(d){
						if(d.type === "sortie0" || d.type === "lbas"){
							KC3Database.con.navaloverall.where("id").equals(d.id).modify(function(r){r.type="lbas6";});
						}
					});
					console.info("Ledger data of LBAS have been fixed");/*RemoveLogging:skip*/
				});
				alert("Done 1/2~");
				
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
					console.info("Graph data of Consumables have been fixed");/*RemoveLogging:skip*/
				});
				alert("Done 2/2!");
			});
			
			// Fix abyssal master IDs after 2017-04-05 (bump 1000)
			$(".tab_profile .fix_abyssal").on("click", function(event){
				// Fix table `enemy`. To update primary key, have to delete all records first
				KC3Database.con.enemy.toArray(function(enemyList){
					KC3Database.con.enemy.clear();
					for(let r of enemyList){
						if(r.id < 1501) { r.id += 1000; }
						KC3Database.Enemy(r);
					}
					console.info("Enemy stats have been fixed");/*RemoveLogging:skip*/
					alert("Done 1/3~");
				});
				
				// Fix table `encounters`. To update primary key, have to delete all records first
				KC3Database.con.encounters.toArray(function(encList){
					KC3Database.con.encounters.clear();
					for(let r of encList){
						let ke = JSON.parse(r.ke);
						if(ke.some(id => id > 500 && id < 1501)){
							ke = ke.map(id => id > 500 ? id + 1000 : id);
							r.ke = JSON.stringify(ke);
							let id = r.uniqid.split("/");
							id[4] = r.ke;
							r.uniqid = id.join("/");
						}
						KC3Database.Encounter(r, false);
					}
					console.info("Encounters have been fixed");/*RemoveLogging:skip*/
					alert("Done 2/3~");
				});
				
				// Fix table `battle`
				KC3Database.con.battle.toArray(function(battleList){
					var updateKe = function(keArr){
						if(Array.isArray(keArr) && keArr.some(id => id > 500 && id < 1501)){
							return keArr.map(id => id > 500 ? id + 1000 : id);
						}
						return keArr;
					};
					var logError = function(e){ console.error("Database fixing error", e); };
					try {
						for(let r of battleList){
							let day = r.data;
							let night = r.yasen;
							if(day.api_ship_ke)
								day.api_ship_ke = updateKe(day.api_ship_ke);
							if(day.api_ship_ke_combined)
								day.api_ship_ke_combined = updateKe(day.api_ship_ke_combined);
							if(night.api_ship_ke)
								night.api_ship_ke = updateKe(night.api_ship_ke);
							if(night.api_ship_ke_combined)
								night.api_ship_ke_combined = updateKe(night.api_ship_ke_combined);
							KC3Database.con.battle.put(r).catch(logError);
						}
						console.info("Battle enemies have been fixed");/*RemoveLogging:skip*/
					} catch(e) {
						console.error("Fixing battle enemies error", e);
					}
					alert("Done 3/3!");
				});
			});
			
		},
		
		refreshHealthMetric: function(){
			var bc = this.battleCounts;
			if(Object.keys(bc).length < 2) return;
			$(".day_battle_total_24 .rank_content").html(
				'{0}<span style="font-weight:normal"> (during {1} sorties)</span>'
					.format(bc.lastDayBattle, bc.lastDaySortie)
			);
			$(".day_battle_total_48 .rank_content").html(
				'{0}<span style="font-weight:normal"> (during {1} sorties)</span>'
					.format(bc.last2DayBattle, bc.last2DaySortie)
			);
			$(".month_battle_total .rank_content").html(
				'{0}<span style="font-weight:normal"> (during {1} sorties)</span>'
					.format(bc.lastMonthBattle, bc.lastMonthSortie)
			);
			$(".month_battle_average .rank_content").text(bc.lastMonthAvgBattle);
			if(bc.last2DayBattle > 300 && bc.last2DayBattle > bc.lastMonthAvgBattle * 3)
				$(".day_battle_total_48 .rank_content").css("color", "orange");
			if(bc.lastDayBattle > 200 && bc.lastDayBattle > bc.lastMonthAvgBattle * 2)
				$(".day_battle_total_24 .rank_content").css("color", "orange");
		},
		
		refreshNewsfeed: function(showRawNewsfeed){
			var self = this;
			if(this.newsfeed && this.newsfeed.time){
				this.newsfeed.log.forEach(function(log, i){
					// we are using the same timestamp for making it look like a proper log,
					// as for now there's no timestamp from KCSAPI,
					// perhaps this is the best we can do.
					// see some discussions at https://github.com/KC3Kai/KC3Kai/issues/1782
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
