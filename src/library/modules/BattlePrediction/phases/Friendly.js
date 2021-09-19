(function () {
  const Friendly = {};

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Friendly.parseFriendly = ({ api_hougeki }) => {
    const {
      hougeki: { parseHougekiFriend },
    } = KC3BattlePrediction.battle.phases;

    return parseHougekiFriend(api_hougeki);
  };

  Friendly.parseFriendlyKouku = (api_friendly_kouku) => {
    const {
      kouku: { parseKoukuFriend },
    } = KC3BattlePrediction.battle.phases;

    return parseKoukuFriend(api_friendly_kouku);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.friendly, Friendly);
}());
