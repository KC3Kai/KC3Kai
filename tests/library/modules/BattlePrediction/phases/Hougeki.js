QUnit.module('modules > BattlePrediction > phases > Hougeki', function () {
  const { Side, Role } = KC3BattlePrediction;
  const Hougeki = KC3BattlePrediction.battle.phases.hougeki;

  QUnit.module('normalizeTargetFormat', {
    beforeEach() { this.subject = Hougeki.normalizeTargetFormat; },
  }, function () {
    QUnit.test('bad index pair', function (assert) {
      const dfList = [[1, 2]];

      assert.throws(() => this.subject(dfList), new Error('Bad index: [1,2]'));
    });

    QUnit.test('reduce index arrays', function (assert) {
      const dfList = [[4], [11], [1, 1], [1], [1, 1]];

      const result = this.subject(dfList);

      assert.deepEqual(result, [4, 11, 1, 1, 1]);
    });
  });

  QUnit.module('convertToTarget', {
    beforeEach() { this.subject = Hougeki.convertToTarget; },
  }, function () {
    QUnit.test('bad index', function (assert) {
      assert.throws(() => this.subject(undefined, 0), new Error('Bad target index: 0'));
      assert.throws(() => this.subject(undefined, 13), new Error('Bad target index: 13'));
      assert.throws(() => this.subject(undefined, 1.1), new Error('Bad target index: 1.1'));
    });

    QUnit.test('player main fleet ships', function (assert) {
      const role = Role.MAIN_FLEET;
      assert.deepEqual(this.subject(role, 1), { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 0 });
      assert.deepEqual(this.subject(role, 2), { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 1 });
      assert.deepEqual(this.subject(role, 3), { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 2 });
      assert.deepEqual(this.subject(role, 4), { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 3 });
      assert.deepEqual(this.subject(role, 5), { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 4 });
      assert.deepEqual(this.subject(role, 6), { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 5 });
    });

    QUnit.test('enemy ships', function (assert) {
      assert.deepEqual(this.subject('blah', 7), { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 0 });
      assert.deepEqual(this.subject('blah', 8), { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 1 });
      assert.deepEqual(this.subject('blah', 9), { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 2 });
      assert.deepEqual(this.subject('blah', 10), { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 3 });
      assert.deepEqual(this.subject('blah', 11), { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 4 });
      assert.deepEqual(this.subject('blah', 12), { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 5 });
    });
  });

  QUnit.module('convertToCombinedTargetIndex', {
    beforeEach() { this.subject = Hougeki.convertToCombinedTargetIndex; },
  }, function () {
    QUnit.test('bad index', function (assert) {
      assert.throws(() => this.subject(0), new Error('Bad target index: 0'));
      assert.throws(() => this.subject(13), new Error('Bad target index: 13'));
      assert.throws(() => this.subject(1.1), new Error('Bad target index: 1.1'));
    });

    QUnit.test('main fleet', function (assert) {
      assert.deepEqual(this.subject(1), { role: Role.MAIN_FLEET, position: 0 });
      assert.deepEqual(this.subject(2), { role: Role.MAIN_FLEET, position: 1 });
      assert.deepEqual(this.subject(3), { role: Role.MAIN_FLEET, position: 2 });
      assert.deepEqual(this.subject(4), { role: Role.MAIN_FLEET, position: 3 });
      assert.deepEqual(this.subject(5), { role: Role.MAIN_FLEET, position: 4 });
      assert.deepEqual(this.subject(6), { role: Role.MAIN_FLEET, position: 5 });
    });

    QUnit.test('escort fleet', function (assert) {
      assert.deepEqual(this.subject(7), { role: Role.ESCORT_FLEET, position: 0 });
      assert.deepEqual(this.subject(8), { role: Role.ESCORT_FLEET, position: 1 });
      assert.deepEqual(this.subject(9), { role: Role.ESCORT_FLEET, position: 2 });
      assert.deepEqual(this.subject(10), { role: Role.ESCORT_FLEET, position: 3 });
      assert.deepEqual(this.subject(11), { role: Role.ESCORT_FLEET, position: 4 });
      assert.deepEqual(this.subject(12), { role: Role.ESCORT_FLEET, position: 5 });
    });
  });

  QUnit.module('parseCombinedTargetSides', {
    beforeEach() { this.subject = Hougeki.parseCombinedTargetSides; },
  }, function () {
    QUnit.test('bad flag', function (assert) {
      assert.throws(() => this.subject(['blah']), new Error('Bad eFlag: blah'));
      assert.throws(() => this.subject([3]), new Error('Bad eFlag: 3'));
    });

    QUnit.test('convert eFlags to Side values', function (assert) {
      const eFlags = [1, 0, 0, 1];

      const result = this.subject(eFlags);

      assert.deepEqual(result, [Side.PLAYER, Side.ENEMY, Side.ENEMY, Side.PLAYER]);
    });
  });

  QUnit.module('zipCombinedTargets', {
    beforeEach() { this.subject = Hougeki.zipCombinedTargets; },
  }, function () {
    QUnit.test('mismatched input lengths', function (assert) {
      const indexes = new Array(10);
      const sides = new Array(2);

      assert.throws(() => this.subject(indexes, sides), new Error('Mismatched number of indexes (10) and sides (2)'));
    });

    QUnit.test('compose target properties', function (assert) {
      const indexes = [
        { role: Role.ESCORT_FLEET, position: 3 },
        { role: Role.MAIN_FLEET, position: 0 },
      ];
      const sides = [Side.PLAYER, Side.ENEMY];

      const result = this.subject(indexes, sides);

      assert.deepEqual(result, [
        { side: Side.PLAYER, role: Role.ESCORT_FLEET, position: 3 },
        { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 0 },
      ]);
    });
  });

  QUnit.module('convertToDamage', {
    beforeEach() { this.subject = Hougeki.convertToDamage; },
  }, function () {
    QUnit.test('single attack / cut in', function (assert) {
      assert.equal(this.subject([78]), 78);
      // the damage value is normalized elsewhere
      assert.equal(this.subject([1.1]), 1.1);
      // as are no damage attacks
      assert.equal(this.subject([0]), 0);
    });

    QUnit.test('double-attack', function (assert) {
      assert.equal(this.subject([23, 43]), 66);
    });
  });

  QUnit.module('zipAttacks', {
    beforeEach() { this.subject = Hougeki.zipAttacks; },
  }, function () {
    const { createAttack } = KC3BattlePrediction.battle;

    QUnit.test('mismatched targets and damages', function (assert) {
      const targets = new Array(5);
      const damages = new Array(6);

      assert.throws(() => this.subject(targets, damages), new Error('Mismatched number of targets and damages'));
    });

    QUnit.test('create Attack objects', function (assert) {
      const targets = [
      { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 1 },
      { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 0 },
      ];
      const damages = [5, 25];

      const result = this.subject(targets, damages);

      assert.deepEqual(result, [
        createAttack(Side.PLAYER, Role.MAIN_FLEET, 1, 5),
        createAttack(Side.ENEMY, Role.MAIN_FLEET, 0, 25),
      ]);
    });

    QUnit.test('omit Attacks that do no damage', function (assert) {
      const targets = [
      { side: Side.PLAYER, role: Role.MAIN_FLEET, position: 3 },
      { side: Side.ENEMY, role: Role.ESCORT_FLEET, position: 5 },
      ];
      const damages = [0, 0.1];

      const result = this.subject(targets, damages);

      assert.deepEqual(result, []);
    });
  });
});
