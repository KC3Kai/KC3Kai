QUnit.module('modules > BattlePrediction > phases > Raigeki', function () {
  const Raigeki = KC3BattlePrediction.battle.phases.raigeki;
  const { Side } = KC3BattlePrediction;

  QUnit.module('parsePlayerJson', {
    beforeEach() { this.subject = Raigeki.parsePlayerJson; },
  }, function () {
    QUnit.test('extract player attack data from kcsapi json', function (assert) {
      const json = {
        api_frai: 'defender index',
        api_fydam: 'damage',
      };

      const result = this.subject(json, 'attacker index');

      assert.deepEqual(result, {
        damage: 'damage',
        defender: { side: Side.ENEMY, position: 'defender index' },
        attacker: { side: Side.PLAYER, position: 'attacker index' },
      });
    });
  });

  QUnit.module('parseEnemyJson', {
    beforeEach() { this.subject = Raigeki.parseEnemyJson; },
  }, function () {
    QUnit.test('extract enemy attack data from kcsapi json', function (assert) {
      const json = {
        api_erai: 'defender index',
        api_eydam: 'damage',
      };

      const result = this.subject(json, 'attacker index');

      assert.deepEqual(result, {
        damage: 'damage',
        defender: { side: Side.PLAYER, position: 'defender index' },
        attacker: { side: Side.ENEMY, position: 'attacker index' },
      });
    });
  });
});
