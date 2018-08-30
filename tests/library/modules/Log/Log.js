QUnit.module('modules > Log', function () {
  QUnit.module('stringifyRestParams', {
    beforeEach() { this.subject = KC3Log.stringifyRestParams; },
  }, function () {
    QUnit.test('use stringify for objects', function (assert) {
      const obj = { test: 1 };

      const result = this.subject([obj]);

      assert.equal(result, JSON.stringify(obj));
    });

    QUnit.test('convert params to string', function (assert) {
      const string = 'test';
      const num = 1;

      const result = this.subject([string, num]);

      assert.deepEqual(result, ['test', '1']);
    });
  });

  QUnit.module('normalizeMessage', {
    beforeEach() {
      this.subject = KC3Log.normalizeMessage;
    },
  }, function () {
    QUnit.test('error as input', function (assert) {
      const error = new Error('message');

      const result = this.subject(error);

      assert.equal(result, 'message');
    });

    QUnit.test('string as input', function (assert) {
      const result = this.subject('message');

      assert.equal(result, 'message');
    });

    QUnit.test('object as input', function (assert) {
      const message = { test: 1 };

      const result = this.subject(message);

      assert.equal(result, JSON.stringify(message));
    });

    QUnit.test('other input', function (assert) {
      assert.equal(this.subject(1), '1');
    });
  });

  QUnit.module('isErrorLog', {
    beforeEach() { this.subject = KC3Log.isErrorLog; },
  }, function () {
    QUnit.test('logLevel === error log', function (assert) {
      assert.equal(this.subject('error'), true);
      assert.equal(this.subject('warn'), true);
    });

    QUnit.test('logLevel !== error log', function (assert) {
      assert.equal(this.subject('info'), false);
      assert.equal(this.subject('log'), false);
    });
  });

  QUnit.module('lookupErrorParam', {
    beforeEach() { this.subject = KC3Log.lookupErrorParam; },
  }, function () {
    QUnit.test('return first error obj found', function (assert) {
      const e1 = new Error();
      const e2 = new Error();

      const result = this.subject(['error', e1, e2]);

      assert.equal(result, e1);
    });

    QUnit.test('no error obj in params', function (assert) {
      const result = this.subject(['msg', { data: 'test' }, { stack: 'blah' }]);

      assert.notOk(result);
    });
  });
});
