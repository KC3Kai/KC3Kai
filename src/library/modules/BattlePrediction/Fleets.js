(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  // Create a Fleets object with the state of the player and enemy fleets at battle start
  const getInitialState = ({ api_nowhps, api_maxhps, api_nowhps_combined, api_maxhps_combined }, playerDamecons) => {
    const { Role } = KC3BattlePrediction;
    const { getFleetShips, addDamecons, createFleets } = KC3BattlePrediction.fleets;

    const mainFleets = getFleetShips(api_nowhps, api_maxhps);
    const escortFleets = getFleetShips(api_nowhps_combined, api_maxhps_combined);

    return createFleets(
      addDamecons(Role.MAIN_FLEET, playerDamecons, mainFleets.player),
      mainFleets.enemy,
      addDamecons(Role.ESCORT_FLEET, playerDamecons, escortFleets.player),
      escortFleets.enemy
    );
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ----------------------[ SHIPS ]----------------------- */

  const getFleetShips = (nowhps, maxhps) => {
    const { normalizeHps, convertToShips, splitSides } = KC3BattlePrediction.fleets;

    // shortcircuit if neither side has a fleet
    if (!nowhps && !maxhps) { return { player: [], enemy: [] }; }

    return splitSides(
      convertToShips(normalizeHps(nowhps), normalizeHps(maxhps))
    );
  };

  const normalizeHps = (hps) => {
    const { normalizeArrayIndexing, EMPTY_SLOT } = KC3BattlePrediction;

    // Transform to 0-based indexing
    const result = normalizeArrayIndexing(hps);

    // Sometimes empty ship slots at the end of the array get omitted
    if (result.length % 6 === 0) {
      return result;
    }
    // In that case, we should pad the array with empty slots
    const emptySlotCount = 6 - (result.length % 6);
    return result.concat(new Array(emptySlotCount).fill(EMPTY_SLOT));
  };

  const convertToShips = (nowHps, maxHps) => {
    const { createShip } = KC3BattlePrediction.fleets;

    if (nowHps.length !== maxHps.length) {
      throw new Error(`Length of nowhps (${nowHps.length}) and maxhps (${maxHps.length}) do not match`);
    }

    return nowHps.map((currentHp, index) => createShip(currentHp, maxHps[index]));
  };

  const isFleetNotEmpty = ships => ships.some(ship => ship !== KC3BattlePrediction.EMPTY_SLOT);
  const splitSides = (ships) => {
    if (ships.length !== 6 && ships.length !== 12) {
      throw new Error(`Expected 6 or 12 ships, but got ${ships.length}`);
    }

    const player = ships.slice(0, 6);
    const enemy = ships.slice(6, 12);

    return {
      player: isFleetNotEmpty(player) ? player : [],
      enemy,
    };
  };

  /* ---------------------[ DAMECONS ]--------------------- */

  const addDamecons = (role, damecons, ships) => {
    const { getDamecons, installDamecon } = KC3BattlePrediction.fleets;

    const dameconCodes = getDamecons(role, damecons);

    return ships.map((ship, index) => installDamecon(dameconCodes[index], ship));
  };

  const getDamecons = (role, damecons) => {
    const { Role } = KC3BattlePrediction;

    switch (role) {
      case Role.MAIN_FLEET:
        return damecons.slice(0, 6);
      case Role.ESCORT_FLEET:
        return damecons.slice(6, 12);
      default:
        throw new Error(`Bad role: ${role}`);
    }
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    getInitialState,
    // Internal
    getFleetShips,
    normalizeHps,
    convertToShips,
    splitSides,

    addDamecons,
    getDamecons,
  });
}());
