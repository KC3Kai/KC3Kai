QUnit.module('modules > BattlePrediction > modules > Yasen', function () {
  const Yasen = KC3BattlePrediction.battle.phases.yasen;

  QUnit.module('normalizeTargetJson', {
    beforeEach() { this.subject = Yasen.normalizeTargetJson; },
  }, function () {
    QUnit.test('single attack', function (assert) {
      assert.equal(this.subject([1]), 1);
    });

    QUnit.test('double attack + tci', function (assert) {
      assert.equal(this.subject([3, 3]), 3);
    });

    QUnit.test('gun cut-in', function (assert) {
      assert.equal(this.subject([11, -1, -1]), 11);
    });

    QUnit.test('bad formating', function (assert) {
      // empty array
      assert.throws(() => this.subject([]), new Error('Bad target json: []'));
      // indexes for DA/TCI do not match
      assert.throws(() => this.subject([2, 3]), new Error('Bad target json: [2,3]'));
      // 2nd + 3rd element for gun CI should be -1
      assert.throws(() => this.subject([1, 1, 1]), new Error('Bad target json: [1,1,1]'));
    });
  });

  QUnit.module('convertToTarget', {
    beforeEach() { this.subject = Yasen.convertToTarget; },
  }, function () {
    QUnit.test('target in player fleet', function (assert) {
      const { Side } = KC3BattlePrediction;
      const roles = { player: 'player role' };

      assert.deepEqual(this.subject(roles, 1), { side: Side.PLAYER, role: 'player role', position: 0 });
      assert.deepEqual(this.subject(roles, 2), { side: Side.PLAYER, role: 'player role', position: 1 });
      assert.deepEqual(this.subject(roles, 3), { side: Side.PLAYER, role: 'player role', position: 2 });
      assert.deepEqual(this.subject(roles, 4), { side: Side.PLAYER, role: 'player role', position: 3 });
      assert.deepEqual(this.subject(roles, 5), { side: Side.PLAYER, role: 'player role', position: 4 });
      assert.deepEqual(this.subject(roles, 6), { side: Side.PLAYER, role: 'player role', position: 5 });
    });

    QUnit.test('target in enemy fleet', function (assert) {
      const { Side } = KC3BattlePrediction;
      const roles = { enemy: 'enemy role' };

      assert.deepEqual(this.subject(roles, 7), { side: Side.ENEMY, role: 'enemy role', position: 0 });
      assert.deepEqual(this.subject(roles, 8), { side: Side.ENEMY, role: 'enemy role', position: 1 });
      assert.deepEqual(this.subject(roles, 9), { side: Side.ENEMY, role: 'enemy role', position: 2 });
      assert.deepEqual(this.subject(roles, 10), { side: Side.ENEMY, role: 'enemy role', position: 3 });
      assert.deepEqual(this.subject(roles, 11), { side: Side.ENEMY, role: 'enemy role', position: 4 });
      assert.deepEqual(this.subject(roles, 12), { side: Side.ENEMY, role: 'enemy role', position: 5 });
    });
  });

  QUnit.module('convertToDamage', {
    beforeEach() { this.subject = Yasen.convertToDamage; },
  }, function () {
    QUnit.test('regular attack', function (assert) {
      assert.equal(this.subject([1]), 1);
    });

    QUnit.test('double attack', function (assert) {
      assert.equal(this.subject([2, 3]), 5);
    });

    QUnit.test('gun CI', function (assert) {
      assert.equal(this.subject([20, -1, -1]), 20);
    });
  });

  QUnit.module('zipAttacks', {
    beforeEach() { this.subject = Yasen.zipAttacks; },
  }, function () {
    const { Side, Role, battle: { createAttack } } = KC3BattlePrediction;

    QUnit.test('mismatched targets and damages', function (assert) {
      const targets = new Array(5);
      const damages = new Array(11);

      assert.throws(() => this.subject(targets, damages), new Error('Mismatch between targets (5) and damages (11)'));
    });

    QUnit.test('create Attack objects', function (assert) {
      const targets = [
        { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 0 },
        { side: Side.PLAYER, role: Role.ESCORT_FLEET, position: 2 },
      ];
      const damages = [121, 33];

      const result = this.subject(targets, damages);

      assert.deepEqual(result, [
        createAttack(Side.ENEMY, Role.MAIN_FLEET, 0, 121),
        createAttack(Side.PLAYER, Role.ESCORT_FLEET, 2, 33),
      ]);
    });

    QUnit.test('omit attacks that do 0 damage', function (assert) {
      const targets = [
        { side: Side.PLAYER, role: Role.ESCORT_FLEET, position: 5 },
        { side: Side.ENEMY, role: Role.MAIN_FLEET, position: 3},
      ];
      const damages = [0, 0.1];

      const result = this.subject(targets, damages);

      assert.deepEqual(result, []);
    });
  });
});
