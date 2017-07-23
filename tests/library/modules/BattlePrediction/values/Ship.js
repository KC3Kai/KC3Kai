QUnit.module('modules > BattlePrediction > values > Ship', function () {
  const Ship = KC3BattlePrediction.fleets;

  QUnit.module('createShip', {
    beforeEach() { this.subject = Ship.createShip; },
  }, function () {
    QUnit.test('empty slot', function (assert) {
      assert.equal(this.subject(-1, -1), null);
    });

    QUnit.test('success', function (assert) {
      const result = this.subject(15, 20);

      assert.deepEqual(result, { hp: 15, maxHp: 20 });
    });
  });

  QUnit.module('installDamecon', {
    beforeEach() { this.subject = Ship.installDamecon; },
  }, function () {
    QUnit.test('empty slot', function (assert) {
      assert.equal(this.subject('blah', null), null);
    });

    QUnit.test('success', function (assert) {
      const ship = { hp: 10, maxHp: 12 };

      const result = this.subject(1, ship);

      assert.deepEqual(result, { hp: 10, maxHp: 12, damecon: 1 });
    });
  });

  QUnit.module('dealDamage', {
    beforeEach() { this.subject = Ship.dealDamage; },
  }, function () {
    QUnit.test('still alive', function (assert) {
      const ship = { hp: 10, maxHp: 20 };

      const result = this.subject(5, ship);

      assert.deepEqual(result, { hp: 5, maxHp: 20 });
    });

    QUnit.test('sunk', function (assert) {
      const ship = { hp: 10, maxHp: 20 };

      const result = this.subject(20, ship);

      assert.deepEqual(result, { hp: -10, maxHp: 20 });
    });
  });

  QUnit.module('tryDamecon', {
    beforeEach() { this.subject = Ship.tryDamecon; },
  }, function () {
    const { Damecon } = KC3BattlePrediction;

    QUnit.test('no damecon', function (assert) {
      const ship = { damecon: Damecon.NONE };

      const result = this.subject(ship);

      assert.equal(result, ship);
    });

    QUnit.test('repair goddess', function (assert) {
      const ship = { hp: -1, maxHp: 100, damecon: Damecon.GODDESS };

      const result = this.subject(ship);

      assert.deepEqual(result, {
        hp: 100,
        maxHp: 100,
        damecon: Damecon.NONE,
        dameConConsumed: true,
      });
    });

    QUnit.test('repair team', function (assert) {
      const ship = { hp: 0, maxHp: 14, damecon: Damecon.TEAM };

      const result = this.subject(ship);

      assert.deepEqual(result, {
        hp: 2,
        maxHp: 14,
        damecon: Damecon.NONE,
        dameConConsumed: true,
      });
    });
  });
});
