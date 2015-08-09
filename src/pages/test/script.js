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
	
	
});