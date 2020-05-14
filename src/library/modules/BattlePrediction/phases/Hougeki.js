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
      parseInfo, isNelsonTouch, isNagatoCutin, isMutsuCutin, isColoradoCutin, isKongouCutin,
      parseSpecialCutin } = KC3BattlePrediction.battle.phases.hougeki;

    const isSpecialCutin = isNelsonTouch(attackJson) ||
      isNagatoCutin(attackJson) || isMutsuCutin(attackJson) ||
      isColoradoCutin(attackJson) ||
      isKongouCutin(attackJson);
    return isSpecialCutin ? parseSpecialCutin(isAllySideFriend, attackJson) : {
      damage: parseDamage(attackJson),
      attacker: isAllySideFriend ? parseAttackerFriend(attackJson) : parseAttacker(attackJson),
      defender: isAllySideFriend ? parseDefenderFriend(attackJson) : parseDefender(attackJson),
      info: parseInfo(attackJson),
    };
  };

  // 1 Special CutIn (Nelson Touch / Nagato / Mutsu / Colorado / Kongou) may attack different targets,
  // cannot ignore elements besides 1st one in api_df_list[] any more.
  Hougeki.parseSpecialCutin = (isAllySideFriend, attackJson) => {
    const { parseDamage, parseDefender, parseInfo, isRealAttack,
      parseAttacker, parseAttackerFriend, parseAttackerSpecial,
      isNelsonTouch, isNagatoCutin, isMutsuCutin, isColoradoCutin, isKongouCutin } = KC3BattlePrediction.battle.phases.hougeki;

    const { api_df_list: defenders, api_damage: damages } = attackJson;
    return defenders.map((defender, index) => ({
      damage: parseDamage({ api_damage: [damages[index]] }),
      attacker: isNelsonTouch(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 2, 4], isAllySideFriend, index})) :
        isNagatoCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 0, 1], isAllySideFriend, index})) :
        isMutsuCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 0, 1], isAllySideFriend, index})) :
        isColoradoCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 1, 2], isAllySideFriend, index})) :
        isKongouCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 1, 1], isAllySideFriend, index})) :
        // Unreachable exception
        (isAllySideFriend ? parseAttackerFriend(attackJson) : parseAttacker(attackJson)),
      // Assume abyssal enemy and PvP cannot trigger it yet
      defender: parseDefender({ api_df_list: [defender] }),
      info: parseInfo(attackJson, index),
    })).filter(isRealAttack);
  };

  Hougeki.isRealAttack = ({ defender }) => defender.position !== -1;

  Hougeki.isNelsonTouch   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 100;
  Hougeki.isNagatoCutin   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 101;
  Hougeki.isMutsuCutin    = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 102;
  Hougeki.isColoradoCutin = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 103;
  Hougeki.isKongouCutin   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 104;

  // According MVP result, Nelson Touch attackers might be set to corresponding
  //   ship position (1st Nelson, 3th, 5th), not fixed to Nelson (api_at_list: 0);
  // For Nagato/Mutsu, 3 attacks assigned to 1st flagship twice, 2nd ship once;
  // For Colorado, 3 attacks assigned to first 3 ships;
  // For Kongou Class, 2 night attacks assigned to 1st flagship once, 2nd ship once;
  Hougeki.parseAttackerSpecial = ({ isAllySideFriend, index, attackerPos, api_at_eflag }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : isAllySideFriend ? Side.FRIEND : Side.PLAYER,
    position: attackerPos[index] || 0,
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

  Hougeki.parseInfo = ({ api_damage, api_cl_list, api_si_list, api_at_type, api_sp_list, api_df_list }, index = -1) => ({
    damage: (index === -1 ? api_damage : [api_damage[index]]),
    acc: (index === -1 ? api_cl_list : [api_cl_list[index]]),
    equip: api_si_list,
    cutin: api_at_type,
    ncutin: api_sp_list,
    target: (index === -1 ? api_df_list : [api_df_list[index]]),
  });

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, Hougeki);
}());