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

  QUnit.module('pipe', {
    beforeEach() { this.subject = KC3BattlePrediction.pipe; },
  }, function () {
    QUnit.test('compose functions', function (assert) {
      const f = n => n + 1;
      const g = n => n * 2;
      const h = n => n - 3;

      const result = this.subject(f, g, h)(20);

      assert.equal(result, 39);
    });
  });

  QUnit.module('map', {
    beforeEach() { this.subject = KC3BattlePrediction.map; },
  }, function () {
    QUnit.test('curried map', function (assert) {
      const f = n => n + 1;
      const data = [1, 2, 3];

      const result = this.subject(f)(data);

      assert.deepEqual(result, [2, 3, 4]);
    });

    QUnit.test('works on objects', function (assert) {
      const f = (value, key, index) => `${key}@${index}: ${value}`;
      const data = { a: 1, b: 2, c: 3 };

      const result = this.subject(f)(data);

      assert.deepEqual(result, {
        a: 'a@0: 1',
        b: 'b@1: 2',
        c: 'c@2: 3',
      });
    });
  });

  QUnit.module('filter', {
    beforeEach() { this.subject = KC3BattlePrediction.filter; },
  }, function () {
    QUnit.test('curried filter()', function (assert) {
      const f = n => n % 2 === 0;
      const data = [1, 2, 3];

      const result = this.subject(f)(data);

      assert.deepEqual(result, [2]);
    });
  });

  QUnit.module('reduce', {
    beforeEach() { this.subject = KC3BattlePrediction.reduce; },
  }, function () {
    QUnit.test('curried reduce()', function (assert) {
      const subtract = (a, b) => a - b;

      const result = this.subject(subtract, 0)([1, 2, 3, 4]);

      assert.equal(result, -10);
    });

    QUnit.test('omitting initialValue uses 1st array element instead', function (assert) {
      const add = (a, b) => a + b;

      const result = this.subject(add)([1, 2, 3, 4]);

      assert.equal(result, 10);
    });
  });

  QUnit.module('converge', {
    beforeEach() { this.subject = KC3BattlePrediction.converge; },
  }, function () {
    QUnit.test('passes result of applying argument(s) to array of funcs into a final func', function (assert) {
      const multiply = (a, b) => a * b;
      const add1 = a => a + 1;
      const add3 = a => a + 3;

      // (2 + 1) * (a + 3)
      const result = this.subject(multiply, [add1, add3])(2);
      
      assert.equal(result, 15);
    });
  });

  QUnit.module('juxt', {
    beforeEach() { this.subject = KC3BattlePrediction.juxt; },
  }, function () {
    QUnit.test('apply functions to values', function (assert) {
      const getRange = this.subject([Math.max, Math.min]);

      assert.deepEqual(getRange(3, 4, 9, -3), [9, -3]);
    });
  });

  QUnit.module('flatten', {
    beforeEach() { this.subject = KC3BattlePrediction.flatten; },
  }, function () {
    QUnit.test('convert nested arrays into single level array', function (assert) {
      assert.deepEqual(this.subject([1, [2, [3], 4], 5]), [1, 2, 3, 4, 5]);
    });
  });

  QUnit.module('over', {
    beforeEach() { this.subject = KC3BattlePrediction.over; },
  }, function () {
    QUnit.test('immutably set value at path', function (assert) {
      const obj = { a: [{ b: 3 }, { c: 4 }, { d: 5 }] };
      const f = a => a * 10;

      const result = this.subject('a.1.c', f)(obj);

      assert.deepEqual(result, { a: [{ b: 3 }, { c: 40 }, { d: 5 }] });
      assert.deepEqual(obj, { a: [{ b: 3 }, { c: 4 }, { d: 5 }] });
    });

    QUnit.test('bad path', function (assert) {
      const obj = { a: { b: 1 } };
      const f = x => x;

      assert.throws(() => this.subject('a.c.d', f)(obj), 'Bad path: a.c.d');
    });
  });

  QUnit.module('concat', {
    beforeEach() { this.subject = KC3BattlePrediction.concat; },
  }, function () {
    QUnit.test('combines elements of two arrays', function (assert) {
      assert.deepEqual(this.subject([1, 2], 3, [], [4], [[5], [6]]), [1, 2, 3, 4, [5], [6]]);
    });
  });

  QUnit.module('zipWith', {
    beforeEach() { this.subject = KC3BattlePrediction.zipWith; },
  }, function () {
    QUnit.test('group elements of input arrays', function (assert) {
      const arrays = [[1, 2], [10, 20], [100, 200]];
      const iteratee = (a, b, c) => a + b + c;

      const result = this.subject(iteratee, ...arrays);

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
