var request = window.indexedDB.open("KC3Kai", 1);
request.onerror = function(event) {
	console.log("ERROR:");
	console.log(event);
};
request.onsuccess = function(event) {
	console.log("SUCCESS:");
};
request.onupgradeneeded = function(event) { 
	var db = event.target.result;
	var objectStore = db.createObjectStore("name", { keyPath: "myKey" });
};

$(document).ready(function(){
	
});