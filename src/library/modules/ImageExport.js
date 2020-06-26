(function init() {
  'use strict';

  // load the database (first time only)
  let loadDb = function () {
    KC3Database.init();
    loadDb = function () {};
  };

  function KC3ImageExport(canvas, { filename, subDir, method, format, quality }) {
    ConfigManager.load();
    loadDb();

    Object.assign(this, {
      filename,
      dir: `${ConfigManager.ss_directory}${subDir ? `/${subDir}` : ''}`,
      format: format || (ConfigManager.ss_type === 'JPG' ? 'jpg' : 'png'),
    });

    this.imageData = KC3ImageExport.composeImageData(canvas, this.format,
      (quality || ConfigManager.ss_quality) / 100
    );

    this.methodOrder = KC3ImageExport.setMethodOrder(method || ConfigManager.ss_mode);

    return this;
  }

  KC3ImageExport.logError = function (e) { console.error(e); };

  /*--------------------------------------------------------*/
  /* ----------------------[ EXPORT ]---------------------- */
  /*--------------------------------------------------------*/

  KC3ImageExport.prototype.export = function (callback) {
    const { bindMethodContext, runExportFuncs, logError } = KC3ImageExport;
    return Promise.resolve()
      .then(bindMethodContext.bind(null, this, this.methodOrder))
      .then(runExportFuncs)
      .then((result) => { callback(null, result); })
      .catch((error) => {
        logError(error);
        callback(error);
      });
  };

  KC3ImageExport.prototype.saveDownload = function () {
    const { composeDownloadPath, download } = KC3ImageExport;

    const path = composeDownloadPath(
        this.dir.toSafeFilename(undefined, true),
        this.filename.toSafeFilename(),
        this.format
    );

    return this.imageData.toUrl()
      .then(download.bind(null, path));
  };

  KC3ImageExport.prototype.saveTab = function () {
    const { openTab } = KC3ImageExport;
    return this.imageData.toUrl()
      .then(openTab);
  };

  KC3ImageExport.prototype.saveImgur = function () {
    const { checkCanUpload, upload, saveLink } = KC3ImageExport;

    return checkCanUpload()
      .then(this.imageData.toBlob)
      .then(upload)
      .then(saveLink);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ IMAGE DATA ]------------------- */
  /*--------------------------------------------------------*/
  const mimeTypes = {
    jpg: 'image/jpeg',
    png: 'image/png',
  };
  const createObjectURL = function (blob) {
    const url = URL.createObjectURL(blob);
    return { url, cleanup() { URL.revokeObjectURL(url); } };
  };

  KC3ImageExport.composeImageData = function (canvas, format, quality) {
    const { toBlob, toUrl } = KC3ImageExport;
    return {
      toUrl() { return toUrl(canvas, format, quality); },
      toBlob() { return toBlob(canvas, format, quality); },
    };
  };

  KC3ImageExport.toBlob = function (canvas, format, quality) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, mimeTypes[format], quality);
    });
  };

  KC3ImageExport.toUrl = function (canvas, format, quality) {
    const { toBlob } = KC3ImageExport;
    return toBlob(canvas, format, quality)
      .then(createObjectURL);
  };

  /*--------------------------------------------------------*/
  /* ----------------------[ HELPERS ]--------------------- */
  /*--------------------------------------------------------*/

  KC3ImageExport.setMethodOrder = function (ssMode) {
    let funcs = [
      { name: 'saveDownload', priority: 0 },
      { name: 'saveImgur', priority: 2 },
      { name: 'saveTab', priority: 1 },
    ];
    let selected = parseInt(ssMode, 10);
    if (selected < 0 || selected >= funcs.length || isNaN(selected)) {
      selected = 0;
    }

    // order by ascending priority and hoist selected method to the front
    // saveImgur should be excluded as a fallback
    const selectedMethod = funcs.splice(selected, 1)[0];
    funcs = funcs.filter(({ name }) => { return name !== 'saveImgur'; });
    funcs.sort((a, b) => { return a.priority - b.priority; });
    funcs.unshift(selectedMethod);

    return funcs.map(({ name }) => { return name; });
  };

  /* ----------------------[ EXPORT ]---------------------- */

  KC3ImageExport.bindMethodContext = function (context, funcs) {
    return funcs.map((name) => { return context[name].bind(context); });
  };

  KC3ImageExport.runExportFuncs = function (funcs) {
    const p = funcs.reduce((pacc, fn) => {
      // should only call a fn IFF all previous methods failed
      return pacc.then(null, fn)
        .catch((e) => {
          KC3ImageExport.logError(e);
          return Promise.reject();
        });
    }, Promise.reject());
    // let the caller know that all funcs failed
    return p.catch(() => { throw new Error('ImageExport: export failed'); });
  };

  /* ---------------------[ DOWNLOAD ]--------------------- */

  KC3ImageExport.composeDownloadPath = function (dir, filename, format) {
    return `${dir ? `${dir}/` : ''}${filename}.${format}`;
  };

  KC3ImageExport.download = function (path, urlSpec) {
    const { disableDownloadBar, writeFile, enableDownloadBar } = KC3ImageExport;
    return Promise.resolve()
      .then(disableDownloadBar)
      .then(writeFile.bind(null, path, urlSpec))
      .then(enableDownloadBar);
  };

  KC3ImageExport.writeFile = function (path, { url, cleanup }) {
    return new Promise((resolve) => {
      chrome.downloads.download({
        url,
        // since some chromium version (m72?), downloading the blob url will ignore filename?
        filename: path,
        conflictAction: 'uniquify',
      }, (downloadId) => {
        cleanup();
        resolve({ downloadId, filename: path });
      });
    });
  };

  let disableTimer = null;
  KC3ImageExport.disableDownloadBar = function () {
    if (disableTimer) {
      clearTimeout(disableTimer);
    }
    chrome.downloads.setShelfEnabled(false);
  };
  KC3ImageExport.enableDownloadBar = function (result) {
    disableTimer = setTimeout(() => {
      chrome.downloads.setShelfEnabled(true);
      disableTimer = null;
    }, 300);
    return result;
  };

  /* ----------------------[ IMGUR ]----------------------- */

  KC3ImageExport.checkCanUpload = function () {
    const { checkUploadTimeout, checkUploadQuota } = KC3ImageExport;
    return Promise.resolve()
      .then(checkUploadTimeout)
      .then(checkUploadQuota);
  };

  KC3ImageExport.lastUpload = 0;
  KC3ImageExport.checkUploadTimeout = function () {
    const now = Date.now();
    if (now - KC3ImageExport.lastUpload < 10 * 1000) {
      throw new Error('ImageExport: upload timeout not elapsed');
    }
    KC3ImageExport.lastUpload = now;
  };

  KC3ImageExport.checkUploadQuota = function () {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: 'https://api.imgur.com/3/credits',
        method: 'GET',
        headers: {
          Authorization: 'Client-ID 088cfe6034340b1',
          Accept: 'application/json',
        },
        success({ data: { UserRemaining, ClientRemaining } }) {
          if (!(UserRemaining > 10 && ClientRemaining > 100)) {
            reject(new Error('Insufficient quota.'));
          }
          resolve();
        },
        error(xhr, textStatus, errorThrown) {
          reject(new Error(`${textStatus}: ${errorThrown}`));
        },
      });
    });
  };

  KC3ImageExport.upload = function (blob) {
    const fd = new FormData();
    fd.append('image', blob);
    fd.append('type', 'file');

    return new Promise((resolve, reject) => {
      $.ajax({
        url: 'https://api.imgur.com/3/image',
        method: 'POST',
        headers: {
          Authorization: 'Client-ID 088cfe6034340b1',
          Accept: 'application/json',
        },
        processData: false,
        contentType: false,
        data: fd,
        success: resolve,
        error(xhr, textStatus, errorThrown) {
          reject(new Error(`${textStatus}: ${errorThrown}`));
        },
      });
    });
  };

  KC3ImageExport.saveLink = function ({ data: { link, deletehash } }) {
    KC3Database.Screenshot(link, deletehash);
    KC3ImageExport.openTab({ url: link });
    return link;
  };

  KC3ImageExport.deleteUpload = function (deletehash) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: 'https://api.imgur.com/3/image/' + deletehash,
        method: 'DELETE',
        headers: {
          Authorization: 'Client-ID 088cfe6034340b1',
          Accept: 'application/json',
        },
        success: resolve,
        error(xhr, textStatus, errorThrown) {
          reject(new Error(`${textStatus}: ${errorThrown}`));
        },
      });
    });
  };

  /* -----------------------[ TAB ]------------------------ */

  KC3ImageExport.openTab = function ({ url, cleanup = () => {} }) {
    const { createTab, registerCleanup } = KC3ImageExport;
    return createTab(url)
      .then(registerCleanup.bind(null, cleanup));
  };

  KC3ImageExport.createTab = function (url) {
    return new Promise((resolve) => {
      chrome.tabs.create({ url, active: false }, resolve);
    });
  };

  KC3ImageExport.registerCleanup = function (cleanup, { id: targetId }) {
    chrome.tabs.onRemoved.addListener((tabId) => {
      if (tabId !== targetId) { return; }
      cleanup();
    });
  };

  /*--------------------------------------------------------*/
  /* ------------------[ WRITE TO CANVAS ]----------------- */
  /*--------------------------------------------------------*/

  KC3ImageExport.writeToCanvas = function (dataUrl, canvasOpts, callback = () => {}) {
    const { loadDataUrl, drawImage } = KC3ImageExport;
    return loadDataUrl(dataUrl)
      .then(drawImage.bind(null, canvasOpts))
      .then((canvas) => { callback(null, canvas); })
      .catch(callback);
  };

  KC3ImageExport.loadDataUrl = function (dataUrl) {
    const image = new Image();
    return new Promise((resolve, reject) => {
      image.onerror = () => { reject(new Error('Failed to load dataURL')); };
      image.onload = () => { resolve(image); };
      image.src = dataUrl;
    });
  };

  KC3ImageExport.drawImage = function (canvasOpts, image) {
    const { createCanvas, drawOnCanvas } = KC3ImageExport;
    const canvas = createCanvas(canvasOpts);
    return drawOnCanvas(image, canvas);
  };

  KC3ImageExport.createCanvas = function ({ width, height }) {
    return Object.assign(document.createElement('canvas'), { width, height });
  };
  KC3ImageExport.drawOnCanvas = function (image, canvas) {
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width, image.height);
    return canvas;
  };

  /* --------------------[ POLYFILL ]---------------------- */

  // toBlob() polyfill for pre-50 chrome
  // from https://bugs.chromium.org/p/chromium/issues/detail?id=67587#c61
  if (typeof HTMLCanvasElement.prototype.toBlob !== 'function') {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value(callback, type, quality) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', this.toDataURL(type, quality));
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
          callback(new Blob([this.response], { type: type || 'image/png' }));
        };
        xhr.send();
      },
    });
  }

  window.KC3ImageExport = KC3ImageExport;
}());
