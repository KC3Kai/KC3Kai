(function(){
	"use strict";
	
	window.KC3LandBase = function(data){
		this.rid = -1;
		this.name = "";
		this.range = -1;
		this.action = -1;
		this.planes = [];
		
		// If specified with data, fill this object
		if(typeof data != "undefined"){
			this.rid = data.api_rid;
			this.name = data.api_name;
			this.range = data.api_distance;
			this.action = data.api_action_kind;
			
			var self = this;
			data.api_plane_info.forEach(function(plane, index){
				self.planes.push(plane);
			});
		}
	};
	
})();