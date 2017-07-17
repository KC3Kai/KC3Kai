
QUnit.module('pages > strategy > tabs > logger', function () {
  const logger = KC3StrategyTabs.logger.definition;

  QUnit.module('filters > logTypes', {
    beforeEach() { this.subject = logger.filterFuncs.logTypes; },
  }, function () {
    QUnit.test('check type is set to visible', function (assert) {
      logger.filterState.logTypes = { yellow: true, purple: false };

      assert.ok(this.subject({ type: 'yellow' }));
      assert.notOk(this.subject({ type: 'purple' }));
    });
  });

  QUnit.module('filters > contexts', {
    beforeEach() { this.subject = logger.filterFuncs.contexts; },
  }, function () {
    QUnit.test('check context is set to visible', function (assert) {
      logger.filterState.contexts = { banana: true, potato: false };

      assert.ok(this.subject({ context: 'banana' }));
      assert.notOk(this.subject({ context: 'potato' }));
    });
  });

  QUnit.module('filters > logSearch', {
    beforeEach() { this.subject = logger.filterFuncs.logSearch; },
  }, function () {
    QUnit.test('search message', function (assert) {
      logger.filterState.logSearch = 'small';

      assert.equal(this.subject({ message: 'a big blue dog' }), false);
      assert.equal(this.subject({ message: 'a small blue dog' }), true);
    });

    QUnit.test('search data', function (assert) {
      logger.filterState.logSearch = 'banana';

      assert.equal(this.subject({ data: ['red', 'blue'] }), false);
      assert.equal(this.subject({ data: ['apple', 'orange', 'banana'] }), true);
    });

    QUnit.test('case-insensitive search', function (assert) {
      logger.filterState.logSearch = 'tea';

      assert.equal(this.subject({ message: 'Drinks', data: ['Coffee', 'TEA'] }), true);
    });
  });

  QUnit.module('isDateSplit', {
    beforeEach() { this.subject = logger.isDateSplit; },
  }, function () {
    QUnit.test('true if specified times are on different days', function (assert) {
      const result = this.subject({ timestamp: new Date(2017, 1, 1).getTime() },
        { timestamp: new Date(2017, 1, 2).getTime() });

      assert.equal(result, true);
    });

    QUnit.test('false if specified times are on the same day', function (assert) {
      const result = this.subject({ timestamp: new Date(2017, 1, 1, 5) },
        { timestamp: new Date(2017, 1, 1, 20) });

      assert.equal(result, false);
    });
  });

  QUnit.module('createDateSeparator', {
    beforeEach() { this.subject = logger.createDateSeparator; },
  }, function () {
    QUnit.test('success', function (assert) {
      const entry = { timestamp: new Date().getTime() };

      const result = this.subject(entry);

      assert.deepEqual(result, {
        type: 'dateSeparator',
        timestamp: entry.timestamp,
      });
    });
  });

  QUnit.module('elementFactory > error > formatStack', {
    beforeEach() { this.subject = logger.formatStack; },
  }, function () {
    QUnit.test('undefined stack', function (assert) {
      const result = this.subject();

      assert.equal(result, '');
    });

    QUnit.test('replace chrome extension id', function (assert) {
      const stack = `at loadLogEntries (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/pages/strategy/tabs/logger/logger.js:56:18)
at Object.execute (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/pages/strategy/tabs/logger/logger.js:30:21)
at chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/library/objects/StrategyTab.js:80:21
at Object.success (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/library/objects/StrategyTab.js:40:6)
at i (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:2:27151)
at Object.fireWith [as resolveWith] (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:2:27914)
at z (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:4:12059)
at XMLHttpRequest.<anonymous> (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:4:15619)`;

      const result = this.subject(stack);

      assert.equal(result, `at loadLogEntries (src/pages/strategy/tabs/logger/logger.js:56:18)
at Object.execute (src/pages/strategy/tabs/logger/logger.js:30:21)
at src/library/objects/StrategyTab.js:80:21
at Object.success (src/library/objects/StrategyTab.js:40:6)
at i (src/assets/js/jquery.min.js:2:27151)
at Object.fireWith [as resolveWith] (src/assets/js/jquery.min.js:2:27914)
at z (src/assets/js/jquery.min.js:4:12059)
at XMLHttpRequest.<anonymous> (src/assets/js/jquery.min.js:4:15619)`);
    });
  });

  QUnit.module('getCallsite', {
    beforeEach() { this.subject = logger.getCallsite; },
  }, function () {
    QUnit.test('named function', function (assert) {
      const stack = `Error: message
at loadLogEntries (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/pages/strategy/tabs/logger/logger.js:56:18)
at Object.execute (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/pages/strategy/tabs/logger/logger.js:30:21)
at chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/library/objects/StrategyTab.js:80:21
at Object.success (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/library/objects/StrategyTab.js:40:6)
at i (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:2:27151)
at Object.fireWith [as resolveWith] (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:2:27914)
at z (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:4:12059)
at XMLHttpRequest.<anonymous> (chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/assets/js/jquery.min.js:4:15619)`;

      const result = this.subject(stack);

      assert.deepEqual(result, {
        short: 'logger.js:56',
        full: 'src/pages/strategy/tabs/logger/logger.js:56:18',
      });
    });

    QUnit.test('anonymous function', function (assert) {
      const stack = `Error: gameScreenChg
at chrome-extension://hgnaklcechmjlpaeamgcnagnhpjhllne/library/modules/Service.js:471:12
at EventImpl.dispatchToListener (extensions::event_bindings:388:22)
at Event.publicClassPrototype.(anonymous function) [as dispatchToListener] (extensions::utils:149:26)
at EventImpl.dispatch_ (extensions::event_bindings:372:35)
at EventImpl.dispatch (extensions::event_bindings:394:17)
at Event.publicClassPrototype.(anonymous function) [as dispatch] (extensions::utils:149:26)
at messageListener (extensions::messaging:196:29)`;

      const result = this.subject(stack);

      assert.deepEqual(result, {
        short: 'Service.js:471',
        full: 'src/library/modules/Service.js:471:12',
      });
    });
  });
});
