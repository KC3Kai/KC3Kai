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
