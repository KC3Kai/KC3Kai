// Wrapper for chrome's sync storage API
// Allows storage of strings that exceed its size limits for individual items
// Based on https://github.com/kdzwinel/Context/blob/master/js/classes/HugeStorageSync.class.js

(function () {
  const toChunkKey = (key, index) => `${key}_${index}`;
  const fromChunkKey = (chunkKey) => {
    const matches = chunkKey.match(/(.*)_(\d+)$/);
    if (!matches) { return {}; }

    const [, key, index] = matches;
    return { key, index: parseInt(index, 10) };
  };

  const ChromeSync = {
    /*--------------------------------------------------------*/
    /* ----------------------[ PUBLIC ]---------------------- */
    /*--------------------------------------------------------*/

    get(key) {
      return this.load().then(storageData => this.restoreValue(key, storageData));
    },

    set(key, value) {
      return Promise.resolve()
        .then(() => {
          this.validateValue(value);
          return this.formatValue(key, value);
        })
        .then(valuesObj => this.removeOldChunks(key, valuesObj))
        .then(valuesObj => this.save(valuesObj));
    },

    /*--------------------------------------------------------*/
    /* ---------------------[ INTERNAL ]--------------------- */
    /*--------------------------------------------------------*/

    /* -----------------------[ GET ]------------------------ */

    restoreValue(key, storageData) {
      const chunks = this.sortChunks(this.findChunks(key, storageData));
      return this.combineChunks(chunks);
    },

    findChunks(key, storageData) {
      return Object.keys(storageData).reduce((result, chunkKey) => {
        const { key: k, index } = fromChunkKey(chunkKey);

        return k === key
          ? result.concat({ index, chunk: storageData[chunkKey] })
          : result;
      }, []);
    },

    sortChunks(chunks) {
      return chunks.sort((a, b) => a.index - b.index);
    },

    combineChunks(chunks) {
      return chunks.map(({ chunk }) => chunk || '').join('');
    },

    /* -----------------------[ SET ]------------------------ */

    validateValue(value) {
      if (typeof value !== 'string') {
        throw new Error('value is not a string');
      }

      // A more sophisticated check is possible, but chrome's storage API will do it for us anyway
      if (value.length > this.getQuota()) {
        throw new Error(`value's size (${value.length}) exceeds maximum quota (${this.getQuota()})`);
      }
    },

    formatValue(key, value) {
      const result = {};
      let source = value.slice(0);

      for (let i = 0; source.length > 0; i += 1) {
        const chunkKey = toChunkKey(key, i);

        const { chunk, newValue } = this.generateChunk(chunkKey, source);

        result[chunkKey] = chunk;
        source = newValue;
      }

      return result;
    },

    // As per the chrome storage docs:
    // "The maximum size (in bytes) of each individual item in sync storage [...is]
    //  the JSON stringification of its value plus its key length."
    // See: https://developer.chrome.com/apps/storage#property-sync
    generateChunk(chunkKey, value) {
      const maxValueLength = this.getChunkLength() - chunkKey.length;

      let endIndex = maxValueLength;
      let chunk = value.slice(0, endIndex);
      while (JSON.stringify(chunk).length > maxValueLength) {
        endIndex -= 1;
        chunk = value.slice(0, endIndex);
      }

      return { chunk, newValue: value.slice(endIndex) };
    },

    removeOldChunks(key, newChunks) {
      return this.getOldChunks(key)
        .then(oldChunks => this.generateStorageObject(oldChunks, newChunks));
    },

    // Set all old chunks associated with the specified key to null
    // This prevents old data from being mistakenly loaded, as well as potentially freeing some space
    getOldChunks(key) {
      return this.load()
        .then(storageData => this.getOldChunkKeys(key, storageData))
        .then(oldChunkKeys => this.zipKeysToObject(oldChunkKeys));
    },

    getOldChunkKeys(key, storageData) {
      return Object.keys(storageData).filter((chunkKey) => {
        const { key: k } = fromChunkKey(chunkKey);
        return k === key;
      });
    },

    zipKeysToObject(chunkKeys) {
      return chunkKeys.reduce((result, k) => {
        return Object.assign(result, { [k]: null });
      }, {});
    },

    generateStorageObject(oldChunks, newChunks) {
      return Object.assign({}, oldChunks, newChunks);
    },

    /* ------------------[ CHROME STORAGE ]------------------ */

    getQuota() { return chrome.storage.sync.QUOTA_BYTES; },

    getChunkLength() { return chrome.storage.sync.QUOTA_BYTES_PER_ITEM; },

    load() {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (storageData) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(storageData);
          }
        });
      });
    },

    save(valuesObj) {
      return new Promise((resolve, reject) => {
        chrome.storage.sync.set(valuesObj, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    },
  };

  window.KC3ChromeSync = ChromeSync;
}());
