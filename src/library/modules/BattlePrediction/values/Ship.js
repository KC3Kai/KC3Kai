(function () {
  const Ship = {};
  const { EMPTY_SLOT } = KC3BattlePrediction;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Ship.createShip = (hp, maxHp) => ({ hp, maxHp, damageDealt: 0 });

  Ship.installDamecon = (ship, damecon = 0) => Object.assign({}, ship, { damecon });

  Ship.dealDamage = damage => ship =>
    Object.assign({}, ship, { damageDealt: ship.damageDealt + damage });

  Ship.takeDamage = damage => ship => {
    const { tryDamecon } = KC3BattlePrediction.fleets.ship;

    const result = Object.assign({}, ship, { hp: ship.hp - damage });

    return result.hp <= 0 ? tryDamecon(result) : result;
  };

  Ship.formatShip = ship => {
    if (ship === EMPTY_SLOT) { return EMPTY_SLOT; }

    return {
      hp: ship.hp,
      dameConConsumed: ship.dameConConsumed || false,
      sunk: ship.hp <= 0,
      damageDealt: ship.damageDealt,
    };
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Ship.tryDamecon = (ship) => {
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

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets.ship, Ship);
}());
