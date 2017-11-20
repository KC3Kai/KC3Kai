QUnit.module('modules > BattlePrediction > Fleets', function () {
  const Fleets = KC3BattlePrediction.fleets;

  QUnit.module('mergeFleets', {
    beforeEach() { this.subject = Fleets.mergeFleets; },
  }, function () {
    QUnit.test('single fleet', function (assert) {
      const fleet = {
        main: [1, 2, 3],
        escort: [],
      };

      const result = this.subject(fleet);

      assert.deepEqual(result, [1, 2, 3, -1, -1, -1]);
    });

    QUnit.test('strike force', function (assert) {
      const fleet = {
        main: [1, 2, 3, 4, 5, 6, 7],
        escort: [],
      };

      const result = this.subject(fleet);

      assert.deepEqual(result, [1, 2, 3, 4, 5, 6, 7]);
    });

    QUnit.test('combined fleet', function (assert) {
      const fleet = {
        main: [1, 2, 3, 4],
        escort: [5, 6, 7],
      };

      const result = this.subject(fleet);

      assert.deepEqual(result, [1, 2, 3, 4, -1, -1, 5, 6, 7]);
    });
  });

  QUnit.module('splitFleet', {
    beforeEach() { this.subject = Fleets.splitFleet; },
  }, function () {
    QUnit.test('single fleet', function (assert) {
      const fleet = [1, 2, 3, -1, -1, -1];

      const result = this.subject(false)(fleet);

      assert.deepEqual(result, {
        main: [1, 2, 3],
        escort: [],
      });
    });

    QUnit.test('strike force', function (assert) {
      const fleet = [1, 2, 3, 4, 5, 6, 7];

      const result = this.subject(false)(fleet);

      assert.deepEqual(result, {
        main: [1, 2, 3, 4, 5, 6, 7],
        escort: [],
      });
    });

    QUnit.test('combined fleet', function (assert) {
      const fleet = [1, 2, 3, 4, -1, -1, 5, 6, 7];

      const result = this.subject(true)(fleet);

      assert.deepEqual(result, {
        main: [1, 2, 3, 4],
        escort: [5, 6, 7],
      });
    });
  });
});
