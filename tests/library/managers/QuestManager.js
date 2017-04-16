const MS_PER_HOUR = 1000 * 60 * 60;

QUnit.module('managers > QuestManager', function () {
  QUnit.module('repeatableTypes > key', function () {
    QUnit.test('daily', function (assert) {
      const result = KC3QuestManager.repeatableTypes.daily.key;

      assert.equal(result, 'timeToResetDailyQuests');
    });

    QUnit.test('weekly', function (assert) {
      const result = KC3QuestManager.repeatableTypes.weekly.key;

      assert.equal(result, 'timeToResetWeeklyQuests');
    });

    QUnit.test('monthly', function (assert) {
      const result = KC3QuestManager.repeatableTypes.monthly.key;

      assert.equal(result, 'timeToResetMonthlyQuests');
    });

    QUnit.test('quarterly', function (assert) {
      const result = KC3QuestManager.repeatableTypes.quarterly.key;

      assert.equal(result, 'timeToResetQuarterlyQuests');
    });
  });

  QUnit.module('repeatableTypes > type', function () {
    QUnit.test('daily', function (assert) {
      const result = KC3QuestManager.repeatableTypes.daily.type;

      assert.equal(result, 'daily');
    });

    QUnit.test('weekly', function (assert) {
      const result = KC3QuestManager.repeatableTypes.weekly.type;

      assert.equal(result, 'weekly');
    });

    QUnit.test('monthly', function (assert) {
      const result = KC3QuestManager.repeatableTypes.monthly.type;

      assert.equal(result, 'monthly');
    });

    QUnit.test('quarterly', function (assert) {
      const result = KC3QuestManager.repeatableTypes.quarterly.type;

      assert.equal(result, 'quarterly');
    });
  });

  QUnit.module('getRepeatableIds', {
    beforeEach() { this.subject = KC3QuestManager.getRepeatableIds; },
  }, function () {
    KC3QuestManager.getRepeatableTypes().forEach(function ({ type, questIds }) {
      QUnit.test(`${type}`, function (assert) {
        const result = this.subject(type);

        assert.deepEqual(result, questIds);
      });
    });

    QUnit.test('bad type', function (assert) {
      const result = this.subject('blah');

      assert.deepEqual(result, []);
    });
  });

  QUnit.module('repeatableTypes > daily > calculateNextReset', {
    beforeEach() { this.subject = KC3QuestManager.repeatableTypes.daily.calculateNextReset; },
  }, function () {
    // JST is +9 GMT, so 05:00 JST === 20:00 UTC
    QUnit.test('if earlier than 8 PM, return 8PM of same day', function (assert) {
      const start = new Date(Date.UTC(2015, 3, 1)).getTime();
      const expected = new Date(Date.UTC(2015, 3, 1, 20)).getTime();

      assert.equal(this.subject(start), expected);
      assert.equal(this.subject(expected - 1), expected);
      assert.notEqual(this.subject(expected), expected);
    });

    QUnit.test('if later than 8 PM, return 8 PM of next day', function (assert) {
      const start = new Date(Date.UTC(2015, 3, 1, 20)).getTime();
      const expected = new Date(Date.UTC(2015, 3, 2, 20)).getTime();

      assert.equal(this.subject(start), expected);
      assert.notEqual(this.subject(start - 1), expected);
      assert.equal(this.subject(expected - 1), expected);
      assert.notEqual(this.subject(expected), expected);
    });
  });

  QUnit.module('repeatableTypes > weekly > calculateNextReset', {
    beforeEach() { this.subject = KC3QuestManager.repeatableTypes.weekly.calculateNextReset; },
  }, function () {
    QUnit.test('next reset is Sunday', function (assert) {
      const startOfSunday = new Date(Date.UTC(2017, 3, 30)).getTime() - (4 * MS_PER_HOUR);
      const expected = new Date(Date.UTC(2017, 3, 30, 20)).getTime();

      assert.equal(this.subject(startOfSunday), expected);
      assert.equal(this.subject(expected - 1), expected);
      assert.notEqual(this.subject(expected), expected);
    });

    QUnit.test('next reset is not on Sunday', function (assert) {
      const startOfWeek = new Date(Date.UTC(2017, 3, 23, 20)).getTime();
      const expected = new Date(Date.UTC(2017, 3, 30, 20)).getTime();

      assert.equal(this.subject(startOfWeek), expected);
      assert.notEqual(this.subject(startOfWeek - 1), expected);
      assert.equal(this.subject(expected - 1), expected);
      assert.notEqual(this.subject(expected), expected);
    });
  });

  QUnit.module('repeatableTypes > monthly > calculateNextReset', {
    beforeEach() { this.subject = KC3QuestManager.repeatableTypes.monthly.calculateNextReset; },
  }, function () {
    QUnit.test('get reset on last day of the month', function (assert) {
      const startOfMonth = new Date(Date.UTC(2017, 3)).getTime() - (4 * MS_PER_HOUR);
      const expected = new Date(Date.UTC(2017, 4)).getTime() - (4 * MS_PER_HOUR);

      assert.equal(this.subject(startOfMonth), expected);
      assert.notEqual(this.subject(startOfMonth - 1), expected);
      assert.equal(this.subject(expected - 1), expected);
      assert.notEqual(this.subject(expected), expected);
    });
  });

  QUnit.module('repeatableTypes > quarterly > calculateNextReset', {
    beforeEach() { this.subject = KC3QuestManager.repeatableTypes.quarterly.calculateNextReset; },
  }, function () {
    QUnit.test('June quarter', function (assert) {
      const startOfQuarter = new Date(Date.UTC(2017, 2)).getTime() - (4 * MS_PER_HOUR);
      const expected = new Date(Date.UTC(2017, 5)).getTime() - (4 * MS_PER_HOUR);

      assert.equal(this.subject(startOfQuarter), expected);
      assert.notEqual(this.subject(startOfQuarter - 1), expected);
      assert.equal(this.subject(expected - 1), expected);
      assert.notEqual(this.subject(expected), expected);
    });

    QUnit.test('September quarter', function (assert) {
      const startOfQuarter = new Date(Date.UTC(2017, 5)).getTime() - (4 * MS_PER_HOUR);
      const expected = new Date(Date.UTC(2017, 8)).getTime() - (4 * MS_PER_HOUR);

      assert.equal(this.subject(startOfQuarter), expected);
      assert.notEqual(this.subject(startOfQuarter - 1), expected);
      assert.equal(this.subject(expected - 1), expected);
      assert.notEqual(this.subject(expected), expected);
    });

    QUnit.test('December quarter', function (assert) {
      const startOfQuarter = new Date(Date.UTC(2017, 8)).getTime() - (4 * MS_PER_HOUR);
      const expected = new Date(Date.UTC(2017, 11)).getTime() - (4 * MS_PER_HOUR);

      assert.equal(this.subject(startOfQuarter), expected);
      assert.notEqual(this.subject(startOfQuarter - 1), expected);
      assert.equal(this.subject(expected - 1), expected);
      assert.notEqual(this.subject(expected), expected);
    });

    QUnit.module('March quarter', function () {
      QUnit.test('January + February', function (assert) {
        const startOfYear = new Date(Date.UTC(2017, 0)).getTime() - (4 * MS_PER_HOUR);
        const expected = new Date(Date.UTC(2017, 2)).getTime() - (4 * MS_PER_HOUR);

        assert.equal(this.subject(startOfYear), expected);
        assert.equal(this.subject(expected - 1), expected);
        assert.notEqual(this.subject(expected), expected);
      });

      QUnit.test('December', function (assert) {
        const startOfQuarter = new Date(Date.UTC(2016, 11)).getTime() - (4 * MS_PER_HOUR);
        const expected = new Date(Date.UTC(2017, 2)).getTime() - (4 * MS_PER_HOUR);

        assert.equal(this.subject(startOfQuarter), expected);
        assert.notEqual(this.subject(startOfQuarter - 1), expected);
        assert.equal(this.subject(expected - 1), expected);
        assert.notEqual(this.subject(expected), expected);
      });
    });
  });

  QUnit.module('getLocalData', {
    beforeEach() { this.subject = KC3QuestManager.getLocalData; },
  }, function () {
    QUnit.test('quests', function (assert) {
      const quests = JSON.stringify({ test: 'hello' });
      localStorage.quests = quests;

      const { quests: result } = this.subject();

      assert.deepEqual(result, quests);
    });

    QUnit.test('empty localStorage', function (assert) {
      localStorage.removeItem('quests');

      const { quests: result } = this.subject();

      assert.deepEqual(result, '{}');
    });

    QUnit.test('reset times', function (assert) {
      const now = Date.now();
      localStorage.timeToResetDailyQuests = now;
      localStorage.timeToResetWeeklyQuests = now + 1;
      localStorage.timeToResetMonthlyQuests = now + 2;
      localStorage.timeToResetQuarterlyQuests = now + 3;

      const result = this.subject();

      assert.equal(result.timeToResetDailyQuests, now);
      assert.equal(result.timeToResetWeeklyQuests, now + 1);
      assert.equal(result.timeToResetMonthlyQuests, now + 2);
      assert.equal(result.timeToResetQuarterlyQuests, now + 3);
    });

    QUnit.test('reset time defaults', function (assert) {
      localStorage.removeItem('timeToResetDailyQuests');
      localStorage.removeItem('timeToResetWeeklyQuests');
      localStorage.removeItem('timeToResetMonthlyQuests');
      localStorage.removeItem('timeToResetQuarterlyQuests');

      const result = this.subject();

      const { daily, weekly, monthly, quarterly } = KC3QuestManager.repeatableTypes;
      const now = Date.now();
      assert.equal(result.timeToResetDailyQuests, daily.calculateNextReset(now));
      assert.equal(result.timeToResetWeeklyQuests, weekly.calculateNextReset(now));
      assert.equal(result.timeToResetMonthlyQuests, monthly.calculateNextReset(now));
      assert.equal(result.timeToResetQuarterlyQuests, quarterly.calculateNextReset(now));
    });
  });

  QUnit.module('removeQuests', {
    beforeEach() {
      this.subject = KC3QuestManager.removeQuests;
    },
  }, function () {
    QUnit.test('null specified ids', function (assert) {
      const result = this.subject({}, [1, 2, 3]);

      assert.equal(Object.keys(result).length, 3);
      assert.equal(result.q1, null);
      assert.equal(result.q2, null);
      assert.equal(result.q3, null);
    });
  });

  QUnit.module('getIdList', {
    beforeEach() { this.subject = KC3QuestManager.getIdList; },
  }, function () {
    QUnit.test('return ids as list', function (assert) {
      const remote = { q1: 1, q2: 2 };
      const local = { q3: 3 };

      const result = this.subject(remote, local);

      assert.deepEqual(result, ['q1', 'q2', 'q3']);
    });

    QUnit.test('deduplicate ids', function (assert) {
      const remote = { q1: 1, q2: 2 };
      const local = { q2: 3, q3: 4 };

      const result = this.subject(remote, local);

      assert.deepEqual(result, ['q1', 'q2', 'q3']);
    });
  });

  QUnit.module('selectSingleStageTracking', {
    beforeEach() { this.subject = KC3QuestManager.selectSingleStageTracking; },
  }, function () {
    QUnit.test('select higher progress', function (assert) {
      const remote = { tracking: [[6, 10]] };
      const local = { tracking: [[5, 10]] };

      const result = this.subject(remote, local);

      assert.equal(result, remote);
    });

    QUnit.test('progress equal', function (assert) {
      const remote = { tracking: [[5, 10]] };
      const local = { tracking: [[5, 10]] };

      const result = this.subject(remote, local);

      assert.equal(result, local);
    });
  });

  QUnit.module('mergeMultiStageTracking', {
    beforeEach() { this.subject = KC3QuestManager.mergeMultiStageTracking; },
  }, function () {
    QUnit.test('selected highest for each stage', function (assert) {
      const remote = { tracking: [[3, 36], [5, 24]] };
      const local = { tracking: [[6, 36], [3, 24]] };

      const result = this.subject(remote, local);

      assert.deepEqual(result, { tracking: [[6, 36], [5, 24]] });
    });
  });

  QUnit.module('saveToLocal', {
    beforeEach() { this.subject = KC3QuestManager.saveToLocal; },
  }, function () {
    QUnit.test('save quests', function (assert) {
      const quests = { test: 'hello' };

      this.subject(quests);

      assert.equal(localStorage.quests, JSON.stringify(quests));
    });

    QUnit.test('mark timeToReset[...]Quests for recalculation', function (assert) {
      KC3QuestManager.timeToResetDailyQuests = Date.now();
      KC3QuestManager.timeToResetWeeklyQuests = Date.now();
      KC3QuestManager.timeToResetMonthlyQuests = Date.now();
      KC3QuestManager.timeToResetQuarterlyQuests = Date.now();

      this.subject({});

      assert.equal(localStorage.timeToResetDailyQuests, null);
      assert.equal(localStorage.timeToResetWeeklyQuests, null);
      assert.equal(localStorage.timeToResetMonthlyQuests, null);
      assert.equal(localStorage.timeToResetQuarterlyQuests, null);
    });
  });
});
