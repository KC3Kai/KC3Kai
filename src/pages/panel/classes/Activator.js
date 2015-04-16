/*
\KC3\pages\panel\classes\Activator.js
By: dragonjet <jetriconew@gmail.com>

Attempts to activate the extension game page on load.
If fails to activate, will just wait for API actions.
(Failure to activate means play outside of extension)
*/

KC3.prototype.Activator  = {
	gameActivated: false,
	
	/* Attempt to activate game	on inspected tab
	-------------------------------------------------------*/
	activateGame :function(){
		var self = this;
		
		app.Dashboard.state = "activating";
		app.Dashboard.showActionBox("activating");
		
		// Ask background page to activate game page on inspected tab
		chrome.runtime.sendMessage({
			game:"kancolle",
			type:"background",
			action:"activate_game",
			tabId: chrome.devtools.inspectedWindow.tabId
		}, function(response) {
			// Check if game page responded
			if(response.success){
				self.gameActivated = true;
				app.Dashboard.showActionBox("gameok");
			}
		});
	},
	
	/* Wait for 1 second if game has auto-activated
	-------------------------------------------------------*/
	waitActivation :function(){
		var self = this;
		setTimeout(function(){
			// If the flag was not set by the activation attempt
			if(!self.gameActivated){
				app.Dashboard.state = "dead";
				app.Dashboard.showActionBox("waiting");
			}
		}, 1000);
	}
};