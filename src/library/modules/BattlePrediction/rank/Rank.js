(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseStartJson = (battleData) => {
    const { makeShips, removeRetreated } = KC3BattlePrediction.rank;

    const {api_f_nowhps, api_f_maxhps, api_e_nowhps, api_e_maxhps} = battleData;
    const {api_f_nowhps_combined, api_f_maxhps_combined, api_e_nowhps_combined, api_e_maxhps_combined} = battleData;
    const main = makeShips(api_f_nowhps, api_f_maxhps, api_e_nowhps, api_e_maxhps);
    const escort = makeShips(api_f_nowhps_combined, api_f_maxhps_combined, api_e_nowhps_combined, api_e_maxhps_combined);

    return {
      playerMain: removeRetreated(main.player, battleData.api_escape_idx),
      playerEscort: removeRetreated(escort.player, battleData.api_escape_idx_combined),
      enemyMain: main.enemy,
      enemyEscort: escort.enemy,
    };
  };

  const normalizeFleets = (fleetHpInfo, isAnalyzedResult = false) => {
    const { omitEmptySlots, hideOverkill } = KC3BattlePrediction.rank;

    return Object.keys(fleetHpInfo).reduce((result, key) => {
      return Object.assign(result, {
        // empty slots already removed for analyzed fleets result, dupe it will cause issue like #2284
        [key]: hideOverkill(isAnalyzedResult ? fleetHpInfo[key] : omitEmptySlots(fleetHpInfo[key])),
      });
    }, {});
  };

  const predictors = {
    ld_airbattle: 'airRaid',
  };
  const getRankPredictor = (apiName = '') => {
    const Rank = KC3BattlePrediction.rank;

    const predictorsKey = Object.keys(predictors).find(key => apiName.indexOf(key) !== -1);
    return predictorsKey
      ? Rank[predictors[predictorsKey]]
      : Rank.battle;
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ PARSE JSON ]-------------------- */

  const makeShips = (nowhpsPlayer = [], maxhpsPlayer = [], nowhpsEnemy = [], maxhpsEnemy = []) => {
    const { splitSides, zipHps } = KC3BattlePrediction.rank;

    // HPs already split, and 0-based indexing since 2017-11-17
    //const nowHps = splitSides(nowhps);
    //const maxHps = splitSides(maxhps);

    return {
      player: zipHps(nowhpsPlayer, maxhpsPlayer),
      enemy: zipHps(nowhpsEnemy, maxhpsEnemy),
    };
  };

  const isNotEmpty = fleet => fleet.some(hp => hp !== -1);
  const splitSides = (hps = []) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;

    const normalizedHps = normalizeArrayIndexing(hps);
    const player = normalizedHps.slice(0, 6);
    const enemy = normalizedHps.slice(6, 12);

    return {
      player: isNotEmpty(player) ? player : [],
      enemy,
    };
  };
  const zipHps = (nowHps, maxHps) => {
    const { extendError } = KC3BattlePrediction;

    if (nowHps.length !== maxHps.length) {
      throw extendError(new Error('Mismatched nowhps + maxhps'), { nowHps, maxHps });
    }

    return nowHps.map((hp, index) => ({ hp, maxHp: maxHps[index] }));
  };

  const removeRetreated = (fleet, escapeIds = []) => {
    const { EMPTY_SLOT } = KC3BattlePrediction;

    return escapeIds
      .reduce((result, escapeId) => {
        result[escapeId - 1] = EMPTY_SLOT;
        return result;
      }, fleet);
  };

  /* --------------------[ NORMALIZE ]--------------------- */

  // NB: Empty slots can be discarded safely, since the only ships whose position matters are the
  // respective main fleet flagships, who will always exist
  const omitEmptySlots = fleet => fleet.filter(({ hp }) => hp !== KC3BattlePrediction.EMPTY_SLOT);

  const hideOverkill = fleet => fleet.map((ship) => {
    return ship.hp < 0 ? Object.assign({}, ship, { hp: 0 }) : ship;
  });

  /* ---------------------[ HELPERS ]---------------------- */

  const processFleets = (f, { playerMain, playerEscort, enemyMain, enemyEscort }) => ({
    player: f(playerMain.concat(playerEscort)),
    enemy: f(enemyMain.concat(enemyEscort)),
  });

  const getSunkCount = processFleets.bind(null, (fleet) => {
    const sunkShips = fleet.filter(({ sunk }) => sunk);
    return sunkShips.length;
  });

  const getShipCount = processFleets.bind(null, fleet => fleet.length);

  const calculateDamageGauge = (startHp, endHp) => Math.floor(((startHp - endHp) / startHp) * 100);
  const getDamageGauge = (initialFleets, resultFleets) => {
    const { getHpTotal } = KC3BattlePrediction.rank;

    const startHp = getHpTotal(initialFleets);
    const endHp = getHpTotal(resultFleets);

    return {
      player: calculateDamageGauge(startHp.player, endHp.player),
      enemy: calculateDamageGauge(startHp.enemy, endHp.enemy),
    };
  };

  const getHpTotal = processFleets.bind(null, (fleet) => {
    return fleet.reduce((result, { hp }) => result + hp, 0);
  });

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.rank, {
    // Public API
    parseStartJson,
    normalizeFleets,
    getRankPredictor,
    // Internal
    makeShips,
    splitSides,
    zipHps,
    removeRetreated,

    omitEmptySlots,
    hideOverkill,
    // Helpers
    getSunkCount,
    getShipCount,
    getDamageGauge,
    getHpTotal,
  });
}());
