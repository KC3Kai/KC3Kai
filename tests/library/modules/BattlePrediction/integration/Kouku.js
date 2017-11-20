QUnit.module('modules > BattlePrediction > phases > Kouku', () => {
  QUnit.module('parse', {
    beforeEach() { this.subject = KC3BattlePrediction.battle.phases.kouku.parseKouku; },
  }, () => {
    const { Side, battle: { createAttack } } = KC3BattlePrediction;

    QUnit.test('[7v6]', function (assert) {
      const json = {
        api_stage3: {
          api_fdam: [13, 0, 0, 0, 0, 0, 43],
          api_edam: [0, 0, 0, 0, 0, 26.1],
        },
      };

      const result = this.subject(json);

      assert.deepEqual(result, [
        createAttack({ damage: 13, defender: { side: Side.PLAYER, position: 0 } }),
        createAttack({ damage: 43, defender: { side: Side.PLAYER, position: 6 } }),
        createAttack({ damage: 26, defender: { side: Side.ENEMY, position: 5 } }),
      ]);
    });

    QUnit.test('[7v12] damage to player main and escort', function (assert) {
      const json = {
        api_stage3: {
          api_fdam: [0, 0, 0, 0, 0, 0, 34],
          api_edam: [47, 0, 0, 0, 0, 0],
        },
        api_stage3_combined: {
          api_fdam: null,
          api_edam: [12, 0, 0, 0, 0, 0],
        },
      };

      const result = this.subject(json);

      assert.deepEqual(result, [
        createAttack({ damage: 34, defender: { side: Side.PLAYER, position: 6 } }),
        createAttack({ damage: 47, defender: { side: Side.ENEMY, position: 0 } }),
        createAttack({ damage: 12, defender: { side: Side.ENEMY, position: 6 } }),
      ]);
    });
  });
});
