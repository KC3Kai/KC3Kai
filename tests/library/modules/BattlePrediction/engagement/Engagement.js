QUnit.module('modules > BattlePrediction > engagement', function () {
  const Engagement = KC3BattlePrediction.battle.engagement;

  QUnit.module('getPhaseParsers', {
    beforeEach() { this.subject = Engagement.getPhaseParsers; },
  }, function () {
    QUnit.test('return parsers in order', function (assert) {
      const instance = { b: 1, a: 3, c: 2 };

      const result = this.subject(instance);

      assert.deepEqual(result, [1, 3, 2]);
    });
  });
});
