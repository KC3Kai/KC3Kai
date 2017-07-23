QUnit.module('modules > BattlePrediction > phases > Raigeki', function () {
  const Raigeki = KC3BattlePrediction.battle.phases.raigeki;

  QUnit.module('normalizeDamageArray', {
    beforeEach() { this.subject = Raigeki.normalizeDamageArray; },
  }, function () {
    QUnit.test('no damage array', function (assert) {
      assert.deepEqual(this.subject(undefined), []);
    });

    QUnit.test('convert to 0-based index', function (assert) {
      assert.deepEqual(this.subject([-1, 0, 0, 44, 122, 0, 0]), [0, 0, 44, 122, 0, 0]);
    });
  });

  QUnit.module('splitCombinedDamageArray', {
    beforeEach() { this.subject = Raigeki.splitCombinedDamageArray; },
  }, function () {
    QUnit.test('bad array length', function (assert) {
      const array = new Array(5);

      assert.throws(() => this.subject(array),
        new Error('Expected array of length 12, but was 5'));
    });

    QUnit.test('split into main and escort fleet arrays', function (assert) {
      const array = [0, 4, 0, 0, 0, 0, 0, 178, 0, 0, 0, 0];

      const result = this.subject(array);

      assert.deepEqual(result, {
        main: [0, 4, 0, 0, 0, 0],
        escort: [0, 178, 0, 0, 0, 0],
      });
    });
  });

  QUnit.module('parseDamageArray', {
    beforeEach() { this.subject = Raigeki.parseDamageArray; },
  }, function () {
    const { Side, Role } = KC3BattlePrediction;
    const { createAttack } = KC3BattlePrediction.battle;

    QUnit.test('empty damage array', function (assert) {
      assert.deepEqual(this.subject('side', 'role', []), []);
    });

    QUnit.test('convert to Attacks', function (assert) {
      const side = Side.PLAYER;
      const role = Role.MAIN_FLEET;
      const json = [41, 0, 0, 0, 121, 131];

      const result = this.subject(side, role, json);

      assert.deepEqual(result, [
        createAttack(side, role, 0, 41),
        createAttack(side, role, 4, 121),
        createAttack(side, role, 5, 131),
      ]);
    });
  });
});
