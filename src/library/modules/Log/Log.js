(function () {
  'use strict';

  const CONSOLE_LOG_HOOKS = ['error', 'warn', 'info', 'log', 'assert'];
  const ERROR_LOG_LEVELS = ['error', 'warn'];

  const Log = {
    context: 'Unknown context',
    console: {},
  };

  // record native console methods
  CONSOLE_LOG_HOOKS.forEach((logLevel) => {
    Log.console[logLevel] = console[logLevel].bind(console);
  });

  const stringify = (d) => {
    if (d instanceof Error || typeof d !== 'object') {
      return String(d);
    }
    try {
      return JSON.stringify(d);
    } catch (e) {
      // fail-safe on some objects not able to be stringified
      return String(d);
    }
  };

  // ----------------------------------------------------------------------- //
  // ---------------------------[ PUBLIC API ]------------------------------ //
  // ----------------------------------------------------------------------- //

  Log.error = (message, ...data) => { return KC3Log.logMessage('error', message, data); };
  Log.warn = (message, ...data) => { return KC3Log.logMessage('warn', message, data); };
  Log.info = (message, ...data) => { return KC3Log.logMessage('info', message, data); };
  Log.log = (message, ...data) => { return KC3Log.logMessage('log', message, data); };

  Log.assert = (assertion, message, ...data) => {
    if (assertion) { return Promise.resolve(); }
    return KC3Log.logMessage('error', 'Assertion failed: ' + (message || 'console.assert'), data)
      .catch((error) => {
        KC3Log.printError(error);
        return Promise.reject(error);
      });
  };

  // ----------------------------------------------------------------------- //
  // ------------------------[ INTERNAL METHODS ]--------------------------- //
  // ----------------------------------------------------------------------- //

  Log.printError = (error) => {
    Log.console.error(error, error.stack);
  };

  // ---------------------------[ LOG MESSAGE ]----------------------------- //

  Log.logMessage = (logLevel, message, data) => {
    if (ConfigManager.forwardConsoleOutput) {
      KC3Log.console[logLevel].apply(KC3Log.console, [message].concat(data));
    }
    try {
      const stack = KC3Log.getStackTrace(logLevel, message, data);
      const result = KC3Log.composeEntry({ type: logLevel, message, data, stack });
      return KC3Log.saveToDb(result)
        .catch((error) => {
          KC3Log.printError(error);
          return Promise.reject(error);
        });
    } catch (error) {
      KC3Log.printError(error);
      return Promise.reject(error);
    }
  };

  Log.composeEntry = ({ type, stack, message, data }) => {
    return {
      type,
      stack,
      message: KC3Log.normalizeMessage(message),
      data: KC3Log.stringifyRestParams(data),
    };
  };

  Log.normalizeMessage = (message) => {
    if (message instanceof Error) {
      return message.message;
    }
    return stringify(message);
  };

  Log.stringifyRestParams = (data) => {
    return data.map(stringify);
  };

  // ---------------------------[ STACK TRACE ]----------------------------- //

  Log.getStackTrace = (logLevel, message, data) => {
    if (KC3Log.isErrorLog(logLevel)) {
      const errorObj = KC3Log.lookupErrorParam([message].concat(data));
      return errorObj ? errorObj.stack : KC3Log.generateStackTrace(message);
    }
    return KC3Log.generateStackTrace(message);
  };

  Log.isErrorLog = (logLevel) => {
    return ERROR_LOG_LEVELS.includes(logLevel);
  };

  Log.lookupErrorParam = (params) => {
    return params.find(p => p instanceof Error);
  };

  Log.generateStackTrace = (message) => {
    // create stack trace
    const obj = { message: stringify(message) };
    Error.captureStackTrace(obj, KC3Log.logMessage);

    // remove KC3Log's function calls
    const lines = obj.stack.split(/\r?\n/);
    return lines.filter(line => !line.includes('library/modules/Log/Log.js')).join('\n');
  };

  // ----------------------------------------------------------------------- //
  // ----------------------[ NATIVE CONSOLE HOOKS ]------------------------- //
  // ----------------------------------------------------------------------- //

  Log.loadConsoleHooks = () => {
    CONSOLE_LOG_HOOKS.forEach((logLevel) => { console[logLevel] = KC3Log[logLevel]; });
  };

  Log.unloadConsoleHooks = () => {
    CONSOLE_LOG_HOOKS.forEach((logLevel) => { console[logLevel] = KC3Log.console[logLevel]; });
  };

  Log.updateConsoleHooks = () => {
    ConfigManager.load();
    if (!ConfigManager.disableConsoleLogHooks) {
      KC3Log.loadConsoleHooks();
    } else {
      KC3Log.unloadConsoleHooks();
    }
  };

  // ----------------------------------------------------------------------- //
  // ---------------------------[ GLOBAL INIT ]----------------------------- //
  // ----------------------------------------------------------------------- //
  window.KC3Log = $.extend(window.KC3Log || {}, Log);
  window.addEventListener('storage', ({ key }) => { if (key === 'config') { KC3Log.updateConsoleHooks(); } });

  KC3Log.updateConsoleHooks();
}());
