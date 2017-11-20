QUnit.module('modules > BattlePrediction > phases > Support', {
  beforeEach() { this.subject = KC3BattlePrediction.battle.phases.support.parseSupport; },
}, function () {
  const { Side, battle: { createAttack } } = KC3BattlePrediction;

  QUnit.test('shelling support', function (assert) {
    const json = {
      api_support_airatack: null,
      api_support_hourai: { api_damage: [11, 0, 0, 0, 39.1, 0, 0, 0, 0, 0, 21, 0] },
    };

    const result = this.subject(json);

    assert.deepEqual(result, [
      createAttack({ damage: 11, defender: { side: Side.ENEMY, position: 0 } }),
      createAttack({ damage: 39, defender: { side: Side.ENEMY, position: 4 } }),
      createAttack({ damage: 21, defender: { side: Side.ENEMY, position: 10 } }),
    ]);
  });

  QUnit.test('aerial support', function (assert) {
    const json = {
      api_support_airatack: {
        api_stage3: { api_edam: [47, 0, 0, 0, 0, 0] },
        api_stage3_combined: { api_edam: [12, 0, 0, 0, 0, 0] },
      },
      api_support_hourai: null,
    };

    const result = this.subject(json);

    assert.deepEqual(result, [
      createAttack({ damage: 47, defender: { side: Side.ENEMY, position: 0 } }),
      createAttack({ damage: 12, defender: { side: Side.ENEMY, position: 6 } }),
    ]);
  });
});
