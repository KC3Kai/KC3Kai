QUnit.module('modules > BattlePrediction > phases > Kouku', function () {
  const Kouku = KC3BattlePrediction.battle.phases.kouku;
  const { Side } = KC3BattlePrediction;

  QUnit.module('extractDamageArray', {
    beforeEach() { this.subject = Kouku.extractDamageArray; },
  }, function () {
    QUnit.test('undefined fleet data', function (assert) {
      const json = {};

      const result = this.subject('blah', 'blah')(json);

      assert.deepEqual(result, []);
    });

    QUnit.test('undefined damage array', function (assert) {
      const json = { api_stage3: {} };

      const result = this.subject('api_stage3', 'blah')(json);

      assert.deepEqual(result, []);
    });

    QUnit.test('success', function (assert) {
      const json = { api_stage3: { api_fdam: [1, 2, 3] } };

      const result = this.subject('api_stage3', 'api_fdam')(json);

      assert.deepEqual(result, [1, 2, 3]);
    });
  });

  QUnit.module('padDamageArray', {
    beforeEach() { this.subject = Kouku.padDamageArray; },
  }, function () {
    QUnit.test('array below minimum size', function (assert) {
      const json = [1, 2];

      const result = this.subject(json);

      assert.deepEqual(result, [1, 2, 0, 0, 0, 0]);
    });

    QUnit.test('array at maximum size', function (assert) {
      const json = [1, 2, 3, 4, 5, 6];

      const result = this.subject(json);

      assert.deepEqual(result, [1, 2, 3, 4, 5, 6]);
    });

    QUnit.test('array over max size', function (assert) {
      const json = [1, 2, 3, 4, 5, 6, 7];

      const result = this.subject(json);

      assert.deepEqual(result, [1, 2, 3, 4, 5, 6, 7]);
    });
  });

  QUnit.module('parsePlayerJson', {
    beforeEach() { this.subject = Kouku.parsePlayerJson; },
  }, function () {
    QUnit.test('format json', function (assert) {
      const json = {
        api_fdam: [13, 31, 15],
      };

      const result = this.subject(json);

      assert.deepEqual(result, [
        { damage: 13, defender: { side: Side.PLAYER, position: 0 } },
        { damage: 31, defender: { side: Side.PLAYER, position: 1 } },
        { damage: 15, defender: { side: Side.PLAYER, position: 2 } },
      ]);
    });
  });

  QUnit.module('parseEnemyJson', {
    beforeEach() { this.subject = Kouku.parseEnemyJson; },
  }, function () {
    QUnit.test('format damage to enemy', function (assert) {
      const json = { api_edam: [54, 0, 7] };

      const result = this.subject(json);

      assert.deepEqual(result, [
        { damage: 54, defender: { side: Side.ENEMY, position: 0 } },
        { damage: 0, defender: { side: Side.ENEMY, position: 1 } },
        { damage: 7, defender: { side: Side.ENEMY, position: 2 } },
      ]);
    });
  });
});
