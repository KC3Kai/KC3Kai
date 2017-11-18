QUnit.module('modules > BattlePrediction > phases > Raigeki', function () {
  const Raigeki = KC3BattlePrediction.battle.phases.raigeki;

  QUnit.module('removeEmptyAttacks', {
    beforeEach() {
      this.subject = Raigeki.removeEmptyAttacks;
    },
  }, function () {
    QUnit.test('remove empty attacks', function (assert) {
      const attacksJson = [
        { defender: { position: 0 } },
        { defender: { position: -1 } },
        { defender: { position: 5 } },
      ];

      const result = this.subject(attacksJson);

      assert.deepEqual(result, [attacksJson[0], attacksJson[2]]);
    });
  });

  QUnit.module('parseJson', {
    beforeEach() {
      this.subject = Raigeki.parseJson;
    },
  }, function () {
    QUnit.test('player attack', function (assert) {
      const json = { api_frai: 3, api_fydam: 126 };

      const result = this.subject(json, 5);

      assert.deepEqual(result, {
        attacker: { position: 5 },
        defender: { position: 3 },
        damage: 126,
      });
    });

    QUnit.test('enemy attack', function (assert) {
      const json = { api_erai: 5, api_eydam: 113 };

      const result = this.subject(json, 4);

      assert.deepEqual(result, {
        attacker: { position: 4 },
        defender: { position: 5 },
        damage: 113,
      });
    });

    QUnit.test('bad json', function (assert) {
      const json = { test: 'blah' };

      try {
        this.subject(json, 'index');
        assert.notOk(true, 'no exception');
      } catch (result) {
        assert.equal(result.message, 'Bad attack json');
        assert.equal(result.data.attackJson, json);
        assert.equal(result.data.index, 'index');
      }
    });
  });
});
