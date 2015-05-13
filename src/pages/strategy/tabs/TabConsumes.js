var TabConsumes = {
	status: {
		active: false,
		error: false,
		message: "",
		check :function(){
			if(this.error){
				app.Strategy.showError( this.message );
				return false;
			}
			return true;
		}
	},
	
	hour: 0,
	zone: 0,
	day: 0,
	
	data_hour: {},
	data_zone: {},
	data_day: {},
	
	ctx :[],
	chart :[],
	
	/* onReady, initialize
	--------------------------------------------*/
	init :function(){
		if(this.status.active) return true;
		
		this.hour = Math.floor((new Date()).getTime()/(1*60*60*1000));
		this.zone = Math.floor((new Date()).getTime()/(6*60*60*1000));
		this.day = Math.floor((new Date()).getTime()/(24*60*60*1000));
		
		app.Player.load();
		Chart.defaults.global.scaleBeginAtZero = true;
		
		this.status.active = true;
	},
	
	/* Show the page
	--------------------------------------------*/
	show :function(){
		if(!this.status.check()) return false;
		
		var self = this;
		
		// Get list of resources for the past 24 hours
		app.Logging.get_useitem(this.hour, function(ResourceRecords){
			// Arrange resources into index
			var ctr;
			for(ctr in ResourceRecords){
				self.data_hour["h"+ ResourceRecords[ctr].hour ] = ResourceRecords[ctr];
				self.data_zone["z"+ Math.floor(ResourceRecords[ctr].hour/6) ] = ResourceRecords[ctr];
				self.data_day["d"+ Math.floor(ResourceRecords[ctr].hour/24) ] = ResourceRecords[ctr];
			}
			
			// Call interface functions
			self.thisWeek();
			self.draw1();
			self.draw2();
			self.draw3();
		});
	},
	
	/* This Week's table
	--------------------------------------------*/
	thisWeek :function(){
		
	},
	
	/* Draw Graph 1
	--------------------------------------------*/
	draw1 :function(){
		// Object for chart drawing parameters
		var data = { hours: [], bucket: [], devmat: [], screw: [], torch: [] };
		
		// Loop starting from past 24 hr, per hour, to current
		var graphIndex=0, backHours, thisHour;
		for(backHours=23; backHours>=0; backHours--){
			thisHour = this.hour-backHours;
			data.hours[graphIndex] = (new Date(thisHour*3600000)).getHours();
			if(data.hours[graphIndex] > 12){
				data.hours[graphIndex]-=12;
				data.hours[graphIndex]+="P";
			}else if(data.hours[graphIndex] == 12){
				data.hours[graphIndex] = "NN";
			}else if(data.hours[graphIndex] >= 1){
				data.hours[graphIndex]+="A";
			}else{
				data.hours[graphIndex] = "MN";
			}
			
			// If a resource for this hour exists
			if(typeof this.data_hour["h"+thisHour] != "undefined"){
				data.bucket[graphIndex] = this.data_hour["h"+thisHour].bucket;
				data.devmat[graphIndex] = this.data_hour["h"+thisHour].devmat;
				data.screw[graphIndex] = this.data_hour["h"+thisHour].screw;
				data.torch[graphIndex] = this.data_hour["h"+thisHour].torch;
			}else{
				// Check if its not the first x-axis
				if(graphIndex > 0){
					// Use the values from previous record
					data.bucket[graphIndex] = data.bucket[graphIndex-1];
					data.devmat[graphIndex] = data.devmat[graphIndex-1];
					data.screw[graphIndex] = data.screw[graphIndex-1];
					data.torch[graphIndex] = data.torch[graphIndex-1];
				}else{
					// First x-axis with no record, use zero
					data.bucket[graphIndex] = 0;
					data.devmat[graphIndex] = 0;
					data.screw[graphIndex] = 0;
					data.torch[graphIndex] = 0;
				}
			}
			graphIndex++;
		}
		
		// Draw graph
		this.ctx[0] = $("#chart1").get(0).getContext("2d");
		this.chart[0] = new Chart( this.ctx[0] ).Line(this.buildGraphData(data), {});
	},
	
	/* Draw Graph 2
	--------------------------------------------*/
	draw2 :function(){
		// Object for chart drawing parameters
		var data = { hours: [], bucket: [], devmat: [], screw: [], torch: [] };
		
		// Loop starting from past 24 hr, per hour, to current
		var graphIndex=0, backZones, thisZone, thisDateObj;
		for(backZones=28; backZones>=0; backZones--){
			thisZone = this.zone-backZones;
			thisDateObj = new Date(thisZone*6*60*60*1000);
			data.hours[graphIndex] = thisDateObj.getDate()+"-"+thisDateObj.getHours()+"h";
			
			// If a resource for this hour exists
			if(typeof this.data_zone["z"+thisZone] != "undefined"){
				data.bucket[graphIndex] = this.data_zone["z"+thisZone].bucket;
				data.devmat[graphIndex] = this.data_zone["z"+thisZone].devmat;
				data.screw[graphIndex] = this.data_zone["z"+thisZone].screw;
				data.torch[graphIndex] = this.data_zone["z"+thisZone].torch;
			}else{
				// Check if its not the first x-axis
				if(graphIndex > 0){
					// Use the values from previous record
					data.bucket[graphIndex] = data.bucket[graphIndex-1];
					data.devmat[graphIndex] = data.devmat[graphIndex-1];
					data.screw[graphIndex] = data.screw[graphIndex-1];
					data.torch[graphIndex] = data.torch[graphIndex-1];
				}else{
					// First x-axis with no record, use zero
					data.bucket[graphIndex] = 0;
					data.devmat[graphIndex] = 0;
					data.screw[graphIndex] = 0;
					data.torch[graphIndex] = 0;
				}
			}
			graphIndex++;
		}
		
		// Draw graph
		this.ctx[1] = $("#chart2").get(0).getContext("2d");
		this.chart[1] = new Chart( this.ctx[1] ).Line(this.buildGraphData(data), {});
	},
	
	/* Draw Graph 3
	--------------------------------------------*/
	draw3 :function(){
		// Object for chart drawing parameters
		var data = { hours: [], bucket: [], devmat: [], screw: [], torch: [] };
		
		// Loop starting from past 24 hr, per hour, to current
		var graphIndex=0, backDays, thisDay, thisDateObj;
		for(backDays=30; backDays>=0; backDays--){
			thisDay = this.day-backDays;
			thisDateObj = new Date(thisDay*24*60*60*1000);
			data.hours[graphIndex] = (thisDateObj.getMonth()+1)+"/"+thisDateObj.getDate();
			
			// If a resource for this hour exists
			if(typeof this.data_day["d"+thisDay] != "undefined"){
				data.bucket[graphIndex] = this.data_day["d"+thisDay].bucket;
				data.devmat[graphIndex] = this.data_day["d"+thisDay].devmat;
				data.screw[graphIndex] = this.data_day["d"+thisDay].screw;
				data.torch[graphIndex] = this.data_day["d"+thisDay].torch;
			}else{
				// Check if its not the first x-axis
				if(graphIndex > 0){
					// Use the values from previous record
					data.bucket[graphIndex] = data.bucket[graphIndex-1];
					data.devmat[graphIndex] = data.devmat[graphIndex-1];
					data.screw[graphIndex] = data.screw[graphIndex-1];
					data.torch[graphIndex] = data.torch[graphIndex-1];
				}else{
					// First x-axis with no record, use zero
					data.bucket[graphIndex] = 0;
					data.devmat[graphIndex] = 0;
					data.screw[graphIndex] = 0;
					data.torch[graphIndex] = 0;
				}
			}
			graphIndex++;
		}
		
		// Draw graph
		this.ctx[2] = $("#chart3").get(0).getContext("2d");
		this.chart[2] = new Chart( this.ctx[2] ).Line(this.buildGraphData(data), {});
	},
	
	/* Util: Build charting parameters
	--------------------------------------------*/
	buildGraphData :function(data){
		return {
			labels: data.hours,
			datasets: [
				this.dataset("Torch", "255,204,102", "FFCC66", data.torch),
				this.dataset("Screw", "204,204,204", "CCCCCC", data.screw),
				this.dataset("DevMat", "0,153,153", "009999", data.devmat),
				this.dataset("Bucket", "0,204,0", "00CC00", data.bucket)
			]
		};
	},
	
	dataset :function(label, color1, color2, dataList){
		return {
			label: label,
			fillColor: "rgba(225,225,225,0)",
			strokeColor: "rgba("+color1+",1)",
			pointColor: "rgba("+color1+",1)",
			pointStrokeColor: "#"+color2,
			pointHighlightFill: "#"+color2,
			pointHighlightStroke: "rgba("+color1+",1)",
			data: dataList
		};
	}
};