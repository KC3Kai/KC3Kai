(function () {
  const battle = {};
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  battle.simulateBattle = (battleData, initalFleets, battleType) => {
    const { battle: { parseBattle }, fleets: { simulateAttack } } = KC3BattlePrediction;

    return parseBattle(battleType, battleData).reduce(simulateAttack, initalFleets);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  /* -----------------[ PARSE BATTLE DATA ]---------------- */

  battle.parseBattle = (battleType, battleData) => {
    const { accumulateAttacks, parsePhases } = KC3BattlePrediction.battle;

    return accumulateAttacks(parsePhases(battleType, battleData));
  };

  battle.parsePhases = (battleType, battleData) => {
    const { getBattlePhases } = KC3BattlePrediction.battle.engagement;

    return getBattlePhases(battleType).map(parsePhase => parsePhase(battleData));
  };

  battle.accumulateAttacks = phases =>
    phases.reduce((attacks, phase) => attacks.concat(phase), []);

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.battle, battle);
}());
