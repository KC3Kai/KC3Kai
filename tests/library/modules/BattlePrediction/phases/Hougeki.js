QUnit.module('modules > BattlePrediction > phases > Hougeki', function () {
  const { Side, Role } = KC3BattlePrediction;
  const Hougeki = KC3BattlePrediction.battle.phases.hougeki;

  // at_e_flag values
  const PLAYER_ATTACK = 0;
  const ENEMY_ATTACK = 1;

  QUnit.module('parseAttackerIndex', {
    beforeEach() { this.subject = Hougeki.parseAttackerIndex; },
  }, function () {
    QUnit.test('player index', function (assert) {
      assert.deepEqual(this.subject(PLAYER_ATTACK, 5), { position: 5, side: Side.PLAYER });
    });

    QUnit.test('enemy index', function (assert) {
      assert.deepEqual(this.subject(ENEMY_ATTACK, 0), { position: 0, side: Side.ENEMY });
    });
  });

  QUnit.module('parseDefenderIndex', {
    beforeEach() { this.subject = Hougeki.parseDefenderIndex; },
  }, function () {
    QUnit.test('array elements not equal', function (assert) {
      const dfIndex = [10, 9];

      try {
        this.subject(PLAYER_ATTACK, dfIndex);
        assert.notOk(true, 'no exception');
      } catch (result) {
        assert.equal(result.message, 'Bad target index array');
        assert.equal(result.data.targetIndices, dfIndex);
      }
    });

    QUnit.test('player index', function (assert) {
      assert.deepEqual(this.subject(ENEMY_ATTACK, [5]), { side: Side.PLAYER, position: 5 });
    });

    QUnit.test('enemy index', function (assert) {
      assert.deepEqual(this.subject(PLAYER_ATTACK, [0, 0]), { side: Side.ENEMY, position: 0 });
    });
  });

  QUnit.module('parseDamage', {
    beforeEach() { this.subject = Hougeki.parseDamage; },
  }, function () {
    QUnit.test('single attack / cut-in', function (assert) {
      assert.equal(this.subject([121]), 121);
    });

    QUnit.test('double attack', function (assert) {
      assert.equal(this.subject([1, 2]), 3);
    });
  });

  QUnit.module('parseCombinedAttacker', {
    beforeEach() { this.subject = Hougeki.parseCombinedAttacker; },
  }, function () {
    QUnit.test('player main fleet', function (assert) {
      assert.deepEqual(this.subject(0, 5),
        { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 5 });
    });

    QUnit.test('player escort fleet', function (assert) {
      assert.deepEqual(this.subject(0, 6),
        { side: Side.PLAYER, role: Role.ESCORT_FLEET, position: 0 });
    });

    QUnit.test('enemy main fleet', function (assert) {
      assert.deepEqual(this.subject(1, 5),
        { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 5 });
    });

    QUnit.test('enemy escort fleet', function (assert) {
      assert.deepEqual(this.subject(1, 6),
        { side: Side.ENEMY, role: Role.ESCORT_FLEET, position: 0 });
    });

    QUnit.test('bad at_eflag', function (assert) {
      const error = new Error('Bad api_at_eflag');

      assert.throws(() => this.subject(2), error);
      assert.throws(() => this.subject(-1), error);
      assert.throws(() => this.subject(0.3), error);
      assert.throws(() => this.subject('blah'), error);
    });
  });

  QUnit.module('parseCombinedDefender', {
    beforeEach() { this.subject = Hougeki.parseCombinedDefender; },
  }, function () {
    QUnit.test('bad at_eflag', function (assert) {
      const error = new Error('Bad api_at_eflag');

      assert.throws(() => this.subject(2), error);
      assert.throws(() => this.subject(-1), error);
      assert.throws(() => this.subject(0.3), error);
      assert.throws(() => this.subject('blah'), error);
    });

    QUnit.test('array elements not equal', function (assert) {
      const defenderIndices = [1, 2];

      try {
        this.subject(0, defenderIndices);
        assert.notOk(true, 'no exception');
      } catch (result) {
        assert.equal(result.message, 'Bad target index array');
        assert.equal(result.data.api_df_list, defenderIndices);
      }
    });

    QUnit.test('player main fleet', function (assert) {
      assert.deepEqual(this.subject(1, [5, 5]),
        { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 5 });
    });

    QUnit.test('player escort fleet', function (assert) {
      assert.deepEqual(this.subject(1, [6]),
        { side: Side.PLAYER, role: Role.ESCORT_FLEET, position: 0 });
    });

    QUnit.test('enemy main fleet', function (assert) {
      assert.deepEqual(this.subject(0, [5]),
        { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 5 });
    });

    QUnit.test('enemy escort fleet', function (assert) {
      assert.deepEqual(this.subject(0, [6, 6]),
        { side: Side.ENEMY, role: Role.ESCORT_FLEET, position: 0 });
    });
  });
});
