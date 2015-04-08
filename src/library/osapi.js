// looks for API link
function checkAgain(){
	// if API link is found
	if(document.getElementById("externalswf")){
		// send it to background script
		chrome.runtime.sendMessage({
			game:"kancolle",
			type:"background",
			action:"set_api_link",
			swfsrc: document.getElementById("externalswf").getAttribute("src")
		}, function(response) {
			// stop interval, and close this window
			clearInterval(intervalChecker);
			window.close();
		});
	}
}

// initialize global variable for interval
var intervalChecker = {};

// Check if we are tasked to extract API or not
chrome.runtime.sendMessage({
	game:"kancolle",
	type:"background",
	action:"get_option",
	field: "extract_api"
}, function(response) {
	// if yes, start interval to re-check API link
	if(response.value=="true"){
		intervalChecker = setInterval(checkAgain, 500);
	}
});