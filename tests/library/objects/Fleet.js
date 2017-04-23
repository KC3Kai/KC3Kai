QUnit.module('Objects > Fleet > AkashiRepair', {
  beforeEach() {
    this.fleet = new KC3Fleet();
  }
}, function () {
  QUnit.module('._updateRepairStatus', {
    beforeEach() {
      this.shipObj = {
        isStriped() { return false; },
        isFree() { return true; },
        akashiMark: null,
      };

      this.subject = this.fleet._updateRepairStatus.bind(this.fleet);
    }
  }, function () {
    QUnit.test('0 slots', function (assert) {
      var func = this.subject(0);
      
      func(1234, 0, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 1, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 2, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 3, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 4, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 5, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
    });

    QUnit.test('2 slots', function (assert) {
      var func = this.subject(2);
      
      func(1234, 0, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 1, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 2, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 3, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 4, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 5, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
    });

    QUnit.test('3 slots', function (assert) {
      var func = this.subject(3);
      
      func(1234, 0, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 1, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 2, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 3, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 4, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 5, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
    });

    QUnit.test('4 slots', function (assert) {
      var func = this.subject(4);
      
      func(1234, 0, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 1, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 2, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 3, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 4, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
      func(1234, 5, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
    });

    QUnit.test('5 slots', function (assert) {
      var func = this.subject(5);
      
      func(1234, 0, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 1, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 2, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 3, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 4, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 5, this.shipObj);
      assert.equal(this.shipObj.akashiMark, false);
    });

    QUnit.test('6 slots', function (assert) {
      var func = this.subject(6);
      
      func(1234, 0, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 1, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 2, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 3, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 4, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
      func(1234, 5, this.shipObj);
      assert.equal(this.shipObj.akashiMark, true);
    });

    QUnit.test('isStriped', function (assert) {
      var func = this.subject(1);
      this.shipObj.isStriped = function () { return true; };

      func(1234, 0, this.shipObj);

      assert.equal(this.shipObj.akashiMark, false);
    });

    QUnit.test('!isFree', function (assert) {
      var func = this.subject(1);
      this.shipObj.isFree = function () { return false; };

      func(1234, 0, this.shipObj);

      assert.equal(this.shipObj.akashiMark, false);
    });
  });
});