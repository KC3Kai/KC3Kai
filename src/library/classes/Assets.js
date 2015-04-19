KC3.prototype.Assets = {
	cdn: "http://i708.photobucket.com/albums/ww87/dragonjet25/KC3%20Ship%20Icons/",
	_ships :[],
	
	init :function(repo){
		var self = this;
		$.getJSON(repo+"icons.json", function(response){ self._ships = response; });
	},
	
	shipIcon :function(id, empty){
		if(typeof this._ships[id] !== "undefined"){
			return this.cdn + this._ships[id];
		}else{
			return empty;
		}
	}
	
};