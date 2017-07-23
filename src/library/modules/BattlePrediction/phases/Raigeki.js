(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseRaigeki = (playerRole, { api_fdam, api_edam } = {}) => {
    const { Side, Role } = KC3BattlePrediction;
    const { parseDamageArray, normalizeDamageArray: normalize }
      = KC3BattlePrediction.battle.phases.raigeki;

    const playerAttacks = parseDamageArray(Side.PLAYER, playerRole, normalize(api_fdam));
    const enemyAttacks = parseDamageArray(Side.ENEMY, Role.MAIN_FLEET, normalize(api_edam));

    return playerAttacks.concat(enemyAttacks);
  };

  const parseCombinedRaigeki = ({ api_fdam, api_edam }) => {
    const { Side } = KC3BattlePrediction;
    const { parseCombinedSide, normalizeDamageArray: normalize }
      = KC3BattlePrediction.battle.phases.raigeki;

    const playerAttacks = parseCombinedSide(Side.PLAYER, normalize(api_fdam));
    const enemyAttacks = parseCombinedSide(Side.ENEMY, normalize(api_edam));

    return playerAttacks.concat(enemyAttacks);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const normalizeDamageArray = (damageArray) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;

    return damageArray ? normalizeArrayIndexing(damageArray) : [];
  };

  const parseCombinedSide = (side, combinedDamageArray) => {
    const { Role } = KC3BattlePrediction;
    const { splitCombinedDamageArray, parseDamageArray }
      = KC3BattlePrediction.battle.phases.raigeki;

    const { main, escort } = splitCombinedDamageArray(combinedDamageArray);
    const mainFleetAttacks = parseDamageArray(side, Role.MAIN_FLEET, main);
    const escortFleetAttacks = parseDamageArray(side, Role.ESCORT_FLEET, escort);

    return mainFleetAttacks.concat(escortFleetAttacks);
  };

  const splitCombinedDamageArray = (combinedDamageArray) => {
    if (combinedDamageArray.length !== 12) {
      throw new Error(`Expected array of length 12, but was ${combinedDamageArray.length}`);
    }
    return {
      main: combinedDamageArray.slice(0, 6),
      escort: combinedDamageArray.slice(6, 12),
    };
  };

  const parseDamageArray = (side, role, damageArray) => {
    const { createAttack } = KC3BattlePrediction.battle;

    return damageArray.reduce((result, damage, position) => {
      const attack = createAttack(side, role, position, damage);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.raigeki, {
    // Public
    parseRaigeki,
    parseCombinedRaigeki,
    // Internal
    normalizeDamageArray,
    parseCombinedSide,
    splitCombinedDamageArray,
    parseDamageArray,
  });
}());
