// Sync logic unique to the content script context

(function () {
  'use strict';

  // Use messaging to invoke a specified KC3QuestSync method in the background context
  // See Service.js (questSync) for details
  const call = (method, { isAsync = false } = {}) => {
    return (...args) => {
      return new Promise((resolve, reject) => {
        (new RMsg('service', 'questSync', { method, args, isAsync }, ({ error, success } = {}) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (error) {
            reject(error);
          } else {
            resolve(success);
          }
        })).execute();
      });
    };
  };

  const QuestSync = {
    startRemoteTracking: call('startRemoteTracking', { isAsync: true }),
    stopRemoteTracking: call('stopRemoteTracking', { isAsync: true }),
    syncOnStartup: call('syncOnStartup', { isAsync: true }),
  };

  // ----------------------------------------------------------------------- //
  // --------------------------[ GLOBAL INIT ]------------------------------ //
  // ----------------------------------------------------------------------- //

  window.KC3QuestSync = $.extend(window.KC3QuestSync || {}, QuestSync);
}());
