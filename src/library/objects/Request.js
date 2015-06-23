/* Request.js
KC3改 API Requests

Instantiatable class to represent a single API call
Executes processing and relies on KC3Network for the triggers
*/
(function(){
	"use strict";
	
	window.KC3Request = function( data ){
		this.url = data.request.url;
		this.headers = data.response.headers;
		this.statusCode = data.response.status;
		this.params = data.request.postData.params;
		
		var KcsApiIndex = this.url.indexOf("/kcsapi/");
		this.call = this.url.substring( KcsApiIndex+8 );
		
		this.gameStatus = 0;
		this.response = {};
	};
	
	
	/* VALIDATE HEADERS
	
	------------------------------------------*/
	KC3Request.prototype.validateHeaders = function(){
		// If response header statusCode is not 200, means non-in-game error
		if(this.statusCode != 200){
			KC3Network.trigger({
				name: "catbomb",
				title: "Server Communication Error",
				desc: "["+this.call+"] failed to communicate with the server. It is not a matter of API link, but somewhat on your connectivity or environment"
			});
			return false;
		}
		
		// Reformat headers
		var reformatted = {};
		$.each(this.headers, function(index, element){
			reformatted[ element.name ] = element.value;
		});
		this.headers = reformatted;
		
		reformatted = {};
		$.each(this.params, function(index, element){
			reformatted[ decodeURI(element.name) ] = element.value;
		});
		this.params = reformatted;
		
		return true;
	};
	
	/* READ RESPONSE
	
	------------------------------------------*/
	KC3Request.prototype.readResponse = function( request, callback ){
		var self = this;
		// Get response body
		request.getContent(function( responseBody ){
			// Strip svdata= from response body if exists then parse JSON
			if(responseBody.indexOf("svdata=") >- 1){ responseBody = responseBody.substring(7); }
			responseBody = JSON.parse(responseBody);
			
			self.gameStatus = responseBody.api_result;
			self.response = responseBody.api_data;
			
			callback();
		});
	};
	
	/* VALIDATE DATA
	
	------------------------------------------*/
	KC3Request.prototype.validateData = function(){
		// If gameStatus is not 1. Game API returns 1 if complete success
		if(this.gameStatus != 1){
			
			// If it fails on "api_start2" which is the first API call
			if(this.call == "api_start2"){
				KC3Network.trigger({
					name: "catbomb",
					title: "Full API Error",
					desc: "Your API link is not working. Either get a new API Link from the menu, or check if it's maintenance!"
				});
				return false;
			}
			
			// If it fails on "api_port" which is usually caused by system clock
			if(this.call == "api_port/port"){
				// Check if user's clock is correct
				var ComputerClock = new Date().getTime();
				var ServerClock = new Date( app.Util.findParam(this.headers, "Date") ).getTime();
				
				// If clock difference is greater than 5 minutes
				var timeDiff = Math.abs(ComputerClock - ServerClock);
				if(timeDiff > 300000){
					KC3Network.trigger({
						name: "catbomb",
						title: "Wrong Computer Clock!",
						desc: "Please correct your computer clock. You do not need to be on Japan timezone, but it needs to be the correct local time for your local timezone! Your clock is off by "+Math.ceil(timeDiff/60000)+" minutes."
					});
					
				// Something else other than clock is wrong
				}else{
					KC3Network.trigger({
						name: "catbomb",
						title: "Error when entering Home Port screen",
						desc: "Please reload the game."
					});
				}
				return false;
			}
			
			// Some other API Call failed
			KC3Network.trigger({
				name: "catbomb",
				title: "API Data Error",
				desc: "The most recent action completed the network communication with server but returned an error. Check if it's now maintenance, or if your API link is still working."
			});
			
			return false;
		}
		return true;
	};
	
	/* PROCESS
	
	------------------------------------------*/
	KC3Request.prototype.process = function(){
		// If API call is supported
		if(typeof Kcsapi[this.call] != "undefined"){
			// Execute by passing data
			Kcsapi[this.call]( this.params, this.response, this.headers );
		}
	};
	
})();