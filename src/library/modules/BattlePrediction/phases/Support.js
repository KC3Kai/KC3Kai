(function () {
  const Support = {};
  const SUPPORT_PROPS = ['api_damage'];
  const { pipe, map, filter, Side } = KC3BattlePrediction;

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Support.parseSupport = ({ api_support_hourai, api_support_airatack }) => {
    const {
      support: { parseHourai },
      kouku: { parseKouku },
    } = KC3BattlePrediction.battle.phases;

    if (api_support_airatack) {
      return parseKouku(api_support_airatack);
    } else if (api_support_hourai) {
      return parseHourai(api_support_hourai);
    }
    return [];
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Support.parseHourai = (battleData) => {
    const { createAttack } = KC3BattlePrediction.battle;
    const { extractFromJson } = KC3BattlePrediction.battle.phases;
    const { parseJson, isDamagingAttack } = KC3BattlePrediction.battle.phases.support;

    return pipe(
      extractFromJson(SUPPORT_PROPS),
      map(parseJson),
      filter(isDamagingAttack),
      map(createAttack)
    )(battleData);
  };

  Support.parseJson = ({ api_damage }, index) => ({
    damage: api_damage,
    defender: { side: Side.ENEMY, position: index },
  });

  Support.isDamagingAttack = ({ damage }) => damage > 0;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.support, Support);
}());
