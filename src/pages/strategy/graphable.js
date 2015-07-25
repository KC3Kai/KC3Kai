(function(){
	"use strict";
	
	/* KC3 Graphable
			Arguments:
			callable -- database function
			itemData -- object with 4 keys
				name  : consists its short name (aka, variable name)
				dbkey : consists the reference variable name to the database
				full  : written name of the variable (full name)
				colorhex : color in hex notation, (6 characters)
				colorbyte: color in byte notation, (numeric, 0-255)
	*/
	window.KC3Graphable = function (callable,itemData){
		this.tabSelf = KC3StrategyTabs.resources;
		
		this.hour = 0;
		this.zone = 0;
		this.day  = 0;
		
		this.data_hour = {};
		this.data_zone = {};
		this.data_day  = {};
		
		this.ctx   = [];
		this.chart = [];
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		this.init    = function(){
			this.hour  = Math.floor((new Date()).getTime()/( 1*60*60*1000));
			this.zone  = Math.floor((new Date()).getTime()/( 6*60*60*1000));
			this.day   = Math.floor((new Date()).getTime()/(24*60*60*1000));
			Chart.defaults.global.scaleBeginAtZero = true;
		};
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		this.execute = function(){
			var self = this;
			// Get list of resources for the past 24 hours
			callable.call(KC3Database, this.hour, function(ResourceRecords){
				// Arrange resources into index
				var ctr;
				for(ctr in ResourceRecords){
					self.data_hour["h"+ ResourceRecords[ctr].hour ] = ResourceRecords[ctr];
					self.data_zone["z"+ Math.floor(ResourceRecords[ctr].hour/ 6) ] = ResourceRecords[ctr];
					self.data_day ["d"+ Math.floor(ResourceRecords[ctr].hour/24) ] = ResourceRecords[ctr];
				}
				
				// Call interface functions
				self.thisWeek();
				try {
				self.draw(0, 1,"hour",function(x){
					var h = x.getHours();
					if(h%12===0) {
						return ((h === 0) ? 'M':'N') + 'N';
					} else { 
						return (h % 12) + ((h > 12) ? 'P':'A');
					}
				},23);
				self.draw(1, 6,"zone",function(x){return x.getDate()+"-"+x.getHours()+"h";},28);
				self.draw(2,24, "day",function(x){return (x.getMonth()+1)+"/"+x.getDate();},30);
				} catch(e) {console.error(e);}
			});
		};
		
		/* This Week's table
		--------------------------------------------*/
		this.thisWeek = function(){
			
		};
		
		/* Generalized Chart Draw
		 * replaces basic chart draw, and generalizes into a function
		 *
		 * Arguments:
		 * i           - index
		 * hourMult    - offset multiplication
		 * reqKey      - requested key
		 * dataStrFunc - a callable function with one argument (date object),
		 *               returning a string
		 * backtracks  - number of backtracks required to process the chart
		--------------------------------------------*/
		this.draw = function(i,hourMult,reqKey,dateStrFunc,backtracks){
			// Object for chart drawing parameters
			var data = { hours: [] };
				// Dynamically assign the variable name from itemData.name to data
				(itemData.name).forEach(function(k){ data[k] = []; });
			// Create automated variables
			// pref(i)x, pick one letter from key
			// data_key, just prepend the data_ from the key
			var
				prefx   = reqKey.charAt(0),
				dataKey = "data_"+reqKey;
			// Check records beyond the first axis existed or not
			var
				self = this,
				nearest = Object.keys(this[dataKey]).filter(function(x){return x.slice(1)<(self[reqKey]-backtracks);}).pop();
			// Loop starting from past 24 hr, per hour, to current
			var graphIndex=0, thisTime, thisDateObj;
			for(; backtracks>=0; backtracks--){
				thisTime = this[reqKey]-backtracks;
				thisDateObj = new Date(thisTime*hourMult*60*60*1000);
				data.hours[graphIndex] = dateStrFunc(thisDateObj);
				// If a resource for this hour exists
				var j;
				if(typeof this[dataKey][prefx+thisTime] != "undefined") {
					for(j=0;j<(Object.keys(itemData.name).length);j++) {
						data[itemData.name[j]][graphIndex] = this[dataKey][prefx+thisTime][itemData.dbkey[j]];
					}
				} else {
					for(j=0;j<(Object.keys(itemData.name).length);j++) {
						// Check if its not the first x-axis
						if(graphIndex > 0) {
							// Use the values from previous record
								data[itemData.name[j]][graphIndex] = data[itemData.name[j]][graphIndex-1];
						} else {
							// First x-axis with no record, use zero :: if there's no data beyond the axis
								data[itemData.name[j]][graphIndex] = (nearest!==undefined) ? this[dataKey][nearest][itemData.dbkey[j]] : 0;
						}
					}
				}
				graphIndex++;
			}
			
			// Draw graph
			this.ctx[i] = $("#chart" + (i+1)).get(0).getContext("2d");
			this.chart[i] = new Chart( this.ctx[i] ).Line(this.buildGraphData(data), {});
		};
		
		/* Util: Build charting parameters
		--------------------------------------------*/
		this.dataset = function(label, color1, color2, dataList){
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
		};
		
		this.buildGraphData = function(data){
			var self = this;
			return {
				labels: data.hours,
				datasets: Array.apply(null,{length:Object.keys(itemData.name).length}).map(function(c,i){
					return self.dataset(itemData.full[i], itemData.colorbyte[i], itemData.colorhex[i], data[itemData.name[i]]);
				}).reverse(),
			};
		};
		
	};
	
})();