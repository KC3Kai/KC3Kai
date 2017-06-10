/*
  Use Chrome messaging to invoke DB writes remotely, to avoid needing that dependency everywhere
  See Background.js for corresponding listener
*/
(function () {
  'use strict';

  const Log = {};

  Log.requestSaveToDb = (data) => {
    const message = { action: 'saveLogToDb', log: data };
    return KC3Log.sendMessage(message)
      .then(KC3Log.readResponse);
  };

  // ------------------------[ INTERNAL METHODS ]--------------------------- //

  Log.sendMessage = (message) => {
    return new Promise((resolve, reject) => {
      $.extend(message, { identifier: 'kc3_log' });
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  };

  Log.readResponse = ({ result, error }) => {
    if (error) { throw error; }
    return result;
  };

  window.KC3Log = $.extend(window.KC3Log || {}, Log);
}());
