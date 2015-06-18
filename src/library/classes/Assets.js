KC3.prototype.Assets = {
	cdn: "http://i708.photobucket.com/albums/ww87/dragonjet25/KC3%20Ship%20Icons/",
	abyss: "http://i708.photobucket.com/albums/ww87/dragonjet25/KC3%20Abyss%20Icons/",
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
	},
	
	abyssIcon :function(id, empty){
		if(typeof this._ships[id] !== "undefined"){
			return this.abyss + this._ships[id];
		}else{
			return empty;
		}
	}
	
};