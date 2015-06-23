/* Kcsapi.js
KanColle Server API

Executes actions based on in-game actions read from the network.
This script is called by Network.js
Previously known as "Reactor"
*/
(function(){
	"use strict";
	
	window.Kcsapi = {
		
		/* Master Data
		-------------------------------------------------------*/
		"api_start2":function(params, response, headers){
			
		},
		
		/* Home Port Screen
		-------------------------------------------------------*/
		"api_port/port":function(params, response, headers){	
			KC3Panel.activateDashboard();
			
			KC3Network.trigger({name: "hq"});
			KC3Network.trigger({name: "counts"});
			KC3Network.trigger({name: "timers"});
			KC3Network.trigger({name: "fleet"});
		}
		
	};
	
})();