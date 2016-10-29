(function(){
	"use strict";
	var list = [];
	var reqObj = {};
	var saveObj = {};
	var recording = false;
	
	$(document).on("ready", function(){
		$("#record").on("click", function(){
			recording = !recording;
			
			if (recording) {
				$(this).text("Recording!").addClass("recording");
			} else {
				$(this).text("Record").removeClass("recording");
			}
		});
		
		$("#export").on("click", function(){
			var profileData = [
				{
					group: "Recorded KCSAPI",
					calls: list
				}
			];
			
			var profileJSON = JSON.stringify(profileData, null, '\t');
			
			var blob = new Blob([profileJSON], {type: "application/json;charset=utf-8"});
			saveAs(blob, "recorded_kcsapi.json");
		});
		
		$("#clear").on("click", function(){
			list = [];
			recording = false;
			$("#apilist").html("");
			$("#contents").html("");
		});
		
		$("#apilist").on("click", ".apiitem", function(){
			var selectedApi = list[$(this).data("index")];
			$("#contents").html(selectedApi.response);
		});
	});
	
	chrome.devtools.network.onRequestFinished.addListener(function(request){
		if(request.request.url.indexOf("/kcsapi/") > -1){
			var KcsApiIndex = request.request.url.indexOf("/kcsapi/");
			var KcsApiResource = request.request.url.substring( KcsApiIndex+8 );
			var RscNameSplit = KcsApiResource.split("/");
			var RscShortName = RscNameSplit.pop();
			
			reqObj = new KC3Request(request);
			if(reqObj.validateHeaders()){
				request.getContent(function( responseBody ){
					censorParam(reqObj.params, "api_token");
					censorParam(reqObj.params, "api_verno");
					censorParam(reqObj.params, "api_port");
					
					/*saveObj = {
						url: KcsApiResource,
						params: reqObj.params,
						headers: reqObj.headers,
						response: responseBody,
					};*/
					
					saveObj = {
						name: RscShortName,
						url: KcsApiResource,
						params: reqObj.params,
						response: responseBody
					};
					
					if (recording) {
						list.push(saveObj);
						
						$("#apilist").append($("<div>")
							.text(KcsApiResource)
							.addClass("apiitem")
							.data("index", list.length-1)
						);
					}
				});
			}
		}
	});
	
	function censorParam(dataObj, paramName){
		if (typeof dataObj[paramName] != "undefined") {
			delete dataObj[paramName];
		}
	}
	
})();