/* DBSubmission.js
KC3Kai Kancolle-DB submission library

Must only be imported on devtools pages!
Listens to network history and triggers callback if game events happen
*/
(function(){
	"use strict";
	
	window.DBSubmission = {
			
		checkIfWanted :function (call){
			return $.inArray(call, [
			                        'api_port/port',
			                        'api_get_member/ship2',
			                        'api_get_member/ship3',
			                        'api_get_member/slot_item',
			                        'api_get_member/kdock',
			                        'api_get_member/mapinfo',
			                        'api_req_hensei/change',
			                        'api_req_kousyou/createship',
			                        'api_req_kousyou/getship',
			                        'api_req_kousyou/createitem',
			                        'api_req_map/start',
			                        'api_req_map/next',
			                        'api_req_map/select_eventmap_rank',
			                        'api_req_sortie/battle',
			                        'api_req_sortie/night_to_day',
			                        'api_req_sortie/battleresult',
			                        'api_req_sortie/airbattle',
			                        'api_req_battle_midnight/battle',
			                        'api_req_battle_midnight/sp_midnight',
			                        'api_req_combined_battle/battle',
			                        'api_req_combined_battle/battle_water',
			                        'api_req_combined_battle/airbattle',
			                        'api_req_combined_battle/midnight_battle',
			                        'api_req_combined_battle/battleresult',
			                        'api_req_combined_battle/sp_midnight']);
		},
		
		submitData: function (APIurl,params,response){
			var post = $.ajax({
			  url: "http://127.0.0.1/2/",
			  method: "POST",
			  data: {
			  	'token' : 'token',
			  	'agent' : 'K2r3QgrKmBeNeDpzNey8',
			  	'url' : APIurl,
			  	'requestbody' : params,
			  	'responsebody' : response
			  	},
			  //dataType: "html"
			});
		}
		
	};
	
})();