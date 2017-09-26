QUnit.module('modules > BattlePrediction > Attack', function () {
  QUnit.module('normalizeDamage', {
    beforeEach() { this.subject = KC3BattlePrediction.battle.normalizeDamage; },
  }, function () {
    QUnit.test('remove flagship protection indicator', function (assert) {
      assert.equal(this.subject(1.1), 1);
    });
  });
});
