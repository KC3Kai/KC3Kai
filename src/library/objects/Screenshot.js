var imgurLimit = 0;
var enableShelfTimer = false;

function KCScreenshot(){
	ConfigManager.load();
	this.autoDpi = !ConfigManager.ss_dppx;
	this.gamebox = {};
	this.canvas = {};
	this.context = {};
	this.domImg = {};
	this.base64img = "";
	this.screenshotFilename = "";
	this.format = (ConfigManager.ss_type == "JPG")
		? ["jpeg", "jpg", "image/jpeg"]
		: ["png",  "png", "image/png"];
	this.quality = ConfigManager.ss_quality;
	this.imageSmoothing = !!ConfigManager.ss_smooth;
	this.callback = function(){};
}

KCScreenshot.prototype.setCallback = function(callback){
	this.callback = callback;
	return this;
};

KCScreenshot.prototype.getCurrentScale = function(gameWindowDpr){
	return ((ConfigManager.api_gameScale || 100) / 100)
		* (ConfigManager.ss_dppx || gameWindowDpr || window.devicePixelRatio || 1);
};

/** Try to get original game canvas data first, fallback to old capture if failed */
KCScreenshot.prototype.tryOriginalCanvas = function(fallbackMethod){
	var self = this;
	if (!this.tabId) {
		if (fallbackMethod) fallbackMethod();
		return;
	}
	(new TMsg(this.tabId, "gamescreen", "getGameCanvasData", {}, function(response){
		if (response && response.base64img) {
			response.isOriginalCanvas = true;
			self.prepare(response);
			self.base64img = response.base64img;
			self.domImg.onload = () => {
				self.context.drawImage(self.domImg, 0, 0, self.canvas.width, self.canvas.height);
				self.output();
			};
			self.domImg.src = self.base64img;
		} else {
			if (fallbackMethod) fallbackMethod();
		}
	})).execute();
};

/** Running in page/content script scope */
KCScreenshot.prototype.start = function(tabId, playerName, element){
	var self = this;
	this.tabId = tabId;
	this.playerName = playerName;
	this.gamebox = element;
	this.generateScreenshotFilename();
	if (ConfigManager.ss_origin) {
		this.tryOriginalCanvas(function() {
			self.prepare();
			self.capture();
		});
	} else {
		this.prepare();
		this.capture();
	}
};

/** Running in background script scope */
KCScreenshot.prototype.remoteStart = function(tabId, offset){
	var self = this;
	this.tabId = tabId;
	this.offset = offset;
	this.generateScreenshotFilename(false);
	if (ConfigManager.ss_origin) {
		this.tryOriginalCanvas(function() {
			self.prepare(offset);
			self.remoteCapture();
		});
	} else {
		this.prepare(offset);
		this.remoteCapture();
	}
};

KCScreenshot.prototype.prepare = function(offset = {}){
	var scale = this.getCurrentScale(offset.devicePixelRatio);

	// Initialize HTML5 Canvas
	this.canvas = document.createElement("canvas");
	this.canvas.width = (offset.width || 1200) * (offset.isOriginalCanvas ? 1 : scale);
	this.canvas.height = (offset.height || 720) * (offset.isOriginalCanvas ? 1 : scale);
	this.context = this.canvas.getContext("2d");
	this.context.imageSmoothingEnabled = this.imageSmoothing;

	// Initialize Image Tag
	this.domImg = new Image();
};

function chromeCapture(captureFormat, imageQuality, response){
	console.log("Taking screenshot with quality", imageQuality);
	chrome.tabs.captureVisibleTab(null, {
		format: captureFormat,
		quality: imageQuality || 100
	}, response);
}

KCScreenshot.prototype.generateScreenshotFilename = function(withPlayerName) {
	withPlayerName = typeof withPlayerName == 'undefined' ? true : withPlayerName;

	var d = new Date();
	var curr_month = (d.getMonth()+1) + "";
	if (curr_month.length == 1) { curr_month = "0" + curr_month; }
	var curr_date = d.getDate() + "";
	if (curr_date.length == 1) { curr_date = "0" + curr_date; }
	var curr_hour = d.getHours() + "";
	if (curr_hour.length == 1) { curr_hour = "0" + curr_hour; }
	var curr_min = d.getMinutes() + "";
	if (curr_min.length == 1) { curr_min = "0" + curr_min; }
	var curr_second = d.getSeconds() + "";
	if (curr_second.length == 1) { curr_second = "0" + curr_second; }

	if (withPlayerName) {
		this.screenshotFilename = "["+this.playerName+"] "+d.getFullYear()+"-"+curr_month+"-"+curr_date+" "+curr_hour+"-"+curr_min+"-"+curr_second + " " + getRandomInt(10,99);
	} else {
		this.screenshotFilename = d.getFullYear()+"-"+curr_month+"-"+curr_date+" "+curr_hour+"-"+curr_min+"-"+curr_second + " " + getRandomInt(10,99);
	}
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

KCScreenshot.prototype.capture = function(){
	var self = this;
	// If taiha alert appear on screenshot is off, hide taiha alert in the mean time
	if(!ConfigManager.alert_taiha_ss && typeof interactions != "undefined") {
		interactions.suspendTaiha(function(){
			self.startCapture();
		});
	} else {
		this.startCapture();
	}
};

KCScreenshot.prototype.remoteCapture = function(){
	var self = this;
	chrome.tabs.get(this.tabId, function(tabInfo){
		chrome.tabs.captureVisibleTab(tabInfo.windowId, {
			format: self.format[0],
			quality: self.quality || 100
		}, function(base64img){
			self.handleLastError(chrome.runtime.lastError, "Remote captureVisibleTab", "take screenshot");
			self.domImg.onload = self.crop(self.offset, true);
			self.domImg.src = base64img;
			self.base64img = base64img;
		});
	});
};

KCScreenshot.prototype.startCapture = function(){
	var self = this;
	chromeCapture(this.format[0], this.quality, function(base64img){
		self.handleLastError(chrome.runtime.lastError, "Inpage captureVisibleTab", "take screenshot");
		self.domImg.src = base64img;
		self.base64img = base64img;
		self.domImg.onload = self.crop(self.gamebox.offset(), false);
	});
};

KCScreenshot.prototype.handleLastError = function(lastError, apiDesc, funcName){
	if(lastError) {
		var errMsg = lastError.message || "unknown reason";
		console.warn((apiDesc || "Chrome API") + " invoking error", errMsg);
		// Invoke cleanup callback first even exception thrown
		this.callback(errMsg);
		throw new Error("Failed to " + (funcName || "operate") + " due to: " + errMsg);
	}
};

KCScreenshot.prototype.crop = function(offset, isRemote){
	var self = this;
	var gameWindowDpr = offset.devicePixelRatio || window.devicePixelRatio || 1;
	var scale = this.getCurrentScale(offset.devicePixelRatio);

	// Get zoom factor of viewing page
	chrome.tabs.getZoom(this.tabId, function(zoomFactor){
		// Viewing page zoom factor has been taken into account by window.devicePixelRatio (since chromium 25)
		var mixedScale = self.autoDpi ? scale : zoomFactor * scale;
		var pageZoomScale = self.autoDpi ? gameWindowDpr : zoomFactor;
		// Chromium 128 has changed css zoom, scaled length calcs applied already,
		// `Promise.try` supposed to be shipped together with standardized zoom.
		// but seems 128~129 different DPR calcs make offset left off?
		var isGameScaleApplied = !!Promise.try;
		// Get gamebox dimensions and position from offset, but in fact,
		// values of width & height not offered, otherwise standardized zoom should be applied
		var params = {
			realWidth: (offset.width || 1200) * mixedScale,
			realHeight: (offset.height || 720) * mixedScale,
			offTop: offset.top * (isGameScaleApplied ? pageZoomScale : mixedScale),
			offLeft: offset.left * (isGameScaleApplied ? pageZoomScale : mixedScale),
		};

		// Actual Cropping
		self.context.drawImage(
			self.domImg,
			params.offLeft,
			params.offTop,
			params.realWidth,
			params.realHeight,
			0,
			0,
			(offset.width || 1200) * scale,
			(offset.height || 720) * scale
		);

		self.output();
	});
};

KCScreenshot.prototype.output = function () {
	new KC3ImageExport(this.canvas, {
		filename: this.screenshotFilename,
		quality: this.quality,
	}).export(this.callback.bind(this));
};
