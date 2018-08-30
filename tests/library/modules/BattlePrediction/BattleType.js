QUnit.module('modules > BattlePrediction > Battle', function () {
  QUnit.module('getBattlePhases', {
    beforeEach() { this.subject = KC3BattlePrediction.battle.getBattlePhases; },
  }, function () {
    const { Player, Enemy, Time } = KC3BattlePrediction;

    QUnit.test('valid type', function (assert) {
      const battleType = { player: Player.SINGLE, enemy: Enemy.SINGLE, time: Time.DAY };

      const result = this.subject(battleType);

      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
    });

    QUnit.test('invalid battle type', function (assert) {
      const badType = { blah: 'test' };

      assert.throws(() => this.subject(badType), 'Bad battle type: {"blah":"test"}');
    });
  });
});
