QUnit.module('modules > BattlePrediction > Rank', function () {
  const Rank = KC3BattlePrediction.rank;

  QUnit.module('getRankPredictor', {
    beforeEach() { this.subject = Rank.getRankPredictor; },
  }, function () {
    QUnit.test('air raid', function (assert) {
      assert.equal(this.subject('ld_airbattle'), Rank.airRaid);
    });

    QUnit.test('default to regular battle', function (assert) {
      assert.equal(this.subject(), Rank.battle);
    });
  });

  QUnit.module('splitSides', {
    beforeEach() { this.subject = Rank.splitSides; },
  }, function () {
    QUnit.test('fleet for role does not exist', function (assert) {
      assert.deepEqual(this.subject(undefined), {
        player: [],
        enemy: [],
      });
    });

    QUnit.test('both fleets', function (assert) {
      const hps = [-1, 67, 57, 83, 52, 57, 45, 370, 88, 88, 80, 35, 35];

      const result = this.subject(hps);

      assert.deepEqual(result, {
        player: [67, 57, 83, 52, 57, 45],
        enemy: [370, 88, 88, 80, 35, 35],
      });
    });

    QUnit.test('enemy only', function (assert) {
      const hps = [-1, -1, -1, -1, -1, -1, -1, 57, 76, 76, 38, 35, 35];

      const result = this.subject(hps);

      assert.deepEqual(result, {
        player: [],
        enemy: [57, 76, 76, 38, 35, 35],
      });
    });

    QUnit.test('player only', function (assert) {
      const hps = [-1, 24, 32, 32, 32, 32, 38];

      const result = this.subject(hps);

      assert.deepEqual(result, {
        player: [24, 32, 32, 32, 32, 38],
        enemy: [],
      });
    });
  });

  QUnit.module('zipHps', {
    beforeEach() { this.subject = Rank.zipHps; },
  }, function () {
    QUnit.test('mismatched length of input arrays', function (assert) {
      const nowhps = new Array(5);
      const maxhps = new Array(7);
      try {
        this.subject(nowhps, maxhps);
        assert.notOk(true, 'no exception');
      } catch (result) {
        assert.equal(result.message, 'Mismatched nowhps + maxhps');
        assert.equal(result.data.nowHps, nowhps);
        assert.equal(result.data.maxHps, maxhps);
      }
    });

    QUnit.test('success', function (assert) {
      const nowHps = [75, 75, 6, 69, 23, 43];
      const maxHps = [75, 75, 82, 82, 43, 43];

      const result = this.subject(nowHps, maxHps);

      assert.deepEqual(result, [
        { hp: 75, maxHp: 75 },
        { hp: 75, maxHp: 75 },
        { hp: 6, maxHp: 82 },
        { hp: 69, maxHp: 82 },
        { hp: 23, maxHp: 43 },
        { hp: 43, maxHp: 43 },
      ]);
    });
  });

  QUnit.module('removeRetreated', {
    beforeEach() { this.subject = Rank.removeRetreated; },
  }, function () {
    QUnit.test('no retreated ids in json', function (assert) {
      const ships = [1, 2, 3, 4, 5, 6];

      const result = this.subject(ships, undefined);

      assert.deepEqual(result, ships);
    });

    QUnit.test('set retreated ship slots to empty', function (assert) {
      const ships = [1, 2, 3, 4, 5, 6];
      const escapeIdx = [2, 4];

      const result = this.subject(ships, escapeIdx);

      assert.deepEqual(result, [1, -1, 3, -1, 5, 6]);
    });
  });

  QUnit.module('omitEmptySlots', {
    beforeEach() { this.subject = Rank.omitEmptySlots; },
  }, function () {
    QUnit.test('remove empty slots', function (assert) {
      const fleet = [{ hp: 1 }, { hp: -1 }, { hp: 3 }, { hp: 4 }, { hp: -1 }, { hp: -1 }];

      const result = this.subject(fleet);

      assert.deepEqual(result, [{ hp: 1 }, { hp: 3 }, { hp: 4 }]);
    });
  });

  QUnit.module('hideOverkill', {
    beforeEach() { this.subject = Rank.hideOverkill; },
  }, function () {
    QUnit.test('empty fleet', function (assert) {
      assert.deepEqual(this.subject([]), []);
    });

    QUnit.test('hide overkill', function (assert) {
      const fleet = [
        { hp: 230, sunk: false, dameConConsumed: false },
        { hp: -94, sunk: true, dameConConsumed: false },
        { hp: -134, sunk: true, dameConConsumed: false },
        { hp: 49, sunk: false, dameConConsumed: false },
        { hp: -1, sunk: true, dameConConsumed: false },
        { hp: -1, sunk: true, dameConConsumed: false },
      ];

      const result = this.subject(fleet);

      assert.deepEqual(result, [
        { hp: 230, sunk: false, dameConConsumed: false },
        { hp: 0, sunk: true, dameConConsumed: false },
        { hp: 0, sunk: true, dameConConsumed: false },
        { hp: 49, sunk: false, dameConConsumed: false },
        { hp: 0, sunk: true, dameConConsumed: false },
        { hp: 0, sunk: true, dameConConsumed: false },
      ]);
    });
  });

  QUnit.module('getSunkCount', {
    beforeEach() { this.subject = Rank.getSunkCount; },
  }, function () {
    QUnit.test('get number of sunken ships', function (assert) {
      const fleets = {
        playerMain: [{ sunk: true }, { sunk: false }, { sunk: true }],
        playerEscort: [{ sunk: false }, { sunk: true }],
        enemyMain: [{ sunk: false }, { sunk: true }, { sunk: true }],
        enemyEscort: [],
      };

      const result = this.subject(fleets);

      assert.deepEqual(result, {
        player: 3,
        enemy: 2,
      });
    });
  });

  QUnit.module('getShipCount', {
    beforeEach() { this.subject = Rank.getShipCount; },
  }, function () {
    QUnit.test('get number of ships', function (assert) {
      const fleets = {
        playerMain: [{}, {}, {}, {}],
        playerEscort: [],
        enemyMain: [{}, {}, {}, {}, {}, {}],
        enemyEscort: [{}, {}, {}],
      };

      const result = this.subject(fleets);

      assert.deepEqual(result, {
        player: 4,
        enemy: 9,
      });
    });
  });

  QUnit.module('getHpTotal', {
    beforeEach() { this.subject = Rank.getHpTotal; },
  }, function () {
    QUnit.test("get sum of all ships' hp", function (assert) {
      const fleets = {
        playerMain: [{ hp: 67 }, { hp: 57 }, { hp: 83 }],
        playerEscort: [{ hp: 50 }, { hp: 35 }],
        enemyMain: [{ hp: 370 }, { hp: 88 }, { hp: 88 }, { hp: 80 }, { hp: 35 }, { hp: 35 }],
        enemyEscort: [],
      };

      const result = this.subject(fleets);

      assert.deepEqual(result, {
        player: 292,
        enemy: 696,
      });
    });
  });

  QUnit.module('getDamageGauge', {
    beforeEach() {
      this.subject = Rank.getDamageGauge;
    },
  }, function () {
    QUnit.test('calculate damage gauge percentage', function (assert) {
      const initialFleets = {
        playerMain: [{ hp: 25 }],
        playerEscort: [{ hp: 25 }, { hp: 25 }, { hp: 25 }],
        enemyMain: [{ hp: 12 }, { hp: 34 }, { hp: 56 }, { hp: 78 }, { hp: 90 }],
        enemyEscort: [],
      };
      const resultFleets = {
        playerMain: [{ hp: 20 }],
        playerEscort: [{ hp: 20 }, { hp: 5 }, { hp: 5 }],
        enemyMain: [{ hp: 1 }, { hp: 2 }, { hp: 3 }, { hp: 4 }, { hp: 5 }],
        enemyEscort: [],
      };

      const result = this.subject(initialFleets, resultFleets);

      assert.deepEqual(result, {
        player: 50,
        enemy: 94,
      });
    });
  });
});
