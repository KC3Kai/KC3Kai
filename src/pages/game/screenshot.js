var imgurLimit = 0;

function KCScreenshot(){
	this.gamebox = {};
	this.canvas = {};
	this.context = {};
	this.domImg = {};
	this.base64img = "";
	this.playerIndex = "";
};

KCScreenshot.prototype.start = function(playerIndex, element){
	var self = this;
	this.playerIndex = playerIndex;
	this.gamebox = element;
	
	// Initialize HTML5 Canvas
	this.canvas = document.createElement("canvas");
	this.canvas.width = 800;
	this.canvas.height = 480;
	this.context = this.canvas.getContext("2d");
	
	// Initialize Image Tag
	this.domImg = new Image();
	
	this.capture();
};

function chromeCapture(response){
	chrome.tabs.captureVisibleTab(null, {format:"jpeg"}, response);
}

KCScreenshot.prototype.capture = function(){
	var self = this;
	
	// Start capturing
	chromeCapture(function(base64img){
		self.domImg.src = base64img;
		self.domImg.onload = self.crop();
	})
};

KCScreenshot.prototype.crop = function(){
	var self = this;
	
	// Get zoom factor
	chrome.tabs.getZoom(null, function(zoomFactor){
		// Get gamebox dimensions and position
		var params = {
			realWidth: 800 * zoomFactor,
			realHeight: 480 * zoomFactor,
			offTop: self.gamebox.offset().top * zoomFactor,
			offLeft: self.gamebox.offset().left * zoomFactor,
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
			800,
			480
		);
		
		// Convert image to base64
		self.base64img = self.canvas.toDataURL("image/jpeg");
		
		// Call output function on what to do with the base64 image
		self.output();
	});
};

KCScreenshot.prototype.output = function(){
	switch(parseInt(app.Config.ss_mode, 10)){
		case 0: this.saveDownload(); break;
		case 1: this.saveImgur(); break;
		default: this.saveTab(); break;
	}
};

KCScreenshot.prototype.saveDownload = function(){
	chrome.downloads.setShelfEnabled(false);
	chrome.downloads.download({
		url: this.base64img,
		filename: 'kancolle/'+Math.floor((new Date()).getTime()/1000)+"_"+Math.floor(Math.random()*100)+".jpg",
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
						app.Logging.Screenshot(response.data.link, self.playerIndex);
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