(function () {
  const Raigeki = {};
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const PLAYER_JSON_FIELDS = ['api_frai', 'api_fydam'];
  const ENEMY_JSON_FIELDS = ['api_erai', 'api_eydam'];

  Raigeki.parseRaigeki = (battleType, battleData) => {
    const { extractFromJson, raigeki: { getTargetFactories, parseSide } }
      = KC3BattlePrediction.battle.phases;

    const targetFactories = getTargetFactories(battleType);

    const playerAttacks = parseSide(targetFactories.playerAttack,
      extractFromJson(battleData, PLAYER_JSON_FIELDS));
    const enemyAttacks = parseSide(targetFactories.enemyAttack,
      extractFromJson(battleData, ENEMY_JSON_FIELDS));

    return playerAttacks.concat(enemyAttacks);
  };

  Raigeki.parseCombinedRaigeki = (battleData) => {
    const { extractFromJson } = KC3BattlePrediction.battle.phases;
    const { getCombinedTargetFactories, parseSide } = KC3BattlePrediction.battle.phases.raigeki;

    const targetFactories = getCombinedTargetFactories();

    const playerAttacks = parseSide(targetFactories.playerAttack,
      extractFromJson(battleData, PLAYER_JSON_FIELDS));
    const enemyAttacks = parseSide(targetFactories.enemyAttack,
      extractFromJson(battleData, ENEMY_JSON_FIELDS));

    return playerAttacks.concat(enemyAttacks);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Raigeki.parseSide = (createTargets, attacksJson) => {
    const { makeAttacks, raigeki: { removeEmptyAttacks, parseJson } }
      = KC3BattlePrediction.battle.phases;

    return makeAttacks(removeEmptyAttacks(attacksJson.map(parseJson)), createTargets);
  };

  /* --------------------[ JSON PARSE ]-------------------- */

  Raigeki.removeEmptyAttacks = attacksJson => attacksJson.filter(({ defender: { position } }) => {
    return position >= 0;
  });

  Raigeki.parseJson = (attackJson, index) => {
    const { extendError } = KC3BattlePrediction;

    if (attackJson.api_frai !== undefined && attackJson.api_fydam !== undefined) {
      return {
        attacker: { position: index },
        defender: { position: attackJson.api_frai },
        damage: attackJson.api_fydam,
      };
    }
    if (attackJson.api_erai !== undefined && attackJson.api_eydam !== undefined) {
      return {
        attacker: { position: index },
        defender: { position: attackJson.api_erai },
        damage: attackJson.api_eydam,
      };
    }
    throw extendError(new Error('Bad attack json'), { attackJson, index });
  };

  /* -----------------[ TARGET FACTORIES ]----------------- */

  Raigeki.getTargetFactories = (battleType) => {
    const { Side } = KC3BattlePrediction;
    const { createTargetFactory, isPlayerSingleFleet, isEnemySingleFleet } = KC3BattlePrediction.battle.phases.raigeki;

    // TODO: unify v6 and v12 raigeki parsing
    const playerTarget = createTargetFactory(Side.PLAYER, isPlayerSingleFleet(battleType.player));
    const enemyTarget = createTargetFactory(Side.ENEMY, isEnemySingleFleet(battleType.enemy));

    return {
      playerAttack: ({ attacker, defender }) => ({
        attacker: playerTarget(attacker.position),
        defender: enemyTarget(defender.position),
      }),
      enemyAttack: ({ attacker, defender }) => ({
        attacker: enemyTarget(attacker.position),
        defender: playerTarget(defender.position),
      }),
    };
  };

  Raigeki.isPlayerSingleFleet = (playerFleetType) => {
    const { Player } = KC3BattlePrediction;

    return playerFleetType === Player.SINGLE;
  };
  Raigeki.isEnemySingleFleet = (enemyFleetType) => {
    const { Enemy } = KC3BattlePrediction;

    return enemyFleetType === Enemy.SINGLE;
  };

  Raigeki.createTargetFactory = (side, isSingleFleet) => {
    const { Role, battle: { createTarget } } = KC3BattlePrediction;

    return isSingleFleet
      ? position => createTarget(side, Role.MAIN_FLEET, position)
      : position => createTarget(side, position < 6 ? Role.MAIN_FLEET : Role.ESCORT_FLEET, position % 6);
  };

  Raigeki.getCombinedTargetFactories = () => {
    const { Side } = KC3BattlePrediction;
    const { createCombinedTargetFactory } = KC3BattlePrediction.battle.phases.raigeki;

    const playerTarget = createCombinedTargetFactory(Side.PLAYER);
    const enemyTarget = createCombinedTargetFactory(Side.ENEMY);

    return {
      playerAttack: ({ attacker, defender }) => ({
        attacker: playerTarget(attacker.position),
        defender: enemyTarget(defender.position),
      }),
      enemyAttack: ({ attacker, defender }) => ({
        attacker: enemyTarget(attacker.position),
        defender: playerTarget(defender.position),
      }),
    };
  };

  Raigeki.createCombinedTargetFactory = (side) => {
    const { Role, battle: { createTarget } } = KC3BattlePrediction;

    return position => (position < 6
      ? createTarget(side, Role.MAIN_FLEET, position)
      : createTarget(side, Role.ESCORT_FLEET, position - 6)
    );
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.raigeki, Raigeki);
}());
