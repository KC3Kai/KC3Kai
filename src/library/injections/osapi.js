/* osapi.js overrides
*/
(function(){
	"use strict";
	
	// Check if we are on KC3改 frame to override DMM style to crop game screen
	(new RMsg("service", "willInjectOSAPI", {}, function(response){
		// if yes, apply CSS overrides
		if (response.value) {
			$("#spacing_top").hide();
		}
	})).execute();

	
})();