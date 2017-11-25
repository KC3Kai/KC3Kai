(function () {
  const toKey = (player, enemy, time) => `${player}-${enemy}-${time}`;

  /*--------------------------------------------------------*/
  /* ------------[ ENGAGEMENT TYPE FACTORIES ]------------- */
  /*--------------------------------------------------------*/
  const { Player, Enemy, Time } = KC3BattlePrediction;
  const types = {
    [toKey(Player.SINGLE, Enemy.SINGLE, Time.DAY)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        kouku: { parseKouku },
        support: { parseSupport },
        hougeki: { parseHougeki },
        raigeki: { parseRaigeki },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        airBaseInjection: create('airBaseInjection', parseKouku),
        injectionKouku: create('injectionKouku', parseKouku),
        airBaseAttack: create('airBaseAttack', parseKouku),
        kouku: create('kouku', parseKouku),
        kouku2: create('kouku2', parseKouku),
        support: create('support', parseSupport),
        openingTaisen: create('openingTaisen', bind(parseHougeki, battleType)),
        openingAtack: create('openingAtack', bind(parseRaigeki, battleType)),
        hougeki1: create('hougeki1', bind(parseHougeki, battleType)),
        hougeki2: create('hougeki2', bind(parseHougeki, battleType)),
        hougeki3: create('hougeki3', bind(parseHougeki, battleType)),
        raigeki: create('raigeki', bind(parseRaigeki, battleType)),
      };
    },
    [toKey(Player.CTF, Enemy.SINGLE, Time.DAY)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        kouku: { parseKouku },
        support: { parseSupport },
        hougeki: { parseHougeki },
        raigeki: { parseRaigeki },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        airBaseInjection: create('airBaseInjection', parseKouku),
        injectionKouku: create('injectionKouku', parseKouku),
        airBaseAttack: create('airBaseAttack', parseKouku),
        kouku: create('kouku', parseKouku),
        kouku2: create('kouku2', parseKouku),
        support: create('support', parseSupport),
        openingTaisen: create('openingTaisen', bind(parseHougeki, battleType)),
        openingAtack: create('openingAtack', bind(parseRaigeki, battleType)),
        hougeki1: create('hougeki1', bind(parseHougeki, battleType)),
        raigeki: create('raigeki', bind(parseRaigeki, battleType)),
        hougeki2: create('hougeki2', bind(parseHougeki, battleType)),
        hougeki3: create('hougeki3', bind(parseHougeki, battleType)),
      };
    },
    [toKey(Player.STF, Enemy.SINGLE, Time.DAY)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        kouku: { parseKouku },
        support: { parseSupport },
        hougeki: { parseHougeki },
        raigeki: { parseRaigeki },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        airBaseInjection: create('airBaseInjection', parseKouku),
        injectionKouku: create('injectionKouku', parseKouku),
        airBaseAttack: create('airBaseAttack', parseKouku),
        kouku: create('kouku', parseKouku),
        kouku2: create('kouku2', parseKouku),
        support: create('support', parseSupport),
        openingTaisen: create('openingTaisen', bind(parseHougeki, battleType)),
        openingAtack: create('openingAtack', bind(parseRaigeki, battleType)),
        hougeki1: create('hougeki1', bind(parseHougeki, battleType)),
        hougeki2: create('hougeki2', bind(parseHougeki, battleType)),
        hougeki3: create('hougeki3', bind(parseHougeki, battleType)),
        raigeki: create('raigeki', bind(parseRaigeki, battleType)),
      };
    },
    [toKey(Player.SINGLE, Enemy.COMBINED, Time.DAY)]() {
      const {
        kouku: { parseKouku },
        support: { parseCombinedSupport },
        hougeki: { parseCombinedHougeki },
        raigeki: { parseCombinedRaigeki },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        airBaseInjection: create('airBaseInjection', parseKouku),
        injectionKouku: create('injectionKouku', parseKouku),
        airBaseAttack: create('airBaseAttack', parseKouku),
        kouku: create('kouku', parseKouku),
        kouku2: create('kouku2', parseKouku),
        support: create('support', parseCombinedSupport),
        openingTaisen: create('openingTaisen', parseCombinedHougeki),
        openingAtack: create('openingAtack', parseCombinedRaigeki),
        hougeki1: create('hougeki1', parseCombinedHougeki),
        raigeki: create('raigeki', parseCombinedRaigeki),
        hougeki2: create('hougeki2', parseCombinedHougeki),
        hougeki3: create('hougeki3', parseCombinedHougeki),
      };
    },
    [toKey(Player.CTF, Enemy.COMBINED, Time.DAY)]() {
      const {
        kouku: { parseKouku },
        support: { parseCombinedSupport },
        hougeki: { parseCombinedHougeki },
        raigeki: { parseCombinedRaigeki },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        airBaseInjection: create('airBaseInjection', parseKouku),
        injectionKouku: create('injectionKouku', parseKouku),
        airBaseAttack: create('airBaseAttack', parseKouku),
        kouku: create('kouku', parseKouku),
        kouku2: create('kouku2', parseKouku),
        support: create('support', parseCombinedSupport),
        openingTaisen: create('openingTaisen', parseCombinedHougeki),
        openingAtack: create('openingAtack', parseCombinedRaigeki),
        hougeki1: create('hougeki1', parseCombinedHougeki),
        hougeki2: create('hougeki2', parseCombinedHougeki),
        raigeki: create('raigeki', parseCombinedRaigeki),
        hougeki3: create('hougeki3', parseCombinedHougeki),
      };
    },
    [toKey(Player.STF, Enemy.COMBINED, Time.DAY)]() {
      const {
        kouku: { parseKouku },
        support: { parseCombinedSupport },
        hougeki: { parseCombinedHougeki },
        raigeki: { parseCombinedRaigeki },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        airBaseInjection: create('airBaseInjection', parseKouku),
        injectionKouku: create('injectionKouku', parseKouku),
        airBaseAttack: create('airBaseAttack', parseKouku),
        kouku: create('kouku', parseKouku),
        kouku2: create('kouku2', parseKouku),
        support: create('support', parseCombinedSupport),
        openingTaisen: create('openingTaisen', parseCombinedHougeki),
        openingAtack: create('openingAtack', parseCombinedRaigeki),
        hougeki1: create('hougeki1', parseCombinedHougeki),
        hougeki2: create('hougeki2', parseCombinedHougeki),
        hougeki3: create('hougeki3', parseCombinedHougeki),
        raigeki: create('raigeki', parseCombinedRaigeki),
      };
    },
    /* -------------------[ NIGHT TO DAY ]------------------- */
    [toKey(Player.SINGLE, Enemy.COMBINED, Time.NIGHT_TO_DAY)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        kouku: { parseKouku },
        support: { parseCombinedSupport },
        hougeki: { parseHougeki },
        raigeki: { parseRaigeki },
        yasen: { parseYasen },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        nSupport: create('nSupport', parseCombinedSupport),
        nHougeki1: create('nHougeki1', bind(parseYasen, battleType)),
        nHougeki2: create('nHougeki2', bind(parseYasen, battleType)),
        airBaseInjection: create('airBaseInjection', parseKouku),
        injectionKouku: create('injectionKouku', parseKouku),
        airBaseAttack: create('airBaseAttack', parseKouku),
        kouku: create('kouku', parseKouku),
        support: create('support', parseCombinedSupport),
        openingTaisen: create('openingTaisen', bind(parseHougeki, battleType)),
        openingAtack: create('openingAtack', bind(parseRaigeki, battleType)),
        hougeki1: create('hougeki1', bind(parseHougeki, battleType)),
        hougeki2: create('hougeki2', bind(parseHougeki, battleType)),
        raigeki: create('raigeki', bind(parseRaigeki, battleType)),
      };
    },
    [toKey(Player.SINGLE, Enemy.SINGLE, Time.NIGHT_TO_DAY)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        kouku: { parseKouku },
        support: { parseSupport },
        hougeki: { parseHougeki },
        raigeki: { parseRaigeki },
        yasen: { parseYasen },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        nSupport: create('nSupport', parseSupport),
        nHougeki1: create('nHougeki1', bind(parseYasen, battleType)),
        nHougeki2: create('nHougeki2', bind(parseYasen, battleType)),
        airBaseInjection: create('airBaseInjection', parseKouku),
        injectionKouku: create('injectionKouku', parseKouku),
        airBaseAttack: create('airBaseAttack', parseKouku),
        kouku: create('kouku', parseKouku),
        support: create('support', parseSupport),
        openingTaisen: create('openingTaisen', bind(parseHougeki, battleType)),
        openingAtack: create('openingAtack', bind(parseRaigeki, battleType)),
        hougeki1: create('hougeki1', bind(parseHougeki, battleType)),
        hougeki2: create('hougeki2', bind(parseHougeki, battleType)),
        raigeki: create('raigeki', bind(parseRaigeki, battleType)),
      };
    },

    /* -------------------[ NIGHT BATTLE ]------------------- */
    [toKey(Player.SINGLE, Enemy.SINGLE, Time.NIGHT)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        support: { parseSupport },
        yasen: { parseYasen },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        nSupport: create('nSupport', parseSupport),
        hougeki: create('midnight', bind(parseYasen, battleType)),
      };
    },
    [toKey(Player.CTF, Enemy.SINGLE, Time.NIGHT)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        support: { parseSupport },
        yasen: { parseYasen },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        nSupport: create('nSupport', parseSupport),
        hougeki: create('midnight', bind(parseYasen, battleType)),
      };
    },
    [toKey(Player.STF, Enemy.SINGLE, Time.NIGHT)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        support: { parseSupport },
        yasen: { parseYasen },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        nSupport: create('nSupport', parseSupport),
        hougeki: create('midnight', bind(parseYasen, battleType)),
      };
    },
    [toKey(Player.SINGLE, Enemy.COMBINED, Time.NIGHT)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        support: { parseCombinedSupport },
        yasen: { parseYasen },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        nSupport: create('nSupport', parseCombinedSupport),
        hougeki: create('midnight', bind(parseYasen, battleType)),
      };
    },
    [toKey(Player.CTF, Enemy.COMBINED, Time.NIGHT)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        support: { parseCombinedSupport },
        yasen: { parseYasen },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        nSupport: create('nSupport', parseCombinedSupport),
        hougeki: create('midnight', bind(parseYasen, battleType)),
      };
    },
    [toKey(Player.STF, Enemy.COMBINED, Time.NIGHT)](battleType) {
      const { bind } = KC3BattlePrediction;
      const {
        support: { parseCombinedSupport },
        yasen: { parseYasen },
      } = KC3BattlePrediction.battle.phases;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        nSupport: create('nSupport', parseCombinedSupport),
        hougeki: create('midnight', bind(parseYasen, battleType)),
      };
    },
  };
  /*--------------------------------------------------------*/
  /* ---------------------[ ACCESSOR ]--------------------- */
  /*--------------------------------------------------------*/

  // The engagement types are defined as factory functions to avoid file load order dependencies
  // NB: It may be worth caching instances if performance proves to be an issue
  const getEngagementType = (battleType = {}) => {
    const { types } = KC3BattlePrediction.battle.engagement;

    const key = toKey(battleType.player, battleType.enemy, battleType.time);
    if (!types[key]) {
      throw new Error(`Bad battle type: ${JSON.stringify(battleType)}`);
    }
    return types[key](battleType);
  };

  Object.assign(KC3BattlePrediction.battle.engagement, { getEngagementType, types });
}());
