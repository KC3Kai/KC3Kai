QUnit.module('Objects > AkashiRepair', function () {
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
});