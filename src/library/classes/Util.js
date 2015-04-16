KC3.prototype.Util = {
	
	findParam :function(list, label){
		var listIndex;
		for(listIndex in list){
			if(list[listIndex].name==label){
				return list[listIndex].value;
			}
		}
		return false;
	}
	
};