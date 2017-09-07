(function () {
  const EMPTY_SLOT = KC3BattlePrediction.EMPTY_SLOT;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const createShip = (hp, maxHp) => (hp !== -1 ? { hp, maxHp, damageDealt: 0 } : EMPTY_SLOT);

  const installDamecon = (damecon, ship) =>
    (ship !== EMPTY_SLOT ? Object.assign({}, ship, { damecon }) : ship);

  const dealDamage = (damage, ship) =>
    Object.assign({}, ship, { damageDealt: ship.damageDealt + damage });

  const takeDamage = (damage, ship) => {
    const { tryDamecon } = KC3BattlePrediction.fleets;

    const result = Object.assign({}, ship, { hp: ship.hp - damage });

    return result.hp <= 0 ? tryDamecon(result) : result;
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

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
    if (ship === EMPTY_SLOT) { return EMPTY_SLOT; }

    return {
      hp: ship.hp,
      dameConConsumed: ship.dameConConsumed || false,
      sunk: ship.hp <= 0,
      damageDealt: ship.damageDealt,
    };
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    createShip,
    installDamecon,
    dealDamage,
    takeDamage,
    // Internals
    tryDamecon,
    formatShip,
  });
}());
