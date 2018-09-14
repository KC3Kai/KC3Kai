(function () {
  const Hougeki = {};
  const { pipe, map, Side } = KC3BattlePrediction;

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
    const { parseJson, parseJsonFriend } = KC3BattlePrediction.battle.phases.hougeki;
    const HOUGEKI_PROPS = battleData.api_at_type ?
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage', 'api_cl_list', 'api_si_list', 'api_at_type'] :
      battleData.api_sp_list ?
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage', 'api_cl_list', 'api_si_list', 'api_sp_list'] :
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage'];
    return pipe(
      extractFromJson(HOUGEKI_PROPS),
      map(isAllySideFriend ? parseJsonFriend : parseJson),
      map(createAttack)
    )(battleData);
  };

  Hougeki.parseJson = (attackJson) => {
    const { parseDamage, parseAttacker, parseDefender, parseInfo } = KC3BattlePrediction.battle.phases.hougeki;

    return {
      damage: parseDamage(attackJson),
      attacker: parseAttacker(attackJson),
      defender: parseDefender(attackJson),
      info: parseInfo(attackJson),
    };
  };

  Hougeki.parseJsonFriend = (attackJson) => {
    const { parseDamage, parseAttackerFriend, parseDefenderFriend, parseInfo } = KC3BattlePrediction.battle.phases.hougeki;

    return {
      damage: parseDamage(attackJson),
      attacker: parseAttackerFriend(attackJson),
      defender: parseDefenderFriend(attackJson),
      info: parseInfo(attackJson),
    };
  };

  Hougeki.parseDamage = ({ api_damage }) =>
    api_damage.reduce((result, n) => result + Math.max(0, n), 0);

  Hougeki.parseAttacker = ({ api_at_eflag, api_at_list }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : Side.PLAYER,
    position: api_at_list,
  });

  Hougeki.parseDefender = ({ api_at_eflag, api_df_list }) => ({
    side: api_at_eflag === 1 ? Side.PLAYER : Side.ENEMY,
    position: api_df_list[0],
  });

  Hougeki.parseAttackerFriend = ({ api_at_eflag, api_at_list }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : Side.FRIEND,
    position: api_at_list,
  });

  Hougeki.parseDefenderFriend = ({ api_at_eflag, api_df_list }) => ({
    side: api_at_eflag === 1 ? Side.FRIEND : Side.ENEMY,
    position: api_df_list[0],
  });

  Hougeki.parseInfo = ({ api_damage, api_cl_list, api_si_list, api_at_type, api_sp_list }) => ({
    damage: api_damage,
    acc: api_cl_list,
    equip: api_si_list,
    cutin: api_at_type,
    ncutin: api_sp_list,
  });

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, Hougeki);
}());