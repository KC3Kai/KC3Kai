QUnit.module('modules > BattlePrediction > values > Ship', function () {
  const Ship = KC3BattlePrediction.fleets.ship;

  QUnit.module('createShip', {
    beforeEach() { this.subject = Ship.createShip; },
  }, function () {
    QUnit.test('success', function (assert) {
      const result = this.subject(15, 20);

      assert.deepEqual(result, { hp: 15, maxHp: 20, damageDealt: 0 });
    });
  });

  QUnit.module('installDamecon', {
    beforeEach() { this.subject = Ship.installDamecon; },
  }, function () {
    QUnit.test('specified damecon', function (assert) {
      const ship = { hp: 10, maxHp: 12 };

      const result = this.subject(ship, 1);

      assert.deepEqual(result, { hp: 10, maxHp: 12, damecon: 1 });
    });

    QUnit.test('defaults to no damecon', function (assert) {
      const { Damecon } = KC3BattlePrediction;
      const ship = { hp: 10, maxHp: 12 };

      const result = this.subject(ship, undefined);

      assert.deepEqual(result, { hp: 10, maxHp: 12, damecon: Damecon.NONE });
    });
  });

  QUnit.module('dealDamage', {
    beforeEach() { this.subject = Ship.dealDamage; },
  }, function () {
    QUnit.test('add to damage dealt', function (assert) {
      const ship = { damageDealt: 5, hp: 10 };

      const result = this.subject(10)(ship);

      assert.deepEqual(result, { damageDealt: 15, hp: 10 });
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

  QUnit.module('formatShip', {
    beforeEach() {
      this.subject = Ship.formatShip;
    },
  }, function () {
    QUnit.test('empty slot', function (assert) {
      assert.equal(this.subject(-1), -1);
    });

    QUnit.test('convert to output format', function (assert) {
      const ship = { hp: 20, maxHp: 30, dameConConsumed: true, damageDealt: 5 };

      const result = this.subject(ship);

      assert.deepEqual(result, {
        hp: 20,
        dameConConsumed: true,
        sunk: false,
        damageDealt: 5,
      });
    });

    QUnit.test('set sunk property', function (assert) {
      assert.equal(this.subject({ hp: 1 }).sunk, false);
      assert.equal(this.subject({ hp: 0 }).sunk, true);
      assert.equal(this.subject({ hp: -1 }).sunk, true);
    });

    QUnit.test('default dameConConsumed to false', function (assert) {
      assert.equal(this.subject({}).dameConConsumed, false);
    });
  });
});
