(function () {
  // Based on: https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/kcmemo.md#%E6%88%A6%E9%97%98%E5%8B%9D%E5%88%A9%E5%88%A4%E5%AE%9A
  const predict = (initialFleets, resultFleets) => {
    const {
      getSunkCount,
      getShipCount,
      getDamageGauge,
      battle: { isPlayerNoDamage, isEnemyFlagshipSunk, isPlayerFlagshipTaiha },
    } = KC3BattlePrediction.rank;

    const sunk = getSunkCount(resultFleets);
    const ships = getShipCount(resultFleets);
    if (sunk.player === 0) {
      if (sunk.enemy === ships.enemy) {
        return isPlayerNoDamage(initialFleets, resultFleets) ? 'SS' : 'S';
      }
      if (ships.enemy > 1 && sunk.enemy >= Math.floor(ships.enemy * 0.7)) {
        return 'A';
      }
    }

    if (isEnemyFlagshipSunk(resultFleets) && sunk.player < sunk.enemy) {
      return 'B';
    }

    if (ships.player === 1 && isPlayerFlagshipTaiha(initialFleets, resultFleets)) {
      return 'D';
    }

    const damageTaken = getDamageGauge(initialFleets, resultFleets);
    if (damageTaken.enemy > 2.5 * damageTaken.player) {
      return 'B';
    }

    if (damageTaken.enemy > 0.9 * damageTaken.player) {
      return 'C';
    }

    if (sunk.player > 0 && ships.player - sunk.player === 1) {
      return 'E';
    }

    return 'D';
  };

  const isPlayerNoDamage = (initialFleets, resultFleets) => {
    const { getHpTotal } = KC3BattlePrediction.rank;

    const { player: startHp } = getHpTotal(initialFleets);
    const { player: endHp } = getHpTotal(resultFleets);

    return endHp >= startHp;
  };

  const isEnemyFlagshipSunk = (resultFleets) => {
    return resultFleets.enemyMain[0].sunk;
  };

  const isPlayerFlagshipTaiha = (initialFleets, resultFleets) => {
    const { maxHp } = initialFleets.playerMain[0];
    const { hp } = resultFleets.playerMain[0];
    return hp / maxHp <= 0.25;
  };

  Object.assign(KC3BattlePrediction.rank.battle, {
    // Public
    predict,
    // Internal
    isPlayerNoDamage,
    isEnemyFlagshipSunk,
    isPlayerFlagshipTaiha,
  });
}());
