QUnit.module('Objects > AkashiRepair', function () {
  QUnit.module('.calculateRepairTime', {
    beforeEach() {
      this.subject = KC3AkashiRepair.calculateRepairTime;
    }
  }, function () {
    QUnit.test('success', function (assert) {
      // subtract 30 seconds, then round up to the nearest minute
      assert.equal(this.subject(10.5 * 60 * 1000 - 1), 10 * 60 * 1000);
      assert.equal(this.subject(10.5 * 60 * 1000), 10 * 60 * 1000);
      assert.equal(this.subject(10.5 * 60 * 1000 + 1), 11 * 60 * 1000);
    });
  });

  QUnit.module('DeltaTime', function () {
    QUnit.module('.canDoRepair()', {
      beforeEach() {
        this.deltaTime = new KC3AkashiRepair.DeltaTime();
        this.subject = this.deltaTime.canDoRepair.bind(this.deltaTime);
      }
    }, function () {
      QUnit.test('timeElapsed > 20 minutes', function (assert) {
        this.deltaTime.startTime = this.deltaTime.now - 20 * 60 * 1000 - 1;

        const result = this.subject();

        assert.equal(result, true);
      });

      QUnit.test('timeElapsed = 20 minutes', function (assert) {
        this.deltaTime.startTime = this.deltaTime.now - 20 * 60 * 1000;

        const result = this.subject();

        assert.equal(result, true);
      });

      QUnit.test('timeElapsed < 20 minutes', function (assert) {
        this.deltaTime.startTime = this.deltaTime.now - 20 * 60 * 1000 + 1;

        const result = this.subject();

        assert.equal(result, false);
      });

      QUnit.test('no timer running', function (assert) {
        this.deltaTime.startTime = undefined;

        const result = this.subject();

        assert.equal(result, false);
      });
    });

    QUnit.module('.ms()', {
      beforeEach() {
        this.deltaTime = new KC3AkashiRepair.DeltaTime();
        this.subject = this.deltaTime.ms.bind(this.deltaTime);
      }
    }, function () {
      QUnit.test('no timer running', function (assert) {
        this.startTime = undefined;

        const result = this.subject();

        assert.equal(result, 0);
      });

      QUnit.test('timer running', function (assert) {
        this.deltaTime.startTime = 0;
        this.deltaTime.now = 10;

        const result = this.subject();

        assert.equal(result, 10);
      });
    });
  });

  QUnit.module('.calculateProgress', {
    beforeEach() {
      this.subject = KC3AkashiRepair.calculateProgress;
    }
  }, function () {
    QUnit.test('timeElapsed > tickLength', function (assert) {
      var dt = new KC3AkashiRepair.DeltaTime(0);
      dt.now = 20.5 * 60 * 1000;
      var tickLength = 8.75 * 60 * 1000;

      const result = this.subject(dt, tickLength, 12345);

      assert.propEqual(result, {
        repairedHp: 2,
        timeToNextRepair: 6.5 * 60 * 1000,
      });
    });

    QUnit.test('timeElapsed < tickLength', function (assert) {
      var dt = new KC3AkashiRepair.DeltaTime(0);
      dt.now = 20.5 * 60 * 1000;
      var tickLength = 22.75 * 60 * 1000;

      const result = this.subject(dt, tickLength, 12345);

      assert.propEqual(result, {
        repairedHp: 1,
        timeToNextRepair: 25.5 * 60 * 1000,
      });
    });

    QUnit.test('cap repairedHp', function (assert) {
      var dt = new KC3AkashiRepair.DeltaTime(0);
      dt.now = 40 * 60 * 1000;
      var tickLength = 22 * 60 * 1000 / 4;
      var hpLost = 4;

      const result = this.subject(dt, tickLength, hpLost);

      assert.propEqual(result, {
        repairedHp: 4,
        timeToNextRepair: 0,
      });
    });
  });

  QUnit.module('.calculateTickLength', {
    beforeEach() {
      this.subject = KC3AkashiRepair.calculateTickLength;
    }
  }, function () {
    QUnit.test('calculate time per tick', function (assert) {
      var repairTime = 21 * 60 * 1000;
      var hpLost = 2;

      const result = this.subject(repairTime, hpLost);

      assert.equal(result, 10.5 * 60 * 1000);
    });

    QUnit.test('round up to nearest ms', function (assert) {
      var repairTime = 10 * 60 * 1000;
      var hpLost = 7;

      const result = this.subject(repairTime, hpLost);

      assert.equal(result, 85715);
    });
  });

  QUnit.module('.calculatePreRepairProgress', {
    beforeEach() {
      this.subject = KC3AkashiRepair.calculatePreRepairProgress;
    }
  }, function () {
    QUnit.test('success', function (assert) {
      var dt = new KC3AkashiRepair.DeltaTime(0);
      dt.now = 10.5 * 60 * 1000;

      const result = this.subject(dt);

      assert.propEqual(result, {
        repairedHp: 0,
        timeToNextRepair: 9.5 * 60 * 1000,
      });
    });
  });
});