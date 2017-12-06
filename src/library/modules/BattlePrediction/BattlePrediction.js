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

  BP.Time = Object.freeze({ DAY: 'day', NIGHT: 'night', NIGHT_TO_DAY: 'night_to_day' });

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
