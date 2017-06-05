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
    return JSON.stringify(d);
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

    return KC3Log.logMessage('error', message, data)
      .catch((error) => {
        KC3Log.printError(error);
        return Promise.reject(error);
      });
  };

  // ----------------------------------------------------------------------- //
  // ------------------------[ INTERNAL METHODS ]--------------------------- //
  // ----------------------------------------------------------------------- //

  Log.printError = (error) => {
    Log.console.error(error, error.stack); /* RemoveLogging:skip */
  };

  // ---------------------------[ LOG MESSAGE ]----------------------------- //

  Log.logMessage = (logLevel, message, data) => {
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
    Error.captureStackTrace(obj);

    // remove KC3Log's function calls
    const lines = obj.stack.split(/\r?\n/);
    return lines.filter(line => line.indexOf('modules/Log/Log.js') === -1).join('\n');
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
    ConfigManager.loadIfNecessary();
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
