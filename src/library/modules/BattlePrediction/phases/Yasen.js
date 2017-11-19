(function () {
  const Yasen = {};
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const JSON_FIELDS = ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage'];

  Yasen.parseYasen = (battleType, battleData) => {
    const { makeAttacks, extractFromJson } = KC3BattlePrediction.battle.phases;
    const { parseJson, getTargetFactory } = KC3BattlePrediction.battle.phases.yasen;

    const attacksData = extractFromJson(battleData, JSON_FIELDS).map(parseJson);
    return makeAttacks(attacksData, getTargetFactory(battleType));
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ JSON PARSE ]-------------------- */

  Yasen.parseJson = ({ api_at_eflag, api_at_list, api_df_list, api_damage }) => {
    const { parseAttackerIndex, parseDefenderIndices, parseDamage }
      = KC3BattlePrediction.battle.phases.yasen;

    return {
      attacker: parseAttackerIndex(api_at_eflag, api_at_list),
      defender: parseDefenderIndices(api_at_eflag, api_df_list),
      damage: parseDamage(api_damage),
    };
  };

  Yasen.parseAttackerIndex = (isEnemyAttackFlag, index) => {
    const { Side } = KC3BattlePrediction;

    return isEnemyAttackFlag === 0
      ? { side: Side.PLAYER, position: index }
      : { side: Side.ENEMY, position: index };
  };

  Yasen.parseDefenderIndex = (isEnemyAttackFlag, index) => {
    const { Side } = KC3BattlePrediction;

    return isEnemyAttackFlag === 1
      ? { side: Side.PLAYER, position: index }
      : { side: Side.ENEMY, position: index };
  };

  Yasen.parseDefenderIndices = (isEnemyAttackFlag, indices) => {
    const { extendError } = KC3BattlePrediction;
    const { parseDefenderIndex } = KC3BattlePrediction.battle.phases.yasen;

    // single attack
    if (indices.length === 1) {
      return parseDefenderIndex(isEnemyAttackFlag, indices[0]);
    }
    // double attack
    if (indices.length === 2 && indices[0] === indices[1]) {
      return parseDefenderIndex(isEnemyAttackFlag, indices[0]);
    }
    // cut-in
    if (indices.length === 3 && indices[1] === -1 && indices[2] === -1) {
      return parseDefenderIndex(isEnemyAttackFlag, indices[0]);
    }
    throw extendError(new Error('Unknown target indices format'), { indices });
  };

  Yasen.parseDamage = (damageArray) => {
    return damageArray.reduce((result, damage) => (damage > 0 ? result + damage : result), 0);
  };

  Yasen.getTargetFactory = (battleType) => {
    const { Side } = KC3BattlePrediction;
    const { createTargetFactory, isPlayerSingleFleet, isEnemySingleFleet } = KC3BattlePrediction.battle.phases.yasen;
    const createTarget = createTargetFactory({
      [Side.PLAYER]: isPlayerSingleFleet(battleType.player),
      [Side.ENEMY]: isEnemySingleFleet(battleType.enemy),
    });

    return ({ attacker, defender }) => ({
      attacker: createTarget(attacker),
      defender: createTarget(defender),
    });
  };

  Yasen.isPlayerSingleFleet = (playerFleetType) => {
    const { Player } = KC3BattlePrediction;

    return playerFleetType === Player.SINGLE;
  };
  Yasen.isEnemySingleFleet = (enemyFleetType) => {
    const { Enemy } = KC3BattlePrediction;

    return enemyFleetType === Enemy.SINGLE;
  };

  Yasen.createTargetFactory = (isSingleFleet) => {
    const { Role, battle: { createTarget } } = KC3BattlePrediction;

    return ({ side, position }) =>
      (isSingleFleet[side]
        ? createTarget(side, Role.MAIN_FLEET, position)
        : createTarget(side, position < 6 ? Role.MAIN_FLEET : Role.ESCORT_FLEET, position % 6));
  };

  // Yasen.getTargetFactory = (playerRole, enemyRole) => {
  //   const { Side, battle: { createTarget } } = KC3BattlePrediction;
  //   const roles = {
  //     [Side.PLAYER]: playerRole,
  //     [Side.ENEMY]: enemyRole,
  //   };

  //   return ({ attacker, defender }) => ({
  //     attacker: createTarget(attacker.side, roles[attacker.side], attacker.position),
  //     defender: createTarget(defender.side, roles[defender.side], defender.position),
  //   });
  // };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.yasen, Yasen);
}());
