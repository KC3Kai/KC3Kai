/**
 * Cache.js
 * KC3改 Generic Cache
 * 
 * Stores ephemeral/immutable query results in a separate IndexedDB (kc3_cache).
 * Uses Dexie.js — must load after Dexie and before any consumer.
 */
(() => {
  'use strict';

  const debug = false;
  const _debug = (fn) => { if (debug) { fn(); } };

  const INVALIDATION_ID = 'cache:invalidation:at';
  const INVALIDATION_THRESHOLD = 86400000;   // 1 day in ms
  const INVALIDATION_INTERVAL = 3600000;     // 1 hour in ms

  const dbNonFunc = function (t) { };
  const dbProposed = {};
  const dbUpdates = [
    {
      vr: 0.1,
      ch: {
        queries: 'id, created_at, value',
      },
    },
  ];

  window.KC3Cache = {
    _initPromise: null,

    init: function () {
      if (this._initPromise) {
        return this._initPromise;
      }

      this.db = new Dexie('kc3_cache');

      dbUpdates.forEach((dbCurr) => {
        dbCurr = Object.assign({ vr: 0, ch: {}, rm: [], up: dbNonFunc }, dbCurr);

        Object.keys(dbCurr.ch).forEach((k) => {
          dbProposed[k] = dbCurr.ch[k];
        });

        dbCurr.rm.forEach((k) => {
          delete dbProposed[k];
        });

        const dbVer = this.db.version(dbCurr.vr).stores(dbProposed);

        if (dbCurr.up !== dbNonFunc) {
          dbVer.upgrade(dbCurr.up);
        }
      });

      this._initPromise = this.db.open()
        .then(() => {
          console.log('KC3Cache initialized');
        })
        .catch((err) => {
          this._initPromise = null;
          this.db = null;
          throw err;
        });

      return this._initPromise;
    },

    get: function (key) {
      return this.init()
        .then(() => {
          _debug(() => console.time(key));
          return this.db.queries.get(key);
        })
        .then((value) => {
          _debug(() => console.debug('KC3Cache.get', key, value));
          return value;
        })
        .catch((err) => {
          console.warn(err.message);
          throw err;
        })
        .finally(() => {
          _debug(() => console.timeEnd(key));
        });
    },

    anyOf: function (keys) {
      return this.init()
        .then(() => {
          _debug(() => console.time(keys));
          return this.db.queries.where('id').anyOf(keys).toArray();
        })
        .then((value) => {
          _debug(() => console.debug('KC3Cache.anyOf', keys, value));
          return value;
        })
        .catch((err) => {
          console.warn(err.message);
          throw err;
        })
        .finally(() => {
          _debug(() => console.timeEnd(keys));
        });
    },

    set: function (key, value) {
      return this.init()
        .then(() => this.db.queries.put({
          id: key,
          created_at: Date.now(),
          value: value
        }))
        .then(() => {
          _debug(() => console.debug('KC3Cache.set', key));
        });
    },

    remove: function (key) {
      if (!key || key <= 0) {
        return Promise.resolve();
      }
      return this.init()
        .then(() => this.db.queries.delete(key))
        .then(() => {
          _debug(() => console.debug('KC3Cache.remove', key));
        });
    },

    clear: function () {
      return this.init()
        .then(() => this.db.queries.clear())
        .then(() => {
          _debug(() => console.debug('KC3Cache.clear'));
        });
    },

    invalidate: function (timestamp) {
      return this.init()
        .then(() => {
          const threshold = timestamp - INVALIDATION_THRESHOLD;
          console.time('cache:invalidation');
          return this.db.queries.where('created_at').below(threshold).delete();
        })
        .then(() => this.db.queries.put({
          id: INVALIDATION_ID,
          created_at: Date.now(),
          value: timestamp
        }))
        .then(() => {
          console.timeEnd('cache:invalidation');
          console.debug('KC3Cache invalidated at', new Date(timestamp));
        });
    },
  };

  function _startInvalidationLoop() {
    console.debug('KC3Cache invalidation loop start');

    window.KC3Cache.get(INVALIDATION_ID)
      .then((sentinel) => {
        if (!sentinel) {
          console.debug('KC3Cache no sentinel, running now');
        } else {
          const nextCheckpoint = sentinel.value + INVALIDATION_INTERVAL;
          console.debug('KC3Cache last invalidation:', new Date(sentinel.value), '>>> next at:', new Date(nextCheckpoint));

          if (Date.now() < nextCheckpoint) {
            setTimeout(_startInvalidationLoop, nextCheckpoint - Date.now());
            return;
          }
        }

        return window.KC3Cache.invalidate(Date.now())
          .then(() => {
            _startInvalidationLoop();
          });
      })
      .catch((err) => {
        console.warn('KC3Cache invalidation loop error', err);
        setTimeout(_startInvalidationLoop, INVALIDATION_INTERVAL);
      });
  }

  _startInvalidationLoop();

})();
