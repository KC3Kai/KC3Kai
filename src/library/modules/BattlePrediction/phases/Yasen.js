(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseYasen = (playerRole, enemyRole, battleData) => {
    const { parseTargets, parseDamages, zipAttacks } = KC3BattlePrediction.battle.phases.yasen;

    const targets = parseTargets({ player: playerRole, enemy: enemyRole }, battleData);
    const damages = parseDamages(battleData);

    return zipAttacks(targets, damages);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ---------------------[ TARGETS ]---------------------- */

  const parseTargets = (roles, { api_df_list } = {}) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;
    const { normalizeTargetJson, convertToTarget } = KC3BattlePrediction.battle.phases.yasen;

    if (!api_df_list) { return []; }

    return normalizeArrayIndexing(api_df_list).map((targetJson) => {
      return convertToTarget(roles, normalizeTargetJson(targetJson));
    });
  };

  const normalizeTargetJson = (targetArray = []) => {
    // regular attack
    if (targetArray.length === 1) {
      return targetArray[0];
    }
    // double attack + torpedo cut-in
    if (targetArray.length === 2 && targetArray[0] === targetArray[1]) {
      return targetArray[0];
    }
    // Gun cut-in
    if (targetArray.length === 3 && targetArray[1] === -1 && targetArray[2] === -1) {
      return targetArray[0];
    }
    throw new Error(`Bad target json: [${targetArray}]`);
  };

  const convertToTarget = (roles, targetIndex) => {
    const { Side } = KC3BattlePrediction;

    if (targetIndex >= 7) {
      return { side: Side.ENEMY, role: roles.enemy, position: targetIndex - 7 };
    }
    return { side: Side.PLAYER, role: roles.player, position: targetIndex - 1 };
  };

  /* ---------------------[ DAMAGES ]---------------------- */

  const parseDamages = ({ api_damage } = {}) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;
    const { convertToDamage } = KC3BattlePrediction.battle.phases.yasen;

    if (!api_damage) { return []; }

    return normalizeArrayIndexing(api_damage).map(convertToDamage);
  };

  const convertToDamage = (damageArray) => {
    return damageArray.reduce((sum, damage) => {
      return damage > 0 ? sum + damage : sum;
    }, 0);
  };

  /* ---------------------[ ATTACKS ]---------------------- */

  const zipAttacks = (targets, damages) => {
    const { createAttack } = KC3BattlePrediction.battle;

    if (targets.length !== damages.length) {
      throw new Error(`Mismatch between targets (${targets.length}) and damages (${damages.length})`);
    }

    return targets.reduce((result, { side, role, position }, index) => {
      const attack = createAttack(side, role, position, damages[index]);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.yasen, {
    // Public
    parseYasen,
    // Internal
    parseTargets,
    normalizeTargetJson,
    convertToTarget,

    parseDamages,
    convertToDamage,

    zipAttacks,
  });
}());
