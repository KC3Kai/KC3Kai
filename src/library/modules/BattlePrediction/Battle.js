(function () {
  const battle = {};
  const { pipe, juxt, flatten, reduce } = KC3BattlePrediction;
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  battle.simulateBattle = (battleData, initalFleets, battleType) => {
    const { battle: { getPhases }, fleets: { simulateAttack } } = KC3BattlePrediction;

    return pipe(
      juxt(getPhases(battleType)),
      flatten,
      reduce(simulateAttack, initalFleets)
    )(battleData);
  };

  battle.simulateBattlePartially = (battleData, initalFleets, battlePhases = []) => {
    const { fleets: { simulateAttack } } = KC3BattlePrediction;
    const { getPhaseParser } = KC3BattlePrediction.battle;

    return pipe(
      juxt(battlePhases.map(getPhaseParser)),
      flatten,
      reduce(simulateAttack, initalFleets)
    )(battleData);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  battle.getPhases = (battleType) => {
    const { getBattlePhases, getPhaseParser } = KC3BattlePrediction.battle;
    return getBattlePhases(battleType).map(getPhaseParser);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.battle, battle);
}());
