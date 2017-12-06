QUnit.module('modules > BattlePrediction > Fleets', function () {
  const Fleets = KC3BattlePrediction.fleets;

  QUnit.module('getPath', {
    beforeEach() { this.subject = Fleets.getPath; },
  }, function () {
    QUnit.test('strike force', function (assert) {
      const fleets = {
        side: {
          main: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        },
      };
      const target = { side: 'side', position: 6 };

      const result = this.subject(fleets, target);

      assert.equal(result, 'side.main.6');
    });

    QUnit.test('combined fleet', function (assert) {
      const fleets = {
        side: {
          main: ['a', 'b', 'c', 'd', 'e', 'f'],
          escort: ['g', 'h', 'i', 'j', 'k', 'l'],
        },
      };
      const target = { side: 'side', position: 6 };

      const result = this.subject(fleets, target);

      assert.equal(result, 'side.escort.0');
    });

    QUnit.test('bad target', function (assert) {
      const fleets = {
        side: {
          main: ['a', 'b', 'c'],
          escort: [],
        },
      };
      const target = { side: 'side', position: 5 };

      assert.throws(() => this.subject(fleets, target), 'Bad target: {"side":"side","position":5}');
    });
  });
});
