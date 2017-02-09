let window = self;
onmessage = function(request) {
	importScripts(request.data.url+"assets/js/Dexie.min.js");
	importScripts(request.data.url+"library/modules/Database.js");
	KC3Database.init( request.data.playerId );
	fetchData(request.data);
};

function fetchData(options){
	let startHour = Math.floor((new Date(options.start))/( 1*60*60*1000));
	let endHour = Math.floor((new Date(options.end))/( 1*60*60*1000))+24;
	KC3Database.con[options.tableName]
		.where("hour").between(startHour, endHour, true, true)
		.toArray(function(result){
			formatData(startHour, endHour, options, result);
		});
}

function formatData(startHour, endHour, options, result){
	let graphPoints = [];
	let labels = [];
	let datasets = {};
	let maxPoints = Math.ceil((endHour - startHour) / options.interval);
	
	// Create datasets based on graphable items
	options.graphableItems.name.forEach(function(name, gii){
		datasets[options.graphableItems.dbkey[gii]] = {
			label: options.graphableItems.full[gii],
			fillColor: "rgba(225,225,225,0)",
			strokeColor: "rgba("+options.graphableItems.colorbyte[gii]+",1)",
			pointColor: "rgba("+options.graphableItems.colorbyte[gii]+",1)",
			pointStrokeColor: "#"+options.graphableItems.colorhex[gii],
			pointHighlightFill: "#"+options.graphableItems.colorhex[gii],
			pointHighlightStroke: "rgba("+options.graphableItems.colorbyte[gii]+",1)",
			data: Array.from('0'.repeat(maxPoints)).map((e)=>{ return parseInt(e); })
		};
	});
	
	// Categorize records into points in the graph (based on interval)
	result.forEach(function(rsc){
		// rsc.date = new Date(rsc.hour * 60 * 60 * 1000);
		let offset = rsc.hour - startHour;
		let graphIndex = Math.floor(offset / options.interval);
		graphPoints[String(graphIndex)] = graphPoints[String(graphIndex)] || [];
		graphPoints[String(graphIndex)].push(rsc);
	});
	
	// Get averages for each point in the graph
	graphPoints.forEach(function(graphPoint, pointIndex){
		options.graphableItems.dbkey.forEach(function(dbkey){
			let valuesInPoint = graphPoint.map((e) => {return e[dbkey]; });
			datasets[dbkey].data[pointIndex] = avg(valuesInPoint);
		});
	});
	
	// Walk through all points in graph and complete data
	let lastExistingData = {};
	Array.from('0'.repeat(maxPoints)).forEach((e, i) => {
		// Fill the label name
		let pointHour = startHour + (options.interval * i);
		let pointDate = new Date(pointHour * 60 * 60 * 1000);
		if (options.interval >= 24) {
			labels[i] = (pointDate.getMonth()+1)+"/"+pointDate.getDate();
		} else {
			labels[i] = pointDate.getHours()+"00h";
		}
		// Check if point values is zero, carry over last known value to this point
		options.graphableItems.dbkey.forEach(function(dbkey){
			if (datasets[dbkey].data[i] === 0) {
				if (lastExistingData[dbkey]) {
					datasets[dbkey].data[i] = lastExistingData[dbkey];
				}
			} else {
				lastExistingData[dbkey] = datasets[dbkey].data[i];
			}
		});
	});
	
	postMessage({ labels: labels, datasets: datasets });
}

const avg = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;