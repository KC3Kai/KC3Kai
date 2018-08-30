(function () {
  const createAttack = ({ damage, defender, attacker }) => {
    const { normalizeDamage, createTarget } = KC3BattlePrediction.battle;

    return Object.freeze({
      damage: normalizeDamage(damage),
      defender: createTarget(defender),
      attacker: attacker && createTarget(attacker),
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
