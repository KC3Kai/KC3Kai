(function () {
  const Hougeki = {};

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const JSON_FIELDS = ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage'];
  Hougeki.parseHougeki = (battleType, battleData) => {
    const { extractFromJson, makeAttacks } = KC3BattlePrediction.battle.phases;
    const { parseJson, getTargetFactory } = KC3BattlePrediction.battle.phases.hougeki;

    const attackData = extractFromJson(battleData, JSON_FIELDS).map(parseJson);
    return makeAttacks(attackData, getTargetFactory(battleType));
  };

  Hougeki.parseCombinedHougeki = (battleData) => {
    const { extractFromJson, makeAttacks } = KC3BattlePrediction.battle.phases;
    const { parseCombinedJson, getCombinedTargetFactory } = KC3BattlePrediction.battle.phases.hougeki;

    const attackData = extractFromJson(battleData, JSON_FIELDS).map(parseCombinedJson);
    return makeAttacks(attackData, getCombinedTargetFactory());
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ JSON PARSE ]-------------------- */

  Hougeki.parseJson = ({ api_at_eflag, api_at_list, api_df_list, api_damage }) => {
    const { parseAttackerIndex, parseDefenderIndex, parseDamage } =
      KC3BattlePrediction.battle.phases.hougeki;

    return {
      damage: parseDamage(api_damage),
      attacker: parseAttackerIndex(api_at_eflag, api_at_list),
      defender: parseDefenderIndex(api_at_eflag, api_df_list),
    };
  };

  Hougeki.parseAttackerIndex = (isEnemyAttackFlag, index) => {
    const { Side } = KC3BattlePrediction;

    return isEnemyAttackFlag === 0
      ? { side: Side.PLAYER, position: index }
      : { side: Side.ENEMY, position: index };
  };

  Hougeki.parseDefenderIndex = (isEnemyAttackFlag, targetIndices) => {
    const { Side, extendError } = KC3BattlePrediction;

    const index = targetIndices[0];

    if (!targetIndices.every(ind => ind === index)) {
      throw extendError(new Error('Bad target index array'), { targetIndices });
    }

    return isEnemyAttackFlag === 1
      ? { side: Side.PLAYER, position: index }
      : { side: Side.ENEMY, position: index };
  };

  Hougeki.parseDamage = damages => damages.reduce((result, damage) => result + damage, 0);

  Hougeki.parseCombinedJson = ({ api_at_eflag, api_at_list, api_df_list, api_damage }) => {
    const { parseCombinedAttacker, parseCombinedDefender, parseDamage }
      = KC3BattlePrediction.battle.phases.hougeki;

    return {
      attacker: parseCombinedAttacker(api_at_eflag, api_at_list),
      defender: parseCombinedDefender(api_at_eflag, api_df_list),
      damage: parseDamage(api_damage),
    };
  };

  Hougeki.parseCombinedAttacker = (isEnemyAttackFlag, attackerIndex) => {
    const { Side, Role, extendError } = KC3BattlePrediction;

    if (!(isEnemyAttackFlag === 1 || isEnemyAttackFlag === 0)) {
      throw extendError(new Error('Bad api_at_eflag'), { api_at_eflag: isEnemyAttackFlag });
    }

    const side = isEnemyAttackFlag === 1 ? Side.ENEMY : Side.PLAYER;
    return attackerIndex < 6
      ? { side, role: Role.MAIN_FLEET, position: attackerIndex }
      : { side, role: Role.ESCORT_FLEET, position: attackerIndex - 6 };
  };

  Hougeki.parseCombinedDefender = (isEnemyAttackFlag, defenderIndices) => {
    const { Side, Role, extendError } = KC3BattlePrediction;

    if (!(isEnemyAttackFlag === 1 || isEnemyAttackFlag === 0)) {
      throw extendError(new Error('Bad api_at_eflag'), { api_at_eflag: isEnemyAttackFlag });
    }

    const index = defenderIndices[0];
    if (!defenderIndices.every(ind => ind === index)) {
      throw extendError(new Error('Bad target index array'), { api_df_list: defenderIndices });
    }

    const side = isEnemyAttackFlag === 0 ? Side.ENEMY : Side.PLAYER;
    return index < 6
      ? { side, role: Role.MAIN_FLEET, position: index }
      : { side, role: Role.ESCORT_FLEET, position: index - 6 };
  };

  /* -----------------[ TARGET FACTORIES ]----------------- */

  Hougeki.getTargetFactory = (battleType) => {
    const { Side } = KC3BattlePrediction;
    const { createTargetFactory, isPlayerSingleFleet, isEnemySingleFleet } = KC3BattlePrediction.battle.phases.hougeki;
    const createTarget = createTargetFactory({
      [Side.PLAYER]: isPlayerSingleFleet(battleType.player),
      [Side.ENEMY]: isEnemySingleFleet(battleType.enemy),
    });

    return ({ attacker, defender }) => ({
      attacker: createTarget(attacker),
      defender: createTarget(defender),
    });
  };

  Hougeki.isPlayerSingleFleet = (playerFleetType) => {
    const { Player } = KC3BattlePrediction;

    return playerFleetType === Player.SINGLE;
  };
  Hougeki.isEnemySingleFleet = (enemyFleetType) => {
    const { Enemy } = KC3BattlePrediction;

    return enemyFleetType === Enemy.SINGLE;
  };

  Hougeki.createTargetFactory = (isSingleFleet) => {
    const { Role, battle: { createTarget } } = KC3BattlePrediction;

    return ({ side, position }) =>
      (isSingleFleet[side]
        ? createTarget(side, Role.MAIN_FLEET, position)
        : createTarget(side, position < 6 ? Role.MAIN_FLEET : Role.ESCORT_FLEET, position % 6));
  };

  Hougeki.getCombinedTargetFactory = () => {
    const { createTarget } = KC3BattlePrediction.battle;

    return ({ attacker, defender }) => ({
      attacker: createTarget(attacker.side, attacker.role, attacker.position),
      defender: createTarget(defender.side, defender.role, defender.position),
    });
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, Hougeki);
}());
