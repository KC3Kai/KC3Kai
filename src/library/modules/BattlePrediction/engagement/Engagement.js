(function () {
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  const getBattlePhases = (battleType) => {
    const { getEngagementType, getPhaseParsers } = KC3BattlePrediction.battle.engagement;

    return getPhaseParsers(getEngagementType(battleType));
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  const getPhaseParsers = (engagementInstance) => {
    // getOwnPropertyNames should guarantee (string) keys are returned in declaration order
    return Object.getOwnPropertyNames(engagementInstance).map(phase => engagementInstance[phase]);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.engagement, {
    // Public
    getBattlePhases,
    // Internal
    getPhaseParsers,
  });
}());
