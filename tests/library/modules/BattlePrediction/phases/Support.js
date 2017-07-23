QUnit.module('modules > BattlePrediction > phases > Support', function () {
  const { Side, Role, battle: { createAttack } } = KC3BattlePrediction;
  const Support = KC3BattlePrediction.battle.phases.support;

  QUnit.module('parseDamageArray', {
    beforeEach() {
      this.subject = Support.parseDamageArray;
    },
  }, function () {
    QUnit.test('convert damage array to Attacks', function (assert) {
      const role = Role.MAIN_FLEET;
      const damageArray = [0, 29, 0, 0, 101, 0];

      const result = this.subject(role, damageArray);

      assert.deepEqual(result, [
        createAttack(Side.ENEMY, role, 1, 29),
        createAttack(Side.ENEMY, role, 4, 101),
      ]);
    });
  });
});
