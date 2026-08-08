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
          debug && console.time(key);
          return this.db.queries.get(key);
        })
        .then((value) => {
          debug && console.debug('KC3Cache.get', key, value);
          return value;
        })
        .catch((err) => {
          console.warn(err.message);
          throw err;
        })
        .finally(() => {
          debug && console.timeEnd(key);
        });
    },

    anyOf: function (keys) {
      return this.init()
        .then(() => {
          debug && console.time(keys);
          return this.db.queries.where('id').anyOf(keys).toArray();
        })
        .then((value) => {
          debug && console.debug('KC3Cache.anyOf', keys, value);
          return value;
        })
        .catch((err) => {
          console.warn(err.message);
          throw err;
        })
        .finally(() => {
          debug && console.timeEnd(keys);
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
          debug && console.debug('KC3Cache.set', key);
        });
    },

    remove: function (key) {
      if (!key || key <= 0) {
        return Promise.resolve();
      }
      return this.init()
        .then(() => this.db.queries.delete(key))
        .then(() => {
          debug && console.debug('KC3Cache.remove', key);
        });
    },

    clear: function () {
      return this.init()
        .then(() => this.db.queries.clear())
        .then(() => {
          debug && console.debug('KC3Cache.clear');
        });
    }
  };

})();
