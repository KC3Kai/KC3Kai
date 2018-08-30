(function () {
  const Raigeki = {};
  const { pipe, juxt, flatten, map, filter, Side } = KC3BattlePrediction;
  const RAIGEKI_PLAYER = ['api_frai', 'api_fydam'];
  const RAIGEKI_ENEMY = ['api_erai', 'api_eydam'];

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Raigeki.parseRaigeki = battleData => {
    const { createAttack } = KC3BattlePrediction.battle;
    const {
      parseSide,
      parsePlayerJson,
      parseEnemyJson,
      isRealAttack,
    } = KC3BattlePrediction.battle.phases.raigeki;

    return pipe(
      juxt([
        parseSide(RAIGEKI_PLAYER, parsePlayerJson),
        parseSide(RAIGEKI_ENEMY, parseEnemyJson),
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

  Raigeki.parsePlayerJson = ({ api_frai, api_fydam }, index) => ({
    damage: api_fydam,
    defender: { side: Side.ENEMY, position: api_frai },
    attacker: { side: Side.PLAYER, position: index },
  });
  Raigeki.parseEnemyJson = ({ api_erai, api_eydam }, index) => ({
    damage: api_eydam,
    defender: { side: Side.PLAYER, position: api_erai },
    attacker: { side: Side.ENEMY, position: index },
  });

  Raigeki.isRealAttack = ({ defender }) => defender.position !== -1;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.raigeki, Raigeki);
}());
