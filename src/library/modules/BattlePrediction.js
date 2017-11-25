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
    // Rank prediction
    rank: {
      airRaid: {},
      battle: {},
    },
    // MVP prediction
    mvp: {},
  };

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------

  BP.analyzeBattle = (battleData, playerDamecons, battleType) => {
    const { fleets, battle, formatResult } = KC3BattlePrediction;

    try {
      const initialFleets = fleets.getInitialState(battleData, playerDamecons);
      const resultFleets = battle.simulateBattle(battleData, initialFleets, battleType);

      return formatResult(initialFleets, resultFleets);
    } catch (error) {
      // Pass context explicitly, so it is recorded
      KC3Log.error(error, error.data, { battleType, battleData, playerDamecons });
      throw error;
    }
  };

  BP.predictRank = (apiName, battleData, battleResult) => {
    const { parseStartJson, normalizeFleets, getRankPredictor } = KC3BattlePrediction.rank;

    return getRankPredictor(apiName).predict(
      normalizeFleets(parseStartJson(battleData), battleData),
      normalizeFleets(battleResult, battleData)
    );
  };

  BP.predictMvp = (dayResult, nightResult) => {
    const { combineResults, getHighestDamage } = KC3BattlePrediction.mvp;

    const { playerMain, playerEscort } = combineResults(dayResult, nightResult);
    return {
      playerMain: getHighestDamage(playerMain),
      playerEscort: getHighestDamage(playerEscort),
    };
  };

  // --------------------------------------------------------------------------
  // ENUMS
  // --------------------------------------------------------------------------

  // PUBLIC ENUMS
  // -------------

  BP.Player = Object.freeze({ SINGLE: 'single', STF: 'stf', CTF: 'ctf', TCF: 'ctf' });

  BP.Enemy = Object.freeze({ SINGLE: 'single', COMBINED: 'combined' });

  BP.Time = Object.freeze({ DAY: 'day', NIGHT: 'night', NIGHT_TO_DAY: 'night-to-day' });

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

  BP.EMPTY_SLOT = -1;

  BP.extendError = (error, data) =>
    (error.data ? Object.assign(error.data, data) : Object.assign(error, { data }));

  BP.normalizeArrayIndexing = array => (array[0] === -1 ? array.slice(1) : array);

  BP.bind = (target, ...args) => target.bind(null, ...args);

  BP.validateEnum = (enumObj, value) => {
    // Ideally this should use Object.values(), but it was only introduced in Chrome 54
    return Object.keys(enumObj).some(key => enumObj[key] === value);
  };

  /* ---------------------[ ZIP WITH ]--------------------- */

  const parseArgs = (args) => {
    const iteratee = args.slice(-1)[0];

    return typeof iteratee === 'function'
      ? { arrays: args.slice(0, -1), iteratee }
      : { arrays: args, iteratee: (...elements) => elements };
  };
  const getElements = (arrays, index) => arrays.map(array => array[index]);
  const getLongestArray = arrays =>
    arrays.reduce((result, array) => (array.length > result ? array.length : result), 0);
  // See: http://devdocs.io/lodash~4/index#zipWith
  BP.zipWith = (...args) => {
    const { arrays, iteratee } = parseArgs(args);

    const length = getLongestArray(arrays);
    const result = [];
    for (let i = 0; i < length; i += 1) {
      const elements = getElements(arrays, i);
      result.push(iteratee(...elements));
    }

    return result;
  };

  window.KC3BattlePrediction = BP;
}());

(function () {
  const battle = {};
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  battle.simulateBattle = (battleData, initalFleets, battleType) => {
    const { battle: { parseBattle }, fleets: { simulateAttack } } = KC3BattlePrediction;

    return parseBattle(battleType, battleData).reduce(simulateAttack, initalFleets);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

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
  const getInitialState = ({ api_f_nowhps, api_f_maxhps, api_e_nowhps, api_e_maxhps,
      api_f_nowhps_combined, api_f_maxhps_combined, api_e_nowhps_combined, api_e_maxhps_combined },
      playerDamecons) => {
    const { Role } = KC3BattlePrediction;
    const { getFleetShips, addDamecons, createFleets } = KC3BattlePrediction.fleets;

    const mainFleets = getFleetShips(api_f_nowhps, api_f_maxhps, api_e_nowhps, api_e_maxhps);
    const escortFleets = getFleetShips(api_f_nowhps_combined, api_f_maxhps_combined, api_e_nowhps_combined, api_e_maxhps_combined);

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

  const getFleetShips = (nowhpsPlayer, maxhpsPlayer, nowhpsEnemy, maxhpsEnemy) => {
    const { normalizeHps, convertToShips } = KC3BattlePrediction.fleets;

    // short-circuit if neither side has a fleet
    if (!nowhpsPlayer && !maxhpsPlayer && !nowhpsEnemy && !maxhpsEnemy) { return { player: [], enemy: [] }; }

    return {
      player: convertToShips(normalizeHps(nowhpsPlayer), normalizeHps(maxhpsPlayer)),
      enemy: convertToShips(normalizeHps(nowhpsEnemy), normalizeHps(maxhpsEnemy)),
    };
  };

  const normalizeHps = (hps = []) => {
    const { EMPTY_SLOT } = KC3BattlePrediction;

    if (hps.length < 6) {
      const emptySlotCount = 6 - (hps.length % 6);
      return hps.concat(new Array(emptySlotCount).fill(EMPTY_SLOT));
    }
    return hps;
  };

  const convertToShips = (nowHps, maxHps) => {
    const { createShip } = KC3BattlePrediction.fleets;

    if (nowHps.length !== maxHps.length) {
      throw new Error(`Length of nowhps (${nowHps.length}) and maxhps (${maxHps.length}) do not match`);
    }

    return nowHps.map((currentHp, index) => createShip(currentHp, maxHps[index]));
  };

  const isFleetNotEmpty = ships => ships.some(ship => ship !== KC3BattlePrediction.EMPTY_SLOT);
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
        return damecons;
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
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const combineResults = (dayFleets, nightFleets) => {
    const { combineFleetResults } = KC3BattlePrediction.mvp;

    if (!nightFleets) { return dayFleets; }
    if (!dayFleets) { return nightFleets; }
    return {
      playerMain: combineFleetResults(dayFleets.playerMain, nightFleets.playerMain),
      playerEscort: combineFleetResults(dayFleets.playerEscort, nightFleets.playerEscort),
    };
  };

  const getHighestDamage = (fleet) => {
    const { index } = fleet.reduce((result, { damageDealt }, i) => {
      return damageDealt > result.damageDealt
        ? { damageDealt, index: i }
        : result;
    }, { damageDealt: -1 });
    // MVP index 1-based
    return index !== undefined ? index + 1 : undefined;
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  const combineFleetResults = (day, night) => {
    const { zipWith } = KC3BattlePrediction;

    return zipWith(day, night, (dayResult, nightResult) => ({
      damageDealt: dayResult.damageDealt + nightResult.damageDealt,
    }));
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.mvp, {
    // Public
    combineResults,
    getHighestDamage,
    // Internal
    combineFleetResults,
  });
}());

(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const formatResult = (initialFleets, resultFleets) => {
    const { isPlayerNoDamage, fleets: { formatFleets } } = KC3BattlePrediction;

    const initial = formatFleets(initialFleets);
    const result = formatFleets(resultFleets);

    return {
      fleets: result,
      isPlayerNoDamage: isPlayerNoDamage(initial, result),
    };
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ NO DAMAGE ]--------------------- */

  const isPlayerNoDamage = (initialFleets, resultFleets) => {
    const { extendError, isNotDamaged } = KC3BattlePrediction;

    const initialShips = initialFleets.playerMain.concat(initialFleets.playerEscort);
    const resultShips = resultFleets.playerMain.concat(resultFleets.playerEscort);

    if (initialShips.length !== resultShips.length) {
      throw extendError(new Error('Mismatched initial and result fleets'), { initialFleets, resultFleets });
    }

    return resultShips.every((resultShip, index) => isNotDamaged(initialShips[index], resultShip));
  };

  // If damecon increases HP beyond initial value, it counts as no damage
  const isNotDamaged = (initial, result) => initial.hp <= result.hp;


  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction, {
    // Public
    formatResult,
    // Internals
    isPlayerNoDamage,
    isNotDamaged,
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
      nSupport(support) {
        return ({ api_n_support_info }) => parseAs(support, api_n_support_info);
      },
      nHougeki1(hougeki) {
        return ({ api_n_hougeki1 }) => parseAs(hougeki, api_n_hougeki1);
      },
      nHougeki2(hougeki) {
        return ({ api_n_hougeki2 }) => parseAs(hougeki, api_n_hougeki2);
      },
      midnight(yasen) {
        return ({ api_hougeki }) => parseAs(yasen, api_hougeki);
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
  const Hougeki = {};

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const JSON_FIELDS = ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage'];
  Hougeki.parseHougeki = (battleType, battleData) => {
    const { extractFromJson, makeAttacks } = KC3BattlePrediction.battle.phases;
    const { parseJson, getTargetFactory } = KC3BattlePrediction.battle.phases.hougeki;

    const attackData = extractFromJson(battleData, JSON_FIELDS).map(parseJson);
    return makeAttacks(attackData, getTargetFactory(battleType));
  };

  Hougeki.parseCombinedHougeki = (battleData) => {
    const { extractFromJson, makeAttacks } = KC3BattlePrediction.battle.phases;
    const { parseCombinedJson, getCombinedTargetFactory } = KC3BattlePrediction.battle.phases.hougeki;

    const attackData = extractFromJson(battleData, JSON_FIELDS).map(parseCombinedJson);
    return makeAttacks(attackData, getCombinedTargetFactory());
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ JSON PARSE ]-------------------- */

  Hougeki.parseJson = ({ api_at_eflag, api_at_list, api_df_list, api_damage }) => {
    const { parseAttackerIndex, parseDefenderIndex, parseDamage } =
      KC3BattlePrediction.battle.phases.hougeki;

    return {
      damage: parseDamage(api_damage),
      attacker: parseAttackerIndex(api_at_eflag, api_at_list),
      defender: parseDefenderIndex(api_at_eflag, api_df_list),
    };
  };

  Hougeki.parseAttackerIndex = (isEnemyAttackFlag, index) => {
    const { Side } = KC3BattlePrediction;

    return isEnemyAttackFlag === 0
      ? { side: Side.PLAYER, position: index }
      : { side: Side.ENEMY, position: index };
  };

  Hougeki.parseDefenderIndex = (isEnemyAttackFlag, targetIndices) => {
    const { Side, extendError } = KC3BattlePrediction;

    const index = targetIndices[0];

    if (!targetIndices.every(ind => ind === index)) {
      throw extendError(new Error('Bad target index array'), { targetIndices });
    }

    return isEnemyAttackFlag === 1
      ? { side: Side.PLAYER, position: index }
      : { side: Side.ENEMY, position: index };
  };

  Hougeki.parseDamage = damages => damages.reduce((result, damage) => result + damage, 0);

  Hougeki.parseCombinedJson = ({ api_at_eflag, api_at_list, api_df_list, api_damage }) => {
    const { parseCombinedAttacker, parseCombinedDefender, parseDamage }
      = KC3BattlePrediction.battle.phases.hougeki;

    return {
      attacker: parseCombinedAttacker(api_at_eflag, api_at_list),
      defender: parseCombinedDefender(api_at_eflag, api_df_list),
      damage: parseDamage(api_damage),
    };
  };

  Hougeki.parseCombinedAttacker = (isEnemyAttackFlag, attackerIndex) => {
    const { Side, Role, extendError } = KC3BattlePrediction;

    if (!(isEnemyAttackFlag === 1 || isEnemyAttackFlag === 0)) {
      throw extendError(new Error('Bad api_at_eflag'), { api_at_eflag: isEnemyAttackFlag });
    }

    const side = isEnemyAttackFlag === 1 ? Side.ENEMY : Side.PLAYER;
    return attackerIndex < 6
      ? { side, role: Role.MAIN_FLEET, position: attackerIndex }
      : { side, role: Role.ESCORT_FLEET, position: attackerIndex - 6 };
  };

  Hougeki.parseCombinedDefender = (isEnemyAttackFlag, defenderIndices) => {
    const { Side, Role, extendError } = KC3BattlePrediction;

    if (!(isEnemyAttackFlag === 1 || isEnemyAttackFlag === 0)) {
      throw extendError(new Error('Bad api_at_eflag'), { api_at_eflag: isEnemyAttackFlag });
    }

    const index = defenderIndices[0];
    if (!defenderIndices.every(ind => ind === index)) {
      throw extendError(new Error('Bad target index array'), { api_df_list: defenderIndices });
    }

    const side = isEnemyAttackFlag === 0 ? Side.ENEMY : Side.PLAYER;
    return index < 6
      ? { side, role: Role.MAIN_FLEET, position: index }
      : { side, role: Role.ESCORT_FLEET, position: index - 6 };
  };

  /* -----------------[ TARGET FACTORIES ]----------------- */

  Hougeki.getTargetFactory = (battleType) => {
    const { Side } = KC3BattlePrediction;
    const { createTargetFactory, isPlayerSingleFleet, isEnemySingleFleet } = KC3BattlePrediction.battle.phases.hougeki;
    const createTarget = createTargetFactory({
      [Side.PLAYER]: isPlayerSingleFleet(battleType.player),
      [Side.ENEMY]: isEnemySingleFleet(battleType.enemy),
    });

    return ({ attacker, defender }) => ({
      attacker: createTarget(attacker),
      defender: createTarget(defender),
    });
  };

  Hougeki.isPlayerSingleFleet = (playerFleetType) => {
    const { Player } = KC3BattlePrediction;

    return playerFleetType === Player.SINGLE;
  };
  Hougeki.isEnemySingleFleet = (enemyFleetType) => {
    const { Enemy } = KC3BattlePrediction;

    return enemyFleetType === Enemy.SINGLE;
  };

  Hougeki.createTargetFactory = (isSingleFleet) => {
    const { Role, battle: { createTarget } } = KC3BattlePrediction;

    return ({ side, position }) =>
      (isSingleFleet[side]
        ? createTarget(side, Role.MAIN_FLEET, position)
        : createTarget(side, position < 6 ? Role.MAIN_FLEET : Role.ESCORT_FLEET, position % 6));
  };

  Hougeki.getCombinedTargetFactory = () => {
    const { createTarget } = KC3BattlePrediction.battle;

    return ({ attacker, defender }) => ({
      attacker: createTarget(attacker.side, attacker.role, attacker.position),
      defender: createTarget(defender.side, defender.role, defender.position),
    });
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, Hougeki);
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
    const { normalizeArrayIndexing, battle: { createAttack, createTarget } } = KC3BattlePrediction;

    const damages = normalizeArrayIndexing(damageArray);
    return damages.reduce((result, damage, position) => {
      const attack = createAttack(damage, createTarget(side, role, position));
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
  const Raigeki = {};
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const PLAYER_JSON_FIELDS = ['api_frai', 'api_fydam'];
  const ENEMY_JSON_FIELDS = ['api_erai', 'api_eydam'];

  Raigeki.parseRaigeki = (battleType, battleData) => {
    const { extractFromJson, raigeki: { getTargetFactories, parseSide } }
      = KC3BattlePrediction.battle.phases;

    const targetFactories = getTargetFactories(battleType);

    const playerAttacks = parseSide(targetFactories.playerAttack,
      extractFromJson(battleData, PLAYER_JSON_FIELDS));
    const enemyAttacks = parseSide(targetFactories.enemyAttack,
      extractFromJson(battleData, ENEMY_JSON_FIELDS));

    return playerAttacks.concat(enemyAttacks);
  };

  Raigeki.parseCombinedRaigeki = (battleData) => {
    const { extractFromJson } = KC3BattlePrediction.battle.phases;
    const { getCombinedTargetFactories, parseSide } = KC3BattlePrediction.battle.phases.raigeki;

    const targetFactories = getCombinedTargetFactories();

    const playerAttacks = parseSide(targetFactories.playerAttack,
      extractFromJson(battleData, PLAYER_JSON_FIELDS));
    const enemyAttacks = parseSide(targetFactories.enemyAttack,
      extractFromJson(battleData, ENEMY_JSON_FIELDS));

    return playerAttacks.concat(enemyAttacks);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Raigeki.parseSide = (createTargets, attacksJson) => {
    const { makeAttacks, raigeki: { removeEmptyAttacks, parseJson } }
      = KC3BattlePrediction.battle.phases;

    return makeAttacks(removeEmptyAttacks(attacksJson.map(parseJson)), createTargets);
  };

  /* --------------------[ JSON PARSE ]-------------------- */

  Raigeki.removeEmptyAttacks = attacksJson => attacksJson.filter(({ defender: { position } }) => {
    return position >= 0;
  });

  Raigeki.parseJson = (attackJson, index) => {
    const { extendError } = KC3BattlePrediction;

    if (attackJson.api_frai !== undefined && attackJson.api_fydam !== undefined) {
      return {
        attacker: { position: index },
        defender: { position: attackJson.api_frai },
        damage: attackJson.api_fydam,
      };
    }
    if (attackJson.api_erai !== undefined && attackJson.api_eydam !== undefined) {
      return {
        attacker: { position: index },
        defender: { position: attackJson.api_erai },
        damage: attackJson.api_eydam,
      };
    }
    throw extendError(new Error('Bad attack json'), { attackJson, index });
  };

  /* -----------------[ TARGET FACTORIES ]----------------- */

  Raigeki.getTargetFactories = (battleType) => {
    const { Side } = KC3BattlePrediction;
    const { createTargetFactory, isPlayerSingleFleet, isEnemySingleFleet } = KC3BattlePrediction.battle.phases.raigeki;

    // TODO: unify v6 and v12 raigeki parsing
    const playerTarget = createTargetFactory(Side.PLAYER, isPlayerSingleFleet(battleType.player));
    const enemyTarget = createTargetFactory(Side.ENEMY, isEnemySingleFleet(battleType.enemy));

    return {
      playerAttack: ({ attacker, defender }) => ({
        attacker: playerTarget(attacker.position),
        defender: enemyTarget(defender.position),
      }),
      enemyAttack: ({ attacker, defender }) => ({
        attacker: enemyTarget(attacker.position),
        defender: playerTarget(defender.position),
      }),
    };
  };

  Raigeki.isPlayerSingleFleet = (playerFleetType) => {
    const { Player } = KC3BattlePrediction;

    return playerFleetType === Player.SINGLE;
  };
  Raigeki.isEnemySingleFleet = (enemyFleetType) => {
    const { Enemy } = KC3BattlePrediction;

    return enemyFleetType === Enemy.SINGLE;
  };

  Raigeki.createTargetFactory = (side, isSingleFleet) => {
    const { Role, battle: { createTarget } } = KC3BattlePrediction;

    return isSingleFleet
      ? position => createTarget(side, Role.MAIN_FLEET, position)
      : position => createTarget(side, position < 6 ? Role.MAIN_FLEET : Role.ESCORT_FLEET, position % 6);
  };

  Raigeki.getCombinedTargetFactories = () => {
    const { Side } = KC3BattlePrediction;
    const { createCombinedTargetFactory } = KC3BattlePrediction.battle.phases.raigeki;

    const playerTarget = createCombinedTargetFactory(Side.PLAYER);
    const enemyTarget = createCombinedTargetFactory(Side.ENEMY);

    return {
      playerAttack: ({ attacker, defender }) => ({
        attacker: playerTarget(attacker.position),
        defender: enemyTarget(defender.position),
      }),
      enemyAttack: ({ attacker, defender }) => ({
        attacker: enemyTarget(attacker.position),
        defender: playerTarget(defender.position),
      }),
    };
  };

  Raigeki.createCombinedTargetFactory = (side) => {
    const { Role, battle: { createTarget } } = KC3BattlePrediction;

    return position => (position < 6
      ? createTarget(side, Role.MAIN_FLEET, position)
      : createTarget(side, Role.ESCORT_FLEET, position - 6)
    );
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.raigeki, Raigeki);
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
    const { Side, battle: { createAttack, createTarget } } = KC3BattlePrediction;

    return damageArray.reduce((result, damage, position) => {
      const attack = createAttack(damage, createTarget(Side.ENEMY, role, position));
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
  const Util = {};

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Util.extractFromJson = (battleData, fields) => {
    const { extendError, zipWith } = KC3BattlePrediction;
    const { normalizeFieldArrays, zipJson } = KC3BattlePrediction.battle.phases;

    if (fields.length === 0) { return []; }

    const arrays = fields.map(name => normalizeFieldArrays(name, battleData[name]));

    if (!arrays.every(array => array.length === arrays[0].length)) {
      throw extendError(new Error('Mismatched length of json arrays'), { battleData, fields });
    }

    return zipWith(...arrays, zipJson);
  };

  Util.makeAttacks = (attacksData, createTargets) => {
    const { createAttack } = KC3BattlePrediction.battle;

    return attacksData.reduce((result, data) => {
      const { attacker, defender } = createTargets(data);
      const attack = createAttack(data.damage, defender, attacker);

      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ----------------[ EXTRACT FROM JSON ]----------------- */

  // Embed the prop name in the array - it will be needed by zipJson()
  Util.normalizeFieldArrays = (propName, array) => {
    return (array || []).map(value => ({ [propName]: value }));
  };

  Util.zipJson = (...elements) => Object.assign({}, ...elements);

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases, Util);
}());

(function () {
  const Yasen = {};
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const JSON_FIELDS = ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage'];

  Yasen.parseYasen = (battleType, battleData) => {
    const { makeAttacks, extractFromJson } = KC3BattlePrediction.battle.phases;
    const { parseJson, getTargetFactory } = KC3BattlePrediction.battle.phases.yasen;

    const attacksData = extractFromJson(battleData, JSON_FIELDS).map(parseJson);
    return makeAttacks(attacksData, getTargetFactory(battleType));
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ JSON PARSE ]-------------------- */

  Yasen.parseJson = ({ api_at_eflag, api_at_list, api_df_list, api_damage }) => {
    const { parseAttackerIndex, parseDefenderIndices, parseDamage }
      = KC3BattlePrediction.battle.phases.yasen;

    return {
      attacker: parseAttackerIndex(api_at_eflag, api_at_list),
      defender: parseDefenderIndices(api_at_eflag, api_df_list),
      damage: parseDamage(api_damage),
    };
  };

  Yasen.parseAttackerIndex = (isEnemyAttackFlag, index) => {
    const { Side } = KC3BattlePrediction;

    return isEnemyAttackFlag === 0
      ? { side: Side.PLAYER, position: index }
      : { side: Side.ENEMY, position: index };
  };

  Yasen.parseDefenderIndex = (isEnemyAttackFlag, index) => {
    const { Side } = KC3BattlePrediction;

    return isEnemyAttackFlag === 1
      ? { side: Side.PLAYER, position: index }
      : { side: Side.ENEMY, position: index };
  };

  Yasen.parseDefenderIndices = (isEnemyAttackFlag, indices) => {
    const { extendError } = KC3BattlePrediction;
    const { parseDefenderIndex } = KC3BattlePrediction.battle.phases.yasen;

    // single attack
    if (indices.length === 1) {
      return parseDefenderIndex(isEnemyAttackFlag, indices[0]);
    }
    // double attack
    if (indices.length === 2 && indices[0] === indices[1]) {
      return parseDefenderIndex(isEnemyAttackFlag, indices[0]);
    }
    // cut-in
    if (indices.length === 3 && indices[1] === -1 && indices[2] === -1) {
      return parseDefenderIndex(isEnemyAttackFlag, indices[0]);
    }
    throw extendError(new Error('Unknown target indices format'), { indices });
  };

  Yasen.parseDamage = (damageArray) => {
    return damageArray.reduce((result, damage) => (damage > 0 ? result + damage : result), 0);
  };

  Yasen.getTargetFactory = (battleType) => {
    const { Side } = KC3BattlePrediction;
    const { createTargetFactory, isPlayerSingleFleet, isEnemySingleFleet } = KC3BattlePrediction.battle.phases.yasen;
    const createTarget = createTargetFactory({
      [Side.PLAYER]: isPlayerSingleFleet(battleType.player),
      [Side.ENEMY]: isEnemySingleFleet(battleType.enemy),
    });

    return ({ attacker, defender }) => ({
      attacker: createTarget(attacker),
      defender: createTarget(defender),
    });
  };

  Yasen.isPlayerSingleFleet = (playerFleetType) => {
    const { Player } = KC3BattlePrediction;

    return playerFleetType === Player.SINGLE;
  };
  Yasen.isEnemySingleFleet = (enemyFleetType) => {
    const { Enemy } = KC3BattlePrediction;

    return enemyFleetType === Enemy.SINGLE;
  };

  Yasen.createTargetFactory = (isSingleFleet) => {
    const { Role, battle: { createTarget } } = KC3BattlePrediction;

    return ({ side, position }) =>
      (isSingleFleet[side]
        ? createTarget(side, Role.MAIN_FLEET, position)
        : createTarget(side, position < 6 ? Role.MAIN_FLEET : Role.ESCORT_FLEET, position % 6));
  };

  // Yasen.getTargetFactory = (playerRole, enemyRole) => {
  //   const { Side, battle: { createTarget } } = KC3BattlePrediction;
  //   const roles = {
  //     [Side.PLAYER]: playerRole,
  //     [Side.ENEMY]: enemyRole,
  //   };

  //   return ({ attacker, defender }) => ({
  //     attacker: createTarget(attacker.side, roles[attacker.side], attacker.position),
  //     defender: createTarget(defender.side, roles[defender.side], defender.position),
  //   });
  // };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.yasen, Yasen);
}());

(function () {
  const predict = (initial, result) => {
    const {
      getDamageGauge,
      battle: { isPlayerNoDamage },
    } = KC3BattlePrediction.rank;

    if (isPlayerNoDamage(initial, result)) { return 'SS'; }

    const { player: damageGauge } = getDamageGauge(initial, result);

    if (damageGauge < 10) { return 'A'; }
    if (damageGauge < 20) { return 'B'; }
    if (damageGauge < 50) { return 'C'; }
    if (damageGauge < 80) { return 'D'; }
    return 'E';
  };

  Object.assign(KC3BattlePrediction.rank.airRaid, { predict });
}());

(function () {
  // Based on: https://github.com/andanteyk/ElectronicObserver/blob/master/ElectronicObserver/Other/Information/kcmemo.md#%E6%88%A6%E9%97%98%E5%8B%9D%E5%88%A9%E5%88%A4%E5%AE%9A
  const predict = (initialFleets, resultFleets) => {
    const {
      getSunkCount,
      getShipCount,
      getDamageGauge,
      battle: { isPlayerNoDamage, isEnemyFlagshipSunk, isPlayerFlagshipTaiha },
    } = KC3BattlePrediction.rank;

    const sunk = getSunkCount(resultFleets);
    const ships = getShipCount(resultFleets);
    if (sunk.player === 0) {
      if (sunk.enemy === ships.enemy) {
        return isPlayerNoDamage(initialFleets, resultFleets) ? 'SS' : 'S';
      }
      if (ships.enemy > 1 && sunk.enemy >= Math.floor(ships.enemy * 0.7)) {
        return 'A';
      }
    }

    if (isEnemyFlagshipSunk(resultFleets) && sunk.player < sunk.enemy) {
      return 'B';
    }

    if (ships.player === 1 && isPlayerFlagshipTaiha(initialFleets, resultFleets)) {
      return 'D';
    }

    const damageTaken = getDamageGauge(initialFleets, resultFleets);
    if (damageTaken.enemy > 2.5 * damageTaken.player) {
      return 'B';
    }

    if (damageTaken.enemy > 0.9 * damageTaken.player) {
      return 'C';
    }

    if (sunk.player > 0 && ships.player - sunk.player === 1) {
      return 'E';
    }

    return 'D';
  };

  const isPlayerNoDamage = (initialFleets, resultFleets) => {
    const { getHpTotal } = KC3BattlePrediction.rank;

    const { player: startHp } = getHpTotal(initialFleets);
    const { player: endHp } = getHpTotal(resultFleets);

    return endHp >= startHp;
  };

  const isEnemyFlagshipSunk = (resultFleets) => {
    return resultFleets.enemyMain[0].sunk;
  };

  const isPlayerFlagshipTaiha = (initialFleets, resultFleets) => {
    const { maxHp } = initialFleets.playerMain[0];
    const { hp } = resultFleets.playerMain[0];
    return hp / maxHp <= 0.25;
  };

  Object.assign(KC3BattlePrediction.rank.battle, {
    // Public
    predict,
    // Internal
    isPlayerNoDamage,
    isEnemyFlagshipSunk,
    isPlayerFlagshipTaiha,
  });
}());

(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseStartJson = (battleData) => {
    const { zipHps } = KC3BattlePrediction.rank;

    return {
      playerMain: zipHps(battleData.api_f_nowhps, battleData.api_f_maxhps),
      playerEscort: zipHps(battleData.api_f_nowhps_combined, battleData.api_f_maxhps_combined),
      enemyMain: zipHps(battleData.api_e_nowhps, battleData.api_e_maxhps),
      enemyEscort: zipHps(battleData.api_e_nowhps_combined, battleData.api_e_maxhps_combined),
    };
  };

  const normalizeFleets = (fleets, battleData) => {
    const { removeRetreated, hideOverkill } = KC3BattlePrediction.rank;

    return {
      playerMain: hideOverkill(removeRetreated(fleets.playerMain, battleData.api_escape_idx)),
      playerEscort: hideOverkill(removeRetreated(fleets.playerEscort, battleData.api_escape_idx_combined)),
      enemyMain: hideOverkill(fleets.enemyMain),
      enemyEscort: hideOverkill(fleets.enemyEscort),
    };
  };

  const predictors = {
    ld_airbattle: 'airRaid',
  };
  const getRankPredictor = (apiName = '') => {
    const Rank = KC3BattlePrediction.rank;

    const predictorsKey = Object.keys(predictors).find(key => apiName.indexOf(key) !== -1);
    return predictorsKey
      ? Rank[predictors[predictorsKey]]
      : Rank.battle;
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* --------------------[ PARSE JSON ]-------------------- */

  const zipHps = (nowHps, maxHps) => {
    const { extendError } = KC3BattlePrediction;

    if (!nowHps && !maxHps) { return []; }

    if (nowHps.length !== maxHps.length) {
      throw extendError(new Error('Mismatched nowhps + maxhps'), { nowHps, maxHps });
    }

    return nowHps.map((hp, index) => ({ hp, maxHp: maxHps[index] }));
  };

  const removeRetreated = (fleet, escapeIds = []) =>
    fleet.filter((ship, index) => !escapeIds.includes(index + 1));


  /* --------------------[ NORMALIZE ]--------------------- */

  const hideOverkill = fleet => fleet.map((ship) => {
    return ship.hp < 0 ? Object.assign({}, ship, { hp: 0 }) : ship;
  });

  /* ---------------------[ HELPERS ]---------------------- */

  const processFleets = (f, { playerMain, playerEscort, enemyMain, enemyEscort }) => ({
    player: f(playerMain.concat(playerEscort)),
    enemy: f(enemyMain.concat(enemyEscort)),
  });

  const getSunkCount = processFleets.bind(null, (fleet) => {
    const sunkShips = fleet.filter(({ sunk }) => sunk);
    return sunkShips.length;
  });

  const getShipCount = processFleets.bind(null, fleet => fleet.length);

  const calculateDamageGauge = (startHp, endHp) => Math.floor(((startHp - endHp) / startHp) * 100);
  const getDamageGauge = (initialFleets, resultFleets) => {
    const { getHpTotal } = KC3BattlePrediction.rank;

    const startHp = getHpTotal(initialFleets);
    const endHp = getHpTotal(resultFleets);

    return {
      player: calculateDamageGauge(startHp.player, endHp.player),
      enemy: calculateDamageGauge(startHp.enemy, endHp.enemy),
    };
  };

  const getHpTotal = processFleets.bind(null, (fleet) => {
    return fleet.reduce((result, { hp }) => result + hp, 0);
  });

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.rank, {
    // Public API
    parseStartJson,
    normalizeFleets,
    getRankPredictor,
    // Internal
    zipHps,
    removeRetreated,

    hideOverkill,
    // Helpers
    getSunkCount,
    getShipCount,
    getDamageGauge,
    getHpTotal,
  });
}());

(function () {
  const createAttack = (damage, defender, attacker) => {
    const { normalizeDamage } = KC3BattlePrediction.battle;

    return Object.freeze({
      damage: normalizeDamage(damage),
      defender,
      attacker,
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
  // might be 7 since 2017-11-17
  const FLEET_SIZE = 6;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/
  const createFleets = (...fleets) => {
    const { convertToFleet } = KC3BattlePrediction.fleets;

    const [playerMain, enemyMain, playerEscort, enemyEscort] = fleets.map(convertToFleet);

    return {
      player: { main: playerMain, escort: playerEscort },
      enemy: { main: enemyMain, escort: enemyEscort },
    };
  };

  const simulateAttack = (fleets, { attacker, defender, damage }) => {
    const { bind } = KC3BattlePrediction;
    const { cloneFleets, updateShip, dealDamage, takeDamage } = KC3BattlePrediction.fleets;

    // NB: cloning is necessary to preserve function purity
    let result = cloneFleets(fleets);
    result = updateShip(defender, bind(takeDamage, damage), result);
    if (attacker) {
      result = updateShip(attacker, bind(dealDamage, damage), result);
    }
    return result;
  };

  const formatFleets = (fleets) => {
    const { getFleetOutput } = KC3BattlePrediction.fleets;

    return {
      playerMain: getFleetOutput(fleets.player.main),
      playerEscort: getFleetOutput(fleets.player.escort),
      enemyMain: getFleetOutput(fleets.enemy.main),
      enemyEscort: getFleetOutput(fleets.enemy.escort),
    };
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ---------------------[ CREATION ]--------------------- */

  const convertToFleet = ships => ships.reduce((result, ship, index) => {
    return ship !== KC3BattlePrediction.EMPTY_SLOT
      ? Object.assign(result, { [index]: ship })
      : result;
  }, {});

  /* ----------------------[ UPDATE ]---------------------- */

  const isTargetInFleets = ({ side, role, position }, fleets) =>
    fleets[side] && fleets[side][role] && fleets[side][role][position];

  const updateShip = (target, update, fleets) => {
    const { extendError, fleets: { isTargetInFleets } } = KC3BattlePrediction;

    if (!isTargetInFleets(target, fleets)) {
      throw extendError(new Error('Bad target'), { target, fleets });
    }

    const { side, role, position } = target;
    // Modifying the param is fine, since the fleets is cloned in the caller context
    fleets[side][role][position] = update(fleets[side][role][position]);
    return fleets;
  };

  const cloneFleets = fleets => JSON.parse(JSON.stringify(fleets));

  /* ----------------------[ OUTPUT ]---------------------- */

  const getFleetOutput = (fleet) => {
    const { convertToArray, trimEmptySlots, formatShip } = KC3BattlePrediction.fleets;

    return trimEmptySlots(convertToArray(fleet).map(formatShip));
  };

  const convertToArray = (fleet) => {
    const { EMPTY_SLOT } = KC3BattlePrediction;
    // fill() is called because array elements must have assigned values or map will not work
    // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map#Description
    return new Array(Math.max(Object.keys(fleet).length, FLEET_SIZE)).fill(EMPTY_SLOT)
      .map((empty, index) => fleet[index] || empty);
  };

  const findLastIndex = (pred, array) => {
    // reverse() is in-place, so we need a clone
    const reverse = array.slice(0).reverse();
    const reverseIndex = reverse.findIndex(pred);
    return reverseIndex === -1 ? -1 : array.length - reverseIndex;
  };
  const trimEmptySlots = (fleetArray) => {
    const { EMPTY_SLOT } = KC3BattlePrediction;

    const lastShipIndex = findLastIndex(ship => ship !== EMPTY_SLOT, fleetArray);
    return lastShipIndex !== -1
      ? fleetArray.slice(0, lastShipIndex)
      : [];
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    createFleets,
    simulateAttack,
    formatFleets,
    // Internal
    convertToFleet,

    isTargetInFleets,
    updateShip,
    cloneFleets,

    getFleetOutput,
    convertToArray,
    trimEmptySlots,
  });
}());

(function () {
  const EMPTY_SLOT = KC3BattlePrediction.EMPTY_SLOT;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const createShip = (hp, maxHp) => (hp !== -1 ? { hp, maxHp, damageDealt: 0 } : EMPTY_SLOT);

  const installDamecon = (damecon, ship) =>
    (ship !== EMPTY_SLOT ? Object.assign({}, ship, { damecon }) : ship);

  const dealDamage = (damage, ship) =>
    Object.assign({}, ship, { damageDealt: ship.damageDealt + damage });

  const takeDamage = (damage, ship) => {
    const { tryDamecon } = KC3BattlePrediction.fleets;

    const result = Object.assign({}, ship, { hp: ship.hp - damage });

    return result.hp <= 0 ? tryDamecon(result) : result;
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

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

  const formatShip = (ship) => {
    if (ship === EMPTY_SLOT) { return EMPTY_SLOT; }

    return {
      hp: ship.hp,
      dameConConsumed: ship.dameConConsumed || false,
      sunk: ship.hp <= 0,
      damageDealt: ship.damageDealt,
    };
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, {
    // Public
    createShip,
    installDamecon,
    dealDamage,
    takeDamage,
    // Internals
    tryDamecon,
    formatShip,
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

  // Sanity check position index - should be an integer in range [0,7)
  // Since 2017-11-17 (Event Fall 2017) 7 player ships fleet available
  const validatePosition = (position) => {
    return position >= 0 && position < 7 && position === Math.floor(position);
  };

  Object.assign(window.KC3BattlePrediction.battle, { createTarget, validatePosition });
}());
