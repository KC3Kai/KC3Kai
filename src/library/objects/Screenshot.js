var imgurLimit = 0;
var enableShelfTimer = false;

function KCScreenshot(){
	ConfigManager.load();
	this.scale = ((ConfigManager.api_gameScale || 100) / 100) * (ConfigManager.ss_dppx || 1);
	this.gamebox = {};
	this.canvas = {};
	this.context = {};
	this.domImg = {};
	this.base64img = "";
	this.playerIndex = "";
	this.screenshotFilename = "";
	this.format = (ConfigManager.ss_type=="JPG")
		?["jpeg", "jpg", "image/jpeg"]
		:["png", "png", "image/png"];
	this.quality = ConfigManager.ss_quality;
	this.callback = function(){};
}

KCScreenshot.prototype.setCallback = function(callback){
	this.callback = callback;
	return this;
};

KCScreenshot.prototype.start = function(playerName, element){
	this.playerName = playerName;
	this.gamebox = element;
	this.generateScreenshotFilename();
	this.prepare();
	this.capture();
};

KCScreenshot.prototype.remoteStart = function(tabId, offset){
	this.tabId = tabId;
	this.offset = offset;
	this.generateScreenshotFilename(false);
	this.prepare();
	this.remoteCapture();
};

KCScreenshot.prototype.prepare = function(){
	// Initialize HTML5 Canvas
	this.canvas = document.createElement("canvas");
	this.canvas.width = 800 * this.scale;
	this.canvas.height = 480 * this.scale;
	this.context = this.canvas.getContext("2d");
	
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
	if(!ConfigManager.alert_taiha_ss && interactions) {
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
			self.domImg.onload = self.crop(self.offset);
			self.domImg.src = base64img;
		});
	});
};

KCScreenshot.prototype.startCapture = function(){
	var self = this;
	chromeCapture(this.format[0], this.quality, function(base64img){
		self.domImg.src = base64img;
		self.domImg.onload = self.crop(self.gamebox.offset());
	});
};

KCScreenshot.prototype.crop = function(offset){
	var self = this;
	
	// Get zoom factor
	chrome.tabs.getZoom(null, function(zoomFactor){
		// Get gamebox dimensions and position
		var params = {
			realWidth: 800 * zoomFactor * self.scale,
			realHeight: 480 * zoomFactor * self.scale,
			offTop: offset.top * zoomFactor * self.scale,
			offLeft: offset.left * zoomFactor * self.scale,
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
			800 * self.scale,
			480 * self.scale
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
