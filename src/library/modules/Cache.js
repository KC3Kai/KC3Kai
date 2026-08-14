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
  // known for now:
  //  * key string + small array for sortie ledger < 128 bytes;
  //  * mstship list html > 995 KB; mstgear list html > 230 KB; akashi list html > 1.5 MB (x7 DoW)
  const avgEntryBytes = 8192;
  // detected memory (in GB) * MB / average size ~= 512 entries for 4 GB RAM
  const maxSize = Math.floor((navigator.deviceMemory || 4) * 1048576 / avgEntryBytes);
  const store = new Map();

  window.KC3Cache = {

    get: (key) => {
      if (!store.has(key)) {
        // key === undefined means no hit
        return Promise.resolve({});
      }
      const value = store.get(key);
      store.delete(key);
      // bump to most-recently-used
      store.set(key, value);
      return Promise.resolve({ key, value });
    },

    getSync: (key, defaultValue) => {
      if (!store.has(key)) {
        // value === defaultValue === undefined equals to no hit
        return defaultValue;
      }
      const value = store.get(key);
      store.delete(key);
      store.set(key, value);
      return value;
    },

    getOrInsertComputed: (key, missCallback, hitCallback) => {
      if (store.has(key)) {
        const cachedValue = KC3Cache.getSync(key);
        if (typeof hitCallback === "function") {
          hitCallback(cachedValue, key);
        }
        return cachedValue;
      }
      if (typeof missCallback === "function") {
        const computedValue = missCallback(key);
        KC3Cache.setSync(key, computedValue);
        return computedValue;
      }
      return missCallback;
    },

    set: (key, value) => {
      if (key === undefined) {
        return Promise.resolve({});
      }
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
      if (key === undefined) {
        return;
      }
      if (store.has(key)) {
        store.delete(key);
      } else if (store.size >= maxSize) {
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

    usage: (sync = false) => {
      const used = store.size, quota = maxSize;
      const keys = Array.from(store.keys());
      const retval = { used, quota, keys };
      return sync ? retval : Promise.resolve(retval);
    },

  };

})();
