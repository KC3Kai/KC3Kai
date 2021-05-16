(function(){
	"use strict";
	var list = [];
	var recording = false;
	
	$(document).on("ready", function(){
		$("#record").on("click", function(e) {
			recording = !recording;
			if (recording) {
				$(this).text("Recording!").addClass("recording");
			} else {
				$(this).text("Record").removeClass("recording");
			}
		});
		
		$("#export").on("click", function(e) {
			const profileData = [
				{
					group: "Recorded KCSAPI",
					calls: list
				}
			];
			const profileJSON = JSON.stringify(profileData, null, '\t');
			const blob = new Blob([profileJSON], {type: "application/json;charset=utf-8"});
			saveAs(blob, "recorded_kcsapi.json");
		});
		
		$("#clear").on("click", function(e) {
			list.length = 0;
			$("#apilist").html("");
			$(".apivalue textarea").text("");
		});
		
		$("#apilist").on("click", ".apiitem", function(e) {
			const selectedApi = list[$(this).data("index")];
			$("#contents textarea").text(selectedApi.response).select();
			$("#params textarea").text(JSON.stringify(selectedApi.params));
			$("#apilist div").removeClass("selected");
			$(this).addClass("selected");
		});
	});
	
	chrome.devtools.network.onRequestFinished.addListener(function(request){
		if (request.request.url.indexOf("/kcsapi/") > -1) {
			const kcsApiIndex = request.request.url.indexOf("/kcsapi/");
			const kcsApiResource = request.request.url.substring(kcsApiIndex + 8);
			const rscNameSplit = kcsApiResource.split("/");
			const rscShortName = rscNameSplit.pop();
			// Following responses are too large and not so valuable to be recorded & reported
			const ignoreLargeBody = [
				"api_start2/getData",
				"api_get_member/require_info",
				"api_port/port"
			].includes(kcsApiResource);
			const bodyReplacement = "Data is too large to be kept.\nView it in Network tab instead.";
			
			const reqObj = new KC3Request(request);
			if (reqObj.validateHeaders()) {
				request.getContent(function(responseBody) {
					if (recording) {
						const params = Object.assign({}, reqObj.params);
						censorParam(params, "api_token");
						censorParam(params, "api_verno");
						censorParam(params, "api_port");
						const response = ignoreLargeBody ? bodyReplacement : responseBody;
						
						const saveObj = {
							name: rscShortName,
							url: kcsApiResource,
							params: params,
							response: response
						};
						
						list.push(saveObj);
						$("#apilist").append($("<div>")
							.text(kcsApiResource)
							.addClass("apiitem")
							.data("index", list.length - 1)
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