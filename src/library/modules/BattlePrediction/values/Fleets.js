(function () {
  const FLEET_SIZE = 6;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const createFleets = (...fleets) => {
    const { convertToFleet } = KC3BattlePrediction.fleets;

    const [playerMain, enemyMain, playerEscort, enemyEscort] = fleets.map(convertToFleet);

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

  const formatFleets = (fleets) => {
    const { getFleetOutput } = KC3BattlePrediction.fleets;

    return {
      playerMain: getFleetOutput(fleets.player.main),
      playerEscort: getFleetOutput(fleets.player.escort),
      enemyMain: getFleetOutput(fleets.enemy.main),
      enemyEscort: getFleetOutput(fleets.enemy.escort),
    };
  };

  const isPlayerNoDamage = (initialFleets, resultFleets) => {
    const { extendError, fleets: { isNotDamaged } } = KC3BattlePrediction;

    const initialShips = initialFleets.playerMain.concat(initialFleets.playerEscort);
    const resultShips = resultFleets.playerMain.concat(resultFleets.playerEscort);

    if (initialShips.length !== resultShips.length) {
      throw extendError(new Error('Mismatched initial and result fleets'), { initialFleets, resultFleets });
    }

    return resultShips.every((resultShip, index) => isNotDamaged(initialShips[index], resultShip));
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ---------------------[ CREATION ]--------------------- */

  const convertToFleet = ships => ships.reduce((result, ship, index) => {
    return ship !== KC3BattlePrediction.EMPTY_SLOT
      ? Object.assign(result, { [index]: ship })
      : result;
  }, {});

  /* ----------------------[ UPDATE ]---------------------- */

  const isTargetInFleets = ({ side, role, position }, fleets) =>
    fleets[side] && fleets[side][role] && fleets[side][role][position];

  const applyUpdate = ({ side, role, position }, updateShip, fleets) => {
    const { cloneFleets } = KC3BattlePrediction.fleets;

    // NB: Cloning is necessary to preserve function purity
    const result = cloneFleets(fleets);
    result[side][role][position] = updateShip(fleets[side][role][position]);

    return result;
  };

  const cloneFleets = fleets => JSON.parse(JSON.stringify(fleets));

  /* ----------------------[ OUTPUT ]---------------------- */

  const getFleetOutput = (fleet) => {
    const { convertToArray, trimEmptySlots, formatShip } = KC3BattlePrediction.fleets;

    return trimEmptySlots(convertToArray(fleet).map(formatShip));
  };

  const convertToArray = (fleet) => {
    const { EMPTY_SLOT } = KC3BattlePrediction;
    // fill() is called because array elements must have assigned values or map will not work
    // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map#Description
    return new Array(FLEET_SIZE).fill(EMPTY_SLOT).map((empty, index) => fleet[index] || empty);
  };

  const findLastIndex = (pred, array) => {
    // reverse() is in-place, so we need a clone
    const reverse = array.slice(0).reverse();
    const reverseIndex = reverse.findIndex(pred);
    return reverseIndex === -1 ? -1 : array.length - reverseIndex;
  };
  const trimEmptySlots = (fleetArray) => {
    const { EMPTY_SLOT } = KC3BattlePrediction;

    const lastShipIndex = findLastIndex(ship => ship !== EMPTY_SLOT, fleetArray);
    return lastShipIndex !== -1
      ? fleetArray.slice(0, lastShipIndex)
      : [];
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    createFleets,
    update,
    formatFleets,
    isPlayerNoDamage,
    // Internal
    convertToFleet,

    isTargetInFleets,
    applyUpdate,
    cloneFleets,

    getFleetOutput,
    convertToArray,
    trimEmptySlots,
  });
}());
