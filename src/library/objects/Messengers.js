/* Messengers.js
KC3改 Messengers

Handles a message passed between KC3改 extension components.
https://developer.chrome.com/extensions/messaging
Instantiate to sends a single messages from current module to another.
Listening and receiving messages should be handled by the other module.

Sample Usage:

(new RMsg("gamescreen", "activate_game")).execute();

(new RMsg("service", "set_api_link", { swfsrc:"1234" }, function(response){
	console.log(response);
})).execute();

(new TMsg(123, "gamescreen", "activate_game")).execute();

(new TMsg(123, "gamescreen", "activate_game", { redirect: false }, function(response){
	console.log(response);
})).execute();

*/
(function(){
	"use strict";
	
	console.info("KC3改 Messengers loaded");
	
	/* RUNTIME MESSAGE
	Send message to all components, which will only execute on "target"
	------------------------------------------*/
	window.RMsg = function(target, action, params, callback){
		// Compile params with required fields and sender's own data
		this.params = $.extend({
			identifier: "kc3_"+target,
			action: action
		}, params);
		
		// Save callback for later
		this.callback = (callback || function(){});
		
		return true; // for async callbacks
	};
	
	RMsg.prototype.execute = function(){
		// Execute required Chrome APIs
		chrome.runtime.sendMessage(this.params, this.callback);
		return true; // for async callbacks
	};
	
	/* TAB MESSAGE
	Send message to a specific Chrome tab
	------------------------------------------*/
	window.TMsg = function(tabId, target, action, params, callback){
		// Remember tabId to send it to
		this.tabId = tabId;
		
		// Compile params with required fields and sender's own data
		this.params = $.extend({
			identifier: "kc3_"+target,
			action: action
		}, params);
		
		// Save callback for later
		this.callback = (callback || function(){});
		
		return true; // for async callbacks
	};
	
	TMsg.prototype.execute = function(){
		// Execute required Chrome APIs
		chrome.tabs.sendMessage(this.tabId, this.params, this.callback);
		return true; // for async callbacks
	};
	
})();