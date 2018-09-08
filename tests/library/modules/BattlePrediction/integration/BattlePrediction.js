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
          { hp: 62 - 57, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: 50 - 7, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
        ],
        playerEscort: [
          { hp: 26 - 17, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: 13, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: 16, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
        ],
        enemyMain: [
          { hp: 350, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: 88, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: 88, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: 48, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: 60, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: 60, sunk: false, dameConConsumed: false, damageDealt: 0, attacks: [] },
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
          { hp: 77, sunk: false, dameConConsumed: false, damageDealt: 30 + 326 + 113 + 144, attacks: [{damage:[30,0],acc:[1,1],equip:["236","105"],cutin: undefined, ncutin:1,target:11,hp:77},{damage:[153,173],acc:[1,1],equip:["236","105"],cutin: undefined, ncutin:1,target:4,hp:77},{damage:[65,48],acc:[1,1],equip:["236","105"],ncutin: undefined, cutin:2,target:0,hp:77},{damage:[62,82],acc:[1,1],equip:["236","105"],ncutin: undefined, cutin:2,target:0,hp:77}] },
          { hp: 18, sunk: false, dameConConsumed: false, damageDealt: 192 + 329 + 3, attacks: [{damage:[4,188],acc:[1,1],equip:["122","122"],cutin: undefined, ncutin:1,target:5,hp:18},{damage:[168,161],acc:[1,1],equip:["122","122"],cutin: undefined, ncutin:1,target:3,hp:18},{damage:[3],acc:[2],equip:[122],ncutin: undefined, cutin:0,target:0,hp:18}] },
          { hp: 12, sunk: false, dameConConsumed: false, damageDealt: 278 + 70 + 1, attacks: [{damage:[278,0],acc:[2,1],equip:["122","122"],cutin: undefined, ncutin:1,target:1,hp:31},{damage:[70,0],acc:[1,1],equip:["122","122"],cutin: undefined, ncutin:1,target:10,hp:12},{damage:[1],acc:[1],equip:[122],ncutin: undefined, cutin:0,target:0,hp:12}] },
          { hp: 27, sunk: false, dameConConsumed: false, damageDealt: 0 + 295 + 3, attacks: [{damage:[0,0],acc:[1,1],equip:["122","122"],cutin: undefined, ncutin:1,target:10,hp:27},{damage:[134,161],acc:[1,1],equip:["122","122"],cutin: undefined, ncutin:1,target:6,hp:27},{damage:[3],acc:[1],equip:[122],ncutin: undefined, cutin:0,target:0,hp:27}] },
          { hp: 25, sunk: false, dameConConsumed: false, damageDealt: 255 + 373 + 1, attacks: [{damage:[134,121],acc:[1,1],equip:["122","122"],cutin: undefined, ncutin:1,target:2,hp:25},{damage:[194,179],acc:[1,1],equip:["122","122"],cutin: undefined, ncutin:1,target:8,hp:25},{damage:[1],acc:[1],equip:[122],ncutin: undefined, cutin:0,target:0,hp:25}] },
          { hp: 77, sunk: false, dameConConsumed: false, damageDealt: 559 + 1 + 144, attacks: [{damage:[345,214],acc:[2,1],equip:["105","105"],cutin: undefined, ncutin:1,target:9,hp:77},{damage:[0,1],acc:[1,1],equip:["105","105"],cutin: undefined, ncutin:1,target:10,hp:77},{damage:[50,94],acc:[1,1],equip:["105","105"],ncutin: undefined, cutin:2,target:0,hp:77}] },
          { hp: 4, sunk: false, dameConConsumed: true, damageDealt: 0 + 0, attacks: [] },
        ],
        playerEscort: [],
        enemyMain: [
          { hp: -125, sunk: true, dameConConsumed: false, damageDealt: 15, attacks: [{damage:[2,13],acc:[1,1],equip:[553,553],cutin: undefined, ncutin:1,target:2,hp:655},{damage:[0],acc:[0],equip:[553],ncutin: undefined, cutin:0,target:5,hp:171}] },
          { hp: -193, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: -157, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: -231, sunk: true, dameConConsumed: false, damageDealt: 4, attacks: [{damage:[2,2],acc:[1,1],equip:[509,509],cutin: undefined, ncutin:1,target:2,hp:98}] },
          { hp: -256, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: -144, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [] },
        ],
        enemyEscort: [
          { hp: -226, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [{damage:[0],acc:[1],equip:[-1],cutin: undefined, ncutin:0,target:6,hp:69}] },
          { hp: -157, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [] },
          { hp: -333, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [{damage:[0],acc:[0],equip:[-1],cutin: undefined, ncutin:0,target:6,hp:40}] },
          { hp: -519, sunk: true, dameConConsumed: false, damageDealt: 12, attacks: [{damage:[12],acc:[1],equip:[-1],cutin: undefined, ncutin:0,target:6,hp:40}] },
          { hp: -62, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [{damage:[0],acc:[1],equip:[-1],cutin: undefined, ncutin:0,target:6,hp:9}] },
          { hp: -21, sunk: true, dameConConsumed: false, damageDealt: 0, attacks: [] },
        ],
      });
    });
  });
});
