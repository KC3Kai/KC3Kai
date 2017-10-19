let window = self;
onmessage = function(request) {
	this.window = self;
	self.window = self;
	importScripts(request.data.url+"assets/js/Dexie.min.js");
	importScripts(request.data.url+"library/modules/Database.js");
	KC3Database.init( request.data.playerId );
	fetchData(request.data);
};

function fetchData(options){
	let startHour = Math.floor((new Date(options.start))/( 1*60*60*1000));
	let endHour = Math.floor((new Date(options.end))/( 1*60*60*1000))+24;
	
	// Start must be higher than end
	if (startHour >= endHour || startHour < 397248 || !startHour || !endHour) {
		postMessage(false);
		return false;
	}
	
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
	
	// Create dataset based on graph-able items
	options.graphableItems.name.forEach(function(name, gii){
		datasets[options.graphableItems.dbkey[gii]] = {
			label: options.graphableItems.full[gii],
			fill: false,
			lineTension: 0.4,
			borderWidth: 1.5,
			borderColor: "#"+options.graphableItems.colorhex[gii],
			pointRadius: 2,
			pointBackgroundColor: "#"+options.graphableItems.colorhex[gii],
			multiKeyBackground: "#"+options.graphableItems.colorhex[gii],
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
			datasets[dbkey].data[pointIndex] = Math.round(avg(valuesInPoint)) || 0;
		});
	});
	
	// Walk through all points in graph and complete data
	let lastExistingData = {};
	let rightToLeftData = {};
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
			// Left to right fill
			if (datasets[dbkey].data[i] === 0) {
				if (lastExistingData[dbkey]) {
					datasets[dbkey].data[i] = lastExistingData[dbkey];
				}
			} else {
				lastExistingData[dbkey] = datasets[dbkey].data[i];
			}
			
			// Right to left fill
			let inverseData = datasets[dbkey].data[(maxPoints-1)-i];
			if (inverseData === 0 || inverseData === null) {
				if (rightToLeftData[dbkey]) {
					datasets[dbkey].data[(maxPoints-1)-i] = rightToLeftData[dbkey];
				}
			} else {
				rightToLeftData[dbkey] = datasets[dbkey].data[(maxPoints-1)-i];
			}
		});
	});
	
	let datasetsValues = Object.keys(datasets).map(key => datasets[key]);
	// Delta mode, only computed after all data is filled above
	if (options.delta && datasetsValues.length > 0) {
		let previous = {};
		datasetsValues[0].data.forEach((e, i) => {
			options.graphableItems.dbkey.forEach(function(dbkey){
				if (previous[dbkey]) {
					let originalValue = datasets[dbkey].data[i];
					datasets[dbkey].data[i] = datasets[dbkey].data[i] - previous[dbkey];
					previous[dbkey] = originalValue;
				} else {
					previous[dbkey] = datasets[dbkey].data[i];
					datasets[dbkey].data[i] = null;
				}
			});
		});
	}
	
	postMessage({ labels: labels, datasets: datasets });
}

const avg = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;