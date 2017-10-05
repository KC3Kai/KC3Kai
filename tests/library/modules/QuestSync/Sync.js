QUnit.module('modules > QuestSync', function () {
  QUnit.module('serialize', {
    beforeEach() { this.subject = KC3QuestSync.serialize; },
  }, function () {
    QUnit.test('stringify payload', function (assert) {
      const questData = {
        quests: '{"q172":{"id":172,"type":4,"status":1,"progress":0}}',
        syncStructVersion: 2,
        syncTimeStamp: 1000,
      };

      const result = this.subject(questData);

      assert.deepEqual(result, '{"quests":{"q172":{"id":172,"type":4,"status":1,"progress":0}},"syncStructVersion":2,"syncTimeStamp":1000}');
    });

    QUnit.test('empty quests', function (assert) {
      const questData = {
        quests: undefined,
        syncStructVersion: 1,
        syncTimeStamp: 300,
      };

      const result = this.subject(questData);

      assert.deepEqual(result, '{"quests":{},"syncStructVersion":1,"syncTimeStamp":300}');
    });
  });

  QUnit.module('deserialize', {
    beforeEach() { this.subject = KC3QuestSync.deserialize; },
  }, function () {
    QUnit.test('parse stringified payload', function (assert) {
      const json = '{"quests":{"q172":{"id":172,"type":4,"status":1,"progress":0}},"syncStructVersion":2,"syncTimeStamp":1000}';

      const result = this.subject(json);

      assert.deepEqual(result, {
        quests: '{"q172":{"id":172,"type":4,"status":1,"progress":0}}',
        syncStructVersion: 2,
        syncTimeStamp: 1000,
      });
    });

    QUnit.test('no stored data', function (assert) {
      assert.deepEqual(this.subject(''), undefined);
    });
  });
});
