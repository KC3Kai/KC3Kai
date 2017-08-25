(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseSupport = ({ api_support_airatack, api_support_hourai } = {}) => {
    const { kouku: { parseKouku }, support: { parseHourai } } = KC3BattlePrediction.battle.phases;

    // Misspelling is deliberate - it exists in KCSAPI json
    if (api_support_airatack) {
      return parseKouku(api_support_airatack);
    } else if (api_support_hourai) {
      return parseHourai(api_support_hourai);
    }
    throw new Error('Expected api_support_airatack or api_support_hourai');
  };

  const parseCombinedSupport = ({ api_support_airatack, api_support_hourai } = {}) => {
    const { parseCombinedDamageArray } = KC3BattlePrediction.battle.phases.support;

    if (api_support_hourai) {
      const { api_damage } = api_support_hourai;
      return parseCombinedDamageArray(api_damage);
    } else if (api_support_airatack) {
      const { api_stage3 } = api_support_airatack;
      return api_stage3 ? parseCombinedDamageArray(api_stage3.api_edam) : [];
    }
    throw new Error('Expected api_support_airatack or api_support_hourai');
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const parseHourai = ({ api_damage }) => {
    const { Role, normalizeArrayIndexing } = KC3BattlePrediction;
    const { parseDamageArray } = KC3BattlePrediction.battle.phases.support;

    return parseDamageArray(Role.MAIN_FLEET, normalizeArrayIndexing(api_damage));
  };

  const parseDamageArray = (role, damageArray) => {
    const { Side, battle: { createAttack } } = KC3BattlePrediction;

    return damageArray.reduce((result, damage, position) => {
      const attack = createAttack(Side.ENEMY, role, position, damage);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  const parseCombinedDamageArray = (api_damage) => {
    const { Role, normalizeArrayIndexing } = KC3BattlePrediction;
    const { parseDamageArray } = KC3BattlePrediction.battle.phases.support;

    if (!api_damage) { return []; }
    const combinedDamageArray = normalizeArrayIndexing(api_damage);
    if (combinedDamageArray.length !== 12) {
      throw new Error(`Expected length 12, but got ${combinedDamageArray.length}`);
    }

    const mainFleetAttacks = parseDamageArray(Role.MAIN_FLEET, combinedDamageArray.slice(0, 6));
    const escortFleetAttacks = parseDamageArray(Role.ESCORT_FLEET, combinedDamageArray.slice(6, 12));

    return mainFleetAttacks.concat(escortFleetAttacks);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.support, {
    // Public
    parseSupport,
    parseCombinedSupport,
    // Internal
    parseHourai,
    parseDamageArray,
    parseCombinedDamageArray,
  });
}());
