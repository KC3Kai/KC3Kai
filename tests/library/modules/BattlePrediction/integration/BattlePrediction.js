/* global battleData */
QUnit.module('modules > BattlePrediction', function () {
  QUnit.module('analyzeBattle', {
    beforeEach() {
      window.KC3Log = { error: e => console.error(e.message) };

      this.subject = KC3BattlePrediction.analyzeBattle;
    },
  }, function () {
    const { Player, Enemy, Time } = KC3BattlePrediction;

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
