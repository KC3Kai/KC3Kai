(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const formatResult = (initialFleets, resultFleets) => {
    const { isPlayerNoDamage, fleets: { formatFleets } } = KC3BattlePrediction;

    const initial = formatFleets(initialFleets);
    const result = formatFleets(resultFleets);

    return {
      fleets: result,
      isPlayerNoDamage: isPlayerNoDamage(initial, result),
    };
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ NO DAMAGE ]--------------------- */

  const isPlayerNoDamage = (initialFleets, resultFleets) => {
    const { extendError, isNotDamaged } = KC3BattlePrediction;

    const initialShips = initialFleets.playerMain.concat(initialFleets.playerEscort);
    const resultShips = resultFleets.playerMain.concat(resultFleets.playerEscort);

    if (initialShips.length !== resultShips.length) {
      throw extendError(new Error('Mismatched initial and result fleets'), { initialFleets, resultFleets });
    }

    return resultShips.every((resultShip, index) => isNotDamaged(initialShips[index], resultShip));
  };

  // If damecon increases HP beyond initial value, it counts as no damage
  const isNotDamaged = (initial, result) => initial.hp <= result.hp;


  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction, {
    // Public
    formatResult,
    // Internals
    isPlayerNoDamage,
    isNotDamaged,
  });
}());
