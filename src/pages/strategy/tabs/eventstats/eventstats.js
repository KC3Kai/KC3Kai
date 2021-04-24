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
			lastHits: {},
			sortieCount: {},
			clearCount: {}
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
			const maps = localStorage.getObject("maps") || {};
			this.maps = {};
			Object.keys(maps)
				.sort((id1, id2) => {
					const m1 = id1.slice(-1), m2 = id2.slice(-1);
					let w1 = id1.slice(1, -1), w2 = id2.slice(1, -1);
					if(w1 === "7") w1 = "3.5";
					if(w2 === "7") w2 = "3.5";
					return Number(w1) - Number(w2) || Number(m1) - Number(m2);
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
			this.updateMapSwitcher()
			$(".map_switcher .world_list").on("change", e => {
				const value = $(e.target).val();
				if(value) this.world = Number(value);
				KC3StrategyTabs.gotoTab(null, this.world);
			});
			$(".map_switcher .world_list").val(this.world || 0);
			// TODO codes stub, remove this if nothing to do
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
			

			// TODO codes stub, remove this if nothing to do

			// Returning `true` means updating has been handled.
			return false;
		},

		updateMapSwitcher: function() {
			const listElem = $(".map_switcher .world_list");
			$.each(this.maps, (_, map) => {
				const mapId = map.id;
				const world = String(mapId).slice(0, -1);
				if (world < 10) { return; }
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
			$(".t5").hide();
			$(".cons").hide();
			$(".map_list").html("").hide()
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
				lastHits: {},
				sortieCount: {},
				clearCount: {}
			};

			const buildConsumptionArray = arr => arr.reduce((acc, o) =>
				acc.map((v, i) => acc[i] + (o.data[i] || 0)), [0, 0, 0, 0, 0, 0, 0, 0]);

			const checkFleetAttacks = (fleet, ships, checkForLastHit, mapnum) => {
				for (let i = 0; i < fleet.length; i++) {
					checkShipKill(fleet[i].attacks, ships[i], checkForLastHit, mapnum);
				}
			};

			const checkShipKill = (attacks, shipId, checkForLastHit, mapnum) => {
				attacks.forEach(attack => {
					const damage = Array.isArray(attack.damage) ? attack.damage.sumValues() : attack.damage;
					if (damage >= attack.ehp) {
						this.stats.shipKills[shipId] = (this.stats.shipKills[shipId] || 0) + 1;
						if (checkForLastHit && attack.target[0] === 0) {
							this.stats.lastHits[mapnum] = {
								ship: shipId,
								damage: damage
							}
						}
					}
					if(Array.isArray(attack.damage)) {
						attack.damage.forEach(dam => this.stats.maxHit[shipId] = Math.max(dam, this.stats.maxHit[shipId] || 0))
					} else {
						this.stats.maxHit[shipId] = Math.max(damage, this.stats.maxHit[shipId] || 0);
					}
				});
			}

			// Shortern fleet length if needed for kuso
			const checkShipLength = (ships, maxHps) => {
				while (maxHps.length !== ships.length) {
					for (let i = 0; i < ships.length; i++) {
						const master = KC3Master.ship(ships[i]);
						const hpRange = master.api_taik;
						if (maxHps[i] < hpRange[0] || maxHps[i] > hpRange[1]) {
							ships.splice(i, 1);
						}
					}
				}
				return ships;
			};

			// Get LB Consumption first
			allPromises.push(KC3Database.con.navaloverall.where("type").equals("lbas" + this.world)
    		.toArray(lbArr => {
				this.stats.lbConsumption = buildConsumptionArray(lbArr);
    		}));

			KC3Database.con.sortie.where("world").equals(this.world).and(data => data.hq === hqId).each(sortie => {
				const mapnum = sortie.mapnum;
				let hpbar = false;
				if (sortie.eventmap.api_gauge_type == 2) hpbar = true;
				if (!this.stats.sortieCount[mapnum]) this.stats.sortieCount[mapnum] = 0;
				if (!this.stats.clearCount[mapnum]) this.stats.clearCount[mapnum] = 0;
				let cleared = false;
				if (sortie.eventmap.api_cleared) cleared = true;
				if (!cleared) this.stats.clearCount[mapnum]++;
				this.stats.sortieCount[mapnum]++;
				let isClearSortie = false;
				const mapname = `m${this.world}${mapnum}`
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
			
					// Battle analysis
					const checkForLastHit = battle.boss && isClearSortie;
					const nodeData = sortie.nodes.find(node => node.id === battle.node);
					if (!nodeData) { return; }
					const nodeKind = nodeData.eventKind;
					const time = nodeKind === 2 ? "night" : (nodeKind === 7 ? "night_to_day" : "day");
					let battleData = time !== "night" ? battle.data : battle.yasen;
					const battleType = {
						player: { 0: "single", 1: "ctf", 2: "stf", 3: "ctf" }[sortie.combined],
						enemy: !battleData.api_ship_ke_combined ? "single" : "combined",
						time: time
					};
					
					let result = KC3BattlePrediction.analyzeBattle(battleData, [], battleType);
					const fleetSent = battleData.api_deck_id;
					let ships = sortie["fleet" + fleetSent].map(ship => ship.mst_id);
					let maxHps = battleData.api_f_maxhps, initialHps = battleData.api_f_nowhps;
					if (!maxHps) return;
					ships = checkShipLength(ships, maxHps);
					if (sortie.combined > 0) {
						let fleet2 = sortie.fleet2.map(ship => ship.mst_id);
						const maxHps2 = battleData.api_f_maxhps_combined;
						if (!maxHps2) return;
						fleet2 = checkShipLength(fleet2, maxHps2);
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
						this.stats.shipDamageDealt[ships[index]] = (this.stats.shipDamageDealt[ships[index]] || 0) + ship.damageDealt;
					});
					checkFleetAttacks(player, ships, checkForLastHit, mapnum);
					if (Object.keys(battle.yasen).length > 0 && time === "day") {
						battleType.time = "night";
						result = KC3BattlePrediction.analyzeBattle(battle.yasen, [], battleType);
						player = result.fleets.playerMain.concat(result.fleets.playerEscort);
						player.forEach((ship, index) => {
							this.stats.shipDamageDealt[ships[index]] = (this.stats.shipDamageDealt[ships[index]] || 0) + ship.damageDealt;
						});
						checkFleetAttacks(player, ships, checkForLastHit, mapnum);
					}
			
					// Assign taiha magnets
					if (!battle.boss) {
						for (let shipIdx = 0; shipIdx < ships.length; shipIdx++) {
							if (!ships[shipIdx]) continue;
							const taihaHp = maxHps[shipIdx] / 4;
							if (initialHps[shipIdx] < taihaHp) continue;
							const resultHp = player[shipIdx].hp;
							// No kuso here	
							if (resultHp < taihaHp && resultHp > 0) {
								this.stats.taihaMagnets[ships[shipIdx]] = (this.stats.taihaMagnets[ships[shipIdx]] || 0) + 1;
							}

						}
					}
				}));

				// Get sortie consumption
				allPromises.push(KC3Database.con.navaloverall.where("type").equals("sortie" + sortie.id).toArray(arr => {
					this.stats.sortieConsumption[mapnum] = this.stats.sortieConsumption[mapnum] || [];
					this.stats.sortieConsumption[mapnum].push(buildConsumptionArray(arr));
					if (!cleared) {
						this.stats.clearConsumption[mapnum] = this.stats.clearConsumption[mapnum] || [];
						this.stats.clearConsumption[mapnum].push(buildConsumptionArray(arr));
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
					this.displayEventStatistics();
				})
			});
		},

		displayEventStatistics: function() {
			const getTopFive = (foo, forDrop=false) => {
				var props = Object.keys(foo).map(function(key) {
				  return { key: key, value: this[key] };
				  }, foo);
				  props.sort(function(p1, p2) { return p2.value - p1.value; });
				  return forDrop ? props.slice(1,6) : props.slice(0, 5);
			  }

			const map = {
				"shipDamageDealt": "Total Damage Dealt",
				"maxHit": "Max Damage Dealt",
				"shipKills": "Ship Kills",
				"taihaMagnets": "Taiha Magnets",
			}

			const keys = Object.keys(map);
			for (const key of keys) {
				let str = "<tr>" + "<td>" + map[key] + "</td>"
				const vals = this.stats[key];
				const topFive = getTopFive(vals);
				for (let i = 0; i < 5; i++) {
					str += "<td><img src=" + KC3Meta.getIcon(topFive[i]["key"]) + " width=30px height=30px></img>" + topFive[i]["value"] + "</td>"
				}
				str += "</tr>"
				$("#t5").append(str);
			}

			const buildLBMessage = consumption => {
				return consumption.map((v, i) => {
					const icon = $("<img />").attr("src", "/assets/img/client/" +
					["fuel.png", "ammo.png", "steel.png", "bauxite.png",
					"ibuild.png", "bucket.png", "devmat.png", "screws.png"][i]
					).width(13).height(13).css("margin", "-3px 2px 0 0");
					return i < 4 ? $("<div/>").append(icon).append(v).html() : "";
				}).join(" ");
			}
			const buildConsMessage = consumption => {
				return consumption.map((v, i) => {
					const icon = $("<img />").attr("src", "/assets/img/client/" +
					["fuel.png", "ammo.png", "steel.png", "bauxite.png",
					"ibuild.png", "bucket.png", "devmat.png", "screws.png"][i]
					).width(13).height(13).css("margin", "-3px 2px 0 0");
					return i < 6 ? $("<div/>").append(icon).append(v).html() : "";
				}).join(" ");
			}


			const difficutlies = ["Casual", "Easy", "Normal", "Hard"]

			for (let i = 1; i <= 7; i++) {
				if ((this.stats.sortieCount[i] || 0) < 1 && (this.stats.clearCount[i] || 0) < 1) {continue;}
				const mapnum = i;
				const mapname = `m${this.world}${mapnum}`;
				const mapdata = this.maps[mapname];
				const difficulty = mapdata.difficulty;
				const mapTitle = `E${mapnum}${KC3Meta.term(`EventRank${difficutlies[difficulty - 1]}Abbr`)}`
				const curBox = $(".tab_eventstats .factory .map_box").clone();
				curBox.attr("id", "e-" + mapnum);

				$(".map_title", curBox).text(mapTitle);
				if (this.stats.clearConsumption[i]) {
					$(".clear_runs", curBox).text("Number of Runs to Clear: " + this.stats.clearCount[i]);
					$(".clear_cost", curBox).append("Clear Expenditure: " + buildConsMessage(this.stats.clearConsumption[i]));
				}

				$(".total_runs", curBox).text("Total Number of Runs: " + this.stats.sortieCount[i]);
				$(".total_cost", curBox).append("Total Expenditure: " + buildConsMessage(this.stats.sortieConsumption[i]));
				curBox.appendTo(".map_list");
			}
			$(".lbcons").append("Land Base Consumption: " + buildLBMessage(this.stats.lbConsumption));
			$(".loading").hide();
			$(".t5").show();
			$(".cons").show();
			$(".map_list").show();

		},
	};

})();
