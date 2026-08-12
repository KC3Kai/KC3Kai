/**
 * Cache.js
 * KC3改 Cache instance based on key-value storage.
 *
 * Stores ephemeral query results in an in-memory Map backend.
 * LRU eviction when size reaches max allowance.
 */
(() => {
  'use strict';

  // assuming up to 8 KB per entries,
  // for now, key string + small array for sortie ledger < 128 bytes
  const avgEntryBytes = 8192;
  // detected memory (in GB) * MB / average size ~= 512 entries for 4 GB RAM
  const maxSize = Math.floor((navigator.deviceMemory || 4) * 1048576 / avgEntryBytes);
  const store = new Map();

  window.KC3Cache = {

    get: (key) => {
      if (!store.has(key)) {
        return Promise.resolve({ key });
      }
      const value = store.get(key);
      store.delete(key);
      // bump to most-recently-used
      store.set(key, value);
      return Promise.resolve({ key, value });
    },

    getSync: (key, defaultValue) => {
      if (!store.has(key)) {
        return defaultValue;
      }
      const value = store.get(key);
      store.delete(key);
      store.set(key, value);
      return value;
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

    setSync: (key, value) => {
      if (store.has(key)) {
        store.delete(key);
      } else if (store.size >= maxSize) {
        // evict oldest-accessed (first key in Map iteration order)
        const first = store.keys().next().value;
        store.delete(first);
      }
      return store.set(key, value);
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
