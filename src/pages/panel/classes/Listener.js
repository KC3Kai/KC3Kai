KC3.prototype.Listener  = {
	
	/* Start listening to Chrome Network Logs
	-------------------------------------------------------*/
	init: function(){
		var self = this;
		chrome.devtools.network.onRequestFinished.addListener(function(request){
			// if(app.Dashboard.state == "reload_panel"){ return false; }
			self.onReceived(request);
		});
	},
	
	
	/* New Network Log Received
	-------------------------------------------------------*/
	onReceived: function(request){
		var indexOfkcs1, indexOfkcs2;
		
		// If request is an API Call
		indexOfkcs1 = request.request.url.indexOf("/kcsapi/");
		if(indexOfkcs1 > -1){
			this.handleApiCall(
				request.request.url.substring(indexOfkcs1+8), // API function name
				request // full request-response details
			);
			return true;
		}
		
		// If request is a Game Asset
		indexOfkcs1 = request.request.url.indexOf("/kcs/");
		indexOfkcs2 = request.request.url.indexOf(".swf");
		if(indexOfkcs1 > -1 && indexOfkcs2 > -1){
			this.handleAssets(request);
			return true;
		}
	},
	
	
	/* Handle API CALLS that contain data
	-------------------------------------------------------*/
	handleApiCall :function(APIFunction, request){
		var self = this;
		
		// Clear quest overlays regardless
		chrome.runtime.sendMessage({
			game:"kancolle",
			type:"game",
			action:"clear_overlays"
		}, function(response){});
		
		// Chcek if statusCode is not 200, means not successful
		// API always returns 200 even if "game error". Not 200 means something is wrong in between.
		if(request.response.status != 200){
			app.Dashboard.catBomb("Server Communication Error", "One of the API calls ("+APIFunction+") failed to communicate with the server. It is not a matter of API link, but somewhat on your connectivity or environment.");
			return false;
		}
		
		// Save last called URL for later use in determining server IP
		app.Server.lastUrl = request.request.url;
		
		// Check for Quest Reset
		app.Quests.checkReset(app.Util.getUTC(request.response.headers));
		
		// Get and Handle the Response Body
		request.getContent(function(requestContent){
			// Strip svdata= from response body if exists then parse JSON
			if(requestContent.indexOf("svdata=")>-1){ requestContent = requestContent.substring(7); }
			responseObject = JSON.parse(requestContent);
			
			// Check for "game errors" within a successful 200 API Call
			if(!self.checkForGameErrors(
				APIFunction,
				responseObject,
				request.response.headers
			)){ return false; }
			
			// Check if API Function is supported
			if(typeof app.Reactor[APIFunction] == "undefined"){ return false; }
			
			// Execute function
			app.Reactor[APIFunction](
				request.request.postData.params,
				responseObject,
				request.response.headers
			);
		});
		
		return true;
	},
	
	checkForGameErrors: function(api_call, response, headers){
		// If api_result is not 1. Game API returns 1 if complete success
		if(response.api_result != 1){
			
			// If it fails on "api_start2" which is the first API call
			if(api_call == "api_start2"){
				app.Dashboard.catBomb("API Error", "Loading master data failed. Your API link is not working. Get a new API Link from the KC3 Kai menu.");
				return false;
			}
			
			// If it fails on "api_port" which is usually caused by system clock
			if(api_call == "api_port/port"){
				// Check if user's clock is correct
				var ComputerClock = new Date().getTime();
				var ServerClock = new Date(app.Util.findParam(headers, "Date")).getTime();
				
				// If clock difference is greater than 5 minutes
				var timeDiff = Math.abs(ComputerClock - ServerClock);
				if(timeDiff > 300000){
					app.Dashboard.catBomb("Wrong Computer Clock!", "Please correct your computer clock. You do not need to be on Japan timezone, but it needs to be the correct local time for your local timezone! Your clock is off by "+Math.ceil(timeDiff/60000)+" minutes.");
					
				// Something else other than clock is wrong
				}else{
					app.Dashboard.catBomb("Error when entering Home Port screen", "Please reload the game.");
				}
				return false;
			}
			
			// Some other API Call failed
			app.Dashboard.catBomb("API Data Error", "The most recent action completed the network communication with server but returned an error. Check if it's now maintenance, or if your API link is still working.");
			
			return false;
		}
		return true;
	},
	
	
	/* Handle GAME ASSETS such as swfs
	-------------------------------------------------------*/
	handleAssets :function(request){
		
		// Chcek if statusCode=206, means PartialContent
		if(request.response.status == 206){
			app.Dashboard.catBomb("Stuck loading a Game Asset!", "Your internet has stopped loading one of the game assets. Refresh. If it still doesn't work, you have an internet connection problem.");
			return false;
		}
		
		// Chcek if statusCode is neither 200 nor 304, means not successful
		if(request.response.status != 200 && request.response.status != 304){
			app.Dashboard.catBomb("Unable to retrieve a Game Asset!", "Your internet failed to load one of the game assets. Refresh. If it still doesn't work, you have an internet connection problem.");
			return false;
		}
		
		return true;
	}
	
};