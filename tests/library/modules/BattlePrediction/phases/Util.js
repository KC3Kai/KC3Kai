QUnit.module('modules > BattlePrediction > phases', function () {
  const Util = KC3BattlePrediction.battle.phases;

  QUnit.module('normalizeFieldArrays', {
    beforeEach() { this.subject = Util.normalizeFieldArrays; },
  }, function () {
    QUnit.test('embed field name in array elements', function (assert) {
      assert.deepEqual(this.subject('a', [1, 2, 3]), [{ a: 1 }, { a: 2 }, { a: 3 }]);
    });

    QUnit.test('handle null array', function (assert) {
      assert.deepEqual(this.subject('blah', null), []);
    });
  });

  QUnit.module('zipJson', {
    beforeEach() { this.subject = Util.zipJson; },
  }, function () {
    QUnit.test('convert to object', function (assert) {
      const inputs = [{ a: 1 }, { b: 'test' }, { c: true }];

      const result = this.subject(...inputs);

      assert.deepEqual(result, {
        a: 1,
        b: 'test',
        c: true,
      });
    });
  });
});
