(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const createFleets = (...fleets) => {
    const { removeEmptyShips } = KC3BattlePrediction.fleets;

    const [playerMain, enemyMain, playerEscort, enemyEscort] = fleets.map(removeEmptyShips);

    return {
      player: { main: playerMain, escort: playerEscort },
      enemy: { main: enemyMain, escort: enemyEscort },
    };
  };

  const update = (fleets, target, updateShip) => {
    const { extendError } = KC3BattlePrediction;
    const { isTargetInFleets, applyUpdate } = KC3BattlePrediction.fleets;

    if (!isTargetInFleets(target, fleets)) {
      throw extendError(new Error('Bad target'), { target, fleets });
    }

    return applyUpdate(target, updateShip, fleets);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const removeEmptyShips = ships => ships.filter(ship => !!ship);

  const isTargetInFleets = ({ side, role, position }, fleets) =>
    !!(fleets[side] && fleets[side][role] && fleets[side][role][position]);

  const applyUpdate = ({ side, role, position }, updateShip, fleets) => {
    const { cloneFleets } = KC3BattlePrediction.fleets;

    // NB: Cloning is necessary to preserve function purity
    // Can be replaced by assignment if performance is an issue, though this may cause issues with logging
    const result = cloneFleets(fleets);
    result[side][role][position] = updateShip(fleets[side][role][position]);

    return result;
  };

  const cloneFleets = fleets => JSON.parse(JSON.stringify(fleets));

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    createFleets,
    update,
    // Internal
    removeEmptyShips,

    isTargetInFleets,
    applyUpdate,
    cloneFleets,
  });
}());
