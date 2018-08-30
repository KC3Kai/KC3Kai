(function () {
  const battle = {};
  const { Player, Enemy, Time } = KC3BattlePrediction;

  const toKey = (player, enemy, time) => `${player}-${enemy}-${time}`;

  const battleTypes = {
    // enemy single fleet
    [toKey(Player.SINGLE, Enemy.SINGLE, Time.DAY)]: [
      'airBaseInjection',
      'injectionKouku',
      'airBaseAttack',
      'kouku',
      'kouku2',
      'support',
      'openingTaisen',
      'openingAtack',
      'hougeki1',
      'hougeki2',
      'hougeki3',
      'raigeki',
    ],
    [toKey(Player.CTF, Enemy.SINGLE, Time.DAY)]: [
      'airBaseInjection',
      'injectionKouku',
      'airBaseAttack',
      'kouku',
      'kouku2',
      'support',
      'openingTaisen',
      'openingAtack',
      'hougeki1',
      'raigeki',
      'hougeki2',
      'hougeki3',
    ],
    [toKey(Player.STF, Enemy.SINGLE, Time.DAY)]: [
      'airBaseInjection',
      'injectionKouku',
      'airBaseAttack',
      'kouku',
      'kouku2',
      'support',
      'openingTaisen',
      'openingAtack',
      'hougeki1',
      'hougeki2',
      'hougeki3',
      'raigeki',
    ],

    // enemy combined fleet
    [toKey(Player.SINGLE, Enemy.COMBINED, Time.DAY)]: [
      'airBaseInjection',
      'injectionKouku',
      'airBaseAttack',
      'kouku',
      'kouku2',
      'support',
      'openingTaisen',
      'openingAtack',
      'hougeki1',
      'raigeki',
      'hougeki2',
      'hougeki3',
    ],
    [toKey(Player.CTF, Enemy.COMBINED, Time.DAY)]: [
      'airBaseInjection',
      'injectionKouku',
      'airBaseAttack',
      'kouku',
      'kouku2',
      'support',
      'openingTaisen',
      'openingAtack',
      'hougeki1',
      'hougeki2',
      'raigeki',
      'hougeki3',
    ],
    [toKey(Player.STF, Enemy.COMBINED, Time.DAY)]: [
      'airBaseInjection',
      'injectionKouku',
      'airBaseAttack',
      'kouku',
      'kouku2',
      'support',
      'openingTaisen',
      'openingAtack',
      'hougeki1',
      'hougeki2',
      'hougeki3',
      'raigeki',
    ],

    // night-to-day
    [toKey(Player.SINGLE, Enemy.COMBINED, Time.NIGHT_TO_DAY)]: [
      'nSupport',
      'nHougeki1',
      'nHougeki2',
      'airBaseInjection',
      'injectionKouku',
      'airBaseAttack',
      'kouku',
      'support',
      'openingTaisen',
      'openingAtack',
      'hougeki1',
      'hougeki2',
      'raigeki',
    ],

    // night battle
    [toKey(Player.SINGLE, Enemy.SINGLE, Time.NIGHT)]: ['nSupport', 'hougeki'],
    [toKey(Player.CTF, Enemy.SINGLE, Time.NIGHT)]: ['nSupport', 'hougeki'],
    [toKey(Player.STF, Enemy.SINGLE, Time.NIGHT)]: ['nSupport', 'hougeki'],
    [toKey(Player.SINGLE, Enemy.COMBINED, Time.NIGHT)]: ['nSupport', 'hougeki'],
    [toKey(Player.CTF, Enemy.COMBINED, Time.NIGHT)]: ['nSupport', 'hougeki'],
    [toKey(Player.STF, Enemy.COMBINED, Time.NIGHT)]: ['nSupport', 'hougeki'],
  };

  battle.getBattlePhases = (battleType) => {
    const { player, enemy, time } = battleType;
    const result = battleTypes[toKey(player, enemy, time)];

    if (!result) { throw new Error(`Bad battle type: ${JSON.stringify(battleType)}`); }
    return result;
  };

  Object.assign(window.KC3BattlePrediction.battle, battle);
}());
