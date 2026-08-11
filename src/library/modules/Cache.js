/**
 * Cache.js
 * KC3改 Cache
 *
 * Stores ephemeral query results in an in-memory Map.
 * LRU eviction when size reaches max allowance.
 */
(() => {
  'use strict';

  // up to 128 bytes per entries (key string + small array for sortie ledger)
  const avgEntryBytes = 128;
  // 2 MB / average size
  const maxSize = Math.floor(2 * 1048576 / avgEntryBytes);
  const store = new Map();

  window.KC3Cache = {

    get: (key) => {
      if (!store.has(key)) {
        return Promise.resolve();
      }
      const value = store.get(key);
      store.delete(key);
      // bump to most-recently-used
      store.set(key, value);
      return Promise.resolve({ key, value });
    },

    set: (key, value) => {
      if (store.has(key)) {
        store.delete(key);
      } else if (store.size >= maxSize) {
        // evict oldest-accessed (first key in Map iteration order)
        const first = store.keys().next().value;
        store.delete(first);
      }
      store.set(key, value);
      return Promise.resolve({ key, value });
    },

    remove: (key) => {
      return Promise.resolve(store.delete(key));
    },

    clear: () => {
      store.clear();
      return Promise.resolve();
    },

    usage: () => {
      const used = store.size, quota = maxSize;
      return Promise.resolve({ used, quota });
    },

  };

})();
