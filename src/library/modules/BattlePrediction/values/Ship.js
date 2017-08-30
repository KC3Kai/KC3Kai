(function () {
  const EMPTY_SLOT = KC3BattlePrediction.EMPTY_SLOT;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const createShip = (hp, maxHp) => (hp !== -1 ? { hp, maxHp } : EMPTY_SLOT);

  const installDamecon = (damecon, ship) =>
    (ship !== EMPTY_SLOT ? Object.assign({}, ship, { damecon }) : ship);

  const damageShip = (damage, ship) => {
    const { dealDamage, tryDamecon } = KC3BattlePrediction.fleets;

    const result = dealDamage(damage, ship);

    return result.hp <= 0 ? tryDamecon(result) : result;
  };

  // If damecon increases HP beyond initial value, it counts as no damage
  const isNotDamaged = (initial, result) => initial.hp <= result.hp;

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const dealDamage = (damage, ship) => Object.assign({}, ship, { hp: ship.hp - damage });

  const tryDamecon = (ship) => {
    const { Damecon } = KC3BattlePrediction;

    switch (ship.damecon) {
      case Damecon.TEAM:
        return Object.assign({}, ship, {
          hp: Math.floor(ship.maxHp * 0.2),
          damecon: Damecon.NONE,
          dameConConsumed: true,
        });
      case Damecon.GODDESS:
        return Object.assign({}, ship, {
          hp: ship.maxHp,
          damecon: Damecon.NONE,
          dameConConsumed: true,
        });
      default:
        return ship;
    }
  };

  const formatShip = (ship) => {
    return ship !== EMPTY_SLOT
      ? { hp: ship.hp, dameConConsumed: ship.dameConConsumed || false, sunk: ship.hp <= 0 }
      : ship;
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    createShip,
    installDamecon,
    damageShip,
    isNotDamaged,
    // Internals
    dealDamage,
    tryDamecon,
    formatShip,
  });
}());
