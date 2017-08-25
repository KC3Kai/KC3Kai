(function () {
  const createAttack = (side, role, position, damage) => {
    const { createTarget, normalizeDamage } = KC3BattlePrediction.battle;

    return Object.freeze({
      target: createTarget(side, role, position),
      damage: normalizeDamage(damage),
    });
  };

  // KCSAPI adds +0.1 to damage values to indicate flagship protection activated
  const normalizeDamage = damage => Math.floor(damage);

  Object.assign(window.KC3BattlePrediction.battle, {
    // Public
    createAttack,
    // Internal
    normalizeDamage,
  });
}());
