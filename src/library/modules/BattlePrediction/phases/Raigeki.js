(function () {
  const Raigeki = {};
  const { pipe, juxt, flatten, map, filter, Side } = KC3BattlePrediction;
  const RAIGEKI_PLAYER = ['api_frai', 'api_fydam', 'api_fcl'];
  const RAIGEKI_ENEMY = ['api_erai', 'api_eydam', 'api_ecl'];
  const MULTIRAIGEKI_PLAYER = ['api_frai_list_items', 'api_fydam_list_items', 'api_fcl_list_items'];
  const MULTIRAIGEKI_ENEMY = ['api_erai_list_items', 'api_eydam_list_items', 'api_ecl_list_items'];

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
      parsePlayerMultiJson,
      parseEnemyMultiJson,
      isRealAttack,
      isMultiAttack,
    } = KC3BattlePrediction.battle.phases.raigeki;

    return pipe(
      juxt([
        (isMultiAttack(battleData) ? parseSide(MULTIRAIGEKI_PLAYER, parsePlayerMultiJson(opening)) :
          parseSide(RAIGEKI_PLAYER, parsePlayerJson(opening))),
        (isMultiAttack(battleData) ? parseSide(MULTIRAIGEKI_ENEMY, parseEnemyMultiJson(opening)) :
          parseSide(RAIGEKI_ENEMY, parseEnemyJson(opening))),
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

  Raigeki.parsePlayerJson = (opening) => ({ api_frai, api_fydam, api_fcl }, index) => ({
    damage: api_fydam,
    defender: { side: Side.ENEMY, position: api_frai },
    attacker: { side: Side.PLAYER, position: index },
    info: { damage: api_fydam, acc: api_fcl, target: api_frai, phase: "raigeki", opening }
  });
  Raigeki.parseEnemyJson = (opening) => ({ api_erai, api_eydam, api_ecl }, index) => ({
    damage: api_eydam,
    defender: { side: Side.PLAYER, position: api_erai },
    attacker: { side: Side.ENEMY, position: index },
    info: { damage: api_eydam, acc: api_ecl, target: api_erai, phase: "raigeki", opening }
  });

  // Since 2024-03-01, opening torpedo allows 1 attacker to damage multiple defenders
  Raigeki.isMultiAttack = ({ api_fydam, api_fydam_list_items }) => api_fydam_list_items !== undefined && api_fydam === undefined;
  Raigeki.parsePlayerMultiJson = (opening) => ({ api_frai_list_items, api_fydam_list_items, api_fcl_list_items }, index) => (
    Array.isArray(api_fydam_list_items) ? api_fydam_list_items.map((api_fydam, subattackidx) => ({
      damage: api_fydam,
      defender: { side: Side.ENEMY, position: api_frai_list_items[subattackidx] },
      attacker: { side: Side.PLAYER, position: index },
      info: { damage: api_fydam, acc: api_fcl_list_items[subattackidx], target: api_frai_list_items[subattackidx], phase: "raigeki", opening }
    })) : {
      damage: api_fydam_list_items,
      defender: { side: Side.ENEMY, position: api_frai_list_items },
      attacker: { side: Side.PLAYER, position: index },
      info: { damage: api_fydam_list_items, acc: api_fcl_list_items, target: api_frai_list_items, phase: "raigeki", opening }
    }
  );
  Raigeki.parseEnemyMultiJson = (opening) => ({ api_erai_list_items, api_eydam_list_items, api_ecl_list_items }, index) => (
    Array.isArray(api_eydam_list_items) ? api_eydam_list_items.map((api_eydam, subattackidx) => ({
      damage: api_eydam,
      defender: { side: Side.PLAYER, position: api_erai_list_items[subattackidx] },
      attacker: { side: Side.ENEMY, position: index },
      info: { damage: api_eydam, acc: api_ecl_list_items[subattackidx], target: api_erai_list_items[subattackidx], phase: "raigeki", opening }
    })) : {
      damage: api_eydam_list_items,
      defender: { side: Side.PLAYER, position: api_erai_list_items },
      attacker: { side: Side.ENEMY, position: index },
      info: { damage: api_eydam_list_items, acc: api_ecl_list_items, target: api_erai_list_items, phase: "raigeki", opening }
    }
  );

  // Game server may be bugged for some cases to return [null] and broken api_edam: https://github.com/andanteyk/ElectronicObserver/issues/294
  // Client codes treat `null` element the same with value -1
  Raigeki.isRealAttack = ({ defender }) => defender.position !== -1 && defender.position != null;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.raigeki, Raigeki);
}());
