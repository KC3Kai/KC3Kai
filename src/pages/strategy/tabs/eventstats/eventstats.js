(function(){
	"use strict";

	KC3StrategyTabs.eventstats = new KC3StrategyTab("eventstats");

	KC3StrategyTabs.eventstats.definition = {
		tabSelf: KC3StrategyTabs.eventstats,
		maps: {},
		stats: {
			shipDamageDealt: {},
			taihaMagnets: {},
			dropList: {},
			shipKills: {},
			maxHit: {},
			lbConsumption: [],
			sortieConsumption: {},
			clearConsumption: {},
			lastDanceConsumption: {},
			lastHits: {},
			sortieCount: {},
			bossCount: {},
			clearCount: {},
			ldCount: {},
			kuso: {}
		},

		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
		},

		/* RELOAD: optional
		Loads latest player or game data if needed.
		---------------------------------*/
		reload: function() {
			const maps = localStorage.getObject("maps") || {};
			this.maps = {};
			Object.keys(maps)
				 // Modern battle API from Fall 17 (World 40) onwards
				.filter(id => Number(id.slice(1, -1)) >= 10)
				.sort((id1, id2) => {
					const m1 = id1.slice(-1), m2 = id2.slice(-1);
					let w1 = id1.slice(1, -1), w2 = id2.slice(1, -1);
					return Number(w2) - Number(w1) || Number(m1) - Number(m2);
				}).forEach(id => {
					this.maps[id] = maps[id];
				});
			this.updateMapSwitcher();
			$(".map_switcher .world_list").val(this.world);
		},

		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			$(".loading").hide();
			this.world = Number(KC3StrategyTabs.pageParams[1] || 0);
			this.updateMapSwitcher();
			$(".map_switcher .world_list").on("change", e => {
				const value = $(e.target).val();
				if(value) this.world = Number(value);
				KC3StrategyTabs.gotoTab(null, this.world);
			});
			$(".map_switcher .world_list").val(this.world || 0);
			this.loadEventStatistics();
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
			// Returning `true` means updating has been handled.
			return false;
		},

		updateMapSwitcher: function() {
			const listElem = $(".map_switcher .world_list");
			$.each(this.maps, (_, map) => {
				const mapId = map.id;
				const world = String(mapId).slice(0, -1);
				if($(`option[value=${world}]`, listElem).length === 0) {
					listElem.append(
						$("<option />").attr("value", world).text(KC3Meta.worldToDesc(world))
					);
				}
			});
		},

		loadEventStatistics: function() {
			if (this.world < 10) { return; }
			$(".loading").show();
			$(".table5").hide();
			$(".lbcons").hide();
			$(".map_list").html("").hide();
			$(".memorial").hide();
			const allPromises = [];
			const hqId = PlayerManager.hq.id;
			this.stats = {
				shipDamageDealt: {},
				taihaMagnets: {},
				dropList: {},
				shipKills: {},
				maxHit: {},
				lbConsumption: [],
				sortieConsumption: {},
				clearConsumption: {},
				lastDanceConsumption: {},
				lastHits: {},
				sortieCount: {},
				bossCount: {},
				clearCount: {},
				ldCount: {},
				kuso: {},
				dameconCount: 0
			};

			const buildConsumptionArray = arr => arr.reduce((acc, o) =>
				acc.map((v, i) => acc[i] + (o.data[i] || 0)), [0, 0, 0, 0, 0, 0, 0, 0]);

			const checkShipKill = (attacks, shipId, checkForLastHit, mapnum) => {
				attacks.forEach(attack => {
					const damage = Array.isArray(attack.damage) ? attack.damage.sumValues() : attack.damage;
					if (damage >= attack.ehp) {
						this.stats.shipKills[shipId] = (this.stats.shipKills[shipId] || 0) + 1;
						if (checkForLastHit && attack.target[0] === 0) {
							this.stats.lastHits[mapnum] = {
								ship: shipId,
								damage: damage,
								cutin: attack.cutin || attack.ncutin,
								time: !!attack.ncutin ? "yasen" : "day",
								overkill: damage - attack.ehp
							};
						}
					}
					if(Array.isArray(attack.damage)) {
						attack.damage.forEach(dam => this.stats.maxHit[shipId] = Math.max(dam, this.stats.maxHit[shipId] || 0));
					} else {
						this.stats.maxHit[shipId] = Math.max(damage, this.stats.maxHit[shipId] || 0);
					}
				});
			};

			const checkFleetAttacks = (fleet, ships, checkForLastHit, mapnum) => {
				for (let i = 0; i < fleet.length; i++) {
					checkShipKill(fleet[i].attacks, ships[i].mst_id, checkForLastHit, mapnum);
				}
			};

			// Shortern fleet length if needed for kuso
			const checkShipLength = (ships, maxHps, sortieKuso) => {
				if (ships.length == maxHps.length || sortieKuso.length == 0) { return ships; }
				let result = [];
				ships.forEach(ship => {
					if (!sortieKuso.includes(ship.mst_id)) {
						result.push(ship);
					}
				});
				return result;
			};

			const errorHandler = (e) => {
				console.warn("Unexpected error on retrieving event data", this.world, e);
				console.debug(`Eventstats for E-${this.world}`, e);/*RemoveLogging:skip*/
				$(".loading").hide();
				$(".map_list").text("Failed to retrieve event data due to unexpected error").show();
			};

			// Get LB Consumption first
			allPromises.push(KC3Database.con.navaloverall.where("type").equals("lbas" + this.world).toArray(lbArr => {
				this.stats.lbConsumption = buildConsumptionArray(lbArr);
			}));

			KC3Database.con.sortie.where("world").equals(this.world).and(data => data.hq === hqId).each(sortie => {
				const mapnum = sortie.mapnum;
				let hpbar = false;
				if (sortie.eventmap && sortie.eventmap.api_gauge_type == 2) hpbar = true;
				if (!this.stats.sortieCount[mapnum]) this.stats.sortieCount[mapnum] = 0;
				if (!this.stats.bossCount[mapnum]) this.stats.bossCount[mapnum] = 0;
				if (!this.stats.clearCount[mapnum]) this.stats.clearCount[mapnum] = 0;
				if (!this.stats.ldCount[mapnum]) this.stats.ldCount[mapnum] = 0;
				let cleared = false;
				let lastDance = false;
				if (sortie.eventmap && sortie.eventmap.api_cleared) cleared = true;
				if (!cleared) {
					this.stats.clearCount[mapnum]++;
					const mapname = `${this.world}${mapnum}`;
					const mapdata = this.maps["m" + mapname];
					const gauges = Object.keys(KC3Meta.eventGauge(mapname));
					if (sortie.eventmap && sortie.eventmap.api_now_maphp <= mapdata.baseHp && sortie.eventmap.api_gauge_num == gauges.length) {
						lastDance = true;
						this.stats.ldCount[mapnum]++;
					}
				}
				this.stats.sortieCount[mapnum]++;
				let isClearSortie = false;
				const mapname = `m${this.world}${mapnum}`;
				if (!cleared && hpbar && this.maps[mapname] && this.maps[mapname].stat) {
					const killid = this.maps[mapname].stat.onClear;
					if (killid == sortie.id) isClearSortie = true;
				}
				// Get battle data
				allPromises.push(KC3Database.con.battle.where("sortie_id").equals(sortie.id)
				.each(battle => {
					// Settle droplist first
					const drop = battle.drop;
					this.stats.dropList[mapnum] = this.stats.dropList[mapnum] || {};
					this.stats.dropList[mapnum][drop] = (this.stats.dropList[mapnum][drop] || 0) + 1;

					if (battle.boss) { this.stats.bossCount[mapnum]++; }
					// Battle API changed from Fall 2017 onwards, skip battle simulation
					if (this.world < 40) { return; }

					// Battle analysis
					const checkForLastHit = battle.boss && isClearSortie;
					const nodeData = sortie.nodes.find(node => node.id === battle.node);
					if (!nodeData) { return; }
					const nodeKind = nodeData.eventKind;
					const time = nodeKind === 2 ? "night" : (nodeKind === 7 ? "night_to_day" : "day");
					let battleData = time !== "night" ? battle.data : battle.yasen;
					// missing battle data, F5?
					if (!Object.keys(battleData).length) { return; }
					const battleType = {
						player: { 0: "single", 1: "ctf", 2: "stf", 3: "ctf" }[sortie.combined],
						enemy: !battleData.api_ship_ke_combined ? "single" : "combined",
						time: time
					};

					let result = KC3BattlePrediction.analyzeBattle(battleData, [], battleType);
					const fleetSent = battleData.api_deck_id;
					let ships = sortie["fleet" + fleetSent];
					let maxHps = battleData.api_f_maxhps, initialHps = battleData.api_f_nowhps;
					if (!maxHps) return;
					const sortieKuso = this.stats.kuso[sortie.id] || [];
					ships = checkShipLength(ships, maxHps, sortieKuso);
					if (ships.length != maxHps.length) {
						return;
					}
					ships = checkShipLength(ships, maxHps);
					if (sortie.combined > 0) {
						let fleet2 = sortie.fleet2;
						const maxHps2 = battleData.api_f_maxhps_combined;
						if (!maxHps2) return;
						fleet2 = checkShipLength(fleet2, maxHps2, sortieKuso);
						if (fleet2.length != maxHps2.length) {
							return;
						}
						ships = ships.concat(fleet2);
						maxHps = maxHps.concat(maxHps2);
						initialHps = initialHps.concat(battleData.api_f_nowhps_combined);
					}

					let eships = battleData.api_ship_ke;
					if (battleData.api_ship_ke_combined) {
						eships = eships.concat(battleData.api_ship_ke_combined);
					}

					let player = result.fleets.playerMain.concat(result.fleets.playerEscort);
					let enemy = result.fleets.enemyMain.concat(result.fleets.enemyEscort);
					player.forEach((ship, index) => {
						this.stats.shipDamageDealt[ships[index].mst_id] = (this.stats.shipDamageDealt[ships[index].mst_id] || 0) + ship.damageDealt;
					});
					checkFleetAttacks(player, ships, checkForLastHit, mapnum);
					if (Object.keys(battle.yasen).length > 0 && time === "day") {
						battleType.time = "night";
						if (battle.yasen.api_e_nowhps.length > 6) { // Old API entries
							battle.yasen.api_e_nowhps = battle.yasen.api_e_nowhps.slice(0, 6);
						}
						result = KC3BattlePrediction.analyzeBattle(battle.yasen, [], battleType);
						player = result.fleets.playerMain.concat(result.fleets.playerEscort);
						player.forEach((ship, index) => {
							this.stats.shipDamageDealt[ships[index].mst_id] = (this.stats.shipDamageDealt[ships[index].mst_id] || 0) + ship.damageDealt;
						});
						checkFleetAttacks(player, ships, checkForLastHit, mapnum);
					}

					// Assign taiha magnets
					for (let shipIdx = 0; shipIdx < ships.length; shipIdx++) {
						if (!ships[shipIdx]) continue;
						const taihaHp = maxHps[shipIdx] / 4;
						const resultHp = player[shipIdx].hp;

						// Handle pre-boss taiha
						if (resultHp < taihaHp && resultHp > 0 && initialHps[shipIdx] > taihaHp && !battle.boss) {
								this.stats.taihaMagnets[ships[shipIdx].mst_id] = (this.stats.taihaMagnets[ships[shipIdx].mst_id] || 0) + 1;
						}
						// Handle sunk ships
						if (resultHp <= 0) {
							if (ships[shipIdx].equip.includes(42) || ships[shipIdx].equip.includes(43)) {
								this.stats.dameconCount += 1;
							} else {
								if (!this.stats.kuso[sortie.id]) { this.stats.kuso[sortie.id] = []; }
								this.stats.kuso[sortie.id].push(ships[shipIdx].mst_id);
							}
						}
					}
				}));

				// Get sortie consumption
				allPromises.push(KC3Database.con.navaloverall.where("type").equals("sortie" + sortie.id).toArray(arr => {
					const consArray = buildConsumptionArray(arr);
					this.stats.sortieConsumption[mapnum] = this.stats.sortieConsumption[mapnum] || [];
					this.stats.sortieConsumption[mapnum].push(consArray);
					if (!cleared) {
						this.stats.clearConsumption[mapnum] = this.stats.clearConsumption[mapnum] || [];
						this.stats.clearConsumption[mapnum].push(consArray);
					}
					if (lastDance) {
						this.stats.lastDanceConsumption[mapnum] = this.stats.lastDanceConsumption[mapnum] || [];
						this.stats.lastDanceConsumption[mapnum].push(consArray);
					}
				  }));
			}).then(() => {
				Promise.all(allPromises).then(() => {
					for (let key in this.stats.sortieConsumption) {
						this.stats.sortieConsumption[key] = this.stats.sortieConsumption[key].reduce((acc, o) =>
						acc.map((v, i) => acc[i] + (o[i] || 0)), [0, 0, 0, 0, 0, 0, 0, 0]);
					}
					for (let key in this.stats.clearConsumption) {
						this.stats.clearConsumption[key] = this.stats.clearConsumption[key].reduce((acc, o) =>
						acc.map((v, i) => acc[i] + (o[i] || 0)), [0, 0, 0, 0, 0, 0, 0, 0]);
					}
					for (let key in this.stats.lastDanceConsumption) {
						this.stats.lastDanceConsumption[key] = this.stats.lastDanceConsumption[key].reduce((acc, o) =>
						acc.map((v, i) => acc[i] + (o[i] || 0)), [0, 0, 0, 0, 0, 0, 0, 0]);
					}
					this.displayEventStatistics();
				}).catch(errorHandler);
			}).catch(errorHandler);
		},

		displayEventStatistics: function() {
			if (!Object.keys(this.stats.sortieCount).length) {
				$(".loading").hide();
				$(".map_list").text("No data available for this event").show();
				return;
			}
			const getTopFive = (foo, forDrop=false) => {
				var props = Object.keys(foo).map(function(key) {
				  return { key: key, value: this[key] };
				  }, foo);
				  props.sort(function(p1, p2) { return p2.value - p1.value; });
				  return forDrop ? props.slice(1,6) : props.slice(0, 5);
			};

			const map = {
				"shipDamageDealt": "Total Damage Dealt",
				"maxHit": "Max Damage Dealt",
				"shipKills": "Ship Kills",
				"taihaMagnets": "Taiha Magnets",
			};
			if (this.world > 39) {
				Object.keys(map).forEach(key => {
					let str = "<tr>" + "<td>" + map[key] + "</td>";
					const vals = this.stats[key];
					const topFive = getTopFive(vals);
					for (let i = 0; i < Math.min(5, topFive.length); i++) {
						str += "<td><img src=" + KC3Meta.getIcon(topFive[i].key) + "></img><span>" + topFive[i].value + "</span></td>";
					}
					str += "</tr>";
					$(".table5").append(str);
				});
			}

			const buildLBMessage = consumption => {
				return consumption.map((v, i) => {
					const icon = $("<img />").attr("src", "/assets/img/client/" +
					["fuel.png", "ammo.png", "steel.png", "bauxite.png",
					"ibuild.png", "bucket.png", "devmat.png", "screws.png"][i]
					).width(13).height(13).css("margin", "-3px 2px 0 0");
					return i < 4 ? $("<div/>").append(icon).append(v).html() : "";
				}).join(" ");
			};
			const buildConsMessage = consumption => {
				return consumption.map((v, i) => {
					const icon = $("<img />").attr("src", "/assets/img/client/" +
					["fuel.png", "ammo.png", "steel.png", "bauxite.png",
					"ibuild.png", "bucket.png", "devmat.png", "screws.png"][i]
					).width(13).height(13).css("margin", "-3px 2px 0 0");
					return i < 6 ? $("<div/>").append(icon).append(v).html() : "";
				}).join(" ");
			};

			const difficutlies = ["Casual", "Easy", "Normal", "Hard"];
			let totalCost = this.stats.lbConsumption;
			if (totalCost.length == 0) { totalCost = [0, 0, 0, 0, 0, 0, 0, 0]; }
			const adder = ((arr1, arr2) => arr1.map((num, idx) => num + arr2[idx]));

			for (let i = 1; i <= 7; i++) {
				if ((this.stats.sortieCount[i] || 0) < 1 && (this.stats.clearCount[i] || 0) < 1) {continue;}
				const mapnum = i;
				const mapname = `m${this.world}${mapnum}`;
				const mapdata = this.maps[mapname];
				let difficulty = mapdata.difficulty;
				// Casual offset implemented from Winter 2018 onwards
				if (this.world < 41) { difficulty += 1; }
				const mapTitle = `E${mapnum}${KC3Meta.term(`EventRank${difficutlies[difficulty - 1]}Abbr`)}`;
				const curBox = $(".tab_eventstats .factory .map_box").clone();
				curBox.attr("id", "e-" + mapnum);

				$(".map_title", curBox).text(mapTitle);
				if (this.stats.clearConsumption[i] && this.world > 38) {
					$(".clear_runs", curBox).append("Clear Runs: " + this.stats.clearCount[i] + ", Cost: " + buildConsMessage(this.stats.clearConsumption[i]));
					//$(".clear_cost", curBox).append("Clear Expenditure: " + buildConsMessage(this.stats.clearConsumption[i]));
				}

				if (this.stats.lastDanceConsumption[i]) {
					$(".ld_runs", curBox).append("LD Runs: " + this.stats.ldCount[i] + ", Cost: " + buildConsMessage(this.stats.lastDanceConsumption[i]));
					//$(".ld_cost", curBox).append("LD Expenditure: " + buildConsMessage(this.stats.lastDanceConsumption[i]));
				}

				if (this.stats.lastHits[i]) {
					const result = this.stats.lastHits[i];
					let str = "{0} finished off the boss with {1} damage".format(
						KC3Meta.shipName(result.ship), result.damage
					);
					if (result.overkill > 0) { str += ` (${result.overkill} overkill)`; }
					else { str += " exactly"; }
					$(".clear_attack", curBox).append(str);
				}
				//$(".boss_runs", curBox).text("Boss Reaches: " + this.stats.bossCount[i]);
				if (this.world < 39) { // eventmap not saved yet
					$(".total_runs", curBox).append("Total Runs: " + `${this.stats.sortieCount[i]}`);
				} else {
					$(".total_runs", curBox).append("Boss Reaches / Total Runs: " + `${this.stats.bossCount[i]} / ${this.stats.sortieCount[i]}`
						+ ` (${Math.floor(this.stats.bossCount[i] / this.stats.sortieCount[i] * 10000) / 100}%)`);
				}
				$(".total_cost", curBox).append("Total Cost: " + buildConsMessage(this.stats.sortieConsumption[i]));
				totalCost = adder(totalCost, this.stats.sortieConsumption[i]);
				curBox.appendTo(".map_list");
			}

			Object.keys(this.stats.kuso).forEach(sortieid => {
				this.stats.kuso[sortieid].forEach(shipId => {
					const icon = $(".tab_eventstats .factory .memorial_shipicon").clone();
					$(".icon", icon).append("<img src=" + KC3Meta.getIcon(shipId) + "></img>");
					icon.appendTo(".memorial .shiplist");
				});
			});

			$(".lbcons").append("Land Base Cost: " + buildLBMessage(this.stats.lbConsumption));
			$(".totalcons").append("Total Event Cost: " + buildConsMessage(totalCost));
			$(".damecons").append("Damage Control Consumed: " + this.stats.dameconCount);
			$(".loading").hide();
			$(".table5").show();
			$(".lbcons").show();
			$(".map_list").show();
			if (Object.keys(this.stats.kuso).length > 0) { $(".memorial").show(); }
		},
	};

})();
