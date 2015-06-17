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
		
		// Show initial message box and dashboard state
		app.Dashboard.state = "activating";
		app.Dashboard.messageBox("Attempting to activate the game...");
		
		// Send runtime message to hamescreen to activate
		(new RMsg("gamescreen", "activate_game",
			{ tabId: chrome.devtools.inspectedWindow.tabId },
			function(response){
				// Check if game page responded
				if(response.success){
					self.gameActivated = true;
					app.Dashboard.messageBox("Game active! Please wait while it loads...");
				}
			}
		)).execute();
	},
	
	/* Wait for 1 second if game has auto-activated
	-------------------------------------------------------*/
	waitActivation :function(){
		var self = this;
		setTimeout(function(){
			// If the flag was not set by the activation attempt
			if(!self.gameActivated){
				app.Dashboard.state = "waiting";
				app.Dashboard.messageBox("Waiting for game actions...");
			}
		}, 1000);
	}
};