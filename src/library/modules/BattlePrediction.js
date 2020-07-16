/**
 * Public API of Battle Prediction module.
 * Must be loaded first, since it defines the module's structure.
 *
 * DO NOT modify single file module of `src/library/module/BattlePrediction.js` directly,
 * To generate the single file module, run `grunt concat:battlePredictionDev`.
 */
(function () {
  const BP = {
    fleets: {
      ship: {},
    },
    battle: {
      // Phase parsers - convert phase JSON to Attacks
      phases: {
        kouku: {}, // aerial phase (航空)
        hougeki: {}, // shelling (砲撃)
        raigeki: {}, // torpedoes (雷撃)
        support: {}, // support expedition
        friendly: {}, // night battle friend fleet support
      },
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

  BP.analyzeBattlePartially = (battleData, playerDamecons, selectedPhases) => {
    const { fleets, battle, formatResult } = KC3BattlePrediction;

    try {
      const initialFleets = fleets.getInitialState(battleData, playerDamecons);
      const resultFleets = battle.simulateBattlePartially(battleData, initialFleets, selectedPhases);

      return formatResult(initialFleets, resultFleets);
    } catch (error) {
      // Pass context explicitly, so it is recorded
      KC3Log.error(error, error.data, { selectedPhases, battleData, playerDamecons });
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

  BP.predictRankAndDamageGauge = (apiName, battleData, battleResult) => {
    const { parseStartJson, normalizeFleets, getRankPredictor, getDamageGauge } = KC3BattlePrediction.rank;

    const initialFleets = normalizeFleets(parseStartJson(battleData), battleData),
      resultFleets = normalizeFleets(battleResult, battleData);

    return [
      getRankPredictor(apiName).predict(initialFleets, resultFleets),
      getDamageGauge(initialFleets, resultFleets)
    ];
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

  BP.Time = Object.freeze({ DAY: 'day', NIGHT: 'night', NIGHT_TO_DAY: 'night_to_day' });

  // INTERNAL ENUMS
  // ---------------

  // Player or enemy ship
  BP.Side = Object.freeze({ PLAYER: 'player', ENEMY: 'enemy', FRIEND: 'friend' });

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

  /* ---------------------[ FP UTILS ]--------------------- */

  // Compose functions left-to-right
  // See _.flow (https://lodash.com/docs/#flow) or Ramda.pipe (http://ramdajs.com/docs/#pipe)
  BP.pipe = (...funcs) => x => funcs.reduce((v, f) => f(v), x);

  // Apply arguments to an array of functions, then combine
  // See Ramda.converge (http://ramdajs.com/docs/#converge)
  BP.converge = (after, funcs) => (...args) => after(...funcs.map(f => f(...args)));

  // Apply arguments to an array of functions
  // See _.over (https://lodash.com/docs/#over) or Ramda.juxt (http://ramdajs.com/docs/#juxt)
  BP.juxt = funcs => (...args) => funcs.map(f => f(...args));

  // Recursively flatten nested arrays
  // See _.flattenDeep (https://lodash.com/docs/#flattenDeep) or Ramda.flatten (http://ramdajs.com/docs/#flatten)
  BP.flatten = xs => xs.reduce(
    (acc, x) => acc.concat(Array.isArray(x) ? BP.flatten(x) : x),
    []
  );

  // Immutably set property at path
  // Similar to/based on Ramda.over (http://ramdajs.com/docs/#over)
  const setAt = ([prop, ...rest], f, obj) => {
    if (!prop) {
      return f(obj);
    }
    if (Array.isArray(obj)) {
      const index = parseInt(prop, 10);
      return [
        ...obj.slice(0, index),
        setAt(rest, f, obj[index]),
        ...obj.slice(index + 1),
      ];
    }
    if (typeof obj === 'object') {
      return Object.assign({}, obj, { [prop]: setAt(rest, f, obj[prop]) });
    }
    throw new Error('Bad path');
  };
  BP.over = (path, f) => obj => {
    try {
      return setAt(path.split('.'), f, obj);
    } catch (e) {
      if (e.message === 'Bad path') {
        throw new Error(`Bad path: ${path}`);
      }
      throw e;
    }
  };

  // Curried map(), extended to work on objects
  BP.map = f => xs => {
    if (typeof xs.map === 'function') {
      return xs.map(f);
    }
    if (typeof xs === 'object') {
      return Object.keys(xs).reduce(
        (result, key, index) => Object.assign(result, { [key]: f(xs[key], key, index) }),
        {}
      );
    }
    throw new Error(`Not a functor: ${xs}`);
  };

  // Curried filter()
  BP.filter = f => xs => xs.filter(f);
  // Curried reduce()
  BP.reduce = (f, initialValue) => xs =>
    typeof initialValue !== 'undefined'
      ? xs.reduce(f, initialValue)
      : xs.reduce(f);
  // Concat as function rather than method
  BP.concat = (xs, ...rest) => xs.concat(...rest);

  /* ---------------------[ ZIP WITH ]--------------------- */

  const parseArgs = ([iteratee, ...rest]) => {
    return typeof iteratee === 'function'
      ? { arrays: rest, iteratee }
      : { arrays: [iteratee, ...rest], iteratee: (...elements) => elements };
  };
  const getElements = (arrays, index) => arrays.map(array => array[index]);
  const getLongestArray = arrays =>
    arrays.reduce((result, array) => (array.length > result ? array.length : result), 0);
  // See: http://ramdajs.com/docs/#zipWith
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
  const { pipe, juxt, flatten, reduce } = KC3BattlePrediction;
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  battle.simulateBattle = (battleData, initalFleets, battleType) => {
    const { battle: { getPhases }, fleets: { simulateAttack } } = KC3BattlePrediction;

    return pipe(
      juxt(getPhases(battleType)),
      flatten,
      reduce(simulateAttack, initalFleets)
    )(battleData);
  };

  battle.simulateBattlePartially = (battleData, initalFleets, battlePhases = []) => {
    const { fleets: { simulateAttack } } = KC3BattlePrediction;
    const { getPhaseParser } = KC3BattlePrediction.battle;

    return pipe(
      juxt(battlePhases.map(getPhaseParser)),
      flatten,
      reduce(simulateAttack, initalFleets)
    )(battleData);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  battle.getPhases = (battleType) => {
    const { getBattlePhases, getPhaseParser } = KC3BattlePrediction.battle;
    return getBattlePhases(battleType).map(getPhaseParser);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.battle, battle);
}());

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
      'friendly',
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
    [toKey(Player.SINGLE, Enemy.SINGLE, Time.NIGHT)]: ['friendly', 'nSupport', 'hougeki'],
    [toKey(Player.CTF, Enemy.SINGLE, Time.NIGHT)]: ['friendly', 'nSupport', 'hougeki'],
    [toKey(Player.STF, Enemy.SINGLE, Time.NIGHT)]: ['friendly', 'nSupport', 'hougeki'],
    [toKey(Player.SINGLE, Enemy.COMBINED, Time.NIGHT)]: ['friendly', 'nSupport', 'hougeki'],
    [toKey(Player.CTF, Enemy.COMBINED, Time.NIGHT)]: ['friendly', 'nSupport', 'hougeki'],
    [toKey(Player.STF, Enemy.COMBINED, Time.NIGHT)]: ['friendly', 'nSupport', 'hougeki'],
  };

  battle.getBattlePhases = (battleType) => {
    const { player, enemy, time } = battleType;
    const result = battleTypes[toKey(player, enemy, time)];

    if (!result) { throw new Error(`Bad battle type: ${JSON.stringify(battleType)}`); }
    return result;
  };

  Object.assign(window.KC3BattlePrediction.battle, battle);
}());

(function () {
  const Fleets = {};
  const { Side } = KC3BattlePrediction;
  const { pipe, juxt, map, zipWith, over } = KC3BattlePrediction;
  const COMBINED_FLEET_MAIN_ALIGN = 6;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  // Create a Fleets object with the state of the player and enemy Fleets at battle start
  Fleets.getInitialState = (battleData, playerDamecons) => {
    const { extractHps, extractSubInfo, installDamecons } = KC3BattlePrediction.fleets;

    return pipe(
      juxt([
        extractHps('api_f_nowhps', 'api_f_maxhps'),
        extractHps('api_f_nowhps_combined', 'api_f_maxhps_combined'),
        extractHps('api_e_nowhps', 'api_e_maxhps'),
        extractHps('api_e_nowhps_combined', 'api_e_maxhps_combined'),
        pipe(extractSubInfo('api_friendly_info'), extractHps('api_nowhps', 'api_maxhps')),
      ]),
      ([playerMain, playerEscort, enemyMain, enemyEscort, friendMain]) => ({
        [Side.PLAYER]: { main: playerMain, escort: playerEscort },
        [Side.ENEMY]: { main: enemyMain, escort: enemyEscort },
        // No escort fleet found yet for NPC friend fleet support
        [Side.FRIEND]: { main: friendMain, escort: [] }
      }),
      over(Side.PLAYER, map(installDamecons(playerDamecons)))
    )(battleData);
  };

  Fleets.simulateAttack = (fleets, { damage, defender, attacker, info }) => {
    const { getPath } = KC3BattlePrediction.fleets;
    const { dealDamage, takeDamage } = KC3BattlePrediction.fleets.ship;

    return pipe(
      over(getPath(fleets, defender), takeDamage(damage, info)),
      attacker ? over(getPath(fleets, attacker), dealDamage(damage, info)) : x => x
    )(fleets);
  };

  // map() for the whole fleets structure
  // i.e. f => side.forEach(role.forEach(ship.forEach(s => f(s))))
  const mapShips = pipe(map, map, map);

  Fleets.formatFleets = (fleets) => {
    const { formatShip } = KC3BattlePrediction.fleets.ship;
    return pipe(
      mapShips(formatShip),
      ({ [Side.PLAYER]: player, [Side.ENEMY]: enemy, [Side.FRIEND]: friend }) => ({
        playerMain: player.main,
        playerEscort: player.escort,
        enemyMain: enemy.main,
        enemyEscort: enemy.escort,
        friendMain: friend.main,
        friendEscort: friend.escort,
      })
    )(fleets);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ----------------[ GET INITIAL STATE ]----------------- */

  Fleets.extractHps = (nowHpsProp, maxHpsProp) => battleData => {
    const { createShip } = KC3BattlePrediction.fleets.ship;

    const nowHps = battleData[nowHpsProp] || [];
    const maxHps = battleData[maxHpsProp] || [];

    if (nowHps.length !== maxHps.length) {
      throw new Error(`Mismatched array lengths: "${nowHpsProp}" and "${maxHpsProp}"`);
    }

    return zipWith(createShip, nowHps, maxHps);
  };

  Fleets.extractSubInfo = (subProp) => battleData => {
    return battleData[subProp] || {};
  };

  Fleets.installDamecons = playerDamecons => (fleet, fleetRole) => {
    const { installDamecon } = KC3BattlePrediction.fleets.ship;

    return pipe(
      ds => ds[fleetRole] || [],
      ds => ds.slice(0, fleet.length),
      ds => zipWith(installDamecon, fleet, ds)
    )(playerDamecons);
  };

  /* -----------------[ SIMULATE ATTACK ]------------------ */

  Fleets.getPath = (fleets, { side, position }) => {
    if (fleets[side].main[position]) {
      return `${side}.main.${position}`;
    }
    const escortIndex = position - COMBINED_FLEET_MAIN_ALIGN;
    if (fleets[side].escort[escortIndex]) {
      return `${side}.escort.${escortIndex}`;
    }
    throw new Error(`Bad target: ${JSON.stringify({ side, position })}`);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(window.KC3BattlePrediction.fleets, Fleets);
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

    return zipWith(
      (dayResult, nightResult) => ({
        damageDealt: dayResult.damageDealt + nightResult.damageDealt,
      }),
      day,
      night
    );
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
  const battle = {};

  // Phase parsers are defined as factories to avoid load order dependency
  // NB: May be worth caching instances if performance is an issue
  battle.phaseParserMap = {
    airBaseInjection: ({ parseKouku }) => ({ api_air_base_injection }) => parseKouku(api_air_base_injection),
    injectionKouku: ({ parseKouku }) => ({ api_injection_kouku }) => parseKouku(api_injection_kouku),
    airBaseAttack: ({ parseKouku }) => ({ api_air_base_attack = [] }) =>
      api_air_base_attack.reduce((result, wave) => result.concat(parseKouku(wave)), []),
    kouku: ({ parseKouku }) => ({ api_kouku }) => parseKouku(api_kouku),
    kouku2: ({ parseKouku }) => ({ api_kouku2 }) => parseKouku(api_kouku2),
    support: ({ parseSupport }) => ({ api_support_info }) => parseSupport(api_support_info),
    openingTaisen: ({ parseHougeki }) => ({ api_opening_taisen }) => parseHougeki(api_opening_taisen),
    openingAtack: ({ parseRaigeki }) => ({ api_opening_atack }) => parseRaigeki(api_opening_atack),
    hougeki1: ({ parseHougeki }) => ({ api_hougeki1 }) => parseHougeki(api_hougeki1),
    hougeki2: ({ parseHougeki }) => ({ api_hougeki2 }) => parseHougeki(api_hougeki2),
    hougeki3: ({ parseHougeki }) => ({ api_hougeki3 }) => parseHougeki(api_hougeki3),
    raigeki: ({ parseRaigeki }) => ({ api_raigeki }) => parseRaigeki(api_raigeki),
    nSupport: ({ parseSupport }) => ({ api_n_support_info }) => parseSupport(api_n_support_info),
    nHougeki1: ({ parseHougeki }) => ({ api_n_hougeki1 }) => parseHougeki(api_n_hougeki1),
    nHougeki2: ({ parseHougeki }) => ({ api_n_hougeki2 }) => parseHougeki(api_n_hougeki2),
    // nb shelling
    hougeki: ({ parseHougeki }) => ({ api_hougeki }) => parseHougeki(api_hougeki),
    friendly: ({ parseFriendly }) => ({ api_friendly_battle }) => parseFriendly(api_friendly_battle),
  };

  const wrapParser = parser => battleData => (battleData ? parser(battleData) : []);
  battle.getParsers = () => {
    const {
      kouku: { parseKouku },
      support: { parseSupport },
      hougeki: { parseHougeki },
      raigeki: { parseRaigeki },
      friendly: { parseFriendly },
    } = KC3BattlePrediction.battle.phases;

    return {
      parseKouku: wrapParser(parseKouku),
      parseSupport: wrapParser(parseSupport),
      parseHougeki: wrapParser(parseHougeki),
      parseRaigeki: wrapParser(parseRaigeki),
      parseFriendly: wrapParser(parseFriendly),
    };
  };

  battle.getPhaseParser = (phaseName) => {
    const { phaseParserMap, getParsers } = KC3BattlePrediction.battle;

    if (!phaseParserMap[phaseName]) { throw new Error(`Bad phase: ${phaseName}`); }

    return phaseParserMap[phaseName](getParsers());
  };

  Object.assign(window.KC3BattlePrediction.battle, battle);
}());

(function () {
  const Friendly = {};

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Friendly.parseFriendly = ({ api_hougeki }) => {
    const {
      hougeki: { parseHougekiFriend },
    } = KC3BattlePrediction.battle.phases;

    return parseHougekiFriend(api_hougeki);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.friendly, Friendly);
}());

(function () {
  const Hougeki = {};
  const { pipe, map, juxt, flatten, Side } = KC3BattlePrediction;

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Hougeki.parseHougeki = (battleData) => {
    const { parseHougekiInternal } = KC3BattlePrediction.battle.phases.hougeki;
    return parseHougekiInternal(battleData, false);
  };

  Hougeki.parseHougekiFriend = (battleData) => {
    const { parseHougekiInternal } = KC3BattlePrediction.battle.phases.hougeki;
    return parseHougekiInternal(battleData, true);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Hougeki.parseHougekiInternal = (battleData, isAllySideFriend = false) => {
    const { createAttack } = KC3BattlePrediction.battle;
    const { extractFromJson } = KC3BattlePrediction.battle.phases;
    const { parseJson } = KC3BattlePrediction.battle.phases.hougeki;
    const HOUGEKI_PROPS = battleData.api_at_type ?
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage', 'api_cl_list', 'api_si_list', 'api_at_type'] :
      battleData.api_sp_list ?
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage', 'api_cl_list', 'api_si_list', 'api_sp_list'] :
      ['api_at_eflag', 'api_at_list', 'api_df_list', 'api_damage'];

    return pipe(
      juxt([pipe(
        extractFromJson(HOUGEKI_PROPS),
        map(parseJson.bind(null, isAllySideFriend))
      )]),
      flatten,
      map(createAttack))(battleData);
  };

  Hougeki.parseJson = (isAllySideFriend, attackJson) => {
    const { parseDamage, parseAttacker, parseDefender, parseAttackerFriend, parseDefenderFriend,
      parseInfo, isNelsonTouch, isNagatoCutin, isMutsuCutin, isColoradoCutin, isKongouCutin,
      parseSpecialCutin } = KC3BattlePrediction.battle.phases.hougeki;

    const isSpecialCutin = isNelsonTouch(attackJson) ||
      isNagatoCutin(attackJson) || isMutsuCutin(attackJson) ||
      isColoradoCutin(attackJson) ||
      isKongouCutin(attackJson);
    return isSpecialCutin ? parseSpecialCutin(isAllySideFriend, attackJson) : {
      damage: parseDamage(attackJson),
      attacker: isAllySideFriend ? parseAttackerFriend(attackJson) : parseAttacker(attackJson),
      defender: isAllySideFriend ? parseDefenderFriend(attackJson) : parseDefender(attackJson),
      info: parseInfo(attackJson),
    };
  };

  // 1 Special CutIn (Nelson Touch / Nagato / Mutsu / Colorado / Kongou) may attack different targets,
  // cannot ignore elements besides 1st one in api_df_list[] any more.
  Hougeki.parseSpecialCutin = (isAllySideFriend, attackJson) => {
    const { parseDamage, parseDefender, parseInfo, isRealAttack,
      parseAttacker, parseAttackerFriend, parseAttackerSpecial,
      isNelsonTouch, isNagatoCutin, isMutsuCutin, isColoradoCutin, isKongouCutin } = KC3BattlePrediction.battle.phases.hougeki;

    const { api_df_list: defenders, api_damage: damages } = attackJson;
    return defenders.map((defender, index) => ({
      damage: parseDamage({ api_damage: [damages[index]] }),
      attacker: isNelsonTouch(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 2, 4], isAllySideFriend, index})) :
        isNagatoCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 0, 1], isAllySideFriend, index})) :
        isMutsuCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 0, 1], isAllySideFriend, index})) :
        isColoradoCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 1, 2], isAllySideFriend, index})) :
        isKongouCutin(attackJson) ?
          parseAttackerSpecial(Object.assign({}, attackJson, {attackerPos: [0, 1, 1], isAllySideFriend, index})) :
        // Unreachable exception
        (isAllySideFriend ? parseAttackerFriend(attackJson) : parseAttacker(attackJson)),
      // Assume abyssal enemy and PvP cannot trigger it yet
      defender: parseDefender({ api_df_list: [defender] }),
      info: parseInfo(attackJson, index),
    })).filter(isRealAttack);
  };

  Hougeki.isRealAttack = ({ defender }) => defender.position !== -1;

  Hougeki.isNelsonTouch   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 100;
  Hougeki.isNagatoCutin   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 101;
  Hougeki.isMutsuCutin    = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 102;
  Hougeki.isColoradoCutin = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 103;
  Hougeki.isKongouCutin   = ({ api_at_type, api_sp_list }) => (api_at_type || api_sp_list) === 104;

  // According MVP result, Nelson Touch attackers might be set to corresponding
  //   ship position (1st Nelson, 3th, 5th), not fixed to Nelson (api_at_list: 0);
  // For Nagato/Mutsu, 3 attacks assigned to 1st flagship twice, 2nd ship once;
  // For Colorado, 3 attacks assigned to first 3 ships;
  // For Kongou Class, 2 night attacks assigned to 1st flagship once, 2nd ship once;
  Hougeki.parseAttackerSpecial = ({ isAllySideFriend, index, attackerPos, api_at_eflag }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : isAllySideFriend ? Side.FRIEND : Side.PLAYER,
    position: attackerPos[index] || 0,
  });

  Hougeki.parseDamage = ({ api_damage }) =>
    api_damage.reduce((result, n) => result + Math.max(0, n), 0);

  Hougeki.parseAttacker = ({ api_at_eflag, api_at_list }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : Side.PLAYER,
    position: api_at_list,
  });

  Hougeki.parseAttackerFriend = ({ api_at_eflag, api_at_list }) => ({
    side: api_at_eflag === 1 ? Side.ENEMY : Side.FRIEND,
    position: api_at_list,
  });

  Hougeki.parseDefender = ({ api_at_eflag, api_df_list }) => ({
    side: api_at_eflag === 1 ? Side.PLAYER : Side.ENEMY,
    position: api_df_list[0],
  });

  Hougeki.parseDefenderFriend = ({ api_at_eflag, api_df_list }) => ({
    side: api_at_eflag === 1 ? Side.FRIEND : Side.ENEMY,
    position: api_df_list[0],
  });

  Hougeki.parseInfo = ({ api_damage, api_cl_list, api_si_list, api_at_type, api_sp_list, api_df_list }, index = -1) => ({
    damage: (index === -1 ? api_damage : [api_damage[index]]),
    acc: (index === -1 ? api_cl_list : [api_cl_list[index]]),
    equip: api_si_list,
    cutin: api_at_type,
    ncutin: api_sp_list,
    target: (index === -1 ? api_df_list : [api_df_list[index]]),
  });

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, Hougeki);
}());
// Parser for 航空 (aerial combat) phase
(function () {
  const COMBINED_FLEET_MAIN_ALIGN = 6;
  const Kouku = {};
  const { pipe, juxt, flatten, map, filter, Side } = KC3BattlePrediction;
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  Kouku.parseKouku = (battleData) => {
    const { createAttack } = KC3BattlePrediction.battle;
    const {
      normalizeFleetDamageArrays,
      parsePlayerJson,
      parseEnemyJson,
      isDamagingAttack,
    } = KC3BattlePrediction.battle.phases.kouku;

    return pipe(
      normalizeFleetDamageArrays,
      juxt([parsePlayerJson, parseEnemyJson]),
      flatten,
      filter(isDamagingAttack),
      map(createAttack)
    )(battleData);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/


  Kouku.normalizeFleetDamageArrays = (battleData) => {
    const { extractDamageArray, padDamageArray } = KC3BattlePrediction.battle.phases.kouku;

    return pipe(
      juxt([
        extractDamageArray('api_stage3', 'api_fdam'),
        extractDamageArray('api_stage3_combined', 'api_fdam'),
        extractDamageArray('api_stage3', 'api_edam'),
        extractDamageArray('api_stage3_combined', 'api_edam'),
      ]),
      map(padDamageArray),
      ([playerMain, playerEscort, enemyMain, enemyEscort]) => ({
        api_fdam: [].concat(playerMain, playerEscort),
        api_edam: [].concat(enemyMain, enemyEscort),
      })
    )(battleData);
  };

  Kouku.extractDamageArray = (stageName, damageArrayName) => battleData =>
    (battleData[stageName] && battleData[stageName][damageArrayName]) || [];

  Kouku.padDamageArray = damageArray =>
    (damageArray.length < COMBINED_FLEET_MAIN_ALIGN
      ? damageArray.concat(new Array(COMBINED_FLEET_MAIN_ALIGN - damageArray.length).fill(0))
      : damageArray);

  Kouku.parsePlayerJson = ({ api_fdam }) => api_fdam.map(
    (damage, position) => ({ damage, defender: { side: Side.PLAYER, position } })
  );
  Kouku.parseEnemyJson = ({ api_edam }) => api_edam.map(
    (damage, position) => ({ damage, defender: { side: Side.ENEMY, position } })
  );

  Kouku.isDamagingAttack = ({ damage }) => damage > 0;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.kouku, Kouku);
}());

(function () {
  const Raigeki = {};
  const { pipe, juxt, flatten, map, filter, Side } = KC3BattlePrediction;
  const RAIGEKI_PLAYER = ['api_frai', 'api_fydam'];
  const RAIGEKI_ENEMY = ['api_erai', 'api_eydam'];

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Raigeki.parseRaigeki = battleData => {
    const { createAttack } = KC3BattlePrediction.battle;
    const {
      parseSide,
      parsePlayerJson,
      parseEnemyJson,
      isRealAttack,
    } = KC3BattlePrediction.battle.phases.raigeki;

    return pipe(
      juxt([
        parseSide(RAIGEKI_PLAYER, parsePlayerJson),
        parseSide(RAIGEKI_ENEMY, parseEnemyJson),
      ]),
      flatten,
      filter(isRealAttack),
      map(createAttack)
    )(battleData);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Raigeki.parseSide = (jsonProps, parseJson) => battleData => {
    const { extractFromJson } = KC3BattlePrediction.battle.phases;

    return pipe(
      extractFromJson(jsonProps),
      map(parseJson)
    )(battleData);
  };

  Raigeki.parsePlayerJson = ({ api_frai, api_fydam }, index) => ({
    damage: api_fydam,
    defender: { side: Side.ENEMY, position: api_frai },
    attacker: { side: Side.PLAYER, position: index },
  });
  Raigeki.parseEnemyJson = ({ api_erai, api_eydam }, index) => ({
    damage: api_eydam,
    defender: { side: Side.PLAYER, position: api_erai },
    attacker: { side: Side.ENEMY, position: index },
  });

  Raigeki.isRealAttack = ({ defender }) => defender.position !== -1;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.raigeki, Raigeki);
}());

(function () {
  const Support = {};
  const SUPPORT_PROPS = ['api_damage'];
  const { pipe, map, filter, Side } = KC3BattlePrediction;

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Support.parseSupport = ({ api_support_hourai, api_support_airatack }) => {
    const {
      support: { parseHourai },
      kouku: { parseKouku },
    } = KC3BattlePrediction.battle.phases;

    if (api_support_airatack) {
      return parseKouku(api_support_airatack);
    } else if (api_support_hourai) {
      return parseHourai(api_support_hourai);
    }
    return [];
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Support.parseHourai = (battleData) => {
    const { createAttack } = KC3BattlePrediction.battle;
    const { extractFromJson } = KC3BattlePrediction.battle.phases;
    const { parseJson, isDamagingAttack } = KC3BattlePrediction.battle.phases.support;

    return pipe(
      extractFromJson(SUPPORT_PROPS),
      map(parseJson),
      filter(isDamagingAttack),
      map(createAttack)
    )(battleData);
  };

  Support.parseJson = ({ api_damage }, index) => ({
    damage: api_damage,
    defender: { side: Side.ENEMY, position: index },
  });

  Support.isDamagingAttack = ({ damage }) => damage > 0;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.support, Support);
}());

(function () {
  const Util = {};

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Util.extractFromJson = fields => (battleData) => {
    const { extendError, zipWith } = KC3BattlePrediction;
    const { normalizeFieldArrays, zipJson } = KC3BattlePrediction.battle.phases;

    if (fields.length === 0) { return []; }

    const arrays = fields.map(name => normalizeFieldArrays(name, battleData[name]));

    if (!arrays.every(array => array.length === arrays[0].length)) {
      throw extendError(new Error('Mismatched length of json arrays'), { battleData, fields });
    }

    return zipWith(zipJson, ...arrays);
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
    ld_shooting: 'airRaid',
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
  const createAttack = ({ damage, defender, attacker, info }) => {
    const { normalizeDamage, createTarget } = KC3BattlePrediction.battle;

    return Object.freeze({
      damage: normalizeDamage(damage),
      defender: createTarget(defender),
      attacker: attacker && createTarget(attacker),
      info: info,
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
  const Ship = {};
  const { EMPTY_SLOT } = KC3BattlePrediction;
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Ship.createShip = (hp, maxHp) => ({ hp, maxHp, damageDealt: 0, attacks: [] });

  Ship.installDamecon = (ship, damecon = 0) => Object.assign({}, ship, { damecon });

  Ship.dealDamage = (damage, info) => ship => {
    if (info) { ship.attacks.push(Object.assign({}, info, { hp: ship.hp })); }

    return Object.assign({}, ship, { damageDealt: ship.damageDealt + damage});
  };

  Ship.takeDamage = (damage, info) => ship => {
    const { tryDamecon } = KC3BattlePrediction.fleets.ship;
    if (info) { info.ehp = ship.hp; }
    if (ship.dameConConsumed && ship.hp - damage <= 0) { return ship; }
    const result = Object.assign({}, ship, { hp: ship.hp - damage });

    return result.hp <= 0 ? tryDamecon(result) : result;
  };

  Ship.formatShip = ship => {
    if (ship === EMPTY_SLOT) { return EMPTY_SLOT; }

    return {
      hp: ship.hp,
      dameConConsumed: ship.dameConConsumed || false,
      sunk: ship.hp <= 0,
      damageDealt: ship.damageDealt,
      attacks: ship.attacks
    };
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  Ship.tryDamecon = (ship) => {
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

  Object.assign(window.KC3BattlePrediction.fleets.ship, Ship);
}());
(function () {
  const createTarget = ({ side, position }) => {
    const { validateEnum, battle: { validatePosition }, Side } = KC3BattlePrediction;

    if (!validateEnum(Side, side)) { throw new Error(`Bad side: ${side}`); }
    if (!validatePosition(position)) { throw new Error(`Bad position: ${position}`); }

    return Object.freeze({ side, position });
  };

  // Sanity check position index - should be an integer in range [0,7)
  // Since 2017-11-17 (Event Fall 2017) 7 player ships fleet available
  const validatePosition = (position) => {
    return position >= 0 && position < 12 && position === Math.floor(position);
  };

  Object.assign(window.KC3BattlePrediction.battle, { createTarget, validatePosition });
}());
