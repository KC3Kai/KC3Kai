KC3.prototype.Util = {
	
	findParam :function(list, label){
		var listIndex;
		for(listIndex in list){
			if(list[listIndex].name==label){
				return list[listIndex].value;
			}
		}
		return false;
	},
	
	getUTC :function(headers){
		var ydate = this.findParam(headers, "Date");
		// console.log("header param data: "+ydate);
		var xdate = new Date(ydate);
		var zdate = Math.floor(xdate.getTime()/1000);;
		// console.log("interpreted date: "+xdate);
		// console.log("timestamp: "+zdate);
		return zdate;
	}
	
};