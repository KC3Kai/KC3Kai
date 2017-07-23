(function () {
  const battle = {};
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  battle.simulateBattle = (battleData, initalFleets, battleType) => {
    const { parseBattle, simulateAttack } = KC3BattlePrediction.battle;

    const attacks = parseBattle(battleType, battleData);
    return attacks.reduce(simulateAttack, initalFleets);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  /* -----------------[ SIMULATE ATTACKS ]----------------- */

  battle.simulateAttack = (fleets, { target, damage }) => {
    const { bind, fleets: { update, damageShip } } = KC3BattlePrediction;

    return update(fleets, target, bind(damageShip, damage));
  };

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
