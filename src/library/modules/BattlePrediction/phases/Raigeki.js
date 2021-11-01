(function () {
  const Raigeki = {};
  const { pipe, juxt, flatten, map, filter, Side } = KC3BattlePrediction;
  const RAIGEKI_PLAYER = ['api_frai', 'api_fydam', 'api_fcl'];
  const RAIGEKI_ENEMY = ['api_erai', 'api_eydam', 'api_ecl'];

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Raigeki.parseRaigeki = battleData => {
    const { parseRaigekiInternal } = KC3BattlePrediction.battle.phases.raigeki;
    return parseRaigekiInternal(battleData, false);
  };

  Raigeki.parseOpeningRaigeki = battleData => {
    const { parseRaigekiInternal } = KC3BattlePrediction.battle.phases.raigeki;
    return parseRaigekiInternal(battleData, true);
  };

  Raigeki.parseRaigekiInternal = (battleData, opening = false) => {
    const { createAttack } = KC3BattlePrediction.battle;
    const {
      parseSide,
      parsePlayerJson,
      parseEnemyJson,
      isRealAttack,
    } = KC3BattlePrediction.battle.phases.raigeki;

    return pipe(
      juxt([
        parseSide(RAIGEKI_PLAYER, parsePlayerJson(opening)),
        parseSide(RAIGEKI_ENEMY, parseEnemyJson(opening)),
      ]),
      flatten,
      filter(isRealAttack),
      map(createAttack)
    )(battleData);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Raigeki.parseSide = (jsonProps, parseJson) => battleData => {
    const { extractFromJson } = KC3BattlePrediction.battle.phases;

    return pipe(
      extractFromJson(jsonProps),
      map(parseJson)
    )(battleData);
  };

  Raigeki.parsePlayerJson = opening => ({ api_frai, api_fydam, api_fcl }, index) => ({
    damage: api_fydam,
    defender: { side: Side.ENEMY, position: api_frai },
    attacker: { side: Side.PLAYER, position: index },
    info: { damage: api_fydam, acc: api_fcl, target: api_frai, phase: "raigeki", opening }
  });
  Raigeki.parseEnemyJson = opening => ({ api_erai, api_eydam, api_ecl }, index) => ({
    damage: api_eydam,
    defender: { side: Side.PLAYER, position: api_erai },
    attacker: { side: Side.ENEMY, position: index },
    info: { damage: api_eydam, acc: api_ecl, target: api_erai, phase: "raigeki", opening }
  });

  Raigeki.isRealAttack = ({ defender }) => defender.position !== -1;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.raigeki, Raigeki);
}());
