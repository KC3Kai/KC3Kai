QUnit.module('modules > ImageExport', function () {
  QUnit.module('setMethodOrder', {
    beforeEach() {
      this.subject = KC3ImageExport.setMethodOrder;
    },
  }, function () {
    QUnit.test('download first', function (assert) {
      const result = this.subject('0');

      assert.deepEqual(result, ['saveDownload', 'saveTab']);
    });

    QUnit.test('tab first', function (assert) {
      const result = this.subject('2');

      assert.deepEqual(result, ['saveTab', 'saveDownload']);
    });

    QUnit.test('imgur first', function (assert) {
      const result = this.subject('1');

      assert.deepEqual(result, ['saveImgur', 'saveDownload', 'saveTab']);
    });

    QUnit.test('bad params', function (assert) {
      const DEFAULT = ['saveDownload', 'saveTab'];

      assert.deepEqual(this.subject('-1'), DEFAULT);
      assert.deepEqual(this.subject('3'), DEFAULT);
      assert.deepEqual(this.subject('blah'), DEFAULT);
    });
  });

  QUnit.module('composeDownloadPath', {
    beforeEach() {
      this.subject = KC3ImageExport.composeDownloadPath;
    },
  }, function () {
    QUnit.test('directory exists', function (assert) {
      const result = this.subject('dir', 'file', 'format');

      assert.equal(result, 'dir/file.format');
    });

    QUnit.test('directory does not exist', function (assert) {
      const result = this.subject('', 'file', 'format');

      assert.equal(result, 'file.format');
    });
  });

  QUnit.module('imgur.checkUploadTimeout', {
    beforeEach() {
      this.subject = KC3ImageExport.checkUploadTimeout;
    },
  }, function () {
    QUnit.test('elapsed >= 10 seconds', function (assert) {
      const now = Date.now();
      KC3ImageExport.lastUpload = now - (10 * 1000);

      this.subject();

      assert.equal(KC3ImageExport.lastUpload >= now && KC3ImageExport.lastUpload <= now + 5, true);
    });

    QUnit.test('elapsed < 10 seconds', function (assert) {
      const now = Date.now();
      KC3ImageExport.lastUpload = now - (5 * 1000);

      assert.throws(() => { this.subject(); }, /ImageExport: upload timeout not elapsed/);
    });
  });
});
