(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseStartJson = (battleData) => {
    const { zipHps } = KC3BattlePrediction.rank;

    return {
      playerMain: zipHps(battleData.api_f_nowhps, battleData.api_f_maxhps),
      playerEscort: zipHps(battleData.api_f_nowhps_combined, battleData.api_f_maxhps_combined),
      enemyMain: zipHps(battleData.api_e_nowhps, battleData.api_e_maxhps),
      enemyEscort: zipHps(battleData.api_e_nowhps_combined, battleData.api_e_maxhps_combined),
    };
  };

  const normalizeFleets = (fleets, battleData) => {
    const { removeRetreated, hideOverkill } = KC3BattlePrediction.rank;

    return {
      playerMain: hideOverkill(removeRetreated(fleets.playerMain, battleData.api_escape_idx)),
      playerEscort: hideOverkill(removeRetreated(fleets.playerEscort, battleData.api_escape_idx_combined)),
      enemyMain: hideOverkill(fleets.enemyMain),
      enemyEscort: hideOverkill(fleets.enemyEscort),
    };
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

  const zipHps = (nowHps, maxHps) => {
    const { extendError } = KC3BattlePrediction;

    if (!nowHps && !maxHps) { return []; }

    if (nowHps.length !== maxHps.length) {
      throw extendError(new Error('Mismatched nowhps + maxhps'), { nowHps, maxHps });
    }

    return nowHps.map((hp, index) => ({ hp, maxHp: maxHps[index] }));
  };

  const removeRetreated = (fleet, escapeIds = []) =>
    fleet.filter((ship, index) => !escapeIds.includes(index + 1));


  /* --------------------[ NORMALIZE ]--------------------- */

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
    zipHps,
    removeRetreated,

    hideOverkill,
    // Helpers
    getSunkCount,
    getShipCount,
    getDamageGauge,
    getHpTotal,
  });
}());
