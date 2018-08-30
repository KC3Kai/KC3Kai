QUnit.module('modules > QuestSync', function () {
  QUnit.module('checkWasSyncEnabled', {
    beforeEach() { this.subject = KC3QuestSync.checkWasSyncEnabled; },
  }, function () {
    QUnit.test('bad key', function (assert) {
      assert.equal(this.subject(), false);
      assert.equal(this.subject({ key: 'blah' }), false);
    });

    QUnit.test('previously enabled', function (assert) {
      const oldValue = JSON.stringify({ chromeSyncQuests: true });

      const result = this.subject({ key: 'config', oldValue });

      assert.equal(result, false);
    });

    QUnit.test('not enabled in new state', function (assert) {
      const newValue = JSON.stringify({ chromeSyncQuests: false });

      const result = this.subject({ key: 'config', oldValue: JSON.stringify({ chromeSyncQuests: false }), newValue });

      assert.equal(result, false);
    });

    QUnit.test('is sync enable', function (assert) {
      const event = {
        key: 'config',
        oldValue: JSON.stringify({ chromeSyncQuests: false }),
        newValue: JSON.stringify({ chromeSyncQuests: true }),
      };

      const result = this.subject(event);

      assert.equal(result, true);
    });

    QUnit.test('bad json', function (assert) {
      assert.throws(() => { this.subject({ key: 'config', oldValue: 'blah', newValue: 'null' }); });
    });
  });

  QUnit.module('validateSyncData', {
    beforeEach() { this.subject = KC3QuestSync.validateSyncData; },
  }, function () {
    QUnit.test('fail on no input', function (assert) {
      const result = this.subject();

      assert.notOk(result);
    });

    QUnit.test('fail on bad sync struct version', function (assert) {
      KC3QuestSync.syncStructVersion = 5;

      assert.throws(() => {
        this.subject({ syncStructVersion: 4 });
      }, /Bad syncStructVersion: 4/);
    });

    QUnit.test('fail if no changes', function (assert) {
      const quests = { test: 'hi' };
      localStorage.quests = JSON.stringify(quests);
      KC3QuestSync.syncStructVersion = 1;

      const result = this.subject({ syncStructVersion: 1, quests: JSON.stringify(quests) });

      assert.notOk(result);
    });

    QUnit.test('succeed otherwise', function (assert) {
      const quests = { test: 'hi' };
      localStorage.quests = JSON.stringify({ test: 'hello' });
      KC3QuestSync.syncStructVersion = 1;

      const result = this.subject({ syncStructVersion: 1, quests: JSON.stringify(quests) });

      assert.ok(result);
    });
  });
});
