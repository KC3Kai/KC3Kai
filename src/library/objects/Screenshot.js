var imgurLimit = 0;

function KCScreenshot(){
	this.scale = ((ConfigManager.api_gameScale || 100) / 100);
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
}

KCScreenshot.prototype.start = function(playerName, element){
	var self = this;
	this.playerName = playerName;
	this.gamebox = element;
	this.generateScreenshotFilename();
	
	// Initialize HTML5 Canvas
	this.canvas = document.createElement("canvas");
	this.canvas.width = 800 * this.scale;
	this.canvas.height = 480 * this.scale;
	this.context = this.canvas.getContext("2d");
	
	// Initialize Image Tag
	this.domImg = new Image();
	
	this.capture();
};

function chromeCapture(captureFormat, response){
	chrome.tabs.captureVisibleTab(null, {format: captureFormat}, response);
}

KCScreenshot.prototype.generateScreenshotFilename = function() {
  var d = new Date();
  curr_month = (d.getMonth()+1) + "";
  if (curr_month.length == 1) { curr_month = "0" + curr_month; }
  curr_date = d.getDate() + "";
  if (curr_date.length == 1) { curr_date = "0" + curr_date; }
  curr_hour = d.getHours() + "";
  if (curr_hour.length == 1) { curr_hour = "0" + curr_hour; }
  curr_min = d.getMinutes() + "";
  if (curr_min.length == 1) { curr_min = "0" + curr_min; }
  curr_second = d.getSeconds() + "";
  if (curr_second.length == 1) { curr_second = "0" + curr_second; }

  this.screenshotFilename = "["+this.playerName+"] "+d.getFullYear()+"-"+curr_month+"-"+curr_date+" "+curr_hour+"-"+curr_min+"-"+curr_second + " " + getRandomInt(10,99);
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

KCScreenshot.prototype.capture = function(){
	var self = this;
	
	// Start capturing
	chromeCapture(this.format[0], function(base64img){
		self.domImg.src = base64img;
		self.domImg.onload = self.crop();
	});
};

KCScreenshot.prototype.crop = function(){
	var self = this;
	
	// Get zoom factor
	chrome.tabs.getZoom(null, function(zoomFactor){
		// Get gamebox dimensions and position
		var params = {
			realWidth: 800 * zoomFactor * self.scale,
			realHeight: 480 * zoomFactor * self.scale,
			offTop: self.gamebox.offset().top * zoomFactor * self.scale,
			offLeft: self.gamebox.offset().left * zoomFactor * self.scale,
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
		
		// Convert image to base64
		self.base64img = self.canvas.toDataURL(self.format[2]);
		
		// Call output function on what to do with the base64 image
		self.output();
	});
};

KCScreenshot.prototype.output = function(){
	switch(parseInt(ConfigManager.ss_mode, 10)){
		case 0: this.saveDownload(); break;
		case 1: this.saveImgur(); break;
		default: this.saveTab(); break;
	}
};

KCScreenshot.prototype.saveDownload = function(){
	chrome.downloads.setShelfEnabled(false);
	chrome.downloads.download({
		url: this.base64img,
		filename: 'KanColle/'+this.screenshotFilename+"."+this.format[1],
		conflictAction: "uniquify"
	}, function(downloadId){
		setTimeout(function(){
			chrome.downloads.setShelfEnabled(true);
		}, 1000);
	});
	
};

KCScreenshot.prototype.saveImgur = function(){
	var stampNow = Math.floor((new Date()).getTime()/1000);
	if(stampNow - imgurLimit > 10){
		imgurLimit = stampNow;
	}else{
		this.saveDownload();
		return false;
	}
	
	var self = this;
	$.ajax({
		url: 'https://api.imgur.com/3/credits',
		method: 'GET',
		headers: {
			Authorization: 'Client-ID 088cfe6034340b1',
			Accept: 'application/json'
		},
		success: function(response){
			if(response.data.UserRemaining>10 && response.data.ClientRemaining>100){
				$.ajax({
					url: 'https://api.imgur.com/3/image',
					method: 'POST',
					headers: {
						Authorization: 'Client-ID 088cfe6034340b1',
						Accept: 'application/json'
					},
					data: {
						image: self.base64img.substring(23),
						type: 'base64'
					},
					success: function(response){
						KC3Database.Screenshot(response.data.link, self.playerIndex);
					}
				});
			}else{
				self.saveDownload();
			}
		}
	});
};

KCScreenshot.prototype.saveTab = function(){
	window.open(this.base64img, "_blank");
};