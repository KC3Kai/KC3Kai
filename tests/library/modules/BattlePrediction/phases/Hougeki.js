QUnit.module('modules > BattlePrediction > phases > Hougeki', function () {
  const { Side } = KC3BattlePrediction;
  const Hougeki = KC3BattlePrediction.battle.phases.hougeki;

  QUnit.module('parseDamage', {
    beforeEach() { this.subject = Hougeki.parseDamage; },
  }, function () {
    QUnit.test('single attack/day battle cut-in', function (assert) {
      const json = { api_damage: [44] };

      assert.equal(this.subject(json), 44);
    });

    QUnit.test('double attack', function (assert) {
      const json = { api_damage: [100, 200] };

      assert.equal(this.subject(json), 300);
    });

    QUnit.test('night battle cut-in', function (assert) {
      const json = { api_damage: [191, -1, -1] };

      assert.equal(this.subject(json), 191);
    });
  });

  QUnit.module('parseAttacker', {
    beforeEach() { this.subject = Hougeki.parseAttacker; },
  }, function () {
    QUnit.test('player attack', function (assert) {
      const json = { api_at_eflag: 0, api_at_list: 5 };

      assert.deepEqual(this.subject(json), { side: Side.PLAYER, position: 5 });
    });

    QUnit.test('enemy attack', function (assert) {
      const json = { api_at_eflag: 1, api_at_list: 6 };

      assert.deepEqual(this.subject(json), { side: Side.ENEMY, position: 6 });
    });
  });

  QUnit.module('parseDefender', {
    beforeEach() { this.subject = Hougeki.parseDefender; },
  }, function () {
    QUnit.test('player single attack', function (assert) {
      const json = { api_at_eflag: 0, api_df_list: [5] };

      assert.deepEqual(this.subject(json), { side: Side.ENEMY, position: 5 });
    });

    QUnit.test('enemy double-attack', function (assert) {
      const json = { api_at_eflag: 1, api_df_list: [6, 6] };

      assert.deepEqual(this.subject(json), { side: Side.PLAYER, position: 6 });
    });

    QUnit.test('player cut-in', function (assert) {
      const json = { api_at_eflag: 0, api_df_list: [6, -1, -1] };

      assert.deepEqual(this.subject(json), { side: Side.ENEMY, position: 6 });
    });
  });
});
