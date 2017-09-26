QUnit.module('modules > BattlePrediction > Battle', function () {
  const Battle = KC3BattlePrediction.battle;

  QUnit.module('accumulateAttacks', {
    beforeEach() { this.subject = Battle.accumulateAttacks; },
  }, function () {
    QUnit.test('merge phase attack arrays', function (assert) {
      const phase1 = ['attack 1'];
      const phase2 = [];
      const phase3 = ['attack 2', 'attack 3'];

      const result = this.subject([phase1, phase2, phase3]);

      assert.deepEqual(result, ['attack 1', 'attack 2', 'attack 3']);
    });
  });
});
