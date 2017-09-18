QUnit.module('modules > BattlePrediction > values > Fleets', function () {
  const Fleets = KC3BattlePrediction.fleets;

  QUnit.module('convertToFleet', {
    beforeEach() { this.subject = Fleets.convertToFleet; },
  }, function () {
    QUnit.test('convert array to object with index as keys', function (assert) {
      const ships = ['ship 1', 'ship 2', 'ship 3', 'ship 4', 'ship 5', 'ship 6'];

      const result = this.subject(ships);

      assert.deepEqual(result, {
        0: 'ship 1',
        1: 'ship 2',
        2: 'ship 3',
        3: 'ship 4',
        4: 'ship 5',
        5: 'ship 6',
      });
    });

    QUnit.test('ignore empty slots', function (assert) {
      const ships = ['ship 1', 'ship 2', -1, 'ship 4', 'ship 5', -1];

      const result = this.subject(ships);

      assert.deepEqual(result, {
        0: 'ship 1',
        1: 'ship 2',
        3: 'ship 4',
        4: 'ship 5',
      });
    });
  });

  QUnit.module('convertToArray', {
    beforeEach() { this.subject = Fleets.convertToArray; },
  }, function () {
    QUnit.test('convert to length 6 array', function (assert) {
      const fleet = {
        1: 'ship 2',
        3: 'ship 4',
        4: 'ship 5',
      };

      const result = this.subject(fleet);

      assert.deepEqual(result, [
        -1,
        'ship 2',
        -1,
        'ship 4',
        'ship 5',
        -1,
      ]);
    });
  });

  QUnit.module('trimEmptySlots', {
    beforeEach() { this.subject = Fleets.trimEmptySlots; },
  }, function () {
    QUnit.test('remove empty slots from the end of a fleet array', function (assert) {
      const fleetArray = ['ship 1', -1, 'ship 3', 'ship 4', -1, -1];

      const result = this.subject(fleetArray);

      assert.deepEqual(result, ['ship 1', -1, 'ship 3', 'ship 4']);
    });
  });
});
