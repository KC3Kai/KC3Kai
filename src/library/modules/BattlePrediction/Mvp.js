(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const combineResults = (dayFleets, nightFleets) => {
    const { combineFleetResults } = KC3BattlePrediction.mvp;

    if (!nightFleets) { return dayFleets; }
    if (!dayFleets) { return nightFleets; }
    return {
      playerMain: combineFleetResults(dayFleets.playerMain, nightFleets.playerMain),
      playerEscort: combineFleetResults(dayFleets.playerEscort, nightFleets.playerEscort),
    };
  };

  const getHighestDamage = (fleet) => {
    const { index } = fleet.reduce((result, { damageDealt }, i) => {
      return damageDealt > result.damageDealt
        ? { damageDealt, index: i }
        : result;
    }, { damageDealt: -1 });
    // MVP index 1-based
    return index !== undefined ? index + 1 : undefined;
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const combineFleetResults = (day, night) => {
    const { zipWith } = KC3BattlePrediction;

    return zipWith(
      (dayResult, nightResult) => ({
        damageDealt: dayResult.damageDealt + nightResult.damageDealt,
      }),
      day,
      night
    );
  };


  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.mvp, {
    // Public
    combineResults,
    getHighestDamage,
    // Internal
    combineFleetResults,
  });
}());
