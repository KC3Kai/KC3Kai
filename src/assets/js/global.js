Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString();
   var dd  = this.getDate().toString();
   return yyyy + "-" + (mm[1]?mm:"0"+mm[0]) + "-" + (dd[1]?dd:"0"+dd[0]);
};

Date.prototype.ddmmhh = function() {
   var mm = (this.getMonth()+1).toString();
   var dd  = this.getDate().toString();
   var hh  = this.getHours().toString();
   return (dd[1]?dd:"0"+dd[0])+"/"+(mm[1]?mm:"0"+mm[0])+"("+hh+"h)";
};