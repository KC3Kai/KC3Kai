(function () {
  const Fleets = {};
  const { pipe, juxt, map, filter, zipWith, EMPTY_SLOT } = KC3BattlePrediction;
  const COMBINED_FLEET_MAIN_SIZE = 6;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  // Create a Fleets object with the state of the player and enemy Fleets at battle start
  Fleets.getInitialState = (battleData, damecons) => {
    const { extractHps, merge } = KC3BattlePrediction.fleets;

    return pipe(
      juxt([
        extractHps('api_f_nowhps', 'api_f_maxhps'),
        extractHps('api_f_nowhps_combined', 'api_f_maxhps_combined'),
        extractHps('api_e_nowhps', 'api_e_maxhps'),
        extractHps('api_e_nowhps_combined', 'api_e_maxhps_combined'),
      ]),
      ([playerMain, playerEscort, enemyMain, enemyEscort]) => ({
        player: merge(playerMain, playerEscort, damecons),
        enemy: merge(enemyMain, enemyEscort, []),
      })
    )(battleData);
  };

  Fleets.getPath = ({ side, position }) => `${side}.${position}`;
  Fleets.simulateAttack = (fleets, { damage, defender, attacker }) => {
    const { over } = KC3BattlePrediction;
    const { getPath } = KC3BattlePrediction.fleets;
    const { dealDamage, takeDamage } = KC3BattlePrediction.fleets.ship;

    return pipe(
      over(getPath(defender), takeDamage(damage)),
      attacker ? over(getPath(attacker), dealDamage(damage)) : x => x
    )(fleets);
  };

  Fleets.formatFleets = (battleType, fleets) => {
    const { Player, Enemy } = KC3BattlePrediction;
    const { formatSide } = KC3BattlePrediction.fleets;

    return pipe(
      juxt([
        ({ player }) => formatSide(battleType.player !== Player.SINGLE, player),
        ({ enemy }) => formatSide(battleType.enemy !== Enemy.SINGLE, enemy),
      ]),
      ([player, enemy]) => ({
        playerMain: player.main,
        playerEscort: player.escort,
        enemyMain: enemy.main,
        enemyEscort: enemy.escort,
      })
    )(fleets);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ----------------[ GET INITIAL STATE ]----------------- */

  Fleets.extractHps = (nowHpsProp, maxHpsProp) => battleData => {
    const { createShip } = KC3BattlePrediction.fleets.ship;

    const nowHps = battleData[nowHpsProp] || [];
    const maxHps = battleData[maxHpsProp] || [];

    if (nowHps.length !== maxHps.length) {
      throw new Error(`Mismatched array lengths: "${nowHpsProp}" and "${maxHpsProp}"`);
    }

    return zipWith(createShip, nowHps, maxHps);
  };

  Fleets.merge = (main, escort, damecons) => {
    const { installDamecons, mergeFleets } = KC3BattlePrediction.fleets;

    return pipe(
      installDamecons(damecons),
      mergeFleets
    )({ main, escort });
  };

  Fleets.installDamecons = damecons => fleet => {
    const { installDamecon } = KC3BattlePrediction.fleets.ship;

    return {
      main: zipWith(installDamecon, fleet.main, damecons.main || []),
      escort: zipWith(installDamecon, fleet.escort, damecons.escort || []),
    };
  };

  Fleets.mergeFleets = ({ main, escort }) =>
    [].concat(
      zipWith((ship, empty) => ship || empty, main, Array(COMBINED_FLEET_MAIN_SIZE).fill(EMPTY_SLOT)),
      escort
    );

  /* ------------------[ FORMAT FLEETS ]------------------- */

  Fleets.formatSide = (isCombined, fleet) => {
    const { splitFleet, ship: { formatShip } } = KC3BattlePrediction.fleets;

    return pipe(
      map(formatShip),
      splitFleet(isCombined)
    )(fleet);
  };

  Fleets.splitFleet = isCombined => fleet => {
    return pipe(
      juxt([
        ships => (isCombined ? ships.slice(0, COMBINED_FLEET_MAIN_SIZE) : fleet),
        ships => (isCombined ? ships.slice(COMBINED_FLEET_MAIN_SIZE) : []),
      ]),
      map(filter(ship => ship !== EMPTY_SLOT)),
      ([main, escort]) => ({ main, escort })
    )(fleet);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, Fleets);
}());
