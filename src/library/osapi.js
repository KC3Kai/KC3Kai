// Initialize global variables
var intervalChecker;

// Looks for API link
function checkAgain(){
	// If API link is found
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
		});
	}
}

intervalChecker = setInterval(checkAgain, 500);