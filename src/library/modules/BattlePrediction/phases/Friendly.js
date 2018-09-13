(function () {
  const Friendly = {};
  const { pipe, map, filter, Side } = KC3BattlePrediction;

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Friendly.parseFriendly = ({ api_hougeki }) => {
    const {
      hougeki: { parseHougeki },
    } = KC3BattlePrediction.battle.phases;

    return parseHougeki(api_hougeki, true);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.friendly, Friendly);
}());
