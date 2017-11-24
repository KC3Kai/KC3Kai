QUnit.module('modules > BattlePrediction > Fleets', function () {
  const Fleets = KC3BattlePrediction.fleets;

  QUnit.module('normalizeHps', {
    beforeEach() { this.subject = Fleets.normalizeHps; },
  }, function () {
    QUnit.test('one fleet, all ships', function (assert) {
      const hps = [1, 2, 3, 4, 5, 6];

      const result = this.subject(hps);

      assert.deepEqual(result, [1, 2, 3, 4, 5, 6]);
    });

    QUnit.test('one fleet, ships missing', function (assert) {
      const hps = [1, 2, 3, 4];

      const result = this.subject(hps);

      assert.deepEqual(result, [1, 2, 3, 4, -1, -1]);
    });

    QUnit.skip('two fleets, ships missing', function (assert) {
      // TODO
    });
  });

  QUnit.module('convertToShips', {
    beforeEach() { this.subject = Fleets.convertToShips; },
  }, function () {
    QUnit.test('mismatched nowhps and maxhps', function (assert) {
      const nowHps = new Array(6);
      const maxHps = new Array(12);

      assert.throws(() => this.subject(nowHps, maxHps), new Error('Length of nowhps (6) and maxhps (12) do not match'));
    });

    QUnit.test('convert to Ship objects', function (assert) {
      const nowHps = [71, 61, 18, 1, 40, 44, 314, 217, 143, 61, 0, 0];
      const maxHps = [77, 77, 79, 77, 50, 55, 350, 250, 250, 88, 46, 46];

      const result = this.subject(nowHps, maxHps);

      assert.deepEqual(result, [
        Fleets.createShip(71, 77),
        Fleets.createShip(61, 77),
        Fleets.createShip(18, 79),
        Fleets.createShip(1, 77),
        Fleets.createShip(40, 50),
        Fleets.createShip(44, 55),
        Fleets.createShip(314, 350),
        Fleets.createShip(217, 250),
        Fleets.createShip(143, 250),
        Fleets.createShip(61, 88),
        Fleets.createShip(0, 46),
        Fleets.createShip(0, 46),
      ]);
    });

    QUnit.test('preserve empty slots in fleet', function (assert) {
      const nowHps = [15, 12, 18, 18, -1, -1, 0, 0, 28, 0, 0, 0];
      const maxHps = [15, 15, 18, 18, -1, -1, 90, 55, 28, 28, 70, 70];

      const result = this.subject(nowHps, maxHps);

      assert.deepEqual(result, [
        Fleets.createShip(15, 15),
        Fleets.createShip(12, 15),
        Fleets.createShip(18, 18),
        Fleets.createShip(18, 18),
        -1,
        -1,
        Fleets.createShip(0, 90),
        Fleets.createShip(0, 55),
        Fleets.createShip(28, 28),
        Fleets.createShip(0, 28),
        Fleets.createShip(0, 70),
        Fleets.createShip(0, 70),
      ]);
    });
  });

  QUnit.module('splitSides', {
    beforeEach() { this.subject = Fleets.splitSides; },
  }, function () {
    QUnit.test('bad length', function (assert) {
      assert.throws(() => this.subject(new Array(7)), new Error('Expected 6 or 12 ships, but got 7'));
    });

    QUnit.test('player fleet only', function (assert) {
      const ships = [1, 2, 3, 4, 5, 6];

      const result = this.subject(ships);

      assert.deepEqual(result, { player: ships, enemy: [] });
    });

    QUnit.test('player and enemy fleet', function (assert) {
      const ships = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      const result = this.subject(ships);

      assert.deepEqual(result, {
        player: [1, 2, 3, 4, 5, 6],
        enemy: [7, 8, 9, 10, 11, 12],
      });
    });

    QUnit.test('enemy fleet only', function (assert) {
      const ships = new Array(6).concat([7, 8, 9, 10, 11, 12]);

      const result = this.subject(ships);

      assert.deepEqual(result, {
        player: [],
        enemy: [7, 8, 9, 10, 11, 12],
      });
    });
  });

  QUnit.module('getDamecons', {
    beforeEach() { this.subject = Fleets.getDamecons; },
  }, function () {
    const { Role } = KC3BattlePrediction;

    QUnit.test('bad role', function (assert) {
      assert.throws(() => this.subject('blah'), new Error('Bad role: blah'));
    });

    QUnit.test('main fleet', function (assert) {
      const damecons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      const result = this.subject(Role.MAIN_FLEET, damecons);

      assert.deepEqual(result, damecons);
    });

    QUnit.test('escort fleet', function (assert) {
      const damecons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      const result = this.subject(Role.ESCORT_FLEET, damecons);

      assert.deepEqual(result, [7, 8, 9, 10, 11, 12]);
    });
  });
});
