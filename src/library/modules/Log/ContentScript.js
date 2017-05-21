(function () {
  'use strict';

  const Log = {};

  Log.saveToDb = (data) => {
    return KC3Log.requestSaveToDb($.extend({}, data, { context: 'Content Script' }));
  };

  window.KC3Log = $.extend(window.KC3Log || {}, Log);
}());
