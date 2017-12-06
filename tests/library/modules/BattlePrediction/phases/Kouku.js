QUnit.module('modules > BattlePrediction > phases > Kouku', function () {
  const Kouku = KC3BattlePrediction.battle.phases.kouku;
  const { Side } = KC3BattlePrediction;

  QUnit.module('mergeFleetDamageArrays', {
    beforeEach() { this.subject = Kouku.mergeFleetDamageArrays; },
  }, function () {
    QUnit.test('no bombing', function (assert) {
      const json = {
        api_stage3: null,
        api_stage3_combined: null,
      };

      const result = this.subject(json);

      assert.deepEqual(result, { api_fdam: [], api_edam: [] });
    });

    QUnit.test('single vs single', function (assert) {
      const json = {
        api_stage3: { api_fdam: [1, 2, 3], api_edam: [4, 5, 6] },
      };

      const result = this.subject(json);

      assert.deepEqual(result, { api_fdam: [1, 2, 3], api_edam: [4, 5, 6] });
    });

    QUnit.test('single vs combined', function (assert) {
      const json = {
        api_stage3: { api_fdam: [1, 2, 3], api_edam: [4, 5, 6] },
        api_stage3_combined: { api_fdam: null, api_edam: [7, 8, 9] },
      };

      const result = this.subject(json);

      assert.deepEqual(result, { api_fdam: [1, 2, 3], api_edam: [4, 5, 6, 7, 8, 9] });
    });

    QUnit.test('combined vs single', function (assert) {
      const json = {
        api_stage3: { api_fdam: [1, 2, 3], api_edam: [4, 5, 6] },
        api_stage3_combined: { api_fdam: [7, 8, 9], api_edam: null },
      };

      const result = this.subject(json);

      assert.deepEqual(result, { api_fdam: [1, 2, 3, 7, 8, 9], api_edam: [4, 5, 6] });
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
