/* global battleData */
QUnit.module('modules > BattlePrediction', function () {
  QUnit.module('analyzeBattle', {
    beforeEach() {
      window.KC3Log = { error: e => console.error(e.message) };

      this.subject = KC3BattlePrediction.analyzeBattle;
    },
  }, function () {
    const { Player, Enemy, Time } = KC3BattlePrediction;

    QUnit.test('partial CF - air raid', function (assert) {
      const battleType = { player: Player.CTF, enemy: Enemy.SINGLE, time: Time.DAY };
      const damecons = {};

      const result = this.subject(battleData.cfLdAirbattle, damecons, battleType);

      assert.equal(result.isPlayerNoDamage, false);
      assert.deepEqual(result.fleets, {
        playerMain: [
          { hp: 62 - 57, sunk: false, dameConConsumed: false, damageDealt: 0 },
          { hp: 50 - 7, sunk: false, dameConConsumed: false, damageDealt: 0 },
        ],
        playerEscort: [
          { hp: 26 - 17, sunk: false, dameConConsumed: false, damageDealt: 0 },
          { hp: 13, sunk: false, dameConConsumed: false, damageDealt: 0 },
          { hp: 16, sunk: false, dameConConsumed: false, damageDealt: 0 },
        ],
        enemyMain: [
          { hp: 350, sunk: false, dameConConsumed: false, damageDealt: 0 },
          { hp: 88, sunk: false, dameConConsumed: false, damageDealt: 0 },
          { hp: 88, sunk: false, dameConConsumed: false, damageDealt: 0 },
          { hp: 48, sunk: false, dameConConsumed: false, damageDealt: 0 },
          { hp: 60, sunk: false, dameConConsumed: false, damageDealt: 0 },
          { hp: 60, sunk: false, dameConConsumed: false, damageDealt: 0 },
        ],
        enemyEscort: [],
      });
    });

    QUnit.test('7v12 night to day + damecon used', function (assert) {
      const battleType = { player: Player.SINGLE, enemy: Enemy.COMBINED, time: Time.NIGHT_TO_DAY };
      const damecons = {
        main: [0, 0, 0, 0, 0, 0, 1],
      };

      const result = this.subject(battleData.strikeForceVsCFNightToDayWithDamecon, damecons, battleType);

      assert.equal(result.isPlayerNoDamage, false);
      assert.deepEqual(result.fleets, {
        playerMain: [
          { hp: 77, sunk: false, dameConConsumed: false, damageDealt: 30 + 326 + 113 + 144 },
          { hp: 18, sunk: false, dameConConsumed: false, damageDealt: 192 + 329 + 3 },
          { hp: 12, sunk: false, dameConConsumed: false, damageDealt: 278 + 70 + 1 },
          { hp: 27, sunk: false, dameConConsumed: false, damageDealt: 0 + 295 + 3 },
          { hp: 25, sunk: false, dameConConsumed: false, damageDealt: 255 + 373 + 1 },
          { hp: 77, sunk: false, dameConConsumed: false, damageDealt: 559 + 1 + 144 },
          { hp: 4, sunk: false, dameConConsumed: true, damageDealt: 0 + 0 },
        ],
        playerEscort: [],
        enemyMain: [
          { hp: -125, sunk: true, dameConConsumed: false, damageDealt: 15 },
          { hp: -193, sunk: true, dameConConsumed: false, damageDealt: 0 },
          { hp: -157, sunk: true, dameConConsumed: false, damageDealt: 0 },
          { hp: -231, sunk: true, dameConConsumed: false, damageDealt: 4 },
          { hp: -256, sunk: true, dameConConsumed: false, damageDealt: 0 },
          { hp: -144, sunk: true, dameConConsumed: false, damageDealt: 0 },
        ],
        enemyEscort: [
          { hp: -226, sunk: true, dameConConsumed: false, damageDealt: 0 },
          { hp: -157, sunk: true, dameConConsumed: false, damageDealt: 0 },
          { hp: -333, sunk: true, dameConConsumed: false, damageDealt: 0 },
          { hp: -519, sunk: true, dameConConsumed: false, damageDealt: 12 },
          { hp: -62, sunk: true, dameConConsumed: false, damageDealt: 0 },
          { hp: -21, sunk: true, dameConConsumed: false, damageDealt: 0 },
        ],
      });
    });
  });
});
