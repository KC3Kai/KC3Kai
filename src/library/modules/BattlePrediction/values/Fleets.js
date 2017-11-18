(function () {
  // might be 7 since 2017-11-17
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

  const simulateAttack = (fleets, { attacker, defender, damage }) => {
    const { bind } = KC3BattlePrediction;
    const { cloneFleets, updateShip, dealDamage, takeDamage } = KC3BattlePrediction.fleets;

    // NB: cloning is necessary to preserve function purity
    let result = cloneFleets(fleets);
    result = updateShip(defender, bind(takeDamage, damage), result);
    if (attacker) {
      result = updateShip(attacker, bind(dealDamage, damage), result);
    }
    return result;
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

  const updateShip = (target, update, fleets) => {
    const { extendError, fleets: { isTargetInFleets } } = KC3BattlePrediction;

    if (!isTargetInFleets(target, fleets)) {
      throw extendError(new Error('Bad target'), { target, fleets });
    }

    const { side, role, position } = target;
    // Modifying the param is fine, since the fleets is cloned in the caller context
    fleets[side][role][position] = update(fleets[side][role][position]);
    return fleets;
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
    return new Array(Math.max(Object.keys(fleet).length, FLEET_SIZE)).fill(EMPTY_SLOT)
      .map((empty, index) => fleet[index] || empty);
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
    simulateAttack,
    formatFleets,
    // Internal
    convertToFleet,

    isTargetInFleets,
    updateShip,
    cloneFleets,

    getFleetOutput,
    convertToArray,
    trimEmptySlots,
  });
}());
