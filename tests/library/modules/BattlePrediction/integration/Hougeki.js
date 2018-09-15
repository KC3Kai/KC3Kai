QUnit.module('modules > BattlePrediction > phases > Hougeki', function () {
  const { Side, battle: { createAttack } } = KC3BattlePrediction;

  const toTarget = (side, position) => ({ side, position });

  QUnit.module('parseHougeki', {
    beforeEach() { this.subject = KC3BattlePrediction.battle.phases.hougeki.parseHougeki; },
  }, function () {
    QUnit.test('7v12', function (assert) {
      const battleData = {
        api_at_eflag: [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
        api_at_list: [0, 11, 1, 10, 2, 8, 5, 3, 6, 6, 9, 4],
        api_df_list: [[5, 5], [4], [10, 10], [6], [3, 3], [4], [7, 7], [8, 8], [2], [1, 1], [1], [9, 9]],
        api_damage: [[176, 168], [0.1], [0, 1], [0], [179, 166], [0], [161, 159], [195, 192], [44], [247, 245], [0], [187, 188]],
      };

      const result = this.subject(battleData);

      assert.deepEqual(result, [
        createAttack({ damage: 344, defender: toTarget(Side.ENEMY, 5), attacker: toTarget(Side.PLAYER, 0), info: {damage: [176, 168], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [5, 5]}, }),
        createAttack({ damage: 0, defender: toTarget(Side.PLAYER, 4), attacker: toTarget(Side.ENEMY, 11), info: {damage: [0.1], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [4]} }),
        createAttack({ damage: 1, defender: toTarget(Side.ENEMY, 10), attacker: toTarget(Side.PLAYER, 1), info: {damage: [0,1], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [10, 10]} }),
        createAttack({ damage: 0, defender: toTarget(Side.PLAYER, 6), attacker: toTarget(Side.ENEMY, 10), info: {damage: [0], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [6]} }),
        createAttack({ damage: 345, defender: toTarget(Side.ENEMY, 3), attacker: toTarget(Side.PLAYER, 2), info: {damage: [179,166], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [3, 3]} }),
        createAttack({ damage: 0, defender: toTarget(Side.PLAYER, 4), attacker: toTarget(Side.ENEMY, 8), info: {damage: [0], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [4]} }),
        createAttack({ damage: 320, defender: toTarget(Side.ENEMY, 7), attacker: toTarget(Side.PLAYER, 5), info: {damage: [161,159], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [7, 7]} }),
        createAttack({ damage: 387, defender: toTarget(Side.ENEMY, 8), attacker: toTarget(Side.PLAYER, 3), info: {damage: [195,192], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [8, 8]} }),
        createAttack({ damage: 44, defender: toTarget(Side.PLAYER, 2), attacker: toTarget(Side.ENEMY, 6), info: {damage: [44], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [2]} }),
        createAttack({ damage: 492, defender: toTarget(Side.ENEMY, 1), attacker: toTarget(Side.PLAYER, 6), info: {damage: [247,245], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [1, 1]} }),
        createAttack({ damage: 0, defender: toTarget(Side.PLAYER, 1), attacker: toTarget(Side.ENEMY, 9), info: {damage: [0], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [1]} }),
        createAttack({ damage: 375, defender: toTarget(Side.ENEMY, 9), attacker: toTarget(Side.PLAYER, 4), info: {damage: [187,188], acc: undefined, equip: undefined, cutin: undefined, ncutin: undefined, target: [9, 9]} }),
      ]);
    });

    QUnit.test('no attacks', function (assert) {
      const battleData = {
        api_at_eflag: null,
        api_at_list: null,
        api_df_list: null,
        api_damage: null,
      };

      const result = this.subject(battleData);

      assert.deepEqual(result, []);
    });
  });
});
