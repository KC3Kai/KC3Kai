/*
TabResources.js
By: dragonjet

Resources tab with jistory graph.
*/

var TabResources = {
	active: false,
	
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
		if(this.active) return false; this.active = true;
		this.hour = Math.floor((new Date()).getTime()/(1*60*60*1000));
		this.zone = Math.floor((new Date()).getTime()/(6*60*60*1000));
		this.day = Math.floor((new Date()).getTime()/(24*60*60*1000));
		
		app.Player.load();
		Chart.defaults.global.scaleBeginAtZero = true;
	},
	
	/* Show the page
	--------------------------------------------*/
	show :function(){
		var self = this;
		
		// Get list of resources for the past 24 hours
		app.Logging.get_resource(this.hour, function(ResourceRecords){
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
		var data = { hours: [], fuel: [], ammo: [], steel: [], baux: [] };
		
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
				data.fuel[graphIndex] = this.data_hour["h"+thisHour].rsc1;
				data.ammo[graphIndex] = this.data_hour["h"+thisHour].rsc2;
				data.steel[graphIndex] = this.data_hour["h"+thisHour].rsc3;
				data.baux[graphIndex] = this.data_hour["h"+thisHour].rsc4;
			}else{
				// Check if its not the first x-axis
				if(graphIndex > 0){
					// Use the values from previous record
					data.fuel[graphIndex] = data.fuel[graphIndex-1];
					data.ammo[graphIndex] = data.ammo[graphIndex-1];
					data.steel[graphIndex] = data.steel[graphIndex-1];
					data.baux[graphIndex] = data.baux[graphIndex-1];
				}else{
					// First x-axis with no record, use zero
					data.fuel[graphIndex] = 0;
					data.ammo[graphIndex] = 0;
					data.steel[graphIndex] = 0;
					data.baux[graphIndex] = 0;
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
		var data = { hours: [], fuel: [], ammo: [], steel: [], baux: [] };
		
		// Loop starting from past 24 hr, per hour, to current
		var graphIndex=0, backZones, thisZone, thisDateObj;
		for(backZones=28; backZones>=0; backZones--){
			thisZone = this.zone-backZones;
			thisDateObj = new Date(thisZone*6*60*60*1000);
			data.hours[graphIndex] = thisDateObj.getDate()+"-"+thisDateObj.getHours()+"h";
			
			// If a resource for this hour exists
			if(typeof this.data_zone["z"+thisZone] != "undefined"){
				data.fuel[graphIndex] = this.data_zone["z"+thisZone].rsc1;
				data.ammo[graphIndex] = this.data_zone["z"+thisZone].rsc2;
				data.steel[graphIndex] = this.data_zone["z"+thisZone].rsc3;
				data.baux[graphIndex] = this.data_zone["z"+thisZone].rsc4;
			}else{
				// Check if its not the first x-axis
				if(graphIndex > 0){
					// Use the values from previous record
					data.fuel[graphIndex] = data.fuel[graphIndex-1];
					data.ammo[graphIndex] = data.ammo[graphIndex-1];
					data.steel[graphIndex] = data.steel[graphIndex-1];
					data.baux[graphIndex] = data.baux[graphIndex-1];
				}else{
					// First x-axis with no record, use zero
					data.fuel[graphIndex] = 0;
					data.ammo[graphIndex] = 0;
					data.steel[graphIndex] = 0;
					data.baux[graphIndex] = 0;
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
		var data = { hours: [], fuel: [], ammo: [], steel: [], baux: [] };
		
		// Loop starting from past 24 hr, per hour, to current
		var graphIndex=0, backDays, thisDay, thisDateObj;
		for(backDays=30; backDays>=0; backDays--){
			thisDay = this.day-backDays;
			thisDateObj = new Date(thisDay*24*60*60*1000);
			data.hours[graphIndex] = thisDateObj.getMonth()+"/"+thisDateObj.getDate();
			
			// If a resource for this hour exists
			if(typeof this.data_day["d"+thisDay] != "undefined"){
				data.fuel[graphIndex] = this.data_day["d"+thisDay].rsc1;
				data.ammo[graphIndex] = this.data_day["d"+thisDay].rsc2;
				data.steel[graphIndex] = this.data_day["d"+thisDay].rsc3;
				data.baux[graphIndex] = this.data_day["d"+thisDay].rsc4;
			}else{
				// Check if its not the first x-axis
				if(graphIndex > 0){
					// Use the values from previous record
					data.fuel[graphIndex] = data.fuel[graphIndex-1];
					data.ammo[graphIndex] = data.ammo[graphIndex-1];
					data.steel[graphIndex] = data.steel[graphIndex-1];
					data.baux[graphIndex] = data.baux[graphIndex-1];
				}else{
					// First x-axis with no record, use zero
					data.fuel[graphIndex] = 0;
					data.ammo[graphIndex] = 0;
					data.steel[graphIndex] = 0;
					data.baux[graphIndex] = 0;
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
				this.dataset("Bauxite", "255,153,51", "FF9933", data.baux),
				this.dataset("Steel", "153,153,153", "999999", data.steel),
				this.dataset("Ammo", "153,153,0", "999900", data.ammo),
				this.dataset("Fuel", "0,153,0", "AAFFAA", data.fuel)
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