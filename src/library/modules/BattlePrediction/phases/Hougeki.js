(function () {
  const Hougeki = {};
  const { pipe, map, juxt, flatten, Side } = KC3BattlePrediction;

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Hougeki.parseHougeki = (battleData) => {
    const { parseHougekiInternal } = KC3BattlePrediction.battle.phases.hougeki;
    return parseHougekiInternal(battleData, false);
  };

  Hougeki.parseHougekiFriend = (battleData) => {
    const { parseHougekiInternal } = KC3BattlePrediction.battle.phases.hougeki;
    return parseHougekiInternal(battleData, true);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Hougeki.parseHougekiInternal = (battleData, isAllySideFriend = false) => {
    const { createAttack } = KC3BattlePrediction.battle;
    const { extractFromJson } = KC3BattlePrediction.battle.phases;
    const { parseJson } = KC3BattlePrediction.battle.phases.hougeki;
    const HOUGEKI_PROPS = battleData.api_at_type ?
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage', 'api_cl_list', 'api_si_list', 'api_at_type'] :
      battleData.api_sp_list ?
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage', 'api_cl_list', 'api_si_list', 'api_sp_list'] :
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage'];

    return pipe(
      juxt([pipe(
        extractFromJson(HOUGEKI_PROPS),
        map(parseJson.bind(null, isAllySideFriend))
      )]),
      flatten,
      map(createAttack))(battleData);
  };

  Hougeki.parseJson = (isAllySideFriend, attackJson) => {
    const { parseDamage, parseAttacker, parseDefender, parseAttackerFriend, parseDefenderFriend,
      parseInfo, isNelsonTouch, parseNelsonTouch } = KC3BattlePrediction.battle.phases.hougeki;

    return isNelsonTouch(attackJson) ? parseNelsonTouch(isAllySideFriend, attackJson) : {
      damage: parseDamage(attackJson),
      attacker: isAllySideFriend ? parseAttackerFriend(attackJson) : parseAttacker(attackJson),
      defender: isAllySideFriend ? parseDefenderFriend(attackJson) : parseDefender(attackJson),
      info: parseInfo(attackJson),
    };
  };

  // 1 Nelson Touch (CutIn) may attack 3 different targets,
  // cannot ignore elements besides 1st one in api_df_list[] any more.
  Hougeki.parseNelsonTouch = (isAllySideFriend, attackJson) => {
    const { parseDamage, parseNelsonTouchAttacker, parseDefender,
      parseInfo, isRealAttack } = KC3BattlePrediction.battle.phases.hougeki;

    const { api_df_list: defenders, api_damage: damages } = attackJson;
    return defenders.map((defender, index) => ({
      damage: parseDamage({ api_damage: [damages[index]] }),
      attacker: parseNelsonTouchAttacker(Object.assign({}, attackJson, {isAllySideFriend, index})),
      // Assume abyssal enemy cannot trigger it yet, but PvP unknown.
      defender: parseDefender({ api_df_list: [defender] }),
      info: parseInfo(attackJson),
    })).filter(isRealAttack);
  };

  Hougeki.isRealAttack = ({ defender }) => defender.position !== -1;

  Hougeki.isNelsonTouch = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 100;

  // Uncertain: according MVP result, attacker might be set to corresponding
  // ship position (1st Nelson, 3th, 5th), not fixed to Nelson (api_at_list: 0).
  Hougeki.parseNelsonTouchAttacker = ({ isAllySideFriend, index, api_at_eflag }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : isAllySideFriend ? Side.FRIEND : Side.PLAYER,
    position: [0, 2, 4][index] || 0,
  });

  Hougeki.parseDamage = ({ api_damage }) =>
    api_damage.reduce((result, n) => result + Math.max(0, n), 0);

  Hougeki.parseAttacker = ({ api_at_eflag, api_at_list }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : Side.PLAYER,
    position: api_at_list,
  });

  Hougeki.parseAttackerFriend = ({ api_at_eflag, api_at_list }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : Side.FRIEND,
    position: api_at_list,
  });

  Hougeki.parseDefender = ({ api_at_eflag, api_df_list }) => ({
    side: api_at_eflag === 1 ? Side.PLAYER : Side.ENEMY,
    position: api_df_list[0],
  });

  Hougeki.parseDefenderFriend = ({ api_at_eflag, api_df_list }) => ({
    side: api_at_eflag === 1 ? Side.FRIEND : Side.ENEMY,
    position: api_df_list[0],
  });

  Hougeki.parseInfo = ({ api_damage, api_cl_list, api_si_list, api_at_type, api_sp_list, api_df_list }) => ({
    damage: api_damage,
    acc: api_cl_list,
    equip: api_si_list,
    cutin: api_at_type,
    ncutin: api_sp_list,
    target: api_df_list,
  });

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, Hougeki);
}());