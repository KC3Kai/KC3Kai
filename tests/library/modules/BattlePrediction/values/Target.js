QUnit.module('modules > BattlePrediction > Target', function () {
  QUnit.module('validatePosition', {
    beforeEach() { this.subject = KC3BattlePrediction.battle.validatePosition; },
  }, function () {
    QUnit.test('should be in range [0,7)', function (assert) {
      assert.equal(this.subject(-1), false);
      assert.equal(this.subject(0), true);
      assert.equal(this.subject(1), true);
      assert.equal(this.subject(2), true);
      assert.equal(this.subject(3), true);
      assert.equal(this.subject(4), true);
      assert.equal(this.subject(5), true);
      assert.equal(this.subject(6), true);
      assert.equal(this.subject(7), false);
    });

    QUnit.test('should be integer', function (assert) {
      assert.equal(this.subject(1.1), false);
    });
  });
});
