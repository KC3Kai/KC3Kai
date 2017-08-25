/**
 * Public API of Battle Prediction module.
 * Must be loaded first, since it defines the module's structure.
 *
 * DO NOT modify single file module of `src/library/module/BattlePrediction.js` directly,
 * To generate the single file module, run `grunt concat:battlePredictionDev`.
 */
(function () {
  const BP = {
    fleets: {},
    battle: {
      // Phase parsers - convert phase JSON to Attacks
      phases: {
        kouku: {}, // aerial phase (航空)
        hougeki: {}, // shelling (砲撃)
        raigeki: {}, // torpedoes (雷撃)
        support: {}, // support expedition
        yasen: {}, // night battle (夜戦)
      },
      // Specify phase ordering for each battle type
      engagement: {},
    },
  };

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------

  BP.analyzeBattle = (battleData, playerDamecons, battleType) => {
    const { fleets, battle, formatResult } = KC3BattlePrediction;

    try {
      const initialFleets = fleets.getInitialState(battleData, playerDamecons);
      const result = battle.simulateBattle(battleData, initialFleets, battleType);

      return formatResult(result);
    } catch (error) {
      // Pass context explicitly, so it is recorded
      KC3Log.error(error, error.data, { battleType, battleData, playerDamecons });
      throw error;
    }
  };

  // --------------------------------------------------------------------------
  // ENUMS
  // --------------------------------------------------------------------------

  // PUBLIC ENUMS
  // -------------

  BP.Player = Object.freeze({ SINGLE: 'single', STF: 'stf', CTF: 'ctf', TCF: 'ctf' });

  BP.Enemy = Object.freeze({ SINGLE: 'single', COMBINED: 'combined' });

  BP.Time = Object.freeze({ DAY: 'day', NIGHT: 'night' });

  // INTERNAL ENUMS
  // ---------------

  // Player or enemy ship
  BP.Side = Object.freeze({ PLAYER: 'player', ENEMY: 'enemy' });

  // Ship in main or escort fleet
  BP.Role = Object.freeze({ MAIN_FLEET: 'main', ESCORT_FLEET: 'escort' });

  // Damecon API codes
  BP.Damecon = Object.freeze({ NONE: 0, TEAM: 1, GODDESS: 2 });

  // --------------------------------------------------------------------------
  // INTERNAL METHODS
  // --------------------------------------------------------------------------

  BP.extendError = (error, data) =>
    (error.data ? Object.assign(error.data, data) : Object.assign(error, { data }));

  BP.normalizeArrayIndexing = array => (array[0] === -1 ? array.slice(1) : array);

  BP.bind = (target, ...args) => target.bind(null, ...args);

  const formatFleet = fleet =>
    fleet.map(({ hp, dameConConsumed = false }) => ({ hp, dameConConsumed, sunk: hp <= 0 }));
  BP.formatResult = (fleets) => {
    return {
      playerMain: formatFleet(fleets.player.main),
      playerEscort: formatFleet(fleets.player.escort),
      enemyMain: formatFleet(fleets.enemy.main),
      enemyEscort: formatFleet(fleets.enemy.escort),
    };
  };

  BP.validateEnum = (enumObj, value) => {
    // Ideally this should use Object.values(), but it was only introduced in Chrome 54
    return Object.keys(enumObj).some(key => enumObj[key] === value);
  };

  window.KC3BattlePrediction = BP;
}());

(function () {
  const battle = {};
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  battle.simulateBattle = (battleData, initalFleets, battleType) => {
    const { parseBattle, simulateAttack } = KC3BattlePrediction.battle;

    const attacks = parseBattle(battleType, battleData);
    return attacks.reduce(simulateAttack, initalFleets);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  /* -----------------[ SIMULATE ATTACKS ]----------------- */

  battle.simulateAttack = (fleets, { target, damage }) => {
    const { bind, fleets: { update, damageShip } } = KC3BattlePrediction;

    return update(fleets, target, bind(damageShip, damage));
  };

  /* -----------------[ PARSE BATTLE DATA ]---------------- */

  battle.parseBattle = (battleType, battleData) => {
    const { accumulateAttacks, parsePhases } = KC3BattlePrediction.battle;

    return accumulateAttacks(parsePhases(battleType, battleData));
  };

  battle.parsePhases = (battleType, battleData) => {
    const { getBattlePhases } = KC3BattlePrediction.battle.engagement;

    return getBattlePhases(battleType).map(parsePhase => parsePhase(battleData));
  };

  battle.accumulateAttacks = phases =>
    phases.reduce((attacks, phase) => attacks.concat(phase), []);

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.battle, battle);
}());

(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  // Create a Fleets object with the state of the player and enemy fleets at battle start
  const getInitialState = ({ api_nowhps, api_maxhps, api_nowhps_combined, api_maxhps_combined }, playerDamecons) => {
    const { Role } = KC3BattlePrediction;
    const { getFleetShips, addDamecons, createFleets } = KC3BattlePrediction.fleets;

    const mainFleets = getFleetShips(api_nowhps, api_maxhps);
    const escortFleets = getFleetShips(api_nowhps_combined, api_maxhps_combined);

    return createFleets(
      addDamecons(Role.MAIN_FLEET, playerDamecons, mainFleets.player),
      mainFleets.enemy,
      addDamecons(Role.ESCORT_FLEET, playerDamecons, escortFleets.player),
      escortFleets.enemy
    );
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ----------------------[ SHIPS ]----------------------- */

  const getFleetShips = (nowhps, maxhps) => {
    const { normalizeHps, convertToShips, splitSides } = KC3BattlePrediction.fleets;

    // shortcircuit if neither side has a fleet
    if (!nowhps && !maxhps) { return { player: [], enemy: [] }; }

    return splitSides(
      convertToShips(normalizeHps(nowhps), normalizeHps(maxhps))
    );
  };

  const normalizeHps = (hps) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;

    // Transform to 0-based indexing
    const result = normalizeArrayIndexing(hps);

    // Sometimes empty ship slots at the end of the array get omitted
    if (result.length % 6 === 0) {
      return result;
    }
    // In that case, we should pad the array with empty slots
    const emptySlotCount = 6 - (result.length % 6);
    return result.concat(new Array(emptySlotCount).fill(-1));
  };

  const convertToShips = (nowHps, maxHps) => {
    const { createShip } = KC3BattlePrediction.fleets;

    if (nowHps.length !== maxHps.length) {
      throw new Error(`Length of nowhps (${nowHps.length}) and maxhps (${maxHps.length}) do not match`);
    }

    return nowHps.map((currentHp, index) => createShip(currentHp, maxHps[index]));
  };

  const isFleetNotEmpty = ships => ships.some(ship => !!ship);
  const splitSides = (ships) => {
    if (ships.length !== 6 && ships.length !== 12) {
      throw new Error(`Expected 6 or 12 ships, but got ${ships.length}`);
    }

    const player = ships.slice(0, 6);
    const enemy = ships.slice(6, 12);

    return {
      player: isFleetNotEmpty(player) ? player : [],
      enemy,
    };
  };

  /* ---------------------[ DAMECONS ]--------------------- */

  const addDamecons = (role, damecons, ships) => {
    const { getDamecons, installDamecon } = KC3BattlePrediction.fleets;

    const dameconCodes = getDamecons(role, damecons);

    return ships.map((ship, index) => installDamecon(dameconCodes[index], ship));
  };

  const getDamecons = (role, damecons) => {
    const { Role } = KC3BattlePrediction;

    switch (role) {
      case Role.MAIN_FLEET:
        return damecons.slice(0, 6);
      case Role.ESCORT_FLEET:
        return damecons.slice(6, 12);
      default:
        throw new Error(`Bad role: ${role}`);
    }
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    getInitialState,
    // Internal
    getFleetShips,
    normalizeHps,
    convertToShips,
    splitSides,

    addDamecons,
    getDamecons,
  });
}());

(function () {
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  const getBattlePhases = (battleType) => {
    const { getEngagementType, getPhaseParsers } = KC3BattlePrediction.battle.engagement;

    return getPhaseParsers(getEngagementType(battleType));
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  const getPhaseParsers = (engagementInstance) => {
    // getOwnPropertyNames should guarantee (string) keys are returned in declaration order
    return Object.getOwnPropertyNames(engagementInstance).map(phase => engagementInstance[phase]);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.engagement, {
    // Public
    getBattlePhases,
    // Internal
    getPhaseParsers,
  });
}());

(function () {
  const toKey = (player, enemy, time) => `${player}-${enemy}-${time}`;

  /*--------------------------------------------------------*/
  /* ------------[ ENGAGEMENT TYPE FACTORIES ]------------- */
  /*--------------------------------------------------------*/
  const { Player, Enemy, Time } = KC3BattlePrediction;
  const types = {
    [toKey(Player.SINGLE, Enemy.SINGLE, Time.DAY)]() {
      const { Role, bind } = KC3BattlePrediction;
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
        openingTaisen: create('openingTaisen', bind(parseHougeki, Role.MAIN_FLEET)),
        openingAtack: create('openingAtack', bind(parseRaigeki, Role.MAIN_FLEET)),
        hougeki1: create('hougeki1', bind(parseHougeki, Role.MAIN_FLEET)),
        hougeki2: create('hougeki2', bind(parseHougeki, Role.MAIN_FLEET)),
        hougeki3: create('hougeki3', bind(parseHougeki, Role.MAIN_FLEET)),
        raigeki: create('raigeki', bind(parseRaigeki, Role.MAIN_FLEET)),
      };
    },
    [toKey(Player.CTF, Enemy.SINGLE, Time.DAY)]() {
      const { Role, bind } = KC3BattlePrediction;
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
        openingTaisen: create('openingTaisen', bind(parseHougeki, Role.ESCORT_FLEET)),
        openingAtack: create('openingAtack', bind(parseRaigeki, Role.ESCORT_FLEET)),
        hougeki1: create('hougeki1', bind(parseHougeki, Role.ESCORT_FLEET)),
        raigeki: create('raigeki', bind(parseRaigeki, Role.ESCORT_FLEET)),
        hougeki2: create('hougeki2', bind(parseHougeki, Role.MAIN_FLEET)),
        hougeki3: create('hougeki3', bind(parseHougeki, Role.MAIN_FLEET)),
      };
    },
    [toKey(Player.STF, Enemy.SINGLE, Time.DAY)]() {
      const { Role, bind } = KC3BattlePrediction;
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
        openingTaisen: create('openingTaisen', bind(parseHougeki, Role.ESCORT_FLEET)),
        openingAtack: create('openingAtack', bind(parseRaigeki, Role.ESCORT_FLEET)),
        hougeki1: create('hougeki1', bind(parseHougeki, Role.MAIN_FLEET)),
        hougeki2: create('hougeki2', bind(parseHougeki, Role.MAIN_FLEET)),
        hougeki3: create('hougeki3', bind(parseHougeki, Role.ESCORT_FLEET)),
        raigeki: create('raigeki', bind(parseRaigeki, Role.ESCORT_FLEET)),
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

    /* -------------------[ NIGHT BATTLE ]------------------- */
    [toKey(Player.SINGLE, Enemy.SINGLE, Time.NIGHT)]() {
      const { Role, bind } = KC3BattlePrediction;
      const { parseYasen } = KC3BattlePrediction.battle.phases.yasen;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        hougeki: create('midnight', bind(parseYasen, Role.MAIN_FLEET)),
      };
    },
    [toKey(Player.CTF, Enemy.SINGLE, Time.NIGHT)]() {
      const { Role, bind } = KC3BattlePrediction;
      const { parseYasen } = KC3BattlePrediction.battle.phases.yasen;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        hougeki: create('midnight', bind(parseYasen, Role.ESCORT_FLEET)),
      };
    },
    [toKey(Player.STF, Enemy.SINGLE, Time.NIGHT)]() {
      const { Role, bind } = KC3BattlePrediction;
      const { parseYasen } = KC3BattlePrediction.battle.phases.yasen;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        hougeki: create('midnight', bind(parseYasen, Role.ESCORT_FLEET)),
      };
    },
    [toKey(Player.SINGLE, Enemy.COMBINED, Time.NIGHT)]() {
      const { Role, bind } = KC3BattlePrediction;
      const { parseYasen } = KC3BattlePrediction.battle.phases.yasen;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        hougeki: create('midnight', bind(parseYasen, Role.MAIN_FLEET)),
      };
    },
    [toKey(Player.CTF, Enemy.COMBINED, Time.NIGHT)]() {
      const { Role, bind } = KC3BattlePrediction;
      const { parseYasen } = KC3BattlePrediction.battle.phases.yasen;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        hougeki: create('midnight', bind(parseYasen, Role.ESCORT_FLEET)),
      };
    },
    [toKey(Player.STF, Enemy.COMBINED, Time.NIGHT)]() {
      const { Role, bind } = KC3BattlePrediction;
      const { parseYasen } = KC3BattlePrediction.battle.phases.yasen;
      const { create } = KC3BattlePrediction.battle.engagement.parserFactory;

      return {
        hougeki: create('midnight', bind(parseYasen, Role.ESCORT_FLEET)),
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
    return types[key]();
  };

  Object.assign(KC3BattlePrediction.battle.engagement, { getEngagementType, types });
}());

(function () {
  /*--------------------------------------------------------*/
  /* ------------------[ PARSER FACTORY ]------------------ */
  /*--------------------------------------------------------*/
  const parseAs = (parseFunc, json) => (json ? parseFunc(json) : []);

  const parserFactory = (() => {
    const parsers = {
      airBaseInjection(kouku) {
        return ({ api_air_base_injection }) => parseAs(kouku, api_air_base_injection);
      },
      injectionKouku(kouku) {
        return ({ api_injection_kouku }) => parseAs(kouku, api_injection_kouku);
      },
      airBaseAttack(kouku) {
        return ({ api_air_base_attack = [] }) =>
          api_air_base_attack
            .map(wave => parseAs(kouku, wave))
            .reduce((result, attacks) => result.concat(attacks), []);
      },
      kouku(kouku) {
        return ({ api_kouku }) => parseAs(kouku, api_kouku);
      },
      kouku2(kouku) {
        return ({ api_kouku2 }) => parseAs(kouku, api_kouku2);
      },
      support(support) {
        return ({ api_support_info }) => parseAs(support, api_support_info);
      },
      openingTaisen(hougeki) {
        return ({ api_opening_taisen }) => parseAs(hougeki, api_opening_taisen);
      },
      openingAtack(raigeki) {
        return ({ api_opening_atack }) => parseAs(raigeki, api_opening_atack);
      },
      hougeki1(hougeki) {
        return ({ api_hougeki1 }) => parseAs(hougeki, api_hougeki1);
      },
      hougeki2(hougeki) {
        return ({ api_hougeki2 }) => parseAs(hougeki, api_hougeki2);
      },
      hougeki3(hougeki) {
        return ({ api_hougeki3 }) => parseAs(hougeki, api_hougeki3);
      },
      raigeki(raigeki) {
        return ({ api_raigeki }) => parseAs(raigeki, api_raigeki);
      },
      midnight(yasen) {
        const { Role, bind } = KC3BattlePrediction;

        const getEnemyRole = (api_active_deck) => {
          // active deck isn't specified for enemy single fleet
          if (!api_active_deck) { return Role.MAIN_FLEET; }

          switch (api_active_deck[1]) {
            case 1:
              return Role.MAIN_FLEET;
            case 2:
              return Role.ESCORT_FLEET;
            default:
              throw new Error(`Bad api_active_deck: ${api_active_deck}`);
          }
        };

        return ({ api_hougeki, api_active_deck }) => {
          return parseAs(bind(yasen, getEnemyRole(api_active_deck)), api_hougeki);
        };
      },
    };

    return {
      create(parserName, ...args) {
        return parsers[parserName](...args);
      },
    };
  })();

  Object.assign(KC3BattlePrediction.battle.engagement, { parserFactory });
}());

(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseHougeki = (playerRole, battleData) => {
    const { parseTargets, parseDamages, zipAttacks } = KC3BattlePrediction.battle.phases.hougeki;

    return zipAttacks(parseTargets(playerRole, battleData), parseDamages(battleData));
  };

  const parseCombinedHougeki = (battleData) => {
    const { parseCombinedTargets, parseDamages, zipAttacks }
      = KC3BattlePrediction.battle.phases.hougeki;

    return zipAttacks(parseCombinedTargets(battleData), parseDamages(battleData));
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ---------------------[ TARGETS ]---------------------- */

  const parseTargets = (playerRole, { api_df_list } = {}) => {
    const { normalizeArrayIndexing, bind } = KC3BattlePrediction;
    const { normalizeTargetFormat, convertToTarget } = KC3BattlePrediction.battle.phases.hougeki;

    if (!api_df_list) { throw new Error('No api_df_list in battle data'); }

    const targets = normalizeTargetFormat(normalizeArrayIndexing(api_df_list));
    return targets.map(bind(convertToTarget, playerRole));
  };

  // Unpack target index from the array KCSAPI uses for each attack
  const normalizeTargetFormat = (dfList) => {
    return dfList.map((indexes) => {
      // Both indexes for a double attack should be the same
      if (!indexes.every(x => x === indexes[0])) {
        throw new Error(`Bad index: [${indexes}]`);
      }
      return indexes[0];
    });
  };

  const convertToTarget = (playerRole, targetIndex) => {
    const { Side, Role } = KC3BattlePrediction;

    if (targetIndex < 1 || targetIndex > 12 || targetIndex !== Math.floor(targetIndex)) {
      throw new Error(`Bad target index: ${targetIndex}`);
    }

    // Note: KCSAPI uses 1-based indexes, so we need to convert to 0-based indexing
    if (targetIndex <= 6) {
      return { side: Side.PLAYER, role: playerRole, position: targetIndex - 1 };
    }
    return { side: Side.ENEMY, role: Role.MAIN_FLEET, position: targetIndex - 7 };
  };

  /* --------------[ COMBINED FLEET TARGETS ]-------------- */

  const parseCombinedTargets = ({ api_df_list, api_at_eflag } = {}) => {
    const { normalizeArrayIndexing: normalize } = KC3BattlePrediction;
    const {
      parseCombinedTargetIndexes: parseIndexes,
      parseCombinedTargetSides: parseSides,
      zipCombinedTargets,
    } = KC3BattlePrediction.battle.phases.hougeki;

    if (!api_df_list) { throw new Error('No api_df_list in battle data'); }
    if (!api_at_eflag) { throw new Error('No api_at_eflag in battle data'); }

    const indexes = parseIndexes(normalize(api_df_list));
    const sides = parseSides(normalize(api_at_eflag));

    return zipCombinedTargets(indexes, sides);
  };

  const parseCombinedTargetIndexes = (dfList) => {
    const { normalizeTargetFormat, convertToCombinedTargetIndex }
      = KC3BattlePrediction.battle.phases.hougeki;

    const targetIndexes = normalizeTargetFormat(dfList);
    return targetIndexes.map(convertToCombinedTargetIndex);
  };

  const convertToCombinedTargetIndex = (targetIndex) => {
    const { Role } = KC3BattlePrediction;

    if (targetIndex < 1 || targetIndex > 12 || targetIndex !== Math.floor(targetIndex)) {
      throw new Error(`Bad target index: ${targetIndex}`);
    }

    // KCSAPI uses 1-based indexes, so we need to convert to 0-base
    return targetIndex <= 6
      ? { role: Role.MAIN_FLEET, position: targetIndex - 1 }
      : { role: Role.ESCORT_FLEET, position: targetIndex - 7 };
  };

  const parseCombinedTargetSides = (atEFlags) => {
    const { Side } = KC3BattlePrediction;

    return atEFlags.map((eFlag) => {
      switch (eFlag) {
        case 0: return Side.ENEMY;
        case 1: return Side.PLAYER;
        default: throw new Error(`Bad eFlag: ${eFlag}`);
      }
    });
  };

  const zipCombinedTargets = (indexes, sides) => {
    if (indexes.length !== sides.length) {
      throw new Error(`Mismatched number of indexes (${indexes.length}) and sides (${sides.length})`);
    }
    return indexes.map(({ role, position }, i) => {
      const side = sides[i];
      return { side, role, position };
    });
  };

  /* ----------------------[ DAMAGE ]---------------------- */

  const parseDamages = ({ api_damage } = {}) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;
    const { convertToDamage } = KC3BattlePrediction.battle.phases.hougeki;

    if (!api_damage) { throw new Error('No api_damage in battle data'); }

    const damages = normalizeArrayIndexing(api_damage);
    return damages.map(convertToDamage);
  };

  const convertToDamage = (damages) => {
    return damages.reduce((sum, x) => sum + x, 0);
  };

  /* ---------------------[ ATTACKS ]---------------------- */

  const zipAttacks = (targets, damages) => {
    const { createAttack } = KC3BattlePrediction.battle;

    if (targets.length !== damages.length) { throw new Error('Mismatched number of targets and damages'); }

    return targets.reduce((result, { side, role, position }, index) => {
      const attack = createAttack(side, role, position, damages[index]);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, {
    // Public
    parseHougeki,
    parseCombinedHougeki,
    // Internal
    parseTargets,
    normalizeTargetFormat,
    convertToTarget,

    parseCombinedTargets,
    parseCombinedTargetIndexes,
    convertToCombinedTargetIndex,
    parseCombinedTargetSides,
    zipCombinedTargets,

    parseDamages,
    convertToDamage,

    zipAttacks,
  });
}());

// Parser for 航空 (aerial combat) phase
(function () {
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  const parseKouku = ({ api_stage3, api_stage3_combined }) => {
    const { getAttacksToMainOrEscort } = KC3BattlePrediction.battle.phases.kouku;

    const mainAttacks = api_stage3 ? getAttacksToMainOrEscort('main', api_stage3) : [];
    const escortAttacks = api_stage3_combined ? getAttacksToMainOrEscort('escort', api_stage3_combined) : [];

    return mainAttacks.concat(escortAttacks);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  const getAttacksToMainOrEscort = (role, { api_fdam, api_edam }) => {
    const { parseDamageArray } = KC3BattlePrediction.battle.phases.kouku;

    const playerAttacks = api_fdam ? parseDamageArray('player', role, api_fdam) : [];
    const enemyAttacks = api_edam ? parseDamageArray('enemy', role, api_edam) : [];

    return playerAttacks.concat(enemyAttacks);
  };

  const parseDamageArray = (side, role, damageArray) => {
    const { normalizeArrayIndexing, battle: { createAttack } } = KC3BattlePrediction;

    const damages = normalizeArrayIndexing(damageArray);
    return damages.reduce((result, damage, position) => {
      const attack = createAttack(side, role, position, damage);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.kouku, {
    parseKouku,
    getAttacksToMainOrEscort,
    parseDamageArray,
  });
}());

(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseRaigeki = (playerRole, { api_fdam, api_edam } = {}) => {
    const { Side, Role } = KC3BattlePrediction;
    const { parseDamageArray, normalizeDamageArray: normalize }
      = KC3BattlePrediction.battle.phases.raigeki;

    const playerAttacks = parseDamageArray(Side.PLAYER, playerRole, normalize(api_fdam));
    const enemyAttacks = parseDamageArray(Side.ENEMY, Role.MAIN_FLEET, normalize(api_edam));

    return playerAttacks.concat(enemyAttacks);
  };

  const parseCombinedRaigeki = ({ api_fdam, api_edam }) => {
    const { Side } = KC3BattlePrediction;
    const { parseCombinedSide, normalizeDamageArray: normalize }
      = KC3BattlePrediction.battle.phases.raigeki;

    const playerAttacks = parseCombinedSide(Side.PLAYER, normalize(api_fdam));
    const enemyAttacks = parseCombinedSide(Side.ENEMY, normalize(api_edam));

    return playerAttacks.concat(enemyAttacks);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const normalizeDamageArray = (damageArray) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;

    return damageArray ? normalizeArrayIndexing(damageArray) : [];
  };

  const parseCombinedSide = (side, combinedDamageArray) => {
    const { Role } = KC3BattlePrediction;
    const { splitCombinedDamageArray, parseDamageArray }
      = KC3BattlePrediction.battle.phases.raigeki;

    const { main, escort } = splitCombinedDamageArray(combinedDamageArray);
    const mainFleetAttacks = parseDamageArray(side, Role.MAIN_FLEET, main);
    const escortFleetAttacks = parseDamageArray(side, Role.ESCORT_FLEET, escort);

    return mainFleetAttacks.concat(escortFleetAttacks);
  };

  const splitCombinedDamageArray = (combinedDamageArray) => {
    if (combinedDamageArray.length !== 12) {
      throw new Error(`Expected array of length 12, but was ${combinedDamageArray.length}`);
    }
    return {
      main: combinedDamageArray.slice(0, 6),
      escort: combinedDamageArray.slice(6, 12),
    };
  };

  const parseDamageArray = (side, role, damageArray) => {
    const { createAttack } = KC3BattlePrediction.battle;

    return damageArray.reduce((result, damage, position) => {
      const attack = createAttack(side, role, position, damage);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.raigeki, {
    // Public
    parseRaigeki,
    parseCombinedRaigeki,
    // Internal
    normalizeDamageArray,
    parseCombinedSide,
    splitCombinedDamageArray,
    parseDamageArray,
  });
}());

(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseSupport = ({ api_support_airatack, api_support_hourai } = {}) => {
    const { kouku: { parseKouku }, support: { parseHourai } } = KC3BattlePrediction.battle.phases;

    // Misspelling is deliberate - it exists in KCSAPI json
    if (api_support_airatack) {
      return parseKouku(api_support_airatack);
    } else if (api_support_hourai) {
      return parseHourai(api_support_hourai);
    }
    throw new Error('Expected api_support_airatack or api_support_hourai');
  };

  const parseCombinedSupport = ({ api_support_airatack, api_support_hourai } = {}) => {
    const { parseCombinedDamageArray } = KC3BattlePrediction.battle.phases.support;

    if (api_support_hourai) {
      const { api_damage } = api_support_hourai;
      return parseCombinedDamageArray(api_damage);
    } else if (api_support_airatack) {
      const { api_stage3 } = api_support_airatack;
      return api_stage3 ? parseCombinedDamageArray(api_stage3.api_edam) : [];
    }
    throw new Error('Expected api_support_airatack or api_support_hourai');
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const parseHourai = ({ api_damage }) => {
    const { Role, normalizeArrayIndexing } = KC3BattlePrediction;
    const { parseDamageArray } = KC3BattlePrediction.battle.phases.support;

    return parseDamageArray(Role.MAIN_FLEET, normalizeArrayIndexing(api_damage));
  };

  const parseDamageArray = (role, damageArray) => {
    const { Side, battle: { createAttack } } = KC3BattlePrediction;

    return damageArray.reduce((result, damage, position) => {
      const attack = createAttack(Side.ENEMY, role, position, damage);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  const parseCombinedDamageArray = (api_damage) => {
    const { Role, normalizeArrayIndexing } = KC3BattlePrediction;
    const { parseDamageArray } = KC3BattlePrediction.battle.phases.support;

    if (!api_damage) { return []; }
    const combinedDamageArray = normalizeArrayIndexing(api_damage);
    if (combinedDamageArray.length !== 12) {
      throw new Error(`Expected length 12, but got ${combinedDamageArray.length}`);
    }

    const mainFleetAttacks = parseDamageArray(Role.MAIN_FLEET, combinedDamageArray.slice(0, 6));
    const escortFleetAttacks = parseDamageArray(Role.ESCORT_FLEET, combinedDamageArray.slice(6, 12));

    return mainFleetAttacks.concat(escortFleetAttacks);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.support, {
    // Public
    parseSupport,
    parseCombinedSupport,
    // Internal
    parseHourai,
    parseDamageArray,
    parseCombinedDamageArray,
  });
}());

(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseYasen = (playerRole, enemyRole, battleData) => {
    const { parseTargets, parseDamages, zipAttacks } = KC3BattlePrediction.battle.phases.yasen;

    const targets = parseTargets({ player: playerRole, enemy: enemyRole }, battleData);
    const damages = parseDamages(battleData);

    return zipAttacks(targets, damages);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ---------------------[ TARGETS ]---------------------- */

  const parseTargets = (roles, { api_df_list } = {}) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;
    const { normalizeTargetJson, convertToTarget } = KC3BattlePrediction.battle.phases.yasen;

    if (!api_df_list) { return []; }

    return normalizeArrayIndexing(api_df_list).map((targetJson) => {
      return convertToTarget(roles, normalizeTargetJson(targetJson));
    });
  };

  const normalizeTargetJson = (targetArray = []) => {
    // regular attack
    if (targetArray.length === 1) {
      return targetArray[0];
    }
    // double attack + torpedo cut-in
    if (targetArray.length === 2 && targetArray[0] === targetArray[1]) {
      return targetArray[0];
    }
    // Gun cut-in
    if (targetArray.length === 3 && targetArray[1] === -1 && targetArray[2] === -1) {
      return targetArray[0];
    }
    throw new Error(`Bad target json: [${targetArray}]`);
  };

  const convertToTarget = (roles, targetIndex) => {
    const { Side } = KC3BattlePrediction;

    if (targetIndex >= 7) {
      return { side: Side.ENEMY, role: roles.enemy, position: targetIndex - 7 };
    }
    return { side: Side.PLAYER, role: roles.player, position: targetIndex - 1 };
  };

  /* ---------------------[ DAMAGES ]---------------------- */

  const parseDamages = ({ api_damage } = {}) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;
    const { convertToDamage } = KC3BattlePrediction.battle.phases.yasen;

    if (!api_damage) { return []; }

    return normalizeArrayIndexing(api_damage).map(convertToDamage);
  };

  const convertToDamage = (damageArray) => {
    return damageArray.reduce((sum, damage) => {
      return damage > 0 ? sum + damage : sum;
    }, 0);
  };

  /* ---------------------[ ATTACKS ]---------------------- */

  const zipAttacks = (targets, damages) => {
    const { createAttack } = KC3BattlePrediction.battle;

    if (targets.length !== damages.length) {
      throw new Error(`Mismatch between targets (${targets.length}) and damages (${damages.length})`);
    }

    return targets.reduce((result, { side, role, position }, index) => {
      const attack = createAttack(side, role, position, damages[index]);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.yasen, {
    // Public
    parseYasen,
    // Internal
    parseTargets,
    normalizeTargetJson,
    convertToTarget,

    parseDamages,
    convertToDamage,

    zipAttacks,
  });
}());

(function () {
  const createAttack = (side, role, position, damage) => {
    const { createTarget, normalizeDamage } = KC3BattlePrediction.battle;

    return Object.freeze({
      target: createTarget(side, role, position),
      damage: normalizeDamage(damage),
    });
  };

  // KCSAPI adds +0.1 to damage values to indicate flagship protection activated
  const normalizeDamage = damage => Math.floor(damage);

  Object.assign(window.KC3BattlePrediction.battle, {
    // Public
    createAttack,
    // Internal
    normalizeDamage,
  });
}());

(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const createFleets = (...fleets) => {
    const { removeEmptyShips } = KC3BattlePrediction.fleets;

    const [playerMain, enemyMain, playerEscort, enemyEscort] = fleets.map(removeEmptyShips);

    return {
      player: { main: playerMain, escort: playerEscort },
      enemy: { main: enemyMain, escort: enemyEscort },
    };
  };

  const update = (fleets, target, updateShip) => {
    const { extendError } = KC3BattlePrediction;
    const { isTargetInFleets, applyUpdate } = KC3BattlePrediction.fleets;

    if (!isTargetInFleets(target, fleets)) {
      throw extendError(new Error('Bad target'), { target, fleets });
    }

    return applyUpdate(target, updateShip, fleets);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const removeEmptyShips = ships => ships.filter(ship => !!ship);

  const isTargetInFleets = ({ side, role, position }, fleets) =>
    !!(fleets[side] && fleets[side][role] && fleets[side][role][position]);

  const applyUpdate = ({ side, role, position }, updateShip, fleets) => {
    const { cloneFleets } = KC3BattlePrediction.fleets;

    // NB: Cloning is necessary to preserve function purity
    // Can be replaced by assignment if performance is an issue, though this may cause issues with logging
    const result = cloneFleets(fleets);
    result[side][role][position] = updateShip(fleets[side][role][position]);

    return result;
  };

  const cloneFleets = fleets => JSON.parse(JSON.stringify(fleets));

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    createFleets,
    update,
    // Internal
    removeEmptyShips,

    isTargetInFleets,
    applyUpdate,
    cloneFleets,
  });
}());

(function () {
  const EMPTY_SLOT = null;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const createShip = (hp, maxHp) => (hp !== -1 ? { hp, maxHp } : EMPTY_SLOT);

  const installDamecon = (damecon, ship) =>
    (ship !== EMPTY_SLOT ? Object.assign({}, ship, { damecon }) : ship);

  const damageShip = (damage, ship) => {
    const { dealDamage, tryDamecon } = KC3BattlePrediction.fleets;

    const result = dealDamage(damage, ship);

    return result.hp <= 0 ? tryDamecon(result) : result;
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const dealDamage = (damage, ship) => Object.assign({}, ship, { hp: ship.hp - damage });

  const tryDamecon = (ship) => {
    const { Damecon } = KC3BattlePrediction;

    switch (ship.damecon) {
      case Damecon.TEAM:
        return Object.assign({}, ship, {
          hp: Math.floor(ship.maxHp * 0.2),
          damecon: Damecon.NONE,
          dameConConsumed: true,
        });
      case Damecon.GODDESS:
        return Object.assign({}, ship, {
          hp: ship.maxHp,
          damecon: Damecon.NONE,
          dameConConsumed: true,
        });
      default:
        return ship;
    }
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    createShip,
    installDamecon,
    damageShip,
    // Internals
    dealDamage,
    tryDamecon,
  });
}());

(function () {
  const createTarget = (side, role, position) => {
    const { validateEnum, battle: { validatePosition }, Side, Role } = KC3BattlePrediction;

    if (!validateEnum(Side, side)) { throw new Error(`Bad side: ${side}`); }
    if (!validateEnum(Role, role)) { throw new Error(`Bad role: ${role}`); }
    if (!validatePosition(position)) { throw new Error(`Bad position: ${position}`); }

    return Object.freeze({ side, role, position });
  };

  // Sanity check position index - should be an integer in range [0,6)
  const validatePosition = (position) => {
    return position >= 0 && position < 6 && position === Math.floor(position);
  };

  Object.assign(window.KC3BattlePrediction.battle, { createTarget, validatePosition });
}());
