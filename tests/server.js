var http = require('http');

var server = http.createServer(function(request, response){
	var url = request.url.substr(1);
	var apiName = url.split("/");
	apiName.splice(0,1);
	apiName = apiName.join("/");
	
	var fs = require('fs');
	var rawResponse = fs.readFileSync('responses/'+apiName, 'utf8');
    response.end(rawResponse);
});

server.listen(31515, function(){
    console.log("KCSAPI Emulation started");
});