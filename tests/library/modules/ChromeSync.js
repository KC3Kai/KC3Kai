QUnit.module('modules > ChromeSync', function () {
  QUnit.module('findChunks', {
    beforeEach() { this.subject = KC3ChromeSync.findChunks; },
  }, function () {
    QUnit.test('extract relevant chunks and their indices', function (assert) {
      const storageData = { a_1_0: 'bad', a_0: '12', a_1: '43', b_0: 'blah' };

      const result = this.subject('a', storageData);

      assert.deepEqual(result, [
        { chunk: '12', index: 0 },
        { chunk: '43', index: 1 },
      ]);
    });
  });

  QUnit.module('sortChunks', {
    beforeEach() { this.subject = KC3ChromeSync.sortChunks; },
  }, function () {
    QUnit.test('sort chunks by index', function (assert) {
      const chunks = [
        { chunk: 'second', index: 1 },
        { chunk: 'first', index: 0 },
      ];

      const result = this.subject(chunks);

      assert.deepEqual(result, [
        { chunk: 'first', index: 0 },
        { chunk: 'second', index: 1 },
      ]);
    });
  });

  QUnit.module('combineChunks', {
    beforeEach() { this.subject = KC3ChromeSync.combineChunks; },
  }, function () {
    QUnit.test('concat string chunks', function (assert) {
      const chunks = [{ chunk: '123' }, { chunk: '45' }];

      const result = this.subject(chunks);

      assert.equal(result, '12345');
    });

    QUnit.test('ignore null chunks', function (assert) {
      const chunks = [{ chunk: '12' }, { chunk: '3' }, { chunk: null }];

      const result = this.subject(chunks);

      assert.equal(result, '123');
    });
  });

  QUnit.module('validateValue', {
    beforeEach() { this.subject = KC3ChromeSync.validateValue.bind(KC3ChromeSync); },
  }, function () {
    QUnit.test('not a string', function (assert) {
      assert.throws(() => this.subject({}), new Error('value is not a string'));
    });

    QUnit.test('too large', function (assert) {
      chrome.storage.sync = { QUOTA_BYTES: 3 };

      assert.throws(() => this.subject('12345'), new Error("value's size (5) exceeds maximum quota (3)"));
    });
  });

  QUnit.module('generateChunk', {
    beforeEach() {
      chrome.storage.sync = { QUOTA_BYTES_PER_ITEM: 10 };

      this.subject = KC3ChromeSync.generateChunk.bind(KC3ChromeSync);
    },
  }, function () {
    // From the docs: The maximum size [...is] the JSON stringification of its value plus its key length.

    QUnit.test('chunk size limit', function (assert) {
      const key = 'key_0';
      const value = '{"test":12345}';

      const result = this.subject(key, value);

      assert.deepEqual(result, {
        chunk: '{"',
        newValue: 'test":12345}',
      });
    });
  });

  QUnit.module('getOldChunkKeys', {
    beforeEach() { this.subject = KC3ChromeSync.getOldChunkKeys; },
  }, function () {
    QUnit.test('retrieve chunk keys associated with the specified key', function (assert) {
      const storageData = { a_1_0: 'test', a_0: '1', a_1: '3', b_0: '2' };

      const result = this.subject('a', storageData);

      assert.deepEqual(result, ['a_0', 'a_1']);
    });
  });

  QUnit.module('zipKeysToObject', {
    beforeEach() { this.subject = KC3ChromeSync.zipKeysToObject; },
  }, function () {
    QUnit.test('set values to null', function (assert) {
      const keys = ['a_0', 'a_1'];

      const result = this.subject(keys);

      assert.deepEqual(result, {
        a_0: null,
        a_1: null,
      });
    });
  });

  QUnit.module('generateStorageObject', {
    beforeEach() { this.subject = KC3ChromeSync.generateStorageObject; },
  }, function () {
    QUnit.test('combine properties, preferring new', function (assert) {
      const oldChunks = { key_1: null, key_2: null };
      const newChunks = { key_0: 'chunk 0', key_1: 'chunk 1' };

      const result = this.subject(oldChunks, newChunks);

      assert.deepEqual(result, {
        key_0: 'chunk 0',
        key_1: 'chunk 1',
        key_2: null,
      });
    });
  });
});
