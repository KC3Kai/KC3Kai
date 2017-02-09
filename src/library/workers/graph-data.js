onmessage = function(request) {
	console.log('filters', request.data);
	request.data.modified = 1;
	postMessage(request.data);
};