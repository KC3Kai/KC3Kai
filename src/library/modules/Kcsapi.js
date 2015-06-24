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
			MasterManager.processRaw(response);
			KC3Network.trigger("GameStart");
		},
		
		/* Home Port Screen
		-------------------------------------------------------*/
		"api_port/port":function(params, response, headers){	
			KC3Network.trigger("HomeScreen");
			
			
			
			KC3Network.trigger("HQ");
			KC3Network.trigger("Consumables");
			KC3Network.trigger("ShipSlots");
			KC3Network.trigger("GearSlots");
			KC3Network.trigger("Timers");
			KC3Network.trigger("Quests");
			KC3Network.trigger("Fleet");
		}
		
	};
	
})();