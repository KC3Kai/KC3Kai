/* Poidbsubmission.js

  KC3Kai poi-statistics data submission library

 */
(function(){
    "use strict";
    
    window.KC3DBSubmission = {
    	sendMaster: function(data) {
            if (true) return;
    	    $.ajax({
        		url: "http://kc3.jetri.co/data/master/submit",
        		//url: "http://localhost:8000/data/master/submit",
        		method: "POST",
        		data: {'data': data},
                success: function(response){
                    console.log("KC3 Master submission", response);
                }
    	    });
    	    return;
    	},
        sendQuests: function(data) {
            if (true) return;
    	    $.ajax({
        		url: "http://kc3.jetri.co/data/quests/submit",
        		//url: "http://localhost:8000/data/quests/submit",
        		method: "POST",
        		data: {'data': data},
                success: function(response){
                    console.log("KC3 Quests submission", response);
                }
    	    });
    	    return;
    	}
    };
    
})();
