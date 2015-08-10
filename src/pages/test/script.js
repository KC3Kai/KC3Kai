$(document).on("ready", function(){
	
	function CallAPI(name, data, callback){
		$.ajax({
			type: 'POST',
			url: "http://localhost:31515/kcsapi/"+name,
			data: $.extend(data, {
				api_token: 'xxxxxx',
				api_verno: '1'
			}),
			success: callback
		});
	}
	
	$("#startGame").on("click", function(){
		CallAPI("api_start2", {}, function(){
			CallAPI("api_req_member/get_incentive", {}, function(){
				CallAPI("api_get_member/basic", {}, function(){
					CallAPI("api_get_member/furniture", {}, function(){
						CallAPI("api_get_member/slot_item", {}, function(){
							CallAPI("api_get_member/useitem", {}, function(){
								CallAPI("api_get_member/kdock", {}, function(){
									CallAPI("api_get_member/unsetslot", {}, function(){
										CallAPI("api_port/port", {}, function(){
											
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
	
	$("#homeScreen").on("click", function(){
		CallAPI("api_port/port", {}, function(){});
	});
	
	$("#doneExped").on("click", function(){
		CallAPI("api_req_mission/result", {}, function(){
			CallAPI("api_port/port", {}, function(){
				CallAPI("api_get_member/useitem", {}, function(){
					
				});
			});
		});
	});
	
	$("#questList").on("click", function(){
		CallAPI("api_get_member/questlist", {}, function(){});
	});
	
	$("#mapInfo").on("click", function(){
		CallAPI("api_get_member/mapinfo", {}, function(){});
	});
	
	$("#sortieStart").on("click", function(){
		CallAPI("api_get_member/mapcell", {}, function(){
			CallAPI("api_req_map/start", {}, function(){
				
			});
		});
	});
	
	$("#sortieBattle").on("click", function(){
		CallAPI("api_req_sortie/battle", {}, function(){});
	});
	
	$("#sortieResult").on("click", function(){
		CallAPI("api_req_sortie/battleresult", {}, function(){});
	});
	
	$("#sortieEnd").on("click", function(){
		CallAPI("api_get_member/slot_item", {}, function(){
			CallAPI("api_get_member/unsetslot", {}, function(){
				CallAPI("api_get_member/useitem", {}, function(){
					CallAPI("api_port/port", {}, function(){
						
					});
				});
			});
		});
	});
	
});