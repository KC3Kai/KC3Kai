QUnit.module('modules > BattlePrediction', function () {
  QUnit.module('validateEnum', {
    beforeEach() { this.subject = KC3BattlePrediction.validateEnum; },
  }, function () {
    QUnit.test('check specified value is a value in provided enum object', function (assert) {
      const enumObj = { key: 'value' };

      assert.ok(this.subject(enumObj, 'value'));
      assert.notOk(this.subject(enumObj, 'bad value'));
    });
  });

  QUnit.module('normalizeArrayIndexing', {
    beforeEach() { this.subject = KC3BattlePrediction.normalizeArrayIndexing; },
  }, function () {
    QUnit.test('convert from 1-based to 0-based', function (assert) {
      const array = [-1, 6, 5, 4, 3, 2, 1];

      const result = this.subject(array);

      assert.deepEqual(result, [6, 5, 4, 3, 2, 1]);
    });

    QUnit.test('return 0-based array as-is', function (assert) {
      const array = [6, 5, 4, 3, 2, 1];

      const result = this.subject(array);

      assert.deepEqual(result, array);
    });
  });

  QUnit.module('zipWith', {
    beforeEach() { this.subject = KC3BattlePrediction.zipWith; },
  }, function () {
    QUnit.test('group elements of input arrays', function (assert) {
      const arrays = [[1, 2], [10, 20], [100, 200]];
      const iteratee = (a, b, c) => a + b + c;

      const result = this.subject(...arrays, iteratee);

      assert.deepEqual(result, [111, 222]);
    });

    QUnit.test('no iteratee specified', function (assert) {
      const arrays = [['a', 'b'], [1, 2], [true, false]];

      const result = this.subject(...arrays);

      assert.deepEqual(result, [['a', 1, true], ['b', 2, false]]);
    });

    QUnit.test('uneven input array lengths', function (assert) {
      const arrays = [['a'], [1, 2]];

      const result = this.subject(...arrays);

      assert.deepEqual(result, [['a', 1], [undefined, 2]]);
    });
  });
});
