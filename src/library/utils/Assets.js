KC3.prototype.Assets = {
	cdn: "http://i708.photobucket.com/albums/ww87/dragonjet25/KC3%20Ship%20Icons/",
	_imageList :[],
	
	init :function(){
		var self = this;
		$.getJSON(repo+"icons.json", function(response){ self._imageList = response; });
	},
	
	shipIcon :function(id){
		if(this._imageList,length > 0){
			
		}else{
			return '../../images/ui/empty.png';
		}
		return this.cdn+""
	}
	
};