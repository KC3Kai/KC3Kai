QUnit.module('modules > BattlePrediction > Mvp', function () {
  const Mvp = KC3BattlePrediction.mvp;

  QUnit.module('combineFleetResults', {
    beforeEach() { this.subject = Mvp.combineFleetResults; },
  }, function () {
    QUnit.test('empty fleet', function (assert) {
      assert.deepEqual(this.subject([], []), []);
    });

    QUnit.test('sum damage done in day and night battle', function (assert) {
      const day = [{ damageDealt: 3 }, { damageDealt: 30 }, { damageDealt: 300 }];
      const night = [{ damageDealt: 1 }, { damageDealt: 10 }, { damageDealt: 100 }];

      const result = this.subject(day, night);

      assert.deepEqual(result, [{ damageDealt: 4 }, { damageDealt: 40 }, { damageDealt: 400 }]);
    });
  });

  QUnit.module('getHighestDamage', {
    beforeEach() { this.subject = Mvp.getHighestDamage; },
  }, function () {
    QUnit.test('return index of ship with highest damage dealt', function (assert) {
      const ships = [{ damageDealt: 1 }, { damageDealt: 3 }, { damageDealt: 2 }];

      const result = this.subject(ships);

      assert.equal(result, 2);
    });

    QUnit.test('if equal damage, prefer ship closer to start of fleet', function (assert) {
      const ships = [{ damageDealt: 3 }, { damageDealt: 1 }, { damageDealt: 2 }, { damageDealt: 3 }];

      const result = this.subject(ships);

      assert.equal(result, 1);
    });
  });
});
