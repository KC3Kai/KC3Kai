(function () {
  const Yasen = {};
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const JSON_FIELDS = ['api_at_list', 'api_df_list', 'api_damage'];

  Yasen.parseYasen = (playerRole, enemyRole, battleData) => {
    const { makeAttacks, extractFromJson } = KC3BattlePrediction.battle.phases;
    const { parseJson, getTargetFactory } = KC3BattlePrediction.battle.phases.yasen;

    const attacksData = extractFromJson(battleData, JSON_FIELDS).map(parseJson);
    return makeAttacks(attacksData, getTargetFactory(playerRole, enemyRole));
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ JSON PARSE ]-------------------- */

  Yasen.parseJson = ({ api_at_list, api_df_list, api_damage }) => {
    const { parseAttackerIndex, parseDefenderIndices, parseDamage }
      = KC3BattlePrediction.battle.phases.yasen;

    return {
      attacker: parseAttackerIndex(api_at_list),
      defender: parseDefenderIndices(api_df_list),
      damage: parseDamage(api_damage),
    };
  };

  Yasen.parseAttackerIndex = (index) => {
    const { Side } = KC3BattlePrediction;

    return index <= 6
      ? { side: Side.PLAYER, position: index - 1 }
      : { side: Side.ENEMY, position: index - 7 };
  };

  Yasen.parseDefenderIndices = (indices) => {
    const { extendError } = KC3BattlePrediction;
    const { parseAttackerIndex } = KC3BattlePrediction.battle.phases.yasen;

    // single attack
    if (indices.length === 1) {
      return parseAttackerIndex(indices[0]);
    }
    // double attack
    if (indices.length === 2 && indices[0] === indices[1]) {
      return parseAttackerIndex(indices[0]);
    }
    // cut-in
    if (indices.length === 3 && indices[1] === -1 && indices[2] === -1) {
      return parseAttackerIndex(indices[0]);
    }
    throw extendError(new Error('Unknown target indices format'), { indices });
  };

  Yasen.parseDamage = (damageArray) => {
    return damageArray.reduce((result, damage) => (damage > 0 ? result + damage : result), 0);
  };

  Yasen.getTargetFactory = (playerRole, enemyRole) => {
    const { Side, battle: { createTarget } } = KC3BattlePrediction;
    const roles = {
      [Side.PLAYER]: playerRole,
      [Side.ENEMY]: enemyRole,
    };

    return ({ attacker, defender }) => ({
      attacker: createTarget(attacker.side, roles[attacker.side], attacker.position),
      defender: createTarget(defender.side, roles[defender.side], defender.position),
    });
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.yasen, Yasen);
}());
