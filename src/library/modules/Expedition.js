/*

Expedition: Expedition information, income estimation, scoring and utils for Expedition Configs

- terms:

	- GS: short for Great Success
	- eId: short for Expedition Id
    - config: one configuration for a specific expedition.
		it consists of two parts:
		- a "modifier" part, which can be seen as a number
			that get multiplied to the base resource income
		- a "cost" part, which can be seen as expected fuel and ammo
			consumption
	- ExpedConfig: a set of expedition config,
		a mapping from all expedition ids to their configs
	- cost model: a function that models ship fuel and ammo consumption.
		given a fleet composition (e.g. 1CL5DD) it will return an array of 6 elements,
        with each of them being "{fuel: some integer, ammo: some integer}" to indicate
        the maximum consumption for ship in that position. then consumption percentage
        can be applied on each individual ship. after which, summing up the resulting
		list can yield an accurate consumption.

- export list:

	- allExpedIds: a list of [1..40] for doing maping or "forEach"-ing
	- enumFromTo(from,to,step=1): generate a list: [from,from+step .. to]
	- saturate(v,min,max): limit v in range of min..max
	- generateRandomConfig(): generate random ExpedConfig,
		was written to see a vary of possible config views,
		now this function is just kept for fun.
	- generateNormalConfig(): generate normal ExpedConfig
	- generateRecommendedConfig(): a somewhat more smart ExpedConfig generator,
		it gives every expedition a score based on one-time income, then decide
		whether having GS flag on is a good idea.
	- asyncGenerateConfigFromHistory(onSuccess, baseConfig):
		an even more smarter ExpedConfig generator
		that tries to guess user preference based on one's history.

		- onSuccess: a callback function, will be called with the generated config
		- baseConfig: in case we can't find any history for a specific expedition,
			its value defaults to baseConfig[eId]

	- loadExpedConfig(requireDefault=false): load the set of expedition configs from localStorage.
		returns "false" when not found.
		however, in case of not finding ExpedConfig,
		if requireDefault is set to true, this function will call generateNormalConfig()
		and use the result value as a placeholder so we always get the expected structure.

	- saveExpedConfig(newConfig): save a set of expedition to localStorage.

	- chooseN(xs,n): all possible ways of picking n elements from xs without replacement.
		example:
		> JSON.stringify( chooseN([2,3,5,7,9],3) )
		"[[2,3,5],[2,3,7],[2,3,9],[2,5,7],[2,5,9],[2,7,9],[3,5,7],[3,5,9],[3,7,9],[5,7,9]]"

	- eqConfig(config1,config2): test whether two expedition configs are structurally the same

	- modifierToNumber(modifier): convert a modifier to a number
		ready to be applied on basic resources.
	- computeActualCost(cost, eId): compute the actual cost given cost config and eId
	- computeNetIncome(config, eId): compute net income for a specific expedition

- data format for configs

	- config =
		{ modifier: <modifier>,
	      cost: <cost>
		}

	- there are two types of modifier:
		- normal modifier:

			{ type: "normal",
			  gs: true / false,
			  daihatsu: 0 ~ 4 (integer)
			}

		  - "gs" indicates whether great success is intended
		  - whoever saves the data is responsible for its consistency
				if say daihatsu value turns out to be 5, that's not my fault

		- custom modifier

			{ type: "custom",
			  value: a number, from 1.0 to perhaps 2.0 (meaning 100% ~ 200%)
			}

			- if great success is intended, the x1.5 needs to be applied to it manually.
				which means if user intends to carry 4 daihatsus and ensure GS,
				this value needs to be 1.8 (1.5 * 1.2)
			- the design decision is made in this way so that if future update
				adds some mechanism that affect GS modifier, we can still be flexible.

	- there are two type of costs:

		- normal cost:

			{ type: "costmodel",
			  wildcard: "DD" / "SS" / false,
			  count: 0 ~ 6 (integer)
			}

			- there is no explict indication about the cost itself,
			  this form only specifies if we need to make a fleet that has at least
			  that number of ships. (wildcard will be used if insufficient)
			- relies on a cost model, expedition info (minimal composition
				that satisfies the requirement) to compute the actual cost.
				(also take a look at the term explanation for "cost model"

		- custom cost:

		    { type: "custom",
			  fuel: integer (non-negative),
			  ammo: integer (non-negative)
			}

			- note that this should be the actual cost of the whole fleet
			- applied directly on gross income, so it is the actual cost, not the maximum one.

*/
(function() {
	"use strict";

	// some PureScript librarys, imported locally.
	let ExpedInfo = PS["KanColle.Expedition.New.Info"];
	let ExpedSType = PS["KanColle.Expedition.New.SType"];
	let ExpedCostModel = PS["KanColle.Expedition.New.CostModel"];
	let ExpedMinCompo = PS["KanColle.Expedition.New.MinCompo"];
	let Maybe = PS["Data.Maybe"];
	let PartialUnsafe = PS["Partial.Unsafe"];
	// for reducing verbosity when using "fromJust"
	let fromJust = PartialUnsafe.unsafePartial(Maybe.fromJust);

	function enumFromTo(from,to,step=1) {
		var arr = [];
		for (let i=from; i<=to; i+=step)
			arr.push(i);
		return arr;
	}

	// get a random integer between [min,max], inclusive on both sides.
	// both min and max needs to be integers
	function getRandomInt(min,max) {
		return Math.floor(Math.random() * (max-min+1)) + min;
	}

	let coinFlip = () => Math.random() >= 0.5;


	function saturate(v,min,max) {
		return Math.max(Math.min(v,max),min);
	}

	let allExpedIds = Object.freeze( enumFromTo(1,40) );

	function genModStandard() {
		return {
			type: "normal",
			gs: coinFlip(),
			daihatsu: getRandomInt(0,4)
		};
	}

	function genModCustom() {
		return {
			type: "custom",
			value: 1.0 + Math.random() * 0.8
		};
	}

	function genCostNormal() {
		let retVal = {
			type: "costmodel",
			wildcard: [false,"DD","SS"][getRandomInt(0,2)],
			count: getRandomInt(4,6)
		};
		if (retVal.wildcard === false)
			retVal.count = 0;
		return retVal;
	}

	function genCostCustom() {
		return {
			type: "custom",
			fuel: getRandomInt(10,500),
			ammo: getRandomInt(10,500)
		};
	}

	function generateRandomConfig() {
		let config = {};
		allExpedIds.map(function(x) {
			config[x] = {
				modifier: (coinFlip()) ? genModStandard() : genModCustom(),
				cost: (coinFlip()) ? genCostNormal() : genCostCustom()
			};
		});
		return config;
	}

	function generateNormalConfig() {
		let config = {};
		allExpedIds.map(function(x) {
			config[x] = {
				modifier: {
					type: "normal",
					gs: false,
					daihatsu: 0
				},
				cost: {
					type: "costmodel",
					wildcard: false,
					count: 0
				}
			};
		});
		return config;
	}

	function generateRecommendedConfig() {
		let config = {};
		allExpedIds.map(function(eId) {
			let resourceInfo = ExpedInfo.getInformation( eId ).resource;
			let masterInfo = KC3Master._raw.mission[eId];
			// allow bauxite to weight more
			let score = resourceInfo.fuel +
				resourceInfo.ammo +
				resourceInfo.steel +
				resourceInfo.bauxite*3;
			let gsFlag = score >= 500;
			config[eId] = {
				modifier: {
					type: "normal",
					gs: gsFlag,
					daihatsu: 0
				},
				cost: {
					type: "costmodel",
					wildcard: gsFlag ? "DD" : false,
					// for exped 21 it needs only 5 sparkled DD
					// for an almost-guaranteed success
					count: gsFlag ? (eId === 21 ? 5 : 6) : false
				}
			};
		});
		return config;
	}

	// baseConfig is used in case we found nothing for one particular expedition
	function asyncGenerateConfigFromHistory( onSuccess, baseConfig ) {
		let config = {};
		let expedIds = allExpedIds;
		// "completedFlag[eId-1] = true" means querying for "eId" is done.
		let completedFlag = expedIds.map( () => false );
		expedIds.map( function(eId) {
			// query for most recent 5 records of the current user.
			KC3Database.con.expedition
				.where("mission").equals(eId)
				.and( x => x.hq === PlayerManager.hq.id )
				.reverse()
				.limit(5)
				.toArray(function(xs) {
					if (xs.length === 0) {
						completedFlag[eId-1] = true;
					} else {
						let gsCount = xs.filter( x => x.data.api_clear_result === 2).length;
						// require great success if over half of the past 5 expeds are GS
						// gsCount >= xs.length / 2
						// => gsCount * 2 >= xs.length
						let needGS = gsCount * 2 >= xs.length;

						let countDaihatsu = expedRecord => {
							let onlyDaihatsu = x => [68,193].indexOf(x) !== -1;
							let ys = expedRecord.fleet.map( function(shipRecord) {
								let dhtCount = 0;
								// Kinu K2
								if (shipRecord.mst_id === 487)
									dhtCount += 1;
								dhtCount += (shipRecord.equip || []).filter( onlyDaihatsu ).length;
								return dhtCount;
							});
							return ys.reduce( (a,b) => a+b, 0 );
						};

						let countShips = expedRecord => {
							return expedRecord.fleet.length;
						};

						let daihatsuCountsFromHist = xs.map( countDaihatsu );
						let daihatsuCount = saturate( Math.max.apply(undefined,daihatsuCountsFromHist) , 0, 4);

						let shipCountsFromHist = xs.map( countShips );
						let shipCount = saturate( Math.max.apply(undefined,shipCountsFromHist) , 1, 6);
						let minCompo = ExpedMinCompo.getMinimumComposition(eId);
						// we don't need to enforce ship count if it's already the minimal requirement
						if (shipCount <= minCompo.length)
							shipCount = false;

						config[eId] = {
							modifier: {
								type: "normal",
								gs: needGS,
								daihatsu: daihatsuCount
							},
							cost: {
								type: "costmodel",
								wildcard: shipCount === false ? false : "DD",
								count: shipCount === false ? 0 : shipCount
							}
						};
						completedFlag[eId-1] = true;
					}

					if (completedFlag.some( x => x === false ))
						return;
					// finally fill in missing fields
					onSuccess( $.extend( baseConfig, config ) );
				});
		});
	}

	function loadExpedConfig(requireDefault=false) {
		if (typeof localStorage.expedConfig === "undefined")
			return requireDefault ? generateNormalConfig() : false;
		try {
			return JSON.parse( localStorage.expedConfig );
		} catch (e) {
			console.error("Error while parsing localStorage.expedConfig", e);
			throw e;
		}
	}

	function saveExpedConfig(newConfig) {
		localStorage.expedConfig = JSON.stringify( newConfig );
	}

	function eqModConfig(a,b) {
		return a.type === b.type &&
			(a.type === "normal"
			 ? (a.gs === b.gs && a.daihatsu === b.daihatsu)
			 : a.value === b.value);
	}

	function eqCostConfig(a,b) {
		return a.type === b.type &&
			(a.type === "costmodel"
			 ? (a.count === b.count && a.wildcard === b.wildcard)
			 : (a.fuel === b.fuel && a.ammo === b.ammo));
	}

	function eqConfig(a,b) {
		return eqModConfig(a.modifier, b.modifier) &&
			eqCostConfig(a.cost, b.cost);
	}

	function modifierToNumber(modifier) {
		if (modifier.type === "normal") {
			return (modifier.gs ? 1.5 : 1.0)*(1.0+0.05*modifier.daihatsu);
		} else if (modifier.type === "custom") {
			return modifier.value;
		} else {
			throw "modifierToNumber: Unrecognized type: " + modifier.type;
		}
	}

	function mergeExpedCost(arr) {
		return arr.reduce( function(acc, cur) {
			return { ammo: acc.ammo + cur.ammo,
					 fuel: acc.fuel + cur.fuel };
		}, {ammo: 0, fuel: 0});
	}

	function computeActualCost(cost,eId) {
		if (cost.type === "costmodel") {
			let minCompo = ExpedMinCompo.getMinimumComposition(eId);
			let stype =
				/* when wildcard is not used, count must be 0 so
				   we have nothing to fill in, here "DD" is just
				   a placeholder that never got used.
				*/
				cost.wildcard === false ? new ExpedSType.DD()
				: cost.wildcard === "DD" ? new ExpedSType.DD()
				: cost.wildcard === "SS" ? new ExpedSType.SSLike()
				: "Invalid wildcard in cost";

			if (typeof stype === "string")
				throw stype;
			let actualCompo =
				ExpedMinCompo.concretizeComposition(cost.count)(stype)(minCompo);
			let info = ExpedInfo.getInformation(eId);
			let costModel = ExpedCostModel.normalCostModel;
			let fleetMaxCost = ExpedCostModel.calcFleetMaxCost(costModel)(actualCompo);
			if (! Maybe.isJust(fleetMaxCost)) {
				throw "Cost model fails to compute a cost for current fleet composition";
			} else {
				fleetMaxCost = fromJust(fleetMaxCost);
			}
			let fleetActualCost = fleetMaxCost.map( function(x) {
				return {
					fuel: Math.floor( info.fuelCostPercent * x.fuel ),
					ammo: Math.floor( info.ammoCostPercent * x.ammo )
				};
			});
			return mergeExpedCost( fleetActualCost );
		} else if (cost.type === "costmodel") {
			return {
				fuel: cost.fuel,
				ammo: cost.ammo };
		} else {
			throw "computeActualCost: Unrecognized type: " + cost.type;
		}
	}

	let tranformIncome = f => income => {
		let retVal = {};
		["fuel","ammo","steel","bauxite"].map( name => {
			retVal[name] = f(income[name]);
		});
		return retVal;
	};

	function computeNetIncome(config, eId) {
		let numModifier = modifierToNumber( config.modifier );
		let actualCost = computeActualCost(config.cost, eId);
		let basicIncome = ExpedInfo.getInformation( eId ).resource;
		let grossIncome = tranformIncome( v => Math.floor(v*numModifier) )(basicIncome);
		return {
			fuel: grossIncome.fuel - actualCost.fuel,
			ammo: grossIncome.ammo - actualCost.ammo,
			steel: grossIncome.steel,
			bauxite: grossIncome.bauxite
		};
	}

	let chooseN = PS["KanColle.Util"].chooseN_FFI;

	window.Expedition = {
		enumFromTo,
		saturate,
		allExpedIds,

		generateRandomConfig,
		generateNormalConfig,
		generateRecommendedConfig,
		asyncGenerateConfigFromHistory,

		loadExpedConfig,
		saveExpedConfig,

		chooseN,
		eqConfig,
		modifierToNumber,
		computeActualCost,

		computeNetIncome
	};
})();
