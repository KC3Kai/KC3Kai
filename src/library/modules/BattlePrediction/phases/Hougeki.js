(function () {
  const Hougeki = {};
  const { pipe, map, juxt, flatten, Side } = KC3BattlePrediction;
  const COMBINED_FLEET_MAIN_ALIGN = 6;

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
      parseInfo, isSpecialCutin, parseSpecialCutin, isMultiDefenders } = KC3BattlePrediction.battle.phases.hougeki;

    return isSpecialCutin(attackJson) || isMultiDefenders(attackJson) ? parseSpecialCutin(isAllySideFriend, attackJson) : {
      damage: parseDamage(attackJson),
      attacker: isAllySideFriend ? parseAttackerFriend(attackJson) : parseAttacker(attackJson),
      defender: isAllySideFriend ? parseDefenderFriend(attackJson) : parseDefender(attackJson),
      info: parseInfo(attackJson),
    };
  };

  // 1 Special CutIn (Nelson Touch / Nagato / Mutsu / Colorado / Kongou / SubFleet / Yamato) may attack different targets,
  // cannot ignore elements besides 1st one in api_df_list[] any more.
  // Night Zuiun cutin behaves more like other regular night cutins (single attacker, unlimited triggering times, etc),
  // but it attacks more than 1 target, so need to be parsed like special.
  Hougeki.parseSpecialCutin = (isAllySideFriend, attackJson) => {
    const { parseDamage, parseDefender, parseDefenderFriend, parseInfo, isRealAttack,
      parseAttacker, parseAttackerFriend, parseAttackerSpecial,
      isNelsonTouch, isNagatoCutin, isMutsuCutin, isColoradoCutin, isKongouCutin,
      isSubmarineCutin1, isSubmarineCutin2, isSubmarineCutin3,
      isYamatoCutin3P, isYamatoCutin2P,
      isNightZuiunCutin } = KC3BattlePrediction.battle.phases.hougeki;

    const { api_df_list: defenders, api_damage: damages, api_at_list: orgAttacker, api_at_eflag } = attackJson;
    return defenders.map((defender, index) => ({
      damage: parseDamage({ api_damage: [damages[index]] }),
      attacker: (
        isNelsonTouch(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 2, 4][index], isAllySideFriend})) :
        isNagatoCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 0, 1][index], isAllySideFriend})) :
        isMutsuCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 0, 1][index], isAllySideFriend})) :
        isColoradoCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 1, 2][index], isAllySideFriend})) :
        isKongouCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 1][index], isAllySideFriend})) :
        isNightZuiunCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: orgAttacker, isAllySideFriend})) :
        isSubmarineCutin1(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: (damages.length <= 2 ? [1, 2] : [1, 1, 2, 2])[index], isAllySideFriend})) :
        isSubmarineCutin2(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: (damages.length <= 2 ? [2, 3] : [2, 2, 3, 3])[index], isAllySideFriend})) :
        isSubmarineCutin3(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: (damages.length <= 2 ? [1, 3] : [1, 1, 3, 3])[index], isAllySideFriend})) :
        isYamatoCutin3P(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 1, 2][index], isAllySideFriend})) :
        isYamatoCutin2P(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 0, 1][index], isAllySideFriend})) :
        // Exception: unknown cutin type, may cause wrong attacker assigments, thank to api_at_list not array and always value 0
        parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: orgAttacker, isAllySideFriend}))
      ),
      // PvP now can trigger Night Zuiun cutin now
      defender: isAllySideFriend ? parseDefenderFriend({ api_at_eflag, api_df_list: [defender] }) :
        parseDefender({ api_at_eflag, api_df_list: [defender] }),
      info: parseInfo(attackJson, index),
    })).filter(isRealAttack);
  };

  Hougeki.isRealAttack = ({ defender }) => defender.position > -1;

  // To detect unknown cutin attacks that indexes against multiple different defenders
  Hougeki.isMultiDefenders = ({ api_df_list }) => {
    const realDefenders = api_df_list.filter(v => v != undefined && v > -1);
    return realDefenders.length >= 2 && realDefenders.some(v => v !== realDefenders[0]);
  };

  Hougeki.isSpecialCutin    = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) >= 100
    // Multi-angle attacks just single attacker & defender cutin, could fall into regular parsing
    && ![200, 201].includes(api_at_type);
  // Night Zuiun cutin (200) for api_sp_list added since 2023-02-14, single attacker, 1~2 defenders
  Hougeki.isNightZuiunCutin = ({ api_at_type, api_sp_list }) => (api_sp_list) === 200;
  Hougeki.isNelsonTouch     = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 100;
  Hougeki.isNagatoCutin     = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 101;
  Hougeki.isMutsuCutin      = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 102;
  Hougeki.isColoradoCutin   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 103;
  // Kongou cutin (104) only available in night api_sp_list for now, no daytime conflict yet
  Hougeki.isKongouCutin     = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 104;
  Hougeki.isSubmarineCutin1 = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 300;
  Hougeki.isSubmarineCutin2 = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 301;
  Hougeki.isSubmarineCutin3 = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 302;
  Hougeki.isYamatoCutin3P   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 400;
  Hougeki.isYamatoCutin2P   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 401;

  // According MVP result, Nelson Touch attackers might be set to corresponding
  //   ship position (1st Nelson, 3th, 5th), not fixed to main fleet flagship Nelson (api_at_list: 0);
  // For Nagato/Mutsu, 3 attacks assigned to 1st flagship twice, 2nd ship once;
  // For Colorado, 3 attacks assigned to first 3 ships;
  // For Kongou Class, 2 night attacks assigned to 1st flagship once, 2nd ship once;
  // For Submarine Fleet, 2~4 torpedo attacks assigned to 2 of 2nd~4th SS members, 1st flagship not attack;
  //   Known issue: no proper way to predict 3 hits torpedo attacks have merged 2 hits from which submarine for now;
  // For Yamato/Musashi, 3 attacks assigned to first 2or3 ships, flagship twice if only 1 partner ship;
  Hougeki.parseAttackerSpecial = ({ isAllySideFriend, attackerPos, api_at_eflag, api_sp_list }) => {
    const { getBattleType } = KC3BattlePrediction.battle;
    // Fix known game API issue: for combined fleet night battle, api_at_list (of api_sp_list: 104) still point to 0, instead of escort fleet flagship 6.
    // This will cause Kongou Class cutin in CF gives wrong damage dealers and can't tell difference with day time cutin (if any).
    const combinedFleetPosDiff = (api_sp_list === 104 && !isAllySideFriend && getBattleType().player
      && getBattleType().player !== KC3BattlePrediction.Player.SINGLE) ? COMBINED_FLEET_MAIN_ALIGN : 0;
    return {
      side: api_at_eflag === 1 ? Side.ENEMY : isAllySideFriend ? Side.FRIEND : Side.PLAYER,
      position: (attackerPos || 0) + combinedFleetPosDiff,
    };
  };

  Hougeki.parseDamage = ({ api_damage }) =>
    api_damage.reduce((result, n) => result + Math.max(0, n), 0);

  Hougeki.parseAttacker = ({ api_at_eflag, api_at_list }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : Side.PLAYER,
    position: api_at_list || 0,
  });

  Hougeki.parseAttackerFriend = ({ api_at_eflag, api_at_list }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : Side.FRIEND,
    position: api_at_list || 0,
  });

  Hougeki.parseDefender = ({ api_at_eflag, api_df_list }) => ({
    side: api_at_eflag === 1 ? Side.PLAYER : Side.ENEMY,
    position: api_df_list[0] || 0,
  });

  Hougeki.parseDefenderFriend = ({ api_at_eflag, api_df_list }) => ({
    side: api_at_eflag === 1 ? Side.FRIEND : Side.ENEMY,
    position: api_df_list[0] || 0,
  });

  Hougeki.parseInfo = ({ api_damage, api_cl_list, api_si_list, api_at_type, api_sp_list, api_df_list }, index = -1) => ({
    damage: (index === -1 ? api_damage : [api_damage[index]]),
    acc: (index === -1 ? api_cl_list : [api_cl_list[index]]),
    equip: api_si_list,
    cutin: api_at_type,
    ncutin: api_sp_list,
    target: (index === -1 ? api_df_list : [api_df_list[index]]),
    phase: "hougeki"
  });

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, Hougeki);
}());