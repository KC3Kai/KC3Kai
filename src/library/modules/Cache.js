/**
 * Cache.js
 * KC3改 Cache
 *
 * Stores ephemeral query results in an in-memory Map.
 * LRU eviction when size reaches `MAX_ENTRIES`.
 */
(() => {
  'use strict';

  const MAX_ENTRIES = 500;
  const store = new Map();

  window.KC3Cache = {

    get: (key) => {
      if (!store.has(key)) {
        return Promise.resolve(undefined);
      }
      const value = store.get(key);
      store.delete(key);
      // bump to most-recently-used
      store.set(key, value);
      return Promise.resolve({ value });
    },

    set: (key, value) => {
      if (store.has(key)) {
        store.delete(key);
      } else if (store.size >= MAX_ENTRIES) {
        // evict oldest-accessed (first key in Map iteration order)
        const first = store.keys().next().value;
        store.delete(first);
      }
      store.set(key, value);
      return Promise.resolve();
    },

    remove: (key) => {
      return Promise.resolve(store.delete(key));
    },

    clear: () => {
      store.clear();
      return Promise.resolve();
    },

  };

})();
