(function(){
	"use strict";
	
	window.KC3LandBase = function(data){
		this.map = -1;
		this.rid = -1;
		this.name = "";
		this.range = -1;
		this.action = -1;
		this.planes = [];
		
		// If specified with data, fill this object
		if(typeof data != "undefined"){
			this.map = data.api_area_id;
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
	
	KC3LandBase.prototype.defineFormatted = function(data){
		if (typeof data != "undefined") {
			this.map = data.map;
			this.rid = data.rid;
			this.name = data.name;
			this.range = data.range;
			this.action = data.action;
			this.planes = data.planes;
		}
		return this;
	};
	
})();