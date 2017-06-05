(function () {
  'use strict';

  const MS_PER_HOUR = 1000 * 60 * 60;

  const convertErrorToJson = ({ name, message, stack }) => ({ name, message, stack });

  const Log = {};

  // ----------------------------[ SAVE TO DB ]----------------------------- //

  Log.saveToDb = (data) => {
    return KC3Database.loadIfNecessary().then(() => {
      return KC3Database.Log(KC3Log.composeData(data), {
        expireAt: KC3Log.getExpiryTimestamp(),
      });
    });
  };

  Log.getExpiryTimestamp = () => {
    ConfigManager.loadIfNecessary();

    const now = Date.now();
    const logExpiry = now - (ConfigManager.hoursToKeepLogs * MS_PER_HOUR);
    const errorExpiry = now - (ConfigManager.hoursToKeepErrors * MS_PER_HOUR);

    return {
      log: logExpiry,
      info: logExpiry,
      debug: logExpiry,
      warn: errorExpiry,
      error: errorExpiry,
    };
  };

  Log.composeData = (data) => {
    // context prop will be overridden when invoked remotely
    return $.extend({ timestamp: Date.now(), context: 'Background' }, data);
  };

  // -------------------------[ CHROME MESSAGING ]-------------------------- //

  Log.onChromeMessage = (request, sender, callback) => {
    try {
      const { identifier, action } = request;
      if (identifier === 'kc3_log') {
        return KC3Log.messaging[action](request, callback);
      }
    } catch (e) {
      callback({ error: convertErrorToJson(e) });
    }
    return false;
  };

  Log.messaging = {
    saveLogToDb({ log }, callback) {
      KC3Log.saveToDb(log)
        .then((result) => { callback({ result }); })
        .catch((error) => { callback({ error: convertErrorToJson(error) }); });
      return true;
    },
  };

  // -------------------------------[ INIT ]------------------------------- //

  window.KC3Log = $.extend(window.KC3Log || {}, Log);

  chrome.runtime.onMessage.addListener(KC3Log.onChromeMessage);
}());
