// Parser for 航空 (aerial combat) phase
(function () {
  const COMBINED_FLEET_MAIN_ALIGN = 6;
  const Kouku = {};
  const { pipe, juxt, flatten, map, filter, Side } = KC3BattlePrediction;
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  Kouku.parseKouku = (battleData) => {
    const { parseKoukuInternal } = KC3BattlePrediction.battle.phases.kouku;
    return parseKoukuInternal(battleData, false);
  };

  Kouku.parseKoukuFriend = (battleData) => {
    const { parseKoukuInternal } = KC3BattlePrediction.battle.phases.kouku;
    return parseKoukuInternal(battleData, true);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  Kouku.parseKoukuInternal = (battleData, isAllySideFriend = false) => {
    const { createAttack } = KC3BattlePrediction.battle;
    const {
      normalizeFleetDamageArrays,
      parsePlayerJson,
      parsePlayerJsonFriend,
      parseEnemyJson,
      isDamagingAttack,
    } = KC3BattlePrediction.battle.phases.kouku;

    return pipe(
      normalizeFleetDamageArrays,
      juxt([(isAllySideFriend ? parsePlayerJsonFriend : parsePlayerJson), parseEnemyJson]),
      flatten,
      filter(isDamagingAttack),
      map(createAttack)
    )(battleData);
  };

  Kouku.normalizeFleetDamageArrays = (battleData) => {
    const { extractDamageArray, padDamageArray } = KC3BattlePrediction.battle.phases.kouku;

    return pipe(
      juxt([
        extractDamageArray('api_stage3', 'api_fdam'),
        extractDamageArray('api_stage3_combined', 'api_fdam'),
        extractDamageArray('api_stage3', 'api_edam'),
        extractDamageArray('api_stage3_combined', 'api_edam'),
      ]),
      map(padDamageArray),
      ([playerMain, playerEscort, enemyMain, enemyEscort]) => ({
        api_fdam: [].concat(playerMain, playerEscort),
        api_edam: [].concat(enemyMain, enemyEscort),
      })
    )(battleData);
  };

  Kouku.extractDamageArray = (stageName, damageArrayName) => battleData =>
    (battleData[stageName] && battleData[stageName][damageArrayName]) || [];

  Kouku.padDamageArray = damageArray =>
    (damageArray.length < COMBINED_FLEET_MAIN_ALIGN
      ? damageArray.concat(new Array(COMBINED_FLEET_MAIN_ALIGN - damageArray.length).fill(0))
      : damageArray);

  Kouku.parsePlayerJson = ({ api_fdam }) => api_fdam.map(
    (damage, position) => ({ damage, defender: { side: Side.PLAYER, position } })
  );
  Kouku.parsePlayerJsonFriend = ({ api_fdam }) => api_fdam.map(
    (damage, position) => ({ damage, defender: { side: Side.FRIEND, position } })
  );
  Kouku.parseEnemyJson = ({ api_edam }) => api_edam.map(
    (damage, position) => ({ damage, defender: { side: Side.ENEMY, position } })
  );

  Kouku.isDamagingAttack = ({ damage }) => damage > 0;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.kouku, Kouku);
}());
