/* DBSubmission.js
KC3Kai Kancolle-DB submission library

Must only be imported on devtools pages!
Listens to network history and triggers callback if game events happen
 */
(function(){
	"use strict";

	window.DBSubmission = {

			checkIfDataNeeded :function (URL){
				var KcsApiIndex = URL.indexOf("/kcsapi/");
				var api_name = URL.substring( KcsApiIndex+8 );
				return ($.inArray(api_name, [
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
				                             'api_req_combined_battle/sp_midnight'])
				                             >= 0);
			},

			dumpData: function (APIurl,requestBody,responseBody){
				console.log(encodeURIComponent(ConfigManager.DBSubmission_key));
				console.log(encodeURIComponent('K2r3QgrKmBeNeDpzNey8'));
				console.log(encodeURIComponent(APIurl));
				console.log(requestBody.text.replace(/&api(_|%5F)token=[0-9a-f]+|api(_|%5F)token=[0-9a-f]+&?/,''));
				console.log(encodeURIComponent(responseBody));
			},

			submitData: function (APIurl,requestBody,responseBody){
				//Use the default contentType: application/x-www-form-urlencoded; charset=UTF-8.
				var post = $.ajax({
					url: "http://api.kancolle-db.net/2/",
//					url: "http://httpbin.org/post",
					method: "POST",
					data: {
						'token' : encodeURIComponent(ConfigManager.DBSubmission_key),
						'agent' : encodeURIComponent('K2r3QgrKmBeNeDpzNey8'),
						'url' : APIurl,
						'requestbody' : requestBody.text.replace(/&api(_|%5F)token=[0-9a-f]+|api(_|%5F)token=[0-9a-f]+&?/,''),
						'responsebody' : responseBody
					},
				});

				post.done(function( msg ) {
					console.log('DB Submission done:');
					console.log(msg);
				});

				post.fail(function( jqXHR, textStatus ) {
					console.log('DB Submission failed: Status ' + textStatus);
					console.log(jqXHR);
				});
			}

	};

})();