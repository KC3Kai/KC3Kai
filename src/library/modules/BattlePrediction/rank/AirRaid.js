(function () {
  const predict = (initial, result) => {
    const {
      getDamageGauge,
      battle: { isPlayerNoDamage },
    } = KC3BattlePrediction.rank;

    if (isPlayerNoDamage(initial, result)) { return 'SS'; }

    const { player: damageGauge } = getDamageGauge(initial, result);

    if (damageGauge < 10) { return 'A'; }
    if (damageGauge < 20) { return 'B'; }
    if (damageGauge < 50) { return 'C'; }
    if (damageGauge < 80) { return 'D'; }
    return 'E';
  };

  Object.assign(KC3BattlePrediction.rank.airRaid, { predict });
}());
